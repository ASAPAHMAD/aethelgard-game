import React, { useState, useEffect } from 'react';
import { Volume2, ChevronRight, SkipForward, Sparkles, Flame, Moon, Compass } from 'lucide-react';
import { CinematicScene } from '../../types/game';
import { audioEngine } from '../../services/audioEngine';

interface CinematicSequenceModalProps {
  isOpen: boolean;
  scene: CinematicScene | null;
  onComplete: () => void;
}

export const CinematicSequenceModal: React.FC<CinematicSequenceModalProps> = ({
  isOpen,
  scene,
  onComplete
}) => {
  const [currentParagraph, setCurrentParagraph] = useState<number>(0);

  useEffect(() => {
    if (isOpen && scene) {
      setCurrentParagraph(0);
      playCurrentVoice(0);
      if (scene.visualTheme === 'eclipse') {
        audioEngine.playEclipseRoar();
      } else if (scene.visualTheme === 'titan' || scene.visualTheme === 'sun') {
        audioEngine.playRelicSurge();
      }
    }
  }, [isOpen, scene]);

  if (!isOpen || !scene) return null;

  const playCurrentVoice = (idx: number) => {
    const text = scene.paragraphs[idx];
    if (!text) return;
    const speakerName = (scene.speaker || '').toLowerCase();
    const speakerKey = scene.voiceProfile || (speakerName.includes('kaelen') ? 'kaelen' : speakerName.includes('malakor') ? 'malakor' : 'narrator');
    audioEngine.speakLine(text, speakerKey as any);
  };

  const handleNext = () => {
    if (currentParagraph < scene.paragraphs.length - 1) {
      const next = currentParagraph + 1;
      setCurrentParagraph(next);
      playCurrentVoice(next);
    } else {
      onComplete();
    }
  };

  const isLast = currentParagraph === scene.paragraphs.length - 1;

  // Background visual styling per theme
  const getThemeGradient = () => {
    switch (scene.visualTheme) {
      case 'eclipse':
        return 'from-purple-950/90 via-black/95 to-neutral-950';
      case 'sun':
        return 'from-amber-950/80 via-black/95 to-neutral-950';
      case 'titan':
        return 'from-emerald-950/80 via-black/95 to-neutral-950';
      case 'ancient_ruins':
        return 'from-neutral-900/90 via-black/95 to-neutral-950';
      default:
        return 'from-slate-950/90 via-black/95 to-neutral-950';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/95 backdrop-blur-xl">
      <div className={`relative w-full max-w-3xl min-h-[460px] rounded-3xl border border-amber-500/30 shadow-2xl p-6 sm:p-10 flex flex-col justify-between text-neutral-100 bg-gradient-to-b ${getThemeGradient()} overflow-hidden`}>
        {/* ATMOSPHERIC BACKGROUND PARTICLES / ORBS */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        {/* TOP BAR: ACT TITLE & SKIP */}
        <div className="relative z-10 flex items-center justify-between border-b border-neutral-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              {scene.visualTheme === 'eclipse' ? <Moon className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="font-display font-bold text-sm tracking-widest text-amber-400 uppercase">
                {scene.title}
              </h2>
              <p className="text-[11px] text-neutral-400 font-mono tracking-wider">
                {scene.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onComplete}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <span>Skip Cutscene</span>
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* CENTER CONTENT: NARRATIVE PARAGRAPH WITH ELEGANT TYPOGRAPHY */}
        <div className="relative z-10 my-8 space-y-6">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-[11px] font-bold text-amber-300 font-mono uppercase tracking-wider">
              {scene.speaker}
            </span>
            <button
              onClick={() => playCurrentVoice(currentParagraph)}
              className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-amber-400 transition-colors"
              title="Replay Audio"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="font-serif text-lg sm:text-xl text-neutral-100 leading-relaxed italic border-l-2 border-amber-500/60 pl-5 min-h-[90px]">
            "{scene.paragraphs[currentParagraph]}"
          </p>

          {/* Progress dots */}
          <div className="flex items-center gap-2 pt-2">
            {scene.paragraphs.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentParagraph 
                    ? 'w-8 bg-amber-400' 
                    : i < currentParagraph 
                      ? 'w-3 bg-amber-400/40' 
                      : 'w-3 bg-neutral-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="relative z-10 flex items-center justify-between border-t border-neutral-800/80 pt-4">
          <span className="text-[11px] text-neutral-500 font-mono">
            Chapter Sequence {currentParagraph + 1} of {scene.paragraphs.length}
          </span>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs tracking-wider transition-all hover:scale-105 shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <span>{isLast ? 'BEGIN JOURNEY' : 'CONTINUE'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
