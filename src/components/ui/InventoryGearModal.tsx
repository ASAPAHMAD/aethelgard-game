import React, { useState } from 'react';
import { 
  X, 
  Shield, 
  Sword, 
  Sparkles, 
  Heart, 
  Zap, 
  Package, 
  Flame, 
  Boxes, 
  Coins 
} from 'lucide-react';
import { Item, WeaponType } from '../../types/game';
import { audioEngine } from '../../services/audioEngine';

interface InventoryGearModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: Item[];
  equippedWeapon: WeaponType;
  equippedArmorChestId: string | null;
  gold: number;
  onEquipWeapon: (weaponType: WeaponType) => void;
  onEquipArmor: (armorId: string) => void;
  onUseItem: (item: Item) => void;
}

const RARITY_COLORS: Record<Item['rarity'], { border: string; bg: string; text: string }> = {
  common: { border: 'border-neutral-700', bg: 'bg-neutral-800/40', text: 'text-neutral-400' },
  uncommon: { border: 'border-emerald-600/60', bg: 'bg-emerald-950/20', text: 'text-emerald-400' },
  rare: { border: 'border-sky-500/60', bg: 'bg-sky-950/20', text: 'text-sky-400' },
  epic: { border: 'border-purple-500/60', bg: 'bg-purple-950/20', text: 'text-purple-400' },
  legendary: { border: 'border-amber-500/80', bg: 'bg-amber-950/30', text: 'text-amber-400' },
  mythic: { border: 'border-red-500', bg: 'bg-red-950/40', text: 'text-red-400' }
};

