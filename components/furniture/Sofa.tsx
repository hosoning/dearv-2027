'use client';

export default function Sofa({ position = [0, 0, 0], rotationY = 0 }: { position?: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]} castShadow>
      {/* base */}
      <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.56, 0.9]} />
        <meshStandardMaterial color="#8a6f5c" roughness={0.85} />
      </mesh>
      {/* backrest */}
      <mesh position={[0, 0.68, -0.35]} castShadow>
        <boxGeometry args={[2.2, 0.6, 0.2]} />
        <meshStandardMaterial color="#8a6f5c" roughness={0.85} />
      </mesh>
      {/* arms */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 1.05, 0.5, 0]} castShadow>
          <boxGeometry args={[0.14, 0.4, 0.9]} />
          <meshStandardMaterial color="#6f5748" roughness={0.85} />
        </mesh>
      ))}
      {/* cushions */}
      {[-0.6, 0.6].map((x) => (
        <mesh key={x} position={[x, 0.6, 0.02]} castShadow>
          <boxGeometry args={[0.95, 0.16, 0.8]} />
          <meshStandardMaterial color="#b08d75" roughness={0.9} />
        </mesh>
      ))}
      {/* legs */}
      {[
        [-0.95, -0.35],
        [0.95, -0.35],
        [-0.95, 0.35],
        [0.95, 0.35],
      ].map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, 0.05, z]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.1, 8]} />
          <meshStandardMaterial color="#3d2c22" />
        </mesh>
      ))}
    </group>
  );
}
