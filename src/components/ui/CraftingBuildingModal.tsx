import React, { useState } from 'react';
import { 
  X, 
  Hammer, 
  Flame, 
  TreePine, 
  Box, 
  Sparkles, 
  ShieldAlert, 
  Eye, 
  Tent, 
  Check 
} from 'lucide-react';
import { Item, CampStructure } from '../../types/game';
import { audioEngine } from '../../services/audioEngine';

interface CraftingBuildingModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: Item[];
  onCraftItem: (craftedItem: Item, consumedMaterials: { id: string; qty: number }[]) => void;
  onSelectBuildingType: (type: CampStructure['type']) => void;
  onStartPlacement: () => void;
}

interface CraftRecipe {
  id: string;
  name: string;
  category: 'blacksmith' | 'alchemy' | 'provisions';
  description: string;
  resultItem: Item;
  costs: { materialId: string; name: string; qty: number }[];
}

const CRAFTING_RECIPES: CraftRecipe[] = [
  {
    id: 'rcp_greatsword',
    name: 'Sunsteel Greatsword',
    category: 'blacksmith',
    description: 'Forge a heavy cleaving greatsword with solar runes.',
    resultItem: {
      id: 'wpn_greatsword_' + Math.random().toString(36).substr(2, 5),
      name: 'Sunsteel Greatsword',
      type: 'weapon',
      rarity: 'rare',
      description: 'Heavy two-handed solar blade. High stagger output.',
      icon: 'Sword',
      weaponType: 'greatsword',
      stats: { damage: 52, stamina: -15, critChance: 14 },
      specialAffix: 'Heavy attacks deal +30% stagger damage.',
      value: 140,
      quantity: 1
    },
    costs: [
      { materialId: 'mat_ironwood', name: 'Petrified Ironwood', qty: 6 },
      { materialId: 'mat_stone', name: 'Quarried Granite', qty: 4 },
      { materialId: 'mat_sunstone', name: 'Sunstone Aether Shard', qty: 2 }
    ]
  },
  {
    id: 'rcp_potion',
    name: 'Solar Healing Draught',
    category: 'alchemy',
    description: 'Distill soothing moon-berries and pure aether into an instant healing tonic.',
    resultItem: {
      id: 'cons_potion_' + Math.random().toString(36).substr(2, 5),
      name: 'Solar Healing Draught',
      type: 'consumable',
      rarity: 'uncommon',
      description: 'Restores 120 Health instantly.',
      icon: 'HeartPulse',
      value: 20,
      quantity: 2
    },
    costs: [
      { materialId: 'mat_sunstone', name: 'Sunstone Aether Shard', qty: 1 }
    ]
  },
  {
    id: 'rcp_roast',
    name: 'Roasted Boar with Moon-Berries',
    category: 'provisions',
    description: 'Hearty exploration meal granting +100 Max HP for 10 minutes.',
    resultItem: {
      id: 'cons_roast_' + Math.random().toString(36).substr(2, 5),
      name: 'Roasted Boar with Moon-Berries',
      type: 'consumable',
      rarity: 'uncommon',
      description: 'Hearty survival nourishment.',
      icon: 'UtensilsCrossed',
      value: 30,
      quantity: 1
    },
    costs: [
      { materialId: 'mat_ironwood', name: 'Petrified Ironwood', qty: 2 }
    ]
  }
];

const BUILDING_TYPES: {
  type: CampStructure['type'];
  name: string;
  description: string;
  icon: any;
  costs: { name: string; qty: number; id: string }[];
}[] = [
  {
    type: 'campfire',
    name: 'Driftwood Campfire',
    description: 'Provides warmth against the freezing twilight, cooks food, and grants the Well-Rested buff.',
    icon: Flame,
    costs: [{ name: 'Petrified Ironwood', qty: 4, id: 'mat_ironwood' }]
  },
  {
    type: 'workbench',
    name: 'Carpenter Workbench',
    description: 'Unlocks advanced settlement building recipes and tool forging.',
    icon: Hammer,
    costs: [
      { name: 'Petrified Ironwood', qty: 8, id: 'mat_ironwood' },
      { name: 'Quarried Granite', qty: 4, id: 'mat_stone' }
    ]
  },
  {
    type: 'palisade',
    name: 'Reinforced Palisade Wall',
    description: 'Defensive barrier to protect your camp from migrating nocturnal beasts.',
    icon: ShieldAlert,
    costs: [{ name: 'Petrified Ironwood', qty: 5, id: 'mat_ironwood' }]
  },
  {
    type: 'watchtower',
    name: 'Scout Watchtower',
    description: 'Extends camp perimeter defense and early detection of dynamic world rifts.',
    icon: Eye,
    costs: [
      { name: 'Petrified Ironwood', qty: 12, id: 'mat_ironwood' },
      { name: 'Quarried Granite', qty: 8, id: 'mat_stone' }
    ]
  },
  {
    type: 'forge',
    name: 'Sunsteel Smelting Forge',
    description: 'High-temperature furnace capable of smelting rare Aether alloys.',
    icon: Sparkles,
    costs: [
      { name: 'Quarried Granite', qty: 15, id: 'mat_stone' },
      { name: 'Sunstone Aether Shard', qty: 3, id: 'mat_sunstone' }
    ]
  },
  {
    type: 'shelter',
    name: 'Canvas Survivor Shelter',
    description: 'Restores warmth and stamina regen during violent storms.',
    icon: Tent,
    costs: [{ name: 'Petrified Ironwood', qty: 6, id: 'mat_ironwood' }]
  }
];

