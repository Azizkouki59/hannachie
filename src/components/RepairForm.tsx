"use client";
import { useEffect, useId, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Flame,
  Loader2,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  RotateCw,
  Shield,
  ShieldCheck,
  Snowflake,
  Sparkles,
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
  validate,
  type InquiryMode,
  type RepairErrors,
  type RepairValues,
  type VerifiedLocationInfo,
} from "@/lib/repairRequest";
import GoogleMapsPinModal from "@/components/GoogleMapsPinModal";
import { triggerHapticFeedback } from "@/lib/haptics";

type Status = "idle" | "loading" | "completing" | "success" | "error";

export type RequestTypeId = "check_parts" | "replacement_offer" | "warranty";

type RequestTypeOption = {
  id: RequestTypeId;
  title: string;
  mobileTitle: string;
  subtitle: string;
  tagPrefix: string;
  placeholder: string;
  quickHints: string[];
  icon: typeof Wrench;
};

const REQUEST_TYPES: RequestTypeOption[] = [
  {
    id: "check_parts",
    title: "Vor-Ort-Check & Ersatzteil-Anfrage",
    mobileTitle: "Vor-Ort-Check & Ersatzteil",
    subtitle: "Geräteproblem vor Ort prüfen oder passendes Ersatzteil in Osnabrück",
    tagPrefix: "[Vor-Ort-Check / Ersatzteil]",
    placeholder:
      "z. B. Waschmaschine pumpt nicht mehr ab / benötige Laugenpumpe oder Vor-Ort-Termin...",
    quickHints: [
      "Pumpt nicht ab / Wasser steht",
      "Heizt / kühlt nicht mehr",
      "Macht ungewöhnliche Geräusche",
      "Ersatzteil nach Typenschild (E-Nr.)",
    ],
    icon: Wrench,
  },
  {
    id: "replacement_offer",
    title: "Angebot für Ersatzgerät anfragen",
    mobileTitle: "Ersatzgerät mit Garantie",
    subtitle: "Geprüftes Ersatzgerät inklusive schriftlicher Verkäufergarantie",
    tagPrefix: "[Ersatzgerät mit Garantie]",
    placeholder:
      "z. B. Altgerät lohnt sich nicht mehr – suche geprüfte Waschmaschine inkl. schriftlicher Garantie...",
    quickHints: [
      "Altgerät lohnt sich nicht mehr",
      "Geprüftes Ersatzgerät mit Garantie gesucht",
      "Inkl. Lieferung in Osnabrück",
    ],
    icon: ShieldCheck,
  },
  {
    id: "warranty",
    title: "Garantie-Anfrage (Hannachi-Gerät)",
    mobileTitle: "Garantie-Anfrage (Hannachi)",
    subtitle: "Garantie- & Reparaturservice für ein bei Hannachi gekauftes Gerät",
    tagPrefix: "[Garantie-Anfrage]",
    placeholder:
      "z. B. Gerät wurde bei Hannachi mit schriftlicher Verkäufergarantie gekauft...",
    quickHints: [
      "Gerät bei Hannachi gekauft",
      "Schriftlicher Garantiebeleg liegt vor",
      "Bitte um Vor-Ort-Garansietermin",
    ],
    icon: Shield,
  },
];

