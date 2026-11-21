"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  WashingMachine,
  Wind,
  Layers,
  UtensilsCrossed,
  Zap,
  Refrigerator,
  Snowflake,
  Flame,
  Fan,
  Microwave,
  Coffee,
  Sparkles,
  Cpu,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  MessageCircle,
  Search,
  X,
} from "lucide-react";
import {
  mainServiceCategories,
  electronicsWorkshopCategory,
  type DeviceItem,
} from "@/data/servicesCatalog";
import { useQuickRequest } from "@/components/QuickRequestSheet";
import { hapticTap, triggerHapticFeedback } from "@/lib/haptics";
import { useMediaQuery } from "@/lib/useMediaQuery";

function DeviceIcon({
  iconName,
  className = "h-5 w-5",
}: {
  iconName: DeviceItem["iconName"];
  className?: string;
}) {
  switch (iconName) {
    case "WashingMachine":
      return <WashingMachine className={className} aria-hidden />;
    case "Wind":
      return <Wind className={className} aria-hidden />;
    case "Layers":
      return <Layers className={className} aria-hidden />;
    case "UtensilsCrossed":
      return <UtensilsCrossed className={className} aria-hidden />;
    case "Zap":
      return <Zap className={className} aria-hidden />;
    case "Refrigerator":
      return <Refrigerator className={className} aria-hidden />;
    case "Snowflake":
      return <Snowflake className={className} aria-hidden />;
    case "Flame":
      return <Flame className={className} aria-hidden />;
    case "Fan":
      return <Fan className={className} aria-hidden />;
    case "Microwave":
      return <Microwave className={className} aria-hidden />;
    case "Coffee":
      return <Coffee className={className} aria-hidden />;
    case "Sparkles":
      return <Sparkles className={className} aria-hidden />;
    case "Cpu":
      return <Cpu className={className} aria-hidden />;
    default:
      return <Zap className={className} aria-hidden />;
  }
}

