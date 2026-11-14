import { useEffect, useState } from "react";
import { werkstattImage, type StaticImageData } from "@/data/images";

const DEFAULT_HERO_IMAGES: StaticImageData[] = [werkstattImage];

const MOBILE_VIEWPORT_QUERY = "(max-width: 1023px)";
const MOBILE_HERO_SIZES = "(max-width: 640px) 94vw, (max-width: 1023px) 92vw, 520px";

interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
}

/**
 * Coordinates LCP hero-banner preloading on the homepage without over-preloading
 * below-the-fold assets or causing duplicate format downloads.
 */
export function usePreloadHeroImages(
  assets: StaticImageData[] = DEFAULT_HERO_IMAGES
): { isHeroReady: boolean; isMobileViewport: boolean } {
  const [isHeroReady, setIsHeroReady] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }
    return window.matchMedia(MOBILE_VIEWPORT_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mql = window.matchMedia(MOBILE_VIEWPORT_QUERY);
    setIsMobileViewport(mql.matches);
    const onChange = (event: MediaQueryListEvent) => {
      setIsMobileViewport(event.matches);
    };
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const nav = window.navigator as Navigator & {
      connection?: NetworkInformationLike;
    };
    const isSaveData = Boolean(nav.connection?.saveData);
    const isSlowCellular =
      nav.connection?.effectiveType === "slow-2g" ||
      nav.connection?.effectiveType === "2g";

    const primary = assets[0];
    if (!primary) {
      setIsHeroReady(true);
      return;
    }

    if (isSaveData || isSlowCellular) {
      setIsHeroReady(true);
      return;
    }

    const preloadKey = primary.avifSrc || primary.webpSrc || primary.src;
    const preloadSrcSet = primary.avifSrcSet || primary.webpSrcSet;
    const preloadType = primary.avifSrcSet ? "image/avif" : "image/webp";
    const resolvedSizes = isMobileViewport
      ? MOBILE_HERO_SIZES
      : primary.defaultSizes || MOBILE_HERO_SIZES;

    const existing = document.head.querySelector(
      `link[rel="preload"][data-hero-preload="${preloadKey}"], link[rel="preload"][data-hero-banner-preload="${preloadKey}"]`
    );

    let createdLink: HTMLLinkElement | null = null;
    if (!existing) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = preloadKey;
      link.setAttribute("data-hero-preload", preloadKey);
      link.setAttribute("fetchpriority", "high");

      if (preloadSrcSet) {
        link.type = preloadType;
        link.setAttribute("imagesrcset", preloadSrcSet);
        link.setAttribute("imagesizes", resolvedSizes);
      }

      document.head.appendChild(link);
      createdLink = link;
    }

    let cancelled = false;
    const img = new window.Image();
    img.decoding = "async";
    if ("fetchPriority" in img) {
      (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = "high";
    }
    if (preloadSrcSet) {
      img.sizes = resolvedSizes;
      img.srcset = preloadSrcSet;
    }
    img.src = preloadKey;

    const markReady = () => {
      if (!cancelled) {
        setIsHeroReady(true);
      }
    };

    const decodeAndMarkReady = () => {
      if (typeof img.decode === "function") {
        img.decode().then(markReady, markReady);
      } else {
        markReady();
      }
    };

    if (img.complete) {
      decodeAndMarkReady();
    } else {
      img.onload = decodeAndMarkReady;
      img.onerror = markReady;
    }

    return () => {
      cancelled = true;
      if (createdLink?.parentNode) {
        createdLink.parentNode.removeChild(createdLink);
      }
    };
  }, [assets, isMobileViewport]);

  return { isHeroReady, isMobileViewport };
}
