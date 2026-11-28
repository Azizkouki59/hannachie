"use client";

import type { Metadata } from "next";
import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Award,
  Check,
  ChevronRight,
  LayoutGrid,
  Package,
  Phone,
  ShieldCheck,
  PackageSearch,
} from "lucide-react";
import ContactCta from "@/components/ContactCta";
import ApplianceLogo from "@/components/ApplianceLogo";
import { PageHeader } from "@/components/ui";
import ServicesDirectory from "@/components/ServicesDirectory";
import { Spatial3DCard, StaggerContainer, StaggerItem } from "@/components/animations";
import { useQuickRequest } from "@/components/QuickRequestSheet";
import { brands, business, services, yearsOfExperience } from "@/data/site";
import { triggerHapticFeedback } from "@/lib/haptics";
import { buildRouteMetadata } from "@/lib/seo";

export const metadata: Metadata = buildRouteMetadata("/leistungen");

type ServicesTab = "alle_geraete" | "kernbereiche" | "marken_ablauf";

const supportedManufacturers = [
  ...brands,
  "Liebherr",
  "Neff",
  "Constructa",
  "Samsung",
  "LG",
  "Beko",
  "Gorenje",
  "Jura",
  "DeLonghi",
];

const serviceSteps = [
  {
    step: "01",
    title: "Gerät wählen",
    desc: "Gerät & Anliegen antippen, Foto vom Typenschild optional per WhatsApp.",
  },
  {
    step: "02",
    title: "Ersatzteil-Check",
    desc: "Persönliche Prüfung nach Typenschild direkt durch Herrn Hannachi.",
  },
  {
    step: "03",
    title: "Termin vereinbaren",
    desc: "Persönliche Übergabe in Osnabrück, Termine nach Vereinbarung.",
  },
] as const;

const SERVICE_TABS: Array<{
  id: ServicesTab;
  label: string;
  shortLabel: string;
  icon: typeof LayoutGrid;
}> = [
  {
    id: "alle_geraete",
    label: "Alle 10 Hausgeräte",
    shortLabel: "Alle Geräte",
    icon: LayoutGrid,
  },
  {
    id: "kernbereiche",
    label: "Kernbereiche & Anliegen",
    shortLabel: "Kernbereiche",
    icon: PackageSearch,
  },
  {
    id: "marken_ablauf",
    label: "Marken & Ablauf",
    shortLabel: "Marken",
    icon: Award,
  },
];