function ApplianceCard({
  device,
  defaultExpandedOnMobile = false,
  onSelectInquiry,
  onSelectQuestion,
}: {
  device: DeviceItem;
  defaultExpandedOnMobile?: boolean;
  onSelectInquiry: (deviceName: string, preset?: string) => void;
  onSelectQuestion: (deviceName: string) => void;
}) {
  const [showAllMobile, setShowAllMobile] = useState(defaultExpandedOnMobile);
  const prefersReducedMotion = useReducedMotion();
  const isSmUp = useMediaQuery("(min-width: 640px)", false);

  const visibleTopics = useMemo(() => {
    if (isSmUp || showAllMobile) return device.faults;
    return device.faults.slice(0, 3);
  }, [device.faults, isSmUp, showAllMobile]);

  const hiddenMobileCount = Math.max(0, device.faults.length - 3);

  return (
    <article className="card h-full flex flex-col justify-between rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 p-5 sm:p-6 transition-colors hover:border-accent/40">
      <div>
        {/* Clean Card Header */}
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <DeviceIcon iconName={device.iconName} className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-extrabold text-primary dark:text-slate-100 leading-snug">
              {device.name}
            </h3>
            <p className="mt-1 text-xs sm:text-[13px] text-ink-muted leading-relaxed">
              {device.description}
            </p>
          </div>
        </div>

        {/* Hairline-Divided Interactive 1-Tap Topics (No Box-in-Box Clutter) */}
        <div className="mt-4 border-t border-primary/8 dark:border-white/10">
          <ul className="divide-y divide-primary/8 dark:divide-white/10">
            {visibleTopics.map((topic) => (
              <li key={topic}>
                <button
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback(30);
                    onSelectInquiry(device.name, topic);
                  }}
                  className="group/row flex min-h-[44px] w-full items-center justify-between gap-3 py-2.5 text-left text-xs sm:text-[13px] font-medium text-primary dark:text-slate-200 hover:text-accent dark:hover:text-accent-light transition-colors cursor-pointer"
                >
                  <span className="leading-snug">{topic}</span>
                  <ChevronRight
                    size={14}
                    aria-hidden="true"
                    className="shrink-0 text-ink-faint transition-transform duration-150 group-hover/row:translate-x-0.5 group-hover/row:text-accent"
                  />
                </button>
              </li>
            ))}
          </ul>

          {/* Clean Progressive Disclosure on Mobile (< sm) when more than 3 topics */}
          {!isSmUp && hiddenMobileCount > 0 && (
            <button
              type="button"
              onClick={() => {
                hapticTap();
                setShowAllMobile((prev) => !prev);
              }}
              aria-expanded={showAllMobile}
              className="flex min-h-[44px] w-full items-center justify-between border-t border-primary/8 dark:border-white/10 py-2 text-xs font-bold text-accent cursor-pointer"
            >
              <span>
                {showAllMobile
                  ? "Weniger Themen anzeigen"
                  : `+ ${hiddenMobileCount} weitere Themen anzeigen`}
              </span>
              <motion.span
                animate={{ rotate: showAllMobile ? 180 : 0 }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0.08 }
                    : { type: "spring", stiffness: 360, damping: 26 }
                }
                className="flex items-center"
              >
                <ChevronDown size={15} aria-hidden="true" />
              </motion.span>
            </button>
          )}
        </div>
      </div>

      {/* Focused Footer Actions */}
      <div className="mt-4 pt-4 border-t border-primary/8 dark:border-white/10 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            triggerHapticFeedback(35);
            onSelectInquiry(device.name, "");
          }}
          className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary dark:bg-accent px-3.5 py-2.5 text-xs font-extrabold text-white hover:bg-accent dark:hover:bg-accent-dark active:scale-[0.98] transition-all whitespace-nowrap cursor-pointer"
        >
          <span>Termin / Teil anfragen</span>
          <ArrowRight size={14} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => {
            triggerHapticFeedback(35);
            onSelectQuestion(device.name);
          }}
          title={`Direkte Frage für ${device.name}`}
          aria-label={`Direkte Frage für ${device.name}`}
          className="inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white active:scale-95 transition-all cursor-pointer"
        >
          <MessageCircle size={17} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

