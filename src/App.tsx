import React, { useState, useEffect, useCallback } from 'react';
import { CombatEngineCanvas } from './components/game/CombatEngineCanvas';
import { WorldEngine3D } from './components/game/WorldEngine3D';
import { GameHUD } from './components/ui/GameHUD';
import { CharacterCreatorModal } from './components/ui/CharacterCreatorModal';
import { InventoryGearModal } from './components/ui/InventoryGearModal';
import { CraftingBuildingModal } from './components/ui/CraftingBuildingModal';
import { DungeonSquadModal } from './components/ui/DungeonSquadModal';
import { MythicExpeditionModal } from './components/ui/MythicExpeditionModal';
import { GameBibleViewer } from './components/ui/GameBibleViewer';
import { SettingsControlsModal } from './components/ui/SettingsControlsModal';
import { TalentsModal } from './components/ui/TalentsModal';
import { CinematicDialogueModal } from './components/ui/CinematicDialogueModal';
import { CinematicSequenceModal } from './components/ui/CinematicSequenceModal';
import { SettlementNPCModal } from './components/ui/SettlementNPCModal';
import { TransmogWardrobeModal } from './components/ui/TransmogWardrobeModal';
import { ClassSpecializationModal } from './components/ui/ClassSpecializationModal';
import { ClassIntroductionModal } from './components/ui/ClassIntroductionModal';
import { ActOneCompleteModal } from './components/ui/ActOneCompleteModal';
import { storageService, GameSaveState, DEFAULT_SAVE_STATE, DEFAULT_WORLD_STATE } from './services/storageService';
import { audioEngine } from './services/audioEngine';
import { INITIAL_DIALOGUES } from './data/starterData';
import { CINEMATIC_SCENES } from './data/storyNarrative';
import { CHAPTER_ONE_QUESTS } from './data/chapterOneQuests';
import { 
  WeaponType, 
  CombatArchetype, 
  ClassSpecialization,
  TransmogSettings,
  Item, 
  CampStructure, 
  DialogueNode, 
  WorldEvent, 
  CharacterAppearance, 
  CharacterAttributes,
  CinematicScene 
} from './types/game';
import confetti from 'canvas-confetti';

