import { isSafeHttpsUrl, sanitizeSingleLine, sanitizeText } from "@/utils/sanitize";

export type WhatsAppInquiryMode = "repair" | "question";
export type WhatsAppVisitType = "home_visit" | "workshop";
export type WhatsAppUrgencyLevel = "normal" | "express" | "notfall";

export interface WhatsAppCoordinates {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface WhatsAppMessageInput {
  mode?: WhatsAppInquiryMode;
  visitType?: WhatsAppVisitType;
  name: string;
  device: string;
  customDevice?: string;
  brand: string;
  phone: string;
  symptom: string;
  model?: string;
  urgency?: WhatsAppUrgencyLevel;
  location?: string;
  streetAddress?: string;
  mapsLocationUrl?: string;
  locationVerified?: boolean;
  coordinates?: WhatsAppCoordinates | null;
  callbackTime?: string;
  email?: string;
  photoName?: string | null;
  hasTypeplatePhoto?: boolean;
  referenceId?: string;
}

export type WhatsAppValidationField =
  | "name"
  | "device"
  | "customDevice"
  | "brand"
  | "phone"
  | "symptom";

export type WhatsAppValidationErrors = Partial<Record<WhatsAppValidationField, string>>;

export type WhatsAppBuildResult =
  | {
      valid: true;
      mode: WhatsAppInquiryMode;
      message: string;
      whatsappUrl: string;
      errors: WhatsAppValidationErrors;
    }
  | {
      valid: false;
      mode: WhatsAppInquiryMode;
      message: "";
      whatsappUrl: "";
      errors: WhatsAppValidationErrors;
    };

export const HANNACHI_WHATSAPP_PHONE = "491703493494";

export const DEFAULT_WHATSAPP_GREETING = [
  "✨ *Neue Anfrage – Hannachi Osnabrück*",
  "Hallo Herr Hannachi,",
  "",
  "✏️ *Anliegen:* Anfrage zu einem Hausgerät / Original-Ersatzteil",
  "⚙️ *Gerät & Marke:* (bitte kurz ergänzen)",
  "ℹ️ *Typenschild (E-Nr.):* Foto oder Nummer folgt im Chat",
  "➡️ *Region:* Osnabrück",
  "",
  "Ich freue mich auf Ihre kurze Rückmeldung!",
].join("\n");

export interface QuickWhatsAppOptions {
  title: string;
  device?: string;
  brand?: string;
  part?: string;
  detail: string;
  photoHint?: boolean;
  region?: string;
  closingLine?: string;
}

/**
 * Maps common 4-byte astral-plane emojis (UTF-16 surrogate pairs, U+10000+)
 * to 100% BMP color emojis (<= U+FFFF, max 3-byte UTF-8) so WhatsApp click-to-chat
 * links (api.whatsapp.com / WhatsApp Desktop / WhatsApp Web) NEVER render U+FFFD.
 */
const ASTRAL_TO_BMP_EMOJI_MAP: Record<string, string> = {
  "👋": "✨",
  "🔧": "⚙️",
  "🛠️": "⚙️",
  "🛠": "⚙️",
  "📍": "➡️",
  "🗺️": "➡️",
  "🗺": "➡️",
  "📞": "☎️",
  "📱": "☎️",
  "📧": "✉️",
  "📩": "✉️",
  "🚨": "❗",
  "📅": "⏰",
  "🕒": "⏰",
  "🔥": "☀️",
  "🧊": "❄️",
  "🔹": "▪️",
  "🔸": "▪️",
  "📷": "ℹ️",
  "📸": "ℹ️",
  "📦": "⭐",
  "🏷️": "ℹ️",
  "🏷": "ℹ️",
  "📋": "✅",
  "💶": "⭐",
  "👤": "☑️",
  "🧺": "⚙️",
  "🍽️": "⚙️",
  "🍽": "⚙️",
  "💨": "⚙️",
  "📡": "⚡",
  "🔌": "⚡",
};

/**
 * Ensures outgoing WhatsApp click-to-chat text contains ONLY BMP characters
 * (zero UTF-16 surrogate pairs U+D800-U+DFFF and zero U+FFFD replacement chars),
 * guaranteeing crisp native color emojis across WhatsApp iOS, Android, Web & Desktop.
 */
function sanitizeWhatsAppUrlText(text: string): string {
  let normalized = text;
  for (const [astral, bmp] of Object.entries(ASTRAL_TO_BMP_EMOJI_MAP)) {
    if (normalized.includes(astral)) {
      normalized = normalized.split(astral).join(bmp);
    }
  }
  return normalized
    .replace(/[\uD800-\uDFFF]|\uFFFD/g, "")
    .split("\n")
    .map((line) => line.replace(/[ \t]{2,}/g, " ").trimEnd())
    .join("\n")
    .trim();
}

/**
 * Returns a BMP-safe native color emoji (<= U+FFFF, zero surrogate pairs)
 * matching the appliance category so it never breaks into U+FFFD in WhatsApp.
 */
export function getDeviceEmoji(deviceDisplay: string): string {
  const normalized = deviceDisplay.toLowerCase();
  if (normalized.includes("kühl") || normalized.includes("kuehl") || normalized.includes("gefrier")) {
    return "❄️";
  }
  if (
    normalized.includes("ofen") ||
    normalized.includes("herd") ||
    normalized.includes("ceran") ||
    normalized.includes("induktion") ||
    normalized.includes("kochfeld")
  ) {
    return "☀️";
  }
  if (normalized.includes("kaffee") || normalized.includes("siebträger")) {
    return "☕";
  }
  if (
    normalized.includes("mikrowelle") ||
    normalized.includes("platine") ||
    normalized.includes("elektronik")
  ) {
    return "⚡";
  }
  return "⚙️";
}

function getUrgencyEmoji(urgency: WhatsAppUrgencyLevel): string {
  switch (urgency) {
    case "notfall":
      return "❗";
    case "express":
      return "⚡";
    case "normal":
    default:
      return "⏰";
  }
}

/**
 * Builds a clean, scannable WhatsApp message with BMP-safe color emojis
 * and clear fields for quick-tap entry points (Hero, 3D Explorer, Mobile Dock, Side Widget, Services).
 */
export function formatQuickWhatsAppMessage({
  title,
  device,
  brand,
  part,
  detail,
  photoHint = false,
  region = "Osnabrück",
  closingLine = "Vielen Dank vorab – ich freue mich auf Ihre kurze Rückmeldung.",
}: QuickWhatsAppOptions): string {
  const cleanTitle = sanitizeSingleLine(title, 80) || "Kurze Anfrage";
  const cleanDevice = device ? sanitizeSingleLine(device, 120) : "";
  const cleanBrand = brand ? sanitizeSingleLine(brand, 80) : "";
  const cleanPart = part ? sanitizeSingleLine(part, 140) : "";
  const cleanDetail = sanitizeSingleLine(detail, 260);
  const cleanRegion = sanitizeSingleLine(region, 80);
  const cleanClosing = closingLine ? sanitizeSingleLine(closingLine, 180) : "";

  const deviceLine = cleanDevice
    ? `${getDeviceEmoji(cleanDevice)} *Gerät:* ${cleanDevice}${cleanBrand ? ` · ${cleanBrand}` : ""}`
    : cleanBrand
    ? `⚙️ *Marke:* ${cleanBrand}`
    : "";

  const lines: string[] = [
    `✨ *${cleanTitle} – Hannachi Osnabrück*`,
    `Hallo Herr Hannachi,`,
    ``,
    ...(deviceLine ? [deviceLine] : []),
    ...(cleanPart ? [`☑️ *Bauteil:* ${cleanPart}`] : []),
    ...(cleanDetail ? [`✏️ *Anliegen:* ${cleanDetail}`] : []),
    ...(photoHint ? [`ℹ️ *Typenschild (E-Nr.):* Foto oder Nummer sende ich direkt hier im Chat`] : []),
    ...(cleanRegion ? [`➡️ *Region:* ${cleanRegion}`] : []),
    ...(cleanClosing ? [``, cleanClosing] : []),
  ];

  return lines.join("\n");
}

export function buildWhatsAppDirectUrl(
  message: string = DEFAULT_WHATSAPP_GREETING,
  targetPhone: string = HANNACHI_WHATSAPP_PHONE
): string {
  const cleanTarget = targetPhone.replace(/\D/g, "") || HANNACHI_WHATSAPP_PHONE;
  const trimmed = sanitizeWhatsAppUrlText(message);
  if (!trimmed) {
    return `https://api.whatsapp.com/send?phone=${cleanTarget}`;
  }
  return `https://api.whatsapp.com/send?phone=${cleanTarget}&text=${encodeURIComponent(trimmed)}`;
}

export function buildWhatsAppWebUrl(
  message: string = DEFAULT_WHATSAPP_GREETING,
  targetPhone: string = HANNACHI_WHATSAPP_PHONE
): string {
  const cleanTarget = targetPhone.replace(/\D/g, "") || HANNACHI_WHATSAPP_PHONE;
  const trimmed = sanitizeWhatsAppUrlText(message);
  const base = `https://web.whatsapp.com/send?phone=${cleanTarget}`;
  return trimmed ? `${base}&text=${encodeURIComponent(trimmed)}` : base;
}

const URGENCY_LABELS: Record<WhatsAppUrgencyLevel, string> = {
  normal: "Normal",
  express: "Dringend",
  notfall: "Sehr dringend",
};

function sanitizeLine(value?: string | null, multiline = false): string {
  return multiline
    ? sanitizeText(value, 1500, true)
    : sanitizeSingleLine(value, 300);
}

function resolveDeviceDisplay(device: string, customDevice?: string): string {
  const cleanDevice = sanitizeLine(device);
  const cleanCustom = sanitizeLine(customDevice);
  const isOther = cleanDevice.includes("Anderes") || cleanDevice === "Sonstiges";

  if (isOther && cleanCustom) {
    return cleanCustom;
  }
  return cleanDevice || "Haushaltsgerät";
}

function resolveMapsLink(input: WhatsAppMessageInput): string {
  const explicitUrl = sanitizeLine(input.mapsLocationUrl);
  if (isSafeHttpsUrl(explicitUrl)) {
    return explicitUrl;
  }

  if (
    input.coordinates &&
    Number.isFinite(input.coordinates.lat) &&
    Number.isFinite(input.coordinates.lng)
  ) {
    return `https://www.google.com/maps?q=${input.coordinates.lat.toFixed(6)},${input.coordinates.lng.toFixed(6)}`;
  }

  const addressParts = [
    sanitizeLine(input.streetAddress),
    sanitizeLine(input.location),
    "Osnabrück",
  ].filter(Boolean);

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    addressParts.join(", ") || "Osnabrück"
  )}`;
}

/**
 * Validates client fields before building a WhatsApp message.
 * Phone is optional because WhatsApp automatically identifies the sender's number;
 * if entered, it must be a valid phone number.
 */
export function validateWhatsAppFields(
  input: WhatsAppMessageInput
): WhatsAppValidationErrors {
  const errors: WhatsAppValidationErrors = {};

  const device = sanitizeLine(input.device);
  const customDevice = sanitizeLine(input.customDevice);
  const phone = sanitizeLine(input.phone);
  const symptom = sanitizeLine(input.symptom);

  if (device.length < 1) {
    errors.device = "Bitte Gerät wählen.";
  } else if ((device.includes("Anderes") || device === "Sonstiges") && customDevice.length < 2) {
    errors.customDevice = "Bitte Gerät kurz nennen (z. B. Trockner).";
  }

  if (phone.length > 0) {
    const digitCount = phone.replace(/\D/g, "").length;
    if (phone.length < 6 || !/^[+()\d\s/-]{6,30}$/.test(phone) || digitCount < 6) {
      errors.phone = "Bitte gültige Nummer eingeben (mind. 6 Ziffern).";
    }
  }

  if (symptom.length < 3) {
    errors.symptom = "Bitte Anliegen antippen oder kurz eingeben.";
  }

  return errors;
}

function splitRequestTag(rawSymptom: string): { tag: string; body: string } {
  const match = rawSymptom.match(/^\[([^\]]+)\]\s*(.*)$/s);
  if (!match) {
    return { tag: "", body: rawSymptom };
  }
  return {
    tag: match[1].trim(),
    body: match[2].trim() || rawSymptom,
  };
}

function isPlaceholderName(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return !normalized || normalized === "interessent (osnabrück)" || normalized === "interessent";
}

/**
 * Formats validated fields into a short, symbol-led WhatsApp message for Herr Hannachi.
 */
export function formatHannachiWhatsAppMessage(input: WhatsAppMessageInput): string {
  const mode: WhatsAppInquiryMode = input.mode === "question" ? "question" : "repair";
  const visitType: WhatsAppVisitType =
    input.visitType === "workshop"
      ? "workshop"
      : input.visitType === "home_visit"
      ? "home_visit"
      : mode === "question"
      ? "workshop"
      : "home_visit";

  const isHomeVisit = visitType === "home_visit";
  const rawName = sanitizeLine(input.name);
  const customerName = isPlaceholderName(rawName) ? "" : rawName;
  const deviceDisplay = resolveDeviceDisplay(input.device, input.customDevice);
  const deviceEmoji = getDeviceEmoji(deviceDisplay);
  const brand = sanitizeLine(input.brand);
  const model = sanitizeLine(input.model);
  const phone = sanitizeLine(input.phone);
  const rawSymptom = sanitizeLine(input.symptom, true);
  const { tag: requestTag, body: cleanSymptom } = splitRequestTag(rawSymptom);
  const callbackTime = sanitizeLine(input.callbackTime);
  const email = sanitizeLine(input.email);
  const referenceId = sanitizeLine(input.referenceId);
  const photoName = sanitizeLine(input.photoName);

  const equipmentSummary = `${deviceDisplay}${brand ? ` · ${brand}` : ""}`;

  const locationText = isHomeVisit
    ? [sanitizeLine(input.streetAddress), sanitizeLine(input.location)].filter(Boolean).join(", ")
    : "";
  const hasExplicitPin = Boolean(input.locationVerified || input.coordinates || sanitizeLine(input.streetAddress));
  const mapsLink = isHomeVisit && hasExplicitPin ? resolveMapsLink(input) : "";

  const contactLine =
    phone && customerName
      ? `☎️ *Kontakt:* ${customerName} · ${phone}`
      : phone
      ? `☎️ *Telefon:* ${phone}`
      : customerName
      ? `☑️ *Name:* ${customerName}`
      : "";

  const headerEmoji = mode === "question" ? "❓" : "✅";
  const headerLabel =
    mode === "question"
      ? "Kurze Frage"
      : requestTag || "Neue Anfrage";

  const urgencyKey: WhatsAppUrgencyLevel = input.urgency || "normal";
  const showCallbackTime =
    Boolean(callbackTime) && callbackTime.toLowerCase() !== "jederzeit erreichbar";

  const lines: string[] = [
    `${headerEmoji} *${headerLabel}${referenceId ? ` · #${referenceId}` : ""}*`,
    `Hallo Herr Hannachi,`,
    ``,
    `${deviceEmoji} *Gerät:* ${equipmentSummary}`,
    ...(model ? [`ℹ️ *Modell / E-Nr.:* ${model}`] : []),
    `✏️ *Anliegen:* ${cleanSymptom}`,
    ...(urgencyKey !== "normal"
      ? [`${getUrgencyEmoji(urgencyKey)} *Priorität:* ${URGENCY_LABELS[urgencyKey]}`]
      : []),
    ...(showCallbackTime ? [`⏰ *Erreichbarkeit:* ${callbackTime}`] : []),
    ...(locationText ? [`➡️ *PLZ / Ort:* ${locationText}`] : []),
    ...(mapsLink ? [`➡️ *Standort (Maps):* ${mapsLink}`] : []),
    ...(contactLine ? [contactLine] : []),
    ...(email ? [`✉️ *E-Mail:* ${email}`] : []),
    ...(photoName
      ? [`ℹ️ *Typenschild-Foto:* ${photoName} (sende ich gleich im Chat)`]
      : input.hasTypeplatePhoto
      ? [`ℹ️ *Typenschild-Foto:* Sende ich direkt als Foto hier im Chat`]
      : []),
    ``,
    `Vielen Dank vorab – ich freue mich auf Ihre Rückmeldung.`,
  ];

  return lines.join("\n");
}

/**
 * Validates fields and returns a ready-to-send WhatsApp message + wa.me URL.
 */
export function createHannachiWhatsAppPayload(
  input: WhatsAppMessageInput,
  targetPhone: string = HANNACHI_WHATSAPP_PHONE
): WhatsAppBuildResult {
  const mode: WhatsAppInquiryMode = input.mode === "question" ? "question" : "repair";
  const errors = validateWhatsAppFields(input);

  if (Object.keys(errors).length > 0) {
    return {
      valid: false,
      mode,
      message: "",
      whatsappUrl: "",
      errors,
    };
  }

  const message = formatHannachiWhatsAppMessage(input);
  const whatsappUrl = buildWhatsAppDirectUrl(message, targetPhone);

  return {
    valid: true,
    mode,
    message,
    whatsappUrl,
    errors: {},
  };
}
