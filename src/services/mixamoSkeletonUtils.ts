import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Single GLB produced by scripts/convert-animations-to-glb.mjs, bundling every clip from
 * public/assets/animations/**.fbx as animation tracks on the shared Mixamo skeleton. Shared
 * by the player's CentralizedAnimationController and any Mixamo-rigged NPC, so it's fetched
 * and parsed exactly once per session regardless of how many characters use it.
 */
export const ANIMATION_ATLAS_URL = '/assets/animations/animation-atlas.glb';

let animationAtlasPromise: Promise<Map<string, THREE.AnimationClip>> | null = null;
const atlasGltfLoader = new GLTFLoader();

/**
 * Loads and caches the merged animation atlas GLB, returning a map of clip name (matching
 * the original .fbx file name, e.g. "Walking.fbx") to clip. Safe to call from multiple
 * characters/controllers: the underlying fetch+parse only happens once, cached here at
 * module scope rather than per-instance.
 */
export function loadAnimationAtlas(): Promise<Map<string, THREE.AnimationClip>> {
  if (!animationAtlasPromise) {
    animationAtlasPromise = new Promise(resolve => {
      atlasGltfLoader.load(
        ANIMATION_ATLAS_URL,
        gltf => {
          const clipsByName = new Map<string, THREE.AnimationClip>();
          for (const clip of gltf.animations) {
            clipsByName.set(clip.name, clip);
          }
          resolve(clipsByName);
        },
        undefined,
        err => {
          console.warn(`[Aethelgard Animation] Failed to load animation atlas from "${ANIMATION_ATLAS_URL}":`, err);
          resolve(new Map());
        }
      );
    });
  }
  return animationAtlasPromise;
}

/**
 * Normalizes a Mixamo bone name for matching regardless of prefix style or source tool:
 * "mixamorig:Hips", "mixamorigHips", and plain "Hips" all normalize to "hips". Used to bind
 * animation-atlas.glb's track names onto any Mixamo-compatible skeleton (the player's master
 * rig, or a Mixamo-rigged NPC), which is not guaranteed to use the exact same prefix style.
 */
export function normalizeMixamoBoneName(name: string): string {
  return name
    .replace(/^mixamorig[:_]?/i, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
}

/**
 * Walks a loaded character's scene graph and indexes every Bone by both its normalized and
 * raw name, for use with retargetClipToSkeleton. Deliberately only collects bones - mesh/
 * shadow/material setup is the caller's concern (the player's master rig and NPC characters
 * each have different requirements there).
 */
export function buildSkeletonBoneMap(root: THREE.Object3D): Map<string, THREE.Bone> {
  const bones = new Map<string, THREE.Bone>();
  root.traverse(child => {
    if ((child as THREE.Bone).isBone) {
      const bone = child as THREE.Bone;
      bones.set(normalizeMixamoBoneName(bone.name), bone);
      bones.set(bone.name, bone);
    }
  });
  return bones;
}

/**
 * Retargets an animation-atlas clip onto a target skeleton by matching each track's bone
 * name against the given lookup map (see buildSkeletonBoneMap). This is pure name matching,
 * not true skeletal retargeting - it does not correct for rest-pose or proportion
 * differences, so it only works when the target skeleton uses Mixamo's bone name lexicon.
 */
export function retargetClipToSkeleton(
  clip: THREE.AnimationClip,
  skeletonBones: Map<string, THREE.Bone>,
  clipName: string
): THREE.AnimationClip {
  const newTracks: THREE.KeyframeTrack[] = [];

  for (const track of clip.tracks) {
    const dotIdx = track.name.lastIndexOf('.');
    if (dotIdx === -1) continue;

    const trackNodeName = track.name.substring(0, dotIdx);
    const property = track.name.substring(dotIdx);

    const normalized = normalizeMixamoBoneName(trackNodeName);
    const targetBone = skeletonBones.get(normalized) || skeletonBones.get(trackNodeName);

    if (targetBone) {
      const newTrackName = `${targetBone.name}${property}`;
      const clonedTrack = track.clone();
      clonedTrack.name = newTrackName;
      newTracks.push(clonedTrack);
    } else {
      newTracks.push(track.clone());
    }
  }

  return new THREE.AnimationClip(clipName, clip.duration, newTracks);
}
