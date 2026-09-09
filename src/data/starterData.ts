import { Item, SkillTalent, Companion, Quest, DialogueNode } from '../types/game';

export const STARTER_ITEMS: Item[] = [
  {
    id: 'wpn_greatsword_1',
    name: 'Sunsteel Greatsword',
    type: 'weapon',
    rarity: 'rare',
    description: 'A heavy two-handed blade forged from solar-tempered alloy. Staggers foes with crushing kinetic force.',
    icon: 'Sword',
    weaponType: 'greatsword',
    stats: { damage: 48, stamina: -15, critChance: 12 },
    specialAffix: 'Heavy attacks deal +30% stagger damage to armored enemies.',
    socketSlots: 2,
    value: 120,
    quantity: 1,
  },
  {
    id: 'wpn_dual_axes_1',
    name: 'Dual Runic Hatchets',
    type: 'weapon',
    rarity: 'rare',
    description: 'A pair of balanced throwing and cleaving axes engraved with wind runes.',
    icon: 'Axe',
    weaponType: 'dual_axes',
    stats: { damage: 36, critChance: 22 },
    specialAffix: 'Landing 3 consecutive hits grants +15% attack speed for 4s.',
    socketSlots: 1,
    value: 110,
    quantity: 1,
  },
  {
    id: 'wpn_bow_1',
    name: 'Aether-Strung Longbow',
    type: 'weapon',
    rarity: 'rare',
    description: 'Carved from petrified ironwood and strung with resonant solar filaments.',
    icon: 'Crosshair',
    weaponType: 'aether_bow',
    stats: { damage: 42, critChance: 18 },
    specialAffix: 'Fully charged shots pierce through multiple targets.',
    socketSlots: 1,
    value: 115,
    quantity: 1,
  },
  {
    id: 'wpn_staff_1',
    name: 'Spire-Weaver Staff',
    type: 'weapon',
    rarity: 'epic',
    description: 'A crystalline conduit pulsating with raw primal Aether energy.',
    icon: 'Wand2',
    weaponType: 'arcane_staff',
    stats: { damage: 52, aether: 40, critChance: 15 },
    specialAffix: 'Spells leave lingering solar flame pools on the ground.',
    socketSlots: 2,
    value: 180,
    quantity: 1,
  },
  {
    id: 'wpn_sword_shield_1',
    name: 'Sunblade & Aegis Shield',
    type: 'weapon',
    rarity: 'rare',
    description: 'The standard issue kit of the Solar Vanguard. Optimized for perfect parries.',
    icon: 'Shield',
    weaponType: 'sword_and_shield',
    stats: { damage: 34, armor: 25, health: 60 },
    specialAffix: 'Perfect parries release a blinding burst that staggers nearby enemies.',
    socketSlots: 2,
    value: 130,
    quantity: 1,
  },
  {
    id: 'armor_chest_vanguard',
    name: 'Vanguard Cuirass',
    type: 'armor_chest',
    rarity: 'uncommon',
    description: 'Riveted bronze plate backed by thick boiled leather.',
    icon: 'ShieldCheck',
    stats: { armor: 35, health: 80 },
    value: 75,
    quantity: 1,
  },
  {
    id: 'mat_ironwood',
    name: 'Petrified Ironwood',
    type: 'material',
    rarity: 'common',
    description: 'Dense timber harvested from ancient trees. Essential for camp building.',
    icon: 'TreePine',
    value: 8,
    quantity: 12,
  },
  {
    id: 'mat_sunstone',
    name: 'Sunstone Aether Shard',
    type: 'material',
    rarity: 'rare',
    description: 'Radiant crystal fragment carrying the primordial warmth of the First Sun.',
    icon: 'Sparkles',
    value: 25,
    quantity: 5,
  },
  {
    id: 'mat_stone',
    name: 'Quarried Granite',
    type: 'material',
    rarity: 'common',
    description: 'Sturdy foundation stone gathered from the shoreline cliffs.',
    icon: 'Box',
    value: 5,
    quantity: 15,
  },
  {
    id: 'cons_potion',
    name: 'Solar Healing Draught',
    type: 'consumable',
    rarity: 'uncommon',
    description: 'Restores 120 Health instantly and cures bleeding status.',
    icon: 'HeartPulse',
    value: 20,
    quantity: 4,
  },
  {
    id: 'cons_roast',
    name: 'Roasted Boar with Moon-Berries',
    type: 'consumable',
    rarity: 'uncommon',
    description: 'Hearty survival meal. Grants +100 Max HP and +2 Stamina Regen for 10 minutes.',
    icon: 'UtensilsCrossed',
    value: 30,
    quantity: 2,
  }
];

export const STARTER_SKILLS: SkillTalent[] = [
  {
    id: 'skill_whirlwind',
    name: 'Solar Cleave',
    tier: 1,
    icon: 'Flame',
    description: 'Spin in a 360-degree arc, dealing 180% weapon damage and staggering light foes.',
    cooldown: 6,
    staminaCost: 25,
    aetherCost: 15,
    unlocked: true,
    type: 'active',
  },
  {
    id: 'skill_dash_strike',
    name: 'Aether Rush',
    tier: 1,
    icon: 'Zap',
    description: 'Lunge forward 8 meters with invulnerability frames, slashing all targets in your path.',
    cooldown: 8,
    staminaCost: 20,
    aetherCost: 20,
    unlocked: true,
    type: 'active',
  },
  {
    id: 'skill_parry_mastery',
    name: 'Kinetic Deflection',
    tier: 1,
    icon: 'ShieldAlert',
    description: 'Increases the Perfect Parry window by 0.05s and counter-attack damage by 40%.',
    cooldown: 0,
    staminaCost: 0,
    aetherCost: 0,
    unlocked: true,
    type: 'passive',
  },
  {
    id: 'skill_ultimate_zenith',
    name: 'Wrath of the Zenith',
    tier: 3,
    icon: 'Sun',
    description: 'Summon a catastrophic pillar of solar fire that incinerates the target area for 500% damage and restores your stamina.',
    cooldown: 35,
    staminaCost: 0,
    aetherCost: 80,
    unlocked: true,
    type: 'ultimate',
  }
];

