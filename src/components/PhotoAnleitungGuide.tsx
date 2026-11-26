"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  Camera,
  Check,
  CheckCircle2,
  EyeOff,
  Flashlight,
  Info,
  MapPin,
  Maximize2,
  XCircle,
} from "lucide-react";
import { triggerHapticFeedback } from "@/lib/haptics";
import goodTypenschildImg from "@/assets/images/typenschild_good_photo_1794912996684.jpg";
import badFlashTypenschildImg from "@/assets/images/typenschild_bad_flash_1794912997527.jpg";
import badBlurTypenschildImg from "@/assets/images/typenschild_bad_blur_1794912997215.jpg";
import badCroppedTypenschildImg from "@/assets/images/typenschild_bad_cropped_1794912997787.jpg";

type BadExampleMode = "flash" | "blur" | "cropped";
type ApplianceSpotId =
  | "washer"
  | "dishwasher"
  | "fridge"
  | "oven"
  | "dryer";

interface PhotoHotspot {
  id: string;
  xPercent: number;
  yPercent: number;
  label: string;
  tooltipTitle: string;
  tooltipText: string;
}

const GOOD_PHOTO_HOTSPOTS: PhotoHotspot[] = [
  {
    id: "good-enr",
    xPercent: 66,
    yPercent: 31,
    label: "1",
    tooltipTitle: "E-Nr. / Index komplett",
    tooltipText: "Modell- & E-Nr. inkl. Endziffer (/01) und FD scharf lesbar.",
  },
  {
    id: "good-light",
    xPercent: 31,
    yPercent: 36,
    label: "2",
    tooltipTitle: "Ohne Blitz fotografiert",
    tooltipText: "Gleichmäßiges Raumlicht – keine Spiegelung auf dem Metall.",
  },
  {
    id: "good-framing",
    xPercent: 50,
    yPercent: 67,
    label: "3",
    tooltipTitle: "Komplett im Bild",
    tooltipText: "Frontal aufgenommen, alle Ränder & Barcode sichtbar.",
  },
];

interface BadExampleSpec {
  id: BadExampleMode;
  tabLabel: string;
  imageSrc: string;
  imageAlt: string;
  problemTitle: string;
  hotspots: PhotoHotspot[];
}

const BAD_EXAMPLE_MODES: BadExampleSpec[] = [
  {
    id: "flash",
    tabLabel: "Blitz",
    imageSrc: badFlashTypenschildImg,
    imageAlt:
      "Negativbeispiel mit Blitz: Heller Lichtfleck verdeckt die Modellnummer",
    problemTitle: "Blitz verdeckt Nummern",
    hotspots: [
      {
        id: "flash-hotspot",
        xPercent: 54,
        yPercent: 48,
        label: "!",
        tooltipTitle: "Blitz-Spiegelung",
        tooltipText: "LED-Blitz überstrahlt das Metall – Blitz ausschalten.",
      },
      {
        id: "flash-side",
        xPercent: 45,
        yPercent: 25,
        label: "2",
        tooltipTitle: "Seitlich beleuchten",
        tooltipText: "Deckenlicht nutzen oder Taschenlampe leicht schräg halten.",
      },
    ],
  },
  {
    id: "blur",
    tabLabel: "Unscharf",
    imageSrc: badBlurTypenschildImg,
    imageAlt:
      "Negativbeispiel verwackelt: Ziffern sind dunkel und unscharf",
    problemTitle: "Verwackelt & zu dunkel",
    hotspots: [
      {
        id: "blur-streak",
        xPercent: 54,
        yPercent: 46,
        label: "!",
        tooltipTitle: "Bewegungsunschärfe",
        tooltipText: "Zu wenig Licht – 1 Sekunde ruhig halten & Fokus tippen.",
      },
      {
        id: "blur-angle",
        xPercent: 59,
        yPercent: 64,
        label: "2",
        tooltipTitle: "Schräger Winkel",
        tooltipText: "Kamera gerade parallel vor das Etikett halten.",
      },
    ],
  },
  {
    id: "cropped",
    tabLabel: "Abgeschnitten",
    imageSrc: badCroppedTypenschildImg,
    imageAlt:
      "Negativbeispiel abgeschnitten: Rechte Ziffern fehlen am Bildrand",
    problemTitle: "Rand abgeschnitten",
    hotspots: [
      {
        id: "crop-edge",
        xPercent: 88,
        yPercent: 39,
        label: "!",
        tooltipTitle: "Endziffer fehlt",
        tooltipText: "Rechter Teil (/01) abgeschnitten – Teile nicht eindeutig.",
      },
      {
        id: "crop-distance",
        xPercent: 48,
        yPercent: 64,
        label: "2",
        tooltipTitle: "Mehr Abstand",
        tooltipText: "15 cm zurückgehen, bis der ganze Aufkleber ins Bild passt.",
      },
    ],
  },
];

