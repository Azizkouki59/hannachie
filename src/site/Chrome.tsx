import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Mail, MapPin, Menu, Phone, X } from "lucide-react";
import { business, defaultWhatsappText, emailHref, navLinks, whatsappLink } from "./content";
import { Container, WhatsAppIcon, cx } from "./ui";

export function Logo({ light }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3 rounded-lg" aria-label="Hannachi – zur Startseite">
      <svg viewBox="0 0 40 40" className="h-10 w-10 shrink-0" aria-hidden="true">
        <rect width="40" height="40" rx="10" fill={light ? "#ffffff" : "#12233b"} />
        <path
          d="M12.5 11v18M27.5 11v18M12.5 20h15"
          stroke={light ? "#12233b" : "#ffffff"}
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <circle cx="31.5" cy="31.5" r="2.4" fill="#2fa3d6" />
      </svg>
      <span className="leading-none">
        <span className={cx("block text-xl font-bold tracking-tight", light ? "text-white" : "text-ink")}>
          Hannachi
        </span>
        <span className={cx("mt-1 block text-[0.8rem] font-medium", light ? "text-white/70" : "text-ink-soft")}>
          Hausgeräte &amp; Ersatzteile
        </span>
      </span>
    </Link>
  );
}

export function Header({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
    <header
      className={cx(
        "sticky top-0 z-40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85 transition-shadow",
        scrolled ? "shadow-[0_1px_0_0_var(--color-line)]" : ""
      )}
    >
      <a
        href="#inhalt"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
      >
        Zum Inhalt springen
      </a>
      <Container className="flex h-[68px] items-center justify-between gap-4 lg:h-20">
        <Logo />

        <nav aria-label="Hauptnavigation" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={isActive(l.href) ? "page" : undefined}
                  className={cx(
                    "rounded-lg px-4 py-2.5 text-[0.98rem] font-medium transition-colors",
                    isActive(l.href) ? "text-ink bg-sand" : "text-ink-soft hover:text-ink hover:bg-sand"
                  )}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={business.phoneHref}
            className="hidden lg:inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-ink px-5 text-[0.98rem] font-semibold text-white hover:bg-ink-2"
          >
            <Phone className="h-4.5 w-4.5" aria-hidden="true" />
            {business.phoneDisplay}
          </a>
          <a
            href={business.phoneHref}
            className="lg:hidden inline-flex h-12 w-12 items-center justify-center rounded-xl border border-line text-ink"
            aria-label={`Anrufen: ${business.phoneDisplay}`}
          >
            <Phone className="h-5 w-5" aria-hidden="true" />
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden inline-flex h-12 w-12 items-center justify-center rounded-xl bg-ink text-white"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Menü schließen" : "Menü öffnen"}
          >
            {open ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
          </button>
        </div>
      </Container>

    </header>
      {open && (
      <div
        id="mobile-menu"
        className="lg:hidden fixed inset-0 z-50 overflow-y-auto bg-white"
        role="dialog"
        aria-modal="true"
        aria-label="Menü"
      >
        <Container className="flex h-[68px] items-center justify-between border-b border-line">
          <Logo />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-ink text-white"
            aria-label="Menü schließen"
            autoFocus
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </Container>
        <Container className="py-4">
          <nav aria-label="Mobile Navigation">
            <ul className="divide-y divide-line">
              <li>
                <Link href="/" className="flex min-h-[60px] items-center text-xl font-semibold text-ink">
                  Startseite
                </Link>
              </li>
              {navLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={isActive(l.href) ? "page" : undefined}
                    className={cx(
                      "flex min-h-[60px] items-center text-xl font-semibold",
                      isActive(l.href) ? "text-brand" : "text-ink"
                    )}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-6 grid gap-3">
            <a
              href={whatsappLink(defaultWhatsappText)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[56px] items-center justify-center gap-2.5 rounded-xl bg-whatsapp text-lg font-semibold text-white"
            >
              <WhatsAppIcon /> Per WhatsApp schreiben
            </a>
            <a
              href={business.phoneHref}
              className="inline-flex min-h-[56px] items-center justify-center gap-2.5 rounded-xl border border-line-strong text-lg font-semibold text-ink"
            >
              <Phone className="h-5 w-5" aria-hidden="true" /> {business.phoneDisplay}
            </a>
          </div>
          <p className="mt-6 text-center text-base text-ink-soft">{business.hours}</p>
        </Container>
      </div>
    )}
    </>
  );
}

export function MobileActionBar() {
  return (
    <div
      className="lg:hidden fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur px-3 pt-2.5"
      style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto grid max-w-md grid-cols-2 gap-2.5">
        <a
          href={business.phoneHref}
          className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-line-strong bg-white text-base font-semibold text-ink active:bg-sand"
        >
          <Phone className="h-5 w-5" aria-hidden="true" /> Anrufen
        </a>
        <a
          href={whatsappLink(defaultWhatsappText)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-whatsapp text-base font-semibold text-white active:bg-whatsapp-dark"
        >
          <WhatsAppIcon /> WhatsApp
        </a>
      </div>
    </div>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/10 bg-ink text-white/80">
      <Container className="py-14 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2 max-w-sm">
            <Logo light />
            <p className="mt-5 text-base leading-relaxed">
              Original-Ersatzteile, geprüfte Markengeräte und persönliche Beratung – inhabergeführt in Osnabrück
              seit {business.founded}.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-white">Kontakt</h2>
            <ul className="mt-4 space-y-3 text-base">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-white/60" aria-hidden="true" />
                <a href={business.mapsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  {business.street}
                  <br />
                  {business.zip} {business.city}
                </a>
              </li>
              <li className="flex gap-3">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-white/60" aria-hidden="true" />
                <a href={business.phoneHref} className="hover:text-white">
                  {business.phoneDisplay}
                </a>
              </li>
              <li className="flex gap-3">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-white/60" aria-hidden="true" />
                <a href={emailHref} className="hover:text-white break-all">
                  {business.email}
                </a>
              </li>
              <li className="flex gap-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-white/60" aria-hidden="true" />
                <span>
                  Mo–Sa 08:00–18:00 Uhr
                  <br />
                  Termine nach Vereinbarung
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-white">Seiten</h2>
            <ul className="mt-4 space-y-3 text-base">
              {[{ href: "/", label: "Startseite" }, ...navLinks].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/15 pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} Hannachi · Inhaber {business.owner}
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            <li>
              <Link href="/impressum" className="hover:text-white">
                Impressum
              </Link>
            </li>
            <li>
              <Link href="/datenschutz" className="hover:text-white">
                Datenschutz
              </Link>
            </li>
          </ul>
        </div>
      </Container>
    </footer>
  );
}
