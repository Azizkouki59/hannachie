"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  motion,
  useDragControls,
  useReducedMotion,
  type PanInfo,
} from "framer-motion";
import {
  APIProvider,
  APILoadingStatus,
  AdvancedMarker,
  Map as GoogleMap,
  Pin,
  useApiLoadingStatus,
  useMap,
  type MapMouseEvent,
} from "@vis.gl/react-google-maps";
import {
  Check,
  Crosshair,
  Loader2,
  MapPin,
  Minus,
  Navigation,
  Plus,
  Search,
  Target,
  X,
} from "lucide-react";
import { hapticDismiss, triggerHapticFeedback } from "@/lib/haptics";
import {
  formatCoordinatesDisplay,
  geocodePlaceQuery,
  osnabrueckServiceAreas,
  reverseGeocodePosition,
  type VerifiedLocationInfo,
} from "@/lib/repairRequest";
import { useUserPlace } from "@/lib/userPlace";

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

const PIN_MAP_TIMEOUT_MS = 5000;
const MIN_PIN_ZOOM = 10;
const MAX_PIN_ZOOM = 19;

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
 * Syncs camera only for explicit programmatic actions (modal open, GPS locate,
 * recenter-to-pin, +/- zoom buttons) and resizes cleanly on screen rotation,
 * leaving touch pan and two-finger pinch-zoom 100% smooth.
 */
