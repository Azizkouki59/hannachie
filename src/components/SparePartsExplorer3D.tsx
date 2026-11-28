"use client";

import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  Layers,
  MapPin,
  MessageCircle,
  Move3d,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Tag,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  EXPLORER_APPLIANCES,
  getApplianceMeta,
  type ExplorerApplianceId,
  type PartFailureFrequency,
} from "@/components/explorer3d/types";
import { FadeUp, RevealText } from "@/components/animations";
import {
  buildWhatsAppDirectUrl,
  formatQuickWhatsAppMessage,
} from "@/utils/whatsapp";
import { hapticTap, triggerHapticFeedback } from "@/lib/haptics";

const LazyExplorer3DCanvas = lazy(
  () => import("@/components/explorer3d/Explorer3DCanvas"),
);

export interface SparePartsExplorer3DProps {
  activeAppliance: ExplorerApplianceId;
  onChangeAppliance: (id: ExplorerApplianceId) => void;
  onRequestPart: (deviceValue: string, symptomText: string) => void;
  onRequestOtherDevice: () => void;
}

const TOTAL_PARTS_COUNT = EXPLORER_APPLIANCES.reduce(
  (sum, app) => sum + app.parts.length,
  0,
);

function getFrequencyBadgeClass(freq: PartFailureFrequency): string {
  switch (freq) {
    case "Sehr häufig":
      return "border-amber-500/30 bg-amber-500/12 text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-300";
    case "Häufig":
      return "border-accent/25 bg-accent/10 text-accent-dark dark:border-sky-400/30 dark:bg-sky-500/15 dark:text-sky-300";
    default:
      return "border-primary/15 bg-slate-100 text-primary/80 dark:border-white/15 dark:bg-slate-800 dark:text-slate-300";
  }
}

