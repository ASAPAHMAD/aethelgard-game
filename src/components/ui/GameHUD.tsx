import React from 'react';
import { 
  Sword, 
  Shield, 
  Flame, 
  Zap, 
  Sun, 
  Heart, 
  Compass, 
  Package, 
  User, 
  Hammer, 
  BookOpen, 
  Settings, 
  Users, 
  Compass as CompassIcon,
  Volume2,
  VolumeX,
  Palette,
  Sparkles,
  Layers,
  Film
} from 'lucide-react';
import { WeaponType, CombatArchetype, Companion, Quest, WorldEvent, PlayableOrigin, ClassSpecialization } from '../../types/game';

interface GameHUDProps {
  playerHp: number;
  maxPlayerHp: number;
  playerStamina: number;
  maxPlayerStamina: number;
  playerAether: number;
  maxPlayerAether: number;
  level: number;
  xp: number;
  nextLevelXp: number;
  gold: number;
  equippedWeapon: WeaponType;
  archetype: CombatArchetype;
  origin?: PlayableOrigin;
  specialization?: ClassSpecialization;
  companion: Companion;
  activeQuest: Quest | null;
  worldEvent: WorldEvent;
  warmthLevel: number;
  nourishmentTimer: number;
  isBuildingMode: boolean;
  isMuted: boolean;
  viewMode?: '3d' | '2d';
  onToggleViewMode?: () => void;
  onToggleMute: () => void;
  onOpenInventory: () => void;
  onOpenCharacter: () => void;
  onOpenSkills: () => void;
  onOpenCrafting: () => void;
  onOpenDungeon: () => void;
  onOpenExpedition: () => void;
  onOpenGameBible: () => void;
  onOpenSettings: () => void;
  onOpenSettlement: () => void;
  onOpenTransmog: () => void;
  onOpenSpecialization: () => void;
  onReplayCinematic: () => void;
  onToggleBuildingMode: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  playerHp,
  maxPlayerHp,
  playerStamina,
  maxPlayerStamina,
  playerAether,
  maxPlayerAether,
  level,
  xp,
  nextLevelXp,
  gold,
  equippedWeapon,
  archetype,
  origin,
  specialization,
  companion,
  activeQuest,
  worldEvent,
  warmthLevel,
  nourishmentTimer,
  isBuildingMode,
  isMuted,
  viewMode = '3d',
  onToggleViewMode,
  onToggleMute,
  onOpenInventory,
  onOpenCharacter,
  onOpenSkills,
  onOpenCrafting,
  onOpenDungeon,
  onOpenExpedition,
  onOpenGameBible,
  onOpenSettings,
  onOpenSettlement,
  onOpenTransmog,
  onOpenSpecialization,
  onReplayCinematic,
  onToggleBuildingMode
}) => {
  const hpPct = Math.max(0, Math.min(100, (playerHp / maxPlayerHp) * 100));
  const stamPct = Math.max(0, Math.min(100, (playerStamina / maxPlayerStamina) * 100));
  const aetherPct = Math.max(0, Math.min(100, (playerAether / maxPlayerAether) * 100));
  const xpPct = Math.max(0, Math.min(100, (xp / nextLevelXp) * 100));

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 select-none">
      {/* TOP BAR: Player status, Companion widget, Mini-info */}
      <div className="flex items-start justify-between">
        {/* PLAYER RESOURCE GLOBES & BARS */}
        <div className="pointer-events-auto flex items-start gap-3 bg-neutral-950/80 backdrop-blur-md p-3 rounded-xl border border-amber-500/20 shadow-2xl">
          <button
            onClick={onOpenCharacter}
            className="relative group w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-amber-900 flex items-center justify-center border-2 border-amber-400/60 shadow-lg hover:scale-105 transition-transform"
          >
            <span className="font-display font-bold text-lg text-neutral-950">{level}</span>
            <div className="absolute -bottom-1 text-[9px] font-bold tracking-wider bg-neutral-900 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/40">
              LVL
            </div>
          </button>

          <div className="flex flex-col gap-1.5 w-52 sm:w-64">
            {/* Health Bar */}
            <div className="flex justify-between items-center text-xs font-semibold text-neutral-200">
              <span className="flex items-center gap-1 text-red-400">
                <Heart className="w-3.5 h-3.5 fill-red-500 text-red-400" />
                VITALITY
              </span>
              <span className="font-mono text-[11px]">{Math.round(playerHp)} / {maxPlayerHp}</span>
            </div>
            <div className="h-2.5 w-full bg-neutral-900 rounded-full overflow-hidden border border-red-950">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-200"
                style={{ width: `${hpPct}%` }}
              />
            </div>

            {/* Stamina Bar */}
            <div className="flex justify-between items-center text-xs font-semibold text-neutral-200">
              <span className="flex items-center gap-1 text-emerald-400">
                <Zap className="w-3.5 h-3.5 fill-emerald-500 text-emerald-400" />
                STAMINA
              </span>
              <span className="font-mono text-[11px]">{Math.round(playerStamina)} / {maxPlayerStamina}</span>
            </div>
            <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden border border-emerald-950">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-150"
                style={{ width: `${stamPct}%` }}
              />
            </div>

            {/* Aether Energy Bar */}
            <div className="flex justify-between items-center text-xs font-semibold text-neutral-200">
              <span className="flex items-center gap-1 text-sky-400">
                <Flame className="w-3.5 h-3.5 fill-sky-500 text-sky-400" />
                AETHER
              </span>
              <span className="font-mono text-[11px]">{Math.round(playerAether)} / {maxPlayerAether}</span>
            </div>
            <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden border border-sky-950">
              <div
                className="h-full bg-gradient-to-r from-sky-600 to-sky-400 transition-all duration-200"
                style={{ width: `${aetherPct}%` }}
              />
            </div>

            {/* Experience mini bar */}
            <div className="h-1 w-full bg-neutral-900 rounded-full overflow-hidden mt-0.5">
              <div
                className="h-full bg-amber-400"
                style={{ width: `${xpPct}%` }}
              />
            </div>

            {/* Origin & Specialization Badges */}
            <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
              <button 
                onClick={onOpenSpecialization}
                className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-mono border border-amber-500/30 uppercase flex items-center gap-1 transition-colors"
              >
                <span>{archetype}</span>
                {specialization && <span>• {specialization.replace('_', ' ')}</span>}
              </button>
              {origin && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono border border-neutral-700">
                  {origin.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* COMPANION STATUS WIDGET */}
        <div className="hidden md:flex pointer-events-auto items-center gap-3 bg-neutral-950/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-neutral-800">
          <div className="w-10 h-10 rounded-full bg-emerald-900/60 border border-emerald-500/50 flex items-center justify-center text-emerald-300 font-display font-bold">
            KD
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-200">{companion.name}</span>
              <span className="text-[10px] text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40 uppercase">
                {companion.relationshipStatus}
              </span>
            </div>
            <div className="text-[11px] text-neutral-400 italic max-w-xs truncate">
              {companion.quote}
            </div>
          </div>
        </div>

        {/* TOP RIGHT: Global navigation shortcuts & Mute toggle */}
        <div className="pointer-events-auto flex items-center gap-2">
          {onOpenCharacter && (
            <button
              onClick={onOpenCharacter}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/60 text-amber-300 font-bold text-xs shadow-lg transition-all active:scale-95 animate-pulse"
              title="Open 3D Character Forge to create and customize your 3D Hero"
            >
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>CREATE 3D CHARACTER</span>
            </button>
          )}
          {onToggleViewMode && (
            <button
              onClick={onToggleViewMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold text-xs shadow-lg transition-all active:scale-95 ${
                viewMode === '3d'
                  ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-amber-500/25'
                  : 'bg-neutral-900/80 border-neutral-700 hover:border-amber-500/50 text-amber-300'
              }`}
              title="Toggle between 3D Third-Person Exploration and 2D Tactical View"
            >
              <CompassIcon className="w-3.5 h-3.5" />
              <span>{viewMode === '3d' ? '3D VIEW' : '2D TACTICAL'}</span>
            </button>
          )}
          <button
            onClick={onToggleMute}
            className="p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-700 hover:border-amber-500/50 text-neutral-300 hover:text-amber-400 transition-colors shadow-lg"
            title={isMuted ? "Unmute Audio" : "Mute Audio"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
          <button
            onClick={onOpenGameBible}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/40 text-amber-300 hover:bg-amber-500/20 transition-colors shadow-lg text-xs font-semibold"
            title="Open Complete AAA Game Bible, Character Bible, GDD & TDD"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">STUDIO BIBLE</span>
          </button>
          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-700 hover:border-amber-500/50 text-neutral-300 hover:text-amber-400 transition-colors shadow-lg"
            title="Settings & Keybindings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MIDDLE RIGHT: ACTIVE QUEST & WORLD EVENT */}
      <div className="flex justify-between items-center">
        {/* Survival status pill on the left */}
        <div className="pointer-events-auto flex flex-col gap-1.5 bg-neutral-950/70 backdrop-blur-md p-2.5 rounded-lg border border-neutral-800 text-xs">
          <div className="flex items-center gap-2 text-neutral-300 font-medium">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>Warmth:</span>
            <span className="font-mono text-orange-300">{warmthLevel}%</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-300 font-medium">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>Nourished:</span>
            <span className="font-mono text-amber-300">{Math.floor(nourishmentTimer / 60)}m</span>
          </div>
          <div className="text-[10px] text-neutral-400">Weather: Solar Twilight</div>
        </div>

        {/* Quest and World Event widgets */}
        <div className="pointer-events-auto flex flex-col gap-2 max-w-xs">
          {worldEvent.active && (
            <div className="bg-purple-950/80 backdrop-blur-md p-3 rounded-xl border border-purple-500/40 shadow-xl animate-pulse">
              <div className="flex items-center justify-between text-xs font-bold text-purple-300">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-purple-400" />
                  DYNAMIC EVENT
                </span>
                <span className="text-[10px] bg-purple-900 px-1.5 py-0.5 rounded">Stage {worldEvent.stage}</span>
              </div>
              <div className="text-xs font-semibold text-neutral-100 mt-1">{worldEvent.name}</div>
              <div className="text-[11px] text-purple-200/80 mt-0.5">{worldEvent.description}</div>
              <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden mt-2 border border-purple-900">
                <div
                  className="h-full bg-purple-500"
                  style={{ width: `${(worldEvent.objectiveProgress / worldEvent.objectiveMax) * 100}%` }}
                />
              </div>
            </div>
          )}

          {activeQuest && (
            <div className="bg-neutral-950/80 backdrop-blur-md p-3 rounded-xl border border-amber-500/20 shadow-xl">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <Compass className="w-3.5 h-3.5" />
                <span>ACTIVE CAMPAIGN</span>
              </div>
              <div className="text-xs font-semibold text-neutral-100 mt-1">{activeQuest.title}</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">{activeQuest.targetDescription}</div>
              <div className="flex justify-between items-center text-[10px] text-neutral-400 mt-1.5">
                <span>Progress</span>
                <span className="font-mono text-amber-400">{activeQuest.progress} / {activeQuest.maxProgress}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM AREA: ACTION BAR, SKILLS, HOTKEYS, DOCK BUTTONS */}
      <div className="flex flex-col items-center gap-2">
        {/* Core action abilities bar (Desktop wide display) */}
        <div className="pointer-events-auto hidden xl:flex items-center gap-2 bg-neutral-950/85 backdrop-blur-md p-2 rounded-2xl border border-amber-500/30 shadow-2xl">
          {/* Light Attack */}
          <div className="flex flex-col items-center">
            <div className="w-11 h-11 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center justify-center text-amber-400 shadow-inner group">
              <Sword className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-neutral-400 mt-1">L-CLICK</span>
          </div>

          {/* Heavy Attack */}
          <div className="flex flex-col items-center">
            <div className="w-11 h-11 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center justify-center text-red-400 shadow-inner">
              <Sword className="w-5 h-5 rotate-45" />
            </div>
            <span className="text-[10px] font-mono text-neutral-400 mt-1">R-CLICK</span>
          </div>

          {/* Block / Perfect Parry */}
          <div className="flex flex-col items-center">
            <div className="w-11 h-11 rounded-xl bg-neutral-900 border border-sky-600/50 flex items-center justify-center text-sky-400 shadow-inner">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-neutral-400 mt-1">Q (PARRY)</span>
          </div>

          {/* Dodge Roll */}
          <div className="flex flex-col items-center">
            <div className="w-11 h-11 rounded-xl bg-neutral-900 border border-emerald-600/50 flex items-center justify-center text-emerald-400 shadow-inner">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-neutral-400 mt-1">SPACE</span>
          </div>

          <div className="w-px h-8 bg-neutral-800 mx-1" />

          {/* Skill 1: Solar Cleave */}
          <div className="flex flex-col items-center">
            <div className="w-11 h-11 rounded-xl bg-neutral-900 border border-orange-500/50 flex items-center justify-center text-orange-400 shadow-inner">
              <Flame className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-neutral-400 mt-1">1</span>
          </div>

          {/* Skill 2: Aether Rush */}
          <div className="flex flex-col items-center">
            <div className="w-11 h-11 rounded-xl bg-neutral-900 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-inner">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-neutral-400 mt-1">2</span>
          </div>

          {/* Ultimate: Wrath of the Zenith */}
          <div className="flex flex-col items-center">
            <div className="w-11 h-11 rounded-xl bg-amber-950/60 border border-amber-400 flex items-center justify-center text-amber-300 shadow-lg shadow-amber-500/20 animate-pulse">
              <Sun className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono text-amber-300 font-bold mt-1">R (ULT)</span>
          </div>

          {/* Interact / Gather */}
          <div className="flex flex-col items-center">
            <div className="w-11 h-11 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center justify-center text-neutral-300 shadow-inner">
              <span className="font-bold text-xs font-mono">E</span>
            </div>
            <span className="text-[10px] font-mono text-neutral-400 mt-1">GATHER</span>
          </div>
        </div>

        {/* MODAL LAUNCHERS DOCK */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 bg-neutral-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-800 text-xs">
          <button
            onClick={onOpenCharacter}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors"
            title="Open 3D Character Forge"
          >
            <User className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold">3D Hero Forge</span>
          </button>
          <button
            onClick={onOpenInventory}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-amber-400 transition-colors"
          >
            <Package className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Inventory</span>
          </button>
          <button
            onClick={onOpenSkills}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-amber-400 transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Talents</span>
          </button>
          <button
            onClick={onOpenCrafting}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-amber-400 transition-colors"
          >
            <Hammer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Craft & Build</span>
          </button>
          <button
            onClick={onToggleBuildingMode}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors font-semibold ${
              isBuildingMode
                ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/30'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-amber-400'
            }`}
          >
            <Hammer className="w-3.5 h-3.5" />
            <span>{isBuildingMode ? 'Placing Camp...' : 'Camp Mode'}</span>
          </button>
          <button
            onClick={onOpenSettlement}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-amber-500/30 hover:border-amber-400 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Echo Camp</span>
          </button>
          <button
            onClick={onOpenTransmog}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-amber-400 transition-colors"
          >
            <Palette className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden sm:inline">Wardrobe</span>
          </button>
          <button
            onClick={onOpenSpecialization}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-amber-400 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Spec</span>
          </button>
          <button
            onClick={onReplayCinematic}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-amber-400 transition-colors"
            title="Replay Story Cutscene"
          >
            <Film className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenDungeon}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-amber-400 transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">5-P Dungeon</span>
          </button>
          <button
            onClick={onOpenExpedition}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-amber-400 transition-colors"
          >
            <CompassIcon className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Expedition</span>
          </button>
        </div>
      </div>
    </div>
  );
};
