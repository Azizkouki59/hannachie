import * as THREE from "three";
import type { StudioMaterialLibrary } from "./types";

/**
 * Detect software WebGL rasterizers (SwiftShader, llvmpipe, WARP) strictly
 * from the WebGL renderer string—never from userAgent.
 */
export function detectSoftwareWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) return true;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || "");
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

/**
 * Procedural fine brushed-steel directional texture (100% local, zero external fetches).
 */
export function createBrushedSteelTexture(
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#c8d1dc";
    ctx.fillRect(0, 0, size, size);
    for (let y = 0; y < size; y++) {
      const seed = Math.sin(y * 12.9898) * 43758.5453;
      const frac = seed - Math.floor(seed);
      const lum = Math.round(188 + frac * 34);
      ctx.fillStyle = `rgb(${lum}, ${lum + 3}, ${lum + 8})`;
      ctx.fillRect(0, y, size, 1);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.max(1, Math.min(maxAnisotropy, 8));
  return tex;
}

/**
 * Soft radial studio contact shadow beneath grounded appliances.
 */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const grad = ctx.createRadialGradient(
      size / 2,
      size / 2,
      size * 0.06,
      size / 2,
      size / 2,
      size * 0.49,
    );
    grad.addColorStop(0, "rgba(15, 23, 42, 0.52)");
    grad.addColorStop(0.55, "rgba(15, 23, 42, 0.22)");
    grad.addColorStop(1, "rgba(15, 23, 42, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Braun / Apple inspired chamfered rounded box via ExtrudeGeometry.
 */
export function createChamferedBoxGeo(
  width: number,
  height: number,
  depth: number,
  cornerRadius = 0.09,
  bevelSize = 0.026,
): THREE.ExtrudeGeometry {
  const w = Math.max(0.05, width - bevelSize * 2);
  const h = Math.max(0.05, height - bevelSize * 2);
  const r = Math.min(cornerRadius, w * 0.44, h * 0.44);
  const x = -w / 2;
  const y = -h / 2;

  const shape = new THREE.Shape();
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.02, depth - bevelSize * 2),
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize,
    bevelThickness: bevelSize,
    curveSegments: 10,
  });
  geo.center();
  return geo;
}

/**
 * Creates a hollow rectangular gasket/frame via ExtrudeGeometry with inner hole.
 */
export function createHollowFrameGeo(
  outerW: number,
  outerH: number,
  thickness: number,
  depth: number,
  radius = 0.06,
): THREE.ExtrudeGeometry {
  const makeRoundedRect = (w: number, h: number, r: number, ccw: boolean) => {
    const hw = w / 2;
    const hh = h / 2;
    const cr = Math.min(r, hw * 0.45, hh * 0.45);
    const p = new THREE.Path();
    if (!ccw) {
      p.moveTo(-hw + cr, -hh);
      p.lineTo(hw - cr, -hh);
      p.quadraticCurveTo(hw, -hh, hw, -hh + cr);
      p.lineTo(hw, hh - cr);
      p.quadraticCurveTo(hw, hh, hw - cr, hh);
      p.lineTo(-hw + cr, hh);
      p.quadraticCurveTo(-hw, hh, -hw, hh - cr);
      p.lineTo(-hw, -hh + cr);
      p.quadraticCurveTo(-hw, -hh, -hw + cr, -hh);
    } else {
      p.moveTo(-hw + cr, -hh);
      p.quadraticCurveTo(-hw, -hh, -hw, -hh + cr);
      p.lineTo(-hw, hh - cr);
      p.quadraticCurveTo(-hw, hh, -hw + cr, hh);
      p.lineTo(hw - cr, hh);
      p.quadraticCurveTo(hw, hh, hw, hh - cr);
      p.lineTo(hw, -hh + cr);
      p.quadraticCurveTo(hw, -hh, hw - cr, -hh);
      p.lineTo(-hw + cr, -hh);
    }
    return p;
  };

  const outer = new THREE.Shape(makeRoundedRect(outerW, outerH, radius, false).getPoints(24));
  const innerW = Math.max(0.08, outerW - thickness * 2);
  const innerH = Math.max(0.08, outerH - thickness * 2);
  outer.holes.push(makeRoundedRect(innerW, innerH, Math.max(0.02, radius * 0.6), true));

  const geo = new THREE.ExtrudeGeometry(outer, {
    depth,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.008,
    bevelThickness: 0.008,
    curveSegments: 8,
  });
  geo.center();
  return geo;
}

