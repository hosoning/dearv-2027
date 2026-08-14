'use client';

import { Suspense, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, ContactShadows, Environment, Preload } from '@react-three/drei';
import * as THREE from 'three';
import type { ResolvedEnvironment } from '@/lib/environment';
import Room from './Room';
import RealSofa from './furniture/RealSofa';
import Bed from './furniture/Bed';
import CoffeeTable from './furniture/CoffeeTable';
import FloorLamp from './furniture/FloorLamp';
import Rug from './furniture/Rug';
import WallArt from './furniture/WallArt';
import Character from './Character';
import PlayerControls from './PlayerControls';
import ArchitecturalDetails from './ArchitecturalDetails';
import { DeskKeepsakes, KeepsakeCabinet, PajamaWardrobe } from './KeepsakeShowcase';

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
      camera={{ fov: 50, near: 0.08, far: 135 }}
      dpr={[1, 1.5]}
      performance={{ min: 0.55 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = isNight ? 0.78 : 1.3;
        scene.environmentIntensity = isNight ? 0.22 : 0.52;
      }}
      className="!fixed inset-0"
    >
      <Suspense fallback={null}>
        <color attach="background" args={[isNight ? '#11131a' : '#d8d1c7']} />
        <Environment
          files="env/highrise_beach_ocean_2k.hdr"
          background
          backgroundIntensity={isNight ? 0.16 : 0.78}
          environmentIntensity={isNight ? 0.22 : 0.52}
          backgroundRotation={[0, 0, 0]}
          environmentRotation={[0, 0, 0]}
        />
        <fog attach="fog" args={[isNight ? '#191820' : '#d8d0c5', 32, 75]} />
        <hemisphereLight args={[isNight ? '#7183a3' : '#fff2df', '#5b4738', isNight ? 0.28 : 0.62]} />
        <ambientLight intensity={isNight ? 0.14 : 0.32} color={isNight ? '#a9b7d2' : '#fff0dc'} />
        <directionalLight position={isNight ? [-10, 11, -7] : [12, 14, -11]} intensity={isNight ? 0.38 : 1.12} color={isNight ? '#b9c7e8' : '#ffd9a0'} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-18} shadow-camera-right={18} shadow-camera-top={18} shadow-camera-bottom={-18} shadow-camera-far={42} shadow-bias={-0.0003} />
        <pointLight position={[-2.5, 3.55, -4.2]} intensity={isNight ? 0.86 : 0.18} color="#ffcb8a" distance={12} />
        <pointLight position={[-9.8, 3.35, 7.0]} intensity={isNight ? 0.52 : 0.11} color="#ffe0b3" distance={10} />
        <pointLight position={[8.5, 3.3, 0]} intensity={isNight ? 0.42 : 0.08} color="#ffd5a1" distance={9} />

        {/* The approved orientation is defined from inside, facing the glass: master suite right, study left. */}
        <group scale={[-1, 1, 1]}>
          <Room environment={environment} />
          <ArchitecturalDetails onArchiveClick={onArchiveClick} onLettersClick={onLettersClick} />

          {/* A real PBR product model is repeated to form the generous L-shaped seating area. */}
          <Rug position={[1.25, 0.012, -4.55]} size={[8.6, 6.35]} color="#b5a796" />
          <RealSofa position={[-0.05, 0, -2.08]} scale={1.24} rotationY={Math.PI} />
          <RealSofa position={[2.3, 0, -2.08]} scale={1.24} rotationY={Math.PI} />
          <RealSofa position={[-1.3, 0, -3.62]} scale={1.24} rotationY={Math.PI / 2} />
          <group position={[1.22, 0, -4.9]} scale={1.28}><CoffeeTable /></group>
          <FloorLamp position={[4.35, 0, -2.8]} />

          <Rug position={[12.0, 0.01, -4.15]} size={[4.75, 12.0]} color="#978b7d" />
          <Rug position={[-12.75, 0.011, 7.05]} size={[4.65, 5.7]} color="#c1b09e" />
          <group position={[-13.42, 0, 7.0]} scale={1.08}><Bed rotationY={Math.PI / 2} /></group>
          <DeskKeepsakes position={[11.8, 0.94, -4.25]} rotationY={Math.PI / 2} />

          {/* Gifts remain physical, but are integrated into the wardrobe wall instead of standing in the living room. */}
          <KeepsakeCabinet position={[-7.0, 0, -5.62]} rotationY={0} onClick={onGiftsClick} />
          <PajamaWardrobe position={[-14.52, 0, -0.05]} rotationY={Math.PI / 2} onClick={onGiftsClick} />
          <WallArt position={[9.2, 2.05, -0.15]} rotationY={Math.PI / 2} size={[1.25, 1.55]} color="#6e8276" />
          <Character position={[5.0, 0, -0.3]} onClick={onCompanionClick} />
          {children}
        </group>
        <ContactShadows position={[0, 0.015, 0]} opacity={isNight ? 0.3 : 0.2} scale={42} blur={3.2} far={7} resolution={256} frames={1} />
        <AdaptiveDpr pixelated={false} />
        <Preload all />
        <PlayerControls />
      </Suspense>
    </Canvas>
  );
}
