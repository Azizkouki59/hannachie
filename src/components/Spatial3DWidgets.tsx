"use client";

import { useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowRight,
  Award,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ShieldCheck,
  Star,
  PackageSearch,
} from "lucide-react";
import { generatedPhotos } from "@/data/generatedPhotos";
import { business, yearsOfExperience } from "@/data/site";
import { triggerHapticFeedback } from "@/lib/haptics";

/* ═══════════════════════════════════════════════════════════════════════════
   1. INTERACTIVE 3D COVERFLOW SHOWCASE (For /leistungen — Mobile + PC)
   Users can click/tap/swipe through angled 3D perspective studio cards.
═══════════════════════════════════════════════════════════════════════════ */
interface ShowcaseSlide {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  device: string;
  cta: string;
  photo: {
    src: string;
    alt: string;
    fallbackGradient: string;
  };
}

const SHOWCASE_SLIDES: ShowcaseSlide[] = [
  {
    id: "waschtechnik",
    tag: "01 · Wasch- & Trockentechnik",
    title: "Präzision für Frontlader & Trockner",
    subtitle: "Beratung, Lager, Pumpen & Dichtungen nach E-Nr.",
    device: "Waschmaschine",
    cta: "Waschmaschine anfragen",
    photo: generatedPhotos.heroAtelierStage,
  },
  {
    id: "ersatzteile",
    tag: "02 · Original-Ersatzteile",
    title: "Passgenaue Teile nach Typenschild",
    subtitle: "Lager, Motoren, Schläuche, Filter & Heizungen für alle Marken.",
    device: "Waschmaschine",
    cta: "Ersatzteil prüfen",
    photo: generatedPhotos.pillarSpareParts,
  },
  {
    id: "kueche",
    tag: "03 · Backofen, Herd & Spüler",
    title: "Einbaugeräte & Küchen-Beratung",
    subtitle: "Ehrliche Einschätzung direkt von Inhaber Kamal Hannachi.",
    device: "Backofen / Herd",
    cta: "Küchengerät anfragen",
    photo: generatedPhotos.pillarConsultation,
  },
  {
    id: "markengeraete",
    tag: "04 · Ausgewählte Markengeräte",
    title: "Geprüfte Geräte auf Anfrage",
    subtitle: "Individuell nach Verfügbarkeit inkl. schriftlicher Verkäufergarantie.",
    device: "Kühlschrank / Gefriergerät",
    cta: "Verfügbarkeit anfragen",
    photo: generatedPhotos.pillarAppliances,
  },
];

