"use client";

import { useState } from "react";
import {
  Check,
  Download,
  ImageDown,
  Palette,
  QrCode,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { business } from "@/data/site";
import logoV1Monogram from "@/assets/images/hannachi_logo_v1_monogram_1794852168278.jpg";
import logoV2Shield from "@/assets/images/hannachi_logo_v2_shield_1794852170131.jpg";
import logoV3Horizontal from "@/assets/images/hannachi_logo_v3_horizontal_1794852173579.jpg";
import logoV4DarkBadge from "@/assets/images/hannachi_logo_v4_dark_badge_1794852174564.jpg";
import mrsHannachiCardTemplateImg from "@/assets/images/mrs_hannachi_business_card_1794852771406.jpg";
import logoLightImg from "@/assets/images/hannachi_brand_logo_1794832118702.jpg";
import logoDarkImg from "@/assets/images/hannachi_logo_emblem_dark_1794832122366.jpg";
import cardMockupImg from "@/assets/images/hannachi_business_card_qr_1794832122335.jpg";

interface AdminBrandCardStudioProps {
  onToast?: (msg: string) => void;
}

export type LogoVariationId = "v1-monogram" | "v2-shield" | "v3-horizontal" | "v4-dark-badge";

const NAVY_SKY_LOGO_VARIATIONS: Array<{
  id: LogoVariationId;
  shortLabel: string;
  badge: string;
  title: string;
  subtitle: string;
  src: string;
  filename: string;
}> = [
  {
    id: "v1-monogram",
    shortLabel: "Logo 1 · H-Monogramm",
    badge: "Variante 1 · Monogramm",
    title: "Modernes „H“-Monogramm mit Trommel & Schraubenschlüssel",
    subtitle: "Marineblau (#0F172A), Himmelblau (#0284C7) & Weiß, ideal als Hauptlogo & Stempel",
    src: logoV1Monogram,
    filename: "Hannachi-Logo-V1-Monogramm-Blau.jpg",
  },
  {
    id: "v2-shield",
    shortLabel: "Logo 2 · Schutzschild",
    badge: "Variante 2 · Schutzschild & Haus",
    title: "Vertrauens-Wappen für den Fachhandel in Osnabrück",
    subtitle: "Hausdach, Zahnrad, Strom & Wasser in Marineblau & Himmelblau auf Weiß",
    src: logoV2Shield,
    filename: "Hannachi-Logo-V2-Schutzschild-Blau.jpg",
  },
  {
    id: "v3-horizontal",
    shortLabel: "Logo 3 · Breitformat",
    badge: "Variante 3 · Breitformat / Banner",
    title: "Horizontales Firmenlogo für Website, Rechnung & Servicefahrzeug",
    subtitle: "Präzisions-Drehregler & Schlüssel links mit klarer Wortmarke rechts (16:9)",
    src: logoV3Horizontal,
    filename: "Hannachi-Logo-V3-Horizontal-Blau.jpg",
  },
  {
    id: "v4-dark-badge",
    shortLabel: "Logo 4 · Dunkles Siegel",
    badge: "Variante 4 · Dunkles Siegel",
    title: "Rundes Qualitäts-Siegel auf tiefem Marineblau",
    subtitle: "Weiß & Himmelblau auf Marineblau, perfekt für WhatsApp-Profilbild & Arbeitskleidung",
    src: logoV4DarkBadge,
    filename: "Hannachi-Logo-V4-Siegel-Marineblau.jpg",
  },
];

const GENERATED_BRAND_ASSETS = [
  {
    id: "mrs-hannachi-template",
    title: "Visitenkarten-Vorlage „Frau Hannachi“ (Marine- & Himmelblau auf Weiß)",
    subtitle: "Vorder- & Rückseite mit neuem Logo, Kontaktdaten & hannachi.de QR-Dock (16:9)",
    src: mrsHannachiCardTemplateImg,
    filename: "Frau-Hannachi-Visitenkarte-Vorlage.jpg",
  },
  {
    id: "logo-light",
    title: "Hannachi Hauptlogo (Gold & Marineblau auf Weiß)",
    subtitle: "Monogramm „H“ mit Werkzeug & Trommel-Emblem (1:1)",
    src: logoLightImg,
    filename: "Hannachi-Logo-Hell-Gold.jpg",
  },
  {
    id: "logo-dark",
    title: "Hannachi Qualitäts-Emblem (Dunkelblau & Gold)",
    subtitle: "Edles Gold-Wappen auf Marineblau (4:3)",
    src: logoDarkImg,
    filename: "Hannachi-Logo-Dunkel-Gold.jpg",
  },
  {
    id: "card-mockup",
    title: "Visitenkarten-Präsentation Dunkelblau/Gold (hannachi.de)",
    subtitle: "Fotorealistische Vorschau auf Naturstein (16:9)",
    src: cardMockupImg,
    filename: "Hannachi-Visitenkarte-Mockup.jpg",
  },
];

/**
 * Draws a real, scannable QR code onto a 2D canvas by serializing the rendered QRCodeSVG element
 */
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

/**
 * Loads an image URL/asset and draws it into a rounded box with object-contain fit
 */
async function drawImageContainToCanvas(
  ctx: CanvasRenderingContext2D,
  src: string,
  x: number,
  y: number,
  boxW: number,
  boxH: number,
  radius = 12
): Promise<void> {
  await new Promise<void>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, boxW, boxH, radius);
      ctx.clip();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x, y, boxW, boxH);

      const scale = Math.min(boxW / img.width, boxH / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const offsetX = x + (boxW - drawW) / 2;
      const offsetY = y + (boxH - drawH) / 2;
      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
      ctx.restore();
      resolve();
    };
    img.onerror = () => resolve();
    img.src = src;
  });
}

