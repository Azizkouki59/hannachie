import { sanitizeSingleLine } from "../utils/sanitize.ts";

export type GeocodePayload = {
  ok: boolean;
  source: "google" | "nominatim";
  lat: number;
  lng: number;
  streetAddress: string;
  postalCode: string;
  city: string;
  zipAndCity: string;
  formattedAddress: string;
  country: string;
  placeId?: string;
  quotaExceeded: boolean;
};

export type GeocodeErrorPayload = {
  ok: false;
  quotaExceeded: boolean;
  error: string;
};

export function parseGoogleAddressComponents(
  components:
    | Array<{
        longText?: string;
        shortText?: string;
        long_name?: string;
        short_name?: string;
        types?: string[];
      }>
    | undefined,
  postalAddress?: {
    postalCode?: string;
    locality?: string;
    sublocality?: string;
    addressLines?: string[];
    regionCode?: string;
  }
) {
  const list = Array.isArray(components) ? components : [];
  const pick = (...wantedTypes: string[]) => {
    for (const wanted of wantedTypes) {
      const hit = list.find((c) => Array.isArray(c.types) && c.types.includes(wanted));
      if (hit) {
        const val = hit.longText || hit.long_name || hit.shortText || hit.short_name || "";
        if (val.trim()) return sanitizeSingleLine(val, 120);
      }
    }
    return "";
  };

  const route = pick("route");
  const streetNumber = pick("street_number");
  const sublocality =
    pick("sublocality_level_1", "sublocality", "neighborhood") ||
    sanitizeSingleLine(postalAddress?.sublocality || "", 80);
  const postalCode =
    pick("postal_code") || sanitizeSingleLine(postalAddress?.postalCode || "", 20);
  const city =
    pick("locality", "postal_town", "administrative_area_level_3", "administrative_area_level_2") ||
    sanitizeSingleLine(postalAddress?.locality || "", 80);
  const country = pick("country") || sanitizeSingleLine(postalAddress?.regionCode || "", 40);

  let streetAddress = "";
  if (route) {
    streetAddress = streetNumber ? `${route} ${streetNumber}` : route;
  } else if (postalAddress?.addressLines?.[0]) {
    streetAddress = sanitizeSingleLine(postalAddress.addressLines[0], 120);
  } else if (sublocality && sublocality.toLowerCase() !== city.toLowerCase()) {
    streetAddress = sublocality;
  }

  const zipAndCity = [postalCode, city].filter(Boolean).join(" ").trim();
  return { streetAddress, postalCode, city, zipAndCity, country };
}

function pickBestGoogleResult<T extends { types?: string[] }>(results: T[]): T | undefined {
  if (!results.length) return undefined;
  return (
    results.find((r) => r.types?.includes("street_address")) ||
    results.find((r) => r.types?.includes("premise") || r.types?.includes("subpremise")) ||
    results.find((r) => r.types?.includes("route")) ||
    results.find((r) => r.types?.includes("postal_code")) ||
    results[0]
  );
}

