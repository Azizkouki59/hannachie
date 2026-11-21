"use client";
import { Phone, MessageCircle, ArrowRight, Wrench } from "lucide-react";
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

      <div className="container-page relative grid gap-6 sm:gap-8 lg:gap-10 py-10 sm:py-14 lg:py-16 lg:grid-cols-12 lg:items-center">
        {/* Text */}
        <div className="lg:col-span-7">
          <div className="mb-2.5 flex flex-wrap items-center gap-2 text-xs font-semibold text-accent-light">
            <span>Mobiler Vor-Ort-Service</span>
            <span aria-hidden="true">·</span>
            <span>Versand per WhatsApp</span>
          </div>
          <h2 className="text-2xl font-extrabold leading-[1.15] sm:text-3xl lg:text-[34px] text-balance">
            Ihr Gerät streikt oder braucht ein Ersatzteil?{" "}
            <span className="text-accent-light">
              Wir kommen nach Termin zu Ihnen.
            </span>
          </h2>
          <p className="mt-2.5 sm:mt-3 max-w-xl text-sm sm:text-base leading-relaxed text-white/75">
            Ob Vor-Ort-Gerätecheck &amp; passende Ersatzteile bei Ihnen zu Hause in Osnabrück oder ein geprüftes Ersatzgerät inklusive schriftlicher Verkäufergarantie (falls sich Ihr Altgerät nicht mehr lohnt) – Ihre Anfrage wird{" "}
            <strong className="text-white">fertig per WhatsApp an Herrn Hannachi</strong> vorbereitet.{" "}
            <span className="font-medium text-white/90">{business.hours}.</span>
          </p>
          {/* Trust micro-items */}
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-white/65">
            {["Mobiler Vor-Ort-Service nach Termin", "Ersatzgeräte inkl. schriftlicher Garantie", "Osnabrück & Umgebung · Seit 1990"].map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-accent/70 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA buttons -> Form -> WhatsApp */}
        <div className="flex flex-col gap-2.5 lg:col-span-5">
          <button
            type="button"
            onClick={() => openQuickRequest("Waschmaschine", "", "", "repair")}
            className="group inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-accent px-4 sm:px-5 py-3 text-center text-xs sm:text-sm font-extrabold text-white shadow-sm transition-all duration-200 hover:bg-accent-dark hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
          >
            <Wrench size={16} className="shrink-0" />
            <span className="flex-1 sm:flex-initial">Vor-Ort-Termin &amp; Ersatzteil anfragen</span>
            <ArrowRight size={15} className="shrink-0 sm:ml-auto transition-transform group-hover:translate-x-0.5" />
          </button>
          <button
            type="button"
            onClick={() => openQuickRequest("Waschmaschine", "", "", "question")}
            data-variant="hover-emerald"
            className="btn-whatsapp-hover group inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 sm:px-5 py-3 text-center text-xs sm:text-sm font-extrabold text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
          >
            <span className="whatsapp-hover-icon shrink-0" aria-hidden="true">
              <MessageCircle size={16} />
            </span>
            <span className="flex-1 sm:flex-initial">Direkte Frage für WhatsApp ausfüllen</span>
            <ArrowRight size={15} className="shrink-0 sm:ml-auto transition-transform group-hover:translate-x-0.5" />
          </button>
          <a
            href={business.phoneHref}
            className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.1] hover:border-accent-light/40 px-3.5 py-2.5 text-center text-xs font-semibold text-white/85 transition-colors"
          >
            <Phone size={13} className="text-accent-light shrink-0" />
            <span>Direkt anrufen: <strong className="text-white tabular-nums">{business.phoneDisplay}</strong> · {business.city} &amp; Umgebung</span>
          </a>
        </div>
      </div>
    </section>
  );
}
