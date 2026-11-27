"use client";
import { useRef, useEffect, useState, ReactNode } from "react";
import {
  motion,
  AnimatePresence,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import { MessageCircle, PackageSearch, X, ArrowRight, Sparkles, Info, Clock } from "lucide-react";
import { useQuickRequest } from "@/components/QuickRequestSheet";
import { business, type ServiceNotice } from "@/data/site";

/* ── Weightless Antigravity spring & settling curves ── */
const smooth = [0.22, 1, 0.36, 1] as const;
const physicalSpring = {
  type: "spring" as const,
  stiffness: 195,
  damping: 26,
  mass: 0.85,
};

/* ── Clean Spring Fade-Up on scroll (60fps GPU-composited, clears transform on settle) ── */
export function FadeUp({
  children,
  delay = 0,
  className = "",
  once = true,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  once?: boolean;
}) {
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      data-motion-reveal="true"
      initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 14 }}
      whileInView={{
        opacity: 1,
        y: 0,
        transitionEnd: { transform: "none" },
      }}
      viewport={{ once, amount: "some", margin: "0px 0px -20px 0px" }}
      transition={
        prefersReduced
          ? { duration: 0.01 }
          : {
              ...physicalSpring,
              delay,
              opacity: { duration: 0.36, delay, ease: smooth },
            }
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Staggered container + items (crisp studio cascade on phone & desktop) ── */
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.065, delayChildren: 0.02 },
  },
};
const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 14,
  },
  visible: {
    opacity: 1,
    y: 0,
    transitionEnd: { transform: "none" },
    transition: {
      ...physicalSpring,
      opacity: { duration: 0.36, ease: smooth },
    },
  },
};

