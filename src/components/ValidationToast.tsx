"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowUpRight, MessageCircle, X } from "lucide-react";
import type {
  WhatsAppInquiryMode,
  WhatsAppValidationErrors,
  WhatsAppValidationField,
} from "@/utils/whatsapp";

export interface ValidationToastProps {
  errors: WhatsAppValidationErrors | null;
  mode?: WhatsAppInquiryMode;
  onDismiss: () => void;
  onFieldSelect?: (field: WhatsAppValidationField) => void;
}

const FIELD_ORDER: WhatsAppValidationField[] = [
  "device",
  "customDevice",
  "brand",
  "symptom",
  "name",
  "phone",
];

function getFieldLabel(field: WhatsAppValidationField, mode: WhatsAppInquiryMode): string {
  switch (field) {
    case "device":
      return "Gerät";
    case "customDevice":
      return "Gerätetyp";
    case "brand":
      return "Marke";
    case "symptom":
      return mode === "question" ? "Ihre Frage" : "Fehlerbild";
    case "name":
      return "Name";
    case "phone":
      return "Telefonnummer";
  }
}

export default function ValidationToast({
  errors,
  mode = "repair",
  onDismiss,
  onFieldSelect,
}: ValidationToastProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const missingFields = errors
    ? FIELD_ORDER.filter((key) => Boolean(errors[key]))
    : [];
  const hasErrors = missingFields.length > 0;
  const primaryError = hasErrors ? errors?.[missingFields[0]] : undefined;

  return createPortal(
    <AnimatePresence>
      {hasErrors && (
        <motion.div
          key="wa-validation-toast"
          role="alert"
          aria-live="polite"
          data-testid="whatsapp-validation-toast"
          initial={{ opacity: 0, y: -16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -14, scale: 0.97 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-3 right-3 left-3 sm:left-auto sm:top-5 sm:right-5 sm:w-[min(calc(100vw-2.5rem),25rem)] max-h-[42dvh] overflow-y-auto z-[100000] pointer-events-auto"
        >
          <div className="overflow-hidden rounded-2xl border border-amber-500/45 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-slate-950/20">
            <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500" />
            <div className="p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <AlertCircle size={18} aria-hidden />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <MessageCircle size={13} aria-hidden />
                      <span>
                        Noch {missingFields.length}{" "}
                        {missingFields.length === 1 ? "Feld fehlt" : "Felder fehlen"} für WhatsApp
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={onDismiss}
                      aria-label="Hinweis schließen"
                      className="rounded-lg p-1 text-ink-muted hover:bg-surface dark:hover:bg-slate-800 hover:text-primary dark:hover:text-slate-100 transition-colors cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {primaryError && (
                    <p className="mt-1 text-[13px] font-semibold leading-snug text-primary dark:text-slate-100">
                      {primaryError}
                    </p>
                  )}

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {missingFields.map((field) => (
                      <button
                        key={field}
                        type="button"
                        onClick={() => onFieldSelect?.(field)}
                        title={errors?.[field]}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-500/35 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 transition-colors cursor-pointer"
                      >
                        <span>{getFieldLabel(field, mode)}</span>
                        {onFieldSelect && <ArrowUpRight size={11} aria-hidden />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
