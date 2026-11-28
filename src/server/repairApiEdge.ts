import { z } from "zod";
import {
  isSafeGoogleMapsUrl,
  isValidBase64ImageDataUrl,
  sanitizeSingleLine,
  sanitizeText,
} from "../utils/sanitize.ts";
import { forwardGeocodeQuery, reverseGeocodeCoords } from "./geocode.ts";
import { fetchGooglePlace } from "./googlePlace.ts";
import {
  randomHex,
  sha256Hex,
  signHmacSessionToken,
  verifyAdminPasswordEdge,
  verifyHmacSessionToken,
} from "./edgeCrypto.ts";
import {
  buildSingleGrossInvoiceItems,
  createInitialSeedTickets,
  stripMockTickets,
  type AdminInvoiceItem,
  type AdminRepairTicket,
  type AdminTicketStatus,
  type AdminTimeSlot,
  type TicketCompletionDetails,
} from "../lib/adminTypes.ts";
import {
  DEFAULT_MARKETPLACE_SETTINGS,
  MARKETPLACE_CATEGORIES,
  stripDemoMarketplaceItems,
  type MarketplaceAvailabilityStatus,
  type MarketplaceCategoryId,
  type MarketplaceItem,
  type MarketplacePhoto,
  type MarketplaceSettings,
} from "../data/marketplaceItems.ts";

// ── Optional Cloudflare KV Binding Interface ─────────────────────────────────
export interface EdgeKvNamespace {
  get(key: string, type?: "text" | "json"): Promise<unknown>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface EdgeApiEnv {
  GOOGLE_MAPS_API_KEY?: string;
  ADMIN_PASSWORD?: string;
  ADMIN_PIN?: string;
  ADMIN_SESSION_SECRET?: string;
  HANNACHI_KV?: EdgeKvNamespace;
}

// ── Isolate-scoped sliding-window rate limiters ──────────────────────────────
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 15;
const rateLimitStore = new Map<string, number[]>();

const ADMIN_LOGIN_WINDOW_MS = 15 * 60 * 1000;
const ADMIN_LOGIN_MAX_ATTEMPTS = 10;
const adminLoginAttempts = new Map<string, number[]>();

const ADMIN_TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const ADMIN_SESSION_COOKIE = "hannachi_admin_session";
const activeAdminTokens = new Map<string, number>();
const revokedAdminTokens = new Map<string, number>();

// Ephemeral in-memory fallback HMAC secret (never hardcoded)
let runtimeHmacSecret: string | null = null;

// Isolate-scoped state (backed by optional HANNACHI_KV when configured)
let edgeTickets: AdminRepairTicket[] | null = null;
let edgeMarketplaceItems: MarketplaceItem[] | null = null;
let edgeMarketplaceSettings: MarketplaceSettings | null = null;

function getClientIp(request: Request): string {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp && cfIp.trim().length > 0) return cfIp.trim();
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded && forwarded.length > 0) return forwarded.split(",")[0].trim();
  return "unknown";
}

function checkRateLimitMap(
  store: Map<string, number[]>,
  ip: string,
  windowMs: number,
  maxReq: number
): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;
  if (store.size > 1000) {
    for (const [key, timestamps] of store.entries()) {
      const active = timestamps.filter((t) => t > cutoff);
      if (active.length === 0) store.delete(key);
      else store.set(key, active);
    }
  }
  const recent = (store.get(ip) || []).filter((ts) => ts > cutoff);
  if (recent.length >= maxReq) {
    store.set(ip, recent);
    return true;
  }
  recent.push(now);
  store.set(ip, recent);
  return false;
}

function generateReferenceId(): string {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  const code = 1000 + (bytes[0] % 9000);
  return `HN-${code}`;
}

function randomDigits3(): number {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return 100 + (bytes[0] % 900);
}

// ── Security Headers ─────────────────────────────────────────────────────────
export const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), payment=(), usb=(), interest-cohort=()",
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
    "form-action 'self' https://wa.me https://api.whatsapp.com https://web.whatsapp.com",
  ].join("; "),
};

function jsonResponse(
  body: unknown,
  status: number,
  extraHeaders?: Record<string, string>
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...SECURITY_HEADERS,
      ...(extraHeaders || {}),
    },
  });
}

// ── Cookie & Session Helpers ─────────────────────────────────────────────────
function parseCookieHeader(cookieHeader: string | null): Record<string, string> {
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

function buildAdminSessionCookieHeader(
  request: Request,
  rawToken: string,
  maxAgeSeconds: number
): string {
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
  const isHttps = proto.toLowerCase() === "https";
  const parts = [
    `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(rawToken)}`,
    "Path=/",
    "HttpOnly",
    isHttps ? "SameSite=None" : "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (isHttps) {
    parts.push("Secure", "Partitioned");
  }
  return parts.join("; ");
}

function extractAdminTokenWithSource(
  request: Request
): { token: string; source: "cookie" | "header" | "none" } {
  const authHeader = request.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    const bearer = authHeader.slice("Bearer ".length).trim();
    if (bearer) return { token: bearer, source: "header" };
  }
  const customHeader = (request.headers.get("x-admin-token") || "").trim();
  if (customHeader) return { token: customHeader, source: "header" };

  const cookies = parseCookieHeader(request.headers.get("cookie"));
  const cookieToken = cookies[ADMIN_SESSION_COOKIE]?.trim();
  if (cookieToken) return { token: cookieToken, source: "cookie" };

  return { token: "", source: "none" };
}

