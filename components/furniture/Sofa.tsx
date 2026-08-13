'use client';

import { RoundedBox } from '@react-three/drei';

export default function Sofa({ position = [0, 0, 0], rotationY = 0 }: { position?: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox args={[2.36, 0.34, 0.96]} radius={0.11} smoothness={5} position={[0, 0.31, 0]} castShadow receiveShadow><meshStandardMaterial color="#d7c9b8" roughness={0.86} /></RoundedBox>
      <RoundedBox args={[2.26, 0.62, 0.2]} radius={0.09} smoothness={5} position={[0, 0.73, -0.36]} castShadow><meshStandardMaterial color="#c9b9a7" roughness={0.9} /></RoundedBox>
      {[-1.03, 1.03].map((side) => <RoundedBox key={side} args={[0.2,0.42,0.92]} radius={0.075} smoothness={4} position={[side,0.5,0]} castShadow><meshStandardMaterial color="#bca995" roughness={0.88} /></RoundedBox>)}
      {[-0.58,0.58].map((x) => <RoundedBox key={x} args={[1.02,0.17,0.76]} radius={0.07} smoothness={5} position={[x,0.57,0.06]} castShadow><meshStandardMaterial color="#e3d8ca" roughness={0.94} /></RoundedBox>)}
      <RoundedBox args={[0.42,0.43,0.12]} radius={0.055} smoothness={4} position={[-0.7,0.82,-0.16]} rotation={[0.08,0.1,-0.13]} castShadow><meshStandardMaterial color="#7f644f" roughness={0.82} /></RoundedBox>
      <RoundedBox args={[0.4,0.4,0.12]} radius={0.055} smoothness={4} position={[0.72,0.8,-0.16]} rotation={[0.04,-0.08,0.1]} castShadow><meshStandardMaterial color="#9f8065" roughness={0.84} /></RoundedBox>
      {[[-0.96,-0.36],[0.96,-0.36],[-0.96,0.36],[0.96,0.36]].map(([x,z]) => <mesh key={`${x}-${z}`} position={[x,0.08,z]} castShadow><cylinderGeometry args={[0.035,0.045,0.16,12]} /><meshStandardMaterial color="#6f563e" metalness={0.2} roughness={0.45} /></mesh>)}
    </group>
  );
}
