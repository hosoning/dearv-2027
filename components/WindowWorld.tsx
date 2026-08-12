'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { ResolvedEnvironment } from '@/lib/environment';

function seededPoints(count: number, width: number, height: number, depth: number) {
  const values = new Float32Array(count * 3);
  let seed = 9173;
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < count; i += 1) {
    values[i * 3] = (random() - 0.5) * width;
    values[i * 3 + 1] = random() * height;
    values[i * 3 + 2] = (random() - 0.5) * depth;
  }
  return values;
}

function WeatherParticles({ weather }: { weather: ResolvedEnvironment['weather'] }) {
  const ref = useRef<THREE.Points>(null);
  const count = weather === 'rain' ? 220 : weather === 'snow' ? 150 : 0;
  const positions = useMemo(() => seededPoints(Math.max(count, 1), 7, 5.5, 4), [count]);

  useFrame((_, delta) => {
    if (!ref.current || count === 0) return;
    const attribute = ref.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    const speed = weather === 'rain' ? 5.2 : 0.75;
    for (let i = 0; i < count; i += 1) {
      const index = i * 3 + 1;
      attribute.array[index] = Number(attribute.array[index]) - delta * speed;
      if (Number(attribute.array[index]) < -0.5) attribute.array[index] = 5;
    }
    attribute.needsUpdate = true;
  });

  if (count === 0) return null;
  return (
    <points ref={ref} position={[0, -0.3, -1.5]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={weather === 'rain' ? 0.028 : 0.055}
        color={weather === 'rain' ? '#a9c5dc' : '#f5f7ff'}
        transparent
        opacity={weather === 'rain' ? 0.55 : 0.82}
        depthWrite={false}
      />
    </points>
  );
}

function Stars() {
  const positions = useMemo(() => seededPoints(120, 12, 5, 1), []);
  return (
    <points position={[0, 0.7, -2.9]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#fff7dd" transparent opacity={0.85} depthWrite={false} />
    </points>
  );
}

function SeasonalTree({ x, season }: { x: number; season: ResolvedEnvironment['season'] }) {
  const foliage = season === 'spring' ? '#d8a8ae' : season === 'summer' ? '#416f45' : season === 'autumn' ? '#9c5b2e' : '#9d9a8f';
  return (
    <group position={[x, -1.05, -2.3]}>
      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.07, 0.12, 2.1, 10]} />
        <meshStandardMaterial color="#5e4635" roughness={1} />
      </mesh>
      {season !== 'winter' && (
        <>
          <mesh position={[0, 2, 0]}>
            <sphereGeometry args={[0.75, 16, 12]} />
            <meshStandardMaterial color={foliage} roughness={0.95} />
          </mesh>
          <mesh position={[0.45, 1.85, 0.04]}>
            <sphereGeometry args={[0.46, 14, 10]} />
            <meshStandardMaterial color={foliage} roughness={0.95} />
          </mesh>
        </>
      )}
      {season === 'winter' && (
        <>
          <mesh position={[0, 1.8, 0]} rotation={[0, 0, 0.65]}>
            <cylinderGeometry args={[0.025, 0.055, 1.6, 7]} />
            <meshStandardMaterial color="#5e4635" />
          </mesh>
          <mesh position={[0, 1.75, 0]} rotation={[0, 0, -0.75]}>
            <cylinderGeometry args={[0.025, 0.055, 1.45, 7]} />
            <meshStandardMaterial color="#5e4635" />
          </mesh>
        </>
      )}
    </group>
  );
}

export default function WindowWorld({ environment }: { environment: ResolvedEnvironment }) {
  const isNight = environment.dayPhase === 'night';
  const sky = isNight ? '#101a2b' : environment.season === 'summer' ? '#8fc4df' : environment.season === 'winter' ? '#b7c6cf' : '#a9c9d7';
  const ground = environment.season === 'winter' ? '#d9dde0' : environment.season === 'autumn' ? '#806546' : '#557452';
  const celestial = isNight ? '#f4ecd7' : '#ffe5a3';

  return (
    <group position={[0, 0.2, -5.75]}>
      <mesh position={[0, 2.15, -3.1]}>
        <planeGeometry args={[14, 8]} />
        <meshBasicMaterial color={sky} toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.15, -1.9]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 8]} />
        <meshStandardMaterial color={ground} roughness={1} />
      </mesh>

      <mesh position={[2.55, 3.1, -2.35]}>
        <sphereGeometry args={[0.34, 20, 20]} />
        <meshBasicMaterial color={celestial} toneMapped={false} />
      </mesh>
      {isNight && <Stars />}

      {[-4.5, -3.7, -2.9, -2.1, 2.1, 2.9, 3.7, 4.5].map((x, index) => (
        <mesh key={x} position={[x, 0.35 + (index % 3) * 0.15, -2.5]}>
          <boxGeometry args={[0.55, 1.2 + (index % 3) * 0.4, 0.55]} />
          <meshStandardMaterial color={isNight ? '#27303a' : '#9d9b92'} roughness={0.9} />
        </mesh>
      ))}

      <SeasonalTree x={-1.9} season={environment.season} />
      <SeasonalTree x={1.45} season={environment.season} />
      <WeatherParticles weather={environment.weather} />
    </group>
  );
}
