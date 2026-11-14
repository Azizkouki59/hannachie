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
        intro="Informationen zur Verarbeitung personenbezogener Daten gemäß Art. 13 und 14 der Datenschutz-Grundverordnung (DSGVO) bei Nutzung unserer Website."
        readTime="Lesezeit: ca. 3 Min."
      />

      <section className="section bg-white dark:bg-slate-950 text-primary dark:text-slate-100">
        <div className="container-page max-w-3xl space-y-10 leading-relaxed">
          {/* Breadcrumb / Meta Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/10 dark:border-white/10 pb-4 text-xs sm:text-sm text-ink-muted dark:text-slate-400">
            <div className="inline-flex items-center gap-2 font-semibold text-primary dark:text-slate-200">
              <Clock3 size={16} className="text-accent shrink-0" aria-hidden="true" />
              <span>Gültig ab 2026 · DSGVO- &amp; TDDDG-konform</span>
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
                1. Name und Kontaktdaten des Verantwortlichen
              </h2>
            </div>
            <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
              Verantwortlicher im Sinne der DSGVO und des TDDDG für diese Website ist:
              <br />
              <strong className="font-semibold text-primary dark:text-slate-100">
                {business.owner}
              </strong>{" "}
              ({business.name} {business.tagline})
              <br />
              {business.street}
              <br />
              {business.zip} {business.city}, Deutschland
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
                2. Bereitstellung der Website und Server-Logfiles
              </h2>
            </div>
            <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
              Beim Aufruf unserer Website erfasst unser Webserver automatisch technische Informationen
              in sogenannten Server-Logdateien. Hierzu gehören:
            </p>
            <ul className="list-disc list-inside text-xs sm:text-sm text-ink-muted dark:text-slate-300 space-y-1 pl-2">
              <li>Browsertyp und Browserversion</li>
              <li>Verwendetes Betriebssystem Ihres Endgeräts</li>
              <li>Referrer URL (zuvor besuchte Seite)</li>
              <li>Hostname des zugreifenden Rechners / IP-Adresse</li>
              <li>Uhrzeit und Datum der Serveranfrage</li>
            </ul>
            <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
              <strong className="font-semibold text-primary dark:text-slate-200">
                Rechtsgrundlage:
              </strong>{" "}
              Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der technischen Stabilität,
              Netzsicherheit und fehlerfreien Bereitstellung unseres Onlineangebots). Die Logdateien
              werden nach kurzer Frist automatisch gelöscht bzw. anonymisiert.
            </p>
          </div>

          {/* 3. Lokale Schriftarten (Kein Google Fonts CDN Leak) */}
          <div className="space-y-3 rounded-2xl border border-sky-400/20 bg-sky-500/5 dark:bg-sky-500/10 p-5 sm:p-6">
            <div className="flex items-center gap-2 text-sky-500 dark:text-sky-400">
              <Lock size={18} aria-hidden="true" />
              <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
                3. Lokale Einbindung von Schriftarten (ohne externes CDN-Tracking)
              </h2>
            </div>
            <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
              Diese Website nutzt zur einheitlichen typografischen Darstellung die Schriftart{" "}
              <strong>„Plus Jakarta Sans“</strong>. Zur Gewährleistung des Datenschutzes und zur
              Verhinderung einer unzulässigen Datenübertragung an Dritte sind alle Schriftdateien
              vollständig lokal auf unserem eigenen Webserver gehostet.
            </p>
            <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
              Beim Aufruf unserer Seiten wird{" "}
              <strong className="text-primary dark:text-slate-100">
                keine Verbindung zu externen Servern von Google Fonts
              </strong>{" "}
              hergestellt. Ihre IP-Adresse wird zu keinem Zeitpunkt für Schriftabrufe an Dritte in
              die USA übertragen (Vermeidung von Datenschutzverletzungen gemäß LG München I, Az. 3 O
              17493/20).
            </p>
          </div>

          {/* 4. Google Maps & Zwei-Klick-Zustimmungslösung */}
          <div className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
              4. Einbindung von Google Maps (Zwei-Klick-Lösung &amp; interaktive Standortauswahl)
            </h2>
            <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
              Auf unserer Kontaktseite sowie optional in unserem Reparaturformular (bei Auswahl eines{" "}
              <em>Vor-Ort-Einsatzes</em>) binden wir den Kartendienst <strong>Google Maps</strong>{" "}
              (Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA; für den EWR:
              Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland) ein, damit Sie
              unseren Werkstattstandort ansehen oder bei Bedarf Ihren Einsatzort per Karten-Pin genau
              markieren können. Es gelten hierbei die{" "}
              <a
                href="https://maps.google.com/help/terms_maps/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-accent underline underline-offset-4"
              >
                zusätzlichen Nutzungsbedingungen für Google Maps
              </a>
              .
            </p>
            <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
              <strong className="font-semibold text-primary dark:text-slate-200">
                Zwei-Klick-Lösung &amp; bedarfsgerechtes Laden:
              </strong>{" "}
              Zum Schutz Ihrer Privatsphäre ist Google Maps standardmäßig deaktiviert. Es wird kein
              Skript und kein Iframe geladen, solange Sie nicht ausdrücklich in unserem
              Cookie-Banner, am Platzhalter auf <em>„Karte laden &amp; aktivieren“</em> oder im
              Formular aktiv auf <em>„Auf Google Maps markieren (Roter Pin)“</em> geklickt haben.
            </p>
            <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
              <strong className="font-semibold text-primary dark:text-slate-200">
                Rechtsgrundlage:
              </strong>{" "}
              Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TDDDG (Ihre ausdrückliche Einwilligung /
              aktive Anforderung). Google LLC ist unter dem{" "}
              <strong>EU-US Data Privacy Framework (DPF)</strong> zertifiziert, wodurch ein
              angemessenes Datenschutzniveau gewährleistet ist.
            </p>
            <p className="text-xs text-ink-faint">
              Sie können Ihre Einwilligung in externe Medien jederzeit mit Wirkung für die Zukunft
              über den Link <em>„Cookie-Einstellungen“</em> in unserer Fußzeile widerrufen.
            </p>
          </div>

          {/* 5. Anfrageformulare, Server-Validierung, Standort-Hilfe & WhatsApp-Weiterleitung */}
          <div className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
              5. Sichere Formulareingaben, Standortermittlung &amp; WhatsApp-Anfragefluss
            </h2>
            <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
              Wenn Sie über unser Online-Formular eine Reparaturanfrage oder eine kurze Frage
              zusammenstellen, werden Ihre Eingaben (z. B. Gerätename, Fehlerbild, Name,
              Telefonnummer, optionale Einsatzart Vor-Ort vs. Werkstatt sowie ggf. Adressangabe)
              sowohl im Browser als auch über eine verschlüsselte HTTPS-Verbindung durch unseren
              Server-Endpunkt (<code className="font-mono text-xs text-accent">/api/repair-request</code>)
              auf Plausibilität, Sicherheit und Spam-Schutz geprüft. Es findet hierbei keine
              dauerhafte Speicherung Ihrer Kontaktdaten in einer externen Marketing-Datenbank statt.
            </p>
            <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
              Erst wenn Sie aktiv auf <em>„Per WhatsApp senden“</em> klicken, wird Ihre
              vorbereitete Nachricht über HTTPS an WhatsApp übergeben. Die Verarbeitung bei
              WhatsApp erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragsvorbereitung).
            </p>
            <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
              <strong className="font-semibold text-primary dark:text-slate-200">
                Optionale GPS- &amp; Karten-Pin-Standorthilfe (OpenStreetMap Nominatim):
              </strong>{" "}
              Nur wenn Sie im Formular ausdrücklich auf <em>„Mein GPS-Standort“</em> klicken oder
              im Karten-Fenster einen Pin setzen, werden die gewählten Koordinaten zur Auflösung von
              Straße und Postleitzahl einmalig über HTTPS an Nominatim (OpenStreetMap Foundation)
              übermittelt (Art. 6 Abs. 1 lit. a DSGVO).
            </p>
          </div>

          {/* 6. Local Storage (Lokale Speicherung) */}
          <div className="space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
              6. Lokale Browser-Speicherung (Local Storage gemäß § 25 TDDDG)
            </h2>
            <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
              Unsere Website speichert keine Marketing- oder Werbe-Cookies. Wir setzen lediglich
              funktionale und nutzergesteuerte Einträge im lokalen Speicher (Local/Session Storage)
              Ihres Browsers ein, die Sie jederzeit in den Browser-Einstellungen löschen können:
            </p>
            <ul className="list-disc list-inside text-xs sm:text-sm text-ink-muted dark:text-slate-300 space-y-1.5 pl-2">
              <li>
                <code className="font-mono text-xs text-accent">hannachi-theme</code>: Speichert Ihr
                bevorzugtes Farbdesign (Hell-/Dunkelmodus), § 25 Abs. 2 TDDDG (technisch erforderlich).
              </li>
              <li>
                <code className="font-mono text-xs text-accent">hannachi-cookie-consent</code>:
                Speichert Ihre getroffene Entscheidung bezüglich externer Medien (Google Maps).
              </li>
              <li>
                <code className="font-mono text-xs text-accent">hannachi_repair_draft_v1</code>:
                Speichert Ihren laufenden Formular-Entwurf (inkl. aktuellem Schritt und optionalem
                Karten-Pin) lokal auf Ihrem Gerät, damit Eingaben bei versehentlichem Schließen nicht
                verloren gehen (Löschung automatisch nach dem Absenden oder nach 7 Tagen).
              </li>
              <li>
                <code className="font-mono text-xs text-accent">hannachi_repair_inquiries_v1</code>:
                Lokaler Verlauf Ihrer selbst vorbereiteten Reparaturanfragen auf Ihrem eigenen Gerät.
              </li>
              <li>
                <code className="font-mono text-xs text-accent">hannachi_user_google_reviews_v1</code>{" "}
                &amp; <code className="font-mono text-xs text-accent">hannachi_liked_google_reviews_v1</code>:
                Speichern lokal Ihre eigenen Rezensionsentwürfe und „Hilfreich“-Markierungen.
              </li>
            </ul>
          </div>

          {/* 7. Rechte der betroffenen Person */}
          <div className="space-y-4 rounded-2xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 text-accent">
              <Eye size={20} aria-hidden="true" />
              <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
                7. Ihre Rechte als betroffene Person (Art. 15–21 DSGVO)
              </h2>
            </div>
            <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
              Ihnen stehen gemäß der DSGVO folgende gesetzliche Rechte zu:
            </p>
            <div className="grid gap-2 text-xs sm:text-sm text-ink-muted dark:text-slate-300">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5" />
                <span>
                  <strong>Auskunftsrecht (Art. 15 DSGVO):</strong> Sie haben das Recht auf Auskunft
                  über Ihre von uns verarbeiteten Daten.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5" />
                <span>
                  <strong>Berichtigung (Art. 16 DSGVO):</strong> Sie können die Berichtigung
                  unrichtiger Daten verlangen.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5" />
                <span>
                  <strong>Löschung (Art. 17 DSGVO):</strong> Sie haben das Recht auf Löschung Ihrer
                  bei uns gespeicherten personenbezogenen Daten.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5" />
                <span>
                  <strong>Einschränkung der Verarbeitung (Art. 18 DSGVO):</strong> Sie können die
                  Einschränkung der Verarbeitung verlangen.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5" />
                <span>
                  <strong>Widerspruchsrecht (Art. 21 DSGVO):</strong> Sie können der künftigen
                  Verarbeitung Ihrer Daten jederzeit widersprechen.
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-primary/10 dark:border-white/10 text-xs sm:text-sm text-ink-muted dark:text-slate-300">
              <p>
                <strong>Zuständige Aufsichtsbehörde:</strong>
                <br />
                Die Landesbeauftragte für den Datenschutz Niedersachsen (LfD Niedersachsen)
                <br />
                Prinzenstraße 5, 30159 Hannover · Telefon: 0511 120-4500 · Web:{" "}
                <a
                  href="https://lfd.niedersachsen.de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-accent underline"
                >
                  https://lfd.niedersachsen.de
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
