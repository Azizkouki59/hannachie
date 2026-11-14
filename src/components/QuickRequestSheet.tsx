"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wrench } from "lucide-react";
import RepairForm from "@/components/RepairForm";
import type { InquiryMode } from "@/lib/repairRequest";
import { triggerHapticFeedback } from "@/lib/haptics";
import { business } from "@/data/site";

type QuickRequestContextType = {
  isOpen: boolean;
  openQuickRequest: (
    device?: string,
    symptom?: string,
    brand?: string,
    mode?: InquiryMode
  ) => void;
  closeQuickRequest: () => void;
};

const QuickRequestContext = createContext<QuickRequestContextType>({
  isOpen: false,
  openQuickRequest: () => {},
  closeQuickRequest: () => {},
});

export function useQuickRequest() {
  return useContext(QuickRequestContext);
}

const DEFAULT_DEVICE = "Waschmaschine";

export function QuickRequestProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [openCount, setOpenCount] = useState(0);
  const [device, setDevice] = useState(DEFAULT_DEVICE);
  const [symptom, setSymptom] = useState("");
  const [brand, setBrand] = useState("");
  const [mode, setMode] = useState<InquiryMode>("repair");
  const [mounted, setMounted] = useState(false);
  const formBodyRef = useRef<HTMLDivElement>(null);
  const mobileScrollTimerRef = useRef<number | null>(null);
  const mobileRetryTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (mobileScrollTimerRef.current) window.clearTimeout(mobileScrollTimerRef.current);
      if (mobileRetryTimerRef.current) window.clearTimeout(mobileRetryTimerRef.current);
    };
  }, []);

  const scrollToFirstFieldOnMobile = useCallback((attempt = 0) => {
    const container = formBodyRef.current;
    if (!container) {
      if (attempt < 8) {
        mobileRetryTimerRef.current = window.setTimeout(
          () => scrollToFirstFieldOnMobile(attempt + 1),
          60
        );
      }
      return;
    }

    const firstField = container.querySelector<HTMLElement>(
      '[data-field="problem"]:not([disabled]), [data-field="device"]:not([disabled]), input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled])'
    );

    if (firstField) {
      const containerRect = container.getBoundingClientRect();
      const fieldRect = firstField.getBoundingClientRect();
      const targetTop = Math.max(
        0,
        fieldRect.top - containerRect.top + container.scrollTop - 20
      );
      container.scrollTo({ top: targetTop, behavior: "smooth" });
      firstField.focus({ preventScroll: true });
    } else if (attempt < 8) {
      mobileRetryTimerRef.current = window.setTimeout(
        () => scrollToFirstFieldOnMobile(attempt + 1),
        60
      );
    }
  }, []);

  const openQuickRequest = useCallback(
    (
      dev?: string,
      sym?: string,
      br?: string,
      inquiryMode?: InquiryMode
    ) => {
      // Normalize inputs and safely ignore accidental SyntheticEvent objects if passed as onClick={openQuickRequest}
      const normalizedDevice =
        typeof dev === "string" && dev.trim().length > 0
          ? dev.trim()
          : DEFAULT_DEVICE;
      const normalizedSymptom = typeof sym === "string" ? sym.trim() : "";
      const normalizedBrand = typeof br === "string" ? br.trim() : "";
      const normalizedMode: InquiryMode =
        inquiryMode === "question" ? "question" : "repair";

      setDevice(normalizedDevice);
      setSymptom(normalizedSymptom);
      setBrand(normalizedBrand);
      setMode(normalizedMode);
      setOpenCount((prev) => prev + 1);
      setIsOpen(true);
      triggerHapticFeedback(50);

      // On mobile viewports, wait past the initial modal/skeleton mount and smoothly scroll to the first form field
      if (typeof window !== "undefined") {
        const isMobile =
          window.matchMedia("(max-width: 767px)").matches || window.innerWidth < 768;
        if (isMobile) {
          if (mobileScrollTimerRef.current) window.clearTimeout(mobileScrollTimerRef.current);
          if (mobileRetryTimerRef.current) window.clearTimeout(mobileRetryTimerRef.current);
          mobileScrollTimerRef.current = window.setTimeout(() => {
            scrollToFirstFieldOnMobile(0);
          }, 280);
        }
      }
    },
    [scrollToFirstFieldOnMobile]
  );

  const closeQuickRequest = useCallback(() => {
    if (mobileScrollTimerRef.current) window.clearTimeout(mobileScrollTimerRef.current);
    if (mobileRetryTimerRef.current) window.clearTimeout(mobileRetryTimerRef.current);
    setIsOpen(false);
  }, []);

  const contextValue = useMemo(
    () => ({ isOpen, openQuickRequest, closeQuickRequest }),
    [isOpen, openQuickRequest, closeQuickRequest]
  );

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Wait just past RepairForm's 200ms initial skeleton so desktop focus targets the first active required control
    let retryTimer = 0;
    const focusFirstField = (attempt = 0) => {
      const container = formBodyRef.current;
      if (!container) return;
      const firstInput = container.querySelector<HTMLElement>(
        '[data-field="problem"]:not([disabled]), [data-field="device"]:not([disabled]), input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), button[type="button"]:not([disabled])'
      );
      if (firstInput) {
        firstInput.focus({ preventScroll: true });
      } else if (attempt < 5) {
        retryTimer = window.setTimeout(() => focusFirstField(attempt + 1), 60);
      }
    };

    const timer = window.setTimeout(() => focusFirstField(0), 230);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(timer);
      window.clearTimeout(retryTimer);
    };
  }, [isOpen, openCount]);

  const modalPortalContent = (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[99999] flex flex-col justify-end sm:items-center sm:justify-center sm:p-4 md:p-6"
          data-testid="quick-request-portal-root"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeQuickRequest}
            className="fixed inset-0 bg-black/65 backdrop-blur-sm"
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Schnellanfrage stellen"
            initial={{ y: 48, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 48, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex max-h-[92dvh] sm:max-h-[90dvh] w-full max-w-2xl mx-auto flex-col rounded-t-3xl sm:rounded-3xl bg-surface dark:bg-slate-950 shadow-2xl overflow-hidden border border-white/15"
          >
            <div className="sticky top-0 z-20 shrink-0 bg-primary-dark text-white px-4 sm:px-6 pt-2.5 pb-3 border-b border-white/10">
              <div className="w-10 h-1.5 bg-white/25 rounded-full mx-auto mb-2.5 sm:hidden" />
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white">
                    <Wrench size={17} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-extrabold leading-tight truncate">
                      {mode === "question"
                        ? "Direkte Frage an Herrn Hannachi"
                        : "Komplette Reparaturanfrage"}
                    </p>
                    <p className="text-[11px] text-white/65 truncate">
                      Osnabrück &amp; ganzes Umland · Mit Google Maps Standort
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeQuickRequest}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
                  aria-label="Fenster schließen"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div
              ref={formBodyRef}
              className="overflow-y-auto overscroll-contain p-3 sm:p-5 pb-[max(2rem,env(safe-area-inset-bottom))]"
            >
              <RepairForm
                key={openCount}
                defaultDevice={device}
                defaultSymptom={symptom}
                defaultBrand={brand}
                defaultMode={mode}
                compact
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <QuickRequestContext.Provider value={contextValue}>
      {children}

      {/* Detached Portal Modal rendered directly into document.body */}
      {mounted && typeof document !== "undefined"
        ? createPortal(modalPortalContent, document.body)
        : null}
    </QuickRequestContext.Provider>
  );
}
