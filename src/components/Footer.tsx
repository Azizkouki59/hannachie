"use client";
import Link from "next/link";
import { Phone, MapPin, Clock, Wrench, Sliders } from "lucide-react";
import { business, services, nav } from "@/data/site";
import { useConsent } from "@/lib/consent";

export default function Footer() {
  const { openConsentManager } = useConsent();

  return (
    <footer className="bg-primary-dark text-white/75">
      <div className="container-page grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-8 sm:gap-10 lg:gap-12 py-12 sm:py-16">
        {/* Brand */}
        <div className="sm:col-span-2 md:col-span-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/20 text-accent">
              <Wrench size={18} />
            </div>
            <div>
              <p className="text-[18px] font-extrabold tracking-wide text-white">HANNACHI</p>
              <p className="text-[10px] font-medium text-white/50 leading-none">Elektrohaushaltsgeräte</p>
            </div>
          </div>
          <p className="mt-5 max-w-sm text-[14px] leading-relaxed">
            Unabhängiger Reparaturservice für Haushaltsgeräte in Osnabrück. Inhaber {business.owner}, seit {business.founded}.
          </p>
        </div>

        {/* Nav */}
        <FooterCol title="Seiten">
          {nav.map((n) => <li key={n.href}><Link href={n.href} className="hover:text-accent transition-colors">{n.label}</Link></li>)}
        </FooterCol>

        {/* Services */}
        <FooterCol title="Leistungen">
          {services.map((s) => <li key={s.slug}><Link href={`/leistungen/${s.slug}`} className="hover:text-accent transition-colors">{s.title}</Link></li>)}
        </FooterCol>

        {/* Contact */}
        <div className="sm:col-span-2 md:col-span-3">
          <h2 className="text-sm font-semibold text-white">Kontakt</h2>
          <address className="mt-4 space-y-3 text-[14px] not-italic leading-relaxed">
            <div className="flex items-start gap-2">
              <MapPin size={15} className="mt-0.5 shrink-0 text-accent" />
              <a
                href={business.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent transition-colors group"
                title="Standort auf Google Maps öffnen"
              >
                <span>{business.street}<br />{business.zip} {business.city}</span>
                <span className="block text-xs font-semibold text-accent/80 group-hover:text-accent mt-0.5">
                  Auf Google Maps öffnen →
                </span>
              </a>
            </div>
            <p className="flex items-center gap-2">
              <Phone size={15} className="shrink-0 text-accent" />
              <a href={business.phoneHref} className="hover:text-accent transition-colors">{business.phoneDisplay}</a>
            </p>
            <p className="flex items-center gap-2 text-white/50">
              <Clock size={15} className="shrink-0 text-accent/60" />
              {business.hours}
            </p>
          </address>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/8">
        <div className="container-page flex flex-col gap-3 py-6 text-[13px] text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Hannachi Elektrohaushaltsgeräte Service · Osnabrück</p>
          <ul className="flex flex-wrap items-center gap-4 sm:gap-6">
            <li>
              <button
                type="button"
                onClick={openConsentManager}
                className="inline-flex items-center gap-1.5 hover:text-white/80 transition-colors text-left cursor-pointer"
                aria-label="Cookie- und Datenschutzeinstellungen anpassen oder widerrufen"
              >
                <Sliders size={13} className="text-accent-light" aria-hidden="true" />
                <span>Cookie-Einstellungen</span>
              </button>
            </li>
            <li><Link href="/impressum" className="hover:text-white/70 transition-colors">Impressum</Link></li>
            <li><Link href="/datenschutz" className="hover:text-white/70 transition-colors">Datenschutz</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="md:col-span-2">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <ul className="mt-4 space-y-2.5 text-[14px]">{children}</ul>
    </div>
  );
}
