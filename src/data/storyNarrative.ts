import { 
  PlayableOrigin, 
  CombatArchetype, 
  ClassSpecialization, 
  SettlementNPC, 
  CinematicScene,
  VoiceProfileType
} from '../types/game';

export interface OriginData {
  id: PlayableOrigin;
  name: string;
  tagline: string;
  culture: string;
  history: string;
  startingLocation: string;
  voiceStyle: string;
  uniqueTraits: string[];
  cosmetics: string[];
  statBonusSnippet: string;
}

export const PLAYABLE_ORIGINS: Record<PlayableOrigin, OriginData> = {
  sol_vaelen: {
    id: 'sol_vaelen',
    name: 'Sol-Vaelen (Sun-Forged Highborne)',
    tagline: 'Heirs to the High Solar Citadel',
    culture: 'Disciplined scholars and solar knights who revere sacred geometry, golden architecture, and vows of honor.',
    history: 'Direct descendants of the Citadel council who governed during the final radiance of the First Sun. Their bloodline still resonates with ancient warmth.',
    startingLocation: 'Citadel Bastion Ruins',
    voiceStyle: 'Articulate, regal, measured cadence with resonant overtones.',
    uniqueTraits: ['Golden flecked irises', 'Intricate solar script tattoos', 'Natural Aether conductivity'],
    cosmetics: ['Citadel Gilded Crown', 'Sun-Forged Signet', 'Ceremonial Silk Sash'],
    statBonusSnippet: '+10% Aether Potency & increased poise against light attacks'
  },
  ashen_reefbound: {
    id: 'ashen_reefbound',
    name: 'Ashen Reefbound (Shore-Reavers)',
    tagline: 'Nomads of the Shimmering Shallows',
    culture: 'Hardened coastal reavers who navigate treacherous tides and salvage colossal shipwrecks and petrified leviathan bones.',
    history: 'Cast out when the coastal dikes crumbled three generations ago. They adapted to survive on scarce brine and raw tidal aether.',
    startingLocation: 'Shipwreck Trench',
    voiceStyle: 'Weathered, gravelly, blunt and direct with pragmatic dark humor.',
    uniqueTraits: ['Salt-weathered bronze skin', 'Tidal crest tattoos', 'Unyielding pain tolerance'],
    cosmetics: ['Chitin Bone Pauldron', 'Reaver Eye Patch', 'Coral Shell Talisman'],
    statBonusSnippet: '+15% Stamina Regen & +20% Warmth retention in cold weather'
  },
  ironwood_weaver: {
    id: 'ironwood_weaver',
    name: 'Ironwood Weavers (Sylvane Exiles)',
    tagline: 'Guardians of the Dying Primeval Grove',
    culture: 'Deep forest wardens bound in symbiotic covenant with the colossal petrified ironwood trees.',
    history: 'When the First Sun vanished, the Great Canopy began to petrify into crystalline wood. The Weavers stayed behind to safeguard the ancient root spirits.',
    startingLocation: 'Whispering Ironwood Glen',
    voiceStyle: 'Warm, melodic, introspective with soft natural breaths.',
    uniqueTraits: ['Bioluminescent chloromarkings', 'Slightly pointed ears', 'Deep empathetic instinct'],
    cosmetics: ['Living Amber Brooch', 'Ironwood Leaf Circlet', 'Druidic Feather Wraps'],
    statBonusSnippet: '+12% Critical Strike Chance & natural health regen near vegetation'
  },
  umbral_pariah: {
    id: 'umbral_pariah',
    name: 'Umbral Pariahs (The Eclipse-Touched)',
    tagline: 'Survivors of the Void Boundary',
    culture: 'Ostracized clans who were trapped on the twilight boundary during the First Eclipse. Feared by high society, but uniquely immune to madness.',
    history: 'Rather than succumbing to the dark void, their bodies adapted. Their veins pulse with twilight aether, granting them the ability to glimpse tearings in reality.',
    startingLocation: 'Twilight Chasm',
    voiceStyle: 'Whispering, low, stoic and enigmatic with quiet intensity.',
    uniqueTraits: ['Obsidian-tinged veins', 'Luminescent silver eyes', 'Resistance to void corruption'],
    cosmetics: ['Umbral Veil', 'Obsidian Shard Pendant', 'Shadow-Stitched Hood'],
    statBonusSnippet: '+15% Resistance to Eclipse Blight & bonus dodge invulnerability'
  }
};

