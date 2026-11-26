import { useEffect, useId, useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";

interface HeroAnimatedBackdropProps {
  variant?: "hero-water-drum" | "about-heritage-emblem" | "subpage-header";
  seedKey?: string;
}

/**
 * Lightweight, 60fps CSS + inline SVG ambient light & architectural grid mesh
 * for Hero and dark Subpage Headers (zero WebGL / canvas overhead on mobile & desktop).
 * Palette: Hannachi Navy (#0F2A4A), Cerulean (#0284C7), Emerald (#10B981), opacity <= 0.15.
 */
export function HeroAnimatedBackdrop({
  variant = "hero-water-drum",
  seedKey = "",
}: HeroAnimatedBackdropProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const gridId = useId();
  const prefersReduced = useReducedMotion();

  const rawSpotX = useMotionValue(720);
  const rawSpotY = useMotionValue(180);
  const rawSpotOpacity = useMotionValue(0);

  const spotX = useSpring(rawSpotX, { stiffness: 130, damping: 24, mass: 0.6 });
  const spotY = useSpring(rawSpotY, { stiffness: 130, damping: 24, mass: 0.6 });
  const spotOpacity = useSpring(rawSpotOpacity, { stiffness: 130, damping: 24 });

  const spotlightBg = useMotionTemplate`radial-gradient(500px circle at ${spotX}px ${spotY}px, rgba(2, 132, 199, 0.14), rgba(16, 185, 129, 0.04) 44%, transparent 72%)`;

  useEffect(() => {
    if (prefersReduced || typeof window === "undefined") return undefined;
    const isFinePointer = window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;
    if (!isFinePointer) return undefined;

    const sectionEl = anchorRef.current?.parentElement;
    if (!sectionEl) return undefined;

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const rect = sectionEl.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      rawSpotX.set(e.clientX - rect.left);
      rawSpotY.set(e.clientY - rect.top);
      rawSpotOpacity.set(1);
    };

    const onPointerLeave = () => {
      rawSpotOpacity.set(0);
    };

    sectionEl.addEventListener("pointermove", onPointerMove, { passive: true });
    sectionEl.addEventListener("pointerleave", onPointerLeave, { passive: true });

    return () => {
      sectionEl.removeEventListener("pointermove", onPointerMove);
      sectionEl.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [prefersReduced, rawSpotX, rawSpotY, rawSpotOpacity]);

  const isHero = variant === "hero-water-drum";

  return (
    <div
      ref={anchorRef}
      aria-hidden="true"
      data-backdrop-variant={variant}
      data-backdrop-seed={seedKey || undefined}
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Base Hannachi architectural depth gradient (#020617 -> #0F2A4A) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 85% 75% at 78% 12%, rgba(15, 42, 74, 0.92) 0%, rgba(15, 23, 42, 0.72) 48%, rgba(2, 6, 23, 0.98) 100%)",
        }}
      />

      {/* Ultra-subtle infinitely drifting radial mesh orbs (GPU-composited transform only) */}
      <div
        className="ambient-mesh-a absolute -top-24 -right-20 h-[28rem] w-[28rem] sm:h-[36rem] sm:w-[36rem] rounded-full opacity-[0.14]"
        style={{
          background:
            "radial-gradient(circle at center, #0284C7 0%, rgba(2, 132, 199, 0.32) 44%, transparent 72%)",
        }}
      />
      <div
        className="ambient-mesh-b absolute -bottom-28 left-[12%] h-[24rem] w-[24rem] sm:h-[32rem] sm:w-[32rem] rounded-full opacity-[0.11]"
        style={{
          background:
            "radial-gradient(circle at center, #10B981 0%, rgba(16, 185, 129, 0.24) 42%, transparent 70%)",
        }}
      />
      {isHero && (
        <div
          className="ambient-mesh-c absolute top-[22%] left-[44%] h-[20rem] w-[20rem] rounded-full opacity-[0.12]"
          style={{
            background:
              "radial-gradient(circle at center, #0F2A4A 0%, rgba(56, 189, 248, 0.25) 45%, transparent 72%)",
          }}
        />
      )}

      {/* Precision hairline SVG engineering grid with subtle radial mask */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.11]"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id={`hero-grid-${gridId}`}
            width="44"
            height="44"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 44 0 L 0 0 0 44"
              fill="none"
              stroke="rgba(148, 163, 184, 0.42)"
              strokeWidth="0.75"
            />
            <circle cx="0" cy="0" r="1.15" fill="rgba(56, 189, 248, 0.55)" />
          </pattern>
          <radialGradient id={`hero-grid-mask-${gridId}`} cx="62%" cy="35%" r="68%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="68%" stopColor="white" stopOpacity="0.45" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id={`hero-mask-${gridId}`}>
            <rect width="100%" height="100%" fill={`url(#hero-grid-mask-${gridId})`} />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill={`url(#hero-grid-${gridId})`}
          mask={`url(#hero-mask-${gridId})`}
        />
      </svg>

      {/* Subtle architectural precision arcs on right quadrant (zero blur cost) */}
      {isHero && (
        <svg
          className="hidden sm:block absolute -right-24 -top-24 h-[520px] w-[520px] opacity-[0.1]"
          viewBox="0 0 520 520"
          fill="none"
        >
          <circle
            cx="260"
            cy="260"
            r="228"
            stroke="#38BDF8"
            strokeWidth="0.75"
            strokeDasharray="6 10"
            className="hero-aperture-cw origin-center"
          />
          <circle
            cx="260"
            cy="260"
            r="168"
            stroke="#10B981"
            strokeWidth="0.75"
            strokeDasharray="3 12"
            className="hero-aperture-ccw origin-center"
          />
        </svg>
      )}

      {/* Subtle cursor-tracked studio sheen (desktop fine pointer only) */}
      {!prefersReduced && (
        <motion.div
          className="hidden lg:block absolute inset-0"
          style={{
            background: spotlightBg,
            opacity: spotOpacity,
          }}
        />
      )}

      {/* Protective contrast scrim so white typography stays razor-sharp */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.68)_0%,rgba(2,6,23,0.34)_52%,rgba(2,6,23,0.12)_100%)]" />

      {/* Crisp top & bottom architectural hairlines */}
      <div
        className="absolute top-0 inset-x-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 8%, rgba(2, 132, 199, 0.42) 38%, rgba(224, 242, 254, 0.54) 50%, rgba(16, 185, 129, 0.34) 64%, transparent 92%)",
        }}
      />
      <div
        className="absolute bottom-0 inset-x-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 5%, rgba(148, 163, 184, 0.16) 35%, rgba(56, 189, 248, 0.28) 55%, rgba(148, 163, 184, 0.14) 85%, transparent 98%)",
        }}
      />
    </div>
  );
}

