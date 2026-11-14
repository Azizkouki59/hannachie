"use client";
import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Flame,
  ImagePlus,
  Loader2,
  MessageCircle,
  RotateCw,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Star,
  MapPin,
  Navigation,
  HelpCircle,
  ExternalLink,
  Wrench,
  X,
  Zap,
  Home,
  Building2,
} from "lucide-react";
import { business } from "@/data/site";
import {
  deviceTypes,
  popularBrands,
  popularModelPresets,
  osnabrueckServiceAreas,
  quickQuestionPresets,
  symptomsByDevice,
  diagnosticHintByDevice,
  emptyValues,
  submitRepairRequest,
  validate,
  validateStep,
  validateField,
  toWhatsAppInput,
  step1Schema,
  step2Schema,
  step3Schema,
  quickQuestionSchema,
  repairFormSchema,
  buildClientGoogleMapsLink,
  reverseGeocodePosition,
  resolveVerifiedFallbackLocation,
  formatCoordinatesDisplay,
  getSuggestedModels,
  hasMeaningfulDraftContent,
  saveRepairDraft,
  loadRepairDraft,
  clearRepairDraft,
  type InquiryMode,
  type ServiceVisitType,
  type RepairErrors,
  type RepairValues,
  type UrgencyLevel,
  type ContactChannel,
  type VerifiedLocationInfo,
} from "@/lib/repairRequest";
import {
  validateWhatsAppFields,
  type WhatsAppValidationErrors,
  type WhatsAppValidationField,
} from "@/utils/whatsapp";
import { RepairFormStepSkeleton } from "@/components/Skeletons";
import ValidationToast from "@/components/ValidationToast";
import GoogleMapsPinModal from "@/components/GoogleMapsPinModal";

type Status = "idle" | "loading" | "completing" | "success" | "error";

const CONFETTI_COLORS = [
  "#10b981", // Emerald
  "#0ea5e9", // Sky Accent
  "#f59e0b", // Gold Amber
  "#3b82f6", // Royal Blue
  "#14b8a6", // Teal
  "#34d399", // Mint
  "#fbbf24", // Warm Gold
];

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  tiltAngle: number;
  tiltSpeed: number;
  shape: "rect" | "circle" | "star";
  opacity: number;
  decay: number;
}

function CelebrationConfetti({ triggerKey = 0 }: { triggerKey?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    updateSize();

    const particles: ConfettiParticle[] = [];

    const spawnBurst = (
      originXRatio: number,
      originYRatio: number,
      count: number,
      baseAngle: number,
      spread: number,
      minSpeed: number,
      maxSpeed: number
    ) => {
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      const startX = width * originXRatio;
      const startY = height * originYRatio;

      for (let i = 0; i < count; i++) {
        const angle = baseAngle + (Math.random() - 0.5) * spread;
        const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
        const shapeRand = Math.random();
        const shape: ConfettiParticle["shape"] =
          shapeRand < 0.58 ? "rect" : shapeRand < 0.85 ? "circle" : "star";

        particles.push({
          x: startX,
          y: startY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          size: shape === "star" ? 6 + Math.random() * 4 : 5 + Math.random() * 6,
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.22,
          tiltAngle: Math.random() * Math.PI * 2,
          tiltSpeed: 0.08 + Math.random() * 0.14,
          shape,
          opacity: 1,
          decay: 0.0065 + Math.random() * 0.006,
        });
      }
    };

    // Primary center-top fountain burst immediately on mount
    spawnBurst(0.22, 0.22, 48, -Math.PI / 2 + 0.25, Math.PI * 0.75, 5, 13);
    spawnBurst(0.5, 0.18, 42, -Math.PI / 2, Math.PI * 0.85, 4.5, 12);

    // Secondary side-cannon celebration burst 160ms later
    const cannonTimer = window.setTimeout(() => {
      spawnBurst(0.06, 0.55, 34, -Math.PI / 3, Math.PI * 0.45, 7, 14.5);
      spawnBurst(0.94, 0.55, 34, (-Math.PI * 2) / 3, Math.PI * 0.45, 7, 14.5);
    }, 160);

    let rafId = 0;
    const gravity = 0.24;
    const drag = 0.985;

    const drawStar = (cx: number, cy: number, spikes: number, outerR: number, innerR: number) => {
      let rot = (Math.PI / 2) * 3;
      const step = Math.PI / spikes;
      ctx.beginPath();
      ctx.moveTo(cx, cy - outerR);
      for (let i = 0; i < spikes; i++) {
        ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
        rot += step;
        ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
        rot += step;
      }
      ctx.closePath();
      ctx.fill();
    };

    const render = () => {
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      ctx.clearRect(0, 0, width, height);

      let activeCount = 0;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.opacity <= 0.02 || p.y > height + 40) continue;
        activeCount++;

        p.vx *= drag;
        p.vy = p.vy * drag + gravity;
        p.x += p.vx + Math.sin(p.tiltAngle) * 0.45;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.tiltAngle += p.tiltSpeed;
        p.opacity = Math.max(0, p.opacity - p.decay);

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.shape === "rect") {
          const scaleY = Math.cos(p.tiltAngle);
          ctx.scale(1, scaleY);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size * 1.25, p.size * 0.7);
        } else if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.45, 0, Math.PI * 2);
          ctx.fill();
        } else {
          drawStar(0, 0, 4, p.size * 0.75, p.size * 0.3);
        }

        ctx.restore();
      }

      if (activeCount > 0) {
        rafId = window.requestAnimationFrame(render);
      }
    };

    rafId = window.requestAnimationFrame(render);

    return () => {
      window.clearTimeout(cannonTimer);
      window.cancelAnimationFrame(rafId);
    };
  }, [triggerKey]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 h-full w-full"
    />
  );
}

const BADGE_SPARK_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

function AnimatedCheckmark({ size = 32 }: { size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="overflow-visible"
    >
      <motion.circle
        cx="18"
        cy="18"
        r="16"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0.3, rotate: -90 }}
        animate={{ pathLength: 1, opacity: 1, rotate: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.path
        d="M11.5 18.5L16 23L25 13.5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.38, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
      />
    </motion.svg>
  );
}

export function resolveInitialDevice(input: string): { device: string; custom: string } {
  if (!input) return { device: "", custom: "" };
  const clean = input.trim().toLowerCase();

  const exact = deviceTypes.find((d) => d.toLowerCase() === clean);
  if (exact) return { device: exact, custom: "" };

  if (clean.includes("wasch") && !clean.includes("trockner") && !clean.includes("geschirr"))
    return { device: "Waschmaschine", custom: "" };
  if (clean.includes("trockner")) return { device: "Wäschetrockner", custom: "" };
  if (clean.includes("spül") || clean.includes("geschirr") || clean.includes("spuel"))
    return { device: "Geschirrspüler", custom: "" };
  if (clean.includes("kühl") || clean.includes("gefrier") || clean.includes("kuehl"))
    return { device: "Kühlschrank / Gefriergerät", custom: "" };
  if (clean.includes("ofen") || clean.includes("herd") || clean.includes("back"))
    return { device: "Backofen / Herd", custom: "" };
  if (clean.includes("ceran") || clean.includes("induktion") || clean.includes("kochfeld"))
    return { device: "Ceranfeld / Induktion", custom: "" };
  if (clean.includes("dunst") || clean.includes("haube") || clean.includes("abzug"))
    return { device: "Dunstabzugshaube", custom: "" };
  if (clean.includes("mikro")) return { device: "Mikrowelle", custom: "" };
  if (clean.includes("kaffee") || clean.includes("espresso") || clean.includes("siebträger"))
    return { device: "Kaffeevollautomat", custom: "" };
  if (
    clean.includes("platin") ||
    clean.includes("elektronik") ||
    clean.includes("steuer") ||
    clean.includes("inverter")
  )
    return { device: "Elektronik / Platine", custom: "" };

  return { device: "Anderes Gerät (Sonstiges)", custom: input.trim() };
}

const deviceIconMap: Record<string, typeof Wrench> = {
  "Waschmaschine": RotateCw,
  "Wäschetrockner": RotateCw,
  "Geschirrspüler": Sparkles,
  "Kühlschrank / Gefriergerät": Snowflake,
  "Backofen / Herd": Flame,
  "Ceranfeld / Induktion": Zap,
  "Dunstabzugshaube": Wrench,
  "Mikrowelle": Zap,
  "Kaffeevollautomat": Sparkles,
  "Elektronik / Platine": Zap,
  "Anderes Gerät (Sonstiges)": Wrench,
};

const stepSlideVariants = {
  enter: (direction: number) => ({
    x: direction >= 0 ? 44 : -44,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction >= 0 ? -36 : 36,
    opacity: 0,
  }),
};

const WIZARD_STEPS = [
  { id: 1 as const, num: "01", title: "Gerät & Marke", short: "Gerät" },
  { id: 2 as const, num: "02", title: "Fehlerbild", short: "Symptom" },
  { id: 3 as const, num: "03", title: "Kontaktdaten", short: "Kontakt" },
];

