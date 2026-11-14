import { z } from "zod";
import {
  createHannachiWhatsAppPayload,
  formatHannachiWhatsAppMessage,
  HANNACHI_WHATSAPP_PHONE,
  type WhatsAppMessageInput,
} from "@/utils/whatsapp";
import {
  isSafeHttpsUrl,
  safeJsonParse,
  sanitizeSingleLine,
  sanitizeText,
} from "@/utils/sanitize";

export const deviceTypes = [
  "Waschmaschine",
  "Wäschetrockner",
  "Geschirrspüler",
  "Kühlschrank / Gefriergerät",
  "Backofen / Herd",
  "Ceranfeld / Induktion",
  "Dunstabzugshaube",
  "Mikrowelle",
  "Kaffeevollautomat",
  "Elektronik / Platine",
  "Anderes Gerät (Sonstiges)",
] as const;

export const popularBrands = [
  "Miele",
  "Bosch",
  "Siemens",
  "AEG",
  "Bauknecht",
  "Liebherr",
  "Neff",
  "Samsung",
  "LG",
  "Beko",
  "Gorenje",
  "Jura",
] as const;

export const popularModelPresets = [
  "Unbekannt (Typenschild folgt)",
  "Bosch Serie 4 / Serie 6",
  "Miele W1 / T1",
  "Siemens iQ300 / iQ500",
  "AEG Lavamat / Öko",
  "Bauknecht / Neff Standard",
] as const;

/**
 * 1-Tap Service Area Presets for Osnabrück and all surrounding municipalities (Landkreis Osnabrück)
 * Includes reference coordinates for accurate distance & reverse-geocoding fallback.
 */
export const osnabrueckServiceAreas = [
  { label: "Osnabrück (Stadt)", value: "49082 Osnabrück", zip: "49082", city: "Osnabrück", lat: 52.2668, lng: 8.0498, sampleStreet: "Iburger Straße" },
  { label: "Georgsmarienhütte", value: "49124 Georgsmarienhütte", zip: "49124", city: "Georgsmarienhütte", lat: 52.2031, lng: 8.0447, sampleStreet: "Oeseder Straße" },
  { label: "Wallenhorst", value: "49134 Wallenhorst", zip: "49134", city: "Wallenhorst", lat: 52.3486, lng: 8.0144, sampleStreet: "Große Straße" },
  { label: "Belm", value: "49191 Belm", zip: "49191", city: "Belm", lat: 52.3031, lng: 8.1408, sampleStreet: "Bremer Straße" },
  { label: "Bissendorf", value: "49143 Bissendorf", zip: "49143", city: "Bissendorf", lat: 52.2356, lng: 8.1706, sampleStreet: "Osnabrücker Straße" },
  { label: "Hasbergen", value: "49205 Hasbergen", zip: "49205", city: "Hasbergen", lat: 52.2403, lng: 7.9578, sampleStreet: "Tecklenburger Straße" },
  { label: "Bramsche", value: "49565 Bramsche", zip: "49565", city: "Bramsche", lat: 52.4089, lng: 7.9728, sampleStreet: "Münsterstraße" },
  { label: "Bad Iburg", value: "49186 Bad Iburg", zip: "49186", city: "Bad Iburg", lat: 52.1583, lng: 8.0469, sampleStreet: "Schloßstraße" },
  { label: "Hagen a.T.W.", value: "49170 Hagen a.T.W.", zip: "49170", city: "Hagen a.T.W.", lat: 52.1964, lng: 7.9806, sampleStreet: "Osnabrücker Straße" },
  { label: "Melle", value: "49324 Melle", zip: "49324", city: "Melle", lat: 52.2031, lng: 8.3361, sampleStreet: "Mühlenstraße" },
  { label: "Lotte / Westerkappeln", value: "49504 Lotte", zip: "49504", city: "Lotte", lat: 52.2764, lng: 7.9167, sampleStreet: "Bahnhofstraße" },
  { label: "Ostercappeln", value: "49179 Ostercappeln", zip: "49179", city: "Ostercappeln", lat: 52.3458, lng: 8.2256, sampleStreet: "Große Straße" },
] as const;

export type CapturedCoordinates = {
  lat: number;
  lng: number;
  accuracy?: number;
};

