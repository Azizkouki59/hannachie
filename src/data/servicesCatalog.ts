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
    description: "Reparatur von Waschmaschinen, Trocknern und Kombigeräten aller Marken.",
    devices: [
      {
        name: "Waschmaschinen",
        description: "Standgeräte, Einbaugeräte und Toplader.",
        iconName: "WashingMachine",
        faults: [
          "Pumpt das Wasser nicht ab",
          "Trommel dreht sich nicht oder schleudert nicht",
          "Wasser läuft aus dem Gerät aus",
          "Tür öffnet oder verriegelt nicht",
          "Fehlermeldung im Display",
        ],
      },
      {
        name: "Wäschetrockner",
        description: "Wärmepumpentrockner, Kondenstrockner und Ablufttrockner.",
        iconName: "Wind",
        faults: [
          "Wäsche wird nicht trocken",
          "Gerät heizt nicht mehr",
          "Trommel dreht sich nicht",
          "Wasserbehälter wird als voll angezeigt",
          "Ungewöhnlich laute Laufgeräusche",
        ],
      },
      {
        name: "Waschtrockner (2-in-1)",
        description: "Kombinierte Geräte zum Waschen und Trocknen.",
        iconName: "Layers",
        faults: [
          "Trockenfunktion heizt oder trocknet nicht",
          "Programm bricht während des Betriebs ab",
          "Gerät vibriert stark beim Schleudern",
          "Wasser läuft nicht vollständig ab",
        ],
      },
    ],
  },
  {
    id: "geschirr",
    title: "Geschirr spülen",
    shortTitle: "Geschirr spülen",
    description: "Reparatur von Spülmaschinen in privaten Küchen und Büros.",
    devices: [
      {
        name: "Geschirrspüler",
        description: "Einbau- und Stand-Spülmaschinen aller Hersteller.",
        iconName: "UtensilsCrossed",
        faults: [
          "Wasser läuft nicht ab",
          "Geschirr wird nicht sauber",
          "Wasser wird nicht warm",
          "Aquastop oder Schutzschalter löst aus",
          "Programm bricht vorzeitig ab",
        ],
      },
      {
        name: "Gewerbe- & Bürospülmaschinen",
        description: "Spülmaschinen für Teeküchen, Büros und Praxen.",
        iconName: "Zap",
        faults: [
          "Reinigungsmittel wird nicht dosiert",
          "Spüldruck ist zu niedrig",
          "Spülgang stoppt mit Fehlermeldung",
          "Wasser tritt an der Türdichtung aus",
        ],
      },
    ],
  },
  {
    id: "kuehlen",
    title: "Kühlen und Gefrieren",
    shortTitle: "Kühlen & Gefrieren",
    description: "Schneller Vor-Ort-Service für Kühl- und Gefriergeräte.",
    devices: [
      {
        name: "Kühlschränke",
        description: "Einbaukühlschränke und freistehende Geräte.",
        iconName: "Refrigerator",
        faults: [
          "Kühlt nicht mehr richtig",
          "Kompressor läuft ohne Pause durch",
          "Wasser sammelt sich im Innenraum",
          "Ungewöhnliche Brumm- oder Klopfgeräusche",
        ],
      },
      {
        name: "Gefrierschränke & Gefriertruhen",
        description: "Gefrierschränke und Tiefkühltruhen.",
        iconName: "Snowflake",
        faults: [
          "Temperaturalarm piept ständig",
          "Starke Vereisung trotz NoFrost",
          "Lüfter macht laute Geräusche",
          "Türdichtung schließt nicht dicht",
        ],
      },
      {
        name: "Side-by-Side Kühlschränke",
        description: "Große Doppeltür-Geräte und French-Door-Modelle.",
        iconName: "Layers",
        faults: [
          "Eiswürfelbereiter gibt kein Eis aus",
          "Gefrierteil kühlt nicht ausreichend",
          "Touch-Bedienfeld reagiert nicht",
          "Wasserspender tropft nach",
        ],
      },
    ],
  },
  {
    id: "kochen",
    title: "Kochen, Backen und Lüften",
    shortTitle: "Kochen & Backen",
    description: "Fachgerechte Reparatur für Backofen, Herd, Kochfeld und Dunstabzug.",
    devices: [
      {
        name: "Backöfen & Einbauöfen",
        description: "Umluft-, Heißluft- und Standard-Backöfen.",
        iconName: "Flame",
        faults: [
          "Ofen heizt nicht oder bleibt kalt",
          "Unterhitze oder Oberhitze ohne Funktion",
          "Umluftventilator dreht sich nicht",
          "Backofentür schließt nicht richtig",
        ],
      },
      {
        name: "Elektroherde & Standherde",
        description: "Freistehende Herde und Herd-Kombinationen.",
        iconName: "Flame",
        faults: [
          "Einzelne Kochplatte wird nicht warm",
          "Drehschalter lässt sich nicht regeln",
          "Uhr oder Timer blockiert den Herd",
          "Herd schaltet mitten im Betrieb ab",
        ],
      },
      {
        name: "Ceran- & Induktionskochfelder",
        description: "Glaskeramik- und moderne Induktionsfelder.",
        iconName: "Zap",
        faults: [
          "Touch-Bedienung reagiert nicht",
          "Fehlercode im Kochfeld-Display",
          "Kochzone schaltet mitten im Kochen ab",
          "Sicherung löst beim Einschalten aus",
        ],
      },
      {
        name: "Dunstabzugshauben",
        description: "Wand-, Insel- und Unterbauhauben.",
        iconName: "Fan",
        faults: [
          "Lüftermotor läuft nicht oder brummt",
          "Beleuchtung funktioniert nicht",
          "Lüfterstufen lassen sich nicht schalten",
          "Sehr laute Betriebsgeräusche",
        ],
      },
      {
        name: "Mikrowellen",
        description: "Einbau- und Stand-Mikrowellengeräte.",
        iconName: "Microwave",
        faults: [
          "Speisen werden nicht heiß",
          "Drehteller dreht sich nicht",
          "Gerät schaltet sofort wieder ab",
          "Display oder Timer defekt",
        ],
      },
    ],
  },
  {
    id: "kaffee",
    title: "Kaffee und Kleingeräte",
    shortTitle: "Kaffee & Kleingeräte",
    description: "Wartung und Reparatur für Kaffeemaschinen und ausgewählte Geräte.",
    devices: [
      {
        name: "Kaffeevollautomaten",
        description: "Jura, DeLonghi, Siemens, Miele, Philips und weitere.",
        iconName: "Coffee",
        faults: [
          "Brühgruppe klemmt oder quietscht",
          "Wasser läuft unter der Maschine aus",
          "Mahlwerk mahlt nicht oder blockiert",
          "Kaffee tropft nur sehr langsam heraus",
          "Fehlermeldung im Display",
        ],
      },
      {
        name: "Siebträgermaschinen",
        description: "Espressomaschinen für Haushalt und Büro.",
        iconName: "Coffee",
        faults: [
          "Baut keinen Druck auf",
          "Dampfventil tropft oder schließt nicht",
          "Wasser wird nicht heiß genug",
        ],
      },
      {
        name: "Ausgewählte Kleingeräte",
        description: "Bügelstationen, Staubsauger und Küchenmaschinen auf Anfrage.",
        iconName: "Sparkles",
        faults: [
          "Gerät lässt sich nicht einschalten",
          "Motor überhitzt oder riecht verbrannt",
          "Elektrischer oder mechanischer Defekt",
        ],
      },
    ],
  },
];

