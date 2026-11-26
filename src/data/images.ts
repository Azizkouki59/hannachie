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

// Showroom photo (no tools / no repair scene) used on "Über uns".
export const showroomImage = createImageAsset(
  "showroom",
  1200,
  896,
  "(min-width: 1024px) 46vw, 96vw",
  "data:image/webp;base64,UklGRlIAAABXRUJQVlA4IEYAAADQAQCdASoQAAwAA4BaJZwAAh5YFTMR4AD+bE2xbc0pq73USAY0g5wyDcQ8hxhVFmi/QC7zjGX2yZPAec03IzYXrnn1kBQA"
);

export const washerModernImage = createImageAsset(
  "washer-modern",
  1600,
  1066,
  "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 480px",
  "data:image/webp;base64,UklGRj4AAABXRUJQVlA4IDIAAADQAQCdASoQAAsAA8BgJZQCdAEO5Xz/0AD+5+l7ovo3ERqiI2xA8lUGh+gVNlIfrg7gAA=="
);

export const dishwasherImage = createImageAsset(
  "dishwasher",
  1600,
  2182,
  "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 480px",
  "data:image/webp;base64,UklGRjgAAABXRUJQVlA4ICwAAADQAQCdASoMABAAA8BgJaQAAub6kbLGQAD+h8K5QUSai3b0G9phaKskDaoAAA=="
);

export const fridgeModernImage = createImageAsset(
  "fridge-modern",
  1600,
  2400,
  "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 480px",
  "data:image/webp;base64,UklGRj4AAABXRUJQVlA4IDIAAACwAQCdASoLABAAA8BgJQAASvOz/UmAAMLOCrD5lGZSoL1R0NbMPjFK0+/e//orxAAAAA=="
);

export const ovenKitchenImage = createImageAsset(
  "oven-kitchen",
  1600,
  1066,
  "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 480px",
  "data:image/webp;base64,UklGRj4AAABXRUJQVlA4IDIAAADwAQCdASoQAAsAA8BgJZQCsAD0it3CaEgA/utmt1nZN7ZyXIPbc7hOfmEqUmR4bc0YAA=="
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
  2400,
  3360,
  "(max-width: 768px) 100vw, 640px",
  "data:image/webp;base64,UklGRj4AAABXRUJQVlA4IDIAAADQAQCdASoLABAAA8BgJZQAAlxTfhCiUAD+9xFQuX9s0xCyNAAc1LByEurGbQUygoAAAA=="
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
