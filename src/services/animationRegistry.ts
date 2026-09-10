import { CombatArchetype } from '../types/game';
export { 
  MASTER_CHARACTER_URL, 
  type MasterCharacterLoadingState, 
  type MasterCharacterConfig, 
  DEFAULT_MASTER_CONFIG 
} from '../config/characterConfig';

export type AnimationState = 
  | 'idle'
  | 'walk'
  | 'run'
  | 'sprint'
  | 'attack'
  | 'heavy_attack'
  | 'block'
  | 'parry'
  | 'dodge'
  | 'hit_reaction'
  | 'cast'
  | 'death'
  | 'triumph';

export interface ComboStage {
  stage: number;
  name: string;
  clipFile: string;
  fallbackFile?: string;
  duration: number; // total expected clip duration in seconds
  comboWindowStart: number; // point when buffering next combo attack opens
  comboWindowEnd: number; // point when combo window closes
  recovery: number; // duration before movement can break out
  blendDuration: number; // crossfade blend time in seconds
  damageMultiplier: number;
  cameraShake?: number;
}

export interface ClassAnimationConfig {
  archetype: CombatArchetype;
  displayName: string;
  isProceduralOnly?: boolean;
  idle: string;
  walk: string;
  run: string;
  sprint: string;
  dodge: string;
  hitReaction: string;
  death: string;
  lightCombo: ComboStage[];
  heavyAttack?: ComboStage;
  block?: string;
  parry?: string;
  cast?: string;
}

export interface AnimationFileInfo {
  fileName: string;
  category: 'universal' | 'sword_shield' | 'great_sword' | 'magic' | 'character';
  subDirectory: string;
  relativeUrl: string;
  fallbackUrls?: string[];
  loop: boolean;
  clampWhenFinished: boolean;
  timeScale: number;
}

/**
 * Universal animations shared across classes
 */
