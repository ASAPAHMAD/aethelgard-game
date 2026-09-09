/**
 * =============================================================================
 * AETHELGARD 3D - MASTER RIGGED CHARACTER RUNTIME CONFIGURATION
 * =============================================================================
 * Google AI Studio enforces a 30 MB per-file upload ceiling.
 * The master rigged character (containing the full SkinnedMesh, authoritative
 * skeleton, skin weights, PBR materials, and embedded Breathing Idle clip)
 * can be loaded at runtime from this external URL.
 * 
 * Instructions:
 * 1. Host your Mixamo-rigged master character (exported as .glb or .fbx, .glb preferred)
 *    on any external static host, CDN, or cloud storage bucket (e.g. Cloud Storage, S3, GitHub Release).
 * 2. Paste the direct URL below into MASTER_CHARACTER_URL.
 * 3. The engine will stream and mount the master character, bind its skeleton as authoritative,
 *    play the embedded Breathing Idle clip, and retarget all uploaded modular combat FBX clips onto it.
 * 
 * If MASTER_CHARACTER_URL is left empty (""), the engine gracefully attempts local fallback paths
 * and retains the procedural anatomical character without crashing the game.
 */

// =============================================================================
// [DEV CONFIGURATION SECTION]: REPLACE WITH YOUR HOSTED MASTER ASSET URL
// =============================================================================
export const MASTER_CHARACTER_URL: string = "/api/character-asset";

/**
 * Loading states for runtime master character asset loading
 */
export type MasterCharacterLoadingState = 'unloaded' | 'loading' | 'loaded' | 'failed';

export interface MasterCharacterConfig {
  url: string;
  preferredFormat: 'glb' | 'gltf' | 'fbx';
  targetHeight: number; // in meters (default: 1.85)
}

export const DEFAULT_MASTER_CONFIG: MasterCharacterConfig = {
  url: MASTER_CHARACTER_URL,
  preferredFormat: 'fbx',
  targetHeight: 1.85
};
