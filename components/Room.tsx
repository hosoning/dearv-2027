'use client';

import { useMemo } from 'react';
import { createFloorTexture, createWallTexture } from '@/lib/textures';
import type { ResolvedEnvironment } from '@/lib/environment';
import WindowWorld from './WindowWorld';

export const ROOM_WIDTH = 16;
export const ROOM_DEPTH = 14;
export const ROOM_HEIGHT = 4.8;

const PANEL_Z = [-5.6, -2.8, 0, 2.8, 5.6];

function CeilingDetails({ isNight }: { isNight: boolean }) {
  const light = isNight ? 1.5 : 0.55;
  return (
    <group>
      <mesh position={[0, ROOM_HEIGHT - 0.12, 0]}>
        <boxGeometry args={[14.7, 0.16, 12.7]} />
        <meshStandardMaterial color="#eee8dc" roughness={0.92} />
      </mesh>
      <mesh position={[0, ROOM_HEIGHT - 0.21, 0]}>
        <boxGeometry args={[14.15, 0.04, 12.15]} />
        <meshStandardMaterial color="#d4c7b3" roughness={0.7} />
      </mesh>
      {[
        [0, -5.95, 13.65, 0.025],
        [0, 5.95, 13.65, 0.025],
        [-6.95, 0, 0.025, 11.65],
        [6.95, 0, 0.025, 11.65],
      ].map(([x, z, w, d], index) => (
        <mesh key={index} position={[x, ROOM_HEIGHT - 0.28, z]}>
          <boxGeometry args={[w, 0.022, d]} />
          <meshStandardMaterial color="#f5c990" emissive="#ffbd71" emissiveIntensity={light} toneMapped={false} />
        </mesh>
      ))}
      {[-5.4, 0, 5.4].flatMap((x) => [-4.5, 0, 4.5].map((z) => [x, z] as const)).map(([x, z]) => (
        <group key={`${x}-${z}`} position={[x, ROOM_HEIGHT - 0.29, z]}>
          <mesh>
            <cylinderGeometry args={[0.055, 0.055, 0.028, 24]} />
            <meshStandardMaterial color="#b99a70" metalness={0.7} roughness={0.25} />
          </mesh>
          <pointLight position={[0, -0.12, 0]} intensity={isNight ? 0.3 : 0.08} distance={2.3} color="#ffd7a4" />
        </group>
      ))}
    </group>
  );
}

