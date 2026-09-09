import * as THREE from 'three';

/**
 * Procedural Terrain Height Calculation for Ashen Shoreline & Echo Camp
 * 
 * Geographic Layout:
 * - Center (x: -12..12, z: -8..14): Echo Camp plateau (smooth, gentle terrace y ~ 0.2 to 0.6)
 * - North (z > 20): Slopes down to the sandy beach and tide line (y ~ 0.0 at z=26, y = -0.6 at z=42)
 * - North-West (x: -30..-14, z: -30..-10): Ancient Ruins elevated ridge (y ~ 0.8 to 1.6)
 * - North-East (x: 18..35, z: 8..28): Rocky sea cliffs & Smuggler's Cave (y ~ 1.5 to 3.8)
 * - East (x: 14..32, z: -18..4): Corrupted Twilight Eclipse Fissure (crater basin y ~ -0.4 to 0.4)
 * - South / Inland (z < -12): Coastal bluff with pine slopes and rocky crags (y ~ 1.4 to 4.5)
 */
export function getTerrainHeight(x: number, z: number): number {
  // 1. Base Shoreline Gradient: drops toward the north (ocean is at z ~ 32..50)
  let height = 0.0;

  if (z > 16) {
    // Sloping down to beach and surf
    const beachDist = (z - 16) / 24; // 0 to 1
    height = 0.3 - beachDist * 1.1; // Drops to -0.8 in deep surf
  } else {
    // Rising inland
    const inlandDist = (16 - z) / 45; // 0 to 1
    height = 0.3 + inlandDist * 2.2;
  }

  // 2. Echo Camp Sanctuary Clearing (Flatten gently around origin)
  const distFromCamp = Math.sqrt(x * x + (z - 3) * (z - 3));
  if (distFromCamp < 14) {
    const flattenFactor = 1.0 - (distFromCamp / 14);
    height = height * (1.0 - flattenFactor * 0.75) + 0.35 * flattenFactor;
  }

  // 3. Southern and South-Western Rocky Bluffs
  if (z < -8) {
    const bluffFactor = Math.max(0, (-8 - z) / 25);
    height += bluffFactor * (1.5 + Math.sin(x * 0.15) * 0.6);
  }

  // 4. North-East Sea Cliffs (Cave region)
  if (x > 18 && z > 6) {
    const cliffFactor = Math.min(1.0, (x - 18) / 10) * Math.min(1.0, (z - 6) / 12);
    height += cliffFactor * 2.6 * (1.0 + Math.sin(x * 0.25 + z * 0.2) * 0.25);
  }

  // 5. Eastern Corrupted Fissure Depression
  const distFromCorrupt = Math.sqrt((x - 22) * (x - 22) + (z - (-10)) * (z - (-10)));
  if (distFromCorrupt < 9) {
    const craterT = 1.0 - (distFromCorrupt / 9);
    height -= craterT * 0.85; // sunken impact basin
  }

  // 6. Subtle Organic Sand Dune & Rock Harmonics
  const dune1 = Math.sin(x * 0.09 + 1.2) * Math.cos(z * 0.08 - 0.4) * 0.45;
  const dune2 = Math.sin(x * 0.22 - z * 0.18) * 0.18;
  const dune3 = Math.cos(x * 0.45 + z * 0.35) * 0.06;

  height += dune1 + dune2 + dune3;

  return height;
}

/**
 * Creates the high-fidelity Ashen Shoreline terrain mesh with vertex colors
 * representing wet sand, ashen dry sand, inland rocky moss, and corrupted soil.
 */