export const VOICE_PROFILES: {
  id: VoiceProfileType;
  label: string;
  description: string;
  timbre: string;
  pitch: number;
  rate: number;
  sampleLine: string;
}[] = [
  {
    id: 'calm',
    label: 'Calm & Measured',
    description: 'Even-tempered and analytical; keeps composure under dire peril.',
    timbre: 'Clean, serene, steady mid-tones.',
    pitch: 1.0,
    rate: 0.95,
    sampleLine: 'The tides of aether flow where we direct them. Maintain your breath.'
  },
  {
    id: 'confident',
    label: 'Bold & Confident',
    description: 'Fearless and inspiring; rallies companions with unwavering resolve.',
    timbre: 'Resonant, projected, bright chest voice.',
    pitch: 1.05,
    rate: 1.05,
    sampleLine: 'Let the storm rage. My blade has cleaved greater horrors than this!'
  },
  {
    id: 'rough',
    label: 'Gravelly & Weathered',
    description: 'Hardened by countless battles and the bitter coastal cold.',
    timbre: 'Deep, rasping, low vocal fry.',
    pitch: 0.8,
    rate: 0.9,
    sampleLine: 'Talk less, strike true. The dead don’t care about your grand speeches.'
  },
  {
    id: 'stoic',
    label: 'Stoic & Disciplined',
    description: 'Unflinching soldier sworn to duty; speaks only when necessary.',
    timbre: 'Low, clipped, unwavering cadence.',
    pitch: 0.85,
    rate: 0.95,
    sampleLine: 'My shield stands between the innocent and the dark. Advance.'
  },
  {
    id: 'warm',
    label: 'Warm & Empathetic',
    description: 'Compassionate healer attuned to the pain of the wounded world.',
    timbre: 'Soft, melodious, inviting higher undertones.',
    pitch: 1.15,
    rate: 1.0,
    sampleLine: 'Do not despair. Even in the deepest night, embers of the sun remain.'
  },
  {
    id: 'mysterious',
    label: 'Enigmatic & Whispering',
    description: 'Touched by the twilight eclipse; speaks as if listening to distant realms.',
    timbre: 'Airy, intimate, slight breathy rasp.',
    pitch: 0.9,
    rate: 0.88,
    sampleLine: 'The First Sun did not die... it was pulled into the deep dark below.'
  }
];

export interface ClassDetails {
  id: CombatArchetype;
  name: string;
  title: string;
  fantasy: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  primaryRole: string;
  secondaryRoles: string[];
  weapons: string[];
  coreMechanics: string[];
  specializations: {
    id: ClassSpecialization;
    name: string;
    description: string;
    playstyle: string;
    keyAbility: string;
  }[];
  prologueObjective: string;
  prologueBriefing: string;
}

