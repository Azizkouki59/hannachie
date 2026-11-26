import type * as THREE from "three";

export type ExplorerApplianceId =
  | "waschmaschine"
  | "geschirrspueler"
  | "backofen"
  | "kuehlschrank";

export interface SparePartMeta {
  id: string;
  code: string; // "01" .. "05"
  name: string;
  shortLabel: string;
  enrHint: string;
  description: string;
  inquirySymptom: string;
  whatsappText: string;
}

export interface ExplorerApplianceMeta {
  id: ExplorerApplianceId;
  label: string;
  shortLabel: string;
  formDeviceValue: string;
  subtitle: string;
  parts: SparePartMeta[];
}

export interface BuiltSparePart {
  meta: SparePartMeta;
  group: THREE.Group;
  basePosition: THREE.Vector3;
  explodeOffset: THREE.Vector3;
  anchorLocal: THREE.Vector3;
  focusOffset: THREE.Vector3;
  clickableMeshes: THREE.Object3D[];
  highlightMaterials: THREE.MeshStandardMaterial[];
  leaderLine: THREE.Line;
  leaderOrigin: THREE.Vector3;
}

export interface BuiltApplianceAssembly {
  id: ExplorerApplianceId;
  root: THREE.Group;
  chassisMaterials: THREE.MeshPhysicalMaterial[];
  chassisBaseOpacities: number[];
  edgeMaterials: THREE.LineBasicMaterial[];
  parts: BuiltSparePart[];
  animate: (elapsed: number, delta: number, explode: number) => void;
}

export interface StudioBuilderContext {
  isSoftwareGl: boolean;
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T;
  trackMat: <T extends THREE.Material>(m: T) => T;
  trackTex: <T extends THREE.Texture>(t: T) => T;
  materials: StudioMaterialLibrary;
}

export interface StudioMaterialLibrary {
  ceramicShell: () => THREE.MeshPhysicalMaterial;
  satinSteel: () => THREE.MeshPhysicalMaterial;
  brightChrome: () => THREE.MeshPhysicalMaterial;
  obsidianGlass: () => THREE.MeshPhysicalMaterial;
  frostedGlass: () => THREE.MeshPhysicalMaterial;
  ceruleanPart: () => THREE.MeshStandardMaterial;
  copperCoil: () => THREE.MeshStandardMaterial;
  graphiteGasket: () => THREE.MeshStandardMaterial;
  darkChassis: () => THREE.MeshPhysicalMaterial;
  brushedDrum: () => THREE.MeshPhysicalMaterial;
  edgeLine: () => THREE.LineBasicMaterial;
  leaderLine: () => THREE.LineDashedMaterial;
}