export function createAshenShorelineTerrain(): {
  terrainMesh: THREE.Mesh;
  getElevation: (x: number, z: number) => number;
} {
  const sizeX = 140;
  const sizeZ = 140;
  const segmentsX = 96;
  const segmentsZ = 96;

  const geometry = new THREE.PlaneGeometry(sizeX, sizeZ, segmentsX, segmentsZ);
  geometry.rotateX(-Math.PI / 2);

  const posAttr = geometry.attributes.position;
  const colors: number[] = [];

  const colWetSand = new THREE.Color(0x131924);    // dark sheen wet sand
  const colBeachSand = new THREE.Color(0x272c36);  // ashen dark slate coastal sand
  const colCampEarth = new THREE.Color(0x32302b);  // trodden earth and campfire soot
  const colInlandRock = new THREE.Color(0x2d3238);  // weathered highland stone
  const colMossPatch = new THREE.Color(0x242e26);   // salt-tolerant sea moss
  const colCorruptVoid = new THREE.Color(0x1a0f2e); // deep purple abyssal taint

  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);

    // Apply procedural elevation
    const y = getTerrainHeight(x, z);
    posAttr.setY(i, y);

    // Vertex Color Blending based on geography
    let finalColor = colBeachSand.clone();

    // 1. Shoreline / Tide line wet sand
    if (z > 20) {
      const wetT = Math.min(1.0, Math.max(0, (z - 20) / 14));
      finalColor.lerp(colWetSand, wetT * 0.95);
    } 
    // 2. Echo Camp trodden earth
    else if (Math.sqrt(x * x + (z - 3) * (z - 3)) < 12) {
      const campT = Math.max(0, 1.0 - Math.sqrt(x * x + (z - 3) * (z - 3)) / 12);
      finalColor.lerp(colCampEarth, campT * 0.7);
    }
    // 3. Southern Crags & Inland Moss
    else if (z < -8) {
      const rockT = Math.min(1.0, (-8 - z) / 20);
      finalColor.lerp(colInlandRock, rockT);
      if (Math.sin(x * 0.3) * Math.cos(z * 0.3) > 0.2) {
        finalColor.lerp(colMossPatch, 0.45);
      }
    }

    // 4. Corrupted Void Fissure (East)
    const distCorrupt = Math.sqrt((x - 22) * (x - 22) + (z - (-10)) * (z - (-10)));
    if (distCorrupt < 10) {
      const voidT = 1.0 - distCorrupt / 10;
      finalColor.lerp(colCorruptVoid, voidT * 0.9);
    }

    colors.push(finalColor.r, finalColor.g, finalColor.b);
  }

  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.85,
    metalness: 0.12,
    flatShading: false
  });

  const terrainMesh = new THREE.Mesh(geometry, material);
  terrainMesh.name = 'ashen_terrain';
  terrainMesh.receiveShadow = true;

  return {
    terrainMesh,
    getElevation: getTerrainHeight
  };
}

/**
 * Creates dynamic animated ocean water along the northern shoreline.
 */
export function createDynamicOceanWater(): {
  waterGroup: THREE.Group;
  update: (elapsedTime: number) => void;
} {
  const waterGroup = new THREE.Group();
  waterGroup.name = 'ocean_system';

  // Deep Water Body
  const waterGeo = new THREE.PlaneGeometry(160, 50, 48, 24);
  waterGeo.rotateX(-Math.PI / 2);

  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x0a192f,
    emissive: 0x051329,
    emissiveIntensity: 0.3,
    roughness: 0.12,
    metalness: 0.88,
    transparent: true,
    opacity: 0.82
  });

  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.set(0, -0.35, 48);
  waterGroup.add(waterMesh);

  // Shoreline Surf Foam Line
  const foamGeo = new THREE.PlaneGeometry(150, 4.5, 36, 4);
  foamGeo.rotateX(-Math.PI / 2);

  const foamMat = new THREE.MeshBasicMaterial({
    color: 0x93c5fd,
    transparent: true,
    opacity: 0.38,
    side: THREE.DoubleSide
  });

  const foamMesh = new THREE.Mesh(foamGeo, foamMat);
  foamMesh.position.set(0, -0.22, 26);
  waterGroup.add(foamMesh);

  // Animation Update function
  const update = (elapsedTime: number) => {
    // Gentle tide breathing
    const tide = Math.sin(elapsedTime * 0.9) * 0.12;
    waterMesh.position.y = -0.35 + tide;
    foamMesh.position.y = -0.22 + tide * 0.8;
    foamMesh.position.z = 26 + Math.sin(elapsedTime * 0.9) * 1.6;

    // Specular wave undulating displacement
    const pos = waterGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i);
      const w = pos.getZ(i);
      const wave = Math.sin(u * 0.15 + elapsedTime * 1.8) * Math.cos(w * 0.12 + elapsedTime * 1.2) * 0.14;
      pos.setY(i, wave);
    }
    pos.needsUpdate = true;
  };

  return { waterGroup, update };
}

/**
 * Modular Rock & Boulder Library (Weathered Boulders, Cliff Stacks, Beach Stones)
 */
