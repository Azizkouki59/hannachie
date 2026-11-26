import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";
import { business } from "@/data/site";
import type { AdminRepairTicket, AdminTimeSlot } from "@/lib/adminTypes";

export const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
for (const scope of SCOPES) {
  provider.addScope(scope);
}
provider.setCustomParameters({
  prompt: "consent",
});

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cache the access token strictly in memory (never in localStorage/sessionStorage).
let cachedAccessToken: string | null = null;

export interface GoogleCalendarEventItem {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  status?: string;
  start?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
}

export interface CreateCalendarVisitInput {
  customerName: string;
  phone: string;
  email?: string;
  device: string;
  brand?: string;
  problem: string;
  address: string;
  dateIso: string; // YYYY-MM-DD
  slot: AdminTimeSlot | string;
  ticketId?: string;
}

/**
 * Initialize auth state listener. Clears cached token when user signs out.
 */
export const initCalendarAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Must be called from a button click or user interaction.
 */
export const googleCalendarSignIn = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Kein Zugriffstoken von Google erhalten.");
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error("Google Calendar sign-in error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCalendarAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getCurrentCalendarUser = (): User | null => {
  return auth.currentUser;
};

export const googleCalendarLogout = async (): Promise<void> => {
  await auth.signOut();
  cachedAccessToken = null;
};

/**
 * Resolves a date (YYYY-MM-DD) and a Hannachi time slot into start & end ISO timestamps in Europe/Berlin time.
 */
export function resolveSlotStartEndIso(
  dateIso: string,
  slot: string
): { startDateTime: string; endDateTime: string; label: string } {
  const cleanDate =
    /^\d{4}-\d{2}-\d{2}$/.test(dateIso)
      ? dateIso
      : new Date().toISOString().slice(0, 10);

  let startHour = 9;
  let endHour = 11;
  let label = slot || "09:00–11:00 Uhr";

  if (slot.includes("08:00") || slot.includes("Vormittag")) {
    startHour = 8;
    endHour = 11;
    label = "08:00–11:00 Uhr";
  } else if (slot.includes("10:00")) {
    startHour = 10;
    endHour = 12;
    label = "10:00–12:00 Uhr";
  } else if (slot.includes("11:00") || slot.includes("Mittag")) {
    startHour = 11;
    endHour = 14;
    label = "11:00–14:00 Uhr";
  } else if (slot.includes("12:00")) {
    startHour = 12;
    endHour = 15;
    label = "12:00–15:00 Uhr";
  } else if (slot.includes("14:00") || slot.includes("Nachmittag")) {
    startHour = 14;
    endHour = 17;
    label = "14:00–17:00 Uhr";
  } else if (slot.includes("15:00")) {
    startHour = 15;
    endHour = 18;
    label = "15:00–18:00 Uhr";
  } else if (slot.includes("17:00") || slot.includes("Abend")) {
    startHour = 17;
    endHour = 19;
    label = "17:00–19:00 Uhr";
  }

  const startLocal = new Date(
    `${cleanDate}T${String(startHour).padStart(2, "0")}:00:00`
  );
  const endLocal = new Date(
    `${cleanDate}T${String(endHour).padStart(2, "0")}:00:00`
  );

  return {
    startDateTime: startLocal.toISOString(),
    endDateTime: endLocal.toISOString(),
    label,
  };
}

/**
 * Lists upcoming events from the user's primary Google Calendar.
 */
