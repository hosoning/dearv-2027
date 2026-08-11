'use client';

export default function Bed({ position = [0, 0, 0], rotationY = 0 }: { position?: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* frame */}
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.3, 2.1]} />
        <meshStandardMaterial color="#5c4433" roughness={0.75} />
      </mesh>
      {/* mattress */}
      <mesh position={[0, 0.46, 0]} castShadow>
        <boxGeometry args={[1.55, 0.24, 2.05]} />
        <meshStandardMaterial color="#f4efe6" roughness={0.9} />
      </mesh>
      {/* duvet */}
      <mesh position={[0, 0.6, 0.25]} castShadow>
        <boxGeometry args={[1.55, 0.1, 1.5]} />
        <meshStandardMaterial color="#c9d6e3" roughness={0.9} />
      </mesh>
      {/* pillows */}
      {[-0.4, 0.4].map((x) => (
        <mesh key={x} position={[x, 0.62, -0.85]} castShadow>
          <boxGeometry args={[0.6, 0.16, 0.35]} />
          <meshStandardMaterial color="#ffffff" roughness={0.95} />
        </mesh>
      ))}
      {/* headboard */}
      <mesh position={[0, 0.75, -1.05]} castShadow>
        <boxGeometry args={[1.6, 1.1, 0.1]} />
        <meshStandardMaterial color="#6f5748" roughness={0.8} />
      </mesh>
    </group>
  );
}
