import React, { useEffect, useRef, useState } from "react";
import { IMAGE_ASSETS_BY_PATH, type StaticImageData } from "@/data/images";

export type { StaticImageData };

export interface ImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height"> {
  src: string | StaticImageData;
  alt: string;
  width?: number | string;
  height?: number | string;
  fill?: boolean;
  priority?: boolean;
  /** Enables high-priority eager loading & preload hint specifically on mobile viewports (< 1024px). */
  mobilePriority?: boolean;
  /** Injects a `<link rel="preload" as="image">` hint in `document.head` when priority is active. */
  preload?: boolean;
  quality?: number;
  unoptimized?: boolean;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
}

const MOBILE_MEDIA_QUERY = "(max-width: 1023px)";

interface ResolvedImageAsset {
  fallbackSrc: string;
  avifSrc?: string;
  avifSrcSet?: string;
  webpSrc?: string;
  webpSrcSet?: string;
  intrinsicWidth?: number;
  intrinsicHeight?: number;
  defaultSizes?: string;
  blurDataURL?: string;
}

function resolveModernImageAsset(src: string | StaticImageData): ResolvedImageAsset {
  if (typeof src === "object" && src !== null && "src" in src) {
    return {
      fallbackSrc: src.src,
      avifSrc: src.avifSrc,
      avifSrcSet: src.avifSrcSet,
      webpSrc: src.webpSrc,
      webpSrcSet: src.webpSrcSet,
      intrinsicWidth: src.width,
      intrinsicHeight: src.height,
      defaultSizes: src.defaultSizes,
      blurDataURL: src.blurDataURL,
    };
  }

  const normalized = String(src || "");
  const normalizedWithoutQuery = normalized.split("?")[0];
  const known = IMAGE_ASSETS_BY_PATH[normalized] ?? IMAGE_ASSETS_BY_PATH[normalizedWithoutQuery];
  if (known) {
    return {
      fallbackSrc: known.src,
      avifSrc: known.avifSrc,
      avifSrcSet: known.avifSrcSet,
      webpSrc: known.webpSrc,
      webpSrcSet: known.webpSrcSet,
      intrinsicWidth: known.width,
      intrinsicHeight: known.height,
      defaultSizes: known.defaultSizes,
      blurDataURL: known.blurDataURL,
    };
  }

  const localMatch = normalized.match(/^\/images\/([a-z0-9-]+)\.(jpe?g|png|webp|avif)(\?.*)?$/i);
  if (localMatch) {
    const baseName = localMatch[1];
    const qs = localMatch[3] ?? "";
    return {
      fallbackSrc: `/images/${baseName}.jpg${qs}`,
      avifSrc: `/images/${baseName}.avif${qs}`,
      avifSrcSet: `/images/${baseName}-480w.avif${qs} 480w, /images/${baseName}-960w.avif${qs} 960w, /images/${baseName}-1600w.avif${qs} 1600w`,
      webpSrc: `/images/${baseName}.webp${qs}`,
      webpSrcSet: `/images/${baseName}-480w.webp${qs} 480w, /images/${baseName}-960w.webp${qs} 960w, /images/${baseName}-1600w.webp${qs} 1600w`,
    };
  }

  return { fallbackSrc: normalized };
}