export default function App() {
  // Load saved state or default
  const [saveState, setSaveState] = useState<GameSaveState>(() => storageService.loadGameState());

  // Dynamic player combat resources
  const maxHp = (saveState.attributes?.vitality || 10) * 25 + (saveState.level * 20);
  const [playerHp, setPlayerHp] = useState<number>(maxHp);

  const maxStamina = (saveState.attributes?.agility || 10) * 8 + 50;
  const [playerStamina, setPlayerStamina] = useState<number>(maxStamina);

  const maxAether = (saveState.attributes?.resonance || 10) * 12 + 40;
  const [playerAether, setPlayerAether] = useState<number>(maxAether);

  // Survival stats
  const [warmthLevel, setWarmthLevel] = useState<number>(saveState.warmthLevel || 85);
  const [nourishmentTimer, setNourishmentTimer] = useState<number>(saveState.nourishmentTimer || 420);

  // Audio mute state
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // 3D vs 2D View Engine
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');

  // Building mode
  const [isBuildingMode, setIsBuildingMode] = useState<boolean>(false);
  const [selectedStructureType, setSelectedStructureType] = useState<CampStructure['type']>('campfire');

  // Modals
  const [showCharacterCreator, setShowCharacterCreator] = useState<boolean>(false);
  const [showInventory, setShowInventory] = useState<boolean>(false);
  const [showCraftingBuilding, setShowCraftingBuilding] = useState<boolean>(false);
  const [showDungeon, setShowDungeon] = useState<boolean>(false);
  const [showExpedition, setShowExpedition] = useState<boolean>(false);
  const [showGameBible, setShowGameBible] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showTalents, setShowTalents] = useState<boolean>(false);
  const [showSettlement, setShowSettlement] = useState<boolean>(false);
  const [showTransmog, setShowTransmog] = useState<boolean>(false);
  const [showSpecialization, setShowSpecialization] = useState<boolean>(false);
  const [showClassIntro, setShowClassIntro] = useState<boolean>(false);
  const [showActOneComplete, setShowActOneComplete] = useState<boolean>(false);
  const [approvalFeedback, setApprovalFeedback] = useState<{ text: string; delta: number; status: string } | null>(null);
  const [activeCinematicScene, setActiveCinematicScene] = useState<CinematicScene | null>(null);
  const [showCinematicMenu, setShowCinematicMenu] = useState<boolean>(false);

  // Dialogue state
  const [currentDialogueNode, setCurrentDialogueNode] = useState<DialogueNode | null>(null);

  // Dynamic world event
  const [worldEvent, setWorldEvent] = useState<WorldEvent>({
    id: 'evt_eclipse_breach',
    name: 'Twilight Eclipse Incursion',
    description: 'Umbral rifts tear through the reef! Purge the abyssal creatures before corruption spreads.',
    location: 'Sol-Vaelen Beachhead',
    active: true,
    stage: 1,
    timeRemaining: 480,
    objectiveProgress: 2,
    objectiveMax: 8,
    rewards: {
      xp: 600,
      gold: 150
    }
  });

  // Start background ambient music on first interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      audioEngine.startBackgroundAmbient();
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);
    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  // Periodic Survival & World Event loop
  useEffect(() => {
    const interval = setInterval(() => {
      // Warmth & Nourishment decay
      setNourishmentTimer(prev => Math.max(0, prev - 1));

      // Natural health & stamina & aether regen
      setPlayerStamina(prev => Math.min(maxStamina, prev + 3));
      setPlayerAether(prev => Math.min(maxAether, prev + 1.5));
      setPlayerHp(prev => Math.min(maxHp, prev + (nourishmentTimer > 0 ? 1.5 : 0.4)));

      // Event countdown
      setWorldEvent(prev => {
        if (!prev.active || prev.timeRemaining <= 0) return prev;
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [maxHp, maxStamina, maxAether, nourishmentTimer]);

  // Auto-save saveState when updated
  useEffect(() => {
    storageService.saveGameState({
      ...saveState,
      warmthLevel,
      nourishmentTimer
    });
  }, [saveState, warmthLevel, nourishmentTimer]);

  // Global hotkeys for inventory, character, bible, crafting
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toLowerCase();
      if (key === 'i') {
        setShowInventory(prev => !prev);
      } else if (key === 'c') {
        setShowCharacterCreator(prev => !prev);
      } else if (key === 'b') {
        setShowCraftingBuilding(prev => !prev);
      } else if (key === 'k') {
        setShowTalents(prev => !prev);
      } else if (key === 'j') {
        setShowGameBible(prev => !prev);
      } else if (key === 'escape') {
        setShowInventory(false);
        setShowCharacterCreator(false);
        setShowCraftingBuilding(false);
        setShowDungeon(false);
        setShowExpedition(false);
        setShowGameBible(false);
        setShowSettings(false);
        setShowTalents(false);
        setCurrentDialogueNode(null);
        setIsBuildingMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers for combat engine callbacks
  const handleTakeDamage = useCallback((amount: number) => {
    setPlayerHp(prev => {
      const next = Math.max(0, prev - amount);
      if (next === 0) {
        // Player defeated: Respawn at campfire
        setTimeout(() => {
          setPlayerHp(maxHp);
          audioEngine.playLevelUp();
        }, 1200);
      }
      return next;
    });
  }, [maxHp]);

  const handleConsumeStamina = useCallback((amount: number): boolean => {
    if (playerStamina < amount) return false;
    setPlayerStamina(prev => prev - amount);
    return true;
  }, [playerStamina]);

  const handleConsumeAether = useCallback((amount: number): boolean => {
    if (playerAether < amount) return false;
    setPlayerAether(prev => prev - amount);
    return true;
  }, [playerAether]);

  const handleGainXp = useCallback((amount: number) => {
    setSaveState(prev => {
      let currentXp = prev.xp + amount;
      let currentLevel = prev.level;
      let nextXp = prev.nextLevelXp;

      if (currentXp >= nextXp) {
        currentLevel += 1;
        currentXp -= nextXp;
        nextXp = Math.floor(nextXp * 1.5);
        audioEngine.playLevelUp();
        confetti({ particleCount: 80, spread: 60 });
      }

      return {
        ...prev,
        level: currentLevel,
        xp: currentXp,
        nextLevelXp: nextXp
      };
    });
  }, []);

  const handleLootGained = useCallback((item: Item) => {
    setSaveState(prev => {
      // If stackable material
      const existing = prev.inventory.find(i => i.id === item.id);
      if (existing && item.type === 'material') {
        return {
          ...prev,
          inventory: prev.inventory.map(i =>
            i.id === item.id ? { ...i, quantity: (i.quantity || 1) + (item.quantity || 1) } : i
          )
        };
      }
      return {
        ...prev,
        inventory: [item, ...prev.inventory]
      };
    });
  }, []);

  const handleStructurePlaced = useCallback((structure: CampStructure) => {
    setIsBuildingMode(false);
    audioEngine.playGather();
    setSaveState(prev => ({
      ...prev,
      structures: [...prev.structures, structure]
    }));
    advanceActiveQuest(1);
  }, []);

  const handleCompanionSpeech = useCallback((line: string) => {
    audioEngine.speakLine(line, 'kaelen');
  }, []);

  // Chapter 1 Quest Progression Engine
  const advanceActiveQuest = useCallback((amount: number = 1) => {
    setSaveState(prev => {
      const activeIdx = prev.worldState?.currentQuestChainIndex ?? 0;
      const quests = [...(prev.quests || CHAPTER_ONE_QUESTS)];
      const activeQ = quests[activeIdx];
      if (!activeQ || activeQ.isCompleted) return prev;

      const newProg = Math.min(activeQ.maxProgress, activeQ.progress + amount);
      const isComplete = newProg >= activeQ.maxProgress;

      quests[activeIdx] = {
        ...activeQ,
        progress: newProg,
        isCompleted: isComplete,
        state: isComplete ? 'completed' : 'active'
      };

      let newWorldState = { ...(prev.worldState || DEFAULT_WORLD_STATE) };

      if (isComplete) {
        audioEngine.playLevelUp();
        audioEngine.speakLine(`Quest completed: ${activeQ.title}`, 'kaelen');
        confetti({ particleCount: 75, spread: 65 });

        // Specific quest completions update worldState & settlements
        if (activeQ.id === 'q_act0_3_first_survivor') {
          newWorldState.companionApproval = 'trusted';
          newWorldState.companionApprovalScore = 65;
        } else if (activeQ.id === 'q_act1_4_beacon_echo_camp') {
          newWorldState.campLevel = Math.max(newWorldState.campLevel, 2);
        } else if (activeQ.id === 'q_act1_5_twilight_incursion') {
          newWorldState.worldEventCompleted = true;
          newWorldState.eclipseIntensity = Math.max(10, newWorldState.eclipseIntensity - 15);
        } else if (activeQ.id === 'q_act1_6_path_to_ascendancy') {
          newWorldState.classSpecializationUnlocked = true;
        } else if (activeQ.id === 'q_act1_7_sunken_sanctum') {
          newWorldState.sanctumCompleted = true;
          newWorldState.majorBossDefeated = true;
          setShowActOneComplete(true);
        } else if (activeQ.id === 'q_act1_8_revelation_epilogue') {
          newWorldState.act1Completed = true;
          newWorldState.revelationViewed = true;
        }

        // Advance index to next quest if available
        if (activeIdx < quests.length - 1) {
          const nextIdx = activeIdx + 1;
          newWorldState.currentQuestChainIndex = nextIdx;
          if (quests[nextIdx]) {
            quests[nextIdx] = { ...quests[nextIdx], state: 'active' };
          }
        }
      }

      return {
        ...prev,
        xp: prev.xp + (isComplete ? activeQ.rewards.xp : 0),
        gold: prev.gold + (isComplete ? activeQ.rewards.gold : 0),
        quests,
        worldState: newWorldState
      };
    });
  }, []);

  const handleEventProgress = useCallback((delta: number) => {
    setWorldEvent(prev => {
      const nextProg = prev.objectiveProgress + delta;
      if (nextProg >= prev.objectiveMax) {
        // Event stage triumph!
        confetti({ particleCount: 100, spread: 70 });
        audioEngine.playLevelUp();
        advanceActiveQuest(1);
        return {
          ...prev,
          stage: prev.stage + 1,
          objectiveProgress: 0,
          objectiveMax: prev.objectiveMax + 4,
          name: `Twilight Eclipse Incursion - Stage ${prev.stage + 1}`
        };
      }
      return { ...prev, objectiveProgress: nextProg };
    });
  }, [advanceActiveQuest]);

  // Equip / Use Handlers
  const handleEquipWeapon = (weaponType: WeaponType) => {
    setSaveState(prev => ({
      ...prev,
      equippedWeapon: weaponType
    }));
  };

  const handleEquipArmor = (armorId: string) => {
    setSaveState(prev => ({
      ...prev,
      equippedArmorChestId: armorId
    }));
  };

  const handleUseItem = (item: Item) => {
    if (item.type === 'consumable') {
      if (item.name.includes('Healing') || item.name.includes('Draught')) {
        setPlayerHp(prev => Math.min(maxHp, prev + 120));
      } else if (item.name.includes('Roast')) {
        setNourishmentTimer(600); // 10 minutes
        setPlayerHp(prev => Math.min(maxHp, prev + 80));
      }
      // Deduct quantity
      setSaveState(prev => ({
        ...prev,
        inventory: prev.inventory
          .map(i => i.id === item.id ? { ...i, quantity: (i.quantity || 1) - 1 } : i)
          .filter(i => (i.quantity ?? 1) > 0)
      }));
    }
  };

  // Craft item handler
  const handleCraftItem = (craftedItem: Item, costs: { id: string; qty: number }[]) => {
    setSaveState(prev => {
      let updatedInv = [...prev.inventory];
      costs.forEach(cost => {
        const itemIdx = updatedInv.findIndex(i => i.id === cost.id);
        if (itemIdx >= 0) {
          const item = updatedInv[itemIdx];
          const newQty = (item.quantity || 1) - cost.qty;
          if (newQty <= 0) {
            updatedInv.splice(itemIdx, 1);
          } else {
            updatedInv[itemIdx] = { ...item, quantity: newQty };
          }
        }
      });
      return {
        ...prev,
        inventory: [craftedItem, ...updatedInv]
      };
    });
  };

  // Dialogue option select
  const handleDialogueOptionSelect = (optionIndex: number) => {
    if (!currentDialogueNode) return;
    const chosenOption = currentDialogueNode.options[optionIndex];
    if (chosenOption.affinityChange) {
      const delta = chosenOption.affinityChange;
      setSaveState(prev => {
        const oldScore = prev.companion.relationshipScore || 35;
        const newScore = Math.min(100, Math.max(0, oldScore + delta));
        const status = newScore >= 80 ? 'sworn_kin' : newScore >= 55 ? 'trusted' : newScore >= 30 ? 'friendly' : 'suspicious';

        setApprovalFeedback({
          text: delta > 0 ? `Kaelen Drake approved (+${delta})` : `Kaelen Drake disapproved (${delta})`,
          delta,
          status
        });
        setTimeout(() => setApprovalFeedback(null), 3500);

        return {
          ...prev,
          companion: {
            ...prev.companion,
            relationshipScore: newScore,
            relationshipStatus: status
          },
          worldState: {
            ...prev.worldState,
            companionApproval: status,
            companionApprovalScore: newScore
          }
        };
      });
      advanceActiveQuest(1);
    }

    if (chosenOption.nextNodeId && INITIAL_DIALOGUES[chosenOption.nextNodeId]) {
      setCurrentDialogueNode(INITIAL_DIALOGUES[chosenOption.nextNodeId]);
    } else {
      setCurrentDialogueNode(null);
    }
  };

  // Settlement upgrade
  const handleUpgradeSettlement = () => {
    const cost = (saveState.settlementLevel || 1) * 150;
    if (saveState.gold < cost) return;

    setSaveState(prev => ({
      ...prev,
      gold: prev.gold - cost,
      settlementLevel: (prev.settlementLevel || 1) + 1,
      worldState: {
        ...prev.worldState,
        campLevel: Math.min(5, (prev.settlementLevel || 1) + 1)
      }
    }));
    advanceActiveQuest(1);
    audioEngine.playLevelUp();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 }
    });
  };

  // NPC item craft
  const handleNPCItemCraft = (itemData: Partial<Item>, cost: number) => {
    if (saveState.gold < cost) return;
    const newItem: Item = {
      id: itemData.id || `item_${Date.now()}`,
      name: itemData.name || 'Crafted Item',
      type: itemData.type || 'consumable',
      weaponType: itemData.weaponType,
      rarity: itemData.rarity || 'rare',
      icon: itemData.icon || '⚔️',
      stats: itemData.stats || {},
      value: itemData.value || 30,
      description: itemData.description || 'Crafted by camp specialists.',
      quantity: 1
    };

    setSaveState(prev => ({
      ...prev,
      gold: prev.gold - cost,
      inventory: [newItem, ...prev.inventory]
    }));
    audioEngine.playRelicSurge();
  };

  // Transmog update
  const handleSaveTransmog = (transmog: TransmogSettings) => {
    setSaveState(prev => ({
      ...prev,
      transmog
    }));
  };

  // Specialization update
  const handleSelectSpecialization = (specialization: ClassSpecialization) => {
    setSaveState(prev => ({
      ...prev,
      specialization
    }));
  };

  // Audio mute toggle
  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audioEngine.setMasterMute(nextMute);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950 font-sans select-none text-neutral-100">
      {/* REALTIME 3D WORLD OR 2D TACTICAL CANVAS */}
      {viewMode === '3d' ? (
        <WorldEngine3D
          appearance={saveState.appearance}
          archetype={saveState.archetype}
          specialization={saveState.specialization}
          equippedWeapon={saveState.equippedWeapon}
          transmog={saveState.transmog}
          playerHp={playerHp}
          maxPlayerHp={maxHp}
          playerStamina={playerStamina}
          maxPlayerStamina={maxStamina}
          playerAether={playerAether}
          maxPlayerAether={maxAether}
          companion={saveState.companion}
          settlementTier={saveState.worldState?.settlementTier || 1}
          onTakeDamage={handleTakeDamage}
          onConsumeStamina={handleConsumeStamina}
          onConsumeAether={handleConsumeAether}
          onGainXp={handleGainXp}
          onLootGained={handleLootGained}
          onCompanionSpeech={handleCompanionSpeech}
          onOpenSettlement={() => setShowSettlement(true)}
          onOpenCharacter={() => setShowCharacterCreator(true)}
        />
      ) : (
        <CombatEngineCanvas
          appearance={saveState.appearance}
          equippedWeapon={saveState.equippedWeapon}
          archetype={saveState.archetype}
          playerHp={playerHp}
          maxPlayerHp={maxHp}
          playerStamina={playerStamina}
          maxPlayerStamina={maxStamina}
          playerAether={playerAether}
          maxPlayerAether={maxAether}
          companion={saveState.companion}
          structures={saveState.structures}
          isBuildingMode={isBuildingMode}
          selectedStructureType={selectedStructureType}
          cameraDistance={1}
          cameraShakeEnabled={true}
          onTakeDamage={handleTakeDamage}
          onConsumeStamina={handleConsumeStamina}
          onConsumeAether={handleConsumeAether}
          onGainXp={handleGainXp}
          onLootGained={handleLootGained}
          onStructurePlaced={handleStructurePlaced}
          onCompanionSpeech={handleCompanionSpeech}
          activeWorldEvent={worldEvent.active}
          onEventProgress={handleEventProgress}
        />
      )}

      {/* COMPREHENSIVE AAA HUD OVERLAY */}
      <GameHUD
        playerHp={playerHp}
        maxPlayerHp={maxHp}
        playerStamina={playerStamina}
        maxPlayerStamina={maxStamina}
        playerAether={playerAether}
        maxPlayerAether={maxAether}
        level={saveState.level}
        xp={saveState.xp}
        nextLevelXp={saveState.nextLevelXp}
        gold={saveState.gold}
        equippedWeapon={saveState.equippedWeapon}
        archetype={saveState.archetype}
        origin={saveState.origin}
        specialization={saveState.specialization}
        companion={saveState.companion}
        activeQuest={saveState.quests[saveState.worldState?.currentQuestChainIndex || 0] || saveState.quests[0] || null}
        worldEvent={worldEvent}
        warmthLevel={warmthLevel}
        nourishmentTimer={nourishmentTimer}
        isBuildingMode={isBuildingMode}
        isMuted={isMuted}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode(v => v === '3d' ? '2d' : '3d')}
        onToggleMute={toggleMute}
        onOpenInventory={() => setShowInventory(true)}
        onOpenCharacter={() => setShowCharacterCreator(true)}
        onOpenSkills={() => setShowTalents(true)}
        onOpenCrafting={() => setShowCraftingBuilding(true)}
        onOpenDungeon={() => setShowDungeon(true)}
        onOpenExpedition={() => setShowExpedition(true)}
        onOpenGameBible={() => setShowGameBible(true)}
        onOpenSettings={() => setShowSettings(true)}
        onOpenSettlement={() => setShowSettlement(true)}
        onOpenTransmog={() => setShowTransmog(true)}
        onOpenSpecialization={() => setShowSpecialization(true)}
        onReplayCinematic={() => setShowCinematicMenu(true)}
        onToggleBuildingMode={() => setIsBuildingMode(prev => !prev)}
      />

      {/* COMPANION RELATIONSHIP NOTIFICATION */}
      {approvalFeedback && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-bounce">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-neutral-950/90 border border-amber-500/50 shadow-2xl backdrop-blur-md">
            <span className="text-amber-400 font-bold text-xs">✨ {approvalFeedback.text}</span>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
              {approvalFeedback.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      )}

      {/* MODAL: CHARACTER FORGE & ARCHETYPE */}
      <CharacterCreatorModal
        isOpen={showCharacterCreator}
        onClose={() => setShowCharacterCreator(false)}
        currentAppearance={saveState.appearance}
        currentAttributes={saveState.attributes}
        currentArchetype={saveState.archetype}
        currentSpecialization={saveState.specialization}
        onSave={(appearance, attributes, archetype, specialization) => {
          const wasPrologueCompleted = saveState.prologueCompleted;
          setSaveState(prev => ({
            ...prev,
            appearance,
            attributes,
            archetype,
            specialization: specialization || prev.specialization,
            prologueCompleted: true
          }));
          setShowCharacterCreator(false);
          if (!saveState.worldState?.classIntroCompleted) {
            setShowClassIntro(true);
          } else if (!wasPrologueCompleted) {
            setActiveCinematicScene(CINEMATIC_SCENES.prologue_intro);
          }
        }}
      />

      {/* MODAL: INVENTORY & EQUIPMENT */}
      <InventoryGearModal
        isOpen={showInventory}
        onClose={() => setShowInventory(false)}
        inventory={saveState.inventory}
        equippedWeapon={saveState.equippedWeapon}
        equippedArmorChestId={saveState.equippedArmorChestId}
        gold={saveState.gold}
        onEquipWeapon={handleEquipWeapon}
        onEquipArmor={handleEquipArmor}
        onUseItem={handleUseItem}
      />

      {/* MODAL: CRAFTING & SETTLEMENT BUILDING */}
      <CraftingBuildingModal
        isOpen={showCraftingBuilding}
        onClose={() => setShowCraftingBuilding(false)}
        inventory={saveState.inventory}
        onCraftItem={handleCraftItem}
        onSelectBuildingType={type => setSelectedStructureType(type)}
        onStartPlacement={() => setIsBuildingMode(true)}
      />

      {/* MODAL: SETTLEMENT NPCS (ECHO CAMP) */}
      <SettlementNPCModal
        isOpen={showSettlement}
        onClose={() => setShowSettlement(false)}
        gold={saveState.gold}
        settlementLevel={saveState.settlementLevel || 1}
        playerOrigin={saveState.appearance.origin}
        onUpgradeSettlement={handleUpgradeSettlement}
        onOpenTransmog={() => {
          setShowSettlement(false);
          setShowTransmog(true);
        }}
        onCraftItem={handleNPCItemCraft}
      />

      {/* MODAL: TRANSMOG & WARDROBE */}
      <TransmogWardrobeModal
        isOpen={showTransmog}
        onClose={() => setShowTransmog(false)}
        appearance={saveState.appearance}
        archetype={saveState.archetype}
        currentTransmog={saveState.transmog || {
          weaponSkin: 'default',
          armorSkin: 'default',
          cloakVisible: true,
          cloakDye: '#b76e33',
          helmVisible: false
        }}
        onSaveTransmog={handleSaveTransmog}
      />

      {/* MODAL: CLASS SPECIALIZATION */}
      <ClassSpecializationModal
        isOpen={showSpecialization}
        onClose={() => setShowSpecialization(false)}
        archetype={saveState.archetype}
        currentSpecialization={saveState.specialization}
        onSelectSpecialization={handleSelectSpecialization}
      />

      {/* MODAL: 5-PLAYER COOPERATIVE DUNGEON */}
      <DungeonSquadModal
        isOpen={showDungeon}
        onClose={() => setShowDungeon(false)}
        playerArchetype={saveState.archetype}
        onVictoryReward={(xpGained, lootItem) => {
          handleGainXp(xpGained);
          handleLootGained(lootItem);
          advanceActiveQuest(1);
          setShowDungeon(false);
          setShowActOneComplete(true);
        }}
      />

      {/* MODAL: CLASS AWAKENING INTRODUCTION */}
      <ClassIntroductionModal
        isOpen={showClassIntro}
        archetype={saveState.archetype}
        origin={saveState.appearance.origin}
        onComplete={() => {
          setShowClassIntro(false);
          setSaveState(prev => ({
            ...prev,
            worldState: {
              ...prev.worldState,
              classIntroCompleted: true
            }
          }));
          setActiveCinematicScene(CINEMATIC_SCENES.prologue_intro);
        }}
      />

      {/* MODAL: ACT I COMPLETE MILESTONE */}
      <ActOneCompleteModal
        isOpen={showActOneComplete}
        onClose={() => setShowActOneComplete(false)}
        playerArchetype={saveState.archetype}
        characterName={saveState.appearance.name}
        onClaimRewards={(weapon, relic) => {
          handleLootGained(weapon);
          handleLootGained(relic);
          handleGainXp(2500);
          setSaveState(prev => ({
            ...prev,
            gold: prev.gold + 500,
            settlementLevel: Math.max(prev.settlementLevel || 1, 3),
            worldState: {
              ...prev.worldState,
              act1Completed: true,
              revelationViewed: true,
              sanctumCompleted: true,
              majorBossDefeated: true
            }
          }));
        }}
      />

      {/* MODAL: MYTHIC PROCEDURAL EXPEDITION */}
      <MythicExpeditionModal
        isOpen={showExpedition}
        onClose={() => setShowExpedition(false)}
        onGainReward={(xpGained, lootItem) => {
          handleGainXp(xpGained);
          handleLootGained(lootItem);
        }}
      />

      {/* MODAL: MASTER STUDIO GAME BIBLE VIEWER */}
      <GameBibleViewer
        isOpen={showGameBible}
        onClose={() => setShowGameBible(false)}
      />

      {/* MODAL: TALENTS & COMBAT ASCENDANCY */}
      <TalentsModal
        isOpen={showTalents}
        onClose={() => setShowTalents(false)}
        archetype={saveState.archetype}
        level={saveState.level}
      />

      {/* MODAL: SETTINGS & CONTROLS */}
      <SettingsControlsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onResetSave={() => {
          storageService.resetSaveState();
          setSaveState(DEFAULT_SAVE_STATE);
          setPlayerHp(DEFAULT_SAVE_STATE.attributes.vitality * 25);
        }}
      />

      {/* CINEMATIC CUTSCENE PLAYER */}
      <CinematicSequenceModal
        isOpen={Boolean(activeCinematicScene)}
        scene={activeCinematicScene}
        onComplete={() => {
          setActiveCinematicScene(null);
          setSaveState(prev => ({ ...prev, prologueCompleted: true }));
        }}
      />

      {/* CINEMATIC STORY REPLAY SELECTOR */}
      {showCinematicMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-neutral-950 border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-display font-bold text-amber-400 text-sm tracking-wider">
                CHRONICLES OF AETHELGARD: STORY BEATS
              </h3>
              <button
                onClick={() => setShowCinematicMenu(false)}
                className="text-neutral-400 hover:text-neutral-100 text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-neutral-400">
              Select a chapter cutscene to experience the fully voiced cinematic narrative.
            </p>
            <div className="space-y-2">
              {Object.values(CINEMATIC_SCENES).map(scene => (
                <button
                  key={scene.id}
                  onClick={() => {
                    setShowCinematicMenu(false);
                    setActiveCinematicScene(scene);
                  }}
                  className="w-full text-left p-3.5 rounded-xl bg-neutral-900/60 hover:bg-amber-500/15 border border-neutral-800 hover:border-amber-500/40 transition-all flex items-center justify-between group"
                >
                  <div>
                    <div className="text-xs font-bold text-neutral-200 group-hover:text-amber-300">
                      {scene.title}
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      {scene.subtitle}
                    </div>
                  </div>
                  <span className="text-xs text-amber-400">Play ▶</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CINEMATIC DIALOGUE SCENE (KAELEN DRAKE) */}
      <CinematicDialogueModal
        isOpen={Boolean(currentDialogueNode)}
        node={currentDialogueNode}
        companion={saveState.companion}
        onSelectOption={handleDialogueOptionSelect}
        onClose={() => setCurrentDialogueNode(null)}
      />

      {/* QUICK COMPANION & SETTLEMENT INTERACTION PROMPT */}
      <div className="absolute top-20 left-4 pointer-events-auto flex flex-wrap items-center gap-2">
        <button
          onClick={() => setCurrentDialogueNode(INITIAL_DIALOGUES.kaelen_intro)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-950/80 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold backdrop-blur-md shadow-lg transition-all hover:scale-105"
        >
          <span>Speak with Kaelen</span>
          <span className="text-[10px] font-mono bg-neutral-900 px-1.5 py-0.5 rounded text-neutral-400">T</span>
        </button>

        <button
          onClick={() => setShowSettlement(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-950/80 hover:bg-amber-500/20 border border-neutral-800 hover:border-amber-500/30 text-neutral-300 hover:text-amber-300 text-xs font-semibold backdrop-blur-md shadow-lg transition-all hover:scale-105"
        >
          <span>Echo Camp (NPCs)</span>
          <span className="text-[10px] font-mono bg-neutral-900 px-1.5 py-0.5 rounded text-neutral-400">C</span>
        </button>

        <button
          onClick={() => setShowClassIntro(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-950/80 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold backdrop-blur-md shadow-lg transition-all hover:scale-105"
        >
          <span>Class Awakening</span>
        </button>

        <button
          onClick={() => setShowDungeon(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-950/80 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold backdrop-blur-md shadow-lg transition-all hover:scale-105"
        >
          <span>Sunken Sanctum</span>
        </button>
      </div>
    </div>
  );
}
