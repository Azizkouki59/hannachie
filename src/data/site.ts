// Single source of truth for business data.
// Strictly compliant German trade business (§ 14 GewO — Handelsgewerbe, kein Handwerksbetrieb i. S. d. HwO):
// - An- und Verkauf von geprüften Elektrohaushaltsgeräten (Gebraucht- & Ersatzgeräte)
// - Fachhandel & Verkauf von Original- und Qualitäts-Ersatzteilen sowie Zubehör nach Typenschild (E-Nr. / PNC)
// - Persönliche Kauf- & Ersatzteilberatung sowie Lieferung / Übergabe in Osnabrück & Umgebung nach Terminvereinbarung
// - Gesetzliche Gewährleistung & schriftliche Verkäufergarantie ausschließlich für direkt bei Hannachi gekaufte Geräte

import {
  buildWhatsAppDirectUrl,
  DEFAULT_WHATSAPP_GREETING,
} from "@/utils/whatsapp";

export type ServiceNoticeType = "maintenance" | "vacation";

export type ServiceNotice = {
  active: boolean;
  type: ServiceNoticeType;
  label: string;
  message: string;
};

const BUSINESS_STREET = "Iburger Straße 5, Im Hof";
const BUSINESS_ZIP = "49082";
const BUSINESS_CITY = "Osnabrück";
const BUSINESS_PHONE_DISPLAY = "0170 3493494";
const BUSINESS_EMAIL = "contact@hannachi.de";
const BUSINESS_FOUNDED = 1990;

export const businessFullAddress = `${BUSINESS_STREET}, ${BUSINESS_ZIP} ${BUSINESS_CITY}`;

