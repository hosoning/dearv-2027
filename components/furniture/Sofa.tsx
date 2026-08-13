'use client';

import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { createFabricTexture } from '@/lib/textures';

export default function Sofa({ position = [0, 0, 0], rotationY = 0 }: { position?: [number, number, number]; rotationY?: number }) {
  const warmFabric = useMemo(() => createFabricTexture(256, '#cbbcab'), []);
  const lightFabric = useMemo(() => createFabricTexture(256, '#e0d5c8'), []);
  const darkerFabric = useMemo(() => createFabricTexture(256, '#b9a590'), []);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox args={[2.42, 0.36, 1.02]} radius={0.15} smoothness={7} position={[0, 0.31, 0]} castShadow receiveShadow>
        <meshStandardMaterial map={warmFabric} roughness={0.96} />
      </RoundedBox>
      <RoundedBox args={[2.22, 0.66, 0.22]} radius={0.12} smoothness={7} position={[0, 0.75, -0.37]} rotation={[-0.08, 0, 0]} castShadow>
        <meshStandardMaterial map={warmFabric} roughness={0.98} />
      </RoundedBox>
      {[-1.08, 1.08].map((side) => (
        <RoundedBox key={side} args={[0.26, 0.5, 0.94]} radius={0.13} smoothness={7} position={[side, 0.51, 0.01]} rotation={[0, 0, -side * 0.035]} castShadow>
          <meshStandardMaterial map={darkerFabric} roughness={0.97} />
        </RoundedBox>
      ))}
      {[-0.56, 0.56].map((x) => (
        <group key={x}>
          <RoundedBox args={[1.01, 0.2, 0.77]} radius={0.095} smoothness={7} position={[x, 0.58, 0.08]} castShadow>
            <meshStandardMaterial map={lightFabric} roughness={0.99} />
          </RoundedBox>
          <mesh position={[x, 0.685, 0.08]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.76, 0.52]} />
            <meshBasicMaterial color="#c7b8a8" transparent opacity={0.12} />
          </mesh>
        </group>
      ))}
      <RoundedBox args={[0.42, 0.43, 0.12]} radius={0.055} smoothness={4} position={[-0.7, 0.82, -0.16]} rotation={[0.08, 0.1, -0.13]} castShadow>
        <meshStandardMaterial color="#7f644f" roughness={0.92} />
      </RoundedBox>
      <RoundedBox args={[0.4, 0.4, 0.12]} radius={0.055} smoothness={4} position={[0.72, 0.8, -0.16]} rotation={[0.04, -0.08, 0.1]} castShadow>
        <meshStandardMaterial color="#9f8065" roughness={0.94} />
      </RoundedBox>
      {[[-0.96, -0.36], [0.96, -0.36], [-0.96, 0.36], [0.96, 0.36]].map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, 0.08, z]} castShadow>
          <cylinderGeometry args={[0.035, 0.045, 0.16, 12]} />
          <meshStandardMaterial color="#6f563e" metalness={0.2} roughness={0.45} />
        </mesh>
      ))}
      {[-0.72, -0.36, 0, 0.36, 0.72].map((x) => (
        <mesh key={`seam-${x}`} position={[x, 0.76, -0.49]} rotation={[0.08, 0, 0]}>
          <boxGeometry args={[0.01, 0.48, 0.006]} />
          <meshStandardMaterial color="#9b8978" roughness={1} />
        </mesh>
      ))}
      {[-0.5, 0.5].map((x) => (
        <mesh key={`piping-${x}`} position={[x, 0.66, 0.45]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.008, 0.008, 0.9, 8]} />
          <meshStandardMaterial color="#cab8a5" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}