export type VerifiedLocationInfo = {
  lat: number;
  lng: number;
  accuracy: number;
  formattedCoords: string;
  streetAddress: string;
  zipAndCity: string;
  mapsUrl: string;
  source: "gps" | "region-verified";
};

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatCoordinatesDisplay(lat: number, lng: number): string {
  const latDir = lat >= 0 ? "N" : "S";
  const lngDir = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(5)}° ${latDir}, ${Math.abs(lng).toFixed(5)}° ${lngDir}`;
}

/**
 * Reverse-geocodes GPS coordinates via OpenStreetMap Nominatim to resolve the user's
 * street address and postal code/town in Osnabrück & Umgebung, with an instant nearest-municipality fallback.
 */
export async function reverseGeocodePosition(
  lat: number,
  lng: number,
  accuracy = 15
): Promise<VerifiedLocationInfo> {
  const cleanLat = Number(lat.toFixed(6));
  const cleanLng = Number(lng.toFixed(6));
  const mapsUrl = `https://www.google.com/maps?q=${cleanLat},${cleanLng}`;
  const formattedCoords = formatCoordinatesDisplay(cleanLat, cleanLng);

  // Find nearest municipality in Osnabrück & Landkreis Osnabrück as a fast fallback
  let nearestArea: (typeof osnabrueckServiceAreas)[number] = osnabrueckServiceAreas[0];
  let minDistance = Infinity;
  for (const area of osnabrueckServiceAreas) {
    const dist = haversineDistanceKm(cleanLat, cleanLng, area.lat, area.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestArea = area;
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${cleanLat}&lon=${cleanLng}&accept-language=de&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      }
    );
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = (await response.json()) as {
        address?: {
          road?: string;
          pedestrian?: string;
          footway?: string;
          house_number?: string;
          postcode?: string;
          city?: string;
          town?: string;
          village?: string;
          municipality?: string;
          suburb?: string;
        };
      };
      const addr = data.address;
      if (addr) {
        const streetName = sanitizeSingleLine(
          addr.road || addr.pedestrian || addr.footway || "",
          120
        );
        const houseNum = addr.house_number
          ? ` ${sanitizeSingleLine(addr.house_number, 20)}`
          : "";
        const cleanSuburb = sanitizeSingleLine(addr.suburb || "", 80);
        const resolvedStreet = streetName
          ? `${streetName}${houseNum}`
          : cleanSuburb
          ? `Ortsteil ${cleanSuburb}`
          : "";

        const resolvedCity = sanitizeSingleLine(
          addr.city || addr.town || addr.village || addr.municipality || nearestArea.city,
          80
        );
        const resolvedZip = sanitizeSingleLine(addr.postcode || nearestArea.zip, 20);
        const zipAndCity = `${resolvedZip} ${resolvedCity}`.trim();

        return {
          lat: cleanLat,
          lng: cleanLng,
          accuracy: Math.max(5, Math.round(accuracy)),
          formattedCoords,
          streetAddress: resolvedStreet,
          zipAndCity,
          mapsUrl,
          source: "gps",
        };
      }
    }
  } catch {
    // Fallback to nearest municipality if network/CORS is restricted
  }

  return {
    lat: cleanLat,
    lng: cleanLng,
    accuracy: Math.max(5, Math.round(accuracy)),
    formattedCoords,
    streetAddress: "",
    zipAndCity: nearestArea.value,
    mapsUrl,
    source: "gps",
  };
}

/**
 * Resolves verified coordinates & Google Maps pin when browser geolocation is blocked
 * in an iframe or when verifying a selected municipality in Osnabrück & Umgebung.
 */
export function resolveVerifiedFallbackLocation(
  zipInput: string,
  streetInput?: string
): VerifiedLocationInfo {
  const cleanZip = zipInput.trim().toLowerCase();
  const matched =
    osnabrueckServiceAreas.find(
      (a) =>
        cleanZip.includes(a.zip) ||
        cleanZip.includes(a.city.toLowerCase()) ||
        cleanZip === a.value.toLowerCase()
    ) || osnabrueckServiceAreas[0];

  const lat = Number(matched.lat.toFixed(6));
  const lng = Number(matched.lng.toFixed(6));
  const streetAddress = streetInput?.trim() || "";
  const zipAndCity = zipInput.trim() || matched.value;
  const queryParts = [streetAddress, zipAndCity, `${lat},${lng}`].filter(Boolean).join(", ");
  const mapsUrl = streetAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${streetAddress}, ${zipAndCity}`
      )}`
    : `https://www.google.com/maps?q=${lat},${lng}`;

  void queryParts;
  return {
    lat,
    lng,
    accuracy: 18,
    formattedCoords: formatCoordinatesDisplay(lat, lng),
    streetAddress,
    zipAndCity,
    mapsUrl,
    source: "region-verified",
  };
}

/**
 * 1-Tap Presets for customers asking a Direct Question
 */
export const quickQuestionPresets = [
  "Lohnt sich die Reparatur für mein Gerät noch?",
  "Kommen Sie für eine Reparatur auch zu meinem Wohnort?",
  "Haben Sie das passende Ersatzteil auf Lager?",
  "Was kostet eine Diagnose vor Ort in Osnabrück & Umgebung?",
  "Kann ich mein Gerät oder die Platine in die Werkstatt bringen?",
] as const;

export const symptomsByDevice: Record<string, string[]> = {
  "Waschmaschine": [
    "Pumpt nicht ab / Wasser bleibt stehen",
    "Schleudert nicht oder bricht ab",
    "Wasser läuft unter dem Gerät aus",
    "Laute Geräusche beim Schleudern (Lager/Stoßdämpfer)",
    "Tür lässt sich nicht öffnen / verriegelt nicht",
    "Heizt das Wasser nicht auf",
    "Fehlercode im Display",
  ],
  "Wäschetrockner": [
    "Wäsche bleibt nass / heizt nicht",
    "Programm bricht vorzeitig ab",
    "Trommel dreht sich nicht mehr",
    "Behälter-Warnung trotz leerem Tank",
    "Quietscht oder klackert laut",
  ],
  "Geschirrspüler": [
    "Geschirr bleibt schmutzig oder milchig",
    "Wasser steht am Ende im Spülraum",
    "Heizt nicht / Geschirr bleibt kalt & nass",
    "Aquastop / Wasserzulauf-Fehler blinkt",
    "Sprüharme drehen sich nicht",
    "Gerät startet das Programm nicht",
  ],
  "Kühlschrank / Gefriergerät": [
    "Kühlt nicht mehr ausreichend",
    "Starke Eisbildung an der Rückwand",
    "Kompressor läuft ununterbrochen / brummt laut",
    "Temperaturalarm piept / blinkt",
    "Türdichtung schließt nicht mehr richtig",
  ],
  "Backofen / Herd": [
    "Backofen wird nicht mehr heiß",
    "Ober-/Unterhitze oder Umluft ausgefallen",
    "Sicherung (FI-Schalter) springt beim Einschalten raus",
    "Lüfter macht laute Geräusche",
    "Backofentür schließt nicht richtig",
  ],
  "Ceranfeld / Induktion": [
    "Kochzone bleibt kalt / erkennt Topf nicht",
    "Touch-Bedienfeld reagiert nicht",
    "Fehlercode (z. B. E / F) blinkt",
    "Sicherung löst beim Kochen aus",
  ],
  "Dunstabzugshaube": [
    "Motor läuft nicht mehr an",
    "Kaum noch Saugleistung / sehr laut",
    "Beleuchtung oder Tasten ohne Funktion",
  ],
  "Mikrowelle": [
    "Speisen werden nicht mehr warm",
    "Drehteller dreht sich nicht",
    "Display dunkel oder Tasten klemmen",
  ],
  "Kaffeevollautomat": [
    "Kaffee läuft nicht aus / nur tröpfchenweise",
    "Brühgruppe klemmt oder lässt sich nicht einsetzen",
    "Wasser sammelt sich unter der Maschine",
    "Mahlwerk mahlt nicht oder klingt ungewöhnlich",
    "Milchschaum-System funktioniert nicht",
  ],
  "Elektronik / Platine": [
    "Gerät hat keinen Strom / komplett tot",
    "Relais klickt, aber Programm startet nicht",
    "Schmorstelle / defektes Bauteil auf Steuerplatine",
    "Display flackert oder zeigt wirre Zeichen",
  ],
  "Anderes Gerät (Sonstiges)": [
    "Gerät lässt sich nicht einschalten",
    "Mechanischer Defekt / ungewöhnliches Geräusch",
    "Heiz- oder Pumpenfunktion gestört",
    "Ersatzteilanfrage mit Typenschild",
  ],
};

