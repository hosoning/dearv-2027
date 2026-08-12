'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Language } from '@/lib/i18n';

function Corridor({ unlocked }: { unlocked: boolean }) {
  const { camera } = useThree();
  const door = useRef<THREE.Group>(null);
  const progress = useRef(0);

  useEffect(() => {
    camera.position.set(0, 1.65, 5.2);
    camera.lookAt(0, 1.55, -5.7);
  }, [camera]);

  useFrame((_, delta) => {
    if (!unlocked) return;
    progress.current = Math.min(1, progress.current + delta * 0.7);
    const eased = 1 - Math.pow(1 - progress.current, 3);
    if (door.current) door.current.position.x = eased * 1.35;
    camera.position.z = THREE.MathUtils.lerp(5.2, -4.25, eased);
  });

  const panels = useMemo(() => [-4.4, -2.2, 0, 2.2, 4.4], []);

  return (
    <>
      <color attach="background" args={['#14110f']} />
      <fog attach="fog" args={['#171310', 6, 17]} />
      <ambientLight intensity={0.34} />
      <directionalLight position={[2, 5, 3]} intensity={0.72} color="#ffe6bd" />
      {panels.map((z) => (
        <group key={z}>
          <pointLight position={[-1.7, 2.25, z]} intensity={0.42} distance={3.2} color="#ffd69a" />
          <pointLight position={[1.7, 2.25, z]} intensity={0.42} distance={3.2} color="#ffd69a" />
          <mesh position={[-1.92, 2.25, z]}>
            <sphereGeometry args={[0.05, 12, 12]} />
            <meshStandardMaterial emissive="#ffd49a" emissiveIntensity={2.5} color="#9b7248" />
          </mesh>
          <mesh position={[1.92, 2.25, z]}>
            <sphereGeometry args={[0.05, 12, 12]} />
            <meshStandardMaterial emissive="#ffd49a" emissiveIntensity={2.5} color="#9b7248" />
          </mesh>
        </group>
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[4.4, 13]} />
        <meshStandardMaterial color="#46392e" roughness={0.72} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.4, 0]}>
        <planeGeometry args={[4.4, 13]} />
        <meshStandardMaterial color="#2b2521" roughness={0.95} />
      </mesh>
      <mesh position={[-2.2, 1.7, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[13, 3.4]} />
        <meshStandardMaterial color="#5a4b40" roughness={0.9} />
      </mesh>
      <mesh position={[2.2, 1.7, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[13, 3.4]} />
        <meshStandardMaterial color="#5a4b40" roughness={0.9} />
      </mesh>

      {panels.map((z) => (
        <group key={`trim-${z}`}>
          <mesh position={[-2.16, 1.7, z]} rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[0.035, 2.55, 1.55]} />
            <meshStandardMaterial color="#332820" />
          </mesh>
          <mesh position={[2.16, 1.7, z]} rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[0.035, 2.55, 1.55]} />
            <meshStandardMaterial color="#332820" />
          </mesh>
        </group>
      ))}

      <mesh position={[0, 1.7, -6.2]}>
        <boxGeometry args={[4.4, 3.4, 0.2]} />
        <meshStandardMaterial color="#27221f" />
      </mesh>
      <mesh position={[0, 1.75, -6.05]}>
        <boxGeometry args={[2.05, 3.05, 0.12]} />
        <meshStandardMaterial color="#161515" metalness={0.16} roughness={0.48} />
      </mesh>
      <group ref={door} position={[0, 0, 0]}>
        <mesh position={[0, 1.7, -5.92]} castShadow>
          <boxGeometry args={[1.72, 2.86, 0.11]} />
          <meshStandardMaterial color="#473629" metalness={0.12} roughness={0.52} />
        </mesh>
        <mesh position={[0.66, 1.62, -5.82]}>
          <boxGeometry args={[0.08, 0.34, 0.07]} />
          <meshStandardMaterial color="#b79c73" metalness={0.8} roughness={0.25} />
        </mesh>
      </group>
      <mesh position={[0.93, 1.75, -5.78]}>
        <boxGeometry args={[0.18, 0.58, 0.08]} />
        <meshStandardMaterial color="#111418" metalness={0.62} roughness={0.25} />
      </mesh>
    </>
  );
}

