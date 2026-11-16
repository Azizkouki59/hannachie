"use client";
import type { Metadata } from "next";
import { Clock, MapPin, MessageCircle, Phone } from "lucide-react";
import RepairForm from "@/components/RepairForm";
import GoogleMapsEmbed from "@/components/GoogleMapsEmbed";
import { PageHeader } from "@/components/ui";
import { business } from "@/data/site";
import { buildRouteMetadata } from "@/lib/seo";

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

export default function Kontakt({
  searchParams,
}: {
  searchParams: { geraet?: string; symptom?: string; mode?: string };
}) {
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
                <a href={business.phoneHref} className="font-semibold text-primary dark:text-slate-100 hover:text-accent transition-colors">
                  {business.phoneDisplay}
                </a>
              </ContactItem>
              <ContactItem icon={MapPin} title="Einsatzgebiet &amp; Anschrift">
                <address className="not-italic text-[14px]">
                  {business.owner}
                  <br />
                  {business.street}
                  <br />
                  {business.zip} {business.city}
                </address>
                <p className="mt-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                  {business.mobileServiceNotice}
                </p>
              </ContactItem>
              <ContactItem icon={Clock} title="Vor-Ort-Termine">
                <span className="text-[14px]">{business.hours}</span>
              </ContactItem>
            </div>

            {/* Embedded Google Maps Card */}
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-primary/8 dark:border-white/10 p-4 pb-3">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-faint">
                  <MapPin size={14} className="text-accent" />
                  Region Osnabrück
                </span>
              </div>
              <GoogleMapsEmbed />
              <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 bg-surface p-3.5 text-xs text-ink-muted">
                <span className="min-w-0 truncate">
                  {business.street}, {business.zip} {business.city}
                </span>
                <a
                  href={business.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-accent hover:underline shrink-0"
                >
                  In Maps öffnen ↗
                </a>
              </div>
            </div>
          </aside>
          <div id="anfrage" className="min-w-0 scroll-mt-28 lg:col-span-8">
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
