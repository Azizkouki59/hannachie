"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { ArrowRight, Pause, Play, RotateCcw } from "lucide-react";
import {
  CoffeeMachine,
  Cooktop,
  Dishwasher,
  Dryer,
  Freezer,
  Fridge,
  MicrowaveIcon,
  Oven,
  RangeHood,
  WashingMachine,
} from "@/components/Illustrations";
import { triggerHapticFeedback } from "@/lib/haptics";

export type FilmChapterId = "waesche" | "kueche" | "kaffee" | "kuehlen";

interface FilmChapter {
  id: FilmChapterId;
  index: string;
  startSec: number;
  endSec: number;
  shortLabel: string;
  cinemaKicker: string;
  cinemaHeadline: string;
  appliance: string;
  label: string;
  subtitle: string;
  description: string;
  specs: { label: string; value: string }[];
  quickRequestCategory: string;
  quickRequestPart: string;
}

const FILM_DURATION = 32; // 32-second seamless 4-scene 3D animated electromenager showcase (4 x 8s)

const FILM_CHAPTERS: FilmChapter[] = [
  {
    id: "waesche",
    index: "01",
    startSec: 0,
    endSec: 8,
    shortLabel: "01 Wäsche",
    cinemaKicker: "Szene 01 · Waschmaschinen & Trockner",
    cinemaHeadline: "Waschen & Trocknen – Beratung & Originalteile",
    appliance: "Waschmaschinen & Wäschetrockner",
    label: "Waschmaschinen, Wärmepumpen- & Kondenstrockner",
    subtitle: "Originalteile nach E-Nr. / PNC & ausgewählte Geräte auf Anfrage",
    description:
      "Laugenpumpen, Türmanschetten, Heizstäbe, Kondensatpumpen, Stoßdämpfer und Flusensiebe: Anhand Ihres Typenschilds ordnet Kamal Hannachi jedes Bauteil zweifelsfrei zu.",
    specs: [
      { label: "Waschmaschinen", value: "Pumpe, Dichtung, Heizstab, Schloss, Lager" },
      { label: "Wäschetrockner", value: "Kondensatpumpe, Riemen, Sensor, Sieb" },
      { label: "Ansprechpartner", value: "Direkt Inhaber Kamal Hannachi" },
    ],
    quickRequestCategory: "Waschmaschine",
    quickRequestPart: "Original-Ersatzteil für Waschmaschine / Trockner nach E-Nr.",
  },
  {
    id: "kueche",
    index: "02",
    startSec: 8,
    endSec: 16,
    shortLabel: "02 Küche",
    cinemaKicker: "Szene 02 · Spülen, Kochen, Backen & Lüften",
    cinemaHeadline: "Geschirrspüler, Backofen, Kochfeld & Dunstabzug",
    appliance: "Spüler, Herd, Kochfeld & Haube",
    label: "Die gesamte Küche – exakt nach Typenschild",
    subtitle: "Umwälzpumpen, Ringheizkörper, Schalter & Metallfettfilter",
    description:
      "Vom Geschirrspüler-Korb über Backofen-Heizelemente und Induktions-Ersatzteile bis zu Original-Filtern für Dunstabzugshauben – persönliche Prüfung statt Fehlbestellung.",
    specs: [
      { label: "Geschirrspüler", value: "Heizpumpe, Aquastop, Sprüharm, Körbe" },
      { label: "Backofen & Kochfeld", value: "Heizkörper, Schalter, Dichtung" },
      { label: "Dunstabzugshaube", value: "Metallfettfilter, Aktivkohlefilter, Schalter" },
    ],
    quickRequestCategory: "Backofen / Herd",
    quickRequestPart: "Original-Ersatzteil für Spüler, Backofen, Kochfeld oder Haube",
  },
  {
    id: "kaffee",
    index: "03",
    startSec: 16,
    endSec: 24,
    shortLabel: "03 Kaffee & Mikro",
    cinemaKicker: "Szene 03 · Kaffeevollautomaten & Mikrowellen",
    cinemaHeadline: "Kaffeevollautomaten, Siebträger & Mikrowellen",
    appliance: "Kaffee & kompakte Küchengeräte",
    label: "Brühgruppen, Dichtungen, Drehteller & Zubehör",
    subtitle: "Original-Ersatzteile nach Modellnummer für Jura, DeLonghi, Siemens & mehr",
    description:
      "Ob Brühgruppe, Drainageventil und O-Ringe für Kaffeevollautomaten oder Drehteller, Rollenring und Glimmerplatte für Mikrowellen – kurz per WhatsApp-Foto anfragen.",
    specs: [
      { label: "Kaffeevollautomaten", value: "Brühgruppe, O-Ringe, Pumpe, Mahlwerk" },
      { label: "Mikrowellen", value: "Drehteller, Rollenring, Glimmerplatte" },
      { label: "Abwicklung", value: "Schnelle Klärung nach Typenschild-Foto" },
    ],
    quickRequestCategory: "Mikrowelle",
    quickRequestPart: "Originalteil für Kaffeevollautomat oder Mikrowelle nach Typenschild",
  },
  {
    id: "kuehlen",
    index: "04",
    startSec: 24,
    endSec: 32,
    shortLabel: "04 Kühlen",
    cinemaKicker: "Szene 04 · Kühlschränke, Gefriergeräte & Marken",
    cinemaHeadline: "Kühl- & Gefriertechnik – plus Markengeräte auf Anfrage",
    appliance: "Kühlschränke, Gefrierschränke & Familie",
    label: "Kühlen & Gefrieren – plus geprüfte Markengeräte",
    subtitle: "Thermostate, Magnet-Türdichtungen & Geräte inkl. Verkäufergarantie",
    description:
      "Magnet-Türdichtungen, NTC-Fühler, Schleppscharniere und Gefrierschubladen – sowie ausgewählte geprüfte Markengeräte auf Anfrage inklusive schriftlicher Verkäufergarantie.",
    specs: [
      { label: "Kühl- & Gefriergeräte", value: "Thermostat, Dichtung, Scharnier, Schublade" },
      { label: "Markengeräte", value: "Ausgewählte Geräte auf Anfrage inkl. Garantie" },
      { label: "Übergabe", value: "Osnabrück · Termine nach Vereinbarung" },
    ],
    quickRequestCategory: "Kühlschrank / Gefriergerät",
    quickRequestPart: "Kühl-/Gefriergerät-Ersatzteil oder Markengerät auf Anfrage",
  },
];

