"use client";
import React, { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShieldCheck,
  MapPin,
  ArrowRight,
  SlidersHorizontal,
  X,
  Check,
  Wrench,
  FileText,
  Phone,
  Camera,
  CheckCircle2,
  Building2,
  Bookmark,
  Scale,
  LayoutGrid,
  List,
  Printer,
  MessageCircle,
  ArrowUpDown,
  QrCode,
  Sparkles,
  RotateCcw,
  Maximize2,
} from "lucide-react";
import {
  INITIAL_MARKETPLACE_DEMO_ITEMS,
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_CONDITIONS,
  MARKETPLACE_WATCHLIST_KEY,
  MARKETPLACE_COMPARE_KEY,
  isMarketplaceItemSold,
  loadLocalMarketplaceItems,
  loadLocalMarketplaceSettings,
  saveLocalMarketplaceItems,
  saveLocalMarketplaceSettings,
  resolveMarketplaceItemGallery,
  type MarketplaceCategoryId,
  type MarketplaceConditionFilter,
  type MarketplaceItem,
  type MarketplaceSettings,
} from "@/data/marketplaceItems";
import {
  ProductCardGallery,
  ProductZoomLightbox,
  GalleryImage,
} from "@/components/MarketplaceGallery";
import { business } from "@/data/site";
import RepairForm from "@/components/RepairForm";
import { useQuickRequest } from "@/components/QuickRequestSheet";

const BRAND_FILTERS = [
  "Alle Marken",
  "Miele",
  "Bosch",
  "Siemens",
  "Liebherr",
  "AEG",
  "Bauknecht",
  "Neff",
] as const;

type SortOption = "recommended" | "brand_asc" | "condition_refurb" | "condition_new";
type ViewMode = "wide_cards" | "tech_list";

