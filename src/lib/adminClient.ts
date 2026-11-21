import {
  ADMIN_STATUS_META,
  ADMIN_URGENCY_META,
  calculateTicketTotals,
  formatEuro,
  getTodayIsoDate,
  normalizeSimpleStatus,
  stripMockTickets,
  type AdminRepairTicket,
} from "./adminTypes";
import { osnabrueckServiceAreas } from "./repairRequest";
import { business } from "@/data/site";

const ADMIN_TOKEN_STORAGE_KEY = "hannachi_admin_session_token_v1";
const ADMIN_LOCAL_TICKETS_KEY = "hannachi_admin_local_tickets_v2";
const LEGACY_LOCAL_TICKETS_KEY = "hannachi_admin_local_tickets_v1";
const PENDING_SYNC_IDS_KEY = "hannachi_admin_pending_sync_ids_v1";

export function getSavedAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return (
      window.sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) ||
      window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY)
    );
  } catch {
    return null;
  }
}

export function saveAdminToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
    window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
  } catch {
    // Ignore storage quota errors
  }
}

export function clearAdminToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

function getPendingSyncIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(PENDING_SYNC_IDS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((x): x is string => typeof x === "string"));
    }
  } catch {
    // Ignore
  }
  return new Set();
}

function savePendingSyncIds(ids: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      PENDING_SYNC_IDS_KEY,
      JSON.stringify(Array.from(ids))
    );
  } catch {
    // Ignore
  }
}

export function removePendingSyncId(ticketId: string): void {
  const pending = getPendingSyncIds();
  if (pending.has(ticketId)) {
    pending.delete(ticketId);
    savePendingSyncIds(pending);
  }
}

export function loadLocalFallbackTickets(): AdminRepairTicket[] {
  if (typeof window === "undefined") return [];
  try {
    // Clean up legacy v1 storage if present and migrate only real non-mock tickets
    const legacyRaw = window.localStorage.getItem(LEGACY_LOCAL_TICKETS_KEY);
    if (legacyRaw) {
      window.localStorage.removeItem(LEGACY_LOCAL_TICKETS_KEY);
      const legacyParsed = JSON.parse(legacyRaw);
      if (Array.isArray(legacyParsed)) {
        const cleanedLegacy = stripMockTickets(legacyParsed as AdminRepairTicket[]);
        window.localStorage.setItem(ADMIN_LOCAL_TICKETS_KEY, JSON.stringify(cleanedLegacy));
        return cleanedLegacy;
      }
    }

    const raw = window.localStorage.getItem(ADMIN_LOCAL_TICKETS_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const cleaned = stripMockTickets(parsed as AdminRepairTicket[]);
      if (cleaned.length !== parsed.length) {
        window.localStorage.setItem(ADMIN_LOCAL_TICKETS_KEY, JSON.stringify(cleaned));
      }
      return cleaned;
    }
  } catch {
    // Return empty list if storage is unavailable
  }
  return [];
}

export function saveLocalFallbackTickets(tickets: AdminRepairTicket[]): void {
  if (typeof window === "undefined") return;
  try {
    const cleaned = stripMockTickets(tickets);
    window.localStorage.setItem(ADMIN_LOCAL_TICKETS_KEY, JSON.stringify(cleaned));
  } catch {
    // Ignore storage quota errors
  }
}

export function resolveCoordinatesForZip(
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
  const clean = (zipText || "").toLowerCase();
  const matched =
    osnabrueckServiceAreas.find(
      (a) =>
        clean.includes(a.zip) ||
        clean.includes(a.city.toLowerCase()) ||
        clean === a.value.toLowerCase()
    ) || osnabrueckServiceAreas[0];

  return {
    lat: matched.lat,
    lng: matched.lng,
    accuracy: 50,
  };
}

/**
 * Records a newly submitted public website repair request into local fallback storage
 * so it is guaranteed to be visible in /admin even if the preview server restarts.
 */
export function recordClientSubmittedTicket(ticket: AdminRepairTicket): void {
  if (typeof window === "undefined") return;
  const existing = loadLocalFallbackTickets();
  const filtered = existing.filter((t) => t.id !== ticket.id);
  saveLocalFallbackTickets([ticket, ...filtered]);

  const pending = getPendingSyncIds();
  pending.add(ticket.id);
  savePendingSyncIds(pending);
}

/**
 * Merges authoritative server tickets with any unsynced locally submitted tickets
 * while stripping any legacy mock IDs and respecting server deletions.
 */
