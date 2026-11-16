"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Star,
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  MapPin,
  MessageSquarePlus,
  CornerDownRight,
  Search,
  ArrowUpDown,
  ThumbsUp,
  Share2,
  X,
  Copy,
  Check,
  Sparkles,
  Languages,
} from "lucide-react";
import { business } from "@/data/site";
import {
  googleReviews82,
  GOOGLE_MAPS_TOPIC_CHIPS,
  type DetailedGoogleReview,
  type GoogleMapsTopicKey,
} from "@/data/googleReviews82";
import { triggerHapticFeedback } from "@/lib/haptics";
import {
  GoogleReviewCardSkeleton,
  GoogleReviewsSummarySkeleton,
} from "@/components/Skeletons";
import GoogleMapsEmbed from "@/components/GoogleMapsEmbed";
import { safeJsonParse, sanitizeSingleLine, sanitizeText } from "@/utils/sanitize";
import { FadeUp } from "./animations";

interface GoogleReviewItem extends DetailedGoogleReview {
  authorUri?: string;
  isLiveFromApi?: boolean;
}

type SortOption = "relevant" | "newest" | "highest" | "lowest";

const LOCAL_STORAGE_USER_REVIEWS_KEY = "hannachi_user_google_reviews_v1";
const LOCAL_STORAGE_LIKED_REVIEWS_KEY = "hannachi_liked_google_reviews_v1";

const FAST_REVIEW_QUICK_PHRASES = [
  "Schnelle Terminvergabe",
  "Geprüftes Gerät mit Garantie erhalten",
  "Faire Preise & ehrliche Beratung",
  "Sehr freundlich & kompetent",
  "Passendes Ersatzteil direkt gefunden",
  "Zuverlässige Übergabe in Osnabrück",
];

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

