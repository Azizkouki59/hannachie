"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Star,
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Search,
  Languages,
  RefreshCw,
  ArrowRight,
  MessageSquarePlus,
  Pause,
  Play,
} from "lucide-react";
import { business } from "@/data/site";
import { SectionAmbientMesh } from "@/components/HeroAnimatedBackdrop";
import {
  googleReviews82,
  GOOGLE_MAPS_TOPIC_CHIPS,
  type DetailedGoogleReview,
  type GoogleMapsTopicKey,
} from "@/data/googleReviews82";
import { useGoogleLivePlace } from "@/lib/googlePlaceLive";
import { triggerHapticFeedback } from "@/lib/haptics";
import {
  GoogleReviewCardSkeleton,
  GoogleReviewsSummarySkeleton,
} from "@/components/Skeletons";
import { FadeUp } from "./animations";

interface GoogleReviewItem extends DetailedGoogleReview {
  authorUri?: string;
  authorPhotoUri?: string;
  publishTime?: string;
  originalText?: string;
  originalLanguage?: string;
  textLanguage?: string;
  googleMapsUri?: string;
  isLiveFromApi?: boolean;
}

type TopicFilterKey = "all" | GoogleMapsTopicKey;
type SortOption = "relevant" | "highest" | "newest";

function GoogleGLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
      />
    </svg>
  );
}

const AVATAR_COLORS = [
  "bg-[#1a73e8]",
  "bg-[#0f9d58]",
  "bg-[#d93025]",
  "bg-[#f29900]",
  "bg-[#9334e6]",
  "bg-[#00897b]",
  "bg-[#c2185b]",
  "bg-[#3949ab]",
];

