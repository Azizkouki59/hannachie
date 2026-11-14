"use client";
import { motion } from "framer-motion";
import { FadeUp, StaggerContainer, StaggerItem } from "./animations";
import { Search, MessageSquare, CalendarCheck } from "lucide-react";

const steps = [
  {
    icon: Search,
    step: "01",
    title: "Gerät & Marke nennen",
    text: "Waschmaschine, Geschirrspüler, Kühlschrank oder Backofen – wählen Sie Ihr Gerät und nennen Sie die Marke.",
    color: "from-blue-500 to-cyan-500",
    bg: "from-blue-500/12 to-cyan-500/12",
  },
  {
    icon: MessageSquare,
    step: "02",
    title: "Problem schildern",
    text: "Beschreiben Sie kurz, was passiert. Ein Foto vom Gerät oder Typenschild hilft uns, schneller zu helfen.",
    color: "from-violet-500 to-purple-500",
    bg: "from-violet-500/12 to-purple-500/12",
  },
  {
    icon: CalendarCheck,
    step: "03",
    title: "Persönliche Rückmeldung",
    text: "Herr Hannachi meldet sich bei Ihnen, gibt eine erste Einschätzung und vereinbart einen schnellen Termin.",
    color: "from-emerald-500 to-teal-500",
    bg: "from-emerald-500/12 to-teal-500/12",
  },
];

export default function HowItWorks() {
  return (
    <section className="section relative overflow-hidden bg-surface">
      {/* Subtle background pattern */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.025] dark:opacity-[0.05]"
        style={{ backgroundImage: "radial-gradient(circle, #38BDF8 1px, transparent 1px)", backgroundSize: "36px 36px" }}
      />

      <div className="container-page relative">
        <FadeUp>
          <div className="flex flex-col items-center text-center">
            <span className="eyebrow mb-3">So einfach geht&apos;s</span>
            <h2 className="max-w-2xl text-3xl font-extrabold leading-[1.1] text-primary dark:text-slate-100 sm:text-4xl lg:text-[44px]">
              In 3 Schritten zur Reparatur
            </h2>
            <p className="mt-4 max-w-xl text-lg text-ink-muted">
              Kein Formular-Dschungel. Einfach Kontakt aufnehmen und Herr Hannachi kümmert sich persönlich.
            </p>
          </div>
        </FadeUp>

        <StaggerContainer className="mt-16 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <StaggerItem key={s.step}>
              <motion.div
                whileHover={{ y: -6, transition: { duration: 0.3, ease: "easeOut" } }}
                className="group relative h-full"
              >
                {/* Connector line between cards (desktop only) */}
                {i < steps.length - 1 && (
                  <div
                    aria-hidden
                    className="absolute top-[2.75rem] left-[calc(100%+0.75rem)] right-0 hidden h-px w-6 md:block"
                    style={{ background: "linear-gradient(to right, rgba(14,165,233,.4), rgba(14,165,233,.05))" }}
                  />
                )}

                <div className="h-full rounded-2xl border border-primary/8 dark:border-white/10 bg-white dark:bg-slate-900 p-7 shadow-card transition-all duration-300 group-hover:border-accent/20 dark:group-hover:border-accent/40 group-hover:shadow-card-hover">
                  {/* Step number + icon */}
                  <div className="flex items-start gap-4">
                    {/* Icon circle */}
                    <div className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${s.bg}`}>
                      <s.icon size={22} className="text-accent" />
                      {/* Step badge */}
                      <span className={`absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br ${s.color} text-[11px] font-extrabold text-white shadow-sm`}>
                        {i + 1}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-[42px] font-black leading-none text-primary/5 dark:text-white/5 select-none">
                        {s.step}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="mt-5 text-[18px] font-bold leading-tight text-primary dark:text-slate-100">{s.title}</h3>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-ink-muted">{s.text}</p>

                  {/* Bottom accent line on hover */}
                  <div className={`mt-6 h-0.5 w-0 rounded-full bg-gradient-to-r ${s.color} transition-all duration-500 group-hover:w-full`} />
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
