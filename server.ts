import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { fetchGooglePlace } from "./src/server/googlePlace.ts";
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
  MARKETPLACE_CATEGORIES,
  stripDemoMarketplaceItems,
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
const ADMIN_SESSIONS_FILE = path.join(DATA_DIR, "admin-sessions.json");
const ADMIN_SESSION_COOKIE = "hannachi_admin_session";

function writeJsonAtomicSync(filePath: string, data: unknown): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpPath = `${filePath}.${process.pid}.${crypto.randomBytes(4).toString("hex")}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmpPath, filePath);
}

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

const ADMIN_PASSWORD_SALT = "f756fbc6fb24a742d9e47f2f28490fa9";
const ADMIN_PASSWORD_SCRYPT_HEX =
  "caafee56ca09926ed2f66e6539495fa8ac8a8d14e1b96cc63b5dfab8a176897303ff164dd14d1a5e533e7ab4fafc27eb77bfb239ed64df365cac95d57db7b674";
const ADMIN_TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const activeAdminTokens = new Map<string, number>();

function hashSessionToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function loadPersistedAdminSessions(): void {
  try {
    if (!fs.existsSync(ADMIN_SESSIONS_FILE)) return;
    const raw = fs.readFileSync(ADMIN_SESSIONS_FILE, "utf8");
    const parsed = JSON.parse(raw) as Record<string, number>;
    if (!parsed || typeof parsed !== "object") return;
    const now = Date.now();
    for (const [tokenHash, expiresAt] of Object.entries(parsed)) {
      if (typeof expiresAt === "number" && expiresAt > now) {
        activeAdminTokens.set(tokenHash, expiresAt);
      }
    }
  } catch {
    // Ignore unreadable session cache
  }
}

function persistAdminSessions(): void {
  try {
    const now = Date.now();
    const record: Record<string, number> = {};
    for (const [tokenHash, expiresAt] of activeAdminTokens.entries()) {
      if (expiresAt > now) {
        record[tokenHash] = expiresAt;
      }
    }
    writeJsonAtomicSync(ADMIN_SESSIONS_FILE, record);
  } catch {
    // Keep in-memory sessions if filesystem is read-only
  }
}

loadPersistedAdminSessions();

function parseCookieHeader(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  for (const part of cookieHeader.split(";")) {
    const eqIdx = part.indexOf("=");
    if (eqIdx === -1) continue;
    const key = part.slice(0, eqIdx).trim();
    const val = part.slice(eqIdx + 1).trim();
    if (key) {
      try {
        cookies[key] = decodeURIComponent(val);
      } catch {
        cookies[key] = val;
      }
    }
  }
  return cookies;
}

function isHttpsRequest(req: Request): boolean {
  if (req.secure) return true;
  const proto = req.headers["x-forwarded-proto"];
  if (typeof proto === "string") {
    return proto.split(",")[0].trim().toLowerCase() === "https";
  }
  if (!isProd) return false;
  const host = (req.headers.host || "").toLowerCase();
  const isLocalHost =
    host.startsWith("localhost:") ||
    host === "localhost" ||
    host.startsWith("127.0.0.1:") ||
    host === "127.0.0.1" ||
    host.startsWith("[::1]:") ||
    host === "[::1]";
  return !isLocalHost;
}

function setAdminSessionCookie(
  req: Request,
  res: Response,
  rawToken: string,
  maxAgeSeconds: number,
): void {
  const https = isHttpsRequest(req);
  const parts = [
    `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(rawToken)}`,
    "Path=/",
    "HttpOnly",
    https ? "SameSite=None" : "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (https) {
    parts.push("Secure", "Partitioned");
  }
  res.setHeader("Set-Cookie", parts.join("; "));
}

function clearAdminSessionCookie(req: Request, res: Response): void {
  const https = isHttpsRequest(req);
  const parts = [
    `${ADMIN_SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    https ? "SameSite=None" : "SameSite=Lax",
    "Max-Age=0",
  ];
  if (https) {
    parts.push("Secure", "Partitioned");
  }
  res.setHeader("Set-Cookie", parts.join("; "));
}

