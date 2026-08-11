'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// A translucent glass-like companion figure standing in the room.
// Built from a manual joint hierarchy (no skeleton/skinning) so each limb
// is a THREE.Group that can be rotated independently — mirrors the original
// prototype's approach, just expressed as R3F refs instead of raw Three calls.

const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: '#bcdcff',
  transmission: 0.9,
  thickness: 0.4,
  roughness: 0.15,
  metalness: 0,
  ior: 1.4,
  transparent: true,
  opacity: 0.85,
});

export default function Character({ position = [0, 0, 0] as [number, number, number], onClick }: { position?: [number, number, number]; onClick?: () => void }) {
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const t0 = useRef(Math.random() * 10);

  useFrame((state) => {
    const t = state.clock.elapsedTime + t0.current;
    const sway = Math.sin(t * 0.8) * 0.06;
    if (leftArm.current) leftArm.current.rotation.x = sway;
    if (rightArm.current) rightArm.current.rotation.x = -sway;
  });

  const material = useMemo(() => glassMaterial, []);

  return (
    <group position={position} onClick={onClick}>
      {/* torso */}
      <mesh position={[0, 1.05, 0]} material={material} castShadow>
        <capsuleGeometry args={[0.18, 0.5, 4, 8]} />
      </mesh>
      {/* head */}
      <mesh position={[0, 1.65, 0]} material={material} castShadow>
        <sphereGeometry args={[0.15, 16, 16]} />
      </mesh>
      {/* arms — each a pivoting joint group */}
      <group ref={leftArm} position={[-0.26, 1.35, 0]}>
        <mesh position={[0, -0.25, 0]} material={material} castShadow>
          <capsuleGeometry args={[0.05, 0.45, 4, 8]} />
        </mesh>
      </group>
      <group ref={rightArm} position={[0.26, 1.35, 0]}>
        <mesh position={[0, -0.25, 0]} material={material} castShadow>
          <capsuleGeometry args={[0.05, 0.45, 4, 8]} />
        </mesh>
      </group>
      {/* legs */}
      {[-0.1, 0.1].map((x) => (
        <mesh key={x} position={[x, 0.4, 0]} material={material} castShadow>
          <capsuleGeometry args={[0.07, 0.55, 4, 8]} />
        </mesh>
      ))}
    </group>
  );
}
