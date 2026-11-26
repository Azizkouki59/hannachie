// Customer-facing copy & data for the public website.
// Positioning: Fachhandel (§ 14 GewO) für Ersatzteile sowie An- & Verkauf von Hausgeräten.
// Wording rule: Keine Werbung für Reparatur-, Montage- oder Elektroanschlussleistungen.
import { business, sparePartsCategories, services, yearsOfExperience } from "@/data/site";
import { googleReviews82 } from "@/data/googleReviews82";

export { business, sparePartsCategories, services, yearsOfExperience };

/** Google rating shown on the site. Update manually when the Google profile changes. */
export const googleRating = { value: 4.8, count: 84 };

export const emailHref = `mailto:${business.email}`;

export function whatsappLink(text: string): string {
  return `https://wa.me/491703493494?text=${encodeURIComponent(text)}`;
}

export const defaultWhatsappText =
  "Guten Tag Herr Hannachi, ich habe eine Anfrage zu einem Hausgerät:";

export const navLinks = [
  { href: "/leistungen", label: "Sortiment" },
  { href: "/ueber-uns", label: "Über uns" },
  { href: "/kundenbewertungen", label: "Bewertungen" },
  { href: "/kontakt", label: "Kontakt" },
];

export type SiteImage = { webp640: string; webpFull: string; jpg?: string; width: number; height: number; alt: string };

function img(name: string, fullWidth: number, width: number, height: number, alt: string, jpg?: string): SiteImage {
  return {
    webp640: `/images/site/${name}-640.webp`,
    webpFull: `/images/site/${name}-${fullWidth}.webp`,
    jpg,
    width,
    height,
    alt,
  };
}

export const siteImages = {
  inhaber: img("inhaber", 896, 896, 1200, "Inhaber Kamal Hannachi", "/images/site/inhaber.jpg"),
  ersatzteile: img("ersatzteile", 1200, 1200, 896, "Original-Ersatzteile für Hausgeräte: Lager, Motor, Zulaufschlauch und Dichtung"),
  geraete: img("geraete", 1200, 1200, 896, "Moderne Hausgeräte: Kühlschrank, Waschmaschine und Trockner"),
  kueche: img("kueche", 1200, 1200, 896, "Moderne Küche mit Einbau-Backofen"),
  waschtrommel: img("waschtrommel", 1200, 1200, 896, "Waschmaschine mit geöffneter Tür"),
  waschraum: img("waschraum", 1200, 1200, 800, "Waschmaschine in einem hellen Waschraum"),
  kuehlschrank: img("kuehlschrank", 1200, 1200, 900, "Freistehender Kühlschrank in Mintgrün"),
  typenschild: img("typenschild", 1200, 1200, 896, "Gut lesbares Typenschild einer Waschmaschine mit E-Nr. und FD-Nummer"),
};

export const offers = [
  {
    id: "ersatzteile",
    title: "Original-Ersatzteile",
    text: "Pumpen, Dichtungen, Heizelemente, Filter, Körbe und Zubehör für alle gängigen Marken. Anhand der E-Nr. ermitteln wir das Teil, das wirklich passt.",
    cta: "Ersatzteil anfragen",
    topic: "Ersatzteil",
    image: "ersatzteile" as const,
  },
  {
    id: "geraete",
    title: "Geprüfte Markengeräte",
    text: "Waschmaschinen, Geschirrspüler, Kühlschränke und Herde – geprüft, gereinigt und mit schriftlicher Verkäufergarantie. Verfügbarkeit auf Anfrage.",
    cta: "Verfügbarkeit erfragen",
    topic: "Gerät kaufen",
    image: "geraete" as const,
  },
  {
    id: "ankauf",
    title: "Ankauf Ihres Geräts",
    text: "Sie möchten ein gut erhaltenes Markengerät verkaufen? Schicken Sie uns Fotos und das Typenschild – Sie erhalten ein faires Angebot.",
    cta: "Gerät anbieten",
    topic: "Gerät verkaufen",
    image: "waschtrommel" as const,
  },
];

export const steps = [
  {
    title: "Typenschild fotografieren",
    text: "Meist an der Türinnenseite, hinter der Sockelblende oder auf der Rückseite. Wichtig sind E-Nr. und FD-Nummer.",
  },
  {
    title: "Per WhatsApp senden",
    text: "Kurz dazuschreiben, welches Teil oder Gerät Sie suchen. Sie erhalten zeitnah Preis und Verfügbarkeit.",
  },
  {
    title: "Abholen in Osnabrück",
    text: "Nach kurzer Terminabsprache in der Iburger Straße 5 – Ihr Teil liegt dann bereit.",
  },
];

