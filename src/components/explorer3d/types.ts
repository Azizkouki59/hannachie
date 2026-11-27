import type * as THREE from "three";

export type ExplorerApplianceId =
  | "waschmaschine"
  | "geschirrspueler"
  | "backofen"
  | "kuehlschrank"
  | "trockner"
  | "kaffeevollautomat";

export type PartFailureFrequency = "Sehr häufig" | "Häufig" | "Typischer Verschleiß";

export interface SparePartMeta {
  id: string;
  code: string; // "01" .. "08"
  name: string;
  shortLabel: string;
  aka?: string;
  location: string;
  frequency: PartFailureFrequency;
  symptoms: string[];
  enrHint: string;
  description: string;
  inquirySymptom: string;
  whatsappText: string;
}

export interface SymptomShortcut {
  id: string;
  label: string;
  partIds: string[];
}

export interface ExplorerApplianceMeta {
  id: ExplorerApplianceId;
  label: string;
  shortLabel: string;
  formDeviceValue: string;
  subtitle: string;
  typeplateLocation: string;
  symptomShortcuts: SymptomShortcut[];
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
  allClickables: THREE.Object3D[];
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
  warmAmberPart: () => THREE.MeshStandardMaterial;
  mattePolymer: () => THREE.MeshStandardMaterial;
  brassFitting: () => THREE.MeshStandardMaterial;
  edgeLine: () => THREE.LineBasicMaterial;
  leaderLine: () => THREE.LineDashedMaterial;
}

