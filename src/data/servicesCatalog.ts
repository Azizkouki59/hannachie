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
      "Persönliche Fachberatung, Original-Ersatzteile nach Typenschild & ausgewählte Markengeräte auf Anfrage.",
    devices: [
      {
        name: "Waschmaschinen",
        description: "Fachberatung, Original-Ersatzteile aller Marken & ausgewählte Frontlader / Toplader auf Anfrage.",
        iconName: "WashingMachine",
        faults: [
          "Ersatzteil: Laugenpumpe / Ablaufpumpe (nach E-Nr.)",
          "Ersatzteil: Türmanschette / Bullaugendichtung",
          "Ersatzteil: Heizstab, NTC-Fühler & Motorkohlen",
          "Ersatzteil: Stoßdämpfer, Türschloss & Keilriemen",
          "Ausgewählte Marken-Waschmaschine auf Anfrage",
        ],
      },
      {
        name: "Wäschetrockner",
        description: "Original-Ersatzteile für Wärmepumpen- & Kondenstrockner sowie ausgewählte Geräte auf Anfrage.",
        iconName: "Wind",
        faults: [
          "Ersatzteil: Kondensatpumpe & Schwimmerschalter",
          "Ersatzteil: Temperatursensor (NTC) & Heizelement",
          "Ersatzteil: Antriebsriemen, Spannrolle & Flusensieb",
          "Ersatzteil: Türschloss & Anlaufkondensator",
          "Ausgewählten Marken-Trockner auf Anfrage",
        ],
      },
      {
        name: "Waschtrockner (2-in-1)",
        description: "Persönliche Beratung, Original-Ersatzteile nach E-Nr. & ausgewählte Geräte auf Anfrage.",
        iconName: "Layers",
        faults: [
          "Ersatzteil-Identifikation nach Typenschild (E-Nr.)",
          "Ersatzteil: Ablaufpumpe & Magnetventil",
          "Ersatzteil: Stoßdämpfer & Türverriegelung",
          "Ausgewählten Waschtrockner auf Anfrage",
        ],
      },
    ],
  },
  {
    id: "geschirr",
    title: "Geschirr spülen",
    shortTitle: "Geschirr spülen",
    description:
      "Fachberatung, Original-Ersatzteile nach Typenschild & ausgewählte Geschirrspüler (45 / 60 cm) auf Anfrage.",
    devices: [
      {
        name: "Geschirrspüler",
        description: "Original-Ersatzteile & ausgewählte Unterbau-, Einbau- und Stand-Spülmaschinen auf Anfrage.",
        iconName: "UtensilsCrossed",
        faults: [
          "Ersatzteil: Heizpumpe / Umwälzpumpe (nach E-Nr.)",
          "Ersatzteil: Aquastop-Zulaufschlauch & Ablaufpumpe",
          "Ersatzteil: Geschirrkorb-Rollen, Sprüharme & Türdichtung",
          "Ersatzteil: Dosierkammer & Sieb-Einheit",
          "Ausgewählten Geschirrspüler (45/60 cm) auf Anfrage",
        ],
      },
      {
        name: "Büro- & Kleingewerbespüler",
        description: "Original-Ersatzteile & persönliche Beratung für Teeküchen, Büros und Praxen.",
        iconName: "Zap",
        faults: [
          "Ersatzteil-Anfrage nach Typenschild (E-Nr.)",
          "Ersatzteil: Dosierkammer, Dichtungen & Ablaufpumpe",
          "Ausgewähltes Markengerät auf Anfrage",
        ],
      },
    ],
  },
  {
    id: "kuehlen",
    title: "Kühlen und Gefrieren",
    shortTitle: "Kühlen & Gefrieren",
    description:
      "Original-Ersatzteile & Zubehör nach E-Nr. sowie ausgewählte Kühl- und Gefriergeräte auf Anfrage.",
    devices: [
      {
        name: "Kühlschränke",
        description: "Original-Ersatzteile, Zubehör & ausgewählte Stand- / Unterbaukühlschränke auf Anfrage.",
        iconName: "Refrigerator",
        faults: [
          "Ersatzteil: Thermostat & NTC-Temperaturfühler",
          "Ersatzteil: Magnet-Türdichtung & Schleppscharnier",
          "Zubehör: Glasplatten, Gemüseschubladen & Türfächer",
          "Ausgewählten Marken-Kühlschrank auf Anfrage",
        ],
      },
      {
        name: "Gefrierschränke & Gefriertruhen",
        description: "Original-Ersatzteile & ausgewählte NoFrost-Gefrierschränke auf Anfrage.",
        iconName: "Snowflake",
        faults: [
          "Ersatzteil: Umluftventilator & Abtauheizung",
          "Ersatzteil: Startrelais & Klixon",
          "Zubehör: Gefrierschubladen & Gefrierfachklappen",
          "Ausgewählten Gefrierschrank auf Anfrage",
        ],
      },
      {
        name: "Side-by-Side & Kühl-Gefrierkombis",
        description: "Original-Wasserfilter, Dichtungen & ausgewählte Kühl-Gefrierkombis auf Anfrage.",
        iconName: "Layers",
        faults: [
          "Ersatzteil: Wasserfilter, Magnetventil & Lüfter",
          "Ersatzteil: Türdichtungen & Innenausstattung",
          "Ausgewählte Kühl-Gefrierkombination auf Anfrage",
        ],
      },
    ],
  },
  {
    id: "kochen",
    title: "Kochen, Backen und Lüften",
    shortTitle: "Kochen & Backen",
    description:
      "Original-Ersatzteile nach Typenschild & ausgewählte Backöfen, Herde und Kochfelder auf Anfrage.",
    devices: [
      {
        name: "Backöfen & Herde",
        description: "Original-Heizelemente, Schalter & Zubehör sowie ausgewählte Backöfen auf Anfrage.",
        iconName: "Flame",
        faults: [
          "Ersatzteil: Heißluft-Ringheizkörper",
          "Ersatzteil: Ober-/Unterhitze-Heizkörper & Thermostat",
          "Ersatzteil: Backofentürdichtung & Türscharniere",
          "Zubehör: Backbleche, Kombiroste & Knöpfe",
          "Ausgewählten Marken-Backofen auf Anfrage",
        ],
      },
      {
        name: "Elektroherde & Standherde",
        description: "Original-Schalterelemente, Dichtungen & ausgewählte Standherde auf Anfrage.",
        iconName: "Flame",
        faults: [
          "Ersatzteil-Identifikation nach Typenschild (E-Nr.)",
          "Ersatzteil: Energieregler & Backofenschalter",
          "Ausgewähltes Herd-Set auf Anfrage",
        ],
      },
      {
        name: "Ceran- & Induktionskochfelder",
        description: "Original-Ersatzteile nach Typenschild & ausgewählte Kochfelder auf Anfrage.",
        iconName: "Zap",
        faults: [
          "Ersatzteil: Strahlungsheizkörper & Sensormodul",
          "Teile-Identifikation per E-Nr. vom Typenschild",
          "Ausgewähltes Ceran- / Induktionskochfeld auf Anfrage",
        ],
      },
      {
        name: "Dunstabzugshauben",
        description: "Original-Filter, Gebläseteile & Zubehör für Wand-, Insel- und Flachschirmhauben.",
        iconName: "Fan",
        faults: [
          "Zubehör: Metallfettfilter & Aktivkohlefilter",
          "Ersatzteil: Gebläsemotor, Kondensator & Tastenfeld",
        ],
      },
      {
        name: "Mikrowellen",
        description: "Drehteller, Original-Zubehör & ausgewählte Standgeräte auf Anfrage.",
        iconName: "Microwave",
        faults: [
          "Ersatzteil: Glasteller, Rollenring & Glimmerplatte",
          "Ausgewähltes Standgerät auf Anfrage",
        ],
      },
    ],
  },
  {
    id: "kaffee",
    title: "Kaffee und Kleingeräte",
    shortTitle: "Kaffee & Zubehör",
    description:
      "Original-Ersatzteile, Dichtungssätze & Brühgruppen nach Modellnummer sowie ausgewählte Geräte auf Anfrage.",
    devices: [
      {
        name: "Kaffeevollautomaten",
        description: "Original-Ersatzteile für Jura, DeLonghi, Siemens, Miele, Philips u. v. m.",
        iconName: "Coffee",
        faults: [
          "Ersatzteil: Komplette Brühgruppe & O-Ring-Dichtungssatz",
          "Ersatzteil: Drainageventil, Wasserpumpe & Flowmeter",
          "Ersatzteil: Mahlwerkringe & Milchaufschäumer-Teile",
        ],
      },
      {
        name: "Siebträgermaschinen",
        description: "Original-Dichtungen, Pumpen und passendes Zubehör nach Modellnummer.",
        iconName: "Coffee",
        faults: [
          "Ersatzteil: Siebträgerdichtung & Duschsieb",
          "Ersatzteil: Vibrationspumpe & Magnetventil",
        ],
      },
      {
        name: "Ausgewählte Kleingeräte",
        description: "Original-Ersatzteile und Zubehör nach Typenschild-Abgleich.",
        iconName: "Sparkles",
        faults: [
          "Ersatzteil per Foto vom Typenschild anfragen",
          "Garantie-Anfrage für direkt bei Hannachi erworbene Geräte",
        ],
      },
    ],
  },
];

