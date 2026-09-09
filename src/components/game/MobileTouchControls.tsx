import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Swords, 
  Shield, 
  Zap, 
  Sparkles, 
  Target, 
  MessageSquare, 
  Compass, 
  Flame, 
  Maximize2,
  ChevronRight,
  Footprints
} from 'lucide-react';
import { CombatArchetype } from '../../types/game';

export interface JoystickVector {
  x: number;       // -1 (left) to 1 (right)
  y: number;       // -1 (down) to 1 (up/forward)
  magnitude: number; // 0 to 1
  isSprint: boolean;
}

interface MobileTouchControlsProps {
  archetype: CombatArchetype;
  playerStamina: number;
  maxPlayerStamina: number;
  playerAether: number;
  maxPlayerAether: number;
  nearbyNpcName?: string | null;
  nearbyNpcRole?: string | null;
  softLockActive: boolean;
  attackCombo: number;
  skillCooldownPct: number; // 0 (ready) to 1 (full cooldown)
  skillCooldownSec: number;
  isAttacking: boolean;
  isDodging: boolean;
  isParrying: boolean;
  onJoystickMove: (vector: JoystickVector) => void;
  onCameraDrag: (deltaX: number, deltaY: number) => void;
  onAttack: () => void;
  onParry: () => void;
  onDodge: () => void;
  onSkill: () => void;
  onToggleTargetLock: () => void;
  onInteract: () => void;
}

