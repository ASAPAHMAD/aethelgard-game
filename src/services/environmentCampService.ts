import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { clone as cloneSkinnedScene } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { getTerrainHeight } from './environmentTerrainService';
import {
  loadAnimationAtlas,
  buildSkeletonBoneMap,
  retargetClipToSkeleton
} from './mixamoSkeletonUtils';

export interface InteractiveNpcInfo {
  id: string;
  name: string;
  title: string;
  role?: string;
  position: THREE.Vector3;
  meshGroup: THREE.Group;
}

/**
 * Creates the functional Echo Camp settlement (Tier 1 Base with sockets for higher tiers)
 */
export function createEchoCampSettlement(settlementTier: number = 1): {
  campGroup: THREE.Group;
  campLights: {
    fireLight: THREE.PointLight;
    flameMesh: THREE.Mesh;
    forgeLight?: THREE.PointLight;
  };
  npcs: InteractiveNpcInfo[];
  /**
   * Mixers for any NPC using a real rigged GLB model (see Ganfaul below). Populated
   * asynchronously as each model finishes loading - the caller should keep iterating the
   * same array reference every frame rather than snapshotting it once.
   */
  npcMixers: THREE.AnimationMixer[];
} {
  const campGroup = new THREE.Group();
  const npcMixers: THREE.AnimationMixer[] = [];
  campGroup.name = 'echo_camp';

  // Common PBR Materials
  const timberMat = new THREE.MeshStandardMaterial({
    color: 0x3d2817,
    roughness: 0.88,
    metalness: 0.05
  });

  const plankMat = new THREE.MeshStandardMaterial({
    color: 0x543d2b,
    roughness: 0.82,
    metalness: 0.08
  });

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x2b303a,
    roughness: 0.86,
    metalness: 0.12
  });

  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x1e242d,
    roughness: 0.42,
    metalness: 0.85
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xb4833e,
    roughness: 0.35,
    metalness: 0.82
  });

  const canvasMat = new THREE.MeshStandardMaterial({
    color: 0x78716c,
    roughness: 0.92,
    metalness: 0.02,
    side: THREE.DoubleSide
  });

  const bannerMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.75,
    metalness: 0.2,
    side: THREE.DoubleSide
  });

  const goldBannerTrimMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.3,
    metalness: 0.85
  });

  // ==========================================
  // 1. CENTRAL HEARTH & LOG BENCHES
  // ==========================================
  const hearthGroup = new THREE.Group();
  const hearthX = 0;
  const hearthZ = 2.5;
  const hearthY = getTerrainHeight(hearthX, hearthZ);
  hearthGroup.position.set(hearthX, hearthY, hearthZ);

  // Ash and soot ground patch
  const sootGeo = new THREE.CircleGeometry(2.2, 16);
  sootGeo.rotateX(-Math.PI / 2);
  const sootMat = new THREE.MeshBasicMaterial({
    color: 0x121316,
    transparent: true,
    opacity: 0.75
  });
  const sootMesh = new THREE.Mesh(sootGeo, sootMat);
  sootMesh.position.y = 0.02;
  hearthGroup.add(sootMesh);

  // Hearth Stone Ring (Modular rocks surrounding the fire)
  const numStones = 10;
  const ringRadius = 1.05;
  for (let s = 0; s < numStones; s++) {
    const angle = (s / numStones) * Math.PI * 2;
    const stoneGeo = new THREE.DodecahedronGeometry(0.24, 1);
    const stone = new THREE.Mesh(stoneGeo, stoneMat);
    stone.position.set(Math.cos(angle) * ringRadius, 0.16, Math.sin(angle) * ringRadius);
    stone.rotation.set(Math.random(), Math.random(), Math.random());
    stone.scale.set(1.2, 0.9, 1.1);
    stone.castShadow = true;
    hearthGroup.add(stone);
  }

  // Crosswise Firewood logs
  for (let l = 0; l < 4; l++) {
    const logGeo = new THREE.CylinderGeometry(0.1, 0.13, 1.4, 6);
    logGeo.rotateZ(Math.PI / 2);
    const log = new THREE.Mesh(logGeo, timberMat);
    log.position.set(0, 0.18 + l * 0.07, 0);
    log.rotation.y = (l * Math.PI) / 4 + 0.3;
    log.castShadow = true;
    hearthGroup.add(log);
  }

  // Glowing Embers
  const emberGeo = new THREE.SphereGeometry(0.45, 8, 8);
  const emberMat = new THREE.MeshBasicMaterial({ color: 0xea580c });
  const emberMesh = new THREE.Mesh(emberGeo, emberMat);
  emberMesh.position.set(0, 0.22, 0);
  emberMesh.scale.set(1.3, 0.5, 1.3);
  hearthGroup.add(emberMesh);

  // Central Fire Light
  const fireLight = new THREE.PointLight(0xf59e0b, 3.8, 14, 1.6);
  fireLight.position.set(0, 0.9, 0);
  fireLight.castShadow = true;
  fireLight.shadow.bias = -0.002;
  hearthGroup.add(fireLight);

  // Stylized Flame Mesh
  const flameGeo = new THREE.ConeGeometry(0.42, 1.1, 8);
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
  const flameMesh = new THREE.Mesh(flameGeo, flameMat);
  flameMesh.position.set(0, 0.65, 0);
  hearthGroup.add(flameMesh);

  // Iron Cooking Spit with Hanging Cauldron
  const spitGroup = new THREE.Group();
  const poleLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.4, 6), ironMat);
  poleLeft.position.set(-0.9, 0.7, 0);
  spitGroup.add(poleLeft);

  const poleRight = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.4, 6), ironMat);
  poleRight.position.set(0.9, 0.7, 0);
  spitGroup.add(poleRight);

  const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.0, 6), ironMat);
  crossbar.rotateZ(Math.PI / 2);
  crossbar.position.set(0, 1.35, 0);
  spitGroup.add(crossbar);

  const pot = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 10), ironMat);
  pot.position.set(0, 0.95, 0);
  pot.scale.set(1, 0.8, 1);
  spitGroup.add(pot);

  hearthGroup.add(spitGroup);

  // Split-Log Benches around Hearth
  const benchAngles = [Math.PI * 0.75, -Math.PI * 0.75];
  benchAngles.forEach(ang => {
    const benchGroup = new THREE.Group();
    const benchSeat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.16, 0.5), timberMat);
    benchSeat.position.set(0, 0.38, 0);
    benchSeat.castShadow = true;
    benchGroup.add(benchSeat);

    const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.38, 6), timberMat);
    leg1.position.set(-0.75, 0.19, 0);
    benchGroup.add(leg1);

    const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.38, 6), timberMat);
    leg2.position.set(0.75, 0.19, 0);
    benchGroup.add(leg2);

    const dist = 2.4;
    benchGroup.position.set(Math.cos(ang) * dist, 0, Math.sin(ang) * dist);
    benchGroup.rotation.y = -ang + Math.PI / 2;
    hearthGroup.add(benchGroup);
  });

  campGroup.add(hearthGroup);

  // ==========================================
  // 2. TORVALD'S BLACKSMITH FORGE (East Camp)
  // ==========================================
  const forgeStation = new THREE.Group();
  const forgeX = 6.8;
  const forgeZ = 1.2;
  const forgeY = getTerrainHeight(forgeX, forgeZ);
  forgeStation.position.set(forgeX, forgeY, forgeZ);
  forgeStation.rotation.y = -Math.PI * 0.6;

  // Stone Forge Basin
  const forgeBasin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 1.2), stoneMat);
  forgeBasin.position.set(0, 0.45, 0);
  forgeBasin.castShadow = true;
  forgeStation.add(forgeBasin);

  // Glowing Forge Coals
  const forgeCoals = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.15, 0.8), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
  forgeCoals.position.set(0, 0.95, 0);
  forgeStation.add(forgeCoals);

  const forgeLight = new THREE.PointLight(0xf97316, 2.5, 8);
  forgeLight.position.set(0, 1.2, 0);
  forgeStation.add(forgeLight);

  // Stone Chimney Hood
  const hood = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.5, 4), stoneMat);
  hood.position.set(0, 2.1, 0);
  hood.rotation.y = Math.PI / 4;
  forgeStation.add(hood);

  // Heavy Cast-Iron Anvil on Oak Block
  const oakStump = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.65, 8), timberMat);
  oakStump.position.set(-1.8, 0.325, 0.2);
  oakStump.castShadow = true;
  forgeStation.add(oakStump);

  const anvilBody = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.3, 0.4), ironMat);
  anvilBody.position.set(-1.8, 0.78, 0.2);
  anvilBody.castShadow = true;
  forgeStation.add(anvilBody);

  const anvilHorn = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.42, 6), ironMat);
  anvilHorn.rotateZ(-Math.PI / 2);
  anvilHorn.position.set(-2.35, 0.78, 0.2);
  anvilHorn.castShadow = true;
  forgeStation.add(anvilHorn);

  // Quenching Water Trough
  const trough = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.55, 0.65), timberMat);
  trough.position.set(-1.5, 0.275, -1.2);
  trough.castShadow = true;
  forgeStation.add(trough);

  const waterInTrough = new THREE.Mesh(
    new THREE.PlaneGeometry(1.05, 0.52),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.1, metalness: 0.8 })
  );
  waterInTrough.rotateX(-Math.PI / 2);
  waterInTrough.position.set(-1.5, 0.48, -1.2);
  forgeStation.add(waterInTrough);

  // Weapon Rack with Blades
  const rackFrame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 0.25), timberMat);
  rackFrame.position.set(1.4, 0.6, -0.6);
  rackFrame.castShadow = true;
  forgeStation.add(rackFrame);

  // Stacked Metal Ingots
  for (let i = 0; i < 3; i++) {
    const ingot = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.14, 0.2), ironMat);
    ingot.position.set(-0.7, 0.07 + i * 0.14, 1.2);
    forgeStation.add(ingot);
  }

  campGroup.add(forgeStation);

  // ==========================================
  // 3. MAEVE'S ALCHEMY & HERBALIST LAB (West Camp)
  // ==========================================
  const alchemyStation = new THREE.Group();
  const alchX = -6.2;
  const alchZ = 2.4;
  const alchY = getTerrainHeight(alchX, alchZ);
  alchemyStation.position.set(alchX, alchY, alchZ);
  alchemyStation.rotation.y = Math.PI * 0.45;

  // Timber Workbench
  const alchTable = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.15, 0.9), plankMat);
  alchTable.position.set(0, 0.85, 0);
  alchTable.castShadow = true;
  alchemyStation.add(alchTable);

  const tLeg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.85, 6), timberMat);
  tLeg1.position.set(-0.95, 0.425, 0.35);
  alchemyStation.add(tLeg1);
  const tLeg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.85, 6), timberMat);
  tLeg2.position.set(0.95, 0.425, 0.35);
  alchemyStation.add(tLeg2);
  const tLeg3 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.85, 6), timberMat);
  tLeg3.position.set(-0.95, 0.425, -0.35);
  alchemyStation.add(tLeg3);
  const tLeg4 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.85, 6), timberMat);
  tLeg4.position.set(0.95, 0.425, -0.35);
  alchemyStation.add(tLeg4);

  // Glass Alembic & Phials
  const alembicMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.1,
    metalness: 0.2,
    transparent: true,
    opacity: 0.65
  });
  const alembic = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), alembicMat);
  alembic.position.set(-0.5, 1.05, 0);
  alchemyStation.add(alembic);

  const vialRed = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.22, 6), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
  vialRed.position.set(0.3, 1.02, 0.15);
  alchemyStation.add(vialRed);

  const vialBlue = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.25, 6), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
  vialBlue.position.set(0.45, 1.04, 0.12);
  alchemyStation.add(vialBlue);

  // Open Ancient Tome / Grimoire
  const tome = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.3), new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 }));
  tome.position.set(-0.05, 0.95, 0.05);
  tome.rotation.y = 0.2;
  alchemyStation.add(tome);

  // Drying Herb Rack Frame
  const herbRack = new THREE.Group();
  herbRack.position.set(0, 0, -0.95);
  const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.1, 6), timberMat);
  postL.position.set(-0.9, 1.05, 0);
  herbRack.add(postL);
  const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.1, 6), timberMat);
  postR.position.set(0.9, 1.05, 0);
  herbRack.add(postR);
  const hBar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.9, 6), timberMat);
  hBar.rotateZ(Math.PI / 2);
  hBar.position.set(0, 1.9, 0);
  herbRack.add(hBar);

  // Bundles of drying herbs
  for (let b = -0.6; b <= 0.6; b += 0.4) {
    const bundle = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.38, 5), new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.9 }));
    bundle.position.set(b, 1.6, 0);
    bundle.rotateZ(Math.PI);
    herbRack.add(bundle);
  }
  alchemyStation.add(herbRack);

  // Planter with Glowing Solar Mushrooms
  const planter = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 0.4), stoneMat);
  planter.position.set(-1.4, 0.125, 0.6);
  alchemyStation.add(planter);

  const shroomMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
  for (let m = 0; m < 3; m++) {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), shroomMat);
    cap.scale.set(1, 0.6, 1);
    cap.position.set(-1.5 + m * 0.12, 0.35, 0.6 + (m % 2) * 0.08);
    alchemyStation.add(cap);
  }

  campGroup.add(alchemyStation);

  // ==========================================
  // 4. VARRIC'S QUARTERMASTER STATION (South-East)
  // ==========================================
  const qmStation = new THREE.Group();
  const qmX = 5.5;
  const qmZ = -4.5;
  const qmY = getTerrainHeight(qmX, qmZ);
  qmStation.position.set(qmX, qmY, qmZ);
  qmStation.rotation.y = -Math.PI * 0.3;

  // Stacked Cargo Crates
  const crateGeo = new THREE.BoxGeometry(0.85, 0.85, 0.85);
  const crate1 = new THREE.Mesh(crateGeo, plankMat);
  crate1.position.set(0, 0.425, 0);
  crate1.castShadow = true;
  qmStation.add(crate1);

  const crate2 = new THREE.Mesh(crateGeo, plankMat);
  crate2.position.set(0.9, 0.425, 0.1);
  crate2.rotation.y = 0.25;
  crate2.castShadow = true;
  qmStation.add(crate2);

  const crate3 = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.75), plankMat);
  crate3.position.set(0.4, 1.15, 0.05);
  crate3.rotation.y = -0.15;
  crate3.castShadow = true;
  qmStation.add(crate3);

  // Barrels
  const barrelGeo = new THREE.CylinderGeometry(0.35, 0.4, 0.95, 8);
  const barrel1 = new THREE.Mesh(barrelGeo, timberMat);
  barrel1.position.set(-1.1, 0.475, 0.4);
  barrel1.castShadow = true;
  qmStation.add(barrel1);

  const barrel2 = new THREE.Mesh(barrelGeo, timberMat);
  barrel2.position.set(-0.8, 0.475, 1.2);
  barrel2.castShadow = true;
  qmStation.add(barrel2);

  // Rope Coils
  const rope = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.08, 6, 12), new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.95 }));
  rope.rotateX(Math.PI / 2);
  rope.position.set(-0.3, 0.06, 0.9);
  qmStation.add(rope);

  // Surveyor Drafting Table with Map
  const mapTable = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.8), plankMat);
  mapTable.position.set(-0.3, 0.8, -1.1);
  mapTable.rotation.y = 0.1;
  mapTable.castShadow = true;
  qmStation.add(mapTable);

  const parchment = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 0.55),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.85 })
  );
  parchment.rotateX(-Math.PI / 2);
  parchment.position.set(-0.3, 0.87, -1.1);
  qmStation.add(parchment);

  const brassCompass = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 8), brassMat);
  brassCompass.position.set(0.1, 0.9, -1.1);
  qmStation.add(brassCompass);

  // Hanging Lantern on Timber Post
  const lanternPost = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.4, 6), timberMat);
  lanternPost.position.set(1.6, 1.2, 0.8);
  qmStation.add(lanternPost);

  const lanternArm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 6), ironMat);
  lanternArm.rotateZ(Math.PI / 2);
  lanternArm.position.set(1.35, 2.3, 0.8);
  qmStation.add(lanternArm);

  const lantern = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16, 0), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
  lantern.position.set(1.1, 2.1, 0.8);
  qmStation.add(lantern);

  const lanternLight = new THREE.PointLight(0xfef08a, 1.8, 6);
  lanternLight.position.set(1.1, 2.1, 0.8);
  qmStation.add(lanternLight);

  campGroup.add(qmStation);

  // ==========================================
  // 5. COMMANDER KAELEN'S POST & TENT (South-West)
  // ==========================================
  const cmdStation = new THREE.Group();
  const cmdX = -4.8;
  const cmdZ = -4.2;
  const cmdY = getTerrainHeight(cmdX, cmdZ);
  cmdStation.position.set(cmdX, cmdY, cmdZ);
  cmdStation.rotation.y = Math.PI * 0.2;

  // Commander's Timber A-Frame Tent
  const tentFrame = new THREE.Mesh(new THREE.ConeGeometry(2.4, 2.6, 4), canvasMat);
  tentFrame.position.set(-1.2, 1.3, -1.5);
  tentFrame.scale.set(1.2, 1, 1.6);
  tentFrame.castShadow = true;
  cmdStation.add(tentFrame);

  // Bedroll inside tent opening
  const bedroll = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.8), new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 }));
  bedroll.position.set(-1.2, 0.06, -0.4);
  cmdStation.add(bedroll);

  // Training Dummy
  const dummyPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.8, 6), timberMat);
  dummyPost.position.set(1.6, 0.9, 0.4);
  dummyPost.castShadow = true;
  cmdStation.add(dummyPost);

  const dummyCrossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 6), timberMat);
  dummyCrossbar.rotateZ(Math.PI / 2);
  dummyCrossbar.position.set(1.6, 1.35, 0.4);
  cmdStation.add(dummyCrossbar);

  const dummyTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.75, 8), new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.95 }));
  dummyTorso.position.set(1.6, 1.25, 0.4);
  dummyTorso.castShadow = true;
  cmdStation.add(dummyTorso);

  const dummyHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.95 }));
  dummyHead.position.set(1.6, 1.75, 0.4);
  cmdStation.add(dummyHead);

  // First Sun Flagpole & Banner
  const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 4.2, 6), timberMat);
  flagPole.position.set(0.6, 2.1, 1.2);
  cmdStation.add(flagPole);

  const banner = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.8), bannerMat);
  banner.position.set(1.05, 3.0, 1.2);
  cmdStation.add(banner);

  const bannerTrim = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.12), goldBannerTrimMat);
  bannerTrim.position.set(1.05, 3.8, 1.21);
  cmdStation.add(bannerTrim);

  // Tactical Map Table
  const tacTable = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.14, 0.8), plankMat);
  tacTable.position.set(0.2, 0.75, -0.4);
  tacTable.castShadow = true;
  cmdStation.add(tacTable);

  campGroup.add(cmdStation);

  // ==========================================
  // 6. FOUNDATION PEGS & SOCKETS (Camp Growth)
  // ==========================================
  // Stockade foundation stakes showing preparedness for Tier 2+
  const stakePositions = [
    { x: -9, z: -8 }, { x: -6, z: -9 }, { x: 6, z: -9 }, { x: 9, z: -8 },
    { x: -10, z: 6 }, { x: 10, z: 6 }
  ];

  stakePositions.forEach(p => {
    const ground = getTerrainHeight(p.x, p.z);
    const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 1.1, 5), timberMat);
    stake.position.set(p.x, ground + 0.45, p.z);
    stake.rotation.z = (Math.random() - 0.5) * 0.18;
    stake.castShadow = true;
    campGroup.add(stake);
  });

  // Tier 2+: Add Palisade Walls
  if (settlementTier >= 2) {
    for (let i = -8; i <= 8; i += 2) {
      if (Math.abs(i) < 2) continue; // Camp main gate
      const ground = getTerrainHeight(i, -9.5);
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 3.2, 7), timberMat);
      log.position.set(i, ground + 1.6, -9.5);
      log.castShadow = true;
      campGroup.add(log);
    }
  }

  // Tier 3+: Solar Beacon Tower
  if (settlementTier >= 3) {
    const towerGround = getTerrainHeight(-8.5, -7.5);
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.4, 8.0, 10), stoneMat);
    tower.position.set(-8.5, towerGround + 4.0, -7.5);
    tower.castShadow = true;
    campGroup.add(tower);

    const beacon = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.85, 0),
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 1.5,
        roughness: 0.1
      })
    );
    beacon.position.set(-8.5, towerGround + 8.8, -7.5);
    campGroup.add(beacon);
  }

  // ==========================================
  // 7. INTERACTIVE 3D CAMP RESIDENTS (NPCs)
  // ==========================================
  const npcs: InteractiveNpcInfo[] = [];

  // Helper to build a stylized humanoid NPC figure
  const createNpcFigure = (
    name: string,
    title: string,
    torsoMat: THREE.Material,
    headMat: THREE.Material,
    accMat: THREE.Material | null
  ): THREE.Group => {
    const npc = new THREE.Group();
    npc.name = `npc_${name.toLowerCase()}`;

    // Legs
    const legGeo = new THREE.BoxGeometry(0.18, 0.75, 0.2);
    const legL = new THREE.Mesh(legGeo, torsoMat);
    legL.position.set(-0.13, 0.375, 0);
    legL.castShadow = true;
    npc.add(legL);

    const legR = new THREE.Mesh(legGeo, torsoMat);
    legR.position.set(0.13, 0.375, 0);
    legR.castShadow = true;
    npc.add(legR);

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.48, 0.68, 0.28);
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.set(0, 1.09, 0);
    torso.castShadow = true;
    npc.add(torso);

    // Head
    const headGeo = new THREE.SphereGeometry(0.19, 12, 12);
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 1.62, 0);
    head.castShadow = true;
    npc.add(head);

    // Optional Accessory (Cape, Pauldron, Apron, etc.)
    if (accMat) {
      const accGeo = new THREE.BoxGeometry(0.42, 0.52, 0.08);
      const acc = new THREE.Mesh(accGeo, accMat);
      acc.position.set(0, 0.95, 0.14);
      acc.castShadow = true;
      npc.add(acc);
    }

    return npc;
  };

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.7 });
  const dwarfSkinMat = new THREE.MeshStandardMaterial({ color: 0xcd825c, roughness: 0.75 });

  // 1. Torvald Bronzepeak (Blacksmith)
  const torvaldGroup = createNpcFigure(
    'Torvald',
    'Blacksmith of the Sunsteel',
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 }), // Brown leather
    dwarfSkinMat,
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 })   // Heavy iron apron
  );
  // Hammer in hand
  const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.26, 0.12), ironMat);
  hammer.position.set(0.32, 0.85, 0.2);
  torvaldGroup.add(hammer);

  const torvaldWorldPos = new THREE.Vector3(5.2, getTerrainHeight(5.2, 1.0), 1.0);
  torvaldGroup.position.copy(torvaldWorldPos);
  torvaldGroup.rotation.y = -Math.PI * 0.4;
  campGroup.add(torvaldGroup);

  npcs.push({
    id: 'torvald',
    name: 'Torvald Bronzepeak',
    title: 'Master Blacksmith',
    role: 'Blacksmith',
    position: torvaldWorldPos,
    meshGroup: torvaldGroup
  });

  // 2. Maeve Sun-Singer (Alchemist & Sage)
  const maeveGroup = createNpcFigure(
    'Maeve',
    'First Sun Scholar',
    new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.8 }), // Mystic blue robe
    skinMat,
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 })  // Solar gold sash
  );
  const maeveWorldPos = new THREE.Vector3(-5.0, getTerrainHeight(-5.0, 2.0), 2.0);
  maeveGroup.position.copy(maeveWorldPos);
  maeveGroup.rotation.y = Math.PI * 0.4;
  campGroup.add(maeveGroup);

  npcs.push({
    id: 'maeve',
    name: 'Maeve Sun-Singer',
    title: 'Aether Scholar',
    role: 'Alchemist & Sage',
    position: maeveWorldPos,
    meshGroup: maeveGroup
  });

  // 3. Varric Thorn (Quartermaster & Scout)
  const varricGroup = createNpcFigure(
    'Varric',
    'Frontier Quartermaster',
    new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.85 }), // Dark scout gear
    skinMat,
    new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.7 })   // Shoulder quiver
  );
  const varricWorldPos = new THREE.Vector3(4.2, getTerrainHeight(4.2, -3.8), -3.8);
  varricGroup.position.copy(varricWorldPos);
  varricGroup.rotation.y = -Math.PI * 0.2;
  campGroup.add(varricGroup);

  npcs.push({
    id: 'varric',
    name: 'Varric Thorn',
    title: 'Quartermaster & Scout',
    role: 'Quartermaster',
    position: varricWorldPos,
    meshGroup: varricGroup
  });

  // 4. Commander Kaelen Drake (At his command post if not leashed to player)
  const kaelenGroup = createNpcFigure(
    'Kaelen',
    'Exiled Commander',
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.75 }), // Steel breastplate
    skinMat,
    new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.8 })                   // Red commander cloak
  );
  const kaelenWorldPos = new THREE.Vector3(-3.6, getTerrainHeight(-3.6, -3.2), -3.2);
  kaelenGroup.position.copy(kaelenWorldPos);
  kaelenGroup.rotation.y = Math.PI * 0.3;
  campGroup.add(kaelenGroup);

  npcs.push({
    id: 'kaelen',
    name: 'Kaelen Drake',
    title: 'Commander of the 3rd Sun-Ward',
    role: 'Commander',
    position: kaelenWorldPos,
    meshGroup: kaelenGroup
  });

  // 5. Ganfaul M. Aure (rigged Mixamo GLB NPC - validates the master-rig animation pipeline
  // on a real skinned character instead of a box-and-sphere placeholder). The primitive
  // figure below is added immediately and stays visible as a fallback; loadGanfaulModel
  // swaps in the real model only once it has fully loaded, rigged, and started animating.
  const ganfaulGroup = createNpcFigure(
    'Ganfaul',
    'Wandering Swordsman',
    new THREE.MeshStandardMaterial({ color: 0x44403c, roughness: 0.85 }),
    skinMat,
    new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.7 })
  );
  const ganfaulWorldPos = new THREE.Vector3(2.0, getTerrainHeight(2.0, 4.5), 4.5);
  ganfaulGroup.position.copy(ganfaulWorldPos);
  ganfaulGroup.rotation.y = -Math.PI * 0.15;
  campGroup.add(ganfaulGroup);

  npcs.push({
    id: 'ganfaul',
    name: 'Ganfaul M. Aure',
    title: 'Wandering Swordsman',
    role: 'Wanderer',
    position: ganfaulWorldPos,
    meshGroup: ganfaulGroup
  });

  loadGanfaulModel(ganfaulGroup, npcMixers);

  return {
    campGroup,
    campLights: {
      fireLight,
      flameMesh,
      forgeLight
    },
    npcs,
    npcMixers
  };
}