export const UNIVERSAL_ANIMATION_FILES: Record<string, AnimationFileInfo> = {
  masterCharacter: {
    fileName: 'Breathing Idle.fbx',
    category: 'character',
    subDirectory: 'characters/mixamo',
    relativeUrl: '/assets/characters/mixamo/Breathing Idle.fbx',
    fallbackUrls: [
      '/assets/characters/Breathing Idle.fbx',
      '/assets/animations/Breathing Idle.fbx',
      '/assets/animations/universal/Breathing Idle.fbx'
    ],
    loop: true,
    clampWhenFinished: false,
    timeScale: 1.0
  },
  idle: {
    fileName: 'Breathing Idle.fbx',
    category: 'universal',
    subDirectory: 'characters/mixamo',
    relativeUrl: '/assets/characters/mixamo/Breathing Idle.fbx',
    fallbackUrls: [
      '/assets/animations/universal/Breathing Idle.fbx',
      '/assets/animations/Breathing Idle.fbx'
    ],
    loop: true,
    clampWhenFinished: false,
    timeScale: 1.0
  },
  walk: {
    fileName: 'Walking.fbx',
    category: 'universal',
    subDirectory: 'animations/universal',
    relativeUrl: '/assets/animations/universal/Walking.fbx',
    fallbackUrls: ['/assets/animations/Walking.fbx'],
    loop: true,
    clampWhenFinished: false,
    timeScale: 1.0
  },
  run: {
    fileName: 'Running.fbx',
    category: 'universal',
    subDirectory: 'animations/universal',
    relativeUrl: '/assets/animations/universal/Running.fbx',
    fallbackUrls: ['/assets/animations/Running.fbx'],
    loop: true,
    clampWhenFinished: false,
    timeScale: 1.05
  },
  dodge: {
    fileName: 'Dodging.fbx',
    category: 'universal',
    subDirectory: 'animations/universal',
    relativeUrl: '/assets/animations/universal/Dodging.fbx',
    fallbackUrls: [
      '/assets/animations/universal/Run To Rolling.fbx',
      '/assets/animations/Dodging.fbx',
      '/assets/animations/Run To Rolling.fbx'
    ],
    loop: false,
    clampWhenFinished: true,
    timeScale: 1.25
  },
  runToRolling: {
    fileName: 'Run To Rolling.fbx',
    category: 'universal',
    subDirectory: 'animations/universal',
    relativeUrl: '/assets/animations/universal/Run To Rolling.fbx',
    fallbackUrls: ['/assets/animations/Run To Rolling.fbx'],
    loop: false,
    clampWhenFinished: true,
    timeScale: 1.2
  },
  hitReaction: {
    fileName: 'Reaction.fbx',
    category: 'universal',
    subDirectory: 'animations/universal',
    relativeUrl: '/assets/animations/universal/Reaction.fbx',
    fallbackUrls: ['/assets/animations/Reaction.fbx'],
    loop: false,
    clampWhenFinished: true,
    timeScale: 1.1
  },
  death: {
    fileName: 'Dying.fbx',
    category: 'universal',
    subDirectory: 'animations/universal',
    relativeUrl: '/assets/animations/universal/Dying.fbx',
    fallbackUrls: ['/assets/animations/Dying.fbx'],
    loop: false,
    clampWhenFinished: true,
    timeScale: 1.0
  },
  hardLanding: {
    fileName: 'Hard Landing.fbx',
    category: 'universal',
    subDirectory: 'animations/universal',
    relativeUrl: '/assets/animations/universal/Hard Landing.fbx',
    fallbackUrls: ['/assets/animations/Hard Landing.fbx'],
    loop: false,
    clampWhenFinished: true,
    timeScale: 1.0
  },
  jumpingDown: {
    fileName: 'Jumping Down.fbx',
    category: 'universal',
    subDirectory: 'animations/universal',
    relativeUrl: '/assets/animations/universal/Jumping Down.fbx',
    fallbackUrls: ['/assets/animations/Jumping Down.fbx'],
    loop: false,
    clampWhenFinished: true,
    timeScale: 1.0
  },
  startWalking: {
    fileName: 'Start Walking.fbx',
    category: 'universal',
    subDirectory: 'animations/universal',
    relativeUrl: '/assets/animations/universal/Start Walking.fbx',
    fallbackUrls: ['/assets/animations/Start Walking.fbx'],
    loop: false,
    clampWhenFinished: false,
    timeScale: 1.0
  },
  standingUp: {
    fileName: 'Standing Up.fbx',
    category: 'universal',
    subDirectory: 'animations/universal',
    relativeUrl: '/assets/animations/universal/Standing Up.fbx',
    fallbackUrls: ['/assets/animations/Standing Up.fbx'],
    loop: false,
    clampWhenFinished: true,
    timeScale: 1.0
  },
  climbingToTop: {
    fileName: 'Climbing To Top.fbx',
    category: 'universal',
    subDirectory: 'animations/universal',
    relativeUrl: '/assets/animations/universal/Climbing To Top.fbx',
    fallbackUrls: ['/assets/animations/Climbing To Top.fbx'],
    loop: false,
    clampWhenFinished: true,
    timeScale: 1.0
  },
  standingToCrouch: {
    fileName: 'Standing To Crouch.fbx',
    category: 'universal',
    subDirectory: 'animations/universal',
    relativeUrl: '/assets/animations/universal/Standing To Crouch.fbx',
    fallbackUrls: ['/assets/animations/Standing To Crouch.fbx'],
    loop: false,
    clampWhenFinished: true,
    timeScale: 1.0
  },
  crouchedToStanding: {
    fileName: 'Crouched To Standing.fbx',
    category: 'universal',
    subDirectory: 'animations/universal',
    relativeUrl: '/assets/animations/universal/Crouched To Standing.fbx',
    fallbackUrls: ['/assets/animations/Crouched To Standing.fbx'],
    loop: false,
    clampWhenFinished: true,
    timeScale: 1.0
  }
};

/**
 * Class Specific Registry Definitions
 */
