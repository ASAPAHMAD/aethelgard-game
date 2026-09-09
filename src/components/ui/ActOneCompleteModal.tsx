import React, { useState } from 'react';
import { 
  Trophy, 
  Sun, 
  Shield, 
  Sword, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Flame, 
  Crown, 
  Coins, 
  Compass, 
  Users 
} from 'lucide-react';
import { CombatArchetype, Item } from '../../types/game';
import { CLASS_SPECIFIC_WEAPONS, ACT_ONE_RELICS } from '../../data/chapterOneQuests';
import { audioEngine } from '../../services/audioEngine';
import confetti from 'canvas-confetti';

interface ActOneCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerArchetype: CombatArchetype;
  characterName: string;
  onClaimRewards: (weapon: Item, relic: Item) => void;
}

export const ActOneCompleteModal: React.FC<ActOneCompleteModalProps> = ({
  isOpen,
  onClose,
  playerArchetype,
  characterName,
  onClaimRewards
}) => {
  const [selectedRelicIndex, setSelectedRelicIndex] = useState<number>(0);
  const [claimed, setClaimed] = useState<boolean>(false);

  if (!isOpen) return null;

  const classWeapon = CLASS_SPECIFIC_WEAPONS[playerArchetype] || CLASS_SPECIFIC_WEAPONS.vanguard;
  const chosenRelic = ACT_ONE_RELICS[selectedRelicIndex];

  const handleClaim = () => {
    setClaimed(true);
    audioEngine.playLevelUp();
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.5 }
    });
    onClaimRewards(classWeapon, chosenRelic);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
      <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-neutral-950 border border-amber-500/50 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 text-neutral-100 shadow-2xl relative">
        
        {/* BANNER HEADER */}
        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs uppercase tracking-widest">
            <Crown className="w-3.5 h-3.5" />
            <span>MAJOR MILESTONE ACHIEVED</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-wider bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
            ACT I COMPLETE: ECHOES OF THE FIRST SUN
          </h1>
          <p className="text-xs text-neutral-400 max-w-lg mx-auto leading-relaxed">
            Congratulations, <strong className="text-neutral-200">{characterName}</strong>. You have braved the shoreline cataclysm, bonded with Kaelen Drake, fortified Echo Camp, and purged the Sunken Sanctum.
          </p>
        </div>

        {/* SUMMARY MILESTONE TILES */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-neutral-900/70 border border-amber-500/20 text-center space-y-1">
            <Shield className="w-5 h-5 text-amber-400 mx-auto" />
            <div className="text-[10px] font-mono uppercase text-neutral-400">Settlement</div>
            <div className="text-xs font-bold text-neutral-100">Echo Camp Fortified</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-900/70 border border-amber-500/20 text-center space-y-1">
            <Users className="w-5 h-5 text-blue-400 mx-auto" />
            <div className="text-[10px] font-mono uppercase text-neutral-400">Companion</div>
            <div className="text-xs font-bold text-neutral-100">Kaelen Drake Sworn</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-900/70 border border-amber-500/20 text-center space-y-1">
            <Sparkles className="w-5 h-5 text-purple-400 mx-auto" />
            <div className="text-[10px] font-mono uppercase text-neutral-400">Mastery</div>
            <div className="text-xs font-bold text-neutral-100">Class Ascendancy</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-900/70 border border-amber-500/20 text-center space-y-1">
            <Sun className="w-5 h-5 text-amber-300 mx-auto" />
            <div className="text-[10px] font-mono uppercase text-neutral-400">The Spark</div>
            <div className="text-xs font-bold text-neutral-100">Sanctum Core Recovered</div>
          </div>
        </div>

        {/* REWARDS CEREMONY */}
        <div className="space-y-4 p-5 rounded-2xl bg-neutral-900/80 border border-amber-500/30">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-mono uppercase text-amber-400 flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span>GRAND ACT I REWARDS</span>
            </h3>
            <span className="text-[10px] font-mono text-neutral-400">
              Unique Weapon + Primeval Relic
            </span>
          </div>

          {/* CLASS WEAPON CARD */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-amber-500/40 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center flex-shrink-0">
              <Sword className="w-6 h-6 text-amber-400" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300">{classWeapon.name}</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {classWeapon.rarity} Weapon
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">{classWeapon.description}</p>
              <div className="text-[11px] font-mono text-amber-400/90 font-semibold">
                Affix: {classWeapon.specialAffix}
              </div>
            </div>
          </div>

          {/* CHOOSE A PRIMEVAL RELIC */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-neutral-300">
              Select Your Primeval Relic (Defines Your Build Playstyle):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ACT_ONE_RELICS.map((relic, idx) => {
                const isSelected = idx === selectedRelicIndex;
                return (
                  <button
                    key={relic.id}
                    onClick={() => setSelectedRelicIndex(idx)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected 
                        ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-500' 
                        : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-neutral-200">{relic.name}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <div className="text-[10px] text-neutral-400 leading-snug">{relic.specialAffix}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* CHAPTER II TEASER */}
        <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-2 text-xs">
          <div className="font-bold text-purple-300 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-purple-400" />
            <span>CHAPTER II TEASER: THE SHADOW OVER SOL-ISLE</span>
          </div>
          <p className="text-neutral-400 leading-relaxed">
            With the Sanctum spark awakened, the shroud over the inland mountain passes has thinned. Beyond the reef lies the forgotten city of <em>Oakhaven</em> and Archon Malakor's obsidian spires. Mythic Expeditions, tier-3 crafting, and open-world survival await!
          </p>
        </div>

        {/* ACTION BUTTON */}
        <div className="pt-2">
          {!claimed ? (
            <button
              onClick={handleClaim}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-extrabold text-xs tracking-widest uppercase transition-all shadow-xl flex items-center justify-center gap-2"
            >
              <span>Claim Act I Rewards & Forge Ahead</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-4 px-6 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-100 font-bold text-xs tracking-widest uppercase transition-all"
            >
              Enter Free Roam & Open-World Aethelgard
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
