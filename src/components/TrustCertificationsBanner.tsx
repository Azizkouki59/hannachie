"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  ShieldCheck,
  MapPin,
  Wrench,
  CheckCircle2,
  Star,
  ExternalLink,
  Sparkles,
  Phone,
} from "lucide-react";
import { business, yearsOfExperience } from "@/data/site";

interface CertificationBadge {
  id: string;
  code: string;
  englishLabel: string;
  title: string;
  subtitle: string;
  sealText: string;
  highlightMetric: string;
  guaranteeDetails: string[];
  accentColor: string;
  sealGradient: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  renderSealSvg: () => React.ReactNode;
}

const TRUST_BADGES: CertificationBadge[] = [
  {
    id: "verified-service",
    code: "SIEGEL 01",
    englishLabel: "Geprüfter Service",
    title: "Geprüfter Fachservice & Handwerk",
    subtitle: "Präzise Fehlerdiagnose, Mechanik & Elektronik auf Platinenebene.",
    sealText: "GEPRÜFTER FACHSERVICE",
    highlightMetric: "Inhaber: Kamal Hannachi",
    guaranteeDetails: [
      "Persönliche Ausführung durch Herrn Hannachi ohne Subunternehmer",
      "Spezialwerkstatt für Steuerelektronik, Relais & Leistungsplatinen",
      "Abschließende Funktions-, Dichtheits- und Sicherheitsprüfung",
    ],
    accentColor: "text-sky-600 dark:text-sky-400",
    sealGradient: "from-sky-500 to-blue-700",
    icon: Wrench,
    renderSealSvg: () => (
      <svg viewBox="0 0 64 64" className="h-11 w-11 sm:h-14 sm:w-14 shrink-0" aria-hidden="true">
        <defs>
          <linearGradient id="seal-craftsman" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>
        {/* Outer notched rosette */}
        <circle
          cx="32"
          cy="32"
          r="29"
          fill="url(#seal-craftsman)"
          fillOpacity="0.12"
          stroke="url(#seal-craftsman)"
          strokeWidth="1.75"
          strokeDasharray="4 2"
        />
        <circle
          cx="32"
          cy="32"
          r="23"
          fill="url(#seal-craftsman)"
          className="drop-shadow-xs"
        />
        <circle
          cx="32"
          cy="32"
          r="19.5"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.35"
          strokeWidth="1"
        />
        {/* Precision Gear + Wrench Crest */}
        <path
          d="M25 39L39 25M35.5 21.5a5 5 0 0 1 6 6l-3.2-3.2-2.6 2.6 3.2 3.2a5 5 0 0 1-6-6"
          stroke="#ffffff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="24.5" cy="39.5" r="2.2" fill="#38bdf8" />
      </svg>
    ),
  },
  {
    id: "since-1990",
    code: "SEIT 1990",
    englishLabel: "Seit 1990",
    title: `Traditionsbetrieb seit ${business.founded}`,
    subtitle: `Über ${yearsOfExperience} Jahre Erfahrung mit Haushaltsgeräten aller Marken.`,
    sealText: `SEIT ${business.founded} IN OSNABRÜCK`,
    highlightMetric: `${yearsOfExperience}+ Jahre Praxis`,
    guaranteeDetails: [
      `Gegründet ${business.founded} – über drei Jahrzehnte gewachsenes Vertrauen`,
      "Tiefes Markenwissen für Miele, Bosch, Siemens, AEG, Bauknecht, Liebherr u. v. m.",
      "Erfahrung sowohl mit modernen Smart-Geräten als auch mit bewährten Altgeräten",
    ],
    accentColor: "text-amber-600 dark:text-amber-400",
    sealGradient: "from-amber-500 to-orange-600",
    icon: Award,
    renderSealSvg: () => (
      <svg viewBox="0 0 64 64" className="h-11 w-11 sm:h-14 sm:w-14 shrink-0" aria-hidden="true">
        <defs>
          <linearGradient id="seal-1990" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
        </defs>
        <circle
          cx="32"
          cy="32"
          r="29"
          fill="url(#seal-1990)"
          fillOpacity="0.14"
          stroke="url(#seal-1990)"
          strokeWidth="1.75"
          strokeDasharray="4 2"
        />
        <circle cx="32" cy="32" r="23" fill="url(#seal-1990)" />
        <circle
          cx="32"
          cy="32"
          r="19.5"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.4"
          strokeWidth="1"
        />
        {/* Star + 1990 Heritage Stamp */}
        <text
          x="32"
          y="26"
          textAnchor="middle"
          fill="#fef3c7"
          fontSize="7"
          fontWeight="800"
          letterSpacing="1"
        >
          SEIT
        </text>
        <text
          x="32"
          y="38"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="12.5"
          fontWeight="900"
          fontFamily="monospace"
        >
          1990
        </text>
        <path
          d="M23 43.5h18"
          stroke="#fde68a"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "local-expert",
    code: "PLZ 49082",
    englishLabel: "Vor Ort in OS",
    title: "Lokaler Experte in Osnabrück",
    subtitle: "Iburger Straße 5 · Direktkontakt ohne anonymes Callcenter.",
    sealText: "100 % REGIONALER EXPERTE",
    highlightMetric: "49082 Osnabrück",
    guaranteeDetails: [
      "Fester Werkstattstandort in der Iburger Straße 5 (Im Hof), 49082 Osnabrück",
      "Kein überregionaler Vermittler – Sie sprechen direkt mit Herrn Hannachi",
      "Kurze Anfahrtswege und schnelle Vor-Ort-Termine im gesamten Stadtgebiet",
    ],
    accentColor: "text-emerald-600 dark:text-emerald-400",
    sealGradient: "from-emerald-500 to-teal-600",
    icon: MapPin,
    renderSealSvg: () => (
      <svg viewBox="0 0 64 64" className="h-11 w-11 sm:h-14 sm:w-14 shrink-0" aria-hidden="true">
        <defs>
          <linearGradient id="seal-local" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
        </defs>
        <circle
          cx="32"
          cy="32"
          r="29"
          fill="url(#seal-local)"
          fillOpacity="0.14"
          stroke="url(#seal-local)"
          strokeWidth="1.75"
          strokeDasharray="4 2"
        />
        <circle cx="32" cy="32" r="23" fill="url(#seal-local)" />
        <circle
          cx="32"
          cy="32"
          r="19.5"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.35"
          strokeWidth="1"
        />
        {/* Location Pin Crest */}
        <path
          d="M32 19c-5.2 0-9.5 4.1-9.5 9.2 0 6.8 9.5 16.3 9.5 16.3s9.5-9.5 9.5-16.3c0-5.1-4.3-9.2-9.5-9.2zm0 12.7a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"
          fill="#ffffff"
        />
      </svg>
    ),
  },
  {
    id: "verified-quality",
    code: "4,8 ★ NOTE",
    englishLabel: "Geprüfte Qualität",
    title: "Originalteile & 4,8 ★ Bewertung",
    subtitle: "Ehrliche Kosteneinschätzung vorab & geprüfte Markenersatzteile.",
    sealText: "100 % KOSTENTRANSPARENZ",
    highlightMetric: "4,8 ★ (82 Google-Rezensionen)",
    guaranteeDetails: [
      "Ehrliche Vorabberatung: Wir reparieren nur, wenn es sich für Sie lohnt",
      "Gängige Originalersatzteile direkt im Servicefahrzeug vorrätig",
      "Verifizierte 4,8 ★ Bewertung (82 Rezensionen) von Kunden aus Osnabrück auf Google Maps",
    ],
    accentColor: "text-violet-600 dark:text-violet-400",
    sealGradient: "from-violet-500 to-indigo-600",
    icon: ShieldCheck,
    renderSealSvg: () => (
      <svg viewBox="0 0 64 64" className="h-11 w-11 sm:h-14 sm:w-14 shrink-0" aria-hidden="true">
        <defs>
          <linearGradient id="seal-quality" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
        </defs>
        <circle
          cx="32"
          cy="32"
          r="29"
          fill="url(#seal-quality)"
          fillOpacity="0.14"
          stroke="url(#seal-quality)"
          strokeWidth="1.75"
          strokeDasharray="4 2"
        />
        <circle cx="32" cy="32" r="23" fill="url(#seal-quality)" />
        <circle
          cx="32"
          cy="32"
          r="19.5"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.35"
          strokeWidth="1"
        />
        {/* Shield + Checkmark Crest */}
        <path
          d="M32 18.5l10.5 4.2v7.8c0 6.8-4.5 12.9-10.5 15-6-2.1-10.5-8.2-10.5-15v-7.8L32 18.5z"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M27.8 31.2l3 3 5.8-6"
          fill="none"
          stroke="#fde047"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function TrustCertificationsBanner() {
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null);

  const activeBadge = TRUST_BADGES.find((b) => b.id === selectedBadgeId) || null;

  return (
    <section
      aria-label="Vertrauenssiegel & Qualitätsgarantien"
      className="relative z-20 border-b border-primary/10 dark:border-white/10 bg-gradient-to-b from-slate-900 via-slate-900 to-primary-dark text-white py-6 sm:py-8 overflow-hidden"
    >
      {/* Subtle ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-full max-w-[760px] rounded-full bg-accent/15 blur-[90px]"
      />

      <div className="container-page relative z-10">
        {/* Top Trust Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-5 mb-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <ShieldCheck size={15} />
            </span>
            <p className="text-xs sm:text-sm font-extrabold tracking-wide uppercase text-white">
              Geprüftes Vertrauen &amp; Qualitätssiegel · Hannachi Osnabrück
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] sm:text-xs text-white/75">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <CheckCircle2 size={13} className="text-emerald-400" />
              Kein Vermittlungsdienst
            </span>
            <span aria-hidden="true" className="text-white/25">
              ·
            </span>
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <CheckCircle2 size={13} className="text-accent-light" />
              Siegel antippen für alle Nachweise
            </span>
          </div>
        </div>

        {/* Immediate-Load Quick Trust Strip + 4 Visual Certification & Trust Seal Cards */}
        <div className="mb-4 grid grid-cols-1 min-[380px]:grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5" data-testid="hero-trust-badges-strip">
          {[
            { label: "Qualitätssiegel", de: "Geprüfter Fachservice", icon: ShieldCheck },
            { label: "Seit 1990", de: `Erfahrung seit ${business.founded}`, icon: Award },
            { label: "Vor Ort", de: "Lokaler Experte Osnabrück", icon: MapPin },
            { label: "4,8 ★ Google", de: "100 % Kostentransparenz", icon: Star },
          ].map(({ label, de, icon: BadgeIcon }) => (
            <div
              key={label}
              className="inline-flex min-w-0 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-white shadow-xs backdrop-blur-sm"
            >
              <BadgeIcon size={14} className="text-accent-light shrink-0" aria-hidden="true" />
              <span className="truncate">{de}</span>
              <span className="hidden min-[440px]:inline text-[10px] font-semibold uppercase tracking-wider text-accent-light/90 shrink-0">
                · {label}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 min-[520px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {TRUST_BADGES.map((badge, index) => {
            const isSelected = selectedBadgeId === badge.id;

            return (
              <motion.button
                key={badge.id}
                type="button"
                onClick={() =>
                  setSelectedBadgeId((prev) => (prev === badge.id ? null : badge.id))
                }
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.42,
                  delay: 0.08 + index * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
                whileHover={{ y: -3 }}
                aria-expanded={isSelected}
                className={`group relative flex flex-col justify-between rounded-2xl border p-3.5 sm:p-5 text-left transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "border-accent bg-white/[0.11] shadow-[0_12px_32px_rgba(14,165,233,0.22)] ring-2 ring-accent/40"
                    : "border-white/12 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.08]"
                }`}
              >
                {/* Top Seal Row */}
                <div>
                  <div className="flex items-start gap-3.5">
                    <div className="transition-transform duration-300 group-hover:scale-105">
                      {badge.renderSealSvg()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span className="inline-block rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-accent-light">
                          {badge.englishLabel}
                        </span>
                        <span className="font-mono text-[10px] font-bold text-white/40 tabular-nums shrink-0">
                          {badge.code}
                        </span>
                      </div>
                      <h3 className="mt-1.5 text-[15px] sm:text-base font-extrabold text-white leading-snug">
                        {badge.title}
                      </h3>
                    </div>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-white/75">
                    {badge.subtitle}
                  </p>
                </div>

                {/* Bottom Verification Stamp Footer */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-300">
                    <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                    <span className="truncate">{badge.highlightMetric}</span>
                  </span>
                  <span className="text-[11px] font-bold text-accent-light group-hover:underline shrink-0">
                    {isSelected ? "Schließen ×" : "Nachweis →"}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Expandable Certification Proof Drawer when any Badge is clicked */}
        <AnimatePresence>
          {activeBadge && (
            <motion.div
              key={activeBadge.id}
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl border border-accent/35 bg-white/[0.07] p-4 sm:p-6 backdrop-blur-md">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r ${activeBadge.sealGradient} px-2.5 py-1 text-[11px] font-extrabold text-white`}
                      >
                        <Sparkles size={12} />
                        {activeBadge.sealText}
                      </span>
                      <span className="text-xs font-bold text-white/70">
                        Zertifiziertes Qualitätsmerkmal · {business.name} {business.tagline}
                      </span>
                    </div>
                    <h4 className="text-lg font-extrabold text-white">
                      {activeBadge.title} ({activeBadge.englishLabel})
                    </h4>
                    <ul className="grid gap-2 sm:grid-cols-3 pt-1">
                      {activeBadge.guaranteeDetails.map((detail) => (
                        <li
                          key={detail}
                          className="flex items-start gap-2 rounded-xl bg-black/25 border border-white/10 p-3 text-xs text-white/90 leading-relaxed"
                        >
                          <CheckCircle2
                            size={14}
                            className="text-emerald-400 shrink-0 mt-0.5"
                          />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto shrink-0">
                    <a
                      href={business.phoneHref}
                      className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-accent hover:bg-accent-dark px-4 py-2.5 text-center text-xs font-extrabold text-white shadow-sm transition-colors sm:whitespace-nowrap"
                    >
                      <Phone size={14} className="shrink-0" />
                      <span>Direktkontakt: {business.phoneDisplay}</span>
                    </a>
                    <a
                      href={business.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 px-4 py-2.5 text-center text-xs font-bold text-white transition-colors sm:whitespace-nowrap"
                    >
                      <Star size={14} className="fill-amber-400 text-amber-400 shrink-0" />
                      <span>Google Bewertungen</span>
                      <ExternalLink size={13} className="shrink-0" />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
