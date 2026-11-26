"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { business } from "@/data/site";

export interface LiveGoogleReview {
  id: string;
  author: string;
  authorUri?: string;
  authorPhotoUri?: string;
  rating: number;
  text: string;
  textLanguage?: string;
  originalText?: string;
  originalLanguage?: string;
  relativeTime: string;
  publishTime?: string;
  googleMapsUri?: string;
  flagContentUri?: string;
  isLiveFromApi: true;
}

export interface LiveGooglePlaceData {
  placeId: string;
  displayName: string;
  formattedAddress: string;
  shortFormattedAddress: string;
  streetLine: string;
  zipCityLine: string;
  coordinates: { lat: number; lng: number };
  phoneDisplay: string;
  internationalPhoneNumber: string;
  phoneHref: string;
  businessStatus: string;
  openNow: boolean | null;
  weekdayDescriptions: string[];
  todayHours: string | null;
  hoursSummary: string;
  rating: number;
  userRatingCount: number;
  googleMapsUri: string;
  reviewsUri: string;
  writeAReviewUri: string;
  directionsUri: string;
  reviews: LiveGoogleReview[];
  source: "live" | "fallback";
  fetchedAt: string | null;
}

interface GoogleLivePlaceContextValue {
  place: LiveGooglePlaceData;
  isLoading: boolean;
  isRefreshing: boolean;
  source: "live" | "fallback";
  lastSyncedAt: string | null;
  ratingFormatted: string;
  refresh: (force?: boolean) => Promise<void>;
}

const DEFAULT_PLACE_DATA: LiveGooglePlaceData = {
  placeId: business.placeId,
  displayName: `${business.name} ${business.tagline}`,
  formattedAddress: `${business.street}, ${business.zip} ${business.city}, Deutschland`,
  shortFormattedAddress: `${business.street}, ${business.zip} ${business.city}`,
  streetLine: business.street,
  zipCityLine: `${business.zip} ${business.city}`,
  coordinates: business.coordinates,
  phoneDisplay: business.phoneDisplay,
  internationalPhoneNumber: "+49 170 3493494",
  phoneHref: business.phoneHref,
  businessStatus: "OPERATIONAL",
  openNow: null,
  weekdayDescriptions: [],
  todayHours: business.hours,
  hoursSummary: business.hours,
  rating: 4.8,
  userRatingCount: 84,
  googleMapsUri: business.mapsUrl,
  reviewsUri: business.mapsReviewsUrl,
  writeAReviewUri: business.mapsWriteReviewUrl,
  directionsUri: business.mapsUrl,
  reviews: [],
  source: "fallback",
  fetchedAt: null,
};

function normalizeTelHref(phoneText: string, fallbackHref: string): string {
  const digits = phoneText.replace(/[^\d+]/g, "");
  if (!digits || digits.length < 6) return fallbackHref;
  if (digits.startsWith("+")) return `tel:${digits}`;
  if (digits.startsWith("0")) return `tel:+49${digits.slice(1)}`;
  return `tel:${digits}`;
}



const GoogleLivePlaceContext = createContext<GoogleLivePlaceContextValue>({
  place: DEFAULT_PLACE_DATA,
  isLoading: true,
  isRefreshing: false,
  source: "fallback",
  lastSyncedAt: null,
  ratingFormatted: "4,8",
  refresh: async () => {},
});

