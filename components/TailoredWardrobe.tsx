'use client';

import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

function jacketShape() {
  const s = new THREE.Shape();
  s.moveTo(-0.2, 0.46);
  s.lineTo(-0.46, 0.32);
  s.lineTo(-0.39, 0.04);
  s.lineTo(-0.29, 0.1);
  s.lineTo(-0.23, -0.42);
  s.lineTo(0.23, -0.42);
  s.lineTo(0.29, 0.1);
  s.lineTo(0.39, 0.04);
  s.lineTo(0.46, 0.32);
  s.lineTo(0.2, 0.46);
  s.lineTo(0.08, 0.34);
  s.lineTo(0, 0.2);
  s.lineTo(-0.08, 0.34);
  s.closePath();
  return s;
}

function shirtShape() {
  const s = new THREE.Shape();
  s.moveTo(-0.18, 0.43);
  s.lineTo(-0.42, 0.28);
  s.lineTo(-0.35, 0.06);
  s.lineTo(-0.25, 0.1);
  s.lineTo(-0.22, -0.42);
  s.lineTo(0.22, -0.42);
  s.lineTo(0.25, 0.1);
  s.lineTo(0.35, 0.06);
  s.lineTo(0.42, 0.28);
  s.lineTo(0.18, 0.43);
  s.lineTo(0.06, 0.31);
  s.lineTo(0, 0.24);
  s.lineTo(-0.06, 0.31);
  s.closePath();
  return s;
}

function Garment({
  position,
  color,
  type = 'jacket',
  rotationY = 0,
  striped = false,
}: {
  position: [number, number, number];
  color: string;
  type?: 'jacket' | 'shirt';
  rotationY?: number;
  striped?: boolean;
}) {
  const shape = useMemo(() => type === 'jacket' ? jacketShape() : shirtShape(), [type]);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh castShadow>
        <extrudeGeometry args={[shape, { depth: 0.045, bevelEnabled: true, bevelSize: 0.014, bevelThickness: 0.008, bevelSegments: 3 }]} />
        <meshPhysicalMaterial color={color} roughness={type === 'shirt' ? 0.48 : 0.72} sheen={type === 'shirt' ? 0.72 : 0.3} sheenRoughness={0.36} />
      </mesh>
      {striped && [-0.13, 0, 0.13].map((x) => (
        <mesh key={x} position={[x, 0, 0.052]}>
          <boxGeometry args={[0.012, 0.72, 0.006]} />
          <meshBasicMaterial color="#c8d0d5" toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0, 0.49, -0.025]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.12, 0.012, 8, 24, Math.PI]} />
        <meshStandardMaterial color="#b79a72" metalness={0.68} roughness={0.24} />
      </mesh>
    </group>
  );
}

function FoldedStack({ position, colors }: { position: [number, number, number]; colors: string[] }) {
  return (
    <group position={position}>
      {colors.map((color, index) => (
        <RoundedBox key={color + index} args={[0.72, 0.09, 0.5]} radius={0.025} smoothness={4} position={[0, index * 0.095, 0]} castShadow>
          <meshPhysicalMaterial color={color} roughness={0.74} sheen={0.25} />
        </RoundedBox>
      ))}
    </group>
  );
}

export default function TailoredWardrobe({
  position = [0, 0, 0],
  rotationY = 0,
  onClick,
}: {
  position?: [number, number, number];
  rotationY?: number;
  onClick?: () => void;
}) {
  const outfits = [
    { x: -1.55, color: '#20252d', type: 'jacket' as const },
    { x: -1.15, color: '#393d43', type: 'jacket' as const },
    { x: -0.75, color: '#d1c9bd', type: 'shirt' as const },
    { x: -0.35, color: '#a69787', type: 'jacket' as const },
    { x: 0.05, color: '#e5e0d8', type: 'shirt' as const },
    { x: 0.45, color: '#4f5660', type: 'jacket' as const },
    { x: 0.85, color: '#cab49f', type: 'jacket' as const },
  ];

  return (
    <group
      position={position}
      rotation={[0, rotationY, 0]}
      onClick={(event) => { event.stopPropagation(); onClick?.(); }}
      onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      <RoundedBox args={[4.2, 3.45, 0.56]} radius={0.05} smoothness={5} position={[0, 1.72, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#3b2a22" roughness={0.58} />
      </RoundedBox>
      <RoundedBox args={[3.92, 3.18, 0.5]} radius={0.035} smoothness={4} position={[0, 1.68, 0.31]}>
        <meshStandardMaterial color="#171514" roughness={0.74} />
      </RoundedBox>
      <mesh position={[0, 2.53, 0.61]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.026, 0.026, 3.52, 18]} />
        <meshStandardMaterial color="#c4a36f" metalness={0.78} roughness={0.21} />
      </mesh>

      {outfits.map((outfit, index) => (
        <Garment key={index} position={[outfit.x, 2.0, 0.61 + (index % 2) * 0.018]} color={outfit.color} type={outfit.type} rotationY={(index - 3) * 0.018} />
      ))}

      <mesh position={[1.43, 1.28, 0.63]} castShadow>
        <extrudeGeometry args={[shirtShape(), { depth: 0.052, bevelEnabled: true, bevelSize: 0.014, bevelThickness: 0.009, bevelSegments: 3 }]} />
        <meshPhysicalMaterial color="#27323e" roughness={0.3} sheen={0.9} sheenRoughness={0.25} />
      </mesh>
      {[-0.13, 0, 0.13].map((x) => (
        <mesh key={x} position={[1.43 + x, 1.28, 0.69]}>
          <boxGeometry args={[0.012, 0.72, 0.007]} />
          <meshBasicMaterial color="#aab7c2" toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[1.43, 0.48, 0.64]}>
        <planeGeometry args={[0.82, 0.78]} />
        <meshPhysicalMaterial color="#27323e" roughness={0.32} sheen={0.86} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[0, 1.0, 0.6]} castShadow><boxGeometry args={[3.78, 0.055, 0.48]} /><meshStandardMaterial color="#5a4031" roughness={0.56} /></mesh>
      <FoldedStack position={[-1.26, 1.08, 0.62]} colors={['#ddd5ca', '#8b8178', '#33383f']} />
      <FoldedStack position={[-0.2, 1.08, 0.62]} colors={['#b7a898', '#ddd6cb', '#4b4d4f']} />

      <mesh position={[0, 3.25, 0.58]}><boxGeometry args={[3.7, 0.025, 0.08]} /><meshBasicMaterial color="#ffd39a" toneMapped={false} /></mesh>
      <pointLight position={[0, 2.6, 1]} intensity={0.38} distance={4.6} color="#ffd7a1" />
    </group>
  );
}
