import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export type Section3DVariant =
  | "hero-water-drum"
  | "about-heritage-emblem"
  | "pillars-parts-trio"
  | "process-bearing-orbit"
  | "reviews-crystal-drops"
  | "inquiry-seal-coil"
  | "subpage-header";

interface Section3DSceneProps {
  variant: Section3DVariant;
  /** Optional string seed to vary the floating sculpture per subpage header */
  seedKey?: string;
  className?: string;
}

function detectSoftwareWebGL(renderer: THREE.WebGLRenderer): boolean {
  try {
    const gl = renderer.getContext();
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    if (!dbg) return false;
    const rendererStr = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || "");
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(rendererStr);
  } catch {
    return false;
  }
}

/* ───────────────────────────────────────────────────────────────────────────
   Hero-Only Liquid Silk Water Shader (soft Antigravity motion, never harsh)
─────────────────────────────────────────────────────────────────────────── */

const HERO_WATER_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const HERO_WATER_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uPointer;
  uniform float uScrollLocal;

  float hash21(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 34.53);
    return fract(p.x * p.y);
  }

  float smoothNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    return mix(
      mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
      mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float waveH(vec2 p, vec2 uv, float t) {
    vec2 q = p + vec2(0.0, uScrollLocal * 0.25);
    vec2 w = vec2(
      smoothNoise(q * 0.9 + vec2(t * 0.14, -t * 0.11)),
      smoothNoise(q * 0.9 + vec2(-t * 0.12, t * 0.15) + 4.2)
    ) - 0.5;
    vec2 wp = q + w * 0.72;
    float h = sin(wp.x * 1.7 + wp.y * 0.9 + t * 0.58) * 0.34
            + cos(wp.x * 1.1 - wp.y * 1.8 - t * 0.44) * 0.28
            + (smoothNoise(wp * 2.0 + vec2(t * 0.2, -t * 0.16)) - 0.5) * 0.28;

    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 pd = (uv - uPointer) * vec2(aspect, 1.0);
    float d = length(pd);
    h += exp(-d * d * 8.0) * 0.18 + sin(d * 10.0 - t * 2.4) * exp(-d * 4.0) * 0.05;
    return h;
  }

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 p = (vUv - 0.5) * vec2(aspect, 1.0) * 1.9;
    float t = uTime;

    float eps = 0.038;
    float hC = waveH(p, vUv, t);
    float hX = waveH(p + vec2(eps, 0.0), vUv + vec2(eps / (1.9 * aspect), 0.0), t);
    float hY = waveH(p + vec2(0.0, eps), vUv + vec2(0.0, eps / 1.9), t);
    vec3 n = normalize(vec3((hC - hX) / eps, (hC - hY) / eps, 2.8));

    vec3 key = normalize(vec3(0.45, 0.65, 1.1));
    vec3 view = vec3(0.0, 0.0, 1.0);
    float diff = max(dot(n, key), 0.0);
    float spec = pow(max(dot(reflect(-key, n), view), 0.0), 34.0);
    float fresnel = pow(1.0 - max(dot(n, view), 0.0), 2.8);

    vec2 cUv = p * 1.45 + n.xy * 0.62;
    float rA = sin(cUv.x * 1.85 + sin(cUv.y * 1.35 + t * 0.38) + t * 0.42);
    float rB = cos(cUv.y * 1.65 - cos(cUv.x * 1.25 - t * 0.32) - t * 0.34);
    float caustic = pow(clamp(1.0 - abs(rA + rB) * 0.5, 0.0, 1.0), 3.4);

    vec3 deep = vec3(0.012, 0.042, 0.110);
    vec3 mid  = vec3(0.028, 0.155, 0.315);
    vec3 aqua = vec3(0.110, 0.480, 0.760);
    vec3 pearl = vec3(0.82, 0.95, 1.0);

    vec3 col = mix(deep, mid, smoothstep(-0.6, 0.7, hC * 0.8 + diff * 0.35));
    col = mix(col, aqua, clamp(caustic * 0.38 + fresnel * 0.32, 0.0, 0.68));
    col += pearl * (spec * 0.32 + caustic * 0.09);

    // Subtle right-side illumination bias so left typography stays calm and razor-sharp
    float leftCalm = smoothstep(0.0, 0.75, vUv.x);
    col *= mix(0.66, 1.04, leftCalm);

    gl_FragColor = vec4(col, 1.0);
  }
