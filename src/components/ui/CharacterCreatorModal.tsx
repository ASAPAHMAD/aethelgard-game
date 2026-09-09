import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Volume2, 
  Check, 
  Sparkles, 
  Shield, 
  Zap, 
  Flame, 
  Wind, 
  RotateCw, 
  Sun, 
  Moon, 
  Eye, 
  Compass, 
  User, 
  Swords, 
  Palette,
  Layers,
  ChevronRight,
  Shuffle
} from 'lucide-react';
import { 
  CharacterAppearance, 
  CharacterAttributes, 
  CombatArchetype, 
  PlayableOrigin, 
  VoiceProfileType,
  ClassSpecialization 
} from '../../types/game';
import { PLAYABLE_ORIGINS, VOICE_PROFILES, CLASS_DETAILS } from '../../data/storyNarrative';
import { audioEngine } from '../../services/audioEngine';
import { CharacterForge3D } from '../game/CharacterForge3D';

interface CharacterCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAppearance: CharacterAppearance;
  currentAttributes: CharacterAttributes;
  currentArchetype: CombatArchetype;
  currentSpecialization?: ClassSpecialization;
  onSave: (
    appearance: CharacterAppearance,
    attributes: CharacterAttributes,
    archetype: CombatArchetype,
    specialization?: ClassSpecialization
  ) => void;
}

type TabType = 'origin' | 'body' | 'face' | 'hair' | 'skin' | 'markings' | 'eyes' | 'voice' | 'class' | 'preview';

const SKIN_TONES = ['#d4a373', '#e0ac69', '#ffdbac', '#8d5524', '#c68642', '#3d2314', '#5c3826', '#e5c29f', '#2a1a10'];
const HAIR_COLORS = ['#3d2b1f', '#1a1a1a', '#b76e33', '#d4af37', '#e9ecef', '#8338ec', '#c1121f', '#2a9d8f', '#4a4e69'];
const EYE_COLORS = ['#ffd166', '#4ea8de', '#2b9348', '#7209b7', '#e63946', '#f8f9fa', '#ff9e00', '#06d6a0'];
const HAIR_STYLES = [
  'Warrior Braids', 
  'Citadel High Knot', 
  'Wind-blown Shorn', 
  'Wild Untamed', 
  'Shaved Dreadlocks', 
  'Sylvan Flowing', 
  'Tidal Undercut',
  'Sun-Guard Crest'
];
const FACIAL_HAIR_STYLES = ['None', 'Clean Shaven', 'Trimmed Stubble', 'Braided Beard', 'Citadel Goatee', 'Reaver Whiskers'];
const FACE_SHAPES = ['Angular Highborne', 'Rugged Coastal', 'Chiseled Vanguard', 'Sylvan Slender', 'Stoic Square'];
const EYE_SHAPES = ['Almond', 'Fierce Hunter', 'Deep Set', 'Sun-Ringed', 'Mystic Slanted'];
const SCAR_OPTIONS = ['None', 'Sun Scar', 'Eclipse Brand', 'Claw Rakes', 'Battle Grazed', 'Ritual Sunder'];
const MARKING_OPTIONS = [
  'None', 
  'Citadel Solar Glyphs', 
  'Tidal Wave Runes', 
  'Sylvan Chloromarkings', 
  'Void Veins', 
  'Aether Brand'
];

