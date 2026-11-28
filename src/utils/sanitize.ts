const CONTROL_CHARS_MULTILINE_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const CONTROL_CHARS_SINGLELINE_REGEX = /[\u0000-\u001F\u007F\r\n]/g;
const ZERO_WIDTH_REGEX = /[\u200B-\u200D\uFEFF]/g;
const ANGLE_BRACKETS_REGEX = /[<>]/g;

/**
 * Strips invisible control characters, zero-width characters, and HTML angle brackets
 * while preserving legitimate German umlauts and multiline structure when requested.
 */
export function sanitizeText(
  value: unknown,
  maxLength = 1500,
  multiline = true
): string {
  if (typeof value !== "string") return "";
  const controlRegex = multiline
    ? CONTROL_CHARS_MULTILINE_REGEX
    : CONTROL_CHARS_SINGLELINE_REGEX;

  const cleaned = value
    .replace(/\r\n/g, "\n")
    .replace(controlRegex, " ")
    .replace(ZERO_WIDTH_REGEX, "")
    .replace(ANGLE_BRACKETS_REGEX, "")
    .trim();

  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength).trim();
}

export function sanitizeSingleLine(value: unknown, maxLength = 200): string {
  return sanitizeText(value, maxLength, false).replace(/\s+/g, " ");
}

/**
 * Validates that an external URL uses strict https:// (blocking javascript:, data:, or // protocol-relative URLs).
 */
export function isSafeHttpsUrl(raw: unknown): boolean {
  if (typeof raw !== "string") return false;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("https://")) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

const ALLOWED_GOOGLE_MAPS_HOSTS = new Set([
  "www.google.com",
  "google.com",
  "maps.google.com",
  "maps.app.goo.gl",
  "goo.gl",
]);

/**
 * Validates that a dynamic map link uses strict https:// and points strictly to an official Google Maps domain.
 */
export function isSafeGoogleMapsUrl(raw: unknown): boolean {
  if (!isSafeHttpsUrl(raw)) return false;
  try {
    const parsed = new URL(String(raw).trim());
    return ALLOWED_GOOGLE_MAPS_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Verifies actual binary magic bytes for PNG, JPEG, and WebP images.
 */
export function hasValidImageMagicBytes(
  bytes: Uint8Array,
  declaredFormat: string
): boolean {
  if (bytes.length < 12) return false;
  const fmt = declaredFormat.toLowerCase();
  if (fmt === "png") {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }
  if (fmt === "jpg" || fmt === "jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (fmt === "webp") {
    return (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }
  return false;
}

/**
 * Validates a base64 image data URL (webp/jpeg/jpg/png) and verifies its decoded header magic bytes.
 */
export function isValidBase64ImageDataUrl(raw: unknown): boolean {
  if (typeof raw !== "string") return false;
  const trimmed = raw.trim();
  const match = /^data:image\/(webp|jpeg|jpg|png);base64,([A-Za-z0-9+/=]+)$/i.exec(
    trimmed
  );
  if (!match) return false;
  const ext = match[1].toLowerCase();
  const b64Prefix = match[2].slice(0, 32);
  if (b64Prefix.length < 16) return false;
  try {
    const padded = b64Prefix.slice(0, Math.floor(b64Prefix.length / 4) * 4);
    const bin = atob(padded);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    return hasValidImageMagicBytes(bytes, ext);
  } catch {
    return false;
  }
}

/**
 * Validates that an internal navigation href is strictly relative to this app and not protocol-relative (//evil.com).
 */
export function isSafeInternalHref(href: unknown): href is string {
  if (typeof href !== "string") return false;
  const trimmed = href.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("#")) return true;
  return trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.startsWith("/\\");
}

/**
 * Defensive JSON parser with runtime guard for browser storage values.
 */
export function safeJsonParse<T>(
  raw: string | null,
  guard: (value: unknown) => value is T,
  fallback: T
): T {
  if (!raw) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    return guard(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}
