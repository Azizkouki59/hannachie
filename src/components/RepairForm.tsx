"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Camera,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Loader2,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Shield,
  ShieldCheck,
  Star,
  PackageSearch,
  X,
} from "lucide-react";
import { business } from "@/data/site";
import {
  emptyValues,
  hasMeaningfulDraftContent,
  loadRepairDraft,
  osnabrueckServiceAreas,
  popularBrands,
  prepareImmediateWhatsAppHandoff,
  saveRepairDraft,
  clearRepairDraft,
  submitRepairRequest,
  toWhatsAppInput,
  validate,
  type InquiryMode,
  type RepairErrors,
  type RepairValues,
  type VerifiedLocationInfo,
} from "@/lib/repairRequest";
import GoogleMapsPinModal from "@/components/GoogleMapsPinModal";
import ValidationToast from "@/components/ValidationToast";
import WhatsAppPreview, {
  renderWhatsAppFormattedMessage,
} from "@/components/WhatsAppPreview";
import ApplianceLogo from "@/components/ApplianceLogo";
import { useUserPlace } from "@/lib/userPlace";
import { hapticSuccess, hapticTap, triggerHapticFeedback } from "@/lib/haptics";
import {
  buildWhatsAppWebUrl,
  createHannachiWhatsAppPayload,
  type WhatsAppValidationErrors,
  type WhatsAppValidationField,
} from "@/utils/whatsapp";

type Status = "idle" | "loading" | "completing" | "success" | "error";

export type RequestTypeId = "check_parts" | "replacement_offer" | "warranty";

type RequestTypeOption = {
  id: RequestTypeId;
  shortLabel: string;
  tagPrefix: string;
  placeholder: string;
  quickHints: string[];
  icon: typeof PackageSearch;
};

const REQUEST_TYPES: RequestTypeOption[] = [
  {
    id: "check_parts",
    shortLabel: "Beratung & Teile",
    tagPrefix: "[Beratung & Teile]",
    placeholder: "Kurz beschreiben oder E-Nr. vom Typenschild eingeben…",
    quickHints: [
      "Persönliche Beratung",
      "Originalteil (E-Nr.)",
      "Pumpe / Dichtung / Teil",
      "Termin vereinbaren",
    ],
    icon: PackageSearch,
  },
  {
    id: "replacement_offer",
    shortLabel: "Gerät auf Anfrage",
    tagPrefix: "[Gerät auf Anfrage]",
    placeholder: "Gesuchtes Markengerät kurz nennen (z. B. Miele, Bosch)…",
    quickHints: [
      "Markengerät auf Anfrage",
      "Verfügbarkeit prüfen",
      "Mit Verkäufergarantie",
    ],
    icon: ShieldCheck,
  },
  {
    id: "warranty",
    shortLabel: "Garantie",
    tagPrefix: "[Garantie]",
    placeholder: "Kaufdatum & kurzes Anliegen (bei Hannachi gekauft)…",
    quickHints: [
      "Bei Hannachi gekauft",
      "Garantiebeleg liegt vor",
      "Kurze Rückfrage",
    ],
    icon: Shield,
  },
];

const CORE_DEVICES = [
  { label: "Waschmaschine", value: "Waschmaschine", badgeClass: "bg-sky-500/12 text-sky-600 dark:text-sky-400" },
  { label: "Kühlschrank", value: "Kühlschrank / Gefriergerät", badgeClass: "bg-cyan-500/12 text-cyan-600 dark:text-cyan-400" },
  { label: "Geschirrspüler", value: "Geschirrspüler", badgeClass: "bg-teal-500/12 text-teal-600 dark:text-teal-400" },
  { label: "Herd / Backofen", value: "Backofen / Herd", badgeClass: "bg-amber-500/12 text-amber-600 dark:text-amber-400" },
  { label: "Sonstiges", value: "Sonstiges", badgeClass: "bg-indigo-500/12 text-indigo-600 dark:text-indigo-400" },
] as const;

const CALLBACK_TIME_CHIPS = [
  { label: "Jederzeit", value: "Jederzeit erreichbar" },
  { label: "Vormittags (09–12)", value: "Vormittags (09:00–12:00 Uhr)" },
  { label: "Nachmittags (13–17)", value: "Nachmittags (13:00–17:00 Uhr)" },
  { label: "Ab 17 Uhr", value: "Ab 17:00 Uhr" },
  { label: "Nur WhatsApp", value: "Nur per WhatsApp" },
] as const;

const CONFETTI_COLORS = [
  "#10b981",
  "#0ea5e9",
  "#f59e0b",
  "#3b82f6",
  "#14b8a6",
  "#34d399",
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
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const particles: ConfettiParticle[] = [];
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    for (let i = 0; i < 65; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.85;
      const speed = 4.5 + Math.random() * 8.5;
      particles.push({
        x: width * (0.2 + Math.random() * 0.6),
        y: height * 0.25,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: 5 + Math.random() * 5,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        tiltAngle: Math.random() * Math.PI * 2,
        tiltSpeed: 0.08 + Math.random() * 0.12,
        opacity: 1,
        decay: 0.008 + Math.random() * 0.006,
      });
    }

    let rafId = 0;
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      let active = 0;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.opacity <= 0.02 || p.y > height + 30) continue;
        active++;
        p.vx *= 0.985;
        p.vy = p.vy * 0.985 + 0.23;
        p.x += p.vx + Math.sin(p.tiltAngle) * 0.4;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.tiltAngle += p.tiltSpeed;
        p.opacity = Math.max(0, p.opacity - p.decay);

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size * 1.2, p.size * 0.65);
        ctx.restore();
      }
      if (active > 0) {
        rafId = window.requestAnimationFrame(render);
      }
    };

    rafId = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(rafId);
  }, [triggerKey]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 h-full w-full"
    />
  );
}

export function resolveInitialDevice(input: string): { device: string; custom: string } {
  if (!input) return { device: "", custom: "" };
  const clean = input.trim().toLowerCase();

  if (clean.includes("wasch") && !clean.includes("trockner") && !clean.includes("geschirr")) {
    return { device: "Waschmaschine", custom: "" };
  }
  if (clean.includes("kühl") || clean.includes("gefrier") || clean.includes("kuehl")) {
    return { device: "Kühlschrank / Gefriergerät", custom: "" };
  }
  if (clean.includes("spül") || clean.includes("geschirr") || clean.includes("spuel")) {
    return { device: "Geschirrspüler", custom: "" };
  }
  if (clean.includes("ofen") || clean.includes("herd") || clean.includes("back")) {
    return { device: "Backofen / Herd", custom: "" };
  }
  if (clean === "sonstiges" || clean.includes("anderes")) {
    return { device: "Sonstiges", custom: "" };
  }

  return { device: "Sonstiges", custom: input.trim() };
}

const PHONE_ALLOWED_REGEX = /^[+()\d\s/-]*$/;
const PHONE_VALID_REGEX = /^[+()\d\s/-]{6,30}$/;

function validatePhoneRealtime(rawPhone: string): string | undefined {
  const trimmed = rawPhone.trim();
  if (!trimmed) {
    return undefined;
  }
  if (!PHONE_ALLOWED_REGEX.test(trimmed)) {
    return "Nur Ziffern sowie +, -, ( ) verwenden.";
  }
  const digitCount = trimmed.replace(/\D/g, "").length;
  if (digitCount < 6 || !PHONE_VALID_REGEX.test(trimmed)) {
    const remaining = Math.max(0, 6 - digitCount);
    return remaining > 0
      ? `Noch ${remaining} ${remaining === 1 ? "Ziffer" : "Ziffern"}.`
      : "Bitte gültige Nummer eingeben.";
  }
  return undefined;
}

