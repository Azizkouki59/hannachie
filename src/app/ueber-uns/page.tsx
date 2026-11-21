"use client";

import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
  Wrench,
} from "lucide-react";
import ContactCta from "@/components/ContactCta";
import HeroVisual from "@/components/HeroVisual";
import { useQuickRequest } from "@/components/QuickRequestSheet";
import { PageHeader, ReviewCard } from "@/components/ui";
import { brands, business, yearsOfExperience } from "@/data/site";
import { useGoogleLivePlace } from "@/lib/googlePlaceLive";
import { triggerHapticFeedback } from "@/lib/haptics";
import { buildRouteMetadata } from "@/lib/seo";

export const metadata: Metadata = buildRouteMetadata("/ueber-uns");

const values = [
  {
    num: "01",
    title: "Ehrlichkeit & klare Einschätzung",
    text: "Wir sagen Ihnen vorab offen, ob sich ein Ersatzteil für Ihr Gerät wirtschaftlich lohnt oder ob ein geprüftes Ersatzgerät sinnvoller ist – ohne versteckte Kosten.",
    icon: ShieldCheck,
  },
  {
    num: "02",
    title: "Passgenaue Original-Ersatzteile",
    text: "Anhand der E-Nr. bzw. PNC vom Typenschild identifizieren wir das exakt passende Original-Ersatzteil für Ihre Waschmaschine, Ihren Geschirrspüler, Kühlschrank oder Backofen.",
    icon: Wrench,
  },
  {
    num: "03",
    title: "Schriftliche Verkäufergarantie",
    text: "Jedes bei uns erworbene Ersatzgerät wird vor Übergabe intensiv geprüft und mit einer offiziellen schriftlichen Verkäufergarantie inklusive eigenem Garantie-Service geliefert.",
    icon: Award,
  },
] as const;