/**
 * Ultra-lightweight CSS + inline SVG ambient mesh for light/dark content sections
 * (Services, 3-Step Process, Google Reviews, Inquiry) — replaces heavy WebGL canvases.
 */
export function SectionAmbientMesh({
  variant = "pillars",
}: {
  variant?: "pillars" | "process" | "reviews" | "inquiry";
}) {
  const meshId = useId();

  const layout =
    variant === "process"
      ? {
          orbA: "-top-24 left-[8%]",
          orbB: "-bottom-28 right-[10%]",
          colorA: "#0284C7",
          colorB: "#10B981",
        }
      : variant === "reviews"
        ? {
            orbA: "-top-20 right-[12%]",
            orbB: "-bottom-24 left-[14%]",
            colorA: "#0284C7",
            colorB: "#0F2A4A",
          }
        : variant === "inquiry"
          ? {
              orbA: "-top-24 right-[6%]",
              orbB: "-bottom-24 left-[6%]",
              colorA: "#10B981",
              colorB: "#0284C7",
            }
          : {
              orbA: "-top-24 right-[14%]",
              orbB: "-bottom-28 left-[10%]",
              colorA: "#0284C7",
              colorB: "#0F2A4A",
            };

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div
        className={`ambient-mesh-a absolute ${layout.orbA} h-80 w-80 sm:h-[26rem] sm:w-[26rem] rounded-full opacity-[0.06] dark:opacity-[0.11]`}
        style={{
          background: `radial-gradient(circle at center, ${layout.colorA} 0%, transparent 70%)`,
        }}
      />
      <div
        className={`ambient-mesh-b absolute ${layout.orbB} h-72 w-72 sm:h-[24rem] sm:w-[24rem] rounded-full opacity-[0.05] dark:opacity-[0.09]`}
        style={{
          background: `radial-gradient(circle at center, ${layout.colorB} 0%, transparent 70%)`,
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.055] dark:opacity-[0.07]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id={`section-dots-${meshId}`}
            width="36"
            height="36"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1.5" cy="1.5" r="1" fill="currentColor" />
          </pattern>
          <radialGradient id={`section-fade-${meshId}`} cx="50%" cy="45%" r="65%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id={`section-mask-${meshId}`}>
            <rect width="100%" height="100%" fill={`url(#section-fade-${meshId})`} />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          className="text-primary dark:text-sky-300"
          fill={`url(#section-dots-${meshId})`}
          mask={`url(#section-mask-${meshId})`}
        />
      </svg>
    </div>
  );
}
