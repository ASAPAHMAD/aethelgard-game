import React, { useEffect } from 'react';
import { Sparkles, MessageSquare, Volume2 } from 'lucide-react';
import { DialogueNode, Companion } from '../../types/game';
import { audioEngine } from '../../services/audioEngine';

interface CinematicDialogueModalProps {
  isOpen: boolean;
  node: DialogueNode | null;
  companion: Companion;
  onSelectOption: (optionIndex: number) => void;
  onClose: () => void;
}

export const CinematicDialogueModal: React.FC<CinematicDialogueModalProps> = ({
  isOpen,
  node,
  companion,
  onSelectOption,
  onClose
}) => {
  if (!isOpen || !node) return null;

  // Speak voice when node opens
  useEffect(() => {
    if (node.voiceClipKey) {
      audioEngine.speakLine(node.text, node.speaker === 'Kaelen Drake' ? 'kaelen' : 'narrator');
    }
  }, [node]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end p-6 md:p-12 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-auto">
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-4">
        {/* SPEAKER BANNER */}
        <div className="flex items-center gap-3 bg-neutral-950/90 backdrop-blur-md px-5 py-3 rounded-2xl border border-amber-500/30 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-800 border-2 border-amber-400/60 flex items-center justify-center font-display font-bold text-neutral-950 text-base shadow-lg">
            {(node.speaker || 'Hero').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-base text-amber-400 tracking-wide">
                {node.speaker}
              </h3>
              <span className="text-[10px] bg-neutral-900 border border-neutral-700 px-2 py-0.5 rounded text-neutral-300 font-mono">
                {node.speaker === companion.name ? `Affinity: ${companion.relationshipStatus}` : 'NPC'}
              </span>
            </div>
            <p className="text-sm text-neutral-100 font-serif italic mt-1 leading-relaxed">
              "{node.text}"
            </p>
          </div>
          <button
            onClick={() => audioEngine.speakLine(node.text, node.speaker === 'Kaelen Drake' ? 'kaelen' : 'narrator')}
            className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-400 border border-neutral-800"
            title="Replay Voice Line"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {/* DIALOGUE OPTIONS */}
        <div className="flex flex-col gap-2.5 pl-14">
          {node.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => onSelectOption(idx)}
              className="group text-left px-5 py-3 rounded-xl bg-neutral-950/80 hover:bg-amber-500/15 border border-neutral-800 hover:border-amber-400/60 backdrop-blur-md transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-amber-400 font-mono font-bold text-xs group-hover:translate-x-0.5 transition-transform">
                  [{idx + 1}]
                </span>
                <span className="text-xs font-semibold text-neutral-200 group-hover:text-amber-300">
                  {opt.text}
                </span>
              </div>
              {opt.affinityChange && (
                <span className="text-[10px] text-emerald-400 font-mono">
                  Affinity {opt.affinityChange > 0 ? `+${opt.affinityChange}` : opt.affinityChange}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
