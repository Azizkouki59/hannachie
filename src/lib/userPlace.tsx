"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { getBrowserPositionWithFallback } from "@/lib/geolocation";
import {
  reverseGeocodePosition,
  type VerifiedLocationInfo,
} from "@/lib/repairRequest";

const SESSION_PLACE_KEY = "hannachi_detected_place_v1";

export type DetectPlaceOutcome =
  | { ok: true; place: VerifiedLocationInfo }
  | {
      ok: false;
      reason: "denied" | "policy_blocked" | "unavailable" | "timeout" | "unsupported";
      message: string;
    };

type UserPlaceContextValue = {
  detectedPlace: VerifiedLocationInfo | null;
  isDetecting: boolean;
  lastError: string | null;
  detectMyPlace: () => Promise<DetectPlaceOutcome>;
  setDetectedPlace: (place: VerifiedLocationInfo | null) => void;
  clearError: () => void;
};

function readSessionPlace(): VerifiedLocationInfo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_PLACE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<VerifiedLocationInfo>;
    if (
      typeof parsed?.lat === "number" &&
      Number.isFinite(parsed.lat) &&
      typeof parsed?.lng === "number" &&
      Number.isFinite(parsed.lng) &&
      typeof parsed?.zipAndCity === "string" &&
      typeof parsed?.mapsUrl === "string"
    ) {
      return {
        lat: parsed.lat,
        lng: parsed.lng,
        accuracy: typeof parsed.accuracy === "number" ? parsed.accuracy : 20,
        formattedCoords: parsed.formattedCoords || "",
        streetAddress: parsed.streetAddress || "",
        zipAndCity: parsed.zipAndCity,
        postalCode: parsed.postalCode,
        city: parsed.city,
        formattedAddress: parsed.formattedAddress,
        mapsUrl: parsed.mapsUrl,
        source:
          parsed.source === "gps" || parsed.source === "map-pin"
            ? parsed.source
            : "region-verified",
      };
    }
  } catch {
    // Ignore storage read errors in private browsing
  }
  return null;
}

function writeSessionPlace(place: VerifiedLocationInfo | null) {
  if (typeof window === "undefined") return;
  try {
    if (!place) {
      window.sessionStorage.removeItem(SESSION_PLACE_KEY);
    } else {
      window.sessionStorage.setItem(SESSION_PLACE_KEY, JSON.stringify(place));
    }
  } catch {
    // Ignore storage quota/privacy restrictions
  }
}

const UserPlaceContext = createContext<UserPlaceContextValue>({
  detectedPlace: null,
  isDetecting: false,
  lastError: null,
  detectMyPlace: async () => ({
    ok: false,
    reason: "unsupported",
    message: "Standort-Erkennung ist nicht verfügbar.",
  }),
  setDetectedPlace: () => {},
  clearError: () => {},
});

/**
 * Website-wide shared place detection state.
 * Strictly GDPR-compliant: never triggers browser geolocation automatically on page load;
 * only runs when the user explicitly clicks a location detection button or confirms a map pin.
 */
export function UserPlaceProvider({ children }: { children: React.ReactNode }) {
  const [detectedPlace, setDetectedPlaceState] = useState<VerifiedLocationInfo | null>(
    () => readSessionPlace()
  );
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const setDetectedPlace = useCallback((place: VerifiedLocationInfo | null) => {
    setDetectedPlaceState(place);
    writeSessionPlace(place);
    if (place) {
      setLastError(null);
    }
  }, []);

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  const detectMyPlace = useCallback(async (): Promise<DetectPlaceOutcome> => {
    setIsDetecting(true);
    setLastError(null);

    try {
      const geo = await getBrowserPositionWithFallback();
      if (!geo.ok) {
        setLastError(geo.message);
        return {
          ok: false,
          reason: geo.reason,
          message: geo.message,
        };
      }

      const resolved = await reverseGeocodePosition(
        geo.lat,
        geo.lng,
        geo.accuracy
      );
      setDetectedPlaceState(resolved);
      writeSessionPlace(resolved);
      setLastError(null);
      return { ok: true, place: resolved };
    } finally {
      setIsDetecting(false);
    }
  }, []);

  const value = useMemo<UserPlaceContextValue>(
    () => ({
      detectedPlace,
      isDetecting,
      lastError,
      detectMyPlace,
      setDetectedPlace,
      clearError,
    }),
    [detectedPlace, isDetecting, lastError, detectMyPlace, setDetectedPlace, clearError]
  );

  return (
    <UserPlaceContext.Provider value={value}>
      {children}
    </UserPlaceContext.Provider>
  );
}

export function useUserPlace() {
  return useContext(UserPlaceContext);
}

export function formatDetectedPlaceLabel(place: VerifiedLocationInfo): string {
  const parts = [place.streetAddress?.trim(), place.zipAndCity?.trim()].filter(Boolean);
  if (parts.length > 0) return parts.join(", ");
  return place.formattedAddress?.trim() || place.formattedCoords;
}
