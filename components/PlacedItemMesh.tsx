'use client';

import type { PlacedItem } from '@/lib/types';

export default function PlacedItemMesh({ item, onClick }: { item: PlacedItem; onClick?: () => void }) {
  const position: [number, number, number] = [item.pos_x, item.pos_y, item.pos_z];

  switch (item.catalog_id) {
    case 'stool':
      return (
        <group position={position} rotation={[0, item.rotation_y, 0]} onClick={onClick}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.18, 0.06, 16]} />
            <meshStandardMaterial color="#b08d75" roughness={0.85} />
          </mesh>
          {[0, 1, 2].map((i) => {
            const angle = (i / 3) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(angle) * 0.13, 0.14, Math.sin(angle) * 0.13]} castShadow>
                <cylinderGeometry args={[0.02, 0.02, 0.28, 8]} />
                <meshStandardMaterial color="#3d2c22" />
              </mesh>
            );
          })}
        </group>
      );
    case 'plant':
      return (
        <group position={position} rotation={[0, item.rotation_y, 0]} onClick={onClick}>
          <mesh position={[0, 0.15, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.13, 0.3, 12]} />
            <meshStandardMaterial color="#a8582f" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.5, 0]} castShadow>
            <sphereGeometry args={[0.28, 12, 12]} />
            <meshStandardMaterial color="#3f7d3f" roughness={0.9} />
          </mesh>
        </group>
      );
    case 'side_table':
      return (
        <group position={position} rotation={[0, item.rotation_y, 0]} onClick={onClick}>
          <mesh position={[0, 0.45, 0]} castShadow>
            <cylinderGeometry args={[0.24, 0.24, 0.04, 20]} />
            <meshStandardMaterial color="#7a5c47" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.22, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.44, 8]} />
            <meshStandardMaterial color="#3d2c22" />
          </mesh>
        </group>
      );
    default:
      return null;
  }
}
