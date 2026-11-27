"use client";
import { WordmarkReveal } from "@/components/animations";
import React, { useState } from "react";
import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Sliders,
  ExternalLink,
} from "lucide-react";
import { business, services, nav } from "@/data/site";
import { useConsent } from "@/lib/consent";
import HannachiBrandLogo from "@/components/HannachiBrandLogo";

export default function Footer() {
  const { openConsentManager } = useConsent();

  return (
    <>
      <footer className="cv-auto bg-primary-dark text-white/75 border-t border-white/10 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        <div className="container-page grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-7 sm:gap-8 lg:gap-10 py-10 sm:py-14">
          {/* Brand & Legal Positioning */}
          <div className="sm:col-span-2 lg:col-span-4">
            <div className="flex items-center gap-3">
              <HannachiBrandLogo size={38} />
              <div>
                <p className="text-[18px] font-extrabold tracking-wide text-white">HANNACHI</p>
                <p className="text-[10px] font-medium text-white/60 leading-none">
                  {business.tagline}
                </p>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-[13px] leading-relaxed">
              Hausgeräte-Spezialist in {business.city} seit {business.founded}:{" "}
              <strong className="text-white font-semibold">
                Persönliche Fachberatung, Original-Ersatzteile nach E-Nr.
              </strong>{" "}
              &amp; ausgewählte Markengeräte auf Anfrage. Inhaber {business.owner}.
            </p>

            {/* Social Media Section */}
            <div className="mt-5 pt-4 border-t border-white/10 max-w-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/55 mb-2.5">
                Social Media &amp; Aktuelle Einblicke
              </p>
              <a
                href={business.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Hannachi Elektrohaushaltsgeräte & Ersatzteile auf Facebook besuchen"
                data-testid="footer-facebook-link"
                className="group inline-flex w-full sm:w-auto min-h-[46px] items-center justify-between sm:justify-start gap-2.5 rounded-xl border border-sky-400/30 bg-[#1877F2]/15 hover:bg-[#1877F2] px-3.5 py-2 text-xs font-bold text-white transition-all shadow-sm"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1877F2] text-white group-hover:bg-white group-hover:text-[#1877F2] transition-colors">
                    <FacebookIcon className="h-4 w-4" />
                  </span>
                  <span className="leading-tight min-w-0">
                    <span className="block font-extrabold text-white truncate">Auf Facebook folgen</span>
                    <span className="block text-[11px] font-medium text-sky-200 group-hover:text-white/90 truncate">
                      @{business.facebookHandle}
                    </span>
                  </span>
                </span>
                <ExternalLink
                  size={13}
                  className="ml-1 shrink-0 text-sky-300 group-hover:text-white transition-colors"
                  aria-hidden="true"
                />
              </a>
            </div>
          </div>

          {/* Nav */}
          <FooterCol title="Seiten" colSpan="lg:col-span-2">
            {nav.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className="inline-flex min-h-[44px] sm:min-h-0 w-full items-center hover:text-accent transition-colors"
                >
                  {n.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/marktplatz"
                className="inline-flex min-h-[44px] sm:min-h-0 w-full items-center hover:text-accent transition-colors"
              >
                Aktueller Bestand
              </Link>
            </li>
          </FooterCol>

          {/* Geräte & Ersatzteile */}
          <FooterCol title="Geräte & Teile" colSpan="lg:col-span-3">
            {services.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/leistungen/${s.slug}`}
                  className="inline-flex min-h-[44px] sm:min-h-0 w-full items-center hover:text-accent transition-colors"
                >
                  {s.title}
                </Link>
              </li>
            ))}
          </FooterCol>

          {/* Contact */}
          <div className="sm:col-span-2 lg:col-span-3">
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-white/90">
              Kontakt &amp; Termine
            </h2>
            <address className="mt-4 space-y-3 text-[13px] sm:text-[14px] not-italic leading-relaxed">
              <div className="flex items-start gap-2">
                <MapPin size={15} className="mt-0.5 shrink-0 text-accent" />
                <div>
                  <span className="block text-white font-semibold">
                    {business.city} &amp; Umgebung
                  </span>
                  <span className="block text-xs text-white/65">
                    {business.street}, {business.zip} {business.city} · Termine nach Vereinbarung
                  </span>
                </div>
              </div>
              <p className="flex items-center gap-2">
                <Phone size={15} className="shrink-0 text-accent" />
                <a
                  href={business.phoneHref}
                  className="inline-flex min-h-[44px] sm:min-h-0 items-center hover:text-accent transition-colors font-semibold text-white tabular-nums"
                >
                  {business.phoneDisplay}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Mail size={15} className="shrink-0 text-accent" aria-hidden="true" />
                <a
                  href={`mailto:${business.email}`}
                  className="inline-flex min-h-[44px] sm:min-h-0 items-center hover:text-accent transition-colors font-medium text-white/90 break-all"
                >
                  {business.email}
                </a>
              </p>
              <div className="flex items-start gap-2 text-white/60 text-xs">
                <Clock size={14} className="shrink-0 text-accent/70 mt-0.5" />
                <div>
                  <span>Mo. bis Sa., 08:00 bis 18:00 Uhr</span>
                  <span className="block text-[11px] font-semibold text-accent-light">
                    Termine nach Vereinbarung · Telefon &amp; WhatsApp
                  </span>
                </div>
              </div>
              <p className="flex items-center gap-2 pt-0.5">
                <FacebookIcon className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                <a
                  href={business.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] sm:min-h-0 items-center gap-1 hover:text-sky-300 transition-colors font-semibold text-white/90 text-xs"
                >
                  <span>Facebook · Hannachi Osnabrück</span>
                  <ExternalLink size={11} className="opacity-75" aria-hidden="true" />
                </a>
              </p>
            </address>
          </div>
        </div>

        {/* Oversized signature wordmark — mathematically centered & never clips on any phone */}
        <div className="container-page overflow-hidden py-1 sm:py-2">
          <WordmarkReveal
            text="HANNACHI"
            className="pt-1 pb-1 text-center font-extrabold tracking-[-0.03em] text-[clamp(2.4rem,13.4vw,12rem)]"
            letterClassName="bg-gradient-to-b from-white/[0.18] to-white/[0.02] bg-clip-text text-transparent"
          />
        </div>

        {/* Bottom bar with clean standard legal links */}
        <div className="border-t border-white/10">
          <div className="container-page flex flex-col items-center text-center gap-3 py-5 sm:py-6 text-[13px] text-white/60 lg:flex-row lg:items-center lg:justify-between lg:text-left">
            <p className="leading-relaxed">
              © {new Date().getFullYear()} {business.name} {business.tagline} · {business.city}
            </p>
            <ul className="flex flex-wrap items-center justify-center lg:justify-end gap-x-4 gap-y-1 sm:gap-x-6">
              <li>
                <a
                  href={business.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Hannachi Elektrohaushaltsgeräte & Ersatzteile auf Facebook"
                  className="inline-flex min-h-[44px] sm:min-h-[36px] items-center gap-1.5 font-semibold text-white/90 hover:text-sky-300 transition-colors"
                >
                  <FacebookIcon className="h-3.5 w-3.5 text-sky-400" />
                  <span>Facebook</span>
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={openConsentManager}
                  className="inline-flex min-h-[44px] sm:min-h-[36px] items-center gap-1.5 hover:text-white transition-colors text-left cursor-pointer"
                  aria-label="Cookie- und Datenschutzeinstellungen anpassen oder widerrufen"
                >
                  <Sliders size={13} className="text-sky-400" aria-hidden="true" />
                  <span>Cookie-Einstellungen</span>
                </button>
              </li>
              <li>
                <Link
                  href="/impressum#garantie"
                  className="inline-flex min-h-[44px] sm:min-h-[36px] items-center hover:text-accent transition-colors"
                >
                  Garantie &amp; ElektroG
                </Link>
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
            </ul>
          </div>
        </div>
      </footer>
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
        className="flex min-h-[44px] sm:min-h-0 w-full items-center justify-between text-left text-xs font-bold uppercase tracking-[0.14em] text-white/90 sm:pointer-events-none cursor-pointer sm:cursor-default"
      >
        <span>{title}</span>
        <span className="text-sm font-bold text-accent-light sm:hidden">
          {openOnMobile ? "−" : "+"}
        </span>
      </button>
      <ul
        className={`${
          openOnMobile ? "mt-2 block" : "hidden"
        } sm:mt-4 sm:block space-y-2 text-[13px] pb-2 sm:pb-0`}
      >
        {children}
      </ul>
    </div>
  );
}

function FacebookIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
  );
}

