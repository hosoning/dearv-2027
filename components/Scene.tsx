'use client';

import { Suspense, type ReactNode } from 'react';
import { Canvas, type ThreeEvent } from '@react-three/fiber';
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

function interactive(handler?: () => void) {
  return (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    handler?.();
  };
}

function GlassCabinet({ onClick }: { onClick?: () => void }) {
  return (
    <group position={[3.55, 0, -4.25]} onClick={interactive(onClick)}>
      <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.05, 2.2, 0.42]} />
        <meshStandardMaterial color="#5b4635" roughness={0.55} />
      </mesh>
      <mesh position={[0, 1.1, 0.235]}>
        <boxGeometry args={[1.82, 1.98, 0.025]} />
        <meshPhysicalMaterial color="#d9e5e5" transmission={0.76} transparent opacity={0.34} roughness={0.08} metalness={0.08} />
      </mesh>
      {[0.58, 1.12, 1.66].map((y) => (
        <mesh key={y} position={[0, y, 0.16]}>
          <boxGeometry args={[1.72, 0.035, 0.31]} />
          <meshStandardMaterial color="#a78b69" metalness={0.1} roughness={0.55} />
        </mesh>
      ))}
      <pointLight position={[0, 1.85, 0.18]} intensity={0.3} distance={2} color="#ffe2ad" />
    </group>
  );
}

function Wardrobe({ onClick }: { onClick?: () => void }) {
  return (
    <group position={[-3.35, 0, 4.28]} onClick={interactive(onClick)}>
      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[2.5, 2.3, 0.6]} />
        <meshStandardMaterial color="#695342" roughness={0.62} />
      </mesh>
      <mesh position={[0, 1.22, -0.31]}>
        <boxGeometry args={[0.035, 2.05, 0.03]} />
        <meshStandardMaterial color="#a58b6c" metalness={0.34} />
      </mesh>
      <mesh position={[-0.14, 1.2, -0.335]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial color="#c7a879" metalness={0.68} roughness={0.25} />
      </mesh>
      <mesh position={[0.14, 1.2, -0.335]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial color="#c7a879" metalness={0.68} roughness={0.25} />
      </mesh>
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
  const ambient = isNight ? 0.3 : 0.62;
  const sun = isNight ? 0.28 : 1.15;

  return (
    <Canvas shadows camera={{ fov: 65, near: 0.05, far: 80 }} dpr={[1, 1.7]} className="!fixed inset-0">
      <Suspense fallback={null}>
        <color attach="background" args={[isNight ? '#10131a' : '#d8d2c7']} />
        <ambientLight intensity={ambient} color={isNight ? '#aab7d4' : '#fff4df'} />
        <directionalLight
          position={isNight ? [-3, 4, 1] : [3.5, 5.8, -3.2]}
          intensity={sun}
          color={isNight ? '#b8c8ec' : '#ffe4b0'}
          castShadow
          shadow-mapSize={[1536, 1536]}
          shadow-camera-far={22}
        />
        <pointLight position={[-1.2, 3.6, -2.9]} intensity={isNight ? 0.72 : 0.28} color="#ffd19a" distance={7} />
        <pointLight position={[3.6, 2.8, 2.8]} intensity={isNight ? 0.45 : 0.15} color="#ffe1ae" distance={5} />

        <Room environment={environment} />

        <Rug position={[-2.6, 0.005, -3.5]} size={[2.6, 2]} />
        <Sofa position={[-2.6, 0, -3.2]} rotationY={Math.PI} />
        <CoffeeTable position={[-2.6, 0, -3.85]} />
        <FloorLamp position={[-1.1, 0, -3.6]} />
        <TVConsole position={[-4.6, 0, -3.2]} rotationY={Math.PI / 2} />

        <DiningTable position={[2.15, 0, -1.85]} />
        <KitchenIsland position={[3.65, 0, 0.65]} rotationY={Math.PI / 2} />
        <group onClick={interactive(onArchiveClick)}>
          <Bookshelf position={[-4.55, 0, -0.65]} rotationY={Math.PI / 2} />
        </group>
        <Bed position={[-2.55, 0, 2.55]} />
        <group onClick={interactive(onLettersClick)}>
          <Desk position={[3.9, 0, 3.15]} rotationY={-Math.PI / 2} />
        </group>
        <GlassCabinet onClick={onGiftsClick} />
        <Wardrobe onClick={onGiftsClick} />

        <WallArt position={[4.97, 1.7, -0.7]} rotationY={-Math.PI / 2} size={[0.55, 0.75]} color="#7a9e8f" />
        <WallArt position={[4.97, 1.7, 1.55]} rotationY={-Math.PI / 2} size={[0.5, 0.5]} color="#c48a5c" />

        <Character position={[0.25, 0, -0.25]} onClick={onCompanionClick} />
        {children}
        <PlayerControls />
      </Suspense>
    </Canvas>
  );
}
