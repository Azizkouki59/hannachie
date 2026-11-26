import Link from "next/link";
import { ArrowRight, Check, ChevronDown, Clock, MapPin, Phone, Quote } from "lucide-react";
import {
  brandList,
  business,
  faqs,
  featuredReviewIds,
  offers,
  publicReviews,
  siteImages,
  steps,
  whatsappLink,
  yearsOfExperience,
} from "../content";
import {
  ButtonLink,
  CallButton,
  Container,
  Picture,
  RatingBadge,
  Section,
  SectionHeading,
  Stars,
  WhatsAppButton,
} from "../ui";

function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <Container className="grid items-center gap-10 pb-12 pt-6 sm:pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:pb-20 lg:pt-14">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-sand px-3.5 py-1.5 text-sm font-semibold text-ink">
            <span className="h-2 w-2 rounded-full bg-brand" aria-hidden="true" />
            Seit {business.founded} in Osnabrück
          </p>
          <h1 className="mt-5 text-[2.15rem] leading-[1.12] font-bold text-ink sm:text-5xl lg:text-[3.4rem]">
            Das passende Ersatzteil für Ihr Hausgerät.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft sm:text-xl">
            Original-Ersatzteile nach Typenschild, geprüfte Markengeräte mit Garantie und ehrliche Beratung –
            persönlich von Inhaber {business.owner}.
          </p>

          <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
            <WhatsAppButton label="Per WhatsApp anfragen" className="sm:px-7" />
            <CallButton className="sm:px-7" />
          </div>

          <RatingBadge className="mt-6" />
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="overflow-hidden rounded-2xl bg-sand aspect-[4/5] sm:aspect-[4/4.4]">
            <Picture
              image={siteImages.inhaber}
              priority
              sizes="(max-width: 1024px) 90vw, 480px"
              className="h-full w-full object-cover object-top"
            />
          </div>
          <div className="absolute -bottom-5 left-4 right-4 sm:left-6 sm:right-auto rounded-xl border border-line bg-white px-5 py-4 shadow-lg">
            <p className="text-base font-bold text-ink">{business.owner}</p>
            <p className="text-sm text-ink-soft">Inhaber · {yearsOfExperience} Jahre Erfahrung</p>
          </div>
        </div>
      </Container>
    </section>
  );
}

function TrustStrip() {
  const items = [
    `${yearsOfExperience} Jahre Erfahrung`,
    "Originalteile aller gängigen Marken",
    "Schriftliche Garantie auf Geräte",
    "Persönlicher Ansprechpartner",
  ];
  return (
    <div className="border-y border-line bg-sand">
      <Container className="py-5">
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {items.map((t) => (
            <li key={t} className="flex items-center gap-3 text-base font-medium text-ink">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-brand">
                <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
              </span>
              {t}
            </li>
          ))}
        </ul>
      </Container>
    </div>
  );
}

