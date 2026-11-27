"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useDragControls,
  useReducedMotion,
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
import HannachiBrandLogo from "@/components/HannachiBrandLogo";

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

  const currentPageLabel =
    mobileDrawerPages.find((p) => isActive(p.href))?.label || "Startseite";

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" className="h-0 w-full" />
      {isPinned && (
        <div aria-hidden="true" className="h-[56px] lg:h-16 w-full shrink-0" />
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

      {/* Top Navigation Bar (Sits at z-30 so swiping the drawer upward glides smoothly underneath it) */}
      <div
        className={`relative z-30 h-[56px] lg:h-16 border-b border-white/10 bg-primary-dark/95 dark:bg-slate-950/95 backdrop-blur-xl transition-shadow duration-200 ${
          isPinned ? "shadow-[0_10px_30px_-10px_rgba(2,6,23,0.6)]" : ""
        }`}
      >
        <div className="container-page flex h-full items-center justify-between gap-2 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-4 xl:gap-6">
          {/* Zone 1: Clean Brand Wordmark + Subtle Mobile Page Context */}
          <div className="flex items-center gap-2.5 min-w-0 lg:justify-self-start">
            <Link
              href="/"
              onClick={() => triggerHapticFeedback(35)}
              className="group inline-flex h-11 min-h-[44px] items-center gap-2.5 text-[17px] sm:text-lg lg:text-xl font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-accent-light transition-colors"
              aria-label="Hannachi: zur Startseite"
            >
              <HannachiBrandLogo
                size={28}
                className="sm:h-8 sm:w-8 transition-transform duration-200 group-hover:scale-[1.04]"
              />
              <span>Hannachi</span>
            </Link>

            {/* Mobile Active Page Indicator */}
            <span className="hidden min-[400px]:inline lg:hidden min-w-0 text-[11px] font-medium text-white/55 truncate border-l border-white/15 pl-2.5">
              {currentPageLabel}
            </span>
          </div>

          {/* Zone 2: 5 Concise Single-Line Desktop Navigation Links (True Center) */}
          <nav aria-label="Hauptnavigation" className="hidden lg:flex lg:justify-self-center items-center gap-5 xl:gap-8">
            {desktopNav.map((n) => {
              const active = isActive(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative py-1.5 text-[13.5px] xl:text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                    active ? "text-white font-semibold" : "text-white/75 hover:text-white"
                  }`}
                >
                  <span>{n.label}</span>
                  {active && (
                    <motion.span
                      layoutId="desktop-nav-underline"
                      transition={
                        prefersReducedMotion
                          ? { duration: 0.1 }
                          : { type: "spring", stiffness: 300, damping: 30 }
                      }
                      aria-hidden="true"
                      className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.7)]"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Zone 3: Theme Toggle + CTA + Mobile Menu Drawer Button */}
          <div className="flex items-center gap-1.5 lg:gap-2 shrink-0 lg:justify-self-end">
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(35);
                toggleTheme();
              }}
              aria-label={isDark ? "Hellmodus aktivieren" : "Dunkelmodus aktivieren"}
              aria-pressed={isDark}
              title={isDark ? "Zum Hellmodus wechseln" : "Zum Dunkelmodus wechseln"}
              className="inline-flex h-10 w-10 min-h-[40px] min-w-[40px] lg:w-auto items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-2.5 text-xs font-bold text-white transition-colors duration-150 hover:border-accent/60 hover:bg-white/20 active:scale-95 whitespace-nowrap cursor-pointer"
            >
              {isDark ? (
                <span className="inline-flex items-center gap-1.5 text-amber-300">
                  <Sun size={15} aria-hidden="true" />
                  <span className="hidden xl:inline text-white/90">Hell</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sky-300">
                  <Moon size={15} aria-hidden="true" />
                  <span className="hidden xl:inline text-white/90">Dunkel</span>
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => openQuickRequest()}
              aria-expanded={isQuickRequestOpen}
              className="hidden lg:inline-flex min-h-[40px] items-center gap-1.5 xl:gap-2 rounded-xl bg-accent px-3.5 xl:px-4 py-1.5 text-xs xl:text-sm font-bold text-white shadow-xs transition-all duration-150 hover:bg-accent-dark hover:-translate-y-px whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Anfragen</span>
              <ArrowRight size={14} />
            </button>

            <button
              type="button"
              className={`inline-flex items-center justify-center gap-1.5 h-10 min-h-[40px] min-w-[40px] px-2.5 sm:px-3 rounded-xl border text-xs font-extrabold transition-colors duration-150 active:scale-95 lg:hidden whitespace-nowrap cursor-pointer ${
                open
                  ? "border-accent bg-accent text-white shadow-sm"
                  : "border-white/15 bg-white/10 text-white hover:bg-white/20"
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
              {open ? <X size={16} aria-hidden="true" /> : <Menu size={16} aria-hidden="true" />}
              <span className="hidden min-[360px]:inline">{open ? "Zu" : "Menü"}</span>
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
            className="absolute inset-x-0 top-full z-20 rounded-b-3xl border-b border-white/12 bg-primary-dark/98 dark:bg-slate-950/98 backdrop-blur-2xl text-white shadow-2xl lg:hidden max-h-[calc(100dvh-4rem-env(safe-area-inset-bottom))] overflow-y-auto overscroll-contain will-change-transform"
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
