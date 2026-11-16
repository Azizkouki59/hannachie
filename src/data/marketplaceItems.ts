// Dedicated catalog & live inventory data model for /marktplatz (and /angebote) + /admin.
// Strictly compliant with German trade law (GewO / HwO / PAngV):
// - Trade scope: An- und Verkauf von Elektrohaushaltsgeräten & Ersatzteilen
// - Price display: "Preis auf Anfrage" (no online cart / checkout)
// - Written seller's warranty (schriftliche Verkäufergarantie) on all appliances sold.
// - Seeded with strictly 1 starter demo item per category (5 items total).

import {
  washerModernImage,
  dishwasherImage,
  fridgeModernImage,
  ovenKitchenImage,
  toolsWorkbenchImage,
  werkstattImage,
  type StaticImageData,
} from "./images";

export type MarketplaceCategoryId =
  | "all"
  | "washing_drying"
  | "cooling"
  | "dishwashers"
  | "ovens_stoves"
  | "spare_parts";

export type MarketplaceConditionFilter = "all" | "refurbished" | "new_part";

export type MarketplaceAvailabilityStatus =
  | "Sofort verfügbar in Osnabrück"
  | "Reserviert (Anfrage möglich)"
  | "Verkauft (Abgeschlossen)";

export type MarketplaceImageKey =
  | "washer"
  | "cooling"
  | "dishwasher"
  | "oven"
  | "parts"
  | "werkstatt";

export type MarketplacePhoto = {
  id: string;
  url: string;
  label?: string;
};

export type MarketplaceItem = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  soldAt?: string;
  linkedTicketId?: string;
  isDemo?: boolean;
  skuOrEnr: string;
  title: string;
  brand: string;
  category: Exclude<MarketplaceCategoryId, "all">;
  categoryLabel: string;
  deviceTypeForForm: string;
  conditionType: Exclude<MarketplaceConditionFilter, "all">;
  conditionBadge: "Geprüft & Aufbereitet" | "Neu · Originalteil";
  warrantyBadge: "Inkl. schriftlicher Garantie" | "Geprüfte Passgenauigkeit";
  shortSpecs: string;
  bulletSpecs: [string, string, string];
  detailedSpecs: { label: string; value: string }[];
  warrantyTerms: string;
  pickupInfo: string;
  availability: MarketplaceAvailabilityStatus;
  priceLabel: "Preis auf Anfrage";
  imageKey: MarketplaceImageKey;
  photos?: MarketplacePhoto[];
  searchKeywords: string[];
  inquiryTopic: "device_purchase" | "spare_parts";
  inquiryPreset: string;
};

export const MARKETPLACE_IMAGE_BY_KEY: Record<MarketplaceImageKey, StaticImageData> = {
  washer: washerModernImage,
  cooling: fridgeModernImage,
  dishwasher: dishwasherImage,
  oven: ovenKitchenImage,
  parts: toolsWorkbenchImage,
  werkstatt: werkstattImage,
};

export function resolveMarketplaceItemImage(item: {
  imageKey?: MarketplaceImageKey;
  category?: Exclude<MarketplaceCategoryId, "all">;
}): StaticImageData {
  if (item.imageKey && MARKETPLACE_IMAGE_BY_KEY[item.imageKey]) {
    return MARKETPLACE_IMAGE_BY_KEY[item.imageKey];
  }
  switch (item.category) {
    case "washing_drying":
      return washerModernImage;
    case "cooling":
      return fridgeModernImage;
    case "dishwashers":
      return dishwasherImage;
    case "ovens_stoves":
      return ovenKitchenImage;
    case "spare_parts":
      return toolsWorkbenchImage;
    default:
      return washerModernImage;
  }
}

export type ResolvedGallerySlide = {
  id: string;
  src: string;
  blurDataURL?: string;
  label?: string;
  isUploaded: boolean;
};

