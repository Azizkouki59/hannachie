"use client";
import { useState } from "react";
import Image from "next/image";
import {
  Phone,
  Star,
  ArrowRight,
  CheckCircle2,
  Shield,
  Award,
  MessageCircle,
  Sparkles,
  MapPin,
  RotateCw,
  Snowflake,
  Flame,
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
import {
  herrHannachiImage,
  werkstattHeroHdImage,
  werkstattImage,
} from "@/data/images";
import { usePreloadHeroImages } from "@/lib/usePreloadHeroImages";
import { triggerHapticFeedback } from "@/lib/haptics";

const heroQuickDevices = [
  { label: "Waschmaschine", device: "Waschmaschine", icon: RotateCw },
  { label: "Kühlschrank", device: "Kühlschrank / Gefriergerät", icon: Snowflake },
  { label: "Geschirrspüler", device: "Geschirrspüler", icon: Sparkles },
  { label: "Herd / Backofen", device: "Backofen / Herd", icon: Flame },
  { label: "Sonstiges Gerät", device: "Sonstiges", icon: Wrench },
];

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
      "Eigener Vor-Ort- & Werkstatt-Garantieservice für Hannachi-Geräte",
      "Über 35 Jahre Erfahrung in Osnabrück (seit 1990)",
    ],
    ctaLabel: "Garantie-Anfrage stellen",
    requestType: "warranty",
    icon: Shield,
  },
];

const stats = [
  { value: yearsOfExperience, suffix: "+ J.", label: "Erfahrung in Osnabrück seit 1990", icon: Award },
  { value: 4, suffix: ",8 ★", label: "Verifizierte Google-Bewertung (82)", icon: Star },
  { value: 100, suffix: " %", label: "Schriftliche Verkäufergarantie auf Ersatzgeräte", icon: Shield },
  { value: 24, suffix: " Std.", label: "Schnelle Rückmeldung & Vor-Ort-Termin", icon: Zap },
];

