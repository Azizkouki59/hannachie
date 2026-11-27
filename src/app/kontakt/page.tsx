"use client";
import type { Metadata } from "next";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Check,
  Clock,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Radar,
} from "lucide-react";
import RepairForm from "@/components/RepairForm";
import AvailabilityBadge from "@/components/AvailabilityBadge";
import GoogleMapsEmbed, { type ContactMapViewMode } from "@/components/GoogleMapsEmbed";
import { Spatial3DCard } from "@/components/animations";
import { PageHeader } from "@/components/ui";
import { business } from "@/data/site";
import { triggerHapticFeedback } from "@/lib/haptics";
import { useGoogleLivePlace } from "@/lib/googlePlaceLive";
import { buildRouteMetadata } from "@/lib/seo";
import { updateUrlSearchParams } from "@/shims/next-navigation";

export const metadata: Metadata = buildRouteMetadata("/kontakt");

const deviceBySlug: Record<string, string> = {
  waschmaschinen: "Waschmaschine",
  waschmaschine: "Waschmaschine",
  geschirrspueler: "Geschirrspüler",
  kuehlschraenke: "Kühlschrank / Gefriergerät",
  kuehlschrank: "Kühlschrank / Gefriergerät",
  backoefen: "Backofen / Herd",
  backofen: "Backofen / Herd",
  herd: "Backofen / Herd",
  trockner: "Wäschetrockner",
  waeschetrockner: "Wäschetrockner",
  waschtrockner: "Wäschetrockner",
  induktion: "Ceranfeld / Induktion",
  ceranfeld: "Ceranfeld / Induktion",
  dunstabzug: "Dunstabzugshaube",
  dunstabzugshaube: "Dunstabzugshaube",
  dunstabzugshauben: "Dunstabzugshaube",
  mikrowelle: "Mikrowelle",
  mikrowellen: "Mikrowelle",
  kaffee: "Kaffeevollautomat",
  kaffeevollautomat: "Kaffeevollautomat",
  kaffeevollautomaten: "Kaffeevollautomat",
  platine: "Elektronik / Platine",
  platinen: "Elektronik / Platine",
  elektronik: "Elektronik / Platine",
  steuerungsplatinen: "Elektronik / Platine",
  anderes: "Anderes Gerät (Sonstiges)",
};

function parseMapModeParam(mode?: string): ContactMapViewMode | null {
  const normalized = mode?.trim().toLowerCase();
  if (normalized === "pin") return "pin";
  if (normalized === "service-area") return "service-area";
  return null;
}

