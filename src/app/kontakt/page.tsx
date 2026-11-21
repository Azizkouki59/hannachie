"use client";
import type { Metadata } from "next";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Clock, Link2, MapPin, MessageCircle, Phone, Radar } from "lucide-react";
import RepairForm from "@/components/RepairForm";
import GoogleCalendarScheduler from "@/components/GoogleCalendarScheduler";
import GoogleMapsEmbed, { type ContactMapViewMode } from "@/components/GoogleMapsEmbed";
import PhotoAnleitungGuide from "@/components/PhotoAnleitungGuide";
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
  const { place, source } = useGoogleLivePlace();
  const prefersReducedMotion = useReducedMotion();
  const urlMapMode = parseMapModeParam(searchParams?.mode);
  const [mapViewMode, setMapViewMode] = useState<ContactMapViewMode>(
    urlMapMode ?? "service-area"
  );
  const [copiedMapLink, setCopiedMapLink] = useState(false);

  // Sync map view when URL ?mode= changes via external links or browser Back/Forward
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
      // Clipboard API unavailable; update URL directly so user can copy from address bar
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
        title="Vor-Ort-Termin & persönliche Beratung."
        intro="Nutzen Sie das Formular für einen Vor-Ort-Termin bei Ihnen zu Hause in Osnabrück & Umgebung, passende Ersatzteile nach Typenschild, ein geprüftes Ersatzgerät mit schriftlicher Verkäufergarantie oder einen Garantie-Fall – Ihre Nachricht wird fertig für WhatsApp an Herrn Hannachi vorbereitet."
      />
      <section className="section bg-surface">
        <div className="container-page grid gap-6 lg:gap-8 lg:grid-cols-12 lg:items-start">
          <aside className="min-w-0 space-y-5 lg:col-span-4 lg:sticky lg:top-20">
            <div className="card p-5 space-y-5">
              <ContactItem icon={MessageCircle} title="Vor-Ort-Termin &amp; Direktanfrage">
                <p className="text-[13px] leading-relaxed">
                  Schildern Sie kurz das Problem an Ihrem Gerät oder das benötigte Ersatzteil – wir bereiten Ihre Anfrage direkt für WhatsApp an Herrn Hannachi vor.
                </p>
              </ContactItem>
              <ContactItem icon={Phone} title="Telefon &amp; WhatsApp">
                <a href={place.phoneHref} className="inline-flex min-h-[44px] sm:min-h-0 items-center font-semibold text-primary dark:text-slate-100 hover:text-accent transition-colors">
                  {place.phoneDisplay}
                </a>
              </ContactItem>
              <ContactItem icon={MapPin} title="Einsatzgebiet &amp; Anschrift">
                <address className="not-italic text-[14px]">
                  {business.owner}
                  <br />
                  {place.streetLine}
                  <br />
                  {place.zipCityLine}
                </address>
                <p className="mt-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                  {business.mobileServiceNotice}
                </p>
              </ContactItem>
              <ContactItem icon={Clock} title="Vor-Ort-Termine">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px]">{place.hoursSummary}</span>
                    {source === "live" && place.openNow !== null && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          place.openNow
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            place.openNow ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                          aria-hidden="true"
                        />
                        {place.openNow ? "Jetzt geöffnet" : "Aktuell geschlossen"}
                      </span>
                    )}
                  </div>
                  {source === "live" && place.weekdayDescriptions.length > 0 && (
                    <ul className="space-y-0.5 border-t border-primary/8 dark:border-white/10 pt-1.5 text-xs text-ink-muted">
                      {place.weekdayDescriptions.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </ContactItem>
            </div>

            {/* Embedded Google Maps Card with Service Area / Pin Toggle */}
            <div className="card overflow-hidden">
              <div className="flex flex-col gap-2.5 border-b border-primary/8 dark:border-white/10 p-3.5 sm:p-4 pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={mapViewMode}
                      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -3 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 3 }}
                      transition={{ duration: prefersReducedMotion ? 0.1 : 0.2, ease: "easeOut" }}
                      className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-faint min-w-0"
                    >
                      {mapViewMode === "service-area" ? (
                        <Radar size={14} className="text-sky-600 dark:text-sky-400 shrink-0" />
                      ) : (
                        <MapPin size={14} className="text-accent shrink-0" />
                      )}
                      <span className="truncate">
                        {mapViewMode === "service-area"
                          ? "Einsatzgebiet · 25 km"
                          : "Standort-Pin · Osnabrück"}
                      </span>
                    </motion.span>
                  </AnimatePresence>

                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    data-testid="contact-map-share-link"
                    title={`Link zu dieser Kartenansicht kopieren (?mode=${mapViewMode})`}
                    className="inline-flex min-h-[38px] sm:min-h-[32px] items-center gap-1.5 rounded-xl sm:rounded-lg border border-primary/12 dark:border-white/15 bg-surface px-2.5 sm:px-2 py-1 text-xs sm:text-[11px] font-bold text-ink-muted hover:text-primary dark:hover:text-white hover:border-sky-500/40 active:scale-95 transition-all cursor-pointer shrink-0"
                  >
                    {copiedMapLink ? (
                      <>
                        <Check size={12} className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                        <span className="text-emerald-700 dark:text-emerald-300">Kopiert</span>
                      </>
                    ) : (
                      <>
                        <Link2 size={12} aria-hidden="true" />
                        <span>Ansicht teilen</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Segmented Map Mode Toggle Button */}
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
                    className={`relative min-h-[44px] sm:min-h-[40px] px-2.5 py-1.5 rounded-lg text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
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
                    <Radar size={14} aria-hidden="true" className="relative z-10 shrink-0" />
                    <span className="relative z-10 truncate">Einsatzgebiet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMapViewModeChange("pin")}
                    aria-pressed={mapViewMode === "pin"}
                    data-testid="contact-map-toggle-pin"
                    className={`relative min-h-[44px] sm:min-h-[40px] px-2.5 py-1.5 rounded-lg text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
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
                    <MapPin size={14} aria-hidden="true" className="relative z-10 shrink-0" />
                    <span className="relative z-10 truncate">Standort-Pin</span>
                  </button>
                </div>
              </div>

              <GoogleMapsEmbed
                className="relative h-[245px] min-[380px]:h-[275px] sm:h-[310px] lg:h-[290px] xl:h-[310px] w-full"
                viewMode={mapViewMode}
                onViewModeChange={handleMapViewModeChange}
                title={
                  mapViewMode === "service-area"
                    ? "Hannachi Einsatzgebiet Osnabrück & Umgebung (25 km)"
                    : "Hannachi Standort-Pin Osnabrück auf Google Maps"
                }
              />
            </div>
          </aside>
          <div id="anfrage" className="min-w-0 scroll-mt-28 lg:col-span-8 space-y-6">
            <RepairForm
              defaultDevice={defaultDevice}
              defaultSymptom={searchParams?.symptom || ""}
              defaultMode={defaultMode}
              showPhotoGuideLink
            />
            <PhotoAnleitungGuide id="photo-anleitung" />
            <div id="kalender-termin" className="scroll-mt-28">
              <GoogleCalendarScheduler
                mode="customer"
                defaultDevice={defaultDevice || "Waschmaschine"}
                defaultProblem={searchParams?.symptom || ""}
              />
            </div>
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
    <div className="flex gap-4 items-start">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
        <Icon size={18} aria-hidden />
      </span>
      <div className="min-w-0">
        <h2 className="text-sm font-bold text-primary dark:text-slate-100">{title}</h2>
        <div className="mt-1 text-ink-muted text-sm">{children}</div>
      </div>
    </div>
  );
}