const GANFAUL_MODEL_URL = '/assets/characters/ganfaul-m-aure.glb';
// animation-atlas.glb has no true "Breathing Idle" clip - that name only ever existed as the
// remote master rig's own embedded clip (extracted at runtime in animationController.ts), not
// one of the 31 files converted into the shared atlas in scripts/convert-animations-to-glb.mjs.
// "sword and shield idle.fbx" is a real looping standing-idle clip that IS in the atlas.
const GANFAUL_IDLE_CLIP = 'sword and shield idle.fbx';
const GANFAUL_TARGET_HEIGHT = 1.8;

/**
 * Loads the rigged Ganfaul GLB, clones it (SkeletonUtils.clone, since a naive Object3D
 * clone doesn't correctly rebind SkinnedMesh bone references), retargets an idle clip from
 * the shared animation-atlas.glb onto its skeleton, and swaps it in over the primitive
 * placeholder figure already sitting in npcGroup. On any failure the placeholder is left
 * untouched and visible - no broken/invisible NPC.
 */
function loadGanfaulModel(npcGroup: THREE.Group, mixers: THREE.AnimationMixer[]): void {
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('/draco/');
  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  loader.load(
    GANFAUL_MODEL_URL,
    gltf => {
      (async () => {
        const model = cloneSkinnedScene(gltf.scene) as THREE.Group;

        // Auto-scale and ground the model the same way the player's master rig does.
        const bbox = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const scaleFactor = size.y > 0 ? GANFAUL_TARGET_HEIGHT / size.y : 1;
        model.scale.setScalar(scaleFactor);

        const scaledBbox = new THREE.Box3().setFromObject(model);
        const scaledCenter = new THREE.Vector3();
        scaledBbox.getCenter(scaledCenter);
        model.position.x = -scaledCenter.x;
        model.position.z = -scaledCenter.z;
        model.position.y = -scaledBbox.min.y;

        model.traverse(child => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
          }
        });

        const boneMap = buildSkeletonBoneMap(model);
        const mixer = new THREE.AnimationMixer(model);

        const atlas = await loadAnimationAtlas();
        const rawIdleClip = atlas.get(GANFAUL_IDLE_CLIP);
        if (rawIdleClip) {
          const retargeted = retargetClipToSkeleton(rawIdleClip, boneMap, GANFAUL_IDLE_CLIP);
          mixer.clipAction(retargeted).play();
        } else {
          console.warn('[Aethelgard Camp] Idle clip missing from animation atlas; Ganfaul will hold his bind pose.');
        }

        // Swap: hide the primitive placeholder's parts, mount the real rigged model.
        npcGroup.children.forEach(child => {
          child.visible = false;
        });
        npcGroup.add(model);
        mixers.push(mixer);

        console.info('[Aethelgard Camp] Ganfaul rigged model loaded and animating.');
      })().catch(e => {
        console.warn('[Aethelgard Camp] Failed to process Ganfaul model, keeping primitive fallback:', e);
      });
    },
    undefined,
    err => {
      console.warn('[Aethelgard Camp] Failed to load Ganfaul GLB, keeping primitive fallback:', err);
    }
  );
}

