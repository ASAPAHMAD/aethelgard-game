import React, { useState } from 'react';
import { 
  Shield, 
  Sparkles, 
  Crosshair, 
  Sun, 
  CheckCircle2, 
  ArrowRight, 
  Flame, 
  Zap, 
  Sword 
} from 'lucide-react';
import { CombatArchetype, PlayableOrigin } from '../../types/game';
import { CLASS_INTRO_SCENARIOS, ClassIntroScenario } from '../../data/classIntroData';
import { audioEngine } from '../../services/audioEngine';
import confetti from 'canvas-confetti';

interface ClassIntroductionModalProps {
  isOpen: boolean;
  archetype: CombatArchetype;
  origin: PlayableOrigin;
  onComplete: () => void;
}

export const ClassIntroductionModal: React.FC<ClassIntroductionModalProps> = ({
  isOpen,
  archetype,
  origin,
  onComplete
}) => {
  const scenario: ClassIntroScenario = CLASS_INTRO_SCENARIOS[archetype] || CLASS_INTRO_SCENARIOS.vanguard;
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [stepFeedback, setStepFeedback] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentStep = scenario.steps[currentStepIndex];

  const handleExecuteStep = () => {
    if (!currentStep) return;

    // Trigger procedural sound effect
    switch (currentStep.soundFx) {
      case 'block':
        audioEngine.playBlock();
        break;
      case 'parry':
        audioEngine.playPerfectParry();
        break;
      case 'cast':
        audioEngine.playCastSpell();
        break;
      case 'hit':
        audioEngine.playHit(true);
        break;
      case 'levelUp':
        audioEngine.playLevelUp();
        break;
    }

    setStepFeedback(currentStep.resultText);
    setCompletedSteps(prev => [...prev, currentStep.id]);

    if (currentStepIndex < scenario.steps.length - 1) {
      setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1);
        setStepFeedback(null);
      }, 1400);
    } else {
      setTimeout(() => {
        setIsFinished(true);
        audioEngine.playLevelUp();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }, 1500);
    }
  };

  const getArchetypeIcon = () => {
    switch (archetype) {
      case 'vanguard':
        return <Shield className="w-6 h-6 text-amber-400" />;
      case 'spellblade':
        return <Sparkles className="w-6 h-6 text-cyan-400" />;
      case 'shadowstrider':
        return <Crosshair className="w-6 h-6 text-emerald-400" />;
      case 'solarwarden':
        return <Sun className="w-6 h-6 text-amber-300" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-neutral-950 border border-amber-500/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* TOP BANNER */}
        <div className="bg-gradient-to-r from-neutral-900 via-amber-950/40 to-neutral-900 border-b border-amber-500/30 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              {getArchetypeIcon()}
            </div>
            <div>
              <div className="text-[10px] font-mono tracking-widest text-amber-400 uppercase">
                CLASS AWAKENING TRIAL • {scenario.locationName}
              </div>
              <h2 className="text-xl font-bold font-display text-neutral-100 tracking-wide">
                {scenario.className}: {scenario.signatureMomentTitle}
              </h2>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono text-neutral-400">
              Step {isFinished ? scenario.steps.length : currentStepIndex + 1} of {scenario.steps.length}
            </span>
          </div>
        </div>

        {/* CONTENT BODY */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* LORE SNIPPET */}
          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
            <p className="text-xs text-neutral-300 leading-relaxed italic">
              "{scenario.fantasyQuote}"
            </p>
            <p className="text-xs text-neutral-400">
              {scenario.openingLore}
            </p>
          </div>

          {/* PROGRESS STEPS INDICATOR */}
          <div className="grid grid-cols-4 gap-2">
            {scenario.steps.map((s, idx) => {
              const isDone = completedSteps.includes(s.id);
              const isCurrent = idx === currentStepIndex && !isFinished;
              return (
                <div 
                  key={s.id}
                  className={`p-2 rounded-xl text-center border transition-all ${
                    isDone 
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                      : isCurrent
                        ? 'bg-neutral-800 border-amber-500 text-neutral-100 ring-1 ring-amber-500/50'
                        : 'bg-neutral-900/40 border-neutral-800 text-neutral-500'
                  }`}
                >
                  <div className="text-[10px] font-mono font-bold flex items-center justify-center gap-1">
                    {isDone ? <CheckCircle2 className="w-3 h-3 text-amber-400" /> : <span>{idx + 1}</span>}
                    <span className="truncate">{s.actionName.split(' ')[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ACTIVE STEP CARD */}
          {!isFinished && currentStep && (
            <div className="p-5 rounded-2xl bg-neutral-900/80 border border-amber-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Ability: {currentStep.abilityName}
                  </span>
                  <h3 className="text-base font-bold text-neutral-100 mt-1.5">
                    {currentStep.actionName}
                  </h3>
                </div>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed">
                {currentStep.description}
              </p>

              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-mono text-amber-400/90 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>{currentStep.instruction}</span>
              </div>

              {stepFeedback && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 animate-pulse">
                  {stepFeedback}
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={handleExecuteStep}
                  disabled={Boolean(stepFeedback)}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-neutral-950 font-bold text-xs tracking-wider uppercase transition-all shadow-lg hover:shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Sword className="w-4 h-4" />
                  <span>{currentStep.buttonLabel}</span>
                </button>
              </div>
            </div>
          )}

          {/* FINISHED CELEBRATION */}
          {isFinished && (
            <div className="p-6 rounded-2xl bg-gradient-to-b from-amber-950/40 to-neutral-900 border border-amber-500/50 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/20 border border-amber-500 flex items-center justify-center">
                <Flame className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold font-display text-amber-300">
                CLASS MASTERY AWAKENED!
              </h3>
              <p className="text-xs text-neutral-300 max-w-md mx-auto leading-relaxed">
                You have embodied the discipline of the <strong className="text-amber-400">{scenario.className}</strong>. The survivors hail your courage as the first line of defense against the encroaching darkness.
              </p>
              <div className="pt-2">
                <button
                  onClick={onComplete}
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-extrabold text-xs tracking-widest uppercase transition-all shadow-xl flex items-center justify-center gap-2"
                >
                  <span>Enter Aethelgard & Begin Prologue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