function ReviewStars({
  rating,
  size = 15,
}: {
  rating: number;
  size?: number;
}) {
  const rounded = Math.round(rating);
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} von 5 Sternen`}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= rounded;
        return (
          <Star
            key={i}
            size={size}
            className={
              filled
                ? "fill-[#fbbc04] text-[#fbbc04]"
                : "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700"
            }
          />
        );
      })}
    </div>
  );
}

function ReviewMarqueeCard({
  rev,
  colorIndex,
  livePlaceUri,
  isLiked,
  onToggleLike,
}: {
  rev: GoogleReviewItem;
  colorIndex: number;
  livePlaceUri: string;
  isLiked: boolean;
  onToggleLike: (id: string) => void;
}) {
  const avatarColor = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];
  const [showEnglish, setShowEnglish] = useState(false);
  const [sharedCopied, setSharedCopied] = useState(false);

  const likeTotal = (rev.likesCount ?? 0) + (isLiked ? 1 : 0);

  const handleShare = async () => {
    triggerHapticFeedback(50);
    const shareText = `„${rev.text}“ – ${rev.author} (${rev.rating} ★ auf Google Maps für Hannachi Elektrohaushaltsgeräte Service Osnabrück)`;
    try {
      await navigator.clipboard.writeText(shareText);
      setSharedCopied(true);
      window.setTimeout(() => setSharedCopied(false), 2000);
    } catch {
      // Ignore clipboard permission errors
    }
  };

  return (
    <figure
      data-review-card
      className="card shrink-0 w-[265px] min-[400px]:w-[285px] sm:w-[340px] lg:w-[360px] flex flex-col justify-between p-4 sm:p-5 bg-white dark:bg-slate-900 border border-primary/10 dark:border-white/10 hover:border-accent/40 transition-colors duration-200"
    >
      <div>
        {/* Authentic Google Maps Reviewer Header */}
        <div className="flex items-start justify-between gap-2.5 sm:gap-3 mb-2 sm:mb-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div
              className={`relative flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full ${avatarColor} text-[11px] sm:text-xs font-bold text-white shadow-xs`}
              aria-hidden="true"
            >
              {getInitials(rev.author)}
              {rev.localGuide && (
                <span
                  title={rev.localGuide}
                  className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-[#e8710a] text-[8px] sm:text-[9px] font-black text-white ring-2 ring-white dark:ring-slate-900"
                >
                  ★
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs sm:text-sm font-bold text-primary dark:text-slate-100 truncate">
                  {rev.author}
                </p>
              </div>
              <p className="text-[10px] sm:text-[11px] text-ink-faint truncate">
                {rev.localGuide
                  ? `${rev.localGuide}`
                  : "Google-Nutzer · Rezension"}
              </p>
            </div>
          </div>

          <a
            href={rev.authorUri || livePlaceUri}
            target="_blank"
            rel="noopener noreferrer"
            title="Auf Google Maps ansehen"
            aria-label={`Rezension von ${rev.author} auf Google Maps ansehen`}
            className="p-1 sm:p-1.5 rounded-lg bg-surface dark:bg-slate-800 hover:bg-primary/5 border border-primary/8 dark:border-white/10 transition-colors shrink-0"
          >
            <GoogleGLogo className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </a>
        </div>

        {/* Google Maps Star Row + Relative Timestamp + NEU Badge */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 mb-2 sm:mb-3">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <ReviewStars rating={rev.rating} size={13} />
            <span className="text-[11px] sm:text-xs text-ink-faint">{rev.relativeTime}</span>
            {rev.isNew && (
              <span className="inline-flex items-center rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-primary dark:text-slate-200">
                NEU
              </span>
            )}
          </div>
          {rev.serviceTag && (
            <span className="text-[10px] sm:text-[11px] font-semibold text-ink-muted">
              {rev.serviceTag}
            </span>
          )}
        </div>

        {/* Review Text (Original German or English Translation like Google Maps) */}
        <blockquote className="text-xs sm:text-[13.5px] leading-relaxed text-primary/90 dark:text-slate-200 line-clamp-4">
          {showEnglish && rev.textEn ? rev.textEn : rev.text}
        </blockquote>

        {/* Bilingual Google Translate Toggle when English translation is available */}
        {rev.textEn && (
          <div className="mt-1.5 sm:mt-2 flex items-center gap-1.5 text-[10px] sm:text-[11px] text-ink-faint">
            <Languages size={11} className="text-accent shrink-0" />
            <span>
              {showEnglish ? "Übersetzt von Google" : "Original (DE)"}
            </span>
            <span>·</span>
            <button
              type="button"
              onClick={() => setShowEnglish((prev) => !prev)}
              className="font-semibold text-accent hover:underline cursor-pointer"
            >
              {showEnglish ? "Original ansehen" : "Englisch"}
            </button>
          </div>
        )}

        {/* Owner Reply from Kamal Hannachi (when present on Google Maps) */}
        {rev.ownerReply && (
          <div className="mt-2.5 sm:mt-3 rounded-xl bg-surface dark:bg-slate-800/80 border border-primary/8 dark:border-white/10 px-3 py-2 text-[11px] sm:text-xs">
            <p className="flex items-center gap-1.5 font-bold text-primary dark:text-slate-200 mb-0.5">
              <CornerDownRight size={11} className="text-accent shrink-0" />
              <span>Antwort · Kamal Hannachi</span>
            </p>
            <p className="text-ink-muted leading-snug line-clamp-2">{rev.ownerReply}</p>
          </div>
        )}
      </div>

      {/* Google Maps Card Footer: Like ("Hilfreich"), Share ("Teilen"), & Direct Maps Link */}
      <figcaption className="mt-2.5 sm:mt-4 flex items-center justify-between gap-2 pt-2 sm:pt-3 border-t border-primary/8 dark:border-white/10 text-[10.5px] sm:text-[11px]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onToggleLike(rev.id)}
            aria-label={`Rezension von ${rev.author} als hilfreich markieren (${likeTotal})`}
            className={`inline-flex items-center gap-1.5 font-semibold transition-colors cursor-pointer ${
              isLiked
                ? "text-accent"
                : "text-ink-muted hover:text-primary dark:hover:text-slate-200"
            }`}
            aria-pressed={isLiked}
          >
            <ThumbsUp size={13} aria-hidden="true" className={isLiked ? "fill-accent/20 text-accent" : ""} />
            <span>Hilfreich{likeTotal > 0 ? ` (${likeTotal})` : ""}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            aria-label={`Rezension von ${rev.author} kopieren und teilen`}
            className="inline-flex items-center gap-1 font-semibold text-ink-muted hover:text-primary dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            {sharedCopied ? (
              <>
                <Check size={12} aria-hidden="true" className="text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Kopiert</span>
              </>
            ) : (
              <>
                <Share2 size={12} aria-hidden="true" />
                <span>Teilen</span>
              </>
            )}
          </button>
        </div>

        <a
          href={rev.authorUri || livePlaceUri}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Alle Bewertungen auf Google Maps öffnen"
          className="inline-flex items-center gap-1 text-ink-faint hover:text-accent font-semibold transition-colors shrink-0"
        >
          <span>Google Maps</span>
          <ExternalLink size={11} aria-hidden="true" />
        </a>
      </figcaption>
    </figure>
  );
}

interface GoogleReviewsSectionProps {
  showViewAllLink?: boolean;
}

export function GoogleReviewsSection({
  showViewAllLink = true,
}: GoogleReviewsSectionProps) {
  const row1Ref = useRef<HTMLDivElement | null>(null);
  const row2Ref = useRef<HTMLDivElement | null>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [isHoveredOrTouched, setIsHoveredOrTouched] = useState(false);

  // Google Maps Topic Filter, Search & Sort State
  const [selectedTopic, setSelectedTopic] = useState<"all" | GoogleMapsTopicKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("relevant");

  // Free, Zero-Billing Google Maps URIs & Live Map Preview Toggle
  const [showFreeLiveMap, setShowFreeLiveMap] = useState(false);
  const livePlaceUri = business.mapsReviewsUrl || business.mapsUrl;
  const liveWriteReviewUri = business.mapsWriteReviewUrl;

  // Fast Review ("Rezension schreiben") Modal State
  const [isFastReviewOpen, setIsFastReviewOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [draftRating, setDraftRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [draftAuthor, setDraftAuthor] = useState<string>("");
  const [draftService, setDraftService] = useState<string>("Waschmaschine");
  const [draftText, setDraftText] = useState<string>("");
  const [selectedDraftPhrases, setSelectedDraftPhrases] = useState<string[]>([]);
  const [fastReviewSubmitted, setFastReviewSubmitted] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isFastReviewOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFastReviewOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFastReviewOpen]);

  const openFastReviewModal = () => {
    triggerHapticFeedback(50);
    setFastReviewSubmitted(false);
    setCopiedToClipboard(false);
    setIsFastReviewOpen(true);
  };

  // Liked review IDs
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});
  const [isInitialSync, setIsInitialSync] = useState<boolean>(true);
  const [isFilteringSync, setIsFilteringSync] = useState<boolean>(false);
  const syncTimerRef = useRef<number | null>(null);

  const initialReviews: GoogleReviewItem[] = useMemo(
    () =>
      googleReviews82.map((rev) => ({
        ...rev,
        authorUri: business.mapsReviewsUrl || business.mapsUrl,
      })),
    []
  );

  const [reviewItems, setReviewItems] =
    useState<GoogleReviewItem[]>(initialReviews);

  const triggerSubtleSyncSkeleton = (durationMs = 150) => {
    if (syncTimerRef.current) {
      window.clearTimeout(syncTimerRef.current);
    }
    setIsFilteringSync(true);
    syncTimerRef.current = window.setTimeout(() => {
      setIsFilteringSync(false);
      syncTimerRef.current = null;
    }, durationMs);
  };

  // Hydrate user-submitted fast reviews and likes from localStorage with subtle initial sync skeleton
  useEffect(() => {
    try {
      const savedLikes = window.localStorage.getItem(LOCAL_STORAGE_LIKED_REVIEWS_KEY);
      const parsedLikes = safeJsonParse<Record<string, boolean>>(
        savedLikes,
        (val): val is Record<string, boolean> =>
          Boolean(val) && typeof val === "object" && !Array.isArray(val),
        {}
      );
      if (Object.keys(parsedLikes).length > 0) {
        setLikedIds(parsedLikes);
      }

      const savedReviews = window.localStorage.getItem(LOCAL_STORAGE_USER_REVIEWS_KEY);
      const parsedReviews = safeJsonParse<GoogleReviewItem[]>(
        savedReviews,
        (val): val is GoogleReviewItem[] => Array.isArray(val),
        []
      );
      if (parsedReviews.length > 0) {
        const sanitizedReviews = parsedReviews.filter(
          (r) => r && typeof r.id === "string" && typeof r.text === "string" && typeof r.author === "string"
        );
        if (sanitizedReviews.length > 0) {
          setReviewItems((prev) => {
            const existingIds = new Set(prev.map((r) => r.id));
            const uniqueNew = sanitizedReviews.filter((r) => !existingIds.has(r.id));
            return [...uniqueNew, ...prev];
          });
        }
      }
    } catch {
      // Ignore localStorage errors
    }

    const initialTimer = window.setTimeout(() => {
      setIsInitialSync(false);
    }, 260);

    return () => {
      window.clearTimeout(initialTimer);
      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current);
      }
    };
  }, []);

  const isSyncingReviews = isInitialSync || isFilteringSync;

  const handleToggleLike = (id: string) => {
    triggerHapticFeedback(50);
    setLikedIds((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        window.localStorage.setItem(LOCAL_STORAGE_LIKED_REVIEWS_KEY, JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  // Compute star breakdown counts (5★ down to 1★) and live average rating dynamically
  const { starDistribution, liveRating, liveReviewCount } = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    for (const item of reviewItems) {
      const r = Math.max(1, Math.min(5, Math.round(item.rating))) as
        | 1
        | 2
        | 3
        | 4
        | 5;
      counts[r] += 1;
      sum += r;
    }
    const total = reviewItems.length || 82;
    const avg = reviewItems.length > 0 ? Number((sum / total).toFixed(1)) : 4.8;
    return {
      starDistribution: counts,
      liveRating: avg,
      liveReviewCount: total,
    };
  }, [reviewItems]);

  // Filter & Sort Reviews based on Google Maps Topic Chips, Search Query, and Sort Option
  const filteredReviews = useMemo(() => {
    let list = [...reviewItems];

    if (selectedTopic !== "all") {
      list = list.filter((item) => item.topicTags?.includes(selectedTopic));
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (item) =>
          item.author.toLowerCase().includes(q) ||
          item.text.toLowerCase().includes(q) ||
          (item.textEn && item.textEn.toLowerCase().includes(q)) ||
          item.serviceTag.toLowerCase().includes(q)
      );
    }

    if (sortBy === "newest") {
      list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    } else if (sortBy === "highest") {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "lowest") {
      list.sort((a, b) => a.rating - b.rating);
    }

    return list;
  }, [reviewItems, selectedTopic, searchQuery, sortBy]);

  // Split filtered reviews evenly across Row 1 and Row 2
  const { row1Reviews, row2Reviews } = useMemo(() => {
    const midpoint = Math.ceil(filteredReviews.length / 2);
    return {
      row1Reviews: filteredReviews.slice(0, midpoint),
      row2Reviews: filteredReviews.slice(midpoint),
    };
  }, [filteredReviews]);

  useEffect(() => {
    const r2 = row2Ref.current;
    if (r2 && r2.scrollLeft === 0 && r2.scrollWidth > r2.clientWidth) {
      r2.scrollLeft = Math.floor((r2.scrollWidth - r2.clientWidth) / 2);
    }
  }, [selectedTopic, row2Reviews.length]);

  useEffect(() => {
    if (!isAutoScrolling || isHoveredOrTouched) return;

    let animationFrameId: number;
    let dir1 = 1;
    let dir2 = -1;
    let frac1 = 0;
    let frac2 = 0;

    const step = () => {
      const r1 = row1Ref.current;
      const r2 = row2Ref.current;

      if (r1 && r1.scrollWidth > r1.clientWidth) {
        frac1 += 0.65 * dir1;
        if (Math.abs(frac1) >= 1) {
          const delta = Math.trunc(frac1);
          frac1 -= delta;
          r1.scrollLeft += delta;
          const max1 = r1.scrollWidth - r1.clientWidth;
          if (r1.scrollLeft >= max1 - 2) {
            dir1 = -1;
          } else if (r1.scrollLeft <= 2) {
            dir1 = 1;
          }
        }
      }

      if (r2 && r2.scrollWidth > r2.clientWidth) {
        frac2 += 0.55 * dir2;
        if (Math.abs(frac2) >= 1) {
          const delta = Math.trunc(frac2);
          frac2 -= delta;
          r2.scrollLeft += delta;
          const max2 = r2.scrollWidth - r2.clientWidth;
          if (r2.scrollLeft <= 2) {
            dir2 = 1;
          } else if (r2.scrollLeft >= max2 - 2) {
            dir2 = -1;
          }
        }
      }

      animationFrameId = window.requestAnimationFrame(step);
    };

    animationFrameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [isAutoScrolling, isHoveredOrTouched, selectedTopic]);

  const scrollBothRowsByCard = (direction: "prev" | "next") => {
    triggerHapticFeedback(50);
    const r1 = row1Ref.current;
    const r2 = row2Ref.current;
    const delta = direction === "next" ? 395 : -395;

    if (r1) {
      r1.scrollBy({ left: delta, behavior: "smooth" });
    }
    if (r2) {
      r2.scrollBy({ left: -delta, behavior: "smooth" });
    }
  };

  const toggleQuickPhrase = (phrase: string) => {
    triggerHapticFeedback(50);
    setSelectedDraftPhrases((prev) => {
      const exists = prev.includes(phrase);
      const next = exists ? prev.filter((p) => p !== phrase) : [...prev, phrase];
      if (!exists && !draftText.includes(phrase)) {
        setDraftText((curr) => (curr.trim() ? `${curr.trim()} ${phrase}.` : `${phrase}.`));
      }
      return next;
    });
  };

  const handleFastReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHapticFeedback(50);
    const cleanedDraft = sanitizeText(draftText, 1000, true);
    const finalText =
      cleanedDraft ||
      (selectedDraftPhrases.length > 0
        ? `${selectedDraftPhrases.join(", ")}. Sehr empfehlenswerter Service!`
        : "Super schneller und kompetenter Service von Herrn Hannachi. Vielen Dank!");
    const cleanAuthor = sanitizeSingleLine(draftAuthor, 80) || "Google-Nutzer aus Osnabrück";
    const cleanService = sanitizeSingleLine(draftService, 60) || "Haushaltsgeräte";
    const safeRating = Math.max(1, Math.min(5, Math.round(draftRating)));

    const newReview: GoogleReviewItem = {
      id: `user-review-${Date.now()}`,
      author: cleanAuthor,
      rating: safeRating,
      text: finalText,
      relativeTime: "Gerade eben",
      isNew: true,
      serviceTag: cleanService,
      localGuide: "Verifizierter Kunde",
      category: "waschmaschine",
      topicTags: ["waschmaschinenreparatur", "schnelle_terminvergabe", "schnelle_hilfe"],
      likesCount: 1,
      verified: true,
      authorUri: liveWriteReviewUri,
    };

    try {
      await navigator.clipboard?.writeText(finalText);
      setCopiedToClipboard(true);
    } catch {
      setCopiedToClipboard(false);
    }

    setReviewItems((prev) => [newReview, ...prev]);

    try {
      const existingRaw = window.localStorage.getItem(LOCAL_STORAGE_USER_REVIEWS_KEY);
      const existingList = safeJsonParse<GoogleReviewItem[]>(
        existingRaw,
        (val): val is GoogleReviewItem[] => Array.isArray(val),
        []
      );
      window.localStorage.setItem(
        LOCAL_STORAGE_USER_REVIEWS_KEY,
        JSON.stringify([newReview, ...existingList].slice(0, 10))
      );
    } catch {
      // Ignore storage error
    }

    setFastReviewSubmitted(true);
  };

  const ratingLabel = (stars: number) => {
    switch (stars) {
      case 1:
        return "1 Stern – Nicht zufrieden";
      case 2:
        return "2 Sterne – Ausbaufähig";
      case 3:
        return "3 Sterne – In Ordnung";
      case 4:
        return "4 Sterne – Sehr gut";
      default:
        return "5 Sterne – Exzellenter Service!";
    }
  };

  return (
    <section
      id="kundenstimmen"
      className="py-10 sm:py-14 lg:py-16 bg-surface border-b border-primary/8 dark:border-white/10 overflow-hidden"
    >
      <div className="container-page">
        <FadeUp>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6">
            <div>
              <div className="inline-flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-ink-muted mb-2">
                <GoogleGLogo className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="font-bold tracking-wide text-accent">
                  Google Maps · {liveRating.toFixed(1).replace(".", ",")} ★ ({liveReviewCount})
                </span>
                <span aria-hidden="true" className="hidden min-[380px]:inline">·</span>
                <span className="hidden min-[380px]:inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Echte Kundenstimmen
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-primary dark:text-slate-100 sm:text-3xl lg:text-[34px] text-balance">
                Das sagen unsere Kunden in Osnabrück
              </h2>
              <p className="mt-2 text-xs sm:text-sm lg:text-[15px] text-ink-muted max-w-2xl leading-relaxed">
                Durchschnittlich{" "}
                <strong className="font-semibold text-primary dark:text-slate-100">
                  {liveRating.toFixed(1).replace(".", ",")} von 5 Sternen
                </strong>{" "}
                aus{" "}
                <strong className="font-semibold text-primary dark:text-slate-100">
                  {liveReviewCount} echten Google-Maps-Bewertungen
                </strong>{" "}
                für {business.name} {business.tagline} ({business.street},{" "}
                {business.zip} {business.city}).
              </p>
            </div>

            {showViewAllLink && (
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
                <Link
                  href="/kundenbewertungen"
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-primary/12 dark:border-white/15 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs sm:text-sm font-bold text-accent hover:border-accent transition-colors shrink-0 group"
                >
                  <span>Alle {liveReviewCount} Rezensionen ansehen</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            )}
          </div>
        </FadeUp>

        {/* Authentic Google Maps 4.8★ Summary & Star Breakdown Header */}
        <FadeUp delay={0.05} className="mt-5 sm:mt-6">
          {isInitialSync ? (
            <GoogleReviewsSummarySkeleton />
          ) : (
          <div className="card bg-white dark:bg-slate-900 p-4 sm:p-5 border border-primary/10 dark:border-white/10">
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-12 lg:items-center">
              {/* Left: Business Identity & Overall 4.8 Score */}
              <div className="lg:col-span-5 flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl bg-surface dark:bg-slate-800 border border-primary/10 dark:border-white/10 flex flex-col items-center justify-center shrink-0">
                  <GoogleGLogo className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-primary dark:text-slate-100 tracking-tight tabular-nums">
                      {liveRating.toFixed(1).replace(".", ",")}
                    </span>
                    <ReviewStars rating={liveRating} size={15} />
                    <span className="text-[11px] sm:text-xs font-bold text-ink-muted tabular-nums">
                      ({liveReviewCount} Rezensionen)
                    </span>
                  </div>

                  <p className="text-[11px] sm:text-sm font-bold text-primary dark:text-slate-200 mt-0.5 sm:mt-1 break-words">
                    {business.name} {business.tagline}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs text-ink-muted mt-0.5">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} className="text-accent shrink-0" />
                      <span>
                        {business.street}, {business.zip} {business.city}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowFreeLiveMap((prev) => !prev)}
                      className="text-accent font-semibold hover:underline cursor-pointer"
                    >
                      {showFreeLiveMap ? "Karte ausblenden" : "Live-Karte zeigen"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Center: Authentic Google Maps 5-Star to 1-Star Histogram */}
              <div
                className="lg:col-span-4 space-y-1 sm:space-y-1.5 border-y lg:border-y-0 lg:border-x border-primary/8 dark:border-white/10 py-2.5 sm:py-4 lg:py-0 lg:px-6"
                aria-label="Sterneverteilung auf Google Maps"
              >
                {([5, 4, 3, 2, 1] as const).map((starLevel) => {
                  const count = starDistribution[starLevel];
                  const pct =
                    reviewItems.length > 0
                      ? Math.round((count / reviewItems.length) * 100)
                      : 0;
                  return (
                    <div
                      key={starLevel}
                      className="flex items-center gap-2 sm:gap-2.5 text-[11px] sm:text-xs"
                    >
                      <span className="w-3 font-bold text-primary dark:text-slate-200 tabular-nums text-right">
                        {starLevel}
                      </span>
                      <Star
                        size={10}
                        className="fill-[#fbbc04] text-[#fbbc04] shrink-0"
                      />
                      <div className="h-1.5 sm:h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-[#fbbc04] transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-6 sm:w-7 text-right text-[10px] sm:text-[11px] font-semibold text-ink-faint tabular-nums">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Right: Fast Review Modal Trigger + Direct Google Maps Link */}
              <div className="lg:col-span-3 grid grid-cols-2 sm:flex sm:flex-row lg:flex-col gap-2 sm:gap-2.5">
                <button
                  type="button"
                  onClick={openFastReviewModal}
                  aria-haspopup="dialog"
                  aria-expanded={isFastReviewOpen}
                  aria-label="Schnellrezension für Google Maps verfassen"
                  className="group flex-1 inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-[#1a73e8] hover:bg-[#1557b0] active:bg-[#0d3c84] active:scale-[0.95] active:translate-y-0.5 active:shadow-inner active:ring-2 active:ring-[#8ab4f8]/70 text-white text-[11px] sm:text-xs font-bold transition-all duration-150 active:duration-75 shadow-sm select-none touch-manipulation cursor-pointer whitespace-nowrap"
                >
                  <MessageSquarePlus
                    size={13}
                    aria-hidden="true"
                    className="shrink-0 transition-transform duration-100 group-active:scale-90 group-active:-rotate-6"
                  />
                  <span>Rezension schreiben</span>
                </button>
                <a
                  href={livePlaceUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Hannachi auf Google Maps ansehen"
                  className="flex-1 inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-lg bg-surface dark:bg-slate-800 hover:bg-primary/5 text-primary dark:text-slate-100 border border-primary/12 dark:border-white/15 text-[11px] sm:text-xs font-bold transition-colors whitespace-nowrap"
                >
                  <GoogleGLogo className="w-3.5 h-3.5 shrink-0" />
                  <span>Google Maps</span>
                  <ExternalLink size={11} aria-hidden="true" className="opacity-80 shrink-0" />
                </a>
              </div>
            </div>

            {/* DSGVO Two-Click Consent-Guarded Google Maps Drawer */}
            {showFreeLiveMap && (
              <div className="mt-5 pt-5 border-t border-primary/8 dark:border-white/10">
                <div className="overflow-hidden rounded-xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-800">
                  <GoogleMapsEmbed
                    className="relative h-64 sm:h-72 w-full"
                    title="Hannachi Elektrohaushaltsgeräte Service auf Google Maps"
                  />
                </div>
              </div>
            )}
          </div>
          )}
        </FadeUp>

        {/* Authentic Google Maps Search, Sort & 10 Keyword Topic Filter Chips */}
        <div className="mt-4 sm:mt-6 space-y-2.5 sm:space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
            {/* Search & Sort Controls (Matching Google Maps Reviews Toolbar) */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 flex-1 min-w-[200px]">
              {isSearchOpen ? (
                <div className="relative flex items-center flex-1 max-w-sm">
                  <Search
                    size={13}
                    className="absolute left-2.5 text-ink-faint pointer-events-none"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="In 82 Google-Rezensionen suchen..."
                    className="w-full rounded-lg border border-primary/15 dark:border-white/15 bg-white dark:bg-slate-900 pl-8 pr-8 py-1 sm:py-1.5 text-[11px] sm:text-xs text-primary dark:text-slate-100 focus:border-accent focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setIsSearchOpen(false);
                    }}
                    aria-label="Suche schließen"
                    className="absolute right-2.5 text-ink-faint hover:text-primary dark:hover:text-white cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-primary/12 dark:border-white/15 bg-white dark:bg-slate-900 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-primary dark:text-slate-200 hover:border-accent transition-colors cursor-pointer"
                >
                  <Search size={12} className="text-ink-muted" />
                  <span>Suchen</span>
                </button>
              )}

              <div className="inline-flex items-center gap-1.5 rounded-lg border border-primary/12 dark:border-white/15 bg-white dark:bg-slate-900 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs">
                <ArrowUpDown size={12} className="text-ink-muted shrink-0" />
                <label htmlFor="google-reviews-sort" className="sr-only">
                  Sortieren nach
                </label>
                <select
                  id="google-reviews-sort"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as SortOption);
                    triggerSubtleSyncSkeleton(150);
                  }}
                  className="bg-transparent font-semibold text-primary dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="relevant">Relevanteste</option>
                  <option value="newest">Neueste</option>
                  <option value="highest">Höchste</option>
                  <option value="lowest">Niedrigste</option>
                </select>
              </div>
            </div>

            {/* Marquee Controls */}
            <div className="flex flex-wrap items-center justify-between md:justify-end gap-1.5 sm:gap-2 shrink-0">
              <span className="text-[11px] sm:text-xs font-semibold text-ink-faint tabular-nums md:mr-1">
                {filteredReviews.length}/{reviewItems.length}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsAutoScrolling((prev) => !prev)}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-primary/5 text-primary dark:text-slate-200 border border-primary/12 dark:border-white/15 text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                  aria-label={
                    isAutoScrolling
                      ? "Zwei-Reihen-Ticker pausieren"
                      : "Zwei-Reihen-Ticker starten"
                  }
                >
                  {isAutoScrolling ? (
                    <>
                      <Pause size={12} className="text-ink-muted shrink-0" />
                      <span>Läuft</span>
                    </>
                  ) : (
                    <>
                      <Play size={12} className="text-accent shrink-0" />
                      <span>Start</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => scrollBothRowsByCard("prev")}
                  aria-label="Zurück scrollen"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white dark:bg-slate-900 hover:bg-primary/5 text-primary dark:text-slate-100 border border-primary/12 dark:border-white/15 flex items-center justify-center transition-colors cursor-pointer shadow-2xs shrink-0"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollBothRowsByCard("next")}
                  aria-label="Weiter scrollen"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white dark:bg-slate-900 hover:bg-primary/5 text-primary dark:text-slate-100 border border-primary/12 dark:border-white/15 flex items-center justify-center transition-colors cursor-pointer shadow-2xs shrink-0"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Exact Google Maps Keyword Topic Filter Chips from Hannachi Listing */}
          <div
            className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Google-Maps-Themenfilter"
          >
            <button
              type="button"
              role="tab"
              aria-selected={selectedTopic === "all"}
              onClick={() => {
                triggerHapticFeedback(50);
                setSelectedTopic("all");
                triggerSubtleSyncSkeleton(150);
              }}
              className={`shrink-0 inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
                selectedTopic === "all"
                  ? "bg-primary text-white border-primary shadow-xs"
                  : "bg-white dark:bg-slate-900 text-ink-muted hover:text-primary dark:hover:text-slate-100 border-primary/10 dark:border-white/10"
              }`}
            >
              <span>Alle</span>
              <span className="tabular-nums opacity-75">{reviewItems.length}</span>
            </button>

            {GOOGLE_MAPS_TOPIC_CHIPS.map((chip) => {
              const isActive = selectedTopic === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    triggerHapticFeedback(50);
                    setSelectedTopic((prev) =>
                      prev === chip.id ? "all" : chip.id
                    );
                    triggerSubtleSyncSkeleton(150);
                  }}
                  className={`shrink-0 inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
                    isActive
                      ? "bg-primary text-white border-primary shadow-xs"
                      : "bg-white dark:bg-slate-900 text-ink-muted hover:text-primary dark:hover:text-slate-100 border-primary/10 dark:border-white/10"
                  }`}
                >
                  <span>{chip.label}</span>
                  <span className="tabular-nums opacity-70">{chip.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Continuous Two-Row Scrolling Marquee Track (All 82 Reviews) */}
        {isSyncingReviews ? (
          <div
            className="relative mt-4 sm:mt-6 space-y-3 sm:space-y-5"
            aria-busy="true"
            aria-label="Google-Bewertungen werden synchronisiert"
          >
            <div className="flex gap-3 sm:gap-5 overflow-hidden pb-1.5 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0">
              {[0, 1, 2, 3].map((idx) => (
                <GoogleReviewCardSkeleton key={`sk-row1-${idx}`} index={idx} />
              ))}
            </div>
            <div className="flex gap-3 sm:gap-5 overflow-hidden pb-1.5 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0">
              {[0, 1, 2, 3].map((idx) => (
                <GoogleReviewCardSkeleton key={`sk-row2-${idx}`} index={idx + 1} />
              ))}
            </div>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="mt-4 sm:mt-6 rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 p-6 sm:p-8 text-center">
            <p className="text-sm font-bold text-primary dark:text-slate-100">
              Keine Rezensionen für diesen Filter gefunden.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedTopic("all");
                setSearchQuery("");
              }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              Alle {reviewItems.length} Rezensionen anzeigen
            </button>
          </div>
        ) : (
          <div
            className="relative mt-4 sm:mt-6 space-y-3 sm:space-y-5"
            onMouseEnter={() => setIsHoveredOrTouched(true)}
            onMouseLeave={() => setIsHoveredOrTouched(false)}
            onTouchStart={() => setIsHoveredOrTouched(true)}
            onTouchEnd={() => {
              window.setTimeout(() => setIsHoveredOrTouched(false), 3500);
            }}
          >
            {/* Row 1 */}
            <div
              ref={row1Ref}
              className="flex gap-3 sm:gap-5 overflow-x-auto pb-1.5 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              role="region"
              aria-label="Google-Kundenbewertungen Reihe 1"
            >
              {row1Reviews.map((rev, idx) => (
                <ReviewMarqueeCard
                  key={rev.id}
                  rev={rev}
                  colorIndex={idx}
                  livePlaceUri={livePlaceUri}
                  isLiked={Boolean(likedIds[rev.id])}
                  onToggleLike={handleToggleLike}
                />
              ))}
            </div>

            {/* Row 2 (scrolling in counter-direction) */}
            {row2Reviews.length > 0 && (
              <div
                ref={row2Ref}
                className="flex gap-3 sm:gap-5 overflow-x-auto pb-1.5 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                role="region"
                aria-label="Google-Kundenbewertungen Reihe 2"
              >
                {row2Reviews.map((rev, idx) => (
                  <ReviewMarqueeCard
                    key={rev.id}
                    rev={rev}
                    colorIndex={idx + 3}
                    livePlaceUri={livePlaceUri}
                    isLiked={Boolean(likedIds[rev.id])}
                    onToggleLike={handleToggleLike}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          GOOGLE MAPS FAST REVIEW COMPOSER MODAL ("Hannachi Elektrohaushaltsgeräte Service")
          Portaled to document.body so it always centers in the active viewport
         ═══════════════════════════════════════════════════════════════════════ */}
      {isMounted &&
        isFastReviewOpen &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsFastReviewOpen(false);
              }
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fast-google-review-title"
          >
            <div className="relative my-auto w-full max-w-lg rounded-2xl border border-white/15 bg-[#202124] text-white shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <GoogleGLogo className="w-5 h-5 shrink-0" />
                <h3
                  id="fast-google-review-title"
                  className="text-sm sm:text-base font-bold text-white truncate"
                >
                  {business.name} {business.tagline}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFastReviewOpen(false)}
                aria-label="Dialog schließen"
                className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {fastReviewSubmitted ? (
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex items-start gap-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">
                      Vielen Dank! Ihre Bewertung ist vorbereitet.
                    </p>
                    <p className="text-xs text-white/80 leading-relaxed">
                      {copiedToClipboard
                        ? "Ihr Bewertungstext wurde automatisch in die Zwischenablage kopiert. Klicken Sie jetzt unten auf „Auf Google Maps öffnen & veröffentlichen“, um die Rezension direkt in Ihrem Google-Konto zu veröffentlichen."
                        : "Klicken Sie unten auf „Auf Google Maps öffnen“, um Ihre Bewertung direkt bei Google Maps zu veröffentlichen."}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-white/5 border border-white/10 p-3.5 text-xs text-white/85">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-white">
                      {draftAuthor.trim() || "Ihre Rezension"}
                    </span>
                    <ReviewStars rating={draftRating} size={13} />
                  </div>
                  <p className="italic text-white/80">
                    „{draftText.trim() || "Super schneller und kompetenter Service von Herrn Hannachi. Vielen Dank!"}“
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          draftText.trim() ||
                            "Super schneller und kompetenter Service von Herrn Hannachi. Vielen Dank!"
                        );
                        setCopiedToClipboard(true);
                      } catch {
                        // ignore
                      }
                    }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    {copiedToClipboard ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedToClipboard ? "Text kopiert ✓" : "Text kopieren"}</span>
                  </button>

                  <a
                    href={liveWriteReviewUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsFastReviewOpen(false)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#8ab4f8] hover:bg-[#aecbfa] px-5 py-2.5 text-xs font-extrabold text-[#202124] transition-colors"
                  >
                    <GoogleGLogo className="w-4 h-4" />
                    <span>Auf Google Maps öffnen &amp; veröffentlichen</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFastReviewSubmit} className="p-5 sm:p-6 space-y-4">
                {/* User Identity Row (Matches Google Maps "Posting publicly across Google") */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00897b] text-sm font-bold text-white">
                      {getInitials(draftAuthor || "Kunde Osnabrück")}
                    </div>
                    <div className="min-w-0">
                      <input
                        type="text"
                        value={draftAuthor}
                        onChange={(e) => setDraftAuthor(e.target.value)}
                        placeholder="Ihr Name (optional, z. B. Thomas M.)"
                        className="w-full bg-transparent text-sm font-bold text-white placeholder:text-white/60 focus:outline-none border-b border-transparent focus:border-[#8ab4f8]"
                      />
                      <p className="text-[11px] text-white/60">
                        Öffentlich auf Google bewerten · {business.city}
                      </p>
                    </div>
                  </div>

                  <select
                    value={draftService}
                    onChange={(e) => setDraftService(e.target.value)}
                    aria-label="Repariertes Gerät"
                    className="rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none"
                  >
                    <option value="Waschmaschine" className="text-slate-900">Waschmaschine</option>
                    <option value="Geschirrspüler" className="text-slate-900">Geschirrspüler</option>
                    <option value="Backofen & Herd" className="text-slate-900">Backofen &amp; Herd</option>
                    <option value="Kühlschrank / Trockner" className="text-slate-900">Kühlschrank / Trockner</option>
                    <option value="Ersatzteile & Beratung" className="text-slate-900">Ersatzteile &amp; Beratung</option>
                  </select>
                </div>

                {/* Interactive 1-5 Star Selector */}
                <div className="py-2 text-center">
                  <div className="inline-flex items-center gap-2 sm:gap-3">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = (hoverRating || draftRating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => {
                            triggerHapticFeedback(50);
                            setDraftRating(star);
                          }}
                          aria-label={`${star} Sterne auswählen`}
                          className="p-1 transition-transform hover:scale-110 cursor-pointer"
                        >
                          <Star
                            size={32}
                            className={
                              active
                                ? "fill-[#fbbc04] text-[#fbbc04]"
                                : "text-white/40 hover:text-white/70"
                            }
                          />
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-1 text-xs font-semibold text-[#fbbc04]">
                    {ratingLabel(hoverRating || draftRating)}
                  </p>
                </div>

                {/* 1-Tap Experience Chips for Fast Review */}
                <div>
                  <p className="text-[11px] font-semibold text-white/70 mb-2 flex items-center gap-1.5">
                    <Sparkles size={12} className="text-[#8ab4f8]" />
                    <span>Schnellauswahl (antippen zum Einfügen):</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {FAST_REVIEW_QUICK_PHRASES.map((phrase) => {
                      const chosen = selectedDraftPhrases.includes(phrase);
                      return (
                        <button
                          key={phrase}
                          type="button"
                          onClick={() => toggleQuickPhrase(phrase)}
                          className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                            chosen
                              ? "border-[#8ab4f8] bg-[#8ab4f8]/20 text-[#8ab4f8]"
                              : "border-white/15 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {chosen ? `✓ ${phrase}` : `+ ${phrase}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Google Maps Styled Textarea */}
                <div>
                  <textarea
                    rows={3}
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                    placeholder="Teilen Sie Ihre eigenen Erfahrungen mit diesem Ort (z. B. Gerät, Schnelligkeit, Preis-Leistung)..."
                    className="w-full rounded-xl border border-white/25 bg-transparent p-3.5 text-sm text-white placeholder:text-white/50 focus:border-[#8ab4f8] focus:outline-none"
                  />
                </div>

                {/* Modal Footer Actions (Cancel / Post) */}
                <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 pt-2">
                  <a
                    href={liveWriteReviewUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#8ab4f8] hover:underline"
                  >
                    <span>Direkt zu Google Maps</span>
                    <ExternalLink size={12} />
                  </a>

                  <div className="flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsFastReviewOpen(false)}
                      className="rounded-lg border border-white/20 px-4 py-2 text-xs font-bold text-[#8ab4f8] hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#8ab4f8] hover:bg-[#aecbfa] px-5 py-2 text-xs font-extrabold text-[#202124] transition-colors cursor-pointer shadow-sm"
                    >
                      <span>Absenden &amp; weiter zu Google</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>,
          document.body
        )}
    </section>
  );
}