export function resolveMarketplaceItemGallery(item: {
  id: string;
  title?: string;
  categoryLabel?: string;
  imageKey?: MarketplaceImageKey;
  category?: Exclude<MarketplaceCategoryId, "all">;
  photos?: MarketplacePhoto[];
}): ResolvedGallerySlide[] {
  const uploaded = Array.isArray(item.photos)
    ? item.photos.filter(
        (p): p is MarketplacePhoto =>
          Boolean(p && typeof p.url === "string" && p.url.trim().length > 0)
      )
    : [];

  if (uploaded.length > 0) {
    return uploaded.map((p, idx) => ({
      id: p.id || `${item.id}-photo-${idx}`,
      src: p.url,
      label: p.label,
      isUploaded: true,
    }));
  }

  const fallback = resolveMarketplaceItemImage(item);
  return [
    {
      id: `${item.id}-default`,
      src: fallback.src,
      blurDataURL: fallback.blurDataURL,
      label: item.categoryLabel || "Produktansicht",
      isUploaded: false,
    },
  ];
}

export const MARKETPLACE_CATEGORIES: {
  id: MarketplaceCategoryId;
  label: string;
  shortLabel: string;
  defaultDeviceForForm: string;
  defaultImageKey: MarketplaceImageKey;
}[] = [
  {
    id: "all",
    label: "Alle Angebote",
    shortLabel: "Alle",
    defaultDeviceForForm: "Waschmaschine",
    defaultImageKey: "washer",
  },
  {
    id: "washing_drying",
    label: "Waschmaschinen & Trockner",
    shortLabel: "Waschen & Trocknen",
    defaultDeviceForForm: "Waschmaschine",
    defaultImageKey: "washer",
  },
  {
    id: "cooling",
    label: "Kühl- & Gefriergeräte",
    shortLabel: "Kühlen & Gefrieren",
    defaultDeviceForForm: "Kühlschrank / Gefriergerät",
    defaultImageKey: "cooling",
  },
  {
    id: "dishwashers",
    label: "Geschirrspüler",
    shortLabel: "Geschirrspüler",
    defaultDeviceForForm: "Geschirrspüler",
    defaultImageKey: "dishwasher",
  },
  {
    id: "ovens_stoves",
    label: "Herde & Backöfen",
    shortLabel: "Herde & Backöfen",
    defaultDeviceForForm: "Backofen / Herd",
    defaultImageKey: "oven",
  },
  {
    id: "spare_parts",
    label: "Ersatzteile & Zubehör",
    shortLabel: "Ersatzteile",
    defaultDeviceForForm: "Waschmaschine",
    defaultImageKey: "parts",
  },
];

export const MARKETPLACE_CONDITIONS: {
  id: MarketplaceConditionFilter;
  label: string;
}[] = [
  { id: "all", label: "Alle Zustände" },
  { id: "refurbished", label: "Geprüft & Aufbereitet" },
  { id: "new_part", label: "Neuware / Originalteil" },
];

