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

export default function LeistungenPage() {
  return (
    <>
      {/* ── Page Header: Klare Überschrift und kurze Einführung ── */}
      <PageHeader
        title="Unsere Leistungen"
        intro="Reparaturservice für Haushaltsgeräte in Osnabrück und Umgebung. Wir prüfen Ihr defektes Gerät vor Ort und reparieren es zuverlässig."
      />

      {/* ── Visuelle Schnellauswahl der 4 Hauptbereiche mit Blur-Placeholder ── */}
      <section className="border-b border-primary/8 dark:border-white/10 bg-white dark:bg-slate-950 py-8 sm:py-10">
        <div className="container-page">
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-accent">
                Spezialbereiche im Detail
              </p>
              <h2 className="mt-1 text-lg sm:text-xl font-extrabold text-primary dark:text-slate-100">
                Direkt zur Geräteübersicht
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {services.map((s, idx) => {
              const photo = serviceImagesBySlug[s.slug];
              return (
                <Link
                  key={s.slug}
                  href={`/leistungen/${s.slug}`}
                  className="group overflow-hidden rounded-2xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-900 shadow-xs transition-all hover:border-accent/40 hover:shadow-md flex flex-col"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                    {photo && (
                      <Image
                        src={photo}
                        alt={`Reparaturservice für ${s.title} in Osnabrück`}
                        fill
                        priority={idx < 2}
                        loading={idx < 4 ? "eager" : "lazy"}
                        decoding="async"
                        placeholder="blur"
                        blurDataURL={photo.blurDataURL}
                        sizes="(min-width: 1024px) 260px, (min-width: 640px) 46vw, 45vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    <span className="absolute bottom-2.5 left-3 right-3 text-xs sm:text-sm font-extrabold text-white truncate">
                      {s.title}
                    </span>
                  </div>
                  <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                    <p className="text-[11px] sm:text-xs text-ink-muted line-clamp-2 leading-relaxed">
                      {s.short}
                    </p>
                    <span className="mt-2.5 inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-accent">
                      Details ansehen <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Neuer, strukturierter Leistungskatalog mit Tabs und Gerätekarten ── */}
      <div className="bg-surface/30 dark:bg-slate-950">
        <ServicesDirectory />

        {/* ── Schlichter Marken-Hinweis ohne Überfrachtung ── */}
        <section className="border-t border-primary/8 dark:border-white/10 bg-white dark:bg-slate-900/60 py-12">
          <div className="container-page text-center">
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink-faint dark:text-slate-400">
              Reparatur aller bekannten Marken und Hersteller
            </h2>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {[...brands, "Liebherr", "Neff", "Constructa", "Samsung", "LG", "Beko", "Gorenje", "Jura", "DeLonghi"].map((brand) => (
                <span
                  key={brand}
                  className="rounded-lg border border-primary/10 dark:border-white/12 bg-surface dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-primary dark:text-slate-100"
                >
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>

      <ContactCta />
    </>
  );
}
