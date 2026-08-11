'use client';

import { Suspense, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import Room from './Room';
import Sofa from './furniture/Sofa';
import DiningTable from './furniture/DiningTable';
import KitchenIsland from './furniture/KitchenIsland';
import Bookshelf from './furniture/Bookshelf';
import Bed from './furniture/Bed';
import Desk from './furniture/Desk';
import Character from './Character';
import PlayerControls from './PlayerControls';

export default function Scene({ onCompanionClick, children }: { onCompanionClick?: () => void; children?: ReactNode }) {
  return (
    <Canvas shadows camera={{ fov: 65, near: 0.05, far: 60 }} className="!fixed inset-0">
      <Suspense fallback={null}>
        <ambientLight intensity={0.55} />
        <directionalLight
          position={[3, 5, 2]}
          intensity={1.1}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[0, 3.6, -3]} intensity={0.4} color="#ffd9a0" />

        <Room />

        <Sofa position={[-2.6, 0, -3.2]} rotationY={Math.PI} />
        <DiningTable position={[2.6, 0, -2.6]} />
        <KitchenIsland position={[3.6, 0, 0.5]} rotationY={Math.PI / 2} />
        <Bookshelf position={[-4.55, 0, -1]} rotationY={Math.PI / 2} />
        <Bed position={[-2.8, 0, 3]} />
        <Desk position={[3.9, 0, 3.4]} rotationY={-Math.PI / 2} />

        <Character position={[0.6, 0, -1]} onClick={onCompanionClick} />

        {children}

        <PlayerControls />
      </Suspense>
    </Canvas>
  );
}