export function StaggerContainer({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) {
    return (
      <div data-motion-reveal="true" className={className}>
        {children}
      </div>
    );
  }
  return (
    <motion.div
      data-motion-reveal="true"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: "some", margin: "0px 0px -18px 0px" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

/* ── Crisp Scroll-Triggered Card Reveal ── */
export function ScrollRevealCard({
  children,
  index = 0,
  className = "",
}: {
  children: ReactNode;
  index?: number;
  className?: string;
}) {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) {
    return (
      <div data-motion-reveal="true" className={className}>
        {children}
      </div>
    );
  }
  return (
    <motion.div
      data-motion-reveal="true"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{
        opacity: 1,
        y: 0,
        transitionEnd: { transform: "none" },
      }}
      viewport={{ once: true, amount: "some", margin: "0px 0px -18px 0px" }}
      transition={{
        ...physicalSpring,
        delay: (index % 4) * 0.055,
        opacity: { duration: 0.36, delay: (index % 4) * 0.055, ease: smooth },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Zero-Lag Studio Card Wrapper (CSS GPU-composited lift, desktop fine-pointer only) ── */
export function Spatial3DCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  enableScrollTilt?: boolean;
  scrollYaw?: number;
}) {
  return (
    <div
      data-spatial-3d="true"
      className={`relative h-full transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hover:-translate-y-0.5 ${className}`}
    >
      {children}
    </div>
  );
}

/* ── Crisp Studio Photography Frame (Zero scroll listeners, zero curtain-wipe delay) ── */
export function Spatial3DPhoto({
  src,
  alt,
  aspectClass = "aspect-[16/10]",
  fallbackGradient = "from-slate-900 via-sky-950 to-slate-950",
  priority = false,
  className = "",
  children,
}: {
  src: string;
  alt: string;
  aspectClass?: string;
  fallbackGradient?: string;
  priority?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${fallbackGradient} ${aspectClass} ${className}`}
    >
      {!imgFailed && (
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          onError={() => setImgFailed(true)}
          className="h-full w-full object-cover object-center transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.035]"
        />
      )}

      {/* Measured contrast vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[4] bg-gradient-to-t from-slate-950/70 via-slate-950/15 to-transparent"
      />

      {children}
    </div>
  );
}

/* ── Parallax wrapper (desktop-only smooth depth, disabled on reduced motion / small phones) ── */
export function Parallax({
  children,
  speed = 0.2,
  className = "",
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
}) {
  const prefersReduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 30,
    mass: 0.5,
  });
  const y = useTransform(smoothProgress, [0, 1], [`${-speed * 60}px`, `${speed * 60}px`]);

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

/* ── Count-up number (smooth viewport-triggered deceleration with decimal & reduced-motion support) ── */
function formatCountValue(value: number, decimals: number, decimalSeparator: string): string {
  if (decimals <= 0) return String(Math.round(value));
  return value.toFixed(decimals).replace(".", decimalSeparator);
}

export function CountUp({
  target,
  suffix = "",
  prefix = "",
  duration = 1.05,
  decimals = 0,
  decimalSeparator = ",",
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  decimals?: number;
  decimalSeparator?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const prefersReduced = useReducedMotion();
  const isInView = useInView(ref, { once: true, amount: "some" });
  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {isInView && !prefersReduced ? (
        <AnimatedNumber
          target={target}
          duration={duration}
          decimals={decimals}
          decimalSeparator={decimalSeparator}
        />
      ) : (
        formatCountValue(target, decimals, decimalSeparator)
      )}
      {suffix}
    </span>
  );
}

function AnimatedNumber({
  target,
  duration,
  decimals,
  decimalSeparator,
}: {
  target: number;
  duration: number;
  decimals: number;
  decimalSeparator: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const startTime = performance.now();
    let animationFrameId: number;

    const step = (ts: number) => {
      const progress = Math.min((ts - startTime) / (duration * 1000), 1);
      // Natural exponential ease-out so counting decelerates like a precision dial
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = eased * target;
      el.textContent = formatCountValue(current, decimals, decimalSeparator);
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };
    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [target, duration, decimals, decimalSeparator]);

  return <span ref={ref}>{formatCountValue(target, decimals, decimalSeparator)}</span>;
}

/* ── Floating badge (glass) ── */
export function GlassBadge({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, scale: 0.92, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={prefersReduced ? { duration: 0.01 } : { ...physicalSpring, delay }}
      className={`rounded-2xl border border-white/10 bg-white/10 px-5 py-3 backdrop-blur-xl shadow-xl ${className}`}
    >
      {children}
    </motion.div>
  );
}

/* ── Tactile spring hover/tap effect (respects touch & reduced motion) ── */
export function MagneticHover({ children, className = "" }: { children: ReactNode; className?: string }) {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -3 }}
      whileTap={{ scale: 0.975 }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Scroll progress bar (Direct 1:1 GPU scaleX, zero spring loop lag) ── */
export function ScrollProgressBar() {
  const prefersReduced = useReducedMotion();
  const { scrollYProgress } = useScroll();

  if (prefersReduced) return null;

  return (
    <motion.div
      style={{ scaleX: scrollYProgress }}
      className="fixed top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-accent via-sky-400 to-cyan-300 origin-left z-50 pointer-events-none"
    />
  );
}

/* ── Mobile Floating Quick Actions (Sticky Phone Dock) ── */
export function MobileQuickActions({
  phone,
}: {
  phone?: string;
  phoneHref?: string;
  whatsappHref?: string;
}) {
  const [visible, setVisible] = useState(false);
  const { openQuickRequest } = useQuickRequest();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 60) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={visible ? { y: 0, opacity: 1 } : { y: 80, opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-3 inset-x-3 z-40 sm:hidden pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/20 bg-primary-dark/95 p-2 shadow-2xl backdrop-blur-xl ring-1 ring-black/20">
        <button
          type="button"
          onClick={() => openQuickRequest("Waschmaschine", "", "", "question")}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <MessageCircle size={15} />
          Direkte Frage
        </button>

        <button
          type="button"
          onClick={() => openQuickRequest("Waschmaschine", "", "", "repair")}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent py-3 text-xs font-bold text-white shadow-md transition-all active:scale-95 cursor-pointer"
          aria-label={`Anfrage vorbereiten${phone ? ` (${phone})` : ""}`}
        >
          <PackageSearch size={15} />
          Gerät / Teil anfragen
        </button>
      </div>
    </motion.div>
  );
}

/* ── Auto-Playing Brand Logo Ticker (Tailwind animate-brand-ticker) ── */
interface BrandMeta {
  name: string;
  tagline: string;
  accentColor: string;
  monogram: string;
  wordmarkClass: string;
}

const BRAND_LOGO_CATALOG: Record<string, BrandMeta> = {
  Miele: {
    name: "Miele",
    tagline: "Premium Hausgeräte",
    accentColor: "#C8102E",
    monogram: "M",
    wordmarkClass: "font-serif italic tracking-tight font-black text-[17px]",
  },
  Bosch: {
    name: "BOSCH",
    tagline: "Technik fürs Leben",
    accentColor: "#E20015",
    monogram: "B",
    wordmarkClass: "font-sans tracking-[0.14em] font-black text-[15px]",
  },
  Siemens: {
    name: "SIEMENS",
    tagline: "Hausgeräte & IQ-Serie",
    accentColor: "#009999",
    monogram: "S",
    wordmarkClass: "font-sans tracking-[0.12em] font-extrabold text-[15px]",
  },
  AEG: {
    name: "AEG",
    tagline: "Waschen · Kochen · Kühlen",
    accentColor: "#D50032",
    monogram: "A",
    wordmarkClass: "font-sans tracking-[0.18em] font-black text-[16px]",
  },
  Bauknecht: {
    name: "Bauknecht",
    tagline: "Wasch- & Kühltechnik",
    accentColor: "#005A9C",
    monogram: "BK",
    wordmarkClass: "font-sans tracking-tight font-extrabold text-[15px]",
  },
  Whirlpool: {
    name: "Whirlpool",
    tagline: "6th Sense Geräte",
    accentColor: "#F59E0B",
    monogram: "W",
    wordmarkClass: "font-sans tracking-tight font-bold text-[15px]",
  },
  Samsung: {
    name: "SAMSUNG",
    tagline: "EcoBubble & Digital Inverter",
    accentColor: "#1428A0",
    monogram: "S",
    wordmarkClass: "font-sans tracking-[0.14em] font-black text-[14px]",
  },
  LG: {
    name: "LG",
    tagline: "DirectDrive & Smart Inverter",
    accentColor: "#A50034",
    monogram: "LG",
    wordmarkClass: "font-sans tracking-wider font-black text-[16px]",
  },
  Beko: {
    name: "beko",
    tagline: "Wasch- & Spülgeräte",
    accentColor: "#0072CE",
    monogram: "b",
    wordmarkClass: "font-sans lowercase tracking-tight font-black text-[17px]",
  },
  Liebherr: {
    name: "LIEBHERR",
    tagline: "Kühl- & Gefrierspezialist",
    accentColor: "#D97706",
    monogram: "LH",
    wordmarkClass: "font-sans tracking-[0.13em] font-black text-[14px]",
  },
  Gorenje: {
    name: "gorenje",
    tagline: "Küche & Hausgeräte",
    accentColor: "#0284C7",
    monogram: "g",
    wordmarkClass: "font-sans lowercase tracking-wide font-extrabold text-[16px]",
  },
  Constructa: {
    name: "Constructa",
    tagline: "BSH Markenqualität",
    accentColor: "#1E3A8A",
    monogram: "C",
    wordmarkClass: "font-sans tracking-tight font-extrabold text-[15px]",
  },
  Neff: {
    name: "NEFF",
    tagline: "Küchen- & Hausgeräte",
    accentColor: "#EA580C",
    monogram: "N",
    wordmarkClass: "font-sans tracking-[0.16em] font-black text-[15px]",
  },
  Zanussi: {
    name: "ZANUSSI",
    tagline: "Electrolux Gruppe",
    accentColor: "#CA8A04",
    monogram: "Z",
    wordmarkClass: "font-sans tracking-[0.12em] font-extrabold text-[14px]",
  },
  Privileg: {
    name: "privileg",
    tagline: "Haushaltsgeräte Service",
    accentColor: "#0F766E",
    monogram: "P",
    wordmarkClass: "font-sans tracking-wide font-extrabold text-[15px]",
  },
  Jura: {
    name: "JURA",
    tagline: "Kaffeevollautomaten",
    accentColor: "#B91C1C",
    monogram: "J",
    wordmarkClass: "font-sans tracking-[0.2em] font-black text-[15px]",
  },
  DeLonghi: {
    name: "De'Longhi",
    tagline: "Kaffee & Espresso",
    accentColor: "#0F2A4A",
    monogram: "DL",
    wordmarkClass: "font-serif tracking-tight font-bold text-[16px]",
  },
};

function BrandEmblem({ meta }: { meta: BrandMeta }) {
  return (
    <span
      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/8 dark:border-white/10 bg-surface dark:bg-slate-800/80 transition-transform duration-200 group-hover/brand:scale-105"
      style={{
        boxShadow: `inset 0 0 0 1px ${meta.accentColor}22`,
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 36 36" className="h-6 w-6" fill="none">
        <circle
          cx="18"
          cy="18"
          r="14"
          stroke={meta.accentColor}
          strokeWidth="2"
          strokeOpacity="0.28"
        />
        <path
          d="M18 4 A14 14 0 0 1 32 18"
          stroke={meta.accentColor}
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <text
          x="18"
          y="22"
          textAnchor="middle"
          fill={meta.accentColor}
          className="font-sans text-[10.5px] font-black"
        >
          {meta.monogram}
        </text>
      </svg>
    </span>
  );
}

export function Marquee({
  items,
  onSelectBrand,
}: {
  items: string[];
  onSelectBrand?: (brand: string) => void;
}) {
  const prefersReduced = useReducedMotion();
  // Duplicate items twice so translate3d(-50%, 0, 0) loops seamlessly without any jump
  const loopItems = prefersReduced ? items : [...items, ...items];

  return (
    <div
      className={`group relative flex w-full overflow-hidden select-none py-2 ${
        prefersReduced ? "" : "mask-fade-edges"
      }`}
      aria-label="Unterstützte Herstellermarken"
    >
      <div
        className={
          prefersReduced
            ? "flex flex-wrap items-center justify-center gap-2.5 w-full"
            : "flex w-max shrink-0 items-center gap-3 sm:gap-3.5 pr-3 sm:pr-3.5 animate-brand-ticker group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] will-change-transform"
        }
      >
        {loopItems.map((rawName, i) => {
          const isDuplicate = !prefersReduced && i >= items.length;
          const meta: BrandMeta = BRAND_LOGO_CATALOG[rawName] || {
            name: rawName,
            tagline: "Alle Modelle & Serien",
            accentColor: "#0284C7",
            monogram: rawName.slice(0, 2).toUpperCase(),
            wordmarkClass: "font-sans tracking-tight font-extrabold text-[15px]",
          };

          const content = (
            <>
              <BrandEmblem meta={meta} />
              <span className="flex flex-col text-left leading-none">
                <span className="flex items-center gap-1.5">
                  <span className={`${meta.wordmarkClass} text-primary dark:text-slate-100 group-hover/brand:text-accent dark:group-hover/brand:text-accent-light transition-colors`}>
                    {meta.name}
                  </span>
                  <span
                    className="h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: meta.accentColor }}
                  />
                </span>
                <span className="mt-1 text-[10px] font-semibold text-ink-muted whitespace-nowrap">
                  {meta.tagline}
                </span>
              </span>
            </>
          );

          if (onSelectBrand) {
            return (
              <button
                key={`${rawName}-${i}`}
                type="button"
                tabIndex={isDuplicate ? -1 : undefined}
                aria-hidden={isDuplicate ? true : undefined}
                onClick={() => onSelectBrand(rawName)}
                title={`${rawName} Geräte & Ersatzteile anfragen`}
                className="group/brand inline-flex min-h-[52px] shrink-0 items-center gap-3 rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 px-3.5 sm:px-4 py-2 shadow-xs transition-[transform,border-color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-accent/55 hover:shadow-[0_8px_20px_-8px_rgba(2,132,199,0.22)] active:scale-[0.98] cursor-pointer"
              >
                {content}
              </button>
            );
          }

          return (
            <div
              key={`${rawName}-${i}`}
              aria-hidden={isDuplicate ? true : undefined}
              className="group/brand inline-flex min-h-[52px] shrink-0 items-center gap-3 rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 px-3.5 sm:px-4 py-2 shadow-xs transition-[transform,border-color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-accent/55 hover:shadow-[0_8px_20px_-8px_rgba(2,132,199,0.22)]"
            >
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const BrandLogoTicker = Marquee;

/* ── Interactive Spotlight Card (Inspired by skillloop.tn pointer-field & pf-halo) ── */
export function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(14, 165, 233, 0.12)",
}: {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-500 z-10"
        style={{
          opacity,
          background: `radial-gradient(420px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`,
        }}
      />
      {children}
    </div>
  );
}

/* ── Persistent Floating 'Contact Us' Button & Expandable Mini Menu ── */
const menuContainerVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 16,
    transition: {
      duration: 0.18,
      ease: smooth,
    },
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: smooth,
      staggerChildren: 0.065,
      delayChildren: 0.04,
    },
  },
};

const menuItemVariants: Variants = {
  hidden: { opacity: 0, y: 12, x: 8, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    x: 0,
    scale: 1,
    transition: { duration: 0.26, ease: smooth },
  },
};

const MAX_INTRO_PULSES = 3;
const INTRO_PULSE_SEEN_KEY = "hannachi-intro-pulse-seen";
const INTRO_PULSE_COUNT_KEY = "hannachi-support-intro-pulse-count";
const LAUNCHER_DISMISSED_SESSION_KEY = "hannachi-support-launcher-dismissed";

export function FloatingSupportLauncher({
  phone,
  phoneHref: _phoneHref,
  whatsappHref: _whatsappHref,
  serviceNotice = business.serviceNotice,
  variant = "glassmorphism",
}: {
  phone: string;
  phoneHref: string;
  whatsappHref: string;
  serviceNotice?: ServiceNotice;
  variant?: "default" | "glassmorphism";
}) {
  const { openQuickRequest } = useQuickRequest();
  const launcherRef = useRef<HTMLElement | null>(null);
  const pulseCountRef = useRef<number>(0);
  const [pulseCount, setPulseCount] = useState<number>(0);
  const [open, setOpen] = useState(false);
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const [launcherDismissed, setLauncherDismissed] = useState(false);
  const [introPulseActive, setIntroPulseActive] = useState(false);
  const [hasInteractedWithLauncher, setHasInteractedWithLauncher] = useState(false);

  const permanentlyDisableIntroPulse = () => {
    pulseCountRef.current = MAX_INTRO_PULSES;
    setPulseCount(MAX_INTRO_PULSES);
    setIntroPulseActive(false);
    setHasInteractedWithLauncher(true);
    if (launcherRef.current) {
      launcherRef.current.setAttribute("data-intro-pulse", "false");
      launcherRef.current.classList.remove("floating-support-launcher--intro-pulse");
    }
    try {
      window.localStorage.setItem(INTRO_PULSE_SEEN_KEY, "true");
      window.localStorage.setItem(INTRO_PULSE_COUNT_KEY, String(MAX_INTRO_PULSES));
    } catch {
      // Ignore storage access errors in restricted contexts
    }
  };

  const lastIncrementAtRef = useRef<number>(0);

  const incrementPulseCounter = () => {
    const now = Date.now();
    if (now - lastIncrementAtRef.current < 1200) {
      return;
    }
    lastIncrementAtRef.current = now;
    setPulseCount((prev) => {
      const next = Math.min(MAX_INTRO_PULSES, prev + 1);
      pulseCountRef.current = next;
      try {
        window.localStorage.setItem(INTRO_PULSE_COUNT_KEY, String(next));
        if (next >= MAX_INTRO_PULSES) {
          window.localStorage.setItem(INTRO_PULSE_SEEN_KEY, "true");
        }
      } catch {
        // Ignore storage access errors
      }
      return next;
    });
  };

  useEffect(() => {
    if (pulseCount >= MAX_INTRO_PULSES) {
      permanentlyDisableIntroPulse();
    }
  }, [pulseCount]);

  const handleDismissLauncherForSession = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    permanentlyDisableIntroPulse();
    setOpen(false);
    setLauncherDismissed(true);
    try {
      window.localStorage.setItem(LAUNCHER_DISMISSED_SESSION_KEY, "true");
      window.sessionStorage.setItem(LAUNCHER_DISMISSED_SESSION_KEY, "true");
    } catch {
      // Ignore storage access errors
    }
  };

  useEffect(() => {
    try {
      if (
        window.localStorage.getItem(LAUNCHER_DISMISSED_SESSION_KEY) === "true" ||
        window.sessionStorage.getItem(LAUNCHER_DISMISSED_SESSION_KEY) === "true"
      ) {
        setLauncherDismissed(true);
        return;
      }
      const alreadySeen = window.localStorage.getItem(INTRO_PULSE_SEEN_KEY) === "true";
      const storedCount = Number(
        window.localStorage.getItem(INTRO_PULSE_COUNT_KEY) || "0"
      );
      if (alreadySeen || storedCount >= MAX_INTRO_PULSES) {
        permanentlyDisableIntroPulse();
        return;
      }
      if (storedCount > 0) {
        pulseCountRef.current = storedCount;
        setPulseCount(storedCount);
      }
    } catch {
      // Ignore storage access errors
    }

    if (hasInteractedWithLauncher || pulseCountRef.current >= MAX_INTRO_PULSES) {
      return;
    }

    let started = false;

    const triggerGentlePulse = () => {
      if (started || pulseCountRef.current >= MAX_INTRO_PULSES) return;
      started = true;
      setIntroPulseActive(true);
    };

    const loadTimer = setTimeout(triggerGentlePulse, 900);

    const handleFirstPageInteraction = () => {
      triggerGentlePulse();
    };

    window.addEventListener("scroll", handleFirstPageInteraction, { passive: true, once: true });
    window.addEventListener("pointerdown", handleFirstPageInteraction, { passive: true, once: true });
    window.addEventListener("touchstart", handleFirstPageInteraction, { passive: true, once: true });

    return () => {
      clearTimeout(loadTimer);
      window.removeEventListener("scroll", handleFirstPageInteraction);
      window.removeEventListener("pointerdown", handleFirstPageInteraction);
      window.removeEventListener("touchstart", handleFirstPageInteraction);
    };
  }, [hasInteractedWithLauncher]);

  useEffect(() => {
    if (!introPulseActive || hasInteractedWithLauncher || pulseCount >= MAX_INTRO_PULSES) {
      return;
    }

    const cycleInterval = setInterval(() => {
      incrementPulseCounter();
    }, 2400);

    return () => clearInterval(cycleInterval);
  }, [introPulseActive, hasInteractedWithLauncher, pulseCount]);

  const handleLauncherAnimationIteration = (e: React.AnimationEvent<HTMLElement>) => {
    if (e.animationName !== "floating-support-soft-pulse") return;
    incrementPulseCounter();
  };

  const handleLauncherAnimationEnd = (e: React.AnimationEvent<HTMLElement>) => {
    if (e.animationName !== "floating-support-soft-pulse") return;
    permanentlyDisableIntroPulse();
  };

  const isServiceNoticeActive = Boolean(
    serviceNotice?.active && serviceNotice.message.trim().length > 0
  );
  const shortNoticeBadgeText =
    serviceNotice?.type === "maintenance" ? "Wartung" : "Servicezeiten";
  const showIntroPulse =
    introPulseActive &&
    !open &&
    !hasInteractedWithLauncher &&
    pulseCount < MAX_INTRO_PULSES;

  if (launcherDismissed) {
    return null;
  }

  return (
    <motion.aside
      ref={launcherRef}
      aria-label="Schnellkontakt-Menü"
      initial={{ opacity: 0, scale: 0.75, y: 28 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 22,
        delay: 0.2,
      }}
      onAnimationIteration={handleLauncherAnimationIteration}
      onAnimationEnd={handleLauncherAnimationEnd}
      className={`floating-support-launcher fixed bottom-[max(0.875rem,env(safe-area-inset-bottom))] right-3.5 sm:right-5 lg:bottom-6 lg:right-6 z-40 flex flex-col items-end ${
        variant === "glassmorphism"
          ? "floating-support-launcher--glassmorphism"
          : ""
      } ${showIntroPulse ? "floating-support-launcher--intro-pulse" : ""}`}
      data-variant={variant}
      data-idle={!open ? "true" : "false"}
      data-intro-pulse={showIntroPulse ? "true" : "false"}
      data-intro-pulse-count={pulseCount}
    >
      {!open && (
        <button
          type="button"
          onClick={handleDismissLauncherForSession}
          data-testid="floating-support-dismiss-btn"
          aria-label="Kontakt-Button ausblenden"
          title="Kontakt-Button ausblenden"
          className="floating-support-dismiss-btn absolute -top-1.5 -right-1.5 z-20 flex h-5 w-5 items-center justify-center rounded-full border border-white/35 bg-slate-900/75 text-white/80 opacity-75 shadow-sm backdrop-blur-md transition-all duration-200 hover:scale-105 hover:bg-slate-900 hover:text-white hover:opacity-100 focus-visible:opacity-100 cursor-pointer"
        >
          <X size={10} strokeWidth={2.5} aria-hidden="true" />
        </button>
      )}
      <AnimatePresence>
        {open && (
          <motion.div
            key="contact-mini-menu"
            variants={menuContainerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            style={{ transformOrigin: "bottom right" }}
            className="mb-3 w-[min(calc(100vw-2.25rem),20rem)] max-h-[calc(100dvh-6.5rem)] overflow-y-auto overscroll-contain rounded-3xl border border-white/15 bg-primary-dark/95 p-4 sm:p-5 text-white shadow-[0_24px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl ring-1 ring-white/10"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>
                <span className="text-xs font-extrabold uppercase tracking-wider text-white">
                  Direktkontakt Hannachi
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-white/55 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Kontaktmenü schließen"
              >
                <X size={16} />
              </button>
            </div>

            <p className="mt-2.5 text-xs text-white/70 leading-relaxed">
              Formular ausfüllen &amp; direkt per WhatsApp an Herrn Hannachi senden:
            </p>

            {isServiceNoticeActive && serviceNotice && (
              <div
                role="status"
                aria-live="polite"
                className="mt-2.5 flex items-start gap-2 rounded-xl border border-amber-400/35 bg-amber-400/12 px-3 py-2 text-[11px] text-amber-100"
              >
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-amber-400/25 text-amber-300">
                  <Clock size={11} aria-hidden="true" />
                </span>
                <div className="min-w-0 leading-snug">
                  <span className="font-extrabold uppercase tracking-wide text-amber-300 mr-1.5">
                    {serviceNotice.label || "Servicezeiten"}:
                  </span>
                  <span className="text-white/90">{serviceNotice.message}</span>
                </div>
              </div>
            )}

            <div className="mt-3.5 space-y-2">
              {/* 1. Complete Repair Request -> WhatsApp */}
              <motion.button
                type="button"
                variants={menuItemVariants}
                onClick={() => {
                  setOpen(false);
                  openQuickRequest("Waschmaschine", "", "", "repair");
                }}
                className="w-full text-left group flex items-center justify-between rounded-2xl border border-accent/40 bg-accent p-3 text-xs font-bold text-white shadow-md shadow-accent/20 transition-all hover:bg-accent-dark cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white">
                    <Sparkles size={16} />
                  </span>
                  <span>
                    <span className="block text-xs font-extrabold">Gerät / Ersatzteil anfragen</span>
                    <span className="block text-[11px] font-medium text-white/85">
                      Gerätekauf, Ersatzteil &amp; Garantie → WhatsApp
                    </span>
                  </span>
                </span>
                <ArrowRight
                  size={14}
                  className="text-white group-hover:translate-x-0.5 transition-transform"
                />
              </motion.button>

              {/* 2. Direct Question -> WhatsApp */}
              <motion.button
                type="button"
                variants={menuItemVariants}
                onClick={() => {
                  setOpen(false);
                  openQuickRequest("Waschmaschine", "", "", "question");
                }}
                className="w-full text-left group flex items-center justify-between rounded-2xl border border-emerald-500/35 bg-emerald-500/15 p-3 text-xs font-bold text-emerald-300 transition-all hover:bg-emerald-600 hover:text-white hover:border-emerald-500 hover:shadow-md cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/25 text-emerald-300 group-hover:bg-white/20 group-hover:text-white transition-colors">
                    <MessageCircle size={16} />
                  </span>
                  <span>
                    <span className="block text-xs font-extrabold">Direkte Frage stellen</span>
                    <span className="block text-[11px] font-medium text-emerald-200/75 group-hover:text-white/90">
                      Frage ausfüllen → fertig für WhatsApp
                    </span>
                  </span>
                </span>
                <ArrowRight
                  size={14}
                  className="opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                />
              </motion.button>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-white/55">
              <span>{phone} · Iburger Str. 5</span>
              <span className="text-emerald-300 font-semibold">Nur WhatsApp</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Floating Trigger Button */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          permanentlyDisableIntroPulse();
          setOpen((prev) => !prev);
        }}
        onMouseEnter={() => {
          if (introPulseActive) {
            permanentlyDisableIntroPulse();
          }
        }}
        className={`floating-support-trigger group relative flex h-13 sm:h-14 items-center gap-2.5 rounded-2xl px-4 sm:px-5 text-white shadow-[0_14px_34px_rgba(14,165,233,0.42)] ring-2 transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300/60 ${
          open
            ? "bg-primary-dark ring-white/20"
            : "bg-accent hover:bg-accent-dark ring-emerald-300/45"
        }`}
        aria-label={
          open
            ? "Kontaktmenü schließen"
            : isServiceNoticeActive
            ? "WhatsApp & Kontakt öffnen – Hinweis zu geänderten Servicezeiten"
            : "WhatsApp & Kontakt öffnen"
        }
        aria-expanded={open}
      >
        {showIntroPulse && (
          <span
            aria-hidden="true"
            className="floating-support-intro-halo pointer-events-none absolute -inset-1 rounded-2xl"
          />
        )}
        <AnimatePresence>
          {isServiceNoticeActive && !open && (
            <motion.span
              key="service-notice-blink-badge"
              initial={{ opacity: 0, scale: 0.75, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.75, y: 4 }}
              transition={{ duration: 0.2 }}
              data-testid="floating-support-service-notice-blink-badge"
              className="floating-service-notice-blink pointer-events-none absolute -top-2.5 -right-1 z-10 inline-flex items-center gap-1 rounded-full border border-white/85 bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-950 shadow-md"
            >
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-slate-950/70 opacity-80" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-slate-950" />
              </span>
              <Clock size={10} className="shrink-0" aria-hidden="true" />
              <span>{shortNoticeBadgeText}</span>
            </motion.span>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close-icon"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.16 }}
              className="flex items-center gap-2 text-xs sm:text-sm font-extrabold"
            >
              <X size={19} />
              <span>Schließen</span>
            </motion.span>
          ) : (
            <motion.span
              key="open-icon"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.16 }}
              className="flex items-center gap-2 text-xs sm:text-sm font-extrabold whitespace-nowrap"
            >
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-300 shrink-0" />
              <MessageCircle
                size={18}
                className="floating-support-whatsapp-icon shrink-0"
              />
              <span>Kontakt</span>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Dismissible Info Badge for active maintenance or vacation periods in Stammdaten */}
      <AnimatePresence>
        {isServiceNoticeActive && serviceNotice && !noticeDismissed && (
          <motion.div
            key="floating-support-info-badge"
            role="status"
            aria-live="polite"
            data-testid="floating-support-info-badge"
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.94 }}
            transition={{ duration: 0.2 }}
            className="mt-2 flex max-w-[min(calc(100vw-2.25rem),17rem)] items-center gap-2 rounded-xl border border-amber-400/35 bg-primary-dark/95 px-2.5 py-1.5 text-[11px] text-white/90 shadow-lg backdrop-blur-xl ring-1 ring-white/10"
          >
            <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-300">
              <Info size={11} aria-hidden="true" />
              <span>{serviceNotice.label || "Info"}</span>
            </span>
            <span className="min-w-0 flex-1 leading-snug text-white/85">
              {serviceNotice.message}
            </span>
            <button
              type="button"
              onClick={() => setNoticeDismissed(true)}
              aria-label="Info-Hinweis schließen"
              className="shrink-0 rounded-md p-0.5 text-white/55 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <X size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}

/**
 * Unified Physical Motion & Scroll Reveal Controller for `.card` elements:
 * 1. Smoothly reveals standalone `.card` elements entering the viewport (skipping cards already inside Framer Motion reveals so there is never a double-animation clash).
 * 2. On PC (fine pointer): drives real spring-damped 3D physical tilt (`--tilt-x`, `--tilt-y`) and optical specular light sheen (`--sheen-x`, `--sheen-y`) following actual cursor position.
 * 3. On Phone (touch pointer): drives tactile directional press depth (`--tilt-x`, `--tilt-y`, `data-touch-pressed`) toward the exact thumb contact point and releases smoothly on scroll/end.
 */
export function CardScrollRevealObserver({ routeKey }: { routeKey: string }) {
  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const prefersReduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (prefersReduced) {
      return undefined;
    }

    const activeTimers = new Set<number>();

    const revealCard = (card: HTMLElement, delayMs = 0) => {
      if (card.dataset.cardReveal === "visible" || card.dataset.cardReveal === "done") {
        return;
      }
      if (delayMs > 0) {
        card.style.transitionDelay = `${delayMs}ms`;
      }
      card.dataset.cardReveal = "visible";

      const timer = window.setTimeout(() => {
        activeTimers.delete(timer);
        card.style.transitionDelay = "";
        card.dataset.cardReveal = "done";
      }, 560 + delayMs);
      activeTimers.add(timer);
    };

    const observer =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries, obs) => {
              let batchIdx = 0;
              for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                const card = entry.target as HTMLElement;
                obs.unobserve(card);
                revealCard(card, Math.min(batchIdx * 50, 180));
                batchIdx += 1;
              }
            },
            {
              threshold: 0.04,
              rootMargin: "0px 0px -16px 0px",
            }
          )
        : null;

    const registerCards = () => {
      const root = document.getElementById("main") || document.body;
      const cards = root.querySelectorAll<HTMLElement>(".card");
      const viewportCutoff = window.innerHeight * 0.96;

      cards.forEach((card) => {
        card.dataset.tiltBound = "true";
        if (card.dataset.cardReveal) return;

        // Avoid double-animating cards already wrapped by Framer Motion, skeletons, or marquee cards
        if (
          card.classList.contains("animate-pulse") ||
          card.hasAttribute("data-review-card") ||
          card.closest('[data-motion-reveal="true"]')
        ) {
          card.dataset.cardReveal = "done";
          return;
        }

        const rect = card.getBoundingClientRect();
        if (rect.top <= viewportCutoff || !observer) {
          card.dataset.cardReveal = "done";
          return;
        }

        card.dataset.cardReveal = "pending";
        observer.observe(card);
      });
    };

    const rafId = window.requestAnimationFrame(registerCards);
    const settleTimer = window.setTimeout(registerCards, 320);
    activeTimers.add(settleTimer);

    // Coalesce MutationObserver scans via rAF so rapid typing/toggles never thrash layout
    let mutRaf = 0;
    const mainEl = document.getElementById("main") || document.body;
    const mutationObserver = new MutationObserver((records) => {
      if (mutRaf) return;
      const hasAddedElements = records.some((r) => r.addedNodes.length > 0);
      if (!hasAddedElements) return;
      mutRaf = window.requestAnimationFrame(() => {
        mutRaf = 0;
        registerCards();
      });
    });
    mutationObserver.observe(mainEl, { childList: true, subtree: true });

    // ── Studio Cursor Spotlight Controller (Cached DOMRect, rAF-coalesced, zero layout thrashing) ──
    const isFinePointer = window.matchMedia?.("(hover: hover) and (pointer: fine)").matches ?? false;
    let activeCard: HTMLElement | null = null;
    let activeRect: DOMRect | null = null;
    let moveRaf = 0;
    let pendingClientX = 0;
    let pendingClientY = 0;

    const resetCardSpotlight = (card: HTMLElement | null) => {
      if (!card) return;
      card.removeAttribute("data-touch-pressed");
      card.style.setProperty("--sheen-opacity", "0");
    };

    const findEligibleCard = (target: EventTarget | null): HTMLElement | null => {
      if (!(target instanceof Element)) return null;
      const card = target.closest<HTMLElement>(".card");
      if (!card) return null;
      if (
        card.closest('[data-spatial-3d="true"]') ||
        card.classList.contains("animate-pulse") ||
        card.querySelector("iframe")
      ) {
        return null;
      }
      return card;
    };

    const commitSpotlight = () => {
      moveRaf = 0;
      if (!activeCard || !activeRect || activeRect.width <= 0 || activeRect.height <= 0) return;
      const relX = Math.max(0, Math.min(1, (pendingClientX - activeRect.left) / activeRect.width));
      const relY = Math.max(0, Math.min(1, (pendingClientY - activeRect.top) / activeRect.height));
      activeCard.style.setProperty("--sheen-x", `${(relX * 100).toFixed(1)}%`);
      activeCard.style.setProperty("--sheen-y", `${(relY * 100).toFixed(1)}%`);
      activeCard.style.setProperty("--sheen-opacity", "1");
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isFinePointer || e.pointerType !== "mouse") return;
      const card = findEligibleCard(e.target);

      if (card !== activeCard) {
        resetCardSpotlight(activeCard);
        activeCard = card;
        if (card) {
          const rect = card.getBoundingClientRect();
          if (rect.height > 680) {
            activeCard = null;
            activeRect = null;
            return;
          }
          activeRect = rect;
        } else {
          activeRect = null;
        }
      }
      if (!activeCard || !activeRect) return;

      pendingClientX = e.clientX;
      pendingClientY = e.clientY;
      if (!moveRaf) {
        moveRaf = window.requestAnimationFrame(commitSpotlight);
      }
    };

    const handlePointerLeaveDoc = () => {
      resetCardSpotlight(activeCard);
      activeCard = null;
      activeRect = null;
    };

    const invalidateActiveRect = () => {
      if (activeCard) {
        activeRect = activeCard.getBoundingClientRect();
      }
    };

    let pressedTouchCard: HTMLElement | null = null;
    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      const card = findEligibleCard(e.target);
      if (!card) return;
      pressedTouchCard = card;
      card.dataset.touchPressed = "true";
    };

    const releaseTouchCard = () => {
      if (!pressedTouchCard) return;
      resetCardSpotlight(pressedTouchCard);
      pressedTouchCard = null;
    };

    const onScrollOrResize = () => {
      releaseTouchCard();
      invalidateActiveRect();
    };

    if (isFinePointer) {
      document.addEventListener("pointermove", handlePointerMove, { passive: true });
      document.addEventListener("pointerleave", handlePointerLeaveDoc, { passive: true });
    } else {
      document.addEventListener("pointerdown", handlePointerDown, { passive: true });
      document.addEventListener("pointerup", releaseTouchCard, { passive: true });
      document.addEventListener("pointercancel", releaseTouchCard, { passive: true });
    }
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", invalidateActiveRect, { passive: true });

    return () => {
      window.cancelAnimationFrame(rafId);
      if (mutRaf) window.cancelAnimationFrame(mutRaf);
      if (moveRaf) window.cancelAnimationFrame(moveRaf);
      resetCardSpotlight(activeCard);
      resetCardSpotlight(pressedTouchCard);
      activeTimers.forEach((t) => window.clearTimeout(t));
      activeTimers.clear();
      observer?.disconnect();
      mutationObserver.disconnect();
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerleave", handlePointerLeaveDoc);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("pointerup", releaseTouchCard);
      document.removeEventListener("pointercancel", releaseTouchCard);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", invalidateActiveRect);
    };
  }, [routeKey]);

  return null;
}



/* ── Premium masked word reveal ────────────────────────────────────────────
   Each word slides up from behind an invisible mask. Transform + opacity only
   (GPU-composited), plays once, and renders plain text for reduced motion. */
type RevealSegment = { text: string; className?: string };

export function RevealText({
  segments,
  trigger = "inView",
  delay = 0,
  stagger = 0.045,
}: {
  /** Text pieces; each piece may carry its own className (e.g. a gradient). */
  segments: RevealSegment[];
  /** "mount" plays on load (hero), "inView" when scrolled into view. */
  trigger?: "mount" | "inView";
  delay?: number;
  stagger?: number;
}) {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) {
    return (
      <>
        {segments.map((seg, i) => (
          <span key={i} className={seg.className}>
            {seg.text}
          </span>
        ))}
      </>
    );
  }

  let wordIndex = 0;
  const playProps =
    trigger === "mount"
      ? { animate: "shown" as const }
      : { whileInView: "shown" as const, viewport: { once: true, amount: 0.6 } };

  return (
    <motion.span initial="hidden" {...playProps} className="inline">
      {segments.map((seg, segIdx) =>
        seg.text.split(/(\s+)/).map((word, i) => {
          if (!word) return null;
          if (/^\s+$/.test(word)) return <span key={`${segIdx}-${i}`}> </span>;
          const idx = wordIndex++;
          return (
            <span
              key={`${segIdx}-${i}`}
              className="inline-block overflow-hidden align-bottom pb-[0.08em] -mb-[0.08em]"
            >
              <motion.span
                className={`inline-block will-change-transform ${seg.className ?? ""}`}
                variants={{
                  hidden: { y: "105%", opacity: 0 },
                  shown: {
                    y: "0%",
                    opacity: 1,
                    transition: { duration: 0.72, delay: delay + idx * stagger, ease: smooth },
                    transitionEnd: { willChange: "auto" },
                  },
                }}
              >
                {word}
              </motion.span>
            </span>
          );
        })
      )}
    </motion.span>
  );
}

/* ── Oversized footer wordmark that rises letter by letter ── */
export function WordmarkReveal({
  text,
  className = "",
  letterClassName = "",
}: {
  text: string;
  className?: string;
  letterClassName?: string;
}) {
  const prefersReduced = useReducedMotion();
  return (
    <motion.p
      aria-hidden="true"
      initial={prefersReduced ? false : "hidden"}
      whileInView="shown"
      viewport={{ once: true, amount: 0.4 }}
      className={`flex w-full items-center justify-center whitespace-nowrap select-none overflow-hidden leading-[0.88] ${className}`}
    >
      {text.split("").map((ch, i) => (
        <motion.span
          key={i}
          className={`inline-block shrink-0 ${letterClassName}`}
          variants={{
            hidden: { y: "100%" },
            shown: { y: "0%", transition: { duration: 0.9, delay: i * 0.05, ease: smooth } },
          }}
        >
          {ch}
        </motion.span>
      ))}
    </motion.p>
  );
}
