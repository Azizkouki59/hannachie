import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface HeroAnimatedBackdropProps {
  variant?: "hero-water-drum" | "about-heritage-emblem" | "subpage-header";
  seedKey?: string;
}

/**
 * Zero-lag architectural backdrop for Hero and dark Subpage Headers.
 * Uses pure CSS gradients, CSS radial masks, and GPU-composited motion (transform/opacity only).
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
      {/* Base Hannachi calm sapphire depth gradient (#071126 -> #102447) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 85% 75% at 78% 12%, rgba(18, 43, 84, 0.92) 0%, rgba(12, 27, 56, 0.78) 48%, rgba(7, 17, 38, 0.98) 100%)",
        }}
      />

      {/* Soft studio radial light pools balancing calm cobalt blue & velvety crimson */}
      <motion.div
        animate={
          isHero && !prefersReduced
            ? { scale: [1, 1.06, 1], opacity: [0.15, 0.21, 0.15] }
            : undefined
        }
        transition={
          isHero && !prefersReduced
            ? { duration: 11, repeat: Infinity, ease: "easeInOut" }
            : undefined
        }
        className="absolute -top-24 -right-20 h-[28rem] w-[28rem] sm:h-[36rem] sm:w-[36rem] rounded-full opacity-[0.15]"
        style={{
          background:
            "radial-gradient(circle at center, #1974B8 0%, rgba(25, 116, 184, 0.28) 44%, transparent 72%)",
        }}
      />
      <motion.div
        animate={
          isHero && !prefersReduced
            ? { scale: [1, 1.07, 1], opacity: [0.075, 0.115, 0.075] }
            : undefined
        }
        transition={
          isHero && !prefersReduced
            ? { duration: 13, delay: 1.5, repeat: Infinity, ease: "easeInOut" }
            : undefined
        }
        className="absolute -bottom-28 left-[10%] h-[24rem] w-[24rem] sm:h-[32rem] sm:w-[32rem] rounded-full opacity-[0.075]"
        style={{
          background:
            "radial-gradient(circle at center, #C92A42 0%, rgba(201, 42, 66, 0.16) 42%, transparent 72%)",
        }}
      />

      {/* Precision hairline engineering grid via pure CSS background (zero SVG mask cost) */}
      <motion.div
        initial={isHero && !prefersReduced ? { opacity: 0 } : false}
        animate={{ opacity: 0.11 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 opacity-[0.11]"
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

      {/* Subtle architectural precision rings on desktop with ultra-calm mechanical rotation */}
      {isHero && (
        <motion.svg
          initial={prefersReduced ? false : { opacity: 0, scale: 0.93 }}
          animate={{ opacity: 0.11, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="hidden sm:block absolute -right-24 -top-24 h-[520px] w-[520px] opacity-[0.11]"
          viewBox="0 0 520 520"
          fill="none"
        >
          <motion.circle
            cx="260"
            cy="260"
            r="228"
            stroke="#64B5EC"
            strokeWidth="0.85"
            strokeDasharray="6 10"
            style={{ transformOrigin: "260px 260px" }}
            animate={prefersReduced ? undefined : { rotate: 360 }}
            transition={
              prefersReduced
                ? undefined
                : { duration: 96, repeat: Infinity, ease: "linear" }
            }
          />
          <motion.circle
            cx="260"
            cy="260"
            r="168"
            stroke="#E86A7D"
            strokeWidth="0.85"
            strokeDasharray="3 12"
            style={{ transformOrigin: "260px 260px" }}
            animate={prefersReduced ? undefined : { rotate: -360 }}
            transition={
              prefersReduced
                ? undefined
                : { duration: 120, repeat: Infinity, ease: "linear" }
            }
          />
        </motion.svg>
      )}

      {/* GPU-composited cursor spotlight (desktop fine pointer only, translate3d only) */}
      {!prefersReduced && (
        <div
          ref={spotlightRef}
          className="hidden lg:block absolute top-0 left-0 h-[480px] w-[480px] rounded-full opacity-0 transition-opacity duration-300"
          style={{
            background:
              "radial-gradient(circle at center, rgba(25, 116, 184, 0.14) 0%, rgba(201, 42, 66, 0.04) 44%, transparent 72%)",
          }}
        />
      )}

      {/* Protective contrast scrim so white typography stays razor-sharp */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,17,38,0.66)_0%,rgba(7,17,38,0.32)_52%,rgba(7,17,38,0.12)_100%)]" />

      {/* Crisp top & bottom architectural hairlines with pro center-out reveal */}
      <motion.div
        initial={isHero && !prefersReduced ? { scaleX: 0.25, opacity: 0 } : false}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-0 inset-x-0 h-px origin-center"
        style={{
          background:
            "linear-gradient(90deg, transparent 8%, rgba(100, 181, 236, 0.44) 38%, rgba(224, 242, 254, 0.48) 50%, rgba(232, 106, 125, 0.36) 64%, transparent 92%)",
        }}
      />
      {isHero && !prefersReduced && (
        <motion.div
          animate={{ x: ["-20vw", "110vw"], opacity: [0, 0.85, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, repeatDelay: 4.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-0 left-0 h-[1.5px] w-56 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(100,181,236,0.9) 50%, rgba(232,106,125,0.78) 85%, transparent 100%)",
          }}
        />
      )}
      <div
        className="absolute bottom-0 inset-x-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 5%, rgba(148, 163, 184, 0.16) 35%, rgba(100, 181, 236, 0.3) 55%, rgba(232, 106, 125, 0.2) 78%, transparent 98%)",
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
              colorA: "#1974B8",
              colorB: "#C92A42",
            }
          : variant === "reviews"
            ? {
                orbA: "-top-20 right-[12%]",
                orbB: "-bottom-24 left-[14%]",
                colorA: "#1974B8",
                colorB: "#0F2447",
              }
            : variant === "inquiry"
              ? {
                  orbA: "-top-24 right-[6%]",
                  orbB: "-bottom-24 left-[6%]",
                  colorA: "#C92A42",
                  colorB: "#1974B8",
                }
              : {
                  orbA: "-top-24 right-[14%]",
                  orbB: "-bottom-28 left-[10%]",
                  colorA: "#1974B8",
                  colorB: "#C92A42",
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
