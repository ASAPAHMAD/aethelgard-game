import React, { useState } from 'react';
import { X, Sparkles, Check, Swords, Shield, Zap, Flame, Wind, ArrowRight } from 'lucide-react';
import { CombatArchetype, ClassSpecialization } from '../../types/game';
import { CLASS_DETAILS } from '../../data/storyNarrative';
import { audioEngine } from '../../services/audioEngine';

interface ClassSpecializationModalProps {
  isOpen: boolean;
  onClose: () => void;
  archetype: CombatArchetype;
  currentSpecialization?: ClassSpecialization;
  onSelectSpecialization: (spec: ClassSpecialization) => void;
}

export const ClassSpecializationModal: React.FC<ClassSpecializationModalProps> = ({
  isOpen,
  onClose,
  archetype,
  currentSpecialization,
  onSelectSpecialization
}) => {
  const classInfo = CLASS_DETAILS[archetype] || CLASS_DETAILS['vanguard'];
  const [selectedSpec, setSelectedSpec] = useState<ClassSpecialization>(
    currentSpecialization || classInfo.specializations[0].id
  );

  if (!isOpen) return null;

  const handleApply = () => {
    onSelectSpecialization(selectedSpec);
    audioEngine.playLevelUp();
    onClose();
  };

  const getArchetypeIcon = () => {
    switch (archetype) {
      case 'vanguard': return Shield;
      case 'spellblade': return Flame;
      case 'shadowstrider': return Wind;
      case 'solarwarden': return Zap;
    }
  };
  const ArchIcon = getArchetypeIcon();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-neutral-950 border border-amber-500/40 rounded-3xl shadow-2xl flex flex-col text-neutral-100 overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ArchIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-amber-400 tracking-wider">
                {(classInfo.name || archetype).toUpperCase()} SPECIALIZATION PATHS
              </h2>
              <p className="text-xs text-neutral-400">
                {classInfo.title} • Branch your combat discipline into an advanced mastery.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-900 text-neutral-400 hover:text-neutral-100 border border-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 text-xs text-neutral-300 leading-relaxed">
            {classInfo.fantasy}
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-amber-400 tracking-wider uppercase">
              Choose Your Active Specialization
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {classInfo.specializations.map(spec => {
                const isSelected = selectedSpec === spec.id;
                return (
                  <div
                    key={spec.id}
                    onClick={() => setSelectedSpec(spec.id)}
                    className={`p-5 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all ${
                      isSelected 
                        ? 'bg-amber-500/15 border-amber-400 shadow-lg scale-[1.02]' 
                        : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-amber-300">{spec.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                      </div>
                      <p className="text-xs text-neutral-300 mt-2 leading-relaxed">{spec.description}</p>
                      <div className="mt-3 text-[11px] text-neutral-400">
                        <span className="text-neutral-500">Combat Style: </span>
                        {spec.playstyle}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-neutral-800/80">
                      <div className="text-[10px] text-neutral-500 uppercase font-mono">Specialization Signature:</div>
                      <div className="text-xs font-bold text-emerald-400 mt-0.5">{spec.keyAbility}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-900/70 flex items-center justify-between">
          <div className="text-xs text-neutral-400">
            Selected: <span className="text-amber-300 font-bold">{classInfo.specializations.find(s => s.id === selectedSpec)?.name}</span>
          </div>
          <button
            onClick={handleApply}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs tracking-wider transition-all hover:scale-105 shadow-md shadow-amber-500/20"
          >
            <span>CONFIRM SPECIALIZATION</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