function validateRepairValuesRealtime(v: RepairValues): RepairErrors {
  const nextErrors: RepairErrors = {};
  const cleanDevice = v.device.trim();
  const cleanCustom = v.customDevice?.trim() || "";
  const cleanProblem = v.problem.trim();
  const cleanZip = v.zip.trim();

  if (!cleanDevice) {
    nextErrors.device = "Bitte Gerät wählen.";
  } else if (
    (cleanDevice === "Sonstiges" || cleanDevice.includes("Anderes")) &&
    cleanCustom.length < 2
  ) {
    nextErrors.customDevice = "Bitte Gerät kurz nennen (z. B. Trockner).";
  }

  if (cleanProblem.length < 3) {
    nextErrors.problem = "Bitte Anliegen antippen oder kurz eingeben.";
  }

  if (cleanZip.length < 3) {
    nextErrors.zip = "Bitte PLZ / Ort angeben.";
  }

  const phoneErr = validatePhoneRealtime(v.phone);
  if (phoneErr) {
    nextErrors.phone = phoneErr;
  }

  return nextErrors;
}

function toToastErrors(errs: RepairErrors): WhatsAppValidationErrors | null {
  const mapped: WhatsAppValidationErrors = {};
  if (errs.device) mapped.device = errs.device;
  if (errs.customDevice) mapped.customDevice = errs.customDevice;
  if (errs.problem) mapped.symptom = errs.problem;
  if (errs.phone) mapped.phone = errs.phone;
  return Object.keys(mapped).length > 0 ? mapped : null;
}

