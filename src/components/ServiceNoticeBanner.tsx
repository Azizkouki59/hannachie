"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarClock, Info, Wrench, X } from "lucide-react";
import { business, type ServiceNotice } from "@/data/site";

export type ServiceNoticeBannerProps = {
  notice?: ServiceNotice | string | null;
};

export default function ServiceNoticeBanner({
  notice = business.serviceNotice,
}: ServiceNoticeBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const normalized = (() => {
    if (!notice) return null;
    if (typeof notice === "string") {
      const trimmed = notice.trim();
      if (!trimmed) return null;
      return {
        active: true,
        type: "vacation" as const,
        label: "Info",
        message: trimmed,
      };
    }
    const trimmed = notice.message?.trim() ?? "";
    if (!notice.active || !trimmed) return null;
    return {
      ...notice,
      label: notice.label?.trim() || (notice.type === "maintenance" ? "Wartung" : "Urlaub / Hinweis"),
      message: trimmed,
    };
  })();

  const isMaintenance = normalized?.type === "maintenance";

  return (
    <AnimatePresence initial={false}>
      {normalized && !dismissed && (
        <motion.div
          key="service-notice-banner"
          role="region"
          aria-label="Service-Hinweis"
          data-testid="service-notice-banner"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden border-b border-amber-500/30 bg-amber-50 dark:bg-amber-950/60 text-primary dark:text-amber-100"
        >
          <div className="container-page flex items-center justify-between gap-2.5 sm:gap-4 py-2 sm:py-2.5">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
              <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                {isMaintenance ? (
                  <Wrench size={11} aria-hidden="true" />
                ) : (
                  <CalendarClock size={11} aria-hidden="true" />
                )}
                <span>{normalized.label}</span>
              </span>

              <p className="min-w-0 flex-1 text-xs sm:text-[13px] font-semibold leading-snug text-primary dark:text-amber-50">
                <Info
                  size={13}
                  className="mr-1.5 inline-block -translate-y-px text-amber-700 dark:text-amber-300 sm:hidden"
                  aria-hidden="true"
                />
                {normalized.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setDismissed(true)}
              aria-label="Service-Hinweis schließen"
              className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] sm:h-9 sm:w-9 sm:min-h-0 sm:min-w-0 shrink-0 items-center justify-center rounded-xl text-amber-800/75 dark:text-amber-200/75 hover:bg-amber-500/15 hover:text-amber-950 dark:hover:text-white active:scale-95 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
