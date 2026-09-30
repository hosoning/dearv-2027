'use client';

import { RoundedBox } from '@react-three/drei';

export default function Desk({ position = [0, 0, 0], rotationY = 0 }: { position?: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox args={[1.48,0.09,0.72]} radius={0.045} smoothness={4} position={[0,0.73,0]} castShadow receiveShadow><meshStandardMaterial color="#5c4030" roughness={0.58} /></RoundedBox>
      <RoundedBox args={[0.58,0.17,0.62]} radius={0.035} smoothness={4} position={[0.36,0.61,0]} castShadow><meshStandardMaterial color="#6d4d39" roughness={0.62} /></RoundedBox>
      {[[-0.62,-0.27],[0.62,-0.27],[-0.62,0.27],[0.62,0.27]].map(([x,z])=><mesh key={`${x}-${z}`} position={[x,0.36,z]} castShadow><cylinderGeometry args={[0.025,0.035,0.72,12]} /><meshStandardMaterial color="#b29568" metalness={0.55} roughness={0.28} /></mesh>)}
      <group position={[0,0,0.62]}>
        <RoundedBox args={[0.52,0.12,0.5]} radius={0.06} smoothness={5} position={[0,0.46,0]} castShadow><meshStandardMaterial color="#b9a48e" roughness={0.88} /></RoundedBox>
        <RoundedBox args={[0.52,0.62,0.12]} radius={0.055} smoothness={5} position={[0,0.78,0.19]} rotation={[-0.08,0,0]} castShadow><meshStandardMaterial color="#aa927c" roughness={0.88} /></RoundedBox>
        {[-0.19,0.19].flatMap((x)=>[-0.18,0.18].map((z)=>[x,z] as const)).map(([x,z])=><mesh key={`${x}-${z}`} position={[x,0.22,z]} castShadow><cylinderGeometry args={[0.02,0.027,0.44,10]} /><meshStandardMaterial color="#8f7356" metalness={0.25} roughness={0.42} /></mesh>)}
      </group>
      <mesh position={[-0.38,0.81,-0.16]} rotation={[-0.08,0.1,0]} castShadow><boxGeometry args={[0.34,0.025,0.22]} /><meshStandardMaterial color="#d6c6b0" roughness={0.84} /></mesh>
      <mesh position={[0.48,1.02,-0.14]} castShadow><cylinderGeometry args={[0.025,0.04,0.42,14]} /><meshStandardMaterial color="#a88a62" metalness={0.7} roughness={0.24} /></mesh>
      <mesh position={[0.48,1.21,-0.14]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[0.11,0.11,0.045,24]} /><meshStandardMaterial color="#d8c6aa" roughness={0.58} /></mesh>
    </group>
  );
}
