import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { 
  CharacterAppearance, 
  CombatArchetype, 
  ClassSpecialization,
  WeaponType,
  TransmogSettings,
  Companion,
  CampStructure,
  Item
} from '../../types/game';
import { 
  createHumanoidPlayerCharacter, 
  CharacterAnimationState 
} from '../../services/characterAssetService';
import { AnimationDebugHUD } from './AnimationDebugHUD';
import { animationRegistry } from '../../services/animationRegistry';
import { CentralizedAnimationController } from '../../services/animationController';
import { audioEngine } from '../../services/audioEngine';
import { 
  getTerrainHeight, 
  createAshenShorelineTerrain, 
  createDynamicOceanWater, 
  createModularRocks, 
  createModularVegetation 
} from '../../services/environmentTerrainService';
import { 
  createEchoCampSettlement, 
  createAncientRuins, 
  createCorruptedEclipseZone, 
  createCoastalCave,
  InteractiveNpcInfo
} from '../../services/environmentCampService';
import { 
  Swords, 
  Shield, 
  Zap, 
  Sparkles, 
  Compass, 
  Eye, 
  Heart, 
  Flame, 
  User, 
  MessageSquare,
  Smartphone,
  Keyboard,
  Target
} from 'lucide-react';
import { MobileTouchControls, JoystickVector } from './MobileTouchControls';

interface WorldEngine3DProps {
  appearance: CharacterAppearance;
  archetype: CombatArchetype;
  specialization?: ClassSpecialization;
  equippedWeapon?: WeaponType;
  transmog?: TransmogSettings;
  playerHp: number;
  maxPlayerHp: number;
  playerStamina: number;
  maxPlayerStamina: number;
  playerAether: number;
  maxPlayerAether: number;
  companion?: Companion;
  settlementTier?: number;
  onTakeDamage: (amount: number) => void;
  onConsumeStamina: (amount: number) => boolean;
  onConsumeAether: (amount: number) => boolean;
  onGainXp: (amount: number) => void;
  onLootGained: (item: Item) => void;
  onCompanionSpeech?: (text: string) => void;
  onOpenSettlement?: () => void;
  onOpenCharacter?: () => void;
  className?: string;
}

interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  z: number;
  color: string;
  life: number;
}

