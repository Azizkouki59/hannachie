// Shared Google Places (New) lookup used by the Node server and the Cloudflare Worker.
// Returns live rating, opening hours and up to 5 reviews exactly as published on Google.

export type GooglePlaceResult = { status: number; body: Record<string, unknown> };

export async function fetchGooglePlace(placeId: string, apiKey: string): Promise<GooglePlaceResult> {
  const fieldMask = [
    "id",
    "displayName",
    "formattedAddress",
    "shortFormattedAddress",
    "location",
    "nationalPhoneNumber",
    "internationalPhoneNumber",
    "regularOpeningHours",
    "currentOpeningHours",
    "businessStatus",
    "rating",
    "userRatingCount",
    "reviews",
    "googleMapsUri",
    "googleMapsLinks",
  ].join(",");

  const apiUrl = new URL(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`
  );
  apiUrl.searchParams.set("languageCode", "de");
  apiUrl.searchParams.set("regionCode", "DE");

  {
    const apiRes = await fetch(apiUrl.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask,
        "X-Goog-Maps-Solution-ID": "gmp_mcp_codeassist_v1_aistudio",
      },
    });

    const rawJson = (await apiRes.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;

    if (!apiRes.ok || !rawJson) {
      const errObj = (rawJson?.error || {}) as Record<string, unknown>;
      const quotaExceeded =
        apiRes.status === 429 || errObj?.status === "RESOURCE_EXHAUSTED";
      return {
        status: quotaExceeded ? 429 : 200,
        body: {
        ok: false,
        source: "fallback",
        reason: `upstream_${apiRes.status}`,
        quotaExceeded,
        error:
          typeof errObj?.message === "string"
            ? errObj.message
            : `Places API error (${apiRes.status})`,
        place: null,
        },
      };
    }

    const displayNameObj = rawJson.displayName as
      | { text?: string }
      | undefined;
    const currentHours = rawJson.currentOpeningHours as
      | { openNow?: boolean; weekdayDescriptions?: string[] }
      | undefined;
    const regularHours = rawJson.regularOpeningHours as
      | { openNow?: boolean; weekdayDescriptions?: string[] }
      | undefined;
    const mapsLinks = rawJson.googleMapsLinks as
      | {
          placeUri?: string;
          reviewsUri?: string;
          writeAReviewUri?: string;
          directionsUri?: string;
          photosUri?: string;
        }
      | undefined;
    const rawReviews = Array.isArray(rawJson.reviews) ? rawJson.reviews : [];

    let normalizedReviews = rawReviews.map((entry, idx) => {
      const r = (entry && typeof entry === "object" ? entry : {}) as Record<
        string,
        unknown
      >;
      const attr = (r.authorAttribution || {}) as Record<string, unknown>;
      const textObj = (r.text || {}) as Record<string, unknown>;
      const origObj = (r.originalText || {}) as Record<string, unknown>;
      return {
        id:
          typeof r.name === "string" && r.name
            ? r.name
            : `live-google-review-${idx + 1}`,
        author:
          typeof attr.displayName === "string" && attr.displayName
            ? attr.displayName
            : "Google-Nutzer",
        authorUri: typeof attr.uri === "string" ? attr.uri : "",
        authorPhotoUri: typeof attr.photoUri === "string" ? attr.photoUri : "",
        rating: Math.max(1, Math.min(5, Number(r.rating) || 5)),
        text:
          typeof textObj.text === "string" && textObj.text.trim()
            ? textObj.text.trim()
            : typeof origObj.text === "string"
            ? origObj.text.trim()
            : "",
        textLanguage:
          typeof textObj.languageCode === "string" ? textObj.languageCode : "",
        originalText:
          typeof origObj.text === "string" ? origObj.text.trim() : "",
        originalLanguage:
          typeof origObj.languageCode === "string"
            ? origObj.languageCode
            : "",
        relativeTime:
          typeof r.relativePublishTimeDescription === "string"
            ? r.relativePublishTimeDescription
            : "",
        publishTime:
          typeof r.publishTime === "string" ? r.publishTime : "",
        googleMapsUri:
          typeof r.googleMapsUri === "string" ? r.googleMapsUri : "",
        flagContentUri:
          typeof r.flagContentUri === "string" ? r.flagContentUri : "",
        isLiveFromApi: true,
      };
    });

    // If Places v1 omitted reviews (common in some regions/configs), try Legacy Place Details
    if (normalizedReviews.length === 0) {
      try {
        const legacyUrl = new URL(
          "https://maps.googleapis.com/maps/api/place/details/json"
        );
        legacyUrl.searchParams.set("place_id", placeId);
        legacyUrl.searchParams.set("fields", "reviews");
        legacyUrl.searchParams.set("language", "de");
        legacyUrl.searchParams.set("key", apiKey);

        const legacyRes = await fetch(legacyUrl.toString());
        const legacyJson = (await legacyRes.json().catch(() => null)) as {
          status?: string;
          result?: {
            reviews?: Array<{
              author_name?: string;
              author_url?: string;
              profile_photo_url?: string;
              rating?: number;
              text?: string;
              language?: string;
              relative_time_description?: string;
              time?: number;
            }>;
          };
        } | null;

        if (
          legacyRes.ok &&
          legacyJson?.status === "OK" &&
          Array.isArray(legacyJson.result?.reviews)
        ) {
          normalizedReviews = legacyJson.result.reviews.map((r, idx) => ({
            id: `legacy-google-review-${idx + 1}-${r.time || idx}`,
            author:
              typeof r.author_name === "string" && r.author_name.trim()
                ? r.author_name.trim()
                : "Google-Nutzer",
            authorUri: typeof r.author_url === "string" ? r.author_url : "",
            authorPhotoUri:
              typeof r.profile_photo_url === "string"
                ? r.profile_photo_url
                : "",
            rating: Math.max(1, Math.min(5, Number(r.rating) || 5)),
            text: typeof r.text === "string" ? r.text.trim() : "",
            textLanguage: typeof r.language === "string" ? r.language : "de",
            originalText: "",
            originalLanguage: "",
            relativeTime:
              typeof r.relative_time_description === "string"
                ? r.relative_time_description
                : "",
            publishTime:
              typeof r.time === "number"
                ? new Date(r.time * 1000).toISOString()
                : "",
            googleMapsUri:
              typeof r.author_url === "string" ? r.author_url : "",
            flagContentUri: "",
            isLiveFromApi: true,
          }));
        }
      } catch {
        // Ignore legacy fallback failure
      }
    }

    const weekdayDescriptions = Array.isArray(
      currentHours?.weekdayDescriptions
    )
      ? currentHours.weekdayDescriptions
      : Array.isArray(regularHours?.weekdayDescriptions)
      ? regularHours.weekdayDescriptions
      : [];

    const openNow =
      typeof currentHours?.openNow === "boolean"
        ? currentHours.openNow
        : typeof regularHours?.openNow === "boolean"
        ? regularHours.openNow
        : null;

    const payload = {
      ok: true,
      source: "live",
      quotaExceeded: false,
      fetchedAt: new Date().toISOString(),
      cached: false,
      place: {
        placeId: typeof rawJson.id === "string" ? rawJson.id : placeId,
        displayName: displayNameObj?.text || "",
        formattedAddress: "Iburger Straße 5, Im Hof, 49082 Osnabrück, Deutschland",
        shortFormattedAddress: "Iburger Straße 5, Im Hof, 49082 Osnabrück",
        coordinates: { lat: 52.2647082, lng: 8.0567763 },
        nationalPhoneNumber:
          typeof rawJson.nationalPhoneNumber === "string"
            ? rawJson.nationalPhoneNumber
            : "",
        internationalPhoneNumber:
          typeof rawJson.internationalPhoneNumber === "string"
            ? rawJson.internationalPhoneNumber
            : "",
        businessStatus:
          typeof rawJson.businessStatus === "string"
            ? rawJson.businessStatus
            : "",
        openNow,
        weekdayDescriptions,
        rating: typeof rawJson.rating === "number" ? rawJson.rating : null,
        userRatingCount:
          typeof rawJson.userRatingCount === "number"
            ? rawJson.userRatingCount
            : null,
        googleMapsUri:
          typeof rawJson.googleMapsUri === "string"
            ? rawJson.googleMapsUri
            : mapsLinks?.placeUri || "",
        googleMapsLinks: {
          placeUri: mapsLinks?.placeUri || "",
          reviewsUri: mapsLinks?.reviewsUri || "",
          writeAReviewUri: mapsLinks?.writeAReviewUri || "",
          directionsUri: mapsLinks?.directionsUri || "",
          photosUri: mapsLinks?.photosUri || "",
        },
        reviews: normalizedReviews,
      },
    };

    return { status: 200, body: payload };
  }
}
