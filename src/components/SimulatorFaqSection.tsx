"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  CheckCircle2,
  HelpCircle,
  Search,
  Sparkles,
  Wrench,
  Lightbulb,
  X,
} from "lucide-react";
import { useQuickRequest } from "@/components/QuickRequestSheet";

type FaqCategory =
  | "Alle"
  | "Waschmaschine & Trockner"
  | "Geschirrspüler"
  | "Kühlschrank"
  | "Backofen & Allgemein";

interface TroubleshootingFaqItem {
  id: string;
  category: Exclude<FaqCategory, "Alle">;
  device: string;
  symptomPreset: string;
  question: string;
  shortAnswer: string;
  steps: string[];
  proTip: string;
  keywords: string[];
}

const TROUBLESHOOTING_FAQS: TroubleshootingFaqItem[] = [
  {
    id: "faq-wm-drain",
    category: "Waschmaschine & Trockner",
    device: "Waschmaschine",
    symptomPreset: "Pumpt nicht ab / Fehler E18 / F20 (Flusensieb bereits geprüft)",
    question:
      "Waschmaschine zeigt Fehler E18 / F20 oder pumpt nicht ab – was kann ich vorab selbst prüfen?",
    shortAnswer:
      "In rund 60 % der Fälle blockiert ein Fremdkörper (Münze, Knopf, BH-Bügel oder Flusen) das Flusensieb oder den Siphonanschluss – kein Pumpendefekt.",
    steps: [
      "Netzstecker ziehen und unten an der Front die Wartungsklappe öffnen.",
      "Restwasser über den kleinen Not-Ablassschlauch in eine flache Schale ablassen.",
      "Flusensieb gegen den Uhrzeigersinn herausdrehen, reinigen und prüfen, ob sich das Flügelrad der Laugenpumpe dahinter frei mit dem Finger drehen lässt.",
      "Ablaufschlauch an der Rückseite auf Knicke sowie den Siphonanschluss unter dem Waschbecken auf Verstopfung prüfen.",
    ],
    proTip:
      "Lässt sich das Pumpenrad frei drehen und das Sieb ist sauber, brummt die Pumpe aber nur leise, ist häufig eine neue Laugenpumpe (im Teileverkauf nach E-Nr.) oder der Werkskundendienst sinnvoll.",
    keywords: ["e18", "f20", "pumpt nicht", "wasser", "flusensieb", "waschmaschine"],
  },
  {
    id: "faq-wm-door",
    category: "Waschmaschine & Trockner",
    device: "Waschmaschine",
    symptomPreset: "Tür lässt sich nicht öffnen / Türverriegelung blockiert",
    question:
      "Die Waschmaschinentür lässt sich nach dem Waschen nicht öffnen – wie entriegele ich sie sicher?",
    shortAnswer:
      "Das Bimetall-Türschloss benötigt nach Programmende oft 2 bis 3 Minuten zum Abkühlen. Zudem bleibt die Tür gesperrt, solange noch Restwasser in der Trommel steht.",
    steps: [
      "Prüfen Sie durch das Bullauge, ob noch Wasser in der Trommel steht (falls ja: Programm „Abpumpen“ starten oder über das Flusensieb entleeren).",
      "Gerät ausschalten und 3 Minuten warten, bis das elektronische Türschloss hörbar klickt.",
      "Öffnet die Tür weiterhin nicht: Wartungsklappe unten öffnen und vorsichtig an der farbigen Notentriegelungslasche neben dem Flusensieb nach unten ziehen.",
    ],
    proTip:
      "Ziehen Sie niemals mit Gewalt am Türgriff – ein abgebrochener Griff oder ein defektes Türschloss lässt sich sonst nur schwer öffnen.",
    keywords: ["tür", "öffnet nicht", "schloss", "notentriegelung", "bullauge"],
  },
  {
    id: "faq-gs-codes",
    category: "Geschirrspüler",
    device: "Geschirrspüler",
    symptomPreset: "Fehlercode E15 / E24 oder Wasserhahn-Symbol blinkt",
    question:
      "Geschirrspüler zeigt das Wasserhahn-Symbol oder Fehler E24 / E15 – was bedeuten diese Meldungen?",
    shortAnswer:
      "E24 weist meist auf einen blockierten Abfluss oder eine nicht eingerastete Pumpenabdeckung hin. E15 bedeutet hingegen, dass sich Wasser in der Bodenwanne gesammelt hat.",
    steps: [
      "Bei E24 / Abpump-Fehler: Bodensieb herausnehmen und prüfen, ob die kleine weiße Pumpenabdeckung im Pumpensumpf hörbar („Klick“) eingerastet ist.",
      "Bei blinkendem Wasserhahn-Symbol: Eckventil unter der Spüle voll aufdrehen und das feine Schmutzsieb im Aquastop-Schlauchanschluss unter fließendem Wasser abspülen.",
      "Bei E15: Der Schwimmerschalter in der Bodenwanne hat ausgelöst – Wasserhahn schließen und Gerät nicht einfach schräg kippen, da sonst Elektronikteile nass werden können.",
    ],
    proTip:
      "Bei Fehler E15 ist häufig die Pumpentopf-Dichtung undicht. Anhand Ihres Typenschilds (E-Nr.) nennen wir Ihnen gerne den passenden Dichtungssatz aus unserem Ersatzteil-Sortiment (reiner Teileverkauf).",
    keywords: ["e15", "e24", "wasserhahn", "aquastop", "geschirrspüler", "spülmaschine"],
  },
  {
    id: "faq-gs-drying",
    category: "Geschirrspüler",
    device: "Geschirrspüler",
    symptomPreset: "Geschirr bleibt nass / Wasser wird nicht warm",
    question:
      "Geschirrspüler reinigt unsauber oder trocknet nicht mehr richtig – wie unterscheide ich Pflege- von Heizfehlern?",
    shortAnswer:
      "Bleibt das Geschirr am Ende kalt und nass, heizt das Gerät nicht. Ist das Innere heiß, aber schlierig, liegt es meist an verstopften Sprüharmen oder fehlendem Klarspüler.",
    steps: [
      "Öffnen Sie die Tür vorsichtig ca. 30 Minuten nach Programmstart: Ist das Wasser im Innenraum warm oder komplett kalt?",
      "Ist das Wasser warm: Beide Sprüharme abnehmen, verkalkte Düsen mit einem Zahnstocher freistechen sowie Klarspüler und Regeneriersalz nachfüllen.",
      "Bleibt das Wasser kalt (oft begleitet von Fehler E09 bei Bosch/Siemens/Neff): Die Heizpumpe oder das Heizrelais ist defekt.",
    ],
    proTip:
      "Verwenden Sie im Eco-Programm zusätzlich separaten Klarspüler und Salz statt nur Multi-Tabs – das verbessert die Trocknung spürbar.",
    keywords: ["trocknet nicht", "e09", "kalt", "heizpumpe", "sprüharme", "salz"],
  },
  {
    id: "faq-ks-water-ice",
    category: "Kühlschrank",
    device: "Kühlschrank / Gefriergerät",
    symptomPreset: "Wasser im Innenraum oder starke Eisbildung trotz freiem Ablauf",
    question:
      "Im Kühlschrank sammelt sich Wasser unter dem Gemüsefach oder die Rückwand vereist stark – warum?",
    shortAnswer:
      "Steht Wasser im Kühlteil, ist fast immer die kleine Tauwasser-Ablaufrinne an der Rückwand verstopft. Starke Eisbildung entsteht oft durch eine undichte Türdichtung.",
    steps: [
      "Suchen Sie an der inneren Rückwand (direkt über dem Gemüsefach) die schmale Ablaufrinne mit dem kleinen Loch in der Mitte.",
      "Reinigen Sie die Öffnung vorsichtig mit einem Wattestäbchen oder warmem Wasser, bis das Tauwasser wieder frei nach hinten ablaufen kann.",
      "Klemmen Sie ein Blatt Papier in die geschlossene Türdichtung: Lässt es sich ohne Widerstand herausziehen, strömt feuchte Raumluft ein und gefriert an der Rückwand.",
    ],
    proTip:
      "Läuft der Kompressor dauerhaft durch oder kühlt das Gerät nicht mehr, liefern wir Ihnen auf Wunsch das passende Thermostat- bzw. NTC-Fühler-Ersatzteil nach Typenschild oder beraten Sie zu einem geprüften Ersatzgerät mit Garantie.",
    keywords: ["kühlschrank", "wasser", "gemüsefach", "eis", "abtauen", "dichtung"],
  },
  {
    id: "faq-bo-clock-fuse",
    category: "Backofen & Allgemein",
    device: "Backofen / Herd",
    symptomPreset: "Backofen heizt nicht (Uhrzeit & Sicherungen bereits geprüft)",
    question:
      "Der Backofen leuchtet, wird aber überhaupt nicht warm – welche zwei Ursachen lassen sich sofort testen?",
    shortAnswer:
      "Nach einem kurzen Stromausfall sperrt die Elektronik die Heizung, solange die Uhrzeit blinkt. Alternativ ist im Sicherungskasten nur eine der drei Herd-Phasen ausgelöst.",
    steps: [
      "Blicken Sie auf das Display am Backofen: Blinkt dort „00:00“ oder ein Uhrsymbol? Stellen Sie die Uhrzeit ein – erst danach schaltet das Freigaberelais die Heizstäbe frei.",
      "Prüfen Sie im Sicherungskasten alle drei nebeneinanderliegenden Herd-Sicherungen (LS-Schalter): Oft versorgt eine Phase das Licht, während die anderen beiden die Heizung speisen.",
      "Testen Sie kurz Ober-/Unterhitze im Vergleich zu Umluft: Wird Ober-/Unterhitze warm, Umluft aber nicht, ist lediglich der Ringheizkörper durchgebrannt.",
    ],
    proTip:
      "Passende Original-Ringheizkörper für Umluft/Heißluft liefern wir Ihnen anhand Ihrer E-Nr. im reinen Teileverkauf (Montage/Anschluss bitte nur durch einen zugelassenen Fachbetrieb).",
    keywords: ["backofen", "herd", "heizt nicht", "uhrzeit", "sicherung", "umluft", "ringheizkörper"],
  },
  {
    id: "faq-dryer-container",
    category: "Waschmaschine & Trockner",
    device: "Wäschetrockner",
    symptomPreset: "Trockner bricht ab / meldet Behälter voll obwohl Tank leer ist",
    question:
      "Wäschetrockner bricht ab und meldet „Behälter voll“, obwohl der Wassertank leer ist – woran liegt das?",
    shortAnswer:
      "Flusen setzen mit der Zeit den Pumpensumpf der Kondensatpumpe zu, sodass der Schwimmerschalter unten im Gerät „Voll“ meldet, bevor das Wasser oben im Tank ankommt.",
    steps: [
      "Flusensiebe in der Türöffnung herausnehmen und unter warmem Wasser mit einer weichen Bürste abwaschen (Weichspülerreste machen das Sieb wasserundurchlässig).",
      "Unten am Wärmetauscher / Kondensator die Klappe öffnen und Flusen vorsichtig von den Lamellen entfernen.",
      "Feuchtigkeitssensor-Metallstreifen im Inneren der Trommel (direkt hinter dem Türsieb) mit einem Essig-Tuch von Kalkbelägen befreien.",
    ],
    proTip:
      "Benötigen Sie für Ihren Trockner eine neue Kondensatpumpe, ein Türschloss oder ein Flusensieb? Anhand des Typenschilds (E-Nr.) liefern wir Ihnen das passende Originalteil (reiner Teileverkauf).",
    keywords: ["trockner", "behälter voll", "trocknet nicht", "wärmepumpe", "kondensator"],
  },
  {
    id: "faq-when-technician",
    category: "Backofen & Allgemein",
    device: "Waschmaschine",
    symptomPreset: "Ersatzteil-Anfrage / Geprüftes Ersatzgerät mit Garantie",
    question:
      "Wann sollte ich keine eigenen Versuche mehr unternehmen und eher über ein Ersatzgerät nachdenken?",
    shortAnswer:
      "Sobald die Sicherung / der FI-Schutzschalter auslöst, es verschmort riecht, laute Mahlgeräusche auftreten oder Wasser aus dem Geräteboden austritt.",
    proTip:
      "Für ältere oder stärker beschädigte Geräte kann ein geprüftes Ersatzgerät aus unserem Bestand – inklusive schriftlicher Verkäufergarantie – wirtschaftlicher sein als eine Fremdreparatur.",
    steps: [
      "FI-Schutzschalter fliegt heraus: Meist liegt ein Isolationsfehler am Heizstab oder Motor vor – Gerät ausgesteckt lassen.",
      "Lautes Rumpeln beim Schleudern oder metallisches Schleifen: Hinweis auf Trommellager, Stoßdämpfer oder einen eingezogenen Fremdkörper.",
      "Elektronik-Totalausfall: Lassen Sie defekte Starkstrom- oder Elektronikkomponenten ausschließlich durch den Hersteller-Kundendienst oder einen eingetragenen Handwerksbetrieb begutachten – alternativ bieten wir Ihnen ein geprüftes Ersatzgerät mit Garantie.",
    ],
    keywords: ["fi", "kurzschluss", "platine", "lager", "laut", "techniker", "kosten"],
  },
];

