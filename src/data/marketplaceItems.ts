// Dedicated catalog & live inventory data model for /marktplatz (and /angebote) + /admin.
// Strictly compliant with German trade law (GewO / HwO / PAngV):
// - Trade scope: An- und Verkauf von Elektrohaushaltsgeräten & Ersatzteilen
// - Price display: "Preis auf Anfrage" (no online cart / checkout)
// - Written seller's warranty (schriftliche Verkäufergarantie) on all appliances sold.
// - Production real-stock-only catalog (zero seeded demo listings).

import {
  washerModernImage,
  dishwasherImage,
  fridgeModernImage,
  ovenKitchenImage,
  toolsWorkbenchImage,
  showroomImage,
  type StaticImageData,
} from "./images.ts";

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
  werkstatt: showroomImage,
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

// Production real-stock-only catalog: zero seeded demo items
export const INITIAL_MARKETPLACE_DEMO_ITEMS: MarketplaceItem[] = [];

export const MARKETPLACE_ITEMS: MarketplaceItem[] = [];

export function stripDemoMarketplaceItems(items: MarketplaceItem[]): MarketplaceItem[] {
  if (!Array.isArray(items)) return [];
  return items.filter(
    (item) =>
      Boolean(item) &&
      !item.isDemo &&
      typeof item.id === "string" &&
      !item.id.startsWith("demo-")
  );
}

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
      "Übergabe oder Lieferung nach Terminvereinbarung in Osnabrück & Umgebung",
    ],
  },
];

export function loadLocalMarketplaceItems(): MarketplaceItem[] {
  if (typeof window === "undefined") return [];
  try {
    window.localStorage.removeItem(MARKETPLACE_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup errors
  }
  return [];
}

export function saveLocalMarketplaceItems(items: MarketplaceItem[]): void {
  if (typeof window === "undefined") return;
  try {
    const cleaned = stripDemoMarketplaceItems(items);
    window.localStorage.removeItem(MARKETPLACE_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("hannachi:marketplace-updated", { detail: cleaned }));
  } catch {
    // Ignore storage errors
  }
}