/**
 * Adds refined Braun / Apple architectural outline edges to an outer chassis mesh.
 */
export function addArchitecturalEdges(
  targetMesh: THREE.Mesh,
  edgeMat: THREE.LineBasicMaterial,
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T,
  thresholdAngle = 32,
): THREE.LineSegments {
  const edges = trackGeo(new THREE.EdgesGeometry(targetMesh.geometry, thresholdAngle));
  const segs = new THREE.LineSegments(edges, edgeMat);
  segs.renderOrder = 2;
  targetMesh.add(segs);
  return segs;
}

/**
 * Creates a dashed engineering leader line from mounting origin to exploded part.
 */
export function createEngineeringLeaderLine(
  origin: THREE.Vector3,
  mat: THREE.LineDashedMaterial,
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T,
): THREE.Line {
  const positions = new Float32Array([
    origin.x,
    origin.y,
    origin.z,
    origin.x,
    origin.y,
    origin.z,
  ]);
  const geo = trackGeo(new THREE.BufferGeometry());
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const line = new THREE.Line(geo, mat);
  line.computeLineDistances();
  line.frustumCulled = false;
  line.visible = false;
  return line;
}

/**
 * Material factory library (every call creates a clean isolated instance so
 * per-part hover/selection emissive highlights never bleed across parts).
 */
export function createMaterialLibrary(
  trackMat: <T extends THREE.Material>(m: T) => T,
  brushedSteelTex: THREE.CanvasTexture,
  isSoftwareGl: boolean,
): StudioMaterialLibrary {
  return {
    ceramicShell: () =>
      trackMat(
        new THREE.MeshPhysicalMaterial({
          color: 0xf4f7fb,
          metalness: 0.05,
          roughness: 0.32,
          clearcoat: 0.48,
          clearcoatRoughness: 0.24,
          transparent: true,
          opacity: 1,
        }),
      ),
    satinSteel: () =>
      trackMat(
        new THREE.MeshPhysicalMaterial({
          color: 0xd6dee8,
          map: brushedSteelTex,
          metalness: 0.84,
          roughness: 0.28,
          anisotropy: isSoftwareGl ? 0 : 0.65,
          clearcoat: 0.22,
          transparent: true,
          opacity: 1,
        }),
      ),
    brightChrome: () =>
      trackMat(
        new THREE.MeshPhysicalMaterial({
          color: 0xf1f5f9,
          metalness: 0.94,
          roughness: 0.14,
          clearcoat: 0.55,
        }),
      ),
    obsidianGlass: () =>
      trackMat(
        new THREE.MeshPhysicalMaterial({
          color: 0x0f172a,
          metalness: 0.16,
          roughness: 0.12,
          clearcoat: 1.0,
          clearcoatRoughness: 0.08,
          transparent: true,
          opacity: 0.86,
        }),
      ),
    frostedGlass: () =>
      trackMat(
        new THREE.MeshPhysicalMaterial({
          color: 0xbae6fd,
          metalness: 0.05,
          roughness: 0.18,
          clearcoat: 0.85,
          transparent: true,
          opacity: isSoftwareGl ? 0.36 : 0.42,
          depthWrite: false,
        }),
      ),
    ceruleanPart: () =>
      trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x0284c7,
          emissive: new THREE.Color(0x0369a1),
          emissiveIntensity: 0.14,
          metalness: 0.28,
          roughness: 0.34,
        }),
      ),
    copperCoil: () =>
      trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xd97706,
          emissive: new THREE.Color(0xb45309),
          emissiveIntensity: 0.12,
          metalness: 0.82,
          roughness: 0.26,
        }),
      ),
    graphiteGasket: () =>
      trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x273549,
          metalness: 0.08,
          roughness: 0.78,
        }),
      ),
    darkChassis: () =>
      trackMat(
        new THREE.MeshPhysicalMaterial({
          color: 0x1e293b,
          metalness: 0.42,
          roughness: 0.38,
          clearcoat: 0.28,
          transparent: true,
          opacity: 1,
        }),
      ),
    brushedDrum: () =>
      trackMat(
        new THREE.MeshPhysicalMaterial({
          color: 0xcbd5e1,
          map: brushedSteelTex,
          metalness: 0.88,
          roughness: 0.22,
          anisotropy: isSoftwareGl ? 0 : 0.72,
          clearcoat: 0.3,
        }),
      ),
    edgeLine: () =>
      trackMat(
        new THREE.LineBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.0,
        }),
      ),
    leaderLine: () =>
      trackMat(
        new THREE.LineDashedMaterial({
          color: 0x0284c7,
          dashSize: 0.055,
          gapSize: 0.045,
          transparent: true,
          opacity: 0.55,
        }),
      ),
  };
}

