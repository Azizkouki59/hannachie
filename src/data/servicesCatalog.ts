export type DeviceItem = {
  name: string;
  description: string;
  iconName:
    | "WashingMachine"
    | "Wind"
    | "Layers"
    | "UtensilsCrossed"
    | "Zap"
    | "Refrigerator"
    | "Snowflake"
    | "Flame"
    | "Fan"
    | "Microwave"
    | "Coffee"
    | "Sparkles"
    | "Cpu";
  faults: string[];
};

export type ServiceCategory = {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  devices: DeviceItem[];
};

export const mainServiceCategories: ServiceCategory[] = [
  {
    id: "waesche",
    title: "Wäsche waschen und trocknen",
    shortTitle: "Waschen & Trocknen",
    description:
      "Mobiler Vor-Ort-Service bei Ihnen zu Hause in Osnabrück, passende Original-Ersatzteile aller Marken sowie geprüfte Ersatzgeräte inkl. schriftlicher Verkäufergarantie.",
    devices: [
      {
        name: "Waschmaschinen",
        description: "Vor-Ort-Check, passende Ersatzteile & geprüfte Frontlader / Toplader mit Garantie.",
        iconName: "WashingMachine",
        faults: [
          "Pumpt nicht ab / schleudert nicht (Vor-Ort-Termin)",
          "Ersatzteil: Laugenpumpe / Ablaufpumpe",
          "Ersatzteil: Türmanschette / Bullaugendichtung",
          "Ersatzteil: Heizstab, NTC-Fühler & Motorkohlen",
          "Altgerät lohnt nicht mehr: Geprüfte Waschmaschine mit Garantie anfragen",
        ],
      },
      {
        name: "Wäschetrockner",
        description: "Vor-Ort-Termin, passende Ersatzteile & geprüfte Wärmepumpen- / Kondenstrockner.",
        iconName: "Wind",
        faults: [
          "Trocknet nicht mehr richtig / bricht ab (Vor-Ort-Termin)",
          "Ersatzteil: Kondensatpumpe & Schwimmerschalter",
          "Ersatzteil: Temperatursensor (NTC) & Heizelement",
          "Ersatzteil: Antriebsriemen, Spannrolle & Türschloss",
          "Altgerät lohnt nicht mehr: Geprüften Trockner mit Garantie anfragen",
        ],
      },
      {
        name: "Waschtrockner (2-in-1)",
        description: "Kombinierte Geräte zum Waschen und Trocknen sowie passende Ersatzteile.",
        iconName: "Layers",
        faults: [
          "Vor-Ort-Termin oder Ersatzteil nach Typenschild (E-Nr.)",
          "Ersatzteil: Ablaufpumpe & Magnetventil",
          "Ersatzteil: Stoßdämpfer & Türverriegelung",
          "Geprüften Waschtrockner mit schriftlicher Garantie anfragen",
        ],
      },
    ],
  },
  {
    id: "geschirr",
    title: "Geschirr spülen",
    shortTitle: "Geschirr spülen",
    description:
      "Mobiler Vor-Ort-Service für Geschirrspüler, passende Original-Ersatzteile sowie geprüfte Ersatzgeräte (45 cm / 60 cm) inkl. schriftlicher Garantie.",
    devices: [
      {
        name: "Geschirrspüler",
        description: "Vor-Ort-Check, Original-Ersatzteile & geprüfte Unterbau- und Stand-Spülmaschinen.",
        iconName: "UtensilsCrossed",
        faults: [
          "Pumpt nicht ab / heizt nicht (Vor-Ort-Termin)",
          "Ersatzteil: Heizpumpe / Umwälzpumpe",
          "Ersatzteil: Aquastop-Zulaufschlauch & Ablaufpumpe",
          "Ersatzteil: Geschirrkorb-Rollen, Sprüharme & Türdichtung",
          "Altgerät lohnt nicht mehr: Geprüften Geschirrspüler mit Garantie anfragen",
        ],
      },
      {
        name: "Büro- & Kleingewerbespüler",
        description: "Vor-Ort-Service, Ersatzteile und geprüfte Spülmaschinen für Teeküchen, Büros und Praxen.",
        iconName: "Zap",
        faults: [
          "Vor-Ort-Termin für Büro / Praxis anfragen",
          "Ersatzteil: Dosierkammer & Klarspülerspender",
          "Geprüftes Ersatzgerät mit schriftlicher Garantie anfragen",
        ],
      },
    ],
  },
  {
    id: "kuehlen",
    title: "Kühlen und Gefrieren",
    shortTitle: "Kühlen & Gefrieren",
    description:
      "Schnelle Vor-Ort-Termine bei Kühlproblemen, passgenaue Original-Ersatzteile sowie geprüfte Kühl- und Gefriergeräte inkl. schriftlicher Verkäufergarantie.",
    devices: [
      {
        name: "Kühlschränke",
        description: "Schneller Vor-Ort-Check, Original-Ersatzteile & geprüfte Stand- / Unterbaukühlschränke.",
        iconName: "Refrigerator",
        faults: [
          "Kühlt nicht mehr ausreichend / vereist stark (Vor-Ort-Termin)",
          "Ersatzteil: Thermostat & NTC-Temperaturfühler",
          "Ersatzteil: Magnet-Türdichtung & Schleppscharnier",
          "Geprüften Ersatz-Kühlschrank inkl. schriftlicher Garantie anfragen",
        ],
      },
      {
        name: "Gefrierschränke & Gefriertruhen",
        description: "Vor-Ort-Service, Ersatzteile & geprüfte NoFrost-Gefrierschränke.",
        iconName: "Snowflake",
        faults: [
          "Temperaturalarm / kühlt nicht mehr (Vor-Ort-Termin)",
          "Ersatzteil: Umluftventilator & Abtauheizung",
          "Ersatzteil: Startrelais & Gefrierschubladen",
          "Geprüften Gefrierschrank inkl. Garantie anfragen",
        ],
      },
      {
        name: "Side-by-Side & Kühl-Gefrierkombis",
        description: "Große Kühl-Gefrierkombinationen und Original-Ersatzteile.",
        iconName: "Layers",
        faults: [
          "Vor-Ort-Termin bei Kühlproblemen anfragen",
          "Ersatzteil: Wasserfilter, Magnetventil & Lüfter",
          "Geprüfte Kühl-Gefrierkombination mit Garantie anfragen",
        ],
      },
    ],
  },
  {
    id: "kochen",
    title: "Kochen, Backen und Lüften",
    shortTitle: "Kochen & Backen",
    description:
      "Mobiler Vor-Ort-Service für Backöfen und Herde, Original-Ersatzteile nach Typenschild sowie geprüfte Ersatzgeräte inkl. schriftlicher Verkäufergarantie.",
    devices: [
      {
        name: "Backöfen & Herde",
        description: "Vor-Ort-Service, passende Heizelemente & Schalter sowie geprüfte Backöfen mit Garantie.",
        iconName: "Flame",
        faults: [
          "Backofen wird nicht mehr richtig heiß (Vor-Ort-Termin)",
          "Ersatzteil: Heißluft-Ringheizkörper (2.000–2.400 W)",
          "Ersatzteil: Ober-/Unterhitze-Heizkörper & Thermostat",
          "Ersatzteil: Backofentürdichtung, Scharniere & Backblech",
          "Geprüften Ersatz-Backofen inkl. Garantie anfragen",
        ],
      },
      {
        name: "Elektroherde & Standherde",
        description: "Freistehende Herde, Herd-Sets und Original-Schalterelemente.",
        iconName: "Flame",
        faults: [
          "Vor-Ort-Termin oder Ersatzteil nach E-Nr. anfragen",
          "Ersatzteil: Energieregler & Backofenschalter",
          "Geprüftes Herd-Set inkl. schriftlicher Garantie anfragen",
        ],
      },
      {
        name: "Ceran- & Induktionskochfelder",
        description: "Glaskeramik- und Induktionsfelder sowie passende Ersatzteile.",
        iconName: "Zap",
        faults: [
          "Ersatzteil: Strahlungsheizkörper & Sensormodul",
          "Teile-Identifikation per E-Nr. vom Typenschild",
          "Geprüftes Ceran- / Induktionskochfeld anfragen",
        ],
      },
      {
        name: "Dunstabzugshauben",
        description: "Wand-, Insel- und Flachschirmhauben sowie Filter & Motoren.",
        iconName: "Fan",
        faults: [
          "Ersatzteil: Metallfettfilter & Aktivkohlefilter",
          "Ersatzteil: Gebläsemotor, Kondensator & Tastenfeld",
        ],
      },
      {
        name: "Mikrowellen",
        description: "Geprüfte Stand-Mikrowellen sowie Drehteller & Zubehörteile.",
        iconName: "Microwave",
        faults: [
          "Ersatzteil: Glasteller, Rollenring & Glimmerplatte",
          "Geprüftes Gerät unverbindlich anfragen",
        ],
      },
    ],
  },
  {
    id: "kaffee",
    title: "Kaffee und Kleingeräte",
    shortTitle: "Kaffee & Zubehör",
    description:
      "Original-Ersatzteile, Dichtungssätze und Brühgruppen für Kaffeemaschinen sowie geprüfte Geräte auf Anfrage.",
    devices: [
      {
        name: "Kaffeevollautomaten",
        description: "Ersatzteile für Jura, DeLonghi, Siemens, Miele, Philips u. v. m.",
        iconName: "Coffee",
        faults: [
          "Ersatzteil: Komplette Brühgruppe & O-Ring-Dichtungssatz",
          "Ersatzteil: Drainageventil, Wasserpumpe & Flowmeter",
          "Ersatzteil: Mahlwerkringe & Milchaufschäumer-Teile",
        ],
      },
      {
        name: "Siebträgermaschinen",
        description: "Dichtungen, Pumpen und Zubehör für Espressomaschinen.",
        iconName: "Coffee",
        faults: [
          "Ersatzteil: Siebträgerdichtung & Duschsieb",
          "Ersatzteil: Vibrationspumpe & Magnetventil",
        ],
      },
      {
        name: "Ausgewählte Kleingeräte",
        description: "Ersatzteile und Zubehör nach Typenschild-Abgleich.",
        iconName: "Sparkles",
        faults: [
          "Ersatzteil per Foto vom Typenschild anfragen",
          "Garantie-Anfrage für bei uns erworbene Geräte",
        ],
      },
    ],
  },
];

