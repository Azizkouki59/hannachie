"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { safeJsonParse } from "@/utils/sanitize";

export interface ConsentPreferences {
  essential: true;
  externalMedia: boolean;
  decided: boolean;
  timestamp: string | null;
  version: string;
}

const CONSENT_STORAGE_KEY = "hannachi-cookie-consent";
const CONSENT_VERSION = "1.0";

const DEFAULT_PREFERENCES: ConsentPreferences = {
  essential: true,
  externalMedia: false,
  decided: false,
  timestamp: null,
  version: CONSENT_VERSION,
};

interface ConsentContextValue {
  preferences: ConsentPreferences;
  canLoadExternalMedia: boolean;
  isBannerOpen: boolean;
  isCustomizing: boolean;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  saveCustomPreferences: (externalMedia: boolean) => void;
  openConsentManager: () => void;
  closeBanner: () => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

function isStoredConsentShape(
  value: unknown
): value is { externalMedia: boolean; timestamp?: unknown } {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "externalMedia" in value &&
    typeof (value as { externalMedia: unknown }).externalMedia === "boolean"
  );
}

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<ConsentPreferences>(() => {
    if (typeof window === "undefined") return DEFAULT_PREFERENCES;
    try {
      const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
      const parsed = safeJsonParse(stored, isStoredConsentShape, null);
      if (parsed) {
        return {
          essential: true,
          externalMedia: parsed.externalMedia,
          decided: true,
          timestamp: typeof parsed.timestamp === "string" ? parsed.timestamp : null,
          version: CONSENT_VERSION,
        };
      }
    } catch {
      // Ignore storage errors in restricted iframes
    }
    return DEFAULT_PREFERENCES;
  });

  const [isBannerOpen, setIsBannerOpen] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);

  useEffect(() => {
    if (!preferences.decided) {
      // Small pause so page loads first without layout jump
      const timer = setTimeout(() => {
        setIsBannerOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [preferences.decided]);

  const saveToStorage = (externalMedia: boolean) => {
    const updated: ConsentPreferences = {
      essential: true,
      externalMedia,
      decided: true,
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
    };
    setPreferences(updated);
    setIsBannerOpen(false);
    setIsCustomizing(false);
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  };

  const acceptAll = () => {
    saveToStorage(true);
  };

  const rejectNonEssential = () => {
    saveToStorage(false);
  };

  const saveCustomPreferences = (externalMedia: boolean) => {
    saveToStorage(externalMedia);
  };

  const openConsentManager = () => {
    setIsCustomizing(true);
    setIsBannerOpen(true);
  };

  const closeBanner = () => {
    setIsBannerOpen(false);
    setIsCustomizing(false);
  };

  return (
    <ConsentContext.Provider
      value={{
        preferences,
        canLoadExternalMedia: preferences.externalMedia,
        isBannerOpen,
        isCustomizing,
        acceptAll,
        rejectNonEssential,
        saveCustomPreferences,
        openConsentManager,
        closeBanner,
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent(): ConsentContextValue {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error("useConsent must be used within a ConsentProvider");
  }
  return context;
}
