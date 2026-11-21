"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Home, MapPin, MessageCircle, Phone, Wrench } from "lucide-react";
import { business } from "@/data/site";
import { useGoogleLivePlace } from "@/lib/googlePlaceLive";
import { hapticTap, triggerHapticFeedback } from "@/lib/haptics";
import {
  loadRepairDraft,
  REPAIR_DRAFT_EVENT,
  toWhatsAppInput,
  type RepairDraft,
} from "@/lib/repairRequest";
import { createHannachiWhatsAppPayload } from "@/utils/whatsapp";
import { useQuickRequest } from "@/components/QuickRequestSheet";

export interface MobileBottomDockProps {
  phoneHref?: string;
  whatsappHref?: string;
}

export default function MobileBottomDock({
  phoneHref = business.phoneHref,
  whatsappHref = business.whatsappHref,
}: MobileBottomDockProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const { place, source } = useGoogleLivePlace();
  const { isOpen: isQuickRequestOpen } = useQuickRequest();
  const [savedDraft, setSavedDraft] = useState<RepairDraft | null>(() =>
    loadRepairDraft()
  );
  const [isScrolled, setIsScrolled] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const next = window.scrollY > 24;
      setIsScrolled((curr) => (curr !== next ? next : curr));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const isTextInput = (el: Element | null): boolean => {
      if (!el) return false;
      const tag = el.tagName;
      if (tag === "TEXTAREA" || tag === "SELECT") return true;
      if (tag === "INPUT") {
        const type = ((el as HTMLInputElement).type || "text").toLowerCase();
        return ![
          "checkbox",
          "radio",
          "button",
          "submit",
          "reset",
          "file",
          "range",
          "color",
        ].includes(type);
      }
      return (el as HTMLElement).isContentEditable === true;
    };

    const handleFocusIn = (e: FocusEvent) => {
      if (window.innerWidth < 1024 && isTextInput(e.target as Element | null)) {
        setIsKeyboardOpen(true);
      }
    };

    const handleFocusOut = () => {
      window.setTimeout(() => {
        if (!isTextInput(document.activeElement)) {
          setIsKeyboardOpen(false);
        }
      }, 80);
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);
    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  useEffect(() => {
    const syncDraft = () => {
      setSavedDraft(loadRepairDraft());
    };
    syncDraft();
    window.addEventListener(REPAIR_DRAFT_EVENT, syncDraft);
    window.addEventListener("storage", syncDraft);
    return () => {
      window.removeEventListener(REPAIR_DRAFT_EVENT, syncDraft);
      window.removeEventListener("storage", syncDraft);
    };
  }, [isQuickRequestOpen, pathname]);

  const draftWhatsAppResult = useMemo(() => {
    if (!savedDraft?.values) return null;
    try {
      const payload = createHannachiWhatsAppPayload(
        toWhatsAppInput({ ...savedDraft.values, photo: null })
      );
      return payload.valid ? payload.whatsappUrl : null;
    } catch {
      return null;
    }
  }, [savedDraft]);

  const effectivePhoneHref = place.phoneHref || phoneHref;
  const effectiveWhatsappHref = draftWhatsAppResult || whatsappHref;
  const isLiveClosed = source === "live" && place.openNow === false;
  const shouldHideDock = isKeyboardOpen || isQuickRequestOpen;

  const cleanPath =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  const isHomeActive = cleanPath === "/";
  const isServiceActive = cleanPath.startsWith("/leistungen");
  const isContactActive =
    cleanPath.startsWith("/kontakt") || cleanPath.startsWith("/anfrage");

  const handleNavTap = () => {
    hapticTap();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hannachi-close-mobile-nav"));
    }
  };

  const tabSpring = prefersReducedMotion
    ? { duration: 0.1 }
    : { type: "spring" as const, stiffness: 420, damping: 34 };

  return (
    <motion.nav
      aria-label="Mobile Schnellnavigation & Direktkontakt"
      data-testid="mobile-bottom-dock"
      initial={prefersReducedMotion ? false : { y: 24, opacity: 0 }}
      animate={
        shouldHideDock ? { y: 96, opacity: 0 } : { y: 0, opacity: 1 }
      }
      transition={
        prefersReducedMotion
          ? { duration: 0.1 }
          : { type: "spring", stiffness: 380, damping: 34 }
      }
      aria-hidden={shouldHideDock}
      className={`fixed inset-x-0 bottom-0 z-40 lg:hidden pointer-events-none px-2.5 sm:px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] ${
        shouldHideDock ? "invisible" : ""
      }`}
    >
      {/* Calm, Always-Labeled Glassmorphic Touch Dock */}
      <div
        className={`pointer-events-auto relative mx-auto grid w-full max-w-xl md:max-w-2xl grid-cols-5 items-stretch gap-1 sm:gap-1.5 rounded-2xl border p-1 sm:p-1.5 text-white backdrop-blur-xl transition-shadow duration-200 ${
          isScrolled
            ? "border-white/15 bg-primary-dark/96 dark:bg-slate-900/96 shadow-[0_18px_44px_rgba(2,6,23,0.72),inset_0_1px_0_rgba(255,255,255,0.12)]"
            : "border-white/12 bg-primary-dark/94 dark:bg-slate-900/94 shadow-[0_14px_34px_rgba(2,6,23,0.58),inset_0_1px_0_rgba(255,255,255,0.10)]"
        }`}
      >
        {/* 1. Start */}
        <Link
          href="/"
          onClick={handleNavTap}
          aria-current={isHomeActive ? "page" : undefined}
          data-testid="mobile-dock-home"
          className={`relative flex min-w-0 min-h-[48px] flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 rounded-xl px-1 sm:px-2.5 py-1.5 transition-colors active:scale-[0.96] ${
            isHomeActive ? "text-white" : "text-white/65 hover:text-white"
          }`}
        >
          {isHomeActive && (
            <motion.span
              layoutId="mobile-dock-active-pill"
              transition={tabSpring}
              className="absolute inset-0 rounded-xl bg-sky-500/18 ring-1 ring-sky-400/35"
              aria-hidden="true"
            />
          )}
          <Home
            size={18}
            strokeWidth={isHomeActive ? 2.25 : 1.85}
            className={`relative z-10 shrink-0 ${isHomeActive ? "text-sky-300" : ""}`}
            aria-hidden="true"
          />
          <span
            className={`relative z-10 text-[10px] sm:text-xs tracking-tight leading-none truncate ${
              isHomeActive ? "font-bold text-white" : "font-medium"
            }`}
          >
            Start
          </span>
        </Link>

        {/* 2. Service */}
        <Link
          href="/leistungen"
          onClick={handleNavTap}
          aria-current={isServiceActive ? "page" : undefined}
          data-testid="mobile-dock-service"
          className={`relative flex min-w-0 min-h-[48px] flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 rounded-xl px-1 sm:px-2.5 py-1.5 transition-colors active:scale-[0.96] ${
            isServiceActive ? "text-white" : "text-white/65 hover:text-white"
          }`}
        >
          {isServiceActive && (
            <motion.span
              layoutId="mobile-dock-active-pill"
              transition={tabSpring}
              className="absolute inset-0 rounded-xl bg-sky-500/18 ring-1 ring-sky-400/35"
              aria-hidden="true"
            />
          )}
          <Wrench
            size={18}
            strokeWidth={isServiceActive ? 2.25 : 1.85}
            className={`relative z-10 shrink-0 ${isServiceActive ? "text-sky-300" : ""}`}
            aria-hidden="true"
          />
          <span
            className={`relative z-10 text-[10px] sm:text-xs tracking-tight leading-none truncate ${
              isServiceActive ? "font-bold text-white" : "font-medium"
            }`}
          >
            Service
          </span>
        </Link>

        {/* 3. Direct Call CTA */}
        <a
          href={effectivePhoneHref}
          onClick={() => triggerHapticFeedback(50)}
          aria-label={`Jetzt anrufen: ${place.phoneDisplay || business.phoneDisplay}`}
          data-testid="mobile-dock-call"
          className="relative flex min-w-0 min-h-[48px] flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 rounded-xl border border-emerald-400/35 bg-emerald-500/18 px-1 sm:px-2.5 py-1.5 text-white hover:bg-emerald-500/28 active:scale-[0.96] transition-all"
        >
          <span className="relative flex items-center justify-center">
            <Phone
              size={18}
              strokeWidth={2.2}
              className="text-emerald-300 shrink-0"
              aria-hidden="true"
            />
            {source === "live" && place.openNow !== null && (
              <span
                aria-hidden="true"
                className={`absolute -top-0.5 -right-1 h-1.5 w-1.5 rounded-full ${
                  isLiveClosed ? "bg-amber-400" : "bg-emerald-400"
                }`}
              />
            )}
          </span>
          <span className="text-[10px] sm:text-xs font-bold tracking-tight leading-none text-emerald-100 truncate">
            Anrufen
          </span>
        </a>

        {/* 4. Direct WhatsApp CTA */}
        <a
          href={effectiveWhatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => triggerHapticFeedback(50)}
          aria-label={
            draftWhatsAppResult
              ? "Ausgefüllte Anfrage jetzt per WhatsApp senden"
              : "WhatsApp-Nachricht an Herrn Hannachi senden"
          }
          data-testid="mobile-dock-whatsapp"
          className={`relative flex min-w-0 min-h-[48px] flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 rounded-xl border px-1 sm:px-2.5 py-1.5 text-white active:scale-[0.96] transition-all ${
            draftWhatsAppResult
              ? "border-[#4ADE80]/65 bg-[#25D366]/28 hover:bg-[#25D366]/36"
              : "border-[#4ADE80]/35 bg-[#25D366]/18 hover:bg-[#25D366]/26"
          }`}
        >
          <span className="relative flex items-center justify-center">
            <MessageCircle
              size={18}
              strokeWidth={2.2}
              className="text-[#4ADE80] shrink-0"
              aria-hidden="true"
            />
            {draftWhatsAppResult && (
              <span
                aria-hidden="true"
                className="absolute -top-0.5 -right-1 h-1.5 w-1.5 rounded-full bg-[#4ADE80]"
              />
            )}
          </span>
          <span className="text-[10px] sm:text-xs font-bold tracking-tight leading-none text-emerald-50 truncate">
            {draftWhatsAppResult ? "Senden" : "WhatsApp"}
          </span>
        </a>

        {/* 5. Kontakt */}
        <Link
          href="/kontakt"
          onClick={handleNavTap}
          aria-current={isContactActive ? "page" : undefined}
          data-testid="mobile-dock-kontakt"
          className={`relative flex min-w-0 min-h-[48px] flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 rounded-xl px-1 sm:px-2.5 py-1.5 transition-colors active:scale-[0.96] ${
            isContactActive ? "text-white" : "text-white/65 hover:text-white"
          }`}
        >
          {isContactActive && (
            <motion.span
              layoutId="mobile-dock-active-pill"
              transition={tabSpring}
              className="absolute inset-0 rounded-xl bg-sky-500/18 ring-1 ring-sky-400/35"
              aria-hidden="true"
            />
          )}
          <span className="relative z-10 flex items-center justify-center">
            <MapPin
              size={18}
              strokeWidth={isContactActive ? 2.25 : 1.85}
              className={isContactActive ? "text-sky-300" : ""}
              aria-hidden="true"
            />
            {savedDraft && !isContactActive && (
              <span
                aria-hidden="true"
                title="Gespeicherte Anfrage fortsetzen"
                className="absolute -top-0.5 -right-1 h-1.5 w-1.5 rounded-full bg-sky-400"
              />
            )}
          </span>
          <span
            className={`relative z-10 text-[10px] sm:text-xs tracking-tight leading-none truncate ${
              isContactActive ? "font-bold text-white" : "font-medium"
            }`}
          >
            Kontakt
          </span>
        </Link>
      </div>
    </motion.nav>
  );
}
