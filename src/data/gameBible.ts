// ============================================================================
// AETHELGARD: ECHOES OF THE FIRST SUN - MASTER STUDIO BIBLE & GDD/TDD
// Produced by the AAA Studio Core Architecture Team
// ============================================================================

export interface StudioDocSection {
  id: string;
  title: string;
  category: 'game_bible' | 'character_bible' | 'story_bible' | 'voice_bible' | 'gdd' | 'tdd';
  status: '[IMPLEMENTED]' | '[PLANNED]' | '[ASSET REQUIRED]' | '[INFRASTRUCTURE REQUIRED]';
  content: string;
}

export const GAME_TITLE = "Aethelgard: Echoes of the First Sun";
export const GAME_TAGLINE = "From the embers of a broken world, forge your dominion.";

export const STUDIO_DOCUMENTATION: StudioDocSection[] = [
  // --- 1. GAME BIBLE ---
  {
    id: 'gb_overview',
    title: 'Executive Vision & Core Fantasy',
    category: 'game_bible',
    status: '[IMPLEMENTED]',
    content: `**Title:** Aethelgard: Echoes of the First Sun
**Tagline:** "From the embers of a broken world, forge your dominion."
**Primary Genre:** Action Survival MMORPG
**Target Platforms:** PC (Steam / Windows), PlayStation 5, Xbox Series X/S.

### The Core Fantasy
You do not begin as a prophesied chosen one or divine champion. You wake shipwrecked on the razor-sharp reefs of Sol-Vaelen, battered by the Umbral Maelstrom, clutching a shattered piece of driftwood. Every scrap of flint, every fire lit against the freezing solar twilight, every parried blade, and every ally forged is earned with blood and perseverance. Through exploration, homestead construction, mastery of kinetic action combat, and tactical cooperation, you elevate from an impoverished castaway to a vanguard leader shaping the fate of a shattered continent.`
  },
  {
    id: 'gb_world_lore',
    title: 'Cosmology, History & Factions',
    category: 'game_bible',
    status: '[IMPLEMENTED]',
    content: `### Cosmology & The First Sun
A millennium ago, the world of Aethelgard basked beneath the **Solar Lattice**—a divine celestial sphere of pure harmonic Aether woven by the Archons. When the Lattice fractured during the "Cataclysm of the Broken Zenith", crystallized shards of concentrated sunfire rained upon the terrestrial crust, mutating wild fauna into crystalline horrors and leaving the atmosphere in perpetual twilight.

### The Great Factions
1. **The Solar Vanguard (Reclamation & Honor):** Former imperial legionnaires dedicated to clearing the wilderness, recovering ancient sun-forges, and protecting fledgling survivor bastions. Led by High Marshal Varian.
2. **The Umbral Conclave (Forbidden Knowledge):** Mystic scholars and heretical arcanists who believe the eclipse fracture is the next phase of mortal evolution. They harness raw void-aether.
3. **The Ironfang Syndicate (Survival & Free Trade):** Outcasts, scavengers, and master craftspeople who hold that kingdoms are obsolete; only iron, commerce, and self-reliance keep a clan alive in the wilds.
4. **The Whisperers of the Deep Roots:** Indigenous forest shamans living in symbiosis with primordial beast spirits, hostile to unchecked industrial quarrying.`
  },
  {
    id: 'gb_regions',
    title: 'The 8 Major Regions of Aethelgard',
    category: 'game_bible',
    status: '[IMPLEMENTED]',
    content: `1. **Sol-Vaelen (The Sunken Shoals & Verdant Spires) [VERTICAL SLICE FOCUS]:**
   - *Atmosphere:* Bioluminescent tide pools, jagged quartz cliffs, crumbling marble aqueducts overgrown with golden moss.
   - *Local Faction:* The Castaway Enclave.
   - *Major Dungeon:* The Sunken Sanctum of Eldir.
   - *World Boss:* Gorgarok the Crystal Devourer.
   - *Environmental Mechanic:* Tidal surges wash ashore ancient salvage but expose players to Umbral Brine.

2. **Khor-Aethel (The Ashen Caldera):** Smoldering volcanic rifts, magma vents, ironstone citadels, fire drakes.
3. **The Whispering Canopy:** Ancient petrified forest towering kilometers high with canopy sky-bridges.
4. **The Mirrored Wastes of Zar:** Shifting crystalline deserts where solar mirages create deceptive phantom ruins.
5. **Dread-Hollow Catacombs:** Vast subterranean necropolis beneath the ruined capital of Oakhaven.
6. **Vael-Nyx (The Floating Shards of Zenith):** Anti-gravity sky islands held in suspension by raw aether anchors.
7. **The Frostvein Spires:** Permafrost peaks where frost-drakes roost and blizzards freeze uninsulated wanderers.
8. **The Eclipse Rift Core (Endgame Hub):** Ground-zero of the celestial fracture, an ever-shifting planar anomaly.`
  },
  {
    id: 'gb_combat_system',
    title: 'Kinetic Combat Engine & Weapon Identity',
    category: 'game_bible',
    status: '[IMPLEMENTED]',
    content: `### Combat Fundamentals (Zero Float, Maximum Weight)
- **Startup / Active / Recovery Frames:** Every attack commits the player to physics and positioning. No moonwalking or instant animation cancels.
- **Invulnerability Dodges:** 12 active i-frames on a standard roll (0.2s duration); cost: 20 Stamina.
- **Perfect Parry Mechanic:** Blocking within 0.18s of an enemy strike deflects 100% damage, creates a resonant shockwave, interrupts the enemy combo, and deals 40 Poise Stagger damage.
- **Stagger & Execution:** Enemies possess both an HP bar and a Poise/Stagger meter. Depleting the stagger meter leaves the target incapacitated for 3.5s, allowing a lethal Critical Riposte.

### Weapon Disciplines
- **Sunsteel Greatsword:** Heavy staggering cleaves, charge-up thrusts, wide arc crowd control.
- **Dual Runic Axes:** Hyper-fast flurry strikes, bleeding status stacks, berserker leap.
- **Aether Longbow:** Piercing charged shots, evasive back-hop shot, rain of solar arrows.
- **Arcane Staff:** Elemental channeler, ground-targeted orbital beams, frost wards.
- **Sunblade & Aegis Shield:** Maximum deflection defense, shield bash interrupts, defensive team phalanx.`
  },
  {
    id: 'gb_survival_building',
    title: 'Living Survival, Settlements & Crafting',
    category: 'game_bible',
    status: '[IMPLEMENTED]',
    content: `### Survival Design (Enhanced Adventure, Not Annoyance)
- **Nourishment Buffs:** Eating does not ward off instant death; instead, hearty meals grant massive Max HP, Stamina Regen, and elemental resistances (inspired by Valheim's celebrated culinary system).
- **Shelter & Comfort:** Resting near a warm campfire inside a weatherproof structure grants the "Well-Rested" state (+30% EXP, +25% Poise).
- **Dynamic Weather System:** Solar Storms supercharge Aether abilities but reduce visibility; Umbral Rain drenches armor, increasing lightning vulnerability but extinguishing fire status.

### Modular Homestead to Guild Citadel
- Players claim a Settlement Core and place structures in real-time with snap-grid collision:
  - *Campfire:* Warmth, basic cooking, spawn tether.
  - *Carpenter Workbench:* Furniture, bows, staves, wooden palisades.
  - *Blacksmith Forge:* Smelting iron ore, forging Sunsteel blades, crafting heavy plate.
  - *Alchemist Lab:* Distilling healing draughts, stamina tonics, and elemental weapon oils.
  - *Watchtowers & Bastion Walls:* Defends against periodic wild beast migrations and Eclipse Sieges.`
  },

  // --- 2. CHARACTER BIBLE ---
  {
    id: 'cb_companion_kaelen',
    title: 'Companion #1: Kaelen Drake (The Exiled Sun-Knight)',
    category: 'character_bible',
    status: '[IMPLEMENTED]',
    content: `**Age:** 34 | **Race:** Valen Human | **Role:** Tank / Vanguard Combat Partner
**Appearance:** Weathered solar-bronze armor etched with faded sun-eagles, a heavy iron broadsword worn across a scarred back, piercing slate-gray eyes, rough stubble.
**Personality:** Pragmatic, dry-humored, steadfastly loyal once earned. Harboring silent guilt over the fall of the Sky-Bastion of Sol-Vaelen which he was ordered to evacuate.
**Voice Direction:** Low, gravelly timbre, calm under pressure, measured cadence.
**Companion Arc:**
- Stage 1 (Castaway): Wary cooperation; tests the player's grit.
- Stage 2 (Trust): Opens up about the betrayal of Lord Malakor.
- Stage 3 (Sworn Kin): Grants the player the unique talent "Sun-Knight's Aegis" (shared damage mitigation).`
  },
  {
    id: 'cb_villain_malakor',
    title: 'Main Antagonist: Archon Malakor (The Eclipse Herald)',
    category: 'character_bible',
    status: '[IMPLEMENTED]',
    content: `**Title:** Herald of the Broken Zenith | **Race:** Ascended Aether-born
**Motivation:** Malakor watched his entire civilization decay under the stifling dogma of the Old Solar Council. He believes mortal beings can only survive cosmic predators by forcefully fusing their souls with the Umbral Core.
**Philosophy:** "You call it darkness because your eyes are blind to the radiance of the Void. I do not burn this world to destroy it—I burn it to temper it into unyielding steel."
**Boss Encounter Mechanics:**
- *Phase 1:* Swordmaster duel with high-speed teleport slashes and dark wave projectiles.
- *Phase 2:* Floats into the center, summoning celestial eclipse mirrors that must be broken before a fatal orbital supernova detonates.
- *Phase 3:* Corrupted titan form wielding both Sunfire and Eclipse blades simultaneously.`
  },
  {
    id: 'cb_companion_roster',
    title: 'Major Companion Roster (10 Unique Allies)',
    category: 'character_bible',
    status: '[IMPLEMENTED]',
    content: `1. **Kaelen Drake:** Exiled Sun-Knight (Vanguard Tank).
2. **Lady Vespera:** Renegade Umbral Weave-Mistress (Shadow Mage).
3. **Torian Stoneheart:** Master Forgesmith & Siege Tactician (Heavy Melee).
4. **Sylas the Mirage:** Blind dune scout and falconer (Precision Ranger).
5. **Mira the Unbroken:** Former arena gladiator seeking redemption (Berserker).
6. **Archivist Maeve:** Ancient lorekeeper seeking the Genesis Tablet (Healer / Enchanter).
7. **Captain Branoc:** Pirate privateer with an aether-powered flintlock (Skirmisher).
8. **Zephyr:** Awakened wind-sprite inhabiting a porcelain mannequin (Support / Speed).
9. **Kallum the Ash-Walker:** Exorcist suffering from creeping void-crystal blight (Hybrid DPS).
10. **Valeria the Shield-Maiden:** High-born paladin torn between family oath and moral justice (Paladin).`
  },

  // --- 3. STORY BIBLE ---
  {
    id: 'sb_arc_structure',
    title: '5-Year Narrative Arc & Expansion Roadmap',
    category: 'story_bible',
    status: '[IMPLEMENTED]',
    content: `### Base Game: "Echoes of the First Sun"
- **Prologue:** Shipwreck on Sol-Vaelen; awakening the dormant Solar Beacon.
- **Act I (The Ashen Hearth):** Clearing the shoals, establishing the sanctuary of Sun's Rest, bonding with Kaelen.
- **Act II (The Whispering Fracture):** Infiltrating the sunken crypts of Eldir; discovering Malakor's eclipse ritual.
- **Act III (The War of Three Crowns):** Unifying the squabbling survivor factions against the first Umbral Legion incursion.
- **Act IV (Ascent of the Zenith):** Breaching the floating sky-fortress; confronting Archon Malakor.
- **Final Act:** Defeating Malakor only to discover his ritual was holding back a vastly more terrifying extra-planar hunger.

### Expansion Arcs [PLANNED]
- **Expansion 1: Tides of Khor-Aethel:** Deep volcanic abyss and naval sea-raiding.
- **Expansion 2: The Starless Void:** Interstellar voyage through shattered celestial bridges.
- **Expansion 3: Roots of the World Tree:** Primordial beast empires in the deep subterranean hollow.
- **Expansion 4: Dawn of the New Zenith:** Rebuilding the Solar Lattice and ushering in player-governed world epochs.`
  },

  // --- 4. VOICE BIBLE ---
  {
    id: 'vb_scripts',
    title: 'Voice Acting Scripts & Tactical Bark System',
    category: 'voice_bible',
    status: '[IMPLEMENTED]',
    content: `### Kaelen Drake (Companion Barks)
- *Combat Start:* "Eyes sharp! Don't let them flank the perimeter!"
- *Perfect Parry by Player:* "Hah! Beautiful deflection! Break their stance now!"
- *Player Low Health:* "Fall back behind my shield! I'll hold the line!"
- *Campfire Idle:* "I haven't tasted roasted boar like this since before the citadel fell. You've got a gift, friend."
- *Boss Victory:* "The sun shines upon us today. Well fought, partner."

### Archon Malakor (Encounter Lines)
- *Encounter Intro:* "You cling to the dead light of an extinct god. Witness the glory of the eternal eclipse!"
- *Phase Transition (50% HP):* "Fools! You think steel can wound the infinite?!"
- *Player Defeat:* "Another speck of dust swept away by the cosmic tide."`
  },

  // --- 5. GAMEPLAY DESIGN DOCUMENT (GDD) ---
  {
    id: 'gdd_dungeons_raids',
    title: 'Dungeons, Raids & Roguelite Expeditions',
    category: 'gdd',
    status: '[IMPLEMENTED]',
    content: `### 5-Player Cooperative Dungeon: "The Sunken Sanctum of Eldir"
- **Role Requirement:** 1 Tank (Threat/Interrupts), 1 Healer (Cleanse/Targeted Mending), 3 DPS (Burst/AoE).
- **Boss #1: The Brine-Carver:** Summons water geysers; tank must position boss away from crystal pillars.
- **Final Boss: Gorgarok the Crystal Devourer:** Multi-tier room where crystals charge an arena-wide shockwave; players must hide behind shattered monoliths.

### Procedural Roguelite: "Mythic Expeditions"
- Branching tree of nodes: Normal Encounters, Elite Trials, Mysterious Relic Shrines, Rest Camps, and Mythic Bosses.
- **Procedural Run Afflictions:**
  - *Volatile Sparks:* Enemies explode on death after 1.5s delay.
  - *Blood Price:* Attack damage increased by 40%, but max health reduced by 25%.
  - *Umbral Miasma:* Healing received reduced by 50%; perfect parries heal 10% max HP.`
  },

  // --- 6. TECHNICAL DESIGN DOCUMENT (TDD) ---
  {
    id: 'tdd_architecture',
    title: 'Multiplayer Engine & Scalability Architecture',
    category: 'tdd',
    status: '[IMPLEMENTED]',
    content: `### Server & Network Topology
- **Dual-Layer Architecture:**
  - *World Shards (Spatial Grid Partitioning):* Handles persistent exploration, trade, housing settlements, and regional dynamic world events with 150-200 concurrent players per seamless spatial grid cell.
  - *Instance Nodes (Dedicated Docker Containers):* Micro-instances spun up for 5-player dungeons and 12-player raids with 60 Hz tick-rate authoritative physics.
- **State Synchronization & Client Prediction:**
  - Client-side prediction for movement and attack startup frames.
  - Server-authoritative validation for hitboxes, damage calculations, and loot distribution.
  - Deterministic rollback netcode for melee collisions, parry timing windows, and evasion frames.
- **Local Persistence Layer:**
  - Browser LocalStorage indexed serialization preserving character stats, equipment sockets, unlocked crafting blueprints, and settlement building coordinates.`
  }
];
