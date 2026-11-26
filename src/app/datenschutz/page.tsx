import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  Database,
  ExternalLink,
  Eye,
  FileText,
  Lock,
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
  { href: "#schriftarten", label: "Lokale Schriften" },
  { href: "#google", label: "Google-Dienste" },
  { href: "#whatsapp", label: "WhatsApp & Formulare" },
  { href: "#speicherdauer", label: "Speicherdauer" },
  { href: "#rechte", label: "Ihre Rechte & LfD" },
];

export default function Datenschutz() {
  const { dataProtectionAuthority } = business.legal;

  return (
    <>
      <PageHeader
        title="Datenschutzerklärung"
        intro="Informationen gemäß Art. 13 & 14 DSGVO sowie § 25 TDDDG zur Verarbeitung personenbezogener Daten auf hannachi.de, bei Formularen, WhatsApp und Google-Diensten."
        readTime="Stand: 2026 · DSGVO & TDDDG"
      />

      <section className="section bg-white dark:bg-slate-950 text-primary dark:text-slate-100">
        <div className="container-page">
          <div className="mx-auto max-w-3xl space-y-9 leading-relaxed">
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
              className="scroll-mt-24 card rounded-2xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-900 p-6 sm:p-8 space-y-3"
            >
              <div className="flex items-center gap-2 text-accent">
                <ShieldCheck size={20} aria-hidden="true" />
                <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
                  1. Verantwortlicher (Art. 4 Nr. 7 DSGVO)
                </h2>
              </div>
              <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
                Verantwortlich für die Datenverarbeitung auf dieser Website ist:
                <br />
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
              <p className="text-xs text-ink-muted dark:text-slate-400">
                Ein betrieblicher Datenschutzbeauftragter ist mangels gesetzlicher Verpflichtung
                (§ 38 BDSG) nicht zu bestellen. Wenden Sie sich bei allen Datenschutzfragen direkt
                an den Inhaber.
              </p>
            </section>

            {/* 2. Hosting, Cloudflare CDN/Edge, TLS-Verschlüsselung & Server-Logfiles */}
            <section id="hosting" className="scroll-mt-24 space-y-3">
              <div className="flex items-center gap-2 text-accent">
                <Database size={18} aria-hidden="true" />
                <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
                  2. Hosting (Cloudflare), SSL-/TLS-Verschlüsselung &amp; Server-Logfiles
                </h2>
              </div>
              <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
                Für die schnelle, sichere und zuverlässige Auslieferung unserer Website
                (Edge-Hosting, Content Delivery Network / CDN, DDoS-Schutz sowie
                SSL-/TLS-Verschlüsselung) nutzen wir Dienste der{" "}
                <strong>Cloudflare, Inc.</strong>, 101 Townsend St., San Francisco, CA 94107, USA
                bzw. der europäischen Niederlassung <strong>Cloudflare Germany GmbH</strong>,
                Rosental 7, c/o Mindspace, 80331 München. Die Verarbeitung erfolgt auf Grundlage
                eines Auftragsverarbeitungsvertrags gemäß <strong>Art. 28 DSGVO</strong> (DPA).
                Cloudflare ist unter dem <strong>EU-US Data Privacy Framework (DPF)</strong>{" "}
                zertifiziert und stützt etwaige Drittlandübermittlungen zusätzlich auf
                EU-Standardvertragsklauseln (SCC).
              </p>
              <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
                Beim Aufruf unserer Website erfassen Webserver und Edge-Infrastruktur automatisch
                technisch notwendige Verbindungsdaten (IP-Adresse, Datum und Uhrzeit des Abrufs,
                aufgerufene Seite, Browsertyp/-version, Betriebssystem sowie Referrer-URL), um die
                Website stabil, sicher und vor Missbrauch geschützt bereitzustellen (Rechtsgrundlage:{" "}
                <strong>Art. 6 Abs. 1 lit. f DSGVO</strong> – berechtigtes Interesse an
                Betriebssicherheit, Angriffsabwehr und Fehleranalyse). Server- und Sicherheits-Logfiles
                werden automatisch nach <strong>7 bis 30 Tagen</strong> gelöscht, sofern keine
                sicherheitsrelevante Aufbewahrung zur Aufklärung eines Missbrauchs erforderlich ist.
                Die Übertragung sämtlicher Inhalte und Formulareingaben erfolgt durchgehend
                verschlüsselt per HTTPS/TLS.
              </p>
            </section>

            {/* 3. Lokale Schriftarten */}
            <section
              id="schriftarten"
              className="scroll-mt-24 card space-y-3 rounded-2xl border border-sky-400/20 bg-sky-500/5 dark:bg-sky-500/10 p-5 sm:p-6"
            >
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                <Lock size={18} aria-hidden="true" />
                <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
                  3. 100 % lokal gehostete Schriftarten (kein externes Font-Tracking)
                </h2>
              </div>
              <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
                Alle auf dieser Website verwendeten Schriftarten (<em>Plus Jakarta Sans</em>) sind
                ausschließlich lokal auf unserem eigenen Server hinterlegt. Beim Aufruf unserer
                Seiten wird keine Verbindung zu Servern von Google Fonts oder anderen externen
                Schriftarten-CDNs hergestellt und Ihre IP-Adresse nicht zu Schriftzwecken an Dritte
                übermittelt.
              </p>
            </section>

            {/* 4. Google-Dienste (Google Maps 2-Klick, Places-Proxy, Kalender, Facebook) */}
            <section id="google" className="scroll-mt-24 space-y-4">
              <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
                4. Google-Dienste (Maps, Bewertungen, Kalender) &amp; externe Links (Facebook)
              </h2>

              <div className="space-y-3 text-sm sm:text-base text-ink-muted dark:text-slate-300">
                <p>
                  <strong className="font-semibold text-primary dark:text-slate-100">
                    a) Google Maps (Zwei-Klick-Einwilligung):
                  </strong>{" "}
                  Auf unserer Kontaktseite sowie optional in der Standortauswahl bieten wir eine
                  interaktive Karte von <strong>Google Ireland Limited</strong>, Gordon House,
                  Barrow Street, Dublin 4, Irland (Muttergesellschaft: Google LLC, USA) an. Die
                  Karte ist standardmäßig vollständig blockiert und wird erst geladen, wenn Sie
                  ausdrücklich einwilligen (<strong>Art. 6 Abs. 1 lit. a DSGVO</strong> i. V. m.{" "}
                  <strong>§ 25 Abs. 1 TDDDG</strong>). Erst nach Ihrer Freigabe wird Ihre IP-Adresse
                  an Google übertragen; eine Übermittlung in die USA erfolgt auf Grundlage des
                  EU-US Data Privacy Framework (DPF). Sie können Ihre Einwilligung jederzeit über{" "}
                  <em>„Cookie-Einstellungen“</em> in der Fußzeile mit Wirkung für die Zukunft
                  widerrufen.
                </p>

                <p>
                  <strong className="font-semibold text-primary dark:text-slate-100">
                    b) Standort- &amp; Bewertungsanzeige (serverseitiger Abruf):
                  </strong>{" "}
                  Öffentliche Unternehmensdaten und Google-Bewertungen unseres Profils werden über
                  eine serverseitige Schnittstelle zwischengespeichert bereitgestellt, sodass beim
                  bloßen Lesen der Seite keine Tracking-Cookies gesetzt werden. Wenn Sie auf einen
                  Link <em>„Auf Google ansehen“</em> oder <em>„Auf Google bewerten“</em> klicken,
                  verlassen Sie unsere Website und wechseln direkt zu Google Maps.
                </p>

                <p>
                  <strong className="font-semibold text-primary dark:text-slate-100">
                    c) Optionaler Google Kalender:
                  </strong>{" "}
                  Die Nutzung der optionalen Google-Kalender-Funktion auf der Kontaktseite erfolgt
                  ausschließlich auf Ihren ausdrücklichen Wunsch nach eigenem Google-Login
                  (<strong>Art. 6 Abs. 1 lit. a und b DSGVO</strong>). Dabei werden die von Ihnen
                  eingegebenen Termindaten direkt in Ihren Google Kalender eingetragen.
                </p>

                <p>
                  <strong className="font-semibold text-primary dark:text-slate-100">
                    d) Facebook (reiner externer Link, kein Pixel):
                  </strong>{" "}
                  Auf dieser Website sind keine Facebook-Tracking-Pixel und keine automatisch
                  ladenden Social-Media-Plugins eingebunden. Der Verweis auf unsere Facebook-Seite (
                  <em>Meta Platforms Ireland Limited, 4 Grand Canal Square, Dublin 2, Irland</em>)
                  erfolgt ausschließlich als normaler externer Link; erst beim aktiven Anklicken
                  gelten die Datenschutzbestimmungen von Meta.
                </p>
              </div>
            </section>

            {/* 5. Anfrageformular, Telefon, E-Mail & WhatsApp-Kontakt */}
            <section
              id="whatsapp"
              className="scroll-mt-24 card space-y-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.08] p-6 sm:p-7"
            >
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <MessageCircle size={20} aria-hidden="true" />
                <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
                  5. Anfrageformular, Standort-Erkennung, Telefon, E-Mail &amp; WhatsApp-Direktkontakt
                </h2>
              </div>

              <div className="space-y-3 text-sm sm:text-base text-ink-muted dark:text-slate-300">
                <p>
                  <strong className="font-semibold text-primary dark:text-slate-100">
                    Anfrageformular, E-Mail &amp; Telefon:
                  </strong>{" "}
                  Wenn Sie uns über das Online-Anfrageformular, per E-Mail oder telefonisch
                  kontaktieren, verarbeiten und speichern wir Ihre mitgeteilten Angaben (z. B.
                  Gerätetyp, Marke, E-Nr./Typenschild, Postleitzahl/Ort, Name, Telefonnummer sowie
                  Ihr Anliegen) ausschließlich zur Bearbeitung Ihrer Beratungs-, Ersatzteil-,
                  Geräte- oder Garantieanfrage sowie zur Terminabstimmung auf unserem geschützten
                  Anwendungsserver. Eine Weitergabe an unbeteiligte Dritte findet nicht statt.
                  Rechtsgrundlage ist <strong>Art. 6 Abs. 1 lit. b DSGVO</strong> (vorvertragliche
                  Maßnahmen / Vertragserfüllung) bzw. <strong>Art. 6 Abs. 1 lit. f DSGVO</strong>{" "}
                  (effiziente Beantwortung von Kundenanfragen).
                </p>

                <p>
                  <strong className="font-semibold text-primary dark:text-slate-100">
                    Optionale GPS- / Standort-Erkennung im Anfrageformular (OpenStreetMap Nominatim):
                  </strong>{" "}
                  Im Anfrageformular steht optional eine Schaltfläche zur Standort-Erkennung zur
                  Verfügung. Die Standortabfrage Ihres Browsers wird niemals automatisch beim
                  Seitenaufruf ausgelöst, sondern ausschließlich nach Ihrem ausdrücklichen Klick
                  und Ihrer Browser-Freigabe (<strong>Art. 6 Abs. 1 lit. a DSGVO</strong>). Zur
                  Umwandlung der Koordinaten in Postleitzahl und Ort (Reverse-Geocoding) werden die
                  Koordinaten einmalig an den Dienst <strong>OpenStreetMap Nominatim</strong>{" "}
                  (OpenStreetMap Foundation, St John&apos;s Innovation Centre, Cowley Road,
                  Cambridge, CB4 0WS, Vereinigtes Königreich) übermittelt. Die ermittelten
                  Koordinaten dienen ausschließlich dem komfortablen Vorausfüllen von PLZ und Ort
                  im Formular und werden ohne aktives Absenden Ihrer Anfrage nicht gespeichert.
                </p>

                <p>
                  <strong className="font-semibold text-primary dark:text-slate-100">
                    Freiwilliger Kontakt über WhatsApp (WhatsApp Ireland Limited / Meta):
                  </strong>{" "}
                  Für eine besonders schnelle Abstimmung (z. B. zum Senden eines Typenschild-Fotos)
                  bieten wir eine freiwillige Weiterleitung zu WhatsApp an. Anbieter im Europäischen
                  Wirtschaftsraum ist die <strong>WhatsApp Ireland Limited</strong>, 4 Grand Canal
                  Square, Grand Canal Harbour, Dublin 2, Irland (ein Unternehmen der Meta Platforms,
                  Inc., USA). Eine Verbindung zu WhatsApp entsteht erst, wenn Sie aktiv einen
                  WhatsApp-Button anklicken. Dabei erhält WhatsApp technische Kommunikations- und
                  Metadaten (z. B. Ihre Rufnummer, Zeitstempel, Endgeräteinformationen); eine
                  Datenübermittlung in die USA durch Meta kann auf Basis des EU-US Data Privacy
                  Framework (DPF) und von Standardvertragsklauseln erfolgen. Rechtsgrundlage für die
                  Kommunikation über WhatsApp ist Ihre freiwillige Einwilligung durch aktives
                  Starten des Chats (<strong>Art. 6 Abs. 1 lit. a DSGVO</strong>) sowie die
                  Durchführung vorvertraglicher Maßnahmen (<strong>Art. 6 Abs. 1 lit. b DSGVO</strong>).
                </p>

                <p className="text-xs sm:text-sm text-ink-muted dark:text-slate-400">
                  <strong>Datenschutzfreundliche Alternative:</strong> Wenn Sie WhatsApp nicht
                  nutzen möchten, erreichen Sie Herrn Hannachi jederzeit ohne Drittanbieter-Messenger
                  telefonisch unter{" "}
                  <a
                    href={business.phoneHref}
                    className="font-semibold text-accent underline underline-offset-2 tabular-nums"
                  >
                    {business.phoneDisplay}
                  </a>{" "}
                  oder per E-Mail an{" "}
                  <a
                    href={`mailto:${business.email}`}
                    className="font-semibold text-accent underline underline-offset-2"
                  >
                    {business.email}
                  </a>
                  . Weitere Informationen finden Sie in der{" "}
                  <a
                    href="https://www.whatsapp.com/legal/privacy-policy-eea"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 font-semibold text-accent underline underline-offset-2"
                  >
                    <span>WhatsApp-Datenschutzrichtlinie (EWR)</span>
                    <ExternalLink size={11} aria-hidden="true" />
                  </a>
                  .
                </p>
              </div>
            </section>

            {/* 6. Lokale Browser-Speicherung (§ 25 Abs. 2 TDDDG) & Cookies */}
            <section id="speicherdauer" className="scroll-mt-24 space-y-4">
              <div className="space-y-2.5">
                <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
                  6. Cookies, lokale Browser-Speicherung (§ 25 TDDDG) &amp; Speicherdauer
                </h2>
                <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
                  <strong className="font-semibold text-primary dark:text-slate-100">
                    Keine Werbe- oder Tracking-Cookies:
                  </strong>{" "}
                  Unsere Website verzichtet vollständig auf Marketing-, Werbe- und
                  Reichweiten-Tracking-Cookies. Im lokalen Speicher Ihres Browsers (
                  <code>localStorage</code>) werden ausschließlich technisch erforderliche
                  Komforteinstellungen gesichert: Ihr gewähltes Farbdesign (Hell-/Dunkelmodus),
                  Ihre Einwilligungsentscheidung für Google Maps sowie optional ein begonnener
                  Formular-Entwurf, damit Eingaben nicht verloren gehen (Rechtsgrundlage:{" "}
                  <strong>§ 25 Abs. 2 Nr. 2 TDDDG</strong>). Für den internen Verwaltungsbereich
                  wird ein technisch notwendiges, verschlüsseltes Sitzungs-Cookie (
                  <code>HttpOnly</code>) eingesetzt.
                </p>
                <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
                  <strong className="font-semibold text-primary dark:text-slate-100">
                    Speicherdauer &amp; Löschung:
                  </strong>{" "}
                  Wir speichern personenbezogene Daten nur so lange, wie es für die Bearbeitung
                  Ihrer Anfrage, die Abwicklung eines Kaufs oder Garantiefalls oder zur Erfüllung
                  gesetzlicher Aufbewahrungspflichten erforderlich ist. Handels- und steuerrechtliche
                  Belege (z. B. Rechnungen und Kaufbelege) unterliegen gesetzlichen
                  Aufbewahrungsfristen von in der Regel 6 bis 10 Jahren gemäß{" "}
                  <strong>§ 257 HGB</strong> und <strong>§ 147 AO</strong>. Allgemeine
                  unverbindliche Anfragen ohne Vertragsschluss werden gelöscht, sobald der Zweck
                  entfallen ist.
                </p>
              </div>
            </section>

            {/* 7. Ihre Rechte & Zuständige Aufsichtsbehörde (Niedersachsen) */}
            <section
              id="rechte"
              className="scroll-mt-24 card space-y-4 rounded-2xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-900 p-6 sm:p-8"
            >
              <div className="flex items-center gap-2 text-accent">
                <Eye size={20} aria-hidden="true" />
                <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
                  7. Ihre Rechte nach DSGVO (Art. 15–21 &amp; Art. 77 DSGVO)
                </h2>
              </div>
              <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
                Sie haben hinsichtlich der Sie betreffenden personenbezogenen Daten jederzeit
                folgende gesetzliche Rechte:
              </p>
              <div className="grid gap-2.5 text-xs sm:text-sm text-ink-muted dark:text-slate-300">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    <strong>Auskunft (Art. 15 DSGVO):</strong> Bestätigung und Auskunft über die
                    von uns verarbeiteten personenbezogenen Daten.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    <strong>Berichtigung, Löschung &amp; Einschränkung (Art. 16–18 DSGVO):</strong>{" "}
                    Unverzügliche Korrektur unrichtiger Daten sowie Löschung oder Einschränkung der
                    Verarbeitung, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    <strong>Datenübertragbarkeit (Art. 20 DSGVO):</strong> Herausgabe der von Ihnen
                    bereitgestellten Daten in einem strukturierten, gängigen und maschinenlesbaren
                    Format.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    <strong>Widerspruchsrecht (Art. 21 DSGVO):</strong> Widerspruch gegen
                    Verarbeitungen, die auf Art. 6 Abs. 1 lit. f DSGVO beruhen, aus Gründen Ihrer
                    besonderen Situation.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    <strong>Widerruf von Einwilligungen (Art. 7 Abs. 3 DSGVO):</strong> Eine
                    erteilte Einwilligung (z. B. für Google Maps) können Sie jederzeit mit Wirkung
                    für die Zukunft über <em>„Cookie-Einstellungen“</em> in der Fußzeile oder per
                    E-Mail widerrufen.
                  </span>
                </div>
              </div>

              {/* Zuständige Aufsichtsbehörde Niedersachsen */}
              <div className="mt-4 pt-4 border-t border-primary/10 dark:border-white/10 space-y-1.5 text-xs sm:text-sm text-ink-muted dark:text-slate-300">
                <p className="font-bold text-primary dark:text-slate-100">
                  Beschwerderecht bei der zuständigen Aufsichtsbehörde (Art. 77 DSGVO):
                </p>
                <p>
                  {dataProtectionAuthority.name}
                  <br />
                  {dataProtectionAuthority.street}, {dataProtectionAuthority.zipCity}
                  <br />
                  Telefon: <span className="tabular-nums">{dataProtectionAuthority.phone}</span> ·
                  E-Mail:{" "}
                  <a
                    href={`mailto:${dataProtectionAuthority.email}`}
                    className="font-semibold text-accent underline underline-offset-2"
                  >
                    {dataProtectionAuthority.email}
                  </a>{" "}
                  · Web:{" "}
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