export const business = {
  name: "Hannachi",
  tagline: "Elektrohaushaltsgeräte & Ersatzteile",
  legalLicense:
    "Handelsgewerbe gemäß § 14 GewO für Elektrohaushaltsgeräte, persönliche Fachberatung, Original-Ersatzteile & ausgewählte Markengeräte auf Anfrage",
  nonMeisterNotice:
    "Handelsgewerbe gemäß § 14 GewO (Fachberatung, Original-Ersatzteile & ausgewählte Markengeräte auf Anfrage) – kein eingetragener Handwerks- oder Meisterbetrieb i. S. d. Anlage A HwO.",
  hwoDisclaimer:
    "Rechtlicher Hinweis gemäß § 14 GewO & Handwerksordnung (HwO): Selbstständiges Handelsgewerbe für persönliche Fachberatung, Original-Ersatzteile nach Typenschild sowie ausgewählte Markengeräte auf Anfrage – kein eingetragener Handwerks- oder Meisterbetrieb nach Anlage A HwO. Über diese Website werden weder handwerkliche Reparatur-, Wartungs- noch Elektroanschlussleistungen (z. B. Starkstromanschluss) beworben, vermittelt oder angeboten. Gesetzliche Gewährleistungsrechte sowie eine schriftliche Verkäufergarantie bestehen ausschließlich für direkt bei Hannachi erworbene Geräte.",
  mobileServiceNotice:
    "Osnabrück & Umgebung · Termine nach Vereinbarung.",
  warrantyNotice:
    "Ausgewählte Markengeräte auf Anfrage inkl. schriftlicher Verkäufergarantie bei direktem Erwerb.",
  owner: "Kamal Hannachi",
  founded: BUSINESS_FOUNDED,
  street: BUSINESS_STREET,
  zip: BUSINESS_ZIP,
  city: BUSINESS_CITY,
  phoneDisplay: BUSINESS_PHONE_DISPLAY,
  phoneHref: "tel:+491703493494",
  whatsappHref: buildWhatsAppDirectUrl(DEFAULT_WHATSAPP_GREETING),
  hours: "Mo–Sa 08:00–18:00 Uhr · Termine nach Vereinbarung",
  email: BUSINESS_EMAIL,
  taxNote: "Persönliche, transparente Absprache direkt mit Inhaber Kamal Hannachi.",
  url: "https://hannachi.de",
  facebookUrl: "https://www.facebook.com/hannachi.elektroservice",
  facebookHandle: "hannachi.elektroservice",
  placeId: "ChIJ_RB_R7_luUcRHnvjhljngB8",
  mapsUrl:
    "https://www.google.com/maps/place/Hannachi+Elektrohaushaltsger%C3%A4te+Service/@52.2902275,8.0207428,17z/data=!3m1!4b1!4m6!3m5!1s0x47b9e5bf477f10fd:0x1f80e75886e37b1e!8m2!3d52.2902275!4d8.0207428!16s%2Fg%2F1tfhfj72",
  mapsReviewsUrl:
    "https://www.google.com/maps/place/Hannachi+Elektrohaushaltsger%C3%A4te+Service/@52.2902275,8.0207428,17z/data=!4m8!3m7!1s0x47b9e5bf477f10fd:0x1f80e75886e37b1e!8m2!3d52.2902275!4d8.0207428!9m1!1b1!16s%2Fg%2F1tfhfj72",
  mapsWriteReviewUrl:
    "https://search.google.com/local/writereview?placeid=ChIJ_RB_R7_luUcRHnvjhljngB8",
  mapsEmbedUrl:
    "https://maps.google.com/maps?q=Hannachi+Elektrohaushaltsger%C3%A4te+Service,+Iburger+Stra%C3%9Fe+5,+49082+Osnabr%C3%BCck&t=&z=16&ie=UTF8&iwloc=&output=embed",
  coordinates: {
    lat: 52.2647082,
    lng: 8.0567763,
  },
  serviceNotice: {
    active: false,
    type: "vacation",
    label: "Info",
    message: "Termine nach Vereinbarung. Für eine schnelle Rückmeldung schreiben Sie gerne per WhatsApp.",
  } as ServiceNotice,
  legal: {
    legalForm: "Einzelunternehmen",
    tradeAuthority:
      "Stadt Osnabrück – Fachbereich Bürger und Ordnung (Gewerbeabteilung), Natruper-Tor-Wall 2, 49076 Osnabrück",
    chamber:
      "Industrie- und Handelskammer (IHK) Osnabrück – Emsland – Grafschaft Bentheim, Neuer Graben 38, 49074 Osnabrück",
    // Optional: falls eine offizielle DE-USt-IdNr. (§ 27a UStG) vorliegt, hier zentral eintragen.
    ustIdNr: "",
    // Optional: Wirtschafts-Identifikationsnummer (W-IdNr. gemäß § 139c AO / § 5 Abs. 1 Nr. 6 DDG), sofern zugeteilt.
    wirtschaftsIdNr: "",
    vatTransparencyNote:
      "Es handelt sich um ein Einzelunternehmen im Handelsgewerbe (§ 14 GewO). Die jeweils anfallende Umsatzsteuer bzw. der steuerliche Rechnungsausweis erfolgt transparent auf dem individuellen Kaufbeleg bei persönlichem Geschäftsabschluss. Eine gesonderte Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG wird derzeit nicht geführt.",
    pangvNotice:
      "Diese Website ist ein reines Informations- und unverbindliches Anfrageportal ohne automatisierten Online-Shop oder Warenkorb-Checkout. Alle Preise, Liefer- bzw. Abholkonditionen sowie die Verfügbarkeit ausgewählter Markengeräte und Original-Ersatzteile werden individuell im persönlichen Gespräch bzw. auf dem schriftlichen Kaufbeleg verbindlich vereinbart; Endpreise verstehen sich stets inklusive der jeweils gesetzlich anfallenden Umsatzsteuer.",
    warrantyBgb479: {
      guarantor: `Kamal Hannachi, Hannachi Elektrohaushaltsgeräte & Ersatzteile, ${businessFullAddress}, Deutschland, Tel.: ${BUSINESS_PHONE_DISPLAY}, E-Mail: ${BUSINESS_EMAIL}`,
      territorialScope:
        "Bundesrepublik Deutschland (vorrangig Abwicklung im Raum Osnabrück & Umgebung nach persönlicher Terminvereinbarung).",
      durationAndContent:
        "Sofern für ein direkt bei Hannachi erworbenes Elektrohaushaltsgerät zusätzlich eine schriftliche Verkäufergarantie gewährt wird, ergeben sich die genaue Garantiedauer (in der Regel 6 bis 12 Monate ab Übergabe) sowie der konkrete Leistungsumfang verbindlich aus dem ausgehändigten Kauf- und Garantiebeleg. Im Garantiefall erfolgt nach Wahl des Garantiegebers eine kostenfreie Nachbesserung oder Ersatzlieferung eines gleichwertigen Geräts. Verschleißteile, unsachgemäße Handhabung, Fremdeingriffe sowie Transportschäden nach Übergabe sind nicht Gegenstand der freiwilligen Verkäufergarantie.",
      claimProcedure: `Zur Geltendmachung genügt eine formlose Mitteilung unter Vorlage des Kauf- und Garantiebelegs per Telefon (${BUSINESS_PHONE_DISPLAY}), E-Mail (${BUSINESS_EMAIL}) oder persönlich nach Terminvereinbarung.`,
      statutoryRightsNotice:
        "Wichtiger gesetzlicher Hinweis (§ 479 Abs. 1 Nr. 1 BGB): Ihre gesetzlichen Rechte bei Mängeln (Gewährleistung nach §§ 437 ff. BGB) bestehen unabhängig von einer Verkäufergarantie, können gegenüber dem Verkäufer unentgeltlich in Anspruch genommen werden und werden durch die Garantie in keiner Weise eingeschränkt.",
    },
    usedGoodsBgb476Note:
      "Für alle verkauften Waren gelten die gesetzlichen Mängelhaftungsrechte (Gewährleistung). Bei gebrauchten Elektrohaushaltsgeräten richtet sich die Verjährungsfrist für Mängelansprüche nach den gesetzlichen Bestimmungen des BGB; eine etwaige Verkürzung gegenüber Verbrauchern auf ein Jahr erfolgt ausschließlich bei gesonderter, ausdrücklicher und einzelvertraglicher Vereinbarung gemäß § 476 Abs. 2 BGB vor Vertragsschluss.",
    elektroG: {
      disposalNotice:
        "Elektro- und Elektronikgeräte dürfen gemäß Elektro- und Elektronikgerätegesetz (ElektroG) nicht im unsortierten Hausmüll entsorgt werden. Darauf weist das Symbol der durchgestrichenen Mülltonne auf dem Gerät oder der Verpackung hin.",
      returnOptions:
        "Alte Haushaltsgeräte können kostenfrei an den kommunalen Sammelstellen und Recyclinghöfen (z. B. beim Osnabrücker ServiceBetrieb – OSB) abgegeben werden. Soweit beim Kauf eines entsprechenden Neugeräts oder im Rahmen der gesetzlichen Vorgaben des § 17 ElektroG eine Rücknahmepflicht besteht, informieren wir Sie vor Übergabe transparent über die unentgeltliche Rückgabemöglichkeit.",
      dataDeletionNotice:
        "Bitte beachten Sie bei smarten oder vernetzten Haushaltsgeräten, vor der Abgabe oder Entsorgung eigenverantwortlich alle gespeicherten personenbezogenen Daten (z. B. WLAN-Zugangsdaten oder App-Verknüpfungen) auf dem Altgerät zu löschen.",
    },
    dataProtectionAuthority: {
      name: "Der Landesbeauftragte für den Datenschutz Niedersachsen (LfD Niedersachsen)",
      street: "Prinzenstraße 5",
      zipCity: "30159 Hannover",
      phone: "+49 511 120-4500",
      email: "poststelle@lfd.niedersachsen.de",
      website: "https://www.lfd.niedersachsen.de",
    },
  },
};

