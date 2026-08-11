'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { createFloorTexture, createWallTexture, createHKNightTexture } from '@/lib/textures';

export const ROOM_WIDTH = 10;
export const ROOM_DEPTH = 10;
export const ROOM_HEIGHT = 4.2; // taller ceiling than a typical prototype (checklist item)

export default function Room() {
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

  const nightTexture = useMemo(() => createHKNightTexture(), []);

  const halfW = ROOM_WIDTH / 2;
  const halfD = ROOM_DEPTH / 2;

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial map={floorTexture} roughness={0.75} />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_HEIGHT, 0]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial color="#f5f2ec" roughness={0.95} />
      </mesh>

      {/* Back wall (with window showing the harbour) */}
      <mesh position={[0, ROOM_HEIGHT / 2, -halfD]} receiveShadow>
        <planeGeometry args={[ROOM_WIDTH, ROOM_HEIGHT]} />
        <meshStandardMaterial map={wallTexture} roughness={0.9} />
      </mesh>
      <mesh position={[0, ROOM_HEIGHT * 0.55, -halfD + 0.02]}>
        <planeGeometry args={[ROOM_WIDTH * 0.55, ROOM_HEIGHT * 0.5]} />
        <meshBasicMaterial map={nightTexture} toneMapped={false} />
      </mesh>
      {/* window frame */}
      <lineSegments position={[0, ROOM_HEIGHT * 0.55, -halfD + 0.04]}>
        <edgesGeometry args={[new THREE.PlaneGeometry(ROOM_WIDTH * 0.55, ROOM_HEIGHT * 0.5)]} />
        <lineBasicMaterial color="#2b2b2b" />
      </lineSegments>

      {/* Side walls */}
      <mesh position={[-halfW, ROOM_HEIGHT / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[ROOM_DEPTH, ROOM_HEIGHT]} />
        <meshStandardMaterial map={wallTexture} roughness={0.9} />
      </mesh>
      <mesh position={[halfW, ROOM_HEIGHT / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[ROOM_DEPTH, ROOM_HEIGHT]} />
        <meshStandardMaterial map={wallTexture} roughness={0.9} />
      </mesh>

      {/* Front wall (behind camera spawn, keeps the room enclosed) */}
      <mesh position={[0, ROOM_HEIGHT / 2, halfD]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[ROOM_WIDTH, ROOM_HEIGHT]} />
        <meshStandardMaterial map={wallTexture} roughness={0.9} />
      </mesh>
    </group>
  );
}