export const faqs = [
  {
    q: "Wo finde ich die E-Nr. meines Geräts?",
    a: "Auf dem Typenschild. Bei Waschmaschinen meist am Rand der Einfüllöffnung oder an der Klappe des Flusensiebs, bei Geschirrspülern seitlich an der Türinnenkante, bei Kühlschränken innen an der Seitenwand unten und bei Backöfen am Rahmen hinter der Tür. Ein scharfes Foto ohne Blitz genügt.",
  },
  {
    q: "Haben Sie das Ersatzteil vorrätig?",
    a: "Gängige Teile sind oft kurzfristig verfügbar, andere bestellen wir für Sie. Preis und voraussichtliche Lieferzeit erfahren Sie vorab – unverbindlich.",
  },
  {
    q: "Gibt es Garantie auf gebrauchte Geräte?",
    a: "Ja. Neben der gesetzlichen Gewährleistung erhalten Sie bei direkt bei uns gekauften Geräten eine schriftliche Verkäufergarantie. Dauer und Umfang stehen auf Ihrem Kaufbeleg.",
  },
  {
    q: "Kann ich einfach vorbeikommen?",
    a: "Bitte vereinbaren Sie vorher kurz einen Termin per Telefon oder WhatsApp. So ist sichergestellt, dass Herr Hannachi vor Ort ist und Ihr Teil bereitliegt.",
  },
  {
    q: "Kaufen Sie auch Geräte an?",
    a: "Ja, gut erhaltene Markengeräte. Senden Sie uns Fotos des Geräts und des Typenschilds per WhatsApp – wir melden uns mit einem Angebot.",
  },
];

export const brandList = [
  "Miele", "Bosch", "Siemens", "AEG", "Bauknecht", "Liebherr", "Neff",
  "Constructa", "Samsung", "LG", "Beko", "Gorenje", "Electrolux", "Privileg", "Zanussi", "Whirlpool",
];

export type PublicReview = { id: string; author: string; text: string; tag?: string };

// Only substantive reviews (no emoji-only entries). Texts must match the original Google reviews.
export const publicReviews: PublicReview[] = googleReviews82
  .filter((r) => r.text.replace(/[^\p{L}]/gu, "").length >= 12)
  .filter((r) => !/reparatur|repariert|service rund um/i.test(r.text))
  .map((r) => ({ id: r.id, author: r.author, text: r.text, tag: r.serviceTag }));

export const featuredReviewIds = [
  "google-review-debeka",
  "google-review-roman-osinsky",
  "google-review-wayfarer",
];

export const inquiryTopics = ["Ersatzteil", "Gerät kaufen", "Gerät verkaufen", "Allgemeine Frage"] as const;
export const inquiryDevices = [
  "Waschmaschine",
  "Trockner",
  "Geschirrspüler",
  "Kühlschrank / Gefriergerät",
  "Backofen / Herd",
  "Kaffeevollautomat",
  "Anderes Gerät",
] as const;

export const serviceSlugToImage: Record<string, keyof typeof siteImages> = {
  waschmaschinen: "waschraum",
  geschirrspueler: "geraete",
  kuehlschraenke: "kuehlschrank",
  backoefen: "kueche",
};

export const slugToPartsCategory: Record<string, string> = {
  waschmaschinen: "waschmaschinen",
  geschirrspueler: "geschirrspueler",
  kuehlschraenke: "kuehlschraenke",
  backoefen: "backoefen",
};

export const slugToSingular: Record<string, string> = {
  waschmaschinen: "Waschmaschine",
  geschirrspueler: "Geschirrspüler",
  kuehlschraenke: "Kühlschrank",
  backoefen: "Backofen / Herd",
};

export const allSupportedAppliancesForSite = [
  { title: "Wäsche", items: ["Wäschetrockner (Wärmepumpe & Kondensation)", "Waschtrockner", "Toplader"] },
  { title: "Kühlen & Gefrieren", items: ["Gefrierschränke & Gefriertruhen", "Side-by-Side-Geräte", "Wasserfilter & Türdichtungen"] },
  { title: "Kochen", items: ["Ceran- & Induktionskochfelder", "Dunstabzugshauben & Filter", "Mikrowellen & Dampfgarer"] },
  { title: "Kaffee", items: ["Kaffeevollautomaten", "Siebträgermaschinen", "Dichtungen & Pflegezubehör"] },
  { title: "Elektronik", items: ["Steuer- & Leistungsmodule", "Bedienblenden & Drehwähler", "Abgleich nach E-Nr. / PNC"] },
  { title: "Zubehör", items: ["Geschirrkörbe & Besteckkörbe", "Backbleche & Roste", "Schläuche & Flusensiebe"] },
];