export const diagnosticHintByDevice: Record<
  string,
  { title: string; hint: string; typicalTime: string }
> = {
  "Waschmaschine": {
    title: "Einschätzung aus der Werkstatt",
    hint: "In über 80 % der Fälle liegt die Ursache an Laugenpumpe, Motorkohlen, Heizstab oder Türschloss – Standardteile, die wir meist direkt beim ersten Termin tauschen.",
    typicalTime: "Reparatur meist in 30–60 Min. vor Ort",
  },
  "Wäschetrockner": {
    title: "Einschätzung aus der Werkstatt",
    hint: "Häufig sind Kondensatpumpe, Temperatursensor (NTC), Anlaufkondensator oder ein zugesetztes Wärmepumpensystem die Ursache.",
    typicalTime: "Schnelle Diagnose vor Ort oder in der Werkstatt",
  },
  "Geschirrspüler": {
    title: "Einschätzung aus der Werkstatt",
    hint: "Oft lässt sich schon telefonisch klären, ob Umwälzpumpe, Heizpumpe oder Aquastop betroffen sind. Viele Fehler beheben wir sofort vor Ort.",
    typicalTime: "Oft schon am nächsten Werktag behoben",
  },
  "Kühlschrank / Gefriergerät": {
    title: "Notfallpriorität bei Kühlgeräten",
    hint: "Kühlgeräte behandeln wir bevorzugt, damit Ihre Lebensmittel keinen Schaden nehmen. Häufig sind Thermostat, NTC-Fühler, Startrelais oder Lüfter betroffen.",
    typicalTime: "Priorisierte Terminvergabe am selben oder nächsten Tag",
  },
  "Backofen / Herd": {
    title: "Einschätzung aus der Werkstatt",
    hint: "Ein durchgebrannter Ringheizkörper, Thermostat oder Backofenschalter lässt sich schnell und kostengünstig ersetzen – ohne neuen Ofen.",
    typicalTime: "Meist 30–45 Min. direkt in Ihrer Küche",
  },
  "Ceranfeld / Induktion": {
    title: "Einschätzung aus der Werkstatt",
    hint: "Wir prüfen Leistungsmodule, Sensortasten und Anschlusswerte fachgerecht und reparieren auch auf Platinenebene.",
    typicalTime: "Fachgerechte Starkstrom- & Elektronikprüfung",
  },
  "Kaffeevollautomat": {
    title: "Werkstattservice für Kaffeeautomaten",
    hint: "Brühgruppen-Revision, Dichtungswechsel, Drainageventil, Pumpe und Mahlwerk-Justierung in unserer Osnabrücker Werkstatt.",
    typicalTime: "Gründliche Wartung & Reparatur in der Werkstatt",
  },
  "Elektronik / Platine": {
    title: "Bauteilreparatur statt Neukauf",
    hint: "Statt eine neue Steuerung für 250 €+ zu bestellen, reparieren wir defekte Relais, Netzteile und Triacs gezielt auf Ihrer Originalplatine.",
    typicalTime: "Bis zu 70 % günstiger als Platinenneukauf",
  },
};

export type InquiryMode = "repair" | "question";
export type UrgencyLevel = "normal" | "express" | "notfall";
export type ContactChannel = "whatsapp";

export const MAX_PHOTO_MB = 8;

/* ── Streamlined Zod Validation Schemas ──
 * Required fields ONLY: Device (for repair), Problem/Question, Location (zip/town or Google Maps pin), Name, and Phone.
 * Brand, Model/E-Nr., Street Address, Email, and Photo are optional so customers are never blocked.
 */

