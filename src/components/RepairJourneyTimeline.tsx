"use client";

import React, { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { business } from "@/data/site";
import { useGoogleLivePlace } from "@/lib/googlePlaceLive";
import { hapticTap, hapticTick, triggerHapticFeedback } from "@/lib/haptics";
import { useMediaQuery } from "@/lib/useMediaQuery";

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

function buildJourneySteps(ratingFormatted: string, reviewCount: number): JourneyStep[] {
  return [
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
      stageEn: "Vor-Ort",
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
      durationBadge: `${ratingFormatted} ★ bei ${reviewCount} Rezensionen`,
      description:
        "Gemeinsamer Funktionstest bei Ihnen vor Ort. Beim Kauf eines Ersatzgeräts erhalten Sie unsere schriftliche Verkäufergarantie inklusive vollem Garantie- und Reparaturservice durch uns.",
      highlights: [
        "Schriftliche Verkäufergarantie auf jedes gekaufte Ersatzgerät",
        "Voller Garantie- & Reparaturservice für von uns verkaufte Geräte",
        `${reviewCount} verifizierte Google-Bewertungen aus Osnabrück`,
      ],
      accentColor: "from-indigo-500 to-sky-500",
      icon: Star,
      ctaLabel: `${reviewCount} Google-Bewertungen ansehen`,
      ctaHref: "#kundenstimmen",
    },
  ];
}

