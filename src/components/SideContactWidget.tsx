"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  Phone,
  MessageCircle,
  MapPin,
  Wrench,
  Clock,
  Copy,
  Check,
  X,
  ArrowRight,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import { business, type ServiceNotice } from "@/data/site";
import { herrHannachiImage } from "@/data/images";
import { useQuickRequest } from "@/components/QuickRequestSheet";
import { triggerHapticFeedback } from "@/lib/haptics";
import {
  clearRepairDraft,
  loadRepairDraft,
  REPAIR_DRAFT_EVENT,
  type RepairDraft,
} from "@/lib/repairRequest";

const PROMPT_DISMISSED_STORAGE_KEY = "hannachi-contact-prompt-dismissed";
const PROMPT_DELAY_MS = 1200;

const promptContainerVariants: Variants = {
  hidden: { opacity: 0, x: 24, scale: 0.94 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 360,
      damping: 24,
      mass: 0.8,
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
  exit: {
    opacity: 0,
    x: 18,
    scale: 0.95,
    transition: { duration: 0.16, ease: "easeIn" },
  },
};

const promptItemVariants: Variants = {
  hidden: { opacity: 0, x: 12, scale: 0.96 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 380,
      damping: 26,
    },
  },
};

export interface SideContactWidgetProps {
  phone?: string;
  phoneHref?: string;
  whatsappHref?: string;
  mapsUrl?: string;
  address?: string;
  hours?: string;
  serviceNotice?: ServiceNotice;
}

