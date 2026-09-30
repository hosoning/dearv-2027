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
    camera.position.set(0, 1.64, 5.5);
    camera.lookAt(0, 1.55, -5.75);
  }, [camera]);

  useFrame((_, delta) => {
    if (!unlocked) return;
    progress.current = Math.min(1, progress.current + delta * 0.64);
    const eased = 1 - Math.pow(1 - progress.current, 3);
    if (door.current) door.current.rotation.y = -eased * Math.PI * 0.47;
    camera.position.z = THREE.MathUtils.lerp(5.5, -4.1, eased);
    camera.position.y = THREE.MathUtils.lerp(1.64, 1.61, eased);
  });

  const panels = useMemo(() => [-4.3, -2.15, 0, 2.15, 4.3], []);

  return (
    <>
      <color attach="background" args={['#15110e']} />
      <fog attach="fog" args={['#17120f', 7, 19]} />
      <hemisphereLight args={['#f0d9bd', '#2b211b', 0.35]} />
      <ambientLight intensity={0.16} />
      <directionalLight position={[2.8, 5.2, 3]} intensity={0.62} color="#ffd9a4" castShadow />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[4.6, 13.8]} /><meshStandardMaterial color="#3c3027" roughness={0.48} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0.7]} receiveShadow><planeGeometry args={[1.48, 11.7]} /><meshStandardMaterial color="#83705f" roughness={0.92} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.45, 0]}><planeGeometry args={[4.6, 13.8]} /><meshStandardMaterial color="#27211d" roughness={0.96} /></mesh>
      <mesh position={[-2.3, 1.72, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow><planeGeometry args={[13.8, 3.45]} /><meshStandardMaterial color="#55463c" roughness={0.88} /></mesh>
      <mesh position={[2.3, 1.72, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow><planeGeometry args={[13.8, 3.45]} /><meshStandardMaterial color="#55463c" roughness={0.88} /></mesh>
      {panels.map((z) => (
        <group key={z}>
          {[-2.25, 2.25].map((x) => <group key={x} position={[x,1.72,z]} rotation={[0,Math.PI/2,0]}><mesh><boxGeometry args={[1.66,2.58,0.045]} /><meshStandardMaterial color="#40332b" roughness={0.78} /></mesh><mesh position={[0,0,0.027]}><boxGeometry args={[1.42,2.3,0.025]} /><meshStandardMaterial color="#5f4d40" roughness={0.82} /></mesh></group>)}
          <pointLight position={[-1.82,2.35,z]} intensity={0.36} distance={3.1} color="#ffd49a" />
          <pointLight position={[1.82,2.35,z]} intensity={0.36} distance={3.1} color="#ffd49a" />
          {[-1.93, 1.93].map((x) => <group key={x} position={[x,2.36,z]}><mesh><cylinderGeometry args={[0.055,0.075,0.22,18]} /><meshStandardMaterial color="#a8865f" metalness={0.72} roughness={0.25} /></mesh><mesh position={[0,-0.13,0]}><sphereGeometry args={[0.08,18,14]} /><meshStandardMaterial color="#ffd9a2" emissive="#ffbf70" emissiveIntensity={1.4} toneMapped={false} /></mesh></group>)}
        </group>
      ))}
      {[-3.2,1.45].map((z,index) => <group key={z} position={[-2.22,1.68,z]} rotation={[0,Math.PI/2,0]}><mesh><boxGeometry args={[0.74,1.02,0.075]} /><meshStandardMaterial color="#a88c68" roughness={0.42} metalness={0.18} /></mesh><mesh position={[0,0,0.043]}><planeGeometry args={[0.61,0.88]} /><meshStandardMaterial color={index ? '#59665d' : '#7c5e4c'} roughness={0.9} /></mesh></group>)}
      <mesh position={[0,1.72,-6.45]}><boxGeometry args={[4.6,3.45,0.22]} /><meshStandardMaterial color="#211c19" roughness={0.72} /></mesh>
      <mesh position={[0,1.73,-6.31]}><boxGeometry args={[2.45,3.18,0.13]} /><meshStandardMaterial color="#3c2a20" roughness={0.5} /></mesh>
      {[-0.86,-0.43,0,0.43,0.86].map((x)=><mesh key={x} position={[x,1.73,-6.225]}><boxGeometry args={[0.07,2.92,0.05]} /><meshStandardMaterial color="#5b3d2b" roughness={0.48} /></mesh>)}
      <group ref={door} position={[-1.08,0,-6.18]}><group position={[1.08,0,0]}><mesh position={[0,1.72,0]} castShadow><boxGeometry args={[2.16,3.04,0.12]} /><meshStandardMaterial color="#5b3c2a" roughness={0.46} /></mesh>{[0.55,1.28,2.0,2.67].map((y)=><mesh key={y} position={[0,y,0.07]}><boxGeometry args={[1.74,0.035,0.04]} /><meshStandardMaterial color="#9d7c55" metalness={0.38} roughness={0.3} /></mesh>)}<mesh position={[0.78,1.54,0.1]}><boxGeometry args={[0.12,0.42,0.07]} /><meshStandardMaterial color="#b89d73" metalness={0.82} roughness={0.22} /></mesh></group></group>
      <group position={[1.4,1.67,-6.04]}>
        <mesh castShadow><boxGeometry args={[0.31,1.08,0.105]} /><meshPhysicalMaterial color="#090b0e" metalness={0.62} roughness={0.1} clearcoat={1} clearcoatRoughness={0.045} /></mesh>
        <mesh position={[0,0.41,0.06]}><boxGeometry args={[0.2,0.055,0.012]} /><meshBasicMaterial color="#dbe1e6" transparent opacity={0.65} toneMapped={false} /></mesh>
        <mesh position={[0,0.29,0.061]}><boxGeometry args={[0.21,0.12,0.012]} /><meshBasicMaterial color={unlocked ? '#7ff0ba' : '#9ed8e7'} transparent opacity={0.72} toneMapped={false} /></mesh>
        {[0.12,-0.02,-0.16,-0.3].flatMap((y)=>[-0.068,0,0.068].map((x)=>[x,y] as const)).map(([x,y])=><mesh key={`${x}-${y}`} position={[x,y,0.064]}><circleGeometry args={[0.018,18]} /><meshBasicMaterial color="#dbe8eb" transparent opacity={0.7} toneMapped={false} /></mesh>)}
        <mesh position={[0,-0.44,0.064]}><ringGeometry args={[0.055,0.07,24]} /><meshBasicMaterial color="#a8b9bd" transparent opacity={0.5} toneMapped={false} /></mesh>
      </group>
      <mesh position={[0,3.26,-0.2]}><boxGeometry args={[2.5,0.025,11.6]} /><meshStandardMaterial color="#f2c78c" emissive="#ffbd70" emissiveIntensity={0.75} toneMapped={false} /></mesh>
    </>
  );
}

export default function EntranceGate({ language, setLanguage, t, onEnter }: { language: Language; setLanguage: (language: Language) => void; t: (key: string) => string; onEnter: () => void }) {
  const [sequence, setSequence] = useState('');
  const [error, setError] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const doorCode = process.env.NEXT_PUBLIC_DOOR_CODE || '0520';
  function addDigit(digit: string) { if (unlocked || sequence.length >= 18) return; setError(false); setSequence((current) => current + digit); }
  function tryUnlock() { if (sequence.includes(doorCode)) { setUnlocked(true); window.setTimeout(onEnter, 1900); } else { setError(true); setSequence(''); } }
  return (
    <div className="fixed inset-0 overflow-hidden bg-[#15110e] text-white">
      <Canvas shadows camera={{ fov: 52, near: 0.05, far: 32 }} dpr={[1,1.8]} gl={{ antialias: true }} onCreated={({gl})=>{gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1.02;}}><Corridor unlocked={unlocked} /></Canvas>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(5,7,9,.08)_0%,rgba(5,6,8,.42)_52%,rgba(3,3,4,.82)_100%)]" />
      <div className="fixed left-1/2 top-3 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-black/45 p-1 shadow-xl backdrop-blur-xl sm:top-5">{(['zh-TW','zh-CN','en'] as Language[]).map((item)=><button key={item} type="button" onClick={()=>setLanguage(item)} className={`rounded-full px-3 py-1.5 text-[11px] transition ${language===item?'bg-white text-black':'text-white/55 hover:text-white'}`}>{item==='zh-TW'?'繁中':item==='zh-CN'?'简中':'EN'}</button>)}</div>
      <div className="fixed inset-0 z-20 flex items-center justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-14 sm:px-6 sm:pt-16">
        <div className="relative max-h-[calc(100svh-4.25rem)] w-full max-w-[430px] overflow-x-hidden overflow-y-auto rounded-[34px] border border-white/20 bg-[linear-gradient(150deg,rgba(39,43,48,.94),rgba(4,5,7,.97)_48%,rgba(20,22,25,.96))] p-[1px] shadow-[0_35px_100px_rgba(0,0,0,.72),0_0_0_1px_rgba(255,255,255,.04)] backdrop-blur-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="pointer-events-none absolute -left-16 top-[-35%] h-[140%] w-28 rotate-[18deg] bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
          <div className="relative rounded-[33px] border border-black/70 bg-[linear-gradient(145deg,rgba(22,25,29,.96),rgba(5,6,8,.98)_50%,rgba(15,17,20,.98))] px-5 py-4 sm:px-8 sm:py-6">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[12px] font-semibold tracking-[0.28em] text-white/85">SAMSUNG</p>
                <p className="mt-1 text-[8px] uppercase tracking-[0.32em] text-white/28">Smart Door Lock</p>
              </div>
              <div className={`flex h-9 w-9 items-center justify-center rounded-full border ${unlocked?'border-emerald-300/60 bg-emerald-300/15 text-emerald-200':'border-white/10 bg-white/[0.035] text-white/30'}`} aria-hidden="true">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
              </div>
            </div>

            <div className="mb-3 rounded-2xl border border-cyan-100/10 bg-black/55 px-4 py-3 shadow-[inset_0_1px_10px_rgba(0,0,0,.7),0_0_28px_rgba(111,211,232,.04)]">
              <div className="flex min-h-8 items-center justify-center font-mono text-[22px] tracking-[0.38em] text-cyan-100/90" aria-live="polite">
                {sequence ? '•'.repeat(sequence.length) : <span className="text-[9px] tracking-[0.26em] text-cyan-100/28">ANTI-PEEP PIN</span>}
              </div>
            </div>

            <h1 className="text-center font-serif text-lg font-medium text-white/90 sm:text-xl">{t('enterPasscode')}</h1>
            <p className="mx-auto mb-4 mt-1 max-w-[310px] text-center text-[10px] leading-4 text-white/34">{t('antiPeep')}</p>

            <div className="mx-auto grid max-w-[320px] grid-cols-3 gap-2.5 sm:gap-3">
              {['1','2','3','4','5','6','7','8','9'].map((digit)=><button key={digit} type="button" onClick={()=>addDigit(digit)} className="aspect-[1.32] rounded-2xl border border-white/[0.13] bg-[linear-gradient(145deg,rgba(255,255,255,.09),rgba(255,255,255,.025))] text-[22px] font-light text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,.1),0_8px_16px_rgba(0,0,0,.22)] transition hover:border-cyan-100/35 hover:bg-cyan-100/10 active:scale-[0.94] active:bg-cyan-100/20">{digit}</button>)}
              <button type="button" onClick={()=>setSequence('')} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] text-[10px] text-white/38 transition hover:text-white/80 active:scale-[0.94]">{t('clear')}</button>
              <button type="button" onClick={()=>addDigit('0')} className="aspect-[1.32] rounded-2xl border border-white/[0.13] bg-[linear-gradient(145deg,rgba(255,255,255,.09),rgba(255,255,255,.025))] text-[22px] font-light text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,.1),0_8px_16px_rgba(0,0,0,.22)] transition hover:border-cyan-100/35 hover:bg-cyan-100/10 active:scale-[0.94] active:bg-cyan-100/20">0</button>
              <button type="button" aria-label={t('backspace')} onClick={()=>setSequence((current)=>current.slice(0,-1))} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] text-lg text-white/45 transition hover:text-white/85 active:scale-[0.94]">⌫</button>
            </div>

            <button type="button" onClick={tryUnlock} disabled={unlocked} className="mx-auto mt-4 flex w-full max-w-[320px] items-center justify-center gap-2 rounded-2xl border border-cyan-100/15 bg-[linear-gradient(180deg,rgba(201,238,244,.94),rgba(132,190,202,.88))] py-3.5 text-[12px] font-semibold tracking-[0.2em] text-[#102126] shadow-[0_12px_30px_rgba(90,176,193,.18)] transition hover:brightness-110 active:scale-[0.98] disabled:opacity-70">
              {unlocked?t('unlocking'):t('unlock')}
            </button>
            {error&&<p className="mt-3 text-center text-xs text-rose-300">{t('wrongCode')}</p>}
            <div className="mt-4 flex items-center justify-center gap-3 text-white/20" aria-hidden="true">
              <span className="h-px w-12 bg-white/10"/><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M12 4a4 4 0 0 1 4 4v2M8 10V8a4 4 0 0 1 .7-2.3M6 13v-1a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1M8 13v2a4 4 0 0 0 8 0v-2M12 13v5"/></svg><span className="text-[8px] uppercase tracking-[0.25em]">NFC · PIN · Secure</span><span className="h-px w-12 bg-white/10"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
