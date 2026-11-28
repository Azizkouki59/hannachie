"use client";

export const HANNACHI_BRAND_ASSETS = {
  symbolSvg: "/assets/aistudio/hannachi-symbol_4be78b4f.svg",
  emblemSvg: "/assets/aistudio/hannachi-emblem_e7fb307e.svg",
  emblemPng: "/assets/aistudio/hannachi-emblem-2048_263261a0.png",
  lockupDarkSvg: "/assets/aistudio/hannachi-lockup-dark_bae8a7c6.svg",
  lockupDarkPng: "/assets/aistudio/hannachi-lockup-dark-3200x800_b98bd70b.png",
  lockupLightSvg: "/assets/aistudio/hannachi-lockup-light_5c53b15d.svg",
  lockupLightPng: "/assets/aistudio/hannachi-lockup-light-3200x800_62c6e0b5.png",
  seal1x1Svg: "/assets/aistudio/hannachi-seal-1x1_b78e7ff8.svg",
  seal1x1Png: "/assets/aistudio/hannachi-seal-1x1-2160_533757a2.png",
  seal16x9Svg: "/assets/aistudio/hannachi-seal-16x9_935f8341.svg",
  seal16x9Png: "/assets/aistudio/hannachi-seal-16x9-3840x2160_1eb87844.png",
  faviconSvg: "/assets/aistudio/hannachi-favicon_c61e2633.svg",
  appIcon180: "/assets/aistudio/app-icon-180_92a3142e.png",
  appIcon192: "/assets/aistudio/app-icon-192_c3e7c35d.png",
  appIcon512: "/assets/aistudio/app-icon-512_bdba8a7c.png",
  appIcon1024: "/assets/aistudio/app-icon-1024_5b2865e2.png",
} as const;

export type HannachiLogoVariant =
  | "symbol"
  | "emblem"
  | "lockup-dark"
  | "lockup-light"
  | "lockup-auto"
  | "seal"
  | "seal-wide";

export interface HannachiBrandLogoProps {
  variant?: HannachiLogoVariant;
  size?: number;
  height?: number;
  className?: string;
  textClassName?: string;
  showSubline?: boolean;
  decorative?: boolean;
}

const VARIANT_CONFIG: Record<
  HannachiLogoVariant,
  { src: string; alt: string; isWide?: boolean; isSeal?: boolean }
> = {
  symbol: {
    src: HANNACHI_BRAND_ASSETS.symbolSvg,
    alt: "Hannachi H-Monogramm Logo",
  },
  emblem: {
    src: HANNACHI_BRAND_ASSETS.emblemSvg,
    alt: "Hannachi Marken-Emblem",
  },
  "lockup-dark": {
    src: HANNACHI_BRAND_ASSETS.symbolSvg,
    alt: "Hannachi · Elektrohaushaltsgeräte & Original-Ersatzteile Osnabrück seit 1990",
    isWide: true,
  },
  "lockup-light": {
    src: HANNACHI_BRAND_ASSETS.symbolSvg,
    alt: "Hannachi · Elektrohaushaltsgeräte & Original-Ersatzteile Osnabrück seit 1990",
    isWide: true,
  },
  "lockup-auto": {
    src: HANNACHI_BRAND_ASSETS.symbolSvg,
    alt: "Hannachi · Elektrohaushaltsgeräte & Original-Ersatzteile Osnabrück seit 1990",
    isWide: true,
  },
  seal: {
    src: HANNACHI_BRAND_ASSETS.seal1x1Svg,
    alt: "Hannachi Qualitätssiegel · Osnabrück seit 1990",
    isSeal: true,
  },
  "seal-wide": {
    src: HANNACHI_BRAND_ASSETS.seal16x9Svg,
    alt: "Hannachi Qualitätssiegel 16:9 · Osnabrück seit 1990",
    isWide: true,
    isSeal: true,
  },
};

/**
 * Official Hannachi brand mark:
 * Lockup variants complete the royal-cobalt [H] oval directly into "[H]annachi"
 * so the monogram H serves seamlessly as the capital H without repeating it.
 */
