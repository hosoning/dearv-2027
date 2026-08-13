'use client';

import { useMemo } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import type { MemoryObject } from '@/lib/types';
import { decodeMemoryNote } from '@/lib/memory-system';
import { GoldCoin, MusicHouse, SilkPajamas, StarCertificate, TieSet } from './KeepsakeShowcase';

function stop(event: ThreeEvent<MouseEvent>, onClick?: () => void) {
  event.stopPropagation();
  onClick?.();
}

export default function MemoryObjectMesh({ object, onClick }: { object: MemoryObject; onClick?: () => void }) {
  const meta = useMemo(() => decodeMemoryNote(object.note), [object.note]);
  const position: [number, number, number] = [object.pos_x, object.pos_y, object.pos_z];
  const common = {
    onClick: (event: ThreeEvent<MouseEvent>) => stop(event, onClick),
    onPointerOver: (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      document.body.style.cursor = 'pointer';
    },
    onPointerOut: () => {
      document.body.style.cursor = 'default';
    },
  };

  const starterContent = object.id === 'starter-tie-set' ? <TieSet />
    : object.id === 'starter-gold-520' ? <GoldCoin />
      : object.id === 'starter-star-certificate' ? <StarCertificate />
        : object.id === 'starter-music-house' ? <MusicHouse />
          : object.id === 'starter-silk-pajamas' ? <SilkPajamas /> : null;
  if (starterContent) {
    return <group position={position} {...common}>{starterContent}</group>;
  }

  if (meta.visual === 'book') {
    return (
      <group position={position} {...common}>
        <mesh position={[0, 0.08, 0]} rotation={[0, -0.15, 0]} castShadow>
          <boxGeometry args={[0.42, 0.11, 0.3]} />
          <meshStandardMaterial color="#6f543c" roughness={0.72} />
        </mesh>
        <mesh position={[0, 0.145, 0]} rotation={[0, -0.15, 0]}>
          <boxGeometry args={[0.38, 0.035, 0.27]} />
          <meshStandardMaterial color="#eadfc9" roughness={0.92} />
        </mesh>
      </group>
    );
  }

  if (meta.visual === 'clothing') {
    return (
      <group position={position} {...common}>
        <mesh position={[0, 0.48, 0]} castShadow>
          <boxGeometry args={[0.72, 0.82, 0.08]} />
          <meshStandardMaterial color="#394758" roughness={0.56} />
        </mesh>
        {[ -0.18, 0, 0.18 ].map((x) => (
          <mesh key={x} position={[x, 0.48, 0.047]}>
            <boxGeometry args={[0.025, 0.76, 0.008]} />
            <meshBasicMaterial color="#d9dde1" />
          </mesh>
        ))}
        <mesh position={[0, 0.98, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.018, 0.018, 0.8, 8]} />
          <meshStandardMaterial color="#8f7c64" metalness={0.4} />
        </mesh>
      </group>
    );
  }

  if (meta.visual === 'miniature-house') {
    return (
      <group position={position} {...common}>
        <mesh position={[0, 0.12, 0]} castShadow>
          <boxGeometry args={[0.52, 0.14, 0.4]} />
          <meshStandardMaterial color="#6e533c" roughness={0.62} />
        </mesh>
        <mesh position={[0, 0.34, 0]} castShadow>
          <boxGeometry args={[0.34, 0.3, 0.26]} />
          <meshStandardMaterial color="#e7ddc7" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.55, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
          <boxGeometry args={[0.29, 0.29, 0.3]} />
          <meshStandardMaterial color="#7b4e3d" roughness={0.72} />
        </mesh>
        <pointLight position={[0, 0.4, 0.18]} intensity={0.25} distance={1.2} color="#ffd58f" />
      </group>
    );
  }

  if (meta.visual === 'coin') {
    return (
      <group position={position} {...common} rotation={[Math.PI / 2, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.055, 40]} />
          <meshStandardMaterial color="#caa64c" metalness={0.82} roughness={0.25} />
        </mesh>
      </group>
    );
  }

  if (meta.visual === 'frame') {
    return (
      <group position={position} {...common}>
        <mesh position={[0, 0.35, 0]} castShadow>
          <boxGeometry args={[0.48, 0.62, 0.045]} />
          <meshStandardMaterial color="#7a6047" roughness={0.58} />
        </mesh>
        <mesh position={[0, 0.35, 0.03]}>
          <planeGeometry args={[0.4, 0.53]} />
          <meshStandardMaterial color="#e9e4da" roughness={0.9} />
        </mesh>
      </group>
    );
  }

  if (meta.visual === 'object') {
    return (
      <group position={position} {...common}>
        <mesh position={[0, 0.2, 0]} castShadow>
          <sphereGeometry args={[0.2, 28, 20]} />
          <meshStandardMaterial color="#ae9b7d" metalness={0.28} roughness={0.42} />
        </mesh>
      </group>
    );
  }

  return (
    <group position={position} {...common}>
      <mesh position={[0, 0.16, 0]} castShadow>
        <boxGeometry args={[0.38, 0.3, 0.34]} />
        <meshStandardMaterial color="#6f5045" roughness={0.58} />
      </mesh>
      <mesh position={[0, 0.325, 0]} castShadow>
        <boxGeometry args={[0.4, 0.05, 0.36]} />
        <meshStandardMaterial color="#c7aa79" metalness={0.12} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0.33, 0]}>
        <boxGeometry args={[0.055, 0.065, 0.39]} />
        <meshStandardMaterial color="#d8bd89" roughness={0.38} />
      </mesh>
    </group>
  );
}
