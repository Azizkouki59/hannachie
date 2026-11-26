import type { Metadata } from "next";
import { business, services, yearsOfExperience } from "@/data/site";

export type RouteSeoConfig = {
  title: string;
  description: string;
  robots: string;
  index: boolean;
  follow: boolean;
  canonicalPath: string;
  canonicalUrl: string;
};

const BASE_TITLE = "Hannachi – Hausgeräte & Ersatzteile in Osnabrück | seit 1990";
const BASE_DESCRIPTION =
  "Original-Ersatzteile für Waschmaschine, Geschirrspüler, Kühlschrank & Backofen nach E-Nr., geprüfte Markengeräte mit Garantie und Ankauf – persönlich in Osnabrück seit 1990.";
export const BASE_KEYWORDS = [
  "Hausgeräte Spezialist Osnabrück",
  "Elektrohaushaltsgeräte Beratung Osnabrück",
  "Original-Ersatzteile Haushaltsgeräte E-Nr Osnabrück",
  "Ausgewählte Markengeräte auf Anfrage Osnabrück",
  "Ersatzteile Waschmaschine Geschirrspüler Kühlschrank Backofen Osnabrück",
  "Kamal Hannachi",
  "Hannachi Elektrohaushaltsgeräte & Ersatzteile Osnabrück",
  "49082 Osnabrück",
];

function toCanonicalUrl(canonicalPath: string): string {
  const normalized =
    canonicalPath === "/"
      ? "/"
      : canonicalPath.startsWith("/")
      ? canonicalPath
      : `/${canonicalPath}`;
  return `${business.url}${normalized === "/" ? "/" : normalized}`;
}