function isSameOriginMutation(request: Request): boolean {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return true;
  if (request.headers.get("x-requested-with")) return true;

  const url = new URL(request.url);
  const expectedHost = (
    (request.headers.get("x-forwarded-host") || "").split(",")[0].trim() ||
    request.headers.get("host") ||
    url.host
  ).toLowerCase();
  if (!expectedHost) return false;

  const originHeader = request.headers.get("origin");
  if (originHeader) {
    try {
      return new URL(originHeader).host.toLowerCase() === expectedHost;
    } catch {
      return false;
    }
  }
  const refererHeader = request.headers.get("referer");
  if (refererHeader) {
    try {
      return new URL(refererHeader).host.toLowerCase() === expectedHost;
    } catch {
      return false;
    }
  }
  return false;
}

async function resolveSigningSecret(env: EdgeApiEnv): Promise<string> {
  const envSecret = (env.ADMIN_SESSION_SECRET || "").trim();
  if (envSecret) return envSecret;

  if (env.HANNACHI_KV) {
    try {
      const existing = await env.HANNACHI_KV.get("hannachi:_session_secret", "text");
      if (typeof existing === "string" && existing.length >= 32) {
        return existing;
      }
      const created = randomHex(32);
      await env.HANNACHI_KV.put("hannachi:_session_secret", created);
      return created;
    } catch {
      // Fallback to isolate secret
    }
  }

  if (!runtimeHmacSecret) {
    runtimeHmacSecret = randomHex(32);
  }
  return runtimeHmacSecret;
}

function getEdgeCache(): Cache | undefined {
  return (globalThis as { caches?: { default?: Cache } }).caches?.default;
}

function sessionCacheRequest(tokenHash: string): Request {
  return new Request(`https://hannachi-session.internal/v1/${tokenHash}`);
}

async function persistEdgeSession(
  token: string,
  tokenHash: string,
  expiresAt: number,
  env: EdgeApiEnv
): Promise<void> {
  activeAdminTokens.set(tokenHash, expiresAt);
  const ttlSeconds = Math.max(60, Math.floor((expiresAt - Date.now()) / 1000));

  if (env.HANNACHI_KV) {
    try {
      await env.HANNACHI_KV.put(
        `hannachi:session:${tokenHash}`,
        JSON.stringify({ expiresAt }),
        { expirationTtl: ttlSeconds }
      );
    } catch {
      // Continue with Cache API / memory
    }
  }

  const edgeCache = getEdgeCache();
  if (edgeCache) {
    try {
      await edgeCache.put(
        sessionCacheRequest(tokenHash),
        new Response(JSON.stringify({ expiresAt, ok: true }), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": `public, max-age=${ttlSeconds}`,
          },
        })
      );
    } catch {
      // Continue cleanly
    }
  }

  void token;
}

async function revokeEdgeSession(token: string, env: EdgeApiEnv): Promise<void> {
  if (!token) return;
  const tokenHash = await sha256Hex(token);
  activeAdminTokens.delete(tokenHash);
  revokedAdminTokens.set(tokenHash, Date.now() + ADMIN_TOKEN_TTL_MS);

  const ttlSeconds = Math.floor(ADMIN_TOKEN_TTL_MS / 1000);

  if (env.HANNACHI_KV) {
    try {
      await env.HANNACHI_KV.delete(`hannachi:session:${tokenHash}`);
      await env.HANNACHI_KV.put(`hannachi:revoked:${tokenHash}`, "1", {
        expirationTtl: ttlSeconds,
      });
    } catch {
      // Ignore
    }
  }

  const edgeCache = getEdgeCache();
  if (edgeCache) {
    try {
      await edgeCache.delete(sessionCacheRequest(tokenHash));
      await edgeCache.put(
        new Request(`https://hannachi-revoked.internal/v1/${tokenHash}`),
        new Response("1", { headers: { "Cache-Control": `public, max-age=${ttlSeconds}` } })
      );
    } catch {
      // Ignore
    }
  }
}

async function isSessionRevoked(tokenHash: string, env: EdgeApiEnv): Promise<boolean> {
  const memRevokedUntil = revokedAdminTokens.get(tokenHash);
  if (memRevokedUntil && Date.now() < memRevokedUntil) return true;

  if (env.HANNACHI_KV) {
    try {
      const hit = await env.HANNACHI_KV.get(`hannachi:revoked:${tokenHash}`, "text");
      if (hit) {
        revokedAdminTokens.set(tokenHash, Date.now() + ADMIN_TOKEN_TTL_MS);
        return true;
      }
    } catch {
      // Ignore KV failure
    }
  }

  const edgeCache = getEdgeCache();
  if (edgeCache) {
    try {
      const hit = await edgeCache.match(
        new Request(`https://hannachi-revoked.internal/v1/${tokenHash}`)
      );
      if (hit) {
        revokedAdminTokens.set(tokenHash, Date.now() + ADMIN_TOKEN_TTL_MS);
        return true;
      }
    } catch {
      // Ignore Cache API failure
    }
  }

  return false;
}

