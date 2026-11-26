import Link from "next/link";
import { ArrowRight, Home, MessageSquareText, SearchX, PackageSearch } from "lucide-react";
import { useQuickRequest } from "@/components/QuickRequestSheet";

export default function NotFound() {
  const { openQuickRequest } = useQuickRequest();

  return (
    <section className="container-page py-20 sm:py-28">
      <div className="mx-auto max-w-2xl rounded-3xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 p-6 sm:p-10 shadow-card">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent-light">
            <SearchX size={24} aria-hidden />
          </div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-accent dark:text-accent-light">
            Fehler 404
          </span>
        </div>

        <h1 className="mt-5 text-3xl sm:text-4xl font-extrabold tracking-tight text-primary dark:text-slate-100">
          Diese Seite gibt es nicht.
        </h1>
        <p className="mt-3 text-base sm:text-lg leading-relaxed text-ink-muted dark:text-slate-400">
          Die aufgerufene Adresse wurde möglicherweise verschoben oder existiert nicht mehr. Kehren Sie zur Startseite zurück oder entdecken Sie unsere Übersicht zu Geräten &amp; Original-Ersatzteilen.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/" className="btn-primary w-full sm:w-auto">
            <Home size={16} aria-hidden />
            Zur Startseite
          </Link>
          <Link href="/leistungen" className="btn-ghost w-full sm:w-auto">
            <PackageSearch size={16} aria-hidden />
            Geräte &amp; Ersatzteile
          </Link>
          <button
            type="button"
            onClick={() => openQuickRequest()}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-accent/25 bg-accent/8 dark:bg-accent/15 px-5 py-3 text-sm font-bold text-accent dark:text-accent-light transition-colors hover:bg-accent hover:text-white cursor-pointer"
          >
            <MessageSquareText size={16} aria-hidden />
            Schnellanfrage öffnen
            <ArrowRight size={15} aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
