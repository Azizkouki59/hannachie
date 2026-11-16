"use client";
import type { Metadata } from "next";
import { CheckCircle2, ArrowRight, Phone, MessageCircle, Wrench } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { InteractiveApplianceShowcase } from "@/components/AnimatedAppliances";
import {
  business,
  sparePartsHighlights,
  sparePartsCategories,
  sparePartsBrands,
} from "@/data/site";
import { useQuickRequest } from "@/components/QuickRequestSheet";
import SelfHelpChecklist from "@/components/SelfHelpChecklist";
import SimulatorFaqSection from "@/components/SimulatorFaqSection";
import ContactCta from "@/components/ContactCta";
import { buildRouteMetadata } from "@/lib/seo";

export const metadata: Metadata = buildRouteMetadata("/simulator");

export default function SimulatorPage() {
  const { openQuickRequest } = useQuickRequest();

  return (
    <>
      <PageHeader
        title="Interaktiver Geräte- & Ersatzteil-Assistent"
        intro="Wählen Sie Ihr Haushaltsgerät, nutzen Sie die kostenlose Selbsthilfe-Checkliste oder ermitteln Sie gezielt das passende Original-Ersatzteil anhand Ihres Typenschilds (reiner Teileverkauf – kein Handwerksbetrieb)."
      />

      {/* Interactive Appliance Lab */}
      <section className="py-12 sm:py-20 bg-surface">
        <div className="container-page">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-accent mb-1.5">
                Interaktives Gerätelabor
              </p>
              <h2 className="text-2xl font-extrabold text-primary dark:text-slate-100 sm:text-3xl">
                Wählen Sie Ihr Gerät &amp; tippen Sie auf das Symptom
              </h2>
            </div>
            <button
              type="button"
              onClick={() => openQuickRequest()}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline whitespace-nowrap cursor-pointer"
            >
              Direkt zum Anfrageformular <ArrowRight size={14} />
            </button>
          </div>

          <InteractiveApplianceShowcase
            onSelectRepair={(device, symptom, mode) => openQuickRequest(device, symptom, "", mode || "repair")}
          />
        </div>
      </section>

      {/* Interactive Pre-Request Self-Help Checklist */}
      <SelfHelpChecklist />

      {/* Frequently Asked Troubleshooting Questions (FAQ) */}
      <SimulatorFaqSection />

      {/* Original Spare Parts Section */}
      <section className="py-14 sm:py-24 bg-white dark:bg-slate-900/60 border-t border-primary/8 dark:border-white/10">
        <div className="container-page">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-accent mb-2">
              Originalteile &amp; Lieferanten
            </p>
            <h2 className="text-2xl font-extrabold text-primary dark:text-slate-100 sm:text-4xl">
              Originalersatzteile für alle Marken
            </h2>
            <p className="mt-3 text-sm sm:text-base text-ink-muted">
              Gängige Verschleißteile direkt ab Osnabrücker Lager oder kurzfristig für Sie beschafft (reiner Ersatzteilverkauf nach Terminvereinbarung – kein Einbau).
            </p>
          </div>

          {/* 4 Value Pillars */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sparePartsHighlights.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-primary/8 dark:border-white/10 bg-surface p-5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent mb-3">
                  <CheckCircle2 size={18} />
                </div>
                <h3 className="text-base font-bold text-primary dark:text-slate-100">{item.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Baugruppen Matrix */}
          <div className="mt-10 rounded-2xl sm:rounded-3xl border border-primary/10 bg-slate-900 text-white p-4 sm:p-8 lg:p-10">
            <div className="pb-6 border-b border-white/10">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-accent-light">
                  Sortiment im Überblick
                </p>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                  Gängige Ersatzteile &amp; Baugruppen
                </h3>
              </div>
            </div>

            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {sparePartsCategories.map((cat) => (
                <div
                  key={cat.category}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <h4 className="text-sm font-bold text-accent-light pb-3 border-b border-white/10">
                    {cat.category}
                  </h4>
                  <ul className="mt-3.5 space-y-2">
                    {cat.parts.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-xs text-white/80">
                        <CheckCircle2 size={13} className="text-accent-light shrink-0 mt-0.5" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Brands List */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-xs font-semibold text-white/65 mb-3">
                Unterstützte Hersteller ({sparePartsBrands.length}+ Marken):
              </p>
              <div className="flex flex-wrap gap-2">
                {sparePartsBrands.map((b) => (
                  <button
                    key={b.name}
                    type="button"
                    onClick={() => openQuickRequest("Waschmaschine", `Ersatzteil für ${b.name}`, b.name)}
                    className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 hover:bg-accent hover:border-accent transition-colors cursor-pointer"
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Direct Contact Strip */}
            <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-accent/30 bg-accent/10 p-4 sm:p-5">
              <div>
                <p className="text-sm font-bold text-white">
                  Sie suchen ein bestimmtes Bauteil?
                </p>
                <p className="text-xs text-white/75 mt-0.5">
                  Senden Sie uns einfach ein Foto vom Typenschild (E-Nr. / Modell) per WhatsApp oder über das Formular.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => openQuickRequest("Waschmaschine", "Ersatzteilanfrage mit Typenschild", "", "repair")}
                  className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-center text-xs font-bold text-white hover:bg-accent-dark transition-all sm:whitespace-nowrap cursor-pointer"
                >
                  <Wrench size={14} className="shrink-0" />
                  <span>Komplette Ersatzteilanfrage</span>
                </button>
                <button
                  type="button"
                  onClick={() => openQuickRequest("Waschmaschine", "Frage zu Ersatzteil / Modell", "", "question")}
                  className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-600/25 px-4 py-2.5 text-center text-xs font-bold text-emerald-300 hover:bg-emerald-600 hover:text-white transition-all sm:whitespace-nowrap cursor-pointer"
                >
                  <MessageCircle size={14} className="shrink-0" />
                  <span>Direkte Frage (WhatsApp)</span>
                </button>
              </div>
              <p className="sr-only">
                <Phone size={12} /> {business.phoneDisplay}
              </p>
            </div>
          </div>
        </div>
      </section>

      <ContactCta />
    </>
  );
}
