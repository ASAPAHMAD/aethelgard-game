import React from 'react';
import { X, Settings, Keyboard, Volume2, Shield, Trash2 } from 'lucide-react';
import { audioEngine } from '../../services/audioEngine';

interface SettingsControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetSave: () => void;
}

export const SettingsControlsModal: React.FC<SettingsControlsModalProps> = ({
  isOpen,
  onClose,
  onResetSave
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl p-6 flex flex-col gap-6 text-neutral-100">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-700 text-neutral-300">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-amber-400 tracking-wide">
                CONTROLS & AUDIO SETTINGS
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Configure keybindings, tactile feedback, and Web Audio synthesizers.
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

        {/* KEYBINDINGS CHEAT SHEET */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-300 tracking-wider">
            <Keyboard className="w-4 h-4 text-amber-400" />
            KEYBOARD & CONTROLLER MAPPING
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
            <div className="bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800 flex justify-between items-center">
              <span className="text-neutral-400">Move Character</span>
              <span className="font-mono font-bold text-amber-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-700">W A S D</span>
            </div>
            <div className="bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800 flex justify-between items-center">
              <span className="text-neutral-400">Light Attack</span>
              <span className="font-mono font-bold text-amber-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-700">L-CLICK</span>
            </div>
            <div className="bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800 flex justify-between items-center">
              <span className="text-neutral-400">Heavy Cleave</span>
              <span className="font-mono font-bold text-red-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-700">R-CLICK</span>
            </div>
            <div className="bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800 flex justify-between items-center">
              <span className="text-neutral-400">Perfect Parry / Block</span>
              <span className="font-mono font-bold text-sky-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-700">Q</span>
            </div>
            <div className="bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800 flex justify-between items-center">
              <span className="text-neutral-400">Dodge Roll (i-frames)</span>
              <span className="font-mono font-bold text-emerald-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-700">SPACE</span>
            </div>
            <div className="bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800 flex justify-between items-center">
              <span className="text-neutral-400">Gather & Interact</span>
              <span className="font-mono font-bold text-amber-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-700">E</span>
            </div>
            <div className="bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800 flex justify-between items-center">
              <span className="text-neutral-400">Solar Cleave (Skill 1)</span>
              <span className="font-mono font-bold text-orange-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-700">1</span>
            </div>
            <div className="bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800 flex justify-between items-center">
              <span className="text-neutral-400">Aether Rush (Skill 2)</span>
              <span className="font-mono font-bold text-cyan-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-700">2</span>
            </div>
            <div className="bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800 flex justify-between items-center">
              <span className="text-neutral-400">Wrath of Zenith (Ult)</span>
              <span className="font-mono font-bold text-amber-300 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-700">R</span>
            </div>
          </div>
        </div>

        {/* AUDIO SYNTHESIZER DEMO */}
        <div className="flex flex-col gap-3 pt-3 border-t border-neutral-800">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-300 tracking-wider">
            <Volume2 className="w-4 h-4 text-sky-400" />
            PROCEDURAL AUDIO SYNTHESIZERS (WEB AUDIO API)
          </div>
          <p className="text-xs text-neutral-400">
            Procedural physical modeling, FM synthesis, and real-time speech formant filters ensure zero lag and high-fidelity soundscapes.
          </p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => audioEngine.playPerfectParry()}
              className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-sky-400 text-xs font-mono border border-sky-500/30"
            >
              Test Parry Bell
            </button>
            <button
              onClick={() => audioEngine.playSwing('heavy')}
              className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-amber-400 text-xs font-mono border border-amber-500/30"
            >
              Test Heavy Whoosh
            </button>
            <button
              onClick={() => audioEngine.playLevelUp()}
              className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-emerald-400 text-xs font-mono border border-emerald-500/30"
            >
              Test Zenith Fanfare
            </button>
            <button
              onClick={() => audioEngine.speakLine("The sun will rise again over Aethelgard.", 'player', 'confident', 1.0)}
              className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-purple-400 text-xs font-mono border border-purple-500/30"
            >
              Test Voice Synthesizer
            </button>
          </div>
        </div>

        {/* DANGER ZONE / SAVE MANAGEMENT */}
        <div className="pt-3 border-t border-neutral-800 flex justify-between items-center">
          <div>
            <div className="text-xs font-bold text-red-400">SAVE DATA PERSISTENCE</div>
            <div className="text-[11px] text-neutral-500">Clear localStorage to reset character and settlement state.</div>
          </div>
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to reset all game save data?")) {
                onResetSave();
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/40 text-red-400 hover:bg-red-900/60 border border-red-800/40 text-xs font-bold"
          >
            <Trash2 className="w-3.5 h-3.5" />
            RESET SAVE
          </button>
        </div>
      </div>
    </div>
  );
};
