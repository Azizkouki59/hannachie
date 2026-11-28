"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "firebase/auth";
import {
  AlertTriangle,
  Calendar,
  CalendarCheck,
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  LogOut,
  MapPin,
  RefreshCw,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { business } from "@/data/site";
import { isSafeHttpsUrl } from "@/utils/sanitize";
import {
  ADMIN_TIME_SLOTS,
  getTodayIsoDate,
  type AdminRepairTicket,
  type AdminTimeSlot,
} from "@/lib/adminTypes";
import {
  deviceTypes,
  osnabrueckServiceAreas,
  popularBrands,
} from "@/lib/repairRequest";
import {
  buildCalendarVisitFromTicket,
  createCalendarVisitEvent,
  deleteCalendarVisitEvent,
  getCalendarAccessToken,
  googleCalendarLogout,
  googleCalendarSignIn,
  initCalendarAuth,
  listUpcomingCalendarEvents,
  updateCalendarVisitEvent,
  type GoogleCalendarEventItem,
} from "@/lib/googleCalendarClient";

interface GoogleCalendarSchedulerProps {
  mode?: "customer" | "admin";
  defaultDevice?: string;
  defaultProblem?: string;
  scheduledTickets?: AdminRepairTicket[];
  onToast?: (msg: string) => void;
  onVisitScheduled?: (event: GoogleCalendarEventItem) => void;
}

type PendingMutation =
  | {
      type: "delete";
      event: GoogleCalendarEventItem;
    }
  | {
      type: "update";
      event: GoogleCalendarEventItem;
      newDateIso: string;
      newSlot: string;
    };

export function OfficialGoogleSignInButton({
  onClick,
  disabled,
  label = "Sign in with Google",
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid="google-calendar-signin-btn"
      className="gsi-material-button inline-flex min-h-[44px] items-center justify-center gap-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-white shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
    >
      <div className="gsi-material-button-state" />
      <div className="gsi-material-button-content-wrapper flex items-center gap-2.5">
        <div className="gsi-material-button-icon w-5 h-5 shrink-0">
          <svg
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            className="block w-5 h-5"
            aria-hidden="true"
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
            <path fill="none" d="M0 0h48v48H0z" />
          </svg>
        </div>
        <span
          key={label === "Sign in with Google" ? "gcal-signin" : "gcal-busy"}
          translate={label === "Sign in with Google" ? "no" : undefined}
          className={`gsi-material-button-contents${label === "Sign in with Google" ? " notranslate" : ""}`}
        >
          {label}
        </span>
      </div>
    </button>
  );
}

export default function GoogleCalendarScheduler({
  mode = "customer",
  defaultDevice = "Waschmaschine",
  defaultProblem = "",
  scheduledTickets = [],
  onToast,
  onVisitScheduled,
}: GoogleCalendarSchedulerProps) {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isOptionalExpanded, setIsOptionalExpanded] = useState(
    mode === "admin"
  );

  const [events, setEvents] = useState<GoogleCalendarEventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<{
    title: string;
    htmlLink?: string;
  } | null>(null);

  // Visit Booking Form State
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [device, setDevice] = useState(defaultDevice || "Waschmaschine");
  const [brand, setBrand] = useState("Miele");
  const [zip, setZip] = useState("49082 Osnabrück");
  const [streetAddress, setStreetAddress] = useState("");
  const [problem, setProblem] = useState(defaultProblem || "");
  const [visitDate, setVisitDate] = useState(() => getTodayIsoDate(1));
  const [visitSlot, setVisitSlot] = useState<AdminTimeSlot>(
    ADMIN_TIME_SLOTS[0]
  );
  const [submitting, setSubmitting] = useState(false);
  const [syncingTicketId, setSyncingTicketId] = useState<string | null>(null);
  const [privacyAccepted, setPrivacyAccepted] = useState(mode === "admin");

  // Inline reschedule state for an existing event
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState(() => getTodayIsoDate(1));
  const [rescheduleSlot, setRescheduleSlot] = useState<AdminTimeSlot>(
    ADMIN_TIME_SLOTS[0]
  );

  // Explicit Confirmation Modal state for mutating/destructive operations (update/delete)
  const [pendingMutation, setPendingMutation] =
    useState<PendingMutation | null>(null);
  const [mutating, setMutating] = useState(false);

  const notify = useCallback(
    (msg: string) => {
      if (onToast) onToast(msg);
    },
    [onToast]
  );

  const loadEvents = useCallback(async () => {
    const token = await getCalendarAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }
    setLoadingEvents(true);
    setErrorMsg(null);
    try {
      const list = await listUpcomingCalendarEvents(12);
      setEvents(list);
      setNeedsAuth(false);
    } catch (err) {
      if (err instanceof Error && err.message === "AUTH_REQUIRED") {
        setNeedsAuth(true);
      } else {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : "Kalendertermine konnten nicht geladen werden."
        );
      }
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = initCalendarAuth(
      (authedUser) => {
        setUser(authedUser);
        setNeedsAuth(false);
        setIsOptionalExpanded(true);
        if (!email && authedUser.email) {
          setEmail(authedUser.email);
        }
        if (!customerName && authedUser.displayName && mode === "customer") {
          setCustomerName(authedUser.displayName);
        }
        void loadEvents();
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
        setEvents([]);
      }
    );
    return () => unsubscribe();
  }, [customerName, email, loadEvents, mode]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMsg(null);
    try {
      const result = await googleCalendarSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
        if (!email && result.user.email) {
          setEmail(result.user.email);
        }
        if (!customerName && result.user.displayName && mode === "customer") {
          setCustomerName(result.user.displayName);
        }
        notify("Erfolgreich mit Google Kalender verbunden");
        await loadEvents();
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Google-Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut."
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await googleCalendarLogout();
    setUser(null);
    setNeedsAuth(true);
    setEvents([]);
    notify("Google Kalender Verbindung getrennt");
  };

  const handleScheduleVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessBanner(null);

    const token = await getCalendarAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }

    if (!customerName.trim() || !phone.trim() || !problem.trim()) {
      setErrorMsg(
        "Bitte geben Sie Name, Telefonnummer und eine kurze Beschreibung des Anliegens ein."
      );
      return;
    }

    if (mode === "customer" && !privacyAccepted) {
      setErrorMsg(
        "Bitte bestätigen Sie kurz den Datenschutzhinweis, bevor Sie den Termin eintragen."
      );
      return;
    }

    setSubmitting(true);
    try {
      const fullAddress = [streetAddress.trim(), zip.trim()]
        .filter(Boolean)
        .join(", ");

      // 1. Create event in Google Calendar
      const createdEvent = await createCalendarVisitEvent({
        customerName: customerName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        device,
        brand,
        problem: problem.trim(),
        address: fullAddress || `${business.zip} ${business.city}`,
        dateIso: visitDate,
        slot: visitSlot,
      });

      // 2. Register the appointment in the validated Hannachi backend order book
      if (mode === "customer") {
        await fetch("/api/repair-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inquiryMode: "repair",
            name: customerName.trim(),
            phone: phone.trim(),
            email: email.trim(),
            visitType: "home_visit",
            urgency: "normal",
            device: device || "Waschmaschine",
            brand,
            problem: `[Google Kalender Termin: ${visitDate} · ${visitSlot}] ${problem.trim()}`,
            zip: zip.trim() || `${business.zip} ${business.city}`,
            streetAddress: streetAddress.trim(),
            callbackTime: `${visitDate} (${visitSlot})`,
            website: "",
          }),
        }).catch(() => null);
      }

      setSuccessBanner({
        title: `Termin am ${new Date(
          `${visitDate}T12:00:00`
        ).toLocaleDateString("de-DE", {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })} (${visitSlot}) im Google Kalender eingetragen!`,
        htmlLink: createdEvent.htmlLink,
      });
      notify("Termin erfolgreich im Google Kalender erstellt");
      if (onVisitScheduled) onVisitScheduled(createdEvent);
      await loadEvents();
    } catch (err) {
      if (err instanceof Error && err.message === "AUTH_REQUIRED") {
        setNeedsAuth(true);
      } else {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : "Termin konnte nicht im Google Kalender gespeichert werden."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSyncAdminTicketToCalendar = async (ticket: AdminRepairTicket) => {
    setErrorMsg(null);
    const token = await getCalendarAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }

    setSyncingTicketId(ticket.id);
    try {
      const visitInput = buildCalendarVisitFromTicket(ticket);
      const created = await createCalendarVisitEvent(visitInput);
      setSuccessBanner({
        title: `Auftrag ${ticket.id} (${ticket.name}) in Google Kalender eingetragen`,
        htmlLink: created.htmlLink,
      });
      notify(`Auftrag ${ticket.id} in Google Kalender synchronisiert`);
      if (onVisitScheduled) onVisitScheduled(created);
      await loadEvents();
    } catch (err) {
      if (err instanceof Error && err.message === "AUTH_REQUIRED") {
        setNeedsAuth(true);
      } else {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : "Synchronisierung mit Google Kalender fehlgeschlagen."
        );
      }
    } finally {
      setSyncingTicketId(null);
    }
  };

  /**
   * Executes the confirmed update or delete operation after user clicks Confirm in the modal.
   */
  const executeConfirmedMutation = async () => {
    if (!pendingMutation) return;
    setMutating(true);
    setErrorMsg(null);
    try {
      if (pendingMutation.type === "delete") {
        await deleteCalendarVisitEvent(pendingMutation.event.id);
        notify("Kalendertermin wurde gelöscht");
      } else {
        await updateCalendarVisitEvent(pendingMutation.event.id, {
          dateIso: pendingMutation.newDateIso,
          slot: pendingMutation.newSlot,
        });
        setEditingEventId(null);
        notify("Kalendertermin wurde aktualisiert");
      }
      setPendingMutation(null);
      await loadEvents();
    } catch (err) {
      if (err instanceof Error && err.message === "AUTH_REQUIRED") {
        setNeedsAuth(true);
        setPendingMutation(null);
      } else {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : "Änderung im Google Kalender fehlgeschlagen."
        );
      }
    } finally {
      setMutating(false);
    }
  };

  const showOptionalCollapsed =
    mode === "customer" && needsAuth && !isOptionalExpanded;

  return (
    <div
      data-testid={`google-calendar-scheduler-${mode}`}
      className={`rounded-2xl border p-5 sm:p-6 shadow-xs transition-colors ${
        mode === "customer"
          ? "border-dashed border-primary/20 dark:border-white/20 bg-surface/80 dark:bg-slate-900/75"
          : "border-primary/12 dark:border-white/12 bg-surface dark:bg-slate-900"
      } ${showOptionalCollapsed ? "" : "space-y-5"}`}
    >
      {/* Top Header Row */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          showOptionalCollapsed
            ? ""
            : "pb-4 border-b border-primary/10 dark:border-white/10"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              <span>
                <span translate="no" className="notranslate">Google Calendar</span>{" "}
                Integration
              </span>
              {mode === "customer" && (
                <span
                  data-testid="calendar-optional-badge"
                  className="inline-flex items-center rounded-md border border-primary/15 dark:border-white/15 bg-primary/5 dark:bg-white/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-ink-muted"
                >
                  Optional
                </span>
              )}
            </div>
            <h3 key={`h-${mode}`} className="text-base sm:text-lg font-extrabold text-ink">
              {mode === "admin" ? (
                <>
                  <span translate="no" className="notranslate">Google Kalender</span>{" "}
                  Synchronisierung &amp; Übergabetermine
                </>
              ) : (
                <>
                  Optional: Übergabe- oder Beratungstermin im{" "}
                  <span translate="no" className="notranslate">Google Kalender</span>{" "}
                  eintragen
                </>
              )}
            </h3>
            <p key={`p-${mode}`} className="text-xs text-ink-muted mt-0.5">
              {mode === "admin" ? (
                <>
                  Synchronisieren Sie Ihre geplanten Übergabe- und Beratungstermine mit 1 Klick in Ihren{" "}
                  <span translate="no" className="notranslate">Google Kalender</span>.
                </>
              ) : (
                <>
                  Nicht erforderlich: Für Ihre Anfrage genügt das Formular oben. Optional können Sie den Termin hier zusätzlich in Ihrem{" "}
                  <span translate="no" className="notranslate">Google Kalender</span>{" "}
                  speichern.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Auth Status / Optional Expand Toggle / Sign-in or Sign-out */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {mode === "customer" && needsAuth ? (
            <button
              type="button"
              onClick={() => setIsOptionalExpanded((prev) => !prev)}
              aria-expanded={isOptionalExpanded}
              data-testid="calendar-optional-toggle-btn"
              className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-primary/15 dark:border-white/15 bg-surface dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-primary dark:text-slate-100 hover:border-sky-500/50 hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer"
            >
              <span
                key={isOptionalExpanded ? "gcal-exp" : "gcal-col"}
                className="inline-flex items-center gap-1.5"
              >
                <span>
                  {isOptionalExpanded ? "Ausblenden" : "Optional nutzen"}
                </span>
                {isOptionalExpanded ? (
                  <ChevronUp className="w-4 h-4 shrink-0" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-4 h-4 shrink-0" aria-hidden="true" />
                )}
              </span>
            </button>
          ) : needsAuth ? (
            <OfficialGoogleSignInButton
              onClick={() => void handleLogin()}
              disabled={isLoggingIn}
              label={isLoggingIn ? "Verbinde…" : "Sign in with Google"}
            />
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {user?.email && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span
                    dir="ltr"
                    translate="no"
                    className="notranslate truncate max-w-[180px]"
                  >
                    {user.email}
                  </span>
                </span>
              )}
              <button
                type="button"
                onClick={() => void loadEvents()}
                disabled={loadingEvents}
                title="Kalendertermine aktualisieren"
                className="min-h-[38px] px-3 py-1.5 rounded-lg border border-primary/15 dark:border-white/15 text-xs font-bold text-ink hover:bg-primary/5 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loadingEvents ? "animate-spin" : ""}`}
                />
                <span>Aktualisieren</span>
              </button>
              <button
                type="button"
                onClick={() => void handleLogout()}
                title="Google-Konto trennen"
                className="min-h-[38px] px-3 py-1.5 rounded-lg border border-primary/15 dark:border-white/15 text-xs font-semibold text-ink-muted hover:text-red-600 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Abmelden</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error or Success Alerts */}
      {errorMsg && !showOptionalCollapsed && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/35 bg-red-500/10 p-3.5 text-xs sm:text-sm text-red-800 dark:text-red-200 flex items-start justify-between gap-3"
        >
          <span dir="auto">{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-red-700 dark:text-red-300 hover:opacity-80 cursor-pointer"
            aria-label="Fehlermeldung schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successBanner && (
        <div
          role="status"
          className="rounded-xl border border-emerald-500/40 bg-emerald-500/12 p-4 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2 font-bold">
            <CalendarCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span dir="auto">{successBanner.title}</span>
          </div>
          {successBanner.htmlLink && isSafeHttpsUrl(successBanner.htmlLink) && (
            <a
              href={successBanner.htmlLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[38px] items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shrink-0"
            >
              <span>
                Im <span translate="no" className="notranslate">Google Kalender</span>{" "}
                öffnen
              </span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* Unauthenticated Prompt State (hidden when collapsed in optional customer mode) */}
      {showOptionalCollapsed ? null : needsAuth ? (
        <div className="rounded-xl border border-dashed border-sky-500/35 bg-sky-500/[0.04] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <h4 className="text-sm sm:text-base font-extrabold text-ink">
              Optional: Mit <span translate="no" className="notranslate">Google</span>{" "}
              anmelden, um persönliche Termine vorzumerken
            </h4>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Dieser Schritt ist freiwillig. Nach der Anmeldung können Sie freie Zeitfenster prüfen, einen persönlichen Beratungs- oder Übergabetermin für Beratung, Original-Ersatzteile oder ausgewählte Markengeräte direkt im{" "}
              <span translate="no" className="notranslate">Google Kalender</span>{" "}
              anlegen und verwalten. Hinweise zur Datenverarbeitung durch{" "}
              <span translate="no" className="notranslate">Google</span> finden Sie in unserer{" "}
              <Link href="/datenschutz#google" className="font-semibold text-accent underline underline-offset-2">
                Datenschutzerklärung
              </Link>
              .
            </p>
          </div>
          <div className="shrink-0">
            <OfficialGoogleSignInButton
              onClick={() => void handleLogin()}
              disabled={isLoggingIn}
              label={isLoggingIn ? "Verbinde…" : "Sign in with Google"}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 7 Cols: Schedule a New Visit Form (or Quick Admin Sync) */}
          <div className="lg:col-span-7 space-y-5">
            {mode === "admin" && scheduledTickets.length > 0 && (
              <div className="rounded-xl border border-sky-500/30 bg-sky-500/[0.05] p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-extrabold text-ink flex items-center gap-1.5">
                    <CalendarPlus className="w-4 h-4 text-sky-600" />
                    <span>
                      Terminierte Aufträge mit 1 Klick in{" "}
                      <span translate="no" className="notranslate">Google Kalender</span>{" "}
                      übertragen ({scheduledTickets.length})
                    </span>
                  </h4>
                </div>
                <div className="divide-y divide-primary/10 dark:divide-white/10 max-h-60 overflow-y-auto pr-1">
                  {scheduledTickets.map((t) => {
                    const isSyncing = syncingTicketId === t.id;
                    return (
                      <div
                        key={t.id}
                        className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-extrabold text-ink truncate">
                            <span dir="ltr" translate="no" className="notranslate">
                              {t.scheduledDate} ({t.scheduledSlot})
                            </span>{" "}
                            · <span dir="auto">{t.name}</span>
                          </div>
                          <div className="text-[11px] text-ink-muted truncate">
                            <span dir="ltr" translate="no" className="notranslate">
                              {t.brand}
                            </span>{" "}
                            <span>{t.device}</span> ·{" "}
                            <span dir="auto">{t.streetAddress || t.zip}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={isSyncing}
                          onClick={() => void handleSyncAdminTicketToCalendar(t)}
                          data-testid={`sync-ticket-gcal-btn-${t.id}`}
                          className="min-h-[38px] px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-60"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                          <span key={isSyncing ? "sync-busy" : "sync-idle"}>
                            {isSyncing ? (
                              "Übertrage…"
                            ) : (
                              <>
                                In{" "}
                                <span translate="no" className="notranslate">
                                  Google Kalender
                                </span>
                              </>
                            )}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <form
              onSubmit={(e) => void handleScheduleVisitSubmit(e)}
              className="rounded-xl border border-primary/10 dark:border-white/10 bg-background dark:bg-slate-950 p-4 sm:p-5 space-y-4"
            >
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-primary/10 dark:border-white/10">
                <h4 className="text-sm font-extrabold text-ink flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-accent" />
                  <span>Persönlichen Beratungs- oder Übergabetermin eintragen</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Wunsch-Datum *
                  </label>
                  <input
                    type="date"
                    required
                    min={getTodayIsoDate(0)}
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-surface dark:bg-slate-900 border border-primary/15 dark:border-white/15 text-base sm:text-sm font-mono text-ink"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Zeitfenster *
                  </label>
                  <select
                    value={visitSlot}
                    onChange={(e) =>
                      setVisitSlot(e.target.value as AdminTimeSlot)
                    }
                    className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-surface dark:bg-slate-900 border border-primary/15 dark:border-white/15 text-base sm:text-sm font-bold text-ink"
                  >
                    {ADMIN_TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Gerät *
                  </label>
                  <select
                    value={device}
                    onChange={(e) => setDevice(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-surface dark:bg-slate-900 border border-primary/15 dark:border-white/15 text-base sm:text-sm text-ink"
                  >
                    {deviceTypes.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Marke / Hersteller
                  </label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-surface dark:bg-slate-900 border border-primary/15 dark:border-white/15 text-base sm:text-sm text-ink"
                  >
                    {popularBrands.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Kundenname *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Vor- und Nachname"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-surface dark:bg-slate-900 border border-primary/15 dark:border-white/15 text-base sm:text-sm text-ink"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Telefon / <span translate="no" className="notranslate">WhatsApp</span> *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="z. B. 0170 3493494"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-surface dark:bg-slate-900 border border-primary/15 dark:border-white/15 text-base sm:text-sm font-mono text-ink"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    PLZ &amp; Ort (Region{" "}
                    <span translate="no" className="notranslate">Osnabrück</span>)
                  </label>
                  <select
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-surface dark:bg-slate-900 border border-primary/15 dark:border-white/15 text-base sm:text-sm text-ink"
                  >
                    {osnabrueckServiceAreas.map((area) => (
                      <option key={area.value} value={area.value}>
                        {area.label} ({area.zip})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Straße &amp; Hausnummer
                  </label>
                  <input
                    type="text"
                    placeholder="z. B. Iburger Straße 5"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-surface dark:bg-slate-900 border border-primary/15 dark:border-white/15 text-base sm:text-sm text-ink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Anliegen / Gesuchtes Ersatzteil oder Gerät *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Kurze Angabe (z. B. Original-Ersatzteil nach E-Nr., Beratung oder Markengerät auf Anfrage)…"
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface dark:bg-slate-900 border border-primary/15 dark:border-white/15 text-base sm:text-sm text-ink"
                />
              </div>

              {mode === "customer" && (
                <label className="flex items-start gap-2.5 rounded-xl border border-primary/12 dark:border-white/12 bg-surface dark:bg-slate-900 px-3 py-2.5 text-[11px] sm:text-xs text-ink-muted leading-relaxed cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded accent-sky-600 cursor-pointer"
                  />
                  <span>
                    Ich stimme der Verarbeitung meiner Angaben zur Terminabstimmung sowie der
                    Eintragung über{" "}
                    <span translate="no" className="notranslate">Google Kalender</span>{" "}
                    gemäß{" "}
                    <Link
                      href="/datenschutz#google"
                      className="font-semibold text-accent underline underline-offset-2"
                    >
                      Datenschutzerklärung
                    </Link>{" "}
                    zu.
                  </span>
                </label>
              )}

              <button
                type="submit"
                disabled={submitting}
                data-testid="submit-google-calendar-visit-btn"
                className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-sm inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-60"
              >
                <CalendarPlus className="w-4 h-4 shrink-0" />
                <span key={submitting ? "gcal-sub" : "gcal-idle"}>
                  {submitting ? (
                    <>
                      Trage Termin in{" "}
                      <span translate="no" className="notranslate">Google Kalender</span>{" "}
                      ein…
                    </>
                  ) : (
                    <>
                      Persönlichen Termin im{" "}
                      <span translate="no" className="notranslate">Google Kalender</span>{" "}
                      eintragen
                    </>
                  )}
                </span>
              </button>
            </form>
          </div>

          {/* Right 5 Cols: Upcoming Google Calendar Events List */}
          <div className="lg:col-span-5 rounded-xl border border-primary/10 dark:border-white/10 bg-background dark:bg-slate-950 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-primary/10 dark:border-white/10">
              <h4 className="text-sm font-extrabold text-ink flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-500" />
                <span>
                  Kommende Termine im{" "}
                  <span translate="no" className="notranslate">Google Kalender</span>{" "}
                  ({events.length})
                </span>
              </h4>
            </div>

            {loadingEvents ? (
              <div className="py-8 text-center text-xs text-ink-muted">
                Lade{" "}
                <span translate="no" className="notranslate">Google Kalender</span>
                -Termine…
              </div>
            ) : events.length === 0 ? (
              <div className="py-8 text-center text-xs text-ink-muted">
                Keine anstehenden Termine in den nächsten Tagen gefunden.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {events.map((ev) => {
                  const startRaw = ev.start?.dateTime || ev.start?.date || "";
                  const startDate = startRaw ? new Date(startRaw) : null;
                  const formattedStart = startDate
                    ? startDate.toLocaleString("de-DE", {
                        weekday: "short",
                        day: "2-digit",
                        month: "2-digit",
                        hour: ev.start?.dateTime ? "2-digit" : undefined,
                        minute: ev.start?.dateTime ? "2-digit" : undefined,
                      })
                    : "Termin";
                  const isEditingThis = editingEventId === ev.id;

                  return (
                    <div
                      key={ev.id}
                      className="rounded-xl border border-primary/12 dark:border-white/10 bg-surface dark:bg-slate-900 p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span
                            dir="ltr"
                            translate="no"
                            className="notranslate inline-block px-2 py-0.5 rounded bg-sky-500/15 text-sky-700 dark:text-sky-300 font-mono text-[11px] font-bold"
                          >
                            {formattedStart}
                          </span>
                          <h5
                            dir="auto"
                            className="text-xs sm:text-sm font-extrabold text-ink mt-1 break-words"
                          >
                            {ev.summary || "(Ohne Titel)"}
                          </h5>
                          {ev.location && (
                            <p className="text-[11px] text-ink-muted flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-accent shrink-0" />
                              <span dir="auto" className="truncate">
                                {ev.location}
                              </span>
                            </p>
                          )}
                        </div>
                        {ev.htmlLink && isSafeHttpsUrl(ev.htmlLink) && (
                          <a
                            href={ev.htmlLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="In Google Kalender öffnen"
                            className="p-1.5 rounded-lg border border-primary/10 dark:border-white/10 text-ink-muted hover:text-ink shrink-0"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>

                      {isEditingThis ? (
                        <div className="pt-2 border-t border-primary/10 dark:border-white/10 space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="date"
                              min={getTodayIsoDate(0)}
                              value={rescheduleDate}
                              onChange={(e) => setRescheduleDate(e.target.value)}
                              className="min-h-[38px] px-2.5 py-1 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-xs font-mono text-ink"
                            />
                            <select
                              value={rescheduleSlot}
                              onChange={(e) =>
                                setRescheduleSlot(e.target.value as AdminTimeSlot)
                              }
                              className="min-h-[38px] px-2.5 py-1 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-xs font-bold text-ink"
                            >
                              {ADMIN_TIME_SLOTS.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingEventId(null)}
                              className="min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-semibold text-ink-muted hover:text-ink cursor-pointer"
                            >
                              Abbrechen
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setPendingMutation({
                                  type: "update",
                                  event: ev,
                                  newDateIso: rescheduleDate,
                                  newSlot: rescheduleSlot,
                                })
                              }
                              className="min-h-[34px] px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold cursor-pointer"
                            >
                              Zeitänderung prüfen…
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingEventId(ev.id);
                              setRescheduleDate(
                                ev.start?.dateTime
                                  ? ev.start.dateTime.slice(0, 10)
                                  : getTodayIsoDate(1)
                              );
                            }}
                            className="min-h-[34px] px-2.5 py-1 rounded-lg border border-primary/15 dark:border-white/15 text-[11px] font-bold text-ink hover:border-sky-500 cursor-pointer"
                          >
                            Verschieben
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setPendingMutation({
                                type: "delete",
                                event: ev,
                              })
                            }
                            className="min-h-[34px] px-2.5 py-1 rounded-lg border border-red-500/25 text-[11px] font-bold text-red-600 dark:text-red-400 hover:bg-red-500/10 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Löschen</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Explicit Confirmation Dialog Modal for Updating or Deleting a Google Calendar Event */}
      {pendingMutation && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="gcal-confirm-modal-title"
          className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs"
        >
          <div className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-primary/15 dark:border-white/15 bg-surface dark:bg-slate-900 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  pendingMutation.type === "delete"
                    ? "bg-red-500/15 text-red-600"
                    : "bg-amber-500/15 text-amber-600"
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4
                  key={pendingMutation.type}
                  id="gcal-confirm-modal-title"
                  className="text-base font-extrabold text-ink"
                >
                  {pendingMutation.type === "delete" ? (
                    <>
                      Termin aus{" "}
                      <span translate="no" className="notranslate">Google Kalender</span>{" "}
                      löschen?
                    </>
                  ) : (
                    <>
                      Termin im{" "}
                      <span translate="no" className="notranslate">Google Kalender</span>{" "}
                      aktualisieren?
                    </>
                  )}
                </h4>
                <p
                  key={`p-${pendingMutation.type}`}
                  className="text-xs sm:text-sm text-ink-muted mt-1 leading-relaxed"
                >
                  {pendingMutation.type === "delete" ? (
                    <>
                      Möchten Sie den Termin{" "}
                      <strong dir="auto" className="text-ink">
                        „{pendingMutation.event.summary || "Termin"}“
                      </strong>{" "}
                      wirklich dauerhaft aus Ihrem{" "}
                      <span translate="no" className="notranslate">Google Kalender</span>{" "}
                      entfernen?
                    </>
                  ) : (
                    <>
                      Möchten Sie den Termin{" "}
                      <strong dir="auto" className="text-ink">
                        „{pendingMutation.event.summary || "Termin"}“
                      </strong>{" "}
                      im{" "}
                      <span translate="no" className="notranslate">Google Kalender</span>{" "}
                      auf den{" "}
                      <strong dir="ltr" translate="no" className="notranslate text-ink">
                        {pendingMutation.newDateIso} ({pendingMutation.newSlot})
                      </strong>{" "}
                      verschieben?
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-primary/10 dark:border-white/10">
              <button
                type="button"
                disabled={mutating}
                onClick={() => setPendingMutation(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-primary/15 dark:border-white/15 text-xs sm:text-sm font-bold text-ink hover:bg-primary/5 cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="button"
                disabled={mutating}
                onClick={() => void executeConfirmedMutation()}
                data-testid="confirm-gcal-mutation-btn"
                className={`min-h-[44px] px-4 py-2 rounded-xl text-white text-xs sm:text-sm font-extrabold cursor-pointer ${
                  pendingMutation.type === "delete"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-sky-600 hover:bg-sky-500"
                }`}
              >
                <span key={mutating ? "mut-busy" : pendingMutation.type}>
                  {mutating
                    ? "Wird ausgeführt…"
                    : pendingMutation.type === "delete"
                    ? "Ja, Termin löschen"
                    : "Ja, Termin aktualisieren"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
