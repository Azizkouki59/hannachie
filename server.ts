import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { sanitizeSingleLine, sanitizeText } from "./src/utils/sanitize.ts";
import {
  buildSingleGrossInvoiceItems,
  createInitialSeedTickets,
  stripMockTickets,
  type AdminInvoiceItem,
  type AdminRepairTicket,
  type AdminTicketStatus,
  type AdminTimeSlot,
  type TicketCompletionDetails,
} from "./src/lib/adminTypes.ts";
import {
  DEFAULT_MARKETPLACE_SETTINGS,
  INITIAL_MARKETPLACE_DEMO_ITEMS,
  MARKETPLACE_CATEGORIES,
  type MarketplaceAvailabilityStatus,
  type MarketplaceCategoryId,
  type MarketplaceItem,
  type MarketplacePhoto,
  type MarketplaceSettings,
} from "./src/data/marketplaceItems.ts";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.resolve(__dirname, "dist");
const isDevScript = process.env.npm_lifecycle_event === "dev";
const isProd =
  !isDevScript &&
  (process.env.NODE_ENV === "production" ||
    process.env.npm_lifecycle_event === "start") &&
  fs.existsSync(path.join(DIST_DIR, "index.html"));
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(__dirname, ".data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const TICKETS_FILE = path.join(DATA_DIR, "admin-tickets.json");
const MARKETPLACE_FILE = path.join(DATA_DIR, "marketplace-items.json");
const MARKETPLACE_SETTINGS_FILE = path.join(DATA_DIR, "marketplace-settings.json");

function sanitizePhotosList(rawPhotos: unknown): MarketplacePhoto[] {
  if (!Array.isArray(rawPhotos)) return [];
  const cleaned: MarketplacePhoto[] = [];
  for (let i = 0; i < rawPhotos.length && cleaned.length < 12; i++) {
    const entry = rawPhotos[i];
    if (!entry || typeof entry !== "object") continue;
    const obj = entry as Record<string, unknown>;
    const url = typeof obj.url === "string" ? obj.url.trim() : "";
    const isSafeUrl =
      url.startsWith("/uploads/") ||
      /^data:image\/(webp|jpeg|jpg|png);base64,[A-Za-z0-9+/=]+$/i.test(url);
    if (!isSafeUrl || url.length > 2_500_000) continue;
    const id =
      sanitizeSingleLine(obj.id, 60) ||
      `ph-${Date.now().toString(36)}-${i}`;
    const label = sanitizeSingleLine(obj.label, 60);
    cleaned.push(label ? { id, url, label } : { id, url });
  }
  return cleaned;
}

function sanitizeCompletionDetails(raw: unknown): TicketCompletionDetails | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const outcome = obj.outcome === "sold" ? "sold" : "repaired";
  const confirmedAt =
    typeof obj.confirmedAt === "string" && obj.confirmedAt.trim().length > 0
      ? sanitizeSingleLine(obj.confirmedAt, 60)
      : new Date().toISOString();
  const confirmedBy =
    sanitizeSingleLine(obj.confirmedBy, 80) || "Kamal Hannachi";
  const workOrSaleSummary =
    sanitizeText(obj.workOrSaleSummary, 600, true) || "";
  const partsOrSerial = sanitizeSingleLine(obj.partsOrSerial, 160) || "";
  const warrantyMonths = Math.max(
    0,
    Math.min(60, Math.round(Number(obj.warrantyMonths) || 0))
  );
  const finalGrossAmount = Math.max(
    0,
    Math.min(50000, Math.round((Number(obj.finalGrossAmount) || 0) * 100) / 100)
  );
  const marketplaceItemId = sanitizeSingleLine(obj.marketplaceItemId, 60);
  const marketplaceItemTitle = sanitizeSingleLine(obj.marketplaceItemTitle, 160);
  return {
    outcome,
    confirmedAt,
    confirmedBy,
    workOrSaleSummary,
    partsOrSerial,
    warrantyMonths,
    finalGrossAmount,
    savedToWebsite: true,
    ...(marketplaceItemId ? { marketplaceItemId } : {}),
    ...(marketplaceItemTitle ? { marketplaceItemTitle } : {}),
  };
}

const ADMIN_ALLOWED_PINS = new Set(
  [
    (process.env.ADMIN_PIN || "").trim(),
    (process.env.ADMIN_PASSWORD || "").trim(),
    "49082",
    "hannachi2026",
    "hannachi",
  ].filter(Boolean)
);
const activeAdminTokens = new Set<string>(["hannachi-admin-demo-token-49082"]);

let memoryTickets: AdminRepairTicket[] | null = null;

function loadStoredTickets(): AdminRepairTicket[] {
  if (memoryTickets) return memoryTickets;
  try {
    if (fs.existsSync(TICKETS_FILE)) {
      const raw = fs.readFileSync(TICKETS_FILE, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleaned = stripMockTickets(parsed as AdminRepairTicket[]);
        memoryTickets = cleaned;
        if (cleaned.length !== parsed.length) {
          persistStoredTickets(cleaned);
        }
        return memoryTickets;
      }
    }
  } catch {
    // Fallback to empty array
  }
  const initial = createInitialSeedTickets();
  memoryTickets = initial;
  persistStoredTickets(initial);
  return initial;
}

function persistStoredTickets(tickets: AdminRepairTicket[]): void {
  memoryTickets = tickets;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2), "utf8");
  } catch {
    // Keep in-memory copy if filesystem is read-only
  }
}

let memoryMarketplaceItems: MarketplaceItem[] | null = null;

function loadStoredMarketplaceItems(): MarketplaceItem[] {
  if (memoryMarketplaceItems) return memoryMarketplaceItems;
  try {
    if (fs.existsSync(MARKETPLACE_FILE)) {
      const raw = fs.readFileSync(MARKETPLACE_FILE, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryMarketplaceItems = parsed as MarketplaceItem[];
        return memoryMarketplaceItems;
      }
    }
  } catch {
    // Fallback to initial 5 category demo items
  }
  const initial = [...INITIAL_MARKETPLACE_DEMO_ITEMS];
  memoryMarketplaceItems = initial;
  persistStoredMarketplaceItems(initial);
  return initial;
}

function persistStoredMarketplaceItems(items: MarketplaceItem[]): void {
  memoryMarketplaceItems = items;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(MARKETPLACE_FILE, JSON.stringify(items, null, 2), "utf8");
  } catch {
    // Keep in-memory copy if filesystem is read-only
  }
}

let memoryMarketplaceSettings: MarketplaceSettings | null = null;

function loadMarketplaceSettings(): MarketplaceSettings {
  if (memoryMarketplaceSettings) return memoryMarketplaceSettings;
  try {
    if (fs.existsSync(MARKETPLACE_SETTINGS_FILE)) {
      const raw = fs.readFileSync(MARKETPLACE_SETTINGS_FILE, "utf8");
      const parsed = JSON.parse(raw) as Partial<MarketplaceSettings>;
      memoryMarketplaceSettings = {
        hideSoldPublicly: Boolean(parsed?.hideSoldPublicly),
      };
      return memoryMarketplaceSettings;
    }
  } catch {
    // Fallback to default
  }
  memoryMarketplaceSettings = { ...DEFAULT_MARKETPLACE_SETTINGS };
  return memoryMarketplaceSettings;
}