const QUICK_APPLIANCES = [
  { label: "Waschen", sec: 0.05, chapter: 0, device: "Waschmaschine", Icon: WashingMachine },
  { label: "Trockner", sec: 3.2, chapter: 0, device: "Wäschetrockner", Icon: Dryer },
  { label: "Spüler", sec: 8.05, chapter: 1, device: "Geschirrspüler", Icon: Dishwasher },
  { label: "Backofen", sec: 10.5, chapter: 1, device: "Backofen / Herd", Icon: Oven },
  { label: "Kochfeld", sec: 12.2, chapter: 1, device: "Ceranfeld / Induktion", Icon: Cooktop },
  { label: "Abzug", sec: 13.8, chapter: 1, device: "Dunstabzugshaube", Icon: RangeHood },
  { label: "Kaffee", sec: 16.05, chapter: 2, device: "Kaffeevollautomat", Icon: CoffeeMachine },
  { label: "Mikro", sec: 19.5, chapter: 2, device: "Mikrowelle", Icon: MicrowaveIcon },
  { label: "Kühlen", sec: 24.05, chapter: 3, device: "Kühlschrank / Gefriergerät", Icon: Fridge },
  { label: "Gefrieren", sec: 27.5, chapter: 3, device: "Kühlschrank / Gefriergerät", Icon: Freezer },
] as const;

function detectSoftwareWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
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

function formatTimecode(sec: number): string {
  const clamped = Math.max(0, Math.min(FILM_DURATION, Math.floor(sec)));
  return `00:${String(clamped).padStart(2, "0")}`;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Creates a tactile Flaticon-inspired rounded-bevel rectangular housing via ExtrudeGeometry */
function createRoundedBoxGeo(
  width: number,
  height: number,
  depth: number,
  radius: number,
  bevelSize = 0.042,
): THREE.ExtrudeGeometry {
  const w = width - bevelSize * 2;
  const h = height - bevelSize * 2;
  const r = Math.min(radius, w * 0.45, h * 0.45);
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
    depth: Math.max(0.04, depth - bevelSize * 2),
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize,
    bevelThickness: bevelSize,
    curveSegments: 10,
  });
  geo.center();
  return geo;
}

function createStudioFloorShadow(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(
      size / 2,
      size / 2,
      size * 0.04,
      size / 2,
      size / 2,
      size * 0.5,
    );
    g.addColorStop(0, "rgba(2, 6, 23, 0.72)");
    g.addColorStop(0.55, "rgba(2, 6, 23, 0.28)");
    g.addColorStop(1, "rgba(2, 6, 23, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ───────────────────────────────────────────────────────────────────────────
   Soft Animated 4-Scene Studio Cinema Backdrop Shader
─────────────────────────────────────────────────────────────────────────── */

const STUDIO_BG_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const STUDIO_BG_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec4 uMix; // x=Scene0, y=Scene1, z=Scene2, w=Scene3
  uniform vec2 uResolution;

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
    float r = length(p);
    float horizon = smoothstep(-0.55, 0.45, p.y);
    float spot = exp(-dot(p - vec2(sin(uTime * 0.35) * 0.16, 0.14), p - vec2(sin(uTime * 0.35) * 0.16, 0.14)) * 2.1);

    // Scene 01: Aqua Washer + Warm Dryer Studio
    vec3 col0 = mix(vec3(0.015, 0.045, 0.105), vec3(0.04, 0.17, 0.33), horizon);
    col0 += vec3(0.10, 0.54, 0.85) * exp(-dot(p - vec2(-0.34, 0.08), p - vec2(-0.34, 0.08)) * 2.4) * 0.44;
    col0 += vec3(0.86, 0.56, 0.16) * exp(-dot(p - vec2(0.36, 0.08), p - vec2(0.36, 0.08)) * 2.6) * 0.28;

    // Scene 02: Kitchen Studio (Dishwasher Sky + Oven/Cooktop Amber)
    vec3 col1 = mix(vec3(0.022, 0.036, 0.085), vec3(0.075, 0.12, 0.24), horizon);
    col1 += vec3(0.88, 0.44, 0.14) * exp(-dot(p - vec2(0.30, 0.04), p - vec2(0.30, 0.04)) * 2.6) * 0.36;
    col1 += vec3(0.14, 0.58, 0.88) * exp(-dot(p - vec2(-0.36, 0.08), p - vec2(-0.36, 0.08)) * 2.6) * 0.34;

    // Scene 03: Warm Espresso Roast & Compact Kitchen Studio
    vec3 col2 = mix(vec3(0.032, 0.026, 0.055), vec3(0.11, 0.08, 0.12), horizon);
    col2 += vec3(0.84, 0.52, 0.20) * spot * 0.38;
    col2 += vec3(0.20, 0.56, 0.82) * exp(-dot(p - vec2(0.36, -0.04), p - vec2(0.36, -0.04)) * 3.0) * 0.22;

    // Scene 04: Arctic Frost Fridge & Freezer Studio
    vec3 col3 = mix(vec3(0.014, 0.04, 0.095), vec3(0.045, 0.18, 0.34), horizon);
    col3 += vec3(0.28, 0.78, 0.98) * spot * 0.46;

    vec3 col = col0 * uMix.x + col1 * uMix.y + col2 * uMix.z + col3 * uMix.w;

    float floorRing = smoothstep(0.06, 0.0, abs(length((vUv - vec2(0.5, 0.22)) * vec2(aspect, 2.4)) - 0.58));
    col += vec3(0.35, 0.75, 1.0) * floorRing * 0.075;
    col *= mix(0.62, 1.05, smoothstep(1.38, 0.25, r));

    gl_FragColor = vec4(col, 1.0);
  }
`;

/* ───────────────────────────────────────────────────────────────────────────
   Rising Bubbles & Coffee Aroma Steam Shader
─────────────────────────────────────────────────────────────────────────── */

const PARTICLE_VERT = /* glsl */ `
  attribute float aPhase;
  attribute float aSize;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uOpacity;
  varying float vAlpha;

  void main() {
    vec3 pos = position;
    float cycle = fract(aPhase + uTime * 0.36);
    pos.y += cycle * 0.88;
    pos.x += sin(uTime * 2.2 + aPhase * 12.0) * 0.08;
    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPos;
    gl_PointSize = aSize * uPixelRatio * (3.5 / max(-mvPos.z, 0.9));
    vAlpha = uOpacity * sin(cycle * 3.14159);
  }
`;

const PARTICLE_FRAG = /* glsl */ `
  precision mediump float;
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float rim = smoothstep(0.22, 0.44, d) * (1.0 - smoothstep(0.44, 0.5, d));
    float glint = 1.0 - smoothstep(0.0, 0.22, length(uv - vec2(-0.14, -0.14)));
    vec3 col = mix(uColor, vec3(1.0), clamp(glint + rim * 0.55, 0.0, 1.0));
    gl_FragColor = vec4(col, clamp((rim * 0.8 + glint * 0.7) * vAlpha, 0.0, 0.88));
  }