export default function Image({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  mobilePriority = false,
  preload = false,
  quality = 85,
  unoptimized = false,
  placeholder,
  blurDataURL,
  sizes,
  loading,
  decoding,
  fetchPriority,
  className = "",
  style,
  onLoad,
  onError,
  ...rest
}: ImageProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const onLoadRef = useRef(onLoad);
  onLoadRef.current = onLoad;
  const cachedLoadNotifiedRef = useRef<string | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [useFallbackSrc, setUseFallbackSrc] = useState(false);

  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }
    return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
  });

  useEffect(() => {
    if (!mobilePriority || typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mql = window.matchMedia(MOBILE_MEDIA_QUERY);
    setIsMobileViewport(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobileViewport(e.matches);
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }
    return undefined;
  }, [mobilePriority]);

  const {
    fallbackSrc,
    avifSrc,
    avifSrcSet,
    webpSrc,
    webpSrcSet,
    intrinsicWidth,
    intrinsicHeight,
    defaultSizes,
    blurDataURL: assetBlurDataURL,
  } = resolveModernImageAsset(src);

  useEffect(() => {
    setUseFallbackSrc(false);
    cachedLoadNotifiedRef.current = null;
  }, [fallbackSrc, avifSrc, webpSrc]);

  const isDataOrBlob =
    fallbackSrc.startsWith("data:") ||
    fallbackSrc.startsWith("blob:") ||
    fallbackSrc.endsWith(".svg");

  const effectiveBlurDataURL = blurDataURL ?? assetBlurDataURL;
  const shouldUseBlurPlaceholder =
    !isDataOrBlob && placeholder === "blur" && Boolean(effectiveBlurDataURL);

  useEffect(() => {
    const imgEl = imgRef.current;
    if (imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
      setIsLoaded(true);
      const currentKey = imgEl.currentSrc || fallbackSrc;
      if (onLoadRef.current && cachedLoadNotifiedRef.current !== currentKey) {
        cachedLoadNotifiedRef.current = currentKey;
        onLoadRef.current({
          target: imgEl,
          currentTarget: imgEl,
        } as unknown as React.SyntheticEvent<HTMLImageElement>);
      }
    } else {
      setIsLoaded(false);
    }
  }, [fallbackSrc, avifSrc, webpSrc]);

  const resolvedWidth = fill ? undefined : (width ?? intrinsicWidth);
  const resolvedHeight = fill ? undefined : (height ?? intrinsicHeight);

  const numericWidth =
    typeof resolvedWidth === "number"
      ? resolvedWidth
      : typeof resolvedWidth === "string"
      ? parseInt(resolvedWidth, 10)
      : undefined;

  const computedSizes =
    sizes ??
    defaultSizes ??
    (fill
      ? "100vw"
      : numericWidth && !Number.isNaN(numericWidth)
      ? `(max-width: ${numericWidth}px) 100vw, ${numericWidth}px`
      : "100vw");

  const effectivePriority = priority || (mobilePriority && isMobileViewport);

  useEffect(() => {
    if (!preload || !effectivePriority) return;
    if (typeof document === "undefined" || isDataOrBlob || unoptimized) return;

    const preloadType = avifSrcSet ? "image/avif" : webpSrcSet ? "image/webp" : undefined;
    const preloadSrcSet = avifSrcSet ?? webpSrcSet;
    const preloadKey = avifSrc ?? webpSrc ?? fallbackSrc;

    // Avoid duplicating a preload already declared statically or via usePreloadHeroImages
    const existing = document.head.querySelector(
      `link[rel="preload"][data-img-preload="${preloadKey}"], link[rel="preload"][data-hero-banner-preload="${preloadKey}"], link[rel="preload"][data-hero-preload="${preloadKey}"]`
    );
    if (existing) return;

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.setAttribute("data-img-preload", preloadKey);
    link.setAttribute("fetchpriority", "high");
    link.href = preloadKey;

    if (preloadSrcSet) {
      if (preloadType) {
        link.type = preloadType;
      }
      link.setAttribute("imagesrcset", preloadSrcSet);
      link.setAttribute("imagesizes", computedSizes);
    }

    document.head.appendChild(link);
    return () => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    };
  }, [
    preload,
    effectivePriority,
    isDataOrBlob,
    unoptimized,
    avifSrc,
    avifSrcSet,
    webpSrc,
    webpSrcSet,
    fallbackSrc,
    computedSizes,
  ]);

  const blurPlaceholderStyle: React.CSSProperties | undefined =
    shouldUseBlurPlaceholder && !isLoaded
      ? {
          color: "transparent",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundImage: `url("${effectiveBlurDataURL}")`,
          filter: "blur(10px)",
          transition: "filter 240ms ease-out",
        }
      : shouldUseBlurPlaceholder
      ? {
          filter: "blur(0px)",
          transition: "filter 240ms ease-out",
        }
      : undefined;

  const resolvedStyle: React.CSSProperties | undefined = fill
    ? {
        position: "absolute",
        height: "100%",
        width: "100%",
        inset: 0,
        ...blurPlaceholderStyle,
        ...style,
      }
    : blurPlaceholderStyle || style
    ? {
        ...blurPlaceholderStyle,
        ...style,
      }
    : undefined;

  const resolvedLoading = effectivePriority ? "eager" : (loading ?? "lazy");
  const resolvedDecoding = effectivePriority ? "sync" : (decoding ?? "async");
  const resolvedFetchPriority = effectivePriority ? "high" : (fetchPriority ?? "auto");

  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    cachedLoadNotifiedRef.current = event.currentTarget.currentSrc || fallbackSrc;
    setIsLoaded(true);
    onLoad?.(event);
  };

  const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    if (!useFallbackSrc && !unoptimized && !isDataOrBlob) {
      setUseFallbackSrc(true);
      return;
    }
    setIsLoaded(true);
    onError?.(event);
  };

  const resolvedImgSrc =
    !unoptimized && !isDataOrBlob && !useFallbackSrc && webpSrc ? webpSrc : fallbackSrc;

  const imgElement = (
    <img
      ref={imgRef}
      src={resolvedImgSrc}
      alt={alt}
      width={resolvedWidth}
      height={resolvedHeight}
      loading={resolvedLoading}
      decoding={resolvedDecoding}
      fetchPriority={resolvedFetchPriority}
      sizes={!unoptimized && !isDataOrBlob && !useFallbackSrc ? computedSizes : sizes}
      data-nimg={fill ? "fill" : "1"}
      data-quality={quality}
      data-placeholder={shouldUseBlurPlaceholder ? "blur" : undefined}
      onLoad={handleLoad}
      onError={handleError}
      className={className}
      style={resolvedStyle}
      {...rest}
    />
  );

  if (!unoptimized && !isDataOrBlob && !useFallbackSrc && (avifSrcSet || webpSrcSet)) {
    return (
      <picture style={{ display: "contents" }}>
        {avifSrcSet && (
          <source type="image/avif" srcSet={avifSrcSet} sizes={computedSizes} />
        )}
        {webpSrcSet && (
          <source type="image/webp" srcSet={webpSrcSet} sizes={computedSizes} />
        )}
        {imgElement}
      </picture>
    );
  }

  return imgElement;
}
