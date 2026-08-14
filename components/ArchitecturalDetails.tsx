'use client';

import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { createMarbleTexture, createWalnutTexture } from '@/lib/textures';

function clickThrough(handler?: () => void) {
  return (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    handler?.();
  };
}

function CeramicVase({ position, scale = 1, color = '#b9aa98' }: { position: [number, number, number]; scale?: number; color?: string }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow>
        <latheGeometry args={[[
          new THREE.Vector2(0.12, 0), new THREE.Vector2(0.2, 0.08), new THREE.Vector2(0.24, 0.32),
          new THREE.Vector2(0.16, 0.5), new THREE.Vector2(0.1, 0.58), new THREE.Vector2(0.1, 0.66),
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

function FoyerSuite() {
  return (
    <group>
      <group position={[14.25, 0, 8.0]} rotation={[0, -Math.PI / 2, 0]}>
        <RoundedBox args={[5.5, 1.0, 0.52]} radius={0.06} smoothness={4} position={[0, 0.5, 0]} castShadow>
          <meshStandardMaterial color="#70513d" roughness={0.56} />
        </RoundedBox>
        {[-1.82, -0.62, 0.62, 1.82].map((x) => (
          <mesh key={x} position={[x, 0.53, 0.28]}><boxGeometry args={[0.025, 0.72, 0.018]} /><meshStandardMaterial color="#bba077" /></mesh>
        ))}
        <mesh position={[0, 2.65, 0.28]}><boxGeometry args={[4.5, 2.35, 0.07]} /><meshStandardMaterial color="#aa8b64" metalness={0.55} roughness={0.28} /></mesh>
        <mesh position={[0, 2.65, 0.32]}><planeGeometry args={[4.25, 2.12]} /><meshPhysicalMaterial color="#bfc7c7" metalness={0.66} roughness={0.08} /></mesh>
      </group>
      {/* Bench sits to the east of the entrance, exactly as in the approved plan. */}
      <group position={[11.35, 0, 10.55]}>
        <RoundedBox args={[3.1, 0.12, 0.76]} radius={0.05} smoothness={4} position={[0, 0.5, 0]} castShadow><meshStandardMaterial color="#6f503c" roughness={0.52} /></RoundedBox>
        {[-1.28, 1.28].map((x) => <mesh key={x} position={[x, 0.25, 0]}><boxGeometry args={[0.08, 0.5, 0.58]} /><meshStandardMaterial color="#604331" roughness={0.58} /></mesh>)}
        <RoundedBox args={[2.65, 0.16, 0.66]} radius={0.07} smoothness={5} position={[0, 0.64, 0]}><meshStandardMaterial color="#c0b4a7" roughness={0.95} /></RoundedBox>
      </group>
      <mesh position={[10.1, 3.68, 10.8]}><boxGeometry args={[7.5, 0.035, 0.035]} /><meshStandardMaterial color="#ffd49a" emissive="#ffc278" emissiveIntensity={0.85} toneMapped={false} /></mesh>
    </group>
  );
}

function BarStool({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox args={[0.52, 0.12, 0.48]} radius={0.08} smoothness={5} position={[0, 0.78, 0]} castShadow><meshStandardMaterial color="#a99a8c" roughness={0.88} /></RoundedBox>
      <mesh position={[0, 0.4, 0]}><cylinderGeometry args={[0.045, 0.07, 0.76, 14]} /><meshStandardMaterial color="#6d5847" metalness={0.22} roughness={0.42} /></mesh>
      <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[0.26, 0.3, 0.06, 28]} /><meshStandardMaterial color="#6d5847" metalness={0.22} roughness={0.42} /></mesh>
      <mesh position={[0, 0.85, 0.2]}><boxGeometry args={[0.48, 0.42, 0.08]} /><meshStandardMaterial color="#9d8c7d" roughness={0.9} /></mesh>
    </group>
  );
}

function KitchenSuite() {
  const walnut = useMemo(() => createWalnutTexture(), []);
  const marble = useMemo(() => createMarbleTexture(), []);
  return (
    <group>
      {/* North run: sink, cooktop, pantry and double-door refrigerator. */}
      <RoundedBox args={[10.2, 0.92, 1.05]} radius={0.055} smoothness={4} position={[0, 0.46, 11.15]} castShadow receiveShadow><meshStandardMaterial map={walnut} color="#8a6c54" roughness={0.52} /></RoundedBox>
      <mesh position={[0, 0.96, 10.98]} castShadow receiveShadow><boxGeometry args={[10.4, 0.11, 1.28]} /><meshPhysicalMaterial map={marble} color="#f1eee9" roughness={0.25} clearcoat={0.3} clearcoatRoughness={0.16} /></mesh>
      {[-3.65, -2.05, -0.45, 1.15].map((x) => <RoundedBox key={x} args={[1.42, 1.5, 0.48]} radius={0.035} smoothness={3} position={[x, 3.05, 11.55]} castShadow><meshStandardMaterial map={walnut} color="#9a7c62" roughness={0.58} /></RoundedBox>)}
      <RoundedBox args={[1.82, 3.5, 1.08]} radius={0.055} smoothness={4} position={[4.02, 1.75, 11.0]} castShadow><meshStandardMaterial color="#82786d" metalness={0.18} roughness={0.43} /></RoundedBox>
      <mesh position={[4.02, 1.76, 10.43]}><boxGeometry args={[0.035, 3.15, 0.025]} /><meshStandardMaterial color="#56504a" metalness={0.5} roughness={0.28} /></mesh>
      <mesh position={[1.2, 0.99, 10.8]}><boxGeometry args={[1.42, 0.035, 0.68]} /><meshStandardMaterial color="#27292b" roughness={0.24} /></mesh>
      <mesh position={[1.72, 1.27, 10.9]} rotation={[0, 0, -0.15]}><torusGeometry args={[0.24, 0.035, 12, 28, Math.PI]} /><meshStandardMaterial color="#a49c91" metalness={0.72} roughness={0.22} /></mesh>
      <mesh position={[-1.65, 0.99, 10.78]}><boxGeometry args={[1.45, 0.04, 0.7]} /><meshStandardMaterial color="#242527" roughness={0.24} /></mesh>
      {[-2.02, -1.28].flatMap((x) => [10.55, 10.98].map((z) => [x, z] as const)).map(([x, z]) => <mesh key={`${x}-${z}`} position={[x, 1.025, z]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.18, 0.018, 10, 32]} /><meshStandardMaterial color="#77736c" metalness={0.5} roughness={0.32} /></mesh>)}

      {/* West return: uninterrupted worktop plus integrated oven tower. */}
      <RoundedBox args={[1.05, 0.92, 4.7]} radius={0.055} smoothness={4} position={[-4.65, 0.46, 8.55]} castShadow><meshStandardMaterial map={walnut} color="#8a6c54" roughness={0.52} /></RoundedBox>
      <mesh position={[-4.48, 0.96, 8.55]}><boxGeometry args={[1.28, 0.11, 4.9]} /><meshPhysicalMaterial map={marble} color="#f1eee9" roughness={0.25} clearcoat={0.3} clearcoatRoughness={0.16} /></mesh>
      <RoundedBox args={[0.52, 1.55, 1.05]} radius={0.035} smoothness={3} position={[-4.34, 1.85, 7.25]}><meshStandardMaterial color="#373536" metalness={0.36} roughness={0.28} /></RoundedBox>
      <mesh position={[-4.05, 1.86, 7.25]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[0.8, 0.9]} /><meshStandardMaterial color="#1e2021" metalness={0.5} roughness={0.18} /></mesh>

      {/* The island is a clean bar surface: no sink or cooktop. */}
      <RoundedBox args={[5.4, 0.92, 1.35]} radius={0.08} smoothness={5} position={[0, 0.46, 7.25]} castShadow receiveShadow><meshStandardMaterial map={walnut} color="#815f47" roughness={0.48} /></RoundedBox>
      <RoundedBox args={[5.65, 0.14, 1.52]} radius={0.08} smoothness={5} position={[0, 0.98, 7.25]} castShadow><meshPhysicalMaterial map={marble} color="#f3f0eb" roughness={0.22} clearcoat={0.42} clearcoatRoughness={0.14} /></RoundedBox>
      {[-1.8, -0.6, 0.6, 1.8].map((x) => <BarStool key={x} position={[x, 0, 6.22]} rotationY={Math.PI} />)}
      <CeramicVase position={[1.85, 1.05, 7.25]} scale={0.34} color="#b5aa9e" />
    </group>
  );
}

const BOOK_COLORS = ['#6c5647', '#9b8065', '#4d665e', '#8f6b5d', '#b6a184'];

function StudyBookWall({ onClick }: { onClick?: () => void }) {
  return (
    <group position={[14.48, 0, -4.0]} rotation={[0, -Math.PI / 2, 0]} onClick={clickThrough(onClick)}>
      <mesh position={[0, 2.0, 0]} castShadow><boxGeometry args={[13.4, 3.75, 0.58]} /><meshStandardMaterial color="#4c372d" roughness={0.54} /></mesh>
      {[-5.4, -3.6, -1.8, 0, 1.8, 3.6, 5.4].map((x, bay) => (
        <group key={x} position={[x, 0, -0.34]}>
          {[1.0, 1.72, 2.44, 3.16, 3.88].map((y) => <mesh key={y} position={[0, y, 0]}><boxGeometry args={[1.55, 0.055, 0.48]} /><meshStandardMaterial color="#9b7757" roughness={0.5} /></mesh>)}
          {[1.08, 1.8, 2.52, 3.24].map((y, row) => <group key={y} position={[0, y, -0.04]}>{Array.from({ length: 5 }).map((_, i) => <mesh key={i} position={[-0.58 + i * 0.29, 0.2 + ((i + row) % 3) * 0.04, 0]}><boxGeometry args={[0.18, 0.4 + ((i + bay) % 3) * 0.08, 0.3]} /><meshStandardMaterial color={BOOK_COLORS[(i + row + bay) % BOOK_COLORS.length]} roughness={0.88} /></mesh>)}</group>)}
        </group>
      ))}
    </group>
  );
}

function LoungeChair({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox args={[1.15, 0.2, 1.08]} radius={0.13} smoothness={6} position={[0, 0.46, 0]} castShadow><meshStandardMaterial color="#ada093" roughness={0.94} /></RoundedBox>
      <RoundedBox args={[1.08, 1.0, 0.18]} radius={0.12} smoothness={6} position={[0, 0.95, -0.42]} rotation={[-0.14, 0, 0]} castShadow><meshStandardMaterial color="#9c8d80" roughness={0.94} /></RoundedBox>
      {[-0.5, 0.5].map((x) => <RoundedBox key={x} args={[0.18, 0.5, 0.94]} radius={0.09} smoothness={5} position={[x, 0.64, 0]}><meshStandardMaterial color="#958477" roughness={0.93} /></RoundedBox>)}
    </group>
  );
}

function OfficeChair({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.37, 0]} castShadow><cylinderGeometry args={[0.045, 0.065, 0.62, 14]} /><meshStandardMaterial color="#342f2c" metalness={0.45} roughness={0.32} /></mesh>
      <RoundedBox args={[0.9, 0.18, 0.82]} radius={0.12} smoothness={6} position={[0, 0.72, 0]} castShadow><meshStandardMaterial color="#3d3835" roughness={0.86} /></RoundedBox>
      <RoundedBox args={[0.82, 1.05, 0.17]} radius={0.12} smoothness={6} position={[0, 1.28, -0.31]} rotation={[-0.1, 0, 0]} castShadow><meshStandardMaterial color="#403b38" roughness={0.88} /></RoundedBox>
      {[-0.42, 0.42].map((x) => <RoundedBox key={x} args={[0.12, 0.42, 0.66]} radius={0.06} smoothness={4} position={[x, 0.91, 0]}><meshStandardMaterial color="#332f2c" roughness={0.78} /></RoundedBox>)}
      {[0, 1.26, 2.51, 3.77, 5.03].map((angle) => <group key={angle} rotation={[0, angle, 0]}><mesh position={[0, 0.08, 0.34]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.055, 0.055, 0.08, 12]} /><meshStandardMaterial color="#2c2927" roughness={0.5} /></mesh><mesh position={[0, 0.13, 0.18]} rotation={[Math.PI / 2, 0, 0]}><boxGeometry args={[0.055, 0.36, 0.045]} /><meshStandardMaterial color="#393431" metalness={0.35} roughness={0.38} /></mesh></group>)}
    </group>
  );
}

