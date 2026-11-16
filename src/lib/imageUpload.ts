// Client-side browser image compression & resizing for Mrs. Hannachi's multi-photo uploads.
// Resizes high-resolution phone camera shots down to max 1400px edge in WebP (with JPEG fallback)
// so uploads are fast over mobile data and crystal-clear for E-Nr. / PNC nameplates.

export type CompressedImageResult = {
  dataUrl: string;
  fileName: string;
  width: number;
  height: number;
  originalBytes: number;
  compressedBytes: number;
  mimeType: "image/webp" | "image/jpeg";
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden."));
    reader.readAsDataURL(file);
  });
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Bild konnte nicht decodiert werden."));
    img.src = src;
  });
}

export async function compressImageFileForUpload(
  file: File,
  options: { maxEdge?: number; quality?: number } = {}
): Promise<CompressedImageResult> {
  const maxEdge = options.maxEdge ?? 1400;
  const quality = options.quality ?? 0.82;

  let width = 0;
  let height = 0;
  let bitmap: ImageBitmap | null = null;
  let htmlImg: HTMLImageElement | null = null;

  try {
    if (typeof createImageBitmap === "function") {
      bitmap = await createImageBitmap(file);
      width = bitmap.width;
      height = bitmap.height;
    } else {
      const rawUrl = await readFileAsDataUrl(file);
      htmlImg = await loadHtmlImage(rawUrl);
      width = htmlImg.naturalWidth || htmlImg.width;
      height = htmlImg.naturalHeight || htmlImg.height;
    }
  } catch {
    const rawUrl = await readFileAsDataUrl(file);
    htmlImg = await loadHtmlImage(rawUrl);
    width = htmlImg.naturalWidth || htmlImg.width;
    height = htmlImg.naturalHeight || htmlImg.height;
  }

  const longest = Math.max(width, height, 1);
  const scale = longest > maxEdge ? maxEdge / longest : 1;
  const targetW = Math.max(1, Math.round(width * scale));
  const targetH = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap?.close?.();
    throw new Error("Canvas-Kontext nicht verfügbar.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  if (bitmap) {
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    bitmap.close();
  } else if (htmlImg) {
    ctx.drawImage(htmlImg, 0, 0, targetW, targetH);
  }

  let dataUrl = canvas.toDataURL("image/webp", quality);
  let mimeType: "image/webp" | "image/jpeg" = "image/webp";

  // Fallback to JPEG if browser lacks WebP canvas encoder
  if (!dataUrl.startsWith("data:image/webp")) {
    dataUrl = canvas.toDataURL("image/jpeg", quality);
    mimeType = "image/jpeg";
  }

  const base64Part = dataUrl.split(",")[1] || "";
  const compressedBytes = Math.ceil((base64Part.length * 3) / 4);

  return {
    dataUrl,
    fileName: file.name,
    width: targetW,
    height: targetH,
    originalBytes: file.size,
    compressedBytes,
    mimeType,
  };
}

export function formatBytesCompact(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