/**
 * Creates the Ancient First Sun Ruins & Sunken Sanctum Entrance (North-West)
 */
export function createAncientRuins(): THREE.Group {
  const ruinsGroup = new THREE.Group();
  ruinsGroup.name = 'ancient_ruins';

  const ruinsX = -24;
  const ruinsZ = -16;
  const groundY = getTerrainHeight(ruinsX, ruinsZ);
  ruinsGroup.position.set(ruinsX, groundY, ruinsZ);
  ruinsGroup.rotation.y = Math.PI * 0.25;

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x1e242b,
    roughness: 0.72,
    metalness: 0.25,
    flatShading: true
  });

  const goldRuneMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 0.8,
    roughness: 0.2,
    metalness: 0.85
  });

  // 1. Raised Stone Ceremonial Steps / Dais
  for (let s = 0; s < 3; s++) {
    const stepGeo = new THREE.BoxGeometry(10 - s * 1.5, 0.3, 8 - s * 1.2);
    const step = new THREE.Mesh(stepGeo, stoneMat);
    step.position.set(0, s * 0.3 + 0.15, 0);
    step.receiveShadow = true;
    ruinsGroup.add(step);
  }

  // 2. Fluted Ancient Columns (Two standing, two toppled)
  const colGeo = new THREE.CylinderGeometry(0.7, 0.85, 7.5, 12);
  
  // Left Arch Pillar
  const colL = new THREE.Mesh(colGeo, stoneMat);
  colL.position.set(-3.2, 4.5, 0);
  colL.castShadow = true;
  ruinsGroup.add(colL);

  // Right Arch Pillar
  const colR = new THREE.Mesh(colGeo, stoneMat);
  colR.position.set(3.2, 4.5, 0);
  colR.castShadow = true;
  ruinsGroup.add(colR);

  // Massive Lintel
  const lintelGeo = new THREE.BoxGeometry(8.8, 1.3, 1.6);
  const lintel = new THREE.Mesh(lintelGeo, stoneMat);
  lintel.position.set(0, 8.8, 0);
  lintel.castShadow = true;
  ruinsGroup.add(lintel);

  // First Sun Carved Medallion on Lintel
  const medallion = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.15, 12), goldRuneMat);
  medallion.rotateX(Math.PI / 2);
  medallion.position.set(0, 8.8, 0.85);
  ruinsGroup.add(medallion);

  // Toppled Broken Pillar partially sunken in ground
  const brokenCol = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 4.2, 10), stoneMat);
  brokenCol.position.set(-6.5, 1.2, 2.8);
  brokenCol.rotation.set(0.4, 0.8, 1.2);
  brokenCol.castShadow = true;
  ruinsGroup.add(brokenCol);

  // Glowing Aether Portal to Sunken Sanctum
  const portalGeo = new THREE.PlaneGeometry(5.2, 7.4);
  const portalMat = new THREE.MeshBasicMaterial({
    color: 0x8b5cf6,
    transparent: true,
    opacity: 0.42,
    side: THREE.DoubleSide
  });
  const portal = new THREE.Mesh(portalGeo, portalMat);
  portal.position.set(0, 4.4, 0);
  ruinsGroup.add(portal);

  const portalLight = new THREE.PointLight(0xa855f7, 2.5, 12);
  portalLight.position.set(0, 4.5, 1.2);
  ruinsGroup.add(portalLight);

  return ruinsGroup;
}

