"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
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
  detectSoftwareWebGL,
  EXPLORER_BG_FRAG,
  EXPLORER_BG_VERT,
} from "./studioCore";
import { buildWasherAssembly } from "./buildWasher";
import { buildDishwasherAssembly } from "./buildDishwasher";
import { buildOvenAssembly } from "./buildOven";
import { buildFridgeAssembly } from "./buildFridge";

export interface Explorer3DCanvasProps {
  applianceId: ExplorerApplianceId;
  explode: number; // 0..1
  selectedPartId: string | null;
  cameraPreset: { mode: "overview" | "interior" | "reset"; seq: number };
  prefersReducedMotion: boolean;
  onSelectPart: (partId: string | null) => void;
}

// Pre-allocated scratch math objects (zero per-frame GC allocations)
const _raycaster = new THREE.Raycaster();
const _pointerNdc = new THREE.Vector2();
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _projVec = new THREE.Vector3();
const _emissiveTarget = new THREE.Color();
const _selectedColor = new THREE.Color(0x10b981);
const _hoverColor = new THREE.Color(0x38bdf8);
const _zeroColor = new THREE.Color(0x000000);

// Default camera spherical angles (3/4 studio hero view)
const DEFAULT_THETA = 0.56;
const DEFAULT_PHI = 1.24;
const DEFAULT_RADIUS_DESKTOP = 4.25;
const DEFAULT_RADIUS_MOBILE = 4.75;

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export default function Explorer3DCanvas({
  applianceId,
  explode,
  selectedPartId,
  cameraPreset,
  prefersReducedMotion,
  onSelectPart,
}: Explorer3DCanvasProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const pinRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const [webglUnavailable, setWebglUnavailable] = useState(false);
  const [hoveredPartId, setHoveredPartId] = useState<string | null>(null);

  // Latest React props mirrored into refs for zero-reinit rAF reading
  const propsRef = useRef({
    applianceId,
    explode,
    selectedPartId,
    prefersReducedMotion,
    onSelectPart,
  });
  propsRef.current = {
    applianceId,
    explode,
    selectedPartId,
    prefersReducedMotion,
    onSelectPart,
  };

  // Camera control ref so React effects can trigger smooth camera transitions
  const cameraCmdRef = useRef<{
    applyPreset: (mode: "overview" | "interior" | "reset") => void;
    focusPart: (partId: string | null) => void;
    switchAppliance: (id: ExplorerApplianceId) => void;
  } | null>(null);

  const activeMeta = getApplianceMeta(applianceId);

  useEffect(() => {
    const outerEl = outerRef.current;
    const mountEl = canvasMountRef.current;
    if (!outerEl || !mountEl) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const isNarrowViewport = window.innerWidth < 640;

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
        powerPreference: "high-performance",
        stencil: false,
        depth: true,
      });
    } catch {
      setWebglUnavailable(true);
      return;
    }

    const dprCap = isSoftwareGl ? 1 : isNarrowViewport ? 1.5 : 2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.autoClear = false;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const domEl = renderer.domElement;
    domEl.style.display = "block";
    domEl.style.width = "100%";
    domEl.style.height = "100%";
    // CRITICAL MOBILE ERGONOMICS: Never trap vertical page scrolling!
    domEl.style.touchAction = "pan-y";
    domEl.style.cursor = "grab";
    domEl.setAttribute("aria-hidden", "true");
    mountEl.appendChild(domEl);

    // ── Pass 0: Dual-Theme GLSL Studio Cyclorama & Radial Floor Rings ──
    const bgScene = new THREE.Scene();
    const bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const bgUniforms = {
      uTime: { value: 0 },
      uDarkMix: { value: document.documentElement.classList.contains("dark") ? 1 : 0 },
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

    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 45);
    camera.layers.enable(0);
    camera.layers.enable(1);
    _raycaster.layers.set(1);

    // ── Studio Lighting (ZERO RectAreaLight — GPU-friendly on mobile) ──
    const hemiLight = new THREE.HemisphereLight(0xf0f9ff, 0x1e293b, 0.86);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.52);
    keyLight.position.set(4.1, 5.6, 4.5);
    keyLight.castShadow = !isSoftwareGl;
    if (!isSoftwareGl) {
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

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
    rimLight.position.set(-4.3, 2.7, -3.5);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.34);
    fillLight.position.set(-3.0, 1.5, 3.6);
    scene.add(fillLight);

    // ── Grounded Contact Shadow & Receiver Plane ──
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
      trackGeo(new THREE.PlaneGeometry(3.5, 3.5)),
      contactMat,
    );
    contactPlane.rotation.x = -Math.PI / 2;
    contactPlane.position.y = -1.18;
    scene.add(contactPlane);

    if (!isSoftwareGl) {
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

    // ── Build All 4 Modular Appliance Assemblies Once ──
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const brushedTex = trackTex(createBrushedSteelTexture(maxAniso));
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

    const assemblies: Record<ExplorerApplianceId, BuiltApplianceAssembly> = {
      waschmaschine: buildWasherAssembly(builderCtx),
      geschirrspueler: buildDishwasherAssembly(builderCtx),
      backofen: buildOvenAssembly(builderCtx),
      kuehlschrank: buildFridgeAssembly(builderCtx),
    };

    (Object.keys(assemblies) as ExplorerApplianceId[]).forEach((id) => {
      const asm = assemblies[id];
      asm.root.visible = id === propsRef.current.applianceId;
      stageGroup.add(asm.root);
    });

    // ── Sizing & ResizeObserver ──
    let width = 1;
    let height = 1;
    const syncSize = () => {
      const rect = mountEl.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      bgUniforms.uResolution.value.set(width, height);
    };
    syncSize();

    const resizeObserver = new ResizeObserver(syncSize);
    resizeObserver.observe(mountEl);

    // ── Dark Mode Observer (Light Mode porcelain ↔ Dark Mode #0F2A4A) ──
    let targetDarkMix = document.documentElement.classList.contains("dark") ? 1 : 0;
    let curDarkMix = targetDarkMix;
    const applyThemeLighting = (mix: number) => {
      bgUniforms.uDarkMix.value = mix;
      // Calibrate environment reflections so Dark Mode metals stay sculpted, never washed out
      scene.environmentIntensity = THREE.MathUtils.lerp(1.02, 0.56, mix);
      contactMat.opacity = THREE.MathUtils.lerp(0.42, 0.64, mix);
      hemiLight.intensity = THREE.MathUtils.lerp(0.96, 0.64, mix);
      rimLight.intensity = THREE.MathUtils.lerp(0.75, 1.05, mix);
    };
    applyThemeLighting(curDarkMix);

    const themeObserver = new MutationObserver(() => {
      targetDarkMix = document.documentElement.classList.contains("dark") ? 1 : 0;
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // ── Damped Spherical Camera & Custom Touch-Safe Orbit State ──
    const getBaseRadius = () => (width < 640 ? DEFAULT_RADIUS_MOBILE : DEFAULT_RADIUS_DESKTOP);

    let targetTheta = DEFAULT_THETA;
    let targetPhi = DEFAULT_PHI;
    let targetRadius = getBaseRadius();
    const targetLookAt = new THREE.Vector3(0, 0.02, 0);

    let curTheta = targetTheta;
    let curPhi = targetPhi;
    let curRadius = targetRadius;
    const curLookAt = targetLookAt.clone();

    let curExplode = propsRef.current.explode;
    let activeAssemblyId: ExplorerApplianceId = propsRef.current.applianceId;
    let stageSwitchScale = 1;
    let lastUserInteractMs = 0;

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
      for (const part of asm.parts) {
        if (part.clickableMeshes.includes(hitObj)) {
          return part.meta.id;
        }
      }
      return null;
    };

    const raycastAtClientPoint = (clientX: number, clientY: number): string | null => {
      const rect = domEl.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      _pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      _pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      _raycaster.setFromCamera(_pointerNdc, camera);
      const asm = assemblies[activeAssemblyId];
      const allClickables: THREE.Object3D[] = [];
      for (let i = 0; i < asm.parts.length; i++) {
        const meshes = asm.parts[i].clickableMeshes;
        for (let j = 0; j < meshes.length; j++) {
          allClickables.push(meshes[j]);
        }
      }
      const hits = _raycaster.intersectObjects(allClickables, false);
      if (hits.length === 0) return null;
      return resolvePartFromMesh(asm, hits[0].object);
    };

    // Expose imperative commands to React prop effects
    cameraCmdRef.current = {
      applyPreset: (mode) => {
        const baseR = getBaseRadius();
        if (mode === "overview" || mode === "reset") {
          targetTheta = DEFAULT_THETA;
          targetPhi = DEFAULT_PHI;
          targetRadius = baseR;
          targetLookAt.set(0, 0.02, 0);
        } else if (mode === "interior") {
          targetTheta = 0.24;
          targetPhi = 1.34;
          targetRadius = baseR * 0.78;
          targetLookAt.set(0, 0.04, 0.16);
        }
        lastUserInteractMs = performance.now();
      },
      focusPart: (partId) => {
        const asm = assemblies[activeAssemblyId];
        const part = findPartById(asm, partId);
        if (!part) {
          targetLookAt.set(0, 0.02, 0);
          targetRadius = getBaseRadius();
          return;
        }
        const ex = propsRef.current.explode;
        // Compute target exploded position in stage space
        _vec3A
          .copy(part.basePosition)
          .addScaledVector(part.explodeOffset, ex);
        targetLookAt.copy(_vec3A);

        // Compute clean viewing angle from part's focusOffset
        _vec3B.copy(part.focusOffset);
        const dist = clamp(_vec3B.length() * (width < 640 ? 1.18 : 1.02), 2.15, 3.85);
        const theta = Math.atan2(_vec3B.x, _vec3B.z);
        const phi = clamp(Math.acos(clamp(_vec3B.y / Math.max(_vec3B.length(), 0.001), -0.9, 0.9)), 0.76, 1.88);
        targetTheta = theta;
        targetPhi = phi;
        targetRadius = dist;
        lastUserInteractMs = performance.now();
      },
      switchAppliance: (id) => {
        if (activeAssemblyId === id) return;
        assemblies[activeAssemblyId].root.visible = false;
        activeAssemblyId = id;
        assemblies[activeAssemblyId].root.visible = true;
        stageSwitchScale = propsRef.current.prefersReducedMotion ? 1 : 0.93;
        targetLookAt.set(0, 0.02, 0);
        targetRadius = getBaseRadius();
        targetTheta = DEFAULT_THETA;
        targetPhi = DEFAULT_PHI;
        localHoveredPartId = null;
        setHoveredPartId(null);
      },
    };

    // ── Custom Pointer & Touch Gesture Handler (Zero Vertical Scroll Trapping) ──
    let activePointerId: number | null = null;
    let activePointerType = "mouse";
    let downX = 0;
    let downY = 0;
    let lastX = 0;
    let lastY = 0;
    let totalTravel = 0;
    let touchIntent: "undecided" | "orbit" | "scroll" = "undecided";

    const onPointerDown = (e: PointerEvent) => {
      if (activePointerId !== null) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      activePointerId = e.pointerId;
      activePointerType = e.pointerType;
      downX = e.clientX;
      downY = e.clientY;
      lastX = e.clientX;
      lastY = e.clientY;
      totalTravel = 0;
      touchIntent = e.pointerType === "mouse" ? "orbit" : "undecided";
      if (e.pointerType === "mouse") {
        domEl.style.cursor = "grabbing";
        try {
          domEl.setPointerCapture(e.pointerId);
        } catch {
          // Ignore capture failures
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      // Desktop hover raycast when not dragging
      if (activePointerId === null) {
        if (e.pointerType === "mouse") {
          const now = performance.now();
          if (now - lastHoverRaycastMs > 42) {
            lastHoverRaycastMs = now;
            const hitId = raycastAtClientPoint(e.clientX, e.clientY);
            if (hitId !== localHoveredPartId) {
              localHoveredPartId = hitId;
              setHoveredPartId(hitId);
              domEl.style.cursor = hitId ? "pointer" : "grab";
            }
          }
        }
        return;
      }

      if (e.pointerId !== activePointerId) return;

      const stepDx = e.clientX - lastX;
      const stepDy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      totalTravel += Math.hypot(stepDx, stepDy);

      if (activePointerType === "touch") {
        if (touchIntent === "undecided") {
          const netDx = Math.abs(e.clientX - downX);
          const netDy = Math.abs(e.clientY - downY);
          if (netDx > 7 || netDy > 7) {
            // Only lock horizontal orbit if clearly horizontal; vertical stays native page scroll!
            touchIntent = netDx > netDy * 1.15 ? "orbit" : "scroll";
          } else {
            return;
          }
        }
        if (touchIntent === "scroll") {
          return;
        }
        // Horizontal single-finger orbit (smooth & natural)
        targetTheta -= stepDx * 0.0082;
        lastUserInteractMs = performance.now();
        return;
      }

      // Desktop mouse orbit (azimuth + elevation)
      targetTheta -= stepDx * 0.0072;
      targetPhi = clamp(targetPhi - stepDy * 0.0056, 0.64, 2.08);
      lastUserInteractMs = performance.now();
    };

    const finishPointer = (e: PointerEvent, isCancel: boolean) => {
      if (e.pointerId !== activePointerId) return;
      const wasTap = !isCancel && totalTravel < 9;
      if (activePointerType === "mouse") {
        try {
          if (domEl.hasPointerCapture(e.pointerId)) {
            domEl.releasePointerCapture(e.pointerId);
          }
        } catch {
          // Ignore
        }
        domEl.style.cursor = localHoveredPartId ? "pointer" : "grab";
      }
      activePointerId = null;
      touchIntent = "undecided";

      if (wasTap) {
        const hitId = raycastAtClientPoint(e.clientX, e.clientY);
        if (hitId) {
          propsRef.current.onSelectPart(hitId);
        } else if (propsRef.current.selectedPartId !== null) {
          propsRef.current.onSelectPart(null);
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => finishPointer(e, false);
    const onPointerCancel = (e: PointerEvent) => finishPointer(e, true);
    const onPointerLeave = () => {
      if (activePointerId === null && localHoveredPartId !== null) {
        localHoveredPartId = null;
        setHoveredPartId(null);
        domEl.style.cursor = "grab";
      }
    };

    domEl.addEventListener("pointerdown", onPointerDown, { passive: true });
    domEl.addEventListener("pointermove", onPointerMove, { passive: true });
    domEl.addEventListener("pointerup", onPointerUp, { passive: true });
    domEl.addEventListener("pointercancel", onPointerCancel, { passive: true });
    domEl.addEventListener("pointerleave", onPointerLeave, { passive: true });

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
    };
    domEl.addEventListener("webglcontextlost", onContextLost, false);
    domEl.addEventListener("webglcontextrestored", onContextRestored, false);

    // ── Automatic Offscreen & Tab-Hidden rAF Pausing ──
    let isVisibleInViewport = true;
    let isTabVisible = !document.hidden;
    let rafId: number | null = null;
    let disposed = false;
    let lastFrameMs = performance.now();
    let elapsedSec = 0;

    // Software WebGL2 fence pacing to avoid main-thread lockups
    const glCtx = renderer.getContext();
    const gl2 =
      isSoftwareGl && typeof WebGL2RenderingContext !== "undefined" && glCtx instanceof WebGL2RenderingContext
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
            if (disposed) {
              gl2.deleteSync(sync);
              return;
            }
            const status = gl2.clientWaitSync(sync, 0, 0);
            if (status === gl2.TIMEOUT_EXPIRED) {
              rafId = window.requestAnimationFrame(waitFence);
              return;
            }
            gl2.deleteSync(sync);
            rafId = window.requestAnimationFrame(afterDrawFn);
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

      // Smoothly damp theme mix
      curDarkMix = THREE.MathUtils.damp(curDarkMix, targetDarkMix, 7, delta);
      applyThemeLighting(curDarkMix);

      // Smoothly damp explode value
      const targetExplode = propsRef.current.explode;
      curExplode = reduced
        ? targetExplode
        : THREE.MathUtils.damp(curExplode, targetExplode, 7.5, delta);
      bgUniforms.uTime.value = elapsedSec;
      bgUniforms.uExplode.value = curExplode;

      // Gentle idle studio turntable drift when untouched and no part focused
      if (
        !reduced &&
        activePointerId === null &&
        propsRef.current.selectedPartId === null &&
        nowMs - lastUserInteractMs > 3200
      ) {
        targetTheta += delta * 0.14;
      }

      // Smoothly damp camera spherical coordinates
      const camLambda = reduced ? 30 : 6.8;
      curTheta = THREE.MathUtils.damp(curTheta, targetTheta, camLambda, delta);
      curPhi = THREE.MathUtils.damp(curPhi, targetPhi, camLambda, delta);
      curRadius = THREE.MathUtils.damp(curRadius, targetRadius, camLambda, delta);
      curLookAt.x = THREE.MathUtils.damp(curLookAt.x, targetLookAt.x, camLambda, delta);
      curLookAt.y = THREE.MathUtils.damp(curLookAt.y, targetLookAt.y, camLambda, delta);
      curLookAt.z = THREE.MathUtils.damp(curLookAt.z, targetLookAt.z, camLambda, delta);

      const sinPhi = Math.sin(curPhi);
      camera.position.set(
        curLookAt.x + curRadius * sinPhi * Math.sin(curTheta),
        curLookAt.y + curRadius * Math.cos(curPhi),
        curLookAt.z + curRadius * sinPhi * Math.cos(curTheta),
      );
      camera.lookAt(curLookAt);

      // Smooth stage pop-in on appliance switch
      stageSwitchScale = THREE.MathUtils.damp(stageSwitchScale, 1, 10, delta);
      stageGroup.scale.setScalar(stageSwitchScale);

      // Animate active appliance cutaway + spare parts
      const asm = assemblies[activeAssemblyId];
      asm.animate(elapsedSec, delta, curExplode);

      // Cutaway shell translucency + architectural edge reveal
      const shellFade = 1 - curExplode * 0.78;
      for (let i = 0; i < asm.chassisMaterials.length; i++) {
        const mat = asm.chassisMaterials[i];
        const baseOp = asm.chassisBaseOpacities[i] ?? 1;
        mat.opacity = Math.max(0.16, baseOp * shellFade);
        mat.depthWrite = curExplode < 0.1;
      }
      const edgeOp =
        THREE.MathUtils.smoothstep(curExplode, 0.08, 0.45) *
        THREE.MathUtils.lerp(0.32, 0.48, curDarkMix);
      for (let i = 0; i < asm.edgeMaterials.length; i++) {
        asm.edgeMaterials[i].opacity = edgeOp;
      }

      const selId = propsRef.current.selectedPartId;
      const showDesktopPins = width >= 640 && curExplode >= 0.24;

      // Update each spare part position, leader line, emissive highlight & desktop pin
      for (let i = 0; i < asm.parts.length; i++) {
        const part = asm.parts[i];
        part.group.position
          .copy(part.basePosition)
          .addScaledVector(part.explodeOffset, curExplode);

        // Engineering dashed leader line
        const showLeader = curExplode > 0.05;
        part.leaderLine.visible = showLeader;
        if (showLeader) {
          const posAttr = part.leaderLine.geometry.getAttribute(
            "position",
          ) as THREE.BufferAttribute;
          posAttr.setXYZ(0, part.leaderOrigin.x, part.leaderOrigin.y, part.leaderOrigin.z);
          posAttr.setXYZ(1, part.group.position.x, part.group.position.y, part.group.position.z);
          posAttr.needsUpdate = true;
          part.leaderLine.computeLineDistances();
        }

        // Tactile emissive highlight for selected / hovered parts
        const isSelected = selId === part.meta.id;
        const isHovered = localHoveredPartId === part.meta.id;
        const targetIntensity = isSelected ? 0.44 : isHovered ? 0.26 : 0.08;
        _emissiveTarget.copy(
          isSelected ? _selectedColor : isHovered ? _hoverColor : _zeroColor,
        );

        for (let m = 0; m < part.highlightMaterials.length; m++) {
          const hm = part.highlightMaterials[m];
          if (isSelected || isHovered) {
            hm.emissive.lerp(_emissiveTarget, clamp(delta * 10, 0, 1));
            hm.emissiveIntensity = THREE.MathUtils.damp(
              hm.emissiveIntensity,
              targetIntensity,
              10,
              delta,
            );
          } else {
            hm.emissiveIntensity = THREE.MathUtils.damp(hm.emissiveIntensity, 0.08, 8, delta);
          }
        }

        // Direct DOM projection for desktop floating pins (zero React re-renders!)
        const pinEl = pinRefs.current[part.meta.id];
        if (pinEl) {
          if (showDesktopPins) {
            _projVec.copy(part.group.position).add(part.anchorLocal);
            _projVec.applyMatrix4(stageGroup.matrixWorld);
            _projVec.project(camera);

            const inFrustum = _projVec.z > -1 && _projVec.z < 1;
            if (inFrustum) {
              const px = clamp((_projVec.x * 0.5 + 0.5) * width, 28, width - 28);
              const py = clamp((-_projVec.y * 0.5 + 0.5) * height, 52, height - 74);
              const pinFade = clamp((curExplode - 0.24) / 0.16, 0, 1);
              pinEl.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0) translate(-50%, -50%)`;
              pinEl.style.opacity = pinFade.toFixed(3);
              pinEl.style.pointerEvents = pinFade > 0.45 ? "auto" : "none";
            } else {
              pinEl.style.opacity = "0";
              pinEl.style.pointerEvents = "none";
            }
          } else {
            pinEl.style.opacity = "0";
            pinEl.style.pointerEvents = "none";
          }
        }
      }

      // Render Pass 0 (cyclorama) + Pass 1 (3D studio)
      renderer.clear(true, true, false);
      renderer.render(bgScene, bgCamera);
      renderer.clearDepth();
      renderer.render(scene, camera);

      scheduleNextFrame(tick);
    };

    const ensureRunning = () => {
      if (disposed || rafId !== null || !isVisibleInViewport || !isTabVisible || contextLost) {
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
    };

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisibleInViewport = Boolean(entry && entry.isIntersecting);
        if (isVisibleInViewport) {
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
        ensureRunning();
      } else {
        stopLoop();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    ensureRunning();

    return () => {
      disposed = true;
      cameraCmdRef.current = null;
      stopLoop();
      io.disconnect();
      resizeObserver.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);

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
    if (cameraPreset.seq > 0) {
      cameraCmdRef.current?.applyPreset(cameraPreset.mode);
    }
  }, [cameraPreset.mode, cameraPreset.seq]);

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
          Wählen Sie einfach das gesuchte Original-Ersatzteil direkt über die Bauteil-Auswahl
          unten aus.
        </p>
      </div>
    );
  }

  return (
    <div ref={outerRef} className="relative h-full w-full select-none">
      {/* Isolated WebGL canvas mount (zero React children inside) */}
      <div ref={canvasMountRef} className="absolute inset-0" />

      {/* Desktop-only projected 3D spare-part hotspot pins (hidden on <640px for collision-free mobile UX) */}
      <div
        aria-label="Anklickbare Bauteile im 3D-Modell"
        className="pointer-events-none absolute inset-0 z-10 hidden sm:block overflow-hidden"
      >
        {activeMeta.parts.map((part) => {
          const isSelected = selectedPartId === part.id;
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
              className={`group absolute top-0 left-0 inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-extrabold shadow-[0_6px_18px_-6px_rgba(15,23,42,0.55)] transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                isSelected
                  ? "border-emerald-400 bg-emerald-600 text-white z-20"
                  : isHovered
                    ? "border-sky-400 bg-sky-600 text-white z-20"
                    : "border-primary/20 dark:border-white/25 bg-white/95 dark:bg-slate-900/95 text-primary dark:text-white hover:border-accent hover:bg-accent hover:text-white z-10"
              }`}
            >
              <span
                className={`inline-flex h-4 w-4 items-center justify-center rounded-full font-mono text-[9.5px] font-black tabular-nums ${
                  isSelected
                    ? "bg-white/20 text-white"
                    : isHovered
                      ? "bg-white/20 text-white"
                      : "bg-primary/10 dark:bg-white/12 text-accent dark:text-sky-300 group-hover:bg-white/20 group-hover:text-white"
                }`}
              >
                {part.code}
              </span>
              <span className="max-w-[118px] truncate pr-0.5">{part.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