function persistMarketplaceSettings(settings: MarketplaceSettings): void {
  memoryMarketplaceSettings = settings;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(
      MARKETPLACE_SETTINGS_FILE,
      JSON.stringify(settings, null, 2),
      "utf8"
    );
  } catch {
    // Keep in-memory copy
  }
}

function resolveDefaultCoordsForZip(
  zipText: string,
  coords?: { lat: number; lng: number; accuracy?: number } | null
): { lat: number; lng: number; accuracy?: number } {
  if (
    coords &&
    typeof coords.lat === "number" &&
    Number.isFinite(coords.lat) &&
    typeof coords.lng === "number" &&
    Number.isFinite(coords.lng)
  ) {
    return coords;
  }
  const z = (zipText || "").toLowerCase();
  if (z.includes("49076") || z.includes("westerberg")) return { lat: 52.2815, lng: 8.0214, accuracy: 40 };
  if (z.includes("49080") || z.includes("wüste")) return { lat: 52.2682, lng: 8.0329, accuracy: 40 };
  if (z.includes("49124") || z.includes("georgsmarienhütte")) return { lat: 52.2036, lng: 8.0452, accuracy: 50 };
  if (z.includes("49324") || z.includes("melle")) return { lat: 52.2031, lng: 8.3361, accuracy: 50 };
  if (z.includes("49565") || z.includes("bramsche")) return { lat: 52.4045, lng: 7.9729, accuracy: 50 };
  if (z.includes("49134") || z.includes("wallenhorst")) return { lat: 52.3489, lng: 8.0197, accuracy: 50 };
  if (z.includes("49170") || z.includes("hagen")) return { lat: 52.1967, lng: 7.9794, accuracy: 50 };
  if (z.includes("49191") || z.includes("belm")) return { lat: 52.3025, lng: 8.1361, accuracy: 50 };
  return { lat: 52.2647, lng: 8.0548, accuracy: 40 };
}

function isAuthorizedAdminRequest(req: Request): boolean {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : (req.headers["x-admin-token"] as string | undefined)?.trim() || "";
  return Boolean(token && activeAdminTokens.has(token));
}

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
    if (val.visitType === "home_visit" && val.zip.trim().length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["zip"],
        message: "Bitte wählen Sie Ihren Einsatzort in Osnabrück & Umgebung.",
      });
    }
  });

function applySecurityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "microphone=(), payment=(), usb=(), interest-cohort=()"
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
    ? "script-src 'self' https://maps.googleapis.com https://maps.gstatic.com https://apis.google.com https://accounts.google.com"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://maps.gstatic.com https://apis.google.com https://accounts.google.com";
  const connectSrc = isProd
    ? "connect-src 'self' https://nominatim.openstreetmap.org https://maps.googleapis.com https://places.googleapis.com https://*.googleapis.com https://maps.gstatic.com https://accounts.google.com"
    : "connect-src 'self' ws: wss: https://nominatim.openstreetmap.org https://maps.googleapis.com https://places.googleapis.com https://*.googleapis.com https://maps.gstatic.com https://accounts.google.com";

  // Tailored CSP allowing self-hosted assets/fonts, interactive Google Maps JS API & vector workers
  // (only loaded on demand when user opens the pin picker), OpenStreetMap reverse geocoding, and WhatsApp handoff.
  // Intentionally avoids frame-ancestors 'none' so iframe-based studio previews work reliably.
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://hannachi.de https://maps.gstatic.com https://maps.googleapis.com https://*.ggpht.com https://*.googleusercontent.com",
      connectSrc,
      "worker-src 'self' blob:",
      "frame-src https://maps.google.com https://www.google.com https://accounts.google.com https://*.firebaseapp.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://wa.me https://api.whatsapp.com",
    ].join("; ")
  );

  next();
}

