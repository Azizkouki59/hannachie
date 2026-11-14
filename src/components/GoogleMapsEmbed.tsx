"use client";

import React, { useState } from "react";
import { MapPin, ShieldAlert, ExternalLink, CheckCircle } from "lucide-react";
import { business } from "@/data/site";
import { useConsent } from "@/lib/consent";

interface GoogleMapsEmbedProps {
  className?: string;
  title?: string;
}

export default function GoogleMapsEmbed({
  className = "relative aspect-[16/10] w-full",
  title = "Hannachi Standort Osnabrück auf Google Maps",
}: GoogleMapsEmbedProps) {
  const { canLoadExternalMedia, saveCustomPreferences } = useConsent();
  const [sessionAllowed, setSessionAllowed] = useState(false);

  const isUnlocked = canLoadExternalMedia || sessionAllowed;

  const handleUnlockForSession = () => {
    setSessionAllowed(true);
    saveCustomPreferences(true);
  };

  if (isUnlocked) {
    return (
      <div className={className}>
        <iframe
          title={title}
          src={business.mapsEmbedUrl}
          className="h-full w-full border-0"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    );
  }

  return (
    <div
      className={`${className} flex flex-col justify-between overflow-hidden bg-slate-900 text-white p-5 sm:p-6 border border-primary/10 dark:border-white/10`}
    >
      {/* Background blueprint grid pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(56, 189, 248, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.4) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10">
        <div className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/30 bg-sky-500/15 px-2.5 py-1 text-[11px] font-bold text-sky-300">
          <ShieldAlert size={13} aria-hidden="true" />
          <span>DSGVO-Zwei-Klick-Schutz aktiv</span>
        </div>

        <h3 className="mt-3 text-sm sm:text-base font-extrabold text-white">
          Interaktive Google-Maps-Karte
        </h3>
        <p className="mt-1.5 text-xs text-white/75 leading-relaxed max-w-md">
          Zum Schutz Ihrer Privatsphäre wurde die Google-Maps-Karte blockiert. Beim
          Laden der Karte können personenbezogene Daten (z. B. IP-Adresse) an Google LLC
          in den USA übermittelt werden.
        </p>

        <div className="mt-3 text-xs text-sky-200/90 font-medium flex items-center gap-1.5">
          <MapPin size={14} className="text-accent-light shrink-0" />
          <span>{business.street}, {business.zip} {business.city}</span>
        </div>
      </div>

      <div className="relative z-10 mt-5 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={handleUnlockForSession}
          className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-95 px-4 py-2 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
        >
          <CheckCircle size={14} aria-hidden="true" />
          <span>Karte laden &amp; aktivieren</span>
        </button>

        <a
          href={business.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 active:scale-95 px-3.5 py-2 text-xs font-semibold text-white transition-all"
        >
          <span>Auf Google Maps öffnen</span>
          <ExternalLink size={12} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
