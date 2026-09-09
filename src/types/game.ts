export type CombatArchetype = 'vanguard' | 'spellblade' | 'shadowstrider' | 'solarwarden';

export type PlayableOrigin = 'sol_vaelen' | 'ashen_reefbound' | 'ironwood_weaver' | 'umbral_pariah';

export type VoiceProfileType = 'calm' | 'confident' | 'rough' | 'stoic' | 'warm' | 'mysterious';

export type VanguardSpecialization = 'guardian' | 'berserker' | 'warlord';
export type SpellbladeSpecialization = 'arcblade' | 'stormblade' | 'sunblade';
export type ShadowStriderSpecialization = 'assassin' | 'nighthunter' | 'phantom';
export type SolarWardenSpecialization = 'dawn_knight' | 'sun_priest' | 'radiant_guardian';
export type ClassSpecialization = 
  | VanguardSpecialization 
  | SpellbladeSpecialization 
  | ShadowStriderSpecialization 
  | SolarWardenSpecialization;

export type WeaponType = 
  | 'greatsword'
  | 'dual_axes'
  | 'aether_bow'
  | 'arcane_staff'
  | 'sword_and_shield';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface CharacterAttributes {
  vitality: number;    // Max HP and HP recovery
  might: number;       // Physical damage and stagger output
  resonance: number;   // Aether energy and spell potency
  agility: number;     // Attack speed, stamina recovery, dodge i-frames
  tenacity: number;    // Armor, poise, block mitigation
}

export interface CharacterAppearance {
  name: string;
  origin: PlayableOrigin;
  gender: 'masculine' | 'feminine' | 'neutral';
  bodyType: 'masculine' | 'feminine' | 'androgynous';
  height: number; // 0.8 to 1.2
  muscularBuild: number; // 0.7 to 1.3
  skinTone: string;
  faceShape: string;
  jawWidth: number;
  eyeShape: string;
  eyeColor: string;
  fantasyEyeGlow: boolean;
  freckles: boolean;
  scars: string;
  birthmarks: string;
  culturalMarkings: string;
  hairStyle: string;
  hairColor: string;
  facialHair: string;
  facialHairColor: string;
  facialMarks: string;
  voicePitch: number; // 0.6 to 1.4
  voiceProfile: VoiceProfileType;
  bodyScale: number;
}

export interface TransmogSettings {
  weaponSkin: string;
  armorSkin: string;
  cloakVisible: boolean;
  cloakDye: string;
  helmVisible: boolean;
}

export interface SettlementNPC {
  id: string;
  name: string;
  title: string;
  role: 'blacksmith' | 'herbalist' | 'scout' | 'quartermaster';
  unlocked: boolean;
  avatar: string;
  quote: string;
  facility: string;
  serviceDescription: string;
}

export interface CinematicScene {
  id: string;
  title: string;
  subtitle: string;
  chapter?: string;
  paragraphs: string[];
  speaker: string;
  voiceProfile?: string;
  visualTheme: 'eclipse' | 'sun' | 'wreckage' | 'ancient_ruins' | 'titan';
}

export interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'armor_head' | 'armor_chest' | 'armor_legs' | 'accessory' | 'material' | 'consumable' | 'relic';
  rarity: ItemRarity;
  description: string;
  icon: string;
  stats?: {
    damage?: number;
    armor?: number;
    health?: number;
    stamina?: number;
    aether?: number;
    critChance?: number;
  };
  weaponType?: WeaponType;
  specialAffix?: string;
  socketSlots?: number;
  quantity?: number;
  value: number;
}

export interface SkillTalent {
  id: string;
  name: string;
  tier: number;
  icon: string;
  description: string;
  cooldown: number; // seconds
  staminaCost: number;
  aetherCost: number;
  unlocked: boolean;
  type: 'active' | 'passive' | 'ultimate';
}

export interface EnemyEntity {
  id: string;
  name: string;
  type: string;
  isBoss?: boolean;
  maxHp: number;
  hp: number;
  maxStagger: number;
  stagger: number;
  damage: number;
  speed: number;
  x: number;
  y: number;
  rotation: number;
  radius: number;
  state: 'idle' | 'chasing' | 'telegraphing' | 'attacking' | 'staggered' | 'dead';
  telegraphTimer: number;
  telegraphMax: number;
  attackCooldown: number;
  currentAttackName?: string;
  color: string;
  phase?: number;
  drops: { itemId: string; chance: number; min: number; max: number }[];
}

export type CompanionApprovalStatus = 'hostile' | 'suspicious' | 'neutral' | 'friendly' | 'trusted';

export interface WorldState {
  eclipseIntensity: number; // 0 to 100
  campLevel: number; // 1 to 5
  settlementsSaved: number;
  settlementsDestroyed: number;
  companionApproval: CompanionApprovalStatus;
  companionApprovalScore: number; // 0 to 100
  sanctumCompleted: boolean;
  worldEventCompleted: boolean;
  majorBossDefeated: boolean;
  classSpecializationUnlocked: boolean;
  classIntroCompleted: boolean;
  act1Completed: boolean;
  revelationViewed: boolean;
  currentQuestChainIndex: number;
}

export interface Companion {
  id: string;
  name: string;
  title: string;
  avatar: string;
  relationshipScore: number; // 0 to 100
  relationshipStatus: CompanionApprovalStatus | 'wary' | 'loyal' | 'sworn_kin';
  combatArchetype: CombatArchetype;
  currentHp: number;
  maxHp: number;
  isSummoned: boolean;
  quote: string;
  backstorySnippet: string;
}

export interface CampStructure {
  id: string;
  type: 'campfire' | 'workbench' | 'palisade' | 'watchtower' | 'forge' | 'shelter';
  name: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  level: number;
}

export type QuestState = 'locked' | 'available' | 'active' | 'completed' | 'failed';

export interface Quest {
  id: string;
  title: string;
  type: 'main' | 'companion' | 'exploration' | 'bounty';
  state?: QuestState;
  chapter?: number;
  description: string;
  giver: string;
  giverNpcId?: string;
  location?: string;
  progress: number;
  maxProgress: number;
  targetDescription: string;
  isCompleted: boolean;
  whyDoingThis?: string;
  whoHelping?: string;
  whatChangesIfSuccess?: string;
  rewards: {
    xp: number;
    gold: number;
    items?: Item[];
    reputation?: number;
  };
}

export interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  voiceLine?: string;
  options: {
    text: string;
    nextNodeId?: string;
    action?: string;
    affinityChange?: number;
  }[];
}

export interface WorldEvent {
  id: string;
  name: string;
  description: string;
  active: boolean;
  timer: number;
  maxDuration: number;
  objectiveProgress: number;
  objectiveMax: number;
  stage: number;
  rewardTier: string;
}

export interface ExpeditionNode {
  id: string;
  type: 'combat' | 'elite' | 'event' | 'rest' | 'boss';
  title: string;
  description: string;
  affliction?: string;
  boon?: string;
  completed: boolean;
  active: boolean;
}

export interface DungeonSquadMember {
  name: string;
  role: 'tank' | 'healer' | 'dps';
  archetype: CombatArchetype;
  hp: number;
  maxHp: number;
  status: string;
}
