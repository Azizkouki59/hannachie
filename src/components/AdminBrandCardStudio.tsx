"use client";

import { useMemo, useRef, useState } from "react";
import {
  Check,
  Download,
  Eye,
  ImageDown,
  Layers,
  Palette,
  QrCode,
  RotateCcw,
  Scissors,
  Sparkles,
  Type,
  UserCheck,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { business } from "@/data/site";
import { HANNACHI_BRAND_ASSETS } from "@/components/HannachiBrandLogo";
import { generatedPhotos } from "@/data/generatedPhotos";
import hannachiEmblemProImg from "@/assets/images/hannachi_emblem_pro_1795861794802.jpg";
import hannachiMonogramHProImg from "@/assets/images/hannachi_monogram_h_pro_1795861795038.jpg";
import hannachiHeritageSealProImg from "@/assets/images/hannachi_heritage_seal_pro_1795861795892.jpg";
import hannachiSignageLockupProImg from "@/assets/images/hannachi_signage_lockup_pro_1795861797429.jpg";

interface AdminBrandCardStudioProps {
  onToast?: (msg: string) => void;
}

export type LogoVariationId =
  | "emblem-official"
  | "symbol-h"
  | "lockup-light"
  | "lockup-dark"
  | "seal-1x1"
  | "emblem-pro"
  | "monogram-pro"
  | "seal-pro";

export type CardLayoutId =
  | "signature_midnight"
  | "atelier_porcelain"
  | "ruby_sapphire_split"
  | "editorial_monogram";

export type AccentPaletteId =
  | "ruby_sapphire"
  | "sapphire_sky"
  | "crimson_velvet"
  | "platinum_steel";

type LogoFraming = "seamless" | "framed";
type CornerStyle = "rounded" | "sharp";

interface AccentTokens {
  id: AccentPaletteId;
  label: string;
  primary: string;
  primaryLight: string;
  primaryDeep: string;
  secondary: string;
  secondaryDeep: string;
  swatchGradient: string;
}

const ACCENT_PALETTES: AccentTokens[] = [
  {
    id: "ruby_sapphire",
    label: "Hannachi Rubin & Saphir",
    primary: "#C92A42",
    primaryLight: "#E86A7D",
    primaryDeep: "#A11E33",
    secondary: "#64B5EC",
    secondaryDeep: "#1974B8",
    swatchGradient: "linear-gradient(135deg, #071126 0%, #1974B8 48%, #C92A42 100%)",
  },
  {
    id: "sapphire_sky",
    label: "Saphir & Eisblau",
    primary: "#1974B8",
    primaryLight: "#64B5EC",
    primaryDeep: "#0C2558",
    secondary: "#64B5EC",
    secondaryDeep: "#1974B8",
    swatchGradient: "linear-gradient(135deg, #071126 0%, #1974B8 55%, #64B5EC 100%)",
  },
  {
    id: "crimson_velvet",
    label: "Rubinrot Exklusiv",
    primary: "#A11E33",
    primaryLight: "#E86A7D",
    primaryDeep: "#7B1425",
    secondary: "#F1F5F9",
    secondaryDeep: "#94A3B8",
    swatchGradient: "linear-gradient(135deg, #071126 0%, #A11E33 55%, #E86A7D 100%)",
  },
  {
    id: "platinum_steel",
    label: "Edelstahl & Saphir",
    primary: "#CBD5E1",
    primaryLight: "#F8FAFC",
    primaryDeep: "#64748B",
    secondary: "#64B5EC",
    secondaryDeep: "#1974B8",
    swatchGradient: "linear-gradient(135deg, #071126 0%, #64748B 55%, #64B5EC 100%)",
  },
];

const CARD_LAYOUTS: Array<{
  id: CardLayoutId;
  name: string;
  subtitle: string;
  isDarkBase: boolean;
}> = [
  {
    id: "signature_midnight",
    name: "Hannachi Signature",
    subtitle: "Mitternachtsblau · Orbital-Bogen · Rubin-Akzent",
    isDarkBase: true,
  },
  {
    id: "atelier_porcelain",
    name: "Atelier Weiß & Saphir",
    subtitle: "Architektur-Weiß · Vertikales Saphir-QR-Dock",
    isDarkBase: false,
  },
  {
    id: "ruby_sapphire_split",
    name: "Rubin & Saphir Split",
    subtitle: "Zweigeteilt · Dunkler Logo-Flügel + Weißer Kontaktbereich",
    isDarkBase: false,
  },
  {
    id: "editorial_monogram",
    name: "Modernes Monogramm",
    subtitle: "Schiefer-Saphir · Wasserzeichen-Emblem · Klarer Fokus",
    isDarkBase: true,
  },
];

const NAVY_SKY_LOGO_VARIATIONS: Array<{
  id: LogoVariationId;
  shortLabel: string;
  badge: string;
  title: string;
  subtitle: string;
  src: string;
  svgDownload?: string;
  svgFilename?: string;
  filename: string;
  darkBg?: boolean;
}> = [
  {
    id: "emblem-official",
    shortLabel: "Marken-Emblem",
    badge: "Hauptlogo · Transparent PNG & SVG",
    title: "Hannachi Marken-Emblem (Saphirblau, Lichtbogen & Rubinrot)",
    subtitle:
      "Offizielles hochauflösendes Marken-Emblem (2048 px) mit transparentem Hintergrund für helle & dunkle Karten",
    src: HANNACHI_BRAND_ASSETS.emblemPng,
    svgDownload: HANNACHI_BRAND_ASSETS.emblemSvg,
    svgFilename: "hannachi-emblem.svg",
    filename: "hannachi-emblem-2048.png",
  },
  {
    id: "symbol-h",
    shortLabel: "H-Monogramm",
    badge: "Signet · Transparent PNG & SVG",
    title: "Minimalistisches „H“-Signet für Stempel & Icons",
    subtitle:
      "Tiefblauer Kreis, Saphir-Schwung und rubinrotes „H“ – gestochen scharf auf kleinen Druckflächen",
    src: "/assets/aistudio/favicon-512_a840f70f.png",
    svgDownload: HANNACHI_BRAND_ASSETS.symbolSvg,
    svgFilename: "hannachi-symbol.svg",
    filename: "hannachi-symbol-512.png",
  },
  {
    id: "lockup-light",
    shortLabel: "Wort-Marke Hell",
    badge: "Breitformat · Weiß / Briefpapier",
    title: "Offizielle Wort-Bild-Marke (Hell-Version 3200×800)",
    subtitle:
      "Rubinroter „Hannachi“-Schriftzug mit OSNABRÜCK · SEIT 1990 auf transparentem Grund für weiße Karten",
    src: HANNACHI_BRAND_ASSETS.lockupLightPng,
    svgDownload: HANNACHI_BRAND_ASSETS.lockupLightSvg,
    svgFilename: "hannachi-lockup-light.svg",
    filename: "hannachi-lockup-light-3200x800.png",
  },
  {
    id: "lockup-dark",
    shortLabel: "Wort-Marke Dunkel",
    badge: "Breitformat · Website & Dunkel",
    title: "Offizielle Wort-Bild-Marke (Dunkel-Version 3200×800)",
    subtitle:
      "Leuchtendes Header- & Fahrzeug-Logo für dunklen Mitternachtsblau-Untergrund (#071126)",
    src: HANNACHI_BRAND_ASSETS.lockupDarkPng,
    svgDownload: HANNACHI_BRAND_ASSETS.lockupDarkSvg,
    svgFilename: "hannachi-lockup-dark.svg",
    filename: "hannachi-lockup-dark-3200x800.png",
    darkBg: true,
  },
  {
    id: "seal-1x1",
    shortLabel: "Vektor-Siegel",
    badge: "Original-Siegel · Vektor SVG & 2160 px",
    title: "Offizielles Qualitäts- & Herkunftssiegel (2160×2160)",
    subtitle:
      "Klares Vektor-Siegel mit Edelstahl-Skala und Hannachi-Emblem für Urkunden, Stempel & Web",
    src: HANNACHI_BRAND_ASSETS.seal1x1Png,
    svgDownload: HANNACHI_BRAND_ASSETS.seal1x1Svg,
    svgFilename: "hannachi-seal-1x1.svg",
    filename: "hannachi-seal-1x1-2160.png",
    darkBg: true,
  },
  {
    id: "emblem-pro",
    shortLabel: "Emblem 3D",
    badge: "Derivat 01 · Edelstahl-Lünette",
    title: "Hannachi Studio-Emblem mit Edelstahl-Bevel",
    subtitle:
      "Hochwertige 3D-Weiterentwicklung des Hauptlogos: tiefes Saphirblau, Lichtbogen & rubinroter Schriftzug",
    src: hannachiEmblemProImg,
    svgDownload: HANNACHI_BRAND_ASSETS.emblemSvg,
    svgFilename: "hannachi-emblem.svg",
    filename: "hannachi-emblem-edelstahl-3d.jpg",
    darkBg: true,
  },
  {
    id: "monogram-pro",
    shortLabel: "H-Signet Pro",
    badge: "Derivat 02 · Architektur-Monogramm",
    title: "Geschliffenes „H“-Signet auf Porzellanweiß",
    subtitle:
      "Kompakte Marken-Ableitung mit identischem Saphir-Oval, Lichtbogen und facettiertem rubinrotem „H“",
    src: hannachiMonogramHProImg,
    svgDownload: HANNACHI_BRAND_ASSETS.symbolSvg,
    svgFilename: "hannachi-symbol.svg",
    filename: "hannachi-h-signet-architektur.jpg",
  },
  {
    id: "seal-pro",
    shortLabel: "Titan-Siegel Pro",
    badge: "Derivat 03 · Präzisions-Siegel (Neu)",
    title: "Titan-Präzisionssiegel „Osnabrück · Seit 1990“",
    subtitle:
      "Veredelte Neuauflage mit gebürstetem Titan-Ring, Saphir-Skala, Rubin-Rauten und Hannachi-Oval",
    src: hannachiHeritageSealProImg,
    svgDownload: HANNACHI_BRAND_ASSETS.seal1x1Svg,
    svgFilename: "hannachi-seal-1x1.svg",
    filename: "hannachi-titan-siegel-1990.jpg",
    darkBg: true,
  },
];

const GENERATED_BRAND_ASSETS: Array<{
  id: string;
  title: string;
  subtitle: string;
  src: string;
  filename: string;
  contain?: boolean;
}> = [
  {
    id: "signage-lockup-pro",
    title: "Fassaden- & Fahrzeug-Schild „Hannachi Fachhandel“ (16:9)",
    subtitle:
      "Gebürstetes Mitternachtsblau, offizielles Oval-Logo & rubinrote Akzentlinie – bereit für Schaufenster & Transporter",
    src: hannachiSignageLockupProImg,
    filename: "hannachi-fachhandel-schild-16x9.jpg",
  },
  {
    id: "seal-16x9-banner",
    title: "Hannachi Marken-Banner 4K (3840×2160)",
    subtitle:
      "Präzisionssiegel & komplette Wortmarke für Rechnungskopf, Schaufenster & Präsentationen",
    src: HANNACHI_BRAND_ASSETS.seal16x9Png,
    filename: "hannachi-seal-16x9-3840x2160.png",
    contain: true,
  },
  {
    id: "atelier-brand-hero",
    title: "Hannachi Fachgeschäft & Prüfplatz (Markenfoto)",
    subtitle:
      "Edelstahl-Waschtrommel, Prüftechnik & Hannachi-Plakette im Atelier-Licht",
    src: generatedPhotos.heroAtelierStage.src,
    filename: "hannachi-atelier-pruefplatz.jpg",
  },
  {
    id: "parts-brand-showcase",
    title: "Original-Ersatzteile & Hannachi Medaillon",
    subtitle:
      "Heizstab, Kugellager, Laugenpumpe, Motorkohlen & Dichtung neben dem Marken-Emblem",
    src: generatedPhotos.pillarSpareParts.src,
    filename: "hannachi-ersatzteile-medaillon.jpg",
  },
  {
    id: "showroom-appliances-brand",
    title: "Hannachi Fachhandel Showroom (Markenfoto)",
    subtitle:
      "Ausgewählte Waschmaschinen, Trockner & Geschirrspüler im Atelier-Showroom",
    src: generatedPhotos.pillarAppliances.src,
    filename: "hannachi-fachhandel-showroom.jpg",
  },
  {
    id: "app-icon-1024",
    title: "Hannachi App- & Profil-Icon (1024×1024)",
    subtitle:
      "Abgerundetes Saphir-Icon für WhatsApp Business, Facebook & iOS/Android",
    src: HANNACHI_BRAND_ASSETS.appIcon1024,
    filename: "hannachi-app-icon-1024.png",
    contain: true,
  },
];

const DEFAULT_STATE = {
  layoutId: "signature_midnight" as CardLayoutId,
  accentId: "ruby_sapphire" as AccentPaletteId,
  selectedLogoId: "emblem-official" as LogoVariationId,
  logoFraming: "seamless" as LogoFraming,
  cornerStyle: "rounded" as CornerStyle,
  personName: "Kamal Hannachi",
  personRole: "Inhaber · Fachberatung & Ersatzteile",
  brandTitle: "Hannachi",
  brandSubtitle: "Elektrohaushaltsgeräte & Ersatzteile",
  customTagline: "Persönliche Fachberatung · Original-Ersatzteile (E-Nr.) · Markengeräte",
  contactPhone: business.phoneDisplay,
  contactEmail: business.email,
  contactLocation: `${business.street} · ${business.zip} ${business.city}`,
  qrUrl: "https://hannachi.de",
  qrLabel: "hannachi.de",
  qrHint: "Online-Termin & WhatsApp",
  heritageBadge: "Osnabrück · Seit 1990",
  brandsLine: "Miele · Bosch · Siemens · AEG · Bauknecht · Liebherr · Neff",
  showQr: true,
  showHeritage: true,
  showBrandsLine: true,
  showBackContact: true,
};

async function drawSvgElementToCanvas(
  ctx: CanvasRenderingContext2D,
  svgElement: SVGSVGElement | null,
  x: number,
  y: number,
  size: number
): Promise<void> {
  if (!svgElement) return;
  const xml = new XMLSerializer().serializeToString(svgElement);
  const svg64 = btoa(unescape(encodeURIComponent(xml)));
  const image64 = `data:image/svg+xml;base64,${svg64}`;
  await new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, x, y, size, size);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = image64;
  });
}

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  return await new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function drawLogoToCanvas(
  ctx: CanvasRenderingContext2D,
  src: string,
  x: number,
  y: number,
  boxW: number,
  boxH: number,
  options: {
    framed: boolean;
    radius?: number;
    bgColor?: string;
    borderColor?: string;
    alpha?: number;
  }
): Promise<void> {
  const img = await loadImage(src);
  if (!img) return;

  ctx.save();
  if (typeof options.alpha === "number") {
    ctx.globalAlpha = options.alpha;
  }

  const radius = options.radius ?? 14;
  if (options.framed) {
    ctx.beginPath();
    ctx.roundRect(x, y, boxW, boxH, radius);
    ctx.fillStyle = options.bgColor ?? "#ffffff";
    ctx.fill();
    if (options.borderColor) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = options.borderColor;
      ctx.stroke();
    }
    ctx.clip();
  }

  const padding = options.framed ? Math.round(Math.min(boxW, boxH) * 0.1) : 0;
  const innerW = boxW - padding * 2;
  const innerH = boxH - padding * 2;
  const scale = Math.min(innerW / img.width, innerH / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const offsetX = x + padding + (innerW - drawW) / 2;
  const offsetY = y + padding + (innerH - drawH) / 2;

  if (!options.framed) {
    ctx.beginPath();
    ctx.roundRect(offsetX, offsetY, drawW, drawH, Math.min(radius, 18));
    ctx.clip();
  }

  ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
  ctx.restore();
}

function drawFittedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontTemplate: (size: number) => string,
  startSize: number,
  minSize = 14
) {
  let size = startSize;
  ctx.font = fontTemplate(size);
  while (size > minSize && ctx.measureText(text).width > maxWidth) {
    size -= 1;
    ctx.font = fontTemplate(size);
  }
  ctx.fillText(text, x, y, maxWidth);
}

function drawOrbitalMotif(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  strokeColor: string,
  accentColor: string,
  alpha = 0.14
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = strokeColor;
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI * 0.85, Math.PI * 1.95);
  ctx.stroke();

  ctx.lineWidth = 2;
  ctx.strokeStyle = accentColor;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.78, Math.PI * 0.08, Math.PI * 0.92);
  ctx.stroke();
  ctx.restore();
}

export default function AdminBrandCardStudio({ onToast }: AdminBrandCardStudioProps) {
  const [layoutId, setLayoutId] = useState<CardLayoutId>(DEFAULT_STATE.layoutId);
  const [accentId, setAccentId] = useState<AccentPaletteId>(DEFAULT_STATE.accentId);
  const [selectedLogoId, setSelectedLogoId] = useState<LogoVariationId>(
    DEFAULT_STATE.selectedLogoId
  );
  const [logoFraming, setLogoFraming] = useState<LogoFraming>(DEFAULT_STATE.logoFraming);
  const [cornerStyle, setCornerStyle] = useState<CornerStyle>(DEFAULT_STATE.cornerStyle);

  const [personName, setPersonName] = useState(DEFAULT_STATE.personName);
  const [personRole, setPersonRole] = useState(DEFAULT_STATE.personRole);
  const [brandTitle, setBrandTitle] = useState(DEFAULT_STATE.brandTitle);
  const [brandSubtitle, setBrandSubtitle] = useState(DEFAULT_STATE.brandSubtitle);
  const [customTagline, setCustomTagline] = useState(DEFAULT_STATE.customTagline);
  const [contactPhone, setContactPhone] = useState(DEFAULT_STATE.contactPhone);
  const [contactEmail, setContactEmail] = useState(DEFAULT_STATE.contactEmail);
  const [contactLocation, setContactLocation] = useState(DEFAULT_STATE.contactLocation);
  const [qrUrl, setQrUrl] = useState(DEFAULT_STATE.qrUrl);
  const [qrLabel, setQrLabel] = useState(DEFAULT_STATE.qrLabel);
  const [qrHint, setQrHint] = useState(DEFAULT_STATE.qrHint);
  const [heritageBadge, setHeritageBadge] = useState(DEFAULT_STATE.heritageBadge);
  const [brandsLine, setBrandsLine] = useState(DEFAULT_STATE.brandsLine);

  const [showQr, setShowQr] = useState(DEFAULT_STATE.showQr);
  const [showHeritage, setShowHeritage] = useState(DEFAULT_STATE.showHeritage);
  const [showBrandsLine, setShowBrandsLine] = useState(DEFAULT_STATE.showBrandsLine);
  const [showBackContact, setShowBackContact] = useState(DEFAULT_STATE.showBackContact);

  const [exportingMode, setExportingMode] = useState<
    "front" | "back" | "sheet" | null
  >(null);

  const hiddenQrContainerRef = useRef<HTMLDivElement | null>(null);

  const activeLogo = useMemo(
    () =>
      NAVY_SKY_LOGO_VARIATIONS.find((l) => l.id === selectedLogoId) ||
      NAVY_SKY_LOGO_VARIATIONS[0],
    [selectedLogoId]
  );

  const activeAccent = useMemo(
    () => ACCENT_PALETTES.find((p) => p.id === accentId) || ACCENT_PALETTES[0],
    [accentId]
  );

  const activeLayout = useMemo(
    () => CARD_LAYOUTS.find((l) => l.id === layoutId) || CARD_LAYOUTS[0],
    [layoutId]
  );

  const notify = (msg: string) => {
    if (onToast) onToast(msg);
  };

  const applyPresetPerson = (preset: "kamal" | "mrs" | "general") => {
    if (preset === "kamal") {
      setPersonName("Kamal Hannachi");
      setPersonRole("Inhaber · Fachberatung & Ersatzteile");
      setCustomTagline(
        "Persönliche Fachberatung · Original-Ersatzteile (E-Nr.) · Markengeräte"
      );
      notify("Vorlage für Kamal Hannachi aktiviert");
    } else if (preset === "mrs") {
      setPersonName("Frau Hannachi");
      setPersonRole("Geschäftsleitung & Kundenservice");
      setCustomTagline(
        "Termine nach Vereinbarung · Ersatzteil-Service · Markengeräte"
      );
      notify("Vorlage für Frau Hannachi aktiviert");
    } else {
      setPersonName("Hannachi Fachhandel");
      setPersonRole("Markengeräte & Original-Ersatzteile");
      setCustomTagline("An- & Verkauf ausgewählter Geräte · E-Nr. Teile-Service");
      notify("Allgemeine Geschäftskarte aktiviert");
    }
  };

  const generateNextDesign = () => {
    const layoutOrder: CardLayoutId[] = [
      "signature_midnight",
      "atelier_porcelain",
      "ruby_sapphire_split",
      "editorial_monogram",
    ];
    const accentOrder: AccentPaletteId[] = [
      "ruby_sapphire",
      "sapphire_sky",
      "crimson_velvet",
      "platinum_steel",
    ];
    const logoOrder: LogoVariationId[] = [
      "emblem-official",
      "emblem-pro",
      "symbol-h",
      "monogram-pro",
      "seal-pro",
      "seal-1x1",
      "lockup-dark",
      "lockup-light",
    ];

    const nextLayoutIndex = (layoutOrder.indexOf(layoutId) + 1) % layoutOrder.length;
    const nextLayout = layoutOrder[nextLayoutIndex];
    const nextAccent =
      accentOrder[(accentOrder.indexOf(accentId) + 1) % accentOrder.length];

    // Pick a logo that matches dark/light layout naturally
    const layoutMeta = CARD_LAYOUTS.find((l) => l.id === nextLayout)!;
    const suitableLogos = logoOrder.filter((id) => {
      if (id === "lockup-light" && layoutMeta.isDarkBase) return false;
      if (id === "lockup-dark" && !layoutMeta.isDarkBase && nextLayout !== "ruby_sapphire_split")
        return false;
      return true;
    });
    const nextLogo =
      suitableLogos[(suitableLogos.indexOf(selectedLogoId) + 1) % suitableLogos.length] ||
      "emblem-official";

    setLayoutId(nextLayout);
    setAccentId(nextAccent);
    setSelectedLogoId(nextLogo);
    setLogoFraming(nextLogo === "seal-1x1" ? "framed" : "seamless");

    notify(`Neues Design generiert: ${layoutMeta.name}`);
  };

  const resetToDefaults = () => {
    setLayoutId(DEFAULT_STATE.layoutId);
    setAccentId(DEFAULT_STATE.accentId);
    setSelectedLogoId(DEFAULT_STATE.selectedLogoId);
    setLogoFraming(DEFAULT_STATE.logoFraming);
    setCornerStyle(DEFAULT_STATE.cornerStyle);
    setPersonName(DEFAULT_STATE.personName);
    setPersonRole(DEFAULT_STATE.personRole);
    setBrandTitle(DEFAULT_STATE.brandTitle);
    setBrandSubtitle(DEFAULT_STATE.brandSubtitle);
    setCustomTagline(DEFAULT_STATE.customTagline);
    setContactPhone(DEFAULT_STATE.contactPhone);
    setContactEmail(DEFAULT_STATE.contactEmail);
    setContactLocation(DEFAULT_STATE.contactLocation);
    setQrUrl(DEFAULT_STATE.qrUrl);
    setQrLabel(DEFAULT_STATE.qrLabel);
    setQrHint(DEFAULT_STATE.qrHint);
    setHeritageBadge(DEFAULT_STATE.heritageBadge);
    setBrandsLine(DEFAULT_STATE.brandsLine);
    setShowQr(DEFAULT_STATE.showQr);
    setShowHeritage(DEFAULT_STATE.showHeritage);
    setShowBrandsLine(DEFAULT_STATE.showBrandsLine);
    setShowBackContact(DEFAULT_STATE.showBackContact);
    notify("Alle Visitenkarten-Einstellungen auf Kamal Hannachi Standard zurückgesetzt");
  };

  const handleDownloadAssetImage = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    notify(`Download gestartet: ${filename}`);
  };

  const renderCardSideToCanvas = async (
    ctx: CanvasRenderingContext2D,
    side: "front" | "back",
    offsetX = 0,
    offsetY = 0
  ) => {
    const W = 1050;
    const H = 675;
    const cardRadius = cornerStyle === "rounded" ? 28 : 0;
    const isFramedLogo = logoFraming === "framed";
    const qrSvg = hiddenQrContainerRef.current?.querySelector("svg") ?? null;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    if (cardRadius > 0) {
      ctx.beginPath();
      ctx.roundRect(0, 0, W, H, cardRadius);
      ctx.clip();
    } else {
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.clip();
    }

    const displayBrand = brandTitle.trim() || "Hannachi";
    const displaySub = brandSubtitle.trim() || "Elektrohaushaltsgeräte & Ersatzteile";

    if (side === "front") {
      if (layoutId === "atelier_porcelain") {
        // Pure porcelain white front + vertical sapphire QR dock on right
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, W, H);

        // Top dual hairline matching official Hannachi colors
        ctx.fillStyle = "#071126";
        ctx.fillRect(0, 0, W * 0.66, 12);
        ctx.fillStyle = activeAccent.primary;
        ctx.fillRect(W * 0.66, 0, W * 0.34, 12);

        // Subtle sapphire geometric arc watermark on bottom-left
        drawOrbitalMotif(ctx, 110, 620, 240, activeAccent.secondaryDeep, activeAccent.primary, 0.08);

        const contentMaxW = showQr ? 570 : 910;

        // Logo + Brand Lockup
        await drawLogoToCanvas(ctx, activeLogo.src, 56, 56, 114, 96, {
          framed: isFramedLogo,
          radius: 16,
          bgColor: activeLogo.darkBg ? "#071126" : "#F8FAFC",
          borderColor: "#CBD5E1",
        });

        ctx.textAlign = "left";
        const wordGrad = ctx.createLinearGradient(190, 62, 190, 120);
        wordGrad.addColorStop(0, activeAccent.primaryLight);
        wordGrad.addColorStop(0.55, activeAccent.primary);
        wordGrad.addColorStop(1, activeAccent.primaryDeep);
        ctx.fillStyle = wordGrad;
        drawFittedText(
          ctx,
          displayBrand,
          190,
          104,
          contentMaxW - 140,
          (s) => `900 ${s}px "Plus Jakarta Sans", system-ui, sans-serif`,
          46,
          26
        );

        // Ruby-to-sapphire underline
        const lineGrad = ctx.createLinearGradient(190, 0, 440, 0);
        lineGrad.addColorStop(0, activeAccent.primary);
        lineGrad.addColorStop(1, activeAccent.secondaryDeep);
        ctx.fillStyle = lineGrad;
        ctx.fillRect(190, 114, Math.min(250, contentMaxW - 140), 3.5);

        ctx.fillStyle = "#0F172A";
        drawFittedText(
          ctx,
          displaySub.toUpperCase(),
          190,
          140,
          contentMaxW - 140,
          (s) => `800 ${s}px "Plus Jakarta Sans", system-ui, sans-serif`,
          15,
          11
        );

        // Divider rule
        ctx.fillStyle = "#E2E8F0";
        ctx.fillRect(56, 182, contentMaxW, 2);

        // Person Name + Role + Tagline
        ctx.fillStyle = "#071126";
        drawFittedText(
          ctx,
          personName,
          56,
          248,
          contentMaxW,
          (s) => `900 ${s}px "Plus Jakarta Sans", system-ui, sans-serif`,
          42,
          24
        );

        ctx.fillStyle = activeAccent.secondaryDeep;
        drawFittedText(
          ctx,
          personRole,
          56,
          286,
          contentMaxW,
          (s) => `700 ${s}px "Plus Jakarta Sans", system-ui, sans-serif`,
          22,
          15
        );

        ctx.fillStyle = "#475569";
        drawFittedText(
          ctx,
          customTagline,
          56,
          322,
          contentMaxW,
          (s) => `600 ${s}px "Plus Jakarta Sans", system-ui, sans-serif`,
          16,
          12
        );

        // Contact Pill + Details
        ctx.fillStyle = "#F0F9FF";
        ctx.strokeStyle = "#BAE6FD";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(56, 404, Math.min(470, contentMaxW), 60, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#071126";
        drawFittedText(
          ctx,
          `Tel. & WhatsApp: ${contactPhone}`,
          76,
          442,
          Math.min(430, contentMaxW - 40),
          (s) => `800 ${s}px "JetBrains Mono", monospace`,
          22,
          15
        );

        ctx.fillStyle = "#0F172A";
        drawFittedText(
          ctx,
          contactEmail,
          56,
          508,
          contentMaxW,
          (s) => `700 ${s}px "Plus Jakarta Sans", system-ui, sans-serif`,
          20,
          14
        );

        ctx.fillStyle = "#475569";
        drawFittedText(
          ctx,
          contactLocation,
          56,
          544,
          contentMaxW,
          (s) => `600 ${s}px "Plus Jakarta Sans", system-ui, sans-serif`,
          18,
          13
        );

        if (showHeritage) {
          ctx.fillStyle = activeAccent.primary;
          ctx.font = '800 14px "Plus Jakarta Sans", system-ui, sans-serif';
          ctx.fillText(heritageBadge.toUpperCase(), 56, 616);
        }

        // Vertical Sapphire QR Dock on right
        if (showQr) {
          const dockGrad = ctx.createLinearGradient(680, 72, 995, H);
          dockGrad.addColorStop(0, "#0C2558");
          dockGrad.addColorStop(1, "#071126");
          ctx.fillStyle = dockGrad;
          ctx.beginPath();
          ctx.roundRect(686, 70, 310, H - 70, [28, 28, 0, 0]);
          ctx.fill();

          // Ruby top accent on dock
          ctx.fillStyle = activeAccent.primary;
          ctx.beginPath();
          ctx.roundRect(756, 70, 170, 6, 3);
          ctx.fill();

          ctx.fillStyle = "#FFFFFF";
          ctx.beginPath();
          ctx.roundRect(732, 126, 218, 218, 20);
          ctx.fill();
          await drawSvgElementToCanvas(ctx, qrSvg, 748, 142, 186);

          ctx.textAlign = "center";
          ctx.fillStyle = "#FFFFFF";
          drawFittedText(
            ctx,
            qrLabel || "hannachi.de",
            841,
            406,
            270,
            (s) => `900 ${s}px "JetBrains Mono", monospace`,
            28,
            18
          );
          ctx.fillStyle = activeAccent.secondary;
          drawFittedText(
            ctx,
            qrHint,
            841,
            444,
            270,
            (s) => `700 ${s}px "Plus Jakarta Sans", system-ui, sans-serif`,
            16,
            12
          );
          if (showHeritage) {
            ctx.fillStyle = "#94A3B8";
            ctx.font = '700 13px "Plus Jakarta Sans", system-ui, sans-serif';
            ctx.fillText(heritageBadge.toUpperCase(), 841, 616);
          }
          ctx.textAlign = "left";
        }
      } else if (layoutId === "ruby_sapphire_split") {
        // Two-tone executive split: Left deep sapphire wing, ruby divider stripe, right crisp white workspace
        const wingW = 390;
        const wingGrad = ctx.createLinearGradient(0, 0, wingW, H);
        wingGrad.addColorStop(0, "#071126");
        wingGrad.addColorStop(1, "#0C2558");
        ctx.fillStyle = wingGrad;
        ctx.fillRect(0, 0, wingW, H);

        // Subtle orbital motif in left wing
        drawOrbitalMotif(ctx, wingW * 0.5, H * 0.42, 175, activeAccent.secondary, activeAccent.primaryLight, 0.16);

        // Right crisp white canvas
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(wingW, 0, W - wingW, H);

        // Crisp vertical divider bar
        ctx.fillStyle = activeAccent.primary;
        ctx.fillRect(wingW, 0, 8, H);

        // Logo centered inside left sapphire wing
        await drawLogoToCanvas(ctx, activeLogo.src, 105, 118, 180, 165, {
          framed: isFramedLogo,
          radius: 22,
          bgColor: activeLogo.darkBg ? "#020617" : "#FFFFFF",
          borderColor: activeAccent.secondary,
        });

        ctx.textAlign = "center";
        const wordGrad = ctx.createLinearGradient(0, 320, 0, 375);
        wordGrad.addColorStop(0, activeAccent.primaryLight);
        wordGrad.addColorStop(0.55, activeAccent.primary);
        wordGrad.addColorStop(1, activeAccent.primaryDeep);
        ctx.fillStyle = wordGrad;
        drawFittedText(
          ctx,
          displayBrand,
          wingW / 2,
          358,
          wingW - 56,
          (s) => `900 ${s}px "Plus Jakarta Sans", system-ui, sans-serif`,
          42,
          24
        );

        ctx.fillStyle = activeAccent.secondary;
        ctx.fillRect(wingW / 2 - 68, 374, 136, 3);

        ctx.fillStyle = "#E2E8F0";
        drawFittedText(
          ctx,
          displaySub,
          wingW / 2,
          412,
          wingW - 60,
          (s) => `700 ${s}px "Plus Jakarta Sans", system-ui, sans-serif`,
          15,
          11
        );

        if (showHeritage) {
          ctx.fillStyle = "rgba(100,181,236,0.16)";
          ctx.strokeStyle = "rgba(100,181,236,0.45)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(72, 548, 246, 44, 22);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#BAE6FD";
          ctx.font = '800 13px "Plus Jakarta Sans", system-ui, sans-serif';
          ctx.fillText(heritageBadge.toUpperCase(), wingW / 2, 575);
        }

        // Right Workspace: Contact & QR
        ctx.textAlign = "left";
        const rx = wingW + 48;
        const rightMaxW = W - rx - 46;

        ctx.fillStyle = "#071126";
        drawFittedText(
          ctx,
          personName,
          rx,
          118,
          rightMaxW,
          (s) => `900 ${s}px "Plus Jakarta Sans", system-ui, sans-serif`,
          44,
          26
        );

        ctx.fillStyle = activeAccent.primary;
        drawFittedText(
          ctx,
          personRole,
          rx,
          158,
          rightMaxW,
          (s) => `800 ${s}px "Plus Jakarta Sans", system-ui, sans-serif`,
          22,
          15
        );

        ctx.fillStyle = "#475569";
        drawFittedText(
          ctx,
          customTagline,
          rx,
          196,
          rightMaxW,
          (s) => `600 ${s}px "Plus Jakarta Sans", system-ui, sans-serif`,
          16,
          12
        );

        ctx.fillStyle = "#E2E8F0";
        ctx.fillRect(rx, 232, rightMaxW, 2);

        const contactBlockW = showQr ? rightMaxW - 210 : rightMaxW;
        ctx.fillStyle = "#F8FAFC";
        ctx.strokeStyle = "#CBD5E1";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(rx, 276, contactBlockW, 60, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#071126";
        drawFittedText(
          ctx,
          `Tel.: ${contactPhone}`,
          rx + 18,
          314,
          contactBlockW - 36,
          (s) => `800 ${s}px "JetBrains Mono", monospace`,
          22,
          15
        );

        ctx.fillStyle = "#0F172A";
        drawFittedText(
          ctx,
          contactEmail,
          rx,
          388,
          contactBlockW,
          (s) => `700 ${s}px "Plus Jakarta Sans", system-ui, sans-serif`,
          20,
          14
        );

        ctx.fillStyle = "#475569";
        drawFittedText(
          ctx,
          contactLocation,
          rx,
          426,
          contactBlockW,
          (s) => `600 ${s}px "Plus Jakarta Sans", system-ui, sans-serif`,
          17,
          13
        );

        ctx.fillStyle = activeAccent.secondaryDeep;
        drawFittedText(
          ctx,
          qrLabel || "hannachi.de",
          rx,
          574,
          contactBlockW,
          (s) => `800 ${s}px "JetBrains Mono", monospace`,
          19,
          14
        );

        if (showQr) {
          ctx.fillStyle = "#F8FAFC";
          ctx.strokeStyle = activeAccent.secondaryDeep;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(W - 232, 378, 186, 224, 18);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#FFFFFF";
          ctx.beginPath();
          ctx.roundRect(W - 214, 396, 150, 150, 12);
          ctx.fill();
          await drawSvgElementToCanvas(ctx, qrSvg, W - 208, 402, 138);

          ctx.textAlign = "center";
          ctx.fillStyle = "#071126";
          drawFittedText(
            ctx,
            qrHint,
            W - 139,
            582,
            168,
            (s) => `700 ${s}px "Plus Jakarta Sans", system-ui, sans-serif`,
            13,
            10
          );
          ctx.textAlign = "left";
        }
      } else if (layoutId === "editorial_monogram") {
        // Architectural Midnight Slate with giant subtle emblem watermark
        const bgGrad = ctx.createLinearGradient(0, 0, W, H);
        bgGrad.addColorStop(0, "#050B18");
        bgGrad.addColorStop(0.55, "#081734");
        bgGrad.addColorStop(1, "#0B224E");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // Subtle giant emblem watermark on right
        await drawLogoToCanvas(ctx, HANNACHI_BRAND_ASSETS.symbolSvg, 640, -40, 460, 460, {
          framed: false,
          alpha: 0.08,
        });
        drawOrbitalMotif(ctx, 840, 180, 290, activeAccent.secondary, activeAccent.primaryLight, 0.14);

        // Fine editorial inner border
        ctx.strokeStyle = "rgba(100, 181, 236, 0.25)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(22, 22, W - 44, H - 44, Math.max(0, cardRadius - 12));
        ctx.stroke();

        // Top Left Lockup
        await drawLogoToCanvas(ctx, activeLogo.src, 58, 56, 98, 92, {
          framed: isFramedLogo,
          radius: 16,
          bgColor: activeLogo.darkBg ? "#020617" : "#FFFFFF",
          borderColor: activeAccent.secondary,
        });

        const wordGrad = ctx.createLinearGradient(174, 58, 174, 114);
        wordGrad.addColorStop(0, activeAccent.primaryLight);
        wordGrad.addColorStop(0.55, activeAccent.primary);
        wordGrad.addColorStop(1, activeAccent.primaryDeep);
        ctx.fillStyle = wordGrad;
        drawFittedText(
          ctx,
          displayBrand,
          174,
          104,
          560,
          (s) => `900 ${s}px "Plus Jakarta Sans", system-ui, sans-serif`,
          44,
          26
        );

        ctx.fillStyle = "#CBD5E1";
        drawFittedText(
          ctx,
          displaySub.toUpperCase(),
          174,
          134,
          560,
          (s) => `700 ${s}px "Plus Jakarta Sans", system-ui, sans-serif`,
          14,
          11
        );

        if (showHeritage) {
          ctx.textAlign = "right";
          ctx.fillStyle = activeAccent.secondary;
          ctx.font = '800 14px "Plus Jakarta Sans", system-ui, sans-serif';
          ctx.fillText(heritageBadge.toUpperCase(), W - 58, 88);
          ctx.textAlign = "left";
        }

        // Center Hero Name & Role
        const textMaxW = showQr ? 660 : 920;
        ctx.fillStyle = "#FFFFFF";
        drawFittedText(
          ctx,
          personName,
          58,
          292,
          textMaxW,
          (s) => `900 ${s}px "Plus Jakarta Sans", system-ui, sans-serif`,
          50,
          28
        );

        ctx.fillStyle = activeAccent.secondary;
        drawFittedText(
          ctx,
          personRole,
          58,
          338,
          textMaxW,
          (s) => `700 ${s}px "Plus Jakarta Sans", system-ui, sans-serif`,
          24,
          16
        );

        // Continuous ruby-to-sapphire accent bar
        const accentGrad = ctx.createLinearGradient(58, 0, 420, 0);
        accentGrad.addColorStop(0, activeAccent.primary);
        accentGrad.addColorStop(0.6, activeAccent.primaryLight);
        accentGrad.addColorStop(1, activeAccent.secondary);
        ctx.fillStyle = accentGrad;
        ctx.fillRect(58, 360, 320, 4);

        ctx.fillStyle = "#94A3B8";
        drawFittedText(
          ctx,
          customTagline,
          58,
          404,
          textMaxW,
          (s) => `500 ${s}px "Plus Jakarta Sans", system-ui, sans-serif`,
          18,
          13
        );

        // Bottom Editorial Contact Strip
        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.fillRect(58, 488, textMaxW, 1.5);

        ctx.fillStyle = "#FFFFFF";
        drawFittedText(
          ctx,
          `Tel. & WhatsApp: ${contactPhone}`,
          58,
          542,
          textMaxW,
          (s) => `800 ${s}px "JetBrains Mono", monospace`,
          22,
          15
        );

        ctx.fillStyle = "#CBD5E1";
        drawFittedText(
          ctx,
          `${contactEmail}  ·  ${contactLocation}`,
          58,
          584,
          textMaxW,
          (s) => `600 ${s}px "Plus Jakarta Sans", system-ui, sans-serif`,
          17,
          12
        );

        if (showQr) {
          ctx.fillStyle = "#FFFFFF";
          ctx.beginPath();
          ctx.roundRect(W - 266, 362, 208, 250, 20);
          ctx.fill();

          await drawSvgElementToCanvas(ctx, qrSvg, W - 246, 380, 168);

          ctx.textAlign = "center";
          ctx.fillStyle = "#071126";
          drawFittedText(
            ctx,
            qrLabel || "hannachi.de",
            W - 162,
            574,
            188,
            (s) => `900 ${s}px "JetBrains Mono", monospace`,
            18,
            13
          );
          ctx.fillStyle = activeAccent.primary;
          drawFittedText(
            ctx,
            qrHint,
            W - 162,
            598,
            188,
            (s) => `700 ${s}px "Plus Jakarta Sans", system-ui, sans-serif`,
            12,
            10
          );
          ctx.textAlign = "left";
        }
      } else {
        // "signature_midnight": Deep Official Hannachi Midnight-Sapphire + Orbital Arcs + Ruby Wordmark + White QR Tile
        const bgGrad = ctx.createLinearGradient(0, 0, W, H);
        bgGrad.addColorStop(0, "#071126");
        bgGrad.addColorStop(0.55, "#0B1E47");
        bgGrad.addColorStop(1, "#071126");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // Top dual-tone bar (Sapphire + Ruby)
        ctx.fillStyle = activeAccent.secondaryDeep;
        ctx.fillRect(0, 0, W * 0.65, 9);
        ctx.fillStyle = activeAccent.primary;
        ctx.fillRect(W * 0.65, 0, W * 0.35, 9);

        // Orbital curves inspired by official emblem
        drawOrbitalMotif(ctx, 840, 120, 260, activeAccent.secondary, activeAccent.primaryLight, 0.14);
        drawOrbitalMotif(ctx, 130, 560, 210, activeAccent.secondary, activeAccent.primary, 0.11);

        const maxLeftW = showQr ? 590 : 930;

        // Logo + Official Ruby-Gradient Wordmark
        await drawLogoToCanvas(ctx, activeLogo.src, 56, 56, 118, 102, {
          framed: isFramedLogo,
          radius: 18,
          bgColor: activeLogo.darkBg ? "#020617" : "#FFFFFF",
          borderColor: activeAccent.secondary,
        });

        const wordGrad = ctx.createLinearGradient(192, 60, 192, 120);
        wordGrad.addColorStop(0, activeAccent.primaryLight);
        wordGrad.addColorStop(0.5, activeAccent.primary);
        wordGrad.addColorStop(1, activeAccent.primaryDeep);
        ctx.fillStyle = wordGrad;
        drawFittedText(
          ctx,
          displayBrand,
          192,
          106,
          maxLeftW - 140,
          (s) => `900 ${s}px "Plus Jakarta Sans", system-ui, sans-serif`,
          46,
          26
        );

        // Flowing Ruby + Sapphire underline right under Hannachi
        const uGrad = ctx.createLinearGradient(192, 0, 440, 0);
        uGrad.addColorStop(0, activeAccent.primary);
        uGrad.addColorStop(0.7, activeAccent.secondary);
        uGrad.addColorStop(1, "rgba(100,181,236,0)");
        ctx.fillStyle = uGrad;
        ctx.fillRect(192, 116, Math.min(250, maxLeftW - 140), 3.5);

        ctx.fillStyle = "#CBD5E1";
        drawFittedText(
          ctx,
          displaySub.toUpperCase(),
          192,
          144,
          maxLeftW - 140,
          (s) => `800 ${s}px "Plus Jakarta Sans", system-ui, sans-serif`,
          15,
          11
        );

        // Divider
        ctx.fillStyle = "rgba(100, 181, 236, 0.22)";
        ctx.fillRect(56, 186, maxLeftW, 1.5);

        // Person Name + Role + Tagline
        ctx.fillStyle = "#FFFFFF";
        drawFittedText(
          ctx,
          personName,
          56,
          254,
          maxLeftW,
          (s) => `900 ${s}px "Plus Jakarta Sans", system-ui, sans-serif`,
          42,
          24
        );

        ctx.fillStyle = activeAccent.secondary;
        drawFittedText(
          ctx,
          personRole,
          56,
          296,
          maxLeftW,
          (s) => `700 ${s}px "Plus Jakarta Sans", system-ui, sans-serif`,
          22,
          15
        );

        ctx.fillStyle = "#94A3B8";
        drawFittedText(
          ctx,
          customTagline,
          56,
          334,
          maxLeftW,
          (s) => `600 ${s}px "Plus Jakarta Sans", system-ui, sans-serif`,
          16,
          12
        );

        // Contact pill + details
        ctx.fillStyle = "rgba(25, 116, 184, 0.22)";
        ctx.strokeStyle = "rgba(100, 181, 236, 0.45)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(56, 412, Math.min(470, maxLeftW), 62, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#FFFFFF";
        drawFittedText(
          ctx,
          `Tel. & WhatsApp: ${contactPhone}`,
          76,
          451,
          Math.min(430, maxLeftW - 40),
          (s) => `800 ${s}px "JetBrains Mono", monospace`,
          22,
          15
        );

        ctx.fillStyle = "#E2E8F0";
        drawFittedText(
          ctx,
          contactEmail,
          56,
          518,
          maxLeftW,
          (s) => `700 ${s}px "Plus Jakarta Sans", system-ui, sans-serif`,
          20,
          14
        );

        ctx.fillStyle = "#94A3B8";
        drawFittedText(
          ctx,
          contactLocation,
          56,
          556,
          maxLeftW,
          (s) => `600 ${s}px "Plus Jakarta Sans", system-ui, sans-serif`,
          18,
          13
        );

        if (showHeritage) {
          ctx.fillStyle = activeAccent.primaryLight;
          ctx.font = '800 13px "Plus Jakarta Sans", system-ui, sans-serif';
          ctx.fillText(heritageBadge.toUpperCase(), 56, 616);
        }

        // Elevated White QR Card on Right
        if (showQr) {
          ctx.fillStyle = "#FFFFFF";
          ctx.strokeStyle = activeAccent.secondary;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.roundRect(700, 150, 294, 382, 24);
          ctx.fill();
          ctx.stroke();

          // Ruby top pip on QR card
          ctx.fillStyle = activeAccent.primary;
          ctx.beginPath();
          ctx.roundRect(778, 166, 138, 6, 3);
          ctx.fill();

          await drawSvgElementToCanvas(ctx, qrSvg, 742, 192, 210);

          ctx.textAlign = "center";
          ctx.fillStyle = "#071126";
          drawFittedText(
            ctx,
            qrLabel || "hannachi.de",
            847,
            452,
            258,
            (s) => `900 ${s}px "JetBrains Mono", monospace`,
            26,
            16
          );
          ctx.fillStyle = activeAccent.primary;
          drawFittedText(
            ctx,
            qrHint,
            847,
            488,
            258,
            (s) => `700 ${s}px "Plus Jakarta Sans", system-ui, sans-serif`,
            15,
            11
          );
          ctx.textAlign = "left";
        }

        // Bottom ruby bar
        ctx.fillStyle = activeAccent.primary;
        ctx.fillRect(0, H - 8, W, 8);
      }
    } else {
      // BACK SIDE — matches active layout (light or dark) & accent
      const isBackLight = layoutId === "atelier_porcelain";

      if (isBackLight) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, W, H);
        drawOrbitalMotif(ctx, W / 2, H / 2, 260, activeAccent.secondaryDeep, activeAccent.primary, 0.08);
        ctx.strokeStyle = "#CBD5E1";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(24, 24, W - 48, H - 48, Math.max(0, cardRadius - 12));
        ctx.stroke();
      } else {
        const backGrad = ctx.createLinearGradient(0, 0, W, H);
        backGrad.addColorStop(0, "#071126");
        backGrad.addColorStop(0.5, "#0C2558");
        backGrad.addColorStop(1, "#071126");
        ctx.fillStyle = backGrad;
        ctx.fillRect(0, 0, W, H);
        drawOrbitalMotif(ctx, W / 2, H / 2, 260, activeAccent.secondary, activeAccent.primaryLight, 0.14);
        ctx.strokeStyle = "rgba(100,181,236,0.3)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(24, 24, W - 48, H - 48, Math.max(0, cardRadius - 12));
        ctx.stroke();
      }

      ctx.textAlign = "center";
      const wordGrad = ctx.createLinearGradient(0, 62, 0, 118);
      wordGrad.addColorStop(0, activeAccent.primaryLight);
      wordGrad.addColorStop(0.55, activeAccent.primary);
      wordGrad.addColorStop(1, activeAccent.primaryDeep);
      ctx.fillStyle = wordGrad;
      drawFittedText(
        ctx,
        displayBrand,
        W / 2,
        106,
        780,
        (s) => `900 ${s}px "Plus Jakarta Sans", system-ui, sans-serif`,
        48,
        28
      );

      ctx.fillStyle = isBackLight ? "#334155" : "#E2E8F0";
      drawFittedText(
        ctx,
        displaySub.toUpperCase(),
        W / 2,
        142,
        820,
        (s) => `800 ${s}px "Plus Jakarta Sans", system-ui, sans-serif`,
        18,
        13
      );

      // Accent rule under back header
      ctx.fillStyle = activeAccent.primary;
      ctx.fillRect(W / 2 - 110, 158, 220, 3);

      // Center stage: Logo + optional QR
      if (showQr) {
        await drawLogoToCanvas(ctx, activeLogo.src, 220, 202, 230, 210, {
          framed: isFramedLogo,
          radius: 22,
          bgColor: activeLogo.darkBg ? "#020617" : "#FFFFFF",
          borderColor: activeAccent.secondary,
        });

        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = isBackLight ? "#0C2558" : activeAccent.secondary;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(570, 198, 230, 234, 22);
        ctx.fill();
        ctx.stroke();

        await drawSvgElementToCanvas(ctx, qrSvg, 598, 214, 174);
        ctx.fillStyle = "#071126";
        drawFittedText(
          ctx,
          qrLabel || "hannachi.de",
          685,
          415,
          196,
          (s) => `900 ${s}px "JetBrains Mono", monospace`,
          18,
          13
        );
      } else {
        await drawLogoToCanvas(ctx, activeLogo.src, W / 2 - 135, 196, 270, 235, {
          framed: isFramedLogo,
          radius: 24,
          bgColor: activeLogo.darkBg ? "#020617" : "#FFFFFF",
          borderColor: activeAccent.secondary,
        });
      }

      if (showBrandsLine) {
        ctx.fillStyle = isBackLight ? "#475569" : "#CBD5E1";
        drawFittedText(
          ctx,
          brandsLine,
          W / 2,
          518,
          920,
          (s) => `600 ${s}px "Plus Jakarta Sans", system-ui, sans-serif`,
          20,
          14
        );
      }

      if (showBackContact) {
        ctx.fillStyle = isBackLight ? activeAccent.secondaryDeep : activeAccent.secondary;
        drawFittedText(
          ctx,
          `${personName} · Tel. ${contactPhone} · ${contactEmail}`,
          W / 2,
          566,
          920,
          (s) => `800 ${s}px "Plus Jakarta Sans", system-ui, sans-serif`,
          22,
          14
        );
      }

      if (showHeritage) {
        ctx.fillStyle = isBackLight ? activeAccent.primary : activeAccent.primaryLight;
        ctx.font = '800 14px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText(heritageBadge.toUpperCase(), W / 2, 616);
      }
      ctx.textAlign = "left";
    }

    ctx.restore();
  };

  const exportBusinessCardPng = async (mode: "front" | "back" | "sheet") => {
    setExportingMode(mode);
    try {
      const slug = personName.toLowerCase().replace(/[^a-z0-9]+/gi, "-");

      if (mode === "sheet") {
        const sheetW = 2240;
        const sheetH = 840;
        const canvas = document.createElement("canvas");
        canvas.width = sheetW;
        canvas.height = sheetH;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.fillStyle = "#F1F5F9";
        ctx.fillRect(0, 0, sheetW, sheetH);

        ctx.fillStyle = "#071126";
        ctx.font = '800 22px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText(
          `HANNACHI DRUCKBOGEN · ${personName.toUpperCase()} · ${activeLayout.name.toUpperCase()} · 85 × 55 MM (300 DPI)`,
          50,
          48
        );

        await renderCardSideToCanvas(ctx, "front", 50, 82);
        await renderCardSideToCanvas(ctx, "back", 1140, 82);

        ctx.fillStyle = "#475569";
        ctx.font = '700 16px "JetBrains Mono", monospace';
        ctx.fillText("VORDERSEITE (1050 × 675 PX)", 50, 792);
        ctx.fillText("RÜCKSEITE (1050 × 675 PX)", 1140, 792);

        const pngUrl = canvas.toDataURL("image/png", 1.0);
        handleDownloadAssetImage(
          pngUrl,
          `Hannachi-Druckbogen-${slug}-${layoutId}.png`
        );
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = 1050;
      canvas.height = 675;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      await renderCardSideToCanvas(ctx, mode, 0, 0);

      const pngUrl = canvas.toDataURL("image/png", 1.0);
      const filename =
        mode === "front"
          ? `Hannachi-Visitenkarte-Vorderseite-${slug}.png`
          : `Hannachi-Visitenkarte-Rueckseite-${slug}.png`;

      handleDownloadAssetImage(pngUrl, filename);
    } finally {
      setExportingMode(null);
    }
  };

  const wordmarkStyle = {
    backgroundImage: `linear-gradient(180deg, ${activeAccent.primaryLight} 0%, ${activeAccent.primary} 55%, ${activeAccent.primaryDeep} 100%)`,
  };

  const radiusClass = cornerStyle === "rounded" ? "rounded-2xl" : "rounded-none";
  const displayBrand = brandTitle.trim() || "Hannachi";
  const displaySub = brandSubtitle.trim() || "Elektrohaushaltsgeräte & Ersatzteile";

  return (
    <section className="space-y-8" aria-label="Hannachi Marken- und Visitenkarten-Studio">
      {/* Offscreen crisp QR SVG source for 300 DPI Canvas serialization */}
      <div
        ref={hiddenQrContainerRef}
        aria-hidden="true"
        className="sr-only pointer-events-none"
      >
        <QRCodeSVG
          value={qrUrl || "https://hannachi.de"}
          size={240}
          level="M"
          bgColor="#FFFFFF"
          fgColor="#071126"
        />
      </div>

      {/* 1. Interactive Business Card Studio & Design Generator */}
      <div className="bg-surface dark:bg-slate-900 border border-primary/10 dark:border-white/10 rounded-xl p-5 sm:p-6 space-y-6">
        {/* Studio Header + One-Click Design Generator */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-primary/10 dark:border-white/10 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#071126] border border-[#64B5EC]/40 flex items-center justify-center shrink-0">
              <img
                src={HANNACHI_BRAND_ASSETS.symbolSvg}
                alt="Hannachi Symbol"
                className="w-7 h-7 object-contain"
              />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-ink">
                1. Visitenkarten-Studio &amp; Design-Generator ({" "}
                <span dir="ltr" translate="no" className="notranslate">
                  85 × 55 mm
                </span>
                )
              </h2>
              <p className="text-xs sm:text-sm text-ink-muted mt-0.5">
                Inspiriert vom offiziellen{" "}
                <span translate="no" className="notranslate">Hannachi</span>-Logo – generieren Sie verschiedene
                Entwürfe, passen Sie jeden Text &amp; Stil frei an und laden Sie
                druckfertige{" "}
                <span dir="ltr" translate="no" className="notranslate">300-DPI-PNGs</span>{" "}
                herunter.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={generateNextDesign}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-gradient-to-r from-[#0C2558] via-[#1974B8] to-[#C92A42] hover:brightness-110 text-white text-xs sm:text-sm font-extrabold inline-flex items-center gap-2 cursor-pointer transition-all shadow-sm"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Neues Design generieren</span>
            </button>
            <button
              type="button"
              onClick={resetToDefaults}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-primary/15 dark:border-white/15 bg-background dark:bg-slate-950 hover:border-sky-500 text-ink text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span>Standard</span>
            </button>
          </div>
        </div>

        {/* Step A: 4 Logo-Inspired Layout Templates + 4 Official Accent Palettes */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* 4 Card Layouts */}
          <div className="xl:col-span-8 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-ink-muted inline-flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                Karten-Design auswählen (4 Studio-Entwürfe)
              </span>
              <span className="text-[11px] font-mono text-ink-muted">
                Aktiv: {activeLayout.name}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {CARD_LAYOUTS.map((layout) => {
                const isSelected = layoutId === layout.id;
                return (
                  <button
                    key={layout.id}
                    type="button"
                    onClick={() => setLayoutId(layout.id)}
                    className={`group rounded-xl border p-2.5 text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? "border-sky-500 bg-sky-500/10 ring-2 ring-sky-500/25"
                        : "border-primary/15 dark:border-white/15 bg-background dark:bg-slate-950 hover:border-sky-400"
                    }`}
                  >
                    {/* Mini visual schematic preview */}
                    <div className="relative aspect-[85/55] w-full rounded-lg overflow-hidden border border-slate-300/60 dark:border-white/15">
                      {layout.id === "signature_midnight" && (
                        <div className="w-full h-full bg-[#071126] p-1.5 flex items-center justify-between">
                          <div className="space-y-1 w-3/5">
                            <div className="flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#64B5EC]" />
                              <span className="h-1.5 w-8 rounded bg-[#C92A42]" />
                            </div>
                            <div className="h-1.5 w-10 rounded bg-white/80" />
                            <div className="h-1 w-7 rounded bg-[#64B5EC]/70" />
                          </div>
                          <div className="w-5 h-7 rounded bg-white border border-[#64B5EC]" />
                        </div>
                      )}
                      {layout.id === "atelier_porcelain" && (
                        <div className="w-full h-full bg-white flex flex-col justify-between">
                          <div className="flex h-1 w-full">
                            <div className="w-2/3 bg-[#071126]" />
                            <div className="w-1/3 bg-[#C92A42]" />
                          </div>
                          <div className="flex items-end justify-between px-1.5 h-full pt-1">
                            <div className="space-y-1 pb-1.5 w-3/5">
                              <div className="h-1.5 w-8 rounded bg-[#C92A42]" />
                              <div className="h-1.5 w-10 rounded bg-[#071126]" />
                              <div className="h-1 w-7 rounded bg-slate-400" />
                            </div>
                            <div className="w-5 h-5/6 rounded-t bg-[#0C2558]" />
                          </div>
                        </div>
                      )}
                      {layout.id === "ruby_sapphire_split" && (
                        <div className="w-full h-full flex">
                          <div className="w-[38%] bg-[#071126] flex flex-col items-center justify-center gap-1 p-1">
                            <span className="w-3 h-3 rounded-full bg-[#64B5EC]" />
                            <span className="h-1 w-5 rounded bg-[#C92A42]" />
                          </div>
                          <div className="w-[3px] bg-[#C92A42]" />
                          <div className="flex-1 bg-white p-1.5 flex flex-col justify-between">
                            <div className="space-y-1">
                              <div className="h-1.5 w-10 rounded bg-[#071126]" />
                              <div className="h-1 w-7 rounded bg-[#C92A42]" />
                            </div>
                            <div className="self-end w-3.5 h-3.5 rounded bg-slate-200 border border-[#1974B8]" />
                          </div>
                        </div>
                      )}
                      {layout.id === "editorial_monogram" && (
                        <div className="w-full h-full bg-gradient-to-br from-[#050B18] to-[#0B224E] p-1.5 flex flex-col justify-between relative">
                          <div className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#64B5EC]" />
                            <span className="h-1.5 w-7 rounded bg-[#C92A42]" />
                          </div>
                          <div className="space-y-1">
                            <div className="h-2 w-12 rounded bg-white" />
                            <div className="h-0.5 w-9 rounded bg-gradient-to-r from-[#C92A42] to-[#64B5EC]" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-xs font-extrabold text-ink flex items-center gap-1">
                        {isSelected && (
                          <Check key="chk" className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                        )}
                        <span className="truncate">{layout.name}</span>
                      </div>
                      <p className="text-[10px] text-ink-muted leading-snug mt-0.5 line-clamp-2">
                        {layout.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4 Accent Palettes + Person Quick Presets */}
          <div className="xl:col-span-4 space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-ink-muted inline-flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[#C92A42]" />
                Farb-Akzent (Logo-Harmonie)
              </span>
              <div className="grid grid-cols-2 gap-2">
                {ACCENT_PALETTES.map((palette) => {
                  const isActive = accentId === palette.id;
                  return (
                    <button
                      key={palette.id}
                      type="button"
                      onClick={() => setAccentId(palette.id)}
                      className={`min-h-[44px] px-2.5 py-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                        isActive
                          ? "border-sky-500 bg-sky-500/10 ring-2 ring-sky-500/25"
                          : "border-primary/15 dark:border-white/15 bg-background dark:bg-slate-950 hover:border-sky-400"
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-md shrink-0 border border-white/25 shadow-2xs"
                        style={{ background: palette.swatchGradient }}
                      />
                      <span className="text-[11px] font-bold text-ink leading-tight truncate">
                        {palette.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-ink-muted inline-flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                Personen-Vorlagen
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPresetPerson("kamal")}
                  className={`min-h-[44px] px-2 py-1.5 rounded-xl border text-[11px] font-extrabold cursor-pointer transition-colors ${
                    personName.toLowerCase().includes("kamal")
                      ? "bg-[#0C2558] text-white border-[#64B5EC]"
                      : "bg-background dark:bg-slate-950 text-ink border-primary/15 dark:border-white/15 hover:border-sky-500"
                  }`}
                >
                  <span translate="no" className="notranslate">Kamal Hannachi</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetPerson("mrs")}
                  className={`min-h-[44px] px-2 py-1.5 rounded-xl border text-[11px] font-extrabold cursor-pointer transition-colors ${
                    personName.toLowerCase().includes("frau")
                      ? "bg-[#0C2558] text-white border-[#64B5EC]"
                      : "bg-background dark:bg-slate-950 text-ink border-primary/15 dark:border-white/15 hover:border-sky-500"
                  }`}
                >
                  <span translate="no" className="notranslate">Frau Hannachi</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetPerson("general")}
                  className={`min-h-[44px] px-2 py-1.5 rounded-xl border text-[11px] font-extrabold cursor-pointer transition-colors ${
                    !personName.toLowerCase().includes("kamal") &&
                    !personName.toLowerCase().includes("frau")
                      ? "bg-[#0C2558] text-white border-[#64B5EC]"
                      : "bg-background dark:bg-slate-950 text-ink border-primary/15 dark:border-white/15 hover:border-sky-500"
                  }`}
                >
                  Allgemein
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Step B: Logo Variant + Framing + Visual Toggles */}
        <div className="rounded-xl border border-primary/10 dark:border-white/10 bg-background/70 dark:bg-slate-950/70 p-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Logo Picker */}
            <div className="lg:col-span-7 space-y-2">
              <span className="block text-xs font-extrabold uppercase tracking-wider text-ink-muted">
                Offizielles Logo &amp; Design-Derivate auf der Karte
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {NAVY_SKY_LOGO_VARIATIONS.map((logo) => {
                  const isSelected = selectedLogoId === logo.id;
                  return (
                    <button
                      key={logo.id}
                      type="button"
                      onClick={() => setSelectedLogoId(logo.id)}
                      className={`min-h-[76px] px-2 py-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        isSelected
                          ? "border-sky-500 bg-sky-500/10 ring-2 ring-sky-500/25"
                          : "border-primary/15 dark:border-white/15 bg-surface dark:bg-slate-900 hover:border-sky-400"
                      }`}
                    >
                      <img
                        src={logo.src}
                        alt={logo.shortLabel}
                        referrerPolicy="no-referrer"
                        className={`w-11 h-9 object-contain rounded p-0.5 ${
                          logo.darkBg ? "bg-[#071126]" : "bg-white"
                        }`}
                      />
                      <span className="text-[11px] font-bold text-ink leading-tight flex items-center gap-1">
                        {isSelected && (
                          <Check key="chk" className="w-3 h-3 text-sky-600 dark:text-sky-400 shrink-0" />
                        )}
                        <span>{logo.shortLabel}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Finish & Visibility Controls */}
            <div className="lg:col-span-5 space-y-2">
              <span className="block text-xs font-extrabold uppercase tracking-wider text-ink-muted inline-flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                Format, Logo-Rahmen &amp; Elemente
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setLogoFraming(logoFraming === "seamless" ? "framed" : "seamless")
                  }
                  className="min-h-[44px] px-3 py-2 rounded-xl border border-primary/15 dark:border-white/15 bg-surface dark:bg-slate-900 hover:border-sky-400 text-xs font-bold text-ink flex items-center justify-between cursor-pointer"
                >
                  <span>Logo-Stil</span>
                  <span key={logoFraming} className="text-sky-600 dark:text-sky-400 font-extrabold">
                    {logoFraming === "seamless" ? "Nahtlos" : "Rahmen"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCornerStyle(cornerStyle === "rounded" ? "sharp" : "rounded")
                  }
                  className="min-h-[44px] px-3 py-2 rounded-xl border border-primary/15 dark:border-white/15 bg-surface dark:bg-slate-900 hover:border-sky-400 text-xs font-bold text-ink flex items-center justify-between cursor-pointer"
                >
                  <span>Ecken</span>
                  <span key={cornerStyle} className="text-sky-600 dark:text-sky-400 font-extrabold">
                    {cornerStyle === "rounded" ? "Abgerundet" : "Eckig (Druck)"}
                  </span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowQr(!showQr)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                    showQr
                      ? "border-sky-500 bg-sky-500/15 text-sky-700 dark:text-sky-300"
                      : "border-primary/15 dark:border-white/15 bg-surface dark:bg-slate-900 text-ink-muted"
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>QR-Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowHeritage(!showHeritage)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                    showHeritage
                      ? "border-sky-500 bg-sky-500/15 text-sky-700 dark:text-sky-300"
                      : "border-primary/15 dark:border-white/15 bg-surface dark:bg-slate-900 text-ink-muted"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Seit 1990</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowBrandsLine(!showBrandsLine)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                    showBrandsLine
                      ? "border-sky-500 bg-sky-500/15 text-sky-700 dark:text-sky-300"
                      : "border-primary/15 dark:border-white/15 bg-surface dark:bg-slate-900 text-ink-muted"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Markenzeile</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowBackContact(!showBackContact)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                    showBackContact
                      ? "border-sky-500 bg-sky-500/15 text-sky-700 dark:text-sky-300"
                      : "border-primary/15 dark:border-white/15 bg-surface dark:bg-slate-900 text-ink-muted"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Rückseiten-Kontakt</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Step C: Full Custom Text & Contact Fields */}
        <div className="space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-wider text-ink-muted inline-flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            Alle Texte, Kontaktdaten &amp; QR frei anpassen
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            <div>
              <label
                htmlFor="card-person-name-input"
                className="block text-xs font-semibold text-ink mb-1"
              >
                Name auf der Karte
              </label>
              <input
                id="card-person-name-input"
                type="text"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-base sm:text-sm font-bold text-ink"
              />
            </div>

            <div>
              <label
                htmlFor="card-person-role-input"
                className="block text-xs font-semibold text-ink mb-1"
              >
                Position / Schwerpunkt
              </label>
              <input
                id="card-person-role-input"
                type="text"
                value={personRole}
                onChange={(e) => setPersonRole(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-base sm:text-sm text-ink"
              />
            </div>

            <div>
              <label
                htmlFor="card-phone-input"
                className="block text-xs font-semibold text-ink mb-1"
              >
                Telefon &amp; WhatsApp
              </label>
              <input
                id="card-phone-input"
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-base sm:text-sm font-mono text-ink"
              />
            </div>

            <div>
              <label
                htmlFor="card-email-input"
                className="block text-xs font-semibold text-ink mb-1"
              >
                E-Mail-Adresse
              </label>
              <input
                id="card-email-input"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-base sm:text-sm font-mono text-ink"
              />
            </div>

            <div>
              <label
                htmlFor="card-location-input"
                className="block text-xs font-semibold text-ink mb-1"
              >
                Adresse / Standort
              </label>
              <input
                id="card-location-input"
                type="text"
                value={contactLocation}
                onChange={(e) => setContactLocation(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-base sm:text-sm text-ink"
              />
            </div>

            <div>
              <label
                htmlFor="card-tagline-input"
                className="block text-xs font-semibold text-ink mb-1"
              >
                Leistungszeile (Vorderseite)
              </label>
              <input
                id="card-tagline-input"
                type="text"
                value={customTagline}
                onChange={(e) => setCustomTagline(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-base sm:text-sm text-ink"
              />
            </div>

            <div>
              <label
                htmlFor="card-brand-title-input"
                className="block text-xs font-semibold text-ink mb-1"
              >
                Markenname &amp; Untertitel
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  id="card-brand-title-input"
                  type="text"
                  value={brandTitle}
                  onChange={(e) => setBrandTitle(e.target.value)}
                  aria-label="Markenname"
                  className="w-full min-h-[44px] px-2.5 py-2 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-sm font-bold text-ink"
                />
                <input
                  type="text"
                  value={brandSubtitle}
                  onChange={(e) => setBrandSubtitle(e.target.value)}
                  aria-label="Marken-Untertitel"
                  className="w-full min-h-[44px] px-2.5 py-2 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-xs text-ink"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="card-qr-url-input"
                className="block text-xs font-semibold text-ink mb-1"
              >
                QR-Ziel-URL &amp; Hinweistext
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  id="card-qr-url-input"
                  type="url"
                  value={qrUrl}
                  onChange={(e) => setQrUrl(e.target.value)}
                  aria-label="QR-Code Zieladresse"
                  className="w-full min-h-[44px] px-2.5 py-2 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-xs font-mono text-ink"
                />
                <input
                  type="text"
                  value={qrHint}
                  onChange={(e) => setQrHint(e.target.value)}
                  aria-label="QR-Code Hinweistext"
                  className="w-full min-h-[44px] px-2.5 py-2 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-xs text-ink"
                />
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-2">
              <label
                htmlFor="card-brands-line-input"
                className="block text-xs font-semibold text-ink mb-1"
              >
                Markenzeile auf der Rückseite
              </label>
              <input
                id="card-brands-line-input"
                type="text"
                value={brandsLine}
                onChange={(e) => setBrandsLine(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-base sm:text-sm text-ink"
              />
            </div>

            <div>
              <label
                htmlFor="card-qr-label-input"
                className="block text-xs font-semibold text-ink mb-1"
              >
                Domain-Anzeige beim QR
              </label>
              <input
                id="card-qr-label-input"
                type="text"
                value={qrLabel}
                onChange={(e) => setQrLabel(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-base sm:text-sm font-mono text-ink"
              />
            </div>

            <div>
              <label
                htmlFor="card-heritage-input"
                className="block text-xs font-semibold text-ink mb-1"
              >
                Herkunfts-Siegel
              </label>
              <input
                id="card-heritage-input"
                type="text"
                value={heritageBadge}
                onChange={(e) => setHeritageBadge(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-base sm:text-sm text-ink"
              />
            </div>
          </div>
        </div>

        {/* Live Front & Back Card Preview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* FRONT SIDE PREVIEW */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-ink-muted px-1">
              <span>VORDERSEITE · {activeLayout.name.toUpperCase()}</span>
              <span className="font-mono tabular-nums">85 × 55 mm · 1050×675 px</span>
            </div>

            {layoutId === "atelier_porcelain" && (
              <div
                translate="no"
                className={`notranslate relative aspect-[85/55] w-full ${radiusClass} overflow-hidden shadow-xl border border-slate-200 bg-white text-slate-900 p-4 sm:p-6 flex flex-col justify-between`}
              >
                {/* Top Dual Midnight + Accent Bar */}
                <div className="absolute top-0 left-0 right-[34%] h-1.5 bg-[#071126]" />
                <div
                  className="absolute top-0 right-0 w-[34%] h-1.5"
                  style={{ backgroundColor: activeAccent.primary }}
                />
                {/* Subtle orbital arc SVG */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 220 220"
                  className="absolute -bottom-16 -left-16 w-44 h-44 pointer-events-none opacity-10"
                >
                  <circle
                    cx="110"
                    cy="110"
                    r="86"
                    fill="none"
                    stroke={activeAccent.secondaryDeep}
                    strokeWidth="2.5"
                    strokeDasharray="180 90"
                  />
                  <circle
                    cx="110"
                    cy="110"
                    r="64"
                    fill="none"
                    stroke={activeAccent.primary}
                    strokeWidth="2"
                    strokeDasharray="110 120"
                  />
                </svg>

                <div className="grid grid-cols-12 gap-3 sm:gap-4 h-full pt-1 items-stretch relative z-10">
                  <div
                    className={`${
                      showQr ? "col-span-7 sm:col-span-8" : "col-span-12"
                    } flex flex-col justify-between py-0.5 min-w-0`}
                  >
                    <div>
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div
                          className={`w-11 h-10 sm:w-14 sm:h-12 flex items-center justify-center shrink-0 overflow-hidden ${
                            logoFraming === "framed"
                              ? `rounded-xl border p-1 shadow-2xs ${
                                  activeLogo.darkBg
                                    ? "bg-[#071126] border-slate-700"
                                    : "bg-slate-50 border-slate-200"
                                }`
                              : ""
                          }`}
                        >
                          <img
                            src={activeLogo.src}
                            alt="Hannachi Logo"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <div
                            style={wordmarkStyle}
                            className="text-xl sm:text-2xl font-black tracking-tight bg-clip-text text-transparent leading-none pb-0.5"
                          >
                            {displayBrand}
                          </div>
                          <div
                            className="h-[2px] w-28 sm:w-36 rounded-full my-0.5"
                            style={{
                              background: `linear-gradient(90deg, ${activeAccent.primary} 0%, ${activeAccent.secondaryDeep} 100%)`,
                            }}
                          />
                          <div className="text-[8px] sm:text-[10px] font-extrabold tracking-wide text-slate-800 uppercase truncate">
                            {displaySub}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2.5 sm:mt-3 pt-2 border-t border-slate-200">
                        <div className="text-sm sm:text-lg font-black text-[#071126] leading-tight truncate">
                          {personName}
                        </div>
                        <div
                          className="text-[11px] sm:text-xs font-extrabold truncate"
                          style={{ color: activeAccent.secondaryDeep }}
                        >
                          {personRole}
                        </div>
                        <div className="text-[9px] sm:text-[11px] font-medium text-slate-500 line-clamp-1 mt-0.5">
                          {customTagline}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="inline-block rounded-lg bg-sky-50 border border-sky-200 px-2.5 py-1 font-mono text-[10px] sm:text-xs font-extrabold text-[#071126] tabular-nums">
                        Tel. &amp; WhatsApp: {contactPhone}
                      </div>
                      <div className="text-[10px] sm:text-xs font-bold text-slate-800 truncate">
                        {contactEmail}
                      </div>
                      <div className="text-[10px] sm:text-xs font-medium text-slate-600 truncate">
                        {contactLocation}
                      </div>
                      {showHeritage && (
                        <div
                          className="text-[9px] font-extrabold uppercase tracking-wider pt-0.5"
                          style={{ color: activeAccent.primary }}
                        >
                          {heritageBadge}
                        </div>
                      )}
                    </div>
                  </div>

                  {showQr && (
                    <div className="col-span-5 sm:col-span-4 flex flex-col justify-end h-full">
                      <div className="relative bg-gradient-to-b from-[#0C2558] to-[#071126] text-white rounded-t-2xl p-2.5 sm:p-3.5 flex flex-col items-center justify-between shadow-md h-[92%] -mb-4 sm:-mb-6 pb-5 sm:pb-7">
                        <span
                          className="w-16 h-1 rounded-full mb-1"
                          style={{ backgroundColor: activeAccent.primary }}
                        />
                        <div className="bg-white p-1.5 sm:p-2 rounded-xl shadow-xs">
                          <QRCodeSVG
                            value={qrUrl || "https://hannachi.de"}
                            size={96}
                            level="M"
                            bgColor="#FFFFFF"
                            fgColor="#071126"
                            className="w-16 h-16 sm:w-22 sm:h-22"
                          />
                        </div>
                        <div className="text-center mt-1.5">
                          <div className="font-mono text-xs sm:text-sm font-black tracking-tight text-white truncate">
                            {qrLabel || "hannachi.de"}
                          </div>
                          <div
                            className="text-[8px] sm:text-[9px] font-bold leading-tight mt-0.5"
                            style={{ color: activeAccent.secondary }}
                          >
                            {qrHint}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {layoutId === "ruby_sapphire_split" && (
              <div
                translate="no"
                className={`notranslate relative aspect-[85/55] w-full ${radiusClass} overflow-hidden shadow-xl border border-slate-300/70 bg-white flex`}
              >
                {/* Left Midnight Sapphire Logo Wing */}
                <div className="w-[38%] bg-gradient-to-b from-[#071126] to-[#0C2558] text-white p-3 sm:p-4 flex flex-col items-center justify-between text-center relative overflow-hidden">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 200 200"
                    className="absolute inset-0 w-full h-full pointer-events-none opacity-15"
                  >
                    <circle
                      cx="100"
                      cy="88"
                      r="72"
                      fill="none"
                      stroke={activeAccent.secondary}
                      strokeWidth="2"
                      strokeDasharray="150 90"
                    />
                  </svg>

                  <div className="pt-2 relative z-10 flex flex-col items-center">
                    <div
                      className={`w-16 h-14 sm:w-20 sm:h-18 flex items-center justify-center overflow-hidden ${
                        logoFraming === "framed"
                          ? `rounded-2xl border p-1.5 ${
                              activeLogo.darkBg
                                ? "bg-[#020617] border-[#64B5EC]/50"
                                : "bg-white border-white/40"
                            }`
                          : ""
                      }`}
                    >
                      <img
                        src={activeLogo.src}
                        alt="Hannachi Logo"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div
                      style={wordmarkStyle}
                      className="mt-2 text-lg sm:text-xl font-black tracking-tight bg-clip-text text-transparent leading-none"
                    >
                      {displayBrand}
                    </div>
                    <div
                      className="h-[2px] w-16 rounded-full my-1.5"
                      style={{ backgroundColor: activeAccent.secondary }}
                    />
                    <div className="text-[8px] sm:text-[9px] font-bold text-slate-200 leading-tight line-clamp-2">
                      {displaySub}
                    </div>
                  </div>

                  {showHeritage && (
                    <div className="relative z-10 rounded-full border border-[#64B5EC]/40 bg-[#64B5EC]/10 px-2.5 py-0.5 text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider text-sky-200">
                      {heritageBadge}
                    </div>
                  )}
                </div>

                {/* Vertical Ruby Divider */}
                <div
                  className="w-1.5 shrink-0"
                  style={{ backgroundColor: activeAccent.primary }}
                />

                {/* Right Crisp White Contact & QR Workspace */}
                <div className="flex-1 p-3.5 sm:p-5 flex flex-col justify-between text-slate-900 min-w-0">
                  <div>
                    <div className="text-base sm:text-xl font-black text-[#071126] leading-tight truncate">
                      {personName}
                    </div>
                    <div
                      className="text-[10px] sm:text-xs font-extrabold truncate mt-0.5"
                      style={{ color: activeAccent.primary }}
                    >
                      {personRole}
                    </div>
                    <div className="text-[9px] sm:text-[10px] font-medium text-slate-500 line-clamp-1 mt-1 pb-2 border-b border-slate-200">
                      {customTagline}
                    </div>
                  </div>

                  <div className="flex items-end justify-between gap-2.5 pt-1">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="inline-block rounded-lg bg-slate-50 border border-slate-200 px-2 py-1 font-mono text-[10px] sm:text-xs font-extrabold text-[#071126] tabular-nums">
                        Tel.: {contactPhone}
                      </div>
                      <div className="text-[10px] sm:text-xs font-bold text-slate-800 truncate">
                        {contactEmail}
                      </div>
                      <div className="text-[9px] sm:text-[11px] font-medium text-slate-600 truncate">
                        {contactLocation}
                      </div>
                      <div
                        className="text-[10px] font-mono font-extrabold pt-0.5 truncate"
                        style={{ color: activeAccent.secondaryDeep }}
                      >
                        {qrLabel || "hannachi.de"}
                      </div>
                    </div>

                    {showQr && (
                      <div
                        className="rounded-xl border bg-slate-50 p-1.5 flex flex-col items-center shrink-0"
                        style={{ borderColor: activeAccent.secondaryDeep }}
                      >
                        <QRCodeSVG
                          value={qrUrl || "https://hannachi.de"}
                          size={68}
                          level="M"
                          bgColor="#FFFFFF"
                          fgColor="#071126"
                          className="w-13 h-13 sm:w-16 sm:h-16"
                        />
                        <span className="text-[7px] sm:text-[8px] font-bold text-[#071126] mt-0.5 text-center leading-none">
                          {qrHint}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {layoutId === "editorial_monogram" && (
              <div
                translate="no"
                className={`notranslate relative aspect-[85/55] w-full ${radiusClass} overflow-hidden shadow-xl border border-[#64B5EC]/30 bg-gradient-to-br from-[#050B18] via-[#081734] to-[#0B224E] text-white p-4 sm:p-6 flex flex-col justify-between`}
              >
                {/* Inner fine hairline */}
                <div
                  className={`inset-2.5 border border-[#64B5EC]/20 pointer-events-none absolute ${
                    cornerStyle === "rounded" ? "rounded-xl" : "rounded-none"
                  }`}
                />
                {/* Large watermark H symbol */}
                <img
                  src={HANNACHI_BRAND_ASSETS.symbolSvg}
                  alt=""
                  aria-hidden="true"
                  className="absolute -right-8 -top-8 w-48 h-48 sm:w-56 sm:h-56 object-contain opacity-[0.09] pointer-events-none select-none"
                />

                {/* Top Header */}
                <div className="relative z-10 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-11 flex items-center justify-center shrink-0 overflow-hidden ${
                        logoFraming === "framed"
                          ? `rounded-xl border p-1 ${
                              activeLogo.darkBg
                                ? "bg-[#020617] border-[#64B5EC]/40"
                                : "bg-white border-white/40"
                            }`
                          : ""
                      }`}
                    >
                      <img
                        src={activeLogo.src}
                        alt="Hannachi Logo"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <div
                        style={wordmarkStyle}
                        className="text-lg sm:text-xl font-black tracking-tight bg-clip-text text-transparent leading-none"
                      >
                        {displayBrand}
                      </div>
                      <div className="text-[8px] sm:text-[9px] font-bold tracking-wider text-slate-300 uppercase truncate mt-0.5">
                        {displaySub}
                      </div>
                    </div>
                  </div>
                  {showHeritage && (
                    <span
                      className="text-[8px] sm:text-[10px] font-extrabold uppercase tracking-wider shrink-0"
                      style={{ color: activeAccent.secondary }}
                    >
                      {heritageBadge}
                    </span>
                  )}
                </div>

                {/* Middle Focus Name + Bottom Contact + QR */}
                <div className="relative z-10 flex items-end justify-between gap-3 pt-2">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div>
                      <div className="text-lg sm:text-2xl font-black text-white leading-tight truncate">
                        {personName}
                      </div>
                      <div
                        className="text-[11px] sm:text-xs font-bold truncate"
                        style={{ color: activeAccent.secondary }}
                      >
                        {personRole}
                      </div>
                      <div
                        className="h-[2.5px] w-36 rounded-full my-1.5"
                        style={{
                          background: `linear-gradient(90deg, ${activeAccent.primary} 0%, ${activeAccent.secondary} 100%)`,
                        }}
                      />
                      <div className="text-[9px] sm:text-[10px] text-slate-300 line-clamp-1">
                        {customTagline}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/15 space-y-0.5">
                      <div className="font-mono text-[11px] sm:text-xs font-extrabold text-white tabular-nums">
                        Tel. &amp; WhatsApp: {contactPhone}
                      </div>
                      <div className="text-[9px] sm:text-[11px] text-slate-300 truncate">
                        {contactEmail} · {contactLocation}
                      </div>
                    </div>
                  </div>

                  {showQr && (
                    <div className="bg-white text-[#071126] rounded-xl p-2 flex flex-col items-center shrink-0 shadow-md">
                      <QRCodeSVG
                        value={qrUrl || "https://hannachi.de"}
                        size={78}
                        level="M"
                        bgColor="#FFFFFF"
                        fgColor="#071126"
                        className="w-15 h-15 sm:w-18 sm:h-18"
                      />
                      <span className="mt-1 font-mono text-[9px] sm:text-[10px] font-black">
                        {qrLabel || "hannachi.de"}
                      </span>
                      <span
                        className="text-[7px] sm:text-[8px] font-bold text-center leading-tight"
                        style={{ color: activeAccent.primary }}
                      >
                        {qrHint}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {layoutId === "signature_midnight" && (
              <div
                translate="no"
                className={`notranslate relative aspect-[85/55] w-full ${radiusClass} overflow-hidden shadow-xl border border-[#64B5EC]/35 bg-gradient-to-br from-[#071126] via-[#0B1E47] to-[#071126] text-white p-4 sm:p-6 flex flex-col justify-between`}
              >
                {/* Top Dual Bar */}
                <div
                  className="absolute top-0 left-0 right-[35%] h-1.5"
                  style={{ backgroundColor: activeAccent.secondaryDeep }}
                />
                <div
                  className="absolute top-0 right-0 w-[35%] h-1.5"
                  style={{ backgroundColor: activeAccent.primary }}
                />
                {/* Orbital Arc Graphic */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 240 240"
                  className="absolute -top-16 -right-14 w-48 h-48 pointer-events-none opacity-20"
                >
                  <circle
                    cx="120"
                    cy="120"
                    r="92"
                    fill="none"
                    stroke={activeAccent.secondary}
                    strokeWidth="2.5"
                    strokeDasharray="190 95"
                  />
                  <circle
                    cx="120"
                    cy="120"
                    r="68"
                    fill="none"
                    stroke={activeAccent.primaryLight}
                    strokeWidth="2"
                    strokeDasharray="120 120"
                  />
                </svg>

                <div className="grid grid-cols-12 gap-3 sm:gap-4 items-center h-full pt-1 relative z-10">
                  <div
                    className={`${
                      showQr ? "col-span-7 sm:col-span-8" : "col-span-12"
                    } flex flex-col justify-between h-full space-y-1.5 min-w-0`}
                  >
                    <div>
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-11 h-10 sm:w-14 sm:h-12 flex items-center justify-center shrink-0 overflow-hidden ${
                            logoFraming === "framed"
                              ? `rounded-xl border p-1 ${
                                  activeLogo.darkBg
                                    ? "bg-[#020617] border-[#64B5EC]/40"
                                    : "bg-white border-white/40"
                                }`
                              : ""
                          }`}
                        >
                          <img
                            src={activeLogo.src}
                            alt="Hannachi Logo"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <div
                            style={wordmarkStyle}
                            className="text-xl sm:text-2xl font-black tracking-tight bg-clip-text text-transparent leading-none pb-0.5"
                          >
                            {displayBrand}
                          </div>
                          <div
                            className="h-[2px] w-28 sm:w-36 rounded-full my-0.5"
                            style={{
                              background: `linear-gradient(90deg, ${activeAccent.primary} 0%, ${activeAccent.secondary} 80%, transparent 100%)`,
                            }}
                          />
                          <div className="text-[8px] sm:text-[10px] font-extrabold tracking-wide text-slate-300 uppercase truncate">
                            {displaySub}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-[#64B5EC]/20">
                        <div className="text-sm sm:text-lg font-black text-white leading-tight truncate">
                          {personName}
                        </div>
                        <div
                          className="text-[10px] sm:text-xs font-bold truncate"
                          style={{ color: activeAccent.secondary }}
                        >
                          {personRole}
                        </div>
                        <div className="text-[9px] sm:text-[10px] text-slate-300 line-clamp-1 mt-0.5">
                          {customTagline}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="inline-block rounded-lg border border-[#64B5EC]/40 bg-[#1974B8]/20 px-2.5 py-1 font-mono text-[10px] sm:text-xs font-extrabold text-white tabular-nums">
                        Tel. &amp; WhatsApp: {contactPhone}
                      </div>
                      <div className="text-[10px] sm:text-xs font-semibold text-slate-200 truncate">
                        {contactEmail}
                      </div>
                      <div className="text-[9px] sm:text-[11px] font-medium text-slate-400 truncate">
                        {contactLocation}
                      </div>
                      {showHeritage && (
                        <div
                          className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider"
                          style={{ color: activeAccent.primaryLight }}
                        >
                          {heritageBadge}
                        </div>
                      )}
                    </div>
                  </div>

                  {showQr && (
                    <div
                      className="col-span-5 sm:col-span-4 flex flex-col items-center justify-center bg-white text-[#071126] rounded-xl p-2.5 sm:p-3 border-2 shadow-md"
                      style={{ borderColor: activeAccent.secondary }}
                    >
                      <span
                        className="w-12 h-1 rounded-full mb-1.5"
                        style={{ backgroundColor: activeAccent.primary }}
                      />
                      <QRCodeSVG
                        value={qrUrl || "https://hannachi.de"}
                        size={96}
                        level="M"
                        bgColor="#FFFFFF"
                        fgColor="#071126"
                        className="w-16 h-16 sm:w-22 sm:h-22"
                      />
                      <span className="mt-1.5 font-mono text-[11px] sm:text-xs font-black tracking-tight">
                        {qrLabel || "hannachi.de"}
                      </span>
                      <span
                        className="text-[8px] sm:text-[9px] font-bold text-center leading-tight"
                        style={{ color: activeAccent.primary }}
                      >
                        {qrHint}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Ruby Accent Bar */}
                <div
                  className="absolute bottom-0 inset-x-0 h-1.5"
                  style={{ backgroundColor: activeAccent.primary }}
                />
              </div>
            )}

            <button
              type="button"
              data-testid="download-card-front-png-btn"
              disabled={exportingMode !== null}
              onClick={() => void exportBusinessCardPng("front")}
              className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-[#1974B8] hover:bg-[#145E96] disabled:opacity-60 text-white font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <ImageDown className="w-4 h-4 shrink-0" />
              <span key={exportingMode === "front" ? "f-busy" : "f-idle"}>
                {exportingMode === "front" ? (
                  "Exportiere Vorderseite…"
                ) : (
                  <>
                    Vorderseite (<span dir="auto">{personName}</span>) als Druck-
                    <span translate="no" className="notranslate">PNG</span> laden
                  </>
                )}
              </span>
            </button>
          </div>

          {/* BACK SIDE PREVIEW */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-ink-muted px-1">
              <span>RÜCKSEITE (Marken-Siegel &amp; Direkt-QR)</span>
              <span dir="ltr" translate="no" className="notranslate font-mono tabular-nums">
                85 × 55 mm · 1050×675 px
              </span>
            </div>

            {(() => {
              const isBackLight = layoutId === "atelier_porcelain";
              return (
                <div
                  translate="no"
                  className={`notranslate relative aspect-[85/55] w-full ${radiusClass} overflow-hidden shadow-xl border p-5 sm:p-6 flex flex-col items-center justify-between text-center ${
                    isBackLight
                      ? "bg-white text-[#071126] border-slate-200"
                      : "bg-gradient-to-br from-[#071126] via-[#0C2558] to-[#071126] text-white border-[#64B5EC]/35"
                  }`}
                >
                  <div
                    className={`inset-3 border pointer-events-none absolute ${
                      cornerStyle === "rounded" ? "rounded-xl" : "rounded-none"
                    } ${isBackLight ? "border-slate-200" : "border-[#64B5EC]/25"}`}
                  />

                  <div className="z-10 flex flex-col items-center">
                    <div
                      style={wordmarkStyle}
                      className="text-xl sm:text-2xl font-black tracking-tight bg-clip-text text-transparent leading-none pb-0.5"
                    >
                      {displayBrand}
                    </div>
                    <div
                      className={`text-[9px] sm:text-xs font-extrabold tracking-wider uppercase mt-0.5 ${
                        isBackLight ? "text-slate-700" : "text-slate-200"
                      }`}
                    >
                      {displaySub}
                    </div>
                    <span
                      className="mt-1.5 h-[2px] w-24 rounded-full"
                      style={{ backgroundColor: activeAccent.primary }}
                    />
                  </div>

                  <div className="z-10 flex items-center justify-center gap-4 sm:gap-6 my-1">
                    <div
                      className={`w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center overflow-hidden ${
                        logoFraming === "framed"
                          ? `p-2 rounded-xl border-2 shadow-md ${
                              activeLogo.darkBg ? "bg-[#020617]" : "bg-white"
                            }`
                          : ""
                      }`}
                      style={
                        logoFraming === "framed"
                          ? { borderColor: activeAccent.secondary }
                          : undefined
                      }
                    >
                      <img
                        src={activeLogo.src}
                        alt="Hannachi Logo"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {showQr && (
                      <div
                        className="bg-white text-[#071126] p-2 rounded-xl border-2 shadow-md flex flex-col items-center"
                        style={{
                          borderColor: isBackLight ? "#0C2558" : activeAccent.secondary,
                        }}
                      >
                        <QRCodeSVG
                          value={qrUrl || "https://hannachi.de"}
                          size={76}
                          level="M"
                          bgColor="#FFFFFF"
                          fgColor="#071126"
                          className="w-14 h-14 sm:w-18 sm:h-18"
                        />
                        <span className="mt-1 font-mono text-[9px] sm:text-[10px] font-black text-[#071126]">
                          {qrLabel || "hannachi.de"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="z-10 space-y-0.5 max-w-full px-2">
                    {showBrandsLine && (
                      <div
                        className={`text-[9px] sm:text-xs font-semibold truncate ${
                          isBackLight ? "text-slate-600" : "text-slate-300"
                        }`}
                      >
                        {brandsLine}
                      </div>
                    )}
                    {showBackContact && (
                      <div
                        className="text-[10px] sm:text-xs font-extrabold truncate"
                        style={{
                          color: isBackLight
                            ? activeAccent.secondaryDeep
                            : activeAccent.secondary,
                        }}
                      >
                        {personName} · Tel. {contactPhone} · {contactEmail}
                      </div>
                    )}
                    {showHeritage && (
                      <div
                        className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider"
                        style={{
                          color: isBackLight
                            ? activeAccent.primary
                            : activeAccent.primaryLight,
                        }}
                      >
                        {heritageBadge}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            <button
              type="button"
              data-testid="download-card-back-png-btn"
              disabled={exportingMode !== null}
              onClick={() => void exportBusinessCardPng("back")}
              className="w-full min-h-[44px] px-4 py-2 rounded-xl border border-primary/20 dark:border-white/20 hover:border-sky-500 disabled:opacity-60 text-ink font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <span key={exportingMode === "back" ? "b-busy" : "b-idle"}>
                {exportingMode === "back" ? (
                  "Exportiere Rückseite…"
                ) : (
                  <>
                    Rückseite (<span dir="auto">{personName}</span>) als Druck-
                    <span translate="no" className="notranslate">PNG</span> laden
                  </>
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Combined Print Sheet Export Bar */}
        <div className="pt-2 border-t border-primary/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-ink-muted">
            <strong className="text-ink">Druckerei-Komplettbogen:</strong> Exportiert
            Vorder- und Rückseite nebeneinander in einem hochauflösenden{" "}
            <span translate="no" className="notranslate">PNG</span> (2240 × 840 px)
            inklusive Formatangaben.
          </div>
          <button
            type="button"
            disabled={exportingMode !== null}
            onClick={() => void exportBusinessCardPng("sheet")}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#071126] hover:bg-[#0C2558] disabled:opacity-60 text-white border border-[#64B5EC]/40 text-xs sm:text-sm font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer shrink-0 transition-colors"
          >
            <ImageDown className="w-4 h-4 text-[#64B5EC]" />
            <span key={exportingMode === "sheet" ? "s-busy" : "s-idle"}>
              {exportingMode === "sheet" ? (
                "Erstelle Druckbogen…"
              ) : (
                <>
                  Kombi-Druckbogen (Vorder- &amp; Rückseite{" "}
                  <span translate="no" className="notranslate">PNG</span>) laden
                </>
              )}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Official Hannachi Logo Variations */}
      <div className="bg-surface dark:bg-slate-900 border border-primary/10 dark:border-white/10 rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-primary/10 dark:border-white/10">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-ink">
              2. Offizielle Marken-Logos &amp; Design-Derivate (
              <span translate="no" className="notranslate">SVG</span> + Studio-Varianten)
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Einheitliche Weiterentwicklungen auf Basis des Hauptlogos (Saphirblau, Lichtbogen &amp; Rubinrot) – direkt auf der Visitenkarte nutzbar oder einzeln herunterladbar.
            </p>
          </div>
          <span
            dir="ltr"
            translate="no"
            className="notranslate text-xs font-mono text-sky-700 dark:text-sky-300 font-bold"
          >
            Farbpalette: #071126 · #1974B8 · #64B5EC · #C92A42 · #FFFFFF
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {NAVY_SKY_LOGO_VARIATIONS.map((logo) => {
            const isSelected = selectedLogoId === logo.id;
            return (
              <div
                key={logo.id}
                className={`rounded-xl border overflow-hidden flex flex-col justify-between shadow-2xs transition-all ${
                  isSelected
                    ? "border-sky-500 bg-sky-500/5 ring-2 ring-sky-500/20"
                    : "border-primary/12 dark:border-white/10 bg-background dark:bg-slate-950"
                }`}
              >
                <div>
                  <div
                    className={`relative overflow-hidden aspect-4/3 border-b border-primary/10 dark:border-white/10 flex items-center justify-center p-4 ${
                      logo.darkBg ? "bg-[#071126]" : "bg-white"
                    }`}
                  >
                    <img
                      src={logo.src}
                      alt={logo.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="p-4">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                      {logo.badge}
                    </div>
                    <h4 className="text-sm sm:text-base font-extrabold text-ink mt-0.5">
                      {logo.title}
                    </h4>
                    <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                      {logo.subtitle}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLogoId(logo.id);
                      notify(`${logo.shortLabel} auf der Visitenkarte aktiviert`);
                    }}
                    className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-emerald-600 text-white"
                        : "bg-surface dark:bg-slate-900 border border-primary/15 dark:border-white/15 text-ink hover:border-sky-500"
                    }`}
                  >
                    <Check className="w-4 h-4 shrink-0" />
                    <span key={isSelected ? "l-act" : "l-use"}>
                      {isSelected ? "Auf Visitenkarte aktiv" : "Auf Visitenkarte nutzen"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadAssetImage(logo.src, logo.filename)}
                    className="flex-1 min-h-[44px] px-4 py-2 rounded-lg bg-[#1974B8] hover:bg-[#145E96] text-white text-xs sm:text-sm font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    <span>
                      <span translate="no" className="notranslate">PNG</span> laden
                    </span>
                  </button>
                  {logo.svgDownload && logo.svgFilename && (
                    <button
                      type="button"
                      onClick={() =>
                        handleDownloadAssetImage(logo.svgDownload!, logo.svgFilename!)
                      }
                      className="min-h-[44px] px-3.5 py-2 rounded-lg border border-sky-500/35 bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        <span translate="no" className="notranslate">SVG</span> Vektor
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Studio Print Mockups, Siegel & Marken-Fotowelten */}
      <div className="bg-surface dark:bg-slate-900 border border-primary/10 dark:border-white/10 rounded-xl p-5 sm:p-6 space-y-4">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-ink">
            3. Marken-Vision, Beschilderung &amp; Studio-Welten
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Fassaden- &amp; Fahrzeug-Beschilderung, <span translate="no" className="notranslate">4K</span>-Markenbanner,{" "}
            <span translate="no" className="notranslate">App</span>-Icons und gebrandete Showroom-Fotos aus einer einheitlichen visuellen Linie.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {GENERATED_BRAND_ASSETS.map((asset) => (
            <div
              key={asset.id}
              className="rounded-xl border border-primary/12 dark:border-white/10 bg-background dark:bg-slate-950 overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="relative bg-[#071126] overflow-hidden aspect-video flex items-center justify-center">
                  <img
                    src={asset.src}
                    alt={asset.title}
                    referrerPolicy="no-referrer"
                    className={`w-full h-full ${asset.contain ? "object-contain p-3" : "object-cover"}`}
                  />
                </div>
                <div className="p-4">
                  <h4 className="text-sm font-extrabold text-ink">{asset.title}</h4>
                  <p className="text-xs text-ink-muted mt-1">{asset.subtitle}</p>
                </div>
              </div>

              <div className="p-4 pt-0">
                <button
                  type="button"
                  onClick={() => handleDownloadAssetImage(asset.src, asset.filename)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-lg bg-[#071126] hover:bg-[#0C2558] text-white text-xs font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4 text-[#64B5EC]" />
                  <span>
                    Herunterladen (
                    <span dir="ltr" translate="no" className="notranslate">
                      {asset.filename}
                    </span>
                    )
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