const HERO_PRESETS = [
  {
    name: 'Valerius Sunward',
    title: 'Solar Vanguard',
    origin: 'sol_vaelen' as PlayableOrigin,
    archetype: 'vanguard' as CombatArchetype,
    spec: 'solar_champion' as ClassSpecialization,
    bodyType: 'masculine' as const,
    height: 1.05,
    muscularBuild: 1.15,
    skinTone: '#d4a373',
    hairColor: '#d4af37',
    hairStyle: 'Warrior Braids',
    facialHair: 'Braided Beard',
    eyeColor: '#ffd166',
    scars: 'Sun Scar',
    culturalMarkings: 'Citadel Solar Glyphs'
  },
  {
    name: 'Morrigan Umbra',
    title: 'Void Spellblade',
    origin: 'umbral_pariah' as PlayableOrigin,
    archetype: 'spellblade' as CombatArchetype,
    spec: 'aether_weaver' as ClassSpecialization,
    bodyType: 'feminine' as const,
    height: 0.98,
    muscularBuild: 0.95,
    skinTone: '#e5c29f',
    hairColor: '#8338ec',
    hairStyle: 'Sylvan Flowing',
    facialHair: 'None',
    eyeColor: '#7209b7',
    scars: 'Eclipse Brand',
    culturalMarkings: 'Void Veins'
  },
  {
    name: 'Sylas Ironwood',
    title: 'Verdant Shadowstrider',
    origin: 'ironwood_weaver' as PlayableOrigin,
    archetype: 'shadowstrider' as CombatArchetype,
    spec: 'ghost_blade' as ClassSpecialization,
    bodyType: 'masculine' as const,
    height: 1.02,
    muscularBuild: 1.0,
    skinTone: '#8d5524',
    hairColor: '#1a1a1a',
    hairStyle: 'Wind-blown Shorn',
    facialHair: 'Trimmed Stubble',
    eyeColor: '#2b9348',
    scars: 'Claw Rakes',
    culturalMarkings: 'Sylvan Chloromarkings'
  },
  {
    name: 'Astrid Tidebreaker',
    title: 'Sunken Solarwarden',
    origin: 'ashen_reefbound' as PlayableOrigin,
    archetype: 'solarwarden' as CombatArchetype,
    spec: 'dawn_sentinel' as ClassSpecialization,
    bodyType: 'feminine' as const,
    height: 1.06,
    muscularBuild: 1.1,
    skinTone: '#c68642',
    hairColor: '#e9ecef',
    hairStyle: 'Citadel High Knot',
    facialHair: 'None',
    eyeColor: '#4ea8de',
    scars: 'Battle Grazed',
    culturalMarkings: 'Tidal Wave Runes'
  }
];

