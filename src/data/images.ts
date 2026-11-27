export interface StaticImageData {
  src: string;
  avifSrc: string;
  avifSrcSet: string;
  webpSrc: string;
  webpSrcSet: string;
  width: number;
  height: number;
  defaultSizes?: string;
  blurDataURL: string;
}

function createImageAsset(
  name: string,
  width: number,
  height: number,
  defaultSizes = "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 800px",
  blurDataURL: string,
  version?: string
): StaticImageData {
  const qs = version ? `?v=${version}` : "";
  return {
    src: `/images/${name}.jpg${qs}`,
    avifSrc: `/images/${name}.avif${qs}`,
    avifSrcSet: `/images/${name}-480w.avif${qs} 480w, /images/${name}-960w.avif${qs} 960w, /images/${name}-1600w.avif${qs} 1600w`,
    webpSrc: `/images/${name}.webp${qs}`,
    webpSrcSet: `/images/${name}-480w.webp${qs} 480w, /images/${name}-960w.webp${qs} 960w, /images/${name}-1600w.webp${qs} 1600w`,
    width,
    height,
    defaultSizes,
    blurDataURL,
  };
}

export const werkstattImage = createImageAsset(
  "werkstatt",
  1376,
  768,
  "(max-width: 768px) 100vw, (max-width: 1280px) 55vw, 960px",
  "data:image/webp;base64,UklGRj4AAABXRUJQVlA4IDIAAACQAQCdASoQAAkAA8BgJYwAApj4idAA/rH/9ee8w2Jk2dBBnkzaOrF0rhef033Q9ezIAA==",
  "pro2"
);

export const werkstattHeroHdImage: StaticImageData = {
  src: "/images/werkstatt-hero-hd.jpg?v=hd1",
  avifSrc: "/images/werkstatt-hero-hd.avif?v=hd1",
  avifSrcSet:
    "/images/werkstatt-hero-hd-1600w.avif?v=hd1 1600w, /images/werkstatt-hero-hd-2400w.avif?v=hd1 2400w",
  webpSrc: "/images/werkstatt-hero-hd.webp?v=hd1",
  webpSrcSet:
    "/images/werkstatt-hero-hd-1600w.webp?v=hd1 1600w, /images/werkstatt-hero-hd-2400w.webp?v=hd1 2400w",
  width: 2400,
  height: 1340,
  defaultSizes: "(min-width: 1280px) 1600px, (min-width: 1024px) 1200px, 95vw",
  blurDataURL:
    "data:image/webp;base64,UklGRj4AAABXRUJQVlA4IDIAAACQAQCdASoQAAkAA8BgJYwAApj4idAA/rH/9ee8w2Jk2dBBnkzaOrF0rhef033Q9ezIAA==",
};

export const herrHannachiImage = createImageAsset(
  "herr-hannachi",
  896,
  1200,
  "(max-width: 640px) 96px, 480px",
  "data:image/webp;base64,UklGRkQAAABXRUJQVlA4IDgAAAAQAgCdASoMABAAA8BgJQBOgBu2zLa+L8rAAP7EYQc/PGCW+QQ+aIz/AKq8nSAW5trQc6CaUAAAAA==",
  "pro2"
);

// Showroom photo (bright Fachhandel consultation & spare parts space) used on "Über uns" & Marketplace.
export const showroomImage = createImageAsset(
  "showroom",
  1264,
  848,
  "(min-width: 1024px) 46vw, 96vw",
  "data:image/webp;base64,UklGRmoAAABXRUJQVlA4IF4AAABQAgCdASoQAAsAAwBSJZQAD5DvGNW/NOMkMAAA/mn+2jLrhKVgbhE8weJzoEWGz6bEfF520m5Ug6IOkhR7KovNiryVHRMGp3QUs6ptFZqD8XesryvLl3+toE15DcAA",
  "pro3"
);

export const washerModernImage = createImageAsset(
  "washer-modern",
  1264,
  848,
  "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 480px",
  "data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAADwAQCdASoQAAsAAwBSJZwAAtpBCdPJilAA/vZ7Ftv06l/1jFlGyxxx30mbwrvkNvozROsNa/xlFGB53gOpKtfxrJQdEN2XlBMgAA==",
  "pro3"
);

