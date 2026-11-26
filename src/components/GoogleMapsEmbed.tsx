"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  APIProvider,
  APILoadingStatus,
  AdvancedMarker,
  Circle,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  useMap,
} from "@vis.gl/react-google-maps";
import {
  CheckCircle2,
  Compass,
  Crosshair,
  ExternalLink,
  Hand,
  Loader2,
  LocateFixed,
  Lock,
  MapPin,
  Minus,
  Navigation,
  Plus,
  Radar,
  RotateCw,
  X,
} from "lucide-react";
import { business } from "@/data/site";
import { useGoogleLivePlace } from "@/lib/googlePlaceLive";
import { getBrowserPositionWithFallback } from "@/lib/geolocation";
import { osnabrueckServiceAreas } from "@/lib/repairRequest";
import { triggerHapticFeedback } from "@/lib/haptics";

export type ContactMapViewMode = "service-area" | "pin";

const MAP_CROSSFADE_EASE = [0.22, 1, 0.36, 1] as const;
const MIN_MAP_ZOOM = 8;
const MAX_MAP_ZOOM = 18;
const MAP_LOAD_TIMEOUT_MS = 5000;
const SERVICE_RADIUS_KM = 25;

export interface GoogleMapsEmbedProps {
  className?: string;
  title?: string;
  viewMode?: ContactMapViewMode;
  defaultViewMode?: ContactMapViewMode;
  onViewModeChange?: (mode: ContactMapViewMode) => void;
  showModeToggle?: boolean;
}

type ServiceAreaItem = (typeof osnabrueckServiceAreas)[number];

type UserLocationState =
  | { status: "idle" }
  | { status: "locating" }
  | {
      status: "located";
      lat: number;
      lng: number;
      distanceFromHqKm: number;
      inServiceZone: boolean;
      nearestArea: ServiceAreaItem;
    }
  | { status: "denied" | "unavailable" | "error"; message: string };

function computeExactDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function computeDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  return Math.round(computeExactDistanceKm(lat1, lng1, lat2, lng2));
}

function findNearestServiceArea(lat: number, lng: number): ServiceAreaItem {
  let nearest: ServiceAreaItem = osnabrueckServiceAreas[0];
  let minDistance = Number.POSITIVE_INFINITY;
  for (const area of osnabrueckServiceAreas) {
    const dist = computeExactDistanceKm(lat, lng, area.lat, area.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = area;
    }
  }
  return nearest;
}

