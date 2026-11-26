"use client";

import { lazy, Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Layers,
  MessageCircle,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import {
  EXPLORER_APPLIANCES,
  getApplianceMeta,
  type ExplorerApplianceId,
} from "@/components/explorer3d/types";
import { FadeUp, RevealText } from "@/components/animations";
import { buildWhatsAppDirectUrl } from "@/utils/whatsapp";
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
        Wird lokal geladen – keine externen Skripte…
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

  // Lazy-mount WebGL only once section nears viewport (protects Hero 0ms LCP)
  const [shouldMountWebGL, setShouldMountWebGL] = useState(false);

  // Start slightly exploded so internal spare parts are immediately legible
  const [explodePct, setExplodePct] = useState<number>(36);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [cameraPreset, setCameraPreset] = useState<{
    mode: "overview" | "interior" | "reset";
    seq: number;
  }>({ mode: "overview", seq: 0 });

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setExplodePct(28);
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

  // Clear selected part cleanly when switching appliance
  useEffect(() => {
    setSelectedPartId(null);
  }, [activeAppliance]);

  const activeMeta = getApplianceMeta(activeAppliance);
  const selectedPart =
    activeMeta.parts.find((p) => p.id === selectedPartId) ?? null;

  const handleSelectAppliance = (id: ExplorerApplianceId) => {
    hapticTap();
    onChangeAppliance(id);
    setSelectedPartId(null);
  };

  const handleSelectPart = (partId: string | null) => {
    if (partId) {
      hapticTap();
      // Gently expand model if user selects a part while closed so it is clearly visible
      if (explodePct < 35) {
        setExplodePct(52);
      }
    }
    setSelectedPartId(partId);
  };

  const triggerPreset = (mode: "overview" | "interior" | "reset") => {
    hapticTap();
    if (mode === "reset") {
      setSelectedPartId(null);
      setExplodePct(window.innerWidth < 640 ? 28 : 36);
    } else if (mode === "interior") {
      setExplodePct((prev) => Math.max(prev, 68));
    } else if (mode === "overview") {
      setSelectedPartId(null);
      setExplodePct(22);
    }
    setCameraPreset((prev) => ({ mode, seq: prev.seq + 1 }));
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
        {/* Clean Editorial Header */}
        <FadeUp>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-5 sm:mb-7">
            <div className="max-w-2xl">
              <p className="eyebrow">
                Interaktiver 3D-Bauteil-Explorer · Originalteile nach Typenschild
              </p>
              <h2
                id="explorer-3d-heading"
                className="mt-1.5 text-2xl font-extrabold text-primary dark:text-slate-100 sm:text-3xl lg:text-[34px] text-balance"
              >
                <RevealText segments={[{ text: "Gesuchtes Ersatzteil im 3D-Modell antippen" }]} />
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-ink-muted">
                Explosionsansicht öffnen, Bauteil wählen und direkt passend zur E-Nr. bei{" "}
                Kamal Hannachi anfragen.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                hapticTap();
                onRequestOtherDevice();
              }}
              className="group inline-flex self-start sm:self-auto min-h-[40px] items-center gap-1.5 text-xs font-extrabold text-accent hover:text-accent-dark dark:text-accent-light transition-colors cursor-pointer shrink-0"
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

        {/* Main 3D Studio Viewport Container (Compact 330px on Mobile, 430–500px on Tablet/Desktop) */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/12 dark:border-white/12 bg-slate-100 dark:bg-primary-dark shadow-[0_20px_50px_-22px_rgba(15,42,74,0.28)] dark:shadow-[0_24px_56px_-22px_rgba(2,6,23,0.8)]">
          {/* Interactive WebGL Stage */}
          <div className="relative h-[330px] sm:h-[430px] lg:h-[500px] w-full">
            {shouldMountWebGL ? (
              <Suspense fallback={<StudioFallbackPoster label={activeMeta.label} />}>
                <LazyExplorer3DCanvas
                  applianceId={activeAppliance}
                  explode={explodePct / 100}
                  selectedPartId={selectedPartId}
                  cameraPreset={cameraPreset}
                  prefersReducedMotion={prefersReducedMotion}
                  onSelectPart={handleSelectPart}
                />
              </Suspense>
            ) : (
              <StudioFallbackPoster label={activeMeta.label} />
            )}

            {/* Top-Left Minimal Context Chip (NO backdrop-filter over WebGL, NO pulsing dots) */}
            <div className="pointer-events-none absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-xl border border-primary/12 dark:border-white/15 bg-white/94 dark:bg-slate-900/94 px-3 py-1.5 text-[11px] font-extrabold text-primary dark:text-white shadow-sm">
                <span className="h-2 w-2 rounded-full bg-accent shrink-0" aria-hidden="true" />
                <span>{activeMeta.label}</span>
                <span className="hidden sm:inline text-primary/30 dark:text-white/25">·</span>
                <span className="hidden sm:inline font-semibold text-ink-muted dark:text-slate-300">
                  Ziehen zum Drehen · Bauteil antippen
                </span>
              </div>
            </div>

            {/* Top-Right Compact Reset Button on Mobile & Desktop (NO backdrop-filter) */}
            <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => triggerPreset("reset")}
                title="Ansicht zurücksetzen"
                aria-label="3D-Ansicht zurücksetzen"
                className="inline-flex h-8 w-8 sm:w-auto sm:px-2.5 items-center justify-center gap-1.5 rounded-xl border border-primary/12 dark:border-white/15 bg-white/94 dark:bg-slate-900/94 text-[11px] font-bold text-primary dark:text-slate-200 hover:border-accent hover:text-accent transition-colors shadow-sm cursor-pointer"
              >
                <RotateCcw size={13} aria-hidden="true" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>

            {/* Desktop Collapsible Bottom-Center Control Dock (NO backdrop-filter over WebGL) */}
            <div className="hidden sm:flex pointer-events-none absolute inset-x-4 bottom-3.5 z-20 justify-center">
              <div className="pointer-events-auto max-w-full rounded-2xl border border-primary/14 dark:border-white/15 bg-white/95 dark:bg-slate-900/95 px-3 py-2 shadow-[0_14px_34px_-12px_rgba(15,23,42,0.45)]">
                {dockCollapsed ? (
                  <button
                    type="button"
                    onClick={() => setDockCollapsed(false)}
                    className="inline-flex items-center gap-2 px-1.5 py-0.5 text-xs font-extrabold text-primary dark:text-white hover:text-accent transition-colors cursor-pointer"
                  >
                    <SlidersHorizontal size={13} className="text-accent" aria-hidden="true" />
                    <span>3D-Steuerung einblenden</span>
                    <ChevronUp size={14} aria-hidden="true" />
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center justify-center gap-2.5 lg:gap-3.5">
                    {/* Appliance Switcher */}
                    <div
                      role="tablist"
                      aria-label="Haushaltsgerät im 3D-Explorer wählen"
                      className="inline-flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 p-1"
                    >
                      {EXPLORER_APPLIANCES.map((app) => {
                        const isActive = app.id === activeAppliance;
                        return (
                          <button
                            key={app.id}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => handleSelectAppliance(app.id)}
                            className={`rounded-lg px-2.5 py-1.5 text-[11.5px] font-extrabold transition-colors cursor-pointer ${
                              isActive
                                ? "bg-primary dark:bg-accent text-white shadow-xs"
                                : "text-primary/80 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-primary dark:hover:text-white"
                            }`}
                          >
                            {app.shortLabel}
                          </button>
                        );
                      })}
                    </div>

                    <span
                      aria-hidden="true"
                      className="hidden lg:block h-6 w-px bg-primary/12 dark:bg-white/12"
                    />

                    {/* Explode Slider */}
                    <label className="inline-flex items-center gap-2.5 text-[11.5px] font-bold text-primary dark:text-slate-200">
                      <span className="whitespace-nowrap">Explosion</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={explodePct}
                        onChange={(e) => setExplodePct(Number(e.target.value))}
                        aria-label="Explosionsansicht einstellen"
                        className="h-1.5 w-28 lg:w-32 cursor-pointer accent-accent rounded-full"
                      />
                      <span className="w-9 text-right font-mono text-[11px] font-extrabold text-accent tabular-nums">
                        {explodePct}%
                      </span>
                    </label>

                    <span
                      aria-hidden="true"
                      className="hidden lg:block h-6 w-px bg-primary/12 dark:bg-white/12"
                    />

                    {/* Camera Presets */}
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => triggerPreset("overview")}
                        className="rounded-lg border border-primary/12 dark:border-white/12 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-[11px] font-bold text-primary dark:text-slate-200 hover:border-accent hover:text-accent transition-colors cursor-pointer"
                      >
                        Gesamt
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerPreset("interior")}
                        className="rounded-lg border border-primary/12 dark:border-white/12 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-[11px] font-bold text-primary dark:text-slate-200 hover:border-accent hover:text-accent transition-colors cursor-pointer"
                      >
                        Innenleben
                      </button>
                    </div>

                    {/* Collapse Toggle */}
                    <button
                      type="button"
                      onClick={() => setDockCollapsed(true)}
                      aria-label="Steuerungsleiste ausblenden"
                      title="Ausblenden"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary dark:hover:text-white transition-colors cursor-pointer"
                    >
                      <ChevronDown size={15} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Controls Panel (Directly below compact 330px canvas: appliance tabs, explode slider & collision-free 01–05 part chips) */}
          <div className="sm:hidden border-t border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 p-3 space-y-3">
            {/* Appliance Selector (4 compact tabs) */}
            <div
              role="tablist"
              aria-label="Haushaltsgerät wählen"
              className="grid grid-cols-4 gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1"
            >
              {EXPLORER_APPLIANCES.map((app) => {
                const isActive = app.id === activeAppliance;
                return (
                  <button
                    key={app.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => handleSelectAppliance(app.id)}
                    className={`min-h-[36px] rounded-lg px-1.5 py-1.5 text-[11px] font-extrabold transition-colors cursor-pointer ${
                      isActive
                        ? "bg-primary dark:bg-accent text-white shadow-xs"
                        : "text-primary/80 dark:text-slate-300"
                    }`}
                  >
                    {app.shortLabel}
                  </button>
                );
              })}
            </div>

            {/* Explode Slider + Interior shortcut */}
            <div className="flex items-center gap-2.5">
              <label className="flex flex-1 items-center gap-2 text-[11.5px] font-bold text-primary dark:text-slate-200">
                <span className="shrink-0">Explosion</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={explodePct}
                  onChange={(e) => setExplodePct(Number(e.target.value))}
                  aria-label="Explosionsansicht einstellen"
                  className="h-2 flex-1 cursor-pointer accent-accent rounded-full"
                />
                <span className="w-8 text-right font-mono text-[11px] font-extrabold text-accent tabular-nums">
                  {explodePct}%
                </span>
              </label>
              <button
                type="button"
                onClick={() => triggerPreset("interior")}
                className="shrink-0 min-h-[34px] rounded-lg border border-primary/12 dark:border-white/15 bg-slate-50 dark:bg-slate-800 px-2.5 text-[11px] font-bold text-primary dark:text-slate-200 cursor-pointer"
              >
                Innen
              </button>
            </div>

            {/* Collision-Free Mobile Spare-Part Chip Strip (01..05) */}
            <div>
              <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-faint">
                Bauteil direkt auswählen ({activeMeta.label})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {activeMeta.parts.map((part) => {
                  const isSelected = selectedPartId === part.id;
                  return (
                    <button
                      key={part.id}
                      type="button"
                      onClick={() => handleSelectPart(isSelected ? null : part.id)}
                      aria-pressed={isSelected}
                      className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11.5px] font-bold transition-colors cursor-pointer ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-600 text-white shadow-xs"
                          : "border-primary/12 dark:border-white/12 bg-surface dark:bg-slate-800 text-primary dark:text-slate-100"
                      }`}
                    >
                      <span
                        className={`font-mono text-[10px] font-black tabular-nums ${
                          isSelected ? "text-emerald-100" : "text-accent"
                        }`}
                      >
                        {part.code}
                      </span>
                      <span>{part.shortLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Desktop Quick Part Bar & Selected Part Action Drawer (Zero occlusion over WebGL!) */}
          <div className="border-t border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 px-3.5 py-3 sm:px-5 sm:py-4">
            {/* Desktop quick-select part row */}
            <div className="hidden sm:flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">
                  Bauteile:
                </span>
                {activeMeta.parts.map((part) => {
                  const isSelected = selectedPartId === part.id;
                  return (
                    <button
                      key={part.id}
                      type="button"
                      onClick={() => handleSelectPart(isSelected ? null : part.id)}
                      aria-pressed={isSelected}
                      className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-600 text-white shadow-xs"
                          : "border-primary/12 dark:border-white/12 bg-surface dark:bg-slate-800/80 text-primary dark:text-slate-100 hover:border-accent hover:text-accent"
                      }`}
                    >
                      <span
                        className={`font-mono text-[10px] font-black tabular-nums ${
                          isSelected ? "text-emerald-100" : "text-accent"
                        }`}
                      >
                        {part.code}
                      </span>
                      <span>{part.shortLabel}</span>
                    </button>
                  );
                })}
              </div>
              <span className="text-[11px] font-medium text-ink-faint">
                {activeMeta.subtitle}
              </span>
            </div>

            {/* Selected Part Action Bar (with Direct Form Inquiry + WhatsApp + Required 1-Line GDPR Notice) */}
            <AnimatePresence initial={false} mode="wait">
              {selectedPart ? (
                <motion.div
                  key={`${activeAppliance}-${selectedPart.id}`}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="sm:mt-3.5 rounded-xl border border-emerald-500/30 dark:border-emerald-400/25 bg-emerald-50/60 dark:bg-emerald-950/25 p-3.5 sm:p-4"
                >
                  <div className="flex flex-col gap-3.5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center rounded-md bg-emerald-600 px-2 py-0.5 font-mono text-[10.5px] font-black text-white tabular-nums">
                            {selectedPart.code}
                          </span>
                          <h3 className="text-sm sm:text-base font-extrabold text-primary dark:text-white leading-snug">
                            {selectedPart.name}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedPartId(null)}
                          aria-label="Bauteil-Auswahl schließen"
                          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-primary/8 dark:hover:bg-white/10 hover:text-primary dark:hover:text-white transition-colors cursor-pointer lg:hidden"
                        >
                          <X size={15} aria-hidden="true" />
                        </button>
                      </div>
                      <p className="mt-1 text-xs sm:text-[13px] leading-relaxed text-ink-muted dark:text-slate-300">
                        {selectedPart.description}
                      </p>
                      <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-accent dark:text-accent-light">
                        <Sparkles size={12} aria-hidden="true" className="shrink-0" />
                        <span>Tipp: {selectedPart.enrHint}</span>
                      </p>
                    </div>

                    {/* Action Buttons + Quiet 1-Line WhatsApp GDPR Notice */}
                    <div className="flex flex-col items-stretch sm:items-end gap-1.5 shrink-0">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <button
                          type="button"
                          onClick={handleInquiryPart}
                          className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-accent hover:bg-accent-dark px-4 py-2 text-xs font-extrabold text-white shadow-sm transition-colors cursor-pointer"
                        >
                          <span>Teil anfragen</span>
                          <ArrowRight size={14} aria-hidden="true" />
                        </button>

                        <a
                          href={buildWhatsAppDirectUrl(selectedPart.whatsappText)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => triggerHapticFeedback(45)}
                          className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-extrabold text-white shadow-sm transition-colors"
                        >
                          <MessageCircle size={14} aria-hidden="true" />
                          <span>Per WhatsApp</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => setSelectedPartId(null)}
                          aria-label="Bauteil-Auswahl schließen"
                          className="hidden lg:inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-primary/12 dark:border-white/15 bg-white dark:bg-slate-900 text-ink-muted hover:text-primary dark:hover:text-white transition-colors cursor-pointer"
                        >
                          <X size={15} aria-hidden="true" />
                        </button>
                      </div>

                      {/* Required quiet 1-line GDPR notice directly beneath the WhatsApp button */}
                      <p className="text-[11px] leading-snug text-ink-faint sm:text-right">
                        Freiwillige Weiterleitung zu WhatsApp (Meta) ·{" "}
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
                <motion.p
                  key="explorer-idle-hint"
                  initial={prefersReducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.16 }}
                  className="text-xs text-ink-muted sm:mt-2.5 flex flex-wrap items-center justify-between gap-2"
                >
                  <span>
                    Tippen Sie ein Bauteil im 3D-Modell oder in der Auswahl an, um das passende
                    Originalteil nach Typenschild anzufragen.
                  </span>
                  <span className="text-[11px] font-semibold text-accent">
                    Alle bekannten Marken · E-Nr.-Prüfung
                  </span>
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