// Strictly 1 starter demo item per category (5 total, zero mock clutter)
export const INITIAL_MARKETPLACE_DEMO_ITEMS: MarketplaceItem[] = [
  {
    id: "demo-washing-miele-w1",
    createdAt: "2026-11-15T08:00:00.000Z",
    updatedAt: "2026-11-15T08:00:00.000Z",
    isDemo: true,
    skuOrEnr: "E-Nr. WDB030WCS · Miele W1",
    title: "Miele W1 Waschmaschine (Frontlader · 8 kg Schontrommel)",
    brand: "Miele",
    category: "washing_drying",
    categoryLabel: "Waschmaschinen & Trockner",
    deviceTypeForForm: "Waschmaschine",
    conditionType: "refurbished",
    conditionBadge: "Geprüft & Aufbereitet",
    warrantyBadge: "Inkl. schriftlicher Garantie",
    shortSpecs: "8 kg Fassungsvermögen · 1400 U/min · Energieeffizienzklasse A",
    bulletSpecs: [
      "8 kg Miele-Schontrommel · 1.400 U/min Schleuderdrehzahl",
      "Komplett geprüft, hygienisch gereinigt & Verschleißteile kontrolliert",
      "Watercontrol-System (Aquastop) & verschleißfreier ProfiEco-Motor",
    ],
    detailedSpecs: [
      { label: "Hersteller & Modell", value: "Miele W1 WDB 030 WCS Eco" },
      { label: "E-Nr. / Serienreferenz", value: "WDB030WCS" },
      { label: "Fassungsvermögen", value: "8,0 kg (Patentierte Schontrommel)" },
      { label: "Schleuderdrehzahl", value: "Bis zu 1.400 U/min" },
      { label: "Abmessungen (H × B × T)", value: "85,0 × 59,6 × 63,6 cm" },
      { label: "Prüfstatus", value: "Geprüft, gereinigt & technisch abgenommen" },
      { label: "Verkäufergarantie", value: "Inkl. schriftlicher Verkäufergarantie auf Kaufbeleg" },
    ],
    warrantyTerms:
      "Sie erhalten beim Kauf dieses Geräts eine schriftliche Verkäufergarantie von Hannachi Elektrohaushaltsgeräte & Ersatzteile. Garantie- und Gewährleistungsleistungen gelten ausschließlich für direkt bei uns erworbene Geräte.",
    pickupInfo:
      "Mobiler Vor-Ort-Service & Übergabe nach Terminvereinbarung in 49082 Osnabrück & Umgebung.",
    availability: "Sofort verfügbar in Osnabrück",
    priceLabel: "Preis auf Anfrage",
    imageKey: "washer",
    searchKeywords: [
      "waschmaschine",
      "trockner",
      "miele",
      "w1",
      "wdb030wcs",
      "8 kg",
      "1400",
      "frontlader",
    ],
    inquiryTopic: "device_purchase",
    inquiryPreset:
      "Unverbindliche Reservierung / Preisanfrage: Miele W1 Waschmaschine 8 kg (E-Nr. WDB030WCS · Geprüft & Aufbereitet inkl. schriftlicher Garantie)",
  },
  {
    id: "demo-cooling-liebherr-nofrost",
    createdAt: "2026-11-15T08:05:00.000Z",
    updatedAt: "2026-11-15T08:05:00.000Z",
    isDemo: true,
    skuOrEnr: "Modell CNef 4315 · NoFrost",
    title: "Liebherr CNef 4315 Comfort NoFrost Kühl-Gefrierkombination",
    brand: "Liebherr",
    category: "cooling",
    categoryLabel: "Kühl- & Gefriergeräte",
    deviceTypeForForm: "Kühlschrank / Gefriergerät",
    conditionType: "refurbished",
    conditionBadge: "Geprüft & Aufbereitet",
    warrantyBadge: "Inkl. schriftlicher Garantie",
    shortSpecs: "321 Liter Nutzinhalt · NoFrost-Abtauautomatik · Edelstahl SmartSteel",
    bulletSpecs: [
      "Nie wieder abtauen dank Liebherr NoFrost-Umluftkühlung",
      "DuoCooling mit 2 getrennt regelbaren Kältekreisläufen",
      "24-Stunden-Kühlleistungstest, Türdichtungen & Thermostat geprüft",
    ],
    detailedSpecs: [
      { label: "Hersteller & Modell", value: "Liebherr CNef 4315 Comfort NoFrost" },
      { label: "E-Nr. / Serienreferenz", value: "CNef 4315-20 / 9989" },
      { label: "Gesamtnutzinhalt", value: "321 Liter (220 L Kühlen / 101 L Gefrieren)" },
      { label: "Abmessungen (H × B × T)", value: "201,1 × 60,0 × 62,5 cm" },
      { label: "Front & Gehäuse", value: "Edelstahl mit SmartSteel-Oberfläche" },
      { label: "Prüfstatus", value: "24h Temperaturprotokoll & Dichtungscheck bestanden" },
      { label: "Verkäufergarantie", value: "Inkl. schriftlicher Verkäufergarantie auf Kaufbeleg" },
    ],
    warrantyTerms:
      "Inklusive schriftlicher Verkäufergarantie von Hannachi Osnabrück. Dokumentiertes Kühlprotokoll liegt bei Übergabe vor.",
    pickupInfo:
      "Mobiler Vor-Ort-Service & Übergabe nach Terminvereinbarung in 49082 Osnabrück & Umgebung.",
    availability: "Sofort verfügbar in Osnabrück",
    priceLabel: "Preis auf Anfrage",
    imageKey: "cooling",
    searchKeywords: [
      "kühlschrank",
      "gefrierschrank",
      "kühl-gefrierkombination",
      "liebherr",
      "nofrost",
      "cnef 4315",
      "edelstahl",
    ],
    inquiryTopic: "device_purchase",
    inquiryPreset:
      "Unverbindliche Reservierung / Preisanfrage: Liebherr CNef 4315 NoFrost Kühl-Gefrierkombination (Geprüft & Aufbereitet inkl. schriftlicher Garantie)",
  },
  {
    id: "demo-dishwasher-bosch-serie6",
    createdAt: "2026-11-15T08:10:00.000Z",
    updatedAt: "2026-11-15T08:10:00.000Z",
    isDemo: true,
    skuOrEnr: "E-Nr. SMU68TS06E/51 · Serie 6",
    title: "Bosch Serie 6 Unterbau-Geschirrspüler (60 cm · Zeolith-Trocknung)",
    brand: "Bosch",
    category: "dishwashers",
    categoryLabel: "Geschirrspüler",
    deviceTypeForForm: "Geschirrspüler",
    conditionType: "refurbished",
    conditionBadge: "Geprüft & Aufbereitet",
    warrantyBadge: "Inkl. schriftlicher Garantie",
    shortSpecs: "60 cm Breite · 14 Maßgedecke · VarioSchublade & AquaStop",
    bulletSpecs: [
      "60 cm Unterbaugerät (Edelstahlfront) · 14 Maßgedecke + Besteckschublade",
      "PerfectDry mit Zeolith-Trocknung & flüsterleiser EcoSilence Drive (42 dB)",
      "Heizpumpe, Umwälzsystem und AquaStop-Ventil komplett geprüft",
    ],
    detailedSpecs: [
      { label: "Hersteller & Modell", value: "Bosch Serie 6 PerfectDry" },
      { label: "E-Nr. / Serienreferenz", value: "SMU68TS06E/51" },
      { label: "Bauart & Breite", value: "Unterbaugerät · 60,0 cm Standardbreite" },
      { label: "Fassungsvermögen", value: "14 Maßgedecke inkl. VarioSchublade Pro" },
      { label: "Geräuschwert", value: "Sehr leise (42 dB(A), im Silence-Programm 40 dB)" },
      { label: "Prüfstatus", value: "Dichtheits-, Heiz- & Pumpendruckprüfung dokumentiert" },
      { label: "Verkäufergarantie", value: "Inkl. schriftlicher Verkäufergarantie auf Kaufbeleg" },
    ],
    warrantyTerms:
      "Inklusive schriftlicher Verkäufergarantie. Sämtliche wasserführenden Bauteile und Dichtungen wurden im mehrstufigen Prüflauf getestet.",
    pickupInfo:
      "Mobiler Vor-Ort-Service & Übergabe nach Terminvereinbarung in 49082 Osnabrück & Umgebung.",
    availability: "Sofort verfügbar in Osnabrück",
    priceLabel: "Preis auf Anfrage",
    imageKey: "dishwasher",
    searchKeywords: [
      "geschirrspüler",
      "spülmaschine",
      "bosch",
      "serie 6",
      "smu68ts06e",
      "60 cm",
      "unterbau",
      "zeolith",
    ],
    inquiryTopic: "device_purchase",
    inquiryPreset:
      "Unverbindliche Reservierung / Preisanfrage: Bosch Serie 6 Unterbau-Geschirrspüler 60 cm (E-Nr. SMU68TS06E/51 · Geprüft & Aufbereitet)",
  },
  {
    id: "demo-oven-siemens-iq500",
    createdAt: "2026-11-15T08:15:00.000Z",
    updatedAt: "2026-11-15T08:15:00.000Z",
    isDemo: true,
    skuOrEnr: "E-Nr. HB517ABS0/01 · iQ500",
    title: "Siemens iQ500 Backofen (71 L · 3D Heißluft plus · Autark)",
    brand: "Siemens",
    category: "ovens_stoves",
    categoryLabel: "Herde & Backöfen",
    deviceTypeForForm: "Backofen / Herd",
    conditionType: "refurbished",
    conditionBadge: "Geprüft & Aufbereitet",
    warrantyBadge: "Inkl. schriftlicher Garantie",
    shortSpecs: "71 Liter Garraum · 3D Heißluft plus · Steckerfertig (230V Schuko)",
    bulletSpecs: [
      "Autarker 60-cm-Backofen · Steckerfertig (230 V, reiner Geräteverkauf ohne Montage)",
      "3D Heißluft plus, Schnellaufheizung, coolStart & LCD-Display",
      "Ringheizkörper, Ober-/Unterhitze, Thermostat und Türdichtung intern kontrolliert",
    ],
    detailedSpecs: [
      { label: "Hersteller & Modell", value: "Siemens iQ500 Backofen" },
      { label: "E-Nr. / Serienreferenz", value: "HB517ABS0/01" },
      { label: "Bauart & Nischenmaß", value: "Autark (230 V) · 59,5 × 59,4 × 54,8 cm" },
      { label: "Garraumvolumen", value: "71 Liter · GranitEmail-Innenraum" },
      { label: "Beheizungsarten", value: "7 Heizarten inkl. 3D Heißluft plus & Umluft-Grill" },
      { label: "Funktionskontrolle", value: "Isolations-, Temperatur- & Heizelementkontrolle im Lager" },
      { label: "Verkäufergarantie", value: "Inkl. schriftlicher Verkäufergarantie auf Kaufbeleg" },
    ],
    warrantyTerms:
      "Inklusive schriftlicher Verkäufergarantie von Hannachi Elektrohaushaltsgeräte & Ersatzteile.",
    pickupInfo:
      "Übergabe nach Terminvereinbarung im Raum 49082 Osnabrück.",
    availability: "Sofort verfügbar in Osnabrück",
    priceLabel: "Preis auf Anfrage",
    imageKey: "oven",
    searchKeywords: [
      "backofen",
      "herd",
      "siemens",
      "iq500",
      "hb517abs0",
      "heißluft",
      "autark",
    ],
    inquiryTopic: "device_purchase",
    inquiryPreset:
      "Unverbindliche Reservierung / Preisanfrage: Siemens iQ500 Backofen (E-Nr. HB517ABS0/01 · Geprüft & Aufbereitet)",
  },
  {
    id: "demo-part-bsh-miele-oem",
    createdAt: "2026-11-15T08:20:00.000Z",
    updatedAt: "2026-11-15T08:20:00.000Z",
    isDemo: true,
    skuOrEnr: "Teilenr. 00651956 / DPS-30W",
    title: "Original Heizpumpen, Laugenpumpen & Heizelemente (Bosch / Siemens / Miele / AEG)",
    brand: "Bosch",
    category: "spare_parts",
    categoryLabel: "Ersatzteile & Zubehör",
    deviceTypeForForm: "Geschirrspüler",
    conditionType: "new_part",
    conditionBadge: "Neu · Originalteil",
    warrantyBadge: "Geprüfte Passgenauigkeit",
    shortSpecs: "Original-Ersatzteile ab Lager · E-Nr. & PNC Typenschild-Abgleich · Neuware",
    bulletSpecs: [
      "Original BSH-Heizpumpen (00651956 / 00654575) gegen Fehlercode E09 / E04",
      "Original Laugenpumpen, Türmanschetten, Ringheizkörper & Thermostate",
      "Kostenloser Passgenauigkeits-Abgleich anhand Ihrer E-Nr. oder PNC vorab",
    ],
    detailedSpecs: [
      { label: "Artikelgruppe", value: "Original-Pumpen, Heizelemente, Dichtungen & Elektronik" },
      { label: "Teilenummer-Beispiele", value: "BSH 00651956, 00654575, Miele 6239562, AEG 140066" },
      { label: "Kompatible Marken", value: "Bosch, Siemens, Miele, AEG, Neff, Bauknecht, Liebherr" },
      { label: "Typischer Einsatz", value: "Fehlercodes E09, E18, F11, F24 oder defekte Ringheizung" },
      { label: "Zustand", value: "Neuware · Original- & Erstausrüsterqualität" },
      { label: "Typenschild-Abgleich", value: "Passgenauigkeit durch E-Nr. / PNC-Abgleich" },
    ],
    warrantyTerms:
      "Neuware in Original-/Erstausrüsterqualität mit gesetzlicher Gewährleistung. Vor Übergabe gleichen wir die E-Nr. oder PNC Ihres Typenschilds ab, damit das Bauteil exakt passt.",
    pickupInfo:
      "Mobiler Vor-Ort-Ersatzteil-Service in 49082 Osnabrück & Umgebung nach Terminvereinbarung.",
    availability: "Sofort verfügbar in Osnabrück",
    priceLabel: "Preis auf Anfrage",
    imageKey: "parts",
    searchKeywords: [
      "ersatzteil",
      "heizpumpe",
      "umwälzpumpe",
      "laugenpumpe",
      "ringheizkörper",
      "türmanschette",
      "thermostat",
      "00651956",
      "00654575",
      "e09",
      "e18",
      "f11",
      "bosch",
      "siemens",
      "miele",
      "aeg",
    ],
    inquiryTopic: "spare_parts",
    inquiryPreset:
      "Ersatzteil-Anfrage / Reservierung: Original-Ersatzteil nach Typenschild E-Nr. / PNC (Neu · Originalteil)",
  },
];

