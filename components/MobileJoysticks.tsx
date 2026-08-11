'use client';

import { useRef } from 'react';
import { controlsState } from '@/lib/controlsState';

const RADIUS = 55;

function Joystick({ side, target }: { side: 'left' | 'right'; target: { x: number; y: number } }) {
  const baseRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef<HTMLDivElement>(null);
  const activeId = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });

  const setStick = (dx: number, dy: number) => {
    if (stickRef.current) stickRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
  };

  const reset = () => {
    activeId.current = null;
    target.x = 0;
    target.y = 0;
    setStick(0, 0);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (activeId.current !== null) return;
    activeId.current = e.pointerId;
    const rect = baseRef.current!.getBoundingClientRect();
    origin.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
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
      className={`fixed bottom-10 ${side === 'left' ? 'left-8' : 'right-8'} h-[120px] w-[120px] touch-none select-none rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-sm`}
      style={{ zIndex: 40 }}
    >
      <div
        ref={stickRef}
        className="absolute left-1/2 top-1/2 h-[52px] w-[52px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60"
      />
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
