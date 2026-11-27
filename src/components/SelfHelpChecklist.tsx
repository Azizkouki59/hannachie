"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Droplets,
  Flame,
  Info,
  RotateCcw,
  RotateCw,
  ShieldAlert,
  Snowflake,
  Sparkles,
  PackageSearch,
} from "lucide-react";
import { useQuickRequest } from "@/components/QuickRequestSheet";

type ApplianceKey =
  | "Waschmaschine"
  | "Geschirrspüler"
  | "Kühlschrank / Gefriergerät"
  | "Backofen / Herd";

type ChecklistItem = {
  id: string;
  title: string;
  description: string;
  duration: string;
  hint: string;
};

type ApplianceChecklistGroup = {
  key: ApplianceKey;
  label: string;
  icon: typeof PackageSearch;
  items: ChecklistItem[];
};

const CHECKLIST_GROUPS: ApplianceChecklistGroup[] = [
  {
    key: "Waschmaschine",
    label: "Waschmaschine",
    icon: RotateCw,
    items: [
      {
        id: "wm-filter",
        title: "Flusensieb / Fremdkörperfalle reinigen",
        description:
          "Kleine Klappe unten rechts öffnen, Restwasser ablassen und Flusen, Münzen oder Haarspangen entfernen.",
        duration: "ca. 3 Min.",
        hint: "Flaches Tuch oder Backblech darunter legen, damit kein Wasser auf den Boden läuft.",
      },
      {
        id: "wm-water",
        title: "Wasserzulauf & Aquastop-Hahn prüfen",
        description:
          "Sicherstellen, dass der Wasserhahn komplett aufgedreht ist und der Zulaufschlauch nicht eingeklemmt wurde.",
        duration: "ca. 2 Min.",
        hint: "Eimertest: Kommt bei abgenommenem Schlauch kräftig Wasser aus dem Hahn?",
      },
      {
        id: "wm-hose",
        title: "Ablaufschlauch & Siphon auf Knicke kontrollieren",
        description:
          "Prüfen, ob der Abwasserschlauch hinter dem Gerät geknickt oder der Siphonanschluss verstopft ist.",
        duration: "ca. 3 Min.",
        hint: "Gerät beim Vorschieben vorsichtig bewegen und Stromstecker zuvor ziehen.",
      },
      {
        id: "wm-reset",
        title: "Kindersicherung & Programm-Neustart testen",
        description:
          "Gerät 5 Minuten stromlos machen, Stecker erneut einstecken und prüfen, ob eine Schlosssymbol-Sperre aktiv ist.",
        duration: "ca. 5 Min.",
        hint: "Bei starker Unwucht Wäsche gleichmäßiger verteilen, damit sie wieder schleudert.",
      },
    ],
  },
  {
    key: "Geschirrspüler",
    label: "Geschirrspüler",
    icon: Droplets,
    items: [
      {
        id: "gs-sieve",
        title: "Bodensieb & Sprüharme reinigen",
        description:
          "Sieb im Boden herausdrehen, Speisereste abspülen und verstopfte Düsen an den Sprüharmen mit einem Zahnstocher lösen.",
        duration: "ca. 4 Min.",
        hint: "Sprüharme müssen sich frei per Hand drehen lassen, ohne am Besteckkorb anzustoßen.",
      },
      {
        id: "gs-water",
        title: "Eckventil (Wasserzulauf) prüfen",
        description:
          "Kontrollieren, ob das Ventil unter der Spüle voll geöffnet und der Zulaufschlauch knickfrei verlegt ist.",
        duration: "ca. 2 Min.",
        hint: "Wenn das Wasserzulauf-Lämpchen blinkt, ist oft nur das kleine Zulaufsieb am Aquastop-Schlauch zugesetzt.",
      },
      {
        id: "gs-salt",
        title: "Regeneriersalz & Klarspüler auffüllen",
        description:
          "Bei milchigen Gläsern oder Trocknungsproblemen Salz- und Klarspülerstand kontrollieren und Deckel fest zuschrauben.",
        duration: "ca. 2 Min.",
        hint: "Übergelaufenes Salz sofort wegspülen, damit kein Rost am Edelstahlboden entsteht.",
      },
      {
        id: "gs-reset",
        title: "Geräte-Reset ausführen & Türdichtung abwischen",
        description:
          "Reset-Taste 3 Sekunden gedrückt halten und umlaufende Gummidichtung mit feuchtem Lappen reinigen.",
        duration: "ca. 2 Min.",
        hint: "Schließt die Tür nicht sauber, startet aus Sicherheitsgründen kein Spülprogramm.",
      },
    ],
  },
  {
    key: "Kühlschrank / Gefriergerät",
    label: "Kühlschrank",
    icon: Snowflake,
    items: [
      {
        id: "ks-temp",
        title: "Temperaturregler & Urlaubsmodus prüfen",
        description:
          "Kontrollieren, ob das Thermostat versehentlich auf „0“, „Eco“ oder Urlaubsschaltung verstellt wurde.",
        duration: "ca. 1 Min.",
        hint: "Optimal sind ca. +4 °C bis +6 °C im Kühlteil und −18 °C im Gefrierfach.",
      },
      {
        id: "ks-seal",
        title: "Türdichtung auf Spalten & Schmutz kontrollieren",
        description:
          "Dichtgummi abwischen und mit eingeklemmtem Blatt Papier testen, ob die Tür rundum bündig anliegt.",
        duration: "ca. 3 Min.",
        hint: "Lässt sich das Papier ganz leicht herausziehen, vereist der Innenraum schneller.",
      },
      {
        id: "ks-drain",
        title: "Tauwasser-Ablauföffnung hinten reinigen",
        description:
          "Kleines Ablaufloch an der Innenrückwand über dem Gemüsefach vorsichtig mit einem Wattestäbchen säubern.",
        duration: "ca. 2 Min.",
        hint: "Steht Wasser unter dem Gemüsefach, ist meist genau dieser Ablauf verstopft.",
      },
      {
        id: "ks-vent",
        title: "Belüftung & Abstand zur Wand prüfen",
        description:
          "Lüftungsschlitze freihalten und Staub am rückseitigen Verflüssiger vorsichtig absaugen.",
        duration: "ca. 4 Min.",
        hint: "Ohne Luftzirkulation läuft der Kompressor dauerhaft und verbraucht deutlich mehr Strom.",
      },
    ],
  },
  {
    key: "Backofen / Herd",
    label: "Backofen & Herd",
    icon: Flame,
    items: [
      {
        id: "bo-fuse",
        title: "Sicherungen im Sicherungskasten prüfen",
        description:
          "Herdanschlüsse laufen meist über drei gekoppelte Sicherungen. Schon eine ausgelöste Phase stoppt Ofen oder Kochfeld.",
        duration: "ca. 2 Min.",
        hint: "Alle drei Herd-Sicherungen einmal sauber aus- und wieder einschalten.",
      },
      {
        id: "bo-clock",
        title: "Tageszeit / Timer nach Stromausfall einstellen",
        description:
          "Viele Backöfen blockieren Ober-/Unterhitze und Umluft so lange, bis nach einer Stromunterbrechung die Uhrzeit bestätigt wurde.",
        duration: "ca. 2 Min.",
        hint: "Blinkt „00:00“ oder ein Uhrsymbol im Display? Kurz Uhrzeit setzen und testen.",
      },
      {
        id: "bo-lock",
        title: "Kindersicherung / Demo-Modus deaktivieren",
        description:
          "Wenn das Kochfeld piept oder kein Heizen annimmt, prüfen, ob ein Schlüsselsymbol leuchtet.",
        duration: "ca. 2 Min.",
        hint: "Meist 3–5 Sekunden auf das Schloss- oder Minus-Symbol tippen, um zu entsperren.",
      },
    ],
  },
];