function ServiceAreaMarkerWithInfo({
  area,
  hqCoordinates,
  isSelected,
  infoOpen,
  onSelect,
  onCloseInfo,
}: {
  area: ServiceAreaItem;
  hqCoordinates: { lat: number; lng: number };
  isSelected: boolean;
  infoOpen: boolean;
  onSelect: (area: ServiceAreaItem) => void;
  onCloseInfo: () => void;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const distanceKm = computeDistanceKm(
    hqCoordinates.lat,
    hqCoordinates.lng,
    area.lat,
    area.lng
  );

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: area.lat, lng: area.lng }}
        title={`${area.label} (${area.zip})`}
        onClick={() => {
          triggerHapticFeedback(25);
          onSelect(area);
        }}
      >
        <Pin
          background={isSelected ? "#0284C7" : "#0F172A"}
          borderColor={isSelected ? "#BAE6FD" : "#38BDF8"}
          glyphColor="#FFFFFF"
          scale={isSelected ? 1.12 : 0.85}
        />
      </AdvancedMarker>
      {isSelected && infoOpen && marker && (
        <InfoWindow anchor={marker} maxWidth={210} onCloseClick={onCloseInfo}>
          <div className="p-0.5 text-slate-900">
            <p className="text-xs font-extrabold">{area.label}</p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              PLZ {area.zip} · ca. {Math.max(1, distanceKm)} km ab Osnabrück
            </p>
            <p className="text-[11px] font-bold text-sky-700 mt-1">
              Lieferung &amp; Übergabe nach Termin
            </p>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

/**
 * Syncs the map camera strictly on explicit programmatic changes (mode switch,
 * area tap, GPS locate, +/- zoom button press) and keeps the canvas sharp on
 * container resize across mobile, tablet, and desktop layouts without fighting
 * touch pinch-zoom or drag gestures.
 */
function MapCameraSync({
  center,
  hqCoordinates,
  zoom,
  fitServiceOverview,
  cameraCommandTick,
  zoomCommandTick,
}: {
  center: { lat: number; lng: number };
  hqCoordinates: { lat: number; lng: number };
  zoom: number;
  fitServiceOverview: boolean;
  cameraCommandTick: number;
  zoomCommandTick: number;
}) {
  const map = useMap();
  const initializedRef = useRef(false);
  const lastCameraTickRef = useRef(cameraCommandTick);
  const lastZoomTickRef = useRef(zoomCommandTick);

  useEffect(() => {
    if (!map) return;

    const applyServiceBoundsOrCenter = (smooth: boolean) => {
      if (fitServiceOverview) {
        // Fit the full 25 km Osnabrück service circle cleanly on any screen aspect ratio
        map.fitBounds(
          {
            north: hqCoordinates.lat + 0.225,
            south: hqCoordinates.lat - 0.225,
            east: hqCoordinates.lng + 0.365,
            west: hqCoordinates.lng - 0.365,
          },
          { top: 48, right: 56, bottom: 32, left: 24 }
        );
        return;
      }

      if (smooth) {
        map.panTo(center);
      } else {
        map.setCenter(center);
      }
      if (map.getZoom() !== zoom) {
        map.setZoom(zoom);
      }
    };

    if (!initializedRef.current) {
      initializedRef.current = true;
      applyServiceBoundsOrCenter(false);
      lastCameraTickRef.current = cameraCommandTick;
      lastZoomTickRef.current = zoomCommandTick;
      return;
    }

    if (lastCameraTickRef.current !== cameraCommandTick) {
      lastCameraTickRef.current = cameraCommandTick;
      applyServiceBoundsOrCenter(true);
      lastZoomTickRef.current = zoomCommandTick;
      return;
    }

    if (lastZoomTickRef.current !== zoomCommandTick) {
      lastZoomTickRef.current = zoomCommandTick;
      if (map.getZoom() !== zoom) {
        map.setZoom(zoom);
      }
    }
  }, [map, center, hqCoordinates, zoom, fitServiceOverview, cameraCommandTick, zoomCommandTick]);

  // Trigger map resize event whenever the container changes dimensions (e.g. mobile rotation, drawer open, sidebar resize)
  useEffect(() => {
    if (!map || typeof ResizeObserver === "undefined") return;
    const div = map.getDiv();
    if (!div) return;
    let rafId = 0;
    const observer = new ResizeObserver(() => {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        const mapsEvent = (
          window as unknown as {
            google?: {
              maps?: {
                event?: {
                  trigger?: (instance: unknown, eventName: string) => void;
                };
              };
            };
          }
        ).google?.maps?.event;
        mapsEvent?.trigger?.(map, "resize");
      });
    });
    observer.observe(div);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [map]);

  return null;
}

function MapLazyPlaceholder({
  mode,
  onLoadNow,
}: {
  mode: ContactMapViewMode;
  onLoadNow: () => void;
}) {
  return (
    <div
      data-testid="map-lazy-placeholder"
      className="absolute inset-0 z-[1] flex items-center justify-center overflow-hidden bg-slate-100 dark:bg-slate-900 px-3 py-6"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-45 dark:opacity-25 bg-[radial-gradient(#0284c7_1px,transparent_1px)] [background-size:18px_18px]"
      />
      <button
        type="button"
        onClick={onLoadNow}
        data-testid="map-lazy-load-now-btn"
        className="relative z-10 inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-primary/12 dark:border-white/15 bg-white/95 dark:bg-slate-950/95 px-4 py-2 text-xs font-bold text-primary dark:text-slate-100 shadow-sm hover:border-sky-500/50 active:scale-95 transition-all cursor-pointer"
      >
        {mode === "service-area" ? (
          <Radar size={14} className="text-sky-600 dark:text-sky-400 shrink-0" aria-hidden="true" />
        ) : (
          <MapPin size={14} className="text-red-500 shrink-0" aria-hidden="true" />
        )}
        <span>
          {mode === "service-area"
            ? "Regionskarte (25 km) laden"
            : "Standort-Karte laden"}
        </span>
      </button>
    </div>
  );
}

function MapLoadingBackdrop({ mode }: { mode: ContactMapViewMode }) {
  return (
    <div
      data-testid="map-loading-backdrop"
      aria-live="polite"
      className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center overflow-hidden bg-slate-100 dark:bg-slate-900"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-45 dark:opacity-25 bg-[radial-gradient(#0284c7_1px,transparent_1px)] [background-size:18px_18px]"
      />
      <div className="relative z-10 inline-flex items-center gap-2 rounded-xl border border-primary/10 dark:border-white/10 bg-white/90 dark:bg-slate-950/90 px-3.5 py-2 text-xs font-bold text-primary dark:text-slate-200 shadow-sm backdrop-blur-xs">
        <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" aria-hidden="true" />
        <span>
          {mode === "service-area"
            ? "Regionskarte wird geladen …"
            : "Standortkarte wird geladen …"}
        </span>
      </div>
    </div>
  );
}

function MapTimeoutFallbackCard({
  mode,
  selectedArea,
  placeAddress,
  mapsExternalHref,
  onRetry,
}: {
  mode: ContactMapViewMode;
  selectedArea: ServiceAreaItem | null;
  placeAddress: string;
  mapsExternalHref: string;
  onRetry: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      data-testid="map-timeout-fallback"
      role="status"
      aria-live="polite"
      className="absolute inset-0 z-[8] flex items-center justify-center overflow-y-auto bg-slate-100/95 dark:bg-slate-900/95 px-3 py-4 backdrop-blur-[2px]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-20 bg-[radial-gradient(#0284c7_1px,transparent_1px)] [background-size:18px_18px]"
      />

      <div className="relative z-10 w-full max-w-[272px] rounded-2xl border border-primary/12 dark:border-white/15 bg-white/95 dark:bg-slate-950/95 p-3 text-center shadow-lg">
        <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/12 text-sky-600 dark:text-sky-400">
          {mode === "service-area" ? (
            <Radar size={16} aria-hidden="true" />
          ) : (
            <MapPin size={16} className="text-red-500" aria-hidden="true" />
          )}
        </div>

        <p className="text-xs font-extrabold text-primary dark:text-slate-100">
          Karte konnte nicht geladen werden
        </p>
        <p className="mt-0.5 text-[11px] leading-snug text-ink-muted">
          {mode === "service-area"
            ? selectedArea
              ? `Lieferung & Übergabe in ${selectedArea.zip} ${selectedArea.city} (Region Osnabrück)`
              : "Lieferung & Übergabe im 25 km Radius um Osnabrück & Landkreis"
            : placeAddress}
        </p>

        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={onRetry}
            data-testid="map-retry-btn"
            className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl bg-primary dark:bg-accent px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:opacity-95 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCw size={13} aria-hidden="true" />
            <span>Erneut laden</span>
          </button>
          <a
            href={mapsExternalHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[38px] items-center justify-center gap-1 rounded-xl border border-primary/15 dark:border-white/15 bg-surface px-2.5 py-1.5 text-[11px] font-bold text-primary dark:text-slate-100 hover:text-accent transition-colors"
          >
            <span>Maps öffnen</span>
            <ExternalLink size={11} aria-hidden="true" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

function InteractiveGoogleMapsView({
  mode,
  zoom,
  touchNavUnlocked,
  cameraCommandTick,
  zoomCommandTick,
  selectedArea,
  areaInfoOpen,
  userCoordinates,
  userDistanceKm,
  hqCoordinates,
  placeDisplayName,
  placeAddress,
  placeHoursSummary,
  mapsExternalHref,
  retryNonce,
  onRetry,
  onSelectArea,
  onCloseAreaInfo,
  onUserZoomChange,
}: {
  mode: ContactMapViewMode;
  zoom: number;
  touchNavUnlocked: boolean;
  cameraCommandTick: number;
  zoomCommandTick: number;
  selectedArea: ServiceAreaItem | null;
  areaInfoOpen: boolean;
  userCoordinates: { lat: number; lng: number } | null;
  userDistanceKm: number | null;
  hqCoordinates: { lat: number; lng: number };
  placeDisplayName: string;
  placeAddress: string;
  placeHoursSummary: string;
  mapsExternalHref: string;
  retryNonce: number;
  onRetry: () => void;
  onSelectArea: (area: ServiceAreaItem | null) => void;
  onCloseAreaInfo: () => void;
  onUserZoomChange: (zoom: number) => void;
}) {
  const loadingStatus = useApiLoadingStatus();
  const [hqMarkerRef, hqMarker] = useAdvancedMarkerRef();
  const [userMarkerRef, userMarker] = useAdvancedMarkerRef();
  const [hqInfoOpen, setHqInfoOpen] = useState(false);
  const [userInfoOpen, setUserInfoOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const [crossFadeTick, setCrossFadeTick] = useState(0);
  const [sdkTimedOut, setSdkTimedOut] = useState(false);
  const prevModeRef = useRef<ContactMapViewMode>(mode);

  useEffect(() => {
    if (prevModeRef.current !== mode) {
      prevModeRef.current = mode;
      setCrossFadeTick((tick) => tick + 1);
    }
  }, [mode]);

  useEffect(() => {
    setUserInfoOpen(Boolean(userCoordinates));
  }, [userCoordinates]);

  useEffect(() => {
    if (
      loadingStatus === APILoadingStatus.LOADED ||
      loadingStatus === APILoadingStatus.AUTH_FAILURE ||
      loadingStatus === APILoadingStatus.FAILED
    ) {
      setSdkTimedOut(false);
      return;
    }

    setSdkTimedOut(false);
    const timer = window.setTimeout(() => {
      setSdkTimedOut(true);
    }, MAP_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [loadingStatus, retryNonce]);

  if (
    loadingStatus === APILoadingStatus.AUTH_FAILURE ||
    loadingStatus === APILoadingStatus.FAILED
  ) {
    return (
      <IframeMapFallbackView
        mode={mode}
        zoom={zoom}
        touchNavUnlocked={touchNavUnlocked}
        selectedArea={selectedArea}
        userCoordinates={userCoordinates}
        placeAddress={placeAddress}
        mapsExternalHref={mapsExternalHref}
        retryNonce={retryNonce}
        onRetry={onRetry}
      />
    );
  }

  const isSdkReady = loadingStatus === APILoadingStatus.LOADED;
  const fitServiceOverview =
    mode === "service-area" && !selectedArea && !userCoordinates;

  const center = userCoordinates
    ? userCoordinates
    : mode === "pin"
    ? hqCoordinates
    : selectedArea
    ? { lat: selectedArea.lat, lng: selectedArea.lng }
    : { lat: hqCoordinates.lat, lng: hqCoordinates.lng };

  return (
    <div className="relative h-full w-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
      <GoogleMap
        mapId="DEMO_MAP_ID"
        internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
        defaultCenter={center}
        defaultZoom={zoom}
        minZoom={MIN_MAP_ZOOM}
        maxZoom={MAX_MAP_ZOOM}
        gestureHandling={touchNavUnlocked ? "greedy" : "cooperative"}
        clickableIcons={false}
        zoomControl={false}
        streetViewControl={false}
        mapTypeControl={false}
        fullscreenControl={false}
        onZoomChanged={(event) => {
          const next = event.map.getZoom();
          if (typeof next === "number" && Number.isFinite(next)) {
            const clamped = Math.max(
              MIN_MAP_ZOOM,
              Math.min(MAX_MAP_ZOOM, Math.round(next))
            );
            onUserZoomChange(clamped);
          }
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <MapCameraSync
          center={center}
          hqCoordinates={hqCoordinates}
          zoom={zoom}
          fitServiceOverview={fitServiceOverview}
          cameraCommandTick={cameraCommandTick}
          zoomCommandTick={zoomCommandTick}
        />

        {mode === "service-area" && (
          <>
            {/* Outer 25 km Regional Service Radius */}
            <Circle
              center={hqCoordinates}
              radius={25000}
              strokeColor="#0284C7"
              strokeOpacity={0.85}
              strokeWeight={2}
              fillColor="#38BDF8"
              fillOpacity={0.12}
            />
            {/* Inner 8 km City Core Radius */}
            <Circle
              center={hqCoordinates}
              radius={8000}
              strokeColor="#0F172A"
              strokeOpacity={0.55}
              strokeWeight={1.5}
              fillColor="#0284C7"
              fillOpacity={0.14}
            />

            {osnabrueckServiceAreas.map((area) => (
              <ServiceAreaMarkerWithInfo
                key={area.value}
                area={area}
                hqCoordinates={hqCoordinates}
                isSelected={selectedArea?.value === area.value}
                infoOpen={areaInfoOpen && selectedArea?.value === area.value}
                onSelect={(clicked) => onSelectArea(clicked)}
                onCloseInfo={onCloseAreaInfo}
              />
            ))}
          </>
        )}

        {/* Primary Hannachi Address Pin */}
        <AdvancedMarker
          ref={hqMarkerRef}
          position={hqCoordinates}
          title={`${placeDisplayName} – ${placeAddress}`}
          onClick={() => setHqInfoOpen((prev) => !prev)}
        >
          <Pin
            background="#DC2626"
            borderColor="#7F1D1D"
            glyphColor="#FFFFFF"
            scale={mode === "pin" ? 1.25 : 1.05}
          />
        </AdvancedMarker>

        {hqInfoOpen && hqMarker && (
          <InfoWindow
            anchor={hqMarker}
            maxWidth={220}
            onCloseClick={() => setHqInfoOpen(false)}
          >
            <div className="p-0.5 text-slate-900">
              <p className="text-xs font-extrabold">{placeDisplayName}</p>
              <p className="text-[11px] text-slate-600 mt-0.5">{placeAddress}</p>
              <p className="text-[11px] font-semibold text-sky-700 mt-1">
                {placeHoursSummary}
              </p>
            </div>
          </InfoWindow>
        )}

        {/* User's Current Position Marker (when located inside the Osnabrück service area) */}
        {userCoordinates && (
          <>
            <AdvancedMarker
              ref={userMarkerRef}
              position={userCoordinates}
              title="Ihr aktueller Standort"
              onClick={() => setUserInfoOpen((prev) => !prev)}
            >
              <Pin
                background="#0284C7"
                borderColor="#FFFFFF"
                glyphColor="#FFFFFF"
                scale={1.15}
              />
            </AdvancedMarker>
            {userInfoOpen && userMarker && (
              <InfoWindow
                anchor={userMarker}
                maxWidth={210}
                onCloseClick={() => setUserInfoOpen(false)}
              >
                <div className="p-0.5 text-slate-900">
                  <p className="text-xs font-extrabold">Ihr aktueller Standort</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    ca. {Math.max(1, userDistanceKm ?? 1)} km ab Osnabrück
                  </p>
                  <p className="text-[11px] font-bold text-emerald-700 mt-1">
                    In der Region Osnabrück (25 km)
                  </p>
                </div>
              </InfoWindow>
            )}
          </>
        )}
      </GoogleMap>

      {/* Loading & >5s Fallback Overlay when Maps JS SDK is delayed */}
      {!isSdkReady && !sdkTimedOut && <MapLoadingBackdrop mode={mode} />}
      <AnimatePresence>
        {sdkTimedOut && !isSdkReady && (
          <MapTimeoutFallbackCard
            mode={mode}
            selectedArea={selectedArea}
            placeAddress={placeAddress}
            mapsExternalHref={mapsExternalHref}
            onRetry={onRetry}
          />
        )}
      </AnimatePresence>

      {/* Smooth Cross-Fade Veil when switching between Service Area and Pin views */}
      <AnimatePresence>
        {crossFadeTick > 0 && !prefersReducedMotion && (
          <motion.div
            key={`map-veil-${crossFadeTick}`}
            aria-hidden="true"
            initial={{ opacity: 0.42 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: MAP_CROSSFADE_EASE }}
            className={`pointer-events-none absolute inset-0 z-[5] ${
              mode === "service-area"
                ? "bg-sky-500/15 backdrop-blur-[1px]"
                : "bg-slate-900/12 backdrop-blur-[1px]"
            }`}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function IframeMapFallbackView({
  mode,
  zoom,
  touchNavUnlocked,
  selectedArea,
  userCoordinates,
  placeAddress,
  mapsExternalHref,
  retryNonce,
  onRetry,
  onUnlockTouchNav,
}: {
  mode: ContactMapViewMode;
  zoom: number;
  touchNavUnlocked: boolean;
  selectedArea: ServiceAreaItem | null;
  userCoordinates: { lat: number; lng: number } | null;
  placeAddress: string;
  mapsExternalHref: string;
  retryNonce: number;
  onRetry: () => void;
  onUnlockTouchNav?: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();

  const iframeSrc = useMemo(() => {
    if (userCoordinates) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(
        `${userCoordinates.lat.toFixed(6)},${userCoordinates.lng.toFixed(6)}`
      )}&t=&z=${zoom}&ie=UTF8&iwloc=&output=embed`;
    }
    if (mode === "pin") {
      try {
        const url = new URL(business.mapsEmbedUrl);
        url.searchParams.set("z", String(zoom));
        return url.toString();
      } catch {
        return business.mapsEmbedUrl;
      }
    }
    if (selectedArea) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(
        `${selectedArea.zip} ${selectedArea.city}, Deutschland`
      )}&t=&z=${zoom}&ie=UTF8&iwloc=&output=embed`;
    }
    return `https://maps.google.com/maps?q=${encodeURIComponent(
      "Osnabrück, Deutschland"
    )}&t=&z=${zoom}&ie=UTF8&iwloc=&output=embed`;
  }, [mode, zoom, selectedArea, userCoordinates]);

  const loadKey = `${iframeSrc}::${retryNonce}`;
  const [loadStatus, setLoadStatus] = useState<"loading" | "loaded" | "timed_out">(
    "loading"
  );

  useEffect(() => {
    setLoadStatus("loading");
    const timer = window.setTimeout(() => {
      setLoadStatus((prev) => (prev === "loaded" ? "loaded" : "timed_out"));
    }, MAP_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [loadKey]);

  const ringScale = Math.max(0.45, Math.min(2.2, Math.pow(1.3, zoom - 10)));

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
      {loadStatus === "loading" && <MapLoadingBackdrop mode={mode} />}

      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={loadKey}
          initial={
            prefersReducedMotion
              ? { opacity: 0 }
              : { opacity: 0, scale: 1.01 }
          }
          animate={
            prefersReducedMotion
              ? { opacity: loadStatus === "loaded" ? 1 : 0.15 }
              : { opacity: loadStatus === "loaded" ? 1 : 0.15, scale: 1 }
          }
          exit={
            prefersReducedMotion
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.99 }
          }
          transition={{
            duration: prefersReducedMotion ? 0.12 : 0.32,
            ease: MAP_CROSSFADE_EASE,
          }}
          className="absolute inset-0 z-[2] h-full w-full"
        >
          <iframe
            title={
              userCoordinates
                ? "Ihr aktueller Standort in der Region Osnabrück auf Google Maps"
                : mode === "service-area"
                ? "Hannachi Region Osnabrück & Umgebung auf Google Maps"
                : "Hannachi Standort Osnabrück auf Google Maps"
            }
            src={iframeSrc}
            onLoad={() => setLoadStatus("loaded")}
            onError={() => setLoadStatus("timed_out")}
            className="h-full w-full border-0"
            loading="eager"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </motion.div>
      </AnimatePresence>

      {/* Scroll-Safe Touch Shield in Iframe Fallback: preserves vertical page scroll until tapped to pan */}
      {!touchNavUnlocked && loadStatus === "loaded" && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            triggerHapticFeedback(20);
            onUnlockTouchNav?.();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onUnlockTouchNav?.();
            }
          }}
          aria-label="Karte für Touch-Steuerung aktivieren"
          className="absolute inset-0 z-[4] cursor-pointer touch-pan-y bg-transparent"
        />
      )}

      {/* Visual Service Area Overlay when viewing regional coverage */}
      <AnimatePresence initial={false}>
        {mode === "service-area" &&
          !selectedArea &&
          !userCoordinates &&
          loadStatus === "loaded" && (
            <motion.div
              key="service-area-ring-overlay"
              aria-hidden="true"
              initial={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.86 * ringScale }
              }
              animate={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : { opacity: 1, scale: ringScale }
              }
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 1.06 * ringScale }
              }
              transition={{
                duration: prefersReducedMotion ? 0.12 : 0.36,
                ease: MAP_CROSSFADE_EASE,
              }}
              className="pointer-events-none absolute inset-0 z-[3] flex items-center justify-center"
            >
              <div className="relative flex h-40 w-40 sm:h-48 sm:w-48 items-center justify-center rounded-full border-2 border-dashed border-sky-600/80 bg-sky-500/12 shadow-[0_0_0_18px_rgba(14,165,233,0.08)]">
                <div className="h-14 w-14 rounded-full border border-sky-700/50 bg-sky-600/15" />
              </div>
            </motion.div>
          )}
      </AnimatePresence>

      {/* >5s Timeout / Error Fallback Card */}
      <AnimatePresence>
        {loadStatus === "timed_out" && (
          <MapTimeoutFallbackCard
            mode={mode}
            selectedArea={selectedArea}
            placeAddress={placeAddress}
            mapsExternalHref={mapsExternalHref}
            onRetry={onRetry}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function GoogleMapsEmbed({
  className = "relative h-[250px] min-[380px]:h-[280px] sm:h-[310px] lg:h-[330px] w-full",
  title = "Hannachi Standort Osnabrück auf Google Maps",
  viewMode,
  defaultViewMode = "pin",
  onViewModeChange,
  showModeToggle = false,
}: GoogleMapsEmbedProps) {
  const { place } = useGoogleLivePlace();
  const hqCoordinates = place.coordinates;
  const placeAddress = place.shortFormattedAddress;
  const toggleGroupId = useId();
  const prefersReducedMotion = useReducedMotion();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [hasEnteredViewport, setHasEnteredViewport] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return typeof IntersectionObserver === "undefined";
  });
  const [internalMode, setInternalMode] =
    useState<ContactMapViewMode>(defaultViewMode);
  const [selectedArea, setSelectedArea] = useState<ServiceAreaItem | null>(
    null
  );
  const [areaInfoOpen, setAreaInfoOpen] = useState(false);

  const activeMode = viewMode ?? internalMode;
  const [userLocation, setUserLocation] = useState<UserLocationState>({
    status: "idle",
  });
  const activeUserCoordinates =
    userLocation.status === "located" && userLocation.inServiceZone
      ? { lat: userLocation.lat, lng: userLocation.lng }
      : null;

  const getOverviewZoom = () => {
    if (typeof window !== "undefined") {
      const containerWidth = mapContainerRef.current?.clientWidth || window.innerWidth;
      if (containerWidth < 400) return 9;
    }
    return 10;
  };

  const computeTargetZoom = (
    targetMode: ContactMapViewMode,
    targetArea: ServiceAreaItem | null,
    hasUserCoords: boolean
  ) => {
    if (hasUserCoords) return 14;
    if (targetMode === "pin") return 15;
    if (targetArea) return 12;
    return getOverviewZoom();
  };

  const [zoom, setZoom] = useState<number>(() =>
    computeTargetZoom(activeMode, selectedArea, Boolean(activeUserCoordinates))
  );
  const [touchNavUnlocked, setTouchNavUnlocked] = useState<boolean>(false);
  const [cameraCommandTick, setCameraCommandTick] = useState(0);
  const [zoomCommandTick, setZoomCommandTick] = useState(0);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    if (hasEnteredViewport) return;
    const node = mapContainerRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setHasEnteredViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries.some(
            (entry) => entry.isIntersecting || entry.intersectionRatio > 0
          )
        ) {
          setHasEnteredViewport(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "160px 0px",
        threshold: 0.01,
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasEnteredViewport]);

  // Sync camera cleanly when controlled viewMode prop changes externally
  const prevActiveModeRef = useRef(activeMode);
  useEffect(() => {
    if (prevActiveModeRef.current !== activeMode) {
      prevActiveModeRef.current = activeMode;
      if (activeMode === "pin") {
        setSelectedArea(null);
        setAreaInfoOpen(false);
        if (userLocation.status === "located" && userLocation.inServiceZone) {
          setUserLocation({ status: "idle" });
        }
      }
      const nextZoom = computeTargetZoom(
        activeMode,
        activeMode === "pin" ? null : selectedArea,
        false
      );
      setZoom(nextZoom);
      setCameraCommandTick((t) => t + 1);
    }
  }, [activeMode]);

  const handleZoomIn = () => {
    triggerHapticFeedback(20);
    setHasEnteredViewport(true);
    setZoom((prev) => Math.min(MAX_MAP_ZOOM, prev + 1));
    setZoomCommandTick((t) => t + 1);
  };

  const handleZoomOut = () => {
    triggerHapticFeedback(20);
    setHasEnteredViewport(true);
    setZoom((prev) => Math.max(MIN_MAP_ZOOM, prev - 1));
    setZoomCommandTick((t) => t + 1);
  };

  const handleRecenterOverview = () => {
    triggerHapticFeedback(25);
    setHasEnteredViewport(true);
    if (activeMode === "service-area" && (selectedArea || activeUserCoordinates)) {
      // Re-fit active point first, or return cleanly to full 25 km overview
      setSelectedArea(null);
      setAreaInfoOpen(false);
      if (userLocation.status === "located" && userLocation.inServiceZone) {
        setUserLocation({ status: "idle" });
      }
      setZoom(getOverviewZoom());
    } else {
      setZoom(computeTargetZoom(activeMode, selectedArea, Boolean(activeUserCoordinates)));
    }
    setCameraCommandTick((t) => t + 1);
  };

  const handleRetryMapLoad = () => {
    triggerHapticFeedback(25);
    setHasEnteredViewport(true);
    setRetryNonce((prev) => prev + 1);
  };

  const handleSelectArea = (area: ServiceAreaItem | null, openInfo = true) => {
    if (activeUserCoordinates) {
      setUserLocation({ status: "idle" });
    }
    setSelectedArea(area);
    setAreaInfoOpen(Boolean(area && openInfo));
    setZoom(computeTargetZoom(activeMode, area, false));
    setCameraCommandTick((t) => t + 1);
  };

  const handleShowMyLocation = async () => {
    triggerHapticFeedback(25);
    setHasEnteredViewport(true);

    if (userLocation.status === "located" && userLocation.inServiceZone) {
      setUserLocation({ status: "idle" });
      setZoom(computeTargetZoom(activeMode, selectedArea, false));
      setCameraCommandTick((t) => t + 1);
      return;
    }

    setUserLocation({ status: "locating" });
    const result = await getBrowserPositionWithFallback();

    if (!result.ok) {
      setUserLocation({
        status:
          result.reason === "denied" || result.reason === "policy_blocked"
            ? "denied"
            : result.reason === "unsupported"
            ? "unavailable"
            : "error",
        message: result.message,
      });
      return;
    }

    const { lat, lng } = result;
    const exactKm = computeExactDistanceKm(
      hqCoordinates.lat,
      hqCoordinates.lng,
      lat,
      lng
    );
    const distanceFromHqKm = Math.round(exactKm);
    const inServiceZone = exactKm <= SERVICE_RADIUS_KM;
    const nearestArea = findNearestServiceArea(lat, lng);

    setUserLocation({
      status: "located",
      lat,
      lng,
      distanceFromHqKm,
      inServiceZone,
      nearestArea,
    });

    setSelectedArea(null);
    setAreaInfoOpen(false);
    setZoom(inServiceZone ? 14 : getOverviewZoom());
    setCameraCommandTick((t) => t + 1);
  };

  const setMode = (next: ContactMapViewMode) => {
    triggerHapticFeedback(25);
    if (viewMode === undefined) {
      setInternalMode(next);
    }
    if (next === "pin") {
      setSelectedArea(null);
      setAreaInfoOpen(false);
      if (userLocation.status === "located" && userLocation.inServiceZone) {
        setUserLocation({ status: "idle" });
      }
    }
    setZoom(computeTargetZoom(next, next === "pin" ? null : selectedArea, false));
    setCameraCommandTick((t) => t + 1);
    onViewModeChange?.(next);
  };

  const mapsApiKey = (
    (typeof import.meta !== "undefined" &&
      import.meta.env?.VITE_GOOGLE_MAPS_API_KEY) ||
    ""
  ).trim();
  const hasUsableMapsKey = Boolean(
    mapsApiKey && !mapsApiKey.startsWith("MY_GOOGLE_MAPS")
  );

  const activeAreaDistance = selectedArea
    ? Math.max(
        1,
        computeDistanceKm(
          hqCoordinates.lat,
          hqCoordinates.lng,
          selectedArea.lat,
          selectedArea.lng
        )
      )
    : 25;

  const mapsExternalHref = activeUserCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${activeUserCoordinates.lat},${activeUserCoordinates.lng}`
    : activeMode === "service-area" && selectedArea
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${selectedArea.zip} ${selectedArea.city}`
      )}`
    : place.directionsUri || place.googleMapsUri || business.mapsUrl;

  const topBadgeKey = activeUserCoordinates
    ? `user-${userLocation.status === "located" ? userLocation.distanceFromHqKm : "x"}`
    : `${activeMode}-${selectedArea?.value ?? "all"}`;
  const bottomSummaryKey = activeUserCoordinates
    ? `user-${userLocation.status === "located" ? userLocation.nearestArea.value : "x"}`
    : `${activeMode}-${selectedArea?.value ?? "hq"}`;

  return (
    <div className="@container w-full">
      {/* Optional Inline Toggle Bar (when component manages its own mode switch) */}
      {showModeToggle && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/8 dark:border-white/10 bg-surface px-3 sm:px-3.5 py-2.5">
          <div
            role="group"
            aria-label="Kartenansicht umschalten"
            className="grid grid-cols-2 @md:inline-flex w-full @md:w-auto items-center rounded-xl bg-primary/5 dark:bg-white/5 p-1 gap-1"
          >
            <button
              type="button"
              onClick={() => setMode("service-area")}
              aria-pressed={activeMode === "service-area"}
              data-testid="map-toggle-service-area-btn"
              className={`relative inline-flex min-h-[42px] sm:min-h-[36px] items-center justify-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap ${
                activeMode === "service-area"
                  ? "text-white"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {activeMode === "service-area" && (
                <motion.span
                  layoutId={`map-pill-${toggleGroupId}`}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0.1 }
                      : { type: "spring", stiffness: 380, damping: 32 }
                  }
                  className="absolute inset-0 rounded-lg bg-sky-600 shadow-xs"
                  aria-hidden="true"
                />
              )}
              <Radar size={13} aria-hidden="true" className="relative z-10 shrink-0" />
              <span className="relative z-10 truncate">Region (25 km)</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("pin")}
              aria-pressed={activeMode === "pin"}
              data-testid="map-toggle-pin-btn"
              className={`relative inline-flex min-h-[42px] sm:min-h-[36px] items-center justify-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap ${
                activeMode === "pin"
                  ? "text-white"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {activeMode === "pin" && (
                <motion.span
                  layoutId={`map-pill-${toggleGroupId}`}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0.1 }
                      : { type: "spring", stiffness: 380, damping: 32 }
                  }
                  className="absolute inset-0 rounded-lg bg-primary dark:bg-accent shadow-xs"
                  aria-hidden="true"
                />
              )}
              <MapPin size={13} aria-hidden="true" className="relative z-10 shrink-0" />
              <span className="relative z-10 truncate">Standort-Pin</span>
            </button>
          </div>
        </div>
      )}

      {/* Unobstructed Map Canvas Surface (Lazy-loaded via IntersectionObserver) */}
      <div
        ref={mapContainerRef}
        className={`${className} min-h-[240px] relative overflow-hidden bg-slate-100 dark:bg-slate-900`}
        aria-label={title}
      >
        {!hasEnteredViewport ? (
          <MapLazyPlaceholder
            mode={activeMode}
            onLoadNow={() => {
              triggerHapticFeedback(20);
              setHasEnteredViewport(true);
            }}
          />
        ) : hasUsableMapsKey ? (
          <APIProvider
            key={`maps-provider-${retryNonce}`}
            apiKey={mapsApiKey}
            libraries={["marker"]}
            language="de"
            region="DE"
          >
            <InteractiveGoogleMapsView
              mode={activeMode}
              zoom={zoom}
              touchNavUnlocked={touchNavUnlocked}
              cameraCommandTick={cameraCommandTick}
              zoomCommandTick={zoomCommandTick}
              selectedArea={selectedArea}
              areaInfoOpen={areaInfoOpen}
              userCoordinates={activeUserCoordinates}
              userDistanceKm={
                userLocation.status === "located"
                  ? userLocation.distanceFromHqKm
                  : null
              }
              hqCoordinates={hqCoordinates}
              placeDisplayName={`${business.name} ${business.tagline}`}
              placeAddress={placeAddress}
              placeHoursSummary={place.hoursSummary}
              mapsExternalHref={mapsExternalHref}
              retryNonce={retryNonce}
              onRetry={handleRetryMapLoad}
              onSelectArea={(area) => handleSelectArea(area, true)}
              onCloseAreaInfo={() => setAreaInfoOpen(false)}
              onUserZoomChange={setZoom}
            />
          </APIProvider>
        ) : (
          <IframeMapFallbackView
            mode={activeMode}
            zoom={zoom}
            touchNavUnlocked={touchNavUnlocked}
            selectedArea={selectedArea}
            userCoordinates={activeUserCoordinates}
            placeAddress={placeAddress}
            mapsExternalHref={mapsExternalHref}
            retryNonce={retryNonce}
            onRetry={handleRetryMapLoad}
            onUnlockTouchNav={() => setTouchNavUnlocked(true)}
          />
        )}

        {/* Top-Left Compact Status Chip (Leaves center & bottom completely clear on all screens) */}
        <div className="pointer-events-none absolute top-2.5 left-2.5 right-14 z-10 flex items-start">
          <AnimatePresence mode="wait" initial={false}>
            {activeUserCoordinates && userLocation.status === "located" ? (
              <motion.span
                key={`badge-${topBadgeKey}`}
                initial={
                  prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }
                }
                animate={
                  prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }
                }
                exit={
                  prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 4 }
                }
                transition={{
                  duration: prefersReducedMotion ? 0.1 : 0.2,
                  ease: "easeOut",
                }}
                className="pointer-events-auto inline-flex max-w-full items-center gap-1.5 rounded-xl bg-sky-700/95 px-2.5 sm:px-3 py-1.5 text-[11px] font-extrabold text-white shadow-md backdrop-blur-xs"
              >
                <LocateFixed
                  size={13}
                  className="text-sky-200 shrink-0"
                  aria-hidden="true"
                />
                <span className="truncate">
                  Ihr Standort · ca. {Math.max(1, userLocation.distanceFromHqKm)} km ab Osnabrück
                </span>
              </motion.span>
            ) : activeMode === "service-area" ? (
              <motion.span
                key={`badge-${topBadgeKey}`}
                initial={
                  prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }
                }
                animate={
                  prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }
                }
                exit={
                  prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 4 }
                }
                transition={{
                  duration: prefersReducedMotion ? 0.1 : 0.2,
                  ease: "easeOut",
                }}
                className="pointer-events-auto inline-flex max-w-full items-center gap-1.5 rounded-xl bg-slate-900/90 px-2.5 sm:px-3 py-1.5 text-[11px] font-extrabold text-white shadow-md backdrop-blur-xs"
              >
                <Compass
                  size={13}
                  className="text-sky-400 shrink-0"
                  aria-hidden="true"
                />
                <span className="truncate">
                  {selectedArea
                    ? `${selectedArea.label} · ca. ${activeAreaDistance} km`
                    : "Region Osnabrück · ca. 25 km"}
                </span>
              </motion.span>
            ) : (
              <motion.span
                key={`badge-${topBadgeKey}`}
                initial={
                  prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }
                }
                animate={
                  prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }
                }
                exit={
                  prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 4 }
                }
                transition={{
                  duration: prefersReducedMotion ? 0.1 : 0.2,
                  ease: "easeOut",
                }}
                className="pointer-events-auto inline-flex max-w-full items-center gap-1.5 rounded-xl bg-slate-900/90 px-2.5 sm:px-3 py-1.5 text-[11px] font-extrabold text-white shadow-md backdrop-blur-xs"
              >
                <MapPin
                  size={13}
                  className="text-red-500 shrink-0"
                  aria-hidden="true"
                />
                <span className="truncate">Standort-Pin · {business.city}</span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom-Left Scroll-Safe Touch Navigation Toggle (prevents trapping page scroll while giving 1-finger pan on demand) */}
        {hasEnteredViewport && (
          <button
            type="button"
            onClick={() => {
              triggerHapticFeedback(20);
              setTouchNavUnlocked((prev) => !prev);
            }}
            aria-pressed={touchNavUnlocked}
            data-testid="map-touch-nav-toggle"
            title={
              touchNavUnlocked
                ? "1-Finger-Kartensteuerung aktiv – tippen um Seitenscrollen wieder freizugeben"
                : "Tippen für 1-Finger-Kartensteuerung (sonst 2 Finger zum Verschieben)"
            }
            className={`absolute bottom-2.5 left-2.5 z-10 inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-extrabold shadow-md backdrop-blur-xs active:scale-95 transition-all cursor-pointer touch-manipulation ${
              touchNavUnlocked
                ? "border-sky-500 bg-sky-600/95 text-white hover:bg-sky-700"
                : "border-primary/12 dark:border-white/15 bg-white/95 dark:bg-slate-900/95 text-primary dark:text-slate-100 hover:border-sky-500/50"
            }`}
          >
            {touchNavUnlocked ? (
              <>
                <Lock size={12} className="shrink-0" aria-hidden="true" />
                <span>Scrollen</span>
              </>
            ) : (
              <>
                <Hand size={12} className="text-sky-600 dark:text-sky-400 shrink-0" aria-hidden="true" />
                <span>1-Finger-Nav</span>
              </>
            )}
          </button>
        )}

        {/* Dedicated Recenter + / - Zoom Control Stack (Top-Right, touch-friendly on all sizes) */}
        <div
          role="group"
          aria-label="Karten-Steuerung"
          data-testid="map-zoom-controls"
          className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1.5"
        >
          <button
            type="button"
            onClick={handleRecenterOverview}
            aria-label="Karte auf Osnabrück zentrieren"
            title="Karte auf Osnabrück zentrieren"
            data-testid="map-recenter-btn"
            className="flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-primary/12 dark:border-white/15 bg-white/95 dark:bg-slate-900/95 text-primary dark:text-slate-100 shadow-md backdrop-blur-xs hover:border-sky-500/50 hover:text-sky-600 dark:hover:text-sky-400 active:scale-95 transition-all cursor-pointer touch-manipulation"
          >
            <Crosshair size={16} strokeWidth={2.25} aria-hidden="true" />
          </button>

          <div className="flex flex-col overflow-hidden rounded-xl border border-primary/12 dark:border-white/15 bg-white/95 dark:bg-slate-900/95 shadow-md backdrop-blur-xs">
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= MAX_MAP_ZOOM}
              aria-label="Karte vergrößern"
              title={`Hineinzoomen (Stufe ${zoom})`}
              data-testid="map-zoom-in-btn"
              className="flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center text-primary dark:text-slate-100 hover:bg-primary/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
            </button>
            <div className="h-px w-full bg-primary/10 dark:bg-white/12" aria-hidden="true" />
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= MIN_MAP_ZOOM}
              aria-label="Karte verkleinern"
              title={`Herauszoomen (Stufe ${zoom})`}
              data-testid="map-zoom-out-btn"
              className="flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center text-primary dark:text-slate-100 hover:bg-primary/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              <Minus size={16} strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Docked Container-Responsive Map Action Bar (Never obscures map markers on 320px phones or narrow sidebars) */}
      <div className="border-t border-primary/8 dark:border-white/10 bg-surface dark:bg-slate-950/70 px-3 py-2.5 space-y-2">
        <div className="flex flex-col @md:flex-row @md:items-center @md:justify-between gap-2">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`summary-${bottomSummaryKey}`}
              initial={
                prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 3 }
              }
              animate={
                prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }
              }
              exit={
                prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -3 }
              }
              transition={{
                duration: prefersReducedMotion ? 0.1 : 0.18,
                ease: "easeOut",
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-primary dark:text-slate-100 min-w-0"
            >
              {activeUserCoordinates && userLocation.status === "located" ? (
                <>
                  <CheckCircle2
                    size={14}
                    className="text-emerald-600 dark:text-emerald-400 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="truncate">
                    Lieferung &amp; Übergabe verfügbar (Nähe {userLocation.nearestArea.city})
                  </span>
                </>
              ) : activeMode === "service-area" ? (
                <>
                  <CheckCircle2
                    size={14}
                    className="text-emerald-600 dark:text-emerald-400 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="truncate">
                    {selectedArea
                      ? `Lieferung & Übergabe in ${selectedArea.zip} ${selectedArea.city}`
                      : "Osnabrück & Landkreis (12 Städte/Gemeinden)"}
                  </span>
                </>
              ) : (
                <>
                  <MapPin
                    size={14}
                    className="text-red-500 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="truncate">{placeAddress}</span>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="grid grid-cols-2 @md:flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleShowMyLocation}
              disabled={userLocation.status === "locating"}
              aria-pressed={Boolean(activeUserCoordinates)}
              aria-label="Meinen aktuellen Standort auf der Karte anzeigen"
              title="Karte auf meinen aktuellen Standort im Raum Osnabrück zentrieren"
              data-testid="map-show-my-location-btn"
              className={`inline-flex min-h-[40px] sm:min-h-[36px] items-center justify-center gap-1.5 rounded-xl border px-2.5 sm:px-3 py-1.5 text-xs font-bold active:scale-95 transition-all cursor-pointer disabled:opacity-75 disabled:cursor-wait whitespace-nowrap ${
                activeUserCoordinates
                  ? "border-sky-600 bg-sky-600 text-white hover:bg-sky-700"
                  : "border-primary/12 dark:border-white/15 bg-white dark:bg-slate-900 text-primary dark:text-slate-100 hover:border-sky-500/50 hover:text-sky-600 dark:hover:text-sky-400"
              }`}
            >
              {userLocation.status === "locating" ? (
                <Loader2 size={13} className="animate-spin shrink-0" aria-hidden="true" />
              ) : (
                <LocateFixed
                  size={13}
                  className={
                    activeUserCoordinates
                      ? "text-white shrink-0"
                      : "text-sky-600 dark:text-sky-400 shrink-0"
                  }
                  aria-hidden="true"
                />
              )}
              <span className="truncate">
                {userLocation.status === "locating"
                  ? "Suche …"
                  : activeUserCoordinates
                  ? "Mein Standort ✓"
                  : "Mein Standort"}
              </span>
            </button>

            <a
              href={mapsExternalHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[40px] sm:min-h-[36px] items-center justify-center gap-1.5 rounded-xl border border-primary/12 dark:border-white/15 bg-white dark:bg-slate-900 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-primary dark:text-slate-100 hover:border-accent/50 hover:text-accent active:scale-95 transition-all whitespace-nowrap"
            >
              <Navigation size={12} className="text-sky-600 dark:text-sky-400 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {activeMode === "service-area" && selectedArea && !activeUserCoordinates
                  ? `${selectedArea.city} zeigen`
                  : "Route öffnen"}
              </span>
              <ExternalLink size={11} className="shrink-0 opacity-75" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Outside-Service-Zone or Geolocation Fallback Notice (Non-blocking docked alert) */}
        <AnimatePresence>
          {userLocation.status === "located" && !userLocation.inServiceZone && (
            <motion.div
              key="outside-zone-notice"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              data-testid="map-outside-zone-notice"
              role="status"
              className="overflow-hidden"
            >
              <div className="flex items-start gap-2 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-[11px] font-semibold text-amber-900 dark:text-amber-100">
                <Compass size={14} className="text-amber-600 dark:text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="min-w-0 flex-1 leading-snug">
                  <p className="font-extrabold">
                    Außerhalb der 25-km-Region (ca. {userLocation.distanceFromHqKm} km)
                  </p>
                  <p className="mt-0.5 opacity-90">
                    Zeige Region Osnabrück · Nächster Ort:{" "}
                    <button
                      type="button"
                      onClick={() => handleSelectArea(userLocation.nearestArea, true)}
                      className="underline font-bold hover:text-accent cursor-pointer"
                    >
                      {userLocation.nearestArea.label}
                    </button>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setUserLocation({ status: "idle" })}
                  aria-label="Hinweis schließen"
                  className="p-1 hover:opacity-75 cursor-pointer shrink-0"
                >
                  <X size={13} aria-hidden="true" />
                </button>
              </div>
            </motion.div>
          )}

          {(userLocation.status === "denied" ||
            userLocation.status === "unavailable" ||
            userLocation.status === "error") && (
            <motion.div
              key="location-fallback-notice"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              data-testid="map-location-fallback-notice"
              role="status"
              className="overflow-hidden"
            >
              <div className="flex items-start gap-2 rounded-xl border border-primary/12 dark:border-white/15 bg-white dark:bg-slate-900 px-3 py-2 text-[11px] font-semibold text-primary dark:text-slate-100">
                <LocateFixed size={13} className="text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="min-w-0 flex-1 leading-snug">
                  <p className="text-ink-muted">{userLocation.message}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleShowMyLocation}
                      className="underline font-bold text-sky-600 dark:text-sky-400 hover:opacity-80 cursor-pointer"
                    >
                      Erneut versuchen
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectArea(osnabrueckServiceAreas[0], true)}
                      className="underline font-bold text-primary dark:text-slate-200 hover:text-accent cursor-pointer"
                    >
                      Osnabrück Zentrum
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUserLocation({ status: "idle" })}
                  aria-label="Hinweis schließen"
                  className="text-ink-muted hover:text-ink p-1 cursor-pointer shrink-0"
                >
                  <X size={13} aria-hidden="true" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Interactive Municipality Quick-Selector Strip (Swipeable single rail on narrow cards/phones, wrap grid on wider screens) */}
      <AnimatePresence initial={false}>
        {activeMode === "service-area" && (
          <motion.div
            key="service-area-municipalities-strip"
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, height: 0 }
            }
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: 1, height: "auto" }
            }
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, height: 0 }
            }
            transition={{
              duration: prefersReducedMotion ? 0.12 : 0.28,
              ease: MAP_CROSSFADE_EASE,
            }}
            data-testid="service-area-municipalities-strip"
            className="overflow-hidden border-t border-primary/8 dark:border-white/10 bg-primary/[0.025] dark:bg-slate-950/60"
          >
            <div className="px-3 py-2.5 space-y-2">
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="font-extrabold text-primary dark:text-slate-200 truncate">
                  Lieferung &amp; Übergabe in Ihrem Ort:
                </span>
                {selectedArea && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHapticFeedback(20);
                      handleSelectArea(null, false);
                    }}
                    className="font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer shrink-0"
                  >
                    Gesamtregion (25 km)
                  </button>
                )}
              </div>
              <div className="flex overflow-x-auto snap-x snap-proximity @md:snap-none scroll-px-3 no-scrollbar touch-pan-x gap-1.5 pb-0.5 @md:flex-wrap @md:overflow-visible @md:pb-0">
                {osnabrueckServiceAreas.map((area) => {
                  const active = selectedArea?.value === area.value;
                  return (
                    <button
                      key={area.value}
                      type="button"
                      onClick={() => {
                        triggerHapticFeedback(20);
                        handleSelectArea(active ? null : area, !active);
                      }}
                      className={`min-h-[38px] sm:min-h-[32px] shrink-0 snap-start px-3 sm:px-2.5 py-1.5 sm:py-1 rounded-xl sm:rounded-lg text-xs sm:text-[11px] font-bold transition-colors whitespace-nowrap cursor-pointer ${
                        active
                          ? "bg-sky-600 text-white shadow-2xs"
                          : "bg-surface dark:bg-slate-900 border border-primary/12 dark:border-white/12 text-ink-muted hover:text-ink hover:border-sky-500/50"
                      }`}
                    >
                      {area.city}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
