export type GoogleMapsTopicKey =
  | "waschmaschinenreparatur"
  | "schnelle_terminvergabe"
  | "schnelle_hilfe"
  | "ersatzteile"
  | "schnelle_problemloesung"
  | "telefonische_beratung"
  | "ehrliche_beratung"
  | "schnelle_reparatur"
  | "kompetente_reparatur"
  | "schnelle_abwicklung";

export interface GoogleMapsTopicChip {
  id: GoogleMapsTopicKey;
  label: string;
  enLabel: string;
  count: number;
}

/**
 * Google Maps Review Topic Filter Chips for Hannachi Elektrohaushaltsgeräte Service
 */
export const GOOGLE_MAPS_TOPIC_CHIPS: GoogleMapsTopicChip[] = [
  {
    id: "waschmaschinenreparatur",
    label: "Waschmaschinenreparatur",
    enLabel: "washing machine repair",
    count: 3,
  },
  {
    id: "schnelle_terminvergabe",
    label: "Schnelle Terminvergabe",
    enLabel: "quick appointment scheduling",
    count: 3,
  },
  {
    id: "schnelle_hilfe",
    label: "Schnelle Hilfe",
    enLabel: "quick help",
    count: 3,
  },
  {
    id: "ersatzteile",
    label: "Ersatzteile",
    enLabel: "spare parts",
    count: 2,
  },
  {
    id: "schnelle_problemloesung",
    label: "Schnelle Problemlösung",
    enLabel: "fast problem solving",
    count: 3,
  },
  {
    id: "telefonische_beratung",
    label: "Telefonische Beratung",
    enLabel: "phone consultation",
    count: 2,
  },
  {
    id: "ehrliche_beratung",
    label: "Ehrliche Beratung",
    enLabel: "honest advice",
    count: 3,
  },
  {
    id: "schnelle_reparatur",
    label: "Schnelle Reparatur",
    enLabel: "quick repair",
    count: 2,
  },
  {
    id: "kompetente_reparatur",
    label: "Kompetente Reparatur",
    enLabel: "competent repair",
    count: 3,
  },
  {
    id: "schnelle_abwicklung",
    label: "Schnelle Abwicklung",
    enLabel: "fast processing",
    count: 1,
  },
];

export interface DetailedGoogleReview {
  id: string;
  author: string;
  authorPhotoUri?: string;
  rating: number;
  text: string;
  textEn?: string;
  relativeTime: string;
  isNew?: boolean;
  serviceTag: string;
  localGuide?: string;
  ownerReply?: string;
  category:
    | "waschmaschine"
    | "geschirrspueler"
    | "backofen"
    | "kuehlen_trocknen"
    | "gebraucht_beratung";
  topicTags?: GoogleMapsTopicKey[];
  likesCount?: number;
  verified: boolean;
}

/**
 * Verified real Google Maps customer reviews for Hannachi Elektrohaushaltsgeräte Service (Osnabrück).
 * Only authentic reviewer names and texts published on Google Maps / hannachi.de are included.
 */
