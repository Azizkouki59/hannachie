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
 * High-precision cutaway: Kühlschrank & Gefrierkombination
 * 7 real failure-prone spare parts: Magnet-Türdichtung, Thermostat & NTC,
 * Abtauheizung/NoFrost, Umluftventilator, Anlaufrelais (PTC), Einbau-Türscharniere, Glasablagen/Schubladen.
 */
export function buildFridgeAssembly(
  ctx: StudioBuilderContext,
): BuiltApplianceAssembly {
  const meta = getApplianceMeta("kuehlschrank");
  const { trackGeo, trackMat, materials, isSoftwareGl } = ctx;
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

  // Tall insulated brushed-steel cabinet
  const cabinet = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(1.26, 2.24, 1.06, 0.08, 0.025)),
    steelCabinetMat,
  );
  cabinet.castShadow = !isSoftwareGl;
  cabinet.receiveShadow = !isSoftwareGl;
  addArchitecturalEdges(cabinet, edgeMat, trackGeo, 35);
  root.add(cabinet);

  // Articulated upper & lower doors
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

  /* ── 01: Magnet-Türdichtung ── */
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

  /* ── 02: Thermostat & NTC-Temperaturfühler ── */
  const thermoGroup = new THREE.Group();
  const thermoMat = materials.ceruleanPart();
  const housing = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.24, 0.14, 0.34, 0.03, 0.008)),
    thermoMat,
  );
  const dial = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 18)),
    materials.brightChrome(),
  );
  dial.rotation.z = Math.PI / 2;
  dial.position.set(-0.13, 0, 0.05);
  const ntcProbe = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.016, 0.016, 0.24, 10)),
    materials.copperCoil(),
  );
  ntcProbe.rotation.x = Math.PI / 2;
  ntcProbe.position.set(0, -0.02, -0.24);
  thermoGroup.add(housing, dial, ntcProbe);
  registerPart(
    1,
    thermoGroup,
    new THREE.Vector3(0.42, 0.82, 0.08),
    new THREE.Vector3(0.95, 0.38, 0.34),
    new THREE.Vector3(0, 0.14, 0),
    new THREE.Vector3(1.55, 0.98, 1.95),
    [thermoMat],
    0.24,
  );

  /* ── 03: Abtauheizung & NoFrost-Thermosicherung ── */
  const defrostGroup = new THREE.Group();
  const coilMat = materials.copperCoil();
  const defrostBarMat = materials.warmAmberPart();
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < 5; i++) {
    const y = 0.28 - i * 0.14;
    const dir = i % 2 === 0 ? 1 : -1;
    pts.push(new THREE.Vector3(-0.28 * dir, y, 0));
    pts.push(new THREE.Vector3(0.28 * dir, y, 0));
  }
  const evapCurve = new THREE.CatmullRomCurve3(pts);
  const evapTube = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(evapCurve, 56, 0.019, 8, false)),
    coilMat,
  );
  const defrostElement = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.022, 0.022, 0.62, 12)),
    defrostBarMat,
  );
  defrostElement.rotation.z = Math.PI / 2;
  defrostElement.position.set(0, -0.34, 0.03);
  defrostGroup.add(evapTube, defrostElement);
  registerPart(
    2,
    defrostGroup,
    new THREE.Vector3(0, 0.06, -0.44),
    new THREE.Vector3(-0.96, 0.14, -0.48),
    new THREE.Vector3(0, 0.34, 0),
    new THREE.Vector3(-1.55, 0.35, -1.9),
    [coilMat, defrostBarMat],
  );

  /* ── 04: Umluftventilator (NoFrost-Lüfter) ── */
  const fanGroup = new THREE.Group();
  const fanShroudMat = materials.ceruleanPart();
  const fanShroud = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.16, 0.028, 10, 26)),
    fanShroudMat,
  );
  const fanBackPlate = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.36, 0.36, 0.035, 0.04, 0.008)),
    materials.mattePolymer(),
  );
  fanBackPlate.position.z = -0.04;
  const fanBlades = new THREE.Group();
  const bGeo = trackGeo(new THREE.BoxGeometry(0.25, 0.046, 0.015));
  for (let i = 0; i < 3; i++) {
    const b = new THREE.Mesh(bGeo, materials.brightChrome());
    b.rotation.z = (i * Math.PI) / 3;
    fanBlades.add(b);
  }
  fanGroup.add(fanBackPlate, fanShroud, fanBlades);
  registerPart(
    3,
    fanGroup,
    new THREE.Vector3(0, 0.68, -0.4),
    new THREE.Vector3(0.88, 0.44, -0.52),
    new THREE.Vector3(0, 0.22, 0),
    new THREE.Vector3(1.5, 0.88, -1.85),
    [fanShroudMat],
    0.24,
  );

  /* ── 05: Anlaufrelais (PTC) & Kompressor-Klixon ── */
  const compGroup = new THREE.Group();
  const compShellMat = materials.graphiteGasket();
  const relayMat = materials.ceruleanPart();
  const stubMat = materials.copperCoil();
  const compBody = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.21, 0.23, 0.28, 24)),
    compShellMat,
  );
  const compDome = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.21, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2)),
    compShellMat,
  );
  compDome.position.y = 0.14;
  const relayBox = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.14, 0.16, 0.12, 0.02, 0.006)),
    relayMat,
  );
  relayBox.position.set(0.23, -0.02, 0.06);
  const copperStub = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.018, 0.018, 0.22, 10)),
    stubMat,
  );
  copperStub.rotation.z = -0.55;
  copperStub.position.set(-0.18, 0.15, 0);
  compGroup.add(compBody, compDome, relayBox, copperStub);
  registerPart(
    4,
    compGroup,
    new THREE.Vector3(0.08, -0.86, -0.26),
    new THREE.Vector3(0.84, -0.26, -0.46),
    new THREE.Vector3(0, 0.26, 0),
    new THREE.Vector3(1.55, -0.5, -1.95),
    [compShellMat, relayMat, stubMat],
  );

  /* ── 06: Einbau-Türscharniere & Schleppscharnier ── */
  const hingeGroup = new THREE.Group();
  const hingeSteelMat = materials.brightChrome();
  const hingeSpringMat = materials.brassFitting();
  const buildFlatHinge = (yPos: number) => {
    const h = new THREE.Group();
    h.position.y = yPos;
    const armA = new THREE.Mesh(
      trackGeo(createChamferedBoxGeo(0.05, 0.18, 0.22, 0.012, 0.004)),
      hingeSteelMat,
    );
    const armB = new THREE.Mesh(
      trackGeo(createChamferedBoxGeo(0.14, 0.06, 0.05, 0.01, 0.004)),
      hingeSteelMat,
    );
    armB.position.set(-0.06, 0, 0.11);
    const pivotPin = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 12)),
      hingeSpringMat,
    );
    pivotPin.position.set(0, 0, 0.08);
    h.add(armA, armB, pivotPin);
    return h;
  };
  hingeGroup.add(buildFlatHinge(0.54), buildFlatHinge(-0.54));
  registerPart(
    5,
    hingeGroup,
    new THREE.Vector3(0.62, 0.04, 0.44),
    new THREE.Vector3(0.94, -0.1, 0.46),
    new THREE.Vector3(0.08, 0.54, 0.05),
    new THREE.Vector3(1.65, 0.18, 1.9),
    [hingeSteelMat, hingeSpringMat],
    0.26,
  );

  /* ── 07: Glasablagen, Türabsteller & Gefrierschubladen ── */
  const drawerGroup = new THREE.Group();
  const glassMat = materials.frostedGlass();
  const trimMat = materials.brightChrome();
  const handleMat = materials.ceruleanPart();
  const shelf = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.96, 0.026, 0.66, 0.015, 0.004)),
    glassMat,
  );
  shelf.position.set(0, 0.26, 0);
  const shelfTrim = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.96, 0.036, 0.036, 0.01, 0.004)),
    trimMat,
  );
  shelfTrim.position.set(0, 0.26, 0.33);
  const crisper = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.92, 0.34, 0.66, 0.04, 0.01)),
    glassMat,
  );
  crisper.position.set(0, -0.18, 0.02);
  const crisperHandle = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.42, 0.045, 0.04, 0.015, 0.005)),
    handleMat,
  );
  crisperHandle.position.set(0, -0.06, 0.36);
  drawerGroup.add(shelf, shelfTrim, crisper, crisperHandle);
  registerPart(
    6,
    drawerGroup,
    new THREE.Vector3(0, -0.08, 0.04),
    new THREE.Vector3(-0.98, -0.08, 0.58),
    new THREE.Vector3(0, 0.24, 0.12),
    new THREE.Vector3(-1.55, 0.18, 2.2),
    [trimMat, handleMat],
  );

  return {
    id: "kuehlschrank",
    root,
    chassisMaterials,
    chassisBaseOpacities,
    edgeMaterials,
    parts,
    allClickables,
    animate: (_elapsed, delta, explode) => {
      fanBlades.rotation.z -= delta * 2.1;
      upperDoorPivot.rotation.y = THREE.MathUtils.lerp(0, 0.72, explode);
    },
  };
}
