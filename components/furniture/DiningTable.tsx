'use client';

import { RoundedBox } from '@react-three/drei';

function Chair({ position, rotationY = 0 }: { position: [number,number,number]; rotationY?: number }) {
  return <group position={position} rotation={[0,rotationY,0]}><RoundedBox args={[0.42,0.12,0.44]} radius={0.055} smoothness={4} position={[0,0.47,0]} castShadow><meshStandardMaterial color="#c4b19b" roughness={0.9} /></RoundedBox><RoundedBox args={[0.42,0.58,0.1]} radius={0.05} smoothness={4} position={[0,0.78,0.18]} castShadow><meshStandardMaterial color="#b49e87" roughness={0.88} /></RoundedBox>{[-0.16,0.16].flatMap((x)=>[-0.15,0.15].map((z)=>[x,z] as const)).map(([x,z])=><mesh key={`${x}-${z}`} position={[x,0.23,z]}><cylinderGeometry args={[0.018,0.025,0.46,10]} /><meshStandardMaterial color="#80664c" metalness={0.18} roughness={0.42} /></mesh>)}</group>;
}

export default function DiningTable({ position = [0, 0, 0], rotationY = 0 }: { position?: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0,rotationY,0]}>
      <mesh position={[0,0.76,0]} castShadow receiveShadow scale={[1.55,1,0.83]}><cylinderGeometry args={[0.62,0.64,0.08,56]} /><meshStandardMaterial color="#d3c4af" roughness={0.62} /></mesh>
      <mesh position={[0,0.38,0]} castShadow scale={[1.1,1,0.72]}><cylinderGeometry args={[0.2,0.3,0.72,32]} /><meshStandardMaterial color="#725743" roughness={0.54} /></mesh>
      <mesh position={[0,0.84,0]}><cylinderGeometry args={[0.12,0.1,0.12,28]} /><meshPhysicalMaterial color="#d6c4a8" transmission={0.34} transparent opacity={0.78} roughness={0.2} /></mesh>
      {[[-0.58,0.9,Math.PI],[0.58,0.9,Math.PI],[-0.58,-0.9,0],[0.58,-0.9,0]].map(([x,z,r],i)=><Chair key={i} position={[x,0,z]} rotationY={r} />)}
    </group>
  );
}
