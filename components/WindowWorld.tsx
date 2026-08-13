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
  const count = weather === 'rain' ? 320 : weather === 'snow' ? 210 : 0;
  const positions = useMemo(() => seededPoints(Math.max(count, 1), 8.6, 6.4, 4.8), [count]);

  useFrame((_, delta) => {
    if (!ref.current || count === 0) return;
    const attribute = ref.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    const speed = weather === 'rain' ? 6.5 : 0.62;
    for (let i = 0; i < count; i += 1) {
      const yIndex = i * 3 + 1;
      const xIndex = i * 3;
      attribute.array[yIndex] = Number(attribute.array[yIndex]) - delta * speed;
      if (weather === 'snow') attribute.array[xIndex] = Number(attribute.array[xIndex]) + Math.sin(i + Date.now() * 0.001) * delta * 0.045;
      if (Number(attribute.array[yIndex]) < -0.65) attribute.array[yIndex] = 5.8;
    }
    attribute.needsUpdate = true;
  });

  if (count === 0) return null;
  return (
    <points ref={ref} position={[0, -0.2, -1.3]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={weather === 'rain' ? 0.022 : 0.06} color={weather === 'rain' ? '#b9cfdd' : '#fbfcff'} transparent opacity={weather === 'rain' ? 0.46 : 0.84} depthWrite={false} />
    </points>
  );
}

function Stars() {
  const positions = useMemo(() => seededPoints(170, 15, 6, 1.2), []);
  return (
    <points position={[0, 0.5, -3.9]}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial size={0.028} color="#fff4d8" transparent opacity={0.82} depthWrite={false} />
    </points>
  );
}