export const EXPLORER_APPLIANCES: ExplorerApplianceMeta[] = [
  {
    id: "waschmaschine",
    label: "Waschmaschine",
    shortLabel: "Waschen",
    formDeviceValue: "Waschmaschine",
    subtitle: "Frontlader · Trommel, Pumpe, Heizstab & Dichtungen nach E-Nr.",
    parts: [
      {
        id: "trommel",
        code: "01",
        name: "Edelstahl-Waschtrommel & Lagerkreuz",
        shortLabel: "Trommel & Lager",
        enrHint: "E-Nr. am Bullaugen-Rahmen",
        description:
          "Trommelrippen, Lager-Satz, Wellendichtring und Trommelkreuz passend zur Seriennummer.",
        inquirySymptom: "Originalteil (E-Nr.): Trommel / Lager / Trommelrippe",
        whatsappText:
          "Hallo Herr Hannachi, ich suche ein Original-Ersatzteil für meine Waschmaschine (Bereich Trommel / Lager) und sende gleich die E-Nr. vom Typenschild.",
      },
      {
        id: "tuerdichtung",
        code: "02",
        name: "Türmanschette (EPDM-Dichtung)",
        shortLabel: "Türmanschette",
        enrHint: "Typenschild innen an der Tür",
        description:
          "Passgenaue Original-Türmanschette samt Spannringen gegen Wasseraustritt am Bullauge.",
        inquirySymptom: "Originalteil (E-Nr.): Türmanschette / Bullaugendichtung",
        whatsappText:
          "Hallo Herr Hannachi, ich suche eine passende Original-Türmanschette für meine Waschmaschine und schicke gleich ein Foto vom Typenschild.",
      },
      {
        id: "heizstab",
        code: "03",
        name: "Heizstab & NTC-Temperaturfühler",
        shortLabel: "Heizstab & NTC",
        enrHint: "E-Nr. / FD-Nr. für genaue Wattzahl",
        description:
          "Original-Rohrheizkörper mit integriertem NTC-Fühler und Dichtung für zuverlässige Waschtemperatur.",
        inquirySymptom: "Originalteil (E-Nr.): Heizstab / NTC-Fühler",
        whatsappText:
          "Hallo Herr Hannachi, ich benötige einen passenden Heizstab / NTC-Fühler für meine Waschmaschine (Typenschild-Foto folgt).",
      },
      {
        id: "laugenpumpe",
        code: "04",
        name: "Laugenpumpe & Flusensieb",
        shortLabel: "Laugenpumpe",
        enrHint: "E-Nr. + ggf. Pumpen-Teilenummer",
        description:
          "Komplette Ablaufpumpe, Magnetpumpe oder passendes Flusensieb für sauberes Abpumpen.",
        inquirySymptom: "Originalteil (E-Nr.): Laugenpumpe / Flusensieb",
        whatsappText:
          "Hallo Herr Hannachi, ich suche eine passende Original-Laugenpumpe oder ein Flusensieb für meine Waschmaschine.",
      },
      {
        id: "antrieb",
        code: "05",
        name: "Antriebsriemen & Riemenscheibe",
        shortLabel: "Antrieb & Riemen",
        enrHint: "Keilrippenriemen nach Modellnummer",
        description:
          "Original-Antriebsriemen, Riemenscheibe und Motorkohlen exakt nach Hersteller-Stückliste.",
        inquirySymptom: "Originalteil (E-Nr.): Antriebsriemen / Riemenscheibe",
        whatsappText:
          "Hallo Herr Hannachi, ich suche einen passenden Antriebsriemen / Riemenscheibe für meine Waschmaschine (E-Nr. sende ich gleich).",
      },
    ],
  },
  {
    id: "geschirrspueler",
    label: "Geschirrspüler",
    shortLabel: "Spüler",
    formDeviceValue: "Geschirrspüler",
    subtitle: "Einbau & Standgerät · Pumpe, Sprüharme, Körbe & Aquastop",
    parts: [
      {
        id: "sprueharm",
        code: "01",
        name: "Sprüharm-Einheit (Oben & Unten)",
        shortLabel: "Sprüharme",
        enrHint: "E-Nr. oben in der Türfalz eingelasert",
        description:
          "Original-Sprüharme mit Lagerbuchse und Steigrohr für gleichmäßigen Wasserdruck.",
        inquirySymptom: "Originalteil (E-Nr.): Sprüharm oben / unten",
        whatsappText:
          "Hallo Herr Hannachi, ich suche einen Original-Sprüharm für meinen Geschirrspüler und sende gleich die E-Nr. aus der Türfalz.",
      },
      {
        id: "geschirrkorb",
        code: "02",
        name: "Geschirrkorb & Laufrollen",
        shortLabel: "Körbe & Rollen",
        enrHint: "Ober- / Unterkorb nach E-Nr.",
        description:
          "Passgenaue Korbrollen, Besteckkörbe und komplette Ersatzkörbe ohne Klemmen.",
        inquirySymptom: "Originalteil (E-Nr.): Geschirrkorb / Laufrollen",
        whatsappText:
          "Hallo Herr Hannachi, ich suche passende Laufrollen oder einen Ersatzkorb für meinen Geschirrspüler.",
      },
      {
        id: "sieb",
        code: "03",
        name: "Edelstahl-Feinsieb & Pumpensumpf",
        shortLabel: "Siebsystem",
        enrHint: "Siebzylinder & Grobfilter-Einheit",
        description:
          "Original-Mikrofilter, Siebzylinder und Sumpfdichtung gegen Speisereste im Pumpenkreis.",
        inquirySymptom: "Originalteil (E-Nr.): Feinsieb / Pumpensumpf-Dichtung",
        whatsappText:
          "Hallo Herr Hannachi, ich suche ein passendes Original-Feinsieb / Siebsystem für meinen Geschirrspüler.",
      },
      {
        id: "umwaelzpumpe",
        code: "04",
        name: "Umwälz- & Heizpumpe",
        shortLabel: "Heizpumpe",
        enrHint: "E-Nr. + FD-Nr. für genaue Pumpenrevision",
        description:
          "Original-Heizpumpe bzw. Umwälzpumpe exakt abgestimmt auf Elektronik und Anschlüsse.",
        inquirySymptom: "Originalteil (E-Nr.): Umwälzpumpe / Heizpumpe",
        whatsappText:
          "Hallo Herr Hannachi, ich suche eine passende Original-Heizpumpe / Umwälzpumpe für meinen Geschirrspüler (E-Nr. folgt).",
      },
      {
        id: "aquastop",
        code: "05",
        name: "Aquastop-Zulaufschlauch",
        shortLabel: "Aquastop",
        enrHint: "Kompletter Sicherheits-Zulaufschlauch",
        description:
          "Original-Aquastop-Ventil mit Schutzschlauch und passender Steckverbindung.",
        inquirySymptom: "Originalteil (E-Nr.): Aquastop-Zulaufschlauch",
        whatsappText:
          "Hallo Herr Hannachi, ich benötige einen Original-Aquastop-Schlauch für meinen Geschirrspüler und sende gleich das Typenschild.",
      },
    ],
  },
  {
    id: "backofen",
    label: "Backofen & Herd",
    shortLabel: "Backofen",
    formDeviceValue: "Backofen / Herd",
    subtitle: "Herd, Backofen & Kochfeld · Heizkörper, Lüfter, Dichtungen",
    parts: [
      {
        id: "ringheizkoerper",
        code: "01",
        name: "Heißluft-Ringheizkörper",
        shortLabel: "Ringheizkörper",
        enrHint: "Typenschild am Backofen-Rahmen",
        description:
          "Original-Ringheizkörper, Ober-/Unterhitze- oder Grill-Heizelement passend zum Modell.",
        inquirySymptom: "Originalteil (E-Nr.): Heißluft-Ringheizkörper / Heizelement",
        whatsappText:
          "Hallo Herr Hannachi, ich suche einen passenden Ringheizkörper / Heizelement für meinen Backofen (Typenschild-Foto folgt).",
      },
      {
        id: "umluftluefter",
        code: "02",
        name: "Umluft-Ventilator & Motor",
        shortLabel: "Umluft-Lüfter",
        enrHint: "Lüfterrad & Motor nach E-Nr.",
        description:
          "Ausgewuchtetes Edelstahl-Lüfterrad und Umluftmotor für gleichmäßige Hitzeverteilung.",
        inquirySymptom: "Originalteil (E-Nr.): Umluft-Ventilator / Lüftermotor",
        whatsappText:
          "Hallo Herr Hannachi, ich suche einen passenden Umluft-Ventilator / Motor für meinen Backofen.",
      },
      {
        id: "induktionsspule",
        code: "03",
        name: "Kochfeld-Heizkreis & Schalter",
        shortLabel: "Kochfeld-Kreis",
        enrHint: "E-Nr. auf der Kochfeld-Unterseite / Anleitung",
        description:
          "Strahlungsheizkörper, Energieregler und Bedienknebel für Ceran- und Kochfelder.",
        inquirySymptom: "Originalteil (E-Nr.): Kochfeld-Heizkreis / Energieregler",
        whatsappText:
          "Hallo Herr Hannachi, ich suche ein Originalteil für mein Kochfeld / Herd (Heizkreis oder Schalter) und sende gleich die Modellnummer.",
      },
      {
        id: "tuerdichtung_ofen",
        code: "04",
        name: "Backofentür-Dichtung & Scharniere",
        shortLabel: "Dichtung & Scharnier",
        enrHint: "Türscharnier-Satz & 4-seitige Dichtung",
        description:
          "Hitzebeständige Original-Türdichtung mit Halteclips sowie präzise Türscharniere.",
        inquirySymptom: "Originalteil (E-Nr.): Backofen-Türdichtung / Scharnier",
        whatsappText:
          "Hallo Herr Hannachi, ich brauche eine neue Türdichtung oder Türscharniere für meinen Backofen (E-Nr. sende ich gleich).",
      },
      {
        id: "thermostat_ofen",
        code: "05",
        name: "Thermostat & Wahlschalter",
        shortLabel: "Thermostat",
        enrHint: "Temperaturregler & Backofenschalter",
        description:
          "Original-Backofenthermostat, Temperaturfühler und passender Funktions-Wahlschalter.",
        inquirySymptom: "Originalteil (E-Nr.): Backofen-Thermostat / Wahlschalter",
        whatsappText:
          "Hallo Herr Hannachi, ich suche ein passendes Thermostat oder einen Wahlschalter für meinen Herd / Backofen.",
      },
    ],
  },
  {
    id: "kuehlschrank",
    label: "Kühlschrank",
    shortLabel: "Kühlen",
    formDeviceValue: "Kühlschrank / Gefriergerät",
    subtitle: "Kühl- & Gefriergeräte · Dichtungen, Fühler, Fächer & Technik",
    parts: [
      {
        id: "tuerdichtung_kuehl",
        code: "01",
        name: "Magnet-Türdichtung",
        shortLabel: "Türdichtung",
        enrHint: "Typenschild innen neben Gemüsefach",
        description:
          "Passgenaue Original-Magnetdichtung für dichtes Schließen und niedrigen Stromverbrauch.",
        inquirySymptom: "Originalteil (E-Nr.): Kühlschrank Magnet-Türdichtung",
        whatsappText:
          "Hallo Herr Hannachi, ich suche eine passende Original-Magnet-Türdichtung für meinen Kühlschrank und sende gleich das Typenschild.",
      },
      {
        id: "thermostat_kuehl",
        code: "02",
        name: "Thermostat & NTC-Kühlfühler",
        shortLabel: "Thermostat & NTC",
        enrHint: "Exakte Temperatur-Kennlinie nach E-Nr.",
        description:
          "Original-Temperaturregler, NTC-Sensor und Beleuchtungsmodul für präzise Kühlung.",
        inquirySymptom: "Originalteil (E-Nr.): Kühlschrank Thermostat / NTC-Fühler",
        whatsappText:
          "Hallo Herr Hannachi, ich suche ein passendes Thermostat / NTC-Fühler für meinen Kühlschrank.",
      },
      {
        id: "schublade",
        code: "03",
        name: "Glasablagen, Fächer & Schubladen",
        shortLabel: "Fächer & Ablagen",
        enrHint: "Türabsteller, Gemüse- & Gefrierfächer",
        description:
          "Original-Sicherheitsglasböden, Flaschenabsteller und Gefrierschubladen ohne Nachmessen.",
        inquirySymptom: "Originalteil (E-Nr.): Glasablage / Gefrierschublade / Türfach",
        whatsappText:
          "Hallo Herr Hannachi, ich suche eine passende Original-Schublade, Glasablage oder ein Türfach für mein Kühlgerät.",
      },
      {
        id: "verdampfer",
        code: "04",
        name: "Abtau- & Lüftermodul (NoFrost)",
        shortLabel: "NoFrost & Lüfter",
        enrHint: "Umluftventilator & Abtauheizung nach Modell",
        description:
          "Original-Umluftventilator, Abtausensor und Luftklappen-Komponenten für NoFrost-Geräte.",
        inquirySymptom: "Originalteil (E-Nr.): Umluftventilator / Abtausensor",
        whatsappText:
          "Hallo Herr Hannachi, ich suche ein Original-Ersatzteil (Lüfter / Abtausensor) für mein Kühl- oder Gefriergerät.",
      },
      {
        id: "kompressor",
        code: "05",
        name: "Anlaufrelais & Schleppscharnier",
        shortLabel: "Relais & Scharnier",
        enrHint: "PTC-Relais, Scharniere & Zubehör",
        description:
          "Original-Startrelais, Einbau-Schleppscharniere und Dämpfungselemente passend zur Serie.",
        inquirySymptom: "Originalteil (E-Nr.): Startrelais / Einbau-Scharnier",
        whatsappText:
          "Hallo Herr Hannachi, ich suche ein Original-Startrelais oder Türscharnier für meinen Kühlschrank (E-Nr. folgt).",
      },
    ],
  },
];

export function resolveExplorerAppliance(
  deviceInput: string,
): ExplorerApplianceId | null {
  const clean = deviceInput.trim().toLowerCase();
  if (!clean || clean === "sonstiges" || clean.includes("anderes")) {
    return null;
  }
  if (clean.includes("geschirr") || clean.includes("spül") || clean.includes("spuel")) {
    return "geschirrspueler";
  }
  if (clean.includes("wasch") && !clean.includes("trockner")) {
    return "waschmaschine";
  }
  if (clean.includes("kühl") || clean.includes("kuehl") || clean.includes("gefrier")) {
    return "kuehlschrank";
  }
  if (clean.includes("ofen") || clean.includes("herd") || clean.includes("back")) {
    return "backofen";
  }
  return null;
}

export function getApplianceMeta(id: ExplorerApplianceId): ExplorerApplianceMeta {
  return EXPLORER_APPLIANCES.find((a) => a.id === id) ?? EXPLORER_APPLIANCES[0];
}
