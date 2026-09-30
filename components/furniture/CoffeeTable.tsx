'use client';

export default function CoffeeTable({ position = [0, 0, 0], rotationY = 0 }: { position?: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[-0.22,0.33,0]} castShadow receiveShadow><cylinderGeometry args={[0.48,0.5,0.08,48]} /><meshStandardMaterial color="#d6c9b8" roughness={0.72} metalness={0.02} /></mesh>
      <mesh position={[0.34,0.27,0.08]} castShadow receiveShadow><cylinderGeometry args={[0.34,0.36,0.07,48]} /><meshStandardMaterial color="#bfa98e" roughness={0.68} metalness={0.03} /></mesh>
      <mesh position={[-0.22,0.16,0]} castShadow><cylinderGeometry args={[0.16,0.22,0.28,32]} /><meshStandardMaterial color="#6e5542" roughness={0.54} /></mesh>
      <mesh position={[0.34,0.13,0.08]} castShadow><cylinderGeometry args={[0.12,0.17,0.23,28]} /><meshStandardMaterial color="#8b6d54" roughness={0.56} /></mesh>
      <mesh position={[-0.06,0.39,-0.08]} rotation={[0.04,0.22,-0.04]} castShadow><boxGeometry args={[0.28,0.025,0.2]} /><meshStandardMaterial color="#6e4e38" roughness={0.8} /></mesh>
      <mesh position={[0.12,0.4,0.02]}><cylinderGeometry args={[0.055,0.05,0.1,20]} /><meshPhysicalMaterial color="#d7d9d4" transmission={0.5} transparent opacity={0.75} roughness={0.18} /></mesh>
    </group>
  );
}