const CORE_DEVICES = [
  { label: "Waschmaschine", value: "Waschmaschine", icon: RotateCw },
  { label: "Kühlschrank", value: "Kühlschrank / Gefriergerät", icon: Snowflake },
  { label: "Geschirrspüler", value: "Geschirrspüler", icon: Sparkles },
  { label: "Herd / Backofen", value: "Backofen / Herd", icon: Flame },
  { label: "Sonstiges", value: "Sonstiges", icon: Wrench },
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

export default function RepairForm({
  defaultDevice = "",
  defaultSymptom = "",
  defaultBrand = "",
  defaultMode = "repair",
  defaultRequestType = "check_parts",
  compact = false,
}: {
  defaultDevice?: string;
  defaultSymptom?: string;
  defaultBrand?: string;
  defaultMode?: InquiryMode;
  defaultRequestType?: RequestTypeId;
  compact?: boolean;
}) {
  const uid = useId();
  const initial = resolveInitialDevice(defaultDevice);
  const initialDraftRef = useRef<ReturnType<typeof loadRepairDraft> | undefined>(undefined);
  if (initialDraftRef.current === undefined) {
    initialDraftRef.current = loadRepairDraft();
  }
  const restoredDraft = initialDraftRef.current;

  const [requestType, setRequestType] = useState<RequestTypeId>(defaultRequestType);
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

  const [showOptionalMobileFields, setShowOptionalMobileFields] = useState<boolean>(
    () => Boolean(restoredDraft?.values.streetAddress || restoredDraft?.values.name)
  );
  const [errors, setErrors] = useState<RepairErrors>({});
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
      setValues((prev) => ({ ...prev, problem: defaultSymptom }));
      setStatus("idle");
    }
  }, [defaultSymptom]);

  useEffect(() => {
    if (prevDefaultsRef.current.defaultBrand === defaultBrand) return;
    prevDefaultsRef.current.defaultBrand = defaultBrand;
    if (defaultBrand) {
      setValues((prev) => ({ ...prev, brand: defaultBrand }));
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

  const set = <K extends keyof RepairValues>(k: K, val: RepairValues[K]) => {
    setValues((prev) => ({ ...prev, [k]: val }));
    if (errors[k]) {
      setErrors((prev) => ({ ...prev, [k]: undefined }));
    }
  };

  function appendHint(hint: string) {
    triggerHapticFeedback(30);
    const cur = values.problem.trim();
    if (cur.includes(hint)) return;
    set("problem", cur ? `${cur}; ${hint}` : hint);
  }

  function handleConfirmMapPin(verified: VerifiedLocationInfo) {
    setVerifiedLocation(verified);
    setGpsStatus("shared");
    if (verified.streetAddress) {
      setShowOptionalMobileFields(true);
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

  function shareGpsLocation() {
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
            if (info.streetAddress) {
              setShowOptionalMobileFields(true);
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
        },
        applyFallback,
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
      );
    } else {
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

    const cleanDevice =
      values.device === "Sonstiges"
        ? values.customDevice?.trim() || "Sonstiges Haushaltsgerät"
        : values.device || "Waschmaschine";

    const cleanProblemBase = values.problem.trim();
    const formattedProblem = cleanProblemBase.startsWith("[")
      ? cleanProblemBase
      : `${activeType.tagPrefix} ${cleanProblemBase}`;

    const submissionPayload: RepairValues = {
      ...values,
      inquiryMode: "repair",
      visitType: "home_visit",
      device: cleanDevice,
      customDevice: "",
      brand: values.brand.trim(),
      model: "",
      problem: cleanProblemBase.length >= 4 ? formattedProblem : cleanProblemBase,
      zip: values.zip.trim(),
      streetAddress: values.streetAddress?.trim() || "",
      name: values.name.trim() || "Interessent (Osnabrück)",
      phone: values.phone.trim(),
      preferredChannel: "whatsapp",
    };

    const validationErrors = validate(submissionPayload);
    if (cleanProblemBase.length < 4) {
      validationErrors.problem = "Bitte beschreiben Sie kurz Ihr Anliegen (mind. 4 Zeichen).";
    }
    if (!submissionPayload.brand) {
      validationErrors.brand = "Bitte geben Sie Marke / Modell an (z. B. Miele, Bosch).";
    }
    if (submissionPayload.zip.length < 3) {
      validationErrors.zip = "Bitte geben Sie PLZ / Ort in Osnabrück & Umgebung an.";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstKey = Object.keys(validationErrors)[0];
      if (firstKey) {
        formRef.current?.querySelector<HTMLElement>(`[data-field="${firstKey}"]`)?.focus();
      }
      return;
    }

    setErrors({});
    setSubmitErrorMsg(null);

    // Synchronously build the WhatsApp payload & immediately open WhatsApp
    // during the trusted user submit gesture so mobile & desktop browsers never block it.
    const immediateHandoff = prepareImmediateWhatsAppHandoff(submissionPayload);
    if (!immediateHandoff.whatsappUrl) {
      setSubmitErrorMsg(
        "Bitte überprüfen Sie Ihre Pflichtangaben (Gerät, Marke, Beschreibung, PLZ/Ort & Telefon)."
      );
      setStatus("error");
      return;
    }

    triggerHapticFeedback(55);
    launchWhatsAppAutomatically(immediateHandoff.whatsappUrl);

    setReferenceId(immediateHandoff.referenceId);
    setWhatsappUrl(immediateHandoff.whatsappUrl);
    setSharedMapsUrl(immediateHandoff.mapsLocationUrl);
    setMessageText(immediateHandoff.messageText);
    setHasSentWhatsApp(true);
    clearRepairDraft();
    setConfettiBurstCount((c) => c + 1);
    setStatus("success");

    // Persist the inquiry ticket to the backend & localStorage in the background
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
    setStatus("idle");
    setReferenceId("");
    setWhatsappUrl("");
    setSharedMapsUrl("");
    setMessageText("");
    setHasSentWhatsApp(false);
    setServiceDoneRated(false);
    clearRepairDraft();
  }

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
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  WhatsApp automatisch geöffnet · #{referenceId}
                </span>
              </div>
              <h3 className="mt-0.5 text-base sm:text-xl font-extrabold text-primary dark:text-white">
                Ihre Nachricht ist in WhatsApp eingetragen
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-ink-muted">
                WhatsApp wurde automatisch mit Ihrer fertigen Anfrage an Herrn Hannachi geöffnet – tippen Sie im Chat einfach auf <strong>Senden</strong>. Falls sich WhatsApp nicht geöffnet hat, tippen Sie hier:
              </p>
            </div>
          </div>

          {/* Primary WhatsApp Re-Open & Copy Controls */}
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
                className="flex-1 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] px-4 sm:px-5 py-3 text-xs sm:text-sm font-extrabold text-white shadow-md transition-all"
              >
                <MessageCircle size={18} className="shrink-0" />
                <span>WhatsApp jetzt öffnen / Nachricht senden</span>
                <ArrowRight size={15} className="shrink-0" />
              </a>
            )}
            <button
              type="button"
              onClick={copyMessage}
              className="inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border border-primary/15 dark:border-white/15 bg-surface dark:bg-slate-800 px-4 py-3 text-xs font-bold text-primary dark:text-slate-100 hover:border-accent active:scale-[0.98] transition-all cursor-pointer"
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

          {/* Message Preview */}
          <div className="rounded-xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-950 p-3 text-xs text-ink-muted whitespace-pre-wrap font-mono leading-relaxed max-h-40 sm:max-h-48 overflow-y-auto">
            {messageText}
          </div>

          {sharedMapsUrl && (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-800/50 px-3.5 py-2.5 text-xs">
              <span className="inline-flex items-center gap-1.5 text-ink-muted">
                <MapPin size={14} className="text-accent shrink-0" />
                <span>Einsatz- / Wohnort hinterlegt ({values.zip})</span>
              </span>
              <a
                href={sharedMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center font-bold text-accent hover:underline shrink-0"
              >
                Google Maps →
              </a>
            </div>
          )}

          {/* Subtle Google Review Reminder + Reset */}
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
                {serviceDoneRated ? "Vielen Dank für Ihre Bewertung!" : "Zufrieden? Auf Google bewerten"}
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
          compact ? "p-3 sm:p-5" : "p-3.5 sm:p-6 lg:p-7"
        }`}
      >
        {/* Anti-spam honeypot */}
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
          className="min-w-0 w-full max-w-full space-y-3.5 sm:space-y-5"
        >
          {/* 1. Request Type Selector (Compact Single-Line Rows on Phone, 3-Col Cards on Tablet/Desktop) */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5 sm:mb-2">
              <label className="text-xs sm:text-sm font-extrabold text-primary dark:text-white">
                1. Art Ihrer Anfrage *
              </label>
              <span className="text-[11px] font-medium text-ink-muted">
                Vor-Ort in Osnabrück
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2.5">
              {REQUEST_TYPES.map((option) => {
                const Icon = option.icon;
                const isSelected = requestType === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      triggerHapticFeedback(35);
                      setRequestType(option.id);
                    }}
                    aria-pressed={isSelected}
                    className={`flex min-h-[44px] sm:min-h-0 flex-row sm:flex-col items-center sm:items-start justify-between gap-2.5 sm:gap-0 rounded-xl border px-3 py-2 sm:p-3.5 text-left transition-all active:scale-[0.99] cursor-pointer ${
                      isSelected
                        ? "border-accent bg-accent/10 dark:bg-accent/15 ring-1 ring-accent shadow-xs"
                        : "border-primary/12 dark:border-white/10 bg-white dark:bg-slate-900 hover:border-accent/50"
                    }`}
                  >
                    <div className="flex items-center sm:justify-between gap-2.5 sm:gap-2 sm:w-full sm:mb-1.5 min-w-0 flex-1 sm:flex-initial">
                      <span
                        className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg ${
                          isSelected
                            ? "bg-accent text-white"
                            : "bg-primary/5 dark:bg-white/5 text-accent"
                        }`}
                      >
                        <Icon size={15} aria-hidden="true" />
                      </span>
                      <span className="text-xs font-extrabold text-primary dark:text-white truncate sm:hidden">
                        {option.mobileTitle}
                      </span>
                      {isSelected && (
                        <Check
                          size={15}
                          className="hidden sm:block text-accent shrink-0"
                          strokeWidth={2.75}
                        />
                      )}
                    </div>

                    {/* Desktop/Tablet Stacked Title & Subtitle */}
                    <p className="hidden sm:block text-[13px] font-extrabold text-primary dark:text-white leading-snug">
                      {option.title}
                    </p>
                    <p className="hidden sm:block mt-1 text-[11px] text-ink-muted leading-snug">
                      {option.subtitle}
                    </p>

                    {/* Mobile Right Radio/Check Indicator */}
                    <span
                      className={`flex sm:hidden h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        isSelected
                          ? "border-accent bg-accent text-white"
                          : "border-primary/20 dark:border-white/20"
                      }`}
                      aria-hidden="true"
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Appliance Type Selector (Single-Line Horizontal Swipe Rail on Phone, 5-Col Grid on Desktop) */}
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1.5 sm:mb-2">
              <label
                htmlFor={id("device")}
                className="text-xs sm:text-sm font-extrabold text-primary dark:text-white"
              >
                2. Gerätetyp *
              </label>
              <span className="text-[11px] text-ink-muted sm:hidden">
                Wischen / Antippen →
              </span>
            </div>
            <div
              data-field="device"
              tabIndex={-1}
              className="flex sm:grid overflow-x-auto sm:overflow-visible no-scrollbar gap-1.5 pb-0.5 sm:pb-0 sm:grid-cols-5 sm:gap-2"
            >
              {CORE_DEVICES.map((d) => {
                const Icon = d.icon;
                const isSelected = values.device === d.value;
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => {
                      triggerHapticFeedback(30);
                      set("device", d.value);
                    }}
                    aria-pressed={isSelected}
                    className={`flex min-h-[44px] shrink-0 sm:shrink items-center justify-center sm:justify-start gap-2 rounded-xl border px-3.5 sm:px-3 py-2 text-xs font-bold transition-all active:scale-[0.98] whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? "border-accent bg-accent text-white shadow-xs"
                        : "border-primary/12 dark:border-white/10 bg-white dark:bg-slate-900 text-primary dark:text-slate-200 hover:border-accent/50"
                    }`}
                  >
                    <Icon size={14} className="shrink-0" aria-hidden="true" />
                    <span className="truncate">{d.label}</span>
                  </button>
                );
              })}
            </div>

            <AnimatePresence>
              {values.device === "Sonstiges" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2">
                    <input
                      type="text"
                      value={values.customDevice || ""}
                      onChange={(e) => set("customDevice", e.target.value)}
                      placeholder="Welches Gerät? (optional, z. B. Wäschetrockner, Mikrowelle)"
                      className="w-full min-h-[44px] rounded-xl border border-primary/15 dark:border-white/15 bg-white dark:bg-slate-900 px-3.5 py-2 text-base sm:text-sm text-primary dark:text-slate-100 placeholder:text-ink-faint focus:border-accent focus:outline-none"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 3. Brand / Model */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <label
                htmlFor={id("brand")}
                className="text-xs sm:text-sm font-extrabold text-primary dark:text-white"
              >
                3. Marke / Modell *
              </label>
              <span className="text-[11px] text-ink-muted">
                E-Nr. optional
              </span>
            </div>
            <input
              id={id("brand")}
              data-field="brand"
              type="text"
              value={values.brand}
              onChange={(e) => set("brand", e.target.value)}
              placeholder="z. B. Miele W1, Bosch Serie 6, Siemens..."
              className={`w-full min-h-[44px] sm:min-h-[46px] rounded-xl border bg-white dark:bg-slate-900 px-3.5 py-2 text-base sm:text-sm text-primary dark:text-slate-100 placeholder:text-ink-faint focus:outline-none transition-colors ${
                errors.brand
                  ? "border-red-500 focus:border-red-500"
                  : "border-primary/15 dark:border-white/15 focus:border-accent"
              }`}
            />
            {errors.brand && (
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-500">
                <AlertCircle size={13} />
                <span>{errors.brand}</span>
              </p>
            )}
            {/* Horizontal Swipeable Brand Chip Rail on Mobile */}
            <div className="mt-1.5 flex overflow-x-auto no-scrollbar gap-1.5 pb-0.5 sm:flex-wrap sm:overflow-visible sm:pb-0">
              {popularBrands.slice(0, 8).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback(30);
                    set(
                      "brand",
                      values.brand.trim() && !values.brand.includes(b)
                        ? `${b} ${values.brand}`
                        : b
                    );
                  }}
                  className={`min-h-[44px] sm:min-h-[34px] shrink-0 rounded-xl sm:rounded-lg border px-3 sm:px-2.5 py-1.5 sm:py-1 text-xs sm:text-[11px] font-bold transition-all active:scale-95 cursor-pointer ${
                    values.brand.toLowerCase().includes(b.toLowerCase())
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 text-ink-muted hover:text-primary dark:hover:text-white"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Short Description */}
          <div className="min-w-0">
            <label
              htmlFor={id("problem")}
              className="block text-xs sm:text-sm font-extrabold text-primary dark:text-white mb-1"
            >
              4. Kurzbeschreibung (Problem / Ersatzteil) *
            </label>
            <textarea
              id={id("problem")}
              data-field="problem"
              rows={2}
              value={values.problem}
              onChange={(e) => set("problem", e.target.value)}
              placeholder={activeType.placeholder}
              className={`w-full min-h-[68px] sm:min-h-[80px] rounded-xl border bg-white dark:bg-slate-900 px-3.5 py-2 text-base sm:text-sm text-primary dark:text-slate-100 placeholder:text-ink-faint focus:outline-none transition-colors resize-y ${
                errors.problem
                  ? "border-red-500 focus:border-red-500"
                  : "border-primary/15 dark:border-white/15 focus:border-accent"
              }`}
            />
            {errors.problem && (
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-500">
                <AlertCircle size={13} />
                <span>{errors.problem}</span>
              </p>
            )}
            {/* Horizontal Swipeable Symptom / Quick-Hint Chip Rail on Mobile */}
            <div className="mt-1.5 flex overflow-x-auto no-scrollbar gap-1.5 pb-0.5 sm:flex-wrap sm:overflow-visible sm:pb-0">
              {activeType.quickHints.map((hint) => (
                <button
                  key={hint}
                  type="button"
                  onClick={() => appendHint(hint)}
                  className="min-h-[44px] sm:min-h-[34px] shrink-0 rounded-xl sm:rounded-lg border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 px-3 sm:px-2.5 py-1.5 sm:py-1 text-xs sm:text-[11px] font-medium text-ink-muted hover:border-accent/45 hover:text-primary dark:hover:text-white active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                >
                  + {hint}
                </button>
              ))}
            </div>
          </div>

          {/* 5 & 6. Location in Osnabrück + Phone / WhatsApp (Compact on Mobile) */}
          <div className="min-w-0 rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 p-3 sm:p-4 space-y-2.5 sm:space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-extrabold text-primary dark:text-white">
                5. PLZ / Ort &amp; WhatsApp-Kontakt *
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={shareGpsLocation}
                  className="inline-flex min-h-[44px] sm:min-h-[34px] items-center gap-1.5 rounded-xl sm:rounded-lg border border-primary/12 dark:border-white/15 bg-surface dark:bg-slate-800 px-3 sm:px-2.5 py-1.5 sm:py-1 text-xs sm:text-[11px] font-bold text-primary dark:text-slate-200 hover:border-accent active:scale-95 transition-all cursor-pointer"
                >
                  <Navigation size={13} className="text-accent" />
                  <span>{gpsStatus === "locating" ? "Suche..." : "GPS"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback(35);
                    setIsMapModalOpen(true);
                  }}
                  className="inline-flex min-h-[44px] sm:min-h-[34px] items-center gap-1.5 rounded-xl sm:rounded-lg border border-primary/12 dark:border-white/15 bg-surface dark:bg-slate-800 px-3 sm:px-2.5 py-1.5 sm:py-1 text-xs sm:text-[11px] font-bold text-primary dark:text-slate-200 hover:border-accent active:scale-95 transition-all cursor-pointer"
                >
                  <MapPin size={13} className="text-accent" />
                  <span>Karten-Pin</span>
                </button>
              </div>
            </div>

            {/* Required Pair: PLZ/Ort + Phone/WhatsApp */}
            <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor={id("zip")}
                  className="block text-[11px] font-bold text-ink-muted mb-1"
                >
                  PLZ / Ort in Osnabrück *
                </label>
                <input
                  id={id("zip")}
                  data-field="zip"
                  type="text"
                  value={values.zip}
                  onChange={(e) => set("zip", e.target.value)}
                  placeholder="z. B. 49082 Osnabrück"
                  className={`w-full min-h-[44px] sm:min-h-[46px] rounded-xl border bg-surface dark:bg-slate-950 px-3.5 py-2 text-base sm:text-sm text-primary dark:text-slate-100 placeholder:text-ink-faint focus:outline-none ${
                    errors.zip
                      ? "border-red-500 focus:border-red-500"
                      : "border-primary/12 dark:border-white/12 focus:border-accent"
                  }`}
                />
                {errors.zip && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-500">
                    <AlertCircle size={13} />
                    <span>{errors.zip}</span>
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor={id("phone")}
                  className="block text-[11px] font-bold text-ink-muted mb-1"
                >
                  Telefon / WhatsApp-Nummer *
                </label>
                <div className="relative">
                  <Phone
                    size={15}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
                  />
                  <input
                    id={id("phone")}
                    data-field="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={values.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="z. B. 0170 1234567"
                    className={`w-full min-h-[44px] sm:min-h-[46px] rounded-xl border bg-surface dark:bg-slate-950 pl-10 pr-3.5 py-2 text-base sm:text-sm text-primary dark:text-slate-100 placeholder:text-ink-faint focus:outline-none ${
                      errors.phone
                        ? "border-red-500 focus:border-red-500"
                        : "border-primary/12 dark:border-white/12 focus:border-accent"
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-500">
                    <AlertCircle size={13} />
                    <span>{errors.phone}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Horizontal Swipeable Area Chips */}
            <div className="flex overflow-x-auto no-scrollbar gap-1.5 pb-0.5 sm:flex-wrap sm:overflow-visible sm:pb-0">
              {osnabrueckServiceAreas.slice(0, 6).map((area) => (
                <button
                  key={area.zip}
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback(30);
                    set("zip", area.value);
                  }}
                  className={`min-h-[44px] sm:min-h-[32px] shrink-0 rounded-xl sm:rounded-lg border px-3 sm:px-2.5 py-1.5 sm:py-1 text-xs sm:text-[11px] font-semibold transition-all active:scale-95 cursor-pointer whitespace-nowrap ${
                    values.zip.includes(area.zip) || values.zip.toLowerCase().includes(area.city.toLowerCase())
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-950 text-ink-muted hover:text-primary dark:hover:text-white"
                  }`}
                >
                  {area.label}
                </button>
              ))}
            </div>

            {verifiedLocation && (
              <p className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <Check size={13} />
                <span>
                  Standort markiert: {verifiedLocation.streetAddress ? `${verifiedLocation.streetAddress}, ` : ""}
                  {verifiedLocation.zipAndCity}
                </span>
              </p>
            )}

            {/* Mobile Toggle for Optional Fields (Street & Name) so Phone Form Stays Compact */}
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback(30);
                setShowOptionalMobileFields((prev) => !prev);
              }}
              aria-expanded={showOptionalMobileFields}
              className="flex sm:hidden min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-950 px-3 py-2 text-xs font-semibold text-ink-muted hover:text-primary dark:hover:text-white cursor-pointer"
            >
              <span>
                {showOptionalMobileFields
                  ? "Optionale Angaben (Straße & Name) ausblenden"
                  : "+ Optional: Straße & Namen ergänzen"}
              </span>
              <ChevronDown
                size={15}
                className={`shrink-0 text-accent transition-transform duration-200 ${
                  showOptionalMobileFields ? "rotate-180" : ""
                }`}
              />
            </button>

            <div
              className={`${
                showOptionalMobileFields ? "grid" : "hidden"
              } sm:grid gap-2.5 sm:gap-3 sm:grid-cols-2 pt-1 sm:pt-1.5 border-t border-primary/8 dark:border-white/8`}
            >
              <div>
                <label
                  htmlFor={id("streetAddress")}
                  className="block text-[11px] font-bold text-ink-muted mb-1"
                >
                  Straße &amp; Hausnummer <span className="font-normal">(optional)</span>
                </label>
                <input
                  id={id("streetAddress")}
                  data-field="streetAddress"
                  type="text"
                  value={values.streetAddress || ""}
                  onChange={(e) => set("streetAddress", e.target.value)}
                  placeholder="z. B. Musterstraße 12"
                  className="w-full min-h-[44px] sm:min-h-[46px] rounded-xl border border-primary/12 dark:border-white/12 bg-surface dark:bg-slate-950 px-3.5 py-2 text-base sm:text-sm text-primary dark:text-slate-100 placeholder:text-ink-faint focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor={id("name")}
                  className="block text-[11px] font-bold text-ink-muted mb-1"
                >
                  Ihr Name <span className="font-normal">(optional)</span>
                </label>
                <input
                  id={id("name")}
                  data-field="name"
                  type="text"
                  autoComplete="name"
                  value={values.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="z. B. Max Mustermann"
                  className="w-full min-h-[44px] sm:min-h-[46px] rounded-xl border border-primary/12 dark:border-white/12 bg-surface dark:bg-slate-950 px-3.5 py-2 text-base sm:text-sm text-primary dark:text-slate-100 placeholder:text-ink-faint focus:border-accent focus:outline-none"
                />
              </div>
            </div>
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

          {/* Submit CTA — Automatically Launches WhatsApp Upon Completion */}
          <div className="pt-0.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
            <p className="text-[11px] text-ink-muted leading-snug">
              Öffnet nach dem Absenden automatisch WhatsApp mit Ihrer fertigen Anfrage an {business.owner}.
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] px-5 sm:px-6 py-3 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-emerald-600/25 transition-all disabled:opacity-60 cursor-pointer whitespace-nowrap"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  <span>WhatsApp wird geöffnet...</span>
                </>
              ) : (
                <>
                  <MessageCircle size={17} className="shrink-0" />
                  <span>Jetzt direkt per WhatsApp senden</span>
                  <ArrowRight size={15} className="shrink-0" />
                </>
              )}
            </button>
          </div>
        </fieldset>
      </form>

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