'use client';

import { Suspense, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, ContactShadows, Environment, Preload } from '@react-three/drei';
import * as THREE from 'three';
import type { ResolvedEnvironment } from '@/lib/environment';
import Room from './Room';
import Bed from './furniture/Bed';
import CoffeeTable from './furniture/CoffeeTable';
import FloorLamp from './furniture/FloorLamp';
import Rug from './furniture/Rug';
import WallArt from './furniture/WallArt';
import PlayerControls from './PlayerControls';
import ArchitecturalDetails from './ArchitecturalDetails';
import { DeskKeepsakes, KeepsakeCabinet, PajamaWardrobe } from './KeepsakeShowcase';
import HeroSofa from './furniture/HeroSofa';
import { ChristmasMusicLanternReference, Gift520Reference } from './ProductReferenceGifts';

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
  void onCompanionClick;

  return (
    <Canvas
      shadows="basic"
      camera={{ fov: 47, near: 0.08, far: 135 }}
      dpr={[1, 1.5]}
      performance={{ min: 0.55 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = isNight ? 0.78 : 1.02;
        scene.environmentIntensity = isNight ? 0.22 : 0.4;
      }}
      className="!fixed inset-0"
    >
      <Suspense fallback={null}>
        <color attach="background" args={[isNight ? '#11131a' : '#d8d1c7']} />
        <Environment
          files="env/highrise_beach_ocean_2k.hdr"
          background
          backgroundIntensity={isNight ? 0.16 : 0.78}
          environmentIntensity={isNight ? 0.22 : 0.4}
          backgroundRotation={[0, 0, 0]}
          environmentRotation={[0, 0, 0]}
        />
        <fog attach="fog" args={[isNight ? '#191820' : '#d8d0c5', 32, 75]} />
        <hemisphereLight args={[isNight ? '#7183a3' : '#fff2df', '#5b4738', isNight ? 0.28 : 0.44]} />
        <ambientLight intensity={isNight ? 0.14 : 0.2} color={isNight ? '#a9b7d2' : '#fff0dc'} />
        <directionalLight position={isNight ? [-10, 11, -7] : [12, 14, -11]} intensity={isNight ? 0.38 : 0.86} color={isNight ? '#b9c7e8' : '#ffd9a0'} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-18} shadow-camera-right={18} shadow-camera-top={18} shadow-camera-bottom={-18} shadow-camera-far={42} shadow-bias={-0.0003} />
        <pointLight position={[-2.5, 3.55, -4.2]} intensity={isNight ? 0.86 : 0.18} color="#ffcb8a" distance={12} />
        <pointLight position={[-9.8, 3.35, 7.0]} intensity={isNight ? 0.52 : 0.11} color="#ffe0b3" distance={10} />
        <pointLight position={[8.5, 3.3, 0]} intensity={isNight ? 0.42 : 0.08} color="#ffd5a1" distance={9} />

        {/* Inside-facing convention: the full-height glazing is at negative Z. */}
        <group scale={[-1, 1, 1]}>
          <Room environment={environment} />
          <ArchitecturalDetails onArchiveClick={onArchiveClick} onLettersClick={onLettersClick} />

          {/* Authored sofa now faces the glass instead of presenting its back to the window. */}
          <Rug position={[1.05, 0.012, -4.25]} size={[9.1, 6.9]} color="#b5a796" />
          <HeroSofa position={[0.25, 0, -1.85]} rotationY={0} targetWidth={6.5} />
          <group position={[1.22, 0, -4.9]} scale={1.28}><CoffeeTable /></group>
          <FloorLamp position={[-3.85, 0, -2.55]} />

          <Rug position={[12.0, 0.01, -4.15]} size={[4.75, 12.0]} color="#978b7d" />
          <Rug position={[-11.95, 0.011, 9.0]} size={[5.6, 5.45]} color="#c1b09e" />
          <group position={[-11.95, 0, 9.55]} scale={1.14}><Bed rotationY={Math.PI} /></group>
          <DeskKeepsakes position={[11.8, 0.94, -4.25]} rotationY={Math.PI / 2} />

          <KeepsakeCabinet position={[-7.0, 0, -5.62]} rotationY={0} onClick={onGiftsClick} />
          <PajamaWardrobe position={[-10.55, 0, -5.62]} rotationY={0} onClick={onGiftsClick} />

          {/* Product-reference gifts: the 520 coin is hidden inside the flower-box set; the music gift is a bronze Christmas lantern. */}
          <Gift520Reference position={[-6.55, 0.82, -4.72]} rotationY={0.08} onInspect={onGiftsClick} />
          <ChristmasMusicLanternReference position={[-8.35, 0.72, -4.68]} rotationY={-0.08} onInspect={onGiftsClick} />

          <WallArt position={[9.2, 2.05, -0.15]} rotationY={Math.PI / 2} size={[1.25, 1.55]} color="#6e8276" />

          {/* The old primitive humanoid has intentionally been removed. A companion only returns when a proper rigged/skinned asset is available. */}
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
