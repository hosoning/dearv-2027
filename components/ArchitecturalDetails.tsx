'use client';

import { RoundedBox } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';

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
      <group position={[14.25, 0, 9.25]} rotation={[0, -Math.PI / 2, 0]}>
        <RoundedBox args={[3.5, 1.0, 0.48]} radius={0.06} smoothness={4} position={[0, 0.5, 0]} castShadow>
          <meshStandardMaterial color="#70513d" roughness={0.56} />
        </RoundedBox>
        {[-1.05, 0, 1.05].map((x) => (
          <mesh key={x} position={[x, 0.53, 0.255]}><boxGeometry args={[0.025, 0.72, 0.018]} /><meshStandardMaterial color="#bba077" /></mesh>
        ))}
        <RoundedBox args={[2.25, 0.18, 0.62]} radius={0.07} smoothness={5} position={[0, 1.08, 0.02]} castShadow>
          <meshStandardMaterial color="#b6aaa0" roughness={0.98} />
        </RoundedBox>
        <mesh position={[0, 2.65, 0.27]}>
          <planeGeometry args={[2.7, 2.15]} />
          <meshPhysicalMaterial color="#cbd1d0" metalness={0.55} roughness={0.12} />
        </mesh>
        <mesh position={[0, 2.65, 0.245]}><boxGeometry args={[2.9, 2.35, 0.07]} /><meshStandardMaterial color="#aa8b64" metalness={0.55} roughness={0.28} /></mesh>
        <mesh position={[0, 2.65, 0.29]}><planeGeometry args={[2.68, 2.13]} /><meshPhysicalMaterial color="#bfc7c7" metalness={0.66} roughness={0.08} /></mesh>
      </group>
      <group position={[8.55, 0, 10.55]}>
        <RoundedBox args={[2.8, 0.1, 0.72]} radius={0.04} smoothness={4} position={[0, 0.52, 0]} castShadow><meshStandardMaterial color="#6f503c" roughness={0.52} /></RoundedBox>
        {[-1.13, 1.13].map((x) => <mesh key={x} position={[x, 0.25, 0]}><boxGeometry args={[0.08, 0.5, 0.55]} /><meshStandardMaterial color="#604331" roughness={0.58} /></mesh>)}
        <RoundedBox args={[2.35, 0.15, 0.62]} radius={0.065} smoothness={5} position={[0, 0.63, 0]}><meshStandardMaterial color="#c0b4a7" roughness={0.95} /></RoundedBox>
      </group>
      <mesh position={[8.55, 3.82, 10.8]}><boxGeometry args={[4.8, 0.035, 0.035]} /><meshStandardMaterial color="#ffd49a" emissive="#ffc278" emissiveIntensity={0.85} toneMapped={false} /></mesh>
    </group>
  );
}

function BarStool({ x }: { x: number }) {
  return (
    <group position={[x, 0, 6.38]}>
      <RoundedBox args={[0.52, 0.12, 0.48]} radius={0.08} smoothness={5} position={[0, 0.78, 0]} castShadow><meshStandardMaterial color="#a99a8c" roughness={0.88} /></RoundedBox>
      <mesh position={[0, 0.4, 0]}><cylinderGeometry args={[0.045, 0.07, 0.76, 14]} /><meshStandardMaterial color="#6d5847" metalness={0.22} roughness={0.42} /></mesh>
      <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[0.26, 0.3, 0.06, 28]} /><meshStandardMaterial color="#6d5847" metalness={0.22} roughness={0.42} /></mesh>
      <mesh position={[0, 0.85, 0.2]}><boxGeometry args={[0.48, 0.42, 0.08]} /><meshStandardMaterial color="#9d8c7d" roughness={0.9} /></mesh>
    </group>
  );
}

