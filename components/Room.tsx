'use client';

import { useMemo } from 'react';
import { createFloorTexture, createWallTexture } from '@/lib/textures';
import type { ResolvedEnvironment } from '@/lib/environment';
import WindowWorld from './WindowWorld';

export const ROOM_WIDTH = 10;
export const ROOM_DEPTH = 10;
export const ROOM_HEIGHT = 4.2;

export default function Room({ environment }: { environment: ResolvedEnvironment }) {
  const floorTexture = useMemo(() => {
    const tex = createFloorTexture();
    tex.repeat.set(ROOM_WIDTH / 1.5, ROOM_DEPTH / 1.5);
    return tex;
  }, []);

  const wallTexture = useMemo(() => {
    const tex = createWallTexture();
    tex.repeat.set(4, 2);
    return tex;
  }, []);

  const halfW = ROOM_WIDTH / 2;
  const halfD = ROOM_DEPTH / 2;
  const windowWidth = 5.7;
  const windowHeight = 2.25;
  const windowBottom = 1.0;
  const windowCenterY = windowBottom + windowHeight / 2;
  const sideWidth = (ROOM_WIDTH - windowWidth) / 2;
  const topHeight = ROOM_HEIGHT - windowBottom - windowHeight;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial map={floorTexture} roughness={0.68} />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_HEIGHT, 0]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial color="#eee9df" roughness={0.93} />
      </mesh>

      <WindowWorld environment={environment} />

      <mesh position={[-(windowWidth / 2 + sideWidth / 2), ROOM_HEIGHT / 2, -halfD]} receiveShadow>
        <boxGeometry args={[sideWidth, ROOM_HEIGHT, 0.12]} />
        <meshStandardMaterial map={wallTexture} roughness={0.86} />
      </mesh>
      <mesh position={[(windowWidth / 2 + sideWidth / 2), ROOM_HEIGHT / 2, -halfD]} receiveShadow>
        <boxGeometry args={[sideWidth, ROOM_HEIGHT, 0.12]} />
        <meshStandardMaterial map={wallTexture} roughness={0.86} />
      </mesh>
      <mesh position={[0, windowBottom / 2, -halfD]} receiveShadow>
        <boxGeometry args={[windowWidth, windowBottom, 0.12]} />
        <meshStandardMaterial map={wallTexture} roughness={0.86} />
      </mesh>
      <mesh position={[0, ROOM_HEIGHT - topHeight / 2, -halfD]} receiveShadow>
        <boxGeometry args={[windowWidth, topHeight, 0.12]} />
        <meshStandardMaterial map={wallTexture} roughness={0.86} />
      </mesh>

      <mesh position={[0, windowCenterY, -halfD + 0.075]}>
        <boxGeometry args={[windowWidth + 0.12, 0.075, 0.08]} />
        <meshStandardMaterial color="#3a332d" metalness={0.45} roughness={0.4} />
      </mesh>
      <mesh position={[0, windowBottom, -halfD + 0.08]}>
        <boxGeometry args={[windowWidth + 0.22, 0.1, 0.12]} />
        <meshStandardMaterial color="#4b4239" roughness={0.52} />
      </mesh>
      {[-windowWidth / 2, 0, windowWidth / 2].map((x) => (
        <mesh key={x} position={[x, windowCenterY, -halfD + 0.075]}>
          <boxGeometry args={[0.075, windowHeight + 0.15, 0.08]} />
          <meshStandardMaterial color="#3a332d" metalness={0.45} roughness={0.4} />
        </mesh>
      ))}

      <mesh position={[-halfW, ROOM_HEIGHT / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[ROOM_DEPTH, ROOM_HEIGHT]} />
        <meshStandardMaterial map={wallTexture} roughness={0.9} />
      </mesh>
      <mesh position={[halfW, ROOM_HEIGHT / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[ROOM_DEPTH, ROOM_HEIGHT]} />
        <meshStandardMaterial map={wallTexture} roughness={0.9} />
      </mesh>

      <mesh position={[0, ROOM_HEIGHT / 2, halfD]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[ROOM_WIDTH, ROOM_HEIGHT]} />
        <meshStandardMaterial map={wallTexture} roughness={0.9} />
      </mesh>

      <mesh position={[0, 0.08, halfD - 0.06]}>
        <boxGeometry args={[ROOM_WIDTH, 0.16, 0.12]} />
        <meshStandardMaterial color="#4c3d32" roughness={0.65} />
      </mesh>
      <mesh position={[-halfW + 0.06, 0.08, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[ROOM_DEPTH, 0.16, 0.12]} />
        <meshStandardMaterial color="#4c3d32" roughness={0.65} />
      </mesh>
      <mesh position={[halfW - 0.06, 0.08, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[ROOM_DEPTH, 0.16, 0.12]} />
        <meshStandardMaterial color="#4c3d32" roughness={0.65} />
      </mesh>
    </group>
  );
}
