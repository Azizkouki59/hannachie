"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  MessageCircle,
  SearchCheck,
  Home,
  Star,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowRight,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { business } from "@/data/site";
import { triggerHapticFeedback } from "@/lib/haptics";

type JourneyStep = {
  id: number;
  num: string;
  stageEn: string;
  title: string;
  subtitle: string;
  durationBadge: string;
  description: string;
  highlights: string[];
  accentColor: string;
  icon: typeof MessageCircle;
  ctaLabel: string;
  ctaHref: string;
};

const JOURNEY_STEPS: JourneyStep[] = [
  {
    id: 1,
    num: "01",
    stageEn: "Anfrage",
    title: "Anfrage übermitteln",
    subtitle: "Geräteproblem oder benötigtes Ersatzteil online / per WhatsApp schildern",
    durationBadge: "In ca. 60 Sekunden",
    description:
      "Sie beschreiben kurz das Problem an Ihrem Haushaltsgerät (z. B. Waschmaschine pumpt nicht ab, Geschirrspüler heizt nicht) oder nennen uns das benötigte Ersatzteil direkt über das Formular bzw. per WhatsApp.",
    highlights: [
      "Schnelle Auswahl von Gerätetyp, Marke & Problembeschreibung",
      "Für Vor-Ort-Termine, Ersatzteile oder Ersatzgerät-Angebote",
      "Direkt an Inhaber Kamal Hannachi, kein Callcenter",
    ],
    accentColor: "from-sky-500 to-accent",
    icon: MessageCircle,
    ctaLabel: "Anfrage jetzt starten",
    ctaHref: "#anfrage",
  },
  {
    id: 2,
    num: "02",
    stageEn: "Einschätzung",
    title: "Persönliche Ersteinschätzung",
    subtitle: "Direkte Rückmeldung & Vor-Ort-Terminabsprache durch Herrn Hannachi",
    durationBadge: "Rückmeldung zeitnah",
    description:
      "Herr Hannachi meldet sich persönlich bei Ihnen, gibt eine ehrliche Ersteinschätzung zum benötigten Ersatzteil und vereinbart mit Ihnen einen passenden Vor-Ort-Termin bei Ihnen zu Hause in Osnabrück & Umgebung.",
    highlights: [
      "Persönliche Ersteinschätzung durch Inhaber Kamal Hannachi",
      "Klärung passender Original-Ersatzteile nach Typenschild",
      "Abstimmung Ihres Wunschtermins direkt bei Ihnen vor Ort",
    ],
    accentColor: "from-amber-500 to-orange-500",
    icon: SearchCheck,
    ctaLabel: "Vor-Ort-Termin anfragen",
    ctaHref: "#anfrage",
  },
  {
    id: 3,
    num: "03",
    stageEn: "Vor-Ort-Termin",
    title: "Vor-Ort-Termin & Lösung",
    subtitle: "Termin bei Ihnen zu Hause in Osnabrück: Ersatzteil-Lösung oder Austausch-Angebot",
    durationBadge: "Direkt bei Ihnen vor Ort",
    description:
      "Herr Hannachi kommt zum vereinbarten Termin zu Ihnen nach Hause: Wir kümmern uns um die passende Ersatzteil-Lösung oder bieten Ihnen – falls Ihr Altgerät nicht mehr zu retten ist – ein geprüftes Ersatzgerät mit schriftlicher Verkäufergarantie an.",
    highlights: [
      "Mobiler Vor-Ort-Besuch direkt bei Ihnen zu Hause",
      "Passende Ersatzteile für alle gängigen Hausgeräte-Marken",
      "Geprüftes Ersatzgerät mit Garantie, falls das Altgerät unrentabel ist",
    ],
    accentColor: "from-emerald-500 to-teal-500",
    icon: Home,
    ctaLabel: "Termin vereinbaren",
    ctaHref: "#anfrage",
  },
  {
    id: 4,
    num: "04",
    stageEn: "Abschluss",
    title: "Abschluss & Google-Bewertung",
    subtitle: "Gemeinsamer Funktionstest, schriftlicher Garantiebeleg & Bewertung",
    durationBadge: "4,8 ★ bei 82 Rezensionen",
    description:
      "Gemeinsamer Funktionstest bei Ihnen vor Ort. Beim Kauf eines Ersatzgeräts erhalten Sie unsere schriftliche Verkäufergarantie inklusive vollem Garantie- und Reparaturservice durch uns.",
    highlights: [
      "Schriftliche Verkäufergarantie auf jedes gekaufte Ersatzgerät",
      "Voller Garantie- & Reparaturservice für von uns verkaufte Geräte",
      "Über 82 verifizierte Google-Bewertungen aus Osnabrück",
    ],
    accentColor: "from-amber-400 to-yellow-500",
    icon: Star,
    ctaLabel: "82 Google-Bewertungen ansehen",
    ctaHref: "#google-reviews",
  },
];

