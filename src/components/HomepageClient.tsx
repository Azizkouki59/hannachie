"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
  useScroll,
} from "framer-motion";
import {
  Phone,
  Star,
  ArrowRight,
  CheckCircle2,
  Shield,
  Award,
  MessageCircle,
  MapPin,
  PackageSearch,
  ShieldCheck,
  Zap,
  Check,
} from "lucide-react";
import {
  FadeUp,
  StaggerContainer,
  StaggerItem,
  CountUp,
  ScrollProgressBar,
  Spatial3DCard,
  Spatial3DPhoto,
  RevealText,
  BrandLogoTicker,
} from "@/components/animations";
import { business, yearsOfExperience } from "@/data/site";
import RepairForm, { type RequestTypeId } from "@/components/RepairForm";
import type { InquiryMode } from "@/lib/repairRequest";
import HowWeWorkSection from "@/components/HowWeWorkSection";
import { GoogleReviewsSection } from "@/components/GoogleReviewsSection";
import ApplianceLogo from "@/components/ApplianceLogo";
import { buildWhatsAppDirectUrl, getDeviceEmoji } from "@/utils/whatsapp";
import {
  herrHannachiImage,
} from "@/data/images";
import { generatedPhotos, type GeneratedPhotoAsset } from "@/data/generatedPhotos";
import { usePreloadHeroImages } from "@/lib/usePreloadHeroImages";
import { useGoogleLivePlace } from "@/lib/googlePlaceLive";
import { hapticTap, triggerHapticFeedback } from "@/lib/haptics";
import { HeroAnimatedBackdrop, SectionAmbientMesh } from "@/components/HeroAnimatedBackdrop";
import SparePartsExplorer3D from "@/components/SparePartsExplorer3D";
import {
  resolveExplorerAppliance,
  type ExplorerApplianceId,
} from "@/components/explorer3d/types";

const FEATURED_APPLIANCE_BRANDS = [
  "Miele",
  "Bosch",
  "Siemens",
  "AEG",
  "Bauknecht",
  "Liebherr",
  "Neff",
  "Constructa",
  "Jura",
  "DeLonghi",
];

const heroQuickDevices = [
  {
    label: "Waschmaschine",
    subtitle: "Beratung & Teile",
    device: "Waschmaschine",
    badgeClass: "bg-sky-500/20 text-sky-300 border-sky-400/30",
    quickProblems: ["Beratung", "Originalteil (E-Nr.)", "Gerät auf Anfrage"],
  },
  {
    label: "Kühlschrank",
    subtitle: "Kühl- & Gefriergeräte",
    device: "Kühlschrank / Gefriergerät",
    badgeClass: "bg-cyan-500/20 text-cyan-300 border-cyan-400/30",
    quickProblems: ["Beratung", "Dichtung / Teil (E-Nr.)", "Gerät auf Anfrage"],
  },
  {
    label: "Geschirrspüler",
    subtitle: "Einbau & Standgerät",
    device: "Geschirrspüler",
    badgeClass: "bg-teal-500/20 text-teal-300 border-teal-400/30",
    quickProblems: ["Beratung", "Pumpe / Korb (E-Nr.)", "Gerät auf Anfrage"],
  },
  {
    label: "Herd / Ofen",
    subtitle: "Beratung & Teile",
    device: "Backofen / Herd",
    badgeClass: "bg-amber-500/20 text-amber-300 border-amber-400/30",
    quickProblems: ["Beratung", "Heizelement / Teil", "Gerät auf Anfrage"],
  },
  {
    label: "Sonstiges",
    subtitle: "Trockner, Kaffee…",
    device: "Sonstiges",
    badgeClass: "bg-indigo-500/20 text-indigo-300 border-indigo-400/30",
    quickProblems: ["Beratung", "Originalteil (E-Nr.)", "Gerät auf Anfrage"],
  },
] as const;

const helpPillars: Array<{
  num: string;
  title: string;
  description: string;
  bullets: string[];
  ctaLabel: string;
  requestType: RequestTypeId;
  icon: typeof PackageSearch;
  photo: GeneratedPhotoAsset;
}> = [
  {
    num: "01",
    title: "Fachberatung",
    description: "Ehrliche Einschätzung direkt vom Inhaber.",
    bullets: [
      `${yearsOfExperience}+ Jahre Erfahrung seit 1990`,
      "Direkt per Telefon & WhatsApp",
      "Termine nach Vereinbarung",
    ],
    ctaLabel: "Beratung anfragen",
    requestType: "check_parts",
    icon: PackageSearch,
    photo: generatedPhotos.pillarConsultation,
  },
  {
    num: "02",
    title: "Original-Ersatzteile",
    description: "Passgenaue Teile nach Typenschild (E-Nr.).",
    bullets: [
      "Prüfung per Typenschild-Foto",
      "Pumpen, Dichtungen, Filter & mehr",
      "Alle bekannten Marken",
    ],
    ctaLabel: "Ersatzteil anfragen",
    requestType: "check_parts",
    icon: ShieldCheck,
    photo: generatedPhotos.pillarSpareParts,
  },
  {
    num: "03",
    title: "Markengeräte",
    description: "Ausgewählte geprüfte Geräte auf Anfrage.",
    bullets: [
      "Individuell nach Verfügbarkeit",
      "Inkl. schriftlicher Verkäufergarantie",
      "Persönliche Empfehlung",
    ],
    ctaLabel: "Verfügbarkeit prüfen",
    requestType: "replacement_offer",
    icon: Shield,
    photo: generatedPhotos.pillarAppliances,
  },
];

