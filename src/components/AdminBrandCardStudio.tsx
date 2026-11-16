"use client";

import React, { useState } from "react";
import {
  Check,
  Download,
  ExternalLink,
  ImageDown,
  Palette,
  Printer,
  QrCode,
  Share2,
  Sparkles,
  Wrench,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { business } from "@/data/site";
import logoLightImg from "@/assets/images/hannachi_brand_logo_1794832118702.jpg";
import logoDarkImg from "@/assets/images/hannachi_logo_emblem_dark_1794832122366.jpg";
import cardMockupImg from "@/assets/images/hannachi_business_card_qr_1794832122335.jpg";

interface AdminBrandCardStudioProps {
  onToast?: (msg: string) => void;
}

const GENERATED_BRAND_ASSETS = [
  {
    id: "logo-light",
    title: "Hannachi Hauptlogo (Helles Studio-Design)",
    subtitle: "Monogramm „H“ mit Werkzeug & Trommel-Emblem auf Weiß (1:1)",
    src: logoLightImg,
    filename: "Hannachi-Logo-Hell.jpg",
    aspect: "aspect-square",
  },
  {
    id: "logo-dark",
    title: "Hannachi Meister-Emblem (Dunkelblau & Gold)",
    subtitle: "Edles Gold-Wappen auf Marineblau für Briefkopf & Profilbild (4:3)",
    src: logoDarkImg,
    filename: "Hannachi-Logo-Dunkel-Gold.jpg",
    aspect: "aspect-4/3",
  },
  {
    id: "card-mockup",
    title: "Visitenkarten-Präsentation mit QR-Code (hannachi.de)",
    subtitle: "Fotorealistische Vorschau auf Naturstein (16:9)",
    src: cardMockupImg,
    filename: "Hannachi-Visitenkarte-Mockup.jpg",
    aspect: "aspect-video",
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

export default function AdminBrandCardStudio({ onToast }: AdminBrandCardStudioProps) {
  const [cardTheme, setCardTheme] = useState<"navy_gold" | "clean_light">("navy_gold");
  const [customTagline, setCustomTagline] = useState(
    "Vor-Ort-Kundendienst · Gebrauchtgeräte · Ersatzteile"
  );
  const [qrUrl, setQrUrl] = useState("https://hannachi.de");
  const [exportingSide, setExportingSide] = useState<"front" | "back" | "logo" | null>(null);

  const notify = (msg: string) => {
    if (onToast) onToast(msg);
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
   * Renders a print-ready 300-DPI business card (85x55mm -> 1050x675px) as a crisp PNG with scannable QR code for hannachi.de
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

      const isNavy = cardTheme === "navy_gold";

      if (side === "front") {
        // Background
        ctx.fillStyle = isNavy ? "#0f172a" : "#ffffff";
        ctx.fillRect(0, 0, width, height);

        // Top & Bottom Gold Accent Trim
        ctx.fillStyle = "#f59e0b";
        ctx.fillRect(0, 0, width, 12);
        ctx.fillRect(0, height - 8, width, 8);

        // Left Column: Brand & Contact Info
        const padX = 64;
        let y = 92;

        // Icon Badge
        ctx.fillStyle = isNavy ? "rgba(245, 158, 11, 0.16)" : "#0f172a";
        ctx.beginPath();
        ctx.roundRect(padX, y - 44, 58, 58, 14);
        ctx.fill();

        ctx.fillStyle = "#f59e0b";
        ctx.font = "900 34px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        ctx.fillText("H", padX + 16, y - 3);

        // Brand Name
        ctx.fillStyle = isNavy ? "#ffffff" : "#0f172a";
        ctx.font = "900 44px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        ctx.fillText("HANNACHI", padX + 76, y - 8);

        ctx.fillStyle = "#f59e0b";
        ctx.font = "700 19px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        ctx.fillText("ELEKTROHAUSHALTSGERÄTE SERVICE", padX + 76, y + 18);

        y += 68;
        ctx.fillStyle = isNavy ? "rgba(255,255,255,0.15)" : "#e2e8f0";
        ctx.fillRect(padX, y, 560, 2);

        y += 44;
        ctx.fillStyle = isNavy ? "#f8fafc" : "#0f172a";
        ctx.font = "800 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        ctx.fillText(`Inhaber: ${business.owner}`, padX, y);

        y += 34;
        ctx.fillStyle = isNavy ? "#cbd5e1" : "#475569";
        ctx.font = "600 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        ctx.fillText(customTagline, padX, y);

        y += 58;
        // Phone Callout Box
        ctx.fillStyle = isNavy ? "rgba(245, 158, 11, 0.14)" : "#fef3c7";
        ctx.beginPath();
        ctx.roundRect(padX, y - 34, 540, 56, 12);
        ctx.fill();

        ctx.fillStyle = isNavy ? "#fbbf24" : "#b45309";
        ctx.font = "800 25px monospace";
        ctx.fillText(`Tel. & WhatsApp: ${business.phoneDisplay}`, padX + 18, y + 2);

        y += 64;
        ctx.fillStyle = isNavy ? "#e2e8f0" : "#1e293b";
        ctx.font = "600 21px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        ctx.fillText(
          `${business.street} · ${business.zip} ${business.city}`,
          padX,
          y
        );

        y += 34;
        ctx.fillStyle = isNavy ? "#94a3b8" : "#64748b";
        ctx.font = "600 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        ctx.fillText(
          `E-Mail: ${business.email} · Web: hannachi.de`,
          padX,
          y
        );

        y += 40;
        ctx.fillStyle = "#10b981";
        ctx.font = "700 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        ctx.fillText(
          "✓ Waschmaschine · Trockner · Geschirrspüler · Herd · Kühlgerät",
          padX,
          y
        );

        // Right Column: White QR Code Card pointing to hannachi.de
        const qrBoxW = 280;
        const qrBoxH = 350;
        const qrBoxX = width - qrBoxW - 58;
        const qrBoxY = 145;

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.roundRect(qrBoxX, qrBoxY, qrBoxW, qrBoxH, 22);
        ctx.fill();

        ctx.strokeStyle = "#f59e0b";
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
        ctx.fillText("hannachi.de", qrBoxX + qrBoxW / 2, qrBoxY + 282);

        ctx.fillStyle = "#475569";
        ctx.font = "700 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        ctx.fillText(
          "QR-Code scannen für",
          qrBoxX + qrBoxW / 2,
          qrBoxY + 308
        );
        ctx.fillText(
          "Online-Termin & WhatsApp",
          qrBoxX + qrBoxW / 2,
          qrBoxY + 328
        );
        ctx.textAlign = "left";
      } else {
        // Back Side: Centered Crest + Scannable QR Code + Services
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = "rgba(245, 158, 11, 0.45)";
        ctx.lineWidth = 3;
        ctx.strokeRect(36, 36, width - 72, height - 72);

        ctx.textAlign = "center";
        ctx.fillStyle = "#f59e0b";
        ctx.font = "900 54px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        ctx.fillText("HANNACHI", width / 2, 130);

        ctx.fillStyle = "#ffffff";
        ctx.font = "700 23px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        ctx.fillText(
          "ELEKTROHAUSHALTSGERÄTE SERVICE · OSNABRÜCK",
          width / 2,
          168
        );

        // Center QR Box
        const qrSize = 230;
        const boxW = 270;
        const boxH = 290;
        const boxX = (width - boxW) / 2;
        const boxY = 205;

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 20);
        ctx.fill();

        const svgEl = document.getElementById(
          "hannachi-card-qr-svg"
        ) as SVGSVGElement | null;
        await drawSvgElementToCanvas(ctx, svgEl, boxX + 20, boxY + 18, qrSize);

        ctx.fillStyle = "#0f172a";
        ctx.font = "900 22px monospace";
        ctx.fillText("www.hannachi.de", width / 2, boxY + 272);

        ctx.fillStyle = "#cbd5e1";
        ctx.font = "600 21px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        ctx.fillText(
          "Miele · Bosch · Siemens · AEG · Bauknecht · Liebherr · Neff",
          width / 2,
          555
        );

        ctx.fillStyle = "#f59e0b";
        ctx.font = "800 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        ctx.fillText(
          `Vor-Ort-Reparatur & Geprüfte Geräte · Tel. ${business.phoneDisplay}`,
          width / 2,
          598
        );
        ctx.textAlign = "left";
      }

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download =
          side === "front"
            ? "Hannachi-Visitenkarte-Vorderseite-QR.png"
            : "Hannachi-Visitenkarte-Rueckseite-QR.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        notify(
          side === "front"
            ? "Visitenkarte (Vorderseite mit QR-Code) als PNG gespeichert"
            : "Visitenkarte (Rückseite mit QR-Code) als PNG gespeichert"
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
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-accent">
            <Sparkles className="w-4 h-4" />
            <span>Für Frau &amp; Herrn Hannachi · Druckfertige Ausstattung</span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink mt-1">
            Visitenkarte (mit QR-Code zu hannachi.de) &amp; Marken-Logo
          </h2>
          <p className="text-xs sm:text-sm text-ink-muted mt-1 max-w-2xl leading-relaxed">
            Laden Sie hier Ihre fertigen Logo-Designs und Ihre druckfertige Visitenkarte (Standardmaß 85 × 55 mm) mit echtem, scannbarem QR-Code direkt auf <strong>hannachi.de</strong> herunter oder drucken Sie einen Visitenkarten-Bogen aus.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={exportingSide !== null}
            onClick={() => void exportBusinessCardPng("front")}
            data-testid="download-card-front-png-btn"
            className="min-h-[44px] px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-primary font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <ImageDown className="w-4 h-4 shrink-0" />
            <span>Vorderseite (PNG)</span>
          </button>
          <button
            type="button"
            disabled={exportingSide !== null}
            onClick={() => void exportBusinessCardPng("back")}
            data-testid="download-card-back-png-btn"
            className="min-h-[44px] px-4 py-2 rounded-lg bg-primary hover:bg-primary-light text-white font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-accent shrink-0" />
            <span>Rückseite (PNG)</span>
          </button>
        </div>
      </div>

      {/* Interactive Live Business Card Preview (Front & Back with Scannable QR Code to hannachi.de) */}
      <div className="bg-surface dark:bg-slate-900 border border-primary/10 dark:border-white/10 rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-primary/10 dark:border-white/10">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-ink flex items-center gap-2">
              <QrCode className="w-5 h-5 text-accent" />
              <span>1. Interaktive Visitenkarte (85 × 55 mm) mit Live-QR-Code</span>
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Der QR-Code ist direkt mit der Kamera scannbar und führt Kunden sofort auf <strong>{qrUrl}</strong>.
            </p>
          </div>

          {/* Theme Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 self-start">
            <button
              type="button"
              onClick={() => setCardTheme("navy_gold")}
              className={`min-h-[38px] px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                cardTheme === "navy_gold"
                  ? "bg-primary text-white dark:bg-accent dark:text-primary"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Marineblau &amp; Gold</span>
            </button>
            <button
              type="button"
              onClick={() => setCardTheme("clean_light")}
              className={`min-h-[38px] px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                cardTheme === "clean_light"
                  ? "bg-primary text-white dark:bg-accent dark:text-primary"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <span>Klassisch Weiß</span>
            </button>
          </div>
        </div>

        {/* Optional Quick Customization Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-sm font-mono text-ink"
            />
          </div>
          <div>
            <label
              htmlFor="card-tagline-input"
              className="block text-xs font-semibold text-ink mb-1"
            >
              Unterzeile auf der Visitenkarte
            </label>
            <input
              id="card-tagline-input"
              type="text"
              value={customTagline}
              onChange={(e) => setCustomTagline(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-background dark:bg-slate-950 border border-primary/15 dark:border-white/15 text-sm text-ink"
            />
          </div>
        </div>

        {/* Front & Back Card Live Preview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* FRONT SIDE */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-ink-muted px-1">
              <span>VORDERSEITE (Kontakt &amp; QR-Code zu hannachi.de)</span>
              <span className="font-mono">85 × 55 mm</span>
            </div>

            <div
              className={`relative aspect-[85/55] w-full rounded-2xl overflow-hidden shadow-xl border transition-colors p-5 sm:p-7 flex flex-col justify-between ${
                cardTheme === "navy_gold"
                  ? "bg-slate-900 text-white border-amber-500/40"
                  : "bg-white text-slate-900 border-slate-300"
              }`}
            >
              {/* Top Gold Bar */}
              <div className="absolute top-0 inset-x-0 h-2 bg-amber-500" />

              <div className="grid grid-cols-12 gap-3 sm:gap-4 items-center h-full pt-1">
                {/* Left 8 Cols: Brand & Contact */}
                <div className="col-span-7 sm:col-span-8 flex flex-col justify-between h-full space-y-2">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                        <Wrench className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <div className="text-lg sm:text-2xl font-black tracking-wider leading-none">
                          HANNACHI
                        </div>
                        <div className="text-[9px] sm:text-[11px] font-extrabold text-amber-500 tracking-wide mt-0.5">
                          ELEKTROHAUSHALTSGERÄTE SERVICE
                        </div>
                      </div>
                    </div>

                    <div
                      className={`mt-2.5 pt-2 border-t text-xs sm:text-sm font-bold ${
                        cardTheme === "navy_gold"
                          ? "border-white/15 text-slate-100"
                          : "border-slate-200 text-slate-800"
                      }`}
                    >
                      Inhaber: {business.owner}
                    </div>
                    <div
                      className={`text-[10px] sm:text-xs font-medium line-clamp-1 ${
                        cardTheme === "navy_gold" ? "text-slate-300" : "text-slate-600"
                      }`}
                    >
                      {customTagline}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="inline-block rounded-lg bg-amber-500/15 border border-amber-500/35 px-2.5 py-1 font-mono text-xs sm:text-sm font-extrabold text-amber-400">
                      Tel. &amp; WhatsApp: {business.phoneDisplay}
                    </div>
                    <div
                      className={`text-[10px] sm:text-xs font-medium ${
                        cardTheme === "navy_gold" ? "text-slate-300" : "text-slate-700"
                      }`}
                    >
                      {business.street} · {business.zip} {business.city}
                    </div>
                    <div
                      className={`text-[10px] sm:text-xs font-mono ${
                        cardTheme === "navy_gold" ? "text-emerald-400" : "text-emerald-700"
                      }`}
                    >
                      www.hannachi.de · {business.email}
                    </div>
                  </div>
                </div>

                {/* Right 4 Cols: Scannable QR Code Badge */}
                <div className="col-span-5 sm:col-span-4 flex flex-col items-center justify-center bg-white text-slate-900 rounded-xl p-2.5 sm:p-3 border-2 border-amber-500 shadow-md">
                  <QRCodeSVG
                    value={qrUrl || "https://hannachi.de"}
                    size={96}
                    level="M"
                    bgColor="#FFFFFF"
                    fgColor="#0F172A"
                    className="w-20 h-20 sm:w-24 sm:h-24"
                  />
                  <span className="mt-1.5 font-mono text-[11px] sm:text-xs font-black text-slate-900 tracking-tight">
                    hannachi.de
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 text-center leading-tight">
                    Scannen für Termin &amp; WhatsApp
                  </span>
                </div>
              </div>

              {/* Bottom Gold Bar */}
              <div className="absolute bottom-0 inset-x-0 h-1.5 bg-amber-500" />
            </div>

            <button
              type="button"
              onClick={() => void exportBusinessCardPng("front")}
              className="w-full min-h-[44px] px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-primary font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <ImageDown className="w-4 h-4" />
              <span>Vorderseite als Druck-Bild (PNG) herunterladen</span>
            </button>
          </div>

          {/* BACK SIDE */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-ink-muted px-1">
              <span>RÜCKSEITE (Marken-Wappen &amp; Direkt-QR)</span>
              <span className="font-mono">85 × 55 mm</span>
            </div>

            <div className="relative aspect-[85/55] w-full rounded-2xl overflow-hidden shadow-xl border border-amber-500/40 bg-slate-900 text-white p-5 sm:p-7 flex flex-col items-center justify-between text-center">
              <div className="inset-3 border border-amber-500/35 rounded-xl pointer-events-none absolute" />

              <div className="z-10">
                <div className="text-xl sm:text-2xl font-black tracking-widest text-amber-400">
                  HANNACHI
                </div>
                <div className="text-[10px] sm:text-xs font-bold text-white/85 tracking-wider">
                  ELEKTROHAUSHALTSGERÄTE SERVICE · OSNABRÜCK
                </div>
              </div>

              <div className="z-10 bg-white text-slate-900 p-2.5 rounded-xl border-2 border-amber-400 shadow-md flex flex-col items-center">
                <QRCodeSVG
                  value={qrUrl || "https://hannachi.de"}
                  size={84}
                  level="M"
                  bgColor="#FFFFFF"
                  fgColor="#0F172A"
                  className="w-16 h-16 sm:w-20 sm:h-20"
                />
                <span className="mt-1 font-mono text-[10px] font-black text-slate-900">
                  www.hannachi.de
                </span>
              </div>

              <div className="z-10 space-y-0.5">
                <div className="text-[10px] sm:text-xs font-semibold text-slate-300">
                  Miele · Bosch · Siemens · AEG · Bauknecht · Liebherr · Neff
                </div>
                <div className="text-[11px] sm:text-xs font-extrabold text-amber-400">
                  Vor-Ort-Kundendienst · Tel. {business.phoneDisplay}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void exportBusinessCardPng("back")}
              className="w-full min-h-[44px] px-4 py-2 rounded-lg border border-primary/20 dark:border-white/20 hover:border-accent text-ink font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-accent" />
              <span>Rückseite als Druck-Bild (PNG) herunterladen</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Generated High-Resolution Logo & Business Card Design Gallery */}
      <div className="bg-surface dark:bg-slate-900 border border-primary/10 dark:border-white/10 rounded-xl p-5 sm:p-6 space-y-4">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-ink">
            2. Entworfene Logo- &amp; Visitenkarten-Bilder zum Speichern
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Hochauflösende Marken-Logos und Design-Vorlagen für WhatsApp-Profilbild, Social Media, Briefkopf und Druckerei.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {GENERATED_BRAND_ASSETS.map((asset) => (
            <div
              key={asset.id}
              className="rounded-xl border border-primary/12 dark:border-white/10 bg-background dark:bg-slate-950 overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="relative bg-slate-900 overflow-hidden aspect-4/3">
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
                  <Download className="w-4 h-4 text-accent" />
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
