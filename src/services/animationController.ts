import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { CombatArchetype } from '../types/game';
import {
  AnimationState,
  ComboStage,
  animationRegistry,
  UNIVERSAL_ANIMATION_FILES
} from './animationRegistry';
import {
  MASTER_CHARACTER_URL,
  MasterCharacterLoadingState,
  DEFAULT_MASTER_CONFIG
} from '../config/characterConfig';
import {
  loadAnimationAtlas as loadSharedAnimationAtlas,
  normalizeMixamoBoneName,
  retargetClipToSkeleton
} from './mixamoSkeletonUtils';

export interface AnimationDebugInfo {
  masterName: string;
  masterLoadStatus: 'LOADED' | 'ERROR' | 'LOADING' | 'UNLOADED';
  skeletonSummary: string;
  skinnedMeshCount: number;
  activeClip: string;
  animationState: AnimationState;
  mixerStatus: 'ACTIVE' | 'ERROR' | 'INACTIVE';
  externalClip: string;
  retargetStatus: 'SUCCESS' | 'ERROR' | 'STANDBY';
  currentClass: CombatArchetype;
  currentWeapon: string;
  currentAnimation: string;
  comboIndex: number;
  loadingStatus: string;
  isFBXActive: boolean;
  masterLoadingState: MasterCharacterLoadingState;
  masterSourceUrl: string;
  masterErrorMessage?: string;
  masterFormat?: 'glb' | 'fbx' | 'procedural';
  loaderType: 'FBX' | 'GLB' | 'Procedural' | 'None';
  skeletonDetected: boolean;
  boneCount: number;
  skinnedMeshDetected: boolean;
  embeddedAnimationCount: number;
  activeAnimation: string;
  corsOrNetworkError?: string;
  loadedClipsCount: number;
  activeTrackCount: number;
  lastActionTime: number;
}

export class CentralizedAnimationController {
  private masterRootGroup: THREE.Group;
  private masterModel: THREE.Group | null = null;
  private mixer: THREE.AnimationMixer | null = null;
  private skeletonBones: Map<string, THREE.Bone> = new Map();
  private fbxLoader: FBXLoader;
  private gltfLoader: GLTFLoader;
  private dracoLoader: DRACOLoader;

  // Caching
  private actionCache: Map<string, THREE.AnimationAction> = new Map();
  private clipCache: Map<string, THREE.AnimationClip> = new Map();
  private loadingPromises: Map<string, Promise<THREE.AnimationClip | null>> = new Map();

  // State Management
  private currentArchetype: CombatArchetype = 'vanguard';
  private currentWeapon: string = 'sword_and_shield';
  private currentState: AnimationState = 'idle';
  private currentAction: THREE.AnimationAction | null = null;
  private currentClipName: string = 'None';
  private currentComboIndex: number = 0;

  // Master Character Runtime State
  private isMasterLoaded: boolean = false;
  private isLoadingMaster: boolean = false;
  private masterLoadingState: MasterCharacterLoadingState = 'unloaded';
  private masterSourceUrl: string = '';
  private masterErrorMessage?: string;
  private masterFormat?: 'glb' | 'fbx' | 'procedural';
  private currentLoaderType: 'FBX' | 'GLB' | 'Procedural' | 'None' = 'None';
  private skeletonDetected: boolean = false;
  private boneCount: number = 0;
  private skinnedMeshDetected: boolean = false;
  private skinnedMeshCount: number = 0;
  private embeddedAnimationCount: number = 0;
  private lastExternalClipName: string = 'None';
  private lastRetargetStatus: 'SUCCESS' | 'ERROR' | 'STANDBY' = 'STANDBY';
  private corsOrNetworkError?: string;
  private loadingStatusString: string = 'Initializing...';
  private tempActionTimer: number = 0;
  private returnToLocomotionOnComplete: boolean = false;

  // Listeners
  private debugListeners: Set<(info: AnimationDebugInfo) => void> = new Set();

  constructor() {
    this.masterRootGroup = new THREE.Group();
    this.masterRootGroup.name = 'MasterRigRootGroup';
    this.fbxLoader = new FBXLoader();

    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(this.dracoLoader);

    // Kick off the animation atlas fetch immediately; it's independent of the master
    // character rig load, so both can be in flight over the network at the same time.
    // This is shared module-level state (see mixamoSkeletonUtils.ts) so NPC characters
    // reusing the same atlas don't trigger a second fetch/parse of the file.
    loadSharedAnimationAtlas();
  }

