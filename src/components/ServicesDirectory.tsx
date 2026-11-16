"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
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
  Check,
  X,
  ChevronDown,
} from "lucide-react";
import {
  mainServiceCategories,
  electronicsWorkshopCategory,
  type DeviceItem,
} from "@/data/servicesCatalog";
import { useQuickRequest } from "@/components/QuickRequestSheet";
import { triggerHapticFeedback } from "@/lib/haptics";

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
  const [mobileTopicsOpen, setMobileTopicsOpen] = useState(defaultExpandedOnMobile);

  return (
    <article className="h-full flex flex-col justify-between rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs hover:border-accent/40 transition-colors">
      <div>
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <DeviceIcon iconName={device.iconName} className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-extrabold text-primary dark:text-slate-100 leading-tight">
              {device.name}
            </h3>
            <p className="mt-1 text-xs text-ink-muted leading-relaxed">
              {device.description}
            </p>
          </div>
        </div>

        {/* Mobile Collapsible Accordion Toggle for Topics (< sm) */}
        <button
          type="button"
          onClick={() => {
            triggerHapticFeedback(30);
            setMobileTopicsOpen((prev) => !prev);
          }}
          aria-expanded={mobileTopicsOpen}
          className="mt-3.5 flex sm:hidden min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-800/70 px-3 py-2 text-xs font-bold text-primary dark:text-slate-200 active:scale-[0.99] transition-all cursor-pointer"
        >
          <span>
            {mobileTopicsOpen
              ? "Themen ausblenden"
              : `Direkt-Auswahl (${device.faults.length} Themen)`}
          </span>
          <ChevronDown
            size={15}
            className={`shrink-0 text-accent transition-transform duration-200 ${
              mobileTopicsOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Interactive Clickable Part / Purchase Topics */}
        <div
          className={`${
            mobileTopicsOpen ? "mt-3 block" : "hidden"
          } sm:mt-4 sm:block border-t border-primary/8 dark:border-white/10 pt-3.5`}
        >
          <p className="hidden sm:block text-xs font-semibold text-ink-muted">
            Direkt-Auswahl (Gerät oder Ersatzteil anfragen):
          </p>
          <div className="sm:mt-2 grid grid-cols-1 sm:flex sm:flex-wrap gap-2">
            {device.faults.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => {
                  triggerHapticFeedback(35);
                  onSelectInquiry(device.name, topic);
                }}
                className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-between sm:justify-start gap-2 rounded-xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-800/70 px-3.5 py-2 text-left text-xs font-semibold text-primary dark:text-slate-200 hover:border-accent hover:text-accent active:scale-[0.98] transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <Check size={14} className="text-accent shrink-0" aria-hidden />
                  <span className="leading-snug">{topic}</span>
                </span>
                <ArrowRight size={13} className="shrink-0 text-ink-faint sm:hidden" aria-hidden />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 sm:mt-5 border-t border-primary/8 dark:border-white/10 pt-3.5 sm:pt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            triggerHapticFeedback(40);
            onSelectInquiry(device.name);
          }}
          className="flex-1 min-h-[48px] sm:min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary dark:bg-accent py-2.5 px-3.5 text-xs font-extrabold text-white hover:bg-accent dark:hover:bg-accent-dark active:scale-[0.98] transition-all whitespace-nowrap cursor-pointer"
        >
          <span>Unverbindlich anfragen</span>
          <ArrowRight size={14} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => {
            triggerHapticFeedback(40);
            onSelectQuestion(device.name);
          }}
          title={`Direkte WhatsApp-Frage für ${device.name} ausfüllen`}
          className="inline-flex h-[48px] w-[48px] sm:h-[44px] sm:w-[44px] min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white active:scale-95 transition-all cursor-pointer"
          aria-label={`Direkte WhatsApp-Frage für ${device.name} ausfüllen`}
        >
          <MessageCircle size={18} />
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

  return (
    <div className="w-full">
      {/* Category Filter Tabs & Quick Search (Zero-Latency Access, >= 44px Touch Targets) */}
      <div className="border-b border-primary/8 dark:border-white/10 bg-surface/95 dark:bg-slate-950/95 py-2.5 sm:py-3 sticky top-12 sm:top-16 z-30 backdrop-blur-md">
        <div className="container-page flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3">
          <nav
            aria-label="Kategorienavigation"
            className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5"
          >
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(30);
                setSelectedCategory("all");
              }}
              className={`shrink-0 min-h-[44px] min-w-[44px] rounded-xl px-4 py-2 text-xs font-bold transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-primary dark:bg-accent text-white"
                  : "bg-white dark:bg-slate-900 text-ink-muted border border-primary/10 dark:border-white/10 hover:text-primary dark:hover:text-slate-100"
              }`}
            >
              Alle Bereiche
            </button>
            {allCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  triggerHapticFeedback(30);
                  setSelectedCategory(cat.id);
                }}
                className={`shrink-0 min-h-[44px] min-w-[44px] rounded-xl px-4 py-2 text-xs font-bold transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-primary dark:bg-accent text-white"
                    : "bg-white dark:bg-slate-900 text-ink-muted border border-primary/10 dark:border-white/10 hover:text-primary dark:hover:text-slate-100"
                }`}
              >
                {cat.shortTitle}
              </button>
            ))}
          </nav>

          <div className="relative w-full md:w-64 shrink-0">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
              aria-hidden
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Gerät oder Bauteil suchen..."
              className="w-full min-h-[44px] rounded-xl border border-primary/12 dark:border-white/15 bg-white dark:bg-slate-900 pl-9 pr-11 py-2 text-base sm:text-xs text-primary dark:text-slate-100 placeholder:text-ink-faint focus:border-accent focus:outline-none"
              aria-label="Geräte oder Ersatzteile durchsuchen"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-0.5 top-1/2 -translate-y-1/2 flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-ink-faint hover:text-primary dark:hover:text-slate-100 cursor-pointer"
                aria-label="Suche zurücksetzen"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container-page py-7 sm:py-12 space-y-9 sm:space-y-12">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-primary/10 dark:border-white/10 p-8">
            <p className="text-base font-bold text-primary dark:text-slate-100">
              Keine Einträge für Ihre Suche gefunden.
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              Setzen Sie die Suche zurück oder senden Sie uns direkt eine unverbindliche Anfrage.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-primary dark:bg-slate-800 px-4 py-2 text-xs font-bold text-white cursor-pointer"
              >
                Alle Bereiche anzeigen
              </button>
              <Link
                href="/#anfrage"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white"
              >
                <span>Direkt anfragen</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        ) : (
          filteredCategories.map((category, idx) => (
            <section
              key={category.id}
              id={category.id}
              className="scroll-mt-32"
            >
              <div className="max-w-2xl mb-4 sm:mb-5">
                <p className="text-xs font-semibold text-accent">
                  0{idx + 1}. Gerätebereich · Mobiler Vor-Ort-Service Osnabrück
                </p>
                <h2 className="mt-1 text-xl sm:text-2xl lg:text-[28px] font-extrabold text-primary dark:text-slate-100 tracking-tight text-balance">
                  {category.title}
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-ink-muted leading-relaxed">
                  {category.description}
                </p>
              </div>

              <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
