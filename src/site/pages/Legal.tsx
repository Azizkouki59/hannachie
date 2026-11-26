import React from "react";
import Link from "next/link";
import { business, emailHref } from "../content";
import { Container, PageHeader } from "../ui";

function LegalSection({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-line pt-8 first:border-0 first:pt-0">
      <h2 className="text-xl font-bold text-ink sm:text-2xl">{title}</h2>
      <div className="mt-4 space-y-3 text-base leading-relaxed text-ink-soft [&_strong]:text-ink">{children}</div>
    </section>
  );
}

function LegalLayout({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <>
      <PageHeader eyebrow="Rechtliches" title={title} intro={intro} />
      <Container className="py-12 sm:py-16">
        <div className="max-w-3xl space-y-10">{children}</div>
      </Container>
    </>
  );
}

const address = (
  <>
    {business.street}
    <br />
    {business.zip} {business.city}
    <br />
    Deutschland
  </>
);

export function ImpressumPage() {
  const { legal } = business;
  const w = legal.warrantyBgb479;
  return (
    <LegalLayout title="Impressum">
      <LegalSection title="Angaben gemäß § 5 DDG">
        <p>
          <strong>Hannachi – Hausgeräte &amp; Ersatzteile</strong>
          <br />
          Inhaber: {business.owner} ({legal.legalForm})
          <br />
          {address}
        </p>
      </LegalSection>

      <LegalSection title="Kontakt">
        <p>
          Telefon: <a href={business.phoneHref} className="underline underline-offset-4">{business.phoneDisplay}</a>
          <br />
          E-Mail: <a href={emailHref} className="underline underline-offset-4">{business.email}</a>
        </p>
      </LegalSection>

      <LegalSection title="Gewerbe">
        <p>
          Handel mit Ersatzteilen für Haushaltsgeräte sowie An- und Verkauf von Haushaltsgeräten (Gewerbe nach § 14
          GewO). Kein in die Handwerksrolle eingetragener Betrieb.
        </p>
        <p>
          <strong>Zuständige Behörde:</strong> {legal.tradeAuthority}
          <br />
          <strong>Kammer:</strong> {legal.chamber}
        </p>
      </LegalSection>

      <LegalSection title="Umsatzsteuer">
        {legal.ustIdNr ? (
          <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: {legal.ustIdNr}</p>
        ) : (
          <p>Eine Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG ist nicht vorhanden.</p>
        )}
        {legal.wirtschaftsIdNr && <p>Wirtschafts-Identifikationsnummer: {legal.wirtschaftsIdNr}</p>}
      </LegalSection>

      <LegalSection title="Verantwortlich für den Inhalt (§ 18 Abs. 2 MStV)">
        <p>
          {business.owner}, {business.street}, {business.zip} {business.city}
        </p>
      </LegalSection>

      <LegalSection id="garantie" title="Gewährleistung & Verkäufergarantie">
        <p>{legal.usedGoodsBgb476Note}</p>
        <p>
          <strong>Garantiegeber:</strong> {w.guarantor}
        </p>
        <p>{w.durationAndContent}</p>
        <p>
          <strong>Räumlicher Geltungsbereich:</strong> {w.territorialScope}
        </p>
        <p>{w.claimProcedure}</p>
        <p>{w.statutoryRightsNotice}</p>
      </LegalSection>

      <LegalSection id="elektrog" title="Hinweise nach dem Elektro- und Elektronikgerätegesetz (ElektroG)">
        <p>{legal.elektroG.disposalNotice}</p>
        <p>{legal.elektroG.returnOptions}</p>
        <p>{legal.elektroG.dataDeletionNotice}</p>
      </LegalSection>

      <LegalSection title="Preise">
        <p>
          Diese Website ist ein Informationsangebot ohne Online-Shop. Preise und Verfügbarkeit werden individuell
          mitgeteilt; alle Endpreise verstehen sich inklusive der gesetzlichen Umsatzsteuer, soweit diese anfällt.
        </p>
      </LegalSection>

      <LegalSection title="Verbraucherstreitbeilegung">
        <p>
          Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen (§ 36 VSBG).
        </p>
      </LegalSection>

      <LegalSection title="Marken & Bewertungen">
        <p>
          Genannte Marken- und Herstellernamen dienen ausschließlich der Zuordnung passender Ersatzteile. Wir sind kein
          autorisierter Vertragspartner oder Werkskundendienst der Hersteller. Wiedergegebene Kundenstimmen sind Auszüge
          aus öffentlich einsehbaren Google-Bewertungen.
        </p>
      </LegalSection>

      <LegalSection title="Haftung für Links">
        <p>
          Diese Website enthält Links zu externen Websites Dritter (z. B. Google Maps, WhatsApp). Für deren Inhalte ist
          stets der jeweilige Anbieter verantwortlich. Bei Bekanntwerden von Rechtsverletzungen entfernen wir
          entsprechende Links umgehend.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}

export function DatenschutzPage() {
  const dpa = business.legal.dataProtectionAuthority;
  return (
    <LegalLayout
      title="Datenschutzerklärung"
      intro="Wir erheben auf dieser Website so wenige Daten wie möglich. Es gibt keine Werbe-Cookies, kein Tracking und keine eingebetteten Inhalte Dritter."
    >
      <LegalSection title="1. Verantwortlicher">
        <p>
          {business.owner}, Hannachi – Hausgeräte &amp; Ersatzteile
          <br />
          {address}
          <br />
          Telefon: {business.phoneDisplay} · E-Mail:{" "}
          <a href={emailHref} className="underline underline-offset-4">
            {business.email}
          </a>
        </p>
      </LegalSection>

      <LegalSection title="2. Hosting und Server-Logfiles">
        <p>
          Diese Website wird bei <strong>Cloudflare, Inc.</strong> (101 Townsend St., San Francisco, CA 94107, USA)
          gehostet. Beim Aufruf der Website werden technisch notwendige Daten verarbeitet (IP-Adresse, Datum und
          Uhrzeit, aufgerufene Seite, Browser- und Systeminformationen), um die Website sicher und stabil
          auszuliefern. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am sicheren Betrieb).
        </p>
        <p>
          Cloudflare ist unter dem EU-US Data Privacy Framework zertifiziert; mit Cloudflare besteht ein Vertrag zur
          Auftragsverarbeitung. Logdaten werden nur so lange gespeichert, wie es für Sicherheit und Fehleranalyse
          erforderlich ist.
        </p>
      </LegalSection>

      <LegalSection title="3. Schriftarten">
        <p>
          Die verwendete Schriftart wird direkt von unserem Server geladen. Es findet keine Verbindung zu Servern von
          Google Fonts oder anderen Anbietern statt.
        </p>
      </LegalSection>

      <LegalSection title="4. Cookies und lokale Speicherung">
        <p>
          Die öffentlichen Seiten dieser Website setzen keine Cookies und speichern keine Informationen auf Ihrem Gerät.
          Eine Einwilligung nach § 25 TDDDG ist daher nicht erforderlich.
        </p>
      </LegalSection>

      <LegalSection title="5. Kontakt per Telefon, E-Mail und WhatsApp">
        <p>
          Wenn Sie uns kontaktieren, verarbeiten wir Ihre Angaben (z. B. Name, Telefonnummer, Nachricht, Fotos vom
          Typenschild) ausschließlich zur Bearbeitung Ihrer Anfrage (Art. 6 Abs. 1 lit. b DSGVO). Die Daten werden
          gelöscht, sobald sie nicht mehr benötigt werden und keine gesetzlichen Aufbewahrungspflichten bestehen.
        </p>
        <p>
          Das Anfrageformular speichert keine Daten auf dieser Website. Es bereitet lediglich eine Nachricht vor, die
          Sie selbst über WhatsApp oder Ihr E-Mail-Programm absenden.
        </p>
        <p>
          <strong>WhatsApp:</strong> Wenn Sie uns über WhatsApp schreiben, werden Ihre Daten von WhatsApp Ireland Ltd.
          (Merrion Road, Dublin 4, Irland) verarbeitet; dabei kann eine Übermittlung in die USA erfolgen. Bitte nutzen
          Sie alternativ Telefon oder E-Mail, wenn Sie dies nicht wünschen.
        </p>
      </LegalSection>

      <LegalSection title="6. Externe Links">
        <p>
          Links zu Google Maps oder WhatsApp öffnen die Angebote der jeweiligen Anbieter. Erst beim Anklicken werden
          Daten an diese Anbieter übertragen; es gelten deren Datenschutzbestimmungen.
        </p>
      </LegalSection>

      <LegalSection title="7. Ihre Rechte">
        <p>
          Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung
          der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) sowie Widerspruch gegen Verarbeitungen auf
          Grundlage berechtigter Interessen (Art. 21). Wenden Sie sich dazu einfach an die oben genannten
          Kontaktdaten.
        </p>
        <p>
          Sie können sich außerdem bei einer Datenschutz-Aufsichtsbehörde beschweren (Art. 77 DSGVO), zum Beispiel bei:{" "}
          {dpa.name}, {dpa.street}, {dpa.zipCity},{" "}
          <a href={dpa.website} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
            {dpa.website.replace("https://", "")}
          </a>
          .
        </p>
      </LegalSection>

      <p className="text-sm text-ink-soft">
        Stand: November 2026 ·{" "}
        <Link href="/impressum" className="underline underline-offset-4">
          Impressum
        </Link>
      </p>
    </LegalLayout>
  );
}
