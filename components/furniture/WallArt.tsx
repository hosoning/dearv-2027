'use client';

export default function WallArt({
  position = [0, 0, 0] as [number, number, number],
  rotationY = 0,
  size = [0.6, 0.8] as [number, number],
  color = '#6f8f9e',
}: {
  position?: [number, number, number];
  rotationY?: number;
  size?: [number, number];
  color?: string;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh castShadow>
        <boxGeometry args={[size[0] + 0.06, size[1] + 0.06, 0.03]} />
        <meshStandardMaterial color="#332821" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    </group>
  );
}
