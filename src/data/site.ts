// Single source of truth for business data.
// Mobile-first on-site service model in Osnabrück & surrounding areas:
// Trade & service: An- und Verkauf von Elektrohaushaltsgeräten & Ersatzteilen.
// Mobile on-site service by appointment directly at the customer's home: on-site appliance check & spare parts,
// individual replacement appliance offers with written seller's warranty when an old unit cannot be saved,
// and full warranty & repair service for all appliances sold by Hannachi.

export type ServiceNoticeType = "maintenance" | "vacation";

export type ServiceNotice = {
  active: boolean;
  type: ServiceNoticeType;
  label: string;
  message: string;
};

export const business = {
  name: "Hannachi",
  tagline: "Elektrohaushaltsgeräte & Ersatzteile",
  legalLicense: "An- und Verkauf von Elektrohaushaltsgeräten & Ersatzteilen",
  nonMeisterNotice:
    "Fachhandel & mobiler Vor-Ort-Service für Elektrohaushaltsgeräte & Ersatzteile seit 1990.",
  mobileServiceNotice:
    "Mobiler Vor-Ort-Service nach Terminvereinbarung direkt bei Ihnen zu Hause in Osnabrück & Umgebung.",
  warrantyNotice:
    "An- und Verkauf von Elektrohaushaltsgeräten & Ersatzteilen. Jedes von uns gelieferte Ersatzgerät erhält eine schriftliche Verkäufergarantie – inklusive vollem Garantie- und Reparaturservice für alle bei uns gekauften Geräte.",
  owner: "Kamal Hannachi",
  founded: 1990,
  street: "Iburger Straße 5, Im Hof",
  zip: "49082",
  city: "Osnabrück",
  phoneDisplay: "0170 3493494",
  phoneHref: "tel:+491703493494",
  whatsappHref: "https://wa.me/491703493494",
  hours: "Mo–Sa 08:00–18:00 Uhr (Termine nach Vereinbarung)",
  email: "contact@hannachi.de",
  taxNote: "Alle Konditionen werden transparent vorab mit Ihnen abgestimmt.",
  url: "https://hannachi.de",
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
    lat: 52.2902275,
    lng: 8.0207428,
  },
  serviceNotice: {
    active: false,
    type: "vacation",
    label: "Info",
    message: "Mobiler Vor-Ort-Service in Osnabrück & Umgebung: Rückmeldung per WhatsApp erfolgt zeitnah.",
  } as ServiceNotice,
};

export const yearsOfExperience = new Date().getFullYear() - business.founded;

export const brands = ["Miele", "Bosch", "Siemens", "AEG", "Bauknecht"];

export type CatalogCategory = "appliances" | "parts";

export type CatalogOffer = {
  id: string;
  title: string;
  brand: string;
  category: CatalogCategory;
  deviceType: string;
  conditionBadge: "Geprüft & Aufbereitet" | "Neu · Originalteil";
  warrantyBadge: "Inkl. schriftlicher Garantie";
  specs: string[];
  priceLabel: "Preis auf Anfrage";
  availability: string;
  inquiryPreset: string;
};

