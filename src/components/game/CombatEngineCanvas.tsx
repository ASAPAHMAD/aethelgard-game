import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  WeaponType, 
  CombatArchetype, 
  EnemyEntity, 
  CampStructure, 
  Companion, 
  Item,
  CharacterAppearance 
} from '../../types/game';
import { audioEngine } from '../../services/audioEngine';

interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
  vy: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
}

interface ResourceNode {
  id: string;
  type: 'ironwood' | 'sunstone' | 'granite' | 'berries';
  name: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  color: string;
}

interface CombatEngineCanvasProps {
  appearance: CharacterAppearance;
  equippedWeapon: WeaponType;
  archetype: CombatArchetype;
  playerHp: number;
  maxPlayerHp: number;
  playerStamina: number;
  maxPlayerStamina: number;
  playerAether: number;
  maxPlayerAether: number;
  companion: Companion;
  structures: CampStructure[];
  isBuildingMode: boolean;
  selectedStructureType: CampStructure['type'];
  cameraDistance: number;
  cameraShakeEnabled: boolean;
  onTakeDamage: (amount: number) => void;
  onConsumeStamina: (amount: number) => boolean;
  onConsumeAether: (amount: number) => boolean;
  onGainXp: (amount: number) => void;
  onLootGained: (item: Item) => void;
  onStructurePlaced: (structure: CampStructure) => void;
  onCompanionSpeech: (line: string) => void;
  activeWorldEvent: boolean;
  onEventProgress: (delta: number) => void;
}