export default function Kontakt({
  searchParams,
}: {
  searchParams: { geraet?: string; symptom?: string; mode?: string };
}) {
  const { place } = useGoogleLivePlace();
  const prefersReducedMotion = useReducedMotion();
  const urlMapMode = parseMapModeParam(searchParams?.mode);

  const [mapViewMode, setMapViewMode] = useState<ContactMapViewMode>(
    urlMapMode ?? "service-area"
  );
  const [copiedMapLink, setCopiedMapLink] = useState(false);

  useEffect(() => {
    if (urlMapMode) {
      setMapViewMode(urlMapMode);
    } else if (!searchParams?.mode) {
      setMapViewMode("service-area");
    }
  }, [urlMapMode, searchParams?.mode]);

  const handleMapViewModeChange = (nextMode: ContactMapViewMode) => {
    triggerHapticFeedback(25);
    setMapViewMode(nextMode);
    setCopiedMapLink(false);
    updateUrlSearchParams({ mode: nextMode });
  };

  const handleCopyShareLink = async () => {
    if (typeof window === "undefined") return;
    triggerHapticFeedback(20);
    const shareUrl = new URL(window.location.href);
    shareUrl.searchParams.set("mode", mapViewMode);
    try {
      await navigator.clipboard.writeText(shareUrl.toString());
      setCopiedMapLink(true);
      window.setTimeout(() => setCopiedMapLink(false), 2200);
    } catch {
      updateUrlSearchParams({ mode: mapViewMode }, { replace: true });
    }
  };

  const param = searchParams?.geraet?.trim().toLowerCase();
  let defaultDevice = "";

  if (param && deviceBySlug[param]) {
    defaultDevice = deviceBySlug[param];
  } else if (searchParams?.geraet) {
    defaultDevice = searchParams.geraet.trim();
  }

  const defaultMode = searchParams?.mode === "question" ? "question" : "repair";

  return (
    <>
      <PageHeader
        title="Kontakt & Anfrage."
        intro="Direkt per WhatsApp, Telefon oder Kurzformular · Osnabrück · Termine nach Vereinbarung."
      />
      <section className="py-7 sm:py-11 bg-surface dark:bg-slate-950">
        <div className="container-page grid gap-6 lg:gap-7 lg:grid-cols-12 lg:items-start">
          {/* Compact Sticky Contact & Map Sidebar */}
          <aside className="min-w-0 self-start space-y-4 lg:col-span-4 lg:sticky lg:top-20">
            <Spatial3DCard maxTilt={4} className="rounded-2xl">
              <div className="card p-4 sm:p-5 space-y-4">
                <ContactItem icon={MessageCircle} title="WhatsApp (Direkt)">
                  <p className="text-xs leading-relaxed mb-2">
                    Schnellste Antwort · gerne mit Typenschild-Foto.
                  </p>
                  <a
                    href={business.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-extrabold text-white transition-colors"
                  >
                    <MessageCircle size={14} aria-hidden="true" />
                    <span>WhatsApp öffnen</span>
                  </a>
                  <p className="mt-1.5 text-[10.5px] leading-snug text-ink-faint">
                    Freiwillige Weiterleitung zu WhatsApp (Meta) ·{" "}
                    <Link
                      href="/datenschutz#whatsapp"
                      className="underline underline-offset-2 hover:text-accent"
                    >
                      Datenschutz
                    </Link>
                  </p>
                </ContactItem>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5 pt-3 border-t border-primary/8 dark:border-white/10">
                  <ContactItem icon={Phone} title="Telefon">
                    <a
                      href={place.phoneHref}
                      className="inline-flex min-h-[36px] items-center font-bold text-primary dark:text-slate-100 hover:text-accent transition-colors tabular-nums"
                    >
                      {place.phoneDisplay}
                    </a>
                  </ContactItem>

                  <ContactItem icon={Mail} title="E-Mail">
                    <a
                      href={`mailto:${business.email}`}
                      className="inline-flex min-h-[36px] items-center font-semibold text-primary dark:text-slate-100 hover:text-accent transition-colors break-all"
                    >
                      {business.email}
                    </a>
                  </ContactItem>

                  <ContactItem icon={Clock} title="Erreichbarkeit">
                    <p className="text-xs font-semibold text-primary dark:text-slate-100">
                      Mo–Sa 08:00–18:00 Uhr
                    </p>
                    <p className="text-[11px] text-ink-muted">
                      Termine nach Vereinbarung
                    </p>
                    <AvailabilityBadge tone="light" className="mt-1 text-[11px]" />
                  </ContactItem>

                  <ContactItem icon={MapPin} title="Standort">
                    <address className="not-italic text-xs leading-relaxed">
                      <span className="font-semibold text-primary dark:text-slate-100">
                        {business.owner}
                      </span>
                      <br />
                      {business.street}, {business.zip} {business.city}
                    </address>
                  </ContactItem>
                </div>
              </div>
            </Spatial3DCard>

            {/* Compact Interactive Map Card */}
            <div className="card overflow-hidden">
              <div className="flex flex-col gap-2 border-b border-primary/8 dark:border-white/10 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-faint min-w-0">
                    {mapViewMode === "service-area" ? (
                      <Radar size={13} className="text-sky-600 dark:text-sky-400 shrink-0" />
                    ) : (
                      <MapPin size={13} className="text-accent shrink-0" />
                    )}
                    <span className="truncate">
                      {mapViewMode === "service-area"
                        ? "Region Osnabrück · 25 km"
                        : "Standort-Pin · Osnabrück"}
                    </span>
                  </span>

                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    data-testid="contact-map-share-link"
                    title={`Link zu dieser Kartenansicht kopieren (?mode=${mapViewMode})`}
                    className="inline-flex min-h-[32px] items-center gap-1 rounded-lg border border-primary/12 dark:border-white/15 bg-surface px-2 py-1 text-[11px] font-bold text-ink-muted hover:text-primary dark:hover:text-white hover:border-sky-500/40 transition-colors cursor-pointer shrink-0"
                  >
                    {copiedMapLink ? (
                      <>
                        <Check size={12} className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                        <span className="text-emerald-700 dark:text-emerald-300">Kopiert</span>
                      </>
                    ) : (
                      <>
                        <Link2 size={12} aria-hidden="true" />
                        <span>Teilen</span>
                      </>
                    )}
                  </button>
                </div>

                <div
                  role="group"
                  aria-label="Kartenansicht wechseln"
                  data-testid="contact-map-mode-toggle"
                  className="grid grid-cols-2 gap-1 rounded-xl bg-primary/5 dark:bg-white/5 p-1"
                >
                  <button
                    type="button"
                    onClick={() => handleMapViewModeChange("service-area")}
                    aria-pressed={mapViewMode === "service-area"}
                    data-testid="contact-map-toggle-service-area"
                    className={`relative min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      mapViewMode === "service-area"
                        ? "text-white"
                        : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    {mapViewMode === "service-area" && (
                      <motion.span
                        layoutId="contact-map-mode-pill"
                        transition={
                          prefersReducedMotion
                            ? { duration: 0.1 }
                            : { type: "spring", stiffness: 380, damping: 32 }
                        }
                        className="absolute inset-0 rounded-lg bg-sky-600 shadow-xs"
                        aria-hidden="true"
                      />
                    )}
                    <Radar size={13} aria-hidden="true" className="relative z-10 shrink-0" />
                    <span className="relative z-10 truncate">Region (25 km)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMapViewModeChange("pin")}
                    aria-pressed={mapViewMode === "pin"}
                    data-testid="contact-map-toggle-pin"
                    className={`relative min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      mapViewMode === "pin"
                        ? "text-white"
                        : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    {mapViewMode === "pin" && (
                      <motion.span
                        layoutId="contact-map-mode-pill"
                        transition={
                          prefersReducedMotion
                            ? { duration: 0.1 }
                            : { type: "spring", stiffness: 380, damping: 32 }
                        }
                        className="absolute inset-0 rounded-lg bg-primary dark:bg-accent shadow-xs"
                        aria-hidden="true"
                      />
                    )}
                    <MapPin size={13} aria-hidden="true" className="relative z-10 shrink-0" />
                    <span className="relative z-10 truncate">Standort-Pin</span>
                  </button>
                </div>
              </div>

              <GoogleMapsEmbed
                className="relative h-[220px] sm:h-[250px] w-full"
                viewMode={mapViewMode}
                onViewModeChange={handleMapViewModeChange}
                title={
                  mapViewMode === "service-area"
                    ? "Hannachi Region Osnabrück & Umgebung (25 km)"
                    : "Hannachi Standort-Pin Osnabrück auf Google Maps"
                }
              />
            </div>
          </aside>

          {/* Direct Inquiry Form */}
          <div id="anfrage" className="min-w-0 scroll-mt-24 lg:col-span-8">
            <RepairForm
              defaultDevice={defaultDevice}
              defaultSymptom={searchParams?.symptom || ""}
              defaultMode={defaultMode}
            />
          </div>
        </div>
      </section>
    </>
  );
}

function ContactItem({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Phone;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 items-start">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
        <Icon size={16} aria-hidden />
      </span>
      <div className="min-w-0">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-primary dark:text-slate-100">
          {title}
        </h2>
        <div className="mt-0.5 text-ink-muted text-xs sm:text-sm">{children}</div>
      </div>
    </div>
  );
}
