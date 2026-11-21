"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Check,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";
import { business } from "@/data/site";

export type CatalogCategory = "appliances" | "parts";

export type CatalogOffer = {
  id: string;
  title: string;
  brand: string;
  category: CatalogCategory;
  deviceType: string;
  conditionBadge: "Geprüft & Aufbereitet" | "Neu · Originalteil";
  warrantyBadge: "Inkl. schriftlicher Garantie";
  specs: string[];
  priceLabel: "Preis auf Anfrage";
  availability: string;
  inquiryPreset: string;
};
import {
  isMarketplaceItemSold,
  loadLocalMarketplaceItems,
  loadLocalMarketplaceSettings,
  saveLocalMarketplaceItems,
  saveLocalMarketplaceSettings,
  type MarketplaceItem,
  type MarketplaceSettings,
} from "@/data/marketplaceItems";
import {
  ProductCardGallery,
  ProductZoomLightbox,
} from "@/components/MarketplaceGallery";

export const SELECT_CATALOG_OFFER_EVENT = "hannachi:select-catalog-offer";

export type SelectCatalogOfferDetail = {
  offer: CatalogOffer;
  inquiryTopic: "purchase" | "parts" | "sell" | "warranty";
};

type FilterTab = "all" | "appliances" | "parts";

function mapMarketplaceItemToCatalogOffer(item: MarketplaceItem): CatalogOffer {
  const isParts = item.category === "spare_parts";
  return {
    id: item.id,
    title: item.title,
    brand: item.brand,
    category: isParts ? "parts" : "appliances",
    deviceType: item.deviceTypeForForm,
    conditionBadge: item.conditionBadge,
    warrantyBadge: "Inkl. schriftlicher Garantie",
    specs: item.bulletSpecs,
    priceLabel: "Preis auf Anfrage",
    availability: item.availability,
    inquiryPreset: item.inquiryPreset,
  };
}