function Clouds({ isNight }: { isNight: boolean }) {
  return (
    <group position={[-1.6, 3.25, -3.4]}>
      {[[-1.15,0,0,0.68],[-0.5,0.12,0,0.92],[0.3,0.02,0,0.74],[2.15,0.2,-0.25,0.58],[2.65,0.26,-0.25,0.82]].map(([x,y,z,scale], index) => (
        <mesh key={index} position={[x,y,z]} scale={scale}>
          <sphereGeometry args={[0.75,20,14]} />
          <meshBasicMaterial color={isNight ? '#6f7890' : '#f0ede6'} transparent opacity={isNight ? 0.14 : 0.22} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function SeasonalTree({ x, z, scale, season }: { x: number; z: number; scale: number; season: ResolvedEnvironment['season'] }) {
  const palette = season === 'spring' ? ['#cda4a7','#d9b5b3','#b9868b'] : season === 'summer' ? ['#355f42','#487b50','#2e553a'] : season === 'autumn' ? ['#9d5931','#bb7440','#774429'] : ['#9f9b92','#b5b2aa','#807b74'];
  return (
    <group position={[x,-0.72,z]} scale={scale}>
      <mesh position={[0,1.05,0]} castShadow><cylinderGeometry args={[0.07,0.14,2.2,10]} /><meshStandardMaterial color="#5f4938" roughness={1} /></mesh>
      <mesh position={[-0.18,1.62,0]} rotation={[0,0,0.72]}><cylinderGeometry args={[0.035,0.07,1.1,8]} /><meshStandardMaterial color="#5f4938" roughness={1} /></mesh>
      <mesh position={[0.22,1.58,0]} rotation={[0,0,-0.7]}><cylinderGeometry args={[0.035,0.07,1.05,8]} /><meshStandardMaterial color="#5f4938" roughness={1} /></mesh>
      {season !== 'winter' && [[0,2.05,0,0.68,0],[-0.48,1.86,0.03,0.46,1],[0.48,1.87,-0.03,0.5,2],[-0.2,2.42,-0.02,0.42,1],[0.28,2.34,0.03,0.44,0]].map(([px,py,pz,radius,colorIndex], index) => (
        <mesh key={index} position={[px,py,pz]}><sphereGeometry args={[radius,18,13]} /><meshStandardMaterial color={palette[colorIndex]} roughness={0.96} /></mesh>
      ))}
      {season === 'winter' && [[-0.42,1.92,0,0.98],[0.42,1.95,0,-0.92],[-0.18,2.3,0,0.62]].map(([px,py,pz,rotation], index) => (
        <mesh key={index} position={[px,py,pz]} rotation={[0,0,rotation]}><cylinderGeometry args={[0.022,0.05,1.18,7]} /><meshStandardMaterial color="#665247" roughness={1} /></mesh>
      ))}
    </group>
  );
}

const BUILDINGS = [[-5.2,1.1,0.65,1.9],[-4.35,1.35,0.72,2.4],[-3.45,0.9,0.55,1.55],[-2.7,1.55,0.82,2.85],[-1.6,1.15,0.72,2.0],[-0.65,1.8,0.95,3.3],[0.62,1.25,0.75,2.15],[1.62,1.65,0.86,2.95],[2.75,1.02,0.62,1.75],[3.62,1.48,0.8,2.55],[4.66,1.18,0.7,2.05]];

function Skyline({ isNight }: { isNight: boolean }) {
  return (
    <group position={[0,-0.35,-4.05]}>
      {BUILDINGS.map(([x,y,width,height], index) => (
        <group key={index} position={[x,y,0]}>
          <mesh><boxGeometry args={[width,height,0.72]} /><meshStandardMaterial color={isNight ? '#242b32' : index % 2 ? '#a59f92' : '#8d8b84'} roughness={0.88} /></mesh>
          {isNight && [0.28,0.03,-0.22].map((wy,wi) => <group key={wi} position={[0,wy*height,0.37]}>{[-0.22,0,0.22].map((wx,xi) => <mesh key={xi} position={[wx*width*1.6,0,0]}><planeGeometry args={[0.07,0.09]} /><meshBasicMaterial color={(index+wi+xi)%3===0 ? '#f4ca7a' : '#718395'} toneMapped={false} /></mesh>)}</group>)}
        </group>
      ))}
    </group>
  );
}

export default function WindowWorld({ environment }: { environment: ResolvedEnvironment }) {
  const isNight = environment.dayPhase === 'night';
  const skyTop = isNight ? '#0c1424' : environment.season === 'winter' ? '#aebbc3' : '#82b8d3';
  const skyMiddle = isNight ? '#182840' : environment.season === 'autumn' ? '#d4a37e' : '#b9d2d9';
  const skyLow = isNight ? '#3b3543' : environment.season === 'spring' ? '#efd1bd' : '#dfd5c6';
  const ground = environment.season === 'winter' ? '#d8d9d7' : environment.season === 'autumn' ? '#76553c' : '#4e6c4d';
  return (
    <group position={[0,0.15,-5.72]}>
      <mesh position={[0,4.6,-4.5]}><planeGeometry args={[16,3.3]} /><meshBasicMaterial color={skyTop} toneMapped={false} /></mesh>
      <mesh position={[0,2.2,-4.48]}><planeGeometry args={[16,2.2]} /><meshBasicMaterial color={skyMiddle} toneMapped={false} /></mesh>
      <mesh position={[0,0.65,-4.46]}><planeGeometry args={[16,1.2]} /><meshBasicMaterial color={skyLow} toneMapped={false} /></mesh>
      <mesh position={[0,-0.28,-2.55]} rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[16,9]} /><meshStandardMaterial color={ground} roughness={1} /></mesh>
      <mesh position={[0,-0.21,-1.65]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[6.4,2]} /><meshStandardMaterial color={environment.season === 'winter' ? '#c6c6c3' : '#a79a86'} roughness={0.94} /></mesh>
      <mesh position={[2.95,3.65,-3.92]}><sphereGeometry args={[isNight ? 0.27 : 0.34,28,28]} /><meshBasicMaterial color={isNight ? '#eee7d7' : '#ffd48a'} toneMapped={false} /></mesh>
      {isNight && <Stars />}
      <Clouds isNight={isNight} />
      <Skyline isNight={isNight} />
      <SeasonalTree x={-2.1} z={-1.65} scale={1.08} season={environment.season} />
      <SeasonalTree x={1.72} z={-1.85} scale={0.96} season={environment.season} />
      <SeasonalTree x={-4.4} z={-2.4} scale={0.72} season={environment.season} />
      <SeasonalTree x={4.28} z={-2.5} scale={0.74} season={environment.season} />
      {isNight && <><pointLight position={[-2.2,0.65,-1.1]} intensity={0.45} distance={4.2} color="#ffc97f" /><pointLight position={[2.15,0.65,-1.25]} intensity={0.42} distance={4.2} color="#ffd18d" />{[-2.2,2.15].map((x) => <mesh key={x} position={[x,0.22,-1.05]}><cylinderGeometry args={[0.035,0.05,0.46,12]} /><meshStandardMaterial color="#2f2c2a" metalness={0.45} roughness={0.35} /></mesh>)}</>}
      <WeatherParticles weather={environment.weather} />
    </group>
  );
}
