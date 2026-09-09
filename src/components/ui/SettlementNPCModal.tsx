import React, { useState } from 'react';
import { 
  X, 
  Hammer, 
  BookOpen, 
  Compass, 
  Sparkles, 
  Volume2, 
  ShieldAlert, 
  Check, 
  ChevronRight, 
  ArrowUpCircle,
  Coins,
  Shield,
  Home,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { SettlementNPC, Item, PlayableOrigin } from '../../types/game';
import { SETTLEMENT_NPCS } from '../../data/storyNarrative';
import { audioEngine } from '../../services/audioEngine';

interface SettlementNPCModalProps {
  isOpen: boolean;
  onClose: () => void;
  gold: number;
  settlementLevel: number;
  playerOrigin?: PlayableOrigin;
  onUpgradeSettlement: () => void;
  onOpenTransmog: () => void;
  onCraftItem: (item: Partial<Item>, cost: number) => void;
}

const SETTLEMENT_TIERS = [
  {
    level: 1,
    name: 'Basic Survivor Camp',
    description: 'Driftwood campfire, salvaged shelters, and crude storage bins. Basic warmth and survival.',
    facilities: ['Driftwood Campfire', 'Salvage Cache'],
    unlockedServices: 'Resting for warmth, basic survival gear repair'
  },
  {
    level: 2,
    name: 'Fortified Settlement',
    description: 'Sturdy timber palisades to repel wandering beasts. Torvald unrolls his heavy anvil.',
    facilities: ['Timber Palisades', 'Sunsteel Forge', 'Transmog Wardrobe'],
    unlockedServices: 'Sunsteel weapon crafting, appearance customization, +10% Camp Defense'
  },
  {
    level: 3,
    name: 'Functional Frontier Village',
    description: 'A thriving community of castaways. Maeve establishes the botanical dispensary.',
    facilities: ['Maeve\'s Alchemy Lab', 'Refugee Shelters', 'Well of Light'],
    unlockedServices: 'Solar Ambrosia draught brewing, +20% HP regeneration near camp'
  },
  {
    level: 4,
    name: 'Regional Stronghold',
    description: 'Reinforced stone walls and high ballista watchtowers. Scouts map the deep wilderness.',
    facilities: ['Varric\'s High Watchtower', 'Stone Ramparts', 'Armory'],
    unlockedServices: 'High-tier monster bounties, -25% fast travel stamina cost'
  },
  {
    level: 5,
    name: 'Solar Sanctuary of Eldir',
    description: 'The ancient beacon radiates eternal dawn, casting away the Twilight Eclipse from the region.',
    facilities: ['Radiant Monolith Beacon', 'Grand Altar of Sol', 'Hall of Champions'],
    unlockedServices: 'Legendary Sunforged Relic forging, permanent regional cold immunity'
  }
];

export const SettlementNPCModal: React.FC<SettlementNPCModalProps> = ({
  isOpen,
  onClose,
  gold,
  settlementLevel,
  playerOrigin = 'sol_vaelen',
  onUpgradeSettlement,
  onOpenTransmog,
  onCraftItem
}) => {
  const [selectedNPC, setSelectedNPC] = useState<SettlementNPC>(SETTLEMENT_NPCS[0]);
  const [activeTab, setActiveTab] = useState<'services' | 'lore' | 'tiers'>('services');

  if (!isOpen) return null;

  const handleSpeak = (npc: SettlementNPC) => {
    setSelectedNPC(npc);
    const speakerKey = npc.id === 'npc_torvald' ? 'torvald' : npc.id === 'npc_varric' ? 'varric' : 'maeve';
    audioEngine.speakLine(npc.quote.replace(/"/g, ''), speakerKey as any);
  };

  const getIcon = (role: SettlementNPC['role']) => {
    switch (role) {
      case 'blacksmith': return Hammer;
      case 'herbalist': return BookOpen;
      case 'scout': return Compass;
      default: return Sparkles;
    }
  };

  const isIronwoodWeaver = playerOrigin === 'ironwood_weaver';
  const baseCost = settlementLevel * 150;
  const upgradeCost = isIronwoodWeaver ? Math.floor(baseCost * 0.7) : baseCost;
  const canAffordUpgrade = gold >= upgradeCost && settlementLevel < 5;

  const currentTier = SETTLEMENT_TIERS.find(t => t.level === settlementLevel) || SETTLEMENT_TIERS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-5xl h-[90vh] bg-neutral-950 border border-amber-500/40 rounded-3xl shadow-2xl flex flex-col text-neutral-100 overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-amber-400 tracking-wider">
                ECHO CAMP CITIZENS & SERVICES
              </h2>
              <p className="text-xs text-neutral-400">
                Settlement Level {settlementLevel} • Refuge of the Sun-Forged Exiles
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold">
              <Coins className="w-4 h-4" />
              <span>{gold}</span>
              <span className="text-[10px] text-neutral-400">GOLD</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-900 text-neutral-400 hover:text-neutral-100 border border-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* WORKBENCH BODY */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* LEFT 4 COLS: NPC LIST */}
          <div className="md:col-span-4 border-r border-neutral-800/80 bg-neutral-950 p-4 space-y-2.5 overflow-y-auto">
            <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
              Camp Specialists
            </div>
            {SETTLEMENT_NPCS.map(npc => {
              const isSelected = selectedNPC.id === npc.id;
              const Icon = getIcon(npc.role);
              return (
                <div
                  key={npc.id}
                  onClick={() => handleSpeak(npc)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-amber-500/15 border-amber-400 shadow-md' 
                      : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSelected ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-amber-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-neutral-100 truncate">{npc.name}</div>
                      <div className="text-[10px] text-amber-400/80 truncate">{npc.title}</div>
                    </div>
                    {isSelected && <ChevronRight className="w-4 h-4 text-amber-400" />}
                  </div>
                </div>
              );
            })}

            {/* SETTLEMENT LEVEL UPGRADE CARD */}
            <div className="mt-4 p-4 rounded-2xl bg-neutral-900/60 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300">CAMP REINFORCEMENT</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                  Tier {settlementLevel}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Upgrading Echo Camp unlocks higher-tier blacksmith recipes, expanded alchemy stocks, and defense palisades.
              </p>
              <button
                disabled={!canAffordUpgrade}
                onClick={onUpgradeSettlement}
                className={`w-full py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                  canAffordUpgrade 
                    ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md' 
                    : 'bg-neutral-900 text-neutral-600 border border-neutral-800 cursor-not-allowed'
                }`}
              >
                <ArrowUpCircle className="w-4 h-4" />
                <span>Upgrade Echo Camp ({upgradeCost} Gold)</span>
              </button>
            </div>
          </div>

          {/* RIGHT 8 COLS: ACTIVE NPC DIALOGUE & FACILITY SERVICES */}
          <div className="md:col-span-8 flex flex-col bg-neutral-950 overflow-hidden">
            {/* NPC PROFILE BANNER */}
            <div className="p-6 border-b border-neutral-800/80 bg-neutral-900/30 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base font-bold text-amber-400">{selectedNPC.name}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                    {selectedNPC.facility}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 italic font-serif mt-2 border-l-2 border-amber-500/50 pl-3">
                  {selectedNPC.quote}
                </p>
              </div>
              <button
                onClick={() => handleSpeak(selectedNPC)}
                className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-400 border border-neutral-800 transition-colors"
                title="Speak Voice Line"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            {/* SERVICE TABS */}
            <div className="flex items-center gap-2 px-6 py-2.5 border-b border-neutral-800 bg-neutral-900/20 text-xs">
              <button
                onClick={() => setActiveTab('services')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  activeTab === 'services' ? 'bg-amber-500/20 text-amber-300' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Facility Services
              </button>
              <button
                onClick={() => setActiveTab('lore')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  activeTab === 'lore' ? 'bg-amber-500/20 text-amber-300' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Specialist Dialogue & Lore
              </button>
              <button
                onClick={() => setActiveTab('tiers')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  activeTab === 'tiers' ? 'bg-amber-500/20 text-amber-300' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Settlement Progression (Tiers 1-5)
              </button>
            </div>

            {/* TAB CONTENT */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {activeTab === 'services' && (
                <div className="space-y-4">
                  <div className="text-xs text-neutral-400">
                    {selectedNPC.serviceDescription}
                  </div>

                  {/* TORVALD: BLACKSMITH SERVICES */}
                  {selectedNPC.id === 'npc_torvald' && (
                    <div className="space-y-3">
                      <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-neutral-200">Sunsteel Transmog Wardrobe</div>
                          <div className="text-[11px] text-neutral-400 mt-0.5">
                            Customize weapon visual skins, armor appearance, and cloak dyes without losing stats.
                          </div>
                        </div>
                        <button
                          onClick={onOpenTransmog}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md transition-all active:scale-95"
                        >
                          Open Wardrobe
                        </button>
                      </div>

                      <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-amber-300">Forge: Radiant Sol-Cleaver (Epic)</div>
                          <div className="text-[11px] text-neutral-400 mt-0.5">
                            Infused with raw Sunstone alloy. Adds +18 Might, +8 Tenacity, and Solar Cleave burst.
                          </div>
                        </div>
                        <button
                          disabled={gold < 60}
                          onClick={() => onCraftItem({
                            id: `weapon_epic_solcleaver_${Date.now()}`,
                            name: 'Radiant Sol-Cleaver',
                            type: 'weapon',
                            weaponType: 'greatsword',
                            rarity: 'epic',
                            stats: { might: 18, tenacity: 8, vitality: 6 },
                            value: 90,
                            description: 'A colossal two-handed blade forged by Torvald from salvaged Citadel beams.'
                          }, 60)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            gold >= 60 
                              ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md' 
                              : 'bg-neutral-900 text-neutral-600 border border-neutral-800 cursor-not-allowed'
                          }`}
                        >
                          Forge (60 Gold)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* MAEVE: HERBALIST & RELIC SERVICES */}
                  {selectedNPC.id === 'npc_maeve' && (
                    <div className="space-y-3">
                      <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-emerald-300">Brew: Solar Ambrosia (Restorative)</div>
                          <div className="text-[11px] text-neutral-400 mt-0.5">
                            Restores 120 Vitality and grants 10 minutes of complete frost/cold immunity.
                          </div>
                        </div>
                        <button
                          disabled={gold < 25}
                          onClick={() => onCraftItem({
                            id: `item_draught_${Date.now()}`,
                            name: 'Solar Ambrosia Draught',
                            type: 'consumable',
                            rarity: 'rare',
                            stats: { vitality: 10 },
                            value: 30,
                            description: 'A luminous golden potion distilled from tidal sea kelp and pulverized sunstones.'
                          }, 25)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            gold >= 25 
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-md' 
                              : 'bg-neutral-900 text-neutral-600 border border-neutral-800 cursor-not-allowed'
                          }`}
                        >
                          Brew (25 Gold)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* VARRIC: SCOUT & BOUNTY SERVICES */}
                  {selectedNPC.id === 'npc_varric' && (
                    <div className="space-y-3">
                      <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-sky-300">Bounty Contract: The Corrupted Tide-Leviathan</div>
                          <div className="text-[11px] text-neutral-400 mt-0.5">
                            A mutated behemoth stalking the outer reefs. Defeating it rewards 150 Gold & Mythic Shards.
                          </div>
                        </div>
                        <span className="px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-300 text-xs font-semibold">
                          Active in Open World
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'lore' && (
                <div className="space-y-4 text-xs leading-relaxed text-neutral-300">
                  {/* ORIGIN SPECIAL DIALOGUE */}
                  <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/40">
                    <div className="text-[10px] font-mono text-amber-400 uppercase tracking-wider mb-1">
                      Origin Resonance: {playerOrigin ? playerOrigin.replace('_', ' ').toUpperCase() : 'UNKNOWN'}
                    </div>
                    {playerOrigin === 'sol_vaelen' && (
                      <p className="text-neutral-300">
                        "Ah, a child of the High Citadel. You carry that ancient golden pride in your step. Your ancestors built the dynamos we now scavenge from the reefs—let us rebuild them together."
                      </p>
                    )}
                    {playerOrigin === 'ashen_reefbound' && (
                      <p className="text-neutral-300">
                        "Reef-scout! You know how to read the tides and pull life from the brine. The camp's fish-drying racks are stocked because of your keen eyes."
                      </p>
                    )}
                    {playerOrigin === 'ironwood_weaver' && (
                      <p className="text-neutral-300">
                        "An Ironwood timber-mason! Torvald bows his head to your expertise: 'With your guidance, every palisade costs 30% fewer resources and stands twice as strong against the frost.'"
                      </p>
                    )}
                    {playerOrigin === 'umbral_pariah' && (
                      <p className="text-neutral-300">
                        "You bear the mark of the deep shadows. The other survivors whisper, but I know the truth: you understand the Eclipse's hunger better than anyone alive."
                      </p>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800">
                    <div className="font-bold text-amber-300 mb-1">On the Twilight Eclipse</div>
                    <p className="text-neutral-400">
                      "When the sky turned violet, the older stones shattered first. The light didn't just vanish; it was drawn downward, like water down a sinkhole. Archon Malakor thinks the First Sun was a trap, but I've seen the things that crawl out of the dark. We need that warmth."
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800">
                    <div className="font-bold text-amber-300 mb-1">Echo Camp’s Destiny</div>
                    <p className="text-neutral-400">
                      "This beachhead is built over the foundation stones of the First Citadel. If we reinforce our palisades and rekindle the beacon, survivors from across the archipelago will see our light."
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'tiers' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900/80 border border-amber-500/30">
                    <div>
                      <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest">
                        CURRENT TIER {settlementLevel} OF 5
                      </span>
                      <h4 className="text-base font-bold text-neutral-100">{currentTier.name}</h4>
                      <p className="text-xs text-neutral-400 mt-0.5">{currentTier.description}</p>
                    </div>
                    {settlementLevel < 5 && (
                      <button
                        disabled={!canAffordUpgrade}
                        onClick={onUpgradeSettlement}
                        className={`px-4 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-md flex items-center gap-2 ${
                          canAffordUpgrade 
                            ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950' 
                            : 'bg-neutral-900 text-neutral-600 border border-neutral-800 cursor-not-allowed'
                        }`}
                      >
                        <ArrowUpCircle className="w-4 h-4" />
                        <span>Upgrade to Tier {settlementLevel + 1} ({upgradeCost}g)</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {SETTLEMENT_TIERS.map(tier => {
                      const isCurrent = tier.level === settlementLevel;
                      const isUnlocked = tier.level <= settlementLevel;
                      return (
                        <div 
                          key={tier.level}
                          className={`p-4 rounded-2xl border transition-all ${
                            isCurrent 
                              ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/50' 
                              : isUnlocked 
                                ? 'bg-neutral-900/60 border-neutral-800' 
                                : 'bg-neutral-950/80 border-neutral-900 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {isUnlocked ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Lock className="w-4 h-4 text-neutral-500" />
                              )}
                              <span className="text-xs font-bold text-neutral-200">
                                Level {tier.level}: {tier.name}
                              </span>
                            </div>
                            {isCurrent && (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-400 mb-2">{tier.description}</p>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {tier.facilities.map(f => (
                              <span key={f} className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300">
                                {f}
                              </span>
                            ))}
                          </div>
                          <div className="text-[11px] font-mono text-amber-400/90">
                            Unlocks: {tier.unlockedServices}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