export default function ServicesDirectory() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { openQuickRequest } = useQuickRequest();

  const allCategories = useMemo(
    () => [...mainServiceCategories, electronicsWorkshopCategory],
    []
  );

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return allCategories
      .filter((cat) => selectedCategory === "all" || cat.id === selectedCategory)
      .map((cat) => {
        if (!q) return cat;

        const matchingDevices = cat.devices.filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            d.description.toLowerCase().includes(q) ||
            d.faults.some((f) => f.toLowerCase().includes(q))
        );

        return {
          ...cat,
          devices: matchingDevices,
        };
      })
      .filter((cat) => cat.devices.length > 0);
  }, [allCategories, selectedCategory, searchQuery]);

  const totalMatchingDevices = useMemo(
    () => filteredCategories.reduce((sum, cat) => sum + cat.devices.length, 0),
    [filteredCategories]
  );

  return (
    <div className="w-full">
      {/* Sticky Filter & Search Toolbar */}
      <div className="border-b border-primary/8 dark:border-white/10 bg-surface/95 dark:bg-slate-950/95 py-3 sticky top-12 lg:top-16 z-30 backdrop-blur-md">
        <div className="container-page flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 sm:gap-3">
          <nav
            aria-label="Kategorienavigation"
            className="flex items-center gap-1.5 overflow-x-auto snap-x snap-proximity md:snap-none scroll-px-4 no-scrollbar touch-pan-x py-0.5"
          >
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(25);
                setSelectedCategory("all");
              }}
              aria-pressed={selectedCategory === "all"}
              className={`shrink-0 min-h-[44px] lg:min-h-[38px] rounded-xl px-3.5 py-2 text-xs font-bold transition-colors active:scale-95 whitespace-nowrap cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-primary dark:bg-accent text-white"
                  : "text-ink-muted hover:bg-primary/5 dark:hover:bg-white/5 hover:text-primary dark:hover:text-slate-100"
              }`}
            >
              Alle Bereiche
            </button>
            {allCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  triggerHapticFeedback(25);
                  setSelectedCategory(cat.id);
                }}
                aria-pressed={selectedCategory === cat.id}
                className={`shrink-0 min-h-[44px] lg:min-h-[38px] rounded-xl px-3.5 py-2 text-xs font-bold transition-colors active:scale-95 whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-primary dark:bg-accent text-white"
                    : "text-ink-muted hover:bg-primary/5 dark:hover:bg-white/5 hover:text-primary dark:hover:text-slate-100"
                }`}
              >
                {cat.shortTitle}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden xl:inline text-xs font-medium text-ink-faint tabular-nums whitespace-nowrap">
              {totalMatchingDevices} Gerätegruppen
            </span>
            <div className="relative w-full lg:w-64">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Gerät oder Bauteil suchen…"
                className="w-full min-h-[44px] lg:min-h-[38px] rounded-xl border border-primary/12 dark:border-white/15 bg-white dark:bg-slate-900 pl-9 pr-11 py-2 text-base sm:text-xs text-primary dark:text-slate-100 placeholder:text-ink-faint focus:border-accent focus:outline-none"
                aria-label="Geräte oder Ersatzteile durchsuchen"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-0.5 top-1/2 -translate-y-1/2 flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-xl text-ink-faint hover:text-primary dark:hover:text-slate-100 cursor-pointer"
                  aria-label="Suche zurücksetzen"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="container-page py-8 sm:py-12 space-y-10 sm:space-y-14">
        {filteredCategories.length === 0 ? (
          <div className="card text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-primary/10 dark:border-white/10 p-8">
            <p className="text-base font-bold text-primary dark:text-slate-100">
              Keine Einträge für „{searchQuery.trim()}“ gefunden.
            </p>
            <p className="mt-1.5 text-xs sm:text-sm text-ink-muted">
              Setzen Sie den Filter zurück oder schildern Sie uns Ihr Gerät direkt per Anfrage.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-primary/15 dark:border-white/15 bg-surface dark:bg-slate-800 px-4 py-2 text-xs font-bold text-primary dark:text-slate-100 cursor-pointer"
              >
                Filter zurücksetzen
              </button>
              <button
                type="button"
                onClick={() => openQuickRequest("Waschmaschine", searchQuery.trim(), "", "repair")}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white cursor-pointer"
              >
                <span>Direkt anfragen</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        ) : (
          filteredCategories.map((category, idx) => (
            <section
              key={category.id}
              id={category.id}
              className="scroll-mt-44 md:scroll-mt-32"
            >
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-4 border-b border-primary/8 dark:border-white/10">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-2 text-xs font-semibold text-accent tabular-nums">
                    <span>0{idx + 1}. Bereich</span>
                    <span aria-hidden="true" className="text-ink-faint">·</span>
                    <span className="text-ink-muted">{category.devices.length} Gerätegruppen</span>
                  </div>
                  <h2 className="mt-1 text-xl sm:text-2xl font-extrabold text-primary dark:text-slate-100 tracking-tight text-balance">
                    {category.title}
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-ink-muted leading-relaxed">
                    {category.description}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {category.devices.map((device, dIdx) => (
                  <ApplianceCard
                    key={device.name}
                    device={device}
                    defaultExpandedOnMobile={dIdx === 0 && idx === 0}
                    onSelectInquiry={(devName, fault) =>
                      openQuickRequest(devName, fault, "", "repair")
                    }
                    onSelectQuestion={(devName) =>
                      openQuickRequest(devName, "", "", "question")
                    }
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