`;

/* ───────────────────────────────────────────────────────────────────────────
   Soft Rising Water Bubbles (used cleanly inside Hero water backdrop)
─────────────────────────────────────────────────────────────────────────── */

const BUBBLE_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vAlpha;

  void main() {
    vec3 pos = position;
    float speed = 0.025 + fract(aPhase * 2.13) * 0.032;
    float yLoop = fract((pos.y + 1.1) * 0.5 + uTime * speed) * 2.2 - 1.1;
    float xDrift = sin(uTime * 0.45 + aPhase * 6.283 + yLoop * 2.0) * 0.06;
    pos.x += xDrift;
    pos.y = yLoop;
    vAlpha = smoothstep(-1.1, -0.7, yLoop) * smoothstep(1.1, 0.7, yLoop) * 0.52;
    gl_Position = vec4(pos.xy, 0.0, 1.0);
    gl_PointSize = aSize * uPixelRatio;
  }
`;

const BUBBLE_FRAG = /* glsl */ `
  precision mediump float;
  varying float vAlpha;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float r = length(uv);
    if (r > 0.5) discard;
    float rim = smoothstep(0.28, 0.45, r) * (1.0 - smoothstep(0.45, 0.5, r));
    float glint = 1.0 - smoothstep(0.03, 0.14, length(uv - vec2(-0.14, -0.14)));
    vec3 col = mix(vec3(0.48, 0.86, 1.0), vec3(1.0), clamp(glint + rim * 0.7, 0.0, 1.0));
    gl_FragColor = vec4(col, clamp((rim * 0.65 + glint * 0.65) * vAlpha, 0.0, 0.62));
  }
`;

/* ───────────────────────────────────────────────────────────────────────────
   Procedural Spare-Part Model Builders (Unique Sculptures per Space)
─────────────────────────────────────────────────────────────────────────── */

interface BuiltSectionScene {
  update: (
    elapsed: number,
    delta: number,
    ptrX: number,
    ptrY: number,
    scrollFrac: number,
    aspect: number,
    isDark: boolean,
  ) => void;
  render: (renderer: THREE.WebGLRenderer) => void;
  onResize: (w: number, h: number, pr: number) => void;
  dispose: () => void;
}

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function createMaterials(isDarkSurface: boolean, disposables: { mats: THREE.Material[] }) {
  const trackMat = <T extends THREE.Material>(m: T): T => {
    disposables.mats.push(m);
    return m;
  };

  const steel = trackMat(
    new THREE.MeshStandardMaterial({
      color: isDarkSurface ? 0x93c5fd : 0x64748b,
      metalness: 0.88,
      roughness: 0.24,
      transparent: true,
      opacity: isDarkSurface ? 0.34 : 0.22,
    }),
  );

  const chrome = trackMat(
    new THREE.MeshStandardMaterial({
      color: isDarkSurface ? 0xe0f2fe : 0x38bdf8,
      metalness: 0.94,
      roughness: 0.14,
      transparent: true,
      opacity: isDarkSurface ? 0.42 : 0.26,
    }),
  );

  const brass = trackMat(
    new THREE.MeshStandardMaterial({
      color: isDarkSurface ? 0xfbbf24 : 0xd97706,
      metalness: 0.86,
      roughness: 0.28,
      transparent: true,
      opacity: isDarkSurface ? 0.34 : 0.22,
    }),
  );

  const aquaGlass = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: isDarkSurface ? 0x38bdf8 : 0x0ea5e9,
      metalness: 0.08,
      roughness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      transparent: true,
      opacity: isDarkSurface ? 0.36 : 0.24,
    }),
  );

  return { steel, chrome, brass, aquaGlass };
}