function KitchenSuite() {
  const cabinetXs = [-11.8, -10.1, -8.4, -6.7];
  return (
    <group>
      <RoundedBox args={[8.7, 0.9, 1.05]} radius={0.055} smoothness={4} position={[-9.4, 0.45, 11.15]} castShadow receiveShadow>
        <meshStandardMaterial color="#74604f" roughness={0.58} />
      </RoundedBox>
      <mesh position={[-9.4, 0.94, 10.98]} castShadow receiveShadow><boxGeometry args={[8.9, 0.11, 1.28]} /><meshStandardMaterial color="#d7d0c6" roughness={0.46} /></mesh>
      {cabinetXs.map((x) => (
        <RoundedBox key={x} args={[1.55, 1.52, 0.48]} radius={0.035} smoothness={3} position={[x, 3.1, 11.55]} castShadow>
          <meshStandardMaterial color="#8b735f" roughness={0.67} />
        </RoundedBox>
      ))}
      <RoundedBox args={[1.45, 3.45, 1.1]} radius={0.055} smoothness={4} position={[-13.65, 1.725, 11.0]} castShadow><meshStandardMaterial color="#817466" metalness={0.2} roughness={0.46} /></RoundedBox>
      <mesh position={[-10.65, 0.985, 10.82]}><boxGeometry args={[1.4, 0.035, 0.7]} /><meshStandardMaterial color="#55585a" metalness={0.35} roughness={0.28} /></mesh>
      <mesh position={[-10.65, 1.0, 10.82]}><boxGeometry args={[1.08, 0.035, 0.48]} /><meshStandardMaterial color="#25292b" roughness={0.24} /></mesh>
      <mesh position={[-10.05, 1.25, 10.92]} rotation={[0, 0, -0.15]}><torusGeometry args={[0.24, 0.035, 12, 28, Math.PI]} /><meshStandardMaterial color="#a49c91" metalness={0.72} roughness={0.22} /></mesh>
      <mesh position={[-7.25, 0.99, 10.78]}><boxGeometry args={[1.35, 0.04, 0.7]} /><meshStandardMaterial color="#242527" roughness={0.24} /></mesh>
      {[-7.62, -6.88].flatMap((x) => [10.55, 10.98].map((z) => [x, z] as const)).map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, 1.025, z]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.18, 0.018, 10, 32]} /><meshStandardMaterial color="#77736c" metalness={0.5} roughness={0.32} /></mesh>
      ))}
      <RoundedBox args={[1.8, 0.48, 0.56]} radius={0.06} smoothness={5} position={[-7.25, 2.72, 11.55]} castShadow><meshStandardMaterial color="#75604d" roughness={0.58} /></RoundedBox>
      <mesh position={[-7.25, 2.36, 11.27]}><boxGeometry args={[1.3, 0.035, 0.03]} /><meshBasicMaterial color="#ffd69d" toneMapped={false} /></mesh>

      <RoundedBox args={[5.15, 0.9, 1.32]} radius={0.08} smoothness={5} position={[-8.0, 0.45, 7.35]} castShadow receiveShadow>
        <meshStandardMaterial color="#765a45" roughness={0.52} />
      </RoundedBox>
      <RoundedBox args={[5.38, 0.13, 1.48]} radius={0.08} smoothness={5} position={[-8.0, 0.96, 7.35]} castShadow>
        <meshStandardMaterial color="#d4cdc3" roughness={0.42} />
      </RoundedBox>
      <mesh position={[-8.0, 1.88, 7.35]}><cylinderGeometry args={[0.025, 0.025, 4.6, 12]} /><meshStandardMaterial color="#ad8e63" metalness={0.68} roughness={0.24} /></mesh>
      {[-9.7, -8.55, -7.4, -6.25].map((x) => <BarStool key={x} x={x} />)}
      <CeramicVase position={[-9.65, 1.04, 7.35]} scale={0.34} color="#b5aa9e" />
    </group>
  );
}

