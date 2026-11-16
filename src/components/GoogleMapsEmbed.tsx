"use client";

import React from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { business } from "@/data/site";

interface GoogleMapsEmbedProps {
  className?: string;
  title?: string;
}

export default function GoogleMapsEmbed({
  className = "relative aspect-[16/10] w-full",
  title = "Hannachi Standort Osnabrück auf Google Maps",
}: GoogleMapsEmbedProps) {
  return (
    <div className={`${className} overflow-hidden bg-slate-100 dark:bg-slate-900`}>
      <iframe
        title={title}
        src={business.mapsEmbedUrl}
        className="h-full w-full border-0"
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="pointer-events-none absolute inset-x-2.5 sm:inset-x-3 bottom-2.5 sm:bottom-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
        <span className="pointer-events-auto inline-flex items-center gap-1.5 rounded-xl bg-slate-900/90 px-3 py-1.5 text-xs font-bold text-white shadow-md backdrop-blur-xs max-w-full">
          <MapPin size={13} className="text-red-500 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {business.street}, {business.zip} {business.city}
          </span>
        </span>
        <a
          href={business.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto inline-flex min-h-[42px] sm:min-h-0 items-center justify-center gap-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 px-3.5 py-2 sm:py-1.5 text-xs font-bold text-primary dark:text-slate-100 shadow-md hover:text-accent active:scale-95 transition-all cursor-pointer"
        >
          <span>Route öffnen</span>
          <ExternalLink size={13} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