async function isAuthorizedAdminRequest(
  request: Request,
  env: EdgeApiEnv
): Promise<boolean> {
  const { token, source } = extractAdminTokenWithSource(request);
  if (!token) return false;
  if (source === "cookie" && !isSameOriginMutation(request)) {
    return false;
  }

  const tokenHash = await sha256Hex(token);
  if (await isSessionRevoked(tokenHash, env)) {
    return false;
  }

  const secret = await resolveSigningSecret(env);
  if (await verifyHmacSessionToken(token, secret)) {
    return true;
  }

  const memExp = activeAdminTokens.get(tokenHash);
  if (memExp && Date.now() < memExp) return true;

  if (env.HANNACHI_KV) {
    try {
      const stored = (await env.HANNACHI_KV.get(
        `hannachi:session:${tokenHash}`,
        "json"
      )) as { expiresAt?: number } | null;
      if (stored?.expiresAt && Date.now() < stored.expiresAt) {
        activeAdminTokens.set(tokenHash, stored.expiresAt);
        return true;
      }
    } catch {
      // Ignore KV failure
    }
  }

  const edgeCache = getEdgeCache();
  if (edgeCache) {
    try {
      const hit = await edgeCache.match(sessionCacheRequest(tokenHash));
      if (hit) {
        const data = (await hit.json().catch(() => null)) as {
          expiresAt?: number;
        } | null;
        if (data?.expiresAt && Date.now() < data.expiresAt) {
          activeAdminTokens.set(tokenHash, data.expiresAt);
          return true;
        }
      }
    } catch {
      // Ignore Cache API failure
    }
  }

  return false;
}

// ── Persistent KV + Isolate Memory Storage Helpers ───────────────────────────
async function loadTicketsEdge(env: EdgeApiEnv): Promise<AdminRepairTicket[]> {
  if (env.HANNACHI_KV) {
    try {
      const raw = await env.HANNACHI_KV.get("hannachi:tickets", "json");
      if (Array.isArray(raw)) {
        const cleaned = stripMockTickets(raw as AdminRepairTicket[]);
        edgeTickets = cleaned;
        return cleaned;
      }
    } catch {
      // Fallback to isolate store
    }
  }
  if (edgeTickets) return edgeTickets;
  edgeTickets = createInitialSeedTickets();
  return edgeTickets;
}

async function persistTicketsEdge(
  tickets: AdminRepairTicket[],
  env: EdgeApiEnv
): Promise<void> {
  const cleaned = stripMockTickets(tickets);
  edgeTickets = cleaned;
  if (env.HANNACHI_KV) {
    try {
      await env.HANNACHI_KV.put("hannachi:tickets", JSON.stringify(cleaned));
    } catch {
      // Keep isolate copy
    }
  }
}

async function loadMarketplaceItemsEdge(env: EdgeApiEnv): Promise<MarketplaceItem[]> {
  if (env.HANNACHI_KV) {
    try {
      const raw = await env.HANNACHI_KV.get("hannachi:marketplace_items", "json");
      if (Array.isArray(raw)) {
        const cleaned = stripDemoMarketplaceItems(raw as MarketplaceItem[]);
        edgeMarketplaceItems = cleaned;
        return cleaned;
      }
    } catch {
      // Fallback to isolate store
    }
  }
  if (edgeMarketplaceItems) return edgeMarketplaceItems;
  edgeMarketplaceItems = [];
  return [];
}

async function persistMarketplaceItemsEdge(
  items: MarketplaceItem[],
  env: EdgeApiEnv
): Promise<void> {
  const cleaned = stripDemoMarketplaceItems(items);
  edgeMarketplaceItems = cleaned;
  if (env.HANNACHI_KV) {
    try {
      await env.HANNACHI_KV.put("hannachi:marketplace_items", JSON.stringify(cleaned));
    } catch {
      // Keep isolate copy
    }
  }
}

async function loadMarketplaceSettingsEdge(env: EdgeApiEnv): Promise<MarketplaceSettings> {
  if (env.HANNACHI_KV) {
    try {
      const raw = (await env.HANNACHI_KV.get(
        "hannachi:marketplace_settings",
        "json"
      )) as Partial<MarketplaceSettings> | null;
      if (raw && typeof raw === "object") {
        edgeMarketplaceSettings = { hideSoldPublicly: Boolean(raw.hideSoldPublicly) };
        return edgeMarketplaceSettings;
      }
    } catch {
      // Fallback
    }
  }
  if (edgeMarketplaceSettings) return edgeMarketplaceSettings;
  edgeMarketplaceSettings = { ...DEFAULT_MARKETPLACE_SETTINGS };
  return edgeMarketplaceSettings;
}

async function persistMarketplaceSettingsEdge(
  settings: MarketplaceSettings,
  env: EdgeApiEnv
): Promise<void> {
  edgeMarketplaceSettings = settings;
  if (env.HANNACHI_KV) {
    try {
      await env.HANNACHI_KV.put(
        "hannachi:marketplace_settings",
        JSON.stringify(settings)
      );
    } catch {
      // Keep isolate copy
    }
  }
}

// ── Domain Sanitization Helpers (Matched to server.ts) ───────────────────────
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

