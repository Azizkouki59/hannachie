import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import {
  allSupportedAppliancesForSite,
  services,
  serviceSlugToImage,
  siteImages,
  slugToPartsCategory,
  slugToSingular,
  sparePartsCategories,
  whatsappLink,
} from "../content";
import { ContactBlock, FaqList } from "./Home";
import { Container, PageHeader, Picture, Section, SectionHeading, WhatsAppButton, CallButton } from "../ui";

export default function SortimentPage() {
  return (
    <>
      <PageHeader
        eyebrow="Sortiment"
        title="Ersatzteile & Geräte für Ihren Haushalt"
        intro="Für Waschmaschinen, Geschirrspüler, Kühlgeräte, Backöfen und mehr. Nennen Sie uns die E-Nr. vom Typenschild – wir finden das passende Teil."
      />

      <Section>
        <div className="grid gap-6 sm:grid-cols-2">
          {services.map((s) => (
            <Link
              key={s.slug}
              href={`/leistungen/${s.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-colors hover:border-ink"
            >
              <div className="aspect-[16/9] overflow-hidden bg-sand">
                <Picture
                  image={siteImages[serviceSlugToImage[s.slug]]}
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h2 className="text-2xl font-bold text-ink">{s.title}</h2>
                <p className="mt-2 flex-1 text-base leading-relaxed text-ink-soft">{s.intro}</p>
                <span className="mt-5 inline-flex items-center gap-2 font-semibold text-brand">
                  Teile ansehen <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section tone="muted">
        <SectionHeading
          eyebrow="Weitere Geräte"
          title="Auch für diese Geräte besorgen wir Teile"
          intro="Die Übersicht ist nicht vollständig – fragen Sie gern nach, wenn Ihr Gerät nicht dabei ist."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {allSupportedAppliancesForSite.map((cat) => (
            <div key={cat.title} className="rounded-2xl border border-line bg-white p-6">
              <h3 className="text-lg font-bold text-ink">{cat.title}</h3>
              <ul className="mt-3 space-y-2">
                {cat.items.map((i) => (
                  <li key={i} className="flex gap-2.5 text-base text-ink-soft">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-brand" strokeWidth={3} aria-hidden="true" />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <ContactBlock />
    </>
  );
}

export function SortimentDetailPage({ slug }: { slug: string }) {
  const service = services.find((s) => s.slug === slug);
  if (!service) return null;
  const parts = sparePartsCategories.find((c) => c.appliance === slugToPartsCategory[slug]);
  const others = services.filter((s) => s.slug !== slug);
  const waText = `Guten Tag Herr Hannachi, ich suche ein Ersatzteil (Gerät: ${slugToSingular[slug] ?? service.title}). E-Nr.: `;

  return (
    <>
      <div className="border-b border-line bg-sand">
        <Container className="grid gap-8 py-10 sm:py-14 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div>
            <nav aria-label="Brotkrumen" className="mb-4 text-sm text-ink-soft">
              <Link href="/leistungen" className="hover:text-ink underline-offset-4 hover:underline">
                Sortiment
              </Link>{" "}
              / <span className="text-ink">{service.title}</span>
            </nav>
            <h1 className="text-[2rem] leading-[1.15] font-bold text-ink sm:text-5xl">
              Ersatzteile für {service.title}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">{service.intro}</p>
            <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
              <WhatsAppButton label="Teil per WhatsApp anfragen" text={waText} />
              <CallButton />
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl bg-white">
            <Picture
              image={siteImages[serviceSlugToImage[slug]]}
              priority
              sizes="(max-width: 1024px) 100vw, 560px"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
        </Container>
      </div>

      {parts && (
        <Section>
          <SectionHeading
            title={`Häufig gefragte Teile – ${parts.category}`}
            intro="Original- und Qualitätsteile, passend zu Ihrer E-Nr. Preis und Verfügbarkeit nennen wir Ihnen vorab."
          />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {parts.parts.map((p) => (
              <li key={p} className="flex items-center gap-3 rounded-xl border border-line bg-white px-5 py-4 text-base font-medium text-ink">
                <Check className="h-5 w-5 shrink-0 text-brand" strokeWidth={2.5} aria-hidden="true" />
                {p}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-base text-ink-soft">
            Ihr Teil ist nicht dabei?{" "}
            <a
              href={whatsappLink(waText)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand underline underline-offset-4"
            >
              Fragen Sie einfach nach.
            </a>
          </p>
        </Section>
      )}

      {service.customerNote && (
        <Section tone="muted" className="!py-12">
          <figure className="mx-auto max-w-3xl text-center">
            <blockquote className="text-xl leading-relaxed text-ink sm:text-2xl">„{service.customerNote.quote}“</blockquote>
            <figcaption className="mt-4 text-base text-ink-soft">{service.customerNote.author}</figcaption>
          </figure>
        </Section>
      )}

      <Section>
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <SectionHeading title="Häufige Fragen" />
          <FaqList />
        </div>
      </Section>

      <Section tone="muted" className="!py-12">
        <h2 className="text-lg font-bold text-ink">Weitere Gerätearten</h2>
        <ul className="mt-4 flex flex-wrap gap-3">
          {others.map((o) => (
            <li key={o.slug}>
              <Link
                href={`/leistungen/${o.slug}`}
                className="inline-flex min-h-[48px] items-center rounded-xl border border-line bg-white px-5 font-semibold text-ink hover:border-ink"
              >
                {o.title}
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <ContactBlock />
    </>
  );
}
