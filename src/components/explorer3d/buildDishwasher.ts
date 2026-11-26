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
 * Braun / Apple technical cutaway: Geschirrspüler
 * 5 selectable spare parts: Sprüharme, Geschirrkorb, Feinsieb, Heizpumpe, Aquastop.
 */
export function buildDishwasherAssembly(
  ctx: StudioBuilderContext,
): BuiltApplianceAssembly {
  const meta = getApplianceMeta("geschirrspueler");
  const { trackGeo, materials, isSoftwareGl } = ctx;
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

  // Outer chamfered brushed-steel housing
  const cabinet = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(1.48, 1.9, 1.18, 0.08, 0.025)),
    steelShellMat,
  );
  cabinet.castShadow = !isSoftwareGl;
  cabinet.receiveShadow = !isSoftwareGl;
  addArchitecturalEdges(cabinet, edgeMat, trackGeo, 35);
  root.add(cabinet);

  // Recessed kickplate & top integrated control fascia
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

  /* ── PART 01: Sprüharm-Einheit (Oben & Unten) ── */
  const sprayGroup = new THREE.Group();
  const sprayMat = materials.ceruleanPart();
  const sprayChrome = materials.brightChrome();

  const buildSprayRotor = (len: number, yPos: number) => {
    const rotor = new THREE.Group();
    rotor.position.y = yPos;
    const arm = new THREE.Mesh(
      trackGeo(createChamferedBoxGeo(len, 0.048, 0.09, 0.02, 0.008)),
      sprayMat,
    );
    const hub = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.068, 0.075, 0.08, 22)),
      sprayChrome,
    );
    const nozzleGeo = trackGeo(new THREE.CylinderGeometry(0.012, 0.016, 0.036, 10));
    [-0.36, -0.2, 0.2, 0.36].forEach((nx) => {
      const n = new THREE.Mesh(nozzleGeo, sprayChrome);
      n.position.set(nx * len, 0.032, 0);
      rotor.add(n);
    });
    rotor.add(arm, hub);
    return rotor;
  };
  const upperSpray = buildSprayRotor(0.88, 0.24);
  const lowerSpray = buildSprayRotor(1.02, -0.26);
  const riserTube = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.026, 0.026, 0.56, 14)),
    sprayMat,
  );
  riserTube.position.set(0, -0.01, -0.34);
  sprayGroup.add(upperSpray, lowerSpray, riserTube);
  registerPart(
    0,
    sprayGroup,
    new THREE.Vector3(0, 0.02, 0.04),
    new THREE.Vector3(0.88, 0.34, 0.45),
    new THREE.Vector3(0, 0.34, 0),
    new THREE.Vector3(1.65, 0.65, 2.25),
    [sprayMat],
  );

  /* ── PART 02: Geschirrkorb & Laufrollen ── */
  const basketGroup = new THREE.Group();
  const wireMat = materials.brightChrome();
  const wheelMat = materials.ceruleanPart();
  const plateMat = materials.ceramicShell();

  const basketFrame = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(1.02, 0.04, 0.72, 0.02, 0.006)),
    wireMat,
  );
  basketFrame.position.y = -0.14;
  basketGroup.add(basketFrame);

  // Clean vertical wire rails
  const railGeo = trackGeo(new THREE.CylinderGeometry(0.01, 0.01, 0.24, 8));
  [-0.48, 0.48].forEach((rx) => {
    [-0.32, 0, 0.32].forEach((rz) => {
      const post = new THREE.Mesh(railGeo, wireMat);
      post.position.set(rx, -0.02, rz);
      basketGroup.add(post);
    });
  });

  // 4 tactile ceramic plates stacked cleanly in rack
  const plateGeo = trackGeo(new THREE.CylinderGeometry(0.18, 0.18, 0.028, 24));
  for (let i = 0; i < 4; i++) {
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.rotation.z = Math.PI / 2;
    plate.position.set(-0.27 + i * 0.18, 0.04, 0);
    basketGroup.add(plate);
  }

  // 4 signature cerulean basket guide rollers
  const rollerGeo = trackGeo(new THREE.CylinderGeometry(0.048, 0.048, 0.032, 16));
  [
    [-0.53, -0.14, -0.22],
    [-0.53, -0.14, 0.22],
    [0.53, -0.14, -0.22],
    [0.53, -0.14, 0.22],
  ].forEach(([wx, wy, wz]) => {
    const w = new THREE.Mesh(rollerGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(wx, wy, wz);
    basketGroup.add(w);
  });

  registerPart(
    1,
    basketGroup,
    new THREE.Vector3(0, 0.18, 0.08),
    new THREE.Vector3(0, 0.28, 1.02),
    new THREE.Vector3(0, 0.24, 0.24),
    new THREE.Vector3(1.25, 0.72, 2.35),
    [wheelMat],
  );

  /* ── PART 03: Edelstahl-Feinsieb & Pumpensumpf ── */
  const filterGroup = new THREE.Group();
  const filterSteel = materials.brushedDrum();
  const filterRimMat = materials.graphiteGasket();

  const flatSieve = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.32, 0.3, 0.028, 32)),
    filterSteel,
  );
  const microCylinder = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.12, 0.1, 0.28, 28)),
    filterSteel,
  );
  microCylinder.position.y = -0.12;
  const topTwistGrip = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.16, 0.04, 0.05, 0.015, 0.006)),
    filterRimMat,
  );
  topTwistGrip.position.y = 0.03;
  filterGroup.add(flatSieve, microCylinder, topTwistGrip);
  registerPart(
    2,
    filterGroup,
    new THREE.Vector3(0, -0.46, 0.06),
    new THREE.Vector3(-0.92, -0.05, 0.56),
    new THREE.Vector3(0, 0.14, 0),
    new THREE.Vector3(-1.55, 0.3, 2.05),
    [filterSteel, filterRimMat],
  );

  /* ── PART 04: Umwälz- & Heizpumpe ── */
  const heatPumpGroup = new THREE.Group();
  const motorMat = materials.ceruleanPart();
  const heaterRingMat = materials.copperCoil();

  const motorBody = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.17, 0.17, 0.34, 28)),
    motorMat,
  );
  motorBody.rotation.z = Math.PI / 2;
  const heaterSleeve = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.19, 0.19, 0.16, 28)),
    heaterRingMat,
  );
  heaterSleeve.rotation.z = Math.PI / 2;
  heaterSleeve.position.x = 0.22;
  const intakePort = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.06, 0.06, 0.16, 16)),
    materials.graphiteGasket(),
  );
  intakePort.position.set(0.24, 0.17, 0);
  heatPumpGroup.add(motorBody, heaterSleeve, intakePort);
  registerPart(
    3,
    heatPumpGroup,
    new THREE.Vector3(0.22, -0.7, -0.08),
    new THREE.Vector3(0.86, -0.35, 0.42),
    new THREE.Vector3(0.1, 0.24, 0),
    new THREE.Vector3(1.55, -0.35, 2.05),
    [motorMat, heaterRingMat],
  );

  /* ── PART 05: Aquastop-Zulaufschlauch ── */
  const aquastopGroup = new THREE.Group();
  const hoseMat = materials.graphiteGasket();
  const valveMat = materials.ceruleanPart();

  const hoseCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.25, 0),
    new THREE.Vector3(-0.18, 0.04, -0.18),
    new THREE.Vector3(-0.28, -0.22, -0.05),
    new THREE.Vector3(-0.12, -0.44, 0.14),
  ]);
  const hoseMesh = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(hoseCurve, 36, 0.032, 10, false)),
    hoseMat,
  );
  const valveBox = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.2, 0.28, 0.14, 0.035, 0.01)),
    valveMat,
  );
  valveBox.position.set(0, 0.34, 0);
  const brassNut = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.055, 0.055, 0.06, 6)),
    materials.copperCoil(),
  );
  brassNut.position.set(0, 0.51, 0);
  aquastopGroup.add(hoseMesh, valveBox, brassNut);
  registerPart(
    4,
    aquastopGroup,
    new THREE.Vector3(-0.52, -0.24, -0.48),
    new THREE.Vector3(-1.02, 0.14, -0.45),
    new THREE.Vector3(0, 0.42, 0),
    new THREE.Vector3(-1.65, 0.25, -1.75),
    [valveMat, hoseMat],
  );

  return {
    id: "geschirrspueler",
    root,
    chassisMaterials,
    chassisBaseOpacities,
    edgeMaterials,
    parts,
    animate: (_elapsed, delta) => {
      upperSpray.rotation.y += delta * 1.15;
      lowerSpray.rotation.y -= delta * 1.35;
    },
  };
}
