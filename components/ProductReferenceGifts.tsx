'use client';

import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

function Rose({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const petals = useMemo(() => Array.from({ length: 10 }, (_, i) => i), []);
  return (
    <group position={position} scale={scale}>
      {petals.map((i) => {
        const a = (i / petals.length) * Math.PI * 2;
        const r = 0.035 + (i % 3) * 0.012;
        return (
          <mesh key={i} position={[Math.cos(a) * r, Math.sin(a) * r, 0.018 + (i % 2) * 0.01]} rotation={[0.55, a, 0]} castShadow>
            <sphereGeometry args={[0.065, 14, 10]} />
            <meshPhysicalMaterial color={i % 2 ? '#dca2ae' : '#efbac4'} roughness={0.62} sheen={0.5} />
          </mesh>
        );
      })}
      <mesh position={[0, 0, 0.04]} castShadow>
        <sphereGeometry args={[0.055, 16, 12]} />
        <meshStandardMaterial color="#c57f8f" roughness={0.7} />
      </mesh>
    </group>
  );
}

function RibbonBow() {
  const loopShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.12, 0.1, 0.25, 0.12, 0.3, 0.02);
    shape.bezierCurveTo(0.22, -0.04, 0.11, -0.05, 0, 0);
    return shape;
  }, []);
  return (
    <group>
      {[-1, 1].map((side) => (
        <mesh key={side} scale={[side, 1, 1]} rotation={[0, 0, side * -0.16]} castShadow>
          <extrudeGeometry args={[loopShape, { depth: 0.025, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.006, bevelSegments: 2 }]} />
          <meshPhysicalMaterial color="#d89fa7" roughness={0.38} sheen={0.86} sheenRoughness={0.3} />
        </mesh>
      ))}
      <mesh castShadow>
        <sphereGeometry args={[0.055, 18, 12]} />
        <meshPhysicalMaterial color="#c98f98" roughness={0.35} sheen={0.9} />
      </mesh>
    </group>
  );
}

export function Gift520Reference({
  position = [0, 0, 0],
  rotationY = 0,
  onInspect,
}: {
  position?: [number, number, number];
  rotationY?: number;
  onInspect?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rosePositions = useMemo(() => {
    const points: [number, number, number][] = [];
    for (let ring = 0; ring < 3; ring++) {
      const count = ring === 0 ? 1 : ring * 7;
      for (let i = 0; i < count; i++) {
        const radius = ring * 0.11;
        const angle = count === 1 ? 0 : (i / count) * Math.PI * 2;
        points.push([Math.cos(angle) * radius, Math.sin(angle) * radius, 0]);
      }
    }
    return points;
  }, []);

  return (
    <group
      position={position}
      rotation={[0, rotationY, 0]}
      onClick={(event) => {
        event.stopPropagation();
        setOpen((v) => !v);
        onInspect?.();
      }}
      onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      <group position={[-0.52, 0, 0]}>
        <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.39, 0.39, 0.46, 64]} />
          <meshPhysicalMaterial color="#eee0bb" roughness={0.64} clearcoat={0.08} />
        </mesh>
        <mesh position={[0, 0.49, 0]} castShadow>
          <cylinderGeometry args={[0.405, 0.405, 0.07, 64]} />
          <meshPhysicalMaterial color="#ead7ad" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.51, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.34, 0.015, 10, 64]} />
          <meshStandardMaterial color="#b89a75" roughness={0.62} />
        </mesh>
        <group position={[0, 0.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
          {rosePositions.map((p, index) => <Rose key={index} position={p} scale={0.86 + (index % 3) * 0.05} />)}
        </group>
        <group position={[0, 0.9, 0.05]} scale={1.25}><RibbonBow /></group>
        {[ -0.14, 0.14 ].map((x) => (
          <mesh key={x} position={[x, 0.5, 0.405]} rotation={[0.06, 0, 0]} castShadow>
            <boxGeometry args={[0.1, 0.72, 0.02]} />
            <meshPhysicalMaterial color="#d79ea7" roughness={0.36} sheen={0.85} />
          </mesh>
        ))}
      </group>

      <group position={[0.32, 0.02, 0]} rotation={[0, open ? -0.22 : 0, 0]}>
        <RoundedBox args={[0.7, 0.08, 0.58]} radius={0.05} smoothness={6} position={[0, 0.04, 0]} castShadow>
          <meshStandardMaterial color="#7b291e" roughness={0.5} />
        </RoundedBox>
        <mesh position={[0, 0.14, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.27, 0.27, 0.055, 96]} />
          <meshPhysicalMaterial color="#d7b34f" metalness={0.96} roughness={0.12} clearcoat={0.55} clearcoatRoughness={0.08} />
        </mesh>
        <mesh position={[0, 0.171, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.225, 0.008, 12, 72]} />
          <meshStandardMaterial color="#f4da7b" metalness={0.95} roughness={0.11} />
        </mesh>
        <group position={[0, 0.177, 0.01]}>
          {[-0.11, 0, 0.11].map((x, i) => (
            <mesh key={x} position={[x, 0, 0]} scale={[1, 1 + i * 0.05, 1]}>
              <boxGeometry args={[0.07, 0.22, 0.012]} />
              <meshStandardMaterial color="#b1842e" metalness={0.8} roughness={0.18} />
            </mesh>
          ))}
        </group>
        <group position={[0, 0.23, 0.01]}>
          <mesh position={[-0.1, 0, 0]} rotation={[0, 0, -0.15]}><boxGeometry args={[0.055, 0.18, 0.014]} /><meshStandardMaterial color="#f2d675" metalness={0.87} roughness={0.12} /></mesh>
          <mesh position={[0, 0, 0]}><torusGeometry args={[0.055, 0.014, 10, 36]} /><meshStandardMaterial color="#f2d675" metalness={0.87} roughness={0.12} /></mesh>
          <mesh position={[0.1, 0, 0]} rotation={[0, 0, 0.15]}><boxGeometry args={[0.055, 0.18, 0.014]} /><meshStandardMaterial color="#f2d675" metalness={0.87} roughness={0.12} /></mesh>
        </group>
      </group>
    </group>
  );
}

