"use client";

import React from "react";
import { ShieldCheck, Award, CheckCircle2, MapPin, Wrench } from "lucide-react";
import { business, yearsOfExperience } from "@/data/site";

const CERTIFICATIONS = [
  {
    icon: Award,
    code: `Seit ${business.founded}`,
    title: `${yearsOfExperience}+ Jahre Erfahrung`,
    subtitle: "Inhabergeführter Vor-Ort-Service in Osnabrück",
  },
  {
    icon: MapPin,
    code: "Osnabrück & Umgebung",
    title: "Mobiler Vor-Ort-Service",
    subtitle: "Direkt bei Ihnen zu Hause nach Terminvereinbarung",
  },
  {
    icon: Wrench,
    code: "Alle Marken",
    title: "Passende Ersatzteile",
    subtitle: "Original- & Qualitätsteile nach Typenschild (E-Nr. / PNC)",
  },
  {
    icon: ShieldCheck,
    code: "Falls Altgerät unrentabel",
    title: "Geprüfte Ersatzgeräte",
    subtitle: "Inkl. schriftlicher Verkäufergarantie vom Inhaber",
  },
  {
    icon: CheckCircle2,
    code: "Voller Garantieschutz",
    title: "Garantie-Service",
    subtitle: "Garantie & Reparatur für alle bei uns gekauften Geräte",
  },
];

export default function TrustCertificationsBanner() {
  return (
    <section
      aria-label="Qualitäts- und Garantiezusagen"
      className="border-y border-primary/8 dark:border-white/10 bg-surface dark:bg-slate-900/90 py-6 sm:py-8"
    >
      <div className="container-page">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {CERTIFICATIONS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex items-start gap-3 rounded-2xl border border-primary/8 dark:border-white/10 bg-white dark:bg-slate-950 p-3.5 sm:p-4 shadow-2xs"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Icon size={19} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <span className="block font-mono text-[10px] font-extrabold uppercase tracking-wider text-accent">
                    {item.code}
                  </span>
                  <p className="mt-0.5 text-xs sm:text-sm font-extrabold text-primary dark:text-slate-100 leading-snug">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-muted leading-snug">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
