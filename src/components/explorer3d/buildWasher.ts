import * as THREE from "three";
import {
  addArchitecturalEdges,
  createChamferedBoxGeo,
  createEngineeringLeaderLine,
} from "./studioCore";
import {
  getApplianceMeta,
  type BuiltApplianceAssembly,
  type BuiltSparePart,
  type StudioBuilderContext,
} from "./types";

/**
 * High-precision cutaway: Frontlader Waschmaschine
 * 8 real failure-prone spare parts with accurate German terminology & crisp exploded separation.
 */
export function buildWasherAssembly(
  ctx: StudioBuilderContext,
): BuiltApplianceAssembly {
  const meta = getApplianceMeta("waschmaschine");
  const { trackGeo, trackMat, materials, isSoftwareGl } = ctx;
  const root = new THREE.Group();

  const chassisMaterials: THREE.MeshPhysicalMaterial[] = [];
  const chassisBaseOpacities: number[] = [];
  const edgeMaterials: THREE.LineBasicMaterial[] = [];

  const shellMat = materials.ceramicShell();
  const fasciaMat = materials.satinSteel();
  const plinthMat = materials.darkChassis();
  const edgeMat = materials.edgeLine();
  chassisMaterials.push(shellMat, fasciaMat, plinthMat);
  chassisBaseOpacities.push(1, 1, 1);
  edgeMaterials.push(edgeMat);

  // Outer chamfered cabinet
  const cabinet = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(1.48, 1.92, 1.18, 0.1, 0.028)),
    shellMat,
  );
  cabinet.castShadow = !isSoftwareGl;
  cabinet.receiveShadow = !isSoftwareGl;
  addArchitecturalEdges(cabinet, edgeMat, trackGeo, 35);
  root.add(cabinet);

  // Base plinth
  const plinth = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(1.42, 0.14, 1.1, 0.04, 0.012)),
    plinthMat,
  );
  plinth.position.set(0, -0.96, -0.02);
  root.add(plinth);

  // Top satin-steel control fascia + detergent drawer + machined dial + obsidian display
  const fascia = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(1.42, 0.32, 0.06, 0.05, 0.012)),
    fasciaMat,
  );
  fascia.position.set(0, 0.74, 0.59);
  addArchitecturalEdges(fascia, edgeMat, trackGeo, 40);
  root.add(fascia);

  const drawer = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.42, 0.2, 0.05, 0.03, 0.01)),
    shellMat,
  );
  drawer.position.set(-0.42, 0.74, 0.62);
  root.add(drawer);

  const dialRing = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.095, 0.105, 0.06, 24)),
    materials.brightChrome(),
  );
  dialRing.rotation.x = Math.PI / 2;
  dialRing.position.set(0.02, 0.74, 0.63);
  root.add(dialRing);

  const ledScreen = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.38, 0.13, 0.03, 0.02, 0.006)),
    materials.obsidianGlass(),
  );
  ledScreen.position.set(0.42, 0.74, 0.62);
  root.add(ledScreen);

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

  /* ── 01: Laugenpumpe & Flusensieb ── */
  const pumpGroup = new THREE.Group();
  const pumpStatorMat = materials.ceruleanPart();
  const pumpHousingMat = materials.graphiteGasket();
  const volute = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.155, 0.155, 0.16, 22)),
    pumpHousingMat,
  );
  volute.rotation.x = Math.PI / 2;
  const motorCore = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.22, 0.22, 0.2, 0.04, 0.01)),
    pumpStatorMat,
  );
  motorCore.position.set(0, 0, -0.17);
  const outletPipe = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.042, 0.042, 0.22, 14)),
    pumpHousingMat,
  );
  outletPipe.rotation.z = Math.PI / 2;
  outletPipe.position.set(0.17, 0.06, 0);
  const impeller = new THREE.Group();
  impeller.position.set(0, 0, 0.09);
  const hub = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.038, 0.038, 0.04, 12)),
    materials.brightChrome(),
  );
  hub.rotation.x = Math.PI / 2;
  impeller.add(hub);
  const bladeGeo = trackGeo(new THREE.BoxGeometry(0.17, 0.024, 0.03));
  for (let i = 0; i < 2; i++) {
    const blade = new THREE.Mesh(bladeGeo, materials.brightChrome());
    blade.rotation.z = (i * Math.PI) / 2;
    impeller.add(blade);
  }
  pumpGroup.add(volute, motorCore, outletPipe, impeller);
  registerPart(
    0,
    pumpGroup,
    new THREE.Vector3(0.42, -0.68, 0.28),
    new THREE.Vector3(0.95, -0.22, 0.52),
    new THREE.Vector3(0, 0.2, 0.06),
    new THREE.Vector3(1.55, -0.32, 2.0),
    [pumpStatorMat, pumpHousingMat],
    0.26,
  );

  /* ── 02: Heizstab & NTC-Temperaturfühler ── */
  const heaterGroup = new THREE.Group();
  const heaterMat = materials.warmAmberPart();
  const ntcMat = materials.ceruleanPart();
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.1, 0, 0.18),
    new THREE.Vector3(-0.14, 0, -0.26),
    new THREE.Vector3(-0.04, 0, -0.34),
    new THREE.Vector3(0.0, 0, -0.14),
    new THREE.Vector3(0.04, 0, -0.34),
    new THREE.Vector3(0.14, 0, -0.26),
    new THREE.Vector3(0.1, 0, 0.18),
  ]);
  const heatingTube = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(curve, 44, 0.022, 9, false)),
    heaterMat,
  );
  const flange = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.28, 0.09, 0.045, 0.03, 0.008)),
    materials.brightChrome(),
  );
  flange.position.set(0, 0, 0.19);
  const ntcTip = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 12)),
    ntcMat,
  );
  ntcTip.rotation.x = Math.PI / 2;
  ntcTip.position.set(0, 0, 0.16);
  heaterGroup.add(heatingTube, flange, ntcTip);
  registerPart(
    1,
    heaterGroup,
    new THREE.Vector3(0, -0.58, 0.06),
    new THREE.Vector3(-0.98, -0.26, 0.42),
    new THREE.Vector3(0, 0.14, 0.06),
    new THREE.Vector3(-1.45, -0.22, 2.05),
    [heaterMat, ntcMat],
    0.26,
  );

  /* ── 03: Türmanschette (Bullaugendichtung) + Bullaugenring ── */
  const gasketGroup = new THREE.Group();
  const gasketMat = materials.graphiteGasket();
  const outerBoot = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.45, 0.066, 16, 40)),
    gasketMat,
  );
  const innerFold = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.39, 0.03, 12, 36)),
    gasketMat,
  );
  innerFold.position.z = 0.04;
  const clampWire = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.48, 0.012, 8, 40)),
    materials.brightChrome(),
  );
  clampWire.position.z = -0.02;
  const portholeRing = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.49, 0.046, 14, 42)),
    materials.brightChrome(),
  );
  portholeRing.position.z = 0.14;
  const portholeGlass = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.44, 0.36, 0.09, 32)),
    materials.frostedGlass(),
  );
  portholeGlass.rotation.x = Math.PI / 2;
  portholeGlass.position.z = 0.14;
  portholeGlass.renderOrder = 4;
  gasketGroup.add(outerBoot, innerFold, clampWire, portholeRing, portholeGlass);
  registerPart(
    2,
    gasketGroup,
    new THREE.Vector3(0, -0.06, 0.49),
    new THREE.Vector3(0, -0.02, 1.04),
    new THREE.Vector3(0.36, 0.25, 0.12),
    new THREE.Vector3(1.25, 0.3, 2.3),
    [gasketMat],
  );

  /* ── 04: Türverriegelung (Türschloss / PTC) ── */
  const lockGroup = new THREE.Group();
  const lockBodyMat = materials.ceruleanPart();
  const lockMetalMat = materials.brassFitting();
  const lockBox = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.14, 0.22, 0.1, 0.025, 0.006)),
    lockBodyMat,
  );
  const latchSlot = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.055, 0.085, 0.04, 0.01, 0.004)),
    materials.darkChassis(),
  );
  latchSlot.position.set(-0.02, 0, 0.045);
  const ptcPin = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.018, 0.018, 0.08, 12)),
    lockMetalMat,
  );
  ptcPin.position.set(0.04, -0.08, 0);
  lockGroup.add(lockBox, latchSlot, ptcPin);
  registerPart(
    3,
    lockGroup,
    new THREE.Vector3(0.55, -0.06, 0.46),
    new THREE.Vector3(0.96, 0.24, 0.56),
    new THREE.Vector3(0, 0.16, 0.05),
    new THREE.Vector3(1.45, 0.22, 1.85),
    [lockBodyMat, lockMetalMat],
    0.22,
  );

  /* ── 05: Motorkohlen & Antriebsriemen (Riemenscheibe + Motor) ── */
  const driveGroup = new THREE.Group();
  const pulleyMat = materials.satinSteel();
  const beltMat = materials.graphiteGasket();
  const brushMat = materials.copperCoil();

  const pulleySpin = new THREE.Group();
  const pulleyRim = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.34, 0.026, 12, 36)),
    pulleyMat,
  );
  const pulleyHub = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.06, 0.06, 0.065, 16)),
    materials.brightChrome(),
  );
  pulleyHub.rotation.x = Math.PI / 2;
  const spokeGeo = trackGeo(new THREE.BoxGeometry(0.64, 0.03, 0.024));
  for (let i = 0; i < 3; i++) {
    const spoke = new THREE.Mesh(spokeGeo, pulleyMat);
    spoke.rotation.z = (i * Math.PI) / 3;
    pulleySpin.add(spoke);
  }
  pulleySpin.add(pulleyRim, pulleyHub);

  // Lower motor cylinder + pair of brass carbon brush holders
  const motorUnit = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.13, 0.13, 0.26, 20)),
    materials.darkChassis(),
  );
  motorUnit.rotation.x = Math.PI / 2;
  motorUnit.position.set(0, -0.46, 0.02);

  const brushGeo = trackGeo(createChamferedBoxGeo(0.055, 0.085, 0.055, 0.01, 0.004));
  const brushL = new THREE.Mesh(brushGeo, brushMat);
  brushL.position.set(-0.15, -0.46, 0.05);
  brushL.rotation.z = 0.5;
  const brushR = new THREE.Mesh(brushGeo, brushMat);
  brushR.position.set(0.15, -0.46, 0.05);
  brushR.rotation.z = -0.5;

  const belt = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.37, 0.015, 8, 38)),
    beltMat,
  );
  driveGroup.add(pulleySpin, belt, motorUnit, brushL, brushR);
  registerPart(
    4,
    driveGroup,
    new THREE.Vector3(0, -0.08, -0.52),
    new THREE.Vector3(-0.52, -0.06, -0.82),
    new THREE.Vector3(-0.16, 0.34, 0),
    new THREE.Vector3(-1.45, 0.18, -2.05),
    [pulleyMat, beltMat, brushMat],
  );

  /* ── 06: Stoßdämpfer (Dämpfer-Satz links & rechts) ── */
  const damperGroup = new THREE.Group();
  const damperCylMat = materials.graphiteGasket();
  const damperRodMat = materials.brightChrome();
  const damperMountMat = materials.ceruleanPart();

  const buildDamper = (xSign: number) => {
    const d = new THREE.Group();
    d.position.set(xSign * 0.44, 0, 0);
    d.rotation.z = xSign * 0.24;
    const outerTube = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.042, 0.042, 0.28, 14)),
      damperCylMat,
    );
    outerTube.position.y = -0.07;
    const pistonRod = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.022, 0.022, 0.26, 12)),
      damperRodMat,
    );
    pistonRod.position.y = 0.12;
    const eyeTop = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(0.032, 0.012, 8, 16)),
      damperMountMat,
    );
    eyeTop.position.y = 0.26;
    const eyeBot = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(0.032, 0.012, 8, 16)),
      damperMountMat,
    );
    eyeBot.position.y = -0.22;
    d.add(outerTube, pistonRod, eyeTop, eyeBot);
    return d;
  };
  damperGroup.add(buildDamper(-1), buildDamper(1));
  registerPart(
    5,
    damperGroup,
    new THREE.Vector3(0, -0.68, -0.06),
    new THREE.Vector3(0, -0.58, 0.04),
    new THREE.Vector3(-0.46, 0.05, 0),
    new THREE.Vector3(-1.4, -0.78, 1.95),
    [damperCylMat, damperMountMat],
  );

  /* ── 07: Trommellager, Wellendichtring & Waschtrommel ── */
  const drumGroup = new THREE.Group();
  const drumMat = materials.brushedDrum();
  const lifterMat = materials.ceruleanPart();
  const bearingMat = materials.brassFitting();

  const drumShell = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.46, 0.46, 0.58, 36, 1, true)),
    drumMat,
  );
  drumShell.rotation.x = Math.PI / 2;
  drumShell.castShadow = !isSoftwareGl;

  const drumBack = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.45, 0.45, 0.04, 32)),
    drumMat,
  );
  drumBack.rotation.x = Math.PI / 2;
  drumBack.position.z = -0.28;

  const drumFrontLip = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.44, 0.03, 12, 36)),
    materials.brightChrome(),
  );
  drumFrontLip.position.z = 0.29;

  // Rear 3-arm spider (Lagerkreuz) & bronze ball bearing ring
  const bearingRing = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.11, 0.032, 12, 24)),
    bearingMat,
  );
  bearingRing.position.z = -0.34;
  const spiderArmGeo = trackGeo(createChamferedBoxGeo(0.065, 0.38, 0.032, 0.015, 0.005));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const arm = new THREE.Mesh(spiderArmGeo, materials.satinSteel());
    arm.position.set(Math.cos(a) * 0.19, Math.sin(a) * 0.19, -0.32);
    arm.rotation.z = a + Math.PI / 2;
    drumGroup.add(arm);
  }

  // 3 interior drum lifters (Trommelrippen)
  const lifterGeo = trackGeo(createChamferedBoxGeo(0.085, 0.068, 0.46, 0.02, 0.007));
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const lifter = new THREE.Mesh(lifterGeo, lifterMat);
    lifter.position.set(Math.cos(angle) * 0.4, Math.sin(angle) * 0.4, 0);
    lifter.rotation.z = angle + Math.PI / 2;
    drumGroup.add(lifter);
  }

  // Instanced drum perforations (1 draw call)
  const perfGeo = trackGeo(new THREE.CylinderGeometry(0.015, 0.015, 0.016, 7));
  const perfMat = materials.darkChassis();
  const perfRows = 4;
  const perfCols = 14;
  const perfMesh = new THREE.InstancedMesh(perfGeo, perfMat, perfRows * perfCols);
  const _dummy = new THREE.Object3D();
  let pIdx = 0;
  for (let r = 0; r < perfRows; r++) {
    const zPos = -0.19 + r * 0.125;
    for (let c = 0; c < perfCols; c++) {
      const a = (c / perfCols) * Math.PI * 2 + r * 0.2;
      _dummy.position.set(Math.cos(a) * 0.462, Math.sin(a) * 0.462, zPos);
      _dummy.rotation.set(0, 0, a + Math.PI / 2);
      _dummy.updateMatrix();
      perfMesh.setMatrixAt(pIdx++, _dummy.matrix);
    }
  }
  perfMesh.computeBoundingSphere();

  const drumSpinGroup = new THREE.Group();
  drumSpinGroup.add(drumShell, drumBack, drumFrontLip, bearingRing, perfMesh);
  drumGroup.add(drumSpinGroup);
  registerPart(
    6,
    drumGroup,
    new THREE.Vector3(0, -0.06, -0.02),
    new THREE.Vector3(0, 0.14, 0.34),
    new THREE.Vector3(0, 0.38, 0.12),
    new THREE.Vector3(1.5, 0.65, 2.35),
    [drumMat, lifterMat, bearingMat],
  );

  /* ── 08: Magnetventil & Aquastop-Zulauf ── */
  const valveGroup = new THREE.Group();
  const valveSolenoidMat = materials.ceruleanPart();
  const valveBodyMat = materials.mattePolymer();
  const valveThreadMat = materials.brassFitting();

  const valveManifold = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.26, 0.12, 0.14, 0.025, 0.006)),
    valveBodyMat,
  );
  const coilGeo = trackGeo(new THREE.CylinderGeometry(0.048, 0.048, 0.12, 16));
  [-0.065, 0.065].forEach((cx) => {
    const coil = new THREE.Mesh(coilGeo, valveSolenoidMat);
    coil.position.set(cx, 0.09, 0);
    valveGroup.add(coil);
  });
  const inletThread = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.042, 0.042, 0.09, 14)),
    valveThreadMat,
  );
  inletThread.rotation.x = Math.PI / 2;
  inletThread.position.set(0, 0, -0.1);
  valveGroup.add(valveManifold, inletThread);
  registerPart(
    7,
    valveGroup,
    new THREE.Vector3(-0.42, 0.66, -0.38),
    new THREE.Vector3(-0.92, 0.44, -0.38),
    new THREE.Vector3(0, 0.16, 0),
    new THREE.Vector3(-1.45, 0.85, -1.7),
    [valveSolenoidMat, valveThreadMat],
    0.24,
  );

  return {
    id: "waschmaschine",
    root,
    chassisMaterials,
    chassisBaseOpacities,
    edgeMaterials,
    parts,
    allClickables,
    animate: (_elapsed, delta) => {
      drumSpinGroup.rotation.z -= delta * 0.68;
      impeller.rotation.z += delta * 2.2;
      pulleySpin.rotation.z -= delta * 0.68;
    },
  };
}
