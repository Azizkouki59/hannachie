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
 * High-precision cutaway: Wärmepumpen- & Kondenstrockner
 * 7 real failure-prone spare parts: Heizregister/Thermosicherung, Antriebsriemen/Spannrolle,
 * Kondensatpumpe/Schwimmer, Flusensieb/Wärmetauscher-Filter, Feuchte-/NTC-Sensor, Türschloss, Trommellager/Laufrollen.
 */
export function buildTrocknerAssembly(
  ctx: StudioBuilderContext,
): BuiltApplianceAssembly {
  const meta = getApplianceMeta("trockner");
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

  // Outer chamfered dryer cabinet
  const cabinet = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(1.48, 1.92, 1.22, 0.09, 0.026)),
    shellMat,
  );
  cabinet.castShadow = !isSoftwareGl;
  cabinet.receiveShadow = !isSoftwareGl;
  addArchitecturalEdges(cabinet, edgeMat, trackGeo, 35);
  root.add(cabinet);

  // Base plinth & bottom-left heat-exchanger service door outline
  const plinth = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(1.44, 0.16, 1.14, 0.04, 0.01)),
    plinthMat,
  );
  plinth.position.set(0, -0.95, -0.02);
  root.add(plinth);

  // Top fascia with condensate water drawer + rotary dial + display
  const fascia = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(1.44, 0.3, 0.06, 0.045, 0.01)),
    fasciaMat,
  );
  fascia.position.set(0, 0.76, 0.61);
  addArchitecturalEdges(fascia, edgeMat, trackGeo, 40);
  root.add(fascia);

  const waterTankDrawer = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.44, 0.19, 0.05, 0.03, 0.008)),
    shellMat,
  );
  waterTankDrawer.position.set(-0.42, 0.76, 0.64);
  root.add(waterTankDrawer);

  const dial = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.09, 0.1, 0.055, 22)),
    materials.brightChrome(),
  );
  dial.rotation.x = Math.PI / 2;
  dial.position.set(0.02, 0.76, 0.65);
  root.add(dial);

  const display = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.4, 0.13, 0.03, 0.02, 0.005)),
    materials.obsidianGlass(),
  );
  display.position.set(0.43, 0.76, 0.64);
  root.add(display);

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

  /* ── 01: Heizregister & Thermosicherung ── */
  const heaterGroup = new THREE.Group();
  const heaterCoilMat = materials.warmAmberPart();
  const klixonMat = materials.brassFitting();
  const heaterPlate = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.56, 0.34, 0.09, 0.035, 0.008)),
    materials.satinSteel(),
  );
  // 3 glowing heating coils inside register
  for (let i = -1; i <= 1; i++) {
    const coil = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.022, 0.022, 0.44, 12)),
      heaterCoilMat,
    );
    coil.rotation.z = Math.PI / 2;
    coil.position.set(0, i * 0.085, 0.04);
    heaterGroup.add(coil);
  }
  // Dual Klixon safety thermostats
  [-0.14, 0.14].forEach((kx) => {
    const klixon = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 14)),
      klixonMat,
    );
    klixon.rotation.x = Math.PI / 2;
    klixon.position.set(kx, 0.19, 0.02);
    heaterGroup.add(klixon);
  });
  heaterGroup.add(heaterPlate);
  registerPart(
    0,
    heaterGroup,
    new THREE.Vector3(0, -0.04, -0.52),
    new THREE.Vector3(0.45, 0.22, -0.82),
    new THREE.Vector3(0, 0.24, 0),
    new THREE.Vector3(1.45, 0.45, -2.05),
    [heaterCoilMat, klixonMat],
    0.28,
  );

  /* ── 02: Trockner-Antriebsriemen & Spannrolle ── */
  const beltGroup = new THREE.Group();
  const beltMat = materials.graphiteGasket();
  const tensionerMat = materials.ceruleanPart();
  const beltLoop = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.48, 0.018, 10, 44)),
    beltMat,
  );
  const tensionPulley = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.075, 0.075, 0.055, 18)),
    tensionerMat,
  );
  tensionPulley.rotation.x = Math.PI / 2;
  tensionPulley.position.set(0.28, -0.46, 0);
  const motorShaft = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.11, 0.11, 0.24, 18)),
    materials.darkChassis(),
  );
  motorShaft.rotation.x = Math.PI / 2;
  motorShaft.position.set(0.06, -0.52, -0.02);
  beltGroup.add(beltLoop, tensionPulley, motorShaft);
  registerPart(
    1,
    beltGroup,
    new THREE.Vector3(0, -0.06, -0.18),
    new THREE.Vector3(-0.88, 0.14, -0.42),
    new THREE.Vector3(-0.34, 0.34, 0),
    new THREE.Vector3(-1.65, 0.35, -1.75),
    [beltMat, tensionerMat],
  );

  /* ── 03: Kondensatpumpe & Schwimmerschalter ── */
  const condPumpGroup = new THREE.Group();
  const pumpMat = materials.ceruleanPart();
  const floatMat = materials.mattePolymer();
  const pumpBox = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.24, 0.18, 0.22, 0.03, 0.008)),
    pumpMat,
  );
  const floatCup = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.065, 0.065, 0.14, 16)),
    floatMat,
  );
  floatCup.position.set(-0.15, -0.02, 0.04);
  const liftTubeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.06, 0.09, -0.04),
    new THREE.Vector3(0.12, 0.35, -0.08),
    new THREE.Vector3(0.04, 0.56, -0.06),
  ]);
  const liftTube = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(liftTubeCurve, 22, 0.018, 8, false)),
    materials.graphiteGasket(),
  );
  condPumpGroup.add(pumpBox, floatCup, liftTube);
  registerPart(
    2,
    condPumpGroup,
    new THREE.Vector3(0.46, -0.68, -0.26),
    new THREE.Vector3(0.95, -0.24, -0.28),
    new THREE.Vector3(0, 0.28, 0),
    new THREE.Vector3(1.65, -0.32, 1.85),
    [pumpMat, floatMat],
    0.26,
  );

  /* ── 04: Flusensieb & Wärmetauscher-Filter ── */
  const filterGroup = new THREE.Group();
  const filterFrameMat = materials.ceruleanPart();
  const finMat = materials.brushedDrum();
  // Heat-exchanger finned cassette (bottom-left slide-out)
  const cassette = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.46, 0.24, 0.54, 0.03, 0.008)),
    finMat,
  );
  const frontGrip = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.48, 0.26, 0.045, 0.025, 0.006)),
    filterFrameMat,
  );
  frontGrip.position.z = 0.28;
  // Curved door lint screen perched above cassette
  const lintScreen = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.36, 0.14, 0.04, 0.03, 0.006)),
    materials.mattePolymer(),
  );
  lintScreen.position.set(0.06, 0.28, 0.22);
  filterGroup.add(cassette, frontGrip, lintScreen);
  registerPart(
    3,
    filterGroup,
    new THREE.Vector3(-0.34, -0.66, 0.24),
    new THREE.Vector3(-0.92, -0.26, 0.62),
    new THREE.Vector3(0, 0.24, 0.18),
    new THREE.Vector3(-1.55, -0.3, 2.05),
    [filterFrameMat, finMat],
  );

  /* ── 05: Feuchtigkeits- & NTC-Temperatursensor ── */
  const sensorGroup = new THREE.Group();
  const sensorBarMat = materials.brightChrome();
  const ntcHeadMat = materials.copperCoil();
  [-0.08, 0.08].forEach((sx) => {
    const strip = new THREE.Mesh(
      trackGeo(createChamferedBoxGeo(0.035, 0.028, 0.28, 0.008, 0.003)),
      sensorBarMat,
    );
    strip.position.set(sx, 0, 0);
    sensorGroup.add(strip);
  });
  const sensorBase = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.28, 0.07, 0.16, 0.02, 0.005)),
    materials.graphiteGasket(),
  );
  sensorBase.position.y = -0.045;
  const ntcProbe = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.022, 0.022, 0.14, 12)),
    ntcHeadMat,
  );
  ntcProbe.position.set(0, 0.05, 0.1);
  sensorGroup.add(sensorBase, ntcProbe);
  registerPart(
    4,
    sensorGroup,
    new THREE.Vector3(0.04, -0.46, 0.42),
    new THREE.Vector3(0.86, -0.18, 0.68),
    new THREE.Vector3(0, 0.14, 0.06),
    new THREE.Vector3(1.45, -0.15, 1.95),
    [sensorBarMat, ntcHeadMat],
    0.24,
  );

  /* ── 06: Türverriegelung, Türhaken & Türdichtung ── */
  const doorGroup = new THREE.Group();
  const doorRingMat = materials.graphiteGasket();
  const latchMat = materials.ceruleanPart();
  const outerRing = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.49, 0.052, 14, 42)),
    materials.brightChrome(),
  );
  const doorSeal = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.45, 0.036, 12, 38)),
    doorRingMat,
  );
  doorSeal.position.z = -0.05;
  const doorGlass = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.44, 0.39, 0.08, 30)),
    materials.frostedGlass(),
  );
  doorGlass.rotation.x = Math.PI / 2;
  doorGlass.renderOrder = 4;
  const latchUnit = new THREE.Mesh(
    trackGeo(createChamferedBoxGeo(0.11, 0.18, 0.09, 0.02, 0.005)),
    latchMat,
  );
  latchUnit.position.set(0.5, 0, -0.06);
  doorGroup.add(outerRing, doorSeal, doorGlass, latchUnit);
  registerPart(
    5,
    doorGroup,
    new THREE.Vector3(0, -0.02, 0.56),
    new THREE.Vector3(0, 0.04, 1.02),
    new THREE.Vector3(0.44, 0.24, 0.06),
    new THREE.Vector3(1.3, 0.3, 2.35),
    [doorRingMat, latchMat],
  );

  /* ── 07: Trommellager, Filzring & Laufrollen (Trocknertrommel) ── */
  const drumGroup = new THREE.Group();
  const drumMat = materials.brushedDrum();
  const rollerMat = materials.ceruleanPart();
  const feltMat = materials.mattePolymer();

  const drumSpin = new THREE.Group();
  const drumCyl = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.46, 0.46, 0.66, 36, 1, true)),
    drumMat,
  );
  drumCyl.rotation.x = Math.PI / 2;
  drumCyl.castShadow = !isSoftwareGl;
  const drumBack = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.45, 0.45, 0.035, 32)),
    drumMat,
  );
  drumBack.rotation.x = Math.PI / 2;
  drumBack.position.z = -0.32;
  const lifterGeo = trackGeo(createChamferedBoxGeo(0.075, 0.06, 0.54, 0.015, 0.005));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const lifter = new THREE.Mesh(lifterGeo, materials.satinSteel());
    lifter.position.set(Math.cos(a) * 0.41, Math.sin(a) * 0.41, 0);
    lifter.rotation.z = a + Math.PI / 2;
    drumSpin.add(lifter);
  }
  drumSpin.add(drumCyl, drumBack);

  // Front felt glide ring (Filzring)
  const feltRing = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.465, 0.026, 10, 36)),
    feltMat,
  );
  feltRing.position.z = 0.33;

  // Dual lower drum support rollers (Laufrollen)
  const rollerGeo = trackGeo(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 18));
  [-0.32, 0.32].forEach((rx) => {
    const r = new THREE.Mesh(rollerGeo, rollerMat);
    r.rotation.x = Math.PI / 2;
    r.position.set(rx, -0.45, 0.24);
    drumGroup.add(r);
  });

  drumGroup.add(drumSpin, feltRing);
  registerPart(
    6,
    drumGroup,
    new THREE.Vector3(0, -0.02, -0.02),
    new THREE.Vector3(0, 0.34, 0.28),
    new THREE.Vector3(0, 0.42, 0.14),
    new THREE.Vector3(1.5, 0.72, 2.3),
    [drumMat, rollerMat, feltMat],
  );

  return {
    id: "trockner",
    root,
    chassisMaterials,
    chassisBaseOpacities,
    edgeMaterials,
    parts,
    allClickables,
    animate: (_elapsed, delta) => {
      drumSpin.rotation.z -= delta * 0.62;
      tensionPulley.rotation.z += delta * 2.4;
    },
  };
}
