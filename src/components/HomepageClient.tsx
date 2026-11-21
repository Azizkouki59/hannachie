"use client";
import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Phone,
  Star,
  ArrowRight,
  CheckCircle2,
  Shield,
  Award,
  MessageCircle,
  MapPin,
  Wrench,
  ShieldCheck,
  Zap,
  Check,
  ChevronDown,
} from "lucide-react";
import {
  FadeUp,
  StaggerContainer,
  StaggerItem,
  CountUp,
  ScrollProgressBar,
} from "@/components/animations";
import { business, yearsOfExperience } from "@/data/site";
import RepairForm, { type RequestTypeId } from "@/components/RepairForm";
import type { InquiryMode } from "@/lib/repairRequest";
import RepairJourneyTimeline from "@/components/RepairJourneyTimeline";
import { GoogleReviewsSection } from "@/components/GoogleReviewsSection";
import ApplianceLogo from "@/components/ApplianceLogo";
import { HANNACHI_WHATSAPP_PHONE, getDeviceEmoji } from "@/utils/whatsapp";
import {
  herrHannachiImage,
  werkstattHeroHdImage,
  werkstattImage,
} from "@/data/images";
import { usePreloadHeroImages } from "@/lib/usePreloadHeroImages";
import { useGoogleLivePlace } from "@/lib/googlePlaceLive";
import { hapticTap, triggerHapticFeedback } from "@/lib/haptics";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { HeroAnimatedBackdrop } from "@/components/HeroAnimatedBackdrop";

const heroQuickDevices = [
  {
    label: "Waschmaschine",
    subtitle: "Front- & Toploader",
    device: "Waschmaschine",
    badgeClass: "bg-sky-500/20 text-sky-300 border-sky-400/30",
    quickProblems: ["Pumpt nicht ab", "Schleudert nicht", "Heizt nicht / Fehlercode"],
  },
  {
    label: "Kühlschrank",
    subtitle: "Kühl- & Gefrierkombi",
    device: "Kühlschrank / Gefriergerät",
    badgeClass: "bg-cyan-500/20 text-cyan-300 border-cyan-400/30",
    quickProblems: ["Kühlt nicht mehr", "Vereist stark", "Brummt laut / Dichtung"],
  },
  {
    label: "Geschirrspüler",
    subtitle: "Einbau & Standgerät",
    device: "Geschirrspüler",
    badgeClass: "bg-teal-500/20 text-teal-300 border-teal-400/30",
    quickProblems: ["Wasser steht unten", "Spült / heizt nicht", "Zieht kein Wasser"],
  },
  {
    label: "Herd / Backofen",
    subtitle: "Backofen & Ceranfeld",
    device: "Backofen / Herd",
    badgeClass: "bg-amber-500/20 text-amber-300 border-amber-400/30",
    quickProblems: ["Heizt nicht auf", "Kochfeld ohne Funktion", "Sicherung fliegt raus"],
  },
  {
    label: "Sonstiges Gerät",
    subtitle: "Trockner, Kaffee & mehr",
    device: "Sonstiges",
    badgeClass: "bg-indigo-500/20 text-indigo-300 border-indigo-400/30",
    quickProblems: ["Trockner trocknet nicht", "Kaffeevollautomat brüht nicht", "Mikrowelle / Kleingerät"],
  },
] as const;