function StudySuite({ onArchiveClick, onLettersClick }: { onArchiveClick?: () => void; onLettersClick?: () => void }) {
  return (
    <group>
      <StudyBookWall onClick={onArchiveClick} />
      <group position={[11.8, 0, -4.35]} rotation={[0, Math.PI / 2, 0]} onClick={clickThrough(onLettersClick)}>
        <RoundedBox args={[4.65, 0.16, 1.65]} radius={0.075} smoothness={5} position={[0, 0.83, 0]} castShadow receiveShadow><meshStandardMaterial color="#72513d" roughness={0.5} /></RoundedBox>
        {[-1.9, 1.9].map((x) => <RoundedBox key={x} args={[0.52, 0.8, 1.3]} radius={0.04} smoothness={4} position={[x, 0.4, 0]} castShadow><meshStandardMaterial color="#604333" roughness={0.56} /></RoundedBox>)}
        <mesh position={[0.65, 1.36, -0.08]} rotation={[-0.08, 0, 0]} castShadow><boxGeometry args={[1.35, 0.78, 0.07]} /><meshStandardMaterial color="#292d31" roughness={0.25} /></mesh>
        <group position={[-1.25, 0.93, 0.15]}><mesh position={[0, 0.42, 0]} rotation={[0, 0, -0.3]}><cylinderGeometry args={[0.035, 0.045, 0.75, 12]} /><meshStandardMaterial color="#b89968" metalness={0.68} roughness={0.22} /></mesh><mesh position={[0.11, 0.82, 0]} rotation={[0, 0, -0.25]}><coneGeometry args={[0.27, 0.34, 24]} /><meshStandardMaterial color="#c6a670" metalness={0.56} roughness={0.26} /></mesh><pointLight position={[0.2, 0.65, 0.1]} intensity={0.32} distance={2.7} color="#ffd39b" /></group>
        <BooksStack position={[-0.5, 0.93, 0.2]} rotationY={0.12} />
      </group>
      <LoungeChair position={[12.75, 0, 0.25]} rotationY={-2.35} />
      <OfficeChair position={[13.35, 0, -4.35]} rotationY={-Math.PI / 2} />
    </group>
  );
}

