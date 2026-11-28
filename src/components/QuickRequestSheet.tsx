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
import {
  motion,
  AnimatePresence,
  useDragControls,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type PanInfo,
} from "framer-motion";
import { MessageCircle, X, Phone } from "lucide-react";
import RepairForm from "@/components/RepairForm";
import type { InquiryMode } from "@/lib/repairRequest";
import { hapticDismiss, triggerHapticFeedback } from "@/lib/haptics";
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
  const [isMobileSheet, setIsMobileSheet] = useState(false);
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const dragControls = useDragControls();
  const dragY = useMotionValue(0);
  const backdropFade = useTransform(dragY, [0, 280], [1, 0.16]);
  const sheetDragScale = useTransform(dragY, [0, 280], [1, 0.965]);
  const formBodyRef = useRef<HTMLDivElement>(null);
  const mobileScrollTimerRef = useRef<number | null>(null);
  const mobileRetryTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(max-width: 639px)");
    const syncViewport = () => setIsMobileSheet(mq.matches);
    syncViewport();
    mq.addEventListener("change", syncViewport);
    return () => {
      mq.removeEventListener("change", syncViewport);
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
      dragY.set(0);
      setIsDraggingSheet(false);
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
    [dragY, scrollToFirstFieldOnMobile]
  );

  const closeQuickRequest = useCallback(() => {
    if (mobileScrollTimerRef.current) window.clearTimeout(mobileScrollTimerRef.current);
    if (mobileRetryTimerRef.current) window.clearTimeout(mobileRetryTimerRef.current);
    setIsDraggingSheet(false);
    setIsOpen(false);
  }, []);

  const handleSheetDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setIsDraggingSheet(false);
      if (info.offset.y > 105 || info.velocity.y > 460) {
        hapticDismiss();
        closeQuickRequest();
      }
    },
    [closeQuickRequest]
  );

  const contextValue = useMemo(
    () => ({ isOpen, openQuickRequest, closeQuickRequest }),
    [isOpen, openQuickRequest, closeQuickRequest]
  );

  useEffect(() => {
    if (!isOpen) return undefined;

    const prevHtmlOverflowY = document.documentElement.style.overflowY;
    document.documentElement.style.overflowY = "hidden";

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
      document.documentElement.style.overflowY = prevHtmlOverflowY;
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
            style={prefersReducedMotion ? undefined : { opacity: backdropFade }}
            className="fixed inset-0"
            aria-hidden="true"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeQuickRequest}
              className="h-full w-full bg-black/65 backdrop-blur-sm touch-none overscroll-none"
            />
          </motion.div>

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Schnellanfrage stellen"
            style={
              prefersReducedMotion || !isMobileSheet
                ? undefined
                : { y: dragY, scale: sheetDragScale }
            }
            drag={prefersReducedMotion || !isMobileSheet ? false : "y"}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.88 }}
            onDragStart={() => setIsDraggingSheet(true)}
            onDragEnd={handleSheetDragEnd}
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : isMobileSheet
                ? { y: "100%", opacity: 0.9 }
                : { y: 14, opacity: 0, scale: 0.955 }
            }
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : { y: 0, opacity: 1, scale: 1 }
            }
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : isMobileSheet
                ? { y: "100%", opacity: 0.6 }
                : { y: 10, opacity: 0, scale: 0.96 }
            }
            transition={
              prefersReducedMotion
                ? { duration: 0.1 }
                : isMobileSheet
                ? { type: "spring", stiffness: 360, damping: 34, mass: 0.85 }
                : {
                    type: "spring",
                    stiffness: 420,
                    damping: 32,
                    mass: 0.72,
                    opacity: { duration: 0.16, ease: [0.16, 1, 0.3, 1] },
                  }
            }
            className="relative z-10 flex max-h-[88dvh] sm:max-h-[90dvh] w-full max-w-2xl mx-auto flex-col rounded-t-3xl sm:rounded-3xl bg-surface dark:bg-slate-950 shadow-2xl overflow-hidden border border-white/15 will-change-transform"
          >
            <div
              onPointerDown={(e) => {
                if (!prefersReducedMotion && isMobileSheet) {
                  dragControls.start(e);
                }
              }}
              className="sticky top-0 z-20 shrink-0 bg-primary-dark text-white px-3.5 sm:px-6 pt-2 pb-2.5 border-b border-white/10 touch-none sm:touch-auto select-none cursor-grab active:cursor-grabbing sm:cursor-default"
            >
              <motion.div
                animate={{
                  width: isDraggingSheet ? 52 : 40,
                  opacity: isDraggingSheet ? 0.55 : 0.25,
                }}
                transition={{ type: "spring", stiffness: 450, damping: 28 }}
                className="h-1.5 bg-white rounded-full mx-auto mb-2 sm:hidden"
              />
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#64B5EC]/35 bg-[#1974B8]/25 text-[#64B5EC]"
                  >
                    <MessageCircle size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-extrabold leading-tight truncate">
                      {mode === "question" ? "Direkte Frage" : "Kurze Anfrage"}
                    </p>
                    <p className="text-[11px] text-white/65 truncate">
                      Osnabrück · Termine nach Vereinbarung
                    </p>
                  </div>
                </div>
                <div
                  className="flex items-center gap-1.5 shrink-0"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <motion.a
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
                    transition={{ type: "spring", stiffness: 500, damping: 26 }}
                    href={business.phoneHref}
                    onClick={() => triggerHapticFeedback(50)}
                    aria-label={`Jetzt anrufen: ${business.phoneDisplay}`}
                    title={`Direkt anrufen: ${business.phoneDisplay}`}
                    className="flex h-11 min-h-[44px] min-w-[44px] px-3 items-center justify-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-500/15 text-xs font-extrabold text-emerald-300 hover:bg-emerald-500/25 transition-colors"
                  >
                    <Phone size={15} className="text-emerald-400 shrink-0" />
                    <span className="hidden min-[380px]:inline">Anrufen</span>
                  </motion.a>
                  <motion.button
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 500, damping: 26 }}
                    type="button"
                    onClick={closeQuickRequest}
                    className="flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
                    aria-label="Fenster schließen"
                  >
                    <X size={18} />
                  </motion.button>
                </div>
              </div>
            </div>

            <div
              ref={formBodyRef}
              className="overflow-y-auto overflow-x-hidden overscroll-contain p-2.5 sm:p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
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