function WallMoulding() {
  return (
    <>
      {PANEL_Z.map((z) => (
        <group key={`left-${z}`} position={[-4.93, 1.82, z]} rotation={[0, Math.PI / 2, 0]}>
          <mesh>
            <boxGeometry args={[1.48, 2.35, 0.035]} />
            <meshStandardMaterial color="#efe9de" roughness={0.92} />
          </mesh>
          <mesh position={[0, 0, 0.022]}>
            <boxGeometry args={[1.26, 2.05, 0.022]} />
            <meshStandardMaterial color="#e5dccd" roughness={0.88} />
          </mesh>
        </group>
      ))}
      {[-5.8, -4.6, -3.4, -2.2, -1, 0.2, 1.4, 2.6, 3.8, 5, 6.2].map((z, index) => (
        <mesh key={`slat-${z}`} position={[7.92, 2.15, z]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[0.075, 3.45, 0.09]} />
          <meshStandardMaterial color={index % 2 ? '#4f372b' : '#654737'} roughness={0.52} />
        </mesh>
      ))}
    </>
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
    texture.repeat.set(4, 2);
    return texture;
  }, []);

  const halfW = ROOM_WIDTH / 2;
  const halfD = ROOM_DEPTH / 2;
  const windowWidth = 12.5;
  const windowHeight = 3.75;
  const windowBottom = 0.48;
  const windowCenterY = windowBottom + windowHeight / 2;
  const sideWidth = (ROOM_WIDTH - windowWidth) / 2;
  const topHeight = ROOM_HEIGHT - windowBottom - windowHeight;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial map={floorTexture} roughness={0.54} metalness={0.02} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3.2, 0.008, -1.2]} receiveShadow>
        <planeGeometry args={[6.8, 5.5]} />
        <meshStandardMaterial color="#d8ccbb" roughness={0.9} />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_HEIGHT, 0]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial color="#f4efe6" roughness={0.96} />
      </mesh>
      <CeilingDetails isNight={isNight} />

      <WindowWorld environment={environment} />

      <mesh position={[-(windowWidth / 2 + sideWidth / 2), ROOM_HEIGHT / 2, -halfD]} receiveShadow>
        <boxGeometry args={[sideWidth, ROOM_HEIGHT, 0.16]} />
        <meshStandardMaterial color="#e9e2d6" roughness={0.9} />
      </mesh>
      <mesh position={[(windowWidth / 2 + sideWidth / 2), ROOM_HEIGHT / 2, -halfD]} receiveShadow>
        <boxGeometry args={[sideWidth, ROOM_HEIGHT, 0.16]} />
        <meshStandardMaterial color="#e9e2d6" roughness={0.9} />
      </mesh>
      <mesh position={[0, windowBottom / 2, -halfD]} receiveShadow>
        <boxGeometry args={[windowWidth, windowBottom, 0.16]} />
        <meshStandardMaterial color="#e9e2d6" roughness={0.9} />
      </mesh>
      <mesh position={[0, ROOM_HEIGHT - topHeight / 2, -halfD]} receiveShadow>
        <boxGeometry args={[windowWidth, topHeight, 0.16]} />
        <meshStandardMaterial color="#e9e2d6" roughness={0.9} />
      </mesh>

      <mesh position={[0, windowCenterY, -halfD + 0.095]}>
        <planeGeometry args={[windowWidth, windowHeight]} />
        <meshPhysicalMaterial color="#dfe9eb" transmission={0.96} transparent opacity={0.16} roughness={0.08} thickness={0.05} />
      </mesh>
      {[-windowWidth / 2, -windowWidth / 6, windowWidth / 6, windowWidth / 2].map((x) => (
        <mesh key={x} position={[x, windowCenterY, -halfD + 0.12]}>
          <boxGeometry args={[0.055, windowHeight + 0.12, 0.075]} />
          <meshStandardMaterial color="#493b31" metalness={0.56} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, windowBottom, -halfD + 0.12]}>
        <boxGeometry args={[windowWidth + 0.08, 0.075, 0.09]} />
        <meshStandardMaterial color="#493b31" metalness={0.56} roughness={0.3} />
      </mesh>
      <mesh position={[0, windowBottom + windowHeight, -halfD + 0.12]}>
        <boxGeometry args={[windowWidth + 0.08, 0.075, 0.09]} />
        <meshStandardMaterial color="#493b31" metalness={0.56} roughness={0.3} />
      </mesh>

      {[-6.9, 6.9].map((x) => (
        <group key={x} position={[x, 2.3, -6.77]}>
          <mesh>
            <boxGeometry args={[1.55, 4.02, 0.07]} />
            <meshPhysicalMaterial color="#e7ded0" transmission={0.25} transparent opacity={0.58} roughness={0.7} />
          </mesh>
          {[-0.44, -0.22, 0, 0.22, 0.44].map((offset) => (
            <mesh key={offset} position={[offset, 0, 0.045]}>
              <boxGeometry args={[0.018, 3.9, 0.018]} />
              <meshStandardMaterial color="#d2c4b2" roughness={0.9} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, 4.38, -6.74]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 14.2, 16]} />
        <meshStandardMaterial color="#b99b6f" metalness={0.7} roughness={0.24} />
      </mesh>

      <mesh position={[-halfW, ROOM_HEIGHT / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[ROOM_DEPTH, ROOM_HEIGHT]} />
        <meshStandardMaterial color="#eee8de" roughness={0.91} />
      </mesh>
      <mesh position={[halfW, ROOM_HEIGHT / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[ROOM_DEPTH, ROOM_HEIGHT]} />
        <meshStandardMaterial color="#4d362a" roughness={0.72} />
      </mesh>
      <mesh position={[0, ROOM_HEIGHT / 2, halfD]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[ROOM_WIDTH, ROOM_HEIGHT]} />
        <meshStandardMaterial map={wallTexture} color="#e7dfd3" roughness={0.9} />
      </mesh>

      <WallMoulding />

      {[-halfW + 0.08, halfW - 0.08].map((x) => (
        <mesh key={x} position={[x, 0.09, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[ROOM_DEPTH, 0.18, 0.13]} />
          <meshStandardMaterial color="#8b7158" roughness={0.58} />
        </mesh>
      ))}
      <mesh position={[0, 0.09, halfD - 0.08]}>
        <boxGeometry args={[ROOM_WIDTH, 0.18, 0.13]} />
        <meshStandardMaterial color="#8b7158" roughness={0.58} />
      </mesh>

      <mesh position={[0, 1.8, 6.84]}>
        <boxGeometry args={[4.6, 3.15, 0.16]} />
        <meshStandardMaterial color="#5a4032" roughness={0.55} />
      </mesh>
      {[-1.9, -1.28, -0.64, 0, 0.64, 1.28, 1.9].map((x) => (
        <mesh key={x} position={[x, 1.8, 6.73]}>
          <boxGeometry args={[0.08, 2.42, 0.06]} />
          <meshStandardMaterial color="#b79b73" roughness={0.44} />
        </mesh>
      ))}
    </group>
  );
}