function buildDrumSculpture(
  mats: ReturnType<typeof createMaterials>,
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T,
): THREE.Group {
  const g = new THREE.Group();
  const outerRim = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.92, 0.065, 16, 52)), mats.chrome);
  const innerRim = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.76, 0.032, 14, 48)), mats.aquaGlass);
  innerRim.position.z = 0.08;
  const barrel = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.9, 0.9, 0.56, 40, 1, true)),
    mats.steel,
  );
  barrel.rotation.x = Math.PI / 2;
  barrel.position.z = -0.28;
  g.add(outerRim, innerRim, barrel);

  const paddleGeo = trackGeo(new THREE.BoxGeometry(0.11, 0.2, 0.46));
  for (let i = 0; i < 3; i++) {
    const holder = new THREE.Group();
    holder.rotation.z = (i * Math.PI * 2) / 3;
    const p = new THREE.Mesh(paddleGeo, mats.chrome);
    p.position.set(0, -0.78, -0.26);
    holder.add(p);
    g.add(holder);
  }
  return g;
}

function buildImpellerSculpture(
  mats: ReturnType<typeof createMaterials>,
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T,
): THREE.Group {
  const g = new THREE.Group();
  const hub = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.18, 0.2, 0.24, 24)), mats.chrome);
  hub.rotation.x = Math.PI / 2;
  const shroud = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.62, 0.05, 14, 40)), mats.aquaGlass);
  g.add(hub, shroud);

  const bladeGeo = trackGeo(new THREE.BoxGeometry(0.46, 0.075, 0.16));
  for (let i = 0; i < 4; i++) {
    const h = new THREE.Group();
    h.rotation.z = (i * Math.PI) / 2;
    const b = new THREE.Mesh(bladeGeo, mats.steel);
    b.position.x = 0.34;
    b.rotation.y = 0.28;
    h.add(b);
    g.add(h);
  }
  return g;
}

function buildHeatingCoilSculpture(
  mats: ReturnType<typeof createMaterials>,
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T,
): THREE.Group {
  const g = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.34, -0.58, 0),
    new THREE.Vector3(-0.35, 0.4, 0.04),
    new THREE.Vector3(-0.18, 0.64, 0.05),
    new THREE.Vector3(-0.07, 0.35, 0),
    new THREE.Vector3(0.07, 0.35, 0),
    new THREE.Vector3(0.18, 0.64, -0.05),
    new THREE.Vector3(0.35, 0.4, -0.04),
    new THREE.Vector3(0.34, -0.58, 0),
  ]);
  const tube = new THREE.Mesh(trackGeo(new THREE.TubeGeometry(curve, 64, 0.052, 12, false)), mats.chrome);
  const flange = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.24, 0.24, 0.1, 20)), mats.brass);
  flange.position.set(0, -0.62, 0);
  flange.scale.set(1.75, 1, 0.72);
  g.add(tube, flange);
  return g;
}

function buildBearingSculpture(
  mats: ReturnType<typeof createMaterials>,
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T,
): THREE.Group {
  const g = new THREE.Group();
  const outer = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.64, 0.105, 16, 44)), mats.chrome);
  const inner = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.32, 0.085, 16, 36)), mats.steel);
  const cage = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.48, 0.025, 10, 36)), mats.brass);
  g.add(outer, inner, cage);

  const ballGeo = trackGeo(new THREE.SphereGeometry(0.078, 12, 12));
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI * 2) / 10;
    const b = new THREE.Mesh(ballGeo, mats.chrome);
    b.position.set(Math.cos(a) * 0.48, Math.sin(a) * 0.48, 0);
    g.add(b);
  }
  return g;
}

function buildSealAndCoilSculpture(
  mats: ReturnType<typeof createMaterials>,
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T,
): THREE.Group {
  const g = new THREE.Group();
  const fold1 = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.62, 0.085, 14, 42)), mats.steel);
  const fold2 = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.50, 0.06, 14, 38)), mats.aquaGlass);
  fold2.position.z = 0.12;
  const springRing = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.68, 0.022, 10, 44)), mats.brass);
  springRing.position.z = -0.08;
  g.add(fold1, fold2, springRing);
  return g;
}

function buildPulleySculpture(
  mats: ReturnType<typeof createMaterials>,
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T,
): THREE.Group {
  const g = new THREE.Group();
  const rim = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.64, 0.068, 14, 44)), mats.chrome);
  const hub = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.18, 0.05, 12, 24)), mats.brass);
  g.add(rim, hub);
  const spokeGeo = trackGeo(new THREE.BoxGeometry(0.06, 0.48, 0.045));
  for (let i = 0; i < 6; i++) {
    const h = new THREE.Group();
    h.rotation.z = (i * Math.PI) / 3;
    const bar = new THREE.Mesh(spokeGeo, mats.steel);
    bar.position.y = 0.38;
    h.add(bar);
    g.add(h);
  }
  return g;
}