export function createModularRocks(): THREE.Group {
  const rockGroup = new THREE.Group();
  rockGroup.name = 'rock_system';

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x272c35,
    roughness: 0.84,
    metalness: 0.15,
    flatShading: true
  });

  const wetStoneMat = new THREE.MeshStandardMaterial({
    color: 0x161a22,
    roughness: 0.38,
    metalness: 0.35,
    flatShading: true
  });

  const mossStoneMat = new THREE.MeshStandardMaterial({
    color: 0x222a28,
    roughness: 0.92,
    metalness: 0.08,
    flatShading: true
  });

  // Base geometries for variations
  const geoSmall = new THREE.DodecahedronGeometry(0.55, 1);
  const geoMed = new THREE.DodecahedronGeometry(1.35, 1);
  const geoLarge = new THREE.DodecahedronGeometry(2.8, 1);
  const geoCliffStack = new THREE.CylinderGeometry(1.6, 2.4, 7.5, 7);

  // Placement definitions across the Ashen Shoreline
  const rockPlacements = [
    // Beach Water breakers (North)
    { x: -18, z: 28, scale: 2.2, mat: wetStoneMat, geo: geoLarge, rotY: 0.4 },
    { x: -8, z: 32, scale: 1.6, mat: wetStoneMat, geo: geoMed, rotY: 1.2 },
    { x: 12, z: 30, scale: 2.5, mat: wetStoneMat, geo: geoLarge, rotY: 2.1 },
    { x: 26, z: 34, scale: 3.2, mat: wetStoneMat, geo: geoCliffStack, rotY: 0.8 },
    { x: -32, z: 36, scale: 3.8, mat: wetStoneMat, geo: geoCliffStack, rotY: 1.5 },

    // Sea-stacks framing the coastline
    { x: 38, z: 24, scale: 3.6, mat: wetStoneMat, geo: geoCliffStack, rotY: 2.4 },
    { x: 42, z: 16, scale: 4.2, mat: stoneMat, geo: geoCliffStack, rotY: 0.5 },

    // Scattered beach pebbles & small rocks
    { x: -5, z: 18, scale: 0.7, mat: stoneMat, geo: geoSmall, rotY: 0.3 },
    { x: 2, z: 19, scale: 0.9, mat: stoneMat, geo: geoSmall, rotY: 1.7 },
    { x: 8, z: 21, scale: 1.1, mat: stoneMat, geo: geoSmall, rotY: 2.9 },
    { x: -14, z: 17, scale: 0.85, mat: stoneMat, geo: geoSmall, rotY: 0.9 },

    // Camp perimeter natural rock barriers (Defensive sheltering)
    { x: -9.5, z: 2.0, scale: 1.8, mat: mossStoneMat, geo: geoMed, rotY: 0.5 },
    { x: -8.0, z: 8.5, scale: 1.5, mat: mossStoneMat, geo: geoMed, rotY: 1.8 },
    { x: 9.0, z: -4.0, scale: 2.0, mat: mossStoneMat, geo: geoMed, rotY: 2.2 },
    { x: 8.5, z: 6.5, scale: 1.4, mat: mossStoneMat, geo: geoSmall, rotY: 1.1 },

    // Southern Crags & Bluffs (Inland ridge)
    { x: -22, z: -16, scale: 3.4, mat: mossStoneMat, geo: geoLarge, rotY: 0.7 },
    { x: -10, z: -20, scale: 4.0, mat: mossStoneMat, geo: geoLarge, rotY: 1.9 },
    { x: 4, z: -22, scale: 3.6, mat: mossStoneMat, geo: geoLarge, rotY: 2.8 },
    { x: 18, z: -21, scale: 4.2, mat: mossStoneMat, geo: geoLarge, rotY: 0.2 },
    { x: 30, z: -18, scale: 3.8, mat: stoneMat, geo: geoLarge, rotY: 1.4 },

    // Path to Ruins rocks
    { x: -19, z: -8, scale: 2.1, mat: stoneMat, geo: geoMed, rotY: 1.3 },
    { x: -26, z: -12, scale: 2.8, mat: stoneMat, geo: geoMed, rotY: 2.5 }
  ];

  rockPlacements.forEach(p => {
    const rock = new THREE.Mesh(p.geo, p.mat);
    const groundY = getTerrainHeight(p.x, p.z);
    rock.position.set(p.x, groundY + (p.scale * 0.35), p.z);
    rock.scale.set(p.scale, p.scale * (0.8 + Math.random() * 0.4), p.scale);
    rock.rotation.set(0.1, p.rotY, 0.1);
    rock.castShadow = true;
    rock.receiveShadow = true;
    rockGroup.add(rock);
  });

  return rockGroup;
}

/**
 * Modular Vegetation Library (Wind-twisted coastal pines, sea grass, deadwood)
 */