function BookWall({ onClick }: { onClick?: () => void }) {
  const bays = [5.25, 7.45, 9.65, 11.85, 14.05];
  const colors = ['#6c5647', '#9b8065', '#4d665e', '#8f6b5d', '#b6a184'];
  return (
    <group onClick={clickThrough(onClick)}>
      <mesh position={[9.65, 2.45, 11.52]} castShadow><boxGeometry args={[10.65, 4.45, 0.48]} /><meshStandardMaterial color="#4c372d" roughness={0.54} /></mesh>
      {bays.map((x, bay) => (
        <group key={x} position={[x, 0, 11.22]}>
          <mesh position={[0, 2.55, 0]}><boxGeometry args={[1.85, 3.75, 0.1]} /><meshStandardMaterial color="#7b5c45" roughness={0.62} /></mesh>
          {[1.1, 1.85, 2.6, 3.35, 4.1].map((y) => <mesh key={y} position={[0, y, 0.18]}><boxGeometry args={[1.78, 0.055, 0.42]} /><meshStandardMaterial color="#9b7757" roughness={0.5} /></mesh>)}
          {[1.2, 1.95, 2.7, 3.45].map((y, row) => (
            <group key={y} position={[0, y, 0.22]}>
              {Array.from({ length: 6 }).map((_, i) => {
                const h = 0.38 + ((i + row + bay) % 3) * 0.08;
                return <mesh key={i} position={[-0.67 + i * 0.26, h / 2, 0]}><boxGeometry args={[0.16 + (i % 2) * 0.035, h, 0.28]} /><meshStandardMaterial color={colors[(i + row + bay) % colors.length]} roughness={0.88} /></mesh>;
              })}
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

function StudySuite({ onArchiveClick, onLettersClick }: { onArchiveClick?: () => void; onLettersClick?: () => void }) {
  return (
    <group>
      <BookWall onClick={onArchiveClick} />
      <group position={[10, 0, 7.35]} onClick={clickThrough(onLettersClick)}>
        <RoundedBox args={[4.35, 0.15, 1.5]} radius={0.07} smoothness={5} position={[0, 0.82, 0]} castShadow receiveShadow><meshStandardMaterial color="#72513d" roughness={0.5} /></RoundedBox>
        {[-1.75, 1.75].map((x) => <RoundedBox key={x} args={[0.5, 0.78, 1.18]} radius={0.04} smoothness={4} position={[x, 0.39, 0]} castShadow><meshStandardMaterial color="#604333" roughness={0.56} /></RoundedBox>)}
        <mesh position={[0.65, 1.34, -0.1]} rotation={[-0.08, 0, 0]} castShadow><boxGeometry args={[1.35, 0.78, 0.07]} /><meshStandardMaterial color="#292d31" roughness={0.25} /></mesh>
        <mesh position={[0.65, 1.0, -0.1]}><boxGeometry args={[0.08, 0.45, 0.08]} /><meshStandardMaterial color="#8b7762" metalness={0.42} roughness={0.3} /></mesh>
        <group position={[-1.2, 0.9, 0.15]}>
          <mesh position={[0, 0.42, 0]} rotation={[0, 0, -0.3]}><cylinderGeometry args={[0.035, 0.045, 0.75, 12]} /><meshStandardMaterial color="#b89968" metalness={0.68} roughness={0.22} /></mesh>
          <mesh position={[0.11, 0.82, 0]} rotation={[0, 0, -0.25]}><coneGeometry args={[0.27, 0.34, 24]} /><meshStandardMaterial color="#c6a670" metalness={0.56} roughness={0.26} /></mesh>
          <pointLight position={[0.2, 0.65, 0.1]} intensity={0.32} distance={2.7} color="#ffd39b" />
        </group>
        <BooksStack position={[-0.55, 0.91, 0.2]} rotationY={0.12} />
      </group>
      <group position={[10, 0, 5.8]} rotation={[0, Math.PI, 0]}>
        <RoundedBox args={[1.0, 0.16, 1.0]} radius={0.1} smoothness={5} position={[0, 0.52, 0]} castShadow><meshStandardMaterial color="#a89a8e" roughness={0.94} /></RoundedBox>
        <RoundedBox args={[0.95, 0.9, 0.15]} radius={0.08} smoothness={5} position={[0, 0.92, 0.4]} castShadow><meshStandardMaterial color="#938477" roughness={0.93} /></RoundedBox>
        <mesh position={[0, 0.28, 0]}><cylinderGeometry args={[0.07, 0.1, 0.5, 16]} /><meshStandardMaterial color="#64554b" metalness={0.25} roughness={0.38} /></mesh>
        <mesh position={[0, 0.04, 0]}><cylinderGeometry args={[0.38, 0.42, 0.07, 28]} /><meshStandardMaterial color="#64554b" metalness={0.25} roughness={0.38} /></mesh>
      </group>
      <BooksStack position={[13.25, 0.18, 4.52]} rotationY={-0.15} />
    </group>
  );
}

function BedroomSuite() {
  return (
    <group>
      <group position={[-8.45, 1.9, 2.35]}>
        <RoundedBox args={[5.3, 3.15, 0.18]} radius={0.06} smoothness={4} castShadow receiveShadow><meshStandardMaterial color="#806451" roughness={0.75} /></RoundedBox>
        <RoundedBox args={[4.75, 2.65, 0.08]} radius={0.05} smoothness={4} position={[0, 0, -0.12]}><meshStandardMaterial color="#c9b9a8" roughness={0.92} /></RoundedBox>
        <mesh position={[0, 1.11, -0.17]}><boxGeometry args={[4.15, 0.025, 0.025]} /><meshBasicMaterial color="#ffd69f" toneMapped={false} /></mesh>
      </group>
      {[-10.5, -6.4].map((x) => (
        <group key={x} position={[x, 0, 0.7]}>
          <RoundedBox args={[0.86, 0.5, 0.66]} radius={0.055} smoothness={4} position={[0, 0.25, 0]} castShadow><meshStandardMaterial color="#745640" roughness={0.57} /></RoundedBox>
          <mesh position={[0, 1.35, 0]}><cylinderGeometry args={[0.025, 0.025, 1.65, 12]} /><meshStandardMaterial color="#b8996b" metalness={0.65} roughness={0.24} /></mesh>
          <mesh position={[0, 2.08, 0]}><sphereGeometry args={[0.2, 24, 16]} /><meshPhysicalMaterial color="#ead8bf" transmission={0.42} transparent opacity={0.82} roughness={0.28} /></mesh>
          <pointLight position={[0, 1.8, 0]} intensity={0.2} distance={2.6} color="#ffd6a1" />
        </group>
      ))}
      <RoundedBox args={[3.4, 0.42, 0.72]} radius={0.08} smoothness={5} position={[-8.45, 0.32, -2.2]} castShadow><meshStandardMaterial color="#aa9889" roughness={0.96} /></RoundedBox>
    </group>
  );
}

function WalkInCloset() {
  const garmentColors = ['#dacfc2', '#7b6b60', '#a9a29b', '#5a6871', '#bda98f'];
  return (
    <group>
      <mesh position={[-13.95, 2.2, -0.25]}><boxGeometry args={[0.55, 4.05, 6.85]} /><meshStandardMaterial color="#684b39" roughness={0.58} /></mesh>
      {[0.45, 1.45, 2.45, 3.45].map((y) => <mesh key={y} position={[-13.62, y, -0.25]}><boxGeometry args={[0.58, 0.055, 6.55]} /><meshStandardMaterial color="#9b7656" roughness={0.5} /></mesh>)}
      {[-2.65, -1.4, -0.15, 1.1, 2.35].map((z, index) => (
        <group key={z} position={[-13.55, 2.6, z]} rotation={[0, Math.PI / 2, 0]}>
          <mesh position={[0, 0.65, 0]}><cylinderGeometry args={[0.018, 0.018, 0.8, 10]} /><meshStandardMaterial color="#c2a36f" metalness={0.62} roughness={0.25} /></mesh>
          <RoundedBox args={[0.58, 0.8 + (index % 2) * 0.16, 0.08]} radius={0.04} smoothness={4} position={[0, 0.1, 0]} castShadow><meshPhysicalMaterial color={garmentColors[index]} roughness={0.48} sheen={0.55} /></RoundedBox>
        </group>
      ))}
      <group position={[-11.35, 0, 3.75]}>
        <mesh position={[0, 2.0, 0]}><boxGeometry args={[4.3, 3.7, 0.55]} /><meshStandardMaterial color="#684b39" roughness={0.58} /></mesh>
        {[0.55, 1.3, 2.05, 2.8, 3.55].map((y) => <mesh key={y} position={[0, y, -0.32]}><boxGeometry args={[4.05, 0.06, 0.52]} /><meshStandardMaterial color="#997454" roughness={0.52} /></mesh>)}
        {[-1.5, -0.5, 0.5, 1.5].map((x) => <mesh key={x} position={[x, 0.72, -0.58]}><boxGeometry args={[0.58, 0.26, 0.35]} /><meshStandardMaterial color="#92765f" roughness={0.78} /></mesh>)}
      </group>
    </group>
  );
}

function BathroomSuite() {
  return (
    <group>
      <RoundedBox args={[3.45, 0.78, 1.55]} radius={0.23} smoothness={8} position={[-12.2, 0.42, -8.65]} castShadow receiveShadow><meshStandardMaterial color="#eeeae3" roughness={0.38} /></RoundedBox>
      <RoundedBox args={[3.02, 0.44, 1.18]} radius={0.2} smoothness={8} position={[-12.2, 0.73, -8.65]}><meshStandardMaterial color="#d8e1e0" roughness={0.18} /></RoundedBox>
      <mesh position={[-10.5, 1.08, -8.65]} rotation={[0, 0, -0.12]}><torusGeometry args={[0.31, 0.04, 12, 30, Math.PI]} /><meshStandardMaterial color="#9e958a" metalness={0.72} roughness={0.22} /></mesh>
      <RoundedBox args={[2.7, 0.82, 0.72]} radius={0.06} smoothness={5} position={[-7.15, 0.41, -9.72]} castShadow><meshStandardMaterial color="#786555" roughness={0.62} /></RoundedBox>
      <mesh position={[-7.15, 0.86, -9.67]}><boxGeometry args={[2.88, 0.1, 0.9]} /><meshStandardMaterial color="#d9d4cc" roughness={0.43} /></mesh>
      <mesh position={[-7.15, 2.38, -10.08]}><planeGeometry args={[2.7, 2.35]} /><meshPhysicalMaterial color="#cbd0cf" metalness={0.64} roughness={0.1} /></mesh>
      {[-7.75, -6.55].map((x) => <mesh key={x} position={[x, 1.0, -9.62]}><cylinderGeometry args={[0.28, 0.22, 0.12, 30]} /><meshStandardMaterial color="#eeeae2" roughness={0.35} /></mesh>)}
      <group position={[-7.0, 0, -6.45]}>
        <RoundedBox args={[0.78, 0.58, 0.92]} radius={0.2} smoothness={7} position={[0, 0.3, 0]} castShadow><meshStandardMaterial color="#ece9e3" roughness={0.36} /></RoundedBox>
        <RoundedBox args={[0.72, 0.52, 0.15]} radius={0.09} smoothness={5} position={[0, 0.85, 0.36]}><meshStandardMaterial color="#ece9e3" roughness={0.36} /></RoundedBox>
      </group>
      <group position={[-13.2, 0, -6.1]}>
        <mesh position={[0, 1.65, 0]}><boxGeometry args={[2.25, 3.1, 0.06]} /><meshPhysicalMaterial color="#dce7e6" transmission={0.9} transparent opacity={0.2} roughness={0.12} /></mesh>
        <mesh position={[0, 3.2, 0]}><boxGeometry args={[2.3, 0.06, 0.09]} /><meshStandardMaterial color="#7d756c" metalness={0.56} roughness={0.28} /></mesh>
        <mesh position={[0, 1.65, 0]}><boxGeometry args={[0.05, 3.1, 0.09]} /><meshStandardMaterial color="#7d756c" metalness={0.56} roughness={0.28} /></mesh>
      </group>
      <mesh position={[-10.1, 3.85, -7.75]}><boxGeometry args={[7.8, 0.03, 0.03]} /><meshBasicMaterial color="#ffd9a3" toneMapped={false} /></mesh>
    </group>
  );
}

function SofaConsole() {
  return (
    <group position={[2.4, 0, -1.45]}>
      <RoundedBox args={[4.35, 0.13, 0.55]} radius={0.05} smoothness={4} position={[0, 0.76, 0]} castShadow><meshStandardMaterial color="#624534" roughness={0.51} /></RoundedBox>
      {[-1.85, 1.85].map((x) => <RoundedBox key={x} args={[0.1, 0.76, 0.42]} radius={0.025} smoothness={3} position={[x, 0.38, 0]} castShadow><meshStandardMaterial color="#50372c" roughness={0.56} /></RoundedBox>)}
      <BooksStack position={[-0.9, 0.84, 0]} rotationY={0.08} />
      <CeramicVase position={[0.4, 0.84, 0]} scale={0.36} color="#c0b09d" />
    </group>
  );
}

function Curtains() {
  return (
    <group>
      {[[-13.7, 7], [13.7, 7]].map(([base, direction]) => (
        <group key={base} position={[base, 2.48, -11.72]}>
          {Array.from({ length: 7 }).map((_, index) => (
            <RoundedBox key={index} args={[0.22, 4.55, 0.09]} radius={0.08} smoothness={4} position={[(index - 3) * 0.17 * Math.sign(direction), 0, 0]}>
              <meshPhysicalMaterial color="#e5ddd3" transparent opacity={0.58} roughness={0.82} transmission={0.18} />
            </RoundedBox>
          ))}
        </group>
      ))}
      <mesh position={[0, 4.76, -11.68]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.028, 0.028, 28.2, 14]} /><meshStandardMaterial color="#ae9169" metalness={0.64} roughness={0.25} /></mesh>
    </group>
  );
}

export default function ArchitecturalDetails({
  onArchiveClick,
  onLettersClick,
}: {
  onArchiveClick?: () => void;
  onLettersClick?: () => void;
}) {
  return (
    <>
      <FoyerSuite />
      <KitchenSuite />
      <StudySuite onArchiveClick={onArchiveClick} onLettersClick={onLettersClick} />
      <BedroomSuite />
      <WalkInCloset />
      <BathroomSuite />
      <SofaConsole />
      <Curtains />
    </>
  );
}
