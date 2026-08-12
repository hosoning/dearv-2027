'use client';

export default function CoffeeTable({ position = [0, 0, 0], rotationY = 0 }: { position?: [number, number, number]; rotationY?: number }) {
  const legOffsets: [number, number][] = [
    [-0.42, -0.22],
    [0.42, -0.22],
    [-0.42, 0.22],
    [0.42, 0.22],
  ];
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.95, 0.04, 0.55]} />
        <meshStandardMaterial color="#c9c2b4" roughness={0.2} metalness={0.05} />
      </mesh>
      {legOffsets.map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, 0.18, z]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.36, 10]} />
          <meshStandardMaterial color="#2b2320" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}