function sanitizePhotosList(rawPhotos: unknown): MarketplacePhoto[] {
  if (!Array.isArray(rawPhotos)) return [];
  const cleaned: MarketplacePhoto[] = [];
  for (let i = 0; i < rawPhotos.length && cleaned.length < 12; i++) {
    const entry = rawPhotos[i];
    if (!entry || typeof entry !== "object") continue;
    const obj = entry as Record<string, unknown>;
    const url = typeof obj.url === "string" ? obj.url.trim() : "";
    const isSafeUrl =
      (/^\/uploads\/ph-[a-z0-9-]+\.(webp|jpg|jpeg|png)$/i.test(url)) ||
      isValidBase64ImageDataUrl(url);
    if (!isSafeUrl || url.length > 2_500_000) continue;
    const id =
      sanitizeSingleLine(obj.id, 60) || `ph-${Date.now().toString(36)}-${i}`;
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

async function parseJsonObjectBody(
  request: Request,
  maxBytes = 2 * 1024 * 1024
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; response: Response }> {
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > maxBytes) {
    return {
      ok: false,
      response: jsonResponse({ ok: false, error: "Anfrage zu groß." }, 413),
    };
  }

  let rawText = "";
  try {
    rawText = await request.text();
  } catch {
    return {
      ok: false,
      response: jsonResponse({ ok: false, error: "Ungültige JSON-Anfrage." }, 400),
    };
  }

  if (rawText.length > maxBytes) {
    return {
      ok: false,
      response: jsonResponse({ ok: false, error: "Anfrage zu groß." }, 413),
    };
  }

  if (!rawText.trim()) {
    return { ok: true, data: {} };
  }

  let rawBody: unknown;
  try {
    rawBody = JSON.parse(rawText);
  } catch {
    return {
      ok: false,
      response: jsonResponse({ ok: false, error: "Ungültige JSON-Anfrage." }, 400),
    };
  }

  if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
    return {
      ok: false,
      response: jsonResponse({ ok: false, error: "Ungültiges Anfrageformat." }, 400),
    };
  }

  return { ok: true, data: rawBody as Record<string, unknown> };
}

// ── Intake Schema ────────────────────────────────────────────────────────────
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

const HANNACHI_PLACE_ID = "ChIJ_RB_R7_luUcRHnvjhljngB8";
const GOOGLE_PLACE_EDGE_TTL_SECONDS = 6 * 60 * 60;

async function handleGooglePlace(request: Request, env: EdgeApiEnv): Promise<Response> {
  const apiKey = (env.GOOGLE_MAPS_API_KEY || "").trim();
  if (!apiKey) {
    return jsonResponse(
      { ok: false, source: "fallback", reason: "missing_api_key", quotaExceeded: false, place: null },
      200
    );
  }

  const cacheKey = new Request(
    new URL(`/api/google-place?placeId=${HANNACHI_PLACE_ID}`, request.url).toString()
  );
  const edgeCache = getEdgeCache();
  const hit = edgeCache ? await edgeCache.match(cacheKey) : undefined;
  if (hit) return hit;

  try {
    const result = await fetchGooglePlace(HANNACHI_PLACE_ID, apiKey);
    const response = jsonResponse(result.body, result.status);
    if (result.body.ok === true && edgeCache) {
      const cacheable = new Response(response.clone().body, response);
      cacheable.headers.set("Cache-Control", `public, max-age=${GOOGLE_PLACE_EDGE_TTL_SECONDS}`);
      await edgeCache.put(cacheKey, cacheable);
    }
    return response;
  } catch {
    return jsonResponse(
      { ok: false, source: "fallback", reason: "network_error", quotaExceeded: false, place: null },
      200
    );
  }
}

