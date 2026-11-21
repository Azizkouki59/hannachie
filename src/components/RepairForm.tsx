"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Loader2,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Shield,
  ShieldCheck,
  Star,
  Wrench,
} from "lucide-react";
import { business } from "@/data/site";
import {
  emptyValues,
  hasMeaningfulDraftContent,
  loadRepairDraft,
  osnabrueckServiceAreas,
  popularBrands,
  prepareImmediateWhatsAppHandoff,
  resolveVerifiedFallbackLocation,
  reverseGeocodePosition,
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
import WhatsAppPreview from "@/components/WhatsAppPreview";
import ApplianceLogo from "@/components/ApplianceLogo";
import { getBrowserPositionWithFallback } from "@/lib/geolocation";
import { hapticSuccess, hapticTap, triggerHapticFeedback } from "@/lib/haptics";
import {
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
  icon: typeof Wrench;
};

const REQUEST_TYPES: RequestTypeOption[] = [
  {
    id: "check_parts",
    shortLabel: "Vor-Ort & Teil",
    tagPrefix: "[Vor-Ort-Check / Ersatzteil]",
    placeholder: "Kurz beschreiben (z. B. pumpt nicht ab, Fehlercode E15)...",
    quickHints: [
      "Pumpt nicht ab / Wasser steht",
      "Heizt / kühlt nicht mehr",
      "Macht laute Geräusche",
      "Ersatzteil nach E-Nr.",
    ],
    icon: Wrench,
  },
  {
    id: "replacement_offer",
    shortLabel: "Ersatzgerät",
    tagPrefix: "[Ersatzgerät mit Garantie]",
    placeholder: "Welches geprüfte Ersatzgerät mit Garantie suchen Sie?",
    quickHints: [
      "Geprüftes Ersatzgerät gesucht",
      "Altgerät lohnt nicht mehr",
      "Inkl. Lieferung in Osnabrück",
    ],
    icon: ShieldCheck,
  },
  {
    id: "warranty",
    shortLabel: "Garantie",
    tagPrefix: "[Garantie-Anfrage]",
    placeholder: "Kurz Problem mit Ihrem bei Hannachi gekauften Gerät nennen...",
    quickHints: [
      "Gerät bei Hannachi gekauft",
      "Garantiebeleg liegt vor",
      "Vor-Ort-Garantietermin",
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
    return "Bitte geben Sie Ihre Telefon- oder WhatsApp-Nummer ein.";
  }
  if (!PHONE_ALLOWED_REGEX.test(trimmed)) {
    return "Bitte nur Ziffern sowie +, -, ( ) und Leerzeichen verwenden.";
  }
  const digitCount = trimmed.replace(/\D/g, "").length;
  if (digitCount < 6 || !PHONE_VALID_REGEX.test(trimmed)) {
    const remaining = Math.max(0, 6 - digitCount);
    return remaining > 0
      ? `Noch ${remaining} ${remaining === 1 ? "Ziffer" : "Ziffern"} für gültige Nummer.`
      : "Bitte eine gültige Telefonnummer (6–30 Zeichen) eingeben.";
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
    nextErrors.device = "Bitte wählen Sie ein Gerät aus.";
  } else if (
    (cleanDevice === "Sonstiges" || cleanDevice.includes("Anderes")) &&
    cleanCustom.length < 2
  ) {
    nextErrors.customDevice =
      "Bitte nennen Sie kurz das Gerät (z. B. Trockner).";
  }

  if (cleanProblem.length < 4) {
    nextErrors.problem =
      "Bitte wählen Sie oben ein Problem oder schreiben Sie kurz 1–2 Worte.";
  }

  if (cleanZip.length < 3) {
    nextErrors.zip = "Bitte geben Sie PLZ / Ort in Osnabrück & Umgebung an.";
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
  compact = false,
  showPhotoGuideLink = false,
}: {
  defaultDevice?: string;
  defaultSymptom?: string;
  defaultBrand?: string;
  defaultMode?: InquiryMode;
  defaultRequestType?: RequestTypeId;
  compact?: boolean;
  showPhotoGuideLink?: boolean;
}) {
  const uid = useId();
  const prefersReducedMotion = useReducedMotion();
  const initial = resolveInitialDevice(defaultDevice);
  const initialDraftRef = useRef<ReturnType<typeof loadRepairDraft> | undefined>(undefined);
  if (initialDraftRef.current === undefined) {
    initialDraftRef.current = loadRepairDraft();
  }
  const restoredDraft = initialDraftRef.current;

  const inferRequestTypeFromSymptom = (symptomText?: string): RequestTypeId | null => {
    if (!symptomText) return null;
    const lower = symptomText.toLowerCase();
    if (lower.includes("garantieabwicklung") || lower.includes("garantie-anfrage")) {
      return "warranty";
    }
    if (
      lower.includes("geprüft") ||
      lower.includes("altgerät lohnt") ||
      lower.includes("ersatzgerät") ||
      lower.includes("ersatz-")
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
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [submitErrorMsg, setSubmitErrorMsg] = useState<string | null>(null);
  const [serviceDoneRated, setServiceDoneRated] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const prevDefaultsRef = useRef({ defaultDevice, defaultSymptom, defaultBrand });
  const isFirstSyncRef = useRef(true);

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
    prevDefaultsRef.current.defaultSymptom = defaultSymptom;
    if (defaultSymptom) {
      const inferred = inferRequestTypeFromSymptom(defaultSymptom);
      if (inferred) {
        setRequestType(inferred);
      }
      setValues((prev) => ({ ...prev, problem: defaultSymptom }));
      setStatus("idle");
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
    setRequestType(defaultRequestType);
    setStatus("idle");
  }, [defaultRequestType]);

  const id = (k: string) => `${uid}-${k}`;
  const activeType = REQUEST_TYPES.find((t) => t.id === requestType) || REQUEST_TYPES[0];
  const isSubmitting = status === "loading" || status === "completing";

  const realtimeErrors = useMemo(() => validateRepairValuesRealtime(values), [values]);
  const isCustomDeviceRequired =
    values.device === "Sonstiges" || values.device.includes("Anderes");
  const isDeviceReady = !realtimeErrors.device && !realtimeErrors.customDevice;
  const isProblemReady = !realtimeErrors.problem;
  const isZipReady = !realtimeErrors.zip;
  const isPhoneReady = !realtimeErrors.phone;
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
        model: "",
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
    }, 60);
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
    setVerifiedLocation(verified);
    setGpsStatus("shared");
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
    triggerHapticFeedback(40);
    setGpsStatus("locating");

    const applyFallback = () => {
      const fallback = resolveVerifiedFallbackLocation(
        values.zip || "49082 Osnabrück",
        values.streetAddress
      );
      setVerifiedLocation(fallback);
      setGpsStatus("fallback");
      setValues((prev) => ({
        ...prev,
        mapsLocationUrl: fallback.mapsUrl,
        zip: prev.zip.trim() ? prev.zip : fallback.zipAndCity,
        streetAddress: prev.streetAddress?.trim()
          ? prev.streetAddress
          : fallback.streetAddress,
        locationVerified: true,
        coordinates: {
          lat: fallback.lat,
          lng: fallback.lng,
          accuracy: fallback.accuracy,
        },
      }));
      setErrors((prev) => ({ ...prev, zip: undefined }));
    };

    const result = await getBrowserPositionWithFallback();
    if (!result.ok) {
      applyFallback();
      return;
    }

    try {
      const info = await reverseGeocodePosition(
        result.lat,
        result.lng,
        result.accuracy
      );
      setVerifiedLocation(info);
      setGpsStatus("shared");
      if (info.streetAddress) {
        setShowOptionalFields(true);
      }
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
      applyFallback();
    }
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
      model: "",
      problem: cleanProblemBase.length >= 4 ? formattedProblem : cleanProblemBase,
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

    setErrors({});
    setToastErrors(null);
    setSubmitErrorMsg(null);

    const immediateHandoff = prepareImmediateWhatsAppHandoff(submissionPayload);
    if (!immediateHandoff.whatsappUrl) {
      setSubmitErrorMsg(
        "Bitte prüfen Sie Gerät, Problem-Auswahl, Ort & Telefonnummer."
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
    try {
      await navigator.clipboard?.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard blocked in restricted frame
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
    clearRepairDraft();
  }

  const optionalSummaryParts = [
    values.brand.trim() && `Marke: ${values.brand.trim()}`,
    values.name.trim() && values.name.trim(),
    values.streetAddress?.trim() && values.streetAddress.trim(),
    values.urgency === "express"
      ? "Dringend"
      : values.urgency === "notfall"
      ? "Notfall"
      : "",
  ].filter(Boolean);

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
                WhatsApp geöffnet · #{referenceId}
              </span>
              <h3 className="mt-0.5 text-base sm:text-xl font-extrabold text-primary dark:text-white">
                Ihre Anfrage ist bereit in WhatsApp
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-ink-muted">
                Tippen Sie im WhatsApp-Chat einfach auf <strong>Senden</strong>. Falls sich WhatsApp nicht geöffnet hat, nutzen Sie den Button unten:
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
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
                className="flex-1 min-w-0 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] px-4 sm:px-5 py-3 text-xs sm:text-sm font-extrabold text-white text-center shadow-md transition-all"
              >
                <MessageCircle size={18} className="shrink-0" />
                <span>WhatsApp jetzt öffnen / senden</span>
                <ArrowRight size={15} className="shrink-0" />
              </a>
            )}
            <button
              type="button"
              onClick={copyMessage}
              className="inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border border-primary/15 dark:border-white/15 bg-surface dark:bg-slate-800 px-4 py-3 text-xs font-bold text-primary dark:text-slate-100 hover:border-accent active:scale-[0.98] transition-all cursor-pointer shrink-0"
            >
              {copied ? (
                <>
                  <Check size={15} className="text-emerald-500" />
                  <span>Kopiert</span>
                </>
              ) : (
                <>
                  <Copy size={15} />
                  <span>Text kopieren</span>
                </>
              )}
            </button>
          </div>

          <div className="rounded-xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-950 p-3 text-xs text-ink-muted whitespace-pre-wrap break-words font-sans leading-relaxed max-h-40 sm:max-h-48 overflow-y-auto">
            {messageText}
          </div>

          {sharedMapsUrl && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-800/50 px-3 sm:px-3.5 py-2 text-xs">
              <span className="inline-flex items-center gap-1.5 text-ink-muted min-w-0">
                <MapPin size={14} className="text-accent shrink-0" />
                <span className="truncate">Einsatzort: {values.zip}</span>
              </span>
              <a
                href={sharedMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[40px] items-center font-bold text-accent hover:underline shrink-0"
              >
                Google Maps →
              </a>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-primary/10 dark:border-white/10 text-xs">
            <a
              href={business.mapsWriteReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setServiceDoneRated(true)}
              className="inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400 hover:underline"
            >
              <Star size={14} />
              <span>
                {serviceDoneRated
                  ? "Vielen Dank für Ihre Bewertung!"
                  : "Zufrieden? Auf Google bewerten"}
              </span>
            </a>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex min-h-[44px] items-center font-bold text-accent hover:underline cursor-pointer"
            >
              Weitere Anfrage stellen →
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
                1. Gerät &amp; Service wählen
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
                      onClick={() => {
                        hapticTap();
                        setRequestType(option.id);
                      }}
                      aria-pressed={active}
                      className={`inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] sm:text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                        active
                          ? "bg-accent text-white shadow-xs"
                          : "text-ink-muted hover:text-primary dark:hover:text-white"
                      }`}
                    >
                      <Icon size={13} aria-hidden="true" className="shrink-0" />
                      <span className="truncate">{option.shortLabel}</span>
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
                    onClick={() => {
                      hapticTap();
                      set("device", d.value);
                    }}
                    aria-pressed={isSelected}
                    className={`${
                      idx < 3 ? "col-span-2 sm:col-span-1" : "col-span-3 sm:col-span-1"
                    } flex min-h-[60px] sm:min-h-[64px] w-full min-w-0 flex-col items-center justify-center text-center gap-1 rounded-xl border px-1.5 py-2 text-[11px] font-bold transition-all cursor-pointer ${
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
                    <span className="w-full truncate tracking-[-0.01em]">{d.label}</span>
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
                <span>2. Was ist passiert? *</span>
                {isProblemReady && (
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                )}
              </label>
              <span className="text-[11px] text-ink-muted">Antippen reicht</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {activeType.quickHints.map((hint) => {
                const isSelected = values.problem
                  .toLowerCase()
                  .includes(hint.toLowerCase());
                return (
                  <button
                    key={hint}
                    type="button"
                    onClick={() => toggleHint(hint)}
                    aria-pressed={isSelected}
                    className={`inline-flex min-h-[38px] max-w-full items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold text-left leading-snug transition-colors cursor-pointer ${
                      isSelected
                        ? "border-emerald-500/60 bg-emerald-500/12 text-emerald-800 dark:text-emerald-300"
                        : "border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 text-ink-muted hover:border-accent/50 hover:text-primary dark:hover:text-white"
                    }`}
                  >
                    {isSelected && (
                      <Check size={12} strokeWidth={3} className="shrink-0" />
                    )}
                    <span>{hint}</span>
                  </button>
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

          {/* STEP 3: Rückrufnummer & Ort */}
          <div className="min-w-0 pt-3 border-t border-primary/8 dark:border-white/8 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-extrabold text-primary dark:text-white">
                3. Rückrufnummer &amp; Ort *
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={shareGpsLocation}
                  className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-primary/12 dark:border-white/15 bg-white dark:bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-primary dark:text-slate-200 hover:border-accent transition-colors cursor-pointer"
                >
                  <Navigation size={12} className="text-accent shrink-0" />
                  <span>{gpsStatus === "locating" ? "Suche..." : "GPS"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback(35);
                    setIsMapModalOpen(true);
                  }}
                  className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-primary/12 dark:border-white/15 bg-white dark:bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-primary dark:text-slate-200 hover:border-accent transition-colors cursor-pointer"
                >
                  <MapPin size={12} className="text-accent shrink-0" />
                  <span>Karte</span>
                </button>
              </div>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              {/* Primary Input: Phone / WhatsApp */}
              <div className="min-w-0">
                <label
                  htmlFor={id("phone")}
                  className="flex items-center justify-between gap-2 text-[11px] font-bold text-ink-muted mb-1"
                >
                  <span>Telefon / WhatsApp-Nummer *</span>
                  {isPhoneReady && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={12} />
                      <span>Gültig</span>
                    </span>
                  )}
                </label>
                <div className="relative">
                  <Phone
                    size={15}
                    className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                      errors.phone
                        ? "text-red-500"
                        : isPhoneReady
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
                    placeholder="z. B. 0170 1234567"
                    className={`w-full min-h-[48px] rounded-xl border bg-white dark:bg-slate-900 pl-10 pr-9 py-2 text-base sm:text-sm text-primary dark:text-slate-100 placeholder:text-ink-faint focus:outline-none transition-colors ${
                      errors.phone
                        ? "border-red-500 focus:border-red-500"
                        : isPhoneReady
                        ? "border-emerald-500/60 focus:border-emerald-500"
                        : "border-primary/15 dark:border-white/15 focus:border-accent"
                    }`}
                  />
                  {isPhoneReady && (
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
                  values.phone.trim().length > 0 &&
                  !isPhoneReady && (
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

            {/* Quick Area Pills */}
            <div className="flex flex-wrap gap-1.5">
              {osnabrueckServiceAreas.slice(0, 5).map((area) => {
                const active =
                  values.zip.includes(area.zip) ||
                  values.zip.toLowerCase().includes(area.city.toLowerCase());
                return (
                  <button
                    key={area.zip}
                    type="button"
                    onClick={() => {
                      hapticTap();
                      set("zip", area.value);
                    }}
                    className={`min-h-[34px] rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                      active
                        ? "border-accent bg-accent/12 text-accent"
                        : "border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 text-ink-muted hover:text-primary dark:hover:text-white"
                    }`}
                  >
                    {area.label}
                  </button>
                );
              })}
            </div>

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
              className="flex min-h-[42px] w-full items-center justify-between gap-2 rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-ink-muted hover:text-primary dark:hover:text-white transition-colors cursor-pointer"
            >
              <span className="min-w-0 text-left truncate">
                {showOptionalFields
                  ? "Optionale Angaben ausblenden"
                  : optionalSummaryParts.length > 0
                  ? `Optional: ${optionalSummaryParts.join(" · ")}`
                  : "+ Optional: Marke, Name & Straße ergänzen"}
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
                      <div className="flex items-center justify-between gap-2">
                        <label
                          htmlFor={id("brand")}
                          className="text-[11px] font-bold text-ink-muted"
                        >
                          Marke / Modell (optional)
                        </label>
                        {showPhotoGuideLink && (
                          <a
                            href="#photo-anleitung"
                            className="text-[11px] font-bold text-accent hover:underline"
                          >
                            E-Nr. finden ↓
                          </a>
                        )}
                      </div>
                      <input
                        id={id("brand")}
                        data-field="brand"
                        type="text"
                        enterKeyHint="next"
                        value={values.brand}
                        onChange={(e) => set("brand", e.target.value)}
                        placeholder="z. B. Miele, Bosch Serie 6, Siemens..."
                        className="w-full min-h-[42px] rounded-xl border border-primary/12 dark:border-white/12 bg-surface dark:bg-slate-950 px-3.5 py-2 text-base sm:text-sm text-primary dark:text-slate-100 placeholder:text-ink-faint focus:border-accent focus:outline-none"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {popularBrands.slice(0, 7).map((b) => {
                          const active = values.brand
                            .toLowerCase()
                            .includes(b.toLowerCase());
                          return (
                            <button
                              key={b}
                              type="button"
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
                              className={`min-h-[32px] rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
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
              { label: "Problem", ready: isProblemReady, target: "problem" },
              { label: "PLZ / Ort", ready: isZipReady, target: "zip" },
              { label: "Telefon", ready: isPhoneReady, target: "phone" },
            ]}
            onFocusField={(field) => focusField(field)}
          />

          {/* Primary Submit CTA */}
          <div className="pt-0.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
            <p className="text-[11px] text-ink-muted leading-snug">
              {isReadyForWhatsApp
                ? `Öffnet WhatsApp mit Ihrer Anfrage direkt an ${business.owner}.`
                : "Nur Problem antippen & Telefonnummer eingeben."}
            </p>
            <motion.button
              whileTap={prefersReducedMotion || isSubmitting ? undefined : { scale: 0.97 }}
              transition={{ type: "spring", stiffness: 520, damping: 25 }}
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex min-h-[50px] w-full sm:w-auto max-w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold text-white text-center shadow-md transition-colors disabled:opacity-60 cursor-pointer sm:whitespace-nowrap ${
                isReadyForWhatsApp
                  ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25"
                  : "bg-slate-700 hover:bg-slate-600 shadow-slate-900/15"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  <span>WhatsApp wird geöffnet...</span>
                </>
              ) : (
                <>
                  <MessageCircle size={18} className="shrink-0" />
                  <span>Jetzt per WhatsApp anfragen</span>
                  <ArrowRight size={15} className="shrink-0" />
                </>
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