"use client";

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, ChevronRight, Phone, ShieldCheck, Wrench } from "lucide-react";
import ContactCta from "@/components/ContactCta";
import ApplianceLogo from "@/components/ApplianceLogo";
import { PageHeader } from "@/components/ui";
import ServicesDirectory from "@/components/ServicesDirectory";
import { useQuickRequest } from "@/components/QuickRequestSheet";
import { brands, business, services } from "@/data/site";
import { triggerHapticFeedback } from "@/lib/haptics";
import { buildRouteMetadata } from "@/lib/seo";

export const metadata: Metadata = buildRouteMetadata("/leistungen");

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
    title: "Gerät & Anliegen antippen",
    desc: "Wählen Sie Ihr Gerät oder ein Fehlerbild direkt aus — auf Wunsch mit Foto vom Typenschild per WhatsApp.",
  },
  {
    step: "02",
    title: "Ehrliche Einschätzung vorab",
    desc: "Herr Hannachi prüft persönlich, ob sich Vor-Ort-Termin, Original-Ersatzteil oder ein Ersatzgerät rechnet.",
  },
  {
    step: "03",
    title: "Vor-Ort-Service in Osnabrück",
    desc: "Pünktlicher Termin bei Ihnen zu Hause — jedes Ersatzgerät wird mit schriftlicher Verkäufergarantie geliefert.",
  },
] as const;

export default function LeistungenPage() {
  const { openQuickRequest } = useQuickRequest();

  return (
    <>
      <PageHeader
        title="Service, Ersatzteile & Ersatzgeräte"
        intro="Mobiler Kundendienst in Osnabrück & Umgebung — klare Einschätzung bei Ihnen zu Hause, passende Original-Ersatzteile nach Typenschild und geprüfte Ersatzgeräte mit schriftlicher Verkäufergarantie."
      />

      {/* 4 Core Appliance Categories — Clean, Photo-Free Usable Cards */}
      <section className="border-b border-primary/8 dark:border-white/10 bg-white dark:bg-slate-950 py-8 sm:py-12">
        <div className="container-page">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
            <div>
              <p className="text-xs font-semibold text-accent">
                Kernbereiche · Mobiler Vor-Ort-Service {business.zip} {business.city}
              </p>
              <h2 className="mt-1 text-xl sm:text-2xl lg:text-[28px] font-extrabold text-primary dark:text-slate-100 tracking-tight text-balance">
                Wählen Sie Ihr Gerät oder tippen Sie Ihr Problem an
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback(35);
                  openQuickRequest("Waschmaschine", "", "", "repair");
                }}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-accent px-4 sm:px-5 py-2.5 text-xs font-extrabold text-white hover:bg-accent-dark active:scale-[0.98] transition-all whitespace-nowrap cursor-pointer"
              >
                <Wrench size={14} aria-hidden="true" />
                <span>Vor-Ort-Termin anfragen</span>
              </button>
              <a
                href={business.phoneHref}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-primary/15 dark:border-white/15 bg-surface dark:bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-primary dark:text-slate-100 hover:border-accent/50 transition-colors whitespace-nowrap"
              >
                <Phone size={14} className="text-accent" aria-hidden="true" />
                <span className="tabular-nums">{business.phoneDisplay}</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {services.map((s, idx) => (
              <article
                key={s.slug}
                className="card rounded-2xl border border-primary/10 dark:border-white/10 bg-surface/60 dark:bg-slate-900 p-5 flex flex-col justify-between transition-colors hover:border-accent/45"
              >
                <div>
                  {/* Clean Icon + Title Header */}
                  <div className="flex items-start justify-between gap-3">
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
                          className="text-base sm:text-lg font-extrabold text-primary dark:text-slate-100 hover:text-accent transition-colors truncate block"
                        >
                          {s.title}
                        </Link>
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-ink-muted leading-relaxed">
                    {s.short}
                  </p>

                  {/* 1-Tap Clickable Symptoms directly inside card */}
                  <div className="mt-4 border-t border-primary/8 dark:border-white/10 pt-2">
                    <p className="text-[11px] font-bold text-ink-faint py-1">
                      Häufige Anliegen (1-Klick Anfrage):
                    </p>
                    <ul className="divide-y divide-primary/8 dark:divide-white/10">
                      {s.symptoms.slice(0, 3).map((symptom) => (
                        <li key={symptom}>
                          <button
                            type="button"
                            onClick={() => {
                              triggerHapticFeedback(30);
                              openQuickRequest(s.title, symptom, "", "repair");
                            }}
                            className="group/sym flex min-h-[40px] w-full items-center justify-between gap-2 py-2 text-left text-xs font-medium text-primary dark:text-slate-200 hover:text-accent dark:hover:text-accent-light transition-colors cursor-pointer"
                          >
                            <span className="flex items-start gap-2 min-w-0">
                              <Check
                                size={13}
                                className="mt-0.5 shrink-0 text-accent"
                                aria-hidden="true"
                              />
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

                {/* Card Footer: 1-Tap Request + Detail Page Link */}
                <div className="mt-4 pt-3.5 border-t border-primary/8 dark:border-white/10 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHapticFeedback(35);
                      openQuickRequest(s.title, "", "", "repair");
                    }}
                    className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl bg-primary dark:bg-accent px-3.5 py-2 text-xs font-extrabold text-white hover:bg-accent dark:hover:bg-accent-dark active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <span>Anfragen</span>
                    <ArrowRight size={13} aria-hidden="true" />
                  </button>
                  <Link
                    href={`/leistungen/${s.slug}`}
                    className="inline-flex min-h-[40px] items-center gap-1 px-2 text-xs font-bold text-ink-muted hover:text-accent transition-colors"
                  >
                    <span>Details</span>
                    <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Transparent 3-Step Process Strip */}
      <section className="border-b border-primary/8 dark:border-white/10 bg-surface dark:bg-slate-900/50 py-7 sm:py-9">
        <div className="container-page">
          <div className="grid gap-5 sm:gap-8 md:grid-cols-3 md:divide-x md:divide-primary/10 dark:md:divide-white/10">
            {serviceSteps.map((item, i) => (
              <div
                key={item.step}
                className={
                  i > 0
                    ? "md:pl-8 pt-4 border-t border-primary/8 dark:border-white/10 md:border-t-0 md:pt-0"
                    : ""
                }
              >
                <span className="text-xs font-bold text-accent tabular-nums">
                  {item.step}. Schritt
                </span>
                <h3 className="mt-1 text-sm sm:text-base font-extrabold text-primary dark:text-slate-100">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs sm:text-[13px] text-ink-muted leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Structured Appliance & Spare Part Directory */}
      <div className="bg-surface/30 dark:bg-slate-950">
        <ServicesDirectory />

        {/* Clean Unboxed Manufacturer List & Guarantee Note (Zero-Pill Discipline) */}
        <section className="border-t border-primary/8 dark:border-white/10 bg-white dark:bg-slate-900/60 py-10">
          <div className="container-page text-center">
            <h2 className="text-xs font-semibold text-ink-muted">
              Unterstützte Herstellermarken (Vor-Ort-Service, Ersatzteile &amp; geprüfte Ersatzgeräte)
            </h2>
            <p className="mt-3 text-xs sm:text-sm font-semibold text-primary dark:text-slate-200 max-w-4xl mx-auto leading-relaxed">
              {supportedManufacturers.join(" · ")}
            </p>
            <p className="mt-4 inline-flex items-center justify-center gap-1.5 text-xs text-ink-muted">
              <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
              <span>{business.warrantyNotice}</span>
            </p>
          </div>
        </section>
      </div>

      <ContactCta />
    </>
  );
}
