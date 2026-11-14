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
  UsersRound,
  Cpu,
  Sun,
  Moon,
} from "lucide-react";
import { business } from "@/data/site";
import { useQuickRequest } from "@/components/QuickRequestSheet";
import { useTheme } from "@/components/ThemeProvider";

const desktopNav = [
  { href: "/", label: "Startseite" },
  { href: "/leistungen", label: "Leistungen" },
  { href: "/simulator", label: "Simulator & Teile" },
  { href: "/kundenbewertungen", label: "Bewertungen" },
  { href: "/ueber-uns", label: "Über uns" },
];

const mobileDrawerPages = [
  {
    href: "/",
    label: "Startseite",
    sub: "Übersicht & Schnellstart",
    icon: Home,
  },
  {
    href: "/leistungen",
    label: "Unsere Leistungen",
    sub: "Alle Haushaltsgeräte & Marken im Katalog",
    icon: Wrench,
  },
  {
    href: "/simulator",
    label: "Fehlersimulator & Ersatzteile",
    sub: "Interaktive Geräte-Diagnose & Originalteile",
    icon: Cpu,
  },
  {
    href: "/anfrage",
    label: "Reparaturanfrage",
    sub: "Online-Konfigurator in 3 Schritten",
    icon: Sparkles,
  },
  {
    href: "/kundenbewertungen",
    label: "Kundenbewertungen",
    sub: "4,8 ★ (82 Google-Rezensionen)",
    icon: Star,
  },
  {
    href: "/ueber-uns",
    label: "Über uns & Werkstatt",
    sub: "Kamal Hannachi · Fachbetrieb seit 1990",
    icon: UsersRound,
  },
  {
    href: "/kontakt",
    label: "Kontakt & Anfahrt",
    sub: "Iburger Straße 5, Osnabrück & Anfahrt",
    icon: MapPin,
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { isOpen: isQuickRequestOpen, openQuickRequest } = useQuickRequest();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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
    <header className="static lg:sticky lg:top-0 z-50 border-b border-white/10 bg-primary-dark lg:bg-primary-dark/95 dark:bg-slate-950 lg:dark:bg-slate-950/95 lg:backdrop-blur-xl transition-colors duration-200">
      <div className="container-page static flex h-14 sm:h-[68px] items-center justify-between gap-2 sm:gap-4 lg:gap-6">
        {/* Zone 1: Single text element wordmark */}
        <Link
          href="/"
          className="text-base sm:text-xl font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-accent-light transition-colors"
          aria-label="Hannachi – zur Startseite"
        >
          Hannachi
        </Link>

        {/* Mobile Center Active Page Title */}
        <span className="lg:hidden min-w-0 text-[11px] sm:text-xs font-semibold text-white/70 truncate">
          {currentPageLabel}
        </span>

        {/* Zone 2: Desktop Navigation Links */}
        <nav aria-label="Hauptnavigation" className="hidden lg:flex items-center gap-7">
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

        {/* Zone 3: Theme Toggle, Primary Action & Mobile Drawer Trigger */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* User-Controlled Dark Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Hellmodus aktivieren" : "Dunkelmodus aktivieren"}
            aria-pressed={isDark}
            title={isDark ? "Zum Hellmodus wechseln" : "Zum Dunkelmodus wechseln"}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-2.5 sm:px-3 text-xs font-bold text-white transition-all hover:border-accent/60 hover:bg-white/20 active:scale-95 whitespace-nowrap cursor-pointer"
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
                  <Sun size={17} />
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
                  <Moon size={17} />
                  <span className="hidden xl:inline text-white/90">Dunkel</span>
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <button
            type="button"
            onClick={() => openQuickRequest()}
            aria-expanded={isQuickRequestOpen}
            className="hidden lg:inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-accent-dark whitespace-nowrap shrink-0 cursor-pointer"
          >
            Reparatur anfragen
            <ArrowRight size={14} />
          </button>

          <button
            type="button"
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 min-h-[42px] min-w-[44px] px-2.5 sm:px-3 rounded-xl border border-white/15 bg-white/10 text-white text-xs font-bold transition-all hover:bg-white/20 active:scale-95 lg:hidden whitespace-nowrap cursor-pointer"
            aria-expanded={open}
            aria-controls="mobile-nav-drawer"
            aria-label={open ? "Menü schließen" : "Seitenmenü öffnen"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
            <span className="hidden min-[360px]:inline">{open ? "Schließen" : "Seiten"}</span>
          </button>
        </div>
      </div>

      {/* Static In-Flow Mobile Navigation Menu (always visible directly beneath the top bar when toggled) */}
      {open && (
        <div
          id="mobile-nav-drawer"
          className="border-t border-white/10 bg-primary-dark dark:bg-slate-950 text-white lg:hidden"
        >
          <nav aria-label="Mobile Seitennavigation" className="container-page py-4 sm:py-5">
            {/* Mobile Drawer Quick Theme Switch Row */}
            <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-white/12 bg-white/[0.05] px-3.5 sm:px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-accent-light">
                  {isDark ? <Moon size={17} className="text-sky-300" /> : <Sun size={17} className="text-amber-300" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-white truncate">
                    Darstellung: {isDark ? "Dunkelmodus" : "Hellmodus"}
                  </p>
                  <p className="text-[11px] text-white/60 truncate">
                    {isDark ? "Augenschonend bei wenig Licht" : "Klassische Tageslichtansicht"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                aria-pressed={isDark}
                className="inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 active:scale-95 transition-all whitespace-nowrap cursor-pointer"
              >
                {isDark ? (
                  <>
                    <Sun size={14} className="text-amber-300" />
                    <span>Hell</span>
                  </>
                ) : (
                  <>
                    <Moon size={14} className="text-sky-300" />
                    <span>Dunkel</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-wider text-accent-light">
                Alle Seiten (einzeln wählbar)
              </p>
              <span className="text-[11px] text-white/50">7 Bereiche</span>
            </div>

            {/* Dedicated Page Cards */}
            <ul className="grid gap-2">
              {mobileDrawerPages.map((p) => {
                const active = isActive(p.href);
                const Icon = p.icon;
                return (
                  <li key={p.href}>
                    <Link
                      href={p.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-[56px] items-center justify-between gap-3 rounded-2xl border px-3.5 sm:px-4 py-2.5 sm:py-3 transition-all active:scale-[0.98] ${
                        active
                          ? "border-accent bg-accent text-white shadow-md shadow-accent/20"
                          : "border-white/10 bg-white/[0.04] text-white hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl ${
                            active ? "bg-white/20 text-white" : "bg-accent/15 text-accent-light"
                          }`}
                        >
                          <Icon size={17} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-extrabold truncate">{p.label}</p>
                          <p
                            className={`text-xs truncate ${
                              active ? "text-white/85" : "text-white/60"
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

            {/* Drawer Contact Footer */}
            <div className="mt-5 pt-4 border-t border-white/10">
              <p className="text-center text-[11px] text-white/55">
                <Phone size={12} className="inline mr-1 text-accent-light" />
                Werkstatt: {business.phoneDisplay} · Versand ausschließlich per WhatsApp
              </p>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
