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
        title="Vor-Ort-Termin, Ersatzteil & Ersatzgerät anfragen"
        intro="Das zentrale Anfragefenster für Herrn Hannachi: Vor-Ort-Termin bei Ihnen zu Hause in Osnabrück anfragen, passende Ersatzteile bestellen, ein geprüftes Ersatzgerät mit schriftlicher Garantie anfragen oder einen Garantiefall melden."
      />

      <section className="py-10 sm:py-20 bg-surface">
        <div className="container-page max-w-4xl text-center space-y-6 sm:space-y-8">
          <div className="mx-auto max-w-2xl rounded-2xl sm:rounded-3xl border border-accent/35 bg-white dark:bg-slate-900 p-5 sm:p-10 shadow-xl space-y-5 sm:space-y-6">
            <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-accent text-white shadow-md">
              <Sparkles size={28} />
            </div>
            <div>
              <h2 className="text-xl sm:text-3xl font-extrabold text-primary dark:text-slate-100">
                Unverbindliches Anfragefenster aktiv
              </h2>
              <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                Das zentrale Anfragefenster von Herrn Hannachi wurde für Sie geöffnet. Wählen Sie Ihr Anliegen (Vor-Ort-Check &amp; Ersatzteil, Angebot für ein geprüftes Ersatzgerät mit schriftlicher Garantie oder Garantie-Anfrage) und übermitteln Sie Ihre Anfrage mit wenigen Klicks.
              </p>
            </div>

            <button
              type="button"
              onClick={() => openQuickRequest("Waschmaschine", "", "", "repair")}
              className="inline-flex min-h-[52px] w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-accent px-5 sm:px-8 py-3.5 sm:py-4 text-center text-sm sm:text-base font-bold leading-snug text-white shadow-lg shadow-accent/30 hover:bg-accent-dark transition-all cursor-pointer sm:whitespace-nowrap"
            >
              <Sparkles size={18} className="shrink-0" />
              <span>Anfragefenster jetzt öffnen</span>
            </button>
          </div>

          <div className="grid gap-4 sm:gap-6 sm:grid-cols-3 pt-2 sm:pt-6">
            <div className="rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 p-5 text-left shadow-xs">
              <p className="font-extrabold text-primary dark:text-slate-100">1. Gerät &amp; Anliegen</p>
              <p className="mt-1 text-xs text-ink-muted">Schildern Sie kurz das Problem an Ihrem Gerät oder das benötigte Ersatzteil.</p>
            </div>
            <div className="rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 p-5 text-left shadow-xs">
              <p className="font-extrabold text-primary dark:text-slate-100">2. Wohnort in Osnabrück</p>
              <p className="mt-1 text-xs text-ink-muted">Geben Sie PLZ &amp; Ort für Ihren Vor-Ort-Termin nach Vereinbarung an.</p>
            </div>
            <div className="rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 p-5 text-left shadow-xs">
              <p className="font-extrabold text-primary dark:text-slate-100">3. Direkt per WhatsApp</p>
              <p className="mt-1 text-xs text-ink-muted">Sofortige Übermittlung an Herrn Hannachi mit 1 Klick.</p>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/#ablauf"
              className="inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-accent dark:text-accent-light hover:underline"
            >
              <span>Unseren 4-Schritte-Vor-Ort-Ablauf ansehen</span>
              <ArrowRight size={14} className="shrink-0" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
