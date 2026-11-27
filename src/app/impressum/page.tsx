"use client";

import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  Clock3,
  FileText,
  Mail,
  MapPin,
  Phone,
  Recycle,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/ui";
import { business } from "@/data/site";
import { buildRouteMetadata } from "@/lib/seo";

export const metadata: Metadata = buildRouteMetadata("/impressum");

const ANCHORS = [
  { href: "#anbieter", label: "Anbieter (§ 5 DDG)" },
  { href: "#gewerbe", label: "Gewerbe & HwO" },
  { href: "#garantie", label: "Garantie & BGB" },
  { href: "#elektrog", label: "ElektroG" },
  { href: "#streitbeilegung", label: "Streitbeilegung" },
];

export default function Impressum() {
  const { legal } = business;

  return (
    <>
      <PageHeader
        title="Impressum & Rechtliche Hinweise"
        intro="Pflichtangaben gemäß § 5 DDG, gewerberechtliche Abgrenzung (§ 14 GewO / Anlage A HwO), Garantiebedingungen (§ 479 BGB) sowie Hinweise nach ElektroG und VSBG."
        readTime="Stand: 2026 · Osnabrück"
      />

      <section className="section bg-white dark:bg-slate-950 text-primary dark:text-slate-100">
        <div className="container-page">
          <div className="mx-auto max-w-3xl space-y-8 leading-relaxed">
            {/* Meta & Jump Anchor Bar */}
            <div className="space-y-3 border-b border-primary/10 dark:border-white/10 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-ink-muted dark:text-slate-400">
                <div className="inline-flex items-center gap-2 font-semibold text-primary dark:text-slate-200">
                  <Clock3 size={16} className="text-accent shrink-0" aria-hidden="true" />
                  <span>§ 5 DDG · § 14 GewO · § 479 BGB · § 17 ElektroG</span>
                </div>
                <Link
                  href="/datenschutz"
                  className="inline-flex items-center gap-1.5 font-semibold text-accent dark:text-accent-light hover:underline"
                >
                  <FileText size={14} className="shrink-0" aria-hidden="true" />
                  <span>Zur Datenschutzerklärung</span>
                </Link>
              </div>

              <nav
                aria-label="Abschnitte im Impressum"
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

            {/* 1. Unternehmensangaben & Kontakt (§ 5 DDG) */}
            <section
              id="anbieter"
              className="scroll-mt-24 card rounded-2xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-900 p-6 sm:p-8 space-y-5"
            >
              <div className="flex items-center gap-2 text-accent">
                <Building2 size={20} aria-hidden="true" />
                <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
                  1. Angaben gemäß § 5 DDG (Diensteanbieter &amp; Kontakt)
                </h2>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 text-sm sm:text-base">
                <div className="space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-faint">
                    Unternehmen &amp; Rechtsform
                  </p>
                  <p className="font-extrabold text-base sm:text-lg text-primary dark:text-white">
                    {business.name} {business.tagline}
                  </p>
                  <p className="text-ink-muted dark:text-slate-300">
                    Inhaber ({legal.legalForm}):{" "}
                    <strong className="font-semibold text-primary dark:text-slate-100">
                      {business.owner}
                    </strong>
                  </p>
                  <p className="text-xs text-ink-muted dark:text-slate-400">
                    {business.legalLicense} (seit {business.founded})
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-faint">
                    Ladungsfähige Geschäftsanschrift
                  </p>
                  <address className="not-italic text-ink-muted dark:text-slate-300 flex items-start gap-2">
                    <MapPin size={16} className="text-accent shrink-0 mt-1" aria-hidden="true" />
                    <span>
                      {business.street}
                      <br />
                      {business.zip} {business.city}
                      <br />
                      Deutschland
                      <br />
                      <span className="text-xs font-semibold text-accent">
                        Termine nach Vereinbarung (kein offener Ladenbetrieb)
                      </span>
                    </span>
                  </address>
                </div>
              </div>

              <div className="border-t border-primary/10 dark:border-white/10 pt-5 grid gap-4 sm:grid-cols-2 text-sm sm:text-base">
                <div className="flex items-start gap-2.5">
                  <Phone size={16} className="text-accent shrink-0 mt-1" aria-hidden="true" />
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-ink-faint">
                      Telefon &amp; WhatsApp
                    </span>
                    <a
                      href={business.phoneHref}
                      className="font-bold text-primary dark:text-white hover:text-accent transition-colors tabular-nums"
                    >
                      {business.phoneDisplay}
                    </a>
                    <span className="block text-xs text-ink-muted dark:text-slate-400">
                      {business.hours}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Mail size={16} className="text-accent shrink-0 mt-1" aria-hidden="true" />
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-ink-faint">
                      Elektronische Post (E-Mail)
                    </span>
                    <a
                      href={`mailto:${business.email}`}
                      className="font-bold text-accent dark:text-accent-light underline underline-offset-4"
                    >
                      {business.email}
                    </a>
                    <span className="block text-xs text-ink-muted dark:text-slate-400">
                      Direkte Kontaktaufnahme ohne kostenpflichtige Hotline
                    </span>
                  </div>
                </div>
              </div>

              {/* Gewerbeanmeldung, Kammer & Umsatzsteuer */}
              <div className="border-t border-primary/10 dark:border-white/10 pt-5 space-y-2.5 text-xs sm:text-sm text-ink-muted dark:text-slate-300">
                <p>
                  <strong className="font-semibold text-primary dark:text-slate-100">
                    Gewerbeanmeldung (§ 14 GewO):
                  </strong>{" "}
                  {legal.tradeAuthority}.
                </p>
                <p>
                  <strong className="font-semibold text-primary dark:text-slate-100">
                    Zuständige Kammer:
                  </strong>{" "}
                  {legal.chamber}.
                </p>
                {legal.ustIdNr ? (
                  <p>
                    <strong className="font-semibold text-primary dark:text-slate-100">
                      Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG:
                    </strong>{" "}
                    <span className="font-mono">{legal.ustIdNr}</span>
                  </p>
                ) : (
                  <p>
                    <strong className="font-semibold text-primary dark:text-slate-100">
                      Steuer- &amp; Rechnungshinweis:
                    </strong>{" "}
                    {legal.vatTransparencyNote}
                  </p>
                )}
                {legal.wirtschaftsIdNr && (
                  <p>
                    <strong className="font-semibold text-primary dark:text-slate-100">
                      Wirtschafts-Identifikationsnummer (W-IdNr.) gemäß § 139c AO:
                    </strong>{" "}
                    <span className="font-mono">{legal.wirtschaftsIdNr}</span>
                  </p>
                )}
              </div>
            </section>

            {/* 2. Gewerbeart & Abgrenzung zur Handwerksordnung (HwO) */}
            <section
              id="gewerbe"
              className="scroll-mt-24 card space-y-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05] dark:bg-emerald-500/[0.09] p-6 sm:p-7"
            >
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <ShieldCheck size={20} aria-hidden="true" />
                <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
                  2. Gewerbeart (§ 14 GewO) &amp; Abgrenzung zur Handwerksordnung (HwO)
                </h2>
              </div>
              <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
                <strong className="font-semibold text-primary dark:text-slate-200">
                  Tätigkeitsbereich:
                </strong>{" "}
                <strong>{business.legalLicense}</strong>.
              </p>
              <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
                <strong className="font-semibold text-primary dark:text-slate-200">
                  Klare Abgrenzung zur Anlage A HwO:
                </strong>{" "}
                {business.hwoDisclaimer}
              </p>
              <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
                <strong className="font-semibold text-primary dark:text-slate-200">
                  Kein Online-Shop / Preisangaben (PAngV):
                </strong>{" "}
                {legal.pangvNotice}
              </p>
            </section>

            {/* 3. Gesetzliche Gewährleistung (§ 476 BGB) & Schriftliche Verkäufergarantie (§ 479 BGB) */}
            <section
              id="garantie"
              className="scroll-mt-24 card space-y-4 rounded-2xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-900 p-6 sm:p-7"
            >
              <div className="flex items-center gap-2 text-accent">
                <Scale size={20} aria-hidden="true" />
                <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
                  3. Gesetzliche Mängelrechte (§ 476 BGB) &amp; Verkäufergarantie (§ 479 BGB)
                </h2>
              </div>

              <div className="space-y-3 text-sm sm:text-base text-ink-muted dark:text-slate-300">
                <p>
                  <strong className="font-semibold text-primary dark:text-slate-100">
                    Gesetzliche Gewährleistung (inkl. Gebrauchtwaren):
                  </strong>{" "}
                  {legal.usedGoodsBgb476Note}
                </p>

                <div className="rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-950 p-4 sm:p-5 space-y-2.5 text-xs sm:text-sm">
                  <p className="font-bold text-primary dark:text-white">
                    Pflichtangaben zur freiwilligen schriftlichen Verkäufergarantie (§ 479 BGB)
                  </p>
                  <p className="font-semibold text-primary dark:text-slate-100">
                    {legal.warrantyBgb479.statutoryRightsNotice}
                  </p>
                  <dl className="space-y-2 pt-1">
                    <div>
                      <dt className="font-semibold text-primary dark:text-slate-200">
                        Garantiegeber:
                      </dt>
                      <dd>{legal.warrantyBgb479.guarantor}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-primary dark:text-slate-200">
                        Räumlicher Geltungsbereich:
                      </dt>
                      <dd>{legal.warrantyBgb479.territorialScope}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-primary dark:text-slate-200">
                        Dauer &amp; Inhalt der Garantie:
                      </dt>
                      <dd>{legal.warrantyBgb479.durationAndContent}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-primary dark:text-slate-200">
                        Verfahren zur Geltendmachung:
                      </dt>
                      <dd>{legal.warrantyBgb479.claimProcedure}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </section>

            {/* 4. Hinweise nach ElektroG (§ 17 ElektroG) */}
            <section
              id="elektrog"
              className="scroll-mt-24 card space-y-3 rounded-2xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-900 p-6 sm:p-7"
            >
              <div className="flex items-center gap-2 text-accent">
                <Recycle size={20} aria-hidden="true" />
                <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
                  4. Hinweise zur Altgeräteentsorgung (§ 17 ElektroG)
                </h2>
              </div>
              <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
                {legal.elektroG.disposalNotice}
              </p>
              <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
                {legal.elektroG.returnOptions}
              </p>
              <p className="text-xs sm:text-sm text-ink-muted dark:text-slate-400">
                <strong className="font-semibold text-primary dark:text-slate-200">
                  Datenschutz bei Altgeräten:
                </strong>{" "}
                {legal.elektroG.dataDeletionNotice}
              </p>
            </section>

            {/* 5. Inhaltlich Verantwortlicher (§ 18 Abs. 2 MStV) */}
            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
                5. Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
              </h2>
              <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
                {business.owner}
                <br />
                {business.street}, {business.zip} {business.city}, Deutschland
              </p>
            </div>

            {/* 6. Unabhängiger Handel & Markenhinweis */}
            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
                6. Unabhängiger Fachhandel &amp; Markenhinweis
              </h2>
              <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
                {business.name} {business.tagline} ist ein unabhängiger Fachhandelsbetrieb (
                <strong>Handelsgewerbe gemäß § 14 GewO</strong>) für Elektrohaushaltsgeräte,
                persönliche Fachberatung, Original-Ersatzteile und ausgewählte Markengeräte auf
                Anfrage und kein autorisierter Werkskundendienst der genannten Hersteller. Alle
                aufgeführten Marken-, Produkt- und Herstellerbezeichnungen sind Eigentum der
                jeweiligen Rechteinhaber und dienen ausschließlich der eindeutigen Identifikation
                passender Original-Ersatzteile (z. B. nach Typenschild) sowie ausgewählter
                Markengeräte auf Anfrage.
              </p>
            </div>

            {/* 7. Verbraucherstreitbeilegung (§ 36 VSBG) — bewusst ohne abgeschaltete EU-OS-Plattform */}
            <section id="streitbeilegung" className="scroll-mt-24 space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
                7. Verbraucherstreitbeilegung (§ 36 VSBG)
              </h2>
              <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
                Wir sind weder bereit noch verpflichtet, an Streitbeilegungsverfahren vor einer
                Verbraucherschlichtungsstelle teilzunehmen. Bei Rückfragen oder Anliegen wenden Sie
                sich bitte direkt an Inhaber {business.owner} ({business.email} /{" "}
                {business.phoneDisplay}).
              </p>
            </section>

            {/* 8. Haftung für Inhalte, Links, Fremdbewertungen & Urheberrecht */}
            <div className="space-y-4 border-t border-primary/10 dark:border-white/10 pt-6 text-xs sm:text-sm text-ink-muted dark:text-slate-400">
              <div>
                <h3 className="font-bold text-primary dark:text-slate-200">
                  Haftung für Inhalte &amp; externe Links
                </h3>
                <p className="mt-1">
                  Als Diensteanbieter sind wir gemäß den allgemeinen Gesetzen für eigene Inhalte auf
                  diesen Seiten verantwortlich. Für Inhalte externer Websites Dritter (z. B. Google
                  Maps, WhatsApp oder Facebook), auf die direkt oder indirekt
                  verwiesen wird, übernehmen wir keine Gewähr; verantwortlich ist stets der
                  jeweilige Anbieter.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-primary dark:text-slate-200">
                  Hinweis zu Google-Maps-Kundenbewertungen
                </h3>
                <p className="mt-1">
                  Auf dieser Website dargestellte Kundenrezensionen sind Auszüge öffentlich
                  einsehbarer Bewertungen Dritter auf Google Maps und geben ausschließlich die
                  persönlichen Eindrücke der jeweiligen Verfasser wieder. Sie stellen kein Angebot
                  handwerklicher Reparaturleistungen dar.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-primary dark:text-slate-200">Urheberrecht</h3>
                <p className="mt-1">
                  Die durch den Seitenbetreiber erstellten Inhalte, Texte und Fotografien auf diesen
                  Seiten unterliegen dem deutschen Urheberrecht. Eine Vervielfältigung oder
                  Verwendung bedarf der vorherigen schriftlichen Zustimmung des Inhabers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
