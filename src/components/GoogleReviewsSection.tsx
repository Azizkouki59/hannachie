"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import {
  Star,
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
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
  Clock,
  Phone,
  RefreshCw,
} from "lucide-react";
import { business } from "@/data/site";
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
import GoogleMapsEmbed from "@/components/GoogleMapsEmbed";
import { safeJsonParse, sanitizeSingleLine, sanitizeText } from "@/utils/sanitize";
import { FadeUp } from "./animations";

interface GoogleReviewItem extends DetailedGoogleReview {
  authorUri?: string;
  authorPhotoUri?: string;
  publishTime?: string;
  originalText?: string;
  originalLanguage?: string;
  textLanguage?: string;
  googleMapsUri?: string;
  flagContentUri?: string;
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

const TOPIC_MATCHERS: Array<{ key: GoogleMapsTopicKey; pattern: RegExp }> = [
  {
    key: "waschmaschinenreparatur",
    pattern: /waschmaschine|trommel|schleuder|lauge|abpump|flusensieb/i,
  },
  {
    key: "schnelle_terminvergabe",
    pattern: /termin|nächsten tag|sofort|heute|morgen|kurzfristig/i,
  },
  {
    key: "schnelle_hilfe",
    pattern: /schnell.*hilfe|geholfen|notfall|gerettet|sofort/i,
  },
  {
    key: "ersatzteile",
    pattern: /ersatzteil|dichtung|pumpe|heizstab|riemen|türgriff|schalter|lager|teil/i,
  },
  {
    key: "schnelle_problemloesung",
    pattern: /problem|fehler|ursache|behoben|läuft wieder|funktioniert wieder/i,
  },
  {
    key: "telefonische_beratung",
    pattern: /telefon|anruf|rückruf|whatsapp/i,
  },
  {
    key: "ehrliche_beratung",
    pattern: /ehrlich|fair|beratung|beraten|empfehlung|transparen/i,
  },
  {
    key: "schnelle_reparatur",
    pattern: /reparatur|repariert|instand/i,
  },
  {
    key: "kompetente_reparatur",
    pattern: /kompetent|fachmann|profi|meister|erfahrung|sauber/i,
  },
  {
    key: "schnelle_abwicklung",
    pattern: /abwicklung|unkompliziert|reibungslos|pünktlich|zuverlässig/i,
  },
];

function inferReviewTopics(text: string): GoogleMapsTopicKey[] {
  if (!text) return [];
  const tags: GoogleMapsTopicKey[] = [];
  for (const { key, pattern } of TOPIC_MATCHERS) {
    if (pattern.test(text)) {
      tags.push(key);
    }
  }
  return tags;
}

function normalizeReviewKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function getReviewTimestampMs(rev: GoogleReviewItem): number {
  if (rev.publishTime) {
    const parsed = Date.parse(rev.publishTime);
    if (!Number.isNaN(parsed)) return parsed;
  }
  const rel = (rev.relativeTime || "").toLowerCase();
  if (!rel) return 0;
  const now = Date.now();
  if (rel.includes("gerade eben") || rel.includes("just now")) return now;
  if (rel.includes("gestern") || rel.includes("yesterday")) return now - 86_400_000;

  const numMatch = rel.match(/(\d+)/);
  const count = numMatch ? Number.parseInt(numMatch[1], 10) : 1;

  if (/minute/.test(rel)) return now - count * 60_000;
  if (/stunde|hour/.test(rel)) return now - count * 3_600_000;
  if (/tag|day/.test(rel)) return now - count * 86_400_000;
  if (/woche|week/.test(rel)) return now - count * 7 * 86_400_000;
  if (/monat|month/.test(rel)) return now - count * 30 * 86_400_000;
  if (/jahr|year/.test(rel)) return now - count * 365 * 86_400_000;
  return 0;
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
      role="img"
      aria-label={`${rating} von 5 Sternen`}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= rounded;
        return (
          <Star
            key={i}
            size={size}
            aria-hidden="true"
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
  isDecorativeClone = false,
}: {
  rev: GoogleReviewItem;
  colorIndex: number;
  livePlaceUri: string;
  isLiked: boolean;
  onToggleLike: (id: string) => void;
  isDecorativeClone?: boolean;
}) {
  const avatarColor = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];
  const [showAltTranslation, setShowAltTranslation] = useState(false);
  const [sharedCopied, setSharedCopied] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const hasOriginalAlt = Boolean(
    rev.originalText &&
      rev.originalText.trim() &&
      rev.originalText.trim() !== rev.text.trim()
  );
  const hasTranslationToggle = Boolean(rev.textEn || hasOriginalAlt);
  const displayedBody =
    showAltTranslation && hasOriginalAlt
      ? rev.originalText!
      : showAltTranslation && rev.textEn
      ? rev.textEn
      : rev.text;