export const CLASS_ANIMATION_REGISTRY: Record<CombatArchetype, ClassAnimationConfig> = {
  vanguard: {
    archetype: 'vanguard',
    displayName: 'Vanguard (Sword & Shield)',
    idle: 'sword and shield idle.fbx',
    walk: 'Walking.fbx',
    run: 'Running.fbx',
    sprint: 'Running.fbx',
    dodge: 'Dodging.fbx',
    hitReaction: 'Reaction.fbx',
    death: 'Dying.fbx',
    lightCombo: [
      {
        stage: 1,
        name: 'Vanguard Slash I',
        clipFile: 'sword and shield attack.fbx',
        fallbackFile: 'sword and shield slash.fbx',
        duration: 0.62,
        comboWindowStart: 0.26,
        comboWindowEnd: 0.58,
        recovery: 0.12,
        blendDuration: 0.1,
        damageMultiplier: 1.0,
        cameraShake: 0.15
      },
      {
        stage: 2,
        name: 'Vanguard Sweep II',
        clipFile: 'sword and shield attack (2).fbx',
        fallbackFile: 'sword and shield slash (2).fbx',
        duration: 0.70,
        comboWindowStart: 0.28,
        comboWindowEnd: 0.65,
        recovery: 0.15,
        blendDuration: 0.1,
        damageMultiplier: 1.25,
        cameraShake: 0.25
      },
      {
        stage: 3,
        name: 'Vanguard Shield Bash & Cleave III',
        clipFile: 'sword and shield attack (3).fbx',
        fallbackFile: 'sword and shield attack (4).fbx',
        duration: 0.85,
        comboWindowStart: 0.0,
        comboWindowEnd: 0.0, // Finish of 3-hit combo
        recovery: 0.24,
        blendDuration: 0.12,
        damageMultiplier: 1.85,
        cameraShake: 0.45
      }
    ],
    heavyAttack: {
      stage: 4,
      name: 'Vanguard Overhead Judgement',
      clipFile: 'sword and shield attack (4).fbx',
      fallbackFile: 'sword and shield slash (2).fbx',
      duration: 1.05,
      comboWindowStart: 0,
      comboWindowEnd: 0,
      recovery: 0.35,
      blendDuration: 0.15,
      damageMultiplier: 2.3,
      cameraShake: 0.6
    },
    block: 'sword and shield block idle.fbx',
    parry: 'sword and shield block.fbx',
    cast: 'sword and shield casting.fbx'
  },

  solarwarden: {
    archetype: 'solarwarden',
    displayName: 'Solar Warden (Radiant Blade & Bulwark)',
    idle: 'sword and shield idle.fbx',
    walk: 'Walking.fbx',
    run: 'Running.fbx',
    sprint: 'Running.fbx',
    dodge: 'Dodging.fbx',
    hitReaction: 'Reaction.fbx',
    death: 'Dying.fbx',
    lightCombo: [
      {
        stage: 1,
        name: 'Solar Strike I',
        clipFile: 'sword and shield slash.fbx',
        fallbackFile: 'sword and shield attack.fbx',
        duration: 0.60,
        comboWindowStart: 0.25,
        comboWindowEnd: 0.55,
        recovery: 0.10,
        blendDuration: 0.1,
        damageMultiplier: 1.05,
        cameraShake: 0.15
      },
      {
        stage: 2,
        name: 'Dawn Cleave II',
        clipFile: 'sword and shield slash (2).fbx',
        fallbackFile: 'sword and shield attack (2).fbx',
        duration: 0.72,
        comboWindowStart: 0.28,
        comboWindowEnd: 0.66,
        recovery: 0.16,
        blendDuration: 0.1,
        damageMultiplier: 1.35,
        cameraShake: 0.3
      },
      {
        stage: 3,
        name: 'Zenith Retribution III',
        clipFile: 'great sword slash.fbx',
        fallbackFile: 'sword and shield attack (3).fbx',
        duration: 0.90,
        comboWindowStart: 0.0,
        comboWindowEnd: 0.0,
        recovery: 0.26,
        blendDuration: 0.12,
        damageMultiplier: 1.95,
        cameraShake: 0.5
      }
    ],
    heavyAttack: {
      stage: 4,
      name: 'Sunfire Smite',
      clipFile: 'great sword attack.fbx',
      fallbackFile: 'sword and shield attack (4).fbx',
      duration: 1.15,
      comboWindowStart: 0,
      comboWindowEnd: 0,
      recovery: 0.38,
      blendDuration: 0.15,
      damageMultiplier: 2.4,
      cameraShake: 0.65
    },
    block: 'sword and shield block idle.fbx',
    parry: 'sword and shield block.fbx',
    cast: 'sword and shield casting.fbx'
  },

  spellblade: {
    archetype: 'spellblade',
    displayName: 'Spellblade (Aether Blade & Magic)',
    idle: 'Breathing Idle.fbx',
    walk: 'Walking.fbx',
    run: 'Running.fbx',
    sprint: 'Running.fbx',
    dodge: 'Dodging.fbx',
    hitReaction: 'Reaction.fbx',
    death: 'Dying.fbx',
    lightCombo: [
      {
        stage: 1,
        name: 'Arcane Thrust I',
        clipFile: 'Standing 1H Magic Attack 01.fbx',
        fallbackFile: 'sword and shield slash.fbx',
        duration: 0.58,
        comboWindowStart: 0.24,
        comboWindowEnd: 0.54,
        recovery: 0.12,
        blendDuration: 0.1,
        damageMultiplier: 1.0,
        cameraShake: 0.15
      },
      {
        stage: 2,
        name: 'Aether Blade Flurry II',
        clipFile: 'Standing 1H Magic Attack 02.fbx',
        fallbackFile: 'great sword slash (2).fbx',
        duration: 0.68,
        comboWindowStart: 0.28,
        comboWindowEnd: 0.62,
        recovery: 0.15,
        blendDuration: 0.1,
        damageMultiplier: 1.3,
        cameraShake: 0.25
      },
      {
        stage: 3,
        name: 'Spellblade Nova Sweep III',
        clipFile: 'Standing 1H Magic Attack 03.fbx',
        fallbackFile: 'Standing 2H Magic Attack 01.fbx',
        duration: 0.85,
        comboWindowStart: 0.0,
        comboWindowEnd: 0.0,
        recovery: 0.24,
        blendDuration: 0.12,
        damageMultiplier: 1.8,
        cameraShake: 0.45
      }
    ],
    heavyAttack: {
      stage: 4,
      name: 'Cataclysmic Vortex',
      clipFile: 'Standing 2H Magic Area Attack 01.fbx',
      fallbackFile: 'great sword high spin attack.fbx',
      duration: 1.25,
      comboWindowStart: 0,
      comboWindowEnd: 0,
      recovery: 0.4,
      blendDuration: 0.15,
      damageMultiplier: 2.25,
      cameraShake: 0.6
    },
    block: 'great sword blocking.fbx',
    parry: 'great sword blocking (3).fbx',
    cast: 'standing 1H cast spell 01.fbx'
  },

  shadowstrider: {
    archetype: 'shadowstrider',
    displayName: 'Shadow Strider (Dual Daggers / Phantom)',
    isProceduralOnly: true, // As specified: "Leave this class using the existing procedural fallback until dagger/dual-wield animations are added later"
    idle: 'Breathing Idle.fbx',
    walk: 'Walking.fbx',
    run: 'Running.fbx',
    sprint: 'Running.fbx',
    dodge: 'Dodging.fbx',
    hitReaction: 'Reaction.fbx',
    death: 'Dying.fbx',
    lightCombo: [
      {
        stage: 1,
        name: 'Umbral Strike I',
        clipFile: 'procedural_slash_1',
        duration: 0.45,
        comboWindowStart: 0.20,
        comboWindowEnd: 0.42,
        recovery: 0.08,
        blendDuration: 0.08,
        damageMultiplier: 0.95
      },
      {
        stage: 2,
        name: 'Phantom Twin Piercer II',
        clipFile: 'procedural_slash_2',
        duration: 0.50,
        comboWindowStart: 0.22,
        comboWindowEnd: 0.48,
        recovery: 0.10,
        blendDuration: 0.08,
        damageMultiplier: 1.2
      },
      {
        stage: 3,
        name: 'Shadow Dissolve & Eviscerate III',
        clipFile: 'procedural_slash_3',
        duration: 0.65,
        comboWindowStart: 0,
        comboWindowEnd: 0,
        recovery: 0.16,
        blendDuration: 0.1,
        damageMultiplier: 1.7
      }
    ],
    heavyAttack: {
      stage: 4,
      name: 'Shadow Death Flurry',
      clipFile: 'procedural_heavy',
      duration: 0.85,
      comboWindowStart: 0,
      comboWindowEnd: 0,
      recovery: 0.25,
      blendDuration: 0.1,
      damageMultiplier: 2.1
    }
  }
};

/**
 * Registry Lookup Helpers
 */
export const animationRegistry = {
  universal: UNIVERSAL_ANIMATION_FILES,
  vanguard: CLASS_ANIMATION_REGISTRY.vanguard,
  solarWarden: CLASS_ANIMATION_REGISTRY.solarwarden,
  spellblade: CLASS_ANIMATION_REGISTRY.spellblade,
  shadowStrider: CLASS_ANIMATION_REGISTRY.shadowstrider,

  getClassConfig(archetype: CombatArchetype): ClassAnimationConfig {
    return CLASS_ANIMATION_REGISTRY[archetype] || CLASS_ANIMATION_REGISTRY.vanguard;
  },

  getComboStage(archetype: CombatArchetype, comboIndex: number): ComboStage {
    const config = this.getClassConfig(archetype);
    const validIndex = Math.max(0, Math.min(config.lightCombo.length - 1, comboIndex - 1));
    return config.lightCombo[validIndex];
  }
};
