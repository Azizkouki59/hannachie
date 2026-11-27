"use client";

import type { Metadata } from "next";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CheckCircle2,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import ContactCta from "@/components/ContactCta";
import { ProductCardGallery } from "@/components/MarketplaceGallery";
import { PageHeader } from "@/components/ui";
import { useQuickRequest } from "@/components/QuickRequestSheet";
import {
  DEFAULT_MARKETPLACE_SETTINGS,
  MARKETPLACE_CATEGORIES,
  isMarketplaceItemSold,
  stripDemoMarketplaceItems,
  type MarketplaceCategoryId,
  type MarketplaceItem,
  type MarketplaceSettings,
} from "@/data/marketplaceItems";
import { business } from "@/data/site";
import { useGoogleLivePlace } from "@/lib/googlePlaceLive";
import { triggerHapticFeedback } from "@/lib/haptics";
import { buildRouteMetadata } from "@/lib/seo";
import { buildWhatsAppDirectUrl } from "@/utils/whatsapp";

export const metadata: Metadata = buildRouteMetadata("/marktplatz");

export default function MarktplatzPage() {
  const { place } = useGoogleLivePlace();
  const { openQuickRequest } = useQuickRequest();
  const prefersReducedMotion = useReducedMotion();

  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [settings, setSettings] = useState<MarketplaceSettings>(
    DEFAULT_MARKETPLACE_SETTINGS
  );
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<MarketplaceCategoryId>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);

  useEffect(() => {
    let active = true;
    const loadInventory = async () => {
      try {
        const res = await fetch("/api/marketplace", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as {
          ok?: boolean;
          items?: MarketplaceItem[];
          settings?: MarketplaceSettings;
        };
        if (!active) return;
        if (data.ok && Array.isArray(data.items)) {
          setItems(stripDemoMarketplaceItems(data.items));
        }
        if (data.ok && data.settings) {
          setSettings(data.settings);
        }
      } catch {
        // Keep empty authoritative state on network error
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadInventory();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedItem) return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedItem(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedItem]);

  const publicItems = useMemo(() => {
    return items.filter((item) =>
      settings.hideSoldPublicly ? !isMarketplaceItemSold(item) : true
    );
  }, [items, settings.hideSoldPublicly]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return publicItems.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (!q) return true;
      const haystack = [
        item.title,
        item.brand,
        item.skuOrEnr,
        item.shortSpecs,
        item.categoryLabel,
        ...(item.searchKeywords || []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [publicItems, category, searchQuery]);

  const getItemWhatsAppUrl = (item: MarketplaceItem): string => {
    const msg = [
      `⭐ *Bestandsanfrage · Hannachi Osnabrück*`,
      `Hallo Herr Hannachi,`,
      ``,
      `⚙️ *Artikel:* ${item.title}`,
      `ℹ️ *Marke / E-Nr.:* ${item.brand} · ${item.skuOrEnr}`,
      `✅ *Zustand:* ${item.conditionBadge}`,
      `➡️ *Region:* Osnabrück`,
      ``,
      `Ist der Artikel noch verfügbar und wann wäre eine persönliche Übergabe oder Besichtigung möglich?`,
    ].join("\n");
    return buildWhatsAppDirectUrl(msg);
  };

  return (
    <>
      <PageHeader
        title="Aktueller Bestand & Originalteile"
        intro="Ausgewählte geprüfte Markengeräte & Original-Ersatzteile in Osnabrück, persönliche Übergabe und Preis auf Anfrage."
      />

      <section className="py-8 sm:py-12 bg-surface dark:bg-slate-950 min-h-[460px]">
        <div className="container-page space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {[0, 1, 2].map((skeleton) => (
                <div
                  key={skeleton}
                  className="h-80 rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 animate-pulse"
                />
              ))}
            </div>
          ) : publicItems.length === 0 ? (
            /* Honest Real-Stock-Only Empty State (Zero Fake Listings) */
            <div className="mx-auto max-w-3xl rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 p-6 sm:p-9 shadow-xs text-center space-y-5">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/12 text-accent border border-accent/20">
                <Package size={26} aria-hidden="true" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-accent">
                  Osnabrück · Persönliche Bestandsprüfung
                </p>
                <h2 className="text-xl sm:text-2xl font-extrabold text-primary dark:text-white tracking-tight">
                  Aktuell alle Geräte &amp; Originalteile auf persönliche Anfrage
                </h2>
                <p className="mx-auto max-w-xl text-sm text-ink-muted leading-relaxed">
                  Unser Bestand an geprüften Markengeräten und Original-Ersatzteilen (Miele,
                  Bosch, Siemens, AEG, Liebherr) wechselt täglich. Senden Sie uns kurz Ihr
                  Wunschgerät oder ein Foto vom Typenschild. Herr Hannachi prüft
                  die Verfügbarkeit direkt für Sie.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 max-w-2xl mx-auto">
                <a
                  href={business.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => triggerHapticFeedback(35)}
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-extrabold text-white transition-colors"
                >
                  <MessageCircle size={15} aria-hidden="true" />
                  <span>Per WhatsApp fragen</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback(35);
                    openQuickRequest("Waschmaschine", "Gerät auf Anfrage", "", "repair");
                  }}
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-accent hover:bg-accent-dark px-4 py-2.5 text-xs font-extrabold text-white transition-colors cursor-pointer"
                >
                  <Sparkles size={15} aria-hidden="true" />
                  <span>Bestand anfragen</span>
                </button>
                <a
                  href={place.phoneHref}
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-primary/15 dark:border-white/15 bg-surface dark:bg-slate-800 px-4 py-2.5 text-xs font-bold text-primary dark:text-slate-100 hover:border-accent transition-colors tabular-nums"
                >
                  <Phone size={15} className="text-accent shrink-0" aria-hidden="true" />
                  <span>{place.phoneDisplay}</span>
                </a>
              </div>

              <div className="pt-4 border-t border-primary/8 dark:border-white/10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-ink-muted">
                <Link
                  href="/impressum#garantie"
                  className="inline-flex items-center gap-1.5 hover:text-accent underline underline-offset-2 transition-colors"
                >
                  <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  <span>Schriftliche Verkäufergarantie</span>
                </Link>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} className="text-accent" aria-hidden="true" />
                  <span>Termine nach Vereinbarung in {business.city}</span>
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Compact Category Tabs & Search Toolbar */}
              <div className="rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 p-3.5 sm:p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div
                  role="tablist"
                  aria-label="Bestand nach Kategorie filtern"
                  className="flex flex-wrap items-center gap-1.5"
                >
                  {MARKETPLACE_CATEGORIES.map((cat) => {
                    const active = category === cat.id;
                    const count =
                      cat.id === "all"
                        ? publicItems.length
                        : publicItems.filter((i) => i.category === cat.id).length;
                    if (cat.id !== "all" && count === 0) return null;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => {
                          triggerHapticFeedback(20);
                          setCategory(cat.id);
                        }}
                        className={`min-h-[36px] rounded-xl px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer tabular-nums ${
                          active
                            ? "bg-primary text-white dark:bg-accent"
                            : "bg-primary/5 dark:bg-white/5 text-ink-muted hover:text-primary dark:hover:text-white"
                        }`}
                      >
                        {cat.shortLabel} ({count})
                      </button>
                    );
                  })}
                </div>

                <div className="relative w-full lg:w-72 shrink-0">
                  <Search
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Marke, Modell oder E-Nr. suchen…"
                    className="w-full min-h-[40px] rounded-xl border border-primary/12 dark:border-white/12 bg-surface dark:bg-slate-800 pl-9 pr-3 py-1.5 text-xs sm:text-sm text-primary dark:text-slate-100 placeholder:text-ink-faint focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              {/* Tight 3-Column Real Inventory Grid */}
              {filteredItems.length === 0 ? (
                <div className="rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 p-8 text-center">
                  <p className="text-sm font-bold text-primary dark:text-slate-100">
                    Keine passenden Artikel für diese Suche gefunden.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCategory("all");
                      setSearchQuery("");
                    }}
                    className="mt-3 inline-flex min-h-[38px] items-center rounded-xl bg-accent px-4 py-1.5 text-xs font-extrabold text-white hover:bg-accent-dark transition-colors cursor-pointer"
                  >
                    Alle Artikel anzeigen
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredItems.map((item) => {
                    const sold = isMarketplaceItemSold(item);
                    return (
                      <article
                        key={item.id}
                        className="card group flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xs transition-all hover:border-accent/45 hover:shadow-md"
                      >
                        <div>
                          <div className="relative">
                            <ProductCardGallery item={item} compact />
                            <div className="pointer-events-none absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                              <span className="rounded-lg bg-slate-950/82 px-2.5 py-1 text-[11px] font-extrabold text-white backdrop-blur-xs">
                                {item.conditionBadge}
                              </span>
                              {sold && (
                                <span className="rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-extrabold text-white">
                                  Verkauft
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="p-4 sm:p-5 space-y-2.5">
                            <div className="flex items-center justify-between gap-2 text-[11px]">
                              <span className="font-bold text-accent uppercase tracking-wider truncate">
                                {item.brand} · {item.categoryLabel}
                              </span>
                              <span className="font-mono text-ink-faint truncate">
                                {item.skuOrEnr}
                              </span>
                            </div>

                            <h2 className="text-base font-extrabold text-primary dark:text-white leading-snug line-clamp-2">
                              {item.title}
                            </h2>

                            <p className="text-xs text-ink-muted line-clamp-2 leading-relaxed">
                              {item.shortSpecs}
                            </p>

                            <div className="pt-1 flex items-center justify-between gap-2 text-xs">
                              <span
                                className={`inline-flex items-center gap-1 font-bold ${
                                  sold
                                    ? "text-rose-600 dark:text-rose-400"
                                    : "text-emerald-700 dark:text-emerald-400"
                                }`}
                              >
                                <CheckCircle2 size={13} aria-hidden="true" />
                                <span>{item.availability}</span>
                              </span>
                              <span className="font-extrabold text-primary dark:text-slate-100">
                                {item.priceLabel}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 pt-3 border-t border-primary/8 dark:border-white/10 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              triggerHapticFeedback(25);
                              setSelectedItem(item);
                            }}
                            className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-primary/15 dark:border-white/15 bg-surface dark:bg-slate-800 px-3 py-2 text-xs font-bold text-primary dark:text-slate-100 hover:border-accent transition-colors cursor-pointer"
                          >
                            Details
                          </button>
                          {sold ? (
                            <button
                              type="button"
                              disabled
                              className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl bg-slate-300 dark:bg-slate-700 px-3 py-2 text-xs font-extrabold text-white cursor-not-allowed"
                            >
                              <MessageCircle size={13} aria-hidden="true" />
                              <span>Vergriffen</span>
                            </button>
                          ) : (
                            <a
                              href={getItemWhatsAppUrl(item)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => triggerHapticFeedback(35)}
                              className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-xs font-extrabold text-white transition-colors"
                            >
                              <MessageCircle size={13} aria-hidden="true" />
                              <span>Anfragen</span>
                            </a>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Concise availability & warranty links */}
          <p className="mx-auto max-w-3xl text-center text-[11px] leading-relaxed text-ink-faint pt-2">
            Unverbindliche Bestandsübersicht · Alle Preise inkl. gesetzlicher MwSt. ·{" "}
            <Link
              href="/impressum#garantie"
              className="underline underline-offset-2 hover:text-accent transition-colors"
            >
              Garantiebedingungen
            </Link>{" "}
            &amp;{" "}
            <Link
              href="/impressum#elektrog"
              className="underline underline-offset-2 hover:text-accent transition-colors"
            >
              Altgeräteentsorgung
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Slide-Over Detail Drawer */}
      <AnimatePresence>
        {selectedItem && (
          <div
            className="fixed inset-0 z-[80] flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-labelledby="marketplace-drawer-title"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs"
            />
            <motion.aside
              initial={prefersReducedMotion ? { opacity: 0 } : { x: "100%" }}
              animate={prefersReducedMotion ? { opacity: 1 } : { x: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { x: "100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 34 }}
              className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white dark:bg-slate-900 shadow-2xl border-l border-primary/10 dark:border-white/10 overflow-hidden"
            >
              <div className="flex items-center justify-between gap-3 border-b border-primary/10 dark:border-white/10 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-accent truncate">
                    {selectedItem.brand} · {selectedItem.skuOrEnr}
                  </p>
                  <h2
                    id="marketplace-drawer-title"
                    className="text-base font-extrabold text-primary dark:text-white truncate"
                  >
                    {selectedItem.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  aria-label="Details schließen"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/12 dark:border-white/12 text-ink-muted hover:text-primary dark:hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                <div className="overflow-hidden rounded-xl border border-primary/10 dark:border-white/10">
                  <ProductCardGallery item={selectedItem} compact />
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-accent/12 px-2.5 py-1 font-bold text-accent">
                    <Tag size={12} aria-hidden="true" />
                    <span>{selectedItem.conditionBadge}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/12 px-2.5 py-1 font-bold text-emerald-700 dark:text-emerald-300">
                    <ShieldCheck size={12} aria-hidden="true" />
                    <span>{selectedItem.warrantyBadge}</span>
                  </span>
                </div>

                <ul className="space-y-2">
                  {selectedItem.bulletSpecs.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex items-start gap-2 text-xs sm:text-sm text-primary/90 dark:text-slate-200"
                    >
                      <CheckCircle2
                        size={15}
                        className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                        aria-hidden="true"
                      />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>

                {selectedItem.detailedSpecs.length > 0 && (
                  <dl className="divide-y divide-primary/8 dark:divide-white/10 rounded-xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-950/60 px-4 py-1 text-xs">
                    {selectedItem.detailedSpecs.map((row) => (
                      <div
                        key={row.label}
                        className="flex items-start justify-between gap-4 py-2.5"
                      >
                        <dt className="font-semibold text-ink-muted shrink-0">
                          {row.label}
                        </dt>
                        <dd className="text-right font-bold text-primary dark:text-slate-100">
                          {row.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}

                <div className="rounded-xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-950/60 p-4 space-y-2 text-xs text-ink-muted">
                  <p className="font-bold text-primary dark:text-slate-100">
                    Garantie, Gewährleistung &amp; Übergabe in Osnabrück
                  </p>
                  <p>{selectedItem.warrantyTerms}</p>
                  <p>{selectedItem.pickupInfo}</p>
                  <p className="pt-1 text-[11px]">
                    Ihre gesetzlichen Mängelrechte bestehen unentgeltlich und uneingeschränkt.{" "}
                    <Link
                      href="/impressum#garantie"
                      onClick={() => setSelectedItem(null)}
                      className="font-semibold text-accent underline underline-offset-2"
                    >
                      Garantiebedingungen &amp; Altgerätehinweise →
                    </Link>
                  </p>
                </div>
              </div>

              <div className="border-t border-primary/10 dark:border-white/10 p-4 grid grid-cols-2 gap-2.5 bg-surface dark:bg-slate-950">
                {isMarketplaceItemSold(selectedItem) ? (
                  <button
                    type="button"
                    disabled
                    className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-slate-400 px-4 py-2 text-xs font-extrabold text-white cursor-not-allowed"
                  >
                    <MessageCircle size={15} aria-hidden="true" />
                    <span>Vergriffen</span>
                  </button>
                ) : (
                  <a
                    href={getItemWhatsAppUrl(selectedItem)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => triggerHapticFeedback(35)}
                    className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-extrabold text-white transition-colors"
                  >
                    <MessageCircle size={15} aria-hidden="true" />
                    <span>WhatsApp anfragen</span>
                  </a>
                )}
                <button
                  type="button"
                  disabled={isMarketplaceItemSold(selectedItem)}
                  onClick={() => {
                    const chosen = selectedItem;
                    setSelectedItem(null);
                    openQuickRequest(
                      chosen.deviceTypeForForm,
                      chosen.inquiryPreset,
                      chosen.brand,
                      "repair"
                    );
                  }}
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-accent hover:bg-accent-dark disabled:bg-slate-400 px-4 py-2 text-xs font-extrabold text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <span>Kurzformular</span>
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <ContactCta />
    </>
  );
}
