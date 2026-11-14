import type { Metadata } from "next";
import Image from "next/image";
import ContactCta from "@/components/ContactCta";
import HeroVisual from "@/components/HeroVisual";
import { PageHeader } from "@/components/ui";
import { business, yearsOfExperience } from "@/data/site";
import { heroRepairImage, werkstattImage } from "@/data/images";
import { buildRouteMetadata } from "@/lib/seo";

export const metadata: Metadata = buildRouteMetadata("/ueber-uns");

const values = [
  { title: "Ehrlichkeit und Transparenz", text: "Bei uns gibt es keine versteckten Kosten." },
  { title: "Nur, was Sie brauchen", text: "Wir verkaufen Ihnen nur das, was Sie wirklich brauchen. Nutzen Sie unsere Fachkompetenz, um das passende Ersatzteil zu finden." },
  { title: "Alle Fabrikate", text: "Miele, Bosch, Siemens, AEG, Bauknecht oder andere Marken: Wir kennen sie." },
];

export default function UeberUns() {
  return (
    <>
      <PageHeader
        title="Persönlicher Service mit Erfahrung."
        intro="Ein unabhängiger Fachbetrieb in Osnabrück, geführt von einem Techniker, der Ihre Geräte kennt."
      />
      <section className="section bg-white dark:bg-slate-950">
        <div className="container-page grid items-start gap-8 lg:grid-cols-12 lg:gap-16">
          <div className="space-y-5 text-base sm:text-lg leading-relaxed text-slate-muted dark:text-slate-300 lg:col-span-7">
            <p>
              Seit {business.founded} steht Hannachi für persönlichen Service und Erfahrung im Bereich Haushaltsgeräte. Bei uns haben Sie einen direkten Ansprechpartner und profitieren von einer individuellen Beratung.
            </p>
            <p>
              Inhaber {business.owner} ist seit mehr als {yearsOfExperience} Jahren Ihr Ansprechpartner in der Region. Sie sprechen mit dem Techniker selbst, nicht mit einer Zentrale.
            </p>
            <p>
              Bei Verschleiß und im Reparaturfall halten wir Ersatzteile von bekannten deutschen Herstellern bereit. Teile für weniger bekannte Marken fordern wir bei Bedarf umgehend für Sie an.
            </p>

            <div className="grid gap-4 pt-4 sm:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-900 shadow-sm">
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                  <Image
                    src={werkstattImage}
                    alt="Kamal Hannachi bei der Platinendiagnose in seiner Osnabrücker Werkstatt"
                    fill
                    loading="lazy"
                    decoding="async"
                    quality={92}
                    placeholder="blur"
                    blurDataURL={werkstattImage.blurDataURL}
                    sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 92vw"
                    className="object-cover object-center"
                  />
                </div>
                <div className="p-3.5">
                  <p className="text-xs font-extrabold text-primary dark:text-slate-100">
                    Eigene Fachwerkstatt in Osnabrück
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-muted">
                    Elektronik- &amp; Platinenprüfung an der Iburger Straße 5
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-900 shadow-sm">
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                  <Image
                    src={heroRepairImage}
                    alt="Kamal Hannachi beim Vor-Ort-Kundendienst in Osnabrück"
                    fill
                    loading="lazy"
                    decoding="async"
                    quality={92}
                    placeholder="blur"
                    blurDataURL={heroRepairImage.blurDataURL}
                    sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 92vw"
                    className="object-cover object-top"
                  />
                </div>
                <div className="p-3.5">
                  <p className="text-xs font-extrabold text-primary dark:text-slate-100">
                    Persönlicher Vor-Ort-Service
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-muted">
                    Direkte Diagnose &amp; Reparatur bei Ihnen zu Hause
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="mx-auto max-w-md lg:max-w-none">
              <HeroVisual variant="about" priority />
            </div>
          </div>
        </div>
      </section>
      <section className="section bg-paper dark:bg-slate-900/60">
        <div className="container-page grid gap-8 sm:gap-10 md:grid-cols-3">
          {values.map((v) => (
            <div key={v.title} className="border-t-2 border-amber pt-5">
              <h2 className="text-lg sm:text-xl font-bold text-primary dark:text-slate-100">{v.title}</h2>
              <p className="mt-2 text-sm sm:text-base leading-relaxed text-slate-muted dark:text-slate-300">{v.text}</p>
            </div>
          ))}
        </div>
      </section>
      <ContactCta />
    </>
  );
}
