'use client';

import { Suspense, type ReactNode } from 'react';
import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import type { ResolvedEnvironment } from '@/lib/environment';
import Room from './Room';
import Sofa from './furniture/Sofa';
import DiningTable from './furniture/DiningTable';
import KitchenIsland from './furniture/KitchenIsland';
import Bookshelf from './furniture/Bookshelf';
import Bed from './furniture/Bed';
import Desk from './furniture/Desk';
import CoffeeTable from './furniture/CoffeeTable';
import FloorLamp from './furniture/FloorLamp';
import TVConsole from './furniture/TVConsole';
import Rug from './furniture/Rug';
import WallArt from './furniture/WallArt';
import Character from './Character';
import PlayerControls from './PlayerControls';
import { DeskKeepsakes, KeepsakeCabinet, PajamaWardrobe } from './KeepsakeShowcase';

function interactive(handler?: () => void) {
  return (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    handler?.();
  };
}

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
      shadows
      camera={{ fov: 62, near: 0.08, far: 110 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = isNight ? 0.94 : 1.08;
      }}
      className="!fixed inset-0"
    >
      <Suspense fallback={null}>
        <color attach="background" args={[isNight ? '#11131a' : '#d8d1c7']} />
        <fog attach="fog" args={[isNight ? '#191820' : '#d8d0c5', 20, 52]} />
        <hemisphereLight args={[isNight ? '#7183a3' : '#fff2df', '#5b4738', isNight ? 0.35 : 0.7]} />
        <ambientLight intensity={isNight ? 0.19 : 0.36} color={isNight ? '#a9b7d2' : '#fff0dc'} />
        <directionalLight position={isNight ? [-6, 7, -3] : [7.8, 9, -6.8]} intensity={isNight ? 0.46 : 1.62} color={isNight ? '#b9c7e8' : '#ffd9a0'} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-camera-far={30} shadow-bias={-0.0003} />
        <pointLight position={[-3.3, 3.65, -3.9]} intensity={isNight ? 0.9 : 0.2} color="#ffcb8a" distance={8.5} />
        <pointLight position={[5.5, 3.25, 3.7]} intensity={isNight ? 0.58 : 0.14} color="#ffe0b3" distance={7} />

        <Room environment={environment} />

        <Rug position={[-4.65, 0.012, -4.45]} size={[5.3, 3.8]} color="#b9aa98" />
        <group position={[-4.3, 0, -3.75]} scale={1.28}><Sofa rotationY={Math.PI} /></group>
        <group position={[-4.1, 0, -4.85]} scale={1.18}><CoffeeTable /></group>
        <FloorLamp position={[-2.5, 0, -4.85]} />
        <TVConsole position={[-7.28, 0, -4.45]} rotationY={Math.PI / 2} />
        <group position={[3.25, 0, -3.35]} scale={1.12}><DiningTable /></group>
        <group position={[5.55, 0, 0.55]} scale={1.16}><KitchenIsland rotationY={Math.PI / 2} /></group>
        <group onClick={interactive(onArchiveClick)}><Bookshelf position={[-7.28, 0, -0.75]} rotationY={Math.PI / 2} /></group>
        <group position={[-3.7, 0, 4.15]} scale={1.25}><Bed /></group>
        <group onClick={interactive(onLettersClick)}>
          <group position={[5.55, 0, 4.1]} scale={1.12}><Desk rotationY={-Math.PI / 2} /></group>
          <DeskKeepsakes />
        </group>
        <KeepsakeCabinet onClick={onGiftsClick} />
        <PajamaWardrobe onClick={onGiftsClick} />
        <Planter position={[7.28, 0, -3.5]} scale={1.05} />
        <Planter position={[-6.85, 0, 4.35]} scale={0.92} />
        <WallArt position={[7.93, 2.1, -1.45]} rotationY={-Math.PI / 2} size={[0.9, 1.18]} color="#6e8276" />
        <WallArt position={[7.93, 1.85, 2.05]} rotationY={-Math.PI / 2} size={[0.72, 0.82]} color="#b98964" />
        <Character position={[0.25, 0, -0.25]} onClick={onCompanionClick} />
        {children}
        <ContactShadows position={[0, 0.015, 0]} opacity={isNight ? 0.32 : 0.22} scale={25} blur={3.1} far={6} resolution={256} frames={1} />
        <PlayerControls />
      </Suspense>
    </Canvas>
  );
}
