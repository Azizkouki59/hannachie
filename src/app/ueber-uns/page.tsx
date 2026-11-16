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
        title="Persönlicher Vor-Ort-Service seit 1990."
        intro="Ihr direkter Ansprechpartner in Osnabrück & Umgebung für Elektrohaushaltsgeräte & Ersatzteile – mobil bei Ihnen zu Hause nach Terminvereinbarung."
      />
      <section className="section bg-white dark:bg-slate-950">
        <div className="container-page grid items-start gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="space-y-4 text-sm sm:text-base leading-relaxed text-slate-muted dark:text-slate-300 lg:col-span-7">
            <p>
              Seit {business.founded} steht Hannachi in Osnabrück für ehrliche Beratung und schnelle Hilfe rund um Elektrohaushaltsgeräte &amp; Ersatzteile. Wir sind als persönlicher mobiler Vor-Ort-Service nach Terminvereinbarung direkt bei unseren Kunden zu Hause im Einsatz.
            </p>
            <p>
              Inhaber {business.owner} kommt persönlich zu Ihnen nach Hause in Osnabrück &amp; Umgebung: Wir klären den Ersatzteilbedarf direkt am Gerät und liefern passende Original-Ersatzteile. Sollte sich die Rettung Ihres Altgeräts wirtschaftlich nicht mehr lohnen, bieten wir Ihnen auf Wunsch ein geprüftes Ersatzgerät aus unserem Bestand an.
            </p>
            <p>
              Jedes über Hannachi verkaufte Ersatzgerät wird mit einer offiziellen <strong className="font-semibold text-primary dark:text-white">schriftlichen Verkäufergarantie</strong> übergeben – inklusive vollem Garantie- und Reparaturservice für alle bei uns gekauften Geräte.
            </p>

            <div className="grid gap-4 pt-4 sm:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-900 shadow-sm">
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                  <Image
                    src={werkstattImage}
                    alt="Kamal Hannachi – Mobiler Vor-Ort-Service für Elektrohaushaltsgeräte & Ersatzteile in Osnabrück"
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
                    Mobiler Vor-Ort-Service in Osnabrück
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-muted">
                    Direkt beim Kunden zu Hause nach Terminvereinbarung
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-900 shadow-sm">
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                  <Image
                    src={heroRepairImage}
                    alt="Geprüfte Ersatzgeräte mit schriftlicher Verkäufergarantie in Osnabrück"
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
                    Schriftliche Verkäufergarantie
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-muted">
                    Geprüfte Ersatzgeräte inklusive vollem Garantie-Service durch uns
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
