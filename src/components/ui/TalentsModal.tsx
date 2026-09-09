import React, { useState } from 'react';
import { X, Zap, Shield, Flame, Wind, Check, Lock, Sparkles } from 'lucide-react';
import { CombatArchetype } from '../../types/game';
import { audioEngine } from '../../services/audioEngine';

interface TalentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  archetype: CombatArchetype;
  level: number;
}

interface TalentNode {
  id: string;
  name: string;
  tier: number;
  archetype: CombatArchetype;
  description: string;
  unlocked: boolean;
}

const DEFAULT_TALENTS: TalentNode[] = [
  // Vanguard
  { id: 'v_1', name: 'Colossus Stance', tier: 1, archetype: 'vanguard', description: 'Heavy attacks cannot be interrupted by normal enemy strikes.', unlocked: true },
  { id: 'v_2', name: 'Shattering Impact', tier: 2, archetype: 'vanguard', description: 'Critical hits reduce enemy armor by 30% for 6 seconds.', unlocked: false },
  { id: 'v_3', name: 'Adamantine Will', tier: 3, archetype: 'vanguard', description: 'When falling below 25% HP, instantly regain 30% max health (120s cooldown).', unlocked: false },

  // Spellblade
  { id: 's_1', name: 'Solar Ignition', tier: 1, archetype: 'spellblade', description: 'Weapon strikes leave a blazing trail dealing 40 burn damage over 3s.', unlocked: true },
  { id: 's_2', name: 'Arcane Surge', tier: 2, archetype: 'spellblade', description: 'Consuming Aether charges resets your dodge roll cooldown.', unlocked: false },
  { id: 's_3', name: 'Supernova Flurry', tier: 3, archetype: 'spellblade', description: 'Wrath of the Zenith creates an expanding shockwave blinding all foes.', unlocked: false },

  // Shadow Strider
  { id: 'ss_1', name: 'Shadowstep Dash', tier: 1, archetype: 'shadowstrider', description: 'Dodge roll covers 30% more distance and grants 6 bonus invulnerability frames.', unlocked: true },
  { id: 'ss_2', name: 'Serrated Edges', tier: 2, archetype: 'shadowstrider', description: 'Strikes from behind have 100% chance to inflict bleed.', unlocked: false },
  { id: 'ss_3', name: 'Executioner\'s Mark', tier: 3, archetype: 'shadowstrider', description: 'Mark an enemy; your next heavy attack deals 250% critical damage.', unlocked: false },

  // Solar Warden
  { id: 'sw_1', name: 'Aegis Bulwark', tier: 1, archetype: 'solarwarden', description: 'Blocking absorbs 100% of damage without consuming stamina on the first hit.', unlocked: true },
  { id: 'sw_2', name: 'Parry Shockwave', tier: 2, archetype: 'solarwarden', description: 'A perfect parry emits a solar concussion wave staggering all nearby enemies.', unlocked: false },
  { id: 'sw_3', name: 'Beacon of Dawn', tier: 3, archetype: 'solarwarden', description: 'Allies and companion within 15 meters regenerate 5% HP per second.', unlocked: false }
];

export const TalentsModal: React.FC<TalentsModalProps> = ({
  isOpen,
  onClose,
  archetype,
  level
}) => {
  const [talents, setTalents] = useState<TalentNode[]>(DEFAULT_TALENTS);
  const [talentPoints, setTalentPoints] = useState<number>(Math.max(1, Math.floor(level / 2)));

  if (!isOpen) return null;

  const filteredTalents = talents.filter(t => t.archetype === archetype);

  const handleUnlock = (id: string) => {
    if (talentPoints <= 0) return;
    setTalents(prev => prev.map(t => t.id === id ? { ...t, unlocked: true } : t));
    setTalentPoints(p => p - 1);
    audioEngine.playLevelUp();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-neutral-950 border border-amber-500/30 rounded-2xl shadow-2xl p-6 flex flex-col gap-6 text-neutral-100">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-amber-400 tracking-wide">
                ARCHETYPE TALENTS & ASCENDANCY
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Specialized combat disciplines for the {archetype?.toUpperCase() || ''} mastery.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono font-bold text-amber-400 bg-neutral-900 px-3 py-1 rounded-lg border border-amber-500/30">
              {talentPoints} TALENT POINTS
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-neutral-900 text-neutral-400 hover:text-neutral-100 border border-neutral-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TALENT TREE TIERS */}
        <div className="flex flex-col gap-4">
          {filteredTalents.map(talent => (
            <div
              key={talent.id}
              className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
                talent.unlocked
                  ? 'bg-amber-950/20 border-amber-500/40 shadow-md'
                  : 'bg-neutral-900/50 border-neutral-800'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                    talent.unlocked
                      ? 'bg-amber-500/20 text-amber-400 border-amber-400'
                      : 'bg-neutral-800 text-neutral-500 border-neutral-700'
                  }`}
                >
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-display font-bold text-sm text-neutral-100">{talent.name}</h4>
                    <span className="text-[10px] font-mono uppercase bg-neutral-900 text-neutral-400 px-2 py-0.5 rounded border border-neutral-800">
                      Tier {talent.tier}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1 max-w-md">{talent.description}</p>
                </div>
              </div>

              {talent.unlocked ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <Check className="w-4 h-4" />
                  <span>MASTERED</span>
                </div>
              ) : (
                <button
                  onClick={() => handleUnlock(talent.id)}
                  disabled={talentPoints <= 0}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    talentPoints > 0
                      ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md'
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  UNLOCK (1 PT)
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
