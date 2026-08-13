'use client';

import { RoundedBox } from '@react-three/drei';

export default function Bed({ position = [0, 0, 0], rotationY = 0 }: { position?: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox args={[1.82,0.28,2.22]} radius={0.08} smoothness={5} position={[0,0.24,0]} castShadow receiveShadow><meshStandardMaterial color="#80644f" roughness={0.74} /></RoundedBox>
      <RoundedBox args={[1.72,0.24,2.12]} radius={0.1} smoothness={5} position={[0,0.47,0]} castShadow><meshStandardMaterial color="#eee7dc" roughness={0.94} /></RoundedBox>
      <RoundedBox args={[1.72,0.16,1.62]} radius={0.08} smoothness={5} position={[0,0.64,0.22]} castShadow><meshStandardMaterial color="#c9b9a6" roughness={0.95} /></RoundedBox>
      <RoundedBox args={[1.9,1.08,0.16]} radius={0.1} smoothness={5} position={[0,0.88,-1.08]} castShadow><meshStandardMaterial color="#92745e" roughness={0.9} /></RoundedBox>
      {[-0.43,0.43].map((x)=><RoundedBox key={x} args={[0.68,0.2,0.42]} radius={0.08} smoothness={5} position={[x,0.72,-0.76]} rotation={[0.08,0,x*0.04]} castShadow><meshStandardMaterial color="#f0ebe3" roughness={0.96} /></RoundedBox>)}
      <RoundedBox args={[0.9,0.07,0.52]} radius={0.045} smoothness={4} position={[0,0.75,0.55]} rotation={[0.03,0,0]} castShadow><meshStandardMaterial color="#9a7359" roughness={0.86} /></RoundedBox>
      {[-0.72,0.72].map((x)=><mesh key={x} position={[x,0.08,0.8]} castShadow><cylinderGeometry args={[0.035,0.045,0.15,12]} /><meshStandardMaterial color="#b19469" metalness={0.34} roughness={0.32} /></mesh>)}
    </group>
  );
}
