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
  normal: "Normal (nächste Tage)",
  express: "Dringend (heute oder morgen)",
  notfall: "NOTFALL (Kühlgerät / Wasseraustritt)",
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
 * Formats validated input fields into a crisp, scan-friendly WhatsApp
 * message for Herr Hannachi. Includes Google Maps pin & address ONLY when
 * a home visit (`visitType === "home_visit"`) is requested.
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
  const name = sanitizeLine(input.name);
  const deviceDisplay = resolveDeviceDisplay(input.device, input.customDevice);
  const brand = sanitizeLine(input.brand) || "Siehe Typenschild";
  const model = sanitizeLine(input.model);
  const phone = sanitizeLine(input.phone);
  const symptom = sanitizeLine(input.symptom, true);
  const email = sanitizeLine(input.email);
  const referenceId = sanitizeLine(input.referenceId);
  const photoName = sanitizeLine(input.photoName);

  const equipmentLabel = `${deviceDisplay} · ${brand}${model ? ` (${model})` : ""}`;

  const locationText = isHomeVisit
    ? [sanitizeLine(input.streetAddress), sanitizeLine(input.location)].filter(Boolean).join(", ")
    : "";
  const hasPinOrLocation = isHomeVisit && (locationText.length > 0 || Boolean(input.coordinates));
  const mapsLink = hasPinOrLocation ? resolveMapsLink(input) : "";

  const verifiedCoordsTag =
    isHomeVisit && input.locationVerified && input.coordinates
      ? `${input.coordinates.lat.toFixed(5)}°, ${input.coordinates.lng.toFixed(5)}°`
      : "";

  if (mode === "question") {
    const lines: string[] = [
      `Guten Tag Herr Hannachi,`,
      `kurze *Anfrage*${referenceId ? ` · *#${referenceId}*` : ""}:`,
      ``,
      `*Anliegen:* ${symptom}`,
      `• Gerät: ${equipmentLabel}`,
      `• Abwicklung: ${
        isHomeVisit
          ? "Mobiler Vor-Ort-Termin beim Kunden (Osnabrück & Umgebung)"
          : "Persönliche Beratung / Terminvereinbarung"
      }`,
      ``,
      `*Kontakt:* ${name} · ${phone}${email ? ` · ${email}` : ""}`,
    ];

    if (hasPinOrLocation) {
      lines.push(
        ``,
        `📍 *Adresse / Einsatzort:*`,
        `• Adresse: ${locationText || "Osnabrück & Umgebung"}${
          verifiedCoordsTag ? ` (${verifiedCoordsTag})` : ""
        }`,
        mapsLink
      );
    }

    if (photoName) {
      lines.push(``, `📷 *Foto:* ${photoName} (wird im Chat mitgesendet)`);
    }

    return lines.join("\n");
  }

  const urgency = URGENCY_LABELS[input.urgency || "normal"];
  const callbackTime = sanitizeLine(input.callbackTime) || "Jederzeit erreichbar";

  const lines: string[] = [
    `Guten Tag Herr Hannachi,`,
    `neue *Vor-Ort- & Ersatzteil-Anfrage*${
      referenceId ? ` · *#${referenceId}*` : ""
    }`,
    ``,
    `*Abwicklung:* ${
      isHomeVisit
        ? "Mobiler Vor-Ort-Termin beim Kunden (Osnabrück & Umgebung)"
        : "Telefonische Beratung / Terminvereinbarung"
    }`,
    `*Priorität:* ${urgency}`,
    ``,
    `*Gerät & Anliegen:*`,
    `• Gerät: ${equipmentLabel}`,
    `• Beschreibung / Wunsch: ${symptom}`,
    ...(photoName ? [`• Foto: ${photoName} (wird im Chat angehängt)`] : []),
    ``,
    `*Kunde:*`,
    `• Name: ${name}`,
    `• Telefon: ${phone}`,
    `• Erreichbar: ${callbackTime}`,
    ...(email ? [`• E-Mail: ${email}`] : []),
  ];

  if (hasPinOrLocation) {
    lines.push(
      ``,
      `📍 *Einsatzort & Google Maps Pin (Anfahrt):*`,
      `• Adresse: ${locationText || "Siehe Karten-Pin"}${
        verifiedCoordsTag ? ` · Pin: ${verifiedCoordsTag}` : ""
      }`,
      mapsLink
    );
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
