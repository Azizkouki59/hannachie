import heroAtelierBrandImg from "@/assets/images/hannachi_atelier_brand_hero_1795826014274.jpg";
import pillarConsultationImg from "@/assets/images/pillar_consultation_1795293955373.jpg";
import pillarPartsBrandImg from "@/assets/images/hannachi_parts_brand_showcase_1795826015535.jpg";
import pillarShowroomBrandImg from "@/assets/images/markengeraete_showroom_atelier_1795860742361.jpg";

export interface GeneratedPhotoAsset {
  src: string;
  alt: string;
  aspectClass: string;
  fallbackGradient: string;
}

export const generatedPhotos = {
  heroAtelierStage: {
    src: heroAtelierBrandImg,
    alt: "Hannachi Fachhandel in Osnabrück mit Edelstahl-Waschtrommel, Qualitätskontrolle und Hannachi-Siegel seit 1990",
    aspectClass: "aspect-[16/9]",
    fallbackGradient: "from-slate-900 via-sky-950 to-slate-950",
  },
  pillarConsultation: {
    src: pillarConsultationImg,
    alt: "Moderne Einbauküche mit hochwertigem Backofen und Induktionskochfeld – Persönliche Fachberatung",
    aspectClass: "aspect-[4/3]",
    fallbackGradient: "from-slate-800 via-slate-900 to-sky-950",
  },
  pillarSpareParts: {
    src: pillarPartsBrandImg,
    alt: "Passgenaue Original-Ersatzteile für Hausgeräte mit Hannachi Marken-Medaillon: Heizstab, Kugellager, Laugenpumpe, Motorkohlen und Türmanschette",
    aspectClass: "aspect-[4/3]",
    fallbackGradient: "from-slate-900 via-slate-800 to-cyan-950",
  },
  pillarAppliances: {
    src: pillarShowroomBrandImg,
    alt: "Ausgewählte Markengeräte im Hannachi Fachhandel Osnabrück: Waschmaschine, Wärmepumpentrockner und Geschirrspüler auf Anfrage",
    aspectClass: "aspect-[16/10]",
    fallbackGradient: "from-slate-800 via-slate-900 to-slate-950",
  },
} as const satisfies Record<string, GeneratedPhotoAsset>;