export default function SelfHelpChecklist() {
  const { openQuickRequest } = useQuickRequest();
  const [selectedDevice, setSelectedDevice] = useState<ApplianceKey>("Waschmaschine");
  const [checkedIdsByDevice, setCheckedIdsByDevice] = useState<Record<string, string[]>>({});
  const [resolvedSelf, setResolvedSelf] = useState(false);

  const activeGroup = useMemo(
    () =>
      CHECKLIST_GROUPS.find((g) => g.key === selectedDevice) ?? CHECKLIST_GROUPS[0],
    [selectedDevice]
  );

  const checkedIds = checkedIdsByDevice[activeGroup.key] ?? [];
  const totalCount = activeGroup.items.length;
  const completedCount = checkedIds.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  function toggleItem(itemId: string) {
    setResolvedSelf(false);
    setCheckedIdsByDevice((prev) => {
      const current = prev[activeGroup.key] ?? [];
      const exists = current.includes(itemId);
      return {
        ...prev,
        [activeGroup.key]: exists
          ? current.filter((id) => id !== itemId)
          : [...current, itemId],
      };
    });
  }

  function resetCurrentChecklist() {
    setResolvedSelf(false);
    setCheckedIdsByDevice((prev) => ({
      ...prev,
      [activeGroup.key]: [],
    }));
  }

  function sendRemainingIssueRequest() {
    const checkedTitles = activeGroup.items
      .filter((item) => checkedIds.includes(item.id))
      .map((item) => item.title);

    const symptomSummary =
      checkedTitles.length > 0
        ? `Selbst-Checkliste vorab geprüft (${checkedTitles.join(", ")}), Fehler besteht weiterhin.`
        : "Einfache Fehler vorab geprüft, benötige fachliche Unterstützung.";

    openQuickRequest(activeGroup.key, symptomSummary, "", "repair");
  }

  return (
    <section
      id="selbsthilfe-checkliste"
      aria-labelledby="self-help-checklist-heading"
      className="py-12 sm:py-20 bg-white dark:bg-slate-900/50 border-t border-primary/8 dark:border-white/10"
    >
      <div className="container-page">
        <div className="rounded-3xl border border-primary/12 dark:border-white/12 bg-surface dark:bg-slate-900 p-5 sm:p-8 lg:p-10 shadow-card">
          {/* Header & Safety Pill */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-primary/10 dark:border-white/10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-accent dark:text-accent-light mb-2.5">
                <ClipboardCheck size={13} aria-hidden="true" />
                <span>Vorab-Checkliste · Hinweise zur Selbstkontrolle</span>
              </div>
              <h2
                id="self-help-checklist-heading"
                className="text-2xl sm:text-3xl font-extrabold text-primary dark:text-slate-100"
              >
                Bevor Sie eine Anfrage senden: Einfache Fehler selbst prüfen
              </h2>
              <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                Oft lässt sich eine Störung in wenigen Minuten selbst beheben, z. B. durch
                Reinigen des Flusensiebs oder Prüfen des Wasserzulaufs. Haken Sie die Schritte ab:
              </p>
            </div>

            <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-xs text-amber-900 dark:text-amber-200 lg:max-w-sm shrink-0">
              <ShieldAlert
                size={16}
                className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span className="leading-snug font-medium">
                <strong>Sicherheit zuerst:</strong> Vor Reinigungs- oder Schlauchkontrollen bitte
                immer Netzstecker ziehen bzw. Sicherung ausschalten.
              </span>
            </div>
          </div>

          {/* Appliance Tabs + Live Progress Bar */}
          <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div
              role="tablist"
              aria-label="Gerät für Checkliste auswählen"
              className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:flex sm:flex-wrap gap-2"
            >
              {CHECKLIST_GROUPS.map((group) => {
                const Icon = group.icon;
                const active = group.key === activeGroup.key;
                const groupDone = (checkedIdsByDevice[group.key] ?? []).length;
                return (
                  <button
                    key={group.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setSelectedDevice(group.key);
                      setResolvedSelf(false);
                    }}
                    className={`inline-flex min-h-[42px] min-w-0 items-center justify-between sm:justify-start gap-2 rounded-xl border px-3 sm:px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? "border-accent bg-accent text-white shadow-sm"
                        : "border-primary/12 dark:border-white/15 bg-white dark:bg-slate-800 text-primary dark:text-slate-200 hover:border-accent/60"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2 min-w-0">
                      <Icon size={15} className="shrink-0" aria-hidden="true" />
                      <span className="truncate">{group.label}</span>
                    </span>
                    {groupDone > 0 && (
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums shrink-0 ${
                          active
                            ? "bg-white/25 text-white"
                            : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        }`}
                      >
                        {groupDone}/{group.items.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto md:min-w-[220px]">
              <div className="flex-1">
                <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                  <span className="text-ink-muted">Geprüfte Schritte</span>
                  <span className="text-primary dark:text-slate-100 tabular-nums">
                    {completedCount} von {totalCount}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-primary/10 dark:bg-white/10">
                  <motion.div
                    initial={false}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-accent to-emerald-500"
                  />
                </div>
              </div>
              {completedCount > 0 && (
                <button
                  type="button"
                  onClick={resetCurrentChecklist}
                  className="inline-flex items-center gap-1 rounded-lg border border-primary/15 dark:border-white/15 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-[11px] font-bold text-ink-muted hover:text-primary dark:hover:text-white transition-colors cursor-pointer shrink-0"
                  title="Checkliste für dieses Gerät zurücksetzen"
                >
                  <RotateCcw size={12} aria-hidden="true" />
                  <span>Zurücksetzen</span>
                </button>
              )}
            </div>
          </div>

          {/* Checklist Items Grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeGroup.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="mt-6 grid gap-3.5 md:grid-cols-2"
            >
              {activeGroup.items.map((item, idx) => {
                const isChecked = checkedIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="checkbox"
                    aria-checked={isChecked}
                    onClick={() => toggleItem(item.id)}
                    className={`group text-left flex flex-col justify-between rounded-2xl border p-4 sm:p-5 transition-all duration-200 cursor-pointer ${
                      isChecked
                        ? "border-emerald-500/45 bg-emerald-500/[0.08] dark:bg-emerald-500/[0.12] shadow-xs"
                        : "border-primary/10 dark:border-white/12 bg-white dark:bg-slate-800/80 hover:border-accent/50"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <span
                        aria-hidden="true"
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                          isChecked
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-primary/25 dark:border-white/25 bg-surface dark:bg-slate-900 text-transparent group-hover:border-accent"
                        }`}
                      >
                        <Check size={14} strokeWidth={3} />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span
                            className={`text-sm sm:text-[15px] font-extrabold leading-snug ${
                              isChecked
                                ? "text-emerald-800 dark:text-emerald-200 line-through decoration-emerald-500/50"
                                : "text-primary dark:text-slate-100"
                            }`}
                          >
                            0{idx + 1}. {item.title}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-md bg-surface dark:bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-ink-muted shrink-0">
                            <Clock size={11} aria-hidden="true" />
                            {item.duration}
                          </span>
                        </div>

                        <p className="mt-1.5 text-xs sm:text-[13px] text-ink-muted leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-primary/8 dark:border-white/10 flex items-start gap-2 text-[11px] text-primary/80 dark:text-slate-300">
                      <Info size={13} className="text-accent shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{item.hint}</span>
                    </div>
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {/* Bottom Resolution / Hand-off Bar */}
          <div className="mt-6 rounded-2xl border border-primary/10 dark:border-white/12 bg-white dark:bg-slate-800/90 p-4 sm:p-5">
            <AnimatePresence mode="wait">
              {resolvedSelf ? (
                <motion.div
                  key="self-resolved-card"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={22} />
                    </span>
                    <div>
                      <p className="text-sm font-extrabold text-emerald-800 dark:text-emerald-300">
                        Perfekt, Ihr Gerät funktioniert wieder!
                      </p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        Schön, dass unser Kurz-Check geholfen hat. Bei Bedarf an Original-Ersatzteilen oder einem geprüften Ersatzgerät in Osnabrück helfen wir Ihnen jederzeit weiter.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setResolvedSelf(false)}
                    className="rounded-xl border border-primary/15 dark:border-white/15 px-3.5 py-2 text-xs font-bold text-ink-muted hover:text-primary dark:hover:text-white transition-colors shrink-0 cursor-pointer"
                  >
                    Doch noch Hilfe nötig?
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="self-action-bar"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-sm font-extrabold text-primary dark:text-slate-100">
                      {completedCount > 0
                        ? `${completedCount} von ${totalCount} Prüfpunkten bei „${activeGroup.label}“ erledigt`
                        : `Hat ein Check bei „${activeGroup.label}“ geholfen?`}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      Falls der Fehler weiter besteht, übernehmen wir Ihre geprüften Schritte direkt in
                      Ihre Ersatzteil- oder Beratungsanfrage. Herr Hannachi sieht sofort, was bereits ausgeschlossen wurde.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setResolvedSelf(true)}
                      className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3.5 py-2.5 text-center text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer sm:whitespace-nowrap"
                    >
                      <CheckCircle2 size={15} className="shrink-0" aria-hidden="true" />
                      <span>Problem behoben</span>
                    </button>
                    <button
                      type="button"
                      onClick={sendRemainingIssueRequest}
                      data-testid="self-help-send-request-btn"
                      className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-center text-xs font-extrabold leading-snug text-white shadow-sm hover:bg-accent-dark transition-colors cursor-pointer sm:whitespace-nowrap"
                    >
                      <Sparkles size={14} className="shrink-0" aria-hidden="true" />
                      <span>
                        {completedCount > 0
                          ? "Mit Prüfergebnis anfragen"
                          : "Besteht weiterhin → Anfrage starten"}
                      </span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
