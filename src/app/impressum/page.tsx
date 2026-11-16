import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  Clock3,
  FileText,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { PageHeader } from "@/components/ui";
import { business } from "@/data/site";
import { buildRouteMetadata } from "@/lib/seo";

export const metadata: Metadata = buildRouteMetadata("/impressum");

export default function Impressum() {
  return (
    <>
      <PageHeader
        title="Impressum"
        intro="Kontakt- und Unternehmensangaben zu Hannachi Elektrohaushaltsgeräte & Ersatzteile in Osnabrück."
        readTime="Lesezeit: ca. 1 Min."
      />

      <section className="section bg-white dark:bg-slate-950 text-primary dark:text-slate-100">
        <div className="container-page max-w-3xl space-y-8 leading-relaxed">
          {/* Meta / Cross-Link Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/10 dark:border-white/10 pb-4 text-xs sm:text-sm text-ink-muted dark:text-slate-400">
            <div className="inline-flex items-center gap-2 font-semibold text-primary dark:text-slate-200">
              <Clock3 size={16} className="text-accent shrink-0" aria-hidden="true" />
              <span>Unternehmens- &amp; Kontaktangaben</span>
            </div>
            <Link
              href="/datenschutz"
              className="inline-flex items-center gap-1.5 font-semibold text-accent dark:text-accent-light hover:underline"
            >
              <FileText size={14} className="shrink-0" aria-hidden="true" />
              <span>Zur Datenschutzerklärung</span>
            </Link>
          </div>

          {/* 1. Unternehmensangaben & Kontakt */}
          <div className="rounded-2xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-900 p-6 sm:p-8 space-y-5 shadow-sm">
            <div className="flex items-center gap-2 text-accent">
              <Building2 size={20} aria-hidden="true" />
              <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
                1. Unternehmen &amp; Kontakt
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 text-sm sm:text-base">
              <div className="space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-ink-faint">
                  Unternehmen &amp; Inhaber
                </p>
                <p className="font-extrabold text-base sm:text-lg text-primary dark:text-white">
                  {business.name} {business.tagline}
                </p>
                <p className="text-ink-muted dark:text-slate-300">
                  Inhaber:{" "}
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
                  Anschrift in Osnabrück
                </p>
                <address className="not-italic text-ink-muted dark:text-slate-300 flex items-start gap-2">
                  <MapPin size={16} className="text-accent shrink-0 mt-1" aria-hidden="true" />
                  <span>
                    {business.street}
                    <br />
                    {business.zip} {business.city}
                    <br />
                    Deutschland
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
                    className="font-bold text-primary dark:text-white hover:text-accent transition-colors"
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
                    E-Mail-Adresse
                  </span>
                  <a
                    href={`mailto:${business.email}`}
                    className="font-bold text-accent dark:text-accent-light underline underline-offset-4"
                  >
                    {business.email}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Leistungen & Verkäufergarantie */}
          <div className="space-y-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] dark:bg-emerald-500/[0.1] p-6 sm:p-7">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={20} aria-hidden="true" />
              <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
                2. Leistungsbereich &amp; Verkäufergarantie
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
                Vor-Ort-Service &amp; Garantie:
              </strong>{" "}
              {business.mobileServiceNotice} {business.warrantyNotice}
            </p>
          </div>

          {/* 3. Inhaltlich Verantwortlicher */}
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
              3. Verantwortlich für den Inhalt
            </h2>
            <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
              {business.owner}
              <br />
              {business.street}, {business.zip} {business.city}, Deutschland
            </p>
          </div>

          {/* 4. Unabhängiger Handel & Markenhinweis */}
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">
              4. Markenhinweis
            </h2>
            <p className="text-sm sm:text-base text-ink-muted dark:text-slate-300">
              {business.name} {business.tagline} ist ein unabhängiger Handels- und Servicebetrieb für{" "}
              <strong>{business.legalLicense}</strong>. Alle auf dieser Website genannten Marken- und
              Herstellerbezeichnungen sind Eigentum der jeweiligen Rechteinhaber und dienen
              ausschließlich der eindeutigen Beschreibung passender Ersatzteile und geprüfter
              Ersatzgeräte.
            </p>
          </div>

          {/* 5. Hinweise zu Inhalten & Urheberrecht */}
          <div className="space-y-4 border-t border-primary/10 dark:border-white/10 pt-6 text-xs sm:text-sm text-ink-muted dark:text-slate-400">
            <div>
              <h3 className="font-bold text-primary dark:text-slate-200">
                Hinweise zu Inhalten &amp; Angeboten
              </h3>
              <p className="mt-1">
                Alle Angaben auf dieser Website dienen der unverbindlichen Vorab-Information und
                direkten Terminanfrage in Osnabrück &amp; Umgebung.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-primary dark:text-slate-200">Urheberrecht</h3>
              <p className="mt-1">
                Die durch den Seitenbetreiber erstellten Inhalte, Texte und Fotografien auf diesen
                Seiten sind urheberrechtlich geschützt.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