export async function reverseGeocodeCoords(
  lat: number,
  lng: number,
  apiKey: string
): Promise<GeocodePayload | GeocodeErrorPayload> {
  const cleanLat = Number(lat.toFixed(6));
  const cleanLng = Number(lng.toFixed(6));
  const trimmedKey = apiKey.trim();
  let quotaExceeded = false;

  if (trimmedKey && !trimmedKey.startsWith("MY_GOOGLE_MAPS")) {
    try {
      const v4Url = new URL("https://geocode.googleapis.com/v4/geocode/location");
      v4Url.searchParams.set("location.latitude", String(cleanLat));
      v4Url.searchParams.set("location.longitude", String(cleanLng));
      v4Url.searchParams.set("languageCode", "de");
      v4Url.searchParams.set("regionCode", "DE");

      const v4Res = await fetch(v4Url.toString(), {
        method: "GET",
        signal: AbortSignal.timeout(5000),
        headers: {
          Accept: "application/json",
          "X-Goog-Api-Key": trimmedKey,
          "X-Goog-FieldMask":
            "results.placeId,results.formattedAddress,results.addressComponents,results.postalAddress,results.types",
          "X-Goog-Maps-Solution-ID": "gmp_mcp_codeassist_v1_aistudio",
        },
      });

      const v4Json = (await v4Res.json().catch(() => null)) as {
        results?: Array<{
          placeId?: string;
          formattedAddress?: string;
          types?: string[];
          addressComponents?: Array<{
            longText?: string;
            shortText?: string;
            types?: string[];
          }>;
          postalAddress?: {
            postalCode?: string;
            locality?: string;
            sublocality?: string;
            addressLines?: string[];
            regionCode?: string;
          };
        }>;
        error?: { status?: string };
      } | null;

      if (v4Res.status === 429 || v4Json?.error?.status === "RESOURCE_EXHAUSTED") {
        quotaExceeded = true;
      } else if (v4Res.ok && Array.isArray(v4Json?.results) && v4Json.results.length > 0) {
        const best = pickBestGoogleResult(v4Json.results)!;
        const parsed = parseGoogleAddressComponents(best.addressComponents, best.postalAddress);
        return {
          ok: true,
          source: "google",
          lat: cleanLat,
          lng: cleanLng,
          ...parsed,
          formattedAddress: sanitizeSingleLine(
            best.formattedAddress ||
              [parsed.streetAddress, parsed.zipAndCity].filter(Boolean).join(", "),
            220
          ),
          placeId: best.placeId ? sanitizeSingleLine(best.placeId, 120) : undefined,
          quotaExceeded: false,
        };
      }
    } catch {
      // Fall through to classic Google Geocoding REST API
    }

    if (!quotaExceeded) {
      try {
        const v3Url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
        v3Url.searchParams.set("latlng", `${cleanLat},${cleanLng}`);
        v3Url.searchParams.set("language", "de");
        v3Url.searchParams.set("region", "de");
        v3Url.searchParams.set("key", trimmedKey);

        const v3Res = await fetch(v3Url.toString(), {
          method: "GET",
          signal: AbortSignal.timeout(5000),
          headers: {
            Accept: "application/json",
            "X-Goog-Maps-Solution-ID": "gmp_mcp_codeassist_v1_aistudio",
          },
        });
        const v3Json = (await v3Res.json().catch(() => null)) as {
          status?: string;
          results?: Array<{
            place_id?: string;
            formatted_address?: string;
            types?: string[];
            address_components?: Array<{
              long_name?: string;
              short_name?: string;
              types?: string[];
            }>;
          }>;
        } | null;

        if (v3Res.status === 429 || v3Json?.status === "OVER_QUERY_LIMIT") {
          quotaExceeded = true;
        } else if (
          v3Res.ok &&
          v3Json?.status === "OK" &&
          Array.isArray(v3Json.results) &&
          v3Json.results.length > 0
        ) {
          const best = pickBestGoogleResult(v3Json.results)!;
          const parsed = parseGoogleAddressComponents(best.address_components);
          return {
            ok: true,
            source: "google",
            lat: cleanLat,
            lng: cleanLng,
            ...parsed,
            formattedAddress: sanitizeSingleLine(
              best.formatted_address ||
                [parsed.streetAddress, parsed.zipAndCity].filter(Boolean).join(", "),
              220
            ),
            placeId: best.place_id ? sanitizeSingleLine(best.place_id, 120) : undefined,
            quotaExceeded: false,
          };
        }
      } catch {
        // Fall through to Nominatim
      }
    }
  }

  try {
    const nomRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${cleanLat}&lon=${cleanLng}&accept-language=de&addressdetails=1`,
      {
        signal: AbortSignal.timeout(5000),
        headers: {
          Accept: "application/json",
          "User-Agent": "Hannachi-Osnabrueck-Web/1.0 (+https://hannachi.de)",
        },
      }
    );
    if (nomRes.ok) {
      const nomData = (await nomRes.json().catch(() => null)) as {
        display_name?: string;
        address?: {
          road?: string;
          pedestrian?: string;
          footway?: string;
          house_number?: string;
          postcode?: string;
          city?: string;
          town?: string;
          village?: string;
          municipality?: string;
          suburb?: string;
          country?: string;
        };
      } | null;
      const addr = nomData?.address;
      if (addr) {
        const streetName = sanitizeSingleLine(
          addr.road || addr.pedestrian || addr.footway || "",
          120
        );
        const houseNum = addr.house_number
          ? ` ${sanitizeSingleLine(addr.house_number, 20)}`
          : "";
        const suburb = sanitizeSingleLine(addr.suburb || "", 80);
        const city = sanitizeSingleLine(
          addr.city || addr.town || addr.village || addr.municipality || "",
          80
        );
        const postalCode = sanitizeSingleLine(addr.postcode || "", 20);
        const streetAddress = streetName
          ? `${streetName}${houseNum}`
          : suburb && suburb.toLowerCase() !== city.toLowerCase()
          ? suburb
          : "";
        const zipAndCity = [postalCode, city].filter(Boolean).join(" ").trim();
        return {
          ok: true,
          source: "nominatim",
          lat: cleanLat,
          lng: cleanLng,
          streetAddress,
          postalCode,
          city,
          zipAndCity,
          formattedAddress: sanitizeSingleLine(
            [streetAddress, zipAndCity].filter(Boolean).join(", ") || nomData?.display_name || "",
            220
          ),
          country: sanitizeSingleLine(addr.country || "", 60),
          quotaExceeded,
        };
      }
    }
  } catch {
    // Fall through to structured error
  }

  return {
    ok: false,
    quotaExceeded,
    error: "Adresse konnte nicht automatisch aufgelöst werden.",
  };
}

export async function forwardGeocodeQuery(
  rawQuery: string,
  apiKey: string
): Promise<GeocodePayload | GeocodeErrorPayload> {
  const trimmedKey = apiKey.trim();
  let quotaExceeded = false;

  if (trimmedKey && !trimmedKey.startsWith("MY_GOOGLE_MAPS")) {
    try {
      const encodedAddress = encodeURIComponent(rawQuery);
      const v4Url = new URL(`https://geocode.googleapis.com/v4/geocode/address/${encodedAddress}`);
      v4Url.searchParams.set("languageCode", "de");
      v4Url.searchParams.set("regionCode", "DE");
      v4Url.searchParams.set("locationBias.rectangle.low.latitude", "52.00");
      v4Url.searchParams.set("locationBias.rectangle.low.longitude", "7.65");
      v4Url.searchParams.set("locationBias.rectangle.high.latitude", "52.55");
      v4Url.searchParams.set("locationBias.rectangle.high.longitude", "8.55");

      const v4Res = await fetch(v4Url.toString(), {
        method: "GET",
        signal: AbortSignal.timeout(5000),
        headers: {
          Accept: "application/json",
          "X-Goog-Api-Key": trimmedKey,
          "X-Goog-FieldMask":
            "results.placeId,results.location,results.formattedAddress,results.addressComponents,results.postalAddress,results.types",
          "X-Goog-Maps-Solution-ID": "gmp_mcp_codeassist_v1_aistudio",
        },
      });
      const v4Json = (await v4Res.json().catch(() => null)) as {
        results?: Array<{
          placeId?: string;
          location?: { latitude?: number; longitude?: number };
          formattedAddress?: string;
          types?: string[];
          addressComponents?: Array<{
            longText?: string;
            shortText?: string;
            types?: string[];
          }>;
          postalAddress?: {
            postalCode?: string;
            locality?: string;
            sublocality?: string;
            addressLines?: string[];
            regionCode?: string;
          };
        }>;
        error?: { status?: string };
      } | null;

      if (v4Res.status === 429 || v4Json?.error?.status === "RESOURCE_EXHAUSTED") {
        quotaExceeded = true;
      } else if (v4Res.ok && Array.isArray(v4Json?.results) && v4Json.results.length > 0) {
        const best = v4Json.results[0];
        const lat = best.location?.latitude;
        const lng = best.location?.longitude;
        if (typeof lat === "number" && typeof lng === "number") {
          const parsed = parseGoogleAddressComponents(best.addressComponents, best.postalAddress);
          return {
            ok: true,
            source: "google",
            lat: Number(lat.toFixed(6)),
            lng: Number(lng.toFixed(6)),
            ...parsed,
            formattedAddress: sanitizeSingleLine(
              best.formattedAddress ||
                [parsed.streetAddress, parsed.zipAndCity].filter(Boolean).join(", "),
              220
            ),
            placeId: best.placeId ? sanitizeSingleLine(best.placeId, 120) : undefined,
            quotaExceeded: false,
          };
        }
      }
    } catch {
      // Fall through to classic Google Geocoding API
    }

    if (!quotaExceeded) {
      try {
        const v3Url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
        v3Url.searchParams.set("address", rawQuery);
        v3Url.searchParams.set("language", "de");
        v3Url.searchParams.set("region", "de");
        v3Url.searchParams.set("bounds", "52.00,7.65|52.55,8.55");
        v3Url.searchParams.set("key", trimmedKey);

        const v3Res = await fetch(v3Url.toString(), {
          method: "GET",
          signal: AbortSignal.timeout(5000),
          headers: {
            Accept: "application/json",
            "X-Goog-Maps-Solution-ID": "gmp_mcp_codeassist_v1_aistudio",
          },
        });
        const v3Json = (await v3Res.json().catch(() => null)) as {
          status?: string;
          results?: Array<{
            place_id?: string;
            formatted_address?: string;
            geometry?: { location?: { lat?: number; lng?: number } };
            address_components?: Array<{
              long_name?: string;
              short_name?: string;
              types?: string[];
            }>;
          }>;
        } | null;

        if (v3Res.status === 429 || v3Json?.status === "OVER_QUERY_LIMIT") {
          quotaExceeded = true;
        } else if (
          v3Res.ok &&
          v3Json?.status === "OK" &&
          Array.isArray(v3Json.results) &&
          v3Json.results.length > 0
        ) {
          const best = v3Json.results[0];
          const lat = best.geometry?.location?.lat;
          const lng = best.geometry?.location?.lng;
          if (typeof lat === "number" && typeof lng === "number") {
            const parsed = parseGoogleAddressComponents(best.address_components);
            return {
              ok: true,
              source: "google",
              lat: Number(lat.toFixed(6)),
              lng: Number(lng.toFixed(6)),
              ...parsed,
              formattedAddress: sanitizeSingleLine(
                best.formatted_address ||
                  [parsed.streetAddress, parsed.zipAndCity].filter(Boolean).join(", "),
                220
              ),
              placeId: best.place_id ? sanitizeSingleLine(best.place_id, 120) : undefined,
              quotaExceeded: false,
            };
          }
        }
      } catch {
        // Fall through to Nominatim
      }
    }
  }

  try {
    const nomUrl = new URL("https://nominatim.openstreetmap.org/search");
    nomUrl.searchParams.set("format", "jsonv2");
    nomUrl.searchParams.set("q", rawQuery);
    nomUrl.searchParams.set("countrycodes", "de");
    nomUrl.searchParams.set("accept-language", "de");
    nomUrl.searchParams.set("addressdetails", "1");
    nomUrl.searchParams.set("limit", "1");
    nomUrl.searchParams.set("viewbox", "7.65,52.55,8.55,52.00");

    const nomRes = await fetch(nomUrl.toString(), {
      signal: AbortSignal.timeout(5000),
      headers: {
        Accept: "application/json",
        "User-Agent": "Hannachi-Osnabrueck-Web/1.0 (+https://hannachi.de)",
      },
    });
    if (nomRes.ok) {
      const items = (await nomRes.json().catch(() => [])) as Array<{
        lat?: string;
        lon?: string;
        display_name?: string;
        address?: {
          road?: string;
          pedestrian?: string;
          house_number?: string;
          postcode?: string;
          city?: string;
          town?: string;
          village?: string;
          municipality?: string;
          country?: string;
        };
      }>;
      const first = items[0];
      const lat = Number(first?.lat);
      const lng = Number(first?.lon);
      if (first && Number.isFinite(lat) && Number.isFinite(lng)) {
        const addr = first.address || {};
        const streetName = sanitizeSingleLine(addr.road || addr.pedestrian || "", 120);
        const houseNum = addr.house_number
          ? ` ${sanitizeSingleLine(addr.house_number, 20)}`
          : "";
        const city = sanitizeSingleLine(
          addr.city || addr.town || addr.village || addr.municipality || "",
          80
        );
        const postalCode = sanitizeSingleLine(addr.postcode || "", 20);
        const streetAddress = streetName ? `${streetName}${houseNum}` : "";
        const zipAndCity = [postalCode, city].filter(Boolean).join(" ").trim();
        return {
          ok: true,
          source: "nominatim",
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
          streetAddress,
          postalCode,
          city,
          zipAndCity,
          formattedAddress: sanitizeSingleLine(
            [streetAddress, zipAndCity].filter(Boolean).join(", ") || first.display_name || "",
            220
          ),
          country: sanitizeSingleLine(addr.country || "Deutschland", 60),
          quotaExceeded,
        };
      }
    }
  } catch {
    // Fall through
  }

  return {
    ok: false,
    quotaExceeded,
    error: "Kein passender Ort gefunden. Bitte prüfen Sie PLZ, Ort oder Straßenname.",
  };
}
