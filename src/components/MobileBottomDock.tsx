"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock,
  Copy,
  FileText,
  HelpCircle,
  Home,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Tag,
  PackageSearch,
  X,
} from "lucide-react";
import { business } from "@/data/site";
import { useGoogleLivePlace } from "@/lib/googlePlaceLive";
import { hapticDismiss, hapticTap, triggerHapticFeedback } from "@/lib/haptics";
import {
  loadRepairDraft,
  REPAIR_DRAFT_EVENT,
  toWhatsAppInput,
  type RepairDraft,
} from "@/lib/repairRequest";
import {
  buildWhatsAppDirectUrl,
  createHannachiWhatsAppPayload,
  DEFAULT_WHATSAPP_GREETING,
  formatQuickWhatsAppMessage,
  HANNACHI_WHATSAPP_PHONE,
} from "@/utils/whatsapp";
import { useQuickRequest } from "@/components/QuickRequestSheet";

export interface MobileBottomDockProps {
  phoneHref?: string;
  whatsappHref?: string;
}

type DockWidgetMode = "call" | "whatsapp" | null;

interface OneTapWhatsAppDemand {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof Tag;
  message: string;
}

const ONE_TAP_WHATSAPP_DEMANDS: OneTapWhatsAppDemand[] = [
  {
    id: "ersatzteil",
    title: "Ersatzteil / Typenschild (E-Nr.)",
    subtitle: "Originalteil anfragen oder Foto senden",
    icon: Tag,
    message: formatQuickWhatsAppMessage({
      title: "Ersatzteil-Anfrage",
      detail: "Ich suche ein Original-Ersatzteil für mein Hausgerät.",
      photoHint: true,
    }),
  },
  {
    id: "geraet",
    title: "Markengerät auf Anfrage",
    subtitle: "Aktueller Bestand & Preis in Osnabrück",
    icon: Package,
    message: formatQuickWhatsAppMessage({
      title: "Geräte-Anfrage",
      detail: "Ich interessiere mich für ein ausgewähltes Markengerät auf Anfrage.",
    }),
  },
  {
    id: "beratung",
    title: "Kurze Fachberatung",
    subtitle: "Persönliche Einschätzung zum Hausgerät",
    icon: HelpCircle,
    message: formatQuickWhatsAppMessage({
      title: "Kurze Fachberatung",
      detail: "Ich hätte eine kurze Frage zur persönlichen Fachberatung für mein Hausgerät.",
    }),
  },
  {
    id: "termin",
    title: "Termin vereinbaren",
    subtitle: "Abholung oder Beratung in Osnabrück",
    icon: CalendarDays,
    message: formatQuickWhatsAppMessage({
      title: "Termin-Anfrage",
      detail: "Ich möchte gerne einen kurzen Termin nach Vereinbarung in Osnabrück abstimmen.",
    }),
  },
];

