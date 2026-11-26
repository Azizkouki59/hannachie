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
 * Braun / Apple technical cutaway: Backofen & Herd
 * 5 selectable spare parts: Ringheizkörper, Umluft-Lüfter, Kochfeld-Kreis, Türdichtung/Tür, Thermostat.
 */
export function buildOvenAssembly(
  ctx: StudioBuilderContext,
): BuiltApplianceAssembly {
  const meta = getApplianceMeta("backofen");
  const { trackGeo, materials, isSoftwareGl } = ctx;
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

  // Integrated obsidian Ceran / Induction glass cooktop plate
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

  const knobGeo = trackGeo(new THREE.CylinderGeometry(0.055, 0.062, 0.07, 20));
  [-0.5, -0.32, 0.32, 0.5].forEach((kx) => {
    const knob = new THREE.Mesh(knobGeo, materials.brightChrome());
    knob.rotation.x = Math.PI / 2;
    knob.position.set(kx, 0.68, 0.64);
    root.add(knob);
  });

  const parts: BuiltSparePart[] = [];
  const registerPart = (
    partIndex: number,
    group: THREE.Group,
    basePosition: THREE.Vector3,
    explodeOffset: THREE.Vector3,
    anchorLocal: THREE.Vector3,
    focusOffset: THREE.Vector3,
    highlightMaterials: THREE.MeshStandardMaterial[],
  ) => {
    const partMeta = meta.parts[partIndex];
    group.position.copy(basePosition);
    const clickableMeshes: THREE.Object3D[] = [];
    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.userData.partId = partMeta.id;
        child.layers.enable(1);
        clickableMeshes.push(child);
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

  /* ── PART 01: Heißluft-Ringheizkörper ── */
  const ringHeaterGroup = new THREE.Group();
  const coilMat = materials.copperCoil();
  const ringOuter = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.36, 0.024, 14, 48)),
    coilMat,
  );
  const ringInner = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.28, 0.022, 14, 44)),
    coilMat,
  );
  const mountFlange = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.14, 0.24, 0.04, 0.02, 0.006)),
    materials.brightChrome(),
  );
  mountFlange.position.set(0, -0.34, -0.02);
  ringHeaterGroup.add(ringOuter, ringInner, mountFlange);
  registerPart(
    0,
    ringHeaterGroup,
    new THREE.Vector3(0, -0.14, -0.3),
    new THREE.Vector3(-0.98, 0.08, 0.24),
    new THREE.Vector3(0, 0.38, 0),
    new THREE.Vector3(-1.55, 0.3, 2.05),
    [coilMat],
  );

  /* ── PART 02: Umluft-Ventilator & Motor ── */
  const fanGroup = new THREE.Group();
  const fanSteel = materials.brushedDrum();
  const fanMotorMat = materials.ceruleanPart();

  const fanRotor = new THREE.Group();
  const fanHub = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.085, 0.085, 0.06, 22)),
    materials.brightChrome(),
  );
  fanHub.rotation.x = Math.PI / 2;
  fanRotor.add(fanHub);

  const bladeGeo = trackGeo(createChamferedBoxGeo(0.19, 0.068, 0.018, 0.015, 0.004));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const blade = new THREE.Mesh(bladeGeo, fanSteel);
    blade.position.set(Math.cos(a) * 0.14, Math.sin(a) * 0.14, 0.01);
    blade.rotation.z = a;
    blade.rotation.x = 0.35;
    fanRotor.add(blade);
  }
  const motorUnit = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.11, 0.11, 0.2, 22)),
    fanMotorMat,
  );
  motorUnit.rotation.x = Math.PI / 2;
  motorUnit.position.z = -0.16;
  fanGroup.add(fanRotor, motorUnit);
  registerPart(
    1,
    fanGroup,
    new THREE.Vector3(0, -0.14, -0.44),
    new THREE.Vector3(0.95, 0.05, -0.22),
    new THREE.Vector3(0, 0.28, 0),
    new THREE.Vector3(1.55, 0.35, 1.95),
    [fanSteel, fanMotorMat],
  );

  /* ── PART 03: Induktions- / Kochfeld-Heizkreis ── */
  const inductionGroup = new THREE.Group();
  const indCopperMat = materials.copperCoil();
  const indBaseMat = materials.graphiteGasket();

  const buildBurnerSpiral = (x: number, z: number, scale: number) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const pad = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.28 * scale, 0.29 * scale, 0.025, 28)),
      indBaseMat,
    );
    g.add(pad);
    [0.11, 0.175, 0.24].forEach((r) => {
      const coil = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(r * scale, 0.015, 10, 36)),
        indCopperMat,
      );
      coil.rotation.x = Math.PI / 2;
      coil.position.y = 0.02;
      g.add(coil);
    });
    return g;
  };
  inductionGroup.add(
    buildBurnerSpiral(-0.34, -0.2, 1.0),
    buildBurnerSpiral(0.34, 0.2, 1.0),
    buildBurnerSpiral(0.34, -0.22, 0.78),
    buildBurnerSpiral(-0.34, 0.22, 0.78),
  );
  registerPart(
    2,
    inductionGroup,
    new THREE.Vector3(0, 0.85, 0),
    new THREE.Vector3(0, 0.72, 0.1),
    new THREE.Vector3(0, 0.14, 0),
    new THREE.Vector3(1.35, 1.45, 2.0),
    [indCopperMat],
  );

  /* ── PART 04: Backofentür-Dichtung & Scharniere ── */
  const doorGroup = new THREE.Group();
  const doorSealMat = materials.graphiteGasket();
  const doorGlassMat = materials.obsidianGlass();
  const doorFrameMat = materials.satinSteel();

  const doorOuter = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(1.42, 1.08, 0.08, 0.06, 0.015)),
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

  // Two precision side hinges
  const hingeGeo = trackGeo(createChamferedBoxGeo(0.05, 0.24, 0.22, 0.015, 0.005));
  const hingeL = new THREE.Mesh(hingeGeo, materials.brightChrome());
  hingeL.position.set(-0.56, -0.44, -0.12);
  const hingeR = new THREE.Mesh(hingeGeo, materials.brightChrome());
  hingeR.position.set(0.56, -0.44, -0.12);

  doorGroup.add(doorOuter, doorWindow, doorHandle, perimeterSeal, hingeL, hingeR);
  registerPart(
    3,
    doorGroup,
    new THREE.Vector3(0, -0.14, 0.62),
    new THREE.Vector3(0, -0.1, 0.92),
    new THREE.Vector3(0.45, 0.36, 0.1),
    new THREE.Vector3(1.35, 0.25, 2.45),
    [doorSealMat, doorFrameMat],
  );

  /* ── PART 05: Thermostat & Wahlschalter ── */
  const thermoGroup = new THREE.Group();
  const thermoMat = materials.ceruleanPart();
  const probeMat = materials.copperCoil();

  const switchBlock = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.24, 0.18, 0.24, 0.03, 0.008)),
    thermoMat,
  );
  const spindle = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.026, 0.026, 0.18, 16)),
    materials.brightChrome(),
  );
  spindle.rotation.x = Math.PI / 2;
  spindle.position.z = 0.19;

  const capCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, -0.12),
    new THREE.Vector3(-0.18, -0.12, -0.26),
    new THREE.Vector3(-0.12, -0.26, -0.34),
  ]);
  const capillary = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(capCurve, 26, 0.014, 8, false)),
    probeMat,
  );
  thermoGroup.add(switchBlock, spindle, capillary);
  registerPart(
    4,
    thermoGroup,
    new THREE.Vector3(0.38, 0.68, 0.28),
    new THREE.Vector3(0.95, 0.42, 0.48),
    new THREE.Vector3(0, 0.18, 0.06),
    new THREE.Vector3(1.6, 0.95, 1.95),
    [thermoMat, probeMat],
  );

  return {
    id: "backofen",
    root,
    chassisMaterials,
    chassisBaseOpacities,
    edgeMaterials,
    parts,
    animate: (_elapsed, delta) => {
      fanRotor.rotation.z -= delta * 2.1;
    },
  };
}