function Offers() {
  return (
    <Section id="angebot">
      <SectionHeading
        eyebrow="Unser Angebot"
        title="Ersatzteile, Geräte und Ankauf – alles aus einer Hand"
        intro="Sie sprechen immer direkt mit dem Inhaber. Kurze Wege, klare Preise, ehrliche Auskunft."
      />
      <div className="grid gap-6 md:grid-cols-3">
        {offers.map((o) => (
          <article key={o.id} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white">
            <div className="aspect-[16/10] overflow-hidden bg-sand">
              <Picture
                image={siteImages[o.image]}
                sizes="(max-width: 768px) 100vw, 33vw"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-1 flex-col p-6">
              <h3 className="text-xl font-bold text-ink">{o.title}</h3>
              <p className="mt-3 flex-1 text-base leading-relaxed text-ink-soft">{o.text}</p>
              <a
                href={whatsappLink(`Guten Tag Herr Hannachi, meine Anfrage: ${o.topic}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex min-h-[44px] items-center gap-2 self-start font-semibold text-brand hover:text-brand-dark"
              >
                {o.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}

function HowItWorks() {
  return (
    <Section tone="muted" id="so-gehts">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 lg:items-center">
        <div>
          <SectionHeading
            eyebrow="So einfach geht's"
            title="In drei Schritten zum richtigen Teil"
            intro="Die E-Nr. vom Typenschild ist der Schlüssel: Damit finden wir das Teil, das genau zu Ihrem Gerät passt."
          />
          <ol className="space-y-6">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-base font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-ink">{s.title}</h3>
                  <p className="mt-1 text-base leading-relaxed text-ink-soft">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <WhatsAppButton
            label="Typenschild-Foto senden"
            text="Guten Tag Herr Hannachi, ich suche ein Ersatzteil. Anbei das Foto vom Typenschild:"
            className="mt-8 w-full sm:w-auto"
          />
        </div>
        <figure className="overflow-hidden rounded-2xl border border-line bg-white">
          <Picture
            image={siteImages.typenschild}
            sizes="(max-width: 1024px) 100vw, 560px"
            className="aspect-[4/3] w-full object-cover"
          />
          <figcaption className="px-5 py-4 text-sm text-ink-soft">
            So sieht ein gut lesbares Typenschild aus: scharf, ohne Blitz-Reflexion, alle Nummern sichtbar.
          </figcaption>
        </figure>
      </div>
    </Section>
  );
}

function Reviews() {
  const featured = featuredReviewIds
    .map((id) => publicReviews.find((r) => r.id === id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));
  return (
    <Section id="bewertungen">
      <div className="mb-8 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading eyebrow="Kundenstimmen" title="Was unsere Kunden sagen" />
        <RatingBadge className="sm:mb-12" />
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {featured.map((r) => (
          <figure key={r.id} className="flex flex-col rounded-2xl border border-line bg-white p-6">
            <Quote className="h-7 w-7 text-line-strong" aria-hidden="true" />
            <blockquote className="mt-3 flex-1 text-[1.05rem] leading-relaxed text-ink">„{r.text}“</blockquote>
            <figcaption className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
              <span className="font-semibold text-ink">{r.author}</span>
              <Stars />
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/kundenbewertungen" variant="outline">
          Weitere Bewertungen
        </ButtonLink>
        <ButtonLink href={business.mapsReviewsUrl} variant="outline">
          Alle Bewertungen auf Google
        </ButtonLink>
      </div>
    </Section>
  );
}

function Brands() {
  return (
    <Section tone="muted" className="!py-12 sm:!py-14">
      <h2 className="text-center text-lg font-bold text-ink">Ersatzteile für alle gängigen Marken</h2>
      <ul className="mx-auto mt-6 flex max-w-4xl flex-wrap justify-center gap-2.5">
        {brandList.map((b) => (
          <li key={b} className="rounded-full border border-line bg-white px-4 py-2 text-base font-medium text-ink">
            {b}
          </li>
        ))}
      </ul>
      <p className="mx-auto mt-5 max-w-2xl text-center text-sm text-ink-soft">
        Markennamen dienen ausschließlich der Zuordnung passender Ersatzteile. Wir sind kein Vertragspartner der
        Hersteller.
      </p>
    </Section>
  );
}

function About() {
  return (
    <Section>
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16">
        <div className="w-full overflow-hidden rounded-2xl bg-sand">
          <Picture
            image={siteImages.kueche}
            sizes="(max-width: 1024px) 90vw, 440px"
            className="aspect-[4/3] w-full object-cover lg:aspect-[4/5]"
          />
        </div>
        <div>
          <SectionHeading eyebrow="Über uns" title={`Seit ${business.founded} eine feste Adresse in Osnabrück`} />
          <div className="space-y-4 text-lg leading-relaxed text-ink-soft">
            <p>
              Seit {business.founded} ist {business.owner} in Osnabrück der Ansprechpartner für Hausgeräte und
              Ersatzteile. Viele Kundinnen und Kunden kommen seit Jahrzehnten – und empfehlen uns weiter.
            </p>
            <p>
              Unser Anspruch ist einfach: ehrliche Auskunft, faire Preise und das Teil, das wirklich passt. Wenn sich ein
              Ersatzteil nicht mehr lohnt, sagen wir Ihnen das offen.
            </p>
          </div>
          <Link
            href="/ueber-uns"
            className="mt-6 inline-flex min-h-[44px] items-center gap-2 font-semibold text-brand hover:text-brand-dark"
          >
            Mehr über uns <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </Section>
  );
}

export function FaqList({ items = faqs }: { items?: typeof faqs }) {
  return (
    <div className="divide-y divide-line rounded-2xl border border-line bg-white">
      {items.map((f) => (
        <details key={f.q} className="group">
          <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-lg font-semibold text-ink sm:px-6 [&::-webkit-details-marker]:hidden">
            {f.q}
            <ChevronDown
              className="h-5 w-5 shrink-0 text-ink-soft transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <p className="px-5 pb-5 text-base leading-relaxed text-ink-soft sm:px-6">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

function Faq() {
  return (
    <Section tone="muted" id="faq">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <SectionHeading
          eyebrow="Häufige Fragen"
          title="Gut zu wissen"
          intro="Ihre Frage ist nicht dabei? Rufen Sie einfach an oder schreiben Sie uns."
        />
        <FaqList />
      </div>
    </Section>
  );
}

export function ContactBlock() {
  return (
    <section className="bg-ink text-white">
      <Container className="py-14 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-[1.75rem] font-bold leading-tight sm:text-4xl">Fragen Sie einfach an.</h2>
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-white/80">
              Am schnellsten geht es per WhatsApp mit einem Foto vom Typenschild. Sie erhalten zeitnah eine persönliche
              Antwort.
            </p>
            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <WhatsAppButton />
              <CallButton variant="ghost-light" />
            </div>
          </div>
          <ul className="grid gap-4 self-center text-lg">
            <li className="flex gap-4">
              <MapPin className="mt-1 h-6 w-6 shrink-0 text-white/60" aria-hidden="true" />
              <div>
                <p className="font-semibold">
                  {business.street}, {business.zip} {business.city}
                </p>
                <a
                  href={business.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base text-white/70 underline underline-offset-4 hover:text-white"
                >
                  Route in Google Maps öffnen
                </a>
              </div>
            </li>
            <li className="flex gap-4">
              <Clock className="mt-1 h-6 w-6 shrink-0 text-white/60" aria-hidden="true" />
              <div>
                <p className="font-semibold">Mo–Sa 08:00–18:00 Uhr</p>
                <p className="text-base text-white/70">Besuch bitte nach Terminabsprache</p>
              </div>
            </li>
            <li className="flex gap-4">
              <Phone className="mt-1 h-6 w-6 shrink-0 text-white/60" aria-hidden="true" />
              <div>
                <a href={business.phoneHref} className="font-semibold hover:underline underline-offset-4">
                  {business.phoneDisplay}
                </a>
                <p className="text-base text-white/70">Telefon &amp; WhatsApp</p>
              </div>
            </li>
          </ul>
        </div>
      </Container>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <Offers />
      <HowItWorks />
      <Reviews />
      <Brands />
      <About />
      <Faq />
      <ContactBlock />
    </>
  );
}
