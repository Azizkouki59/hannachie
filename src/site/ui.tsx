import React from "react";
import Link from "next/link";
import { Phone, Star } from "lucide-react";
import { business, defaultWhatsappText, googleRating, whatsappLink, type SiteImage } from "./content";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cx("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

export function Section({
  id,
  className,
  children,
  tone = "default",
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
  tone?: "default" | "muted" | "dark";
}) {
  return (
    <section
      id={id}
      className={cx(
        "py-14 sm:py-20",
        tone === "muted" && "bg-sand",
        tone === "dark" && "bg-ink text-white",
        className
      )}
    >
      <Container>{children}</Container>
    </section>
  );
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cx("text-sm font-semibold uppercase tracking-[0.14em] text-brand", className)}>{children}</p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cx("mb-8 sm:mb-12 max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
      <h2 className="text-[1.75rem] leading-tight sm:text-4xl font-bold text-ink">{title}</h2>
      {intro && <p className="mt-4 text-lg leading-relaxed text-ink-soft">{intro}</p>}
    </div>
  );
}

export function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47 0 1.46 1.06 2.87 1.21 3.07.15.2 2.09 3.2 5.07 4.48.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.94.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43a9.4 9.4 0 0 1 6.67 2.77 9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.23 9.43-9.44 9.43m8.03-17.46A11.27 11.27 0 0 0 12.05.72C5.8.72.7 5.8.7 12.07c0 2 .52 3.95 1.52 5.67L.6 23.62l6.02-1.58a11.3 11.3 0 0 0 5.42 1.38h.01c6.26 0 11.35-5.09 11.35-11.35 0-3.03-1.18-5.88-3.32-8.03" />
    </svg>
  );
}

type ButtonVariant = "primary" | "whatsapp" | "outline" | "ghost-light";

const buttonStyles: Record<ButtonVariant, string> = {
  primary: "bg-ink text-white hover:bg-ink-2 shadow-sm",
  whatsapp: "bg-whatsapp text-white hover:bg-whatsapp-dark shadow-sm",
  outline: "border border-line-strong bg-white text-ink hover:border-ink hover:bg-sand",
  "ghost-light": "border border-white/30 text-white hover:bg-white/10",
};

export function ButtonLink({
  href,
  variant = "primary",
  className,
  children,
  external,
  ...rest
}: {
  href: string;
  variant?: ButtonVariant;
  className?: string;
  children: React.ReactNode;
  external?: boolean;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const classes = cx(
    "inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-xl px-6 text-base font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
    buttonStyles[variant],
    className
  );
  const isInternal = href.startsWith("/") && !external;
  if (isInternal) {
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }
  const isWeb = href.startsWith("http");
  return (
    <a
      href={href}
      className={classes}
      {...(isWeb ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...rest}
    >
      {children}
    </a>
  );
}

export function WhatsAppButton({
  text = defaultWhatsappText,
  label = "Per WhatsApp schreiben",
  className,
}: {
  text?: string;
  label?: string;
  className?: string;
}) {
  return (
    <ButtonLink href={whatsappLink(text)} variant="whatsapp" className={className}>
      <WhatsAppIcon />
      {label}
    </ButtonLink>
  );
}

export function CallButton({ className, variant = "outline" }: { className?: string; variant?: ButtonVariant }) {
  return (
    <ButtonLink href={business.phoneHref} variant={variant} className={className}>
      <Phone className="h-5 w-5" aria-hidden="true" />
      {business.phoneDisplay}
    </ButtonLink>
  );
}

export function Stars({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <span className="inline-flex gap-0.5 text-gold" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={className} fill="currentColor" strokeWidth={0} />
      ))}
    </span>
  );
}

export function RatingBadge({ className, light }: { className?: string; light?: boolean }) {
  return (
    <a
      href={business.mapsReviewsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cx(
        "inline-flex items-center gap-2 text-sm font-medium hover:underline underline-offset-4",
        light ? "text-white/90" : "text-ink-soft",
        className
      )}
    >
      <Stars />
      <span>
        <strong className={light ? "text-white" : "text-ink"}>
          {googleRating.value.toLocaleString("de-DE", { minimumFractionDigits: 1 })}
        </strong>{" "}
        bei Google · {googleRating.count} Bewertungen
      </span>
    </a>
  );
}

export function Picture({
  image,
  className,
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority,
}: {
  image: SiteImage;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const fullW = image.width;
  return (
    <img
      src={image.webpFull}
      srcSet={`${image.webp640} 640w, ${image.webpFull} ${fullW}w`}
      sizes={sizes}
      width={image.width}
      height={image.height}
      alt={image.alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      {...(priority ? { fetchPriority: "high" as const } : {})}
      className={className}
    />
  );
}

export function PageHeader({ eyebrow, title, intro }: { eyebrow?: string; title: string; intro?: string }) {
  return (
    <div className="border-b border-line bg-sand">
      <Container className="py-10 sm:py-16">
        {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
        <h1 className="max-w-3xl text-[2rem] leading-[1.15] sm:text-5xl font-bold text-ink">{title}</h1>
        {intro && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">{intro}</p>}
      </Container>
    </div>
  );
}
