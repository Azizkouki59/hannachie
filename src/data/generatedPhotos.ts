import heroAtelierStageImg from "@/assets/images/hero_atelier_stage_1795293955899.jpg";
import pillarConsultationImg from "@/assets/images/pillar_consultation_1795293955373.jpg";
import pillarSparePartsImg from "@/assets/images/pillar_spare_parts_1795293956791.jpg";
import pillarAppliancesImg from "@/assets/images/pillar_appliances_1795293955080.jpg";

export interface GeneratedPhotoAsset {
  src: string;
  alt: string;
  aspectClass: string;
  fallbackGradient: string;
}

export const generatedPhotos = {
  heroAtelierStage: {
    src: heroAtelierStageImg,
    alt: "Hochwertige Hausgeräte-Technik und präzise Edelstahl-Trommel im Studio-Licht – Hannachi Osnabrück",
    aspectClass: "aspect-[4/3]",
    fallbackGradient: "from-slate-900 via-sky-950 to-slate-950",
  },
  pillarConsultation: {
    src: pillarConsultationImg,
    alt: "Moderne Einbauküche mit hochwertigem Backofen und Induktionskochfeld – Persönliche Fachberatung",
    aspectClass: "aspect-[4/3]",
    fallbackGradient: "from-slate-800 via-slate-900 to-sky-950",
  },
  pillarSpareParts: {
    src: pillarSparePartsImg,
    alt: "Präzise Original-Ersatzteile für Hausgeräte: Kugellager, Pumpenmotor, Panzerschlauch und Dichtung",
    aspectClass: "aspect-[4/3]",
    fallbackGradient: "from-slate-900 via-slate-800 to-cyan-950",
  },
  pillarAppliances: {
    src: pillarAppliancesImg,
    alt: "Ausgewählte Markengeräte: Edelstahl-Kühlschrank und Frontlader-Hausgeräte auf Anfrage",
    aspectClass: "aspect-[4/3]",
    fallbackGradient: "from-slate-800 via-slate-900 to-slate-950",
  },
} as const satisfies Record<string, GeneratedPhotoAsset>;
