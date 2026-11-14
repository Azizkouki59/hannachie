import type { Metadata } from "next";
import ContactCta from "@/components/ContactCta";
import { PageHeader, ReviewCard } from "@/components/ui";
import { GoogleReviewsSection } from "@/components/GoogleReviewsSection";
import { reviews } from "@/data/site";
import { buildRouteMetadata } from "@/lib/seo";

export const metadata: Metadata = buildRouteMetadata("/kundenbewertungen");

export default function Kundenbewertungen() {
  return (
    <>
      <PageHeader
        title="Das sagen unsere Kunden (82 Google-Rezensionen)"
        intro="Alle 82 verifizierten Google-Maps-Bewertungen für Hannachi Elektrohaushaltsgeräte Service in Osnabrück – im Live-Ticker und als vollständige Übersicht."
      />
      <GoogleReviewsSection showViewAllLink={false} />
      <section className="section bg-white dark:bg-slate-950">
        <div className="container-page">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-accent mb-1">
                Vollständiges Bewertungsarchiv
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-primary dark:text-slate-100">
                Alle {reviews.length} Google-Maps-Rezensionen im Überblick
              </h2>
            </div>
            <p className="text-sm text-ink-muted">
              Sortiert nach Aktualität · Osnabrück & Umgebung
            </p>
          </div>

          <div className="columns-1 gap-6 md:columns-2 lg:columns-3 [&>*]:mb-6 [&>*]:break-inside-avoid">
            {reviews.map((r, idx) => (
              <ReviewCard key={r.id || `${r.author}-${idx}`} review={r} />
            ))}
          </div>
        </div>
      </section>
      <ContactCta />
    </>
  );
}
