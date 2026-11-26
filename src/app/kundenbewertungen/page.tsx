"use client";

import type { Metadata } from "next";
import ContactCta from "@/components/ContactCta";
import { PageHeader } from "@/components/ui";
import { GoogleReviewsSection } from "@/components/GoogleReviewsSection";
import { Rating3DPrismBanner } from "@/components/Spatial3DWidgets";
import { business } from "@/data/site";
import { useGoogleLivePlace } from "@/lib/googlePlaceLive";
import { buildRouteMetadata } from "@/lib/seo";

export const metadata: Metadata = buildRouteMetadata("/kundenbewertungen");

export default function Kundenbewertungen() {
  const { place, ratingFormatted } = useGoogleLivePlace();
  const mapsReviewsUri =
    place.reviewsUri || place.googleMapsUri || business.mapsReviewsUrl;

  return (
    <>
      <PageHeader
        title={`Kundenbewertungen (${place.userRatingCount} Google-Rezensionen)`}
        intro={`Aktuell ${ratingFormatted} von 5 Sternen aus ${place.userRatingCount} echten Google-Maps-Bewertungen für ${business.name} ${business.tagline} in ${business.city}.`}
      />
      <Rating3DPrismBanner
        ratingFormatted={ratingFormatted}
        reviewCount={place.userRatingCount}
        mapsUrl={mapsReviewsUri}
      />
      <GoogleReviewsSection showViewAllLink={false} mode="full" />
      <ContactCta />
    </>
  );
}
