import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import ContactCta from "@/components/ContactCta";
import { serviceIcons } from "@/components/Illustrations";
import { PageHeader, ReviewCard, ServiceCard } from "@/components/ui";
import { services } from "@/data/site";
import { serviceImagesBySlug } from "@/data/images";
import { buildRouteMetadata } from "@/lib/seo";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const s = services.find((x) => x.slug === params.slug);
  if (!s) return {};
  return buildRouteMetadata(`/leistungen/${s.slug}`);
}

export default function ServicePage({ params }: Props) {
  const service = services.find((s) => s.slug === params.slug);
  if (!service) notFound();
  const Icon = serviceIcons[service.slug];
  const serviceImage = serviceImagesBySlug[service.slug];
  const others = services.filter((s) => s.slug !== service.slug);

  return (
    <>
      <PageHeader title={`Reparaturservice für ${service.title} in Osnabrück`} intro={service.intro} />
      <section className="section bg-white dark:bg-slate-950">
        <div className="container-page grid gap-10 lg:grid-cols-12 lg:gap-20">
          <div className="min-w-0 lg:col-span-7">
            <h2 className="text-2xl font-extrabold text-primary dark:text-slate-100 sm:text-3xl">Typische Probleme</h2>
            <ul className="mt-6 divide-y divide-navy/10 dark:divide-white/10 border-y border-navy/10 dark:border-white/10">
              {service.symptoms.map((s) => (
                <li key={s} className="flex items-center gap-3 py-4 text-base sm:text-lg text-primary dark:text-slate-200"><Check size={20} className="shrink-0 text-amber-deep dark:text-amber" aria-hidden /> {s}</li>
              ))}
            </ul>
            <h2 className="mt-12 sm:mt-14 text-2xl font-extrabold text-primary dark:text-slate-100 sm:text-3xl">So gehen wir vor</h2>
            <p className="mt-4 max-w-xl text-base sm:text-lg leading-relaxed text-slate-muted dark:text-slate-400">{service.approach}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href={`/kontakt?geraet=${service.slug}#anfrage`} className="btn-primary w-full sm:w-auto">Reparatur anfragen</Link>
              <Link href="/leistungen" className="btn-ghost w-full sm:w-auto">Alle Leistungen</Link>
            </div>
          </div>
          <div className="min-w-0 lg:col-span-5">
            {serviceImage ? (
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-primary/10 dark:border-white/10 bg-navy dark:bg-slate-900 shadow-lg">
                <Image
                  src={serviceImage}
                  alt={`Reparaturservice für ${service.title} in Osnabrück`}
                  fill
                  priority
                  placeholder="blur"
                  blurDataURL={serviceImage.blurDataURL}
                  sizes="(min-width: 1024px) 440px, 92vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between text-white">
                  <span className="text-sm font-extrabold">{service.title}</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md">
                    <Icon className="h-5 w-5 text-accent-light" />
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-2xl border border-primary/10 dark:border-white/10 bg-navy dark:bg-slate-900 text-amber"><Icon className="h-3/5 w-3/5" /></div>
            )}
            {service.customerNote && (
              <div className="mt-6"><ReviewCard review={{ author: service.customerNote.author, text: service.customerNote.quote }} /></div>
            )}
          </div>
        </div>
      </section>
      <section className="section bg-paper dark:bg-slate-900/60">
        <div className="container-page">
          <h2 className="text-2xl font-extrabold text-primary dark:text-slate-100 sm:text-3xl">Weitere Leistungen</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{others.map((s) => <ServiceCard key={s.slug} service={s} />)}</div>
        </div>
      </section>
      <ContactCta />
    </>
  );
}