interface ApplianceLocationTip {
  id: ApplianceSpotId;
  label: string;
  spotText: string;
}

const APPLIANCE_SPOTS: ApplianceLocationTip[] = [
  {
    id: "washer",
    label: "Waschmaschine",
    spotText:
      "Bullauge öffnen: innen am Türrahmen oder hinter der Flusensieb-Klappe unten rechts.",
  },
  {
    id: "dishwasher",
    label: "Geschirrspüler",
    spotText:
      "Tür ganz öffnen: oben auf der schmalen Edelstahlkante (oft eingelasert) oder rechts am Rand.",
  },
  {
    id: "fridge",
    label: "Kühlschrank",
    spotText:
      "Unterste Gemüseschublade vorziehen: meist an der linken oder rechten Innenwand unten.",
  },
  {
    id: "oven",
    label: "Backofen / Herd",
    spotText:
      "Backofentür öffnen: seitlich oder unten am Metallrahmen (selten unter der Bedienblende).",
  },
  {
    id: "dryer",
    label: "Trockner",
    spotText:
      "Tür öffnen: innen am Türrahmen oder hinter der unteren Wartungs-/Wärmetauscherklappe.",
  },
];

export default function PhotoAnleitungGuide({
  id = "photo-anleitung",
}: {
  id?: string;
}) {
  const [badMode, setBadMode] = useState<BadExampleMode>("flash");
  const [selectedSpot, setSelectedSpot] = useState<ApplianceSpotId>("washer");
  const [activeGoodHotspotId, setActiveGoodHotspotId] = useState<string>(
    GOOD_PHOTO_HOTSPOTS[0].id
  );
  const [activeBadHotspotId, setActiveBadHotspotId] = useState<string>(
    BAD_EXAMPLE_MODES[0].hotspots[0].id
  );
  const [goodImgError, setGoodImgError] = useState(false);
  const [badImgErrors, setBadImgErrors] = useState<Record<string, boolean>>({});
  const prefersReducedMotion = useReducedMotion();

  const activeBad =
    BAD_EXAMPLE_MODES.find((item) => item.id === badMode) ??
    BAD_EXAMPLE_MODES[0];
  const activeGoodHotspot =
    GOOD_PHOTO_HOTSPOTS.find((h) => h.id === activeGoodHotspotId) ??
    GOOD_PHOTO_HOTSPOTS[0];
  const activeBadHotspot =
    activeBad.hotspots.find((h) => h.id === activeBadHotspotId) ??
    activeBad.hotspots[0];
  const activeSpot =
    APPLIANCE_SPOTS.find((item) => item.id === selectedSpot) ??
    APPLIANCE_SPOTS[0];

  const handleBadModeChange = (nextMode: BadExampleMode) => {
    triggerHapticFeedback(20);
    setBadMode(nextMode);
    const nextSpec = BAD_EXAMPLE_MODES.find((m) => m.id === nextMode);
    if (nextSpec?.hotspots[0]) {
      setActiveBadHotspotId(nextSpec.hotspots[0].id);
    }
  };

  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      data-testid="photo-anleitung-guide"
      className="scroll-mt-28 rounded-2xl border border-primary/12 dark:border-white/12 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm space-y-4"
    >
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-primary/8 dark:border-white/10 pb-3">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-accent">
            <Camera size={13} className="shrink-0" aria-hidden="true" />
            <span>Photo-Anleitung</span>
            <span aria-hidden="true" className="text-ink-faint">
              ·
            </span>
            <span className="text-ink-muted">Typenschild (E-Nr. / PNC)</span>
          </div>
          <h2
            id={`${id}-heading`}
            className="text-base sm:text-lg font-extrabold tracking-tight text-primary dark:text-white"
          >
            Typenschild richtig fotografieren
          </h2>
        </div>
        <p className="text-xs text-ink-muted shrink-0">
          Punkte antippen oder hovern für Tipps
        </p>
      </div>

      {/* Side-by-Side Comparative Images (Good vs. Bad) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch">
        {/* LEFT: GOOD PHOTO */}
        <article
          data-testid="photo-guide-good-card"
          className="flex flex-col rounded-xl border border-emerald-500/35 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06] p-3 space-y-2.5"
        >
          <div className="flex items-center justify-between gap-2 min-h-[34px]">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 size={16} className="shrink-0" aria-hidden="true" />
              <h3 className="text-xs sm:text-sm font-extrabold">
                Gutes Foto
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700/90 dark:text-emerald-300/90">
              Frontal · Kein Blitz
            </span>
          </div>

          {/* Photo Frame */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-emerald-600/30 bg-slate-900 shadow-inner group">
            {!goodImgError ? (
              <img
                src={goodTypenschildImg}
                alt="Gutes Beispiel Typenschild: Frontal, scharf und ohne Blitz"
                referrerPolicy="no-referrer"
                onError={() => setGoodImgError(true)}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.015]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-800 p-4 text-center text-xs font-bold text-white">
                Gutes Beispiel: Gerade &amp; ohne Blitz
              </div>
            )}

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent"
            />

            {GOOD_PHOTO_HOTSPOTS.map((spot) => {
              const isActive = spot.id === activeGoodHotspot.id;
              const alignClass =
                spot.xPercent >= 60
                  ? "right-0"
                  : spot.xPercent <= 35
                  ? "left-0"
                  : "left-1/2 -translate-x-1/2";
              const verticalClass =
                spot.yPercent >= 58 ? "bottom-full mb-1.5" : "top-full mt-1.5";

              return (
                <div
                  key={spot.id}
                  style={{ left: `${spot.xPercent}%`, top: `${spot.yPercent}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                >
                  <button
                    type="button"
                    onMouseEnter={() => setActiveGoodHotspotId(spot.id)}
                    onFocus={() => setActiveGoodHotspotId(spot.id)}
                    onClick={() => {
                      triggerHapticFeedback(18);
                      setActiveGoodHotspotId(spot.id);
                    }}
                    aria-label={`${spot.tooltipTitle}: ${spot.tooltipText}`}
                    aria-pressed={isActive}
                    aria-describedby={`tooltip-${spot.id}`}
                    data-testid={`photo-guide-hotspot-${spot.id}`}
                    className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[11px] font-extrabold shadow-md transition-transform cursor-pointer touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                      isActive
                        ? "scale-110 border-white bg-emerald-600 text-white ring-4 ring-emerald-400/35"
                        : "border-white/90 bg-slate-900/90 text-emerald-300 hover:scale-105 hover:bg-emerald-600 hover:text-white"
                    }`}
                  >
                    {spot.label}
                  </button>

                  {/* Hover/Focus Desktop Tooltip */}
                  <div
                    id={`tooltip-${spot.id}`}
                    role="tooltip"
                    className={`hidden sm:block pointer-events-none absolute ${alignClass} ${verticalClass} z-30 w-48 rounded-lg border border-emerald-400/40 bg-slate-950/95 px-2.5 py-2 text-left text-white shadow-xl transition-all duration-150 ${
                      isActive
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-1"
                    }`}
                  >
                    <p className="text-[11px] font-extrabold text-emerald-300 leading-tight">
                      {spot.tooltipTitle}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-200 leading-snug">
                      {spot.tooltipText}
                    </p>
                  </div>
                </div>
              );
            })}

            <div className="pointer-events-none absolute bottom-2 left-2 z-10 inline-flex items-center gap-1 rounded-lg bg-emerald-700/90 px-2 py-0.5 text-[11px] font-bold text-white">
              <Check size={11} aria-hidden="true" />
              <span>Alles lesbar</span>
            </div>
          </div>

          {/* Single Compact Tooltip Readout Bar */}
          <div
            role="status"
            aria-live="polite"
            data-testid="photo-guide-good-tooltip-detail"
            className="flex items-start justify-between gap-2 rounded-lg bg-white dark:bg-slate-900/95 border border-emerald-500/20 px-2.5 py-2 text-xs"
          >
            <div className="min-w-0 leading-snug">
              <span className="inline-flex items-center gap-1 font-extrabold text-emerald-700 dark:text-emerald-300">
                <Info size={12} className="shrink-0" aria-hidden="true" />
                <span>{activeGoodHotspot.tooltipTitle}:</span>
              </span>{" "}
              <span className="text-ink-muted">{activeGoodHotspot.tooltipText}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0 pt-0.5">
              {GOOD_PHOTO_HOTSPOTS.map((spot) => (
                <button
                  key={spot.id}
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback(15);
                    setActiveGoodHotspotId(spot.id);
                  }}
                  aria-label={`Punkt ${spot.label}: ${spot.tooltipTitle}`}
                  className={`h-6 min-w-[24px] rounded px-1.5 text-[11px] font-extrabold transition-colors cursor-pointer touch-manipulation ${
                    spot.id === activeGoodHotspot.id
                      ? "bg-emerald-600 text-white"
                      : "bg-primary/5 dark:bg-white/10 text-ink-muted hover:text-primary dark:hover:text-white"
                  }`}
                >
                  {spot.label}
                </button>
              ))}
            </div>
          </div>
        </article>

        {/* RIGHT: BAD PHOTO */}
        <article
          data-testid="photo-guide-bad-card"
          className="flex flex-col rounded-xl border border-red-500/30 bg-red-500/[0.03] dark:bg-red-500/[0.05] p-3 space-y-2.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 min-h-[34px]">
            <div className="flex items-center gap-1.5 text-red-700 dark:text-red-300">
              <XCircle size={16} className="shrink-0" aria-hidden="true" />
              <h3 className="text-xs sm:text-sm font-extrabold">
                Schlechtes Foto
              </h3>
            </div>

            {/* Compact Defect Switcher */}
            <div
              role="group"
              aria-label="Typischen Fotofehler wählen"
              className="inline-grid grid-cols-3 gap-0.5 rounded-lg bg-primary/5 dark:bg-white/5 p-0.5"
            >
              {BAD_EXAMPLE_MODES.map((item) => {
                const isActive = item.id === badMode;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleBadModeChange(item.id)}
                    aria-pressed={isActive}
                    data-testid={`photo-guide-bad-tab-${item.id}`}
                    className={`min-h-[30px] rounded-md px-2 py-0.5 text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap touch-manipulation ${
                      isActive
                        ? "bg-white dark:bg-slate-800 text-red-700 dark:text-red-300 shadow-2xs ring-1 ring-red-500/25"
                        : "text-ink-muted hover:text-primary dark:hover:text-white"
                    }`}
                  >
                    {item.tabLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Photo Frame */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-red-600/30 bg-slate-950 shadow-inner group">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeBad.id}
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0.45 }}
                animate={{ opacity: 1 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0.45 }}
                transition={{ duration: 0.16 }}
                className="relative h-full w-full"
              >
                {!badImgErrors[activeBad.id] ? (
                  <img
                    src={activeBad.imageSrc}
                    alt={activeBad.imageAlt}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setBadImgErrors((prev) => ({
                        ...prev,
                        [activeBad.id]: true,
                      }))
                    }
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.015]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-900 p-4 text-center text-xs font-bold text-white">
                    {activeBad.problemTitle}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent"
            />

            {activeBad.hotspots.map((spot) => {
              const isActive = spot.id === activeBadHotspot.id;
              const alignClass =
                spot.xPercent >= 62
                  ? "right-0"
                  : spot.xPercent <= 35
                  ? "left-0"
                  : "left-1/2 -translate-x-1/2";
              const verticalClass =
                spot.yPercent >= 56 ? "bottom-full mb-1.5" : "top-full mt-1.5";

              return (
                <div
                  key={spot.id}
                  style={{ left: `${spot.xPercent}%`, top: `${spot.yPercent}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                >
                  <button
                    type="button"
                    onMouseEnter={() => setActiveBadHotspotId(spot.id)}
                    onFocus={() => setActiveBadHotspotId(spot.id)}
                    onClick={() => {
                      triggerHapticFeedback(18);
                      setActiveBadHotspotId(spot.id);
                    }}
                    aria-label={`${spot.tooltipTitle}: ${spot.tooltipText}`}
                    aria-pressed={isActive}
                    aria-describedby={`tooltip-${spot.id}`}
                    data-testid={`photo-guide-hotspot-${spot.id}`}
                    className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[11px] font-extrabold shadow-md transition-transform cursor-pointer touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                      isActive
                        ? "scale-110 border-white bg-red-600 text-white ring-4 ring-red-400/35"
                        : "border-white/90 bg-slate-900/90 text-red-300 hover:scale-105 hover:bg-red-600 hover:text-white"
                    }`}
                  >
                    {spot.label}
                  </button>

                  {/* Hover/Focus Desktop Tooltip */}
                  <div
                    id={`tooltip-${spot.id}`}
                    role="tooltip"
                    className={`hidden sm:block pointer-events-none absolute ${alignClass} ${verticalClass} z-30 w-48 rounded-lg border border-red-400/40 bg-slate-950/95 px-2.5 py-2 text-left text-white shadow-xl transition-all duration-150 ${
                      isActive
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-1"
                    }`}
                  >
                    <p className="text-[11px] font-extrabold text-red-300 leading-tight">
                      {spot.tooltipTitle}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-200 leading-snug">
                      {spot.tooltipText}
                    </p>
                  </div>
                </div>
              );
            })}

            <div className="pointer-events-none absolute bottom-2 left-2 z-10 inline-flex items-center gap-1 rounded-lg bg-red-700/95 px-2 py-0.5 text-[11px] font-bold text-white">
              {badMode === "flash" ? (
                <Flashlight size={11} aria-hidden="true" />
              ) : badMode === "blur" ? (
                <EyeOff size={11} aria-hidden="true" />
              ) : (
                <Maximize2 size={11} aria-hidden="true" />
              )}
              <span>{activeBad.problemTitle}</span>
            </div>
          </div>

          {/* Single Compact Tooltip Readout Bar */}
          <div
            role="status"
            aria-live="polite"
            data-testid="photo-guide-bad-tooltip-detail"
            className="flex items-start justify-between gap-2 rounded-lg bg-white dark:bg-slate-900/95 border border-red-500/20 px-2.5 py-2 text-xs"
          >
            <div className="min-w-0 leading-snug">
              <span className="inline-flex items-center gap-1 font-extrabold text-red-700 dark:text-red-300">
                <AlertTriangle size={12} className="shrink-0" aria-hidden="true" />
                <span>{activeBadHotspot.tooltipTitle}:</span>
              </span>{" "}
              <span className="text-ink-muted">{activeBadHotspot.tooltipText}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0 pt-0.5">
              {activeBad.hotspots.map((spot) => (
                <button
                  key={spot.id}
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback(15);
                    setActiveBadHotspotId(spot.id);
                  }}
                  aria-label={spot.tooltipTitle}
                  className={`h-6 min-w-[24px] rounded px-1.5 text-[11px] font-extrabold transition-colors cursor-pointer touch-manipulation ${
                    spot.id === activeBadHotspot.id
                      ? "bg-red-600 text-white"
                      : "bg-primary/5 dark:bg-white/10 text-ink-muted hover:text-primary dark:hover:text-white"
                  }`}
                >
                  {spot.label}
                </button>
              ))}
            </div>
          </div>
        </article>
      </div>

      {/* Compact Single-Row Appliance Sticker Spot Bar */}
      <div className="rounded-xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-950/60 p-3 space-y-2">
        <div className="flex overflow-x-auto snap-x snap-proximity sm:snap-none no-scrollbar touch-pan-x gap-1.5 sm:flex-wrap sm:overflow-visible">
          {APPLIANCE_SPOTS.map((spot) => {
            const isSelected = spot.id === selectedSpot;
            return (
              <button
                key={spot.id}
                type="button"
                onClick={() => {
                  triggerHapticFeedback(18);
                  setSelectedSpot(spot.id);
                }}
                aria-pressed={isSelected}
                data-testid={`photo-guide-spot-${spot.id}`}
                className={`min-h-[36px] sm:min-h-[32px] shrink-0 snap-start rounded-lg border px-2.5 py-1 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer touch-manipulation ${
                  isSelected
                    ? "border-accent bg-accent text-white shadow-2xs"
                    : "border-primary/12 dark:border-white/12 bg-white dark:bg-slate-900 text-ink-muted hover:text-primary dark:hover:text-white hover:border-accent/45"
                }`}
              >
                {spot.label}
              </button>
            );
          })}
        </div>

        <p className="flex items-start gap-2 text-xs text-primary dark:text-slate-200 leading-snug">
          <MapPin size={13} className="text-accent shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            <strong className="font-bold">Fundort:</strong> {activeSpot.spotText}
          </span>
        </p>
      </div>
    </section>
  );
}
