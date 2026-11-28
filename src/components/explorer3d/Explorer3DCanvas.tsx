"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import {
  getApplianceMeta,
  type BuiltApplianceAssembly,
  type BuiltSparePart,
  type ExplorerApplianceId,
  type StudioBuilderContext,
} from "./types";
import {
  createBrushedSteelTexture,
  createContactShadowTexture,
  createMaterialLibrary,
  createTurntablePedestal,
  detectSoftwareWebGL,
  EXPLORER_BG_FRAG,
  EXPLORER_BG_VERT,
} from "./studioCore";
import { buildWasherAssembly } from "./buildWasher";
import { buildDishwasherAssembly } from "./buildDishwasher";
import { buildOvenAssembly } from "./buildOven";
import { buildFridgeAssembly } from "./buildFridge";
import { buildTrocknerAssembly } from "./buildTrockner";
import { buildCoffeeMachineAssembly } from "./buildCoffeeMachine";

export interface Explorer3DCanvasProps {
  applianceId: ExplorerApplianceId;
  explode: number; // 0..1
  selectedPartId: string | null;
  secondaryPartIds?: string[];
  xrayMode?: boolean;
  cameraPreset: { mode: "overview" | "interior" | "reset"; seq: number };
  zoomAction?: { dir: "in" | "out"; seq: number };
  prefersReducedMotion: boolean;
  onSelectPart: (partId: string | null) => void;
  onUserInteract?: () => void;
}

// Pre-allocated scratch math objects (zero per-frame GC allocations)
const _raycaster = new THREE.Raycaster();
const _pointerNdc = new THREE.Vector2();
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _projVec = new THREE.Vector3();
const _emissiveTarget = new THREE.Color();
const _selectedColor = new THREE.Color(0x10b981);
const _secondaryColor = new THREE.Color(0xf59e0b);
const _hoverColor = new THREE.Color(0x38bdf8);
const _fallbackBaseEmissive = new THREE.Color(0x000000);

// Touch hit-forgiveness offsets (pixels) so fingers reliably tap slender internal parts
const TOUCH_HIT_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [0, -16],
  [16, 0],
  [0, 16],
  [-16, 0],
  [12, -12],
  [12, 12],
  [-12, 12],
  [-12, -12],
];

// Default camera spherical angles (3/4 studio hero view)
const DEFAULT_THETA = 0.56;
const DEFAULT_PHI = 1.24;
const CAMERA_FOV_DEG = 35;
const TAN_HALF_VFOV = Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV_DEG) * 0.5);
const MIN_PHI = 0.34; // High bird's-eye view without gimbal flip
const BASE_MAX_PHI = 1.62; // Gentle low-angle hero view, NEVER diving under the studio floor
const FLOOR_CLEARANCE_Y = -0.88; // Strictly above turntable (-1.168) and contact shadow (-1.182)
const TWO_PI = Math.PI * 2;

interface ApplianceBounds {
  hx0: number;
  hy0: number;
  hx1: number;
  hy1: number;
  yCenter0: number;
  yCenter1: number;
  minRadiusBase: number;
}

const APPLIANCE_BOUNDS: Record<ExplorerApplianceId, ApplianceBounds> = {
  waschmaschine: {
    hx0: 0.88,
    hy0: 1.02,
    hx1: 1.66,
    hy1: 1.26,
    yCenter0: -0.02,
    yCenter1: 0.01,
    minRadiusBase: 2.65,
  },
  geschirrspueler: {
    hx0: 0.88,
    hy0: 1.02,
    hx1: 1.72,
    hy1: 1.28,
    yCenter0: -0.02,
    yCenter1: 0.02,
    minRadiusBase: 2.7,
  },
  backofen: {
    hx0: 0.92,
    hy0: 1.04,
    hx1: 1.66,
    hy1: 1.5,
    yCenter0: 0.02,
    yCenter1: 0.14,
    minRadiusBase: 2.75,
  },
  kuehlschrank: {
    hx0: 0.84,
    hy0: 1.2,
    hx1: 1.66,
    hy1: 1.4,
    yCenter0: 0.0,
    yCenter1: 0.04,
    minRadiusBase: 2.85,
  },
  trockner: {
    hx0: 0.88,
    hy0: 1.02,
    hx1: 1.68,
    hy1: 1.28,
    yCenter0: -0.02,
    yCenter1: 0.02,
    minRadiusBase: 2.68,
  },
  kaffeevollautomat: {
    hx0: 0.76,
    hy0: 0.96,
    hx1: 1.58,
    hy1: 1.34,
    yCenter0: -0.02,
    yCenter1: 0.04,
    minRadiusBase: 2.45,
  },
};

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Wraps target azimuth to the shortest angular path (< 180°) from current azimuth
 * so camera focus/reset transitions never spin backwards multiple full turns.
 */
function nearestAngle(current: number, target: number): number {
  const diff = ((((target - current + Math.PI) % TWO_PI) + TWO_PI) % TWO_PI) - Math.PI;
  return current + diff;
}

/**
 * Computes maximum safe polar angle (phi) so the camera NEVER passes beneath
 * the studio floor plane at any radius or focused part height.
 */
function computeSafeMaxPhi(lookAtY: number, radius: number): number {
  const safeCos = clamp(
    (FLOOR_CLEARANCE_Y - lookAtY) / Math.max(radius, 1.4),
    -0.95,
    0.45,
  );
  return Math.min(BASE_MAX_PHI, Math.acos(safeCos));
}

/**
 * Projective frustum-aware camera distance calculator so NO appliance or exploded
 * spare part clips on any viewport size (320px portrait through 2560px ultrawide).
 */
function computeResponsiveRadius(
  aspect: number,
  viewportW: number,
  applianceId: ExplorerApplianceId,
  explode: number,
): number {
  const b = APPLIANCE_BOUNDS[applianceId];
  const ex = clamp(explode, 0, 1);
  const hx = THREE.MathUtils.lerp(b.hx0, b.hx1, ex);
  const hy = THREE.MathUtils.lerp(b.hy0, b.hy1, ex);

  const safeAspect = Math.max(aspect, 0.56);
  const tanHalfH = TAN_HALF_VFOV * safeAspect;

  // Comfortable breathing room around the model on every viewport ratio
  const fillH = viewportW >= 1024 ? 0.76 : 0.82;
  const fillW = viewportW < 640 ? 0.84 : 0.8;

  const zPadV = 0.38 + ex * 0.2;
  const zPadH = 0.48 + ex * 0.26;

  const distV = hy / (TAN_HALF_VFOV * fillH) + zPadV;
  const distH = hx / (tanHalfH * fillW) + zPadH;

  return clamp(Math.max(distV, distH), 3.75, 8.8);
}

interface ProjectedPinSlot {
  el: HTMLButtonElement | null;
  x: number;
  y: number;
  w: number;
  h: number;
  fade: number;
  visible: boolean;
  lastEl: HTMLButtonElement | null;
  lastX: number;
  lastY: number;
  lastFade: number;
  lastVisible: boolean;
}

const MAX_PIN_SLOTS = 10;

