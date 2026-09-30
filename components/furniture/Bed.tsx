'use client';

import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { createFabricTexture } from '@/lib/textures';

export default function Bed({ position = [0, 0, 0], rotationY = 0 }: { position?: [number, number, number]; rotationY?: number }) {
  const headboardFabric = useMemo(() => createFabricTexture(256, '#896b56'), []);
  const linen = useMemo(() => createFabricTexture(256, '#eee9e1'), []);
  const duvet = useMemo(() => createFabricTexture(256, '#b9a590'), []);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox args={[2.04, 0.3, 2.5]} radius={0.1} smoothness={7} position={[0, 0.24, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#765b48" roughness={0.8} />
      </RoundedBox>
      <RoundedBox args={[1.91, 0.28, 2.36]} radius={0.13} smoothness={7} position={[0, 0.5, 0]} castShadow>
        <meshStandardMaterial map={linen} roughness={0.99} />
      </RoundedBox>
      <RoundedBox args={[1.94, 0.18, 1.83]} radius={0.11} smoothness={7} position={[0, 0.68, 0.25]} castShadow>
        <meshStandardMaterial map={duvet} roughness={0.98} />
      </RoundedBox>
      <RoundedBox args={[2.08, 1.18, 0.19]} radius={0.12} smoothness={7} position={[0, 0.94, -1.18]} castShadow>
        <meshStandardMaterial map={headboardFabric} roughness={0.96} />
      </RoundedBox>
      {[-0.52, 0, 0.52].map((x) => (
        <mesh key={`headboard-channel-${x}`} position={[x, 0.94, -1.285]}>
          <boxGeometry args={[0.016, 0.82, 0.008]} />
          <meshStandardMaterial color="#6f5443" roughness={1} />
        </mesh>
      ))}
      {[-0.43, 0.43].map((x) => (
        <RoundedBox key={x} args={[0.68, 0.2, 0.42]} radius={0.08} smoothness={5} position={[x, 0.72, -0.76]} rotation={[0.08, 0, x * 0.04]} castShadow>
          <meshStandardMaterial map={linen} roughness={0.98} />
        </RoundedBox>
      ))}
      <RoundedBox args={[1.18, 0.075, 0.62]} radius={0.055} smoothness={5} position={[0, 0.79, 0.65]} rotation={[0.03, 0, 0]} castShadow>
        <meshStandardMaterial color="#8c6a56" roughness={0.92} />
      </RoundedBox>
      {[-0.58, 0, 0.58].map((x) => (
        <mesh key={x} position={[x, 0.785, 0.65]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.012, 0.53]} />
          <meshBasicMaterial color="#d2c3b2" transparent opacity={0.22} />
        </mesh>
      ))}
      <mesh position={[0, 0.79, 1.04]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.62, 0.16]} />
        <meshStandardMaterial color="#a78972" roughness={0.95} />
      </mesh>
      {[-0.72, 0.72].map((x) => (
        <mesh key={x} position={[x, 0.08, 0.8]} castShadow>
          <cylinderGeometry args={[0.035, 0.045, 0.15, 12]} />
          <meshStandardMaterial color="#b19469" metalness={0.34} roughness={0.32} />
        </mesh>
      ))}
    </group>
  );
}