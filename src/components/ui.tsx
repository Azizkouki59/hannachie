"use client";
import {
  useEffect,
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import Link from "next/link";
import { ArrowRight, Clock3, MessageCircle, Quote, Star } from "lucide-react";
import type { Review, Service } from "@/data/site";
import { serviceIcons } from "./Illustrations";
import { ApplianceGraphic } from "./AnimatedAppliances";
import { ServiceCardSkeleton } from "./Skeletons";

export type WhatsAppButtonVariant =
  | "hover-emerald"
  | "hover-outline-light"
  | "hover-outline"
  | "emerald";

export function WhatsAppHoverIcon({
  size = 17,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`whatsapp-hover-icon shrink-0 ${className}`.trim()}
      aria-hidden="true"
    >
      <MessageCircle size={size} />
    </span>
  );
}

type WhatsAppButtonBaseProps = {
  variant?: WhatsAppButtonVariant;
  iconSize?: number;
  showArrow?: boolean;
  children: ReactNode;
  className?: string;
  "data-testid"?: string;
};

type WhatsAppButtonAsLink = WhatsAppButtonBaseProps & {
  href: string;
  external?: boolean;
  onClick?: AnchorHTMLAttributes<HTMLAnchorElement>["onClick"];
};

type WhatsAppButtonAsButton = WhatsAppButtonBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className"> & {
    href?: undefined;
  };

export type WhatsAppButtonProps = WhatsAppButtonAsLink | WhatsAppButtonAsButton;

export function WhatsAppButton(props: WhatsAppButtonProps) {
  const {
    variant = "hover-emerald",
    iconSize = 17,
    showArrow = false,
    children,
    className = "",
  } = props;

  const variantClasses: Record<WhatsAppButtonVariant, string> = {
    "hover-emerald":
      "btn-whatsapp-hover group inline-flex min-h-[52px] sm:min-h-[48px] items-center justify-center gap-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-5 sm:px-6 py-3.5 text-sm sm:text-[15px] font-extrabold text-white shadow-lg shadow-emerald-600/25 cursor-pointer w-full sm:w-auto",
    "hover-outline-light":
      "btn-whatsapp-hover group inline-flex min-h-[52px] sm:min-h-[46px] items-center justify-center gap-2.5 rounded-2xl border border-emerald-400/35 bg-emerald-500/15 hover:bg-emerald-500/25 hover:border-emerald-400/60 px-5 sm:px-6 py-3.5 text-sm font-bold text-white backdrop-blur-xs cursor-pointer w-full sm:w-auto",
    "hover-outline":
      "btn-whatsapp-hover group inline-flex min-h-[48px] sm:min-h-[44px] items-center justify-center gap-2 rounded-xl border border-emerald-500/35 bg-emerald-500/10 hover:bg-emerald-500/18 hover:border-emerald-500/60 px-4 py-3 text-xs sm:text-sm font-extrabold text-emerald-700 dark:text-emerald-300 cursor-pointer",
    emerald:
      "inline-flex min-h-[52px] sm:min-h-[46px] items-center justify-center gap-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-5 py-3.5 text-sm font-extrabold text-white shadow-md transition-colors cursor-pointer w-full sm:w-auto",
  };

  const combinedClassName = `${variantClasses[variant]} ${className}`.trim();

  const content = (
    <>
      <WhatsAppHoverIcon
        size={iconSize}
        className={
          variant === "hover-outline-light"
            ? "text-emerald-300"
            : variant === "hover-outline"
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-white"
        }
      />
      <span>{children}</span>
      {showArrow && (
        <ArrowRight
          size={15}
          className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      )}
    </>
  );

  if ("href" in props && typeof props.href === "string") {
    const { href, external, onClick, "data-testid": testId } = props;
    if (external || href.startsWith("http")) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClick}
          data-testid={testId}
          data-variant={variant}
          className={combinedClassName}
        >
          {content}
        </a>
      );
    }
    return (
      <Link
        href={href}
        onClick={onClick}
        data-testid={testId}
        data-variant={variant}
        className={combinedClassName}
      >
        {content}
      </Link>
    );
  }

  const {
    variant: _v,
    iconSize: _i,
    showArrow: _a,
    children: _c,
    className: _cl,
    ...buttonRest
  } = props as WhatsAppButtonAsButton;

  return (
    <button
      type={buttonRest.type || "button"}
      data-variant={variant}
      className={combinedClassName}
      {...buttonRest}
    >
      {content}
    </button>
  );
}

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
      <h2 className={`text-2xl font-extrabold leading-[1.15] sm:text-3xl lg:text-[34px] ${light ? "text-white" : "text-primary dark:text-slate-100"}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-2.5 sm:mt-3 text-sm sm:text-base leading-relaxed ${light ? "text-white/75" : "text-ink-muted"}`}>
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
      <div className="container-page relative py-8 sm:py-11 lg:py-12">
        {readTime && (
          <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-accent-light backdrop-blur-sm">
            <Clock3 size={14} className="shrink-0 text-accent-light" aria-hidden="true" />
            <span>{readTime}</span>
          </div>
        )}
        <h1 className="max-w-3xl text-2xl sm:text-3xl lg:text-[38px] font-extrabold leading-[1.14]">{title}</h1>
        {intro && <p className="mt-2.5 sm:mt-3.5 max-w-2xl text-sm sm:text-base leading-relaxed text-white/75">{intro}</p>}
        <div className="mt-5 sm:mt-6 h-1 w-14 rounded-full bg-accent" />
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
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="text-lg font-bold text-primary dark:text-slate-100">{service.title}</h3>
        <p className="mt-2 flex-1 text-[14px] leading-relaxed text-ink-muted">{service.short}</p>
        <span className="mt-4 inline-flex min-h-[44px] items-center justify-between rounded-xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-800/70 px-3.5 py-2 text-[13px] font-extrabold text-accent group-hover:border-accent/40 transition-colors">
          <span>Mehr erfahren</span>
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
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
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-faint">
          <span>{showEn ? "Übersetzt von Google (Englisch)" : "Original (Deutsch)"}</span>
          <span>·</span>
          <button
            type="button"
            onClick={() => setShowEn((prev) => !prev)}
            className="inline-flex min-h-[44px] items-center px-1 font-semibold text-accent hover:underline cursor-pointer"
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