function PinModalCameraSync({
  targetCenter,
  targetZoom,
  cameraCommandTick,
  zoomCommandTick,
}: {
  targetCenter: LatLng;
  targetZoom: number;
  cameraCommandTick: number;
  zoomCommandTick: number;
}) {
  const map = useMap();
  const initializedRef = useRef(false);
  const lastCameraTickRef = useRef(cameraCommandTick);
  const lastZoomTickRef = useRef(zoomCommandTick);

  useEffect(() => {
    if (!map) return;

    if (!initializedRef.current) {
      initializedRef.current = true;
      map.setCenter(targetCenter);
      map.setZoom(targetZoom);
      lastCameraTickRef.current = cameraCommandTick;
      lastZoomTickRef.current = zoomCommandTick;
      return;
    }

    if (lastCameraTickRef.current !== cameraCommandTick) {
      lastCameraTickRef.current = cameraCommandTick;
      map.panTo(targetCenter);
      if (map.getZoom() !== targetZoom) {
        map.setZoom(targetZoom);
      }
      lastZoomTickRef.current = zoomCommandTick;
      return;
    }

    if (lastZoomTickRef.current !== zoomCommandTick) {
      lastZoomTickRef.current = zoomCommandTick;
      if (map.getZoom() !== targetZoom) {
        map.setZoom(targetZoom);
      }
    }
  }, [map, targetCenter, targetZoom, cameraCommandTick, zoomCommandTick]);

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

/**
 * Interactive visual map fallback with live Google Map background, multi-pointer touch pan &
 * two-finger pinch-zoom, tap-to-place & draggable Red Pin, and haptic confirmation.
 */
function InteractiveFallbackMapSurface({
  center,
  pinPos,
  zoom,
  onZoomChange,
  onPanCenter,
  onRecenterPin,
  onPinMove,
}: {
  center: LatLng;
  pinPos: LatLng;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onPanCenter: (lat: number, lng: number) => void;
  onRecenterPin: () => void;
  onPinMove: (lat: number, lng: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pointersRef = useRef<Record<number, { x: number; y: number }>>({});
  const gestureRef = useRef<{
    mode: "idle" | "pending" | "drag_pin" | "pan_map" | "pinch";
    startX: number;
    startY: number;
    startPinchDist: number;
    startZoom: number;
  }>({
    mode: "idle",
    startX: 0,
    startY: 0,
    startPinchDist: 0,
    startZoom: zoom,
  });
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const panOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const zoomFactor = Math.pow(2, 15 - zoom);
  const latSpan = 0.016 * zoomFactor;
  const lngSpan = 0.026 * zoomFactor;

  const pinPercentX = Math.max(
    6,
    Math.min(94, 50 + ((pinPos.lng - center.lng) / lngSpan) * 100)
  );
  const pinPercentY = Math.max(
    8,
    Math.min(92, 50 - ((pinPos.lat - center.lat) / latSpan) * 100)
  );

  const clientToLatLng = (clientX: number, clientY: number): LatLng | null => {
    const el = containerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const relX = Math.max(0.03, Math.min(0.97, (clientX - rect.left) / rect.width));
    const relY = Math.max(0.03, Math.min(0.97, (clientY - rect.top) / rect.height));
    return {
      lat: center.lat + (0.5 - relY) * latSpan,
      lng: center.lng + (relX - 0.5) * lngSpan,
    };
  };

  const isNearPin = (clientX: number, clientY: number): boolean => {
    const el = containerRef.current;
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const pinPxX = rect.left + (pinPercentX / 100) * rect.width;
    const pinPxY = rect.top + (pinPercentY / 100) * rect.height - 20;
    return Math.hypot(clientX - pinPxX, clientY - pinPxY) <= 40;
  };

  const activePointerList = () => Object.values(pointersRef.current);

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    pointersRef.current[e.pointerId] = { x: e.clientX, y: e.clientY };

    const pts = activePointerList();
    if (pts.length >= 2) {
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      gestureRef.current = {
        mode: "pinch",
        startX: (pts[0].x + pts[1].x) / 2,
        startY: (pts[0].y + pts[1].y) / 2,
        startPinchDist: Math.max(20, dist),
        startZoom: zoom,
      };
      return;
    }

    panOffsetRef.current = { x: 0, y: 0 };
    setPanOffset({ x: 0, y: 0 });
    gestureRef.current = {
      mode: isNearPin(e.clientX, e.clientY) ? "drag_pin" : "pending",
      startX: e.clientX,
      startY: e.clientY,
      startPinchDist: 0,
      startZoom: zoom,
    };
    if (gestureRef.current.mode === "drag_pin") {
      triggerHapticFeedback(25);
    }
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!(e.pointerId in pointersRef.current)) return;
    pointersRef.current[e.pointerId] = { x: e.clientX, y: e.clientY };

    const pts = activePointerList();
    if (pts.length >= 2 && gestureRef.current.mode === "pinch") {
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const scale = dist / gestureRef.current.startPinchDist;
      const zoomDelta = Math.round(Math.log2(Math.max(0.25, Math.min(4, scale))));
      const nextZoom = Math.max(
        MIN_PIN_ZOOM,
        Math.min(MAX_PIN_ZOOM, gestureRef.current.startZoom + zoomDelta)
      );
      if (nextZoom !== zoom) {
        onZoomChange(nextZoom);
      }
      return;
    }

    const g = gestureRef.current;
    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;

    if (g.mode === "drag_pin") {
      const nextPos = clientToLatLng(e.clientX, e.clientY);
      if (nextPos) onPinMove(nextPos.lat, nextPos.lng);
      return;
    }

    if (g.mode === "pending" && Math.hypot(dx, dy) > 9) {
      g.mode = "pan_map";
    }

    if (g.mode === "pan_map") {
      panOffsetRef.current = { x: dx, y: dy };
      setPanOffset({ x: dx, y: dy });
    }
  };

  const finishGesture = (e: ReactPointerEvent<HTMLDivElement>) => {
    const wasMode = gestureRef.current.mode;
    delete pointersRef.current[e.pointerId];
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore release errors
    }

    const remaining = activePointerList();
    if (remaining.length > 0) {
      return;
    }

    if (wasMode === "pending") {
      const tapped = clientToLatLng(e.clientX, e.clientY);
      if (tapped) {
        triggerHapticFeedback(40);
        onPinMove(tapped.lat, tapped.lng);
      }
    } else if (wasMode === "pan_map") {
      const el = containerRef.current;
      const offset = panOffsetRef.current;
      if (el && (Math.abs(offset.x) > 4 || Math.abs(offset.y) > 4)) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const dLng = -(offset.x / rect.width) * lngSpan;
          const dLat = (offset.y / rect.height) * latSpan;
          onPanCenter(center.lat + dLat, center.lng + dLng);
        }
      }
    }

    panOffsetRef.current = { x: 0, y: 0 };
    setPanOffset({ x: 0, y: 0 });
    gestureRef.current.mode = "idle";
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 1 : -1;
      onZoomChange(Math.max(MIN_PIN_ZOOM, Math.min(MAX_PIN_ZOOM, zoom + delta)));
    };
    el.addEventListener("wheel", handleNativeWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleNativeWheel);
  }, [zoom, onZoomChange]);

  const embedUrl = `https://maps.google.com/maps?q=${center.lat},${center.lng}&z=${Math.round(
    zoom
  )}&hl=de&output=embed`;

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishGesture}
      onPointerCancel={finishGesture}
      role="application"
      aria-label="Interaktive Karte – Karte verschieben, tippen oder roten Pin ziehen"
      className="relative h-[200px] min-[380px]:h-[245px] sm:h-[320px] [@media(max-height:500px)]:h-[165px] w-full overflow-hidden rounded-2xl border border-primary/15 dark:border-white/15 bg-slate-100 dark:bg-slate-800 select-none cursor-grab active:cursor-grabbing touch-none"
    >
      <div
        style={{
          transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0)`,
        }}
        className="relative h-full w-full will-change-transform"
      >
        <iframe
          title="Google Maps Kartenansicht"
          src={embedUrl}
          className="pointer-events-none h-full w-full border-0"
          loading="eager"
          referrerPolicy="no-referrer-when-downgrade"
        />

        {/* Interactive Draggable Red Pin Overlay */}
        <div
          style={{
            left: `${pinPercentX}%`,
            top: `${pinPercentY}%`,
          }}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full transition-[left,top] duration-75"
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

      {/* Subtle Center Reference Crosshair during Pan */}
      {(Math.abs(panOffset.x) > 4 || Math.abs(panOffset.y) > 4) && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 border-sky-600/80 bg-white/75"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-sky-600" />
        </div>
      )}

      {/* Floating Touch Instructions Badge */}
      <div className="pointer-events-none absolute top-2.5 left-2.5 max-w-[calc(100%-150px)] z-10 inline-flex items-center gap-1.5 rounded-xl bg-slate-900/85 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-md backdrop-blur-xs">
        <MapPin size={12} className="text-red-500 shrink-0" aria-hidden="true" />
        <span className="truncate">
          <span className="min-[380px]:hidden">Tippen / schieben</span>
          <span className="hidden min-[380px]:inline">Ziehen, schieben oder tippen</span>
        </span>
      </div>

      {/* Bottom-Left One-Tap Drop Pin at Map Center */}
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          triggerHapticFeedback(40);
          onPinMove(center.lat, center.lng);
        }}
        data-testid="pin-modal-mark-center-btn"
        className="absolute bottom-2.5 left-2.5 z-20 inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-primary/15 dark:border-white/15 bg-white/95 dark:bg-slate-900/95 px-2.5 py-1.5 text-[11px] font-extrabold text-primary dark:text-slate-100 shadow-md hover:border-red-500/60 active:scale-95 transition-all cursor-pointer touch-manipulation"
      >
        <Target size={14} className="text-red-600 shrink-0" aria-hidden="true" />
        <span>Mitte markieren</span>
      </button>

      {/* Floating Touch Zoom + Recenter Controls */}
      <div className="absolute bottom-2.5 right-2.5 z-20 flex flex-col gap-1.5 shadow-md">
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            triggerHapticFeedback(20);
            onRecenterPin();
          }}
          aria-label="Auf Pin zentrieren"
          title="Auf Pin zentrieren"
          className="flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-xl bg-white/95 dark:bg-slate-900/95 text-primary dark:text-slate-100 border border-primary/15 dark:border-white/15 hover:border-accent active:scale-95 transition-all shadow-xs cursor-pointer touch-manipulation"
        >
          <Crosshair size={15} />
        </button>
        <div className="flex flex-col overflow-hidden rounded-xl border border-primary/15 dark:border-white/15 bg-white/95 dark:bg-slate-900/95">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              triggerHapticFeedback(25);
              onZoomChange(Math.min(MAX_PIN_ZOOM, zoom + 1));
            }}
            aria-label="Karte heranzoomen"
            className="flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center text-primary dark:text-slate-100 hover:bg-primary/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer touch-manipulation"
          >
            <Plus size={16} />
          </button>
          <div className="h-px w-full bg-primary/10 dark:bg-white/12" aria-hidden="true" />
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              triggerHapticFeedback(25);
              onZoomChange(Math.max(MIN_PIN_ZOOM, zoom - 1));
            }}
            aria-label="Karte herauszoomen"
            className="flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center text-primary dark:text-slate-100 hover:bg-primary/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer touch-manipulation"
          >
            <Minus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function InteractiveGoogleMapCanvas({
  targetCenter,
  targetZoom,
  cameraCommandTick,
  zoomCommandTick,
  pinPos,
  onZoomButtonChange,
  onPanCenter,
  onRecenterPin,
  onLiveZoomTrack,
  onPinMove,
}: {
  targetCenter: LatLng;
  targetZoom: number;
  cameraCommandTick: number;
  zoomCommandTick: number;
  pinPos: LatLng;
  onZoomButtonChange: (nextZoom: number) => void;
  onPanCenter: (lat: number, lng: number) => void;
  onRecenterPin: () => void;
  onLiveZoomTrack: (zoom: number) => void;
  onPinMove: (lat: number, lng: number) => void;
}) {
  const loadingStatus = useApiLoadingStatus();
  const [sdkTimedOut, setSdkTimedOut] = useState(false);
  const liveViewportCenterRef = useRef<LatLng>(targetCenter);

  useEffect(() => {
    liveViewportCenterRef.current = targetCenter;
  }, [targetCenter]);

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
    }, PIN_MAP_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [loadingStatus]);

  if (
    loadingStatus === APILoadingStatus.AUTH_FAILURE ||
    loadingStatus === APILoadingStatus.FAILED ||
    (sdkTimedOut && loadingStatus !== APILoadingStatus.LOADED)
  ) {
    return (
      <InteractiveFallbackMapSurface
        center={targetCenter}
        pinPos={pinPos}
        zoom={targetZoom}
        onZoomChange={onZoomButtonChange}
        onPanCenter={onPanCenter}
        onRecenterPin={onRecenterPin}
        onPinMove={onPinMove}
      />
    );
  }

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="relative h-[200px] min-[380px]:h-[245px] sm:h-[320px] [@media(max-height:500px)]:h-[165px] w-full overflow-hidden rounded-2xl border border-primary/15 dark:border-white/15 bg-slate-100 dark:bg-slate-800"
    >
      {loadingStatus === APILoadingStatus.LOADING && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-slate-100/75 dark:bg-slate-900/75 backdrop-blur-[1px]">
          <div className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-primary dark:text-slate-100 shadow-md border border-primary/10 dark:border-white/10">
            <Loader2 size={15} className="animate-spin text-accent" />
            <span>Karte wird geladen…</span>
          </div>
        </div>
      )}

      {/* Floating Touch Instructions Badge (Left-constrained to avoid GPS button overlap on 320px screens) */}
      <div className="pointer-events-none absolute top-2.5 left-2.5 max-w-[calc(100%-150px)] z-20 inline-flex items-center gap-1.5 rounded-xl bg-slate-900/85 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-md backdrop-blur-xs">
        <MapPin size={12} className="text-red-500 shrink-0" aria-hidden="true" />
        <span className="truncate">
          <span className="min-[380px]:hidden">Tippen / ziehen</span>
          <span className="hidden min-[380px]:inline">Tippen, ziehen oder schieben</span>
        </span>
      </div>

      {/* Bottom-Left One-Tap Drop Pin at Map Center for One-Handed Thumb Precision */}
      <button
        type="button"
        onClick={() => {
          triggerHapticFeedback(40);
          const c = liveViewportCenterRef.current;
          onPinMove(c.lat, c.lng);
        }}
        data-testid="pin-modal-mark-center-btn"
        className="absolute bottom-2.5 left-2.5 z-20 inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-primary/15 dark:border-white/15 bg-white/95 dark:bg-slate-900/95 px-2.5 py-1.5 text-[11px] font-extrabold text-primary dark:text-slate-100 shadow-md hover:border-red-500/60 active:scale-95 transition-all cursor-pointer touch-manipulation"
      >
        <Target size={14} className="text-red-600 shrink-0" aria-hidden="true" />
        <span>Mitte markieren</span>
      </button>

      {/* Floating Recenter + Touch Zoom Controls (Bottom-Right) */}
      <div className="absolute bottom-2.5 right-2.5 z-20 flex flex-col gap-1.5 shadow-md">
        <button
          type="button"
          onClick={() => {
            triggerHapticFeedback(20);
            onRecenterPin();
          }}
          aria-label="Auf Pin zentrieren"
          title="Auf roten Pin zentrieren"
          className="flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-xl bg-white/95 dark:bg-slate-900/95 text-primary dark:text-slate-100 border border-primary/15 dark:border-white/15 hover:border-accent active:scale-95 transition-all shadow-xs cursor-pointer touch-manipulation"
        >
          <Crosshair size={15} />
        </button>

        <div className="flex flex-col overflow-hidden rounded-xl border border-primary/15 dark:border-white/15 bg-white/95 dark:bg-slate-900/95">
          <button
            type="button"
            onClick={() => {
              triggerHapticFeedback(25);
              onZoomButtonChange(Math.min(targetZoom + 1, MAX_PIN_ZOOM));
            }}
            disabled={targetZoom >= MAX_PIN_ZOOM}
            aria-label="Karte heranzoomen"
            className="flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center text-primary dark:text-slate-100 hover:bg-primary/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer touch-manipulation disabled:opacity-40"
          >
            <Plus size={16} />
          </button>
          <div className="h-px w-full bg-primary/10 dark:bg-white/12" aria-hidden="true" />
          <button
            type="button"
            onClick={() => {
              triggerHapticFeedback(25);
              onZoomButtonChange(Math.max(targetZoom - 1, MIN_PIN_ZOOM));
            }}
            disabled={targetZoom <= MIN_PIN_ZOOM}
            aria-label="Karte herauszoomen"
            className="flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center text-primary dark:text-slate-100 hover:bg-primary/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer touch-manipulation disabled:opacity-40"
          >
            <Minus size={16} />
          </button>
        </div>
      </div>

      <GoogleMap
        mapId="DEMO_MAP_ID"
        internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
        defaultCenter={targetCenter}
        defaultZoom={targetZoom}
        minZoom={MIN_PIN_ZOOM}
        maxZoom={MAX_PIN_ZOOM}
        gestureHandling="greedy"
        clickableIcons={false}
        streetViewControl={false}
        mapTypeControl={false}
        fullscreenControl={false}
        zoomControl={false}
        onIdle={(ev) => {
          const c = ev.map.getCenter();
          if (c) {
            liveViewportCenterRef.current = {
              lat: c.lat(),
              lng: c.lng(),
            };
          }
        }}
        onZoomChanged={(ev) => {
          const z = ev.map.getZoom();
          if (typeof z === "number" && Number.isFinite(z)) {
            onLiveZoomTrack(Math.max(MIN_PIN_ZOOM, Math.min(MAX_PIN_ZOOM, Math.round(z))));
          }
        }}
        onClick={(ev: MapMouseEvent) => {
          if (ev.detail.latLng) {
            triggerHapticFeedback(40);
            onPinMove(ev.detail.latLng.lat, ev.detail.latLng.lng);
          }
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <PinModalCameraSync
          targetCenter={targetCenter}
          targetZoom={targetZoom}
          cameraCommandTick={cameraCommandTick}
          zoomCommandTick={zoomCommandTick}
        />

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
  const { detectMyPlace, setDetectedPlace } = useUserPlace();
  const [mounted, setMounted] = useState(false);
  const initialData = resolveInitialPosition(initialLat, initialLng, initialZip);
  const [targetCenter, setTargetCenter] = useState<LatLng>(initialData.pos);
  const [targetZoom, setTargetZoom] = useState<number>(14);
  const [cameraCommandTick, setCameraCommandTick] = useState(0);
  const [zoomCommandTick, setZoomCommandTick] = useState(0);
  const [pinPos, setPinPos] = useState<LatLng>(initialData.pos);
  const [resolvedStreet, setResolvedStreet] = useState(initialStreet || "");
  const [resolvedZip, setResolvedZip] = useState(initialData.defaultZip);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingPlace, setIsSearchingPlace] = useState(false);
  const [gpsLocating, setGpsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const lookupSeqRef = useRef(0);
  const prefersReducedMotion = useReducedMotion();
  const dragControls = useDragControls();

  const handleSheetDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.y > 90 || info.velocity.y > 420) {
      hapticDismiss();
      onClose();
    }
  };

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

    setTargetCenter(init.pos);
    setTargetZoom(hasCoords ? 15 : 13);
    setCameraCommandTick((t) => t + 1);
    setPinPos(init.pos);
    setResolvedStreet(initialStreet?.trim() || "");
    setResolvedZip(init.defaultZip);
    setSearchQuery("");
    setIsSearchingPlace(false);
    setGpsLocating(false);
    setGpsError(null);

    if (hasCoords && !initialStreet?.trim()) {
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

  const handleSearchPlace = async () => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setGpsError("Bitte Ort, PLZ oder Straße eingeben.");
      return;
    }
    setIsSearchingPlace(true);
    setGpsError(null);
    try {
      const result = await geocodePlaceQuery(q);
      if (!result.ok) {
        setGpsError(
          result.error ||
            "Adresse oder Ort nicht gefunden. Bitte Eingabe prüfen oder direkt auf die Karte tippen."
        );
        return;
      }
      const found = result.location;
      const next = {
        lat: Number(found.lat.toFixed(6)),
        lng: Number(found.lng.toFixed(6)),
      };
      lookupSeqRef.current += 1;
      setPinPos(next);
      setTargetCenter(next);
      setTargetZoom(found.streetAddress ? 16 : 14);
      setCameraCommandTick((t) => t + 1);
      setResolvedStreet(found.streetAddress);
      if (found.zipAndCity) {
        setResolvedZip(found.zipAndCity);
      }
      triggerHapticFeedback(40);
    } finally {
      setIsSearchingPlace(false);
    }
  };

  const handleLocateMe = async () => {
    setGpsLocating(true);
    setGpsError(null);
    const outcome = await detectMyPlace();

    if (!outcome.ok) {
      setGpsLocating(false);
      setGpsError(outcome.message);
      return;
    }

    const detected = outcome.place;
    const next = {
      lat: Number(detected.lat.toFixed(6)),
      lng: Number(detected.lng.toFixed(6)),
    };
    lookupSeqRef.current += 1;
    setPinPos(next);
    setTargetCenter(next);
    setTargetZoom(16);
    setCameraCommandTick((t) => t + 1);
    setResolvedStreet(detected.streetAddress);
    if (detected.zipAndCity) {
      setResolvedZip(detected.zipAndCity);
    }
    setGpsLocating(false);
    triggerHapticFeedback(50);
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
    setDetectedPlace(verified);
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
            drag={prefersReducedMotion ? false : "y"}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.04, bottom: 0.9 }}
            onDragEnd={handleSheetDragEnd}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex max-h-[94dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl border border-primary/15 dark:border-white/15 bg-white dark:bg-slate-900 shadow-2xl will-change-transform"
          >
            {/* Clean Compact Header + Mobile Swipe Handle */}
            <div
              onPointerDown={(e) => {
                if (!prefersReducedMotion) {
                  dragControls.start(e);
                }
              }}
              className="border-b border-primary/10 dark:border-white/10 bg-primary-dark px-3.5 sm:px-5 pt-2 pb-2.5 sm:py-3.5 text-white touch-none sm:touch-auto select-none cursor-grab active:cursor-grabbing sm:cursor-default shrink-0"
            >
              <div className="mx-auto mb-1.5 h-1 w-10 rounded-full bg-white/25 sm:hidden" aria-hidden="true" />
              <div className="flex items-center justify-between gap-2.5 sm:gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-xs">
                    <MapPin size={17} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold leading-tight truncate">
                      Standort auf Karte wählen
                    </h3>
                    <p className="hidden min-[380px]:block text-[11px] text-white/70 truncate">
                      Karte antippen oder roten Pin ziehen &amp; mit „OK“ bestätigen
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={onClose}
                  aria-label="Kartenauswahl schließen"
                  className="flex h-10 w-10 sm:h-11 sm:w-11 min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/80 hover:bg-white/20 hover:text-white active:scale-95 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="overflow-y-auto overscroll-contain p-3 sm:p-4 space-y-2.5 sm:space-y-3">
              {/* Place / Address Search Bar (avoids nested form submission across React portals) */}
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1 min-w-0">
                  <Search
                    size={15}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (gpsError) setGpsError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.stopPropagation();
                        void handleSearchPlace();
                      }
                    }}
                    placeholder="Ort, PLZ oder Straße suchen (z. B. Wallenhorst)…"
                    aria-label="Ort, PLZ oder Straße suchen"
                    className="w-full min-h-[42px] rounded-xl border border-primary/15 dark:border-white/15 bg-surface dark:bg-slate-800 pl-9 pr-3 py-2 text-[16px] sm:text-sm font-medium text-primary dark:text-slate-100 placeholder:text-ink-faint focus:border-accent focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback(25);
                    void handleSearchPlace();
                  }}
                  disabled={isSearchingPlace}
                  className="inline-flex min-h-[42px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-primary/15 dark:border-white/15 bg-primary dark:bg-accent px-3.5 py-2 text-xs font-extrabold text-white shadow-xs hover:opacity-95 active:scale-95 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isSearchingPlace ? (
                    <Loader2 size={14} className="animate-spin shrink-0" />
                  ) : (
                    <Search size={14} className="shrink-0" />
                  )}
                  <span>Suchen</span>
                </button>
              </div>

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
                      targetCenter={targetCenter}
                      targetZoom={targetZoom}
                      cameraCommandTick={cameraCommandTick}
                      zoomCommandTick={zoomCommandTick}
                      pinPos={pinPos}
                      onZoomButtonChange={(nextZoom) => {
                        setTargetZoom(nextZoom);
                        setZoomCommandTick((t) => t + 1);
                      }}
                      onPanCenter={(lat, lng) => {
                        setTargetCenter({ lat, lng });
                      }}
                      onRecenterPin={() => {
                        setTargetCenter(pinPos);
                        setTargetZoom((z) => Math.max(15, z));
                        setCameraCommandTick((t) => t + 1);
                      }}
                      onLiveZoomTrack={setTargetZoom}
                      onPinMove={handlePinMove}
                    />
                  </APIProvider>
                ) : (
                  <InteractiveFallbackMapSurface
                    center={targetCenter}
                    pinPos={pinPos}
                    zoom={targetZoom}
                    onZoomChange={(newZoom) => {
                      setTargetZoom(newZoom);
                      setZoomCommandTick((t) => t + 1);
                    }}
                    onPanCenter={(lat, lng) => {
                      setTargetCenter({
                        lat: Number(lat.toFixed(6)),
                        lng: Number(lng.toFixed(6)),
                      });
                    }}
                    onRecenterPin={() => {
                      setTargetCenter(pinPos);
                      setCameraCommandTick((t) => t + 1);
                    }}
                    onPinMove={handlePinMove}
                  />
                )}

                <button
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback(30);
                    void handleLocateMe();
                  }}
                  disabled={gpsLocating}
                  className="absolute top-2.5 right-2.5 z-20 inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-extrabold text-primary dark:text-slate-100 shadow-md border border-primary/10 dark:border-white/15 hover:border-accent active:scale-95 transition-all disabled:opacity-60 cursor-pointer whitespace-nowrap"
                >
                  {gpsLocating ? (
                    <Loader2 size={13} className="animate-spin text-accent shrink-0" />
                  ) : (
                    <Navigation size={13} className="text-accent shrink-0" />
                  )}
                  <span>{gpsLocating ? "Suche…" : "Mein Standort"}</span>
                </button>
              </div>

              {gpsError && (
                <div
                  role="status"
                  className="flex items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] font-semibold text-amber-800 dark:text-amber-200"
                >
                  <span>{gpsError}</span>
                  <button
                    type="button"
                    onClick={() => setGpsError(null)}
                    aria-label="Hinweis schließen"
                    className="p-0.5 hover:opacity-75 cursor-pointer shrink-0"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              {/* Compact Address Confirmation Inputs with 16px iOS zoom prevention */}
              <div className="grid gap-2 sm:gap-2.5 sm:grid-cols-2">
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
                    className="w-full min-h-[42px] rounded-xl border border-primary/15 dark:border-white/15 bg-surface dark:bg-slate-800 px-3 py-2 text-[16px] sm:text-sm font-medium text-primary dark:text-slate-100 focus:border-accent focus:outline-none"
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
                    className="w-full min-h-[42px] rounded-xl border border-primary/15 dark:border-white/15 bg-surface dark:bg-slate-800 px-3 py-2 text-[16px] sm:text-sm font-medium text-primary dark:text-slate-100 focus:border-accent focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer with full-width mobile touch confirm button */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 border-t border-primary/10 dark:border-white/10 bg-surface dark:bg-slate-950/60 px-3.5 sm:px-4 py-2.5 sm:py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto inline-flex min-h-[42px] sm:min-h-[44px] items-center justify-center rounded-xl border border-primary/15 dark:border-white/15 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-bold text-ink-muted hover:text-primary dark:hover:text-slate-100 transition-colors cursor-pointer"
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
                className="w-full sm:w-auto inline-flex min-h-[46px] sm:min-h-[48px] items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-6 py-2.5 text-sm font-extrabold text-white shadow-md shadow-red-600/25 transition-all active:scale-[0.98] cursor-pointer"
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