export const yearsOfExperience = new Date().getFullYear() - business.founded;

export const brands = ["Miele", "Bosch", "Siemens", "AEG", "Bauknecht"];

export type Service = {
  slug: "waschmaschinen" | "geschirrspueler" | "kuehlschraenke" | "backoefen";
  title: string;
  short: string;
  intro: string;
  symptoms: string[];
  approach: string;
  customerNote?: { quote: string; author: string };
};

export const services: Service[] = [
  {
    slug: "waschmaschinen",
    title: "Waschmaschinen",
    short: "Beratung, Originalteile nach E-Nr. & Geräte auf Anfrage.",
    intro:
      "Persönliche Beratung, Original-Ersatzteile nach Typenschild (E-Nr.) und ausgewählte Waschmaschinen auf Anfrage.",
    symptoms: [
      "Persönliche Beratung",
      "Pumpe, Dichtung, Heizstab, Schloss (E-Nr.)",
      "Motorkohlen, Stoßdämpfer & Sensor",
      "Markengerät auf Anfrage",
    ],
    approach:
      "Kurz per WhatsApp (gerne mit Typenschild-Foto) oder Telefon melden für eine schnelle Rückmeldung direkt vom Inhaber.",
    customerNote: {
      quote: "Spontaner Termin, gute Beratung und volle Fachkenntnis. Preis-Leistung absolut fair.",
      author: "Google-Rezension (Osnabrück)",
    },
  },
  {
    slug: "geschirrspueler",
    title: "Geschirrspüler",
    short: "Beratung, Pumpen, Aquastop, Körbe & Geräte auf Anfrage.",
    intro:
      "Fachberatung, Original-Ersatzteile nach Typenschild und ausgewählte Geschirrspüler (45 / 60 cm) auf Anfrage.",
    symptoms: [
      "Persönliche Beratung",
      "Heiz- & Ablaufpumpe (E-Nr.)",
      "Aquastop, Korbrollen & Dichtungen",
      "Markengerät auf Anfrage",
    ],
    approach:
      "Typenschild per WhatsApp senden, ich prüfe das passende Teil persönlich.",
    customerNote: {
      quote: "Herr Hannachi konnte schon am Telefon schnell und kostenfrei einen hilfreichen Tipp geben.",
      author: "Roman Osinsky (Google Maps)",
    },
  },
  {
    slug: "kuehlschraenke",
    title: "Kühlschränke",
    short: "Beratung, Dichtungen, Thermostate & Geräte auf Anfrage.",
    intro:
      "Schnelle Fachberatung, Original-Ersatzteile nach E-Nr. und ausgewählte Kühlgeräte auf Anfrage.",
    symptoms: [
      "Persönliche Beratung",
      "Thermostat, Fühler & Türdichtung",
      "Scharniere, Glasplatten & Fächer",
      "Markengerät auf Anfrage",
    ],
    approach:
      "Bei Kühlgeräten kurz anrufen oder per WhatsApp schreiben für eine schnelle persönliche Rückmeldung.",
    customerNote: {
      quote: "Sehr zuverlässig, kompetent und preislich absolut fair. Sehr zu empfehlen.",
      author: "Myra Bonnici (Google Maps)",
    },
  },
  {
    slug: "backoefen",
    title: "Backöfen & Herde",
    short: "Beratung, Heizelemente, Schalter & Geräte auf Anfrage.",
    intro:
      "Persönliche Beratung, Originalteile (Heizelemente, Schalter, Dichtungen) und ausgewählte Geräte auf Anfrage.",
    symptoms: [
      "Persönliche Beratung",
      "Ringheizkörper & Heizelemente",
      "Schalter, Thermostat & Dichtung",
      "Markengerät auf Anfrage",
    ],
    approach:
      "Typenschild per WhatsApp senden, wir klären Teil oder Gerätewunsch direkt persönlich.",
    customerNote: {
      quote: "Sehr freundlich, unkomplizierte Abstimmung per WhatsApp und schnelle Terminvereinbarung.",
      author: "Pia B (Google Maps)",
    },
  },
];

