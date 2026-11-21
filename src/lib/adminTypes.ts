export type AdminTicketStatus =
  | "new"
  | "scheduled"
  | "in_progress"
  | "parts_ordered"
  | "completed"
  | "cancelled";

export type SimpleAdminStatus = "new" | "in_progress" | "completed";

export type AdminTimeSlot =
  | "Nach Vereinbarung"
  | "08:00 - 10:00"
  | "10:00 - 12:00"
  | "12:30 - 14:30"
  | "14:30 - 16:30"
  | "16:30 - 18:00";

export interface AdminInvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPriceNet: number;
}

export type TicketCompletionOutcome = "sold" | "repaired";

export interface TicketCompletionDetails {
  outcome: TicketCompletionOutcome;
  confirmedAt: string;
  confirmedBy: string;
  workOrSaleSummary: string;
  partsOrSerial: string;
  warrantyMonths: number;
  finalGrossAmount: number;
  savedToWebsite: boolean;
  marketplaceItemId?: string;
  marketplaceItemTitle?: string;
}

export interface AdminRepairTicket {
  id: string;
  createdAt: string;
  updatedAt: string;
  inquiryMode: "repair" | "question";
  visitType: "home_visit" | "workshop";
  device: string;
  customDevice: string;
  brand: string;
  model: string;
  problem: string;
  urgency: "normal" | "express" | "notfall";
  callbackTime: string;
  zip: string;
  streetAddress: string;
  mapsLocationUrl: string;
  locationVerified: boolean;
  coordinates: {
    lat: number;
    lng: number;
    accuracy?: number;
  } | null;
  name: string;
  phone: string;
  email: string;
  photoName: string | null;
  marketplaceItemId?: string;
  marketplaceItemTitle?: string;
  // Admin operational fields
  status: AdminTicketStatus;
  scheduledDate: string; // YYYY-MM-DD or ""
  scheduledSlot: AdminTimeSlot;
  technicianNotes: string;
  invoiceNumber: string;
  invoiceItems: AdminInvoiceItem[];
  completionDetails?: TicketCompletionDetails | null;
}

/**
 * Legacy demo/seed ticket IDs that must be automatically stripped so
 * Mrs. Hannachi never sees mock data in her workspace.
 */
export const LEGACY_MOCK_TICKET_IDS = new Set([
  "HN-4918",
  "HN-4915",
  "HN-4912",
  "HN-4909",
  "HN-4904",
  "HN-4897",
  "HN-0000",
]);

export function normalizeSimpleStatus(status: AdminTicketStatus | string): SimpleAdminStatus {
  if (status === "completed" || status === "cancelled") {
    return "completed";
  }
  if (status === "in_progress" || status === "scheduled" || status === "parts_ordered") {
    return "in_progress";
  }
  return "new";
}

export function normalizePhoneKey(phone: string): string {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0049")) return `0${digits.slice(4)}`;
  if (digits.startsWith("49") && digits.length > 9) return `0${digits.slice(2)}`;
  return digits;
}

export function isMarketplaceTicket(ticket: AdminRepairTicket): boolean {
  if (ticket.marketplaceItemId || ticket.completionDetails?.outcome === "sold") {
    return true;
  }
  const text = `${ticket.problem || ""} ${ticket.technicianNotes || ""}`.toLowerCase();
  return (
    text.includes("reservierung") ||
    text.includes("preisanfrage") ||
    text.includes("marktplatz") ||
    text.includes("ersatzteil-anfrage") ||
    text.includes("ankauf") ||
    text.includes("kauf")
  );
}

export function stripMockTickets(tickets: AdminRepairTicket[]): AdminRepairTicket[] {
  if (!Array.isArray(tickets)) return [];
  return tickets
    .filter((t) => t && typeof t.id === "string" && !LEGACY_MOCK_TICKET_IDS.has(t.id))
    .map((t) => ({
      ...t,
      status: normalizeSimpleStatus(t.status),
    }));
}

export const SIMPLE_STATUS_OPTIONS: Array<{
  value: SimpleAdminStatus;
  label: string;
  description: string;
}> = [
  {
    value: "new",
    label: "Neu",
    description: "Neue Kundenanfrage – noch offen",
  },
  {
    value: "in_progress",
    label: "In Arbeit",
    description: "Vor-Ort-Termin vereinbart oder in Bearbeitung",
  },
  {
    value: "completed",
    label: "Erledigt",
    description: "Vor-Ort-Service / Verkauf abgeschlossen",
  },
];