function BedroomSuite() {
  return (
    <group>
      <group position={[-14.72, 2.0, 7.0]} rotation={[0, Math.PI / 2, 0]}>
        <RoundedBox args={[7.0, 3.35, 0.18]} radius={0.06} smoothness={4} castShadow receiveShadow><meshStandardMaterial color="#806451" roughness={0.75} /></RoundedBox>
        <RoundedBox args={[6.42, 2.85, 0.08]} radius={0.05} smoothness={4} position={[0, 0, -0.12]}><meshStandardMaterial color="#c9b9a8" roughness={0.92} /></RoundedBox>
        <mesh position={[0, 1.22, -0.17]}><boxGeometry args={[5.7, 0.025, 0.025]} /><meshBasicMaterial color="#ffd69f" toneMapped={false} /></mesh>
      </group>
      {[5.25, 8.75].map((z) => <group key={z} position={[-13.65, 0, z]}><RoundedBox args={[0.8, 0.5, 0.66]} radius={0.055} smoothness={4} position={[0, 0.25, 0]} castShadow><meshStandardMaterial color="#745640" roughness={0.57} /></RoundedBox><mesh position={[0, 1.42, 0]}><cylinderGeometry args={[0.025, 0.025, 1.75, 12]} /><meshStandardMaterial color="#b8996b" metalness={0.65} roughness={0.24} /></mesh><mesh position={[0, 2.2, 0]}><sphereGeometry args={[0.2, 24, 16]} /><meshPhysicalMaterial color="#ead8bf" transmission={0.42} transparent opacity={0.82} roughness={0.28} /></mesh></group>)}
    </group>
  );
}

