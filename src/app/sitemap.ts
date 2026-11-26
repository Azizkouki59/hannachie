import type { MetadataRoute } from "next";
import { business, services } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/leistungen",
    ...services.map((s) => `/leistungen/${s.slug}`),
    "/anfrage",
    "/ueber-uns",
    "/kundenbewertungen",
    "/kontakt",
    "/impressum",
    "/datenschutz",
  ];
  return paths.map((p) => ({
    url: `${business.url}${p === "/" ? "/" : p}`,
  }));
}
