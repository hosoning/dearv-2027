'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type DisplayMode = 'portrait' | 'landscape';
type LandscapeSide = 'auto' | 'left' | 'right';
type LockableOrientation = ScreenOrientation & { lock?: (orientation: 'landscape') => Promise<void> };

const MODE_KEY = 'dearv-display-mode';
const SIDE_KEY = 'dearv-landscape-side';

function readMode(): DisplayMode {
  return typeof window !== 'undefined' && window.localStorage.getItem(MODE_KEY) === 'landscape' ? 'landscape' : 'portrait';
}

export default function DisplayModeControls({ onModeChange }: { onModeChange?: (mode: DisplayMode) => void }) {
  const [mode, setMode] = useState<DisplayMode>('portrait');
  const [side, setSide] = useState<LandscapeSide>('auto');
  const tiltRef = useRef(0);

  const apply = useCallback((nextMode: DisplayMode, nextSide: LandscapeSide, nextTilt = tiltRef.current) => {
    const root = document.documentElement;
    const body = document.body;
    const landscape = nextMode === 'landscape';
    const naturalLandscape = window.innerWidth > window.innerHeight;
    let rotate = 0;
    if (landscape && !naturalLandscape) {
      rotate = nextSide === 'left' ? -90 : nextSide === 'right' ? 90 : nextTilt < 0 ? -90 : 90;
    }
    root.dataset.displayMode = nextMode;
    root.dataset.landscapeSide = rotate < 0 ? 'left' : 'right';
    root.style.setProperty('--app-rotation', `${rotate}deg`);
    body.classList.toggle('immersive-landscape', landscape);
    onModeChange?.(nextMode);
  }, [onModeChange]);

  useEffect(() => {
    const savedMode = readMode();
    const savedSide = (window.localStorage.getItem(SIDE_KEY) as LandscapeSide | null) ?? 'auto';
    setMode(savedMode);
    setSide(savedSide);
    apply(savedMode, savedSide, 0);
  }, [apply]);

  useEffect(() => {
    if (mode !== 'landscape') return;
    const onOrientation = (event: DeviceOrientationEvent) => {
      if (typeof event.gamma !== 'number' || Math.abs(event.gamma) < 18) return;
      tiltRef.current = event.gamma;
      if (side === 'auto') apply(mode, side, event.gamma);
    };
    const onResize = () => apply(mode, side);
    window.addEventListener('deviceorientation', onOrientation);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('deviceorientation', onOrientation);
      window.removeEventListener('resize', onResize);
    };
  }, [apply, mode, side]);

  async function selectMode(nextMode: DisplayMode) {
    setMode(nextMode);
    window.localStorage.setItem(MODE_KEY, nextMode);
    apply(nextMode, side);
    if (nextMode === 'landscape') {
      try {
        const orientationEvent = window.DeviceOrientationEvent as typeof DeviceOrientationEvent & { requestPermission?: () => Promise<'granted' | 'denied'> };
        await orientationEvent?.requestPermission?.();
        if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
        await (screen.orientation as LockableOrientation | undefined)?.lock?.('landscape');
      } catch {
        // iOS usually blocks programmatic orientation lock; CSS rotation remains active.
      }
    } else {
      try {
        screen.orientation?.unlock?.();
        if (document.fullscreenElement) await document.exitFullscreen?.();
      } catch {}
    }
  }

  function cycleSide() {
    const next: LandscapeSide = side === 'auto' ? 'right' : side === 'right' ? 'left' : 'auto';
    setSide(next);
    window.localStorage.setItem(SIDE_KEY, next);
    apply(mode, next);
  }

  return (
    <div className="display-mode-controls flex items-center rounded-full border border-white/10 bg-black/25 p-1 backdrop-blur-xl">
      <button type="button" onClick={() => selectMode('portrait')} aria-pressed={mode === 'portrait'} className={`rounded-full px-2.5 py-1.5 text-[10px] transition ${mode === 'portrait' ? 'bg-white text-stone-900' : 'text-white/55 hover:text-white'}`}>
        <span aria-hidden>▯</span><span className="ml-1 hidden sm:inline">PWA</span>
      </button>
      <button type="button" onClick={() => selectMode('landscape')} aria-pressed={mode === 'landscape'} className={`rounded-full px-2.5 py-1.5 text-[10px] transition ${mode === 'landscape' ? 'bg-white text-stone-900' : 'text-white/55 hover:text-white'}`}>
        <span aria-hidden>▭</span><span className="ml-1 hidden sm:inline">FULL</span>
      </button>
      {mode === 'landscape' && <button type="button" onClick={cycleSide} className="rounded-full px-2 py-1.5 text-[10px] text-white/55" title="Auto / rotate right / rotate left">{side === 'auto' ? 'AUTO' : side === 'right' ? '↻' : '↺'}</button>}
    </div>
  );
}
