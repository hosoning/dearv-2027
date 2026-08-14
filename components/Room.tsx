'use client';

import { useMemo } from 'react';
import { createFloorTexture, createWallTexture, createWalnutTexture } from '@/lib/textures';
import type { ResolvedEnvironment } from '@/lib/environment';
import WindowWorld from './WindowWorld';

export const ROOM_WIDTH = 30;
export const ROOM_DEPTH = 24;
export const ROOM_HEIGHT = 5.2;

const WALL = '#eee8df';
const TRIM = '#9a8064';

function WallBlock({ position, size, walnut = false }: { position: [number, number, number]; size: [number, number, number]; walnut?: boolean }) {
  return (
    <mesh position={position} receiveShadow castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={walnut ? '#6a4a38' : WALL} roughness={walnut ? 0.6 : 0.91} />
    </mesh>
  );
}

function DoorFrame({ position, rotationY = 0, width = 1.45 }: { position: [number, number, number]; rotationY?: number; width?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {[-width / 2, width / 2].map((x) => (
        <mesh key={x} position={[x, 1.42, 0]} castShadow>
          <boxGeometry args={[0.105, 2.84, 0.24]} />
          <meshStandardMaterial color={TRIM} roughness={0.52} />
        </mesh>
      ))}
      <mesh position={[0, 2.82, 0]} castShadow>
        <boxGeometry args={[width + 0.2, 0.11, 0.24]} />
        <meshStandardMaterial color={TRIM} roughness={0.52} />
      </mesh>
    </group>
  );
}

function InteriorDoor({ position, rotationY = 0, hinge = 1 }: { position: [number, number, number]; rotationY?: number; hinge?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <DoorFrame position={[0, 0, 0]} width={1.35} />
      <group position={[hinge * -0.61, 0, 0]} rotation={[0, hinge * -0.92, 0]}>
        <mesh position={[hinge * 0.61, 1.37, 0]} castShadow>
          <boxGeometry args={[1.22, 2.7, 0.095]} />
          <meshStandardMaterial color="#765541" roughness={0.58} />
        </mesh>
        <mesh position={[hinge * 1.02, 1.38, -0.075]}>
          <sphereGeometry args={[0.055, 18, 12]} />
          <meshStandardMaterial color="#c7a878" metalness={0.72} roughness={0.22} />
        </mesh>
      </group>
    </group>
  );
}

function CeilingDetails({ isNight }: { isNight: boolean }) {
  const strips: Array<{ p: [number, number, number]; s: [number, number, number] }> = [
    { p: [3.8, ROOM_HEIGHT - 0.25, -10.8], s: [18.8, 0.025, 0.035] },
    { p: [3.8, ROOM_HEIGHT - 0.25, 10.75], s: [18.8, 0.025, 0.035] },
    { p: [13.2, ROOM_HEIGHT - 0.25, 0], s: [0.035, 0.025, 21.5] },
    { p: [-5.6, ROOM_HEIGHT - 0.25, 0], s: [0.035, 0.025, 21.5] },
  ];
  const downlights = [-11, -6, -1, 4, 9, 13].flatMap((x) => [-8.5, -3, 2.5, 8.3].map((z) => [x, z] as const));

  return (
    <group>
      <mesh position={[0, ROOM_HEIGHT - 0.12, 0]}>
        <boxGeometry args={[28.9, 0.16, 22.9]} />
        <meshStandardMaterial color="#f1ece4" roughness={0.94} />
      </mesh>
      {strips.map((strip, index) => (
        <mesh key={index} position={strip.p}>
          <boxGeometry args={strip.s} />
          <meshStandardMaterial color="#f7d7a8" emissive="#ffc478" emissiveIntensity={isNight ? 1.7 : 0.45} toneMapped={false} />
        </mesh>
      ))}
      {downlights.map(([x, z], index) => (
        <group key={`${x}-${z}`} position={[x, ROOM_HEIGHT - 0.3, z]}>
          <mesh>
            <cylinderGeometry args={[0.06, 0.06, 0.03, 18]} />
            <meshStandardMaterial color="#aa8b65" metalness={0.65} roughness={0.28} />
          </mesh>
          {index % 6 === 0 && <pointLight position={[0, -0.16, 0]} intensity={isNight ? 0.38 : 0.07} distance={5.2} color="#ffd7a2" />}
        </group>
      ))}
    </group>
  );
}