export const MARKETPLACE_ITEMS = INITIAL_MARKETPLACE_DEMO_ITEMS;

export const MARKETPLACE_STORAGE_KEY = "hannachi_marketplace_inventory_v2";
export const MARKETPLACE_SETTINGS_KEY = "hannachi_marketplace_settings_v1";
export const MARKETPLACE_WATCHLIST_KEY = "hannachi_marketplace_watchlist_v1";
export const MARKETPLACE_COMPARE_KEY = "hannachi_marketplace_compare_v1";

export type MarketplaceSettings = {
  hideSoldPublicly: boolean;
};

export const DEFAULT_MARKETPLACE_SETTINGS: MarketplaceSettings = {
  hideSoldPublicly: false,
};

export function isMarketplaceItemSold(item: Pick<MarketplaceItem, "availability">): boolean {
  return item.availability === "Verkauft (Abgeschlossen)";
}

export function loadLocalMarketplaceSettings(): MarketplaceSettings {
  if (typeof window === "undefined") return DEFAULT_MARKETPLACE_SETTINGS;
  try {
    const raw = window.localStorage.getItem(MARKETPLACE_SETTINGS_KEY);
    if (!raw) return DEFAULT_MARKETPLACE_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<MarketplaceSettings>;
    return {
      hideSoldPublicly: Boolean(parsed?.hideSoldPublicly),
    };
  } catch {
    return DEFAULT_MARKETPLACE_SETTINGS;
  }
}