export default function HomepageClient() {
  const { place, ratingFormatted } = useGoogleLivePlace();
  const { isMobileViewport } = usePreloadHeroImages();
  const prefersReducedMotion = useReducedMotion();
  const heroSectionRef = useRef<HTMLElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);

  // Scroll-linked calm studio depth inside the Hero section
  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroSectionRef,
    offset: ["start start", "end start"],
  });
  const smoothHeroScroll = useSpring(heroScrollProgress, {
    stiffness: 160,
    damping: 28,
    mass: 0.5,
  });
  const desktopPhotoScrollY = useTransform(smoothHeroScroll, [0, 1], [0, 24]);

  // Desktop cursor-tracked optical glare + calibrated CSS 3D micro-tilt on portrait stage (zero React re-renders)
  const portraitRawGlareX = useMotionValue(50);
  const portraitRawGlareY = useMotionValue(50);
  const portraitRawHover = useMotionValue(0);
  const portraitRawRotateX = useMotionValue(0);
  const portraitRawRotateY = useMotionValue(0);

  const glareX = useSpring(portraitRawGlareX, { stiffness: 180, damping: 24 });
  const glareY = useSpring(portraitRawGlareY, { stiffness: 180, damping: 24 });
  const glareOpacity = useSpring(portraitRawHover, { stiffness: 180, damping: 26 });
  const portraitRotateX = useSpring(portraitRawRotateX, { stiffness: 210, damping: 26, mass: 0.7 });
  const portraitRotateY = useSpring(portraitRawRotateY, { stiffness: 210, damping: 26, mass: 0.7 });
  const portraitGlareBg = useMotionTemplate`radial-gradient(380px circle at ${glareX}% ${glareY}%, rgba(224, 242, 254, 0.18), rgba(2, 132, 199, 0.06) 44%, transparent 72%)`;

  const handleConsolePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || e.pointerType !== "mouse" || !consoleRef.current) return;
    const rect = consoleRef.current.getBoundingClientRect();
    consoleRef.current.style.setProperty("--console-x", `${(e.clientX - rect.left).toFixed(1)}px`);
    consoleRef.current.style.setProperty("--console-y", `${(e.clientY - rect.top).toFixed(1)}px`);
    consoleRef.current.style.setProperty("--console-glow", "1");
  };

  const handleConsolePointerLeave = () => {
    if (!consoleRef.current) return;
    consoleRef.current.style.setProperty("--console-glow", "0");
  };

  const handlePortraitPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    portraitRawGlareX.set(nx * 100);
    portraitRawGlareY.set(ny * 100);
    portraitRawRotateY.set((nx - 0.5) * 6.4); // ±3.2deg max calibrated tilt
    portraitRawRotateX.set((0.5 - ny) * 6.4); // ±3.2deg max calibrated tilt
    portraitRawHover.set(1);
  };

  const handlePortraitPointerLeave = () => {
    portraitRawHover.set(0);
    portraitRawRotateX.set(0);
    portraitRawRotateY.set(0);
  };

  const [selectedDevice, setSelectedDevice] = useState<string>("Waschmaschine");
  const [explorerAppliance, setExplorerAppliance] = useState<ExplorerApplianceId>("waschmaschine");
  const [customOtherDevice, setCustomOtherDevice] = useState<string>("");
  const [selectedSymptom, setSelectedSymptom] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [inquiryMode] = useState<InquiryMode>("repair");
  const [selectedRequestType, setSelectedRequestType] = useState<RequestTypeId>("check_parts");
  const [selectionSeq, setSelectionSeq] = useState<number>(0);

  const activeHeroDeviceObj =
    heroQuickDevices.find((d) => d.device === selectedDevice) || heroQuickDevices[0];
  const resolvedHeroDeviceForForm =
    selectedDevice === "Sonstiges" && customOtherDevice.trim()
      ? customOtherDevice.trim()
      : selectedDevice;

  const stats: Array<{
    value: number;
    decimals?: number;
    suffix: string;
    label: string;
    icon: typeof Award;
  }> = [
    { value: yearsOfExperience, suffix: "+ J.", label: "Erfahrung seit 1990", icon: Award },
    {
      value: place.rating,
      decimals: 1,
      suffix: " ★",
      label: `Google (${place.userRatingCount})`,
      icon: Star,
    },
    { value: 1, suffix: " : 1", label: "Direkt mit Inhaber", icon: Shield },
    { value: 24, suffix: " h", label: "Schnelle Antwort", icon: Zap },
  ];

  const handleSelectDevice = (device: string) => {
    hapticTap();
    setSelectedDevice(device);
    setSelectedSymptom("");
    const resolved = resolveExplorerAppliance(device);
    if (resolved) {
      setExplorerAppliance(resolved);
    }
  };

  const handleToggleSymptom = (symptom: string) => {
    hapticTap();
    setSelectedSymptom((prev) => (prev === symptom ? "" : symptom));
  };

  const scrollAndFocusForm = () => {
    const el = document.getElementById("anfrage");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      window.setTimeout(() => {
        const target =
          el.querySelector<HTMLElement>('[data-field="problem"]') ||
          el.querySelector<HTMLElement>('[data-field="phone"]');
        target?.focus({ preventScroll: true });
      }, 420);
    }
  };

  const handleScrollToRequest = () => {
    triggerHapticFeedback(35);
    scrollAndFocusForm();
  };

  const whatsappDeviceLabel =
    selectedDevice === "Sonstiges" && customOtherDevice.trim()
      ? customOtherDevice.trim()
      : activeHeroDeviceObj.label;

  const heroWhatsAppMessage = [
    `👋 *Kurze Anfrage*`,
    `Hallo Herr Hannachi,`,
    ``,
    `${getDeviceEmoji(whatsappDeviceLabel)} *Gerät:* ${whatsappDeviceLabel}`,
    ...(selectedSymptom ? [`🔹 *Anliegen:* ${selectedSymptom}`] : []),
    `📍 *Region:* Osnabrück`,
  ].join("\n");

  const heroDirectWhatsappHref = buildWhatsAppDirectUrl(heroWhatsAppMessage);

  const handleSelectPillar = (reqType: RequestTypeId) => {
    triggerHapticFeedback(35);
    setSelectedRequestType(reqType);
    setSelectionSeq((n) => n + 1);
    scrollAndFocusForm();
  };

  const handleSelectBrandFromMarquee = (brandName: string) => {
    triggerHapticFeedback(30);
    setSelectedBrand(brandName);
    setSelectionSeq((n) => n + 1);
    scrollAndFocusForm();
  };

  const handleRequestPartFromExplorer = (deviceValue: string, symptomText: string) => {
    setSelectedDevice(deviceValue);
    setSelectedSymptom(symptomText);
    setSelectedRequestType("check_parts");
    setSelectionSeq((n) => n + 1);
    scrollAndFocusForm();
  };

  const handleRequestOtherDeviceFromExplorer = () => {
    setSelectedDevice("Sonstiges");
    setSelectedSymptom("");
    setSelectedRequestType("check_parts");
    setSelectionSeq((n) => n + 1);
    scrollAndFocusForm();
  };

  const handleScrollToExplorer = () => {
    hapticTap();
    const resolved = resolveExplorerAppliance(selectedDevice);
    if (resolved) {
      setExplorerAppliance(resolved);
    }
    const el = document.getElementById("3d-explorer");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <ScrollProgressBar />

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1: MOBILE ON-SITE HERO (CLEAR & COMPLIANT)
      ══════════════════════════════════════════════════════════════════ */}
      <section
        ref={heroSectionRef}
        className="relative overflow-hidden bg-primary-dark pt-3 pb-6 sm:pt-9 sm:pb-12 lg:pt-12 lg:pb-14 border-b border-white/10"
      >
        <HeroAnimatedBackdrop variant="hero-water-drum" />

        <div className="container-page relative z-10">
          <div className="grid gap-4 sm:gap-8 lg:grid-cols-12 lg:items-stretch lg:gap-10">
            {/* Left Column (7 cols): Editorial Masked Typography + Specular Glass Console */}
            <div className="lg:col-span-7 flex flex-col justify-center min-w-0">
              {/* Compact Trust Eyebrow */}
              <div className="overflow-hidden">
                <motion.div
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] sm:text-[13px] font-semibold text-white/75"
                >
                  <a
                    href="#kundenstimmen"
                    className="inline-flex items-center gap-1.5 text-accent-light font-extrabold hover:underline"
                  >
                    <Star size={12} className="fill-amber-400 text-amber-400 shrink-0" aria-hidden="true" />
                    <span className="tabular-nums">{ratingFormatted} ★ Google ({place.userRatingCount})</span>
                  </a>
                  <span aria-hidden="true" className="text-white/30">·</span>
                  <span className="font-bold text-white/90">Seit {business.founded} in Osnabrück</span>
                  <span aria-hidden="true" className="text-white/30">·</span>
                  <span className="text-white/80">Termine nach Vereinbarung</span>
                </motion.div>
              </div>

              <div className="overflow-hidden pb-1">
                <h1 className="text-[24px] min-[375px]:text-[27px] sm:text-[36px] lg:text-[42px] font-extrabold leading-[1.14] tracking-[-0.025em] text-white text-balance">
                  <RevealText
                    trigger="mount"
                    delay={0.05}
                    segments={[
                      { text: "Ihr Hausgeräte-Spezialist " },
                      {
                        text: "für Beratung & Original-Ersatzteile",
                        className:
                          "bg-gradient-to-r from-sky-300 via-sky-100 to-white bg-clip-text text-transparent",
                      },
                    ]}
                  />
                </h1>
              </div>

              <motion.p
                initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.13, ease: [0.22, 1, 0.36, 1] }}
                className="mt-2.5 sm:mt-3.5 max-w-[56ch] text-[13.5px] sm:text-[15.5px] lg:text-[16.5px] leading-[1.58] text-white/82"
              >
                Persönliche Fachberatung von Inhaber{" "}
                <strong className="text-white font-semibold">{business.owner}</strong> in{" "}
                {business.city} – seit über{" "}
                <strong className="text-white font-semibold">{yearsOfExperience} Jahren</strong>{" "}
                für passgenaue Original-Ersatzteile nach Typenschild (E-Nr.) und ausgewählte
                Markengeräte auf Anfrage.
              </motion.p>

              {/* Interactive Specular Glass Console: 1-Tap Appliance Selector + Quick Topics + Direct Contact */}
              <motion.div
                ref={consoleRef}
                onPointerMove={handleConsolePointerMove}
                onPointerLeave={handleConsolePointerLeave}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 18, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.58,
                  delay: 0.18,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="hero-glass-console mt-3.5 sm:mt-6 rounded-2xl border border-white/15 bg-gradient-to-b from-white/[0.09] to-white/[0.035] backdrop-blur-md p-2.5 sm:p-4 space-y-2.5 sm:space-y-3 shadow-[0_24px_56px_-18px_rgba(2,6,23,0.72),inset_0_1px_0_rgba(255,255,255,0.12)]"
              >
                <div className="relative z-10 flex items-center justify-between gap-2 text-xs">
                  <span className="font-extrabold text-white min-w-0">
                    Gerät wählen
                  </span>
                  {resolveExplorerAppliance(selectedDevice) !== null ? (
                    <button
                      type="button"
                      onClick={handleScrollToExplorer}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-accent-light hover:text-white transition-colors shrink-0 cursor-pointer"
                    >
                      <span>Bauteile in 3D ↓</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-semibold text-accent-light shrink-0">
                      Tippen &amp; senden
                    </span>
                  )}
                </div>

                {/* Mobile: Symmetric 3+2 App-Tile Grid (100% Visible on Phone) | Tablet & Desktop: 5-Column Row */}
                <div className="relative z-10 grid grid-cols-6 sm:grid-cols-5 gap-1.5 sm:gap-2">
                  {heroQuickDevices.map((item, idx) => {
                    const isSelected = selectedDevice === item.device;
                    return (
                      <motion.button
                        key={item.device}
                        type="button"
                        whileHover={prefersReducedMotion ? undefined : { y: -2 }}
                        whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 460, damping: 28, mass: 0.7 }}
                        onClick={() => handleSelectDevice(item.device)}
                        aria-pressed={isSelected}
                        className={`${
                          idx < 3 ? "col-span-2 sm:col-span-1" : "col-span-3 sm:col-span-1"
                        } relative overflow-hidden min-w-0 min-h-[70px] sm:min-h-0 w-full flex flex-col items-center text-center justify-center gap-1 sm:gap-1.5 rounded-xl sm:rounded-2xl border px-1.5 py-2 sm:py-3 transition-colors duration-200 cursor-pointer ${
                          isSelected
                            ? "border-sky-300/70 text-white shadow-[0_10px_24px_-6px_rgba(2,132,199,0.55)]"
                            : "border-white/12 bg-white/[0.045] text-white/90 hover:border-white/28 hover:bg-white/[0.095]"
                        }`}
                      >
                        {isSelected && (
                          <motion.span
                            layoutId="hero-device-active-bg"
                            transition={
                              prefersReducedMotion
                                ? { duration: 0.1 }
                                : { type: "spring", stiffness: 380, damping: 32, mass: 0.8 }
                            }
                            aria-hidden="true"
                            className="absolute inset-0 overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-b from-sky-500 to-sky-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.42)]"
                          >
                            {/* Magic UI-inspired animated hairline border beam on active device pill */}
                            {!prefersReducedMotion && (
                              <span
                                aria-hidden="true"
                                className="pointer-events-none absolute -inset-[1px] rounded-[inherit] p-[1.5px]"
                                style={{
                                  WebkitMask:
                                    "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                                  WebkitMaskComposite: "xor",
                                  maskComposite: "exclude",
                                }}
                              >
                                <span
                                  className="active-border-beam-rotor block h-[220%] w-[220%] -translate-x-[27%] -translate-y-[27%]"
                                  style={{
                                    background:
                                      "conic-gradient(from 0deg, transparent 0deg, transparent 220deg, rgba(224,242,254,0.95) 285deg, rgba(16,185,129,0.9) 330deg, transparent 360deg)",
                                  }}
                                />
                              </span>
                            )}
                          </motion.span>
                        )}
                        <AnimatePresence>
                          {isSelected && (
                            <motion.span
                              initial={prefersReducedMotion ? false : { scale: 0, rotate: -25 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={prefersReducedMotion ? undefined : { scale: 0 }}
                              transition={{ type: "spring", stiffness: 480, damping: 24 }}
                              className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 z-10 flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-white text-accent shadow-xs"
                            >
                              <Check size={9} strokeWidth={3.5} aria-hidden="true" />
                            </motion.span>
                          )}
                        </AnimatePresence>
                        <motion.span
                          animate={
                            prefersReducedMotion
                              ? undefined
                              : isSelected
                                ? { scale: 1.06, y: -0.5 }
                                : { scale: 1, y: 0 }
                          }
                          transition={{ type: "spring", stiffness: 420, damping: 24 }}
                          className={`relative z-10 flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                            isSelected
                              ? "border-white/35 bg-white/20 text-white"
                              : item.badgeClass
                          }`}
                        >
                          <ApplianceLogo device={item.device} size={22} />
                        </motion.span>
                        <div className="relative z-10 w-full min-w-0">
                          <span className="block truncate text-[10.5px] min-[375px]:text-[11px] xl:text-xs font-extrabold leading-tight tracking-[-0.01em]">
                            {item.label}
                          </span>
                          <span
                            className={`hidden xl:block truncate text-[10px] leading-tight mt-0.5 ${
                              isSelected ? "text-white/85" : "text-white/60"
                            }`}
                          >
                            {item.subtitle}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Optional Custom Name when "Sonstiges Gerät" is chosen */}
                <AnimatePresence initial={false}>
                  {selectedDevice === "Sonstiges" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                      className="relative z-10 overflow-hidden"
                    >
                      <input
                        type="text"
                        value={customOtherDevice}
                        onChange={(e) => setCustomOtherDevice(e.target.value)}
                        placeholder="Welches Gerät genau? (z. B. Trockner, Kaffeevollautomat)"
                        className="w-full min-h-[44px] rounded-xl border border-white/20 bg-slate-950/70 px-3.5 py-2 text-base sm:text-sm text-white placeholder:text-white/45 focus:border-accent focus:outline-none"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 1-Tap Quick-Topics Wrapped Grid */}
                <div className="relative z-10 space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-semibold text-white/75">
                      Ihr Anliegen <span className="text-white/50">(optional)</span>:
                    </span>
                    {selectedSymptom && (
                      <button
                        type="button"
                        onClick={() => setSelectedSymptom("")}
                        className="text-accent-light hover:underline font-semibold cursor-pointer shrink-0"
                      >
                        Zurücksetzen
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeHeroDeviceObj.quickProblems.map((problem) => {
                      const active = selectedSymptom === problem;
                      return (
                        <motion.button
                          key={`${selectedDevice}-${problem}`}
                          type="button"
                          whileHover={prefersReducedMotion ? undefined : { y: -1 }}
                          whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 480, damping: 26 }}
                          onClick={() => handleToggleSymptom(problem)}
                          aria-pressed={active}
                          className={`inline-flex min-h-[42px] sm:min-h-[34px] max-w-full items-center gap-1.5 rounded-xl sm:rounded-lg border px-2.5 py-1.5 sm:py-1 text-[11.5px] sm:text-[11px] font-bold transition-colors text-left leading-tight cursor-pointer ${
                            active
                              ? "border-emerald-400/80 bg-emerald-500/25 text-emerald-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                              : "border-white/15 bg-white/[0.045] text-white/85 hover:border-white/30 hover:bg-white/[0.09] hover:text-white"
                          }`}
                        >
                          <AnimatePresence initial={false} mode="popLayout">
                            {active && (
                              <motion.span
                                key="chip-check"
                                initial={prefersReducedMotion ? false : { scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={prefersReducedMotion ? undefined : { scale: 0, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 520, damping: 24 }}
                                className="inline-flex shrink-0"
                              >
                                <Check size={12} className="text-emerald-300" />
                              </motion.span>
                            )}
                          </AnimatePresence>
                          <span>{problem}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* App-Style Action Dock: Symmetric 2-col Mobile (2 + 1|1) & 12-col Tablet/Desktop (6 + 3 + 3) */}
                <div className="relative z-10 pt-2.5 border-t border-white/12 grid grid-cols-2 sm:grid-cols-12 items-stretch gap-1.5 sm:gap-2">
                  <motion.a
                    whileHover={prefersReducedMotion ? undefined : { y: -1.5 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.975 }}
                    transition={{ type: "spring", stiffness: 460, damping: 26 }}
                    href={heroDirectWhatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => triggerHapticFeedback(50)}
                    data-testid="hero-direct-whatsapp-btn"
                    className="btn-shimmer-beam hero-cta-specular col-span-2 sm:col-span-6 min-w-0 inline-flex min-h-[46px] sm:min-h-[48px] items-center justify-center gap-2 rounded-xl border border-emerald-400/50 bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 px-3 sm:px-3.5 py-2 text-xs sm:text-[13px] font-extrabold text-white shadow-[0_10px_24px_-8px_rgba(16,185,129,0.55),inset_0_1px_0_rgba(255,255,255,0.28)] transition-colors"
                  >
                    <MessageCircle size={16} className="text-white shrink-0" aria-hidden="true" />
                    <span className="truncate inline-flex items-center min-w-0">
                      <span>WhatsApp ·&nbsp;</span>
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                          key={`${whatsappDeviceLabel}-${selectedSymptom}`}
                          initial={prefersReducedMotion ? false : { y: 8, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={prefersReducedMotion ? undefined : { y: -8, opacity: 0 }}
                          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                          className="inline-block truncate"
                        >
                          {whatsappDeviceLabel}
                          {selectedSymptom ? ` (${selectedSymptom})` : ""}
                        </motion.span>
                      </AnimatePresence>
                    </span>
                  </motion.a>
                  <motion.a
                    whileHover={prefersReducedMotion ? undefined : { y: -1 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 480, damping: 26 }}
                    href={place.phoneHref}
                    onClick={() => triggerHapticFeedback(50)}
                    data-testid="hero-direct-call-btn"
                    className="col-span-1 sm:col-span-3 min-w-0 w-full inline-flex min-h-[44px] sm:min-h-[48px] items-center justify-center gap-1.5 rounded-xl border border-white/18 bg-white/[0.07] hover:bg-white/13 hover:border-white/30 px-2.5 py-2 text-[11.5px] sm:text-xs font-extrabold text-white transition-colors tabular-nums overflow-hidden"
                  >
                    <Phone size={13} className="text-emerald-400 shrink-0" aria-hidden="true" />
                    <span className="truncate">{place.phoneDisplay}</span>
                  </motion.a>
                  <motion.button
                    whileHover={prefersReducedMotion ? undefined : { y: -1 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 480, damping: 26 }}
                    type="button"
                    onClick={handleScrollToRequest}
                    data-testid="hero-direct-form-btn"
                    className="group/hero-form col-span-1 sm:col-span-3 min-w-0 w-full inline-flex min-h-[44px] sm:min-h-[48px] items-center justify-center gap-1 sm:gap-1.5 rounded-xl bg-gradient-to-b from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 px-2.5 py-2 text-[11.5px] sm:text-xs font-extrabold text-white shadow-[0_8px_20px_-6px_rgba(2,132,199,0.55),inset_0_1px_0_rgba(255,255,255,0.28)] transition-colors cursor-pointer overflow-hidden"
                  >
                    <span className="truncate">
                      {selectedSymptom ? "Formular" : "Termin"}
                    </span>
                    <ArrowRight
                      size={13}
                      className="shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/hero-form:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </motion.button>
                </div>
              </motion.div>

              {/* Mobile Calm Studio Photo Frame with Mr. Hannachi's Real Photo */}
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.56, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="mt-3.5 lg:hidden"
              >
                <div className="relative overflow-hidden rounded-2xl border border-sky-300/25 bg-slate-900/90 shadow-[0_22px_48px_-14px_rgba(2,6,23,0.85),0_0_0_1px_rgba(56,189,248,0.14),inset_0_1px_0_rgba(255,255,255,0.2)]">
                  <motion.div
                    initial={prefersReducedMotion ? false : { scale: 1.06 }}
                    animate={{ scale: 1.02 }}
                    transition={{ duration: 0.85, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full"
                  >
                    <Image
                      src={herrHannachiImage}
                      alt="Kamal Hannachi – Fachhandel für Elektrohaushaltsgeräte & Original-Ersatzteile in Osnabrück"
                      width={900}
                      height={540}
                      mobilePriority
                      preload
                      placeholder="blur"
                      blurDataURL={herrHannachiImage.blurDataURL}
                      sizes="(max-width: 640px) 94vw, (max-width: 1023px) 92vw, 520px"
                      className="aspect-[16/10] w-full object-cover object-[50%_18%]"
                    />
                  </motion.div>

                  <div className="pointer-events-none absolute inset-0 z-[6] bg-gradient-to-t from-slate-950/95 via-slate-950/28 to-slate-950/15" />

                  <div className="absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1.5 rounded-lg border border-white/22 bg-slate-950/78 px-2.5 py-1 text-[10.5px] font-bold text-sky-200 backdrop-blur-md shadow-md">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>Fachberatung · Seit {business.founded}</span>
                  </div>

                  <div className="hero-badge absolute inset-x-2.5 bottom-2.5 z-10 flex items-center justify-between gap-2.5 rounded-xl border border-white/22 bg-slate-950/88 px-3 py-2.5 backdrop-blur-md text-white">
                    <div className="min-w-0">
                      <p className="text-[12px] font-extrabold leading-tight text-white truncate">
                        {business.owner}
                      </p>
                      <p className="mt-0.5 inline-flex items-center gap-1 text-[10.5px] font-semibold text-white/75 leading-tight max-w-full">
                        <MapPin size={10.5} className="shrink-0 text-accent-light" aria-hidden="true" />
                        <span className="truncate">{business.city} · Termine nach Vereinbarung</span>
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-lg border border-amber-300/25 bg-amber-400/12 px-2 py-1 text-[11px] font-extrabold text-amber-300 tabular-nums shrink-0">
                      <Star size={11} className="fill-amber-300 text-amber-300 shrink-0" aria-hidden="true" />
                      <span>{ratingFormatted}</span>
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column (5 cols): Desktop Studio Portrait Stage with Mr. Hannachi's Real Photo */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.62,
                delay: 0.14,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative hidden lg:flex lg:col-span-5 flex-col"
            >
              <motion.div
                onPointerMove={handlePortraitPointerMove}
                onPointerLeave={handlePortraitPointerLeave}
                style={
                  prefersReducedMotion
                    ? undefined
                    : {
                        rotateX: portraitRotateX,
                        rotateY: portraitRotateY,
                        transformPerspective: 1100,
                      }
                }
                className="relative flex-1 min-h-[360px] overflow-hidden rounded-2xl border border-white/18 bg-slate-900/90 shadow-[0_26px_64px_-18px_rgba(2,6,23,0.84),0_0_0_1px_rgba(255,255,255,0.08)] will-change-transform"
              >
                <motion.div
                  initial={prefersReducedMotion ? false : { scale: 1.07 }}
                  animate={{ scale: 1.03 }}
                  transition={{ duration: 0.95, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0"
                >
                  <motion.div
                    style={prefersReducedMotion ? undefined : { y: desktopPhotoScrollY }}
                    className="relative h-full w-full"
                  >
                    <Image
                      src={herrHannachiImage}
                      alt="Kamal Hannachi – Persönliche Hausgeräte-Beratung & Ersatzteile in Osnabrück"
                      fill
                      priority={!isMobileViewport}
                      preload={!isMobileViewport}
                      quality={95}
                      placeholder="blur"
                      blurDataURL={herrHannachiImage.blurDataURL}
                      sizes="(min-width: 1280px) 500px, (min-width: 1024px) 420px, 95vw"
                      className="object-cover object-[50%_20%]"
                    />
                  </motion.div>
                </motion.div>

                {/* Subtle cursor-tracked studio optical sheen */}
                {!prefersReducedMotion && (
                  <motion.div
                    aria-hidden="true"
                    style={{
                      background: portraitGlareBg,
                      opacity: glareOpacity,
                    }}
                    className="pointer-events-none absolute inset-0 z-[5]"
                  />
                )}

                <div className="pointer-events-none absolute inset-0 z-[6] bg-gradient-to-t from-slate-950/92 via-slate-950/24 to-slate-950/12" />

                <motion.div
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
                  className="hero-badge absolute inset-x-4 bottom-4 z-10 rounded-xl border border-white/22 bg-slate-950/86 px-4 py-3.5 backdrop-blur-md"
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-accent-light font-bold">
                    <span>Hausgeräte-Spezialist seit {business.founded}</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} className="shrink-0" aria-hidden="true" />
                      <span>{business.city} &amp; Umgebung</span>
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-extrabold text-white leading-snug">
                    Persönlich &amp; kompetent: {business.owner}
                  </p>
                  <div className="mt-1.5 pt-1.5 border-t border-white/10 flex items-center justify-between text-[11px] text-white/80">
                    <span>Termine nach Vereinbarung</span>
                    <span className="inline-flex items-center gap-1 font-extrabold text-amber-300 tabular-nums">
                      <Star size={11} className="fill-amber-300 text-amber-300 shrink-0" aria-hidden="true" />
                      <span>{ratingFormatted} Google ({place.userRatingCount})</span>
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>

          {/* Interactive Spotlight KPI Tiles with Viewport Count-Up */}
          <div className="mt-3.5 sm:mt-7 grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
            {stats.map(({ value, decimals, suffix, label, icon: Icon }, idx) => (
              <motion.div
                key={label}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.46,
                  delay: 0.22 + idx * 0.06,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="h-full"
              >
                <Spatial3DCard className="rounded-2xl">
                  <div className="group/kpi relative h-full overflow-hidden rounded-2xl border border-white/14 bg-gradient-to-b from-white/[0.08] via-white/[0.045] to-slate-950/30 p-3 sm:p-4 flex flex-col justify-between min-w-0 shadow-[0_14px_30px_-14px_rgba(2,6,23,0.75),inset_0_1px_0_rgba(255,255,255,0.16)] transition-colors duration-200 hover:border-sky-400/45 hover:bg-white/[0.09]">
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute top-0 inset-x-4 h-px bg-gradient-to-r from-transparent via-sky-300/50 to-transparent"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-base min-[375px]:text-lg sm:text-xl lg:text-2xl font-extrabold text-white tabular-nums">
                        <CountUp target={value} decimals={decimals} suffix={suffix} />
                      </p>
                      <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl border border-sky-300/25 bg-gradient-to-br from-sky-400/20 to-sky-600/10 text-accent-light shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/kpi:-translate-y-0.5">
                        <Icon size={14} aria-hidden="true" />
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] sm:text-xs font-medium text-white/78 leading-snug">
                      {label}
                    </p>
                  </div>
                </Spatial3DCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1.5: INFINITE SMOOTH BRAND MARQUEE (PAUSE ON HOVER/FOCUS)
      ══════════════════════════════════════════════════════════════════ */}
      <section
        aria-label="Unterstützte Hausgeräte-Marken"
        className="border-b border-primary/8 dark:border-white/10 bg-surface dark:bg-slate-950 py-5 sm:py-6"
      >
        <div className="container-page">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
              Markenvielfalt · Original-Ersatzteile &amp; Fachberatung
            </p>
            <p className="text-[11px] font-medium text-ink-faint">
              Marke antippen für direkte Anfrage · Pausiert beim Überfahren
            </p>
          </div>
          <BrandLogoTicker
            items={FEATURED_APPLIANCE_BRANDS}
            onSelectBrand={handleSelectBrandFromMarquee}
          />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1.75: FLAGSHIP INTERACTIVE 3D SPARE-PARTS EXPLORER
      ══════════════════════════════════════════════════════════════════ */}
      <SparePartsExplorer3D
        activeAppliance={explorerAppliance}
        onChangeAppliance={setExplorerAppliance}
        onRequestPart={handleRequestPartFromExplorer}
        onRequestOtherDevice={handleRequestOtherDeviceFromExplorer}
      />

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2: 3-PILLAR VALUE PROPOSITION (CRISP & SYMBOL-LED)
      ══════════════════════════════════════════════════════════════════ */}
      <section
        id="leistungen"
        aria-labelledby="how-we-help-heading"
        className="section relative overflow-hidden bg-white dark:bg-slate-900 border-b border-primary/8 dark:border-white/10"
      >
        <SectionAmbientMesh variant="pillars" />
        <div className="container-page relative z-10">
          <FadeUp>
            <div className="max-w-2xl mx-auto text-center mb-6 sm:mb-10">
              <p className="eyebrow">Seit {business.founded} · {business.city}</p>
              <h2
                id="how-we-help-heading"
                className="mt-1.5 text-2xl font-extrabold text-primary dark:text-slate-100 sm:text-3xl lg:text-[34px] text-balance"
              >
                <RevealText segments={[{ text: "Beratung, Originalteile & Geräte" }]} />
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-ink-muted">
                {business.mobileServiceNotice}
              </p>
            </div>
          </FadeUp>

          <StaggerContainer className="grid gap-4 sm:gap-5 md:grid-cols-3 lg:gap-6">
            {helpPillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <StaggerItem key={pillar.num} className="h-full">
                  <Spatial3DCard
                    maxTilt={5.8}
                    scrollYaw={idx === 0 ? 1.8 : idx === 2 ? -1.8 : 0}
                    className="rounded-2xl"
                  >
                    <article className="group h-full flex flex-col justify-between overflow-hidden rounded-2xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-950 shadow-card transition-shadow duration-300 hover:shadow-card-hover">
                      <div>
                        {/* Recessed 3D Parallax Studio Photography Header */}
                        <Spatial3DPhoto
                          src={pillar.photo.src}
                          alt={pillar.photo.alt}
                          aspectClass="aspect-[16/10]"
                          fallbackGradient={pillar.photo.fallbackGradient}
                          className="border-b border-primary/8 dark:border-white/10"
                        >
                          <div className="absolute inset-x-3.5 bottom-3 z-10 flex items-end justify-between gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/25 bg-slate-950/75 text-sky-300 backdrop-blur-md shadow-lg transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5 group-hover:scale-105">
                              <Icon size={19} aria-hidden="true" />
                            </div>
                            <span className="font-mono text-2xl font-extrabold leading-none text-white/90 drop-shadow-[0_2px_10px_rgba(2,6,23,0.7)] tabular-nums">
                              {pillar.num}
                            </span>
                          </div>
                        </Spatial3DPhoto>

                        <div className="p-5 sm:p-6 pb-0">
                          <h3 className="text-lg sm:text-xl font-extrabold text-primary dark:text-white leading-snug">
                            {pillar.title}
                          </h3>

                          <p className="mt-1.5 text-xs sm:text-[14px] leading-relaxed text-ink-muted">
                            {pillar.description}
                          </p>

                          <ul className="mt-4 space-y-2 border-t border-primary/8 dark:border-white/10 pt-3.5">
                            {pillar.bullets.map((bullet) => (
                              <li
                                key={bullet}
                                className="flex items-center gap-2 text-xs text-primary/90 dark:text-slate-200"
                              >
                                <CheckCircle2
                                  size={14}
                                  className="shrink-0 text-emerald-600 dark:text-emerald-400"
                                  aria-hidden="true"
                                />
                                {bullet.includes("Verkäufergarantie") ? (
                                  <span>
                                    Inkl.{" "}
                                    <Link
                                      href="/impressum#garantie"
                                      className="font-semibold text-accent underline underline-offset-2 hover:text-accent-dark"
                                    >
                                      schriftlicher Verkäufergarantie
                                    </Link>
                                  </span>
                                ) : (
                                  <span>{bullet}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="p-5 sm:p-6 pt-4 mt-4 border-t border-primary/8 dark:border-white/10">
                        <motion.button
                          whileHover={prefersReducedMotion ? undefined : { y: -1 }}
                          whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                          transition={{ type: "spring", stiffness: 500, damping: 25 }}
                          type="button"
                          onClick={() => handleSelectPillar(pillar.requestType)}
                          className="group/pillar-cta flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border border-accent/25 bg-accent/10 px-4 py-2.5 text-xs font-extrabold text-accent hover:bg-accent hover:text-white transition-colors cursor-pointer"
                        >
                          <span className="min-w-0 text-left leading-snug">{pillar.ctaLabel}</span>
                          <ArrowRight
                            size={14}
                            className="shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/pillar-cta:translate-x-1"
                          />
                        </motion.button>
                      </div>
                    </article>
                  </Spatial3DCard>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 3: HOW WE WORK (3 DISTINCT ICON-BASED FLOW CARDS)
      ══════════════════════════════════════════════════════════════════ */}
      <HowWeWorkSection onSelectStep={handleSelectPillar} />

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 4: VERIFIED GOOGLE CUSTOMER REVIEWS (4,8 ★ · 82 Reviews)
      ══════════════════════════════════════════════════════════════════ */}
      <GoogleReviewsSection />

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 5: STREAMLINED INQUIRY FORM (#anfrage) & OWNER CARD
      ══════════════════════════════════════════════════════════════════ */}
      <section
        id="anfrage"
        className="section relative scroll-mt-16 lg:scroll-mt-20 overflow-hidden bg-white dark:bg-slate-900 border-t border-primary/8 dark:border-white/10"
      >
        <SectionAmbientMesh variant="inquiry" />
        <div className="container-page relative z-10">
          <FadeUp>
            <div className="max-w-2xl mx-auto text-center mb-5 sm:mb-9">
              <p className="eyebrow">Direktkontakt · Termine nach Vereinbarung</p>
              <h2 className="mt-1.5 text-xl font-extrabold text-primary dark:text-slate-100 sm:text-3xl lg:text-[34px] text-balance">
                <RevealText segments={[{ text: "Direkt per WhatsApp anfragen" }]} />
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-ink-muted">
                Gerät &amp; Anliegen antippen – Nachricht öffnet direkt im Chat.
              </p>
            </div>
          </FadeUp>

          <div className="grid gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-8 min-w-0 w-full max-w-full">
              <RepairForm
                defaultDevice={resolvedHeroDeviceForForm}
                defaultSymptom={selectedSymptom}
                defaultBrand={selectedBrand}
                defaultMode={inquiryMode}
                defaultRequestType={selectedRequestType}
                selectionSeq={selectionSeq}
              />
            </div>

            <aside className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-5 items-stretch lg:col-span-4 min-w-0 w-full max-w-full lg:sticky lg:top-20">
              <Spatial3DCard maxTilt={5} scrollYaw={-1.8} className="rounded-2xl">
                <div className="relative h-full flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-primary-dark p-4 sm:p-6 text-white shadow-[0_24px_54px_-14px_rgba(2,6,23,0.72),inset_0_1px_0_rgba(255,255,255,0.16)] border border-sky-300/18">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-sky-300/60 to-transparent"
                  />
                  <div>
                    <div className="flex items-center gap-3.5 sm:gap-4 pb-4 border-b border-white/10">
                      <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0">
                        <div className="relative h-full w-full overflow-hidden rounded-xl border-2 border-sky-400/50 shadow-[0_10px_22px_-8px_rgba(14,165,233,0.55)]">
                          <Image
                            src={herrHannachiImage}
                            alt="Kamal Hannachi"
                            fill
                            loading="lazy"
                            decoding="async"
                            placeholder="blur"
                            blurDataURL={herrHannachiImage.blurDataURL}
                            className="object-cover object-top"
                            sizes="64px"
                          />
                        </div>
                        <span
                          aria-hidden="true"
                          className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-slate-950 bg-emerald-400 shadow-sm"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-accent-light">
                          Inhaber · Direktkontakt
                        </p>
                        <h3 className="text-base sm:text-lg font-extrabold text-white truncate">
                          {business.owner}
                        </h3>
                        <p className="text-xs text-white/65">
                          Seit {business.founded} · {business.city}
                        </p>
                      </div>
                    </div>

                    <ul className="mt-4 space-y-2 text-xs sm:text-[13px] text-white/85">
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 size={15} className="text-accent-light shrink-0" />
                        <span>{yearsOfExperience}+ Jahre Erfahrung</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 size={15} className="text-accent-light shrink-0" />
                        <span>Originalteile nach E-Nr.</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 size={15} className="text-accent-light shrink-0" />
                        <span>Markengeräte auf Anfrage</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10 space-y-2 text-xs">
                    <div className="flex items-start gap-2 text-white/80 min-w-0">
                      <MapPin size={14} className="text-accent-light shrink-0 mt-0.5" />
                      <span className="min-w-0 break-words">
                        {business.street}, {business.zip} {business.city}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-white/80 min-w-0">
                      <Phone size={14} className="text-accent-light shrink-0" />
                      <a href={business.phoneHref} className="inline-flex min-h-[44px] items-center font-bold hover:underline tabular-nums">
                        {business.phoneDisplay}
                      </a>
                      <span className="text-white/55">Telefon &amp; WhatsApp</span>
                    </div>
                  </div>
                </div>
              </Spatial3DCard>

              <div className="card h-full flex flex-col justify-between rounded-2xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-800/60 p-4 sm:p-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-accent">
                    Terminvergabe
                  </p>
                  <h3 className="mt-1 text-base font-extrabold text-primary dark:text-slate-100">
                    Termine nach Vereinbarung
                  </h3>
                </div>
                <dl className="mt-3 space-y-2 text-xs text-ink-muted border-t border-primary/8 dark:border-white/10 pt-3">
                  <div className="flex items-center justify-between gap-2 sm:gap-3 border-b border-primary/8 dark:border-white/10 pb-2">
                    <dt className="font-semibold text-primary dark:text-slate-200 shrink-0">Erreichbarkeit</dt>
                    <dd className="text-right min-w-0 break-words">Mo–Sa 08:00–18:00 Uhr</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:gap-3 border-b border-primary/8 dark:border-white/10 pb-2">
                    <dt className="font-semibold text-primary dark:text-slate-200 shrink-0">Region</dt>
                    <dd className="text-right min-w-0">Osnabrück &amp; Umgebung</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                    <dt className="font-semibold text-primary dark:text-slate-200 shrink-0">Markengeräte</dt>
                    <dd className="text-right min-w-0">Ausgewählte Geräte auf Anfrage</dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
