'use client';

export default function DiningTable({ position = [0, 0, 0], rotationY = 0 }: { position?: [number, number, number]; rotationY?: number }) {
  const legOffsets: [number, number][] = [
    [-0.75, -0.45],
    [0.75, -0.45],
    [-0.75, 0.45],
    [0.75, 0.45],
  ];
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.06, 1]} />
        <meshStandardMaterial color="#5c4433" roughness={0.6} />
      </mesh>
      {legOffsets.map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, 0.375, z]} castShadow>
          <boxGeometry args={[0.06, 0.75, 0.06]} />
          <meshStandardMaterial color="#3d2c22" />
        </mesh>
      ))}
      {[-0.55, 0, 0.55].map((x) => (
        <group key={x} position={[x, 0, -0.75]}>
          <mesh position={[0, 0.25, 0]} castShadow>
            <boxGeometry args={[0.38, 0.5, 0.38]} />
            <meshStandardMaterial color="#7a5c47" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.65, -0.17]} castShadow>
            <boxGeometry args={[0.38, 0.4, 0.04]} />
            <meshStandardMaterial color="#7a5c47" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