export default function RepairJourneyTimeline({
  onSelectStepAction,
}: {
  onSelectStepAction?: (stepId: number) => void;
}) {
  const [activeStep, setActiveStep] = useState<number>(1);
  const carouselRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<number, HTMLElement | null>>({});

  const selectAndScrollToStep = (stepId: number) => {
    triggerHapticFeedback(35);
    setActiveStep(stepId);
    const cardEl = cardRefs.current[stepId];
    if (cardEl && carouselRef.current && window.innerWidth < 768) {
      cardEl.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  };

  const handleMobileCarouselScroll = () => {
    const container = carouselRef.current;
    if (!container || window.innerWidth >= 768) return;
    const center = container.scrollLeft + container.clientWidth / 2;
    let closestStep = activeStep;
    let minDelta = Number.POSITIVE_INFINITY;

    for (const s of JOURNEY_STEPS) {
      const el = cardRefs.current[s.id];
      if (!el) continue;
      const elCenter = el.offsetLeft + el.offsetWidth / 2;
      const delta = Math.abs(center - elCenter);
      if (delta < minDelta) {
        minDelta = delta;
        closestStep = s.id;
      }
    }
    if (closestStep !== activeStep) {
      setActiveStep(closestStep);
    }
  };

  return (
    <section
      id="ablauf"
      aria-labelledby="journey-timeline-heading"
      className="relative overflow-hidden bg-slate-950 py-10 sm:py-14 lg:py-16 text-white border-y border-white/10"
    >
      {/* Subtle Ambient Glows */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/4 h-80 w-80 rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute -bottom-32 right-1/4 h-80 w-80 rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      <div className="container-page relative z-10">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-5 mb-5 sm:mb-8">
          <div className="max-w-2xl">
            <div className="inline-flex flex-wrap items-center gap-2 text-xs font-semibold text-accent-light">
              <span>Mobiler Vor-Ort-Ablauf</span>
              <span aria-hidden="true">·</span>
              <span>Osnabrück &amp; Umgebung</span>
            </div>
            <h2
              id="journey-timeline-heading"
              className="mt-1.5 text-2xl sm:text-3xl lg:text-[34px] font-extrabold tracking-tight text-white leading-tight text-balance"
            >
              In 4 Schritten zur Lösung direkt bei Ihnen zu Hause
            </h2>
            <p className="mt-2 text-xs sm:text-sm lg:text-[15px] text-white/75 leading-relaxed">
              Von Ihrer{" "}
              <strong className="text-white font-semibold">Anfrage</strong> über die persönliche{" "}
              <strong className="text-white font-semibold">Ersteinschätzung</strong> bis zum{" "}
              <strong className="text-white font-semibold">Vor-Ort-Termin bei Ihnen zu Hause</strong> und dem{" "}
              <strong className="text-white font-semibold">Abschluss mit schriftlicher Garantie</strong>.
            </p>
          </div>

          {/* Interactive Step Selector (Horizontally scrollable on narrow phones) */}
          <div
            role="tablist"
            aria-label="Ablaufschritte auswählen"
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 self-start lg:self-auto"
          >
            {JOURNEY_STEPS.map((s) => {
              const isSelected = activeStep === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => selectAndScrollToStep(s.id)}
                  className={`inline-flex min-h-[44px] sm:min-h-[40px] shrink-0 items-center gap-1.5 rounded-xl px-3.5 sm:px-3 py-2 sm:py-1.5 text-xs font-extrabold transition-all active:scale-95 cursor-pointer ${
                    isSelected
                      ? "bg-accent text-white shadow-sm"
                      : "text-white/65 hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  <span className="font-mono opacity-80">{s.num}</span>
                  <span>{s.stageEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress Bar + Mobile Swipe Indicator */}
        <div>
          <div className="mb-4 sm:mb-5 px-0.5 sm:px-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-white/55 mb-1.5 md:hidden">
              <span>Schritt {activeStep} von 4</span>
              <span>Wischen zum Blättern →</span>
            </div>
            <div className="relative h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-accent via-amber-400 to-emerald-400 origin-left rounded-full"
                initial={{ scaleX: 0.25 }}
                animate={{ scaleX: activeStep / 4 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>

          {/* Mobile Horizontal Scroll-Snap Carousel / Tablet & Desktop 4-Step Grid */}
          <div
            ref={carouselRef}
            onScroll={handleMobileCarouselScroll}
            className="flex md:grid overflow-x-auto md:overflow-visible snap-x snap-mandatory no-scrollbar -mx-4 px-4 pb-2 md:mx-0 md:px-0 md:pb-0 gap-3.5 sm:gap-5 md:grid-cols-2 lg:grid-cols-4"
          >
            {JOURNEY_STEPS.map((stepItem) => {
              const Icon = stepItem.icon;
              const isActive = activeStep === stepItem.id;
              const isPassed = stepItem.id <= activeStep;

              return (
                <motion.article
                  key={stepItem.id}
                  ref={(el) => {
                    cardRefs.current[stepItem.id] = el;
                  }}
                  onClick={() => selectAndScrollToStep(stepItem.id)}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2 }}
                  className={`snap-center shrink-0 w-[86vw] max-w-[350px] md:w-auto md:max-w-none group relative flex flex-col justify-between rounded-2xl border p-4 sm:p-5 transition-all cursor-pointer ${
                    isActive
                      ? "border-accent bg-slate-900 shadow-[0_18px_45px_-15px_rgba(14,165,233,0.3)] ring-1 ring-accent/40"
                      : isPassed
                      ? "border-white/15 bg-slate-900/95 hover:border-white/25"
                      : "border-white/10 bg-slate-900/90 hover:border-white/20"
                  }`}
                >
                  {/* Top Bar Accent */}
                  <div
                    className={`absolute top-0 inset-x-5 h-0.5 rounded-b-full bg-gradient-to-r ${
                      stepItem.accentColor
                    } transition-opacity ${
                      isActive ? "opacity-100" : "opacity-35 group-hover:opacity-80"
                    }`}
                  />

                  <div>
                    {/* Step Node & Metadata */}
                    <div className="flex items-start justify-between gap-2.5 mb-3.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border font-extrabold transition-all ${
                            isActive
                              ? "border-accent bg-accent text-white shadow-md shadow-accent/30"
                              : isPassed
                              ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                              : "border-white/15 bg-slate-950 text-white/75"
                          }`}
                        >
                          <Icon size={18} aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <span className="block font-mono text-[11px] font-extrabold tracking-wider text-accent-light tabular-nums">
                            {stepItem.num}. {stepItem.stageEn}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-white/65 truncate">
                            <Clock size={11} className="shrink-0 text-white/50" aria-hidden="true" />
                            <span className="truncate">{stepItem.durationBadge}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Title & Subtitle */}
                    <h3 className="text-lg sm:text-xl font-extrabold text-white leading-snug">
                      {stepItem.title}
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-accent-light">
                      {stepItem.subtitle}
                    </p>

                    {/* Description */}
                    <p className="mt-3 text-xs sm:text-[13px] leading-relaxed text-white/75">
                      {stepItem.description}
                    </p>

                    {/* Bullet Checkmarks */}
                    <ul className="mt-4 space-y-1.5 border-t border-white/10 pt-3.5">
                      {stepItem.highlights.map((pt) => (
                        <li
                          key={pt}
                          className="flex items-start gap-2 text-xs text-white/85"
                        >
                          <CheckCircle2
                            size={14}
                            className="mt-0.5 shrink-0 text-emerald-400"
                            aria-hidden="true"
                          />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Footer Link */}
                  <div className="mt-5 pt-3.5 border-t border-white/10">
                    <a
                      href={stepItem.ctaHref}
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHapticFeedback(35);
                        if (onSelectStepAction) {
                          onSelectStepAction(stepItem.id);
                        }
                      }}
                      className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-extrabold text-accent-light hover:text-white transition-colors"
                    >
                      <span>{stepItem.ctaLabel}</span>
                      <ArrowRight
                        size={13}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </a>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>

        {/* Bottom Summary Strip with Mobile-Only Clarification */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 sm:px-6 py-4 text-xs text-white/75">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="inline-flex items-center gap-1.5 font-semibold text-white">
              <MapPin size={14} className="text-accent-light shrink-0" />
              <span>{business.mobileServiceNotice}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
              <span>{business.nonMeisterNotice}</span>
            </span>
          </div>
          <div className="grid grid-cols-2 sm:flex items-center gap-2.5 shrink-0">
            <a
              href={business.phoneHref}
              onClick={() => triggerHapticFeedback(50)}
              className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 font-bold text-white hover:bg-white/10 active:scale-[0.98] transition-all"
            >
              <Phone size={13} className="text-accent-light shrink-0" />
              <span className="truncate">{business.phoneDisplay}</span>
            </a>
            <a
              href="#anfrage"
              onClick={() => triggerHapticFeedback(40)}
              className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2 font-extrabold text-white hover:bg-accent-dark active:scale-[0.98] transition-all whitespace-nowrap"
            >
              <span>Anfrage starten</span>
              <ArrowRight size={13} className="shrink-0" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
