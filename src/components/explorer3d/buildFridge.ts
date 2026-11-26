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
 * Braun / Apple technical cutaway: Kühlschrank & Gefrierkombination
 * 5 selectable spare parts: Magnet-Türdichtung, Thermostat & NTC, Glasablagen/Schublade, NoFrost-Lüfter, Kompressor/Relais.
 */
export function buildFridgeAssembly(
  ctx: StudioBuilderContext,
): BuiltApplianceAssembly {
  const meta = getApplianceMeta("kuehlschrank");
  const { trackGeo, materials, isSoftwareGl } = ctx;
  const root = new THREE.Group();

  const chassisMaterials: THREE.MeshPhysicalMaterial[] = [];
  const chassisBaseOpacities: number[] = [];
  const edgeMaterials: THREE.LineBasicMaterial[] = [];

  const steelCabinetMat = materials.satinSteel();
  const doorShellMat = materials.ceramicShell();
  const edgeMat = materials.edgeLine();
  chassisMaterials.push(steelCabinetMat, doorShellMat);
  chassisBaseOpacities.push(1, 1);
  edgeMaterials.push(edgeMat);

  // Tall insulated Braun-style brushed cabinet
  const cabinet = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(1.26, 2.24, 1.06, 0.08, 0.025)),
    steelCabinetMat,
  );
  cabinet.castShadow = !isSoftwareGl;
  cabinet.receiveShadow = !isSoftwareGl;
  addArchitecturalEdges(cabinet, edgeMat, trackGeo, 35);
  root.add(cabinet);

  // Upper & lower articulated doors (pivot open gently with explode)
  const upperDoorPivot = new THREE.Group();
  upperDoorPivot.position.set(0.6, 0.42, 0.56);
  const upperDoor = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(1.2, 1.28, 0.1, 0.06, 0.016)),
    doorShellMat,
  );
  upperDoor.position.set(-0.6, 0, 0);
  addArchitecturalEdges(upperDoor, edgeMat, trackGeo, 38);
  const upperHandle = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.055, 0.62, 0.08, 0.02, 0.008)),
    materials.brightChrome(),
  );
  upperHandle.position.set(-1.08, -0.1, 0.08);
  upperDoorPivot.add(upperDoor, upperHandle);
  root.add(upperDoorPivot);

  const lowerDoor = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(1.2, 0.82, 0.1, 0.06, 0.016)),
    doorShellMat,
  );
  lowerDoor.position.set(0, -0.68, 0.56);
  addArchitecturalEdges(lowerDoor, edgeMat, trackGeo, 38);
  const lowerHandle = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.055, 0.36, 0.08, 0.02, 0.008)),
    materials.brightChrome(),
  );
  lowerHandle.position.set(-0.48, -0.68, 0.64);
  root.add(lowerDoor, lowerHandle);

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

  /* ── PART 01: Magnet-Türdichtung ── */
  const gasketGroup = new THREE.Group();
  const gasketMat = materials.graphiteGasket();
  const magStripMat = materials.ceruleanPart();

  const sealFrame = new THREE.Mesh(
    trackGeo(createHollowFrameGeo(1.12, 1.2, 0.068, 0.052, 0.045)),
    gasketMat,
  );
  const magAccent = new THREE.Mesh(
    trackGeo(createHollowFrameGeo(1.09, 1.17, 0.022, 0.056, 0.04)),
    magStripMat,
  );
  gasketGroup.add(sealFrame, magAccent);
  registerPart(
    0,
    gasketGroup,
    new THREE.Vector3(0, 0.42, 0.49),
    new THREE.Vector3(0, 0.16, 0.96),
    new THREE.Vector3(-0.38, 0.42, 0.06),
    new THREE.Vector3(-1.35, 0.72, 2.35),
    [gasketMat, magStripMat],
  );

  /* ── PART 02: Thermostat & NTC-Kühlfühler ── */
  const thermoGroup = new THREE.Group();
  const thermoMat = materials.ceruleanPart();
  const housing = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.24, 0.14, 0.34, 0.03, 0.008)),
    thermoMat,
  );
  const dial = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.052, 0.052, 0.04, 20)),
    materials.brightChrome(),
  );
  dial.rotation.z = Math.PI / 2;
  dial.position.set(-0.13, 0, 0.05);
  const ntcProbe = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.016, 0.016, 0.24, 12)),
    materials.copperCoil(),
  );
  ntcProbe.rotation.x = Math.PI / 2;
  ntcProbe.position.set(0, -0.02, -0.25);
  thermoGroup.add(housing, dial, ntcProbe);
  registerPart(
    1,
    thermoGroup,
    new THREE.Vector3(0.42, 0.78, 0.08),
    new THREE.Vector3(0.95, 0.34, 0.36),
    new THREE.Vector3(0, 0.14, 0),
    new THREE.Vector3(1.55, 0.98, 1.95),
    [thermoMat],
  );

  /* ── PART 03: Glasablagen, Fächer & Schubladen ── */
  const drawerGroup = new THREE.Group();
  const glassMat = materials.frostedGlass();
  const trimMat = materials.brightChrome();

  // Upper glass shelf with brushed aluminum trim
  const shelf = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.98, 0.026, 0.68, 0.015, 0.004)),
    glassMat,
  );
  shelf.position.set(0, 0.26, 0);
  const shelfTrim = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.98, 0.036, 0.036, 0.01, 0.004)),
    trimMat,
  );
  shelfTrim.position.set(0, 0.26, 0.34);

  // Sliding crisper/freezer drawer
  const crisper = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.94, 0.34, 0.68, 0.04, 0.01)),
    glassMat,
  );
  crisper.position.set(0, -0.18, 0.02);
  const crisperHandle = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.42, 0.045, 0.04, 0.015, 0.005)),
    materials.ceruleanPart(),
  );
  crisperHandle.position.set(0, -0.06, 0.37);

  drawerGroup.add(shelf, shelfTrim, crisper, crisperHandle);
  registerPart(
    2,
    drawerGroup,
    new THREE.Vector3(0, -0.04, 0.04),
    new THREE.Vector3(-0.98, 0.02, 0.56),
    new THREE.Vector3(0, 0.24, 0.12),
    new THREE.Vector3(-1.55, 0.25, 2.2),
    [trimMat],
  );

  /* ── PART 04: NoFrost-Lüfter & Verdampferschlange ── */
  const evapGroup = new THREE.Group();
  const coilMat = materials.copperCoil();
  const fanMat = materials.ceruleanPart();

  // Serpentine heat-exchange coil
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < 6; i++) {
    const y = 0.36 - i * 0.14;
    const dir = i % 2 === 0 ? 1 : -1;
    pts.push(new THREE.Vector3(-0.3 * dir, y, 0));
    pts.push(new THREE.Vector3(0.3 * dir, y, 0));
  }
  const evapCurve = new THREE.CatmullRomCurve3(pts);
  const evapTube = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(evapCurve, 72, 0.02, 8, false)),
    coilMat,
  );

  const noFrostFan = new THREE.Group();
  noFrostFan.position.set(0, 0.42, 0.07);
  const fanShroud = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.14, 0.022, 10, 28)),
    fanMat,
  );
  const fanBlades = new THREE.Group();
  const bGeo = trackGeo(new THREE.BoxGeometry(0.22, 0.042, 0.014));
  for (let i = 0; i < 3; i++) {
    const b = new THREE.Mesh(bGeo, materials.brightChrome());
    b.rotation.z = (i * Math.PI) / 3;
    fanBlades.add(b);
  }
  noFrostFan.add(fanShroud, fanBlades);
  evapGroup.add(evapTube, noFrostFan);
  registerPart(
    3,
    evapGroup,
    new THREE.Vector3(0, 0.28, -0.44),
    new THREE.Vector3(0.96, 0.08, -0.52),
    new THREE.Vector3(0, 0.45, 0),
    new THREE.Vector3(1.6, 0.52, -1.85),
    [coilMat, fanMat],
  );

  /* ── PART 05: Kompressor-Aggregat & Startrelais ── */
  const compGroup = new THREE.Group();
  const compShellMat = materials.graphiteGasket();
  const relayMat = materials.ceruleanPart();
  const stubMat = materials.copperCoil();

  // Machined domed hermetic compressor
  const compBody = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.22, 0.24, 0.3, 28)),
    compShellMat,
  );
  const compDome = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.22, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2)),
    compShellMat,
  );
  compDome.position.y = 0.15;
  const relayBox = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.14, 0.16, 0.12, 0.02, 0.006)),
    relayMat,
  );
  relayBox.position.set(0.24, -0.02, 0.06);
  const copperStub = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.018, 0.018, 0.24, 10)),
    stubMat,
  );
  copperStub.rotation.z = -0.55;
  copperStub.position.set(-0.18, 0.16, 0);
  compGroup.add(compBody, compDome, relayBox, copperStub);
  registerPart(
    4,
    compGroup,
    new THREE.Vector3(0.08, -0.86, -0.26),
    new THREE.Vector3(0.86, -0.28, -0.45),
    new THREE.Vector3(0, 0.28, 0),
    new THREE.Vector3(1.55, -0.5, -1.95),
    [compShellMat, relayMat, stubMat],
  );

  return {
    id: "kuehlschrank",
    root,
    chassisMaterials,
    chassisBaseOpacities,
    edgeMaterials,
    parts,
    animate: (_elapsed, delta, explode) => {
      fanBlades.rotation.z -= delta * 2.2;
      // Gently swing upper fridge door open as user pulls Explode slider
      upperDoorPivot.rotation.y = THREE.MathUtils.lerp(0, 0.72, explode);
    },
  };
}
