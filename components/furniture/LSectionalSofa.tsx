'use client';

import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { createFabricTexture } from '@/lib/textures';

function PipedCushion({ position, size, fabric, rotation = [0, 0, 0] }: { position: [number, number, number]; size: [number, number, number]; fabric: THREE.Texture; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={size} radius={0.12} smoothness={8} castShadow receiveShadow>
        <meshPhysicalMaterial map={fabric} bumpMap={fabric} bumpScale={0.009} color="#c8c1b9" roughness={0.9} sheen={0.52} sheenColor="#e6e0d8" sheenRoughness={0.7} />
      </RoundedBox>
    </group>
  );
}

function ThrowPillow({ position, rotation, color }: { position: [number, number, number]; rotation: [number, number, number]; color: string }) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[0.64, 0.64, 0.18]} radius={0.16} smoothness={10} castShadow>
        <meshPhysicalMaterial color={color} roughness={0.9} sheen={0.65} sheenColor="#f0e5d8" />
      </RoundedBox>
      <mesh position={[0, 0, 0.1]}><circleGeometry args={[0.024, 20]} /><meshStandardMaterial color="#8b7767" roughness={0.8} /></mesh>
    </group>
  );
}

/** A single continuous, rectangular L sectional with a deep chaise and tailored upholstery. */
export default function LSectionalSofa({ position = [0, 0, 0], rotationY = 0 }: { position?: [number, number, number]; rotationY?: number }) {
  const fabric = useMemo(() => createFabricTexture(512, '#bdb5ad'), []);
  const footprint = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-3.0, -0.62);
    shape.lineTo(3.0, -0.62);
    shape.lineTo(3.0, 0.62);
    shape.lineTo(-1.52, 0.62);
    shape.lineTo(-1.52, 2.55);
    shape.lineTo(-3.0, 2.55);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.26, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.06, bevelSegments: 5 });
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, 0.22, 0);
    geometry.computeVertexNormals();
    return geometry;
  }, []);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh geometry={footprint} castShadow receiveShadow>
        <meshPhysicalMaterial map={fabric} color="#aaa29a" roughness={0.9} sheen={0.38} sheenColor="#ded7cf" />
      </mesh>

      {[-1.95, 0, 1.95].map((x) => (
        <PipedCushion key={x} fabric={fabric} position={[x, 0.53, 0]} size={[1.8, 0.25, 1.04]} />
      ))}
      <PipedCushion fabric={fabric} position={[-2.3, 0.53, 1.13]} size={[1.16, 0.25, 1.14]} />
      <PipedCushion fabric={fabric} position={[-2.3, 0.53, 2.04]} size={[1.16, 0.25, 0.7]} />

      {[-1.95, 0, 1.95].map((x, index) => (
        <PipedCushion key={`back-${x}`} fabric={fabric} position={[x, 0.98, 0.49]} size={[1.78, 0.66, 0.2]} rotation={[-0.08 - (index % 2) * 0.012, 0, 0]} />
      ))}
      <PipedCushion fabric={fabric} position={[-2.86, 0.98, 1.35]} size={[0.2, 0.66, 1.36]} rotation={[0, 0, -0.06]} />

      <RoundedBox args={[0.28, 0.7, 1.22]} radius={0.12} smoothness={7} position={[-2.9, 0.7, 1.92]} castShadow>
        <meshPhysicalMaterial map={fabric} color="#aaa29a" roughness={0.9} sheen={0.4} />
      </RoundedBox>
      <RoundedBox args={[0.28, 0.7, 1.15]} radius={0.12} smoothness={7} position={[2.9, 0.7, 0]} castShadow>
        <meshPhysicalMaterial map={fabric} color="#aaa29a" roughness={0.9} sheen={0.4} />
      </RoundedBox>

      <ThrowPillow position={[-2.28, 1.14, 0.27]} rotation={[0.04, 0.28, 0.2]} color="#8f8176" />
      <ThrowPillow position={[1.95, 1.13, 0.28]} rotation={[0.02, -0.24, -0.15]} color="#d8d0c6" />
      <ThrowPillow position={[2.36, 1.12, 0.3]} rotation={[-0.03, 0.16, 0.16]} color="#98897d" />
    </group>
  );
}
