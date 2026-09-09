import React, { useState, useEffect } from 'react';
import { AnimationDebugInfo, CentralizedAnimationController } from '../../services/animationController';
import { Activity, Shield, Sword, Film, RefreshCw, ChevronDown, ChevronUp, Layers, AlertCircle, CheckCircle2, Globe } from 'lucide-react';

interface AnimationDebugHUDProps {
  controller: CentralizedAnimationController | null;
  isExternalGLB: boolean;
}

export const AnimationDebugHUD: React.FC<AnimationDebugHUDProps> = ({ controller, isExternalGLB }) => {
  const [debugInfo, setDebugInfo] = useState<AnimationDebugInfo | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  useEffect(() => {
    if (!controller) return;

    const handleUpdate = (info: AnimationDebugInfo) => {
      setDebugInfo({ ...info });
    };

    controller.addDebugListener(handleUpdate);
    return () => {
      controller.removeDebugListener(handleUpdate);
    };
  }, [controller]);

  // Keyboard shortcut toggle with F3
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        setIsExpanded(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!controller || !debugInfo) return null;

  const getModeBadge = () => {
    if (debugInfo.masterLoadingState === 'loaded') {
      const formatLabel = debugInfo.masterFormat ? debugInfo.masterFormat.toUpperCase() : 'GLB';
      return { 
        label: `Master Rig (${formatLabel})`, 
        color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
        dotColor: 'bg-emerald-400'
      };
    }
    if (debugInfo.masterLoadingState === 'loading') {
      return { 
        label: 'Loading Master Rig...', 
        color: 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse',
        dotColor: 'bg-amber-400'
      };
    }
    if (debugInfo.masterLoadingState === 'failed') {
      return { 
        label: 'Procedural (Master Failed)', 
        color: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
        dotColor: 'bg-rose-400'
      };
    }
    if (debugInfo.isFBXActive) {
      return { 
        label: 'Master Rigged FBX', 
        color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
        dotColor: 'bg-emerald-400'
      };
    }
    if (isExternalGLB) {
      return { 
        label: 'Rodin GLB Static', 
        color: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
        dotColor: 'bg-amber-400'
      };
    }
    return { 
      label: 'Procedural Hero', 
      color: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
      dotColor: 'bg-sky-400'
    };
  };

  const modeBadge = getModeBadge();

  return (
    <aside
      id="anim-debug-hud"
      aria-label="Animation Diagnostics"
      className="fixed top-16 right-4 z-40 max-w-xs text-xs font-mono select-none"
    >
      {/* Header bar / Minimize toggle */}
      <div 
        id="anim-debug-header"
        onClick={() => setIsExpanded(prev => !prev)}
        className="flex items-center justify-between px-3 py-1.5 bg-neutral-950/85 backdrop-blur-md border border-neutral-800 rounded-t cursor-pointer hover:bg-neutral-900/90 transition-colors shadow-lg"
      >
        <div className="flex items-center gap-1.5 text-neutral-300 font-semibold">
          <Activity className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
          <span>ANIMATION DEBUG</span>
          <span className="text-[10px] text-neutral-500 font-normal">[F3]</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`inline-block w-2 h-2 rounded-full ${modeBadge.dotColor}`} />
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-neutral-400" /> : <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />}
        </div>
      </div>

      {/* Expanded Panel */}
      {isExpanded && (
        <div 
          id="anim-debug-body"
          className="p-3 bg-neutral-950/90 backdrop-blur-md border-x border-b border-neutral-800 rounded-b shadow-2xl space-y-2.5 text-neutral-300"
        >
          {/* Active Model Pipeline Badge */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase text-neutral-500">Pipeline</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${modeBadge.color}`}>
              {modeBadge.label}
            </span>
          </div>

          {/* Master Rig Diagnostics (F3 Test Section) */}
          <div id="anim-debug-master-test" className="p-2 rounded bg-neutral-900/80 border border-neutral-800 space-y-1.5 text-[10px]">
            <div className="flex items-center justify-between font-semibold border-b border-neutral-800 pb-1 text-neutral-300">
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3 text-sky-400" />
                <span>RIGGED MASTER DIAGNOSTICS</span>
              </span>
              <span className={`px-1.5 py-0.5 rounded font-mono uppercase text-[9px] border ${
                debugInfo.masterLoadStatus === 'LOADED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                debugInfo.masterLoadStatus === 'LOADING' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse' :
                debugInfo.masterLoadStatus === 'ERROR' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
                'bg-neutral-800 text-neutral-400 border-neutral-700'
              }`}>
                {debugInfo.masterLoadStatus || debugInfo.masterLoadingState.toUpperCase()}
              </span>
            </div>

            {/* 1. Master Asset */}
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Master:</span>
              <span className="font-semibold text-emerald-400">{debugInfo.masterName || 'Breathing.Idle.fbx'}</span>
            </div>

            {/* 2. Master Load Status */}
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Master Load:</span>
              <span className={`font-bold ${
                debugInfo.masterLoadStatus === 'LOADED' ? 'text-emerald-400' :
                debugInfo.masterLoadStatus === 'ERROR' ? 'text-rose-400' : 'text-amber-300'
              }`}>
                {debugInfo.masterLoadStatus || (debugInfo.masterLoadingState === 'loaded' ? 'LOADED' : 'ERROR')}
              </span>
            </div>

            {/* 3. Skeleton */}
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Skeleton:</span>
              <span className="font-semibold text-neutral-200">
                {debugInfo.skeletonSummary || `${debugInfo.boneCount} bones`}
              </span>
            </div>

            {/* 4. Skinned Mesh */}
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Skinned Mesh:</span>
              <span className="font-semibold text-neutral-200">
                {debugInfo.skinnedMeshCount !== undefined ? debugInfo.skinnedMeshCount : (debugInfo.skinnedMeshDetected ? 1 : 0)}
              </span>
            </div>

            {/* 5. Active Clip */}
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Active Clip:</span>
              <span className="font-semibold text-amber-300 truncate max-w-[130px]" title={debugInfo.activeClip || debugInfo.currentAnimation}>
                {debugInfo.activeClip || debugInfo.currentAnimation || 'None'}
              </span>
            </div>

            {/* 6. Animation State */}
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Animation State:</span>
              <span className="px-1.5 py-0.5 rounded bg-neutral-800 font-bold text-sky-300 uppercase text-[9px]">
                {(debugInfo.animationState || 'idle').toUpperCase()}
              </span>
            </div>

            {/* 7. Mixer */}
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Mixer:</span>
              <span className={`font-bold ${
                debugInfo.mixerStatus === 'ACTIVE' || debugInfo.isFBXActive ? 'text-emerald-400' :
                debugInfo.mixerStatus === 'ERROR' ? 'text-rose-400' : 'text-neutral-400'
              }`}>
                {debugInfo.mixerStatus || (debugInfo.isFBXActive ? 'ACTIVE' : 'INACTIVE')}
              </span>
            </div>

            {/* 8. External Clip */}
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">External Clip:</span>
              <span className="font-semibold text-indigo-300 truncate max-w-[130px]" title={debugInfo.externalClip || 'None'}>
                {debugInfo.externalClip || 'None'}
              </span>
            </div>

            {/* 9. Retarget Status */}
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Retarget:</span>
              <span className={`font-bold ${
                debugInfo.retargetStatus === 'SUCCESS' ? 'text-emerald-400' :
                debugInfo.retargetStatus === 'ERROR' ? 'text-rose-400' : 'text-neutral-400'
              }`}>
                {debugInfo.retargetStatus || 'STANDBY'}
              </span>
            </div>

            {/* Proxy Endpoint & Loader Type */}
            <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60">
              <span className="text-neutral-500 text-[9px]">Proxy Endpoint:</span>
              <span className="text-neutral-400 font-mono text-[9px] truncate max-w-[140px]">
                {debugInfo.masterSourceUrl || '/api/character-asset'}
              </span>
            </div>

            {/* CORS / Network Error if failed */}
            {(debugInfo.corsOrNetworkError || debugInfo.masterErrorMessage) && (
              <div className="mt-1 p-2 rounded bg-rose-950/60 border border-rose-800 text-rose-300 space-y-1">
                <div className="flex items-center gap-1 font-semibold text-rose-400 text-[9px] uppercase">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>CORS / Network Error</span>
                </div>
                <p className="text-[9px] leading-tight break-words font-mono text-rose-200">
                  {debugInfo.corsOrNetworkError || debugInfo.masterErrorMessage}
                </p>
                <p className="text-[8.5px] text-rose-400/80 leading-normal">
                  Procedural character fallback retained. Game operational.
                </p>
              </div>
            )}
          </div>

          {/* Key Diagnostics Grid */}
          <div className="space-y-1.5 pt-1 border-t border-neutral-800/80">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-neutral-400">
                <Shield className="w-3 h-3 text-neutral-500" /> Class:
              </span>
              <span className="font-semibold text-neutral-100 capitalize">
                {debugInfo.currentClass}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-neutral-400">
                <Sword className="w-3 h-3 text-neutral-500" /> Weapon:
              </span>
              <span className="font-semibold text-neutral-200">
                {debugInfo.currentWeapon.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-neutral-400">
                <Film className="w-3 h-3 text-neutral-500" /> Clip:
              </span>
              <span className="font-semibold text-amber-300 truncate max-w-[140px]" title={debugInfo.currentAnimation}>
                {debugInfo.currentAnimation}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-neutral-400">
                <Layers className="w-3 h-3 text-neutral-500" /> State:
              </span>
              <span className="px-1.5 py-0.5 rounded bg-neutral-800 font-semibold text-sky-300 uppercase text-[10px]">
                {debugInfo.animationState}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Combo Index:</span>
              <span className="font-semibold text-orange-400">
                {debugInfo.comboIndex > 0 ? `Stage ${debugInfo.comboIndex} / 3` : 'Neutral (0)'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Clips Cached:</span>
              <span className="font-medium text-neutral-300">{debugInfo.loadedClipsCount}</span>
            </div>
          </div>

          {/* Status Message */}
          <div className="pt-2 border-t border-neutral-800/80">
            <div className="flex items-start gap-1.5 text-[10px] text-neutral-400">
              <RefreshCw className="w-3 h-3 mt-0.5 text-neutral-500 shrink-0" />
              <div className="break-words leading-tight">
                <span className="text-neutral-500">Status: </span>
                <span className={debugInfo.isFBXActive || debugInfo.masterLoadingState === 'loaded' ? 'text-emerald-400' : 'text-neutral-300'}>
                  {debugInfo.loadingStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