export const EXPLORER_APPLIANCES: ExplorerApplianceMeta[] = [
  /* ══════════════════════════════════════════════════════════════════
     1. WASCHMASCHINE (8 häufigste Ersatzteile)
  ══════════════════════════════════════════════════════════════════ */
  {
    id: "waschmaschine",
    label: "Waschmaschine",
    shortLabel: "Waschen",
    formDeviceValue: "Waschmaschine",
    subtitle: "8 häufigste Verschleiß- & Originalteile für Frontlader aller Marken",
    typeplateLocation: "Innen am Bullaugen-Rahmen oder hinter der Flusensieb-Klappe",
    symptomShortcuts: [
      { id: "wm-abpumpen", label: "Pumpt nicht ab", partIds: ["laugenpumpe"] },
      { id: "wm-kalt", label: "Wäsche bleibt kalt", partIds: ["heizstab"] },
      { id: "wm-undicht", label: "Wasser an der Tür", partIds: ["tuerdichtung"] },
      { id: "wm-tuer", label: "Tür öffnet nicht", partIds: ["tuerschloss"] },
      { id: "wm-dreht", label: "Trommel dreht nicht", partIds: ["antrieb"] },
      { id: "wm-huepft", label: "Hüpft / schlägt laut", partIds: ["stossdaempfer", "trommel"] },
      { id: "wm-wasser", label: "Zieht kein Wasser", partIds: ["magnetventil"] },
    ],
    parts: [
      {
        id: "laugenpumpe",
        code: "01",
        name: "Laugenpumpe & Flusensieb",
        shortLabel: "Laugenpumpe",
        aka: "Ablaufpumpe / Magnetpumpe",
        location: "Unten rechts hinter der Sockelblende",
        frequency: "Sehr häufig",
        symptoms: [
          "Wasser bleibt nach dem Waschen in der Trommel stehen",
          "Pumpe brummt laut oder blockiert beim Abpumpen",
          "Fehlermeldung Abfluss / Pumpe im Display",
        ],
        enrHint: "Typenschild am Bullaugen-Rahmen fotografieren",
        description:
          "Komplette Ablaufpumpe, Magnetpumpe oder passendes Flusensieb mit Dichtung für zuverlässiges Abpumpen.",
        inquirySymptom: "Originalteil nach Typenschild: Laugenpumpe / Ablaufpumpe",
        whatsappText:
          "Hallo Herr Hannachi, ich suche eine passende Original-Laugenpumpe (Ablaufpumpe) für meine Waschmaschine und sende gleich das Foto vom Typenschild.",
      },
      {
        id: "heizstab",
        code: "02",
        name: "Heizstab & NTC-Temperaturfühler",
        shortLabel: "Heizstab & NTC",
        aka: "Rohrheizkörper / Heizelement",
        location: "Unten im Bottich unterhalb der Trommel",
        frequency: "Sehr häufig",
        symptoms: [
          "Wäsche und Bullaugen-Glas bleiben komplett kalt",
          "FI-Schalter oder Sicherung löst während des Waschgangs aus",
          "Waschprogramm läuft deutlich länger als normal",
        ],
        enrHint: "Typenschild für exakte Wattzahl & Fühler-Aufnahme",
        description:
          "Original-Rohrheizkörper mit Dichtung und integriertem NTC-Temperatursensor für die richtige Waschtemperatur.",
        inquirySymptom: "Originalteil nach Typenschild: Heizstab / NTC-Temperaturfühler",
        whatsappText:
          "Hallo Herr Hannachi, ich benötige einen passenden Heizstab / NTC-Fühler für meine Waschmaschine (Foto vom Typenschild folgt).",
      },
      {
        id: "tuerdichtung",
        code: "03",
        name: "Türmanschette (Bullaugendichtung)",
        shortLabel: "Türmanschette",
        aka: "Faltenbalg / Gummidichtung",
        location: "Vorne rund um die Einfüllöffnung am Bullauge",
        frequency: "Sehr häufig",
        symptoms: [
          "Wasser tropft oder läuft vorne an der Tür herunter",
          "Sichtbarer Riss, Loch oder starker Schimmelbefall im Gummi",
          "Wäsche bleibt beim Schleudern am Gummi hängen",
        ],
        enrHint: "Passgenau mit vorderem & hinterem Spannring",
        description:
          "Original-EPDM-Türmanschette inklusive passender Spannringe gegen Wasseraustritt am Bullauge.",
        inquirySymptom: "Originalteil nach Typenschild: Türmanschette (Bullaugendichtung)",
        whatsappText:
          "Hallo Herr Hannachi, ich suche eine passende Original-Türmanschette für meine Waschmaschine und sende gleich das Typenschild.",
      },
      {
        id: "tuerschloss",
        code: "04",
        name: "Türverriegelung (Türschloss / PTC)",
        shortLabel: "Türschloss",
        aka: "Türrelais / Türkontakt",
        location: "Vorne rechts am Türrahmen neben dem Schließhaken",
        frequency: "Sehr häufig",
        symptoms: [
          "Waschmaschine startet nicht trotz geschlossener Tür",
          "Tür bleibt nach Programmende dauerhaft verriegelt",
          "Tür-Symbol blinkt oder klackt wiederholt",
        ],
        enrHint: "Steckerform & Baujahr über das Typenschild abgleichen",
        description:
          "Original-Türverriegelung mit PTC-Bimetall-Kontakt für sicheres Ver- und Entriegeln beim Waschen.",
        inquirySymptom: "Originalteil nach Typenschild: Türverriegelung / Türschloss",
        whatsappText:
          "Hallo Herr Hannachi, ich benötige eine passende Original-Türverriegelung (Türschloss) für meine Waschmaschine.",
      },
      {
        id: "antrieb",
        code: "05",
        name: "Motorkohlen & Antriebsriemen",
        shortLabel: "Kohlen & Riemen",
        aka: "Kohlebürsten / Keilrippenriemen / Riemenscheibe",
        location: "Hinten an der Riemenscheibe & unten am Antriebsmotor",
        frequency: "Sehr häufig",
        symptoms: [
          "Trommel dreht nicht oder schleudert nicht mehr",
          "Motor läuft hörbar, aber die Trommel steht still (Riemen gerissen)",
          "Starke Funkenbildung oder sporadischer Ausfall beim Schleudern",
        ],
        enrHint: "Motorkohlen-Satz & Keilrippenriemen exakt nach Modell",
        description:
          "Passende Original-Motorkohlen (Kohlebürsten), Keilrippenriemen und Riemenscheibe nach Hersteller-Stückliste.",
        inquirySymptom: "Originalteil nach Typenschild: Motorkohlen / Antriebsriemen",
        whatsappText:
          "Hallo Herr Hannachi, ich suche passende Motorkohlen oder einen Antriebsriemen für meine Waschmaschine (Typenschild folgt).",
      },
      {
        id: "stossdaempfer",
        code: "06",
        name: "Stoßdämpfer (Dämpfer-Satz)",
        shortLabel: "Stoßdämpfer",
        aka: "Reibungsdämpfer / Schwingungsdämpfer",
        location: "Unten links und rechts zwischen Bottich und Bodenrahmen",
        frequency: "Häufig",
        symptoms: [
          "Maschine hüpft, wandert oder vibriert extrem beim Schleudern",
          "Laute dumpfe Schläge beim Anlaufen des Schleudergangs",
          "Bottich lässt sich von Hand sehr leicht tief herunterdrücken",
        ],
        enrHint: "Immer paarweise passend zur Dämpfungskraft (Newton)",
        description:
          "Original-Stoßdämpfer im Satz inklusive Befestigungsbolzen für ruhigen, erschütterungsfreien Schleudergang.",
        inquirySymptom: "Originalteil nach Typenschild: Stoßdämpfer-Satz",
        whatsappText:
          "Hallo Herr Hannachi, ich suche passende Stoßdämpfer für meine Waschmaschine und sende gleich ein Foto vom Typenschild.",
      },
      {
        id: "trommel",
        code: "07",
        name: "Trommellager, Wellendichtring & Rippen",
        shortLabel: "Trommel & Lager",
        aka: "Kugellager-Satz / Simmerring / Lagerkreuz",
        location: "Zentral hinten an der Trommelachse im Bottich",
        frequency: "Typischer Verschleiß",
        symptoms: [
          "Lautes mahlendes oder brummendes Geräusch beim Schleudern",
          "Trommel hat merkliches Spiel beim Anheben von Hand",
          "Braune Rostspuren an der Rückseite oder gebrochene Trommelrippe",
        ],
        enrHint: "Lagersatz mit passendem Wellendichtring nach Typenschild",
        description:
          "Präzisions-Trommellager, Wellendichtring, Lagerkreuz und Mitnehmerrippen passend zur Seriennummer.",
        inquirySymptom: "Originalteil nach Typenschild: Trommellager / Wellendichtring / Trommelrippe",
        whatsappText:
          "Hallo Herr Hannachi, ich suche ein Trommellager-Set oder Trommelrippen für meine Waschmaschine.",
      },
      {
        id: "magnetventil",
        code: "08",
        name: "Magnetventil & Aquastop-Zulauf",
        shortLabel: "Magnetventil",
        aka: "Einlassventil / Wasserzulaufventil",
        location: "Hinten oben direkt am Wasseranschluss",
        frequency: "Häufig",
        symptoms: [
          "Maschine zieht kein Wasser trotz geöffnetem Wasserhahn",
          "Wasser läuft auch bei ausgeschaltetem Gerät langsam ein",
          "Einspülkammer bleibt trocken oder Weichspüler wird nicht eingezogen",
        ],
        enrHint: "2-fach oder 3-fach Ventil exakt nach Typenschild",
        description:
          "Original-Einlassmagnetventil sowie Sicherheits-Aquastop-Zulaufschlauch für kontrollierten Wassereinlauf.",
        inquirySymptom: "Originalteil nach Typenschild: Magnetventil / Aquastop-Zulauf",
        whatsappText:
          "Hallo Herr Hannachi, ich benötige ein passendes Magnetventil oder einen Aquastop-Zulaufschlauch für meine Waschmaschine.",
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════
     2. GESCHIRRSPÜLER (8 häufigste Ersatzteile)
  ══════════════════════════════════════════════════════════════════ */
  {
    id: "geschirrspueler",
    label: "Geschirrspüler",
    shortLabel: "Spüler",
    formDeviceValue: "Geschirrspüler",
    subtitle: "8 häufigste Verschleiß- & Originalteile für Einbau- & Standgeräte",
    typeplateLocation: "Oben in der Edelstahl-Türfalz eingelasert oder seitlich an der Tür",
    symptomShortcuts: [
      { id: "gs-kalt", label: "Bleibt kalt / spült schwach", partIds: ["umwaelzpumpe"] },
      { id: "gs-abpumpen", label: "Pumpt nicht ab", partIds: ["ablaufpumpe_gs", "sieb"] },
      { id: "gs-wasser", label: "Zieht kein Wasser / E15", partIds: ["aquastop", "wassertasche"] },
      { id: "gs-sauber", label: "Geschirr bleibt schmutzig", partIds: ["sprueharm", "umwaelzpumpe"] },
      { id: "gs-tab", label: "Tab löst sich nicht auf", partIds: ["dosierfach"] },
      { id: "gs-korb", label: "Korb klemmt / Tür undicht", partIds: ["geschirrkorb"] },
    ],
    parts: [
      {
        id: "umwaelzpumpe",
        code: "01",
        name: "Umwälz- & Heizpumpe",
        shortLabel: "Heizpumpe",
        aka: "Hauptspülpumpe mit Durchlauferhitzer",
        location: "Unten mittig im Gerätesockel am Pumpensumpf",
        frequency: "Sehr häufig",
        symptoms: [
          "Wasser bleibt kalt und das Geschirr trocknet nicht",
          "Pumpe brummt nur, aber es entsteht kein Sprühdruck",
          "Fehlermeldung Heizung (z. B. E09) im Display",
        ],
        enrHint: "Typenschild oben in der Türfalz für exakte Pumpenrevision",
        description:
          "Original-Umwälzpumpe bzw. Heizpumpe, exakt abgestimmt auf Elektronik, Stecker und Schlauchanschlüsse.",
        inquirySymptom: "Originalteil nach Typenschild: Umwälzpumpe / Heizpumpe",
        whatsappText:
          "Hallo Herr Hannachi, ich suche eine passende Original-Heizpumpe / Umwälzpumpe für meinen Geschirrspüler (Typenschild folgt).",
      },
      {
        id: "ablaufpumpe_gs",
        code: "02",
        name: "Ablaufpumpe (Laugenpumpe)",
        shortLabel: "Ablaufpumpe",
        aka: "Abwasserpumpe / Entleerungspumpe",
        location: "Unten vorne am Pumpensumpf neben dem Sieb",
        frequency: "Sehr häufig",
        symptoms: [
          "Schmutzwasser bleibt nach Programmende im Boden stehen",
          "Fehlermeldung Abwasser (z. B. E24 / E25) erscheint",
          "Abpumpgeräusch stottert oder bleibt ganz aus",
        ],
        enrHint: "Mit Bajonettverschluss und Dichtung exakt nach Modell",
        description:
          "Passgenaue Original-Ablaufpumpe mit Rückschlagklappe für störungsfreies Abpumpen des Spülwassers.",
        inquirySymptom: "Originalteil nach Typenschild: Geschirrspüler Ablaufpumpe",
        whatsappText:
          "Hallo Herr Hannachi, ich suche eine passende Original-Ablaufpumpe für meinen Geschirrspüler.",
      },
      {
        id: "aquastop",
        code: "03",
        name: "Aquastop-Zulaufschlauch",
        shortLabel: "Aquastop",
        aka: "Sicherheitszulaufschlauch / Magnetventil",
        location: "Hinten am Wasseranschluss (grauer Sicherheitskasten)",
        frequency: "Sehr häufig",
        symptoms: [
          "Spülmaschine zieht kein Wasser, Wasserhahn-Symbol leuchtet",
          "Aquastop-Ventil brummt nicht oder ist dauerhaft ausgelöst",
          "Fehlermeldung Wasserzulauf oder Wasserschutzsystem",
        ],
        enrHint: "Kompletter Sicherheits-Zulaufschlauch mit Steckkontakt",
        description:
          "Original-Aquastop-Schlauch mit integriertem Doppel-Magnetventil, Schutzmantel und passender Anschlusskupplung.",
        inquirySymptom: "Originalteil nach Typenschild: Aquastop-Zulaufschlauch",
        whatsappText:
          "Hallo Herr Hannachi, ich benötige einen Original-Aquastop-Zulaufschlauch für meinen Geschirrspüler.",
      },
      {
        id: "sprueharm",
        code: "04",
        name: "Sprüharme & Sprüharm-Lager",
        shortLabel: "Sprüharme",
        aka: "Oberer & unterer Spülarm / Steigrohr",
        location: "Unter dem Oberkorb und über dem Bodenfilter",
        frequency: "Häufig",
        symptoms: [
          "Geschirr wird im Ober- oder Unterkorb nicht richtig sauber",
          "Sprüharm dreht sich nicht mehr oder fällt ab",
          "Aufgeplatzte Seitennaht oder verstopfte Düsen am Arm",
        ],
        enrHint: "Bitte angeben, ob oberer oder unterer Sprüharm benötigt wird",
        description:
          "Original-Sprüharme inklusive Lagerbuchse, Mutter und Steigrohr für gleichmäßigen Wasserdruck bis in jede Ecke.",
        inquirySymptom: "Originalteil nach Typenschild: Sprüharm oben / unten",
        whatsappText:
          "Hallo Herr Hannachi, ich suche einen Original-Sprüharm für meinen Geschirrspüler und schicke gleich das Typenschild.",
      },
      {
        id: "wassertasche",
        code: "05",
        name: "Wassertasche (Wärmetauscher)",
        shortLabel: "Wassertasche",
        aka: "Einlaufsystem / Regenerierdosierung / Flügelradzähler",
        location: "An der linken Seitenwand hinter dem Seitenblech",
        frequency: "Häufig",
        symptoms: [
          "Unregelmäßiger Wasserzulauf oder Abbruch direkt nach dem Start",
          "Sichtbare Kalk- oder Fettablagerungen im oberen Labyrinth",
          "Flügelradzähler erkennt den Wassereinlauf nicht mehr",
        ],
        enrHint: "Genau nach Typenschild wegen Schlauch- & Sensoranschlüssen",
        description:
          "Original-Wassertasche bzw. Wärmetauscher inklusive Dichtungen und Durchflussmesser für exakte Wasserdosierung.",
        inquirySymptom: "Originalteil nach Typenschild: Wassertasche / Wärmetauscher",
        whatsappText:
          "Hallo Herr Hannachi, ich suche eine passende Original-Wassertasche (Wärmetauscher) für meinen Geschirrspüler.",
      },
      {
        id: "sieb",
        code: "06",
        name: "Feinsieb & Pumpensumpf-Dichtung",
        shortLabel: "Siebsystem",
        aka: "Mikrofilter / Siebzylinder / Sumpfdichtung",
        location: "Mittig im Boden des Spülraums",
        frequency: "Häufig",
        symptoms: [
          "Feine Speisereste lagern sich auf Gläsern und Tellern ab",
          "Siebgewebe ist gerissen oder der Griff gebrochen",
          "Undichtigkeit am Pumpensumpf (Wasser in der Bodenwanne / E15)",
        ],
        enrHint: "Komplette Siebkombination sowie Reparatursatz Pumpensumpf",
        description:
          "Original-Edelstahl-Feinsieb, Mikrofilter-Zylinder und Pumpensumpf-Dichtungssatz gegen Leckagen im Boden.",
        inquirySymptom: "Originalteil nach Typenschild: Feinsieb / Pumpensumpf-Dichtung",
        whatsappText:
          "Hallo Herr Hannachi, ich suche ein passendes Original-Feinsieb oder eine Pumpensumpf-Dichtung für meinen Geschirrspüler.",
      },
      {
        id: "dosierfach",
        code: "07",
        name: "Dosierkombination (Tab- & Klarspülerfach)",
        shortLabel: "Dosierfach",
        aka: "Reinigerfach / Klarspülerdosierer",
        location: "Innen in der Geschirrspüler-Tür",
        frequency: "Häufig",
        symptoms: [
          "Spültab-Klappe springt während des Programms nicht auf",
          "Schiebedeckel rastet nicht mehr ein oder Feder ist gebrochen",
          "Klarspüler läuft unkontrolliert aus (Schlieren auf Gläsern)",
        ],
        enrHint: "Komplette Dosierkombination samt Dichtung nach Typenschild",
        description:
          "Original-Dosierkombination mit zuverlässigem Auslöse-Aktuator, Deckelfeder und umlaufender Türdichtung.",
        inquirySymptom: "Originalteil nach Typenschild: Dosierkombination / Tab-Fach",
        whatsappText:
          "Hallo Herr Hannachi, ich suche eine neue Dosierkombination (Tab-Fach) für meinen Geschirrspüler.",
      },
      {
        id: "geschirrkorb",
        code: "08",
        name: "Geschirrkorb, Laufrollen & Türdichtung",
        shortLabel: "Körbe & Dichtung",
        aka: "Korbrollen / Besteckkorb / Türgummi",
        location: "Ober- & Unterkorb sowie umlaufender Türrahmen",
        frequency: "Typischer Verschleiß",
        symptoms: [
          "Unter- oder Oberkorb hakt, kippt weg oder Laufrollen fehlen",
          "Roststellen an den Korbzinken übertragen sich auf Besteck",
          "Dampf oder Spritzwasser tritt seitlich an der Tür aus",
        ],
        enrHint: "Einzelne Rollensätze, Besteckkörbe & Türdichtungen nach Modell",
        description:
          "Passgenaue Original-Korbrollen, Ersatzkörbe, Besteckschubladen und hitzebeständige Türdichtungen.",
        inquirySymptom: "Originalteil nach Typenschild: Geschirrkorb / Laufrollen / Türdichtung",
        whatsappText:
          "Hallo Herr Hannachi, ich suche passende Laufrollen, einen Ersatzkorb oder eine Türdichtung für meinen Geschirrspüler.",
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════
     3. BACKOFEN & HERD (8 häufigste Ersatzteile)
  ══════════════════════════════════════════════════════════════════ */
  {
    id: "backofen",
    label: "Backofen & Herd",
    shortLabel: "Backofen",
    formDeviceValue: "Backofen / Herd",
    subtitle: "8 häufigste Verschleiß- & Originalteile für Backöfen, Herde & Kochfelder",
    typeplateLocation: "Am inneren Türrahmen links oder rechts bei geöffneter Backofentür",
    symptomShortcuts: [
      { id: "bo-umluft", label: "Umluft heizt nicht", partIds: ["ringheizkoerper", "umluftluefter"] },
      { id: "bo-ober", label: "Oberhitze / Grill kalt", partIds: ["oberhitze"] },
      { id: "bo-unter", label: "Boden bleibt roh / FI fliegt", partIds: ["unterhitze"] },
      { id: "bo-temp", label: "Überhitzt / falsche Temp.", partIds: ["thermostat_ofen"] },
      { id: "bo-schalter", label: "Regler / Platte schaltet nicht", partIds: ["wahlschalter", "kochfeld_lampe"] },
      { id: "bo-tuer", label: "Tür schließt nicht dicht", partIds: ["tuerdichtung_ofen"] },
    ],
    parts: [
      {
        id: "ringheizkoerper",
        code: "01",
        name: "Heißluft-Ringheizkörper",
        shortLabel: "Ringheizkörper",
        aka: "Umluftheizung / Heißluft-Heizelement",
        location: "Hinten im Garraum hinter dem Prallblech rund um den Lüfter",
        frequency: "Sehr häufig",
        symptoms: [
          "Backofen bleibt bei Heißluft/Umluft kalt, Lüfter läuft aber",
          "Ober- und Unterhitze funktionieren noch, nur Heißluft nicht",
          "FI-Schalter löst sofort beim Einschalten von Heißluft aus",
        ],
        enrHint: "Durchmesser, Wattzahl & Flanschform exakt nach Typenschild",
        description:
          "Original-Heißluft-Ringheizkörper für gleichmäßige Backergebnisse auf mehreren Ebenen.",
        inquirySymptom: "Originalteil nach Typenschild: Heißluft-Ringheizkörper",
        whatsappText:
          "Hallo Herr Hannachi, ich suche einen passenden Heißluft-Ringheizkörper für meinen Backofen (Foto vom Typenschild folgt).",
      },
      {
        id: "oberhitze",
        code: "02",
        name: "Oberhitze- & Grillheizkörper",
        shortLabel: "Oberhitze & Grill",
        aka: "Deckelheizung / Grillspirale",
        location: "Oben an der Garraumdecke im Backofen",
        frequency: "Sehr häufig",
        symptoms: [
          "Grillfunktion oder Oberhitze bleibt kalt, Gerichte bräunen nicht",
          "Heizspirale oben hängt durch oder zeigt Blasen/Risse",
          "Sicherung fliegt beim Umschalten auf Grillstufe",
        ],
        enrHint: "Typenschild am Backofen-Rahmen zeigt genaue Doppel-Heizung",
        description:
          "Original-Oberhitze- und Grillheizkörper mit passender Haltebrücke und Anschlussfahnen.",
        inquirySymptom: "Originalteil nach Typenschild: Oberhitze- / Grillheizkörper",
        whatsappText:
          "Hallo Herr Hannachi, ich benötige einen neuen Oberhitze- bzw. Grillheizkörper für meinen Backofen.",
      },
      {
        id: "unterhitze",
        code: "03",
        name: "Unterhitze-Heizelement",
        shortLabel: "Unterhitze",
        aka: "Bodenheizung",
        location: "Verdeckt direkt unter dem Garraumboden",
        frequency: "Häufig",
        symptoms: [
          "Pizza- oder Kuchenboden bleibt roh, obwohl oben alles bräunt",
          "Garraumboden wird nicht heiß bei Ober-/Unterhitze",
          "FI-Schalter löst nach wenigen Minuten Aufheizzeit aus",
        ],
        enrHint: "Exakte Leistung (Watt) & Abmessungen nach Typenschild",
        description:
          "Original-Unterhitze-Heizelement für gleichmäßige Bodenwärme beim Backen und Braten.",
        inquirySymptom: "Originalteil nach Typenschild: Unterhitze-Heizelement",
        whatsappText:
          "Hallo Herr Hannachi, ich suche ein passendes Unterhitze-Heizelement für meinen Backofen.",
      },
      {
        id: "umluftluefter",
        code: "04",
        name: "Umluft-Ventilator & Lüftermotor",
        shortLabel: "Umluft-Lüfter",
        aka: "Heißluftgebläse / Lüfterrad & Motor",
        location: "Hinten mittig an der Garraumrückwand",
        frequency: "Häufig",
        symptoms: [
          "Lüfterrad dreht bei Umluft gar nicht oder nur sehr langsam",
          "Lautes Rattern, Schleifen oder Brummen aus der Rückwand",
          "Hitzeverteilung im Backofen ist stark ungleichmäßig",
        ],
        enrHint: "Motor, Achslänge & Lüfterrad exakt nach Typenschild",
        description:
          "Ausgewuchtetes Edelstahl-Lüfterrad sowie leiser Original-Umluftmotor für optimale Luftzirkulation.",
        inquirySymptom: "Originalteil nach Typenschild: Umluft-Ventilator / Lüftermotor",
        whatsappText:
          "Hallo Herr Hannachi, ich suche einen passenden Umluft-Ventilator oder Lüftermotor für meinen Backofen.",
      },
      {
        id: "thermostat_ofen",
        code: "05",
        name: "Backofenthermostat & NTC-Fühler",
        shortLabel: "Thermostat & NTC",
        aka: "Temperaturregler / Kapillarrohr-Thermostat",
        location: "Hinter der Bedienblende mit Temperaturfühler im Garraum",
        frequency: "Sehr häufig",
        symptoms: [
          "Backofen überhitzt extrem und verbrennt Speisen",
          "Eingestellte Temperatur wird nicht erreicht oder schwankt stark",
          "Kontrollleuchte geht gar nicht mehr aus oder gar nicht erst an",
        ],
        enrHint: "Exakte Temperatur-Kennlinie über das Typenschild prüfen",
        description:
          "Original-Backofenthermostat oder elektronischer PT500/NTC-Temperaturfühler für präzise Hitze.",
        inquirySymptom: "Originalteil nach Typenschild: Backofen-Thermostat / NTC-Fühler",
        whatsappText:
          "Hallo Herr Hannachi, ich brauche ein passendes Thermostat oder einen Temperaturfühler für meinen Backofen.",
      },
      {
        id: "wahlschalter",
        code: "06",
        name: "Wahlschalter & Energieregler",
        shortLabel: "Schalter & Regler",
        aka: "Backofen-Stufenschalter / Kochplattenregler / Knebel",
        location: "Oben hinter der Bedienblende hinter den Drehknöpfen",
        frequency: "Sehr häufig",
        symptoms: [
          "Kochzone heizt nur noch auf höchster Stufe oder gar nicht",
          "Einzelne Backofen-Programme reagieren nicht mehr am Drehknopf",
          "Drehschalter hakt, dreht durch oder riecht verschmort",
        ],
        enrHint: "Kontaktbelegung & Schaltstufen eindeutig über Typenschild",
        description:
          "Original-Funktionswahlschalter, stufenloser Energieregler sowie passende Bedienknebel.",
        inquirySymptom: "Originalteil nach Typenschild: Wahlschalter / Energieregler / Knebel",
        whatsappText:
          "Hallo Herr Hannachi, ich suche einen passenden Backofenschalter, Energieregler oder Drehknopf für meinen Herd.",
      },
      {
        id: "tuerdichtung_ofen",
        code: "07",
        name: "Backofentür-Dichtung & Türscharniere",
        shortLabel: "Dichtung & Scharnier",
        aka: "Garraumdichtung / Türfedern",
        location: "Umlaufend an der Frontöffnung & unten links/rechts an der Tür",
        frequency: "Häufig",
        symptoms: [
          "Heiße Luft und Dampf entweichen an der Tür, Knöpfe werden heiß",
          "Backofentür schließt nicht mehr komplett bündig oder hängt durch",
          "Dichtung ist gerissen, porös oder aus den Eckhaken gerutscht",
        ],
        enrHint: "4-seitige Dichtung mit Einhängehaken & Scharnier-Paar",
        description:
          "Hitzebeständige Original-Silikon-/Glasfaser-Türdichtung sowie exakte Türscharniere für sicheren Schluss.",
        inquirySymptom: "Originalteil nach Typenschild: Backofen-Türdichtung / Türscharniere",
        whatsappText:
          "Hallo Herr Hannachi, ich brauche eine neue Türdichtung oder Türscharniere für meinen Backofen.",
      },
      {
        id: "kochfeld_lampe",
        code: "08",
        name: "Kochfeld-Heizkreis & Backofenlampe",
        shortLabel: "Kochfeld & Lampe",
        aka: "Strahlungsheizkörper / 300 °C Ofenlampe & Glasabdeckung",
        location: "Unter dem Glaskeramik-Kochfeld & seitlich/oben im Garraum",
        frequency: "Häufig",
        symptoms: [
          "Eine Kochzone oder Zweikreis-Zone auf dem Ceranfeld bleibt kalt",
          "Backofenbeleuchtung bleibt dunkel oder Lampenglas ist gesprungen",
          "Restwärmeanzeige erlischt nicht oder flackert",
        ],
        enrHint: "Durchmesser (mm) & Typenschild für Kochfeld-Heizkreis",
        description:
          "Original-Strahlungsheizkörper (Ein- & Zweikreis) für Cerankochfelder sowie hitzefeste 300 °C Backofenlampen.",
        inquirySymptom: "Originalteil nach Typenschild: Kochfeld-Heizkreis / Backofenlampe",
        whatsappText:
          "Hallo Herr Hannachi, ich suche einen Kochfeld-Heizkreis oder eine Original-Backofenlampe (Typenschild folgt).",
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════
     4. KÜHLSCHRANK & GEFRIERGERÄT (7 häufigste Ersatzteile)
  ══════════════════════════════════════════════════════════════════ */
  {
    id: "kuehlschrank",
    label: "Kühlschrank",
    shortLabel: "Kühlen",
    formDeviceValue: "Kühlschrank / Gefriergerät",
    subtitle: "7 häufigste Verschleiß- & Originalteile für Kühl- & Gefrierkombinationen",
    typeplateLocation: "Innen links oder rechts an der Seitenwand neben dem Gemüsefach",
    symptomShortcuts: [
      { id: "ks-dichtung", label: "Tür schließt nicht / Eis", partIds: ["tuerdichtung_kuehl", "scharnier_kuehl"] },
      { id: "ks-temp", label: "Kühlt zu stark / gar nicht", partIds: ["thermostat_kuehl", "kompressor"] },
      { id: "ks-vereist", label: "Rückwand vereist (NoFrost)", partIds: ["abtauheizung", "umluft_kuehl"] },
      { id: "ks-klickt", label: "Klickt, startet nicht", partIds: ["kompressor"] },
      { id: "ks-fach", label: "Schublade / Glas gebrochen", partIds: ["schublade"] },
    ],
    parts: [
      {
        id: "tuerdichtung_kuehl",
        code: "01",
        name: "Magnet-Türdichtung",
        shortLabel: "Türdichtung",
        aka: "Kühlschrank-Gummi / Gefriertürdichtung",
        location: "Umlaufend an der Innenseite von Kühl- und Gefriertür",
        frequency: "Sehr häufig",
        symptoms: [
          "Tür schließt nicht mehr richtig dicht oder springt leicht auf",
          "Starke Reif- und Eisbildung im Inneren sowie Kondenswasser",
          "Gummi ist eingerissen, verhärtet oder der Stromverbrauch steigt",
        ],
        enrHint: "Steck- oder geschraubtes Profil eindeutig nach Typenschild",
        description:
          "Passgenaue Original-Magnet-Türdichtung für luftdichtes Schließen und niedrigen Stromverbrauch.",
        inquirySymptom: "Originalteil nach Typenschild: Kühlschrank Magnet-Türdichtung",
        whatsappText:
          "Hallo Herr Hannachi, ich suche eine passende Original-Magnet-Türdichtung für meinen Kühlschrank (Typenschild folgt).",
      },
      {
        id: "thermostat_kuehl",
        code: "02",
        name: "Thermostat & NTC-Temperaturfühler",
        shortLabel: "Thermostat & NTC",
        aka: "Temperaturregler / Luft- & Verdampferfühler",
        location: "Innen oben rechts am Lichtgehäuse oder an der Rückwand",
        frequency: "Sehr häufig",
        symptoms: [
          "Lebensmittel frieren im normalen Kühlteil ein",
          "Kühlschrank schaltet nicht mehr ein, Licht brennt aber",
          "Temperatur schwankt stark oder Alarm piept dauerhaft",
        ],
        enrHint: "Widerstandskennlinie & Kapillarlänge exakt nach Typenschild",
        description:
          "Original-Kühlschrankthermostat, NTC-Temperaturfühler und passendes LED-Beleuchtungsmodul.",
        inquirySymptom: "Originalteil nach Typenschild: Kühlschrank Thermostat / NTC-Fühler",
        whatsappText:
          "Hallo Herr Hannachi, ich suche ein passendes Thermostat oder einen NTC-Fühler für meinen Kühlschrank.",
      },
      {
        id: "abtauheizung",
        code: "03",
        name: "Abtauheizung & NoFrost-Thermosicherung",
        shortLabel: "Abtauheizung",
        aka: "Verdampfer-Heizung / Abtausensor / Thermofuse",
        location: "Hinten hinter der inneren NoFrost-Rückwand am Verdampfer",
        frequency: "Häufig",
        symptoms: [
          "Verdampfer und Luftkanäle vereisen innerhalb weniger Wochen",
          "Gefrierteil funktioniert noch, aber das Kühlteil wird zu warm",
          "Wasser läuft unten aus der Tür wegen vereistem Abfluss",
        ],
        enrHint: "Heizung, Thermosicherung & Abtausensor nach Typenschild",
        description:
          "Original-Abtauheizung, Temperaturbegrenzer (Thermofuse) und Abtausensor für vereisungsfreien NoFrost-Betrieb.",
        inquirySymptom: "Originalteil nach Typenschild: Abtauheizung / NoFrost-Thermosicherung",
        whatsappText:
          "Hallo Herr Hannachi, ich benötige eine Abtauheizung oder NoFrost-Thermosicherung für mein Kühlgerät.",
      },
      {
        id: "umluft_kuehl",
        code: "04",
        name: "Umluftventilator (NoFrost-Lüfter)",
        shortLabel: "NoFrost-Lüfter",
        aka: "Kühlraum-Ventilator / Luftklappe",
        location: "Oben an der inneren Rückwand hinter dem Lüftungsgitter",
        frequency: "Häufig",
        symptoms: [
          "Oben im Kühlschrank ist es zu warm, ganz unten eiskalt",
          "Lautes Klackern, Pfeifen oder Brummen bei geschlossener Tür",
          "Lüfter läuft nach dem Schließen der Tür nicht mehr an",
        ],
        enrHint: "Spannung (DC/AC) & Stecker über Typenschild abgleichen",
        description:
          "Leiser Original-Umluftventilator samt Flügelrad für gleichmäßige Kälteverteilung auf allen Ebenen.",
        inquirySymptom: "Originalteil nach Typenschild: Umluftventilator / NoFrost-Lüfter",
        whatsappText:
          "Hallo Herr Hannachi, ich suche einen passenden Umluftventilator (NoFrost-Lüfter) für meinen Kühlschrank.",
      },
      {
        id: "kompressor",
        code: "05",
        name: "Anlaufrelais (PTC) & Kompressor-Klixon",
        shortLabel: "Startrelais (PTC)",
        aka: "Anlassvorrichtung / Motorschutzschalter",
        location: "Unten hinten seitlich direkt am Kompressor-Gehäuse",
        frequency: "Häufig",
        symptoms: [
          "Kühlschrank klickt alle paar Minuten, Kompressor startet aber nicht",
          "Kompressor wird sehr heiß, Gerät kühlt jedoch überhaupt nicht",
          "Gerät brummt kurz für 2 Sekunden und schaltet wieder ab",
        ],
        enrHint: "Typenschild plus Kompressor-Aufdruck (z. B. Embraco / Secop)",
        description:
          "Original-PTC-Anlaufrelais, Überlastschutz (Klixon) und Anlaufkondensator für zuverlässigen Kompressorstart.",
        inquirySymptom: "Originalteil nach Typenschild: Anlaufrelais (PTC) / Klixon",
        whatsappText:
          "Hallo Herr Hannachi, ich suche ein passendes Anlaufrelais (PTC) oder Motorschutz für meinen Kühlschrank.",
      },
      {
        id: "scharnier_kuehl",
        code: "06",
        name: "Einbau-Türscharniere & Schleppscharnier",
        shortLabel: "Türscharniere",
        aka: "Flachscharnier-Satz / Hettich-Scharnier / Schlepptür-Gleitschiene",
        location: "Rechts oder links oben & unten zwischen Korpus und Tür",
        frequency: "Sehr häufig",
        symptoms: [
          "Einbau-Kühlschranktür schließt nicht mehr von selbst zu",
          "Tür hängt schief, knarrt laut oder schlägt gegen die Möbelblende",
          "Feder im Flachscharnier ist gebrochen oder ausgeleiert",
        ],
        enrHint: "Scharnier-Code (oft eingeprägt) & Geräte-Typenschild",
        description:
          "Original-Flachscharniere (meist paarweise) und Schlepptür-Befestigungen für spielfreies, dichtes Schließen.",
        inquirySymptom: "Originalteil nach Typenschild: Einbau-Türscharniere / Schleppscharnier",
        whatsappText:
          "Hallo Herr Hannachi, ich benötige neue Einbau-Türscharniere / Schleppscharniere für meinen Kühlschrank.",
      },
      {
        id: "schublade",
        code: "07",
        name: "Glasablagen, Türabsteller & Gefrierschubladen",
        shortLabel: "Fächer & Ablagen",
        aka: "Flaschenfach / Gemüseschale / Gefrierfach-Blende",
        location: "Im Kühlraum, an der Innentür & im Gefrierbereich",
        frequency: "Sehr häufig",
        symptoms: [
          "Flaschenabsteller in der Tür ist eingerissen oder abgebrochen",
          "Gefrierschublade bzw. Frontblende gesprungen",
          "Sicherheitsglas-Boden oder Gemüsefach beschädigt",
        ],
        enrHint: "Kein Messen nötig: exakte Passform über das Typenschild",
        description:
          "Original-Sicherheitsglasablagen, Türabsteller, Gemüseschalen und bruchfeste Gefrierschubladen.",
        inquirySymptom: "Originalteil nach Typenschild: Glasablage / Türabsteller / Gefrierschublade",
        whatsappText:
          "Hallo Herr Hannachi, ich suche eine passende Original-Schublade, Glasablage oder einen Türabsteller für meinen Kühlschrank.",
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════
     5. WÄSCHETROCKNER (7 häufigste Ersatzteile — NEU)
  ══════════════════════════════════════════════════════════════════ */
  {
    id: "trockner",
    label: "Wäschetrockner",
    shortLabel: "Trockner",
    formDeviceValue: "Wäschetrockner",
    subtitle: "7 häufigste Verschleiß- & Originalteile für Wärmepumpen- & Kondenstrockner",
    typeplateLocation: "Innen im Türrahmen rund um die Einfüllöffnung",
    symptomShortcuts: [
      { id: "tr-kalt", label: "Wäsche bleibt kalt / nass", partIds: ["tr_heizung", "tr_filter"] },
      { id: "tr-dreht", label: "Trommel dreht nicht", partIds: ["tr_riemen"] },
      { id: "tr-behaelter", label: "Meldung ‚Behälter voll‘", partIds: ["tr_pumpe"] },
      { id: "tr-abbruch", label: "Bricht zu früh ab", partIds: ["tr_sensor"] },
      { id: "tr-quietscht", label: "Quietscht / poltert laut", partIds: ["tr_lager"] },
      { id: "tr-tuer", label: "Tür rastet nicht ein", partIds: ["tr_tuerschloss"] },
    ],
    parts: [
      {
        id: "tr_heizung",
        code: "01",
        name: "Heizregister & Thermosicherung",
        shortLabel: "Heizregister",
        aka: "Heizelement / Temperaturbegrenzer / Klixon",
        location: "Hinten hinter der Rückwandabdeckung (bei Kondenstrocknern)",
        frequency: "Sehr häufig",
        symptoms: [
          "Trommel dreht normal, aber die Wäsche bleibt komplett kalt",
          "Trockner schaltet nach wenigen Minuten wegen Überhitzung ab",
          "FI-Schalter löst beim Aufheizen aus",
        ],
        enrHint: "Heizregister inkl. Klixon-Thermostaten nach Typenschild",
        description:
          "Original-Heizregister mit integrierten Sicherheits-Temperaturbegrenzern für sichere, schnelle Trocknung.",
        inquirySymptom: "Originalteil nach Typenschild: Trockner Heizregister / Thermosicherung",
        whatsappText:
          "Hallo Herr Hannachi, ich suche ein passendes Heizregister oder eine Thermosicherung für meinen Wäschetrockner.",
      },
      {
        id: "tr_riemen",
        code: "02",
        name: "Trockner-Antriebsriemen & Spannrolle",
        shortLabel: "Riemen & Rolle",
        aka: "Keilrippenriemen / Umlenkrolle",
        location: "Umlaufend um die Trocknertrommel & unten an der Motorwelle",
        frequency: "Sehr häufig",
        symptoms: [
          "Motor brummt hörbar, aber die Trommel dreht sich nicht mehr",
          "Trommel lässt sich von Hand völlig widerstandslos drehen",
          "Quietschendes Geräusch durch ausgeleierte Spannrolle",
        ],
        enrHint: "Exakte Länge & Rippenprofil (z. B. 1995 H7) nach Typenschild",
        description:
          "Original-Keilrippenriemen und kugelgelagerte Spannrolle für kraftschlüssigen, leisen Trommelantrieb.",
        inquirySymptom: "Originalteil nach Typenschild: Trockner Antriebsriemen / Spannrolle",
        whatsappText:
          "Hallo Herr Hannachi, ich benötige einen passenden Antriebsriemen oder eine Spannrolle für meinen Wäschetrockner.",
      },
      {
        id: "tr_pumpe",
        code: "03",
        name: "Kondensatpumpe & Schwimmerschalter",
        shortLabel: "Kondensatpumpe",
        aka: "Wasserpumpe / Pumpensumpf-Einheit",
        location: "Unten hinten im Sockel neben dem Kondensatsumpf",
        frequency: "Sehr häufig",
        symptoms: [
          "Anzeige ‚Wasserbehälter leeren‘ erscheint obwohl Tank leer ist",
          "Trockner bricht das Programm nach 10 bis 15 Minuten ab",
          "Wasser sammelt sich unten im Gerät statt im oberen Behälter",
        ],
        enrHint: "Passende Pumpe & Schwimmer-Mikroschalter nach Typenschild",
        description:
          "Original-Kondensatpumpe und Schwimmerschalter für zuverlässiges Hochpumpen des Kondenswassers.",
        inquirySymptom: "Originalteil nach Typenschild: Kondensatpumpe / Schwimmerschalter",
        whatsappText:
          "Hallo Herr Hannachi, ich suche eine passende Kondensatpumpe oder einen Schwimmerschalter für meinen Trockner.",
      },
      {
        id: "tr_filter",
        code: "04",
        name: "Flusensieb & Wärmetauscher-Filter",
        shortLabel: "Sieb & Filter",
        aka: "Türsieb / Schaumstofffilter / Sockelfilter",
        location: "In der Türöffnung und unten links hinter der Wartungsklappe",
        frequency: "Sehr häufig",
        symptoms: [
          "Trocknungszeit verlängert sich deutlich, Wäsche bleibt klamm",
          "Netzgewebe im Türsieb oder Sockel-Schwammfilter ist eingerissen",
          "Fehlermeldung ‚Filter reinigen‘ erlischt nicht mehr",
        ],
        enrHint: "Original-Filter passgenau ohne Luftverlust am Wärmetauscher",
        description:
          "Original-Flusensiebe, Klappsiebe und Sockel-Schwammfilter zum Schutz von Wärmepumpe und Luftkanal.",
        inquirySymptom: "Originalteil nach Typenschild: Flusensieb / Wärmetauscher-Filter",
        whatsappText:
          "Hallo Herr Hannachi, ich suche ein neues Original-Flusensieb oder Wärmetauscher-Filter für meinen Wäschetrockner.",
      },
      {
        id: "tr_sensor",
        code: "05",
        name: "Feuchtigkeits- & NTC-Temperatursensor",
        shortLabel: "Feuchte- & NTC-Sensor",
        aka: "Abtastrippen / Restfeuchtefühler",
        location: "Vorne im Luftkanal unter dem Sieb & an den Trommelrippen",
        frequency: "Häufig",
        symptoms: [
          "Trockner stoppt nach wenigen Minuten mit noch nasser Wäsche",
          "Zeitprogramme funktionieren, Automatikprogramme brechen ab",
          "Gerät läuft endlos weiter, obwohl die Wäsche längst trocken ist",
        ],
        enrHint: "NTC-Widerstandswert & Sensor-Baugruppe nach Typenschild",
        description:
          "Original-NTC-Temperaturfühler und Feuchtigkeits-Abtastsensoren für präzise Schranktrocken-Erkennung.",
        inquirySymptom: "Originalteil nach Typenschild: Feuchtigkeitssensor / NTC-Fühler",
        whatsappText:
          "Hallo Herr Hannachi, ich suche einen passenden Feuchtigkeits- oder NTC-Temperatursensor für meinen Trockner.",
      },
      {
        id: "tr_tuerschloss",
        code: "06",
        name: "Türverriegelung, Türhaken & Dichtung",
        shortLabel: "Türschloss & Gummi",
        aka: "Türschließer / Türkontaktschalter",
        location: "Vorne am Türrahmen und umlaufend an der Trocknertür",
        frequency: "Häufig",
        symptoms: [
          "Trocknertür springt während des Betriebs von allein auf",
          "Trockner startet nicht und meldet ‚Tür schließen‘",
          "Feuchte warme Luft entweicht vorne an der Türdichtung",
        ],
        enrHint: "Türhaken, Schloss & Türdichtung passend zum Modell",
        description:
          "Original-Türverriegelung, stabiler Türhaken und passgenaue Türdichtung für sicheren Betrieb.",
        inquirySymptom: "Originalteil nach Typenschild: Trockner Türverriegelung / Türhaken",
        whatsappText:
          "Hallo Herr Hannachi, ich brauche eine neue Türverriegelung, einen Türhaken oder eine Dichtung für meinen Trockner.",
      },
      {
        id: "tr_lager",
        code: "07",
        name: "Trommellager, Filzring & Laufrollen",
        shortLabel: "Lager & Laufrollen",
        aka: "Stützrollen / Gleitfilz / Hinteres Trommellager",
        location: "Unten vorne & hinten als Auflage der Trocknertrommel",
        frequency: "Typischer Verschleiß",
        symptoms: [
          "Lautes Quietschen, Pfeifen oder Schleifen beim Drehen der Trommel",
          "Wäsche klemmt sich vorne zwischen Trommel und Gehäuse ein",
          "Dumpfes Poltern durch abgenutzte Stützrollen",
        ],
        enrHint: "Stützrollen-Satz & Filzdichtung exakt nach Typenschild",
        description:
          "Original-Laufrollen, Gleitstücke, Filzdichtring und hinteres Trommellager für ruhigen Rundlauf.",
        inquirySymptom: "Originalteil nach Typenschild: Trommellager / Filzring / Laufrollen",
        whatsappText:
          "Hallo Herr Hannachi, ich suche passende Laufrollen, einen Filzring oder ein Trommellager für meinen Trockner.",
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════
     6. KAFFEEVOLLAUTOMAT (7 häufigste Ersatzteile — NEU)
  ══════════════════════════════════════════════════════════════════ */
  {
    id: "kaffeevollautomat",
    label: "Kaffeevollautomat",
    shortLabel: "Kaffee",
    formDeviceValue: "Kaffeevollautomat",
    subtitle: "7 häufigste Verschleiß- & Originalteile für Jura, DeLonghi, Siemens, Miele u. v. m.",
    typeplateLocation: "An der Geräteunterseite oder hinter der Service- / Wassertank-Klappe",
    symptomShortcuts: [
      { id: "kv-brueh", label: "Kaffee tröpfelt / klemmt", partIds: ["kv_bruehgruppe", "kv_dichtungen"] },
      { id: "kv-wasser", label: "Wasser in Tropfschale", partIds: ["kv_drainage", "kv_dichtungen"] },
      { id: "kv-mahlwerk", label: "Mahlt laut / keine Bohnen", partIds: ["kv_mahlwerk"] },
      { id: "kv-kalt", label: "Kaffee bleibt kalt", partIds: ["kv_thermoblock"] },
      { id: "kv-druck", label: "Brummt laut, kein Wasser", partIds: ["kv_pumpe"] },
      { id: "kv-milch", label: "Tank tropft / kein Schaum", partIds: ["kv_tank_milch"] },
    ],
    parts: [
      {
        id: "kv_bruehgruppe",
        code: "01",
        name: "Brühgruppe (Brüheinheit)",
        shortLabel: "Brühgruppe",
        aka: "Komplette Brüheinheit / Brühkolben",
        location: "Mittig im Gehäuse hinter der seitlichen Serviceklappe",
        frequency: "Sehr häufig",
        symptoms: [
          "Kaffee läuft nur noch tropfenweise oder extrem dünn aus",
          "Meldung ‚Brühgruppe einsetzen‘ oder ‚Brühgruppe blockiert‘",
          "Schwergängiger Mechanismus oder gebrochener Hebel",
        ],
        enrHint: "Marke & genaue Typenbezeichnung vom Typenschild angeben",
        description:
          "Original-Brüheinheit bzw. Brühkolben und Sieb für volles Aroma und gleichmäßigen Brühdruck.",
        inquirySymptom: "Originalteil nach Typenschild: Brühgruppe (Brüheinheit)",
        whatsappText:
          "Hallo Herr Hannachi, ich suche eine passende Original-Brühgruppe für meinen Kaffeevollautomaten (Typenschild folgt).",
      },
      {
        id: "kv_dichtungen",
        code: "02",
        name: "Dichtungen & O-Ring Wartungsset",
        shortLabel: "Dichtungsset",
        aka: "Lippendichtungen / Silikon-O-Ringe / Druckschlauch-Dichtungen",
        location: "An Brühkolben, Thermoblock-Anschlüssen und Druckleitungen",
        frequency: "Sehr häufig",
        symptoms: [
          "Klares Wasser oder Kaffee sammelt sich unter der Maschine",
          "Druckverlust beim Brühen und sehr nasser Kaffeesatz",
          "Zischender Dampfaustritt im Geräteinneren",
        ],
        enrHint: "Lebensmittelechtes EPDM-/Silikon-Wartungsset exakt nach Modell",
        description:
          "Passgenaues Original-Dichtungsset (O-Ringe, Lippendichtungen & Silikonfett) für dichte Druckverbindungen.",
        inquirySymptom: "Originalteil nach Typenschild: Dichtungs- & O-Ring Wartungsset",
        whatsappText:
          "Hallo Herr Hannachi, ich suche ein passendes Dichtungs- und O-Ring-Set für meinen Kaffeevollautomaten.",
      },
      {
        id: "kv_mahlwerk",
        code: "03",
        name: "Keramik- / Kegelmahlwerk",
        shortLabel: "Mahlwerk",
        aka: "Mahlkegel / Mahlring / Mahlwerksmotor",
        location: "Oben direkt unter dem Bohnenbehälter",
        frequency: "Sehr häufig",
        symptoms: [
          "Extrem lautes Kreischen oder Rattern beim Mahlen",
          "Fehlermeldung ‚Bohnen füllen‘ trotz vollem Bohnenbehälter",
          "Kaffee schmeckt wässrig durch abgenutzte Mahlscheiben",
        ],
        enrHint: "Komplettes Mahlwerk oder Mahlkegel-Satz nach Modellnummer",
        description:
          "Präzises Original-Keramik- oder Edelstahl-Kegelmahlwerk samt Mahlring für gleichmäßigen Mahlgrad.",
        inquirySymptom: "Originalteil nach Typenschild: Mahlwerk / Mahlkegel",
        whatsappText:
          "Hallo Herr Hannachi, ich benötige ein neues Mahlwerk bzw. Mahlkegel für meinen Kaffeevollautomaten.",
      },
      {
        id: "kv_thermoblock",
        code: "04",
        name: "Thermoblock (Durchlauferhitzer)",
        shortLabel: "Thermoblock",
        aka: "Heizblock / Dampfheizung / NTC-Sensor",
        location: "Im oberen hinteren Bereich neben der Brühgruppe",
        frequency: "Häufig",
        symptoms: [
          "Kaffee kommt nur lauwarm oder kalt aus dem Auslauf",
          "Gerät meldet ‚Aufheizen‘ dauerhaft oder zeigt Heizfehler",
          "Kein Heißwasser und kein Dampf mehr verfügbar",
        ],
        enrHint: "Thermoblock, Anschlüsse & Temperaturfühler nach Typenschild",
        description:
          "Original-Thermoblock (Durchlauferhitzer) inklusive Temperaturfühler und Thermosicherung für konstante Brühtemperatur.",
        inquirySymptom: "Originalteil nach Typenschild: Thermoblock (Durchlauferhitzer)",
        whatsappText:
          "Hallo Herr Hannachi, ich suche einen passenden Thermoblock (Durchlauferhitzer) für meinen Kaffeevollautomaten.",
      },
      {
        id: "kv_pumpe",
        code: "05",
        name: "Vibrationspumpe (z. B. ULKA-Pumpe)",
        shortLabel: "Wasserpumpe",
        aka: "15-Bar Druckpumpe / Membranregler",
        location: "Unten im Chassis zwischen Wassertank und Thermoblock",
        frequency: "Sehr häufig",
        symptoms: [
          "Maschine brummt laut, aber es wird kein Wasser gefördert",
          "Druck reicht nicht mehr aus, Crema fehlt komplett",
          "Pumpe wird extrem laut oder arbeitet nur noch stoßweise",
        ],
        enrHint: "Leistung (Watt), Typ (z. B. EP5 / EX5) & Anschlüsse nach Modell",
        description:
          "Original-Vibrationspumpe (15 bar) inklusive Schwingungsdämpfer für leisen, kräftigen Druckaufbau.",
        inquirySymptom: "Originalteil nach Typenschild: Vibrationspumpe / Wasserpumpe",
        whatsappText:
          "Hallo Herr Hannachi, ich suche eine passende Vibrationspumpe (z. B. ULKA) für meinen Kaffeevollautomaten.",
      },
      {
        id: "kv_drainage",
        code: "06",
        name: "Drainageventil & Auslaufventil",
        shortLabel: "Drainageventil",
        aka: "Keramikventil / Überdruckventil",
        location: "Direkt unterhalb der Brühgruppe über der Tropfschale",
        frequency: "Sehr häufig",
        symptoms: [
          "Kaffee landet komplett in der Tropfschale statt in der Tasse",
          "Beim Bezug fließt gleichzeitig viel Wasser in den Tresterbehälter",
          "Starker Druckverlust beim Kaffee- oder Dampfbezug",
        ],
        enrHint: "Exakte Ventil-Bauform je nach Hersteller-Serie",
        description:
          "Original-Drainageventil oder Keramik-Mehrwegeventil für saubere Drucksteuerung bis in die Tasse.",
        inquirySymptom: "Originalteil nach Typenschild: Drainageventil / Auslaufventil",
        whatsappText:
          "Hallo Herr Hannachi, ich benötige ein neues Drainageventil / Auslaufventil für meinen Kaffeevollautomaten.",
      },
      {
        id: "kv_tank_milch",
        code: "07",
        name: "Wassertank-Ventil & Milchsystem-Dichtung",
        shortLabel: "Tank & Milchsystem",
        aka: "Wassertank / Schwimmer / Cappuccinatore / Milchschlauch",
        location: "Seitlicher Wassertank & vorderer Kaffee-/Milchauslauf",
        frequency: "Häufig",
        symptoms: [
          "Wassertank tropft beim Herausnehmen oder im Gerät",
          "Milch wird nicht mehr angesaugt oder schäumt kaum noch",
          "Meldung ‚Wassertank füllen‘ erscheint trotz vollem Tank",
        ],
        enrHint: "Tankdichtung, Milchschlauch & Aufschäumer-Düse nach Modell",
        description:
          "Original-Wassertank, Tank-Bodenventil, Schwimmermagnet sowie komplette Milchsystem- und Aufschäumer-Teile.",
        inquirySymptom: "Originalteil nach Typenschild: Wassertank-Ventil / Milchsystem",
        whatsappText:
          "Hallo Herr Hannachi, ich suche Ersatzteile für den Wassertank oder das Milchsystem meines Kaffeevollautomaten.",
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
  if (clean.includes("trockner") || clean.includes("wärmepump") || clean.includes("waermepump")) {
    return "trockner";
  }
  if (clean.includes("kaffee") || clean.includes("espresso") || clean.includes("jura") || clean.includes("delonghi")) {
    return "kaffeevollautomat";
  }
  if (clean.includes("geschirr") || clean.includes("spül") || clean.includes("spuel")) {
    return "geschirrspueler";
  }
  if (clean.includes("wasch")) {
    return "waschmaschine";
  }
  if (clean.includes("kühl") || clean.includes("kuehl") || clean.includes("gefrier")) {
    return "kuehlschrank";
  }
  if (clean.includes("ofen") || clean.includes("herd") || clean.includes("back") || clean.includes("kochfeld")) {
    return "backofen";
  }
  return null;
}

export function getApplianceMeta(id: ExplorerApplianceId): ExplorerApplianceMeta {
  return EXPLORER_APPLIANCES.find((a) => a.id === id) ?? EXPLORER_APPLIANCES[0];
}