// Deterministic QR-style matrix generator for printable DIN A4 product spec sheets
function SpecSheetQrCode({ value, size = 84 }: { value: string; size?: number }) {
  const grid = 21;
  const cells = useMemo(() => {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i++) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    const matrix: boolean[][] = Array.from({ length: grid }, () =>
      Array(grid).fill(false)
    );

    const drawFinder = (r0: number, c0: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          matrix[r0 + r][c0 + c] = isBorder || isInner;
        }
      }
    };
    drawFinder(0, 0);
    drawFinder(0, grid - 7);
    drawFinder(grid - 7, 0);

    for (let i = 8; i < grid - 8; i++) {
      matrix[6][i] = i % 2 === 0;
      matrix[i][6] = i % 2 === 0;
    }

    let seed = Math.abs(hash) || 1234567;
    for (let r = 0; r < grid; r++) {
      for (let c = 0; c < grid; c++) {
        const inFinder =
          (r < 8 && c < 8) ||
          (r < 8 && c >= grid - 8) ||
          (r >= grid - 8 && c < 8) ||
          r === 6 ||
          c === 6;
        if (inFinder) continue;
        seed = (seed * 48271) % 2147483647;
        matrix[r][c] = seed % 11 < 5;
      }
    }
    return matrix;
  }, [value]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${grid} ${grid}`}
      shapeRendering="crispEdges"
      aria-label={`QR-Code für ${value}`}
      className="rounded border border-slate-300 bg-white p-1"
    >
      <rect width={grid} height={grid} fill="#ffffff" />
      {cells.map((row, rIdx) =>
        row.map((filled, cIdx) =>
          filled ? (
            <rect
              key={`${rIdx}-${cIdx}`}
              x={cIdx}
              y={rIdx}
              width={1}
              height={1}
              fill="#0f172a"
            />
          ) : null
        )
      )}
    </svg>
  );
}

export default function MarktplatzPage() {
  const [items, setItems] = useState<MarketplaceItem[]>(() =>
    loadLocalMarketplaceItems()
  );
  const [mpSettings, setMpSettings] = useState<MarketplaceSettings>(() =>
    loadLocalMarketplaceSettings()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [enrCheckInput, setEnrCheckInput] = useState("");
  const [activeCategory, setActiveCategory] = useState<MarketplaceCategoryId>("all");
  const [activeCondition, setActiveCondition] =
    useState<MarketplaceConditionFilter>("all");
  const [activeBrand, setActiveBrand] = useState<string>("Alle Marken");
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [onlyWatchlist, setOnlyWatchlist] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const [viewMode, setViewMode] = useState<ViewMode>("wide_cards");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<boolean>(false);

  const [watchlistIds, setWatchlistIds] = useState<string[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [quickViewItem, setQuickViewItem] = useState<MarketplaceItem | null>(null);
  const [quickViewPhotoIdx, setQuickViewPhotoIdx] = useState(0);
  const [lightboxState, setLightboxState] = useState<{
    item: MarketplaceItem;
    index: number;
  } | null>(null);
  const [printSheetItem, setPrintSheetItem] = useState<MarketplaceItem | null>(null);

  useEffect(() => {
    setQuickViewPhotoIdx(0);
  }, [quickViewItem?.id]);

  const { openQuickRequest } = useQuickRequest();

  // Fetch live inventory & settings from /api/marketplace and sync with localStorage
  const fetchLiveMarketplace = useCallback(async () => {
    try {
      const res = await fetch("/api/marketplace", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as {
        ok?: boolean;
        items?: MarketplaceItem[];
        settings?: MarketplaceSettings;
      };
      if (data.ok && Array.isArray(data.items) && data.items.length > 0) {
        setItems(data.items);
        saveLocalMarketplaceItems(data.items);
      }
      if (data.ok && data.settings) {
        setMpSettings(data.settings);
        saveLocalMarketplaceSettings(data.settings);
      }
    } catch {
      // Keep local fallback items
    }
  }, []);

  useEffect(() => {
    fetchLiveMarketplace();
    const onUpdated = (e: Event) => {
      const custom = e as CustomEvent<MarketplaceItem[]>;
      if (Array.isArray(custom.detail)) {
        setItems(custom.detail);
      } else {
        setItems(loadLocalMarketplaceItems());
      }
    };
    const onSettingsUpdated = (e: Event) => {
      const custom = e as CustomEvent<MarketplaceSettings>;
      if (custom.detail && typeof custom.detail.hideSoldPublicly === "boolean") {
        setMpSettings(custom.detail);
      } else {
        setMpSettings(loadLocalMarketplaceSettings());
      }
    };
    window.addEventListener("hannachi:marketplace-updated", onUpdated);
    window.addEventListener("hannachi:marketplace-settings-updated", onSettingsUpdated);
    return () => {
      window.removeEventListener("hannachi:marketplace-updated", onUpdated);
      window.removeEventListener("hannachi:marketplace-settings-updated", onSettingsUpdated);
    };
  }, [fetchLiveMarketplace]);

  // Restore Watchlist & Compare IDs from localStorage + check URL ?item= deep link
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedWatch = window.localStorage.getItem(MARKETPLACE_WATCHLIST_KEY);
      if (savedWatch) {
        const parsed = JSON.parse(savedWatch);
        if (Array.isArray(parsed)) setWatchlistIds(parsed);
      }
      const savedCompare = window.localStorage.getItem(MARKETPLACE_COMPARE_KEY);
      if (savedCompare) {
        const parsed = JSON.parse(savedCompare);
        if (Array.isArray(parsed)) setCompareIds(parsed.slice(0, 3));
      }
    } catch {
      // Ignore storage errors
    }

    const params = new URLSearchParams(window.location.search);
    const itemParam = params.get("item");
    if (itemParam) {
      const found = items.find((i) => i.id === itemParam);
      if (found) setQuickViewItem(found);
    }
  }, [items]);

  // Close modals on Escape key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setQuickViewItem(null);
        setIsCompareModalOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const toggleWatchlist = (id: string) => {
    setWatchlistIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        window.localStorage.setItem(MARKETPLACE_WATCHLIST_KEY, JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      let next: string[];
      if (prev.includes(id)) {
        next = prev.filter((x) => x !== id);
      } else {
        if (prev.length >= 3) {
          next = [...prev.slice(1), id];
        } else {
          next = [...prev, id];
        }
      }
      try {
        window.localStorage.setItem(MARKETPLACE_COMPARE_KEY, JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const visibleItems = useMemo(
    () =>
      mpSettings.hideSoldPublicly
        ? items.filter((item) => !isMarketplaceItemSold(item))
        : items,
    [items, mpSettings.hideSoldPublicly]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<MarketplaceCategoryId, number> = {
      all: visibleItems.length,
      washing_drying: 0,
      cooling: 0,
      dishwashers: 0,
      ovens_stoves: 0,
      spare_parts: 0,
    };
    for (const item of visibleItems) {
      if (counts[item.category] !== undefined) {
        counts[item.category] += 1;
      }
    }
    return counts;
  }, [visibleItems]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = visibleItems.filter((item) => {
      if (onlyWatchlist && !watchlistIds.includes(item.id)) {
        return false;
      }
      if (activeCategory !== "all" && item.category !== activeCategory) {
        return false;
      }
      if (activeCondition !== "all" && item.conditionType !== activeCondition) {
        return false;
      }
      if (
        activeBrand !== "Alle Marken" &&
        item.brand.toLowerCase() !== activeBrand.toLowerCase()
      ) {
        return false;
      }
      if (
        onlyAvailable &&
        item.availability !== "Sofort verfügbar in Osnabrück"
      ) {
        return false;
      }
      if (!q) return true;

      const haystack = [
        item.title,
        item.brand,
        item.skuOrEnr,
        item.categoryLabel,
        item.shortSpecs,
        ...(item.bulletSpecs || []),
        ...(item.searchKeywords || []),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });

    if (sortBy === "brand_asc") {
      return [...list].sort((a, b) => a.brand.localeCompare(b.brand, "de"));
    }
    if (sortBy === "condition_refurb") {
      return [...list].sort((a, b) =>
        a.conditionType === b.conditionType ? 0 : a.conditionType === "refurbished" ? -1 : 1
      );
    }
    if (sortBy === "condition_new") {
      return [...list].sort((a, b) =>
        a.conditionType === b.conditionType ? 0 : a.conditionType === "new_part" ? -1 : 1
      );
    }
    return list;
  }, [
    visibleItems,
    searchQuery,
    activeCategory,
    activeCondition,
    activeBrand,
    onlyAvailable,
    onlyWatchlist,
    watchlistIds,
    sortBy,
  ]);

  const comparedItems = useMemo(
    () => visibleItems.filter((item) => compareIds.includes(item.id)),
    [visibleItems, compareIds]
  );

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    activeCategory !== "all" ||
    activeCondition !== "all" ||
    activeBrand !== "Alle Marken" ||
    onlyAvailable ||
    onlyWatchlist;

  const resetAllFilters = () => {
    setSearchQuery("");
    setActiveCategory("all");
    setActiveCondition("all");
    setActiveBrand("Alle Marken");
    setOnlyAvailable(false);
    setOnlyWatchlist(false);
  };

  const handleReserveItem = (item: MarketplaceItem) => {
    setQuickViewItem(null);
    setIsCompareModalOpen(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("hannachi:select-catalog-offer", {
          detail: {
            offer: {
              id: item.id,
              title: item.title,
              brand: item.brand,
              category: item.category === "spare_parts" ? "parts" : "appliances",
              deviceType: item.deviceTypeForForm,
              conditionBadge: item.conditionBadge,
              warrantyBadge: "Inkl. schriftlicher Garantie",
              specs: item.bulletSpecs,
              priceLabel: item.priceLabel,
              availability: item.availability,
              inquiryPreset: item.inquiryPreset,
            },
            inquiryTopic: item.inquiryTopic === "spare_parts" ? "parts" : "purchase",
          },
        })
      );

      const anfrageSection = document.getElementById("anfrage");
      if (anfrageSection) {
        anfrageSection.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        openQuickRequest(item.deviceTypeForForm, item.inquiryPreset, item.brand, "repair");
      }
    }
  };

  const buildDirectWhatsAppUrl = (item: MarketplaceItem) => {
    const lines = [
      `Guten Tag Herr Hannachi,`,
      `ich interessiere mich für folgendes Angebot aus Ihrem Online-Marktplatz:`,
      ``,
      `• Artikel: ${item.title}`,
      `• Marke / Referenz: ${item.brand} (${item.skuOrEnr})`,
      `• Zustand: ${item.conditionBadge} (${item.warrantyBadge})`,
      `• Standort: Abholung in 49082 Osnabrück (Iburger Straße 5)`,
      ``,
      `Bitte teilen Sie mir kurz den aktuellen Preis und einen möglichen Abholtermin mit.`,
    ];
    return `${business.whatsappHref}?text=${encodeURIComponent(lines.join("\n"))}`;
  };

  const handlePrintSpecSheet = (item: MarketplaceItem) => {
    setPrintSheetItem(item);
    window.setTimeout(() => {
      window.print();
    }, 120);
  };

  const handleStartSparePartInquiry = (customEnr?: string) => {
    const cleanEnr = (customEnr || enrCheckInput || "").trim();
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("hannachi:select-catalog-offer", {
          detail: {
            offer: cleanEnr
              ? {
                  id: "custom-enr-inquiry",
                  title: `Original-Ersatzteil für Typenschild ${cleanEnr}`,
                  brand: activeBrand !== "Alle Marken" ? activeBrand : "Bosch",
                  category: "parts",
                  deviceType: "Waschmaschine",
                  conditionBadge: "Neu · Originalteil",
                  warrantyBadge: "Inkl. schriftlicher Garantie",
                  specs: [],
                  priceLabel: "Preis auf Anfrage",
                  availability: "Abfrage im Lager Osnabrück",
                  inquiryPreset: `Ersatzteil-Anfrage nach Typenschild E-Nr. / PNC: ${cleanEnr}`,
                }
              : undefined,
            inquiryTopic: "parts",
          },
        })
      );
      const anfrageSection = document.getElementById("anfrage");
      if (anfrageSection) {
        anfrageSection.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        openQuickRequest(
          "Waschmaschine",
          cleanEnr
            ? `Ersatzteil-Anfrage für E-Nr. / PNC: ${cleanEnr}`
            : "Ersatzteil-Anfrage nach Typenschild (E-Nr. / PNC)",
          "",
          "repair"
        );
      }
    }
  };

  const activeSheetItem = printSheetItem || quickViewItem || items[0] || INITIAL_MARKETPLACE_DEMO_ITEMS[0];

  return (
    <div className="min-h-screen bg-surface dark:bg-slate-950">
      {/* ═══════════════════════════════════════════════════════════════════
          PRINT-ONLY DIN A4 PRODUCT & WARRANTY DATA SHEET
      ═══════════════════════════════════════════════════════════════════ */}
      {activeSheetItem && (
        <div className="hidden print:block bg-white text-slate-900 p-8 max-w-[210mm] mx-auto">
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Produkt- &amp; Garantiedatenblatt · Standort Osnabrück
              </p>
              <h1 className="mt-1 text-2xl font-extrabold text-slate-900">
                {business.name} {business.tagline}
              </h1>
              <p className="mt-1 text-xs text-slate-700">
                {business.legalLicense} · Inhaber: {business.owner}
              </p>
              <p className="text-xs text-slate-700">
                {business.street}, {business.zip} {business.city} · Tel. {business.phoneDisplay}
              </p>
            </div>
            <div className="text-right flex flex-col items-end">
              <SpecSheetQrCode
                value={`${business.url}/marktplatz?item=${encodeURIComponent(activeSheetItem.id)}`}
                size={84}
              />
              <span className="mt-1 text-[10px] font-mono text-slate-600">
                ID: {activeSheetItem.id}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs font-bold text-slate-600">
              {activeSheetItem.categoryLabel} · {activeSheetItem.brand} · {activeSheetItem.skuOrEnr}
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-slate-900">
              {activeSheetItem.title}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              Zustand: {activeSheetItem.conditionBadge} · {activeSheetItem.warrantyBadge} · Preis: {activeSheetItem.priceLabel}
            </p>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-300 pb-1.5">
              Wichtige Produktmerkmale
            </h3>
            <ul className="mt-2.5 space-y-1.5 text-xs text-slate-800 list-disc pl-5">
              {activeSheetItem.bulletSpecs.map((spec) => (
                <li key={spec}>{spec}</li>
              ))}
            </ul>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-300 pb-1.5">
              Technische Spezifikationen
            </h3>
            <dl className="mt-2 divide-y divide-slate-200 border border-slate-200 rounded">
              {activeSheetItem.detailedSpecs.map((row) => (
                <div key={row.label} className="grid grid-cols-12 px-3 py-2 text-xs">
                  <dt className="col-span-5 font-bold text-slate-700">{row.label}</dt>
                  <dd className="col-span-7 text-slate-900">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 text-xs">
            <div className="border border-slate-300 rounded p-3.5">
              <p className="font-extrabold text-slate-900">
                Schriftliche Verkäufergarantie &amp; Gewährleistung
              </p>
              <p className="mt-1 text-slate-700 leading-relaxed">
                {activeSheetItem.warrantyTerms}
              </p>
            </div>
            <div className="border border-slate-300 rounded p-3.5">
              <p className="font-extrabold text-slate-900">
                Mobiler Vor-Ort-Service &amp; Übergabe in Osnabrück
              </p>
              <p className="mt-1 text-slate-700 leading-relaxed">
                {activeSheetItem.pickupInfo}
              </p>
            </div>
          </div>

          <p className="mt-6 pt-4 border-t border-slate-300 text-[10px] text-slate-600">
            Hinweis: Unverbindliches Katalogdatenblatt zur Vorab-Information. {business.warrantyNotice}
          </p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          1. MARKETPLACE HERO & TRUST BAR (HIDDEN IN PRINT)
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="print:hidden">
        <section className="relative overflow-hidden bg-primary-dark text-white border-b border-white/10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-28 right-0 h-[360px] w-[360px] rounded-full bg-accent/15 blur-[110px]"
          />

          <div className="container-page relative py-6 sm:py-8 lg:py-9">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 lg:gap-6">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold tracking-wide text-accent-light">
                  {business.legalLicense} · Standort {business.zip} {business.city}
                </p>
                <h1 className="mt-1.5 text-2xl sm:text-3xl lg:text-[34px] font-extrabold tracking-tight text-white leading-[1.15] text-balance">
                  Marktplatz: Geprüfte Haushaltsgeräte &amp; Original-Ersatzteile
                </h1>
                <p className="mt-2 max-w-2xl text-xs sm:text-sm lg:text-[15px] text-white/80 leading-relaxed">
                  Mobiler Vor-Ort-Service in Osnabrück &amp; Umgebung · Inklusive schriftlicher Verkäufergarantie auf alle Geräte
                </p>
              </div>

              {/* Quick Admin Inventory Link for Mrs./Mr. Hannachi */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Link
                  href="/admin"
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-bold text-white/90 hover:bg-white/15 transition-colors whitespace-nowrap"
                >
                  <SlidersHorizontal size={13} className="text-accent-light" />
                  <span>Bestand verwalten</span>
                </Link>
                <a
                  href="#anfrage"
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-accent px-3.5 py-1.5 text-xs font-extrabold text-white hover:bg-accent-dark transition-colors whitespace-nowrap"
                >
                  <span>Direkt zur Reservierung</span>
                  <ArrowRight size={13} />
                </a>
              </div>
            </div>

            {/* 4 Required Trust Points */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-4 border-t border-white/12">
              {[
                {
                  title: "Schriftliche Verkäufergarantie",
                  sub: "Offizieller Garantiebeleg beim Kauf",
                },
                {
                  title: "Geprüfte Handelsware vor Verkauf",
                  sub: "Intern funktionskontrolliert im eigenen Lager",
                },
                {
                  title: "Mobiler Vor-Ort-Service",
                  sub: "Direkt bei Ihnen zu Hause in Osnabrück",
                },
                {
                  title: "Unverbindliche Reservierung",
                  sub: "Kein Online-Warenkorb · Preis auf Anfrage",
                },
              ].map((badge) => (
                <div
                  key={badge.title}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5"
                >
                  <p className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
                    <span className="truncate">{badge.title}</span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/65 pl-[20px] truncate">
                    {badge.sub}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            2. STICKY LEFT FILTER SIDEBAR + WIDE PRODUCT CARDS LAYOUT
        ═══════════════════════════════════════════════════════════════════ */}
        <section
          aria-label="Marktplatz Katalog und Filter"
          className="py-6 sm:py-8 lg:py-10"
        >
          <div className="container-page">
            {/* Mobile & Tablet Filter Drawer Toggle */}
            <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen((open) => !open)}
                aria-expanded={mobileFiltersOpen}
                className="inline-flex min-h-[42px] flex-1 items-center justify-between gap-2 rounded-xl border border-primary/12 dark:border-white/12 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-extrabold text-primary dark:text-white shadow-xs cursor-pointer"
              >
                <span className="inline-flex items-center gap-2">
                  <SlidersHorizontal size={15} className="text-accent" />
                  <span>
                    {mobileFiltersOpen ? "Filter ausblenden" : "Suche & Filter einblenden"}
                  </span>
                </span>
                <span className="font-mono text-[11px] text-accent">
                  {filteredItems.length} Treffer
                </span>
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="inline-flex min-h-[42px] items-center gap-1 rounded-xl border border-primary/12 dark:border-white/12 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-accent cursor-pointer shrink-0"
                >
                  <RotateCcw size={13} />
                  <span>Reset</span>
                </button>
              )}
            </div>

            <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
              {/* ─────────────────────────────────────────────────────────────
                  LEFT COLUMN (3 COLS): COMPACT STICKY ADVANCED FILTER SIDEBAR
              ───────────────────────────────────────────────────────────── */}
              <aside
                className={`${
                  mobileFiltersOpen ? "block" : "hidden"
                } lg:block lg:col-span-3 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto space-y-4`}
              >
                <div className="rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 p-4 space-y-4 shadow-xs">
                  {/* Header + Reset */}
                  <div className="flex items-center justify-between gap-2 border-b border-primary/8 dark:border-white/10 pb-3.5">
                    <h2 className="text-sm font-extrabold text-primary dark:text-white flex items-center gap-2">
                      <SlidersHorizontal size={16} className="text-accent" />
                      <span>Filter &amp; Produktsuche</span>
                    </h2>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={resetAllFilters}
                        className="inline-flex items-center gap-1 text-xs font-extrabold text-accent hover:underline cursor-pointer"
                      >
                        <RotateCcw size={12} />
                        <span>Zurücksetzen</span>
                      </button>
                    )}
                  </div>

                  {/* 1. Live Search Input */}
                  <div>
                    <label
                      htmlFor="mp-sidebar-search"
                      className="block text-xs font-bold text-ink-muted mb-1.5"
                    >
                      Stichwort, Modell, E-Nr. oder PNC
                    </label>
                    <div className="relative">
                      <Search
                        size={16}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
                        aria-hidden="true"
                      />
                      <input
                        id="mp-sidebar-search"
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="z. B. Miele W1, SMU68TS06E, Heizpumpe..."
                        data-testid="marketplace-search-input"
                        className="w-full min-h-[44px] rounded-xl border border-primary/15 dark:border-white/15 bg-surface dark:bg-slate-950 pl-10 pr-9 py-2.5 text-xs sm:text-sm font-medium text-primary dark:text-slate-100 placeholder:text-ink-faint focus:border-accent focus:outline-none transition-colors"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          aria-label="Suche löschen"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-md text-ink-muted hover:text-primary dark:hover:text-white cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 2. Category List (Alle + 5 Categories, 1 Starter Demo each) */}
                  <div>
                    <p className="text-xs font-bold text-ink-muted mb-2">
                      Sortimentsbereich
                    </p>
                    <div
                      role="tablist"
                      aria-label="Marktplatz Kategorien"
                      className="space-y-1"
                    >
                      {MARKETPLACE_CATEGORIES.map((cat) => {
                        const active = activeCategory === cat.id;
                        const count = categoryCounts[cat.id];
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => setActiveCategory(cat.id)}
                            data-testid={`marketplace-cat-${cat.id}`}
                            className={`flex w-full min-h-[36px] items-center justify-between gap-2 rounded-xl px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                              active
                                ? "bg-accent text-white shadow-xs"
                                : "text-primary dark:text-slate-200 hover:bg-surface dark:hover:bg-slate-800"
                            }`}
                          >
                            <span className="truncate">{cat.label}</span>
                            <span
                              className={`font-mono text-[11px] tabular-nums ${
                                active ? "text-white/90" : "text-ink-muted"
                              }`}
                            >
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Condition Filter */}
                  <div className="pt-3 border-t border-primary/8 dark:border-white/10">
                    <p className="text-xs font-bold text-ink-muted mb-2">
                      Artikelzustand
                    </p>
                    <div className="space-y-1.5">
                      {MARKETPLACE_CONDITIONS.map((cond) => {
                        const active = activeCondition === cond.id;
                        return (
                          <button
                            key={cond.id}
                            type="button"
                            onClick={() => setActiveCondition(cond.id)}
                            aria-pressed={active}
                            className={`flex w-full min-h-[36px] items-center justify-between rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                              active
                                ? "border-primary dark:border-accent bg-primary dark:bg-accent text-white font-extrabold"
                                : "border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-950 text-ink-muted hover:text-primary dark:hover:text-white"
                            }`}
                          >
                            <span className="truncate">{cond.label}</span>
                            {active && <Check size={13} className="shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. Brand Filter */}
                  <div className="pt-3 border-t border-primary/8 dark:border-white/10">
                    <p className="text-xs font-bold text-ink-muted mb-2">
                      Hersteller / Marke
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {BRAND_FILTERS.map((brand) => {
                        const active = activeBrand === brand;
                        return (
                          <button
                            key={brand}
                            type="button"
                            onClick={() => setActiveBrand(brand)}
                            aria-pressed={active}
                            className={`min-h-[32px] rounded-lg border px-2.5 py-1 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                              active
                                ? "border-accent bg-accent text-white font-extrabold"
                                : "border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-950 text-ink-muted hover:text-primary dark:hover:text-white"
                            }`}
                          >
                            {brand}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 5. Availability Checkbox */}
                  <div className="pt-3 border-t border-primary/8 dark:border-white/10">
                    <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
                      <span className="text-xs font-bold text-primary dark:text-slate-200">
                        Nur sofort abholbereite Artikel
                      </span>
                      <input
                        type="checkbox"
                        checked={onlyAvailable}
                        onChange={(e) => setOnlyAvailable(e.target.checked)}
                        className="h-4 w-4 rounded border-primary/25 text-accent focus:ring-accent cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                {/* Sidebar E-Nr. / PNC Direct Compatibility Box */}
                <div className="rounded-2xl border border-primary/10 dark:border-white/10 bg-primary-dark text-white p-4 space-y-2.5">
                  <p className="text-xs font-extrabold text-accent-light">
                    Typenschild-Schnellprüfung (E-Nr. / PNC)
                  </p>
                  <p className="text-[11px] text-white/75 leading-relaxed">
                    Geben Sie die E-Nr. oder PNC ein, um passende Original-Ersatzteile anzufragen:
                  </p>
                  <div className="flex flex-col xl:flex-row gap-2">
                    <input
                      type="text"
                      value={enrCheckInput}
                      onChange={(e) => setEnrCheckInput(e.target.value)}
                      placeholder="z. B. WDB030WCS"
                      aria-label="E-Nr. oder PNC für Ersatzteilprüfung eingeben"
                      className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs text-white placeholder:text-white/45 focus:border-accent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleStartSparePartInquiry(enrCheckInput)}
                      className="shrink-0 rounded-xl bg-accent px-3 py-2 text-xs font-extrabold text-white hover:bg-accent-dark transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Anfragen
                    </button>
                  </div>
                </div>
              </aside>

              {/* ─────────────────────────────────────────────────────────────
                  RIGHT COLUMN (9 COLS): TOOLBAR + WIDE CARDS / TECH LIST
              ───────────────────────────────────────────────────────────── */}
              <div className="lg:col-span-9 space-y-5">
                {/* Marketplace Control Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 shadow-xs">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <p className="text-xs sm:text-sm font-extrabold text-primary dark:text-white tabular-nums">
                      {filteredItems.length}{" "}
                      {filteredItems.length === 1 ? "Angebot" : "Angebote"}
                      <span className="font-normal text-ink-muted ml-1.5">
                        ({hasActiveFilters ? "Gefiltert" : "Aktueller Bestand"})
                      </span>
                    </p>

                    {/* Watchlist Filter Toggle */}
                    <button
                      type="button"
                      onClick={() => setOnlyWatchlist((w) => !w)}
                      aria-pressed={onlyWatchlist}
                      data-testid="marketplace-watchlist-toggle"
                      className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                        onlyWatchlist
                          ? "border-amber-500 bg-amber-500 text-slate-950"
                          : "border-primary/12 dark:border-white/12 bg-surface dark:bg-slate-950 text-primary dark:text-slate-200 hover:border-accent"
                      }`}
                    >
                      <Bookmark size={13} className="shrink-0" />
                      <span>Merkliste</span>
                      <span className="font-mono tabular-nums">({watchlistIds.length})</span>
                    </button>

                    {/* Compare Drawer Trigger */}
                    {compareIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsCompareModalOpen(true)}
                        data-testid="marketplace-open-compare-btn"
                        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-primary dark:bg-accent px-3 py-1.5 text-xs font-extrabold text-white transition-all whitespace-nowrap cursor-pointer"
                      >
                        <Scale size={13} className="shrink-0" />
                        <span>Vergleich öffnen ({compareIds.length}/3)</span>
                      </button>
                    )}
                  </div>

                  {/* Right Controls: Sort + View Mode Switcher */}
                  <div className="flex items-center gap-2.5 ml-auto">
                    <div className="relative flex items-center">
                      <ArrowUpDown
                        size={13}
                        className="pointer-events-none absolute left-3 text-ink-muted"
                      />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        aria-label="Angebote sortieren"
                        className="min-h-[36px] rounded-xl border border-primary/12 dark:border-white/12 bg-surface dark:bg-slate-950 pl-8 pr-3 py-1.5 text-xs font-bold text-primary dark:text-slate-200 focus:border-accent focus:outline-none cursor-pointer"
                      >
                        <option value="recommended">Sortierung: Standard</option>
                        <option value="brand_asc">Marke (A–Z)</option>
                        <option value="condition_refurb">Geprüfte Geräte zuerst</option>
                        <option value="condition_new">Original-Ersatzteile zuerst</option>
                      </select>
                    </div>

                    {/* Grid (Wide Cards) vs. Technical List View Switcher */}
                    <div
                      role="group"
                      aria-label="Ansichtsmodus wählen"
                      className="inline-flex items-center rounded-xl border border-primary/12 dark:border-white/12 bg-surface dark:bg-slate-950 p-1"
                    >
                      <button
                        type="button"
                        onClick={() => setViewMode("wide_cards")}
                        aria-pressed={viewMode === "wide_cards"}
                        title="Breite Katalogkarten"
                        className={`inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-xs font-bold transition-colors cursor-pointer ${
                          viewMode === "wide_cards"
                            ? "bg-primary dark:bg-accent text-white"
                            : "text-ink-muted hover:text-primary dark:hover:text-white"
                        }`}
                      >
                        <LayoutGrid size={13} />
                        <span className="hidden sm:inline">Karten</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode("tech_list")}
                        aria-pressed={viewMode === "tech_list"}
                        title="Kompakte Technische Liste"
                        className={`inline-flex h-7 items-center gap-1 rounded-lg px-2.5 text-xs font-bold transition-colors cursor-pointer ${
                          viewMode === "tech_list"
                            ? "bg-primary dark:bg-accent text-white"
                            : "text-ink-muted hover:text-primary dark:hover:text-white"
                        }`}
                      >
                        <List size={13} />
                        <span className="hidden sm:inline">Liste</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Empty Filter State */}
                {filteredItems.length === 0 ? (
                  <div className="rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 p-8 sm:p-12 text-center space-y-4">
                    <p className="text-lg font-extrabold text-primary dark:text-white">
                      Keine passenden Angebote für diese Filterauswahl
                    </p>
                    <p className="text-sm text-ink-muted max-w-lg mx-auto leading-relaxed">
                      Setzen Sie die Filter zurück oder senden Sie uns direkt Ihre unverbindliche Geräte- oder Ersatzteilanfrage.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={resetAllFilters}
                        className="inline-flex min-h-[42px] items-center justify-center rounded-xl bg-primary dark:bg-slate-800 px-4 py-2 text-xs font-extrabold text-white cursor-pointer"
                      >
                        Alle Kategorien anzeigen
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartSparePartInquiry()}
                        className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-extrabold text-white cursor-pointer"
                      >
                        <span>Wunschartikel direkt anfragen</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                ) : viewMode === "wide_cards" ? (
                  /* ───────────────────────────────────────────────────────────
                     MODE A: WIDE PRODUCT CARDS (STICKY SIDEBAR RIGHT CANVAS)
                  ─────────────────────────────────────────────────────────── */
                  <div className="space-y-4">
                    {filteredItems.map((item) => {
                      const isSaved = watchlistIds.includes(item.id);
                      const isCompared = compareIds.includes(item.id);
                      const isSold = isMarketplaceItemSold(item);
                      const isAvailable =
                        item.availability === "Sofort verfügbar in Osnabrück";

                      return (
                        <article
                          key={item.id}
                          data-testid={`marketplace-card-${item.id}`}
                          className={`group rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:border-accent/50 transition-all duration-200 ${
                            isSold ? "opacity-85" : ""
                          }`}
                        >
                          <div className="grid sm:grid-cols-12">
                            {/* Left Interactive Multi-Photo Gallery Column (4 cols on sm+) */}
                            <div className="sm:col-span-4 bg-slate-950 overflow-hidden">
                              <ProductCardGallery
                                item={item}
                                onOpenLightbox={(idx) =>
                                  setLightboxState({ item, index: idx })
                                }
                                topRightActions={
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => toggleWatchlist(item.id)}
                                      aria-pressed={isSaved}
                                      title={
                                        isSaved
                                          ? "Von Merkliste entfernen"
                                          : "Auf Merkliste speichern"
                                      }
                                      className={`inline-flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-extrabold backdrop-blur-xs transition-colors cursor-pointer ${
                                        isSaved
                                          ? "bg-amber-400 text-slate-950"
                                          : "bg-slate-950/75 text-white hover:bg-slate-900"
                                      }`}
                                    >
                                      <Bookmark size={11} />
                                      <span className="hidden xl:inline">
                                        {isSaved ? "Gemerkt" : "Merken"}
                                      </span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => toggleCompare(item.id)}
                                      aria-pressed={isCompared}
                                      title="Zum technischen Vergleich hinzufügen (max. 3)"
                                      className={`inline-flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-extrabold backdrop-blur-xs transition-colors cursor-pointer ${
                                        isCompared
                                          ? "bg-accent text-white"
                                          : "bg-slate-950/75 text-white hover:bg-slate-900"
                                      }`}
                                    >
                                      <Scale size={11} />
                                      <span className="hidden xl:inline">
                                        {isCompared ? "Vergleich" : "Vergleichen"}
                                      </span>
                                    </button>
                                  </>
                                }
                              />
                            </div>

                            {/* Right Content & Spec Column (8 cols on sm+) */}
                            <div className="sm:col-span-8 p-4 sm:p-5 flex flex-col justify-between">
                              <div>
                                {/* Clean Unboxed Metadata Line: Brand · Condition · Warranty · Availability */}
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs">
                                  <span className="font-extrabold text-primary dark:text-white">
                                    {item.brand}
                                  </span>
                                  <span aria-hidden="true" className="text-ink-faint">
                                    ·
                                  </span>
                                  <span className="font-semibold text-accent">
                                    {item.conditionBadge}
                                  </span>
                                  <span aria-hidden="true" className="text-ink-faint">
                                    ·
                                  </span>
                                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                                    <ShieldCheck size={12} className="shrink-0" />
                                    <span>{item.warrantyBadge}</span>
                                  </span>
                                  <span aria-hidden="true" className="text-ink-faint">
                                    ·
                                  </span>
                                  <span
                                    className={`font-medium ${
                                      isSold
                                        ? "text-ink-muted line-through"
                                        : isAvailable
                                        ? "text-ink-muted"
                                        : "text-amber-700 dark:text-amber-300"
                                    }`}
                                  >
                                    {item.availability}
                                  </span>
                                </div>

                                {/* Product Title */}
                                <h3 className="mt-1.5 text-base sm:text-[17px] font-extrabold text-primary dark:text-slate-100 leading-snug">
                                  {item.title}
                                </h3>

                                {/* Short Technical Summary */}
                                <p className="mt-0.5 text-xs font-semibold text-accent dark:text-accent-light">
                                  {item.shortSpecs}
                                </p>

                                {/* 3 Concise Bullet Specs */}
                                <ul className="mt-2.5 space-y-1 border-t border-primary/8 dark:border-white/10 pt-2.5 text-xs text-ink-muted">
                                  {item.bulletSpecs.map((spec) => (
                                    <li
                                      key={spec}
                                      className="flex items-start gap-1.5 leading-snug"
                                    >
                                      <Check
                                        size={13}
                                        className="mt-0.5 shrink-0 text-accent"
                                        aria-hidden="true"
                                      />
                                      <span>{spec}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Bottom Action Bar */}
                              <div className="mt-3.5 pt-3 border-t border-primary/8 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                <div>
                                  <p className="text-[10px] font-semibold text-ink-muted">
                                    Konditionen
                                  </p>
                                  <p className="text-sm sm:text-base font-extrabold text-primary dark:text-white tabular-nums">
                                    {item.priceLabel}
                                  </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setQuickViewItem(item)}
                                    data-testid={`marketplace-details-${item.id}`}
                                    className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-primary/15 dark:border-white/15 bg-surface dark:bg-slate-950 px-3 py-1.5 text-xs font-extrabold text-primary dark:text-slate-100 hover:border-accent hover:text-accent transition-colors whitespace-nowrap cursor-pointer"
                                  >
                                    <FileText size={13} className="shrink-0" />
                                    <span>Details &amp; PDF</span>
                                  </button>

                                  {!isSold && (
                                    <a
                                      href={buildDirectWhatsAppUrl(item)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Direkt per WhatsApp bei Herrn Hannachi anfragen"
                                      className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-emerald-700 transition-colors whitespace-nowrap"
                                    >
                                      <MessageCircle size={13} className="shrink-0" />
                                      <span>WhatsApp</span>
                                    </a>
                                  )}

                                  {isSold ? (
                                    <button
                                      type="button"
                                      disabled
                                      data-testid={`marketplace-sold-${item.id}`}
                                      className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-primary/15 dark:border-white/15 bg-surface dark:bg-slate-950 px-3.5 py-1.5 text-xs font-bold text-ink-muted cursor-not-allowed whitespace-nowrap"
                                    >
                                      <span>Bereits verkauft</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleReserveItem(item)}
                                      data-testid={`marketplace-reserve-${item.id}`}
                                      className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl bg-accent px-3.5 py-1.5 text-xs font-extrabold text-white shadow-xs hover:bg-accent-dark transition-colors whitespace-nowrap cursor-pointer"
                                    >
                                      <span>Reservieren</span>
                                      <ArrowRight size={13} className="shrink-0" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  /* ───────────────────────────────────────────────────────────
                     MODE B: COMPACT TECHNICAL SPEC LIST VIEW
                  ─────────────────────────────────────────────────────────── */
                  <div className="rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 overflow-hidden divide-y divide-primary/8 dark:divide-white/10">
                    {filteredItems.map((item) => {
                      const isSaved = watchlistIds.includes(item.id);
                      const isCompared = compareIds.includes(item.id);
                      const isSold = isMarketplaceItemSold(item);
                      const gallery = resolveMarketplaceItemGallery(item);
                      const cover = gallery[0];
                      return (
                        <div
                          key={item.id}
                          className={`p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3.5 hover:bg-surface/60 dark:hover:bg-slate-800/40 transition-colors ${
                            isSold ? "opacity-80" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <button
                              type="button"
                              onClick={() => setLightboxState({ item, index: 0 })}
                              title="Produktfotos vergrößern"
                              className="relative h-14 w-18 shrink-0 overflow-hidden rounded-xl border border-primary/10 dark:border-white/15 bg-slate-900 cursor-zoom-in"
                            >
                              <GalleryImage
                                slide={cover}
                                alt={item.title}
                                className="h-full w-full object-cover"
                              />
                              {gallery.length > 1 && (
                                <span className="absolute bottom-1 right-1 rounded bg-slate-950/85 px-1 font-mono text-[10px] font-bold text-white tabular-nums">
                                  +{gallery.length - 1}
                                </span>
                              )}
                            </button>

                            <div className="min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="font-extrabold text-primary dark:text-white">
                                  {item.brand}
                                </span>
                                <span aria-hidden="true" className="text-ink-faint">
                                  ·
                                </span>
                                <span className="font-mono text-[11px] text-ink-muted">
                                  {item.skuOrEnr}
                                </span>
                                <span aria-hidden="true" className="text-ink-faint">
                                  ·
                                </span>
                                <span className="font-bold text-accent">
                                  {item.conditionBadge}
                                </span>
                                <span aria-hidden="true" className="text-ink-faint">
                                  ·
                                </span>
                                <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                                  {item.warrantyBadge}
                                </span>
                                {isSold && (
                                  <>
                                    <span aria-hidden="true" className="text-ink-faint">
                                      ·
                                    </span>
                                    <span className="font-semibold text-ink-muted line-through">
                                      Verkauft (Abgeschlossen)
                                    </span>
                                  </>
                                )}
                              </div>

                              <h3 className="text-sm sm:text-base font-extrabold text-primary dark:text-slate-100">
                                {item.title}
                              </h3>
                              <p className="text-xs text-ink-muted">{item.shortSpecs}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                            <span className="text-xs font-extrabold text-primary dark:text-white mr-2 whitespace-nowrap">
                              {item.priceLabel}
                            </span>

                            <button
                              type="button"
                              onClick={() => toggleCompare(item.id)}
                              aria-pressed={isCompared}
                              title="Vergleichen"
                              className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors cursor-pointer ${
                                isCompared
                                  ? "border-accent bg-accent text-white"
                                  : "border-primary/15 dark:border-white/15 text-ink-muted hover:text-primary dark:hover:text-white"
                              }`}
                            >
                              <Scale size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleWatchlist(item.id)}
                              aria-pressed={isSaved}
                              title="Merken"
                              className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors cursor-pointer ${
                                isSaved
                                  ? "border-amber-500 bg-amber-400 text-slate-950"
                                  : "border-primary/15 dark:border-white/15 text-ink-muted hover:text-primary dark:hover:text-white"
                              }`}
                            >
                              <Bookmark size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setQuickViewItem(item)}
                              className="inline-flex min-h-[36px] items-center gap-1 rounded-xl border border-primary/15 dark:border-white/15 px-3 py-1.5 text-xs font-extrabold text-primary dark:text-slate-100 hover:border-accent cursor-pointer whitespace-nowrap"
                            >
                              <FileText size={13} />
                              <span>Datenblatt</span>
                            </button>

                            {isSold ? (
                              <button
                                type="button"
                                disabled
                                className="inline-flex min-h-[36px] items-center gap-1 rounded-xl border border-primary/15 dark:border-white/15 bg-surface dark:bg-slate-950 px-3.5 py-1.5 text-xs font-bold text-ink-muted cursor-not-allowed whitespace-nowrap"
                              >
                                <span>Bereits verkauft</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleReserveItem(item)}
                                className="inline-flex min-h-[36px] items-center gap-1 rounded-xl bg-accent px-3.5 py-1.5 text-xs font-extrabold text-white hover:bg-accent-dark cursor-pointer whitespace-nowrap"
                              >
                                <span>Reservieren</span>
                                <ArrowRight size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ═════════════════════════════════════════════════════════════
                    4. "ERSATZTEIL NICHT GEFUNDEN?" (SPARE PART FINDER BANNER)
                ═════════════════════════════════════════════════════════════ */}
                <div
                  data-testid="spare-part-finder-banner"
                  className="rounded-2xl border border-primary/12 dark:border-white/12 bg-primary-dark text-white p-6 sm:p-8 shadow-lg"
                >
                  <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
                    <div className="lg:col-span-8 space-y-2">
                      <p className="text-xs font-extrabold tracking-wide text-accent-light">
                        Direkter Lager-Abgleich per Typenschild (E-Nr. / PNC / Service-Nr.)
                      </p>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                        Ersatzteil nicht gefunden?
                      </h2>
                      <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                        Ihr gesuchtes Ersatzteil ist nicht online? Schicken Sie uns ein Foto vom Typenschild (E-Nr. / PNC) – wir prüfen unseren Lagerbestand in Osnabrück!
                      </p>
                    </div>

                    <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleStartSparePartInquiry()}
                        data-testid="start-spare-part-inquiry-btn"
                        className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-xs sm:text-sm font-extrabold text-white shadow-md hover:bg-accent-dark transition-all whitespace-nowrap cursor-pointer"
                      >
                        <Camera size={16} className="shrink-0" />
                        <span>Ersatzteil-Anfrage starten</span>
                        <ArrowRight size={15} className="shrink-0" />
                      </button>
                      <a
                        href={business.phoneHref}
                        className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-white/90 hover:bg-white/10 transition-colors whitespace-nowrap"
                      >
                        <Phone size={14} className="text-accent-light shrink-0" />
                        <span>Vor-Ort-Service: {business.phoneDisplay}</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            5. INLINE RESERVATION & INQUIRY SECTION (#anfrage)
        ═══════════════════════════════════════════════════════════════════ */}
        <section
          id="anfrage"
          className="scroll-mt-20 border-t border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 py-10 sm:py-12 lg:py-14"
        >
          <div className="container-page">
            <div className="mx-auto max-w-3xl text-center mb-8">
              <p className="text-xs font-extrabold tracking-wide text-accent">
                Unverbindliche Reservierung &amp; Bestandsanfrage · Kein Online-Kaufzwang
              </p>
              <h2 className="mt-1.5 text-2xl sm:text-3xl lg:text-[34px] font-extrabold text-primary dark:text-slate-100 text-balance">
                Gerät reservieren oder Original-Ersatzteil anfragen
              </h2>
              <p className="mt-2.5 text-xs sm:text-sm lg:text-[15px] text-ink-muted leading-relaxed">
                Wählen Sie oben im Marktplatz ein Angebot aus oder tragen Sie Ihr gewünschtes Gerät bzw. Ersatzteil direkt hier ein. Herr Hannachi meldet sich kurzfristig zur Abstimmung Ihres Vor-Ort-Termins in Osnabrück &amp; Umgebung.
              </p>
            </div>

            <div className="mx-auto max-w-3xl">
              <RepairForm defaultDevice="Waschmaschine" />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            FLOATING SIDE-BY-SIDE COMPARISON BAR
        ═══════════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {comparedItems.length > 0 && !isCompareModalOpen && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.18 }}
              className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[94vw] max-w-2xl rounded-2xl border border-white/15 bg-primary-dark/95 text-white px-4 py-3 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Scale size={17} className="text-accent-light shrink-0" />
                <span className="text-xs sm:text-sm font-extrabold truncate">
                  {comparedItems.length} {comparedItems.length === 1 ? "Artikel" : "Artikel"} im Direktvergleich
                </span>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    setCompareIds([]);
                    try {
                      window.localStorage.removeItem(MARKETPLACE_COMPARE_KEY);
                    } catch {
                      // Ignore
                    }
                  }}
                  className="rounded-lg border border-white/15 px-2.5 py-1.5 text-xs font-bold text-white/75 hover:text-white cursor-pointer"
                >
                  Leeren
                </button>
                <button
                  type="button"
                  onClick={() => setIsCompareModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-1.5 text-xs font-extrabold text-white hover:bg-accent-dark cursor-pointer"
                >
                  <span>Technische Tabelle öffnen</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════════════════════════════════════════════════════════════
            SIDE-BY-SIDE TECHNICAL COMPARISON MODAL
        ═══════════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {isCompareModalOpen && comparedItems.length > 0 && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Technischer Artikelvergleich"
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 12 }}
                transition={{ duration: 0.18 }}
                className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-primary/15 dark:border-white/15 bg-white dark:bg-slate-900 text-primary dark:text-slate-100 shadow-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between gap-3 border-b border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-950 px-5 sm:px-6 py-4">
                  <div>
                    <p className="text-xs font-bold text-accent">
                      Direktvergleich ({comparedItems.length} von max. 3 Artikeln)
                    </p>
                    <h3 className="text-base sm:text-lg font-extrabold text-primary dark:text-white">
                      Technische Spezifikationen &amp; Garantie im Vergleich
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCompareModalOpen(false)}
                    aria-label="Vergleich schließen"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/10 dark:border-white/10 text-ink-muted hover:text-primary dark:hover:text-white cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="overflow-x-auto overflow-y-auto p-5 sm:p-6">
                  <table className="w-full min-w-[600px] border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-primary/10 dark:border-white/10">
                        <th className="py-3 pr-4 font-bold text-ink-muted w-40">
                          Merkmal
                        </th>
                        {comparedItems.map((item) => (
                          <th key={item.id} className="py-3 px-3 align-top">
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-extrabold text-primary dark:text-white text-sm leading-snug">
                                {item.title}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleCompare(item.id)}
                                title="Aus Vergleich entfernen"
                                className="text-ink-muted hover:text-red-500 shrink-0 cursor-pointer"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/8 dark:divide-white/10">
                      <tr>
                        <td className="py-2.5 pr-4 font-bold text-ink-muted">
                          Marke &amp; Referenz
                        </td>
                        {comparedItems.map((item) => (
                          <td key={item.id} className="py-2.5 px-3 font-semibold">
                            {item.brand} · <span className="font-mono">{item.skuOrEnr}</span>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2.5 pr-4 font-bold text-ink-muted">
                          Kategorie
                        </td>
                        {comparedItems.map((item) => (
                          <td key={item.id} className="py-2.5 px-3">
                            {item.categoryLabel}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2.5 pr-4 font-bold text-ink-muted">
                          Zustand &amp; Garantie
                        </td>
                        {comparedItems.map((item) => (
                          <td key={item.id} className="py-2.5 px-3 font-bold text-emerald-700 dark:text-emerald-300">
                            {item.conditionBadge} · {item.warrantyBadge}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2.5 pr-4 font-bold text-ink-muted">
                          Technische Kurzdaten
                        </td>
                        {comparedItems.map((item) => (
                          <td key={item.id} className="py-2.5 px-3">
                            {item.shortSpecs}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2.5 pr-4 font-bold text-ink-muted">
                          Ausstattung &amp; Merkmale
                        </td>
                        {comparedItems.map((item) => (
                          <td key={item.id} className="py-2.5 px-3">
                            <ul className="space-y-1 list-disc pl-4 text-ink-muted">
                              {item.bulletSpecs.map((b) => (
                                <li key={b}>{b}</li>
                              ))}
                            </ul>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2.5 pr-4 font-bold text-ink-muted">
                          Verfügbarkeit &amp; Preis
                        </td>
                        {comparedItems.map((item) => (
                          <td key={item.id} className="py-2.5 px-3 font-extrabold">
                            {item.availability} · {item.priceLabel}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-3 pr-4 font-bold text-ink-muted">
                          Aktion
                        </td>
                        {comparedItems.map((item) => {
                          const isSold = isMarketplaceItemSold(item);
                          return (
                            <td key={item.id} className="py-3 px-3">
                              {isSold ? (
                                <button
                                  type="button"
                                  disabled
                                  className="inline-flex min-h-[38px] items-center justify-center rounded-xl border border-primary/15 dark:border-white/15 bg-surface dark:bg-slate-950 px-3.5 py-2 text-xs font-bold text-ink-muted cursor-not-allowed"
                                >
                                  Bereits verkauft
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleReserveItem(item)}
                                  className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-xs font-extrabold text-white hover:bg-accent-dark cursor-pointer"
                                >
                                  <span>Unverbindlich reservieren</span>
                                  <ArrowRight size={13} />
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ═══════════════════════════════════════════════════════════════════
            QUICK-VIEW & PRINTABLE SPEC SHEET MODAL
        ═══════════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {quickViewItem && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="marketplace-quickview-title"
              data-testid="marketplace-quickview-modal"
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 12 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-primary/15 dark:border-white/15 bg-white dark:bg-slate-900 text-primary dark:text-slate-100 shadow-2xl overflow-hidden"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between gap-3 border-b border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-950 px-5 sm:px-6 py-4">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-ink-muted truncate">
                      {quickViewItem.brand} · {quickViewItem.skuOrEnr} · {quickViewItem.categoryLabel}
                    </p>
                    <h3
                      id="marketplace-quickview-title"
                      className="mt-0.5 text-base sm:text-lg font-extrabold text-primary dark:text-white truncate"
                    >
                      {quickViewItem.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuickViewItem(null)}
                    aria-label="Detailansicht schließen"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/10 dark:border-white/10 text-ink-muted hover:text-primary dark:hover:text-white cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="overflow-y-auto p-5 sm:p-6 space-y-5 text-xs sm:text-sm">
                  {(() => {
                    const qSlides = resolveMarketplaceItemGallery(quickViewItem);
                    const safeQIdx =
                      quickViewPhotoIdx >= qSlides.length ? 0 : quickViewPhotoIdx;
                    const activeQSlide = qSlides[safeQIdx];
                    return (
                      <div className="grid gap-4 sm:grid-cols-12 sm:items-start">
                        <div className="sm:col-span-5 space-y-2">
                          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-900 border border-primary/10 dark:border-white/10 group">
                            <button
                              type="button"
                              onClick={() =>
                                setLightboxState({
                                  item: quickViewItem,
                                  index: safeQIdx,
                                })
                              }
                              className="block h-full w-full cursor-zoom-in"
                              title="Im Vollbild vergrößern (2× Zoom)"
                            >
                              <GalleryImage
                                slide={activeQSlide}
                                alt={quickViewItem.title}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setLightboxState({
                                  item: quickViewItem,
                                  index: safeQIdx,
                                })
                              }
                              className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-lg bg-slate-950/85 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-accent transition-colors cursor-pointer"
                            >
                              <Maximize2 size={12} />
                              <span>2× Zoom</span>
                            </button>
                            {activeQSlide.label && (
                              <span className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-slate-950/80 px-2 py-0.5 text-[11px] font-semibold text-white">
                                {activeQSlide.label}
                              </span>
                            )}
                          </div>

                          {qSlides.length > 1 && (
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                              {qSlides.map((s, idx) => (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => setQuickViewPhotoIdx(idx)}
                                  className={`h-11 w-14 shrink-0 overflow-hidden rounded-lg border transition-all cursor-pointer ${
                                    idx === safeQIdx
                                      ? "border-accent ring-2 ring-accent opacity-100"
                                      : "border-primary/15 dark:border-white/15 opacity-60 hover:opacity-100"
                                  }`}
                                >
                                  <GalleryImage
                                    slide={s}
                                    alt={`Vorschau ${idx + 1}`}
                                    className="h-full w-full object-cover"
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="sm:col-span-7 flex items-start justify-between gap-3">
                          <div className="space-y-1.5">
                            <p className="text-xs font-extrabold text-accent">
                              {quickViewItem.conditionBadge} · {quickViewItem.warrantyBadge}
                            </p>
                            <p className="text-lg font-extrabold text-primary dark:text-white">
                              {quickViewItem.priceLabel}
                            </p>
                            <p className="text-xs text-ink-muted leading-relaxed">
                              {quickViewItem.shortSpecs}
                            </p>
                            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                              <MapPin size={14} className="shrink-0" />
                              <span>{quickViewItem.availability} ({business.street})</span>
                            </p>
                          </div>
                          <div className="shrink-0 hidden sm:flex flex-col items-center">
                            <SpecSheetQrCode
                              value={`${business.url}/marktplatz?item=${encodeURIComponent(quickViewItem.id)}`}
                              size={64}
                            />
                            <span className="mt-1 text-[9px] font-mono text-ink-muted">
                              Artikel-QR
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Technical Specifications Table */}
                  <div className="rounded-xl border border-primary/10 dark:border-white/10 overflow-hidden">
                    <div className="bg-surface dark:bg-slate-950 px-4 py-2.5 border-b border-primary/10 dark:border-white/10 font-extrabold text-xs text-primary dark:text-white">
                      Technische Daten &amp; Prüfmerkmale
                    </div>
                    <dl className="divide-y divide-primary/8 dark:divide-white/10">
                      {quickViewItem.detailedSpecs.map((row) => (
                        <div
                          key={row.label}
                          className="grid grid-cols-1 sm:grid-cols-12 gap-1 px-4 py-2.5 text-xs"
                        >
                          <dt className="sm:col-span-5 font-bold text-ink-muted">
                            {row.label}
                          </dt>
                          <dd className="sm:col-span-7 font-semibold text-primary dark:text-slate-100">
                            {row.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  {/* Written Seller's Warranty & Pickup Terms */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 p-4 space-y-1">
                      <p className="text-xs font-extrabold text-primary dark:text-white flex items-center gap-1.5">
                        <ShieldCheck size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Garantie &amp; Gewährleistung</span>
                      </p>
                      <p className="text-xs text-ink-muted leading-relaxed">
                        {quickViewItem.warrantyTerms}
                      </p>
                    </div>

                    <div className="rounded-xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-800/60 p-4 space-y-1">
                      <p className="text-xs font-extrabold text-primary dark:text-white flex items-center gap-1.5">
                        <Building2 size={15} className="text-accent shrink-0" />
                        <span>Vor-Ort-Service &amp; Übergabe</span>
                      </p>
                      <p className="text-xs text-ink-muted leading-relaxed">
                        {quickViewItem.pickupInfo}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Modal Footer with Printable Spec Sheet PDF + WhatsApp + Reservation */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-950 px-5 sm:px-6 py-4">
                  <button
                    type="button"
                    onClick={() => handlePrintSpecSheet(quickViewItem)}
                    data-testid="marketplace-print-spec-btn"
                    className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-primary/15 dark:border-white/15 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-extrabold text-primary dark:text-slate-100 hover:border-accent cursor-pointer"
                  >
                    <Printer size={14} className="text-accent" />
                    <span>Datenblatt drucken (PDF)</span>
                  </button>

                  <div className="flex flex-wrap items-center gap-2 ml-auto">
                    {!isMarketplaceItemSold(quickViewItem) && (
                      <a
                        href={buildDirectWhatsAppUrl(quickViewItem)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-extrabold text-white hover:bg-emerald-700"
                      >
                        <MessageCircle size={14} />
                        <span>1-Klick WhatsApp</span>
                      </a>
                    )}
                    {isMarketplaceItemSold(quickViewItem) ? (
                      <button
                        type="button"
                        disabled
                        className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-primary/15 dark:border-white/15 bg-surface dark:bg-slate-950 px-4 py-2 text-xs font-bold text-ink-muted cursor-not-allowed"
                      >
                        <span>Bereits verkauft</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleReserveItem(quickViewItem)}
                        className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-accent-dark transition-colors cursor-pointer"
                      >
                        <span>Unverbindlich reservieren</span>
                        <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* Full-Screen Zoom Lightbox for Customer Inspection */}
        {lightboxState && (
          <ProductZoomLightbox
            item={lightboxState.item}
            initialIndex={lightboxState.index}
            onClose={() => setLightboxState(null)}
          />
        )}
      </div>
    </div>
  );
}