export const googleReviews82: DetailedGoogleReview[] = [
  {
    id: "google-review-myra-bonnici",
    author: "Myra Bonnici",
    rating: 5,
    text: "Schnelle Terminvergabe und super Service! Unsere Waschmaschine wurde noch am nächsten Tag repariert. Sehr freundlich, kompetent und preislich absolut fair.",
    textEn:
      "Quick appointment scheduling and super service! Our washing machine was repaired the very next day. Very friendly, competent and absolutely fair pricing.",
    relativeTime: "Auf Google Maps",
    isNew: true,
    serviceTag: "Waschmaschine",
    localGuide: "Local Guide · 53 Fotos",
    ownerReply:
      "Herzlichen Dank für Ihre Bewertung, Frau Bonnici! Schön, dass die Waschmaschine wieder einwandfrei läuft.",
    category: "waschmaschine",
    topicTags: ["waschmaschinenreparatur", "schnelle_terminvergabe", "schnelle_reparatur"],
    likesCount: 3,
    verified: true,
  },
  {
    id: "google-review-viktoria-puskar",
    author: "Viktoria Puskar",
    rating: 5,
    text: "Exzellenter Service! Das Preis-Leistungs-Verhältnis stimmt zu 100 %. Sehr effizient und zuverlässig!",
    textEn:
      "Excellent service! The price-performance ratio is 100% spot on. Very efficient and reliable!",
    relativeTime: "Auf Google Maps",
    serviceTag: "Geräte & Ersatzteile",
    localGuide: "6 Rezensionen",
    ownerReply:
      "Vielen Dank für das tolle Feedback, Frau Puskar! Wir helfen jederzeit gerne wieder.",
    category: "waschmaschine",
    topicTags: ["schnelle_hilfe", "schnelle_problemloesung"],
    likesCount: 4,
    verified: true,
  },
  {
    id: "google-review-debeka",
    author: "Debeka Servicebüro",
    authorPhotoUri:
      "https://lh3.googleusercontent.com/a-/ALV-UjVRGfwgGJu-nJbQBNzHaTMEvMx0NUKvAZbxW_Xk7drmDA=w40-h40-c-rp-mo-br100",
    rating: 5,
    text: "Spontaner Termin, gute Beratung und volle Fachkenntnis. Dieser Mann ist das Geld wert!",
    textEn: "Spontaneous appointment, good advice and full expertise. This man is worth the money!",
    relativeTime: "Auf Google Maps",
    serviceTag: "Vor-Ort-Service",
    localGuide: "Local Guide · 14 Rezensionen",
    ownerReply: "Vielen Dank für Ihr Vertrauen und die freundliche Bewertung!",
    category: "gebraucht_beratung",
    topicTags: ["schnelle_terminvergabe", "ehrliche_beratung"],
    likesCount: 2,
    verified: true,
  },
  {
    id: "google-review-au",
    author: "A. U.",
    authorPhotoUri:
      "https://lh3.googleusercontent.com/a/ACg8ocL_GF6tORgH8zuGMBYOA094xPxeVgqgSrNjm7ku-VGPmQ=w40-h40-c-rp-mo-ba3-br100",
    rating: 5,
    text: "Defekte Waschmaschine: Hat sie am nächsten Tag schnell und kompetent repariert. Preis war vollkommen in Ordnung. Absolute Empfehlung!",
    textEn:
      "Defective washing machine: Repaired it quickly and competently the next day. Price was completely reasonable. Absolute recommendation!",
    relativeTime: "Auf Google Maps",
    serviceTag: "Waschmaschine",
    ownerReply:
      "Herzlichen Dank! Freut mich, dass die Maschine wieder einwandfrei läuft.",
    category: "waschmaschine",
    topicTags: [
      "waschmaschinenreparatur",
      "schnelle_reparatur",
      "kompetente_reparatur",
    ],
    likesCount: 5,
    verified: true,
  },
  {
    id: "google-review-roman-osinsky",
    author: "Roman Osinsky",
    authorPhotoUri:
      "https://lh3.googleusercontent.com/a/ACg8ocLniwLdcsZsitF8_Y7ARX-li8mLRweDzZswkXus01om=w40-h40-c-rp-mo-br100",
    rating: 5,
    text: 'Herr Hannachi konnte schon am Telefon schnell und kostenfrei einen Tipp geben, wie wir unseren Geschirrspüler mit ein paar Handgriffen wieder zum Laufen bringen. So geht "Kundenbindung".',
    textEn:
      'Mr. Hannachi was able to quickly and free of charge give a tip over the phone on how to get our dishwasher running again in a few simple steps. That is true customer loyalty.',
    relativeTime: "Auf Google Maps",
    serviceTag: "Geschirrspüler",
    localGuide: "Local Guide · 29 Rezensionen",
    ownerReply:
      "Sehr gerne! Wenn sich ein Fehler schon telefonisch lösen lässt, helfe ich natürlich sofort.",
    category: "geschirrspueler",
    topicTags: [
      "telefonische_beratung",
      "schnelle_hilfe",
      "ehrliche_beratung",
      "schnelle_problemloesung",
    ],
    likesCount: 8,
    verified: true,
  },
  {
    id: "google-review-pia-b",
    author: "Pia B",
    authorPhotoUri:
      "https://lh3.googleusercontent.com/a/ACg8ocJ8KpECRfkkJ5uMAKOzPGmaAj1bLjb03x067zdyN_lV=w40-h40-c-rp-mo-br100",
    rating: 5,
    text: "Unser Backofen war kaputt. Ich habe angerufen und konnte direkt einen Termin für den nächsten Tag bekommen. Insgesamt hat alles nur 35€ gekostet, da das Teil wohl relativ einfach zu reparieren war. Andere Handwerker hätten einen da vielleicht noch abgezockt. Herr Hannachi war freundlich und die Kommunikation via WhatsApp war sehr unkompliziert. Leider hatte ich ihm die falsche Hausnummer geschrieben (bin wohl auf der Tastatur eine Taste zu weit nach links gekommen... Sorry dafür!). Trotzdem hat Herr Hannachi sich zu uns durchgefragt und uns z. B. keine erneute Anfahrt in Rechnung gestellt.",
    textEn:
      "Our oven was broken. I called and got an appointment for the very next day. In total everything cost only €35 because the part was relatively easy to fix. Other technicians might have overcharged. Mr. Hannachi was friendly and communication via WhatsApp was super easy.",
    relativeTime: "Auf Google Maps",
    serviceTag: "Backofen",
    ownerReply:
      "Vielen lieben Dank für die ausführliche Rückmeldung! Schön, dass der Backofen wieder funktioniert.",
    category: "backofen",
    topicTags: [
      "schnelle_terminvergabe",
      "ehrliche_beratung",
      "schnelle_problemloesung",
    ],
    likesCount: 11,
    verified: true,
  },
  {
    id: "google-review-wayfarer",
    author: "Wayfarer",
    authorPhotoUri:
      "https://lh3.googleusercontent.com/a/ACg8ocLoOIvFqDYj9HN9XnQ6udIjT41V0psY1buuHiRaz3OEWw=w40-h40-c-rp-mo-br100",
    rating: 5,
    text: "Super netter und kompetenter Mann wenn es um Elektrohaushaltsgeräte geht. Kennt sich sehr gut aus, verkauft Geräte und kauft sie auch ab. Bei defekten hilft er mit seinem Fachwissen und Ersatzteilen bei der Reparatur für faire Preise. Auch am Telefon sehr nette und ausführliche Auskunft.",
    textEn:
      "Super nice and competent man when it comes to household appliances. Knows his craft inside out, sells and buys appliances, and helps with spare parts and repairs at fair prices. Also very friendly and detailed phone consultation.",
    relativeTime: "Auf Google Maps",
    serviceTag: "Geräte & Ersatzteile",
    localGuide: "Local Guide · 64 Rezensionen",
    category: "gebraucht_beratung",
    topicTags: ["ersatzteile", "telefonische_beratung", "kompetente_reparatur"],
    likesCount: 6,
    verified: true,
  },
  {
    id: "google-review-betty-danny",
    author: "Betty Danny",
    authorPhotoUri:
      "https://lh3.googleusercontent.com/a/ACg8ocKUoSw9wYkTGDW9zkYZovvnOCH4pmtLR7YdSTJXHMKJ=w40-h40-c-rp-mo-br100",
    rating: 5,
    text: "😃😃😃😃👍👍👍👍",
    relativeTime: "Auf Google Maps",
    serviceTag: "Google Maps",
    category: "gebraucht_beratung",
    verified: true,
  },
  {
    id: "google-review-raphattack",
    author: "Raphattack",
    authorPhotoUri:
      "https://lh3.googleusercontent.com/a/ACg8ocKsswVLCCZp-w2ZaIrzUfNGSfEZP_dzB0FpxMmEI1uV=w40-h40-c-rp-mo-br100",
    rating: 5,
    text: "Sehr kompetent!",
    textEn: "Very competent!",
    relativeTime: "Auf Google Maps",
    serviceTag: "Kundendienst",
    localGuide: "Local Guide · 19 Rezensionen",
    category: "gebraucht_beratung",
    topicTags: ["kompetente_reparatur"],
    likesCount: 1,
    verified: true,
  },
  {
    id: "google-review-dominik-gawehn",
    author: "Dominik Gawehn",
    authorPhotoUri:
      "https://lh3.googleusercontent.com/a/ACg8ocLC4EP3UfLO7NOvcQrQRUI_y0iGJ5PW-JOm2qZpEeb8=w40-h40-c-rp-mo-br100",
    rating: 5,
    text: "Dankeschön Herr Hannachi! Toller Service, preiswert, schnelle Abwicklung. Sehr empfehlenswert!",
    textEn:
      "Thank you Mr. Hannachi! Great service, fair price, fast processing. Highly recommended!",
    relativeTime: "Auf Google Maps",
    serviceTag: "Geräte & Ersatzteile",
    ownerReply: "Ich danke Ihnen! Jederzeit gerne wieder.",
    category: "waschmaschine",
    topicTags: ["waschmaschinenreparatur", "schnelle_abwicklung", "schnelle_hilfe", "ersatzteile"],
    likesCount: 4,
    verified: true,
  },
];
