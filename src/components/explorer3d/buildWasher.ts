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
 * Braun / Apple technical cutaway: Front-loading Waschmaschine
 * 5 interactive coaxial spare parts + chamfered ceramic shell that becomes a CAD outline on explode.
 */
export function buildWasherAssembly(
  ctx: StudioBuilderContext,
): BuiltApplianceAssembly {
  const meta = getApplianceMeta("waschmaschine");
  const { trackGeo, materials, isSoftwareGl } = ctx;
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

  // Outer Braun-style chamfered cabinet (slightly recessed front so drum/parts sit cleanly)
  const cabinet = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(1.48, 1.92, 1.18, 0.1, 0.028)),
    shellMat,
  );
  cabinet.castShadow = !isSoftwareGl;
  cabinet.receiveShadow = !isSoftwareGl;
  addArchitecturalEdges(cabinet, edgeMat, trackGeo, 35);
  root.add(cabinet);

  // Recessed dark precision plinth at base
  const plinth = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(1.42, 0.14, 1.1, 0.04, 0.012)),
    plinthMat,
  );
  plinth.position.set(0, -0.96, -0.02);
  root.add(plinth);

  // Top satin-steel control fascia + detergent drawer + machined program dial + obsidian display
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
    trackGeo(new THREE.CylinderGeometry(0.095, 0.105, 0.06, 28)),
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

  // Inner tub frame (always crisp inside when shell becomes translucent)
  const innerTubMat = materials.darkChassis();
  innerTubMat.opacity = 0.55;
  chassisMaterials.push(innerTubMat);
  chassisBaseOpacities.push(0.55);

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

  /* ── PART 01: Edelstahl-Waschtrommel & Lagerkreuz ── */
  const drumGroup = new THREE.Group();
  const drumMat = materials.brushedDrum();
  const drumShell = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.47, 0.47, 0.62, 40, 1, true)),
    drumMat,
  );
  drumShell.rotation.x = Math.PI / 2;
  drumShell.castShadow = !isSoftwareGl;

  const drumBack = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.46, 0.46, 0.04, 36)),
    drumMat,
  );
  drumBack.rotation.x = Math.PI / 2;
  drumBack.position.z = -0.3;

  const drumFrontLip = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.45, 0.032, 14, 42)),
    materials.brightChrome(),
  );
  drumFrontLip.position.z = 0.31;

  // 3 precision interior paddle lifters
  const lifterGeo = trackGeo(createChamferedBoxGeo(0.09, 0.07, 0.48, 0.02, 0.008));
  const lifterMat = materials.ceruleanPart();
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const lifter = new THREE.Mesh(lifterGeo, lifterMat);
    lifter.position.set(Math.cos(angle) * 0.41, Math.sin(angle) * 0.41, 0);
    lifter.rotation.z = angle + Math.PI / 2;
    drumGroup.add(lifter);
  }

  // Instanced perforated dimples around drum circumference (zero extra draw calls)
  const perfGeo = trackGeo(new THREE.CylinderGeometry(0.016, 0.016, 0.018, 8));
  const perfMat = materials.darkChassis();
  const perfRows = 4;
  const perfCols = 16;
  const perfMesh = new THREE.InstancedMesh(perfGeo, perfMat, perfRows * perfCols);
  const _dummy = new THREE.Object3D();
  let pIdx = 0;
  for (let r = 0; r < perfRows; r++) {
    const zPos = -0.2 + r * 0.133;
    for (let c = 0; c < perfCols; c++) {
      const a = (c / perfCols) * Math.PI * 2 + r * 0.18;
      _dummy.position.set(Math.cos(a) * 0.472, Math.sin(a) * 0.472, zPos);
      _dummy.rotation.set(0, 0, a + Math.PI / 2);
      _dummy.updateMatrix();
      perfMesh.setMatrixAt(pIdx++, _dummy.matrix);
    }
  }
  perfMesh.computeBoundingSphere();

  const drumSpinGroup = new THREE.Group();
  drumSpinGroup.add(drumShell, drumBack, drumFrontLip, perfMesh);
  drumGroup.add(drumSpinGroup);
  registerPart(
    0,
    drumGroup,
    new THREE.Vector3(0, -0.06, -0.02),
    new THREE.Vector3(0, 0.14, 0.52),
    new THREE.Vector3(0, 0.36, 0.18),
    new THREE.Vector3(1.5, 0.65, 2.5),
    [drumMat, lifterMat],
  );

  /* ── PART 02: Türmanschette (EPDM-Dichtung) + Bullaugenring ── */
  const gasketGroup = new THREE.Group();
  const gasketMat = materials.graphiteGasket();
  const outerBoot = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.45, 0.068, 18, 46)),
    gasketMat,
  );
  const innerFold = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.39, 0.032, 12, 42)),
    gasketMat,
  );
  innerFold.position.z = 0.04;

  const clampWire = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.48, 0.012, 10, 46)),
    materials.brightChrome(),
  );
  clampWire.position.z = -0.02;

  const portholeRing = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.49, 0.048, 16, 48)),
    materials.brightChrome(),
  );
  portholeRing.position.z = 0.14;

  const portholeGlass = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.44, 0.36, 0.09, 36)),
    materials.frostedGlass(),
  );
  portholeGlass.rotation.x = Math.PI / 2;
  portholeGlass.position.z = 0.14;
  portholeGlass.renderOrder = 4;

  gasketGroup.add(outerBoot, innerFold, clampWire, portholeRing, portholeGlass);
  registerPart(
    1,
    gasketGroup,
    new THREE.Vector3(0, -0.06, 0.49),
    new THREE.Vector3(0, -0.02, 1.05),
    new THREE.Vector3(0.38, 0.25, 0.12),
    new THREE.Vector3(1.3, 0.35, 2.35),
    [gasketMat],
  );

  /* ── PART 03: Heizstab & NTC-Temperaturfühler ── */
  const heaterGroup = new THREE.Group();
  const heaterMat = materials.copperCoil();
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
    trackGeo(new THREE.TubeGeometry(curve, 52, 0.022, 10, false)),
    heaterMat,
  );
  const flange = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.28, 0.09, 0.045, 0.03, 0.008)),
    materials.brightChrome(),
  );
  flange.position.set(0, 0, 0.19);
  const ntcTip = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 14)),
    ntcMat,
  );
  ntcTip.rotation.x = Math.PI / 2;
  ntcTip.position.set(0, 0, 0.16);
  heaterGroup.add(heatingTube, flange, ntcTip);
  registerPart(
    2,
    heaterGroup,
    new THREE.Vector3(0, -0.58, 0.06),
    new THREE.Vector3(-0.98, -0.28, 0.38),
    new THREE.Vector3(0, 0.12, 0.06),
    new THREE.Vector3(-1.45, -0.2, 2.1),
    [heaterMat, ntcMat],
  );

  /* ── PART 04: Laugenpumpe & Flügelrad ── */
  const pumpGroup = new THREE.Group();
  const pumpStatorMat = materials.ceruleanPart();
  const pumpHousingMat = materials.graphiteGasket();
  const volute = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.16, 0.16, 0.16, 26)),
    pumpHousingMat,
  );
  volute.rotation.x = Math.PI / 2;
  const motorCore = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.24, 0.24, 0.22, 0.04, 0.012)),
    pumpStatorMat,
  );
  motorCore.position.set(0, 0, -0.18);
  const outletPipe = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.045, 0.045, 0.22, 16)),
    pumpHousingMat,
  );
  outletPipe.rotation.z = Math.PI / 2;
  outletPipe.position.set(0.18, 0.06, 0);

  const impeller = new THREE.Group();
  impeller.position.set(0, 0, 0.09);
  const hub = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 14)),
    materials.brightChrome(),
  );
  hub.rotation.x = Math.PI / 2;
  impeller.add(hub);
  const bladeGeo = trackGeo(new THREE.BoxGeometry(0.18, 0.025, 0.032));
  for (let i = 0; i < 2; i++) {
    const blade = new THREE.Mesh(bladeGeo, materials.brightChrome());
    blade.rotation.z = (i * Math.PI) / 2;
    impeller.add(blade);
  }
  pumpGroup.add(volute, motorCore, outletPipe, impeller);
  registerPart(
    3,
    pumpGroup,
    new THREE.Vector3(0.42, -0.68, 0.28),
    new THREE.Vector3(0.95, -0.22, 0.52),
    new THREE.Vector3(0, 0.2, 0.06),
    new THREE.Vector3(1.6, -0.35, 2.05),
    [pumpStatorMat, pumpHousingMat],
  );

  /* ── PART 05: Antriebsriemen & Riemenscheibe ── */
  const driveGroup = new THREE.Group();
  const pulleyMat = materials.satinSteel();
  const beltMat = materials.graphiteGasket();
  const pulleyRim = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.36, 0.028, 12, 40)),
    pulleyMat,
  );
  const pulleyHub = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.065, 0.065, 0.07, 18)),
    materials.brightChrome(),
  );
  pulleyHub.rotation.x = Math.PI / 2;
  const spokeGeo = trackGeo(new THREE.BoxGeometry(0.68, 0.032, 0.026));
  for (let i = 0; i < 3; i++) {
    const spoke = new THREE.Mesh(spokeGeo, pulleyMat);
    spoke.rotation.z = (i * Math.PI) / 3;
    driveGroup.add(spoke);
  }
  const belt = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.39, 0.015, 8, 42)),
    beltMat,
  );
  driveGroup.add(pulleyRim, pulleyHub, belt);
  registerPart(
    4,
    driveGroup,
    new THREE.Vector3(0, -0.06, -0.52),
    new THREE.Vector3(-0.78, 0.28, -0.68),
    new THREE.Vector3(-0.18, 0.34, 0),
    new THREE.Vector3(-1.55, 0.45, -1.9),
    [pulleyMat, beltMat],
  );

  return {
    id: "waschmaschine",
    root,
    chassisMaterials,
    chassisBaseOpacities,
    edgeMaterials,
    parts,
    animate: (_elapsed, delta) => {
      drumSpinGroup.rotation.z -= delta * 0.72;
      impeller.rotation.z += delta * 2.4;
      driveGroup.rotation.z -= delta * 0.72;
    },
  };
}