function getInitials(name: string): string {
  const cleaned = name.replace(/[^a-zA-ZäöüÄÖÜß0-9\s]/g, "").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "G";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const TOPIC_MATCHERS: Array<{ key: GoogleMapsTopicKey; pattern: RegExp }> = [
  {
    key: "waschmaschinenreparatur",
    pattern: /waschmaschine|trommel|schleuder|lauge|abpump|flusensieb/i,
  },
  {
    key: "schnelle_terminvergabe",
    pattern: /termin|nächsten tag|kurzfristig|pünktlich/i,
  },
  {
    key: "schnelle_hilfe",
    pattern: /schnell|sofort|rasch|hilfe|notfall/i,
  },
  {
    key: "ersatzteile",
    pattern: /ersatzteil|pumpe|dichtung|heiz|lager|original/i,
  },
  {
    key: "ehrliche_beratung",
    pattern: /ehrlich|fair|preis|transparent|empfehl|beratung/i,
  },
  {
    key: "kompetente_reparatur",
    pattern: /kompetent|fachlich|professionell|freundlich|zuverlässig/i,
  },
];

function inferTopics(text: string): GoogleMapsTopicKey[] {
  const matches: GoogleMapsTopicKey[] = [];
  for (const matcher of TOPIC_MATCHERS) {
    if (matcher.pattern.test(text)) {
      matches.push(matcher.key);
    }
  }
  return matches;
}

function VerifiedReviewCard({
  review,
  fallbackMapsUri,
  colorIdx,
  isDuplicate = false,
}: {
  review: GoogleReviewItem;
  fallbackMapsUri: string;
  colorIdx: number;
  isDuplicate?: boolean;
}) {
  const [avatarError, setAvatarError] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const hasOriginalAlt = Boolean(
    review.originalText &&
      review.originalText.trim() &&
      review.originalText.trim() !== review.text.trim()
  );
  const body = showOriginal && hasOriginalAlt ? review.originalText! : review.text;
  const isLong = body.length > 210;
  const displayBody = isLong && !expanded ? `${body.slice(0, 205).trim()}…` : body;
  const mapsLink = review.googleMapsUri || review.authorUri || fallbackMapsUri;
  const avatarBg = AVATAR_COLORS[colorIdx % AVATAR_COLORS.length];
  const dupTabIndex = isDuplicate ? -1 : undefined;

  return (
    <article
      aria-hidden={isDuplicate || undefined}
      className="card flex h-full flex-col justify-between rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs transition-colors hover:border-accent/35"
    >
      <div>
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold text-white ${avatarBg}`}
              aria-hidden="true"
            >
              {review.authorPhotoUri && !avatarError ? (
                <img
                  src={review.authorPhotoUri}
                  alt={isDuplicate ? "" : review.author}
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
                  tabIndex={dupTabIndex}
                  className="block truncate text-sm font-extrabold text-primary dark:text-slate-100 hover:text-accent transition-colors"
                >
                  {review.author}
                </a>
              ) : (
                <p className="truncate text-sm font-extrabold text-primary dark:text-slate-100">
                  {review.author}
                </p>
              )}
              <p className="truncate text-[11px] text-ink-faint">
                {review.relativeTime || "Verifiziert auf Google Maps"}
              </p>
            </div>
          </div>

          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={dupTabIndex}
            aria-label={`Rezension von ${review.author} auf Google Maps öffnen`}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-800 text-ink-muted hover:border-accent hover:text-accent transition-colors"
          >
            <ExternalLink size={13} aria-hidden="true" />
          </a>
        </div>

        <div
          className="mt-2.5 mb-2 flex items-center gap-0.5"
          role="img"
          aria-label={`${review.rating} von 5 Sternen`}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              size={13}
              aria-hidden="true"
              className={
                i <= Math.round(review.rating)
                  ? "fill-[#fbbc04] text-[#fbbc04]"
                  : "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700"
              }
            />
          ))}
        </div>

        <p className="text-xs sm:text-[13.5px] leading-relaxed text-primary/90 dark:text-slate-200">
          {displayBody || "Bewertung ohne Textkommentar."}
        </p>

        {isLong && (
          <button
            type="button"
            tabIndex={dupTabIndex}
            onClick={() => setExpanded((prev) => !prev)}
            className="mt-1.5 text-xs font-bold text-accent hover:underline cursor-pointer"
          >
            {expanded ? "Weniger anzeigen" : "Weiterlesen"}
          </button>
        )}

        {hasOriginalAlt && (
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-faint">
            <Languages size={11} className="text-accent shrink-0" aria-hidden="true" />
            <button
              type="button"
              tabIndex={dupTabIndex}
              onClick={() => setShowOriginal((prev) => !prev)}
              className="font-semibold text-accent hover:underline cursor-pointer"
            >
              {showOriginal ? "Übersetzung (DE)" : "Original ansehen"}
            </button>
          </div>
        )}
      </div>

      <div className="mt-3.5 pt-2.5 border-t border-primary/8 dark:border-white/10 flex items-center justify-between gap-2 text-[11px] text-ink-faint">
        <span className="inline-flex items-center gap-1 font-medium">
          <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
          <span>{review.isLiveFromApi ? "Google Live" : "Google Maps"}</span>
        </span>
        <a
          href={mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={dupTabIndex}
          className="inline-flex items-center gap-1 font-semibold text-accent hover:underline"
        >
          <span>Auf Google ansehen</span>
          <ExternalLink size={10} aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

const TICKER_CARD_STEP_PX = 384; // 368px card + 16px gap

function DesktopReviewTicker({
  reviews,
  fallbackMapsUri,
  isPaused,
  stepSignal,
  prefersReducedMotion,
}: {
  reviews: GoogleReviewItem[];
  fallbackMapsUri: string;
  isPaused: boolean;
  stepSignal: { delta: number; seq: number };
  prefersReducedMotion: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const nudgeRef = useRef(0);
  const isHoveredRef = useRef(false);
  const isFocusedRef = useRef(false);
  const isPausedRef = useRef(isPaused);
  const reducedMotionRef = useRef(prefersReducedMotion);
  const lastStepSeqRef = useRef(0);

  isPausedRef.current = isPaused;
  reducedMotionRef.current = prefersReducedMotion;

  // Reset ribbon cleanly when filtered set changes
  const reviewsKey = useMemo(() => reviews.map((r) => r.id).join("|"), [reviews]);

  useEffect(() => {
    offsetRef.current = 0;
    nudgeRef.current = 0;
    if (trackRef.current) {
      trackRef.current.style.transform = "translate3d(0px, 0, 0)";
    }
  }, [reviewsKey]);

  // Queue manual Prev / Next stepping cleanly without breaking seamless loop
  useEffect(() => {
    if (stepSignal.seq === 0 || stepSignal.seq === lastStepSeqRef.current) return;
    lastStepSeqRef.current = stepSignal.seq;
    nudgeRef.current += stepSignal.delta * TICKER_CARD_STEP_PX;
  }, [stepSignal]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let rafId = 0;
    let lastTime = performance.now();
    let isVisible = false;

    const start = () => {
      if (rafId || !isVisible || document.hidden) return;
      lastTime = performance.now();
      rafId = window.requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = 0;
    };

    // Only animate while the ticker is on screen and the tab is visible.
    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(([entry]) => {
            isVisible = entry.isIntersecting;
            if (isVisible) start();
            else stop();
          })
        : null;
    if (io) io.observe(track);
    else isVisible = true;
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    // Cache the loop width instead of forcing a layout read every frame.
    let halfWidth = track.scrollWidth / 2;
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            halfWidth = track.scrollWidth / 2;
          })
        : null;
    ro?.observe(track);

    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
      lastTime = now;

      if (halfWidth > 0) {
        let moved = false;

        // Smoothly interpolate any manual Prev/Next nudge
        if (Math.abs(nudgeRef.current) > 0.35) {
          const step = reducedMotionRef.current
            ? nudgeRef.current
            : nudgeRef.current * (1 - Math.exp(-10 * dt));
          offsetRef.current += step;
          nudgeRef.current -= step;
          moved = true;
        } else if (nudgeRef.current !== 0) {
          offsetRef.current += nudgeRef.current;
          nudgeRef.current = 0;
          moved = true;
        }

        // Continuous calm drift when not paused, hovered, focused, or reduced-motion
        if (
          !isPausedRef.current &&
          !isHoveredRef.current &&
          !isFocusedRef.current &&
          !reducedMotionRef.current
        ) {
          offsetRef.current += 24 * dt;
          moved = true;
        }

        if (moved) {
          // Seamless modulo wrap in both directions
          offsetRef.current = ((offsetRef.current % halfWidth) + halfWidth) % halfWidth;
          track.style.transform = `translate3d(${-offsetRef.current.toFixed(2)}px, 0, 0)`;
        }
      }

      rafId = window.requestAnimationFrame(tick);
    };

    if (!io) start();
    return () => {
      stop();
      io?.disconnect();
      ro?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reviewsKey]);

  return (
    <div
      className="mask-fade-edges relative overflow-hidden py-2 -my-2"
      onPointerEnter={() => {
        isHoveredRef.current = true;
      }}
      onPointerLeave={() => {
        isHoveredRef.current = false;
      }}
      onFocusCapture={() => {
        isFocusedRef.current = true;
      }}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          isFocusedRef.current = false;
        }
      }}
    >
      <div
        ref={trackRef}
        className="flex w-max items-stretch gap-4 will-change-transform"
      >
        {reviews.map((rev, idx) => (
          <div key={rev.id} className="w-[368px] shrink-0">
            <VerifiedReviewCard
              review={rev}
              fallbackMapsUri={fallbackMapsUri}
              colorIdx={idx}
            />
          </div>
        ))}
        {reviews.map((rev, idx) => (
          <div key={`${rev.id}-dup`} className="w-[368px] shrink-0">
            <VerifiedReviewCard
              review={rev}
              fallbackMapsUri={fallbackMapsUri}
              colorIdx={idx}
              isDuplicate
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function GoogleReviewsSection({
  showViewAllLink = true,
  mode = "compact",
}: {
  showViewAllLink?: boolean;
  mode?: "compact" | "full";
}) {
  const { place, ratingFormatted, source, isLoading, refresh } = useGoogleLivePlace();
  const prefersReducedMotion = useReducedMotion();

  const [selectedTopic, setSelectedTopic] = useState<TopicFilterKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("relevant");
  const [page, setPage] = useState(0);
  const [visibleFullCount, setVisibleFullCount] = useState(9);
  const [tickerPaused, setTickerPaused] = useState(false);
  const [tickerStep, setTickerStep] = useState<{ delta: number; seq: number }>({
    delta: 0,
    seq: 0,
  });

  const mapsReviewsUri =
    place.reviewsUri || place.googleMapsUri || business.mapsReviewsUrl;
  const writeReviewUri =
    place.writeAReviewUri || place.reviewsUri || business.mapsReviewsUrl;

  // Combine verified live Google Places reviews first, followed by verified curated Google Maps excerpts (strictly zero fake localStorage entries)
  const allVerifiedReviews = useMemo<GoogleReviewItem[]>(() => {
    const liveItems: GoogleReviewItem[] =
      source === "live" && place.reviews.length > 0
        ? place.reviews.map((r, idx) => ({
            id: r.id || `live-google-${idx}`,
            author: r.author,
            rating: r.rating,
            text: r.text,
            relativeTime: r.relativeTime || "Auf Google Maps",
            serviceTag: "Google Maps",
            category: "gebraucht_beratung",
            verified: true,
            topicTags: inferTopics(r.text),
            authorUri: r.authorUri,
            // Initials instead of Google-hosted profile photos: no data transfer to Google without consent.
            authorPhotoUri: undefined,
            publishTime: r.publishTime,
            originalText: r.originalText,
            originalLanguage: r.originalLanguage,
            textLanguage: r.textLanguage,
            googleMapsUri: r.googleMapsUri,
            isLiveFromApi: true,
          }))
        : [];

    const liveAuthors = new Set(liveItems.map((r) => r.author.toLowerCase()));
    const verifiedArchive: GoogleReviewItem[] = googleReviews82
      .filter((r) => !liveAuthors.has(r.author.toLowerCase()))
      .map((r) => ({
        ...r,
        authorPhotoUri: undefined,
        topicTags: r.topicTags && r.topicTags.length > 0 ? r.topicTags : inferTopics(r.text),
        googleMapsUri: mapsReviewsUri,
        isLiveFromApi: false,
      }));

    return [...liveItems, ...verifiedArchive];
  }, [source, place.reviews, mapsReviewsUri]);

  const filteredReviews = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = allVerifiedReviews.filter((r) => {
      if (selectedTopic !== "all") {
        const topics = r.topicTags || [];
        if (!topics.includes(selectedTopic)) return false;
      }
      if (q) {
        const haystack = `${r.author} ${r.text} ${r.relativeTime}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    if (sortBy === "highest") {
      return [...list].sort((a, b) => b.rating - a.rating);
    }
    if (sortBy === "newest") {
      return [...list].sort((a, b) => {
        const ta = a.publishTime ? Date.parse(a.publishTime) || 0 : 0;
        const tb = b.publishTime ? Date.parse(b.publishTime) || 0 : 0;
        return tb - ta;
      });
    }
    return list;
  }, [allVerifiedReviews, selectedTopic, searchQuery, sortBy]);

  const compactPerPage = 3;
  const totalCompactPages = Math.max(1, Math.ceil(filteredReviews.length / compactPerPage));
  const safePage = Math.min(page, totalCompactPages - 1);

  const displayedReviews = useMemo(() => {
    if (mode === "compact") {
      const start = safePage * compactPerPage;
      return filteredReviews.slice(start, start + compactPerPage);
    }
    return filteredReviews.slice(0, visibleFullCount);
  }, [mode, filteredReviews, safePage, visibleFullCount]);

  const tickerReviews = useMemo(
    () => filteredReviews.slice(0, 12),
    [filteredReviews]
  );
  const useDesktopTicker = mode === "compact" && tickerReviews.length >= 3;
  const effectiveTickerPaused = Boolean(prefersReducedMotion) || tickerPaused;

  const topicChips = GOOGLE_MAPS_TOPIC_CHIPS.slice(0, mode === "compact" ? 5 : 7);

  return (
    <section
      id="kundenstimmen"
      aria-labelledby="google-reviews-heading"
      className="relative overflow-hidden border-t border-primary/8 dark:border-white/10 bg-surface dark:bg-slate-950 py-10 sm:py-14"
    >
      <SectionAmbientMesh variant="reviews" />
      <div className="container-page relative z-10">
        {isLoading && allVerifiedReviews.length === 0 ? (
          <div className="space-y-6">
            <GoogleReviewsSummarySkeleton />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <GoogleReviewCardSkeleton />
              <GoogleReviewCardSkeleton />
              <GoogleReviewCardSkeleton />
            </div>
          </div>
        ) : (
          <div className="space-y-5 sm:space-y-6">
            {/* Compact Unified Summary & Direct Google Action Header */}
            <FadeUp>
              <div className="rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-xs">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-800 shadow-2xs">
                      <GoogleGLogo className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <h2
                          id="google-reviews-heading"
                          className="text-lg sm:text-xl font-extrabold text-primary dark:text-white tracking-tight"
                        >
                          Google-Bewertungen
                        </h2>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 text-xs font-extrabold text-amber-700 dark:text-amber-300 tabular-nums">
                          <Star size={12} className="fill-[#fbbc04] text-[#fbbc04]" aria-hidden="true" />
                          <span>{ratingFormatted}</span>
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs sm:text-sm text-ink-muted">
                        {place.userRatingCount} Bewertungen auf Google Maps für{" "}
                        <span className="font-semibold text-primary dark:text-slate-200">
                          {business.name} · {business.city}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Direct Genuine Google Maps Links (Zero Fake Local Submission) */}
                  <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 shrink-0">
                    <a
                      href={writeReviewUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => triggerHapticFeedback(30)}
                      className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-accent hover:bg-accent-dark px-3.5 py-2 text-xs font-extrabold text-white transition-colors whitespace-nowrap"
                    >
                      <MessageSquarePlus size={14} aria-hidden="true" />
                      <span>Auf Google bewerten</span>
                      <ExternalLink size={12} aria-hidden="true" />
                    </a>
                    <a
                      href={mapsReviewsUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-primary/15 dark:border-white/15 bg-surface dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-primary dark:text-slate-100 hover:border-accent transition-colors whitespace-nowrap"
                    >
                      <span>Alle {place.userRatingCount} auf Google</span>
                      <ExternalLink size={12} aria-hidden="true" />
                    </a>
                    {mode === "full" && (
                      <button
                        type="button"
                        onClick={() => {
                          triggerHapticFeedback(20);
                          void refresh();
                        }}
                        aria-label="Google-Bewertungen aktualisieren"
                        className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-primary/12 dark:border-white/12 bg-surface dark:bg-slate-800 text-ink-muted hover:text-accent hover:border-accent transition-colors cursor-pointer"
                      >
                        <RefreshCw size={14} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Compact Filter Bar */}
                <div className="mt-4 pt-3.5 border-t border-primary/8 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div
                    role="tablist"
                    aria-label="Bewertungen nach Thema filtern"
                    className="flex flex-wrap items-center gap-1.5"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={selectedTopic === "all"}
                      onClick={() => {
                        triggerHapticFeedback(20);
                        setSelectedTopic("all");
                        setPage(0);
                        setVisibleFullCount(9);
                      }}
                      className={`min-h-[34px] rounded-lg px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ${
                        selectedTopic === "all"
                          ? "bg-primary text-white dark:bg-accent"
                          : "bg-primary/5 dark:bg-white/5 text-ink-muted hover:text-primary dark:hover:text-white"
                      }`}
                    >
                      Alle
                    </button>
                    {topicChips.map((chip) => {
                      const active = selectedTopic === chip.id;
                      return (
                        <button
                          key={chip.id}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          onClick={() => {
                            triggerHapticFeedback(20);
                            setSelectedTopic(chip.id);
                            setPage(0);
                            setVisibleFullCount(9);
                          }}
                          className={`min-h-[34px] rounded-lg px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ${
                            active
                              ? "bg-primary text-white dark:bg-accent"
                              : "bg-primary/5 dark:bg-white/5 text-ink-muted hover:text-primary dark:hover:text-white"
                          }`}
                        >
                          {chip.label}
                        </button>
                      );
                    })}
                  </div>

                  {mode === "full" ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative flex-1 sm:flex-none sm:w-52">
                        <Search
                          size={14}
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
                          aria-hidden="true"
                        />
                        <input
                          type="search"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setVisibleFullCount(9);
                          }}
                          placeholder="Stichwort suchen…"
                          className="w-full min-h-[36px] rounded-lg border border-primary/12 dark:border-white/12 bg-surface dark:bg-slate-800 pl-8 pr-3 py-1.5 text-xs text-primary dark:text-slate-100 placeholder:text-ink-faint focus:border-accent focus:outline-none"
                        />
                      </div>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        aria-label="Sortierung"
                        className="min-h-[36px] rounded-lg border border-primary/12 dark:border-white/12 bg-surface dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-primary dark:text-slate-100 focus:border-accent focus:outline-none cursor-pointer"
                      >
                        <option value="relevant">Relevanteste</option>
                        <option value="highest">Beste zuerst</option>
                        <option value="newest">Neueste zuerst</option>
                      </select>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between md:justify-end gap-2">
                      {/* Desktop Ticker Controls (Pause / Play + Prev / Next) */}
                      {useDesktopTicker && (
                        <div className="hidden lg:inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              triggerHapticFeedback(20);
                              setTickerPaused((p) => !p);
                            }}
                            aria-pressed={effectiveTickerPaused}
                            aria-label={
                              effectiveTickerPaused
                                ? "Bewertungs-Laufband fortsetzen"
                                : "Bewertungs-Laufband pausieren"
                            }
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-primary/12 dark:border-white/12 bg-surface dark:bg-slate-800 px-2.5 text-[11px] font-bold text-primary dark:text-slate-200 hover:border-accent transition-colors cursor-pointer"
                          >
                            {effectiveTickerPaused ? (
                              <>
                                <Play size={12} aria-hidden="true" />
                                <span>Weiter</span>
                              </>
                            ) : (
                              <>
                                <Pause size={12} aria-hidden="true" />
                                <span>Pause</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              triggerHapticFeedback(20);
                              setTickerStep((s) => ({ delta: -1, seq: s.seq + 1 }));
                            }}
                            aria-label="Vorherige Bewertung im Laufband"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-primary/12 dark:border-white/12 bg-surface dark:bg-slate-800 text-primary dark:text-slate-200 hover:border-accent transition-colors cursor-pointer"
                          >
                            <ChevronLeft size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              triggerHapticFeedback(20);
                              setTickerStep((s) => ({ delta: 1, seq: s.seq + 1 }));
                            }}
                            aria-label="Nächste Bewertung im Laufband"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-primary/12 dark:border-white/12 bg-surface dark:bg-slate-800 text-primary dark:text-slate-200 hover:border-accent transition-colors cursor-pointer"
                          >
                            <ChevronRight size={15} />
                          </button>
                        </div>
                      )}

                      {/* Mobile / Tablet (or < 3 items) Paginated Controls */}
                      <div
                        className={`flex items-center justify-between md:justify-end gap-2 w-full md:w-auto ${
                          useDesktopTicker ? "lg:hidden" : ""
                        }`}
                      >
                        <span className="text-xs font-medium text-ink-faint tabular-nums">
                          Seite {safePage + 1} / {totalCompactPages}
                        </span>
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              triggerHapticFeedback(20);
                              setPage((p) => (p > 0 ? p - 1 : totalCompactPages - 1));
                            }}
                            aria-label="Vorherige Bewertungen"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-primary/12 dark:border-white/12 bg-surface dark:bg-slate-800 text-primary dark:text-slate-200 hover:border-accent transition-colors cursor-pointer"
                          >
                            <ChevronLeft size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              triggerHapticFeedback(20);
                              setPage((p) => (p + 1) % totalCompactPages);
                            }}
                            aria-label="Nächste Bewertungen"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-primary/12 dark:border-white/12 bg-surface dark:bg-slate-800 text-primary dark:text-slate-200 hover:border-accent transition-colors cursor-pointer"
                          >
                            <ChevronRight size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </FadeUp>

            {/* Verified Reviews Display: Desktop Infinite Ticker (compact) + Responsive Grid */}
            {displayedReviews.length === 0 ? (
              <div className="rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 p-8 text-center">
                <p className="text-sm font-bold text-primary dark:text-slate-100">
                  Keine passenden Rezensionen für diesen Filter gefunden.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTopic("all");
                    setSearchQuery("");
                  }}
                  className="mt-3 inline-flex min-h-[38px] items-center rounded-xl bg-accent px-4 py-1.5 text-xs font-extrabold text-white hover:bg-accent-dark transition-colors cursor-pointer"
                >
                  Filter zurücksetzen
                </button>
              </div>
            ) : (
              <>
                {useDesktopTicker && (
                  <div className="hidden lg:block">
                    <DesktopReviewTicker
                      reviews={tickerReviews}
                      fallbackMapsUri={mapsReviewsUri}
                      isPaused={effectiveTickerPaused}
                      stepSignal={tickerStep}
                      prefersReducedMotion={Boolean(prefersReducedMotion)}
                    />
                  </div>
                )}

                <div className={useDesktopTicker ? "lg:hidden" : ""}>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={`${mode}-${selectedTopic}-${safePage}-${sortBy}`}
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                    >
                      {displayedReviews.map((rev, idx) => (
                        <VerifiedReviewCard
                          key={rev.id}
                          review={rev}
                          fallbackMapsUri={mapsReviewsUri}
                          colorIdx={idx + safePage * 3}
                        />
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </>
            )}

            {/* Compact Bottom Action Strip & Quiet Attribution */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              {mode === "full" && visibleFullCount < filteredReviews.length ? (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHapticFeedback(25);
                      setVisibleFullCount((c) => c + 9);
                    }}
                    className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-primary/15 dark:border-white/15 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-extrabold text-primary dark:text-slate-100 hover:border-accent transition-colors cursor-pointer"
                  >
                    <span>
                      Weitere Bewertungen laden ({filteredReviews.length - visibleFullCount} verbleibend)
                    </span>
                  </button>
                  <p className="text-[11px] text-ink-faint">
                    Auszüge aus öffentlichen Google-Bewertungen. Die Bewertungen werden von Google veröffentlicht; wir prüfen nicht, ob die Verfasser unser Angebot genutzt haben.
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-ink-faint">
                  Auszüge aus öffentlichen Google-Bewertungen. Die Bewertungen werden von Google veröffentlicht; wir prüfen nicht, ob die Verfasser unser Angebot genutzt haben.
                </p>
              )}

              {showViewAllLink && (
                <Link
                  href="/kundenbewertungen"
                  className="inline-flex min-h-[40px] items-center gap-1.5 text-xs sm:text-sm font-extrabold text-accent hover:underline"
                >
                  <span>Alle Kundenbewertungen ansehen</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default GoogleReviewsSection;
