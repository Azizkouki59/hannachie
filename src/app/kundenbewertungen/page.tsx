"use client";

import type { Metadata } from "next";
import { useState } from "react";
import { ExternalLink, Languages, Star } from "lucide-react";
import ContactCta from "@/components/ContactCta";
import { PageHeader, ReviewCard } from "@/components/ui";
import { GoogleReviewsSection } from "@/components/GoogleReviewsSection";
import { business, reviews } from "@/data/site";
import { useGoogleLivePlace, type LiveGoogleReview } from "@/lib/googlePlaceLive";
import { buildRouteMetadata } from "@/lib/seo";

export const metadata: Metadata = buildRouteMetadata("/kundenbewertungen");

function getInitials(name: string): string {
  const cleaned = name.replace(/[^a-zA-ZäöüÄÖÜß0-9\s]/g, "").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "G";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function LiveReviewGridCard({
  review,
  fallbackMapsUri,
}: {
  review: LiveGoogleReview;
  fallbackMapsUri: string;
}) {
  const [avatarError, setAvatarError] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const hasOriginalAlt = Boolean(
    review.originalText &&
      review.originalText.trim() &&
      review.originalText.trim() !== review.text.trim()
  );
  const body = showOriginal && hasOriginalAlt ? review.originalText! : review.text;
  const mapsLink = review.googleMapsUri || review.authorUri || fallbackMapsUri;

  const cardAriaLabel = [
    `Google-Bewertung von ${review.author}`,
    "Verifizierte Google-Rezension",
    `${review.rating} von 5 Sternen`,
    review.relativeTime || undefined,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <figure
      role="article"
      aria-label={cardAriaLabel}
      className="card flex h-full flex-col justify-between p-5 sm:p-6 bg-white dark:bg-slate-900 border border-primary/10 dark:border-white/10"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1a73e8] text-xs font-bold text-white"
              aria-hidden="true"
            >
              {review.authorPhotoUri && !avatarError ? (
                <img
                  src={review.authorPhotoUri}
                  alt={review.author}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitials(review.author)
              )}
            </div>
            <div className="min-w-0">
              {review.authorUri ? (
                <a
                  href={review.authorUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Google-Profil von ${review.author} öffnen`}
                  className="block text-sm font-bold text-primary dark:text-slate-100 hover:text-accent truncate transition-colors"
                >
                  {review.author}
                </a>
              ) : (
                <p className="text-sm font-bold text-primary dark:text-slate-100 truncate">
                  {review.author}
                </p>
              )}
              <p className="text-xs text-ink-faint truncate">
                {review.relativeTime || "Auf Google Maps"}
              </p>
            </div>
          </div>

          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Rezension von ${review.author} (${review.rating} von 5 Sternen) auf Google Maps öffnen`}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-800 text-accent hover:border-accent transition-colors"
          >
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>

        <div
          className="mb-3 flex items-center gap-0.5"
          role="img"
          aria-label={`${review.rating} von 5 Sternen`}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              size={14}
              aria-hidden="true"
              className={
                i <= Math.round(review.rating)
                  ? "fill-[#fbbc04] text-[#fbbc04]"
                  : "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700"
              }
            />
          ))}
        </div>

        <blockquote className="text-sm sm:text-[15px] leading-relaxed text-primary/90 dark:text-slate-100">
          {body || "Bewertung ohne Textkommentar."}
        </blockquote>

        {hasOriginalAlt && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-faint">
            <Languages size={12} className="text-accent shrink-0" aria-hidden="true" />
            <span>
              {showOriginal
                ? `Original (${(review.originalLanguage || "").toUpperCase()})`
                : "Übersetzt von Google (DE)"}
            </span>
            <span>·</span>
            <button
              type="button"
              aria-pressed={showOriginal}
              aria-label={`Sprache der Bewertung von ${review.author} umschalten`}
              onClick={() => setShowOriginal((prev) => !prev)}
              className="font-semibold text-accent hover:underline cursor-pointer"
            >
              {showOriginal ? "Übersetzung (DE)" : "Original ansehen"}
            </button>
          </div>
        )}
      </div>

      <figcaption className="mt-4 pt-3 border-t border-primary/8 dark:border-white/10 flex items-center justify-between gap-2 text-xs text-ink-faint">
        <span>Verifizierte Google-Rezension</span>
        <a
          href={mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Bewertung von ${review.author} auf Google Maps öffnen`}
          className="inline-flex items-center gap-1 font-semibold text-accent hover:underline"
        >
          <span>Auf Google Maps</span>
          <ExternalLink size={11} aria-hidden="true" />
        </a>
      </figcaption>
    </figure>
  );
}

export default function Kundenbewertungen() {
  const { place, ratingFormatted, source } = useGoogleLivePlace();
  const mapsReviewsUri =
    place.reviewsUri || place.googleMapsUri || business.mapsReviewsUrl;
  const hasLiveReviews = source === "live" && place.reviews.length > 0;

  return (
    <>
      <PageHeader
        title={`Das sagen unsere Kunden (${place.userRatingCount} Google-Rezensionen)`}
        intro={`Aktuell ${ratingFormatted} von 5 Sternen aus ${place.userRatingCount} Google-Maps-Bewertungen für ${place.displayName} in ${business.city}.`}
      />
      <GoogleReviewsSection showViewAllLink={false} />
      <section className="section bg-white dark:bg-slate-950">
        <div className="container-page">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-accent mb-1">
                {hasLiveReviews ? "Google Places Live-Daten" : "Verifizierte Google-Rezensionen"}
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-primary dark:text-slate-100">
                {hasLiveReviews
                  ? `Aktuelle Live-Rezensionen direkt von Google Maps`
                  : `Ausgewählte echte Google-Maps-Rezensionen (${reviews.length} Auszüge)`}
              </h2>
            </div>
            <p className="text-sm text-ink-muted">
              {hasLiveReviews
                ? `Gesamtprofil: ${ratingFormatted} ★ aus ${place.userRatingCount} Rezensionen`
                : `Gesamtprofil: ${ratingFormatted} ★ aus ${place.userRatingCount} Google-Bewertungen`}
            </p>
          </div>

          {hasLiveReviews ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {place.reviews.map((rev) => (
                  <LiveReviewGridCard
                    key={rev.id}
                    review={rev}
                    fallbackMapsUri={mapsReviewsUri}
                  />
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-900 p-5 sm:p-6">
                <div className="space-y-1">
                  <p className="text-base font-extrabold text-primary dark:text-slate-100">
                    Alle {place.userRatingCount} Google-Bewertungen direkt auf Google Maps
                  </p>
                  <p className="text-xs sm:text-sm text-ink-muted">
                    Die Google Places API stellt die {place.reviews.length} aktuellsten bzw. relevantesten Kundenstimmen direkt bereit. Alle weiteren Rezensionen finden Sie vollständig auf Google Maps.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <a
                    href={place.writeAReviewUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-primary/15 dark:border-white/15 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-extrabold text-primary dark:text-white hover:border-accent transition-colors"
                  >
                    <span>Selbst bewerten</span>
                    <ExternalLink size={13} aria-hidden="true" />
                  </a>
                  <a
                    href={mapsReviewsUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-accent hover:bg-accent-dark px-4 py-2 text-xs font-extrabold text-white transition-colors"
                  >
                    <span>Alle {place.userRatingCount} auf Google Maps öffnen</span>
                    <ExternalLink size={13} aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r, idx) => (
                <ReviewCard key={r.id || `${r.author}-${idx}`} review={r} />
              ))}
            </div>
          )}
        </div>
      </section>
      <ContactCta />
    </>
  );
}