  const likeTotal = (rev.likesCount ?? 0) + (isLiked ? 1 : 0);
  const reviewDeepLink = rev.googleMapsUri || rev.authorUri || livePlaceUri;
  const authorRole = rev.localGuide
    ? rev.localGuide
    : rev.isLiveFromApi
    ? "Verifizierte Google-Rezension"
    : "Google-Nutzer";
  const cardAriaLabel = [
    `Google-Bewertung von ${rev.author}`,
    authorRole,
    `${rev.rating} von 5 Sternen`,
    rev.relativeTime || undefined,
    rev.serviceTag && !rev.isLiveFromApi ? rev.serviceTag : undefined,
  ]
    .filter(Boolean)
    .join(", ");

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
      role="article"
      aria-label={cardAriaLabel}
      aria-hidden={isDecorativeClone || undefined}
      className="card shrink-0 w-[clamp(264px,78vw,356px)] flex flex-col justify-between p-4 sm:p-5 bg-white dark:bg-slate-900 border border-primary/10 dark:border-white/10 hover:border-accent/40 transition-colors duration-200"
    >
      <div>
        {/* Authentic Google Maps Reviewer Header */}
        <div className="flex items-start justify-between gap-2.5 sm:gap-3 mb-2 sm:mb-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div
              className={`relative flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center overflow-hidden rounded-full ${avatarColor} text-[11px] sm:text-xs font-bold text-white shadow-xs`}
              aria-hidden="true"
            >
              {rev.authorPhotoUri && !avatarError ? (
                <img
                  src={rev.authorPhotoUri}
                  alt={rev.author}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitials(rev.author)
              )}
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
                {rev.authorUri ? (
                  <a
                    href={rev.authorUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    tabIndex={isDecorativeClone ? -1 : undefined}
                    aria-label={`Google-Profil von ${rev.author} öffnen`}
                    className="text-xs sm:text-sm font-bold text-primary dark:text-slate-100 hover:text-accent truncate transition-colors"
                  >
                    {rev.author}
                  </a>
                ) : (
                  <p className="text-xs sm:text-sm font-bold text-primary dark:text-slate-100 truncate">
                    {rev.author}
                  </p>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] text-ink-faint truncate">
                {rev.localGuide
                  ? `${rev.localGuide}`
                  : rev.isLiveFromApi
                  ? "Verifizierte Google-Rezension"
                  : "Google-Nutzer · Rezension"}
              </p>
            </div>
          </div>

          <a
            href={reviewDeepLink}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={isDecorativeClone ? -1 : undefined}
            title="Auf Google Maps ansehen"
            aria-label={`Rezension von ${rev.author} (${rev.rating} von 5 Sternen) auf Google Maps ansehen`}
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
          {rev.serviceTag && !rev.isLiveFromApi && (
            <span className="text-[10px] sm:text-[11px] font-semibold text-ink-muted">
              {rev.serviceTag}
            </span>
          )}
        </div>

        {/* Review Text */}
        <blockquote className="text-xs sm:text-[13.5px] leading-relaxed text-primary/90 dark:text-slate-200 line-clamp-5">
          {displayedBody || "Bewertung ohne Textkommentar."}
        </blockquote>

        {/* Bilingual / Original Language Toggle */}
        {hasTranslationToggle && (
          <div className="mt-1.5 sm:mt-2 flex items-center gap-1.5 text-[10px] sm:text-[11px] text-ink-faint">
            <Languages size={11} className="text-accent shrink-0" />
            <span>
              {hasOriginalAlt
                ? showAltTranslation
                  ? `Original (${(rev.originalLanguage || "").toUpperCase()})`
                  : "Übersetzt von Google (DE)"
                : showAltTranslation
                ? "Übersetzt von Google"
                : "Original (DE)"}
            </span>
            <span>·</span>
            <button
              type="button"
              tabIndex={isDecorativeClone ? -1 : undefined}
              aria-pressed={showAltTranslation}
              aria-label={`Sprache der Bewertung von ${rev.author} umschalten`}
              onClick={() => setShowAltTranslation((prev) => !prev)}
              className="inline-flex min-h-[36px] items-center px-1.5 -mx-1.5 rounded-md font-semibold text-accent hover:underline cursor-pointer"
            >
              {hasOriginalAlt
                ? showAltTranslation
                  ? "Übersetzung (DE)"
                  : "Original ansehen"
                : showAltTranslation
                ? "Original ansehen"
                : "Englisch"}
            </button>
          </div>
        )}

        {/* Owner Reply from Kamal Hannachi (when present) */}
        {rev.ownerReply && (
          <div
            aria-label="Antwort vom Inhaber Kamal Hannachi"
            className="mt-2.5 sm:mt-3 rounded-xl bg-surface dark:bg-slate-800/80 border border-primary/8 dark:border-white/10 px-3 py-2 text-[11px] sm:text-xs"
          >
            <p className="flex items-center gap-1.5 font-bold text-primary dark:text-slate-200 mb-0.5">
              <CornerDownRight size={11} aria-hidden="true" className="text-accent shrink-0" />
              <span>Antwort · Kamal Hannachi</span>
            </p>
            <p className="text-ink-muted leading-snug line-clamp-2">{rev.ownerReply}</p>
          </div>
        )}
      </div>

      {/* Google Maps Card Footer: Like ("Hilfreich"), Share ("Teilen"), & Direct Maps Link */}
      <figcaption className="mt-2 sm:mt-3.5 flex items-center justify-between gap-2 pt-1.5 sm:pt-2.5 border-t border-primary/8 dark:border-white/10 text-[10.5px] sm:text-[11px]">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            tabIndex={isDecorativeClone ? -1 : undefined}
            onClick={() => onToggleLike(rev.id)}
            aria-label={`Rezension von ${rev.author} als hilfreich markieren (${likeTotal})`}
            className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-1.5 -ml-1.5 font-semibold transition-colors cursor-pointer ${
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
            tabIndex={isDecorativeClone ? -1 : undefined}
            onClick={handleShare}
            aria-label={`Rezension von ${rev.author} kopieren und teilen`}
            className="inline-flex min-h-[36px] items-center gap-1 rounded-lg px-1.5 font-semibold text-ink-muted hover:text-primary dark:hover:text-slate-200 transition-colors cursor-pointer"
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
          href={rev.googleMapsUri || livePlaceUri}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={isDecorativeClone ? -1 : undefined}
          aria-label={`Bewertung von ${rev.author} auf Google Maps öffnen`}
          className="inline-flex min-h-[36px] items-center gap-1 rounded-lg px-1.5 -mr-1.5 text-ink-faint hover:text-accent font-semibold transition-colors shrink-0"
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
  const prefersReducedMotion = useReducedMotion();
  const row1Ref = useRef<HTMLDivElement | null>(null);
  const scrollPosRef = useRef<number>(0);
  const halfWidthRef = useRef<number>(0);
  const resumeTimerRef = useRef<number | null>(null);
  const [isHoveredOrTouched, setIsHoveredOrTouched] = useState(false);

  // Google Maps Topic Filter, Search & Sort State
  const [selectedTopic, setSelectedTopic] = useState<"all" | GoogleMapsTopicKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("relevant");

  const {
    place,
    isLoading: isPlaceLoading,
    isRefreshing,
    source,
    ratingFormatted,
    refresh,
  } = useGoogleLivePlace();

  // Live Google Maps URIs & Live Map Preview Toggle
  const [showFreeLiveMap, setShowFreeLiveMap] = useState(false);
  const [showAllHours, setShowAllHours] = useState(false);
  const livePlaceUri = place.reviewsUri || place.googleMapsUri || business.mapsReviewsUrl;
  const liveWriteReviewUri = place.writeAReviewUri || business.mapsWriteReviewUrl;

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

  // Liked review IDs & user-submitted local drafts
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});
  const [userDraftReviews, setUserDraftReviews] = useState<GoogleReviewItem[]>([]);
  const [isFilteringSync, setIsFilteringSync] = useState<boolean>(false);
  const syncTimerRef = useRef<number | null>(null);

  const fallbackReviews: GoogleReviewItem[] = useMemo(
    () =>
      googleReviews82.map((rev) => ({
        ...rev,
        authorPhotoUri: rev.authorPhotoUri,
        authorUri: business.mapsReviewsUrl || business.mapsUrl,
      })),
    []
  );

  const liveApiReviews: GoogleReviewItem[] = useMemo(() => {
    if (source !== "live" || place.reviews.length === 0) return [];
    return place.reviews.map((rev) => {
      const combinedText = `${rev.text || ""} ${rev.originalText || ""}`.trim();
      return {
        id: rev.id,
        author: rev.author,
        authorUri: rev.authorUri || livePlaceUri,
        authorPhotoUri: rev.authorPhotoUri,
        rating: rev.rating,
        text: rev.text,
        originalText: rev.originalText,
        originalLanguage: rev.originalLanguage,
        textLanguage: rev.textLanguage,
        relativeTime: rev.relativeTime || "Auf Google Maps",
        publishTime: rev.publishTime,
        googleMapsUri: rev.googleMapsUri || livePlaceUri,
        flagContentUri: rev.flagContentUri,
        serviceTag: "Google Maps",
        category: "waschmaschine",
        topicTags: inferReviewTopics(combinedText),
        verified: true,
        isLiveFromApi: true,
      };
    });
  }, [source, place.reviews, livePlaceUri]);

  const hasLiveReviews = source === "live" && liveApiReviews.length > 0;

  const reviewItems: GoogleReviewItem[] = useMemo(() => {
    let base: GoogleReviewItem[];
    if (hasLiveReviews) {
      const liveAuthors = new Set(
        liveApiReviews.map((r) => normalizeReviewKey(r.author))
      );
      const liveTextPrefixes = new Set(
        liveApiReviews
          .map((r) => normalizeReviewKey(r.text).slice(0, 48))
          .filter((t) => t.length >= 16)
      );
      const remainingArchive = fallbackReviews.filter((rev) => {
        if (liveAuthors.has(normalizeReviewKey(rev.author))) return false;
        const prefix = normalizeReviewKey(rev.text).slice(0, 48);
        if (prefix.length >= 16 && liveTextPrefixes.has(prefix)) return false;
        return true;
      });
      base = [...liveApiReviews, ...remainingArchive];
    } else {
      base = fallbackReviews;
    }

    if (userDraftReviews.length === 0) return base;
    const existingIds = new Set(base.map((r) => r.id));
    const uniqueDrafts = userDraftReviews.filter((r) => !existingIds.has(r.id));
    return [...uniqueDrafts, ...base];
  }, [hasLiveReviews, liveApiReviews, fallbackReviews, userDraftReviews]);

  const dynamicTopicChips = useMemo(() => {
    const counts = new Map<GoogleMapsTopicKey, number>();
    for (const item of reviewItems) {
      const tags = item.topicTags && item.topicTags.length > 0
        ? item.topicTags
        : inferReviewTopics(`${item.text} ${item.originalText || ""}`);
      for (const tag of tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return GOOGLE_MAPS_TOPIC_CHIPS.map((chip) => ({
      ...chip,
      liveCount: counts.get(chip.id) ?? 0,
    })).filter((chip) => chip.liveCount > 0);
  }, [reviewItems]);

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

  // Hydrate user-submitted fast reviews and likes from localStorage
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
          setUserDraftReviews(sanitizedReviews);
        }
      }
    } catch {
      // Ignore localStorage errors
    }