import { googleReviews82, type DetailedGoogleReview } from "./googleReviews82";

export type Review = {
  id?: string;
  author: string;
  text: string;
  textEn?: string;
  rating?: number;
  relativeTime?: string;
  isNew?: boolean;
  serviceTag?: string;
  localGuide?: string;
  ownerReply?: string;
  category?: DetailedGoogleReview["category"];
  topicTags?: DetailedGoogleReview["topicTags"];
  likesCount?: number;
};

// All 82 Google Maps customer reviews for Hannachi in Osnabrück (4.8 ★ average across 82 reviews).
export const reviews: Review[] = googleReviews82;

export const nav = [
  { href: "/", label: "Startseite" },
  { href: "/leistungen", label: "Geräte & Teile" },
  { href: "/kundenbewertungen", label: "Bewertungen" },
  { href: "/ueber-uns", label: "Über uns" },
  { href: "/kontakt", label: "Kontakt" },
];

export const sparePartsHighlights = [
  {
    title: "Seit 1990 in Osnabrück",
    desc: `${yearsOfExperience}+ Jahre Erfahrung · Termine nach Vereinbarung.`,
  },
  {
    title: "Originalteile nach E-Nr.",
    desc: "Miele, Bosch, Siemens, AEG, Bauknecht, Liebherr u. v. m.",
  },
  {
    title: "Markengeräte auf Anfrage",
    desc: "Ausgewählte geprüfte Geräte nach Verfügbarkeit.",
  },
  {
    title: "Verkäufergarantie",
    desc: "Schriftliche Garantie bei direkt erworbenen Geräten.",
  },
];

