"use client";
import {
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Clock3, MessageCircle, Quote, Star } from "lucide-react";
import type { Review, Service } from "@/data/site";
import { serviceIcons } from "./Illustrations";
import { ApplianceGraphic } from "./AnimatedAppliances";
import { ServiceCardSkeleton } from "./Skeletons";
import { HeroAnimatedBackdrop } from "./HeroAnimatedBackdrop";
import { Spatial3DCard, RevealText } from "./animations";

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
  const prefersReduced = useReducedMotion();
  return (
    <section className="relative overflow-hidden bg-primary-dark text-white border-b border-white/10">
      <HeroAnimatedBackdrop variant="subpage-header" seedKey={title} />

      <div className="container-page relative z-10 py-9 sm:py-14 lg:py-16">
        {readTime && (
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="mb-2.5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-accent-light"
          >
            <Clock3 size={13} className="shrink-0" aria-hidden="true" />
            <span>{readTime}</span>
          </motion.div>
        )}
        <div className="overflow-hidden pb-0.5">
          <h1 className="max-w-3xl text-2xl min-[375px]:text-[28px] sm:text-4xl lg:text-[42px] font-extrabold leading-[1.12] tracking-tight">
            <RevealText trigger="mount" delay={0.04} segments={[{ text: title }]} />
          </h1>
        </div>
        {intro && (
          <motion.p
            initial={prefersReduced ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.48, delay: 0.11, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3 sm:mt-4 max-w-2xl text-sm sm:text-base lg:text-lg leading-relaxed text-white/80"
          >
            {intro}
          </motion.p>
        )}
        <motion.div
          initial={prefersReduced ? false : { scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.54, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="origin-left mt-6 sm:mt-7 h-[2.5px] w-16 bg-gradient-to-r from-[#C92A42] via-[#64B5EC] to-accent-light rounded-full"
        />
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
  if (loading) {
    return <ServiceCardSkeleton />;
  }

  const Icon = serviceIcons[service.slug];
  return (
    <Spatial3DCard maxTilt={5.5} className="rounded-2xl">
      <Link
        href={`/leistungen/${service.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-card transition-shadow duration-300 hover:shadow-card-hover"
      >
        <div className="relative flex aspect-[4/3] items-center justify-center bg-navy dark:bg-slate-950 p-4 overflow-hidden border-b border-primary/8 dark:border-white/10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(14,165,233,0.16),transparent_70%)] opacity-80 group-hover:opacity-100 transition-opacity duration-300"
          />
          <div className="relative z-10 scale-95 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-108">
            <ApplianceGraphic slug={service.slug} size="sm" />
          </div>
        </div>
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-accent shrink-0" aria-hidden="true" />
            <h3 className="text-lg font-bold text-primary dark:text-slate-100">{service.title}</h3>
          </div>
          <p className="mt-2 flex-1 text-[14px] leading-relaxed text-ink-muted">{service.short}</p>
          <span className="mt-4 inline-flex min-h-[44px] items-center justify-between rounded-xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-800/70 px-3.5 py-2 text-[13px] font-bold text-accent group-hover:border-accent/40 transition-colors">
            <span>Mehr erfahren</span>
            <ArrowRight size={15} className="transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </Spatial3DCard>
  );
}

export function ReviewCard({ review, large = false }: { review: Review; large?: boolean }) {
  const starCount = review.rating ?? 5;
  const [showEn, setShowEn] = useState(false);

  const cardAriaLabel = [
    `Google-Bewertung von ${review.author}`,
    review.localGuide || undefined,
    `${starCount} von 5 Sternen`,
    review.relativeTime || undefined,
    review.serviceTag || undefined,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <figure
      role="article"
      aria-label={cardAriaLabel}
      className="card flex h-full flex-col p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5" role="img" aria-label={`${starCount} von 5 Sternen`}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                size={14}
                aria-hidden="true"
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
      <blockquote
        dir="auto"
        className={`flex-1 leading-relaxed text-primary dark:text-slate-100 ${large ? "text-base sm:text-lg" : "text-[15px]"}`}
      >
        <Quote size={18} className="mb-2 text-accent/40" aria-hidden="true" />
        {showEn && review.textEn ? (
          <span key="rev-en">{review.textEn}</span>
        ) : (
          <span key="rev-de">{review.text}</span>
        )}
      </blockquote>
      {review.textEn && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-faint">
          <span key={showEn ? "lbl-en" : "lbl-de"}>
            {showEn ? (
              <>
                Übersetzt von <span translate="no" className="notranslate">Google</span> (Englisch)
              </>
            ) : (
              "Original (Deutsch)"
            )}
          </span>
          <span>·</span>
          <button
            type="button"
            aria-pressed={showEn}
            aria-label={`Sprache der Bewertung von ${review.author} umschalten`}
            onClick={() => setShowEn((prev) => !prev)}
            className="inline-flex min-h-[44px] items-center px-1 font-semibold text-accent hover:underline cursor-pointer"
          >
            <span key={showEn ? "btn-de" : "btn-en"}>
              {showEn ? "Original (Deutsch) ansehen" : "Englische Übersetzung"}
            </span>
          </button>
        </div>
      )}
      {review.ownerReply && (
        <div
          aria-label="Antwort vom Inhaber Kamal Hannachi"
          className="mt-4 rounded-xl bg-surface dark:bg-slate-800/80 border border-primary/8 dark:border-white/10 px-3.5 py-2.5 text-xs"
        >
          <p className="font-bold text-primary dark:text-slate-100 mb-0.5">
            Antwort vom Inhaber · <span translate="no" className="notranslate">Kamal Hannachi</span>
          </p>
          <p dir="auto" className="text-ink-muted leading-relaxed">{review.ownerReply}</p>
        </div>
      )}
      <figcaption className="mt-5 border-t border-primary/8 dark:border-white/10 pt-4 text-sm flex items-center justify-between gap-2">
        <div>
          <span translate="no" className="notranslate font-semibold text-primary dark:text-slate-100">
            {review.author}
          </span>
          <span className="block text-ink-faint text-xs mt-0.5">
            {review.localGuide ? `${review.localGuide} · ` : ""}
            {review.relativeTime ? (
              <>
                {review.relativeTime} auf{" "}
                <span translate="no" className="notranslate">Google Maps</span>
              </>
            ) : (
              <>
                <span translate="no" className="notranslate">Google Maps</span>-Rezension
              </>
            )}
          </span>
        </div>
      </figcaption>
    </figure>
  );
}
