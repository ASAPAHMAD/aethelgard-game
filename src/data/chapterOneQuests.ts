import { Quest, Item } from '../types/game';

export const CLASS_SPECIFIC_WEAPONS: Record<string, Item> = {
  vanguard: {
    id: 'wpn_sol_dominion',
    name: 'Sol-Dominion Greatblade',
    type: 'weapon',
    rarity: 'epic',
    description: 'Forged from the shattered sun-altar of Eldir. Inflicts overwhelming kinetic stagger and unleashes solar shockwaves on heavy impact.',
    icon: 'Sword',
    weaponType: 'greatsword',
    stats: { damage: 85, armor: 15, critChance: 15 },
    specialAffix: 'Heavy attacks deal +50% stagger damage and cause a secondary solar rupture.',
    socketSlots: 3,
    value: 450,
    quantity: 1
  },
  spellblade: {
    id: 'wpn_void_arcblade',
    name: 'Astral Arcblade',
    type: 'weapon',
    rarity: 'epic',
    description: 'Crystalline blade imbued with raw twilight aether. Perfectly balances elemental spellweaving with lightning-fast melee strikes.',
    icon: 'Sparkles',
    weaponType: 'sword_and_shield',
    stats: { damage: 74, aether: 50, critChance: 25 },
    specialAffix: 'Casting a spell infuses your next 3 attacks with 40% bonus elemental lightning.',
    socketSlots: 3,
    value: 450,
    quantity: 1
  },
  shadowstrider: {
    id: 'wpn_eclipse_fang',
    name: 'Twin Eclipse Fangs',
    type: 'weapon',
    rarity: 'epic',
    description: 'Obsidian daggers dipped in distilled void ichor. Rips through armor and leaves deep wounds that bleed twilight flame.',
    icon: 'Crosshair',
    weaponType: 'dual_axes',
    stats: { damage: 68, critChance: 35 },
    specialAffix: 'Critical strikes apply stacking Umbral Bleed and reset dodge cooldown.',
    socketSlots: 3,
    value: 450,
    quantity: 1
  },
  solarwarden: {
    id: 'wpn_aegis_zenith',
    name: 'Aegis of the Zenith',
    type: 'weapon',
    rarity: 'epic',
    description: 'A radiant heater shield and dawn-mace bearing the crest of the First Sun. Emits blinding solar light on impact.',
    icon: 'Shield',
    weaponType: 'sword_and_shield',
    stats: { damage: 62, armor: 45, health: 120 },
    specialAffix: 'Perfect parries blind all enemies in a 10m radius and restore 80 HP to all allies.',
    socketSlots: 3,
    value: 450,
    quantity: 1
  }
};

export const ACT_ONE_RELICS: Item[] = [
  {
    id: 'relic_solar_heart',
    name: 'Solar Heart of Eldir',
    type: 'relic',
    rarity: 'legendary',
    description: 'A pulsating ember recovered from the core altar of the Sunken Sanctum. Radiates primordial heat.',
    icon: 'Heart',
    stats: { aether: 60, health: 100 },
    specialAffix: 'BUILD MECHANIC: Perfect dodges surge Aether by 35 points; casting an ultimate triggers a solar shockwave.',
    socketSlots: 2,
    value: 600,
    quantity: 1
  },
  {
    id: 'relic_void_tether',
    name: 'Void-Weaver\'s Tether',
    type: 'relic',
    rarity: 'legendary',
    description: 'A braided cord of umbral silk that siphons ambient eclipse particles.',
    icon: 'Zap',
    stats: { critChance: 20, damage: 25 },
    specialAffix: 'BUILD MECHANIC: Slain enemies release twilight souls that restore 15 Stamina and grant +15% move speed for 6s.',
    socketSlots: 2,
    value: 600,
    quantity: 1
  },
  {
    id: 'relic_ironwood_root',
    name: 'Primeval Ironwood Knot',
    type: 'relic',
    rarity: 'legendary',
    description: 'A petrified root from the First Canopy that pulses with regenerative chlorophyll aether.',
    icon: 'TreePine',
    stats: { health: 150, armor: 30 },
    specialAffix: 'BUILD MECHANIC: Standing still or holding guard grants 5% Max HP regen every 2 seconds and unbreakable poise.',
    socketSlots: 2,
    value: 600,
    quantity: 1
  },
  {
    id: 'relic_dawn_aegis',
    name: 'Crest of the Golden Dawn',
    type: 'relic',
    rarity: 'legendary',
    description: 'An ancient medallion worn by the grand arbiters of Sol-Vaelen.',
    icon: 'Sun',
    stats: { armor: 35, aether: 40 },
    specialAffix: 'BUILD MECHANIC: Parrying or blocking an attack charges your next strike with 250% holy radiant damage.',
    socketSlots: 2,
    value: 600,
    quantity: 1
  }
];

