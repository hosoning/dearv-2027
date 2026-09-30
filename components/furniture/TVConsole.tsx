'use client';

export default function TVConsole({ position = [0, 0, 0], rotationY = 0 }: { position?: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.48, 0.38]} />
        <meshStandardMaterial color="#2b2320" roughness={0.5} />
      </mesh>
      {[-0.4, 0.4].map((x) => (
        <mesh key={x} position={[x, 0.24, 0.2]}>
          <boxGeometry args={[0.5, 0.4, 0.02]} />
          <meshStandardMaterial color="#1a1512" roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, 0.85, -0.02]} castShadow>
        <boxGeometry args={[1.1, 0.62, 0.04]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.3} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.85, 0.01]}>
        <planeGeometry args={[1.02, 0.56]} />
        <meshStandardMaterial color="#0e2233" emissive="#123044" emissiveIntensity={0.6} roughness={0.6} />
      </mesh>
    </group>
  );
}