export default function RepairForm({
  defaultDevice = "",
  defaultSymptom = "",
  defaultBrand = "",
  defaultMode = "repair",
  defaultRequestType = "check_parts",
  selectionSeq = 0,
  compact = false,
}: {
  defaultDevice?: string;
  defaultSymptom?: string;
  defaultBrand?: string;
  defaultMode?: InquiryMode;
  defaultRequestType?: RequestTypeId;
  selectionSeq?: number;
  compact?: boolean;
}) {
  const uid = useId();
  const prefersReducedMotion = useReducedMotion();
  const { detectedPlace, detectMyPlace, setDetectedPlace } = useUserPlace();
  const initial = resolveInitialDevice(defaultDevice);
  const initialDraftRef = useRef<ReturnType<typeof loadRepairDraft> | undefined>(undefined);
  if (initialDraftRef.current === undefined) {
    initialDraftRef.current = loadRepairDraft();
  }
  const restoredDraft = initialDraftRef.current;

  const inferRequestTypeFromSymptom = (symptomText?: string): RequestTypeId | null => {
    if (!symptomText) return null;
    const lower = symptomText.toLowerCase();
    if (
      lower.includes("garantie") ||
      lower.includes("gewährleistung") ||
      lower.includes("bei hannachi gekauft")
    ) {
      return "warranty";
    }
    if (
      lower.includes("geprüft") ||
      lower.includes("gebraucht") ||
      lower.includes("ankauf") ||
      lower.includes("ersatzgerät")
    ) {
      return "replacement_offer";
    }
    return "check_parts";
  };

  const [requestType, setRequestType] = useState<RequestTypeId>(
    () => inferRequestTypeFromSymptom(defaultSymptom) ?? defaultRequestType
  );
  const [values, setValues] = useState<RepairValues>(() => {
    const base: RepairValues = {
      ...emptyValues,
      inquiryMode: defaultMode,
      visitType: "home_visit",
      device: initial.device || "Waschmaschine",
      customDevice: initial.custom,
      brand: defaultBrand || "",
      problem: defaultSymptom || "",
      zip: emptyValues.zip || "49082 Osnabrück",
    };
    if (!restoredDraft) return base;
    const restoredResolved = resolveInitialDevice(restoredDraft.values.device);
    return {
      ...base,
      ...restoredDraft.values,
      photo: null,
      inquiryMode: defaultMode,
      visitType: "home_visit",
      device: defaultDevice
        ? initial.device || "Waschmaschine"
        : restoredResolved.device || "Waschmaschine",
      customDevice: defaultDevice
        ? initial.custom
        : restoredDraft.values.customDevice || restoredResolved.custom,
      brand: defaultBrand || restoredDraft.values.brand,
      problem: defaultSymptom || restoredDraft.values.problem,
      zip: restoredDraft.values.zip || "49082 Osnabrück",
    };
  });

  const [showOptionalFields, setShowOptionalFields] = useState<boolean>(() =>
    Boolean(
      defaultBrand ||
        restoredDraft?.values.brand ||
        restoredDraft?.values.streetAddress ||
        restoredDraft?.values.name
    )
  );
  const [errors, setErrors] = useState<RepairErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof RepairValues, boolean>>>({});
  const [toastErrors, setToastErrors] = useState<WhatsAppValidationErrors | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [confettiBurstCount, setConfettiBurstCount] = useState(0);
  const [referenceId, setReferenceId] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [sharedMapsUrl, setSharedMapsUrl] = useState("");
  const [messageText, setMessageText] = useState("");
  const [hasSentWhatsApp, setHasSentWhatsApp] = useState(false);
  const [copied, setCopied] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "locating" | "shared" | "fallback">(
    () => (restoredDraft ? restoredDraft.gpsStatus : "idle")
  );
  const [verifiedLocation, setVerifiedLocation] = useState<VerifiedLocationInfo | null>(
    () => (restoredDraft ? restoredDraft.verifiedLocation : null)
  );
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [submitErrorMsg, setSubmitErrorMsg] = useState<string | null>(null);
  const [serviceDoneRated, setServiceDoneRated] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [privacyError, setPrivacyError] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const userManuallyEditedZipRef = useRef(false);
  const lastSyncedPlaceKeyRef = useRef<string | null>(null);
  const prevDefaultsRef = useRef({
    defaultDevice,
    defaultSymptom,
    defaultBrand,
    defaultRequestType,
    selectionSeq,
  });
  const isFirstSyncRef = useRef(true);

  useEffect(() => {
    if (!detectedPlace || userManuallyEditedZipRef.current) return;
    const key = `${detectedPlace.lat.toFixed(5)},${detectedPlace.lng.toFixed(5)}`;
    if (lastSyncedPlaceKeyRef.current === key) return;
    lastSyncedPlaceKeyRef.current = key;

    setVerifiedLocation(detectedPlace);
    setGpsStatus("shared");
    setGpsError(null);
    if (detectedPlace.streetAddress) {
      setShowOptionalFields(true);
    }
    setValues((prev) => ({
      ...prev,
      mapsLocationUrl: detectedPlace.mapsUrl,
      zip: detectedPlace.zipAndCity || prev.zip,
      streetAddress: detectedPlace.streetAddress || prev.streetAddress || "",
      locationVerified: true,
      coordinates: {
        lat: detectedPlace.lat,
        lng: detectedPlace.lng,
        accuracy: detectedPlace.accuracy,
      },
    }));
    setErrors((prev) => ({ ...prev, zip: undefined }));
  }, [detectedPlace]);

  useEffect(() => {
    if (status === "success" && successRef.current) {
      successRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [status]);

  useEffect(() => {
    if (isFirstSyncRef.current) {
      isFirstSyncRef.current = false;
      return;
    }
    if (hasSentWhatsApp) {
      clearRepairDraft();
      return;
    }
    if (hasMeaningfulDraftContent(values, 1, [])) {
      saveRepairDraft({
        step: 1,
        values,
        selectedSymptoms: [],
        verifiedLocation,
        gpsStatus,
      });
    } else {
      clearRepairDraft();
    }
  }, [values, verifiedLocation, gpsStatus, hasSentWhatsApp]);

  useEffect(() => {
    if (prevDefaultsRef.current.defaultDevice === defaultDevice) return;
    prevDefaultsRef.current.defaultDevice = defaultDevice;
    if (defaultDevice) {
      const resolved = resolveInitialDevice(defaultDevice);
      setValues((prev) => ({
        ...prev,
        device: resolved.device || "Waschmaschine",
        customDevice: resolved.custom,
      }));
      setStatus("idle");
    }
  }, [defaultDevice]);

  useEffect(() => {
    if (prevDefaultsRef.current.defaultSymptom === defaultSymptom) return;
    const previousSymptom = prevDefaultsRef.current.defaultSymptom;
    prevDefaultsRef.current.defaultSymptom = defaultSymptom;
    if (defaultSymptom) {
      const inferred = inferRequestTypeFromSymptom(defaultSymptom);
      if (inferred) {
        setRequestType(inferred);
      }
      setValues((prev) => ({ ...prev, problem: defaultSymptom }));
      setStatus("idle");
    } else if (previousSymptom) {
      setValues((prev) =>
        prev.problem === previousSymptom ? { ...prev, problem: "" } : prev
      );
    }
  }, [defaultSymptom]);

  useEffect(() => {
    if (prevDefaultsRef.current.defaultBrand === defaultBrand) return;
    prevDefaultsRef.current.defaultBrand = defaultBrand;
    if (defaultBrand) {
      setValues((prev) => ({ ...prev, brand: defaultBrand }));
      setShowOptionalFields(true);
      setStatus("idle");
    }
  }, [defaultBrand]);

  useEffect(() => {
    if (
      prevDefaultsRef.current.defaultRequestType === defaultRequestType &&
      prevDefaultsRef.current.selectionSeq === selectionSeq
    ) {
      return;
    }
    prevDefaultsRef.current.defaultRequestType = defaultRequestType;
    prevDefaultsRef.current.selectionSeq = selectionSeq;
    setRequestType(defaultRequestType);
    setStatus("idle");
  }, [defaultRequestType, selectionSeq]);

  const id = (k: string) => `${uid}-${k}`;
  const activeType = REQUEST_TYPES.find((t) => t.id === requestType) || REQUEST_TYPES[0];
  const isSubmitting = status === "loading" || status === "completing";

  const realtimeErrors = useMemo(() => validateRepairValuesRealtime(values), [values]);
  const isCustomDeviceRequired =
    values.device === "Sonstiges" || values.device.includes("Anderes");
  const isDeviceReady = !realtimeErrors.device && !realtimeErrors.customDevice;
  const isProblemReady = !realtimeErrors.problem;
  const isZipReady = !realtimeErrors.zip;
  const isPhoneEntered = values.phone.trim().length > 0;
  const isPhoneValid = isPhoneEntered && !realtimeErrors.phone;
  const isReadyForWhatsApp = Object.keys(realtimeErrors).length === 0;

  const liveWhatsAppPayload = useMemo(() => {
    if (!isReadyForWhatsApp) return null;
    const cleanProblemBase = values.problem.trim();
    const formattedProblem = cleanProblemBase.startsWith("[")
      ? cleanProblemBase
      : `${activeType.tagPrefix} ${cleanProblemBase}`;

    const built = createHannachiWhatsAppPayload(
      toWhatsAppInput({
        ...values,
        inquiryMode: "repair",
        visitType: "home_visit",
        device: values.device || "Waschmaschine",
        customDevice: isCustomDeviceRequired ? values.customDevice?.trim() || "" : "",
        brand: values.brand.trim(),
        model: values.model.trim(),
        callbackTime: values.callbackTime.trim() || "Jederzeit erreichbar",
        hasTypeplatePhoto: Boolean(values.hasTypeplatePhoto),
        problem: formattedProblem,
        zip: values.zip.trim(),
        streetAddress: values.streetAddress?.trim() || "",
        name: values.name.trim() || "Interessent (Osnabrück)",
        phone: values.phone.trim(),
        preferredChannel: "whatsapp",
      })
    );

    return built.valid ? built : null;
  }, [isReadyForWhatsApp, values, activeType.tagPrefix, isCustomDeviceRequired]);

  const set = <K extends keyof RepairValues>(k: K, val: RepairValues[K]) => {
    if (k === "zip") {
      userManuallyEditedZipRef.current = true;
      setGpsError(null);
    }
    const nextValues = { ...values, [k]: val };
    setValues(nextValues);

    const nextRealtime = validateRepairValuesRealtime(nextValues);

    setErrors((prev) => {
      const updated = { ...prev };
      const isPhoneBadChars =
        k === "phone" && typeof val === "string" && !PHONE_ALLOWED_REGEX.test(val.trim());

      if (touched[k] || prev[k] || !nextRealtime[k] || isPhoneBadChars) {
        updated[k] = nextRealtime[k];
      }

      if (k === "device" && val !== "Sonstiges") {
        updated.customDevice = undefined;
      } else if (
        k === "customDevice" &&
        (touched.customDevice || prev.customDevice || !nextRealtime.customDevice)
      ) {
        updated.customDevice = nextRealtime.customDevice;
      }

      if (toastErrors) {
        setToastErrors(toToastErrors(updated));
      }

      return updated;
    });
  };

  const handleBlur = <K extends keyof RepairValues>(k: K) => {
    setTouched((prev) => ({ ...prev, [k]: true }));
    const nextRealtime = validateRepairValuesRealtime(values);
    setErrors((prev) => {
      const updated = { ...prev, [k]: nextRealtime[k] };
      if (toastErrors) {
        setToastErrors(toToastErrors(updated));
      }
      return updated;
    });
  };

  const focusField = (field: keyof RepairValues | WhatsAppValidationField) => {
    const targetName = field === "symptom" ? "problem" : field;
    if (
      targetName === "brand" ||
      targetName === "model" ||
      targetName === "callbackTime" ||
      targetName === "name" ||
      targetName === "streetAddress"
    ) {
      setShowOptionalFields(true);
    }
    window.setTimeout(() => {
      const el = formRef.current?.querySelector<HTMLElement>(`[data-field="${targetName}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus({ preventScroll: true });
      }
    }, 120);
  };

  function toggleHint(hint: string) {
    triggerHapticFeedback(30);
    setTouched((prev) => ({ ...prev, problem: true }));
    const parts = values.problem
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
    const exists = parts.some((p) => p.toLowerCase() === hint.toLowerCase());
    if (exists) {
      const next = parts.filter((p) => p.toLowerCase() !== hint.toLowerCase()).join("; ");
      set("problem", next);
      return;
    }
    set("problem", [...parts, hint].join("; "));
  }

  function handleConfirmMapPin(verified: VerifiedLocationInfo) {
    userManuallyEditedZipRef.current = false;
    lastSyncedPlaceKeyRef.current = `${verified.lat.toFixed(5)},${verified.lng.toFixed(5)}`;
    setDetectedPlace(verified);
    setVerifiedLocation(verified);
    setGpsStatus("shared");
    setGpsError(null);
    if (verified.streetAddress) {
      setShowOptionalFields(true);
    }
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

  async function shareGpsLocation() {
    if (gpsStatus === "locating") return;
    triggerHapticFeedback(40);
    setGpsStatus("locating");
    setGpsError(null);

    const outcome = await detectMyPlace();
    if (!outcome.ok) {
      setGpsStatus("idle");
      setGpsError(outcome.message);
      return;
    }

    const info = outcome.place;
    userManuallyEditedZipRef.current = false;
    lastSyncedPlaceKeyRef.current = `${info.lat.toFixed(5)},${info.lng.toFixed(5)}`;
    setVerifiedLocation(info);
    setGpsStatus("shared");
    setGpsError(null);
    if (info.streetAddress) {
      setShowOptionalFields(true);
    }
    setValues((prev) => ({
      ...prev,
      mapsLocationUrl: info.mapsUrl,
      zip: info.zipAndCity || prev.zip,
      streetAddress: info.streetAddress || prev.streetAddress || "",
      locationVerified: true,
      coordinates: {
        lat: info.lat,
        lng: info.lng,
        accuracy: info.accuracy,
      },
    }));
    setErrors((prev) => ({ ...prev, zip: undefined }));
    hapticSuccess();
  }

  function launchWhatsAppAutomatically(url: string) {
    if (!url || typeof document === "undefined") return;
    try {
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      // Fallback handled by the primary button on the confirmation screen
    }
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (isSubmitting) return;

    const cleanDevice = values.device.trim() || "Waschmaschine";
    const cleanCustomDevice =
      cleanDevice === "Sonstiges" || cleanDevice.includes("Anderes")
        ? values.customDevice?.trim() || ""
        : "";
    const cleanProblemBase = values.problem.trim();
    const formattedProblem = cleanProblemBase.startsWith("[")
      ? cleanProblemBase
      : `${activeType.tagPrefix} ${cleanProblemBase}`;

    const submissionPayload: RepairValues = {
      ...values,
      inquiryMode: "repair",
      visitType: "home_visit",
      device: cleanDevice,
      customDevice: cleanCustomDevice,
      brand: values.brand.trim(),
      model: values.model.trim(),
      callbackTime: values.callbackTime.trim() || "Jederzeit erreichbar",
      hasTypeplatePhoto: Boolean(values.hasTypeplatePhoto),
      problem: cleanProblemBase.length >= 3 ? formattedProblem : cleanProblemBase,
      zip: values.zip.trim(),
      streetAddress: values.streetAddress?.trim() || "",
      name: values.name.trim() || "Interessent (Osnabrück)",
      phone: values.phone.trim(),
      preferredChannel: "whatsapp",
    };

    const validationErrors: RepairErrors = {
      ...validate(submissionPayload),
      ...validateRepairValuesRealtime(values),
    };

    if (Object.keys(validationErrors).length > 0) {
      setTouched({
        device: true,
        customDevice: isCustomDeviceRequired,
        problem: true,
        zip: true,
        phone: true,
      });
      setErrors(validationErrors);
      setToastErrors(toToastErrors(validationErrors));
      const firstKey = Object.keys(validationErrors)[0] as keyof RepairValues | undefined;
      if (firstKey) {
        focusField(firstKey);
      }
      return;
    }

    if (!privacyAccepted) {
      setPrivacyError(
        "Bitte bestätigen Sie kurz den Datenschutzhinweis vor dem Absenden."
      );
      window.setTimeout(() => {
        const el = formRef.current?.querySelector<HTMLElement>(
          '[data-field="privacy"]'
        );
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.focus({ preventScroll: true });
      }, 60);
      return;
    }

    setPrivacyError(null);
    setErrors({});
    setToastErrors(null);
    setSubmitErrorMsg(null);

    const immediateHandoff = prepareImmediateWhatsAppHandoff(submissionPayload);
    if (!immediateHandoff.whatsappUrl) {
      setSubmitErrorMsg(
        "Bitte prüfen Sie Gerät, Anliegen, Ort & Telefonnummer."
      );
      setStatus("error");
      return;
    }

    hapticSuccess();
    launchWhatsAppAutomatically(immediateHandoff.whatsappUrl);

    setReferenceId(immediateHandoff.referenceId);
    setWhatsappUrl(immediateHandoff.whatsappUrl);
    setSharedMapsUrl(immediateHandoff.mapsLocationUrl);
    setMessageText(immediateHandoff.messageText);
    setHasSentWhatsApp(true);
    clearRepairDraft();
    setConfettiBurstCount((c) => c + 1);
    setStatus("success");

    try {
      const res = await submitRepairRequest(
        submissionPayload,
        honeypot,
        immediateHandoff.referenceId
      );
      setReferenceId(res.referenceId);
      setWhatsappUrl(res.whatsappUrl);
      setSharedMapsUrl(res.mapsLocationUrl);
      setMessageText(res.messageText);
    } catch {
      // WhatsApp was already opened with the complete message; keep success state active
    }
  }

  async function copyMessage() {
    if (!messageText) return;
    let didCopy = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(messageText);
        didCopy = true;
      }
    } catch {
      didCopy = false;
    }

    if (!didCopy && typeof document !== "undefined") {
      try {
        const ta = document.createElement("textarea");
        ta.value = messageText;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        didCopy = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        didCopy = false;
      }
    }

    if (didCopy) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  function resetForm() {
    setValues({
      ...emptyValues,
      inquiryMode: "repair",
      visitType: "home_visit",
      device: initial.device || "Waschmaschine",
      customDevice: initial.custom,
      brand: defaultBrand || "",
      zip: "49082 Osnabrück",
    });
    setErrors({});
    setTouched({});
    setToastErrors(null);
    setStatus("idle");
    setReferenceId("");
    setWhatsappUrl("");
    setSharedMapsUrl("");
    setMessageText("");
    setHasSentWhatsApp(false);
    setServiceDoneRated(false);
    setPrivacyAccepted(false);
    setPrivacyError(null);
    clearRepairDraft();
  }

  const optionalSummaryParts = [
    values.brand.trim() && `Marke: ${values.brand.trim()}`,
    values.model.trim() && `E-Nr.: ${values.model.trim()}`,
    values.hasTypeplatePhoto && "Typenschild-Foto",
    values.callbackTime &&
      values.callbackTime !== "Jederzeit erreichbar" &&
      values.callbackTime,
    values.name.trim() && values.name.trim(),
    values.streetAddress?.trim() && values.streetAddress.trim(),
    values.urgency === "express"
      ? "Dringend"
      : values.urgency === "notfall"
      ? "Sehr dringend"
      : "",
  ].filter(Boolean);

  const whatsappWebUrl = messageText ? buildWhatsAppWebUrl(messageText) : "";

  if (status === "success") {
    return (
      <div
        ref={successRef}
        className="relative w-full max-w-full overflow-hidden rounded-2xl border border-emerald-500/35 bg-white dark:bg-slate-900 p-4 sm:p-7 shadow-lg"
      >
        <CelebrationConfetti triggerKey={confettiBurstCount} />
        <div className="relative z-10 space-y-4 sm:space-y-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={24} />
            </div>
            <div className="min-w-0">
              <span className="font-mono text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Bereit · <span dir="ltr" translate="no" className="notranslate">#{referenceId}</span>
              </span>
              <h3 className="mt-0.5 text-base sm:text-xl font-extrabold text-primary dark:text-white">
                In <span translate="no" className="notranslate">WhatsApp</span> auf „Senden“ tippen
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-ink-muted">
                Ihre strukturierte Nachricht für Herrn <span translate="no" className="notranslate">Hannachi</span> ist startklar. App nicht geöffnet? Direkt starten oder Text kopieren.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-row flex-wrap gap-2">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  triggerHapticFeedback(50);
                  setHasSentWhatsApp(true);
                  clearRepairDraft();
                }}
                className="col-span-2 sm:col-span-1 sm:flex-1 sm:min-w-[200px] inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] px-4 sm:px-5 py-3 text-xs sm:text-sm font-extrabold text-white text-center shadow-md transition-all"
              >
                <MessageCircle size={18} className="shrink-0" />
                <span><span translate="no" className="notranslate">WhatsApp</span> öffnen</span>
                <ArrowRight size={15} className="shrink-0" />
              </a>
            )}
            {whatsappWebUrl && (
              <a
                href={whatsappWebUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => triggerHapticFeedback(35)}
                className="col-span-1 inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 sm:px-4 py-3 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 active:scale-[0.98] transition-all shrink-0"
              >
                <MessageCircle size={15} className="shrink-0" />
                <span translate="no" className="notranslate truncate">WhatsApp Web</span>
              </a>
            )}
            <button
              type="button"
              onClick={copyMessage}
              className={`${
                whatsappWebUrl ? "col-span-1" : "col-span-2 sm:col-span-1"
              } inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border border-primary/15 dark:border-white/15 bg-surface dark:bg-slate-800 px-3 sm:px-4 py-3 text-xs font-bold text-primary dark:text-slate-100 hover:border-accent active:scale-[0.98] transition-all cursor-pointer shrink-0`}
            >
              {copied ? (
                <span key="rf-copied" className="inline-flex items-center gap-1.5">
                  <Check size={15} className="text-emerald-500 shrink-0" />
                  <span>Kopiert</span>
                </span>
              ) : (
                <span key="rf-copy" className="inline-flex items-center gap-1.5">
                  <Copy size={15} className="shrink-0" />
                  <span>Kopieren</span>
                </span>
              )}
            </button>
          </div>

          {(values.hasTypeplatePhoto || requestType === "check_parts") && (
            <div className="flex items-start gap-2.5 rounded-xl border border-sky-500/25 bg-sky-50/80 dark:bg-sky-950/30 px-3.5 py-2.5 text-xs text-primary dark:text-slate-200">
              <Camera size={16} className="text-accent shrink-0 mt-0.5" aria-hidden="true" />
              <p className="leading-relaxed">
                <strong className="font-bold">Tipp für sofortige Auskunft:</strong> Tippen Sie im WhatsApp-Chat kurz auf die Kamera / Büroklammer und senden Sie ein Foto vom Typenschild direkt mit.
              </p>
            </div>
          )}

          {/* Genuine styled WhatsApp chat bubble preview */}
          <div className="rounded-2xl rounded-tr-sm border border-emerald-500/25 bg-[#e7ffdb]/80 dark:bg-emerald-950/45 p-3.5 text-xs text-slate-800 dark:text-slate-100">
            <div className="space-y-0.5 max-h-52 overflow-y-auto pr-1">
              {renderWhatsAppFormattedMessage(messageText)}
            </div>
            <div className="mt-2 pt-1.5 border-t border-emerald-600/15 flex items-center justify-between text-[10.5px] font-semibold text-emerald-800/80 dark:text-emerald-300/80">
              <span>Fertige Nachricht an <span translate="no" className="notranslate">{business.owner}</span></span>
              <span className="inline-flex items-center gap-1 shrink-0">
                <span>Bereit</span>
                <CheckCheck size={13} className="text-sky-600 dark:text-sky-400" />
              </span>
            </div>
          </div>

          {sharedMapsUrl && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-800/50 px-3 sm:px-3.5 py-2 text-xs">
              <span className="inline-flex items-center gap-1.5 text-ink-muted min-w-0">
                <MapPin size={14} className="text-accent shrink-0" />
                <span className="truncate">{values.zip}</span>
              </span>
              <a
                href={sharedMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                translate="no"
                className="notranslate inline-flex min-h-[40px] items-center font-bold text-accent hover:underline shrink-0"
              >
                Google Maps →
              </a>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-primary/10 dark:border-white/10 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={business.phoneHref}
                className="inline-flex min-h-[44px] items-center gap-1.5 font-bold text-primary dark:text-slate-200 hover:text-accent transition-colors"
              >
                <Phone size={14} className="text-accent" />
                <span>
                  Lieber anrufen (
                  <span dir="ltr" translate="no" className="notranslate tabular-nums">
                    {business.phoneDisplay}
                  </span>
                  )
                </span>
              </a>
              <a
                href={business.mapsWriteReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setServiceDoneRated(true)}
                className="inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400 hover:underline"
              >
                <Star size={14} />
                <span key={serviceDoneRated ? "rf-rated" : "rf-rate"}>
                  {serviceDoneRated ? "Danke!" : "Auf Google bewerten"}
                </span>
              </a>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex min-h-[44px] items-center font-bold text-accent hover:underline cursor-pointer"
            >
              Neue Anfrage →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <form
        ref={formRef}
        onSubmit={onSubmit}
        noValidate
        className={`w-full max-w-full overflow-hidden rounded-2xl border border-primary/12 dark:border-white/12 bg-surface dark:bg-slate-950 text-primary dark:text-slate-100 shadow-sm ${
          compact ? "p-3.5 sm:p-5" : "p-4 sm:p-6 lg:p-7"
        }`}
      >
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className="hidden"
        />

        <fieldset
          disabled={isSubmitting}
          className="min-w-0 w-full max-w-full space-y-4 sm:space-y-5"
        >
          {/* STEP 1: Gerät & Anliegen */}
          <div className="min-w-0 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-extrabold text-primary dark:text-white">
                1. Gerät &amp; Anliegen wählen
              </span>
              <div
                role="group"
                aria-label="Art der Anfrage"
                className="grid grid-cols-3 w-full sm:w-auto rounded-xl bg-white dark:bg-slate-900 p-1 border border-primary/10 dark:border-white/10 gap-1"
              >
                {REQUEST_TYPES.map((option) => {
                  const Icon = option.icon;
                  const active = requestType === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      data-compact-label="true"
                      onClick={() => {
                        hapticTap();
                        setRequestType(option.id);
                      }}
                      aria-pressed={active}
                      className={`relative inline-flex min-h-[44px] sm:min-h-[38px] flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 rounded-lg px-1.5 sm:px-2.5 py-2 sm:py-1.5 text-[10.5px] sm:text-xs font-bold transition-colors cursor-pointer whitespace-nowrap min-w-0 ${
                        active
                          ? "text-white"
                          : "text-ink-muted hover:text-primary dark:hover:text-white"
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId={`${uid}-request-type-pill`}
                          transition={
                            prefersReducedMotion
                              ? { duration: 0.1 }
                              : { type: "spring", stiffness: 460, damping: 32 }
                          }
                          aria-hidden="true"
                          className="absolute inset-0 rounded-lg bg-accent shadow-xs"
                        />
                      )}
                      <Icon size={13} aria-hidden="true" className="relative z-10 shrink-0" />
                      <span data-compact-label="true" className="relative z-10 max-w-full truncate leading-tight">
                        {option.shortLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              data-field="device"
              tabIndex={-1}
              className="grid grid-cols-6 sm:grid-cols-5 gap-1.5 sm:gap-2"
            >
              {CORE_DEVICES.map((d, idx) => {
                const isSelected = values.device === d.value;
                return (
                    <motion.button
                      key={d.value}
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 520, damping: 25 }}
                      type="button"
                      data-compact-label="true"
                      onClick={() => {
                        hapticTap();
                        set("device", d.value);
                      }}
                      aria-pressed={isSelected}
                      className={`${
                        idx < 3 ? "col-span-2 sm:col-span-1" : "col-span-3 sm:col-span-1"
                      } flex min-h-[64px] w-full min-w-0 flex-col items-center justify-center text-center gap-1 rounded-xl border px-1.5 py-2 text-[11px] font-bold transition-all cursor-pointer ${
                        isSelected
                          ? "border-accent bg-accent text-white shadow-sm shadow-accent/20"
                          : "border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 text-primary dark:text-slate-200 hover:border-accent/50"
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                          isSelected ? "bg-white/20 text-white" : d.badgeClass
                        }`}
                      >
                        <ApplianceLogo device={d.value} size={18} />
                      </span>
                      <span data-compact-label="true" className="w-full truncate tracking-[-0.01em]">
                        {d.label}
                      </span>
                    </motion.button>
                );
              })}
            </div>

            <AnimatePresence>
              {isCustomDeviceRequired && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-0.5">
                    <div className="relative">
                      <input
                        data-field="customDevice"
                        type="text"
                        enterKeyHint="next"
                        aria-invalid={Boolean(errors.customDevice)}
                        value={values.customDevice || ""}
                        onChange={(e) => set("customDevice", e.target.value)}
                        onBlur={() => handleBlur("customDevice")}
                        placeholder="Welches Gerät? * (z. B. Trockner, Kaffeevollautomat)"
                        className={`w-full min-h-[44px] rounded-xl border bg-white dark:bg-slate-900 px-3.5 pr-9 py-2 text-base sm:text-sm text-primary dark:text-slate-100 placeholder:text-ink-faint focus:outline-none transition-colors ${
                          errors.customDevice
                            ? "border-red-500 focus:border-red-500"
                            : !realtimeErrors.customDevice
                            ? "border-emerald-500/60 focus:border-emerald-500"
                            : "border-primary/15 dark:border-white/15 focus:border-accent"
                        }`}
                      />
                      {!realtimeErrors.customDevice && (
                        <CheckCircle2
                          size={16}
                          aria-hidden="true"
                          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500"
                        />
                      )}
                    </div>
                    {errors.customDevice && (
                      <p
                        role="alert"
                        className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-500"
                      >
                        <AlertCircle size={13} />
                        <span>{errors.customDevice}</span>
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* STEP 2: Problem (1-Tap Chips + Short Text) */}
          <div className="min-w-0 pt-3 border-t border-primary/8 dark:border-white/8 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor={id("problem")}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-primary dark:text-white"
              >
                <span>2. Was benötigen Sie? *</span>
                {isProblemReady && (
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                )}
              </label>
              <span className="text-[11px] text-ink-muted">Antippen reicht</span>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5">
              {activeType.quickHints.map((hint, idx) => {
                const isSelected = values.problem
                  .toLowerCase()
                  .includes(hint.toLowerCase());
                const isOddLast =
                  activeType.quickHints.length % 2 === 1 &&
                  idx === activeType.quickHints.length - 1;
                return (
                  <motion.button
                    key={hint}
                    type="button"
                    whileHover={prefersReducedMotion ? undefined : { y: -1 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 520, damping: 28 }}
                    onClick={() => toggleHint(hint)}
                    aria-pressed={isSelected}
                    className={`${
                      isOddLast ? "col-span-2 sm:col-span-1" : ""
                    } inline-flex min-h-[44px] sm:min-h-[38px] max-w-full items-center justify-center sm:justify-start gap-1.5 rounded-xl border px-2.5 sm:px-3 py-2 sm:py-1.5 text-xs font-semibold text-center sm:text-left leading-snug transition-colors cursor-pointer ${
                      isSelected
                        ? "border-emerald-500/60 bg-emerald-500/12 text-emerald-800 dark:text-emerald-300"
                        : "border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 text-ink-muted hover:border-accent/50 hover:text-primary dark:hover:text-white"
                    }`}
                  >
                    {isSelected && (
                      <Check size={12} strokeWidth={3} className="shrink-0" />
                    )}
                    <span>{hint}</span>
                  </motion.button>
                );
              })}
            </div>

            <textarea
              id={id("problem")}
              data-field="problem"
              rows={2}
              aria-invalid={Boolean(errors.problem)}
              value={values.problem}
              onChange={(e) => set("problem", e.target.value)}
              onBlur={() => handleBlur("problem")}
              placeholder={activeType.placeholder}
              className={`w-full min-h-[60px] rounded-xl border bg-white dark:bg-slate-900 px-3.5 py-2.5 text-base sm:text-sm text-primary dark:text-slate-100 placeholder:text-ink-faint focus:outline-none transition-colors resize-y ${
                errors.problem
                  ? "border-red-500 focus:border-red-500"
                  : isProblemReady
                  ? "border-emerald-500/60 focus:border-emerald-500"
                  : "border-primary/15 dark:border-white/15 focus:border-accent"
              }`}
            />
            {errors.problem && (
              <p
                role="alert"
                className="flex items-center gap-1 text-xs font-semibold text-red-500"
              >
                <AlertCircle size={13} />
                <span>{errors.problem}</span>
              </p>
            )}
          </div>

          {/* STEP 3: Ort & Kontakt */}
          <div className="min-w-0 pt-3 border-t border-primary/8 dark:border-white/8 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-extrabold text-primary dark:text-white">
                3. Ort &amp; Rückruf <span className="font-semibold text-ink-faint">(Telefon optional)</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={shareGpsLocation}
                  disabled={gpsStatus === "locating"}
                  aria-busy={gpsStatus === "locating"}
                  className="inline-flex min-h-[44px] sm:min-h-[36px] items-center gap-1.5 rounded-xl sm:rounded-lg border border-primary/12 dark:border-white/15 bg-white dark:bg-slate-900 px-3 sm:px-2.5 py-1.5 sm:py-1 text-xs sm:text-[11px] font-bold text-primary dark:text-slate-200 hover:border-accent active:scale-95 transition-all disabled:opacity-65 disabled:cursor-wait cursor-pointer"
                >
                  {gpsStatus === "locating" ? (
                    <Loader2 size={13} className="animate-spin text-accent shrink-0" />
                  ) : (
                    <Navigation size={13} className="text-accent shrink-0" />
                  )}
                  <span key={gpsStatus === "locating" ? "rf-loc" : "rf-ort"}>
                    {gpsStatus === "locating" ? "Suche…" : "Mein Ort"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback(35);
                    setIsMapModalOpen(true);
                  }}
                  className="inline-flex min-h-[44px] sm:min-h-[36px] items-center gap-1.5 rounded-xl sm:rounded-lg border border-primary/12 dark:border-white/15 bg-white dark:bg-slate-900 px-3 sm:px-2.5 py-1.5 sm:py-1 text-xs sm:text-[11px] font-bold text-primary dark:text-slate-200 hover:border-accent active:scale-95 transition-all cursor-pointer"
                >
                  <MapPin size={13} className="text-accent shrink-0" />
                  <span>Karte</span>
                </button>
              </div>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              {/* Optional Input: Phone / Callback */}
              <div className="min-w-0">
                <label
                  htmlFor={id("phone")}
                  className="flex items-center justify-between gap-2 text-[11px] font-bold text-ink-muted mb-1"
                >
                  <span>Telefon (optional)</span>
                  {isPhoneValid && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={12} />
                      <span>OK</span>
                    </span>
                  )}
                </label>
                <div className="relative">
                  <Phone
                    size={15}
                    className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                      errors.phone
                        ? "text-red-500"
                        : isPhoneValid
                        ? "text-emerald-500"
                        : "text-ink-faint"
                    }`}
                  />
                  <input
                    id={id("phone")}
                    data-field="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    enterKeyHint="done"
                    aria-invalid={Boolean(errors.phone)}
                    value={values.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    onBlur={() => handleBlur("phone")}
                    placeholder="Für Rückruf (z. B. 0170…)"
                    className={`w-full min-h-[48px] rounded-xl border bg-white dark:bg-slate-900 pl-10 pr-9 py-2 text-base sm:text-sm text-primary dark:text-slate-100 placeholder:text-ink-faint focus:outline-none transition-colors ${
                      errors.phone
                        ? "border-red-500 focus:border-red-500"
                        : isPhoneValid
                        ? "border-emerald-500/60 focus:border-emerald-500"
                        : "border-primary/15 dark:border-white/15 focus:border-accent"
                    }`}
                  />
                  {isPhoneValid && (
                    <CheckCircle2
                      size={16}
                      aria-hidden="true"
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500"
                    />
                  )}
                </div>
                {errors.phone ? (
                  <p
                    role="alert"
                    className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-500"
                  >
                    <AlertCircle size={13} />
                    <span>{errors.phone}</span>
                  </p>
                ) : (
                  isPhoneEntered &&
                  !isPhoneValid && (
                    <p className="mt-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                      {realtimeErrors.phone}
                    </p>
                  )
                )}
              </div>

              {/* Pre-filled Location: PLZ / Ort */}
              <div className="min-w-0">
                <label
                  htmlFor={id("zip")}
                  className="flex items-center justify-between gap-2 text-[11px] font-bold text-ink-muted mb-1"
                >
                  <span>PLZ / Ort</span>
                  {isZipReady && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={12} />
                      <span>Aktiv</span>
                    </span>
                  )}
                </label>
                <input
                  id={id("zip")}
                  data-field="zip"
                  type="text"
                  autoComplete="postal-code"
                  enterKeyHint="next"
                  aria-invalid={Boolean(errors.zip)}
                  value={values.zip}
                  onChange={(e) => set("zip", e.target.value)}
                  onBlur={() => handleBlur("zip")}
                  placeholder="z. B. 49082 Osnabrück"
                  className={`w-full min-h-[48px] rounded-xl border bg-white dark:bg-slate-900 px-3.5 py-2 text-base sm:text-sm text-primary dark:text-slate-100 placeholder:text-ink-faint focus:outline-none transition-colors ${
                    errors.zip
                      ? "border-red-500 focus:border-red-500"
                      : isZipReady
                      ? "border-emerald-500/60 focus:border-emerald-500"
                      : "border-primary/15 dark:border-white/15 focus:border-accent"
                  }`}
                />
                {errors.zip && (
                  <p
                    role="alert"
                    className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-500"
                  >
                    <AlertCircle size={13} />
                    <span>{errors.zip}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Quick Area Pills (Native Horizontal Snap Rail on Mobile) */}
            <div className="flex sm:flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar snap-x -mx-1 px-1 pb-0.5">
              {osnabrueckServiceAreas.slice(0, 5).map((area) => {
                const active =
                  values.zip.includes(area.zip) ||
                  values.zip.toLowerCase().includes(area.city.toLowerCase());
                return (
                  <motion.button
                    key={area.zip}
                    type="button"
                    whileHover={prefersReducedMotion ? undefined : { y: -1 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 520, damping: 28 }}
                    onClick={() => {
                      hapticTap();
                      set("zip", area.value);
                    }}
                    className={`shrink-0 snap-start whitespace-nowrap min-h-[42px] sm:min-h-[34px] rounded-xl sm:rounded-lg border px-3 sm:px-2.5 py-1.5 sm:py-1 text-xs sm:text-[11px] font-semibold transition-colors cursor-pointer ${
                      active
                        ? "border-accent bg-accent/12 text-accent"
                        : "border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 text-ink-muted hover:text-primary dark:hover:text-white"
                    }`}
                  >
                    {area.label}
                  </motion.button>
                );
              })}
            </div>

            {gpsError && (
              <div
                role="status"
                className="flex items-start gap-2 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-[11px] font-semibold text-amber-900 dark:text-amber-100"
              >
                <AlertCircle
                  size={14}
                  className="text-amber-600 dark:text-amber-300 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1 leading-snug">
                  <p>{gpsError}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => void shareGpsLocation()}
                      className="font-bold text-amber-950 dark:text-white underline underline-offset-2 hover:text-accent cursor-pointer"
                    >
                      Erneut versuchen
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHapticFeedback(30);
                        setGpsError(null);
                        setIsMapModalOpen(true);
                      }}
                      className="font-bold text-accent underline underline-offset-2 hover:opacity-80 cursor-pointer"
                    >
                      Auf Karte wählen
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setGpsError(null)}
                  aria-label="Hinweis schließen"
                  className="p-0.5 hover:opacity-75 cursor-pointer shrink-0"
                >
                  <X size={13} aria-hidden="true" />
                </button>
              </div>
            )}

            {verifiedLocation && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                <span className="flex items-center gap-1.5 min-w-0">
                  <Check size={13} className="shrink-0" />
                  <span className="truncate">
                    Standort:{" "}
                    {verifiedLocation.streetAddress
                      ? `${verifiedLocation.streetAddress}, `
                      : ""}
                    {verifiedLocation.zipAndCity}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback(25);
                    setIsMapModalOpen(true);
                  }}
                  className="shrink-0 underline underline-offset-2 hover:text-emerald-900 dark:hover:text-white cursor-pointer"
                >
                  Ändern
                </button>
              </div>
            )}
          </div>

          {/* Optional Details Accordion (Marke, Name, Straße, Dringlichkeit) */}
          <div className="pt-2 border-t border-primary/8 dark:border-white/8">
            <button
              type="button"
              onClick={() => {
                hapticTap();
                setShowOptionalFields((prev) => !prev);
              }}
              aria-expanded={showOptionalFields}
              className="flex min-h-[46px] w-full items-center justify-between gap-2 rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-ink-muted hover:text-primary dark:hover:text-white transition-colors cursor-pointer"
            >
              <span
                key={
                  showOptionalFields
                    ? "opt-hide"
                    : optionalSummaryParts.length > 0
                    ? "opt-summary"
                    : "opt-default"
                }
                className="min-w-0 text-left truncate"
              >
                {showOptionalFields
                  ? "Optionale Angaben ausblenden"
                  : optionalSummaryParts.length > 0
                  ? `Optional: ${optionalSummaryParts.join(" · ")}`
                  : "+ Optional: Marke, E-Nr., Erreichbarkeit & Name"}
              </span>
              <ChevronDown
                size={15}
                className={`shrink-0 text-accent transition-transform duration-200 ${
                  showOptionalFields ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence initial={false}>
              {showOptionalFields && (
                <motion.div
                  initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 space-y-3 rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 p-3 sm:p-4">
                    {/* Optional Brand + Quick Chips */}
                    <div className="space-y-1.5">
                        <label
                          htmlFor={id("brand")}
                          className="block text-[11px] font-bold text-ink-muted"
                        >
                          Marke / Modell (optional)
                        </label>
                      <input
                        id={id("brand")}
                        data-field="brand"
                        type="text"
                        enterKeyHint="next"
                        value={values.brand}
                        onChange={(e) => set("brand", e.target.value)}
                        placeholder="z. B. Miele, Bosch Serie 6, Siemens…"
                        className="w-full min-h-[42px] rounded-xl border border-primary/12 dark:border-white/12 bg-surface dark:bg-slate-950 px-3.5 py-2 text-base sm:text-sm text-primary dark:text-slate-100 placeholder:text-ink-faint focus:border-accent focus:outline-none"
                      />
                      <div className="flex sm:flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar snap-x -mx-1 px-1 pb-0.5">
                        {popularBrands.slice(0, 7).map((b) => {
                          const active = values.brand
                            .toLowerCase()
                            .includes(b.toLowerCase());
                          return (
                            <button
                              key={b}
                              type="button"
                              translate="no"
                              onClick={() => {
                                hapticTap();
                                set(
                                  "brand",
                                  active
                                    ? ""
                                    : values.brand.trim()
                                    ? `${b} ${values.brand}`
                                    : b
                                );
                              }}
                              className={`notranslate shrink-0 snap-start whitespace-nowrap min-h-[42px] sm:min-h-[32px] rounded-xl sm:rounded-lg border px-3 sm:px-2.5 py-1.5 sm:py-1 text-xs sm:text-[11px] font-bold transition-colors cursor-pointer ${
                                active
                                  ? "border-accent bg-accent/15 text-accent"
                                  : "border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-950 text-ink-muted hover:text-primary dark:hover:text-white"
                              }`}
                            >
                              {b}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* E-Nr. / Modellnummer + 1-Tap Typenschild-Foto Toggle */}
                    <div className="space-y-2">
                      <label
                        htmlFor={id("model")}
                        className="block text-[11px] font-bold text-ink-muted"
                      >
                        E-Nr. / Modellnummer vom Typenschild (für schnelle Teile-Prüfung)
                      </label>
                      <input
                        id={id("model")}
                        data-field="model"
                        type="text"
                        enterKeyHint="next"
                        value={values.model}
                        onChange={(e) => set("model", e.target.value)}
                        placeholder="z. B. WM14T420/01 oder W1 WCD 120"
                        className="w-full min-h-[44px] rounded-xl border border-primary/12 dark:border-white/12 bg-surface dark:bg-slate-950 px-3.5 py-2 text-base sm:text-sm text-primary dark:text-slate-100 placeholder:text-ink-faint focus:border-accent focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          hapticTap();
                          set("hasTypeplatePhoto", !values.hasTypeplatePhoto);
                        }}
                        aria-pressed={Boolean(values.hasTypeplatePhoto)}
                        className={`w-full min-h-[46px] flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
                          values.hasTypeplatePhoto
                            ? "border-emerald-500/45 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
                            : "border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-950 text-ink-muted hover:border-accent/40 hover:text-primary dark:hover:text-white"
                        }`}
                      >
                        <span className="inline-flex items-center gap-2 min-w-0">
                          <Camera size={14} className="shrink-0" aria-hidden="true" />
                          <span className="truncate">
                            Foto vom Typenschild sende ich direkt im WhatsApp-Chat
                          </span>
                        </span>
                        <span
                          className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[10px] ${
                            values.hasTypeplatePhoto
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-primary/20 dark:border-white/20"
                          }`}
                        >
                          {values.hasTypeplatePhoto && <Check size={12} aria-hidden="true" />}
                        </span>
                      </button>
                    </div>

                    {/* Wunsch-Erreichbarkeit */}
                    <div className="space-y-1.5">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-ink-muted">
                        <Clock size={12} className="text-accent" aria-hidden="true" />
                        <span>Wunsch-Erreichbarkeit (optional)</span>
                      </span>
                      <div className="flex sm:flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar snap-x -mx-1 px-1 pb-0.5">
                        {CALLBACK_TIME_CHIPS.map((slot) => {
                          const active =
                            (values.callbackTime || "Jederzeit erreichbar") === slot.value;
                          return (
                            <button
                              key={slot.value}
                              type="button"
                              data-field={
                                slot.value === CALLBACK_TIME_CHIPS[0].value
                                  ? "callbackTime"
                                  : undefined
                              }
                              onClick={() => {
                                hapticTap();
                                set("callbackTime", slot.value);
                              }}
                              aria-pressed={active}
                              className={`shrink-0 snap-start whitespace-nowrap min-h-[42px] sm:min-h-[32px] rounded-xl sm:rounded-lg border px-3 sm:px-2.5 py-1.5 sm:py-1 text-xs sm:text-[11px] font-bold transition-colors cursor-pointer ${
                                active
                                  ? "border-accent bg-accent/15 text-accent"
                                  : "border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-950 text-ink-muted hover:text-primary dark:hover:text-white"
                              }`}
                            >
                              {slot.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Optional Name + Street */}
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      <div className="min-w-0">
                        <label
                          htmlFor={id("name")}
                          className="block text-[11px] font-bold text-ink-muted mb-1"
                        >
                          Ihr Name (optional)
                        </label>
                        <input
                          id={id("name")}
                          data-field="name"
                          type="text"
                          autoComplete="name"
                          value={values.name}
                          onChange={(e) => set("name", e.target.value)}
                          placeholder="z. B. Max Mustermann"
                          className="w-full min-h-[42px] rounded-xl border border-primary/12 dark:border-white/12 bg-surface dark:bg-slate-950 px-3.5 py-2 text-base sm:text-sm text-primary dark:text-slate-100 placeholder:text-ink-faint focus:border-accent focus:outline-none"
                        />
                      </div>

                      <div className="min-w-0">
                        <label
                          htmlFor={id("streetAddress")}
                          className="block text-[11px] font-bold text-ink-muted mb-1"
                        >
                          Straße &amp; Hausnummer (optional)
                        </label>
                        <input
                          id={id("streetAddress")}
                          data-field="streetAddress"
                          type="text"
                          value={values.streetAddress || ""}
                          onChange={(e) => set("streetAddress", e.target.value)}
                          placeholder="z. B. Musterstraße 12"
                          className="w-full min-h-[42px] rounded-xl border border-primary/12 dark:border-white/12 bg-surface dark:bg-slate-950 px-3.5 py-2 text-base sm:text-sm text-primary dark:text-slate-100 placeholder:text-ink-faint focus:border-accent focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {status === "error" && submitErrorMsg && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-300"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{submitErrorMsg}</span>
            </div>
          )}

          {/* Compact Collapsible WhatsApp Preview */}
          <WhatsAppPreview
            device={values.device}
            customDevice={values.customDevice}
            brand={values.brand}
            model={values.model}
            hasTypeplatePhoto={Boolean(values.hasTypeplatePhoto)}
            problem={values.problem}
            urgency={values.urgency}
            onUrgencyChange={(urgency) => set("urgency", urgency)}
            zip={values.zip}
            streetAddress={values.streetAddress}
            locationVerified={values.locationVerified}
            phone={values.phone}
            formattedMessage={liveWhatsAppPayload?.valid ? liveWhatsAppPayload.message : null}
            isReady={isReadyForWhatsApp}
            readinessItems={[
              {
                label: "Gerät",
                ready: isDeviceReady,
                target: (realtimeErrors.customDevice
                  ? "customDevice"
                  : "device") as keyof RepairValues,
              },
              { label: "Anliegen", ready: isProblemReady, target: "problem" },
              { label: "Ort", ready: isZipReady, target: "zip" },
              ...(isPhoneEntered && !isPhoneValid
                ? [{ label: "Telefon", ready: false, target: "phone" as keyof RepairValues }]
                : []),
            ]}
            onFocusField={(field) => focusField(field)}
            onAddTypeplateInfo={() => focusField("model")}
          />

          {/* GDPR & WhatsApp Consent Acknowledgement (Art. 13 DSGVO) */}
          <div className="pt-1 space-y-1.5">
            <label
              htmlFor={id("privacy")}
              className={`flex min-h-[48px] items-start gap-3 rounded-xl border px-3.5 py-3 text-[11px] sm:text-xs leading-relaxed cursor-pointer transition-colors ${
                privacyError
                  ? "border-red-500/60 bg-red-500/[0.06] text-primary dark:text-slate-200"
                  : "border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 text-ink-muted dark:text-slate-300"
              }`}
            >
              <input
                id={id("privacy")}
                data-field="privacy"
                type="checkbox"
                checked={privacyAccepted}
                onChange={(e) => {
                  setPrivacyAccepted(e.target.checked);
                  if (e.target.checked) setPrivacyError(null);
                }}
                aria-invalid={Boolean(privacyError)}
                className="mt-0.5 h-5 w-5 sm:h-4 sm:w-4 shrink-0 rounded accent-accent cursor-pointer"
              />
              <span>
                Ich habe die{" "}
                <Link
                  href="/datenschutz"
                  className="font-semibold text-accent underline underline-offset-2"
                >
                  Datenschutzerklärung
                </Link>{" "}
                zur Verarbeitung meiner Angaben zur Bearbeitung meiner unverbindlichen Anfrage zur
                Kenntnis genommen. Mit dem Klick öffnet freiwillig{" "}
                <Link
                  href="/datenschutz#whatsapp"
                  className="font-semibold text-accent underline underline-offset-2"
                >
                  <span translate="no" className="notranslate">WhatsApp</span> (Meta)
                </Link>{" "}
                (Alternative: Telefon / E-Mail).
              </span>
            </label>
            {privacyError && (
              <p
                role="alert"
                className="flex items-center gap-1 text-xs font-semibold text-red-500"
              >
                <AlertCircle size={13} aria-hidden="true" />
                <span>{privacyError}</span>
              </p>
            )}
          </div>

          {/* Primary Submit CTA */}
          <div className="pt-0.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
            <p
              key={isReadyForWhatsApp && privacyAccepted ? "rf-ready" : "rf-hint"}
              className="text-[11px] text-ink-muted leading-snug"
            >
              {isReadyForWhatsApp && privacyAccepted
                ? "Fertig · öffnet direkt im WhatsApp-Chat."
                : "Kurz Anliegen antippen & Datenschutz bestätigen."}
            </p>
            <motion.button
              whileTap={prefersReducedMotion || isSubmitting ? undefined : { scale: 0.97 }}
              transition={{ type: "spring", stiffness: 520, damping: 25 }}
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex min-h-[50px] w-full sm:w-auto max-w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold text-white text-center shadow-md transition-colors disabled:opacity-60 cursor-pointer sm:whitespace-nowrap ${
                isReadyForWhatsApp && privacyAccepted
                  ? "btn-shimmer-beam bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25"
                  : "bg-slate-700 hover:bg-slate-600 shadow-slate-900/15"
              }`}
            >
              {isSubmitting ? (
                <span key="rf-submitting" className="inline-flex items-center gap-2">
                  <Loader2 size={17} className="animate-spin" />
                  <span>Wird geöffnet…</span>
                </span>
              ) : (
                <span key="rf-idle" className="inline-flex items-center gap-2">
                  <MessageCircle size={18} className="shrink-0" />
                  <span>Per <span translate="no" className="notranslate">WhatsApp</span> senden</span>
                  <ArrowRight size={15} className="shrink-0" />
                </span>
              )}
            </motion.button>
          </div>
        </fieldset>
      </form>

      <ValidationToast
        errors={toastErrors}
        mode="repair"
        onDismiss={() => setToastErrors(null)}
        onFieldSelect={(field) => focusField(field)}
      />

      <GoogleMapsPinModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        initialLat={values.coordinates?.lat}
        initialLng={values.coordinates?.lng}
        initialZip={values.zip}
        initialStreet={values.streetAddress}
        onConfirm={handleConfirmMapPin}
      />
    </>
  );
}