function WardrobeBay({ position, rotationY = 0, colorIndex = 0 }: { position: [number, number, number]; rotationY?: number; colorIndex?: number }) {
  const garments = ['#d9d0c5', '#75685f', '#9a9a96', '#53606a', '#b7a58e'];
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox args={[1.42, 3.55, 0.62]} radius={0.035} smoothness={3} position={[0, 1.78, 0]} castShadow><meshStandardMaterial color="#684b39" roughness={0.58} /></RoundedBox>
      <mesh position={[0, 2.95, 0.34]}><boxGeometry args={[1.18, 0.05, 0.5]} /><meshStandardMaterial color="#9b7656" roughness={0.5} /></mesh>
      <mesh position={[0, 2.72, 0.35]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.018, 0.018, 1.08, 10]} /><meshStandardMaterial color="#c2a36f" metalness={0.62} roughness={0.25} /></mesh>
      {[-0.4, -0.2, 0, 0.2, 0.4].map((x, index) => <RoundedBox key={x} args={[0.17, 1.05 + (index % 2) * 0.18, 0.1]} radius={0.035} smoothness={3} position={[x, 2.03, 0.36]}><meshPhysicalMaterial color={garments[(index + colorIndex) % garments.length]} roughness={0.5} sheen={0.45} /></RoundedBox>)}
      {[0.45, 0.85, 1.25].map((y) => <mesh key={y} position={[0, y, 0.35]}><boxGeometry args={[1.16, 0.055, 0.5]} /><meshStandardMaterial color="#987354" roughness={0.52} /></mesh>)}
      {[-0.35, 0.35].map((x) => <mesh key={x} position={[x, 0.62, 0.64]}><boxGeometry args={[0.42, 0.22, 0.2]} /><meshStandardMaterial color="#89705f" roughness={0.8} /></mesh>)}
    </group>
  );
}