function verifyAdminPassword(candidate: string): boolean {
  if (!candidate) return false;
  const envPass = (process.env.ADMIN_PASSWORD || process.env.ADMIN_PIN || "").trim();
  if (envPass) {
    const a = crypto.createHash("sha256").update(candidate).digest();
    const b = crypto.createHash("sha256").update(envPass).digest();
    return crypto.timingSafeEqual(a, b);
  }
  const derived = crypto.scryptSync(candidate, ADMIN_PASSWORD_SALT, 64);
  const expected = Buffer.from(ADMIN_PASSWORD_SCRYPT_HEX, "hex");
  return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
}

const ADMIN_LOGIN_WINDOW_MS = 15 * 60 * 1000;
const ADMIN_LOGIN_MAX_ATTEMPTS = 10;
const adminLoginAttempts = new Map<string, number[]>();

function isAdminLoginRateLimited(ip: string): boolean {
  const now = Date.now();
  const cutoff = now - ADMIN_LOGIN_WINDOW_MS;
  const recent = (adminLoginAttempts.get(ip) || []).filter((ts) => ts > cutoff);
  if (recent.length >= ADMIN_LOGIN_MAX_ATTEMPTS) {
    adminLoginAttempts.set(ip, recent);
    return true;
  }
  recent.push(now);
  adminLoginAttempts.set(ip, recent);
  return false;
}

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
    writeJsonAtomicSync(TICKETS_FILE, tickets);
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
      if (Array.isArray(parsed)) {
        const cleaned = stripDemoMarketplaceItems(parsed as MarketplaceItem[]);
        memoryMarketplaceItems = cleaned;
        if (cleaned.length !== parsed.length) {
          persistStoredMarketplaceItems(cleaned);
        }
        return memoryMarketplaceItems;
      }
    }
  } catch {
    // Start cleanly with zero mock listings
  }
  memoryMarketplaceItems = [];
  persistStoredMarketplaceItems([]);
  return [];
}

function persistStoredMarketplaceItems(items: MarketplaceItem[]): void {
  const cleaned = stripDemoMarketplaceItems(items);
  memoryMarketplaceItems = cleaned;
  try {
    writeJsonAtomicSync(MARKETPLACE_FILE, cleaned);
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
    writeJsonAtomicSync(MARKETPLACE_SETTINGS_FILE, settings);
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
  return { lat: 52.2647082, lng: 8.0567763, accuracy: 40 };
}

function extractAdminTokenWithSource(
  req: Request,
): { token: string; source: "cookie" | "header" | "none" } {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    const bearer = authHeader.slice("Bearer ".length).trim();
    if (bearer) return { token: bearer, source: "header" };
  }
  const customHeader = (req.headers["x-admin-token"] as string | undefined)?.trim() || "";
  if (customHeader) return { token: customHeader, source: "header" };

  const cookies = parseCookieHeader(req.headers.cookie);
  const cookieToken = cookies[ADMIN_SESSION_COOKIE]?.trim();
  if (cookieToken) return { token: cookieToken, source: "cookie" };

  return { token: "", source: "none" };
}

function extractAdminToken(req: Request): string {
  return extractAdminTokenWithSource(req).token;
}

function isSameOriginMutation(req: Request): boolean {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return true;
  }
  if (req.headers["x-requested-with"]) {
    return true;
  }
  const expectedHost = (
    (typeof req.headers["x-forwarded-host"] === "string"
      ? req.headers["x-forwarded-host"].split(",")[0].trim()
      : "") ||
    req.headers.host ||
    ""
  ).toLowerCase();
  const originHeader = req.headers.origin;
  if (typeof originHeader === "string" && originHeader.length > 0) {
    try {
      return new URL(originHeader).host.toLowerCase() === expectedHost;
    } catch {
      return false;
    }
  }
  const refererHeader = req.headers.referer;
  if (typeof refererHeader === "string" && refererHeader.length > 0) {
    try {
      return new URL(refererHeader).host.toLowerCase() === expectedHost;
    } catch {
      return false;
    }
  }
  // Reject cross-site mutations lacking Origin/Referer when relying solely on cookies
  return false;
}