export default function SideContactWidget({
  phone = business.phoneDisplay,
  phoneHref = business.phoneHref,
  whatsappHref = business.whatsappHref,
  mapsUrl = business.mapsUrl,
  address = `${business.street}, ${business.zip} ${business.city}`,
  hours = business.hours,
  serviceNotice = business.serviceNotice,
}: SideContactWidgetProps) {
  const { isOpen: isQuickRequestOpen, openQuickRequest } = useQuickRequest();
  const containerRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedDraft, setSavedDraft] = useState<RepairDraft | null>(() => loadRepairDraft());
  const [isPromptDismissed, setIsPromptDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.sessionStorage.getItem(PROMPT_DISMISSED_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [isPromptVisible, setIsPromptVisible] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  }, [isQuickRequestOpen, open]);

  const isServiceNoticeActive = Boolean(
    serviceNotice?.active && serviceNotice.message.trim().length > 0
  );

  const persistPromptDismissed = () => {
    setIsPromptDismissed(true);
    setIsPromptVisible(false);
    try {
      window.sessionStorage.setItem(PROMPT_DISMISSED_STORAGE_KEY, "true");
    } catch {
      // Ignore storage access errors in restricted frames
    }
  };

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isPromptDismissed || open) {
      setIsPromptVisible(false);
      return undefined;
    }

    const timer = setTimeout(() => {
      setIsPromptVisible(true);
    }, PROMPT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isPromptDismissed, open]);

  useEffect(() => {
    const onToggleEvent = () => {
      setOpen((prev) => !prev);
    };
    const onCloseEvent = () => {
      setOpen(false);
    };
    window.addEventListener("hannachi-toggle-contact-widget", onToggleEvent);
    window.addEventListener("hannachi-close-contact-widget", onCloseEvent);
    return () => {
      window.removeEventListener("hannachi-toggle-contact-widget", onToggleEvent);
      window.removeEventListener("hannachi-close-contact-widget", onCloseEvent);
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("hannachi-contact-widget-state", { detail: { open } })
    );
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest('[data-contact-widget-trigger="true"]')
      ) {
        return;
      }
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  const handleCopyPhone = async () => {
    triggerHapticFeedback(50);
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(phone);
      }
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleToggleOpen = () => {
    triggerHapticFeedback(50);
    setOpen((prev) => !prev);
  };

  const isQuestionDraft = savedDraft?.values.inquiryMode === "question";
  const draftStepLabel = isQuestionDraft
    ? "Direkte Frage"
    : "Anfrage-Entwurf";
  const draftShortBadge = isQuestionDraft
    ? "Frage"
    : savedDraft
    ? "Entwurf"
    : "";
  const draftDeviceSummary = savedDraft
    ? [
        savedDraft.values.customDevice || savedDraft.values.device,
        savedDraft.values.brand,
        savedDraft.values.zip,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  const handleResumeDraft = () => {
    if (!savedDraft) return;
    triggerHapticFeedback(50);
    setOpen(false);
    openQuickRequest(
      savedDraft.values.device || "Waschmaschine",
      "",
      "",
      savedDraft.values.inquiryMode === "question" ? "question" : "repair"
    );
  };

  const handleDiscardDraft = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    triggerHapticFeedback(50);
    clearRepairDraft();
    setSavedDraft(null);
  };

  const handlePromptClick = () => {
    if (savedDraft) {
      handleResumeDraft();
      return;
    }
    triggerHapticFeedback(50);
    setOpen(true);
  };

  const handlePromptDismiss = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    triggerHapticFeedback(50);
    persistPromptDismissed();
  };

  return (
    <>
      {/* Mobile Backdrop when Contact Panel is opened from the Top-Right Circular Button */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="side-contact-mobile-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 top-12 z-40 bg-black/45 backdrop-blur-[1px] lg:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <aside
        ref={containerRef}
        aria-label="Direktkontakt Hannachi"
        className="fixed bottom-[max(0.875rem,env(safe-area-inset-bottom))] right-3.5 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end pointer-events-none"
      >
        {/* Expanded Contact Card (Opens above bottom-right Contact button on Phone & Laptop) */}
        <AnimatePresence>
          {open && (
            <motion.div
              id="side-contact-panel"
              role="dialog"
              aria-label="Kontakt zu Hannachi"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto origin-bottom-right relative mb-3 w-[min(calc(100vw-1.5rem),21.5rem)] sm:w-[22.5rem] max-h-[calc(100dvh-6.5rem)] sm:max-h-[calc(100dvh-7rem)] overflow-y-auto overflow-x-hidden overscroll-contain rounded-2xl border border-white/15 bg-primary-dark/98 dark:bg-slate-900/98 p-4 sm:p-5 text-white shadow-[0_24px_60px_rgba(2,6,23,0.65)] backdrop-blur-2xl"
            >
              {/* Subtle matching sky-blue glass sheen inside card */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-sky-500/20 blur-2xl"
              />

              {/* Header with Hannachi portrait */}
              <div className="relative flex items-center justify-between gap-3 border-b border-white/10 pb-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-sky-300/40 bg-slate-800">
                    <Image
                      src={herrHannachiImage}
                      alt={business.owner}
                      fill
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
                      placeholder="blur"
                      blurDataURL={herrHannachiImage.blurDataURL}
                      sizes="44px"
                      className="object-cover object-top"
                    />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-extrabold tracking-tight text-white truncate">
                      {business.owner}
                    </h2>
                    <p className="mt-0.5 text-xs text-sky-200/80 truncate">
                      Mobiler Vor-Ort-Service · {business.city}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback(50);
                    setOpen(false);
                  }}
                  aria-label="Kontaktmenü schließen"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/75 hover:bg-white/10 hover:text-white active:scale-95 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-light"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              {/* Optional Active Service Notice */}
              {isServiceNoticeActive && serviceNotice && (
                <div
                  role="status"
                  aria-live="polite"
                  className="mt-3.5 border-b border-white/10 pb-3 text-xs text-amber-200 leading-relaxed flex items-start gap-2"
                >
                  <Clock size={14} className="mt-0.5 shrink-0 text-amber-300" aria-hidden="true" />
                  <div className="min-w-0">
                    <span className="font-bold text-amber-300 mr-1.5">
                      {serviceNotice.label || "Hinweis"}:
                    </span>
                    <span className="text-white/90">{serviceNotice.message}</span>
                  </div>
                </div>
              )}

              {/* Resume Paused Inquiry Banner (when user exited mid-form) */}
              {savedDraft && (
                <div className="relative mt-3.5 rounded-xl border border-emerald-400/40 bg-emerald-500/15 p-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResumeDraft}
                      data-testid="contact-widget-resume-draft-btn"
                      className="flex min-h-[46px] flex-1 min-w-0 items-center justify-between gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-left text-xs font-bold text-white shadow-sm hover:bg-emerald-500 active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 text-xs font-extrabold leading-tight">
                          <RotateCcw size={13} className="shrink-0" aria-hidden="true" />
                          <span className="truncate">Fortsetzen ({draftStepLabel})</span>
                        </span>
                        {draftDeviceSummary && (
                          <span className="mt-0.5 block truncate text-[11px] font-medium text-emerald-100">
                            {draftDeviceSummary}
                          </span>
                        )}
                      </span>
                      <ArrowRight size={14} className="shrink-0" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={handleDiscardDraft}
                      aria-label="Gespeicherten Entwurf verwerfen"
                      title="Entwurf verwerfen"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white/75 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
                    >
                      <X size={15} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}

              {/* 3 Distinct Contact Actions (Zero Duplicates, All >= 48px touch targets) */}
              <div className="relative mt-3.5 space-y-2">
                {/* 1. Online Form Inquiry (Vor-Ort-Check, Ersatzteil, Ersatzgerät) */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback(50);
                    setOpen(false);
                    openQuickRequest("Waschmaschine", "", "", "repair");
                  }}
                  className="flex min-h-[48px] w-full items-center justify-between gap-2.5 rounded-xl bg-sky-600 px-3.5 py-3 text-xs font-bold text-white shadow-md hover:bg-sky-500 active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Wrench size={16} className="shrink-0 text-sky-200" aria-hidden="true" />
                    <span className="truncate leading-tight text-left">
                      {savedDraft
                        ? "Anfrage im Formular fortsetzen"
                        : "Vor-Ort-Termin & Ersatzteil anfragen"}
                    </span>
                  </span>
                  <ArrowRight size={15} className="shrink-0 text-sky-200" aria-hidden="true" />
                </button>

                {/* 2. Direct WhatsApp Chat Link */}
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    triggerHapticFeedback(50);
                    setOpen(false);
                  }}
                  className="flex min-h-[48px] w-full items-center justify-between gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-600/20 px-3.5 py-3 text-xs font-bold text-emerald-200 hover:bg-emerald-600 hover:text-white active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <MessageCircle size={16} className="shrink-0 text-emerald-400" aria-hidden="true" />
                    <span className="truncate leading-tight text-left">
                      Direkt per WhatsApp schreiben
                    </span>
                  </span>
                  <ExternalLink size={14} className="shrink-0 opacity-80" aria-hidden="true" />
                </a>

                {/* 3. Direct Phone Call + Copy */}
                <div className="flex items-center gap-2 pt-0.5">
                  <a
                    href={phoneHref}
                    onClick={() => triggerHapticFeedback(50)}
                    className="flex min-h-[48px] flex-1 min-w-0 items-center justify-between gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-white hover:bg-white/10 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                  >
                    <span className="flex items-center gap-2 min-w-0 tabular-nums">
                      <Phone size={15} className="text-sky-300 shrink-0" aria-hidden="true" />
                      <span className="truncate">{phone}</span>
                    </span>
                    <span className="hidden min-[360px]:inline text-[11px] font-semibold text-white/60 shrink-0">
                      Anrufen
                    </span>
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyPhone}
                    aria-label="Telefonnummer kopieren"
                    title="Telefonnummer kopieren"
                    className="flex min-h-[48px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 text-[11px] font-semibold text-white/85 hover:bg-white/15 hover:text-white active:scale-95 transition-all cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check size={13} className="text-emerald-400 shrink-0" aria-hidden="true" />
                        <span>Kopiert</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} className="shrink-0" aria-hidden="true" />
                        <span>Kopieren</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 4. Mobile Service Area Info */}
                <div className="flex min-h-[44px] items-center justify-between gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-xs">
                  <Link
                    href="/kontakt"
                    onClick={() => {
                      triggerHapticFeedback(50);
                      setOpen(false);
                    }}
                    className="flex min-h-[40px] items-center gap-2 min-w-0 text-white/90 hover:text-white py-1"
                  >
                    <MapPin size={15} className="text-sky-300 shrink-0" aria-hidden="true" />
                    <span className="truncate font-medium">
                      Osnabrück &amp; Umgebung · Vor-Ort-Service
                    </span>
                  </Link>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => triggerHapticFeedback(50)}
                    aria-label={`Standort ${address} auf Google Maps`}
                    className="inline-flex min-h-[40px] shrink-0 items-center gap-1 px-2 text-[11px] font-semibold text-sky-300 hover:underline"
                  >
                    <span>Maps</span>
                    <ExternalLink size={11} aria-hidden="true" />
                  </a>
                </div>
              </div>

              {/* Clean Footer Row (Opening Hours Only — No Duplicate Links) */}
              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between gap-2 text-[11px] text-white/65">
                <span className="inline-flex items-center gap-1.5 min-w-0 truncate">
                  <Clock size={12} className="text-sky-300 shrink-0" aria-hidden="true" />
                  <span className="truncate">{hours}</span>
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom-Right Trigger Row: Compact Prompt Pill + Circular Contact Button (Visible on Both Phone & Laptop) */}
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
          <AnimatePresence>
            {isPromptVisible && !open && !isPromptDismissed && (
              <motion.div
                key="contact-prompt-bubble"
                variants={promptContainerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="group/card relative flex items-center gap-1.5 sm:gap-2 max-w-[calc(100vw-5.5rem)] sm:max-w-[330px] rounded-full sm:rounded-2xl border border-white/15 bg-slate-900/95 pl-2 sm:pl-3 pr-1.5 sm:pr-2 py-1.5 sm:py-2 text-white shadow-[0_20px_48px_rgba(2,6,23,0.6),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl transition-colors hover:border-sky-400/45"
              >
                <button
                  type="button"
                  onClick={handlePromptClick}
                  className="group flex min-h-[44px] flex-1 items-center gap-2 sm:gap-2.5 min-w-0 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 rounded-full sm:rounded-xl pl-0.5 pr-1"
                >
                  <motion.div
                    variants={promptItemVariants}
                    className="relative shrink-0"
                  >
                    <div className="relative h-9 w-9 sm:h-10 sm:w-10 overflow-hidden rounded-full border border-sky-300/50 bg-slate-800 shadow-xs">
                      <Image
                        src={herrHannachiImage}
                        alt="Kamal Hannachi"
                        fill
                        loading="lazy"
                        decoding="async"
                        fetchPriority="low"
                        placeholder="blur"
                        blurDataURL={herrHannachiImage.blurDataURL}
                        sizes="40px"
                        className="object-cover object-top"
                      />
                    </div>
                    <span
                      aria-hidden="true"
                      className=" absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center"
                    >
                      <span className="animate-live-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-slate-900 bg-emerald-400" />
                    </span>
                  </motion.div>

                  <div className="min-w-0 flex-1">
                    <motion.p
                      variants={promptItemVariants}
                      className="text-[10px] sm:text-[11px] font-medium text-slate-300 truncate leading-tight"
                    >
                      {savedDraft ? `Pausiert · ${draftStepLabel}` : "Vor-Ort-Service · Osnabrück"}
                    </motion.p>
                    <motion.div
                      variants={promptItemVariants}
                      className="mt-0.5 flex items-center gap-1 text-xs sm:text-[13px] font-extrabold text-white group-hover:text-sky-300 transition-colors max-w-full"
                    >
                      <span className="truncate">
                        {savedDraft ? "Anfrage fortsetzen" : "Direktkontakt & WhatsApp"}
                      </span>
                      <ArrowRight
                        size={12}
                        className="shrink-0 text-sky-400 transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </motion.div>
                  </div>
                </button>

                <motion.button
                  variants={promptItemVariants}
                  type="button"
                  onClick={handlePromptDismiss}
                  aria-label="Hinweis ausblenden"
                  title="Hinweis ausblenden"
                  className="flex h-9 w-9 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full sm:rounded-xl border border-white/10 bg-white/[0.05] text-white/65 hover:bg-white/15 hover:text-white active:scale-95 transition-colors cursor-pointer"
                >
                  <X size={13} aria-hidden="true" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Single Circular Contact Button with Full Visual Effects (56px on Mobile, 62px on Desktop) */}
          <div className="contact-widget-trigger-wrap relative flex items-center justify-center shrink-0">
            {!open && (
              <>
                {/* Dynamic drifting frosted sky-blue aura */}
                <span
                  aria-hidden="true"
                  className="contact-frosted-aura pointer-events-none absolute -inset-3.5 sm:-inset-4 rounded-full blur-xl"
                />
                {/* Soft inner ambient glow */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-2 rounded-full bg-sky-400/30 blur-md"
                />
                {/* Dual expanding breathing rings */}
                <span
                  aria-hidden="true"
                  className="contact-breathing-ring-1 pointer-events-none absolute -inset-1.5 rounded-full border-2 border-sky-400/65 shadow-[0_0_18px_rgba(56,189,248,0.5)]"
                />
                <span
                  aria-hidden="true"
                  className="contact-breathing-ring-2 pointer-events-none absolute -inset-2.5 rounded-full border border-sky-300/45"
                />
              </>
            )}

            <div className={!open ? "contact-button-floating relative" : "relative"}>
              <motion.button
                type="button"
                data-contact-widget-trigger="true"
                onClick={handleToggleOpen}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                aria-expanded={open}
                aria-controls="side-contact-panel"
                aria-label={open ? "Kontaktmenü schließen" : "Kontakt – Hannachi erreichen"}
                title={open ? "Kontaktmenü schließen" : "Kontakt – Hannachi erreichen"}
                className={`relative flex h-14 w-14 sm:h-[62px] sm:w-[62px] flex-col items-center justify-center overflow-hidden rounded-full border border-white/30 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300 ${
                  open
                    ? "bg-slate-900 text-white hover:bg-slate-800 shadow-[0_14px_34px_rgba(2,6,23,0.55)]"
                    : "bg-gradient-to-br from-sky-400 via-sky-500 to-blue-700 text-white hover:from-sky-400 hover:to-sky-600 shadow-[0_14px_36px_rgba(14,165,233,0.55),inset_0_1px_1px_rgba(255,255,255,0.45)] hover:shadow-[0_18px_44px_rgba(14,165,233,0.7)]"
                }`}
              >
                {/* Specular diagonal light sweep across the circular button */}
                {!open && (
                  <span
                    aria-hidden="true"
                    className="contact-light-sweep pointer-events-none absolute inset-y-0 -left-1/2 w-3/4 z-0"
                  />
                )}

                {open ? (
                  <>
                    <X size={21} strokeWidth={2.5} aria-hidden="true" className="relative z-10" />
                    <span className="relative z-10 mt-0.5 text-[10px] font-bold uppercase tracking-wider leading-none">
                      Zu
                    </span>
                  </>
                ) : (
                  <>
                    <Phone size={20} strokeWidth={2.4} aria-hidden="true" className="relative z-10 drop-shadow-xs" />
                    <span className="relative z-10 mt-1 text-[10px] font-extrabold uppercase tracking-wider leading-none drop-shadow-xs">
                      Kontakt
                    </span>
                  </>
                )}
              </motion.button>

              {/* Live emerald pulse dot on top-right of the button */}
              {!open && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-0.5 right-0.5 z-20 flex h-3.5 w-3.5 items-center justify-center"
                >
                  <span className="animate-live-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-slate-900 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.85)]" />
                </span>
              )}

              {!open && savedDraft && draftShortBadge && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-1.5 -left-1.5 z-20 rounded-full border border-white/90 bg-emerald-500 px-1.5 py-0.5 text-[10px] font-extrabold leading-none text-white shadow-md"
                >
                  {draftShortBadge}
                </span>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
