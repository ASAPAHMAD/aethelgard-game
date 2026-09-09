import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  Shield, 
  Heart, 
  Sword, 
  AlertTriangle, 
  CheckCircle2, 
  Trophy, 
  Sparkles, 
  Flame, 
  Droplets, 
  Compass, 
  Zap, 
  ArrowRight,
  Sun 
} from 'lucide-react';
import { DungeonSquadMember, Item, CombatArchetype } from '../../types/game';
import { CLASS_SPECIFIC_WEAPONS, ACT_ONE_RELICS } from '../../data/chapterOneQuests';
import { audioEngine } from '../../services/audioEngine';
import confetti from 'canvas-confetti';

interface DungeonSquadModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerArchetype?: CombatArchetype;
  onVictoryReward: (xp: number, item: Item) => void;
}

type DungeonStage = 'briefing' | 'wing1_machinery' | 'wing2_flooded' | 'miniboss_morvath' | 'finalboss_warden' | 'revelation' | 'victory';

export const DungeonSquadModal: React.FC<DungeonSquadModalProps> = ({
  isOpen,
  onClose,
  playerArchetype = 'vanguard',
  onVictoryReward
}) => {
  const [selectedRole, setSelectedRole] = useState<'tank' | 'healer' | 'dps'>('dps');
  const [stage, setStage] = useState<DungeonStage>('briefing');
  
  // Wing 1 Solar Machinery Nodes
  const [solarConduits, setSolarConduits] = useState<{ id: string; name: string; active: boolean }[]>([
    { id: 'c1', name: 'Alpha Solar Dynamo', active: false },
    { id: 'c2', name: 'Beta Resonant Crystal', active: false },
    { id: 'c3', name: 'Gamma Aether Turbine', active: false }
  ]);

  // Wing 2 Water Sluices
  const [sluicePuzzles, setSluicePuzzles] = useState<{ id: string; name: string; aligned: boolean }[]>([
    { id: 's1', name: 'North Aqueduct Gate', aligned: false },
    { id: 's2', name: 'Central Drainage Valve', aligned: false },
    { id: 's3', name: 'Inner Sanctuary Sluice', aligned: false }
  ]);

  // Boss Combat State
  const [bossHp, setBossHp] = useState<number>(3200);
  const [maxBossHp, setMaxBossHp] = useState<number>(3200);
  const [bossPhase, setBossPhase] = useState<number>(1);
  const [bossAction, setBossAction] = useState<string>('The Eclipse Warden harnesses dark starlight.');
  const [isTelegraphing, setIsTelegraphing] = useState<boolean>(false);
  const [telegraphTimer, setTelegraphTimer] = useState<number>(0);
  const [isStaggered, setIsStaggered] = useState<boolean>(false);
  const [staggerTimer, setStaggerTimer] = useState<number>(0);
  const [battleLog, setBattleLog] = useState<string[]>([]);

  // Squad Members
  const [squad, setSquad] = useState<DungeonSquadMember[]>([
    { name: 'Kaelen Drake', role: 'tank', archetype: 'vanguard', hp: 950, maxHp: 950, status: 'Holding Threat' },
    { name: 'Archivist Maeve', role: 'healer', archetype: 'solarwarden', hp: 580, maxHp: 580, status: 'Channelling Mending' },
    { name: 'Lady Vespera', role: 'dps', archetype: 'spellblade', hp: 520, maxHp: 520, status: 'Weaving Storm Arc' },
    { name: 'Torian Stoneheart', role: 'dps', archetype: 'shadowstrider', hp: 650, maxHp: 650, status: 'Striking Vitals' }
  ]);

  if (!isOpen) return null;

  // Conduit Activation in Wing 1
  const activateConduit = (id: string) => {
    setSolarConduits(prev => prev.map(c => c.id === id ? { ...c, active: true } : c));
    audioEngine.playCastSpell();
    const updated = solarConduits.map(c => c.id === id ? true : c.active);
    if (updated.every(Boolean)) {
      audioEngine.playLevelUp();
    }
  };

  // Sluice Alignment in Wing 2
  const alignSluice = (id: string) => {
    setSluicePuzzles(prev => prev.map(s => s.id === id ? { ...s, aligned: true } : s));
    audioEngine.playBlock();
  };

  // Start Mini-Boss Morvath
  const startMorvath = () => {
    setStage('miniboss_morvath');
    setBossHp(1400);
    setMaxBossHp(1400);
    setBossPhase(1);
    setBattleLog(['Artificer Morvath bellows from the flooded platform! "You shall not awaken the Core!"']);
    audioEngine.setCombatMusic(true);
  };

  // Start Final Boss The Eclipse Warden
  const startWarden = () => {
    setStage('finalboss_warden');
    setBossHp(3600);
    setMaxBossHp(3600);
    setBossPhase(1);
    setBattleLog([
      'The ancient sanctum core groans as THE ECLIPSE WARDEN awakens!',
      'Tendrils of dark starlight envelop the sacred altar.'
    ]);
    audioEngine.setCombatMusic(true);
    audioEngine.playEclipseRoar();
  };

  // Telegraph Tick
  useEffect(() => {
    if (stage !== 'miniboss_morvath' && stage !== 'finalboss_warden') return;

    const timer = setInterval(() => {
      // Periodic Telegraph
      if (!isTelegraphing && !isStaggered && Math.random() < 0.25) {
        setIsTelegraphing(true);
        setTelegraphTimer(3);
        setBossAction('CRITICAL TELEGRAPH: Channeling Cataclysmic Nova! Interrupt now!');
      }

      // Decrement telegraph timer
      if (isTelegraphing) {
        setTelegraphTimer(prev => {
          if (prev <= 1) {
            // Nova detonates!
            setIsTelegraphing(false);
            setSquad(s => s.map(m => ({ ...m, hp: Math.max(80, m.hp - 180) })));
            audioEngine.playHit(true);
            setBattleLog(l => ['CATACLYSM DETONATED! The party took heavy shadow damage!', ...l.slice(0, 5)]);
            return 0;
          }
          return prev - 1;
        });
      }

      // Decrement stagger timer
      if (isStaggered) {
        setStaggerTimer(prev => {
          if (prev <= 1) {
            setIsStaggered(false);
            setBossAction('The boss recovers from stagger!');
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, isTelegraphing, isStaggered]);

  // Combat Actions
  const handlePlayerAction = (actionType: 'strike' | 'interrupt' | 'heal' | 'taunt') => {
    if (stage !== 'miniboss_morvath' && stage !== 'finalboss_warden') return;

    if (actionType === 'strike') {
      const multiplier = isStaggered ? 2.2 : 1.0;
      const baseDmg = Math.floor(Math.random() * 140) + 160;
      const dmg = Math.floor(baseDmg * multiplier);

      setBossHp(prev => {
        const next = Math.max(0, prev - dmg);
        
        // Phase Transitions for Warden
        if (stage === 'finalboss_warden') {
          if (next <= 1200 && bossPhase < 3) {
            setBossPhase(3);
            setBattleLog(l => ['PHASE 3 ENRAGE! The Eclipse Warden shatters reality with Shadow Torrent!', ...l.slice(0, 5)]);
            audioEngine.playEclipseRoar();
          } else if (next <= 2400 && bossPhase < 2) {
            setBossPhase(2);
            setBattleLog(l => ['PHASE 2: The Warden begins absorbing the First Sun\'s core!', ...l.slice(0, 5)]);
            audioEngine.playCastSpell();
          }
        }

        if (next === 0) {
          if (stage === 'miniboss_morvath') {
            audioEngine.playLevelUp();
            setBattleLog(l => ['Artificer Morvath defeated! The path to the Inner Vault opens.', ...l]);
            setTimeout(() => setStage('finalboss_warden'), 1500);
          } else {
            handleBossDefeated();
          }
        }
        return next;
      });

      audioEngine.playHit(true);
      setBattleLog(l => [`You strike for ${dmg} damage${isStaggered ? ' (CRITICAL STAGGER EXPLOIT!)' : ''}!`, ...l.slice(0, 5)]);

    } else if (actionType === 'interrupt') {
      if (isTelegraphing) {
        setIsTelegraphing(false);
        setIsStaggered(true);
        setStaggerTimer(5);
        setBossHp(prev => Math.max(0, prev - 300));
        audioEngine.playPerfectParry();
        setBattleLog(l => ['CRITICAL INTERRUPT! You shattered the cast! Boss is STAGGERED for 5s (Takes +120% Damage)!', ...l.slice(0, 5)]);
      } else {
        setBattleLog(l => ['No interruptible ability is currently being telegraphed.', ...l.slice(0, 5)]);
      }
    } else if (actionType === 'heal') {
      setSquad(s => s.map(m => ({ ...m, hp: Math.min(m.maxHp, m.hp + 200) })));
      audioEngine.playCastSpell();
      setBattleLog(l => ['You channel radiant solar warmth, restoring 200 HP to all squad members!', ...l.slice(0, 5)]);
    } else if (actionType === 'taunt') {
      audioEngine.playBlock();
      setBattleLog(l => ['You slam your weapon, forcing the boss to focus exclusively on you!', ...l.slice(0, 5)]);
    }
  };

  const handleBossDefeated = () => {
    audioEngine.setCombatMusic(false);
    audioEngine.playLevelUp();
    confetti({ particleCount: 150, spread: 90 });
    setStage('revelation');
  };

  const handleClaimFinalVictory = () => {
    const classWeapon = CLASS_SPECIFIC_WEAPONS[playerArchetype] || CLASS_SPECIFIC_WEAPONS.vanguard;
    const relic = ACT_ONE_RELICS[0];
    onVictoryReward(2500, classWeapon);
    setStage('victory');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-neutral-950 border border-blue-500/40 rounded-3xl shadow-2xl p-6 flex flex-col gap-6 text-neutral-100">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-mono tracking-widest text-blue-400 uppercase">
                CLIMAX DUNGEON • 5-PLAYER COOPERATIVE RAID
              </div>
              <h2 className="font-display text-2xl font-bold text-neutral-100 tracking-wide">
                The Sunken Sanctum of Eldir
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-900 text-neutral-400 hover:text-neutral-100 border border-neutral-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STAGE 1: BRIEFING */}
        {stage === 'briefing' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-neutral-900/70 border border-blue-500/30 space-y-3">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                Mission Objective
              </span>
              <h3 className="text-base font-bold text-neutral-100">
                Breach the Ancient Solar Vault
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                For millennia, the core altar of Eldir housed the dormant primary spark of the First Sun. Now, corrupted cultists under Archon Malakor have desecrated the sanctum, tapping into the spark to feed the Twilight Eclipse. You and your squad must restore the ancient solar machinery, drain the flooded aqueducts, and defeat the Eclipse Warden.
              </p>
            </div>

            {/* ROLE SELECTION */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold text-neutral-400 tracking-wider">
                CHOOSE YOUR SQUAD ROLE
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setSelectedRole('tank')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    selectedRole === 'tank' ? 'bg-blue-500/20 border-blue-400 ring-1 ring-blue-400' : 'bg-neutral-900 border-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                    <Shield className="w-4 h-4" />
                    <span>TANK</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Hold boss threat, absorb frontal shockwaves, and execute interrupts.
                  </p>
                </button>

                <button
                  onClick={() => setSelectedRole('healer')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    selectedRole === 'healer' ? 'bg-emerald-500/20 border-emerald-400 ring-1 ring-emerald-400' : 'bg-neutral-900 border-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <Heart className="w-4 h-4" />
                    <span>HEALER</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Radiate solar healing, cleanse void corruptions, and sustain allies.
                  </p>
                </button>

                <button
                  onClick={() => setSelectedRole('dps')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    selectedRole === 'dps' ? 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-400' : 'bg-neutral-900 border-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <Sword className="w-4 h-4" />
                    <span>DPS</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Burst down corrupt barriers, shatter poise, and trigger critical strikes.
                  </p>
                </button>
              </div>
            </div>

            {/* SQUAD LINEUP */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold text-neutral-400 tracking-wider">
                YOUR COOPERATIVE STRIKE TEAM
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {squad.map(member => (
                  <div key={member.name} className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs space-y-1">
                    <div className="font-bold text-neutral-200 truncate">{member.name}</div>
                    <div className="text-[10px] font-mono text-blue-400 uppercase">{member.role} • {member.archetype}</div>
                    <div className="text-[10px] text-neutral-400">{member.status}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setStage('wing1_machinery')}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 hover:from-blue-500 hover:to-blue-400 text-neutral-950 font-bold text-xs tracking-widest uppercase transition-all shadow-xl flex items-center justify-center gap-2"
              >
                <span>Enter Wing 1: Ancient Solar Machinery</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STAGE 2: WING 1 SOLAR MACHINERY */}
        {stage === 'wing1_machinery' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-neutral-900/70 border border-amber-500/30 space-y-2">
              <div className="text-[10px] font-mono text-amber-400 uppercase">Wing 1: The Machine Depths</div>
              <h3 className="text-base font-bold text-neutral-100">Restore Power to the Ancient Solar Conduits</h3>
              <p className="text-xs text-neutral-300">
                The blast doors leading deeper into the sanctum are locked behind ancient circuit relays. Activate all 3 resonant dynamos to route solar energy to the gate.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {solarConduits.map(c => (
                <div 
                  key={c.id} 
                  className={`p-4 rounded-2xl border transition-all ${
                    c.active ? 'bg-amber-500/15 border-amber-500/60' : 'bg-neutral-900/80 border-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <Zap className={`w-5 h-5 ${c.active ? 'text-amber-400' : 'text-neutral-500'}`} />
                    <span className="text-[10px] font-mono font-bold uppercase">
                      {c.active ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-neutral-200 mb-3">{c.name}</div>
                  <button
                    onClick={() => activateConduit(c.id)}
                    disabled={c.active}
                    className={`w-full py-2 rounded-lg text-xs font-bold transition-all ${
                      c.active 
                        ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                        : 'bg-amber-500 text-neutral-950 hover:bg-amber-400'
                    }`}
                  >
                    {c.active ? 'Calibrated' : 'Calibrate Node'}
                  </button>
                </div>
              ))}
            </div>

            {solarConduits.every(c => c.active) && (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
                <span>All 3 Solar Conduits humming with energy! The heavy hydraulic gates unseal.</span>
                <button
                  onClick={() => setStage('wing2_flooded')}
                  className="px-4 py-2 rounded-lg bg-emerald-500 text-neutral-950 font-bold hover:bg-emerald-400 text-xs"
                >
                  Proceed to Flooded Aqueducts →
                </button>
              </div>
            )}
          </div>
        )}

        {/* STAGE 3: WING 2 FLOODED RUINS */}
        {stage === 'wing2_flooded' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-neutral-900/70 border border-cyan-500/30 space-y-2">
              <div className="text-[10px] font-mono text-cyan-400 uppercase">Wing 2: The Flooded Aqueducts</div>
              <h3 className="text-base font-bold text-neutral-100">Drain the Submerged Sluice Channels</h3>
              <p className="text-xs text-neutral-300">
                Salt brine and void ichor have flooded the inner chamber. Align the 3 drainage sluice wheels to drain the water before entering the inner sanctum.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {sluicePuzzles.map(s => (
                <div 
                  key={s.id} 
                  className={`p-4 rounded-2xl border transition-all ${
                    s.aligned ? 'bg-cyan-500/15 border-cyan-500/60' : 'bg-neutral-900/80 border-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <Droplets className={`w-5 h-5 ${s.aligned ? 'text-cyan-400' : 'text-neutral-500'}`} />
                    <span className="text-[10px] font-mono font-bold uppercase">
                      {s.aligned ? 'DRAINED' : 'SUBMERGED'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-neutral-200 mb-3">{s.name}</div>
                  <button
                    onClick={() => alignSluice(s.id)}
                    disabled={s.aligned}
                    className={`w-full py-2 rounded-lg text-xs font-bold transition-all ${
                      s.aligned 
                        ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                        : 'bg-cyan-500 text-neutral-950 hover:bg-cyan-400'
                    }`}
                  >
                    {s.aligned ? 'Drained' : 'Open Sluice'}
                  </button>
                </div>
              ))}
            </div>

            {sluicePuzzles.every(s => s.aligned) && (
              <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 text-xs flex items-center justify-between">
                <span>The waters recede, exposing the central ceremonial dais! A corrupted silhouette emerges.</span>
                <button
                  onClick={startMorvath}
                  className="px-4 py-2 rounded-lg bg-cyan-500 text-neutral-950 font-bold hover:bg-cyan-400 text-xs"
                >
                  Confront Mini-Boss Morvath →
                </button>
              </div>
            )}
          </div>
        )}

        {/* STAGE 4 & 5: BOSS COMBAT (MORVATH OR THE ECLIPSE WARDEN) */}
        {(stage === 'miniboss_morvath' || stage === 'finalboss_warden') && (
          <div className="space-y-6">
            {/* BOSS HEALTH BAR */}
            <div className="p-5 rounded-2xl bg-neutral-900 border border-red-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-red-400 uppercase tracking-widest">
                    {stage === 'miniboss_morvath' ? 'MINI-BOSS ENCOUNTER' : `PHASE ${bossPhase} OF 3 • CLIMAX RAID BOSS`}
                  </span>
                  <h3 className="text-lg font-bold text-neutral-100">
                    {stage === 'miniboss_morvath' ? 'Artificer Morvath (The Corrupted Guardian)' : 'THE ECLIPSE WARDEN'}
                  </h3>
                </div>
                <div className="text-right font-mono text-xs text-neutral-400">
                  {bossHp} / {maxBossHp} HP
                </div>
              </div>

              {/* HEALTH METER */}
              <div className="w-full h-4 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                <div 
                  className={`h-full transition-all duration-300 ${
                    stage === 'miniboss_morvath' 
                      ? 'bg-gradient-to-r from-amber-600 to-red-500'
                      : bossPhase === 3
                        ? 'bg-gradient-to-r from-red-600 to-purple-600 animate-pulse'
                        : 'bg-gradient-to-r from-red-600 via-amber-500 to-red-600'
                  }`}
                  style={{ width: `${(bossHp / maxBossHp) * 100}%` }}
                />
              </div>

              {/* TELEGRAPH ALERT */}
              {isTelegraphing && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500 text-red-300 text-xs font-mono flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span>TELEGRAPH: Cataclysmic Void Nova charging ({telegraphTimer}s remaining)!</span>
                  </div>
                  <span className="font-bold uppercase tracking-wider text-amber-300">INTERRUPT NOW!</span>
                </div>
              )}

              {/* STAGGER ALERT */}
              {isStaggered && (
                <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500 text-amber-300 text-xs font-mono flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>BOSS STAGGERED! Vulnerable to critical damage for {staggerTimer}s!</span>
                </div>
              )}
            </div>

            {/* SQUAD STATUS */}
            <div className="grid grid-cols-4 gap-3">
              {squad.map(m => (
                <div key={m.name} className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-neutral-200">{m.name}</span>
                    <span className="text-neutral-400 font-mono">{m.hp}/{m.maxHp}</span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500" 
                      style={{ width: `${(m.hp / m.maxHp) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* ACTION CONTROLS */}
            <div className="grid grid-cols-4 gap-3 pt-2">
              <button
                onClick={() => handlePlayerAction('strike')}
                className="py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 font-bold text-xs text-neutral-950 tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Sword className="w-4 h-4" />
                <span>Weapon Strike</span>
              </button>

              <button
                onClick={() => handlePlayerAction('interrupt')}
                className={`py-3.5 px-4 rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 ${
                  isTelegraphing 
                    ? 'bg-amber-400 hover:bg-amber-300 text-neutral-950 animate-bounce ring-2 ring-amber-300' 
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Interrupt (Parry)</span>
              </button>

              <button
                onClick={() => handlePlayerAction('heal')}
                className="py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-bold text-xs text-neutral-950 tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Heart className="w-4 h-4" />
                <span>Squad Mending</span>
              </button>

              <button
                onClick={() => handlePlayerAction('taunt')}
                className="py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-bold text-xs text-neutral-950 tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                <span>Taunt & Guard</span>
              </button>
            </div>

            {/* COMBAT LOG */}
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-900 text-[11px] font-mono space-y-1 max-h-28 overflow-y-auto text-neutral-400">
              {battleLog.map((log, i) => (
                <div key={i} className={i === 0 ? 'text-amber-300 font-bold' : ''}>
                  • {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STAGE 6: THE FIRST SUN REVELATION */}
        {stage === 'revelation' && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 border border-amber-500 flex items-center justify-center">
              <Sun className="w-8 h-8 text-amber-400 animate-spin" style={{ animationDuration: '10s' }} />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-widest text-amber-400">
                ACT I CLIMAX REVELATION
              </span>
              <h3 className="text-2xl font-bold font-display text-neutral-100">
                THE MEMORY OF THE FIRST SUN
              </h3>
            </div>

            <div className="max-w-xl mx-auto p-5 rounded-2xl bg-neutral-900/80 border border-amber-500/30 text-left space-y-3 text-xs text-neutral-300 leading-relaxed">
              <p>
                As the Eclipse Warden collapses into ash, the crystal altar resonates with blinding golden warmth. A psychic echo washes over your consciousness:
              </p>
              <p className="italic text-amber-200 border-l-2 border-amber-500 pl-3">
                "The First Sun was not extinguished by natural cataclysm. It was shattered from within—deliberately fractured into twelve primeval embers by ancient architects seeking to hoard immortality."
              </p>
              <p>
                Archon Malakor is not seeking destruction; he is harvesting the remaining Sunstones to forge a black sun under his absolute dominion.
              </p>
              <p className="text-amber-400 font-semibold">
                Your bloodline possesses natural Aether attunement. You are the only one who can harmonize the remaining fragments and rekindle the First Sun.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleClaimFinalVictory}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-extrabold text-xs tracking-widest uppercase transition-all shadow-xl flex items-center justify-center gap-2"
              >
                <Trophy className="w-4 h-4" />
                <span>Claim Chapter I Victory & Rewards</span>
              </button>
            </div>
          </div>
        )}

        {/* STAGE 7: VICTORY & REWARDS */}
        {stage === 'victory' && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold font-display text-emerald-400">
                SUNKEN SANCTUM OF ELDIR CLEARED!
              </h3>
              <p className="text-xs text-neutral-400">
                You have defeated the Warden and recovered the first major fragment of the First Sun.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 max-w-md mx-auto space-y-2 text-xs text-left">
              <div className="font-bold text-neutral-200">Rewards Granted:</div>
              <div className="flex items-center justify-between text-amber-400">
                <span>• Experience Gained</span>
                <span>+2,500 XP</span>
              </div>
              <div className="flex items-center justify-between text-amber-400">
                <span>• Gold Reward</span>
                <span>+500 Gold</span>
              </div>
              <div className="flex items-center justify-between text-purple-400">
                <span>• Class-Specific Epic Weapon</span>
                <span>Delivered to Inventory</span>
              </div>
              <div className="flex items-center justify-between text-yellow-300">
                <span>• Legendary Relic</span>
                <span>Solar Heart of Eldir</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full py-3.5 px-6 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-100 font-bold text-xs tracking-wider uppercase transition-all"
              >
                Return to Echo Camp
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
