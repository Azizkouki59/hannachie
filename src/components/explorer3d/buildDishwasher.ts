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
 * High-precision cutaway: Geschirrspüler
 * 8 real failure-prone spare parts: Heizpumpe, Ablaufpumpe, Aquastop, Sprüharme,
 * Wassertasche, Feinsieb, Dosierkombination, Geschirrkorb & Türdichtung.
 */
export function buildDishwasherAssembly(
  ctx: StudioBuilderContext,
): BuiltApplianceAssembly {
  const meta = getApplianceMeta("geschirrspueler");
  const { trackGeo, trackMat, materials, isSoftwareGl } = ctx;
  const root = new THREE.Group();

  const chassisMaterials: THREE.MeshPhysicalMaterial[] = [];
  const chassisBaseOpacities: number[] = [];
  const edgeMaterials: THREE.LineBasicMaterial[] = [];

  const steelShellMat = materials.satinSteel();
  const darkPlinthMat = materials.darkChassis();
  const edgeMat = materials.edgeLine();
  chassisMaterials.push(steelShellMat, darkPlinthMat);
  chassisBaseOpacities.push(1, 1);
  edgeMaterials.push(edgeMat);

  // Outer brushed-steel housing
  const cabinet = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(1.48, 1.9, 1.18, 0.08, 0.025)),
    steelShellMat,
  );
  cabinet.castShadow = !isSoftwareGl;
  cabinet.receiveShadow = !isSoftwareGl;
  addArchitecturalEdges(cabinet, edgeMat, trackGeo, 35);
  root.add(cabinet);

  // Recessed kickplate & integrated door handle / status strip
  const kickplate = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(1.42, 0.18, 1.06, 0.03, 0.01)),
    darkPlinthMat,
  );
  kickplate.position.set(0, -0.94, -0.04);
  root.add(kickplate);

  const handle = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.76, 0.065, 0.08, 0.025, 0.008)),
    materials.brightChrome(),
  );
  handle.position.set(0, 0.72, 0.63);
  root.add(handle);

  const statusStrip = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.46, 0.055, 0.03, 0.015, 0.005)),
    materials.obsidianGlass(),
  );
  statusStrip.position.set(0, 0.84, 0.6);
  root.add(statusStrip);

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

  /* ── 01: Umwälz- & Heizpumpe ── */
  const heatPumpGroup = new THREE.Group();
  const motorMat = materials.ceruleanPart();
  const heaterRingMat = materials.warmAmberPart();
  const motorBody = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.16, 0.16, 0.32, 24)),
    motorMat,
  );
  motorBody.rotation.z = Math.PI / 2;
  const heaterSleeve = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.185, 0.185, 0.15, 24)),
    heaterRingMat,
  );
  heaterSleeve.rotation.z = Math.PI / 2;
  heaterSleeve.position.x = 0.21;
  const intakePort = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.055, 0.055, 0.15, 14)),
    materials.graphiteGasket(),
  );
  intakePort.position.set(0.22, 0.16, 0);
  heatPumpGroup.add(motorBody, heaterSleeve, intakePort);
  registerPart(
    0,
    heatPumpGroup,
    new THREE.Vector3(0.24, -0.7, -0.06),
    new THREE.Vector3(0.92, -0.28, 0.42),
    new THREE.Vector3(0.1, 0.22, 0),
    new THREE.Vector3(1.55, -0.35, 2.0),
    [motorMat, heaterRingMat],
    0.26,
  );

  /* ── 02: Ablaufpumpe (Laugenpumpe) ── */
  const drainGroup = new THREE.Group();
  const drainHousingMat = materials.graphiteGasket();
  const drainCoilMat = materials.copperCoil();
  const drainCyl = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.115, 0.115, 0.14, 20)),
    drainHousingMat,
  );
  drainCyl.rotation.x = Math.PI / 2;
  const drainMotor = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.16, 0.16, 0.14, 0.025, 0.008)),
    drainCoilMat,
  );
  drainMotor.position.set(0, 0, -0.12);
  const drainNozzle = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.036, 0.036, 0.16, 12)),
    drainHousingMat,
  );
  drainNozzle.rotation.z = Math.PI / 2;
  drainNozzle.position.set(-0.13, 0.04, 0.02);
  drainGroup.add(drainCyl, drainMotor, drainNozzle);
  registerPart(
    1,
    drainGroup,
    new THREE.Vector3(-0.28, -0.72, 0.24),
    new THREE.Vector3(-0.88, -0.34, 0.62),
    new THREE.Vector3(0, 0.16, 0.04),
    new THREE.Vector3(-1.45, -0.4, 2.0),
    [drainHousingMat, drainCoilMat],
    0.22,
  );

  /* ── 03: Aquastop-Zulaufschlauch ── */
  const aquastopGroup = new THREE.Group();
  const hoseMat = materials.graphiteGasket();
  const valveMat = materials.ceruleanPart();
  const brassMat = materials.brassFitting();
  const hoseCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.24, 0),
    new THREE.Vector3(-0.16, 0.04, -0.16),
    new THREE.Vector3(-0.26, -0.22, -0.04),
    new THREE.Vector3(-0.1, -0.42, 0.14),
  ]);
  const hoseMesh = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(hoseCurve, 30, 0.03, 9, false)),
    hoseMat,
  );
  const valveBox = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.19, 0.26, 0.13, 0.03, 0.009)),
    valveMat,
  );
  valveBox.position.set(0, 0.34, 0);
  const brassNut = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.052, 0.052, 0.06, 6)),
    brassMat,
  );
  brassNut.position.set(0, 0.5, 0);
  aquastopGroup.add(hoseMesh, valveBox, brassNut);
  registerPart(
    2,
    aquastopGroup,
    new THREE.Vector3(-0.46, -0.24, -0.5),
    new THREE.Vector3(-0.78, 0.12, -0.68),
    new THREE.Vector3(0, 0.42, 0),
    new THREE.Vector3(-1.55, 0.25, -1.85),
    [valveMat, hoseMat, brassMat],
  );

  /* ── 04: Sprüharme & Sprüharm-Lager ── */
  const sprayGroup = new THREE.Group();
  const sprayMat = materials.ceruleanPart();
  const sprayChrome = materials.brightChrome();
  const buildSprayRotor = (len: number, yPos: number) => {
    const rotor = new THREE.Group();
    rotor.position.y = yPos;
    const arm = new THREE.Mesh(
      trackGeo(createChamferedBoxGeo(len, 0.046, 0.088, 0.02, 0.007)),
      sprayMat,
    );
    const hub = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.064, 0.072, 0.075, 20)),
      sprayChrome,
    );
    const nozzleGeo = trackGeo(new THREE.CylinderGeometry(0.011, 0.015, 0.034, 8));
    [-0.36, -0.2, 0.2, 0.36].forEach((nx) => {
      const n = new THREE.Mesh(nozzleGeo, sprayChrome);
      n.position.set(nx * len, 0.03, 0);
      rotor.add(n);
    });
    rotor.add(arm, hub);
    return rotor;
  };
  const upperSpray = buildSprayRotor(0.86, 0.24);
  const lowerSpray = buildSprayRotor(1.0, -0.24);
  const riserTube = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.024, 0.024, 0.52, 12)),
    sprayMat,
  );
  riserTube.position.set(0, 0, -0.34);
  sprayGroup.add(upperSpray, lowerSpray, riserTube);
  registerPart(
    3,
    sprayGroup,
    new THREE.Vector3(0, 0.02, 0.04),
    new THREE.Vector3(0.92, 0.32, 0.36),
    new THREE.Vector3(0, 0.34, 0),
    new THREE.Vector3(1.65, 0.6, 2.2),
    [sprayMat],
  );

  /* ── 05: Wassertasche (Wärmetauscher an der linken Seitenwand) ── */
  const pocketGroup = new THREE.Group();
  const pocketShellMat = materials.mattePolymer();
  const channelMat = materials.ceruleanPart();
  const pocketPlate = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.06, 1.18, 0.86, 0.04, 0.01)),
    pocketShellMat,
  );
  // Stylized water labyrinth channels
  const labCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.035, -0.45, -0.24),
    new THREE.Vector3(0.035, 0.36, -0.24),
    new THREE.Vector3(0.035, 0.42, 0.0),
    new THREE.Vector3(0.035, -0.15, 0.06),
    new THREE.Vector3(0.035, 0.28, 0.24),
    new THREE.Vector3(0.035, -0.42, 0.26),
  ]);
  const labTube = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(labCurve, 44, 0.022, 8, false)),
    channelMat,
  );
  pocketGroup.add(pocketPlate, labTube);
  registerPart(
    4,
    pocketGroup,
    new THREE.Vector3(-0.68, 0.06, -0.02),
    new THREE.Vector3(-0.98, 0.16, 0.06),
    new THREE.Vector3(-0.08, 0.46, 0),
    new THREE.Vector3(-1.95, 0.32, 1.7),
    [pocketShellMat, channelMat],
  );

  /* ── 06: Edelstahl-Feinsieb & Pumpensumpf ── */
  const filterGroup = new THREE.Group();
  const filterSteel = materials.brushedDrum();
  const filterRimMat = materials.graphiteGasket();
  const flatSieve = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.3, 0.28, 0.026, 28)),
    filterSteel,
  );
  const microCylinder = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.11, 0.095, 0.26, 24)),
    filterSteel,
  );
  microCylinder.position.y = -0.11;
  const topTwistGrip = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.15, 0.038, 0.048, 0.014, 0.005)),
    filterRimMat,
  );
  topTwistGrip.position.y = 0.03;
  filterGroup.add(flatSieve, microCylinder, topTwistGrip);
  registerPart(
    5,
    filterGroup,
    new THREE.Vector3(0, -0.46, 0.06),
    new THREE.Vector3(0, -0.16, 0.72),
    new THREE.Vector3(0, 0.14, 0),
    new THREE.Vector3(-1.25, 0.15, 2.05),
    [filterSteel, filterRimMat],
    0.26,
  );

  /* ── 07: Dosierkombination (Tab- & Klarspülerfach innen in der Tür) ── */
  const dispGroup = new THREE.Group();
  const dispBodyMat = materials.mattePolymer();
  const dispLidMat = materials.ceruleanPart();
  const dispBase = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.38, 0.22, 0.075, 0.025, 0.007)),
    dispBodyMat,
  );
  const tabLid = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.15, 0.14, 0.025, 0.015, 0.004)),
    dispLidMat,
  );
  tabLid.position.set(-0.08, 0, 0.045);
  const rinseCap = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.055, 0.055, 0.03, 18)),
    dispLidMat,
  );
  rinseCap.rotation.x = Math.PI / 2;
  rinseCap.position.set(0.1, 0, 0.042);
  dispGroup.add(dispBase, tabLid, rinseCap);
  registerPart(
    6,
    dispGroup,
    new THREE.Vector3(0, 0.34, 0.56),
    new THREE.Vector3(0.76, 0.42, 0.76),
    new THREE.Vector3(0, 0.16, 0.04),
    new THREE.Vector3(1.35, 0.65, 2.0),
    [dispBodyMat, dispLidMat],
    0.24,
  );

  /* ── 08: Geschirrkorb, Laufrollen & Türdichtung ── */
  const basketGroup = new THREE.Group();
  const wireMat = materials.brightChrome();
  const wheelMat = materials.ceruleanPart();
  const plateMat = materials.ceramicShell();
  const sealMat = materials.graphiteGasket();

  const basketFrame = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.98, 0.038, 0.68, 0.02, 0.006)),
    wireMat,
  );
  basketFrame.position.y = -0.14;
  basketGroup.add(basketFrame);

  const railGeo = trackGeo(new THREE.CylinderGeometry(0.01, 0.01, 0.22, 7));
  [-0.46, 0.46].forEach((rx) => {
    [-0.3, 0, 0.3].forEach((rz) => {
      const post = new THREE.Mesh(railGeo, wireMat);
      post.position.set(rx, -0.02, rz);
      basketGroup.add(post);
    });
  });

  const plateGeo = trackGeo(new THREE.CylinderGeometry(0.17, 0.17, 0.026, 20));
  for (let i = 0; i < 4; i++) {
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.rotation.z = Math.PI / 2;
    plate.position.set(-0.26 + i * 0.17, 0.03, 0);
    basketGroup.add(plate);
  }

  const rollerGeo = trackGeo(new THREE.CylinderGeometry(0.046, 0.046, 0.03, 14));
  [
    [-0.51, -0.14, -0.2],
    [-0.51, -0.14, 0.2],
    [0.51, -0.14, -0.2],
    [0.51, -0.14, 0.2],
  ].forEach(([wx, wy, wz]) => {
    const w = new THREE.Mesh(rollerGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(wx, wy, wz);
    basketGroup.add(w);
  });

  // Door perimeter seal strip attached to basket/door front reference
  const doorGasket = new THREE.Mesh(
    trackGeo(createHollowFrameGeo(1.06, 0.36, 0.035, 0.03, 0.03)),
    sealMat,
  );
  doorGasket.position.set(0, -0.02, 0.38);
  basketGroup.add(doorGasket);

  registerPart(
    7,
    basketGroup,
    new THREE.Vector3(0, 0.22, 0.06),
    new THREE.Vector3(0, 0.24, 1.06),
    new THREE.Vector3(0, 0.22, 0.24),
    new THREE.Vector3(1.2, 0.72, 2.35),
    [wheelMat, sealMat],
  );

  return {
    id: "geschirrspueler",
    root,
    chassisMaterials,
    chassisBaseOpacities,
    edgeMaterials,
    parts,
    allClickables,
    animate: (_elapsed, delta) => {
      upperSpray.rotation.y += delta * 1.1;
      lowerSpray.rotation.y -= delta * 1.3;
    },
  };
}