export const electronicsWorkshopCategory: ServiceCategory = {
  id: "elektronik",
  title: "Elektronikmodule & Schriftliche Verkäufergarantie",
  shortTitle: "Elektronik & Garantie",
  description:
    "Original-Steuerungsmodule & Elektronikbauteile nach Typenschild-Abgleich sowie voller Garantie- & Reparaturservice für alle direkt bei uns mit schriftlicher Verkäufergarantie erworbenen Geräte.",
  devices: [
    {
      name: "Steuerungsplatinen & Leistungsmodule",
      description: "Original-Steuermodule, Relais und elektronische Ersatzteile.",
      iconName: "Cpu",
      faults: [
        "Original-Steuerplatine per E-Nr. / PNC anfragen",
        "Relais, Netzteil-IC & elektronische Ersatzbauteile",
        "Garantieabwicklung für bei uns gekaufte Geräte",
      ],
    },
    {
      name: "Inverter- & Motorsteuerungen",
      description: "Original-Steuereinheiten für Motoren und Wärmepumpengeräte.",
      iconName: "Zap",
      faults: [
        "Passendes Inverter-Modul per Typenschild anfragen",
        "Kabelbaum, Stecker & Sensoreinheiten",
      ],
    },
    {
      name: "Display- & Bedienmodule",
      description: "Original-Tastenfelder, Programmwähler und Anzeigemodule.",
      iconName: "Layers",
      faults: [
        "Original-Bedienblende / Programmschalter anfragen",
        "Garantieabwicklung für bei uns erworbene Geräte",
      ],
    },
  ],
};
