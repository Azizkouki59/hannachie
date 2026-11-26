"use client";
import React from "react";

/**
 * Base Skeleton primitive with smooth pulse + sweeping light sheen
 * Supports both Light Mode and Dark Mode (.dark)
 */
export function SkeletonBox({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden rounded-xl bg-slate-200/85 dark:bg-slate-800/85 animate-pulse ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/45 dark:via-white/10 to-transparent"
        style={{
          animation: "badge-sheen 2.2s cubic-bezier(0.16, 1, 0.3, 1) infinite",
        }}
      />
    </div>
  );
}

/**
 * Desktop & Mobile Service Card Skeleton (matches HomepageClient & ui.tsx ServiceCard)
 */
export function ServiceCardSkeleton({
  compactMobile = false,
}: {
  compactMobile?: boolean;
}) {
  if (compactMobile) {
    return (
      <div
        role="status"
        aria-label="Leistung wird geladen"
        className="h-full overflow-hidden rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between"
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <SkeletonBox className="h-full w-full rounded-none" />
          <div className="absolute bottom-2.5 left-2.5 right-6">
            <SkeletonBox className="h-3.5 w-24 rounded-md bg-white/30 dark:bg-white/20" />
          </div>
        </div>
        <div className="p-3 flex items-center justify-between gap-2">
          <SkeletonBox className="h-3.5 w-16 rounded-md" />
          <SkeletonBox className="h-3.5 w-10 rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label="Service-Karte wird geladen"
      className="card flex h-full flex-col overflow-hidden bg-white dark:bg-slate-900"
    >
      {/* Top 4:3 Image / Graphic Slot */}
      <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-primary/10 dark:border-white/10">
        <SkeletonBox className="h-full w-full rounded-none" />
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <SkeletonBox className="h-4 w-28 rounded-md bg-white/35 dark:bg-slate-700/80" />
          <SkeletonBox className="h-5 w-5 rounded-lg bg-white/35 dark:bg-slate-700/80" />
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-5">
        <SkeletonBox className="h-5 w-3/5 rounded-lg" />
        <div className="mt-3 flex-1 space-y-2">
          <SkeletonBox className="h-3 w-full rounded-md" />
          <SkeletonBox className="h-3 w-11/12 rounded-md" />
          <SkeletonBox className="h-3 w-3/4 rounded-md" />
        </div>

        {/* Footer Action Row */}
        <div className="mt-4 pt-3 border-t border-primary/8 dark:border-white/10 flex items-center justify-between gap-2">
          <SkeletonBox className="h-4 w-24 rounded-md" />
          <SkeletonBox className="h-4 w-12 rounded-md" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for the 6-Category Appliance Overview & ServicesDirectory Cards
 */
export function ApplianceDirectoryCardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Gerätekategorie wird geladen"
      className="flex flex-col justify-between rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs"
    >
      <div>
        <div className="flex items-start gap-3.5">
          <SkeletonBox className="h-11 w-11 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2 pt-0.5">
            <SkeletonBox className="h-5 w-1/2 rounded-lg" />
            <SkeletonBox className="h-3 w-11/12 rounded-md" />
            <SkeletonBox className="h-3 w-3/4 rounded-md" />
          </div>
        </div>

        <div className="mt-5 border-t border-primary/6 dark:border-white/10 pt-4">
          <SkeletonBox className="h-3 w-40 rounded-md" />
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <SkeletonBox className="h-7 w-36 rounded-lg" />
            <SkeletonBox className="h-7 w-28 rounded-lg" />
            <SkeletonBox className="h-7 w-44 rounded-lg" />
            <SkeletonBox className="h-7 w-32 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-primary/6 dark:border-white/10 pt-4 flex items-center gap-2">
        <SkeletonBox className="h-[42px] flex-1 rounded-xl" />
        <SkeletonBox className="h-[42px] w-20 rounded-xl" />
        <SkeletonBox className="h-[42px] w-[42px] shrink-0 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Step-specific Skeleton Loading Screen for the 3-Step RepairForm Wizard
 * Preserves exact vertical geometry for Step 1, Step 2, and Step 3 to prevent layout shift.
 */
export function RepairFormStepSkeleton({ step = 1 }: { step?: 1 | 2 | 3 }) {
  if (step === 1) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Schritt 1 (Gerät & Marke) wird geladen"
        className="mt-6 space-y-6"
      >
        {/* 1. Device Selection Grid Skeleton */}
        <div>
          <SkeletonBox className="mb-2.5 h-4 w-64 rounded-md" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {Array.from({ length: 11 }).map((_, idx) => (
              <SkeletonBox key={idx} className="h-[42px] w-full rounded-xl" />
            ))}
          </div>
        </div>

        {/* Live Technician Diagnostic Hint Box Skeleton */}
        <div className="rounded-2xl border border-primary/10 dark:border-white/10 bg-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-2 flex-1">
            <SkeletonBox className="h-4 w-56 rounded-md" />
            <SkeletonBox className="h-3 w-full max-w-lg rounded-md" />
          </div>
          <SkeletonBox className="h-4 w-36 shrink-0 rounded-md" />
        </div>

        {/* 2. Brand & Model Selection Skeleton */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <SkeletonBox className="h-4 w-44 rounded-md" />
            <SkeletonBox className="h-3 w-36 rounded-md" />
          </div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {Array.from({ length: 10 }).map((_, idx) => (
              <SkeletonBox key={idx} className="h-7 w-16 rounded-lg" />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <SkeletonBox className="h-3.5 w-32 rounded-md" />
              <SkeletonBox className="h-12 w-full rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <SkeletonBox className="h-3.5 w-36 rounded-md" />
                <SkeletonBox className="h-3 w-28 rounded-md" />
              </div>
              <SkeletonBox className="h-12 w-full rounded-xl" />
              <div className="flex gap-1.5 pt-1">
                <SkeletonBox className="h-5 w-28 rounded-md" />
                <SkeletonBox className="h-5 w-24 rounded-md" />
                <SkeletonBox className="h-5 w-24 rounded-md" />
              </div>
            </div>
          </div>
        </div>

        {/* Step 1 Footer CTA Skeleton */}
        <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-primary/8 dark:border-white/10">
          <SkeletonBox className="h-4 w-56 rounded-md" />
          <SkeletonBox className="h-12 w-full sm:w-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Schritt 2 (Anliegen) wird geladen"
        className="mt-6 space-y-6"
      >
        {/* Summary Chip Bar Skeleton */}
        <div className="flex items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3 border border-primary/8 dark:border-white/10">
          <div className="flex items-center gap-2">
            <SkeletonBox className="h-4 w-28 rounded-md" />
            <SkeletonBox className="h-4 w-20 rounded-md" />
          </div>
          <SkeletonBox className="h-4 w-20 rounded-md" />
        </div>

        {/* Symptom Chips & Textarea Skeleton */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <SkeletonBox className="h-4 w-64 rounded-md" />
            <SkeletonBox className="h-3 w-28 rounded-md" />
          </div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {Array.from({ length: 6 }).map((_, idx) => (
              <SkeletonBox
                key={idx}
                className={`h-8 rounded-lg ${idx % 2 === 0 ? "w-52" : "w-44"}`}
              />
            ))}
          </div>
          <SkeletonBox className="h-24 w-full rounded-xl" />
        </div>

        {/* Urgency Selection Skeleton */}
        <div>
          <SkeletonBox className="mb-2 h-4 w-52 rounded-md" />
          <div className="grid gap-2.5 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <SkeletonBox key={idx} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </div>

        {/* Photo Upload Skeleton */}
        <div>
          <SkeletonBox className="mb-2 h-3.5 w-72 rounded-md" />
          <SkeletonBox className="h-12 w-full rounded-xl" />
        </div>

        {/* Footer Buttons Skeleton */}
        <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-primary/8 dark:border-white/10">
          <SkeletonBox className="h-11 w-full sm:w-40 rounded-xl" />
          <SkeletonBox className="h-12 w-full sm:w-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Schritt 3 (Kontaktdaten) wird geladen"
      className="mt-6 space-y-6"
    >
      {/* Summary Bar Skeleton */}
      <div className="flex items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3 border border-primary/8 dark:border-white/10">
        <SkeletonBox className="h-4 w-3/4 rounded-md" />
        <SkeletonBox className="h-4 w-14 rounded-md" />
      </div>

      {/* 2x2 Contact Inputs Grid Skeleton */}
      <div className="grid gap-5 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="space-y-1.5">
            <SkeletonBox className="h-3.5 w-40 rounded-md" />
            <SkeletonBox className="h-12 w-full rounded-xl" />
          </div>
        ))}
      </div>

      {/* Preferred Channel & Callback Time Skeleton */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <SkeletonBox className="h-3.5 w-36 rounded-md" />
          <div className="grid grid-cols-3 gap-2">
            <SkeletonBox className="h-10 w-full rounded-xl" />
            <SkeletonBox className="h-10 w-full rounded-xl" />
            <SkeletonBox className="h-10 w-full rounded-xl" />
          </div>
        </div>
        <div className="space-y-2">
          <SkeletonBox className="h-3.5 w-32 rounded-md" />
          <SkeletonBox className="h-12 w-full rounded-xl" />
        </div>
      </div>

      {/* Submit Row Skeleton */}
      <div className="pt-4 border-t border-primary/8 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SkeletonBox className="h-11 w-full sm:w-40 rounded-xl" />
        <SkeletonBox className="h-12 w-full sm:w-72 rounded-xl" />
      </div>
    </div>
  );
}

const SKELETON_PULSE_DELAYS = [
  "",
  "[animation-delay:120ms]",
  "[animation-delay:240ms]",
  "[animation-delay:360ms]",
] as const;

/**
 * Subtle Skeleton Card matching ReviewMarqueeCard geometry in GoogleReviewsSection
 */
export function GoogleReviewCardSkeleton({ index = 0 }: { index?: number }) {
  const delayClass = SKELETON_PULSE_DELAYS[index % SKELETON_PULSE_DELAYS.length];
  return (
    <div
      role="status"
      aria-label="Google-Rezension wird synchronisiert"
      className={`card animate-pulse ${delayClass} shrink-0 w-[265px] min-[400px]:w-[285px] sm:w-[350px] lg:w-[390px] flex flex-col justify-between p-3 sm:p-5 lg:p-6 bg-white/90 dark:bg-slate-900/90 border border-primary/10 dark:border-white/10`}
    >
      <div>
        {/* Reviewer Header */}
        <div className="flex items-start justify-between gap-2.5 sm:gap-3 mb-2 sm:mb-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <SkeletonBox className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 rounded-full opacity-75" />
            <div className="space-y-1.5 flex-1 max-w-[150px]">
              <SkeletonBox className="h-3 sm:h-3.5 w-24 sm:w-28 rounded-md opacity-80" />
              <SkeletonBox className="h-2.5 w-20 sm:w-24 rounded-md opacity-60" />
            </div>
          </div>
          <SkeletonBox className="h-6 w-6 sm:h-7 sm:w-7 shrink-0 rounded-lg opacity-65" />
        </div>

        {/* Stars + Timestamp Row */}
        <div className="flex items-center justify-between gap-2 mb-2.5 sm:mb-3.5">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <SkeletonBox className="h-3 sm:h-3.5 w-16 sm:w-20 rounded-md opacity-75" />
            <SkeletonBox className="h-2.5 sm:h-3 w-12 sm:w-14 rounded-md opacity-55" />
          </div>
          <SkeletonBox className="h-2.5 sm:h-3 w-16 sm:w-20 rounded-md opacity-55" />
        </div>

        {/* Review Quote Lines */}
        <div className="space-y-1.5 sm:space-y-2">
          <SkeletonBox className="h-3 sm:h-3.5 w-full rounded-md opacity-75" />
          <SkeletonBox className="h-3 sm:h-3.5 w-11/12 rounded-md opacity-70" />
          <SkeletonBox className="h-3 sm:h-3.5 w-4/5 rounded-md opacity-65" />
        </div>
      </div>

      {/* Footer Row */}
      <div className="mt-3 sm:mt-5 pt-2 sm:pt-3 border-t border-primary/8 dark:border-white/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <SkeletonBox className="h-3 sm:h-3.5 w-14 sm:w-16 rounded-md opacity-60" />
          <SkeletonBox className="h-3 sm:h-3.5 w-10 sm:w-12 rounded-md opacity-55" />
        </div>
        <SkeletonBox className="h-3 sm:h-3.5 w-16 sm:w-20 rounded-md opacity-55" />
      </div>
    </div>
  );
}

/**
 * Subtle Skeleton for the Google Reviews 4.8★ Summary Card during live sync
 */
export function GoogleReviewsSummarySkeleton() {
  return (
    <div
      role="status"
      aria-label="Bewertungsübersicht wird synchronisiert"
      className="card animate-pulse bg-white/95 dark:bg-slate-900/95 p-3.5 sm:p-6 border border-primary/10 dark:border-white/10"
    >
      <div className="grid gap-3.5 sm:gap-6 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-5 flex items-center gap-3 sm:gap-5 min-w-0">
          <SkeletonBox className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl shrink-0 opacity-75" />
          <div className="space-y-1.5 sm:space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <SkeletonBox className="h-6 sm:h-8 w-12 sm:w-14 rounded-lg opacity-80" />
              <SkeletonBox className="h-3.5 sm:h-4 w-20 sm:w-24 rounded-md opacity-70" />
            </div>
            <SkeletonBox className="h-3 sm:h-3.5 w-44 sm:w-48 rounded-md opacity-70" />
            <SkeletonBox className="h-2.5 sm:h-3 w-48 sm:w-56 rounded-md opacity-55" />
          </div>
        </div>

        <div className="lg:col-span-4 space-y-1.5 sm:space-y-2 border-y lg:border-y-0 lg:border-x border-primary/8 dark:border-white/10 py-2.5 sm:py-4 lg:py-0 lg:px-6">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="flex items-center gap-2 sm:gap-2.5">
              <SkeletonBox className="h-2 sm:h-2.5 w-5 sm:w-6 rounded-sm opacity-60" />
              <SkeletonBox className="h-1.5 sm:h-2 flex-1 rounded-full opacity-70" />
              <SkeletonBox className="h-2 sm:h-2.5 w-5 sm:w-6 rounded-sm opacity-55" />
            </div>
          ))}
        </div>

        <div className="lg:col-span-3 grid grid-cols-2 sm:flex sm:flex-row lg:flex-col gap-2 sm:gap-2.5">
          <SkeletonBox className="h-8 sm:h-10 flex-1 rounded-lg opacity-80" />
          <SkeletonBox className="h-8 sm:h-10 flex-1 rounded-lg opacity-65" />
        </div>
      </div>
    </div>
  );
}