export const InventoryGearModal: React.FC<InventoryGearModalProps> = ({
  isOpen,
  onClose,
  inventory,
  equippedWeapon,
  equippedArmorChestId,
  gold,
  onEquipWeapon,
  onEquipArmor,
  onUseItem
}) => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(inventory[0] || null);

  if (!isOpen) return null;

  const equippedArmor = inventory.find(i => i.id === equippedArmorChestId);
  const activeWeaponItem = inventory.find(i => i.type === 'weapon' && i.weaponType === equippedWeapon);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-neutral-950 border border-amber-500/30 rounded-2xl shadow-2xl p-6 flex flex-col gap-6 text-neutral-100">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-amber-400 tracking-wide">
                EQUIPMENT & POUCH
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Manage your forged armaments, gathered salvage, and socketed relics.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-amber-500/30 text-amber-400 font-mono text-sm font-bold">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>{gold}</span>
              <span className="text-[10px] text-neutral-400">GOLD</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-neutral-900 text-neutral-400 hover:text-neutral-100 border border-neutral-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3-COLUMN LAYOUT: Equipment Paper Doll | Inventory Grid | Item Inspection Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* COLUMN 1: Paper Doll (3 cols) */}
          <div className="lg:col-span-4 bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 flex flex-col items-center">
            <h3 className="font-display text-xs font-semibold text-neutral-300 tracking-wider mb-4">
              ACTIVE LOADOUT
            </h3>

            {/* Paper doll slots */}
            <div className="w-full flex flex-col gap-3">
              {/* Mainhand Weapon */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-900 border border-amber-500/40">
                <div className="w-12 h-12 rounded-lg bg-amber-950/40 border border-amber-500/50 flex items-center justify-center text-amber-400">
                  <Sword className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] uppercase font-bold text-amber-400">Mainhand Armament</div>
                  <div className="text-xs font-bold text-neutral-100">
                    {activeWeaponItem?.name || (equippedWeapon ? equippedWeapon.replace('_', ' ').toUpperCase() : 'ARMAMENT')}
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    DMG: {activeWeaponItem?.stats?.damage || 40} | Affix Active
                  </div>
                </div>
              </div>

              {/* Chestplate */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-900 border border-neutral-700">
                <div className="w-12 h-12 rounded-lg bg-neutral-800 border border-neutral-600 flex items-center justify-center text-neutral-300">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] uppercase font-bold text-neutral-400">Chestplate Armor</div>
                  <div className="text-xs font-bold text-neutral-100">
                    {equippedArmor?.name || 'Vanguard Cuirass'}
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    ARMOR: {equippedArmor?.stats?.armor || 35} | HP +80
                  </div>
                </div>
              </div>

              {/* Relic Conduit */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-900 border border-purple-500/40">
                <div className="w-12 h-12 rounded-lg bg-purple-950/40 border border-purple-500/50 flex items-center justify-center text-purple-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] uppercase font-bold text-purple-400">Solar Relic</div>
                  <div className="text-xs font-bold text-neutral-100">
                    Eye of the Zenith
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    +15% Aether Max & Kinetic Poise
                  </div>
                </div>
              </div>
            </div>

            {/* Quick weapon swap bar */}
            <div className="w-full mt-6 pt-4 border-t border-neutral-800">
              <span className="text-[11px] font-semibold text-neutral-400 block mb-2">
                Quick Swap Weapon
              </span>
              <div className="grid grid-cols-5 gap-1.5">
                {(['greatsword', 'dual_axes', 'aether_bow', 'arcane_staff', 'sword_and_shield'] as WeaponType[]).map(wpn => (
                  <button
                    key={wpn}
                    onClick={() => {
                      onEquipWeapon(wpn);
                      audioEngine.playSwing('light');
                    }}
                    className={`py-2 px-1 text-[10px] font-bold rounded-lg border text-center transition-all ${
                      equippedWeapon === wpn
                        ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-md'
                        : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    {wpn.split('_')[0].toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMN 2: Inventory Item Grid (5 cols) */}
          <div className="lg:col-span-5 bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-display text-xs font-semibold text-neutral-300 tracking-wider">
                INVENTORY ({inventory.length} / 32 SLOTS)
              </h3>
              <span className="text-[10px] text-neutral-400 font-mono">Drag / Click to Inspect</span>
            </div>

            <div className="grid grid-cols-4 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
              {inventory.map((item, idx) => {
                const isSelected = selectedItem?.id === item.id;
                const rarityStyle = RARITY_COLORS[item.rarity];
                return (
                  <button
                    key={`${item.id}_${idx}`}
                    onClick={() => setSelectedItem(item)}
                    className={`relative aspect-square rounded-xl p-2 flex flex-col items-center justify-between border transition-all ${
                      rarityStyle.border
                    } ${rarityStyle.bg} ${
                      isSelected ? 'ring-2 ring-amber-400 scale-105' : 'hover:scale-102'
                    }`}
                  >
                    <div className="w-full flex justify-between items-center">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">
                        {item.type.split('_')[0]}
                      </span>
                      {item.quantity && item.quantity > 1 && (
                        <span className="text-[10px] font-mono font-bold text-neutral-200 bg-neutral-950/80 px-1 rounded">
                          x{item.quantity}
                        </span>
                      )}
                    </div>
                    <div className={`my-auto ${rarityStyle.text}`}>
                      <Package className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-semibold text-neutral-200 truncate w-full text-center">
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* COLUMN 3: Item Inspector (3 cols) */}
          <div className="lg:col-span-3 bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 flex flex-col justify-between">
            {selectedItem ? (
              <div className="flex flex-col gap-3">
                <div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${RARITY_COLORS[selectedItem.rarity].text}`}>
                    {selectedItem.rarity} {selectedItem.type.replace('_', ' ')}
                  </span>
                  <h4 className="font-display font-bold text-base text-neutral-100 mt-0.5">
                    {selectedItem.name}
                  </h4>
                  <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                    {selectedItem.description}
                  </p>
                </div>

                {/* Stats Breakdown */}
                {selectedItem.stats && (
                  <div className="bg-neutral-900 p-3 rounded-lg border border-neutral-800 flex flex-col gap-1 text-xs">
                    {selectedItem.stats.damage && (
                      <div className="flex justify-between text-neutral-300">
                        <span>Physical Damage:</span>
                        <span className="font-mono font-bold text-amber-400">+{selectedItem.stats.damage}</span>
                      </div>
                    )}
                    {selectedItem.stats.armor && (
                      <div className="flex justify-between text-neutral-300">
                        <span>Armor Poise:</span>
                        <span className="font-mono font-bold text-blue-400">+{selectedItem.stats.armor}</span>
                      </div>
                    )}
                    {selectedItem.stats.critChance && (
                      <div className="flex justify-between text-neutral-300">
                        <span>Critical Strike:</span>
                        <span className="font-mono font-bold text-emerald-400">+{selectedItem.stats.critChance}%</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Special Affix */}
                {selectedItem.specialAffix && (
                  <div className="bg-amber-950/30 p-2.5 rounded-lg border border-amber-500/40 text-xs">
                    <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">
                      Legendary Affix:
                    </span>
                    <p className="text-neutral-200 text-[11px] leading-snug">
                      {selectedItem.specialAffix}
                    </p>
                  </div>
                )}

                {/* Value & Sockets */}
                <div className="flex justify-between items-center text-xs text-neutral-400 pt-2 border-t border-neutral-800">
                  <span>Merchant Value:</span>
                  <span className="font-mono text-amber-400 font-bold">{selectedItem.value}g</span>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-neutral-500">
                Select an item to inspect its affixes and properties.
              </div>
            )}

            {/* Action button */}
            {selectedItem && (
              <div className="mt-4 pt-3 border-t border-neutral-800">
                {selectedItem.type === 'weapon' && selectedItem.weaponType ? (
                  <button
                    onClick={() => {
                      onEquipWeapon(selectedItem.weaponType!);
                      audioEngine.playSwing('light');
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-xs tracking-wider shadow-lg shadow-amber-500/20"
                  >
                    EQUIP ARMAMENT
                  </button>
                ) : selectedItem.type === 'consumable' ? (
                  <button
                    onClick={() => {
                      onUseItem(selectedItem);
                      audioEngine.playGather();
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-bold text-xs tracking-wider shadow-lg"
                  >
                    CONSUME / USE
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl bg-neutral-800 text-neutral-500 text-xs font-semibold cursor-not-allowed"
                  >
                    CRAFTING MATERIAL
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