export const WorldEngine3D: React.FC<WorldEngine3DProps> = ({
  appearance,
  archetype,
  specialization,
  equippedWeapon = 'greatsword',
  transmog,
  playerHp,
  maxPlayerHp,
  playerStamina,
  maxPlayerStamina,
  playerAether,
  maxPlayerAether,
  companion,
  settlementTier = 1,
  onTakeDamage,
  onConsumeStamina,
  onConsumeAether,
  onGainXp,
  onLootGained,
  onCompanionSpeech,
  onOpenSettlement,
  onOpenCharacter,
  className = 'w-full h-full'
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Floating damage / combat texts
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

  // Combat status feedback
  const [combatFeedback, setCombatFeedback] = useState<{ text: string; color: string } | null>(null);

  // Reference for animation & physics loop
  const animFrameIdRef = useRef<number | null>(null);

  // Proximity to resident NPCs
  const [nearbyNpc, setNearbyNpc] = useState<InteractiveNpcInfo | null>(null);
  const nearbyNpcRef = useRef<InteractiveNpcInfo | null>(null);

  // Touch / Mobile Controls State & Detection
  const [touchControlsEnabled, setTouchControlsEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 1024;
  });

  // Target soft-lock state
  const [softLockActive, setSoftLockActive] = useState<boolean>(true);
  const softLockRef = useRef<boolean>(true);
  softLockRef.current = softLockActive;

  // Touch Virtual Joystick input ref
  const touchInputRef = useRef<JoystickVector>({
    x: 0,
    y: 0,
    magnitude: 0,
    isSprint: false
  });

  // Combat status & reactive UI states
  const [animController, setAnimController] = useState<CentralizedAnimationController | null>(null);
  const [isExternalGLBActive, setIsExternalGLBActive] = useState<boolean>(false);
  const [attackComboState, setAttackComboState] = useState<number>(0);
  const [skillCooldownSec, setSkillCooldownSec] = useState<number>(0);
  const skillCooldownTimerRef = useRef<number>(0);
  const [isAttackingUI, setIsAttackingUI] = useState<boolean>(false);
  const [isDodgingUI, setIsDodgingUI] = useState<boolean>(false);
  const [isParryingUI, setIsParryingUI] = useState<boolean>(false);

  // Input states
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const mouseState = useRef<{ isDragging: boolean; prevX: number; prevY: number }>({
    isDragging: false,
    prevX: 0,
    prevY: 0
  });

  // Game World State
  const gameStateRef = useRef({
    // Player
    playerPos: new THREE.Vector3(0, getTerrainHeight(0, 5), 5),
    playerVelocity: new THREE.Vector3(0, 0, 0),
    playerRotY: 0,
    isDodging: false,
    dodgeTimer: 0,
    isAttacking: false,
    attackCombo: 0,
    attackTimer: 0,
    isParrying: false,
    parryTimer: 0,
    // Camera
    camRotY: 0,
    camPitch: 0.35,
    camDistance: 6.5,
    // Enemy (Abyssal Voidstalker patrolling the Corrupted Breach)
    enemyPos: new THREE.Vector3(20, getTerrainHeight(20, -10), -10),
    enemyHp: 240,
    enemyMaxHp: 240,
    enemyState: 'idle' as 'idle' | 'chasing' | 'telegraphing' | 'attacking' | 'staggered' | 'dead',
    enemyTimer: 0,
    enemyStaggerTimer: 0,
    // Companion
    companionPos: new THREE.Vector3(-1.8, getTerrainHeight(-1.8, 6.2), 6.2)
  });

  // Touch Camera Drag handler
  const handleCameraDrag = useCallback((deltaX: number, deltaY: number) => {
    const s = gameStateRef.current;
    s.camRotY -= deltaX * 0.007;
    s.camPitch = Math.max(0.1, Math.min(1.1, s.camPitch + deltaY * 0.006));
  }, []);

  // Touch Joystick Move handler
  const handleJoystickMove = useCallback((vector: JoystickVector) => {
    touchInputRef.current = vector;
  }, []);

  // Toggle soft-lock targeting
  const handleToggleTargetLock = useCallback(() => {
    setSoftLockActive(prev => {
      const next = !prev;
      softLockRef.current = next;
      triggerCombatFeedback(next ? 'TARGET LOCKED' : 'TARGET FREED', next ? '#f59e0b' : '#94a3b8');
      audioEngine.playBlock();
      return next;
    });
  }, []);

  // Interact with resident camp NPC
  const handleInteractWithNpc = useCallback((npc: InteractiveNpcInfo) => {
    audioEngine.playGather();
    if (npc.id === 'torvald') {
      onOpenSettlement?.();
      onCompanionSpeech?.('Torvald wipes soot from his brow: "The forge is stoked, hero. Bring me salvaged metal and sunsteel."');
    } else if (npc.id === 'maeve') {
      onOpenSettlement?.();
      onCompanionSpeech?.('Maeve whispers over an alembic: "The ancient conduits beneath the beach are awakening... watch the tide."');
    } else if (npc.id === 'varric') {
      onOpenSettlement?.();
      onCompanionSpeech?.('Varric gestures to his coast maps: "Scouted the reef earlier. The abyssal creatures gather near the eastern fissure."');
    } else if (npc.id === 'kaelen') {
      onCompanionSpeech?.('Commander Drake stands vigilant: "Keep your stance steady on the sands, friend. We hold this shore together."');
    }
  }, [onOpenSettlement, onCompanionSpeech]);

  const showFloatingText = (text: string, pos: THREE.Vector3, color: string = '#f59e0b') => {
    const id = Math.random().toString();
    setFloatingTexts(prev => [
      ...prev.slice(-6),
      { id, text, x: pos.x, y: pos.y + 1.8, z: pos.z, color, life: 1.0 }
    ]);
  };

  const triggerCombatFeedback = (text: string, color: string = '#f59e0b') => {
    setCombatFeedback({ text, color });
    setTimeout(() => setCombatFeedback(null), 1400);
  };

  // Perform Player Attack
  const handleAttack = useCallback(() => {
    const s = gameStateRef.current;
    if (s.isDodging || s.isAttacking) return;

    if (!onConsumeStamina(15)) {
      triggerCombatFeedback('Out of Stamina!', '#ef4444');
      return;
    }

    // Soft-lock alignment: turn toward nearest enemy when attacking
    if (softLockRef.current && s.enemyHp > 0) {
      const distToEnemy = s.playerPos.distanceTo(s.enemyPos);
      if (distToEnemy < 16) {
        const toEnemy = s.enemyPos.clone().sub(s.playerPos);
        s.playerRotY = Math.atan2(toEnemy.x, toEnemy.z);
      }
    }

    s.isAttacking = true;
    s.attackCombo = (s.attackCombo % 3) + 1;
    setAttackComboState(s.attackCombo);
    setIsAttackingUI(true);

    const comboStage = animationRegistry.getComboStage(archetype, s.attackCombo);
    s.attackTimer = comboStage.duration;

    audioEngine.playSwing();

    // Check hit against enemy
    const distToEnemy = s.playerPos.distanceTo(s.enemyPos);
    if (distToEnemy < 3.2 && s.enemyHp > 0) {
      const baseDmg = archetype === 'vanguard' ? 45 : archetype === 'spellblade' ? 42 : archetype === 'shadowstrider' ? 38 : 36;
      const comboMultiplier = comboStage.damageMultiplier;
      const isCrit = Math.random() < 0.25;
      const finalDmg = Math.round(baseDmg * comboMultiplier * (isCrit ? 1.5 : 1.0));

      s.enemyHp = Math.max(0, s.enemyHp - finalDmg);
      audioEngine.playHit(isCrit);

      // Enemy pushback
      const dir = s.enemyPos.clone().sub(s.playerPos).normalize();
      s.enemyPos.add(dir.multiplyScalar(0.4));

      showFloatingText(
        isCrit ? `CRIT! -${finalDmg}` : `-${finalDmg}`,
        s.enemyPos,
        isCrit ? '#fbbf24' : '#f97316'
      );

      if (s.enemyHp <= 0 && s.enemyState !== 'dead') {
        s.enemyState = 'dead';
        audioEngine.playRelicSurge();
        onGainXp(180);
        showFloatingText('+180 XP • VOID ESSENCE', s.enemyPos, '#a855f7');
        onLootGained({
          id: `void_carapace_${Date.now()}`,
          name: 'Abyssal Void Shard',
          type: 'material',
          rarity: 'rare',
          description: 'Crystalline shard brimming with twilight solar power.',
          icon: 'gem',
          value: 65
        });
        if (onCompanionSpeech) {
          onCompanionSpeech('The beast dissolves back into the shadows. Well struck, friend!');
        }
      }
    }
  }, [archetype, onConsumeStamina, onGainXp, onLootGained, onCompanionSpeech]);

  // Perform Player Parry
  const handleParry = useCallback(() => {
    const s = gameStateRef.current;
    if (s.isDodging || s.isParrying) return;

    if (!onConsumeStamina(20)) {
      triggerCombatFeedback('Need Stamina to Parry!', '#ef4444');
      return;
    }

    s.isParrying = true;
    setIsParryingUI(true);
    s.parryTimer = 0.45;
    audioEngine.playBlock();
    triggerCombatFeedback('DEFENSIVE PARRY READY', '#38bdf8');
  }, [onConsumeStamina]);

  // Perform Directional Dodge Roll
  const handleDodge = useCallback(() => {
    const s = gameStateRef.current;
    if (s.isDodging) return;

    if (!onConsumeStamina(22)) {
      triggerCombatFeedback('Exhausted!', '#ef4444');
      return;
    }

    s.isDodging = true;
    setIsDodgingUI(true);
    s.dodgeTimer = 0.4;
    audioEngine.playDodge();

    // Determine dodge direction based on current joystick or keyboard movement
    const touch = touchInputRef.current;
    const keys = keysPressed.current;
    let dirX = 0;
    let dirZ = 0;

    if (keys['w'] || keys['arrowup']) dirZ -= 1;
    if (keys['s'] || keys['arrowdown']) dirZ += 1;
    if (keys['a'] || keys['arrowleft']) dirX -= 1;
    if (keys['d'] || keys['arrowright']) dirX += 1;

    if (touch.magnitude > 0.12) {
      dirX = touch.x;
      dirZ = -touch.y;
    }

    let dodgeAngle = s.playerRotY;
    if (dirX !== 0 || dirZ !== 0) {
      const inputAngle = Math.atan2(dirX, dirZ);
      // Camera-relative input already uses the same forward convention as the
      // camera (forward = -Z). Do not add PI here; that reverses every dodge direction.
      dodgeAngle = s.camRotY + inputAngle;
      s.playerRotY = dodgeAngle;
    }

    // Dash along dodge angle
    const forward = new THREE.Vector3(
      Math.sin(dodgeAngle),
      0,
      Math.cos(dodgeAngle)
    ).normalize();
    s.playerVelocity.copy(forward.multiplyScalar(14.0));
  }, [onConsumeStamina]);

  // Class Awakened Skill
  const handleClassSkill = useCallback(() => {
    const s = gameStateRef.current;

    if (skillCooldownTimerRef.current > 0.1) {
      triggerCombatFeedback(`Skill Cooling Down (${Math.ceil(skillCooldownTimerRef.current)}s)`, '#94a3b8');
      return;
    }

    if (!onConsumeAether(30)) {
      triggerCombatFeedback('Need 30 Aether!', '#818cf8');
      return;
    }

    skillCooldownTimerRef.current = 5.0;
    setSkillCooldownSec(5.0);
    audioEngine.playRelicSurge();

    if (archetype === 'vanguard') {
      triggerCombatFeedback('SOLAR CLEAVE!', '#f59e0b');
    } else if (archetype === 'spellblade') {
      triggerCombatFeedback('AETHER SURGE!', '#38bdf8');
    } else if (archetype === 'shadowstrider') {
      triggerCombatFeedback('UMBRAL FLURRY!', '#a855f7');
    } else {
      triggerCombatFeedback('DAWN AEGIS!', '#eab308');
    }

    // AoE damage to enemy if in range
    const distToEnemy = s.playerPos.distanceTo(s.enemyPos);
    if (distToEnemy < 6.5 && s.enemyHp > 0) {
      const skillDmg = 95;
      s.enemyHp = Math.max(0, s.enemyHp - skillDmg);
      s.enemyState = 'staggered';
      s.enemyStaggerTimer = 2.0;
      showFloatingText(`SKILL BURST! -${skillDmg}`, s.enemyPos, '#fbbf24');
      audioEngine.playHit(true);
    }
  }, [archetype, onConsumeAether]);

  // Keyboard Event Listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current[key] = true;

      if (key === ' ' || key === 'space') {
        e.preventDefault();
        handleDodge();
      } else if (key === 'f' || key === 'j') {
        handleAttack();
      } else if (key === 'q' || key === 'k') {
        handleParry();
      } else if (key === 'tab') {
        e.preventDefault();
        handleToggleTargetLock();
      } else if (key === 'e' || key === 'r' || key === '1') {
        if (nearbyNpcRef.current) {
          handleInteractWithNpc(nearbyNpcRef.current);
        } else {
          handleClassSkill();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current[key] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [handleAttack, handleParry, handleDodge, handleClassSkill, handleInteractWithNpc]);

  // Initialize Three.js 3D World
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // 1. Scene & Cinematic Dark Fantasy Atmosphere
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e131f);
    scene.fog = new THREE.FogExp2(0x0e131f, 0.016);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200);
    camera.position.set(0, 4, 12);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    // 4. Lighting (Eclipse Corona Atmosphere with High-Contrast Player Readability)
    const ambientLight = new THREE.AmbientLight(0x1e2436, 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffecd1, 2.6);
    sunLight.position.set(30, 48, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 140;
    const d = 42;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    scene.add(sunLight);

    // Rim light from the dark horizon for silhouette separation
    const rimLight = new THREE.DirectionalLight(0x818cf8, 1.5);
    rimLight.position.set(-25, 22, -35);
    scene.add(rimLight);

    // Dedicated fill light for player character contrast against dark terrain
    const playerFillLight = new THREE.DirectionalLight(0xfef3c7, 0.7);
    playerFillLight.position.set(0, 16, 22);
    scene.add(playerFillLight);

    // 5. Ashen Shoreline Procedural Coastal Terrain
    const { terrainMesh } = createAshenShorelineTerrain();
    scene.add(terrainMesh);

    // 6. Dynamic Ocean Water Body with animated waves and foam surf
    const oceanSystem = createDynamicOceanWater();
    scene.add(oceanSystem.waterGroup);

    // 7. Modular Rocks, Weathered Boulders & Coastal Cliffs
    const rockSystem = createModularRocks();
    scene.add(rockSystem);

    // 8. Modular Coastal Vegetation (Twisted Pines, Sea Grass, Deadwood)
    const vegSystem = createModularVegetation();
    scene.add(vegSystem);

    // 9. Echo Camp Settlement (Tier 1 Beachhead with Functional Stations & Resident NPCs)
    const { campGroup, campLights, npcs: campNpcs } = createEchoCampSettlement(settlementTier);
    scene.add(campGroup);

    // 10. Ancient First Sun Ruins & Sunken Sanctum Portal Archway (North-West)
    const ancientRuinsGroup = createAncientRuins();
    scene.add(ancientRuinsGroup);

    // 11. Corrupted Twilight Eclipse Incursion Zone (East)
    const eclipseZone = createCorruptedEclipseZone();
    scene.add(eclipseZone.zoneGroup);

    // 12. Coastal Smuggler's Sea-Cliff Cave Entrance (North-East)
    const caveGroup = createCoastalCave();
    scene.add(caveGroup);

    // 8. 3D PLAYER MESH (Humanoid with Customization & Kinematic Joint Animations)
    const playerGroup = new THREE.Group();
    playerGroup.name = 'player';
    playerGroup.position.copy(gameStateRef.current.playerPos);

    const playerAsset = createHumanoidPlayerCharacter(
      appearance,
      archetype,
      specialization,
      equippedWeapon as WeaponType,
      transmog
    );
    playerGroup.add(playerAsset.rootGroup);

    // Centralized Master Rig (GLB/GLTF/FBX) & External Asset Pipeline
    setAnimController(playerAsset.animationController);
    playerAsset.loadMasterCharacter();
    playerAsset.loadExternalGLB('/assets/characters/aethelgard-hero.glb').then(loaded => {
      if (loaded) setIsExternalGLBActive(true);
    });

    // Player Shadow Pedestal Disc
    const shadowDiscGeo = new THREE.CircleGeometry(0.45, 16);
    const shadowDiscMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.4
    });
    const shadowDisc = new THREE.Mesh(shadowDiscGeo, shadowDiscMat);
    shadowDisc.rotation.x = -Math.PI / 2;
    shadowDisc.position.y = 0.02;
    playerGroup.add(shadowDisc);

    scene.add(playerGroup);

    // 9. 3D ENEMY: ABYSSAL VOIDSTALKER
    const enemyGroup = new THREE.Group();
    enemyGroup.name = 'enemy';
    enemyGroup.position.copy(gameStateRef.current.enemyPos);

    // Chitinous Body
    const enemyBodyGeo = new THREE.DodecahedronGeometry(0.7, 1);
    const enemyMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      metalness: 0.8,
      roughness: 0.25,
      emissive: 0x581c87,
      emissiveIntensity: 0.4
    });
    const enemyBody = new THREE.Mesh(enemyBodyGeo, enemyMat);
    enemyBody.position.y = 1.2;
    enemyBody.castShadow = true;
    enemyGroup.add(enemyBody);

    // Glowing Multi-Eye Cluster
    const eyeClusterGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const eyeClusterMat = new THREE.MeshStandardMaterial({
      color: 0xec4899,
      emissive: 0xec4899,
      emissiveIntensity: 1.5
    });
    const eyes = new THREE.Mesh(eyeClusterGeo, eyeClusterMat);
    eyes.position.set(0, 1.45, 0.55);
    enemyGroup.add(eyes);

    // Scythe Blades
    const scytheGeo = new THREE.ConeGeometry(0.12, 1.4, 6);
    const leftScythe = new THREE.Mesh(scytheGeo, enemyMat);
    leftScythe.position.set(-0.8, 1.1, 0.4);
    leftScythe.rotation.z = Math.PI / 3;
    enemyGroup.add(leftScythe);

    const rightScythe = new THREE.Mesh(scytheGeo, enemyMat);
    rightScythe.position.set(0.8, 1.1, 0.4);
    rightScythe.rotation.z = -Math.PI / 3;
    enemyGroup.add(rightScythe);

    // Ground Hazard Telegraph Arc
    const telegraphGeo = new THREE.RingGeometry(0.4, 2.8, 32);
    const telegraphMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    const telegraphMesh = new THREE.Mesh(telegraphGeo, telegraphMat);
    telegraphMesh.name = 'telegraph';
    telegraphMesh.rotation.x = -Math.PI / 2;
    telegraphMesh.position.y = 0.03;
    enemyGroup.add(telegraphMesh);

    // Soft-Lock Target Reticle Indicator
    const reticleGroup = new THREE.Group();
    reticleGroup.name = 'targetReticle';
    reticleGroup.position.y = 0.05;

    const ringGeo = new THREE.RingGeometry(1.35, 1.52, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    reticleGroup.add(ringMesh);

    for (let p = 0; p < 4; p++) {
      const pipGeo = new THREE.BoxGeometry(0.12, 0.02, 0.35);
      const pipMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
      const pipMesh = new THREE.Mesh(pipGeo, pipMat);
      const angle = (p * Math.PI) / 2;
      pipMesh.position.set(Math.sin(angle) * 1.45, 0.01, Math.cos(angle) * 1.45);
      pipMesh.rotation.y = angle;
      reticleGroup.add(pipMesh);
    }
    enemyGroup.add(reticleGroup);

    scene.add(enemyGroup);

    // 10. 3D COMPANION: KAELEN DRAKE
    const compGroup = new THREE.Group();
    compGroup.name = 'companion';
    compGroup.position.copy(gameStateRef.current.companionPos);

    const compTorsoGeo = new THREE.CylinderGeometry(0.28, 0.2, 0.75, 12);
    const compMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
    const compTorso = new THREE.Mesh(compTorsoGeo, compMat);
    compTorso.position.y = 1.05;
    compTorso.castShadow = true;
    compGroup.add(compTorso);

    const compHeadGeo = new THREE.SphereGeometry(0.18, 14, 14);
    const compSkinMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.7 });
    const compHead = new THREE.Mesh(compHeadGeo, compSkinMat);
    compHead.position.y = 1.6;
    compHead.castShadow = true;
    compGroup.add(compHead);

    scene.add(compGroup);

    // Mouse drag for camera orbit
    const onMouseDown = (e: MouseEvent) => {
      mouseState.current.isDragging = true;
      mouseState.current.prevX = e.clientX;
      mouseState.current.prevY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!mouseState.current.isDragging) return;
      const dx = e.clientX - mouseState.current.prevX;
      const dy = e.clientY - mouseState.current.prevY;
      mouseState.current.prevX = e.clientX;
      mouseState.current.prevY = e.clientY;

      const s = gameStateRef.current;
      s.camRotY -= dx * 0.006;
      s.camPitch = Math.max(0.1, Math.min(1.1, s.camPitch + dy * 0.005));
    };

    const onMouseUp = () => {
      mouseState.current.isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const s = gameStateRef.current;
      s.camDistance = Math.max(3.0, Math.min(14.0, s.camDistance + e.deltaY * 0.005));
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    // Window Resize Observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 11. MAIN 60 FPS SIMULATION LOOP
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const delta = Math.min(0.1, clock.getDelta());
      const elapsedTime = clock.getElapsedTime();
      const s = gameStateRef.current;

      // --- UNIFIED PLAYER MOVEMENT & INPUT PHYSICS (KEYBOARD + VIRTUAL JOYSTICK) ---
      const keys = keysPressed.current;
      const touch = touchInputRef.current;

      let moveX = 0;
      let moveZ = 0;

      // Keyboard WASD / Arrows
      if (keys['w'] || keys['arrowup']) moveZ -= 1;
      if (keys['s'] || keys['arrowdown']) moveZ += 1;
      if (keys['a'] || keys['arrowleft']) moveX -= 1;
      if (keys['d'] || keys['arrowright']) moveX += 1;

      // Virtual Joystick (Analog input blend)
      const hasJoystickInput = touch.magnitude > 0.12;
      if (hasJoystickInput) {
        moveX = touch.x;
        moveZ = -touch.y; // Up on joystick is forward (-Z in camera orientation)
      }

      const inputMag = hasJoystickInput ? touch.magnitude : (moveX !== 0 || moveZ !== 0 ? 1 : 0);
      const isSprinting = (keys['shift'] || touch.isSprint) && inputMag > 0;

      let moveSpeed = 5.2;
      if (isSprinting && playerStamina > 4) {
        moveSpeed = 8.5;
        onConsumeStamina(delta * 12);
      } else if (hasJoystickInput && inputMag < 0.52) {
        moveSpeed = 3.2; // Controlled walk
      } else {
        moveSpeed = 5.2; // Standard run
      }

      // Calculate camera relative direction
      if ((moveX !== 0 || moveZ !== 0) && !s.isDodging) {
        const inputAngle = Math.atan2(moveX, moveZ);
        // Camera-relative movement: W/Up = forward (-Z), S/Down = backward (+Z),
        // A/Left = left (-X), D/Right = right (+X). The previous +PI inverted WASD.
        const targetRotY = s.camRotY + inputAngle;
        s.playerRotY = targetRotY;

        const moveDir = new THREE.Vector3(
          Math.sin(targetRotY),
          0,
          Math.cos(targetRotY)
        ).normalize();

        const speedScale = hasJoystickInput ? Math.min(1, inputMag * 1.2) : 1;
        s.playerVelocity.x = moveDir.x * (moveSpeed * speedScale);
        s.playerVelocity.z = moveDir.z * (moveSpeed * speedScale);
      } else if (!s.isDodging) {
        s.playerVelocity.x *= 0.8;
        s.playerVelocity.z *= 0.8;
      }

      // Update skill cooldown countdown
      if (skillCooldownTimerRef.current > 0) {
        skillCooldownTimerRef.current = Math.max(0, skillCooldownTimerRef.current - delta);
        setSkillCooldownSec(skillCooldownTimerRef.current);
      }

      // Apply Velocity & Clamp World Boundaries
      s.playerPos.x = Math.max(-55, Math.min(55, s.playerPos.x + s.playerVelocity.x * delta));
      s.playerPos.z = Math.max(-42, Math.min(36, s.playerPos.z + s.playerVelocity.z * delta));
      s.playerPos.y = getTerrainHeight(s.playerPos.x, s.playerPos.z);

      // Update Player Mesh Position & Rotation
      playerGroup.position.copy(s.playerPos);
      playerGroup.rotation.y = s.playerRotY;

      // Kinematic Player Animation State
      let playerAnimState: CharacterAnimationState = 'idle';
      let actionProgress = 0.0;

      // Player Timers (Attack, Dodge, Parry)
      if (s.isDodging) {
        playerAnimState = 'dodge';
        actionProgress = Math.max(0, Math.min(1, 1 - (s.dodgeTimer / 0.45)));
        s.dodgeTimer -= delta;
        if (s.dodgeTimer <= 0) {
          s.isDodging = false;
          playerGroup.rotation.x = 0; // Reset roll rotation
        }
      } else if (s.isAttacking) {
        playerAnimState = 'attack';
        actionProgress = Math.max(0, Math.min(1, 1 - (s.attackTimer / 0.35)));
        s.attackTimer -= delta;
        if (s.attackTimer <= 0) {
          s.isAttacking = false;
        }
      } else if (s.isParrying) {
        playerAnimState = 'parry';
        s.parryTimer -= delta;
        if (s.parryTimer <= 0) s.isParrying = false;
      } else if (isSprinting) {
        playerAnimState = 'sprint';
      } else if (moveX !== 0 || moveZ !== 0) {
        playerAnimState = 'run';
      } else if (s.enemyHp <= 0) {
        playerAnimState = 'triumph';
      }

      playerAsset.applyAnimationState(playerAnimState, elapsedTime, delta, actionProgress, {
        comboIndex: s.attackCombo
      });

      // --- ENEMY AI BEHAVIOR (VOIDSTALKER) ---
      if (s.enemyHp > 0) {
        const distToPlayer = s.enemyPos.distanceTo(s.playerPos);

        // Staggered state
        if (s.enemyState === 'staggered') {
          s.enemyStaggerTimer -= delta;
          if (s.enemyStaggerTimer <= 0) s.enemyState = 'chasing';
        } else if (distToPlayer < 18 && distToPlayer > 2.4) {
          // Chase player
          s.enemyState = 'chasing';
          const toPlayer = s.playerPos.clone().sub(s.enemyPos).normalize();
          s.enemyPos.add(toPlayer.multiplyScalar(3.2 * delta));
          enemyGroup.lookAt(s.playerPos.x, enemyGroup.position.y, s.playerPos.z);
        } else if (distToPlayer <= 2.4) {
          // In attack range
          if (s.enemyState !== 'telegraphing' && s.enemyState !== 'attacking') {
            s.enemyState = 'telegraphing';
            s.enemyTimer = 0.75;
          }
        }

        // Handle Enemy Telegraph and Strike
        if (s.enemyState === 'telegraphing') {
          s.enemyTimer -= delta;
          if (telegraphMesh) {
            (telegraphMesh.material as THREE.MeshBasicMaterial).opacity = (0.75 - s.enemyTimer) * 0.9;
          }

          if (s.enemyTimer <= 0) {
            s.enemyState = 'attacking';
            s.enemyTimer = 0.35;
            if (telegraphMesh) {
              (telegraphMesh.material as THREE.MeshBasicMaterial).opacity = 0;
            }

            // Check if player parried or dodged
            if (s.isParrying) {
              // PERFECT PARRY!
              s.enemyState = 'staggered';
              s.enemyStaggerTimer = 2.4;
              audioEngine.playPerfectParry();
              triggerCombatFeedback('⚡ PERFECT PARRY! ENEMY STAGGERED!', '#38bdf8');
              showFloatingText('PARRIED!', s.playerPos, '#38bdf8');
            } else if (s.isDodging) {
              // DODGED!
              showFloatingText('EVADED!', s.playerPos, '#a3e635');
            } else {
              // PLAYER HIT
              const dmg = 22;
              onTakeDamage(dmg);
              audioEngine.playHit(false);
              showFloatingText(`-${dmg}`, s.playerPos, '#ef4444');
            }
          }
        } else if (s.enemyState === 'attacking') {
          s.enemyTimer -= delta;
          if (s.enemyTimer <= 0) s.enemyState = 'idle';
        }

        s.enemyPos.y = getTerrainHeight(s.enemyPos.x, s.enemyPos.z);
        enemyGroup.position.copy(s.enemyPos);

        // Update Target Reticle visual cues
        reticleGroup.visible = true;
        reticleGroup.rotation.y += delta * (softLockRef.current ? 2.5 : 0.8);
        ringMat.color.setHex(softLockRef.current ? 0xf59e0b : 0x38bdf8);
        ringMat.opacity = softLockRef.current ? 0.85 : 0.45;
      } else {
        reticleGroup.visible = false;
        // Dead: Dissolve downwards
        if (enemyGroup.position.y > -2) {
          enemyGroup.position.y -= delta * 0.8;
          enemyGroup.scale.multiplyScalar(0.98);
        }
      }

      // --- COMPANION SMOOTH LEASHING & GROUND CONFORMING ---
      const desiredCompPos = s.playerPos.clone().add(
        new THREE.Vector3(-1.8, 0, 1.4).applyAxisAngle(new THREE.Vector3(0, 1, 0), s.playerRotY)
      );
      desiredCompPos.y = getTerrainHeight(desiredCompPos.x, desiredCompPos.z);
      s.companionPos.lerp(desiredCompPos, 0.05);
      s.companionPos.y = getTerrainHeight(s.companionPos.x, s.companionPos.z);
      compGroup.position.copy(s.companionPos);
      compGroup.lookAt(s.playerPos.x, compGroup.position.y, s.playerPos.z);

      // --- ENVIRONMENT & LIGHTING DYNAMICS ---
      oceanSystem.update(elapsedTime);
      eclipseZone.update(elapsedTime);

      if (campLights.fireLight) {
        campLights.fireLight.intensity = 3.2 + Math.sin(elapsedTime * 9.0) * 0.7;
      }
      if (campLights.flameMesh) {
        campLights.flameMesh.scale.y = 1.0 + Math.sin(elapsedTime * 12.0) * 0.15;
      }

      // --- RESIDENT NPC PROXIMITY CHECK ---
      let closestNpc: InteractiveNpcInfo | null = null;
      let closestDist = 3.5;
      for (const npc of campNpcs) {
        const d = s.playerPos.distanceTo(npc.position);
        if (d < closestDist) {
          closestDist = d;
          closestNpc = npc;
        }
      }
      if (closestNpc?.id !== nearbyNpcRef.current?.id) {
        nearbyNpcRef.current = closestNpc;
        setNearbyNpc(closestNpc);
      }

      // --- THIRD-PERSON CAMERA INTERPOLATION ---
      const camY = s.playerPos.y + 1.8 + Math.sin(s.camPitch) * s.camDistance;
      const camDistXZ = Math.cos(s.camPitch) * s.camDistance;
      const camX = s.playerPos.x + Math.sin(s.camRotY) * camDistXZ;
      const camZ = s.playerPos.z + Math.cos(s.camRotY) * camDistXZ;

      camera.position.set(camX, camY, camZ);
      camera.lookAt(s.playerPos.x, s.playerPos.y + 1.4, s.playerPos.z);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      playerAsset.dispose();
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('wheel', onWheel);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, [appearance, archetype, settlementTier, onTakeDamage, onConsumeStamina]);

  return (
    <div ref={containerRef} className={`relative select-none overflow-hidden ${className}`}>
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

      {/* Realtime Mixamo FBX / GLB Animation Debug HUD Overlay */}
      <AnimationDebugHUD controller={animController} isExternalGLB={isExternalGLBActive} />

      {/* 3D Realtime Combat HUD Overlay */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
        {/* Settlement & Region Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-950/80 border border-amber-500/30 backdrop-blur-md">
          <Compass className="w-4 h-4 text-amber-400 animate-spin-slow" />
          <span className="text-xs font-display font-bold text-amber-300">
            ECHO CAMP • TIER {settlementTier}
          </span>
          <span className="text-[10px] font-mono text-neutral-400">
            [Ashen Shoreline • Sunken Sanctum Frontier]
          </span>
        </div>

        {/* Combat Status Toast */}
        {combatFeedback && (
          <div className="px-3.5 py-1.5 rounded-xl bg-neutral-950/90 border border-amber-500/50 text-xs font-bold shadow-lg backdrop-blur-md animate-pulse" style={{ color: combatFeedback.color }}>
            {combatFeedback.text}
          </div>
        )}
      </div>

      {/* Interactive Resident NPC Proximity Prompt */}
      {nearbyNpc && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-neutral-950/90 border border-amber-500/50 shadow-2xl backdrop-blur-md">
          <MessageSquare className="w-4 h-4 text-amber-400 animate-pulse" />
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-amber-300">
              [E] Talk with {nearbyNpc.name}
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">
              {nearbyNpc.title} • {(nearbyNpc.role || 'Resident').toUpperCase()}
            </span>
          </div>
          <button
            onClick={() => handleInteractWithNpc(nearbyNpc)}
            className="ml-2 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black transition-all active:scale-95 shadow-md shadow-amber-500/30"
          >
            TALK
          </button>
        </div>
      )}

      {/* Floating 3D Damage & Combat Text Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {floatingTexts.map(f => (
          <div
            key={f.id}
            className="absolute font-display font-black text-sm drop-shadow-md animate-float-fade"
            style={{
              left: '50%',
              top: '42%',
              color: f.color
            }}
          >
            {f.text}
          </div>
        ))}
      </div>

      {/* Control Mode Toggle Pill */}
      <div className="absolute top-4 left-4 z-40 pointer-events-auto flex items-center gap-2">
        <button
          onClick={() => setTouchControlsEnabled(prev => !prev)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold backdrop-blur-md transition-all active:scale-95 shadow-lg ${
            touchControlsEnabled
              ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-amber-500/10'
              : 'bg-neutral-950/80 border-neutral-800 text-neutral-400 hover:text-neutral-200'
          }`}
          title="Toggle Mobile Touch Controls vs Desktop Mouse/Keyboard HUD"
        >
          {touchControlsEnabled ? (
            <>
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>Touch Controls: ON</span>
            </>
          ) : (
            <>
              <Keyboard className="w-3.5 h-3.5" />
              <span>Touch Controls: OFF</span>
            </>
          )}
        </button>

        <button
          onClick={handleToggleTargetLock}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-mono backdrop-blur-md transition-all active:scale-95 shadow-lg ${
            softLockActive
              ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
              : 'bg-neutral-950/80 border-neutral-800 text-neutral-500'
          }`}
          title="Target Soft-Lock [Tab]"
        >
          <Target className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{softLockActive ? 'LOCK: ON' : 'LOCK: OFF'}</span>
        </button>
      </div>

      {/* MOBILE TOUCH CONTROLS OVERLAY */}
      {touchControlsEnabled && (
        <MobileTouchControls
          onMove={handleJoystickMove}
          onCameraDrag={handleCameraDrag}
          onAttack={handleAttack}
          onParry={handleParry}
          onDodge={handleDodge}
          onSkill={handleClassSkill}
          onInteract={() => {
            if (nearbyNpcRef.current) {
              handleInteractWithNpc(nearbyNpcRef.current);
            }
          }}
          onToggleTargetLock={handleToggleTargetLock}
          targetLockActive={softLockActive}
          nearbyNpcName={nearbyNpc ? nearbyNpc.name : undefined}
          nearbyNpcRole={nearbyNpc ? nearbyNpc.role : undefined}
          archetype={archetype}
          skillCooldownSec={skillCooldownSec}
          comboStep={attackComboState}
          staminaPercent={(playerStamina / maxPlayerStamina) * 100}
          aetherPercent={(playerAether / maxPlayerAether) * 100}
        />
      )}

      {/* Desktop Quick Action Bar Overlay (Hidden when Touch Controls are Active) */}
      {!touchControlsEnabled && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 pointer-events-auto bg-neutral-950/85 p-2 rounded-2xl border border-neutral-800 backdrop-blur-md shadow-2xl">
          {/* Attack Button */}
          <button
            onClick={handleAttack}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs tracking-wider transition-all active:scale-95 shadow-md shadow-amber-500/20"
            title="Light Attack Combo [F / Left Click]"
          >
            <Swords className="w-4 h-4" />
            <span>ATTACK [F]</span>
          </button>

          {/* Parry Button */}
          <button
            onClick={handleParry}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-bold text-xs transition-all active:scale-95"
            title="Timed Parry / Deflection [Q]"
          >
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>PARRY [Q]</span>
          </button>

          {/* Dodge Roll */}
          <button
            onClick={handleDodge}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-bold text-xs transition-all active:scale-95"
            title="Dodge Roll [Space]"
          >
            <Zap className="w-4 h-4 text-yellow-400" />
            <span>DODGE [SPACE]</span>
          </button>

          {/* Awakened Class Skill */}
          <button
            onClick={handleClassSkill}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-500/40 font-bold text-xs transition-all active:scale-95"
            title="Class Awakened Skill [E / 1]"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>SKILL [E]</span>
          </button>

          {/* Forge / Customize 3D Hero */}
          {onOpenCharacter && (
            <button
              onClick={onOpenCharacter}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 font-bold text-xs transition-all active:scale-95 shadow-md shadow-amber-500/10"
              title="Open 3D Character Forge to customize appearance, armor, and weapon"
            >
              <User className="w-4 h-4 text-amber-400" />
              <span>3D FORGE</span>
            </button>
          )}
        </div>
      )}

      {/* On-Screen Controls Legend (Hidden when Touch Controls are Active) */}
      {!touchControlsEnabled && (
        <div className="absolute bottom-4 right-4 z-10 pointer-events-none hidden md:flex flex-col gap-1 text-[10px] font-mono text-neutral-400/80 bg-black/60 px-3 py-2 rounded-xl border border-neutral-800 backdrop-blur-sm">
          <div>WASD: Move Hero • Shift: Sprint</div>
          <div>Drag Mouse: Rotate 3D Camera</div>
          <div>F / Click: Attack • Q: Parry</div>
          <div>Space: Dodge Roll • E: Skill / Speak</div>
          <div>Tab: Target Lock • F3: Anim Debug HUD</div>
        </div>
      )}
    </div>
  );
};