export function GoogleLivePlaceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [place, setPlace] = useState<LiveGooglePlaceData>(DEFAULT_PLACE_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchLivePlace = useCallback(async (force = false) => {
    if (force) {
      setIsRefreshing(true);
    }
    try {
      const url = `/api/google-place?placeId=${encodeURIComponent(
        business.placeId
      )}${force ? "&refresh=1" : ""}`;
      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        source?: string;
        quotaExceeded?: boolean;
        fetchedAt?: string;
        place?: {
          placeId?: string;
          displayName?: string;
          formattedAddress?: string;
          shortFormattedAddress?: string;
          coordinates?: { lat: number; lng: number } | null;
          nationalPhoneNumber?: string;
          internationalPhoneNumber?: string;
          businessStatus?: string;
          openNow?: boolean | null;
          weekdayDescriptions?: string[];
          rating?: number | null;
          userRatingCount?: number | null;
          googleMapsUri?: string;
          googleMapsLinks?: {
            placeUri?: string;
            reviewsUri?: string;
            writeAReviewUri?: string;
            directionsUri?: string;
          };
          reviews?: LiveGoogleReview[];
        } | null;
      } | null;

      if (json?.quotaExceeded || res.status === 429) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("gmp-quota-exceeded"));
        }
      }

      if (json?.ok && json.place) {
        const p = json.place;
        const weekdayDescriptions = Array.isArray(p.weekdayDescriptions)
          ? p.weekdayDescriptions
          : [];
        const livePhone =
          (p.nationalPhoneNumber || "").trim() || business.phoneDisplay;
        const liveIntlPhone =
          (p.internationalPhoneNumber || "").trim() || "+49 170 3493494";
        const liveReviews = Array.isArray(p.reviews)
          ? p.reviews.filter((r) => r && typeof r.text === "string")
          : [];

        // Keep statutory address (§ 5 DDG) and official opening hours locked to central business config
        // so stale Google Places entries can never contradict Impressum, Datenschutz, or Contact UI.
        setPlace({
          placeId: p.placeId || business.placeId,
          displayName:
            (p.displayName || "").trim() ||
            `${business.name} ${business.tagline}`,
          formattedAddress: `${business.street}, ${business.zip} ${business.city}, Deutschland`,
          shortFormattedAddress: `${business.street}, ${business.zip} ${business.city}`,
          streetLine: business.street,
          zipCityLine: `${business.zip} ${business.city}`,
          coordinates:
            p.coordinates &&
            typeof p.coordinates.lat === "number" &&
            typeof p.coordinates.lng === "number"
              ? p.coordinates
              : business.coordinates,
          phoneDisplay: livePhone,
          internationalPhoneNumber: liveIntlPhone,
          phoneHref: normalizeTelHref(
            liveIntlPhone || livePhone,
            business.phoneHref
          ),
          businessStatus: p.businessStatus || "OPERATIONAL",
          openNow: typeof p.openNow === "boolean" ? p.openNow : null,
          weekdayDescriptions,
          todayHours: business.hours,
          hoursSummary: business.hours,
          rating:
            typeof p.rating === "number" && Number.isFinite(p.rating)
              ? Number(p.rating.toFixed(1))
              : DEFAULT_PLACE_DATA.rating,
          userRatingCount:
            typeof p.userRatingCount === "number" &&
            Number.isFinite(p.userRatingCount)
              ? p.userRatingCount
              : DEFAULT_PLACE_DATA.userRatingCount,
          googleMapsUri:
            p.googleMapsLinks?.placeUri ||
            p.googleMapsUri ||
            business.mapsUrl,
          reviewsUri:
            p.googleMapsLinks?.reviewsUri ||
            p.googleMapsUri ||
            business.mapsReviewsUrl,
          writeAReviewUri:
            p.googleMapsLinks?.writeAReviewUri ||
            business.mapsWriteReviewUrl,
          directionsUri:
            p.googleMapsLinks?.directionsUri ||
            p.googleMapsUri ||
            business.mapsUrl,
          reviews: liveReviews,
          source: "live",
          fetchedAt: json.fetchedAt || new Date().toISOString(),
        });
      }
    } catch {
      // Keep safe baseline defaults on transient network error
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchLivePlace(false);
  }, [fetchLivePlace]);

  const value = useMemo<GoogleLivePlaceContextValue>(
    () => ({
      place,
      isLoading,
      isRefreshing,
      source: place.source,
      lastSyncedAt: place.fetchedAt,
      ratingFormatted: place.rating.toFixed(1).replace(".", ","),
      refresh: (force = true) => fetchLivePlace(force),
    }),
    [place, isLoading, isRefreshing, fetchLivePlace]
  );

  return (
    <GoogleLivePlaceContext.Provider value={value}>
      {children}
    </GoogleLivePlaceContext.Provider>
  );
}

export function useGoogleLivePlace(): GoogleLivePlaceContextValue {
  return useContext(GoogleLivePlaceContext);
}
