'use client';

import { useMemo } from 'react';
import { createRugTexture } from '@/lib/textures';

export default function Rug({
  position = [0, 0.005, 0] as [number, number, number],
  size = [2.6, 1.8] as [number, number],
  color = '#b9aa98',
}: {
  position?: [number, number, number];
  size?: [number, number];
  color?: string;
}) {
  const texture = useMemo(() => createRugTexture(256, color), [color]);
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={size} />
        <meshStandardMaterial map={texture} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <planeGeometry args={[size[0] - 0.18, size[1] - 0.18]} />
        <meshStandardMaterial color="#d8ccbc" transparent opacity={0.12} roughness={1} />
      </mesh>
      {Array.from({ length: 28 }).map((_, index) => {
        const x = -size[0] / 2 + (index / 27) * size[0];
        return (
          <mesh key={index} position={[x, 0.003, size[1] / 2 + 0.025]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.012, 0.07]} />
            <meshStandardMaterial color="#b7a792" roughness={1} />
          </mesh>
        );
      })}
    </group>
  );
}