function buildHeritageEmblemSculpture(
  mats: ReturnType<typeof createMaterials>,
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T,
): THREE.Group {
  const g = new THREE.Group();
  // Outer brushed stainless precision ring
  const outerRing = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(1.08, 0.048, 18, 64)),
    mats.chrome,
  );
  // Tilted brushed brass chronometer gimbal
  const brassGimbal = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.84, 0.034, 16, 56)),
    mats.brass,
  );
  brassGimbal.rotation.set(0.62, 0.38, 0);

  // Inner counter-tilted steel ring
  const innerRing = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.62, 0.028, 14, 48)),
    mats.steel,
  );
  innerRing.rotation.set(-0.55, 0.52, 0.25);

  // Optical aqua-crystal faceted core
  const core = new THREE.Mesh(
    trackGeo(new THREE.OctahedronGeometry(0.26, 1)),
    mats.aquaGlass,
  );

  g.add(outerRing, brassGimbal, innerRing, core);

  // 12 precision index markers around outer dial ring
  const tickGeo = trackGeo(new THREE.BoxGeometry(0.032, 0.11, 0.032));
  for (let i = 0; i < 12; i++) {
    const holder = new THREE.Group();
    holder.rotation.z = (i * Math.PI * 2) / 12;
    const tick = new THREE.Mesh(tickGeo, i % 3 === 0 ? mats.brass : mats.chrome);
    tick.position.y = 1.08;
    holder.add(tick);
    g.add(holder);
  }
  return g;
}