function shuffleDigits() {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  for (let i = digits.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return digits;
}

export default function EntranceGate({
  language,
  setLanguage,
  t,
  onEnter,
}: {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
  onEnter: () => void;
}) {
  const [sequence, setSequence] = useState('');
  const [digits, setDigits] = useState(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']);
  const [error, setError] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const doorCode = process.env.NEXT_PUBLIC_DOOR_CODE || '0520';

  useEffect(() => setDigits(shuffleDigits()), []);

  function addDigit(digit: string) {
    if (unlocked || sequence.length >= 18) return;
    setError(false);
    setSequence((current) => current + digit);
  }

  function tryUnlock() {
    if (sequence.includes(doorCode)) {
      setUnlocked(true);
      window.setTimeout(onEnter, 1650);
    } else {
      setError(true);
      setSequence('');
      setDigits(shuffleDigits());
    }
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#151210] text-white">
      <Canvas camera={{ fov: 57, near: 0.05, far: 30 }} dpr={[1, 1.7]}>
        <Corridor unlocked={unlocked} />
      </Canvas>

      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,transparent_18%,rgba(5,4,3,.56)_100%)]" />

      <div className="fixed left-4 top-4 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-black/30 p-1.5 backdrop-blur-xl">
        {(['zh-TW', 'zh-CN', 'en'] as Language[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setLanguage(item)}
            className={`rounded-full px-3 py-1.5 text-xs transition ${language === item ? 'bg-white text-stone-900' : 'text-white/65 hover:text-white'}`}
          >
            {item === 'zh-TW' ? '繁中' : item === 'zh-CN' ? '简中' : 'EN'}
          </button>
        ))}
      </div>

      <div className="fixed bottom-0 right-0 z-20 w-full p-4 sm:bottom-auto sm:right-7 sm:top-1/2 sm:w-[360px] sm:-translate-y-1/2">
        <div className="rounded-[28px] border border-white/15 bg-[#171513]/80 p-5 shadow-2xl backdrop-blur-2xl">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-amber-100/55">dearv-2027</p>
              <h1 className="mt-1 text-lg font-medium text-white">{t('enterPasscode')}</h1>
            </div>
            <div className={`mt-1 h-2.5 w-2.5 rounded-full ${unlocked ? 'bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,.9)]' : 'bg-amber-200/75'}`} />
          </div>

          <div className="mb-3 flex min-h-12 items-center rounded-2xl border border-white/10 bg-black/30 px-4 font-mono text-lg tracking-[0.32em] text-amber-50">
            {sequence ? '•'.repeat(sequence.length) : <span className="text-xs tracking-normal text-white/30">ANTI-PEEP PASSCODE</span>}
          </div>
          <p className="mb-4 text-xs leading-5 text-white/45">{t('antiPeep')}</p>

          <div className="grid grid-cols-5 gap-2">
            {digits.map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => addDigit(digit)}
                className="aspect-square rounded-2xl border border-white/10 bg-white/[0.055] text-base text-white/90 transition hover:bg-white/10 active:scale-95"
              >
                {digit}
              </button>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-[1fr_1fr_1.35fr] gap-2">
            <button type="button" onClick={() => setSequence('')} className="rounded-2xl border border-white/10 px-3 py-2.5 text-xs text-white/60 hover:bg-white/5">{t('clear')}</button>
            <button type="button" onClick={() => setSequence((current) => current.slice(0, -1))} className="rounded-2xl border border-white/10 px-3 py-2.5 text-xs text-white/60 hover:bg-white/5">{t('backspace')}</button>
            <button type="button" onClick={tryUnlock} disabled={unlocked} className="rounded-2xl bg-amber-100 px-3 py-2.5 text-xs font-medium text-stone-900 transition hover:bg-white disabled:opacity-60">{unlocked ? t('unlocking') : t('unlock')}</button>
          </div>
          {error && <p className="mt-3 text-center text-xs text-rose-300">{t('wrongCode')}</p>}
        </div>
      </div>
    </div>
  );
}
