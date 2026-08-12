'use client';

export default function Rug({
  position = [0, 0.005, 0] as [number, number, number],
  size = [2.6, 1.8] as [number, number],
  color = '#8a3f3f',
}: {
  position?: [number, number, number];
  size?: [number, number];
  color?: string;
}) {
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <planeGeometry args={[size[0] - 0.16, size[1] - 0.16]} />
        <meshStandardMaterial color="#e8ddc8" roughness={0.95} />
      </mesh>
    </group>
  );
}
