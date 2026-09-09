import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, Palette, Eye, EyeOff, Shield } from 'lucide-react';
import { CharacterAppearance, TransmogSettings, CombatArchetype } from '../../types/game';
import { audioEngine } from '../../services/audioEngine';
import { CharacterForge3D } from '../game/CharacterForge3D';

interface TransmogWardrobeModalProps {
  isOpen: boolean;
  onClose: () => void;
  appearance: CharacterAppearance;
  archetype: CombatArchetype;
  currentTransmog: TransmogSettings;
  onSaveTransmog: (transmog: TransmogSettings) => void;
}

const WEAPON_SKINS = [
  { id: 'default', name: 'Standard Forged Steel', desc: 'Practical field armament forged from local reef iron.' },
  { id: 'gilded_sol', name: 'Gilded Sol-Cleaver', desc: 'Ceremonial solar alloy that leaves trails of radiant light.' },
  { id: 'void_glass', name: 'Eclipse Void-Glass', desc: 'Tainted obsidian blade that whispers with twilight energy.' },
  { id: 'ironwood', name: 'Primeval Ironwood', desc: 'Carved from petrified ancient grove roots with living amber runes.' },
  { id: 'coral_bone', name: 'Reaver Chitin Tooth', desc: 'Fashioned from the jaws of abyssal deep-sea predators.' }
];

const ARMOR_SKINS = [
  { id: 'default', name: 'Garrison Plate & Leather', desc: 'Standard survivor armor designed for rugged mobility.' },
  { id: 'citadel_gold', name: 'Highborne Citadel Regalia', desc: 'Gilded breastplate with engraved solar geometry.' },
  { id: 'umbral_veil', name: 'Twilight Umbral Shroud', desc: 'Silken void fabrics that blur your outline in combat.' },
  { id: 'reef_chitin', name: 'Shore-Reaver Carapace', desc: 'Weathered deep-sea crustacean armor resistant to cold.' }
];

const DYE_COLORS = [
  { id: '#b76e33', name: 'Autumn Amber' },
  { id: '#7f1d1d', name: 'Citadel Crimson' },
  { id: '#1e3a8a', name: 'Abyssal Cobalt' },
  { id: '#3c096c', name: 'Eclipse Violet' },
  { id: '#14532d', name: 'Ironwood Moss' },
  { id: '#262626', name: 'Charred Obsidian' },
  { id: '#d4af37', name: 'Solar Gold' }
];

export const TransmogWardrobeModal: React.FC<TransmogWardrobeModalProps> = ({
  isOpen,
  onClose,
  appearance,
  archetype,
  currentTransmog,
  onSaveTransmog
}) => {
  const [transmog, setTransmog] = useState<TransmogSettings>({ ...currentTransmog });

  useEffect(() => {
    if (isOpen) {
      setTransmog({ ...currentTransmog });
    }
  }, [isOpen, currentTransmog]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveTransmog(transmog);
    audioEngine.playRelicSurge();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl h-[88vh] bg-neutral-950 border border-amber-500/40 rounded-3xl shadow-2xl flex flex-col text-neutral-100 overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-amber-400 tracking-wider">
                TRANSMOG & WARDROBE ATELIER
              </h2>
              <p className="text-xs text-neutral-400">
                Alter the appearance of your armor, weapons, and cloaks without altering your stats.
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

        {/* WORKBENCH BODY */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* LEFT 7 COLS: OPTIONS */}
          <div className="md:col-span-7 border-r border-neutral-800/80 bg-neutral-950 p-6 space-y-5 overflow-y-auto">
            {/* WEAPON SKINS */}
            <div>
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                Weapon Transmog Appearance
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {WEAPON_SKINS.map(w => {
                  const isSelected = transmog.weaponSkin === w.id;
                  return (
                    <div
                      key={w.id}
                      onClick={() => setTransmog({ ...transmog, weaponSkin: w.id })}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-amber-500/15 border-amber-400 shadow-sm' 
                          : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-200">{w.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">{w.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ARMOR SKINS */}
            <div>
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                Armor Motif & Plating
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {ARMOR_SKINS.map(a => {
                  const isSelected = transmog.armorSkin === a.id;
                  return (
                    <div
                      key={a.id}
                      onClick={() => setTransmog({ ...transmog, armorSkin: a.id })}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-amber-500/15 border-amber-400 shadow-sm' 
                          : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-200">{a.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">{a.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CLOAK & HELMET TOGGLES */}
            <div className="space-y-3 pt-2 border-t border-neutral-800">
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/50 border border-neutral-800">
                <span className="text-xs text-neutral-200 font-medium">Display Cloak</span>
                <button
                  onClick={() => setTransmog({ ...transmog, cloakVisible: !transmog.cloakVisible })}
                  className={`p-2 rounded-lg border transition-colors ${
                    transmog.cloakVisible 
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300' 
                      : 'bg-neutral-800 border-neutral-700 text-neutral-500'
                  }`}
                >
                  {transmog.cloakVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>

              {/* CLOAK DYE */}
              {transmog.cloakVisible && (
                <div>
                  <label className="text-xs text-neutral-400 block mb-1.5">Cloak Dye Tone</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {DYE_COLORS.map(dye => (
                      <button
                        key={dye.id}
                        onClick={() => setTransmog({ ...transmog, cloakDye: dye.id })}
                        title={dye.name}
                        className={`w-7 h-7 rounded-full border-2 transition-transform ${
                          transmog.cloakDye === dye.id ? 'border-amber-400 scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: dye.id }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/50 border border-neutral-800">
                <span className="text-xs text-neutral-200 font-medium">Display Helm</span>
                <button
                  onClick={() => setTransmog({ ...transmog, helmVisible: !transmog.helmVisible })}
                  className={`p-2 rounded-lg border transition-colors ${
                    transmog.helmVisible 
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300' 
                      : 'bg-neutral-800 border-neutral-700 text-neutral-500'
                  }`}
                >
                  {transmog.helmVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT 5 COLS: 3D REALTIME PREVIEW */}
          <div className="md:col-span-5 flex flex-col bg-neutral-950 p-4 relative justify-between">
            <div className="flex-1 w-full min-h-[380px] rounded-2xl overflow-hidden">
              <CharacterForge3D
                appearance={appearance}
                archetype={archetype}
                transmog={transmog}
                className="w-full h-full min-h-[360px]"
              />
            </div>
            <div className="mt-4">
              <button
                onClick={handleSave}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs tracking-wider transition-all hover:scale-[1.02] shadow-lg shadow-amber-500/25 active:scale-95"
              >
                APPLY TRANSMOG CUSTOMIZATION
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