export function Appliance3DShowcaseCarousel({
  onRequestDevice,
}: {
  onRequestDevice: (device: string) => void;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const prefersReduced = useReducedMotion();
  const total = SHOWCASE_SLIDES.length;

  const goPrev = () => {
    triggerHapticFeedback(20);
    setActiveIdx((i) => (i - 1 + total) % total);
  };
  const goNext = () => {
    triggerHapticFeedback(20);
    setActiveIdx((i) => (i + 1) % total);
  };

  const getOffset = (idx: number) => {
    let diff = idx - activeIdx;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    return diff;
  };

  const activeSlide = SHOWCASE_SLIDES[activeIdx];

  return (
    <section className="relative overflow-hidden border-b border-primary/8 dark:border-white/10 bg-primary-dark py-9 sm:py-14 text-white">
      {/* Subtle architectural spotlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_20%,rgba(14,165,233,0.16),transparent_72%)]"
      />

      <div className="container-page relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-light">
              3D Einblick · Osnabrück
            </p>
            <h2 className="mt-1 text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
              Geräte, Originalteile &amp; Beratung im Überblick
            </h2>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <motion.button
              whileTap={prefersReduced ? undefined : { scale: 0.92 }}
              type="button"
              onClick={goPrev}
              aria-label="Vorherige 3D-Ansicht"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/18 bg-white/[0.06] hover:bg-white/14 text-white transition-colors cursor-pointer"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </motion.button>
            <span className="px-2 font-mono text-xs font-bold text-white/75 tabular-nums">
              0{activeIdx + 1} / 0{total}
            </span>
            <motion.button
              whileTap={prefersReduced ? undefined : { scale: 0.92 }}
              type="button"
              onClick={goNext}
              aria-label="Nächste 3D-Ansicht"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/18 bg-white/[0.06] hover:bg-white/14 text-white transition-colors cursor-pointer"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </motion.button>
          </div>
        </div>

        {/* 3D Perspective Coverflow Stage (works smoothly on Mobile swipe/tap & Desktop click) */}
        <div
          className="relative mx-auto h-[290px] min-[400px]:h-[320px] sm:h-[370px] lg:h-[400px] max-w-4xl select-none"
          style={{ perspective: 1300 }}
        >
          {SHOWCASE_SLIDES.map((slide, idx) => {
            const offset = getOffset(idx);
            const isActive = offset === 0;
            const isVisible = Math.abs(offset) <= 1;

            return (
              <motion.div
                key={slide.id}
                onClick={() => {
                  if (!isActive) {
                    triggerHapticFeedback(20);
                    setActiveIdx(idx);
                  }
                }}
                drag={isActive && !prefersReduced ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.18}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -45 || info.velocity.x < -300) {
                    goNext();
                  } else if (info.offset.x > 45 || info.velocity.x > 300) {
                    goPrev();
                  }
                }}
                animate={{
                  x: offset === 0 ? "0%" : offset < 0 ? "-54%" : "54%",
                  scale: isActive ? 1 : 0.84,
                  rotateY: prefersReduced ? 0 : offset === 0 ? 0 : offset < 0 ? 26 : -26,
                  z: isActive ? 40 : -70,
                  opacity: isVisible ? (isActive ? 1 : 0.45) : 0,
                }}
                transition={
                  prefersReduced
                    ? { duration: 0.15 }
                    : { type: "spring", stiffness: 250, damping: 28, mass: 0.85 }
                }
                style={{
                  transformStyle: "preserve-3d",
                  zIndex: isActive ? 30 : isVisible ? 15 : 5,
                  pointerEvents: isVisible ? "auto" : "none",
                }}
                className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-[88%] sm:w-[70%] lg:w-[64%] overflow-hidden rounded-2xl border ${
                  isActive
                    ? "border-sky-400/45 shadow-[0_28px_70px_-14px_rgba(2,6,23,0.9),0_0_0_1px_rgba(56,189,248,0.22)] cursor-grab active:cursor-grabbing"
                    : "border-white/12 shadow-xl cursor-pointer"
                } bg-gradient-to-br ${slide.photo.fallbackGradient}`}
              >
                <img
                  src={slide.photo.src}
                  alt={slide.photo.alt}
                  referrerPolicy="no-referrer"
                  draggable={false}
                  className="h-full w-full object-cover object-center"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/92 via-slate-950/30 to-slate-950/15" />

                {/* Floating Z-Plane Caption Plate */}
                <div className="absolute inset-x-3.5 bottom-3.5 sm:inset-x-5 sm:bottom-5 z-10 rounded-xl border border-white/18 bg-slate-950/82 p-3.5 sm:p-4 backdrop-blur-md">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-accent-light">
                    {slide.tag}
                  </span>
                  <h3 className="mt-0.5 text-base sm:text-lg font-extrabold text-white leading-snug">
                    {slide.title}
                  </h3>
                  <p className="mt-1 text-xs text-white/75 line-clamp-2">
                    {slide.subtitle}
                  </p>
                  {isActive && (
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <motion.button
                        whileTap={prefersReduced ? undefined : { scale: 0.96 }}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHapticFeedback(35);
                          onRequestDevice(slide.device);
                        }}
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-accent hover:bg-accent-dark px-3.5 py-1.5 text-xs font-extrabold text-white transition-colors cursor-pointer"
                      >
                        <PackageSearch size={13} aria-hidden="true" />
                        <span>{slide.cta}</span>
                        <ArrowRight size={13} aria-hidden="true" />
                      </motion.button>
                      <span className="hidden sm:inline text-[11px] text-white/55">
                        Wischen oder klicken
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Interactive Step Selector Strip */}
        <div className="mt-5 grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2">
          {SHOWCASE_SLIDES.map((s, idx) => {
            const active = idx === activeIdx;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  triggerHapticFeedback(20);
                  setActiveIdx(idx);
                }}
                aria-pressed={active}
                className={`min-h-[38px] w-full sm:w-auto truncate text-center rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? "border-sky-400/70 bg-sky-500/20 text-white"
                    : "border-white/12 bg-white/[0.04] text-white/65 hover:border-white/25 hover:text-white"
                }`}
              >
                {s.tag.split(" · ")[1]}
              </button>
            );
          })}
        </div>
        <span className="sr-only">Aktive 3D-Ansicht: {activeSlide.title}</span>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. HERITAGE MEDALLION (For /ueber-uns — Zero-Lag Crisp Architectural Card)
═══════════════════════════════════════════════════════════════════════════ */
export function Heritage3DOrbitalBadge({
  ratingFormatted,
  reviewCount,
}: {
  ratingFormatted: string;
  reviewCount: number;
}) {
  return (
    <div className="w-full h-full">
      <div className="relative h-full flex flex-col justify-between overflow-hidden rounded-2xl border border-sky-400/25 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 p-5 sm:p-6 text-white shadow-[0_24px_60px_-16px_rgba(2,6,23,0.75)] transition-transform duration-200 lg:hover:-translate-y-0.5">
        <div className="relative">
          {/* Precision Architectural Ring */}
          <svg
            aria-hidden="true"
            viewBox="0 0 220 220"
            className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 text-sky-400/25"
            fill="none"
          >
            <circle cx="110" cy="110" r="96" stroke="currentColor" strokeWidth="1" strokeDasharray="4 8" />
            <circle cx="110" cy="110" r="74" stroke="rgba(56,189,248,0.45)" strokeWidth="1.2" />
            <path d="M 110 14 A 96 96 0 0 1 206 110" stroke="rgba(186,230,253,0.7)" strokeWidth="1.8" strokeLinecap="round" />
          </svg>

          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-accent-light">
              <Award size={15} className="shrink-0" aria-hidden="true" />
              <span>Seit {business.founded} · {business.city}</span>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-300 tabular-nums">
              <Star size={12} className="fill-amber-300 text-amber-300" aria-hidden="true" />
              <span>{ratingFormatted} ({reviewCount})</span>
            </span>
          </div>

          <div className="relative z-10 mt-4 flex items-baseline gap-3">
            <span className="bg-gradient-to-b from-white via-sky-100 to-sky-300 bg-clip-text text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent tabular-nums">
              {yearsOfExperience}+ Jahre
            </span>
            <span className="text-xs sm:text-sm font-semibold text-white/75">
              Erfahrung in Osnabrück
            </span>
          </div>

          <p className="relative z-10 mt-2.5 text-xs sm:text-[13px] leading-relaxed text-white/80">
            Inhaber <strong className="text-white">{business.owner}</strong> · Persönliche Beratung, Originalteile &amp; ausgewählte Markengeräte.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   3. VERIFIED RATING BANNER (For /kundenbewertungen — Zero Infinite Loops)
═══════════════════════════════════════════════════════════════════════════ */
export function Rating3DPrismBanner({
  ratingFormatted,
  reviewCount,
  mapsUrl,
}: {
  ratingFormatted: string;
  reviewCount: number;
  mapsUrl: string;
}) {
  return (
    <section className="border-b border-primary/8 dark:border-white/10 bg-surface dark:bg-slate-900/70 py-7 sm:py-10">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 p-5 sm:p-7 text-white shadow-[0_24px_60px_-18px_rgba(2,6,23,0.7)]">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 flex-col items-center justify-center rounded-2xl border border-amber-300/35 bg-gradient-to-b from-amber-400/20 to-amber-500/5 shadow-[0_12px_30px_-8px_rgba(251,191,36,0.35)]">
                <span className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums leading-none">
                  {ratingFormatted}
                </span>
                <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  von 5,0
                </span>
              </div>

              <div>
                <div className="flex items-center gap-1 mb-1.5" aria-label="5 Sterne Bewertung">
                  {[0, 1, 2, 3, 4].map((starIdx) => (
                    <Star
                      key={starIdx}
                      size={18}
                      className="fill-amber-400 text-amber-400"
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <p className="text-base sm:text-lg font-extrabold text-white leading-snug">
                  {reviewCount} Bewertungen auf Google
                </p>
                <p className="mt-0.5 text-xs sm:text-sm text-white/75">
                  Ehrliche Rückmeldungen aus Osnabrück &amp; Umgebung · Seit {business.founded}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full md:w-auto justify-center min-h-[44px] items-center gap-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/18 px-4 py-2.5 text-xs font-extrabold text-white transition-colors"
              >
                <ShieldCheck size={15} className="text-emerald-400 shrink-0" aria-hidden="true" />
                <span>Google-Profil öffnen</span>
                <ArrowRight size={14} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. OSNABRÜCK REGION COMPASS (For /kontakt — Zero Infinite Loops)
═══════════════════════════════════════════════════════════════════════════ */
const SERVICE_TOWNS = [
  { name: "Osnabrück", x: "50%", y: "50%", primary: true, km: "Zentrum" },
  { name: "Wallenhorst", x: "42%", y: "26%", primary: false, km: "9 km" },
  { name: "Belm", x: "72%", y: "34%", primary: false, km: "10 km" },
  { name: "GMHütte", x: "56%", y: "74%", primary: false, km: "12 km" },
  { name: "Hasbergen", x: "26%", y: "64%", primary: false, km: "11 km" },
] as const;

export function Contact3DCompassCard() {
  const prefersReduced = useReducedMotion();
  const [selectedTown, setSelectedTown] = useState<string>("Osnabrück");

  const activeTownObj =
    SERVICE_TOWNS.find((t) => t.name === selectedTown) || SERVICE_TOWNS[0];

  return (
    <div className="relative h-full flex flex-col justify-between overflow-hidden rounded-2xl border border-sky-400/20 bg-gradient-to-b from-slate-950 via-slate-900 to-sky-950/95 p-4 sm:p-5 text-white shadow-[0_20px_48px_-14px_rgba(2,6,23,0.75)]">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-accent-light">
            Region · Osnabrück
          </p>
          <h3 className="text-sm font-extrabold text-white">
            Osnabrück &amp; 25 km Umgebung
          </h3>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={activeTownObj.name}
            initial={prefersReduced ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: 0.16 }}
            className="text-[11px] font-bold text-sky-300 tabular-nums shrink-0"
          >
            {activeTownObj.name} · {activeTownObj.km}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Isometric Region Plane */}
      <div className="relative flex-1 min-h-[11rem] w-full overflow-hidden rounded-xl border border-white/10 bg-slate-950/70" style={{ perspective: 700 }}>
        <div
          style={{ transform: "rotateX(38deg)" }}
          className="relative mx-auto h-full w-full"
        >
          {/* Concentric distance rings */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-44 w-44 rounded-full border border-sky-400/18" />
            <div className="absolute h-28 w-28 rounded-full border border-sky-400/30" />
            <div className="absolute h-14 w-14 rounded-full border border-sky-300/45 bg-sky-400/10" />
          </div>

          {/* Interactive Town Beacons */}
          {SERVICE_TOWNS.map((town) => {
            const isSelected = selectedTown === town.name;
            return (
              <button
                key={town.name}
                type="button"
                onClick={() => {
                  triggerHapticFeedback(15);
                  setSelectedTown(town.name);
                }}
                style={{ left: town.x, top: town.y }}
                aria-label={`${town.name} (${town.km})`}
                className="group/pin absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer"
              >
                <span
                  className={`flex items-center justify-center rounded-full transition-transform duration-150 ${
                    town.primary
                      ? "h-6 w-6 bg-sky-500 text-white shadow-[0_0_16px_rgba(56,189,248,0.75)]"
                      : isSelected
                        ? "h-4 w-4 bg-emerald-400 text-slate-950 scale-125 shadow-[0_0_12px_rgba(52,211,153,0.75)]"
                        : "h-3 w-3 bg-sky-300/80 hover:scale-125"
                  }`}
                >
                  {town.primary && <MapPin size={12} aria-hidden="true" />}
                </span>
                <span className="mt-1 whitespace-nowrap rounded bg-slate-950/85 px-1.5 py-0.5 text-[9.5px] font-bold text-white/90 border border-white/15">
                  {town.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-2.5 text-[11px] text-white/65">
        Termine nach Vereinbarung · Ort antippen für Entfernung
      </p>
    </div>
  );
}
