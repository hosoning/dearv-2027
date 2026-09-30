'use client';

import { useRef, useState } from 'react';
import { controlsState } from '@/lib/controlsState';

const RADIUS = 48;

function Joystick({ side, target }: { side: 'left' | 'right'; target: { x: number; y: number } }) {
  const baseRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef<HTMLDivElement>(null);
  const activeId = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  const setStick = (dx: number, dy: number) => {
    if (stickRef.current) stickRef.current.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  };

  const reset = () => {
    activeId.current = null;
    setActive(false);
    target.x = 0;
    target.y = 0;
    setStick(0, 0);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (activeId.current !== null) return;
    activeId.current = e.pointerId;
    setActive(true);
    const rect = baseRef.current!.getBoundingClientRect();
    if (visualRef.current) {
      visualRef.current.style.left = `${e.clientX - rect.left}px`;
      visualRef.current.style.top = `${e.clientY - rect.top}px`;
    }
    origin.current = { x: e.clientX, y: e.clientY };
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (activeId.current !== e.pointerId) return;
    let dx = e.clientX - origin.current.x;
    let dy = e.clientY - origin.current.y;
    const dist = Math.hypot(dx, dy);
    if (dist > RADIUS) {
      dx = (dx / dist) * RADIUS;
      dy = (dy / dist) * RADIUS;
    }
    setStick(dx, dy);
    target.x = dx / RADIUS;
    target.y = dy / RADIUS;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (activeId.current !== e.pointerId) return;
    reset();
  };

  return (
    <div
      ref={baseRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={`mobile-touch-zone fixed bottom-0 ${side === 'left' ? 'left-0' : 'right-0'} h-[48vh] w-[44vw] touch-none select-none`}
      style={{ zIndex: 40 }}
    >
      <div ref={visualRef} className={`pointer-events-none absolute h-[96px] w-[96px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-white/[0.035] backdrop-blur-[2px] transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-0'}`}>
        <div ref={stickRef} className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/35 bg-white/20 shadow-[0_0_20px_rgba(255,255,255,.12)]" />
      </div>
    </div>
  );
}

export default function MobileJoysticks() {
  return (
    <>
      <Joystick side="left" target={controlsState.joystickMove} />
      <Joystick side="right" target={controlsState.joystickLook} />
    </>
  );
}