export default function LeistungenPage() {
  const { openQuickRequest } = useQuickRequest();
  const prefersReducedMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<ServicesTab>("alle_geraete");

  return (
    <>
      <PageHeader
        title="Geräte, Beratung & Original-Ersatzteile"
        intro={`${yearsOfExperience}+ Jahre Erfahrung in Osnabrück · Originalteile nach E-Nr. · Ausgewählte Markengeräte auf Anfrage.`}
      />

      {/* Compact Action & Tab Bar */}
      <section className="border-b border-primary/8 dark:border-white/10 bg-white dark:bg-slate-900 py-4 sm:py-5">
        <div className="container-page flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          <div
            role="tablist"
            aria-label="Bereiche für Geräte & Teile"
            className="grid grid-cols-3 gap-1.5 rounded-2xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-950 p-1.5 w-full lg:w-auto lg:min-w-[460px]"
          >
            {SERVICE_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    triggerHapticFeedback(25);
                    setActiveTab(tab.id);
                  }}
                  className={`relative flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-extrabold transition-colors active:scale-[0.97] cursor-pointer ${
                    active
                      ? "text-white"
                      : "text-ink-muted hover:text-primary dark:hover:text-white"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="services-hub-active-tab"
                      transition={
                        prefersReducedMotion
                          ? { duration: 0.1 }
                          : { type: "spring", stiffness: 400, damping: 32 }
                      }
                      aria-hidden="true"
                      className="absolute inset-0 rounded-xl bg-primary dark:bg-accent shadow-xs"
                    />
                  )}
                  <Icon size={14} className="relative z-10 shrink-0" aria-hidden="true" />
                  <span className="relative z-10 hidden sm:inline truncate">{tab.label}</span>
                  <span className="relative z-10 sm:hidden truncate">{tab.shortLabel}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(35);
                openQuickRequest("Waschmaschine", "", "", "repair");
              }}
              className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-center text-xs font-extrabold leading-tight text-white hover:bg-accent-dark active:scale-[0.97] transition-all sm:whitespace-nowrap cursor-pointer"
            >
              <PackageSearch size={14} className="shrink-0" aria-hidden="true" />
              <span>Anfrage starten</span>
            </button>
            <Link
              href="/marktplatz"
              className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-primary/15 dark:border-white/15 bg-surface dark:bg-slate-800 px-3.5 py-2 text-center text-xs font-bold leading-tight text-primary dark:text-slate-100 hover:border-accent active:scale-[0.97] transition-all sm:whitespace-nowrap"
            >
              <Package size={14} className="text-accent shrink-0" aria-hidden="true" />
              <span>Aktueller Bestand</span>
            </Link>
            <a
              href={business.phoneHref}
              className="col-span-2 sm:col-span-1 inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-primary/15 dark:border-white/15 bg-surface dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-primary dark:text-slate-100 hover:border-accent active:scale-[0.97] transition-all sm:whitespace-nowrap"
            >
              <Phone size={14} className="text-accent shrink-0" aria-hidden="true" />
              <span dir="ltr" translate="no" className="notranslate tabular-nums">
                {business.phoneDisplay}
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* Active Tab Content */}
      <div className="bg-surface dark:bg-slate-950 min-h-[420px]">
        <AnimatePresence mode="wait" initial={false}>
          {activeTab === "alle_geraete" && (
            <motion.div
              key="services-tab-all"
              role="tabpanel"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <ServicesDirectory />
            </motion.div>
          )}

          {activeTab === "kernbereiche" && (
            <motion.section
              key="services-tab-core"
              role="tabpanel"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="py-8 sm:py-12"
            >
              <div className="container-page">
                <div className="mb-6">
                  <p className="text-xs font-semibold text-accent">
                    Direktwahl · 1-Klick Anfrage nach Anliegen
                  </p>
                  <h2 className="mt-1 text-xl sm:text-2xl font-extrabold text-primary dark:text-slate-100 tracking-tight">
                    Unsere 4 Kernbereiche in{" "}
                    <span translate="no" className="notranslate">
                      Osnabrück
                    </span>
                  </h2>
                </div>

                <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                  {services.map((s, idx) => (
                    <StaggerItem key={s.slug} className="h-full">
                      <Spatial3DCard maxTilt={5} className="h-full">
                        <article className="card h-full rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between transition-colors hover:border-accent/45">
                          <div>
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent border border-accent/20">
                                <ApplianceLogo device={s.title} size={22} />
                              </span>
                              <div className="min-w-0">
                                <span className="block text-[11px] font-bold text-accent tabular-nums">
                                  0{idx + 1}. Kernbereich
                                </span>
                                <Link
                                  href={`/leistungen/${s.slug}`}
                                  className="text-base font-extrabold text-primary dark:text-slate-100 hover:text-accent transition-colors truncate block"
                                >
                                  {s.title}
                                </Link>
                              </div>
                            </div>

                            <p className="mt-3 text-xs text-ink-muted leading-relaxed">
                              {s.short}
                            </p>

                            <div className="mt-3.5 border-t border-primary/8 dark:border-white/10 pt-2">
                              <ul className="divide-y divide-primary/8 dark:divide-white/10">
                                {s.symptoms.slice(0, 3).map((symptom) => (
                                  <li key={symptom}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        triggerHapticFeedback(30);
                                        openQuickRequest(s.title, symptom, "", "repair");
                                      }}
                                      className="group/sym flex min-h-[44px] w-full items-center justify-between gap-2 py-2 text-left text-xs font-medium text-primary dark:text-slate-200 hover:text-accent transition-colors cursor-pointer"
                                    >
                                      <span className="flex items-start gap-2 min-w-0">
                                        <Check size={13} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                                        <span className="line-clamp-2 leading-snug">{symptom}</span>
                                      </span>
                                      <ChevronRight
                                        size={13}
                                        aria-hidden="true"
                                        className="shrink-0 text-ink-faint group-hover/sym:translate-x-0.5 group-hover/sym:text-accent transition-transform"
                                      />
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-primary/8 dark:border-white/10 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                triggerHapticFeedback(35);
                                openQuickRequest(s.title, "", "", "repair");
                              }}
                              className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-primary dark:bg-accent px-4 py-2 text-xs font-extrabold text-white hover:bg-accent dark:hover:bg-accent-dark active:scale-[0.97] transition-all cursor-pointer"
                            >
                              <span>Anfragen</span>
                              <ArrowRight size={13} aria-hidden="true" />
                            </button>
                            <Link
                              href={`/leistungen/${s.slug}`}
                              className="inline-flex min-h-[44px] items-center gap-1 px-2.5 text-xs font-bold text-ink-muted hover:text-accent transition-colors"
                            >
                              <span>Details</span>
                              <ArrowRight size={13} aria-hidden="true" />
                            </Link>
                          </div>
                        </article>
                      </Spatial3DCard>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </div>
            </motion.section>
          )}

          {activeTab === "marken_ablauf" && (
            <motion.section
              key="services-tab-brands"
              role="tabpanel"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="py-8 sm:py-12"
            >
              <div className="container-page space-y-6">
                {/* 3-Step Process */}
                <div className="rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 p-5 sm:p-7">
                  <p className="text-xs font-bold uppercase tracking-wider text-accent">
                    Ablauf in 3 Schritten
                  </p>
                  <div className="mt-4 grid gap-5 md:gap-0 md:grid-cols-3 md:divide-x md:divide-primary/10 dark:md:divide-white/10">
                    {serviceSteps.map((item, i) => (
                      <div
                        key={item.step}
                        className={
                          i === 0
                            ? "md:pr-6"
                            : i === serviceSteps.length - 1
                              ? "pt-4 border-t border-primary/8 dark:border-white/10 md:border-t-0 md:pt-0 md:pl-6"
                              : "pt-4 border-t border-primary/8 dark:border-white/10 md:border-t-0 md:pt-0 md:px-6"
                        }
                      >
                        <span className="text-xs font-bold text-accent tabular-nums">
                          {item.step}. Schritt
                        </span>
                        <h3 className="mt-1 text-base font-extrabold text-primary dark:text-slate-100">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-xs sm:text-sm text-ink-muted leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Supported Manufacturers & Statutory Notice */}
                <div className="rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 p-5 sm:p-7 space-y-3">
                  <h2 className="text-base font-extrabold text-primary dark:text-slate-100">
                    Geführte Herstellermarken
                  </h2>
                  <p translate="no" className="notranslate text-sm font-semibold text-primary/90 dark:text-slate-200 leading-relaxed">
                    {supportedManufacturers.join(" · ")}
                  </p>
                  <p className="pt-2 border-t border-primary/8 dark:border-white/10 inline-flex items-start gap-2 text-xs text-ink-muted leading-relaxed">
                    <ShieldCheck size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      {business.warrantyNotice}{" "}
                      <Link
                        href="/impressum#garantie"
                        className="font-semibold text-accent underline underline-offset-2 hover:text-accent-dark sm:whitespace-nowrap"
                      >
                        Garantiebedingungen
                      </Link>
                    </span>
                  </p>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      <ContactCta />
    </>
  );
}