export const dishwasherImage = createImageAsset(
  "dishwasher",
  1264,
  848,
  "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 480px",
  "data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAADQAQCdASoQAAsAAwBSJQAAYpcA2FyqwAD+9SRZ+9OW83/dAzVI2ixs7kzAgcNO9ZJbIGi0Srh75KsmxtCtTWPIY8b8oannrT+AAA==",
  "pro3"
);

export const fridgeModernImage = createImageAsset(
  "fridge-modern",
  1264,
  848,
  "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 480px",
  "data:image/webp;base64,UklGRloAAABXRUJQVlA4IE4AAADQAQCdASoQAAsAAwBSJZwAAh4gZJLxAAD+4MVFlKffH5uf3C1PTZLapiFUwha0pa1Vgo5QMM8qBt3ffMvKQMi5me+P1QGjJEkgvAvXZAA=",
  "pro3"
);

export const ovenKitchenImage = createImageAsset(
  "oven-kitchen",
  1264,
  848,
  "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 480px",
  "data:image/webp;base64,UklGRlAAAABXRUJQVlA4IEQAAADQAQCdASoQAAsAAwBSJZwAAhZ9QIJ8AAD+9DhxWO7sbHA+kF+SOVkxRbo8DERTlNCGwpQhzbxSZheSocFCramlzKAAAA==",
  "pro3"
);

export const heroRepairImage = createImageAsset(
  "hero-repair",
  1200,
  896,
  "(max-width: 768px) 100vw, 960px",
  "data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAACwAQCdASoQAAwAA8BgJZwAAlwYlICAAP7ok50FkBqtHJZS+l8iCLJiUtdrQlyF9RHSxCgA",
  "pro2"
);

export const technicianImage = createImageAsset(
  "technician",
  2400,
  1600,
  "(max-width: 768px) 100vw, 960px",
  "data:image/webp;base64,UklGRjwAAABXRUJQVlA4IDAAAADQAQCdASoQAAsAA8BgJQBOgBwytRVQAADOD3izzqRx9ztV0s0chSFExMFSlcOvAAA="
);

export const toolsWorkbenchImage = createImageAsset(
  "tools-workbench",
  1200,
  896,
  "(max-width: 768px) 100vw, 640px",
  "data:image/webp;base64,UklGRmQAAABXRUJQVlA4IFgAAADQAQCdASoQAAwAAwBSJZQCdAEQ+LG4AAD7pODTJgtCkhk8Zr6vzfT7uxThsDrbIsAQje6t2JvK9+dc8iEOkKQWucbnXh0zR6NWfMCRFKVlTqbkv6SXAAAA",
  "pro3"
);

export const IMAGE_ASSETS_BY_PATH: Record<string, StaticImageData> = {
  "/images/werkstatt.jpg": werkstattImage,
  "/images/werkstatt-hero-hd.jpg": werkstattHeroHdImage,
  "/images/herr-hannachi.jpg": herrHannachiImage,
  "/images/showroom.jpg": showroomImage,
  "/images/washer-modern.jpg": washerModernImage,
  "/images/dishwasher.jpg": dishwasherImage,
  "/images/fridge-modern.jpg": fridgeModernImage,
  "/images/oven-kitchen.jpg": ovenKitchenImage,
  "/images/hero-repair.jpg": heroRepairImage,
  "/images/technician.jpg": technicianImage,
  "/images/tools-workbench.jpg": toolsWorkbenchImage,
};

export const serviceImagesBySlug: Record<string, StaticImageData> = {
  waschmaschinen: washerModernImage,
  geschirrspueler: dishwasherImage,
  kuehlschraenke: fridgeModernImage,
  backoefen: ovenKitchenImage,
  "waschmaschinen-reparatur": washerModernImage,
  "geschirrspueler-reparatur": dishwasherImage,
  "kuehlgeraete-reparatur": fridgeModernImage,
  "backofen-reparatur": ovenKitchenImage,
};
