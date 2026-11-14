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
        title="Wir helfen Ihnen gerne weiter."
        intro="Füllen Sie das Formular rechts aus – Ihre komplette Reparaturanfrage oder direkte Frage wird fertig vorbereitet und ausschließlich per WhatsApp an Herrn Hannachi gesendet."
      />
      <section className="section bg-surface">
        <div className="container-page grid gap-8 lg:gap-12 lg:grid-cols-12">
          <aside className="min-w-0 space-y-6 lg:col-span-4">
            <div className="card p-6 space-y-6">
              <ContactItem icon={MessageCircle} title="Anfrage & Direkte Frage (WhatsApp)">
                <p className="text-[13px] leading-relaxed">
                  Nutzen Sie einfach das Formular nebenan – wir bereiten Ihre Nachricht direkt für WhatsApp an Herrn Hannachi vor.
                </p>
              </ContactItem>
              <ContactItem icon={Phone} title="Werkstatt-Telefon">
                <a href={business.phoneHref} className="font-semibold text-primary dark:text-slate-100 hover:text-accent transition-colors">
                  {business.phoneDisplay}
                </a>
              </ContactItem>
              <ContactItem icon={MapPin} title="Adresse">
                <address className="not-italic text-[14px]">
                  {business.owner}
                  <br />
                  {business.street}
                  <br />
                  {business.zip} {business.city}
                </address>
              </ContactItem>
              <ContactItem icon={Clock} title="Termine">
                <span className="text-[14px]">{business.hours}</span>
              </ContactItem>
            </div>

            {/* Embedded Google Maps Card */}
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-primary/8 dark:border-white/10 p-4 pb-3">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-faint">
                  <MapPin size={14} className="text-accent" />
                  Standort &amp; Anfahrt
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
