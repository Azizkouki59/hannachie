"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock3, Quote, Star } from "lucide-react";
import type { Review, Service } from "@/data/site";
import { serviceIcons } from "./Illustrations";
import { ApplianceGraphic } from "./AnimatedAppliances";
import { ServiceCardSkeleton } from "./Skeletons";

export function SectionHeading({
  title,
  subtitle,
  light = false,
  className = "",
}: {
  title: string;
  subtitle?: string;
  light?: boolean;
  className?: string;
}) {
  return (
    <div className={`max-w-2xl ${className}`}>
      <h2 className={`text-2xl font-extrabold leading-[1.12] sm:text-4xl lg:text-[44px] ${light ? "text-white" : "text-primary dark:text-slate-100"}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-3 sm:mt-4 text-base sm:text-lg leading-relaxed ${light ? "text-white/70" : "text-ink-muted"}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function PageHeader({
  title,
  intro,
  readTime,
}: {
  title: string;
  intro?: string;
  readTime?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-hero-gradient text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }}
      />
      <div aria-hidden className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
      <div className="container-page relative py-10 sm:py-16 lg:py-24">
        {readTime && (
          <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-accent-light backdrop-blur-sm">
            <Clock3 size={14} className="shrink-0 text-accent-light" aria-hidden="true" />
            <span>{readTime}</span>
          </div>
        )}
        <h1 className="max-w-3xl text-[28px] sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-[1.08]">{title}</h1>
        {intro && <p className="mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-white/70">{intro}</p>}
        <div className="mt-6 sm:mt-10 h-1 w-16 rounded-full bg-accent" />
      </div>
    </section>
  );
}

export function ServiceCard({
  service,
  loading = false,
}: {
  service: Service;
  loading?: boolean;
}) {
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsHydrating(false), 180);
    return () => clearTimeout(timer);
  }, []);

  if (loading || isHydrating) {
    return <ServiceCardSkeleton />;
  }

  const Icon = serviceIcons[service.slug];
  return (
    <Link
      href={`/leistungen/${service.slug}`}
      className="card group flex flex-col overflow-hidden bg-white dark:bg-slate-900"
    >
      <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-slate-900 via-primary-dark to-slate-950 p-3 overflow-hidden border-b border-primary/10 dark:border-white/10">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.18)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative z-10 scale-95 transition-transform duration-300 group-hover:scale-105">
          <ApplianceGraphic slug={service.slug} size="sm" />
        </div>
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-20">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs backdrop-blur-md border border-white/10">
            <Icon className="h-3.5 w-3.5 text-accent" />
            {service.title}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-bold text-primary dark:text-slate-100">{service.title}</h3>
        <p className="mt-2 flex-1 text-[14px] leading-relaxed text-ink-muted">{service.short}</p>
        <span className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-accent">
          Mehr erfahren <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

export function ReviewCard({ review, large = false }: { review: Review; large?: boolean }) {
  const starCount = review.rating ?? 5;
  const [showEn, setShowEn] = useState(false);

  return (
    <figure className="card flex h-full flex-col p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5" aria-label={`${starCount} von 5 Sternen`}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                size={14}
                className={
                  i <= starCount
                    ? "fill-[#fbbc04] text-[#fbbc04]"
                    : "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700"
                }
              />
            ))}
          </div>
          {review.isNew && (
            <span className="inline-flex items-center rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-primary dark:text-slate-200">
              NEU
            </span>
          )}
        </div>
        {review.serviceTag && (
          <span className="text-[11px] font-semibold text-ink-muted">
            {review.serviceTag}
          </span>
        )}
      </div>
      <blockquote className={`flex-1 leading-relaxed text-primary dark:text-slate-100 ${large ? "text-base sm:text-lg" : "text-[15px]"}`}>
        <Quote size={18} className="mb-2 text-accent/40" aria-hidden />
        {showEn && review.textEn ? review.textEn : review.text}
      </blockquote>
      {review.textEn && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-faint">
          <span>{showEn ? "Übersetzt von Google (Englisch)" : "Original (Deutsch)"}</span>
          <span>·</span>
          <button
            type="button"
            onClick={() => setShowEn((prev) => !prev)}
            className="font-semibold text-accent hover:underline cursor-pointer"
          >
            {showEn ? "Original (Deutsch) ansehen" : "Englische Übersetzung"}
          </button>
        </div>
      )}
      {review.ownerReply && (
        <div className="mt-4 rounded-xl bg-surface dark:bg-slate-800/80 border border-primary/8 dark:border-white/10 px-3.5 py-2.5 text-xs">
          <p className="font-bold text-primary dark:text-slate-200 mb-0.5">
            Antwort vom Inhaber · Kamal Hannachi
          </p>
          <p className="text-ink-muted leading-relaxed">{review.ownerReply}</p>
        </div>
      )}
      <figcaption className="mt-5 border-t border-primary/8 dark:border-white/10 pt-4 text-sm flex items-center justify-between gap-2">
        <div>
          <span className="font-semibold text-primary dark:text-slate-100">{review.author}</span>
          <span className="block text-ink-faint text-xs mt-0.5">
            {review.localGuide ? `${review.localGuide} · ` : ""}
            {review.relativeTime ? `${review.relativeTime} auf Google Maps` : "Google-Maps-Rezension"}
          </span>
        </div>
      </figcaption>
    </figure>
  );
}
