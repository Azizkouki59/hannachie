"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  MessageCircle,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import {
  CoffeeMachine,
  ControlModule,
  Cooktop,
  Dishwasher,
  Dryer,
  Freezer,
  Fridge,
  MicrowaveIcon,
  Oven,
  RangeHood,
  WashingMachine,
} from "@/components/Illustrations";
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
  className = "h-6 w-6",
}: {
  iconName: DeviceItem["iconName"];
  className?: string;
}) {
  switch (iconName) {
    case "WashingMachine":
      return <WashingMachine className={className} />;
    case "Wind":
    case "Layers":
      return <Dryer className={className} />;
    case "UtensilsCrossed":
      return <Dishwasher className={className} />;
    case "Zap":
      return <Cooktop className={className} />;
    case "Refrigerator":
      return <Fridge className={className} />;
    case "Snowflake":
      return <Freezer className={className} />;
    case "Flame":
      return <Oven className={className} />;
    case "Fan":
      return <RangeHood className={className} />;
    case "Microwave":
      return <MicrowaveIcon className={className} />;
    case "Coffee":
      return <CoffeeMachine className={className} />;
    case "Sparkles":
      return <Sparkles className={className} aria-hidden />;
    case "Cpu":
      return <ControlModule className={className} />;
    default:
      return <WashingMachine className={className} />;
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

  const primaryTopics = useMemo(() => device.faults.slice(0, 3), [device.faults]);
  const extraTopics = useMemo(() => device.faults.slice(3), [device.faults]);
  const hiddenMobileCount = extraTopics.length;
  const showExtraTopics = isSmUp || showAllMobile;

  return (
    <article className="card h-full flex flex-col justify-between rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 p-4 sm:p-6 transition-colors hover:border-accent/40">
      <div>
        {/* Clean Card Header */}
        <div className="flex items-start gap-3 sm:gap-3.5">
          <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-gradient-to-br from-accent/15 to-sky-500/5 text-accent shadow-2xs">
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

        {/* Hairline-Divided Interactive 1-Tap Topics with Smooth Animated Disclosure */}
        <div className="mt-4 border-t border-primary/8 dark:border-white/10">
          <ul className="divide-y divide-primary/8 dark:divide-white/10">
            {primaryTopics.map((topic) => (
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

          {extraTopics.length > 0 && (
            <AnimatePresence initial={false}>
              {showExtraTopics && (
                <motion.ul
                  key="extra-topics"
                  initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0, height: 0 }}
                  transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden border-t border-primary/8 dark:border-white/10 divide-y divide-primary/8 dark:divide-white/10"
                >
                  {extraTopics.map((topic) => (
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
                </motion.ul>
              )}
            </AnimatePresence>
          )}

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
          <span>Teil / Gerät anfragen</span>
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
      <div className="border-b border-primary/8 dark:border-white/10 bg-surface/95 dark:bg-slate-950/95 py-2.5 sm:py-3 sticky top-[56px] lg:top-16 z-30 backdrop-blur-md">
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
              className={`relative shrink-0 min-h-[44px] lg:min-h-[38px] rounded-xl px-3.5 py-2 text-xs font-bold transition-colors active:scale-95 whitespace-nowrap cursor-pointer ${
                selectedCategory === "all"
                  ? "text-white"
                  : "text-ink-muted hover:bg-primary/5 dark:hover:bg-white/5 hover:text-primary dark:hover:text-slate-100"
              }`}
            >
              {selectedCategory === "all" && (
                <motion.span
                  layoutId="services-category-active-pill"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-xl bg-primary dark:bg-accent"
                />
              )}
              <span className="relative z-10">Alle Bereiche</span>
            </button>
            {allCategories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback(25);
                    setSelectedCategory(cat.id);
                  }}
                  aria-pressed={isSelected}
                  className={`relative shrink-0 min-h-[44px] lg:min-h-[38px] rounded-xl px-3.5 py-2 text-xs font-bold transition-colors active:scale-95 whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? "text-white"
                      : "text-ink-muted hover:bg-primary/5 dark:hover:bg-white/5 hover:text-primary dark:hover:text-slate-100"
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="services-category-active-pill"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      aria-hidden="true"
                      className="absolute inset-0 rounded-xl bg-primary dark:bg-accent"
                    />
                  )}
                  <span className="relative z-10">{cat.shortTitle}</span>
                </button>
              );
            })}
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

      {/* Directory Grid with Smooth Filter Transitions */}
      <div className="container-page py-8 sm:py-12">
        <AnimatePresence mode="wait" initial={false}>
          {filteredCategories.length === 0 ? (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="card text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-primary/10 dark:border-white/10 p-8"
            >
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
            </motion.div>
          ) : (
            <motion.div
              key={`${selectedCategory}-${searchQuery.trim().toLowerCase()}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-10 sm:space-y-14"
            >
              {filteredCategories.map((category, idx) => {
                const categoryNumber = allCategories.findIndex((c) => c.id === category.id) + 1;
                const formattedNumber = String(categoryNumber > 0 ? categoryNumber : idx + 1).padStart(2, "0");
                return (
                  <section
                    key={category.id}
                    id={category.id}
                    className="scroll-mt-44 md:scroll-mt-32"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-4 border-b border-primary/8 dark:border-white/10">
                      <div className="max-w-2xl">
                        <div className="flex items-center gap-2 text-xs font-semibold text-accent tabular-nums">
                          <span>{formattedNumber}. Bereich</span>
                          <span aria-hidden="true" className="text-ink-faint">·</span>
                          <span className="text-ink-muted">{category.devices.length} Gerätegruppen</span>
                        </div>
                        <h2 className="mt-1 text-xl sm:text-2xl font-extrabold text-primary dark:text-slate-100 tracking-tight text-balance">
                          {category.title}
                        </h2>
                        <p className="mt-1 text-xs sm:text-sm text-ink-muted leading-relaxed">
                          {category.description}
                          {category.id === "elektronik" && (
                            <>
                              {" "}
                              <Link
                                href="/impressum#garantie"
                                className="font-semibold text-accent underline underline-offset-2 hover:text-accent-dark whitespace-nowrap"
                              >
                                Garantiebedingungen
                              </Link>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`mt-5 grid gap-4 sm:gap-5 ${
                        category.devices.length === 1
                          ? "grid-cols-1 max-w-2xl"
                          : category.devices.length === 2
                            ? "grid-cols-1 sm:grid-cols-2"
                            : category.devices.length === 3
                              ? "grid-cols-1 md:grid-cols-3"
                              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                      }`}
                    >
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
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
