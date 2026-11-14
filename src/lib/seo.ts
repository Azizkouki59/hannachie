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

const BASE_TITLE = "Hannachi Elektrohaushaltsgeräte Service | Osnabrück";
const BASE_DESCRIPTION =
  "Reparaturservice für Haushaltsgeräte in Osnabrück: Waschmaschinen, Geschirrspüler, Kühlschränke und Backöfen. Persönlicher Service seit 1990.";
export const BASE_KEYWORDS = [
  "Haushaltsgeräte Reparatur Osnabrück",
  "Waschmaschine Reparatur Osnabrück",
  "Geschirrspüler Reparatur Osnabrück",
  "Spülmaschine reparieren Osnabrück",
  "Backofen Reparatur Osnabrück",
  "Elektroherd reparieren Osnabrück",
  "Kühlschrank Reparatur Osnabrück",
  "Wäschetrockner Reparatur Osnabrück",
  "Kaffeevollautomat Reparatur Osnabrück",
  "Platinen Reparatur Osnabrück",
  "Hausgeräte Kundendienst Osnabrück",
  "Ersatzteile Haushaltsgeräte Osnabrück",
  "Gebrauchte Waschmaschine Osnabrück",
  "Miele Reparatur Osnabrück",
  "Bosch Siemens Kundendienst Osnabrück",
  "AEG Bauknecht Reparatur Osnabrück",
  "Kamal Hannachi",
  "Elektrohaushaltsgeräte Service Osnabrück",
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

  if (normalizedPath === "/leistungen") {
    return {
      title: "Unsere Leistungen | Hannachi Haushaltsgeräte Service Osnabrück",
      description:
        "Reparatur für Waschmaschinen, Trockner, Geschirrspüler, Kühlschränke, Backöfen, Kaffeevollautomaten und Elektronikplatinen in Osnabrück. Alle Fabrikate.",
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
        title: `Reparaturservice für ${service.title} Osnabrück | Hannachi`,
        description: `${service.short} Persönlicher Vor-Ort-Reparaturservice, Fehlerdiagnose und passende Originalersatzteile von Kamal Hannachi in Osnabrück.`,
        robots: "index,follow",
        index: true,
        follow: true,
        canonicalPath,
        canonicalUrl: toCanonicalUrl(canonicalPath),
      };
    }
  }

  if (normalizedPath === "/simulator") {
    return {
      title: "Geräte-Check & Fehlerdiagnose | Hannachi Osnabrück",
      description:
        "Interaktiver Fehlersimulator, Selbsthilfe-Checkliste und FAQ für Waschmaschinen, Geschirrspüler, Kühlschränke und Backöfen vor Ihrer Reparaturanfrage.",
      robots: "index,follow",
      index: true,
      follow: true,
      canonicalPath: "/simulator",
      canonicalUrl: toCanonicalUrl("/simulator"),
    };
  }

  if (normalizedPath === "/anfrage") {
    return {
      title: "Reparatur & Ersatzteil anfragen | Hannachi Osnabrück",
      description:
        "Wählen Sie Ihr defektes Haushaltsgerät, beschreiben Sie das Fehlerbild und senden Sie Ihre Reparatur- oder Ersatzteilanfrage direkt an Hannachi Osnabrück.",
      robots: "index,follow",
      index: true,
      follow: true,
      canonicalPath: "/anfrage",
      canonicalUrl: toCanonicalUrl("/anfrage"),
    };
  }

  if (normalizedPath === "/ueber-uns") {
    return {
      title: "Über uns | Fachbetrieb seit 1990 in Osnabrück – Hannachi",
      description:
        "Kamal Hannachi repariert seit 1990 Haushaltsgeräte in Osnabrück. Ehrliche Fehlerdiagnose, transparente Preise und persönlicher Vor-Ort-Kundendienst.",
      robots: "index,follow",
      index: true,
      follow: true,
      canonicalPath: "/ueber-uns",
      canonicalUrl: toCanonicalUrl("/ueber-uns"),
    };
  }

  if (normalizedPath === "/kundenbewertungen") {
    return {
      title: "Kundenbewertungen (82 Google-Rezensionen) | Hannachi Osnabrück",
      description:
        "Alle 82 verifizierten Google Maps Kundenstimmen aus Osnabrück zu Waschmaschinen-, Spülmaschinen-, Backofen- und Kühlschrankreparaturen bei Hannachi.",
      robots: "index,follow",
      index: true,
      follow: true,
      canonicalPath: "/kundenbewertungen",
      canonicalUrl: toCanonicalUrl("/kundenbewertungen"),
    };
  }

  if (normalizedPath === "/kontakt") {
    return {
      title: "Kontakt & Terminvereinbarung | Hannachi Osnabrück",
      description:
        "Telefon, WhatsApp, Anfahrt zur Werkstatt an der Iburger Straße 5 in Osnabrück und direkte Terminvereinbarung bei Hannachi Elektrohaushaltsgeräte Service.",
      robots: "index,follow",
      index: true,
      follow: true,
      canonicalPath: "/kontakt",
      canonicalUrl: toCanonicalUrl("/kontakt"),
    };
  }

  if (normalizedPath === "/impressum") {
    return {
      title: "Impressum & Anbieterkennzeichnung | Hannachi Osnabrück",
      description:
        "Rechtliche Anbieterkennzeichnung gemäß § 5 DDG, Kontaktdaten und Werkstattanschrift (Iburger Straße 5, 49082 Osnabrück) von Inhaber Kamal Hannachi.",
      robots: "noindex,follow",
      index: false,
      follow: true,
      canonicalPath: "/impressum",
      canonicalUrl: toCanonicalUrl("/impressum"),
    };
  }

  if (normalizedPath === "/datenschutz") {
    return {
      title: "Datenschutzerklärung (DSGVO) | Hannachi Service Osnabrück",
      description:
        "Datenschutzhinweise gemäß DSGVO zur Nutzung der Website, der lokalen Anfragevorbereitung für WhatsApp und optionaler Standortfunktionen bei Hannachi.",
      robots: "noindex,follow",
      index: false,
      follow: true,
      canonicalPath: "/datenschutz",
      canonicalUrl: toCanonicalUrl("/datenschutz"),
    };
  }

  return {
    title: "Seite nicht gefunden (404) | Hannachi Osnabrück",
    description:
      "Die angeforderte Seite existiert nicht. Kehren Sie zur Startseite oder zu unseren Reparaturleistungen für Haushaltsgeräte in Osnabrück zurück.",
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