function createSectionScene(
  variant: Section3DVariant,
  seedKey: string,
  renderer: THREE.WebGLRenderer,
  width: number,
  height: number,
  pixelRatio: number,
  isSoftwareGl: boolean,
): BuiltSectionScene {
  const geos: THREE.BufferGeometry[] = [];
  const mats: THREE.Material[] = [];
  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geos.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    mats.push(m);
    return m;
  };

  const isDarkVariant =
    variant === "hero-water-drum" ||
    variant === "about-heritage-emblem" ||
    variant === "subpage-header";
  const initialDark =
    isDarkVariant ||
    (typeof document !== "undefined" && document.documentElement.classList.contains("dark"));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, Math.max(width, 1) / Math.max(height, 1), 0.1, 25);
  camera.position.set(0, 0, 5.2);

  // Studio Environment IBL for real metallic PBR specular reflections
  const pmrem = new THREE.PMREMGenerator(renderer);
  const roomEnv = new RoomEnvironment();
  const envRT = pmrem.fromScene(roomEnv, 0.04);
  scene.environment = envRT.texture;
  roomEnv.dispose();

  const hemi = new THREE.HemisphereLight(0xe0f2fe, 0x0f172a, 1.1);
  const key = new THREE.DirectionalLight(0xffffff, 1.9);
  key.position.set(4, 5, 4);
  const rim = new THREE.DirectionalLight(0x38bdf8, 1.4);
  rim.position.set(-4, -2, 3);
  scene.add(hemi, key, rim);

  const pbr = createMaterials(initialDark, { mats });

  // Optional pass-0 liquid silk water background (exclusively for Hero & Subpage Headers)
  let bgScene: THREE.Scene | null = null;
  let orthoCam: THREE.OrthographicCamera | null = null;
  let waterUniforms: {
    uTime: { value: number };
    uResolution: { value: THREE.Vector2 };
    uPointer: { value: THREE.Vector2 };
    uScrollLocal: { value: number };
  } | null = null;
  let bubbleUniforms: {
    uTime: { value: number };
    uPixelRatio: { value: number };
  } | null = null;

  if (
    variant === "hero-water-drum" ||
    variant === "about-heritage-emblem" ||
    variant === "subpage-header"
  ) {
    bgScene = new THREE.Scene();
    orthoCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    waterUniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(width, height) },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uScrollLocal: { value: 0 },
    };

    const quadMat = trackMat(
      new THREE.ShaderMaterial({
        uniforms: waterUniforms,
        vertexShader: HERO_WATER_VERT,
        fragmentShader: HERO_WATER_FRAG,
        depthWrite: false,
        depthTest: false,
      }),
    );
    bgScene.add(new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(2, 2)), quadMat));

    const bCount = isSoftwareGl ? 24 : variant === "hero-water-drum" ? 54 : 30;
    const bPos = new Float32Array(bCount * 3);
    const bSize = new Float32Array(bCount);
    const bPhase = new Float32Array(bCount);
    for (let i = 0; i < bCount; i++) {
      const s1 = Math.sin(i * 12.9898 + 1.4) * 43758.5453;
      const r1 = s1 - Math.floor(s1);
      const s2 = Math.sin(i * 78.233 + 3.1) * 24634.6345;
      const r2 = s2 - Math.floor(s2);
      const s3 = Math.sin(i * 39.425 + 6.7) * 19531.231;
      const r3 = s3 - Math.floor(s3);
      bPos[i * 3] = r1 * 2.0 - 1.0;
      bPos[i * 3 + 1] = r2 * 2.0 - 1.0;
      bPos[i * 3 + 2] = 0;
      bSize[i] = 5.5 + r3 * 12.5;
      bPhase[i] = r1 * 8.0;
    }
    const bGeo = trackGeo(new THREE.BufferGeometry());
    bGeo.setAttribute("position", new THREE.BufferAttribute(bPos, 3));
    bGeo.setAttribute("aSize", new THREE.BufferAttribute(bSize, 1));
    bGeo.setAttribute("aPhase", new THREE.BufferAttribute(bPhase, 1));

    bubbleUniforms = {
      uTime: waterUniforms.uTime,
      uPixelRatio: { value: pixelRatio },
    };
    const bMat = trackMat(
      new THREE.ShaderMaterial({
        uniforms: bubbleUniforms,
        vertexShader: BUBBLE_VERT,
        fragmentShader: BUBBLE_FRAG,
        transparent: true,
        depthWrite: false,
        depthTest: false,
      }),
    );
    bgScene.add(new THREE.Points(bGeo, bMat));
  }

  // Unique 3D objects per section variant
  type AnimatedSculpture = {
    obj: THREE.Object3D;
    side: number; // -1 left, 1 right, 0 center-right
    baseY: number;
    baseZ: number;
    phase: number;
    rot: [number, number, number];
    scaleDesktop: number;
    scaleMobile: number;
  };
  const items: AnimatedSculpture[] = [];
  let crystalDropsMesh: THREE.InstancedMesh | null = null;
  let crystalDropSeeds: { x: number; y: number; z: number; s: number; phase: number; speed: number }[] = [];
  const dummy = new THREE.Object3D();

  if (variant === "hero-water-drum") {
    const drum = buildDrumSculpture(pbr, trackGeo);
    scene.add(drum);
    items.push({
      obj: drum,
      side: 0.72,
      baseY: 0.12,
      baseZ: -0.6,
      phase: 0.2,
      rot: [0.1, 0.18, 0.22],
      scaleDesktop: 1.38,
      scaleMobile: 0.92,
    });
  } else if (variant === "about-heritage-emblem") {
    const emblem = buildHeritageEmblemSculpture(pbr, trackGeo);
    scene.add(emblem);
    items.push({
      obj: emblem,
      side: 0.76,
      baseY: 0.06,
      baseZ: -0.45,
      phase: 0.4,
      rot: [0.08, 0.14, 0.11],
      scaleDesktop: 1.32,
      scaleMobile: 0.88,
    });
  } else if (variant === "pillars-parts-trio") {
    const impeller = buildImpellerSculpture(pbr, trackGeo);
    const coil = buildHeatingCoilSculpture(pbr, trackGeo);
    const bearing = buildBearingSculpture(pbr, trackGeo);
    scene.add(impeller, coil, bearing);
    items.push(
      {
        obj: impeller,
        side: -0.92,
        baseY: 0.78,
        baseZ: -0.9,
        phase: 0.5,
        rot: [0.16, 0.22, 0.35],
        scaleDesktop: 0.95,
        scaleMobile: 0.58,
      },
      {
        obj: coil,
        side: 0.92,
        baseY: 0.62,
        baseZ: -0.85,
        phase: 2.1,
        rot: [0.14, -0.22, 0.08],
        scaleDesktop: 0.95,
        scaleMobile: 0.58,
      },
      {
        obj: bearing,
        side: -0.88,
        baseY: -0.82,
        baseZ: -1.1,
        phase: 4.0,
        rot: [-0.12, 0.18, 0.16],
        scaleDesktop: 0.78,
        scaleMobile: 0.48,
      },
    );
  } else if (variant === "process-bearing-orbit") {
    const bearing = buildBearingSculpture(pbr, trackGeo);
    const pulley = buildPulleySculpture(pbr, trackGeo);
    scene.add(bearing, pulley);
    items.push(
      {
        obj: bearing,
        side: -0.92,
        baseY: 0.55,
        baseZ: -0.8,
        phase: 1.1,
        rot: [0.14, 0.2, 0.24],
        scaleDesktop: 1.02,
        scaleMobile: 0.6,
      },
      {
        obj: pulley,
        side: 0.92,
        baseY: -0.52,
        baseZ: -0.9,
        phase: 3.4,
        rot: [-0.14, 0.18, -0.22],
        scaleDesktop: 1.02,
        scaleMobile: 0.6,
      },
    );
  } else if (variant === "reviews-crystal-drops") {
    // Unique calm crystal glass droplets & warm golden-aqua orbs
    const dropCount = isSoftwareGl ? 16 : 28;
    const dropGeo = trackGeo(new THREE.IcosahedronGeometry(0.14, 2));
    crystalDropsMesh = new THREE.InstancedMesh(dropGeo, pbr.aquaGlass, dropCount);
    crystalDropsMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(crystalDropsMesh);

    for (let i = 0; i < dropCount; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const s1 = Math.sin(i * 19.19 + 0.7) * 43758.5453;
      const r1 = s1 - Math.floor(s1);
      const s2 = Math.sin(i * 47.73 + 2.3) * 19531.231;
      const r2 = s2 - Math.floor(s2);
      crystalDropSeeds.push({
        x: side * (1.25 + r1 * 1.95),
        y: (r2 - 0.5) * 3.1,
        z: -0.6 - r1 * 1.6,
        s: 0.55 + r2 * 0.95,
        phase: i * 0.7,
        speed: 0.24 + r1 * 0.32,
      });
    }
  } else if (variant === "inquiry-seal-coil") {
    const seal = buildSealAndCoilSculpture(pbr, trackGeo);
    const coil = buildHeatingCoilSculpture(pbr, trackGeo);
    scene.add(seal, coil);
    items.push(
      {
        obj: seal,
        side: -0.94,
        baseY: 0.65,
        baseZ: -0.9,
        phase: 0.8,
        rot: [0.16, 0.18, 0.12],
        scaleDesktop: 0.96,
        scaleMobile: 0.56,
      },
      {
        obj: coil,
        side: 0.94,
        baseY: -0.42,
        baseZ: -0.95,
        phase: 2.9,
        rot: [0.12, -0.2, 0.08],
        scaleDesktop: 0.92,
        scaleMobile: 0.56,
      },
    );
  } else {
    // Subpage header: pick a distinct sculpture per page title!
    const pick = hashSeed(seedKey) % 5;
    const builders = [
      buildImpellerSculpture,
      buildBearingSculpture,
      buildHeatingCoilSculpture,
      buildSealAndCoilSculpture,
      buildPulleySculpture,
    ];
    const sculpture = builders[pick](pbr, trackGeo);
    scene.add(sculpture);
    items.push({
      obj: sculpture,
      side: 0.78,
      baseY: 0.02,
      baseZ: -0.45,
      phase: pick * 1.1,
      rot: [0.14, 0.22, 0.16],
      scaleDesktop: 1.24,
      scaleMobile: 0.82,
    });
  }

  let currentDark = initialDark ? 1 : 0;

  return {
    update(elapsed, delta, ptrX, ptrY, scrollFrac, aspect, isDark) {
      if (waterUniforms) {
        waterUniforms.uTime.value = elapsed;
        waterUniforms.uPointer.value.set(ptrX, ptrY);
        waterUniforms.uScrollLocal.value = scrollFrac;
      }

      if (!isDarkVariant) {
        const targetD = isDark ? 1 : 0;
        if (Math.abs(currentDark - targetD) > 0.01) {
          currentDark = THREE.MathUtils.damp(currentDark, targetD, 5, delta);
          pbr.steel.opacity = THREE.MathUtils.lerp(0.22, 0.34, currentDark);
          pbr.chrome.opacity = THREE.MathUtils.lerp(0.26, 0.42, currentDark);
          pbr.brass.opacity = THREE.MathUtils.lerp(0.22, 0.34, currentDark);
          pbr.aquaGlass.opacity = THREE.MathUtils.lerp(0.24, 0.36, currentDark);
        }
      }

      const isCompact = aspect < 0.95;
      const edgeSpan = isCompact ? Math.max(1.05, aspect * 1.65) : Math.min(3.35, aspect * 1.68);
      const pOffX = (ptrX - 0.5) * 0.28;
      const pOffY = (ptrY - 0.5) * 0.2;

      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const sc = isCompact ? it.scaleMobile : it.scaleDesktop;
        it.obj.scale.setScalar(sc);
        it.obj.position.set(
          it.side * edgeSpan - pOffX * 0.45 + Math.cos(elapsed * 0.45 + it.phase) * 0.1,
          it.baseY + Math.sin(elapsed * 0.62 + it.phase) * 0.16 + (scrollFrac - 0.5) * 0.38 + pOffY * 0.35,
          it.baseZ,
        );
        it.obj.rotation.set(
          elapsed * it.rot[0] + it.phase + pOffY * 0.45,
          elapsed * it.rot[1] + it.phase * 0.7 - pOffX * 0.55,
          elapsed * it.rot[2] + scrollFrac * 0.45,
        );
      }

      if (crystalDropsMesh) {
        const xSpread = isCompact ? 0.58 : 1.0;
        for (let i = 0; i < crystalDropSeeds.length; i++) {
          const d = crystalDropSeeds[i];
          const yBob = d.y + Math.sin(elapsed * d.speed + d.phase) * 0.28 + (scrollFrac - 0.5) * 0.42;
          const xSway = d.x * xSpread + Math.cos(elapsed * d.speed * 0.7 + d.phase) * 0.14 - pOffX * 0.35;
          dummy.position.set(xSway, yBob, d.z);
          dummy.rotation.set(elapsed * 0.3 + d.phase, elapsed * 0.4 + d.phase, 0);
          dummy.scale.setScalar(d.s * (isCompact ? 0.72 : 1.0));
          dummy.updateMatrix();
          crystalDropsMesh.setMatrixAt(i, dummy.matrix);
        }
        crystalDropsMesh.instanceMatrix.needsUpdate = true;
      }
    },
    render(r) {
      r.clear();
      if (bgScene && orthoCam) {
        r.render(bgScene, orthoCam);
        r.clearDepth();
      }
      r.render(scene, camera);
    },
    onResize(w, h, pr) {
      camera.aspect = Math.max(w, 1) / Math.max(h, 1);
      camera.updateProjectionMatrix();
      if (waterUniforms) {
        waterUniforms.uResolution.value.set(w, h);
      }
      if (bubbleUniforms) {
        bubbleUniforms.uPixelRatio.value = pr;
      }
    },
    dispose() {
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      scene.environment = null;
      envRT.dispose();
      pmrem.dispose();
    },
  };
}

