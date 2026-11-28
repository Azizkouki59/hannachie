"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useDragControls,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type PanInfo,
  type Variants,
} from "framer-motion";
import {
  Menu,
  X,
  Phone,
  ArrowRight,
  MapPin,
  Home,
  PackageSearch,
  Sparkles,
  Star,
  Sun,
  Moon,
  MessageCircle,
} from "lucide-react";
import { business } from "@/data/site";
import { useQuickRequest } from "@/components/QuickRequestSheet";
import { useTheme } from "@/components/ThemeProvider";
import { useGoogleLivePlace } from "@/lib/googlePlaceLive";
import { hapticDismiss, triggerHapticFeedback } from "@/lib/haptics";

const drawerListVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.045, delayChildren: 0.03 },
  },
};

const drawerItemVariants: Variants = {
  hidden: { opacity: 0, y: -8, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 420, damping: 30 },
  },
};

const HANNACHI_LETTERS = ["H", "a", "n", "n", "a", "c", "h", "i"] as const;

const desktopNav = [
  { href: "/", label: "Startseite" },
  { href: "/leistungen", label: "Geräte & Teile" },
  { href: "/kundenbewertungen", label: "Bewertungen" },
  { href: "/ueber-uns", label: "Über uns" },
  { href: "/kontakt", label: "Kontakt" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { place, ratingFormatted } = useGoogleLivePlace();
  const [open, setOpen] = useState(false);
  const [contactWidgetOpen, setContactWidgetOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const { isOpen: isQuickRequestOpen, openQuickRequest } = useQuickRequest();
  const { isDark, toggleTheme } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const drawerDragControls = useDragControls();
  const { scrollYProgress } = useScroll();
  const smoothScrollProgress = useSpring(scrollYProgress, {
    stiffness: 280,
    damping: 32,
    restDelta: 0.001,
  });
  const logoLineScaleX = useTransform(smoothScrollProgress, [0, 1], [0.16, 1]);

  const mobileDrawerPages = [
    {
      href: "/",
      label: "Startseite",
      sub: "Beratung & Originalteile seit 1990",
      icon: Home,
    },
    {
      href: "/leistungen",
      label: "Geräte & Teile",
      sub: "Originalteile · Geräte auf Anfrage",
      icon: PackageSearch,
    },
    {
      href: "/kundenbewertungen",
      label: "Bewertungen",
      sub: `${ratingFormatted} ★ · ${place.userRatingCount} Stimmen`,
      icon: Star,
    },
    {
      href: "/ueber-uns",
      label: "Über uns",
      sub: `${business.owner} · Seit ${business.founded}`,
      icon: Sparkles,
    },
    {
      href: "/kontakt",
      label: "Kontakt",
      sub: "Termine nach Vereinbarung",
      icon: MapPin,
    },
  ];

  const handleDrawerDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.y < -55 || info.velocity.y < -360) {
      hapticDismiss();
      setOpen(false);
    }
  };

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onContactState = (event: Event) => {
      const custom = event as CustomEvent<{ open?: boolean }>;
      const nextOpen = Boolean(custom.detail?.open);
      setContactWidgetOpen(nextOpen);
      if (nextOpen) {
        setOpen(false);
      }
    };
    const onCloseMobileNav = () => {
      setOpen(false);
    };
    window.addEventListener("hannachi-contact-widget-state", onContactState);
    window.addEventListener("hannachi-close-mobile-nav", onCloseMobileNav);
    return () => {
      window.removeEventListener("hannachi-contact-widget-state", onContactState);
      window.removeEventListener("hannachi-close-mobile-nav", onCloseMobileNav);
    };
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPinned(!entry.isIntersecting || (open && window.scrollY > 0));
      },
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const prevHtmlOverflowY = document.documentElement.style.overflowY;
    document.documentElement.style.overflowY = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.documentElement.style.overflowY = prevHtmlOverflowY;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" className="h-0 w-full" />
      {isPinned && (
        <div aria-hidden="true" className="h-[68px] lg:h-[74px] w-full shrink-0" />
      )}
      <header className={isPinned ? "fixed top-0 inset-x-0 z-50" : "sticky top-0 z-50"}>
        {/* Backdrop anchored beneath top bar & drawer */}
        <AnimatePresence>
          {open && (
            <motion.div
              key="mobile-nav-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-10 bg-black/65 backdrop-blur-xs touch-none overscroll-none lg:hidden"
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

      {/* Top Navigation Bar (Clean 68px/74px midnight-sapphire architectural header) */}
      <div
        className={`relative z-30 h-[68px] lg:h-[74px] border-b border-white/[0.08] bg-[#071126]/95 backdrop-blur-2xl transition-[box-shadow,background-color] duration-200 ${
          isPinned
            ? "bg-[#060f22]/98 shadow-[0_14px_34px_-14px_rgba(2,6,23,0.78)]"
            : ""
        }`}
      >
        <div className="container-page relative flex h-full items-center justify-between gap-3 sm:gap-5 lg:gap-8 xl:grid xl:grid-cols-[1fr_auto_1fr] xl:items-center xl:gap-8">
          {/* Zone 1: Integrated Animated Hannachi Crest + Letter-by-Letter Wordmark + Scroll-Driven Ruby Line */}
          <div className="flex flex-1 min-w-0 max-w-full h-full items-center lg:flex-initial xl:justify-self-start">
            <Link
              href="/"
              onClick={() => triggerHapticFeedback(35)}
              className="group relative inline-flex items-center gap-2.5 sm:gap-3 whitespace-nowrap py-1 focus-visible:outline-offset-4 rounded-xl"
              aria-label="Hannachi: zur Startseite"
            >
              {/* Animated Signature Cobalt-Sapphire H-Crest */}
              <motion.span
                initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.04 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex h-[38px] w-[38px] sm:h-[42px] sm:w-[42px] shrink-0 items-center justify-center select-none"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 64 64"
                  className="h-full w-full overflow-visible drop-shadow-[0_4px_12px_rgba(14,165,233,0.28)]"
                >
                  <defs>
                    <radialGradient id="navCrestCore" cx="38%" cy="30%" r="80%">
                      <stop offset="0%" stopColor="#1749B2" />
                      <stop offset="48%" stopColor="#0C2E7A" />
                      <stop offset="100%" stopColor="#071844" />
                    </radialGradient>
                    <linearGradient id="navCrestArc" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#1974B8" stopOpacity="0.45" />
                      <stop offset="55%" stopColor="#64B5EC" />
                      <stop offset="100%" stopColor="#BAE6FD" />
                    </linearGradient>
                    <linearGradient id="navCrestRuby" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#F27D8E" />
                      <stop offset="50%" stopColor="#C92A42" />
                      <stop offset="100%" stopColor="#A11E33" />
                    </linearGradient>
                  </defs>

                  {/* Deep cobalt medallion */}
                  <ellipse cx="32" cy="33" rx="25" ry="22" fill="url(#navCrestCore)" />
                  {/* Subtle top glass sheen */}
                  <ellipse
                    cx="32"
                    cy="24"
                    rx="18"
                    ry="9.5"
                    fill="#FFFFFF"
                    fillOpacity="0.12"
                  />
                  {/* Fine sapphire rim */}
                  <ellipse
                    cx="32"
                    cy="33"
                    rx="24.6"
                    ry="21.6"
                    fill="none"
                    stroke="#64B5EC"
                    strokeWidth="1.25"
                    strokeOpacity="0.58"
                  />
                  {/* Luminous sky-sapphire sweeping arc */}
                  <motion.path
                    d="M 11.5 46.5 A 26.5 23.5 0 0 1 56.5 24.5"
                    fill="none"
                    stroke="url(#navCrestArc)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    initial={prefersReducedMotion ? false : { pathLength: 0, opacity: 0.2 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0.01 }
                        : { duration: 0.72, delay: 0.08, ease: [0.22, 1, 0.36, 1] }
                    }
                  />
                  {/* Crisp geometric ruby H */}
                  <path
                    d="M 21.5 22.5 H 27.5 V 30.2 H 36.5 V 22.5 H 42.5 V 43.5 H 36.5 V 35.4 H 27.5 V 43.5 H 21.5 Z"
                    fill="#040B1F"
                    fillOpacity="0.45"
                    transform="translate(0, 1.2)"
                  />
                  <path
                    d="M 21.5 22.5 H 27.5 V 30.2 H 36.5 V 22.5 H 42.5 V 43.5 H 36.5 V 35.4 H 27.5 V 43.5 H 21.5 Z"
                    fill="url(#navCrestRuby)"
                  />
                </svg>
              </motion.span>

              {/* Hannachi wordmark (staggered fade-in + slide-up) + Scroll-driven ruby line */}
              <span aria-hidden="true" className="inline-flex flex-col items-stretch">
                <span className="inline-flex items-baseline overflow-hidden">
                  {HANNACHI_LETTERS.map((char, idx) => (
                    <motion.span
                      key={`${char}-${idx}`}
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={
                        prefersReducedMotion
                          ? { duration: 0.01 }
                          : {
                              duration: 0.42,
                              delay: 0.05 + idx * 0.044,
                              ease: [0.22, 1, 0.36, 1],
                            }
                      }
                      className="inline-block font-sans text-[22px] min-[375px]:text-[24px] sm:text-[26px] lg:text-[28px] font-black tracking-[-0.025em] leading-none bg-gradient-to-b from-[#F27D8E] via-[#E13B55] to-[#C92A42] bg-clip-text text-transparent pb-[2px] will-change-transform"
                    >
                      {char}
                    </motion.span>
                  ))}
                </span>

                {/* Scroll-driven ruby accent line directly underneath Hannachi */}
                <motion.span
                  initial={prefersReducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0.01 }
                      : { duration: 0.4, delay: 0.22, ease: [0.22, 1, 0.36, 1] }
                  }
                  className="relative mt-[3px] h-[2.5px] w-full rounded-full bg-white/[0.1]"
                >
                  <motion.span
                    style={prefersReducedMotion ? undefined : { scaleX: logoLineScaleX }}
                    className="absolute inset-0 origin-left rounded-full bg-gradient-to-r from-[#A11E33] via-[#C92A42] to-[#E86A7D] shadow-[0_0_8px_rgba(201,42,66,0.55)] will-change-transform"
                  />
                </motion.span>
              </span>
            </Link>
          </div>

          {/* Zone 2: 5 Clean Single-Line Navigation Links (True Center) */}
          <nav aria-label="Hauptnavigation" className="hidden lg:flex xl:justify-self-center items-center gap-6 xl:gap-8">
            {desktopNav.map((n) => {
              const active = isActive(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative py-2.5 text-[14px] xl:text-[14.5px] tracking-[0.005em] whitespace-nowrap shrink-0 transition-colors duration-150 ${
                    active
                      ? "text-white font-bold"
                      : "text-slate-300/85 font-medium hover:text-white"
                  }`}
                >
                  <span>{n.label}</span>
                  {active && (
                    <motion.span
                      layoutId="desktop-nav-underline"
                      transition={
                        prefersReducedMotion
                          ? { duration: 0.1 }
                          : { type: "spring", stiffness: 360, damping: 32 }
                      }
                      aria-hidden="true"
                      className="absolute inset-x-0.5 -bottom-0.5 h-[2px] rounded-full bg-gradient-to-r from-[#C92A42] to-[#E86A7D]"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Zone 3: Minimal Theme Icon Toggle + Symmetrical Ruby CTA + Mobile Menu */}
          <div className="relative z-10 flex items-center gap-2 sm:gap-2.5 shrink-0 xl:justify-self-end">
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(35);
                toggleTheme();
              }}
              aria-label={isDark ? "Hellmodus aktivieren" : "Dunkelmodus aktivieren"}
              aria-pressed={isDark}
              title={isDark ? "Zum Hellmodus wechseln" : "Zum Dunkelmodus wechseln"}
              className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] lg:h-10 lg:w-10 lg:min-h-[40px] lg:min-w-[40px] items-center justify-center rounded-xl border border-white/12 bg-white/[0.045] text-slate-200 transition-colors duration-150 hover:border-white/25 hover:bg-white/[0.1] hover:text-white active:scale-95 shrink-0 cursor-pointer"
            >
              {isDark ? (
                <Sun size={16} className="text-amber-200" aria-hidden="true" />
              ) : (
                <Moon size={16} className="text-sky-200" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={() => openQuickRequest()}
              aria-expanded={isQuickRequestOpen}
              className="hero-cta-specular group hidden lg:inline-flex h-10 min-h-[40px] items-center gap-2 rounded-xl border border-[#E86A7D]/45 bg-gradient-to-b from-[#C92A42] to-[#A11E33] px-5 text-[13.5px] font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_20px_-6px_rgba(201,42,66,0.48)] transition-all duration-150 hover:from-[#D4334C] hover:to-[#AE2238] hover:-translate-y-px whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Anfragen</span>
              <ArrowRight size={14} className="transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
            </button>

            <button
              type="button"
              className={`inline-flex items-center justify-center gap-2 h-11 min-h-[44px] w-11 min-w-[44px] sm:w-auto sm:px-4 rounded-xl border text-[13px] font-bold transition-colors duration-150 active:scale-95 lg:hidden whitespace-nowrap cursor-pointer ${
                open
                  ? "border-[#E86A7D]/55 bg-[#C92A42] text-white shadow-[0_6px_18px_-4px_rgba(201,42,66,0.48)]"
                  : "border-white/12 bg-white/[0.045] text-white hover:border-white/25 hover:bg-white/[0.1]"
              }`}
              aria-expanded={open}
              aria-controls="mobile-nav-drawer"
              aria-label={open ? "Menü schließen" : "Seitenmenü öffnen"}
              onClick={() => {
                triggerHapticFeedback(35);
                if (!open && contactWidgetOpen) {
                  window.dispatchEvent(new CustomEvent("hannachi-close-contact-widget"));
                }
                setOpen((o) => !o);
              }}
            >
              {open ? <X size={17} aria-hidden="true" /> : <Menu size={17} aria-hidden="true" />}
              <span className="hidden sm:inline">{open ? "Zu" : "Menü"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Animated Mobile Navigation Drawer anchored cleanly directly beneath top bar */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile-nav-sheet"
            id="mobile-nav-sheet"
            drag={prefersReducedMotion ? false : "y"}
            dragControls={drawerDragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.9, bottom: 0.05 }}
            onDragEnd={handleDrawerDragEnd}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -16 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -18 }}
            transition={
              prefersReducedMotion
                ? { duration: 0.12 }
                : { type: "spring", stiffness: 390, damping: 32, mass: 0.85 }
            }
            className="absolute inset-x-0 top-full z-20 rounded-b-3xl border-b border-white/12 bg-primary-dark/98 dark:bg-slate-950/98 backdrop-blur-2xl text-white shadow-2xl lg:hidden max-h-[calc(100dvh-4.25rem-env(safe-area-inset-bottom))] overflow-y-auto overscroll-contain will-change-transform"
          >
            <nav
              id="mobile-nav-drawer"
              aria-label="Mobile Seitennavigation"
              className="container-page pt-3.5 sm:pt-5 pb-2 max-w-2xl"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold uppercase tracking-wider text-accent-light">
                  Hausgeräte-Spezialist · Osnabrück
                </span>
                <span className="text-[11px] font-medium text-white/55">Seit {business.founded}</span>
              </div>

              <motion.ul
                variants={prefersReducedMotion ? undefined : drawerListVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2"
              >
                {mobileDrawerPages.map((p) => {
                  const active = isActive(p.href);
                  const Icon = p.icon;
                  return (
                    <motion.li
                      key={p.href}
                      variants={prefersReducedMotion ? undefined : drawerItemVariants}
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                      className={p.href === "/" ? "min-[360px]:col-span-2" : ""}
                    >
                      <Link
                        href={p.href}
                        onClick={() => {
                          triggerHapticFeedback(35);
                          setOpen(false);
                        }}
                        aria-current={active ? "page" : undefined}
                        className={`flex min-h-[54px] sm:min-h-[58px] items-center justify-between gap-3 rounded-2xl border px-3.5 py-2.5 transition-colors ${
                          active
                            ? "border-accent bg-accent text-white shadow-md shadow-accent/25"
                            : "border-white/10 bg-white/[0.04] text-white hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              active ? "bg-white/20 text-white" : "bg-accent/15 text-accent-light"
                            }`}
                          >
                            <Icon size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-extrabold truncate">{p.label}</p>
                            <p
                              className={`text-xs truncate ${
                                active ? "text-white/90" : "text-white/60"
                              }`}
                            >
                              {p.sub}
                            </p>
                          </div>
                        </div>
                        <ArrowRight
                          size={16}
                          className={`shrink-0 ${active ? "text-white" : "text-white/40"}`}
                        />
                      </Link>
                    </motion.li>
                  );
                })}
              </motion.ul>

              <div className="mt-4 pt-3.5 border-t border-white/10 space-y-2.5">
                <div className="grid grid-cols-1 min-[340px]:grid-cols-2 gap-2.5">
                  <motion.a
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                    href={place.phoneHref}
                    onClick={() => triggerHapticFeedback(50)}
                    className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/8 px-3 py-2.5 text-xs font-extrabold text-white hover:bg-white/15 transition-colors min-w-0"
                  >
                    <Phone size={15} className="text-emerald-400 shrink-0" />
                    <span className="truncate">{place.phoneDisplay}</span>
                  </motion.a>
                  <motion.a
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                    href={business.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      triggerHapticFeedback(50);
                      setOpen(false);
                    }}
                    className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-700 transition-colors whitespace-nowrap min-w-0"
                  >
                    <MessageCircle size={15} className="shrink-0" />
                    <span className="truncate">WhatsApp starten</span>
                  </motion.a>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-white/70">
                  <span className="truncate">{place.hoursSummary}</span>
                  <a
                    href={business.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => triggerHapticFeedback(35)}
                    className="inline-flex min-h-[44px] items-center px-1.5 -mr-1.5 font-bold text-sky-300 hover:underline shrink-0"
                  >
                    Facebook →
                  </a>
                </div>
              </div>
            </nav>

            {/* Swipe-Up Handle Bar for Easy Thumb Dismissal */}
            <div
              onPointerDown={(e) => {
                if (!prefersReducedMotion) {
                  drawerDragControls.start(e);
                }
              }}
              aria-hidden="true"
              className="flex w-full items-center justify-center pt-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] touch-none select-none cursor-grab active:cursor-grabbing"
            >
              <span className="h-1 w-10 rounded-full bg-white/25" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </header>
    </>
  );
}