export const INITIAL_COMPANION_KAELEN: Companion = {
  id: 'kaelen_drake',
  name: 'Kaelen Drake',
  title: 'Exiled Sun-Knight',
  avatar: 'UserCheck',
  relationshipScore: 35,
  relationshipStatus: 'friendly',
  combatArchetype: 'vanguard',
  currentHp: 450,
  maxHp: 450,
  isSummoned: true,
  quote: '"Keep your shield raised and your eyes forward. Sol-Vaelen gives no second chances."',
  backstorySnippet: 'Former commander of the 3rd Sun-Ward garrison. Branded a traitor when he defied orders to leave the refugee convoys behind during the Zenith collapse.'
};

export const STARTER_QUESTS: Quest[] = [
  {
    id: 'q_prologue',
    title: 'Act I: Embers in the Wreckage',
    type: 'main',
    description: 'Gather salvaged materials along the beach, recover your primary weapon, and rendezvous with Kaelen near the ancient monolith.',
    giver: 'Castaway Log',
    progress: 1,
    maxProgress: 3,
    targetDescription: 'Survive hostile wild creatures and establish a base camp',
    isCompleted: false,
    rewards: { xp: 350, gold: 50, items: [STARTER_ITEMS[0]] }
  },
  {
    id: 'q_hunt_threshers',
    title: 'Bounty: Tide-Beast Purge',
    type: 'bounty',
    description: 'Cull the mutated Corrupted Threshers patrolling the shallows to secure the trade trail.',
    giver: 'Kaelen Drake',
    progress: 0,
    maxProgress: 4,
    targetDescription: 'Defeat 4 Corrupted Threshers',
    isCompleted: false,
    rewards: { xp: 220, gold: 35 }
  },
  {
    id: 'q_boss_gorgarok',
    title: 'World Trial: The Crystal Devourer',
    type: 'exploration',
    description: 'Venture into the Sunken Grotto and slay Gorgarok before the beast consumes the remaining aether veins.',
    giver: 'Archivist Maeve',
    progress: 0,
    maxProgress: 1,
    targetDescription: 'Slay Gorgarok in combat',
    isCompleted: false,
    rewards: { xp: 800, gold: 150, items: [STARTER_ITEMS[3]] }
  }
];

export const INITIAL_DIALOGUES: Record<string, DialogueNode> = {
  kaelen_intro: {
    id: 'kaelen_intro',
    speaker: 'Kaelen Drake',
    text: 'You\'re breathing. Good. Many didn\'t survive when the flagship shattered against the reef. Grab some timber and stone—if we don\'t get a fire going before the umbral storm hits, the cold will kill us before the beasts do.',
    voiceLine: 'kaelen_intro',
    options: [
      {
        text: 'Who attacked our vessel? That storm wasn\'t natural.',
        nextNodeId: 'kaelen_malakor_reveal',
        affinityChange: 5,
      },
      {
        text: 'I can take care of myself. Point me to the nearest weapon.',
        nextNodeId: 'kaelen_pragmatic',
        affinityChange: 2,
      },
      {
        text: 'We should look for other survivors first.',
        nextNodeId: 'kaelen_empathy',
        affinityChange: 10,
      }
    ]
  },
  kaelen_malakor_reveal: {
    id: 'kaelen_malakor_reveal',
    speaker: 'Kaelen Drake',
    text: 'It was Archon Malakor. He\'s using the broken celestial fragments to shatter what remains of the provincial wards. He wants the world in chaos so none can challenge his ascension.',
    options: [
      {
        text: 'Then we forge our strength and stop him. Together.',
        nextNodeId: 'kaelen_pledge',
        affinityChange: 10,
      },
      {
        text: 'Let us focus on our survival today.',
        nextNodeId: 'kaelen_ready',
        affinityChange: 5,
      }
    ]
  },
  kaelen_empathy: {
    id: 'kaelen_empathy',
    speaker: 'Kaelen Drake',
    text: 'A noble heart in a cruel world. I respect that. But we can help no one if we freeze on this shoreline. Let us build a fortified shelter first, then scout the perimeter.',
    options: [
      {
        text: 'Agreed. Let\'s get to work.',
        nextNodeId: 'kaelen_ready',
        affinityChange: 5,
      }
    ]
  },
  kaelen_pragmatic: {
    id: 'kaelen_pragmatic',
    speaker: 'Kaelen Drake',
    text: 'Spoken like a true survivor. The sands are crawling with corrupted threshers. Keep your guard high and remember to parry right as their claws flash.',
    options: [
      {
        text: 'Understood. Watch my back.',
        nextNodeId: 'kaelen_ready',
        affinityChange: 5,
      }
    ]
  },
  kaelen_pledge: {
    id: 'kaelen_pledge',
    speaker: 'Kaelen Drake',
    text: 'Aye. It has been a long time since I fought alongside someone with fire in their eyes. Stand fast, survivor. Today, we rebuild.',
    options: [
      {
        text: 'For Aethelgard.',
        affinityChange: 15,
      }
    ]
  },
  kaelen_ready: {
    id: 'kaelen_ready',
    speaker: 'Kaelen Drake',
    text: 'I\'ll cover your flank. Call upon me whenever you engage hostile targets.',
    options: [
      {
        text: 'Let\'s hunt.',
      }
    ]
  }
};
