'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// A translucent spirit-like companion: humanoid head/shoulders/torso/arms,
// but the lower body trails off into an open-ended wisp instead of legs.
// Near-colorless and low-opacity so it reads as a presence rather than a
// solid figure. Joints are manual THREE.Group pivots, not a skinned
// skeleton.

const bodyMaterial = new THREE.MeshPhysicalMaterial({
  color: '#eef6ff',
  transmission: 0.75,
  thickness: 0.35,
  roughness: 0.45,
  metalness: 0,
  ior: 1.2,
  transparent: true,
  opacity: 0.55,
  depthWrite: false,
});

function GhostBody({
  material,
  leftArmRef,
  rightArmRef,
}: {
  material: THREE.Material;
  leftArmRef?: React.RefObject<THREE.Group>;
  rightArmRef?: React.RefObject<THREE.Group>;
}) {
  return (
    <>
      <mesh position={[0, 1.62, 0]} material={material} castShadow>
        <sphereGeometry args={[0.13, 20, 20]} />
      </mesh>
      <mesh position={[0, 1.42, 0]} material={material} castShadow>
        <cylinderGeometry args={[0.2, 0.09, 0.16, 16]} />
      </mesh>
      <mesh position={[0, 1.12, 0]} material={material} castShadow>
        <cylinderGeometry args={[0.2, 0.15, 0.42, 16]} />
      </mesh>
      {/* wispy tail: wide near the hips, tapering to a soft point at the floor */}
      <mesh position={[0, 0.5, 0]} material={material}>
        <cylinderGeometry args={[0.18, 0.02, 1, 20, 1, true]} />
      </mesh>
      <group ref={leftArmRef} position={[-0.24, 1.32, 0]}>
        <mesh position={[0, -0.22, 0]} material={material} castShadow>
          <capsuleGeometry args={[0.045, 0.4, 4, 8]} />
        </mesh>
      </group>
      <group ref={rightArmRef} position={[0.24, 1.32, 0]}>
        <mesh position={[0, -0.22, 0]} material={material} castShadow>
          <capsuleGeometry args={[0.045, 0.4, 4, 8]} />
        </mesh>
      </group>
    </>
  );
}

export default function Character({
  position = [0, 0, 0] as [number, number, number],
  onClick,
}: {
  position?: [number, number, number];
  onClick?: () => void;
}) {
  const floatGroup = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const t0 = useRef(Math.random() * 10);

  useFrame((state) => {
    const t = state.clock.elapsedTime + t0.current;
    const sway = Math.sin(t * 0.8) * 0.06;
    if (leftArm.current) leftArm.current.rotation.x = sway;
    if (rightArm.current) rightArm.current.rotation.x = -sway;
    if (floatGroup.current) floatGroup.current.position.y = Math.sin(t * 0.6) * 0.05;
  });

  const body = useMemo(() => bodyMaterial, []);

  return (
    <group position={position} onClick={onClick}>
      <group ref={floatGroup}>
        <GhostBody material={body} leftArmRef={leftArm} rightArmRef={rightArm} />
      </group>
    </group>
  );
}