export default function AdminBrandCardStudio({ onToast }: AdminBrandCardStudioProps) {
  const [cardTheme, setCardTheme] = useState<
    "mrs_hannachi_split" | "navy_sky_dark" | "navy_gold"
  >("mrs_hannachi_split");
  const [selectedLogoId, setSelectedLogoId] = useState<LogoVariationId>("v1-monogram");
  const [personName, setPersonName] = useState("Frau Hannachi");
  const [personRole, setPersonRole] = useState(
    "Geschäftsleitung & Kundenservice"
  );
  const [contactPhone, setContactPhone] = useState(business.phoneDisplay);
  const [contactEmail, setContactEmail] = useState(business.email);
  const [contactLocation, setContactLocation] = useState(
    `${business.street} · ${business.zip} ${business.city}`
  );
  const [customTagline] = useState(
    "An- & Verkauf · Gebrauchtgeräte · Original-Ersatzteile"
  );
  const [qrUrl, setQrUrl] = useState("https://hannachi.de");
  const [exportingSide, setExportingSide] = useState<"front" | "back" | null>(null);

  const activeLogo =
    NAVY_SKY_LOGO_VARIATIONS.find((l) => l.id === selectedLogoId) ||
    NAVY_SKY_LOGO_VARIATIONS[0];

  const notify = (msg: string) => {
    if (onToast) onToast(msg);
  };

  const applyPresetPerson = (preset: "mrs" | "mr") => {
    if (preset === "mrs") {
      setPersonName("Frau Hannachi");
      setPersonRole("Geschäftsleitung & Kundenberatung");
      notify("Vorlage für Frau Hannachi aktiviert");
    } else {
      setPersonName(business.owner);
      setPersonRole("Inhaber · Fachhandel Hausgeräte & Teile");
      notify("Vorlage für Herrn Hannachi aktiviert");
    }
  };

  const handleDownloadAssetImage = (src: string, filename: string) => {
    const a = document.createElement("a");
    a.href = src;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    notify(`${filename} wird heruntergeladen`);
  };

  /**
   * Renders a print-ready 300-DPI business card (85x55mm -> 1050x675px) incorporating the selected newly designed logo,
   * Mrs. Hannachi's contact details, and the scannable QR code for hannachi.de
   */
  const exportBusinessCardPng = async (side: "front" | "back") => {
    setExportingSide(side);
    try {
      const width = 1050;
      const height = 675;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const isSplitWhite = cardTheme === "mrs_hannachi_split";
      const isGold = cardTheme === "navy_gold";
      const accentHex = isGold ? "#f59e0b" : "#0284c7";
      const skyLightHex = isGold ? "#fbbf24" : "#38bdf8";

      if (side === "front") {
        if (isSplitWhite) {
          // Crisp White Executive Template with Sky-Blue Right QR Dock (matches Mrs. Hannachi template)
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);

          // Top subtle Navy/Sky trim bar
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(0, 0, width - 350, 10);
          ctx.fillStyle = "#0284c7";
          ctx.fillRect(width - 350, 0, 350, 10);

          const padX = 58;

          // Draw the newly designed logo in top-left header
          await drawImageContainToCanvas(ctx, activeLogo.src, padX, 42, 130, 110, 14);
          ctx.strokeStyle = "#e2e8f0";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(padX, 42, 130, 110, 14);
          ctx.stroke();

          // Brand Title next to logo
          ctx.fillStyle = "#0f172a";
          ctx.font = "900 44px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
          ctx.fillText("HANNACHI", padX + 150, 98);

          ctx.fillStyle = "#0284c7";
          ctx.font = "800 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
          ctx.fillText("ELEKTROHAUSHALTSGERÄTE & ERSATZTEILE", padX + 150, 128);

          // Divider
          ctx.fillStyle = "#e2e8f0";
          ctx.fillRect(padX, 178, 575, 2);

          // Person Name & Role (Mrs. Hannachi)
          let y = 230;
          ctx.fillStyle = "#0f172a";
          ctx.font = "900 34px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
          ctx.fillText(personName, padX, y);

          y += 34;
          ctx.fillStyle = "#0284c7";
          ctx.font = "700 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
          ctx.fillText(personRole, padX, y);

          y += 32;
          ctx.fillStyle = "#475569";
          ctx.font = "600 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
          ctx.fillText(customTagline, padX, y);

          // Contact Details Block
          y += 54;
          ctx.fillStyle = "#f0f9ff";
          ctx.beginPath();
          ctx.roundRect(padX, y - 34, 560, 52, 10);
          ctx.fill();
          ctx.strokeStyle = "#bae6fd";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(padX, y - 34, 560, 52, 10);
          ctx.stroke();

          ctx.fillStyle = "#0f172a";
          ctx.font = "800 23px monospace";
          ctx.fillText(`Tel. & WhatsApp: ${contactPhone}`, padX + 16, y);

          y += 56;
          ctx.fillStyle = "#1e293b";
          ctx.font = "700 21px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
          ctx.fillText(`E-Mail: ${contactEmail}`, padX, y);

          y += 34;
          ctx.fillStyle = "#334155";
          ctx.font = "600 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
          ctx.fillText(contactLocation, padX, y);

          y += 38;
          ctx.fillStyle = "#0284c7";
          ctx.font = "700 17px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
          ctx.fillText(
            "✓ Waschmaschine · Trockner · Geschirrspüler · Herd · Kühlgerät",
            padX,
            y
          );

          // Right Side: Sky-Blue Vertical QR Dock (exact match to Mrs. Hannachi template)
          const dockW = 290;
          const dockH = 545;
          const dockX = width - dockW - 50;
          const dockY = 130;

          ctx.fillStyle = "#0284c7";
          ctx.beginPath();
          ctx.roundRect(dockX, dockY, dockW, dockH, [26, 26, 0, 0]);
          ctx.fill();

          // White QR container inside dock
          const qrCardSize = 236;
          const qrCardX = dockX + (dockW - qrCardSize) / 2;
          const qrCardY = dockY + 28;

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.roundRect(qrCardX, qrCardY, qrCardSize, qrCardSize, 18);
          ctx.fill();

          const svgEl = document.getElementById(
            "hannachi-card-qr-svg"
          ) as SVGSVGElement | null;
          await drawSvgElementToCanvas(ctx, svgEl, qrCardX + 14, qrCardY + 14, 208);

          ctx.textAlign = "center";
          ctx.fillStyle = "#ffffff";
          ctx.font = "900 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
          ctx.fillText("hannachi.de", dockX + dockW / 2, qrCardY + qrCardSize + 52);

          ctx.fillStyle = "#e0f2fe";
          ctx.font = "700 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
          ctx.fillText(
            "QR-Code scannen für",
            dockX + dockW / 2,
            qrCardY + qrCardSize + 86
          );
          ctx.fillText(
            "Online-Termin & WhatsApp",
            dockX + dockW / 2,
            qrCardY + qrCardSize + 110
          );
          ctx.textAlign = "left";
        } else {
          // Dark Navy Theme with Embedded Logo + Right QR Badge
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(0, 0, width, height);

          ctx.fillStyle = accentHex;
          ctx.fillRect(0, 0, width, 12);
          ctx.fillRect(0, height - 8, width, 8);

          const padX = 58;
          await drawImageContainToCanvas(ctx, activeLogo.src, padX, 46, 120, 104, 14);

          ctx.fillStyle = "#ffffff";
          ctx.font = "900 44px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
          ctx.fillText("HANNACHI", padX + 142, 98);

          ctx.fillStyle = skyLightHex;
          ctx.font = "700 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
          ctx.fillText("ELEKTROHAUSHALTSGERÄTE & ERSATZTEILE", padX + 142, 128);

          ctx.fillStyle = "rgba(255,255,255,0.15)";
          ctx.fillRect(padX, 174, 570, 2);

          let y = 224;
          ctx.fillStyle = "#ffffff";
          ctx.font = "900 32px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
          ctx.fillText(personName, padX, y);

          y += 34;
          ctx.fillStyle = skyLightHex;
          ctx.font = "700 21px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
          ctx.fillText(personRole, padX, y);

          y += 32;
          ctx.fillStyle = "#cbd5e1";
          ctx.font = "600 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
          ctx.fillText(customTagline, padX, y);

          y += 54;
          ctx.fillStyle = isGold
            ? "rgba(245, 158, 11, 0.16)"
            : "rgba(56, 189, 248, 0.16)";
          ctx.beginPath();
          ctx.roundRect(padX, y - 34, 555, 52, 12);
          ctx.fill();

          ctx.fillStyle = skyLightHex;
          ctx.font = "800 24px monospace";
          ctx.fillText(`Tel. & WhatsApp: ${contactPhone}`, padX + 16, y);

          y += 56;
          ctx.fillStyle = "#f1f5f9";
          ctx.font = "600 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
          ctx.fillText(`E-Mail: ${contactEmail} · Web: hannachi.de`, padX, y);

          y += 34;
          ctx.fillStyle = "#94a3b8";
          ctx.font = "600 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
          ctx.fillText(contactLocation, padX, y);

          y += 38;
          ctx.fillStyle = skyLightHex;
          ctx.font = "700 17px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
          ctx.fillText(
            "✓ Waschmaschine · Trockner · Geschirrspüler · Herd · Kühlgerät",
            padX,
            y
          );

          const qrBoxW = 280;
          const qrBoxH = 360;
          const qrBoxX = width - qrBoxW - 54;
          const qrBoxY = 140;

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.roundRect(qrBoxX, qrBoxY, qrBoxW, qrBoxH, 22);
          ctx.fill();

          ctx.strokeStyle = accentHex;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.roundRect(qrBoxX, qrBoxY, qrBoxW, qrBoxH, 22);
          ctx.stroke();

          const svgEl = document.getElementById(
            "hannachi-card-qr-svg"
          ) as SVGSVGElement | null;
          await drawSvgElementToCanvas(ctx, svgEl, qrBoxX + 30, qrBoxY + 26, 220);

          ctx.textAlign = "center";
          ctx.fillStyle = "#0f172a";
          ctx.font = "900 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
          ctx.fillText("hannachi.de", qrBoxX + qrBoxW / 2, qrBoxY + 284);

          ctx.fillStyle = "#0284c7";
          ctx.font = "700 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
          ctx.fillText("QR-Code scannen für", qrBoxX + qrBoxW / 2, qrBoxY + 312);
          ctx.fillText(
            "Online-Termin & WhatsApp",
            qrBoxX + qrBoxW / 2,
            qrBoxY + 332
          );
          ctx.textAlign = "left";
        }
      } else {
        // Back Side: Deep Navy with Logo Badge, Brand Name & Scannable QR Code
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = isGold
          ? "rgba(245, 158, 11, 0.45)"
          : "rgba(56, 189, 248, 0.45)";
        ctx.lineWidth = 3;
        ctx.strokeRect(36, 36, width - 72, height - 72);

        // Top-left and center layout with embedded logo and QR code
        await drawImageContainToCanvas(ctx, activeLogo.src, 130, 175, 250, 250, 24);

        const svgEl = document.getElementById(
          "hannachi-card-qr-svg"
        ) as SVGSVGElement | null;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.roundRect(width - 380, 175, 250, 250, 24);
        ctx.fill();
        await drawSvgElementToCanvas(ctx, svgEl, width - 355, 192, 200);

        ctx.textAlign = "center";
        ctx.fillStyle = "#0f172a";
        ctx.font = "900 20px monospace";
        ctx.fillText("hannachi.de", width - 255, 412);

        ctx.fillStyle = skyLightHex;
        ctx.font = "900 50px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        ctx.fillText("HANNACHI", width / 2, 108);

        ctx.fillStyle = "#ffffff";
        ctx.font = "700 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        ctx.fillText(
          "ELEKTROHAUSHALTSGERÄTE & ERSATZTEILE",
          width / 2,
          144
        );

        ctx.fillStyle = "#cbd5e1";
        ctx.font = "600 21px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        ctx.fillText(
          "Miele · Bosch · Siemens · AEG · Bauknecht · Liebherr · Neff",
          width / 2,
          520
        );

        ctx.fillStyle = skyLightHex;
        ctx.font = "800 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        ctx.fillText(
          `${personName} · Tel. & WhatsApp ${contactPhone}`,
          width / 2,
          566
        );
        ctx.textAlign = "left";
      }

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const safePerson = personName.replace(/\s+/g, "-");
        link.download =
          side === "front"
            ? `${safePerson}-Visitenkarte-Vorderseite-QR.png`
            : `${safePerson}-Visitenkarte-Rueckseite-QR.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        notify(
          side === "front"
            ? `Visitenkarte für ${personName} (Vorderseite) als PNG gespeichert`
            : `Visitenkarte für ${personName} (Rückseite) als PNG gespeichert`
        );
      }, "image/png");
    } finally {
      setExportingSide(null);
    }
  };

  return (
    <section aria-label="Visitenkarte und Logo Studio" className="space-y-6">
      {/* Hidden High-Precision SVG QR Code used for PNG Canvas rendering */}
      <div className="sr-only" aria-hidden="true">
        <QRCodeSVG
          id="hannachi-card-qr-svg"
          value={qrUrl || "https://hannachi.de"}
          size={256}
          level="H"
          bgColor="#FFFFFF"
          fgColor="#0F172A"
        />
      </div>

      {/* Header Banner */}
      <div className="bg-surface dark:bg-slate-900 border border-primary/10 dark:border-white/10 rounded-xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            <Sparkles className="w-4 h-4" />
            <span>Für Frau Hannachi · Professionelle Visitenkarten-Vorlage &amp; 4 Logos</span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink mt-1">
            Visitenkarten-Designer &amp; Marken-Logos (Marineblau, Himmelblau &amp; Weiß)
          </h2>
          <p className="text-xs sm:text-sm text-ink-muted mt-1 max-w-2xl leading-relaxed">
            Professionelle Visitenkarten-Vorlage speziell für <strong>Frau Hannachi</strong> mit integriertem neuem Logo, strukturierten Kontaktdaten und scannbarem QR-Code zu <strong>hannachi.de</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={exportingSide !== null}
            onClick={() => void exportBusinessCardPng("front")}
            data-testid="download-card-front-png-btn"
            className="min-h-[44px] px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <ImageDown className="w-4 h-4 shrink-0" />
            <span>Visitenkarte Vorderseite (PNG)</span>
          </button>
          <button
            type="button"
            disabled={exportingSide !== null}
            onClick={() => void exportBusinessCardPng("back")}
            data-testid="download-card-back-png-btn"
            className="min-h-[44px] px-4 py-2 rounded-lg bg-primary hover:bg-primary-light text-white font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-sky-400 shrink-0" />
            <span>Visitenkarte Rückseite (PNG)</span>
          </button>
        </div>
      </div>

      {/* 1. Interactive Live Business Card Template for Mrs. Hannachi (incorporating new Logo + Contact Details + QR Code) */}
      <div className="bg-surface dark:bg-slate-900 border border-primary/10 dark:border-white/10 rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-primary/10 dark:border-white/10">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-ink flex items-center gap-2">
              <QrCode className="w-5 h-5 text-sky-500" />
              <span>1. Professionelle Visitenkarten-Vorlage für Frau Hannachi (85 × 55 mm)</span>
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Kombiniert das neue Logo (Marineblau, Himmelblau &amp; Weiß), Platz für alle Kontaktdaten und den scannbaren QR-Code zu <strong>{qrUrl}</strong>.
            </p>
          </div>

          {/* Template Style Switcher */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 self-start">
            <button
              type="button"
              onClick={() => setCardTheme("mrs_hannachi_split")}
              className={`min-h-[38px] px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                cardTheme === "mrs_hannachi_split"
                  ? "bg-sky-600 text-white"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Vorlage „Frau Hannachi“ (Weiß / Himmelblau)</span>
            </button>
            <button
              type="button"
              onClick={() => setCardTheme("navy_sky_dark")}
              className={`min-h-[38px] px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                cardTheme === "navy_sky_dark"
                  ? "bg-sky-600 text-white"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <span>Marine- &amp; Himmelblau Dunkel</span>
            </button>
            <button
              type="button"
              onClick={() => setCardTheme("navy_gold")}
              className={`min-h-[38px] px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                cardTheme === "navy_gold"
                  ? "bg-primary text-white dark:bg-accent dark:text-primary"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <span>Marineblau &amp; Gold</span>
            </button>
          </div>
        </div>

        {/* Logo Selector & Person Presets */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-background dark:bg-slate-950/60 p-4 rounded-xl border border-primary/10 dark:border-white/10">
          <div className="lg:col-span-7 space-y-2">
            <span className="block text-xs font-bold text-ink">
              Logo auf der Visitenkarte auswählen (aus den 4 neuen Entwürfen):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 items-stretch gap-2">
              {NAVY_SKY_LOGO_VARIATIONS.map((logo) => {
                const isSelected = selectedLogoId === logo.id;
                return (
                  <button
                    key={logo.id}
                    type="button"
                    onClick={() => setSelectedLogoId(logo.id)}
                    className={`h-full min-h-[82px] px-2.5 py-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      isSelected
                        ? "border-sky-500 bg-sky-500/10 ring-2 ring-sky-500/30"
                        : "border-primary/15 dark:border-white/15 bg-surface dark:bg-slate-900 hover:border-sky-400"
                    }`}
                  >
                    <img
                      src={logo.src}
                      alt={logo.shortLabel}
                      referrerPolicy="no-referrer"
                      className="w-12 h-10 object-contain rounded bg-white p-0.5"
                    />
                    <span className="text-[11px] font-bold text-ink text-center leading-tight flex items-center gap-1">
                      {isSelected && <Check className="w-3 h-3 text-sky-600 shrink-0" />}
                      <span>{logo.shortLabel}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-2">
            <span className="block text-xs font-bold text-ink">
              Schnell-Auswahl Kontaktperson:
            </span>
            <div className="grid grid-cols-2 items-stretch gap-2">
              <button
                type="button"
                onClick={() => applyPresetPerson("mrs")}
                className={`min-h-[44px] px-3 sm:px-3.5 py-2 rounded-xl border text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors text-center ${
                  personName.toLowerCase().includes("frau")
                    ? "bg-sky-600 text-white border-sky-600"
                    : "bg-surface dark:bg-slate-900 text-ink border-primary/15 dark:border-white/15 hover:border-sky-500"
                }`}
              >
                <UserCheck className="w-4 h-4 shrink-0" />
                <span>Frau Hannachi</span>
              </button>
              <button
                type="button"
                onClick={() => applyPresetPerson("mr")}
                className={`min-h-[44px] px-3 sm:px-3.5 py-2 rounded-xl border text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors text-center ${
                  personName.toLowerCase().includes("kamal")
                    ? "bg-sky-600 text-white border-sky-600"
                    : "bg-surface dark:bg-slate-900 text-ink border-primary/15 dark:border-white/15 hover:border-sky-500"
                }`}
              >
                <UserCheck className="w-4 h-4 shrink-0" />
                <span>Herr Kamal Hannachi</span>
              </button>
            </div>
          </div>
        </div>

        {/* Editable Contact Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label
              htmlFor="card-person-name-input"
              className="block text-xs font-semibold text-ink mb-1"
            >
              Name auf der Visitenkarte
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
              Position / Aufgabenbereich
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
              Standort / Einsatzgebiet
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
              htmlFor="card-qr-url-input"
              className="block text-xs font-semibold text-ink mb-1"
            >
              QR-Code Zieladresse (Website)
            </label>
            <input
              id="card-qr-url-input"
              type="url"
              value={qrUrl}
              onChange={(e) => setQrUrl(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-base sm:text-sm font-mono text-ink"
            />
          </div>
        </div>

        {/* Front & Back Card Live Preview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* FRONT SIDE */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-ink-muted px-1">
              <span>VORDERSEITE (Neues Logo, Kontaktdaten &amp; QR-Code)</span>
              <span className="font-mono">85 × 55 mm</span>
            </div>

            {cardTheme === "mrs_hannachi_split" ? (
              /* Executive White & Sky-Blue Dock Template for Mrs. Hannachi */
              <div className="relative aspect-[85/55] w-full rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-white text-slate-900 p-4 sm:p-6 flex flex-col justify-between">
                {/* Top Dual Navy + Sky Bar */}
                <div className="absolute top-0 left-0 right-[34%] h-2 bg-slate-900" />
                <div className="absolute top-0 right-0 w-[34%] h-2 bg-sky-600" />

                <div className="grid grid-cols-12 gap-3 sm:gap-4 h-full pt-1 items-stretch">
                  {/* Left 8 Cols: New Logo + Contact Details */}
                  <div className="col-span-7 sm:col-span-8 flex flex-col justify-between py-0.5">
                    <div>
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="w-12 h-11 sm:w-16 sm:h-14 rounded-xl border border-slate-200 bg-white p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                          <img
                            src={activeLogo.src}
                            alt="Hannachi Logo"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 leading-none">
                            HANNACHI
                          </div>
                          <div className="text-[9px] sm:text-[11px] font-extrabold tracking-wide text-sky-600 mt-0.5 truncate">
                            ELEKTROHAUSHALTSGERÄTE &amp; ERSATZTEILE
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 sm:mt-3 pt-2 border-t border-slate-200">
                        <div className="text-sm sm:text-lg font-black text-slate-900 leading-tight">
                          {personName}
                        </div>
                        <div className="text-[11px] sm:text-xs font-extrabold text-sky-600">
                          {personRole}
                        </div>
                        <div className="text-[9px] sm:text-[11px] font-medium text-slate-500 line-clamp-1 mt-0.5">
                          {customTagline}
                        </div>
                      </div>
                    </div>

                    {/* Contact Info Block */}
                    <div className="space-y-1 pt-1">
                      <div className="inline-block rounded-lg bg-sky-50 border border-sky-200 px-2.5 py-1 font-mono text-[11px] sm:text-xs font-extrabold text-slate-900">
                        Tel. &amp; WhatsApp: {contactPhone}
                      </div>
                      <div className="text-[10px] sm:text-xs font-bold text-slate-800 truncate">
                        {contactEmail}
                      </div>
                      <div className="text-[10px] sm:text-xs font-medium text-slate-600 truncate">
                        {contactLocation}
                      </div>
                    </div>
                  </div>

                  {/* Right 4 Cols: Sky-Blue Vertical QR Dock */}
                  <div className="col-span-5 sm:col-span-4 flex flex-col justify-end h-full">
                    <div className="bg-sky-600 text-white rounded-t-2xl p-2.5 sm:p-3.5 flex flex-col items-center justify-between shadow-md h-[92%] -mb-4 sm:-mb-6 pb-5 sm:pb-7">
                      <div className="bg-white p-1.5 sm:p-2 rounded-xl shadow-xs">
                        <QRCodeSVG
                          value={qrUrl || "https://hannachi.de"}
                          size={96}
                          level="M"
                          bgColor="#FFFFFF"
                          fgColor="#0F172A"
                          className="w-18 h-18 sm:w-24 sm:h-24"
                        />
                      </div>
                      <div className="text-center mt-1.5">
                        <div className="font-mono text-xs sm:text-sm font-black tracking-tight text-white">
                          hannachi.de
                        </div>
                        <div className="text-[8px] sm:text-[9px] font-bold text-sky-100 leading-tight mt-0.5">
                          QR-Code scannen für Online-Termin
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Dark Navy Card Layout with New Logo */
              <div
                className={`relative aspect-[85/55] w-full rounded-2xl overflow-hidden shadow-xl border transition-colors p-4 sm:p-6 flex flex-col justify-between bg-slate-900 text-white ${
                  cardTheme === "navy_gold"
                    ? "border-amber-500/40"
                    : "border-sky-500/40"
                }`}
              >
                <div
                  className={`absolute top-0 inset-x-0 h-2 ${
                    cardTheme === "navy_gold" ? "bg-amber-500" : "bg-sky-500"
                  }`}
                />

                <div className="grid grid-cols-12 gap-3 sm:gap-4 items-center h-full pt-1">
                  <div className="col-span-7 sm:col-span-8 flex flex-col justify-between h-full space-y-1.5">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <div className="w-11 h-10 sm:w-14 sm:h-12 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 overflow-hidden">
                          <img
                            src={activeLogo.src}
                            alt="Hannachi Logo"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-lg sm:text-2xl font-black tracking-wider leading-none">
                            HANNACHI
                          </div>
                          <div
                            className={`text-[9px] sm:text-[11px] font-extrabold tracking-wide mt-0.5 truncate ${
                              cardTheme === "navy_gold"
                                ? "text-amber-400"
                                : "text-sky-400"
                            }`}
                          >
                            ELEKTROHAUSHALTSGERÄTE &amp; ERSATZTEILE
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-white/15">
                        <div className="text-sm sm:text-base font-black text-white">
                          {personName}
                        </div>
                        <div
                          className={`text-[10px] sm:text-xs font-bold ${
                            cardTheme === "navy_gold"
                              ? "text-amber-400"
                              : "text-sky-400"
                          }`}
                        >
                          {personRole}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div
                        className={`inline-block rounded-lg border px-2.5 py-1 font-mono text-[11px] sm:text-xs font-extrabold ${
                          cardTheme === "navy_gold"
                            ? "bg-amber-500/15 border-amber-500/35 text-amber-300"
                            : "bg-sky-500/15 border-sky-400/35 text-sky-300"
                        }`}
                      >
                        Tel. &amp; WhatsApp: {contactPhone}
                      </div>
                      <div className="text-[10px] sm:text-xs font-medium text-slate-300 truncate">
                        {contactEmail} · {contactLocation}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`col-span-5 sm:col-span-4 flex flex-col items-center justify-center bg-white text-slate-900 rounded-xl p-2.5 sm:p-3 border-2 shadow-md ${
                      cardTheme === "navy_gold"
                        ? "border-amber-500"
                        : "border-sky-500"
                    }`}
                  >
                    <QRCodeSVG
                      value={qrUrl || "https://hannachi.de"}
                      size={96}
                      level="M"
                      bgColor="#FFFFFF"
                      fgColor="#0F172A"
                      className="w-18 h-18 sm:w-24 sm:h-24"
                    />
                    <span className="mt-1.5 font-mono text-[11px] sm:text-xs font-black text-slate-900 tracking-tight">
                      hannachi.de
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-bold text-sky-700 text-center leading-tight">
                      Scannen für Termin &amp; WhatsApp
                    </span>
                  </div>
                </div>

                <div
                  className={`absolute bottom-0 inset-x-0 h-1.5 ${
                    cardTheme === "navy_gold" ? "bg-amber-500" : "bg-sky-500"
                  }`}
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => void exportBusinessCardPng("front")}
              className="w-full min-h-[44px] px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <ImageDown className="w-4 h-4" />
              <span>Vorderseite für {personName} als Druck-PNG herunterladen</span>
            </button>
          </div>

          {/* BACK SIDE */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-ink-muted px-1">
              <span>RÜCKSEITE (Neues Logo &amp; Direkt-QR zu hannachi.de)</span>
              <span className="font-mono">85 × 55 mm</span>
            </div>

            <div
              className={`relative aspect-[85/55] w-full rounded-2xl overflow-hidden shadow-xl border bg-slate-900 text-white p-5 sm:p-6 flex flex-col items-center justify-between text-center ${
                cardTheme === "navy_gold"
                  ? "border-amber-500/40"
                  : "border-sky-500/40"
              }`}
            >
              <div
                className={`inset-3 border rounded-xl pointer-events-none absolute ${
                  cardTheme === "navy_gold"
                    ? "border-amber-500/35"
                    : "border-sky-400/35"
                }`}
              />

              <div className="z-10">
                <div
                  className={`text-xl sm:text-2xl font-black tracking-widest ${
                    cardTheme === "navy_gold" ? "text-amber-400" : "text-sky-400"
                  }`}
                >
                  HANNACHI
                </div>
                <div className="text-[10px] sm:text-xs font-bold tracking-wider text-white">
                  ELEKTROHAUSHALTSGERÄTE &amp; ERSATZTEILE
                </div>
              </div>

              <div className="z-10 flex items-center justify-center gap-4 sm:gap-6 my-1">
                <div className="bg-white p-2 rounded-xl border-2 border-sky-400 shadow-md w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center overflow-hidden">
                  <img
                    src={activeLogo.src}
                    alt="Hannachi Logo"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div
                  className={`bg-white text-slate-900 p-2 rounded-xl border-2 shadow-md flex flex-col items-center ${
                    cardTheme === "navy_gold" ? "border-amber-400" : "border-sky-400"
                  }`}
                >
                  <QRCodeSVG
                    value={qrUrl || "https://hannachi.de"}
                    size={76}
                    level="M"
                    bgColor="#FFFFFF"
                    fgColor="#0F172A"
                    className="w-14 h-14 sm:w-18 sm:h-18"
                  />
                  <span className="mt-1 font-mono text-[9px] sm:text-[10px] font-black text-slate-900">
                    hannachi.de
                  </span>
                </div>
              </div>

              <div className="z-10 space-y-0.5">
                <div className="text-[10px] sm:text-xs font-semibold text-slate-300">
                  Miele · Bosch · Siemens · AEG · Bauknecht · Liebherr · Neff
                </div>
                <div
                  className={`text-[11px] sm:text-xs font-extrabold ${
                    cardTheme === "navy_gold" ? "text-amber-400" : "text-sky-400"
                  }`}
                >
                  {personName} · Tel. {contactPhone}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void exportBusinessCardPng("back")}
              className="w-full min-h-[44px] px-4 py-2 rounded-lg border border-primary/20 dark:border-white/20 hover:border-sky-500 text-ink font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-sky-500" />
              <span>Rückseite für {personName} als Druck-PNG herunterladen</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 4 Professional Logo Variations (Navy Blue, Sky Blue & White) */}
      <div className="bg-surface dark:bg-slate-900 border border-primary/10 dark:border-white/10 rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-primary/10 dark:border-white/10">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-ink">
              2. Die 4 Logo-Variationen (Marineblau · Himmelblau · Weiß)
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Klicken Sie auf „Auf Visitenkarte nutzen“, um das gewünschte Logo direkt oben in die Visitenkarte einzusetzen, oder laden Sie es einzeln herunter.
            </p>
          </div>
          <span className="text-xs font-mono text-sky-700 dark:text-sky-300 font-bold">
            Farbpalette: #0F172A · #0284C7 · #FFFFFF
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
                  <div className="relative bg-white dark:bg-slate-900 overflow-hidden aspect-4/3 border-b border-primary/10 dark:border-white/10 flex items-center justify-center">
                    <img
                      src={logo.src}
                      alt={logo.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain bg-white"
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

                <div className="p-4 pt-0 flex flex-col sm:flex-row gap-2">
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
                    <span>{isSelected ? "Auf Visitenkarte aktiv" : "Auf Visitenkarte nutzen"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadAssetImage(logo.src, logo.filename)}
                    className="flex-1 min-h-[44px] px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    <span>Bild herunterladen</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Studio Print Mockups & Additional Templates */}
      <div className="bg-surface dark:bg-slate-900 border border-primary/10 dark:border-white/10 rounded-xl p-5 sm:p-6 space-y-4">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-ink">
            3. Druck-Präsentationen &amp; Weitere Design-Vorlagen
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Inklusive der neuen Studio-Vorlage für Frau Hannachi mit integriertem Marine-/Himmelblau-Logo und QR-Code.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {GENERATED_BRAND_ASSETS.map((asset) => (
            <div
              key={asset.id}
              className="rounded-xl border border-primary/12 dark:border-white/10 bg-background dark:bg-slate-950 overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="relative bg-slate-900 overflow-hidden aspect-video">
                  <img
                    src={asset.src}
                    alt={asset.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
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
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-light text-white text-xs font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-sky-400" />
                  <span>Bild herunterladen ({asset.filename})</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