export default function HomepageClient() {
  const { isMobileViewport } = usePreloadHeroImages();
  const [selectedDevice, setSelectedDevice] = useState<string>("Waschmaschine");
  const [selectedSymptom, setSelectedSymptom] = useState<string>("");
  const [selectedBrand] = useState<string>("");
  const [inquiryMode] = useState<InquiryMode>("repair");
  const [selectedRequestType, setSelectedRequestType] = useState<RequestTypeId>("check_parts");
  const [expandedPillar, setExpandedPillar] = useState<string | null>("01");

  const handleSelectDevice = (device: string) => {
    triggerHapticFeedback(35);
    setSelectedDevice(device);
    setSelectedSymptom("");
    const el = document.getElementById("anfrage");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

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
          SECTION 1: MOBILE ON-SITE HERO & 4-COLUMN KPI STRIP
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-primary-dark pt-5 pb-9 sm:pt-10 sm:pb-12 lg:pt-11 lg:pb-14 border-b border-white/10">
        <div className="container-page relative z-10">
          <div className="grid gap-6 sm:gap-8 lg:grid-cols-12 lg:items-stretch lg:gap-10">
            {/* Left Column (7 cols): Compliant Hero Positioning */}
            <div className="flex flex-col justify-center lg:col-span-7">
              {/* Compact Trust Eyebrow */}
              <div className="mb-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm font-semibold text-accent-light">
                <span className="inline-flex items-center gap-1.5 text-amber-400 font-extrabold">
                  <Star size={13} className="fill-amber-400 text-amber-400 shrink-0" />
                  <span>4,8 ★ Google (82)</span>
                </span>
                <span aria-hidden="true" className="text-white/35">·</span>
                <span>Vor-Ort-Service Osnabrück</span>
                <span aria-hidden="true" className="text-white/35">·</span>
                <span>Seit {business.founded}</span>
              </div>

              <h1 className="text-[25px] min-[375px]:text-[28px] sm:text-[34px] lg:text-[40px] font-extrabold leading-[1.13] tracking-tight text-white text-balance">
                Ihr mobiler Vor-Ort-Service für Elektrohaushaltsgeräte &amp; Ersatzteile in Osnabrück.
              </h1>

              <p className="mt-3 max-w-[62ch] text-[13.5px] sm:text-[15px] lg:text-base leading-relaxed text-white/80">
                Ihr Hausgerät streikt? Wir kommen nach Terminabsprache{" "}
                <strong className="text-white font-semibold">
                  direkt zu Ihnen nach Hause in Osnabrück &amp; Umgebung
                </strong>
                : mit passenden Original-Ersatzteilen, einem fairen Angebot für ein{" "}
                <strong className="text-white font-semibold">
                  geprüftes Ersatzgerät inklusive schriftlicher Verkäufergarantie
                </strong>{" "}
                (falls sich Ihr Altgerät nicht mehr lohnt) sowie vollem Garantie-Service für alle bei uns gekauften Geräte.
              </p>

              {/* 1-Tap Appliance Quick-Select Bar (Placed right above fold on mobile for instant thumb action) */}
              <div className="mt-4 sm:mt-6 rounded-2xl border border-white/12 bg-white/[0.05] p-3.5 sm:p-4">
                <div className="flex items-center justify-between gap-2 mb-2.5 text-xs">
                  <span className="font-extrabold text-white">
                    Welches Gerät bereitet Probleme?
                  </span>
                  <span className="text-[11px] font-medium text-accent-light">
                    1-Tipp Auswahl ↓
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                  {heroQuickDevices.map(({ label, device, icon: Icon }, idx) => {
                    const isSelected = selectedDevice === device;
                    const isLastOddItem = idx === heroQuickDevices.length - 1;
                    return (
                      <button
                        key={device}
                        type="button"
                        onClick={() => handleSelectDevice(device)}
                        aria-pressed={isSelected}
                        className={`flex min-h-[46px] min-w-0 items-center justify-between sm:justify-start gap-2 rounded-xl border px-3 py-2 text-left text-xs font-extrabold transition-all active:scale-[0.98] whitespace-nowrap cursor-pointer ${
                          isLastOddItem ? "col-span-2 sm:col-span-1" : ""
                        } ${
                          isSelected
                            ? "border-accent bg-accent text-white shadow-md shadow-accent/25"
                            : "border-white/15 bg-white/[0.06] text-white/90 hover:border-accent/60 hover:bg-white/12"
                        }`}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <Icon
                            size={15}
                            className={`shrink-0 ${
                              isSelected ? "text-white" : "text-accent-light"
                            }`}
                          />
                          <span className="truncate">{label}</span>
                        </span>
                        {isSelected ? (
                          <Check size={14} className="shrink-0 text-white sm:hidden" />
                        ) : (
                          <ArrowRight size={13} className="shrink-0 text-white/40 sm:hidden" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Primary & Secondary CTAs */}
              <div className="mt-4 sm:mt-6 grid grid-cols-1 min-[420px]:grid-cols-2 sm:flex sm:flex-row sm:flex-wrap sm:items-center gap-2.5">
                <a
                  href="#anfrage"
                  onClick={() => triggerHapticFeedback(40)}
                  className="inline-flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-accent/20 transition-all hover:bg-accent-dark active:scale-[0.98] whitespace-nowrap"
                >
                  <MessageCircle size={17} className="shrink-0" />
                  <span>Vor-Ort-Termin anfragen</span>
                  <ArrowRight size={15} className="shrink-0" />
                </a>
                <a
                  href={business.phoneHref}
                  onClick={() => triggerHapticFeedback(50)}
                  className="inline-flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 px-5 py-3 text-xs sm:text-sm font-extrabold text-white transition-all active:scale-[0.98] whitespace-nowrap"
                >
                  <Phone size={16} className="shrink-0 text-emerald-400" />
                  <span>{business.phoneDisplay}</span>
                </a>
              </div>

              {/* Mobile Service Photography Card */}
              <div className="mt-5 lg:hidden">
                <div className="relative overflow-hidden rounded-2xl border border-white/15 shadow-lg">
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
                    className="aspect-[16/9] w-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent" />
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between gap-2 rounded-xl border border-white/15 bg-slate-950/80 px-3 py-2 text-xs text-white backdrop-blur-md">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" aria-hidden="true" />
                      <span className="font-bold truncate">
                        Inh. {business.owner} · Vor-Ort in {business.city}
                      </span>
                    </div>
                    <span className="font-mono font-extrabold text-amber-400 tabular-nums shrink-0">
                      4,8 ★ (82)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (5 cols): Desktop Real Portrait / Service Card */}
            <div className="relative hidden lg:flex lg:flex-col lg:justify-center lg:col-span-5">
              <div className="relative h-full min-h-[340px] overflow-hidden rounded-2xl border border-white/15">
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

                <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-end justify-between gap-4 rounded-xl border border-white/15 bg-primary-dark/90 p-3.5 backdrop-blur-md">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-accent-light font-semibold">
                      <span>Mobiler Vor-Ort-Service</span>
                      <span aria-hidden="true">·</span>
                      <span>{business.city} &amp; Umgebung</span>
                    </div>
                    <p className="mt-0.5 text-sm font-bold text-white">
                      Persönliche Betreuung durch Inhaber {business.owner}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-extrabold text-amber-400 tabular-nums">
                      4,8 ★ Google (82)
                    </p>
                    <p className="mt-0.5 text-[11px] text-white/70">
                      Seit {business.founded}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Full-Width 4-Column Quantitative KPI Strip Below Hero Split */}
          <StaggerContainer className="mt-6 sm:mt-8 grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
            {stats.map(({ value, suffix, label, icon: Icon }) => (
              <StaggerItem key={label}>
                <div className="h-full flex flex-col justify-between rounded-xl border border-white/10 bg-white/[0.04] p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-base sm:text-xl lg:text-2xl font-extrabold text-white font-mono tabular-nums">
                      <CountUp target={value} suffix={suffix} />
                    </p>
                    <Icon size={15} className="shrink-0 text-accent-light" />
                  </div>
                  <p className="mt-1 text-[11px] sm:text-xs font-medium text-white/70 leading-snug">
                    {label}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2: 3-PILLAR VALUE PROPOSITION (COLLAPSIBLE ON MOBILE)
      ══════════════════════════════════════════════════════════════════ */}
      <section
        id="leistungen"
        aria-labelledby="how-we-help-heading"
        className="section bg-white dark:bg-slate-900 border-b border-primary/8 dark:border-white/10"
      >
        <div className="container-page">
          <FadeUp>
            <div className="mx-auto max-w-3xl text-center mb-6 sm:mb-10">
              <div className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs font-semibold text-accent mb-2">
                <span>Mobiler Vor-Ort-Service</span>
                <span aria-hidden="true">·</span>
                <span>Osnabrück &amp; Umgebung</span>
              </div>
              <h2
                id="how-we-help-heading"
                className="text-2xl font-extrabold text-primary dark:text-slate-100 sm:text-3xl lg:text-[34px] text-balance"
              >
                So helfen wir Ihnen direkt bei Ihnen zu Hause
              </h2>
              <p className="mt-2 text-xs sm:text-sm lg:text-[15px] text-ink-muted leading-relaxed">
                {business.mobileServiceNotice}
              </p>
            </div>
          </FadeUp>

          <StaggerContainer className="grid gap-3.5 sm:gap-5 md:grid-cols-3 lg:gap-6">
            {helpPillars.map((pillar) => {
              const Icon = pillar.icon;
              const isExpanded = expandedPillar === pillar.num;
              return (
                <StaggerItem key={pillar.num}>
                  <article className="h-full flex flex-col justify-between rounded-2xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-950 p-4 sm:p-6 shadow-xs transition-all hover:border-accent/45">
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/12 text-accent dark:text-accent-light border border-accent/25">
                          <Icon size={20} aria-hidden="true" />
                        </div>
                        <span className="font-mono text-xs font-extrabold text-accent tabular-nums">
                          {pillar.num}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-xl font-extrabold text-primary dark:text-white leading-snug">
                        {pillar.title}
                      </h3>

                      <p className="mt-2 text-xs sm:text-sm leading-relaxed text-ink-muted dark:text-slate-300">
                        {pillar.description}
                      </p>
                    </div>

                    <div>
                      {/* Mobile Collapsible Accordion Trigger (< md) */}
                      <button
                        type="button"
                        onClick={() => toggleMobilePillar(pillar.num)}
                        aria-expanded={isExpanded}
                        className="mt-3.5 flex md:hidden min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-primary dark:text-slate-200 active:scale-[0.99] transition-all cursor-pointer"
                      >
                        <span>
                          {isExpanded ? "Vorteile ausblenden" : "Alle 3 Vorteile anzeigen"}
                        </span>
                        <ChevronDown
                          size={15}
                          className={`shrink-0 text-accent transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {/* Bullet Points (Collapsible on mobile, always visible on md+) */}
                      <ul
                        className={`${
                          isExpanded ? "mt-3.5 block" : "hidden"
                        } md:mt-5 md:block space-y-2 border-t border-primary/10 dark:border-white/10 pt-3.5 sm:pt-4`}
                      >
                        {pillar.bullets.map((bullet) => (
                          <li
                            key={bullet}
                            className="flex items-start gap-2 text-xs text-primary/90 dark:text-slate-200"
                          >
                            <CheckCircle2
                              size={14}
                              className="mt-0.5 shrink-0 text-emerald-500"
                              aria-hidden="true"
                            />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-3.5 pt-3 border-t border-primary/8 dark:border-white/8">
                        <button
                          type="button"
                          onClick={() => handleSelectPillar(pillar.requestType)}
                          className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border border-accent/25 bg-accent/10 px-3.5 py-2.5 text-xs font-extrabold text-accent dark:text-accent-light hover:bg-accent hover:text-white active:scale-[0.99] transition-all cursor-pointer"
                        >
                          <span>{pillar.ctaLabel}</span>
                          <ArrowRight size={14} className="shrink-0" />
                        </button>
                      </div>
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
        className="section relative scroll-mt-14 overflow-hidden bg-white dark:bg-slate-900 border-t border-primary/8 dark:border-white/10"
      >
        <div className="container-page">
          <FadeUp>
            <div className="mx-auto max-w-3xl text-center mb-4 sm:mb-8">
              <div className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs font-semibold text-accent mb-1.5 sm:mb-2">
                <span>Mobiler Vor-Ort-Service Osnabrück</span>
                <span aria-hidden="true">·</span>
                <span>Schnelle Terminanfrage</span>
              </div>
              <h2 className="text-xl font-extrabold text-primary dark:text-slate-100 sm:text-3xl lg:text-[34px] text-balance">
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
                defaultDevice={selectedDevice}
                defaultSymptom={selectedSymptom}
                defaultBrand={selectedBrand}
                defaultMode={inquiryMode}
                defaultRequestType={selectedRequestType}
              />
            </div>

            <aside className="space-y-4 sm:space-y-5 lg:col-span-4 min-w-0 w-full max-w-full lg:sticky lg:top-20">
              <div className="rounded-2xl border border-primary/10 dark:border-white/10 bg-primary-dark p-4 sm:p-6 text-white">
                <div className="flex items-center gap-3.5 sm:gap-4 pb-4 sm:pb-5 border-b border-white/10">
                  <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-xl border border-white/20">
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
                  <div className="flex items-start gap-2 text-white/85">
                    <MapPin size={14} className="text-accent-light shrink-0 mt-0.5" />
                    <span>
                      Mobiler Vor-Ort-Service in {business.city} &amp; Umgebung · {business.street}, {business.zip} {business.city}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-white/85">
                    <Phone size={14} className="text-accent-light shrink-0" />
                    <a href={business.phoneHref} className="inline-flex min-h-[44px] items-center font-bold hover:underline">
                      {business.phoneDisplay}
                    </a>
                    <span className="text-white/55">({business.hours})</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-800/60 p-4 sm:p-5">
                <p className="text-xs font-semibold text-accent">
                  Service &amp; Erreichbarkeit
                </p>
                <h3 className="mt-1 text-base font-extrabold text-primary dark:text-slate-100">
                  Hannachi Osnabrück
                </h3>
                <dl className="mt-3 space-y-2 text-xs text-ink-muted">
                  <div className="flex items-center justify-between gap-3 border-b border-primary/8 dark:border-white/10 pb-2">
                    <dt className="font-medium text-primary dark:text-slate-200">Vor-Ort-Termine</dt>
                    <dd className="text-right">{business.hours}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-primary/8 dark:border-white/10 pb-2">
                    <dt className="font-medium text-primary dark:text-slate-200">Einsatzgebiet</dt>
                    <dd className="text-right">Osnabrück &amp; Umgebung</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="font-medium text-primary dark:text-slate-200">Ersatzgeräte</dt>
                    <dd className="text-right">Inkl. schriftlicher Garantie</dd>
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
