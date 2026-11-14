import express, { type NextFunction, type Request, type Response } from "express";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { sanitizeSingleLine, sanitizeText } from "./src/utils/sanitize.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProd = process.env.NODE_ENV === "production";
const PORT = Number(process.env.PORT) || 3000;
const DIST_DIR = path.resolve(__dirname, "dist");

// ── In-memory sliding-window rate limiter for POST /api/repair-request ──────────
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 15;
const rateLimitStore = new Map<string, number[]>();

const cleanupTimer = setInterval(() => {
  const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
  for (const [ip, timestamps] of rateLimitStore.entries()) {
    const valid = timestamps.filter((t) => t > cutoff);
    if (valid.length === 0) {
      rateLimitStore.delete(ip);
    } else {
      rateLimitStore.set(ip, valid);
    }
  }
}, 5 * 60 * 1000);
cleanupTimer.unref?.();

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const recent = (rateLimitStore.get(ip) || []).filter((ts) => ts > cutoff);
  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    rateLimitStore.set(ip, recent);
    return true;
  }
  recent.push(now);
  rateLimitStore.set(ip, recent);
  return false;
}

// ── Server-side Zod schema for repair & question intake ──────────────────────
const coordinatesSchema = z
  .object({
    lat: z.number().finite().min(-90).max(90),
    lng: z.number().finite().min(-180).max(180),
    accuracy: z.number().finite().min(0).max(50000).optional(),
  })
  .nullable()
  .optional();

const repairIntakeSchema = z
  .object({
    inquiryMode: z.enum(["repair", "question"]).default("repair"),
    device: z.string().trim().min(1).max(120),
    customDevice: z.string().trim().max(120).optional().default(""),
    brand: z.string().trim().min(1).max(120),
    model: z.string().trim().max(120).optional().default(""),
    problem: z.string().trim().min(4).max(1500),
    urgency: z.enum(["normal", "express", "notfall"]).default("normal"),
    callbackTime: z.string().trim().max(120).optional().default("Jederzeit erreichbar"),
    zip: z.string().trim().min(3).max(80),
    streetAddress: z.string().trim().max(200).optional().default(""),
    mapsLocationUrl: z.string().trim().max(500).optional().default(""),
    locationVerified: z.boolean().optional().default(false),
    coordinates: coordinatesSchema,
    name: z.string().trim().min(2).max(120),
    phone: z
      .string()
      .trim()
      .min(6)
      .max(30)
      .refine(
        (val) => /^[+()\d\s/-]{6,30}$/.test(val) && val.replace(/\D/g, "").length >= 6,
        "Ungültige Telefonnummer"
      ),
    email: z
      .string()
      .trim()
      .max(160)
      .optional()
      .default("")
      .refine(
        (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val),
        "Ungültige E-Mail-Adresse"
      ),
    photoName: z.string().trim().max(180).nullable().optional().default(null),
    website: z.string().max(200).optional().default(""), // Anti-spam honeypot field
  })
  .superRefine((val, ctx) => {
    if (
      (val.device.includes("Anderes") || val.device === "Sonstiges") &&
      val.customDevice.trim().length < 2
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customDevice"],
        message: "Bitte nennen Sie kurz Ihr Gerät.",
      });
    }
  });

function applySecurityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), payment=(), usb=(), interest-cohort=()"
  );
  res.setHeader("X-XSS-Protection", "0");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");

  if (isProd) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  const scriptSrc = isProd
    ? "script-src 'self'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";
  const connectSrc = isProd
    ? "connect-src 'self' https://nominatim.openstreetmap.org"
    : "connect-src 'self' ws: wss: https://nominatim.openstreetmap.org";

  // Tailored CSP allowing self-hosted assets/fonts, Google Maps embeds (only when consented on client),
  // OpenStreetMap reverse geocoding on explicit click, and WhatsApp handoff form/links.
  // Intentionally avoids frame-ancestors 'none' so iframe-based studio previews work reliably.
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "img-src 'self' data: blob: https://hannachi.de",
      connectSrc,
      "frame-src https://maps.google.com https://www.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://wa.me",
    ].join("; ")
  );

  next();
}