function FullGlassFacade() {
  const halfW = ROOM_WIDTH / 2;
  const z = -ROOM_DEPTH / 2;
  const bottom = 0.2;
  const height = 4.42;
  const y = bottom + height / 2;
  return (
    <group>
      <mesh position={[0, y, z + 0.07]}>
        <planeGeometry args={[ROOM_WIDTH - 0.55, height]} />
        <meshPhysicalMaterial color="#d8e7ea" transmission={0.97} transparent opacity={0.17} roughness={0.07} thickness={0.06} />
      </mesh>
      {/* The ensuite keeps the continuous facade but uses privacy-frosted glass. */}
      <mesh position={[-10.1, y, z + 0.105]}>
        <planeGeometry args={[9.45, height]} />
        <meshPhysicalMaterial color="#edf0ec" transmission={0.42} transparent opacity={0.56} roughness={0.72} thickness={0.12} />
      </mesh>
      <WallBlock position={[0, bottom / 2, z]} size={[ROOM_WIDTH, bottom, 0.18]} />
      <WallBlock position={[0, ROOM_HEIGHT - 0.27, z]} size={[ROOM_WIDTH, 0.54, 0.18]} />
      {[-halfW + 0.25, -10, -5, 0, 5, 10, halfW - 0.25].map((x) => (
        <mesh key={x} position={[x, y, z + 0.12]} castShadow>
          <boxGeometry args={[0.075, height + 0.05, 0.09]} />
          <meshStandardMaterial color="#4a4038" metalness={0.62} roughness={0.27} />
        </mesh>
      ))}
      <mesh position={[0, bottom, z + 0.12]}>
        <boxGeometry args={[ROOM_WIDTH - 0.4, 0.075, 0.1]} />
        <meshStandardMaterial color="#4a4038" metalness={0.62} roughness={0.27} />
      </mesh>
    </group>
  );
}