export default function HannachiBrandLogo({
  variant = "symbol",
  size = 40,
  height,
  className = "",
  textClassName = "",
  showSubline = true,
  decorative = true,
}: HannachiBrandLogoProps) {
  const cfg = VARIANT_CONFIG[variant];
  const resolvedAlt = decorative ? "" : cfg.alt;

  if (
    variant === "lockup-dark" ||
    variant === "lockup-light" ||
    variant === "lockup-auto"
  ) {
    const useInlineHeight = Boolean(height) && !className;
    const h = height ?? 46;
    const wordSize = Math.max(17, Math.round(h * 0.56));

    const gradientTextClass =
      variant === "lockup-dark"
        ? "bg-gradient-to-b from-[#E86A7D] via-[#C92A42] to-[#A11E33] [filter:drop-shadow(0_2px_6px_rgba(2,6,23,0.65))]"
        : variant === "lockup-light"
          ? "bg-gradient-to-b from-[#E86A7D] via-[#C92A42] to-[#A11E33] [filter:drop-shadow(0_1px_2px_rgba(15,30,58,0.14))]"
          : "bg-gradient-to-b from-[#E86A7D] via-[#C92A42] to-[#A11E33] [filter:drop-shadow(0_1px_2px_rgba(15,30,58,0.14))] dark:[filter:drop-shadow(0_2px_6px_rgba(2,6,23,0.65))]";

    const accentLineClass =
      variant === "lockup-dark"
        ? "bg-gradient-to-r from-[#64B5EC]/85 via-[#64B5EC]/45 to-[#E86A7D]/70"
        : variant === "lockup-light"
          ? "bg-gradient-to-r from-[#1974B8]/70 via-[#64B5EC]/55 to-[#C92A42]/65"
          : "bg-gradient-to-r from-[#1974B8]/70 via-[#64B5EC]/55 to-[#C92A42]/65 dark:from-[#64B5EC]/85 dark:via-[#64B5EC]/45 dark:to-[#E86A7D]/70";

    return (
      <span
        role={decorative ? undefined : "img"}
        aria-label={decorative ? undefined : cfg.alt}
        aria-hidden={decorative ? true : undefined}
        style={useInlineHeight ? { height: h } : undefined}
        className={`relative inline-flex shrink-0 items-center select-none ${
          !className && !height ? "h-[46px]" : ""
        } ${className}`.trim()}
      >
        <img
          src={cfg.src}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          draggable={false}
          className="h-full w-auto aspect-square shrink-0 object-contain drop-shadow-[0_2px_10px_rgba(100,181,236,0.34)] select-none"
        />
        <span className="relative -ml-0.5 sm:-ml-1 inline-flex flex-col justify-center leading-none">
          <span
            aria-hidden="true"
            style={
              textClassName
                ? undefined
                : { fontSize: useInlineHeight ? wordSize : undefined }
            }
            className={`font-sans font-black tracking-[-0.035em] leading-[0.88] bg-clip-text text-transparent pb-[1px] ${gradientTextClass} ${
              textClassName || (!useInlineHeight ? "text-[25px]" : "")
            }`.trim()}
          >
            annachi
          </span>
          {showSubline && (
            <span
              aria-hidden="true"
              className={`mt-[2px] h-[2px] w-full rounded-full ${accentLineClass}`}
            />
          )}
        </span>
      </span>
    );
  }

  if (variant === "seal" || variant === "seal-wide") {
    return (
      <span
        style={
          className
            ? undefined
            : variant === "seal"
              ? { width: size, height: size }
              : { height: height ?? 180 }
        }
        className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-sky-400/30 bg-[#020617] shadow-[0_8px_28px_rgba(2,6,23,0.45)] ${className}`.trim()}
      >
        <img
          src={cfg.src}
          alt={resolvedAlt}
          aria-hidden={decorative ? true : undefined}
          referrerPolicy="no-referrer"
          draggable={false}
          className="h-full w-full object-contain select-none"
        />
      </span>
    );
  }

  return (
    <span
      style={className ? undefined : { width: size, height: size }}
      className={`relative inline-flex shrink-0 items-center justify-center select-none ${className}`.trim()}
    >
      <img
        src={cfg.src}
        alt={resolvedAlt}
        aria-hidden={decorative ? true : undefined}
        referrerPolicy="no-referrer"
        draggable={false}
        className="h-full w-full object-contain drop-shadow-[0_2px_10px_rgba(56,189,248,0.32)] select-none"
      />
    </span>
  );
}
