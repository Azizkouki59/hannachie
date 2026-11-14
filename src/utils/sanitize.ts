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
