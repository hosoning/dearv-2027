'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ResolvedEnvironment } from '@/lib/environment';
import { createCityPanoramaTexture } from '@/lib/panorama';

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
  const count = weather === 'rain' ? 260 : weather === 'snow' ? 170 : 0;
  const positions = useMemo(() => seededPoints(Math.max(count, 1), 9.6, 6.6, 4.5), [count]);

  useFrame((state, delta) => {
    if (!ref.current || count === 0) return;
    const attribute = ref.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    const speed = weather === 'rain' ? 6.7 : 0.58;
    for (let i = 0; i < count; i += 1) {
      const yIndex = i * 3 + 1;
      const xIndex = i * 3;
      attribute.array[yIndex] = Number(attribute.array[yIndex]) - delta * speed;
      if (weather === 'snow') attribute.array[xIndex] = Number(attribute.array[xIndex]) + Math.sin(i * 0.9 + state.clock.elapsedTime) * delta * 0.04;
      if (Number(attribute.array[yIndex]) < -0.65) attribute.array[yIndex] = 5.9;
    }
    attribute.needsUpdate = true;
  });

  if (count === 0) return null;
  return (
    <points ref={ref} position={[0, -0.2, -1.3]}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial size={weather === 'rain' ? 0.019 : 0.055} color={weather === 'rain' ? '#c2d2db' : '#fbfcff'} transparent opacity={weather === 'rain' ? 0.42 : 0.82} depthWrite={false} />
    </points>
  );
}

function SeasonalTree({ x, z, scale, season }: { x: number; z: number; scale: number; season: ResolvedEnvironment['season'] }) {
  const palette = season === 'spring'
    ? ['#b98f93', '#d0aaa9', '#8d6e72']
    : season === 'summer'
      ? ['#31533a', '#426b45', '#274532']
      : season === 'autumn'
        ? ['#8f4e2d', '#b56b39', '#70402a']
        : ['#9f9b92', '#b5b2aa', '#807b74'];

  return (
    <group position={[x, -0.74, z]} scale={scale}>
      <mesh position={[0, 1.08, 0]} castShadow>
        <cylinderGeometry args={[0.075, 0.15, 2.2, 9]} />
        <meshStandardMaterial color="#5d4737" roughness={1} />
      </mesh>
      {[[-0.18, 1.62, 0, 0.72], [0.22, 1.58, 0, -0.7], [0.03, 1.9, 0, 0.24]].map(([px, py, pz, rot], index) => (
        <mesh key={index} position={[px, py, pz]} rotation={[0, 0, rot]}>
          <cylinderGeometry args={[0.03, 0.065, 1.1 - index * 0.12, 7]} />
          <meshStandardMaterial color="#5d4737" roughness={1} />
        </mesh>
      ))}
      {season !== 'winter' && [
        [0, 2.07, 0, 0.72, 0],
        [-0.5, 1.86, 0.04, 0.5, 1],
        [0.48, 1.89, -0.02, 0.54, 2],
        [-0.22, 2.43, -0.02, 0.45, 1],
        [0.31, 2.37, 0.03, 0.47, 0],
      ].map(([px, py, pz, radius, colorIndex], index) => (
        <mesh key={index} position={[px, py, pz]} rotation={[index * 0.24, index * 0.33, 0]}>
          <icosahedronGeometry args={[radius, 2]} />
          <meshStandardMaterial color={palette[colorIndex]} roughness={0.98} />
        </mesh>
      ))}
      {season === 'winter' && (
        <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.78, 28]} />
          <meshStandardMaterial color="#e8e9e7" roughness={1} />
        </mesh>
      )}
    </group>
  );
}

export default function WindowWorld({ environment }: { environment: ResolvedEnvironment }) {
  const isNight = environment.dayPhase === 'night';
  const panorama = useMemo(() => {
    const mobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 900px), (max-height: 600px)').matches;
    return createCityPanoramaTexture({
      season: environment.season,
      isNight,
      weather: environment.weather,
      width: mobile ? 768 : 1280,
      height: mobile ? 432 : 720,
    });
  }, [environment.season, environment.weather, isNight]);

  useEffect(() => () => panorama.dispose(), [panorama]);

  const ground = environment.season === 'winter' ? '#d8d9d7' : environment.season === 'autumn' ? '#74533b' : '#445f45';

  return (
    <group position={[0, 0.12, -5.72]}>
      <mesh position={[0, 2.35, -5.1]}>
        <planeGeometry args={[18, 8.5]} />
        <meshBasicMaterial map={panorama} toneMapped={false} />
      </mesh>

      <mesh position={[0, -0.3, -1.95]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 7.2]} />
        <meshStandardMaterial color={ground} roughness={1} />
      </mesh>
      <mesh position={[0, -0.21, -1.32]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7.5, 1.75]} />
        <meshStandardMaterial color={environment.season === 'winter' ? '#c9c9c5' : '#9c907e'} roughness={0.96} />
      </mesh>

      <SeasonalTree x={-2.4} z={-1.55} scale={1.12} season={environment.season} />
      <SeasonalTree x={2.02} z={-1.72} scale={1.0} season={environment.season} />
      <SeasonalTree x={-4.9} z={-2.15} scale={0.72} season={environment.season} />
      <SeasonalTree x={4.82} z={-2.22} scale={0.74} season={environment.season} />

      {isNight && (
        <>
          <pointLight position={[-2.45, 0.55, -1.0]} intensity={0.35} distance={3.8} color="#ffc97f" />
          <pointLight position={[2.1, 0.55, -1.05]} intensity={0.32} distance={3.8} color="#ffd18d" />
          {[-2.45, 2.1].map((x) => (
            <group key={x} position={[x, 0.18, -1.02]}>
              <mesh><cylinderGeometry args={[0.035, 0.05, 0.46, 12]} /><meshStandardMaterial color="#2f2c2a" metalness={0.45} roughness={0.35} /></mesh>
              <mesh position={[0, 0.31, 0]}><sphereGeometry args={[0.055, 16, 12]} /><meshBasicMaterial color="#ffd596" toneMapped={false} /></mesh>
            </group>
          ))}
        </>
      )}

      <WeatherParticles weather={environment.weather} />
    </group>
  );
}
