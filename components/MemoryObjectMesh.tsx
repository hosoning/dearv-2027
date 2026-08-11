'use client';

import type { MemoryObject } from '@/lib/types';

// Placeholder geometry for each memory-object type — to be swapped for
// sculpted models later; the interaction/data plumbing is what matters now.
export default function MemoryObjectMesh({ object, onClick }: { object: MemoryObject; onClick?: () => void }) {
  const position: [number, number, number] = [object.pos_x, object.pos_y, object.pos_z];

  switch (object.type) {
    case 'star_bottle':
      return (
        <group position={position} onClick={onClick}>
          <mesh position={[0, 0.18, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.11, 0.32, 16]} />
            <meshPhysicalMaterial color="#bfe3ff" transmission={0.85} roughness={0.05} thickness={0.3} transparent opacity={0.7} />
          </mesh>
          <mesh position={[0, 0.4, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.07, 0.08, 12]} />
            <meshStandardMaterial color="#caa15c" roughness={0.6} />
          </mesh>
          {Array.from({ length: 5 }).map((_, i) => (
            <mesh key={i} position={[(Math.random() - 0.5) * 0.1, 0.1 + Math.random() * 0.2, (Math.random() - 0.5) * 0.1]}>
              <sphereGeometry args={[0.012, 6, 6]} />
              <meshStandardMaterial color="#fff3c4" emissive="#fff3c4" emissiveIntensity={1.2} />
            </mesh>
          ))}
        </group>
      );
    case 'photo_frame':
      return (
        <group position={position} onClick={onClick}>
          <mesh position={[0, 0.25, 0]} castShadow>
            <boxGeometry args={[0.26, 0.34, 0.03]} />
            <meshStandardMaterial color="#8a6b4c" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.25, 0.02]}>
            <planeGeometry args={[0.2, 0.28]} />
            <meshStandardMaterial color={object.image_url ? '#ffffff' : '#dcd3c4'} />
          </mesh>
        </group>
      );
    case 'gift_box':
      return (
        <group position={position} onClick={onClick}>
          <mesh position={[0, 0.15, 0]} castShadow>
            <boxGeometry args={[0.3, 0.3, 0.3]} />
            <meshStandardMaterial color="#c94f4f" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.15, 0]} castShadow>
            <boxGeometry args={[0.34, 0.06, 0.06]} />
            <meshStandardMaterial color="#f0c95c" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.15, 0]} castShadow>
            <boxGeometry args={[0.06, 0.34, 0.06]} />
            <meshStandardMaterial color="#f0c95c" roughness={0.4} />
          </mesh>
        </group>
      );
    default:
      return null;
  }
}
