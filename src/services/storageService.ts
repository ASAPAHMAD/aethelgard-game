import { 
  CharacterAppearance, 
  CharacterAttributes, 
  Item, 
  CampStructure, 
  Companion, 
  Quest, 
  WeaponType, 
  CombatArchetype, 
  ClassSpecialization,
  TransmogSettings,
  WorldState 
} from '../types/game';
import { STARTER_ITEMS, INITIAL_COMPANION_KAELEN } from '../data/starterData';
import { CHAPTER_ONE_QUESTS } from '../data/chapterOneQuests';

export interface GameSaveState {
  version: number;
  appearance: CharacterAppearance;
  attributes: CharacterAttributes;
  archetype: CombatArchetype;
  specialization?: ClassSpecialization;
  equippedWeapon: WeaponType;
  equippedArmorChestId: string | null;
  transmog: TransmogSettings;
  storyChapter: number;
  prologueCompleted: boolean;
  level: number;
  xp: number;
  nextLevelXp: number;
  gold: number;
  inventory: Item[];
  structures: CampStructure[];
  companion: Companion;
  quests: Quest[];
  worldDiscoveries: string[];
  nourishmentTimer: number; // in seconds
  warmthLevel: number; // 0 to 100
  settlementLevel: number;
  worldState: WorldState;
}

const STORAGE_KEY = 'aethelgard_save_v2';

export const DEFAULT_WORLD_STATE: WorldState = {
  eclipseIntensity: 25,
  campLevel: 1,
  settlementsSaved: 1,
  settlementsDestroyed: 2,
  companionApproval: 'friendly',
  companionApprovalScore: 45,
  sanctumCompleted: false,
  worldEventCompleted: false,
  majorBossDefeated: false,
  classSpecializationUnlocked: false,
  classIntroCompleted: false,
  act1Completed: false,
  revelationViewed: false,
  currentQuestChainIndex: 0
};

export const DEFAULT_SAVE_STATE: GameSaveState = {
  version: 2,
  appearance: {
    name: 'Vaelen Survivor',
    origin: 'sol_vaelen',
    gender: 'masculine',
    bodyType: 'masculine',
    height: 1.0,
    muscularBuild: 1.0,
    skinTone: '#d4a373',
    faceShape: 'Angular',
    jawWidth: 1.0,
    eyeShape: 'Almond',
    eyeColor: '#ffd166',
    fantasyEyeGlow: true,
    freckles: false,
    scars: 'Sun Scar',
    birthmarks: 'None',
    culturalMarkings: 'Citadel Solar Glyphs',
    hairStyle: 'Warrior Braids',
    hairColor: '#3d2b1f',
    facialHair: 'Trimmed Stubble',
    facialHairColor: '#3d2b1f',
    facialMarks: 'Sun Scar',
    voicePitch: 1.0,
    voiceProfile: 'confident',
    bodyScale: 1.0,
  },
  attributes: {
    vitality: 12,
    might: 14,
    resonance: 10,
    agility: 11,
    tenacity: 12,
  },
  archetype: 'vanguard',
  specialization: 'guardian',
  equippedWeapon: 'greatsword',
  equippedArmorChestId: 'armor_chest_vanguard',
  transmog: {
    weaponSkin: 'default',
    armorSkin: 'default',
    cloakVisible: true,
    cloakDye: '#b76e33',
    helmVisible: true
  },
  storyChapter: 1,
  prologueCompleted: false,
  level: 1,
  xp: 0,
  nextLevelXp: 500,
  gold: 40,
  inventory: [...STARTER_ITEMS],
  structures: [
    {
      id: 'initial_campfire',
      type: 'campfire',
      name: 'Driftwood Campfire',
      x: 0,
      y: 0,
      hp: 150,
      maxHp: 150,
      level: 1,
    }
  ],
  companion: { ...INITIAL_COMPANION_KAELEN },
  quests: [...CHAPTER_ONE_QUESTS],
  worldDiscoveries: ['Sol-Vaelen Beachhead', 'The Shimmering Reefs', 'Ancient Monolith of Eldir'],
  nourishmentTimer: 450,
  warmthLevel: 85,
  settlementLevel: 1,
  worldState: { ...DEFAULT_WORLD_STATE }
};

export const storageService = {
  loadGame(): GameSaveState {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (!serialized) return DEFAULT_SAVE_STATE;
      const parsed = JSON.parse(serialized);

      // Verify quests array has the full Chapter I quest chain
      const hasChapterOneQuests = parsed.quests && parsed.quests.some((q: Quest) => q.id.startsWith('q_act'));
      const activeQuests = hasChapterOneQuests ? parsed.quests : [...CHAPTER_ONE_QUESTS];

      return {
        ...DEFAULT_SAVE_STATE,
        ...parsed,
        quests: activeQuests,
        worldState: {
          ...DEFAULT_WORLD_STATE,
          ...(parsed.worldState || {})
        }
      };
    } catch (e) {
      console.warn('Failed to parse saved game data, using default state:', e);
      return DEFAULT_SAVE_STATE;
    }
  },

  saveGame(state: GameSaveState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to persist game state:', e);
    }
  },

  resetGame(): GameSaveState {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to reset game:', e);
    }
    return DEFAULT_SAVE_STATE;
  },

  loadGameState(): GameSaveState {
    return this.loadGame();
  },

  saveGameState(state: GameSaveState): void {
    this.saveGame(state);
  },

  resetSaveState(): GameSaveState {
    return this.resetGame();
  }
};