export default function RepairJourneyTimeline({
  onSelectStepAction,
}: {
  onSelectStepAction?: (stepId: number) => void;
}) {
  const { place, ratingFormatted } = useGoogleLivePlace();
  const journeySteps = buildJourneySteps(ratingFormatted, place.userRatingCount);
  const [activeStep, setActiveStep] = useState<number>(1);
  const prefersReducedMotion = useReducedMotion();
  const isMdUp = useMediaQuery("(min-width: 768px)", false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<number, HTMLElement | null>>({});
  const programmaticScrollLockUntilRef = useRef<number>(0);

  const selectAndScrollToStep = (stepId: number) => {
    hapticTap();
    setActiveStep(stepId);
    const container = carouselRef.current;
    const cardEl = cardRefs.current[stepId];
    if (cardEl && container && window.innerWidth < 768) {
      programmaticScrollLockUntilRef.current = Date.now() + 550;
      const containerRect = container.getBoundingClientRect();
      const cardRect = cardEl.getBoundingClientRect();
      const targetLeft =
        container.scrollLeft +
        (cardRect.left - containerRect.left) -
        (containerRect.width - cardRect.width) / 2;

      container.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    }
  };

  const handleMobileCarouselScroll = () => {
    const container = carouselRef.current;
    if (!container || window.innerWidth >= 768) return;
    if (Date.now() < programmaticScrollLockUntilRef.current) return;

    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;
    let closestStep = activeStep;
    let minDelta = Number.POSITIVE_INFINITY;

    for (const s of journeySteps) {
      const el = cardRefs.current[s.id];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const elCenter = rect.left + rect.width / 2;
      const delta = Math.abs(containerCenter - elCenter);
      if (delta < minDelta) {
        minDelta = delta;
        closestStep = s.id;
      }
    }

    if (closestStep !== activeStep) {
      hapticTick();
      setActiveStep(closestStep);
    }
  };

  return (
    <section
      id="ablauf"
      aria-labelledby="journey-timeline-heading"
      className="relative overflow-hidden bg-slate-950 py-10 sm:py-16 lg:py-20 text-white border-y border-white/10"
    >
      {/* Ambient Background Glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-accent/10 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 right-1/4 h-80 w-80 rounded-full bg-emerald-500/10 blur-[120px]"
      />

      <div className="container-page relative z-10 min-w-0">
        {/* Section Header + Responsive 4-Step Tab Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6 mb-4 sm:mb-8 min-w-0">
          <div className="max-w-2xl min-w-0">
            <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-accent-light">
              <span>Mobiler Vor-Ort-Ablauf</span>
              <span aria-hidden="true" className="text-white/30">·</span>
              <span className="text-white/70">Osnabrück &amp; Umgebung</span>
            </div>
            <h2
              id="journey-timeline-heading"
              className="mt-1.5 text-xl min-[375px]:text-2xl sm:text-3xl lg:text-[34px] font-extrabold tracking-tight text-white leading-tight text-balance"
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

          {/* Interactive Step Selector (Fits 100% Inside Phone Width: 2x2 on <460px, 4x1 on >=460px) */}
          <div
            role="tablist"
            aria-label="Ablaufschritte auswählen"
            className="grid grid-cols-2 min-[460px]:grid-cols-4 lg:inline-flex items-stretch gap-1 sm:gap-1.5 w-full lg:w-auto rounded-2xl border border-white/10 bg-white/[0.04] p-1 sm:p-1.5"
          >
            {journeySteps.map((s) => {
              const isSelected = activeStep === s.id;
              return (
                <motion.button
                  key={s.id}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 520, damping: 26 }}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => selectAndScrollToStep(s.id)}
                  className={`relative inline-flex min-h-[44px] sm:min-h-[40px] min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 sm:px-3 py-1.5 text-[11.5px] sm:text-xs font-extrabold transition-colors cursor-pointer ${
                    isSelected
                      ? "text-white"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="journey-active-tab-pill"
                      transition={
                        prefersReducedMotion
                          ? { duration: 0.1 }
                          : { type: "spring", stiffness: 420, damping: 32 }
                      }
                      aria-hidden="true"
                      className="absolute inset-0 rounded-xl bg-accent shadow-sm shadow-accent/30"
                    />
                  )}
                  <span className="relative z-10 font-mono opacity-85 shrink-0">{s.num}</span>
                  <span className="relative z-10 truncate">{s.stageEn}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Progress Bar + Fluid Mobile Side-Slide Carousel / Desktop Grid */}
        <div className="min-w-0">
          <div className="mb-3 sm:mb-6 min-w-0">
            <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-white/65 mb-1.5 md:hidden">
              <span className="tabular-nums">Schritt {activeStep} von 4</span>
              <span>Wischen oder tippen ↔</span>
            </div>
            <div className="relative h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-accent via-amber-400 to-emerald-400 origin-left rounded-full"
                initial={{ scaleX: 0.25 }}
                animate={{ scaleX: activeStep / 4 }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0.1 }
                    : { type: "spring", stiffness: 320, damping: 32 }
                }
              />
            </div>
          </div>

          {/* Mobile Side-Slide Snap Track (Auto-Centered at Every Phone Width) / Tablet & Desktop Grid */}
          <div
            ref={carouselRef}
            onScroll={handleMobileCarouselScroll}
            className="relative flex md:grid overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none no-scrollbar touch-pan-x overscroll-x-contain -mx-4 px-[6.5%] sm:-mx-6 sm:px-[14%] pb-3 md:mx-0 md:px-0 md:pb-0 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-5 items-stretch"
          >
            {journeySteps.map((stepItem) => {
              const Icon = stepItem.icon;
              const isActive = activeStep === stepItem.id;
              const isPassed = stepItem.id <= activeStep;

              return (
                <motion.article
                  key={stepItem.id}
                  ref={(el) => {
                    cardRefs.current[stepItem.id] = el;
                  }}
                  onClick={() => {
                    if (!isActive || window.innerWidth < 768) {
                      selectAndScrollToStep(stepItem.id);
                    }
                  }}
                  animate={
                    prefersReducedMotion
                      ? undefined
                      : {
                          scale: isMdUp || isActive ? 1 : 0.96,
                          opacity: isMdUp || isActive ? 1 : 0.72,
                        }
                  }
                  transition={{ type: "spring", stiffness: 360, damping: 28 }}
                  className={`snap-center shrink-0 w-[87%] sm:w-[72%] md:w-auto min-w-0 group relative flex flex-col justify-between rounded-2xl border p-4 sm:p-5 transition-colors duration-200 cursor-pointer md:hover:-translate-y-1 ${
                    isActive
                      ? "border-accent bg-slate-900 ring-1 ring-accent/45 shadow-[0_18px_42px_-14px_rgba(14,165,233,0.34)]"
                      : isPassed
                      ? "border-white/20 bg-slate-900/75 hover:border-white/35"
                      : "border-white/10 bg-slate-900/55 hover:border-white/25"
                  }`}
                >
                  {/* Top Bar Accent */}
                  <div
                    className={`absolute top-0 inset-x-4 h-1 rounded-b-full bg-gradient-to-r ${
                      stepItem.accentColor
                    } transition-opacity ${
                      isActive ? "opacity-100" : "opacity-30 group-hover:opacity-80"
                    }`}
                  />

                  <div className="min-w-0">
                    {/* Step Node & Metadata */}
                    <div className="flex items-start justify-between gap-2.5 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border font-extrabold transition-all ${
                            isActive
                              ? "border-accent bg-accent text-white shadow-md shadow-accent/30"
                              : isPassed
                              ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                              : "border-white/15 bg-white/5 text-white/80"
                          }`}
                        >
                          <Icon size={18} aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <span className="block font-mono text-[11px] font-extrabold tracking-wider text-accent-light tabular-nums">
                            {stepItem.num}. {stepItem.stageEn}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-white/60 max-w-full truncate">
                            <Clock size={11} className="shrink-0" aria-hidden="true" />
                            <span className="truncate">{stepItem.durationBadge}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Title & Subtitle */}
                    <h3 className="text-base min-[375px]:text-lg sm:text-xl font-extrabold text-white leading-snug">
                      {stepItem.title}
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-sky-300/90 leading-snug">
                      {stepItem.subtitle}
                    </p>

                    {/* Description */}
                    <p className="mt-2.5 sm:mt-3 text-xs sm:text-[13px] leading-relaxed text-white/75">
                      {stepItem.description}
                    </p>

                    {/* Bullet Checkmarks */}
                    <ul className="mt-3.5 sm:mt-4 space-y-1.5 border-t border-white/10 pt-3">
                      {stepItem.highlights.map((pt) => (
                        <li
                          key={pt}
                          className="flex items-start gap-2 text-xs text-white/85 min-w-0"
                        >
                          <CheckCircle2
                            size={14}
                            className="mt-0.5 shrink-0 text-emerald-400"
                            aria-hidden="true"
                          />
                          <span className="min-w-0">{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Footer Link */}
                  <div className="mt-4 sm:mt-5 pt-3 border-t border-white/10">
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
                        className="transition-transform group-hover:translate-x-1 shrink-0"
                      />
                    </a>
                  </div>
                </motion.article>
              );
            })}
          </div>

          {/* Mobile Pagination Dots & Quick Prev/Next Controls */}
          <div className="mt-2.5 flex md:hidden items-center justify-between gap-2 px-0.5">
            <motion.button
              type="button"
              whileTap={prefersReducedMotion ? undefined : { scale: 0.88 }}
              disabled={activeStep <= 1}
              onClick={() => selectAndScrollToStep(Math.max(1, activeStep - 1))}
              aria-label="Vorheriger Schritt"
              className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/15 bg-white/[0.05] text-white/85 disabled:opacity-35 transition-colors cursor-pointer shrink-0"
            >
              <ChevronLeft size={18} />
            </motion.button>

            <div className="flex items-center gap-1.5 min-w-0" role="group" aria-label="Schritt-Navigation">
              {journeySteps.map((s) => {
                const isDotActive = activeStep === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => selectAndScrollToStep(s.id)}
                    aria-label={`Zu Schritt ${s.num}: ${s.title}`}
                    aria-current={isDotActive ? "step" : undefined}
                    className="flex min-h-[44px] items-center justify-center px-1 cursor-pointer"
                  >
                    <motion.span
                      layout={!prefersReducedMotion}
                      transition={{ type: "spring", stiffness: 450, damping: 30 }}
                      className={`block h-2 rounded-full transition-colors ${
                        isDotActive ? "w-7 bg-accent" : "w-2 bg-white/30"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <motion.button
              type="button"
              whileTap={prefersReducedMotion ? undefined : { scale: 0.88 }}
              disabled={activeStep >= journeySteps.length}
              onClick={() =>
                selectAndScrollToStep(Math.min(journeySteps.length, activeStep + 1))
              }
              aria-label="Nächster Schritt"
              className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/15 bg-white/[0.05] text-white/85 disabled:opacity-35 transition-colors cursor-pointer shrink-0"
            >
              <ChevronRight size={18} />
            </motion.button>
          </div>
        </div>

        {/* Bottom Summary Strip (Fits Cleanly on All Phone Widths) */}
        <div className="mt-5 sm:mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 sm:px-6 py-3.5 sm:py-4 text-xs text-white/75 min-w-0">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 min-w-0">
            <span className="inline-flex items-center gap-1.5 font-semibold text-white min-w-0">
              <MapPin size={14} className="text-accent-light shrink-0" />
              <span className="min-w-0 break-words">{business.mobileServiceNotice}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 min-w-0">
              <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
              <span className="min-w-0 break-words">{business.nonMeisterNotice}</span>
            </span>
          </div>
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto shrink-0">
            <a
              href={place.phoneHref}
              onClick={() => triggerHapticFeedback(50)}
              className="inline-flex min-h-[44px] min-w-0 items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-3 py-2 font-bold text-white hover:bg-white/10 active:scale-[0.98] transition-all"
            >
              <Phone size={13} className="text-accent-light shrink-0" />
              <span className="truncate">{place.phoneDisplay}</span>
            </a>
            <a
              href="#anfrage"
              onClick={() => triggerHapticFeedback(40)}
              className="inline-flex min-h-[44px] min-w-0 items-center justify-center gap-1.5 rounded-xl bg-accent px-3.5 sm:px-4 py-2 font-extrabold text-white hover:bg-accent-dark active:scale-[0.98] transition-all"
            >
              <span className="truncate">Anfrage starten</span>
              <ArrowRight size={13} className="shrink-0" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

