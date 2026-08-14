'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
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
  const count = weather === 'rain' ? 260 : weather === 'snow' ? 170 : 0;
  const positions = useMemo(() => seededPoints(Math.max(count, 1), 31, 8, 5.5), [count]);

  useFrame((state, delta) => {
    if (!ref.current || count === 0) return;
    const attribute = ref.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    const speed = weather === 'rain' ? 6.7 : 0.58;
    for (let i = 0; i < count; i += 1) {
      const yIndex = i * 3 + 1;
      const xIndex = i * 3;
      attribute.array[yIndex] = Number(attribute.array[yIndex]) - delta * speed;
      if (weather === 'snow') {
        attribute.array[xIndex] = Number(attribute.array[xIndex]) + Math.sin(i * 0.9 + state.clock.elapsedTime) * delta * 0.04;
      }
      if (Number(attribute.array[yIndex]) < -0.65) attribute.array[yIndex] = 6.7;
    }
    attribute.needsUpdate = true;
  });

  if (count === 0) return null;
  return (
    <points ref={ref} position={[0, -0.1, -2.4]}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial size={weather === 'rain' ? 0.018 : 0.052} color={weather === 'rain' ? '#c2d2db' : '#fbfcff'} transparent opacity={weather === 'rain' ? 0.38 : 0.8} depthWrite={false} />
    </points>
  );
}

export default function WindowWorld({ environment }: { environment: ResolvedEnvironment }) {
  return (
    <group position={[0, 0, -11.7]}>
      {/* The visible landscape now comes from a photographic CC0 HDR panorama.
          Only the glass-side weather layer remains procedural. */}
      <WeatherParticles weather={environment.weather} />
    </group>
  );
}