export const CHAPTER_ONE_QUESTS: Quest[] = [
  {
    id: 'q_act0_1_strange_light',
    title: 'Quest 1: A Strange Light in the Sky',
    type: 'main',
    chapter: 1,
    state: 'active',
    description: 'A blinding violet rift tears across the horizon. Explore the shoreline anomalies, inspect damaged ancient solar technology, and recover your weapon.',
    giver: 'Survivor\'s Instinct',
    location: 'Sol-Vaelen Beachhead',
    progress: 0,
    maxProgress: 3,
    targetDescription: 'Inspect 3 Damaged Solar Conduits along the reef',
    isCompleted: false,
    whyDoingThis: 'The wreckage is unstable; the ancient solar machinery holds the only clue to what brought down our fleet.',
    whoHelping: 'Yourself and the surviving convoy passengers stranded in the freezing surf.',
    whatChangesIfSuccess: 'Secures your primary weapon and stabilizes the aether field around the beachhead.',
    rewards: {
      xp: 250,
      gold: 40,
      items: [
        {
          id: 'reward_sunsteel_scraps',
          name: 'Sunsteel Alloy Plating',
          type: 'material',
          rarity: 'rare',
          icon: 'Shield',
          description: 'High-grade solar alloy harvested from the ancient conduit.',
          value: 35,
          quantity: 4
        }
      ]
    }
  },
  {
    id: 'q_act0_2_ashes_old_world',
    title: 'Quest 2: Ashes of the Old World',
    type: 'main',
    chapter: 1,
    state: 'locked',
    description: 'Follow the smoke rising past the cliffs to discover a destroyed coastal settlement. Encroaching void corruption threatens trapped refugees.',
    giver: 'Castaway Scouts',
    location: 'Ruined Fishing Outpost',
    progress: 0,
    maxProgress: 4,
    targetDescription: 'Rescue 4 Trapped Settlers and eliminate Void Prowlers',
    isCompleted: false,
    whyDoingThis: 'The Eclipse corruption is spreading inland; civilians cannot survive without protection and sunstone heat.',
    whoHelping: 'Refugees from the fallen outpost who will become the first citizens of your camp.',
    whatChangesIfSuccess: 'Recruits initial survivors and provides the first major lore revelation regarding Archon Malakor.',
    rewards: {
      xp: 400,
      gold: 60
    }
  },
  {
    id: 'q_act0_3_first_survivor',
    title: 'Quest 3: The First Survivor',
    type: 'main',
    chapter: 1,
    state: 'locked',
    description: 'Rendezvous with Kaelen Drake near the ancient Monolith of Eldir. Uncover his past with the Citadel Guard and forge an alliance.',
    giver: 'Kaelen Drake',
    giverNpcId: 'kaelen_drake',
    location: 'Monolith of Eldir',
    progress: 0,
    maxProgress: 1,
    targetDescription: 'Speak with Kaelen and establish your mutual oath',
    isCompleted: false,
    whyDoingThis: 'Kaelen is a veteran soldier who possesses vital knowledge of the terrain, ancient ruins, and defensive strategy.',
    whoHelping: 'Kaelen Drake, giving him a renewed purpose after being dishonorably exiled for saving civilians.',
    whatChangesIfSuccess: 'Unlocks Kaelen as an active summoned combat companion with real-time support.',
    rewards: {
      xp: 450,
      gold: 75,
      reputation: 25
    }
  },
  {
    id: 'q_act1_4_beacon_echo_camp',
    title: 'Quest 4: The Beacon of Echo Camp',
    type: 'main',
    chapter: 1,
    state: 'locked',
    description: 'Clear the central clearing of beasts, construct a roaring driftwood fire, and recruit Torvald (Blacksmith), Maeve (Alchemist), and Varric (Scout) to upgrade to Settlement Level 2.',
    giver: 'Kaelen Drake',
    giverNpcId: 'kaelen_drake',
    location: 'Echo Camp Plateau',
    progress: 0,
    maxProgress: 3,
    targetDescription: 'Recruit 3 Specialists and upgrade Echo Camp to Level 2',
    isCompleted: false,
    whyDoingThis: 'Without a permanent fortified base with crafting and medical facilities, the survivors will freeze or be hunted.',
    whoHelping: 'The entire surviving expedition and the three master artisans.',
    whatChangesIfSuccess: 'Transforms Echo Camp from a crude fire pit into a fortified settlement with working forge, alchemy lab, and watchtower.',
    rewards: {
      xp: 600,
      gold: 120
    }
  },
  {
    id: 'q_act1_5_twilight_incursion',
    title: 'Quest 5: Twilight Eclipse Incursion',
    type: 'main',
    chapter: 1,
    state: 'locked',
    description: 'The sky turns pitch-black as the Twilight Eclipse surges! Defend Echo Camp through 5 escalating phases and slay the Eclipse Champion.',
    giver: 'Scout Varric',
    giverNpcId: 'npc_varric',
    location: 'Echo Camp Perimeter',
    progress: 0,
    maxProgress: 5,
    targetDescription: 'Survive all 5 Incursion phases and defeat the Eclipse Champion',
    isCompleted: false,
    whyDoingThis: 'The Eclipse is attempting to snuff out the last warm sanctuary on the coastline.',
    whoHelping: 'Every living soul in the region.',
    whatChangesIfSuccess: 'Permanently establishes Echo Camp as an unyielding regional bastion and triggers class ascendancy.',
    rewards: {
      xp: 850,
      gold: 200
    }
  },
  {
    id: 'q_act1_6_path_to_ascendancy',
    title: 'Quest 6: The Path to Ascendancy',
    type: 'main',
    chapter: 1,
    state: 'locked',
    description: 'Your battle against the Eclipse Champion has unlocked your latent potential. Complete your Class Specialization Trial to choose your advanced mastery branch.',
    giver: 'Archivist Maeve',
    giverNpcId: 'npc_maeve',
    location: 'Shrine of the Zenith',
    progress: 0,
    maxProgress: 1,
    targetDescription: 'Select your Class Specialization in the mastery tree',
    isCompleted: false,
    whyDoingThis: 'The trials ahead in the Sunken Sanctum require specialized combat techniques beyond ordinary training.',
    whoHelping: 'Your own growth as the champion of the First Sun.',
    whatChangesIfSuccess: 'Grants passive combat modifiers, specialized abilities, and unique class visual identity.',
    rewards: {
      xp: 750,
      gold: 150
    }
  },
  {
    id: 'q_act1_7_sunken_sanctum',
    title: 'Quest 7: The Sunken Sanctum of Eldir',
    type: 'main',
    chapter: 1,
    state: 'locked',
    description: 'Delve into the submerged ruins of the Sunken Sanctum. Restore power to ancient solar machinery, bypass the flooded aqueducts, and defeat The Eclipse Warden.',
    giver: 'Torvald Ironhand',
    giverNpcId: 'npc_torvald',
    location: 'Sunken Sanctum of Eldir',
    progress: 0,
    maxProgress: 4,
    targetDescription: 'Breach the Sanctum, restore solar power, and slay The Eclipse Warden',
    isCompleted: false,
    whyDoingThis: 'The Sanctum houses the slumbering core fragment of the First Sun that can rekindle warmth to the continent.',
    whoHelping: 'The future of all Aethelgard.',
    whatChangesIfSuccess: 'Defeats the primary regional threat and exposes the truth behind the First Sun\'s disappearance.',
    rewards: {
      xp: 1500,
      gold: 350
    }
  },
  {
    id: 'q_act1_8_revelation_epilogue',
    title: 'Quest 8: Echoes of the First Sun (Act I Epilogue)',
    type: 'main',
    chapter: 1,
    state: 'locked',
    description: 'Witness the memory left in the Sanctum Core. Discover that the First Sun was deliberately shattered, and prepare for the journey beyond the reef.',
    giver: 'The Core Memory of Sol',
    location: 'Sanctum Inner Vault',
    progress: 0,
    maxProgress: 1,
    targetDescription: 'Commune with the Sun Fragment and witness the Revelation',
    isCompleted: false,
    whyDoingThis: 'To understand who shattered the sun and why the Eclipse recognizes your blood.',
    whoHelping: 'Aethelgard\'s past, present, and future.',
    whatChangesIfSuccess: 'Completes Chapter I / Act I, grants unique class weapons & relics, and unlocks open-world exploration.',
    rewards: {
      xp: 2000,
      gold: 500
    }
  }
];