export const electronicsWorkshopCategory: ServiceCategory = {
  id: "elektronik",
  title: "Meisterwerkstatt: Platinen- & Elektronikreparatur",
  shortTitle: "Elektronikreparatur",
  description: "Reparatur auf Bauteilebene statt eines teuren Austauschs der gesamten Platine.",
  devices: [
    {
      name: "Steuerungsplatinen",
      description: "Instandsetzung von Relais, Netzteilen und Kondensatoren.",
      iconName: "Cpu",
      faults: [
        "Gerät zeigt keine Reaktion (komplett tot)",
        "Relais klickt nur noch",
        "Kurzschluss auf der Platine",
      ],
    },
    {
      name: "Inverter- & Motorsteuerungen",
      description: "Elektronik für bürstenlose Motoren und Wärmepumpen.",
      iconName: "Zap",
      faults: [
        "Motor dreht sich nicht oder ruckelt",
        "Drehzahlfehler im Betrieb",
        "Inverter-Fehlermeldung im Display",
      ],
    },
    {
      name: "Display- & Bedienmodule",
      description: "Tastenfelder, Drehschalter und Touch-Displays.",
      iconName: "Layers",
      faults: [
        "Tasten oder Touch ohne Funktion",
        "Display flackert oder bleibt dunkel",
        "Programme lassen sich nicht wählen",
      ],
    },
  ],
};

