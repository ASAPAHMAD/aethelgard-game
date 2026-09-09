import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { 
  CharacterAppearance, 
  CombatArchetype, 
  ClassSpecialization, 
  WeaponType, 
  TransmogSettings 
} from '../types/game';
import { CentralizedAnimationController } from './animationController';
import { AnimationState } from './animationRegistry';

export type CharacterAnimationState = 
  | 'idle'
  | 'walk'
  | 'run'
  | 'sprint'
  | 'attack'
  | 'attack_combo'
  | 'heavy_attack'
  | 'block'
  | 'parry'
  | 'dodge'
  | 'hit'
  | 'stagger'
  | 'death'
  | 'cast'
  | 'skill'
  | 'triumph';

export interface PlayerCharacterSkeleton {
  root: THREE.Group;
  hips: THREE.Group;
  spine: THREE.Group;
  chest: THREE.Group;
  neck: THREE.Group;
  head: THREE.Group;
  leftShoulder: THREE.Group;
  leftUpperArm: THREE.Group;
  leftForearm: THREE.Group;
  leftHand: THREE.Group;
  rightShoulder: THREE.Group;
  rightUpperArm: THREE.Group;
  rightForearm: THREE.Group;
  rightHand: THREE.Group;
  weaponSocket: THREE.Group;
  shieldSocket: THREE.Group;
  leftThigh: THREE.Group;
  leftCalf: THREE.Group;
  leftFoot: THREE.Group;
  rightThigh: THREE.Group;
  rightCalf: THREE.Group;
  rightFoot: THREE.Group;
}

export interface PlayerCharacterMaterials {
  skin: THREE.MeshStandardMaterial;
  hair: THREE.MeshStandardMaterial;
  facialHair: THREE.MeshStandardMaterial;
  eyes: THREE.MeshStandardMaterial;
  leather: THREE.MeshStandardMaterial;
  armorPrimary: THREE.MeshStandardMaterial;
  metalTrim: THREE.MeshStandardMaterial;
  cloth: THREE.MeshStandardMaterial;
  boots: THREE.MeshStandardMaterial;
  blade: THREE.MeshStandardMaterial;
  glow: THREE.MeshStandardMaterial;
}

export interface PlayerCharacterAsset {
  rootGroup: THREE.Group;
  skeleton: PlayerCharacterSkeleton;
  materials: PlayerCharacterMaterials;
  isExternalGLB: boolean;
  isFBXActive: boolean;
  animationController: CentralizedAnimationController;
  activeAnimationState: CharacterAnimationState;
  
  applyAnimationState: (
    state: CharacterAnimationState, 
    elapsedTime: number, 
    delta: number, 
    actionProgress?: number,
    options?: { comboIndex?: number; blendDuration?: number; timeScale?: number }
  ) => void;
  
  updateAppearance: (
    appearance: CharacterAppearance,
    archetype: CombatArchetype,
    specialization?: ClassSpecialization,
    weaponType?: WeaponType,
    transmog?: TransmogSettings
  ) => void;
  
  loadExternalGLB: (url: string) => Promise<boolean>;
  loadMasterFBX: () => Promise<boolean>;
  loadMasterCharacter: (urlOverride?: string) => Promise<boolean>;
  dispose: () => void;
}

