import Image from "next/image";
import { herrHannachiImage, werkstattImage } from "@/data/images";

export default function HeroVisual({
  priority = false,
  variant = "hero",
}: {
  priority?: boolean;
  variant?: "hero" | "about";
}) {
  const imageAsset = variant === "about" ? herrHannachiImage : werkstattImage;
  const alt =
    variant === "about"
      ? "Kamal Hannachi – Inhaber und Ansprechpartner in Osnabrück"
      : "Kamal Hannachi – Elektrohaushaltsgeräte & Ersatzteile Osnabrück";

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl shadow-lg">
      <Image
        src={imageAsset}
        alt={alt}
        fill
        priority={priority}
        quality={95}
        placeholder="blur"
        blurDataURL={imageAsset.blurDataURL}
        sizes="(min-width: 1024px) 40vw, (min-width: 640px) 60vw, 92vw"
        className={`object-cover ${
          variant === "about" ? "object-top" : "object-center"
        }`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/50 via-transparent to-transparent" />
    </div>
  );
}