const helpPillars: Array<{
  num: string;
  title: string;
  description: string;
  bullets: string[];
  ctaLabel: string;
  requestType: RequestTypeId;
  icon: typeof Wrench;
}> = [
  {
    num: "01",
    title: "Vor-Ort-Gerätecheck & Ersatzteil-Service",
    description:
      "Ihr Gerät macht Probleme? Wir kommen nach Terminabsprache direkt zu Ihnen nach Hause in Osnabrück & Umgebung, prüfen das Gerät vor Ort und versorgen Sie mit den passenden Original-Ersatzteilen.",
    bullets: [
      "Mobiler Vor-Ort-Termin direkt bei Ihnen zu Hause in Osnabrück",
      "Passgenaue Ersatzteile nach Typenschild (E-Nr. / PNC) aller Marken",
      "Persönliche Betreuung durch Inhaber Kamal Hannachi ohne Callcenter",
    ],
    ctaLabel: "Vor-Ort-Check & Ersatzteil anfragen",
    requestType: "check_parts",
    icon: Wrench,
  },
  {
    num: "02",
    title: "Passendes Ersatzgerät mit schriftlicher Garantie",
    description:
      "Wenn sich die Rettung Ihres Altgeräts wirtschaftlich nicht mehr lohnt, bieten wir Ihnen auf Wunsch ein geprüftes Ersatzgerät direkt aus unserem Bestand an – inklusive offizieller schriftlicher Verkäufergarantie.",
    bullets: [
      "Ehrliches Angebot nur dann, wenn Ihr Altgerät nicht mehr zu retten ist",
      "Geprüfte Markengeräte (Miele, Bosch, Siemens, Liebherr u. v. m.)",
      "Übergabe inklusive schriftlicher Verkäufergarantie vom Inhaber",
    ],
    ctaLabel: "Ersatzgerät mit Garantie anfragen",
    requestType: "replacement_offer",
    icon: ShieldCheck,
  },
  {
    num: "03",
    title: "Voller Garantie-Service für unsere Geräte",
    description:
      "Da jedes von uns verkaufte Gerät mit einer schriftlichen Verkäufergarantie übergeben wird, übernehmen wir für alle bei Hannachi gekauften Geräte den vollen technischen Garantie- und Reparaturservice.",
    bullets: [
      "Gesetzlich & vertraglich abgesicherte Garantie-Abwicklung",
      "Eigener Vor-Ort-Garantieservice für bei Hannachi gekaufte Geräte",
      "Über 35 Jahre Erfahrung in Osnabrück (seit 1990)",
    ],
    ctaLabel: "Garantie-Anfrage stellen",
    requestType: "warranty",
    icon: Shield,
  },
];

