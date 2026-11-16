"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck, MapPin, Sliders, Check, X } from "lucide-react";
import { useConsent } from "@/lib/consent";

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
        className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-5 pointer-events-none"
      >
        <motion.div
          initial={{ y: 30, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 30, opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-auto mx-auto max-w-4xl rounded-2xl sm:rounded-3xl border border-sky-400/25 bg-primary-dark/95 dark:bg-slate-900/95 p-4 sm:p-6 text-white shadow-[0_20px_50px_rgba(2,6,23,0.55)] backdrop-blur-2xl ring-1 ring-white/10"
        >
          <div className="flex flex-col gap-4">
            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
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
                  <p className="text-xs text-sky-200/80">
                    Hannachi Elektrohaushaltsgeräte Service · Osnabrück
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeBanner}
                aria-label="Hinweis schließen"
                className="rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {/* Description */}
            <p
              id="cookie-consent-desc"
              className="text-xs sm:text-sm text-white/80 leading-relaxed"
            >
              Wir nutzen keine Werbe- oder Tracking-Cookies. Unsere Website speichert
              lediglich technisch notwendige Einstellungen (z. B. Ihr gewähltes
              Farbdesign) lokal in Ihrem Browser. Für die
              interaktive Kartenanzeige unserer Einsatzregion in Osnabrück bieten wir Google Maps an.
              Dabei können Daten an Server von Google in den USA übertragen werden.
            </p>

            {/* Granular Customization Section */}
            {(showDetails || isCustomizing) && (
              <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-3.5 sm:p-4 text-xs">
                {/* 1. Essential Category */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-xs sm:text-sm">
                        Essenzielle Funktionen
                      </span>
                      <span className="rounded bg-sky-400/20 px-1.5 py-0.5 text-[10px] font-bold text-sky-300 uppercase">
                        Immer aktiv
                      </span>
                    </div>
                    <p className="mt-1 text-white/65 leading-relaxed">
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
                        <MapPin size={14} className="text-sky-300 shrink-0" aria-hidden="true" />
                        <span>Externe Medien (Google Maps)</span>
                      </span>
                    </div>
                    <p className="mt-1 text-white/65 leading-relaxed">
                      Ermöglicht das direkte Laden der interaktiven Google-Maps-Karte zur
                      Anfahrt nach Osnabrück. Hierbei wird Ihre IP-Adresse an Google LLC
                      (USA) übermittelt (zertifiziert nach EU-US Data Privacy Framework).
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={externalMediaSelected}
                      onChange={(e) => setExternalMediaSelected(e.target.checked)}
                      aria-label="Google Maps externe Medien aktivieren"
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                  </label>
                </div>
              </div>
            )}

            {/* Actions & Links */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-white/10">
              <div className="flex items-center gap-4 text-[11px] sm:text-xs text-white/60">
                <Link
                  href="/datenschutz"
                  onClick={closeBanner}
                  className="hover:text-white underline underline-offset-4"
                >
                  Datenschutzerklärung
                </Link>
                <span>·</span>
                <Link
                  href="/impressum"
                  onClick={closeBanner}
                  className="hover:text-white underline underline-offset-4"
                >
                  Impressum
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!showDetails && !isCustomizing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowDetails(true)}
                      className="flex-1 sm:flex-initial min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                    >
                      <Sliders size={13} aria-hidden="true" />
                      <span>Anpassen</span>
                    </button>
                    <button
                      type="button"
                      onClick={rejectNonEssential}
                      className="flex-1 sm:flex-initial min-h-[40px] inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                    >
                      Nur essenzielle
                    </button>
                    <button
                      type="button"
                      onClick={acceptAll}
                      className="w-full sm:w-auto min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-500 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-sky-400 active:scale-95 transition-all cursor-pointer"
                    >
                      <Check size={14} aria-hidden="true" />
                      <span>Alle akzeptieren</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={rejectNonEssential}
                      className="flex-1 sm:flex-initial min-h-[40px] inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                    >
                      Nur essenzielle
                    </button>
                    <button
                      type="button"
                      onClick={() => saveCustomPreferences(externalMediaSelected)}
                      className="flex-1 sm:flex-initial min-h-[40px] inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-sky-500 active:scale-95 transition-all cursor-pointer"
                    >
                      Auswahl speichern
                    </button>
                    <button
                      type="button"
                      onClick={acceptAll}
                      className="w-full sm:w-auto min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-500 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-sky-400 active:scale-95 transition-all cursor-pointer"
                    >
                      <Check size={14} aria-hidden="true" />
                      <span>Alle akzeptieren</span>
                    </button>
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