function InternalArchitecture() {
  return (
    <group>
      {/* The open master wing has one common entrance; only the ensuite is enclosed. */}
      <WallBlock position={[-5.2, 2.6, 4.08]} size={[0.2, 5.2, 15.85]} />
      <WallBlock position={[-5.2, 2.6, -5.63]} size={[0.2, 5.2, 0.75]} />
      <WallBlock position={[-5.2, 2.6, -7.25]} size={[0.2, 5.2, 2.5]} />
      <WallBlock position={[-5.2, 2.6, -10.95]} size={[0.2, 5.2, 2.1]} />
      <InteriorDoor position={[-5.08, 0, -4.55]} rotationY={Math.PI / 2} hinge={-1} />
      <InteriorDoor position={[-5.08, 0, -9.2]} rotationY={Math.PI / 2} />

      {/* The ensuite has a private-wing door and a second door from the living area. */}
      <WallBlock position={[-11.3, 2.6, -6]} size={[7.4, 5.2, 0.2]} />
      <WallBlock position={[-5.68, 2.6, -6]} size={[0.95, 5.2, 0.2]} />
      <InteriorDoor position={[-6.88, 0, -5.88]} hinge={-1} />

      {/* The study is a private room with solid walls, not a glass office. */}
      <WallBlock position={[9.1, 2.6, -5.08]} size={[0.2, 5.2, 13.45]} />
      <WallBlock position={[9.1, 2.6, 3.38]} size={[0.2, 5.2, 0.45]} />
      <WallBlock position={[12.05, 2.6, 3.6]} size={[5.9, 5.2, 0.2]} />
      <InteriorDoor position={[8.98, 0, 2.4]} rotationY={Math.PI / 2} />

      <mesh position={[-5.06, 4.55, 3.4]}>
        <boxGeometry args={[0.08, 0.06, 16.4]} />
        <meshStandardMaterial color="#ffd39a" emissive="#ffbd74" emissiveIntensity={0.6} toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function Room({ environment }: { environment: ResolvedEnvironment }) {
  const isNight = environment.dayPhase === 'night';
  const floorTexture = useMemo(() => {
    const texture = createFloorTexture();
    texture.repeat.set(ROOM_WIDTH / 1.7, ROOM_DEPTH / 1.7);
    return texture;
  }, []);
  const wallTexture = useMemo(() => {
    const texture = createWallTexture();
    texture.repeat.set(7, 2);
    return texture;
  }, []);
  const walnutTexture = useMemo(() => createWalnutTexture(), []);
  const halfW = ROOM_WIDTH / 2;
  const halfD = ROOM_DEPTH / 2;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial map={floorTexture} color="#d8c5aa" roughness={0.56} metalness={0.015} />
      </mesh>
      {/* Stone zones: foyer, kitchen, and ensuite. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10.0, 0.012, 8.2]} receiveShadow>
        <planeGeometry args={[9.7, 7.35]} />
        <meshStandardMaterial color="#c9c0b3" roughness={0.79} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.0, 0.014, 8.7]} receiveShadow>
        <planeGeometry args={[10.7, 6.4]} />
        <meshStandardMaterial color="#d5cec4" roughness={0.73} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-10.1, 0.014, -9.0]} receiveShadow>
        <planeGeometry args={[9.5, 5.85]} />
        <meshStandardMaterial color="#c9c6bf" roughness={0.67} />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_HEIGHT, 0]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial color="#f4f0e9" roughness={0.96} />
      </mesh>
      <CeilingDetails isNight={isNight} />
      <WindowWorld environment={environment} />
      <FullGlassFacade />

      <WallBlock position={[-halfW, ROOM_HEIGHT / 2, 0]} size={[0.18, ROOM_HEIGHT, ROOM_DEPTH]} />
      <mesh position={[halfW, ROOM_HEIGHT / 2, 0]} receiveShadow>
        <boxGeometry args={[0.18, ROOM_HEIGHT, ROOM_DEPTH]} />
        <meshStandardMaterial map={walnutTexture} color="#76553f" roughness={0.63} />
      </mesh>

      {/* Entrance wall with the main door at the top-right. */}
      <mesh position={[-3.12, ROOM_HEIGHT / 2, halfD]} receiveShadow>
        <boxGeometry args={[23.75, ROOM_HEIGHT, 0.18]} />
        <meshStandardMaterial map={wallTexture} color="#e9e2d8" roughness={0.91} />
      </mesh>
      <WallBlock position={[12.15, ROOM_HEIGHT / 2, halfD]} size={[5.7, ROOM_HEIGHT, 0.18]} walnut />
      <WallBlock position={[8.55, 4.08, halfD]} size={[1.5, 2.24, 0.2]} walnut />
      <DoorFrame position={[8.55, 0, halfD - 0.09]} rotationY={Math.PI} width={1.52} />
      <mesh position={[8.55, 1.42, halfD - 0.15]} castShadow>
        <boxGeometry args={[1.36, 2.74, 0.12]} />
        <meshStandardMaterial color="#49352c" roughness={0.5} />
      </mesh>
      <mesh position={[9.02, 1.43, halfD - 0.23]}>
        <sphereGeometry args={[0.06, 18, 12]} />
        <meshStandardMaterial color="#d1b17d" metalness={0.78} roughness={0.2} />
      </mesh>

      <InternalArchitecture />

      {/* Low baseboards make the scale read as finished architecture. */}
      <mesh position={[-halfW + 0.11, 0.105, 0]}><boxGeometry args={[0.15, 0.21, ROOM_DEPTH]} /><meshStandardMaterial color={TRIM} roughness={0.6} /></mesh>
      <mesh position={[halfW - 0.11, 0.105, 0]}><boxGeometry args={[0.15, 0.21, ROOM_DEPTH]} /><meshStandardMaterial color={TRIM} roughness={0.6} /></mesh>
      <mesh position={[0, 0.105, halfD - 0.11]}><boxGeometry args={[ROOM_WIDTH, 0.21, 0.15]} /><meshStandardMaterial color={TRIM} roughness={0.6} /></mesh>
    </group>
  );
}