export const CombatEngineCanvas: React.FC<CombatEngineCanvasProps> = ({
  appearance,
  equippedWeapon,
  archetype,
  playerHp,
  maxPlayerHp,
  playerStamina,
  maxPlayerStamina,
  playerAether,
  maxPlayerAether,
  companion,
  structures,
  isBuildingMode,
  selectedStructureType,
  cameraDistance,
  cameraShakeEnabled,
  onTakeDamage,
  onConsumeStamina,
  onConsumeAether,
  onGainXp,
  onLootGained,
  onStructurePlaced,
  onCompanionSpeech,
  activeWorldEvent,
  onEventProgress
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Player state
  const playerPos = useRef<{ x: number; y: number; vx: number; vy: number; rot: number }>({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    rot: 0
  });

  const playerCombatState = useRef<{
    isAttacking: boolean;
    attackType: 'light' | 'heavy' | 'skill1' | 'skill2' | 'ultimate';
    attackTimer: number;
    attackDuration: number;
    comboStep: number;
    isDodging: boolean;
    dodgeTimer: number;
    isBlocking: boolean;
    parryWindow: number;
    isSlowMo: number;
    lockedTargetId: string | null;
  }>({
    isAttacking: false,
    attackType: 'light',
    attackTimer: 0,
    attackDuration: 0,
    comboStep: 1,
    isDodging: false,
    dodgeTimer: 0,
    isBlocking: false,
    parryWindow: 0,
    isSlowMo: 0,
    lockedTargetId: null
  });

  // Camera state
  const camera = useRef<{ x: number; y: number; shake: number }>({ x: 0, y: 0, shake: 0 });

  // Input states
  const keysDown = useRef<Record<string, boolean>>({});
  const mousePos = useRef<{ x: number; y: number; worldX: number; worldY: number }>({
    x: 0,
    y: 0,
    worldX: 0,
    worldY: 0
  });

  // Visual simulation arrays
  const particles = useRef<Particle[]>([]);
  const floatingTexts = useRef<FloatingText[]>([]);

  // Enemies array
  const enemies = useRef<EnemyEntity[]>([
    {
      id: 'en_thresher_1',
      name: 'Corrupted Thresher',
      type: 'thresher',
      maxHp: 180,
      hp: 180,
      maxStagger: 100,
      stagger: 0,
      damage: 18,
      speed: 2.2,
      x: 180,
      y: 120,
      rotation: 0,
      radius: 24,
      state: 'idle',
      telegraphTimer: 0,
      telegraphMax: 0.9,
      attackCooldown: 1.2,
      color: '#e63946',
      drops: [{ itemId: 'mat_sunstone', chance: 0.8, min: 1, max: 2 }]
    },
    {
      id: 'en_stalker_1',
      name: 'Dusk Stalker',
      type: 'stalker',
      maxHp: 140,
      hp: 140,
      maxStagger: 80,
      stagger: 0,
      damage: 24,
      speed: 3.1,
      x: -220,
      y: 160,
      rotation: 0,
      radius: 20,
      state: 'idle',
      telegraphTimer: 0,
      telegraphMax: 0.6,
      attackCooldown: 1.5,
      color: '#9d4edd',
      drops: [{ itemId: 'mat_ironwood', chance: 0.9, min: 2, max: 4 }]
    },
    {
      id: 'en_brute_1',
      name: 'Bramble Brute',
      type: 'brute',
      maxHp: 320,
      hp: 320,
      maxStagger: 180,
      stagger: 0,
      damage: 32,
      speed: 1.6,
      x: 350,
      y: -140,
      rotation: 0,
      radius: 34,
      state: 'idle',
      telegraphTimer: 0,
      telegraphMax: 1.3,
      attackCooldown: 2.0,
      color: '#2a9d8f',
      drops: [{ itemId: 'mat_stone', chance: 1.0, min: 3, max: 6 }]
    },
    {
      id: 'boss_gorgarok',
      name: 'Gorgarok the Crystal Devourer',
      type: 'gorgarok',
      isBoss: true,
      maxHp: 1200,
      hp: 1200,
      maxStagger: 400,
      stagger: 0,
      damage: 45,
      speed: 1.8,
      x: 600,
      y: 400,
      rotation: 0,
      radius: 56,
      state: 'idle',
      telegraphTimer: 0,
      telegraphMax: 1.6,
      attackCooldown: 1.8,
      color: '#f4a261',
      phase: 1,
      drops: [
        { itemId: 'mat_sunstone', chance: 1.0, min: 4, max: 8 },
        { itemId: 'cons_potion', chance: 1.0, min: 2, max: 3 }
      ]
    }
  ]);

  // Resource gathering nodes
  const resourceNodes = useRef<ResourceNode[]>([
    { id: 'res_1', type: 'ironwood', name: 'Petrified Ironwood', x: -140, y: -90, hp: 40, maxHp: 40, color: '#8b5a2b' },
    { id: 'res_2', type: 'sunstone', name: 'Sunstone Crystal Node', x: 260, y: -220, hp: 50, maxHp: 50, color: '#ffd166' },
    { id: 'res_3', type: 'granite', name: 'Granite Outcrop', x: -300, y: 50, hp: 60, maxHp: 60, color: '#6c757d' },
    { id: 'res_4', type: 'berries', name: 'Moon-berry Bush', x: 80, y: -260, hp: 20, maxHp: 20, color: '#7209b7' },
    { id: 'res_5', type: 'ironwood', name: 'Ancient Driftwood Tree', x: 400, y: 150, hp: 40, maxHp: 40, color: '#8b5a2b' }
  ]);

  // Companion state
  const companionPos = useRef<{ x: number; y: number; state: string; targetId: string | null }>({
    x: -40,
    y: 30,
    state: 'follow',
    targetId: null
  });

  // Spawn particle helper
  const addParticles = (x: number, y: number, color: string, count: number = 8, speed: number = 3) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const vel = (Math.random() * 0.7 + 0.3) * speed;
      particles.current.push({
        x,
        y,
        vx: Math.cos(angle) * vel,
        vy: Math.sin(angle) * vel,
        size: Math.random() * 3 + 2,
        color,
        alpha: 1.0,
        decay: Math.random() * 0.03 + 0.02
      });
    }
  };

  // Add floating combat text
  const addFloatingText = (x: number, y: number, text: string, color: string = '#ffffff', scale: number = 1) => {
    floatingTexts.current.push({
      id: Math.random().toString(),
      x: x + (Math.random() * 20 - 10),
      y: y - 10,
      text,
      color,
      alpha: 1.0,
      scale,
      vy: -1.4
    });
  };

  // Trigger camera shake
  const triggerShake = (intensity: number = 6) => {
    if (cameraShakeEnabled) {
      camera.current.shake = intensity;
    }
  };

  // Trigger player light attack
  const triggerLightAttack = useCallback(() => {
    const cs = playerCombatState.current;
    if (cs.isAttacking || cs.isDodging || cs.isBlocking) return;
    if (!onConsumeStamina(15)) return;

    cs.isAttacking = true;
    cs.attackType = 'light';
    cs.attackTimer = 0.28;
    cs.attackDuration = 0.28;
    cs.comboStep = (cs.comboStep % 3) + 1;

    audioEngine.playSwing('light');
    triggerShake(2);

    // Lunging step
    const rot = playerPos.current.rot;
    playerPos.current.vx += Math.cos(rot) * 3.5;
    playerPos.current.vy += Math.sin(rot) * 3.5;
  }, [onConsumeStamina]);

  // Trigger player heavy attack
  const triggerHeavyAttack = useCallback(() => {
    const cs = playerCombatState.current;
    if (cs.isAttacking || cs.isDodging || cs.isBlocking) return;
    if (!onConsumeStamina(30)) return;

    cs.isAttacking = true;
    cs.attackType = 'heavy';
    cs.attackTimer = 0.55;
    cs.attackDuration = 0.55;

    audioEngine.playSwing('heavy');
    triggerShake(4);

    const rot = playerPos.current.rot;
    playerPos.current.vx += Math.cos(rot) * 2.0;
    playerPos.current.vy += Math.sin(rot) * 2.0;
  }, [onConsumeStamina]);

  // Trigger dodge roll
  const triggerDodge = useCallback(() => {
    const cs = playerCombatState.current;
    if (cs.isDodging) return;
    if (!onConsumeStamina(20)) return;

    cs.isDodging = true;
    cs.dodgeTimer = 0.35;
    cs.isAttacking = false;
    cs.isBlocking = false;

    audioEngine.playDodge();
    addParticles(playerPos.current.x, playerPos.current.y, '#ffd166', 10, 2);

    // Direction of movement or current rotation
    let dx = 0;
    let dy = 0;
    if (keysDown.current['KeyW']) dy -= 1;
    if (keysDown.current['KeyS']) dy += 1;
    if (keysDown.current['KeyA']) dx -= 1;
    if (keysDown.current['KeyD']) dx += 1;

    let dirAngle = playerPos.current.rot;
    if (dx !== 0 || dy !== 0) {
      dirAngle = Math.atan2(dy, dx);
    }

    playerPos.current.vx = Math.cos(dirAngle) * 8.5;
    playerPos.current.vy = Math.sin(dirAngle) * 8.5;
  }, [onConsumeStamina]);

  // Trigger Block / Parry
  const triggerBlockStart = useCallback(() => {
    const cs = playerCombatState.current;
    if (cs.isDodging) return;
    cs.isBlocking = true;
    cs.parryWindow = 0.22; // 220ms tight window for perfect parry!
    audioEngine.playBlock();
  }, []);

  const triggerBlockEnd = useCallback(() => {
    playerCombatState.current.isBlocking = false;
    playerCombatState.current.parryWindow = 0;
  }, []);

  // Trigger Active Skill 1 (Solar Cleave)
  const triggerSkill1 = useCallback(() => {
    const cs = playerCombatState.current;
    if (cs.isAttacking || cs.isDodging) return;
    if (!onConsumeStamina(25) || !onConsumeAether(15)) return;

    cs.isAttacking = true;
    cs.attackType = 'skill1';
    cs.attackTimer = 0.4;
    cs.attackDuration = 0.4;

    audioEngine.playCastSpell();
    triggerShake(6);
    addParticles(playerPos.current.x, playerPos.current.y, '#f77f00', 25, 4.5);
  }, [onConsumeStamina, onConsumeAether]);

  // Trigger Active Skill 2 (Aether Rush)
  const triggerSkill2 = useCallback(() => {
    const cs = playerCombatState.current;
    if (cs.isAttacking || cs.isDodging) return;
    if (!onConsumeStamina(20) || !onConsumeAether(20)) return;

    cs.isAttacking = true;
    cs.attackType = 'skill2';
    cs.attackTimer = 0.35;
    cs.attackDuration = 0.35;

    const rot = playerPos.current.rot;
    playerPos.current.vx = Math.cos(rot) * 11;
    playerPos.current.vy = Math.sin(rot) * 11;

    audioEngine.playCastSpell();
    triggerShake(5);
    addParticles(playerPos.current.x, playerPos.current.y, '#4cc9f0', 20, 4);
  }, [onConsumeStamina, onConsumeAether]);

  // Trigger Ultimate (Wrath of the Zenith)
  const triggerUltimate = useCallback(() => {
    const cs = playerCombatState.current;
    if (cs.isAttacking || cs.isDodging) return;
    if (!onConsumeAether(80)) return;

    cs.isAttacking = true;
    cs.attackType = 'ultimate';
    cs.attackTimer = 0.8;
    cs.attackDuration = 0.8;

    audioEngine.playCastSpell();
    triggerShake(12);

    addParticles(playerPos.current.x, playerPos.current.y, '#ffd166', 50, 7);
    addParticles(playerPos.current.x, playerPos.current.y, '#ffffff', 30, 8);

    // Massive AoE damage
    enemies.current.forEach(enemy => {
      const dist = Math.hypot(enemy.x - playerPos.current.x, enemy.y - playerPos.current.y);
      if (dist < 260) {
        enemy.hp -= 320;
        enemy.stagger += 200;
        addFloatingText(enemy.x, enemy.y, '320 SUNSTRIKE!', '#ffd166', 1.6);
        addParticles(enemy.x, enemy.y, '#ffd166', 20, 5);
      }
    });

    onCompanionSpeech('"Behold the fire of the First Sun! Strike them down!"');
  }, [onConsumeAether, onCompanionSpeech]);

  // Interactive gathering
  const handleGathering = useCallback(() => {
    const px = playerPos.current.x;
    const py = playerPos.current.y;

    for (let node of resourceNodes.current) {
      const dist = Math.hypot(node.x - px, node.y - py);
      if (dist < 60) {
        node.hp -= 15;
        audioEngine.playGather();
        addParticles(node.x, node.y, node.color, 10, 2.5);

        if (node.hp <= 0) {
          addFloatingText(node.x, node.y, `Harvested ${node.name}!`, '#52b788', 1.2);
          onGainXp(35);
          if (node.type === 'ironwood') {
            onLootGained({
              id: 'mat_ironwood',
              name: 'Petrified Ironwood',
              type: 'material',
              rarity: 'common',
              description: 'Timber for camp construction.',
              icon: 'TreePine',
              value: 8,
              quantity: 4
            });
          } else if (node.type === 'sunstone') {
            onLootGained({
              id: 'mat_sunstone',
              name: 'Sunstone Aether Shard',
              type: 'material',
              rarity: 'rare',
              description: 'Crystalline solar shard.',
              icon: 'Sparkles',
              value: 25,
              quantity: 2
            });
          } else if (node.type === 'granite') {
            onLootGained({
              id: 'mat_stone',
              name: 'Quarried Granite',
              type: 'material',
              rarity: 'common',
              description: 'Dense building stone.',
              icon: 'Box',
              value: 5,
              quantity: 5
            });
          }
          // Reset after a while
          node.hp = node.maxHp;
        } else {
          addFloatingText(node.x, node.y, `Gathering...`, '#ffffff', 0.9);
        }
        return;
      }
    }
  }, [onGainXp, onLootGained]);

  // Handle building placement
  const handlePlaceStructure = useCallback(() => {
    if (!isBuildingMode) return;
    const wx = mousePos.current.worldX;
    const wy = mousePos.current.worldY;

    // Check collision with player
    const distToPlayer = Math.hypot(wx - playerPos.current.x, wy - playerPos.current.y);
    if (distToPlayer < 35 || distToPlayer > 300) return;

    const names: Record<CampStructure['type'], string> = {
      campfire: 'Driftwood Campfire',
      workbench: 'Carpenter Workbench',
      palisade: 'Reinforced Palisade Wall',
      watchtower: 'Scout Watchtower',
      forge: 'Sunsteel Smelting Forge',
      shelter: 'Canvas Survivor Shelter'
    };

    const newStruct: CampStructure = {
      id: 'struct_' + Math.random().toString(36).substr(2, 9),
      type: selectedStructureType,
      name: names[selectedStructureType] || 'Settlement Structure',
      x: Math.round(wx / 20) * 20,
      y: Math.round(wy / 20) * 20,
      hp: 200,
      maxHp: 200,
      level: 1
    };

    onStructurePlaced(newStruct);
    audioEngine.playGather();
    addParticles(newStruct.x, newStruct.y, '#d4af37', 20, 3);
    addFloatingText(newStruct.x, newStruct.y, `Constructed ${newStruct.name}!`, '#ffd166', 1.2);
  }, [isBuildingMode, selectedStructureType, onStructurePlaced]);

  // Window listeners for mouse and keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysDown.current[e.code] = true;

      if (e.code === 'KeyE') {
        handleGathering();
      } else if (e.code === 'Space') {
        e.preventDefault();
        triggerDodge();
      } else if (e.code === 'Digit1') {
        triggerSkill1();
      } else if (e.code === 'Digit2') {
        triggerSkill2();
      } else if (e.code === 'KeyR') {
        triggerUltimate();
      } else if (e.code === 'KeyQ') {
        triggerBlockStart();
      } else if (e.code === 'Tab') {
        e.preventDefault();
        // Cycle lock target
        const livingEnemies = enemies.current.filter(en => en.hp > 0);
        if (livingEnemies.length > 0) {
          const currentIndex = livingEnemies.findIndex(
            en => en.id === playerCombatState.current.lockedTargetId
          );
          const nextIndex = (currentIndex + 1) % livingEnemies.length;
          playerCombatState.current.lockedTargetId = livingEnemies[nextIndex].id;
        } else {
          playerCombatState.current.lockedTargetId = null;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown.current[e.code] = false;
      if (e.code === 'KeyQ') {
        triggerBlockEnd();
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (isBuildingMode) {
        if (e.button === 0) handlePlaceStructure();
        return;
      }
      if (e.button === 0) {
        triggerLightAttack();
      } else if (e.button === 2) {
        e.preventDefault();
        triggerHeavyAttack();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      mousePos.current.x = mx;
      mousePos.current.y = my;
      // World coordinates
      const scale = cameraDistance;
      mousePos.current.worldX = (mx - canvas.width / 2) / scale + camera.current.x;
      mousePos.current.worldY = (my - canvas.height / 2) / scale + camera.current.y;
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [
    triggerDodge,
    triggerLightAttack,
    triggerHeavyAttack,
    triggerBlockStart,
    triggerBlockEnd,
    triggerSkill1,
    triggerSkill2,
    triggerUltimate,
    handleGathering,
    handlePlaceStructure,
    isBuildingMode,
    cameraDistance
  ]);

  // Main game simulation loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const render = (currentTime: number) => {
      let dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      if (dt > 0.1) dt = 0.1; // Clamp lag spikes

      const cs = playerCombatState.current;
      if (cs.isSlowMo > 0) {
        cs.isSlowMo -= dt;
        dt *= 0.35; // Slow-mo duration for dramatic perfect parry feel
      }

      // --- 1. PLAYER INPUT & MOVEMENT ---
      const p = playerPos.current;
      let moveX = 0;
      let moveY = 0;
      if (keysDown.current['KeyW']) moveY -= 1;
      if (keysDown.current['KeyS']) moveY += 1;
      if (keysDown.current['KeyA']) moveX -= 1;
      if (keysDown.current['KeyD']) moveX += 1;

      const len = Math.hypot(moveX, moveY);
      const baseSpeed = cs.isBlocking ? 1.6 : cs.isAttacking ? 0.9 : 4.0;

      if (len > 0 && !cs.isDodging) {
        p.vx += (moveX / len) * baseSpeed * 0.45;
        p.vy += (moveY / len) * baseSpeed * 0.45;
      }

      // Physics damping
      p.vx *= 0.82;
      p.vy *= 0.82;
      p.x += p.vx;
      p.y += p.vy;

      // Rotation towards mouse or locked target
      if (cs.lockedTargetId) {
        const lockedEnemy = enemies.current.find(e => e.id === cs.lockedTargetId && e.hp > 0);
        if (lockedEnemy) {
          p.rot = Math.atan2(lockedEnemy.y - p.y, lockedEnemy.x - p.x);
        } else {
          cs.lockedTargetId = null;
        }
      } else {
        p.rot = Math.atan2(mousePos.current.worldY - p.y, mousePos.current.worldX - p.x);
      }

      // Combat timers
      if (cs.isAttacking) {
        cs.attackTimer -= dt;
        if (cs.attackTimer <= 0) {
          cs.isAttacking = false;
        }
      }

      if (cs.isDodging) {
        cs.dodgeTimer -= dt;
        if (cs.dodgeTimer <= 0) {
          cs.isDodging = false;
        }
      }

      if (cs.parryWindow > 0) {
        cs.parryWindow -= dt;
      }

      // --- 2. PLAYER ATTACK HITBOX CHECK ---
      if (cs.isAttacking && cs.attackTimer > cs.attackDuration * 0.3 && cs.attackTimer < cs.attackDuration * 0.7) {
        const hitAngle = p.rot;
        const hitArc = cs.attackType === 'skill1' ? Math.PI * 2 : Math.PI * 0.65;
        const hitRange = cs.attackType === 'heavy' ? 75 : cs.attackType === 'skill1' ? 90 : 60;
        const baseDmg = cs.attackType === 'heavy' ? 70 : cs.attackType === 'skill1' ? 95 : 35 * (1 + cs.comboStep * 0.2);

        enemies.current.forEach(enemy => {
          if (enemy.hp <= 0) return;
          const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
          if (dist < hitRange + enemy.radius) {
            const angleToEnemy = Math.atan2(enemy.y - p.y, enemy.x - p.x);
            const angleDiff = Math.abs((angleToEnemy - hitAngle + Math.PI * 3) % (Math.PI * 2) - Math.PI);

            if (angleDiff < hitArc / 2) {
              const isCrit = Math.random() < 0.25;
              const dmg = Math.round(baseDmg * (isCrit ? 1.6 : 1.0));
              enemy.hp -= dmg;
              enemy.stagger += cs.attackType === 'heavy' ? 45 : 18;

              audioEngine.playHit(isCrit);
              addParticles(enemy.x, enemy.y, '#e63946', isCrit ? 12 : 6, 3);
              addFloatingText(enemy.x, enemy.y, `${dmg}${isCrit ? ' CRIT!' : ''}`, isCrit ? '#ffd166' : '#ffffff', isCrit ? 1.4 : 1.0);
              triggerShake(isCrit ? 4 : 2);

              // Knockback
              enemy.x += Math.cos(angleToEnemy) * 12;
              enemy.y += Math.sin(angleToEnemy) * 12;

              if (enemy.hp <= 0) {
                enemy.state = 'dead';
                addFloatingText(enemy.x, enemy.y, `Defeated ${enemy.name}!`, '#52b788', 1.3);
                onGainXp(enemy.isBoss ? 450 : 80);
                if (activeWorldEvent) {
                  onEventProgress(enemy.isBoss ? 50 : 15);
                }
                // Drop loot
                enemy.drops.forEach(drop => {
                  if (Math.random() < drop.chance) {
                    const qty = Math.floor(Math.random() * (drop.max - drop.min + 1)) + drop.min;
                    onLootGained({
                      id: drop.itemId,
                      name: (drop.itemId || 'spoils').replace('mat_', '').replace('_', ' ').toUpperCase(),
                      type: 'material',
                      rarity: 'rare',
                      description: 'Valuable spoils of battle.',
                      icon: 'Sparkles',
                      value: 30,
                      quantity: qty
                    });
                  }
                });
              }
            }
          }
        });
      }

      // --- 3. COMPANION AI (KAELEN) ---
      const comp = companionPos.current;
      const targetEnemy = enemies.current.find(e => e.hp > 0 && Math.hypot(e.x - p.x, e.y - p.y) < 320);

      if (targetEnemy) {
        // Move toward enemy and strike
        const angleToTgt = Math.atan2(targetEnemy.y - comp.y, targetEnemy.x - comp.x);
        const distToTgt = Math.hypot(targetEnemy.x - comp.x, targetEnemy.y - comp.y);

        if (distToTgt > 45) {
          comp.x += Math.cos(angleToTgt) * 2.8;
          comp.y += Math.sin(angleToTgt) * 2.8;
        } else {
          // Companion attacks periodically
          if (Math.random() < 0.04) {
            targetEnemy.hp -= 25;
            targetEnemy.stagger += 20;
            audioEngine.playSwing('light');
            audioEngine.playHit();
            addFloatingText(targetEnemy.x, targetEnemy.y, '25 (Kaelen)', '#64dfdf', 1.0);
            addParticles(targetEnemy.x, targetEnemy.y, '#64dfdf', 6, 2);
          }
        }
      } else {
        // Return and follow player shoulder
        const targetX = p.x - Math.cos(p.rot) * 45 - Math.sin(p.rot) * 35;
        const targetY = p.y - Math.sin(p.rot) * 45 + Math.cos(p.rot) * 35;
        comp.x += (targetX - comp.x) * 0.08;
        comp.y += (targetY - comp.y) * 0.08;
      }

      // --- 4. ENEMY AI & TELEGRAPH COMBAT ---
      let anyAggro = false;
      enemies.current.forEach(enemy => {
        if (enemy.hp <= 0) return;

        const distToPlayer = Math.hypot(p.x - enemy.x, p.y - enemy.y);
        const distToCompanion = Math.hypot(comp.x - enemy.x, comp.y - enemy.y);
        const closestTarget = distToPlayer < distToCompanion ? { x: p.x, y: p.y, isPlayer: true } : { x: comp.x, y: comp.y, isPlayer: false };
        const dist = Math.hypot(closestTarget.x - enemy.x, closestTarget.y - enemy.y);

        if (dist < 380) {
          anyAggro = true;
          enemy.rotation = Math.atan2(closestTarget.y - enemy.y, closestTarget.x - enemy.x);

          if (enemy.state === 'staggered') {
            enemy.stagger -= dt * 25;
            if (enemy.stagger <= 0) {
              enemy.state = 'chasing';
            }
          } else if (enemy.state === 'idle' || enemy.state === 'chasing') {
            if (dist > enemy.radius + 30) {
              enemy.x += Math.cos(enemy.rotation) * enemy.speed;
              enemy.y += Math.sin(enemy.rotation) * enemy.speed;
            } else {
              // Initiate telegraphed attack
              enemy.state = 'telegraphing';
              enemy.telegraphTimer = enemy.telegraphMax;
            }
          } else if (enemy.state === 'telegraphing') {
            enemy.telegraphTimer -= dt;
            if (enemy.telegraphTimer <= 0) {
              // EXECUTE ATTACK
              enemy.state = 'chasing';

              // Check if player in danger area
              if (closestTarget.isPlayer && distToPlayer < enemy.radius + 45) {
                // Check if dodging (i-frames!)
                if (cs.isDodging) {
                  addFloatingText(p.x, p.y, 'EVADED!', '#a7c957', 1.1);
                } else if (cs.isBlocking) {
                  // Perfect parry check!
                  if (cs.parryWindow > 0) {
                    audioEngine.playPerfectParry();
                    cs.isSlowMo = 0.45; // Satisfying slow-mo hit stop
                    enemy.stagger = enemy.maxStagger;
                    enemy.state = 'staggered';
                    triggerShake(8);
                    addParticles(p.x, p.y, '#ffd166', 30, 6);
                    addFloatingText(enemy.x, enemy.y, 'PERFECT PARRY! STAGGERED!', '#ffd166', 1.5);
                    onCompanionSpeech('"Incredible parry! Break them!"');
                  } else {
                    // Regular block: 70% damage reduction
                    audioEngine.playBlock();
                    const blockedDmg = Math.round(enemy.damage * 0.3);
                    onTakeDamage(blockedDmg);
                    addFloatingText(p.x, p.y, `Blocked (-${blockedDmg})`, '#48cae4', 1.0);
                  }
                } else {
                  // Unmitigated hit
                  audioEngine.playHit();
                  onTakeDamage(enemy.damage);
                  triggerShake(6);
                  addParticles(p.x, p.y, '#e63946', 12, 4);
                  addFloatingText(p.x, p.y, `-${enemy.damage}`, '#e63946', 1.3);
                }
              }
            }
          }
        }
      });

      audioEngine.setCombatMusic(anyAggro);

      // --- 5. CAMERA SMOOTHING ---
      const targetCamX = p.x;
      const targetCamY = p.y;
      camera.current.x += (targetCamX - camera.current.x) * 0.1;
      camera.current.y += (targetCamY - camera.current.y) * 0.1;
      if (camera.current.shake > 0) {
        camera.current.shake -= dt * 15;
        if (camera.current.shake < 0) camera.current.shake = 0;
      }

      // --- 6. CANVAS RENDERING ---
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Handle high-dpi resizing
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      // Apply camera transform & shake
      const shakeOffsetX = (Math.random() - 0.5) * camera.current.shake * 2;
      const shakeOffsetY = (Math.random() - 0.5) * camera.current.shake * 2;
      ctx.translate(canvas.width / 2 + shakeOffsetX, canvas.height / 2 + shakeOffsetY);
      ctx.scale(cameraDistance, cameraDistance);
      ctx.translate(-camera.current.x, -camera.current.y);

      // --- BACKGROUND TERRAIN (Sol-Vaelen Beachhead & Spires) ---
      // Grid pattern
      const gridSize = 100;
      const startGridX = Math.floor((camera.current.x - canvas.width / 2 / cameraDistance) / gridSize) * gridSize;
      const endGridX = Math.ceil((camera.current.x + canvas.width / 2 / cameraDistance) / gridSize) * gridSize;
      const startGridY = Math.floor((camera.current.y - canvas.height / 2 / cameraDistance) / gridSize) * gridSize;
      const endGridY = Math.ceil((camera.current.y + canvas.height / 2 / cameraDistance) / gridSize) * gridSize;

      ctx.strokeStyle = 'rgba(212, 175, 55, 0.05)';
      ctx.lineWidth = 1;
      for (let gx = startGridX; gx <= endGridX; gx += gridSize) {
        ctx.beginPath();
        ctx.moveTo(gx, startGridY);
        ctx.lineTo(gx, endGridY);
        ctx.stroke();
      }
      for (let gy = startGridY; gy <= endGridY; gy += gridSize) {
        ctx.beginPath();
        ctx.moveTo(startGridX, gy);
        ctx.lineTo(endGridX, gy);
        ctx.stroke();
      }

      // Ancient stone roads / terrain markings
      ctx.fillStyle = 'rgba(26, 30, 36, 0.7)';
      ctx.fillRect(-600, -30, 1200, 60);

      // --- STRUCTURES (Settlement Buildings) ---
      structures.forEach(struct => {
        ctx.save();
        ctx.translate(struct.x, struct.y);

        if (struct.type === 'campfire') {
          // Campfire glow
          const radial = ctx.createRadialGradient(0, 0, 10, 0, 0, 90);
          radial.addColorStop(0, 'rgba(255, 140, 0, 0.45)');
          radial.addColorStop(1, 'rgba(255, 140, 0, 0)');
          ctx.fillStyle = radial;
          ctx.beginPath();
          ctx.arc(0, 0, 90, 0, Math.PI * 2);
          ctx.fill();

          // Stones and fire
          ctx.fillStyle = '#4a4e69';
          ctx.beginPath();
          ctx.arc(0, 0, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#f77f00';
          ctx.beginPath();
          ctx.arc(0, 0, 10 + Math.sin(currentTime * 0.01) * 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (struct.type === 'workbench') {
          ctx.fillStyle = '#8b5a2b';
          ctx.fillRect(-20, -12, 40, 24);
          ctx.fillStyle = '#d4a373';
          ctx.fillRect(-16, -8, 32, 16);
        } else if (struct.type === 'palisade') {
          ctx.fillStyle = '#5c4033';
          ctx.fillRect(-28, -6, 56, 12);
        } else if (struct.type === 'watchtower') {
          ctx.fillStyle = '#3a5a40';
          ctx.fillRect(-22, -22, 44, 44);
          ctx.fillStyle = '#a3b18a';
          ctx.fillRect(-16, -16, 32, 32);
        } else {
          ctx.fillStyle = '#b08968';
          ctx.fillRect(-25, -25, 50, 50);
        }

        // Structure label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '10px Plus Jakarta Sans';
        ctx.textAlign = 'center';
        ctx.fillText(struct.name, 0, -28);

        ctx.restore();
      });

      // --- BUILDING PREVIEW GHOST (if in Building Mode) ---
      if (isBuildingMode) {
        const wx = mousePos.current.worldX;
        const wy = mousePos.current.worldY;
        const dist = Math.hypot(wx - p.x, wy - p.y);
        const isValid = dist >= 35 && dist <= 300;

        ctx.save();
        ctx.translate(Math.round(wx / 20) * 20, Math.round(wy / 20) * 20);
        ctx.strokeStyle = isValid ? 'rgba(82, 183, 136, 0.8)' : 'rgba(230, 57, 70, 0.8)';
        ctx.fillStyle = isValid ? 'rgba(82, 183, 136, 0.25)' : 'rgba(230, 57, 70, 0.25)';
        ctx.lineWidth = 2;
        ctx.strokeRect(-25, -25, 50, 50);
        ctx.fillRect(-25, -25, 50, 50);

        ctx.fillStyle = isValid ? '#52b788' : '#e63946';
        ctx.font = '11px Plus Jakarta Sans';
        ctx.textAlign = 'center';
        ctx.fillText(isValid ? 'Click to Place' : 'Out of Reach', 0, -32);
        ctx.restore();
      }

      // --- RESOURCE GATHERING NODES ---
      resourceNodes.current.forEach(node => {
        ctx.save();
        ctx.translate(node.x, node.y);
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();

        // Node HP arc
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#ffd166';
        ctx.beginPath();
        ctx.arc(0, 0, 22, -Math.PI / 2, -Math.PI / 2 + (node.hp / node.maxHp) * Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '10px Plus Jakarta Sans';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, 0, -28);

        ctx.restore();
      });

      // --- ENEMIES & BOSSES ---
      enemies.current.forEach(enemy => {
        if (enemy.hp <= 0) return;

        ctx.save();
        ctx.translate(enemy.x, enemy.y);

        // Telegraph circle / warning indicator
        if (enemy.state === 'telegraphing') {
          const ratio = 1 - enemy.telegraphTimer / enemy.telegraphMax;
          ctx.fillStyle = 'rgba(230, 57, 70, 0.25)';
          ctx.strokeStyle = 'rgba(230, 57, 70, 0.8)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, (enemy.radius + 35) * ratio, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        // Boss aura
        if (enemy.isBoss) {
          const bossGlow = ctx.createRadialGradient(0, 0, enemy.radius, 0, 0, enemy.radius + 40);
          bossGlow.addColorStop(0, 'rgba(244, 162, 97, 0.4)');
          bossGlow.addColorStop(1, 'rgba(244, 162, 97, 0)');
          ctx.fillStyle = bossGlow;
          ctx.beginPath();
          ctx.arc(0, 0, enemy.radius + 40, 0, Math.PI * 2);
          ctx.fill();
        }

        // Enemy body
        ctx.rotate(enemy.rotation);
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
        ctx.fill();

        // Forward indicator
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(enemy.radius * 0.7, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.rotate(-enemy.rotation);

        // Enemy Health Bar & Stagger Bar
        const barWidth = enemy.radius * 2.2;
        const barHeight = 6;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(-barWidth / 2, -enemy.radius - 18, barWidth, barHeight);

        ctx.fillStyle = '#e63946';
        ctx.fillRect(-barWidth / 2, -enemy.radius - 18, barWidth * (enemy.hp / enemy.maxHp), barHeight);

        // Stagger bar
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(-barWidth / 2, -enemy.radius - 10, barWidth, 3);
        ctx.fillStyle = '#ffd166';
        ctx.fillRect(-barWidth / 2, -enemy.radius - 10, barWidth * Math.min(1, enemy.stagger / enemy.maxStagger), 3);

        // Name text
        ctx.fillStyle = enemy.isBoss ? '#ffd166' : '#ffffff';
        ctx.font = `${enemy.isBoss ? 'bold 12px' : '10px'} Cinzel`;
        ctx.textAlign = 'center';
        ctx.fillText(enemy.name, 0, -enemy.radius - 22);

        // Locked target indicator
        if (playerCombatState.current.lockedTargetId === enemy.id) {
          ctx.strokeStyle = '#ffd166';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, enemy.radius + 12, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      });

      // --- COMPANION (Kaelen Drake) ---
      ctx.save();
      ctx.translate(comp.x, comp.y);
      // Vanguard shield glow
      ctx.fillStyle = '#2b9348';
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();

      // Shield crest
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(-6, -6, 12, 12);

      ctx.fillStyle = '#d8f3dc';
      ctx.font = '10px Plus Jakarta Sans';
      ctx.textAlign = 'center';
      ctx.fillText(companion.name, 0, -24);
      ctx.restore();

      // --- PLAYER CHARACTER ---
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);

      // Dodge roll blur
      if (cs.isDodging) {
        ctx.fillStyle = 'rgba(255, 209, 102, 0.35)';
        ctx.beginPath();
        ctx.arc(-15, 0, 18, 0, Math.PI * 2);
        ctx.fill();
      }

      // Block shield visual
      if (cs.isBlocking) {
        ctx.strokeStyle = cs.parryWindow > 0 ? '#ffd166' : '#4cc9f0';
        ctx.lineWidth = cs.parryWindow > 0 ? 5 : 3;
        ctx.beginPath();
        ctx.arc(12, 0, 24, -Math.PI * 0.4, Math.PI * 0.4);
        ctx.stroke();
      }

      // Player torso
      ctx.fillStyle = appearance.skinTone || '#d4a373';
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();

      // Weapon visualization based on equipped weapon
      ctx.fillStyle = '#d4af37';
      if (equippedWeapon === 'greatsword') {
        ctx.fillRect(10, -4, 30, 8);
      } else if (equippedWeapon === 'dual_axes') {
        ctx.fillRect(8, -12, 16, 6);
        ctx.fillRect(8, 6, 16, 6);
      } else if (equippedWeapon === 'aether_bow') {
        ctx.strokeStyle = '#4cc9f0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(16, 0, 18, -Math.PI * 0.35, Math.PI * 0.35);
        ctx.stroke();
      } else if (equippedWeapon === 'arcane_staff') {
        ctx.fillStyle = '#9d4edd';
        ctx.fillRect(10, -3, 34, 6);
        ctx.beginPath();
        ctx.arc(46, 0, 8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Sword and shield
        ctx.fillRect(10, -4, 22, 6);
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        ctx.strokeRect(6, 6, 14, 14);
      }

      // Attack slash FX
      if (cs.isAttacking) {
        ctx.strokeStyle = cs.attackType === 'heavy' ? 'rgba(230, 57, 70, 0.7)' : 'rgba(255, 209, 102, 0.8)';
        ctx.lineWidth = cs.attackType === 'heavy' ? 8 : 4;
        ctx.beginPath();
        ctx.arc(0, 0, 48, -Math.PI * 0.4, Math.PI * 0.4);
        ctx.stroke();
      }

      ctx.restore();

      // --- PARTICLES ---
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const pt = particles.current[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= pt.decay;

        if (pt.alpha <= 0) {
          particles.current.splice(i, 1);
        } else {
          ctx.fillStyle = pt.color;
          ctx.globalAlpha = pt.alpha;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
      }

      // --- FLOATING TEXTS ---
      for (let i = floatingTexts.current.length - 1; i >= 0; i--) {
        const ft = floatingTexts.current[i];
        ft.y += ft.vy;
        ft.alpha -= 0.018;

        if (ft.alpha <= 0) {
          floatingTexts.current.splice(i, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = ft.alpha;
          ctx.fillStyle = ft.color;
          ctx.font = `bold ${Math.round(14 * ft.scale)}px Plus Jakarta Sans`;
          ctx.textAlign = 'center';
          ctx.fillText(ft.text, ft.x, ft.y);
          ctx.restore();
        }
      }

      ctx.restore(); // Restore camera transform

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    archetype,
    equippedWeapon,
    companion,
    structures,
    isBuildingMode,
    selectedStructureType,
    cameraDistance,
    cameraShakeEnabled,
    onTakeDamage,
    onGainXp,
    onLootGained,
    onCompanionSpeech,
    activeWorldEvent,
    onEventProgress
  ]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-neutral-950">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair block"
      />
    </div>
  );
};
