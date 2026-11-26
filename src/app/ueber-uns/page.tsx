"use client";

import { useState } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Phone,
  Star,
} from "lucide-react";
import ContactCta from "@/components/ContactCta";
import { HeroAnimatedBackdrop } from "@/components/HeroAnimatedBackdrop";
import { AboutPrecisionStudio3D } from "@/components/AboutPrecisionStudio3D";
import { FadeUp, Spatial3DCard } from "@/components/animations";
import { useQuickRequest } from "@/components/QuickRequestSheet";
import { herrHannachiImage, werkstattHeroHdImage } from "@/data/images";
import { brands, business, sparePartsBrands, yearsOfExperience } from "@/data/site";
import { useGoogleLivePlace } from "@/lib/googlePlaceLive";
import { triggerHapticFeedback } from "@/lib/haptics";
import { buildRouteMetadata } from "@/lib/seo";

export const metadata: Metadata = buildRouteMetadata("/ueber-uns");

type EraId = "1990" | "2000er" | "2010er" | "heute";

interface MilestoneEra {
  id: EraId;
  tabLabel: string;
  period: string;
  title: string;
  summary: string;
  highlight: string;
}

const MILESTONE_ERAS: MilestoneEra[] = [
  {
    id: "1990",
    tabLabel: "1990",
    period: "Gründung in Osnabrück",
    title: "Der Anfang: Persönliche Beratung statt Massenabfertigung",
    summary:
      "Kamal Hannachi startet 1990 in Osnabrück mit einem klaren Grundsatz: Haushaltsgeräte verdienen ehrliche Auskunft, fundiertes Produktwissen und langlebige Originalteile statt schneller Wegwerf-Empfehlungen.",
    highlight: "Fester Standort in Osnabrück seit über drei Jahrzehnten",
  },
  {
    id: "2000er",
    tabLabel: "2000er",
    period: "Aufbau des Teile-Fachwissens",
    title: "Präzise Zuordnung über E-Nr., PNC & Herstellerkataloge",
    summary:
      "Mit dem Wandel von mechanischen zu elektronisch gesteuerten Waschmaschinen, Spülern und Kühlgeräten wächst das spezialisierte Wissen rund um Typenschilder, Pumpen, Heizelemente und Dichtungen führender Marken.",
    highlight: "Markenübergreifende Fachkenntnis für Miele, Bosch, Siemens, AEG & mehr",
  },
  {
    id: "2010er",
    tabLabel: "2010er",
    period: "Empfehlungen über Generationen",
    title: "Vertrauen durch Offenheit und faire Preise",
    summary:
      "Viele Osnabrücker Familien wenden sich bereits in der zweiten Generation direkt an Herrn Hannachi. Eine ehrliche Einschätzung am Telefon oder per Foto vom Typenschild spart oft unnötige Fehlbestellungen.",
    highlight: "Langjährige Stammkundschaft in Osnabrück und im gesamten Umland",
  },
  {
    id: "heute",
    tabLabel: "Heute",
    period: "Direkt per WhatsApp, Telefon & Termin",
    title: `${yearsOfExperience}+ Jahre Erfahrung – modern & unkompliziert erreichbar`,
    summary:
      "Ob passgenaues Original-Ersatzteil nach Typenschild oder ausgewähltes Markengerät auf Anfrage inklusive schriftlicher Verkäufergarantie: Sie sprechen immer direkt mit dem Inhaber – ohne Warteschleife.",
    highlight: "4,8 ★ Durchschnitt aus verifizierten Google-Bewertungen in Osnabrück",
  },
];

const FEATURED_VOICES = [
  {
    author: "Debeka Servicebüro",
    context: "Local Guide · Osnabrück",
    quote:
      "Spontaner Termin, gute Beratung und volle Fachkenntnis. Dieser Mann ist das Geld wert!",
  },
  {
    author: "Roman Osinsky",
    context: "Local Guide · Geschirrspüler",
    quote:
      'Herr Hannachi konnte schon am Telefon schnell und kostenfrei einen Tipp geben, wie wir unseren Geschirrspüler mit ein paar Handgriffen wieder zum Laufen bringen. So geht "Kundenbindung".',
  },
  {
    author: "Dominik Gawehn",
    context: "Geräte & Ersatzteile",
    quote:
      "Dankeschön Herr Hannachi! Toller Service, preiswert, schnelle Abwicklung. Sehr empfehlenswert!",
  },
] as const;