export default function HomepageClient() {
  const { place, ratingFormatted, source } = useGoogleLivePlace();
  const { isMobileViewport } = usePreloadHeroImages();
  const prefersReducedMotion = useReducedMotion();
  const isMdUp = useMediaQuery("(min-width: 768px)", false);
  const [selectedDevice, setSelectedDevice] = useState<string>("Waschmaschine");
  const [customOtherDevice, setCustomOtherDevice] = useState<string>("");
  const [selectedSymptom, setSelectedSymptom] = useState<string>("");
  const [selectedBrand] = useState<string>("");
  const [inquiryMode] = useState<InquiryMode>("repair");
  const [selectedRequestType, setSelectedRequestType] = useState<RequestTypeId>("check_parts");
  const [expandedPillar, setExpandedPillar] = useState<string | null>("01");

  const activeHeroDeviceObj =
    heroQuickDevices.find((d) => d.device === selectedDevice) || heroQuickDevices[0];
  const resolvedHeroDeviceForForm =
    selectedDevice === "Sonstiges" && customOtherDevice.trim()
      ? customOtherDevice.trim()
      : selectedDevice;

  const ratingInt = Math.floor(place.rating);
  const ratingDec = place.rating.toFixed(1).split(".")[1] || "0";
  const stats = [
    { value: yearsOfExperience, suffix: "+ J.", label: "Erfahrung in Osnabrück seit 1990", icon: Award },
    {
      value: ratingInt,
      suffix: `,${ratingDec} ★`,
      label: `Verifizierte Google-Bewertung (${place.userRatingCount})`,
      icon: Star,
    },
    { value: 100, suffix: " %", label: "Schriftliche Verkäufergarantie auf Ersatzgeräte", icon: Shield },
    { value: 24, suffix: " Std.", label: "Schnelle Rückmeldung & Vor-Ort-Termin", icon: Zap },
  ];

  const handleSelectDevice = (device: string) => {
    hapticTap();
    setSelectedDevice(device);
    setSelectedSymptom("");
  };

  const handleToggleSymptom = (symptom: string) => {
    hapticTap();
    setSelectedSymptom((prev) => (prev === symptom ? "" : symptom));
  };

  const handleScrollToRequest = () => {
    triggerHapticFeedback(35);
    const el = document.getElementById("anfrage");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      window.setTimeout(() => {
        const target =
          el.querySelector<HTMLElement>('[data-field="brand"]') ||
          el.querySelector<HTMLElement>('[data-field="phone"]');
        target?.focus({ preventScroll: true });
      }, 450);
    }
  };

  const whatsappDeviceLabel =
    selectedDevice === "Sonstiges" && customOtherDevice.trim()
      ? customOtherDevice.trim()
      : activeHeroDeviceObj.label;

  const heroWhatsAppMessage = [
    `🔧 *Kurzanfrage (Startseite)*`,
    `Hallo Herr Hannachi,`,
    ``,
    `${getDeviceEmoji(whatsappDeviceLabel)} *Gerät:* ${whatsappDeviceLabel}`,
    ...(selectedSymptom ? [`📝 *Problem:* ${selectedSymptom}`] : []),
    `Ich bitte um Rückmeldung für einen Vor-Ort-Termin.`,
  ].join("\n");

  const heroDirectWhatsappHref = `https://api.whatsapp.com/send?phone=${HANNACHI_WHATSAPP_PHONE}&text=${encodeURIComponent(
    heroWhatsAppMessage
  )}`;

  const handleSelectPillar = (reqType: RequestTypeId) => {
    triggerHapticFeedback(35);
    setSelectedRequestType(reqType);
    const el = document.getElementById("anfrage");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const toggleMobilePillar = (num: string) => {
    triggerHapticFeedback(30);
    setExpandedPillar((prev) => (prev === num ? null : num));
  };

  return (
    <>
      <ScrollProgressBar />

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1: MOBILE ON-SITE HERO (CLEAR & COMPLIANT)
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-primary-dark pt-3 pb-6 sm:pt-9 sm:pb-12 lg:pt-12 lg:pb-14 border-b border-white/10">
        <HeroAnimatedBackdrop />

        <div className="container-page relative z-10">
          <div className="grid gap-4 sm:gap-8 lg:grid-cols-12 lg:items-stretch lg:gap-10">
            {/* Left Column (7 cols): Compliant Hero Positioning */}
            <div className="lg:col-span-7 flex flex-col justify-center min-w-0">
              {/* Compact Trust Eyebrow */}
              <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] sm:text-[13px] font-semibold text-white/75">
                <a
                  href="#kundenstimmen"
                  className="inline-flex items-center gap-1.5 text-accent-light font-extrabold hover:underline"
                >
                  <Star size={12} className="fill-amber-400 text-amber-400 shrink-0" aria-hidden="true" />
                  <span className="tabular-nums">{ratingFormatted} ★ Google ({place.userRatingCount})</span>
                </a>
                {source === "live" && place.openNow !== null && (
                  <>
                    <span aria-hidden="true" className="text-white/30">·</span>
                    <span
                      className={`inline-flex items-center gap-1.5 font-bold ${
                        place.openNow ? "text-emerald-300" : "text-amber-200"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`inline-flex h-1.5 w-1.5 rounded-full shrink-0 ${
                          place.openNow ? "bg-emerald-400" : "bg-amber-400"
                        }`}
                      />
                      <span>{place.openNow ? "Jetzt geöffnet" : "Aktuell geschlossen"}</span>
                    </span>
                  </>
                )}
                <span aria-hidden="true" className="hidden min-[380px]:inline text-white/30">·</span>
                <span className="hidden min-[380px]:inline">Vor-Ort Osnabrück</span>
                <span aria-hidden="true" className="text-white/30">·</span>
                <span>Seit {business.founded}</span>
              </div>

              <h1 className="text-[22px] min-[375px]:text-[25px] sm:text-[34px] lg:text-[42px] font-extrabold leading-[1.13] tracking-[-0.025em] text-white text-balance">
                Ihr mobiler Vor-Ort-Service für Elektrohaushaltsgeräte &amp; Ersatzteile in Osnabrück.
              </h1>

              <p className="mt-2 sm:mt-3 max-w-[60ch] text-[13px] sm:text-[15px] lg:text-base leading-relaxed text-white/80">
                Ihr Hausgerät streikt? Wir kommen nach Terminabsprache{" "}
                <strong className="text-white font-semibold">
                  direkt zu Ihnen nach Hause in Osnabrück &amp; Umgebung
                </strong>
                : mit passenden Original-Ersatzteilen, einem fairen Angebot für ein{" "}
                <strong className="text-white font-semibold">
                  geprüftes Ersatzgerät inkl. schriftlicher Garantie
                </strong>{" "}
                sowie vollem Garantie-Service.
              </p>

              {/* App-Like 1-Tap Appliance Selector + Quick Problems + Direct Contact */}
              <div className="mt-3.5 sm:mt-6 rounded-2xl border border-white/15 bg-gradient-to-b from-white/[0.09] to-white/[0.04] backdrop-blur-md p-2.5 sm:p-4 space-y-2.5 sm:space-y-3 shadow-xl shadow-black/20">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-extrabold text-white min-w-0">
                    Welches Gerät bereitet Probleme?
                  </span>
                  <span className="text-[11px] font-semibold text-accent-light shrink-0">
                    <span className="sm:hidden">Tippen &amp; senden</span>
                    <span className="hidden sm:inline">Auswählen &amp; direkt kontaktieren</span>
                  </span>
                </div>

                {/* Mobile: Symmetric 3+2 App-Tile Grid (100% Visible on Phone) | Tablet & Desktop: 5-Column Row */}
                <div className="grid grid-cols-6 sm:grid-cols-5 gap-1.5 sm:gap-2">
                  {heroQuickDevices.map((item, idx) => {
                    const isSelected = selectedDevice === item.device;
                    return (
                      <motion.button
                        key={item.device}
                        type="button"
                        whileTap={prefersReducedMotion ? undefined : { scale: 0.94 }}
                        transition={{ type: "spring", stiffness: 520, damping: 24 }}
                        onClick={() => handleSelectDevice(item.device)}
                        aria-pressed={isSelected}
                        className={`${
                          idx < 3 ? "col-span-2 sm:col-span-1" : "col-span-3 sm:col-span-1"
                        } relative overflow-hidden min-w-0 w-full flex flex-col items-center text-center justify-center gap-1 sm:gap-1.5 rounded-xl sm:rounded-2xl border px-1 sm:px-1.5 py-2 sm:py-3 transition-all cursor-pointer ${
                          isSelected
                            ? "border-accent text-white shadow-lg shadow-accent/25"
                            : "border-white/12 bg-white/[0.05] text-white/90 hover:border-white/30 hover:bg-white/[0.1]"
                        }`}
                      >
                        {isSelected && (
                          <motion.span
                            layoutId="hero-device-active-bg"
                            transition={
                              prefersReducedMotion
                                ? { duration: 0.1 }
                                : { type: "spring", stiffness: 420, damping: 32 }
                            }
                            aria-hidden="true"
                            className="absolute inset-0 rounded-xl sm:rounded-2xl bg-accent"
                          />
                        )}
                        <AnimatePresence>
                          {isSelected && (
                            <motion.span
                              initial={prefersReducedMotion ? false : { scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={prefersReducedMotion ? undefined : { scale: 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 24 }}
                              className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 z-10 flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-white text-accent shadow-xs"
                            >
                              <Check size={9} strokeWidth={3.5} aria-hidden="true" />
                            </motion.span>
                          )}
                        </AnimatePresence>
                        <span
                          className={`relative z-10 flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                            isSelected
                              ? "border-white/35 bg-white/20 text-white"
                              : item.badgeClass
                          }`}
                        >
                          <ApplianceLogo device={item.device} size={21} />
                        </span>
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
                      className="overflow-hidden"
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

                {/* 1-Tap Quick-Symptoms Wrapped Grid */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-semibold text-white/75">
                      Häufiges Problem <span className="text-white/50">(optional)</span>:
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
                        <button
                          key={problem}
                          type="button"
                          onClick={() => handleToggleSymptom(problem)}
                          aria-pressed={active}
                          className={`inline-flex min-h-[38px] sm:min-h-[34px] max-w-full items-center gap-1.5 rounded-xl sm:rounded-lg border px-2.5 py-1 text-[11.5px] sm:text-[11px] font-bold transition-colors text-left leading-tight cursor-pointer ${
                            active
                              ? "border-emerald-400 bg-emerald-500/25 text-emerald-200 shadow-xs"
                              : "border-white/15 bg-white/[0.05] text-white/85 hover:border-white/30 hover:text-white"
                          }`}
                        >
                          {active && <Check size={12} className="text-emerald-300 shrink-0" />}
                          <span>{problem}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* App-Style Action Dock: Primary WhatsApp + Balanced Call & Form */}
                <div className="pt-2.5 border-t border-white/12 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2">
                  <motion.a
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    href={heroDirectWhatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => triggerHapticFeedback(50)}
                    data-testid="hero-direct-whatsapp-btn"
                    className="col-span-2 sm:flex-1 sm:min-w-[200px] min-w-0 inline-flex min-h-[46px] sm:min-h-[48px] items-center justify-center gap-2 rounded-xl border border-emerald-400/45 bg-emerald-600/90 hover:bg-emerald-500 px-3 sm:px-3.5 py-2 text-xs sm:text-[13px] font-extrabold text-white shadow-md shadow-emerald-950/30 transition-colors overflow-hidden"
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
                          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                          className="inline-block truncate"
                        >
                          {whatsappDeviceLabel}
                          {selectedSymptom ? ` (${selectedSymptom})` : ""}
                        </motion.span>
                      </AnimatePresence>
                    </span>
                  </motion.a>
                  <motion.a
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    href={place.phoneHref}
                    onClick={() => triggerHapticFeedback(50)}
                    data-testid="hero-direct-call-btn"
                    className="min-w-0 w-full sm:w-auto sm:flex-initial inline-flex min-h-[44px] sm:min-h-[46px] items-center justify-center gap-1.5 rounded-xl border border-white/18 bg-white/[0.08] hover:bg-white/14 px-2.5 sm:px-3 py-2 text-[11.5px] sm:text-xs font-extrabold text-white transition-colors tabular-nums overflow-hidden"
                  >
                    <Phone size={13} className="text-emerald-400 shrink-0" aria-hidden="true" />
                    <span className="truncate">{place.phoneDisplay}</span>
                  </motion.a>
                  <motion.button
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    type="button"
                    onClick={handleScrollToRequest}
                    data-testid="hero-direct-form-btn"
                    className="min-w-0 w-full sm:w-auto sm:flex-initial inline-flex min-h-[44px] sm:min-h-[46px] items-center justify-center gap-1 sm:gap-1.5 rounded-xl bg-accent hover:bg-accent-dark px-2.5 sm:px-4 py-2 text-[11.5px] sm:text-xs font-extrabold text-white shadow-md shadow-accent/25 transition-colors cursor-pointer overflow-hidden"
                  >
                    <span className="truncate">
                      {selectedSymptom ? "Im Formular senden" : "Termin anfragen"}
                    </span>
                    <ArrowRight size={13} className="shrink-0" aria-hidden="true" />
                  </motion.button>
                </div>
              </div>

              {/* Mobile Service Photography Card (Tighter aspect ratio for mobile above-the-fold balance) */}
              <div className="mt-3 lg:hidden">
                <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-slate-900/80 shadow-xl">
                  <Image
                    src={werkstattImage}
                    alt="Kamal Hannachi – Mobiler Vor-Ort-Service für Elektrohaushaltsgeräte & Ersatzteile in Osnabrück"
                    width={900}
                    height={540}
                    mobilePriority
                    preload
                    placeholder="blur"
                    blurDataURL={werkstattImage.blurDataURL}
                    sizes="(max-width: 640px) 94vw, (max-width: 1023px) 92vw, 520px"
                    className="aspect-[16/8.5] sm:aspect-[16/9] w-full object-cover object-center"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                  <div className="hero-badge absolute inset-x-3 bottom-3 z-10 flex items-center justify-between gap-2 rounded-xl border border-white/20 bg-slate-950/88 px-3.5 py-2.5 backdrop-blur-md text-xs text-white shadow-lg">
                    <span className="inline-flex items-center gap-1.5 font-bold truncate min-w-0">
                      <MapPin size={13} className="shrink-0 text-accent-light" aria-hidden="true" />
                      <span className="truncate">
                        Inh. {business.owner} · Vor-Ort in {business.city}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 font-extrabold text-amber-300 tabular-nums shrink-0">
                      <Star size={11} className="fill-amber-300 text-amber-300 shrink-0" aria-hidden="true" />
                      <span>{ratingFormatted} ({place.userRatingCount})</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (5 cols): Desktop Real Portrait / Service Card */}
            <div className="relative hidden lg:flex lg:col-span-5 flex-col">
              <div className="relative flex-1 min-h-[360px] overflow-hidden rounded-2xl border border-white/15 bg-slate-900/90 shadow-2xl">
                <Image
                  src={werkstattHeroHdImage}
                  alt="Hannachi Elektrohaushaltsgeräte & Ersatzteile – Mobiler Vor-Ort-Service Osnabrück"
                  fill
                  priority={!isMobileViewport}
                  preload={!isMobileViewport}
                  quality={95}
                  placeholder="blur"
                  blurDataURL={werkstattHeroHdImage.blurDataURL}
                  sizes="(min-width: 1280px) 500px, (min-width: 1024px) 420px, 95vw"
                  className="object-cover object-center"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent" />
                <div className="hero-badge absolute inset-x-4 bottom-4 z-10 rounded-xl border border-white/20 bg-slate-950/88 px-4 py-3.5 backdrop-blur-md shadow-xl">
                  <div className="flex items-center justify-between gap-2 text-xs text-accent-light font-bold">
                    <span>Mobiler Vor-Ort-Service</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} className="shrink-0" aria-hidden="true" />
                      <span>{business.city} &amp; Umgebung</span>
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-extrabold text-white leading-snug">
                    Persönliche Betreuung durch Inhaber {business.owner}
                  </p>
                  <div className="mt-1.5 pt-1.5 border-t border-white/10 flex items-center justify-between text-[11px] text-white/80">
                    <span>Seit {business.founded} in Osnabrück · inkl. Garantie</span>
                    <span className="inline-flex items-center gap-1 font-extrabold text-amber-300 tabular-nums">
                      <Star size={11} className="fill-amber-300 text-amber-300 shrink-0" aria-hidden="true" />
                      <span>{ratingFormatted} Google ({place.userRatingCount})</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Compact 4-Box KPI Strip (All 4 values visible at a glance on mobile & desktop) */}
          <StaggerContainer className="mt-3 sm:mt-7 grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
            {stats.map(({ value, suffix, label, icon: Icon }) => (
              <StaggerItem key={label}>
                <div className="h-full rounded-2xl border border-white/12 bg-white/[0.05] p-3 sm:p-4 flex flex-col justify-between min-w-0 transition-colors hover:border-white/22 hover:bg-white/[0.07]">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-base min-[375px]:text-lg sm:text-xl lg:text-2xl font-extrabold text-white tabular-nums">
                      <CountUp target={value} suffix={suffix} />
                    </p>
                    <Icon size={15} className="shrink-0 text-accent-light" aria-hidden="true" />
                  </div>
                  <p className="mt-1 text-[11px] sm:text-xs font-medium text-white/75 leading-snug">
                    {label}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2: COMPLIANT 3-PILLAR VALUE PROPOSITION (CLEAN MOBILE)
      ══════════════════════════════════════════════════════════════════ */}
      <section
        id="leistungen"
        aria-labelledby="how-we-help-heading"
        className="section bg-white dark:bg-slate-900 border-b border-primary/8 dark:border-white/10"
      >
        <div className="container-page">
          <FadeUp>
            <div className="max-w-3xl mx-auto text-center mb-6 sm:mb-10">
              <p className="eyebrow">Mobiler Vor-Ort-Service · Osnabrück &amp; Umgebung</p>
              <h2
                id="how-we-help-heading"
                className="mt-1.5 sm:mt-2 text-2xl font-extrabold text-primary dark:text-slate-100 sm:text-3xl lg:text-[34px] text-balance"
              >
                So helfen wir Ihnen direkt bei Ihnen zu Hause
              </h2>
              <p className="mt-2 sm:mt-2.5 text-xs sm:text-sm lg:text-[15px] text-ink-muted leading-relaxed">
                {business.mobileServiceNotice}
              </p>
            </div>
          </FadeUp>

          <StaggerContainer className="grid gap-4 sm:gap-5 md:grid-cols-3 lg:gap-6">
            {helpPillars.map((pillar) => {
              const Icon = pillar.icon;
              const isExpanded = expandedPillar === pillar.num;
              return (
                <StaggerItem key={pillar.num}>
                  <article className="card h-full flex flex-col justify-between rounded-2xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-950 p-5 sm:p-6">
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                          <Icon size={21} aria-hidden="true" />
                        </div>
                        <span className="font-mono text-2xl font-extrabold text-accent/30 tabular-nums">
                          {pillar.num}
                        </span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-extrabold text-primary dark:text-white leading-snug">
                        {pillar.title}
                      </h3>

                      <p className="mt-2 text-xs sm:text-[14px] leading-relaxed text-ink-muted">
                        {pillar.description}
                      </p>

                      {/* Mobile Collapsible Accordion Trigger (< md) */}
                      <motion.button
                        whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                        type="button"
                        onClick={() => toggleMobilePillar(pillar.num)}
                        aria-expanded={isExpanded}
                        className="mt-3.5 flex md:hidden min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-primary dark:text-slate-200 transition-colors cursor-pointer"
                      >
                        <span>
                          {isExpanded ? "Vorteile ausblenden" : "Alle 3 Vorteile anzeigen"}
                        </span>
                        <motion.span
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ type: "spring", stiffness: 360, damping: 26 }}
                          className="shrink-0 text-accent flex items-center"
                        >
                          <ChevronDown size={15} />
                        </motion.span>
                      </motion.button>

                      <motion.div
                        initial={false}
                        animate={
                          isMdUp || isExpanded
                            ? { height: "auto", opacity: 1 }
                            : { height: 0, opacity: 0 }
                        }
                        transition={
                          prefersReducedMotion
                            ? { duration: 0.08 }
                            : {
                                height: { type: "spring", stiffness: 360, damping: 32 },
                                opacity: { duration: 0.2 },
                              }
                        }
                        className="overflow-hidden md:!h-auto md:!opacity-100"
                        aria-hidden={!isMdUp && !isExpanded}
                      >
                        <ul className="mt-3 md:mt-5 space-y-2 border-t border-primary/8 dark:border-white/10 pt-4">
                          {pillar.bullets.map((bullet) => (
                            <li
                              key={bullet}
                              className="flex items-start gap-2 text-xs text-primary/90 dark:text-slate-200"
                            >
                              <CheckCircle2
                                size={14}
                                className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                                aria-hidden="true"
                              />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    </div>

                    <div className="mt-4 md:mt-6 pt-3.5 md:pt-4 border-t border-primary/8 dark:border-white/10">
                      <motion.button
                        whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                        type="button"
                        onClick={() => handleSelectPillar(pillar.requestType)}
                        className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border border-accent/25 bg-accent/10 px-4 py-2.5 text-xs font-extrabold text-accent hover:bg-accent hover:text-white transition-colors cursor-pointer"
                      >
                        <span className="min-w-0 text-left leading-snug">{pillar.ctaLabel}</span>
                        <ArrowRight size={14} className="shrink-0" />
                      </motion.button>
                    </div>
                  </article>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 3: 4-STEP MOBILE ON-SITE WORKFLOW
      ══════════════════════════════════════════════════════════════════ */}
      <RepairJourneyTimeline />

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 4: VERIFIED GOOGLE CUSTOMER REVIEWS (4,8 ★ · 82 Reviews)
      ══════════════════════════════════════════════════════════════════ */}
      <GoogleReviewsSection />

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 5: STREAMLINED INQUIRY FORM (#anfrage) & MOBILE SERVICE CARD
      ══════════════════════════════════════════════════════════════════ */}
      <section
        id="anfrage"
        className="section relative scroll-mt-16 lg:scroll-mt-20 overflow-hidden bg-white dark:bg-slate-900 border-t border-primary/8 dark:border-white/10"
      >
        <div className="container-page">
          <FadeUp>
            <div className="max-w-3xl mx-auto text-center mb-5 sm:mb-10">
              <p className="eyebrow">Mobiler Vor-Ort-Service Osnabrück · Schnelle Terminanfrage</p>
              <h2 className="mt-1.5 sm:mt-2 text-xl font-extrabold text-primary dark:text-slate-100 sm:text-3xl lg:text-[34px] text-balance">
                Vor-Ort-Termin, Ersatzteil oder Ersatzgerät anfragen
              </h2>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm lg:text-[15px] text-ink-muted">
                Schildern Sie kurz das Problem an Ihrem Gerät oder Ihren Ersatzteilwunsch – Herr Hannachi meldet sich direkt bei Ihnen.
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
              />
            </div>

            <aside className="space-y-4 sm:space-y-5 lg:col-span-4 min-w-0 w-full max-w-full lg:sticky lg:top-20">
              <div className="rounded-2xl bg-primary-dark p-4 sm:p-6 text-white shadow-xl border border-white/10">
                <div className="flex items-center gap-3.5 sm:gap-4 pb-4 sm:pb-5 border-b border-white/10">
                  <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-xl border-2 border-accent/40">
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
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-accent-light">
                      Ihr direkter Ansprechpartner
                    </p>
                    <h3 className="text-base sm:text-lg font-extrabold text-white truncate">
                      {business.owner}
                    </h3>
                    <p className="text-xs text-white/65">
                      Inhaber · Seit {business.founded} in Osnabrück
                    </p>
                  </div>
                </div>

                <ul className="mt-4 sm:mt-5 space-y-2.5 text-xs sm:text-[13px] text-white/85">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="text-accent-light shrink-0 mt-0.5" />
                    <span>Mobiler Vor-Ort-Termin &amp; Ersatzteil-Service bei Ihnen zu Hause</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="text-accent-light shrink-0 mt-0.5" />
                    <span>Geprüftes Ersatzgerät mit schriftlicher Verkäufergarantie, falls Ihr Altgerät nicht mehr zu retten ist</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="text-accent-light shrink-0 mt-0.5" />
                    <span>Voller Garantie- &amp; Reparaturservice für alle bei Hannachi gekauften Geräte</span>
                  </li>
                </ul>

                <div className="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-white/10 space-y-2.5 text-xs">
                  <div className="flex items-start gap-2 text-white/80 min-w-0">
                    <MapPin size={14} className="text-accent-light shrink-0 mt-0.5" />
                    <span className="min-w-0 break-words">
                      Mobiler Vor-Ort-Service in {business.city} &amp; Umgebung · {place.streetLine}, {place.zipCityLine}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-white/80 min-w-0">
                    <Phone size={14} className="text-accent-light shrink-0" />
                    <a href={place.phoneHref} className="inline-flex min-h-[44px] items-center font-bold hover:underline">
                      {place.phoneDisplay}
                    </a>
                    <span className="text-white/55 break-words">({place.hoursSummary})</span>
                  </div>
                </div>
              </div>

              <div className="card rounded-2xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-800/60 p-4 sm:p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-accent">
                  Service &amp; Erreichbarkeit
                </p>
                <h3 className="mt-1 text-base font-extrabold text-primary dark:text-slate-100">
                  Hannachi Osnabrück
                </h3>
                <dl className="mt-3 space-y-2 text-xs text-ink-muted">
                  <div className="flex items-center justify-between gap-2 sm:gap-3 border-b border-primary/8 dark:border-white/10 pb-2">
                    <dt className="font-semibold text-primary dark:text-slate-200 shrink-0">Vor-Ort-Termine</dt>
                    <dd className="text-right min-w-0 break-words">
                      {place.hoursSummary}
                      {source === "live" && place.openNow !== null && (
                        <span
                          className={`block text-[11px] font-bold ${
                            place.openNow
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-amber-600 dark:text-amber-300"
                          }`}
                        >
                          {place.openNow ? "Jetzt geöffnet" : "Aktuell geschlossen"}
                        </span>
                      )}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:gap-3 border-b border-primary/8 dark:border-white/10 pb-2">
                    <dt className="font-semibold text-primary dark:text-slate-200 shrink-0">Einsatzgebiet</dt>
                    <dd className="text-right min-w-0">Osnabrück &amp; Umgebung</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                    <dt className="font-semibold text-primary dark:text-slate-200 shrink-0">Ersatzgeräte</dt>
                    <dd className="text-right min-w-0">Inkl. schriftlicher Garantie</dd>
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