function isAuthorizedAdminRequest(req: Request): boolean {
  const { token, source } = extractAdminTokenWithSource(req);
  if (!token) return false;
  if (source === "cookie" && !isSameOriginMutation(req)) {
    return false;
  }
  const tokenHash = hashSessionToken(token);
  const expiresAt = activeAdminTokens.get(tokenHash);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    activeAdminTokens.delete(tokenHash);
    persistAdminSessions();
    return false;
  }
  return true;
}

// ── In-memory sliding-window rate limiter for POST /api/repair-request ──────────
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 15;
const rateLimitStore = new Map<string, number[]>();

const cleanupTimer = setInterval(() => {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  for (const [ip, timestamps] of rateLimitStore.entries()) {
    const valid = timestamps.filter((t) => t > cutoff);
    if (valid.length === 0) {
      rateLimitStore.delete(ip);
    } else {
      rateLimitStore.set(ip, valid);
    }
  }
  const loginCutoff = now - ADMIN_LOGIN_WINDOW_MS;
  for (const [ip, timestamps] of adminLoginAttempts.entries()) {
    const valid = timestamps.filter((t) => t > loginCutoff);
    if (valid.length === 0) {
      adminLoginAttempts.delete(ip);
    } else {
      adminLoginAttempts.set(ip, valid);
    }
  }
  let prunedSessions = false;
  for (const [tokenHash, expiresAt] of activeAdminTokens.entries()) {
    if (now > expiresAt) {
      activeAdminTokens.delete(tokenHash);
      prunedSessions = true;
    }
  }
  if (prunedSessions) {
    persistAdminSessions();
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
    problem: z.string().trim().min(3).max(1500),
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
      .max(30)
      .optional()
      .default("")
      .refine(
        (val) =>
          !val ||
          (/^[+()\d\s/-]{6,30}$/.test(val) && val.replace(/\D/g, "").length >= 6),
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
      "form-action 'self' https://wa.me https://api.whatsapp.com https://web.whatsapp.com",
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

      const resolvedUploadsDir = path.resolve(UPLOADS_DIR);
      const fullPath = path.resolve(resolvedUploadsDir, base);
      if (!fullPath.startsWith(resolvedUploadsDir + path.sep)) {
        res.status(400).json({ ok: false, error: "Ungültiger Dateipfad." });
        return;
      }
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

    try {
      const result = await fetchGooglePlace(placeId, apiKey);
      if (result.body.ok !== true) {
        res.status(result.status).json({
          ...result.body,
          place: cached ? cached.payload.place : null,
        });
        return;
      }
      const payload = result.body;

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

  // ── Server-Side Reverse & Forward Geocoding Proxy (Google Geocoding v4 + fallback) ──
  const GEOCODE_CACHE_TTL_MS = 5 * 60 * 1000;
  const GEOCODE_CACHE_MAX_ENTRIES = 400;
  type GeocodePayload = {
    ok: boolean;
    source: "google" | "nominatim";
    lat: number;
    lng: number;
    streetAddress: string;
    postalCode: string;
    city: string;
    zipAndCity: string;
    formattedAddress: string;
    country: string;
    placeId?: string;
    quotaExceeded: boolean;
  };
  const geocodeCache = new Map<string, { expiresAt: number; payload: GeocodePayload }>();

  function setGeocodeCache(key: string, payload: GeocodePayload) {
    if (geocodeCache.size >= GEOCODE_CACHE_MAX_ENTRIES) {
      const oldestKey = geocodeCache.keys().next().value;
      if (oldestKey) geocodeCache.delete(oldestKey);
    }
    geocodeCache.set(key, { expiresAt: Date.now() + GEOCODE_CACHE_TTL_MS, payload });
  }

  function parseGoogleAddressComponents(
    components: Array<{
      longText?: string;
      shortText?: string;
      long_name?: string;
      short_name?: string;
      types?: string[];
    }> | undefined,
    postalAddress?: {
      postalCode?: string;
      locality?: string;
      sublocality?: string;
      addressLines?: string[];
      regionCode?: string;
    }
  ) {
    const list = Array.isArray(components) ? components : [];
    const pick = (...wantedTypes: string[]) => {
      for (const wanted of wantedTypes) {
        const hit = list.find((c) => Array.isArray(c.types) && c.types.includes(wanted));
        if (hit) {
          const val = hit.longText || hit.long_name || hit.shortText || hit.short_name || "";
          if (val.trim()) return sanitizeSingleLine(val, 120);
        }
      }
      return "";
    };

    const route = pick("route");
    const streetNumber = pick("street_number");
    const sublocality =
      pick("sublocality_level_1", "sublocality", "neighborhood") ||
      sanitizeSingleLine(postalAddress?.sublocality || "", 80);
    const postalCode =
      pick("postal_code") || sanitizeSingleLine(postalAddress?.postalCode || "", 20);
    const city =
      pick("locality", "postal_town", "administrative_area_level_3", "administrative_area_level_2") ||
      sanitizeSingleLine(postalAddress?.locality || "", 80);
    const country = pick("country") || sanitizeSingleLine(postalAddress?.regionCode || "", 40);

    let streetAddress = "";
    if (route) {
      streetAddress = streetNumber ? `${route} ${streetNumber}` : route;
    } else if (postalAddress?.addressLines?.[0]) {
      streetAddress = sanitizeSingleLine(postalAddress.addressLines[0], 120);
    } else if (sublocality && sublocality.toLowerCase() !== city.toLowerCase()) {
      streetAddress = sublocality;
    }

    const zipAndCity = [postalCode, city].filter(Boolean).join(" ").trim();
    return { streetAddress, postalCode, city, zipAndCity, country };
  }

  function pickBestGoogleResult<T extends { types?: string[] }>(results: T[]): T | undefined {
    if (!results.length) return undefined;
    return (
      results.find((r) => r.types?.includes("street_address")) ||
      results.find((r) => r.types?.includes("premise") || r.types?.includes("subpremise")) ||
      results.find((r) => r.types?.includes("route")) ||
      results.find((r) => r.types?.includes("postal_code")) ||
      results[0]
    );
  }

  app.get("/api/reverse-geocode", async (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      res.status(400).json({ ok: false, error: "Invalid coordinates" });
      return;
    }

    const cleanLat = Number(lat.toFixed(6));
    const cleanLng = Number(lng.toFixed(6));
    const cacheKey = `rev:${lat.toFixed(4)},${lng.toFixed(4)}`;
    const cached = geocodeCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      res.status(200).json({ ...cached.payload, lat: cleanLat, lng: cleanLng, cached: true });
      return;
    }

    const apiKey = (
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.VITE_GOOGLE_MAPS_API_KEY ||
      ""
    ).trim();
    let quotaExceeded = false;

    if (apiKey && !apiKey.startsWith("MY_GOOGLE_MAPS")) {
      // 1) Try Google Geocoding API v4
      try {
        const v4Url = new URL("https://geocode.googleapis.com/v4/geocode/location");
        v4Url.searchParams.set("location.latitude", String(cleanLat));
        v4Url.searchParams.set("location.longitude", String(cleanLng));
        v4Url.searchParams.set("languageCode", "de");
        v4Url.searchParams.set("regionCode", "DE");

        const v4Res = await fetch(v4Url.toString(), {
          method: "GET",
          signal: AbortSignal.timeout(5000),
          headers: {
            Accept: "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask":
              "results.placeId,results.formattedAddress,results.addressComponents,results.postalAddress,results.types",
            "X-Goog-Maps-Solution-ID": "gmp_mcp_codeassist_v1_aistudio",
          },
        });

        const v4Json = (await v4Res.json().catch(() => null)) as {
          results?: Array<{
            placeId?: string;
            formattedAddress?: string;
            types?: string[];
            addressComponents?: Array<{
              longText?: string;
              shortText?: string;
              types?: string[];
            }>;
            postalAddress?: {
              postalCode?: string;
              locality?: string;
              sublocality?: string;
              addressLines?: string[];
              regionCode?: string;
            };
          }>;
          error?: { status?: string };
        } | null;

        if (v4Res.status === 429 || v4Json?.error?.status === "RESOURCE_EXHAUSTED") {
          quotaExceeded = true;
        } else if (v4Res.ok && Array.isArray(v4Json?.results) && v4Json.results.length > 0) {
          const best = pickBestGoogleResult(v4Json.results)!;
          const parsed = parseGoogleAddressComponents(best.addressComponents, best.postalAddress);
          const payload: GeocodePayload = {
            ok: true,
            source: "google",
            lat: cleanLat,
            lng: cleanLng,
            ...parsed,
            formattedAddress: sanitizeSingleLine(
              best.formattedAddress || [parsed.streetAddress, parsed.zipAndCity].filter(Boolean).join(", "),
              220
            ),
            placeId: best.placeId ? sanitizeSingleLine(best.placeId, 120) : undefined,
            quotaExceeded: false,
          };
          setGeocodeCache(cacheKey, payload);
          res.status(200).json(payload);
          return;
        }
      } catch {
        // Fall through to classic Google Geocoding REST API
      }

      // 2) Try classic Google Geocoding REST API (if v4 isn't active on key)
      if (!quotaExceeded) {
        try {
          const v3Url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
          v3Url.searchParams.set("latlng", `${cleanLat},${cleanLng}`);
          v3Url.searchParams.set("language", "de");
          v3Url.searchParams.set("region", "de");
          v3Url.searchParams.set("key", apiKey);

          const v3Res = await fetch(v3Url.toString(), {
            method: "GET",
            signal: AbortSignal.timeout(5000),
            headers: {
              Accept: "application/json",
              "X-Goog-Maps-Solution-ID": "gmp_mcp_codeassist_v1_aistudio",
            },
          });
          const v3Json = (await v3Res.json().catch(() => null)) as {
            status?: string;
            results?: Array<{
              place_id?: string;
              formatted_address?: string;
              types?: string[];
              address_components?: Array<{
                long_name?: string;
                short_name?: string;
                types?: string[];
              }>;
            }>;
          } | null;

          if (v3Res.status === 429 || v3Json?.status === "OVER_QUERY_LIMIT") {
            quotaExceeded = true;
          } else if (
            v3Res.ok &&
            v3Json?.status === "OK" &&
            Array.isArray(v3Json.results) &&
            v3Json.results.length > 0
          ) {
            const best = pickBestGoogleResult(v3Json.results)!;
            const parsed = parseGoogleAddressComponents(best.address_components);
            const payload: GeocodePayload = {
              ok: true,
              source: "google",
              lat: cleanLat,
              lng: cleanLng,
              ...parsed,
              formattedAddress: sanitizeSingleLine(
                best.formatted_address || [parsed.streetAddress, parsed.zipAndCity].filter(Boolean).join(", "),
                220
              ),
              placeId: best.place_id ? sanitizeSingleLine(best.place_id, 120) : undefined,
              quotaExceeded: false,
            };
            setGeocodeCache(cacheKey, payload);
            res.status(200).json(payload);
            return;
          }
        } catch {
          // Fall through to Nominatim
        }
      }
    }

    // 3) Server-side OpenStreetMap Nominatim fallback (with compliant User-Agent)
    try {
      const nomRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${cleanLat}&lon=${cleanLng}&accept-language=de&addressdetails=1`,
        {
          signal: AbortSignal.timeout(5000),
          headers: {
            Accept: "application/json",
            "User-Agent": "Hannachi-Osnabrueck-Web/1.0 (+https://hannachi.de)",
          },
        }
      );
      if (nomRes.ok) {
        const nomData = (await nomRes.json().catch(() => null)) as {
          display_name?: string;
          address?: {
            road?: string;
            pedestrian?: string;
            footway?: string;
            house_number?: string;
            postcode?: string;
            city?: string;
            town?: string;
            village?: string;
            municipality?: string;
            suburb?: string;
            country?: string;
          };
        } | null;
        const addr = nomData?.address;
        if (addr) {
          const streetName = sanitizeSingleLine(
            addr.road || addr.pedestrian || addr.footway || "",
            120
          );
          const houseNum = addr.house_number ? ` ${sanitizeSingleLine(addr.house_number, 20)}` : "";
          const suburb = sanitizeSingleLine(addr.suburb || "", 80);
          const city = sanitizeSingleLine(
            addr.city || addr.town || addr.village || addr.municipality || "",
            80
          );
          const postalCode = sanitizeSingleLine(addr.postcode || "", 20);
          const streetAddress = streetName
            ? `${streetName}${houseNum}`
            : suburb && suburb.toLowerCase() !== city.toLowerCase()
            ? suburb
            : "";
          const zipAndCity = [postalCode, city].filter(Boolean).join(" ").trim();
          const payload: GeocodePayload = {
            ok: true,
            source: "nominatim",
            lat: cleanLat,
            lng: cleanLng,
            streetAddress,
            postalCode,
            city,
            zipAndCity,
            formattedAddress: sanitizeSingleLine(
              [streetAddress, zipAndCity].filter(Boolean).join(", ") || nomData?.display_name || "",
              220
            ),
            country: sanitizeSingleLine(addr.country || "", 60),
            quotaExceeded,
          };
          setGeocodeCache(cacheKey, payload);
          res.status(200).json(payload);
          return;
        }
      }
    } catch {
      // Fall through to structured error response
    }

    res.status(200).json({
      ok: false,
      quotaExceeded,
      error: "Adresse konnte nicht automatisch aufgelöst werden.",
    });
  });

  app.get("/api/geocode", async (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    const rawQuery = typeof req.query.q === "string" ? sanitizeSingleLine(req.query.q, 160) : "";
    if (rawQuery.length < 2) {
      res.status(400).json({ ok: false, error: "Bitte geben Sie einen Ort, eine PLZ oder Straße ein." });
      return;
    }

    const cacheKey = `fwd:${rawQuery.toLowerCase()}`;
    const cached = geocodeCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      res.status(200).json({ ...cached.payload, cached: true });
      return;
    }

    const apiKey = (
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.VITE_GOOGLE_MAPS_API_KEY ||
      ""
    ).trim();
    let quotaExceeded = false;

    if (apiKey && !apiKey.startsWith("MY_GOOGLE_MAPS")) {
      // 1) Google Geocoding API v4 forward geocode biased toward Osnabrück / DE
      try {
        const encodedAddress = encodeURIComponent(rawQuery);
        const v4Url = new URL(`https://geocode.googleapis.com/v4/geocode/address/${encodedAddress}`);
        v4Url.searchParams.set("languageCode", "de");
        v4Url.searchParams.set("regionCode", "DE");
        v4Url.searchParams.set("locationBias.rectangle.low.latitude", "52.00");
        v4Url.searchParams.set("locationBias.rectangle.low.longitude", "7.65");
        v4Url.searchParams.set("locationBias.rectangle.high.latitude", "52.55");
        v4Url.searchParams.set("locationBias.rectangle.high.longitude", "8.55");

        const v4Res = await fetch(v4Url.toString(), {
          method: "GET",
          signal: AbortSignal.timeout(5000),
          headers: {
            Accept: "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask":
              "results.placeId,results.location,results.formattedAddress,results.addressComponents,results.postalAddress,results.types",
            "X-Goog-Maps-Solution-ID": "gmp_mcp_codeassist_v1_aistudio",
          },
        });
        const v4Json = (await v4Res.json().catch(() => null)) as {
          results?: Array<{
            placeId?: string;
            location?: { latitude?: number; longitude?: number };
            formattedAddress?: string;
            types?: string[];
            addressComponents?: Array<{
              longText?: string;
              shortText?: string;
              types?: string[];
            }>;
            postalAddress?: {
              postalCode?: string;
              locality?: string;
              sublocality?: string;
              addressLines?: string[];
              regionCode?: string;
            };
          }>;
          error?: { status?: string };
        } | null;

        if (v4Res.status === 429 || v4Json?.error?.status === "RESOURCE_EXHAUSTED") {
          quotaExceeded = true;
        } else if (v4Res.ok && Array.isArray(v4Json?.results) && v4Json.results.length > 0) {
          const best = v4Json.results[0];
          const lat = best.location?.latitude;
          const lng = best.location?.longitude;
          if (typeof lat === "number" && typeof lng === "number") {
            const parsed = parseGoogleAddressComponents(best.addressComponents, best.postalAddress);
            const payload: GeocodePayload = {
              ok: true,
              source: "google",
              lat: Number(lat.toFixed(6)),
              lng: Number(lng.toFixed(6)),
              ...parsed,
              formattedAddress: sanitizeSingleLine(
                best.formattedAddress || [parsed.streetAddress, parsed.zipAndCity].filter(Boolean).join(", "),
                220
              ),
              placeId: best.placeId ? sanitizeSingleLine(best.placeId, 120) : undefined,
              quotaExceeded: false,
            };
            setGeocodeCache(cacheKey, payload);
            res.status(200).json(payload);
            return;
          }
        }
      } catch {
        // Fall through to classic Google Geocoding API
      }

      if (!quotaExceeded) {
        try {
          const v3Url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
          v3Url.searchParams.set("address", rawQuery);
          v3Url.searchParams.set("language", "de");
          v3Url.searchParams.set("region", "de");
          v3Url.searchParams.set("bounds", "52.00,7.65|52.55,8.55");
          v3Url.searchParams.set("key", apiKey);

          const v3Res = await fetch(v3Url.toString(), {
            method: "GET",
            signal: AbortSignal.timeout(5000),
            headers: {
              Accept: "application/json",
              "X-Goog-Maps-Solution-ID": "gmp_mcp_codeassist_v1_aistudio",
            },
          });
          const v3Json = (await v3Res.json().catch(() => null)) as {
            status?: string;
            results?: Array<{
              place_id?: string;
              formatted_address?: string;
              geometry?: { location?: { lat?: number; lng?: number } };
              address_components?: Array<{
                long_name?: string;
                short_name?: string;
                types?: string[];
              }>;
            }>;
          } | null;

          if (v3Res.status === 429 || v3Json?.status === "OVER_QUERY_LIMIT") {
            quotaExceeded = true;
          } else if (
            v3Res.ok &&
            v3Json?.status === "OK" &&
            Array.isArray(v3Json.results) &&
            v3Json.results.length > 0
          ) {
            const best = v3Json.results[0];
            const lat = best.geometry?.location?.lat;
            const lng = best.geometry?.location?.lng;
            if (typeof lat === "number" && typeof lng === "number") {
              const parsed = parseGoogleAddressComponents(best.address_components);
              const payload: GeocodePayload = {
                ok: true,
                source: "google",
                lat: Number(lat.toFixed(6)),
                lng: Number(lng.toFixed(6)),
                ...parsed,
                formattedAddress: sanitizeSingleLine(
                  best.formatted_address || [parsed.streetAddress, parsed.zipAndCity].filter(Boolean).join(", "),
                  220
                ),
                placeId: best.place_id ? sanitizeSingleLine(best.place_id, 120) : undefined,
                quotaExceeded: false,
              };
              setGeocodeCache(cacheKey, payload);
              res.status(200).json(payload);
              return;
            }
          }
        } catch {
          // Fall through to Nominatim
        }
      }
    }

    // 3) Server-side OpenStreetMap Nominatim search fallback
    try {
      const nomUrl = new URL("https://nominatim.openstreetmap.org/search");
      nomUrl.searchParams.set("format", "jsonv2");
      nomUrl.searchParams.set("q", rawQuery);
      nomUrl.searchParams.set("countrycodes", "de");
      nomUrl.searchParams.set("accept-language", "de");
      nomUrl.searchParams.set("addressdetails", "1");
      nomUrl.searchParams.set("limit", "1");
      nomUrl.searchParams.set("viewbox", "7.65,52.55,8.55,52.00");

      const nomRes = await fetch(nomUrl.toString(), {
        signal: AbortSignal.timeout(5000),
        headers: {
          Accept: "application/json",
          "User-Agent": "Hannachi-Osnabrueck-Web/1.0 (+https://hannachi.de)",
        },
      });
      if (nomRes.ok) {
        const items = (await nomRes.json().catch(() => [])) as Array<{
          lat?: string;
          lon?: string;
          display_name?: string;
          address?: {
            road?: string;
            pedestrian?: string;
            house_number?: string;
            postcode?: string;
            city?: string;
            town?: string;
            village?: string;
            municipality?: string;
            suburb?: string;
            country?: string;
          };
        }>;
        const first = items[0];
        const lat = Number(first?.lat);
        const lng = Number(first?.lon);
        if (first && Number.isFinite(lat) && Number.isFinite(lng)) {
          const addr = first.address || {};
          const streetName = sanitizeSingleLine(addr.road || addr.pedestrian || "", 120);
          const houseNum = addr.house_number ? ` ${sanitizeSingleLine(addr.house_number, 20)}` : "";
          const city = sanitizeSingleLine(
            addr.city || addr.town || addr.village || addr.municipality || "",
            80
          );
          const postalCode = sanitizeSingleLine(addr.postcode || "", 20);
          const streetAddress = streetName ? `${streetName}${houseNum}` : "";
          const zipAndCity = [postalCode, city].filter(Boolean).join(" ").trim();
          const payload: GeocodePayload = {
            ok: true,
            source: "nominatim",
            lat: Number(lat.toFixed(6)),
            lng: Number(lng.toFixed(6)),
            streetAddress,
            postalCode,
            city,
            zipAndCity,
            formattedAddress: sanitizeSingleLine(
              [streetAddress, zipAndCity].filter(Boolean).join(", ") || first.display_name || "",
              220
            ),
            country: sanitizeSingleLine(addr.country || "Deutschland", 60),
            quotaExceeded,
          };
          setGeocodeCache(cacheKey, payload);
          res.status(200).json(payload);
          return;
        }
      }
    } catch {
      // Fall through
    }

    res.status(200).json({
      ok: false,
      quotaExceeded,
      error: "Kein passender Ort gefunden. Bitte prüfen Sie PLZ, Ort oder Straßenname.",
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
      : { lat: 52.2647082, lng: 8.0567763, accuracy: 10 };

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
    const clientIp = getClientIp(req);
    if (isAdminLoginRateLimited(clientIp)) {
      res.status(429).json({
        ok: false,
        error: "Zu viele Anmeldeversuche. Bitte warten Sie einige Minuten.",
      });
      return;
    }

    const rawBody = req.body as { pin?: unknown; password?: unknown } | undefined;
    const candidate =
      typeof rawBody?.password === "string"
        ? rawBody.password.trim()
        : typeof rawBody?.pin === "string"
        ? rawBody.pin.trim()
        : "";

    if (!verifyAdminPassword(candidate)) {
      res.status(401).json({
        ok: false,
        error: "Ungültiges Passwort. Bitte erneut versuchen.",
      });
      return;
    }

    adminLoginAttempts.delete(clientIp);
    const token = `hannachi-admin-${crypto.randomBytes(32).toString("hex")}`;
    const tokenHash = hashSessionToken(token);
    activeAdminTokens.set(tokenHash, Date.now() + ADMIN_TOKEN_TTL_MS);
    persistAdminSessions();
    setAdminSessionCookie(req, res, token, Math.floor(ADMIN_TOKEN_TTL_MS / 1000));

    res.status(200).json({
      ok: true,
      token,
      owner: "Kamal Hannachi",
    });
  });

  app.get("/api/admin/session", (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    if (!isAuthorizedAdminRequest(req)) {
      res.status(200).json({ ok: false, authenticated: false });
      return;
    }
    res.status(200).json({
      ok: true,
      authenticated: true,
      owner: "Kamal Hannachi",
    });
  });

  app.post("/api/admin/logout", (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    const token = extractAdminToken(req);
    if (token) {
      activeAdminTokens.delete(hashSessionToken(token));
      persistAdminSessions();
    }
    clearAdminSessionCookie(req, res);
    res.status(200).json({ ok: true });
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
      problem: sanitizeText(raw.problem, 1500, true) || "Telefonische Geräte- / Ersatzteilanfrage",
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
                `Elektrohaushaltsgerät / Original-Ersatzteil (${brand} ${device})`
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
        ? "Persönliche Beratung & Original-Ersatzteile nach Terminvereinbarung in Osnabrück"
        : "Inklusive schriftlicher Verkäufergarantie bei Übergabe in Osnabrück");

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
      isDemo: false,
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
        "Persönliche Übergabe oder Lieferung in 49082 Osnabrück & Umgebung nach Terminvereinbarung.",
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
