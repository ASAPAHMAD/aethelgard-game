import React, { useState } from 'react';
import { 
  X, 
  Compass, 
  Flame, 
  Sparkles, 
  AlertOctagon, 
  Skull, 
  Check, 
  ArrowRight, 
  Trophy 
} from 'lucide-react';
import { ExpeditionNode, Item } from '../../types/game';
import { audioEngine } from '../../services/audioEngine';
import confetti from 'canvas-confetti';

interface MythicExpeditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGainReward: (xp: number, loot: Item) => void;
}

const SAMPLE_NODES: ExpeditionNode[] = [
  {
    id: 'node_1',
    type: 'combat',
    title: 'Crystal Shallows Perimeter',
    description: 'A pack of corrupted threshers ambushes your scout party.',
    affliction: 'Volatile Sparks (Foes explode on defeat)',
    completed: false,
    active: true
  },
  {
    id: 'node_2',
    type: 'event',
    title: 'Altar of the First Sun',
    description: 'An ancient radiant shrine offers blessing in exchange for stamina.',
    boon: 'Solar Flare (+30% Light attack fire damage)',
    completed: false,
    active: false
  },
  {
    id: 'node_3',
    type: 'elite',
    title: 'Umbral Spire Breach',
    description: 'A towering Aether Golem guards the planar fracture.',
    affliction: 'Blood Price (+40% Damage dealt, -25% Max HP)',
    completed: false,
    active: false
  },
  {
    id: 'node_4',
    type: 'boss',
    title: 'Phantom of Archon Malakor',
    description: 'A shadowy echo of the Eclipse Herald tests your resolve.',
    affliction: 'Eclipse Phase (Boss summons void mirrors)',
    completed: false,
    active: false
  }
];

export const MythicExpeditionModal: React.FC<MythicExpeditionModalProps> = ({
  isOpen,
  onClose,
  onGainReward
}) => {
  const [nodes, setNodes] = useState<ExpeditionNode[]>(SAMPLE_NODES);
  const [currentNodeIndex, setCurrentNodeIndex] = useState<number>(0);
  const [runLog, setRunLog] = useState<string[]>(['Expedition launched into the Umbral Fractures. Choose your path wisely.']);
  const [runFinished, setRunFinished] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleEngageNode = (index: number) => {
    const node = nodes[index];
    if (!node.active || node.completed) return;

    audioEngine.playSwing('heavy');
    audioEngine.playHit(true);

    const updated = [...nodes];
    updated[index].completed = true;
    updated[index].active = false;

    if (index + 1 < updated.length) {
      updated[index + 1].active = true;
      setCurrentNodeIndex(index + 1);
      setRunLog(prev => [`Cleared ${node.title}! Gained tactical boon.`, ...prev.slice(0, 5)]);
    } else {
      // Run complete!
      setRunFinished(true);
      audioEngine.playLevelUp();
      confetti({ particleCount: 100, spread: 70 });
      setRunLog(prev => ['MYTHIC EXPEDITION COMPLETED! Archon Malakor\'s Phantom banished.', ...prev]);

      const expeditionRelic: Item = {
        id: 'relic_zenith_crest',
        name: 'Crown of the Broken Zenith',
        type: 'relic',
        rarity: 'mythic',
        description: 'An ancient crown pulsating with First Sun cosmic fire.',
        icon: 'Sun',
        specialAffix: 'Dodging through attacks triggers an Aether Nova dealing 180 damage.',
        stats: { critChance: 25, damage: 45 },
        value: 500
      };

      onGainReward(1200, expeditionRelic);
    }

    setNodes(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-neutral-950 border border-purple-500/40 rounded-2xl shadow-2xl p-6 flex flex-col gap-6 text-neutral-100">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-purple-400 tracking-wide">
                MYTHIC PROCEDURAL EXPEDITION
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Roguelite Dungeon Incursion | Adaptive Afflictions, Relic Drafting & High Skill Ceiling
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-neutral-900 text-neutral-400 hover:text-neutral-100 border border-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* EXPEDITION PATH TREE */}
        <div className="flex flex-col gap-4">
          <h3 className="font-display text-xs font-semibold text-neutral-300 tracking-wider">
            EXPEDITION PROGRESSION NODES
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {nodes.map((node, idx) => {
              const isCurrent = node.active;
              const isPast = node.completed;

              return (
                <div
                  key={node.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    isCurrent
                      ? 'bg-purple-950/40 border-purple-400 shadow-lg shadow-purple-500/20'
                      : isPast
                      ? 'bg-neutral-900/40 border-emerald-500/40 opacity-75'
                      : 'bg-neutral-900/40 border-neutral-800 opacity-40'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] uppercase font-bold text-neutral-400">Node {idx + 1}</span>
                      {isPast ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : node.type === 'boss' ? (
                        <Skull className="w-4 h-4 text-red-400" />
                      ) : node.type === 'elite' ? (
                        <AlertOctagon className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Flame className="w-4 h-4 text-purple-400" />
                      )}
                    </div>
                    <h4 className="font-display font-bold text-xs text-neutral-100">{node.title}</h4>
                    <p className="text-[11px] text-neutral-400 mt-1.5 leading-snug">{node.description}</p>

                    {node.affliction && (
                      <div className="mt-2 text-[10px] text-red-400 font-medium bg-red-950/30 p-1.5 rounded border border-red-900/40">
                        {node.affliction}
                      </div>
                    )}
                    {node.boon && (
                      <div className="mt-2 text-[10px] text-amber-400 font-medium bg-amber-950/30 p-1.5 rounded border border-amber-900/40">
                        {node.boon}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleEngageNode(idx)}
                    disabled={!isCurrent}
                    className={`w-full mt-4 py-2 rounded-lg font-bold text-xs tracking-wider transition-all ${
                      isCurrent
                        ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-neutral-100 shadow-md'
                        : isPast
                        ? 'bg-neutral-800 text-emerald-400 cursor-default'
                        : 'bg-neutral-900 text-neutral-600 cursor-not-allowed'
                    }`}
                  >
                    {isPast ? 'CLEARED' : isCurrent ? 'ENGAGE ENCOUNTER' : 'LOCKED'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* LOG */}
        <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 flex flex-col gap-1.5 font-mono text-xs text-neutral-300">
          <span className="text-[10px] text-purple-400 font-bold uppercase">Expedition Chronicles</span>
          {runLog.map((log, idx) => (
            <div key={idx} className="text-neutral-300">{log}</div>
          ))}
        </div>

        {runFinished && (
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-amber-400" />
              <div>
                <h4 className="font-display font-bold text-sm text-amber-300">EXPEDITION MASTERED</h4>
                <p className="text-xs text-neutral-300">Claimed Crown of the Broken Zenith (Mythic Relic) & +1200 XP</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs hover:bg-amber-400"
            >
              EXIT TO WORLD
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