export function mergeServerAndLocalTickets(
  serverTickets: AdminRepairTicket[],
  localTickets: AdminRepairTicket[]
): AdminRepairTicket[] {
  const cleanServer = stripMockTickets(serverTickets);
  const cleanLocal = stripMockTickets(localTickets);
  const pendingIds = getPendingSyncIds();

  const byId = new Map<string, AdminRepairTicket>();

  // 1. Authoritative server tickets
  for (const st of cleanServer) {
    byId.set(st.id, st);
    if (pendingIds.has(st.id)) {
      pendingIds.delete(st.id);
    }
  }

  // 2. Include any local ticket that was just created offline / pending sync
  for (const lt of cleanLocal) {
    const existing = byId.get(lt.id);
    if (!existing && pendingIds.has(lt.id)) {
      byId.set(lt.id, lt);
    } else if (existing) {
      const serverTime = Date.parse(existing.updatedAt || existing.createdAt || "") || 0;
      const localTime = Date.parse(lt.updatedAt || lt.createdAt || "") || 0;
      if (localTime > serverTime) {
        byId.set(lt.id, lt);
      }
    }
  }

  savePendingSyncIds(pendingIds);

  const merged = Array.from(byId.values()).sort(
    (a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0)
  );
  saveLocalFallbackTickets(merged);
  return merged;
}

export type WhatsAppTemplateKind =
  | "auto"
  | "appointment"
  | "on_the_way"
  | "price_estimate"
  | "question"
  | "pickup_ready"
  | "sold_thanks";

export const WHATSAPP_TEMPLATE_OPTIONS: {
  id: Exclude<WhatsAppTemplateKind, "auto" | "pickup_ready">;
  label: string;
  shortLabel: string;
  shortDesc: string;
}[] = [
  {
    id: "appointment",
    label: "Termin bestätigen / vorschlagen",
    shortLabel: "Termin bestätigen",
    shortDesc: "Bestätigt Datum & Zeitfenster oder fragt nach Wunschzeit",
  },
  {
    id: "on_the_way",
    label: "Auf dem Weg / Anfahrt",
    shortLabel: "Auf dem Weg",
    shortDesc: "Kurze Info an den Kunden: Wir sind gleich bei Ihnen vor Ort",
  },
  {
    id: "price_estimate",
    label: "Preis / Einschätzung senden",
    shortLabel: "Preis senden",
    shortDesc: "Übermittelt den eingetragenen Gesamtpreis oder die Ersteinschätzung",
  },
  {
    id: "question",
    label: "Rückfrage (Typenschild-Foto)",
    shortLabel: "Typenschild-Foto",
    shortDesc: "Fragt nach E-Nr.-Foto oder kurzem Fehlerhinweis",
  },
  {
    id: "sold_thanks",
    label: "Abschluss & Garantiebestätigung",
    shortLabel: "Abschluss & Garantie",
    shortDesc: "Bestätigung nach Vor-Ort-Service oder Gerätekauf inkl. Garantie",
  },
];