const CATEGORIES: FaqCategory[] = [
  "Alle",
  "Waschmaschine & Trockner",
  "Geschirrspüler",
  "Kühlschrank",
  "Backofen & Allgemein",
];

export default function SimulatorFaqSection() {
  const { openQuickRequest } = useQuickRequest();
  const [selectedCategory, setSelectedCategory] = useState<FaqCategory>("Alle");
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaqId, setOpenFaqId] = useState<string | null>(TROUBLESHOOTING_FAQS[0].id);
  const [resolvedIds, setResolvedIds] = useState<Record<string, boolean>>({});

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return TROUBLESHOOTING_FAQS.filter((item) => {
      const matchesCat =
        selectedCategory === "Alle" || item.category === selectedCategory;
      if (!matchesCat) return false;
      if (!q) return true;
      return (
        item.question.toLowerCase().includes(q) ||
        item.shortAnswer.toLowerCase().includes(q) ||
        item.device.toLowerCase().includes(q) ||
        item.keywords.some((kw) => kw.includes(q))
      );
    });
  }, [selectedCategory, searchQuery]);

  return (
    <section
      id="haeufige-fragen-fehlerbehebung"
      aria-labelledby="simulator-faq-heading"
      data-testid="simulator-faq-section"
      className="py-12 sm:py-20 bg-surface border-t border-primary/8 dark:border-white/10"
    >
      <div className="container-page">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-accent dark:text-accent-light mb-3">
            <HelpCircle size={13} aria-hidden="true" />
            <span>Häufige Fragen zur Selbsthilfe · FAQ</span>
          </div>
          <h2
            id="simulator-faq-heading"
            className="text-2xl font-extrabold text-primary dark:text-slate-100 sm:text-4xl"
          >
            Häufig gestellte Fragen zur Selbsthilfe &amp; Ersatzteilwahl
          </h2>
          <p className="mt-3 text-sm sm:text-base text-ink-muted leading-relaxed">
            Viele typische Fehlermeldungen (wie <strong className="text-primary dark:text-slate-200">E18, E24, blinkende Uhrzeit</strong> oder blockierte Türen) lassen sich ohne Werkzeug selbst lösen. Prüfen Sie hier die häufigsten Fälle zur Selbsthilfe:
          </p>
        </div>

        {/* Filter Bar: Search Input + Category Tabs */}
        <div className="mt-8 mx-auto max-w-4xl space-y-4">
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Fehlercode oder Frage suchen (z. B. E18, E24, Tür öffnet nicht, heizt nicht)..."
              aria-label="Häufige Fragen durchsuchen"
              className="w-full rounded-2xl border border-primary/12 dark:border-white/15 bg-white dark:bg-slate-900 pl-11 pr-10 py-3.5 text-xs sm:text-sm text-primary dark:text-slate-100 placeholder:text-ink-faint focus:border-accent focus:outline-none shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Suche löschen"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-ink-muted hover:text-primary dark:hover:text-white cursor-pointer"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div
            role="tablist"
            aria-label="FAQ nach Gerätetyp filtern"
            className="flex flex-wrap items-center justify-center gap-2"
          >
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? "border-accent bg-accent text-white shadow-xs"
                      : "border-primary/10 dark:border-white/12 bg-white dark:bg-slate-900 text-primary dark:text-slate-200 hover:border-accent/50"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Accordion List */}
        <div className="mt-8 mx-auto max-w-4xl space-y-3.5">
          {filteredFaqs.length === 0 ? (
            <div className="rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 p-8 text-center">
              <p className="text-sm font-bold text-primary dark:text-slate-100">
                Keine passende Frage für „{searchQuery}“ gefunden.
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                Stellen Sie Ihre Frage direkt unverbindlich an Herrn Hannachi oder setzen Sie den Filter zurück.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("Alle");
                  }}
                  className="rounded-xl border border-primary/15 dark:border-white/15 px-4 py-2 text-xs font-bold text-primary dark:text-slate-200 hover:border-accent cursor-pointer"
                >
                  Alle Fragen anzeigen
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openQuickRequest("Waschmaschine", searchQuery, "", "question")
                  }
                  className="rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white hover:bg-accent-dark cursor-pointer"
                >
                  Direkte Frage stellen →
                </button>
              </div>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              const isResolved = Boolean(resolvedIds[faq.id]);

              return (
                <div
                  key={faq.id}
                  className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
                    isOpen
                      ? "border-accent/45 bg-white dark:bg-slate-900 shadow-card"
                      : "border-primary/10 dark:border-white/10 bg-white/90 dark:bg-slate-900/80 hover:border-accent/35"
                  }`}
                >
                  <h3>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenFaqId((prev) => (prev === faq.id ? null : faq.id))
                      }
                      aria-expanded={isOpen}
                      className="flex w-full items-start justify-between gap-4 p-4 sm:p-5 text-left cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="inline-flex items-center rounded-md bg-accent/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-accent dark:text-accent-light">
                            {faq.device}
                          </span>
                          {isResolved && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300">
                              <CheckCircle2 size={11} />
                              Selbst gelöst
                            </span>
                          )}
                        </div>
                        <span className="block text-sm sm:text-base font-extrabold text-primary dark:text-slate-100 leading-snug">
                          {faq.question}
                        </span>
                      </div>
                      <span
                        className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-transform duration-200 ${
                          isOpen
                            ? "rotate-180 border-accent bg-accent text-white"
                            : "border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-800 text-ink-muted"
                        }`}
                        aria-hidden="true"
                      >
                        <ChevronDown size={16} />
                      </span>
                    </button>
                  </h3>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key={`content-${faq.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-primary/8 dark:border-white/10 px-4 pb-5 pt-4 sm:px-5 space-y-4">
                          <p className="text-xs sm:text-sm font-semibold text-primary dark:text-slate-200 leading-relaxed">
                            {faq.shortAnswer}
                          </p>

                          <div className="rounded-xl bg-surface dark:bg-slate-800/70 p-3.5 sm:p-4">
                            <p className="text-[11px] font-extrabold uppercase tracking-wider text-accent dark:text-accent-light mb-2.5">
                              Empfohlene Prüfschritte vor einer Anfrage:
                            </p>
                            <ol className="space-y-2">
                              {faq.steps.map((step, i) => (
                                <li
                                  key={step}
                                  className="flex items-start gap-2.5 text-xs sm:text-[13px] text-ink-muted dark:text-slate-300 leading-relaxed"
                                >
                                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-accent/15 text-[11px] font-extrabold text-accent dark:text-accent-light tabular-nums">
                                    {i + 1}
                                  </span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>

                          <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-950 dark:text-amber-200">
                            <Lightbulb
                              size={16}
                              className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
                              aria-hidden="true"
                            />
                            <p className="leading-relaxed">
                              <strong className="font-bold">Hinweis von Herrn Hannachi:</strong>{" "}
                              {faq.proTip}
                            </p>
                          </div>

                          {/* Self-Resolution vs. Pre-Filled Request Hand-off */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-primary/8 dark:border-white/10">
                            <span className="text-xs font-bold text-ink-muted">
                              Hat diese Anleitung Ihr Problem bereits gelöst?
                            </span>
                            <div className="flex flex-col min-[440px]:flex-row items-stretch min-[440px]:items-center gap-2 w-full sm:w-auto">
                              <button
                                type="button"
                                onClick={() =>
                                  setResolvedIds((prev) => ({
                                    ...prev,
                                    [faq.id]: !prev[faq.id],
                                  }))
                                }
                                className={`inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer ${
                                  isResolved
                                    ? "border-emerald-600 bg-emerald-600 text-white"
                                    : "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white"
                                }`}
                              >
                                <CheckCircle2 size={14} className="shrink-0" />
                                <span>
                                  {isResolved
                                    ? "Problem gelöst ✓"
                                    : "Ja, funktioniert wieder"}
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  openQuickRequest(
                                    faq.device,
                                    faq.symptomPreset,
                                    "",
                                    "repair"
                                  )
                                }
                                className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-xs font-bold text-white hover:bg-accent-dark transition-colors cursor-pointer"
                              >
                                <Wrench size={13} className="shrink-0" />
                                <span>Nein, Ersatzteil / Beratung anfragen →</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Banner for Unresolved Cases */}
        <div className="mt-8 mx-auto max-w-4xl rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Sparkles size={18} />
            </span>
            <div>
              <p className="text-xs sm:text-sm font-extrabold text-primary dark:text-slate-100">
                Ihr Fehlercode ist nicht dabei oder die Schritte haben nicht geholfen?
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">
                Übernehmen Sie Ihre Angaben direkt ins Formular für das passende Original-Ersatzteil oder ein geprüftes Ersatzgerät.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              openQuickRequest(
                "Waschmaschine",
                "Selbsthilfe geprüft – Anfrage nach Ersatzteil (E-Nr.) oder Ersatzgerät mit Garantie",
                "",
                "repair"
              )
            }
            className="inline-flex min-h-[42px] shrink-0 items-center justify-center gap-2 rounded-xl bg-primary dark:bg-accent px-4 py-2.5 text-xs font-extrabold text-white hover:opacity-95 transition-opacity cursor-pointer whitespace-nowrap"
          >
            <span>Geprüfte Anfrage senden</span>
          </button>
        </div>
      </div>
    </section>
  );
}
