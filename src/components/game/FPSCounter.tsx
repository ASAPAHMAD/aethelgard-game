import React, { useEffect, useRef, useState } from 'react';

/**
 * Standalone rAF-driven FPS overlay, toggled with F2. Runs its own requestAnimationFrame
 * loop rather than hooking into WorldEngine3D's render loop, since both loops fire once per
 * vsync tick anyway — this keeps the sampling decoupled from (and safe to add without
 * touching) the main game loop's delta/physics timing.
 */
export const FPSCounter: React.FC = () => {
  const [visible, setVisible] = useState<boolean>(true);
  const [fps, setFps] = useState<number>(0);
  const [frameMs, setFrameMs] = useState<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setVisible(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    let rafId: number;
    let frameCount = 0;
    let lastSample = performance.now();

    const tick = () => {
      frameCount += 1;
      const now = performance.now();
      const elapsed = now - lastSample;
      if (elapsed >= 500) {
        setFps((frameCount * 1000) / elapsed);
        setFrameMs(elapsed / frameCount);
        frameCount = 0;
        lastSample = now;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  if (!visible) return null;

  const color = fps >= 50 ? '#4ade80' : fps >= 30 ? '#facc15' : '#f87171';

  return (
    <div
      className="absolute top-4 right-4 z-40 pointer-events-none flex items-baseline gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-950/80 border border-neutral-800 backdrop-blur-md font-mono text-xs"
      title="FPS Counter [F2]"
    >
      <span style={{ color }} className="font-bold tabular-nums">{fps.toFixed(0)} FPS</span>
      <span className="text-neutral-500 tabular-nums">{frameMs.toFixed(1)}ms</span>
    </div>
  );
};
