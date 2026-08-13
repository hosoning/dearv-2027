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
      <group position={[1.4,1.68,-6.06]}><mesh><boxGeometry args={[0.32,0.92,0.1]} /><meshStandardMaterial color="#111316" metalness={0.68} roughness={0.2} /></mesh><mesh position={[0,0.25,0.06]}><boxGeometry args={[0.22,0.16,0.015]} /><meshBasicMaterial color={unlocked ? '#78d6aa' : '#d6a569'} toneMapped={false} /></mesh>{[-0.16,0,0.16].flatMap((y)=>[-0.07,0.07].map((x)=>[x,y] as const)).map(([x,y])=><mesh key={`${x}-${y}`} position={[x,y-0.08,0.06]}><circleGeometry args={[0.025,18]} /><meshStandardMaterial color="#b9b0a5" metalness={0.5} roughness={0.25} /></mesh>)}</group>
      <mesh position={[0,3.26,-0.2]}><boxGeometry args={[2.5,0.025,11.6]} /><meshStandardMaterial color="#f2c78c" emissive="#ffbd70" emissiveIntensity={0.75} toneMapped={false} /></mesh>
    </>
  );
}

function shuffleDigits() {
  const digits = ['1','2','3','4','5','6','7','8','9','0'];
  for (let i = digits.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return digits;
}

export default function EntranceGate({ language, setLanguage, t, onEnter }: { language: Language; setLanguage: (language: Language) => void; t: (key: string) => string; onEnter: () => void }) {
  const [sequence, setSequence] = useState('');
  const [digits, setDigits] = useState(['1','2','3','4','5','6','7','8','9','0']);
  const [error, setError] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const doorCode = process.env.NEXT_PUBLIC_DOOR_CODE || '0520';
  useEffect(() => setDigits(shuffleDigits()), []);
  function addDigit(digit: string) { if (unlocked || sequence.length >= 18) return; setError(false); setSequence((current) => current + digit); }
  function tryUnlock() { if (sequence.includes(doorCode)) { setUnlocked(true); window.setTimeout(onEnter, 1900); } else { setError(true); setSequence(''); setDigits(shuffleDigits()); } }
  return (
    <div className="fixed inset-0 overflow-hidden bg-[#15110e] text-white">
      <Canvas shadows camera={{ fov: 52, near: 0.05, far: 32 }} dpr={[1,1.8]} gl={{ antialias: true }} onCreated={({gl})=>{gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1.02;}}><Corridor unlocked={unlocked} /></Canvas>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,transparent_12%,rgba(8,5,3,.62)_100%)]" />
      <div className="fixed left-4 top-4 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-[#17120e]/55 p-1.5 shadow-2xl backdrop-blur-xl">{(['zh-TW','zh-CN','en'] as Language[]).map((item)=><button key={item} type="button" onClick={()=>setLanguage(item)} className={`rounded-full px-3 py-1.5 text-xs transition ${language===item?'bg-[#efe5d5] text-stone-900':'text-white/65 hover:text-white'}`}>{item==='zh-TW'?'繁中':item==='zh-CN'?'简中':'EN'}</button>)}</div>
      <div className="fixed bottom-4 right-4 z-20 w-[calc(100%-2rem)] max-w-[350px] sm:bottom-7 sm:right-7"><div className="rounded-[26px] border border-[#e2cda8]/20 bg-[#16120f]/72 p-4 shadow-[0_30px_80px_rgba(0,0,0,.45)] backdrop-blur-2xl sm:p-5"><div className="mb-4 flex items-start justify-between gap-4"><div><p className="text-[10px] uppercase tracking-[0.34em] text-[#e8c992]/60">dearv-2027</p><h1 className="mt-1 font-serif text-xl font-medium text-[#f5eee5]">{t('enterPasscode')}</h1></div><div className={`mt-1 h-2.5 w-2.5 rounded-full ${unlocked?'bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,.9)]':'bg-[#d7b071] shadow-[0_0_14px_rgba(215,176,113,.42)]'}`} /></div><div className="mb-2.5 flex min-h-11 items-center rounded-xl border border-white/[0.08] bg-black/25 px-4 font-mono text-lg tracking-[0.32em] text-[#f4dfbb]">{sequence?'•'.repeat(sequence.length):<span className="text-[10px] tracking-[0.18em] text-white/25">ANTI-PEEP PASSCODE</span>}</div><p className="mb-3.5 text-[11px] leading-5 text-white/38">{t('antiPeep')}</p><div className="grid grid-cols-5 gap-2">{digits.map((digit)=><button key={digit} type="button" onClick={()=>addDigit(digit)} className="aspect-square rounded-xl border border-white/[0.08] bg-white/[0.045] text-sm text-white/85 transition hover:border-[#d4b17a]/35 hover:bg-[#d4b17a]/10 active:scale-95">{digit}</button>)}</div><div className="mt-3 grid grid-cols-[1fr_1fr_1.4fr] gap-2"><button type="button" onClick={()=>setSequence('')} className="rounded-xl border border-white/[0.08] px-3 py-2.5 text-[11px] text-white/55 hover:bg-white/5">{t('clear')}</button><button type="button" onClick={()=>setSequence((current)=>current.slice(0,-1))} className="rounded-xl border border-white/[0.08] px-3 py-2.5 text-[11px] text-white/55 hover:bg-white/5">{t('backspace')}</button><button type="button" onClick={tryUnlock} disabled={unlocked} className="rounded-xl bg-[#e8d6b8] px-3 py-2.5 text-[11px] font-medium text-[#34271e] transition hover:bg-[#f3e8d6] disabled:opacity-60">{unlocked?t('unlocking'):t('unlock')}</button></div>{error&&<p className="mt-3 text-center text-xs text-rose-300">{t('wrongCode')}</p>}</div></div>
    </div>
  );
}
