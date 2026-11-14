"use client";
import { Phone, MessageCircle, ArrowRight, Sparkles, Wrench } from "lucide-react";
import { business } from "@/data/site";
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
        <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-accent/15 blur-[120px]" />
        <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-blue-600/10 blur-[100px]" />
      </div>

      {/* Top border accent */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

      <div className="container-page relative grid gap-8 sm:gap-10 py-14 sm:py-24 lg:py-32 lg:grid-cols-12 lg:items-center">
        {/* Text */}
        <div className="lg:col-span-7">
          <div className="mb-4 sm:mb-5 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3.5 sm:px-4 py-1.5 text-[11px] sm:text-xs font-semibold text-accent">
            <Sparkles size={12} className="shrink-0" />
            <span>Kostenlose Ersteinschätzung · Versand per WhatsApp</span>
          </div>
          <h2 className="text-3xl font-extrabold leading-[1.1] sm:text-5xl lg:text-[56px]">
            Gerät kaputt?<br />
            <span className="bg-gradient-to-r from-accent-light via-accent to-sky-400 bg-clip-text text-transparent">
              Wir helfen sofort.
            </span>
          </h2>
          <p className="mt-4 sm:mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-white/65">
            Füllen Sie kurz unser Anfrage- oder Frageformular aus – Ihre vollständige Nachricht wird{" "}
            <strong className="text-white">fertig per WhatsApp an Herrn Hannachi</strong> vorbereitet.{" "}
            <span className="font-medium text-white/90">{business.hours}.</span>
          </p>
          {/* Trust micro-items */}
          <ul className="mt-5 sm:mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs sm:text-sm text-white/50">
            {["Komplette WhatsApp-Nachricht", "Faire Festpreise", "Termine oft am nächsten Tag"].map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-accent/60 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA buttons -> Form -> WhatsApp */}
        <div className="flex flex-col gap-3 lg:col-span-5">
          <button
            type="button"
            onClick={() => openQuickRequest("Waschmaschine", "", "", "repair")}
            className="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-accent px-4 sm:px-6 py-3.5 sm:py-4 text-center text-sm sm:text-base font-semibold text-white shadow-lg shadow-accent/25 transition-all duration-200 hover:bg-accent-dark hover:shadow-[0_8px_30px_rgba(14,165,233,.4)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Wrench size={18} className="shrink-0" />
            <span className="flex-1 sm:flex-initial">Komplette Reparaturanfrage (WhatsApp)</span>
            <ArrowRight size={16} className="shrink-0 sm:ml-auto transition-transform group-hover:translate-x-1" />
          </button>
          <button
            type="button"
            onClick={() => openQuickRequest("Waschmaschine", "", "", "question")}
            className="group inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 sm:px-6 py-3.5 text-center text-sm sm:text-[15px] font-semibold text-white shadow-md transition-all duration-200 hover:bg-emerald-700 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <MessageCircle size={18} className="shrink-0" />
            <span className="flex-1 sm:flex-initial">Direkte Frage für WhatsApp ausfüllen</span>
            <ArrowRight size={16} className="shrink-0 sm:ml-auto transition-transform group-hover:translate-x-1" />
          </button>
          <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 sm:px-4 py-2.5 text-center text-xs text-white/60">
            <Phone size={14} className="text-accent-light shrink-0" />
            <span>Werkstatt-Telefon: {business.phoneDisplay} · {business.street}, {business.city}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
