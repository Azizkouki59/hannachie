import { isSafeHttpsUrl, sanitizeSingleLine, sanitizeText } from "@/utils/sanitize";

export type WhatsAppInquiryMode = "repair" | "question";

export type WhatsAppUrgencyLevel = "normal" | "express" | "notfall";

export interface WhatsAppCoordinates {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface WhatsAppMessageInput {
  mode?: WhatsAppInquiryMode;
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

const URGENCY_LABELS: Record<WhatsAppUrgencyLevel, string> = {
  normal: "Normal (Termin in den nächsten Tagen)",
  express: "Dringend (heute oder morgen gewünscht)",
  notfall: "Notfall (Kühlgerät fällt aus / Wasser tritt aus)",
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
    return `${cleanCustom} (Sonstiges Gerät)`;
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
    "Region Osnabrück",
  ].filter(Boolean);

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    addressParts.join(", ") || "Osnabrück"
  )}`;
}

/**
 * Validates required client fields (Name, Device, Brand, Phone, Symptom)
 * before allowing a WhatsApp message to be built for Hannachi.
 */
export function validateWhatsAppFields(
  input: WhatsAppMessageInput
): WhatsAppValidationErrors {
  const mode: WhatsAppInquiryMode = input.mode === "question" ? "question" : "repair";
  const errors: WhatsAppValidationErrors = {};

  const name = sanitizeLine(input.name);
  const device = sanitizeLine(input.device);
  const customDevice = sanitizeLine(input.customDevice);
  const brand = sanitizeLine(input.brand);
  const phone = sanitizeLine(input.phone);
  const symptom = sanitizeLine(input.symptom);

  if (name.length < 2) {
    errors.name = "Bitte geben Sie Ihren vollständigen Namen ein.";
  }

  if (device.length < 1) {
    errors.device = "Bitte wählen Sie ein Gerät aus.";
  } else if ((device.includes("Anderes") || device === "Sonstiges") && customDevice.length < 2) {
    errors.customDevice =
      "Bitte nennen Sie uns kurz Ihr Gerät (z. B. Dampfgarer, Siebträger).";
  }

  if (brand.length < 1) {
    errors.brand = "Bitte wählen Sie den Hersteller / die Marke aus.";
  }

  const digitCount = phone.replace(/\D/g, "").length;
  if (phone.length < 6 || !/^[+()\d\s/-]{6,30}$/.test(phone) || digitCount < 6) {
    errors.phone =
      "Bitte geben Sie eine gültige Telefonnummer (mindestens 6 Ziffern) ein.";
  }

  if (symptom.length < 4) {
    errors.symptom =
      mode === "question"
        ? "Bitte geben Sie Ihre Frage oder Ihr Anliegen kurz ein."
        : "Bitte wählen Sie ein Fehlerbild aus oder beschreiben Sie kurz das Problem.";
  }

  return errors;
}

/**
 * Formats validated input fields into a structured, professional WhatsApp
 * message ready to send to Hannachi for either 'repair' or 'question' mode.
 */
export function formatHannachiWhatsAppMessage(input: WhatsAppMessageInput): string {
  const mode: WhatsAppInquiryMode = input.mode === "question" ? "question" : "repair";
  const name = sanitizeLine(input.name);
  const deviceDisplay = resolveDeviceDisplay(input.device, input.customDevice);
  const brand = sanitizeLine(input.brand) || "Vor Ort / siehe Typenschild";
  const model = sanitizeLine(input.model);
  const phone = sanitizeLine(input.phone);
  const symptom = sanitizeLine(input.symptom);
  const email = sanitizeLine(input.email);
  const referenceId = sanitizeLine(input.referenceId);

  const locationText = [sanitizeLine(input.streetAddress), sanitizeLine(input.location)]
    .filter(Boolean)
    .join(", ");
  const hasLocation = locationText.length > 0 || Boolean(input.coordinates);
  const mapsLink = hasLocation ? resolveMapsLink(input) : "";

  const coordsLine =
    input.locationVerified && input.coordinates
      ? `• Standort-Status: ✓ Verifiziert (${input.coordinates.lat.toFixed(5)}°, ${input.coordinates.lng.toFixed(5)}°${
          input.coordinates.accuracy ? ` · ±${Math.round(input.coordinates.accuracy)} m` : ""
        })`
      : null;

  if (mode === "question") {
    const lines: string[] = [
      `Hallo Herr Hannachi,`,
      `ich habe eine *direkte Frage*${referenceId ? ` (Nr. ${referenceId})` : ""}:`,
      ``,
      `*1. Frage / Anliegen:*`,
      `${symptom}`,
      ``,
      `*2. Gerät & Hersteller:*`,
      `• Gerät: ${deviceDisplay}`,
      `• Marke: ${brand}`,
      ...(model ? [`• Modell / E-Nr.: ${model}`] : []),
      ``,
      `*3. Kontaktdaten:*`,
      `• Name: ${name}`,
      `• Telefon: ${phone}`,
      ...(locationText ? [`• Ort / Adresse: ${locationText}`] : []),
      ...(coordsLine ? [coordsLine] : []),
      ...(email ? [`• E-Mail: ${email}`] : []),
    ];

    if (mapsLink) {
      lines.push(``, `📍 *Google Maps Standort:*`, mapsLink);
    }
    if (sanitizeLine(input.photoName)) {
      lines.push(``, `📷 (Foto beigefügt: ${sanitizeLine(input.photoName)})`);
    }

    return lines.join("\n");
  }

  const urgency = URGENCY_LABELS[input.urgency || "normal"];
  const callbackTime = sanitizeLine(input.callbackTime) || "Jederzeit erreichbar";

  const lines: string[] = [
    `Hallo Herr Hannachi,`,
    `hier ist meine *komplette Reparaturanfrage*${referenceId ? ` (Anfrage-Nr. ${referenceId})` : ""}:`,
    ``,
    `*1. Gerät & Fehlerbild:*`,
    `• Gerät: ${deviceDisplay}`,
    `• Marke: ${brand}`,
    ...(model ? [`• Modell / E-Nr.: ${model}`] : []),
    `• Fehler / Symptom: ${symptom}`,
    `• Dringlichkeit: ${urgency}`,
    ``,
    `*2. Kunde & Kontaktdaten:*`,
    `• Name: ${name}`,
    `• Telefon: ${phone}`,
    ...(locationText ? [`• Ort / Adresse: ${locationText}`] : []),
    ...(coordsLine ? [coordsLine] : []),
    ...(email ? [`• E-Mail: ${email}`] : []),
    `• Erreichbarkeit: ${callbackTime} (ausschließlich per WhatsApp)`,
  ];

  if (mapsLink) {
    lines.push(``, `📍 *Google Maps Standort / Route für Anfahrt:*`, mapsLink);
  }
  if (sanitizeLine(input.photoName)) {
    lines.push(``, `📷 (Foto vom Gerät / Typenschild: ${sanitizeLine(input.photoName)})`);
  }

  return lines.join("\n");
}

/**
 * Validates required client fields first and returns a complete WhatsApp message
 * + ready-to-send URL only when all required inputs pass validation.
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
  const cleanTarget = targetPhone.replace(/\D/g, "") || HANNACHI_WHATSAPP_PHONE;
  const whatsappUrl = `https://wa.me/${cleanTarget}?text=${encodeURIComponent(message)}`;

  return {
    valid: true,
    mode,
    message,
    whatsappUrl,
    errors: {},
  };
}