export default function Explorer3DCanvas({
  applianceId,
  explode,
  selectedPartId,
  secondaryPartIds = [],
  xrayMode = false,
  cameraPreset,
  zoomAction,
  prefersReducedMotion,
  onSelectPart,
  onUserInteract,
}: Explorer3DCanvasProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const pinRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const [webglUnavailable, setWebglUnavailable] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [hoveredPartId, setHoveredPartId] = useState<string | null>(null);

  // Latest React props mirrored into refs for zero-reinit rAF reading
  const propsRef = useRef({
    applianceId,
    explode,
    selectedPartId,
    secondaryPartIds,
    xrayMode,
    prefersReducedMotion,
    onSelectPart,
    onUserInteract,
  });
  propsRef.current = {
    applianceId,
    explode,
    selectedPartId,
    secondaryPartIds,
    xrayMode,
    prefersReducedMotion,
    onSelectPart,
    onUserInteract,
  };

  // Camera & wake control ref so React effects & keyboard handlers can trigger smooth transitions
  const cameraCmdRef = useRef<{
    applyPreset: (mode: "overview" | "interior" | "reset") => void;
    focusPart: (partId: string | null) => void;
    switchAppliance: (id: ExplorerApplianceId) => void;
    zoomBy: (factor: number) => void;
    nudgeOrbit: (dTheta: number, dPhi: number) => void;
    wake: () => void;
  } | null>(null);

  const activeMeta = getApplianceMeta(applianceId);

  useEffect(() => {
    const outerEl = outerRef.current;
    const mountEl = canvasMountRef.current;
    if (!outerEl || !mountEl) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const isCoarsePointer = () =>
      window.matchMedia?.("(pointer: coarse)").matches ?? false;
    // Mobile touch GPU sweet spot: 1.25x DPR on phones keeps edges crisp while cutting fragment fill-rate
    const getDprCap = () => {
      if (isSoftwareGl) return 1;
      if (window.innerWidth < 640 && isCoarsePointer()) return 1.25;
      if (isCoarsePointer() || window.innerWidth < 768) return 1.4;
      return 2;
    };

    // Track every GPU resource for deterministic cleanup
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];

    const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
      geometries.push(g);
      return g;
    };
    const trackMat = <T extends THREE.Material>(m: T): T => {
      materials.push(m);
      return m;
    };
    const trackTex = <T extends THREE.Texture>(t: T): T => {
      textures.push(t);
      return t;
    };

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: false,
        powerPreference: isCoarsePointer() ? "default" : "high-performance",
        stencil: false,
        depth: true,
      });
    } catch {
      setWebglUnavailable(true);
      return;
    }

    // Synchronous shader-error checks stall the main thread on mobile.
    renderer.debug.checkShaderErrors = import.meta.env.DEV;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, getDprCap()));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.07;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.autoClear = false;
    renderer.shadowMap.enabled =
      !isSoftwareGl && !isCoarsePointer() && window.innerWidth >= 768;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const domEl = renderer.domElement;
    domEl.style.display = "block";
    domEl.style.width = "100%";
    domEl.style.height = "100%";
    // Full-freedom 360° + elevation touch orbit & 2-finger pinch directly on the 3D stage
    // (the page around the viewport retains 100% native vertical scrolling).
    domEl.style.touchAction = "none";
    domEl.style.setProperty("-webkit-tap-highlight-color", "transparent");
    domEl.style.userSelect = "none";
    domEl.style.cursor = "grab";
    domEl.setAttribute("aria-hidden", "true");
    mountEl.appendChild(domEl);

    // ── Pass 0: Dual-Theme GLSL Studio Cyclorama & Radial Floor Rings ──
    const bgScene = new THREE.Scene();
    const bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const bgUniforms = {
      uTime: { value: 0 },
      uDarkMix: {
        value: document.documentElement.classList.contains("dark") ? 1 : 0,
      },
      uExplode: { value: propsRef.current.explode },
      uResolution: { value: new THREE.Vector2(1, 1) },
    };
    const bgMat = trackMat(
      new THREE.ShaderMaterial({
        vertexShader: EXPLORER_BG_VERT,
        fragmentShader: EXPLORER_BG_FRAG,
        uniforms: bgUniforms,
        depthTest: false,
        depthWrite: false,
      }),
    );
    const bgMesh = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(2, 2)), bgMat);
    bgScene.add(bgMesh);

    // ── Pass 1: Main 3D Studio Scene ──
    const scene = new THREE.Scene();

    // Procedural RoomEnvironment (100% local, zero external HDRI fetch)
    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmrem.fromScene(roomEnv, 0.04);
    roomEnv.dispose();
    scene.environment = envTarget.texture;

    const camera = new THREE.PerspectiveCamera(CAMERA_FOV_DEG, 1, 0.12, 48);
    camera.layers.enable(0);
    camera.layers.enable(1);
    _raycaster.layers.set(1);

    // ── Studio Lighting (ZERO RectAreaLight — fast & sculpted on mobile + desktop) ──
    const hemiLight = new THREE.HemisphereLight(0xf0f9ff, 0x1e293b, 0.88);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.55);
    keyLight.position.set(4.1, 5.6, 4.5);
    keyLight.castShadow = renderer.shadowMap.enabled;
    if (renderer.shadowMap.enabled) {
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 1.2;
      keyLight.shadow.camera.far = 14;
      keyLight.shadow.camera.left = -2.4;
      keyLight.shadow.camera.right = 2.4;
      keyLight.shadow.camera.top = 2.4;
      keyLight.shadow.camera.bottom = -2.4;
      keyLight.shadow.bias = -0.0004;
      keyLight.shadow.normalBias = 0.022;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.94);
    rimLight.position.set(-4.3, 2.7, -3.5);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.36);
    fillLight.position.set(-3.0, 1.5, 3.6);
    scene.add(fillLight);

    // ── Grounded Contact Shadow, Precision Turntable Ring & Shadow Receiver ──
    const contactTex = trackTex(createContactShadowTexture());
    const contactMat = trackMat(
      new THREE.MeshBasicMaterial({
        map: contactTex,
        transparent: true,
        opacity: 0.44,
        depthWrite: false,
      }),
    );
    const contactPlane = new THREE.Mesh(
      trackGeo(new THREE.PlaneGeometry(3.6, 3.6)),
      contactMat,
    );
    contactPlane.rotation.x = -Math.PI / 2;
    contactPlane.position.y = -1.182;
    scene.add(contactPlane);

    const turntable = createTurntablePedestal(trackGeo, trackMat);
    scene.add(turntable.group);

    if (renderer.shadowMap.enabled) {
      const shadowCatcher = new THREE.Mesh(
        trackGeo(new THREE.PlaneGeometry(6.5, 6.5)),
        trackMat(
          new THREE.ShadowMaterial({
            opacity: 0.14,
            depthWrite: false,
          }),
        ),
      );
      shadowCatcher.rotation.x = -Math.PI / 2;
      shadowCatcher.position.y = -1.178;
      shadowCatcher.receiveShadow = true;
      scene.add(shadowCatcher);
    }

    // ── Lazy On-Demand Assembly Cache (builds ONLY the active appliance on mount) ──
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const brushedTex = trackTex(
      createBrushedSteelTexture(Math.min(maxAniso, isCoarsePointer() ? 2 : 4)),
    );
    const materialLibrary = createMaterialLibrary(trackMat, brushedTex, isSoftwareGl);

    const builderCtx: StudioBuilderContext = {
      isSoftwareGl,
      trackGeo,
      trackMat,
      trackTex,
      materials: materialLibrary,
    };

    const stageGroup = new THREE.Group();
    scene.add(stageGroup);

    const assemblies: Partial<Record<ExplorerApplianceId, BuiltApplianceAssembly>> = {};

    const createAssemblyForId = (id: ExplorerApplianceId): BuiltApplianceAssembly => {
      switch (id) {
        case "waschmaschine":
          return buildWasherAssembly(builderCtx);
        case "geschirrspueler":
          return buildDishwasherAssembly(builderCtx);
        case "backofen":
          return buildOvenAssembly(builderCtx);
        case "kuehlschrank":
          return buildFridgeAssembly(builderCtx);
        case "trockner":
          return buildTrocknerAssembly(builderCtx);
        case "kaffeevollautomat":
          return buildCoffeeMachineAssembly(builderCtx);
      }
    };

    const ensureAssembly = (id: ExplorerApplianceId): BuiltApplianceAssembly => {
      const existing = assemblies[id];
      if (existing) return existing;

      const built = createAssemblyForId(id);
      built.root.visible = false;
      for (let i = 0; i < built.parts.length; i++) {
        const part = built.parts[i];
        for (let m = 0; m < part.highlightMaterials.length; m++) {
          const hm = part.highlightMaterials[m];
          hm.userData.baseEmissive = hm.emissive.clone();
          hm.userData.baseEmissiveIntensity = hm.emissiveIntensity;
        }
      }
      stageGroup.add(built.root);
      assemblies[id] = built;
      return built;
    };

    let activeAssemblyId: ExplorerApplianceId = propsRef.current.applianceId;
    ensureAssembly(activeAssemblyId).root.visible = true;

    // ── Dark Mode Observer & Dirty-Tracked Material Updates ──
    let targetDarkMix = document.documentElement.classList.contains("dark") ? 1 : 0;
    let curDarkMix = targetDarkMix;
    let curExplode = propsRef.current.explode;
    let curXray = propsRef.current.xrayMode ? 1 : 0;
    let lastLeaderExplode = -1;
    let lastLeaderAssemblyId: ExplorerApplianceId | null = null;
    let lastAppliedDarkMix = -1;
    let lastAppliedCutaway = -1;
    let lastAppliedShellCutaway = -1;
    let lastAppliedShellDarkMix = -1;
    let lastShellAssemblyId: ExplorerApplianceId | null = null;
    let needsRenderFrames = 8;

    const markActive = (frames = 12) => {
      if (frames > needsRenderFrames) needsRenderFrames = frames;
    };

    const applyThemeLighting = (mix: number, cutaway: number) => {
      if (
        Math.abs(mix - lastAppliedDarkMix) < 0.0005 &&
        Math.abs(cutaway - lastAppliedCutaway) < 0.0005
      ) {
        return;
      }
      lastAppliedDarkMix = mix;
      lastAppliedCutaway = cutaway;
      bgUniforms.uDarkMix.value = mix;
      // Calibrate environment reflections so Dark Mode metals stay sculpted, never washed out
      scene.environmentIntensity = THREE.MathUtils.lerp(1.02, 0.58, mix);
      contactMat.opacity = THREE.MathUtils.lerp(0.42, 0.64, mix);
      hemiLight.intensity = THREE.MathUtils.lerp(0.96, 0.66, mix);
      rimLight.intensity = THREE.MathUtils.lerp(0.76, 1.08, mix);
      turntable.updateTheme(mix, cutaway);
    };
    applyThemeLighting(curDarkMix, curExplode);

    const themeObserver = new MutationObserver(() => {
      targetDarkMix = document.documentElement.classList.contains("dark") ? 1 : 0;
      markActive(24);
      ensureRunning();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // ── Collision-Free Spherical Camera & Frustum-Responsive Zoom State ──
    let width = 1;
    let height = 1;
    let userZoomScale = 1; // 0.62..1.42 clean zoom multiplier
    let interiorZoomActive = false;

    const getIdealRadius = (ex: number) =>
      computeResponsiveRadius(
        width / Math.max(height, 1),
        width,
        activeAssemblyId,
        ex,
      );

    // Safe zoom bounds: NEVER clips into the appliance shell AND never shrinks to a tiny dot
    const getSafeRadiusBounds = (ex: number, hasSelectedPart: boolean) => {
      const ideal = getIdealRadius(ex);
      const b = APPLIANCE_BOUNDS[activeAssemblyId];
      if (hasSelectedPart) {
        return {
          minR: 2.15,
          maxR: Math.max(5.8, ideal * 1.18),
        };
      }
      const minSafe = Math.max(b.minRadiusBase + ex * 0.45, ideal * 0.58);
      const maxSafe = Math.min(9.6, ideal * 1.44);
      return { minR: minSafe, maxR: Math.max(minSafe + 1.2, maxSafe) };
    };

    const getIdealLookAtY = (ex: number) => {
      const b = APPLIANCE_BOUNDS[activeAssemblyId];
      const baseY = THREE.MathUtils.lerp(b.yCenter0, b.yCenter1, clamp(ex, 0, 1));
      // Subtle upward model shift on lg+ so the compact bottom dock stays below the pedestal
      return baseY + (width >= 1024 ? -0.06 : 0.0);
    };

    let targetTheta = DEFAULT_THETA;
    let targetPhi = DEFAULT_PHI;
    let targetRadius = 4.6;
    const targetLookAt = new THREE.Vector3(0, 0, 0);

    let curTheta = targetTheta;
    let curPhi = targetPhi;
    let curRadius = targetRadius;
    const curLookAt = targetLookAt.clone();

    let stageSwitchScale = 1;
    let lastUserInteractMs = 0;
    let dragVelTheta = 0;
    let dragVelPhi = 0;

    // ── Sizing, Orientation & DPR Sync ──
    const syncSize = (snapCamera = false) => {
      const rect = mountEl.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      const aspect = width / height;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, getDprCap()));
      renderer.setSize(width, height, false);
      bgUniforms.uResolution.value.set(width, height);

      if (!propsRef.current.selectedPartId) {
        const mult = interiorZoomActive ? 0.78 * userZoomScale : userZoomScale;
        const { minR, maxR } = getSafeRadiusBounds(propsRef.current.explode, false);
        targetRadius = clamp(getIdealRadius(propsRef.current.explode) * mult, minR, maxR);
        targetLookAt.y = getIdealLookAtY(propsRef.current.explode);
        targetPhi = clamp(
          targetPhi,
          MIN_PHI,
          computeSafeMaxPhi(targetLookAt.y, targetRadius),
        );
        if (snapCamera) {
          curRadius = targetRadius;
          curPhi = targetPhi;
          curLookAt.copy(targetLookAt);
        }
      }
      needPinMeasure = true;
      markActive(14);
    };
    syncSize(true);

    const resizeObserver = new ResizeObserver(() => {
      syncSize(false);
      ensureRunning();
    });
    resizeObserver.observe(mountEl);

    const onOrientationChange = () => {
      window.setTimeout(() => {
        syncSize(false);
        ensureRunning();
      }, 140);
    };
    window.addEventListener("orientationchange", onOrientationChange);

    // Pre-allocated pin slots (10 slots) for zero-GC 2D collision avoidance + dirty-checked DOM writes
    const pinSlots: ProjectedPinSlot[] = Array.from({ length: MAX_PIN_SLOTS }, () => ({
      el: null,
      x: 0,
      y: 0,
      w: 132,
      h: 28,
      fade: 0,
      visible: false,
      lastEl: null,
      lastX: -9999,
      lastY: -9999,
      lastFade: -1,
      lastVisible: false,
    }));

    let needPinMeasure = true;

    // Hover state tracked inside closure + reflected sparsely to React for pin styling
    let localHoveredPartId: string | null = null;
    let lastHoverRaycastMs = 0;

    const findPartById = (
      asm: BuiltApplianceAssembly,
      partId: string | null,
    ): BuiltSparePart | null => {
      if (!partId) return null;
      return asm.parts.find((p) => p.meta.id === partId) ?? null;
    };

    const resolvePartFromMesh = (
      asm: BuiltApplianceAssembly,
      hitObj: THREE.Object3D,
    ): string | null => {
      let cur: THREE.Object3D | null = hitObj;
      while (cur) {
        if (typeof cur.userData?.partId === "string") {
          return cur.userData.partId;
        }
        cur = cur.parent;
      }
      for (let i = 0; i < asm.parts.length; i++) {
        if (asm.parts[i].clickableMeshes.includes(hitObj)) {
          return asm.parts[i].meta.id;
        }
      }
      return null;
    };

    const raycastSinglePoint = (
      asm: BuiltApplianceAssembly,
      rect: DOMRect,
      clientX: number,
      clientY: number,
    ): string | null => {
      _pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      _pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      _raycaster.setFromCamera(_pointerNdc, camera);
      const hits = _raycaster.intersectObjects(asm.allClickables, false);
      if (hits.length === 0) return null;
      return resolvePartFromMesh(asm, hits[0].object);
    };

    const raycastAtClientPoint = (
      clientX: number,
      clientY: number,
      forgivingTouch = false,
    ): string | null => {
      const rect = domEl.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      const asm = ensureAssembly(activeAssemblyId);

      const direct = raycastSinglePoint(asm, rect, clientX, clientY);
      if (direct || !forgivingTouch) return direct;

      for (let i = 1; i < TOUCH_HIT_OFFSETS.length; i++) {
        const [ox, oy] = TOUCH_HIT_OFFSETS[i];
        const hit = raycastSinglePoint(asm, rect, clientX + ox, clientY + oy);
        if (hit) return hit;
      }
      return null;
    };

    const applyZoomFactor = (factor: number) => {
      const hasSel = Boolean(propsRef.current.selectedPartId);
      const { minR, maxR } = getSafeRadiusBounds(propsRef.current.explode, hasSel);
      if (hasSel) {
        targetRadius = clamp(targetRadius * factor, minR, maxR);
      } else {
        const nextRadius = clamp(targetRadius * factor, minR, maxR);
        const ideal = getIdealRadius(propsRef.current.explode);
        const baseMult = interiorZoomActive ? 0.78 : 1;
        userZoomScale = clamp(nextRadius / Math.max(ideal * baseMult, 0.5), 0.58, 1.44);
        targetRadius = nextRadius;
      }
      targetPhi = clamp(
        targetPhi,
        MIN_PHI,
        computeSafeMaxPhi(targetLookAt.y, targetRadius),
      );
      lastUserInteractMs = performance.now();
      markActive(35);
      ensureRunning();
    };

    // Expose imperative commands to React prop effects & keyboard handlers
    cameraCmdRef.current = {
      applyPreset: (mode) => {
        dragVelTheta = 0;
        dragVelPhi = 0;
        userZoomScale = 1;
        const { minR, maxR } = getSafeRadiusBounds(propsRef.current.explode, false);
        if (mode === "overview" || mode === "reset") {
          interiorZoomActive = false;
          targetTheta = nearestAngle(curTheta, DEFAULT_THETA);
          targetLookAt.set(0, getIdealLookAtY(propsRef.current.explode), 0);
          targetRadius = clamp(getIdealRadius(propsRef.current.explode), minR, maxR);
          targetPhi = clamp(
            DEFAULT_PHI,
            MIN_PHI,
            computeSafeMaxPhi(targetLookAt.y, targetRadius),
          );
        } else if (mode === "interior") {
          interiorZoomActive = true;
          targetTheta = nearestAngle(curTheta, 0.28);
          targetLookAt.set(0, getIdealLookAtY(propsRef.current.explode) + 0.04, 0.1);
          targetRadius = clamp(getIdealRadius(propsRef.current.explode) * 0.78, minR, maxR);
          targetPhi = clamp(
            1.3,
            MIN_PHI,
            computeSafeMaxPhi(targetLookAt.y, targetRadius),
          );
        }
        lastUserInteractMs = performance.now();
        markActive(50);
        ensureRunning();
      },
      focusPart: (partId) => {
        dragVelTheta = 0;
        dragVelPhi = 0;
        const asm = ensureAssembly(activeAssemblyId);
        const part = findPartById(asm, partId);
        if (!part) {
          interiorZoomActive = false;
          userZoomScale = 1;
          const { minR, maxR } = getSafeRadiusBounds(propsRef.current.explode, false);
          targetLookAt.set(0, getIdealLookAtY(propsRef.current.explode), 0);
          targetRadius = clamp(getIdealRadius(propsRef.current.explode), minR, maxR);
          targetPhi = clamp(
            targetPhi,
            MIN_PHI,
            computeSafeMaxPhi(targetLookAt.y, targetRadius),
          );
          markActive(50);
          ensureRunning();
          return;
        }
        const ex = propsRef.current.explode;
        _vec3A.copy(part.basePosition).addScaledVector(part.explodeOffset, ex);
        targetLookAt.copy(_vec3A);

        // Aspect-aware, collision-free viewing distance using shortest angular arc
        _vec3B.copy(part.focusOffset);
        const aspect = width / Math.max(height, 1);
        const aspectFactor = aspect < 1.15 ? 1.15 / Math.max(aspect, 0.68) : 1;
        const { minR, maxR } = getSafeRadiusBounds(ex, true);
        const dist = clamp(_vec3B.length() * aspectFactor * 1.08, minR + 0.25, Math.min(maxR, 5.1));
        const rawTheta = Math.atan2(_vec3B.x, _vec3B.z);
        const rawPhi = Math.acos(
          clamp(_vec3B.y / Math.max(_vec3B.length(), 0.001), -0.9, 0.9),
        );
        targetTheta = nearestAngle(curTheta, rawTheta);
        targetRadius = dist;
        targetPhi = clamp(rawPhi, 0.62, computeSafeMaxPhi(targetLookAt.y, targetRadius));
        lastUserInteractMs = performance.now();
        markActive(60);
        ensureRunning();
      },
      switchAppliance: (id) => {
        if (activeAssemblyId === id) return;
        const prev = assemblies[activeAssemblyId];
        if (prev) prev.root.visible = false;
        activeAssemblyId = id;
        const next = ensureAssembly(id);
        next.root.visible = true;
        lastLeaderAssemblyId = null;
        lastShellAssemblyId = null;
        needPinMeasure = true;
        for (let i = 0; i < MAX_PIN_SLOTS; i++) {
          pinSlots[i].el = null;
          pinSlots[i].lastEl = null;
          pinSlots[i].visible = false;
          pinSlots[i].lastVisible = false;
        }
        stageSwitchScale = propsRef.current.prefersReducedMotion ? 1 : 0.94;
        dragVelTheta = 0;
        dragVelPhi = 0;
        userZoomScale = 1;
        interiorZoomActive = false;
        const { minR, maxR } = getSafeRadiusBounds(propsRef.current.explode, false);
        targetLookAt.set(0, getIdealLookAtY(propsRef.current.explode), 0);
        targetRadius = clamp(getIdealRadius(propsRef.current.explode), minR, maxR);
        targetTheta = nearestAngle(curTheta, DEFAULT_THETA);
        targetPhi = clamp(
          DEFAULT_PHI,
          MIN_PHI,
          computeSafeMaxPhi(targetLookAt.y, targetRadius),
        );
        localHoveredPartId = null;
        setHoveredPartId(null);
        markActive(50);
        ensureRunning();
      },
      zoomBy: (factor) => {
        applyZoomFactor(factor);
        propsRef.current.onUserInteract?.();
      },
      nudgeOrbit: (dTheta, dPhi) => {
        targetTheta += dTheta;
        targetPhi = clamp(
          targetPhi + dPhi,
          MIN_PHI,
          computeSafeMaxPhi(targetLookAt.y, targetRadius),
        );
        lastUserInteractMs = performance.now();
        propsRef.current.onUserInteract?.();
        markActive(35);
        ensureRunning();
      },
      wake: () => {
        markActive(40);
        ensureRunning();
      },
    };

    // ── Butter-Smooth Multi-Touch + Mouse + Trackpad-Pinch Orbit Engine ──
    const activeTouches = new Map<number, { x: number; y: number }>();
    let lastPinchDist = 0;
    let activePointerId: number | null = null;
    let activePointerType = "mouse";
    let lastX = 0;
    let lastY = 0;
    let lastMoveMs = 0;
    let totalTravel = 0;
    let isPinching = false;
    let interactedNotified = false;
    let lastTapMs = 0;
    let lastTapX = 0;
    let lastTapY = 0;

    const notifyInteractOnce = () => {
      if (!interactedNotified) {
        interactedNotified = true;
        propsRef.current.onUserInteract?.();
      }
    };

    const computePinchDistance = (): number => {
      if (activeTouches.size < 2) return 0;
      const iter = activeTouches.values();
      const a = iter.next().value;
      const b = iter.next().value;
      if (!a || !b) return 0;
      return Math.hypot(b.x - a.x, b.y - a.y);
    };

    const resetAllTouchState = () => {
      activeTouches.clear();
      activePointerId = null;
      isPinching = false;
      lastPinchDist = 0;
      dragVelTheta = 0;
      dragVelPhi = 0;
      domEl.style.cursor = "grab";
    };

    // Guard native browser pinch-zoom & rubber-band scroll ONLY inside the 3D canvas
    const onTouchMoveGuard = (e: TouchEvent) => {
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    const onTouchEndSafety = (e: TouchEvent) => {
      if (e.touches.length === 0 && (activeTouches.size > 0 || activePointerId !== null)) {
        activeTouches.clear();
        isPinching = false;
        lastPinchDist = 0;
        if (activePointerType === "touch") {
          activePointerId = null;
        }
      }
    };

    // Trackpad pinch-to-zoom (Ctrl+Wheel on macOS/Windows) without ever hijacking normal vertical page scrolling!
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const factor = clamp(1 + e.deltaY * 0.0045, 0.88, 1.12);
      applyZoomFactor(factor);
      notifyInteractOnce();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") {
        activeTouches.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (activeTouches.size >= 2) {
          isPinching = true;
          lastPinchDist = computePinchDistance();
          dragVelTheta = 0;
          dragVelPhi = 0;
          totalTravel = 999; // prevent accidental tap on pinch release
          notifyInteractOnce();
          markActive(30);
          ensureRunning();
          return;
        }
      }

      if (activePointerId !== null) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;

      activePointerId = e.pointerId;
      activePointerType = e.pointerType;
      lastX = e.clientX;
      lastY = e.clientY;
      lastMoveMs = performance.now();
      totalTravel = 0;
      dragVelTheta = 0;
      dragVelPhi = 0;
      isPinching = false;
      markActive(24);
      ensureRunning();

      if (e.pointerType === "mouse") {
        domEl.style.cursor = "grabbing";
      }
      try {
        domEl.setPointerCapture(e.pointerId);
      } catch {
        // Ignore capture failures
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch" && activeTouches.has(e.pointerId)) {
        activeTouches.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (activeTouches.size >= 2) {
          isPinching = true;
          const dist = computePinchDistance();
          if (lastPinchDist > 12 && dist > 12) {
            const ratio = clamp(lastPinchDist / dist, 0.88, 1.12);
            applyZoomFactor(ratio);
          }
          lastPinchDist = dist;
          return;
        }
      }

      // Desktop hover raycast when not dragging
      if (activePointerId === null) {
        if (e.pointerType === "mouse") {
          const now = performance.now();
          if (now - lastHoverRaycastMs > 42) {
            lastHoverRaycastMs = now;
            const hitId = raycastAtClientPoint(e.clientX, e.clientY, false);
            if (hitId !== localHoveredPartId) {
              localHoveredPartId = hitId;
              setHoveredPartId(hitId);
              domEl.style.cursor = hitId ? "pointer" : "grab";
              markActive(25);
              ensureRunning();
            }
          }
        }
        return;
      }

      if (e.pointerId !== activePointerId || isPinching) return;

      const now = performance.now();
      const stepDt = Math.max(0.008, Math.min(0.06, (now - lastMoveMs) / 1000));
      lastMoveMs = now;

      const stepDx = e.clientX - lastX;
      const stepDy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      totalTravel += Math.hypot(stepDx, stepDy);

      // Viewport-normalized sensitivity: feels equally fluid on 320px phones and 2560px monitors!
      const refDim = Math.max(260, Math.min(width, height));
      const sensitivity = activePointerType === "touch" ? 4.3 : 3.7;
      const dTheta = (-stepDx / refDim) * sensitivity;
      const dPhi = (-stepDy / refDim) * (sensitivity * 0.72);

      const safeMaxPhi = computeSafeMaxPhi(targetLookAt.y, targetRadius);
      targetTheta += dTheta;
      targetPhi = clamp(targetPhi + dPhi, MIN_PHI, safeMaxPhi);

      // Smoothed velocity estimate for silk-smooth inertial glide on release (zero spikes!)
      const instVelTheta = clamp(dTheta / stepDt, -6.5, 6.5);
      const instVelPhi = clamp(dPhi / stepDt, -3.2, 3.2);
      dragVelTheta = THREE.MathUtils.lerp(dragVelTheta, instVelTheta, 0.45);
      dragVelPhi = THREE.MathUtils.lerp(dragVelPhi, instVelPhi, 0.45);

      lastUserInteractMs = now;
      notifyInteractOnce();
      markActive(40);
      ensureRunning();
    };

    const finishPointer = (e: PointerEvent, isCancel: boolean) => {
      if (e.pointerType === "touch") {
        activeTouches.delete(e.pointerId);
        if (activeTouches.size < 2) {
          lastPinchDist = 0;
        }
        if (activeTouches.size === 0) {
          isPinching = false;
        }
      }

      if (e.pointerId !== activePointerId) return;
      const isTouch = activePointerType === "touch";
      const tapThreshold = isTouch ? 12 : 8;
      const wasTap = !isCancel && totalTravel < tapThreshold && !isPinching;

      try {
        if (domEl.hasPointerCapture(e.pointerId)) {
          domEl.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignore
      }
      if (activePointerType === "mouse") {
        domEl.style.cursor = localHoveredPartId ? "pointer" : "grab";
      }

      // If pointer stopped moving for > 90ms before lift, zero inertia so it parks crisply where held
      const sinceLastMove = performance.now() - lastMoveMs;
      if (wasTap || isCancel || isPinching || sinceLastMove > 90) {
        dragVelTheta = 0;
        dragVelPhi = 0;
      }

      activePointerId = null;

      if (wasTap) {
        notifyInteractOnce();
        const hitId = raycastAtClientPoint(e.clientX, e.clientY, isTouch);
        if (hitId) {
          propsRef.current.onSelectPart(hitId);
          lastTapMs = 0;
        } else {
          const now = performance.now();
          const isDoubleTap =
            now - lastTapMs < 300 &&
            Math.hypot(e.clientX - lastTapX, e.clientY - lastTapY) < 28;
          lastTapMs = now;
          lastTapX = e.clientX;
          lastTapY = e.clientY;

          if (isDoubleTap) {
            propsRef.current.onSelectPart(null);
            cameraCmdRef.current?.applyPreset("reset");
            lastTapMs = 0;
          } else if (propsRef.current.selectedPartId !== null) {
            propsRef.current.onSelectPart(null);
          }
        }
        markActive(45);
        ensureRunning();
      }
    };

    const onPointerUp = (e: PointerEvent) => finishPointer(e, false);
    const onPointerCancel = (e: PointerEvent) => finishPointer(e, true);
    const onPointerLeave = () => {
      if (activePointerId === null && localHoveredPartId !== null) {
        localHoveredPartId = null;
        setHoveredPartId(null);
        domEl.style.cursor = "grab";
        markActive(20);
        ensureRunning();
      }
    };

    domEl.addEventListener("touchmove", onTouchMoveGuard, { passive: false });
    domEl.addEventListener("touchend", onTouchEndSafety, { passive: true });
    domEl.addEventListener("touchcancel", onTouchEndSafety, { passive: true });
    domEl.addEventListener("wheel", onWheel, { passive: false });
    domEl.addEventListener("pointerdown", onPointerDown, { passive: true });
    domEl.addEventListener("pointermove", onPointerMove, { passive: true });
    domEl.addEventListener("pointerup", onPointerUp, { passive: true });
    domEl.addEventListener("pointercancel", onPointerCancel, { passive: true });
    domEl.addEventListener("pointerleave", onPointerLeave, { passive: true });
    window.addEventListener("blur", resetAllTouchState);

    // ── WebGL Context Loss & Restoration ──
    let contextLost = false;
    const onContextLost = (ev: Event) => {
      ev.preventDefault();
      contextLost = true;
      setWebglUnavailable(true);
    };
    const onContextRestored = () => {
      contextLost = false;
      setWebglUnavailable(false);
      syncSize(false);
      ensureRunning();
    };
    domEl.addEventListener("webglcontextlost", onContextLost, false);
    domEl.addEventListener("webglcontextrestored", onContextRestored, false);

    // ── Automatic Offscreen, Tab-Hidden & Mobile-Idle rAF Pausing ──
    let isVisibleInViewport = true;
    let isTabVisible = !document.hidden;
    let rafId: number | null = null;
    let softwareTimerId: number | null = null;
    let disposed = false;
    let lastFrameMs = performance.now();
    let elapsedSec = 0;
    let firstFrameDrawn = false;

    const glCtx = renderer.getContext();
    const gl2 =
      isSoftwareGl &&
      typeof WebGL2RenderingContext !== "undefined" &&
      glCtx instanceof WebGL2RenderingContext
        ? glCtx
        : null;

    const scheduleNextFrame = (afterDrawFn: FrameRequestCallback) => {
      if (disposed || !isVisibleInViewport || !isTabVisible || contextLost) {
        rafId = null;
        return;
      }
      if (gl2) {
        const sync = gl2.fenceSync(gl2.SYNC_GPU_COMMANDS_COMPLETE, 0);
        if (sync) {
          gl2.flush();
          const waitFence = () => {
            if (disposed || !isVisibleInViewport || !isTabVisible || contextLost) {
              gl2.deleteSync(sync);
              rafId = null;
              return;
            }
            const status = gl2.clientWaitSync(sync, 0, 0);
            if (status === gl2.TIMEOUT_EXPIRED) {
              rafId = window.requestAnimationFrame(waitFence);
              return;
            }
            gl2.deleteSync(sync);
            rafId = null;
            softwareTimerId = window.setTimeout(() => {
              softwareTimerId = null;
              if (!disposed && isVisibleInViewport && isTabVisible && !contextLost) {
                rafId = window.requestAnimationFrame(afterDrawFn);
              }
            }, 80);
          };
          rafId = window.requestAnimationFrame(waitFence);
          return;
        }
      }
      rafId = window.requestAnimationFrame(afterDrawFn);
    };

    const tick = (nowMs: number) => {
      if (disposed || !isVisibleInViewport || !isTabVisible || contextLost) {
        rafId = null;
        return;
      }

      const delta = Math.min(0.05, Math.max(0.001, (nowMs - lastFrameMs) / 1000));
      lastFrameMs = nowMs;
      const reduced = propsRef.current.prefersReducedMotion;
      if (!reduced) {
        elapsedSec += delta;
      }

      // Smoothly damp explode & X-Ray values
      const targetExplode = propsRef.current.explode;
      const targetXray = propsRef.current.xrayMode ? 1 : 0;
      curExplode = reduced
        ? targetExplode
        : THREE.MathUtils.damp(curExplode, targetExplode, 8.2, delta);
      curXray = reduced
        ? targetXray
        : THREE.MathUtils.damp(curXray, targetXray, 9.5, delta);

      const effectiveCutaway = Math.max(curExplode, curXray * 0.86);
      bgUniforms.uTime.value = elapsedSec;
      bgUniforms.uExplode.value = effectiveCutaway;

      // Smoothly damp theme mix & turntable glow
      curDarkMix = THREE.MathUtils.damp(curDarkMix, targetDarkMix, 7, delta);
      applyThemeLighting(curDarkMix, effectiveCutaway);

      // Active assembly reference (built lazily on demand)
      const asm = ensureAssembly(activeAssemblyId);

      // Keep camera centered on either the full appliance OR the selected part as Explosion changes
      const selId = propsRef.current.selectedPartId;
      const secondaryIds = propsRef.current.secondaryPartIds;
      if (!selId) {
        const mult = interiorZoomActive ? 0.78 * userZoomScale : userZoomScale;
        const { minR, maxR } = getSafeRadiusBounds(curExplode, false);
        targetRadius = clamp(getIdealRadius(curExplode) * mult, minR, maxR);
        targetLookAt.y = getIdealLookAtY(curExplode);
      } else {
        const focusedPart = findPartById(asm, selId);
        if (focusedPart) {
          targetLookAt
            .copy(focusedPart.basePosition)
            .addScaledVector(focusedPart.explodeOffset, curExplode);
        }
      }

      // Smooth decaying inertial glide after mouse/touch flick
      const safeMaxPhi = computeSafeMaxPhi(targetLookAt.y, targetRadius);
      if (
        activePointerId === null &&
        !isPinching &&
        (Math.abs(dragVelTheta) > 0.004 || Math.abs(dragVelPhi) > 0.004)
      ) {
        targetTheta += dragVelTheta * delta;
        targetPhi = clamp(targetPhi + dragVelPhi * delta, MIN_PHI, safeMaxPhi);
        const decay = Math.exp(-5.4 * delta);
        dragVelTheta *= decay;
        dragVelPhi *= decay;
      } else if (activePointerId === null) {
        dragVelTheta = 0;
        dragVelPhi = 0;
      }

      // Gentle idle studio showroom rotation ONLY after 8s idle, when no part is selected & cutaway is mild
      const isIdleRotating =
        !reduced &&
        activePointerId === null &&
        activeTouches.size === 0 &&
        selId === null &&
        curExplode <= 0.48 &&
        nowMs - lastUserInteractMs > 8000;
      if (isIdleRotating) {
        targetTheta += delta * 0.11;
      }

      // Always keep targetPhi within collision-free floor clearance
      targetPhi = clamp(targetPhi, MIN_PHI, safeMaxPhi);

      // Responsive damping: crisp & immediate during active drag, silky smooth during autopilot focus
      const isDragging = activePointerId !== null || isPinching;
      const camLambda = reduced ? 30 : isDragging ? 18.0 : 8.4;
      curTheta = THREE.MathUtils.damp(curTheta, targetTheta, camLambda, delta);
      curPhi = THREE.MathUtils.damp(curPhi, targetPhi, camLambda, delta);
      curRadius = THREE.MathUtils.damp(curRadius, targetRadius, camLambda, delta);
      curLookAt.x = THREE.MathUtils.damp(curLookAt.x, targetLookAt.x, 8.4, delta);
      curLookAt.y = THREE.MathUtils.damp(curLookAt.y, targetLookAt.y, 8.4, delta);
      curLookAt.z = THREE.MathUtils.damp(curLookAt.z, targetLookAt.z, 8.4, delta);

      const sinPhi = Math.sin(curPhi);
      const camY = Math.max(FLOOR_CLEARANCE_Y, curLookAt.y + curRadius * Math.cos(curPhi));
      camera.position.set(
        curLookAt.x + curRadius * sinPhi * Math.sin(curTheta),
        camY,
        curLookAt.z + curRadius * sinPhi * Math.cos(curTheta),
      );
      camera.lookAt(curLookAt);
      camera.updateMatrixWorld();

      // Smooth stage pop-in on appliance switch + subtle pedestal rotation
      stageSwitchScale = THREE.MathUtils.damp(stageSwitchScale, 1, 10, delta);
      stageGroup.scale.setScalar(stageSwitchScale);
      turntable.group.rotation.y = elapsedSec * 0.035;

      // Animate active appliance cutaway + spare parts
      asm.animate(elapsedSec, delta, curExplode);

      // Cutaway / X-Ray shell translucency + crisp architectural wireframe reveal (dirty-checked)
      const cutawayChanged =
        Math.abs(effectiveCutaway - lastAppliedShellCutaway) > 0.0005 ||
        Math.abs(curDarkMix - lastAppliedShellDarkMix) > 0.001 ||
        lastShellAssemblyId !== activeAssemblyId;
      if (cutawayChanged) {
        lastShellAssemblyId = activeAssemblyId;
        lastAppliedShellCutaway = effectiveCutaway;
        lastAppliedShellDarkMix = curDarkMix;
        const shellFade = 1 - effectiveCutaway * 0.84;
        const minShellOpacity = curXray > 0.5 ? 0.1 : 0.16;
        for (let i = 0; i < asm.chassisMaterials.length; i++) {
          const mat = asm.chassisMaterials[i];
          const baseOp = asm.chassisBaseOpacities[i] ?? 1;
          mat.opacity = Math.max(minShellOpacity, baseOp * shellFade);
          mat.depthWrite = effectiveCutaway < 0.1;
        }
        const edgeOp =
          THREE.MathUtils.smoothstep(effectiveCutaway, 0.06, 0.42) *
          THREE.MathUtils.lerp(0.34, 0.54, curDarkMix);
        for (let i = 0; i < asm.edgeMaterials.length; i++) {
          asm.edgeMaterials[i].opacity = edgeOp;
        }
      }

      // Desktop/tablet floating pins only on >= 768px so phones stay 100% clean & zero-overhead
      const isDesktopPinsViewport = width >= 768;
      const pinThreshold = curXray > 0.5 ? 0.08 : 0.22;
      const showDesktopPins = isDesktopPinsViewport && effectiveCutaway >= pinThreshold;
      // Strict HUD safe zone boundaries (keeps pins completely clear of top toolbar & bottom dock)
      const pinTopMargin = 74;
      const pinBottomMargin = width >= 1024 ? height - 80 : height - 28;
      const pinFade = clamp((effectiveCutaway - pinThreshold) / 0.16, 0, 1);

      const leaderNeedsUpdate =
        Math.abs(curExplode - lastLeaderExplode) > 0.0004 ||
        lastLeaderAssemblyId !== activeAssemblyId;

      let emissiveStillChanging = false;

      // Update each spare part position, leader line, emissive highlight & collect pin coords
      const partCount = Math.min(asm.parts.length, MAX_PIN_SLOTS);
      for (let i = 0; i < partCount; i++) {
        const part = asm.parts[i];
        part.group.position
          .copy(part.basePosition)
          .addScaledVector(part.explodeOffset, curExplode);

        // Engineering dashed leader line (dirty-checked — zero redundant GPU uploads)
        const showLeader = curExplode > 0.05;
        part.leaderLine.visible = showLeader;
        if (showLeader && leaderNeedsUpdate) {
          const posAttr = part.leaderLine.geometry.getAttribute(
            "position",
          ) as THREE.BufferAttribute;
          posAttr.setXYZ(0, part.leaderOrigin.x, part.leaderOrigin.y, part.leaderOrigin.z);
          posAttr.setXYZ(
            1,
            part.group.position.x,
            part.group.position.y,
            part.group.position.z,
          );
          posAttr.needsUpdate = true;
          part.leaderLine.computeLineDistances();
        }

        // Tactile emissive highlight: emerald (selected) · amber (secondary symptom match) · sky (hover)
        const isSelected = selId === part.meta.id;
        const isSecondary = !isSelected && secondaryIds.includes(part.meta.id);
        const isHovered = localHoveredPartId === part.meta.id;

        for (let m = 0; m < part.highlightMaterials.length; m++) {
          const hm = part.highlightMaterials[m];
          const baseCol =
            (hm.userData.baseEmissive as THREE.Color | undefined) ?? _fallbackBaseEmissive;
          const baseInt =
            typeof hm.userData.baseEmissiveIntensity === "number"
              ? hm.userData.baseEmissiveIntensity
              : 0.08;

          if (isSelected || isSecondary || isHovered) {
            _emissiveTarget.copy(
              isSelected ? _selectedColor : isSecondary ? _secondaryColor : _hoverColor,
            );
            hm.emissive.lerp(_emissiveTarget, clamp(delta * 10, 0, 1));
            const targetIntensity = isSelected ? 0.52 : isSecondary ? 0.38 : 0.3;
            hm.emissiveIntensity = THREE.MathUtils.damp(
              hm.emissiveIntensity,
              targetIntensity,
              10,
              delta,
            );
            if (Math.abs(hm.emissiveIntensity - targetIntensity) > 0.008) {
              emissiveStillChanging = true;
            }
          } else {
            hm.emissive.lerp(baseCol, clamp(delta * 8, 0, 1));
            const restInt = selId ? baseInt * 0.55 : baseInt;
            hm.emissiveIntensity = THREE.MathUtils.damp(
              hm.emissiveIntensity,
              restInt,
              8,
              delta,
            );
            if (Math.abs(hm.emissiveIntensity - restInt) > 0.008) {
              emissiveStillChanging = true;
            }
          }
        }

        // Skip all 2D pin math on mobile (<768px) for zero wasted CPU work
        if (isDesktopPinsViewport) {
          const slot = pinSlots[i];
          const pinEl = pinRefs.current[part.meta.id] ?? null;
          slot.el = pinEl;
          slot.visible = false;
          slot.fade = pinFade;

          // Cache real rendered box dimensions once per element mount or resize (zero per-frame layout thrash)
          if (pinEl && (pinEl !== slot.lastEl || needPinMeasure)) {
            slot.w = clamp(Math.ceil(pinEl.offsetWidth || 132), 88, 170);
            slot.h = clamp(Math.ceil(pinEl.offsetHeight || 28), 24, 36);
          }

          if (pinEl && showDesktopPins) {
            _projVec.copy(part.group.position).add(part.anchorLocal);
            _projVec.applyMatrix4(stageGroup.matrixWorld);
            _projVec.project(camera);

            if (_projVec.z > -1 && _projVec.z < 1) {
              const halfW = slot.w * 0.5 + 12;
              const minX = Math.min(width * 0.5, halfW);
              const maxX = Math.max(minX + 10, width - halfW);
              slot.x = clamp((_projVec.x * 0.5 + 0.5) * width, minX, maxX);
              slot.y = clamp(
                (-_projVec.y * 0.5 + 0.5) * height,
                pinTopMargin,
                Math.max(pinTopMargin + 20, pinBottomMargin),
              );
              slot.visible = true;
            }
          }
        }
      }
      if (isDesktopPinsViewport && needPinMeasure && partCount > 0) {
        needPinMeasure = false;
      }

      if (leaderNeedsUpdate) {
        lastLeaderExplode = curExplode;
        lastLeaderAssemblyId = activeAssemblyId;
      }

      // Precision 16-pass AABB pin de-overlap solver (guarantees zero label collisions)
      if (showDesktopPins) {
        const padX = 10;
        const padY = 8;
        const maxBottom = Math.max(pinTopMargin + 20, pinBottomMargin);

        for (let iter = 0; iter < 16; iter++) {
          let hadCollision = false;
          for (let a = 0; a < partCount; a++) {
            const sa = pinSlots[a];
            if (!sa.visible) continue;
            const halfWa = sa.w * 0.5 + 12;

            for (let b = a + 1; b < partCount; b++) {
              const sb = pinSlots[b];
              if (!sb.visible) continue;
              const halfWb = sb.w * 0.5 + 12;

              const reqX = (sa.w + sb.w) * 0.5 + padX;
              const reqY = (sa.h + sb.h) * 0.5 + padY;

              const dx = sb.x - sa.x;
              const dy = sb.y - sa.y;
              const overlapX = reqX - Math.abs(dx);
              const overlapY = reqY - Math.abs(dy);

              if (overlapX > 0 && overlapY > 0) {
                hadCollision = true;
                // Push along minimum penetration axis (with subtle horizontal spread on near-vertical stacks)
                if (overlapX * 0.34 < overlapY) {
                  const dirX = dx === 0 ? (a % 2 === 0 ? 1 : -1) : dx > 0 ? 1 : -1;
                  const pushX = overlapX * 0.52 + 0.6;
                  sa.x = clamp(sa.x - dirX * pushX, halfWa, Math.max(halfWa + 10, width - halfWa));
                  sb.x = clamp(sb.x + dirX * pushX, halfWb, Math.max(halfWb + 10, width - halfWb));
                } else {
                  const dirY = dy === 0 ? (b % 2 === 0 ? 1 : -1) : dy > 0 ? 1 : -1;
                  const pushY = overlapY * 0.54 + 0.6;
                  const fanX = Math.abs(dx) < 28 ? (a % 2 === 0 ? -4 : 4) : 0;
                  sa.y = clamp(sa.y - dirY * pushY, pinTopMargin, maxBottom);
                  sb.y = clamp(sb.y + dirY * pushY, pinTopMargin, maxBottom);
                  if (fanX !== 0) {
                    sa.x = clamp(sa.x + fanX, halfWa, Math.max(halfWa + 10, width - halfWa));
                    sb.x = clamp(sb.x - fanX, halfWb, Math.max(halfWb + 10, width - halfWb));
                  }
                  // If vertical separation remained blocked by top/bottom HUD clamp, separate horizontally
                  if (reqY - Math.abs(sb.y - sa.y) > 1) {
                    const remOverlapX = reqX - Math.abs(sb.x - sa.x);
                    if (remOverlapX > 0) {
                      const dirX =
                        sb.x === sa.x ? (a % 2 === 0 ? 1 : -1) : sb.x > sa.x ? 1 : -1;
                      const pushX = remOverlapX * 0.52 + 1.0;
                      sa.x = clamp(sa.x - dirX * pushX, halfWa, Math.max(halfWa + 10, width - halfWa));
                      sb.x = clamp(sb.x + dirX * pushX, halfWb, Math.max(halfWb + 10, width - halfWb));
                    }
                  }
                }
              }
            }
          }
          if (!hadCollision) break;
        }
      }

      // Apply computed transforms directly to pin DOM elements ONLY when changed (desktop/tablet >= 768px)
      if (isDesktopPinsViewport) {
        for (let i = 0; i < partCount; i++) {
          const slot = pinSlots[i];
          if (!slot.el) continue;
          const elChanged = slot.el !== slot.lastEl;
          if (slot.visible) {
            if (
              elChanged ||
              !slot.lastVisible ||
              Math.abs(slot.x - slot.lastX) > 0.35 ||
              Math.abs(slot.y - slot.lastY) > 0.35
            ) {
              slot.el.style.transform = `translate3d(${slot.x.toFixed(1)}px, ${slot.y.toFixed(1)}px, 0) translate(-50%, -50%)`;
              slot.lastX = slot.x;
              slot.lastY = slot.y;
            }
            if (
              elChanged ||
              !slot.lastVisible ||
              Math.abs(slot.fade - slot.lastFade) > 0.015
            ) {
              slot.el.style.opacity = slot.fade.toFixed(3);
              slot.el.style.pointerEvents = slot.fade > 0.45 ? "auto" : "none";
              slot.lastFade = slot.fade;
            }
            slot.lastVisible = true;
            slot.lastEl = slot.el;
          } else if (elChanged || slot.lastVisible) {
            slot.el.style.opacity = "0";
            slot.el.style.pointerEvents = "none";
            slot.lastVisible = false;
            slot.lastFade = 0;
            slot.lastEl = slot.el;
          }
        }
      }

      // Render Pass 0 (cyclorama) + Pass 1 (3D studio)
      renderer.clear(true, true, false);
      renderer.render(bgScene, bgCamera);
      renderer.clearDepth();
      renderer.render(scene, camera);

      if (!firstFrameDrawn) {
        firstFrameDrawn = true;
        setCanvasReady(true);
      }

      // Smart mobile power-saving settle while reading part details
      if (needsRenderFrames > 0) needsRenderFrames--;
      const camSettled =
        Math.abs(curTheta - targetTheta) < 0.001 &&
        Math.abs(curPhi - targetPhi) < 0.001 &&
        Math.abs(curRadius - targetRadius) < 0.002 &&
        curLookAt.distanceToSquared(targetLookAt) < 0.00001 &&
        Math.abs(curExplode - targetExplode) < 0.001 &&
        Math.abs(curXray - targetXray) < 0.001 &&
        Math.abs(curDarkMix - targetDarkMix) < 0.002 &&
        Math.abs(stageSwitchScale - 1) < 0.001 &&
        Math.abs(dragVelTheta) < 0.004 &&
        Math.abs(dragVelPhi) < 0.004 &&
        !emissiveStillChanging;

      const canSleepWhileReading =
        isCoarsePointer() &&
        selId !== null &&
        activePointerId === null &&
        activeTouches.size === 0 &&
        needsRenderFrames === 0 &&
        camSettled;

      if (canSleepWhileReading) {
        rafId = null;
        return;
      }

      scheduleNextFrame(tick);
    };

    let compileReady = false;
    const ensureRunning = () => {
      if (
        disposed ||
        !compileReady ||
        rafId !== null ||
        softwareTimerId !== null ||
        !isVisibleInViewport ||
        !isTabVisible ||
        contextLost
      ) {
        return;
      }
      lastFrameMs = performance.now();
      rafId = window.requestAnimationFrame(tick);
    };

    const stopLoop = () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (softwareTimerId !== null) {
        window.clearTimeout(softwareTimerId);
        softwareTimerId = null;
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisibleInViewport = Boolean(entry && entry.isIntersecting);
        if (isVisibleInViewport) {
          markActive(15);
          ensureRunning();
        } else {
          stopLoop();
        }
      },
      { threshold: 0.02 },
    );
    io.observe(outerEl);

    const onVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible) {
        markActive(15);
        ensureRunning();
      } else {
        resetAllTouchState();
        stopLoop();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    // Compile shaders off the main thread (KHR_parallel_shader_compile)
    const startWhenCompiled = () => {
      compileReady = true;
      markActive(20);
      ensureRunning();
    };
    Promise.all([
      renderer.compileAsync(bgScene, bgCamera),
      renderer.compileAsync(scene, camera),
    ])
      .catch(() => undefined)
      .then(startWhenCompiled);

    return () => {
      disposed = true;
      cameraCmdRef.current = null;
      stopLoop();
      io.disconnect();
      resizeObserver.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("orientationchange", onOrientationChange);
      window.removeEventListener("blur", resetAllTouchState);
      document.removeEventListener("visibilitychange", onVisibilityChange);

      domEl.removeEventListener("touchmove", onTouchMoveGuard);
      domEl.removeEventListener("touchend", onTouchEndSafety);
      domEl.removeEventListener("touchcancel", onTouchEndSafety);
      domEl.removeEventListener("wheel", onWheel);
      domEl.removeEventListener("pointerdown", onPointerDown);
      domEl.removeEventListener("pointermove", onPointerMove);
      domEl.removeEventListener("pointerup", onPointerUp);
      domEl.removeEventListener("pointercancel", onPointerCancel);
      domEl.removeEventListener("pointerleave", onPointerLeave);
      domEl.removeEventListener("webglcontextlost", onContextLost);
      domEl.removeEventListener("webglcontextrestored", onContextRestored);

      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      scene.environment = null;
      envTarget.dispose();
      pmrem.dispose();
      renderer.dispose();
      if (domEl.parentNode === mountEl) {
        mountEl.removeChild(domEl);
      }
    };
  }, []);

  // React prop → WebGL imperative synchronization (zero remounts)
  useEffect(() => {
    cameraCmdRef.current?.switchAppliance(applianceId);
  }, [applianceId]);

  useEffect(() => {
    cameraCmdRef.current?.focusPart(selectedPartId);
  }, [selectedPartId]);

  useEffect(() => {
    cameraCmdRef.current?.wake();
  }, [explode, xrayMode, secondaryPartIds]);

  useEffect(() => {
    if (cameraPreset.seq > 0) {
      cameraCmdRef.current?.applyPreset(cameraPreset.mode);
    }
  }, [cameraPreset.mode, cameraPreset.seq]);

  useEffect(() => {
    if (zoomAction && zoomAction.seq > 0) {
      cameraCmdRef.current?.zoomBy(zoomAction.dir === "in" ? 0.84 : 1.19);
    }
  }, [zoomAction?.dir, zoomAction?.seq]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const cmd = cameraCmdRef.current;
    if (!cmd) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      cmd.nudgeOrbit(0.28, 0);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      cmd.nudgeOrbit(-0.28, 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      cmd.nudgeOrbit(0, -0.14);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      cmd.nudgeOrbit(0, 0.14);
    } else if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      cmd.zoomBy(0.84);
    } else if (e.key === "-" || e.key === "_") {
      e.preventDefault();
      cmd.zoomBy(1.19);
    } else if (e.key === "r" || e.key === "R") {
      cmd.applyPreset("reset");
    } else if (e.key === "Escape" && selectedPartId) {
      onSelectPart(null);
    }
  };

  if (webglUnavailable) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-slate-100 dark:bg-primary-dark px-6 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
          {activeMeta.label} · Bauteilübersicht
        </p>
        <p className="mt-2 max-w-md text-sm font-semibold text-primary dark:text-slate-100">
          Die interaktive 3D-Ansicht ist in diesem Browser aktuell nicht aktiv.
        </p>
        <p className="mt-1 max-w-md text-xs text-ink-muted">
          Wählen Sie einfach das gesuchte Original-Ersatzteil direkt über den
          Symptom-Schnellfinder oder die Bauteil-Auswahl unten aus.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={outerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label={`Interaktive 3D-Ansicht: ${activeMeta.label}. Ziehen zum Drehen, Pfeiltasten zum Drehen, Plus und Minus zum Zoomen.`}
      className="relative h-full w-full select-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
    >
      {/* Isolated WebGL canvas mount (smooth reveal once shaders compile) */}
      <div
        ref={canvasMountRef}
        className={`absolute inset-0 transition-opacity duration-300 ${
          canvasReady ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Desktop/Tablet projected 3D spare-part hotspot pins (hidden on <768px for collision-free mobile UX) */}
      <div
        aria-label="Anklickbare Bauteile im 3D-Modell"
        className="pointer-events-none absolute inset-0 z-10 hidden md:block overflow-hidden"
      >
        {activeMeta.parts.map((part) => {
          const isSelected = selectedPartId === part.id;
          const isSecondary = !isSelected && secondaryPartIds.includes(part.id);
          const isHovered = hoveredPartId === part.id;
          return (
            <button
              key={`${applianceId}-${part.id}`}
              ref={(el) => {
                pinRefs.current[part.id] = el;
              }}
              type="button"
              onClick={() => onSelectPart(isSelected ? null : part.id)}
              style={{
                opacity: 0,
                pointerEvents: "none",
                transform: "translate3d(-999px, -999px, 0)",
              }}
              aria-pressed={isSelected}
              title={`${part.code} · ${part.name}`}
              className={`group absolute top-0 left-0 inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10.5px] lg:text-[11px] font-extrabold whitespace-nowrap shadow-[0_6px_18px_-6px_rgba(15,23,42,0.55)] transition-colors duration-150 cursor-pointer touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                isSelected
                  ? "border-emerald-400 bg-emerald-600 text-white z-20"
                  : isSecondary
                    ? "border-amber-400 bg-amber-500 text-white z-20"
                    : isHovered
                      ? "border-sky-400 bg-sky-600 text-white z-20"
                      : "border-primary/20 dark:border-white/25 bg-white/95 dark:bg-slate-900/95 text-primary dark:text-white hover:border-accent hover:bg-accent hover:text-white z-10"
              }`}
            >
              <span
                className={`inline-flex h-4 w-4 items-center justify-center rounded-full font-mono text-[9.5px] font-black tabular-nums shrink-0 ${
                  isSelected || isSecondary || isHovered
                    ? "bg-white/20 text-white"
                    : "bg-primary/10 dark:bg-white/12 text-accent dark:text-sky-300 group-hover:bg-white/20 group-hover:text-white"
                }`}
              >
                {part.code}
              </span>
              <span className="max-w-[104px] lg:max-w-[118px] truncate pr-0.5">{part.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
