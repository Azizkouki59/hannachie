"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import {
  Phone,
  Star,
  ArrowRight,
  CheckCircle2,
  Shield,
  Clock3,
  UserRound,
  Handshake,
  Wrench,
  Zap,
  Award,
  MessageCircle,
  Sparkles,
  MapPin,
  RotateCw,
  Snowflake,
  Flame,
  Cpu,
  UsersRound,
} from "lucide-react";
import {
  FadeUp,
  StaggerContainer,
  StaggerItem,
  ScrollRevealCard,
  CountUp,
  GlassBadge,
  MagneticHover,
  Parallax,
  ScrollProgressBar,
  Marquee,
  SpotlightCard,
} from "@/components/animations";
import { SectionHeading } from "@/components/ui";
import {
  business,
  brands,
  reviews,
  services,
  yearsOfExperience,
  sparePartsHighlights,
  sparePartsCategories,
  sparePartsBrands,
  allSupportedAppliances,
} from "@/data/site";
import { serviceIcons } from "@/components/Illustrations";
import {
  InteractiveApplianceShowcase,
  ApplianceGraphic,
} from "@/components/AnimatedAppliances";
import RepairForm from "@/components/RepairForm";
import type { InquiryMode } from "@/lib/repairRequest";
import { useQuickRequest } from "@/components/QuickRequestSheet";
import { ServiceCardSkeleton } from "@/components/Skeletons";
import RepairJourneyTimeline from "@/components/RepairJourneyTimeline";
import TrustCertificationsBanner from "@/components/TrustCertificationsBanner";
import { GoogleReviewsSection } from "@/components/GoogleReviewsSection";
import ContactCta from "./ContactCta";
import {
  herrHannachiImage,
  serviceImagesBySlug,
  werkstattHeroHdImage,
  werkstattImage,
} from "@/data/images";
import { usePreloadHeroImages } from "@/lib/usePreloadHeroImages";

const serviceToDeviceName: Record<string, string> = {
  waschmaschinen: "Waschmaschine",
  geschirrspueler: "Geschirrspüler",
  kuehlschraenke: "Kühlschrank / Gefriergerät",
  backoefen: "Backofen / Herd",
};

const heroQuickDevices = [
  { label: "Waschmaschine", device: "Waschmaschine", icon: RotateCw },
  { label: "Geschirrspüler", device: "Geschirrspüler", icon: Sparkles },
  { label: "Kühlschrank", device: "Kühlschrank / Gefriergerät", icon: Snowflake },
  { label: "Backofen & Herd", device: "Backofen / Herd", icon: Flame },
  { label: "Wäschetrockner", device: "Wäschetrockner", icon: RotateCw },
  { label: "Kaffeevollautomat", device: "Kaffeevollautomat", icon: Sparkles },
  { label: "Platine / Elektronik", device: "Elektronik / Platine", icon: Zap },
];

const mobileStandalonePages = [
  {
    href: "/leistungen",
    title: "Unsere Leistungen & Geräte",
    desc: "Vollständiger Katalog aller reparierten Geräte, Marken und Symptome.",
    meta: "Alle Kategorien",
    icon: Wrench,
  },
  {
    href: "/simulator",
    title: "Fehlersimulator & Ersatzteile",
    desc: "Interaktive Geräteanimationen testen & Originalersatzteile anfragen.",
    meta: "Interaktiv",
    icon: Cpu,
  },
  {
    href: "/anfrage",
    title: "Reparaturanfrage & Diagnose",
    desc: "Eigenständige Anfrageseite mit 3-Schritte-Konfigurator und direkter Telefonnummer.",
    meta: "Online-Formular",
    icon: Sparkles,
  },
  {
    href: "/kundenbewertungen",
    title: "Kundenbewertungen",
    desc: "Echte 4,8 ★ Google-Bewertungen (82 Rezensionen) von Kunden aus Osnabrück lesen.",
    meta: "4,8 ★ Google",
    icon: Star,
  },
  {
    href: "/ueber-uns",
    title: "Über uns & Werkstatt",
    desc: `Lernen Sie Kamal Hannachi und unseren Fachbetrieb seit ${business.founded} kennen.`,
    meta: `${yearsOfExperience}+ Jahre`,
    icon: UsersRound,
  },
  {
    href: "/kontakt",
    title: "Kontakt & Standort",
    desc: "Iburger Straße 5 in Osnabrück, interaktive Anfahrtskarte und Direktkontakt.",
    meta: "Osnabrück",
    icon: MapPin,
  },
];