export const CLASS_DETAILS: Record<CombatArchetype, ClassDetails> = {
  vanguard: {
    id: 'vanguard',
    name: 'Vanguard',
    title: 'The Unyielding Wall',
    fantasy: 'Heavy frontline warrior wielding devastating two-handed swords or heavy tower shields. Controls the kinetic momentum of battle with unshakeable poise.',
    difficulty: 'Beginner',
    primaryRole: 'Tank / Frontline Bruiser',
    secondaryRoles: ['Crowd Controller', 'Armor Breaker'],
    weapons: ['Greatsword', 'Sword & Shield', 'Dual Cleavers'],
    coreMechanics: ['Kinetic Poise', 'Rage Stacking', 'Heavy Stagger Cleave', 'Counter-Shockwave'],
    specializations: [
      {
        id: 'guardian',
        name: 'Iron Guardian',
        description: 'Impenetrable fortress that absorbs lethal blows and protects party members with defensive aether barriers.',
        playstyle: 'High defense, sustained aggro, zero-stagger blocking.',
        keyAbility: 'Aegis Bastion (Absorbs 80% party damage for 6s)'
      },
      {
        id: 'berserker',
        name: 'Blood Berserker',
        description: 'Sacrifices defensive caution to convert incoming damage into raging kinetic strike power.',
        playstyle: 'High risk high reward, execution spinning cleaves, life leech.',
        keyAbility: 'Colossus Rampage (+40% attack speed, attacks heal 8% max HP)'
      },
      {
        id: 'warlord',
        name: 'Warlord Commander',
        description: 'Inspires allies with thundering battle shouts and coordinates synchronized party stagger attacks.',
        playstyle: 'Mid-range crowd control, group damage buffs, enemy armor shattering.',
        keyAbility: 'War Cry of the Zenith (Stuns all nearby enemies for 2.5s)'
      }
    ],
    prologueObjective: 'Hold the Perimeter & Defend the Refugee Wagon',
    prologueBriefing: 'The flagship has run aground on the reefs of Sol-Vaelen. As Vanguard, you must form an impenetrable line against the mutated tide-beasts while the wounded take cover.'
  },
  spellblade: {
    id: 'spellblade',
    name: 'Spellblade',
    title: 'Weaver of Blade & Flame',
    fantasy: 'Hybrid battlemage weaving ancient solar fire and kinetic swordplay. Glides through enemies with swift blink dashes, leaving blazing incendiary rifts in their wake.',
    difficulty: 'Intermediate',
    primaryRole: 'High Burst DPS',
    secondaryRoles: ['Battlemage', 'Area Denial'],
    weapons: ['Runebound Sword', 'Greatsword', 'Arcane Focus'],
    coreMechanics: ['Spell Infusion', 'Aether Overcharge', 'Elemental Dash', 'Ignite Combustion'],
    specializations: [
      {
        id: 'arcblade',
        name: 'Arcblade Sorcerer',
        description: 'Unleashes raw crystalline Aether beams and slices through reality to strike targets from multiple angles.',
        playstyle: 'Ranged-melee weaving, piercing energy projectiles, instant blinks.',
        keyAbility: 'Phase Sunder (Teleports behind target dealing 350% burst)'
      },
      {
        id: 'stormblade',
        name: 'Stormblade Tempest',
        description: 'Channels thunderous electrical arcs through rapid multi-hit fencing strikes.',
        playstyle: 'Lightning chains, high critical frequency, movement speed steroid.',
        keyAbility: 'Chain Tempest (Discharges lightning across 5 connected enemies)'
      },
      {
        id: 'sunblade',
        name: 'Sunblade Incarnate',
        description: 'Ignites weapons with pure primordial First Sun fire, causing enemies to detonate upon death.',
        playstyle: 'Sustained burn damage, AoE explosive zoning, solar shielding.',
        keyAbility: 'Solar Supernova (Ignites the ground with burning magma pools)'
      }
    ],
    prologueObjective: 'Stabilize the Overheating Aether Spire',
    prologueBriefing: 'An ancient crystalline spire salvaged from the wreckage has gone critical. You must harness your Aether resonance, defeat the volatile elementals, and contain the energy surge.'
  },
  shadowstrider: {
    id: 'shadowstrider',
    name: 'Shadow Strider',
    title: 'The Eclipse Phantom',
    fantasy: 'Lethal precision assassin and ranger hybrid. Slips between the cracks of perception, applying bleeding wounds and exploiting enemy attack recoveries.',
    difficulty: 'Advanced',
    primaryRole: 'Single-Target Burst DPS',
    secondaryRoles: ['Scout', 'Evasive Skirmisher'],
    weapons: ['Dual Daggers', 'Aether Bow', 'Throwing Blades'],
    coreMechanics: ['Shadow Veil', 'Flanking Criticals', 'Bleed Stacking', 'Extended Dodge i-frames'],
    specializations: [
      {
        id: 'assassin',
        name: 'Nightshade Assassin',
        description: 'Masters poison coatings and strikes from behind for catastrophic critical multipliers.',
        playstyle: 'Stealth entry, venom management, devastating backstabs.',
        keyAbility: 'Shadow Assassination (+250% critical damage from behind)'
      },
      {
        id: 'nighthunter',
        name: 'Grave Hunter',
        description: 'Marks high-value targets from afar with aether-charged trick shots and explosive traps.',
        playstyle: 'Kiting, piercing arrow salvos, caltrop trap zoning.',
        keyAbility: 'Solar Arrow Rain (Covers 15m radius in burning piercing arrows)'
      },
      {
        id: 'phantom',
        name: 'Void Phantom',
        description: 'Dissolves into shadows to avoid lethal blows completely and summons afterimages to confuse foes.',
        playstyle: 'Untargetability tricks, deceptive clones, phase evasion.',
        keyAbility: 'Eclipse Mirage (Leaves an exploding decoy and teleports to safety)'
      }
    ],
    prologueObjective: 'Scout the Ruined Watchpost & Rescue Trapped Scouts',
    prologueBriefing: 'The outpost atop the sea cliff has gone silent. Eliminate the corrupt ambushers silently and locate the missing scout manifests.'
  },
  solarwarden: {
    id: 'solarwarden',
    name: 'Solar Warden',
    title: 'Champion of the Dawn',
    fantasy: 'Holy warrior and protector of sacred shrines. Deflects darkness with blinding golden shields and calls upon celestial light to heal allies.',
    difficulty: 'Intermediate',
    primaryRole: 'Support / Hybrid Tank',
    secondaryRoles: ['Holy Paladin', 'Radiant Smiter'],
    weapons: ['Sword & Shield', 'Sun Staff', 'Blessed Greatsword'],
    coreMechanics: ['Solar Favor', 'Perfect Deflection Burst', 'Sanctuary Consecration', 'Dawn Light Heal'],
    specializations: [
      {
        id: 'dawn_knight',
        name: 'Dawn Paladin',
        description: 'Infuses armor with celestial sunlight, blinding foes on parry and smiting blasphemous abominations.',
        playstyle: 'Retribution tanking, holy smites, blind counter-bursts.',
        keyAbility: 'Judgment of Sol (Blinds all enemies for 3s and counters for 200% holy damage)'
      },
      {
        id: 'sun_priest',
        name: 'Solar Luminary',
        description: 'Plants radiant sun-totems that heal nearby companions and purge negative status ailments.',
        playstyle: 'Group support, sustained healing aura, ranged light beams.',
        keyAbility: 'Beacon of the First Sun (Heals all allies for 40% max HP over 5s)'
      },
      {
        id: 'radiant_guardian',
        name: 'Radiant Juggernaut',
        description: 'Becomes an immovable vessel of solar energy that commands the attention of every monster on the field.',
        playstyle: 'Massive threat generation, immunity shields, retaliatory burns.',
        keyAbility: 'Aegis of the Zenith (Invulnerable for 4s, reflects 50% damage taken)'
      }
    ],
    prologueObjective: 'Purge the Desecrators from the Sun Shrine Altar',
    prologueBriefing: 'Corrupt abyss-crawlers are defiling the ancient Sun Shrine. You must cleanse the sacred brazier, restore the ward, and drive back the shadow.'
  }
};