export function saveLocalMarketplaceSettings(settings: MarketplaceSettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MARKETPLACE_SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(
      new CustomEvent("hannachi:marketplace-settings-updated", { detail: settings })
    );
  } catch {
    // Ignore storage quota errors
  }
}

export type MarketplaceQuickPreset = {
  id: string;
  label: string;
  category: Exclude<MarketplaceCategoryId, "all">;
  conditionType: "refurbished" | "new_part";
  brand: string;
  titleTemplate: string;
  shortSpecs: string;
  bullets: [string, string, string];
};

export const MARKETPLACE_QUICK_PRESETS: MarketplaceQuickPreset[] = [
  {
    id: "preset-washer",
    label: "Waschmaschine",
    category: "washing_drying",
    conditionType: "refurbished",
    brand: "Miele",
    titleTemplate: "Miele W1 Waschmaschine (Frontlader · 8 kg)",
    shortSpecs: "8 kg Fassungsvermögen · 1.400 U/min · Aquastop",
    bullets: [
      "8 kg Schontrommel · 1.400 U/min Schleuderdrehzahl",
      "Komplett geprüft, hygienisch gereinigt & Verschleißteile erneuert",
      "Inkl. schriftlicher Verkäufergarantie bei Übergabe in Osnabrück",
    ],
  },
  {
    id: "preset-dryer",
    label: "Trockner",
    category: "washing_drying",
    conditionType: "refurbished",
    brand: "Bosch",
    titleTemplate: "Bosch Wärmepumpentrockner (Serie 6 · 8 kg)",
    shortSpecs: "8 kg Wärmepumpentechnologie · Selbstreinigender Kondensator",
    bullets: [
      "Energiesparende Wärmepumpentechnologie · 8 kg Trommel",
      "Luftwege, Siebe & Wärmetauscher gereinigt und im Testlauf geprüft",
      "Inkl. schriftlicher Verkäufergarantie bei Übergabe in Osnabrück",
    ],
  },
  {
    id: "preset-dishwasher",
    label: "Geschirrspüler",
    category: "dishwashers",
    conditionType: "refurbished",
    brand: "Bosch",
    titleTemplate: "Bosch Serie 6 Unterbau-Geschirrspüler (60 cm)",
    shortSpecs: "60 cm Breite · 14 Maßgedecke · AquaStop & Besteckschublade",
    bullets: [
      "60 cm Unterbaugerät · sehr leise im Betrieb (ca. 42 dB)",
      "Heizpumpe, Umwälzsystem und AquaStop-Ventil komplett geprüft",
      "Inkl. schriftlicher Verkäufergarantie bei Übergabe in Osnabrück",
    ],
  },
  {
    id: "preset-cooling",
    label: "Kühl- / Gefrier",
    category: "cooling",
    conditionType: "refurbished",
    brand: "Liebherr",
    titleTemplate: "Liebherr NoFrost Kühl-Gefrierkombination",
    shortSpecs: "NoFrost-Abtauautomatik · Edelstahl-Optik · 24h geprüft",
    bullets: [
      "Nie wieder abtauen dank NoFrost-Umluftkühlung",
      "24-Stunden-Kühlleistungstest, Thermostat & Türdichtungen geprüft",
      "Inkl. schriftlicher Verkäufergarantie bei Übergabe in Osnabrück",
    ],
  },
  {
    id: "preset-oven",
    label: "Backofen / Herd",
    category: "ovens_stoves",
    conditionType: "refurbished",
    brand: "Siemens",
    titleTemplate: "Siemens iQ500 Backofen (Autark · 230V)",
    shortSpecs: "71 L Garraum · 3D Heißluft plus · Steckerfertig (230V)",
    bullets: [
      "Autarker 60-cm-Backofen · Steckerfertig (230 V, reiner Geräteverkauf)",
      "Heizkörper, Thermostat und Türdichtung im internen Funktionstest kontrolliert",
      "Inkl. schriftlicher Verkäufergarantie bei Übergabe in Osnabrück",
    ],
  },
  {
    id: "preset-part",
    label: "Ersatzteil",
    category: "spare_parts",
    conditionType: "new_part",
    brand: "Bosch",
    titleTemplate: "Original BSH Heizpumpe / Laugenpumpe",
    shortSpecs: "Original-Ersatzteil in Osnabrück · E-Nr. Abgleich",
    bullets: [
      "Original- / Erstausrüsterqualität für alle Marken",
      "Kostenloser Passgenauigkeits-Abgleich nach E-Nr. oder PNC",
      "Mobiler Vor-Ort-Service nach Terminvereinbarung in Osnabrück",
    ],
  },
];

export function loadLocalMarketplaceItems(): MarketplaceItem[] {
  if (typeof window === "undefined") return INITIAL_MARKETPLACE_DEMO_ITEMS;
  try {
    const raw = window.localStorage.getItem(MARKETPLACE_STORAGE_KEY);
    if (!raw) return INITIAL_MARKETPLACE_DEMO_ITEMS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as MarketplaceItem[];
    }
  } catch {
    // Fallback to initial 5 demos
  }
  return INITIAL_MARKETPLACE_DEMO_ITEMS;
}

export function saveLocalMarketplaceItems(items: MarketplaceItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MARKETPLACE_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("hannachi:marketplace-updated", { detail: items }));
  } catch {
    // Ignore storage quota errors
  }
}