export const CraftingBuildingModal: React.FC<CraftingBuildingModalProps> = ({
  isOpen,
  onClose,
  inventory,
  onCraftItem,
  onSelectBuildingType,
  onStartPlacement
}) => {
  const [activeTab, setActiveTab] = useState<'crafting' | 'building'>('crafting');

  if (!isOpen) return null;

  const getInventoryQty = (matId: string) => {
    const item = inventory.find(i => i.id === matId);
    return item?.quantity || 0;
  };

  const handleCraft = (recipe: CraftRecipe) => {
    // Check materials
    const canAfford = recipe.costs.every(c => getInventoryQty(c.materialId) >= c.qty);
    if (!canAfford) return;

    audioEngine.playGather();
    onCraftItem(
      recipe.resultItem,
      recipe.costs.map(c => ({ id: c.materialId, qty: c.qty }))
    );
  };

  const handleSelectBuilding = (bType: CampStructure['type']) => {
    onSelectBuildingType(bType);
    onStartPlacement();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-neutral-950 border border-amber-500/30 rounded-2xl shadow-2xl p-6 flex flex-col gap-6 text-neutral-100">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Hammer className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-amber-400 tracking-wide">
                SURVIVAL WORKBENCH & SETTLEMENT FORGE
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Construct fortified shelters and craft legendary armaments from harvested Aether.
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

        {/* TABS: Crafting vs Building */}
        <div className="flex gap-2 border-b border-neutral-800 pb-2">
          <button
            onClick={() => setActiveTab('crafting')}
            className={`px-4 py-2 rounded-xl font-bold text-xs tracking-wider transition-colors ${
              activeTab === 'crafting'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            ARMAMENTS & ALCHEMY
          </button>
          <button
            onClick={() => setActiveTab('building')}
            className={`px-4 py-2 rounded-xl font-bold text-xs tracking-wider transition-colors ${
              activeTab === 'building'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            SETTLEMENT STRUCTURES
          </button>
        </div>

        {/* TAB CONTENT: CRAFTING */}
        {activeTab === 'crafting' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CRAFTING_RECIPES.map(recipe => {
              const canAfford = recipe.costs.every(c => getInventoryQty(c.materialId) >= c.qty);
              return (
                <div
                  key={recipe.id}
                  className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-display font-bold text-sm text-neutral-100">{recipe.name}</h4>
                        <span className="text-[10px] text-amber-400 uppercase font-mono">{recipe.category}</span>
                      </div>
                      <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded">
                        Tier I Blueprint
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-2">{recipe.description}</p>

                    {/* Material cost checklist */}
                    <div className="mt-3 pt-3 border-t border-neutral-800 flex flex-col gap-1 text-xs">
                      <span className="text-[10px] uppercase font-bold text-neutral-400">Required Materials:</span>
                      {recipe.costs.map(cost => {
                        const current = getInventoryQty(cost.materialId);
                        const hasEnough = current >= cost.qty;
                        return (
                          <div key={cost.materialId} className="flex justify-between items-center text-neutral-300">
                            <span>{cost.name}</span>
                            <span className={`font-mono font-bold ${hasEnough ? 'text-emerald-400' : 'text-red-400'}`}>
                              {current} / {cost.qty}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={() => handleCraft(recipe)}
                    disabled={!canAfford}
                    className={`w-full mt-4 py-2 rounded-xl font-bold text-xs tracking-wider transition-all ${
                      canAfford
                        ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md shadow-amber-500/20'
                        : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? 'FORGE ARMAMENT' : 'MISSING MATERIALS'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB CONTENT: BUILDING */}
        {activeTab === 'building' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {BUILDING_TYPES.map(bldg => {
              const Icon = bldg.icon;
              const canAfford = bldg.costs.every(c => getInventoryQty(c.id) >= c.qty);
              return (
                <div
                  key={bldg.type}
                  className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h4 className="font-display font-bold text-sm text-neutral-100">{bldg.name}</h4>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">{bldg.description}</p>

                    <div className="mt-3 pt-3 border-t border-neutral-800 flex flex-col gap-1 text-xs">
                      <span className="text-[10px] uppercase font-bold text-neutral-400">Building Cost:</span>
                      {bldg.costs.map(c => {
                        const current = getInventoryQty(c.id);
                        const hasEnough = current >= c.qty;
                        return (
                          <div key={c.id} className="flex justify-between text-neutral-300">
                            <span>{c.name}</span>
                            <span className={`font-mono font-bold ${hasEnough ? 'text-emerald-400' : 'text-red-400'}`}>
                              {current} / {c.qty}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectBuilding(bldg.type)}
                    disabled={!canAfford}
                    className={`w-full mt-4 py-2 rounded-xl font-bold text-xs tracking-wider transition-all ${
                      canAfford
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-neutral-950 shadow-md'
                        : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? 'SELECT & PLACE IN WORLD' : 'INSUFFICIENT RESOURCES'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