export const catalogOffers: CatalogOffer[] = [
  {
    id: "demo-washing-miele-w1",
    title: "Miele W1 Waschmaschine (Frontlader · 8 kg)",
    brand: "Miele",
    category: "appliances",
    deviceType: "Waschmaschine",
    conditionBadge: "Geprüft & Aufbereitet",
    warrantyBadge: "Inkl. schriftlicher Garantie",
    specs: [
      "8 kg Schontrommel · 1.400 U/min · Energieeffizienzklasse A",
      "Vor Verkauf gereinigt, funktionsgeprüft & Verschleißteile kontrolliert",
      "Watercontrol-System (Aquastop) & leiser ProfiEco-Antrieb",
      "Übergabe nach Termin inkl. schriftlicher Verkäufergarantie",
    ],
    priceLabel: "Preis auf Anfrage",
    availability: "Sofort verfügbar in Osnabrück",
    inquiryPreset: "Anfrage / Reservierung: Miele W1 Waschmaschine (Geprüft & Aufbereitet, inkl. schriftlicher Garantie)",
  },
  {
    id: "demo-dishwasher-bosch-serie6",
    title: "Bosch Serie 6 Unterbau-Geschirrspüler (60 cm)",
    brand: "Bosch",
    category: "appliances",
    deviceType: "Geschirrspüler",
    conditionBadge: "Geprüft & Aufbereitet",
    warrantyBadge: "Inkl. schriftlicher Garantie",
    specs: [
      "60 cm Standardbreite · 14 Maßgedecke · VarioSchublade",
      "PerfectDry Zeolith-Trocknung & EcoSilence Drive (42 dB)",
      "Dichtheits-, Heiz- & Pumpentest im eigenen Lager dokumentiert",
      "Inkl. schriftlicher Verkäufergarantie bei Übergabe",
    ],
    priceLabel: "Preis auf Anfrage",
    availability: "Sofort verfügbar in Osnabrück",
    inquiryPreset: "Anfrage / Reservierung: Bosch Serie 6 Geschirrspüler 60 cm (Geprüft & Aufbereitet, inkl. schriftlicher Garantie)",
  },
  {
    id: "demo-cooling-liebherr-nofrost",
    title: "Liebherr CNef 4315 NoFrost Kühl-Gefrierkombination",
    brand: "Liebherr",
    category: "appliances",
    deviceType: "Kühlschrank / Gefriergerät",
    conditionBadge: "Geprüft & Aufbereitet",
    warrantyBadge: "Inkl. schriftlicher Garantie",
    specs: [
      "321 Liter Nutzinhalt · NoFrost-Abtauautomatik · Edelstahl",
      "Kühlkreislauf, Thermostat & Türdichtungen im 24h-Test geprüft",
      "Hygienisch aufbereitet, geruchsfrei & sofort einsatzbereit",
      "Schriftliche Verkäufergarantie ab Übergabe",
    ],
    priceLabel: "Preis auf Anfrage",
    availability: "Sofort verfügbar in Osnabrück",
    inquiryPreset: "Anfrage / Reservierung: Liebherr CNef 4315 NoFrost Kühl-Gefrierkombination (Geprüft & Aufbereitet, inkl. schriftlicher Garantie)",
  },
  {
    id: "demo-oven-siemens-iq500",
    title: "Siemens iQ500 Backofen (71 L · 3D Heißluft plus · 230 V)",
    brand: "Siemens",
    category: "appliances",
    deviceType: "Backofen / Herd",
    conditionBadge: "Geprüft & Aufbereitet",
    warrantyBadge: "Inkl. schriftlicher Garantie",
    specs: [
      "71 Liter Garraum · 3D-Heißluft Plus · Autark (230 V Schuko)",
      "Ringheizkörper, Thermostat & Isolationskontrolle vor Verkauf",
      "Inkl. Backblech, Kombirost & LCD-Display",
      "Mit schriftlicher Verkäufergarantie aus unserem Fachhandel",
    ],
    priceLabel: "Preis auf Anfrage",
    availability: "Sofort verfügbar in Osnabrück",
    inquiryPreset: "Anfrage / Reservierung: Siemens iQ500 Backofen (Geprüft & Aufbereitet, inkl. schriftlicher Garantie)",
  },
  {
    id: "demo-part-bsh-miele-oem",
    title: "Original Heizpumpen, Laugenpumpen & Heizelemente (Bosch · Miele · Siemens · AEG)",
    brand: "Bosch",
    category: "parts",
    deviceType: "Geschirrspüler",
    conditionBadge: "Neu · Originalteil",
    warrantyBadge: "Inkl. schriftlicher Garantie",
    specs: [
      "Fabrikneue Original-Ersatzteile in Erstausrüsterqualität",
      "Exakte Passgenauigkeit durch Abgleich mit Ihrem Typenschild (E-Nr. / PNC)",
      "Pumpen, Heizkörper, Türmanschetten, Thermostate & Dichtungen",
      "Vor-Ort-Ersatzteil-Service nach Terminvereinbarung",
    ],
    priceLabel: "Preis auf Anfrage",
    availability: "Auf Anfrage lieferbar",
    inquiryPreset: "Ersatzteil-Anfrage: Original-Ersatzteil nach Typenschild (E-Nr. / PNC)",
  },
];

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
    short: "Mobiler Vor-Ort-Gerätecheck, passende Ersatzteile & geprüfte Ersatz-Waschmaschinen mit schriftlicher Verkäufergarantie.",
    intro:
      "Ihre Waschmaschine pumpt nicht ab, schleudert nicht oder zeigt eine Fehlermeldung? Wir kommen nach Terminvereinbarung direkt zu Ihnen nach Hause in Osnabrück & Umgebung, prüfen den Ersatzteilbedarf vor Ort oder unterbreiten Ihnen – falls sich das Altgerät nicht mehr lohnt – ein faires Angebot für ein geprüftes Ersatzgerät inklusive schriftlicher Verkäufergarantie.",
    symptoms: [
      "Pumpt nicht ab / Wasser bleibt in der Trommel stehen",
      "Schleudert nicht mehr oder macht laute Laufgeräusche",
      "Türmanschette / Dichtung undicht oder Tür öffnet nicht",
      "Lohnt nicht mehr? Geprüftes Ersatzgerät mit schriftlicher Garantie",
    ],
    approach:
      "Schildern Sie uns kurz das Problem an Ihrer Waschmaschine oder senden Sie das Typenschild (E-Nr.). Herr Hannachi meldet sich persönlich für einen Vor-Ort-Termin bei Ihnen zu Hause.",
    customerNote: {
      quote: "Sehr ehrliche Beratung und super Service vor Ort. Preis-Leistung absolut fair.",
      author: "A. U.",
    },
  },
  {
    slug: "geschirrspueler",
    title: "Geschirrspüler",
    short: "Vor-Ort-Check bei Ihnen zu Hause, passende Ersatzteile & geprüfte Geschirrspüler (45/60 cm) inkl. schriftlicher Garantie.",
    intro:
      "Ihr Geschirrspüler zieht kein Wasser, heizt nicht oder zeigt einen Fehlercode? Im Rahmen unseres mobilen Vor-Ort-Services in Osnabrück klären wir den Ersatzteilbedarf direkt bei Ihnen zu Hause oder bieten Ihnen bei wirtschaftlichem Totalschaden ein geprüftes Ersatzgerät mit schriftlicher Verkäufergarantie an.",
    symptoms: [
      "Geschirr bleibt kalt oder wird nicht sauber / trocken",
      "Wasser steht unten im Spülraum / Fehlercode (z. B. E15, E24)",
      "Heizpumpe, Ablaufpumpe, Aquastop oder Korbrollen benötigt",
      "Geprüfter Ersatz-Geschirrspüler (45 cm / 60 cm) mit schriftlicher Garantie",
    ],
    approach:
      "Teilen Sie uns kurz das Fehlerbild oder die E-Nr. vom Typenschild mit – wir vereinbaren zeitnah einen Vor-Ort-Termin bei Ihnen in Osnabrück.",
    customerNote: {
      quote: "Herr Hannachi konnte schon am Telefon schnell und kostenfrei einen Tipp geben und war pünktlich vor Ort.",
      author: "Roman Osinsky",
    },
  },
  {
    slug: "kuehlschraenke",
    title: "Kühlschränke",
    short: "Schneller Vor-Ort-Termin, passende Ersatzteile (Thermostate, Dichtungen) & geprüfte Kühlgeräte mit schriftlicher Garantie.",
    intro:
      "Wenn Kühlschrank oder Gefriergerät nicht mehr richtig kühlen, zählt schnelle Reaktion. Wir kommen nach Terminabsprache zu Ihnen nach Hause in Osnabrück, versorgen Sie mit passenden Original-Ersatzteilen oder liefern Ihnen kurzfristig ein geprüftes Ersatz-Kühlgerät mit schriftlicher Verkäufergarantie.",
    symptoms: [
      "Kühlt nicht mehr ausreichend oder vereist stark",
      "Thermostat, NTC-Temperaturfühler oder Türdichtung verschlissen",
      "Türscharnier / Schleppscharnier schließt nicht mehr bündig",
      "Schnelles Angebot für ein geprüftes Ersatz-Kühlgerät mit Garantie",
    ],
    approach:
      "Bei Kühlgeräten vergeben wir besonders kurzfristige Vor-Ort-Termine in Osnabrück & Umgebung – einfach per WhatsApp oder Telefon melden.",
  },
  {
    slug: "backoefen",
    title: "Backöfen & Herde",
    short: "Vor-Ort-Service für Backöfen & Herde, passende Heizelemente & Schalter sowie geprüfte Ersatzgeräte mit schriftlicher Garantie.",
    intro:
      "Die Heißluft bleibt kalt, die Unterhitze fällt aus oder die Backofentür schließt nicht mehr richtig? Wir unterstützen Sie mit unserem mobilen Vor-Ort-Service in Osnabrück, liefern passende Original-Ersatzteile nach Typenschild oder bieten Ihnen ein geprüftes Ersatzgerät inklusive schriftlicher Verkäufergarantie.",
    symptoms: [
      "Backofen wird nicht mehr richtig heiß (Umluft / Ober- / Unterhitze)",
      "Ringheizkörper, Backofenschalter, Thermostat oder Türdichtung benötigt",
      "Backofentür schließt nicht mehr dicht (Scharniere / Dichtung)",
      "Geprüfter Ersatz-Backofen oder Herd mit schriftlicher Verkäufergarantie",
    ],
    approach:
      "Wir beraten Sie ehrlich vor Ort bei Ihnen zu Hause: passendes Ersatzteil oder ein geprüftes Austauschgerät mit schriftlicher Garantie.",
    customerNote: {
      quote: "Ich habe angerufen und konnte schnell einen Termin vereinbaren. Ehrliche Beratung und fairer Preis.",
      author: "Pia B",
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
  { href: "/leistungen", label: "Service & Geräte" },
  { href: "/kundenbewertungen", label: "Bewertungen" },
  { href: "/ueber-uns", label: "Über uns" },
  { href: "/kontakt", label: "Kontakt" },
];

export const sparePartsHighlights = [
  {
    title: "Mobiler Vor-Ort-Service beim Kunden",
    desc: "Wir kommen nach Terminvereinbarung direkt zu Ihnen nach Hause in Osnabrück & Umgebung.",
  },
  {
    title: "Passende Ersatzteile aller Marken",
    desc: "Original- & Qualitäts-Ersatzteile nach Typenschild (E-Nr. / PNC) für Bosch, Siemens, Miele, AEG, Bauknecht, Liebherr, Neff u. v. m.",
  },
  {
    title: "Ersatzgerät-Angebot falls unrentabel",
    desc: "Wenn sich Ihr Altgerät nicht mehr retten lässt, bieten wir Ihnen auf Wunsch ein geprüftes Ersatzgerät aus unserem Bestand an.",
  },
  {
    title: "Schriftliche Verkäufergarantie",
    desc: "Jedes bei uns gekaufte Ersatzgerät erhält eine schriftliche Verkäufergarantie – inklusive vollem Garantie- & Reparaturservice durch uns.",
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
      "Türverriegelungen & Elektronikmodule",
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
    description: "An- und Verkauf geprüfter Waschmaschinen & Trockner inkl. schriftlicher Verkäufergarantie sowie Original-Ersatzteile.",
    items: [
      {
        name: "Waschmaschinen & Toplader",
        description: "Geprüfte Frontlader, Toplader und Original-Ersatzteile aller Fabrikate.",
        symptoms: ["Laugenpumpe / Ablaufpumpe", "Türmanschette / Dichtung", "Heizstab & NTC-Sensor", "Motorkohlen & Stoßdämpfer", "Geprüftes Gebrauchtgerät anfragen"],
      },
      {
        name: "Wäschetrockner",
        description: "Wärmepumpentrockner, Kondenstrockner und Ersatzteile aller Hersteller.",
        symptoms: ["Kondensatpumpe & Sensor", "Anlaufkondensator", "Türschloss & Flusensieb", "Geprüften Trockner anfragen"],
      },
      {
        name: "Waschtrockner (2-in-1)",
        description: "Kombinierte Wasch- und Trockengeräte sowie Zubehörteile.",
        symptoms: ["Pumpen- & Ventileinheit", "Dichtungen & Riemen", "Verfügbarkeit anfragen"],
      },
    ],
  },
  {
    title: "Geschirr spülen",
    badge: "Küche",
    description: "An- und Verkauf geprüfter Geschirrspüler inkl. schriftlicher Garantie sowie Ersatzteile ab Lager.",
    items: [
      {
        name: "Geschirrspüler (45 cm & 60 cm)",
        description: "Vollintegrierte, teilintegrierte, Unterbau- und Stand-Spülmaschinen.",
        symptoms: ["Umwälzpumpe / Heizpumpe", "Aquastop-Zulaufschlauch", "Korbrollen & Sprüharme", "Geprüften Geschirrspüler anfragen"],
      },
      {
        name: "Büro- & Kleingewerbespüler",
        description: "Geprüfte Spülmaschinen und Ersatzteile für Teeküchen und Büros.",
        symptoms: ["Dosierkammer & Dichtungen", "Ablaufpumpe", "Geräteangebot anfragen"],
      },
    ],
  },
  {
    title: "Kühlen und Gefrieren",
    badge: "Kühltechnik",
    description: "Geprüfte Kühl- und Gefriergeräte mit schriftlicher Verkäufergarantie sowie passende Ersatzteile.",
    items: [
      {
        name: "Kühlschränke",
        description: "Unterbau- und Standkühlschränke mit und ohne Gefrierfach.",
        symptoms: ["Thermostat & NTC-Fühler (Teileverkauf)", "Magnet-Türdichtung", "Schleppscharnier-Satz", "Geprüften Kühlschrank anfragen"],
      },
      {
        name: "Gefrierschränke & Gefriertruhen",
        description: "NoFrost-Gefrierschränke, Tiefkühltruhen und Ersatzteile.",
        symptoms: ["Lüftermotor & Startrelais (Teileverkauf)", "Gefrierfachklappen & Schubladen", "Geräteverfügbarkeit anfragen"],
      },
      {
        name: "Side-by-Side & Kühl-Gefrierkombis",
        description: "Großraum-Kühlgeräte und Original-Zubehörteile.",
        symptoms: ["Wasserfilter & Magnetventil", "Türdichtungen", "Bestandsgerät anfragen"],
      },
    ],
  },
  {
    title: "Kochen, Backen und Lüften",
    badge: "Küche & Hitze",
    description: "Geprüfte Backöfen, Herde & Kochfelder inkl. schriftlicher Garantie sowie Original-Ersatzteile (ohne Einbau / ohne Anschluss).",
    items: [
      {
        name: "Backöfen",
        description: "Umluft-, Heißluft- und autarke Backöfen sowie Heizelemente im Teileverkauf.",
        symptoms: ["Heißluft-Ringheizkörper", "Ober-/Unterhitze-Element", "Backofenschalter & Thermostat", "Geprüften Backofen anfragen"],
      },
      {
        name: "Elektro- & Standherde",
        description: "Klassische Standherde und Herd-Kombinationen inkl. schriftlicher Garantie.",
        symptoms: ["Energieregler & Kochplatten", "Backofentürdichtung", "Geprüftes Herd-Set anfragen"],
      },
      {
        name: "Ceran- & Induktionskochfelder",
        description: "Autarke Glaskeramik- und Induktionsfelder sowie Ersatzteile nach Typenschild.",
        symptoms: ["Teile-Identifikation nach E-Nr.", "Geprüftes Kochfeld anfragen"],
      },
      {
        name: "Dunstabzugshauben",
        description: "Wandhauben, Flachschirmhauben und Filter-/Motorenteile.",
        symptoms: ["Metallfettfilter & Aktivkohlefilter", "Gebläsemotor & Schalter (Teileverkauf)"],
      },
      {
        name: "Mikrowellen & Dampfgarer",
        description: "Standgeräte sowie Drehteller und Original-Zubehör.",
        symptoms: ["Drehteller, Rollenring & Glimmerplatte", "Verfügbarkeit anfragen"],
      },
    ],
  },
  {
    title: "Kaffee und Kleingeräte",
    badge: "Kaffee & Zubehör",
    description: "Original-Ersatzteile, Pflegezubehör und geprüfte Geräte auf Anfrage.",
    items: [
      {
        name: "Kaffeevollautomaten",
        description: "Brühgruppen, Dichtungen, Pumpen & Zubehör für Jura, DeLonghi, Siemens, Miele u. v. m.",
        symptoms: ["Brühgruppen-Einheit & O-Ringe", "Wasserpumpe & Drainageventil", "Mahlwerk- & Milchsystemteile"],
      },
      {
        name: "Siebträgermaschinen",
        description: "Siebträgerdichtungen, Vibrationspumpen und Zubehör.",
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
    title: "Elektronikmodule & Verkäufergarantie",
    badge: "Ersatzteile & Garantie",
    description: "Original-Steuerungsmodule, Relais und Elektronikbauteile im Teileverkauf sowie Garantieabwicklung ausschließlich für bei uns gekaufte Geräte.",
    items: [
      {
        name: "Steuerungsplatinen & Leistungsmodule",
        description: "Ersatz-Steuermodule und elektronische Bauteile nach Typenschild-Abgleich.",
        symptoms: ["Passendes Steuermodul per E-Nr. anfragen", "Garantiefall für bei uns gekaufte Geräte"],
      },
      {
        name: "Inverter- & Motorsteuerungen",
        description: "Original-Elektronikmodule für Waschmaschinen, Trockner und Kühlgeräte.",
        symptoms: ["Modultyp per Foto vom Typenschild klären"],
      },
      {
        name: "Display- & Bedienmodule",
        description: "Drehwähler, Tastenmodule und Anzeigeeinheiten.",
        symptoms: ["Original-Bedieneinheit anfragen"],
      },
    ],
  },
];