export const sparePartsCategories = [
  {
    category: "Waschmaschinen & Trockner",
    appliance: "waschmaschinen",
    parts: [
      "Laugenpumpen & Ablaufpumpen",
      "Heizstäbe & Temperatursensoren",
      "Türmanschetten & Bullaugendichtungen",
      "Keilriemen & Antriebsriemen",
      "Motorkohlen & Kohlebürsten",
      "Stoßdämpfer & Aufhängungsfedern",
      "Türverriegelungen & Ersatzmodule",
    ],
  },
  {
    category: "Geschirrspüler",
    appliance: "geschirrspueler",
    parts: [
      "Umwälzpumpen & Heizpumpen",
      "Ablaufpumpen & Rückschlagventile",
      "Spritzarme oben & unten",
      "Türdichtungen & Wannendichtungen",
      "Aquastop-Zulaufschläuche",
      "Dosierkammern & Klarspülerspender",
      "Geschirrkörbe & Rollensätze",
    ],
  },
  {
    category: "Kühlschränke & Gefriergeräte",
    appliance: "kuehlschraenke",
    parts: [
      "Thermostate & NTC-Temperaturfühler",
      "Magnet-Türdichtungen",
      "Türscharniere & Schleppscharniere",
      "Umluftventilatoren & Lüftermotoren",
      "Kompressor-Startrelais & Klixon",
      "Abtauheizungen & Timer",
      "Glasplatten, Schubladen & Türfächer",
    ],
  },
  {
    category: "Backöfen & Herde",
    appliance: "backoefen",
    parts: [
      "Unterhitze- & Oberhitze-Heizkörper",
      "Heißluft-Ringheizkörper",
      "Backofenschalter & Energieregler",
      "Sicherheits-Thermostate",
      "Backofentürdichtungen & Scheiben",
      "Heißluftlüfter & Kühlgebläse",
      "Backbleche & Kombiroste",
    ],
  },
];

export const sparePartsBrands = [
  { name: "Miele", group: "Deutsche Premiumklasse" },
  { name: "Bosch", group: "BSH Hausgeräte" },
  { name: "Siemens", group: "BSH Hausgeräte" },
  { name: "AEG", group: "Electrolux Gruppe" },
  { name: "Bauknecht", group: "Whirlpool Gruppe" },
  { name: "Liebherr", group: "Kühl- & Gefriertechnik" },
  { name: "Neff", group: "BSH Hausgeräte" },
  { name: "Constructa", group: "BSH Hausgeräte" },
  { name: "Samsung", group: "Originalteile" },
  { name: "LG", group: "Originalteile" },
  { name: "Beko", group: "Haushaltsgeräte" },
  { name: "Gorenje", group: "Hisense Gruppe" },
  { name: "Electrolux", group: "Electrolux Gruppe" },
  { name: "Privileg", group: "Haushaltsgeräte" },
  { name: "Zanussi", group: "Electrolux Gruppe" },
  { name: "Whirlpool", group: "Whirlpool Gruppe" },
];