// Helper: Procedural Anatomical Humanoid Torso (V-taper, pectoral shelf, abdominal flatness, spine furrow)
function createAnatomicalTorsoGeometry(muscularBuild = 1.0): THREE.BufferGeometry {
  const slices = 24;
  const radialSegments = 32;
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const totalHeight = 0.56;
  const m = Math.max(0.75, Math.min(1.3, muscularBuild));

  for (let i = 0; i <= slices; i++) {
    const t = i / slices;
    const y = t * totalHeight;

    // Proportions calibrated to athletic adult human male
    let rx = 0.185 * m;
    let rz = 0.135;
    let cz = 0.0;

    if (t < 0.22) {
      // Pelvis / iliac crest / lower waist
      rx = (0.195 - t * 0.04) * m;
      rz = 0.138;
      cz = -0.005;
    } else if (t < 0.48) {
      // Athletic tapered waist (clear V-taper)
      const wt = (t - 0.22) / 0.26;
      rx = (0.175 + wt * 0.035) * m;
      rz = 0.125 + wt * 0.02;
      cz = 0.002;
    } else if (t < 0.82) {
      // Ribcage, broad latissimus dorsi, and pectoral shelf
      const ct = (t - 0.48) / 0.34;
      rx = (0.21 + ct * 0.055) * m; // Latissimus V-flare
      rz = 0.145 + ct * 0.045; // Pectoral forward volume
      cz = ct * 0.018;
    } else {
      // Clavicular ridge and trapezius slope to neck
      const st = (t - 0.82) / 0.18;
      rx = (0.265 - st * 0.11) * m;
      rz = 0.185 - st * 0.065;
      cz = 0.015 - st * 0.015;
    }

    for (let j = 0; j <= radialSegments; j++) {
      const theta = (j / radialSegments) * Math.PI * 2;
      const cosTheta = Math.cos(theta);
      const sinTheta = Math.sin(theta);

      let localRx = rx;
      let localRz = rz;

      // Pectoral split and muscular chest curvature
      if (sinTheta > 0.25 && t > 0.52 && t < 0.86) {
        const pecBulge = Math.sin(Math.abs(cosTheta) * Math.PI) * 0.022 * m;
        // Central sternum dip
        const sternumDip = Math.exp(-Math.pow(cosTheta * 5.0, 2)) * 0.012;
        localRz += pecBulge - sternumDip;
      }

      // Abdominal flatness / rectus abdominis plane
      if (sinTheta > 0.4 && t >= 0.22 && t <= 0.52) {
        const lineaAlba = Math.exp(-Math.pow(cosTheta * 4.5, 2)) * 0.008;
        localRz -= lineaAlba;
      }

      // Spinal furrow along back
      if (sinTheta < -0.35) {
        const spineDent = Math.exp(-Math.pow(cosTheta * 4.0, 2)) * 0.016;
        localRz -= spineDent;
      }

      const x = cosTheta * localRx;
      const z = sinTheta * localRz + cz;

      vertices.push(x, y, z);
      uvs.push(j / radialSegments, t);
    }
  }

  for (let i = 0; i < slices; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j;
      const b = (i + 1) * (radialSegments + 1) + j;
      const c = (i + 1) * (radialSegments + 1) + (j + 1);
      const d = i * (radialSegments + 1) + (j + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// Helper: Anatomical Adult Male Head with sculpted jaw, chin, cheekbones, brow ridge, eye sockets, nose & lips
function createAnatomicalHeadGeometry(jawWidth = 1.0): THREE.BufferGeometry {
  const slices = 28;
  const radialSegments = 32;
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Adult human head height (calibrated to ~7.5 - 8 head units total height, avoiding oversized head)
  const headHeight = 0.235;
  const jw = Math.max(0.88, Math.min(1.18, jawWidth));

  for (let i = 0; i <= slices; i++) {
    const t = i / slices;
    // Y from chin (-0.103) to crown (+0.132)
    const y = (t - 0.44) * headHeight;

    let rx = 0.078;
    let rz = 0.094;
    let cz = 0.0;

    if (t < 0.16) {
      // Defined masculine square chin (mental protuberance)
      rx = (0.038 + t * 0.16) * jw;
      rz = 0.052 + t * 0.22;
      cz = 0.034;
    } else if (t < 0.38) {
      // Lower jaw, mouth, and lips
      const mt = (t - 0.16) / 0.22;
      rx = (0.064 + mt * 0.016) * jw;
      rz = 0.082 + mt * 0.014;
      cz = 0.024;
    } else if (t < 0.68) {
      // Cheekbones (zygomatic arch), nasal bridge, and eye orbit cavities
      const bt = (t - 0.38) / 0.30;
      rx = 0.078 + Math.sin(bt * Math.PI) * 0.012;
      rz = 0.094;
      cz = 0.010;
    } else {
      // Cranium / forehead / crown (smooth dome)
      const ct = (t - 0.68) / 0.32;
      rx = 0.078 * Math.cos(ct * Math.PI * 0.46);
      rz = 0.094 * Math.cos(ct * Math.PI * 0.42);
      cz = -0.012 * ct;
    }

    for (let j = 0; j <= radialSegments; j++) {
      const theta = (j / radialSegments) * Math.PI * 2;
      const cosTheta = Math.cos(theta);
      const sinTheta = Math.sin(theta);

      let localRx = rx;
      let localRz = rz;
      let localY = y;

      // Facial sculpting zone (front of head)
      if (sinTheta > 0.35) {
        const frontFacing = (sinTheta - 0.35) / 0.65; // 0 at sides, 1 at direct front

        // 1. Chin & Jaw Angle (t < 0.20)
        if (t < 0.20) {
          // Masculine square chin with subtle vertical cleft
          const chinForward = frontFacing * 0.016;
          const chinCleft = Math.exp(-Math.pow(cosTheta * 12.0, 2)) * 0.0035;
          localRz += chinForward - chinCleft;
        }

        // 2. Lips & Philtrum (t >= 0.24 && t <= 0.38)
        if (t >= 0.24 && t <= 0.38) {
          const mouthT = (t - 0.24) / 0.14;
          // Mentolabial sulcus (indentation below lower lip)
          if (mouthT < 0.25) {
            const indent = frontFacing * 0.008;
            localRz -= indent;
          }
          // Lower lip
          else if (mouthT < 0.55) {
            const lipBulge = frontFacing * Math.sin((mouthT - 0.25) / 0.30 * Math.PI) * 0.014;
            localRz += lipBulge;
          }
          // Upper lip & Cupid's bow
          else {
            const upperLip = frontFacing * Math.sin((mouthT - 0.55) / 0.45 * Math.PI) * 0.012;
            const philtrumDip = Math.exp(-Math.pow(cosTheta * 8.0, 2)) * 0.003;
            localRz += upperLip - philtrumDip;
          }
        }

        // 3. Nose Bridge, Tip & Alar Wings (t >= 0.38 && t <= 0.58)
        if (t >= 0.38 && t <= 0.58) {
          const noseT = (t - 0.38) / 0.20;
          const noseCenter = Math.exp(-Math.pow(cosTheta * 9.0, 2));

          const tipProfile = Math.sin(noseT * Math.PI);
          const noseOut = noseCenter * (0.014 + tipProfile * 0.024) * frontFacing;
          localRz += noseOut;

          // Alar wings (nostril flares)
          const alarProfile = Math.exp(-Math.pow((Math.abs(cosTheta) - 0.18) * 10.0, 2));
          if (noseT < 0.45) {
            localRz += alarProfile * 0.009 * frontFacing;
          }
        }

        // 4. Eye Socket Cavities & Orbital Rims (t >= 0.48 && t <= 0.64)
        if (t >= 0.48 && t <= 0.64) {
          const eyeOrbitX = Math.abs(cosTheta);
          if (eyeOrbitX > 0.18 && eyeOrbitX < 0.62) {
            const socketCavity = Math.sin(((eyeOrbitX - 0.18) / 0.44) * Math.PI) * 0.012 * frontFacing;
            localRz -= socketCavity;
          }
        }

        // 5. Zygomatic Cheekbones (t >= 0.44 && t <= 0.58, sides)
        if (t >= 0.44 && t <= 0.58) {
          const cheekZone = Math.abs(cosTheta);
          if (cheekZone > 0.45 && cheekZone < 0.85) {
            const cheekProminence = Math.sin(((cheekZone - 0.45) / 0.40) * Math.PI) * 0.008;
            localRx += cheekProminence;
            localRz += cheekProminence * 0.5;
          }
        }

        // 6. Supraorbital Brow Ridge & Glabella (t >= 0.60 && t <= 0.72)
        if (t >= 0.60 && t <= 0.72) {
          const browT = (t - 0.60) / 0.12;
          const browRidge = Math.sin(browT * Math.PI) * 0.016 * frontFacing;
          localRz += browRidge;
          const glabella = Math.exp(-Math.pow(cosTheta * 5.0, 2)) * 0.008 * frontFacing;
          localRz += glabella;
        }
      }

      const x = cosTheta * localRx;
      const z = sinTheta * localRz + cz;

      vertices.push(x, localY, z);
      uvs.push(j / radialSegments, t);
    }
  }

  for (let i = 0; i < slices; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j;
      const b = (i + 1) * (radialSegments + 1) + j;
      const c = (i + 1) * (radialSegments + 1) + (j + 1);
      const d = i * (radialSegments + 1) + (j + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// Helper: Sculpted Ear (Helix, Antihelix, Concha bowl, Lobule)
function createDetailedEar(skinMat: THREE.Material): THREE.Group {
  const earGroup = new THREE.Group();

  // Outer Helix curve
  const helixGeo = new THREE.TorusGeometry(0.018, 0.005, 8, 14, Math.PI * 1.3);
  const helix = new THREE.Mesh(helixGeo, skinMat);
  helix.rotation.z = -Math.PI * 0.2;
  earGroup.add(helix);

  // Concha bowl & backing
  const conchaGeo = new THREE.CylinderGeometry(0.012, 0.008, 0.006, 10);
  conchaGeo.rotateZ(Math.PI / 2);
  const concha = new THREE.Mesh(conchaGeo, skinMat);
  concha.position.set(-0.003, -0.003, 0.002);
  earGroup.add(concha);

  // Earlobe
  const lobeGeo = new THREE.SphereGeometry(0.007, 8, 8);
  lobeGeo.scale(0.8, 1.2, 0.7);
  const lobe = new THREE.Mesh(lobeGeo, skinMat);
  lobe.position.set(-0.004, -0.018, 0);
  earGroup.add(lobe);

  return earGroup;
}

// Helper: Detailed Anatomical Eye
function createDetailedEye(
  irisColorHex: string,
  glowActive = false
): THREE.Group {
  const eyeGroup = new THREE.Group();

  // 1. Sclera
  const scleraGeo = new THREE.SphereGeometry(0.015, 12, 12);
  const scleraMat = new THREE.MeshStandardMaterial({
    color: 0xe5e7eb,
    roughness: 0.3,
    metalness: 0.02
  });
  const sclera = new THREE.Mesh(scleraGeo, scleraMat);
  eyeGroup.add(sclera);

  // 2. Iris
  const irisGeo = new THREE.CircleGeometry(0.0075, 16);
  const irisMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(irisColorHex),
    roughness: 0.2,
    metalness: 0.1,
    emissive: glowActive ? new THREE.Color(irisColorHex).multiplyScalar(0.7) : new THREE.Color(0x000000),
    emissiveIntensity: glowActive ? 0.9 : 0.0
  });
  const iris = new THREE.Mesh(irisGeo, irisMat);
  iris.position.set(0, 0, 0.0142);
  eyeGroup.add(iris);

  // 3. Pupil
  const pupilGeo = new THREE.CircleGeometry(0.0038, 12);
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
  const pupil = new THREE.Mesh(pupilGeo, pupilMat);
  pupil.position.set(0, 0, 0.0145);
  eyeGroup.add(pupil);

  // 4. Catchlight
  const catchlightGeo = new THREE.CircleGeometry(0.0014, 8);
  const catchlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
  const catchlight = new THREE.Mesh(catchlightGeo, catchlightMat);
  catchlight.position.set(0.0022, 0.0022, 0.0147);
  eyeGroup.add(catchlight);

  return eyeGroup;
}

// Helper: Muscular Anatomical Limb Segment (Thigh, Calf, Arm, Forearm)
function createAnatomicalLimbGeometry(
  topRadius: number,
  midRadius: number,
  bottomRadius: number,
  length: number,
  isLeg = false
): THREE.BufferGeometry {
  const slices = 10;
  const radialSegments = 16;
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= slices; i++) {
    const t = i / slices;
    const y = -t * length;

    // Muscular contour: bulges in the upper-mid section
    let r = topRadius;
    if (t < 0.5) {
      r = THREE.MathUtils.lerp(topRadius, midRadius, t * 2);
    } else {
      r = THREE.MathUtils.lerp(midRadius, bottomRadius, (t - 0.5) * 2);
    }

    for (let j = 0; j <= radialSegments; j++) {
      const theta = (j / radialSegments) * Math.PI * 2;
      let rx = r;
      let rz = r;

      if (isLeg) {
        // Quadricep / gastrocnemius muscular shape: deeper in Z, flatter in X
        rz = r * 1.15;
        rx = r * 0.92;
      }

      const x = Math.cos(theta) * rx;
      const z = Math.sin(theta) * rz;

      vertices.push(x, y, z);
      uvs.push(j / radialSegments, t);
    }
  }

  for (let i = 0; i < slices; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j;
      const b = (i + 1) * (radialSegments + 1) + j;
      const c = (i + 1) * (radialSegments + 1) + (j + 1);
      const d = i * (radialSegments + 1) + (j + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// Helper: Anatomically Proportioned Hand with articulated fingers, thenar muscle, and knuckles
function createHumanHand(skinMat: THREE.Material, isLeft = false): THREE.Group {
  const hand = new THREE.Group();

  // 1. Contoured Metacarpal Palm (calibrated to ~0.06m width for adult human male)
  const palmGeo = new THREE.BoxGeometry(0.058, 0.072, 0.024);
  const palm = new THREE.Mesh(palmGeo, skinMat);
  palm.position.set(0, -0.036, 0);
  palm.castShadow = true;
  hand.add(palm);

  // 2. Thenar Muscle Eminence (Base of thumb)
  const thenarGeo = new THREE.SphereGeometry(0.015, 8, 8);
  thenarGeo.scale(0.9, 1.3, 0.8);
  const thenar = new THREE.Mesh(thenarGeo, skinMat);
  const thumbSign = isLeft ? -1 : 1;
  thenar.position.set(0.026 * thumbSign, -0.026, 0.007);
  hand.add(thenar);

  // 3. Articulated Thumb (Metacarpal & Phalanx curved into natural weapon grip)
  const thumbProxGeo = new THREE.CylinderGeometry(0.009, 0.010, 0.026, 8);
  const thumbProx = new THREE.Mesh(thumbProxGeo, skinMat);
  thumbProx.position.set(0.034 * thumbSign, -0.042, 0.012);
  thumbProx.rotation.z = -0.42 * thumbSign;
  thumbProx.rotation.x = 0.32;
  hand.add(thumbProx);

  const thumbDistGeo = new THREE.CylinderGeometry(0.008, 0.009, 0.022, 8);
  const thumbDist = new THREE.Mesh(thumbDistGeo, skinMat);
  thumbDist.position.set(0.043 * thumbSign, -0.058, 0.018);
  thumbDist.rotation.z = -0.62 * thumbSign;
  thumbDist.rotation.x = 0.52;
  hand.add(thumbDist);

  // 4. Four Curled Fingers (Index, Middle, Ring, Pinky in relaxed weapon-ready grip)
  const fingerLengths = [0.035, 0.038, 0.036, 0.029];
  const fingerWidths = [0.011, 0.012, 0.011, 0.0095];
  const fingerXOffsets = [-0.019, -0.006, 0.006, 0.019];

  for (let f = 0; f < 4; f++) {
    const fingerGroup = new THREE.Group();
    fingerGroup.position.set(fingerXOffsets[f] * thumbSign, -0.068, 0.003);

    const pGeo = new THREE.CylinderGeometry(fingerWidths[f] * 0.9, fingerWidths[f], fingerLengths[f] * 0.55, 8);
    const pMesh = new THREE.Mesh(pGeo, skinMat);
    pMesh.position.set(0, -fingerLengths[f] * 0.25, 0);
    pMesh.rotation.x = 0.42;
    fingerGroup.add(pMesh);

    const dGeo = new THREE.CylinderGeometry(fingerWidths[f] * 0.75, fingerWidths[f] * 0.9, fingerLengths[f] * 0.48, 8);
    const dMesh = new THREE.Mesh(dGeo, skinMat);
    dMesh.position.set(0, -fingerLengths[f] * 0.56, 0.009);
    dMesh.rotation.x = 0.92;
    fingerGroup.add(dMesh);

    hand.add(fingerGroup);
  }

  return hand;
}

// Helper: Anatomical Adventurer Boot with contoured ankle, welt seam, and lugged combat tread
function createAdventurerBoot(
  leatherMat: THREE.Material,
  metalTrimMat: THREE.Material
): THREE.Group {
  const bootGroup = new THREE.Group();

  // 1. Boot Shaft / Upper Calf (fits calf naturally)
  const shaftGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.20, 16);
  const shaft = new THREE.Mesh(shaftGeo, leatherMat);
  shaft.position.set(0, 0.10, 0);
  shaft.castShadow = true;
  bootGroup.add(shaft);

  // 2. Folded Combat Leather Cuff with buckle strap
  const cuffGeo = new THREE.CylinderGeometry(0.072, 0.067, 0.065, 16);
  const cuff = new THREE.Mesh(cuffGeo, leatherMat);
  cuff.position.set(0, 0.18, 0);
  bootGroup.add(cuff);

  const strapGeo = new THREE.TorusGeometry(0.072, 0.005, 8, 20);
  const strap = new THREE.Mesh(strapGeo, metalTrimMat);
  strap.rotation.x = Math.PI / 2;
  strap.position.set(0, 0.17, 0);
  bootGroup.add(strap);

  // 3. Foot Vamp & Instep Arch (natural human male foot proportions: 0.22m length, 0.088m width)
  const vampGeo = new THREE.BoxGeometry(0.088, 0.075, 0.19);
  const vamp = new THREE.Mesh(vampGeo, leatherMat);
  vamp.position.set(0, 0.042, 0.050);
  vamp.castShadow = true;
  bootGroup.add(vamp);

  // Toe box curve
  const toeGeo = new THREE.SphereGeometry(0.045, 12, 10, 0, Math.PI);
  toeGeo.scale(0.95, 0.72, 1.15);
  const toe = new THREE.Mesh(toeGeo, leatherMat);
  toe.rotation.x = -Math.PI / 2;
  toe.position.set(0, 0.035, 0.138);
  bootGroup.add(toe);

  // Stitched Welt Seam (Trim ridge between upper leather and sole)
  const weltGeo = new THREE.BoxGeometry(0.096, 0.012, 0.22);
  const weltMat = new THREE.MeshStandardMaterial({ color: 0x1f1712, roughness: 0.85 });
  const welt = new THREE.Mesh(weltGeo, weltMat);
  welt.position.set(0, 0.024, 0.052);
  bootGroup.add(welt);

  // 4. Lugged Combat Sole & Deep Heel Block
  const soleGeo = new THREE.BoxGeometry(0.098, 0.022, 0.23);
  const soleMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.95 });
  const sole = new THREE.Mesh(soleGeo, soleMat);
  sole.position.set(0, 0.011, 0.052);
  bootGroup.add(sole);

  // Sturdy Heel Block
  const heelGeo = new THREE.BoxGeometry(0.096, 0.030, 0.072);
  const heel = new THREE.Mesh(heelGeo, soleMat);
  heel.position.set(0, 0.015, -0.024);
  bootGroup.add(heel);

  return bootGroup;
}

// Master Humanoid Character Builder
export function createHumanoidPlayerCharacter(
  appearance: CharacterAppearance,
  archetype: CombatArchetype,
  specialization?: ClassSpecialization,
  weaponType?: WeaponType,
  transmog?: TransmogSettings
): PlayerCharacterAsset {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'player_character_root';

  const {
    height = 1.0,
    muscularBuild = 1.0,
    skinTone = '#d4a373',
    hairColor = '#2d1e18',
    hairStyle = 'Warrior Braids',
    eyeColor = '#3b2416',
    fantasyEyeGlow = true,
    facialHair = 'Trimmed Stubble',
    origin = 'sol_vaelen'
  } = appearance;

  const baseScale = height * 0.98;
  const m = muscularBuild;

  // Derive Archetype Theme Colors (Grounded dark high-fantasy)
  let armorColor = 0x27272a;
  let trimColor = 0xd4af37;
  let leatherColor = 0x3d271d;
  let clothColor = 0x1c1917;

  if (archetype === 'vanguard') {
    armorColor = 0x334155; // Tempered slate steel
    trimColor = 0xeab308; // First Sun radiant gold
    leatherColor = 0x452317;
  } else if (archetype === 'spellblade') {
    armorColor = 0x1e1b4b; // Midnight aetherium
    trimColor = 0x38bdf8; // Aether cyan
    leatherColor = 0x2b1d38;
  } else if (archetype === 'shadowstrider') {
    armorColor = 0x171717; // Shadow leather & dark steel
    trimColor = 0xa855f7; // Umbral violet
    leatherColor = 0x1f1f23;
  } else if (archetype === 'solarwarden') {
    armorColor = 0x475569; // Polished dawn silver
    trimColor = 0xf59e0b; // Solar amber
    leatherColor = 0x3b2417;
  }

  // Cultural Origin Color Accents
  if (origin === 'ashen_reefbound') {
    trimColor = 0x2dd4bf;
    leatherColor = 0x1e293b;
  } else if (origin === 'ironwood_weaver') {
    trimColor = 0x84cc16;
    leatherColor = 0x27272a;
  } else if (origin === 'umbral_pariah') {
    trimColor = 0xc084fc;
    leatherColor = 0x0f0e17;
  }

  // Shared Core Materials (Physically-calibrated dark high-fantasy PBR materials)
  const materials: PlayerCharacterMaterials = {
    skin: new THREE.MeshStandardMaterial({
      color: new THREE.Color(skinTone),
      roughness: 0.64,
      metalness: 0.04
    }),
    hair: new THREE.MeshStandardMaterial({
      color: new THREE.Color(hairColor),
      roughness: 0.72,
      metalness: 0.14
    }),
    facialHair: new THREE.MeshStandardMaterial({
      color: new THREE.Color(hairColor),
      roughness: 0.82,
      metalness: 0.06
    }),
    eyes: new THREE.MeshStandardMaterial({
      color: new THREE.Color(eyeColor),
      emissive: fantasyEyeGlow ? new THREE.Color(eyeColor) : new THREE.Color(0x000000),
      emissiveIntensity: fantasyEyeGlow ? 0.8 : 0.0,
      roughness: 0.15,
      metalness: 0.1
    }),
    leather: new THREE.MeshStandardMaterial({
      color: leatherColor,
      roughness: 0.78,
      metalness: 0.06
    }),
    armorPrimary: new THREE.MeshStandardMaterial({
      color: armorColor,
      roughness: 0.34,
      metalness: 0.88
    }),
    metalTrim: new THREE.MeshStandardMaterial({
      color: trimColor,
      roughness: 0.24,
      metalness: 0.92,
      emissive: new THREE.Color(trimColor).multiplyScalar(0.12)
    }),
    cloth: new THREE.MeshStandardMaterial({
      color: clothColor,
      roughness: 0.92,
      metalness: 0.02
    }),
    boots: new THREE.MeshStandardMaterial({
      color: 0x221711,
      roughness: 0.82,
      metalness: 0.06
    }),
    blade: new THREE.MeshStandardMaterial({
      color: 0xedf2f7,
      metalness: 0.94,
      roughness: 0.18,
      emissive: new THREE.Color(trimColor).multiplyScalar(0.15)
    }),
    glow: new THREE.MeshStandardMaterial({
      color: trimColor,
      emissive: trimColor,
      emissiveIntensity: 1.2,
      roughness: 0.1
    })
  };

  // Build SKELETAL JOINT HIERARCHY
  // 1. Hips (Pelvis)
  const hips = new THREE.Group();
  hips.name = 'bone_hips';
  hips.position.set(0, 0.92 * baseScale, 0);
  rootGroup.add(hips);

  // Anatomical Pelvis Mesh
  const pelvisGeo = new THREE.CylinderGeometry(0.20 * m, 0.17 * m, 0.16, 16);
  const pelvisMesh = new THREE.Mesh(pelvisGeo, materials.armorPrimary);
  pelvisMesh.position.y = -0.06;
  pelvisMesh.castShadow = true;
  hips.add(pelvisMesh);

  // Layered Adventurer Belt with First Sun Buckle & Utility Pouches
  const beltGeo = new THREE.TorusGeometry(0.21 * m, 0.035, 12, 24);
  const beltMesh = new THREE.Mesh(beltGeo, materials.leather);
  beltMesh.rotation.x = Math.PI / 2;
  beltMesh.position.y = 0.02;
  hips.add(beltMesh);

  // First Sun Golden Medallion Buckle
  const buckleGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.02, 16);
  buckleGeo.rotateX(Math.PI / 2);
  const buckleMesh = new THREE.Mesh(buckleGeo, materials.metalTrim);
  buckleMesh.position.set(0, 0.02, 0.22 * m);
  hips.add(buckleMesh);

  // Utility Pouch (Adventurer Equipment)
  const pouchGeo = new THREE.BoxGeometry(0.08, 0.09, 0.05);
  const pouchMesh = new THREE.Mesh(pouchGeo, materials.leather);
  pouchMesh.position.set(0.18 * m, 0.0, 0.12 * m);
  pouchMesh.rotation.y = -0.5;
  hips.add(pouchMesh);

  const pouch2Mesh = new THREE.Mesh(pouchGeo, materials.leather);
  pouch2Mesh.position.set(-0.18 * m, 0.0, 0.12 * m);
  pouch2Mesh.rotation.y = 0.5;
  hips.add(pouch2Mesh);

  // 2. Spine & Mid-Torso
  const spine = new THREE.Group();
  spine.name = 'bone_spine';
  spine.position.set(0, 0.06, 0);
  hips.add(spine);

  // 3. Chest (Upper Torso & Shoulders)
  const chest = new THREE.Group();
  chest.name = 'bone_chest';
  chest.position.set(0, 0.16, 0);
  spine.add(chest);

  // Anatomical Humanoid Muscular Torso
  const torsoGeo = createAnatomicalTorsoGeometry(m);
  const torsoMesh = new THREE.Mesh(torsoGeo, materials.armorPrimary);
  torsoMesh.position.set(0, -0.04, 0);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  chest.add(torsoMesh);

  // Layered Dark Leather Undershirt / Gambeson Collar
  const gambesonGeo = new THREE.CylinderGeometry(0.12 * m, 0.18 * m, 0.12, 16);
  const gambesonMesh = new THREE.Mesh(gambesonGeo, materials.leather);
  gambesonMesh.position.set(0, 0.48, 0);
  chest.add(gambesonMesh);

  // First Sun Chest Emblem (Insignia of the First Sun)
  const crestGeo = new THREE.CylinderGeometry(0.075 * m, 0.075 * m, 0.02, 16);
  crestGeo.rotateX(Math.PI / 2);
  const crestMesh = new THREE.Mesh(crestGeo, materials.metalTrim);
  crestMesh.position.set(0, 0.38, 0.19 * m);
  chest.add(crestMesh);

  // 4. Neck & Head
  const neck = new THREE.Group();
  neck.name = 'bone_neck';
  neck.position.set(0, 0.55, 0);
  chest.add(neck);

    const neckGeo = new THREE.CylinderGeometry(0.065 * m, 0.076 * m, 0.12, 20);
    const neckMesh = new THREE.Mesh(neckGeo, materials.skin);
    neckMesh.position.set(0, 0.06, 0);
    neckMesh.castShadow = true;
    neck.add(neckMesh);

    // Sternocleidomastoid anatomical muscle bands
    const scmGeo = new THREE.CylinderGeometry(0.010, 0.009, 0.11, 8);
    scmGeo.rotateZ(0.24);
    const leftScm = new THREE.Mesh(scmGeo, materials.skin);
    leftScm.position.set(-0.034 * m, 0.055, 0.038);
    neck.add(leftScm);

    const rightScm = new THREE.Mesh(scmGeo, materials.skin);
    rightScm.rotation.z = -0.48;
    rightScm.position.set(0.034 * m, 0.055, 0.038);
    neck.add(rightScm);

    const head = new THREE.Group();
    head.name = 'bone_head';
    head.position.set(0, 0.12, 0);
    neck.add(head);

    // Anatomical Head Mesh (Jaw, Brow, Nose, Lips sculpted into geometry)
    const headGeo = createAnatomicalHeadGeometry(appearance.jawWidth || 1.0);
    const headMesh = new THREE.Mesh(headGeo, materials.skin);
    headMesh.castShadow = true;
    head.add(headMesh);

    // Anatomically Sculpted Ears
    const leftEar = createDetailedEar(materials.skin);
    leftEar.position.set(-0.076 * m, 0.005, -0.008);
    leftEar.rotation.y = -Math.PI * 0.14;
    head.add(leftEar);

    const rightEar = createDetailedEar(materials.skin);
    rightEar.position.set(0.076 * m, 0.005, -0.008);
    rightEar.rotation.y = Math.PI * 0.14;
    rightEar.scale.x = -1;
    head.add(rightEar);

    // Anatomical Eyes with Sclera, Iris, Pupil, and Corneal Catchlight
    const leftEye = createDetailedEye(eyeColor, fantasyEyeGlow);
    leftEye.position.set(-0.034 * m, 0.012, 0.082);
    leftEye.rotation.y = -0.07;
    head.add(leftEye);

    const rightEye = createDetailedEye(eyeColor, fantasyEyeGlow);
    rightEye.position.set(0.034 * m, 0.012, 0.082);
    rightEye.rotation.y = 0.07;
    head.add(rightEye);

    // Eyebrows with masculine athletic arch
    const browGeo = new THREE.BoxGeometry(0.035, 0.008, 0.014);
    const leftBrow = new THREE.Mesh(browGeo, materials.hair);
    leftBrow.position.set(-0.035 * m, 0.031, 0.088);
    leftBrow.rotation.z = -0.12;
    head.add(leftBrow);

    const rightBrow = new THREE.Mesh(browGeo, materials.hair);
    rightBrow.position.set(0.035 * m, 0.031, 0.088);
    rightBrow.rotation.z = 0.12;
    head.add(rightBrow);

    // Subtle Weathered Scar across the Right Eyebrow
    const scarGeo = new THREE.BoxGeometry(0.005, 0.024, 0.005);
    const scarMat = new THREE.MeshStandardMaterial({
      color: 0x8a4545,
      roughness: 0.82,
      metalness: 0.02
    });
    const scarMesh = new THREE.Mesh(scarGeo, scarMat);
    scarMesh.position.set(0.038 * m, 0.032, 0.091);
    scarMesh.rotation.z = -0.32;
    head.add(scarMesh);

    // Cultural Markings / Runes overlay (if selected)
    if (appearance.culturalMarkings && appearance.culturalMarkings !== 'None') {
      const markGeo = new THREE.PlaneGeometry(0.035, 0.035);
      const markMesh = new THREE.Mesh(markGeo, materials.glow);
      markMesh.position.set(-0.058 * m, 0.01, 0.086);
      markMesh.rotation.y = 0.5;
      head.add(markMesh);
    }

    // Separate Layered Hair Geometry
    const hairGroup = new THREE.Group();
    hairGroup.name = 'hair_group';

    // 1. Hair Base Cranium Volume
    const hairCapGeo = new THREE.SphereGeometry(0.086 * m, 18, 16, 0, Math.PI * 2, 0, Math.PI * 0.58);
    const hairCap = new THREE.Mesh(hairCapGeo, materials.hair);
    hairCap.position.set(0, 0.022, -0.012);
    hairGroup.add(hairCap);

    // 2. Forehead Hairline Fringe & Temple Locks
    for (let f = -3; f <= 3; f++) {
      const lockGeo = new THREE.BoxGeometry(0.022, 0.034, 0.016);
      const lock = new THREE.Mesh(lockGeo, materials.hair);
      lock.position.set(f * 0.016 * m, 0.058 - Math.abs(f) * 0.004, 0.065 - Math.abs(f) * 0.007);
      lock.rotation.x = -0.32;
      lock.rotation.z = -f * 0.07;
      hairGroup.add(lock);
    }

    // 3. Sideburns conforming to temple
    const sideburnGeo = new THREE.BoxGeometry(0.011, 0.042, 0.016);
    const leftSideburn = new THREE.Mesh(sideburnGeo, materials.hair);
    leftSideburn.position.set(-0.074 * m, 0.010, 0.016);
    hairGroup.add(leftSideburn);

    const rightSideburn = new THREE.Mesh(sideburnGeo, materials.hair);
    rightSideburn.position.set(0.074 * m, 0.010, 0.016);
    hairGroup.add(rightSideburn);

    if (hairStyle.includes('Braids') || hairStyle.includes('Flowing')) {
      // Layered adventurer braids & locks falling over back & nape
      const strandGeo = new THREE.CylinderGeometry(0.016, 0.009, 0.28, 8);
      const leftStrand = new THREE.Mesh(strandGeo, materials.hair);
      leftStrand.position.set(-0.062 * m, -0.055, -0.040);
      leftStrand.rotation.z = -0.14;
      leftStrand.rotation.x = -0.12;
      hairGroup.add(leftStrand);

      const rightStrand = new THREE.Mesh(strandGeo, materials.hair);
      rightStrand.position.set(0.062 * m, -0.055, -0.040);
      rightStrand.rotation.z = 0.14;
      rightStrand.rotation.x = -0.12;
      hairGroup.add(rightStrand);

      const backStrand = new THREE.Mesh(strandGeo, materials.hair);
      backStrand.position.set(0, -0.075, -0.072);
      backStrand.rotation.x = -0.22;
      hairGroup.add(backStrand);
    } else if (hairStyle.includes('Knot')) {
      const knotGeo = new THREE.CylinderGeometry(0.030, 0.020, 0.10, 10);
      const knotMesh = new THREE.Mesh(knotGeo, materials.hair);
      knotMesh.position.set(0, 0.11, -0.032);
      knotMesh.rotation.x = -0.3;
      hairGroup.add(knotMesh);

      const knotRingGeo = new THREE.TorusGeometry(0.026, 0.006, 8, 16);
      const knotRing = new THREE.Mesh(knotRingGeo, materials.metalTrim);
      knotRing.position.set(0, 0.08, -0.024);
      hairGroup.add(knotRing);
    } else {
      // Cropped short textured locks
      const shornStrandGeo = new THREE.BoxGeometry(0.026, 0.015, 0.060);
      for (let s = -2; s <= 2; s++) {
        const lock = new THREE.Mesh(shornStrandGeo, materials.hair);
        lock.position.set(s * 0.024 * m, 0.068, 0.022 - Math.abs(s) * 0.007);
        lock.rotation.x = 0.26;
        hairGroup.add(lock);
      }
    }
    head.add(hairGroup);

    // Facial Hair: Short Beard & Mustache conforming to jawline
    if (facialHair && facialHair !== 'None' && facialHair !== 'Clean Shaven') {
      const beardGroup = new THREE.Group();
      // Mustache sculpted along philtrum and upper lip
      const stacheGeo = new THREE.CylinderGeometry(0.009, 0.012, 0.050, 8);
      stacheGeo.rotateZ(Math.PI / 2);
      const stache = new THREE.Mesh(stacheGeo, materials.facialHair);
      stache.position.set(0, -0.036, 0.084);
      beardGroup.add(stache);

      // Jawline & Chin Beard sculpted along mandibular ramus
      const beardGeo = new THREE.CylinderGeometry(0.062 * m, 0.036 * m, 0.085, 14, 1, false, 0, Math.PI);
      beardGeo.rotateX(-0.26);
      const beardMesh = new THREE.Mesh(beardGeo, materials.facialHair);
      beardMesh.position.set(0, -0.068, 0.048);
      beardGroup.add(beardMesh);
      head.add(beardGroup);
    }

  // 5. Left & Right Shoulders / Pauldrons (Athletic human male proportions, not exaggerated)
  const leftShoulder = new THREE.Group();
  leftShoulder.name = 'bone_left_shoulder';
  leftShoulder.position.set(-0.265 * m, 0.48, 0);
  chest.add(leftShoulder);

  const rightShoulder = new THREE.Group();
  rightShoulder.name = 'bone_right_shoulder';
  rightShoulder.position.set(0.265 * m, 0.48, 0);
  chest.add(rightShoulder);

  // Sleek Steel Pauldron Shells with Golden Sun Trims
  const pauldronGeo = new THREE.SphereGeometry(0.098 * m, 16, 12, 0, Math.PI * 1.3, 0, Math.PI * 0.55);
  pauldronGeo.scale(1.1, 0.9, 1.15);

  const leftPauldron = new THREE.Mesh(pauldronGeo, materials.armorPrimary);
  leftPauldron.rotation.z = -0.42;
  leftPauldron.position.set(-0.015, 0.035, 0);
  leftPauldron.castShadow = true;
  leftShoulder.add(leftPauldron);

  const leftPauldronTrim = new THREE.Mesh(
    new THREE.TorusGeometry(0.098 * m, 0.011, 8, 18, Math.PI),
    materials.metalTrim
  );
  leftPauldronTrim.rotation.x = Math.PI / 2;
  leftPauldronTrim.position.set(-0.015, 0.002, 0);
  leftShoulder.add(leftPauldronTrim);

  const rightPauldron = new THREE.Mesh(pauldronGeo, materials.armorPrimary);
  rightPauldron.rotation.z = 0.42;
  rightPauldron.position.set(0.015, 0.035, 0);
  rightPauldron.castShadow = true;
  rightShoulder.add(rightPauldron);

  const rightPauldronTrim = new THREE.Mesh(
    new THREE.TorusGeometry(0.098 * m, 0.011, 8, 18, Math.PI),
    materials.metalTrim
  );
  rightPauldronTrim.rotation.x = Math.PI / 2;
  rightPauldronTrim.position.set(0.015, 0.002, 0);
  rightShoulder.add(rightPauldronTrim);

  // 6. Left Arm Hierarchy (Upper Arm, Forearm, Hand, Shield Socket)
  const leftUpperArm = new THREE.Group();
  leftUpperArm.name = 'bone_left_upper_arm';
  leftUpperArm.position.set(0, 0, 0);
  leftShoulder.add(leftUpperArm);

  const upperArmGeo = createAnatomicalLimbGeometry(0.068 * m, 0.075 * m, 0.058 * m, 0.31);
  const leftUpperArmMesh = new THREE.Mesh(upperArmGeo, materials.leather);
  leftUpperArmMesh.castShadow = true;
  leftUpperArm.add(leftUpperArmMesh);

  const leftForearm = new THREE.Group();
  leftForearm.name = 'bone_left_forearm';
  leftForearm.position.set(0, -0.31, 0);
  leftUpperArm.add(leftForearm);

  const forearmGeo = createAnatomicalLimbGeometry(0.058 * m, 0.066 * m, 0.048 * m, 0.27);
  const leftForearmMesh = new THREE.Mesh(forearmGeo, materials.skin);
  leftForearmMesh.castShadow = true;
  leftForearm.add(leftForearmMesh);

  // Contoured Leather Bracer with First Sun Ingot Ring on Left Forearm
  const bracerGeo = new THREE.CylinderGeometry(0.062 * m, 0.050 * m, 0.16, 16);
  const leftBracer = new THREE.Mesh(bracerGeo, materials.leather);
  leftBracer.position.set(0, -0.13, 0);
  leftBracer.castShadow = true;
  leftForearm.add(leftBracer);

  const leftBracerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.062 * m, 0.007, 8, 18),
    materials.metalTrim
  );
  leftBracerRing.rotation.x = Math.PI / 2;
  leftBracerRing.position.set(0, -0.055, 0);
  leftForearm.add(leftBracerRing);

  const leftHand = new THREE.Group();
  leftHand.name = 'bone_left_hand';
  leftHand.position.set(0, -0.27, 0);
  leftForearm.add(leftHand);
  leftHand.add(createHumanHand(materials.skin, true));

  const shieldSocket = new THREE.Group();
  shieldSocket.name = 'socket_shield';
  shieldSocket.position.set(-0.06, -0.12, 0.08);
  leftForearm.add(shieldSocket);

  // 7. Right Arm Hierarchy (Upper Arm, Forearm, Hand, Weapon Socket)
  const rightUpperArm = new THREE.Group();
  rightUpperArm.name = 'bone_right_upper_arm';
  rightUpperArm.position.set(0, 0, 0);
  rightShoulder.add(rightUpperArm);

  const rightUpperArmMesh = new THREE.Mesh(upperArmGeo, materials.leather);
  rightUpperArmMesh.castShadow = true;
  rightUpperArm.add(rightUpperArmMesh);

  const rightForearm = new THREE.Group();
  rightForearm.name = 'bone_right_forearm';
  rightForearm.position.set(0, -0.31, 0);
  rightUpperArm.add(rightForearm);

  const rightForearmMesh = new THREE.Mesh(forearmGeo, materials.skin);
  rightForearmMesh.castShadow = true;
  rightForearm.add(rightForearmMesh);

  // Right Bracer
  const rightBracer = new THREE.Mesh(bracerGeo, materials.leather);
  rightBracer.position.set(0, -0.13, 0);
  rightBracer.castShadow = true;
  rightForearm.add(rightBracer);

  const rightBracerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.062 * m, 0.007, 8, 18),
    materials.metalTrim
  );
  rightBracerRing.rotation.x = Math.PI / 2;
  rightBracerRing.position.set(0, -0.055, 0);
  rightForearm.add(rightBracerRing);

  const rightHand = new THREE.Group();
  rightHand.name = 'bone_right_hand';
  rightHand.position.set(0, -0.27, 0);
  rightForearm.add(rightHand);
  rightHand.add(createHumanHand(materials.skin, false));

  const weaponSocket = new THREE.Group();
  weaponSocket.name = 'socket_weapon';
  weaponSocket.position.set(0, -0.06, 0.02);
  rightHand.add(weaponSocket);

  // 8. Modular Weapon Attachment
  const activeWep = weaponType || (archetype === 'vanguard' ? 'greatsword' : archetype === 'spellblade' ? 'dual_axes' : archetype === 'shadowstrider' ? 'aether_bow' : 'sword_and_shield');

  if (activeWep === 'greatsword') {
    const swordGroup = new THREE.Group();
    // Steel Blade with Runic Fuller
    const bladeGeo = new THREE.BoxGeometry(0.09, 1.25, 0.024);
    const bladeMesh = new THREE.Mesh(bladeGeo, materials.blade);
    bladeMesh.position.set(0, 0.65, 0);
    bladeMesh.castShadow = true;
    swordGroup.add(bladeMesh);

    // Runic Fuller Core with Golden Sun Radiance
    const fullerGeo = new THREE.BoxGeometry(0.024, 0.95, 0.028);
    const fullerMesh = new THREE.Mesh(fullerGeo, materials.metalTrim);
    fullerMesh.position.set(0, 0.65, 0);
    swordGroup.add(fullerMesh);

    // First Sun Solar Crossguard
    const guardGeo = new THREE.BoxGeometry(0.38, 0.05, 0.065);
    const guardMesh = new THREE.Mesh(guardGeo, materials.metalTrim);
    guardMesh.position.set(0, 0.03, 0);
    swordGroup.add(guardMesh);

    // Leather-wrapped Grip
    const gripGeo = new THREE.CylinderGeometry(0.026, 0.024, 0.28, 12);
    const gripMesh = new THREE.Mesh(gripGeo, materials.leather);
    gripMesh.position.set(0, -0.14, 0);
    swordGroup.add(gripMesh);

    // Faceted Solar Pommel
    const pommelGeo = new THREE.OctahedronGeometry(0.045, 0);
    const pommelMesh = new THREE.Mesh(pommelGeo, materials.metalTrim);
    pommelMesh.position.set(0, -0.28, 0);
    swordGroup.add(pommelMesh);

    weaponSocket.add(swordGroup);
  } else if (activeWep === 'arcane_staff') {
    const staffGroup = new THREE.Group();
    const staffShaftGeo = new THREE.CylinderGeometry(0.028, 0.022, 1.6, 12);
    const staffShaft = new THREE.Mesh(staffShaftGeo, materials.leather);
    staffShaft.position.set(0, 0.5, 0);
    staffGroup.add(staffShaft);

    // Floating / Channeled Solar Aether Focus Crystal
    const crystalGeo = new THREE.OctahedronGeometry(0.14, 0);
    const crystalMesh = new THREE.Mesh(crystalGeo, materials.glow);
    crystalMesh.position.set(0, 1.35, 0);
    staffGroup.add(crystalMesh);

    const cageGeo = new THREE.TorusGeometry(0.12, 0.015, 8, 16);
    const cage = new THREE.Mesh(cageGeo, materials.metalTrim);
    cage.position.set(0, 1.35, 0);
    staffGroup.add(cage);

    weaponSocket.add(staffGroup);
  } else if (activeWep === 'sword_and_shield') {
    // Broadsword in right hand
    const swordGeo = new THREE.BoxGeometry(0.065, 0.85, 0.02);
    const sword = new THREE.Mesh(swordGeo, materials.blade);
    sword.position.set(0, 0.45, 0);
    sword.castShadow = true;
    weaponSocket.add(sword);

    // Tower Shield on left arm socket
    const shieldGeo = new THREE.BoxGeometry(0.44, 0.72, 0.05);
    const shield = new THREE.Mesh(shieldGeo, materials.armorPrimary);
    shield.castShadow = true;

    const sunEmblemGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.06, 16);
    sunEmblemGeo.rotateX(Math.PI / 2);
    const emblem = new THREE.Mesh(sunEmblemGeo, materials.metalTrim);
    shield.add(emblem);

    shieldSocket.add(shield);
  } else {
    // Dual Daggers / Blades
    const daggerGeo = new THREE.BoxGeometry(0.05, 0.55, 0.016);
    const dagger = new THREE.Mesh(daggerGeo, materials.blade);
    dagger.position.set(0, 0.28, 0);
    weaponSocket.add(dagger);
  }

  // 9. Left Leg Hierarchy (Thigh, Knee Poleyn, Calf, Boot)
  const leftThigh = new THREE.Group();
  leftThigh.name = 'bone_left_thigh';
  leftThigh.position.set(-0.138 * m, -0.06, 0);
  hips.add(leftThigh);

  const thighGeo = createAnatomicalLimbGeometry(0.102 * m, 0.114 * m, 0.076 * m, 0.42, true);
  const leftThighMesh = new THREE.Mesh(thighGeo, materials.armorPrimary);
  leftThighMesh.castShadow = true;
  leftThigh.add(leftThighMesh);

  // Knee Guard (Contoured Steel Poleyn with Solar Ingot Trim)
  const poleynGeo = new THREE.SphereGeometry(0.056 * m, 14, 12, 0, Math.PI);
  const leftPoleyn = new THREE.Mesh(poleynGeo, materials.armorPrimary);
  leftPoleyn.rotation.x = -Math.PI / 2;
  leftPoleyn.position.set(0, -0.42, 0.068);
  leftThigh.add(leftPoleyn);

  const poleynTrimGeo = new THREE.TorusGeometry(0.054 * m, 0.006, 8, 16);
  const leftPoleynTrim = new THREE.Mesh(poleynTrimGeo, materials.metalTrim);
  leftPoleynTrim.position.set(0, -0.42, 0.068);
  leftThigh.add(leftPoleynTrim);

  const leftCalf = new THREE.Group();
  leftCalf.name = 'bone_left_calf';
  leftCalf.position.set(0, -0.43, 0);
  leftThigh.add(leftCalf);

  const calfGeo = createAnatomicalLimbGeometry(0.076 * m, 0.082 * m, 0.058 * m, 0.39, true);
  const leftCalfMesh = new THREE.Mesh(calfGeo, materials.armorPrimary);
  leftCalfMesh.castShadow = true;
  leftCalf.add(leftCalfMesh);

  const leftFoot = new THREE.Group();
  leftFoot.name = 'bone_left_foot';
  leftFoot.position.set(0, -0.39, 0);
  leftCalf.add(leftFoot);
  leftFoot.add(createAdventurerBoot(materials.boots, materials.metalTrim));

  // 10. Right Leg Hierarchy (Thigh, Knee Poleyn, Calf, Boot)
  const rightThigh = new THREE.Group();
  rightThigh.name = 'bone_right_thigh';
  rightThigh.position.set(0.138 * m, -0.06, 0);
  hips.add(rightThigh);

  const rightThighMesh = new THREE.Mesh(thighGeo, materials.armorPrimary);
  rightThighMesh.castShadow = true;
  rightThigh.add(rightThighMesh);

  const rightPoleyn = new THREE.Mesh(poleynGeo, materials.armorPrimary);
  rightPoleyn.rotation.x = -Math.PI / 2;
  rightPoleyn.position.set(0, -0.42, 0.068);
  rightThigh.add(rightPoleyn);

  const rightPoleynTrim = new THREE.Mesh(poleynTrimGeo, materials.metalTrim);
  rightPoleynTrim.position.set(0, -0.42, 0.068);
  rightThigh.add(rightPoleynTrim);

  const rightCalf = new THREE.Group();
  rightCalf.name = 'bone_right_calf';
  rightCalf.position.set(0, -0.43, 0);
  rightThigh.add(rightCalf);

  const rightCalfMesh = new THREE.Mesh(calfGeo, materials.armorPrimary);
  rightCalfMesh.castShadow = true;
  rightCalf.add(rightCalfMesh);

  const rightFoot = new THREE.Group();
  rightFoot.name = 'bone_right_foot';
  rightFoot.position.set(0, -0.39, 0);
  rightCalf.add(rightFoot);
  rightFoot.add(createAdventurerBoot(materials.boots, materials.metalTrim));

  // Optional Cloak (Grounded high-fantasy: OFF by default per prompt unless transmog overrides)
  const isCloakVisible = transmog ? transmog.cloakVisible : false;
  if (isCloakVisible) {
    const cloakDye = transmog?.cloakDye || '#451a03';
    const cloakMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(cloakDye),
      roughness: 0.92,
      metalness: 0.05,
      side: THREE.DoubleSide
    });
    const cloakGeo = new THREE.PlaneGeometry(0.58 * m, 1.05, 8, 8);
    const pos = cloakGeo.attributes.position;
    for (let c = 0; c < pos.count; c++) {
      const cy = pos.getY(c);
      pos.setZ(c, -0.06 - (0.5 - cy) * 0.09);
    }
    cloakGeo.computeVertexNormals();

    const cloakMesh = new THREE.Mesh(cloakGeo, cloakMat);
    cloakMesh.name = 'mesh_cloak';
    cloakMesh.position.set(0, 0.42, -0.16 * m);
    cloakMesh.rotation.x = 0.08;
    cloakMesh.castShadow = true;
    chest.add(cloakMesh);
  }

  // Assemble skeleton reference map
  const skeleton: PlayerCharacterSkeleton = {
    root: rootGroup,
    hips,
    spine,
    chest,
    neck,
    head,
    leftShoulder,
    leftUpperArm,
    leftForearm,
    leftHand,
    rightShoulder,
    rightUpperArm,
    rightForearm,
    rightHand,
    weaponSocket,
    shieldSocket,
    leftThigh,
    leftCalf,
    leftFoot,
    rightThigh,
    rightCalf,
    rightFoot
  };

  // Default natural humanoid pose
  leftUpperArm.rotation.x = 0.05;
  leftUpperArm.rotation.z = 0.12;
  leftForearm.rotation.x = -0.18;

  rightUpperArm.rotation.x = -0.22;
  rightUpperArm.rotation.z = -0.15;
  rightForearm.rotation.x = -0.32;

  // Centralized Animation Controller for Mixamo FBX Assets
  const animationController = new CentralizedAnimationController();
  animationController.setClassArchetype(archetype, weaponType);

  // External GLB State Tracking
  let externalModel: THREE.Group | null = null;
  let mixer: THREE.AnimationMixer | null = null;
  const animationActions: { [key: string]: THREE.AnimationAction } = {};
  let currentAction: THREE.AnimationAction | null = null;
  let isExternalGLBActive = false;

  // PROCEDURAL KINEMATIC & RIGGED ANIMATION ENGINE
  const applyAnimationState = (
    state: CharacterAnimationState,
    elapsedTime: number,
    delta: number,
    actionProgress = 0.0,
    options?: { comboIndex?: number; blendDuration?: number; timeScale?: number }
  ) => {
    // 1. If FBX Mixamo Rig is active, dispatch to Centralized Animation Controller
    if (animationController.getIsFBXActive()) {
      let mappedState: AnimationState = 'idle';
      if (state === 'attack' || state === 'attack_combo') {
        mappedState = 'attack';
      } else if (state === 'heavy_attack') {
        mappedState = 'heavy_attack';
      } else if (state === 'hit' || state === 'stagger') {
        mappedState = 'hit_reaction';
      } else if (state === 'skill' || state === 'cast') {
        mappedState = 'cast';
      } else if (state === 'block') {
        mappedState = 'block';
      } else if (state === 'parry') {
        mappedState = 'parry';
      } else if (state === 'dodge') {
        mappedState = 'dodge';
      } else if (state === 'run') {
        mappedState = 'run';
      } else if (state === 'sprint') {
        mappedState = 'sprint';
      } else if (state === 'walk') {
        mappedState = 'walk';
      } else if (state === 'death') {
        mappedState = 'death';
      } else if (state === 'triumph') {
        mappedState = 'triumph';
      } else {
        mappedState = 'idle';
      }

      animationController.transitionTo(mappedState, delta, options);
      animationController.update(delta);
      return;
    }

    // 2. If an external GLB model is loaded, animate via its AnimationMixer or apply procedural motion
    if (isExternalGLBActive) {
      if (mixer) {
        mixer.update(delta);
        const targetClipName = Object.keys(animationActions).find(k => k.toLowerCase().includes(state.toLowerCase()));
        if (targetClipName && animationActions[targetClipName] && currentAction !== animationActions[targetClipName]) {
          const nextAction = animationActions[targetClipName];
          nextAction.reset().fadeIn(0.2).play();
          if (currentAction) currentAction.fadeOut(0.2);
          currentAction = nextAction;
        }
      } else if (externalModel) {
        // Natural procedural idle breathing & motion physics for static Rodin GLBs
        const baseY = (externalModel.userData.baseY as number) ?? 0;
        if (state === 'idle') {
          const breath = Math.sin(elapsedTime * 2.2) * 0.012;
          externalModel.position.y = baseY + breath;
          externalModel.rotation.z = Math.sin(elapsedTime * 1.1) * 0.005;
          externalModel.rotation.x = 0;
        } else if (state === 'run' || state === 'sprint') {
          const runSpeed = state === 'sprint' ? 12.0 : 9.5;
          const bob = Math.abs(Math.sin(elapsedTime * runSpeed)) * 0.04;
          const sway = Math.sin(elapsedTime * (runSpeed / 2)) * 0.02;
          externalModel.position.y = baseY + bob;
          externalModel.rotation.z = sway;
          externalModel.rotation.x = state === 'sprint' ? 0.15 : 0.08;
        } else if (state === 'walk') {
          const bob = Math.abs(Math.sin(elapsedTime * 6.0)) * 0.02;
          externalModel.position.y = baseY + bob;
          externalModel.rotation.z = Math.sin(elapsedTime * 3.0) * 0.01;
          externalModel.rotation.x = 0.04;
        } else if (state === 'attack' || state === 'attack_combo') {
          const slash = Math.sin((actionProgress || 0) * Math.PI);
          externalModel.rotation.y = slash * 0.45;
          externalModel.rotation.x = slash * 0.25;
        } else if (state === 'dodge') {
          externalModel.rotation.x = (actionProgress || 0) * Math.PI * 2;
        } else if (state === 'parry') {
          externalModel.rotation.z = -0.12;
          externalModel.position.y = baseY - 0.04;
        } else {
          externalModel.rotation.set(0, 0, 0);
          externalModel.position.y = baseY;
        }
      }
      return;
    }

    // Reset or blend smoothly
    if (state === 'idle') {
      const breath = Math.sin(elapsedTime * 2.2);
      hips.position.y = 0.92 * baseScale + breath * 0.008;
      spine.rotation.x = breath * 0.015;
      chest.rotation.x = breath * 0.02;
      head.rotation.x = -breath * 0.01;
      head.rotation.y = Math.sin(elapsedTime * 0.8) * 0.04;

      // Relaxed stance
      leftUpperArm.rotation.x = breath * 0.02;
      leftUpperArm.rotation.z = 0.12;
      leftForearm.rotation.x = -0.18;

      rightUpperArm.rotation.x = -0.22 + breath * 0.02;
      rightUpperArm.rotation.z = -0.14;
      rightForearm.rotation.x = -0.32;

      leftThigh.rotation.x = 0.04;
      leftCalf.rotation.x = -0.06;
      rightThigh.rotation.x = -0.04;
      rightCalf.rotation.x = 0.02;
    } else if (state === 'walk') {
      const walkSpeed = 6.0;
      const walkCycle = elapsedTime * walkSpeed;
      const legStride = Math.sin(walkCycle) * 0.55;

      hips.position.y = 0.92 * baseScale + Math.abs(Math.sin(walkCycle * 2)) * 0.03;
      spine.rotation.y = -Math.sin(walkCycle) * 0.08;
      chest.rotation.y = Math.sin(walkCycle) * 0.08;
      chest.rotation.x = 0.06;

      // Alternating leg kinematics
      leftThigh.rotation.x = legStride;
      leftCalf.rotation.x = legStride < 0 ? -Math.abs(legStride) * 1.1 : -0.1;

      rightThigh.rotation.x = -legStride;
      rightCalf.rotation.x = legStride > 0 ? -Math.abs(legStride) * 1.1 : -0.1;

      // Natural opposite arm swings
      leftUpperArm.rotation.x = -legStride * 0.8;
      leftForearm.rotation.x = -0.35;
      rightUpperArm.rotation.x = legStride * 0.8;
      rightForearm.rotation.x = -0.45;
    } else if (state === 'run' || state === 'sprint') {
      const runSpeed = state === 'sprint' ? 12.0 : 9.5;
      const runCycle = elapsedTime * runSpeed;
      const runStride = Math.sin(runCycle) * (state === 'sprint' ? 0.95 : 0.75);

      hips.position.y = 0.92 * baseScale + Math.abs(Math.sin(runCycle * 2)) * 0.05;
      // Forward athletic lean
      spine.rotation.x = state === 'sprint' ? 0.32 : 0.22;
      chest.rotation.x = state === 'sprint' ? 0.15 : 0.1;
      head.rotation.x = -0.15;

      leftThigh.rotation.x = runStride;
      leftCalf.rotation.x = runStride < 0 ? -Math.abs(runStride) * 1.4 : -0.2;

      rightThigh.rotation.x = -runStride;
      rightCalf.rotation.x = runStride > 0 ? -Math.abs(runStride) * 1.4 : -0.2;

      // Powerful arm drive
      leftUpperArm.rotation.x = -runStride * 1.1;
      leftUpperArm.rotation.z = 0.18;
      leftForearm.rotation.x = -0.65;

      rightUpperArm.rotation.x = runStride * 1.1;
      rightUpperArm.rotation.z = -0.2;
      rightForearm.rotation.x = -0.75;
    } else if (state === 'attack' || state === 'attack_combo') {
      // Slashing sword swing combo with follow-through
      const phase = actionProgress; // 0.0 to 1.0
      if (phase < 0.3) {
        // Wind-up
        const t = phase / 0.3;
        chest.rotation.y = -t * 0.55;
        chest.rotation.x = -t * 0.15;
        rightUpperArm.rotation.x = -1.6 - t * 0.8;
        rightUpperArm.rotation.z = -0.4;
        rightForearm.rotation.x = -0.9;
        leftUpperArm.rotation.x = 0.3;
        leftUpperArm.rotation.z = 0.5;
      } else {
        // Downward slash follow-through
        const t = (phase - 0.3) / 0.7;
        chest.rotation.y = -0.55 + t * 1.1;
        chest.rotation.x = 0.25;
        rightUpperArm.rotation.x = -2.4 + t * 2.8;
        rightUpperArm.rotation.z = 0.2;
        rightForearm.rotation.x = -0.3;
        rightHand.rotation.z = t * 0.6;
        leftUpperArm.rotation.x = -0.4;
      }
    } else if (state === 'parry') {
      // Defensive deflection brace
      chest.rotation.y = -0.2;
      chest.rotation.x = 0.08;
      hips.position.y = 0.88 * baseScale;
      leftThigh.rotation.x = 0.25;
      leftCalf.rotation.x = -0.4;
      rightThigh.rotation.x = -0.3;

      leftUpperArm.rotation.x = -0.85;
      leftUpperArm.rotation.z = 0.65;
      leftForearm.rotation.x = -1.1;

      rightUpperArm.rotation.x = -0.65;
      rightUpperArm.rotation.z = -0.35;
      rightForearm.rotation.x = -0.9;
    } else if (state === 'dodge') {
      // Smooth dynamic roll
      const rollAngle = actionProgress * Math.PI * 2;
      hips.position.y = (0.55 + Math.sin(actionProgress * Math.PI) * 0.25) * baseScale;
      rootGroup.rotation.x = rollAngle;
      leftThigh.rotation.x = -1.1;
      leftCalf.rotation.x = -1.3;
      rightThigh.rotation.x = -1.1;
      rightCalf.rotation.x = -1.3;
      rightUpperArm.rotation.x = -1.2;
      leftUpperArm.rotation.x = -1.2;
    } else if (state === 'hit' || state === 'stagger') {
      // Recoil
      chest.rotation.x = -0.45;
      head.rotation.x = -0.35;
      rightUpperArm.rotation.x = 0.4;
      leftUpperArm.rotation.x = 0.4;
      hips.position.y = 0.88 * baseScale;
    } else if (state === 'skill') {
      // First Sun Awakening surge: raising weapon to heavens
      const surge = Math.sin(elapsedTime * 6.0) * 0.05;
      chest.rotation.x = -0.2 + surge;
      head.rotation.x = -0.35;
      rightUpperArm.rotation.x = -2.85;
      rightUpperArm.rotation.z = -0.15;
      rightForearm.rotation.x = -0.15;
      leftUpperArm.rotation.x = -0.4;
      leftUpperArm.rotation.z = 0.55;
    } else if (state === 'triumph') {
      // Victory pose
      hips.position.y = 0.92 * baseScale;
      leftThigh.rotation.z = -0.18;
      rightThigh.rotation.z = 0.18;
      chest.rotation.x = -0.15;
      head.rotation.x = -0.25;

      // Lift weapon high
      rightUpperArm.rotation.x = -2.75;
      rightUpperArm.rotation.z = -0.22;
      rightForearm.rotation.x = -0.1;

      // Left arm flexed fist
      leftUpperArm.rotation.x = -0.45;
      leftUpperArm.rotation.z = 0.65;
      leftForearm.rotation.x = -1.2;
    } else if (state === 'death') {
      hips.position.y = 0.25 * baseScale;
      rootGroup.rotation.x = 1.45;
      chest.rotation.x = 0.2;
      leftUpperArm.rotation.x = 0.8;
      rightUpperArm.rotation.x = 0.8;
    }
  };

  // Customization Hook to dynamically update appearance
  const updateAppearance = (
    newAppearance: CharacterAppearance,
    newArchetype: CombatArchetype,
    newSpec?: ClassSpecialization,
    newWeapon?: WeaponType,
    newTransmog?: TransmogSettings
  ) => {
    animationController.setClassArchetype(newArchetype, newWeapon ?? weaponType);

    if (newAppearance.skinTone) {
      materials.skin.color.set(newAppearance.skinTone);
    }
    if (newAppearance.hairColor) {
      materials.hair.color.set(newAppearance.hairColor);
      materials.facialHair.color.set(newAppearance.hairColor);
    }
    if (newAppearance.eyeColor) {
      materials.eyes.color.set(newAppearance.eyeColor);
      if (newAppearance.fantasyEyeGlow) {
        materials.eyes.emissive.set(newAppearance.eyeColor);
        materials.eyes.emissiveIntensity = 0.8;
      } else {
        materials.eyes.emissive.set(0x000000);
      }
    }
  };

  // Master Rigged Character (GLB/GLTF/FBX) & Animation Pipeline
  const loadMasterCharacter = async (urlOverride?: string): Promise<boolean> => {
    const success = await animationController.loadMasterCharacter(urlOverride);
    if (success) {
      // Real rigged character is ready: hide procedural skeleton and static GLB
      hips.visible = false;
      if (externalModel) {
        externalModel.visible = false;
      }
      if (!rootGroup.children.includes(animationController.getRootGroup())) {
        rootGroup.add(animationController.getRootGroup());
      }
      animationController.setClassArchetype(archetype, weaponType);
    }
    return success;
  };

  // Backward-compatible alias
  const loadMasterFBX = async (): Promise<boolean> => {
    return loadMasterCharacter();
  };

  // External GLB/glTF Replacement Fallback Hook
  const loadExternalGLB = async (url: string): Promise<boolean> => {
    return new Promise(resolve => {
      const loader = new GLTFLoader();
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('/draco/');
      loader.setDRACOLoader(dracoLoader);

      loader.load(
        url,
        gltf => {
          try {
            // Remove procedural meshes from rootGroup if FBX is not already active
            if (!animationController.getIsFBXActive()) {
              hips.visible = false;
            }

            const model = gltf.scene;

            // Auto-normalize scale and center ground contact
            const bbox = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            bbox.getSize(size);
            const center = new THREE.Vector3();
            bbox.getCenter(center);

            // Target hero height: ~1.85m
            if (size.y > 0.05) {
              const targetHeight = 1.85;
              const scaleFactor = targetHeight / size.y;
              model.scale.set(scaleFactor, scaleFactor, scaleFactor);

              // Recalculate bbox after scaling to ground feet properly at y = 0
              const scaledBbox = new THREE.Box3().setFromObject(model);
              const scaledCenter = new THREE.Vector3();
              scaledBbox.getCenter(scaledCenter);

              // Center horizontally and place feet at y = 0
              model.position.x = -scaledCenter.x;
              model.position.z = -scaledCenter.z;
              model.position.y = -scaledBbox.min.y;
              model.userData.baseY = model.position.y;
            }

            // Enable shadows and enhance materials for PBR lighting
            model.traverse(child => {
              if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                if (mesh.material) {
                  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                  mats.forEach(m => {
                    if (m instanceof THREE.MeshStandardMaterial) {
                      m.roughness = Math.max(0.2, m.roughness ?? 0.5);
                      m.envMapIntensity = 1.0;
                      if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
                    }
                  });
                }
              }
            });

            // Set up AnimationMixer if clips exist
            if (gltf.animations && gltf.animations.length > 0) {
              mixer = new THREE.AnimationMixer(model);
              gltf.animations.forEach(clip => {
                const action = mixer!.clipAction(clip);
                animationActions[clip.name.toLowerCase()] = action;
              });

              const idleClip = Object.keys(animationActions).find(k => k.includes('idle')) || Object.keys(animationActions)[0];
              if (idleClip && animationActions[idleClip]) {
                currentAction = animationActions[idleClip];
                currentAction.play();
              }
            }

            externalModel = model;
            if (animationController.getIsFBXActive()) {
              model.visible = false;
            }
            rootGroup.add(model);
            isExternalGLBActive = true;
            dracoLoader.dispose();
            console.info(`[Aethelgard 3D] Successfully loaded external character model from ${url}`);
            resolve(true);
          } catch (e) {
            dracoLoader.dispose();
            console.warn('[Aethelgard 3D] Error parsing external GLB model:', e);
            resolve(false);
          }
        },
        undefined,
        err => {
          dracoLoader.dispose();
          // Normal and expected when external file is pending placement
          console.info(`[Aethelgard 3D] External GLB at "${url}" could not be loaded:`, err, `. Seamlessly using procedural character fallback.`);
          resolve(false);
        }
      );
    });
  };

  // Comprehensive Resource Disposal
  const dispose = () => {
    animationController.dispose();

    if (mixer) {
      mixer.stopAllAction();
      mixer = null;
    }

    rootGroup.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
      }
    });

    Object.values(materials).forEach(mat => {
      mat.dispose();
    });
  };

  return {
    rootGroup,
    skeleton,
    materials,
    get isExternalGLB() {
      return isExternalGLBActive;
    },
    get isFBXActive() {
      return animationController.getIsFBXActive();
    },
    animationController,
    activeAnimationState: 'idle',
    applyAnimationState,
    updateAppearance,
    loadExternalGLB,
    loadMasterCharacter,
    loadMasterFBX,
    dispose
  };
}
