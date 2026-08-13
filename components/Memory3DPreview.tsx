'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { MemoryObject } from '@/lib/types';
import { decodeMemoryNote } from '@/lib/memory-system';
import { GoldCoin, MusicHouse, SilkPajamas, StarCertificate, TieSet } from './KeepsakeShowcase';

function GenericObject({ object }: { object: MemoryObject }) {
  const meta = decodeMemoryNote(object.note);
  if (meta.visual === 'coin') {
    return (
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.55, 0.12, 64]} />
        <meshPhysicalMaterial color="#d2aa4f" metalness={0.93} roughness={0.16} clearcoat={0.35} />
      </mesh>
    );
  }
  if (meta.visual === 'frame') {
    return (
      <group>
        <mesh castShadow><boxGeometry args={[1.5, 1.05, 0.08]} /><meshStandardMaterial color="#67503a" roughness={0.55} /></mesh>
        <mesh position={[0, 0, 0.05]}><planeGeometry args={[1.32, 0.88]} /><meshStandardMaterial color="#efe6d6" roughness={0.9} /></mesh>
      </group>
    );
  }
  if (meta.visual === 'book') {
    return (
      <group rotation={[0.12, -0.25, 0]}>
        <mesh castShadow><boxGeometry args={[1.25, 0.18, 0.86]} /><meshStandardMaterial color="#6b503a" roughness={0.72} /></mesh>
        <mesh position={[0, 0.11, 0]}><boxGeometry args={[1.15, 0.06, 0.78]} /><meshStandardMaterial color="#eadfc9" roughness={0.92} /></mesh>
      </group>
    );
  }
  return (
    <group>
      <mesh position={[0, 0.28, 0]} castShadow>
        <sphereGeometry args={[0.5, 36, 28]} />
        <meshStandardMaterial color="#a99273" metalness={0.18} roughness={0.42} />
      </mesh>
      <mesh position={[0, -0.13, 0]} castShadow>
        <cylinderGeometry args={[0.6, 0.66, 0.14, 44]} />
        <meshStandardMaterial color="#2b2521" roughness={0.5} />
      </mesh>
    </group>
  );
}

function Centered({ scale, offset, children }: { scale: number; offset: [number, number, number]; children: ReactNode }) {
  return <group scale={scale}><group position={offset}>{children}</group></group>;
}

function PreviewObject({ object }: { object: MemoryObject }) {
  if (object.id === 'starter-tie-set') return <Centered scale={1.8} offset={[0.55, -1.08, -0.23]}><TieSet /></Centered>;
  if (object.id === 'starter-gold-520') return <Centered scale={2.4} offset={[-0.47, -1.08, -0.25]}><GoldCoin /></Centered>;
  if (object.id === 'starter-star-certificate') return <Centered scale={1.9} offset={[0.46, -1.72, -0.18]}><StarCertificate /></Centered>;
  if (object.id === 'starter-music-house') return <Centered scale={1.9} offset={[-0.48, -1.73, -0.2]}><MusicHouse /></Centered>;
  if (object.id === 'starter-silk-pajamas') return <Centered scale={1.45} offset={[0, -1.38, -0.03]}><SilkPajamas /></Centered>;
  return <GenericObject object={object} />;
}

export default function Memory3DPreview({ object }: { object: MemoryObject }) {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 700px), (max-height: 520px)');
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return (
    <div className="relative h-full min-h-[290px] w-full overflow-hidden bg-[radial-gradient(circle_at_50%_36%,#5d4a3a_0%,#2b241e_43%,#15120f_100%)]">
      <Canvas
        camera={{ position: [0, 1.05, 4.1], fov: 36, near: 0.05, far: 30 }}
        dpr={mobile ? 1 : [1, 1.35]}
        frameloop="demand"
        gl={{ antialias: !mobile, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.08;
        }}
      >
        <ambientLight intensity={0.6} color="#fff0dc" />
        <hemisphereLight args={['#f9e4c3', '#31251e', 0.75]} />
        <directionalLight position={[3.5, 4.8, 3]} intensity={2.1} color="#ffd7a0" />
        <pointLight position={[-2.6, 1.8, 2.4]} intensity={1.1} color="#b8cced" distance={7} />
        <group position={[0, 0.25, 0]} rotation={[0, -0.18, 0]}>
          <PreviewObject object={object} />
        </group>
        <mesh position={[0, -1.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.25, 48]} />
          <meshBasicMaterial color="#080706" transparent opacity={0.28} depthWrite={false} />
        </mesh>
        <OrbitControls enablePan={false} minDistance={2.4} maxDistance={6} minPolarAngle={0.7} maxPolarAngle={1.85} enableDamping={false} />
      </Canvas>
    </div>
  );
}
