"use client";
import Link from "next/link";
import { Phone, MessageCircle, ArrowRight, PackageSearch } from "lucide-react";
import { business, yearsOfExperience } from "@/data/site";
import { useQuickRequest } from "@/components/QuickRequestSheet";

export default function ContactCta() {
  const { openQuickRequest } = useQuickRequest();

  return (
    <section className="relative overflow-hidden bg-primary-dark text-white">
      {/* Background effects */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        {/* Glow blobs */}
        <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-[#1974B8]/16 blur-[120px]" />
        <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-[#C92A42]/11 blur-[100px]" />
      </div>

      {/* Top border accent */}
      <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#64B5EC]/55 via-45% to-[#E86A7D]/48" />

      <div className="container-page relative grid gap-6 sm:gap-8 lg:gap-10 py-10 sm:py-14 lg:py-16 lg:grid-cols-12 lg:items-center">
        {/* Text */}
        <div className="lg:col-span-7">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-accent-light">
            <span>Seit {business.founded} · {business.city}</span>
            <span aria-hidden="true">·</span>
            <span>Termine nach Vereinbarung</span>
          </div>
          <h2 className="text-2xl font-extrabold leading-[1.15] sm:text-3xl lg:text-[34px] text-balance">
            Direkt per WhatsApp anfragen.{" "}
            <span className="text-accent-light">Persönlich für Sie da.</span>
          </h2>
          <p className="mt-2.5 max-w-lg text-sm sm:text-base text-white/75">
            Fachberatung · Original-Ersatzteile · Markengeräte auf Anfrage ·{" "}
            <span className="font-medium text-white/90">{business.hours}</span>
          </p>
          {/* Trust micro-items */}
          <ul className="mt-3.5 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-white/65">
            {[`${yearsOfExperience}+ Jahre Erfahrung`, "Originalteile nach E-Nr.", "Geräte auf Anfrage"].map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-accent/70 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Direct WhatsApp + Structured Form + Phone */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5 lg:col-span-5">
          <div className="col-span-2 lg:col-span-1 space-y-1.5">
            <a
              href={business.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              data-variant="hover-emerald"
              className="btn-whatsapp-hover group inline-flex min-h-[48px] w-full items-center justify-between gap-2 rounded-xl bg-emerald-600 px-4 sm:px-5 py-3 text-xs sm:text-sm font-extrabold text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <span className="inline-flex items-center gap-2 min-w-0">
                <span className="whatsapp-hover-icon shrink-0" aria-hidden="true">
                  <MessageCircle size={16} />
                </span>
                <span className="truncate">Direkt per WhatsApp schreiben</span>
              </span>
              <ArrowRight size={15} className="shrink-0 transition-transform group-hover:translate-x-0.5" />
            </a>
            <p className="text-center text-[11px] leading-snug text-white/60">
              Freiwillige Weiterleitung zu WhatsApp (Meta) ·{" "}
              <Link
                href="/datenschutz#whatsapp"
                className="underline underline-offset-2 hover:text-white/90 transition-colors"
              >
                Datenschutz
              </Link>
            </p>
          </div>
          <button
            type="button"
            onClick={() => openQuickRequest("Waschmaschine", "", "", "repair")}
            className="col-span-1 group inline-flex min-h-[48px] w-full items-center justify-center sm:justify-between gap-1.5 sm:gap-2 rounded-xl bg-accent px-3 sm:px-5 py-3 text-xs sm:text-sm font-extrabold text-white shadow-sm transition-all duration-200 hover:bg-accent-dark hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer min-w-0"
          >
            <span className="inline-flex items-center gap-1.5 sm:gap-2 min-w-0">
              <PackageSearch size={15} className="shrink-0" />
              <span className="truncate sm:hidden">Kurzformular</span>
              <span className="hidden sm:inline truncate">Kurzformular ausfüllen</span>
            </span>
            <ArrowRight size={14} className="hidden sm:block shrink-0 transition-transform group-hover:translate-x-0.5" />
          </button>
          <a
            href={business.phoneHref}
            className="col-span-1 flex min-h-[48px] lg:min-h-[44px] w-full items-center justify-center gap-1.5 sm:gap-2 rounded-xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.1] hover:border-accent-light/40 px-2.5 sm:px-4 py-2.5 text-center text-xs font-semibold text-white/85 transition-colors min-w-0"
          >
            <Phone size={13} className="text-accent-light shrink-0" />
            <span className="truncate sm:hidden">
              <strong className="text-white tabular-nums">{business.phoneDisplay}</strong>
            </span>
            <span className="hidden sm:inline truncate">
              Anrufen: <strong className="text-white tabular-nums">{business.phoneDisplay}</strong>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