export const MobileTouchControls: React.FC<MobileTouchControlsProps> = ({
  archetype,
  playerStamina,
  maxPlayerStamina,
  playerAether,
  maxPlayerAether,
  nearbyNpcName,
  nearbyNpcRole,
  softLockActive,
  attackCombo,
  skillCooldownPct,
  skillCooldownSec,
  isAttacking,
  isDodging,
  isParrying,
  onJoystickMove,
  onCameraDrag,
  onAttack,
  onParry,
  onDodge,
  onSkill,
  onToggleTargetLock,
  onInteract
}) => {
  // Joystick UI State
  const [joystickActive, setJoystickActive] = useState(false);
  const [thumbPos, setThumbPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [sprintToggle, setSprintToggle] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);

  // Tracking touch identifiers
  const joystickTouchIdRef = useRef<number | null>(null);
  const joystickOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraTouchIdRef = useRef<number | null>(null);
  const cameraLastPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const sprintToggleRef = useRef(sprintToggle);
  sprintToggleRef.current = sprintToggle;

  // Max displacement radius for joystick thumb in pixels
  const JOYSTICK_MAX_RADIUS = 52;
  const JOYSTICK_DEAD_ZONE = 7;

  // Check device orientation
  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Class Awakened Skill Name
  const skillName = 
    archetype === 'vanguard' ? 'CLEAVE' :
    archetype === 'spellblade' ? 'AETHER' :
    archetype === 'shadowstrider' ? 'FLURRY' : 'AEGIS';

  // Can afford stamina/aether actions
  const hasStaminaForAttack = playerStamina >= 15;
  const hasStaminaForParry = playerStamina >= 20;
  const hasStaminaForDodge = playerStamina >= 22;
  const hasAetherForSkill = playerAether >= 30 && skillCooldownPct <= 0.05;

  // Reset Joystick
  const resetJoystick = useCallback(() => {
    joystickTouchIdRef.current = null;
    setJoystickActive(false);
    setThumbPos({ x: 0, y: 0 });
    onJoystickMove({ x: 0, y: 0, magnitude: 0, isSprint: sprintToggleRef.current });
  }, [onJoystickMove]);

  // Touch Handlers for Virtual Joystick Area
  const handleJoystickTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (joystickTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    if (!touch) return;

    joystickTouchIdRef.current = touch.identifier;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    joystickOriginRef.current = { x: centerX, y: centerY };

    setJoystickActive(true);

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist < JOYSTICK_DEAD_ZONE) {
      setThumbPos({ x: 0, y: 0 });
      onJoystickMove({ x: 0, y: 0, magnitude: 0, isSprint: sprintToggleRef.current });
      return;
    }

    const clampedDist = Math.min(dist, JOYSTICK_MAX_RADIUS);
    const normX = dx / dist;
    const normY = dy / dist;
    const thumbX = normX * clampedDist;
    const thumbY = normY * clampedDist;
    setThumbPos({ x: thumbX, y: thumbY });

    const magnitude = clampedDist / JOYSTICK_MAX_RADIUS;
    const joyX = normX * magnitude;
    const joyY = -normY * magnitude; // Up is positive Y
    const isAutoSprint = joyY > 0.82 || sprintToggleRef.current;

    onJoystickMove({ x: joyX, y: joyY, magnitude, isSprint: isAutoSprint });
  }, [JOYSTICK_DEAD_ZONE, JOYSTICK_MAX_RADIUS, onJoystickMove]);

  const handleJoystickTouchMove = useCallback((e: TouchEvent) => {
    if (joystickTouchIdRef.current === null) return;
    let currentTouch: Touch | null = null;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchIdRef.current) {
        currentTouch = e.changedTouches[i];
        break;
      }
    }
    if (!currentTouch) return;

    const dx = currentTouch.clientX - joystickOriginRef.current.x;
    const dy = currentTouch.clientY - joystickOriginRef.current.y;
    const dist = Math.hypot(dx, dy);

    if (dist < JOYSTICK_DEAD_ZONE) {
      setThumbPos({ x: 0, y: 0 });
      onJoystickMove({ x: 0, y: 0, magnitude: 0, isSprint: sprintToggleRef.current });
      return;
    }

    const clampedDist = Math.min(dist, JOYSTICK_MAX_RADIUS);
    const normX = dx / dist;
    const normY = dy / dist;
    const thumbX = normX * clampedDist;
    const thumbY = normY * clampedDist;
    setThumbPos({ x: thumbX, y: thumbY });

    const magnitude = clampedDist / JOYSTICK_MAX_RADIUS;
    const joyX = normX * magnitude;
    const joyY = -normY * magnitude;
    const isAutoSprint = (joyY > 0.82 && magnitude > 0.85) || sprintToggleRef.current;

    onJoystickMove({ x: joyX, y: joyY, magnitude, isSprint: isAutoSprint });
  }, [JOYSTICK_DEAD_ZONE, JOYSTICK_MAX_RADIUS, onJoystickMove]);

  const handleJoystickTouchEnd = useCallback((e: TouchEvent) => {
    if (joystickTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchIdRef.current) {
        resetJoystick();
        break;
      }
    }
  }, [resetJoystick]);

  // Touch Handlers for Mobile Camera Drag Area
  const handleCameraTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (cameraTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    if (!touch) return;

    cameraTouchIdRef.current = touch.identifier;
    cameraLastPosRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleCameraTouchMove = useCallback((e: TouchEvent) => {
    if (cameraTouchIdRef.current === null) return;
    let currentTouch: Touch | null = null;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === cameraTouchIdRef.current) {
        currentTouch = e.changedTouches[i];
        break;
      }
    }
    if (!currentTouch) return;

    const dx = currentTouch.clientX - cameraLastPosRef.current.x;
    const dy = currentTouch.clientY - cameraLastPosRef.current.y;
    cameraLastPosRef.current = { x: currentTouch.clientX, y: currentTouch.clientY };

    onCameraDrag(dx, dy);
  }, [onCameraDrag]);

  const handleCameraTouchEnd = useCallback((e: TouchEvent) => {
    if (cameraTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === cameraTouchIdRef.current) {
        cameraTouchIdRef.current = null;
        break;
      }
    }
  }, []);

  // Global touch listeners to ensure drag doesn't drop when finger moves outside element
  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      handleJoystickTouchMove(e);
      handleCameraTouchMove(e);
    };

    const onTouchEnd = (e: TouchEvent) => {
      handleJoystickTouchEnd(e);
      handleCameraTouchEnd(e);
    };

    const onTouchCancel = (e: TouchEvent) => {
      handleJoystickTouchEnd(e);
      handleCameraTouchEnd(e);
    };

    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchCancel);

    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [handleJoystickTouchMove, handleCameraTouchMove, handleJoystickTouchEnd, handleCameraTouchEnd]);

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30 overflow-hidden font-sans">
      {/* 1. PORTRAIT ORIENTATION ADVISORY BANNER */}
      {isPortrait && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-auto bg-neutral-950/90 border border-amber-500/60 rounded-xl px-4 py-2 shadow-2xl backdrop-blur-md flex items-center gap-2 max-w-xs text-center animate-pulse">
          <Maximize2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-[11px] font-semibold text-amber-200">
            Rotate device to Landscape for optimal combat control reach
          </span>
        </div>
      )}

      {/* 2. CAMERA TOUCH DRAG ZONE (Upper and Right Half of Viewport) */}
      <div
        className="absolute top-0 right-0 w-full md:w-3/5 h-full pointer-events-auto opacity-0"
        style={{ touchAction: 'none' }}
        onTouchStart={handleCameraTouchStart}
      />

      {/* 3. VIRTUAL ANALOG JOYSTICK (Bottom Left) */}
      <div 
        className="absolute bottom-6 left-6 pointer-events-auto"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          paddingLeft: 'env(safe-area-inset-left, 16px)',
          touchAction: 'none'
        }}
      >
        <div className="relative flex flex-col items-center">
          {/* Sprint Toggle Option */}
          <button
            onClick={() => {
              const next = !sprintToggle;
              setSprintToggle(next);
              sprintToggleRef.current = next;
            }}
            onTouchStart={(e) => e.stopPropagation()}
            className={`mb-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border transition-all flex items-center gap-1.5 shadow-md ${
              sprintToggle 
                ? 'bg-amber-500 text-neutral-950 border-amber-300 shadow-amber-500/30 scale-105' 
                : 'bg-neutral-950/80 text-neutral-400 border-neutral-800'
            }`}
          >
            <Footprints className="w-3 h-3" />
            <span>{sprintToggle ? 'SPRINT ON' : 'SPRINT'}</span>
          </button>

          {/* Joystick Base Ring */}
          <div
            className={`relative w-36 h-36 rounded-full border-2 transition-colors flex items-center justify-center backdrop-blur-sm ${
              joystickActive
                ? 'bg-neutral-950/60 border-amber-400/70 shadow-lg shadow-amber-500/20'
                : 'bg-neutral-950/40 border-neutral-700/60'
            }`}
            onTouchStart={handleJoystickTouchStart}
          >
            {/* Inner sprint threshold ring */}
            <div className="absolute w-24 h-24 rounded-full border border-dashed border-amber-500/25 pointer-events-none" />

            {/* Directional ticks */}
            <div className="absolute top-1.5 w-1.5 h-1.5 rounded-full bg-amber-400/40 pointer-events-none" />
            <div className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-neutral-600/40 pointer-events-none" />
            <div className="absolute left-1.5 w-1.5 h-1.5 rounded-full bg-neutral-600/40 pointer-events-none" />
            <div className="absolute right-1.5 w-1.5 h-1.5 rounded-full bg-neutral-600/40 pointer-events-none" />

            {/* Movable Thumb Knob */}
            <div
              className={`w-14 h-14 rounded-full border flex items-center justify-center pointer-events-none shadow-xl transition-transform ${
                joystickActive
                  ? 'bg-gradient-to-br from-amber-400 to-amber-700 border-amber-300 scale-105'
                  : 'bg-neutral-900/80 border-neutral-600'
              }`}
              style={{
                transform: `translate(${thumbPos.x}px, ${thumbPos.y}px)`,
                transition: joystickActive ? 'none' : 'transform 0.15s ease-out'
              }}
            >
              <div className={`w-3.5 h-3.5 rounded-full ${joystickActive ? 'bg-neutral-950' : 'bg-amber-400/60'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* 4. CONTEXTUAL NPC / OBJECT INTERACTION (Right Center Above Combat Cluster) */}
      {nearbyNpcName && (
        <div 
          className="absolute bottom-48 right-6 z-40 pointer-events-auto"
          style={{
            paddingRight: 'env(safe-area-inset-right, 16px)'
          }}
        >
          <button
            onClick={onInteract}
            onTouchStart={(e) => {
              e.stopPropagation();
              onInteract();
            }}
            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 text-neutral-950 font-black text-xs tracking-wider shadow-2xl border border-amber-300 active:scale-95 transition-transform"
          >
            <MessageSquare className="w-5 h-5 animate-pulse" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-neutral-950 uppercase font-mono font-bold leading-tight">
                {nearbyNpcRole || 'CAMP RESIDENT'}
              </span>
              <span className="text-xs font-black">
                TALK WITH {nearbyNpcName.split(' ')[0]}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* 5. COMBAT ACTION CLUSTER (Bottom Right) */}
      <div
        className="absolute bottom-6 right-6 pointer-events-auto"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          paddingRight: 'env(safe-area-inset-right, 16px)',
          touchAction: 'manipulation'
        }}
      >
        <div className="relative w-64 h-64 flex items-center justify-center">
          {/* Target Soft-Lock Toggle (Top-Center of Cluster) */}
          <button
            onClick={onToggleTargetLock}
            onTouchStart={(e) => {
              e.stopPropagation();
              onToggleTargetLock();
            }}
            className={`absolute top-0 right-16 w-11 h-11 rounded-full flex flex-col items-center justify-center border transition-all active:scale-90 shadow-md ${
              softLockActive
                ? 'bg-amber-500 border-amber-300 text-neutral-950 shadow-amber-500/40 scale-105'
                : 'bg-neutral-950/80 border-neutral-700 text-neutral-400'
            }`}
            title="Toggle Target Lock"
          >
            <Target className="w-4 h-4" />
            <span className="text-[8px] font-bold uppercase mt-0.5">LOCK</span>
          </button>

          {/* Awakened Class Skill (Top Left of Attack) */}
          <button
            onClick={onSkill}
            onTouchStart={(e) => {
              e.stopPropagation();
              onSkill();
            }}
            disabled={!hasAetherForSkill}
            className={`absolute top-4 left-4 w-14 h-14 rounded-2xl flex flex-col items-center justify-center border transition-all active:scale-90 shadow-lg ${
              hasAetherForSkill
                ? 'bg-gradient-to-br from-indigo-700 to-indigo-950 border-indigo-400 text-indigo-100 shadow-indigo-500/30'
                : 'bg-neutral-950/70 border-neutral-800 text-neutral-500 opacity-60'
            }`}
            title={`Awakened Skill: ${skillName} (30 Aether)`}
          >
            {skillCooldownSec > 0 ? (
              <span className="text-sm font-black font-mono text-amber-300">
                {Math.ceil(skillCooldownSec)}s
              </span>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-indigo-300" />
                <span className="text-[9px] font-black uppercase tracking-tight mt-0.5">
                  {skillName}
                </span>
              </>
            )}
            {/* Radial / Border Cooldown overlay */}
            {skillCooldownPct > 0 && (
              <div 
                className="absolute inset-0 rounded-2xl bg-black/50 pointer-events-none flex items-center justify-center"
                style={{ opacity: skillCooldownPct }}
              />
            )}
          </button>

          {/* Defensive Parry Button (Top-Right of Attack) */}
          <button
            onClick={onParry}
            onTouchStart={(e) => {
              e.stopPropagation();
              onParry();
            }}
            disabled={!hasStaminaForParry}
            className={`absolute top-4 right-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center border transition-all active:scale-90 shadow-lg ${
              isParrying
                ? 'bg-sky-400 border-sky-200 text-neutral-950 scale-105 shadow-sky-500/40'
                : hasStaminaForParry
                ? 'bg-gradient-to-br from-sky-900/90 to-neutral-950 border-sky-500/70 text-sky-200 shadow-sky-900/30'
                : 'bg-neutral-950/70 border-neutral-800 text-neutral-600 opacity-50'
            }`}
            title="Timed Parry / Deflection"
          >
            <Shield className="w-5 h-5 text-sky-400" />
            <span className="text-[9px] font-bold uppercase mt-0.5">PARRY</span>
          </button>

          {/* Dodge Roll Button (Left of Attack) */}
          <button
            onClick={onDodge}
            onTouchStart={(e) => {
              e.stopPropagation();
              onDodge();
            }}
            disabled={!hasStaminaForDodge}
            className={`absolute bottom-4 left-4 w-14 h-14 rounded-2xl flex flex-col items-center justify-center border transition-all active:scale-90 shadow-lg ${
              isDodging
                ? 'bg-emerald-400 border-emerald-200 text-neutral-950 scale-105 shadow-emerald-500/40'
                : hasStaminaForDodge
                ? 'bg-gradient-to-br from-emerald-950 to-neutral-950 border-emerald-600/70 text-emerald-200 shadow-emerald-900/30'
                : 'bg-neutral-950/70 border-neutral-800 text-neutral-600 opacity-50'
            }`}
            title="Directional Dodge Roll"
          >
            <Zap className="w-5 h-5 text-emerald-400" />
            <span className="text-[9px] font-bold uppercase mt-0.5">DODGE</span>
          </button>

          {/* PRIMARY ATTACK BUTTON (Large Center Sweet-Spot) */}
          <button
            onClick={onAttack}
            onTouchStart={(e) => {
              e.stopPropagation();
              onAttack();
            }}
            disabled={!hasStaminaForAttack}
            className={`absolute bottom-0 right-0 w-20 h-20 rounded-full flex flex-col items-center justify-center border-2 transition-all active:scale-90 shadow-2xl ${
              isAttacking
                ? 'bg-gradient-to-br from-amber-300 to-amber-500 border-white text-neutral-950 scale-95 shadow-amber-500/50'
                : hasStaminaForAttack
                ? 'bg-gradient-to-br from-amber-500 to-amber-700 border-amber-300 text-neutral-950 shadow-amber-500/30'
                : 'bg-neutral-950/80 border-neutral-700 text-neutral-600 opacity-50'
            }`}
            title="Basic Attack & 3-Hit Combo"
          >
            <Swords className="w-7 h-7" />
            <span className="text-[10px] font-black uppercase tracking-wider mt-0.5">
              ATTACK
            </span>
            {attackCombo > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-neutral-950 border border-amber-400 text-amber-300 font-mono text-[9px] font-black">
                {attackCombo}/3
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
