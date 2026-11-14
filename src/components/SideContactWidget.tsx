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
} from "lucide-react";
import { business, type ServiceNotice } from "@/data/site";
import { herrHannachiImage } from "@/data/images";
import { useQuickRequest } from "@/components/QuickRequestSheet";
import { triggerHapticFeedback } from "@/lib/haptics";

const PROMPT_DISMISSED_STORAGE_KEY = "hannachi-contact-prompt-dismissed";
const PROMPT_DELAY_MS = 2500;

const promptContainerVariants: Variants = {
  hidden: { opacity: 0, x: 28, scale: 0.94 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 360,
      damping: 24,
      mass: 0.8,
      staggerChildren: 0.08,
      delayChildren: 0.06,
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    scale: 0.95,
    transition: { duration: 0.18, ease: "easeIn" },
  },
};

const promptItemVariants: Variants = {
  hidden: { opacity: 0, x: 14, scale: 0.96 },
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
  const { openQuickRequest } = useQuickRequest();
  const containerRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
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
    if (!open) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
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
    persistPromptDismissed();
    setOpen((prev) => !prev);
  };

  const handlePromptClick = () => {
    triggerHapticFeedback(50);
    persistPromptDismissed();
    setOpen(true);
  };

  const handlePromptDismiss = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    triggerHapticFeedback(50);
    persistPromptDismissed();
  };

  return (
    <aside
      ref={containerRef}
      aria-label="Direktkontakt Hannachi"
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end"
    >
      {/* Expanded Contact Card */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="side-contact-panel"
            role="dialog"
            aria-label="Kontakt zu Hannachi"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="origin-bottom-right relative mb-3.5 w-[min(calc(100vw-2rem),21.5rem)] max-h-[calc(100dvh-7.25rem)] overflow-y-auto overscroll-contain rounded-2xl border border-sky-400/25 bg-primary-dark/92 dark:bg-slate-900/92 p-4 sm:p-5 text-white shadow-[0_24px_60px_rgba(2,6,23,0.58)] backdrop-blur-2xl"
          >
            {/* Subtle matching sky-blue glass sheen inside card */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-sky-500/25 blur-2xl"
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
                    Direktkontakt · {business.city}
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
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white active:scale-95 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-light"
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
                <div>
                  <span className="font-bold text-amber-300 mr-1.5">
                    {serviceNotice.label || "Hinweis"}:
                  </span>
                  <span className="text-white/90">{serviceNotice.message}</span>
                </div>
              </div>
            )}

            {/* Consolidated 4 Contact Actions */}
            <div className="relative mt-3.5 space-y-2">
              {/* 1. Repair Request */}
              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback(50);
                  setOpen(false);
                  openQuickRequest("Waschmaschine", "", "", "repair");
                }}
                className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-sky-500 active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              >
                <span className="flex items-center gap-2.5">
                  <Wrench size={15} aria-hidden="true" />
                  <span>Reparaturanfrage starten</span>
                </span>
                <ArrowRight size={14} aria-hidden="true" />
              </button>

              {/* 2. WhatsApp Question */}
              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback(50);
                  setOpen(false);
                  openQuickRequest("Waschmaschine", "", "", "question");
                }}
                className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border border-emerald-500/40 bg-emerald-600/20 px-4 py-2.5 text-xs font-bold text-emerald-200 hover:bg-emerald-600 hover:text-white active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              >
                <span className="flex items-center gap-2.5">
                  <MessageCircle size={15} aria-hidden="true" />
                  <span>Direkte WhatsApp-Frage</span>
                </span>
                <ArrowRight size={14} aria-hidden="true" />
              </button>

              {/* 3. Direct Phone Call + Copy */}
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={phoneHref}
                  onClick={() => triggerHapticFeedback(50)}
                  className="flex min-h-[44px] flex-1 items-center justify-between gap-2 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/10 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                >
                  <span className="flex items-center gap-2.5 tabular-nums">
                    <Phone size={15} className="text-sky-300 shrink-0" aria-hidden="true" />
                    <span>{phone}</span>
                  </span>
                  <span className="text-[11px] font-semibold text-white/60">Anrufen</span>
                </a>
                <button
                  type="button"
                  onClick={handleCopyPhone}
                  aria-label="Telefonnummer kopieren"
                  title="Telefonnummer kopieren"
                  className="flex min-h-[44px] shrink-0 items-center justify-center gap-1 rounded-xl border border-white/15 bg-white/5 px-3 text-[11px] font-semibold text-white/85 hover:bg-white/15 hover:text-white active:scale-95 transition-all cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check size={13} className="text-emerald-400" aria-hidden="true" />
                      <span>Kopiert</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} aria-hidden="true" />
                      <span>Kopieren</span>
                    </>
                  )}
                </button>
              </div>

              {/* 4. Address & Map Navigation */}
              <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs">
                <Link
                  href="/kontakt"
                  onClick={() => {
                    triggerHapticFeedback(50);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 min-w-0 text-white/90 hover:text-white"
                >
                  <MapPin size={15} className="text-sky-300 shrink-0" aria-hidden="true" />
                  <span className="truncate font-medium">{address}</span>
                </Link>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => triggerHapticFeedback(50)}
                  className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-sky-300 hover:underline"
                >
                  <span>Maps</span>
                  <ExternalLink size={11} aria-hidden="true" />
                </a>
              </div>
            </div>

            {/* Static Footer Row */}
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-2 text-[11px] text-white/65">
              <span>{hours}</span>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => triggerHapticFeedback(50)}
                className="font-semibold text-emerald-300 hover:text-emerald-200 underline underline-offset-4 shrink-0"
              >
                WhatsApp direkt
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger Row: Delayed Slide-Out Prompt Bubble + Animated Circular Button */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <AnimatePresence>
          {isPromptVisible && !open && !isPromptDismissed && (
            <motion.div
              key="contact-prompt-bubble"
              variants={promptContainerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative flex items-center gap-2 max-w-[245px] sm:max-w-[295px] rounded-2xl border border-sky-300/45 bg-primary-dark/95 dark:bg-slate-900/95 pl-3 pr-1.5 py-2 text-white shadow-[0_16px_36px_rgba(2,6,23,0.48)] backdrop-blur-2xl ring-1 ring-sky-400/20"
            >
              <button
                type="button"
                onClick={handlePromptClick}
                className="group flex items-center gap-2.5 min-w-0 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 rounded-xl"
              >
                {/* Mini avatar of Kamal Hannachi with verified status dot */}
                <motion.div
                  variants={promptItemVariants}
                  className="relative h-9 w-9 sm:h-10 sm:w-10 shrink-0 overflow-hidden rounded-full border border-sky-300/60 bg-slate-800"
                >
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
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-primary-dark bg-emerald-400 shadow-xs"
                  />
                </motion.div>

                <div className="min-w-0">
                  <motion.p
                    variants={promptItemVariants}
                    className="text-[11px] font-bold text-white/75 truncate leading-tight"
                  >
                    Persönlicher Fachbetrieb
                  </motion.p>
                  <motion.div
                    variants={promptItemVariants}
                    className="mt-0.5 inline-flex items-center gap-1 text-xs sm:text-[13px] font-black text-sky-300 group-hover:text-white transition-colors"
                  >
                    <span>Hannachi kontaktieren</span>
                    <ArrowRight
                      size={13}
                      className="shrink-0 transition-transform group-hover:translate-x-1"
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
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/50 hover:bg-white/15 hover:text-white active:scale-95 transition-colors cursor-pointer"
              >
                <X size={13} aria-hidden="true" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Circular Trigger Stack with Frosted Dynamic Aura, Breathing Ring & Light Sweep */}
        <div className="contact-widget-trigger-wrap relative flex items-center justify-center">
          {/* Layer 1: Medium-opacity frosted sky-blue glass aura moving smoothly behind */}
          <span
            aria-hidden="true"
            className="contact-frosted-aura pointer-events-none absolute -inset-6 sm:-inset-8 rounded-full backdrop-blur-md"
          />

          {/* Layer 2: Double soft breathing halo rings when idle */}
          {!open && (
            <>
              <span
                aria-hidden="true"
                className="contact-breathing-ring-1 pointer-events-none absolute -inset-2 rounded-full border-2 border-sky-300/80 shadow-[0_0_18px_rgba(56,189,248,0.55)]"
              />
              <span
                aria-hidden="true"
                className="contact-breathing-ring-2 pointer-events-none absolute -inset-2 rounded-full border border-sky-400/60"
              />
            </>
          )}

          {/* Layer 3: Single Circular Contact Button */}
          <motion.button
            type="button"
            onClick={handleToggleOpen}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            aria-expanded={open}
            aria-controls="side-contact-panel"
            aria-label={open ? "Kontaktmenü schließen" : "Kontakt – Hannachi erreichen"}
            title={open ? "Kontaktmenü schließen" : "Kontakt – Hannachi erreichen"}
            className={`relative flex h-16 w-16 sm:h-[72px] sm:w-[72px] flex-col items-center justify-center overflow-hidden rounded-full border-2 border-white/95 shadow-[0_16px_38px_rgba(2,6,23,0.52)] transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300 ${
              !open ? "contact-button-floating" : ""
            } ${
              open
                ? "bg-primary-dark text-white hover:bg-slate-900"
                : "bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 text-white hover:from-sky-400 hover:to-sky-600"
            }`}
          >
            {/* Periodic diagonal specular light sweep overlay */}
            {!open && (
              <span
                aria-hidden="true"
                className="contact-light-sweep pointer-events-none absolute inset-y-0 left-0 w-3/5"
              />
            )}

            {open ? (
              <>
                <X size={24} strokeWidth={2.5} aria-hidden="true" className="relative z-10" />
                <span className="relative z-10 mt-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider leading-none">
                  Zu
                </span>
              </>
            ) : (
              <>
                <Phone size={22} strokeWidth={2.5} aria-hidden="true" className="relative z-10" />
                <span className="relative z-10 mt-1 text-[11px] sm:text-xs font-black uppercase tracking-wider leading-none">
                  Kontakt
                </span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </aside>
  );
}
