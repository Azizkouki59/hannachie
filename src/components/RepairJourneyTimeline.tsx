"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardEdit,
  Stethoscope,
  Wrench,
  CheckCircle2,
  Star,
  MapPin,
  Clock,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  ThumbsUp,
} from "lucide-react";
import { business } from "@/data/site";
import { FadeUp } from "./animations";

export interface JourneyStep {
  id: 1 | 2 | 3 | 4;
  code: string;
  stageEn: string;
  title: string;
  subtitle: string;
  durationBadge: string;
  assuranceBadge: string;
  description: string;
  customerAction: string;
  technicianAction: string;
  deliverables: string[];
  color: string;
  bgGlow: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const JOURNEY_STEPS: JourneyStep[] = [
  {
    id: 1,
    code: "01",
    stageEn: "Anfrage",
    title: "Anfrage stellen",
    subtitle: "Gerät, Marke & Symptom in 2 Minuten übermitteln",
    durationBadge: "Dauer: ca. 2 Min.",
    assuranceBadge: "100 % unverbindlich",
    description:
      "Wählen Sie Ihr defektes Haushaltsgerät im Online-Assistenten, per WhatsApp oder telefonisch aus. Sie erhalten sofort Ihre persönliche Anfrage-Referenznummer.",
    customerAction: "Gerätetyp, Hersteller und Fehlerbild kurz auswählen oder Foto vom Typenschild anhängen.",
    technicianAction: "Sofortige Erfassung Ihrer Anfrage ohne Callcenter-Warteschleife.",
    deliverables: [
      "Sofortige Anfrage-Referenznummer (#HAN-...)",
      "Direktübermittlung per WhatsApp oder Telefon",
      "Kein Risiko & keine versteckten Vorabkosten",
    ],
    color: "from-sky-500 to-blue-600",
    bgGlow: "from-sky-500/15 to-blue-600/15",
    icon: ClipboardEdit,
  },
  {
    id: 2,
    code: "02",
    stageEn: "Diagnose",
    title: "Diagnose & Kosteneinschätzung",
    subtitle: "Persönliche Ersteinschätzung durch Herrn Hannachi",
    durationBadge: "Rückmeldung: 30–60 Min.",
    assuranceBadge: "Volle Kostentransparenz",
    description:
      "Herr Hannachi prüft Ihre Angaben persönlich. Oft lässt sich die Ursache schon am Telefon eingrenzen – inklusive transparenter Einschätzung, ob sich die Reparatur wirtschaftlich lohnt.",
    customerAction: "Kurze Abstimmung zum Fehlerbild und Auswahl Ihres Wunschtermins.",
    technicianAction: "Prüfung der benötigten Originalersatzteile & ehrliche Kosten-Nutzen-Beratung.",
    deliverables: [
      "Kostenfreie telefonische Ersteinschätzung",
      "Ehrliche Empfehlung (Reparatur nur wenn sinnvoll)",
      "Kurzfristige Terminvereinbarung in Osnabrück",
    ],
    color: "from-violet-500 to-indigo-600",
    bgGlow: "from-violet-500/15 to-indigo-600/15",
    icon: Stethoscope,
  },
  {
    id: 3,
    code: "03",
    stageEn: "Reparatur",
    title: "Fachgerechte Reparatur",
    subtitle: "Vor-Ort-Service in Osnabrück oder Meisterwerkstatt",
    durationBadge: "Meist innerhalb 24 Std.",
    assuranceBadge: "Originalersatzteile",
    description:
      "Pünktlich zum vereinbarten Termin reparieren wir Ihr Gerät direkt bei Ihnen vor Ort oder in unserer Werkstatt an der Iburger Straße 5 – inklusive Spezialreparaturen auf Platinenebene.",
    customerAction: "Entspannt zurücklehnen – gängige Verschleißteile haben wir direkt im Servicefahrzeug.",
    technicianAction: "Präzise Fehlerbehebung, Austausch defekter Baugruppen & Reinigung relevanter Komponenten.",
    deliverables: [
      "Geprüfte Original- & Marken-Ersatzteile",
      "Saubere Arbeitsweise direkt bei Ihnen vor Ort",
      "Nachhaltige Elektronik- & Platineninstandsetzung",
    ],
    color: "from-amber-500 to-orange-500",
    bgGlow: "from-amber-500/15 to-orange-500/15",
    icon: Wrench,
  },
  {
    id: 4,
    code: "04",
    stageEn: "Abschluss",
    title: "Abschluss & Google-Bewertung",
    subtitle: "Gemeinsamer Funktionstest & automatische Google-Bewertung",
    durationBadge: "Sofort einsatzbereit",
    assuranceBadge: "5,0 ★ Servicequalität",
    description:
      "Nach erfolgreichem Probelauf und Sicherheitsprüfung übergeben wir Ihr funktionierendes Gerät. Direkt nach Abschluss öffnet sich automatisch unser Google-Maps-Bewertungsassistent.",
    customerAction: "Gemeinsame Abnahme des reparierten Geräts & 1-Klick-Bewertung auf Google Maps.",
    technicianAction: "Dichtheits- & Sicherheitsprüfung, Pflegehinweise & transparente Abrechnung.",
    deliverables: [
      "Vollständiger Funktions- & Sicherheitstest",
      "Transparente Endabrechnung ohne Überraschungen",
      "Automatische 5-Sterne-Bewertungsoption für Google Maps",
    ],
    color: "from-emerald-500 to-teal-600",
    bgGlow: "from-emerald-500/15 to-teal-600/15",
    icon: CheckCircle2,
  },
];

const QUICK_REVIEW_TAGS = [
  "Schneller Termin am nächsten Tag",
  "Sehr faire & transparente Preise",
  "Kompetente Fehlerdiagnose",
  "Freundlicher & ehrlicher Service",
  "Originalersatzteile direkt dabei",
  "Hilfreicher Tipp schon am Telefon",
];

export default function RepairJourneyTimeline({
  onStartRequest,
}: {
  onStartRequest?: () => void;
}) {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [serviceCompleted, setServiceCompleted] = useState<boolean>(false);

  // Automatic Google Maps rating state once Step 4 (Completion) is reached
  const [selectedStars, setSelectedStars] = useState<number>(5);
  const [hoveredStars, setHoveredStars] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([
    "Schneller Termin am nächsten Tag",
    "Sehr faire & transparente Preise",
  ]);
  const [customReviewNote, setCustomReviewNote] = useState<string>("");
  const [copiedReview, setCopiedReview] = useState<boolean>(false);
  const [autoRateCountdown, setAutoRateCountdown] = useState<number | null>(null);
  const [autoRateTriggered, setAutoRateTriggered] = useState<boolean>(false);

  // Auto-advance through steps 1 -> 2 -> 3 -> 4 when simulation is active
  useEffect(() => {
    if (!isAutoPlaying) return;

    const timer = setTimeout(() => {
      if (activeStep < 4) {
        const next = (activeStep + 1) as 1 | 2 | 3 | 4;
        setActiveStep(next);
        if (next === 4) {
          setServiceCompleted(true);
          setIsAutoPlaying(false);
          setAutoRateCountdown(5);
        }
      } else {
        setIsAutoPlaying(false);
      }
    }, 2200);

    return () => clearTimeout(timer);
  }, [isAutoPlaying, activeStep]);

  // Countdown timer for automatic Google Maps rating readiness when service is marked done
  useEffect(() => {
    if (autoRateCountdown === null) return;
    if (autoRateCountdown <= 0) {
      setAutoRateCountdown(null);
      setAutoRateTriggered(true);
      return;
    }
    const t = setTimeout(() => {
      setAutoRateCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(t);
  }, [autoRateCountdown]);

  const handleSelectStep = (stepId: 1 | 2 | 3 | 4) => {
    setIsAutoPlaying(false);
    setActiveStep(stepId);
    if (stepId === 4) {
      setServiceCompleted(true);
      setAutoRateTriggered(false);
      setAutoRateCountdown(5);
    } else {
      setAutoRateCountdown(null);
    }
  };

  const handleCompleteServiceNow = () => {
    setIsAutoPlaying(false);
    setActiveStep(4);
    setServiceCompleted(true);
    setAutoRateTriggered(false);
    setAutoRateCountdown(5);
  };

  const handleStartAutoPlay = () => {
    if (isAutoPlaying) {
      setIsAutoPlaying(false);
      return;
    }
    setServiceCompleted(false);
    setAutoRateCountdown(null);
    setAutoRateTriggered(false);
    setActiveStep(1);
    setIsAutoPlaying(true);
  };

  const toggleReviewTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const composedReviewText = (() => {
    const starPrefix =
      selectedStars === 5
        ? "5/5 Sterne für Herrn Hannachi in Osnabrück!"
        : `${selectedStars}/5 Sterne – Hannachi Elektrohaushaltsgeräte Service.`;
    const tagSentence =
      selectedTags.length > 0 ? ` Besonders positiv: ${selectedTags.join(", ")}.` : "";
    const customPart = customReviewNote.trim() ? ` ${customReviewNote.trim()}` : "";
    return `${starPrefix}${tagSentence}${customPart} Klare Weiterempfehlung!`;
  })();

  const handleCopyAndRate = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(composedReviewText).catch(() => {});
      setCopiedReview(true);
      setTimeout(() => setCopiedReview(false), 3000);
    }
    setAutoRateCountdown(null);
    setAutoRateTriggered(true);
  };

  const currentStepData = JOURNEY_STEPS.find((s) => s.id === activeStep) || JOURNEY_STEPS[0];
  const CurrentIcon = currentStepData.icon;
  const progressPercent = ((activeStep - 1) / (JOURNEY_STEPS.length - 1)) * 100;

  return (
    <section
      id="reparatur-ablauf"
      className="section relative overflow-hidden bg-surface border-y border-primary/8 dark:border-white/10"
      aria-labelledby="repair-journey-heading"
    >
      {/* Subtle engineering grid background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle, #0ea5e9 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="container-page relative z-10">
        <FadeUp>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10 sm:mb-14">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-accent mb-2.5">
                <Sparkles size={14} />
                <span>Transparenter Reparaturablauf · Schritt für Schritt</span>
              </div>
              <h2
                id="repair-journey-heading"
                className="text-3xl font-extrabold leading-[1.1] text-primary dark:text-slate-100 sm:text-4xl lg:text-[44px]"
              >
                Ihr Reparaturablauf in 4 klaren Schritten
              </h2>
              <p className="mt-3.5 text-base sm:text-lg text-ink-muted leading-relaxed">
                Von der unverbindlichen Anfrage über die ehrliche Diagnose bis zur fertigen Reparatur
                und der anschließenden Google-Maps-Bewertung – Sie wissen zu jedem Zeitpunkt genau,
                was passiert.
              </p>
            </div>

            {/* Interactive Controls: Auto-Play Journey or Jump to Service Done Rating */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 w-full lg:w-auto shrink-0">
              <button
                type="button"
                onClick={handleStartAutoPlay}
                className={`inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all text-center sm:whitespace-nowrap cursor-pointer ${
                  isAutoPlaying
                    ? "border-accent bg-accent text-white shadow-sm"
                    : "border-primary/15 dark:border-white/15 bg-white dark:bg-slate-900 text-primary dark:text-slate-100 hover:border-accent hover:text-accent"
                }`}
              >
                {isAutoPlaying ? (
                  <>
                    <Pause size={14} className="shrink-0" />
                    <span>Ablauf-Simulation läuft…</span>
                  </>
                ) : (
                  <>
                    <Play size={14} className="text-accent shrink-0" />
                    <span>Ablauf simulieren</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCompleteServiceNow}
                className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all text-center sm:whitespace-nowrap cursor-pointer"
              >
                <Star size={14} className="fill-amber-300 text-amber-300 shrink-0" />
                <span>Service erledigt? Direkt bewerten</span>
              </button>
            </div>
          </div>
        </FadeUp>

        {/* ═════════════════════════════════════════════════════════════
            4-STEP INTERACTIVE TIMELINE TRACK (Desktop Horizontal + Mobile Grid)
        ═════════════════════════════════════════════════════════════ */}
        <div className="relative mb-8 sm:mb-10">
          {/* Desktop Horizontal Progress Track Line */}
          <div
            aria-hidden
            className="hidden lg:block absolute top-11 left-[10%] right-[10%] h-1.5 rounded-full bg-primary/10 dark:bg-white/10 overflow-hidden"
          >
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 via-violet-500 to-emerald-500"
              initial={{ width: "0%" }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>

          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 relative z-10">
            {JOURNEY_STEPS.map((stepItem) => {
              const Icon = stepItem.icon;
              const isCurrent = activeStep === stepItem.id;
              const isCompleted = activeStep > stepItem.id || (stepItem.id === 4 && serviceCompleted);

              return (
                <button
                  key={stepItem.id}
                  type="button"
                  onClick={() => handleSelectStep(stepItem.id)}
                  aria-current={isCurrent ? "step" : undefined}
                  className={`group relative flex flex-col justify-between rounded-2xl border p-3.5 sm:p-5 text-left transition-all duration-200 cursor-pointer min-w-0 ${
                    isCurrent
                      ? "border-accent bg-white dark:bg-slate-900 shadow-lg ring-2 ring-accent/20 -translate-y-0.5"
                      : isCompleted
                      ? "border-emerald-500/35 bg-white/90 dark:bg-slate-900/90 hover:border-emerald-500/60"
                      : "border-primary/10 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 hover:border-primary/25 dark:hover:border-white/25 hover:bg-white dark:hover:bg-slate-900"
                  }`}
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div
                        className={`relative flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl transition-all ${
                          isCurrent
                            ? `bg-gradient-to-br ${stepItem.color} text-white shadow-md`
                            : isCompleted
                            ? "bg-emerald-500 text-white"
                            : "bg-primary/8 dark:bg-white/10 text-ink-muted group-hover:text-primary dark:group-hover:text-white"
                        }`}
                      >
                        {isCompleted && !isCurrent ? (
                          <Check size={19} />
                        ) : (
                          <Icon size={19} />
                        )}
                        <span
                          className={`absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-extrabold tabular-nums shadow-xs ${
                            isCurrent
                              ? "bg-primary-dark text-white border border-white/20"
                              : isCompleted
                              ? "bg-emerald-700 text-white"
                              : "bg-surface-muted dark:bg-slate-800 text-ink-muted"
                          }`}
                        >
                          {stepItem.id}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          isCurrent
                            ? "bg-accent/12 text-accent dark:text-accent-light"
                            : isCompleted
                            ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
                            : "bg-primary/5 dark:bg-white/5 text-ink-faint"
                        }`}
                      >
                        {stepItem.stageEn}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-extrabold text-primary dark:text-slate-100 leading-snug">
                      {stepItem.title}
                    </h3>
                    <p className="mt-1 text-xs text-ink-muted line-clamp-2 leading-relaxed">
                      {stepItem.subtitle}
                    </p>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-primary/8 dark:border-white/10 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[11px]">
                    <span className="font-semibold text-ink-muted truncate min-w-0">
                      {stepItem.durationBadge}
                    </span>
                    <span
                      className={`font-extrabold shrink-0 ${
                        isCurrent
                          ? "text-accent"
                          : isCompleted
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-ink-faint group-hover:text-primary dark:group-hover:text-slate-200"
                      }`}
                    >
                      {isCurrent ? "Aktiv ●" : isCompleted ? "Erledigt ✓" : "Details →"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════
            ACTIVE STEP SPOTLIGHT DETAIL PANEL + AUTOMATIC GOOGLE MAPS REVIEW
        ═════════════════════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStepData.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl sm:rounded-3xl border border-primary/12 dark:border-white/12 bg-white dark:bg-slate-900 p-4 sm:p-8 lg:p-10 shadow-card"
          >
            <div className="grid gap-6 sm:gap-8 lg:grid-cols-12 lg:items-center">
              {/* Left Column: Step Details & Expectation Management */}
              <div className="min-w-0 lg:col-span-7 space-y-5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r ${currentStepData.color} px-3 py-1 text-xs font-extrabold text-white shadow-xs`}
                  >
                    Schritt {currentStepData.id} von 4 · {currentStepData.stageEn}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-primary/10 dark:border-white/10 bg-surface px-3 py-1 text-xs font-bold text-primary dark:text-slate-200">
                    <Clock size={13} className="text-accent" />
                    {currentStepData.durationBadge}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    <ShieldCheck size={13} />
                    {currentStepData.assuranceBadge}
                  </span>
                </div>

                <div className="flex items-start gap-4">
                  <div
                    className={`hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${currentStepData.bgGlow} text-accent`}
                  >
                    <CurrentIcon size={26} />
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-primary dark:text-slate-100">
                      {currentStepData.title}
                    </h3>
                    <p className="mt-2 text-sm sm:text-base leading-relaxed text-ink-muted">
                      {currentStepData.description}
                    </p>
                  </div>
                </div>

                {/* Two-Column Expectation Cards: Was Sie tun vs. Was Herr Hannachi tut */}
                <div className="grid gap-3.5 sm:grid-cols-2 pt-1">
                  <div className="rounded-2xl border border-primary/8 dark:border-white/10 bg-surface p-4">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-accent">
                      Ihr Beitrag als Kunde
                    </p>
                    <p className="mt-1.5 text-xs sm:text-[13px] leading-relaxed text-primary dark:text-slate-200 font-medium">
                      {currentStepData.customerAction}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-primary/8 dark:border-white/10 bg-surface p-4">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Unser Serviceversprechen
                    </p>
                    <p className="mt-1.5 text-xs sm:text-[13px] leading-relaxed text-primary dark:text-slate-200 font-medium">
                      {currentStepData.technicianAction}
                    </p>
                  </div>
                </div>

                {/* Step Navigation Buttons */}
                <div className="pt-3 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 border-t border-primary/8 dark:border-white/10">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    {activeStep > 1 && (
                      <button
                        type="button"
                        onClick={() => handleSelectStep((activeStep - 1) as 1 | 2 | 3 | 4)}
                        className="min-h-[42px] w-full sm:w-auto rounded-xl border border-primary/15 dark:border-white/15 px-3.5 py-2 text-center text-xs font-bold text-primary dark:text-slate-100 hover:border-accent hover:text-accent transition-colors cursor-pointer"
                      >
                        ← Vorheriger Schritt
                      </button>
                    )}
                    {activeStep < 4 ? (
                      <button
                        type="button"
                        onClick={() => handleSelectStep((activeStep + 1) as 1 | 2 | 3 | 4)}
                        className="inline-flex min-h-[42px] w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl bg-primary dark:bg-accent px-4 py-2 text-center text-xs font-bold text-white hover:bg-accent dark:hover:bg-accent-dark transition-colors cursor-pointer"
                      >
                        <span>Nächster Schritt: {JOURNEY_STEPS[activeStep].title}</span>
                        <ArrowRight size={14} className="shrink-0" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSelectStep(1)}
                        className="inline-flex min-h-[42px] w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border border-primary/15 dark:border-white/15 px-3.5 py-2 text-xs font-bold text-ink-muted hover:text-primary dark:hover:text-slate-100 transition-colors cursor-pointer"
                      >
                        <RotateCcw size={13} className="shrink-0" />
                        <span>Zurück zu Schritt 1</span>
                      </button>
                    )}
                  </div>

                  {onStartRequest && activeStep < 4 && (
                    <button
                      type="button"
                      onClick={onStartRequest}
                      className="inline-flex min-h-[40px] w-full sm:w-auto items-center justify-center sm:justify-start gap-1.5 text-xs font-extrabold text-accent hover:underline cursor-pointer"
                    >
                      <span>Jetzt Schritt 1 starten (Anfrage stellen)</span>
                      <ArrowRight size={14} className="shrink-0" />
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: Deliverables Checklist OR Automatic Google Maps Review Engine on Step 4 */}
              <div className="min-w-0 lg:col-span-5">
                {activeStep < 4 ? (
                  <div className="rounded-2xl border border-primary/10 dark:border-white/10 bg-surface p-4 sm:p-6 space-y-4 sm:space-y-5">
                    <div className="flex items-center justify-between gap-2 pb-3 sm:pb-3.5 border-b border-primary/8 dark:border-white/10">
                      <div className="min-w-0">
                        <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-accent">
                          Ergebnis in Schritt {currentStepData.id}
                        </p>
                        <h4 className="text-sm sm:text-base font-extrabold text-primary dark:text-slate-100 mt-0.5">
                          Darauf können Sie sich verlassen
                        </h4>
                      </div>
                      <span className="font-mono text-xl sm:text-2xl font-black text-primary/15 dark:text-white/15 tabular-nums shrink-0">
                        {currentStepData.code}/04
                      </span>
                    </div>

                    <ul className="space-y-2.5 sm:space-y-3">
                      {currentStepData.deliverables.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2.5 rounded-xl bg-white dark:bg-slate-900 p-3 border border-primary/6 dark:border-white/8 text-xs sm:text-[13px] font-semibold text-primary dark:text-slate-100 leading-snug"
                        >
                          <CheckCircle2
                            size={16}
                            className="text-emerald-500 shrink-0 mt-0.5"
                          />
                          <span className="min-w-0 break-words">{item}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Preview Teaser for Step 4 Auto-Google-Maps Rating */}
                    <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white font-bold">
                          <Star size={16} className="fill-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-primary dark:text-slate-100 leading-snug">
                            Nach Abschluss: Google-Maps-Bewertung
                          </p>
                          <p className="text-[11px] text-ink-muted leading-snug">
                            Automatische 5,0 ★ Bewertungsweiterleitung
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCompleteServiceNow}
                        className="w-full sm:w-auto shrink-0 rounded-lg bg-white dark:bg-slate-900 px-3 py-2 sm:py-1.5 text-center text-xs sm:text-[11px] font-extrabold text-accent border border-primary/10 dark:border-white/10 hover:border-accent transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Vorschau →
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ═════════════════════════════════════════════════════════════
                     STEP 4 COMPLETION: AUTOMATIC GOOGLE MAPS RATING CARD
                  ═════════════════════════════════════════════════════════════ */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-b from-emerald-500/[0.08] via-white to-white dark:from-emerald-500/[0.14] dark:via-slate-900 dark:to-slate-900 p-4 sm:p-6 shadow-xl"
                  >
                    {/* Top Auto-Triggered Status Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 mb-4 border-b border-primary/10 dark:border-white/10">
                      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                        <span>Service abgeschlossen · Google Maps Bewertung</span>
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-400/20 px-2 py-0.5 text-[11px] font-extrabold text-amber-700 dark:text-amber-300 tabular-nums shrink-0">
                        5,0 ★ Schnitt
                      </span>
                    </div>

                    {/* Automatic Countdown Notice when Service finishes */}
                    {autoRateCountdown !== null && (
                      <div className="mb-4 rounded-xl border border-accent/30 bg-accent/10 p-3 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-primary dark:text-slate-100">
                            Google Maps Bewertung bereit in {autoRateCountdown} Sek.…
                          </span>
                          <button
                            type="button"
                            onClick={() => setAutoRateCountdown(null)}
                            className="text-[11px] font-semibold text-ink-muted hover:text-primary dark:hover:text-white underline"
                          >
                            Timer stoppen
                          </button>
                        </div>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-primary/10 dark:bg-white/10 overflow-hidden">
                          <motion.div
                            className="h-full bg-accent"
                            initial={{ width: "100%" }}
                            animate={{ width: `${(autoRateCountdown / 5) * 100}%` }}
                            transition={{ duration: 0.9, ease: "linear" }}
                          />
                        </div>
                      </div>
                    )}

                    {autoRateTriggered && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 rounded-xl border border-emerald-500/35 bg-emerald-500/15 p-3 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex flex-wrap items-center justify-between gap-2"
                      >
                        <span className="flex items-center gap-1.5 min-w-0">
                          <ThumbsUp size={14} className="shrink-0" />
                          <span>Ihre {selectedStars}-Sterne-Bewertung ist bereit für Google Maps!</span>
                        </span>
                        <a
                          href={business.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline font-extrabold shrink-0"
                        >
                          Jetzt öffnen →
                        </a>
                      </motion.div>
                    )}

                    {/* Interactive 5-Star Picker */}
                    <div className="text-center bg-surface dark:bg-slate-800/70 rounded-xl p-3.5 border border-primary/8 dark:border-white/10">
                      <p className="text-xs font-bold text-primary dark:text-slate-100">
                        Wie zufrieden waren Sie mit Herrn Hannachi?
                      </p>
                      <div
                        className="mt-2 flex items-center justify-center gap-1.5"
                        role="radiogroup"
                        aria-label="Sterne-Bewertung auswählen"
                      >
                        {[1, 2, 3, 4, 5].map((star) => {
                          const active = (hoveredStars ?? selectedStars) >= star;
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setSelectedStars(star)}
                              onMouseEnter={() => setHoveredStars(star)}
                              onMouseLeave={() => setHoveredStars(null)}
                              aria-label={`${star} von 5 Sternen`}
                              className="p-1 transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                            >
                              <Star
                                size={28}
                                className={`transition-colors ${
                                  active
                                    ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                                    : "text-primary/20 dark:text-white/20"
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        {selectedStars === 5
                          ? "5,0 ★ – Erstklassiger Service! Vielen Dank!"
                          : `${selectedStars},0 ★ ausgewählt`}
                      </p>
                    </div>

                    {/* 1-Tap Review Highlight Chips */}
                    <div className="mt-4">
                      <p className="text-[11px] font-bold text-ink-muted mb-2">
                        Was hat Ihnen besonders gefallen? (1-Klick-Vorlage für Google Maps):
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_REVIEW_TAGS.map((tag) => {
                          const isSelected = selectedTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleReviewTag(tag)}
                              className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all ${
                                isSelected
                                  ? "border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 font-bold"
                                  : "border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-800 text-ink-muted hover:text-primary dark:hover:text-white"
                              }`}
                            >
                              {isSelected ? "✓ " : "+ "}
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Optional short custom note + Live Review Text Preview */}
                    <div className="mt-3">
                      <input
                        type="text"
                        value={customReviewNote}
                        onChange={(e) => setCustomReviewNote(e.target.value)}
                        placeholder="Optional: Gerät oder eigene Anmerkung ergänzen (z. B. Miele Waschmaschine)…"
                        className="w-full rounded-xl border border-primary/12 dark:border-white/15 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-primary dark:text-slate-100 placeholder:text-ink-faint focus:border-accent focus:outline-none"
                      />
                      <div className="mt-2 rounded-xl bg-surface dark:bg-slate-800/60 p-2.5 border border-primary/8 dark:border-white/8 text-[11px] text-ink-muted italic">
                        „{composedReviewText}“
                      </div>
                    </div>

                    {/* Primary Google Maps Rate CTA + Copy Helper */}
                    <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <a
                        href={business.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleCopyAndRate}
                        className="flex-1 inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 sm:px-4 py-3 text-center text-xs sm:text-sm font-extrabold leading-snug text-white shadow-md transition-all hover:-translate-y-0.5 sm:whitespace-nowrap"
                      >
                        <MapPin size={16} className="shrink-0" />
                        <span>Jetzt auf Google Maps bewerten ({selectedStars} ★)</span>
                        <ExternalLink size={14} className="shrink-0" />
                      </a>
                      <button
                        type="button"
                        onClick={handleCopyAndRate}
                        className="inline-flex min-h-[46px] w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border border-primary/15 dark:border-white/15 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-primary dark:text-slate-100 hover:border-accent hover:text-accent transition-colors sm:whitespace-nowrap cursor-pointer"
                        title="Bewertungstext in Zwischenablage kopieren"
                      >
                        {copiedReview ? (
                          <>
                            <Check size={14} className="text-emerald-500 shrink-0" />
                            <span>Kopiert!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={14} className="shrink-0" />
                            <span>Text kopieren</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="mt-2.5 text-[11px] text-ink-faint text-center">
                      Beim Klick wird Ihr Bewertungstext automatisch kopiert und das Google Maps Profil von{" "}
                      <strong className="text-primary dark:text-slate-200">
                        Hannachi ({business.street}, {business.city})
                      </strong>{" "}
                      geöffnet.
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