export default function MobileBottomDock({
  phoneHref = business.phoneHref,
  whatsappHref = business.whatsappHref,
}: MobileBottomDockProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const { place } = useGoogleLivePlace();
  const { isOpen: isQuickRequestOpen, openQuickRequest } = useQuickRequest();
  const [savedDraft, setSavedDraft] = useState<RepairDraft | null>(() =>
    loadRepairDraft()
  );
  const [isScrolled, setIsScrolled] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [activeWidget, setActiveWidget] = useState<DockWidgetMode>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [customWaText, setCustomWaText] = useState("");
  const [redirectingLabel, setRedirectingLabel] = useState<string | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const customSendLinkRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const next = window.scrollY > 24;
      setIsScrolled((curr) => (curr !== next ? next : curr));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const isTextInput = (el: Element | null): boolean => {
      if (!el) return false;
      if (el.closest('[data-testid="mobile-dock-preredirect-widget"]')) {
        return false;
      }
      const tag = el.tagName;
      if (tag === "TEXTAREA" || tag === "SELECT") return true;
      if (tag === "INPUT") {
        const type = ((el as HTMLInputElement).type || "text").toLowerCase();
        return ![
          "checkbox",
          "radio",
          "button",
          "submit",
          "reset",
          "file",
          "range",
          "color",
        ].includes(type);
      }
      return (el as HTMLElement).isContentEditable === true;
    };

    const handleFocusIn = (e: FocusEvent) => {
      if (window.innerWidth < 1024 && isTextInput(e.target as Element | null)) {
        setIsKeyboardOpen(true);
      }
    };

    const handleFocusOut = () => {
      window.setTimeout(() => {
        if (!isTextInput(document.activeElement)) {
          setIsKeyboardOpen(false);
        }
      }, 80);
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);
    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  useEffect(() => {
    const syncDraft = () => {
      setSavedDraft(loadRepairDraft());
    };
    syncDraft();
    window.addEventListener(REPAIR_DRAFT_EVENT, syncDraft);
    window.addEventListener("storage", syncDraft);
    return () => {
      window.removeEventListener(REPAIR_DRAFT_EVENT, syncDraft);
      window.removeEventListener("storage", syncDraft);
    };
  }, [isQuickRequestOpen, pathname]);

  useEffect(() => {
    setActiveWidget(null);
    setRedirectingLabel(null);
  }, [pathname, isQuickRequestOpen]);

  useEffect(() => {
    if (!activeWidget) return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        hapticDismiss();
        setActiveWidget(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeWidget]);

  const draftWhatsAppPayload = useMemo(() => {
    if (!savedDraft?.values) return null;
    try {
      const payload = createHannachiWhatsAppPayload(
        toWhatsAppInput({ ...savedDraft.values, photo: null })
      );
      return payload.valid ? payload : null;
    } catch {
      return null;
    }
  }, [savedDraft]);

  const draftWhatsAppResult = draftWhatsAppPayload?.whatsappUrl ?? null;

  const effectivePhoneHref = place.phoneHref || phoneHref;
  const effectivePhoneDisplay = place.phoneDisplay || business.phoneDisplay;
  const effectiveWhatsappHref = draftWhatsAppResult || whatsappHref;
  const shouldHideDock = isKeyboardOpen || isQuickRequestOpen;

  const customWhatsAppHref = useMemo(() => {
    const trimmed = customWaText.trim();
    const msg = trimmed
      ? formatQuickWhatsAppMessage({
          title: "Kurze Nachricht",
          detail: trimmed,
        })
      : DEFAULT_WHATSAPP_GREETING;
    return buildWhatsAppDirectUrl(msg, HANNACHI_WHATSAPP_PHONE);
  }, [customWaText]);

  const cleanPath =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  const isHomeActive = cleanPath === "/";
  const isServiceActive = cleanPath.startsWith("/leistungen");
  const isContactActive =
    cleanPath.startsWith("/kontakt") || cleanPath.startsWith("/anfrage");

  const handleNavTap = () => {
    hapticTap();
    setActiveWidget(null);
    setRedirectingLabel(null);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hannachi-close-mobile-nav"));
    }
  };

  const handleTogglePreRedirectWidget = (
    e: React.MouseEvent<HTMLAnchorElement>,
    mode: Exclude<DockWidgetMode, null>
  ) => {
    e.preventDefault();
    triggerHapticFeedback(35);
    setRedirectingLabel(null);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hannachi-close-mobile-nav"));
    }
    setActiveWidget((curr) => (curr === mode ? null : mode));
  };

  // Keep link mounted briefly so external navigation (tel: / WhatsApp) never cancels on mobile
  const scheduleWidgetCloseAfterRedirect = (label: string) => {
    triggerHapticFeedback(45);
    setRedirectingLabel(label);
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => {
      setActiveWidget(null);
      setRedirectingLabel(null);
    }, 550);
  };

  const handleCopyPhoneNumber = async () => {
    triggerHapticFeedback(25);
    try {
      await navigator.clipboard.writeText(effectivePhoneDisplay);
      setCopiedPhone(true);
      window.setTimeout(() => setCopiedPhone(false), 1800);
    } catch {
      setCopiedPhone(false);
    }
  };

  const tabSpring = prefersReducedMotion
    ? { duration: 0.1 }
    : { type: "spring" as const, stiffness: 300, damping: 28 };

  const widgetSpring = prefersReducedMotion
    ? { duration: 0.12 }
    : { type: "spring" as const, stiffness: 410, damping: 32, mass: 0.78 };

  const isCallWidgetOpen = activeWidget === "call";
  const isWhatsAppWidgetOpen = activeWidget === "whatsapp";

  return (
    <>
      <motion.nav
        aria-label="Mobile Schnellnavigation & Direktkontakt"
        data-testid="mobile-bottom-dock"
        initial={prefersReducedMotion ? false : { y: 24, opacity: 0 }}
        animate={
          shouldHideDock ? { y: 96, opacity: 0 } : { y: 0, opacity: 1 }
        }
        transition={
          prefersReducedMotion
            ? { duration: 0.1 }
            : { type: "spring", stiffness: 360, damping: 32, mass: 0.78 }
        }
        aria-hidden={shouldHideDock}
        className={`fixed inset-x-0 bottom-0 ${
          activeWidget ? "z-50" : "z-40"
        } lg:hidden pointer-events-none px-2 min-[375px]:px-2.5 sm:px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]`}
      >
        {/* Calm, Always-Labeled Glassmorphic Touch Dock */}
        <div
          className={`${
            shouldHideDock ? "pointer-events-none" : "pointer-events-auto"
          } relative mx-auto grid w-full max-w-xl md:max-w-2xl grid-cols-5 items-stretch gap-1 sm:gap-1.5 rounded-2xl border ring-1 ring-inset ring-white/10 p-1 sm:p-1.5 text-white backdrop-blur-xl transition-shadow duration-200 ${
            isScrolled || activeWidget
              ? "border-white/18 bg-primary-dark/96 dark:bg-slate-900/96 shadow-[0_18px_44px_rgba(2,6,23,0.72),inset_0_1px_0_rgba(255,255,255,0.12)]"
              : "border-white/12 bg-primary-dark/94 dark:bg-slate-900/94 shadow-[0_14px_34px_rgba(2,6,23,0.58),inset_0_1px_0_rgba(255,255,255,0.10)]"
          }`}
        >
          {/* 1. Start */}
          <Link
            href="/"
            onClick={handleNavTap}
            aria-current={isHomeActive ? "page" : undefined}
            data-testid="mobile-dock-home"
            className={`relative flex min-w-0 min-h-[48px] flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 rounded-xl px-1 sm:px-2.5 py-1.5 transition-colors active:scale-[0.96] ${
              isHomeActive ? "text-white" : "text-white/65 hover:text-white"
            }`}
          >
            {isHomeActive && (
              <motion.span
                layoutId="mobile-dock-active-pill"
                transition={tabSpring}
                className="absolute inset-0 rounded-xl bg-sky-500/18 ring-1 ring-sky-400/35"
                aria-hidden="true"
              >
                <span className="absolute top-0.5 left-1/2 -translate-x-1/2 h-[2px] w-6 rounded-full bg-gradient-to-r from-[#64B5EC] to-[#E86A7D] sm:hidden" />
              </motion.span>
            )}
            <motion.span
              animate={
                prefersReducedMotion
                  ? undefined
                  : { scale: isHomeActive ? 1.1 : 1, y: isHomeActive ? -1 : 0 }
              }
              transition={tabSpring}
              className="relative z-10 inline-flex shrink-0"
            >
              <Home
                size={18}
                strokeWidth={isHomeActive ? 2.25 : 1.85}
                className={isHomeActive ? "text-sky-300" : ""}
                aria-hidden="true"
              />
            </motion.span>
            <span
              data-compact-label="true"
              className={`relative z-10 text-[10.5px] sm:text-xs tracking-tight leading-none truncate ${
                isHomeActive ? "font-bold text-white" : "font-medium"
              }`}
            >
              Start
            </span>
          </Link>

          {/* 2. Service */}
          <Link
            href="/leistungen"
            onClick={handleNavTap}
            aria-current={isServiceActive ? "page" : undefined}
            data-testid="mobile-dock-service"
            className={`relative flex min-w-0 min-h-[48px] flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 rounded-xl px-1 sm:px-2.5 py-1.5 transition-colors active:scale-[0.94] ${
              isServiceActive ? "text-white" : "text-white/65 hover:text-white"
            }`}
          >
            {isServiceActive && (
              <motion.span
                layoutId="mobile-dock-active-pill"
                transition={tabSpring}
                className="absolute inset-0 rounded-xl bg-sky-500/18 ring-1 ring-sky-400/35"
                aria-hidden="true"
              >
                <span className="absolute top-0.5 left-1/2 -translate-x-1/2 h-[2px] w-6 rounded-full bg-gradient-to-r from-[#64B5EC] to-[#E86A7D] sm:hidden" />
              </motion.span>
            )}
            <motion.span
              animate={
                prefersReducedMotion
                  ? undefined
                  : { scale: isServiceActive ? 1.1 : 1, y: isServiceActive ? -1 : 0 }
              }
              transition={tabSpring}
              className="relative z-10 inline-flex shrink-0"
            >
              <PackageSearch
                size={18}
                strokeWidth={isServiceActive ? 2.25 : 1.85}
                className={isServiceActive ? "text-sky-300" : ""}
                aria-hidden="true"
              />
            </motion.span>
            <span
              data-compact-label="true"
              className={`relative z-10 text-[10.5px] sm:text-xs tracking-tight leading-none truncate ${
                isServiceActive ? "font-bold text-white" : "font-medium"
              }`}
            >
              Geräte
            </span>
          </Link>

          {/* 3. Direct Call CTA -> Opens Pre-Redirect Widget */}
          <a
            href={effectivePhoneHref}
            onClick={(e) => handleTogglePreRedirectWidget(e, "call")}
            aria-expanded={isCallWidgetOpen}
            aria-controls="mobile-dock-preredirect-widget"
            aria-haspopup="dialog"
            aria-label={`Anruf-Widget öffnen: ${effectivePhoneDisplay}`}
            data-testid="mobile-dock-call"
            className={`relative flex min-w-0 min-h-[48px] flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 rounded-xl px-1 sm:px-2.5 py-1.5 text-white active:scale-[0.96] transition-all ${
              isCallWidgetOpen
                ? "bg-emerald-500/32 ring-1 ring-emerald-300/70 shadow-[0_0_18px_rgba(16,185,129,0.28)]"
                : "bg-emerald-500/14 ring-1 ring-emerald-400/25 hover:bg-emerald-500/24"
            }`}
          >
            <span className="relative flex items-center justify-center">
              <Phone
                size={18}
                strokeWidth={2.1}
                className="text-emerald-300 shrink-0"
                aria-hidden="true"
              />
            </span>
            <span
              data-compact-label="true"
              className="text-[10.5px] sm:text-xs font-bold tracking-tight leading-none text-emerald-100 truncate"
            >
              Anrufen
            </span>
          </a>

          {/* 4. Direct WhatsApp CTA -> Opens Instant 1-Tap Quick-Send Widget */}
          <a
            href={effectiveWhatsappHref}
            onClick={(e) => handleTogglePreRedirectWidget(e, "whatsapp")}
            aria-expanded={isWhatsAppWidgetOpen}
            aria-controls="mobile-dock-preredirect-widget"
            aria-haspopup="dialog"
            aria-label="WhatsApp-Schnellauswahl öffnen"
            data-testid="mobile-dock-whatsapp"
            className={`relative flex min-w-0 min-h-[48px] flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 rounded-xl px-1 sm:px-2.5 py-1.5 text-white active:scale-[0.96] transition-all ${
              isWhatsAppWidgetOpen
                ? "bg-[#25D366]/34 ring-1 ring-[#4ADE80]/80 shadow-[0_0_18px_rgba(37,211,102,0.3)]"
                : draftWhatsAppResult
                ? "bg-[#25D366]/24 ring-1 ring-[#4ADE80]/55 hover:bg-[#25D366]/32"
                : "bg-[#25D366]/14 ring-1 ring-[#4ADE80]/25 hover:bg-[#25D366]/24"
            }`}
          >
            <span className="relative flex items-center justify-center">
              <MessageCircle
                size={18}
                strokeWidth={2.1}
                className="text-[#4ADE80] shrink-0"
                aria-hidden="true"
              />
              {draftWhatsAppResult && (
                <span
                  aria-hidden="true"
                  className="absolute -top-0.5 -right-1 h-1.5 w-1.5 rounded-full bg-[#4ADE80]"
                />
              )}
            </span>
            <span
              data-compact-label="true"
              className="text-[10.5px] sm:text-xs font-bold tracking-tight leading-none text-emerald-50 truncate"
            >
              {draftWhatsAppResult ? "Senden" : "WhatsApp"}
            </span>
          </a>

          {/* 5. Kontakt */}
          <Link
            href="/kontakt"
            onClick={handleNavTap}
            aria-current={isContactActive ? "page" : undefined}
            data-testid="mobile-dock-kontakt"
            className={`relative flex min-w-0 min-h-[48px] flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 rounded-xl px-1 sm:px-2.5 py-1.5 transition-colors active:scale-[0.96] ${
              isContactActive ? "text-white" : "text-white/65 hover:text-white"
            }`}
          >
            {isContactActive && (
              <motion.span
                layoutId="mobile-dock-active-pill"
                transition={tabSpring}
                className="absolute inset-0 rounded-xl bg-sky-500/18 ring-1 ring-sky-400/35"
                aria-hidden="true"
              >
                <span className="absolute top-0.5 left-1/2 -translate-x-1/2 h-[2px] w-6 rounded-full bg-gradient-to-r from-[#64B5EC] to-[#E86A7D] sm:hidden" />
              </motion.span>
            )}
            <motion.span
              animate={
                prefersReducedMotion
                  ? undefined
                  : { scale: isContactActive ? 1.1 : 1, y: isContactActive ? -1 : 0 }
              }
              transition={tabSpring}
              className="relative z-10 flex items-center justify-center"
            >
              <MapPin
                size={18}
                strokeWidth={isContactActive ? 2.25 : 1.85}
                className={isContactActive ? "text-sky-300" : ""}
                aria-hidden="true"
              />
              {savedDraft && !isContactActive && (
                <span
                  aria-hidden="true"
                  title="Gespeicherte Anfrage fortsetzen"
                  className="absolute -top-0.5 -right-1 h-1.5 w-1.5 rounded-full bg-sky-400"
                />
              )}
            </motion.span>
            <span
              data-compact-label="true"
              className={`relative z-10 text-[10.5px] sm:text-xs tracking-tight leading-none truncate ${
                isContactActive ? "font-bold text-white" : "font-medium"
              }`}
            >
              Kontakt
            </span>
          </Link>
        </div>
      </motion.nav>

      {/* Compact Pre-Redirect Widget (Instant 1-Tap Actions, Zero Big Form) */}
      <AnimatePresence>
        {activeWidget && !shouldHideDock && (
          <>
            <motion.div
              key="mobile-dock-preredirect-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => {
                hapticDismiss();
                setActiveWidget(null);
              }}
              aria-hidden="true"
              className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[2px] lg:hidden"
            />

            <motion.div
              key={`mobile-dock-widget-${activeWidget}`}
              id="mobile-dock-preredirect-widget"
              data-testid="mobile-dock-preredirect-widget"
              role="dialog"
              aria-modal="false"
              aria-label={
                activeWidget === "call"
                  ? "Anruf vor Weiterleitung bestätigen"
                  : "WhatsApp-Direktnachricht auswählen"
              }
              initial={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 16, scale: 0.96 }
              }
              animate={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : { opacity: 1, y: 0, scale: 1 }
              }
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 12, scale: 0.97 }
              }
              transition={widgetSpring}
              className="fixed inset-x-0 bottom-[calc(4.65rem+env(safe-area-inset-bottom))] z-50 px-2.5 sm:px-4 lg:hidden pointer-events-none"
            >
              <div className="pointer-events-auto mx-auto w-full max-w-md sm:max-w-lg overflow-hidden rounded-3xl border border-primary/12 dark:border-white/15 bg-white/98 dark:bg-slate-900/98 text-primary dark:text-slate-100 shadow-[0_22px_55px_rgba(2,6,23,0.45)] backdrop-blur-xl">
                {/* Native Sheet Grab Handle */}
                <div aria-hidden="true" className="flex justify-center pt-2.5 pb-0.5">
                  <span className="h-1 w-9 rounded-full bg-primary/15 dark:bg-white/20" />
                </div>
                {activeWidget === "call" ? (
                  <div className="p-4 space-y-3">
                    {/* Call Widget Header */}
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                          <Phone size={17} aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                            Direkt anrufen
                          </p>
                          <h3 className="text-sm font-extrabold text-primary dark:text-white truncate">
                            {business.owner} · {business.city}
                          </h3>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          hapticDismiss();
                          setActiveWidget(null);
                        }}
                        aria-label="Anruf-Widget schließen"
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-primary/10 dark:border-white/10 text-ink-muted hover:text-primary dark:hover:text-white transition-colors cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Number + Copy */}
                    <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-500/20 bg-emerald-50/70 dark:bg-emerald-950/35 px-3 py-2">
                      <p className="text-base font-extrabold tracking-tight text-primary dark:text-white tabular-nums">
                        {effectivePhoneDisplay}
                      </p>
                      <button
                        type="button"
                        onClick={() => void handleCopyPhoneNumber()}
                        className="inline-flex min-h-[34px] shrink-0 items-center gap-1.5 rounded-lg border border-primary/12 dark:border-white/15 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-bold text-primary dark:text-slate-100 hover:border-emerald-500 transition-colors cursor-pointer"
                      >
                        {copiedPhone ? (
                          <>
                            <Check size={13} className="text-emerald-600 dark:text-emerald-400" />
                            <span>Kopiert</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} />
                            <span>Kopieren</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={12} className="text-accent shrink-0" aria-hidden="true" />
                        <span>{business.hours}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <ShieldCheck size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                        <span>Direkt mit {business.owner}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      <a
                        href={effectivePhoneHref}
                        onClick={() => scheduleWidgetCloseAfterRedirect("Telefon wird geöffnet…")}
                        data-testid="mobile-dock-call-confirm"
                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs sm:text-sm font-extrabold text-white shadow-sm transition-colors"
                      >
                        <Phone size={15} aria-hidden="true" />
                        <span>{redirectingLabel || "Jetzt anrufen"}</span>
                        <ArrowUpRight size={14} aria-hidden="true" />
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          hapticTap();
                          setActiveWidget(null);
                          openQuickRequest("Waschmaschine", "Rückrufbitte", "", "question");
                        }}
                        className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-primary/14 dark:border-white/14 bg-surface dark:bg-slate-800 px-3 py-2 text-xs font-bold text-primary dark:text-slate-100 hover:border-accent transition-colors cursor-pointer"
                      >
                        <FileText size={14} aria-hidden="true" />
                        <span>Formular</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 space-y-2.5">
                    {/* Compact WhatsApp Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/18 text-[#16a34a] dark:text-[#4ADE80] border border-[#25D366]/30">
                          <MessageCircle size={18} aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-extrabold text-primary dark:text-white leading-tight truncate">
                            WhatsApp · {business.owner}
                          </h3>
                          <p className="mt-0.5 text-[11px] text-ink-muted truncate">
                            1× tippen, Chat öffnet sofort
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          hapticDismiss();
                          setActiveWidget(null);
                        }}
                        aria-label="WhatsApp-Widget schließen"
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-primary/10 dark:border-white/10 text-ink-muted hover:text-primary dark:hover:text-white transition-colors cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Optional 1-Tap Saved Draft Link */}
                    {draftWhatsAppPayload && (
                      <a
                        href={draftWhatsAppPayload.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => scheduleWidgetCloseAfterRedirect("WhatsApp wird geöffnet…")}
                        className="btn-shimmer-beam flex items-center justify-between gap-2.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] px-3 py-2.5 text-white shadow-xs transition-colors"
                      >
                        <span className="inline-flex items-center gap-2 text-xs font-extrabold min-w-0">
                          <Sparkles size={14} className="shrink-0" aria-hidden="true" />
                          <span className="truncate">Gespeicherte Anfrage direkt senden</span>
                        </span>
                        <ArrowUpRight size={15} className="shrink-0" aria-hidden="true" />
                      </a>
                    )}

                    {/* 1-Tap Direct Quick-Demand Links (Zero Form Required!) */}
                    <div className="space-y-1.5">
                      {ONE_TAP_WHATSAPP_DEMANDS.map((item, idx) => {
                        const Icon = item.icon;
                        const href = buildWhatsAppDirectUrl(
                          item.message,
                          HANNACHI_WHATSAPP_PHONE
                        );
                        return (
                          <motion.a
                            key={item.id}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={
                              prefersReducedMotion
                                ? { duration: 0.08 }
                                : {
                                    delay: idx * 0.035,
                                    duration: 0.24,
                                    ease: [0.22, 1, 0.36, 1],
                                  }
                            }
                            whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                            onClick={() =>
                              scheduleWidgetCloseAfterRedirect("WhatsApp wird geöffnet…")
                            }
                            data-testid={`mobile-dock-wa-${item.id}`}
                            className="group flex items-center justify-between gap-2.5 rounded-xl border border-primary/10 dark:border-white/10 bg-surface/85 dark:bg-slate-800/75 hover:border-[#16a34a]/50 hover:bg-[#25D366]/10 px-3 py-2.5 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#25D366]/14 text-[#16a34a] dark:text-[#4ADE80] group-hover:bg-[#16a34a] group-hover:text-white transition-colors">
                                <Icon size={15} aria-hidden="true" />
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-extrabold text-primary dark:text-white leading-tight truncate">
                                  {item.title}
                                </p>
                                <p className="text-[11px] text-ink-muted leading-tight truncate">
                                  {item.subtitle}
                                </p>
                              </div>
                            </div>
                            <ArrowUpRight
                              size={15}
                              className="shrink-0 text-emerald-600 dark:text-[#4ADE80] opacity-75 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
                              aria-hidden="true"
                            />
                          </motion.a>
                        );
                      })}
                    </div>

                    {/* Ultra-Simple 1-Line Instant Chat Input */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <label htmlFor="mobile-dock-wa-quick" className="sr-only">
                        Kurze Nachricht für WhatsApp schreiben
                      </label>
                      <input
                        id="mobile-dock-wa-quick"
                        type="text"
                        value={customWaText}
                        onChange={(e) => setCustomWaText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            customSendLinkRef.current?.click();
                          }
                        }}
                        placeholder="Oder kurz schreiben (z. B. Miele Pumpe)…"
                        className="flex-1 min-w-0 min-h-[42px] rounded-xl border border-primary/14 dark:border-white/14 bg-surface dark:bg-slate-800 px-3 py-2 text-xs text-primary dark:text-slate-100 placeholder:text-ink-faint focus:border-[#16a34a] focus:outline-none"
                      />
                      <a
                        ref={customSendLinkRef}
                        href={customWhatsAppHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          scheduleWidgetCloseAfterRedirect("WhatsApp wird geöffnet…")
                        }
                        data-testid="mobile-dock-whatsapp-confirm"
                        aria-label="Nachricht direkt in WhatsApp öffnen"
                        className="btn-shimmer-beam inline-flex h-[42px] shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] active:scale-[0.97] px-3.5 text-xs font-extrabold text-white shadow-sm transition-all"
                      >
                        <Send size={14} aria-hidden="true" />
                        <span>{redirectingLabel ? "Öffnet…" : "Chat"}</span>
                      </a>
                    </div>

                    <p className="text-[10.5px] leading-snug text-ink-faint text-center">
                      Freiwillige Weiterleitung zu WhatsApp (Meta).{" "}
                      <Link
                        href="/datenschutz#whatsapp"
                        onClick={() => setActiveWidget(null)}
                        className="font-semibold text-accent underline underline-offset-2"
                      >
                        Datenschutz
                      </Link>
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
