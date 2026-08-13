'use client';

import { RoundedBox } from '@react-three/drei';

function CeramicVase({ position, scale = 1, color = '#b9aa98' }: { position: [number, number, number]; scale?: number; color?: string }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow>
        <latheGeometry args={[[
          new THREE.Vector2(0.12, 0),
          new THREE.Vector2(0.2, 0.08),
          new THREE.Vector2(0.24, 0.32),
          new THREE.Vector2(0.16, 0.5),
          new THREE.Vector2(0.1, 0.58),
          new THREE.Vector2(0.1, 0.66),
        ], 28]} />
        <meshStandardMaterial color={color} roughness={0.74} />
      </mesh>
    </group>
  );
}

function BooksStack({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {[
        { y: 0.03, w: 0.46, d: 0.3, c: '#5d493a' },
        { y: 0.085, w: 0.4, d: 0.28, c: '#b1a18e' },
        { y: 0.135, w: 0.43, d: 0.27, c: '#6d756b' },
      ].map((book, index) => (
        <RoundedBox key={index} args={[book.w, 0.045, book.d]} radius={0.012} smoothness={3} position={[0, book.y, 0]} castShadow>
          <meshStandardMaterial color={book.c} roughness={0.82} />
        </RoundedBox>
      ))}
    </group>
  );
}

function SlattedScreen() {
  return (
    <group position={[-1.28, 0, 3.42]}>
      <mesh position={[0, 2.15, 0]}>
        <boxGeometry args={[0.16, 4.3, 0.32]} />
        <meshStandardMaterial color="#4a3328" roughness={0.56} />
      </mesh>
      {Array.from({ length: 12 }).map((_, index) => {
        const z = -1.15 + index * 0.21;
        return (
          <mesh key={index} position={[0, 2.1, z]} castShadow>
            <boxGeometry args={[0.1, 4.05, 0.055]} />
            <meshStandardMaterial color={index % 2 ? '#5d4030' : '#6a4936'} roughness={0.5} />
          </mesh>
        );
      })}
      <pointLight position={[-0.2, 3.8, 0]} intensity={0.16} distance={3} color="#ffd49a" />
    </group>
  );
}

function SofaConsole() {
  return (
    <group position={[-4.3, 0, -2.56]}>
      <RoundedBox args={[3.25, 0.12, 0.48]} radius={0.045} smoothness={4} position={[0, 0.78, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#5a3d2d" roughness={0.5} />
      </RoundedBox>
      {[-1.38, 1.38].map((x) => (
        <RoundedBox key={x} args={[0.1, 0.78, 0.38]} radius={0.025} smoothness={3} position={[x, 0.39, 0]} castShadow>
          <meshStandardMaterial color="#4e3529" roughness={0.56} />
        </RoundedBox>
      ))}
      <BooksStack position={[-0.72, 0.85, 0]} rotationY={0.08} />
      <mesh position={[0.2, 0.9, 0]} castShadow>
        <sphereGeometry args={[0.11, 22, 18]} />
        <meshStandardMaterial color="#c5b49f" roughness={0.7} />
      </mesh>
      <mesh position={[0.58, 0.89, 0]} castShadow>
        <cylinderGeometry args={[0.085, 0.085, 0.2, 24]} />
        <meshPhysicalMaterial color="#e7d4b6" transmission={0.18} transparent opacity={0.88} roughness={0.38} />
      </mesh>
    </group>
  );
}

function BedroomNiche() {
  return (
    <group position={[-6.92, 1.7, 4.15]} rotation={[0, Math.PI / 2, 0]}>
      <RoundedBox args={[3.9, 2.6, 0.16]} radius={0.035} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color="#7b5e48" roughness={0.72} />
      </RoundedBox>
      <RoundedBox args={[3.45, 2.15, 0.08]} radius={0.03} smoothness={3} position={[0, 0, 0.11]}>
        <meshStandardMaterial color="#c8b7a1" roughness={0.9} />
      </RoundedBox>
      <mesh position={[0, 0.76, 0.18]}>
        <boxGeometry args={[2.9, 0.025, 0.025]} />
        <meshBasicMaterial color="#ffd7a3" toneMapped={false} />
      </mesh>
    </group>
  );
}

function FloorAccent() {
  return (
    <group>
      <mesh position={[0.65, 0.012, 2.95]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1.7, 5.2]} />
        <meshStandardMaterial color="#b6a38e" roughness={0.94} />
      </mesh>
      <mesh position={[0.65, 0.018, 2.95]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.56, 5.06]} />
        <meshStandardMaterial color="#d6c9b8" roughness={0.98} />
      </mesh>
    </group>
  );
}

export default function ArchitecturalDetails() {
  return (
    <>
      <SlattedScreen />
      <SofaConsole />
      <BedroomNiche />
      <FloorAccent />
      <BooksStack position={[6.05, 0.96, 0.9]} rotationY={-0.2} />
    </>
  );
}
