"use client";
import type { Metadata } from "next";
import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { useQuickRequest } from "@/components/QuickRequestSheet";
import { buildRouteMetadata } from "@/lib/seo";

export const metadata: Metadata = buildRouteMetadata("/anfrage");

export default function AnfragePage({
  searchParams,
}: {
  searchParams?: { geraet?: string; symptom?: string };
}) {
  const { openQuickRequest } = useQuickRequest();
  const geraetParam = searchParams?.geraet || "";
  const symptomParam = searchParams?.symptom || "";

  useEffect(() => {
    // Automatically open the unified global modal window on page load with any query parameters
    openQuickRequest(geraetParam, symptomParam, "", "repair");
  }, [geraetParam, symptomParam, openQuickRequest]);

  return (
    <>
      <PageHeader
        title="Reparaturanfrage & Online-Diagnose"
        intro="Das einheitliche Anfragefenster für Herrn Hannachi. Alle Anfragen werden direkt und mit verifiziertem Google Maps Standort erfasst."
      />

      <section className="py-10 sm:py-20 bg-surface">
        <div className="container-page max-w-4xl text-center space-y-6 sm:space-y-8">
          <div className="mx-auto max-w-2xl rounded-2xl sm:rounded-3xl border border-accent/35 bg-white dark:bg-slate-900 p-5 sm:p-10 shadow-xl space-y-5 sm:space-y-6">
            <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-accent text-white shadow-md">
              <Sparkles size={28} />
            </div>
            <div>
              <h2 className="text-xl sm:text-3xl font-extrabold text-primary dark:text-slate-100">
                Einheitliches Reparaturfenster aktiv
              </h2>
              <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                Das zentrale Anfragefenster von Herrn Hannachi wurde für Sie geöffnet. Sie können Ihr defektes Gerät, Ihre Marke, Ihr Fehlerbild und Ihren Google-Maps-Standort mit wenigen Klicks übermitteln.
              </p>
            </div>

            <button
              type="button"
              onClick={() => openQuickRequest("Waschmaschine", "", "", "repair")}
              className="inline-flex min-h-[52px] w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-accent px-5 sm:px-8 py-3.5 sm:py-4 text-center text-sm sm:text-base font-bold leading-snug text-white shadow-lg shadow-accent/30 hover:bg-accent-dark transition-all cursor-pointer sm:whitespace-nowrap"
            >
              <Sparkles size={18} className="shrink-0" />
              <span>Einheitliches Anfragefenster jetzt öffnen</span>
            </button>
          </div>

          <div className="grid gap-4 sm:gap-6 sm:grid-cols-3 pt-2 sm:pt-6">
            <div className="rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 p-5 text-left shadow-xs">
              <p className="font-extrabold text-primary dark:text-slate-100">1. Gerät &amp; Marke</p>
              <p className="mt-1 text-xs text-ink-muted">Wählen Sie aus unserem Katalog inkl. intelligenter Modellvorschläge.</p>
            </div>
            <div className="rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 p-5 text-left shadow-xs">
              <p className="font-extrabold text-primary dark:text-slate-100">2. Google Maps GPS</p>
              <p className="mt-1 text-xs text-ink-muted">Teilen Sie Ihren exakten Standort für Herrn Hannachis Anfahrt.</p>
            </div>
            <div className="rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 p-5 text-left shadow-xs">
              <p className="font-extrabold text-primary dark:text-slate-100">3. WhatsApp &amp; Ticket</p>
              <p className="mt-1 text-xs text-ink-muted">Sofortige Übermittlung an Herrn Hannachi mit 1 Klick.</p>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/simulator#selbsthilfe-checkliste"
              className="inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-accent dark:text-accent-light hover:underline"
            >
              <span>Einfache Fehler lieber zuerst selbst prüfen (Checkliste)</span>
              <ArrowRight size={14} className="shrink-0" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
