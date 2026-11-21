"use client";
import { Fragment, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  Clock,
  MessageCircle,
  AlertTriangle,
  Zap,
} from "lucide-react";
import type { RepairValues, UrgencyLevel } from "@/lib/repairRequest";
import { hapticTap } from "@/lib/haptics";

export interface WhatsAppPreviewReadinessItem {
  label: string;
  ready: boolean;
  target: keyof RepairValues;
}

export interface WhatsAppPreviewProps {
  device: string;
  customDevice?: string;
  brand: string;
  problem: string;
  urgency: UrgencyLevel;
  onUrgencyChange?: (urgency: UrgencyLevel) => void;
  zip: string;
  streetAddress?: string;
  locationVerified?: boolean;
  phone: string;
  formattedMessage: string | null;
  isReady: boolean;
  readinessItems: WhatsAppPreviewReadinessItem[];
  onFocusField: (field: keyof RepairValues) => void;
}

const URGENCY_OPTIONS: {
  id: UrgencyLevel;
  label: string;
  icon: typeof Clock;
}[] = [
  { id: "normal", label: "Normal", icon: Clock },
  { id: "express", label: "Dringend", icon: Zap },
  { id: "notfall", label: "Notfall", icon: AlertTriangle },
];

function renderWhatsAppLine(line: string, lineIndex: number) {
  if (!line.trim()) {
    return <div key={lineIndex} className="h-2" aria-hidden="true" />;
  }

  const tokens = line.split(/(\*[^*]+\*|https:\/\/\S+)/g);
  return (
    <p key={lineIndex} className="leading-relaxed break-words">
      {tokens.map((part, idx) => {
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
          return (
            <strong key={idx} className="font-bold text-slate-950 dark:text-white">
              {part.slice(1, -1)}
            </strong>
          );
        }
        if (part.startsWith("https://")) {
          return (
            <span
              key={idx}
              className="text-sky-700 dark:text-sky-400 underline decoration-sky-500/50 break-all"
            >
              {part}
            </span>
          );
        }
        return <Fragment key={idx}>{part}</Fragment>;
      })}
    </p>
  );
}

export default function WhatsAppPreview({
  urgency,
  onUrgencyChange,
  formattedMessage,
  isReady,
  readinessItems,
  onFocusField,
}: WhatsAppPreviewProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isBubbleOpen, setIsBubbleOpen] = useState(false);

  const missingItems = readinessItems.filter((item) => !item.ready);

  return (
    <div
      data-testid="whatsapp-preview"
      className="rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 overflow-hidden"
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
              isReady
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-primary/5 dark:bg-white/5 text-ink-muted"
            }`}
          >
            {isReady ? (
              <CheckCircle2 size={15} aria-hidden="true" />
            ) : (
              <MessageCircle size={15} aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-primary dark:text-white truncate">
              {isReady ? "WhatsApp-Nachricht bereit" : "Noch kurz ergänzen:"}
            </p>
            {isReady ? (
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 truncate">
                Alle Angaben vollständig · Öffnet direkt im Chat
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
                {missingItems.map((item, idx) => (
                  <Fragment key={item.label}>
                    {idx > 0 && (
                      <span aria-hidden="true" className="text-ink-faint">
                        ·
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onFocusField(item.target)}
                      className="font-semibold text-amber-700 dark:text-amber-300 underline decoration-amber-500/40 underline-offset-2 hover:text-accent cursor-pointer"
                    >
                      {item.label}
                    </button>
                  </Fragment>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            hapticTap();
            setIsBubbleOpen((prev) => !prev);
          }}
          aria-expanded={isBubbleOpen}
          className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-primary/12 dark:border-white/15 bg-surface dark:bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-primary dark:text-slate-100 hover:border-accent transition-colors cursor-pointer shrink-0 whitespace-nowrap"
        >
          <span>{isBubbleOpen ? "Schließen" : "Vorschau"}</span>
          <ChevronDown
            size={13}
            className={`transition-transform duration-200 ${isBubbleOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isBubbleOpen && (
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden border-t border-primary/8 dark:border-white/8"
          >
            <div className="p-3 space-y-2.5 bg-surface/50 dark:bg-slate-950/50">
              {onUrgencyChange && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-ink-muted">
                    Dringlichkeit:
                  </span>
                  <div className="inline-flex rounded-lg bg-white dark:bg-slate-900 p-0.5 border border-primary/10 dark:border-white/10 gap-0.5">
                    {URGENCY_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const active = urgency === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            hapticTap();
                            onUrgencyChange(opt.id);
                          }}
                          aria-pressed={active}
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                            active
                              ? "bg-primary text-white dark:bg-accent"
                              : "text-ink-muted hover:text-primary dark:hover:text-white"
                          }`}
                        >
                          <Icon size={11} aria-hidden="true" />
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {isReady && formattedMessage ? (
                <div className="rounded-2xl rounded-tr-sm border border-emerald-500/25 bg-[#e7ffdb]/75 dark:bg-emerald-950/40 p-3 text-xs text-slate-800 dark:text-slate-100">
                  <div className="space-y-0.5 max-h-40 overflow-y-auto pr-1">
                    {formattedMessage
                      .split("\n")
                      .map((line, idx) => renderWhatsAppLine(line, idx))}
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-emerald-600/15 flex items-center justify-between text-[10px] font-semibold text-emerald-800/80 dark:text-emerald-300/80">
                    <span className="truncate">Live-Vorschau für Herrn Hannachi</span>
                    <span className="inline-flex items-center gap-1 shrink-0">
                      <span>Jetzt</span>
                      <CheckCheck size={13} className="text-sky-600 dark:text-sky-400" />
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-ink-muted">
                  Sobald Sie oben ein Problem wählen (oder kurz beschreiben) und Ihre Telefonnummer eintragen, sehen Sie hier Ihre fertige WhatsApp-Nachricht.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
