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

export type BreadcrumbItem = {
  name: string;
  path: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

const BASE_TITLE = "Hannachi Hausgeräte & Ersatzteile | Osnabrück seit 1990";
const BASE_DESCRIPTION =
  "Unabhängiger Fachhandel in Osnabrück seit 1990: persönliche Beratung, Original-Ersatzteile nach Typenschild und ausgewählte Markengeräte auf Anfrage.";
const OG_IMAGE_URL = `${business.url}/images/herr-hannachi.jpg`;
const OG_IMAGE_ALT =
  "Kamal Hannachi: Fachhandel für Elektrohaushaltsgeräte und Original-Ersatzteile in Osnabrück";

export const BASE_KEYWORDS = [
  "Hausgeräte Fachhandel Osnabrück",
  "Elektrohaushaltsgeräte Beratung Osnabrück",
  "Original-Ersatzteile Haushaltsgeräte Typenschild Osnabrück",
  "Ausgewählte Markengeräte auf Anfrage Osnabrück",
  "Ersatzteile Waschmaschine Geschirrspüler Kühlschrank Backofen Osnabrück",
  "Kamal Hannachi",
  "Hannachi Elektrohaushaltsgeräte & Ersatzteile Osnabrück",
  "49082 Osnabrück",
];

export const HOMEPAGE_FAQ_ITEMS: FaqItem[] = [
  {
    question: "Wie finde ich das passende Original-Ersatzteil für mein Haushaltsgerät?",
    answer:
      "Fotografieren Sie einfach das Typenschild Ihres Geräts (meist im Türrahmen der Waschmaschine, seitlich an der Geschirrspülertür, im Innenraum des Kühlschranks oder im Backofenrahmen) und senden Sie es unverbindlich per WhatsApp oder über das Anfrageformular. Anhand der Gerätedaten prüft Kamal Hannachi die genaue Teilekompatibilität und Verfügbarkeit.",
  },
  {
    question: "Für welche Marken und Haushaltsgeräte bietet Hannachi Beratung und Ersatzteile an?",
    answer:
      "Als unabhängiger Fachhandel seit 1990 beraten wir zu Waschmaschinen, Geschirrspülern, Kühl- und Gefriergeräten, Backöfen, Herden, Wäschetrocknern und Kaffeevollautomaten aller gängigen Hersteller wie Miele, Bosch, Siemens, AEG, Bauknecht, Liebherr, Neff, Constructa, Jura und DeLonghi.",
  },
  {
    question: "Wie hilft mir der interaktive 3D-Ersatzteil-Explorer auf hannachi.de?",
    answer:
      "Im 3D-Explorer können Sie sechs typische Haushaltsgeräte drehen, öffnen und einzelne Verschleißteile direkt anklicken. So erkennen Sie die genaue Fachbezeichnung des betroffenen Bauteils und können mit einem Tipp direkt eine passende Ersatzteil-Anfrage vorbereiten.",
  },
  {
    question: "Bietet Hannachi auch ausgewählte Markengeräte mit Garantie an?",
    answer:
      "Ja. Neben Original- und Qualitäts-Ersatzteilen führen wir auf Anfrage ausgewählte, geprüfte Markengeräte nach aktuellem Bestand. Jedes abgegebene Gerät enthält eine transparente Beratung durch den Inhaber sowie eine schriftliche Verkäufergarantie gemäß unseren Bedingungen im Impressum.",
  },
  {
    question: "Wie erreiche ich Kamal Hannachi und wie laufen Termine in Osnabrück ab?",
    answer:
      "Wir arbeiten persönlich und nach vorheriger Terminvereinbarung für Osnabrück und Umgebung (Mo. bis Sa., 08:00 bis 18:00 Uhr). Sie erreichen Kamal Hannachi direkt telefonisch unter 0170 3493494, per WhatsApp oder über das Anfrageformular auf dieser Website.",
  },
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
      robots: "index,follow,max-image-preview:large,max-snippet:-1",
      index: true,
      follow: true,
      canonicalPath: "/",
      canonicalUrl: toCanonicalUrl("/"),
    };
  }

  if (normalizedPath === "/marktplatz" || normalizedPath === "/angebote") {
    return {
      title: "Ausgewählte Markengeräte auf Anfrage | Hannachi Osnabrück",
      description:
        "Geprüfte Markengeräte auf Anfrage in Osnabrück: persönliche Empfehlung von Kamal Hannachi inklusive schriftlicher Verkäufergarantie.",
      robots: "index,follow,max-image-preview:large",
      index: true,
      follow: true,
      canonicalPath: "/marktplatz",
      canonicalUrl: toCanonicalUrl("/marktplatz"),
    };
  }

  if (normalizedPath === "/simulator") {
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
      title: "Geräte, Beratung & Ersatzteile | Hannachi Osnabrück",
      description: `Über ${yearsOfExperience} Jahre Erfahrung in Osnabrück: persönliche Fachberatung, Original-Ersatzteile nach Typenschild und ausgewählte Markengeräte auf Anfrage.`,
      robots: "index,follow,max-image-preview:large",
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
        title: `${service.title}: Beratung & Teile | Hannachi Osnabrück`,
        description: `${service.short} Persönliche Fachberatung und Original-Ersatzteile in Osnabrück seit 1990, Termine nach Vereinbarung.`,
        robots: "index,follow,max-image-preview:large",
        index: true,
        follow: true,
        canonicalPath,
        canonicalUrl: toCanonicalUrl(canonicalPath),
      };
    }
  }

  if (normalizedPath === "/anfrage") {
    return {
      title: "Persönliche Anfrage & Ersatzteile | Hannachi Osnabrück",
      description:
        "Direkte Anfrage an Kamal Hannachi in Osnabrück: Hausgeräte-Beratung, Original-Ersatzteile nach Typenschild oder ausgewählte Markengeräte.",
      robots: "index,follow,max-image-preview:large",
      index: true,
      follow: true,
      canonicalPath: "/anfrage",
      canonicalUrl: toCanonicalUrl("/anfrage"),
    };
  }

  if (normalizedPath === "/ueber-uns") {
    return {
      title: "Über Kamal Hannachi | Hausgeräte-Fachhandel seit 1990",
      description:
        "Seit 1990 in Osnabrück: Inhaber Kamal Hannachi steht für ehrliche Fachberatung, Original-Ersatzteile nach Typenschild und Markengeräte auf Anfrage.",
      robots: "index,follow,max-image-preview:large",
      index: true,
      follow: true,
      canonicalPath: "/ueber-uns",
      canonicalUrl: toCanonicalUrl("/ueber-uns"),
    };
  }

  if (normalizedPath === "/kundenbewertungen" || normalizedPath === "/bewertungen") {
    return {
      title: "Google-Bewertungen & Kundenstimmen | Hannachi Osnabrück",
      description:
        "Echte Kundenstimmen aus Osnabrück und Umgebung: Über 80 Google-Bewertungen für Hannachi Elektrohaushaltsgeräte & Ersatzteile.",
      robots: "index,follow,max-image-preview:large",
      index: true,
      follow: true,
      canonicalPath: "/kundenbewertungen",
      canonicalUrl: toCanonicalUrl("/kundenbewertungen"),
    };
  }

  if (normalizedPath === "/kontakt") {
    return {
      title: "Kontakt & Termine nach Vereinbarung | Hannachi Osnabrück",
      description:
        "Direkt per WhatsApp oder Telefon erreichbar: Fachberatung, Original-Ersatzteile nach Typenschild und Termine nach Vereinbarung in Osnabrück.",
      robots: "index,follow,max-image-preview:large",
      index: true,
      follow: true,
      canonicalPath: "/kontakt",
      canonicalUrl: toCanonicalUrl("/kontakt"),
    };
  }

  if (normalizedPath === "/impressum") {
    return {
      title: "Impressum & Rechtliche Hinweise (§ 5 DDG) | Hannachi",
      description:
        "Impressum gemäß § 5 DDG, gewerberechtliche Hinweise (§ 14 GewO) und Anschrift von Inhaber Kamal Hannachi in Osnabrück.",
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
        "DSGVO-Datenschutzhinweise von Kamal Hannachi zur Website-Nutzung, lokalen Anfragevorbereitung für WhatsApp und optionalen Google-Maps-Karten.",
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
      "Die angeforderte Seite wurde nicht gefunden. Kehren Sie zur Startseite von Hannachi Elektrohaushaltsgeräte & Ersatzteile in Osnabrück zurück.",
    robots: "noindex,follow",
    index: false,
    follow: true,
    canonicalPath: "/",
    canonicalUrl: toCanonicalUrl("/"),
  };
}