// ── Main Edge API Router ─────────────────────────────────────────────────────
export async function handleApiRequest(
  request: Request,
  env: EdgeApiEnv = {}
): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method.toUpperCase();

  // ── Public Endpoints ───────────────────────────────────────────────────────
  if (pathname === "/api/health" && method === "GET") {
    return jsonResponse(
      { ok: true, service: "hannachi-web", timestamp: new Date().toISOString() },
      200
    );
  }

  if (pathname === "/api/google-place" && method === "GET") {
    return handleGooglePlace(request, env);
  }

  if (pathname === "/api/reverse-geocode" && method === "GET") {
    const lat = Number(url.searchParams.get("lat"));
    const lng = Number(url.searchParams.get("lng"));
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return jsonResponse({ ok: false, error: "Invalid coordinates" }, 400);
    }
    const payload = await reverseGeocodeCoords(lat, lng, env.GOOGLE_MAPS_API_KEY || "");
    return jsonResponse(payload, 200);
  }

  if (pathname === "/api/geocode" && method === "GET") {
    const rawQuery = sanitizeSingleLine(url.searchParams.get("q") || "", 160);
    if (rawQuery.length < 2) {
      return jsonResponse(
        { ok: false, error: "Bitte geben Sie einen Ort, eine PLZ oder Straße ein." },
        400
      );
    }
    const payload = await forwardGeocodeQuery(rawQuery, env.GOOGLE_MAPS_API_KEY || "");
    return jsonResponse(payload, 200);
  }

  if (pathname === "/api/marketplace" && method === "GET") {
    const [items, settings] = await Promise.all([
      loadMarketplaceItemsEdge(env),
      loadMarketplaceSettingsEdge(env),
    ]);
    return jsonResponse({ ok: true, items, settings }, 200);
  }

  if (pathname === "/api/repair-request" && method === "POST") {
    const clientIp = getClientIp(request);
    if (checkRateLimitMap(rateLimitStore, clientIp, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS)) {
      return jsonResponse(
        {
          ok: false,
          error:
            "Zu viele Anfragen in kurzer Zeit. Bitte warten Sie einen Moment oder rufen Sie uns direkt an.",
        },
        429
      );
    }

    const parsedJson = await parseJsonObjectBody(request, 64 * 1024);
    if (!parsedJson.ok) return parsedJson.response;
    const rawBody = parsedJson.data;

    if (typeof rawBody.website === "string" && rawBody.website.trim().length > 0) {
      return jsonResponse(
        { ok: true, referenceId: "HN-0000", receivedAt: new Date().toISOString() },
        200
      );
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
      callbackTime:
        sanitizeSingleLine(rawBody.callbackTime, 120) || "Jederzeit erreichbar",
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
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      return jsonResponse(
        { ok: false, error: "Bitte überprüfen Sie Ihre Pflichtangaben.", fieldErrors },
        400
      );
    }

    const currentTickets = await loadTicketsEdge(env);
    const existingIds = new Set(currentTickets.map((t) => t.id));
    const clientRefRaw =
      typeof rawBody.clientReferenceId === "string"
        ? rawBody.clientReferenceId.trim()
        : "";
    let referenceId =
      /^HN-\d{4}$/.test(clientRefRaw) &&
      clientRefRaw !== "HN-0000" &&
      !existingIds.has(clientRefRaw)
        ? clientRefRaw
        : generateReferenceId();
    while (existingIds.has(referenceId) || referenceId === "HN-0000") {
      referenceId = generateReferenceId();
    }
    const receivedAt = new Date().toISOString();

    const isHomeVisit = parsed.data.visitType === "home_visit";
    const resolvedCoords = isHomeVisit
      ? resolveDefaultCoordsForZip(parsed.data.zip, parsed.data.coordinates || null)
      : { lat: 52.2647082, lng: 8.0567763, accuracy: 10 };

    const safeMapsLocationUrl = isSafeGoogleMapsUrl(parsed.data.mapsLocationUrl)
      ? parsed.data.mapsLocationUrl.trim()
      : `https://www.google.com/maps?q=${resolvedCoords.lat},${resolvedCoords.lng}`;

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
      mapsLocationUrl: safeMapsLocationUrl,
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

    await persistTicketsEdge([newTicket, ...currentTickets], env);

    return jsonResponse(
      {
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
      },
      201
    );
  }

  // ── Admin Authentication Endpoints (/api/admin/login|session|logout) ───────
  if (pathname === "/api/admin/login" && method === "POST") {
    const clientIp = getClientIp(request);
    if (
      checkRateLimitMap(
        adminLoginAttempts,
        clientIp,
        ADMIN_LOGIN_WINDOW_MS,
        ADMIN_LOGIN_MAX_ATTEMPTS
      )
    ) {
      return jsonResponse(
        { ok: false, error: "Zu viele Anmeldeversuche. Bitte warten Sie einige Minuten." },
        429
      );
    }

    const parsedJson = await parseJsonObjectBody(request, 16 * 1024);
    if (!parsedJson.ok) return parsedJson.response;
    const rawBody = parsedJson.data;

    const candidate =
      typeof rawBody.password === "string"
        ? rawBody.password.trim()
        : typeof rawBody.pin === "string"
        ? rawBody.pin.trim()
        : "";

    const envPass = (env.ADMIN_PASSWORD || env.ADMIN_PIN || "").trim();
    const valid = await verifyAdminPasswordEdge(candidate, envPass);
    if (!valid) {
      return jsonResponse(
        { ok: false, error: "Ungültiges Passwort. Bitte erneut versuchen." },
        401
      );
    }

    adminLoginAttempts.delete(clientIp);
    const signingSecret = await resolveSigningSecret(env);
    const token = await signHmacSessionToken(signingSecret, ADMIN_TOKEN_TTL_MS);
    const tokenHash = await sha256Hex(token);
    await persistEdgeSession(token, tokenHash, Date.now() + ADMIN_TOKEN_TTL_MS, env);

    const cookieHeader = buildAdminSessionCookieHeader(
      request,
      token,
      Math.floor(ADMIN_TOKEN_TTL_MS / 1000)
    );

    return jsonResponse(
      { ok: true, token, owner: "Kamal Hannachi" },
      200,
      { "Set-Cookie": cookieHeader }
    );
  }

  if (pathname === "/api/admin/session" && method === "GET") {
    const authed = await isAuthorizedAdminRequest(request, env);
    if (!authed) {
      return jsonResponse({ ok: false, authenticated: false }, 200);
    }
    return jsonResponse(
      { ok: true, authenticated: true, owner: "Kamal Hannachi" },
      200
    );
  }

  if (pathname === "/api/admin/logout" && method === "POST") {
    const { token } = extractAdminTokenWithSource(request);
    if (token) {
      await revokeEdgeSession(token, env);
    }
    const clearCookie = buildAdminSessionCookieHeader(request, "", 0);
    return jsonResponse({ ok: true }, 200, { "Set-Cookie": clearCookie });
  }

  // ── Protected Admin Marketplace Photo Upload Endpoints ─────────────────────
  if (pathname === "/api/admin/marketplace/upload" && method === "POST") {
    if (!(await isAuthorizedAdminRequest(request, env))) {
      return jsonResponse({ ok: false, error: "Nicht autorisiert." }, 401);
    }

    const parsedJson = await parseJsonObjectBody(request, 12 * 1024 * 1024);
    if (!parsedJson.ok) return parsedJson.response;
    const raw = parsedJson.data;

    const dataUrl = typeof raw.dataUrl === "string" ? raw.dataUrl.trim() : "";
    const match = /^data:image\/(webp|jpeg|jpg|png);base64,([A-Za-z0-9+/=]+)$/i.exec(
      dataUrl
    );
    if (!match || !isValidBase64ImageDataUrl(dataUrl)) {
      return jsonResponse(
        { ok: false, error: "Ungültiges Bildformat oder Bildsignatur. Erlaubt sind WebP, JPEG und PNG." },
        400
      );
    }
    if (dataUrl.length > 2_500_000) {
      return jsonResponse(
        { ok: false, error: "Bildgröße überschreitet das Edge-Limit (max. 2,5 MB)." },
        400
      );
    }

    const photoId = `ph-${Date.now().toString(36)}-${randomHex(4)}`;
    const label = sanitizeSingleLine(raw.label, 60);
    const approxBytes = Math.floor((match[2].length * 3) / 4);

    return jsonResponse(
      {
        ok: true,
        photo: label
          ? { id: photoId, url: dataUrl, label }
          : { id: photoId, url: dataUrl },
        bytes: approxBytes,
      },
      201
    );
  }

  if (
    pathname.startsWith("/api/admin/marketplace/upload/") &&
    method === "DELETE"
  ) {
    if (!(await isAuthorizedAdminRequest(request, env))) {
      return jsonResponse({ ok: false, error: "Nicht autorisiert." }, 401);
    }
    return jsonResponse({ ok: true }, 200);
  }

  // ── Protected Admin Tickets Endpoints ──────────────────────────────────────
  if (pathname === "/api/admin/tickets" && method === "GET") {
    if (!(await isAuthorizedAdminRequest(request, env))) {
      return jsonResponse({ ok: false, error: "Nicht autorisiert." }, 401);
    }
    const tickets = await loadTicketsEdge(env);
    return jsonResponse({ ok: true, tickets }, 200);
  }

  if (pathname === "/api/admin/tickets" && method === "POST") {
    if (!(await isAuthorizedAdminRequest(request, env))) {
      return jsonResponse({ ok: false, error: "Nicht autorisiert." }, 401);
    }

    const parsedJson = await parseJsonObjectBody(request);
    if (!parsedJson.ok) return parsedJson.response;
    const raw = parsedJson.data;

    const nowIso = new Date().toISOString();
    const requestedId = sanitizeSingleLine(raw.id, 20);
    const referenceId = /^HN-\d{4}$/.test(requestedId)
      ? requestedId
      : generateReferenceId();
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
      problem:
        sanitizeText(raw.problem, 1500, true) ||
        "Telefonische Geräte- / Ersatzteilanfrage",
      urgency:
        raw.urgency === "notfall" || raw.urgency === "express" ? raw.urgency : "normal",
      callbackTime:
        sanitizeSingleLine(raw.callbackTime, 120) || "Jederzeit erreichbar",
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
        (sanitizeSingleLine(raw.scheduledSlot, 30) as AdminTimeSlot) ||
        "Nach Vereinbarung",
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

    const tickets = (await loadTicketsEdge(env)).filter((t) => t.id !== newTicket.id);
    await persistTicketsEdge([newTicket, ...tickets], env);
    return jsonResponse({ ok: true, ticket: newTicket }, 201);
  }

  if (pathname === "/api/admin/tickets/bulk" && method === "POST") {
    if (!(await isAuthorizedAdminRequest(request, env))) {
      return jsonResponse({ ok: false, error: "Nicht autorisiert." }, 401);
    }

    const parsedJson = await parseJsonObjectBody(request);
    if (!parsedJson.ok) return parsedJson.response;
    const raw = parsedJson.data as {
      ids?: unknown;
      action?: unknown;
      status?: unknown;
    };

    const ids = Array.isArray(raw.ids)
      ? raw.ids.map((id) => sanitizeSingleLine(id, 30)).filter(Boolean)
      : [];
    if (ids.length === 0) {
      return jsonResponse({ ok: false, error: "Keine Aufträge ausgewählt." }, 400);
    }

    const idSet = new Set(ids);
    const currentTickets = await loadTicketsEdge(env);

    if (raw.action === "delete") {
      const remaining = currentTickets.filter((t) => !idSet.has(t.id));
      await persistTicketsEdge(remaining, env);
      return jsonResponse({ ok: true, tickets: remaining }, 200);
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

    await persistTicketsEdge(updatedTickets, env);
    return jsonResponse({ ok: true, tickets: updatedTickets }, 200);
  }

  if (pathname.startsWith("/api/admin/tickets/") && (method === "PATCH" || method === "DELETE")) {
    if (!(await isAuthorizedAdminRequest(request, env))) {
      return jsonResponse({ ok: false, error: "Nicht autorisiert." }, 401);
    }

    const ticketId = sanitizeSingleLine(
      decodeURIComponent(pathname.slice("/api/admin/tickets/".length)),
      30
    );

    if (method === "DELETE") {
      const tickets = await loadTicketsEdge(env);
      const filtered = tickets.filter((t) => t.id !== ticketId);
      await persistTicketsEdge(filtered, env);
      return jsonResponse({ ok: true }, 200);
    }

    // PATCH /api/admin/tickets/:id
    const parsedJson = await parseJsonObjectBody(request);
    if (!parsedJson.ok) return parsedJson.response;
    const raw = parsedJson.data;

    const tickets = await loadTicketsEdge(env);
    let idx = tickets.findIndex((t) => t.id === ticketId);

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
        callbackTime:
          sanitizeSingleLine(baseRaw.callbackTime, 120) || "Jederzeit erreichbar",
        zip,
        streetAddress: sanitizeSingleLine(baseRaw.streetAddress, 200),
        mapsLocationUrl: isSafeGoogleMapsUrl(baseRaw.mapsLocationUrl)
          ? String(baseRaw.mapsLocationUrl).trim()
          : `https://www.google.com/maps?q=${coords.lat},${coords.lng}`,
        locationVerified: Boolean(baseRaw.locationVerified),
        coordinates: coords,
        name: sanitizeSingleLine(baseRaw.name, 120) || "Kunde",
        phone: sanitizeSingleLine(baseRaw.phone, 30) || "0541",
        email: sanitizeSingleLine(baseRaw.email, 160),
        photoName: null,
        status: "new",
        scheduledDate: sanitizeSingleLine(baseRaw.scheduledDate, 20),
        scheduledSlot:
          (sanitizeSingleLine(baseRaw.scheduledSlot, 30) as AdminTimeSlot) ||
          "Nach Vereinbarung",
        technicianNotes: sanitizeText(baseRaw.technicianNotes, 2000, true),
        invoiceNumber:
          sanitizeSingleLine(baseRaw.invoiceNumber, 40) ||
          `RE-${new Date().getFullYear()}-${ticketId.replace("HN-", "")}`,
        invoiceItems: [],
        completionDetails: null,
      };
      tickets.unshift(upserted);
      idx = 0;
    }

    if (idx === -1) {
      return jsonResponse({ ok: false, error: "Auftrag nicht gefunden." }, 404);
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

    let nextInvoiceItems = current.invoiceItems;
    if (Array.isArray(raw.invoiceItems)) {
      nextInvoiceItems = raw.invoiceItems
        .slice(0, 20)
        .map((item: unknown, i: number): AdminInvoiceItem => {
          const obj = (item && typeof item === "object" ? item : {}) as Record<
            string,
            unknown
          >;
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
      name:
        typeof raw.name === "string" && raw.name.trim().length > 0
          ? sanitizeSingleLine(raw.name, 120)
          : current.name,
      phone:
        typeof raw.phone === "string" && raw.phone.trim().length > 0
          ? sanitizeSingleLine(raw.phone, 30)
          : current.phone,
      email:
        typeof raw.email === "string" ? sanitizeSingleLine(raw.email, 160) : current.email,
      device:
        typeof raw.device === "string" && raw.device.trim().length > 0
          ? sanitizeSingleLine(raw.device, 120)
          : current.device,
      brand:
        typeof raw.brand === "string" && raw.brand.trim().length > 0
          ? sanitizeSingleLine(raw.brand, 120)
          : current.brand,
      model:
        typeof raw.model === "string" ? sanitizeSingleLine(raw.model, 120) : current.model,
      problem:
        typeof raw.problem === "string" && raw.problem.trim().length > 0
          ? sanitizeText(raw.problem, 1500, true)
          : current.problem,
      scheduledDate:
        typeof raw.scheduledDate === "string"
          ? sanitizeSingleLine(raw.scheduledDate, 20)
          : current.scheduledDate,
      scheduledSlot:
        typeof raw.scheduledSlot === "string"
          ? (sanitizeSingleLine(raw.scheduledSlot, 30) as AdminTimeSlot)
          : current.scheduledSlot,
      technicianNotes:
        typeof raw.technicianNotes === "string"
          ? sanitizeText(raw.technicianNotes, 2000, true)
          : current.technicianNotes,
      streetAddress:
        typeof raw.streetAddress === "string"
          ? sanitizeSingleLine(raw.streetAddress, 200)
          : current.streetAddress,
      zip: typeof raw.zip === "string" ? sanitizeSingleLine(raw.zip, 80) : current.zip,
      invoiceItems: nextInvoiceItems,
      completionDetails: nextCompletionDetails,
      ...(nextMpItemId ? { marketplaceItemId: nextMpItemId } : {}),
      ...(nextMpItemTitle ? { marketplaceItemTitle: nextMpItemTitle } : {}),
    };

    const nextList = [...tickets];
    nextList[idx] = updated;
    await persistTicketsEdge(nextList, env);

    let updatedMarketplaceItems: MarketplaceItem[] | undefined;
    if (
      nextCompletionDetails?.outcome === "sold" &&
      nextCompletionDetails.marketplaceItemId
    ) {
      const mpItems = await loadMarketplaceItemsEdge(env);
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
        await persistMarketplaceItemsEdge(nextMpItems, env);
        updatedMarketplaceItems = nextMpItems;
      }
    }

    return jsonResponse(
      {
        ok: true,
        ticket: updated,
        savedToWebsite: true,
        ...(updatedMarketplaceItems ? { updatedMarketplaceItems } : {}),
      },
      200
    );
  }

  // ── Protected Admin Marketplace Endpoints ──────────────────────────────────
  if (pathname === "/api/admin/marketplace/settings" && method === "PATCH") {
    if (!(await isAuthorizedAdminRequest(request, env))) {
      return jsonResponse({ ok: false, error: "Nicht autorisiert." }, 401);
    }
    const parsedJson = await parseJsonObjectBody(request);
    if (!parsedJson.ok) return parsedJson.response;
    const raw = parsedJson.data;
    const current = await loadMarketplaceSettingsEdge(env);
    const nextSettings: MarketplaceSettings = {
      hideSoldPublicly:
        typeof raw.hideSoldPublicly === "boolean"
          ? raw.hideSoldPublicly
          : current.hideSoldPublicly,
    };
    await persistMarketplaceSettingsEdge(nextSettings, env);
    return jsonResponse({ ok: true, settings: nextSettings }, 200);
  }

  if (pathname === "/api/admin/marketplace" && method === "POST") {
    if (!(await isAuthorizedAdminRequest(request, env))) {
      return jsonResponse({ ok: false, error: "Nicht autorisiert." }, 401);
    }

    const parsedJson = await parseJsonObjectBody(request, 6 * 1024 * 1024);
    if (!parsedJson.ok) return parsedJson.response;
    const raw = parsedJson.data;

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

    const title = sanitizeSingleLine(raw.title, 160) || `${catMeta.label} Angebot`;
    const brand = sanitizeSingleLine(raw.brand, 80) || "Miele";
    const skuOrEnr = sanitizeSingleLine(raw.skuOrEnr, 80) || "Auf Anfrage";
    const shortSpecs =
      sanitizeSingleLine(raw.shortSpecs, 180) ||
      "Geprüfte Markenqualität · Sofort abholbereit in Osnabrück";

    const rawBullets = Array.isArray(raw.bulletSpecs) ? raw.bulletSpecs : [];
    const bullet1 = sanitizeSingleLine(rawBullets[0], 160) || shortSpecs;
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
      `mp-${Date.now().toString(36)}-${randomDigits3()}`;

    const current = await loadMarketplaceItemsEdge(env);
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
        sanitizeSingleLine(raw.deviceTypeForForm, 80) || catMeta.defaultDeviceForForm,
      conditionType,
      conditionBadge:
        conditionType === "new_part" ? "Neu · Originalteil" : "Geprüft & Aufbereitet",
      warrantyBadge:
        conditionType === "new_part"
          ? "Geprüfte Passgenauigkeit"
          : "Inkl. schriftlicher Garantie",
      shortSpecs,
      bulletSpecs: [bullet1, bullet2, bullet3],
      detailedSpecs:
        Array.isArray(raw.detailedSpecs) && raw.detailedSpecs.length > 0
          ? (raw.detailedSpecs as { label: string; value: string }[])
              .slice(0, 10)
              .map((r) => ({
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

    await persistMarketplaceItemsEdge(nextItems, env);
    return jsonResponse({ ok: true, item: newItem, items: nextItems }, 201);
  }

  if (
    pathname.startsWith("/api/admin/marketplace/") &&
    (method === "PATCH" || method === "DELETE")
  ) {
    if (!(await isAuthorizedAdminRequest(request, env))) {
      return jsonResponse({ ok: false, error: "Nicht autorisiert." }, 401);
    }

    const itemId = sanitizeSingleLine(
      decodeURIComponent(pathname.slice("/api/admin/marketplace/".length)),
      60
    );
    const current = await loadMarketplaceItemsEdge(env);

    if (method === "DELETE") {
      const filtered = current.filter((i) => i.id !== itemId);
      await persistMarketplaceItemsEdge(filtered, env);
      return jsonResponse({ ok: true, items: filtered }, 200);
    }

    const idx = current.findIndex((i) => i.id === itemId);
    if (idx === -1) {
      return jsonResponse({ ok: false, error: "Angebot nicht gefunden." }, 404);
    }

    const parsedJson = await parseJsonObjectBody(request, 6 * 1024 * 1024);
    if (!parsedJson.ok) return parsedJson.response;
    const raw = parsedJson.data;

    const existing = current[idx];
    const nextAvailability: MarketplaceAvailabilityStatus =
      raw.availability === "Reserviert (Anfrage möglich)" ||
      raw.availability === "Sofort verfügbar in Osnabrück" ||
      raw.availability === "Verkauft (Abgeschlossen)"
        ? raw.availability
        : existing.availability;

    const updated: MarketplaceItem = {
      ...existing,
      updatedAt: new Date().toISOString(),
      title:
        typeof raw.title === "string" && raw.title.trim().length > 0
          ? sanitizeSingleLine(raw.title, 160)
          : existing.title,
      brand:
        typeof raw.brand === "string" && raw.brand.trim().length > 0
          ? sanitizeSingleLine(raw.brand, 80)
          : existing.brand,
      skuOrEnr:
        typeof raw.skuOrEnr === "string" && raw.skuOrEnr.trim().length > 0
          ? sanitizeSingleLine(raw.skuOrEnr, 80)
          : existing.skuOrEnr,
      shortSpecs:
        typeof raw.shortSpecs === "string" && raw.shortSpecs.trim().length > 0
          ? sanitizeSingleLine(raw.shortSpecs, 180)
          : existing.shortSpecs,
      availability: nextAvailability,
      soldAt:
        nextAvailability === "Verkauft (Abgeschlossen)"
          ? existing.soldAt || new Date().toISOString()
          : undefined,
      linkedTicketId:
        typeof raw.linkedTicketId === "string" && raw.linkedTicketId.trim().length > 0
          ? sanitizeSingleLine(raw.linkedTicketId, 30)
          : nextAvailability === "Verkauft (Abgeschlossen)"
          ? existing.linkedTicketId
          : undefined,
      photos: Array.isArray(raw.photos)
        ? sanitizePhotosList(raw.photos)
        : existing.photos,
    };

    const nextItems = [...current];
    nextItems[idx] = updated;
    await persistMarketplaceItemsEdge(nextItems, env);
    return jsonResponse({ ok: true, item: updated, items: nextItems }, 200);
  }

  return jsonResponse({ ok: false, error: "API endpoint not found" }, 404);
}
