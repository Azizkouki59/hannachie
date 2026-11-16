"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  APIProvider,
  APILoadingStatus,
  AdvancedMarker,
  Map as GoogleMap,
  Pin,
  useApiLoadingStatus,
  type MapCameraChangedEvent,
  type MapMouseEvent,
} from "@vis.gl/react-google-maps";
import {
  Check,
  Loader2,
  MapPin,
  Minus,
  Navigation,
  Plus,
  X,
} from "lucide-react";
import { triggerHapticFeedback } from "@/lib/haptics";
import {
  formatCoordinatesDisplay,
  osnabrueckServiceAreas,
  reverseGeocodePosition,
  type VerifiedLocationInfo,
} from "@/lib/repairRequest";

export interface GoogleMapsPinModalProps {
  isOpen: boolean;
  initialLat?: number;
  initialLng?: number;
  initialZip?: string;
  initialStreet?: string;
  onClose: () => void;
  onConfirm: (location: VerifiedLocationInfo) => void;
}

type LatLng = {
  lat: number;
  lng: number;
};

function resolveInitialPosition(
  initialLat?: number,
  initialLng?: number,
  initialZip?: string
): { pos: LatLng; defaultZip: string } {
  const cleanZip = (initialZip || "").trim().toLowerCase();
  const matchedArea =
    osnabrueckServiceAreas.find(
      (a) =>
        cleanZip.includes(a.zip) ||
        cleanZip.includes(a.city.toLowerCase()) ||
        cleanZip === a.value.toLowerCase()
    ) || osnabrueckServiceAreas[0];

  if (
    typeof initialLat === "number" &&
    Number.isFinite(initialLat) &&
    typeof initialLng === "number" &&
    Number.isFinite(initialLng)
  ) {
    return {
      pos: { lat: initialLat, lng: initialLng },
      defaultZip: initialZip?.trim() || matchedArea.value,
    };
  }

  return {
    pos: { lat: matchedArea.lat, lng: matchedArea.lng },
    defaultZip: initialZip?.trim() || matchedArea.value,
  };
}

/**
 * Interactive visual map fallback with live Google Map background + clickable/draggable Red Pin
 * with mobile touch zoom buttons and haptic confirmation.
 */
function InteractiveFallbackMapSurface({
  center,
  pinPos,
  zoom,
  onZoomChange,
  onPinMove,
}: {
  center: LatLng;
  pinPos: LatLng;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onPinMove: (lat: number, lng: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  // Dynamic span based on zoom level: zoom 15 is baseline (~0.016 lat, ~0.026 lng)
  const zoomFactor = Math.pow(2, 15 - zoom);
  const latSpan = 0.016 * zoomFactor;
  const lngSpan = 0.026 * zoomFactor;

  const pinPercentX = Math.max(
    8,
    Math.min(92, 50 + ((pinPos.lng - center.lng) / lngSpan) * 100)
  );
  const pinPercentY = Math.max(
    10,
    Math.min(90, 50 - ((pinPos.lat - center.lat) / latSpan) * 100)
  );

  const updateFromClientPoint = (clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const relX = Math.max(0.05, Math.min(0.95, (clientX - rect.left) / rect.width));
    const relY = Math.max(0.05, Math.min(0.95, (clientY - rect.top) / rect.height));
    const nextLng = center.lng + (relX - 0.5) * lngSpan;
    const nextLat = center.lat + (0.5 - relY) * latSpan;
    onPinMove(nextLat, nextLng);
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    triggerHapticFeedback(40);
    updateFromClientPoint(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    updateFromClientPoint(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore release errors
    }
  };

  const embedUrl = `https://maps.google.com/maps?q=${center.lat},${center.lng}&z=${zoom}&hl=de&output=embed`;

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      role="application"
      aria-label="Interaktive Karte – tippen oder ziehen Sie den roten Pin"
      className="relative h-[230px] min-[380px]:h-[270px] sm:h-[340px] w-full overflow-hidden rounded-2xl border border-primary/15 dark:border-white/15 bg-slate-100 dark:bg-slate-800 select-none cursor-crosshair touch-none"
    >
      <iframe
        title="Google Maps Kartenansicht"
        src={embedUrl}
        className="pointer-events-none h-full w-full border-0"
        loading="eager"
        referrerPolicy="no-referrer-when-downgrade"
      />

      {/* Floating Touch Instructions Badge */}
      <div className="pointer-events-none absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-xl bg-slate-900/80 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-md backdrop-blur-xs">
        <MapPin size={12} className="text-red-500 shrink-0" />
        <span>Tippen zum Platzieren</span>
      </div>

      {/* Floating Touch Zoom Controls (+ / -) for mobile thumbs */}
      <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1.5 shadow-md">
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            triggerHapticFeedback(25);
            onZoomChange(Math.min(18, zoom + 1));
          }}
          aria-label="Karte heranzoomen"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 dark:bg-slate-900/95 text-primary dark:text-slate-100 border border-primary/15 dark:border-white/15 hover:border-accent active:scale-95 transition-all shadow-xs cursor-pointer"
        >
          <Plus size={16} />
        </button>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            triggerHapticFeedback(25);
            onZoomChange(Math.max(12, zoom - 1));
          }}
          aria-label="Karte herauszoomen"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 dark:bg-slate-900/95 text-primary dark:text-slate-100 border border-primary/15 dark:border-white/15 hover:border-accent active:scale-95 transition-all shadow-xs cursor-pointer"
        >
          <Minus size={16} />
        </button>
      </div>

      {/* Interactive Draggable Red Pin Overlay */}
      <div
        style={{
          left: `${pinPercentX}%`,
          top: `${pinPercentY}%`,
        }}
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-full transition-transform duration-75"
      >
        <div className="relative flex flex-col items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white shadow-lg ring-4 ring-white dark:ring-slate-900">
            <MapPin size={22} className="fill-red-600 text-white" />
          </div>
          <div className="h-2.5 w-2.5 -mt-1 rotate-45 bg-red-600" />
          <div className="mt-0.5 h-1.5 w-4 rounded-full bg-black/35 blur-[1px]" />
        </div>
      </div>
    </div>
  );
}