function SnowFlurry({ radius = 0.34, height = 0.62 }: { radius?: number; height?: number }) {
  const ref = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const count = 140;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * radius;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = Math.random() * height;
      positions[i * 3 + 2] = Math.sin(angle) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [radius, height]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.24;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 0.025;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial color="#fff8df" size={0.018} transparent opacity={0.9} depthWrite={false} />
    </points>
  );
}

export function ChristmasMusicLanternReference({
  position = [0, 0, 0],
  rotationY = 0,
  onInspect,
}: {
  position?: [number, number, number];
  rotationY?: number;
  onInspect?: () => void;
}) {
  const [playing, setPlaying] = useState(true);
  const tree = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (playing && tree.current) tree.current.rotation.y += delta * 0.22;
  });

  return (
    <group
      position={position}
      rotation={[0, rotationY, 0]}
      onClick={(event) => {
        event.stopPropagation();
        setPlaying((v) => !v);
        onInspect?.();
      }}
      onPointerOver={(event) => { event.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      <RoundedBox args={[0.76, 0.28, 0.66]} radius={0.055} smoothness={6} position={[0, 0.14, 0]} castShadow>
        <meshPhysicalMaterial color="#2e2119" metalness={0.68} roughness={0.32} />
      </RoundedBox>
      <RoundedBox args={[0.68, 0.78, 0.58]} radius={0.035} smoothness={5} position={[0, 0.66, 0]} castShadow>
        <meshPhysicalMaterial color="#d9e1df" transmission={0.92} transparent opacity={0.2} roughness={0.08} thickness={0.11} ior={1.46} />
      </RoundedBox>
      {[[-0.37, 0.66, -0.31], [0.37, 0.66, -0.31], [-0.37, 0.66, 0.31], [0.37, 0.66, 0.31]].map((p, index) => (
        <mesh key={index} position={p as [number, number, number]} castShadow>
          <boxGeometry args={[0.045, 0.84, 0.045]} />
          <meshStandardMaterial color="#5b4030" metalness={0.72} roughness={0.28} />
        </mesh>
      ))}
      <mesh position={[0, 1.12, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.58, 0.28, 4]} />
        <meshPhysicalMaterial color="#2a1d16" metalness={0.72} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.16, 0.025, 12, 40]} />
        <meshStandardMaterial color="#2b1d17" metalness={0.76} roughness={0.28} />
      </mesh>
      <group ref={tree} position={[0, 0.36, 0]}>
        {[0.22, 0.39, 0.55].map((y, index) => (
          <mesh key={y} position={[0, y, 0]} castShadow>
            <coneGeometry args={[0.26 - index * 0.045, 0.34, 18]} />
            <meshStandardMaterial color="#284733" roughness={0.86} />
          </mesh>
        ))}
        <mesh position={[0, 0.13, 0]} castShadow><cylinderGeometry args={[0.045, 0.05, 0.18, 12]} /><meshStandardMaterial color="#6c452d" roughness={0.75} /></mesh>
        {[[-0.2, 0.12], [0.19, 0.11]].map(([x, z], i) => (
          <group key={i} position={[x, 0.14, z]}>
            <RoundedBox args={[0.22, 0.2, 0.18]} radius={0.018} smoothness={3} position={[0, 0.11, 0]} castShadow><meshStandardMaterial color={i ? '#d8c7a6' : '#b96545'} roughness={0.8} /></RoundedBox>
            <mesh position={[0, 0.27, 0]} rotation={[0, Math.PI / 4, Math.PI / 2]} castShadow><coneGeometry args={[0.17, 0.28, 4]} /><meshStandardMaterial color="#f2ece0" roughness={0.95} /></mesh>
            <mesh position={[0, 0.13, 0.095]}><planeGeometry args={[0.08, 0.08]} /><meshBasicMaterial color="#ffd37e" toneMapped={false} /></mesh>
          </group>
        ))}
      </group>
      <SnowFlurry />
      <pointLight position={[0, 0.62, 0.1]} intensity={playing ? 0.8 : 0.25} distance={2.2} color="#ffd497" />
    </group>
  );
}