export const CharacterCreatorModal: React.FC<CharacterCreatorModalProps> = ({
  isOpen,
  onClose,
  currentAppearance,
  currentAttributes,
  currentArchetype,
  currentSpecialization,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('origin');
  const [appearance, setAppearance] = useState<CharacterAppearance>({ 
    ...currentAppearance,
    origin: currentAppearance.origin || 'sol_vaelen',
    voiceProfile: currentAppearance.voiceProfile || 'confident',
    bodyType: currentAppearance.bodyType || 'masculine',
    height: currentAppearance.height || 1.0,
    muscularBuild: currentAppearance.muscularBuild || 1.0,
    faceShape: currentAppearance.faceShape || 'Angular Highborne',
    jawWidth: currentAppearance.jawWidth || 1.0,
    eyeShape: currentAppearance.eyeShape || 'Almond',
    fantasyEyeGlow: currentAppearance.fantasyEyeGlow ?? true,
    freckles: currentAppearance.freckles ?? false,
    scars: currentAppearance.scars || 'Sun Scar',
    birthmarks: currentAppearance.birthmarks || 'None',
    culturalMarkings: currentAppearance.culturalMarkings || 'Citadel Solar Glyphs',
    facialHair: currentAppearance.facialHair || 'Trimmed Stubble',
    facialHairColor: currentAppearance.facialHairColor || '#3d2b1f'
  });
  const [selectedArchetype, setSelectedArchetype] = useState<CombatArchetype>(currentArchetype);
  const [selectedSpec, setSelectedSpec] = useState<ClassSpecialization>(
    currentSpecialization || CLASS_DETAILS[currentArchetype].specializations[0].id
  );
  const [attributes, setAttributes] = useState<CharacterAttributes>({ ...currentAttributes });

  const [previewLighting, setPreviewLighting] = useState<'dawn' | 'noon' | 'eclipse'>('noon');

  if (!isOpen) return null;

  const handleArchetypeSelect = (archId: CombatArchetype) => {
    setSelectedArchetype(archId);
    const specs = CLASS_DETAILS[archId].specializations;
    setSelectedSpec(specs[0].id);

    // Baseline archetype attributes
    if (archId === 'vanguard') {
      setAttributes({ might: 16, vitality: 14, tenacity: 13, agility: 9, resonance: 8 });
    } else if (archId === 'spellblade') {
      setAttributes({ resonance: 16, might: 12, agility: 12, vitality: 10, tenacity: 10 });
    } else if (archId === 'shadowstrider') {
      setAttributes({ agility: 16, might: 13, vitality: 11, resonance: 10, tenacity: 10 });
    } else {
      setAttributes({ tenacity: 16, vitality: 15, might: 12, resonance: 11, agility: 8 });
    }
  };

  const handleAuditionVoice = () => {
    const profile = VOICE_PROFILES.find(p => p.id === appearance.voiceProfile) || VOICE_PROFILES[1];
    audioEngine.speakLine(
      profile.sampleLine,
      'player',
      profile.id,
      appearance.voicePitch
    );
  };

  const handleSave = () => {
    onSave(appearance, attributes, selectedArchetype, selectedSpec);
    onClose();
  };

  const handleApplyPreset = (preset: typeof HERO_PRESETS[0]) => {
    setAppearance(prev => ({
      ...prev,
      name: preset.name,
      origin: preset.origin,
      bodyType: preset.bodyType,
      height: preset.height,
      muscularBuild: preset.muscularBuild,
      skinTone: preset.skinTone,
      hairColor: preset.hairColor,
      hairStyle: preset.hairStyle,
      facialHair: preset.facialHair,
      eyeColor: preset.eyeColor,
      fantasyEyeGlow: true,
      scars: preset.scars,
      culturalMarkings: preset.culturalMarkings
    }));
    handleArchetypeSelect(preset.archetype);
    setSelectedSpec(preset.spec);
    audioEngine.playRelicSurge();
  };

  const handleRandomizeHero = () => {
    const origins: PlayableOrigin[] = ['sol_vaelen', 'ashen_reefbound', 'ironwood_weaver', 'umbral_pariah'];
    const archetypes: CombatArchetype[] = ['vanguard', 'spellblade', 'shadowstrider', 'solarwarden'];
    const randomOrigin = origins[Math.floor(Math.random() * origins.length)];
    const randomArchetype = archetypes[Math.floor(Math.random() * archetypes.length)];
    const specs = CLASS_DETAILS[randomArchetype].specializations;
    const randomSpec = specs[Math.floor(Math.random() * specs.length)].id;
    const randomSkin = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)];
    const randomHairCol = HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)];
    const randomHairStyle = HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)];
    const randomEye = EYE_COLORS[Math.floor(Math.random() * EYE_COLORS.length)];
    const randomBody = Math.random() > 0.5 ? 'masculine' : 'feminine';
    const randomHeight = parseFloat((0.92 + Math.random() * 0.22).toFixed(2));
    const randomBuild = parseFloat((0.85 + Math.random() * 0.35).toFixed(2));
    const randomScar = SCAR_OPTIONS[Math.floor(Math.random() * SCAR_OPTIONS.length)];
    const randomMarking = MARKING_OPTIONS[Math.floor(Math.random() * MARKING_OPTIONS.length)];
    const randomFacial = randomBody === 'masculine' ? FACIAL_HAIR_STYLES[Math.floor(Math.random() * FACIAL_HAIR_STYLES.length)] : 'None';
    
    const heroNames = [
      'Valerius Dawnseeker', 'Kaelen Vance', 'Morrigan Umbra', 'Lyra Sunchaser',
      'Rowan Ironwood', 'Astrid Reefcaller', 'Cassian Drake', 'Selene Vael',
      'Tarek Thorn', 'Yvaine Sol'
    ];
    const randomName = heroNames[Math.floor(Math.random() * heroNames.length)];

    setAppearance(prev => ({
      ...prev,
      name: randomName,
      origin: randomOrigin,
      bodyType: randomBody,
      height: randomHeight,
      muscularBuild: randomBuild,
      skinTone: randomSkin,
      hairColor: randomHairCol,
      hairStyle: randomHairStyle,
      facialHair: randomFacial,
      eyeColor: randomEye,
      fantasyEyeGlow: true,
      scars: randomScar,
      culturalMarkings: randomMarking
    }));

    handleArchetypeSelect(randomArchetype);
    setSelectedSpec(randomSpec);
    audioEngine.playRelicSurge();
  };

  const originInfo = PLAYABLE_ORIGINS[appearance.origin];
  const classInfo = CLASS_DETAILS[selectedArchetype];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-lg">
      <div className="relative w-full max-w-6xl h-[94vh] bg-neutral-950 border border-amber-500/40 rounded-2xl shadow-2xl flex flex-col text-neutral-100 overflow-hidden">
        {/* HEADER BAR */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-neutral-800 bg-neutral-900/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-amber-400 tracking-wider flex items-center gap-2">
                3D CHARACTER FORGE & SOUL ARCHETYPE
              </h2>
              <p className="text-xs text-neutral-400">
                Aethelgard: Echoes of the First Sun — Establish your origin, appearance, and combat discipline in 3D.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRandomizeHero}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold text-xs transition-all active:scale-95 shadow-sm"
              title="Randomize Appearance, Origin, and Class"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Randomize Hero</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-900 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 border border-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* QUICK PRESETS STRIP */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-2 bg-neutral-900/80 border-b border-neutral-800/80 text-xs">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-neutral-400 font-medium text-[11px] uppercase tracking-wider">Archetype Presets:</span>
            {HERO_PRESETS.map(preset => (
              <button
                key={preset.name}
                onClick={() => handleApplyPreset(preset)}
                className="px-2.5 py-1 rounded-lg bg-neutral-800/90 hover:bg-neutral-700 text-neutral-300 hover:text-amber-300 border border-neutral-700 transition-all text-xs flex items-center gap-1 active:scale-95"
              >
                <span className="font-semibold">{preset.title}</span>
              </button>
            ))}
          </div>
          <span className="text-[11px] font-mono text-neutral-500 hidden sm:inline">
            Interactive 3D Preview: Orbit [Mouse Drag] • Zoom [Scroll]
          </span>
        </div>

        {/* WORKBENCH BODY: Split View */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* LEFT 7 COLS: TABS & CUSTOMIZATION CONTROLS */}
          <div className="lg:col-span-7 flex flex-col border-r border-neutral-800/80 bg-neutral-950 overflow-hidden">
            {/* TABS HEADER */}
            <div className="flex items-center gap-1 px-4 py-2 bg-neutral-900/40 border-b border-neutral-800 overflow-x-auto scrollbar-none">
              {[
                { id: 'origin', label: 'Origin', icon: Compass },
                { id: 'body', label: 'Body', icon: User },
                { id: 'face', label: 'Face', icon: Eye },
                { id: 'hair', label: 'Hair', icon: Palette },
                { id: 'skin', label: 'Skin', icon: Sparkles },
                { id: 'markings', label: 'Markings', icon: Layers },
                { id: 'eyes', label: 'Eyes', icon: Sun },
                { id: 'voice', label: 'Voice', icon: Volume2 },
                { id: 'class', label: 'Class', icon: Swords },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      isActive 
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm' 
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT SCROLLABLE CONTAINER */}
            <div className="flex-1 p-5 overflow-y-auto space-y-5">
              {/* TAB 1: ORIGIN */}
              {activeTab === 'origin' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-amber-400 tracking-wide">CHOOSE YOUR ORIGIN</h3>
                    <p className="text-xs text-neutral-400">
                      Your cultural roots shape your dialogue reactions, starting cosmetic perks, and worldview. Does not lock your class.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(Object.keys(PLAYABLE_ORIGINS) as PlayableOrigin[]).map(originKey => {
                      const o = PLAYABLE_ORIGINS[originKey];
                      const isSelected = appearance.origin === originKey;
                      return (
                        <div
                          key={originKey}
                          onClick={() => setAppearance({ ...appearance, origin: originKey })}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-amber-500/10 border-amber-400 shadow-md scale-[1.01]' 
                              : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-amber-300">{o.name}</h4>
                            {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                          </div>
                          <p className="text-[11px] text-amber-400/80 italic mt-0.5">{o.tagline}</p>
                          <p className="text-[11px] text-neutral-400 mt-2 leading-relaxed">{o.culture}</p>
                          <div className="mt-2.5 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px]">
                            <span className="text-neutral-400 font-mono">Location: {o.startingLocation}</span>
                            <span className="text-emerald-400 font-medium">{o.statBonusSnippet}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {originInfo && (
                    <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs space-y-2">
                      <div className="font-semibold text-neutral-300">Origin Lore & Heritage</div>
                      <p className="text-neutral-400 text-xs leading-relaxed">{originInfo.history}</p>
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <span className="text-[11px] text-neutral-500">Starting Relics:</span>
                        {originInfo.cosmetics.map(c => (
                          <span key={c} className="px-2 py-0.5 rounded-full bg-neutral-800 text-[10px] text-amber-300 border border-amber-500/20">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: BODY */}
              {activeTab === 'body' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-amber-400 tracking-wide">PHYSIQUE & PROPORTIONS</h3>
                    <p className="text-xs text-neutral-400">Sculpt your survivor body structure and stature.</p>
                  </div>

                  <div>
                    <label className="text-xs text-neutral-400 block mb-1.5">Body Frame Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['masculine', 'feminine', 'androgynous'] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => setAppearance({ ...appearance, bodyType: type })}
                          className={`py-2 px-3 rounded-lg text-xs font-semibold capitalize border ${
                            appearance.bodyType === type 
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300' 
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-neutral-400 mb-1">
                      <span>Height Scaling</span>
                      <span className="font-mono text-amber-400">{Math.round(appearance.height * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.8"
                      max="1.2"
                      step="0.02"
                      value={appearance.height}
                      onChange={e => setAppearance({ ...appearance, height: parseFloat(e.target.value) })}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-neutral-400 mb-1">
                      <span>Muscular Build / Density</span>
                      <span className="font-mono text-amber-400">{Math.round(appearance.muscularBuild * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.75"
                      max="1.3"
                      step="0.05"
                      value={appearance.muscularBuild}
                      onChange={e => setAppearance({ ...appearance, muscularBuild: parseFloat(e.target.value) })}
                      className="w-full accent-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: FACE */}
              {activeTab === 'face' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-amber-400 tracking-wide">FACIAL STRUCTURE</h3>
                    <p className="text-xs text-neutral-400">Configure jawlines, bone contours, and features.</p>
                  </div>

                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">Face Shape Contour</label>
                    <div className="grid grid-cols-2 gap-2">
                      {FACE_SHAPES.map(shape => (
                        <button
                          key={shape}
                          onClick={() => setAppearance({ ...appearance, faceShape: shape })}
                          className={`py-2 px-3 rounded-lg text-xs font-medium border text-left ${
                            appearance.faceShape === shape 
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300' 
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          {shape}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-neutral-400 mb-1">
                      <span>Jawline Width & Poise</span>
                      <span className="font-mono text-amber-400">{Math.round(appearance.jawWidth * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.75"
                      max="1.25"
                      step="0.05"
                      value={appearance.jawWidth}
                      onChange={e => setAppearance({ ...appearance, jawWidth: parseFloat(e.target.value) })}
                      className="w-full accent-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: HAIR */}
              {activeTab === 'hair' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-amber-400 tracking-wide">HAIRSTYLE & BEARD</h3>
                    <p className="text-xs text-neutral-400">Select weaves, citadel crowns, and facial grooming.</p>
                  </div>

                  <div>
                    <label className="text-xs text-neutral-400 block mb-1.5">Hairstyle</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {HAIR_STYLES.map(style => (
                        <button
                          key={style}
                          onClick={() => setAppearance({ ...appearance, hairStyle: style })}
                          className={`py-2 px-2.5 rounded-lg text-xs font-medium border text-center truncate ${
                            appearance.hairStyle === style 
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300' 
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-neutral-400 block mb-1.5">Hair Color</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {HAIR_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => setAppearance({ ...appearance, hairColor: color })}
                          className={`w-7 h-7 rounded-full border-2 transition-transform ${
                            appearance.hairColor === color ? 'border-amber-400 scale-110' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-neutral-400 block mb-1.5">Facial Hair Style</label>
                    <div className="grid grid-cols-3 gap-2">
                      {FACIAL_HAIR_STYLES.map(style => (
                        <button
                          key={style}
                          onClick={() => setAppearance({ ...appearance, facialHair: style })}
                          className={`py-1.5 px-2 rounded-lg text-xs border truncate ${
                            appearance.facialHair === style 
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300' 
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: SKIN & SCARS */}
              {activeTab === 'skin' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-amber-400 tracking-wide">SKIN COMPLEXION & BATTLE SCARS</h3>
                    <p className="text-xs text-neutral-400">Weathered tones and scars of the great cataclysm.</p>
                  </div>

                  <div>
                    <label className="text-xs text-neutral-400 block mb-1.5">Skin Tone</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {SKIN_TONES.map(color => (
                        <button
                          key={color}
                          onClick={() => setAppearance({ ...appearance, skinTone: color })}
                          className={`w-7 h-7 rounded-full border-2 transition-transform ${
                            appearance.skinTone === color ? 'border-amber-400 scale-110' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-neutral-400 block mb-1.5">Battle Scars</label>
                    <div className="grid grid-cols-3 gap-2">
                      {SCAR_OPTIONS.map(scar => (
                        <button
                          key={scar}
                          onClick={() => setAppearance({ ...appearance, scars: scar })}
                          className={`py-1.5 px-2 rounded-lg text-xs border ${
                            appearance.scars === scar 
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300' 
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                          }`}
                        >
                          {scar}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="chk_freckles"
                      checked={appearance.freckles}
                      onChange={e => setAppearance({ ...appearance, freckles: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    <label htmlFor="chk_freckles" className="text-xs text-neutral-300 cursor-pointer">
                      Enable sun-flecked freckles across cheekbones
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 6: MARKINGS */}
              {activeTab === 'markings' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-amber-400 tracking-wide">CULTURAL & MAGICAL MARKINGS</h3>
                    <p className="text-xs text-neutral-400">Runes etched with solar ink or void-tainted blood.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {MARKING_OPTIONS.map(mark => (
                      <button
                        key={mark}
                        onClick={() => setAppearance({ ...appearance, culturalMarkings: mark })}
                        className={`p-2.5 rounded-lg text-xs font-medium border text-left ${
                          appearance.culturalMarkings === mark 
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300' 
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        {mark}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 7: EYES */}
              {activeTab === 'eyes' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-amber-400 tracking-wide">OCULAR RESONANCE & GLOW</h3>
                    <p className="text-xs text-neutral-400">The windows to your aether-bound soul.</p>
                  </div>

                  <div>
                    <label className="text-xs text-neutral-400 block mb-1.5">Iris Color</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {EYE_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => setAppearance({ ...appearance, eyeColor: color })}
                          className={`w-7 h-7 rounded-full border-2 transition-transform ${
                            appearance.eyeColor === color ? 'border-amber-400 scale-110' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="chk_eyeglow"
                      checked={appearance.fantasyEyeGlow}
                      onChange={e => setAppearance({ ...appearance, fantasyEyeGlow: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    <label htmlFor="chk_eyeglow" className="text-xs text-amber-300 cursor-pointer flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Primordial Solar Luminescence (Eye Glow Effect)
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 8: VOICE */}
              {activeTab === 'voice' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-amber-400 tracking-wide">ORIGINAL VOCAL PROFILES</h3>
                    <p className="text-xs text-neutral-400">Select a vocal timbre synthesized with realistic cadence and tone.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {VOICE_PROFILES.map(v => {
                      const isSelected = appearance.voiceProfile === v.id;
                      return (
                        <div
                          key={v.id}
                          onClick={() => setAppearance({ ...appearance, voiceProfile: v.id })}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-amber-500/15 border-amber-400 shadow-md' 
                              : 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-neutral-200">{v.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                          </div>
                          <p className="text-[11px] text-neutral-400 mt-1">{v.description}</p>
                          <p className="text-[10px] text-amber-400/80 font-mono mt-1.5">"{v.sampleLine}"</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleAuditionVoice}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-transform active:scale-95 shadow-md"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Audition Voice Line</span>
                    </button>
                    <span className="text-xs text-neutral-400">Uses Web Speech synthesizer in your browser.</span>
                  </div>
                </div>
              )}

              {/* TAB 9: CLASS & SPECIALIZATION */}
              {activeTab === 'class' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-semibold text-amber-400 tracking-wide">COMBAT ARCHETYPE & PROGRESSION</h3>
                    <p className="text-xs text-neutral-400">
                      Choose your launch discipline and preview your specialization advancement tree.
                    </p>
                  </div>

                  {/* 4 Class Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {(Object.keys(CLASS_DETAILS) as CombatArchetype[]).map(archKey => {
                      const c = CLASS_DETAILS[archKey];
                      const isSelected = selectedArchetype === archKey;
                      const Icon = archKey === 'vanguard' ? Shield : archKey === 'spellblade' ? Flame : archKey === 'shadowstrider' ? Wind : Zap;
                      return (
                        <button
                          key={archKey}
                          onClick={() => handleArchetypeSelect(archKey)}
                          className={`p-3 rounded-xl border flex flex-col items-center text-center gap-2 transition-all ${
                            isSelected 
                              ? 'bg-amber-500/20 border-amber-400 shadow-md scale-105' 
                              : 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-neutral-400'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-neutral-200">{c.name}</div>
                            <div className="text-[10px] text-amber-400/80">{c.primaryRole}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Class Fantasy & Mechanics */}
                  <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">{classInfo.name} — {classInfo.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-amber-400 border border-amber-500/30">
                        Difficulty: {classInfo.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">{classInfo.fantasy}</p>
                    <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
                      <span className="text-neutral-500 text-[11px]">Weapons:</span>
                      {classInfo.weapons.map(w => (
                        <span key={w} className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[11px] border border-neutral-700">
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* SPECIALIZATION ROADMAP */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-amber-400 tracking-wider">SPECIALIZATION ROADMAP</h4>
                      <span className="text-[10px] text-neutral-500">Unlocks at Level 10+</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {classInfo.specializations.map(spec => {
                        const isSpecSelected = selectedSpec === spec.id;
                        return (
                          <div
                            key={spec.id}
                            onClick={() => setSelectedSpec(spec.id)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all ${
                              isSpecSelected 
                                ? 'bg-amber-500/15 border-amber-400 shadow' 
                                : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-amber-300">{spec.name}</span>
                              {isSpecSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                            </div>
                            <p className="text-[11px] text-neutral-400 mt-1">{spec.description}</p>
                            <div className="mt-2 pt-2 border-t border-neutral-800/80">
                              <div className="text-[10px] text-neutral-500">Signature Perk:</div>
                              <div className="text-[10px] font-semibold text-emerald-400">{spec.keyAbility}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* BOTTOM ACTION BAR */}
            <div className="px-6 py-3.5 border-t border-neutral-800 bg-neutral-900/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">Name:</span>
                <input
                  type="text"
                  value={appearance.name}
                  onChange={e => setAppearance({ ...appearance, name: e.target.value })}
                  placeholder="Enter hero name..."
                  className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs focus:border-amber-400 outline-none w-36 sm:w-44"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-xl border border-neutral-700 hover:bg-neutral-800 text-neutral-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs tracking-wider transition-all hover:scale-105 shadow-lg shadow-amber-500/20"
                >
                  <span>CONFIRM & FORGE HERO</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT 5 COLS: FULL INTERACTIVE 3D PREVIEW STAGE */}
          <div className="lg:col-span-5 flex flex-col bg-neutral-950/90 relative p-3">
            <CharacterForge3D
              appearance={appearance}
              archetype={selectedArchetype}
              specialization={selectedSpec}
              lightingPreset={previewLighting}
              className="w-full h-full min-h-[480px]"
            />

            {/* CHARACTER SUMMARY BADGE */}
            <div className="px-5 py-3 border-t border-neutral-800/80 bg-neutral-900/50 backdrop-blur-md flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-neutral-100">{appearance.name || 'Unnamed Hero'}</div>
                <div className="text-[10px] text-amber-400 font-mono">
                  {originInfo?.name.split(' (')[0]} • {classInfo?.name} ({selectedSpec.replace('_', ' ')})
                </div>
              </div>
              <button
                onClick={handleAuditionVoice}
                className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 transition-colors"
                title="Audition Voice"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