export const electronicsWorkshopCategory: ServiceCategory = {
  id: "elektronik",
  title: "Ersatzmodule & Verkäufergarantie",
  shortTitle: "Module & Garantie",
  description:
    "Original-Ersatzmodule nach Typenschild sowie Garantieabwicklung für direkt bei Hannachi erworbene Geräte.",
  devices: [
    {
      name: "Steuerungs- & Leistungsmodule",
      description: "Original-Ersatzmodule und elektronische Ersatzteile passend nach Typenschild.",
      iconName: "Cpu",
      faults: [
        "Original-Ersatzmodul nach Typenschild anfragen",
        "Relais & elektronische Ersatzbauteile",
        "Garantieabwicklung für direkt bei Hannachi erworbene Geräte",
      ],
    },
    {
      name: "Inverter- & Motorsteuerungen",
      description: "Original-Steuereinheiten für Motoren und Wärmepumpengeräte nach Typenschild.",
      iconName: "Zap",
      faults: [
        "Passendes Inverter-Modul per Typenschild anfragen",
        "Kabelbaum, Stecker & Sensoreinheiten",
      ],
    },
    {
      name: "Display- & Bedienblenden",
      description: "Original-Tastenfelder, Programmwähler und Anzeigemodule.",
      iconName: "Layers",
      faults: [
        "Original-Bedieneinheit / Programmschalter anfragen",
        "Garantieabwicklung für direkt bei Hannachi erworbene Geräte",
      ],
    },
  ],
};