export async function listUpcomingCalendarEvents(
  maxResults = 15
): Promise<GoogleCalendarEventItem[]> {
  const accessToken = await getCalendarAccessToken();
  if (!accessToken) {
    throw new Error("AUTH_REQUIRED");
  }

  const timeMin = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const params = new URLSearchParams({
    timeMin,
    maxResults: String(maxResults),
    singleEvents: "true",
    orderBy: "startTime",
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    }
  );

  if (res.status === 401 || res.status === 403) {
    cachedAccessToken = null;
    throw new Error("AUTH_REQUIRED");
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Kalender-Abruf fehlgeschlagen (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as { items?: GoogleCalendarEventItem[] };
  return Array.isArray(data.items) ? data.items : [];
}

/**
 * Creates a new on-site service visit event in the user's primary Google Calendar.
 */
export async function createCalendarVisitEvent(
  input: CreateCalendarVisitInput
): Promise<GoogleCalendarEventItem> {
  const accessToken = await getCalendarAccessToken();
  if (!accessToken) {
    throw new Error("AUTH_REQUIRED");
  }

  const { startDateTime, endDateTime, label } = resolveSlotStartEndIso(
    input.dateIso,
    input.slot
  );

  const summary = `Hannachi Termin: ${input.brand ? `${input.brand} ` : ""}${input.device} – ${input.customerName}`;
  const descriptionLines = [
    `Beratungs- & Übergabetermin · ${business.name} ${business.tagline}`,
    input.ticketId ? `Anfrage-Nr.: ${input.ticketId}` : null,
    `Kunde: ${input.customerName}`,
    `Telefon / WhatsApp: ${input.phone}`,
    input.email ? `E-Mail: ${input.email}` : null,
    `Gerät: ${input.brand ? `${input.brand} · ` : ""}${input.device}`,
    `Zeitfenster: ${label}`,
    `Anliegen / Ersatzteil: ${input.problem}`,
    `Ort / Lieferadresse: ${input.address}`,
    "",
    `Kontakt Hannachi: Tel. ${business.phoneDisplay} · ${business.url}`,
  ].filter(Boolean);

  const eventBody = {
    summary,
    location: input.address || `${business.zip} ${business.city}`,
    description: descriptionLines.join("\n"),
    start: {
      dateTime: startDateTime,
      timeZone: "Europe/Berlin",
    },
    end: {
      dateTime: endDateTime,
      timeZone: "Europe/Berlin",
    },
  };

  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventBody),
    }
  );

  if (res.status === 401 || res.status === 403) {
    cachedAccessToken = null;
    throw new Error("AUTH_REQUIRED");
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Termin konnte nicht erstellt werden (${res.status}): ${errText}`);
  }

  return (await res.json()) as GoogleCalendarEventItem;
}

/**
 * Updates an existing Google Calendar event's date/time slot or summary.
 * Must only be called after explicit user confirmation!
 */
export async function updateCalendarVisitEvent(
  eventId: string,
  updates: {
    summary?: string;
    location?: string;
    description?: string;
    dateIso: string;
    slot: string;
  }
): Promise<GoogleCalendarEventItem> {
  const accessToken = await getCalendarAccessToken();
  if (!accessToken) {
    throw new Error("AUTH_REQUIRED");
  }

  const { startDateTime, endDateTime } = resolveSlotStartEndIso(
    updates.dateIso,
    updates.slot
  );

  const patchBody: Record<string, unknown> = {
    start: {
      dateTime: startDateTime,
      timeZone: "Europe/Berlin",
    },
    end: {
      dateTime: endDateTime,
      timeZone: "Europe/Berlin",
    },
  };
  if (updates.summary) patchBody.summary = updates.summary;
  if (updates.location) patchBody.location = updates.location;
  if (updates.description) patchBody.description = updates.description;

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patchBody),
    }
  );

  if (res.status === 401 || res.status === 403) {
    cachedAccessToken = null;
    throw new Error("AUTH_REQUIRED");
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Termin-Update fehlgeschlagen (${res.status}): ${errText}`);
  }

  return (await res.json()) as GoogleCalendarEventItem;
}

/**
 * Deletes an event from the user's primary Google Calendar.
 * Must only be called after explicit user confirmation!
 */
export async function deleteCalendarVisitEvent(eventId: string): Promise<void> {
  const accessToken = await getCalendarAccessToken();
  if (!accessToken) {
    throw new Error("AUTH_REQUIRED");
  }

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (res.status === 401 || res.status === 403) {
    cachedAccessToken = null;
    throw new Error("AUTH_REQUIRED");
  }

  if (!res.ok && res.status !== 204 && res.status !== 410) {
    const errText = await res.text();
    throw new Error(`Termin konnte nicht gelöscht werden (${res.status}): ${errText}`);
  }
}

/**
 * Converts an AdminRepairTicket into a CreateCalendarVisitInput object.
 */
export function buildCalendarVisitFromTicket(
  ticket: AdminRepairTicket
): CreateCalendarVisitInput {
  const deviceLabel = ticket.device.includes("Anderes")
    ? ticket.customDevice || "Hausgerät"
    : ticket.device;
  const address =
    [ticket.streetAddress, ticket.zip.replace(" (Werkstatt)", "")]
      .filter(Boolean)
      .join(", ") || `${business.zip} ${business.city}`;
  const dateIso =
    ticket.scheduledDate && /^\d{4}-\d{2}-\d{2}$/.test(ticket.scheduledDate)
      ? ticket.scheduledDate
      : new Date().toISOString().slice(0, 10);

  return {
    customerName: ticket.name,
    phone: ticket.phone,
    email: ticket.email,
    device: deviceLabel,
    brand: ticket.brand,
    problem: ticket.problem,
    address,
    dateIso,
    slot: ticket.scheduledSlot || "08:00–11:00 (Vormittag)",
    ticketId: ticket.id,
  };
}
