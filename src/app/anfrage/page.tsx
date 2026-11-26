"use client";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarCheck, MessageSquareText, PackageSearch } from "lucide-react";
import { PageHeader } from "@/components/ui";
import RepairForm from "@/components/RepairForm";
import { buildRouteMetadata } from "@/lib/seo";

export const metadata: Metadata = buildRouteMetadata("/anfrage");

export default function AnfragePage({
  searchParams,
}: {
  searchParams?: { geraet?: string; symptom?: string };
}) {
  const geraetParam = searchParams?.geraet || "";
  const symptomParam = searchParams?.symptom || "";

  return (
    <>
      <PageHeader
        title="Direkt per WhatsApp anfragen"
        intro="Gerät & Anliegen antippen – Ihre Nachricht öffnet direkt im WhatsApp-Chat."
      />

      <section className="py-8 sm:py-14 bg-surface dark:bg-slate-950">
        <div className="container-page">
          <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
          <RepairForm
            defaultDevice={geraetParam}
            defaultSymptom={symptomParam}
            defaultMode="repair"
          />

          <div className="grid gap-3.5 sm:gap-5 sm:grid-cols-3">
            <div className="card rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 p-4 sm:p-5 text-left">
              <MessageSquareText size={18} className="text-accent mb-2" aria-hidden="true" />
              <p className="font-extrabold text-sm text-primary dark:text-slate-100">1. Beratung</p>
              <p className="mt-1 text-xs text-ink-muted">Direkt mit Inhaber Kamal Hannachi.</p>
            </div>
            <div className="card rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 p-4 sm:p-5 text-left">
              <PackageSearch size={18} className="text-amber-500 mb-2" aria-hidden="true" />
              <p className="font-extrabold text-sm text-primary dark:text-slate-100">2. Ersatzteilsuche</p>
              <p className="mt-1 text-xs text-ink-muted">Passgenau nach Typenschild (E-Nr.).</p>
            </div>
            <div className="card rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 p-4 sm:p-5 text-left">
              <CalendarCheck size={18} className="text-emerald-500 mb-2" aria-hidden="true" />
              <p className="font-extrabold text-sm text-primary dark:text-slate-100">3. Termin</p>
              <p className="mt-1 text-xs text-ink-muted">Nach Vereinbarung in Osnabrück.</p>
            </div>
          </div>

          <div className="text-center pt-1">
            <Link
              href="/#so-arbeiten-wir"
              className="inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-accent dark:text-accent-light hover:underline"
            >
              <span>So arbeiten wir ansehen</span>
              <ArrowRight size={14} className="shrink-0" />
            </Link>
          </div>
          </div>
        </div>
      </section>
    </>
  );
}
