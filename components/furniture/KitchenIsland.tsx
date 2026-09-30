'use client';

import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { createMarbleTexture } from '@/lib/textures';

export default function KitchenIsland({ position = [0, 0, 0], rotationY = 0 }: { position?: [number, number, number]; rotationY?: number }) {
  const marble = useMemo(() => createMarbleTexture(), []);
  return (
    <group position={position} rotation={[0,rotationY,0]}>
      <RoundedBox args={[1.7,0.86,0.82]} radius={0.045} smoothness={4} position={[0,0.45,0]} castShadow receiveShadow><meshStandardMaterial color="#d8d0c4" roughness={0.68} /></RoundedBox>
      <RoundedBox args={[1.84,0.08,0.94]} radius={0.035} smoothness={4} position={[0,0.93,0]} castShadow><meshStandardMaterial map={marble} roughness={0.22} metalness={0.03} /></RoundedBox>
      {[-0.52,0,0.52].map((x)=><group key={x}><mesh position={[x,0.47,0.42]}><boxGeometry args={[0.43,0.68,0.018]} /><meshStandardMaterial color="#b9ab99" roughness={0.58} /></mesh><mesh position={[x,0.48,0.435]}><boxGeometry args={[0.12,0.018,0.014]} /><meshStandardMaterial color="#b09264" metalness={0.7} roughness={0.22} /></mesh></group>)}
      <mesh position={[0.36,1.02,-0.06]} castShadow><cylinderGeometry args={[0.03,0.035,0.26,16]} /><meshStandardMaterial color="#aa8b64" metalness={0.75} roughness={0.22} /></mesh>
      <mesh position={[0.36,1.16,-0.04]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[0.025,0.025,0.18,14]} /><meshStandardMaterial color="#aa8b64" metalness={0.75} roughness={0.22} /></mesh>
      {[-0.45,0.45].map((x)=><group key={x} position={[x,0,0.73]}><mesh position={[0,0.43,0]} castShadow><cylinderGeometry args={[0.23,0.25,0.12,28]} /><meshStandardMaterial color="#9b856e" roughness={0.82} /></mesh><mesh position={[0,0.22,0]}><cylinderGeometry args={[0.025,0.035,0.43,12]} /><meshStandardMaterial color="#8d7255" metalness={0.22} roughness={0.38} /></mesh><mesh position={[0,0.03,0]}><cylinderGeometry args={[0.15,0.18,0.04,20]} /><meshStandardMaterial color="#8d7255" metalness={0.22} roughness={0.38} /></mesh></group>)}
    </group>
  );
}
