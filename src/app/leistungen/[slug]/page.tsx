"use client";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import ContactCta from "@/components/ContactCta";
import ApplianceLogo from "@/components/ApplianceLogo";
import { serviceIcons } from "@/components/Illustrations";
import { useQuickRequest } from "@/components/QuickRequestSheet";
import { PageHeader, ReviewCard } from "@/components/ui";
import { business, services, sparePartsCategories } from "@/data/site";
import { triggerHapticFeedback } from "@/lib/haptics";
import { buildRouteMetadata } from "@/lib/seo";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const s = services.find((x) => x.slug === params.slug);
  if (!s) return {};
  return buildRouteMetadata(`/leistungen/${s.slug}`);
}

export default function ServicePage({ params }: Props) {
  const service = services.find((s) => s.slug === params.slug);
  if (!service) notFound();
  const Icon = serviceIcons[service.slug];
  const others = services.filter((s) => s.slug !== service.slug);
  const matchingPartsGroup = sparePartsCategories.find(
    (cat) => cat.appliance === service.slug
  );
  const { openQuickRequest } = useQuickRequest();

  return (
    <>
      <PageHeader
        title={`${service.title} – Beratung & Original-Ersatzteile`}
        intro={service.intro}
      />

      <section className="section bg-white dark:bg-slate-950">
        <div className="container-page">
          {/* Quiet Top Breadcrumb */}
          <div className="mb-6 sm:mb-8 flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-primary/8 dark:border-white/10">
            <Link
              href="/leistungen"
              className="inline-flex min-h-[44px] sm:min-h-0 items-center gap-1.5 text-xs sm:text-sm font-bold text-ink-muted hover:text-accent transition-colors"
            >
              <ArrowLeft size={15} aria-hidden="true" />
              <span>Alle Geräte &amp; Ersatzteile</span>
            </Link>
            <span className="text-xs font-medium text-ink-faint">
              {business.city} &amp; Umgebung · Termine nach Vereinbarung
            </span>
          </div>

          <div className="grid gap-8 lg:grid-cols-12 lg:gap-12 lg:items-start">
            {/* Main Column: Clickable 1-Tap Trade Topics + Spare Parts + Clear Approach */}
            <div className="min-w-0 lg:col-span-7">
              <h2 className="text-xl font-extrabold text-primary dark:text-slate-100 sm:text-2xl lg:text-[28px] tracking-tight">
                Angebote, Ersatzteile &amp; Anliegen
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-ink-muted">
                Tippen Sie Ihr Anliegen direkt an, um Ihre vorausgefüllte Anfrage zu starten:
              </p>

              <ul className="mt-4 divide-y divide-primary/10 dark:divide-white/10 border-y border-primary/10 dark:border-white/10">
                {service.symptoms.map((symptom) => (
                  <li key={symptom}>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHapticFeedback(30);
                        openQuickRequest(service.title, symptom, "", "repair");
                      }}
                      className="group flex min-h-[52px] w-full items-center justify-between gap-3 py-3.5 text-left text-sm sm:text-base font-medium text-primary dark:text-slate-200 hover:text-accent dark:hover:text-accent-light transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <Check
                          size={17}
                          className="shrink-0 text-accent"
                          aria-hidden="true"
                        />
                        <span className="leading-snug">{symptom}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-accent shrink-0 opacity-85 group-hover:opacity-100 transition-opacity">
                        <span className="hidden sm:inline">Anfragen</span>
                        <ChevronRight
                          size={15}
                          aria-hidden="true"
                          className="transition-transform group-hover:translate-x-0.5"
                        />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              {/* Matching Original Spare Parts (1-Tap Selection) */}
              {matchingPartsGroup && (
                <div className="mt-8 sm:mt-10">
                  <h2 className="text-lg font-extrabold text-primary dark:text-slate-100 sm:text-xl tracking-tight">
                    Original-Ersatzteile für {service.title}
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-ink-muted">
                    Passgenau nach Typenschild (E-Nr. / PNC) — Bauteil antippen zum Anfragen:
                  </p>
                  <div className="mt-3.5 grid gap-2 sm:grid-cols-2">
                    {matchingPartsGroup.parts.map((part) => (
                      <button
                        key={part}
                        type="button"
                        onClick={() => {
                          triggerHapticFeedback(30);
                          openQuickRequest(
                            service.title,
                            `Ersatzteil benötigt: ${part}`,
                            "",
                            "repair"
                          );
                        }}
                        className="group flex min-h-[44px] items-center justify-between gap-2 rounded-xl border border-primary/10 dark:border-white/10 bg-surface/60 dark:bg-slate-900 px-3.5 py-2.5 text-left text-xs sm:text-[13px] font-semibold text-primary dark:text-slate-200 hover:border-accent/45 hover:text-accent transition-colors cursor-pointer"
                      >
                        <span className="truncate">{part}</span>
                        <ChevronRight
                          size={14}
                          aria-hidden="true"
                          className="shrink-0 text-ink-faint group-hover:translate-x-0.5 group-hover:text-accent transition-transform"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 sm:mt-10">
                <h2 className="text-xl font-extrabold text-primary dark:text-slate-100 sm:text-2xl lg:text-[28px] tracking-tight">
                  Original-Ersatzteile &amp; Markengeräte auf Anfrage
                </h2>
                <p className="mt-3 max-w-xl text-sm sm:text-base leading-relaxed text-ink-muted">
                  {service.approach}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 border-t border-primary/8 dark:border-white/10 pt-5">
                  <div className="flex items-start gap-2.5">
                    <Check
                      size={16}
                      className="mt-0.5 shrink-0 text-accent"
                      aria-hidden="true"
                    />
                    <div className="text-xs sm:text-[13px] leading-relaxed">
                      <span className="font-bold text-primary dark:text-slate-100 block">
                        Original-Ersatzteile per Typenschild
                      </span>
                      <span className="text-ink-muted">
                        Passgenau nach E-Nr. / PNC für alle bekannten Marken im Verkauf.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck
                      size={16}
                      className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                      aria-hidden="true"
                    />
                    <div className="text-xs sm:text-[13px] leading-relaxed">
                      <span className="font-bold text-primary dark:text-slate-100 block">
                        Schriftliche Verkäufergarantie
                      </span>
                      <span className="text-ink-muted">
                        Für ausgewählte Markengeräte bei direktem Erwerb über Hannachi (
                        <Link
                          href="/impressum#garantie"
                          className="font-semibold text-accent underline underline-offset-2"
                        >
                          Garantiebedingungen
                        </Link>
                        ).
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback(35);
                    openQuickRequest(service.title, "", "", "repair");
                  }}
                  className="btn-primary w-full sm:w-auto cursor-pointer"
                >
                  <span>Ersatzteil oder Gerät anfragen</span>
                  <ArrowRight size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback(35);
                    openQuickRequest(service.title, "", "", "question");
                  }}
                  className="btn-ghost w-full sm:w-auto cursor-pointer"
                >
                  <MessageCircle size={15} aria-hidden="true" />
                  <span>Kurze Frage senden</span>
                </button>
              </div>
            </div>

            {/* Sticky Side Column: Clean Trade Info Card (No Stock Photos) + Real Google Review */}
            <div
              className={
                service.customerNote
                  ? "min-w-0 lg:col-span-5 lg:sticky lg:top-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-5 items-stretch"
                  : "min-w-0 lg:col-span-5 lg:sticky lg:top-20 space-y-5"
              }
            >
              <div className="card h-full flex flex-col justify-between rounded-2xl border border-primary/10 dark:border-white/10 bg-surface/70 dark:bg-slate-900 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3 pb-4 border-b border-primary/8 dark:border-white/10">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-accent block">
                      Spezialist in Osnabrück seit {business.founded}
                    </span>
                    <h3 className="mt-0.5 text-lg font-extrabold text-primary dark:text-slate-100 truncate">
                      {service.title}
                    </h3>
                  </div>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent border border-accent/20">
                    <Icon className="h-7 w-7" />
                  </span>
                </div>

                <dl className="divide-y divide-primary/8 dark:divide-white/10 text-xs sm:text-[13px]">
                  <div className="py-3 flex items-start gap-2.5">
                    <MapPin
                      size={15}
                      className="mt-0.5 shrink-0 text-accent"
                      aria-hidden="true"
                    />
                    <div>
                      <dt className="font-bold text-primary dark:text-slate-100">
                        Region &amp; Termine
                      </dt>
                      <dd className="text-ink-muted mt-0.5">
                        {business.city} &amp; Umgebung · Termine nach Vereinbarung
                      </dd>
                    </div>
                  </div>
                  <div className="py-3 flex items-start gap-2.5">
                    <Wrench
                      size={15}
                      className="mt-0.5 shrink-0 text-accent"
                      aria-hidden="true"
                    />
                    <div>
                      <dt className="font-bold text-primary dark:text-slate-100">
                        Beratung &amp; Angebot
                      </dt>
                      <dd className="text-ink-muted mt-0.5">
                        Persönliche Fachberatung · Original-Ersatzteile nach E-Nr. · Ausgewählte Markengeräte auf Anfrage
                      </dd>
                    </div>
                  </div>
                  <div className="py-3 flex items-start gap-2.5">
                    <Clock
                      size={15}
                      className="mt-0.5 shrink-0 text-accent"
                      aria-hidden="true"
                    />
                    <div>
                      <dt className="font-bold text-primary dark:text-slate-100">
                        Erreichbarkeit
                      </dt>
                      <dd className="text-ink-muted mt-0.5">{business.hours}</dd>
                    </div>
                  </div>
                </dl>

                <div className="mt-4 pt-4 border-t border-primary/8 dark:border-white/10 flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHapticFeedback(35);
                      openQuickRequest(service.title, "", "", "repair");
                    }}
                    className="min-h-[44px] w-full inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs sm:text-sm font-extrabold text-white hover:bg-accent-dark active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <span>Jetzt für {service.title} anfragen</span>
                    <ArrowRight size={15} aria-hidden="true" />
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={business.phoneHref}
                      className="min-h-[42px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/12 dark:border-white/15 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-bold text-primary dark:text-slate-100 hover:border-accent/50 transition-colors"
                    >
                      <Phone size={14} className="text-accent shrink-0" aria-hidden="true" />
                      <span className="tabular-nums truncate">{business.phoneDisplay}</span>
                    </a>
                    <a
                      href={business.whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[42px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition-colors"
                    >
                      <MessageCircle size={14} className="shrink-0" aria-hidden="true" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>

              {service.customerNote && (
                <ReviewCard
                  review={{
                    author: service.customerNote.author,
                    text: service.customerNote.quote,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Other Core Service Categories (Clean Icon Cards, No Photos) */}
      <section className="section border-t border-primary/8 dark:border-white/10 bg-paper dark:bg-slate-900">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-xl font-extrabold text-primary dark:text-slate-100 sm:text-2xl tracking-tight">
              Weitere Gerätebereiche
            </h2>
            <Link
              href="/leistungen"
              className="text-xs sm:text-sm font-bold text-accent hover:underline"
            >
              Alle Geräte &amp; Ersatzteile ansehen →
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3">
            {others.map((s) => (
              <Link
                key={s.slug}
                href={`/leistungen/${s.slug}`}
                className="card h-full group rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 p-5 transition-colors hover:border-accent/45 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent border border-accent/20">
                      <ApplianceLogo device={s.title} size={20} />
                    </span>
                    <span className="text-base font-extrabold text-primary dark:text-slate-100 group-hover:text-accent transition-colors">
                      {s.title}
                    </span>
                  </div>
                  <p className="mt-3 text-xs sm:text-[13px] text-ink-muted leading-relaxed">
                    {s.short}
                  </p>
                </div>
                <div className="pt-3 border-t border-primary/8 dark:border-white/10 flex items-center justify-between text-xs font-bold text-accent">
                  <span>Bereich öffnen</span>
                  <ArrowRight
                    size={14}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-1"
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ContactCta />
    </>
  );
}
