"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
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
  MessageCircle,
  Search,
  CheckCircle2,
  X,
} from "lucide-react";
import {
  mainServiceCategories,
  electronicsWorkshopCategory,
  type DeviceItem,
} from "@/data/servicesCatalog";
import { useQuickRequest } from "@/components/QuickRequestSheet";
import { ApplianceDirectoryCardSkeleton } from "@/components/Skeletons";

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
  onSelectFault,
  onSelectQuestion,
}: {
  device: DeviceItem;
  onSelectFault: (deviceName: string, fault?: string) => void;
  onSelectQuestion: (deviceName: string) => void;
}) {

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs hover:border-accent/40 hover:shadow-md transition-all duration-200">
      <div>
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <DeviceIcon iconName={device.iconName} className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-primary dark:text-slate-100 leading-tight">{device.name}</h3>
            <p className="mt-1 text-xs text-ink-muted leading-relaxed">{device.description}</p>
          </div>
        </div>

        {/* Interactive Clickable Faults */}
        <div className="mt-5 border-t border-primary/6 dark:border-white/10 pt-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">
            Typische Fehler (antippen für Anfrage):
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {device.faults.map((fault) => (
              <button
                key={fault}
                type="button"
                onClick={() => onSelectFault(device.name, fault)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-800/70 px-2.5 py-1.5 text-left text-xs font-medium text-primary dark:text-slate-200 hover:border-accent hover:bg-accent/5 hover:text-accent transition-colors"
              >
                <CheckCircle2 size={12} className="text-accent shrink-0" aria-hidden />
                <span>{fault}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-primary/6 dark:border-white/10 pt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSelectFault(device.name)}
          className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary dark:bg-accent py-2.5 px-3.5 text-xs font-bold text-white hover:bg-accent dark:hover:bg-accent-dark transition-colors shadow-xs cursor-pointer"
        >
          <span>Anfrage starten</span>
          <ArrowRight size={13} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => onSelectQuestion(device.name)}
          title={`Direkte WhatsApp-Frage für ${device.name} ausfüllen`}
          className="inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
          aria-label={`Direkte WhatsApp-Frage für ${device.name} ausfüllen`}
        >
          <MessageCircle size={16} aria-hidden />
        </button>
      </div>
    </article>
  );
}

export default function ServicesDirectory() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isDirectoryLoading, setIsDirectoryLoading] = useState<boolean>(true);
  const filterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { openQuickRequest } = useQuickRequest();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsDirectoryLoading(false);
    }, 220);
    return () => {
      clearTimeout(timer);
      if (filterTimerRef.current) {
        clearTimeout(filterTimerRef.current);
      }
    };
  }, []);

  const handleSelectCategory = (categoryId: string) => {
    if (categoryId === selectedCategory) return;
    setSelectedCategory(categoryId);
    if (filterTimerRef.current) {
      clearTimeout(filterTimerRef.current);
    }
    setIsDirectoryLoading(true);
    filterTimerRef.current = setTimeout(() => {
      setIsDirectoryLoading(false);
      filterTimerRef.current = null;
    }, 150);
  };

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

  return (
    <div className="w-full">
      {/* Category Filter Tabs & Quick Search */}
      <div className="border-b border-primary/8 dark:border-white/10 bg-surface/90 dark:bg-slate-950/90 py-3.5 sticky top-14 sm:top-[68px] z-30 backdrop-blur-md">
        <div className="container-page flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <nav
            aria-label="Kategorienavigation"
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1"
          >
            <button
              type="button"
              onClick={() => handleSelectCategory("all")}
              className={`shrink-0 min-h-[40px] rounded-xl px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === "all"
                  ? "bg-primary dark:bg-accent text-white shadow-xs"
                  : "bg-white dark:bg-slate-900 text-ink-muted border border-primary/10 dark:border-white/10 hover:border-primary/20 hover:text-primary dark:hover:text-slate-100"
              }`}
            >
              Alle Bereiche
            </button>
            {allCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectCategory(cat.id)}
                className={`shrink-0 min-h-[40px] rounded-xl px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? "bg-primary dark:bg-accent text-white shadow-xs"
                    : "bg-white dark:bg-slate-900 text-ink-muted border border-primary/10 dark:border-white/10 hover:border-primary/20 hover:text-primary dark:hover:text-slate-100"
                }`}
              >
                {cat.shortTitle}
              </button>
            ))}
          </nav>

          <div className="relative w-full md:w-64 shrink-0">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
              aria-hidden
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Gerät oder Fehler suchen..."
              className="w-full min-h-[40px] rounded-xl border border-primary/10 dark:border-white/15 bg-white dark:bg-slate-900 pl-8 pr-7 py-2 text-xs text-primary dark:text-slate-100 placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              aria-label="Geräte oder Fehler durchsuchen"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-primary dark:hover:text-slate-100"
                aria-label="Suche zurücksetzen"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container-page py-10 sm:py-14 space-y-14 sm:space-y-20">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-primary/10 dark:border-white/10 p-8">
            <p className="text-base font-bold text-primary dark:text-slate-100">Keine Geräte für Ihre Suche gefunden.</p>
            <p className="mt-1 text-xs text-ink-muted">
              Probieren Sie einen anderen Begriff oder öffnen Sie die Schnellanfrage.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white hover:bg-accent-dark transition-colors"
            >
              Alle Leistungen anzeigen
            </button>
          </div>
        ) : (
          filteredCategories.map((category) => {
            const isElectronics = category.id === "elektronik";

            return (
              <section
                key={category.id}
                id={category.id}
                className={`scroll-mt-32 ${
                  isElectronics
                    ? "rounded-3xl border border-primary/12 dark:border-white/10 bg-surface p-6 sm:p-10 shadow-xs"
                    : ""
                }`}
              >
                <div className="max-w-2xl mb-6 sm:mb-8">
                  {isElectronics && (
                    <span className="inline-block text-xs font-bold uppercase tracking-wider text-accent mb-1">
                      Spezialwerkstatt Osnabrück
                    </span>
                  )}
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-primary dark:text-slate-100 tracking-tight">
                    {category.title}
                  </h2>
                  <p className="mt-2 text-sm sm:text-base text-ink-muted leading-relaxed">
                    {category.description}
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy={isDirectoryLoading}>
                  {isDirectoryLoading
                    ? category.devices.map((device) => (
                        <ApplianceDirectoryCardSkeleton key={`skel-${device.name}`} />
                      ))
                    : category.devices.map((device) => (
                        <ApplianceCard
                          key={device.name}
                          device={device}
                          onSelectFault={(devName, fault) => openQuickRequest(devName, fault, "", "repair")}
                          onSelectQuestion={(devName) => openQuickRequest(devName, "", "", "question")}
                        />
                      ))}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
