import type { Metadata } from "next";
import { business, services } from "@/data/site";

export type RouteSeoConfig = {
  title: string;
  description: string;
  robots: string;
  index: boolean;
  follow: boolean;
  canonicalPath: string;
  canonicalUrl: string;
};

const BASE_TITLE = "Hannachi Elektrohaushaltsgeräte & Ersatzteile | Mobiler Vor-Ort-Service Osnabrück";
const BASE_DESCRIPTION =
  "Ihr mobiler Vor-Ort-Service für Elektrohaushaltsgeräte & Ersatzteile in Osnabrück: Vor-Ort-Termin bei Ihnen zu Hause, passende Ersatzteile & geprüfte Ersatzgeräte mit schriftlicher Verkäufergarantie.";
export const BASE_KEYWORDS = [
  "Mobiler Vor-Ort-Service Elektrohaushaltsgeräte Osnabrück",
  "Ersatzteile Haushaltsgeräte Osnabrück",
  "Geprüfte Ersatzgeräte mit schriftlicher Verkäufergarantie Osnabrück",
  "An- und Verkauf Elektrohaushaltsgeräte Osnabrück",
  "Waschmaschine Geschirrspüler Kühlschrank Herd Backofen Osnabrück",
  "Kamal Hannachi",
  "Hannachi Elektrohaushaltsgeräte & Ersatzteile Osnabrück",
  "Iburger Straße 5",
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

  if (normalizedPath === "/leistungen") {
    return {
      title: "Vor-Ort-Service, Ersatzteile & Ersatzgeräte | Hannachi Osnabrück",
      description:
        "Mobiler Vor-Ort-Service nach Terminvereinbarung in Osnabrück: Gerätecheck & passende Ersatzteile bei Ihnen zu Hause sowie geprüfte Ersatzgeräte inkl. schriftlicher Verkäufergarantie.",
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
        title: `${service.title} – Vor-Ort-Service & Ersatzteile Osnabrück | Hannachi`,
        description: `${service.short} Mobiler Vor-Ort-Termin nach Vereinbarung in Osnabrück & Umgebung.`,
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
      title: "Vor-Ort-Termin, Ersatzteil & Ersatzgerät anfragen | Hannachi Osnabrück",
      description:
        "Schnelle Online-Anfrage für einen Vor-Ort-Termin bei Ihnen zu Hause in Osnabrück, passende Ersatzteile, ein geprüftes Ersatzgerät mit schriftlicher Garantie oder einen Garantiefall.",
      robots: "index,follow",
      index: true,
      follow: true,
      canonicalPath: "/anfrage",
      canonicalUrl: toCanonicalUrl("/anfrage"),
    };
  }

  if (normalizedPath === "/ueber-uns") {
    return {
      title: "Über uns | Mobiler Vor-Ort-Service seit 1990 in Osnabrück – Hannachi",
      description:
        "Kamal Hannachi in Osnabrück: Mobiler Vor-Ort-Service für Elektrohaushaltsgeräte & Ersatzteile sowie geprüfte Ersatzgeräte mit schriftlicher Garantie seit 1990.",
      robots: "index,follow",
      index: true,
      follow: true,
      canonicalPath: "/ueber-uns",
      canonicalUrl: toCanonicalUrl("/ueber-uns"),
    };
  }

  if (normalizedPath === "/kundenbewertungen") {
    return {
      title: "Kundenbewertungen auf Google Maps | Hannachi Osnabrück",
      description:
        "Verifizierte Google Maps Kundenstimmen und Live-Bewertungen aus Osnabrück für Hannachi Elektrohaushaltsgeräte & Ersatzteile.",
      robots: "index,follow",
      index: true,
      follow: true,
      canonicalPath: "/kundenbewertungen",
      canonicalUrl: toCanonicalUrl("/kundenbewertungen"),
    };
  }

  if (normalizedPath === "/kontakt") {
    return {
      title: "Kontakt & Vor-Ort-Terminvereinbarung | Hannachi Osnabrück",
      description:
        "Telefon, WhatsApp und Terminvereinbarung für unseren mobilen Vor-Ort-Service bei Ihnen zu Hause in Osnabrück & Umgebung.",
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
        "Impressum, Kontaktdaten und Geschäftsanschrift (Iburger Straße 5, 49082 Osnabrück) von Inhaber Kamal Hannachi.",
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
        "Datenschutzhinweise gemäß DSGVO zur Nutzung der Website, der lokalen Anfragevorbereitung für WhatsApp und optionaler Standortfunktionen bei Hannachi.",
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
      "Die angeforderte Seite existiert nicht. Kehren Sie zur Startseite oder zu unserem Angebot für Elektrohaushaltsgeräte & Ersatzteile in Osnabrück zurück.",
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
          url: `${business.url}/images/werkstatt.jpg`,
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