export const CINEMATIC_SCENES: Record<string, CinematicScene> = {
  prologue_intro: {
    id: 'prologue_intro',
    title: 'THE SHATTERED HEAVENS',
    subtitle: 'Aethelgard: Echoes of the First Sun',
    speaker: 'Narrator',
    voiceProfile: 'narrator',
    visualTheme: 'wreckage',
    paragraphs: [
      'For ten thousand winters, the First Sun did not merely shine upon Aethelgard... it was the living heart of reality itself. Its radiant aether held back the void and bound the continents together.',
      'Then, without warning, the Sun was torn from the sky. The heavens fractured into twilight. The great citadels crumbled into the rising tides.',
      'Civilizations clung to fragments—diminishing shards of warmth known as Sunstones. But today, the embers are growing cold. The Twilight Eclipse has begun.',
      'Our flagship shattered upon the uncharted reefs of Sol-Vaelen. You were thrown into the churning abyss... yet the embers in your blood refused to die.'
    ]
  },
  meeting_kaelen: {
    id: 'meeting_kaelen',
    title: 'THE EXILED SUN-KNIGHT',
    subtitle: 'A Familiar Shield on an Unfamiliar Shore',
    speaker: 'Kaelen Drake',
    voiceProfile: 'kaelen',
    visualTheme: 'ancient_ruins',
    paragraphs: [
      'You are on your feet. That makes two of us who didn\'t end up as food for the reef-threshers.',
      'Look at this sky. It\'s not an ordinary storm. The stars are bleeding violet. The wards around Sol-Vaelen have broken.',
      'I am Kaelen Drake. Formerly of the Citadel Guard, until I refused to let our high commanders abandon the refugee convoys.',
      'If we want to survive this night, we need shelter, fire, and steel. Stand with me, and we\'ll carve a home out of these ruins.'
    ]
  },
  malakor_revelation: {
    id: 'malakor_revelation',
    title: 'THE ARCHON\'S HERESY',
    subtitle: 'A Voice Echoes from the Ruined Core',
    speaker: 'Archon Malakor',
    voiceProfile: 'malakor',
    visualTheme: 'eclipse',
    paragraphs: [
      'Do you still worship the golden light, little survivor? Do you still pray to the star that kept your ancestors blind?',
      'Open your eyes. The First Sun was never a gift. It was a cosmic collar—an artificial cage built by ancient architects who feared mortal potential.',
      'They trapped this world in eternal stagnation so we would never evolve beyond their reach. The Eclipse is not a catastrophe; it is the breaking of our chains!',
      'When the last shard of the Sun dies, humanity will finally inherit the unfiltered cosmos. Stop fighting your own liberation.'
    ]
  },
  titan_stirring: {
    id: 'titan_stirring',
    title: 'THE TITAN STIRS',
    subtitle: 'The Roots of Aethelgard Awaken',
    speaker: 'Narrator',
    voiceProfile: 'narrator',
    visualTheme: 'titan',
    paragraphs: [
      'As the corrupt champion collapses into dust, a tremor shakes the sea floor. Deep beneath the bedrock, miles below the coral spires, something colossal shifts.',
      'A golden ocular fissure opens in the abyssal trench—an ancient titan, slumbering since the dawn of the First Sun, has opened its eye.',
      'The world is changing. The Eclipse is merely the threshold. To save Aethelgard—or to decide its true fate—you must establish a sanctuary.',
      'Gather the survivors. Forge your settlement. Welcome to Echo Camp.'
    ]
  }
};

