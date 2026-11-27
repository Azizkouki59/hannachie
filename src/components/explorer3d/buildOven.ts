import * as THREE from "three";
import {
  addArchitecturalEdges,
  createChamferedBoxGeo,
  createEngineeringLeaderLine,
  createHollowFrameGeo,
} from "./studioCore";
import {
  getApplianceMeta,
  type BuiltApplianceAssembly,
  type BuiltSparePart,
  type StudioBuilderContext,
} from "./types";

/**
 * High-precision cutaway: Backofen & Herd
 * 8 real failure-prone spare parts: Ringheizkörper, Oberhitze/Grill, Unterhitze,
 * Umluft-Ventilator, Thermostat/NTC, Wahlschalter/Regler, Türdichtung/Scharniere, Kochfeld & Lampe.
 */
export function buildOvenAssembly(
  ctx: StudioBuilderContext,
): BuiltApplianceAssembly {
  const meta = getApplianceMeta("backofen");
  const { trackGeo, trackMat, materials, isSoftwareGl } = ctx;
  const root = new THREE.Group();

  const chassisMaterials: THREE.MeshPhysicalMaterial[] = [];
  const chassisBaseOpacities: number[] = [];
  const edgeMaterials: THREE.LineBasicMaterial[] = [];

  const steelShellMat = materials.darkChassis();
  const fasciaMat = materials.satinSteel();
  const cooktopGlassMat = materials.obsidianGlass();
  const edgeMat = materials.edgeLine();
  chassisMaterials.push(steelShellMat, fasciaMat, cooktopGlassMat);
  chassisBaseOpacities.push(1, 1, 0.88);
  edgeMaterials.push(edgeMat);

  // Main architectural oven chassis
  const body = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(1.52, 1.76, 1.2, 0.08, 0.025)),
    steelShellMat,
  );
  body.castShadow = !isSoftwareGl;
  body.receiveShadow = !isSoftwareGl;
  addArchitecturalEdges(body, edgeMat, trackGeo, 35);
  root.add(body);

  // Integrated Ceran / Induction glass cooktop plate
  const cooktop = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(1.54, 0.06, 1.22, 0.06, 0.01)),
    cooktopGlassMat,
  );
  cooktop.position.set(0, 0.91, 0);
  addArchitecturalEdges(cooktop, edgeMat, trackGeo, 40);
  root.add(cooktop);

  // Satin-steel upper dial console
  const consoleBar = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(1.48, 0.28, 0.06, 0.04, 0.01)),
    fasciaMat,
  );
  consoleBar.position.set(0, 0.68, 0.6);
  root.add(consoleBar);

  const knobGeo = trackGeo(new THREE.CylinderGeometry(0.052, 0.06, 0.065, 18));
  [-0.5, -0.32, 0.32, 0.5].forEach((kx) => {
    const knob = new THREE.Mesh(knobGeo, materials.brightChrome());
    knob.rotation.x = Math.PI / 2;
    knob.position.set(kx, 0.68, 0.64);
    root.add(knob);
  });

  const invisibleHitMat = trackMat(new THREE.MeshBasicMaterial({ visible: false }));
  const parts: BuiltSparePart[] = [];
  const allClickables: THREE.Object3D[] = [];

  const registerPart = (
    partIndex: number,
    group: THREE.Group,
    basePosition: THREE.Vector3,
    explodeOffset: THREE.Vector3,
    anchorLocal: THREE.Vector3,
    focusOffset: THREE.Vector3,
    highlightMaterials: THREE.MeshStandardMaterial[],
    hitRadius?: number,
  ) => {
    const partMeta = meta.parts[partIndex];
    group.position.copy(basePosition);
    if (hitRadius) {
      const proxy = new THREE.Mesh(
        trackGeo(new THREE.SphereGeometry(hitRadius, 10, 8)),
        invisibleHitMat,
      );
      proxy.userData.partId = partMeta.id;
      group.add(proxy);
    }
    const clickableMeshes: THREE.Object3D[] = [];
    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.userData.partId = partMeta.id;
        child.layers.enable(1);
        clickableMeshes.push(child);
        allClickables.push(child);
      }
    });
    const leaderLine = createEngineeringLeaderLine(
      basePosition,
      materials.leaderLine(),
      trackGeo,
    );
    root.add(group, leaderLine);
    parts.push({
      meta: partMeta,
      group,
      basePosition,
      explodeOffset,
      anchorLocal,
      focusOffset,
      clickableMeshes,
      highlightMaterials,
      leaderLine,
      leaderOrigin: basePosition.clone(),
    });
  };

  /* ── 01: Heißluft-Ringheizkörper ── */
  const ringHeaterGroup = new THREE.Group();
  const ringMat = materials.warmAmberPart();
  const ringOuter = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.35, 0.023, 12, 40)),
    ringMat,
  );
  const ringInner = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.27, 0.02, 12, 36)),
    ringMat,
  );
  const mountFlange = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.14, 0.22, 0.04, 0.02, 0.006)),
    materials.brightChrome(),
  );
  mountFlange.position.set(0, -0.33, -0.02);
  ringHeaterGroup.add(ringOuter, ringInner, mountFlange);
  registerPart(
    0,
    ringHeaterGroup,
    new THREE.Vector3(0, -0.14, -0.3),
    new THREE.Vector3(-0.98, 0.02, 0.16),
    new THREE.Vector3(0, 0.36, 0),
    new THREE.Vector3(-1.55, 0.24, 2.0),
    [ringMat],
  );

  /* ── 02: Oberhitze- & Grillheizkörper ── */
  const grillGroup = new THREE.Group();
  const grillMat = materials.warmAmberPart();
  const grillCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.32, 0, -0.38),
    new THREE.Vector3(-0.34, 0, 0.34),
    new THREE.Vector3(-0.14, 0, 0.36),
    new THREE.Vector3(-0.12, 0, -0.26),
    new THREE.Vector3(0.12, 0, -0.26),
    new THREE.Vector3(0.14, 0, 0.36),
    new THREE.Vector3(0.34, 0, 0.34),
    new THREE.Vector3(0.32, 0, -0.38),
  ]);
  const grillTube = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(grillCurve, 56, 0.022, 8, false)),
    grillMat,
  );
  const grillBar = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.76, 0.028, 0.05, 0.01, 0.004)),
    materials.brightChrome(),
  );
  grillBar.position.set(0, 0.02, 0.08);
  grillGroup.add(grillTube, grillBar);
  registerPart(
    1,
    grillGroup,
    new THREE.Vector3(0, 0.34, 0.0),
    new THREE.Vector3(-0.86, 0.32, 0.56),
    new THREE.Vector3(0, 0.1, 0),
    new THREE.Vector3(-1.4, 0.72, 2.05),
    [grillMat],
  );

  /* ── 03: Unterhitze-Heizelement ── */
  const bottomHeatGroup = new THREE.Group();
  const bottomHeatMat = materials.copperCoil();
  const botCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.28, 0, -0.36),
    new THREE.Vector3(-0.32, 0, 0.3),
    new THREE.Vector3(0, 0, 0.36),
    new THREE.Vector3(0.32, 0, 0.3),
    new THREE.Vector3(0.28, 0, -0.36),
  ]);
  const botTube = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(botCurve, 44, 0.022, 8, false)),
    bottomHeatMat,
  );
  const botTray = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.76, 0.025, 0.72, 0.02, 0.005)),
    materials.satinSteel(),
  );
  botTray.position.y = -0.025;
  bottomHeatGroup.add(botTube, botTray);
  registerPart(
    2,
    bottomHeatGroup,
    new THREE.Vector3(0, -0.72, 0),
    new THREE.Vector3(0.18, -0.52, 0.44),
    new THREE.Vector3(0, 0.08, 0.12),
    new THREE.Vector3(1.25, -0.68, 2.1),
    [bottomHeatMat],
  );

  /* ── 04: Umluft-Ventilator & Lüftermotor ── */
  const fanGroup = new THREE.Group();
  const fanSteel = materials.brushedDrum();
  const fanMotorMat = materials.ceruleanPart();
  const fanRotor = new THREE.Group();
  const fanHub = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.08, 0.08, 0.055, 20)),
    materials.brightChrome(),
  );
  fanHub.rotation.x = Math.PI / 2;
  fanRotor.add(fanHub);
  const bladeGeo = trackGeo(createChamferedBoxGeo(0.18, 0.064, 0.016, 0.014, 0.004));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const blade = new THREE.Mesh(bladeGeo, fanSteel);
    blade.position.set(Math.cos(a) * 0.135, Math.sin(a) * 0.135, 0.01);
    blade.rotation.z = a;
    blade.rotation.x = 0.35;
    fanRotor.add(blade);
  }
  const motorUnit = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.105, 0.105, 0.19, 20)),
    fanMotorMat,
  );
  motorUnit.rotation.x = Math.PI / 2;
  motorUnit.position.z = -0.15;
  fanGroup.add(fanRotor, motorUnit);
  registerPart(
    3,
    fanGroup,
    new THREE.Vector3(0, -0.14, -0.44),
    new THREE.Vector3(0.96, -0.06, -0.32),
    new THREE.Vector3(0, 0.26, 0),
    new THREE.Vector3(1.55, 0.3, 1.95),
    [fanSteel, fanMotorMat],
  );

  /* ── 05: Backofenthermostat & NTC-Fühler ── */
  const thermoGroup = new THREE.Group();
  const thermoMat = materials.ceruleanPart();
  const probeMat = materials.copperCoil();
  const thermoBlock = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.22, 0.16, 0.22, 0.025, 0.007)),
    thermoMat,
  );
  const spindle = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.024, 0.024, 0.16, 14)),
    materials.brightChrome(),
  );
  spindle.rotation.x = Math.PI / 2;
  spindle.position.z = 0.17;
  const capCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, -0.11),
    new THREE.Vector3(-0.16, -0.12, -0.24),
    new THREE.Vector3(-0.1, -0.25, -0.32),
  ]);
  const capillary = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(capCurve, 22, 0.013, 7, false)),
    probeMat,
  );
  thermoGroup.add(thermoBlock, spindle, capillary);
  registerPart(
    4,
    thermoGroup,
    new THREE.Vector3(0.42, 0.66, 0.28),
    new THREE.Vector3(0.96, 0.34, 0.44),
    new THREE.Vector3(0, 0.16, 0.05),
    new THREE.Vector3(1.55, 0.9, 1.9),
    [thermoMat, probeMat],
    0.24,
  );

  /* ── 06: Wahlschalter & Energieregler ── */
  const switchGroup = new THREE.Group();
  const switchBodyMat = materials.mattePolymer();
  const switchContactMat = materials.brassFitting();
  const switchCam = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.26, 0.16, 0.24, 0.025, 0.007)),
    switchBodyMat,
  );
  [-0.08, 0.08].forEach((sx) => {
    const shaft = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.024, 0.024, 0.15, 14)),
      materials.brightChrome(),
    );
    shaft.rotation.x = Math.PI / 2;
    shaft.position.set(sx, 0, 0.17);
    const contact = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.04, 0.12, 0.025)),
      switchContactMat,
    );
    contact.position.set(sx, 0, -0.13);
    switchGroup.add(shaft, contact);
  });
  switchGroup.add(switchCam);
  registerPart(
    5,
    switchGroup,
    new THREE.Vector3(-0.42, 0.66, 0.28),
    new THREE.Vector3(-0.96, 0.44, 0.36),
    new THREE.Vector3(0, 0.16, 0.05),
    new THREE.Vector3(-1.55, 0.9, 1.9),
    [switchBodyMat, switchContactMat],
    0.24,
  );

  /* ── 07: Backofentür-Dichtung & Türscharniere ── */
  const doorGroup = new THREE.Group();
  const doorSealMat = materials.graphiteGasket();
  const doorGlassMat = materials.obsidianGlass();
  const doorFrameMat = materials.satinSteel();
  const doorOuter = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(1.42, 1.08, 0.08, 0.06, 0.014)),
    doorFrameMat,
  );
  const doorWindow = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(1.06, 0.72, 0.09, 0.04, 0.008)),
    doorGlassMat,
  );
  const doorHandle = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.96, 0.055, 0.11, 0.025, 0.008)),
    materials.brightChrome(),
  );
  doorHandle.position.set(0, 0.42, 0.09);
  const perimeterSeal = new THREE.Mesh(
    trackGeo(createHollowFrameGeo(1.24, 0.92, 0.055, 0.045, 0.04)),
    doorSealMat,
  );
  perimeterSeal.position.set(0, 0, -0.09);
  const hingeGeo = trackGeo(createChamferedBoxGeo(0.05, 0.24, 0.22, 0.015, 0.005));
  const hingeL = new THREE.Mesh(hingeGeo, materials.brightChrome());
  hingeL.position.set(-0.56, -0.44, -0.12);
  const hingeR = new THREE.Mesh(hingeGeo, materials.brightChrome());
  hingeR.position.set(0.56, -0.44, -0.12);
  doorGroup.add(doorOuter, doorWindow, doorHandle, perimeterSeal, hingeL, hingeR);
  registerPart(
    6,
    doorGroup,
    new THREE.Vector3(0, -0.14, 0.62),
    new THREE.Vector3(0, -0.1, 0.96),
    new THREE.Vector3(0.45, 0.36, 0.1),
    new THREE.Vector3(1.35, 0.22, 2.45),
    [doorSealMat, doorFrameMat],
  );

  /* ── 08: Kochfeld-Heizkreis & Backofenlampe ── */
  const cooktopGroup = new THREE.Group();
  const indCopperMat = materials.copperCoil();
  const indBaseMat = materials.graphiteGasket();
  const lampBulbMat = materials.warmAmberPart();
  const buildBurnerSpiral = (x: number, z: number, scale: number) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const pad = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.27 * scale, 0.28 * scale, 0.024, 24)),
      indBaseMat,
    );
    g.add(pad);
    [0.11, 0.175, 0.235].forEach((r) => {
      const coil = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(r * scale, 0.014, 8, 30)),
        indCopperMat,
      );
      coil.rotation.x = Math.PI / 2;
      coil.position.y = 0.018;
      g.add(coil);
    });
    return g;
  };
  // Oven 300°C halogen glass lamp module attached cleanly on the right edge
  const lampDome = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.075, 16, 12)),
    lampBulbMat,
  );
  lampDome.position.set(0.62, -0.14, -0.28);
  cooktopGroup.add(
    buildBurnerSpiral(-0.34, -0.2, 1.0),
    buildBurnerSpiral(0.34, 0.2, 1.0),
    buildBurnerSpiral(0.34, -0.22, 0.78),
    buildBurnerSpiral(-0.34, 0.22, 0.78),
    lampDome,
  );
  registerPart(
    7,
    cooktopGroup,
    new THREE.Vector3(0, 0.85, 0),
    new THREE.Vector3(0, 0.72, 0.06),
    new THREE.Vector3(0, 0.14, 0),
    new THREE.Vector3(1.35, 1.45, 2.0),
    [indCopperMat, lampBulbMat],
  );

  return {
    id: "backofen",
    root,
    chassisMaterials,
    chassisBaseOpacities,
    edgeMaterials,
    parts,
    allClickables,
    animate: (_elapsed, delta) => {
      fanRotor.rotation.z -= delta * 2.0;
    },
  };
}
