"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  Phone,
  MapPin,
  Clock,
  Wrench,
  Sliders,
  FileText,
  ShieldCheck,
  X,
  ExternalLink,
} from "lucide-react";
import { business, services, nav } from "@/data/site";
import { useConsent } from "@/lib/consent";

type LegalModalTab = "impressum" | "datenschutz" | null;

export default function Footer() {
  const { openConsentManager } = useConsent();
  const [legalModalTab, setLegalModalTab] = useState<LegalModalTab>(null);

  return (
    <>
      <footer className="bg-primary-dark text-white/75 border-t border-white/10">
        <div className="container-page grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-8 lg:gap-10 py-10 sm:py-12">
          {/* Brand & Legal Positioning */}
          <div className="sm:col-span-2 md:col-span-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/20 text-accent">
                <Wrench size={18} />
              </div>
              <div>
                <p className="text-[18px] font-extrabold tracking-wide text-white">HANNACHI</p>
                <p className="text-[10px] font-medium text-white/55 leading-none">
                  {business.tagline}
                </p>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-[13px] leading-relaxed">
              Ihr persönlicher Ansprechpartner für{" "}
              <strong className="text-white font-semibold">{business.legalLicense}</strong>{" "}
              in {business.city} &amp; Umgebung. Inhaber {business.owner}, seit {business.founded}.
            </p>
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-white/60">
              {business.mobileServiceNotice}
            </p>
          </div>

          {/* Nav */}
          <FooterCol title="Seiten" colSpan="md:col-span-2">
            {nav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="hover:text-accent transition-colors">
                  {n.label}
                </Link>
              </li>
            ))}
          </FooterCol>

          {/* Geräte & Ersatzteile */}
          <FooterCol title="Service & Geräte" colSpan="md:col-span-3">
            {services.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/leistungen/${s.slug}`}
                  className="hover:text-accent transition-colors"
                >
                  {s.title}
                </Link>
              </li>
            ))}
          </FooterCol>

          {/* Contact */}
          <div className="sm:col-span-2 md:col-span-3">
            <h2 className="text-sm font-semibold text-white">Kontakt &amp; Einsatzgebiet</h2>
            <address className="mt-4 space-y-3 text-[13px] sm:text-[14px] not-italic leading-relaxed">
              <div className="flex items-start gap-2">
                <MapPin size={15} className="mt-0.5 shrink-0 text-accent" />
                <div>
                  <span className="block text-white font-semibold">
                    Osnabrück &amp; Umgebung (Vor-Ort-Service)
                  </span>
                  <span className="block text-xs text-white/65">
                    {business.street}, {business.zip} {business.city}
                  </span>
                </div>
              </div>
              <p className="flex items-center gap-2">
                <Phone size={15} className="shrink-0 text-accent" />
                <a href={business.phoneHref} className="hover:text-accent transition-colors font-semibold text-white">
                  {business.phoneDisplay}
                </a>
              </p>
              <p className="flex items-start gap-2 text-white/60 text-xs">
                <Clock size={14} className="shrink-0 text-accent/70 mt-0.5" />
                <span>{business.hours}</span>
              </p>
            </address>
          </div>
        </div>

        {/* Bottom bar with clean Impressum, Datenschutzerklärung & Admin links */}
        <div className="border-t border-white/10">
          <div className="container-page flex flex-col gap-3 py-6 text-[13px] text-white/60 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} {business.name} {business.tagline} · {business.city}
            </p>
            <ul className="flex flex-wrap items-center gap-4 sm:gap-6">
              <li>
                <button
                  type="button"
                  onClick={openConsentManager}
                  className="inline-flex min-h-[44px] sm:min-h-[36px] items-center gap-1.5 hover:text-white transition-colors text-left cursor-pointer"
                  aria-label="Cookie- und Datenschutzeinstellungen anpassen oder widerrufen"
                >
                  <Sliders size={13} className="text-accent-light" aria-hidden="true" />
                  <span>Cookie-Einstellungen</span>
                </button>
              </li>
              <li>
                <Link
                  href="/impressum"
                  className="inline-flex min-h-[44px] sm:min-h-[36px] items-center font-semibold text-white/90 hover:text-accent transition-colors"
                >
                  Impressum
                </Link>
              </li>
              <li>
                <Link
                  href="/datenschutz"
                  className="inline-flex min-h-[44px] sm:min-h-[36px] items-center font-semibold text-white/90 hover:text-accent transition-colors"
                >
                  Datenschutzerklärung
                </Link>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="inline-flex min-h-[44px] sm:min-h-[36px] items-center text-white/50 hover:text-accent transition-colors"
                >
                  Auftragsbuch
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>

      {/* Quick Legal Preview Modal (Impressum & Datenschutzerklärung) */}
      {legalModalTab && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="footer-legal-modal-title"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
        >
          <div className="relative w-full max-w-2xl max-h-[88vh] flex flex-col rounded-3xl border border-primary/15 dark:border-white/15 bg-white dark:bg-slate-900 text-primary dark:text-slate-100 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-3 border-b border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-950 px-5 sm:px-6 py-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLegalModalTab("impressum")}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all cursor-pointer ${
                    legalModalTab === "impressum"
                      ? "bg-primary dark:bg-accent text-white"
                      : "text-ink-muted hover:text-primary dark:hover:text-white"
                  }`}
                >
                  <FileText size={14} />
                  <span>Impressum</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLegalModalTab("datenschutz")}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all cursor-pointer ${
                    legalModalTab === "datenschutz"
                      ? "bg-primary dark:bg-accent text-white"
                      : "text-ink-muted hover:text-primary dark:hover:text-white"
                  }`}
                >
                  <ShieldCheck size={14} />
                  <span>Datenschutzerklärung</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setLegalModalTab(null)}
                aria-label="Rechtliche Vorschau schließen"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/10 dark:border-white/10 text-ink-muted hover:text-primary dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="overflow-y-auto p-5 sm:p-6 space-y-4 text-xs sm:text-sm leading-relaxed">
              {legalModalTab === "impressum" ? (
                <>
                  <div>
                    <h3
                      id="footer-legal-modal-title"
                      className="text-lg font-extrabold text-primary dark:text-white"
                    >
                      Impressum – {business.name} {business.tagline}
                    </h3>
                    <p className="mt-1 text-ink-muted">
                      Kontakt- und Unternehmensangaben
                    </p>
                  </div>

                  <div className="rounded-2xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-800/70 p-4 space-y-2">
                    <p>
                      <strong>Unternehmen:</strong> {business.name} {business.tagline}
                      <br />
                      <strong>Inhaber:</strong> {business.owner}
                      <br />
                      <strong>Anschrift:</strong> {business.street}, {business.zip} {business.city}, Deutschland
                      <br />
                      <strong>Telefon:</strong> {business.phoneDisplay}
                      <br />
                      <strong>E-Mail:</strong> {business.email}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-1.5">
                    <p className="font-extrabold text-primary dark:text-white">
                      Leistungen &amp; Garantie-Service:
                    </p>
                    <p className="text-ink-muted dark:text-slate-200">
                      <strong>{business.legalLicense}</strong>. {business.mobileServiceNotice} {business.warrantyNotice}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h3
                      id="footer-legal-modal-title"
                      className="text-lg font-extrabold text-primary dark:text-white"
                    >
                      Datenschutzerklärung (Kurzübersicht)
                    </h3>
                    <p className="mt-1 text-ink-muted">
                      Verantwortlicher: {business.owner}, {business.street}, {business.zip}{" "}
                      {business.city} · E-Mail: {business.email}
                    </p>
                  </div>

                  <ul className="space-y-2.5 text-ink-muted">
                    <li>
                      <strong className="text-primary dark:text-white">
                        1. Kein Online-Tracking &amp; lokale Schriftarten:
                      </strong>{" "}
                      Unsere Website lädt Schriftarten ausschließlich lokal vom eigenen Server und verwendet keine Werbe-Cookies.
                    </li>
                    <li>
                      <strong className="text-primary dark:text-white">
                        2. Vor-Ort-Termin-, Ersatzteil- &amp; Ersatzgerät-Anfrage:
                      </strong>{" "}
                      Ihre Angaben im Anfrageformular dienen ausschließlich zur Vorbereitung Ihrer WhatsApp-Anfrage und der Vor-Ort-Terminabstimmung durch Herrn Hannachi.
                    </li>
                    <li>
                      <strong className="text-primary dark:text-white">
                        3. Zwei-Klick-Schutz für Google Maps:
                      </strong>{" "}
                      Externe Karten werden erst nach Ihrer ausdrücklichen Einwilligung geladen.
                    </li>
                  </ul>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-950 px-5 sm:px-6 py-3.5">
              <Link
                href={legalModalTab === "impressum" ? "/impressum" : "/datenschutz"}
                onClick={() => setLegalModalTab(null)}
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-accent hover:underline"
              >
                <span>
                  Vollständige Seite öffnen (
                  {legalModalTab === "impressum" ? "/impressum" : "/datenschutz"})
                </span>
                <ExternalLink size={13} />
              </Link>
              <button
                type="button"
                onClick={() => setLegalModalTab(null)}
                className="rounded-xl bg-primary dark:bg-accent px-4 py-2 text-xs font-extrabold text-white cursor-pointer"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FooterCol({
  title,
  colSpan = "md:col-span-2",
  children,
}: {
  title: string;
  colSpan?: string;
  children: React.ReactNode;
}) {
  const [openOnMobile, setOpenOnMobile] = useState(false);

  return (
    <div className={`${colSpan} border-b border-white/10 pb-3 sm:border-b-0 sm:pb-0`}>
      <button
        type="button"
        onClick={() => setOpenOnMobile((prev) => !prev)}
        aria-expanded={openOnMobile}
        className="flex min-h-[44px] sm:min-h-0 w-full items-center justify-between text-left text-sm font-semibold text-white sm:pointer-events-none cursor-pointer sm:cursor-default"
      >
        <span>{title}</span>
        <span className="text-xs font-bold text-accent-light sm:hidden">
          {openOnMobile ? "−" : "+"}
        </span>
      </button>
      <ul
        className={`${
          openOnMobile ? "mt-2 block" : "hidden"
        } sm:mt-4 sm:block space-y-2.5 text-[13px] pb-2 sm:pb-0`}
      >
        {children}
      </ul>
    </div>
  );
}