export function createModularVegetation(): THREE.Group {
  const vegGroup = new THREE.Group();
  vegGroup.name = 'vegetation_system';

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x3e2723,
    roughness: 0.9,
    metalness: 0.05
  });

  const pineNeedleMat = new THREE.MeshStandardMaterial({
    color: 0x1c2e24,
    roughness: 0.85,
    metalness: 0.05
  });

  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x3d4a36,
    roughness: 0.92,
    metalness: 0.02,
    side: THREE.DoubleSide
  });

  const dryGrassMat = new THREE.MeshStandardMaterial({
    color: 0x4a4431,
    roughness: 0.95,
    metalness: 0.02,
    side: THREE.DoubleSide
  });

  // Helper to build a twisted wind-swept coastal pine
  const createCoastalPine = (height: number, trunkTilt: number): THREE.Group => {
    const tree = new THREE.Group();

    // Curved Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.18, 0.38, height, 7);
    const trunk = new THREE.Mesh(trunkGeo, woodMat);
    trunk.position.y = height * 0.5;
    trunk.rotation.z = trunkTilt;
    trunk.castShadow = true;
    tree.add(trunk);

    // Tiered Foliage Clusters
    const tiers = 3;
    for (let t = 0; t < tiers; t++) {
      const tierRadius = (1.5 - t * 0.35) * (height / 6);
      const tierGeo = new THREE.ConeGeometry(tierRadius, 1.4, 7);
      const foliage = new THREE.Mesh(tierGeo, pineNeedleMat);
      foliage.position.set(
        Math.sin(-trunkTilt) * (height * 0.45 + t * 1.1),
        height * 0.5 + t * 1.2,
        0
      );
      foliage.rotation.z = trunkTilt * 0.5;
      foliage.castShadow = true;
      tree.add(foliage);
    }

    return tree;
  };

  // Helper to build grass tufts
  const grassBladeGeo = new THREE.PlaneGeometry(0.28, 0.7);
  grassBladeGeo.translate(0, 0.35, 0);

  const createGrassTuft = (isDry: boolean): THREE.Group => {
    const tuft = new THREE.Group();
    const mat = isDry ? dryGrassMat : grassMat;
    for (let b = 0; b < 5; b++) {
      const blade = new THREE.Mesh(grassBladeGeo, mat);
      blade.rotation.y = (b * Math.PI) / 2.5;
      blade.rotation.x = (Math.random() - 0.5) * 0.25;
      tuft.add(blade);
    }
    return tuft;
  };

  // 1. Gnarled Coastal Pines on Inland Ridge (South & Inland)
  const treeLocations = [
    { x: -16, z: -14, h: 6.2, tilt: 0.18 },
    { x: -8, z: -18, h: 7.0, tilt: -0.12 },
    { x: 2, z: -17, h: 6.8, tilt: 0.15 },
    { x: 12, z: -19, h: 7.4, tilt: -0.22 },
    { x: 22, z: -16, h: 5.8, tilt: 0.25 },
    { x: -28, z: -18, h: 6.5, tilt: -0.15 },
    { x: 28, z: -12, h: 6.0, tilt: 0.12 },
    { x: -14, z: -6, h: 5.2, tilt: -0.18 },
    { x: 14, z: -4, h: 5.5, tilt: 0.16 }
  ];

  treeLocations.forEach(t => {
    const pine = createCoastalPine(t.h, t.tilt);
    const groundY = getTerrainHeight(t.x, t.z);
    pine.position.set(t.x, groundY, t.z);
    vegGroup.add(pine);
  });

  // 2. Procedural Coastal Grass Tufts around Camp and Ridges
  const grassCoords = [
    // Near Camp periphery
    { x: -4, z: 9, dry: true },
    { x: -6, z: 6, dry: false },
    { x: 5, z: 8, dry: true },
    { x: 7, z: 4, dry: false },
    { x: -2, z: -4, dry: false },
    { x: 3, z: -3, dry: true },
    // Near Dunes
    { x: -11, z: 15, dry: true },
    { x: -2, z: 16, dry: true },
    { x: 9, z: 14, dry: true },
    { x: 16, z: 12, dry: true },
    // Along Inland Path
    { x: -12, z: -10, dry: false },
    { x: -18, z: -8, dry: false },
    { x: 6, z: -12, dry: false },
    { x: 15, z: -11, dry: false }
  ];

  grassCoords.forEach(c => {
    const tuft = createGrassTuft(c.dry);
    const groundY = getTerrainHeight(c.x, c.z);
    tuft.position.set(c.x, groundY, c.z);
    const sc = 0.8 + Math.random() * 0.5;
    tuft.scale.set(sc, sc, sc);
    vegGroup.add(tuft);
  });

  // 3. Driftwood Logs and Fallen Timber near Shore
  const driftwoodLocations = [
    { x: -7, z: 22, len: 3.2, rotY: 0.6 },
    { x: 6, z: 24, len: 4.1, rotY: 1.9 },
    { x: -16, z: 25, len: 2.8, rotY: 2.7 },
    { x: 18, z: 20, len: 3.5, rotY: 0.4 }
  ];

  driftwoodLocations.forEach(d => {
    const driftGeo = new THREE.CylinderGeometry(0.14, 0.19, d.len, 7);
    driftGeo.rotateZ(Math.PI / 2);
    const drift = new THREE.Mesh(driftGeo, woodMat);
    const groundY = getTerrainHeight(d.x, d.z);
    drift.position.set(d.x, groundY + 0.12, d.z);
    drift.rotation.y = d.rotY;
    drift.castShadow = true;
    vegGroup.add(drift);
  });

  return vegGroup;
}