export function getRouteBreadcrumbs(cleanPath: string): BreadcrumbItem[] {
  const normalizedPath =
    cleanPath.length > 1 && cleanPath.endsWith("/")
      ? cleanPath.slice(0, -1)
      : cleanPath || "/";

  const homeCrumb: BreadcrumbItem = { name: "Startseite", path: "/" };
  if (normalizedPath === "/" || normalizedPath === "/simulator") {
    return [homeCrumb];
  }

  if (normalizedPath === "/leistungen" || normalizedPath === "/geraete") {
    return [homeCrumb, { name: "Geräte & Ersatzteile", path: "/leistungen" }];
  }

  if (normalizedPath.startsWith("/leistungen/")) {
    const slug = decodeURIComponent(normalizedPath.slice("/leistungen/".length));
    const service = services.find((item) => item.slug === slug);
    if (service) {
      return [
        homeCrumb,
        { name: "Geräte & Ersatzteile", path: "/leistungen" },
        { name: service.title, path: `/leistungen/${service.slug}` },
      ];
    }
  }

  const routeMap: Record<string, string> = {
    "/marktplatz": "Markengeräte auf Anfrage",
    "/angebote": "Markengeräte auf Anfrage",
    "/anfrage": "Persönliche Anfrage",
    "/ueber-uns": "Über uns",
    "/kundenbewertungen": "Kundenbewertungen",
    "/bewertungen": "Kundenbewertungen",
    "/kontakt": "Kontakt",
    "/impressum": "Impressum",
    "/datenschutz": "Datenschutz",
  };

  const label = routeMap[normalizedPath];
  if (label) {
    return [homeCrumb, { name: label, path: normalizedPath }];
  }

  return [homeCrumb];
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
          url: OG_IMAGE_URL,
          alt: OG_IMAGE_ALT,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [OG_IMAGE_URL],
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

function upsertLink(rel: string, href: string, extraAttr?: { name: string; value: string }) {
  const selector = extraAttr
    ? `link[rel="${rel}"][${extraAttr.name}="${extraAttr.value}"]`
    : `link[rel="${rel}"]`;
  let el = document.head.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    if (extraAttr) {
      el.setAttribute(extraAttr.name, extraAttr.value);
    }
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
  upsertMeta("property", "og:image", OG_IMAGE_URL);
  upsertMeta("property", "og:image:alt", OG_IMAGE_ALT);
  upsertMeta("property", "og:type", "website");
  upsertMeta("property", "og:locale", "de_DE");
  upsertMeta("property", "og:site_name", `${business.name} ${business.tagline}`);
  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", seo.title);
  upsertMeta("name", "twitter:description", seo.description);
  upsertMeta("name", "twitter:image", OG_IMAGE_URL);
  upsertMeta("name", "twitter:image:alt", OG_IMAGE_ALT);
  upsertLink("canonical", seo.canonicalUrl);
  upsertLink("alternate", seo.canonicalUrl, { name: "hreflang", value: "de-DE" });
  upsertLink("alternate", seo.canonicalUrl, { name: "hreflang", value: "x-default" });
}