export function Section3DScene({
  variant,
  seedKey = "",
  className = "",
}: Section3DSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isNearViewport, setIsNearViewport] = useState<boolean>(
    variant === "hero-water-drum" ||
      variant === "about-heritage-emblem" ||
      variant === "subpage-header",
  );

  // Only allocate WebGL context while this section is near or inside the viewport!
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setIsNearViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsNearViewport(entry.isIntersecting);
        }
      },
      { rootMargin: "180px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isNearViewport) return;
    const mount = mountRef.current;
    const container = containerRef.current;
    if (!mount || !container || typeof window === "undefined") return;

    const prefersReduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const isOpaqueBg =
      variant === "hero-water-drum" ||
      variant === "about-heritage-emblem" ||
      variant === "subpage-header";

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: !isOpaqueBg,
        powerPreference: "high-performance",
        depth: true,
        stencil: false,
      });
    } catch {
      return;
    }

    const isSoftwareGl = detectSoftwareWebGL(renderer);
    const getPr = () => (isSoftwareGl ? 0.8 : Math.min(window.devicePixelRatio || 1, 1.5));

    const w0 = Math.max(mount.clientWidth, 240);
    const h0 = Math.max(mount.clientHeight, 180);
    const pr0 = getPr();

    renderer.setPixelRatio(pr0);
    renderer.setSize(w0, h0, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.autoClear = false;
    if (!isOpaqueBg) {
      renderer.setClearColor(0x000000, 0);
    }
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";

    mount.innerHTML = "";
    mount.appendChild(renderer.domElement);

    const built = createSectionScene(
      variant,
      seedKey,
      renderer,
      w0,
      h0,
      pr0,
      isSoftwareGl,
    );

    let targetPtrX = 0.5;
    let targetPtrY = 0.5;
    let smoothPtrX = 0.5;
    let smoothPtrY = 0.5;
    let smoothScrollFrac = 0.5;
    let cachedAspect = w0 / Math.max(h0, 1);

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      targetPtrX = THREE.MathUtils.clamp((e.clientX - rect.left) / rect.width, 0, 1);
      targetPtrY = THREE.MathUtils.clamp(1 - (e.clientY - rect.top) / rect.height, 0, 1);
    };

    const handleResize = () => {
      if (!mount) return;
      const w = Math.max(mount.clientWidth, 200);
      const h = Math.max(mount.clientHeight, 140);
      const pr = getPr();
      cachedAspect = w / Math.max(h, 1);
      renderer.setPixelRatio(pr);
      renderer.setSize(w, h, false);
      built.onResize(w, h, pr);
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(mount);
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    let disposed = false;
    let rafId = 0;
    let timerId = 0;
    const clock = new THREE.Clock();
    let elapsedTotal = 0;

    const afterDraw = (next: () => void) => {
      if (disposed) return;
      const gl = renderer.getContext();
      const canFence =
        typeof WebGL2RenderingContext !== "undefined" &&
        gl instanceof WebGL2RenderingContext;
      if (canFence) {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        if (sync) {
          gl.flush();
          const poll = () => {
            if (disposed) {
              gl.deleteSync(sync);
              return;
            }
            const status = gl.clientWaitSync(sync, 0, 0);
            if (status === gl.TIMEOUT_EXPIRED) {
              timerId = window.setTimeout(poll, 16);
            } else {
              gl.deleteSync(sync);
              timerId = window.setTimeout(next, 80);
            }
          };
          timerId = window.setTimeout(poll, 16);
          return;
        }
      }
      timerId = window.setTimeout(next, 90);
    };

    const drawStep = (delta: number) => {
      elapsedTotal += delta;
      smoothPtrX = THREE.MathUtils.damp(smoothPtrX, targetPtrX, 2.8, delta);
      smoothPtrY = THREE.MathUtils.damp(smoothPtrY, targetPtrY, 2.8, delta);

      const rect = container.getBoundingClientRect();
      const vh = Math.max(window.innerHeight, 1);
      const rawFrac = THREE.MathUtils.clamp((vh - rect.top) / (vh + rect.height), 0, 1);
      smoothScrollFrac = THREE.MathUtils.damp(smoothScrollFrac, rawFrac, 3.5, delta);

      const isDark = document.documentElement.classList.contains("dark");
      built.update(
        elapsedTotal,
        delta,
        smoothPtrX,
        smoothPtrY,
        smoothScrollFrac,
        cachedAspect,
        isDark,
      );
      built.render(renderer);
    };

    if (prefersReduced) {
      drawStep(0.016);
    } else {
      const tick = () => {
        if (disposed) return;
        if (document.hidden) {
          timerId = window.setTimeout(tick, 240);
          return;
        }
        const delta = Math.min(clock.getDelta(), 0.05);
        drawStep(delta);
        if (isSoftwareGl) {
          afterDraw(tick);
        } else {
          rafId = window.requestAnimationFrame(tick);
        }
      };
      tick();
    }

    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timerId);
      ro.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      built.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [isNearViewport, variant, seedKey]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <div ref={mountRef} className="h-full w-full" />
    </div>
  );
}
