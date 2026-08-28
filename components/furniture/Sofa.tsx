'use client';

import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { createFabricTexture } from '@/lib/textures';

export default function Sofa({
  position = [0, 0, 0],
  rotationY = 0,
  width = 2.42,
}: {
  position?: [number, number, number];
  rotationY?: number;
  width?: number;
}) {
  const warmFabric = useMemo(() => createFabricTexture(256, '#cbbcab'), []);
  const lightFabric = useMemo(() => createFabricTexture(256, '#e0d5c8'), []);
  const darkerFabric = useMemo(() => createFabricTexture(256, '#b9a590'), []);

  const seatCount = Math.max(2, Math.round(width / 0.92));
  const innerWidth = width - 0.42;
  const cushionWidth = innerWidth / seatCount - 0.035;
  const seatXs = Array.from({ length: seatCount }, (_, index) => -innerWidth / 2 + (index + 0.5) * (innerWidth / seatCount));

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox args={[width, 0.3, 1.02]} radius={0.15} smoothness={7} position={[0, 0.27, 0]} castShadow receiveShadow>
        <meshStandardMaterial map={warmFabric} roughness={0.96} />
      </RoundedBox>
      <RoundedBox args={[width - 0.22, 0.62, 0.2]} radius={0.11} smoothness={7} position={[0, 0.71, -0.39]} rotation={[-0.08, 0, 0]} castShadow>
        <meshStandardMaterial map={warmFabric} roughness={0.98} />
      </RoundedBox>
      {[-1, 1].map((side) => (
        <RoundedBox key={side} args={[0.25, 0.47, 0.94]} radius={0.12} smoothness={7} position={[side * (width / 2 - 0.12), 0.48, 0.01]} rotation={[0, 0, -side * 0.035]} castShadow>
          <meshStandardMaterial map={darkerFabric} roughness={0.97} />
        </RoundedBox>
      ))}
      {seatXs.map((x) => (
        <group key={x}>
          <RoundedBox args={[cushionWidth, 0.18, 0.76]} radius={0.09} smoothness={7} position={[x, 0.52, 0.08]} castShadow>
            <meshStandardMaterial map={lightFabric} roughness={0.99} />
          </RoundedBox>
          <mesh position={[x, 0.685, 0.08]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[Math.max(0.5, cushionWidth - 0.16), 0.5]} />
            <meshBasicMaterial color="#c7b8a8" transparent opacity={0.12} />
          </mesh>
        </group>
      ))}
      <RoundedBox args={[0.42, 0.43, 0.12]} radius={0.055} smoothness={4} position={[-width * 0.28, 0.79, -0.16]} rotation={[0.08, 0.1, -0.13]} castShadow>
        <meshStandardMaterial color="#7f644f" roughness={0.92} />
      </RoundedBox>
      <RoundedBox args={[0.4, 0.4, 0.12]} radius={0.055} smoothness={4} position={[width * 0.3, 0.77, -0.16]} rotation={[0.04, -0.08, 0.1]} castShadow>
        <meshStandardMaterial color="#9f8065" roughness={0.94} />
      </RoundedBox>
      {[[-width / 2 + 0.28, -0.36], [width / 2 - 0.28, -0.36], [-width / 2 + 0.28, 0.36], [width / 2 - 0.28, 0.36]].map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, 0.08, z]} castShadow>
          <cylinderGeometry args={[0.035, 0.045, 0.16, 12]} />
          <meshStandardMaterial color="#6f563e" metalness={0.2} roughness={0.45} />
        </mesh>
      ))}
      {seatXs.slice(0, -1).map((x, index) => (
        <mesh key={`seam-${x}`} position={[(x + seatXs[index + 1]) / 2, 0.72, -0.49]} rotation={[0.08, 0, 0]}>
          <boxGeometry args={[0.01, 0.48, 0.006]} />
          <meshStandardMaterial color="#9b8978" roughness={1} />
        </mesh>
      ))}
      {seatXs.slice(0, -1).map((x, index) => (
        <mesh key={`piping-${x}`} position={[(x + seatXs[index + 1]) / 2, 0.6, 0.45]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.008, 0.008, 0.7, 8]} />
          <meshStandardMaterial color="#cab8a5" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}
