"use client";

import { MessageCircle, SearchCheck, ShieldCheck, Star } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: MessageCircle,
    title: "Anfrage & Beratung",
    desc: "Senden Sie uns Ihre Geräte-, Ersatzteil- oder Ankaufanfrage bequem online oder per WhatsApp.",
  },
  {
    num: "02",
    icon: SearchCheck,
    title: "Bestandsabgleich & Angebot",
    desc: "Herr Hannachi klärt die Verfügbarkeit bzw. passende Teilenummer persönlich und erstellt ein transparentes Angebot.",
  },
  {
    num: "03",
    icon: ShieldCheck,
    title: "Übergabe & Schriftliche Garantie",
    desc: "Lieferung oder Übergabe nach Terminvereinbarung in Osnabrück – bei allen gekauften Geräten inklusive schriftlicher Verkäufergarantie.",
  },
  {
    num: "04",
    icon: Star,
    title: "Abschluss & Google-Bewertung",
    desc: "Ordentliche Übergabe mit Garantiebeleg und Möglichkeit zur Bewertung auf Google Maps.",
  },
];

export default function HowItWorks() {
  return (
    <section className="section bg-white dark:bg-slate-950 border-t border-primary/6 dark:border-white/10">
      <div className="container-page">
        {/* Header */}
        <div className="max-w-xl">
          <p className="text-xs font-bold uppercase tracking-wider text-accent">
            Einfacher Ablauf
          </p>
          <h2 className="mt-2 text-2xl font-extrabold text-primary dark:text-slate-100 sm:text-3xl">
            In 4 Schritten zum geprüften Gerät oder Ersatzteil
          </h2>
          <p className="mt-2 text-sm sm:text-base text-ink-muted">
            Direkter Kontakt mit Inhaber Kamal Hannachi in Osnabrück – transparent, persönlich und mit schriftlicher Verkäufergarantie beim Gerätekauf.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="mt-8 sm:mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.num}
                className="rounded-2xl border border-primary/8 dark:border-white/10 bg-surface dark:bg-slate-900 p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                      <Icon size={20} strokeWidth={2} />
                    </div>
                    <span className="text-xs font-extrabold tracking-wider text-ink-faint">
                      SCHRITT {s.num}
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-primary dark:text-slate-100">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                    {s.desc}
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
