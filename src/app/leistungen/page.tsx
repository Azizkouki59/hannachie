import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import ContactCta from "@/components/ContactCta";
import { PageHeader } from "@/components/ui";
import ServicesDirectory from "@/components/ServicesDirectory";
import { brands, services } from "@/data/site";
import { serviceImagesBySlug } from "@/data/images";
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

export default function LeistungenPage() {
  return (
    <>
      <PageHeader
        title="Mobiler Vor-Ort-Service, Ersatzteile & Ersatzgeräte"
        intro="Ihr Hausgerät streikt? Wir kommen nach Terminabsprache direkt zu Ihnen nach Hause in Osnabrück & Umgebung: für passende Original-Ersatzteile, ein geprüftes Ersatzgerät mit schriftlicher Verkäufergarantie (falls sich Ihr Altgerät nicht mehr lohnt) sowie unseren Garantie-Service."
      />

      {/* 4 Core Appliance Categories with Real Photography (Horizontal Swipe Carousel on Mobile) */}
      <section className="border-b border-primary/8 dark:border-white/10 bg-white dark:bg-slate-950 py-8 sm:py-12">
        <div className="container-page">
          <div className="mb-5 sm:mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
            <div>
              <p className="text-xs font-semibold text-accent">
                Hauptbereiche · Mobiler Vor-Ort-Service Osnabrück
              </p>
              <h2 className="mt-1 text-xl sm:text-2xl font-extrabold text-primary dark:text-slate-100 text-balance">
                Vor-Ort-Gerätecheck, passende Ersatzteile &amp; Ersatzgeräte mit Garantie
              </h2>
            </div>
            <Link
              href="/#anfrage"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-extrabold text-white hover:bg-accent-dark active:scale-[0.98] transition-all whitespace-nowrap self-start sm:self-auto"
            >
              <span>Vor-Ort-Termin anfragen</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="flex sm:grid overflow-x-auto sm:overflow-visible snap-x snap-mandatory no-scrollbar -mx-4 px-4 pb-2 sm:mx-0 sm:px-0 sm:pb-0 gap-3.5 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s, idx) => {
              const photo = serviceImagesBySlug[s.slug];
              return (
                <Link
                  key={s.slug}
                  href={`/leistungen/${s.slug}`}
                  className="snap-center shrink-0 w-[82vw] max-w-[320px] sm:w-auto sm:max-w-none group overflow-hidden rounded-2xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-900 shadow-xs transition-all hover:border-accent/45 flex flex-col"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900">
                    {photo && (
                      <Image
                        src={photo}
                        alt={`${s.title} – An- und Verkauf & Ersatzteile in Osnabrück`}
                        fill
                        priority={idx < 2}
                        loading={idx < 4 ? "eager" : "lazy"}
                        decoding="async"
                        placeholder="blur"
                        blurDataURL={photo.blurDataURL}
                        sizes="(min-width: 1024px) 280px, (min-width: 640px) 46vw, 85vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                    <span className="absolute bottom-3 left-3.5 right-3.5 text-sm font-extrabold text-white truncate">
                      0{idx + 1}. {s.title}
                    </span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <p className="text-xs text-ink-muted leading-relaxed">
                      {s.short}
                    </p>
                    <span className="mt-3.5 inline-flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-800/80 px-3.5 py-2 text-xs font-extrabold text-accent group-hover:border-accent/45 transition-colors">
                      <span>Kategorie öffnen</span>
                      <ArrowRight
                        size={14}
                        className="shrink-0 transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Structured Appliance & Spare Part Directory */}
      <div className="bg-surface/30 dark:bg-slate-950">
        <ServicesDirectory />

        {/* Clean Unboxed Manufacturer List (Zero-Pill Discipline) */}
        <section className="border-t border-primary/8 dark:border-white/10 bg-white dark:bg-slate-900/60 py-10">
          <div className="container-page text-center">
            <h2 className="text-xs font-semibold text-ink-muted">
              Unterstützte Herstellermarken (Geräte &amp; Original-Ersatzteile)
            </h2>
            <p className="mt-3 text-xs sm:text-sm font-semibold text-primary dark:text-slate-200 max-w-4xl mx-auto leading-relaxed">
              {supportedManufacturers.join(" · ")}
            </p>
          </div>
        </section>
      </div>

      <ContactCta />
    </>
  );
}