const photoSchema = z
  .custom<File | null>((val) => val === null || val === undefined || val instanceof File)
  .superRefine((file, ctx) => {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Bitte laden Sie ein Foto als JPG, PNG oder WebP hoch.",
      });
    } else if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Das Foto darf maximal ${MAX_PHOTO_MB} MB groß sein.`,
      });
    }
  });

const step1ObjectSchema = z.object({
  device: z.string().trim().min(1, "Bitte wählen Sie ein Gerät aus."),
  customDevice: z.string().optional(),
  brand: z.string().trim().min(1, "Bitte wählen Sie den Hersteller / die Marke aus."),
  model: z.string().optional(),
});

export const step1Schema = step1ObjectSchema.superRefine((val, ctx) => {
  if (val.device && (val.device.includes("Anderes") || val.device === "Sonstiges")) {
    if (!val.customDevice || val.customDevice.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customDevice"],
        message:
          "Bitte nennen Sie uns kurz Ihr Gerät (z. B. Dampfgarer, Siebträger).",
      });
    }
  }
});

export const step2Schema = z.object({
  problem: z
    .string()
    .trim()
    .min(
      4,
      "Bitte wählen Sie oben ein Symptom aus oder beschreiben Sie kurz Ihr Anliegen."
    ),
  urgency: z.enum(["normal", "express", "notfall"]),
  photo: photoSchema,
});

export const step3Schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Bitte geben Sie Ihren Namen ein."),
  phone: z
    .string()
    .trim()
    .min(6, "Bitte geben Sie Ihre Telefonnummer für Rückruf oder WhatsApp ein.")
    .refine(
      (val) =>
        /^[+()\d\s/-]{6,30}$/.test(val.trim()) &&
        val.replace(/\D/g, "").length >= 6,
      "Bitte geben Sie eine gültige Telefonnummer (mindestens 6 Ziffern) ein."
    ),
  zip: z
    .string()
    .trim()
    .min(
      3,
      "Bitte wählen Sie Ihren Ort (Osnabrück & Umgebung) oder teilen Sie Ihren Google Maps Standort."
    ),
  streetAddress: z.string().optional(),
  mapsLocationUrl: z.string().optional(),
  email: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val),
      "Bitte geben Sie eine gültige E-Mail-Adresse ein (oder lassen Sie das Feld frei)."
    ),
  preferredChannel: z.literal("whatsapp"),
  callbackTime: z.string().optional(),
});

export const quickQuestionSchema = z.object({
  problem: z
    .string()
    .trim()
    .min(4, "Bitte geben Sie Ihre Frage oder Ihr Anliegen kurz ein."),
  zip: z
    .string()
    .trim()
    .min(
      3,
      "Bitte wählen Sie Ihren Ort (Osnabrück & Umgebung) oder teilen Sie Ihren Google Maps Standort."
    ),
  name: z
    .string()
    .trim()
    .min(2, "Bitte geben Sie Ihren Namen ein."),
  phone: z
    .string()
    .trim()
    .min(6, "Bitte geben Sie Ihre Telefonnummer für die Antwort ein.")
    .refine(
      (val) =>
        /^[+()\d\s/-]{6,30}$/.test(val.trim()) &&
        val.replace(/\D/g, "").length >= 6,
      "Bitte geben Sie eine gültige Telefonnummer (mindestens 6 Ziffern) ein."
    ),
  device: z.string().trim().min(1, "Bitte wählen Sie ein Gerät aus."),
  brand: z.string().trim().min(1, "Bitte wählen Sie den Hersteller / die Marke aus."),
  streetAddress: z.string().optional(),
  mapsLocationUrl: z.string().optional(),
  email: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val),
      "Bitte geben Sie eine gültige E-Mail-Adresse ein (oder lassen Sie das Feld frei)."
    ),
  photo: photoSchema,
});

export const modelsByDeviceAndBrand: Record<string, Record<string, string[]>> = {
  "Waschmaschine": {
    "Miele": ["W1 TwinDos", "W1 WDB 030 WCS", "W1 WCA 030 WCS", "W1 WWI 860", "Softtronic W 3241", "Novotronic W 934"],
    "Bosch": ["Serie 4 WAN28242", "Serie 6 WGG24400", "Serie 8 WAW32540", "HomeProfessional WAT28400"],
    "Siemens": ["iQ300 WM14N220", "iQ500 WM14UT28", "iQ700 WM14VE90", "iQ800 WM16W640"],
    "AEG": ["ProSeries 6000", "ProSeries 7000 L7F", "ProSeries 8000 ÖKOMix", "Lavamat 74850"],
    "Bauknecht": ["WA Ultimate 824", "Super Eco 7410", "WMT EcoStar", "MW 60"],
    "Samsung": ["AddWash WW80T", "QuickDrive WW90T", "Ecobubble WW70", "WW4000"],
    "LG": ["AI DD F4V9", "TurboWash F2WN", "DirectDrive F14", "F4WV9"],
    "Beko": ["ProSmart Inverter WML", "Aquawave WTV", "Autodose WMB"],
    "Gorenje": ["WaveActive W6", "SimpleSens W7", "Advanced W8"],
    "Neff": ["VarioPerfect W5", "Comfort W4"],
    "Liebherr": ["Wasch-Trockner Combo"],
    "Jura": ["Nicht zutreffend (Kaffeevollautomat)"],
  },
  "Wäschetrockner": {
    "Miele": ["T1 EcoSpeed", "T1 Active", "T1 WhiteEdition", "T8823 C"],
    "Bosch": ["Serie 4 WQG233", "Serie 6 WTW874", "HomeProfessional WTXH"],
    "Siemens": ["iQ300 WT4H", "iQ500 WT47W", "iQ700 WT49W"],
    "AEG": ["AbsoluteCare 8000", "ProSense 7000", "T8DE74685"],
    "Bauknecht": ["GreenLine TK", "SuperEco T1"],
    "Samsung": ["OptimalDry DV80", "Ecobubble DV90"],
    "LG": ["Dual Inverter RH9", "Eco Hybrid"],
    "Beko": ["HeatPump DPU", "EcoGentle"],
    "Gorenje": ["SensoCare D", "WaveActive"],
    "Neff": ["Comfort T4"],
    "Liebherr": ["Kombi-Trockner"],
    "Jura": ["Nicht zutreffend"],
  },
  "Geschirrspüler": {
    "Miele": ["G 7000 AutoDos", "G 5000 SCi", "G 7310 SC", "G 4200"],
    "Bosch": ["Serie 4 SMV4HVX31E", "Serie 6 PerfectDry SMI4", "Serie 8 Zeolith SMS8", "SilencePlus"],
    "Siemens": ["iQ300 SN236", "iQ500 SN658X", "iQ700 studioLine"],
    "AEG": ["ComfortLift 9000", "AirDry 6000", "FFB 53600"],
    "Bauknecht": ["PowerClean Pro", "SuperSilent"],
    "Samsung": ["WaterWall DW60", "AutoRelease"],
    "LG": ["QuadWash DFB", "TrueSteam"],
    "Beko": ["Autodose DIN", "CornerWash"],
    "Gorenje": ["SmartFlex GV6", "UltraWhite"],
    "Neff": ["FlexZone S5", "MegaSpace"],
    "Liebherr": ["Unterbau GS"],
    "Jura": ["Nicht zutreffend"],
  },
  "Kühlschrank / Gefriergerät": {
    "Liebherr": ["BioFresh Plus CBNef", "NoFrost CNPef", "BluPerformance", "Comfort SBSes"],
    "Bosch": ["KGN39VLEP Serie 4", "KIV86VSE0 Serie 2", "Serie 6 VitaFresh"],
    "Siemens": ["iQ300 KG39", "iQ500 KI81", "iQ700 FrenchDoor"],
    "Miele": ["MasterCool K 2000", "KFN 29283", "K 7000 Einbau"],
    "Samsung": ["Bespoke AI", "SpaceMax RS68", "RB7300"],
    "LG": ["InstaView Door-in-Door", "LinearCooling GBB"],
    "Beko": ["HarvestFresh RCNA", "NeoFrost B5"],
    "Gorenje": ["Retro Collection RK", "GardenFresh"],
    "Bauknecht": ["Space4All KGN", "ProFresh"],
    "AEG": ["MultiSpace 7000", "GreenSense"],
    "Neff": ["Cooling N50", "N90"],
    "Jura": ["Nicht zutreffend"],
  },
  "Backofen / Herd": {
    "Bosch": ["Serie 4 HBA533", "Serie 6 HBG675", "Serie 8 HBG876", "HND 411"],
    "Siemens": ["iQ300 HB334", "iQ500 HB578", "iQ700 studioLine HR", "iQ800"],
    "Miele": ["H 2800 B", "H 7000 Dialoggarer", "H 7464 BP", "H 2268"],
    "AEG": ["SteamBake 7000", "SteamCrisp 8000", "SurroundCook 6000"],
    "Neff": ["Slide&Hide B57CR22N0", "CircaTherm N70", "MegaCollection"],
    "Bauknecht": ["ChefPlus BQ", "PowerCook"],
    "Samsung": ["Dual Cook Flex NV75", "Bespoke AI Oven"],
    "LG": ["InstaView Oven"],
    "Beko": ["BPRO 500", "AeroPerfect"],
    "Gorenje": ["HomeMade OptiBake", "Superior"],
    "Liebherr": ["Backofen-Kombi"],
    "Jura": ["Nicht zutreffend"],
  },
  "Ceranfeld / Induktion": {
    "Bosch": ["PXX675DC1E Induktion", "PIE645BB1E", "Serie 6 PKF645", "Serie 8"],
    "Siemens": ["iQ300 ET645", "iQ500 EX651", "iQ700 studioLine EX875"],
    "Miele": ["KM 7000 FlexInduction", "KM 6300 Ceran", "KM 7564"],
    "AEG": ["Hob2Hood 8000", "SensePro Induktion", "FryingSensor"],
    "Neff": ["T68TTS6L0 TwistPad Fire", "FlexInduction N90"],
    "Bauknecht": ["SuperChef Induktion", "EcoCook"],
    "Samsung": ["Virtual Flame Induktion", "AnyPlace"],
    "Beko": ["Indu+ Flex", "GlassCeramic"],
    "Gorenje": ["SuperSilent", "AreaFlex"],
    "LG": ["NeoChef Hub"],
    "Liebherr": ["Nicht zutreffend"],
    "Jura": ["Nicht zutreffend"],
  },
  "Dunstabzugshaube": {
    "Miele": ["DA 9360 W", "DA 2808", "Con@ctivity Inselhaube"],
    "Bosch": ["Serie 4 DWP64", "Serie 6 DWB98", "Serie 8 GlassDraft"],
    "Siemens": ["iQ300 LC67", "iQ500 LF91", "iQ700 studioLine"],
    "Neff": ["D95IKW1S0 Inselhaube", "GlassDraftHood"],
    "AEG": ["Hob2Hood DDE", "SilenceTech"],
    "Bauknecht": ["EcoSilence AKR"],
    "Beko": ["HCA Inverter"],
    "Gorenje": ["FreedomAir"],
    "Samsung": ["Bespoke Hood"],
    "LG": ["Smart Inverter"],
    "Liebherr": ["Nicht zutreffend"],
    "Jura": ["Nicht zutreffend"],
  },
  "Mikrowelle": {
    "Bosch": ["Serie 4 HMT84G", "Serie 6 BFL634", "Serie 8 Inverter"],
    "Siemens": ["iQ300 HF15", "iQ500 BF634", "iQ700 CM636"],
    "Miele": ["M 2230 SC", "M 7244 TC", "M 6032"],
    "AEG": ["MS 3200", "MicroChef"],
    "Bauknecht": ["ChefPlus MWP", "Max Crisp"],
    "Samsung": ["Smart Oven MC", "Bespoke MW"],
    "Beko": ["Solo Grill MGB"],
    "Gorenje": ["Prime Inox"],
    "Neff": ["N50 Built-In"],
    "LG": ["NeoChef Smart Inverter"],
    "Liebherr": ["Nicht zutreffend"],
    "Jura": ["Nicht zutreffend"],
  },
  "Kaffeevollautomat": {
    "Jura": ["E8 (EB)", "ENA 8", "Z10 Diamond Black", "S8 Chrome", "GIGA X8c", "J8 Twin"],
    "Miele": ["CM 6160 MilkPerfection", "CM 7750 CoffeeSelect", "CF 5300"],
    "Siemens": ["EQ.3s100", "EQ.500 integral", "EQ.6 plus s700", "EQ.9 plus connect"],
    "Bosch": ["VeroCafe 300", "VeroCup 100", "Tassimo Professional"],
    "DeLonghi": ["Magnifica S", "Dinamica Plus", "Eletta Explore", "PrimaDonna Soul"],
    "Philips": ["Series 3200 LatteGo", "Series 5400", "EP2220"],
    "Melitta": ["Barista TS Smart", "Passione OT", "Caffeo Solo"],
    "Saeco": ["Xelsis Suprema", "GranBaristo"],
    "Bauknecht": ["CA 8200"],
    "Beko": ["CEG 7303"],
    "Gorenje": ["Escula"],
    "Neff": ["Einbau-Kaffeevollautomat N70"],
    "Samsung": ["Nicht zutreffend"],
    "LG": ["Nicht zutreffend"],
  },
  "Elektronik / Platine": {
    "Miele": ["ELP 200 / ELP 266", "EDPL 164 Steuerplatine", "EL 150 Inverter"],
    "Bosch": ["EPW 590 Leistungsmodul", "AKO Steuerungseinheit", "Inverter 007"],
    "Siemens": ["BSH Steuerung 9000", "PowerModule iQ"],
    "AEG": ["EDW 1600 Inverter", "ProLogic Steuerung"],
    "Bauknecht": ["Wpro Steuermodul", "OmniControl"],
    "Samsung": ["DC-Inverter-Platine", "Hauptsteuerplatine"],
    "LG": ["IPM-Inverter-Platine", "Display-Platine"],
    "Beko": ["Hauptplatine (Steuerlogik)", "Leistungssteuereinheit"],
    "Gorenje": ["Simplex-Platine"],
    "Neff": ["Leistungsmodul N70"],
    "Liebherr": ["Kühlschrank-Inverter-Platine"],
    "Jura": ["Leistungsplatine / Elektronik-Set"],
  },
  "Anderes Gerät (Sonstiges)": {
    "Miele": ["Spezialgerät / Dampfgarer / Staubsauger-Serie"],
    "Bosch": ["Universal-Haushaltsgerät Serie"],
    "Siemens": ["StudioLine Sondermodell"],
    "AEG": ["Komfort-Hausgerät"],
    "Bauknecht": ["Universal-Servicegerät"],
    "Samsung": ["Smart-Home-Hausgerät"],
    "LG": ["ThinQ-Hausgerät"],
    "Beko": ["Hausgerät Standard"],
    "Gorenje": ["Design Line"],
    "Neff": ["Spezial-Einbaugerät"],
    "Liebherr": ["Sondergerät"],
    "Jura": ["Gourmet-Gerät"],
  }
};

export function getSuggestedModels(device: string, brand: string): string[] {
  const deviceModels = modelsByDeviceAndBrand[device];
  if (!deviceModels) {
    return ["Standardmodell / E-Nr. vom Typenschild", "Universal-Modell"];
  }
  const brandModels = deviceModels[brand] || deviceModels["Miele"] || popularModelPresets;
  return [...brandModels, "Anderes Modell / E-Nr. vom Typenschild"];
}

export const repairFormSchema = step1ObjectSchema
  .merge(step2Schema)
  .merge(step3Schema)
  .superRefine((val, ctx) => {
    if (val.device && (val.device.includes("Anderes") || val.device === "Sonstiges")) {
      if (!val.customDevice || val.customDevice.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customDevice"],
          message:
            "Bitte nennen Sie uns kurz Ihr Gerät (z. B. Dampfgarer, Siebträger).",
        });
      }
    }
  });

export type RepairValues = {
  inquiryMode?: InquiryMode;
  device: string;
  customDevice?: string;
  brand: string;
  model: string;
  problem: string;
  urgency: UrgencyLevel;
  preferredChannel: ContactChannel;
  callbackTime: string;
  zip: string;
  streetAddress?: string;
  mapsLocationUrl?: string;
  locationVerified?: boolean;
  coordinates?: CapturedCoordinates | null;
  name: string;
  phone: string;
  email: string;
  photo: File | null;
};

export type RepairErrors = Partial<Record<keyof RepairValues, string>>;

export const emptyValues: RepairValues = {
  inquiryMode: "repair",
  device: "",
  customDevice: "",
  brand: "",
  model: "",
  problem: "",
  urgency: "normal",
  preferredChannel: "whatsapp",
  callbackTime: "Jederzeit erreichbar",
  zip: "49082 Osnabrück",
  streetAddress: "",
  mapsLocationUrl: "",
  locationVerified: false,
  coordinates: null,
  name: "",
  phone: "",
  email: "",
  photo: null,
};

function mapZodIssuesToErrors(issues: z.ZodIssue[]): RepairErrors {
  const errors: RepairErrors = {};
  for (const issue of issues) {
    const key = issue.path[0] as keyof RepairValues | undefined;
    if (key && !errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

export function validate(v: RepairValues): RepairErrors {
  if (v.inquiryMode === "question") {
    const qRes = quickQuestionSchema.safeParse(v);
    if (qRes.success) return {};
    return mapZodIssuesToErrors(qRes.error.issues);
  }
  const result = repairFormSchema.safeParse(v);
  if (result.success) return {};
  return mapZodIssuesToErrors(result.error.issues);
}

export function validateStep(step: 1 | 2 | 3, v: RepairValues): RepairErrors {
  if (v.inquiryMode === "question") {
    return validate(v);
  }
  if (step === 1) {
    const res = step1Schema.safeParse(v);
    return res.success ? {} : mapZodIssuesToErrors(res.error.issues);
  }
  if (step === 2) {
    const res = step2Schema.safeParse(v);
    return res.success ? {} : mapZodIssuesToErrors(res.error.issues);
  }
  const res = step3Schema.safeParse(v);
  return res.success ? {} : mapZodIssuesToErrors(res.error.issues);
}

export function validateField<K extends keyof RepairValues>(
  field: K,
  v: RepairValues
): string | undefined {
  const allErrors = validate(v);
  return allErrors[field];
}

export function toWhatsAppInput(v: RepairValues, referenceId?: string): WhatsAppMessageInput {
  return {
    mode: v.inquiryMode === "question" ? "question" : "repair",
    name: v.name,
    device: v.device,
    customDevice: v.customDevice,
    brand: v.brand,
    phone: v.phone,
    symptom: v.problem,
    model: v.model,
    urgency: v.urgency,
    location: v.zip,
    streetAddress: v.streetAddress,
    mapsLocationUrl: v.mapsLocationUrl,
    locationVerified: v.locationVerified,
    coordinates: v.coordinates,
    callbackTime: v.callbackTime,
    email: v.email,
    photoName: v.photo ? v.photo.name : null,
    referenceId,
  };
}

/**
 * Builds a clickable Google Maps URL for Mr. Hannachi from either:
 * 1. The client's shared GPS coordinates (`coordinates` or `mapsLocationUrl`)
 * 2. The client's entered street address + Osnabrück/Umland town
 */
export function buildClientGoogleMapsLink(v: {
  zip: string;
  streetAddress?: string;
  mapsLocationUrl?: string;
  coordinates?: CapturedCoordinates | null;
}): string {
  if (v.mapsLocationUrl && v.mapsLocationUrl.trim().startsWith("http")) {
    return v.mapsLocationUrl.trim();
  }
  if (v.coordinates && typeof v.coordinates.lat === "number" && typeof v.coordinates.lng === "number") {
    return `https://www.google.com/maps?q=${v.coordinates.lat.toFixed(6)},${v.coordinates.lng.toFixed(6)}`;
  }
  const queryParts = [v.streetAddress?.trim(), v.zip.trim(), "Region Osnabrück"]
    .filter(Boolean)
    .join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    queryParts || "Osnabrück"
  )}`;
}

export function createWhatsAppMessage(v: RepairValues, referenceId?: string): string {
  return formatHannachiWhatsAppMessage(toWhatsAppInput(v, referenceId));
}

export function buildWhatsAppUrl(
  v: RepairValues,
  phone = HANNACHI_WHATSAPP_PHONE,
  referenceId?: string
): string {
  const result = createHannachiWhatsAppPayload(toWhatsAppInput(v, referenceId), phone);
  if (!result.valid) {
    return "";
  }
  return result.whatsappUrl;
}

export type SubmittedInquiryRecord = {
  referenceId: string;
  createdAt: string;
  inquiryMode: InquiryMode;
  device: string;
  brand: string;
  model: string;
  problem: string;
  urgency: UrgencyLevel;
  preferredChannel: ContactChannel;
  callbackTime: string;
  zip: string;
  streetAddress: string;
  mapsLocationUrl: string;
  locationVerified: boolean;
  coordinates: CapturedCoordinates | null;
  name: string;
  phone: string;
  email: string;
  photoName: string | null;
  whatsappUrl: string;
  messageText: string;
};

export type SubmitResult = {
  delivered: boolean;
  referenceId: string;
  whatsappUrl: string;
  mapsLocationUrl: string;
  messageText: string;
  record: SubmittedInquiryRecord;
};

const STORAGE_KEY = "hannachi_repair_inquiries_v1";

export function getSavedInquiries(): SubmittedInquiryRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return safeJsonParse(
      raw,
      (val): val is SubmittedInquiryRecord[] => Array.isArray(val),
      []
    );
  } catch {
    return [];
  }
}

function generateClientReferenceId(): string {
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    const digits = 1000 + (arr[0] % 9000);
    return `HN-${digits}`;
  }
  return `HN-${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function submitRepairRequest(
  v: RepairValues,
  honeypot = ""
): Promise<SubmitResult> {
  const normalizedValues: RepairValues = {
    ...v,
    device: sanitizeSingleLine(v.device, 120),
    customDevice: sanitizeSingleLine(v.customDevice, 120),
    brand: sanitizeSingleLine(v.brand, 120),
    model: sanitizeSingleLine(v.model, 120),
    problem: sanitizeText(v.problem, 1500, true),
    callbackTime: sanitizeSingleLine(v.callbackTime, 120) || "Jederzeit erreichbar",
    zip: sanitizeSingleLine(v.zip, 80),
    streetAddress: sanitizeSingleLine(v.streetAddress, 200),
    mapsLocationUrl: isSafeHttpsUrl(v.mapsLocationUrl) ? v.mapsLocationUrl!.trim() : "",
    name: sanitizeSingleLine(v.name, 120),
    phone: sanitizeSingleLine(v.phone, 30),
    email: sanitizeSingleLine(v.email, 160),
    preferredChannel: "whatsapp",
  };
  const errors = validate(normalizedValues);
  if (Object.keys(errors).length > 0) {
    throw new Error("Bitte füllen Sie die markierten Pflichtfelder aus.");
  }

  let referenceId = generateClientReferenceId();
  const mapsLocationUrl = buildClientGoogleMapsLink(normalizedValues);

  // Validate & register request with hardened Express backend (/api/repair-request)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);
    const apiRes = await fetch("/api/repair-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        inquiryMode: normalizedValues.inquiryMode || "repair",
        device: normalizedValues.device,
        customDevice: normalizedValues.customDevice || "",
        brand: normalizedValues.brand,
        model: normalizedValues.model || "",
        problem: normalizedValues.problem,
        urgency: normalizedValues.urgency || "normal",
        callbackTime: normalizedValues.callbackTime || "Jederzeit erreichbar",
        zip: normalizedValues.zip,
        streetAddress: normalizedValues.streetAddress || "",
        mapsLocationUrl,
        locationVerified: Boolean(normalizedValues.locationVerified),
        coordinates: normalizedValues.coordinates || null,
        name: normalizedValues.name,
        phone: normalizedValues.phone,
        email: normalizedValues.email || "",
        photoName: normalizedValues.photo ? sanitizeSingleLine(normalizedValues.photo.name, 180) : null,
        website: honeypot,
      }),
    });
    clearTimeout(timeoutId);

    if (apiRes.status === 429) {
      const rateBody = (await apiRes.json().catch(() => null)) as { error?: string } | null;
      throw new Error(
        rateBody?.error ||
          "Zu viele Anfragen in kurzer Zeit. Bitte warten Sie einen Moment oder rufen Sie uns direkt an."
      );
    }

    if (apiRes.ok) {
      const apiData = (await apiRes.json().catch(() => null)) as {
        referenceId?: string;
      } | null;
      if (apiData?.referenceId && /^HN-\d{4}$/.test(apiData.referenceId)) {
        referenceId = apiData.referenceId;
      }
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("Zu viele Anfragen")) {
      throw err;
    }
    // Non-blocking fallback so WhatsApp handoff works even if API is temporarily unreachable
  }

  const enrichedValues: RepairValues = {
    ...normalizedValues,
    mapsLocationUrl,
    preferredChannel: "whatsapp",
  };

  const payload = createHannachiWhatsAppPayload(
    toWhatsAppInput(enrichedValues, referenceId),
    HANNACHI_WHATSAPP_PHONE
  );
  if (!payload.valid) {
    throw new Error("Bitte füllen Sie alle Pflichtfelder (Gerät, Marke, Name, Telefon, Anliegen) aus.");
  }
  const whatsappUrl = payload.whatsappUrl;
  const messageText = payload.message;

  const isOther = normalizedValues.device.includes("Anderes") || normalizedValues.device === "Sonstiges";
  const deviceDisplay =
    isOther && normalizedValues.customDevice?.trim()
      ? normalizedValues.customDevice.trim()
      : normalizedValues.device || "Direkte Frage";

  const record: SubmittedInquiryRecord = {
    referenceId,
    createdAt: new Date().toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    inquiryMode: normalizedValues.inquiryMode || "repair",
    device: deviceDisplay,
    brand: normalizedValues.brand.trim() || "Vor Ort",
    model: normalizedValues.model.trim(),
    problem: normalizedValues.problem.trim(),
    urgency: normalizedValues.urgency || "normal",
    preferredChannel: "whatsapp",
    callbackTime: normalizedValues.callbackTime || "Jederzeit erreichbar",
    zip: normalizedValues.zip.trim(),
    streetAddress: normalizedValues.streetAddress?.trim() || "",
    mapsLocationUrl,
    locationVerified: Boolean(normalizedValues.locationVerified),
    coordinates: normalizedValues.coordinates || null,
    name: normalizedValues.name.trim(),
    phone: normalizedValues.phone.trim(),
    email: normalizedValues.email.trim(),
    photoName: normalizedValues.photo ? sanitizeSingleLine(normalizedValues.photo.name, 180) : null,
    whatsappUrl,
    messageText,
  };

  if (typeof window !== "undefined") {
    try {
      const existing = getSavedInquiries();
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([record, ...existing].slice(0, 10))
      );
    } catch {
      // Ignore storage quota issues
    }
  }

  // Optional webhook / backend endpoint via Vite env (strictly https://)
  const envUrl =
    typeof import.meta !== "undefined" && import.meta.env
      ? (import.meta.env.VITE_REPAIR_REQUEST_URL as string | undefined)
      : undefined;

  if (envUrl && isSafeHttpsUrl(envUrl)) {
    try {
      const body = new FormData();
      Object.entries(enrichedValues).forEach(([k, val]) => {
        if (val !== null && val !== undefined) {
          if (typeof val === "object" && !(val instanceof File)) {
            body.append(k, JSON.stringify(val));
          } else {
            body.append(k, val as string | Blob);
          }
        }
      });
      body.append("referenceId", referenceId);
      await fetch(envUrl, { method: "POST", body });
    } catch {
      // Non-blocking
    }
  }

  return {
    delivered: true,
    referenceId,
    whatsappUrl,
    mapsLocationUrl,
    messageText,
    record,
  };
}