export const SETTLEMENT_NPCS: SettlementNPC[] = [
  {
    id: 'npc_torvald',
    name: 'Torvald Ironhand',
    title: 'Master Blacksmith of the 3rd Garrison',
    role: 'blacksmith',
    unlocked: true,
    avatar: 'Hammer',
    quote: '"Give me petrified ironwood and sunstone alloy, and I\'ll forge you a blade that can cut through an eclipse."',
    facility: 'The Sunsteel Forge & Transmog Station',
    serviceDescription: 'Forges epic weapons, reinforces armor defense, and unlocks transmog gear customizations.'
  },
  {
    id: 'npc_maeve',
    name: 'Archivist Maeve',
    title: 'Scholar of the First Sun',
    role: 'herbalist',
    unlocked: true,
    avatar: 'BookOpen',
    quote: '"The ancients didn\'t record history in ink—they bound it into crystalline memories. Listen closely."',
    facility: 'Arcane Herbalist Laboratory & Lore Archive',
    serviceDescription: 'Brews restorative solar draughts, nourishment roasts, and deciphers ancient relic boons.'
  },
  {
    id: 'npc_varric',
    name: 'Scout Varric',
    title: 'Reef Ranger & Cartographer',
    role: 'scout',
    unlocked: true,
    avatar: 'Compass',
    quote: '"The tides hide more than just wrecks. There are caves out there that haven\'t seen sunlight in five centuries."',
    facility: 'Scout Watchtower & Bounty Board',
    serviceDescription: 'Reveals regional exploration nodes, tracks elite world monsters, and unlocks fast travel.'
  }
];