export function getRouteSeo(cleanPath: string): RouteSeoConfig {
  const normalizedPath =
    cleanPath.length > 1 && cleanPath.endsWith("/")
      ? cleanPath.slice(0, -1)
      : cleanPath || "/";

  if (normalizedPath === "/") {
    return {
      title: BASE_TITLE,
      description: BASE_DESCRIPTION,
      robots: "index,follow",
      index: true,
      follow: true,
      canonicalPath: "/",
      canonicalUrl: toCanonicalUrl("/"),
    };
  }

  if (normalizedPath === "/marktplatz" || normalizedPath === "/angebote" || normalizedPath === "/simulator") {
    return {
      title: BASE_TITLE,
      description: BASE_DESCRIPTION,
      robots: "noindex,follow",
      index: false,
      follow: true,
      canonicalPath: "/",
      canonicalUrl: toCanonicalUrl("/"),
    };
  }

  if (normalizedPath === "/leistungen" || normalizedPath === "/geraete") {
    return {
      title: "Sortiment: Ersatzteile & Hausgeräte | Hannachi Osnabrück",
      description: `${yearsOfExperience}+ Jahre Erfahrung in Osnabrück: Fachberatung, Original-Ersatzteile nach E-Nr. & ausgewählte Markengeräte auf Anfrage. Termine nach Vereinbarung.`,
      robots: "index,follow",
      index: true,
      follow: true,
      canonicalPath: "/leistungen",
      canonicalUrl: toCanonicalUrl("/leistungen"),
    };
  }

  if (normalizedPath.startsWith("/leistungen/")) {
    const slug = decodeURIComponent(
      normalizedPath.slice("/leistungen/".length)
    );
    const service = services.find((item) => item.slug === slug);
    if (service) {
      const canonicalPath = `/leistungen/${service.slug}`;
      return {
        title: `Ersatzteile für ${service.title} | Hannachi Osnabrück`,
        description: `${service.short} Persönlich in Osnabrück seit 1990 – Termine nach Vereinbarung.`,
        robots: "index,follow",
        index: true,
        follow: true,
        canonicalPath,
        canonicalUrl: toCanonicalUrl(canonicalPath),
      };
    }
  }

  if (normalizedPath === "/anfrage") {
    return {
      title: "Persönliche Anfrage & Original-Ersatzteile | Hannachi Osnabrück",
      description:
        "Direkte Anfrage an Kamal Hannachi: Persönliche Hausgeräte-Beratung, Original-Ersatzteile nach Typenschild & ausgewählte Markengeräte auf Anfrage.",
      robots: "index,follow",
      index: true,
      follow: true,
      canonicalPath: "/kontakt",
      canonicalUrl: toCanonicalUrl("/kontakt"),
    };
  }

  if (normalizedPath === "/ueber-uns") {
    return {
      title: "Über uns | Kamal Hannachi – Hausgeräte-Spezialist seit 1990",
      description:
        "Seit 1990 in Osnabrück: Inhaber Kamal Hannachi steht für ehrliche Fachberatung, Original-Ersatzteile nach E-Nr. & ausgewählte Markengeräte auf Anfrage.",
      robots: "index,follow",
      index: true,
      follow: true,
      canonicalPath: "/ueber-uns",
      canonicalUrl: toCanonicalUrl("/ueber-uns"),
    };
  }

  if (normalizedPath === "/kundenbewertungen" || normalizedPath === "/bewertungen") {
    return {
      title: "Kundenbewertungen | Hannachi Osnabrück",
      description:
        "Kundenstimmen aus Osnabrück: 4,8 Sterne bei Google für Hannachi – Hausgeräte & Ersatzteile.",
      robots: "index,follow",
      index: true,
      follow: true,
      canonicalPath: "/kundenbewertungen",
      canonicalUrl: toCanonicalUrl("/kundenbewertungen"),
    };
  }

  if (normalizedPath === "/kontakt") {
    return {
      title: "Kontakt & Anfrage | Hannachi Osnabrück",
      description:
        "Direkt per WhatsApp oder Telefon erreichbar: Persönliche Beratung, Original-Ersatzteile nach E-Nr. & Termine nach Vereinbarung in Osnabrück.",
      robots: "index,follow",
      index: true,
      follow: true,
      canonicalPath: "/kontakt",
      canonicalUrl: toCanonicalUrl("/kontakt"),
    };
  }

  if (normalizedPath === "/impressum") {
    return {
      title: "Impressum | Hannachi Osnabrück",
      description:
        "Impressum gemäß § 5 DDG – Hannachi, Inhaber Kamal Hannachi, Iburger Straße 5, 49082 Osnabrück.",
      robots: "noindex,follow",
      index: false,
      follow: true,
      canonicalPath: "/impressum",
      canonicalUrl: toCanonicalUrl("/impressum"),
    };
  }

  if (normalizedPath === "/datenschutz") {
    return {
      title: "Datenschutzerklärung (DSGVO) | Hannachi Osnabrück",
      description:
        "Datenschutzhinweise zur Nutzung der Website hannachi.de – ohne Tracking und ohne Werbe-Cookies.",
      robots: "noindex,follow",
      index: false,
      follow: true,
      canonicalPath: "/datenschutz",
      canonicalUrl: toCanonicalUrl("/datenschutz"),
    };
  }

  if (normalizedPath === "/admin") {
    return {
      title: "Auftragsbuch (Admin) | Hannachi Osnabrück",
      description:
        "Geschütztes Auftragsbuch für Kundenanfragen, Termine und Belegdruck.",
      robots: "noindex,nofollow",
      index: false,
      follow: false,
      canonicalPath: "/admin",
      canonicalUrl: toCanonicalUrl("/admin"),
    };
  }

  return {
    title: "Seite nicht gefunden (404) | Hannachi Osnabrück",
    description:
      "Die angeforderte Seite wurde nicht gefunden.",
    robots: "noindex,follow",
    index: false,
    follow: true,
    canonicalPath: "/",
    canonicalUrl: toCanonicalUrl("/"),
  };
}

export function buildRouteMetadata(cleanPath: string): Metadata {
  const seo = getRouteSeo(cleanPath);
  return {
    title: seo.title,
    description: seo.description,
    keywords: BASE_KEYWORDS,
    robots: {
      index: seo.index,
      follow: seo.follow,
    },
    alternates: {
      canonical: seo.canonicalUrl,
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: seo.canonicalUrl,
      siteName: business.name,
      locale: "de_DE",
      type: "website",
      images: [
        {
          url: `${business.url}/images/site/inhaber.jpg`,
          alt: `${business.name} – Osnabrück`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
    },
  };
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${key}"]`
  );
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]'
  );
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function syncDocumentSeo(cleanPath: string) {
  if (typeof document === "undefined") return;
  const seo = getRouteSeo(cleanPath);

  document.title = seo.title;
  upsertMeta("name", "description", seo.description);
  upsertMeta("name", "keywords", BASE_KEYWORDS.join(", "));
  upsertMeta("name", "robots", seo.robots);
  upsertMeta("property", "og:title", seo.title);
  upsertMeta("property", "og:description", seo.description);
  upsertMeta("property", "og:url", seo.canonicalUrl);
  upsertMeta("property", "og:type", "website");
  upsertMeta("property", "og:locale", "de_DE");
  upsertMeta("property", "og:site_name", business.name);
  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", seo.title);
  upsertMeta("name", "twitter:description", seo.description);
  upsertCanonical(seo.canonicalUrl);
}