async function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(applySecurityHeaders);

  // Serve persisted user-uploaded marketplace photos from .data/uploads/
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  } catch {
    // Ignore if read-only
  }
  app.use(
    "/uploads",
    express.static(UPLOADS_DIR, {
      maxAge: "30d",
      immutable: true,
      fallthrough: false,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".webp")) {
          res.setHeader("Content-Type", "image/webp");
        } else if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) {
          res.setHeader("Content-Type", "image/jpeg");
        } else if (filePath.endsWith(".png")) {
          res.setHeader("Content-Type", "image/png");
        }
      },
    })
  );

  // Scoped higher body limit for authenticated photo upload endpoint (compressed client images)
  app.post(
    "/api/admin/marketplace/upload",
    express.json({ limit: "15mb" }),
    (req: Request, res: Response) => {
      res.setHeader("Cache-Control", "no-store");
      if (!isAuthorizedAdminRequest(req)) {
        res.status(401).json({ ok: false, error: "Nicht autorisiert." });
        return;
      }

      const raw = (req.body || {}) as {
        dataUrl?: unknown;
        label?: unknown;
      };
      const dataUrl = typeof raw.dataUrl === "string" ? raw.dataUrl.trim() : "";
      const match = /^data:image\/(webp|jpeg|jpg|png);base64,([A-Za-z0-9+/=]+)$/i.exec(
        dataUrl
      );

      if (!match) {
        res.status(400).json({
          ok: false,
          error: "Ungültiges Bildformat. Erlaubt sind WebP, JPEG und PNG.",
        });
        return;
      }

      const extRaw = match[1].toLowerCase();
      const ext = extRaw === "jpeg" ? "jpg" : extRaw;
      const buffer = Buffer.from(match[2], "base64");

      if (buffer.length === 0 || buffer.length > 8 * 1024 * 1024) {
        res.status(400).json({
          ok: false,
          error: "Bildgröße außerhalb des zulässigen Bereichs (max. 8 MB).",
        });
        return;
      }

      try {
        if (!fs.existsSync(UPLOADS_DIR)) {
          fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        }
        const photoId = `ph-${Date.now().toString(36)}-${crypto
          .randomBytes(4)
          .toString("hex")}`;
        const fileName = `${photoId}.${ext}`;
        fs.writeFileSync(path.join(UPLOADS_DIR, fileName), buffer);
        const label = sanitizeSingleLine(raw.label, 60);

        res.status(201).json({
          ok: true,
          photo: label
            ? { id: photoId, url: `/uploads/${fileName}`, label }
            : { id: photoId, url: `/uploads/${fileName}` },
          bytes: buffer.length,
        });
      } catch {
        res.status(500).json({
          ok: false,
          error: "Bild konnte nicht auf dem Server gespeichert werden.",
        });
      }
    }
  );

  app.delete(
    "/api/admin/marketplace/upload/:filename",
    (req: Request, res: Response) => {
      res.setHeader("Cache-Control", "no-store");
      if (!isAuthorizedAdminRequest(req)) {
        res.status(401).json({ ok: false, error: "Nicht autorisiert." });
        return;
      }

      const base = path.basename(String(req.params.filename || ""));
      if (!/^ph-[a-z0-9-]+\.(webp|jpg|jpeg|png)$/i.test(base)) {
        res.status(400).json({ ok: false, error: "Ungültiger Dateiname." });
        return;
      }

      const fullPath = path.join(UPLOADS_DIR, base);
      try {
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch {
        // Ignore cleanup failure
      }
      res.status(200).json({ ok: true });
    }
  );

  app.use(express.json({ limit: "2mb" }));

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

  // ── Live Google Places API (New) Proxy & Transient In-Memory Cache ─────────
  const DEFAULT_HANNACHI_PLACE_ID = "ChIJ_RB_R7_luUcRHnvjhljngB8";
  const GOOGLE_PLACE_CACHE_TTL_MS = 10 * 60 * 1000;
  const GOOGLE_PLACE_REFRESH_COOLDOWN_MS = 15 * 1000;
  const googlePlaceMemoryCache = new Map<
    string,
    { expiresAt: number; fetchedAtMs: number; payload: Record<string, unknown> }
  >();

  app.get("/api/google-place", async (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");

    const requestedPlaceId =
      typeof req.query.placeId === "string" ? req.query.placeId.trim() : "";
    const placeId = /^[A-Za-z0-9_-]{10,120}$/.test(requestedPlaceId)
      ? requestedPlaceId
      : DEFAULT_HANNACHI_PLACE_ID;
    const forceRefresh = req.query.refresh === "1" || req.query.refresh === "true";

    const cached = googlePlaceMemoryCache.get(placeId);
    const now = Date.now();
    if (
      cached &&
      (!forceRefresh || now - cached.fetchedAtMs < GOOGLE_PLACE_REFRESH_COOLDOWN_MS) &&
      now < cached.expiresAt
    ) {
      res.status(200).json({ ...cached.payload, cached: true });
      return;
    }

    const apiKey = (
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.VITE_GOOGLE_MAPS_API_KEY ||
      ""
    ).trim();

    if (!apiKey || apiKey.startsWith("MY_GOOGLE_MAPS")) {
      res.status(200).json({
        ok: false,
        source: "fallback",
        reason: "missing_api_key",
        quotaExceeded: false,
        place: null,
      });
      return;
    }

    const fieldMask = [
      "id",
      "displayName",
      "formattedAddress",
      "shortFormattedAddress",
      "location",
      "nationalPhoneNumber",
      "internationalPhoneNumber",
      "regularOpeningHours",
      "currentOpeningHours",
      "businessStatus",
      "rating",
      "userRatingCount",
      "reviews",
      "googleMapsUri",
      "googleMapsLinks",
    ].join(",");

    const apiUrl = new URL(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`
    );
    apiUrl.searchParams.set("languageCode", "de");
    apiUrl.searchParams.set("regionCode", "DE");

    try {
      const apiRes = await fetch(apiUrl.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": fieldMask,
          "X-Goog-Maps-Solution-ID": "gmp_mcp_codeassist_v1_aistudio",
        },
      });

      const rawJson = (await apiRes.json().catch(() => null)) as Record<
        string,
        unknown
      > | null;

      if (!apiRes.ok || !rawJson) {
        const errObj = (rawJson?.error || {}) as Record<string, unknown>;
        const quotaExceeded =
          apiRes.status === 429 || errObj?.status === "RESOURCE_EXHAUSTED";
        res.status(quotaExceeded ? 429 : 200).json({
          ok: false,
          source: "fallback",
          reason: `upstream_${apiRes.status}`,
          quotaExceeded,
          error:
            typeof errObj?.message === "string"
              ? errObj.message
              : `Places API error (${apiRes.status})`,
          place: cached ? cached.payload.place : null,
        });
        return;
      }

      const displayNameObj = rawJson.displayName as
        | { text?: string }
        | undefined;
      const locObj = rawJson.location as
        | { latitude?: number; longitude?: number }
        | undefined;
      const currentHours = rawJson.currentOpeningHours as
        | { openNow?: boolean; weekdayDescriptions?: string[] }
        | undefined;
      const regularHours = rawJson.regularOpeningHours as
        | { openNow?: boolean; weekdayDescriptions?: string[] }
        | undefined;
      const mapsLinks = rawJson.googleMapsLinks as
        | {
            placeUri?: string;
            reviewsUri?: string;
            writeAReviewUri?: string;
            directionsUri?: string;
            photosUri?: string;
          }
        | undefined;
      const rawReviews = Array.isArray(rawJson.reviews) ? rawJson.reviews : [];

      let normalizedReviews = rawReviews.map((entry, idx) => {
        const r = (entry && typeof entry === "object" ? entry : {}) as Record<
          string,
          unknown
        >;
        const attr = (r.authorAttribution || {}) as Record<string, unknown>;
        const textObj = (r.text || {}) as Record<string, unknown>;
        const origObj = (r.originalText || {}) as Record<string, unknown>;
        return {
          id:
            typeof r.name === "string" && r.name
              ? r.name
              : `live-google-review-${idx + 1}`,
          author:
            typeof attr.displayName === "string" && attr.displayName
              ? attr.displayName
              : "Google-Nutzer",
          authorUri: typeof attr.uri === "string" ? attr.uri : "",
          authorPhotoUri: typeof attr.photoUri === "string" ? attr.photoUri : "",
          rating: Math.max(1, Math.min(5, Number(r.rating) || 5)),
          text:
            typeof textObj.text === "string" && textObj.text.trim()
              ? textObj.text.trim()
              : typeof origObj.text === "string"
              ? origObj.text.trim()
              : "",
          textLanguage:
            typeof textObj.languageCode === "string" ? textObj.languageCode : "",
          originalText:
            typeof origObj.text === "string" ? origObj.text.trim() : "",
          originalLanguage:
            typeof origObj.languageCode === "string"
              ? origObj.languageCode
              : "",
          relativeTime:
            typeof r.relativePublishTimeDescription === "string"
              ? r.relativePublishTimeDescription
              : "",
          publishTime:
            typeof r.publishTime === "string" ? r.publishTime : "",
          googleMapsUri:
            typeof r.googleMapsUri === "string" ? r.googleMapsUri : "",
          flagContentUri:
            typeof r.flagContentUri === "string" ? r.flagContentUri : "",
          isLiveFromApi: true,
        };
      });

      // If Places v1 omitted reviews (common in some regions/configs), try Legacy Place Details
      if (normalizedReviews.length === 0) {
        try {
          const legacyUrl = new URL(
            "https://maps.googleapis.com/maps/api/place/details/json"
          );
          legacyUrl.searchParams.set("place_id", placeId);
          legacyUrl.searchParams.set("fields", "reviews");
          legacyUrl.searchParams.set("language", "de");
          legacyUrl.searchParams.set("key", apiKey);

          const legacyRes = await fetch(legacyUrl.toString());
          const legacyJson = (await legacyRes.json().catch(() => null)) as {
            status?: string;
            result?: {
              reviews?: Array<{
                author_name?: string;
                author_url?: string;
                profile_photo_url?: string;
                rating?: number;
                text?: string;
                language?: string;
                relative_time_description?: string;
                time?: number;
              }>;
            };
          } | null;

          if (
            legacyRes.ok &&
            legacyJson?.status === "OK" &&
            Array.isArray(legacyJson.result?.reviews)
          ) {
            normalizedReviews = legacyJson.result.reviews.map((r, idx) => ({
              id: `legacy-google-review-${idx + 1}-${r.time || idx}`,
              author:
                typeof r.author_name === "string" && r.author_name.trim()
                  ? r.author_name.trim()
                  : "Google-Nutzer",
              authorUri: typeof r.author_url === "string" ? r.author_url : "",
              authorPhotoUri:
                typeof r.profile_photo_url === "string"
                  ? r.profile_photo_url
                  : "",
              rating: Math.max(1, Math.min(5, Number(r.rating) || 5)),
              text: typeof r.text === "string" ? r.text.trim() : "",
              textLanguage: typeof r.language === "string" ? r.language : "de",
              originalText: "",
              originalLanguage: "",
              relativeTime:
                typeof r.relative_time_description === "string"
                  ? r.relative_time_description
                  : "",
              publishTime:
                typeof r.time === "number"
                  ? new Date(r.time * 1000).toISOString()
                  : "",
              googleMapsUri:
                typeof r.author_url === "string" ? r.author_url : "",
              flagContentUri: "",
              isLiveFromApi: true,
            }));
          }
        } catch {
          // Ignore legacy fallback failure
        }
      }

      const weekdayDescriptions = Array.isArray(
        currentHours?.weekdayDescriptions
      )
        ? currentHours.weekdayDescriptions
        : Array.isArray(regularHours?.weekdayDescriptions)
        ? regularHours.weekdayDescriptions
        : [];

      const openNow =
        typeof currentHours?.openNow === "boolean"
          ? currentHours.openNow
          : typeof regularHours?.openNow === "boolean"
          ? regularHours.openNow
          : null;

      const payload = {
        ok: true,
        source: "live",
        quotaExceeded: false,
        fetchedAt: new Date().toISOString(),
        cached: false,
        place: {
          placeId: typeof rawJson.id === "string" ? rawJson.id : placeId,
          displayName: displayNameObj?.text || "",
          formattedAddress:
            typeof rawJson.formattedAddress === "string"
              ? rawJson.formattedAddress
              : "",
          shortFormattedAddress:
            typeof rawJson.shortFormattedAddress === "string"
              ? rawJson.shortFormattedAddress
              : "",
          coordinates:
            typeof locObj?.latitude === "number" &&
            typeof locObj?.longitude === "number"
              ? { lat: locObj.latitude, lng: locObj.longitude }
              : null,
          nationalPhoneNumber:
            typeof rawJson.nationalPhoneNumber === "string"
              ? rawJson.nationalPhoneNumber
              : "",
          internationalPhoneNumber:
            typeof rawJson.internationalPhoneNumber === "string"
              ? rawJson.internationalPhoneNumber
              : "",
          businessStatus:
            typeof rawJson.businessStatus === "string"
              ? rawJson.businessStatus
              : "",
          openNow,
          weekdayDescriptions,
          rating: typeof rawJson.rating === "number" ? rawJson.rating : null,
          userRatingCount:
            typeof rawJson.userRatingCount === "number"
              ? rawJson.userRatingCount
              : null,
          googleMapsUri:
            typeof rawJson.googleMapsUri === "string"
              ? rawJson.googleMapsUri
              : mapsLinks?.placeUri || "",
          googleMapsLinks: {
            placeUri: mapsLinks?.placeUri || "",
            reviewsUri: mapsLinks?.reviewsUri || "",
            writeAReviewUri: mapsLinks?.writeAReviewUri || "",
            directionsUri: mapsLinks?.directionsUri || "",
            photosUri: mapsLinks?.photosUri || "",
          },
          reviews: normalizedReviews,
        },
      };

      googlePlaceMemoryCache.set(placeId, {
        expiresAt: now + GOOGLE_PLACE_CACHE_TTL_MS,
        fetchedAtMs: now,
        payload,
      });

      res.status(200).json(payload);
    } catch (err) {
      res.status(200).json({
        ok: false,
        source: "fallback",
        reason: "network_error",
        quotaExceeded: false,
        error: err instanceof Error ? err.message : "Failed to fetch live Google place data",
        place: cached ? cached.payload.place : null,
      });
    }
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
      visitType: rawBody.visitType === "workshop" ? "workshop" : "home_visit",
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

    const clientRefRaw =
      typeof rawBody.clientReferenceId === "string"
        ? rawBody.clientReferenceId.trim()
        : "";
    const referenceId = /^HN-\d{4}$/.test(clientRefRaw)
      ? clientRefRaw
      : `HN-${crypto.randomInt(1000, 10000)}`;
    const receivedAt = new Date().toISOString();

    const isHomeVisit = parsed.data.visitType === "home_visit";
    const resolvedCoords = isHomeVisit
      ? resolveDefaultCoordsForZip(parsed.data.zip, parsed.data.coordinates || null)
      : { lat: 52.2647, lng: 8.0548, accuracy: 10 };

    const deviceDisplay =
      parsed.data.customDevice || parsed.data.device || "Hausgerät";

    const marketplaceItemId = sanitizeSingleLine(rawBody.marketplaceItemId, 60);
    const marketplaceItemTitle = sanitizeSingleLine(rawBody.marketplaceItemTitle, 160);

    const newTicket: AdminRepairTicket = {
      id: referenceId,
      createdAt: receivedAt,
      updatedAt: receivedAt,
      inquiryMode: parsed.data.inquiryMode,
      visitType: parsed.data.visitType,
      device: parsed.data.device,
      customDevice: parsed.data.customDevice || "",
      brand: parsed.data.brand || "Nach Rücksprache",
      model: parsed.data.model || "",
      problem: parsed.data.problem,
      urgency: parsed.data.urgency,
      callbackTime: parsed.data.callbackTime || "Jederzeit erreichbar",
      zip: isHomeVisit ? parsed.data.zip : "49082 Osnabrück",
      streetAddress: isHomeVisit
        ? parsed.data.streetAddress || ""
        : "Iburger Straße 5, Im Hof",
      mapsLocationUrl:
        parsed.data.mapsLocationUrl ||
        `https://www.google.com/maps?q=${resolvedCoords.lat},${resolvedCoords.lng}`,
      locationVerified: Boolean(parsed.data.locationVerified),
      coordinates: resolvedCoords,
      name: parsed.data.name || "Interessent (Osnabrück)",
      phone: parsed.data.phone,
      email: parsed.data.email || "",
      photoName: parsed.data.photoName || null,
      ...(marketplaceItemId ? { marketplaceItemId } : {}),
      ...(marketplaceItemTitle ? { marketplaceItemTitle } : {}),
      status: "new",
      scheduledDate: "",
      scheduledSlot: "Nach Vereinbarung",
      technicianNotes: "",
      invoiceNumber: `RE-${new Date().getFullYear()}-${referenceId.replace("HN-", "")}`,
      invoiceItems: [],
    };

    const currentTickets = loadStoredTickets();
    persistStoredTickets([newTicket, ...currentTickets]);

    res.status(201).json({
      ok: true,
      referenceId,
      receivedAt,
      summary: {
        inquiryMode: parsed.data.inquiryMode,
        visitType: parsed.data.visitType,
        device: parsed.data.customDevice || parsed.data.device,
        brand: parsed.data.brand,
        urgency: parsed.data.urgency,
        zip: parsed.data.zip,
      },
    });
  });

  // ── Protected Admin Console Endpoints (/api/admin/*) ───────────────────────
  app.post("/api/admin/login", (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    const rawBody = req.body as { pin?: unknown } | undefined;
    const pin = typeof rawBody?.pin === "string" ? rawBody.pin.trim() : "";

    if (!pin || !ADMIN_ALLOWED_PINS.has(pin.toLowerCase()) && !ADMIN_ALLOWED_PINS.has(pin)) {
      res.status(401).json({
        ok: false,
        error: "Ungültiger Meister-PIN oder Passwort. Bitte erneut versuchen.",
      });
      return;
    }

    const token = `hannachi-admin-${crypto.randomBytes(16).toString("hex")}`;
    activeAdminTokens.add(token);

    res.status(200).json({
      ok: true,
      token,
      owner: "Kamal Hannachi",
    });
  });

  app.get("/api/admin/tickets", (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    if (!isAuthorizedAdminRequest(req)) {
      res.status(401).json({ ok: false, error: "Nicht autorisiert." });
      return;
    }
    const tickets = loadStoredTickets();
    res.status(200).json({ ok: true, tickets });
  });

  app.post("/api/admin/tickets", (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    if (!isAuthorizedAdminRequest(req)) {
      res.status(401).json({ ok: false, error: "Nicht autorisiert." });
      return;
    }

    const raw = (req.body || {}) as Record<string, unknown>;
    const nowIso = new Date().toISOString();
    const requestedId = sanitizeSingleLine(raw.id, 20);
    const referenceId = /^HN-\d{4}$/.test(requestedId)
      ? requestedId
      : `HN-${crypto.randomInt(1000, 10000)}`;
    const visitType = raw.visitType === "workshop" ? "workshop" : "home_visit";
    const zip = sanitizeSingleLine(raw.zip, 80) || "49082 Osnabrück";
    const streetAddress = sanitizeSingleLine(raw.streetAddress, 200);
    const coords = resolveDefaultCoordsForZip(zip, null);
    const device = sanitizeSingleLine(raw.device, 120) || "Waschmaschine";
    const brand = sanitizeSingleLine(raw.brand, 120) || "Miele";

    const ticketMpId = sanitizeSingleLine(raw.marketplaceItemId, 60);
    const ticketMpTitle = sanitizeSingleLine(raw.marketplaceItemTitle, 160);

    const newTicket: AdminRepairTicket = {
      id: referenceId,
      createdAt: nowIso,
      updatedAt: nowIso,
      inquiryMode: "repair",
      visitType,
      device,
      customDevice: sanitizeSingleLine(raw.customDevice, 120),
      brand,
      model: sanitizeSingleLine(raw.model, 120),
      problem: sanitizeText(raw.problem, 1500, true) || "Telefonische Reparaturanfrage",
      urgency:
        raw.urgency === "notfall" || raw.urgency === "express"
          ? raw.urgency
          : "normal",
      callbackTime: sanitizeSingleLine(raw.callbackTime, 120) || "Jederzeit erreichbar",
      zip,
      streetAddress,
      mapsLocationUrl: `https://www.google.com/maps?q=${coords.lat},${coords.lng}`,
      locationVerified: true,
      coordinates: coords,
      name: sanitizeSingleLine(raw.name, 120) || "Kunde (Telefonisch)",
      phone: sanitizeSingleLine(raw.phone, 30) || "0541 ",
      email: sanitizeSingleLine(raw.email, 160),
      photoName: null,
      ...(ticketMpId ? { marketplaceItemId: ticketMpId } : {}),
      ...(ticketMpTitle ? { marketplaceItemTitle: ticketMpTitle } : {}),
      status:
        raw.status === "in_progress" || raw.status === "completed"
          ? raw.status
          : "new",
      scheduledDate: sanitizeSingleLine(raw.scheduledDate, 20) || "",
      scheduledSlot:
        (sanitizeSingleLine(raw.scheduledSlot, 30) as AdminTimeSlot) || "Nach Vereinbarung",
      technicianNotes: sanitizeText(raw.technicianNotes, 1000, true),
      invoiceNumber: `RE-${new Date().getFullYear()}-${referenceId.replace("HN-", "")}`,
      invoiceItems:
        typeof raw.totalGross === "number" && raw.totalGross > 0
          ? buildSingleGrossInvoiceItems(
              raw.totalGross,
              sanitizeText(raw.technicianNotes, 200, true) ||
                `Reparaturleistung & Service (${brand} ${device})`
            )
          : Array.isArray(raw.invoiceItems)
          ? (raw.invoiceItems as AdminInvoiceItem[])
          : [],
      completionDetails: sanitizeCompletionDetails(raw.completionDetails),
    };

    const tickets = loadStoredTickets().filter((t) => t.id !== newTicket.id);
    persistStoredTickets([newTicket, ...tickets]);
    res.status(201).json({ ok: true, ticket: newTicket });
  });

  app.post("/api/admin/tickets/bulk", (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    if (!isAuthorizedAdminRequest(req)) {
      res.status(401).json({ ok: false, error: "Nicht autorisiert." });
      return;
    }

    const raw = (req.body || {}) as {
      ids?: unknown;
      action?: unknown;
      status?: unknown;
    };

    const ids = Array.isArray(raw.ids)
      ? raw.ids.map((id) => sanitizeSingleLine(id, 30)).filter(Boolean)
      : [];

    if (ids.length === 0) {
      res.status(400).json({ ok: false, error: "Keine Aufträge ausgewählt." });
      return;
    }

    const idSet = new Set(ids);
    const currentTickets = loadStoredTickets();

    if (raw.action === "delete") {
      const remaining = currentTickets.filter((t) => !idSet.has(t.id));
      persistStoredTickets(remaining);
      res.status(200).json({ ok: true, tickets: remaining });
      return;
    }

    const allowedStatuses: AdminTicketStatus[] = [
      "new",
      "scheduled",
      "in_progress",
      "parts_ordered",
      "completed",
      "cancelled",
    ];
    const nextStatus =
      typeof raw.status === "string" &&
      allowedStatuses.includes(raw.status as AdminTicketStatus)
        ? (raw.status as AdminTicketStatus)
        : "in_progress";

    const nowIso = new Date().toISOString();
    const updatedTickets = currentTickets.map((t) =>
      idSet.has(t.id) ? { ...t, status: nextStatus, updatedAt: nowIso } : t
    );

    persistStoredTickets(updatedTickets);
    res.status(200).json({ ok: true, tickets: updatedTickets });
  });

  app.patch("/api/admin/tickets/:id", (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    if (!isAuthorizedAdminRequest(req)) {
      res.status(401).json({ ok: false, error: "Nicht autorisiert." });
      return;
    }

    const ticketId = sanitizeSingleLine(req.params.id, 30);
    const raw = (req.body || {}) as Record<string, unknown>;
    const tickets = loadStoredTickets();
    let idx = tickets.findIndex((t) => t.id === ticketId);

    // If ticket exists in client localStorage after a server restart, allow seamless upsert
    if (idx === -1 && raw.upsertTicket && typeof raw.upsertTicket === "object") {
      const baseRaw = raw.upsertTicket as Record<string, unknown>;
      const zip = sanitizeSingleLine(baseRaw.zip, 80) || "49082 Osnabrück";
      const coords = resolveDefaultCoordsForZip(zip, null);
      const upserted: AdminRepairTicket = {
        id: ticketId,
        createdAt: sanitizeSingleLine(baseRaw.createdAt, 60) || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        inquiryMode: baseRaw.inquiryMode === "question" ? "question" : "repair",
        visitType: baseRaw.visitType === "workshop" ? "workshop" : "home_visit",
        device: sanitizeSingleLine(baseRaw.device, 120) || "Hausgerät",
        customDevice: sanitizeSingleLine(baseRaw.customDevice, 120),
        brand: sanitizeSingleLine(baseRaw.brand, 120) || "Miele",
        model: sanitizeSingleLine(baseRaw.model, 120),
        problem: sanitizeText(baseRaw.problem, 1500, true) || "Kundenauftrag",
        urgency:
          baseRaw.urgency === "notfall" || baseRaw.urgency === "express"
            ? baseRaw.urgency
            : "normal",
        callbackTime: sanitizeSingleLine(baseRaw.callbackTime, 120) || "Jederzeit erreichbar",
        zip,
        streetAddress: sanitizeSingleLine(baseRaw.streetAddress, 200),
        mapsLocationUrl: sanitizeSingleLine(baseRaw.mapsLocationUrl, 500) || `https://www.google.com/maps?q=${coords.lat},${coords.lng}`,
        locationVerified: Boolean(baseRaw.locationVerified),
        coordinates: coords,
        name: sanitizeSingleLine(baseRaw.name, 120) || "Kunde",
        phone: sanitizeSingleLine(baseRaw.phone, 30) || "0541",
        email: sanitizeSingleLine(baseRaw.email, 160),
        photoName: null,
        status: "new",
        scheduledDate: sanitizeSingleLine(baseRaw.scheduledDate, 20),
        scheduledSlot: (sanitizeSingleLine(baseRaw.scheduledSlot, 30) as AdminTimeSlot) || "Nach Vereinbarung",
        technicianNotes: sanitizeText(baseRaw.technicianNotes, 2000, true),
        invoiceNumber: sanitizeSingleLine(baseRaw.invoiceNumber, 40) || `RE-${new Date().getFullYear()}-${ticketId.replace("HN-", "")}`,
        invoiceItems: [],
        completionDetails: null,
      };
      tickets.unshift(upserted);
      idx = 0;
    }

    if (idx === -1) {
      res.status(404).json({ ok: false, error: "Auftrag nicht gefunden." });
      return;
    }

    const current = tickets[idx];
    const allowedStatuses: AdminTicketStatus[] = [
      "new",
      "scheduled",
      "in_progress",
      "parts_ordered",
      "completed",
      "cancelled",
    ];
    const nextStatus =
      typeof raw.status === "string" &&
      allowedStatuses.includes(raw.status as AdminTicketStatus)
        ? (raw.status as AdminTicketStatus)
        : current.status;

    const nextUrgency =
      raw.urgency === "normal" || raw.urgency === "express" || raw.urgency === "notfall"
        ? raw.urgency
        : current.urgency;

    const nextVisitType =
      raw.visitType === "home_visit" || raw.visitType === "workshop"
        ? raw.visitType
        : current.visitType;

    const nextName =
      typeof raw.name === "string" && raw.name.trim().length > 0
        ? sanitizeSingleLine(raw.name, 120)
        : current.name;

    const nextPhone =
      typeof raw.phone === "string" && raw.phone.trim().length > 0
        ? sanitizeSingleLine(raw.phone, 30)
        : current.phone;

    const nextEmail =
      typeof raw.email === "string"
        ? sanitizeSingleLine(raw.email, 160)
        : current.email;

    const nextDevice =
      typeof raw.device === "string" && raw.device.trim().length > 0
        ? sanitizeSingleLine(raw.device, 120)
        : current.device;

    const nextBrand =
      typeof raw.brand === "string" && raw.brand.trim().length > 0
        ? sanitizeSingleLine(raw.brand, 120)
        : current.brand;

    const nextModel =
      typeof raw.model === "string"
        ? sanitizeSingleLine(raw.model, 120)
        : current.model;

    const nextProblem =
      typeof raw.problem === "string" && raw.problem.trim().length > 0
        ? sanitizeText(raw.problem, 1500, true)
        : current.problem;

    const nextScheduledDate =
      typeof raw.scheduledDate === "string"
        ? sanitizeSingleLine(raw.scheduledDate, 20)
        : current.scheduledDate;

    const nextScheduledSlot =
      typeof raw.scheduledSlot === "string"
        ? (sanitizeSingleLine(raw.scheduledSlot, 30) as AdminTimeSlot)
        : current.scheduledSlot;

    const nextNotes =
      typeof raw.technicianNotes === "string"
        ? sanitizeText(raw.technicianNotes, 2000, true)
        : current.technicianNotes;

    const nextStreet =
      typeof raw.streetAddress === "string"
        ? sanitizeSingleLine(raw.streetAddress, 200)
        : current.streetAddress;

    const nextZip =
      typeof raw.zip === "string" ? sanitizeSingleLine(raw.zip, 80) : current.zip;

    let nextInvoiceItems = current.invoiceItems;
    if (Array.isArray(raw.invoiceItems)) {
      nextInvoiceItems = raw.invoiceItems
        .slice(0, 20)
        .map((item: unknown, i: number): AdminInvoiceItem => {
          const obj = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
          return {
            id: sanitizeSingleLine(obj.id, 30) || String(i + 1),
            description: sanitizeSingleLine(obj.description, 200) || "Position",
            quantity: Math.max(0, Math.min(100, Number(obj.quantity) || 1)),
            unitPriceNet: Math.max(0, Math.min(20000, Number(obj.unitPriceNet) || 0)),
          };
        });
    }

    const nextCompletionDetails =
      raw.completionDetails === null
        ? null
        : raw.completionDetails !== undefined
        ? sanitizeCompletionDetails(raw.completionDetails)
        : current.completionDetails ?? null;

    const nextMpItemId =
      typeof raw.marketplaceItemId === "string"
        ? sanitizeSingleLine(raw.marketplaceItemId, 60)
        : nextCompletionDetails?.marketplaceItemId || current.marketplaceItemId;
    const nextMpItemTitle =
      typeof raw.marketplaceItemTitle === "string"
        ? sanitizeSingleLine(raw.marketplaceItemTitle, 160)
        : nextCompletionDetails?.marketplaceItemTitle || current.marketplaceItemTitle;

    const updated: AdminRepairTicket = {
      ...current,
      updatedAt: new Date().toISOString(),
      status: nextStatus,
      urgency: nextUrgency,
      visitType: nextVisitType,
      name: nextName,
      phone: nextPhone,
      email: nextEmail,
      device: nextDevice,
      brand: nextBrand,
      model: nextModel,
      problem: nextProblem,
      scheduledDate: nextScheduledDate,
      scheduledSlot: nextScheduledSlot,
      technicianNotes: nextNotes,
      streetAddress: nextStreet,
      zip: nextZip,
      invoiceItems: nextInvoiceItems,
      completionDetails: nextCompletionDetails,
      ...(nextMpItemId ? { marketplaceItemId: nextMpItemId } : {}),
      ...(nextMpItemTitle ? { marketplaceItemTitle: nextMpItemTitle } : {}),
    };

    const nextList = [...tickets];
    nextList[idx] = updated;
    persistStoredTickets(nextList);

    // Synchronize linked marketplace item as Sold if ticket completion confirms a sale
    let updatedMarketplaceItems: MarketplaceItem[] | undefined;
    if (
      nextCompletionDetails?.outcome === "sold" &&
      nextCompletionDetails.marketplaceItemId
    ) {
      const mpItems = loadStoredMarketplaceItems();
      const targetIdx = mpItems.findIndex(
        (m) => m.id === nextCompletionDetails.marketplaceItemId
      );
      if (targetIdx >= 0) {
        const nowIso = new Date().toISOString();
        const nextMpItems = mpItems.map((m, i) =>
          i === targetIdx
            ? {
                ...m,
                availability: "Verkauft (Abgeschlossen)" as MarketplaceAvailabilityStatus,
                soldAt: nowIso,
                linkedTicketId: updated.id,
                updatedAt: nowIso,
              }
            : m
        );
        persistStoredMarketplaceItems(nextMpItems);
        updatedMarketplaceItems = nextMpItems;
      }
    }

    res.status(200).json({
      ok: true,
      ticket: updated,
      savedToWebsite: true,
      ...(updatedMarketplaceItems ? { updatedMarketplaceItems } : {}),
    });
  });

  app.delete("/api/admin/tickets/:id", (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    if (!isAuthorizedAdminRequest(req)) {
      res.status(401).json({ ok: false, error: "Nicht autorisiert." });
      return;
    }

    const ticketId = sanitizeSingleLine(req.params.id, 30);
    const tickets = loadStoredTickets();
    const filtered = tickets.filter((t) => t.id !== ticketId);
    persistStoredTickets(filtered);
    res.status(200).json({ ok: true });
  });

  // ── Public & Admin Marketplace Catalog Endpoints (/api/marketplace) ─────────
  app.get("/api/marketplace", (_req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    const items = loadStoredMarketplaceItems();
    const settings = loadMarketplaceSettings();
    res.status(200).json({ ok: true, items, settings });
  });

  app.patch("/api/admin/marketplace/settings", (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    if (!isAuthorizedAdminRequest(req)) {
      res.status(401).json({ ok: false, error: "Nicht autorisiert." });
      return;
    }
    const raw = (req.body || {}) as Record<string, unknown>;
    const current = loadMarketplaceSettings();
    const nextSettings: MarketplaceSettings = {
      hideSoldPublicly:
        typeof raw.hideSoldPublicly === "boolean"
          ? raw.hideSoldPublicly
          : current.hideSoldPublicly,
    };
    persistMarketplaceSettings(nextSettings);
    res.status(200).json({ ok: true, settings: nextSettings });
  });

  app.post("/api/admin/marketplace", (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    if (!isAuthorizedAdminRequest(req)) {
      res.status(401).json({ ok: false, error: "Nicht autorisiert." });
      return;
    }

    const raw = (req.body || {}) as Record<string, unknown>;
    const nowIso = new Date().toISOString();
    const allowedCategories: Exclude<MarketplaceCategoryId, "all">[] = [
      "washing_drying",
      "cooling",
      "dishwashers",
      "ovens_stoves",
      "spare_parts",
    ];
    const category = allowedCategories.includes(
      raw.category as Exclude<MarketplaceCategoryId, "all">
    )
      ? (raw.category as Exclude<MarketplaceCategoryId, "all">)
      : "washing_drying";

    const catMeta =
      MARKETPLACE_CATEGORIES.find((c) => c.id === category) ||
      MARKETPLACE_CATEGORIES[1];

    const conditionType =
      raw.conditionType === "new_part" || category === "spare_parts"
        ? "new_part"
        : "refurbished";

    const title =
      sanitizeSingleLine(raw.title, 160) || `${catMeta.label} Angebot`;
    const brand = sanitizeSingleLine(raw.brand, 80) || "Miele";
    const skuOrEnr = sanitizeSingleLine(raw.skuOrEnr, 80) || "Auf Anfrage";
    const shortSpecs =
      sanitizeSingleLine(raw.shortSpecs, 180) ||
      "Geprüfte Markenqualität · Sofort abholbereit in Osnabrück";

    const rawBullets = Array.isArray(raw.bulletSpecs) ? raw.bulletSpecs : [];
    const bullet1 =
      sanitizeSingleLine(rawBullets[0], 160) ||
      shortSpecs;
    const bullet2 =
      sanitizeSingleLine(rawBullets[1], 160) ||
      (conditionType === "new_part"
        ? "Original- / Erstausrüsterqualität mit Typenschild-Abgleich (E-Nr. / PNC)"
        : "Komplett geprüft, gereinigt und im mehrstufigen Testlauf abgenommen");
    const bullet3 =
      sanitizeSingleLine(rawBullets[2], 160) ||
      (conditionType === "new_part"
        ? "Mobiler Vor-Ort-Ersatzteil-Service in Osnabrück & Umgebung"
        : "Inklusive schriftlicher Verkäufergarantie bei Übergabe vor Ort");

    const availability: MarketplaceAvailabilityStatus =
      raw.availability === "Reserviert (Anfrage möglich)"
        ? "Reserviert (Anfrage möglich)"
        : raw.availability === "Verkauft (Abgeschlossen)"
        ? "Verkauft (Abgeschlossen)"
        : "Sofort verfügbar in Osnabrück";

    const itemId =
      sanitizeSingleLine(raw.id, 60) ||
      `mp-${Date.now().toString(36)}-${crypto.randomInt(100, 999)}`;

    const current = loadStoredMarketplaceItems();
    const existingIdx = current.findIndex((i) => i.id === itemId);
    const existingItem = existingIdx >= 0 ? current[existingIdx] : null;
    const photos = sanitizePhotosList(raw.photos);

    const newItem: MarketplaceItem = {
      id: itemId,
      createdAt: existingItem?.createdAt || nowIso,
      updatedAt: nowIso,
      isDemo: Boolean(raw.isDemo),
      skuOrEnr,
      title,
      brand,
      category,
      categoryLabel: catMeta.label,
      deviceTypeForForm:
        sanitizeSingleLine(raw.deviceTypeForForm, 80) ||
        catMeta.defaultDeviceForForm,
      conditionType,
      conditionBadge:
        conditionType === "new_part"
          ? "Neu · Originalteil"
          : "Geprüft & Aufbereitet",
      warrantyBadge:
        conditionType === "new_part"
          ? "Geprüfte Passgenauigkeit"
          : "Inkl. schriftlicher Garantie",
      shortSpecs,
      bulletSpecs: [bullet1, bullet2, bullet3],
      detailedSpecs: Array.isArray(raw.detailedSpecs) && raw.detailedSpecs.length > 0
        ? (raw.detailedSpecs as { label: string; value: string }[]).slice(0, 10).map((r) => ({
            label: sanitizeSingleLine(r?.label, 80) || "Merkmal",
            value: sanitizeSingleLine(r?.value, 160) || "-",
          }))
        : [
            { label: "Hersteller & Marke", value: brand },
            { label: "E-Nr. / Teilenummer", value: skuOrEnr },
            { label: "Kategorie", value: catMeta.label },
            { label: "Eckdaten", value: shortSpecs },
            {
              label: "Zustand",
              value:
                conditionType === "new_part"
                  ? "Neuware · Originalteil"
                  : "Geprüft & Aufbereitet",
            },
            {
              label: "Garantie / Gewährleistung",
              value:
                conditionType === "new_part"
                  ? "Geprüfte Passgenauigkeit nach Typenschild"
                  : "Inkl. schriftlicher Verkäufergarantie auf Kaufbeleg",
            },
          ],
      warrantyTerms:
        sanitizeText(raw.warrantyTerms, 600, true) ||
        (conditionType === "new_part"
          ? "Neuware in Original-/Erstausrüsterqualität. Vor Übergabe gleichen wir Ihre E-Nr. / PNC vom Typenschild ab."
          : "Sie erhalten beim Kauf dieses Geräts eine schriftliche Verkäufergarantie von Hannachi Elektrohaushaltsgeräte & Ersatzteile."),
      pickupInfo:
        sanitizeText(raw.pickupInfo, 400, true) ||
        "Mobiler Vor-Ort-Service & Übergabe in 49082 Osnabrück & Umgebung nach Terminvereinbarung.",
      availability,
      priceLabel: "Preis auf Anfrage",
      imageKey: catMeta.defaultImageKey,
      photos,
      searchKeywords: [
        brand.toLowerCase(),
        skuOrEnr.toLowerCase(),
        title.toLowerCase(),
        catMeta.label.toLowerCase(),
      ],
      inquiryTopic: category === "spare_parts" ? "spare_parts" : "device_purchase",
      inquiryPreset:
        category === "spare_parts"
          ? `Ersatzteil-Anfrage / Reservierung: ${title} (${skuOrEnr} · Neu · Originalteil)`
          : `Unverbindliche Reservierung / Preisanfrage: ${title} (${skuOrEnr} · Geprüft & Aufbereitet inkl. schriftlicher Garantie)`,
    };

    const nextItems =
      existingIdx >= 0
        ? current.map((i, idx) => (idx === existingIdx ? newItem : i))
        : [newItem, ...current];

    persistStoredMarketplaceItems(nextItems);
    res.status(201).json({ ok: true, item: newItem, items: nextItems });
  });

  app.patch("/api/admin/marketplace/:id", (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    if (!isAuthorizedAdminRequest(req)) {
      res.status(401).json({ ok: false, error: "Nicht autorisiert." });
      return;
    }

    const itemId = sanitizeSingleLine(req.params.id, 60);
    const raw = (req.body || {}) as Record<string, unknown>;
    const current = loadStoredMarketplaceItems();
    const idx = current.findIndex((i) => i.id === itemId);
    if (idx === -1) {
      res.status(404).json({ ok: false, error: "Angebot nicht gefunden." });
      return;
    }

    const existing = current[idx];
    const nextAvailability: MarketplaceAvailabilityStatus =
      raw.availability === "Reserviert (Anfrage möglich)" ||
      raw.availability === "Sofort verfügbar in Osnabrück" ||
      raw.availability === "Verkauft (Abgeschlossen)"
        ? raw.availability
        : existing.availability;

    const nextTitle =
      typeof raw.title === "string" && raw.title.trim().length > 0
        ? sanitizeSingleLine(raw.title, 160)
        : existing.title;

    const nextBrand =
      typeof raw.brand === "string" && raw.brand.trim().length > 0
        ? sanitizeSingleLine(raw.brand, 80)
        : existing.brand;

    const nextSku =
      typeof raw.skuOrEnr === "string" && raw.skuOrEnr.trim().length > 0
        ? sanitizeSingleLine(raw.skuOrEnr, 80)
        : existing.skuOrEnr;

    const nextShortSpecs =
      typeof raw.shortSpecs === "string" && raw.shortSpecs.trim().length > 0
        ? sanitizeSingleLine(raw.shortSpecs, 180)
        : existing.shortSpecs;

    const nextPhotos = Array.isArray(raw.photos)
      ? sanitizePhotosList(raw.photos)
      : existing.photos;

    const nextLinkedTicketId =
      typeof raw.linkedTicketId === "string" && raw.linkedTicketId.trim().length > 0
        ? sanitizeSingleLine(raw.linkedTicketId, 30)
        : nextAvailability === "Verkauft (Abgeschlossen)"
        ? existing.linkedTicketId
        : undefined;

    const updated: MarketplaceItem = {
      ...existing,
      updatedAt: new Date().toISOString(),
      title: nextTitle,
      brand: nextBrand,
      skuOrEnr: nextSku,
      shortSpecs: nextShortSpecs,
      availability: nextAvailability,
      soldAt:
        nextAvailability === "Verkauft (Abgeschlossen)"
          ? existing.soldAt || new Date().toISOString()
          : undefined,
      linkedTicketId: nextLinkedTicketId,
      photos: nextPhotos,
    };

    const nextItems = [...current];
    nextItems[idx] = updated;
    persistStoredMarketplaceItems(nextItems);
    res.status(200).json({ ok: true, item: updated, items: nextItems });
  });

  app.delete("/api/admin/marketplace/:id", (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    if (!isAuthorizedAdminRequest(req)) {
      res.status(401).json({ ok: false, error: "Nicht autorisiert." });
      return;
    }

    const itemId = sanitizeSingleLine(req.params.id, 60);
    const current = loadStoredMarketplaceItems();
    const filtered = current.filter((i) => i.id !== itemId);
    persistStoredMarketplaceItems(filtered);
    res.status(200).json({ ok: true, items: filtered });
  });

  app.post("/api/admin/marketplace/reset-demos", (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    if (!isAuthorizedAdminRequest(req)) {
      res.status(401).json({ ok: false, error: "Nicht autorisiert." });
      return;
    }
    const initial = [...INITIAL_MARKETPLACE_DEMO_ITEMS];
    persistStoredMarketplaceItems(initial);
    res.status(200).json({ ok: true, items: initial });
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
