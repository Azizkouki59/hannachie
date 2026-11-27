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
 * High-precision cutaway: Kaffeevollautomat
 * 7 real failure-prone spare parts: Brühgruppe, Dichtungen/O-Ringe, Keramikmahlwerk,
 * Thermoblock, Vibrationspumpe (ULKA), Drainageventil, Wassertank & Milchsystem.
 */
export function buildCoffeeMachineAssembly(
  ctx: StudioBuilderContext,
): BuiltApplianceAssembly {
  const meta = getApplianceMeta("kaffeevollautomat");
  const { trackGeo, trackMat, materials, isSoftwareGl } = ctx;
  const root = new THREE.Group();

  const chassisMaterials: THREE.MeshPhysicalMaterial[] = [];
  const chassisBaseOpacities: number[] = [];
  const edgeMaterials: THREE.LineBasicMaterial[] = [];

  const bodyMat = materials.darkChassis();
  const frontSteelMat = materials.satinSteel();
  const hopperLidMat = materials.obsidianGlass();
  const edgeMat = materials.edgeLine();
  chassisMaterials.push(bodyMat, frontSteelMat, hopperLidMat);
  chassisBaseOpacities.push(1, 1, 0.85);
  edgeMaterials.push(edgeMat);

  // Main sleek compact espresso chassis
  const mainBody = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(1.16, 1.56, 1.48, 0.09, 0.025)),
    bodyMat,
  );
  mainBody.position.set(0, -0.04, -0.06);
  mainBody.castShadow = !isSoftwareGl;
  mainBody.receiveShadow = !isSoftwareGl;
  addArchitecturalEdges(mainBody, edgeMat, trackGeo, 35);
  root.add(mainBody);

  // Brushed stainless upper front fascia + TFT display
  const frontFascia = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(1.1, 0.42, 0.06, 0.05, 0.012)),
    frontSteelMat,
  );
  frontFascia.position.set(0, 0.48, 0.68);
  addArchitecturalEdges(frontFascia, edgeMat, trackGeo, 40);
  root.add(frontFascia);

  const tftScreen = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.56, 0.22, 0.03, 0.025, 0.005)),
    materials.obsidianGlass(),
  );
  tftScreen.position.set(0, 0.48, 0.71);
  root.add(tftScreen);

  // Lower stainless drip-tray base extending slightly forward
  const dripTray = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(1.12, 0.18, 0.46, 0.04, 0.01)),
    frontSteelMat,
  );
  dripTray.position.set(0, -0.74, 0.76);
  addArchitecturalEdges(dripTray, edgeMat, trackGeo, 40);
  root.add(dripTray);

  // Top smoked bean-hopper lid
  const hopperLid = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.84, 0.08, 0.82, 0.06, 0.01)),
    hopperLidMat,
  );
  hopperLid.position.set(-0.08, 0.76, -0.14);
  root.add(hopperLid);

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

  /* ── 01: Brühgruppe (Brüheinheit) ── */
  const brewGroup = new THREE.Group();
  const brewFrameMat = materials.graphiteGasket();
  const brewAccentMat = materials.ceruleanPart();
  const brewSteelMat = materials.brightChrome();

  const brewFrame = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.38, 0.56, 0.44, 0.04, 0.01)),
    brewFrameMat,
  );
  const brewCylinder = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.145, 0.145, 0.34, 22)),
    brewSteelMat,
  );
  brewCylinder.position.set(0, 0.04, 0.04);
  const brewSieveTop = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.125, 0.125, 0.03, 20)),
    brewAccentMat,
  );
  brewSieveTop.position.set(0, 0.22, 0.04);
  const releaseLever = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.08, 0.22, 0.12, 0.02, 0.005)),
    brewAccentMat,
  );
  releaseLever.position.set(0.2, 0.06, 0.12);
  brewGroup.add(brewFrame, brewCylinder, brewSieveTop, releaseLever);
  registerPart(
    0,
    brewGroup,
    new THREE.Vector3(0.12, -0.06, 0.08),
    new THREE.Vector3(1.02, 0.06, 0.38),
    new THREE.Vector3(0, 0.34, 0.06),
    new THREE.Vector3(1.75, 0.32, 2.05),
    [brewFrameMat, brewAccentMat],
  );

  /* ── 02: Dichtungen & O-Ring Wartungsset ── */
  const sealGroup = new THREE.Group();
  const sealRedMat = materials.warmAmberPart();
  const sealDarkMat = materials.graphiteGasket();
  const bigPistonRing = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.14, 0.022, 12, 30)),
    sealRedMat,
  );
  bigPistonRing.rotation.x = Math.PI / 2;
  const secondRing = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.11, 0.018, 10, 26)),
    sealRedMat,
  );
  secondRing.rotation.x = Math.PI / 2;
  secondRing.position.set(0, 0.08, 0);
  const smallRingA = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.055, 0.014, 10, 20)),
    sealDarkMat,
  );
  smallRingA.position.set(-0.14, -0.05, 0.06);
  const smallRingB = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.055, 0.014, 10, 20)),
    sealDarkMat,
  );
  smallRingB.position.set(0.14, -0.05, 0.06);
  sealGroup.add(bigPistonRing, secondRing, smallRingA, smallRingB);
  registerPart(
    1,
    sealGroup,
    new THREE.Vector3(0.12, -0.18, 0.24),
    new THREE.Vector3(0.88, -0.34, 0.84),
    new THREE.Vector3(0, 0.16, 0.04),
    new THREE.Vector3(1.5, -0.25, 2.15),
    [sealRedMat, sealDarkMat],
    0.24,
  );

  /* ── 03: Keramik- / Kegelmahlwerk ── */
  const grinderGroup = new THREE.Group();
  const burrMat = materials.satinSteel();
  const grinderRingMat = materials.ceruleanPart();
  const gearMat = materials.brassFitting();

  const grinderHousing = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.22, 0.19, 0.22, 24)),
    materials.graphiteGasket(),
  );
  const burrRotor = new THREE.Group();
  burrRotor.position.y = 0.08;
  const burrCone = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.11, 0.16, 0.12, 16)),
    burrMat,
  );
  const adjustRing = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.21, 0.026, 10, 28)),
    grinderRingMat,
  );
  adjustRing.rotation.x = Math.PI / 2;
  adjustRing.position.y = 0.05;
  burrRotor.add(burrCone);

  const driveGear = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.13, 0.13, 0.05, 18)),
    gearMat,
  );
  driveGear.position.y = -0.15;
  grinderGroup.add(grinderHousing, burrRotor, adjustRing, driveGear);
  registerPart(
    2,
    grinderGroup,
    new THREE.Vector3(-0.08, 0.48, -0.18),
    new THREE.Vector3(-0.18, 0.72, -0.22),
    new THREE.Vector3(0, 0.24, 0),
    new THREE.Vector3(-1.35, 1.15, 1.95),
    [burrMat, grinderRingMat, gearMat],
    0.26,
  );

  /* ── 04: Thermoblock (Durchlauferhitzer) ── */
  const thermoBlockGroup = new THREE.Group();
  const blockCastMat = materials.satinSteel();
  const blockHeatMat = materials.warmAmberPart();
  const copperPipeMat = materials.copperCoil();

  const blockDisc = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.24, 0.24, 0.11, 26)),
    blockCastMat,
  );
  const heatingLoop = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.17, 0.028, 12, 30, Math.PI * 1.65)),
    blockHeatMat,
  );
  heatingLoop.rotation.x = Math.PI / 2;
  heatingLoop.position.y = 0.06;
  [-0.08, 0.08].forEach((px) => {
    const stub = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.018, 0.018, 0.16, 10)),
      copperPipeMat,
    );
    stub.position.set(px, 0.06, 0.2);
    stub.rotation.x = Math.PI / 2;
    thermoBlockGroup.add(stub);
  });
  thermoBlockGroup.add(blockDisc, heatingLoop);
  registerPart(
    3,
    thermoBlockGroup,
    new THREE.Vector3(-0.08, 0.16, -0.34),
    new THREE.Vector3(0.42, 0.36, -0.84),
    new THREE.Vector3(0, 0.18, 0),
    new THREE.Vector3(1.45, 0.52, -2.05),
    [blockCastMat, blockHeatMat, copperPipeMat],
    0.26,
  );

  /* ── 05: Vibrationspumpe (z. B. ULKA-Pumpe) ── */
  const ulkaGroup = new THREE.Group();
  const ulkaCoilMat = materials.warmAmberPart();
  const ulkaBrassMat = materials.brassFitting();
  const ulkaBody = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.22, 0.24, 0.22, 0.03, 0.008)),
    ulkaCoilMat,
  );
  const ulkaOutlet = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.04, 0.048, 0.16, 14)),
    ulkaBrassMat,
  );
  ulkaOutlet.position.y = 0.18;
  const ulkaInlet = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.034, 0.034, 0.14, 12)),
    materials.mattePolymer(),
  );
  ulkaInlet.position.y = -0.17;
  ulkaGroup.add(ulkaBody, ulkaOutlet, ulkaInlet);
  registerPart(
    4,
    ulkaGroup,
    new THREE.Vector3(-0.24, -0.46, -0.34),
    new THREE.Vector3(-0.88, -0.26, -0.56),
    new THREE.Vector3(0, 0.24, 0),
    new THREE.Vector3(-1.55, -0.32, -1.85),
    [ulkaCoilMat, ulkaBrassMat],
    0.24,
  );

  /* ── 06: Drainageventil & Auslaufventil ── */
  const drainValveGroup = new THREE.Group();
  const dvBodyMat = materials.ceruleanPart();
  const dvPinMat = materials.brassFitting();
  const dvHousing = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.085, 0.095, 0.24, 18)),
    dvBodyMat,
  );
  const dvPin = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.025, 0.025, 0.18, 12)),
    dvPinMat,
  );
  dvPin.position.y = 0.16;
  const dvSpout = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.028, 0.028, 0.16, 12)),
    materials.graphiteGasket(),
  );
  dvSpout.rotation.z = Math.PI / 2;
  dvSpout.position.set(0.11, -0.05, 0);
  drainValveGroup.add(dvHousing, dvPin, dvSpout);
  registerPart(
    5,
    drainValveGroup,
    new THREE.Vector3(0.08, -0.52, 0.18),
    new THREE.Vector3(0.16, -0.56, 0.88),
    new THREE.Vector3(0, 0.2, 0),
    new THREE.Vector3(1.25, -0.65, 2.05),
    [dvBodyMat, dvPinMat],
    0.24,
  );

  /* ── 07: Wassertank-Ventil & Milchsystem-Dichtung ── */
  const tankGroup = new THREE.Group();
  const tankGlassMat = materials.frostedGlass();
  const tankValveMat = materials.ceruleanPart();
  const spoutChromeMat = materials.brightChrome();

  const tankVessel = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.28, 1.06, 0.72, 0.05, 0.012)),
    tankGlassMat,
  );
  tankVessel.renderOrder = 4;
  const tankBottomValve = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 16)),
    tankValveMat,
  );
  tankBottomValve.position.set(0, -0.54, 0.1);
  // Front milk frother nozzle accessory grouped visually on tank/dispense side
  const milkFrother = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.045, 0.036, 0.22, 16)),
    spoutChromeMat,
  );
  milkFrother.position.set(0.18, -0.04, 0.44);
  tankGroup.add(tankVessel, tankBottomValve, milkFrother);
  registerPart(
    6,
    tankGroup,
    new THREE.Vector3(-0.56, -0.06, -0.06),
    new THREE.Vector3(-0.98, 0.04, 0.32),
    new THREE.Vector3(-0.08, 0.46, 0.1),
    new THREE.Vector3(-1.85, 0.28, 2.05),
    [tankValveMat, spoutChromeMat],
  );

  return {
    id: "kaffeevollautomat",
    root,
    chassisMaterials,
    chassisBaseOpacities,
    edgeMaterials,
    parts,
    allClickables,
    animate: (_elapsed, delta) => {
      burrRotor.rotation.y += delta * 1.45;
      driveGear.rotation.y -= delta * 1.45;
    },
  };
}
