"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  X,
  Image as ImageIcon,
  Maximize2,
} from "lucide-react";
import {
  resolveMarketplaceItemGallery,
  type MarketplaceItem,
  type ResolvedGallerySlide,
} from "@/data/marketplaceItems";

export function GalleryImage({
  slide,
  alt,
  className = "w-full h-full object-cover",
}: {
  slide: ResolvedGallerySlide;
  alt: string;
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !slide.src) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-slate-900 text-white/60 p-4 text-center">
        <ImageIcon size={28} className="mb-1.5 text-accent-light" />
        <span className="text-xs font-semibold text-white/80 line-clamp-2">
          {slide.label || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={slide.src}
      alt={slide.label ? `${alt} – ${slide.label}` : alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      decoding="async"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}

export function ProductCardGallery({
  item,
  topRightActions,
  onOpenLightbox,
  compact = false,
}: {
  item: MarketplaceItem;
  topRightActions?: React.ReactNode;
  onOpenLightbox?: (initialIndex: number) => void;
  compact?: boolean;
}) {
  const slides = resolveMarketplaceItemGallery(item);
  const [activeIndex, setActiveIndex] = useState(0);

  // Clamp index if item photos change dynamically
  const safeIndex = activeIndex >= slides.length ? 0 : activeIndex;
  const activeSlide = slides[safeIndex];
  const hasMultiple = slides.length > 1;

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % slides.length);
  };

  return (
    <div className={`flex flex-col bg-slate-950 ${compact ? "w-full" : "h-full w-full"}`}>
      {/* Main Interactive Viewport */}
      <div
        className={`relative w-full overflow-hidden bg-slate-900 ${
          compact
            ? "aspect-[16/10] sm:h-44 sm:aspect-auto"
            : "aspect-[16/10] sm:aspect-auto sm:flex-1 sm:min-h-[168px]"
        }`}
      >
        <button
          type="button"
          onClick={() => onOpenLightbox?.(safeIndex)}
          title={
            onOpenLightbox
              ? "Foto vergrößern (Vollbild & 2× Zoom)"
              : activeSlide.label || item.title
          }
          className={`relative block h-full w-full overflow-hidden text-left ${
            onOpenLightbox ? "cursor-zoom-in" : "cursor-default"
          }`}
        >
          <GalleryImage
            slide={activeSlide}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
        </button>

        {/* Top Left Slide Counter & Zoom Button + Top Right Slot */}
        <div className="pointer-events-none absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
          <div className="pointer-events-auto flex items-center gap-1.5">
            {hasMultiple && (
              <span dir="ltr" translate="no" className="notranslate rounded-md bg-slate-950/80 backdrop-blur-xs px-2 py-0.5 font-mono text-[11px] font-bold text-white tabular-nums">
                {safeIndex + 1}/{slides.length}
              </span>
            )}
            {onOpenLightbox && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenLightbox(safeIndex);
                }}
                aria-label="Foto im Zoom öffnen"
                title="Foto vergrößern (2× Zoom)"
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950/75 text-white hover:bg-slate-900 backdrop-blur-xs transition-colors cursor-pointer"
              >
                <Maximize2 size={12} />
              </button>
            )}
          </div>

          {topRightActions && (
            <div className="pointer-events-auto flex items-center gap-1.5">
              {topRightActions}
            </div>
          )}
        </div>

        {/* Prev / Next Carousel Arrows (Visible on multiple photos) */}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Vorheriges Foto"
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/75 text-white hover:bg-accent backdrop-blur-xs transition-colors cursor-pointer"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Nächstes Foto"
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/75 text-white hover:bg-accent backdrop-blur-xs transition-colors cursor-pointer"
            >
              <ChevronRight size={15} />
            </button>
          </>
        )}

        {/* Bottom Scrim Metadata (Unboxed Text with · Separator) */}
        <div className="pointer-events-none absolute bottom-2 left-3 right-3 flex items-center justify-between gap-2 text-[11px] text-white">
          <span className="font-semibold text-white/95 truncate">
            {activeSlide.label || item.categoryLabel}
          </span>
          <span dir="ltr" translate="no" className="notranslate font-mono text-[10px] text-white/80 tabular-nums shrink-0">
            {item.skuOrEnr}
          </span>
        </div>
      </div>

      {/* Interactive Thumbnail Strip (Shown whenever multiple photos exist) */}
      {hasMultiple && (
        <div
          aria-label="Produktfotos auswählen"
          className="flex items-center gap-1.5 overflow-x-auto bg-slate-950 px-2.5 py-1.5 border-t border-white/10"
        >
          {slides.map((slide, idx) => {
            const isSelected = idx === safeIndex;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex(idx);
                }}
                aria-label={`Foto ${idx + 1} anzeigen${slide.label ? `: ${slide.label}` : ""}`}
                aria-pressed={isSelected}
                className={`relative h-9 w-12 shrink-0 overflow-hidden rounded-md border transition-all cursor-pointer ${
                  isSelected
                    ? "border-accent ring-2 ring-accent/70 opacity-100"
                    : "border-white/15 opacity-60 hover:opacity-100"
                }`}
              >
                <GalleryImage
                  slide={slide}
                  alt={`${item.title} Vorschau ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ProductZoomLightbox({
  item,
  initialIndex = 0,
  onClose,
}: {
  item: MarketplaceItem;
  initialIndex?: number;
  onClose: () => void;
}) {
  const slides = resolveMarketplaceItemGallery(item);
  const [activeIndex, setActiveIndex] = useState(
    initialIndex >= 0 && initialIndex < slides.length ? initialIndex : 0
  );
  const [zoomed, setZoomed] = useState(false);

  const goPrev = useCallback(() => {
    setZoomed(false);
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goNext = useCallback(() => {
    setZoomed(false);
    setActiveIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && slides.length > 1) {
        goPrev();
      } else if (e.key === "ArrowRight" && slides.length > 1) {
        goNext();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, goPrev, goNext, slides.length]);

  const activeSlide = slides[activeIndex] || slides[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Fotogalerie: ${item.title}`}
      data-testid="marketplace-zoom-lightbox"
      className="fixed inset-0 z-[10000] flex flex-col bg-slate-950/95 text-white backdrop-blur-md"
    >
      {/* Top Lightbox Controls */}
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 sm:px-6 py-3.5 shrink-0">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
            <span translate="no" className="notranslate font-bold text-white">
              {item.brand}
            </span>
            <span aria-hidden="true">·</span>
            <span dir="ltr" translate="no" className="notranslate font-mono tabular-nums">
              {item.skuOrEnr}
            </span>
            {activeSlide.label && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-accent-light">
                  {activeSlide.label}
                </span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span dir="ltr" translate="no" className="notranslate font-mono tabular-nums">
              {activeIndex + 1} / {slides.length}
            </span>
          </div>
          <h3 dir="auto" className="mt-0.5 text-sm sm:text-base font-extrabold text-white truncate">
            {item.title}
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setZoomed((z) => !z)}
            aria-pressed={zoomed}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-center text-xs font-extrabold leading-tight text-white hover:bg-white/20 transition-colors cursor-pointer sm:whitespace-nowrap"
          >
            <span key={zoomed ? "zoom-out" : "zoom-in"} className="inline-flex items-center gap-1.5">
              {zoomed ? <ZoomOut size={15} className="shrink-0" /> : <ZoomIn size={15} className="shrink-0" />}
              <span>{zoomed ? "1× Ansicht" : "2× Zoom (Typenschild)"}</span>
            </span>
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Lightbox schließen"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Zoomable Canvas */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center overflow-auto p-4 sm:p-8">
        {slides.length > 1 && !zoomed && (
          <button
            type="button"
            onClick={goPrev}
            aria-label="Vorheriges Foto"
            className="fixed left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-slate-900/80 text-white hover:bg-accent transition-colors cursor-pointer"
          >
            <ChevronLeft size={22} />
          </button>
        )}

        <div
          onClick={() => setZoomed((z) => !z)}
          title={zoomed ? "Klicken zum Verkleinern" : "Klicken zum Vergrößern (2× Zoom)"}
          className={`relative flex items-center justify-center transition-all duration-200 ${
            zoomed
              ? "cursor-zoom-out min-w-[140vw] sm:min-w-[140%] min-h-[140%]"
              : "cursor-zoom-in max-w-5xl max-h-full w-full h-full"
          }`}
        >
          <img
            src={activeSlide.src}
            alt={activeSlide.label ? `${item.title} – ${activeSlide.label}` : item.title}
            referrerPolicy="no-referrer"
            className={`rounded-xl border border-white/15 bg-slate-900 shadow-2xl transition-transform duration-200 ${
              zoomed
                ? "w-auto max-w-none max-h-none scale-125 sm:scale-150 object-contain"
                : "max-h-[70vh] w-auto max-w-full object-contain"
            }`}
          />
        </div>

        {slides.length > 1 && !zoomed && (
          <button
            type="button"
            onClick={goNext}
            aria-label="Nächstes Foto"
            className="fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-slate-900/80 text-white hover:bg-accent transition-colors cursor-pointer"
          >
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {slides.length > 1 && (
        <div className="border-t border-white/10 bg-slate-950 px-4 sm:px-6 py-3 shrink-0">
          <div className="flex items-center justify-center gap-2.5 overflow-x-auto">
            {slides.map((slide, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => {
                    setZoomed(false);
                    setActiveIndex(idx);
                  }}
                  className={`group flex flex-col items-center gap-1 shrink-0 cursor-pointer`}
                >
                  <div
                    className={`h-14 w-20 overflow-hidden rounded-lg border transition-all ${
                      isSelected
                        ? "border-accent ring-2 ring-accent opacity-100"
                        : "border-white/15 opacity-55 group-hover:opacity-100"
                    }`}
                  >
                    <GalleryImage
                      slide={slide}
                      alt={`Foto ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  {slide.label && (
                    <span
                      className={`text-[10px] max-w-[84px] truncate ${
                        isSelected ? "font-bold text-accent-light" : "text-white/60"
                      }`}
                    >
                      {slide.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