export default function UeberUns() {
  const { place, ratingFormatted } = useGoogleLivePlace();
  const { openQuickRequest } = useQuickRequest();

  const keyFacts = [
    {
      value: `Seit ${business.founded}`,
      label: `${yearsOfExperience}+ Jahre Erfahrung in ${business.city}`,
    },
    {
      value: `${ratingFormatted} ★`,
      label: `${place.userRatingCount} echte Google-Rezensionen`,
    },
    {
      value: "100 %",
      label: "Schriftliche Garantie auf Ersatzgeräte",
    },
    {
      value: "Vor-Ort",
      label: `Mobiler Service in ${business.zip} ${business.city}`,
    },
  ];

  return (
    <>
      <PageHeader
        title="Persönlicher Vor-Ort-Service seit 1990."
        intro="Ihr direkter Ansprechpartner in Osnabrück & Umgebung für Elektrohaushaltsgeräte & Ersatzteile – mobil bei Ihnen zu Hause nach Terminvereinbarung."
      />

      {/* Key Facts Strip */}
      <section className="border-b border-primary/8 dark:border-white/10 bg-surface dark:bg-slate-900/60 py-7 sm:py-9">
        <div className="container-page">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
            {keyFacts.map((fact) => (
              <div
                key={fact.label}
                className="card p-4 sm:p-5 flex flex-col justify-between"
              >
                <p className="text-xl sm:text-2xl font-extrabold text-accent tabular-nums">
                  {fact.value}
                </p>
                <p className="mt-1 text-xs sm:text-[13px] font-medium text-ink-muted">
                  {fact.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Story & Owner Portrait */}
      <section className="section bg-white dark:bg-slate-950">
        <div className="container-page grid items-start gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="space-y-5 text-sm sm:text-base leading-relaxed text-slate-muted dark:text-slate-300 lg:col-span-7">
            <div>
              <p className="eyebrow">Inhabergeführt in Osnabrück · {business.owner}</p>
              <h2 className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-primary dark:text-slate-100 tracking-tight text-balance">
                Direkte Hilfe vom Inhaber – ohne Callcenter und ohne Umwege
              </h2>
            </div>

            <p>
              Seit <strong className="font-semibold text-primary dark:text-white">{business.founded}</strong> steht{" "}
              <strong className="font-semibold text-primary dark:text-white">
                {business.name} {business.tagline}
              </strong>{" "}
              in Osnabrück für ehrliche Beratung, verlässliche Absprachen und schnelle Hilfe rund um Elektrohaushaltsgeräte &amp; Ersatzteile.
            </p>
            <p>
              Inhaber <strong className="font-semibold text-primary dark:text-white">{business.owner}</strong> kommt nach Terminvereinbarung persönlich zu Ihnen nach Hause in Osnabrück &amp; Umgebung: Wir prüfen den Ersatzteilbedarf direkt am Gerät und versorgen Sie mit passenden Original-Ersatzteilen für{" "}
              {brands.join(", ")}, Liebherr, Neff, Samsung, LG u. v. m.
            </p>
            <p>
              Lohnt sich die Rettung Ihres Altgeräts wirtschaftlich nicht mehr, erhalten Sie auf Wunsch ein faires Angebot für ein geprüftes Ersatzgerät aus unserem Bestand – jedes Gerät inklusive offizieller{" "}
              <strong className="font-semibold text-primary dark:text-white">
                schriftlicher Verkäufergarantie
              </strong>{" "}
              und vollem Garantie- und Reparaturservice durch uns.
            </p>

            {/* Structured Service & Guarantee Card */}
            <div className="card p-5 sm:p-6 bg-surface/70 dark:bg-slate-900 space-y-3.5">
              <div className="flex items-center justify-between gap-3 border-b border-primary/8 dark:border-white/10 pb-3">
                <h3 className="text-base font-extrabold text-primary dark:text-slate-100">
                  Was Sie bei jedem Termin erwarten dürfen
                </h3>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-accent">
                  <MapPin size={13} aria-hidden="true" />
                  <span>{business.city}</span>
                </span>
              </div>
              <ul className="grid gap-2.5 sm:grid-cols-2 text-xs sm:text-[13px] text-primary dark:text-slate-200">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  <span>Persönlicher Kontakt direkt mit Inhaber {business.owner}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  <span>Original-Ersatzteile passgenau nach Typenschild (E-Nr. / PNC)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  <span>Geprüfte Ersatzgeräte mit schriftlicher Verkäufergarantie</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  <span>Eigener Vor-Ort-Garantieservice für bei uns gekaufte Geräte</span>
                </li>
              </ul>

              <div className="pt-3 border-t border-primary/8 dark:border-white/10 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback(35);
                    openQuickRequest("Waschmaschine", "", "", "repair");
                  }}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-extrabold text-white hover:bg-accent-dark active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span>Vor-Ort-Termin anfragen</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
                <a
                  href={business.phoneHref}
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-primary/15 dark:border-white/15 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-primary dark:text-slate-100 hover:border-accent/50 transition-colors"
                >
                  <Phone size={14} className="text-accent" aria-hidden="true" />
                  <span className="tabular-nums">{business.phoneDisplay}</span>
                </a>
                <a
                  href={business.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/15 px-3.5 py-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition-colors"
                >
                  <MessageCircle size={14} aria-hidden="true" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
            <div className="mx-auto max-w-md lg:max-w-none">
              <HeroVisual variant="about" priority />
            </div>
            <ReviewCard
              review={{
                author: "Roman Osinsky",
                text: "Herr Hannachi konnte schon am Telefon schnell und kostenfrei einen Tipp geben und war pünktlich vor Ort.",
                rating: 5,
                relativeTime: "Verifizierte Google-Rezension",
              }}
            />
          </div>
        </div>
      </section>

      {/* 3 Core Values Cards */}
      <section className="section border-t border-primary/8 dark:border-white/10 bg-paper dark:bg-slate-900/60">
        <div className="container-page">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Unsere Grundsätze seit {business.founded}</p>
              <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-primary dark:text-slate-100 tracking-tight">
                Warum Kunden in Osnabrück uns weiterempfehlen
              </h2>
            </div>
            <Link
              href="/kundenbewertungen"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-accent hover:underline"
            >
              <Star size={14} className="fill-amber-400 text-amber-400" aria-hidden="true" />
              <span>Alle {place.userRatingCount} Google-Bewertungen ansehen →</span>
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <article key={v.title} className="card p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent border border-accent/20">
                        <Icon size={20} aria-hidden="true" />
                      </span>
                      <span className="font-mono text-xl font-extrabold text-accent/35 tabular-nums">
                        {v.num}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-primary dark:text-slate-100">
                      {v.title}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm leading-relaxed text-ink-muted">
                      {v.text}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <ContactCta />
    </>
  );
}