function WalkInCloset() {
  return (
    <group>
      {[-4.7, -3.15, -1.6, 1.5].map((z, index) => <WardrobeBay key={z} position={[-14.55, 0, z]} rotationY={Math.PI / 2} colorIndex={index} />)}
      {[-13.55, -12.0, -10.45, -8.9].map((x, index) => <WardrobeBay key={x} position={[x, 0, -5.62]} colorIndex={index + 2} />)}
      <RoundedBox args={[1.35, 0.88, 3.35]} radius={0.08} smoothness={5} position={[-10.9, 0.44, -2.65]} castShadow><meshStandardMaterial color="#765542" roughness={0.56} /></RoundedBox>
      <mesh position={[-10.9, 0.91, -2.65]}><boxGeometry args={[1.2, 0.06, 3.05]} /><meshStandardMaterial color="#c1ad91" roughness={0.48} /></mesh>
    </group>
  );
}

function BathroomSuite() {
  return (
    <group>
      <RoundedBox args={[1.62, 0.8, 3.05]} radius={0.24} smoothness={8} position={[-13.1, 0.43, -8.85]} castShadow receiveShadow><meshStandardMaterial color="#eeeae3" roughness={0.38} /></RoundedBox>
      <RoundedBox args={[1.25, 0.45, 2.62]} radius={0.2} smoothness={8} position={[-13.1, 0.75, -8.85]}><meshStandardMaterial color="#d8e1e0" roughness={0.18} /></RoundedBox>
      <mesh position={[-12.95, 1.12, -7.42]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.31, 0.04, 12, 30, Math.PI]} /><meshStandardMaterial color="#9e958a" metalness={0.72} roughness={0.22} /></mesh>

      <RoundedBox args={[3.2, 0.84, 0.76]} radius={0.06} smoothness={5} position={[-10.1, 0.42, -11.35]} castShadow><meshStandardMaterial color="#786555" roughness={0.62} /></RoundedBox>
      <mesh position={[-10.1, 0.89, -11.27]}><boxGeometry args={[3.38, 0.1, 0.92]} /><meshStandardMaterial color="#d9d4cc" roughness={0.43} /></mesh>
      <mesh position={[-10.1, 2.45, -11.76]}><planeGeometry args={[3.18, 2.45]} /><meshPhysicalMaterial color="#cbd0cf" metalness={0.64} roughness={0.1} /></mesh>
      {[-10.78, -9.42].map((x) => <mesh key={x} position={[x, 1.02, -11.23]}><cylinderGeometry args={[0.28, 0.22, 0.12, 30]} /><meshStandardMaterial color="#eeeae2" roughness={0.35} /></mesh>)}

      <group position={[-7.55, 0, -11.05]}><RoundedBox args={[0.8, 0.58, 0.92]} radius={0.2} smoothness={7} position={[0, 0.3, 0]} castShadow><meshStandardMaterial color="#ece9e3" roughness={0.36} /></RoundedBox><RoundedBox args={[0.74, 0.52, 0.15]} radius={0.09} smoothness={5} position={[0, 0.85, -0.36]}><meshStandardMaterial color="#ece9e3" roughness={0.36} /></RoundedBox></group>

      <group position={[-6.15, 0, -10.3]}>
        <mesh position={[0, 1.62, 0]}><boxGeometry args={[1.8, 3.1, 0.06]} /><meshPhysicalMaterial color="#dce7e6" transmission={0.9} transparent opacity={0.2} roughness={0.12} /></mesh>
        <mesh position={[-0.88, 1.62, 0.88]} rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[1.8, 3.1, 0.06]} /><meshPhysicalMaterial color="#dce7e6" transmission={0.9} transparent opacity={0.2} roughness={0.12} /></mesh>
        <mesh position={[0, 3.18, 0]}><boxGeometry args={[1.9, 0.06, 0.09]} /><meshStandardMaterial color="#7d756c" metalness={0.56} roughness={0.28} /></mesh>
      </group>
      <mesh position={[-10.0, 3.66, -8.8]}><boxGeometry args={[8.4, 0.03, 0.03]} /><meshBasicMaterial color="#ffd9a3" toneMapped={false} /></mesh>
    </group>
  );
}

function Curtains() {
  return (
    <group>
      {[[-13.7, 1], [13.7, -1]].map(([base, direction]) => <group key={base} position={[base, 1.98, -11.72]}>{Array.from({ length: 7 }).map((_, index) => <RoundedBox key={index} args={[0.22, 3.55, 0.09]} radius={0.08} smoothness={4} position={[(index - 3) * 0.17 * direction, 0, 0]}><meshPhysicalMaterial color="#e5ddd3" transparent opacity={0.58} roughness={0.82} transmission={0.18} /></RoundedBox>)}</group>)}
      <mesh position={[0, 3.78, -11.68]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.028, 0.028, 28.2, 14]} /><meshStandardMaterial color="#ae9169" metalness={0.64} roughness={0.25} /></mesh>
    </group>
  );
}

export default function ArchitecturalDetails({ onArchiveClick, onLettersClick }: { onArchiveClick?: () => void; onLettersClick?: () => void }) {
  return <><FoyerSuite /><KitchenSuite /><StudySuite onArchiveClick={onArchiveClick} onLettersClick={onLettersClick} /><BedroomSuite /><WalkInCloset /><BathroomSuite /><Curtains /></>;
}
