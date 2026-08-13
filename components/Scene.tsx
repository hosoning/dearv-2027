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
      camera={{ fov: 57, near: 0.05, far: 90 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = isNight ? 0.94 : 1.08;
      }}
      className="!fixed inset-0"
    >
      <Suspense fallback={null}>
        <color attach="background" args={[isNight ? '#11131a' : '#d8d1c7']} />
        <fog attach="fog" args={[isNight ? '#191820' : '#d8d0c5', 14, 38]} />
        <hemisphereLight args={[isNight ? '#7183a3' : '#fff2df', '#5b4738', isNight ? 0.35 : 0.7]} />
        <ambientLight intensity={isNight ? 0.19 : 0.36} color={isNight ? '#a9b7d2' : '#fff0dc'} />
        <directionalLight position={isNight ? [-4, 5.5, -2] : [4.8, 6.8, -4.6]} intensity={isNight ? 0.46 : 1.62} color={isNight ? '#b9c7e8' : '#ffd9a0'} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-camera-far={24} shadow-bias={-0.0003} />
        <pointLight position={[-1.35, 3.35, -2.4]} intensity={isNight ? 0.9 : 0.24} color="#ffcb8a" distance={7.5} />
        <pointLight position={[3.55, 3.05, 2.7]} intensity={isNight ? 0.58 : 0.16} color="#ffe0b3" distance={6} />
        <pointLight position={[-3.7, 2.8, 3.2]} intensity={isNight ? 0.48 : 0.12} color="#ffd7a1" distance={5} />

        <Room environment={environment} />

        <Rug position={[-2.55, 0.012, -3.25]} size={[3.25, 2.5]} color="#c6b49f" />
        <Sofa position={[-2.55, 0, -3.05]} rotationY={Math.PI} />
        <CoffeeTable position={[-2.55, 0, -3.82]} />
        <FloorLamp position={[-1.18, 0, -3.45]} />
        <TVConsole position={[-4.58, 0, -3.15]} rotationY={Math.PI / 2} />
        <DiningTable position={[2.15, 0, -1.85]} />
        <KitchenIsland position={[3.65, 0, 0.65]} rotationY={Math.PI / 2} />
        <group onClick={interactive(onArchiveClick)}><Bookshelf position={[-4.55, 0, -0.65]} rotationY={Math.PI / 2} /></group>
        <Bed position={[-2.55, 0, 2.55]} />
        <group onClick={interactive(onLettersClick)}>
          <Desk position={[3.9, 0, 3.15]} rotationY={-Math.PI / 2} />
          <DeskKeepsakes />
        </group>
        <KeepsakeCabinet onClick={onGiftsClick} />
        <PajamaWardrobe onClick={onGiftsClick} />
        <Planter position={[4.42, 0, -2.65]} scale={0.88} />
        <Planter position={[-4.25, 0, 3.35]} scale={0.78} />
        <WallArt position={[4.93, 1.82, -1.05]} rotationY={-Math.PI / 2} size={[0.72, 0.92]} color="#6e8276" />
        <WallArt position={[4.93, 1.62, 1.62]} rotationY={-Math.PI / 2} size={[0.58, 0.62]} color="#b98964" />
        <Character position={[0.25, 0, -0.25]} onClick={onCompanionClick} />
        {children}
        <ContactShadows position={[0, 0.015, 0]} opacity={isNight ? 0.34 : 0.24} scale={18} blur={2.7} far={5.5} resolution={512} />
        <PlayerControls />
      </Suspense>
    </Canvas>
  );
}
