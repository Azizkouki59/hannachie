import { z } from "zod";
import { sanitizeSingleLine, sanitizeText } from "../utils/sanitize.ts";

// ── Isolate-scoped sliding-window rate limiter for POST /api/repair-request ──
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 15;
const rateLimitStore = new Map<string, number[]>();

function getClientIp(request: Request): string {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp && cfIp.trim().length > 0) {
    return cfIp.trim();
  }
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;

  if (rateLimitStore.size > 1000) {
    for (const [key, timestamps] of rateLimitStore.entries()) {
      const active = timestamps.filter((t) => t > cutoff);
      if (active.length === 0) {
        rateLimitStore.delete(key);
      } else {
        rateLimitStore.set(key, active);
      }
    }
  }

  const recent = (rateLimitStore.get(ip) || []).filter((ts) => ts > cutoff);
  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    rateLimitStore.set(ip, recent);
    return true;
  }
  recent.push(now);
  rateLimitStore.set(ip, recent);
  return false;
}

function generateReferenceId(): string {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  const code = 1000 + (bytes[0] % 9000);
  return `HN-${code}`;
}

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
    visitType: z.enum(["home_visit", "workshop"]).default("home_visit"),
    device: z.string().trim().min(1).max(120),
    customDevice: z.string().trim().max(120).optional().default(""),
    brand: z.string().trim().max(120).optional().default(""),
    model: z.string().trim().max(120).optional().default(""),
    problem: z.string().trim().min(4).max(1500),
    urgency: z.enum(["normal", "express", "notfall"]).default("normal"),
    callbackTime: z.string().trim().max(120).optional().default("Jederzeit erreichbar"),
    zip: z.string().trim().max(80).optional().default(""),
    streetAddress: z.string().trim().max(200).optional().default(""),
    mapsLocationUrl: z.string().trim().max(500).optional().default(""),
    locationVerified: z.boolean().optional().default(false),
    coordinates: coordinatesSchema,
    name: z.string().trim().max(120).optional().default(""),
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
    website: z.string().max(200).optional().default(""),
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
    if (val.visitType === "home_visit" && val.zip.trim().length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["zip"],
        message: "Bitte wählen Sie Ihren Einsatzort in Osnabrück & Umgebung.",
      });
    }
  });

export const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "microphone=(), payment=(), usb=(), interest-cohort=()",
  "X-XSS-Protection": "0",
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' https://maps.googleapis.com https://maps.gstatic.com https://apis.google.com https://accounts.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://hannachi.de https://maps.gstatic.com https://maps.googleapis.com https://*.ggpht.com https://*.googleusercontent.com",
    "connect-src 'self' https://nominatim.openstreetmap.org https://maps.googleapis.com https://places.googleapis.com https://*.googleapis.com https://maps.gstatic.com https://accounts.google.com",
    "worker-src 'self' blob:",
    "frame-src https://maps.google.com https://www.google.com https://accounts.google.com https://*.firebaseapp.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://wa.me https://api.whatsapp.com",
  ].join("; "),
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...SECURITY_HEADERS,
    },
  });
}

export async function handleApiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname === "/api/health" && request.method === "GET") {
    return jsonResponse(
      {
        ok: true,
        service: "hannachi-web",
        timestamp: new Date().toISOString(),
      },
      200
    );
  }

  if (pathname === "/api/repair-request" && request.method === "POST") {
    const clientIp = getClientIp(request);
    if (isRateLimited(clientIp)) {
      return jsonResponse(
        {
          ok: false,
          error:
            "Zu viele Anfragen in kurzer Zeit. Bitte warten Sie einen Moment oder rufen Sie uns direkt an.",
        },
        429
      );
    }

    const contentLength = Number(request.headers.get("content-length") || "0");
    if (contentLength > 64 * 1024) {
      return jsonResponse({ ok: false, error: "Anfrage zu groß." }, 413);
    }

    let rawText = "";
    try {
      rawText = await request.text();
    } catch {
      return jsonResponse({ ok: false, error: "Ungültige JSON-Anfrage." }, 400);
    }

    if (rawText.length > 64 * 1024) {
      return jsonResponse({ ok: false, error: "Anfrage zu groß." }, 413);
    }

    let rawBody: unknown;
    try {
      rawBody = JSON.parse(rawText);
    } catch {
      return jsonResponse({ ok: false, error: "Ungültige JSON-Anfrage." }, 400);
    }

    if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
      return jsonResponse({ ok: false, error: "Ungültiges Anfrageformat." }, 400);
    }

    const bodyRecord = rawBody as Record<string, unknown>;

    if (typeof bodyRecord.website === "string" && bodyRecord.website.trim().length > 0) {
      return jsonResponse(
        {
          ok: true,
          referenceId: "HN-0000",
          receivedAt: new Date().toISOString(),
        },
        200
      );
    }

    const sanitizedInput = {
      inquiryMode: bodyRecord.inquiryMode === "question" ? "question" : "repair",
      visitType: bodyRecord.visitType === "workshop" ? "workshop" : "home_visit",
      device: sanitizeSingleLine(bodyRecord.device, 120),
      customDevice: sanitizeSingleLine(bodyRecord.customDevice, 120),
      brand: sanitizeSingleLine(bodyRecord.brand, 120),
      model: sanitizeSingleLine(bodyRecord.model, 120),
      problem: sanitizeText(bodyRecord.problem, 1500, true),
      urgency:
        bodyRecord.urgency === "express" || bodyRecord.urgency === "notfall"
          ? bodyRecord.urgency
          : "normal",
      callbackTime:
        sanitizeSingleLine(bodyRecord.callbackTime, 120) || "Jederzeit erreichbar",
      zip: sanitizeSingleLine(bodyRecord.zip, 80),
      streetAddress: sanitizeSingleLine(bodyRecord.streetAddress, 200),
      mapsLocationUrl: sanitizeSingleLine(bodyRecord.mapsLocationUrl, 500),
      locationVerified: Boolean(bodyRecord.locationVerified),
      coordinates:
        bodyRecord.coordinates && typeof bodyRecord.coordinates === "object"
          ? bodyRecord.coordinates
          : null,
      name: sanitizeSingleLine(bodyRecord.name, 120),
      phone: sanitizeSingleLine(bodyRecord.phone, 30),
      email: sanitizeSingleLine(bodyRecord.email, 160),
      photoName:
        typeof bodyRecord.photoName === "string"
          ? sanitizeSingleLine(bodyRecord.photoName, 180)
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
      return jsonResponse(
        {
          ok: false,
          error: "Bitte überprüfen Sie Ihre Pflichtangaben.",
          fieldErrors,
        },
        400
      );
    }

    return jsonResponse(
      {
        ok: true,
        referenceId: generateReferenceId(),
        receivedAt: new Date().toISOString(),
        summary: {
          inquiryMode: parsed.data.inquiryMode,
          visitType: parsed.data.visitType,
          device: parsed.data.customDevice || parsed.data.device,
          brand: parsed.data.brand,
          urgency: parsed.data.urgency,
          zip: parsed.data.zip,
        },
      },
      201
    );
  }

  return jsonResponse({ ok: false, error: "API endpoint not found" }, 404);
}
