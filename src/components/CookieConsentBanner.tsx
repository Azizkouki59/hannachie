"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useDragControls,
  useReducedMotion,
  type PanInfo,
} from "framer-motion";
import { ShieldCheck, MapPin, Sliders, Check, X } from "lucide-react";
import { useConsent } from "@/lib/consent";
import { hapticDismiss, hapticTap } from "@/lib/haptics";

export default function CookieConsentBanner() {
  const {
    isBannerOpen,
    isCustomizing,
    preferences,
    acceptAll,
    rejectNonEssential,
    saveCustomPreferences,
    closeBanner,
  } = useConsent();

  const [externalMediaSelected, setExternalMediaSelected] = useState(
    preferences.externalMedia
  );
  const [showDetails, setShowDetails] = useState(isCustomizing);
  const prefersReducedMotion = useReducedMotion();
  const dragControls = useDragControls();

  const handleBannerDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.y > 75 || info.velocity.y > 380) {
      hapticDismiss();
      closeBanner();
    }
  };

  useEffect(() => {
    if (isBannerOpen) {
      setExternalMediaSelected(preferences.externalMedia);
      setShowDetails(isCustomizing);
    }
  }, [isBannerOpen, isCustomizing, preferences.externalMedia]);

  useEffect(() => {
    if (!isBannerOpen) return undefined;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeBanner();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isBannerOpen, closeBanner]);

  return (
    <AnimatePresence>
      {isBannerOpen && (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-desc"
        className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] lg:bottom-0 inset-x-0 z-50 p-2.5 sm:p-5 lg:pb-[max(1.25rem,env(safe-area-inset-bottom))] pointer-events-none"
      >
        <motion.div
          drag={prefersReducedMotion ? false : "y"}
          dragControls={dragControls}
          dragListener={false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0.05, bottom: 0.9 }}
          onDragEnd={handleBannerDragEnd}
          initial={prefersReducedMotion ? { opacity: 0 } : { y: 40, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { y: 48, opacity: 0, scale: 0.98 }}
          transition={
            prefersReducedMotion
              ? { duration: 0.12 }
              : { type: "spring", stiffness: 380, damping: 32 }
          }
          className="pointer-events-auto mx-auto max-w-4xl max-h-[calc(100dvh-8.75rem-env(safe-area-inset-bottom))] lg:max-h-[85dvh] overflow-y-auto overscroll-contain rounded-2xl border border-sky-400/25 bg-primary-dark/95 dark:bg-slate-900/95 p-3.5 sm:p-6 text-white shadow-[0_20px_50px_rgba(2,6,23,0.65)] backdrop-blur-2xl ring-1 ring-white/10 will-change-transform"
        >
          {/* Mobile Swipe-Down Handle */}
          <div
            onPointerDown={(e) => {
              if (!prefersReducedMotion) {
                dragControls.start(e);
              }
            }}
            aria-hidden="true"
            className="-mt-1 pb-2.5 flex justify-center sm:hidden touch-none select-none cursor-grab active:cursor-grabbing"
          >
            <span className="h-1 w-10 rounded-full bg-white/25" />
          </div>

          <div className="flex flex-col gap-4">
            {/* Header row */}
            <div
              onPointerDown={(e) => {
                if (!prefersReducedMotion) {
                  dragControls.start(e);
                }
              }}
              className="flex items-start justify-between gap-3 touch-none sm:touch-auto"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/20 text-sky-300">
                  <ShieldCheck size={20} aria-hidden="true" />
                </span>
                <div>
                  <h2
                    id="cookie-consent-title"
                    className="text-base sm:text-lg font-extrabold tracking-tight text-white"
                  >
                    Privatsphäre- &amp; Cookie-Einstellungen
                  </h2>
                  <p className="text-xs text-white/65">
                    <span translate="no" className="notranslate">
                      Hannachi
                    </span>{" "}
                    Elektrohaushaltsgeräte &amp; Ersatzteile ·{" "}
                    <span translate="no" className="notranslate">
                      Osnabrück
                    </span>
                  </p>
                </div>
              </div>
              <motion.button
                whileTap={prefersReducedMotion ? undefined : { scale: 0.9 }}
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={closeBanner}
                aria-label="Hinweis schließen"
                className="flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} aria-hidden="true" />
              </motion.button>
            </div>

            {/* Description */}
            <p
              id="cookie-consent-desc"
              className="text-xs sm:text-sm text-white/80 leading-relaxed"
            >
              Wir setzen keine Werbe- oder Tracking-Cookies ein. Lediglich technisch notwendige
              Einstellungen (z. B. Hell-/Dunkelmodus, Formular-Entwurf) werden gemäß{" "}
              <strong translate="no" className="notranslate text-white">
                § 25 Abs. 2 TDDDG
              </strong>{" "}
              lokal gespeichert. Optional können Sie{" "}
              <strong translate="no" className="notranslate text-white">
                Google Maps
              </strong>{" "}
              (<span translate="no" className="notranslate">Google Ireland / USA</span>,{" "}
              <span translate="no" className="notranslate">Art. 6 Abs. 1 lit. a DSGVO</span>) freischalten, jederzeit widerrufbar.
            </p>

            {/* Granular Customization Section */}
            <AnimatePresence initial={false}>
            {(showDetails || isCustomizing) && (
              <motion.div
                key="cookie-details"
                initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
                transition={{
                  height: { type: "spring", stiffness: 360, damping: 32 },
                  opacity: { duration: 0.18 },
                }}
                className="overflow-hidden"
              >
              <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.04] p-3.5 sm:p-4 text-xs">
                {/* 1. Essential Category */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-xs sm:text-sm">
                        Essenzielle Funktionen
                      </span>
                      <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-bold text-sky-300 uppercase">
                        Immer aktiv
                      </span>
                    </div>
                    <p className="mt-1 text-white/70 leading-relaxed">
                      Erforderlich für die Grundfunktionen der Website, Navigation,
                      sichere Formularbedienung und Speicherung Ihrer
                      Designeinstellungen (Hell/Dunkel).
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked
                    disabled
                    aria-label="Essenzielle Funktionen immer aktiv"
                    className="mt-1 h-4 w-4 rounded accent-sky-500 cursor-not-allowed opacity-80"
                  />
                </div>

                {/* 2. External Media Category */}
                <div className="flex items-start justify-between gap-3 pt-1">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-xs sm:text-sm flex items-center gap-1.5">
                        <MapPin size={14} className="text-sky-400 shrink-0" aria-hidden="true" />
                        <span>
                          Externe Medien (
                          <span translate="no" className="notranslate">
                            Google Maps
                          </span>
                          )
                        </span>
                      </span>
                    </div>
                    <p className="mt-1 text-white/70 leading-relaxed">
                      Ermöglicht das direkte Laden der interaktiven{" "}
                      <span translate="no" className="notranslate">
                        Google-Maps
                      </span>
                      -Karte zur Orientierung in{" "}
                      <span translate="no" className="notranslate">
                        Osnabrück
                      </span>
                      . Hierbei wird Ihre IP-Adresse an{" "}
                      <span translate="no" className="notranslate">
                        Google LLC
                      </span>{" "}
                      (USA) übermittelt (zertifiziert nach{" "}
                      <span translate="no" className="notranslate">
                        EU-US Data Privacy Framework
                      </span>
                      ).
                    </p>
                  </div>
                  <label className="relative inline-flex min-h-[44px] min-w-[44px] items-center justify-end cursor-pointer">
                    <input
                      type="checkbox"
                      checked={externalMediaSelected}
                      onChange={(e) => setExternalMediaSelected(e.target.checked)}
                      aria-label="Google Maps externe Medien aktivieren"
                      className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                  </label>
                </div>
              </div>
              </motion.div>
            )}
            </AnimatePresence>

            {/* Actions & Links */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 pt-2 border-t border-white/10">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-white/60">
                <Link
                  href="/datenschutz"
                  onClick={closeBanner}
                  className="inline-flex min-h-[44px] sm:min-h-0 items-center hover:text-white underline underline-offset-4"
                >
                  Datenschutzerklärung
                </Link>
                <span aria-hidden="true">·</span>
                <Link
                  href="/impressum"
                  onClick={closeBanner}
                  className="inline-flex min-h-[44px] sm:min-h-0 items-center hover:text-white underline underline-offset-4"
                >
                  Impressum
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!showDetails && !isCustomizing ? (
                  <>
                    <motion.button
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                      type="button"
                      onClick={() => {
                        hapticTap();
                        setShowDetails(true);
                      }}
                      className="flex-1 sm:flex-initial min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/15 transition-colors cursor-pointer"
                    >
                      <Sliders size={13} aria-hidden="true" />
                      <span>Anpassen</span>
                    </motion.button>
                    <motion.button
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                      type="button"
                      onClick={() => {
                        hapticTap();
                        rejectNonEssential();
                      }}
                      className="flex-1 sm:flex-initial min-h-[44px] inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/12 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition-colors cursor-pointer"
                    >
                      Nur notwendige
                    </motion.button>
                    <motion.button
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                      type="button"
                      onClick={() => {
                        hapticTap();
                        acceptAll();
                      }}
                      className="flex-1 sm:flex-initial min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-400 transition-colors cursor-pointer"
                    >
                      <Check size={14} aria-hidden="true" />
                      <span>Alle akzeptieren</span>
                    </motion.button>
                  </>
                ) : (
                  <>
                    <motion.button
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                      type="button"
                      onClick={() => {
                        hapticTap();
                        rejectNonEssential();
                      }}
                      className="flex-1 sm:flex-initial min-h-[44px] inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/12 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition-colors cursor-pointer"
                    >
                      Nur notwendige
                    </motion.button>
                    <motion.button
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                      type="button"
                      onClick={() => {
                        hapticTap();
                        saveCustomPreferences(externalMediaSelected);
                      }}
                      className="flex-1 sm:flex-initial min-h-[44px] inline-flex items-center justify-center rounded-xl border border-sky-400/50 bg-sky-500/20 px-4 py-2 text-xs font-bold text-sky-200 hover:bg-sky-500/30 transition-colors cursor-pointer"
                    >
                      Auswahl speichern
                    </motion.button>
                    <motion.button
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                      type="button"
                      onClick={() => {
                        hapticTap();
                        acceptAll();
                      }}
                      className="flex-1 sm:flex-initial min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-400 transition-colors cursor-pointer"
                    >
                      <Check size={14} aria-hidden="true" />
                      <span>Alle akzeptieren</span>
                    </motion.button>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
}