    return () => {
      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current);
      }
    };
  }, []);

  const isSyncingReviews = isPlaceLoading || isFilteringSync;

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

  // Live Google Place aggregate rating & total review count
  const { starDistribution, liveRating, liveReviewCount } = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const item of reviewItems) {
      const r = Math.max(1, Math.min(5, Math.round(item.rating))) as
        | 1
        | 2
        | 3
        | 4
        | 5;
      counts[r] += 1;
    }
    return {
      starDistribution: counts,
      liveRating: place.rating,
      liveReviewCount: place.userRatingCount,
    };
  }, [reviewItems, place.rating, place.userRatingCount]);

  // Filter & Sort Reviews based on Topic Chip, Search Query, and Sort Option
  const filteredReviews = useMemo(() => {
    let list = [...reviewItems];

    if (selectedTopic !== "all") {
      list = list.filter((item) => {
        const tags =
          item.topicTags && item.topicTags.length > 0
            ? item.topicTags
            : inferReviewTopics(`${item.text} ${item.originalText || ""}`);
        return tags.includes(selectedTopic);
      });
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (item) =>
          item.author.toLowerCase().includes(q) ||
          item.text.toLowerCase().includes(q) ||
          (item.originalText && item.originalText.toLowerCase().includes(q)) ||
          (item.textEn && item.textEn.toLowerCase().includes(q)) ||
          item.serviceTag.toLowerCase().includes(q)
      );
    }

    if (sortBy === "newest") {
      list.sort((a, b) => getReviewTimestampMs(b) - getReviewTimestampMs(a));
    } else if (sortBy === "highest") {
      list.sort(
        (a, b) =>
          b.rating - a.rating ||
          getReviewTimestampMs(b) - getReviewTimestampMs(a)
      );
    } else if (sortBy === "lowest") {
      list.sort(
        (a, b) =>
          a.rating - b.rating ||
          getReviewTimestampMs(b) - getReviewTimestampMs(a)
      );
    }

    return list;
  }, [reviewItems, selectedTopic, searchQuery, sortBy]);

  // Build a seamless loop base wide enough for any screen size (phones to 4K monitors)
  const shouldLoop = filteredReviews.length > 1;
  const loopBase = useMemo(() => {
    if (filteredReviews.length <= 1) return filteredReviews;
    if (filteredReviews.length >= 6) return filteredReviews;
    const repeated: GoogleReviewItem[] = [];
    while (repeated.length < 6) {
      repeated.push(...filteredReviews);
    }
    return repeated;
  }, [filteredReviews]);

  const carouselItems = useMemo(() => {
    if (!shouldLoop) return loopBase;
    return [...loopBase, ...loopBase];
  }, [shouldLoop, loopBase]);

  // Pause continuous scroll briefly when the user swipes, scrolls, or taps arrows
  const pauseAutoBriefly = (durationMs = 4500) => {
    setIsHoveredOrTouched(true);
    if (resumeTimerRef.current) {
      window.clearTimeout(resumeTimerRef.current);
    }
    resumeTimerRef.current = window.setTimeout(() => {
      setIsHoveredOrTouched(false);
      resumeTimerRef.current = null;
    }, durationMs);
  };

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) {
        window.clearTimeout(resumeTimerRef.current);
      }
    };
  }, []);

  // Reset scroll position cleanly when filters/sort change
  useEffect(() => {
    scrollPosRef.current = 0;
    const container = row1Ref.current;
    if (container) {
      container.scrollTo({ left: 0, behavior: "auto" });
    }
  }, [selectedTopic, sortBy, searchQuery]);

  // Measure exact pixel distance of one full loop set whenever layout/viewport resizes
  useEffect(() => {
    if (isSyncingReviews || !shouldLoop) {
      halfWidthRef.current = 0;
      return;
    }
    const container = row1Ref.current;
    if (!container) return;

    const measureHalfWidth = () => {
      const cards = container.querySelectorAll<HTMLElement>("[data-review-card]");
      if (cards.length > loopBase.length && loopBase.length > 0) {
        const firstLeft = cards[0].getBoundingClientRect().left;
        const secondSetLeft = cards[loopBase.length].getBoundingClientRect().left;
        const exactHalf = secondSetLeft - firstLeft;
        if (exactHalf > 0) {
          halfWidthRef.current = exactHalf;
          return;
        }
      }
      halfWidthRef.current = container.scrollWidth / 2;
    };

    measureHalfWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measureHalfWidth);
      return () => window.removeEventListener("resize", measureHalfWidth);
    }

    const observer = new ResizeObserver(measureHalfWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, [isSyncingReviews, shouldLoop, loopBase.length, carouselItems.length]);

  // Measure rendered card + gap width for prev/next arrow stepping
  const getCarouselStepSize = (container: HTMLDivElement): number => {
    const firstCard = container.querySelector<HTMLElement>("[data-review-card]");
    if (!firstCard) return Math.max(264, container.clientWidth * 0.78);
    const styles = window.getComputedStyle(container);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "12") || 12;
    return firstCard.getBoundingClientRect().width + gap;
  };

  // Simple, calm, continuous requestAnimationFrame horizontal scroll
  useEffect(() => {
    if (
      isHoveredOrTouched ||
      prefersReducedMotion ||
      isFastReviewOpen ||
      isSyncingReviews ||
      !shouldLoop
    ) {
      return;
    }

    const container = row1Ref.current;
    if (!container) return;

    let rafId = 0;
    let lastTime = performance.now();

    // Sync float accumulator cleanly from current scroll position (preserving manual swipes)
    const halfStart = halfWidthRef.current;
    let currentPos = container.scrollLeft;
    if (halfStart > 0 && currentPos >= halfStart) {
      currentPos = currentPos % halfStart;
      container.scrollLeft = currentPos;
    }
    scrollPosRef.current = currentPos;

    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
      lastTime = now;

      const halfWidth = halfWidthRef.current;
      if (halfWidth > 0) {
        const speedPxPerSec = window.innerWidth < 640 ? 36 : 44;
        scrollPosRef.current += speedPxPerSec * dt;
        if (scrollPosRef.current >= halfWidth) {
          scrollPosRef.current -= halfWidth;
        }
        container.scrollLeft = scrollPosRef.current;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [
    isHoveredOrTouched,
    prefersReducedMotion,
    isFastReviewOpen,
    isSyncingReviews,
    shouldLoop,
  ]);

  const scrollRowByCard = (direction: "prev" | "next") => {
    triggerHapticFeedback(50);
    pauseAutoBriefly(4500);
    const container = row1Ref.current;
    if (!container) return;

    const step = getCarouselStepSize(container);
    const halfWidth = halfWidthRef.current || container.scrollWidth / 2;
    const behavior = prefersReducedMotion ? "auto" : "smooth";

    if (direction === "next") {
      if (shouldLoop && halfWidth > 0 && container.scrollLeft >= halfWidth - 10) {
        container.scrollTo({ left: container.scrollLeft - halfWidth, behavior: "auto" });
      }
      container.scrollBy({ left: step, behavior });
    } else {
      if (shouldLoop && halfWidth > 0 && container.scrollLeft <= step) {
        container.scrollTo({ left: container.scrollLeft + halfWidth, behavior: "auto" });
      }
      container.scrollBy({ left: -step, behavior });
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

    setUserDraftReviews((prev) => [newReview, ...prev]);

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
      className="py-10 sm:py-16 lg:py-20 bg-surface border-b border-primary/8 dark:border-white/10 overflow-hidden"
    >
      <div className="container-page">
        <FadeUp>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6">
            <div>
              <div className="inline-flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-ink-muted mb-2">
                <GoogleGLogo className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="font-bold tracking-wide text-accent">
                  Google Maps · {ratingFormatted} ★ ({liveReviewCount})
                </span>
                <span aria-hidden="true" className="hidden min-[380px]:inline">·</span>
                <span className="hidden min-[380px]:inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 dark:text-emerald-400" />
                  {source === "live" ? "Live-Daten von Google Places" : "Echte Kundenstimmen"}
                </span>
                {source === "live" && (
                  <button
                    type="button"
                    onClick={() => void refresh(true)}
                    disabled={isRefreshing}
                    aria-label="Google-Daten live aktualisieren"
                    className="inline-flex items-center gap-1 rounded-md border border-primary/10 dark:border-white/15 bg-white dark:bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-ink-muted hover:text-accent transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={10} className={isRefreshing ? "animate-spin" : ""} aria-hidden="true" />
                    <span>{isRefreshing ? "Lädt…" : "Aktualisieren"}</span>
                  </button>
                )}
              </div>
              <h2 className="text-2xl font-extrabold text-primary dark:text-slate-100 sm:text-3xl lg:text-[34px] text-balance">
                Das sagen unsere Kunden in {business.city}
              </h2>
              <p className="mt-2 text-xs sm:text-sm lg:text-[15px] text-ink-muted max-w-2xl leading-relaxed">
                Durchschnittlich{" "}
                <strong className="font-semibold text-primary dark:text-slate-100">
                  {ratingFormatted} von 5 Sternen
                </strong>{" "}
                aus{" "}
                <strong className="font-semibold text-primary dark:text-slate-100">
                  {liveReviewCount} Google-Maps-Bewertungen
                </strong>{" "}
                für {place.displayName} ({place.shortFormattedAddress}).
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

        {/* Live Google Maps Summary & Place Details Header */}
        <FadeUp delay={0.05} className="mt-5 sm:mt-6">
          {isPlaceLoading ? (
            <GoogleReviewsSummarySkeleton />
          ) : (
          <div className="card bg-white dark:bg-slate-900 p-4 sm:p-5 border border-primary/10 dark:border-white/10">
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-12 lg:items-center">
              {/* Left: Live Business Identity & Score */}
              <div className="lg:col-span-5 flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl bg-surface dark:bg-slate-800 border border-primary/10 dark:border-white/10 flex flex-col items-center justify-center shrink-0">
                  <GoogleGLogo className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-primary dark:text-slate-100 tracking-tight tabular-nums">
                      {ratingFormatted}
                    </span>
                    <ReviewStars rating={liveRating} size={15} />
                    <span className="text-[11px] sm:text-xs font-bold text-ink-muted tabular-nums">
                      ({liveReviewCount} Rezensionen)
                    </span>
                  </div>

                  <p className="text-[11px] sm:text-sm font-bold text-primary dark:text-slate-200 mt-0.5 sm:mt-1 break-words">
                    {place.displayName}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs text-ink-muted mt-0.5">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} className="text-accent shrink-0" />
                      <span>{place.shortFormattedAddress}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowFreeLiveMap((prev) => !prev)}
                      aria-expanded={showFreeLiveMap}
                      className="inline-flex min-h-[36px] sm:min-h-0 items-center px-1.5 -mx-1.5 py-1 rounded-md text-accent font-semibold hover:underline cursor-pointer touch-manipulation"
                    >
                      {showFreeLiveMap ? "Karte ausblenden" : "Live-Karte zeigen"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Center: Live Google Opening Hours / Contact Status (when live) OR Star Histogram (fallback) */}
              <div
                className="lg:col-span-4 space-y-1.5 border-y lg:border-y-0 lg:border-x border-primary/8 dark:border-white/10 py-2.5 sm:py-4 lg:py-0 lg:px-6"
                aria-label={source === "live" ? "Live Google-Standortdaten" : "Sterneverteilung auf Google Maps"}
              >
                {source === "live" ? (
                  <div className="space-y-1.5 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {place.openNow !== null ? (
                        <span
                          className={`inline-flex items-center gap-1.5 font-extrabold ${
                            place.openNow
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-amber-700 dark:text-amber-300"
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              place.openNow ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                          />
                          {place.openNow ? "Jetzt geöffnet" : "Aktuell geschlossen"}
                        </span>
                      ) : (
                        <span className="font-bold text-primary dark:text-slate-200">
                          Google Maps Profil
                        </span>
                      )}
                      <a
                        href={place.phoneHref}
                        className="inline-flex items-center gap-1 font-bold text-accent hover:underline tabular-nums"
                      >
                        <Phone size={11} aria-hidden="true" />
                        <span>{place.phoneDisplay}</span>
                      </a>
                    </div>

                    {place.todayHours && (
                      <p className="flex items-start gap-1.5 text-[11px] sm:text-xs text-ink-muted">
                        <Clock size={12} className="text-accent shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{place.todayHours}</span>
                      </p>
                    )}

                    {place.weekdayDescriptions.length > 0 && (
                      <div>
                        <button
                          type="button"
                          onClick={() => setShowAllHours((prev) => !prev)}
                          className="text-[11px] font-semibold text-accent hover:underline cursor-pointer"
                        >
                          {showAllHours ? "Öffnungszeiten ausblenden" : "Alle Öffnungszeiten (Mo–So)"}
                        </button>
                        {showAllHours && (
                          <ul className="mt-1.5 space-y-0.5 text-[11px] text-ink-muted border-t border-primary/8 dark:border-white/10 pt-1.5">
                            {place.weekdayDescriptions.map((line) => (
                              <li key={line}>{line}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  ([5, 4, 3, 2, 1] as const).map((starLevel) => {
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
                  })
                )}
              </div>

              {/* Right: Fast Review Modal Trigger + Direct Google Maps Link */}
              <div className="lg:col-span-3 grid grid-cols-1 min-[360px]:grid-cols-2 sm:flex sm:flex-row lg:flex-col gap-2 sm:gap-2.5">
                <button
                  type="button"
                  onClick={openFastReviewModal}
                  aria-haspopup="dialog"
                  aria-expanded={isFastReviewOpen}
                  aria-label="Schnellrezension für Google Maps verfassen"
                  className="group flex-1 inline-flex min-h-[44px] items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-[#1a73e8] hover:bg-[#1557b0] active:bg-[#0d3c84] active:scale-[0.95] active:translate-y-0.5 active:shadow-inner active:ring-2 active:ring-[#8ab4f8]/70 text-white text-xs font-bold transition-all duration-150 active:duration-75 shadow-sm select-none touch-manipulation cursor-pointer whitespace-nowrap"
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
                  className="flex-1 inline-flex min-h-[44px] items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-lg bg-surface dark:bg-slate-800 hover:bg-primary/5 text-primary dark:text-slate-100 border border-primary/12 dark:border-white/15 text-xs font-bold transition-colors whitespace-nowrap"
                >
                  <GoogleGLogo className="w-3.5 h-3.5 shrink-0" />
                  <span>Google Maps</span>
                  <ExternalLink size={11} aria-hidden="true" className="opacity-80 shrink-0" />
                </a>
              </div>
            </div>

            {/* DSGVO Two-Click Consent-Guarded Google Maps Drawer */}
            {showFreeLiveMap && (
              <div className="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-primary/8 dark:border-white/10">
                <div className="overflow-hidden rounded-xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-800">
                  <GoogleMapsEmbed
                    showModeToggle
                    defaultViewMode="pin"
                    className="relative h-[240px] min-[380px]:h-[270px] sm:h-[300px] lg:h-[330px] w-full"
                    title="Hannachi Elektrohaushaltsgeräte Service auf Google Maps"
                  />
                </div>
              </div>
            )}
          </div>
          )}
        </FadeUp>

        {/* Simple, Unified Search, Sort, Playback & Topic Filter Toolbar */}
        <div className="mt-4 sm:mt-6 space-y-2.5 sm:space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
            {/* Selector 1: Direct Inline Search & Clean Sort Control */}
            <div className="flex items-center gap-2 flex-1 min-w-0 w-full sm:max-w-lg">
              <div className="relative flex items-center flex-1 min-w-0">
                <Search
                  size={14}
                  aria-hidden="true"
                  className="absolute left-3 text-ink-faint pointer-events-none"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rezensionen durchsuchen…"
                  aria-label="Google-Rezensionen durchsuchen"
                  className="w-full min-h-[44px] sm:min-h-[38px] rounded-xl border border-primary/12 dark:border-white/15 bg-white dark:bg-slate-900 pl-8.5 pr-9 py-1.5 text-base sm:text-xs text-primary dark:text-slate-100 placeholder:text-ink-faint focus:border-accent focus:outline-none transition-colors shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Suche leeren"
                    className="absolute right-1 flex h-9 w-9 items-center justify-center rounded-lg text-ink-faint hover:text-primary dark:hover:text-white cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="inline-flex min-h-[44px] sm:min-h-[38px] items-center gap-1.5 rounded-xl border border-primary/12 dark:border-white/15 bg-white dark:bg-slate-900 px-2.5 sm:px-3 py-1.5 text-xs shrink-0 shadow-2xs">
                <ArrowUpDown size={13} className="text-ink-muted shrink-0" aria-hidden="true" />
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
                  className="bg-transparent font-semibold text-primary dark:text-slate-200 focus:outline-none cursor-pointer pr-0.5"
                >
                  <option value="relevant">Relevanteste</option>
                  <option value="newest">Neueste</option>
                  <option value="highest">Beste (5★)</option>
                  <option value="lowest">Niedrigste</option>
                </select>
              </div>
            </div>

            {/* Selector 2: Clean Count & Segmented Playback/Step Controls */}
            <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto shrink-0">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted tabular-nums">
                {hasLiveReviews && (
                  <span
                    className="h-2 w-2 rounded-full bg-emerald-500 shrink-0"
                    title="Mit Live-Google-Daten verbunden"
                  />
                )}
                <span>
                  {filteredReviews.length === reviewItems.length
                    ? `${reviewItems.length} Bewertungen`
                    : `${filteredReviews.length} von ${reviewItems.length}`}
                </span>
              </span>

              <div className="inline-flex items-center rounded-xl border border-primary/12 dark:border-white/15 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden divide-x divide-primary/10 dark:divide-white/10">
                <button
                  type="button"
                  onClick={() => scrollRowByCard("prev")}
                  aria-label="Vorherige Bewertung"
                  className="w-11 h-11 sm:w-9 sm:h-[38px] hover:bg-primary/5 text-primary dark:text-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollRowByCard("next")}
                  aria-label="Nächste Bewertung"
                  className="w-11 h-11 sm:w-9 sm:h-[38px] hover:bg-primary/5 text-primary dark:text-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Selector 3: Dynamic Topic Filter Chips (Works with Live & Archived Reviews) */}
          {dynamicTopicChips.length > 0 && (
            <div
              className="flex items-center md:flex-wrap gap-1.5 overflow-x-auto no-scrollbar touch-pan-x overscroll-x-contain scroll-px-4 -mx-4 px-4 sm:mx-0 sm:px-0 pb-1"
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
                className={`shrink-0 inline-flex min-h-[38px] sm:min-h-[34px] items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.97] cursor-pointer border whitespace-nowrap ${
                  selectedTopic === "all"
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-white dark:bg-slate-900 text-ink-muted hover:text-primary dark:hover:text-slate-100 border-primary/10 dark:border-white/10"
                }`}
              >
                <span>Alle</span>
                <span className="tabular-nums opacity-70">{reviewItems.length}</span>
              </button>

              {dynamicTopicChips.map((chip) => {
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
                    className={`shrink-0 inline-flex min-h-[38px] sm:min-h-[34px] items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.97] cursor-pointer border whitespace-nowrap ${
                      isActive
                        ? "bg-primary text-white border-primary shadow-xs"
                        : "bg-white dark:bg-slate-900 text-ink-muted hover:text-primary dark:hover:text-slate-100 border-primary/10 dark:border-white/10"
                    }`}
                  >
                    <span>{chip.label}</span>
                    <span className="tabular-nums opacity-65">{chip.liveCount}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Unified, Responsive Single-Row Google Reviews Carousel */}
        {isSyncingReviews ? (
          <div
            className="relative mt-4 sm:mt-6"
            aria-busy="true"
            aria-label="Google-Bewertungen werden synchronisiert"
          >
            <div className="flex gap-3 sm:gap-4 overflow-hidden pb-1.5 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0">
              {[0, 1, 2, 3].map((idx) => (
                <GoogleReviewCardSkeleton key={`sk-row1-${idx}`} index={idx} />
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
              Alle Rezensionen anzeigen
            </button>
          </div>
        ) : (
          <div
            className="relative mt-4 sm:mt-6 space-y-3"
            onMouseEnter={() => setIsHoveredOrTouched(true)}
            onMouseLeave={() => setIsHoveredOrTouched(false)}
            onFocus={() => setIsHoveredOrTouched(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                setIsHoveredOrTouched(false);
              }
            }}
            onTouchStart={() => pauseAutoBriefly(4500)}
            onWheel={() => pauseAutoBriefly(3500)}
          >
            <div
              ref={row1Ref}
              className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto no-scrollbar touch-pan-x overscroll-x-contain py-3.5 -my-2 -mx-4 px-4 sm:mx-0 sm:px-2 sm:mask-fade-edges"
              role="region"
              aria-label="Google-Kundenbewertungen"
            >
              {carouselItems.map((rev, idx) => (
                <ReviewMarqueeCard
                  key={`${rev.id}-${idx}`}
                  rev={rev}
                  colorIndex={idx}
                  livePlaceUri={livePlaceUri}
                  isLiked={Boolean(likedIds[rev.id])}
                  onToggleLike={handleToggleLike}
                  isDecorativeClone={shouldLoop && idx >= loopBase.length}
                />
              ))}
            </div>

            {hasLiveReviews && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs text-ink-muted">
                <span>
                  Live-Auszüge über Google Places API · Insgesamt{" "}
                  <strong className="text-primary dark:text-white tabular-nums">
                    {liveReviewCount} Bewertungen ({ratingFormatted} ★)
                  </strong>{" "}
                  auf Google Maps.
                </span>
                <a
                  href={livePlaceUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-accent hover:underline shrink-0"
                >
                  <span>Alle {liveReviewCount} auf Google Maps öffnen</span>
                  <ExternalLink size={12} aria-hidden="true" />
                </a>
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
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fast-google-review-title"
          >
            <div className="relative w-full max-w-lg max-h-[90dvh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-white/15 bg-[#202124] text-white shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-4 sm:px-5 py-3.5">
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
                className="flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto overscroll-contain">

            {fastReviewSubmitted ? (
              <div className="p-4 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-4">
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
                    className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    {copiedToClipboard ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedToClipboard ? "Text kopiert ✓" : "Text kopieren"}</span>
                  </button>

                  <a
                    href={liveWriteReviewUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsFastReviewOpen(false)}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#8ab4f8] hover:bg-[#aecbfa] px-5 py-2.5 text-xs font-extrabold text-[#202124] transition-colors"
                  >
                    <GoogleGLogo className="w-4 h-4" />
                    <span>Auf Google Maps öffnen &amp; veröffentlichen</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFastReviewSubmit} className="p-4 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-4">
                {/* User Identity Row (Matches Google Maps "Posting publicly across Google") */}
                <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00897b] text-sm font-bold text-white">
                      {getInitials(draftAuthor || "Kunde Osnabrück")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <input
                        type="text"
                        value={draftAuthor}
                        onChange={(e) => setDraftAuthor(e.target.value)}
                        placeholder="Ihr Name (optional, z. B. Thomas M.)"
                        className="w-full bg-transparent text-base sm:text-sm font-bold text-white placeholder:text-white/60 focus:outline-none border-b border-transparent focus:border-[#8ab4f8]"
                      />
                      <p className="text-[11px] text-white/60">
                        Öffentlich auf Google bewerten · {business.city}
                      </p>
                    </div>
                  </div>

                  <select
                    value={draftService}
                    onChange={(e) => setDraftService(e.target.value)}
                    aria-label="Gerätebereich auswählen"
                    className="min-h-[44px] sm:min-h-0 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none shrink-0"
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
                    className="w-full rounded-xl border border-white/25 bg-transparent p-3.5 text-base sm:text-sm text-white placeholder:text-white/50 focus:border-[#8ab4f8] focus:outline-none"
                  />
                </div>

                {/* Modal Footer Actions (Cancel / Post) */}
                <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 pt-2">
                  <a
                    href={liveWriteReviewUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center justify-center gap-1.5 text-xs font-semibold text-[#8ab4f8] hover:underline"
                  >
                    <span>Direkt zu Google Maps</span>
                    <ExternalLink size={12} />
                  </a>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsFastReviewOpen(false)}
                      className="min-h-[44px] rounded-lg border border-white/20 px-4 py-2 text-xs font-bold text-[#8ab4f8] hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="submit"
                      className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-[#8ab4f8] hover:bg-[#aecbfa] px-4 sm:px-5 py-2 text-xs font-extrabold text-[#202124] transition-colors cursor-pointer shadow-sm"
                    >
                      <span>Absenden &amp; weiter zu Google</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
            </div>
          </div>
        </div>,
          document.body
        )}
    </section>
  );
}
