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
import CoffeeTable from './furniture/CoffeeTable';
import FloorLamp from './furniture/FloorLamp';
import TVConsole from './furniture/TVConsole';
import Rug from './furniture/Rug';
import WallArt from './furniture/WallArt';
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

        <Rug position={[-2.6, 0.005, -3.5]} size={[2.6, 2]} />

        <Sofa position={[-2.6, 0, -3.2]} rotationY={Math.PI} />
        <CoffeeTable position={[-2.6, 0, -3.85]} />
        <FloorLamp position={[-1.1, 0, -3.6]} />
        <TVConsole position={[-4.6, 0, -3.2]} rotationY={Math.PI / 2} />

        <DiningTable position={[2.6, 0, -2.6]} />
        <KitchenIsland position={[3.6, 0, 0.5]} rotationY={Math.PI / 2} />
        <Bookshelf position={[-4.55, 0, -1]} rotationY={Math.PI / 2} />
        <Bed position={[-2.8, 0, 3]} />
        <Desk position={[3.9, 0, 3.4]} rotationY={-Math.PI / 2} />

        <WallArt position={[4.97, 1.7, -1.6]} rotationY={-Math.PI / 2} size={[0.55, 0.75]} color="#7a9e8f" />
        <WallArt position={[4.97, 1.7, 1.2]} rotationY={-Math.PI / 2} size={[0.5, 0.5]} color="#c48a5c" />

        <Character position={[0.6, 0, -1]} onClick={onCompanionClick} />

        {children}

        <PlayerControls />
      </Suspense>
    </Canvas>
  );
}
