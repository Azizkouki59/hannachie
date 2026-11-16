"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Phone,
  ArrowRight,
  MapPin,
  Home,
  Wrench,
  Sparkles,
  Star,
  Sun,
  Moon,
  MessageCircle,
} from "lucide-react";
import { business } from "@/data/site";
import { useQuickRequest } from "@/components/QuickRequestSheet";
import { useTheme } from "@/components/ThemeProvider";
import { triggerHapticFeedback } from "@/lib/haptics";

const desktopNav = [
  { href: "/", label: "Startseite" },
  { href: "/leistungen", label: "Service & Geräte" },
  { href: "/kundenbewertungen", label: "Bewertungen" },
  { href: "/ueber-uns", label: "Über uns" },
  { href: "/kontakt", label: "Kontakt" },
];

const mobileDrawerPages = [
  {
    href: "/",
    label: "Startseite",
    sub: "Mobiler Vor-Ort-Service & Ersatzteile",
    icon: Home,
  },
  {
    href: "/leistungen",
    label: "Service & Geräte",
    sub: "Vor-Ort-Check, Ersatzteile & Ersatzgeräte mit Garantie",
    icon: Wrench,
  },
  {
    href: "/kundenbewertungen",
    label: "Bewertungen",
    sub: "4,8 ★ Google-Rezensionen (82 Kundenstimmen)",
    icon: Star,
  },
  {
    href: "/ueber-uns",
    label: "Über uns",
    sub: "Kamal Hannachi · Seit 1990 in Osnabrück",
    icon: Sparkles,
  },
  {
    href: "/kontakt",
    label: "Kontakt",
    sub: "Vor-Ort-Termine & persönliche Beratung in Osnabrück",
    icon: MapPin,
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [contactWidgetOpen, setContactWidgetOpen] = useState(false);
  const { isOpen: isQuickRequestOpen, openQuickRequest } = useQuickRequest();
  const { isDark, toggleTheme } = useTheme();

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
    window.addEventListener("hannachi-contact-widget-state", onContactState);
    return () => {
      window.removeEventListener("hannachi-contact-widget-state", onContactState);
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const currentPageLabel =
    mobileDrawerPages.find((p) => isActive(p.href))?.label || "Startseite";

  return (
    <header className="sticky top-0 z-50 h-12 lg:h-16 border-b border-white/10 bg-primary-dark/95 dark:bg-slate-950/95 backdrop-blur-xl">
      <div className="container-page flex h-12 lg:h-16 items-center justify-between gap-2 lg:gap-8">
          {/* Zone 1: Brand Wordmark + Mobile Subtitle */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Link
              href="/"
              onClick={() => triggerHapticFeedback(35)}
              className="inline-flex h-11 min-h-[44px] items-center gap-1.5 sm:gap-2 text-base sm:text-lg lg:text-xl font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-accent-light transition-colors"
              aria-label="Hannachi – zur Startseite"
            >
              <span>Hannachi</span>
              <span className="hidden min-[355px]:inline-flex lg:hidden items-center gap-1 rounded-md border border-white/12 bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-bold text-accent-light">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                <span>Vor-Ort</span>
              </span>
            </Link>

            {/* Mobile Active Page Indicator */}
            <span className="hidden sm:inline lg:hidden min-w-0 text-[11px] font-medium text-white/60 truncate border-l border-white/15 pl-2">
              {currentPageLabel}
            </span>
          </div>

          {/* Zone 2: 5 Concise Single-Line Desktop Navigation Links */}
          <nav aria-label="Hauptnavigation" className="hidden lg:flex items-center gap-6 xl:gap-7">
            {desktopNav.map((n) => {
              const active = isActive(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative py-1 text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                    active
                      ? "text-white font-semibold after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-accent"
                      : "text-white/75 hover:text-white"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          {/* Zone 3: Theme Toggle + Menu Drawer (Positioned cleanly to the left of the pinned top-right circular contact button) */}
          <div className="flex items-center gap-1.5 lg:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(35);
                toggleTheme();
              }}
              aria-label={isDark ? "Hellmodus aktivieren" : "Dunkelmodus aktivieren"}
              aria-pressed={isDark}
              title={isDark ? "Zum Hellmodus wechseln" : "Zum Dunkelmodus wechseln"}
              className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] lg:h-10 lg:w-auto lg:min-h-[40px] lg:min-w-[40px] items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-2.5 text-xs font-bold text-white transition-all hover:border-accent/60 hover:bg-white/20 active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <AnimatePresence mode="wait" initial={false}>
                {isDark ? (
                  <motion.span
                    key="theme-sun"
                    initial={{ rotate: -65, scale: 0.7, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    exit={{ rotate: 65, scale: 0.7, opacity: 0 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="inline-flex items-center gap-1.5 text-amber-300"
                  >
                    <Sun size={15} />
                    <span className="hidden xl:inline text-white/90">Hell</span>
                  </motion.span>
                ) : (
                  <motion.span
                    key="theme-moon"
                    initial={{ rotate: 65, scale: 0.7, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    exit={{ rotate: -65, scale: 0.7, opacity: 0 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="inline-flex items-center gap-1.5 text-sky-300"
                  >
                    <Moon size={15} />
                    <span className="hidden xl:inline text-white/90">Dunkel</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <button
              type="button"
              onClick={() => openQuickRequest()}
              aria-expanded={isQuickRequestOpen}
              className="hidden lg:inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-accent px-4 py-1.5 text-xs sm:text-sm font-bold text-white shadow-xs transition-colors duration-150 hover:bg-accent-dark whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Unverbindlich anfragen</span>
              <ArrowRight size={14} />
            </button>

            <button
              type="button"
              className={`inline-flex items-center justify-center gap-1.5 h-11 min-h-[44px] min-w-[44px] px-2.5 sm:px-3 rounded-xl border text-xs font-extrabold transition-all active:scale-95 lg:hidden whitespace-nowrap cursor-pointer ${
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
              {open ? <X size={16} /> : <Menu size={16} />}
              <span className="hidden min-[360px]:inline">{open ? "Zu" : "Menü"}</span>
            </button>
          </div>
        </div>

        {/* Animated Mobile Navigation Drawer + Backdrop */}
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                key="mobile-nav-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                onClick={() => setOpen(false)}
                className="fixed inset-x-0 top-12 bottom-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
                aria-hidden="true"
              />
            <motion.div
              key="mobile-nav-sheet"
              id="mobile-nav-drawer"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-50 border-t border-white/10 bg-primary-dark/98 dark:bg-slate-950/98 text-white shadow-2xl lg:hidden max-h-[calc(100dvh-3rem)] overflow-y-auto overscroll-contain"
            >
              <nav aria-label="Mobile Seitennavigation" className="container-page py-4 sm:py-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-accent-light">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
                    <span>Mobiler Vor-Ort-Service · Osnabrück</span>
                  </div>
                  <span className="text-[11px] font-medium text-white/55">Seit {business.founded}</span>
                </div>

                <ul className="grid gap-2">
                  {mobileDrawerPages.map((p) => {
                    const active = isActive(p.href);
                    const Icon = p.icon;
                    return (
                      <li key={p.href}>
                        <Link
                          href={p.href}
                          onClick={() => {
                            triggerHapticFeedback(35);
                            setOpen(false);
                          }}
                          aria-current={active ? "page" : undefined}
                          className={`flex min-h-[58px] items-center justify-between gap-3 rounded-2xl border px-3.5 py-2.5 transition-all active:scale-[0.99] ${
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
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-4 pt-3.5 border-t border-white/10 grid grid-cols-2 gap-2.5">
                  <a
                    href={business.phoneHref}
                    onClick={() => triggerHapticFeedback(50)}
                    className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/8 px-3 py-2.5 text-xs font-extrabold text-white hover:bg-white/15 active:scale-[0.98] transition-all"
                  >
                    <Phone size={15} className="text-emerald-400 shrink-0" />
                    <span className="truncate">{business.phoneDisplay}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHapticFeedback(50);
                      setOpen(false);
                      openQuickRequest();
                    }}
                    className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-accent px-3.5 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-accent-dark active:scale-[0.98] transition-all whitespace-nowrap cursor-pointer"
                  >
                    <MessageCircle size={15} className="shrink-0" />
                    <span>Vor-Ort-Anfrage</span>
                  </button>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