function StudioFallbackPoster({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-slate-100 via-slate-100 to-slate-200/80 dark:from-primary-dark dark:via-[#0b203a] dark:to-slate-950 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/12 dark:border-white/15 bg-white dark:bg-slate-900 text-accent shadow-sm">
        <Layers size={22} aria-hidden="true" />
      </div>
      <p className="mt-3 text-xs font-extrabold uppercase tracking-[0.16em] text-accent">
        3D-Bauteilansicht · {label}
      </p>
      <p className="mt-1 text-xs text-ink-muted">
        Wird lokal geladen, ohne externe Skripte…
      </p>
    </div>
  );
}

export default function SparePartsExplorer3D({
  activeAppliance,
  onChangeAppliance,
  onRequestPart,
  onRequestOtherDevice,
}: SparePartsExplorer3DProps) {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const sectionRef = useRef<HTMLElement>(null);
  const detailDrawerRef = useRef<HTMLDivElement>(null);

  // Lazy-mount WebGL only once section nears viewport (protects Hero 0ms LCP)
  const [shouldMountWebGL, setShouldMountWebGL] = useState(false);

  // Start slightly exploded so internal spare parts are immediately legible
  const [explodePct, setExplodePct] = useState<number>(38);
  const [xrayMode, setXrayMode] = useState<boolean>(false);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [activeSymptomId, setActiveSymptomId] = useState<string | null>(null);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const [cameraPreset, setCameraPreset] = useState<{
    mode: "overview" | "interior" | "reset";
    seq: number;
  }>({ mode: "overview", seq: 0 });
  const [zoomAction, setZoomAction] = useState<{
    dir: "in" | "out";
    seq: number;
  }>({ dir: "in", seq: 0 });

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setExplodePct(30);
    }
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || shouldMountWebGL) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldMountWebGL(true);
          io.disconnect();
        }
      },
      { rootMargin: "320px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shouldMountWebGL]);

  // Clear selection cleanly when switching appliance
  useEffect(() => {
    setSelectedPartId(null);
    setActiveSymptomId(null);
  }, [activeAppliance]);

  const activeMeta = getApplianceMeta(activeAppliance);
  const selectedPart =
    activeMeta.parts.find((p) => p.id === selectedPartId) ?? null;

  const activeSymptom =
    activeMeta.symptomShortcuts.find((s) => s.id === activeSymptomId) ?? null;

  const secondaryPartIds = useMemo(() => {
    if (!activeSymptom) return [];
    return activeSymptom.partIds.filter((id) => id !== selectedPartId);
  }, [activeSymptom, selectedPartId]);

  const secondaryParts = useMemo(
    () => activeMeta.parts.filter((p) => secondaryPartIds.includes(p.id)),
    [activeMeta.parts, secondaryPartIds],
  );

  const handleSelectAppliance = (id: ExplorerApplianceId) => {
    hapticTap();
    onChangeAppliance(id);
    setSelectedPartId(null);
    setActiveSymptomId(null);
  };

  const handleSelectPart = (partId: string | null) => {
    if (partId) {
      hapticTap();
      setHasInteracted(true);
      if (explodePct < 42) {
        setExplodePct(58);
      }
      if (activeSymptom && !activeSymptom.partIds.includes(partId)) {
        setActiveSymptomId(null);
      }
    } else {
      setActiveSymptomId(null);
    }
    setSelectedPartId(partId);
  };

  const handleSelectSymptom = (symptomId: string) => {
    hapticTap();
    setHasInteracted(true);
    if (activeSymptomId === symptomId) {
      setActiveSymptomId(null);
      setSelectedPartId(null);
      return;
    }
    const shortcut = activeMeta.symptomShortcuts.find((s) => s.id === symptomId);
    if (!shortcut || shortcut.partIds.length === 0) return;
    setActiveSymptomId(symptomId);
    setExplodePct((prev) => Math.max(prev, 64));
    setSelectedPartId(shortcut.partIds[0]);
  };

  const scrollToDetailDrawer = () => {
    hapticTap();
    detailDrawerRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "nearest",
    });
  };

  const triggerPreset = (mode: "overview" | "interior" | "reset") => {
    hapticTap();
    setHasInteracted(true);
    if (mode === "reset") {
      setSelectedPartId(null);
      setActiveSymptomId(null);
      setXrayMode(false);
      setExplodePct(typeof window !== "undefined" && window.innerWidth < 640 ? 30 : 38);
    } else if (mode === "interior") {
      setExplodePct((prev) => Math.max(prev, 72));
    } else if (mode === "overview") {
      setSelectedPartId(null);
      setActiveSymptomId(null);
      setExplodePct(24);
    }
    setCameraPreset((prev) => ({ mode, seq: prev.seq + 1 }));
  };

  const triggerZoom = (dir: "in" | "out") => {
    hapticTap();
    setHasInteracted(true);
    setZoomAction((prev) => ({ dir, seq: prev.seq + 1 }));
  };

  const handleToggleXray = () => {
    hapticTap();
    setHasInteracted(true);
    setXrayMode((prev) => !prev);
  };

  const handleInquiryPart = () => {
    if (!selectedPart) return;
    triggerHapticFeedback(40);
    onRequestPart(activeMeta.formDeviceValue, selectedPart.inquirySymptom);
  };

  return (
    <section
      ref={sectionRef}
      id="3d-explorer"
      aria-labelledby="explorer-3d-heading"
      className="section relative scroll-mt-16 lg:scroll-mt-20 border-b border-primary/8 dark:border-white/10 bg-surface dark:bg-slate-950"
    >
      <div className="container-page">
        {/* Clean Editorial Section Header */}
        <FadeUp>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-5 sm:mb-7">
            <div className="max-w-2xl">
              <p className="eyebrow">
                Interaktiver 3D-Bauteil-Explorer · {EXPLORER_APPLIANCES.length} Gerätearten ·{" "}
                {TOTAL_PARTS_COUNT} Original-Ersatzteile
              </p>
              <h2
                id="explorer-3d-heading"
                className="mt-1.5 text-2xl font-extrabold text-primary dark:text-slate-100 sm:text-3xl lg:text-[34px] text-balance"
              >
                <RevealText
                  segments={[{ text: "Benötigtes Ersatzteil im 3D-Modell sicher erkennen" }]}
                />
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-ink-muted">
                Gerät wählen, Symptom antippen oder frei in 360° drehen. Wir prüfen das passende
                Originalteil genau nach Ihrem Typenschild.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                hapticTap();
                onRequestOtherDevice();
              }}
              className="group inline-flex self-start sm:self-auto min-h-[44px] sm:min-h-[40px] items-center gap-1.5 text-xs font-extrabold text-accent hover:text-accent-dark dark:text-accent-light transition-colors cursor-pointer touch-manipulation shrink-0"
            >
              <span>Anderes Gerät? Direkt anfragen</span>
              <ArrowRight
                size={14}
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </button>
          </div>
        </FadeUp>

        {/* Flagship Studio Diagnostic Frame */}
        <div className="relative overflow-hidden rounded-3xl border border-primary/12 dark:border-white/12 bg-white dark:bg-slate-900 shadow-[0_24px_60px_-24px_rgba(15,42,74,0.28)] dark:shadow-[0_28px_64px_-24px_rgba(2,6,23,0.85)]">
          {/* Unified Top Studio Command Header: 6-Appliance Selector + 1-Tap Symptom Finder */}
          <div className="border-b border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900">
            {/* Row 1: Unified 6-Appliance Segmented Bar (consistent on mobile, tablet & desktop!) */}
            <div className="px-3 pt-3 pb-2.5 sm:px-5 sm:pt-4 sm:pb-3">
              <div
                role="tablist"
                aria-label="Haushaltsgerät im 3D-Explorer wählen"
                className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 rounded-2xl bg-slate-100/95 dark:bg-slate-800/90 p-1.5"
              >
                {EXPLORER_APPLIANCES.map((app) => {
                  const isActive = app.id === activeAppliance;
                  return (
                    <button
                      key={app.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      data-compact-label="true"
                      onClick={() => handleSelectAppliance(app.id)}
                      className={`min-h-[44px] sm:min-h-[40px] rounded-xl px-2 py-1.5 text-[11.5px] sm:text-xs font-extrabold transition-all active:scale-[0.98] cursor-pointer touch-manipulation flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 min-w-0 ${
                        isActive
                          ? "bg-primary dark:bg-accent text-white shadow-sm"
                          : "text-primary/80 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700/80 hover:text-primary dark:hover:text-white"
                      }`}
                    >
                      <span className="truncate">{app.shortLabel}</span>
                      <span
                        className={`hidden md:inline-flex items-center justify-center rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums ${
                          isActive
                            ? "bg-white/18 text-white"
                            : "bg-primary/6 dark:bg-white/10 text-ink-muted dark:text-slate-400"
                        }`}
                      >
                        {app.parts.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 2: 1-Tap Symptom-Schnellfinder (swipe carousel on phones, crisp wrap on sm+) */}
            <div className="border-t border-primary/6 dark:border-white/8 bg-slate-50/70 dark:bg-slate-900/60 px-3 py-2.5 sm:px-5 sm:py-3">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
                <div className="flex items-center justify-between gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.1em] text-primary dark:text-slate-200">
                    <AlertCircle size={13} className="text-accent shrink-0" aria-hidden="true" />
                    <span>Welches Problem tritt auf?</span>
                  </span>
                  {activeSymptom && (
                    <button
                      type="button"
                      onClick={() => {
                        hapticTap();
                        setActiveSymptomId(null);
                        setSelectedPartId(null);
                      }}
                      className="inline-flex min-h-[40px] items-center gap-1 rounded-lg px-2.5 text-[11px] font-bold text-ink-muted hover:text-accent transition-colors cursor-pointer touch-manipulation lg:hidden"
                    >
                      <X size={13} aria-hidden="true" />
                      <span>Filter lösen</span>
                    </button>
                  )}
                </div>

                <div className="relative min-w-0 flex-1">
                  <div
                    role="group"
                    aria-label={`Häufige Probleme bei ${activeMeta.label}`}
                    className="-mx-3 px-3 pr-9 sm:mx-0 sm:px-0 sm:pr-0 flex flex-nowrap sm:flex-wrap items-center gap-1.5 overflow-x-auto sm:overflow-visible snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-0.5 sm:pb-0"
                  >
                    {activeMeta.symptomShortcuts.map((shortcut) => {
                      const isActive = activeSymptomId === shortcut.id;
                      return (
                        <button
                          key={shortcut.id}
                          type="button"
                          onClick={(e) => {
                            handleSelectSymptom(shortcut.id);
                            if (typeof window !== "undefined" && window.innerWidth < 640) {
                              e.currentTarget.scrollIntoView({
                                behavior: prefersReducedMotion ? "auto" : "smooth",
                                inline: "center",
                                block: "nearest",
                              });
                            }
                          }}
                          aria-pressed={isActive}
                          className={`snap-start shrink-0 inline-flex min-h-[44px] sm:min-h-[32px] items-center gap-1.5 rounded-xl sm:rounded-lg border px-3 sm:px-2.5 py-2 sm:py-1 text-xs sm:text-[11.5px] font-bold transition-all active:scale-[0.97] cursor-pointer touch-manipulation whitespace-nowrap ${
                            isActive
                              ? "border-amber-500 bg-amber-500 text-white shadow-xs"
                              : "border-primary/12 dark:border-white/12 bg-white dark:bg-slate-800/90 text-primary dark:text-slate-200 hover:border-accent hover:text-accent"
                          }`}
                        >
                          <span>{shortcut.label}</span>
                          {shortcut.partIds.length > 1 && (
                            <span
                              className={`rounded px-1 py-0.2 font-mono text-[9.5px] font-black ${
                                isActive
                                  ? "bg-white/25 text-white"
                                  : "bg-primary/8 dark:bg-white/10 text-ink-muted dark:text-slate-300"
                              }`}
                            >
                              {shortcut.partIds.length} Teile
                            </span>
                          )}
                        </button>
                      );
                    })}
                    {activeSymptom && (
                      <button
                        type="button"
                        onClick={() => {
                          hapticTap();
                          setActiveSymptomId(null);
                          setSelectedPartId(null);
                        }}
                        className="hidden lg:inline-flex min-h-[32px] items-center gap-1 rounded-lg px-2 text-[11px] font-bold text-ink-muted hover:text-accent transition-colors cursor-pointer touch-manipulation"
                      >
                        <X size={12} aria-hidden="true" />
                        <span>Zurücksetzen</span>
                      </button>
                    )}
                  </div>
                  {/* Subtle mobile swipe-right affordance gradient */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none sm:hidden absolute inset-y-0 -right-3 w-9 bg-gradient-to-l from-slate-50 via-slate-50/85 to-transparent dark:from-slate-900 dark:via-slate-900/85"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Interactive 3D WebGL Stage (Unobstructed center viewport across every screen size) */}
          <div className="relative h-[clamp(310px,47dvh,395px)] sm:h-[410px] md:h-[460px] lg:h-[530px] xl:h-[570px] w-full bg-slate-100 dark:bg-primary-dark">
            {shouldMountWebGL ? (
              <Suspense fallback={<StudioFallbackPoster label={activeMeta.label} />}>
                <LazyExplorer3DCanvas
                  applianceId={activeAppliance}
                  explode={explodePct / 100}
                  selectedPartId={selectedPartId}
                  secondaryPartIds={secondaryPartIds}
                  xrayMode={xrayMode}
                  cameraPreset={cameraPreset}
                  zoomAction={zoomAction}
                  prefersReducedMotion={prefersReducedMotion}
                  onSelectPart={handleSelectPart}
                  onUserInteract={() => setHasInteracted(true)}
                />
              </Suspense>
            ) : (
              <StudioFallbackPoster label={activeMeta.label} />
            )}

            {/* Top-Left Minimal Context Chip (strictly clear of top-right toolbar at every viewport) */}
            <div className="pointer-events-none absolute top-3 left-3 z-20 max-w-[calc(100%-202px)] sm:max-w-[calc(100%-276px)] md:max-w-[calc(100%-312px)]">
              <div className="inline-flex max-w-full items-center gap-2 rounded-xl border border-primary/12 dark:border-white/15 bg-white/95 dark:bg-slate-900/95 px-2.5 sm:px-3 py-2 sm:py-1.5 text-[11px] font-extrabold text-primary dark:text-white shadow-sm min-w-0">
                <Move3d size={13} className="text-accent shrink-0" aria-hidden="true" />
                <span className="truncate">{activeMeta.label}</span>
                <span className="hidden lg:inline text-primary/25 dark:text-white/25 shrink-0">·</span>
                <span className="hidden lg:inline font-semibold text-ink-muted dark:text-slate-300 truncate">
                  360° frei drehen · Bauteil antippen
                </span>
              </div>
            </div>

            {/* Top-Right Unified Studio Viewport Toolbar (Zero backdrop-filter, crisp grouped bar) */}
            <div className="absolute top-3 right-3 z-20 inline-flex items-center rounded-xl border border-primary/12 dark:border-white/15 bg-white/95 dark:bg-slate-900/95 p-0.5 shadow-sm">
              <button
                type="button"
                onClick={handleToggleXray}
                aria-pressed={xrayMode}
                title="Röntgenansicht (Gehäuse transparent)"
                aria-label="Röntgenansicht umschalten"
                className={`inline-flex h-10 w-10 sm:h-8 sm:w-auto sm:px-2.5 items-center justify-center gap-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95 cursor-pointer touch-manipulation ${
                  xrayMode
                    ? "bg-accent text-white shadow-xs"
                    : "text-primary dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-accent"
                }`}
              >
                <Eye size={15} className="sm:h-[13px] sm:w-[13px]" aria-hidden="true" />
                <span className="hidden sm:inline">Röntgen</span>
              </button>

              <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-primary/12 dark:bg-white/12" />

              <button
                type="button"
                onClick={() => triggerZoom("in")}
                title="Heranzoomen"
                aria-label="3D-Modell heranzoomen"
                className="inline-flex h-10 w-10 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-primary dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-accent transition-all active:scale-95 cursor-pointer touch-manipulation"
              >
                <ZoomIn size={16} className="sm:h-[14px] sm:w-[14px]" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => triggerZoom("out")}
                title="Herauszoomen"
                aria-label="3D-Modell herauszoomen"
                className="inline-flex h-10 w-10 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-primary dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-accent transition-all active:scale-95 cursor-pointer touch-manipulation"
              >
                <ZoomOut size={16} className="sm:h-[14px] sm:w-[14px]" aria-hidden="true" />
              </button>

              <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-primary/12 dark:bg-white/12" />

              <button
                type="button"
                onClick={() => triggerPreset("reset")}
                title="Ansicht zurücksetzen"
                aria-label="3D-Ansicht zurücksetzen"
                className="inline-flex h-10 w-10 sm:h-8 sm:w-auto sm:px-2.5 items-center justify-center gap-1.5 rounded-lg text-[11px] font-bold text-primary dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-accent transition-all active:scale-95 cursor-pointer touch-manipulation"
              >
                <RotateCcw size={15} className="sm:h-[13px] sm:w-[13px]" aria-hidden="true" />
                <span className="hidden md:inline">Reset</span>
              </button>
            </div>

            {/* Mobile Instant Selected-Part Pill OR Clean Gesture Hint inside 3D Viewport */}
            {selectedPart ? (
              <div className="md:hidden absolute inset-x-3 bottom-3 z-20 flex justify-center pointer-events-none">
                <button
                  type="button"
                  onClick={scrollToDetailDrawer}
                  className="pointer-events-auto inline-flex max-w-full min-h-[44px] items-center gap-2 rounded-xl border border-emerald-500/40 bg-white/96 dark:bg-slate-900/96 px-3.5 py-2 text-xs font-extrabold text-primary dark:text-white shadow-[0_8px_22px_-8px_rgba(15,23,42,0.55)] active:scale-[0.98] transition-transform cursor-pointer touch-manipulation"
                >
                  <span dir="ltr" translate="no" className="notranslate inline-flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 font-mono text-[10px] font-black text-white tabular-nums shrink-0">
                    {selectedPart.code}
                  </span>
                  <span className="truncate">{selectedPart.name}</span>
                  <span className="inline-flex items-center gap-0.5 text-[10.5px] font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                    <span>Details</span>
                    <ArrowDown size={12} aria-hidden="true" />
                  </span>
                </button>
              </div>
            ) : (
              !hasInteracted && (
                <div className="lg:hidden pointer-events-none absolute inset-x-3 bottom-3 z-20 flex justify-center">
                  <span className="max-w-full truncate rounded-full border border-primary/12 dark:border-white/15 bg-white/95 dark:bg-slate-900/95 px-3 py-1.5 text-[10px] min-[375px]:text-[10.5px] font-bold text-primary/85 dark:text-slate-200 shadow-xs">
                    360° frei ziehen · 2 Finger zum Zoomen · Teil antippen
                  </span>
                </div>
              )
            )}

            {/* Desktop Sleek Minimal Collapsible Bottom Pill (ONLY Explosion + Presets — zero crowding!) */}
            <div className="hidden lg:flex pointer-events-none absolute inset-x-4 bottom-3.5 z-20 justify-center">
              <div className="pointer-events-auto rounded-2xl border border-primary/14 dark:border-white/15 bg-white/96 dark:bg-slate-900/96 px-3 py-2 shadow-[0_14px_34px_-12px_rgba(15,23,42,0.45)]">
                {dockCollapsed ? (
                  <button
                    type="button"
                    onClick={() => setDockCollapsed(false)}
                    className="inline-flex items-center gap-2 px-1.5 py-0.5 text-xs font-extrabold text-primary dark:text-white hover:text-accent transition-colors cursor-pointer touch-manipulation"
                  >
                    <SlidersHorizontal size={13} className="text-accent" aria-hidden="true" />
                    <span>Explosionsansicht</span>
                    <ChevronUp size={14} aria-hidden="true" />
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2.5 text-xs font-bold text-primary dark:text-slate-200">
                      <span className="whitespace-nowrap">Explosionsansicht</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={explodePct}
                        onChange={(e) => {
                          setHasInteracted(true);
                          setExplodePct(Number(e.target.value));
                        }}
                        aria-label="Explosionsansicht einstellen"
                        className="h-1.5 w-36 cursor-pointer accent-accent rounded-full"
                      />
                      <span className="w-9 text-right font-mono text-[11px] font-extrabold text-accent tabular-nums">
                        {explodePct}%
                      </span>
                    </label>

                    <span
                      aria-hidden="true"
                      className="h-5 w-px bg-primary/12 dark:bg-white/12 shrink-0"
                    />

                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => triggerPreset("overview")}
                        className="rounded-lg border border-primary/12 dark:border-white/12 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-[11px] font-bold text-primary dark:text-slate-200 hover:border-accent hover:text-accent transition-colors cursor-pointer touch-manipulation"
                      >
                        Gesamt
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerPreset("interior")}
                        className="rounded-lg border border-primary/12 dark:border-white/12 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-[11px] font-bold text-primary dark:text-slate-200 hover:border-accent hover:text-accent transition-colors cursor-pointer touch-manipulation"
                      >
                        Innenleben
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDockCollapsed(true)}
                      aria-label="Steuerungsleiste ausblenden"
                      title="Ausblenden"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary dark:hover:text-white transition-colors cursor-pointer touch-manipulation shrink-0"
                    >
                      <ChevronDown size={15} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Compact Mobile & Tablet Explosion Controls (< 1024px: clean single-purpose strip) */}
          <div className="lg:hidden border-t border-primary/10 dark:border-white/10 bg-slate-50/70 dark:bg-slate-900/90 px-3 py-2.5 sm:px-5 sm:py-3">
            <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
              <label className="flex w-full sm:flex-1 items-center gap-3 min-h-[40px] text-xs font-bold text-primary dark:text-slate-200">
                <span className="shrink-0">Explosionsansicht</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={explodePct}
                  onChange={(e) => {
                    setHasInteracted(true);
                    setExplodePct(Number(e.target.value));
                  }}
                  aria-label="Explosionsansicht einstellen"
                  className="h-7 flex-1 cursor-pointer accent-accent touch-pan-x"
                />
                <span className="w-9 text-right font-mono text-xs font-extrabold text-accent tabular-nums">
                  {explodePct}%
                </span>
              </label>

              <div className="grid grid-cols-2 sm:inline-flex items-center gap-2 sm:gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => triggerPreset("overview")}
                  className="min-h-[44px] sm:min-h-[36px] rounded-xl sm:rounded-lg border border-primary/12 dark:border-white/15 bg-white dark:bg-slate-800 px-3 text-xs sm:text-[11px] font-bold text-primary dark:text-slate-200 hover:border-accent hover:text-accent transition-all active:scale-[0.98] cursor-pointer touch-manipulation"
                >
                  Gesamtansicht
                </button>
                <button
                  type="button"
                  onClick={() => triggerPreset("interior")}
                  className="min-h-[44px] sm:min-h-[36px] rounded-xl sm:rounded-lg border border-primary/12 dark:border-white/15 bg-white dark:bg-slate-800 px-3 text-xs sm:text-[11px] font-bold text-primary dark:text-slate-200 hover:border-accent hover:text-accent transition-all active:scale-[0.98] cursor-pointer touch-manipulation"
                >
                  Innenleben
                </button>
              </div>
            </div>
          </div>

          {/* Spare Parts Catalog Grid + Pro Diagnostic Inspector Panel */}
          <div className="border-t border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 px-3 py-3.5 sm:px-5 sm:py-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.11em] text-primary/70 dark:text-slate-300">
                Bauteile im Modell · {activeMeta.label} ({activeMeta.parts.length})
              </p>
              <p className="hidden sm:block text-[11px] font-medium text-ink-faint">
                {activeMeta.subtitle}
              </p>
            </div>

            {/* Clean Symmetric Part Selection Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {activeMeta.parts.map((part, idx) => {
                const isSelected = selectedPartId === part.id;
                const isSecondary = !isSelected && secondaryPartIds.includes(part.id);
                const isOddLastMobile =
                  activeMeta.parts.length % 2 === 1 && idx === activeMeta.parts.length - 1;
                return (
                  <button
                    key={part.id}
                    type="button"
                    onClick={() => handleSelectPart(isSelected ? null : part.id)}
                    aria-pressed={isSelected}
                    className={`${
                      isOddLastMobile ? "col-span-2 sm:col-span-1" : ""
                    } group inline-flex min-h-[44px] sm:min-h-[40px] items-center justify-start gap-1.5 sm:gap-2 rounded-xl border px-2 sm:px-2.5 py-2 sm:py-1.5 text-left text-[11.5px] sm:text-xs font-bold transition-all active:scale-[0.98] cursor-pointer touch-manipulation min-w-0 ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-600 text-white shadow-sm"
                        : isSecondary
                          ? "border-amber-500 bg-amber-50 dark:bg-amber-500/15 text-amber-900 dark:text-amber-200 ring-1 ring-amber-400/50"
                          : "border-primary/10 dark:border-white/10 bg-slate-50/80 dark:bg-slate-800/80 text-primary dark:text-slate-100 hover:border-accent/60 hover:bg-white dark:hover:bg-slate-800 hover:text-accent"
                    }`}
                  >
                    <span
                      data-compact-label="true"
                      dir="ltr"
                      translate="no"
                      className={`notranslate inline-flex h-5 w-5 items-center justify-center rounded-md font-mono text-[10px] font-black tabular-nums shrink-0 ${
                        isSelected
                          ? "bg-white/22 text-white"
                          : isSecondary
                            ? "bg-amber-500 text-white"
                            : "bg-white dark:bg-slate-900 text-accent dark:text-sky-300 border border-primary/8 dark:border-white/10"
                      }`}
                    >
                      {part.code}
                    </span>
                    <span className="min-w-0 truncate flex-1">{part.shortLabel}</span>
                    {!isSelected && part.frequency === "Sehr häufig" && (
                      <span
                        title="Sehr häufiges Verschleißteil"
                        className="text-[10px] font-black text-amber-600 dark:text-amber-400 shrink-0"
                        aria-hidden="true"
                      >
                        ★
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Part Pro Diagnostic Inspector Drawer */}
            <div ref={detailDrawerRef} className="scroll-mt-20">
              <AnimatePresence initial={false} mode="wait">
                {selectedPart ? (
                  <motion.div
                    key={`${activeAppliance}-${selectedPart.id}`}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReducedMotion ? undefined : { opacity: 0, y: -4 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-4 overflow-hidden rounded-2xl border border-emerald-500/30 dark:border-emerald-400/25 bg-gradient-to-br from-emerald-50/65 via-white to-slate-50/70 dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 shadow-sm"
                  >
                    <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-12 lg:items-start lg:gap-6">
                      {/* Left 8 Columns: Complete German Technical Diagnosis */}
                      <div className="lg:col-span-8 min-w-0 space-y-3">
                        {/* Title Row */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2 min-w-0">
                            <span dir="ltr" translate="no" className="notranslate inline-flex items-center rounded-lg bg-emerald-600 px-2 py-0.5 font-mono text-[11px] font-black text-white tabular-nums shrink-0">
                              {selectedPart.code}
                            </span>
                            <h3 className="text-base sm:text-lg font-extrabold text-primary dark:text-white leading-snug">
                              {selectedPart.name}
                            </h3>
                            <span
                              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10.5px] font-bold ${getFrequencyBadgeClass(
                                selectedPart.frequency,
                              )}`}
                            >
                              {selectedPart.frequency}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPartId(null);
                              setActiveSymptomId(null);
                            }}
                            aria-label="Bauteil-Auswahl schließen"
                            className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] sm:h-9 sm:w-9 sm:min-h-[36px] sm:min-w-[36px] shrink-0 items-center justify-center rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-800 text-ink-muted hover:text-primary dark:hover:text-white active:scale-95 transition-all cursor-pointer touch-manipulation"
                          >
                            <X size={16} aria-hidden="true" />
                          </button>
                        </div>

                        {/* Mounting Location & Technical Alias */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-muted dark:text-slate-300">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-primary/90 dark:text-slate-200">
                            <MapPin size={13} className="text-accent shrink-0" aria-hidden="true" />
                            <span>Einbauort: {selectedPart.location}</span>
                          </span>
                          {selectedPart.aka && (
                            <span className="inline-flex items-center gap-1.5">
                              <Tag size={12} className="text-ink-faint shrink-0" aria-hidden="true" />
                              <span>Auch bekannt als: {selectedPart.aka}</span>
                            </span>
                          )}
                        </div>

                        {/* Concise Explanation */}
                        <p className="text-xs sm:text-[13.5px] leading-relaxed text-ink-muted dark:text-slate-300">
                          {selectedPart.description}
                        </p>

                        {/* Failure Symptoms Checklist */}
                        <div className="rounded-xl border border-primary/8 dark:border-white/10 bg-white/90 dark:bg-slate-950/50 p-3">
                          <p className="text-[10.5px] font-extrabold uppercase tracking-[0.09em] text-primary/70 dark:text-slate-400 mb-2">
                            Typische Anzeichen für einen Defekt
                          </p>
                          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {selectedPart.symptoms.map((sym) => (
                              <li
                                key={sym}
                                className="inline-flex items-start gap-1.5 text-xs font-medium text-primary dark:text-slate-200 leading-snug"
                              >
                                <CheckCircle2
                                  size={14}
                                  className="mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                                  aria-hidden="true"
                                />
                                <span>{sym}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Secondary Candidate Quick-Jump */}
                        {secondaryParts.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                              Bei diesem Problem ebenfalls häufig betroffen:
                            </span>
                            {secondaryParts.map((altPart) => (
                              <button
                                key={altPart.id}
                                type="button"
                                onClick={() => handleSelectPart(altPart.id)}
                                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/12 hover:bg-amber-500 hover:text-white px-3 py-1 text-xs font-extrabold text-amber-900 dark:text-amber-200 transition-colors cursor-pointer touch-manipulation"
                              >
                                <span dir="ltr" translate="no" className="notranslate font-mono text-[10px]">{altPart.code}</span>
                                <span>{altPart.shortLabel} prüfen</span>
                                <ArrowRight size={12} aria-hidden="true" />
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Typeplate Guide */}
                        <p className="inline-flex items-start gap-1.5 text-xs font-semibold text-accent dark:text-accent-light leading-snug">
                          <Sparkles size={13} aria-hidden="true" className="mt-0.5 shrink-0" />
                          <span>
                            {selectedPart.enrHint} Typenschild: {activeMeta.typeplateLocation}.
                          </span>
                        </p>
                      </div>

                      {/* Right 4 Columns: Dedicated Pro Action Panel */}
                      <div className="lg:col-span-4 rounded-xl border border-primary/10 dark:border-white/10 bg-white/95 dark:bg-slate-950/60 p-3.5 sm:p-4 space-y-2.5">
                        <p className="text-[11px] font-extrabold uppercase tracking-[0.09em] text-primary/70 dark:text-slate-300">
                          Originalteil direkt anfragen
                        </p>
                        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                          <button
                            type="button"
                            onClick={handleInquiryPart}
                            className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-accent hover:bg-accent-dark px-3.5 py-2.5 text-xs font-extrabold text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer touch-manipulation"
                          >
                            <span className="truncate">Teil anfragen</span>
                            <ArrowRight size={14} aria-hidden="true" className="shrink-0" />
                          </button>

                          <a
                            href={buildWhatsAppDirectUrl(
                              formatQuickWhatsAppMessage({
                                title: "Ersatzteil-Anfrage (3D-Explorer)",
                                device: activeMeta.label,
                                part: selectedPart.name,
                                detail: activeSymptom
                                  ? `Problem: ${activeSymptom.label}. ${selectedPart.enrHint}`
                                  : selectedPart.enrHint,
                                photoHint: true,
                                closingLine:
                                  "Können Sie bitte prüfen, ob das passende Originalteil verfügbar ist?",
                              }),
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => triggerHapticFeedback(45)}
                            className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2.5 text-xs font-extrabold text-white shadow-sm transition-all active:scale-[0.98] touch-manipulation"
                          >
                            <MessageCircle size={14} aria-hidden="true" className="shrink-0" />
                            <span className="truncate">
                              Per <span translate="no" className="notranslate">WhatsApp</span>
                            </span>
                          </a>
                        </div>

                        {/* Required quiet 1-line GDPR notice directly beneath the WhatsApp button */}
                        <p className="text-center text-[11px] leading-snug text-ink-faint">
                          Freiwillige Weiterleitung zu{" "}
                          <span translate="no" className="notranslate">WhatsApp</span> (
                          <span translate="no" className="notranslate">Meta</span>) ·{" "}
                          <Link
                            href="/datenschutz#whatsapp"
                            className="underline underline-offset-2 hover:text-accent"
                          >
                            Datenschutz
                          </Link>
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="explorer-idle-hint"
                    initial={prefersReducedMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                    transition={{ duration: 0.16 }}
                    className="mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 rounded-xl border border-primary/8 dark:border-white/8 bg-slate-50/80 dark:bg-slate-800/50 px-3.5 py-2.5 text-xs text-ink-muted"
                  >
                    <span>
                      Tippen Sie ein Problem oder ein Bauteil an, um Einbauort, Defekt-Anzeichen
                      und Originalteil-Anfrage direkt anzuzeigen.
                    </span>
                    <span className="text-[11px] font-semibold text-accent shrink-0">
                      Typenschild: {activeMeta.typeplateLocation}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
