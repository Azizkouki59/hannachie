"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CalendarCheck,
  MessageSquareText,
  PackageSearch,
} from "lucide-react";
import { FadeUp, StaggerContainer, StaggerItem, Spatial3DCard, RevealText } from "@/components/animations";
import { SectionAmbientMesh } from "@/components/HeroAnimatedBackdrop";
import type { RequestTypeId } from "@/components/RepairForm";
import { business, yearsOfExperience } from "@/data/site";
import { triggerHapticFeedback } from "@/lib/haptics";

interface HowWeWorkStep {
  num: string;
  stepTag: string;
  title: string;
  description: string;
  highlight: string;
  ctaLabel: string;
  requestType: RequestTypeId;
  icon: typeof MessageSquareText;
  iconShellClass: string;
  accentBarClass: string;
}

const HOW_WE_WORK_STEPS: HowWeWorkStep[] = [
  {
    num: "01",
    stepTag: "Telefon · WhatsApp",
    title: "1. Beratung",
    description:
      "Kurz melden für eine ehrliche Einschätzung direkt vom Inhaber.",
    highlight: `${yearsOfExperience}+ Jahre Erfahrung`,
    ctaLabel: "Anfragen",
    requestType: "check_parts",
    icon: MessageSquareText,
    iconShellClass:
      "border-[#1974B8]/25 bg-gradient-to-br from-[#1974B8]/14 to-accent/5 text-accent dark:text-[#7AC4F4]",
    accentBarClass: "from-[#1974B8] to-[#64B5EC]",
  },
  {
    num: "02",
    stepTag: "Typenschild",
    title: "2. Ersatzteilsuche",
    description:
      "Typenschild senden, wir finden das passende Originalteil.",
    highlight: "Alle Marken",
    ctaLabel: "Teil prüfen",
    requestType: "check_parts",
    icon: PackageSearch,
    iconShellClass:
      "border-[#C92A42]/28 bg-gradient-to-br from-[#C92A42]/12 to-[#E86A7D]/5 text-[#C92A42] dark:text-[#E86A7D]",
    accentBarClass: "from-[#C92A42] to-[#E86A7D]",
  },
  {
    num: "03",
    stepTag: "Raum Osnabrück",
    title: "3. Termin",
    description:
      "Alles vorab geklärt für einen ruhigen Termin nach Vereinbarung.",
    highlight: "Nach Vereinbarung",
    ctaLabel: "Termin wählen",
    requestType: "check_parts",
    icon: CalendarCheck,
    iconShellClass:
      "border-emerald-500/25 bg-gradient-to-br from-emerald-500/15 to-teal-500/5 text-emerald-600 dark:text-emerald-300",
    accentBarClass: "from-emerald-500 to-teal-500",
  },
];

export default function HowWeWorkSection({
  onSelectStep,
}: {
  onSelectStep?: (requestType: RequestTypeId) => void;
}) {
  const prefersReducedMotion = useReducedMotion();

  const handleStepClick = (requestType: RequestTypeId) => {
    triggerHapticFeedback(35);
    if (onSelectStep) {
      onSelectStep(requestType);
      return;
    }
    const el = document.getElementById("anfrage");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="so-arbeiten-wir"
      aria-labelledby="how-we-work-heading"
      className="section cv-auto relative overflow-hidden bg-surface dark:bg-slate-950 border-b border-primary/8 dark:border-white/10"
    >
      <SectionAmbientMesh variant="process" />
      <div className="container-page relative z-10">
        <FadeUp>
          <div className="max-w-2xl mx-auto text-center mb-7 sm:mb-10">
            <p className="eyebrow">
              So arbeiten wir · {business.city}
            </p>
            <h2
              id="how-we-work-heading"
              className="mt-1.5 text-2xl font-extrabold text-primary dark:text-slate-100 sm:text-3xl lg:text-[34px] tracking-tight text-balance"
            >
              <RevealText segments={[{ text: "In 3 Schritten zur Lösung" }]} />
            </h2>
          </div>
        </FadeUp>

        <div className="relative">
          {/* Clean Architectural Hairline Connector Track on Desktop */}
          <motion.div
            aria-hidden="true"
            initial={prefersReducedMotion ? false : { scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once: true, amount: "some" }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none hidden md:block origin-left absolute top-[3rem] left-[16%] right-[16%] h-[2px] rounded-full bg-gradient-to-r from-[#1974B8]/35 via-[#C92A42]/42 to-emerald-500/35"
          />

          {/* Mobile Vertical Hairline Connector Spine */}
          <div
            aria-hidden="true"
            className="pointer-events-none md:hidden absolute top-11 bottom-11 left-[2.7rem] sm:left-[2.95rem] w-[2px] rounded-full bg-gradient-to-b from-[#1974B8]/35 via-[#C92A42]/40 to-emerald-500/35"
          />

          <StaggerContainer className="relative z-10 grid gap-4 sm:gap-5 md:grid-cols-3 lg:gap-6">
            {HOW_WE_WORK_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <StaggerItem key={step.num} className="h-full">
                  <Spatial3DCard className="rounded-2xl">
                    <article className="group/step relative h-full flex flex-col justify-between overflow-hidden rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-card transition-colors duration-200 hover:border-accent/35">
                      {/* Top Hairline Accent */}
                      <div
                        aria-hidden="true"
                        className={`absolute top-0 inset-x-6 h-[2px] rounded-b-full bg-gradient-to-r ${step.accentBarClass} opacity-75 transition-opacity duration-300 group-hover/step:opacity-100`}
                      />

                      <div>
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div
                            className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-[0_10px_22px_-10px_rgba(2,132,199,0.4),inset_0_1px_0_rgba(255,255,255,0.55)] dark:shadow-[0_10px_22px_-10px_rgba(2,6,23,0.7),inset_0_1px_0_rgba(255,255,255,0.2)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/step:-translate-y-1 group-hover/step:scale-108 ${step.iconShellClass}`}
                          >
                            <Icon size={22} strokeWidth={2} aria-hidden="true" />
                          </div>
                          <div className="text-right">
                            <span className="block font-mono text-2xl font-extrabold leading-none text-primary/15 dark:text-white/15 tabular-nums transition-colors duration-300 group-hover/step:text-accent/45">
                              {step.num}
                            </span>
                            <span className="mt-1 block text-[11px] font-semibold text-ink-faint">
                              {step.stepTag}
                            </span>
                          </div>
                        </div>

                        <h3 className="text-lg sm:text-xl font-extrabold text-primary dark:text-white tracking-tight leading-snug">
                          {step.title}
                        </h3>

                        <p className="mt-2 text-xs sm:text-[14px] leading-relaxed text-ink-muted">
                          {step.description}
                        </p>
                      </div>

                      <div className="mt-5 pt-3.5 border-t border-primary/8 dark:border-white/10 flex items-center justify-between gap-3">
                        <span className="text-[11px] font-semibold text-ink-faint">
                          {step.highlight}
                        </span>
                        <motion.button
                          whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 480, damping: 26 }}
                          type="button"
                          onClick={() => handleStepClick(step.requestType)}
                          className="inline-flex min-h-[44px] sm:min-h-[36px] items-center gap-1.5 text-xs font-extrabold text-accent hover:text-accent-dark dark:hover:text-accent-light transition-colors cursor-pointer shrink-0"
                        >
                          <span>{step.ctaLabel}</span>
                          <ArrowRight
                            size={14}
                            aria-hidden="true"
                            className="transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/step:translate-x-1"
                          />
                        </motion.button>
                      </div>
                    </article>
                  </Spatial3DCard>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </div>
    </section>
  );
}