const advantages = [
  {
    num: "01",
    icon: Clock3,
    title: `${yearsOfExperience}+ Jahre Erfahrung`,
    text: "Über drei Jahrzehnte Praxis mit Haushaltsgeräten aller gängigen Marken in Osnabrück.",
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  {
    num: "02",
    icon: UserRound,
    title: "Direkter Ansprechpartner",
    text: "Sie sprechen mit Herrn Hannachi persönlich – kein Callcenter, keine anonyme Warteschleife.",
    gradient: "from-violet-500/20 to-purple-500/20",
  },
  {
    num: "03",
    icon: Handshake,
    title: "Transparente Beratung",
    text: "Klare Kosteneinschätzung vorab. Wir reparieren nur, wenn es sich wirtschaftlich für Sie lohnt.",
    gradient: "from-emerald-500/20 to-teal-500/20",
  },
  {
    num: "04",
    icon: Wrench,
    title: "Nachhaltige Reparatur",
    text: "Fachgerecht mit geprüften Originalersatzteilen – auch Reparatur auf Platinenebene.",
    gradient: "from-amber-500/20 to-orange-500/20",
  },
];

const stats = [
  { value: yearsOfExperience, suffix: "+ Jahre", label: "Erfahrung seit 1990", icon: Award },
  { value: 4, suffix: ",8 ★", label: "Google-Bewertung (82)", icon: Star },
  { value: 100, suffix: " %", label: "Kostentransparenz", icon: Shield },
  { value: 24, suffix: " Std.", label: "Schnelle Termine", icon: Zap },
];

const serviceGridVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.05,
    },
  },
};

const serviceCardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.975 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.52,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const heroPillContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.08,
    },
  },
};

