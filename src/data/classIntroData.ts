import { CombatArchetype } from '../types/game';

export interface ClassIntroScenario {
  archetype: CombatArchetype;
  className: string;
  locationName: string;
  openingLore: string;
  fantasyQuote: string;
  signatureMomentTitle: string;
  signatureMomentSummary: string;
  steps: {
    id: string;
    actionName: string;
    abilityName: string;
    description: string;
    buttonLabel: string;
    instruction: string;
    resultText: string;
    soundFx: 'block' | 'parry' | 'cast' | 'hit' | 'levelUp';
  }[];
}

export const CLASS_INTRO_SCENARIOS: Record<CombatArchetype, ClassIntroScenario> = {
  vanguard: {
    archetype: 'vanguard',
    className: 'Solar Vanguard',
    locationName: 'Wreckage of the Citadel Flagship',
    openingLore: 'You wake among shattered iron timbers. A ferocious Eclipse-mutated Brute is bearing down upon a trapped family of refugees. Your heavy greatshield is half-buried in the sand.',
    fantasyQuote: '"Let them break upon our steel. Not one innocent soul falls while a Vanguard breathes."',
    signatureMomentTitle: 'The Unbreakable Line',
    signatureMomentSummary: 'Stand between the Eclipse Brute and the fleeing survivors, executing a perfect counter-stagger.',
    steps: [
      {
        id: 'step_1',
        actionName: 'Raise Vanguard Guard',
        abilityName: 'Bulwark of the Citadel',
        description: 'The brute leaps with claws raised! Stand firm and absorb the kinetic blow.',
        buttonLabel: 'Hold Guard (Q)',
        instruction: 'Brace your boots into the surf and raise your shield to negate 100% incoming physical damage.',
        resultText: 'CLANG! The brute\'s heavy claws bounce off your tempered aegis with a shower of sparks. Guard held firm!',
        soundFx: 'block'
      },
      {
        id: 'step_2',
        actionName: 'Time a Perfect Parry',
        abilityName: 'Reflecting Aegis',
        description: 'The beast recoils, then lunges with an overhead crushing slam. Time your parry right as the blow lands.',
        buttonLabel: 'Execute Perfect Parry (Space)',
        instruction: 'Deflect the attack at the precise apex of impact to stagger the beast and break its poise.',
        resultText: 'PERFECT PARRY! A blinding kinetic shockwave erupts, snapping the brute\'s posture and exposing its vital chest core!',
        soundFx: 'parry'
      },
      {
        id: 'step_3',
        actionName: 'Heavy Stagger Strike',
        abilityName: 'Solar Cleave',
        description: 'Channel your Might into a two-handed downward cleave while the beast is off-balance.',
        buttonLabel: 'Unleash Solar Cleave (Right Click)',
        instruction: 'Strike through the armored plates with overwhelming crushing force.',
        resultText: 'CRUSHING HIT! Your greatblade cleaves through the beast\'s shoulder, shattering its armor into obsidian shards!',
        soundFx: 'hit'
      },
      {
        id: 'step_4',
        actionName: 'Signature Vanguard Finisher',
        abilityName: 'Wrath of the Zenith',
        description: 'Draw upon the surviving warmth in your veins to incinerate the abomination.',
        buttonLabel: 'Vanguard Execution (R)',
        instruction: 'Call down radiant solar flame to permanently protect the grateful refugees.',
        resultText: 'The abomination collapses into ash as golden embers shield the refugees. The family is safe!',
        soundFx: 'levelUp'
      }
    ]
  },

  spellblade: {
    archetype: 'spellblade',
    className: 'Aether Spellblade',
    locationName: 'The Fractured Aether Spires',
    openingLore: 'An unstable void rift has torn through the crystalline rocks above the shore, siphoning the life from the sea. Raw magical lightning arcs across your runic blade.',
    fantasyQuote: '"Magic is not a spoken prayer—it is an edge honed by will and drawn across reality."',
    signatureMomentTitle: 'Harmonizing the Rift',
    signatureMomentSummary: 'Blend lightning-fast swordplay with radiant elemental aether to overload and seal a collapsing rift.',
    steps: [
      {
        id: 'step_1',
        actionName: 'Imbue Weapon with Aether',
        abilityName: 'Arcane Resonant Blade',
        description: 'Draw ambient energy into the steel of your blade until it hums at 10,000 vibrations per second.',
        buttonLabel: 'Weave Aether Infusion (E)',
        instruction: 'Convert your physical weapon into an elemental conduit of pure crackling power.',
        resultText: 'Your blade ignites with luminescent cyan flame! Physical strikes will now trigger elemental chain bursts.',
        soundFx: 'cast'
      },
      {
        id: 'step_2',
        actionName: 'Phase Dash Through Tendrils',
        abilityName: 'Aether Blink Rush',
        description: 'Void tendrils whip from the rift! Shift through dimensional space to evade.',
        buttonLabel: 'Aether Blink (Shift)',
        instruction: 'Teleport behind the unstable anomaly, gaining instantaneous invulnerability frames.',
        resultText: 'WHOOSH! You dissolve into luminous ribbons of light, dodging the tentacles and emerging directly behind the rift!',
        soundFx: 'cast'
      },
      {
        id: 'step_3',
        actionName: 'Elemental Spell Strike',
        abilityName: 'Twin Storm Cleave',
        description: 'Strike the rift\'s core with a combination of razor steel and lightning.',
        buttonLabel: 'Perform Arc Strike (Left Click)',
        instruction: 'Deliver three rapid strikes that convert blade momentum into a burst of aether.',
        resultText: 'TRIPLE COMBO! Arcane electricity rips through the rift membrane, fracturing its containment matrix!',
        soundFx: 'hit'
      },
      {
        id: 'step_4',
        actionName: 'Signature Rift Detonation',
        abilityName: 'Solar Cataclysm Burst',
        description: 'Channel all accumulated aether to seal the rift in a harmless burst of golden sparks.',
        buttonLabel: 'Seal Aether Rift (R)',
        instruction: 'Thrust your blade into the ground, grounding the rogue dimensional energy.',
        resultText: 'The rift violently contracts and implodes, showering the cliffs in harmless crystalline stardust. The air is calm!',
        soundFx: 'levelUp'
      }
    ]
  },

  shadowstrider: {
    archetype: 'shadowstrider',
    className: 'Shadow Strider',
    locationName: 'Umbral Cleft Overlook',
    openingLore: 'An Eclipse Herald is preparing an occult ritual to summon an abyssal army from the deep trenches. Hidden in the tall sea-grass, you unsheathe your dual fangs.',
    fantasyQuote: '"The light blinds, but the shadows remember. Strike once, strike true, and vanish."',
    signatureMomentTitle: 'Silence the Eclipse Herald',
    signatureMomentSummary: 'Infiltrate the enemy encampment, evade scouts, and eliminate the ritual herald from behind.',
    steps: [
      {
        id: 'step_1',
        actionName: 'Mantle the Umbral Shroud',
        abilityName: 'Cloak of the Twilight Veil',
        description: 'Blend your outline into the ambient shadows to become completely invisible to the patrolling cultists.',
        buttonLabel: 'Enter Stealth (C)',
        instruction: 'Suppress your footfalls and slip past the perimeter guard dogs.',
        resultText: 'Your silhouette blurs like black ink in water. Patrols pass within inches without noticing you!',
        soundFx: 'cast'
      },
      {
        id: 'step_2',
        actionName: 'Distraction Bow Shot',
        abilityName: 'Ranger Sonic Arrow',
        description: 'Fire a whisper-quiet arrow at the distant bell-tower to turn the Herald\'s bodyguards away.',
        buttonLabel: 'Fire Distraction Arrow (Left Click)',
        instruction: 'Lure the heavy armored guards away from the sacrificial altar.',
        resultText: 'THWIP! The arrow strikes the bronze bell with a reverberating toll. The bodyguards rush to investigate!',
        soundFx: 'hit'
      },
      {
        id: 'step_3',
        actionName: 'Critical Backstab Ambush',
        abilityName: 'Shadowstrike Execution',
        description: 'Spring from the shadows behind the unsuspecting Eclipse Herald.',
        buttonLabel: 'Execute Ambush (Right Click)',
        instruction: 'Drive both venom-coated blades into the unprotected gaps of the Herald\'s ceremonial robes.',
        resultText: 'DEVASTATING CRITICAL! 1,240 damage! The Herald gags in shock as dark blood pools across the altar stones.',
        soundFx: 'parry'
      },
      {
        id: 'step_4',
        actionName: 'Apply Twilight Bleed',
        abilityName: 'Phantom Flurry Finisher',
        description: 'Twirl in a whirlwind of razor slashes to finish the Herald before the alarm sounds.',
        buttonLabel: 'Phantom Execution (R)',
        instruction: 'Sever the ritual cords and leap back into the twilight mist.',
        resultText: 'The Herald collapses silently, the ritual broken and the summoning runes dissipated. You slip away unseen!',
        soundFx: 'levelUp'
      }
    ]
  },

  solarwarden: {
    archetype: 'solarwarden',
    className: 'Solar Warden',
    locationName: 'The Defiled Sun Shrine',
    openingLore: 'The altar of the Sun-Goddess is overrun by void hounds. A group of wounded castaways is huddled behind a crumbling balustrade as dark miasma creeps toward them.',
    fantasyQuote: '"Where darkness would swallow the weak, we plant our banners and ignite the dawn."',
    signatureMomentTitle: 'Sanctuary of the First Dawn',
    signatureMomentSummary: 'Shield wounded civilians from an Eclipse surge, mend their wounds, and purify the altar with solar light.',
    steps: [
      {
        id: 'step_1',
        actionName: 'Deploy Sanctuary Ward',
        abilityName: 'Aegis of the Sun-Mother',
        description: 'Plant your holy greatshield into the bedrock to erect an impenetrable golden dome over the civilians.',
        buttonLabel: 'Erect Solar Ward (Q)',
        instruction: 'Create a safe barrier that repels corrupted projectiles and shields nearby allies.',
        resultText: 'A shimmering golden dome snaps into existence! Dark miasma sizzles and evaporates against its perimeter.',
        soundFx: 'block'
      },
      {
        id: 'step_2',
        actionName: 'Channel Mending Light',
        abilityName: 'Embers of Compassion',
        description: 'Release warm solar rays into the wounded refugees, healing their bleeding wounds.',
        buttonLabel: 'Channel Healing Aura (E)',
        instruction: 'Restore health and purge status ailments from all companions in the ward.',
        resultText: 'Soft golden light bathes the survivors! Their fractured bones knit and their strength returns.',
        soundFx: 'cast'
      },
      {
        id: 'step_3',
        actionName: 'Smite the Corrupted Altar',
        abilityName: 'Dawn-Hammer Retribution',
        description: 'Step forward from the barrier and strike the desecrated altar to shatter the void crystals.',
        buttonLabel: 'Radiant Smite (Right Click)',
        instruction: 'Infuse your weapon with righteous fury to banish the abyss hounds.',
        resultText: 'KABOOM! Holy sunlight detonates through the altar, disintegrating the shadow beasts into fleeing winks of smoke!',
        soundFx: 'hit'
      },
      {
        id: 'step_4',
        actionName: 'Signature Sun-Totem Beacon',
        abilityName: 'Beacon of the Living Star',
        description: 'Plant the eternal flame upon the altar to restore warmth to the entire coastal district.',
        buttonLabel: 'Rekindle Sacred Brazier (R)',
        instruction: 'Ignite the altar with primordial sunlight that pierces the eclipse clouds.',
        resultText: 'A towering pillar of pure sunlight pierces the overcast sky, driving the darkness miles back. The survivors cheer in reverence!',
        soundFx: 'levelUp'
      }
    ]
  }
};
