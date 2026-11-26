import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Clock, Mail, MapPin, Phone, Quote } from "lucide-react";
import {
  business,
  emailHref,
  googleRating,
  inquiryDevices,
  inquiryTopics,
  publicReviews,
  siteImages,
  whatsappLink,
  yearsOfExperience,
} from "../content";
import { ContactBlock } from "./Home";
import {
  ButtonLink,
  CallButton,
  Container,
  PageHeader,
  Picture,
  RatingBadge,
  Section,
  SectionHeading,
  Stars,
  WhatsAppButton,
  WhatsAppIcon,
  cx,
} from "../ui";

/* ───────────────────────── Über uns ───────────────────────── */

export function AboutPage() {
  const values = [
    { title: "Ehrlich", text: "Sie erfahren offen, ob sich ein Ersatzteil lohnt – oder ob ein anderes Gerät die bessere Wahl ist." },
    { title: "Persönlich", text: "Kein Callcenter: Sie sprechen immer direkt mit dem Inhaber." },
    { title: "Erfahren", text: `${yearsOfExperience} Jahre Erfahrung mit Hausgeräten aller gängigen Marken.` },
  ];
  const facts = [
    { k: String(business.founded), v: "gegründet in Osnabrück" },
    { k: `${googleRating.value.toLocaleString("de-DE")} ★`, v: `bei ${googleRating.count} Google-Bewertungen` },
    { k: "16+", v: "Marken im Ersatzteil-Sortiment" },
  ];

  return (
    <>
      <PageHeader eyebrow="Über uns" title={`Seit ${business.founded} Ihr Ansprechpartner für Hausgeräte in Osnabrück`} />
      <Section>
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div className="mx-auto w-full max-w-sm lg:max-w-none">
            <div className="overflow-hidden rounded-2xl bg-sand">
              <Picture
                image={siteImages.inhaber}
                priority
                sizes="(max-width: 1024px) 80vw, 440px"
                className="aspect-[4/5] w-full object-cover object-top"
              />
            </div>
            <p className="mt-4 text-center text-base text-ink-soft lg:text-left">
              <strong className="text-ink">{business.owner}</strong>, Inhaber
            </p>
          </div>
          <div className="space-y-5 text-lg leading-relaxed text-ink-soft">
            <p>
              Was {business.founded} als kleines Geschäft begann, ist heute für viele Osnabrückerinnen und Osnabrücker
              die erste Adresse, wenn es um Hausgeräte und Ersatzteile geht. Viele Kundinnen und Kunden kommen seit
              Jahrzehnten – und schicken Familie, Freunde und Nachbarn.
            </p>
            <p>
              Wir besorgen Original- und Qualitäts-Ersatzteile für alle gängigen Marken, verkaufen geprüfte
              Markengeräte mit schriftlicher Garantie und kaufen gut erhaltene Geräte an.
            </p>
            <p>
              Was uns wichtig ist: dass Sie verstanden werden, ehrlich beraten werden und am Ende das bekommen, was zu
              Ihrem Gerät und Ihrem Budget passt.
            </p>

            <dl className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-3">
              {facts.map((f) => (
                <div key={f.v} className="rounded-2xl border border-line bg-sand px-5 py-5">
                  <dt className="sr-only">{f.v}</dt>
                  <dd>
                    <span className="block text-3xl font-bold text-ink">{f.k}</span>
                    <span className="mt-1 block text-base text-ink-soft">{f.v}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Section>

      <Section tone="muted">
        <SectionHeading eyebrow="Unsere Grundsätze" title="Worauf Sie sich verlassen können" />
        <div className="grid gap-5 md:grid-cols-3">
          {values.map((v) => (
            <div key={v.title} className="rounded-2xl border border-line bg-white p-6">
              <h3 className="text-xl font-bold text-ink">{v.title}</h3>
              <p className="mt-2 text-base leading-relaxed text-ink-soft">{v.text}</p>
            </div>
          ))}
        </div>
      </Section>
      <ContactBlock />
    </>
  );
}

/* ───────────────────────── Bewertungen ───────────────────────── */

export function ReviewsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Bewertungen"
        title="Das sagen unsere Kundinnen und Kunden"
        intro="Auszüge aus öffentlichen Bewertungen auf Google Maps. Alle Bewertungen finden Sie direkt bei Google."
      />
      <Section>
        <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-line bg-sand p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-4xl font-bold text-ink">
              {googleRating.value.toLocaleString("de-DE", { minimumFractionDigits: 1 })}
              <span className="text-xl font-semibold text-ink-soft"> / 5</span>
            </p>
            <div className="mt-1 flex items-center gap-2 text-base text-ink-soft">
              <Stars className="h-5 w-5" /> {googleRating.count} Bewertungen bei Google
            </div>
          </div>
          <div className="grid gap-3 sm:flex">
            <ButtonLink href={business.mapsReviewsUrl} variant="primary">
              Alle auf Google lesen
            </ButtonLink>
            <ButtonLink href={business.mapsWriteReviewUrl} variant="outline">
              Bewertung schreiben
            </ButtonLink>
          </div>
        </div>
        <div className="columns-1 gap-5 md:columns-2 lg:columns-3">
          {publicReviews.map((r) => (
            <figure key={r.id} className="mb-5 break-inside-avoid rounded-2xl border border-line bg-white p-6">
              <Quote className="h-6 w-6 text-line-strong" aria-hidden="true" />
              <blockquote className="mt-3 text-[1.05rem] leading-relaxed text-ink">„{r.text}“</blockquote>
              <figcaption className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
                <span className="font-semibold text-ink">{r.author}</span>
                <Stars />
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>
      <ContactBlock />
    </>
  );
}

/* ───────────────────────── Kontakt & Anfrage ───────────────────────── */

type FormState = {
  topic: (typeof inquiryTopics)[number];
  device: string;
  brand: string;
  enr: string;
  message: string;
  name: string;
  phone: string;
};

function buildMessage(f: FormState): string {
  const lines = [
    "Guten Tag Herr Hannachi,",
    "",
    `Anliegen: ${f.topic}`,
    f.device ? `Gerät: ${f.device}` : null,
    f.brand.trim() ? `Marke: ${f.brand.trim()}` : null,
    f.enr.trim() ? `E-Nr. / Modell: ${f.enr.trim()}` : null,
    "",
    f.message.trim(),
    "",
    f.name.trim() ? `Name: ${f.name.trim()}` : null,
    f.phone.trim() ? `Rückruf unter: ${f.phone.trim()}` : null,
  ];
  return lines
    .filter((l): l is string => l !== null)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const inputClass =
  "block w-full rounded-xl border border-line-strong bg-white px-4 py-3.5 text-base text-ink placeholder:text-ink-soft/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25";

function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; children: React.ReactNode; htmlFor: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-base font-semibold text-ink">
        {label} {hint && <span className="font-normal text-ink-soft">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

export function InquiryForm({ initialTopic }: { initialTopic?: string }) {
  const startTopic = (inquiryTopics as readonly string[]).includes(initialTopic ?? "")
    ? (initialTopic as FormState["topic"])
    : "Ersatzteil";
  const [f, setF] = useState<FormState>({
    topic: startTopic,
    device: "",
    brand: "",
    enr: "",
    message: "",
    name: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((prev) => ({ ...prev, [k]: v }));

  const validate = () => {
    if (f.message.trim().length < 5 && !f.enr.trim()) {
      setError("Bitte beschreiben Sie kurz Ihr Anliegen oder geben Sie die E-Nr. an.");
      return false;
    }
    setError("");
    return true;
  };

  const sendWhatsApp = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    window.open(whatsappLink(buildMessage(f)), "_blank", "noopener,noreferrer");
  };

  const sendEmail = () => {
    if (!validate()) return;
    const subject = `Anfrage: ${f.topic}${f.device ? ` – ${f.device}` : ""}`;
    window.location.href = `${emailHref}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildMessage(f))}`;
  };

  return (
    <form onSubmit={sendWhatsApp} noValidate className="rounded-2xl border border-line bg-white p-5 sm:p-8">
      <fieldset>
        <legend className="mb-3 text-base font-semibold text-ink">Worum geht es?</legend>
        <div className="grid grid-cols-2 gap-2.5">
          {inquiryTopics.map((t) => (
            <label
              key={t}
              className={cx(
                "flex min-h-[52px] cursor-pointer items-center justify-center rounded-xl border px-3 text-center text-[0.95rem] font-semibold transition-colors",
                f.topic === t ? "border-ink bg-ink text-white" : "border-line-strong bg-white text-ink hover:border-ink"
              )}
            >
              <input
                type="radio"
                name="topic"
                value={t}
                checked={f.topic === t}
                onChange={() => set("topic", t)}
                className="sr-only"
              />
              {t}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label="Gerät" htmlFor="f-device">
          <select id="f-device" value={f.device} onChange={(e) => set("device", e.target.value)} className={inputClass}>
            <option value="">Bitte wählen</option>
            {inquiryDevices.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </Field>
        <Field label="Marke" hint="optional" htmlFor="f-brand">
          <input id="f-brand" value={f.brand} onChange={(e) => set("brand", e.target.value)} placeholder="z. B. Bosch" className={inputClass} autoComplete="off" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="E-Nr. / Modellnummer" hint="vom Typenschild" htmlFor="f-enr">
            <input id="f-enr" value={f.enr} onChange={(e) => set("enr", e.target.value)} placeholder="z. B. WAN28160GB/01" className={inputClass} autoComplete="off" />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Ihre Nachricht" htmlFor="f-msg">
            <textarea
              id="f-msg"
              rows={4}
              value={f.message}
              onChange={(e) => set("message", e.target.value)}
              placeholder="Welches Teil oder Gerät suchen Sie?"
              className={inputClass}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "f-error" : undefined}
            />
          </Field>
        </div>
        <Field label="Name" hint="optional" htmlFor="f-name">
          <input id="f-name" value={f.name} onChange={(e) => set("name", e.target.value)} className={inputClass} autoComplete="name" />
        </Field>
        <Field label="Telefon für Rückruf" hint="optional" htmlFor="f-phone">
          <input id="f-phone" type="tel" inputMode="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} className={inputClass} autoComplete="tel" />
        </Field>
      </div>

      {error && (
        <p id="f-error" role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-base font-medium text-red-800">
          {error}
        </p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="submit"
          className="inline-flex min-h-[56px] items-center justify-center gap-2.5 rounded-xl bg-whatsapp px-6 text-base font-semibold text-white hover:bg-whatsapp-dark"
        >
          <WhatsAppIcon /> Per WhatsApp senden
        </button>
        <button
          type="button"
          onClick={sendEmail}
          className="inline-flex min-h-[56px] items-center justify-center gap-2.5 rounded-xl border border-line-strong bg-white px-6 text-base font-semibold text-ink hover:border-ink"
        >
          <Mail className="h-5 w-5" aria-hidden="true" /> Per E-Mail senden
        </button>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-ink-soft">
        Ihre Angaben werden nicht auf dieser Website gespeichert. Beim Senden öffnet sich WhatsApp (Anbieter: WhatsApp
        Ireland Ltd.) bzw. Ihr E-Mail-Programm mit der vorbereiteten Nachricht. Mehr dazu in der{" "}
        <Link href="/datenschutz" className="underline underline-offset-4 hover:text-ink">
          Datenschutzerklärung
        </Link>
        .
      </p>
    </form>
  );
}

export function ContactPage({ searchParams }: { searchParams?: Record<string, string> }) {
  return (
    <>
      <PageHeader
        eyebrow="Kontakt"
        title="Wir sind persönlich für Sie da"
        intro="Rufen Sie an, schreiben Sie per WhatsApp oder nutzen Sie das Formular. Besuche bitte nach kurzer Terminabsprache."
      />
      <Section>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <div className="space-y-6">
            <div className="grid gap-3">
              <WhatsAppButton />
              <CallButton />
            </div>
            <ul className="divide-y divide-line rounded-2xl border border-line bg-sand">
              <li className="flex gap-4 p-5">
                <MapPin className="mt-0.5 h-6 w-6 shrink-0 text-brand" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-ink">Adresse</p>
                  <p className="text-base text-ink-soft">
                    {business.street}
                    <br />
                    {business.zip} {business.city}
                  </p>
                  <a
                    href={business.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block font-semibold text-brand underline underline-offset-4"
                  >
                    Route planen
                  </a>
                </div>
              </li>
              <li className="flex gap-4 p-5">
                <Clock className="mt-0.5 h-6 w-6 shrink-0 text-brand" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-ink">Erreichbarkeit</p>
                  <p className="text-base text-ink-soft">
                    Montag – Samstag, 08:00 – 18:00 Uhr
                    <br />
                    Besuche nach Terminvereinbarung
                  </p>
                </div>
              </li>
              <li className="flex gap-4 p-5">
                <Phone className="mt-0.5 h-6 w-6 shrink-0 text-brand" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-ink">Telefon &amp; WhatsApp</p>
                  <a href={business.phoneHref} className="text-base text-ink-soft hover:text-ink">
                    {business.phoneDisplay}
                  </a>
                </div>
              </li>
              <li className="flex gap-4 p-5">
                <Mail className="mt-0.5 h-6 w-6 shrink-0 text-brand" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-ink">E-Mail</p>
                  <a href={emailHref} className="break-all text-base text-ink-soft hover:text-ink">
                    {business.email}
                  </a>
                </div>
              </li>
            </ul>
            <RatingBadge />
          </div>

          <div id="anfrage">
            <h2 className="mb-5 text-2xl font-bold text-ink">Anfrage stellen</h2>
            <InquiryForm initialTopic={searchParams?.thema} />
          </div>
        </div>
      </Section>
    </>
  );
}

/* ───────────────────────── 404 ───────────────────────── */

export function NotFoundPage() {
  return (
    <Container className="py-24 text-center">
      <p className="text-6xl font-bold text-line-strong">404</p>
      <h1 className="mt-4 text-3xl font-bold text-ink">Seite nicht gefunden</h1>
      <p className="mt-3 text-lg text-ink-soft">Die aufgerufene Seite existiert nicht oder wurde verschoben.</p>
      <div className="mt-8 flex justify-center">
        <ButtonLink href="/">Zur Startseite</ButtonLink>
      </div>
    </Container>
  );
}
