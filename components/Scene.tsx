'use client';

import { Suspense, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, ContactShadows, Preload } from '@react-three/drei';
import * as THREE from 'three';
import type { ResolvedEnvironment } from '@/lib/environment';
import Room from './Room';
import Sofa from './furniture/Sofa';
import DiningTable from './furniture/DiningTable';
import Bed from './furniture/Bed';
import CoffeeTable from './furniture/CoffeeTable';
import FloorLamp from './furniture/FloorLamp';
import TVConsole from './furniture/TVConsole';
import Rug from './furniture/Rug';
import WallArt from './furniture/WallArt';
import Character from './Character';
import PlayerControls from './PlayerControls';
import ArchitecturalDetails from './ArchitecturalDetails';
import { DeskKeepsakes, KeepsakeCabinet, PajamaWardrobe } from './KeepsakeShowcase';

function Planter({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.26, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.29, 0.52, 32]} />
        <meshStandardMaterial color="#8a735d" roughness={0.74} />
      </mesh>
      {[-0.22, -0.1, 0.06, 0.19].map((x, index) => (
        <group key={x} position={[x, 0.7 + index * 0.05, 0]} rotation={[0, index * 0.8, (index - 1.5) * 0.18]}>
          <mesh position={[0, 0.33, 0]}>
            <cylinderGeometry args={[0.012, 0.018, 0.68, 8]} />
            <meshStandardMaterial color="#4d6147" roughness={1} />
          </mesh>
          <mesh position={[0.08, 0.56, 0]} rotation={[0, 0, 0.7]} scale={[0.72, 1.25, 0.3]}>
            <sphereGeometry args={[0.17, 14, 10]} />
            <meshStandardMaterial color={index % 2 ? '#587356' : '#6f8765'} roughness={0.94} />
          </mesh>
          <mesh position={[-0.08, 0.37, 0]} rotation={[0, 0, -0.72]} scale={[0.7, 1.18, 0.3]}>
            <sphereGeometry args={[0.16, 14, 10]} />
            <meshStandardMaterial color="#466646" roughness={0.94} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function Scene({
  environment,
  onCompanionClick,
  onArchiveClick,
  onLettersClick,
  onGiftsClick,
  children,
}: {
  environment: ResolvedEnvironment;
  onCompanionClick?: () => void;
  onArchiveClick?: () => void;
  onLettersClick?: () => void;
  onGiftsClick?: () => void;
  children?: ReactNode;
}) {
  const isNight = environment.dayPhase === 'night';

  return (
    <Canvas
      shadows="basic"
      camera={{ fov: 60, near: 0.08, far: 135 }}
      dpr={[1, 1.5]}
      performance={{ min: 0.55 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = isNight ? 0.94 : 1.08;
      }}
      className="!fixed inset-0"
    >
      <Suspense fallback={null}>
        <color attach="background" args={[isNight ? '#11131a' : '#d8d1c7']} />
        <fog attach="fog" args={[isNight ? '#191820' : '#d8d0c5', 32, 75]} />
        <hemisphereLight args={[isNight ? '#7183a3' : '#fff2df', '#5b4738', isNight ? 0.35 : 0.7]} />
        <ambientLight intensity={isNight ? 0.19 : 0.36} color={isNight ? '#a9b7d2' : '#fff0dc'} />
        <directionalLight position={isNight ? [-10, 11, -7] : [12, 14, -11]} intensity={isNight ? 0.46 : 1.62} color={isNight ? '#b9c7e8' : '#ffd9a0'} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-18} shadow-camera-right={18} shadow-camera-top={18} shadow-camera-bottom={-18} shadow-camera-far={42} shadow-bias={-0.0003} />
        <pointLight position={[2.5, 4.15, -4.2]} intensity={isNight ? 0.86 : 0.18} color="#ffcb8a" distance={12} />
        <pointLight position={[9.8, 3.8, 7.0]} intensity={isNight ? 0.52 : 0.11} color="#ffe0b3" distance={10} />
        <pointLight position={[-8.5, 3.6, 0]} intensity={isNight ? 0.42 : 0.08} color="#ffd5a1" distance={9} />

        <Room environment={environment} />
        <ArchitecturalDetails onArchiveClick={onArchiveClick} onLettersClick={onLettersClick} />

        <Rug position={[2.4, 0.012, -5.0]} size={[9.2, 6.7]} color="#b5a796" />
        <group position={[2.4, 0, -2.6]} scale={1.72}><Sofa rotationY={Math.PI} /></group>
        <group position={[2.4, 0, -5.05]} scale={1.5}><CoffeeTable /></group>
        <FloorLamp position={[-1.35, 0, -3.55]} />
        <TVConsole position={[2.4, 0, -8.65]} />

        <Rug position={[-1.0, 0.011, 1.55]} size={[6.7, 4.45]} color="#c6b8a6" />
        <group position={[-1.0, 0, 1.65]} scale={1.48}><DiningTable rotationY={Math.PI / 2} /></group>

        <Rug position={[9.8, 0.01, 7.3]} size={[10.0, 6.65]} color="#978b7d" />
        <Rug position={[-8.55, 0.011, -0.15]} size={[7.35, 6.6]} color="#c1b09e" />
        <group position={[-8.45, 0, 0.55]} scale={1.56}><Bed rotationY={Math.PI} /></group>
        <DeskKeepsakes />

        <KeepsakeCabinet onClick={onGiftsClick} />
        <PajamaWardrobe onClick={onGiftsClick} />
        <Planter position={[13.7, 0, -9.9]} scale={1.35} />
        <Planter position={[-3.85, 0, -10.2]} scale={1.18} />
        <Planter position={[4.8, 0, 4.8]} scale={0.92} />
        <WallArt position={[14.88, 2.35, 1.45]} rotationY={-Math.PI / 2} size={[1.3, 1.7]} color="#6e8276" />
        <WallArt position={[-14.88, 2.25, 5.1]} rotationY={Math.PI / 2} size={[1.15, 1.42]} color="#b98964" />
        <Character position={[2.1, 0, 0.15]} onClick={onCompanionClick} />
        {children}
        <ContactShadows position={[0, 0.015, 0]} opacity={isNight ? 0.3 : 0.2} scale={42} blur={3.2} far={7} resolution={256} frames={1} />
        <AdaptiveDpr pixelated={false} />
        <Preload all />
        <PlayerControls />
      </Suspense>
    </Canvas>
  );
}