function InteractiveGoogleMapCanvas({
  camera,
  pinPos,
  onCameraChange,
  onPinMove,
}: {
  camera: { center: LatLng; zoom: number };
  pinPos: LatLng;
  onCameraChange: (next: { center: LatLng; zoom: number }) => void;
  onPinMove: (lat: number, lng: number) => void;
}) {
  const loadingStatus = useApiLoadingStatus();

  if (
    loadingStatus === APILoadingStatus.AUTH_FAILURE ||
    loadingStatus === APILoadingStatus.FAILED
  ) {
    return (
      <InteractiveFallbackMapSurface
        center={camera.center}
        pinPos={pinPos}
        zoom={camera.zoom}
        onZoomChange={(newZoom) =>
          onCameraChange({ center: camera.center, zoom: newZoom })
        }
        onPinMove={onPinMove}
      />
    );
  }

  return (
    <div className="relative h-[230px] min-[380px]:h-[270px] sm:h-[340px] w-full overflow-hidden rounded-2xl border border-primary/15 dark:border-white/15 bg-slate-100 dark:bg-slate-800">
      {loadingStatus === APILoadingStatus.LOADING && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-slate-100/70 dark:bg-slate-900/70 backdrop-blur-[1px]">
          <div className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-primary dark:text-slate-100 shadow-md border border-primary/10 dark:border-white/10">
            <Loader2 size={15} className="animate-spin text-accent" />
            <span>Karte wird geladen…</span>
          </div>
        </div>
      )}

      {/* Floating Touch Instructions Badge */}
      <div className="pointer-events-none absolute top-3 left-3 z-20 inline-flex items-center gap-1.5 rounded-xl bg-slate-900/80 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-md backdrop-blur-xs">
        <MapPin size={12} className="text-red-500 shrink-0" />
        <span>Tippen oder Pin ziehen</span>
      </div>

      {/* Floating Touch Zoom Controls (+ / -) for mobile thumbs */}
      <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1.5 shadow-md">
        <button
          type="button"
          onClick={() => {
            triggerHapticFeedback(25);
            onCameraChange({
              ...camera,
              zoom: Math.min(camera.zoom + 1, 19),
            });
          }}
          aria-label="Karte heranzoomen"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 dark:bg-slate-900/95 text-primary dark:text-slate-100 border border-primary/15 dark:border-white/15 hover:border-accent active:scale-95 transition-all shadow-xs cursor-pointer"
        >
          <Plus size={16} />
        </button>
        <button
          type="button"
          onClick={() => {
            triggerHapticFeedback(25);
            onCameraChange({
              ...camera,
              zoom: Math.max(camera.zoom - 1, 11),
            });
          }}
          aria-label="Karte herauszoomen"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 dark:bg-slate-900/95 text-primary dark:text-slate-100 border border-primary/15 dark:border-white/15 hover:border-accent active:scale-95 transition-all shadow-xs cursor-pointer"
        >
          <Minus size={16} />
        </button>
      </div>

      <GoogleMap
        mapId="DEMO_MAP_ID"
        internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
        center={camera.center}
        zoom={camera.zoom}
        gestureHandling="greedy"
        streetViewControl={false}
        mapTypeControl={false}
        fullscreenControl={false}
        zoomControl={false}
        onCameraChanged={(ev: MapCameraChangedEvent) => {
          onCameraChange({
            center: ev.detail.center,
            zoom: ev.detail.zoom,
          });
        }}
        onClick={(ev: MapMouseEvent) => {
          if (ev.detail.latLng) {
            triggerHapticFeedback(40);
            onPinMove(ev.detail.latLng.lat, ev.detail.latLng.lng);
          }
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <AdvancedMarker
          position={pinPos}
          draggable
          title="Gewählter Einsatzort (Roter Pin)"
          onDragEnd={(ev) => {
            const lat = ev.latLng?.lat();
            const lng = ev.latLng?.lng();
            if (typeof lat === "number" && typeof lng === "number") {
              triggerHapticFeedback(40);
              onPinMove(lat, lng);
            }
          }}
        >
          <Pin
            background="#DC2626"
            borderColor="#7F1D1D"
            glyphColor="#FFFFFF"
            scale={1.35}
          />
        </AdvancedMarker>
      </GoogleMap>
    </div>
  );
}

export default function GoogleMapsPinModal({
  isOpen,
  initialLat,
  initialLng,
  initialZip,
  initialStreet,
  onClose,
  onConfirm,
}: GoogleMapsPinModalProps) {
  const [mounted, setMounted] = useState(false);
  const initialData = resolveInitialPosition(initialLat, initialLng, initialZip);
  const [camera, setCamera] = useState<{ center: LatLng; zoom: number }>({
    center: initialData.pos,
    zoom: 14,
  });
  const [pinPos, setPinPos] = useState<LatLng>(initialData.pos);
  const [resolvedStreet, setResolvedStreet] = useState(initialStreet || "");
  const [resolvedZip, setResolvedZip] = useState(initialData.defaultZip);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [gpsLocating, setGpsLocating] = useState(false);
  const lookupSeqRef = useRef(0);

  const mapsApiKey = (
    (typeof import.meta !== "undefined" &&
      import.meta.env?.VITE_GOOGLE_MAPS_API_KEY) ||
    ""
  ).trim();
  const hasUsableMapsKey = Boolean(
    mapsApiKey && !mapsApiKey.startsWith("MY_GOOGLE_MAPS")
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const resolveCoordinatesToAddress = useCallback(
    async (lat: number, lng: number, accuracy = 10) => {
      const seq = ++lookupSeqRef.current;
      setIsResolvingAddress(true);
      try {
        const info = await reverseGeocodePosition(lat, lng, accuracy);
        if (lookupSeqRef.current !== seq) return;
        setResolvedStreet(info.streetAddress);
        setResolvedZip(info.zipAndCity);
      } finally {
        if (lookupSeqRef.current === seq) {
          setIsResolvingAddress(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!isOpen) return;
    const init = resolveInitialPosition(initialLat, initialLng, initialZip);
    const hasCoords =
      typeof initialLat === "number" &&
      Number.isFinite(initialLat) &&
      typeof initialLng === "number" &&
      Number.isFinite(initialLng);

    setCamera({ center: init.pos, zoom: hasCoords ? 15 : 13 });
    setPinPos(init.pos);
    setResolvedStreet(initialStreet?.trim() || "");
    setResolvedZip(init.defaultZip);
    setGpsLocating(false);

    if (!initialStreet?.trim()) {
      void resolveCoordinatesToAddress(init.pos.lat, init.pos.lng, 12);
    }
  }, [
    isOpen,
    initialLat,
    initialLng,
    initialZip,
    initialStreet,
    resolveCoordinatesToAddress,
  ]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [isOpen, onClose]);

  const handlePinMove = useCallback(
    (lat: number, lng: number) => {
      const next = {
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
      };
      setPinPos(next);
      void resolveCoordinatesToAddress(next.lat, next.lng, 10);
    },
    [resolveCoordinatesToAddress]
  );

  const handleLocateMe = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }

    setGpsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        };
        setPinPos(next);
        setCamera({ center: next, zoom: 16 });
        setGpsLocating(false);
        triggerHapticFeedback(50);
        void resolveCoordinatesToAddress(next.lat, next.lng, pos.coords.accuracy);
      },
      () => {
        setGpsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 6500, maximumAge: 30000 }
    );
  };

  const handleConfirmPin = () => {
    const cleanLat = Number(pinPos.lat.toFixed(6));
    const cleanLng = Number(pinPos.lng.toFixed(6));
    const verified: VerifiedLocationInfo = {
      lat: cleanLat,
      lng: cleanLng,
      accuracy: 10,
      formattedCoords: formatCoordinatesDisplay(cleanLat, cleanLng),
      streetAddress: resolvedStreet.trim(),
      zipAndCity: resolvedZip.trim() || "49082 Osnabrück",
      mapsUrl: `https://www.google.com/maps?q=${cleanLat},${cleanLng}`,
      source: "map-pin",
    };
    onConfirm(verified);
  };

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center sm:p-4"
          data-testid="google-maps-pin-modal"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Dialog Card */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Standort mit rotem Pin auf Google Maps wählen"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl border border-primary/15 dark:border-white/15 bg-white dark:bg-slate-900 shadow-2xl"
          >
            {/* Clean Compact Header */}
            <div className="flex items-center justify-between gap-3 border-b border-primary/10 dark:border-white/10 bg-primary-dark px-4 sm:px-5 py-3.5 text-white">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-xs">
                  <MapPin size={17} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold leading-tight truncate">
                    Standort auf Karte wählen
                  </h3>
                  <p className="text-[11px] text-white/70 truncate">
                    Karte antippen oder roten Pin ziehen &amp; mit „OK“ bestätigen
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Kartenauswahl schließen"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto overscroll-contain p-3.5 sm:p-4 space-y-3">
              {/* Map Container with Floating GPS Button */}
              <div className="relative">
                {hasUsableMapsKey ? (
                  <APIProvider
                    apiKey={mapsApiKey}
                    libraries={["marker"]}
                    language="de"
                    region="DE"
                  >
                    <InteractiveGoogleMapCanvas
                      camera={camera}
                      pinPos={pinPos}
                      onCameraChange={setCamera}
                      onPinMove={handlePinMove}
                    />
                  </APIProvider>
                ) : (
                  <InteractiveFallbackMapSurface
                    center={camera.center}
                    pinPos={pinPos}
                    zoom={camera.zoom}
                    onZoomChange={(newZoom) =>
                      setCamera((prev) => ({ ...prev, zoom: newZoom }))
                    }
                    onPinMove={handlePinMove}
                  />
                )}

                <button
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback(30);
                    handleLocateMe();
                  }}
                  disabled={gpsLocating}
                  className="absolute top-3 right-3 z-20 inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 px-3 py-1.5 text-xs font-extrabold text-primary dark:text-slate-100 shadow-md border border-primary/10 dark:border-white/15 hover:border-accent active:scale-95 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {gpsLocating ? (
                    <Loader2 size={13} className="animate-spin text-accent" />
                  ) : (
                    <Navigation size={13} className="text-accent" />
                  )}
                  <span>{gpsLocating ? "Ort wird gesucht…" : "Mein Standort"}</span>
                </button>
              </div>

              {/* Compact Address Confirmation Inputs with 16px iOS zoom prevention */}
              <div className="grid gap-2.5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 flex items-center justify-between text-[11px] font-bold text-ink-muted">
                    <span>Straße &amp; Hausnr.</span>
                    {isResolvingAddress && (
                      <Loader2 size={11} className="animate-spin text-accent" />
                    )}
                  </label>
                  <input
                    type="text"
                    value={resolvedStreet}
                    onChange={(e) => setResolvedStreet(e.target.value)}
                    placeholder="z. B. Iburger Straße 5"
                    className="w-full rounded-xl border border-primary/15 dark:border-white/15 bg-surface dark:bg-slate-800 px-3 py-2 text-[16px] sm:text-sm font-medium text-primary dark:text-slate-100 focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-ink-muted">
                    PLZ &amp; Ort
                  </label>
                  <input
                    type="text"
                    value={resolvedZip}
                    onChange={(e) => setResolvedZip(e.target.value)}
                    placeholder="49082 Osnabrück"
                    className="w-full rounded-xl border border-primary/15 dark:border-white/15 bg-surface dark:bg-slate-800 px-3 py-2 text-[16px] sm:text-sm font-medium text-primary dark:text-slate-100 focus:border-accent focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer with full-width mobile touch confirm button */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 border-t border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-950/60 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto inline-flex min-h-[44px] items-center justify-center rounded-xl border border-primary/15 dark:border-white/15 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-bold text-ink-muted hover:text-primary dark:hover:text-slate-100 transition-colors cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback(50);
                  handleConfirmPin();
                }}
                data-testid="map-picker-confirm-btn"
                className="w-full sm:w-auto inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-6 py-2.5 text-sm font-extrabold text-white shadow-md shadow-red-600/25 transition-all active:scale-[0.98] cursor-pointer"
              >
                <Check size={18} strokeWidth={2.75} />
                <span>OK · Standort übernehmen</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
