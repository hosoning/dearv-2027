'use client';

export default function Desk({ position = [0, 0, 0], rotationY = 0 }: { position?: [number, number, number]; rotationY?: number }) {
  const legOffsets: [number, number][] = [
    [-0.55, -0.28],
    [0.55, -0.28],
    [-0.55, 0.28],
    [0.55, 0.28],
  ];
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.3, 0.05, 0.65]} />
        <meshStandardMaterial color="#3f2f24" roughness={0.6} />
      </mesh>
      {legOffsets.map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, 0.36, z]} castShadow>
          <boxGeometry args={[0.05, 0.72, 0.05]} />
          <meshStandardMaterial color="#241a13" />
        </mesh>
      ))}
      {/* chair */}
      <group position={[0, 0, 0.55]}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[0.45, 0.05, 0.45]} />
          <meshStandardMaterial color="#4a382b" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.75, 0.2]} castShadow>
          <boxGeometry args={[0.45, 0.6, 0.05]} />
          <meshStandardMaterial color="#4a382b" roughness={0.7} />
        </mesh>
        {[
          [-0.2, -0.2],
          [0.2, -0.2],
          [-0.2, 0.2],
          [0.2, 0.2],
        ].map(([x, z]) => (
          <mesh key={`${x}-${z}`} position={[x, 0.22, z]} castShadow>
            <boxGeometry args={[0.05, 0.45, 0.05]} />
            <meshStandardMaterial color="#241a13" />
          </mesh>
        ))}
      </group>
    </group>
  );
}