`;

interface AboutPrecisionStudio3DProps {
  onRequestPart: (appliance: string, partNote: string) => void;
}

export function AboutPrecisionStudio3D({ onRequestPart }: AboutPrecisionStudio3DProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedDeviceHint, setSelectedDeviceHint] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);

  const isPlayingRef = useRef(isPlaying);
  const filmTimeRef = useRef(0);
  const seekRequestRef = useRef<number | null>(null);

  isPlayingRef.current = isPlaying;

  const activeChapterIndex = Math.min(3, Math.floor(currentTime / 8));
  const activeChapter = FILM_CHAPTERS[activeChapterIndex] ?? FILM_CHAPTERS[0];

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]) setIsVisible(entries[0].isIntersecting);
      },
      { rootMargin: "220px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const mount = mountRef.current;
    if (!mount || typeof window === "undefined") return;

    const prefersReduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (prefersReduced) {
      isPlayingRef.current = false;
      setIsPlaying(false);
    }

    const isSoftwareGl = detectSoftwareWebGL();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    const getPr = () => (isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    const w0 = Math.max(mount.clientWidth, 320);
    const h0 = Math.max(mount.clientHeight, 220);
    const pr0 = getPr();

    renderer.setPixelRatio(pr0);
    renderer.setSize(w0, h0, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.autoClear = false;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";

    mount.innerHTML = "";
    mount.appendChild(renderer.domElement);

    const geos: THREE.BufferGeometry[] = [];
    const mats: THREE.Material[] = [];
    const texs: THREE.Texture[] = [];
    const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
      geos.push(g);
      return g;
    };
    const trackMat = <T extends THREE.Material>(m: T): T => {
      mats.push(m);
      return m;
    };
    const trackTex = <T extends THREE.Texture>(t: T): T => {
      texs.push(t);
      return t;
    };

    /* ── Pass 0: Animated Studio Backdrop ── */
    const bgScene = new THREE.Scene();
    const bgCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const bgUniforms = {
      uTime: { value: 0 },
      uMix: { value: new THREE.Vector4(1, 0, 0, 0) },
      uResolution: { value: new THREE.Vector2(w0, h0) },
    };
    bgScene.add(
      new THREE.Mesh(
        trackGeo(new THREE.PlaneGeometry(2, 2)),
        trackMat(
          new THREE.ShaderMaterial({
            uniforms: bgUniforms,
            vertexShader: STUDIO_BG_VERT,
            fragmentShader: STUDIO_BG_FRAG,
            depthTest: false,
            depthWrite: false,
          }),
        ),
      ),
    );

    /* ── Pass 1: 3D Tactile Electroménager Cinema Stage ── */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, w0 / Math.max(h0, 1), 0.1, 40);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envRT = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envRT.texture;
    roomEnv.dispose();

    const hemi = new THREE.HemisphereLight(0xe0f2fe, 0x0f172a, 1.05);
    const keyLight = new THREE.DirectionalLight(0xfffbeb, 2.0);
    keyLight.position.set(4.5, 5.5, 5.2);
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
    rimLight.position.set(-4.5, 2.5, -3.5);
    const accentLightWarm = new THREE.PointLight(0xf97316, 0, 7);
    accentLightWarm.position.set(0.85, 0.1, 0.9);
    const accentLightCool = new THREE.PointLight(0x38bdf8, 0, 7);
    accentLightCool.position.set(-0.2, 0.4, 1.0);
    scene.add(hemi, keyLight, rimLight, accentLightWarm, accentLightCool);

    // Tactile Organic-Minimalism PBR Material Library
    const ceramicWhite = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0xf4f7fb,
        metalness: 0.06,
        roughness: 0.34,
        clearcoat: 0.45,
        clearcoatRoughness: 0.28,
      }),
    );
    const softBluePanel = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0xdbeafe,
        metalness: 0.08,
        roughness: 0.36,
      }),
    );
    const softAmberPanel = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0xfef3c7,
        metalness: 0.08,
        roughness: 0.36,
      }),
    );
    const satinSteel = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0xcbd5e1,
        metalness: 0.82,
        roughness: 0.24,
        clearcoat: 0.35,
      }),
    );
    const brightChrome = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0xf1f5f9,
        metalness: 0.95,
        roughness: 0.1,
        clearcoat: 0.6,
      }),
    );
    const obsidianGlass = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0x0f172a,
        metalness: 0.22,
        roughness: 0.12,
        clearcoat: 1.0,
      }),
    );
    const espressoBrown = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0x6b3a1e,
        metalness: 0.12,
        roughness: 0.22,
        clearcoat: 0.8,
      }),
    );
    const skyAccentMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x0ea5e9,
        emissive: new THREE.Color(0x0284c7),
        emissiveIntensity: 0.35,
        metalness: 0.15,
        roughness: 0.3,
      }),
    );
    const amberAccentMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: new THREE.Color(0xea580c),
        emissiveIntensity: 0.42,
        metalness: 0.45,
        roughness: 0.26,
      }),
    );
    const inductionGlowMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xfb923c,
        emissive: new THREE.Color(0xf97316),
        emissiveIntensity: 1.2,
        roughness: 0.2,
      }),
    );
    const waterMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        metalness: 0.06,
        roughness: 0.08,
        clearcoat: 1.0,
        transparent: true,
        opacity: isSoftwareGl ? 0.56 : 0.68,
        depthWrite: false,
      }),
    );
    const warmAirMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0xfbbf24,
        emissive: new THREE.Color(0xf97316),
        emissiveIntensity: 0.35,
        roughness: 0.14,
        clearcoat: 0.8,
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
      }),
    );
    const ovenWarmWindowMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xfde68a,
        emissive: new THREE.Color(0xf97316),
        emissiveIntensity: 0.85,
        roughness: 0.25,
        metalness: 0.1,
      }),
    );
    const frostCrystalMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0x7dd3fc,
        emissive: new THREE.Color(0x0ea5e9),
        emissiveIntensity: 0.42,
        metalness: 0.15,
        roughness: 0.12,
        clearcoat: 1.0,
        transparent: true,
        opacity: 0.85,
      }),
    );

    const shadowTex = trackTex(createStudioFloorShadow());
    const floorShadow = new THREE.Mesh(
      trackGeo(new THREE.PlaneGeometry(4.8, 4.4)),
      trackMat(
        new THREE.MeshBasicMaterial({
          map: shadowTex,
          transparent: true,
          depthWrite: false,
          opacity: 0.68,
        }),
      ),
    );
    floorShadow.rotation.x = -Math.PI / 2;
    floorShadow.position.y = -1.16;
    scene.add(floorShadow);

    /* ── BUILDERS FOR ALL ELECTROMÉNAGER ── */

    const buildWasherOrDryer = (isDryer: boolean) => {
      const root = new THREE.Group();
      const body = new THREE.Mesh(
        trackGeo(createRoundedBoxGeo(1.34, 1.72, 1.1, 0.16, 0.05)),
        ceramicWhite,
      );
      root.add(body);

      const fascia = new THREE.Mesh(
        trackGeo(createRoundedBoxGeo(1.28, 0.34, 0.08, 0.09, 0.018)),
        isDryer ? softAmberPanel : softBluePanel,
      );
      fascia.position.set(0, 0.64, 0.53);
      const drawer = new THREE.Mesh(
        trackGeo(createRoundedBoxGeo(0.38, 0.18, 0.08, 0.04, 0.015)),
        ceramicWhite,
      );
      drawer.position.set(-0.36, 0.64, 0.56);
      const dial = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.1, 0.1, 0.09, 24)),
        isDryer ? amberAccentMat : skyAccentMat,
      );
      dial.rotation.x = Math.PI / 2;
      dial.position.set(0.08, 0.64, 0.58);
      const ledBar = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.26, 0.085, 0.05)),
        obsidianGlass,
      );
      ledBar.position.set(0.4, 0.64, 0.57);
      root.add(fascia, drawer, dial, ledBar);

      const doorRim = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(0.46, 0.072, 18, 48)),
        brightChrome,
      );
      doorRim.position.set(0, -0.14, 0.57);
      const drumBack = new THREE.Mesh(
        trackGeo(new THREE.CircleGeometry(0.43, 36)),
        obsidianGlass,
      );
      drumBack.position.set(0, -0.14, 0.53);

      const drumSpin = new THREE.Group();
      drumSpin.position.set(0, -0.14, 0.56);
      const swirlMat = isDryer ? warmAirMat : waterMat;
      const waveA = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(0.27, 0.064, 14, 34, Math.PI * 1.35)),
        swirlMat,
      );
      const waveB = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(0.16, 0.048, 12, 26, Math.PI * 1.15)),
        swirlMat,
      );
      waveB.rotation.z = Math.PI;
      drumSpin.add(waveA, waveB);

      const glassCover = new THREE.Mesh(
        trackGeo(new THREE.SphereGeometry(0.43, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.3)),
        swirlMat,
      );
      glassCover.rotation.x = Math.PI / 2;
      glassCover.position.set(0, -0.14, 0.42);
      glassCover.renderOrder = 3;

      root.add(doorRim, drumBack, drumSpin, glassCover);
      return { root, drumSpin };
    };

    const buildDishwasher = () => {
      const root = new THREE.Group();
      const shell = new THREE.Mesh(
        trackGeo(createRoundedBoxGeo(1.24, 1.54, 1.04, 0.14, 0.04)),
        satinSteel,
      );
      const topStrip = new THREE.Mesh(
        trackGeo(createRoundedBoxGeo(1.18, 0.28, 0.07, 0.07, 0.015)),
        softBluePanel,
      );
      topStrip.position.set(0, 0.58, 0.51);
      const handle = new THREE.Mesh(
        trackGeo(createRoundedBoxGeo(0.56, 0.075, 0.09, 0.03, 0.01)),
        brightChrome,
      );
      handle.position.set(0.12, 0.58, 0.57);
      const bay = new THREE.Mesh(
        trackGeo(createRoundedBoxGeo(0.96, 0.9, 0.14, 0.09, 0.018)),
        obsidianGlass,
      );
      bay.position.set(0, -0.14, 0.48);

      const dishRack = new THREE.Group();
      dishRack.position.set(0, -0.18, 0.54);
      const rackTray = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.84, 0.045, 0.38)),
        brightChrome,
      );
      rackTray.position.y = -0.16;
      dishRack.add(rackTray);

      const plateGeo = trackGeo(new THREE.CylinderGeometry(0.17, 0.17, 0.038, 22));
      for (let i = 0; i < 4; i++) {
        const plate = new THREE.Mesh(plateGeo, ceramicWhite);
        plate.rotation.z = Math.PI / 2;
        plate.position.set(-0.25 + i * 0.17, 0.04, 0);
        dishRack.add(plate);
      }

      const sprayArm = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.66, 0.042, 0.07)),
        skyAccentMat,
      );
      sprayArm.position.set(0, -0.4, 0.58);

      root.add(shell, topStrip, handle, bay, dishRack, sprayArm);
      return { root, dishRack, sprayArm };
    };

    const buildOvenWithCooktopAndHood = () => {
      const root = new THREE.Group();
      const shell = new THREE.Mesh(
        trackGeo(createRoundedBoxGeo(1.28, 1.48, 1.04, 0.14, 0.04)),
        obsidianGlass,
      );
      root.add(shell);

      // Integrated Induction / Ceramic Cooktop surface on top of the range
      const cooktopPlate = new THREE.Mesh(
        trackGeo(createRoundedBoxGeo(1.26, 0.06, 1.02, 0.08, 0.012)),
        obsidianGlass,
      );
      cooktopPlate.position.set(0, 0.76, 0);
      root.add(cooktopPlate);

      const ringGeoA = trackGeo(new THREE.TorusGeometry(0.2, 0.02, 10, 32));
      const ringGeoB = trackGeo(new THREE.TorusGeometry(0.15, 0.018, 10, 28));
      const burners: THREE.Mesh[] = [];
      [
        [-0.3, -0.2, true],
        [0.3, -0.2, false],
        [-0.3, 0.22, false],
        [0.3, 0.22, true],
      ].forEach(([bx, bz, isBig]) => {
        const b = new THREE.Mesh(isBig ? ringGeoA : ringGeoB, inductionGlowMat);
        b.rotation.x = Math.PI / 2;
        b.position.set(bx as number, 0.8, bz as number);
        root.add(b);
        burners.push(b);
      });

      // Top dial fascia + 4 brass knobs
      const consoleBar = new THREE.Mesh(
        trackGeo(createRoundedBoxGeo(1.22, 0.28, 0.07, 0.07, 0.015)),
        satinSteel,
      );
      consoleBar.position.set(0, 0.54, 0.52);
      root.add(consoleBar);
      const knobGeo = trackGeo(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 18));
      [-0.44, -0.26, 0.26, 0.44].forEach((kx) => {
        const k = new THREE.Mesh(knobGeo, amberAccentMat);
        k.rotation.x = Math.PI / 2;
        k.position.set(kx, 0.54, 0.57);
        root.add(k);
      });

      // Warm oven cavity & hinged door
      const cavity = new THREE.Mesh(
        trackGeo(new THREE.PlaneGeometry(0.92, 0.74)),
        ovenWarmWindowMat,
      );
      cavity.position.set(0, -0.14, 0.525);
      root.add(cavity);

      const doorPivot = new THREE.Group();
      doorPivot.position.set(0, -0.58, 0.54);
      const doorFrame = new THREE.Mesh(
        trackGeo(createRoundedBoxGeo(1.16, 0.9, 0.07, 0.09, 0.018)),
        satinSteel,
      );
      doorFrame.position.set(0, 0.45, 0.02);
      const doorWin = new THREE.Mesh(
        trackGeo(createRoundedBoxGeo(0.88, 0.58, 0.08, 0.07, 0.012)),
        ovenWarmWindowMat,
      );
      doorWin.position.set(0, 0.43, 0.03);
      const doorHandle = new THREE.Mesh(
        trackGeo(createRoundedBoxGeo(0.76, 0.065, 0.11, 0.028, 0.01)),
        brightChrome,
      );
      doorHandle.position.set(0, 0.8, 0.09);
      doorPivot.add(doorFrame, doorWin, doorHandle);
      root.add(doorPivot);

      // Sleek Chimney Range Hood hovering gracefully above cooktop
      const hood = new THREE.Group();
      hood.position.set(0, 1.48, -0.12);
      const canopy = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.28, 0.84, 0.28, 4)),
        satinSteel,
      );
      canopy.rotation.y = Math.PI / 4;
      const chimney = new THREE.Mesh(
        trackGeo(createRoundedBoxGeo(0.38, 0.58, 0.36, 0.05, 0.015)),
        brightChrome,
      );
      chimney.position.y = 0.38;
      const hoodLed = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.74, 0.035, 0.05)),
        skyAccentMat,
      );
      hoodLed.position.set(0, -0.14, 0.42);
      hood.add(canopy, chimney, hoodLed);
      root.add(hood);

      return { root, doorPivot, hood, burners };
    };

    const buildCoffeeMachine = () => {
      const root = new THREE.Group();
      const body = new THREE.Mesh(
        trackGeo(createRoundedBoxGeo(1.12, 1.56, 1.02, 0.16, 0.045)),
        obsidianGlass,
      );
      root.add(body);

      const header = new THREE.Mesh(
        trackGeo(createRoundedBoxGeo(1.06, 0.38, 0.12, 0.1, 0.02)),
        satinSteel,
      );
      header.position.set(0, 0.56, 0.49);
      const dial = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 20)),
        amberAccentMat,
      );
      dial.rotation.x = Math.PI / 2;
      dial.position.set(-0.3, 0.56, 0.56);
      const display = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.42, 0.16, 0.05)),
        obsidianGlass,
      );
      display.position.set(0.16, 0.56, 0.55);
      const displayGlow = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.28, 0.035, 0.02)),
        amberAccentMat,
      );
      displayGlow.position.set(0.16, 0.56, 0.58);

      // Brew alcove + chrome spout + animated espresso stream + ceramic cup
      const dripTray = new THREE.Mesh(
        trackGeo(createRoundedBoxGeo(1.06, 0.14, 0.52, 0.06, 0.018)),
        brightChrome,
      );
      dripTray.position.set(0, -0.7, 0.48);

      const spout = new THREE.Mesh(
        trackGeo(createRoundedBoxGeo(0.28, 0.18, 0.24, 0.05, 0.015)),
        brightChrome,
      );
      spout.position.set(0, 0.2, 0.56);

      const streamGeo = trackGeo(new THREE.CylinderGeometry(0.022, 0.018, 0.58, 12));
      const streamL = new THREE.Mesh(streamGeo, espressoBrown);
      streamL.position.set(-0.055, -0.14, 0.58);
      const streamR = new THREE.Mesh(streamGeo, espressoBrown);
      streamR.position.set(0.055, -0.14, 0.58);

      // Ceramic espresso cup on tray
      const cupGroup = new THREE.Group();
      cupGroup.position.set(0, -0.44, 0.56);
      const cupBody = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.22, 0.17, 0.34, 28)),
        ceramicWhite,
      );
      const cupHandle = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(0.1, 0.028, 10, 22, Math.PI)),
        ceramicWhite,
      );
      cupHandle.rotation.z = -Math.PI / 2;
      cupHandle.position.set(0.2, 0, 0);
      const crema = new THREE.Mesh(
        trackGeo(new THREE.CircleGeometry(0.2, 24)),
        amberAccentMat,
      );
      crema.rotation.x = -Math.PI / 2;
      crema.position.y = 0.172;
      cupGroup.add(cupBody, cupHandle, crema);

      root.add(header, dial, display, displayGlow, dripTray, spout, streamL, streamR, cupGroup);
      return { root, streamL, streamR, cupGroup };
    };

    const buildMicrowave = () => {
      const root = new THREE.Group();
      const body = new THREE.Mesh(
        trackGeo(createRoundedBoxGeo(1.52, 0.96, 0.96, 0.14, 0.04)),
        satinSteel,
      );
      const winFrame = new THREE.Mesh(
        trackGeo(createRoundedBoxGeo(0.92, 0.68, 0.08, 0.08, 0.016)),
        obsidianGlass,
      );
      winFrame.position.set(-0.18, 0, 0.47);
      const innerGlow = new THREE.Mesh(
        trackGeo(new THREE.PlaneGeometry(0.8, 0.56)),
        ovenWarmWindowMat,
      );
      innerGlow.position.set(-0.18, 0, 0.515);

      // Rotating glass turntable with ceramic bowl inside window
      const turntable = new THREE.Group();
      turntable.position.set(-0.18, -0.18, 0.53);
      const disc = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.28, 0.28, 0.04, 24)),
        waterMat,
      );
      const bowl = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.15, 0.11, 0.14, 20)),
        ceramicWhite,
      );
      bowl.position.set(0.06, 0.09, 0);
      turntable.add(disc, bowl);

      // Right control column
      const dial = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 20)),
        skyAccentMat,
      );
      dial.rotation.x = Math.PI / 2;
      dial.position.set(0.52, 0.04, 0.5);
      const led = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.24, 0.14, 0.05)),
        obsidianGlass,
      );
      led.position.set(0.52, 0.28, 0.49);

      root.add(body, winFrame, innerGlow, turntable, dial, led);
      return { root, turntable };
    };

    const buildFridge = () => {
      const root = new THREE.Group();
      const body = new THREE.Mesh(
        trackGeo(createRoundedBoxGeo(1.18, 2.02, 0.98, 0.15, 0.045)),
        satinSteel,
      );
      const coolInterior = new THREE.Mesh(
        trackGeo(new THREE.PlaneGeometry(0.94, 1.02)),
        skyAccentMat,
      );
      coolInterior.position.set(0, 0.36, 0.495);

      const lowerDoor = new THREE.Mesh(
        trackGeo(createRoundedBoxGeo(1.12, 0.68, 0.11, 0.11, 0.022)),
        ceramicWhite,
      );
      lowerDoor.position.set(0, -0.6, 0.52);
      const lowerHandle = new THREE.Mesh(
        trackGeo(createRoundedBoxGeo(0.07, 0.34, 0.09, 0.028, 0.01)),
        skyAccentMat,
      );
      lowerHandle.position.set(-0.4, -0.6, 0.6);

      const upperDoorPivot = new THREE.Group();
      upperDoorPivot.position.set(0.55, 0.38, 0.52);
      const upperDoor = new THREE.Mesh(
        trackGeo(createRoundedBoxGeo(1.12, 1.14, 0.11, 0.11, 0.022)),
        ceramicWhite,
      );
      upperDoor.position.set(-0.55, 0, 0);
      const upperHandle = new THREE.Mesh(
        trackGeo(createRoundedBoxGeo(0.07, 0.52, 0.09, 0.028, 0.01)),
        skyAccentMat,
      );
      upperHandle.position.set(-0.95, -0.06, 0.08);
      upperDoorPivot.add(upperDoor, upperHandle);

      root.add(body, coolInterior, lowerDoor, lowerHandle, upperDoorPivot);
      return { root, upperDoorPivot };
    };

    const buildFreezer = () => {
      const root = new THREE.Group();
      const body = new THREE.Mesh(
        trackGeo(createRoundedBoxGeo(1.12, 1.56, 0.96, 0.15, 0.045)),
        softBluePanel,
      );
      root.add(body);
      const drawers: THREE.Mesh[] = [];
      [-0.44, 0.0, 0.44].forEach((dy) => {
        const dr = new THREE.Mesh(
          trackGeo(createRoundedBoxGeo(0.92, 0.34, 0.12, 0.07, 0.018)),
          ceramicWhite,
        );
        dr.position.set(0, dy, 0.49);
        const bar = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(0.42, 0.045, 0.04)),
          skyAccentMat,
        );
        bar.position.set(0, 0, 0.07);
        dr.add(bar);
        root.add(dr);
        drawers.push(dr);
      });
      return { root, drawers };
    };

    /* ── Helper for Floating Bubbles / Steam Particles ── */
    const createParticles = (count: number, spreadX: number, centerY: number, colorHex: number) => {
      const pPos = new Float32Array(count * 3);
      const pPhase = new Float32Array(count);
      const pSize = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        const s1 = Math.sin(i * 12.9898 + 0.5) * 43758.5453;
        const r1 = s1 - Math.floor(s1);
        const s2 = Math.sin(i * 78.233 + 2.1) * 24634.6345;
        const r2 = s2 - Math.floor(s2);
        const s3 = Math.sin(i * 45.164 + 4.3) * 19531.231;
        const r3 = s3 - Math.floor(s3);
        pPos[i * 3] = (r1 - 0.5) * spreadX;
        pPos[i * 3 + 1] = centerY + (r2 - 0.5) * 0.6;
        pPos[i * 3 + 2] = (r3 - 0.5) * 0.7;
        pPhase[i] = r1;
        pSize[i] = 6.5 + r3 * 12.5;
      }
      const g = trackGeo(new THREE.BufferGeometry());
      g.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
      g.setAttribute("aPhase", new THREE.BufferAttribute(pPhase, 1));
      g.setAttribute("aSize", new THREE.BufferAttribute(pSize, 1));
      const uniforms = {
        uTime: { value: 0 },
        uPixelRatio: { value: pr0 },
        uOpacity: { value: 1 },
        uColor: { value: new THREE.Color(colorHex) },
      };
      const pts = new THREE.Points(
        g,
        trackMat(
          new THREE.ShaderMaterial({
            uniforms,
            vertexShader: PARTICLE_VERT,
            fragmentShader: PARTICLE_FRAG,
            transparent: true,
            depthWrite: false,
          }),
        ),
      );
      pts.renderOrder = 4;
      return { pts, uniforms };
    };

    /* ── Assemble the 4 Cinema Acts ── */
    // ACT 1: Washing Machine + Heat-Pump Dryer Duo
    const act1 = new THREE.Group();
    const washer1 = buildWasherOrDryer(false);
    washer1.root.position.set(-0.84, -0.22, 0.06);
    washer1.root.rotation.y = 0.2;
    const dryer1 = buildWasherOrDryer(true);
    dryer1.root.position.set(0.84, -0.22, 0.06);
    dryer1.root.rotation.y = -0.2;
    const bubbles1 = createParticles(isSoftwareGl ? 32 : 64, 2.8, -0.5, 0x38bdf8);
    act1.add(washer1.root, dryer1.root, bubbles1.pts);
    scene.add(act1);

    // ACT 2: Dishwasher + Oven with Induction Cooktop + Range Hood
    const act2 = new THREE.Group();
    const dishwasher2 = buildDishwasher();
    dishwasher2.root.position.set(-0.92, -0.32, 0.05);
    dishwasher2.root.rotation.y = 0.22;
    const ovenSuite2 = buildOvenWithCooktopAndHood();
    ovenSuite2.root.position.set(0.88, -0.34, 0.05);
    ovenSuite2.root.rotation.y = -0.22;
    act2.add(dishwasher2.root, ovenSuite2.root);
    act2.visible = false;
    scene.add(act2);

    // ACT 3: Coffee Machine (pouring espresso + aroma steam) + Microwave (spinning turntable)
    const act3 = new THREE.Group();
    const coffee3 = buildCoffeeMachine();
    coffee3.root.position.set(-0.86, -0.26, 0.06);
    coffee3.root.rotation.y = 0.22;
    const micro3 = buildMicrowave();
    micro3.root.position.set(0.88, -0.52, 0.08);
    micro3.root.rotation.y = -0.22;
    const aroma3 = createParticles(isSoftwareGl ? 24 : 48, 0.85, -0.35, 0xfbbf24);
    aroma3.pts.position.set(-0.86, 0, 0.55);
    act3.add(coffee3.root, micro3.root, aroma3.pts);
    act3.visible = false;
    scene.add(act3);

    // ACT 4: Refrigerator + Upright Freezer + Orbiting Frost Crystals
    const act4 = new THREE.Group();
    const fridge4 = buildFridge();
    fridge4.root.position.set(-0.78, -0.08, 0.1);
    fridge4.root.rotation.y = 0.18;
    const freezer4 = buildFreezer();
    freezer4.root.position.set(0.84, -0.3, 0.06);
    freezer4.root.rotation.y = -0.22;

    const crystalCount = isSoftwareGl ? 18 : 30;
    const crystalGeo = trackGeo(new THREE.OctahedronGeometry(0.082, 0));
    const frostCrystals = new THREE.InstancedMesh(crystalGeo, frostCrystalMat, crystalCount);
    frostCrystals.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    frostCrystals.frustumCulled = false;

    act4.add(fridge4.root, freezer4.root, frostCrystals);
    act4.visible = false;
    scene.add(act4);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const handleResize = () => {
      if (!mount) return;
      const w = Math.max(mount.clientWidth, 240);
      const h = Math.max(mount.clientHeight, 180);
      const pr = getPr();
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(pr);
      renderer.setSize(w, h, false);
      bgUniforms.uResolution.value.set(w, h);
      bubbles1.uniforms.uPixelRatio.value = pr;
      aroma3.uniforms.uPixelRatio.value = pr;
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(mount);

    let disposed = false;
    let rafId = 0;
    let timerId = 0;
    let lastUiSync = 0;
    const clock = new THREE.Clock();
    const _dummy = new THREE.Object3D();
    const _lookAt = new THREE.Vector3(0, -0.1, 0);

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

    const renderFilmAt = (t: number) => {
      const wrapped = ((t % FILM_DURATION) + FILM_DURATION) % FILM_DURATION;
      const chapterIdx = Math.min(3, Math.floor(wrapped / 8));
      const localT = wrapped - chapterIdx * 8;
      const localNorm = localT / 8;

      bgUniforms.uTime.value = wrapped;
      const nextBlend = smoothstep(7.1, 8.0, localT);
      const weights = [0, 0, 0, 0];
      weights[chapterIdx] = 1 - nextBlend;
      weights[(chapterIdx + 1) % 4] = nextBlend;
      bgUniforms.uMix.value.set(weights[0], weights[1], weights[2], weights[3]);

      const cutIn = smoothstep(0.0, 0.85, localT);
      const cutOut = 1 - smoothstep(7.15, 8.0, localT);
      const envelope = Math.max(0.001, cutIn * cutOut);

      act1.visible = chapterIdx === 0;
      act2.visible = chapterIdx === 1;
      act3.visible = chapterIdx === 2;
      act4.visible = chapterIdx === 3;

      if (chapterIdx === 0) {
        // Scene 01: Washer & Dryer spinning harmoniously with live bubbles
        const angle = -0.34 + localNorm * 0.68;
        const dist = 5.15 - Math.sin(localNorm * Math.PI) * 0.4;
        camera.position.set(Math.sin(angle) * dist, 0.25, Math.cos(angle) * dist);
        camera.lookAt(_lookAt);

        act1.scale.setScalar(0.88 + envelope * 0.12);
        washer1.drumSpin.rotation.z = -wrapped * 3.1;
        dryer1.drumSpin.rotation.z = wrapped * 2.2;
        washer1.root.rotation.z = Math.sin(wrapped * 5.0) * 0.02;
        dryer1.root.rotation.z = Math.cos(wrapped * 3.6) * 0.015;
        bubbles1.uniforms.uTime.value = wrapped;
        bubbles1.uniforms.uOpacity.value = envelope;
        accentLightCool.intensity = 1.6 * envelope;
        accentLightWarm.intensity = 1.2 * envelope;
      } else if (chapterIdx === 1) {
        // Scene 02: Dishwasher gliding rack + Oven door arc + Cooktop glow + Range Hood
        const panX = -0.45 + localNorm * 0.9;
        camera.position.set(panX, 0.5, 5.55 - Math.sin(localNorm * Math.PI) * 0.35);
        _lookAt.set(0, 0.05, 0);
        camera.lookAt(_lookAt);
        _lookAt.set(0, -0.1, 0);

        act2.scale.setScalar(0.88 + envelope * 0.12);
        const slideWave = Math.sin(localNorm * Math.PI);
        dishwasher2.dishRack.position.z = 0.54 + slideWave * 0.22;
        dishwasher2.sprayArm.rotation.y = localT * 4.5;

        const openArc = smoothstep(0.18, 0.55, localNorm) * (1 - smoothstep(0.68, 0.92, localNorm));
        ovenSuite2.doorPivot.rotation.x = openArc * 0.44;
        ovenWarmWindowMat.emissiveIntensity = 0.65 + openArc * 1.05;
        inductionGlowMat.emissiveIntensity = 0.7 + 0.6 * Math.sin(localT * 3.0);
        ovenSuite2.hood.position.y = 1.48 + Math.sin(localT * 1.6) * 0.04;

        accentLightWarm.intensity = (1.3 + openArc * 2.0) * envelope;
        accentLightCool.intensity = 0.9 * envelope;
      } else if (chapterIdx === 2) {
        // Scene 03: Coffee Machine pouring espresso + Microwave spinning turntable
        const angle = 0.32 - localNorm * 0.64;
        const dist = 5.05 - Math.sin(localNorm * Math.PI) * 0.35;
        camera.position.set(Math.sin(angle) * dist, 0.24, Math.cos(angle) * dist);
        camera.lookAt(_lookAt);

        act3.scale.setScalar(0.88 + envelope * 0.12);
        const pour = smoothstep(0.1, 0.35, localNorm) * (1 - smoothstep(0.75, 0.94, localNorm));
        coffee3.streamL.scale.set(1, Math.max(0.01, pour), 1);
        coffee3.streamR.scale.set(1, Math.max(0.01, pour), 1);
        coffee3.cupGroup.position.y = -0.44 + Math.sin(localT * 1.8) * 0.015;
        micro3.turntable.rotation.y = localT * 2.4;
        aroma3.uniforms.uTime.value = wrapped;
        aroma3.uniforms.uOpacity.value = envelope * (0.5 + 0.5 * pour);

        accentLightWarm.intensity = 2.0 * envelope;
        accentLightCool.intensity = 0.5 * envelope;
      } else {
        // Scene 04: Refrigerator swinging door + Freezer gliding drawers + Frost crystals
        const angle = -0.3 + localNorm * 0.6;
        const dist = 5.2 + localNorm * 0.45;
        camera.position.set(Math.sin(angle) * dist, 0.24, Math.cos(angle) * dist);
        camera.lookAt(_lookAt);

        act4.scale.setScalar(0.88 + envelope * 0.12);
        const fridgeOpen =
          smoothstep(0.14, 0.48, localNorm) * (1 - smoothstep(0.64, 0.88, localNorm));
        fridge4.upperDoorPivot.rotation.y = fridgeOpen * 0.65;

        // Freezer middle drawer glides smoothly open and closed
        freezer4.drawers[1].position.z = 0.49 + fridgeOpen * 0.22;

        for (let i = 0; i < crystalCount; i++) {
          const baseA = (i / crystalCount) * Math.PI * 2 + localT * 0.48;
          const rad = 1.0 + (i % 4) * 0.36;
          const yOff = -0.6 + ((i * 0.29 + localT * 0.32) % 1.9);
          _dummy.position.set(Math.cos(baseA) * rad, yOff, Math.sin(baseA) * rad * 0.6 + 0.18);
          _dummy.rotation.set(localT * 0.9 + i, localT * 1.1 + i, 0);
          _dummy.scale.setScalar((0.55 + (i % 3) * 0.28) * envelope);
          _dummy.updateMatrix();
          frostCrystals.setMatrixAt(i, _dummy.matrix);
        }
        frostCrystals.instanceMatrix.needsUpdate = true;

        accentLightCool.intensity = (1.3 + fridgeOpen * 2.2) * envelope;
        accentLightWarm.intensity = 0.2 * envelope;
      }

      renderer.clear();
      renderer.render(bgScene, bgCam);
      renderer.clearDepth();
      renderer.render(scene, camera);
    };

    const tick = () => {
      if (disposed) return;
      if (document.hidden) {
        timerId = window.setTimeout(tick, 240);
        return;
      }

      const dt = Math.min(clock.getDelta(), 0.05);

      if (seekRequestRef.current !== null) {
        filmTimeRef.current = seekRequestRef.current;
        seekRequestRef.current = null;
        setCurrentTime(filmTimeRef.current);
      } else if (isPlayingRef.current) {
        filmTimeRef.current = (filmTimeRef.current + dt) % FILM_DURATION;
        const now = performance.now();
        if (now - lastUiSync > 90) {
          lastUiSync = now;
          setCurrentTime(filmTimeRef.current);
        }
      }

      renderFilmAt(filmTimeRef.current);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timerId);
      ro.disconnect();
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      texs.forEach((t) => t.dispose());
      scene.environment = null;
      envRT.dispose();
      pmrem.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [isVisible]);

  const handleSeek = (sec: number, deviceOverride?: string) => {
    const clamped = Math.max(0, Math.min(FILM_DURATION - 0.05, sec));
    filmTimeRef.current = clamped;
    seekRequestRef.current = clamped;
    setCurrentTime(clamped);
    setSelectedDeviceHint(deviceOverride ?? null);
  };

  const progressPct = (currentTime / FILM_DURATION) * 100;

  return (
    <div
      ref={containerRef}
      className="grid gap-6 lg:gap-8 lg:grid-cols-12 items-stretch"
    >
      {/* Left 7 Columns: 4-Scene 3D Animated Home-Appliance Film Player */}
      <div className="lg:col-span-7 flex flex-col rounded-2xl border border-white/12 bg-slate-900 overflow-hidden shadow-[0_24px_64px_-20px_rgba(2,6,23,0.75)]">
        {/* Top Cinema Bar */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 sm:px-5 py-3 bg-slate-950">
          <div className="flex items-center gap-2 text-xs text-slate-300 min-w-0">
            <span className="font-mono font-bold text-sky-400 tabular-nums shrink-0">
              {activeChapter.index}
            </span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span className="font-semibold text-white truncate">
              {activeChapter.cinemaHeadline}
            </span>
          </div>
          <span className="font-mono text-[11px] font-semibold text-slate-400 tabular-nums whitespace-nowrap shrink-0">
            {formatTimecode(currentTime)} / {formatTimecode(FILM_DURATION)}
          </span>
        </div>

        {/* Real-Time 3D Cinema Viewport */}
        <div className="relative flex-1 min-h-[260px] sm:min-h-[360px] lg:min-h-[420px] bg-slate-950 overflow-hidden">
          <div
            ref={mountRef}
            className="absolute inset-0"
            aria-label={`3D-Animationsfilm: ${activeChapter.cinemaHeadline}`}
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/92 via-slate-950/42 to-transparent px-4 sm:px-6 pt-12 pb-4 sm:pb-5">
            <p className="text-[11px] sm:text-xs font-semibold text-sky-300">
              {activeChapter.cinemaKicker}
            </p>
            <p className="mt-0.5 text-base sm:text-xl font-extrabold text-white tracking-tight">
              {activeChapter.cinemaHeadline}
            </p>
          </div>
        </div>

        {/* Unified Bottom Video Control Bar */}
        <div className="border-t border-white/10 bg-slate-950 px-4 sm:px-5 py-3.5 space-y-3">
          {/* Interactive Timeline Scrubber */}
          <div className="relative flex items-center py-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-sky-400 transition-[width] duration-100 ease-linear"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={FILM_DURATION * 10}
              value={Math.round(currentTime * 10)}
              onChange={(e) => handleSeek(Number(e.target.value) / 10)}
              aria-label="Film-Zeitleiste"
              className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
            />
          </div>

          {/* Playback + 4-Scene Chapter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback(20);
                  setIsPlaying((prev) => !prev);
                }}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-sky-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-sky-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isPlaying ? (
                  <>
                    <Pause size={14} aria-hidden="true" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play size={14} aria-hidden="true" />
                    <span>Abspielen</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHapticFeedback(15);
                  handleSeek(0);
                  setIsPlaying(true);
                }}
                aria-label="Film neu starten"
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-white/12 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:border-white/25 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw size={13} aria-hidden="true" />
                <span className="hidden sm:inline">Neustart</span>
              </button>
            </div>

            <div
              role="tablist"
              aria-label="Szene im 3D-Film wählen"
              className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-900 p-1 border border-white/8"
            >
              {FILM_CHAPTERS.map((chap) => {
                const isSelected = chap.id === activeChapter.id;
                return (
                  <button
                    key={chap.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => {
                      triggerHapticFeedback(18);
                      handleSeek(chap.startSec + 0.05);
                      setIsPlaying(true);
                    }}
                    className={`min-h-[34px] rounded-lg px-2.5 py-1 text-[11px] sm:text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isSelected
                        ? "bg-white text-slate-950 font-bold"
                        : "text-slate-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {chap.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Right 5 Columns: Complete 10-Appliance Visual Selector + Synchronized Details */}
      <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-white/12 bg-slate-900/90 p-5 sm:p-6">
        <div className="space-y-5">
          {/* Complete Flaticon-Inspired 10-Appliance Jump Grid (5 x 2 on desktop, clean symmetry) */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2 border-b border-white/10 pb-4">
            {QUICK_APPLIANCES.map(({ label, sec, chapter, device, Icon }) => {
              const active = activeChapterIndex === chapter;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback(18);
                    handleSeek(sec, device);
                    setIsPlaying(true);
                  }}
                  className={`group flex flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2 transition-all cursor-pointer ${
                    active
                      ? "border-sky-400/55 bg-sky-500/12 text-white"
                      : "border-white/8 bg-slate-950/70 text-slate-300 hover:border-white/25 hover:text-white"
                  }`}
                >
                  <Icon className="h-8 w-8 text-slate-200 transition-transform duration-300 group-hover:-translate-y-0.5" />
                  <span className="text-[10px] font-semibold whitespace-nowrap truncate max-w-full">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-sky-400">
              {activeChapter.index} · {activeChapter.appliance}
            </p>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight text-balance">
              {activeChapter.label}
            </h3>
            <p className="text-xs sm:text-[13px] font-medium text-slate-400">
              {activeChapter.subtitle}
            </p>
          </div>

          <p className="text-sm leading-relaxed text-slate-300">
            {activeChapter.description}
          </p>

          <dl className="divide-y divide-white/10 border-y border-white/10">
            {activeChapter.specs.map((row) => (
              <div
                key={row.label}
                className="py-2.5 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4"
              >
                <dt className="text-xs font-medium text-slate-400 shrink-0">{row.label}</dt>
                <dd className="text-xs sm:text-[13px] font-semibold text-white sm:text-right">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="pt-5 mt-5 border-t border-white/10 space-y-3">
          <p className="text-xs leading-relaxed text-slate-400">
            Typenschild abfotografieren und direkt an Kamal Hannachi senden – schnelle,
            persönliche Rückmeldung für jedes Hausgerät.
          </p>
          <button
            type="button"
            onClick={() => {
              triggerHapticFeedback(30);
              onRequestPart(
                selectedDeviceHint ?? activeChapter.quickRequestCategory,
                activeChapter.quickRequestPart,
              );
            }}
            className="w-full inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-sky-400 active:scale-[0.99] transition-all cursor-pointer whitespace-nowrap"
          >
            <span>Direkt persönlich anfragen</span>
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