async function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(applySecurityHeaders);
  app.use(express.json({ limit: "64kb" }));

  // Malformed JSON error guard
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (
      err &&
      typeof err === "object" &&
      "status" in err &&
      (err as { status?: number }).status === 400
    ) {
      res.status(400).json({ ok: false, error: "Ungültige JSON-Anfrage." });
      return;
    }
    next(err);
  });

  // ── Health check endpoint ──────────────────────────────────────────────────
  app.get("/api/health", (_req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({
      ok: true,
      service: "hannachi-web",
      timestamp: new Date().toISOString(),
    });
  });

  // ── Validated Repair & Question Intake Endpoint ────────────────────────────
  app.post("/api/repair-request", (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");

    const clientIp = getClientIp(req);
    if (isRateLimited(clientIp)) {
      res.status(429).json({
        ok: false,
        error:
          "Zu viele Anfragen in kurzer Zeit. Bitte warten Sie einen Moment oder rufen Sie uns direkt an.",
      });
      return;
    }

    const rawBody = req.body as Record<string, unknown> | undefined;
    if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
      res.status(400).json({ ok: false, error: "Ungültiges Anfrageformat." });
      return;
    }

    // Honeypot check: silently accept bot submissions without processing
    if (typeof rawBody.website === "string" && rawBody.website.trim().length > 0) {
      res.status(200).json({
        ok: true,
        referenceId: "HN-0000",
        receivedAt: new Date().toISOString(),
      });
      return;
    }

    const sanitizedInput = {
      inquiryMode: rawBody.inquiryMode === "question" ? "question" : "repair",
      device: sanitizeSingleLine(rawBody.device, 120),
      customDevice: sanitizeSingleLine(rawBody.customDevice, 120),
      brand: sanitizeSingleLine(rawBody.brand, 120),
      model: sanitizeSingleLine(rawBody.model, 120),
      problem: sanitizeText(rawBody.problem, 1500, true),
      urgency:
        rawBody.urgency === "express" || rawBody.urgency === "notfall"
          ? rawBody.urgency
          : "normal",
      callbackTime: sanitizeSingleLine(rawBody.callbackTime, 120) || "Jederzeit erreichbar",
      zip: sanitizeSingleLine(rawBody.zip, 80),
      streetAddress: sanitizeSingleLine(rawBody.streetAddress, 200),
      mapsLocationUrl: sanitizeSingleLine(rawBody.mapsLocationUrl, 500),
      locationVerified: Boolean(rawBody.locationVerified),
      coordinates:
        rawBody.coordinates && typeof rawBody.coordinates === "object"
          ? rawBody.coordinates
          : null,
      name: sanitizeSingleLine(rawBody.name, 120),
      phone: sanitizeSingleLine(rawBody.phone, 30),
      email: sanitizeSingleLine(rawBody.email, 160),
      photoName:
        typeof rawBody.photoName === "string"
          ? sanitizeSingleLine(rawBody.photoName, 180)
          : null,
      website: "",
    };

    const parsed = repairIntakeSchema.safeParse(sanitizedInput);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] || "form");
        if (!fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      res.status(400).json({
        ok: false,
        error: "Bitte überprüfen Sie Ihre Pflichtangaben.",
        fieldErrors,
      });
      return;
    }

    const referenceId = `HN-${crypto.randomInt(1000, 10000)}`;
    const receivedAt = new Date().toISOString();

    res.status(201).json({
      ok: true,
      referenceId,
      receivedAt,
      summary: {
        inquiryMode: parsed.data.inquiryMode,
        device: parsed.data.customDevice || parsed.data.device,
        brand: parsed.data.brand,
        urgency: parsed.data.urgency,
        zip: parsed.data.zip,
      },
    });
  });

  // Return JSON 404 for unknown /api/* routes
  app.use("/api", (_req: Request, res: Response) => {
    res.status(404).json({ ok: false, error: "API endpoint not found" });
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve hashed build assets with immutable cache
    app.use(
      "/assets",
      express.static(path.join(DIST_DIR, "assets"), {
        maxAge: "1y",
        immutable: true,
        fallthrough: false,
      })
    );
    app.use(
      "/fonts",
      express.static(path.join(DIST_DIR, "fonts"), {
        maxAge: "30d",
        immutable: true,
        fallthrough: false,
      })
    );
    app.use(
      "/images",
      express.static(path.join(DIST_DIR, "images"), {
        maxAge: "7d",
        fallthrough: false,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith(".avif")) {
            res.setHeader("Content-Type", "image/avif");
          } else if (filePath.endsWith(".webp")) {
            res.setHeader("Content-Type", "image/webp");
          }
        },
      })
    );
    app.use(
      express.static(DIST_DIR, {
        maxAge: "1d",
        index: false,
      })
    );

    // SPA fallback for client routes (Express 4 wildcard)
    app.get("*", (req: Request, res: Response) => {
      if (/\.[a-z0-9]{2,6}$/i.test(req.path)) {
        res.status(404).type("text/plain").send("Not found");
        return;
      }
      const indexFile = path.join(DIST_DIR, "index.html");
      if (!fs.existsSync(indexFile)) {
        res.status(503).type("text/plain").send("Application build not found.");
        return;
      }
      res.setHeader("Cache-Control", "no-cache");
      res.sendFile(indexFile);
    });
  }

  // Final catch-all error handler (no stack traces leaked)
  app.use((_err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (res.headersSent) return;
    res.status(500).json({
      ok: false,
      error: "Ein interner Serverfehler ist aufgetreten.",
    });
  });

  return app;
}

createApp()
  .then((app) => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `Hannachi server running in ${isProd ? "production" : "development"} mode on http://0.0.0.0:${PORT}`
      );
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
