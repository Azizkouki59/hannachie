import type { Metadata } from "next";
import Link from "next/link";
import { Clock3, FileText, Mail, MapPin, Phone, ShieldCheck, Scale, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { business } from "@/data/site";
import { buildRouteMetadata } from "@/lib/seo";

export const metadata: Metadata = buildRouteMetadata("/impressum");

export default function Impressum() {
  return (
    <>
      <PageHeader
        title="Impressum"
        intro="Gesetzliche Anbieterkennzeichnung gemäß § 5 DDG (Digitale-Dienste-Gesetz) und Verbraucherinformationen für Hannachi Elektrohaushaltsgeräte Service in Osnabrück."
        readTime="Lesezeit: ca. 1 Min."
      />

      <section className="section bg-white dark:bg-slate-950 text-primary dark:text-slate-100">
        <div className="container-page max-w-3xl space-y-8 leading-relaxed">
          {/* Breadcrumb / Meta Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/10 dark:border-white/10 pb-4 text-xs sm:text-sm text-ink-muted dark:text-slate-400">
            <div className="inline-flex items-center gap-2 font-semibold text-primary dark:text-slate-200">
              <Clock3 size={16} className="text-accent shrink-0" aria-hidden="true" />
              <span>Stand: 2026 · Gemäß DDG &amp; DSGVO</span>
            </div>
            <Link
              href="/datenschutz"
              className="inline-flex items-center gap-1.5 font-semibold text-accent dark:text-accent-light hover:underline"
            >
              <FileText size={14} className="shrink-0" aria-hidden="true" />
              <span>Zur Datenschutzerklärung</span>
            </Link>
          </div>

          {/* 1. Anbieterkennzeichnung gemäß § 5 DDG */}
          <div className="rounded-2xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-900 p-6 sm:p-8 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-accent">
              <ShieldCheck size={20} aria-hidden="true" />
              <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
                Angaben gemäß § 5 DDG (Digitale-Dienste-Gesetz)
              </h2>
            </div>

            <div className="text-sm sm:text-base text-ink-muted dark:text-slate-300 space-y-1">
              <p className="font-extrabold text-primary dark:text-slate-100 text-base sm:text-lg">
                {business.name} {business.tagline}
              </p>
              <p>
                <strong className="font-semibold text-primary dark:text-slate-200">
                  Inhaber:
                </strong>{" "}
                {business.owner}
              </p>
              <p className="flex items-start gap-1.5 pt-1">
                <MapPin size={16} className="text-accent shrink-0 mt-1" aria-hidden="true" />
                <span>
                  {business.street}
                  <br />
                  {business.zip} {business.city}
                  <br />
                  Deutschland (Niedersachsen)
                </span>
              </p>
            </div>
          </div>

          {/* 2. Kontaktangaben */}
          <div className="rounded-2xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-900 p-6 sm:p-8 space-y-4 shadow-sm">
            <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
              Kontakt &amp; schnelle Erreichbarkeit
            </h2>
            <div className="grid gap-3 text-sm sm:text-base text-ink-muted dark:text-slate-300">
              <div className="flex items-center gap-2.5">
                <Phone size={16} className="text-accent shrink-0" aria-hidden="true" />
                <span>
                  <strong className="font-semibold text-primary dark:text-slate-200">
                    Telefon:
                  </strong>{" "}
                  <a
                    className="font-semibold text-accent dark:text-accent-light underline underline-offset-4 hover:opacity-85"
                    href={business.phoneHref}
                  >
                    {business.phoneDisplay}
                  </a>
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail size={16} className="text-accent shrink-0" aria-hidden="true" />
                <span>
                  <strong className="font-semibold text-primary dark:text-slate-200">
                    E-Mail:
                  </strong>{" "}
                  <a
                    className="font-semibold text-accent dark:text-accent-light underline underline-offset-4 hover:opacity-85"
                    href={`mailto:${business.email}`}
                  >
                    {business.email}
                  </a>
                </span>
              </div>

              <p className="pt-1 text-xs text-ink-faint">
                Erreichbarkeit &amp; Werkstatt-Termine: {business.hours}
              </p>
            </div>
          </div>

          {/* 3. Steuerliche Einordnung & Gewerbeanmeldung */}
          <div className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
              Umsatzsteuer &amp; gewerbliche Registrierung
            </h2>
            <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300 leading-relaxed">
              Gewerbeanmeldung bei der Stadt Osnabrück (Fachbetrieb für Reparatur und Verkauf von
              Elektrohaushaltsgeräten).
            </p>
            <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300 leading-relaxed">
              <strong className="font-semibold text-primary dark:text-slate-200">
                Umsatzsteuer-Hinweis:
              </strong>{" "}
              {business.taxNote || "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet und ausgewiesen (Kleinunternehmerstatus)."}
            </p>
          </div>

          {/* 4. EU-Streitschlichtung & Verbraucherstreitbeilegung nach VSBG */}
          <div className="space-y-3 rounded-2xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 text-accent">
              <Scale size={20} aria-hidden="true" />
              <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
                Streitbeilegung &amp; Verbraucherschlichtung
              </h2>
            </div>

            <div className="space-y-3 text-sm sm:text-base text-ink-muted dark:text-slate-300 leading-relaxed">
              <div>
                <p className="font-semibold text-primary dark:text-slate-200">
                  Online-Streitbeilegung gemäß Art. 14 Abs. 1 ODR-VO:
                </p>
                <p className="mt-1">
                  Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS)
                  bereit, die Sie unter folgendem Link finden:{" "}
                  <a
                    href="https://ec.europa.eu/consumers/odr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-accent dark:text-accent-light underline underline-offset-4 inline-flex items-center gap-1"
                  >
                    <span>https://ec.europa.eu/consumers/odr</span>
                    <ExternalLink size={13} aria-hidden="true" />
                  </a>
                  . Unsere E-Mail-Adresse lautet:{" "}
                  <a
                    href={`mailto:${business.email}`}
                    className="font-semibold text-accent underline"
                  >
                    {business.email}
                  </a>
                  .
                </p>
              </div>

              <div className="pt-2 border-t border-primary/8 dark:border-white/10">
                <p className="font-semibold text-primary dark:text-slate-200">
                  Verbraucherstreitbeilegung / Universalschlichtungsstelle (§ 36 VSBG):
                </p>
                <p className="mt-1">
                  Wir sind weder verpflichtet noch bereit, an Streitbeilegungsverfahren vor einer
                  Verbraucherschlichtungsstelle teilzunehmen.
                </p>
              </div>
            </div>
          </div>

          {/* 5. Unabhängiger Reparaturbetrieb & Markenzeichen */}
          <div className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
              Unabhängiger Meister- und Fachbetrieb
            </h2>
            <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300 leading-relaxed">
              Hannachi Elektrohaushaltsgeräte Service ist ein unabhängiger Meister- und Reparaturbetrieb
              in Osnabrück. Alle auf dieser Website genannten Markennamen (z. B. Miele, Bosch, Siemens,
              AEG, Bauknecht, Liebherr, Neff u. a.) sind eingetragene Warenzeichen der jeweiligen
              Hersteller und dienen ausschließlich der Beschreibung der Kompatibilität unserer
              Reparaturleistungen und Originalersatzteile.
            </p>
          </div>

          {/* 6. Haftung für Inhalte & Links */}
          <div className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
              Haftung für Inhalte und Links
            </h2>
            <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300 leading-relaxed">
              Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach
              den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als
              Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
              Informationen zu überwachen. Bei Bekanntwerden von entsprechenden Rechtsverletzungen
              werden wir diese Inhalte umgehend entfernen.
            </p>
            <p className="pt-2 text-xs text-ink-faint">
              Weitere Hinweise zur Verarbeitung personenbezogener Daten und Ihren Rechten finden Sie
              in unserer{" "}
              <Link
                href="/datenschutz"
                className="font-semibold text-accent dark:text-accent-light underline underline-offset-4"
              >
                Datenschutzerklärung
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