function LocationVerifiedIndicator({
  verifiedInfo,
  streetAddress,
  zip,
  onEdit,
}: {
  verifiedInfo: VerifiedLocationInfo;
  streetAddress?: string;
  zip: string;
  onEdit?: () => void;
}) {
  const fullAddress = [
    streetAddress?.trim() || verifiedInfo.streetAddress,
    zip.trim() || verifiedInfo.zipAndCity,
  ]
    .filter(Boolean)
    .join(", ");
  const isMapPin = verifiedInfo.source === "map-pin";

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
      role="status"
      aria-live="polite"
      data-testid="location-verified-indicator"
      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-500/35 bg-emerald-500/[0.08] dark:bg-emerald-500/[0.12] px-3.5 py-2.5 text-xs"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-white ${
            isMapPin ? "bg-red-600" : "bg-emerald-600"
          }`}
        >
          {isMapPin ? <MapPin size={13} /> : <Check size={13} strokeWidth={3} />}
        </span>
        <span className="font-bold text-primary dark:text-slate-100 truncate">
          Standort gespeichert:{" "}
          <span className="text-emerald-700 dark:text-emerald-300">
            {fullAddress || "Region Osnabrück"}
          </span>
        </span>
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="shrink-0 font-extrabold text-accent hover:underline cursor-pointer"
        >
          Auf Karte ändern
        </button>
      )}
    </motion.div>
  );
}

type ToastValidationScope = "step1" | "step2" | "all";

function filterWaErrorsByScope(
  waErrors: WhatsAppValidationErrors,
  scope: ToastValidationScope
): WhatsAppValidationErrors {
  if (scope === "all") return waErrors;
  const allowed: WhatsAppValidationField[] =
    scope === "step1"
      ? ["device", "customDevice", "brand"]
      : ["device", "customDevice", "brand", "symptom"];
  const scoped: WhatsAppValidationErrors = {};
  for (const key of allowed) {
    if (waErrors[key]) {
      scoped[key] = waErrors[key];
    }
  }
  return scoped;
}

export default function RepairForm({
  defaultDevice = "",
  defaultSymptom = "",
  defaultBrand = "",
  defaultMode = "repair",
  compact = false,
}: {
  defaultDevice?: string;
  defaultSymptom?: string;
  defaultBrand?: string;
  defaultMode?: InquiryMode;
  compact?: boolean;
}) {
  const uid = useId();
  const initial = resolveInitialDevice(defaultDevice);
  const initialDraftRef = useRef<ReturnType<typeof loadRepairDraft> | undefined>(undefined);
  if (initialDraftRef.current === undefined) {
    initialDraftRef.current = loadRepairDraft();
  }
  const restoredDraft = initialDraftRef.current;
  const hasExplicitPreset = Boolean(defaultSymptom || defaultBrand);
  const hasExplicitDeviceOverride =
    Boolean(defaultDevice) && defaultDevice !== "Waschmaschine";

  const [step, setStep] = useState<1 | 2 | 3>(() =>
    restoredDraft && !hasExplicitPreset ? restoredDraft.step : 1
  );
  const [stepDirection, setStepDirection] = useState<1 | -1>(1);
  const [isStepLoading, setIsStepLoading] = useState<boolean>(true);
  const stepSkeletonTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userToggledVisitTypeRef = useRef<boolean>(Boolean(restoredDraft));
  const [values, setValues] = useState<RepairValues>(() => {
    const base: RepairValues = {
      ...emptyValues,
      inquiryMode: defaultMode,
      visitType: defaultMode === "question" ? "workshop" : "home_visit",
      device: initial.device || "Waschmaschine",
      customDevice: initial.custom,
      brand: defaultBrand || "",
      problem: defaultSymptom || "",
    };
    if (!restoredDraft) return base;
    return {
      ...base,
      ...restoredDraft.values,
      photo: null,
      inquiryMode:
        defaultMode === "question"
          ? "question"
          : restoredDraft.values.inquiryMode || defaultMode,
      visitType:
        restoredDraft.values.visitType ||
        (defaultMode === "question" ? "workshop" : "home_visit"),
      device:
        hasExplicitPreset || hasExplicitDeviceOverride
          ? initial.device || restoredDraft.values.device
          : restoredDraft.values.device,
      customDevice:
        hasExplicitPreset || hasExplicitDeviceOverride
          ? initial.custom
          : restoredDraft.values.customDevice,
      brand: defaultBrand || restoredDraft.values.brand,
      problem: defaultSymptom || restoredDraft.values.problem,
    };
  });
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(() =>
    defaultSymptom
      ? [defaultSymptom]
      : restoredDraft
      ? restoredDraft.selectedSymptoms
      : []
  );
  const [restoredFromDraft, setRestoredFromDraft] = useState<boolean>(() =>
    Boolean(restoredDraft)
  );
  const [errors, setErrors] = useState<RepairErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [submitProgress, setSubmitProgress] = useState(0);
  const [confettiBurstCount, setConfettiBurstCount] = useState(0);
  const [referenceId, setReferenceId] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [sharedMapsUrl, setSharedMapsUrl] = useState("");
  const [gpsStatus, setGpsStatus] = useState<"idle" | "locating" | "shared" | "fallback">(() =>
    restoredDraft ? restoredDraft.gpsStatus : "idle"
  );
  const [verifiedLocation, setVerifiedLocation] = useState<VerifiedLocationInfo | null>(() =>
    restoredDraft ? restoredDraft.verifiedLocation : null
  );
  const [messageText, setMessageText] = useState("");
  const [hasSentWhatsApp, setHasSentWhatsApp] = useState(false);
  const [showRedirectSuccess, setShowRedirectSuccess] = useState(false);
  const [waToastScope, setWaToastScope] = useState<ToastValidationScope | null>(null);
  const [waToastErrors, setWaToastErrors] = useState<WhatsAppValidationErrors | null>(null);
  const [copied, setCopied] = useState(false);
  const [serviceDoneRated, setServiceDoneRated] = useState(false);
  const [ratingStars, setRatingStars] = useState(5);
  const [preview, setPreview] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [submitErrorMsg, setSubmitErrorMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const redirectFeedbackTimerRef = useRef<number | null>(null);
  const prevDefaultsRef = useRef({
    defaultDevice,
    defaultSymptom,
    defaultBrand,
    defaultMode,
  });
  const isFirstDraftSyncRef = useRef(true);
  const draftStateRef = useRef({
    step,
    values,
    selectedSymptoms,
    verifiedLocation,
    gpsStatus,
    hasSentWhatsApp,
  });
  draftStateRef.current = {
    step,
    values,
    selectedSymptoms,
    verifiedLocation,
    gpsStatus,
    hasSentWhatsApp,
  };

  const triggerStepSkeleton = (durationMs = 150) => {
    if (stepSkeletonTimerRef.current) {
      clearTimeout(stepSkeletonTimerRef.current);
    }
    setIsStepLoading(true);
    stepSkeletonTimerRef.current = setTimeout(() => {
      setIsStepLoading(false);
      stepSkeletonTimerRef.current = null;
    }, durationMs);
  };

  useEffect(() => {
    const initialTimer = setTimeout(() => {
      setIsStepLoading(false);
    }, 200);
    return () => {
      clearTimeout(initialTimer);
      if (stepSkeletonTimerRef.current) {
        clearTimeout(stepSkeletonTimerRef.current);
      }
      if (redirectFeedbackTimerRef.current) {
        window.clearTimeout(redirectFeedbackTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (status === "success" && successRef.current) {
      successRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [status]);

  // Auto-save in-progress draft on every edit and flush if user closes page/tab accidentally
  useEffect(() => {
    if (isFirstDraftSyncRef.current) {
      isFirstDraftSyncRef.current = false;
      return;
    }
    if (hasSentWhatsApp) {
      clearRepairDraft();
      setRestoredFromDraft(false);
      return;
    }
    if (hasMeaningfulDraftContent(values, step, selectedSymptoms)) {
      saveRepairDraft({
        step,
        values,
        selectedSymptoms,
        verifiedLocation,
        gpsStatus,
      });
    } else {
      clearRepairDraft();
      setRestoredFromDraft(false);
    }
  }, [values, step, selectedSymptoms, verifiedLocation, gpsStatus, hasSentWhatsApp]);

  useEffect(() => {
    const flushDraft = () => {
      const current = draftStateRef.current;
      if (current.hasSentWhatsApp) return;
      if (
        hasMeaningfulDraftContent(
          current.values,
          current.step,
          current.selectedSymptoms
        )
      ) {
        saveRepairDraft({
          step: current.step,
          values: current.values,
          selectedSymptoms: current.selectedSymptoms,
          verifiedLocation: current.verifiedLocation,
          gpsStatus: current.gpsStatus,
        });
      }
    };
    window.addEventListener("pagehide", flushDraft);
    window.addEventListener("beforeunload", flushDraft);
    return () => {
      window.removeEventListener("pagehide", flushDraft);
      window.removeEventListener("beforeunload", flushDraft);
    };
  }, []);

  // Sync external device / symptom / brand selection smoothly (only when props change after mount)
  useEffect(() => {
    if (prevDefaultsRef.current.defaultDevice === defaultDevice) return;
    prevDefaultsRef.current.defaultDevice = defaultDevice;
    if (defaultDevice) {
      const resolved = resolveInitialDevice(defaultDevice);
      setValues((prev) => ({
        ...prev,
        device: resolved.device || prev.device,
        customDevice: resolved.custom,
      }));
      setStatus("idle");
    }
  }, [defaultDevice]);

  useEffect(() => {
    if (prevDefaultsRef.current.defaultSymptom === defaultSymptom) return;
    prevDefaultsRef.current.defaultSymptom = defaultSymptom;
    if (defaultSymptom) {
      setSelectedSymptoms([defaultSymptom]);
      setValues((prev) => ({
        ...prev,
        problem: defaultSymptom,
      }));
      setStatus("idle");
    }
  }, [defaultSymptom]);

  useEffect(() => {
    if (prevDefaultsRef.current.defaultBrand === defaultBrand) return;
    prevDefaultsRef.current.defaultBrand = defaultBrand;
    if (defaultBrand) {
      setValues((prev) => ({
        ...prev,
        brand: defaultBrand,
      }));
      setStatus("idle");
    }
  }, [defaultBrand]);

  useEffect(() => {
    if (prevDefaultsRef.current.defaultMode === defaultMode) return;
    prevDefaultsRef.current.defaultMode = defaultMode;
    setValues((prev) => ({
      ...prev,
      inquiryMode: defaultMode,
      visitType: userToggledVisitTypeRef.current
        ? prev.visitType
        : defaultMode === "question"
        ? "workshop"
        : "home_visit",
    }));
  }, [defaultMode]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const id = (k: string) => `${uid}-${k}`;

  const valuesRef = useRef(values);
  valuesRef.current = values;

  useEffect(() => {
    if (!waToastScope || status === "success") {
      setWaToastErrors(null);
      return;
    }
    const nextWaErrors = filterWaErrorsByScope(
      validateWhatsAppFields(toWhatsAppInput(values)),
      waToastScope
    );
    if (Object.keys(nextWaErrors).length === 0) {
      setWaToastErrors(null);
      setWaToastScope(null);
    } else {
      setWaToastErrors(nextWaErrors);
    }
  }, [values, waToastScope, status]);

  const jumpToMissingField = (field: WhatsAppValidationField) => {
    const domField = field === "symptom" ? "problem" : field;
    if (valuesRef.current.inquiryMode !== "question") {
      if (field === "device" || field === "customDevice" || field === "brand") {
        if (step !== 1) {
          setStepDirection(-1);
          setStep(1);
        }
      } else if (field === "symptom") {
        if (step !== 2) {
          setStepDirection(step < 2 ? 1 : -1);
          setStep(2);
        }
      } else if (field === "name" || field === "phone") {
        if (step !== 3) {
          setStepDirection(1);
          setStep(3);
        }
      }
    }
    setTimeout(() => {
      const target = formRef.current?.querySelector<HTMLElement>(`[data-field="${domField}"]`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.focus();
      }
    }, 80);
  };

  const set = <K extends keyof RepairValues>(k: K, val: RepairValues[K]) => {
    const next = { ...valuesRef.current, [k]: val };
    valuesRef.current = next;
    setValues(next);
    if (errors[k]) {
      setErrors((prevErrors) => ({ ...prevErrors, [k]: validateField(k, next) }));
    }
  };

  const blur = (k: keyof RepairValues) => {
    const raw = valuesRef.current[k];
    const isEmpty = typeof raw === "string" ? raw.trim().length === 0 : !raw;
    // Empty required fields ("réponse vide") are only flagged when advancing/submitting,
    // unless an error is already shown or the user entered invalid non-empty text.
    if (isEmpty && !errors[k]) {
      return;
    }
    const fieldErr = validateField(k, valuesRef.current);
    setErrors((prev) => ({ ...prev, [k]: fieldErr }));
  };

  function toggleSymptomChip(symptom: string) {
    const isAlreadySelected = selectedSymptoms.includes(symptom);
    const nextChips = isAlreadySelected
      ? selectedSymptoms.filter((s) => s !== symptom)
      : [...selectedSymptoms, symptom];
    setSelectedSymptoms(nextChips);

    const currentText = valuesRef.current.problem.trim();
    const nextProblem = !isAlreadySelected
      ? currentText
        ? currentText.includes(symptom)
          ? currentText
          : `${currentText}; ${symptom}`
        : symptom
      : currentText
          .split(";")
          .map((s) => s.trim())
          .filter((s) => s && s !== symptom)
          .join("; ");

    const next = { ...valuesRef.current, problem: nextProblem };
    valuesRef.current = next;
    setValues(next);
    if (errors.problem) {
      setErrors((prevErrors) => ({ ...prevErrors, problem: validateField("problem", next) }));
    }
  }

  function onPhoto(file: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file && file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
    const next = { ...values, photo: file };
    setValues(next);
    setErrors((prev) => ({ ...prev, photo: validateField("photo", next) }));
  }

  function goToStep(targetStep: 1 | 2 | 3) {
    if (targetStep === step) return;

    // Going backwards is always allowed immediately and clears active step errors
    if (targetStep < step) {
      setErrors({});
      setWaToastScope(null);
      setWaToastErrors(null);
      setStepDirection(-1);
      setStep(targetStep);
      triggerStepSkeleton(140);
      return;
    }

    // Validate Step 1 via step1Schema (device, customDevice, brand, model) before advancing past Step 1
    if (step === 1 && targetStep >= 2) {
      const step1Errors = validateStep(1, values);
      if (Object.keys(step1Errors).length > 0) {
        setErrors(step1Errors);
        const scopedWa = filterWaErrorsByScope(
          validateWhatsAppFields(toWhatsAppInput(values)),
          "step1"
        );
        if (Object.keys(scopedWa).length > 0) {
          setWaToastScope("step1");
          setWaToastErrors(scopedWa);
        }
        const firstKey = Object.keys(step1Errors)[0];
        formRef.current?.querySelector<HTMLElement>(`[data-field="${firstKey}"]`)?.focus();
        return;
      }
    }

    // Validate Step 2 via step2Schema (problem description & optional photo) before advancing to Step 3
    if (targetStep === 3) {
      const step2Errors = validateStep(2, values);
      if (Object.keys(step2Errors).length > 0) {
        setErrors(step2Errors);
        const scopedWa = filterWaErrorsByScope(
          validateWhatsAppFields(toWhatsAppInput(values)),
          "step2"
        );
        if (Object.keys(scopedWa).length > 0) {
          setWaToastScope("step2");
          setWaToastErrors(scopedWa);
        }
        if (step !== 2) {
          setStepDirection(1);
          setStep(2);
          triggerStepSkeleton(140);
        }
        setTimeout(() => {
          const firstKey = Object.keys(step2Errors)[0];
          formRef.current?.querySelector<HTMLElement>(`[data-field="${firstKey}"]`)?.focus();
        }, 160);
        return;
      }
    }

    setErrors({});
    setWaToastScope(null);
    setWaToastErrors(null);
    setStepDirection(1);
    setStep(targetStep);
    triggerStepSkeleton(150);
  }

  function switchInquiryMode(mode: InquiryMode) {
    if (values.inquiryMode === mode) return;
    setErrors({});
    setWaToastScope(null);
    setWaToastErrors(null);
    setValues((prev) => ({
      ...prev,
      inquiryMode: mode,
      visitType: userToggledVisitTypeRef.current
        ? prev.visitType
        : mode === "question"
        ? "workshop"
        : "home_visit",
    }));
  }

  function handleVisitTypeChange(nextVisitType: ServiceVisitType) {
    userToggledVisitTypeRef.current = true;
    setValues((prev) => ({
      ...prev,
      visitType: nextVisitType,
    }));
    setErrors((prev) => ({ ...prev, zip: undefined }));
  }

  function handleConfirmMapPin(verified: VerifiedLocationInfo) {
    userToggledVisitTypeRef.current = true;
    setVerifiedLocation(verified);
    setGpsStatus("shared");
    setValues((prev) => ({
      ...prev,
      visitType: "home_visit",
      mapsLocationUrl: verified.mapsUrl,
      zip: verified.zipAndCity || prev.zip || "49082 Osnabrück",
      streetAddress: verified.streetAddress || prev.streetAddress || "",
      locationVerified: true,
      coordinates: {
        lat: verified.lat,
        lng: verified.lng,
        accuracy: verified.accuracy,
      },
    }));
    setErrors((prev) => ({ ...prev, zip: undefined }));
    setIsMapModalOpen(false);
  }

  function shareGoogleMapsLocation() {
    setGpsStatus("locating");

    const applyFallbackVerification = () => {
      const fallbackInfo = resolveVerifiedFallbackLocation(
        values.zip || "49082 Osnabrück",
        values.streetAddress
      );
      setVerifiedLocation(fallbackInfo);
      setGpsStatus("fallback");
      setValues((prev) => ({
        ...prev,
        mapsLocationUrl: fallbackInfo.mapsUrl,
        zip: prev.zip.trim() ? prev.zip : fallbackInfo.zipAndCity,
        streetAddress: prev.streetAddress?.trim()
          ? prev.streetAddress
          : fallbackInfo.streetAddress,
        locationVerified: true,
        coordinates: {
          lat: fallbackInfo.lat,
          lng: fallbackInfo.lng,
          accuracy: fallbackInfo.accuracy,
        },
      }));
      setErrors((prev) => ({ ...prev, zip: undefined }));
    };

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const info = await reverseGeocodePosition(
              pos.coords.latitude,
              pos.coords.longitude,
              pos.coords.accuracy
            );
            setVerifiedLocation(info);
            setGpsStatus("shared");
            setValues((prev) => ({
              ...prev,
              mapsLocationUrl: info.mapsUrl,
              zip: info.zipAndCity || prev.zip || "49082 Osnabrück",
              streetAddress: info.streetAddress || prev.streetAddress || "",
              locationVerified: true,
              coordinates: {
                lat: info.lat,
                lng: info.lng,
                accuracy: info.accuracy,
              },
            }));
            setErrors((prev) => ({ ...prev, zip: undefined }));
          } catch {
            applyFallbackVerification();
          }
        },
        () => {
          applyFallbackVerification();
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
      );
    } else {
      applyFallbackVerification();
    }
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (status === "loading" || status === "completing") return;

    const isQuestion = values.inquiryMode === "question";

    // In 3-step repair wizard mode, pressing Enter in Step 1 or Step 2 advances to the next step
    if (!isQuestion) {
      if (step === 1) {
        goToStep(2);
        return;
      }
      if (step === 2) {
        goToStep(3);
        return;
      }
    }

    // Validate required fields (Device, Brand, Problem/Question, Location, Name, Phone)
    const found = validate(values);
    const waErrors = validateWhatsAppFields(toWhatsAppInput(values));
    if (Object.keys(found).length > 0 || Object.keys(waErrors).length > 0) {
      if (Object.keys(waErrors).length > 0) {
        setWaToastScope("all");
        setWaToastErrors(waErrors);
      }
      setErrors(found);
      const firstKey = Object.keys(found)[0] || Object.keys(waErrors)[0];
      if (firstKey) {
        if (!isQuestion) {
          if (["device", "customDevice", "brand"].includes(firstKey)) {
            setStepDirection(-1);
            setStep(1);
          } else if (["problem", "symptom", "photo"].includes(firstKey)) {
            setStepDirection(-1);
            setStep(2);
          }
        }
        const domKey = firstKey === "symptom" ? "problem" : firstKey;
        setTimeout(() => {
          formRef.current?.querySelector<HTMLElement>(`[data-field="${domKey}"]`)?.focus();
        }, 50);
      }
      return;
    }

    setWaToastScope(null);
    setWaToastErrors(null);

    setErrors({});
    setSubmitErrorMsg(null);
    setStatus("loading");
    setSubmitProgress(28);
    const stepTimer1 = setTimeout(() => setSubmitProgress(68), 180);
    const stepTimer2 = setTimeout(() => setSubmitProgress(92), 360);

    try {
      const res = await submitRepairRequest(values, honeypot);
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setSubmitProgress(100);
      setReferenceId(res.referenceId);
      setWhatsappUrl(res.whatsappUrl);
      setSharedMapsUrl(res.mapsLocationUrl);
      setMessageText(res.messageText);
      setHasSentWhatsApp(false);
      setStatus("completing");

      await new Promise((r) => setTimeout(r, 320));
      setStatus("success");
    } catch (err) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setSubmitProgress(0);
      setSubmitErrorMsg(err instanceof Error ? err.message : null);
      setStatus("error");
    }
  }

  async function copyMessage() {
    if (!messageText) return;
    try {
      await navigator.clipboard?.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignore clipboard permission errors
    }
  }

  function triggerRedirectSuccessFeedback() {
    setShowRedirectSuccess(true);
    if (redirectFeedbackTimerRef.current) {
      window.clearTimeout(redirectFeedbackTimerRef.current);
    }
    redirectFeedbackTimerRef.current = window.setTimeout(() => {
      setShowRedirectSuccess(false);
      redirectFeedbackTimerRef.current = null;
    }, 2600);
  }

  function reset() {
    if (redirectFeedbackTimerRef.current) {
      window.clearTimeout(redirectFeedbackTimerRef.current);
      redirectFeedbackTimerRef.current = null;
    }
    userToggledVisitTypeRef.current = false;
    setIsMapModalOpen(false);
    onPhoto(null);
    setSelectedSymptoms([]);
    setGpsStatus("idle");
    setVerifiedLocation(null);
    setSharedMapsUrl("");
    setValues({
      ...emptyValues,
      inquiryMode: values.inquiryMode || "repair",
      visitType: values.inquiryMode === "question" ? "workshop" : "home_visit",
      device: initial.device || "Waschmaschine",
      customDevice: initial.custom,
      brand: defaultBrand || "",
    });
    setErrors({});
    setStepDirection(-1);
    setStep(1);
    setSubmitProgress(0);
    setStatus("idle");
    setReferenceId("");
    setWhatsappUrl("");
    setMessageText("");
    setHasSentWhatsApp(false);
    setShowRedirectSuccess(false);
    setWaToastScope(null);
    setWaToastErrors(null);
    setRestoredFromDraft(false);
    clearRepairDraft();
  }

  const isSubmitting = status === "loading" || status === "completing";
  const isQuestionMode = values.inquiryMode === "question";
  const isHomeVisit = values.visitType !== "workshop";
  const currentSymptoms = symptomsByDevice[values.device] || symptomsByDevice["Anderes Gerät (Sonstiges)"];
  const currentDiagnostic =
    diagnosticHintByDevice[values.device] || diagnosticHintByDevice["Waschmaschine"];

  const step1Complete = step1Schema.safeParse(values).success;
  const step2Complete = step2Schema.safeParse(values).success;
  const step3Complete = step3Schema.safeParse(values).success;

  // Compute live completion percentage across active required fields
  const completedCount = isHomeVisit
    ? [
        Boolean(values.device.trim() || isQuestionMode),
        values.problem.trim().length >= 4,
        values.zip.trim().length >= 3,
        values.name.trim().length >= 2,
        values.phone.replace(/\D/g, "").length >= 6,
      ].filter(Boolean).length
    : [
        Boolean(values.device.trim() || isQuestionMode),
        values.problem.trim().length >= 4,
        values.name.trim().length >= 2,
        values.phone.replace(/\D/g, "").length >= 6,
      ].filter(Boolean).length;
  const fieldPercent = Math.round((completedCount / (isHomeVisit ? 5 : 4)) * 100);
  const stepBasePercent = isQuestionMode ? 100 : step === 1 ? 33 : step === 2 ? 67 : 100;
  const progressPercent = isQuestionMode
    ? Math.max(fieldPercent, 35)
    : Math.max(fieldPercent, step === 1 ? 25 : step === 2 ? 60 : 88);
  const liveMapsPreviewUrl = isHomeVisit ? buildClientGoogleMapsLink(values) : "";

  if (status === "success") {
    return (
      <motion.div
        ref={successRef}
        role="status"
        aria-live="polite"
        initial={{ opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
        className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border border-emerald-500/35 bg-white dark:bg-slate-900 shadow-[0_24px_60px_-15px_rgba(16,185,129,0.22)] ${
          compact ? "p-4 sm:p-6" : "p-4 sm:p-8 lg:p-10"
        }`}
      >
        {/* Confetti Celebration — ONLY AFTER client actually clicks Send via WhatsApp */}
        {hasSentWhatsApp && <CelebrationConfetti triggerKey={confettiBurstCount} />}

        {/* Top Status Progress Bar */}
        <motion.div
          className={`absolute top-0 inset-x-0 h-1.5 ${
            hasSentWhatsApp
              ? "bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500"
              : "bg-gradient-to-r from-amber-400 via-emerald-500 to-emerald-600"
          }`}
          initial={{ scaleX: 0, transformOrigin: "left" }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Status Banner: Clear distinction between Prepared (not sent yet) vs. Sent via WhatsApp */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
          className={`mb-5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold ${
            hasSentWhatsApp
              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
              : "border-amber-500/35 bg-amber-500/10 text-amber-900 dark:text-amber-200"
          }`}
        >
          <span className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                hasSentWhatsApp ? "bg-emerald-500 animate-ping" : "bg-amber-500"
              }`}
            />
            {hasSentWhatsApp
              ? "Nachricht für WhatsApp geöffnet & an Herrn Hannachi übergeben"
              : "Noch nicht gesendet – bitte jetzt per WhatsApp an Herrn Hannachi senden"}
          </span>
          <span className="font-mono tabular-nums">
            {hasSentWhatsApp ? "WhatsApp gestartet" : "Letzter Schritt"}
          </span>
        </motion.div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-primary/8 dark:border-white/10 pb-6">
          <div className="flex items-center gap-4 min-w-0">
            {hasSentWhatsApp ? (
              <motion.button
                type="button"
                onClick={() => setConfettiBurstCount((c) => c + 1)}
                title="Feier-Effekt abspielen"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileTap={{ scale: 0.92 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 18,
                  delay: 0.05,
                }}
                className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 shadow-inner cursor-pointer"
              >
                {BADGE_SPARK_ANGLES.map((deg, idx) => {
                  const rad = (deg * Math.PI) / 180;
                  const tx = Math.cos(rad) * 38;
                  const ty = Math.sin(rad) * 38;
                  return (
                    <motion.span
                      key={`${confettiBurstCount}-${deg}`}
                      aria-hidden="true"
                      className="pointer-events-none absolute h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: CONFETTI_COLORS[idx % CONFETTI_COLORS.length],
                      }}
                      initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                      animate={{
                        x: tx,
                        y: ty,
                        scale: [0, 1.25, 0],
                        opacity: [1, 1, 0],
                      }}
                      transition={{
                        duration: 0.65,
                        delay: 0.12 + idx * 0.02,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    />
                  );
                })}
                <motion.span
                  className="absolute inset-0 rounded-2xl border-2 border-emerald-500/40"
                  initial={{ scale: 0.85, opacity: 0.8 }}
                  animate={{ scale: 1.28, opacity: 0 }}
                  transition={{ duration: 0.75, delay: 0.15, ease: "easeOut" }}
                />
                <AnimatedCheckmark size={34} />
              </motion.button>
            ) : (
              <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <MessageCircle size={30} />
              </div>
            )}
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="min-w-0"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <span>
                  {hasSentWhatsApp
                    ? "WhatsApp-Versand gestartet"
                    : "Nachricht fertig vorbereitet"}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums font-bold">Ref #{referenceId}</span>
              </div>
              <h3 className="mt-1 text-xl sm:text-3xl font-extrabold text-primary dark:text-slate-100">
                {hasSentWhatsApp
                  ? `Vielen Dank, ${values.name}!`
                  : `Jetzt per WhatsApp absenden, ${values.name}`}
              </h3>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-xl bg-surface px-4 py-2.5 text-left sm:text-right border border-primary/8 dark:border-white/10"
          >
            <p className="text-[11px] font-semibold text-ink-muted">
              {hasSentWhatsApp ? "Voraussichtliche Rückmeldung" : "Empfänger"}
            </p>
            <p className="text-sm font-extrabold text-primary dark:text-slate-100 tabular-nums">
              {hasSentWhatsApp ? "In ca. 30–60 Min." : "Herr Hannachi (WhatsApp)"}
            </p>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 text-sm sm:text-base leading-relaxed text-ink-muted"
        >
          {hasSentWhatsApp ? (
            <>
              Ihre{" "}
              {isQuestionMode ? "direkte Frage zu " : "komplette Reparaturanfrage für "}
              <strong className="text-primary dark:text-slate-100">
                {values.device}
                {values.brand ? ` (${values.brand})` : ""}
              </strong>{" "}
              {isHomeVisit && values.zip ? `(${values.zip}) ` : "(Werkstatt / Beratung) "}
              wurde für WhatsApp an{" "}
              <strong className="text-emerald-700 dark:text-emerald-400">Herrn Hannachi</strong> geöffnet. Bitte klicken Sie in WhatsApp nur noch auf Senden.
            </>
          ) : isQuestionMode ? (
            <>
              Ihre direkte Frage zu{" "}
              <strong className="text-primary dark:text-slate-100">
                {values.device}
                {values.brand ? ` (${values.brand})` : ""}
              </strong>{" "}
              {isHomeVisit && values.zip ? (
                <>
                  aus <strong className="text-primary dark:text-slate-100">{values.zip}</strong>{" "}
                </>
              ) : null}
              ist vorbereitet, aber{" "}
              <strong className="text-primary dark:text-slate-100">noch nicht versendet</strong>. Klicken Sie jetzt unten, um die Nachricht ausschließlich per{" "}
              <strong className="text-emerald-700 dark:text-emerald-400">WhatsApp an Herrn Hannachi</strong> zu senden:
            </>
          ) : (
            <>
              Ihre komplette Reparaturanfrage für{" "}
              <strong className="text-primary dark:text-slate-100">
                {values.device}
                {values.brand ? ` (${values.brand})` : ""}
              </strong>{" "}
              {isHomeVisit && values.zip ? (
                <>
                  in <strong className="text-primary dark:text-slate-100">{values.zip}</strong>{" "}
                </>
              ) : (
                <> (Werkstatt / ohne Anfahrt) </>
              )}
              ist vorbereitet, aber{" "}
              <strong className="text-primary dark:text-slate-100">noch nicht versendet</strong>. Klicken Sie jetzt unten, um die Nachricht ausschließlich per{" "}
              <strong className="text-emerald-700 dark:text-emerald-400">WhatsApp an Herrn Hannachi</strong> zu senden:
            </>
          )}
        </motion.p>

        {/* Primary WhatsApp-ONLY Send Action — distraction-free before sending */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6"
        >
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              const waErrors = validateWhatsAppFields(toWhatsAppInput(values));
              if (Object.keys(waErrors).length > 0) {
                e.preventDefault();
                setStatus("idle");
                setWaToastScope("all");
                setWaToastErrors(waErrors);
                const firstKey = Object.keys(waErrors)[0] as WhatsAppValidationField | undefined;
                if (firstKey) jumpToMissingField(firstKey);
                return;
              }
              setWaToastScope(null);
              setWaToastErrors(null);
              clearRepairDraft();
              setRestoredFromDraft(false);
              setConfettiBurstCount((c) => c + 1);
              setHasSentWhatsApp(true);
              triggerRedirectSuccessFeedback();
            }}
            data-testid="send-whatsapp-only-cta"
            data-variant="hover-emerald"
            className="btn-whatsapp-hover group flex w-full items-center justify-center gap-2.5 rounded-2xl bg-emerald-600 px-4 sm:px-6 py-4 text-center text-sm sm:text-base font-extrabold leading-snug text-white shadow-lg shadow-emerald-600/30 transition-all duration-200 hover:bg-emerald-700 hover:-translate-y-0.5"
          >
            <AnimatePresence mode="wait" initial={false}>
              {showRedirectSuccess ? (
                <motion.span
                  key="wa-cta-confirmed-icon"
                  initial={{ scale: 0.5, rotate: -25, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 20 }}
                  className="inline-flex shrink-0 items-center justify-center rounded-full bg-white/20 p-0.5"
                >
                  <CheckCircle2 size={20} className="text-emerald-200" aria-hidden="true" />
                </motion.span>
              ) : (
                <motion.span
                  key="wa-cta-default-icon"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.16 }}
                  className="whatsapp-hover-icon inline-flex shrink-0"
                >
                  <MessageCircle size={20} aria-hidden="true" />
                </motion.span>
              )}
            </AnimatePresence>
            <span>
              {showRedirectSuccess
                ? "WhatsApp-Weiterleitung bestätigt"
                : hasSentWhatsApp
                ? "WhatsApp erneut öffnen & Nachricht senden"
                : isQuestionMode
                ? "Fertige Frage jetzt per WhatsApp an Herrn Hannachi senden"
                : "Komplette Anfrage jetzt per WhatsApp an Herrn Hannachi senden"}
            </span>
            <ArrowRight size={17} className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
          </a>

          {/* Short Success Animation directly in the submit area after confirming WhatsApp redirect */}
          <AnimatePresence>
            {showRedirectSuccess && (
              <motion.div
                key="whatsapp-redirect-success-feedback"
                role="status"
                aria-live="polite"
                data-testid="whatsapp-redirect-success-animation"
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 360, damping: 26 }}
                className="relative mt-3 overflow-hidden rounded-2xl border border-emerald-500/40 bg-emerald-500/12 dark:bg-emerald-500/15 px-3.5 py-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <motion.span
                    initial={{ scale: 0.4, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 460, damping: 18, delay: 0.04 }}
                    className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  >
                    <motion.span
                      aria-hidden="true"
                      initial={{ scale: 0.75, opacity: 0.85 }}
                      animate={{ scale: 1.55, opacity: 0 }}
                      transition={{ duration: 0.75, ease: "easeOut" }}
                      className="absolute inset-0 rounded-xl border-2 border-emerald-500"
                    />
                    <CheckCircle2 size={21} strokeWidth={2.5} aria-hidden="true" />
                  </motion.span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-extrabold text-emerald-800 dark:text-emerald-300 leading-tight">
                      WhatsApp geöffnet – Weiterleitung erfolgreich!
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-emerald-700/85 dark:text-emerald-200/80 leading-snug">
                      Bitte senden Sie die vorausgefüllte Nachricht direkt in WhatsApp ab.
                    </p>
                  </div>
                </div>

                <motion.span
                  aria-hidden="true"
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: 2.55, ease: "linear" }}
                  style={{ transformOrigin: "left" }}
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-emerald-500/75"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {!hasSentWhatsApp && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
              <span>Mit Klick öffnet sich WhatsApp direkt mit Ihrer vollständigen Nachricht.</span>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="font-semibold text-ink-muted hover:text-primary dark:hover:text-slate-100 underline whitespace-nowrap cursor-pointer"
              >
                ← Angaben korrigieren
              </button>
            </div>
          )}
        </motion.div>

        {/* Post-send Details, Message Summary, Maps Check & Review Journey — shown ONLY AFTER client initiates WhatsApp send */}
        {hasSentWhatsApp && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="mt-5 rounded-2xl border border-emerald-500/35 bg-emerald-500/[0.06] dark:bg-emerald-500/[0.09] p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-emerald-500/20 text-xs">
                <span className="inline-flex items-center gap-2 font-extrabold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 size={15} />
                  Gesendete WhatsApp-Nachricht an Herrn Hannachi ({isQuestionMode ? "Direkte Frage" : "Komplette Anfrage"})
                </span>
                <span className="rounded-md bg-emerald-600/15 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-800 dark:text-emerald-300 tabular-nums">
                  #{referenceId} · Nur WhatsApp
                </span>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-primary dark:text-slate-100">
                {messageText}
              </pre>
            </motion.div>

            {isHomeVisit && (sharedMapsUrl || liveMapsPreviewUrl) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white">
                    <MapPin size={15} />
                  </span>
                  <p className="font-bold text-primary dark:text-slate-100 truncate">
                    Standort im Ticket:{" "}
                    <span className="text-emerald-700 dark:text-emerald-300">
                      {[values.streetAddress?.trim(), values.zip.trim()].filter(Boolean).join(", ") || "Osnabrück"}
                    </span>
                  </p>
                </div>
                <a
                  href={sharedMapsUrl || liveMapsPreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[38px] w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl bg-white dark:bg-slate-800 border border-primary/15 dark:border-white/15 px-3 py-1.5 text-center font-extrabold text-accent hover:underline shrink-0"
                >
                  <span>Auf Karte öffnen</span>
                  <ExternalLink size={12} className="shrink-0" />
                </a>
              </motion.div>
            )}

            <div className="mt-3 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5">
              <button
                type="button"
                onClick={copyMessage}
                className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-primary/15 dark:border-white/15 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-primary dark:text-slate-100 hover:border-accent hover:text-accent transition-colors sm:whitespace-nowrap cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check size={15} className="text-emerald-600 shrink-0" /> Nachricht kopiert!
                  </>
                ) : (
                  <>
                    <Copy size={15} className="shrink-0" /> Fertigen WhatsApp-Text kopieren
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={reset}
                className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-primary/15 dark:border-white/15 bg-surface px-4 py-2.5 text-xs font-semibold text-ink-muted hover:text-primary dark:hover:text-slate-100 transition-colors sm:ml-auto cursor-pointer"
              >
                Weitere Anfrage / Frage stellen
              </button>
            </div>

            {/* 4-Step Repair Journey Tracker & Automatic Google Maps Rating upon Service Completion */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 sm:mt-7 rounded-2xl border border-accent/25 bg-accent/[0.04] dark:bg-slate-800/70 p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-primary/8 dark:border-white/10">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-accent">
                    Ihr 4-Schritte-Reparaturablauf
                  </p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {serviceDoneRated
                      ? "Schritt 4/4 erreicht: Service abgeschlossen – vielen Dank für Ihre Google-Maps-Bewertung!"
                      : "Schritt 1/4 abgeschlossen – Herr Hannachi übernimmt jetzt per WhatsApp."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setServiceDoneRated((prev) => !prev)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all text-center cursor-pointer ${
                    serviceDoneRated
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white dark:bg-slate-900 border border-primary/15 dark:border-white/15 text-primary dark:text-slate-100 hover:border-accent hover:text-accent"
                  }`}
                >
                  {serviceDoneRated ? "✓ Service abgeschlossen" : "Service erledigt? → Jetzt bewerten"}
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { stepNum: 1, label: "Anfrage", sub: "Per WhatsApp bereit", done: true },
                  { stepNum: 2, label: "Diagnose", sub: "In 30–60 Min.", done: serviceDoneRated, active: !serviceDoneRated },
                  { stepNum: 3, label: "Reparatur", sub: "Vor Ort / Werkstatt", done: serviceDoneRated, active: false },
                  { stepNum: 4, label: "Abschluss", sub: "Google Bewertung", done: serviceDoneRated, active: serviceDoneRated },
                ].map((item) => (
                  <div
                    key={item.stepNum}
                    className={`rounded-xl border p-2.5 transition-all ${
                      item.done
                        ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                        : item.active
                        ? "border-accent bg-white dark:bg-slate-900 text-primary dark:text-slate-100 shadow-xs"
                        : "border-primary/8 dark:border-white/10 bg-white/60 dark:bg-slate-900/40 text-ink-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between font-extrabold">
                      <span>0{item.stepNum}. {item.label}</span>
                      {item.done && <Check size={13} className="text-emerald-500" />}
                    </div>
                    <p className="mt-0.5 text-[11px] opacity-80">{item.sub}</p>
                  </div>
                ))}
              </div>

              {serviceDoneRated && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 pt-4 border-t border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setRatingStars(s)}
                          className="p-0.5 cursor-pointer"
                          aria-label={`${s} Sterne`}
                        >
                          <Star
                            size={20}
                            className={
                              s <= ratingStars
                                ? "fill-amber-400 text-amber-400"
                                : "text-primary/20 dark:text-white/20"
                            }
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-xs font-extrabold text-primary dark:text-slate-100">
                        {ratingStars},0 ★ für Google Maps ausgewählt
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink-muted">
                      Ihr Gerät läuft wieder! Unterstützen Sie unseren Meisterbetrieb in Osnabrück mit Ihrer Bewertung auf Google Maps:
                    </p>
                  </div>
                  <a
                    href={business.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] w-full sm:w-auto shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-5 py-2.5 text-center text-xs font-extrabold text-slate-950 shadow-md transition-all sm:whitespace-nowrap"
                  >
                    <MapPin size={15} className="shrink-0" />
                    <span>Auf Google Maps bewerten ({ratingStars} ★)</span>
                    <ArrowRight size={14} className="shrink-0" />
                  </a>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
        <ValidationToast
          errors={waToastErrors}
          mode={isQuestionMode ? "question" : "repair"}
          onDismiss={() => {
            setWaToastScope(null);
            setWaToastErrors(null);
          }}
          onFieldSelect={jumpToMissingField}
        />
      </motion.div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.1)] ${
        compact ? "p-4 sm:p-6" : "p-4 sm:p-8 lg:p-10"
      }`}
      aria-labelledby={id("title")}
    >
      {/* Hidden anti-spam honeypot field for automated bots */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor={id("website-hp")}>Bitte dieses Feld leer lassen</label>
        <input
          id={id("website-hp")}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>
      {/* Top Animated Gradient Progress Bar */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-surface-muted overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-accent via-sky-400 to-emerald-500"
          initial={{ width: "20%" }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* Form Header, 2-Tab Mode Switcher & Wizard Progress Track */}
      <fieldset disabled={isSubmitting} className="min-w-0 border-0 p-0 m-0">
      <div className="pb-6 border-b border-primary/8 dark:border-white/10 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-accent">
              <span>
                {isQuestionMode
                  ? "Direkt-Nachricht in 1 Schritt"
                  : `Schritt ${step} von 3 · Komplette Reparaturanfrage`}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-ink-muted tabular-nums">
                Osnabrück &amp; gesamtes Umland
              </span>
            </div>
            <h2 id={id("title")} className="mt-1 text-2xl font-extrabold text-primary dark:text-slate-100 sm:text-3xl">
              {isQuestionMode
                ? "Direkte Frage an Herrn Hannachi"
                : compact
                ? "Schnellanfrage an Herrn Hannachi"
                : "Reparaturanfrage & Fehlerdiagnose"}
            </h2>
          </div>
        </div>

        {/* 2-Tab Switcher: Complete Repair Request vs. Quick Question */}
        <div
          role="tablist"
          aria-label="Art Ihrer Anfrage wählen"
          className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-2xl bg-surface dark:bg-slate-800/80 p-1.5 border border-primary/10 dark:border-white/10"
        >
          <button
            type="button"
            role="tab"
            aria-selected={!isQuestionMode}
            onClick={() => switchInquiryMode("repair")}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              !isQuestionMode
                ? "bg-primary dark:bg-accent text-white shadow-sm"
                : "text-ink-muted hover:text-primary dark:hover:text-white"
            }`}
          >
            <Wrench size={16} className={!isQuestionMode ? "text-accent-light dark:text-white" : "text-accent"} />
            <span>Komplette Reparaturanfrage</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isQuestionMode}
            onClick={() => switchInquiryMode("question")}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              isQuestionMode
                ? "bg-primary dark:bg-accent text-white shadow-sm"
                : "text-ink-muted hover:text-primary dark:hover:text-white"
            }`}
          >
            <HelpCircle size={16} className={isQuestionMode ? "text-accent-light dark:text-white" : "text-accent"} />
            <span>Direkte Frage stellen (1 Schritt)</span>
          </button>
        </div>

        {/* 3-Step Interactive Progress Wizard Bar (Shown in Complete Repair Request mode) */}
        {!isQuestionMode && (
          <div>
            <div className="grid grid-cols-3 gap-2">
              {WIZARD_STEPS.map((ws) => {
                const isCurrent = step === ws.id;
                const isDone =
                  (ws.id === 1 && step1Complete && step > 1) ||
                  (ws.id === 2 && step2Complete && step > 2) ||
                  (ws.id === 3 && step3Complete);

                return (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => goToStep(ws.id)}
                    className={`group flex flex-col gap-2 rounded-2xl border p-3 text-left transition-all ${
                      isCurrent
                        ? "border-accent bg-accent/10 shadow-xs"
                        : isDone
                        ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50"
                        : "border-primary/10 dark:border-white/10 bg-surface/70 dark:bg-slate-800/60 hover:border-primary/25 dark:hover:border-white/25"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-extrabold tabular-nums transition-colors ${
                          isCurrent
                            ? "bg-accent text-white"
                            : isDone
                            ? "bg-emerald-500 text-white"
                            : "bg-primary/10 dark:bg-white/10 text-ink-muted"
                        }`}
                      >
                        {isDone ? <Check size={13} /> : ws.num}
                      </span>
                      <span
                        className={`text-[11px] font-bold truncate ${
                          isCurrent
                            ? "text-accent dark:text-accent-light"
                            : isDone
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-ink-muted"
                        }`}
                      >
                        <span className="hidden sm:inline">{ws.title}</span>
                        <span className="sm:hidden">{ws.short}</span>
                      </span>
                    </div>

                    {/* Individual Step Progress Fill Line */}
                    <div className="h-1 w-full rounded-full bg-primary/10 dark:bg-white/10 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          isDone
                            ? "bg-emerald-500"
                            : isCurrent
                            ? "bg-accent"
                            : "bg-transparent"
                        }`}
                        initial={{ width: "0%" }}
                        animate={{
                          width: isDone ? "100%" : isCurrent ? "65%" : "0%",
                        }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Saved Draft Restored Notice */}
      <AnimatePresence>
        {restoredFromDraft && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mt-4 flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-900 dark:text-emerald-200"
          >
            <span className="flex items-center gap-2 font-semibold">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
              <span>Ihre bisherigen Angaben wurden automatisch gespeichert und wiederhergestellt.</span>
            </span>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-600/25 bg-white/80 dark:bg-slate-900/80 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RotateCw size={12} aria-hidden />
              <span>Neu starten</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zod Validation Summary Alert Banner */}
      <AnimatePresence>
        {Object.values(errors).some(Boolean) && (
          <motion.div
            role="alert"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mt-4 flex items-start gap-2.5 rounded-2xl border border-red-500/30 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-xs text-red-700 dark:text-red-300"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" aria-hidden />
            <div>
              <p className="font-extrabold">
                Bitte überprüfen Sie die markierten Pflichtfelder:
              </p>
              <ul className="mt-1 list-disc pl-4 space-y-0.5">
                {Object.values(errors)
                  .filter(Boolean)
                  .map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Viewport: Either 1-Step Direct Question OR 3-Step Complete Repair Wizard */}
      <div className="overflow-x-hidden">
        {isQuestionMode ? (
          /* ═════════════════════════════════════════════════════════════
             TAB 2: DIREKTE FRAGE AN HERRN HANNACHI (1-STEP EXPRESS VIEW)
          ═════════════════════════════════════════════════════════════ */
          <motion.div
            key="direct-question-mode"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="mt-6 space-y-6"
          >
            {/* 1. Question Presets & Textarea */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2 mb-2">
                <label htmlFor={id("q-problem")} className="text-sm font-bold text-primary dark:text-slate-100">
                  1. Was möchten Sie Herrn Hannachi fragen? *
                </label>
                <span className="text-xs text-ink-muted">Vorlage antippen oder frei schreiben</span>
              </div>

              <div className="mb-3 flex flex-wrap gap-1.5">
                {quickQuestionPresets.map((preset) => {
                  const active = values.problem.includes(preset);
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => set("problem", preset)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all text-left cursor-pointer ${
                        active
                          ? "border-accent bg-accent/15 text-accent dark:text-accent-light font-bold"
                          : "border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-800/70 text-ink-muted hover:border-accent/40 hover:text-primary dark:hover:text-slate-100"
                      }`}
                    >
                      <span>{preset}</span>
                    </button>
                  );
                })}
              </div>

              <textarea
                id={id("q-problem")}
                data-field="problem"
                rows={3}
                value={values.problem}
                onChange={(e) => set("problem", e.target.value)}
                onBlur={() => blur("problem")}
                className={input(errors.problem)}
                placeholder="Schreiben Sie hier Ihre Frage (z. B. ob sich eine Reparatur lohnt, Ersatzteilanfrage, Termin in Ihrer Nähe)..."
              />
              {errors.problem && <ErrorText id={id("q-problem-err")}>{errors.problem}</ErrorText>}
            </div>

            {/* Device & Brand Selection for Question Context */}
            <div className="space-y-3 rounded-2xl border border-primary/10 dark:border-white/10 bg-surface/60 p-4">
              <label className="block text-xs font-bold text-primary dark:text-slate-100">
                Hersteller / Marke &amp; Gerät (für Ihre Frage) *
              </label>
              <div className="flex flex-wrap gap-1.5">
                {deviceTypes.slice(0, 8).map((d, idx) => {
                  const active = values.device === d;
                  const isOther = d.includes("Anderes");
                  return (
                    <button
                      key={d}
                      type="button"
                      data-field={idx === 0 ? "device" : undefined}
                      onClick={() => {
                        setValues((prev) => ({
                          ...prev,
                          device: d,
                          customDevice: isOther ? prev.customDevice : "",
                          model: prev.device !== d ? "" : prev.model,
                        }));
                        setErrors((prev) => ({ ...prev, device: undefined, customDevice: undefined }));
                      }}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                        active
                          ? "border-accent bg-accent text-white shadow-xs"
                          : "border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 text-ink-muted hover:text-primary dark:hover:text-slate-100"
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
              {errors.device && <ErrorText id={id("q-device-err")}>{errors.device}</ErrorText>}
              <div className="grid gap-3 sm:grid-cols-2 pt-1">
                <Field label="Hersteller / Marke *" htmlFor={id("q-brand")} error={errors.brand}>
                  <input
                    id={id("q-brand")}
                    data-field="brand"
                    value={values.brand}
                    onChange={(e) => set("brand", e.target.value)}
                    onBlur={() => blur("brand")}
                    className={input(errors.brand)}
                    placeholder="z. B. Miele, Bosch, Jura..."
                  />
                </Field>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-primary dark:text-slate-100">
                    Oder Marke schnell antippen:
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {popularBrands.slice(0, 6).map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => set("brand", b)}
                        className={`rounded-md border px-2 py-1 text-[11px] font-semibold cursor-pointer ${
                          values.brand === b ? "bg-accent text-white border-accent shadow-xs" : "bg-white dark:bg-slate-900 border-primary/10 text-ink-muted hover:border-accent"
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Optional Home Visit Choice + Clean Google Maps Pin Picker */}
            <div className="rounded-2xl border border-accent/25 bg-surface/80 dark:bg-slate-800/60 p-4 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-sm font-extrabold text-primary dark:text-slate-100 flex items-center gap-2">
                  <MapPin size={16} className="text-accent shrink-0" />
                  <span>2. Anfahrt gewünscht? (Optional)</span>
                </p>

                <div className="inline-grid grid-cols-2 gap-1.5 rounded-xl bg-white dark:bg-slate-900 p-1 border border-primary/10 dark:border-white/10">
                  <button
                    type="button"
                    data-testid="visit-type-home-btn-question"
                    aria-pressed={isHomeVisit}
                    onClick={() => handleVisitTypeChange("home_visit")}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                      isHomeVisit
                        ? "bg-accent text-white shadow-xs"
                        : "text-ink-muted hover:text-primary dark:hover:text-slate-100"
                    }`}
                  >
                    <Home size={13} />
                    <span>Vor-Ort-Einsatz</span>
                  </button>
                  <button
                    type="button"
                    data-testid="visit-type-workshop-btn-question"
                    aria-pressed={!isHomeVisit}
                    onClick={() => handleVisitTypeChange("workshop")}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                      !isHomeVisit
                        ? "bg-accent text-white shadow-xs"
                        : "text-ink-muted hover:text-primary dark:hover:text-slate-100"
                    }`}
                  >
                    <Building2 size={13} />
                    <span>Werkstatt / Ohne Anfahrt</span>
                  </button>
                </div>
              </div>

              {isHomeVisit ? (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="PLZ & Ort *" htmlFor={id("q-zip")} error={errors.zip}>
                      <input
                        id={id("q-zip")}
                        data-field="zip"
                        value={values.zip}
                        onChange={(e) => set("zip", e.target.value)}
                        onBlur={() => blur("zip")}
                        className={input(errors.zip)}
                        placeholder="z. B. 49082 Osnabrück"
                      />
                    </Field>
                    <Field label="Straße & Hausnr. (optional)" htmlFor={id("q-street")}>
                      <input
                        id={id("q-street")}
                        value={values.streetAddress || ""}
                        onChange={(e) => set("streetAddress", e.target.value)}
                        className={input()}
                        placeholder="z. B. Musterstraße 12"
                      />
                    </Field>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsMapModalOpen(true)}
                      data-testid="open-google-maps-picker-btn-question"
                      className="inline-flex min-h-[42px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-extrabold text-white shadow-xs transition-all cursor-pointer"
                    >
                      <MapPin size={15} />
                      <span>
                        {verifiedLocation?.source === "map-pin"
                          ? "Karten-Pin ändern"
                          : "Standort auf Karte wählen (Pin)"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={shareGoogleMapsLocation}
                      disabled={gpsStatus === "locating"}
                      data-testid="share-current-location-btn-question"
                      className="inline-flex min-h-[42px] w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border border-primary/15 dark:border-white/15 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-primary dark:text-slate-100 hover:border-accent transition-all cursor-pointer"
                    >
                      <Navigation size={13} className={gpsStatus === "locating" ? "animate-spin" : ""} />
                      <span>{gpsStatus === "locating" ? "GPS lädt…" : "Mein GPS"}</span>
                    </button>
                  </div>

                  <AnimatePresence>
                    {values.locationVerified && verifiedLocation && (
                      <LocationVerifiedIndicator
                        verifiedInfo={verifiedLocation}
                        streetAddress={values.streetAddress}
                        zip={values.zip}
                        onEdit={() => setIsMapModalOpen(true)}
                      />
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <p className="text-xs text-ink-muted">
                  Werkstatt ({business.street}, {business.zip} {business.city}) – für diese Frage wird keine Anfahrtsadresse benötigt.
                </p>
              )}
            </div>

            {/* 3. Name & Phone */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ihr Name *" htmlFor={id("q-name")} error={errors.name}>
                <input
                  id={id("q-name")}
                  data-field="name"
                  autoComplete="name"
                  value={values.name}
                  onChange={(e) => set("name", e.target.value)}
                  onBlur={() => blur("name")}
                  className={input(errors.name)}
                  placeholder="Vor- und Nachname"
                />
              </Field>
              <Field label="Telefonnummer (für WhatsApp / Rückruf) *" htmlFor={id("q-phone")} error={errors.phone}>
                <input
                  id={id("q-phone")}
                  data-field="phone"
                  type="tel"
                  autoComplete="tel"
                  value={values.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  onBlur={() => blur("phone")}
                  className={input(errors.phone)}
                  placeholder="z. B. 0170 1234567"
                />
              </Field>
            </div>

            <div className="pt-3 border-t border-primary/8 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-ink-muted">
                Direkt per <strong className="text-emerald-600 dark:text-emerald-400">WhatsApp an Herrn Hannachi</strong>
              </p>
              <motion.button
                type="submit"
                layout
                disabled={isSubmitting}
                whileTap={!isSubmitting ? { scale: 0.98 } : undefined}
                data-variant="hover-emerald"
                className={`btn-whatsapp-hover group relative overflow-hidden inline-flex min-h-[50px] items-center justify-center gap-2 rounded-xl px-4 sm:px-7 py-3.5 text-center text-sm sm:text-[15px] font-bold leading-snug text-white shadow-lg transition-colors duration-300 w-full sm:w-auto sm:min-w-[260px] sm:whitespace-nowrap cursor-pointer disabled:cursor-not-allowed ${
                  status === "completing"
                    ? "bg-emerald-600 shadow-emerald-500/30"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25"
                }`}
              >
                {status === "loading" && (
                  <motion.span
                    className="absolute inset-y-0 left-0 bg-white/20 pointer-events-none"
                    initial={{ width: "0%" }}
                    animate={{ width: `${submitProgress}%` }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  />
                )}
                <AnimatePresence mode="wait" initial={false}>
                  {status === "loading" ? (
                    <motion.span
                      key="q-btn-loading"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.16 }}
                      className="relative z-10 inline-flex items-center gap-2.5"
                    >
                      <Loader2 size={18} className="animate-spin" aria-hidden />
                      <span>WhatsApp-Nachricht wird erstellt…</span>
                      <span className="font-mono text-xs opacity-85 tabular-nums">{submitProgress}%</span>
                    </motion.span>
                  ) : status === "completing" ? (
                    <motion.span
                      key="q-btn-completing"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 320, damping: 20 }}
                      className="relative z-10 inline-flex items-center gap-2.5"
                    >
                      <AnimatedCheckmark size={22} />
                      <span>Für WhatsApp bereit!</span>
                    </motion.span>
                  ) : (
                    <motion.span
                      key="q-btn-idle"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.16 }}
                      className="relative z-10 inline-flex items-center gap-2.5"
                    >
                      <span className="whatsapp-hover-icon shrink-0" aria-hidden="true">
                        <MessageCircle size={18} />
                      </span>
                      <span>Fertige Frage für WhatsApp erstellen</span>
                      <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </motion.div>
        ) : (
          /* ═════════════════════════════════════════════════════════════
             TAB 1: KOMPLETTE REPARATURANFRAGE (3-STEP WIZARD)
          ═════════════════════════════════════════════════════════════ */
          <AnimatePresence mode="wait" custom={stepDirection} initial={false}>
            {isStepLoading ? (
              <motion.div
                key={`wizard-skeleton-${step}`}
                custom={stepDirection}
                variants={stepSlideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 340, damping: 32, mass: 0.85 },
                  opacity: { duration: 0.15, ease: "easeOut" },
                }}
              >
                <RepairFormStepSkeleton step={step} />
              </motion.div>
            ) : step === 1 ? (
              <motion.div
                key="wizard-step-1"
                custom={stepDirection}
                variants={stepSlideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 340, damping: 32, mass: 0.85 },
                  opacity: { duration: 0.18, ease: "easeOut" },
                }}
                className="mt-6 space-y-6"
              >
                {/* 1. Device Selection Grid (Required) */}
                <div>
                  <label className="mb-2.5 block text-sm font-bold text-primary dark:text-slate-100">
                    1. Welches Gerät soll repariert werden? *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {deviceTypes.map((d, idx) => {
                      const isSelected = values.device === d;
                      const isOther = d.includes("Anderes");
                      const Icon = deviceIconMap[d] || Wrench;
                      return (
                        <button
                          key={d}
                          type="button"
                          data-field={idx === 0 ? "device" : undefined}
                          aria-pressed={isSelected}
                          onClick={() => {
                            setValues((prev) => ({
                              ...prev,
                              device: d,
                              customDevice: isOther ? prev.customDevice : "",
                              model: prev.device !== d ? "" : prev.model,
                            }));
                            setSelectedSymptoms([]);
                            setErrors((prev) => ({
                              ...prev,
                              device: undefined,
                              customDevice: undefined,
                            }));
                          }}
                          className={`group flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-xs font-bold transition-all duration-150 cursor-pointer ${
                            isSelected
                              ? "border-accent bg-accent text-white shadow-sm"
                              : "border-primary/10 dark:border-white/10 bg-surface/70 dark:bg-slate-800/70 text-primary dark:text-slate-100 hover:border-accent/50 hover:bg-white dark:hover:bg-slate-800"
                          }`}
                        >
                          <Icon
                            size={15}
                            className={`shrink-0 ${
                              isSelected ? "text-white" : "text-accent group-hover:scale-110 transition-transform"
                            }`}
                          />
                          <span className="truncate">{isOther ? "Sonstiges Gerät" : d}</span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.device && <ErrorText id={id("device-err")}>{errors.device}</ErrorText>}
                </div>

                {/* Custom Device Name if "Anderes Gerät" */}
                {values.device && values.device.includes("Anderes") && (
                  <Field
                    label="Um welches Gerät handelt es sich? *"
                    htmlFor={id("customDevice")}
                    error={errors.customDevice}
                    className="rounded-2xl border border-accent/30 bg-accent/5 p-4"
                    hint="z. B. Dampfgarer, Siebträgermaschine, Weinkühlschrank, Bügelstation"
                  >
                    <input
                      id={id("customDevice")}
                      data-field="customDevice"
                      value={values.customDevice || ""}
                      onChange={(e) => set("customDevice", e.target.value)}
                      onBlur={() => blur("customDevice")}
                      className={input(errors.customDevice)}
                      placeholder="Gerätebezeichnung eingeben..."
                    />
                  </Field>
                )}

                {/* Live Technician Diagnostic Hint Box */}
                {values.device && (
                  <motion.div
                    key={values.device}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-2xl border border-accent/20 bg-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-primary dark:text-slate-100">
                        <Wrench size={14} className="text-accent shrink-0" />
                        <span>{currentDiagnostic.title} · {values.device}</span>
                      </div>
                      <p className="text-xs leading-relaxed text-ink-muted">
                        {currentDiagnostic.hint}
                      </p>
                    </div>
                    <div className="shrink-0 text-xs font-semibold text-accent whitespace-nowrap">
                      {currentDiagnostic.typicalTime}
                    </div>
                  </motion.div>
                )}

                {/* 2. Brand & Model Selection (Strict Brand Required, Dynamic Real Model Suggestions) */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2 mb-2">
                    <label htmlFor={id("brand")} className="text-sm font-bold text-primary dark:text-slate-100">
                      2. Hersteller / Marke *
                    </label>
                    <span className="text-xs text-ink-muted">Marke antippen (Modellvorschläge passen sich an)</span>
                  </div>
                  <div className="mb-2.5 flex flex-wrap gap-1.5">
                    {popularBrands.map((b) => {
                      const active = values.brand.toLowerCase() === b.toLowerCase();
                      return (
                        <button
                          key={b}
                          type="button"
                          onClick={() => set("brand", b)}
                          className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                            active
                              ? "border-accent bg-accent text-white shadow-xs"
                              : "border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-800/70 text-ink-muted hover:border-accent/40 hover:text-primary dark:hover:text-slate-100"
                          }`}
                        >
                          {b}
                        </button>
                      );
                    })}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Hersteller / Marke *" htmlFor={id("brand")} error={errors.brand}>
                      <input
                        id={id("brand")}
                        data-field="brand"
                        value={values.brand}
                        onChange={(e) => set("brand", e.target.value)}
                        onBlur={() => blur("brand")}
                        className={input(errors.brand)}
                        placeholder="z. B. Miele, Bosch, Siemens, Jura..."
                      />
                    </Field>
                    <Field label="Gerätemodell / E-Nr. (optional)" htmlFor={id("model")} error={errors.model} hint="Wählen Sie unten einen Vorschlag oder tippen Sie frei">
                      <input
                        id={id("model")}
                        data-field="model"
                        value={values.model}
                        onChange={(e) => set("model", e.target.value)}
                        className={input(errors.model)}
                        placeholder="z. B. W1 TwinDos, Serie 4, E8..."
                      />
                    </Field>
                  </div>

                  {/* Dynamic Model Suggestions filtered by selected Appliance & Brand */}
                  {values.brand && (
                    <div className="mt-3 rounded-2xl border border-accent/20 bg-accent/[0.04] dark:bg-slate-800/60 p-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
                        <p className="text-xs font-extrabold text-primary dark:text-slate-100 flex items-center gap-1.5">
                          <Sparkles size={14} className="text-accent shrink-0" />
                          <span>Typische {values.brand}-Modelle für {values.device || "Ihr Gerät"}:</span>
                        </p>
                        <span className="text-[11px] text-ink-muted">Mit 1 Klick übernehmen</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {getSuggestedModels(values.device || "Waschmaschine", values.brand).map((m) => {
                          const active = values.model === m;
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => set("model", m)}
                              className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                                active
                                  ? "border-emerald-500 bg-emerald-500 text-white shadow-xs"
                                  : "border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 text-primary dark:text-slate-200 hover:border-accent hover:text-accent"
                              }`}
                            >
                              {m}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 1 Footer CTA */}
                <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-primary/8 dark:border-white/10">
                  <div className="flex items-center gap-2 text-xs text-ink-muted">
                    <ShieldCheck size={16} className="text-accent shrink-0" />
                    <span>Schritt 1 von 3 · Gerätemodell / E-Nr. ist optional</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="btn-primary w-full sm:w-auto text-center leading-snug sm:whitespace-nowrap cursor-pointer"
                  >
                    <span>Weiter zu Schritt 2 (Fehlerbild)</span>
                    <ArrowRight size={16} className="shrink-0" />
                  </button>
                </div>
              </motion.div>
            ) : step === 2 ? (
              <motion.div
                key="wizard-step-2"
                custom={stepDirection}
                variants={stepSlideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 340, damping: 32, mass: 0.85 },
                  opacity: { duration: 0.18, ease: "easeOut" },
                }}
                className="mt-6 space-y-6"
              >
                {/* Selected Device & Brand Summary Chip */}
                <div className="flex items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3 border border-primary/8 dark:border-white/10 text-xs">
                  <div className="min-w-0 flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-primary dark:text-slate-100">{values.device}</span>
                    <span aria-hidden="true" className="text-ink-faint">·</span>
                    <span className="font-semibold text-accent">{values.brand || "Alle Marken"}</span>
                    {values.model && (
                      <>
                        <span aria-hidden="true" className="text-ink-faint">·</span>
                        <span className="text-ink-muted">Modell: {values.model}</span>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="shrink-0 font-bold text-accent hover:underline whitespace-nowrap"
                  >
                    Gerät ändern
                  </button>
                </div>

                {/* Interactive Symptom Selector + Problem Description */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2 mb-2">
                    <label htmlFor={id("problem")} className="text-sm font-bold text-primary dark:text-slate-100">
                      Welches Fehlerbild / Symptom tritt auf? *
                    </label>
                    <span className="text-xs text-ink-muted">Ein Klick auf ein Symptom genügt</span>
                  </div>

                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {currentSymptoms.map((sym) => {
                      const active =
                        selectedSymptoms.includes(sym) || values.problem.includes(sym);
                      return (
                        <button
                          key={sym}
                          type="button"
                          onClick={() => toggleSymptomChip(sym)}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all text-left ${
                            active
                              ? "border-accent bg-accent/15 text-accent dark:text-accent-light"
                              : "border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-800/70 text-ink-muted hover:border-accent/40 hover:text-primary dark:hover:text-slate-100"
                          }`}
                        >
                          {active ? <Check size={13} className="text-accent shrink-0" /> : null}
                          <span>{sym}</span>
                        </button>
                      );
                    })}
                  </div>

                  <textarea
                    id={id("problem")}
                    data-field="problem"
                    rows={3}
                    value={values.problem}
                    onChange={(e) => set("problem", e.target.value)}
                    onBlur={() => blur("problem")}
                    className={input(errors.problem)}
                    placeholder="Wählen Sie oben ein Symptom durch Antippen aus oder beschreiben Sie kurz das Problem..."
                  />
                  {errors.problem && <ErrorText id={id("problem-err")}>{errors.problem}</ErrorText>}
                </div>

                {/* Urgency Selection */}
                <div>
                  <label className="mb-2 block text-sm font-bold text-primary dark:text-slate-100">
                    Wie dringend ist die Reparatur?
                  </label>
                  <div className="grid gap-2.5 sm:grid-cols-3">
                    {(
                      [
                        {
                          id: "normal",
                          title: "Normal",
                          sub: "In den nächsten Tagen",
                        },
                        {
                          id: "express",
                          title: "Dringend",
                          sub: "Heute oder morgen gewünscht",
                        },
                        {
                          id: "notfall",
                          title: "Notfall",
                          sub: "Kühlgerät / Wasser läuft aus",
                        },
                      ] as { id: UrgencyLevel; title: string; sub: string }[]
                    ).map((u) => {
                      const active = values.urgency === u.id;
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => set("urgency", u.id)}
                          className={`rounded-xl border p-3 text-left transition-all ${
                            active
                              ? "border-accent bg-accent/10 text-primary dark:text-slate-100"
                              : "border-primary/10 dark:border-white/10 bg-surface/60 dark:bg-slate-800/60 text-ink-muted hover:border-primary/25 dark:hover:border-white/25"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-primary dark:text-slate-100">{u.title}</span>
                            {active && <Check size={14} className="text-accent" />}
                          </div>
                          <p className="mt-0.5 text-[11px] text-ink-muted">{u.sub}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Optional Photo Upload */}
                <div>
                  <span className="mb-2 block text-xs font-bold text-ink-muted">
                    Optional: Foto vom Gerät, Fehlercode oder Typenschild anhängen
                  </span>
                  <input
                    ref={fileRef}
                    id={id("photo")}
                    data-field="photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(e) => onPhoto(e.target.files?.[0] ?? null)}
                  />
                  {preview ? (
                    <div className="flex items-center gap-4 rounded-xl border border-primary/15 dark:border-white/15 bg-surface p-3">
                      <Image
                        src={preview}
                        alt="Vorschau des ausgewählten Fotos"
                        width={56}
                        height={56}
                        sizes="56px"
                        loading="eager"
                        decoding="async"
                        unoptimized
                        className="h-14 w-14 shrink-0 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-primary dark:text-slate-100">{values.photo?.name}</p>
                        <p className="text-[11px] text-ink-muted">Bereit für Ihre Anfrage</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onPhoto(null);
                          if (fileRef.current) fileRef.current.value = "";
                        }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-800 text-ink-muted hover:text-primary dark:hover:text-slate-100"
                        aria-label="Foto entfernen"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor={id("photo")}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-primary/20 dark:border-white/20 bg-surface/50 dark:bg-slate-800/40 px-4 py-3.5 text-xs transition-colors hover:border-accent hover:bg-accent/5"
                    >
                      <span className="flex items-center gap-2.5 font-semibold text-primary dark:text-slate-100">
                        <ImagePlus size={18} className="text-accent" />
                        Foto vom Typenschild oder Gerät auswählen (optional)
                      </span>
                      <span className="text-ink-faint hidden sm:inline">JPG, PNG, WebP</span>
                    </label>
                  )}
                  {errors.photo && <ErrorText id={id("photo-err")}>{errors.photo}</ErrorText>}
                </div>

                {/* Step 2 Footer Navigation */}
                <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-primary/8 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-primary/15 dark:border-white/15 px-4 py-3 text-xs font-bold text-primary dark:text-slate-100 hover:border-accent hover:text-accent transition-colors sm:whitespace-nowrap cursor-pointer"
                  >
                    <ArrowLeft size={15} className="shrink-0" />
                    <span>Zurück zu Schritt 1</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => goToStep(3)}
                    className="btn-primary w-full sm:w-auto text-center leading-snug sm:whitespace-nowrap cursor-pointer"
                  >
                    <span>Weiter zu Schritt 3 (Standort &amp; Kontakt)</span>
                    <ArrowRight size={16} className="shrink-0" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="wizard-step-3"
                custom={stepDirection}
                variants={stepSlideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 340, damping: 32, mass: 0.85 },
                  opacity: { duration: 0.18, ease: "easeOut" },
                }}
                className="mt-6 space-y-6"
              >
                {/* Selected Device & Symptom Summary Bar */}
                <div className="flex items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3 border border-primary/8 dark:border-white/10 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                      <span className="font-bold text-primary dark:text-slate-100">{values.device}</span>
                      <span aria-hidden="true" className="text-ink-faint">·</span>
                      <span className="font-semibold text-accent">{values.brand || "Alle Marken"}</span>
                    </div>
                    {values.problem && (
                      <p className="mt-0.5 text-ink-muted truncate">{values.problem}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="shrink-0 font-bold text-accent hover:underline whitespace-nowrap cursor-pointer"
                  >
                    Ändern
                  </button>
                </div>

                {/* Optional Home Visit Choice + Clean Google Maps Pin Picker */}
                <div className="rounded-2xl border border-accent/25 bg-surface/80 dark:bg-slate-800/60 p-4 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <p className="text-sm font-extrabold text-primary dark:text-slate-100 flex items-center gap-2">
                      <MapPin size={16} className="text-accent shrink-0" />
                      <span>Einsatzart (Vor Ort oder Werkstatt)</span>
                    </p>

                    <div className="inline-grid grid-cols-2 gap-1.5 rounded-xl bg-white dark:bg-slate-900 p-1 border border-primary/10 dark:border-white/10">
                      <button
                        type="button"
                        data-testid="visit-type-home-btn"
                        aria-pressed={isHomeVisit}
                        onClick={() => handleVisitTypeChange("home_visit")}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                          isHomeVisit
                            ? "bg-accent text-white shadow-xs"
                            : "text-ink-muted hover:text-primary dark:hover:text-slate-100"
                        }`}
                      >
                        <Home size={13} />
                        <span>Vor-Ort-Einsatz</span>
                      </button>
                      <button
                        type="button"
                        data-testid="visit-type-workshop-btn"
                        aria-pressed={!isHomeVisit}
                        onClick={() => handleVisitTypeChange("workshop")}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                          !isHomeVisit
                            ? "bg-accent text-white shadow-xs"
                            : "text-ink-muted hover:text-primary dark:hover:text-slate-100"
                        }`}
                      >
                        <Building2 size={13} />
                        <span>Werkstatt / Ohne Anfahrt</span>
                      </button>
                    </div>
                  </div>

                  {isHomeVisit ? (
                    <div className="space-y-3">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="PLZ & Ort (Osnabrück & Umgebung) *" htmlFor={id("zip")} error={errors.zip}>
                          <input
                            id={id("zip")}
                            data-field="zip"
                            value={values.zip}
                            onChange={(e) => set("zip", e.target.value)}
                            onBlur={() => blur("zip")}
                            className={input(errors.zip)}
                            placeholder="z. B. 49082 Osnabrück"
                          />
                        </Field>

                        <Field label="Straße & Hausnr. (optional)" htmlFor={id("streetAddress")}>
                          <input
                            id={id("streetAddress")}
                            value={values.streetAddress || ""}
                            onChange={(e) => set("streetAddress", e.target.value)}
                            className={input()}
                            placeholder="z. B. Iburger Str. 10"
                          />
                        </Field>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsMapModalOpen(true)}
                          data-testid="open-google-maps-picker-btn"
                          className="inline-flex min-h-[42px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-extrabold text-white shadow-xs transition-all cursor-pointer"
                        >
                          <MapPin size={15} />
                          <span>
                            {verifiedLocation?.source === "map-pin"
                              ? "Karten-Pin ändern"
                              : "Standort auf Karte wählen (Pin)"}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={shareGoogleMapsLocation}
                          disabled={gpsStatus === "locating"}
                          data-testid="share-current-location-btn"
                          className="inline-flex min-h-[42px] w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border border-primary/15 dark:border-white/15 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-primary dark:text-slate-100 hover:border-accent transition-all cursor-pointer"
                        >
                          <Navigation size={13} className={gpsStatus === "locating" ? "animate-spin" : ""} />
                          <span>{gpsStatus === "locating" ? "GPS lädt…" : "Mein GPS"}</span>
                        </button>
                      </div>

                      <AnimatePresence>
                        {values.locationVerified && verifiedLocation && (
                          <LocationVerifiedIndicator
                            verifiedInfo={verifiedLocation}
                            streetAddress={values.streetAddress}
                            zip={values.zip}
                            onEdit={() => setIsMapModalOpen(true)}
                          />
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <p className="text-xs text-ink-muted">
                      Werkstattabgabe / Beratung ({business.street}, {business.zip} {business.city}) – keine Anfahrtsadresse erforderlich.
                    </p>
                  )}
                </div>

                {/* Required Contact Inputs: Name & Phone ONLY (Email optional) */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Ihr Name *" htmlFor={id("name")} error={errors.name}>
                    <input
                      id={id("name")}
                      data-field="name"
                      autoComplete="name"
                      value={values.name}
                      onChange={(e) => set("name", e.target.value)}
                      onBlur={() => blur("name")}
                      className={input(errors.name)}
                      placeholder="Vor- und Nachname"
                    />
                  </Field>

                  <Field label="Telefonnummer (für Rückruf / WhatsApp) *" htmlFor={id("phone")} error={errors.phone}>
                    <input
                      id={id("phone")}
                      data-field="phone"
                      type="tel"
                      autoComplete="tel"
                      value={values.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      onBlur={() => blur("phone")}
                      className={input(errors.phone)}
                      placeholder="z. B. 0170 1234567"
                    />
                  </Field>
                </div>

                {/* Optional Email & Callback Preference */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="E-Mail-Adresse (optional)" htmlFor={id("email")} error={errors.email}>
                    <input
                      id={id("email")}
                      data-field="email"
                      type="email"
                      autoComplete="email"
                      value={values.email}
                      onChange={(e) => set("email", e.target.value)}
                      onBlur={() => blur("email")}
                      className={input(errors.email)}
                      placeholder="Optional (nur falls gewünscht)"
                    />
                  </Field>

                  <div>
                    <label htmlFor={id("callbackTime")} className="mb-1.5 block text-xs font-bold text-primary dark:text-slate-100">
                      Beste Erreichbarkeit
                    </label>
                    <select
                      id={id("callbackTime")}
                      value={values.callbackTime}
                      onChange={(e) => set("callbackTime", e.target.value)}
                      className={input()}
                    >
                      <option value="Jederzeit erreichbar">Jederzeit erreichbar</option>
                      <option value="Vormittags (08:00 – 12:00 Uhr)">Vormittags (08:00 – 12:00 Uhr)</option>
                      <option value="Mittags (12:00 – 15:00 Uhr)">Mittags (12:00 – 15:00 Uhr)</option>
                      <option value="Nachmittags (15:00 – 18:00 Uhr)">Nachmittags (15:00 – 18:00 Uhr)</option>
                      <option value="Abends (ab 18:00 Uhr)">Abends (ab 18:00 Uhr)</option>
                    </select>
                  </div>
                </div>

                {status === "error" && (
                  <p
                    role="alert"
                    className="flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-950/50 p-4 text-sm text-red-700 dark:text-red-300"
                  >
                    <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden />
                    <span>
                      {submitErrorMsg ||
                        `Bitte überprüfen Sie Ihre Eingaben oder rufen Sie Herrn Hannachi direkt an: ${business.phoneDisplay}.`}
                    </span>
                  </p>
                )}

                {/* Submit Row */}
                <div className="pt-4 border-t border-primary/8 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={status === "loading" || status === "completing"}
                    onClick={() => goToStep(2)}
                    className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-primary/15 dark:border-white/15 px-4 py-3 text-xs font-bold text-primary dark:text-slate-100 hover:border-accent hover:text-accent transition-colors sm:whitespace-nowrap disabled:opacity-50 cursor-pointer"
                  >
                    <ArrowLeft size={15} className="shrink-0" />
                    <span>Zurück zu Schritt 2</span>
                  </button>

                  <motion.button
                    type="submit"
                    layout
                    disabled={status === "loading" || status === "completing"}
                    whileTap={status === "idle" ? { scale: 0.98 } : undefined}
                    data-variant="hover-emerald"
                    className={`btn-whatsapp-hover group relative overflow-hidden inline-flex min-h-[50px] items-center justify-center gap-2 rounded-xl px-4 sm:px-7 py-3.5 text-center text-sm sm:text-[15px] font-bold leading-snug text-white shadow-lg transition-colors duration-300 w-full sm:w-auto sm:min-w-[260px] sm:whitespace-nowrap cursor-pointer ${
                      status === "completing"
                        ? "bg-emerald-600 shadow-emerald-500/30"
                        : "bg-accent hover:bg-accent-dark shadow-accent/25"
                    }`}
                  >
                    {status === "loading" && (
                      <motion.span
                        className="absolute inset-y-0 left-0 bg-white/20 pointer-events-none"
                        initial={{ width: "0%" }}
                        animate={{ width: `${submitProgress}%` }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      />
                    )}

                    <AnimatePresence mode="wait" initial={false}>
                      {status === "loading" ? (
                        <motion.span
                          key="btn-loading"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.16 }}
                          className="relative z-10 inline-flex items-center gap-2.5"
                        >
                          <Loader2 size={18} className="animate-spin" aria-hidden />
                          <span>
                            {submitProgress < 65
                              ? "Standort & Diagnose werden verknüpft…"
                              : "Anfrageticket wird erstellt…"}
                          </span>
                          <span className="font-mono text-xs opacity-85 tabular-nums">
                            {submitProgress}%
                          </span>
                        </motion.span>
                      ) : status === "completing" ? (
                        <motion.span
                          key="btn-completing"
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ type: "spring", stiffness: 320, damping: 20 }}
                          className="relative z-10 inline-flex items-center gap-2.5"
                        >
                          <AnimatedCheckmark size={22} />
                          <span>Ticket &amp; Google Maps bereit!</span>
                        </motion.span>
                      ) : (
                        <motion.span
                          key="btn-idle"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.16 }}
                          className="relative z-10 inline-flex items-center gap-2.5"
                        >
                          <span className="whatsapp-hover-icon shrink-0" aria-hidden="true">
                            <MessageCircle size={18} />
                          </span>
                          <span>Anfrage fertig für WhatsApp erstellen</span>
                          <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
      </fieldset>
      <ValidationToast
        errors={waToastErrors}
        mode={isQuestionMode ? "question" : "repair"}
        onDismiss={() => {
          setWaToastScope(null);
          setWaToastErrors(null);
        }}
        onFieldSelect={jumpToMissingField}
      />
      <GoogleMapsPinModal
        isOpen={isMapModalOpen}
        initialLat={values.coordinates?.lat ?? verifiedLocation?.lat}
        initialLng={values.coordinates?.lng ?? verifiedLocation?.lng}
        initialZip={values.zip}
        initialStreet={values.streetAddress}
        onClose={() => setIsMapModalOpen(false)}
        onConfirm={handleConfirmMapPin}
      />
    </form>
  );
}

const input = (err?: string) =>
  `w-full rounded-xl border bg-white dark:bg-slate-800/90 px-4 py-3 text-[15px] text-primary dark:text-slate-100 placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 ${
    err ? "border-red-500" : "border-primary/15 dark:border-white/15 hover:border-primary/30 dark:hover:border-white/30"
  }`;

function Field({
  label,
  htmlFor,
  error,
  hint,
  className = "",
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-bold text-primary dark:text-slate-100">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-[11px] text-ink-muted">{hint}</p>}
      {error && <ErrorText id={`${htmlFor}-err`}>{error}</ErrorText>}
    </div>
  );
}

function ErrorText({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400">
      <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden />
      {children}
    </p>
  );
}