import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  Database,
  ExternalLink,
  Eye,
  FileText,
  MapPin,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/ui";
import { business } from "@/data/site";
import { buildRouteMetadata } from "@/lib/seo";

export const metadata: Metadata = buildRouteMetadata("/datenschutz");

const ANCHORS = [
  { href: "#verantwortlicher", label: "Verantwortlicher" },
  { href: "#hosting", label: "Hosting & Logs" },
  { href: "#whatsapp", label: "Kontakt & WhatsApp" },
  { href: "#google", label: "Google & Standort" },
  { href: "#speicherdauer", label: "Cookies & Speicherdauer" },
  { href: "#rechte", label: "Ihre Rechte" },
];

export default function Datenschutz() {
  const { dataProtectionAuthority } = business.legal;

  return (
    <>
      <PageHeader
        title="Datenschutzerklärung"
        intro="Kurz und transparent: Pflichtinformationen gemäß Art. 13 DSGVO und § 25 TDDDG zur Verarbeitung personenbezogener Daten auf hannachi.de."
        readTime="Stand: 2026 · DSGVO & TDDDG"
      />

      <section className="section bg-white dark:bg-slate-950 text-primary dark:text-slate-100">
        <div className="container-page">
          <div className="mx-auto max-w-3xl space-y-8 leading-relaxed">
            {/* Meta & Jump Anchor Bar */}
            <div className="space-y-3 border-b border-primary/10 dark:border-white/10 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-ink-muted dark:text-slate-400">
                <div className="inline-flex items-center gap-2 font-semibold text-primary dark:text-slate-200">
                  <Clock3 size={16} className="text-accent shrink-0" aria-hidden="true" />
                  <span>Datenschutz nach DSGVO &amp; § 25 TDDDG</span>
                </div>
                <Link
                  href="/impressum"
                  className="inline-flex items-center gap-1.5 font-semibold text-accent dark:text-accent-light hover:underline"
                >
                  <FileText size={14} className="shrink-0" aria-hidden="true" />
                  <span>Zum Impressum</span>
                </Link>
              </div>

              <nav
                aria-label="Abschnitte der Datenschutzerklärung"
                className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-ink-muted dark:text-slate-400"
              >
                {ANCHORS.map((item, index) => (
                  <span key={item.href} className="inline-flex items-center gap-x-4">
                    <a
                      href={item.href}
                      className="py-1 hover:text-accent transition-colors underline-offset-4 hover:underline"
                    >
                      {item.label}
                    </a>
                    {index < ANCHORS.length - 1 && (
                      <span aria-hidden="true" className="text-primary/20 dark:text-white/20">
                        ·
                      </span>
                    )}
                  </span>
                ))}
              </nav>
            </div>

            {/* 1. Verantwortliche Stelle */}
            <section
              id="verantwortlicher"
              className="scroll-mt-24 card rounded-2xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-900 p-6 sm:p-7 space-y-3"
            >
              <div className="flex items-center gap-2 text-accent">
                <ShieldCheck size={20} aria-hidden="true" />
                <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
                  1. Verantwortlicher (Art. 4 Nr. 7 DSGVO)
                </h2>
              </div>
              <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
                <strong className="font-semibold text-primary dark:text-slate-100">
                  {business.owner}
                </strong>{" "}
                ({business.name} {business.tagline}, {business.legal.legalForm})
                <br />
                {business.street}, {business.zip} {business.city}, Deutschland
                <br />
                Telefon:{" "}
                <a
                  href={business.phoneHref}
                  className="font-semibold text-accent dark:text-accent-light underline underline-offset-4 tabular-nums"
                >
                  {business.phoneDisplay}
                </a>{" "}
                · E-Mail:{" "}
                <a
                  href={`mailto:${business.email}`}
                  className="font-semibold text-accent dark:text-accent-light underline underline-offset-4"
                >
                  {business.email}
                </a>
              </p>
            </section>

            {/* 2. Hosting, SSL & lokale Schriftarten */}
            <section id="hosting" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-accent">
                <Database size={18} aria-hidden="true" />
                <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
                  2. Hosting, Server-Logfiles &amp; lokale Schriften
                </h2>
              </div>
              <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
                Diese Website wird über HTTPS/TLS verschlüsselt ausgeliefert. Beim Aufruf
                erfasst der Webserver automatisch technisch notwendige Verbindungsdaten
                (IP-Adresse, Zeitpunkt, aufgerufene Seite, Browsertyp), um Betriebssicherheit
                und Stabilität zu gewährleisten (<strong>Art. 6 Abs. 1 lit. f DSGVO</strong>).
                Server-Logfiles werden automatisch nach 7 bis 30 Tagen gelöscht.
              </p>
              <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
                Alle Schriftarten sind lokal eingebunden; es erfolgt kein Abruf über externe
                Font-Server.
              </p>
            </section>

            {/* 3. Anfrageformular, Telefon, E-Mail & WhatsApp */}
            <section
              id="whatsapp"
              className="scroll-mt-24 card space-y-3.5 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.08] p-6 sm:p-7"
            >
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <MessageCircle size={20} aria-hidden="true" />
                <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
                  3. Kontaktaufnahme, Formular &amp; WhatsApp
                </h2>
              </div>

              <div className="space-y-3 text-sm sm:text-base text-ink-muted dark:text-slate-300">
                <p>
                  <strong className="font-semibold text-primary dark:text-slate-100">
                    Anfrageformular, Telefon &amp; E-Mail:
                  </strong>{" "}
                  Angaben aus Ihrer Anfrage (z. B. Gerät, Anliegen, PLZ/Ort, optional Name und
                  Telefonnummer) verarbeiten wir ausschließlich zur Bearbeitung Ihrer Anfrage
                  und Terminabstimmung (<strong>Art. 6 Abs. 1 lit. b &amp; f DSGVO</strong>).
                  Eine Weitergabe an unbeteiligte Dritte findet nicht statt.
                </p>

                <p>
                  <strong className="font-semibold text-primary dark:text-slate-100">
                    Freiwilliger WhatsApp-Kontakt:
                  </strong>{" "}
                  Eine Verbindung zu <strong>WhatsApp Ireland Limited</strong> (Meta) entsteht
                  erst, wenn Sie aktiv einen WhatsApp-Button anklicken (
                  <strong>Art. 6 Abs. 1 lit. a &amp; b DSGVO</strong>). Alternativ erreichen Sie
                  uns jederzeit per Telefon (
                  <a
                    href={business.phoneHref}
                    className="font-semibold text-accent underline underline-offset-2 tabular-nums"
                  >
                    {business.phoneDisplay}
                  </a>
                  ) oder E-Mail (
                  <a
                    href={`mailto:${business.email}`}
                    className="font-semibold text-accent underline underline-offset-2"
                  >
                    {business.email}
                  </a>
                  ).{" "}
                  <a
                    href="https://www.whatsapp.com/legal/privacy-policy-eea"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 font-semibold text-accent underline underline-offset-2"
                  >
                    <span>WhatsApp-Datenschutz (EWR)</span>
                    <ExternalLink size={11} aria-hidden="true" />
                  </a>
                </p>
              </div>
            </section>

            {/* 4. Google Maps, Standort-Erkennung, Bewertungen & externe Links */}
            <section id="google" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-accent">
                <MapPin size={18} aria-hidden="true" />
                <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
                  4. Google Maps, Standort-Erkennung &amp; externe Links
                </h2>
              </div>

              <div className="space-y-3 text-sm sm:text-base text-ink-muted dark:text-slate-300">
                <p>
                  <strong className="font-semibold text-primary dark:text-slate-100">
                    Interaktive Karte (Google Maps):
                  </strong>{" "}
                  Karteninhalte von <strong>Google Ireland Limited</strong> (Google LLC, EU-US
                  Data Privacy Framework) werden erst nach Ihrer Einwilligung bzw. Interaktion
                  geladen (<strong>Art. 6 Abs. 1 lit. a DSGVO</strong>, § 25 TDDDG). Ihre
                  Einstellung können Sie jederzeit über <em>„Cookie-Einstellungen“</em> in der
                  Fußzeile widerrufen.
                </p>

                <p>
                  <strong className="font-semibold text-primary dark:text-slate-100">
                    Optionale Standort-Erkennung:
                  </strong>{" "}
                  Die Standortabfrage des Browsers erfolgt niemals automatisch, sondern nur
                  nach Ihrem aktiven Klick und Ihrer Browser-Freigabe (
                  <strong>Art. 6 Abs. 1 lit. a DSGVO</strong>). Koordinaten werden serverseitig
                  in PLZ und Ort umgewandelt (Google Geocoding API / OpenStreetMap-Fallback), um
                  das Formular bequem vorauszufüllen oder die Entfernung nach Osnabrück
                  anzuzeigen.
                </p>

                <p>
                  <strong className="font-semibold text-primary dark:text-slate-100">
                    Google-Bewertungen &amp; Facebook:
                  </strong>{" "}
                  Öffentliche Bewertungen unseres Profils werden serverseitig ohne
                  Tracking-Cookies bereitgestellt. Der Verweis auf Facebook ist ein reiner
                  externer Link ohne Tracking-Pixel.
                </p>
              </div>
            </section>

            {/* 5. Cookies, lokale Speicherung & Speicherdauer */}
            <section id="speicherdauer" className="scroll-mt-24 space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
                5. Cookies, lokale Speicherung (§ 25 TDDDG) &amp; Speicherdauer
              </h2>
              <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
                Wir setzen <strong>keine Werbe- oder Tracking-Cookies</strong> ein. Im lokalen
                Speicher Ihres Browsers werden ausschließlich technisch erforderliche
                Einstellungen gespeichert (Farbdesign, Karten-Einwilligung sowie optional ein
                Formular-Entwurf bzw. ein gewählter Ort während Ihrer Sitzung;{" "}
                <strong>§ 25 Abs. 2 Nr. 2 TDDDG</strong>).
              </p>
              <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
                Personenbezogene Daten werden gelöscht, sobald der Zweck entfällt und keine
                gesetzlichen Aufbewahrungsfristen (z. B. 6 bis 10 Jahre für Kaufbelege nach
                § 257 HGB, § 147 AO) entgegenstehen.
              </p>
            </section>

            {/* 6. Ihre Rechte & Aufsichtsbehörde */}
            <section
              id="rechte"
              className="scroll-mt-24 card space-y-4 rounded-2xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-900 p-6 sm:p-7"
            >
              <div className="flex items-center gap-2 text-accent">
                <Eye size={20} aria-hidden="true" />
                <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
                  6. Ihre Rechte nach DSGVO
                </h2>
              </div>
              <div className="grid gap-2 text-xs sm:text-sm text-ink-muted dark:text-slate-300">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-accent shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    <strong>Auskunft, Berichtigung, Löschung &amp; Einschränkung</strong> (Art. 15–18 DSGVO)
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-accent shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    <strong>Datenübertragbarkeit &amp; Widerspruch</strong> (Art. 20–21 DSGVO)
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-accent shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    <strong>Widerruf erteilter Einwilligungen</strong> jederzeit mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO)
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-primary/10 dark:border-white/10 space-y-1 text-xs sm:text-sm text-ink-muted dark:text-slate-300">
                <p className="font-bold text-primary dark:text-slate-100">
                  Beschwerderecht bei der Aufsichtsbehörde (Art. 77 DSGVO):
                </p>
                <p>
                  {dataProtectionAuthority.name}, {dataProtectionAuthority.street},{" "}
                  {dataProtectionAuthority.zipCity} · Tel.{" "}
                  <span className="tabular-nums">{dataProtectionAuthority.phone}</span> ·{" "}
                  <a
                    href={`mailto:${dataProtectionAuthority.email}`}
                    className="font-semibold text-accent underline underline-offset-2"
                  >
                    {dataProtectionAuthority.email}
                  </a>{" "}
                  ·{" "}
                  <a
                    href={dataProtectionAuthority.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 font-semibold text-accent underline underline-offset-2"
                  >
                    <span>lfd.niedersachsen.de</span>
                    <ExternalLink size={11} aria-hidden="true" />
                  </a>
                </p>
              </div>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}