/**
 * Dual-Theme GLSL Studio Cyclorama & Subtle Architectural Radial Floor Shader.
 * Smoothly blends between porcelain-slate Light Mode (uDarkMix = 0)
 * and deep #0F2A4A navy Dark Mode (uDarkMix = 1).
 */
export const EXPLORER_BG_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const EXPLORER_BG_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uDarkMix;
  uniform float uExplode;
  uniform vec2 uResolution;

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
    float dist = length(p);
    float horizon = smoothstep(-0.52, 0.48, p.y);

    // Light Mode: clean Braun/Apple porcelain-slate architectural studio
    vec3 lightBot = vec3(0.905, 0.930, 0.962);
    vec3 lightTop = vec3(0.972, 0.984, 0.996);
    vec3 lightCol = mix(lightBot, lightTop, horizon);
    float lightSpot = exp(-dot(p - vec2(0.0, 0.06), p - vec2(0.0, 0.06)) * 2.2);
    lightCol += vec3(0.01, 0.035, 0.055) * lightSpot;

    // Dark Mode: #0F2A4A navy precision bay with subtle cerulean/emerald sheen
    vec3 darkBot = vec3(0.031, 0.075, 0.145);
    vec3 darkTop = vec3(0.058, 0.145, 0.265);
    vec3 darkCol = mix(darkBot, darkTop, horizon);
    float darkSpot = exp(-dot(p - vec2(sin(uTime * 0.25) * 0.1, 0.08), p - vec2(sin(uTime * 0.25) * 0.1, 0.08)) * 2.1);
    darkCol += vec3(0.008, 0.21, 0.36) * darkSpot * 0.38;
    darkCol += vec3(0.02, 0.22, 0.16) * exp(-dot(p - vec2(0.45, -0.25), p - vec2(0.45, -0.25)) * 3.0) * 0.18;

    vec3 col = mix(lightCol, darkCol, uDarkMix);

    // Precision architectural radial rings on lower studio plane (brighten slightly on explode)
    vec2 floorP = (vUv - vec2(0.5, 0.20)) * vec2(aspect, 2.35);
    float r = length(floorP);
    float ringA = smoothstep(0.009, 0.0, abs(r - 0.52));
    float ringB = smoothstep(0.008, 0.0, abs(r - 0.84));
    float ringC = smoothstep(0.007, 0.0, abs(r - 1.16));
    float ringFade = smoothstep(1.35, 0.22, r);
    float rings = (ringA + ringB * 0.72 + ringC * 0.45) * ringFade;
    float ringBoost = mix(0.06, 0.16, uExplode);

    vec3 ringLightTint = vec3(0.01, 0.42, 0.68);
    vec3 ringDarkTint  = vec3(0.22, 0.74, 0.97);
    col = mix(col, mix(ringLightTint, ringDarkTint, uDarkMix), clamp(rings * ringBoost * mix(0.85, 1.35, uDarkMix), 0.0, 0.24));

    // Gentle vignette for center focus
    float vig = mix(0.90, 1.02, smoothstep(1.42, 0.24, dist));
    col *= mix(mix(0.95, 1.0, vig), vig, uDarkMix);

    gl_FragColor = vec4(col, 1.0);
  }
`;