const heroPillItemVariants: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.38,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function HomepageClient() {
  const { isMobileViewport } = usePreloadHeroImages();
  const [applianceView, setApplianceView] = useState<"cartoon" | "photo">("photo");
  const [isCardsLoading, setIsCardsLoading] = useState<boolean>(false);
  const cardsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<string>("Waschmaschine");
  const [selectedSymptom, setSelectedSymptom] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [inquiryMode, setInquiryMode] = useState<InquiryMode>("repair");
  const { openQuickRequest } = useQuickRequest();

  const handleSwitchApplianceView = (nextView: "cartoon" | "photo") => {
    if (nextView === applianceView) return;
    setApplianceView(nextView);
    if (cardsTimerRef.current) {
      clearTimeout(cardsTimerRef.current);
    }
    setIsCardsLoading(true);
    cardsTimerRef.current = setTimeout(() => {
      setIsCardsLoading(false);
      cardsTimerRef.current = null;
    }, 160);
  };

  const handleSelectRepair = (
    device: string,
    symptom?: string,
    mode: InquiryMode = "repair"
  ) => {
    setSelectedDevice(device);
    if (symptom !== undefined) {
      setSelectedSymptom(symptom);
    }
    setInquiryMode(mode);
    // On mobile screens (< 1024px), open the pro slide-up Quick-Request bottom sheet directly!
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      openQuickRequest(device, symptom, selectedBrand, mode);
      return;
    }
    const el = document.getElementById("anfrage");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSelectBrand = (brand: string) => {
    setSelectedBrand(brand);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      openQuickRequest(selectedDevice, selectedSymptom, brand, inquiryMode);
      return;
    }
    const el = document.getElementById("anfrage");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <ScrollProgressBar />

      {/* ══════════════════════════════════════════════
          HERO SECTION (Mobile Pro + Desktop Split)
      ══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-primary-dark pt-8 pb-14 sm:pt-14 sm:pb-20 lg:pt-20 lg:pb-28">
        <div className="absolute inset-0">
          <Image
            src={werkstattImage}
            alt=""
            fill
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            quality={60}
            className="object-cover object-center opacity-[0.16]"
            sizes="(min-width: 1024px) 520px, 100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-dark via-primary-dark/94 to-primary-dark/70" />
          <div className="absolute -top-48 -right-48 h-[560px] w-[560px] rounded-full bg-accent/12 blur-[140px] orb-drift pointer-events-none" />
          <div className="absolute bottom-10 left-10 h-[420px] w-[420px] rounded-full bg-blue-700/10 blur-[120px] orb-drift-reverse pointer-events-none" />
        </div>

        <div className="container-page relative z-10">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-stretch lg:gap-12">
            {/* Left Column */}
            <div className="flex flex-col justify-center lg:col-span-7">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs sm:text-sm font-semibold text-accent-light">
                <span>Osnabrück &amp; ganzes Umland</span>
                <span aria-hidden="true">·</span>
                <span>Seit {business.founded}</span>
                <span aria-hidden="true">·</span>
                <span>Kamal Hannachi</span>
              </div>

              <h1 className="text-[30px] sm:text-[46px] lg:text-[56px] font-extrabold leading-[1.08] tracking-tight text-white">
                Wenn Ihr Haushaltsgerät{" "}
                <span className="text-gradient-shimmer">streikt</span> – wir reparieren es zuverlässig.
              </h1>

              <p className="mt-4 sm:mt-5 max-w-[62ch] text-sm sm:text-lg leading-relaxed text-white/75">
                Persönlicher Vor-Ort-Reparaturservice in <strong className="text-white">Osnabrück und dem gesamten Umland</strong> (Georgsmarienhütte, Wallenhorst, Belm, Bissendorf, Bramsche, Bad Iburg, Melle, Lotte u. v. m.). Stellen Sie Ihre komplette Reparaturanfrage oder eine kurze Frage bequem online – direkt geprüft von Kamal Hannachi, ohne Callcenter, mit fairer Kosteneinschätzung und 1-Klick-Standortfreigabe per Google Maps.
              </p>

              {/* Mobile Workshop Visual Card (Compact, High-Impact on Phone) */}
              <div className="mt-5 lg:hidden">
                <div className="relative overflow-hidden rounded-2xl border border-white/15 shadow-xl">
                  <Image
                    src={werkstattImage}
                    alt="Herr Hannachi in seiner Werkstatt in Osnabrück"
                    width={900}
                    height={540}
                    mobilePriority
                    preload
                    placeholder="blur"
                    blurDataURL={werkstattImage.blurDataURL}
                    sizes="(max-width: 640px) 94vw, (max-width: 1023px) 92vw, 520px"
                    className="aspect-[16/9] w-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-white truncate">Werkstatt Hannachi · Osnabrück</p>
                      <p className="text-[11px] text-white/75 truncate">Iburger Straße 5 · Vor Ort &amp; in der Werkstatt</p>
                    </div>
                    <span className="text-xs font-extrabold text-amber-400 tabular-nums shrink-0">
                      4,8 ★ Google (82)
                    </span>
                  </div>
                </div>
              </div>

              {/* Interactive Quick-Select Bar: 1-Tap Device Picker */}
              <div className="mt-6 rounded-2xl border border-white/12 bg-white/[0.05] p-4 sm:p-5 backdrop-blur-md">
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-3">
                  <span className="text-xs font-bold text-white">
                    Welches Gerät streikt gerade?
                  </span>
                  <span className="text-[11px] text-accent-light font-semibold">
                    Antippen für die Sofortanfrage
                  </span>
                </div>
                <motion.div
                  variants={heroPillContainerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 min-[350px]:grid-cols-2 sm:flex sm:flex-wrap gap-2"
                >
                  {heroQuickDevices.map(({ label, device, icon: Icon }) => {
                    const isSelected = selectedDevice === device;
                    return (
                      <motion.button
                        key={device}
                        variants={heroPillItemVariants}
                        type="button"
                        onClick={() => handleSelectRepair(device)}
                        className={`flex min-h-[44px] min-w-0 items-center gap-2 rounded-xl border px-3 sm:px-3.5 py-2.5 text-left text-xs font-bold transition-all active:scale-[0.98] cursor-pointer ${
                          isSelected
                            ? "border-accent bg-accent text-white shadow-sm"
                            : "border-white/15 bg-white/5 text-white/90 hover:border-accent/60 hover:bg-white/10"
                        }`}
                      >
                        <Icon size={15} className={`shrink-0 ${isSelected ? "text-white" : "text-accent-light"}`} />
                        <span className="truncate">{label}</span>
                      </motion.button>
                    );
                  })}
                </motion.div>
              </div>

              {/* Primary & Secondary CTAs: Complete Repair Request + Direct Question + Phone */}
              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
                <button
                  type="button"
                  onClick={() => handleSelectRepair(selectedDevice, undefined, "repair")}
                  className="group inline-flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl bg-accent px-4 sm:px-6 py-3.5 text-center text-sm sm:text-base font-bold text-white shadow-lg shadow-accent/25 transition-all duration-200 hover:bg-accent-dark active:scale-[0.98] sm:whitespace-nowrap cursor-pointer"
                >
                  <Wrench size={18} className="shrink-0" />
                  <span>Komplette Reparaturanfrage</span>
                  <ArrowRight
                    size={16}
                    className="shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectRepair(selectedDevice, undefined, "question")}
                  data-variant="hover-emerald"
                  className="btn-whatsapp-hover group inline-flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 sm:px-5 py-3.5 text-center text-sm sm:text-base font-bold text-white shadow-md transition-all duration-200 active:scale-[0.98] sm:whitespace-nowrap cursor-pointer"
                >
                  <span className="whatsapp-hover-icon shrink-0" aria-hidden="true">
                    <MessageCircle size={18} />
                  </span>
                  <span>Direkte Frage (WhatsApp)</span>
                </button>
              </div>
              <p className="mt-2.5 text-xs text-white/60">
                <Phone size={12} className="inline mr-1 text-accent-light" />
                Werkstatt {business.phoneDisplay} · Alle Anfragen &amp; Fragen gehen fertig vorbereitet per WhatsApp an Herrn Hannachi
              </p>
            </div>

            {/* Right Column: Desktop Workshop Showcase */}
            <div className="relative hidden lg:flex lg:flex-col lg:justify-center lg:col-span-5">
              <div className="relative h-full min-h-[380px] overflow-hidden rounded-3xl border border-white/15 shadow-[0_32px_80px_rgba(0,0,0,0.55)]">
                <Image
                  src={werkstattHeroHdImage}
                  alt="Herr Hannachi in seiner Werkstatt in Osnabrück"
                  fill
                  priority={!isMobileViewport}
                  preload={!isMobileViewport}
                  quality={100}
                  placeholder="blur"
                  blurDataURL={werkstattHeroHdImage.blurDataURL}
                  sizes="(min-width: 1280px) 1600px, (min-width: 1024px) 1200px, 95vw"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4 rounded-2xl border border-white/15 bg-primary-dark/85 p-4 backdrop-blur-md">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-accent-light font-semibold">
                      <span>Meisterwerkstatt &amp; Vor-Ort-Service</span>
                      <span aria-hidden="true">·</span>
                      <span>{business.city}</span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-white">
                      {business.street}, {business.zip} {business.city}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center justify-end gap-0.5 text-amber-400">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="mt-0.5 text-xs font-extrabold text-white tabular-nums">
                      4,8 ★ Google (82)
                    </p>
                  </div>
                </div>
              </div>

              <GlassBadge
                className="absolute -top-4 -left-4 !bg-white !border-white/40 text-primary shadow-xl"
                delay={0.4}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                    <CheckCircle2 size={18} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-ink-muted">Erfahrung</p>
                    <p className="text-sm font-extrabold text-primary tabular-nums">
                      {yearsOfExperience}+ Jahre Praxis
                    </p>
                  </div>
                </div>
              </GlassBadge>
            </div>
          </div>

          {/* 4-Column KPI Strip */}
          <StaggerContainer className="mt-8 sm:mt-12 grid grid-cols-1 min-[340px]:grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {stats.map(({ value, suffix, label, icon: Icon }) => (
              <StaggerItem key={label}>
                <div className="h-full rounded-2xl border border-white/10 bg-white/[0.05] p-3.5 sm:p-5 backdrop-blur-md">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xl sm:text-3xl font-extrabold text-white tabular-nums">
                      <CountUp target={value} suffix={suffix} />
                    </p>
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-light">
                      <Icon size={17} />
                    </div>
                  </div>
                  <p className="mt-1 text-xs font-medium text-white/70 leading-snug">{label}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          TRUST & CERTIFICATIONS BANNER (Master Craftsman, Since 1990, Local Service, Verified Quality)
      ══════════════════════════════════════════════ */}
      <TrustCertificationsBanner />

      {/* ══════════════════════════════════════════════
          BRANDS LOGO TICKER (Tailwind Auto-Playing Infinite Scroll)
      ══════════════════════════════════════════════ */}
      <section className="border-b border-primary/8 dark:border-white/10 bg-white dark:bg-slate-900 py-5 sm:py-6 overflow-hidden transition-colors duration-200">
        <div className="container-page mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-center sm:text-left">
          <p className="text-xs font-extrabold uppercase tracking-wider text-primary dark:text-slate-100">
            Unterstützte Herstellermarken &amp; Originalersatzteile
          </p>
          <p className="text-[11px] font-semibold text-ink-muted">
            Marke antippen für direkte Reparaturanfrage · Pausiert beim Berühren
          </p>
        </div>
        <Marquee
          onSelectBrand={handleSelectBrand}
          items={[
            ...brands,
            "Samsung",
            "LG",
            "Beko",
            "Liebherr",
            "Gorenje",
            "Constructa",
            "Neff",
            "Zanussi",
            "Privileg",
            "Jura",
          ]}
        />
      </section>

      {/* ══════════════════════════════════════════════
          CUSTOMER REVIEWS - Scrollable Real Google Reviews (Directly under Brands Banner)
      ══════════════════════════════════════════════ */}
      <GoogleReviewsSection />

      {/* ══════════════════════════════════════════════
          VISUAL 4-STEP REPAIR JOURNEY TIMELINE (Request -> Diagnosis -> Repair -> Completion + Auto Google Maps Rating)
      ══════════════════════════════════════════════ */}
      <RepairJourneyTimeline onStartRequest={() => handleSelectRepair(selectedDevice)} />

      {/* ══════════════════════════════════════════════
          MOBILE PRO MULTI-PAGE DIRECTORY (Phone Only: Each Page Separate!)
      ══════════════════════════════════════════════ */}
      <section className="py-10 bg-surface lg:hidden">
        <div className="container-page">
          <FadeUp className="mb-5">
            <p className="text-xs font-bold uppercase tracking-wider text-accent">
              Direkt zur gewünschten Seite
            </p>
            <h2 className="mt-1 text-2xl font-extrabold text-primary dark:text-slate-100">
              Alle Bereiche einzeln öffnen
            </h2>
            <p className="mt-1 text-xs text-ink-muted">
              Jeder Bereich hat eine eigene übersichtliche Seite für schnelle Navigation auf dem Smartphone.
            </p>
          </FadeUp>

          {/* 4 Core Appliance Quick Cards on Mobile */}
          <motion.div
            variants={serviceGridVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            className="mb-6 grid grid-cols-1 min-[360px]:grid-cols-2 gap-3"
            aria-busy={isCardsLoading}
          >
            {isCardsLoading
              ? services.map((s) => (
                  <ServiceCardSkeleton key={`mob-skel-${s.slug}`} compactMobile />
                ))
              : services.map((s) => {
                  const photo = serviceImagesBySlug[s.slug];
                  const deviceName = serviceToDeviceName[s.slug] || s.title;
                  return (
                    <motion.div
                      key={s.slug}
                      variants={serviceCardVariants}
                      className="h-full will-change-transform"
                    >
                      <div className="h-full overflow-hidden rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
                        <Link href={`/leistungen/${s.slug}`} className="relative aspect-[16/10] block overflow-hidden bg-slate-900">
                          {photo && (
                            <Image
                              src={photo}
                              alt={s.title}
                              fill
                              loading="lazy"
                              decoding="async"
                              placeholder="blur"
                              blurDataURL={photo.blurDataURL}
                              className="object-cover transition-transform duration-500 hover:scale-105"
                              sizes="(max-width: 359px) 92vw, (max-width: 639px) 46vw, 320px"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                          <span className="absolute bottom-2 left-2.5 right-2.5 z-20 text-xs font-extrabold text-white truncate">
                            {s.title}
                          </span>
                        </Link>
                        <div className="p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-1.5">
                          <button
                            type="button"
                            onClick={() => openQuickRequest(deviceName)}
                            className="text-xs font-extrabold text-accent py-1 whitespace-nowrap cursor-pointer"
                          >
                            Anfragen →
                          </button>
                          <Link
                            href={`/leistungen/${s.slug}`}
                            className="text-[11px] font-semibold text-ink-muted py-1 whitespace-nowrap"
                          >
                            Details
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
          </motion.div>

          {/* Dedicated Sub-Pages Tap List */}
          <motion.div
            variants={serviceGridVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            className="grid gap-2.5"
          >
            {mobileStandalonePages.map((page) => {
              const Icon = page.icon;
              return (
                <motion.div key={page.href} variants={serviceCardVariants}>
                  <Link
                    href={page.href}
                    className="flex min-h-[68px] items-center justify-between gap-3 rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 p-3.5 sm:p-4 shadow-xs transition-all active:scale-[0.98] hover:border-accent"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                        <Icon size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <h3 className="text-sm font-extrabold text-primary dark:text-slate-100">
                            {page.title}
                          </h3>
                          <span className="text-[11px] font-semibold text-accent">
                            · {page.meta}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-ink-muted line-clamp-1">
                          {page.desc}
                        </p>
                      </div>
                    </div>
                    <ArrowRight size={17} className="shrink-0 text-accent" />
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Interactive Fault Simulator Widget on Mobile & Tablet */}
          <div className="mt-8">
            <FadeUp>
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-wider text-accent">
                  Interaktiver Fehlersimulator
                </p>
                <h3 className="mt-1 text-xl sm:text-2xl font-extrabold text-primary dark:text-slate-100">
                  Gerät &amp; Fehlerbild direkt auswählen
                </h3>
                <p className="mt-1 text-xs text-ink-muted">
                  Tippen Sie auf Ihr Gerät und das passende Symptom für eine vorbereitete Sofortanfrage.
                </p>
              </div>
              <InteractiveApplianceShowcase onSelectRepair={handleSelectRepair} />
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          DESKTOP SECTIONS (Shown on Desktop lg+; on mobile each lives on its own page!)
      ══════════════════════════════════════════════ */}
      <div className="hidden lg:block">
        {/* SERVICES & SIMULATOR */}
        <section className="section bg-surface" id="leistungen">
          <div className="container-page">
            <FadeUp>
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-accent mb-2">
                    Unsere Kernleistungen
                  </p>
                  <SectionHeading
                    title="Was wir reparieren: Nahezu alle Haushaltsgeräte"
                    subtitle="Wählen Sie Ihr Gerät für eine direkte Diagnose oder wechseln Sie zwischen echten Werkstattfotos und unserer interaktiven Technik-Simulation."
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <div className="inline-flex rounded-xl bg-white dark:bg-slate-900 p-1 border border-primary/10 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => handleSwitchApplianceView("photo")}
                      className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                        applianceView === "photo"
                          ? "bg-primary dark:bg-accent text-white shadow-xs"
                          : "text-ink-muted hover:text-primary dark:hover:text-slate-100"
                      }`}
                    >
                      Gerätefotos
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwitchApplianceView("cartoon")}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                        applianceView === "cartoon"
                          ? "bg-accent text-white shadow-xs"
                          : "text-ink-muted hover:text-primary dark:hover:text-slate-100"
                      }`}
                    >
                      <Sparkles size={13} />
                      Interaktive Grafik
                    </button>
                  </div>
                  <Link href="/leistungen" className="btn-ghost !py-2 !px-4 text-xs whitespace-nowrap">
                    Alle Leistungen <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </FadeUp>

            <motion.div
              key={`desktop-services-${applianceView}-${isCardsLoading ? "loading" : "ready"}`}
              variants={serviceGridVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.12 }}
              className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
              aria-busy={isCardsLoading}
            >
              {isCardsLoading
                ? services.map((s) => <ServiceCardSkeleton key={`desk-skel-${s.slug}`} />)
                : services.map((s, idx) => {
                    const Icon = serviceIcons[s.slug];
                    const photo = serviceImagesBySlug[s.slug];
                    const deviceName = serviceToDeviceName[s.slug] || s.title;
                    return (
                      <motion.div
                        key={s.slug}
                        variants={serviceCardVariants}
                        className="h-full will-change-transform"
                      >
                        <MagneticHover className="h-full">
                          <div className="card group relative flex h-full flex-col overflow-hidden bg-white dark:bg-slate-900">
                            {/* Subtle top accent highlight on hover */}
                            <span className="pointer-events-none absolute top-0 inset-x-0 z-20 h-1 bg-gradient-to-r from-accent via-sky-400 to-emerald-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                            <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
                              {applianceView === "cartoon" ? (
                                <div className="flex h-full w-full items-center justify-center bg-slate-900 p-3 overflow-hidden border-b border-primary/10 dark:border-white/10 relative">
                                  <div className="relative z-10 scale-95 transition-transform duration-300 group-hover:scale-105">
                                    <ApplianceGraphic slug={s.slug} size="sm" />
                                  </div>
                                </div>
                              ) : photo ? (
                                <>
                                  <Image
                                    src={photo}
                                    alt={s.title}
                                    fill
                                    loading="lazy"
                                    decoding="async"
                                    placeholder="blur"
                                    blurDataURL={photo.blurDataURL}
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    sizes="(min-width: 1280px) 280px, (min-width: 1024px) 23vw, 48vw"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                                  <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between text-white">
                                    <span className="text-xs font-bold">
                                      0{idx + 1}. {s.title}
                                    </span>
                                    <Icon className="h-4 w-4 text-accent-light" />
                                  </div>
                                </>
                              ) : null}
                            </div>

                            <div className="flex flex-1 flex-col p-5">
                              <h3 className="text-lg font-bold text-primary dark:text-slate-100 group-hover:text-accent transition-colors">
                                {s.title}
                              </h3>
                              <p className="mt-2 flex-1 text-xs sm:text-[13px] leading-relaxed text-ink-muted">
                                {s.short}
                              </p>

                              <div className="mt-4 pt-3 border-t border-primary/8 dark:border-white/10 flex items-center justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSelectRepair(deviceName)}
                                  className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:text-accent-dark transition-colors whitespace-nowrap"
                                >
                                  Direkt anfragen
                                  <ArrowRight size={13} />
                                </button>
                                <Link
                                  href={`/leistungen/${s.slug}`}
                                  className="text-xs font-semibold text-ink-muted hover:text-primary dark:hover:text-slate-100 transition-colors whitespace-nowrap"
                                >
                                  Details
                                </Link>
                              </div>
                            </div>
                          </div>
                        </MagneticHover>
                      </motion.div>
                    );
                  })}
            </motion.div>

            <div className="mt-16">
              <FadeUp>
                <div className="mb-6 text-center">
                  <p className="text-xs font-bold uppercase tracking-wider text-accent mb-2">
                  Interaktiver Fehlersimulator
                </p>
                <h3 className="text-2xl font-extrabold text-primary dark:text-slate-100 sm:text-3xl">
                  Wählen Sie Ihr Gerät &amp; klicken Sie auf das Fehlerbild
                </h3>
                <p className="mt-2 text-sm text-ink-muted max-w-xl mx-auto">
                  Ein Klick auf ein typisches Symptom übernimmt Ihr Gerät und das Fehlerbild direkt in das Anfrageformular unten.
                </p>
              </div>
              <InteractiveApplianceShowcase onSelectRepair={handleSelectRepair} />
            </FadeUp>
          </div>
        </div>
      </section>

      {/* EMBEDDED LIVE REPAIR REQUEST & DIAGNOSTIC FORM (#anfrage) */}
      <section
        id="anfrage"
        className="section relative scroll-mt-20 overflow-hidden bg-white dark:bg-slate-900/60 border-y border-primary/8 dark:border-white/10"
      >
        <div className="container-page">
          <FadeUp>
            <div className="mx-auto max-w-3xl text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-wider text-accent mb-2">
                Osnabrück &amp; ganzes Umland · Mit 1-Klick-Standort per Google Maps
              </p>
              <h2 className="text-3xl font-extrabold text-primary dark:text-slate-100 sm:text-4xl lg:text-[44px]">
                Komplette Reparaturanfrage oder direkte Frage
              </h2>
              <p className="mt-3 text-base sm:text-lg text-ink-muted">
                Wählen Sie zwischen einer kompletten Reparaturanfrage oder einer kurzen Frage an Herrn Hannachi.
                Ihren Standort in Osnabrück &amp; Umgebung teilen Sie bequem per Google-Maps-Link.
              </p>
            </div>
            </FadeUp>

            <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-8">
                <RepairForm
                  defaultDevice={selectedDevice}
                  defaultSymptom={selectedSymptom}
                  defaultBrand={selectedBrand}
                  defaultMode={inquiryMode}
                />
              </div>

              <aside className="space-y-6 lg:col-span-4">
                <div className="rounded-3xl border border-primary/10 bg-primary-dark p-6 sm:p-7 text-white shadow-xl">
                  <div className="flex items-center gap-4 pb-5 border-b border-white/10">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/20">
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
                    <div>
                      <p className="text-xs font-semibold text-accent-light">Ihr Ansprechpartner</p>
                      <h3 className="text-lg font-extrabold text-white">{business.owner}</h3>
                      <p className="text-xs text-white/65">Hausgerätetechniker seit {business.founded}</p>
                    </div>
                  </div>

                  <ul className="mt-5 space-y-3 text-xs sm:text-[13px] text-white/80">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="text-accent-light shrink-0 mt-0.5" />
                      <span>Ehrliche Vorabeinschätzung, ob sich die Reparatur lohnt</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="text-accent-light shrink-0 mt-0.5" />
                      <span>Gängige Originalersatzteile direkt im Servicefahrzeug dabei</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="text-accent-light shrink-0 mt-0.5" />
                      <span>Kurzfristige Termine in ganz Osnabrück &amp; Umgebung</span>
                    </li>
                  </ul>

                  <div className="mt-6 pt-5 border-t border-white/10 space-y-2.5">
                    <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200 leading-relaxed">
                      <span className="font-bold text-white block mb-0.5">
                        Direkt im Formular links ausfüllen
                      </span>
                      Ihre fertige Anfrage oder Frage wird im nächsten Schritt direkt für WhatsApp an Herrn Hannachi vorbereitet.
                    </div>
                    <p className="text-[11px] text-white/60 px-1 pt-0.5 flex items-center gap-1.5">
                      <Phone size={12} className="text-accent-light shrink-0" />
                      <span>Werkstatt-Tel.: {business.phoneDisplay}</span>
                    </p>
                  </div>

                  <div className="mt-5 flex items-center gap-2 text-xs text-white/55">
                    <MapPin size={14} className="text-accent-light shrink-0" />
                    <span>
                      {business.street}, {business.zip} {business.city}
                    </span>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* COMPLETE APPLIANCE OVERVIEW (6 CATEGORIES) */}
        <section className="section bg-surface">
          <div className="container-page">
            <FadeUp>
              <div className="mx-auto max-w-3xl text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-accent mb-2">
                  Vollständiges Leistungsspektrum
                </p>
                <h2 className="text-2xl font-extrabold text-primary dark:text-slate-100 sm:text-3xl lg:text-4xl">
                  Alle Gerätetypen &amp; typische Fehlerbilder im Überblick
                </h2>
              </div>
            </FadeUp>

            <motion.div
              variants={serviceGridVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {allSupportedAppliances.map((cat, idx) => (
                <motion.div
                  key={cat.title}
                  variants={serviceCardVariants}
                  className="h-full will-change-transform"
                >
                  <div className="h-full rounded-3xl border border-primary/8 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-xs hover:shadow-md hover:border-accent/30 transition-all duration-300 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 pb-4 border-b border-primary/8 dark:border-white/10">
                        <h3 className="text-base font-bold text-primary dark:text-slate-100">
                          0{idx + 1}. {cat.title}
                        </h3>
                        <span className="text-xs font-semibold text-ink-muted shrink-0">
                          {cat.badge}
                        </span>
                      </div>
                      <p className="mt-3 text-xs leading-relaxed text-ink-muted">{cat.description}</p>
                      <ul className="mt-4 space-y-3">
                        {cat.items.map((item) => (
                          <li key={item.name} className="rounded-xl bg-surface p-3.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-primary dark:text-slate-100">{item.name}</span>
                              <button
                                type="button"
                                onClick={() => handleSelectRepair(item.name)}
                                className="text-[11px] font-bold text-accent hover:underline whitespace-nowrap"
                              >
                                Anfragen →
                              </button>
                            </div>
                            <p className="mt-1 text-[11px] text-ink-muted leading-relaxed">
                              {item.description}
                            </p>
                            <p className="mt-2 text-[11px] text-ink-faint">
                              {item.symptoms.join(" · ")}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* WHY HANNACHI */}
        <section className="section relative overflow-hidden bg-primary-dark text-white">
          <div className="container-page relative">
            <FadeUp>
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-accent-light mb-2">
                    Unsere Grundsätze
                  </p>
                  <h2 className="text-3xl font-extrabold leading-[1.1] text-white sm:text-4xl lg:text-[44px]">
                    Warum Kunden in Osnabrück Hannachi vertrauen
                  </h2>
                </div>
                <Link href="/ueber-uns" className="btn-ghost-light shrink-0 whitespace-nowrap">
                  Mehr über uns <ArrowRight size={16} />
                </Link>
              </div>
            </FadeUp>

            <StaggerContainer className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {advantages.map(({ num, icon: Icon, title, text, gradient }) => (
                <StaggerItem key={title}>
                  <SpotlightCard
                    spotlightColor="rgba(14, 165, 233, 0.16)"
                    className="group h-full rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm transition-all duration-300 hover:border-accent/40 hover:-translate-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient}`}
                      >
                        <Icon size={22} className="text-accent-light" />
                      </div>
                      <span className="font-mono text-xs font-bold text-white/40 tabular-nums">
                        {num}
                      </span>
                    </div>
                    <h3 className="mt-5 text-[17px] font-bold text-white">{title}</h3>
                    <p className="mt-2.5 text-[13px] leading-relaxed text-white/65">{text}</p>
                  </SpotlightCard>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* ABOUT & SPARE PARTS SERVICE */}
        <section className="section bg-white dark:bg-slate-900/60" id="ersatzteile">
          <div className="container-page">
            <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-20">
              <FadeUp className="lg:col-span-5">
                <Parallax speed={0.08}>
                  <div className="relative mx-auto max-w-sm lg:max-w-none">
                    <div className="overflow-hidden rounded-3xl shadow-xl border border-primary/10 dark:border-white/10">
                      <Image
                        src={herrHannachiImage}
                        alt="Kamal Hannachi – Inhaber des Reparaturservice"
                        width={560}
                        height={700}
                        loading="lazy"
                        decoding="async"
                        placeholder="blur"
                        blurDataURL={herrHannachiImage.blurDataURL}
                        className="aspect-[4/5] w-full object-cover object-top"
                        sizes="(min-width: 1024px) 38vw, 90vw"
                      />
                    </div>
                    <div className="absolute -bottom-5 -right-5 rounded-2xl bg-accent px-6 py-4 text-white shadow-lg">
                      <p className="text-3xl font-black tabular-nums">{yearsOfExperience}+</p>
                      <p className="text-xs font-semibold text-white/90">Jahre Erfahrung</p>
                    </div>
                  </div>
                </Parallax>
              </FadeUp>

              <FadeUp delay={0.12} className="lg:col-span-7">
                <p className="text-xs font-bold uppercase tracking-wider text-accent mb-3">
                  Persönlicher Fachbetrieb &amp; Ersatzteillager
                </p>
                <h2 className="text-3xl font-extrabold leading-[1.1] text-primary dark:text-slate-100 sm:text-4xl lg:text-[44px]">
                  Persönlicher Service &amp; Originalersatzteile für alle Marken.
                </h2>
                <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-ink-muted">
                  Seit {business.founded} steht Kamal Hannachi für ehrliches Handwerk in Osnabrück.
                  Gängige Verschleißteile – von Laugenpumpen und Heizstäben bis zu Thermostaten,
                  Dichtungen und Kohlebürsten – halten wir direkt bereit.
                </p>

                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  {sparePartsHighlights.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-primary/8 dark:border-white/10 bg-surface p-4"
                    >
                      <h3 className="text-sm font-bold text-primary dark:text-slate-100 flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-accent shrink-0" />
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleSelectRepair("Waschmaschine")}
                    className="btn-primary whitespace-nowrap"
                  >
                    Reparatur oder Ersatzteil anfragen <ArrowRight size={16} />
                  </button>
                  <Link href="/simulator" className="btn-ghost whitespace-nowrap">
                    Alle Ersatzteile &amp; Simulator
                  </Link>
                </div>
              </FadeUp>
            </div>

            <div className="mt-16 rounded-3xl border border-primary/10 dark:border-white/10 bg-slate-900 text-white p-6 sm:p-10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/10">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-accent-light">
                    Ersatzteilsortiment
                  </p>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                    Gängige Baugruppen direkt ab Lager oder in 24–48 Std.
                  </h3>
                </div>
                <span className="text-xs text-white/70">
                  Für {sparePartsBrands.slice(0, 6).map((b) => b.name).join(" · ")} u. v. m.
                </span>
              </div>

              <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {sparePartsCategories.map((cat) => (
                  <div
                    key={cat.category}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5"
                  >
                    <h4 className="text-sm font-bold text-accent-light pb-3 border-b border-white/10">
                      {cat.category}
                    </h4>
                    <ul className="mt-3.5 space-y-2">
                      {cat.parts.map((p) => (
                        <li key={p} className="flex items-start gap-2 text-xs text-white/80">
                          <CheckCircle2 size={13} className="text-accent-light shrink-0 mt-0.5" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      <ContactCta />
    </>
  );
}
