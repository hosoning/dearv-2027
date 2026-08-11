'use client';

import { useMemo } from 'react';
import { createMarbleTexture } from '@/lib/textures';

export default function KitchenIsland({ position = [0, 0, 0], rotationY = 0 }: { position?: [number, number, number]; rotationY?: number }) {
  const marble = useMemo(() => createMarbleTexture(), []);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.9, 0.8]} />
        <meshStandardMaterial color="#e9e4da" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.93, 0]} castShadow>
        <boxGeometry args={[1.7, 0.06, 0.9]} />
        <meshStandardMaterial map={marble} roughness={0.25} metalness={0.05} />
      </mesh>
      {[-0.5, 0, 0.5].map((x) => (
        <mesh key={x} position={[x, 0.45, 0.41]}>
          <boxGeometry args={[0.4, 0.7, 0.02]} />
          <meshStandardMaterial color="#c9c2b4" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}
