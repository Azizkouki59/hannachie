import type { Metadata } from "next";
import Link from "next/link";
import { Clock3, FileText, ShieldCheck, Database, Lock, Eye, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { business } from "@/data/site";
import { buildRouteMetadata } from "@/lib/seo";

export const metadata: Metadata = buildRouteMetadata("/datenschutz");

export default function Datenschutz() {
  return (
    <>
      <PageHeader
        title="Datenschutzerklärung"
        intro="Informationen zum Umgang mit Ihren Daten bei der Nutzung unserer Website und unseres Anfrageformulars."
        readTime="Lesezeit: ca. 2 Min."
      />

      <section className="section bg-white dark:bg-slate-950 text-primary dark:text-slate-100">
        <div className="container-page max-w-3xl space-y-10 leading-relaxed">
          {/* Breadcrumb / Meta Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/10 dark:border-white/10 pb-4 text-xs sm:text-sm text-ink-muted dark:text-slate-400">
            <div className="inline-flex items-center gap-2 font-semibold text-primary dark:text-slate-200">
              <Clock3 size={16} className="text-accent shrink-0" aria-hidden="true" />
              <span>Datenschutz &amp; Privatsphäre</span>
            </div>
            <Link
              href="/impressum"
              className="inline-flex items-center gap-1.5 font-semibold text-accent dark:text-accent-light hover:underline"
            >
              <FileText size={14} className="shrink-0" aria-hidden="true" />
              <span>Zum Impressum</span>
            </Link>
          </div>

          {/* 1. Verantwortliche Stelle */}
          <div className="rounded-2xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-900 p-6 sm:p-8 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 text-accent">
              <ShieldCheck size={20} aria-hidden="true" />
              <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
                1. Verantwortlicher Ansprechpartner
              </h2>
            </div>
            <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
              Verantwortlich für diese Website ist:
              <br />
              <strong className="font-semibold text-primary dark:text-slate-100">
                {business.owner}
              </strong>{" "}
              ({business.name} {business.tagline})
              <br />
              {business.street}, {business.zip} {business.city}, Deutschland
              <br />
              Telefon:{" "}
              <a
                href={business.phoneHref}
                className="font-semibold text-accent dark:text-accent-light underline underline-offset-4"
              >
                {business.phoneDisplay}
              </a>
              <br />
              E-Mail:{" "}
              <a
                href={`mailto:${business.email}`}
                className="font-semibold text-accent dark:text-accent-light underline underline-offset-4"
              >
                {business.email}
              </a>
            </p>
          </div>

          {/* 2. Hosting und Server-Logfiles */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-accent">
              <Database size={18} aria-hidden="true" />
              <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
                2. Bereitstellung der Website
              </h2>
            </div>
            <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
              Beim Aufruf unserer Website erfasst unser Webserver automatisch technisch notwendige
              Verbindungsinformationen (Browsertyp, Betriebssystem, Datum und Uhrzeit des Abrufs),
              um die Website stabil und sicher auszuliefern. Diese technischen Protokolldaten werden
              nach kurzer Zeit automatisch gelöscht.
            </p>
          </div>

          {/* 3. Lokale Schriftarten */}
          <div className="space-y-3 rounded-2xl border border-sky-400/20 bg-sky-500/5 dark:bg-sky-500/10 p-5 sm:p-6">
            <div className="flex items-center gap-2 text-sky-500 dark:text-sky-400">
              <Lock size={18} aria-hidden="true" />
              <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
                3. Lokale Schriftarten (ohne externes Tracking)
              </h2>
            </div>
            <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
              Alle auf dieser Website verwendeten Schriftarten sind lokal auf unserem eigenen
              Server hinterlegt. Beim Aufruf unserer Seiten wird keine Verbindung zu externen
              Schrift-Servern hergestellt.
            </p>
          </div>

          {/* 4. Google Maps & Zwei-Klick-Zustimmungslösung */}
          <div className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
              4. Interaktive Karte (Zwei-Klick-Schutz)
            </h2>
            <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
              Auf unserer Kontaktseite sowie optional im Anfrageformular bieten wir eine interaktive
              Kartenansicht von Google Maps an. Zum Schutz Ihrer Privatsphäre ist die Karte
              standardmäßig deaktiviert und wird erst geladen, wenn Sie diese aktiv freischalten.
            </p>
            <p className="text-xs text-ink-faint">
              Sie können Ihre Auswahl jederzeit über den Punkt <em>„Cookie-Einstellungen“</em> in
              der Fußzeile anpassen.
            </p>
          </div>

          {/* 5. Anfrageformulare & WhatsApp-Weiterleitung */}
          <div className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
              5. Anfrageformular &amp; WhatsApp-Kontakt
            </h2>
            <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
              Wenn Sie über unser Formular eine Vor-Ort-Termin-, Ersatzteil-, Ersatzgeräte- oder
              Garantie-Anfrage stellen, dienen Ihre Angaben (Gerätetyp, Marke, Beschreibung,
              Postleitzahl/Ort, optional Straße sowie Telefonnummer) ausschließlich der
              Vorbereitung Ihrer Anfrage und der direkten Rückmeldung durch Herrn Hannachi.
            </p>
          </div>

          {/* 6. Lokale Browser-Speicherung */}
          <div className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
              6. Lokale Einstellungen im Browser
            </h2>
            <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
              Unsere Website verwendet keine Werbe- oder Marketing-Cookies. Lediglich technisch
              hilfreiche Einstellungen wie Ihr gewähltes Farbdesign (Hell-/Dunkelmodus), Ihre
              Karten-Freigabe sowie ein angefangener Formular-Entwurf werden lokal in Ihrem Browser
              gespeichert, damit Ihre Eingaben nicht verloren gehen.
            </p>
          </div>

          {/* 7. Ihre Rechte */}
          <div className="space-y-4 rounded-2xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 text-accent">
              <Eye size={20} aria-hidden="true" />
              <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
                7. Ihre Datenschutzrechte
              </h2>
            </div>
            <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
              Sie haben jederzeit das Recht auf:
            </p>
            <div className="grid gap-2 text-xs sm:text-sm text-ink-muted dark:text-slate-300">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5" />
                <span>
                  <strong>Auskunft:</strong> Informationen über Ihre bei uns gespeicherten
                  Kontaktdaten und Anfragen.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5" />
                <span>
                  <strong>Berichtigung &amp; Löschung:</strong> Korrektur oder Löschung Ihrer
                  gespeicherten Anfragedaten.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5" />
                <span>
                  <strong>Widerruf:</strong> Jederzeitige Anpassung Ihrer Privatsphäre-Auswahl über
                  die Fußzeile unserer Website.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