export default function UeberUns() {
  const { place, ratingFormatted } = useGoogleLivePlace();
  const { openQuickRequest } = useQuickRequest();
  const [activeEra, setActiveEra] = useState<EraId>("1990");

  const currentEra =
    MILESTONE_ERAS.find((e) => e.id === activeEra) ?? MILESTONE_ERAS[0];

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════════
          ACT 1 — SIGNATURE FOUNDER STUDIO HERO
          Bespoke midnight-navy architectural split + custom 3D heritage emblem
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-primary-dark text-white">
        <HeroAnimatedBackdrop variant="about-heritage-emblem" />

        <div className="container-page relative z-10 py-12 sm:py-16 lg:py-24">
          <div className="grid gap-8 lg:gap-12 lg:grid-cols-12 items-stretch">
            {/* Left 7 Columns: Editorial Statement & Heritage Ledger */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-8">
              <div className="space-y-5 sm:space-y-6">
                {/* Quiet unboxed metadata line (zero pills) */}
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-sky-300/90">
                  <span>{business.city}</span>
                  <span aria-hidden="true" className="text-white/30">
                    ·
                  </span>
                  <span>{business.street}</span>
                  <span aria-hidden="true" className="text-white/30">
                    ·
                  </span>
                  <span className="tabular-nums">Seit {business.founded}</span>
                </div>

                <h1 className="text-[clamp(2.15rem,4.2vw,3.65rem)] font-extrabold leading-[1.07] tracking-tight text-white text-balance max-w-2xl">
                  {yearsOfExperience} Jahre Persönlichkeit, Erfahrung &amp; Präzision.
                </h1>

                <p className="max-w-xl text-base sm:text-lg leading-relaxed text-slate-300">
                  Seit{" "}
                  <strong className="font-semibold text-white tabular-nums">
                    {business.founded}
                  </strong>{" "}
                  steht Inhaber{" "}
                  <strong className="font-semibold text-white">{business.owner}</strong>{" "}
                  in Osnabrück persönlich für ehrliche Fachberatung rund um
                  Elektrohaushaltsgeräte, passgenaue Original-Ersatzteile nach Typenschild
                  und ausgewählte Markengeräte auf Anfrage.
                </p>

                {/* Focused Action Row: 1 primary CTA + quiet secondary links */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHapticFeedback(35);
                      openQuickRequest("Waschmaschine", "", "", "question");
                    }}
                    className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white shadow-[0_10px_30px_-8px_rgba(14,165,233,0.55)] hover:bg-accent-dark active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <span>Persönlich anfragen</span>
                    <ArrowRight size={15} aria-hidden="true" />
                  </button>

                  <a
                    href={business.phoneHref}
                    className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 hover:border-white/35 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Phone size={15} className="text-sky-300 shrink-0" aria-hidden="true" />
                    <span className="tabular-nums">{business.phoneDisplay}</span>
                  </a>

                  <a
                    href={business.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 hover:text-white transition-colors whitespace-nowrap shrink-0"
                  >
                    <MessageCircle size={15} className="shrink-0" aria-hidden="true" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Clean Hairline Architectural Ledger (unboxed, tabular numerals) */}
              <div className="grid grid-cols-3 gap-4 sm:gap-6 border-t border-white/14 pt-6">
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums tracking-tight">
                    {business.founded}
                  </p>
                  <p className="mt-1 text-xs sm:text-[13px] text-slate-400">
                    Gründungsjahr in {business.city}
                  </p>
                </div>
                <div className="border-l border-white/12 pl-4 sm:pl-6">
                  <p className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums tracking-tight">
                    {ratingFormatted}
                    <span className="text-sky-400 text-lg sm:text-xl font-bold"> / 5</span>
                  </p>
                  <p className="mt-1 text-xs sm:text-[13px] text-slate-400 tabular-nums">
                    {place.userRatingCount} Google-Bewertungen
                  </p>
                </div>
                <div className="border-l border-white/12 pl-4 sm:pl-6">
                  <p className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums tracking-tight">
                    100 %
                  </p>
                  <p className="mt-1 text-xs sm:text-[13px] text-slate-400">
                    Direkt vom Inhaber
                  </p>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Museum-Framed Founder Portrait */}
            <div className="lg:col-span-5 flex flex-col">
              <Spatial3DCard maxTilt={4} className="flex-1 rounded-2xl">
                <figure className="relative h-full min-h-[380px] sm:min-h-[450px] lg:min-h-full w-full overflow-hidden rounded-2xl border border-white/15 bg-slate-900 shadow-[0_30px_70px_-20px_rgba(2,6,23,0.85)]">
                  <Image
                    src={herrHannachiImage}
                    alt="Kamal Hannachi – Inhaber und persönlicher Fachberater in Osnabrück"
                    fill
                    priority
                    quality={95}
                    placeholder="blur"
                    blurDataURL={herrHannachiImage.blurDataURL}
                    sizes="(min-width: 1024px) 38vw, (min-width: 640px) 75vw, 94vw"
                    className="object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.03]"
                  />
                  {/* Measured bottom scrim guaranteeing >= 4.5:1 text contrast */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                  <figcaption className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                    <p className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                      {business.owner}
                    </p>
                    <p className="mt-0.5 text-xs sm:text-[13px] font-medium text-slate-300">
                      Inhaber · Fachberatung, Original-Ersatzteile &amp; Markengeräte
                    </p>
                  </figcaption>
                </figure>
              </Spatial3DCard>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          ACT 2 — FOUNDER NARRATIVE, PULL QUOTE & INTERACTIVE 35-YEAR CHRONICLE
          Crisp editorial reading canvas + real Osnabrück location photography
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="section bg-white dark:bg-slate-950">
        <div className="container-page">
          <div className="grid gap-10 lg:gap-14 lg:grid-cols-12 items-start">
            {/* Left 6 Columns: Editorial Founder Prose & Pull Quote */}
            <FadeUp className="lg:col-span-6 space-y-7">
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-accent">
                  Die Geschichte hinter dem Namen
                </p>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-primary dark:text-slate-100 tracking-tight text-balance">
                  Ehrliche Beratung, die in Osnabrück seit {business.founded} trägt.
                </h2>
              </div>

              <div className="space-y-4 text-[15px] sm:text-base leading-[1.75] text-slate-600 dark:text-slate-300 max-w-[65ch]">
                <p className="first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-5xl first-letter:font-extrabold first-letter:leading-[0.85] first-letter:text-accent">
                  Wer seit über drei Jahrzehnten täglich mit Waschmaschinen,
                  Geschirrspülern, Kühlgeräten und Backöfen zu tun hat, kennt jedes
                  Typenschild, jede Baureihe und jede Schwachstelle aus eigener Erfahrung.
                  Bei Hannachi sprechen Sie nicht mit einem anonymen Callcenter, sondern
                  direkt mit{" "}
                  <strong className="font-semibold text-primary dark:text-white">
                    {business.owner}
                  </strong>
                  .
                </p>
                <p>
                  Unser Schwerpunkt liegt auf klarer, verständlicher{" "}
                  <strong className="font-semibold text-primary dark:text-white">
                    Fachberatung
                  </strong>
                  , dem Verkauf passgenauer{" "}
                  <strong className="font-semibold text-primary dark:text-white">
                    Original-Ersatzteile
                  </strong>{" "}
                  für Marken wie {brands.join(", ")} und Liebherr sowie auf ausgewählten,
                  geprüften{" "}
                  <strong className="font-semibold text-primary dark:text-white">
                    Markengeräten auf Anfrage
                  </strong>{" "}
                  inklusive{" "}
                  <Link
                    href="/impressum#garantie"
                    className="font-semibold text-accent underline underline-offset-2 hover:text-accent-dark"
                  >
                    schriftlicher Verkäufergarantie
                  </Link>
                  .
                </p>
              </div>

              {/* Clean Editorial Pull Quote (top & bottom hairlines, zero thick left bars) */}
              <blockquote className="border-y border-primary/12 dark:border-white/12 py-6 space-y-3">
                <p className="text-lg sm:text-xl font-semibold italic leading-relaxed text-primary dark:text-slate-100">
                  „Gute Beratung bedeutet für mich, ehrlich zu sagen, ob sich ein
                  Original-Ersatzteil lohnt oder ein passendes Markengerät die bessere
                  Wahl ist.“
                </p>
                <footer className="text-xs font-semibold text-ink-muted">
                  — {business.owner}, {business.city}
                </footer>
              </blockquote>

              {/* Structured Operational Facts List (Zero Pills) */}
              <dl className="divide-y divide-primary/8 dark:divide-white/10 border-b border-primary/8 dark:border-white/10 text-sm">
                <div className="py-3 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                  <dt className="text-xs font-medium text-ink-muted">Standort</dt>
                  <dd className="font-semibold text-primary dark:text-slate-100 inline-flex items-center gap-1.5">
                    <MapPin size={13} className="text-accent shrink-0" aria-hidden="true" />
                    <span>
                      {business.street}, {business.zip} {business.city}
                    </span>
                  </dd>
                </div>
                <div className="py-3 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                  <dt className="text-xs font-medium text-ink-muted">Erreichbarkeit</dt>
                  <dd className="font-semibold text-primary dark:text-slate-100">
                    {business.hours}
                  </dd>
                </div>
                <div className="py-3 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                  <dt className="text-xs font-medium text-ink-muted">Direktkontakt</dt>
                  <dd className="font-semibold text-primary dark:text-slate-100 tabular-nums">
                    <a
                      href={business.phoneHref}
                      className="hover:text-accent transition-colors"
                    >
                      {business.phoneDisplay}
                    </a>{" "}
                    <span className="text-ink-muted font-normal">·</span>{" "}
                    <a
                      href={business.whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 dark:text-emerald-400 hover:underline"
                    >
                      WhatsApp
                    </a>
                  </dd>
                </div>
              </dl>
            </FadeUp>

            {/* Right 6 Columns: Interactive Chronicle Tabs + Real Osnabrück Photo */}
            <FadeUp delay={0.08} className="lg:col-span-6 space-y-6">
              {/* Interactive Milestone Chronicle Panel */}
              <div className="rounded-2xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-900 p-5 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-accent">
                      Chronik · {yearsOfExperience}+ Jahre
                    </p>
                    <h3 className="text-base sm:text-lg font-extrabold text-primary dark:text-slate-100">
                      Meilensteine seit {business.founded}
                    </h3>
                  </div>

                  {/* Interactive Segmented Era Tabs */}
                  <div
                    role="tablist"
                    aria-label="Zeitraum auswählen"
                    className="inline-flex items-center gap-1 rounded-xl bg-white dark:bg-slate-950 p-1 border border-primary/10 dark:border-white/10"
                  >
                    {MILESTONE_ERAS.map((era) => {
                      const isActive = era.id === activeEra;
                      return (
                        <button
                          key={era.id}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          onClick={() => {
                            triggerHapticFeedback(18);
                            setActiveEra(era.id);
                          }}
                          className={`relative min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                            isActive
                              ? "text-white"
                              : "text-ink-muted hover:text-primary dark:hover:text-white"
                          }`}
                        >
                          {isActive && (
                            <motion.span
                              layoutId="aboutEraActivePill"
                              transition={{
                                type: "spring",
                                stiffness: 420,
                                damping: 32,
                              }}
                              className="absolute inset-0 rounded-lg bg-primary dark:bg-accent"
                            />
                          )}
                          <span className="relative z-10">{era.tabLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Animated Milestone Content */}
                <div className="min-h-[148px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentEra.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="space-y-2.5"
                    >
                      <p className="text-xs font-semibold text-ink-muted">
                        {currentEra.tabLabel} · {currentEra.period}
                      </p>
                      <h4 className="text-lg font-extrabold text-primary dark:text-white tracking-tight">
                        {currentEra.title}
                      </h4>
                      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                        {currentEra.summary}
                        {currentEra.id === "heute" && (
                          <>
                            {" "}
                            <Link
                              href="/impressum#garantie"
                              className="font-semibold text-accent underline underline-offset-2 hover:text-accent-dark whitespace-nowrap"
                            >
                              (Garantiebedingungen)
                            </Link>
                          </>
                        )}
                      </p>
                      <p className="pt-2 border-t border-primary/8 dark:border-white/10 text-xs font-semibold text-primary dark:text-sky-300">
                        {currentEra.highlight}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Real High-Resolution Osnabrück Location Photograph */}
              <figure className="space-y-2.5">
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-primary/10 dark:border-white/10 bg-slate-900">
                  <Image
                    src={werkstattHeroHdImage}
                    alt="Standort von Hannachi Elektrohaushaltsgeräte & Ersatzteile in Osnabrück, Iburger Straße 5"
                    fill
                    quality={92}
                    placeholder="blur"
                    blurDataURL={werkstattHeroHdImage.blurDataURL}
                    sizes="(min-width: 1024px) 46vw, 96vw"
                    className="object-cover object-center"
                  />
                </div>
                <figcaption className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
                  <span>
                    Standort {business.street} · {business.zip} {business.city}
                  </span>
                  <span>Persönliche Übergabe nach Terminvereinbarung</span>
                </figcaption>
              </figure>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          ACT 3 — INTERACTIVE 3D HARDWARE STUDIO ("PRÄZISION IM DETAIL")
          Bespoke Three.js PBR exploded-view inspector exclusive to /ueber-uns
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="section border-y border-white/10 bg-slate-950 text-white">
        <div className="container-page space-y-8 sm:space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-semibold text-sky-400">
                3D-Kurzfilm · Osnabrück seit {business.founded}
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight text-balance">
                Alle Hausgeräte in Bewegung – unser Spektrum in 4 Szenen.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-slate-400">
              Von Waschmaschine und Trockner über Spüler, Backofen, Kochfeld und Dunstabzug
              bis zu Kaffeevollautomat, Mikrowelle, Kühl- und Gefriergeräten.
            </p>
          </div>

          <AboutPrecisionStudio3D
            onRequestPart={(appliance, partNote) => {
              openQuickRequest(appliance, partNote, "", "question");
            }}
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          ACT 4 — ASYMMETRIC EDITORIAL PRINCIPLES BENTO + VERIFIED VOICES
          Claim-to-proof adjacency & transparent § 14 GewO trade foundation
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="section bg-surface dark:bg-slate-900">
        <div className="container-page space-y-12 sm:space-y-16">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-semibold text-accent">
                Wofür Hannachi steht · Seit {business.founded}
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-primary dark:text-slate-100 tracking-tight text-balance">
                Vier klare Grundsätze ohne Kleingedrucktes.
              </h2>
            </div>
            <Link
              href="/leistungen"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-accent hover:underline whitespace-nowrap shrink-0"
            >
              <span>Geräte &amp; Ersatzteile entdecken</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>

          {/* Asymmetric 12-Column Editorial Bento (7+5 / 5+7) */}
          <div className="grid gap-5 lg:grid-cols-12">
            {/* 01 — Wide Lead Principle (7 cols) */}
            <article className="lg:col-span-7 rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-950 p-6 sm:p-8 flex flex-col justify-between gap-6">
              <div className="space-y-3">
                <p className="font-mono text-xs font-bold text-accent tabular-nums">
                  01 · Persönliche Fachberatung
                </p>
                <h3 className="text-xl sm:text-2xl font-extrabold text-primary dark:text-white tracking-tight text-balance">
                  Direkter Kontakt mit Kamal Hannachi – ohne Umwege.
                </h3>
                <p className="text-sm sm:text-[15px] leading-relaxed text-slate-600 dark:text-slate-300 max-w-xl">
                  Ob am Telefon, per WhatsApp-Foto oder nach persönlicher
                  Terminvereinbarung in Osnabrück: Sie erhalten eine ehrliche, verständliche
                  Einschätzung auf Basis von {yearsOfExperience}+ Jahren Praxiserfahrung.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-primary/8 dark:border-white/10 pt-4 text-xs font-medium text-ink-muted">
                <span>Kein Callcenter</span>
                <span aria-hidden="true">·</span>
                <span>Schnelle Rückmeldung</span>
                <span aria-hidden="true">·</span>
                <span>Termine nach Vereinbarung</span>
              </div>
            </article>

            {/* 02 — Original Spare Parts (5 cols) */}
            <article className="lg:col-span-5 rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-950 p-6 sm:p-8 flex flex-col justify-between gap-6">
              <div className="space-y-3">
                <p className="font-mono text-xs font-bold text-accent tabular-nums">
                  02 · Original-Ersatzteile
                </p>
                <h3 className="text-xl sm:text-2xl font-extrabold text-primary dark:text-white tracking-tight text-balance">
                  Exakt nach Typenschild (E-Nr. / PNC).
                </h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Pumpen, Heizstäbe, Türmanschetten, Thermostate, Scharniere und
                  Ersatzmodule – persönlich abgeglichen, damit jedes Teil exakt passt.
                </p>
              </div>
              <p className="border-t border-primary/8 dark:border-white/10 pt-4 text-xs leading-relaxed text-ink-muted">
                {sparePartsBrands
                  .slice(0, 8)
                  .map((b) => b.name)
                  .join(" · ")}{" "}
                u. v. m.
              </p>
            </article>

            {/* 03 — Selected Brand Appliances (5 cols) */}
            <article className="lg:col-span-5 rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-950 p-6 sm:p-8 flex flex-col justify-between gap-6">
              <div className="space-y-3">
                <p className="font-mono text-xs font-bold text-accent tabular-nums">
                  03 · Ausgewählte Markengeräte
                </p>
                <h3 className="text-xl sm:text-2xl font-extrabold text-primary dark:text-white tracking-tight text-balance">
                  Auf Anfrage – inkl. schriftlicher Verkäufergarantie.
                </h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Wenn ein Ersatzgerät sinnvoller ist, vermittelt und verkauft Hannachi
                  ausgewählte geprüfte Markengeräte nach aktueller Verfügbarkeit – mit{" "}
                  <Link
                    href="/impressum#garantie"
                    className="font-semibold text-accent underline underline-offset-2"
                  >
                    schriftlicher Verkäufergarantie
                  </Link>{" "}
                  bei direktem Erwerb.
                </p>
              </div>
              <div className="border-t border-primary/8 dark:border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback(25);
                    openQuickRequest("Waschmaschine", "Ausgewähltes Markengerät auf Anfrage", "", "question");
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline cursor-pointer"
                >
                  <span>Aktuelle Verfügbarkeit anfragen</span>
                  <ArrowRight size={13} aria-hidden="true" />
                </button>
              </div>
            </article>

            {/* 04 — Fair & Transparent (7 cols) */}
            <article className="lg:col-span-7 rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-950 p-6 sm:p-8 flex flex-col justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-xs font-bold text-accent tabular-nums">
                    04 · Fair &amp; Transparent
                  </p>
                  <CheckCircle2
                    size={16}
                    className="text-emerald-600 dark:text-emerald-400 shrink-0"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-primary dark:text-white tracking-tight text-balance">
                  Ehrliche Preise und persönliche Übergabe in Osnabrück.
                </h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 max-w-xl">
                  Keine versteckten Kosten, kein anonymer Ablauf: Sie erhalten vorab eine klare
                  Einschätzung zu passendem Ersatzteil oder Gerät und vereinbaren Ihren Termin
                  unkompliziert direkt mit {business.owner} – per Telefon oder WhatsApp.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-primary/8 dark:border-white/10 pt-4 text-xs">
                <span className="font-medium text-ink-muted">
                  {business.street}, {business.zip} {business.city} · Termine nach Vereinbarung
                </span>
                <Link
                  href="/kontakt"
                  className="font-bold text-accent hover:underline whitespace-nowrap"
                >
                  Kontakt &amp; Termin anfragen →
                </Link>
              </div>
            </article>
          </div>

          {/* Claim-to-Proof Adjacency: Verified Customer Voices */}
          <div className="space-y-6 pt-4 border-t border-primary/10 dark:border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-accent">
                  Stimmen aus {business.city}
                </p>
                <h3 className="mt-1 text-xl sm:text-2xl font-extrabold text-primary dark:text-white tracking-tight">
                  Warum Kunden Kamal Hannachi weiterempfehlen
                </h3>
              </div>
              <Link
                href="/kundenbewertungen"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-accent hover:underline whitespace-nowrap shrink-0"
              >
                <Star
                  size={14}
                  className="fill-amber-400 text-amber-400 shrink-0"
                  aria-hidden="true"
                />
                <span className="tabular-nums">
                  Alle {place.userRatingCount} Google-Bewertungen ({ratingFormatted} ★) →
                </span>
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {FEATURED_VOICES.map((item) => (
                <figure
                  key={item.author}
                  className="rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-950 p-6 flex flex-col justify-between gap-5"
                >
                  <div className="space-y-3">
                    <div
                      className="flex items-center gap-0.5 text-amber-400"
                      aria-label="5 von 5 Sternen"
                    >
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          size={14}
                          className="fill-amber-400 text-amber-400"
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <blockquote className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                      „{item.quote}“
                    </blockquote>
                  </div>
                  <figcaption className="border-t border-primary/8 dark:border-white/10 pt-3.5 text-xs">
                    <p className="font-bold text-primary dark:text-white">
                      {item.author}
                    </p>
                    <p className="text-ink-muted">{item.context}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ContactCta />
    </>
  );
}