export function buildAdminWhatsAppReplyUrl(
  ticket: AdminRepairTicket,
  templateKind: WhatsAppTemplateKind = "auto"
): string {
  const cleanDigits = ticket.phone.replace(/\D/g, "");
  const intlPhone = cleanDigits.startsWith("00")
    ? cleanDigits.slice(2)
    : cleanDigits.startsWith("0")
    ? `49${cleanDigits.slice(1)}`
    : cleanDigits.startsWith("49")
    ? cleanDigits
    : `49${cleanDigits}`;

  const deviceName = ticket.device.includes("Anderes")
    ? ticket.customDevice || "Hausgerät"
    : ticket.device;

  const formattedDate = ticket.scheduledDate
    ? new Date(`${ticket.scheduledDate}T12:00:00`).toLocaleDateString("de-DE", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "";

  const slotText =
    ticket.scheduledSlot && ticket.scheduledSlot !== "Nach Vereinbarung"
      ? ` (${ticket.scheduledSlot} Uhr)`
      : "";

  const simpleStatus = normalizeSimpleStatus(ticket.status);
  const comp = ticket.completionDetails;
  const totals = calculateTicketTotals(ticket.invoiceItems || []);
  const priceText = totals.grossTotal > 0 ? formatEuro(totals.grossTotal) : "";

  let statusText = "";
  if (templateKind === "appointment") {
    statusText = formattedDate
      ? `wir bestätigen gerne Ihren Vor-Ort-Termin am *${formattedDate}*${slotText}. Bitte geben Sie uns kurz Bescheid, ob es dabei bleibt.`
      : `vielen Dank für Ihre Anfrage (*${ticket.id}*) zu Ihrem *${ticket.brand} ${deviceName}*. Wann passt Ihnen ein Vor-Ort-Termin (z. B. vormittags 09:00–12:00 Uhr oder nachmittags)?`;
  } else if (templateKind === "on_the_way") {
    statusText = `wir sind jetzt auf dem Weg zu Ihnen wegen Ihres *${ticket.brand} ${deviceName}* (Auftrag *${ticket.id}*) und in Kürze vor Ort.`;
  } else if (templateKind === "price_estimate") {
    statusText = priceText
      ? `zu Ihrem Auftrag (*${ticket.id}*, *${ticket.brand} ${deviceName}*) beträgt der vereinbarte Gesamtbetrag *${priceText} inkl. MwSt.*${ticket.technicianNotes ? ` (${ticket.technicianNotes.trim()})` : ""}. Bitte geben Sie uns kurz Bescheid.`
      : `zu Ihrem Auftrag (*${ticket.id}*, *${ticket.brand} ${deviceName}*) möchten wir kurz die Ersteinschätzung und die passenden Optionen mit Ihnen abstimmen. Wann sind Sie kurz erreichbar?`;
  } else if (templateKind === "question") {
    statusText = `zu Ihrem Auftrag (*${ticket.id}*) haben wir noch eine kurze Rückfrage zu Ihrem *${ticket.brand} ${deviceName}*: Könnten Sie uns bitte ein kurzes Foto vom *Typenschild (E-Nr. / PNC)* hier in WhatsApp senden?`;
  } else if (templateKind === "pickup_ready") {
    statusText = `gute Nachrichten: Ihr *${ticket.brand} ${deviceName}* (Auftrag *${ticket.id}*) ist geprüft und bereit zur Lieferung / Übergabe nach Terminabsprache.`;
  } else if (templateKind === "sold_thanks") {
    const gMonths = comp?.warrantyMonths ?? (comp?.outcome === "sold" ? 12 : 6);
    statusText =
      comp?.outcome === "sold"
        ? `vielen Dank für Ihren Kauf (*${ticket.id}*) bei Hannachi Osnabrück! Ihr *${ticket.brand} ${deviceName}* wurde geprüft übergeben${gMonths > 0 ? ` inklusive *${gMonths} Monaten schriftlicher Verkäufergarantie*` : ""}${priceText ? ` (Gesamtbetrag: *${priceText}*)` : ""}.`
        : `vielen Dank für Ihren Auftrag (*${ticket.id}*). Der Vor-Ort- bzw. Garantieservice für Ihr *${ticket.brand} ${deviceName}* wurde erfolgreich abgeschlossen${gMonths > 0 ? ` (inkl. *${gMonths} Monaten Hannachi Garantie*)` : ""}${priceText ? ` · Betrag: *${priceText}*` : ""}.`;
  } else {
    statusText =
      simpleStatus === "in_progress" && formattedDate
        ? `wir bestätigen gerne Ihren Vor-Ort-Termin für den *${formattedDate}*${slotText}.`
        : simpleStatus === "completed" && comp?.outcome === "sold"
        ? `vielen Dank für Ihren Kauf (*${ticket.id}*). Ihr Artikel (*${ticket.brand} ${deviceName}*) wurde übergeben${comp.warrantyMonths > 0 ? ` inkl. ${comp.warrantyMonths} Monate schriftlicher Verkäufergarantie` : ""}.`
        : simpleStatus === "completed" && comp?.outcome === "repaired"
        ? `der Vor-Ort-Service / Garantie-Termin für Ihr Gerät (*${ticket.brand} ${deviceName}*, Auftrag *${ticket.id}*) ist erfolgreich abgeschlossen.`
        : simpleStatus === "completed"
        ? `vielen Dank für Ihren Auftrag (*${ticket.id}*). Ihr Anliegen zu (*${ticket.brand} ${deviceName}*) ist abgeschlossen.`
        : formattedDate
        ? `vielen Dank für Ihre Anfrage (*${ticket.id}*) zu Ihrem *${ticket.brand} ${deviceName}*. Passt Ihnen ein Vor-Ort-Termin am *${formattedDate}*${slotText}?`
        : `vielen Dank für Ihre Anfrage (*${ticket.id}*) zu Ihrem *${ticket.brand} ${deviceName}*. Wann passt Ihnen ein kurzer Vor-Ort-Termin?`;
  }

  const addressLine = [ticket.streetAddress, ticket.zip]
    .filter((part) => Boolean(part && !part.includes("Werkstatt")))
    .join(", ");

  const message = [
    `Guten Tag ${ticket.name},`,
    "",
    `hier ist der *Kundendienst Hannachi (Osnabrück)* – ${statusText}`,
    "",
    `• *Auftrags-Nr.:* ${ticket.id}`,
    `• *Gerät:* ${ticket.brand} ${deviceName}${ticket.model ? ` (${ticket.model})` : ""}`,
    addressLine
      ? `• *Einsatzort:* ${addressLine}`
      : `• *Service:* Mobiler Vor-Ort-Kundendienst (Osnabrück & Umgebung)`,
    ...(priceText ? [`• *Betrag (inkl. MwSt.):* ${priceText}`] : []),
    "",
    `Herzliche Grüße`,
    `Kamal Hannachi · Elektrohaushaltsgeräte Service`,
    `Tel.: 0170 3493494`,
  ].join("\n");

  return `https://api.whatsapp.com/send?phone=${intlPhone}&text=${encodeURIComponent(message)}`;
}

function escapeCsvCell(value: unknown): string {
  const str = String(value ?? "").replace(/\r?\n/g, " ").trim();
  if (str.includes(";") || str.includes('"') || str.includes(",")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportTicketsToCsv(tickets: AdminRepairTicket[]): void {
  if (typeof window === "undefined") return;

  const headers = [
    "Auftrags-Nr.",
    "Eingangsdatum",
    "Status",
    "Dringlichkeit",
    "Service-Art",
    "Termin-Datum",
    "Uhrzeit",
    "Kundenname",
    "Telefon",
    "E-Mail",
    "PLZ & Ort",
    "Straße & Hausnr.",
    "Gerät",
    "Marke",
    "Modell",
    "Anliegen / Fehler",
    "Notiz",
    "Beleg-Nr.",
    "Abschlussart",
    "Garantie (Monate)",
    "Teile / E-Nr.",
    "Gesamtpreis Brutto (EUR)",
  ];

  const rows = tickets.map((t) => {
    const totals = calculateTicketTotals(t.invoiceItems || []);
    const deviceLabel = t.device.includes("Anderes")
      ? t.customDevice || t.device
      : t.device;
    const outcomeLabel =
      t.completionDetails?.outcome === "sold"
        ? "Verkauft"
        : t.completionDetails?.outcome === "repaired"
        ? "Vor-Ort-/Garantieservice"
        : "";

    return [
      t.id,
      new Date(t.createdAt).toLocaleString("de-DE"),
      ADMIN_STATUS_META[t.status]?.label || "Neu",
      ADMIN_URGENCY_META[t.urgency]?.label || t.urgency,
      t.visitType === "home_visit" ? "Vor-Ort-Kundendienst" : "Lieferung & Übergabe",
      t.scheduledDate || "",
      t.scheduledSlot || "",
      t.name,
      t.phone,
      t.email,
      t.zip.replace(" (Werkstatt)", ""),
      t.streetAddress,
      deviceLabel,
      t.brand,
      t.model,
      t.problem,
      t.completionDetails?.workOrSaleSummary || t.technicianNotes,
      t.invoiceNumber,
      outcomeLabel,
      t.completionDetails?.warrantyMonths ?? "",
      t.completionDetails?.partsOrSerial || "",
      totals.grossTotal > 0 ? totals.grossTotal.toFixed(2).replace(".", ",") : "",
    ].map(escapeCsvCell);
  });

  const csvContent =
    "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Hannachi-Auftraege-${getTodayIsoDate(0)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export type TicketExportType = "service" | "warranty_sale";

function getTicketDocMeta(docType: TicketExportType) {
  if (docType === "warranty_sale") {
    return {
      title: "KAUF- & GARANTIEBELEG",
      notesHeading: "GERÄTEDATEN / ÜBERGABE & GARANTIEHINWEIS",
      footerNote:
        "Schriftliche Verkäufergarantie gemäß Kaufbeleg für direkt bei Hannachi Elektrohaushaltsgeräte Service erworbene Geräte. Geprüfte Markenqualität aus Osnabrück.",
      sigLeft: "Datum / Unterschrift Verkäufer (Hannachi)",
      sigRight: "Datum / Unterschrift Käufer",
    };
  }
  return {
    title: "AUFTRAGS- & SERVICEBELEG",
    notesHeading: "ANLIEGEN / VOR-ORT-SERVICE & NOTIZEN",
    footerNote:
      "Geprüft und dokumentiert durch Hannachi Elektrohaushaltsgeräte Service · An- & Verkauf sowie mobiler Vor-Ort-Service nach Terminvereinbarung in Osnabrück & Umgebung.",
    sigLeft: "Datum / Unterschrift Hannachi Service",
    sigRight: "Datum / Unterschrift Kunde",
  };
}

export function formatTicketTextSummary(
  t: AdminRepairTicket,
  docType: TicketExportType = "service"
): string {
  const totals = calculateTicketTotals(t.invoiceItems || []);
  const deviceLabel = t.device.includes("Anderes")
    ? t.customDevice || "Hausgerät"
    : t.device;
  const formattedDate = t.scheduledDate
    ? new Date(`${t.scheduledDate}T12:00:00`).toLocaleDateString("de-DE")
    : "Nach Vereinbarung";
  const docMeta = getTicketDocMeta(docType);

  const lines = [
    `=== ${docMeta.title} ===`,
    `${business.name} · ${business.street}, ${business.zip} ${business.city}`,
    `Tel.: ${business.phoneDisplay}`,
    "",
    `Auftrags-Nr.: ${t.id}`,
    `Beleg-Nr.: ${t.invoiceNumber}`,
    `Status: ${ADMIN_STATUS_META[t.status]?.label || "Neu"}`,
    `Eingang: ${new Date(t.createdAt).toLocaleDateString("de-DE")}`,
    "",
    `Kunde: ${t.name}`,
    `Telefon: ${t.phone}`,
    t.visitType === "home_visit"
      ? `Adresse: ${[t.streetAddress, t.zip.replace(" (Werkstatt)", "")].filter(Boolean).join(", ") || "Osnabrück"}`
      : `Service-Art: Lieferung & Übergabe nach Terminabsprache (${t.zip.replace(" (Werkstatt)", "") || "Osnabrück"})`,
    "",
    `Gerät: ${t.brand} ${deviceLabel}${t.model ? ` (Modell/E-Nr.: ${t.model})` : ""}`,
    `Termin: ${formattedDate} (${t.scheduledSlot || "Nach Vereinbarung"})`,
    `Anliegen: ${t.problem}`,
  ];

  if (t.completionDetails) {
    const c = t.completionDetails;
    lines.push(
      `Abschlussart: ${c.outcome === "sold" ? "Verkauft (Gerät / Ersatzteil)" : "Vor-Ort- / Garantieservice abgeschlossen"}`
    );
    if (c.workOrSaleSummary) {
      lines.push(`Abschluss-Details: ${c.workOrSaleSummary}`);
    }
    if (c.partsOrSerial) {
      lines.push(`Teile / Serien-Nr.: ${c.partsOrSerial}`);
    }
    if (c.warrantyMonths > 0) {
      lines.push(`Garantie / Gewährleistung: ${c.warrantyMonths} Monate`);
    }
    lines.push(
      `Bestätigt am: ${new Date(c.confirmedAt).toLocaleString("de-DE")} (${c.confirmedBy})`
    );
  } else if (t.technicianNotes?.trim()) {
    lines.push(`Notiz / Arbeit: ${t.technicianNotes.trim()}`);
  }

  lines.push("");
  if (totals.grossTotal > 0) {
    lines.push(`Nettobetrag: ${formatEuro(totals.netTotal)}`);
    lines.push(`zzgl. 19 % MwSt.: ${formatEuro(totals.vatAmount)}`);
    lines.push(`Gesamtbetrag (inkl. MwSt.): ${formatEuro(totals.grossTotal)}`);
  } else {
    lines.push("Betrag: Preis auf Anfrage / nach Vereinbarung");
  }

  if (docType === "warranty_sale" || t.completionDetails?.outcome === "sold") {
    lines.push("");
    lines.push("Hinweis: Inklusive schriftlicher Verkäufergarantie von Hannachi Osnabrück.");
  }

  return lines.join("\n");
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  if (words.length === 0) return ["—"];
  const lines: string[] = [];
  let current = words[0];
  for (let i = 1; i < words.length; i++) {
    const next = `${current} ${words[i]}`;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

export async function renderTicketToPngBlob(
  t: AdminRepairTicket,
  docType: TicketExportType = "service"
): Promise<Blob | null> {
  if (typeof window === "undefined" || typeof document === "undefined") return null;

  const width = 1200;
  const height = 1600;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const totals = calculateTicketTotals(t.invoiceItems || []);
  const deviceLabel = t.device.includes("Anderes")
    ? t.customDevice || "Hausgerät"
    : t.device;
  const formattedDate = t.scheduledDate
    ? new Date(`${t.scheduledDate}T12:00:00`).toLocaleDateString("de-DE")
    : "Nach Vereinbarung";
  const docMeta = getTicketDocMeta(docType);

  // Background paper
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Top dark accent header bar
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, width, 16);

  const margin = 72;
  const contentWidth = width - margin * 2;
  let y = 78;

  // Company Info (Left) & Doc Meta (Right)
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 34px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText(business.name, margin, y);

  ctx.textAlign = "right";
  ctx.fillStyle = "#0284c7";
  ctx.font = "bold 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText(docMeta.title, width - margin, y);

  ctx.textAlign = "left";
  y += 34;
  ctx.fillStyle = "#475569";
  ctx.font = "500 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText(
    `Inhaber: ${business.owner} · ${business.street}, ${business.zip} ${business.city}`,
    margin,
    y
  );
  ctx.textAlign = "right";
  ctx.font = "bold 20px monospace";
  ctx.fillStyle = "#0f172a";
  ctx.fillText(`Auftrags-Nr.: ${t.id}`, width - margin, y);

  ctx.textAlign = "left";
  y += 28;
  ctx.fillStyle = "#475569";
  ctx.font = "500 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText(`Tel.: ${business.phoneDisplay} · ${business.email}`, margin, y);

  ctx.textAlign = "right";
  ctx.font = "500 19px monospace";
  ctx.fillText(
    `Beleg: ${t.invoiceNumber} · Datum: ${new Date().toLocaleDateString("de-DE")}`,
    width - margin,
    y
  );

  ctx.textAlign = "left";
  y += 32;
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(margin, y, contentWidth, 3);
  y += 44;

  // Two-column Grid: Customer & Appliance
  const rightColX = margin + contentWidth / 2 + 20;

  ctx.fillStyle = "#64748b";
  ctx.font = "bold 17px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("KUNDENDATEN", margin, y);
  ctx.fillText("GERÄT & TERMIN", rightColX, y);

  y += 32;
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText(t.name, margin, y);
  ctx.fillText(`${t.brand} · ${deviceLabel}`, rightColX, y);

  let leftY = y + 32;
  let rightY = y + 32;

  ctx.fillStyle = "#1e293b";
  ctx.font = "500 21px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  if (t.visitType === "home_visit") {
    if (t.streetAddress) {
      ctx.fillText(t.streetAddress, margin, leftY);
      leftY += 28;
    }
    ctx.fillText(t.zip.replace(" (Werkstatt)", "") || "Osnabrück", margin, leftY);
    leftY += 28;
  } else {
    ctx.fillText("Lieferung & Übergabe nach Terminabsprache", margin, leftY);
    leftY += 28;
  }
  ctx.font = "bold 21px monospace";
  ctx.fillText(`Tel.: ${t.phone}`, margin, leftY);
  leftY += 28;

  ctx.font = "500 21px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  if (t.model) {
    ctx.fillText(`Modell / E-Nr.: ${t.model}`, rightColX, rightY);
    rightY += 28;
  }
  ctx.fillText(
    `Service-Art: ${t.visitType === "home_visit" ? "Vor-Ort-Kundendienst" : "Lieferung & Übergabe"}`,
    rightColX,
    rightY
  );
  rightY += 28;
  ctx.fillText(
    `Termin: ${formattedDate} (${t.scheduledSlot || "Nach Vereinbarung"})`,
    rightColX,
    rightY
  );
  rightY += 28;

  y = Math.max(leftY, rightY) + 24;
  ctx.fillStyle = "#cbd5e1";
  ctx.fillRect(margin, y, contentWidth, 1.5);
  y += 42;

  // Problem & Notes Section
  ctx.fillStyle = "#64748b";
  ctx.font = "bold 17px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText(docMeta.notesHeading, margin, y);
  y += 34;

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 21px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("Kundenangabe / Anliegen:", margin, y);
  y += 30;
  ctx.font = "500 21px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#334155";
  for (const line of wrapCanvasText(ctx, t.problem, contentWidth)) {
    ctx.fillText(line, margin, y);
    y += 30;
  }

  const notesToDraw =
    t.completionDetails?.workOrSaleSummary || t.technicianNotes?.trim() || "";
  if (t.completionDetails) {
    y += 14;
    ctx.fillStyle = "#047857";
    ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    const badgeLine = `ABGESCHLOSSEN (${t.completionDetails.outcome === "sold" ? "VERKAUFT" : "SERVICE / GARANTIE"})${t.completionDetails.warrantyMonths > 0 ? ` · ${t.completionDetails.warrantyMonths} Monate Garantie` : ""}`;
    ctx.fillText(badgeLine, margin, y);
    y += 30;
  }
  if (notesToDraw) {
    y += 8;
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 21px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillText(
      t.completionDetails?.outcome === "sold"
        ? "Verkaufs- & Übergabedetails:"
        : "Vor-Ort-Service / Notiz:",
      margin,
      y
    );
    y += 30;
    ctx.font = "500 21px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillStyle = "#334155";
    for (const line of wrapCanvasText(ctx, notesToDraw, contentWidth)) {
      ctx.fillText(line, margin, y);
      y += 30;
    }
  }
  if (t.completionDetails?.partsOrSerial) {
    y += 6;
    ctx.fillStyle = "#334155";
    ctx.font = "600 19px monospace";
    ctx.fillText(`Teile / E-Nr.: ${t.completionDetails.partsOrSerial}`, margin, y);
    y += 28;
  }

  y += 28;
  ctx.fillStyle = "#cbd5e1";
  ctx.fillRect(margin, y, contentWidth, 1.5);
  y += 46;

  // Totals Box
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(margin, y, contentWidth, 178);
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(margin, y, contentWidth, 178);

  const boxPad = 28;
  let ty = y + 44;
  ctx.fillStyle = "#334155";
  ctx.font = "500 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("Nettobetrag:", margin + boxPad, ty);
  ctx.textAlign = "right";
  ctx.font = "bold 22px monospace";
  ctx.fillText(
    totals.grossTotal > 0 ? formatEuro(totals.netTotal) : "Auf Anfrage / Vereinbarung",
    width - margin - boxPad,
    ty
  );

  ctx.textAlign = "left";
  ty += 38;
  ctx.font = "500 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("zzgl. 19 % MwSt.:", margin + boxPad, ty);
  ctx.textAlign = "right";
  ctx.font = "bold 22px monospace";
  ctx.fillText(
    totals.grossTotal > 0 ? formatEuro(totals.vatAmount) : "—",
    width - margin - boxPad,
    ty
  );

  ctx.textAlign = "left";
  ty += 24;
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(margin + boxPad, ty, contentWidth - boxPad * 2, 2);

  ty += 42;
  ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("Gesamtbetrag (inkl. MwSt.):", margin + boxPad, ty);
  ctx.textAlign = "right";
  ctx.font = "bold 28px monospace";
  ctx.fillText(
    totals.grossTotal > 0 ? formatEuro(totals.grossTotal) : "Preis auf Anfrage",
    width - margin - boxPad,
    ty
  );

  // Footer & Signatures anchored near bottom
  ctx.textAlign = "left";
  const footerY = height - 250;
  ctx.fillStyle = "#475569";
  ctx.font = "500 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  let fy = footerY;
  for (const line of wrapCanvasText(ctx, docMeta.footerNote, contentWidth)) {
    ctx.fillText(line, margin, fy);
    fy += 26;
  }

  const sigY = height - 96;
  const sigWidth = contentWidth / 2 - 40;
  ctx.fillStyle = "#64748b";
  ctx.fillRect(margin, sigY, sigWidth, 1.5);
  ctx.fillRect(margin + contentWidth / 2 + 40, sigY, sigWidth, 1.5);

  ctx.fillStyle = "#475569";
  ctx.font = "600 17px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText(docMeta.sigLeft, margin, sigY + 26);
  ctx.fillText(docMeta.sigRight, margin + contentWidth / 2 + 40, sigY + 26);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png", 0.96);
  });
}