  public getRootGroup(): THREE.Group {
    return this.masterRootGroup;
  }

  public getIsFBXActive(): boolean {
    return this.isMasterLoaded && this.masterModel !== null;
  }

  public getMasterLoadingState(): MasterCharacterLoadingState {
    return this.masterLoadingState;
  }

  public getMasterSourceUrl(): string {
    return this.masterSourceUrl;
  }

  public getMasterErrorMessage(): string | undefined {
    return this.masterErrorMessage;
  }

  public getLoadingStatus(): string {
    return this.loadingStatusString;
  }

  public getCurrentState(): AnimationState {
    return this.currentState;
  }

  public getCurrentComboIndex(): number {
    return this.currentComboIndex;
  }

  private async loadGLTFModel(url: string): Promise<{ model: THREE.Group; animations: THREE.AnimationClip[] }> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        gltf => {
          resolve({
            model: gltf.scene,
            animations: gltf.animations || []
          });
        },
        undefined,
        err => reject(err)
      );
    });
  }

  private async loadFBXModel(url: string): Promise<{ model: THREE.Group; animations: THREE.AnimationClip[] }> {
    return new Promise((resolve, reject) => {
      this.fbxLoader.load(
        url,
        obj => {
          resolve({
            model: obj,
            animations: obj.animations || []
          });
        },
        undefined,
        err => reject(err)
      );
    });
  }

  private configurePBRMaterial(mat: THREE.Material | THREE.Material[] | undefined) {
    if (!mat) return;
    const mats = Array.isArray(mat) ? mat : [mat];
    mats.forEach(m => {
      if (m instanceof THREE.MeshStandardMaterial) {
        m.roughness = Math.max(0.25, m.roughness ?? 0.6);
        m.metalness = Math.min(0.9, m.metalness ?? 0.1);
        m.envMapIntensity = 1.0;
        if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
        m.needsUpdate = true;
      } else if (m instanceof THREE.MeshPhongMaterial) {
        m.shininess = 30;
        m.needsUpdate = true;
      }
    });
  }

  private processLoadedMasterModel(
    loadedModel: THREE.Group,
    animations: THREE.AnimationClip[],
    sourceUrl: string,
    format: 'glb' | 'fbx'
  ): boolean {
    try {
      // Clean root group
      while (this.masterRootGroup.children.length > 0) {
        this.masterRootGroup.remove(this.masterRootGroup.children[0]);
      }

      this.masterModel = loadedModel;
      this.masterModel.name = 'MasterCharacterRig';
      this.masterFormat = format;

      // Inspect skeleton bones, skinned meshes, and PBR materials
      this.skeletonBones.clear();
      let skinnedMeshCount = 0;

      this.masterModel.traverse(child => {
        if ((child as THREE.Bone).isBone) {
          const bone = child as THREE.Bone;
          const normalized = normalizeMixamoBoneName(bone.name);
          this.skeletonBones.set(normalized, bone);
          this.skeletonBones.set(bone.name, bone);
        }

        if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
          skinnedMeshCount++;
          const skinned = child as THREE.SkinnedMesh;
          skinned.castShadow = true;
          skinned.receiveShadow = true;

          // In glTF, bones are often referenced by skinned.skeleton.bones
          if (skinned.skeleton && skinned.skeleton.bones) {
            skinned.skeleton.bones.forEach(b => {
              if (b) {
                const norm = normalizeMixamoBoneName(b.name);
                this.skeletonBones.set(norm, b);
                this.skeletonBones.set(b.name, b);
              }
            });
          }

          this.configurePBRMaterial(skinned.material);
        } else if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          this.configurePBRMaterial(mesh.material);
        }
      });

      // Count unique bones in master skeleton
      const uniqueBones = new Set(Array.from(this.skeletonBones.values())).size;
      this.boneCount = uniqueBones;
      this.skinnedMeshDetected = skinnedMeshCount > 0;
      this.skinnedMeshCount = skinnedMeshCount;

      // Auto-normalize scale and center ground contact
      const bbox = new THREE.Box3().setFromObject(this.masterModel);
      const size = new THREE.Vector3();
      bbox.getSize(size);
      const center = new THREE.Vector3();
      bbox.getCenter(center);

      const targetHeight = DEFAULT_MASTER_CONFIG.targetHeight || 1.85;
      let scaleFactor = 1.0;
      if (size.y > 50) {
        // Centimeters (Mixamo FBX default: ~170-190cm)
        scaleFactor = targetHeight / size.y;
      } else if (size.y > 0.05) {
        // Meters (glTF standard default: ~1.7 - 1.9m)
        scaleFactor = targetHeight / size.y;
      }

      this.masterModel.scale.set(scaleFactor, scaleFactor, scaleFactor);

      // Re-evaluate ground bounding box
      const scaledBbox = new THREE.Box3().setFromObject(this.masterModel);
      const scaledCenter = new THREE.Vector3();
      scaledBbox.getCenter(scaledCenter);

      this.masterModel.position.x = -scaledCenter.x;
      this.masterModel.position.z = -scaledCenter.z;
      this.masterModel.position.y = -scaledBbox.min.y; // Ground feet exactly at y = 0
      this.masterModel.rotation.y = 0;

      // Initialize authoritative AnimationMixer
      if (this.mixer) {
        this.mixer.stopAllAction();
        this.mixer.uncacheRoot(this.masterRootGroup);
      }
      this.mixer = new THREE.AnimationMixer(this.masterModel);

      // Extract embedded breathing idle clip if present
      let hasEmbeddedIdle = false;
      if (animations && animations.length > 0) {
        const idleClip = animations.find(c => {
          const n = c.name.toLowerCase();
          return n.includes('idle') || n.includes('breath') || n.includes('stand') || n.includes('mixamo');
        }) || animations[0];

        if (idleClip) {
          const idleStandard = idleClip.clone();
          idleStandard.name = 'Breathing Idle.fbx';
          this.cacheClip('Breathing Idle.fbx', idleStandard);
          this.cacheClip('Breathing.Idle.fbx', idleStandard);
          this.cacheClip(idleClip.name, idleClip);
          hasEmbeddedIdle = true;
        }
      }

      this.masterRootGroup.add(this.masterModel);
      this.isMasterLoaded = true;
      this.isLoadingMaster = false;
      this.masterLoadingState = 'loaded';
      this.masterSourceUrl = sourceUrl;
      this.masterErrorMessage = undefined;
      this.corsOrNetworkError = undefined;
      this.skeletonDetected = uniqueBones > 0;
      this.embeddedAnimationCount = animations ? animations.length : 0;

      this.loadingStatusString = `Master Rig Ready [${format.toUpperCase()}] (${uniqueBones} bones, Skinned: ${skinnedMeshCount > 0 ? 'Yes' : 'No'}, Idle: ${hasEmbeddedIdle ? 'Embedded' : 'Standard'})`;
      console.info(`[Aethelgard Animation] ${this.loadingStatusString} from ${sourceUrl}`);

      // Start by playing Idle
      this.playAction('Breathing Idle.fbx', true, 0.2);

      // Kick off background lazy load of universal locomotion set
      this.lazyLoadUniversalSet();

      this.notifyDebugUpdate();
      return true;
    } catch (e: any) {
      console.warn('[Aethelgard Animation] Failed processing master character rig:', e);
      this.isLoadingMaster = false;
      this.masterLoadingState = 'failed';
      this.masterErrorMessage = `Error initializing master character: ${e?.message || 'Unknown processing error'}`;
      this.corsOrNetworkError = this.masterErrorMessage;
      this.loadingStatusString = 'Error initializing master rig';
      this.notifyDebugUpdate();
      return false;
    }
  }

  /**
   * Loads the master character (GLB/GLTF preferred runtime format, FBX supported)
   * which provides the authoritative SkinnedMesh, Skeleton, skin weights, and Breathing Idle clip.
   */
  public async loadMasterCharacter(urlOverride?: string): Promise<boolean> {
    if (this.isMasterLoaded) {
      return true;
    }
    if (this.isLoadingMaster) {
      return false;
    }

    this.isLoadingMaster = true;
    this.masterLoadingState = 'loading';

    const targetUrl = (urlOverride || MASTER_CHARACTER_URL || '').trim();

    // 1. If explicit MASTER_CHARACTER_URL is configured, attempt runtime load
    if (targetUrl) {
      this.masterSourceUrl = targetUrl;
      const isFBX = DEFAULT_MASTER_CONFIG.preferredFormat === 'fbx' ||
        targetUrl.toLowerCase().endsWith('.fbx') ||
        targetUrl.toLowerCase().includes('.fbx') ||
        targetUrl.toLowerCase().includes('character-asset') ||
        targetUrl.toLowerCase().includes('export=download') ||
        targetUrl.toLowerCase().includes('drive.google.com');
      this.currentLoaderType = isFBX ? 'FBX' : 'GLB';
      const formatTag = this.currentLoaderType;

      this.loadingStatusString = `Loading external master rig (${formatTag}) from: ${targetUrl.slice(0, 48)}...`;
      this.notifyDebugUpdate();

      try {
        if (isFBX) {
          const result = await this.loadFBXModel(targetUrl);
          if (result && result.model) {
            return this.processLoadedMasterModel(result.model, result.animations, targetUrl, 'fbx');
          }
        } else {
          // GLB / GLTF preferred runtime format
          const result = await this.loadGLTFModel(targetUrl);
          if (result && result.model) {
            return this.processLoadedMasterModel(result.model, result.animations, targetUrl, 'glb');
          }
        }
      } catch (err: any) {
        let errText = '';
        if (err?.message) {
          errText = err.message;
        } else if (err?.target?.status) {
          errText = `HTTP ${err.target.status} ${err.target.statusText || 'Forbidden'} (CORS policy blocked access)`;
        } else if (err?.type === 'error') {
          errText = 'CORS error: Browser blocked cross-origin request to Google Drive (HTTP 403 Forbidden with no Access-Control-Allow-Origin header)';
        } else {
          errText = 'CORS/Network error: Failed to fetch external master asset from Google Drive';
        }
        console.warn(`[Aethelgard Animation] External master character failed to load from "${targetUrl}":`, err);
        this.corsOrNetworkError = errText;
        this.masterErrorMessage = errText;
        this.masterLoadingState = 'failed';
        this.loadingStatusString = `Master character failed: ${errText}`;
        this.notifyDebugUpdate();
      }
    }

    // 2. Check local candidate fallback paths
    this.loadingStatusString = 'Checking local fallback character assets...';
    this.notifyDebugUpdate();

    const candidatePaths = [
      { url: '/assets/characters/master-character.glb', format: 'glb' as const },
      { url: '/assets/characters/aethelgard-hero.glb', format: 'glb' as const },
      { url: '/assets/characters/mixamo/Breathing Idle.fbx', format: 'fbx' as const },
      { url: '/assets/characters/Breathing Idle.fbx', format: 'fbx' as const },
      { url: '/assets/animations/universal/Breathing Idle.fbx', format: 'fbx' as const },
      { url: '/assets/animations/Breathing Idle.fbx', format: 'fbx' as const }
    ];

    for (const cand of candidatePaths) {
      try {
        if (cand.format === 'glb') {
          const result = await this.loadGLTFModel(cand.url);
          if (result && result.model) {
            let hasSkeleton = false;
            result.model.traverse(c => {
              if ((c as THREE.Bone).isBone || (c as THREE.SkinnedMesh).isSkinnedMesh) {
                hasSkeleton = true;
              }
            });
            if (hasSkeleton) {
              return this.processLoadedMasterModel(result.model, result.animations, cand.url, 'glb');
            }
          }
        } else {
          const result = await this.loadFBXModel(cand.url);
          if (result && result.model) {
            return this.processLoadedMasterModel(result.model, result.animations, cand.url, 'fbx');
          }
        }
      } catch {
        // Candidate not found or not suitable, try next
      }
    }

    // 3. Fallback to procedural
    this.isLoadingMaster = false;
    if (targetUrl) {
      this.masterLoadingState = 'failed';
      this.loadingStatusString = 'External master rig failed to load. Procedural active.';
    } else {
      this.masterLoadingState = 'unloaded';
      this.loadingStatusString = 'MASTER_CHARACTER_URL empty. Procedural fallback active.';
      this.masterErrorMessage = 'MASTER_CHARACTER_URL is empty in src/config/characterConfig.ts. Using procedural anatomical hero.';
    }

    console.info(`[Aethelgard Animation] ${this.loadingStatusString}`);
    this.notifyDebugUpdate();
    return false;
  }

  public async retryLoadMasterCharacter(urlOverride?: string): Promise<boolean> {
    this.isMasterLoaded = false;
    this.isLoadingMaster = false;
    return this.loadMasterCharacter(urlOverride);
  }

  /**
   * Preloads common universal locomotion animations in the background
   */
  public async lazyLoadUniversalSet(): Promise<void> {
    if (!this.isMasterLoaded) return;
    const universalToLoad = ['Walking.fbx', 'Running.fbx', 'Dodging.fbx', 'Reaction.fbx', 'Dying.fbx'];
    for (const file of universalToLoad) {
      this.loadClip(file).catch(() => {});
    }
  }

  /**
   * Preloads class-specific weapon & combat animations on class selection
   */
  public async setClassArchetype(archetype: CombatArchetype, weapon: string = 'sword_and_shield'): Promise<void> {
    this.currentArchetype = archetype;
    this.currentWeapon = weapon;
    const config = animationRegistry.getClassConfig(archetype);

    this.notifyDebugUpdate();

    if (!this.isMasterLoaded) return;

    if (config.isProceduralOnly) {
      console.info(`[Aethelgard Animation] Class ${archetype} is configured to use procedural kinematic animations.`);
      return;
    }

    // Lazy load the class combat combo and abilities
    const filesToLoad: string[] = [config.idle];
    config.lightCombo.forEach(s => {
      filesToLoad.push(s.clipFile);
      if (s.fallbackFile) filesToLoad.push(s.fallbackFile);
    });
    if (config.heavyAttack) filesToLoad.push(config.heavyAttack.clipFile);
    if (config.block) filesToLoad.push(config.block);
    if (config.parry) filesToLoad.push(config.parry);
    if (config.cast) filesToLoad.push(config.cast);

    // Load sequentially in background
    for (const file of filesToLoad) {
      if (file && !file.startsWith('procedural')) {
        this.loadClip(file).catch(() => {});
      }
    }
  }

  /**
   * Looks up an individual AnimationClip from the merged animation atlas and retargets it
   * onto the master skeleton.
   */
  public async loadClip(clipFileName: string): Promise<THREE.AnimationClip | null> {
    if (this.clipCache.has(clipFileName)) {
      return this.clipCache.get(clipFileName)!;
    }

    if (this.loadingPromises.has(clipFileName)) {
      return this.loadingPromises.get(clipFileName)!;
    }

    const loadPromise = (async () => {
      const atlas = await loadSharedAnimationAtlas();
      const rawClip = atlas.get(clipFileName);

      if (!rawClip) {
        this.lastExternalClipName = clipFileName;
        this.lastRetargetStatus = 'ERROR';
        this.notifyDebugUpdate();
        return null;
      }

      const retargetedClip = this.retargetClipToMaster(rawClip, clipFileName);
      this.cacheClip(clipFileName, retargetedClip);
      this.lastExternalClipName = clipFileName;
      this.lastRetargetStatus = retargetedClip.tracks.length > 0 ? 'SUCCESS' : 'ERROR';
      console.info(`[Aethelgard Animation] Loaded & retargeted clip: "${clipFileName}" (${retargetedClip.tracks.length} tracks, ${retargetedClip.duration.toFixed(2)}s)`);
      this.notifyDebugUpdate();
      return retargetedClip;
    })();

    this.loadingPromises.set(clipFileName, loadPromise);
    return loadPromise;
  }

  /**
   * Retargets an AnimationClip by matching bone track names with the master skeleton
   */
  private retargetClipToMaster(clip: THREE.AnimationClip, clipName: string): THREE.AnimationClip {
    return retargetClipToSkeleton(clip, this.skeletonBones, clipName);
  }

  private cacheClip(clipFileName: string, clip: THREE.AnimationClip) {
    this.clipCache.set(clipFileName, clip);
    if (this.mixer) {
      const action = this.mixer.clipAction(clip);
      this.actionCache.set(clipFileName, action);
    }
  }

  /**
   * Transition state machine with crossfade and priority management
   */
  public transitionTo(
    state: AnimationState,
    delta: number,
    options?: {
      comboIndex?: number;
      blendDuration?: number;
      timeScale?: number;
    }
  ) {
    this.currentState = state;
    const config = animationRegistry.getClassConfig(this.currentArchetype);

    if (options?.comboIndex !== undefined) {
      this.currentComboIndex = options.comboIndex;
    }

    if (!this.isMasterLoaded || !this.mixer) {
      // FBX not loaded; procedural fallback handles movement
      return;
    }

    // Determine target clip file for the requested state
    let targetClipFile: string | null = null;
    let isLooping = true;
    let blendTime = options?.blendDuration ?? 0.15;
    let actionDuration = 0;

    switch (state) {
      case 'idle':
        targetClipFile = config.idle;
        isLooping = true;
        break;

      case 'walk':
        targetClipFile = config.walk;
        isLooping = true;
        break;

      case 'run':
        targetClipFile = config.run;
        isLooping = true;
        break;

      case 'sprint':
        targetClipFile = config.sprint || config.run;
        isLooping = true;
        break;

      case 'dodge':
        targetClipFile = config.dodge;
        isLooping = false;
        blendTime = 0.08;
        actionDuration = 0.45;
        this.returnToLocomotionOnComplete = true;
        break;

      case 'hit_reaction':
        targetClipFile = config.hitReaction;
        isLooping = false;
        blendTime = 0.08;
        actionDuration = 0.5;
        this.returnToLocomotionOnComplete = true;
        break;

      case 'death':
        targetClipFile = config.death;
        isLooping = false;
        blendTime = 0.2;
        this.returnToLocomotionOnComplete = false;
        break;

      case 'attack': {
        const stage = animationRegistry.getComboStage(this.currentArchetype, this.currentComboIndex || 1);
        targetClipFile = stage.clipFile;
        isLooping = false;
        blendTime = stage.blendDuration;
        actionDuration = stage.duration;
        this.returnToLocomotionOnComplete = true;
        break;
      }

      case 'heavy_attack': {
        const heavy = config.heavyAttack;
        targetClipFile = heavy ? heavy.clipFile : config.lightCombo[0].clipFile;
        isLooping = false;
        blendTime = heavy ? heavy.blendDuration : 0.15;
        actionDuration = heavy ? heavy.duration : 0.9;
        this.returnToLocomotionOnComplete = true;
        break;
      }

      case 'block':
        targetClipFile = config.block || 'sword and shield block idle.fbx';
        isLooping = true;
        blendTime = 0.1;
        break;

      case 'parry':
        targetClipFile = config.parry || 'sword and shield block.fbx';
        isLooping = false;
        blendTime = 0.08;
        actionDuration = 0.45;
        this.returnToLocomotionOnComplete = true;
        break;

      case 'cast':
        targetClipFile = config.cast || 'sword and shield casting.fbx';
        isLooping = false;
        blendTime = 0.12;
        actionDuration = 1.0;
        this.returnToLocomotionOnComplete = true;
        break;

      case 'triumph':
        targetClipFile = 'Standing Up.fbx';
        isLooping = false;
        blendTime = 0.2;
        break;
    }

    if (actionDuration > 0) {
      this.tempActionTimer = actionDuration;
    }

    if (targetClipFile) {
      this.playAction(targetClipFile, isLooping, blendTime, options?.timeScale);
    }
  }

  /**
   * Plays or crossfades into an action
   */
  private playAction(clipFileName: string, loop: boolean, blendDuration: number = 0.15, timeScale: number = 1.0) {
    if (!this.mixer) return;

    let targetAction = this.actionCache.get(clipFileName);

    if (!targetAction) {
      // Check if clip is loaded
      const clip = this.clipCache.get(clipFileName);
      if (clip) {
        targetAction = this.mixer.clipAction(clip);
        this.actionCache.set(clipFileName, targetAction);
      } else {
        // Attempt lazy load if not yet cached, fallback to Breathing Idle in the meantime
        this.loadClip(clipFileName).then(loadedClip => {
          if (loadedClip && this.mixer && this.currentState !== 'idle') {
            const act = this.mixer.clipAction(loadedClip);
            this.actionCache.set(clipFileName, act);
            if (this.currentClipName === clipFileName) {
              this.crossfade(this.currentAction, act, 0.1, loop, timeScale);
            }
          }
        });

        // Use Breathing Idle as interim fallback
        const fallbackAction = this.actionCache.get('Breathing Idle.fbx');
        if (fallbackAction && this.currentAction !== fallbackAction) {
          this.crossfade(this.currentAction, fallbackAction, blendDuration, true, 1.0);
        }
        return;
      }
    }

    if (this.currentAction === targetAction) {
      if (!loop && targetAction.time >= targetAction.getClip().duration) {
        // Re-trigger action if finished
        targetAction.reset().play();
      }
      return;
    }

    this.currentClipName = clipFileName;
    this.crossfade(this.currentAction, targetAction, blendDuration, loop, timeScale);
  }

  private crossfade(
    fromAction: THREE.AnimationAction | null,
    toAction: THREE.AnimationAction,
    duration: number,
    loop: boolean,
    timeScale: number = 1.0
  ) {
    toAction.reset();
    toAction.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    toAction.clampWhenFinished = !loop;
    toAction.timeScale = timeScale;

    if (fromAction && fromAction !== toAction) {
      fromAction.fadeOut(duration);
    }

    toAction.fadeIn(duration).play();
    this.currentAction = toAction;
    this.notifyDebugUpdate();
  }

  /**
   * Main per-frame update loop
   */
  public update(delta: number) {
    if (!this.mixer) return;

    this.mixer.update(delta);

    // Handle temporary action expiration (auto-return to locomotion)
    if (this.tempActionTimer > 0) {
      this.tempActionTimer -= delta;
      if (this.tempActionTimer <= 0 && this.returnToLocomotionOnComplete) {
        this.returnToLocomotionOnComplete = false;
        this.transitionTo('idle', delta);
      }
    }
  }

  /**
   * Debug observer support
   */
  public addDebugListener(cb: (info: AnimationDebugInfo) => void) {
    this.debugListeners.add(cb);
    cb(this.getDebugInfo());
  }

  public removeDebugListener(cb: (info: AnimationDebugInfo) => void) {
    this.debugListeners.delete(cb);
  }

  public getDebugInfo(): AnimationDebugInfo {
    const masterLoadStatus: 'LOADED' | 'ERROR' | 'LOADING' | 'UNLOADED' =
      this.masterLoadingState === 'loaded' ? 'LOADED' :
      this.masterLoadingState === 'failed' ? 'ERROR' :
      this.masterLoadingState === 'loading' ? 'LOADING' : 'UNLOADED';

    const mixerStatus: 'ACTIVE' | 'ERROR' | 'INACTIVE' =
      this.mixer ? 'ACTIVE' :
      this.masterLoadingState === 'failed' ? 'ERROR' : 'INACTIVE';

    return {
      masterName: 'Breathing.Idle.fbx',
      masterLoadStatus,
      skeletonSummary: `${this.boneCount} bones`,
      skinnedMeshCount: this.skinnedMeshCount,
      activeClip: this.currentClipName,
      animationState: this.currentState,
      mixerStatus,
      externalClip: this.lastExternalClipName,
      retargetStatus: this.lastRetargetStatus,
      currentClass: this.currentArchetype,
      currentWeapon: this.currentWeapon,
      currentAnimation: this.currentClipName,
      comboIndex: this.currentComboIndex,
      loadingStatus: this.loadingStatusString,
      isFBXActive: this.getIsFBXActive(),
      masterLoadingState: this.masterLoadingState,
      masterSourceUrl: this.masterSourceUrl || MASTER_CHARACTER_URL,
      masterErrorMessage: this.masterErrorMessage,
      masterFormat: this.masterFormat,
      loaderType: this.currentLoaderType,
      skeletonDetected: this.skeletonDetected,
      boneCount: this.boneCount,
      skinnedMeshDetected: this.skinnedMeshDetected,
      embeddedAnimationCount: this.embeddedAnimationCount,
      activeAnimation: this.currentClipName,
      corsOrNetworkError: this.corsOrNetworkError,
      loadedClipsCount: this.clipCache.size,
      activeTrackCount: this.currentAction ? this.currentAction.getClip().tracks.length : 0,
      lastActionTime: this.currentAction ? this.currentAction.time : 0
    };
  }

  private notifyDebugUpdate() {
    if (this.debugListeners.size > 0) {
      const info = this.getDebugInfo();
      this.debugListeners.forEach(listener => listener(info));
    }
  }

  /**
   * Resource Cleanup
   */
  public dispose() {
    this.debugListeners.clear();
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer.uncacheRoot(this.masterRootGroup);
      this.mixer = null;
    }

    this.actionCache.clear();
    this.clipCache.clear();
    this.loadingPromises.clear();
    this.skeletonBones.clear();

    while (this.masterRootGroup.children.length > 0) {
      const child = this.masterRootGroup.children[0];
      this.masterRootGroup.remove(child);
    }

    if (this.dracoLoader) {
      try {
        this.dracoLoader.dispose();
      } catch {}
    }
  }
}