export type SupportedApplianceCategory = {
  title: string;
  badge: string;
  description: string;
  items: {
    name: string;
    description: string;
    symptoms: string[];
  }[];
};

export const allSupportedAppliances: SupportedApplianceCategory[] = [
  {
    title: "Wäsche waschen und trocknen",
    badge: "Geräte & Teile",
    description: "Persönliche Fachberatung, Original-Ersatzteile nach E-Nr. & ausgewählte Waschmaschinen und Trockner auf Anfrage.",
    items: [
      {
        name: "Waschmaschinen & Toplader",
        description: "Fachberatung, Original-Ersatzteile aller Marken & ausgewählte Frontlader auf Anfrage.",
        symptoms: ["Laugenpumpe / Ablaufpumpe", "Türmanschette / Dichtung", "Heizstab & NTC-Sensor", "Motorkohlen & Stoßdämpfer", "Ausgewähltes Markengerät anfragen"],
      },
      {
        name: "Wäschetrockner",
        description: "Original-Ersatzteile für Wärmepumpen- & Kondenstrockner sowie Geräte auf Anfrage.",
        symptoms: ["Kondensatpumpe & Sensor", "Anlaufkondensator", "Türschloss & Flusensieb", "Ausgewählten Trockner anfragen"],
      },
      {
        name: "Waschtrockner (2-in-1)",
        description: "Persönliche Beratung, Original-Ersatzteile & Zubehör nach Typenschild.",
        symptoms: ["Pumpen- & Ventileinheit", "Dichtungen & Riemen", "Verfügbarkeit anfragen"],
      },
    ],
  },
  {
    title: "Geschirr spülen",
    badge: "Küche",
    description: "Persönliche Beratung, Original-Ersatzteile nach E-Nr. & ausgewählte Geschirrspüler auf Anfrage.",
    items: [
      {
        name: "Geschirrspüler (45 cm & 60 cm)",
        description: "Originalteile für Einbau-, Unterbau- und Standgeräte sowie ausgewählte Markengeräte auf Anfrage.",
        symptoms: ["Umwälzpumpe / Heizpumpe", "Aquastop-Zulaufschlauch", "Korbrollen & Sprüharme", "Ausgewählten Geschirrspüler anfragen"],
      },
      {
        name: "Büro- & Kleingewerbespüler",
        description: "Original-Ersatzteile und persönliche Beratung für Teeküchen und Büros.",
        symptoms: ["Dosierkammer & Dichtungen", "Ablaufpumpe", "Geräteverfügbarkeit anfragen"],
      },
    ],
  },
  {
    title: "Kühlen und Gefrieren",
    badge: "Kühltechnik",
    description: "Fachberatung, Original-Ersatzteile nach E-Nr. & ausgewählte Kühl- und Gefriergeräte auf Anfrage.",
    items: [
      {
        name: "Kühlschränke",
        description: "Dichtungen, Thermostate & Zubehör sowie ausgewählte Stand- und Unterbaugeräte auf Anfrage.",
        symptoms: ["Thermostat & NTC-Fühler", "Magnet-Türdichtung", "Schleppscharnier-Satz", "Ausgewählten Kühlschrank anfragen"],
      },
      {
        name: "Gefrierschränke & Gefriertruhen",
        description: "Original-Ersatzteile, Schubladen & ausgewählte NoFrost-Geräte auf Anfrage.",
        symptoms: ["Lüftermotor & Startrelais", "Gefrierfachklappen & Schubladen", "Verfügbarkeit anfragen"],
      },
      {
        name: "Side-by-Side & Kühl-Gefrierkombis",
        description: "Original-Wasserfilter, Dichtungen & ausgewählte Großraumgeräte auf Anfrage.",
        symptoms: ["Wasserfilter & Magnetventil", "Türdichtungen", "Verfügbarkeit anfragen"],
      },
    ],
  },
  {
    title: "Kochen, Backen und Lüften",
    badge: "Küche & Hitze",
    description: "Original-Ersatzteile nach Typenschild & ausgewählte Backöfen, Herde und Kochfelder auf Anfrage.",
    items: [
      {
        name: "Backöfen",
        description: "Heizelemente, Schalter & Dichtungen nach E-Nr. sowie ausgewählte Backöfen auf Anfrage.",
        symptoms: ["Heißluft-Ringheizkörper", "Ober-/Unterhitze-Element", "Backofenschalter & Thermostat", "Ausgewählten Backofen anfragen"],
      },
      {
        name: "Elektro- & Standherde",
        description: "Original-Schalter, Dichtungen & ausgewählte Standherde auf Anfrage.",
        symptoms: ["Energieregler & Kochplatten", "Backofentürdichtung", "Ausgewähltes Herd-Set anfragen"],
      },
      {
        name: "Ceran- & Induktionskochfelder",
        description: "Original-Ersatzteile nach Typenschild & ausgewählte Kochfelder auf Anfrage.",
        symptoms: ["Teile-Identifikation nach E-Nr.", "Ausgewähltes Kochfeld anfragen"],
      },
      {
        name: "Dunstabzugshauben",
        description: "Original-Filter, Gebläseteile & Zubehör für Wand- und Flachschirmhauben.",
        symptoms: ["Metallfettfilter & Aktivkohlefilter", "Gebläsemotor & Schalter"],
      },
      {
        name: "Mikrowellen & Dampfgarer",
        description: "Drehteller, Original-Zubehör & ausgewählte Standgeräte auf Anfrage.",
        symptoms: ["Drehteller, Rollenring & Glimmerplatte", "Verfügbarkeit anfragen"],
      },
    ],
  },
  {
    title: "Kaffee und Kleingeräte",
    badge: "Kaffee & Zubehör",
    description: "Original-Ersatzteile, Dichtungen & Pflegezubehör nach Modellnummer.",
    items: [
      {
        name: "Kaffeevollautomaten",
        description: "Brühgruppen, Dichtungen, Pumpen & Zubehör für Jura, DeLonghi, Siemens, Miele u. v. m.",
        symptoms: ["Brühgruppen-Einheit & O-Ringe", "Wasserpumpe & Drainageventil", "Mahlwerk- & Milchsystemteile"],
      },
      {
        name: "Siebträgermaschinen",
        description: "Siebträgerdichtungen, Pumpen und Original-Zubehör.",
        symptoms: ["Gruppendichtung & Duschsieb", "Pumpe & Druckventil"],
      },
      {
        name: "Ausgewählte Kleingeräte",
        description: "Ersatzteile und Zubehör auf persönliche Anfrage.",
        symptoms: ["Teile-Identifikation per Typenschild"],
      },
    ],
  },
  {
    title: "Ersatzmodule & Verkäufergarantie",
    badge: "Module & Garantie",
    description: "Original-Ersatzmodule nach Typenschild sowie Garantieabwicklung für direkt bei Hannachi erworbene Geräte.",
    items: [
      {
        name: "Steuerungs- & Leistungsmodule",
        description: "Original-Ersatzmodule nach persönlichem Typenschild-Abgleich.",
        symptoms: ["Passendes Ersatzmodul nach Typenschild anfragen", "Garantieanfrage für bei Hannachi erworbene Geräte"],
      },
      {
        name: "Inverter- & Motorsteuerungen",
        description: "Original-Steuermodule für Waschmaschinen, Trockner und Kühlgeräte.",
        symptoms: ["Modultyp per Foto vom Typenschild klären"],
      },
      {
        name: "Display- & Bedienblenden",
        description: "Drehwähler, Tastenmodule und Anzeigeeinheiten nach Modellnummer.",
        symptoms: ["Original-Bedieneinheit anfragen"],
      },
    ],
  },
];