export async function exportTicketAsPng(
  ticket: AdminRepairTicket,
  docType: TicketExportType = "service"
): Promise<boolean> {
  const blob = await renderTicketToPngBlob(ticket, docType);
  if (!blob) return false;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Hannachi-Ticket-${ticket.id}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

export async function shareTicketNative(
  ticket: AdminRepairTicket,
  docType: TicketExportType = "service"
): Promise<"shared" | "downloaded"> {
  const summaryText = formatTicketTextSummary(ticket, docType);
  const blob = await renderTicketToPngBlob(ticket, docType);

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      if (blob) {
        const file = new File([blob], `Hannachi-Ticket-${ticket.id}.png`, {
          type: "image/png",
        });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            title: `Hannachi Beleg ${ticket.id}`,
            text: summaryText,
            files: [file],
          });
          return "shared";
        }
      }
      await navigator.share({
        title: `Hannachi Beleg ${ticket.id}`,
        text: summaryText,
      });
      return "shared";
    } catch {
      // User cancelled or file share unsupported; fallback below
    }
  }

  await exportTicketAsPng(ticket, docType);
  return "downloaded";
}

function escapeHtml(text: string): string {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Generates and downloads a standalone DIN A4 printable HTML document for one or more tickets.
 * Guarantees 100% reliable receipt export & printing even inside sandboxed iframes.
 */
export function downloadPrintableReceiptsHtml(
  tickets: AdminRepairTicket[],
  docType: TicketExportType = "service"
): void {
  if (typeof window === "undefined" || tickets.length === 0) return;

  const docMeta = getTicketDocMeta(docType);

  const pagesHtml = tickets
    .map((t, index) => {
      const totals = calculateTicketTotals(t.invoiceItems || []);
      const deviceLabel = t.device.includes("Anderes")
        ? t.customDevice || "Hausgerät"
        : t.device;
      const formattedDate = t.scheduledDate
        ? new Date(`${t.scheduledDate}T12:00:00`).toLocaleDateString("de-DE")
        : "Nach Vereinbarung";
      const pageBreakClass = index < tickets.length - 1 ? "page-break" : "";

      return `
        <section class="sheet ${pageBreakClass}">
          <header class="header">
            <div>
              <h1>${escapeHtml(business.name)}</h1>
              <p>Inhaber: ${escapeHtml(business.owner)} · ${escapeHtml(business.street)}, ${escapeHtml(business.zip)} ${escapeHtml(business.city)}</p>
              <p>Tel.: ${escapeHtml(business.phoneDisplay)} · ${escapeHtml(business.email)}</p>
            </div>
            <div class="meta">
              <div class="meta-title">${escapeHtml(docMeta.title)}</div>
              <div>Auftrags-Nr.: <strong>${escapeHtml(t.id)}</strong></div>
              <div>Beleg-Nr.: ${escapeHtml(t.invoiceNumber)}</div>
              <div>Datum: ${new Date().toLocaleDateString("de-DE")}</div>
            </div>
          </header>

          <div class="grid-2">
            <div>
              <div class="section-label">KUNDENDATEN</div>
              <div class="customer-name">${escapeHtml(t.name)}</div>
              ${t.streetAddress ? `<div>${escapeHtml(t.streetAddress)}</div>` : ""}
              <div>${escapeHtml(t.zip.replace(" (Werkstatt)", ""))}</div>
              <div class="mono">Tel.: ${escapeHtml(t.phone)}</div>
            </div>
            <div>
              <div class="section-label">GERÄT &amp; TERMIN</div>
              <div class="customer-name">${escapeHtml(t.brand)} · ${escapeHtml(deviceLabel)}</div>
              ${t.model ? `<div>Modell / E-Nr.: ${escapeHtml(t.model)}</div>` : ""}
              <div>Service-Art: ${t.visitType === "home_visit" ? "Vor-Ort-Kundendienst" : "Lieferung &amp; Übergabe"}</div>
              <div>Termin: ${escapeHtml(formattedDate)} (${escapeHtml(t.scheduledSlot)})</div>
            </div>
          </div>

          <div class="block">
            <div class="section-label">${escapeHtml(docMeta.notesHeading)}</div>
            <p><strong>Kundenangabe:</strong> ${escapeHtml(t.problem)}</p>
            ${
              t.completionDetails
                ? `<p><strong>Status:</strong> Abgeschlossen (${t.completionDetails.outcome === "sold" ? "Verkauft" : "Vor-Ort-/Garantieservice"})${t.completionDetails.warrantyMonths > 0 ? ` · ${t.completionDetails.warrantyMonths} Monate Garantie` : ""}</p>`
                : ""
            }
            ${
              t.completionDetails?.workOrSaleSummary || t.technicianNotes
                ? `<p><strong>${t.completionDetails?.outcome === "sold" ? "Verkaufs- & Übergabedetails" : "Vor-Ort-Service / Notiz"}:</strong> ${escapeHtml(t.completionDetails?.workOrSaleSummary || t.technicianNotes)}</p>`
                : ""
            }
            ${
              t.completionDetails?.partsOrSerial
                ? `<p><strong>Teile / E-Nr. / Seriennummer:</strong> ${escapeHtml(t.completionDetails.partsOrSerial)}</p>`
                : ""
            }
          </div>

          <div class="totals">
            <div class="row">
              <span>Nettobetrag:</span>
              <span class="mono">${totals.grossTotal > 0 ? formatEuro(totals.netTotal) : "__________ €"}</span>
            </div>
            <div class="row">
              <span>zzgl. 19 % MwSt.:</span>
              <span class="mono">${totals.grossTotal > 0 ? formatEuro(totals.vatAmount) : "__________ €"}</span>
            </div>
            <div class="row total-gross">
              <span>Gesamtbetrag (inkl. MwSt.):</span>
              <span class="mono">${totals.grossTotal > 0 ? formatEuro(totals.grossTotal) : "__________ €"}</span>
            </div>
          </div>

          <footer class="footer">
            <p>${escapeHtml(docMeta.footerNote)}</p>
            <div class="signatures">
              <div class="sig-line">${escapeHtml(docMeta.sigLeft)}</div>
              <div class="sig-line">${escapeHtml(docMeta.sigRight)}</div>
            </div>
          </footer>
        </section>
      `;
    })
    .join("\n");

  const htmlDoc = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hannachi Beleg (${tickets.map((t) => t.id).join(", ")})</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #0f172a;
      background: #f8fafc;
      margin: 0;
      padding: 16px;
    }
    .toolbar {
      max-width: 780px;
      margin: 0 auto 16px auto;
      padding: 12px 16px;
      background: #0f172a;
      color: #ffffff;
      border-radius: 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      justify-content: space-between;
    }
    .toolbar button {
      background: #f59e0b;
      color: #0f172a;
      border: none;
      padding: 8px 16px;
      font-weight: 700;
      border-radius: 6px;
      cursor: pointer;
    }
    .sheet {
      max-width: 780px;
      margin: 0 auto 24px auto;
      background: #ffffff;
      padding: 36px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
    }
    .header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 20px;
    }
    .header h1 { margin: 0 0 6px 0; font-size: 20px; }
    .header p { margin: 2px 0; font-size: 12px; color: #475569; }
    .meta { text-align: right; font-family: monospace; font-size: 12px; }
    .meta-title { font-weight: 700; font-size: 14px; margin-bottom: 4px; }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      padding: 20px 0;
      border-bottom: 1px solid #cbd5e1;
      font-size: 14px;
    }
    .section-label { font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 4px; }
    .customer-name { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
    .block { padding: 20px 0; border-bottom: 1px solid #cbd5e1; font-size: 14px; }
    .totals { padding: 20px 0; border-bottom: 1px solid #cbd5e1; font-size: 14px; }
    .row { display: flex; justify-content: space-between; gap: 12px; padding: 4px 0; }
    .total-gross {
      border-top: 2px solid #0f172a;
      margin-top: 8px;
      padding-top: 10px;
      font-size: 16px;
      font-weight: 700;
    }
    .mono { font-family: monospace; }
    .footer { padding-top: 24px; font-size: 12px; color: #475569; }
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 48px;
      margin-top: 48px;
    }
    .sig-line { border-top: 1px solid #94a3b8; padding-top: 6px; }
    @media (max-width: 600px) {
      .sheet { padding: 20px; }
      .meta { text-align: left; }
      .grid-2, .signatures { grid-template-columns: 1fr; gap: 20px; }
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .toolbar { display: none !important; }
      .sheet { border: none; margin: 0; padding: 20px; max-width: 100%; }
      .page-break { page-break-after: always; break-after: page; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <span>Hannachi Druckbeleg (${tickets.length} ${tickets.length === 1 ? "Auftrag" : "Aufträge"})</span>
    <button onclick="window.print()">Jetzt drucken / Als PDF speichern</button>
  </div>
  ${pagesHtml}
</body>
</html>`;

  const blob = new Blob([htmlDoc], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download =
    tickets.length === 1
      ? `Hannachi-Beleg-${tickets[0].id}.html`
      : `Hannachi-Sammelbelege-${getTodayIsoDate(0)}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
