import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

interface HeroAnimatedBackdropProps {
  variant?: "hero-water-drum" | "about-heritage-emblem" | "subpage-header";
  seedKey?: string;
}

/**
 * Zero-lag architectural backdrop for Hero and dark Subpage Headers.
 * Uses pure CSS gradients & CSS radial masks (zero full-viewport SVG masks,
 * zero infinite orb loops, and compositor-only translate3d mouse spotlight on desktop).
 */
export function HeroAnimatedBackdrop({
  variant = "hero-water-drum",
  seedKey = "",
}: HeroAnimatedBackdropProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced || typeof window === "undefined") return undefined;
    const isFinePointer = window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;
    if (!isFinePointer) return undefined;

    const sectionEl = anchorRef.current?.parentElement;
    const spotEl = spotlightRef.current;
    if (!sectionEl || !spotEl) return undefined;

    let cachedRect: DOMRect | null = null;
    let rafId = 0;
    let targetX = 0;
    let targetY = 0;

    const commitTransform = () => {
      rafId = 0;
      spotEl.style.transform = `translate3d(${(targetX - 240).toFixed(1)}px, ${(targetY - 240).toFixed(1)}px, 0)`;
    };

    const onPointerEnter = () => {
      cachedRect = sectionEl.getBoundingClientRect();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (!cachedRect) {
        cachedRect = sectionEl.getBoundingClientRect();
      }
      targetX = e.clientX - cachedRect.left;
      targetY = e.clientY - cachedRect.top;
      spotEl.style.opacity = "1";
      if (!rafId) {
        rafId = window.requestAnimationFrame(commitTransform);
      }
    };

    const onPointerLeave = () => {
      cachedRect = null;
      spotEl.style.opacity = "0";
    };

    const invalidateRect = () => {
      cachedRect = null;
    };

    sectionEl.addEventListener("pointerenter", onPointerEnter, { passive: true });
    sectionEl.addEventListener("pointermove", onPointerMove, { passive: true });
    sectionEl.addEventListener("pointerleave", onPointerLeave, { passive: true });
    window.addEventListener("resize", invalidateRect, { passive: true });
    window.addEventListener("scroll", invalidateRect, { passive: true });

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      sectionEl.removeEventListener("pointerenter", onPointerEnter);
      sectionEl.removeEventListener("pointermove", onPointerMove);
      sectionEl.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", invalidateRect);
      window.removeEventListener("scroll", invalidateRect);
    };
  }, [prefersReduced]);

  const isHero = variant === "hero-water-drum";

  return (
    <div
      ref={anchorRef}
      aria-hidden="true"
      data-backdrop-variant={variant}
      data-backdrop-seed={seedKey || undefined}
      className="pointer-events-none absolute inset-0 overflow-hidden contain-strict"
    >
      {/* Base Hannachi architectural depth gradient (#020617 -> #0F2A4A) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 85% 75% at 78% 12%, rgba(15, 42, 74, 0.92) 0%, rgba(15, 23, 42, 0.74) 48%, rgba(2, 6, 23, 0.98) 100%)",
        }}
      />

      {/* Static studio radial light pools (zero idle GPU animation) */}
      <div
        className="absolute -top-24 -right-20 h-[28rem] w-[28rem] sm:h-[36rem] sm:w-[36rem] rounded-full opacity-[0.14]"
        style={{
          background:
            "radial-gradient(circle at center, #0284C7 0%, rgba(2, 132, 199, 0.32) 44%, transparent 72%)",
        }}
      />
      <div
        className="absolute -bottom-28 left-[12%] h-[24rem] w-[24rem] sm:h-[32rem] sm:w-[32rem] rounded-full opacity-[0.1]"
        style={{
          background:
            "radial-gradient(circle at center, #10B981 0%, rgba(16, 185, 129, 0.22) 42%, transparent 70%)",
        }}
      />

      {/* Precision hairline engineering grid via pure CSS background (zero SVG mask cost) */}
      <div
        className="absolute inset-0 opacity-[0.13]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(148, 163, 184, 0.34) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.34) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          WebkitMaskImage:
            "radial-gradient(ellipse 68% 68% at 62% 35%, #000 0%, rgba(0, 0, 0, 0.42) 66%, transparent 100%)",
          maskImage:
            "radial-gradient(ellipse 68% 68% at 62% 35%, #000 0%, rgba(0, 0, 0, 0.42) 66%, transparent 100%)",
        }}
      />

      {/* Subtle static architectural precision rings on desktop */}
      {isHero && (
        <svg
          className="hidden sm:block absolute -right-24 -top-24 h-[500px] w-[500px] opacity-[0.09]"
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
          />
          <circle
            cx="260"
            cy="260"
            r="168"
            stroke="#10B981"
            strokeWidth="0.75"
            strokeDasharray="3 12"
          />
        </svg>
      )}

      {/* GPU-composited cursor spotlight (desktop fine pointer only, translate3d only) */}
      {!prefersReduced && (
        <div
          ref={spotlightRef}
          className="hidden lg:block absolute top-0 left-0 h-[480px] w-[480px] rounded-full opacity-0 transition-opacity duration-300"
          style={{
            background:
              "radial-gradient(circle at center, rgba(2, 132, 199, 0.14) 0%, rgba(16, 185, 129, 0.04) 44%, transparent 72%)",
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
 * Ultra-lightweight pure-CSS ambient studio mesh for content sections.
 * Zero SVG masks, zero infinite CSS keyframes, zero repaint overhead during scroll.
 */
export function SectionAmbientMesh({
  variant = "pillars",
}: {
  variant?: "pillars" | "process" | "reviews" | "inquiry";
}) {
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
        className={`absolute ${layout.orbA} h-80 w-80 sm:h-[26rem] sm:w-[26rem] rounded-full opacity-[0.055] dark:opacity-[0.1]`}
        style={{
          background: `radial-gradient(circle at center, ${layout.colorA} 0%, transparent 70%)`,
        }}
      />
      <div
        className={`absolute ${layout.orbB} h-72 w-72 sm:h-[24rem] sm:w-[24rem] rounded-full opacity-[0.045] dark:opacity-[0.08]`}
        style={{
          background: `radial-gradient(circle at center, ${layout.colorB} 0%, transparent 70%)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.06] dark:opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "34px 34px",
          WebkitMaskImage:
            "radial-gradient(ellipse 65% 60% at 50% 45%, #000 0%, transparent 100%)",
          maskImage:
            "radial-gradient(ellipse 65% 60% at 50% 45%, #000 0%, transparent 100%)",
        }}
      />
    </div>
  );
}
