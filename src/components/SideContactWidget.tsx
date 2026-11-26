"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Phone,
  MessageCircle,
  MapPin,
  PackageSearch,
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
import { buildWhatsAppDirectUrl } from "@/utils/whatsapp";

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
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedDraft, setSavedDraft] = useState<RepairDraft | null>(() => loadRepairDraft());
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

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

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
    let didCopy = false;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(phone);
        didCopy = true;
      }
    } catch {
      didCopy = false;
    }
    if (!didCopy && typeof document !== "undefined") {
      try {
        const ta = document.createElement("textarea");
        ta.value = phone;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        didCopy = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        didCopy = false;
      }
    }
    if (didCopy) {
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
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

  return (
    <aside
      ref={containerRef}
      aria-label="Direktkontakt Hannachi"
      className="fixed bottom-4 right-4 xl:bottom-6 xl:right-6 z-50 hidden lg:flex flex-col items-end pointer-events-none"
    >
        {/* Expanded Contact Card (Opens above bottom-right Contact button on Desktop) */}
        <AnimatePresence>
          {open && (
            <motion.div
              id="side-contact-panel"
              role="dialog"
              aria-label="Kontakt zu Hannachi"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 14 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 10 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0.1 }
                  : {
                      type: "spring",
                      stiffness: 420,
                      damping: 30,
                      mass: 0.72,
                      opacity: { duration: 0.16, ease: [0.16, 1, 0.3, 1] },
                    }
              }
              className="pointer-events-auto origin-bottom-right relative mb-3 w-[min(calc(100vw-2rem),22.5rem)] max-h-[calc(100dvh-6.75rem)] overflow-y-auto overflow-x-hidden overscroll-contain rounded-2xl border border-white/15 bg-primary-dark/98 dark:bg-slate-900/98 p-4 sm:p-5 text-white shadow-[0_24px_60px_rgba(2,6,23,0.7)] backdrop-blur-2xl"
            >
              {/* Soft Sky-Blue Sheen inside Expanded Panel */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full bg-sky-500/20 blur-2xl"
              />

              {/* Header with Hannachi portrait */}
              <div className="relative flex items-center justify-between gap-3 border-b border-white/10 pb-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-sky-400/50 bg-slate-800 shadow-inner">
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
                    <p className="mt-0.5 text-xs text-white/65 truncate">
                      Beratung &amp; Ersatzteile · {business.city}
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
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white active:scale-95 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
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
                <motion.button
                  type="button"
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0.08 }
                      : { delay: 0.03, duration: 0.22, ease: [0.22, 1, 0.36, 1] }
                  }
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                  onClick={() => {
                    triggerHapticFeedback(50);
                    setOpen(false);
                    openQuickRequest("Waschmaschine", "", "", "repair");
                  }}
                  className="btn-shimmer-beam flex min-h-[48px] w-full items-center justify-between gap-2.5 rounded-xl bg-accent px-3.5 py-3 text-xs font-bold text-white shadow-sm hover:bg-accent-dark transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <PackageSearch size={16} className="shrink-0 text-sky-100" aria-hidden="true" />
                    <span className="truncate leading-tight text-left">
                      {savedDraft ? "Entwurf fortsetzen" : "Online anfragen"}
                    </span>
                  </span>
                  <ArrowRight size={15} className="shrink-0 text-sky-100" aria-hidden="true" />
                </motion.button>

                {/* 2. Direct WhatsApp Chat Link + 1-Tap Quick Demands */}
                <motion.div
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0.08 }
                      : { delay: 0.06, duration: 0.22, ease: [0.22, 1, 0.36, 1] }
                  }
                  className="space-y-1.5"
                >
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      triggerHapticFeedback(50);
                      window.setTimeout(() => setOpen(false), 450);
                    }}
                    className="flex min-h-[48px] w-full items-center justify-between gap-2.5 rounded-xl border border-emerald-400/35 bg-emerald-600/20 px-3.5 py-3 text-xs font-bold text-emerald-200 hover:bg-emerald-600 hover:text-white active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <MessageCircle size={16} className="shrink-0 text-emerald-400" aria-hidden="true" />
                      <span className="truncate leading-tight text-left">
                        WhatsApp schreiben
                      </span>
                    </span>
                    <ExternalLink size={14} className="shrink-0 opacity-80" aria-hidden="true" />
                  </a>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      {
                        label: "Ersatzteil",
                        msg: "Hallo Herr Hannachi, ich suche ein Original-Ersatzteil und sende gleich die E-Nr. / ein Foto vom Typenschild.",
                      },
                      {
                        label: "Gerät",
                        msg: "Hallo Herr Hannachi, welche ausgewählten Markengeräte haben Sie aktuell in Osnabrück auf Anfrage?",
                      },
                      {
                        label: "Termin",
                        msg: "Hallo Herr Hannachi, ich möchte gerne einen kurzen Termin nach Vereinbarung in Osnabrück abstimmen.",
                      },
                    ].map((quick) => (
                      <a
                        key={quick.label}
                        href={buildWhatsAppDirectUrl(quick.msg)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          triggerHapticFeedback(35);
                          window.setTimeout(() => setOpen(false), 450);
                        }}
                        className="flex min-h-[32px] items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-[11px] font-bold text-emerald-200 hover:bg-emerald-600 hover:text-white active:scale-[0.97] transition-all"
                      >
                        {quick.label}
                      </a>
                    ))}
                  </div>
                  <p className="px-0.5 text-[10.5px] leading-snug text-white/55">
                    Freiwilliger Chat über WhatsApp (Meta) ·{" "}
                    <Link
                      href="/datenschutz#whatsapp"
                      onClick={() => setOpen(false)}
                      className="text-sky-300 underline underline-offset-2 hover:text-white"
                    >
                      Datenschutz
                    </Link>
                  </p>
                </motion.div>

                {/* 2b. Schedule Appointment in Calendar */}
                <Link
                  href="/kontakt#kalender-termin"
                  onClick={() => {
                    triggerHapticFeedback(50);
                    setOpen(false);
                  }}
                  data-testid="contact-widget-gcal-link"
                  className="flex min-h-[46px] w-full min-w-0 items-center justify-between gap-2.5 rounded-xl border border-sky-400/30 bg-sky-500/15 px-3.5 py-2.5 text-xs font-bold text-sky-100 hover:bg-sky-500/25 hover:text-white active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Clock size={15} className="shrink-0 text-sky-300" aria-hidden="true" />
                    <span className="truncate leading-tight text-left">
                      Termin im Kalender merken
                    </span>
                  </span>
                  <ArrowRight size={14} className="shrink-0 text-sky-300" aria-hidden="true" />
                </Link>

                {/* 3. Direct Phone Call + Copy */}
                <div className="flex items-center gap-2 pt-0.5">
                  <a
                    href={phoneHref}
                    onClick={() => triggerHapticFeedback(50)}
                    className="flex min-h-[48px] flex-1 min-w-0 items-center justify-between gap-2 rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-xs font-bold text-white hover:bg-white/10 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  >
                    <span className="flex items-center gap-2 min-w-0 tabular-nums">
                      <Phone size={15} className="text-sky-400 shrink-0" aria-hidden="true" />
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
                    className="flex min-h-[48px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-white/12 bg-white/5 px-3 text-[11px] font-semibold text-white/80 hover:bg-white/15 hover:text-white active:scale-95 transition-all cursor-pointer"
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
                <div className="flex min-h-[44px] items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs">
                  <Link
                    href="/kontakt"
                    onClick={() => {
                      triggerHapticFeedback(50);
                      setOpen(false);
                    }}
                    className="flex min-h-[40px] items-center gap-2 min-w-0 text-white/80 hover:text-white py-1"
                  >
                    <MapPin size={15} className="text-sky-400 shrink-0" aria-hidden="true" />
                    <span className="truncate font-medium">
                      Osnabrück · Termine nach Vereinbarung
                    </span>
                  </Link>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => triggerHapticFeedback(50)}
                    aria-label={`Standort ${address} auf Google Maps`}
                    className="inline-flex min-h-[40px] shrink-0 items-center gap-1 px-2 text-[11px] font-semibold text-sky-400 hover:underline"
                  >
                    <span>Maps</span>
                    <ExternalLink size={11} aria-hidden="true" />
                  </a>
                </div>
              </div>

              {/* Social Media Section (Facebook) */}
              <div className="mt-2.5 pt-2.5 border-t border-white/10">
                <div className="w-full min-w-0">
                  <a
                    href={business.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => triggerHapticFeedback(50)}
                    data-testid="contact-widget-facebook-link"
                    aria-label="Hannachi Elektrohaushaltsgeräte & Ersatzteile auf Facebook besuchen"
                    className="group flex min-h-[44px] w-full min-w-0 items-center justify-between gap-2.5 rounded-xl border border-[#1877F2]/40 bg-[#1877F2]/15 hover:bg-[#1877F2] px-3 py-2 text-xs font-bold text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#1877F2] text-white group-hover:bg-white group-hover:text-[#1877F2] transition-colors">
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        >
                          <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                        </svg>
                      </span>
                      <span className="min-w-0 flex-1 truncate text-left">
                        Facebook · <span className="font-medium text-sky-200 group-hover:text-white">@{business.facebookHandle}</span>
                      </span>
                    </span>
                    <ExternalLink size={13} className="shrink-0 opacity-80" aria-hidden="true" />
                  </a>
                </div>
              </div>

              {/* Clean Footer Row (Opening Hours) */}
              <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-2 text-[11px] text-white/60">
                <span className="inline-flex items-center gap-1.5 min-w-0 truncate">
                  <Clock size={12} className="text-sky-400 shrink-0" aria-hidden="true" />
                  <span className="truncate">{hours}</span>
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom-Right Calm Contact Launcher (Desktop) */}
        <div className="flex items-center pointer-events-auto">
          <div className="relative flex items-center justify-center shrink-0">
            <motion.button
              type="button"
              data-contact-widget-trigger="true"
              onClick={handleToggleOpen}
              whileHover={prefersReducedMotion ? undefined : { y: -3, scale: 1.04 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.93 }}
              transition={{ type: "spring", stiffness: 460, damping: 24 }}
              aria-expanded={open}
              aria-controls="side-contact-panel"
              aria-label={open ? "Kontaktmenü schließen" : "Kontakt – Hannachi erreichen"}
              title={open ? "Kontaktmenü schließen" : "Kontakt – Hannachi erreichen"}
              className={`relative flex h-14 w-14 flex-col items-center justify-center rounded-full border transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-400/50 ${
                open
                  ? "border-white/20 bg-slate-900 text-white hover:bg-slate-800 shadow-[0_12px_28px_rgba(2,6,23,0.45)]"
                  : "border-sky-300/40 bg-gradient-to-br from-accent to-accent-dark text-white hover:border-sky-200/70 shadow-[0_12px_28px_rgba(2,6,23,0.34),0_6px_18px_rgba(2,132,199,0.32)] hover:shadow-[0_16px_34px_rgba(2,6,23,0.4),0_8px_22px_rgba(14,165,233,0.42)]"
              }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                {open ? (
                  <motion.span
                    key="side-close"
                    initial={prefersReducedMotion ? false : { rotate: -75, scale: 0.7, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    exit={prefersReducedMotion ? undefined : { rotate: 75, scale: 0.7, opacity: 0 }}
                    transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col items-center justify-center"
                  >
                    <X size={19} strokeWidth={2.2} aria-hidden="true" />
                    <span className="mt-0.5 text-[9.5px] font-bold uppercase tracking-wider leading-none">
                      Zu
                    </span>
                  </motion.span>
                ) : (
                  <motion.span
                    key="side-open"
                    initial={prefersReducedMotion ? false : { rotate: 75, scale: 0.7, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    exit={prefersReducedMotion ? undefined : { rotate: -75, scale: 0.7, opacity: 0 }}
                    transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col items-center justify-center"
                  >
                    <Phone size={18} strokeWidth={2.2} aria-hidden="true" />
                    <span className="mt-0.5 text-[9.5px] font-bold uppercase tracking-wider leading-none">
                      Kontakt
                    </span>
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {!open && savedDraft && draftShortBadge && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-1.5 -left-1.5 z-20 rounded-md border border-white/80 bg-emerald-600 px-1.5 py-0.5 text-[9.5px] font-extrabold leading-none text-white shadow-sm"
              >
                {draftShortBadge}
              </span>
            )}
          </div>
        </div>
      </aside>
  );
}