export default function CatalogShowcaseSection({
  onSelectOffer,
}: {
  onSelectOffer?: (offer: CatalogOffer) => void;
}) {
  const [items, setItems] = useState<MarketplaceItem[]>(() =>
    loadLocalMarketplaceItems()
  );
  const [mpSettings, setMpSettings] = useState<MarketplaceSettings>(() =>
    loadLocalMarketplaceSettings()
  );
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [lightboxState, setLightboxState] = useState<{
    item: MarketplaceItem;
    index: number;
  } | null>(null);

  const fetchLiveItems = useCallback(async () => {
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
      // Keep local fallback
    }
  }, []);

  useEffect(() => {
    fetchLiveItems();
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
  }, [fetchLiveItems]);

  const visibleItems = useMemo(
    () =>
      mpSettings.hideSoldPublicly
        ? items.filter((item) => !isMarketplaceItemSold(item))
        : items,
    [items, mpSettings.hideSoldPublicly]
  );

  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return visibleItems;
    if (activeFilter === "parts") {
      return visibleItems.filter((item) => item.category === "spare_parts");
    }
    return visibleItems.filter((item) => item.category !== "spare_parts");
  }, [activeFilter, visibleItems]);

  const counts = useMemo(
    () => ({
      all: visibleItems.length,
      appliances: visibleItems.filter((i) => i.category !== "spare_parts").length,
      parts: visibleItems.filter((i) => i.category === "spare_parts").length,
    }),
    [visibleItems]
  );

  function handleReserveClick(item: MarketplaceItem) {
    const offer = mapMarketplaceItemToCatalogOffer(item);
    const inquiryTopic = offer.category === "parts" ? "parts" : "purchase";

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent<SelectCatalogOfferDetail>(SELECT_CATALOG_OFFER_EVENT, {
          detail: { offer, inquiryTopic },
        })
      );
    }

    if (onSelectOffer) {
      onSelectOffer(offer);
    }

    const formEl =
      typeof document !== "undefined" ? document.getElementById("anfrage") : null;
    if (formEl) {
      formEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <section
      id="aktuelle-angebote"
      aria-labelledby="catalog-showcase-heading"
      className="py-10 sm:py-14 lg:py-16 bg-white dark:bg-slate-950 border-b border-primary/8 dark:border-white/10 scroll-mt-20"
    >
      <div className="container-page">
        {/* Header Row + Interactive Segmented Filter Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6 mb-7 sm:mb-8">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-accent">
              <span>An- &amp; Verkauf Osnabrück</span>
              <span aria-hidden="true">·</span>
              <span>Live-Bestand</span>
              <span aria-hidden="true">·</span>
              <span>Kein Online-Warenkorb</span>
            </div>
            <h2
              id="catalog-showcase-heading"
              className="mt-1.5 text-2xl sm:text-3xl lg:text-[34px] font-extrabold text-primary dark:text-slate-100 tracking-tight text-balance"
            >
              Aktuelle Angebote: Geräte &amp; Ersatzteile
            </h2>
            <p className="mt-2 text-xs sm:text-sm lg:text-[15px] text-ink-muted leading-relaxed">
              Geprüfte Haushaltsgeräte mit{" "}
              <strong className="font-semibold text-primary dark:text-slate-100">
                schriftlicher Verkäufergarantie
              </strong>{" "}
              sowie passgenaue Original-Ersatzteile mit mobilem Vor-Ort-Service direkt bei Ihnen zu Hause in Osnabrück &amp; Umgebung.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            <div
              role="tablist"
              aria-label="Angebote nach Kategorie filtern"
              className="inline-flex flex-wrap sm:flex-nowrap items-center gap-1 rounded-xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-900 p-1"
            >
              {(
                [
                  { id: "all" as const, label: "Alle Angebote", count: counts.all },
                  { id: "appliances" as const, label: "Haushaltsgeräte", count: counts.appliances },
                  { id: "parts" as const, label: "Ersatzteile", count: counts.parts },
                ]
              ).map((tab) => {
                const active = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveFilter(tab.id)}
                    className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? "bg-primary dark:bg-accent text-white shadow-xs"
                        : "text-ink-muted hover:text-primary dark:hover:text-white"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`font-mono text-[11px] tabular-nums ${
                        active ? "text-white/85" : "text-ink-faint"
                      }`}
                    >
                      ({tab.count})
                    </span>
                  </button>
                );
              })}
            </div>

            <Link
              href="/marktplatz"
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-primary/12 dark:border-white/12 bg-surface dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-primary dark:text-slate-100 hover:border-accent transition-colors whitespace-nowrap"
            >
              <SlidersHorizontal size={13} className="text-accent" />
              <span>Marktplatz &amp; Filter öffnen</span>
            </Link>
          </div>
        </div>

        {/* Product Grid with Multi-Photo Carousel + Zoom Lightbox */}
        <motion.div
          layout
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => {
              const isSold = isMarketplaceItemSold(item);
              const isAvailable =
                item.availability === "Sofort verfügbar in Osnabrück";

              return (
                <motion.article
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  className={`group flex flex-col justify-between rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:border-accent/45 hover:-translate-y-0.5 transition-all duration-150 ${
                    isSold ? "opacity-85" : ""
                  }`}
                >
                  <div>
                    {/* Interactive Multi-Photo Gallery Viewport */}
                    <ProductCardGallery
                      item={item}
                      compact
                      onOpenLightbox={(idx) => setLightboxState({ item, index: idx })}
                    />

                    {/* Card Body: Unboxed Metadata Kicker + Title + Technical Specs */}
                    <div className="p-4 sm:p-5">
                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-ink-muted">
                        <span className="font-bold text-primary dark:text-white">
                          {item.brand}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-accent">
                          {item.conditionBadge}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          {item.warrantyBadge}
                        </span>
                      </div>

                      <h3 className="mt-1.5 text-sm sm:text-base font-extrabold text-primary dark:text-slate-100 leading-snug line-clamp-2 sm:min-h-[2.65rem]">
                        {item.title}
                      </h3>

                      <p className="mt-1 text-xs font-medium text-ink-muted line-clamp-1">
                        {item.shortSpecs}
                      </p>

                      <ul className="mt-2.5 space-y-1 border-t border-primary/8 dark:border-white/10 pt-2.5 text-xs text-ink-muted">
                        {item.bulletSpecs.slice(0, 3).map((spec) => (
                          <li key={spec} className="flex items-start gap-1.5 leading-snug">
                            <Check
                              size={13}
                              className="mt-0.5 shrink-0 text-accent"
                              aria-hidden="true"
                            />
                            <span className="line-clamp-2">{spec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Contiguous Footer: PAngV Price + Availability + Actions */}
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-3 border-t border-primary/8 dark:border-white/10 space-y-2.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <div>
                        <span className="block text-[10px] font-medium text-ink-muted">
                          Konditionen
                        </span>
                        <span className="text-sm font-extrabold text-primary dark:text-white tabular-nums">
                          {item.priceLabel}
                        </span>
                      </div>
                      <span
                        className={`text-[11px] font-semibold text-right ${
                          isSold
                            ? "text-ink-muted line-through"
                            : isAvailable
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {item.availability}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSold ? (
                        <button
                          type="button"
                          disabled
                          data-testid={`catalog-sold-${item.id}`}
                          className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/15 dark:border-white/15 bg-surface dark:bg-slate-950 px-3 py-2 text-xs font-bold text-ink-muted cursor-not-allowed whitespace-nowrap"
                        >
                          <span>Bereits verkauft</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleReserveClick(item)}
                          data-testid={`catalog-inquire-${item.id}`}
                          className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary dark:bg-accent px-3 py-2 text-xs font-extrabold text-white hover:bg-accent dark:hover:bg-accent-dark transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <span>Reservieren</span>
                          <ArrowRight size={13} className="shrink-0" />
                        </button>
                      )}
                      <Link
                        href={`/marktplatz?item=${encodeURIComponent(item.id)}`}
                        className="shrink-0 min-h-[38px] inline-flex items-center justify-center rounded-xl border border-primary/15 dark:border-white/15 bg-surface dark:bg-slate-950 px-3 py-2 text-xs font-bold text-primary dark:text-slate-200 hover:border-accent transition-colors whitespace-nowrap"
                      >
                        Datenblatt
                      </Link>
                    </div>
                  </div>
                </motion.article>
              );
            })}

            {/* Symmetrical Grid Filler Card on PC (lg:grid-cols-3) so rows never end with an empty hole */}
            {filteredItems.length > 0 && filteredItems.length % 3 !== 0 && (
              <motion.aside
                key="catalog-symmetry-cta"
                layout
                className={`hidden lg:flex flex-col justify-between rounded-2xl border border-primary/12 dark:border-white/12 bg-primary-dark text-white p-6 ${
                  filteredItems.length % 3 === 1 ? "lg:col-span-2" : ""
                }`}
              >
                <div>
                  <p className="text-xs font-semibold text-accent-light">
                    Persönliche Bestandsprüfung · Osnabrück
                  </p>
                  <h3 className="mt-2 text-lg font-extrabold text-white leading-snug text-balance">
                    Wunschgerät oder passendes Original-Ersatzteil nicht dabei?
                  </h3>
                  <p className="mt-2.5 text-xs leading-relaxed text-white/75">
                    Viele geprüfte Geräte und Marken-Ersatzteile (E-Nr. / PNC) sind kurzfristig für unseren mobilen Vor-Ort-Service in Osnabrück &amp; Umgebung verfügbar.
                  </p>
                  <ul className="mt-4 space-y-2 border-t border-white/10 pt-4 text-xs text-white/85">
                    <li className="flex items-start gap-2">
                      <Check size={13} className="mt-0.5 shrink-0 text-accent-light" />
                      <span>Schneller Typenschild-Abgleich per WhatsApp oder Formular</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check size={13} className="mt-0.5 shrink-0 text-accent-light" />
                      <span>Schriftliche Verkäufergarantie auf jedes gekaufte Gerät</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check size={13} className="mt-0.5 shrink-0 text-accent-light" />
                      <span>Mobiler Vor-Ort-Service direkt bei Ihnen zu Hause in Osnabrück</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2.5">
                  <a
                    href="#anfrage"
                    className="flex-1 min-h-[38px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-xs font-extrabold text-white hover:bg-accent-dark transition-colors whitespace-nowrap"
                  >
                    <span>Direkt anfragen</span>
                    <ArrowRight size={13} />
                  </a>
                  <Link
                    href="/marktplatz"
                    className="shrink-0 min-h-[38px] inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/15 transition-colors whitespace-nowrap"
                  >
                    Vollständiger Marktplatz
                  </Link>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Legal Trade Scope & Marketplace Action Footer */}
        <div className="mt-6 rounded-2xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-900 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <ShieldCheck size={18} className="text-accent shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed text-ink-muted">
              <strong className="text-primary dark:text-slate-100">
                {business.legalLicense} ({business.city}):
              </strong>{" "}
              Kein Online-Warenkorb. {business.warrantyNotice}
            </p>
          </div>

          <Link
            href="/marktplatz"
            className="inline-flex min-h-[38px] shrink-0 items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-extrabold text-white hover:bg-accent-dark transition-colors whitespace-nowrap"
          >
            <span>Alle Angebote im Marktplatz</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Full-Screen Zoom Lightbox */}
      {lightboxState && (
        <ProductZoomLightbox
          item={lightboxState.item}
          initialIndex={lightboxState.index}
          onClose={() => setLightboxState(null)}
        />
      )}
    </section>
  );
}