/**
 * Creates the Corrupted Twilight Eclipse Incursion Zone (East)
 */
export function createCorruptedEclipseZone(): {
  zoneGroup: THREE.Group;
  update: (elapsedTime: number) => void;
} {
  const zoneGroup = new THREE.Group();
  zoneGroup.name = 'corrupted_eclipse_zone';

  const zoneX = 22;
  const zoneZ = -10;
  const groundY = getTerrainHeight(zoneX, zoneZ);
  zoneGroup.position.set(zoneX, groundY, zoneZ);

  const obsidianMat = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    roughness: 0.25,
    metalness: 0.85,
    flatShading: true
  });

  const voidCrystalMat = new THREE.MeshStandardMaterial({
    color: 0x7c3aed,
    emissive: 0x6d28d9,
    emissiveIntensity: 1.8,
    roughness: 0.15,
    metalness: 0.5
  });

  // 1. Shattered Ancient Wardstone (Split in half by corruption)
  const wardL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4.5, 1.2), obsidianMat);
  wardL.position.set(-1.1, 2.0, 0);
  wardL.rotation.z = -0.22;
  wardL.castShadow = true;
  zoneGroup.add(wardL);

  const wardR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.8, 1.2), obsidianMat);
  wardR.position.set(1.1, 1.7, 0);
  wardR.rotation.z = 0.26;
  wardR.castShadow = true;
  zoneGroup.add(wardR);

  // 2. Void Crystals protruding from fissure
  const crystalGeo = new THREE.OctahedronGeometry(0.7, 0);
  const crystals: THREE.Mesh[] = [];

  const crystalOffsets = [
    { x: 0, y: 1.5, z: 0, sc: 1.4 },
    { x: -1.8, y: 0.8, z: 1.2, sc: 0.9 },
    { x: 1.6, y: 0.7, z: -1.4, sc: 1.1 },
    { x: -0.6, y: 0.5, z: -2.1, sc: 0.8 },
    { x: 2.2, y: 0.6, z: 1.8, sc: 1.0 }
  ];

  crystalOffsets.forEach(c => {
    const cry = new THREE.Mesh(crystalGeo, voidCrystalMat);
    cry.position.set(c.x, c.y, c.z);
    cry.scale.set(c.sc * 0.7, c.sc * 1.5, c.sc * 0.7);
    cry.rotation.set(Math.random(), Math.random(), Math.random());
    zoneGroup.add(cry);
    crystals.push(cry);
  });

  // 3. Pulsating Abyssal Void Rift Light
  const riftLight = new THREE.PointLight(0x9333ea, 3.8, 16, 1.8);
  riftLight.position.set(0, 1.8, 0);
  zoneGroup.add(riftLight);

  // 4. Ground Hazard Ring / Incursion Breach Marker
  const breachRing = new THREE.Mesh(
    new THREE.RingGeometry(1.2, 4.8, 24),
    new THREE.MeshBasicMaterial({ color: 0x581c87, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
  );
  breachRing.rotateX(-Math.PI / 2);
  breachRing.position.y = 0.05;
  zoneGroup.add(breachRing);

  const update = (elapsedTime: number) => {
    // Pulsating rift intensity
    riftLight.intensity = 3.2 + Math.sin(elapsedTime * 4.0) * 0.8;
    breachRing.rotation.z = elapsedTime * 0.15;

    // Hover / breathing crystals
    crystals.forEach((c, idx) => {
      c.rotation.y += 0.01 * (idx % 2 === 0 ? 1 : -1);
    });
  };

  return { zoneGroup, update };
}

/**
 * Creates the Coastal Smuggler's Cave Entrance (North-East Sea Cliff)
 */
export function createCoastalCave(): THREE.Group {
  const caveGroup = new THREE.Group();
  caveGroup.name = 'coastal_cave';

  const caveX = 26;
  const caveZ = 16;
  const groundY = getTerrainHeight(caveX, caveZ);
  caveGroup.position.set(caveX, groundY, caveZ);
  caveGroup.rotation.y = -Math.PI * 0.4;

  const cliffMat = new THREE.MeshStandardMaterial({
    color: 0x1f242d,
    roughness: 0.88,
    metalness: 0.12,
    flatShading: true
  });

  // Natural Overhanging Cave Arch
  const archL = new THREE.Mesh(new THREE.DodecahedronGeometry(3.5, 1), cliffMat);
  archL.position.set(-3.2, 2.5, 0);
  caveGroup.add(archL);

  const archR = new THREE.Mesh(new THREE.DodecahedronGeometry(3.8, 1), cliffMat);
  archR.position.set(3.2, 2.8, 0);
  caveGroup.add(archR);

  const archTop = new THREE.Mesh(new THREE.DodecahedronGeometry(4.2, 1), cliffMat);
  archTop.position.set(0, 5.2, 0);
  caveGroup.add(archTop);

  // Dark Cave Maw / Entrance Plane
  const mawMat = new THREE.MeshBasicMaterial({ color: 0x050811 });
  const maw = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 4.2), mawMat);
  maw.position.set(0, 2.1, -1.2);
  caveGroup.add(maw);

  // Washed-up Smuggler Rowboat Hull
  const boatMat = new THREE.MeshStandardMaterial({ color: 0x422006, roughness: 0.9 });
  const boat = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.65, 3.4), boatMat);
  boat.position.set(-2.5, 0.35, 3.8);
  boat.rotation.set(0.2, 0.6, -0.3);
  boat.castShadow = true;
  caveGroup.add(boat);

  return caveGroup;
}