export const ADMIN_STATUS_META: Record<
  AdminTicketStatus,
  {
    label: string;
    shortLabel: string;
    badgeClass: string;
    dotColor: string;
  }
> = {
  new: {
    label: "Neu",
    shortLabel: "Neu",
    badgeClass:
      "border-sky-500/35 bg-sky-500/10 text-sky-800 dark:text-sky-300",
    dotColor: "#0284C7",
  },
  scheduled: {
    label: "In Arbeit",
    shortLabel: "In Arbeit",
    badgeClass:
      "border-amber-500/40 bg-amber-500/12 text-amber-900 dark:text-amber-300",
    dotColor: "#D97706",
  },
  in_progress: {
    label: "In Arbeit",
    shortLabel: "In Arbeit",
    badgeClass:
      "border-amber-500/40 bg-amber-500/12 text-amber-900 dark:text-amber-300",
    dotColor: "#D97706",
  },
  parts_ordered: {
    label: "In Arbeit",
    shortLabel: "In Arbeit",
    badgeClass:
      "border-amber-500/40 bg-amber-500/12 text-amber-900 dark:text-amber-300",
    dotColor: "#D97706",
  },
  completed: {
    label: "Erledigt",
    shortLabel: "Erledigt",
    badgeClass:
      "border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
    dotColor: "#16A34A",
  },
  cancelled: {
    label: "Erledigt",
    shortLabel: "Erledigt",
    badgeClass:
      "border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
    dotColor: "#16A34A",
  },
};

export const ADMIN_URGENCY_META: Record<
  "normal" | "express" | "notfall",
  {
    label: string;
    badgeClass: string;
    priorityWeight: number;
  }
> = {
  notfall: {
    label: "Notfall",
    badgeClass:
      "border-red-500/40 bg-red-500/12 text-red-800 dark:text-red-300",
    priorityWeight: 3,
  },
  express: {
    label: "Dringend",
    badgeClass:
      "border-amber-500/40 bg-amber-500/12 text-amber-900 dark:text-amber-300",
    priorityWeight: 2,
  },
  normal: {
    label: "Normal",
    badgeClass:
      "border-primary/15 dark:border-white/15 bg-surface dark:bg-slate-800 text-ink-muted",
    priorityWeight: 1,
  },
};

export const ADMIN_TIME_SLOTS: AdminTimeSlot[] = [
  "Nach Vereinbarung",
  "08:00 - 10:00",
  "10:00 - 12:00",
  "12:30 - 14:30",
  "14:30 - 16:30",
  "16:30 - 18:00",
];

export const HANNACHI_WORKSHOP_COORDS = {
  lat: 52.2647,
  lng: 8.0548,
  address: "Iburger Straße 5, Im Hof, 49082 Osnabrück",
};

export function getTodayIsoDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function calculateTicketTotals(items: AdminInvoiceItem[]): {
  netTotal: number;
  vatAmount: number;
  grossTotal: number;
} {
  const netRaw = (items || []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPriceNet) || 0),
    0
  );
  const grossTotal = Math.round(netRaw * 1.19 * 100) / 100;
  const netTotal = Math.round((grossTotal / 1.19) * 100) / 100;
  const vatAmount = Math.round((grossTotal - netTotal) * 100) / 100;
  return {
    netTotal,
    vatAmount,
    grossTotal,
  };
}

export function buildSingleGrossInvoiceItems(
  grossAmount: number,
  description: string
): AdminInvoiceItem[] {
  const cleanGross = Math.max(0, Number.isFinite(grossAmount) ? grossAmount : 0);
  if (cleanGross <= 0) {
    return [];
  }
  const unitPriceNet = Math.round((cleanGross / 1.19) * 10000) / 10000;
  return [
    {
      id: "1",
      description: description || "Vor-Ort-Check, Ersatzteil- oder Garantieservice inkl. Anfahrt",
      quantity: 1,
      unitPriceNet,
    },
  ];
}

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

/**
 * Returns an empty array: strictly zero mock or sample tickets.
 * Only genuine customer submissions or manual phone entries are stored.
 */
export function createInitialSeedTickets(): AdminRepairTicket[] {
  return [];
}
