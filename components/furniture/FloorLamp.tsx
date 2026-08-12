'use client';

export default function FloorLamp({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.02, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.15, 0.04, 20]} />
        <meshStandardMaterial color="#2b2320" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 1.5, 8]} />
        <meshStandardMaterial color="#4a4038" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.55, 0]} castShadow>
        <coneGeometry args={[0.22, 0.32, 20, 1, true]} />
        <meshStandardMaterial color="#e8dcc4" roughness={0.7} side={2} emissive="#3a2f1a" emissiveIntensity={0.15} />
      </mesh>
      <pointLight position={[0, 1.45, 0]} intensity={0.5} distance={3} color="#ffd9a0" />
    </group>
  );
}
