'use client';

import { useMemo } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { createFabricTexture, createWalnutTexture } from '@/lib/textures';

function clickThrough(handler?: () => void) {
  return (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    handler?.();
  };
}

function velvetMaterialColor() {
  return '#242126';
}

export function TieSet() {
  const tieShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.055, 0.23);
    shape.lineTo(0.055, 0.23);
    shape.lineTo(0.07, -0.12);
    shape.lineTo(0.13, -0.28);
    shape.lineTo(0, -0.43);
    shape.lineTo(-0.13, -0.28);
    shape.lineTo(-0.07, -0.12);
    shape.closePath();
    return shape;
  }, []);
  const bowShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.03, 0.04);
    shape.bezierCurveTo(-0.13, 0.13, -0.25, 0.12, -0.29, 0.04);
    shape.lineTo(-0.29, -0.04);
    shape.bezierCurveTo(-0.24, -0.12, -0.13, -0.12, -0.03, -0.04);
    shape.lineTo(0.03, -0.04);
    shape.bezierCurveTo(0.13, -0.12, 0.24, -0.12, 0.29, -0.04);
    shape.lineTo(0.29, 0.04);
    shape.bezierCurveTo(0.25, 0.12, 0.13, 0.13, 0.03, 0.04);
    shape.closePath();
    return shape;
  }, []);

  return (
    <group position={[-0.55, 0.74, 0.23]} scale={0.92}>
      <RoundedBox args={[0.9, 0.09, 0.54]} radius={0.035} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color="#c8b89f" roughness={0.7} />
      </RoundedBox>
      <RoundedBox args={[0.82, 0.045, 0.46]} radius={0.026} smoothness={4} position={[0, 0.065, 0]}>
        <meshStandardMaterial color={velvetMaterialColor()} roughness={0.98} />
      </RoundedBox>
      <group position={[0, 0.1, -0.31]} rotation={[-0.74, 0, 0]}>
        <RoundedBox args={[0.9, 0.06, 0.5]} radius={0.035} smoothness={4} castShadow>
          <meshStandardMaterial color="#ad9879" roughness={0.76} />
        </RoundedBox>
        <RoundedBox args={[0.82, 0.02, 0.42]} radius={0.02} smoothness={3} position={[0, 0.04, 0]}>
          <meshStandardMaterial color="#d8c8ae" roughness={0.82} />
        </RoundedBox>
      </group>

      <mesh position={[-0.19, 0.12, 0.02]} rotation={[-Math.PI / 2, 0, -0.06]} castShadow>
        <extrudeGeometry args={[tieShape, { depth: 0.026, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2 }]} />
        <meshPhysicalMaterial color="#34313a" roughness={0.42} sheen={0.65} sheenRoughness={0.42} />
      </mesh>
      <mesh position={[0.2, 0.13, 0.07]} rotation={[-Math.PI / 2, 0, 0.12]} castShadow>
        <extrudeGeometry args={[bowShape, { depth: 0.03, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2 }]} />
        <meshPhysicalMaterial color="#5c4b47" roughness={0.4} sheen={0.5} />
      </mesh>
      <RoundedBox args={[0.05, 0.04, 0.12]} radius={0.012} smoothness={3} position={[0.2, 0.145, 0.07]}>
        <meshStandardMaterial color="#7d655c" roughness={0.46} />
      </RoundedBox>
      <RoundedBox args={[0.2, 0.025, 0.045]} radius={0.01} smoothness={3} position={[0.35, 0.13, -0.13]} rotation={[0, -0.12, 0]} castShadow>
        <meshStandardMaterial color="#d4b56f" metalness={0.9} roughness={0.16} />
      </RoundedBox>
      <mesh position={[0.37, 0.14, 0.14]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.07, 0.018, 12, 32]} />
        <meshStandardMaterial color="#caa45e" metalness={0.88} roughness={0.18} />
      </mesh>
    </group>
  );
}

export function GoldCoin() {
  return (
    <group position={[0.47, 0.78, 0.25]}>
      <RoundedBox args={[0.5, 0.08, 0.34]} radius={0.025} smoothness={4} position={[0, -0.12, -0.04]} castShadow>
        <meshStandardMaterial color="#211d1a" roughness={0.48} />
      </RoundedBox>
      <mesh position={[0, 0.02, 0]} castShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.21, 0.21, 0.052, 64]} />
        <meshPhysicalMaterial color="#d1a94d" metalness={0.93} roughness={0.16} clearcoat={0.32} clearcoatRoughness={0.12} />
      </mesh>
      <mesh position={[0, 0.02, 0.029]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.158, 0.009, 12, 54]} />
        <meshStandardMaterial color="#f0d27d" metalness={0.94} roughness={0.13} />
      </mesh>
      {[0.05, 0.1, 0.15].map((radius) => (
        <mesh key={radius} position={[0, 0.02, 0.031]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius, 0.0025, 6, 48]} />
          <meshStandardMaterial color="#ad7e28" metalness={0.75} roughness={0.28} />
        </mesh>
      ))}
      <mesh position={[-0.035, 0.02, 0.035]} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[0.018, 0.12, 0.012]} />
        <meshStandardMaterial color="#f2d887" metalness={0.85} roughness={0.16} />
      </mesh>
      <mesh position={[0.04, 0.02, 0.035]} rotation={[0, 0, -0.22]}>
        <boxGeometry args={[0.018, 0.12, 0.012]} />
        <meshStandardMaterial color="#f2d887" metalness={0.85} roughness={0.16} />
      </mesh>
    </group>
  );
}

export function StarCertificate() {
  return (
    <group position={[-0.46, 1.72, 0.18]} rotation={[0, 0.08, 0]}>
      <RoundedBox args={[0.74, 0.54, 0.045]} radius={0.018} smoothness={3} castShadow>
        <meshStandardMaterial color="#604a34" roughness={0.48} />
      </RoundedBox>
      <mesh position={[0, 0, 0.028]}>
        <planeGeometry args={[0.64, 0.44]} />
        <meshStandardMaterial color="#f0e7d6" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.13, 0.034]}>
        <boxGeometry args={[0.31, 0.012, 0.006]} />
        <meshStandardMaterial color="#a99d8c" roughness={1} />
      </mesh>
      {[-0.02, -0.1, -0.18].map((y, i) => (
        <mesh key={y} position={[-0.06, y, 0.034]}>
          <boxGeometry args={[0.38 - i * 0.05, 0.009, 0.006]} />
          <meshStandardMaterial color="#8c8173" roughness={1} />
        </mesh>
      ))}
      {Array.from({ length: 5 }).map((_, index) => {
        const angle = (index / 5) * Math.PI * 2;
        return (
          <mesh key={index} position={[0.21 + Math.cos(angle) * 0.065, 0.08 + Math.sin(angle) * 0.065, 0.038]} rotation={[0, 0, angle]}>
            <coneGeometry args={[0.018, 0.055, 3]} />
            <meshStandardMaterial color="#c7a250" metalness={0.5} roughness={0.3} />
          </mesh>
        );
      })}
      <mesh position={[0.22, -0.15, 0.038]}>
        <circleGeometry args={[0.052, 28]} />
        <meshStandardMaterial color="#c9a65a" metalness={0.45} roughness={0.28} />
      </mesh>
    </group>
  );
}

export function MusicHouse() {
  return (
    <group position={[0.48, 1.73, 0.2]} scale={0.92}>
      <mesh position={[0, -0.18, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.39, 0.08, 44]} />
        <meshStandardMaterial color="#2e2c29" roughness={0.46} metalness={0.16} />
      </mesh>
      <RoundedBox args={[0.5, 0.35, 0.4]} radius={0.025} smoothness={4} position={[0, 0.05, 0]} castShadow>
        <meshStandardMaterial color="#ead8bd" roughness={0.82} />
      </RoundedBox>
      <mesh position={[0, 0.32, 0]} rotation={[0, Math.PI / 4, Math.PI / 2]} castShadow>
        <coneGeometry args={[0.39, 0.54, 4]} />
        <meshStandardMaterial color="#6c4233" roughness={0.64} />
      </mesh>
      <mesh position={[0.15, 0.48, -0.05]} castShadow>
        <boxGeometry args={[0.075, 0.22, 0.09]} />
        <meshStandardMaterial color="#5c3b31" roughness={0.68} />
      </mesh>
      <RoundedBox args={[0.12, 0.18, 0.025]} radius={0.018} smoothness={3} position={[-0.12, 0.02, 0.215]}>
        <meshStandardMaterial color="#674b39" roughness={0.65} />
      </RoundedBox>
      {[-0.12, 0.12].map((x) => (
        <group key={x} position={[x, 0.11, 0.216]}>
          <RoundedBox args={[0.1, 0.12, 0.022]} radius={0.012} smoothness={3}>
            <meshBasicMaterial color="#ffd37b" toneMapped={false} />
          </RoundedBox>
          <mesh position={[0, 0, 0.013]}><boxGeometry args={[0.012, 0.1, 0.004]} /><meshStandardMaterial color="#74533d" /></mesh>
          <mesh position={[0, 0, 0.013]}><boxGeometry args={[0.085, 0.012, 0.004]} /><meshStandardMaterial color="#74533d" /></mesh>
        </group>
      ))}
      {[-0.22, -0.08, 0.08, 0.22].map((x, index) => (
        <mesh key={x} position={[x, 0.49 - Math.abs(x) * 0.45, 0.02]} scale={[1, 0.6 + index * 0.06, 1]}>
          <sphereGeometry args={[0.055, 16, 12]} />
          <meshStandardMaterial color="#f4f0e8" roughness={0.98} />
        </mesh>
      ))}
      <pointLight position={[0, 0.16, 0.34]} intensity={0.48} distance={1.5} color="#ffd58f" />
    </group>
  );
}

export function SilkPajamas() {
  const silk = useMemo(() => createFabricTexture(256, '#27313b'), []);
  const shirtShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.24, 0.42);
    s.lineTo(-0.48, 0.26);
    s.lineTo(-0.4, 0.02);
    s.lineTo(-0.27, 0.1);
    s.lineTo(-0.23, -0.38);
    s.lineTo(0.23, -0.38);
    s.lineTo(0.27, 0.1);
    s.lineTo(0.4, 0.02);
    s.lineTo(0.48, 0.26);
    s.lineTo(0.24, 0.42);
    s.lineTo(0.09, 0.34);
    s.lineTo(0, 0.27);
    s.lineTo(-0.09, 0.34);
    s.closePath();
    return s;
  }, []);

  return (
    <group position={[0, 1.38, 0.03]}>
      <mesh position={[0, 0.26, 0]} castShadow>
        <extrudeGeometry args={[shirtShape, { depth: 0.035, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.008, bevelSegments: 2 }]} />
        <meshPhysicalMaterial map={silk} color="#61707e" roughness={0.3} sheen={0.9} sheenRoughness={0.3} />
      </mesh>
      {[-0.16, 0, 0.16].map((x) => (
        <mesh key={x} position={[x, 0.29, 0.045]}>
          <boxGeometry args={[0.012, 0.66, 0.008]} />
          <meshStandardMaterial color="#8f9aa1" roughness={0.38} />
        </mesh>
      ))}
      <mesh position={[0, 0.29, 0.052]}>
        <boxGeometry args={[0.018, 0.62, 0.009]} />
        <meshStandardMaterial color="#c2c7c8" roughness={0.32} />
      </mesh>
      {[0.1, -0.03, -0.16].map((y) => (
        <mesh key={y} position={[0.025, y + 0.29, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.017, 0.017, 0.009, 16]} />
          <meshStandardMaterial color="#d4cbbf" metalness={0.2} roughness={0.3} />
        </mesh>
      ))}
      {[-0.17, 0.17].map((x) => (
        <RoundedBox key={x} args={[0.27, 0.84, 0.065]} radius={0.045} smoothness={5} position={[x, -0.55, 0.015]} castShadow>
          <meshPhysicalMaterial map={silk} color="#61707e" roughness={0.3} sheen={0.85} sheenRoughness={0.3} />
        </RoundedBox>
      ))}
      <mesh position={[-0.43, 0.02, 0.055]}>
        <boxGeometry args={[0.11, 0.025, 0.012]} />
        <meshStandardMaterial color="#c6a770" metalness={0.3} roughness={0.34} />
      </mesh>
      <mesh position={[0, 0.79, -0.04]}>
        <torusGeometry args={[0.23, 0.025, 12, 28, Math.PI]} />
        <meshStandardMaterial color="#a98b64" metalness={0.42} roughness={0.28} />
      </mesh>
    </group>
  );
}

export function KeepsakeCabinet({
  onClick,
  position = [13.95, 0, -2.1],
  rotationY = -Math.PI / 2,
}: {
  onClick?: () => void;
  position?: [number, number, number];
  rotationY?: number;
}) {
  const walnut = useMemo(() => createWalnutTexture(), []);
  return (
    <group position={position} rotation={[0, rotationY, 0]} onClick={clickThrough(onClick)}>
      <RoundedBox args={[3.15, 2.84, 0.65]} radius={0.04} smoothness={4} position={[0, 1.42, 0]} castShadow receiveShadow>
        <meshStandardMaterial map={walnut} color="#76533c" roughness={0.48} />
      </RoundedBox>
      <mesh position={[0, 1.42, 0.34]} raycast={() => null}>
        <boxGeometry args={[2.82, 2.54, 0.025]} />
        <meshPhysicalMaterial color="#eff7f3" transmission={0.94} transparent opacity={0.08} roughness={0.04} metalness={0.02} thickness={0.04} />
      </mesh>
      {[-1.42, 0, 1.42].map((x) => (
        <mesh key={x} position={[x, 1.42, 0.37]}>
          <boxGeometry args={[0.045, 2.6, 0.055]} />
          <meshStandardMaterial color="#c2a36e" metalness={0.72} roughness={0.2} />
        </mesh>
      ))}
      {[0.64, 1.38, 2.14].map((y) => (
        <mesh key={y} position={[0, y, 0.2]}>
          <boxGeometry args={[2.74, 0.045, 0.46]} />
          <meshStandardMaterial color="#7e6246" roughness={0.5} />
        </mesh>
      ))}
      {/* Every keepsake has a visible, weight-bearing museum plinth. */}
      <RoundedBox args={[1.08, 0.08, 0.42]} radius={0.025} smoothness={4} position={[-0.55, 0.69, 0.22]} castShadow>
        <meshStandardMaterial color="#2a2420" roughness={0.52} />
      </RoundedBox>
      <RoundedBox args={[0.72, 0.11, 0.42]} radius={0.03} smoothness={4} position={[0.47, 0.7, 0.22]} castShadow>
        <meshStandardMaterial color="#2a2420" roughness={0.48} />
      </RoundedBox>
      <mesh position={[-0.46, 1.55, 0.12]} rotation={[-0.18, 0, 0]} castShadow>
        <boxGeometry args={[0.62, 0.42, 0.12]} />
        <meshStandardMaterial color="#332a24" roughness={0.56} />
      </mesh>
      <RoundedBox args={[0.78, 0.08, 0.5]} radius={0.03} smoothness={4} position={[0.48, 1.43, 0.2]} castShadow>
        <meshStandardMaterial color="#332a24" roughness={0.56} />
      </RoundedBox>
      {[0.95, 1.7, 2.43].map((y) => (
        <mesh key={`light-${y}`} position={[0, y, 0.31]}>
          <boxGeometry args={[2.45, 0.018, 0.025]} />
          <meshBasicMaterial color="#ffd89b" toneMapped={false} />
        </mesh>
      ))}
      <pointLight position={[0, 2.42, 0.42]} intensity={0.72} distance={3.2} color="#ffd9a1" />
      <pointLight position={[0, 1.2, 0.42]} intensity={0.5} distance={2.7} color="#ffd9a1" />
      <TieSet />
      <GoldCoin />
      <StarCertificate />
      <MusicHouse />
    </group>
  );
}

export function PajamaWardrobe({
  onClick,
  position = [-13.9, 0, 1.3],
  rotationY = Math.PI / 2,
}: {
  onClick?: () => void;
  position?: [number, number, number];
  rotationY?: number;
}) {
  const walnut = useMemo(() => createWalnutTexture(), []);
  return (
    <group position={position} rotation={[0, rotationY, 0]} onClick={clickThrough(onClick)}>
      <RoundedBox args={[2.8, 3.1, 0.72]} radius={0.04} smoothness={4} position={[0, 1.55, 0]} castShadow receiveShadow>
        <meshStandardMaterial map={walnut} color="#76533c" roughness={0.5} />
      </RoundedBox>
      <RoundedBox args={[2.45, 2.75, 0.04]} radius={0.025} smoothness={3} position={[0, 1.58, -0.28]}>
        <meshStandardMaterial color="#b99c76" roughness={0.78} />
      </RoundedBox>
      <mesh position={[0, 2.66, 0.18]}>
        <cylinderGeometry args={[0.025, 0.025, 1.9, 14]} />
        <meshStandardMaterial color="#c7aa76" metalness={0.72} roughness={0.2} />
      </mesh>
      <pointLight position={[0, 2.62, 0.32]} intensity={0.35} distance={2.6} color="#ffdbac" />
      <SilkPajamas />
    </group>
  );
}

export function DeskKeepsakes({
  position = [9.85, 0.79, 7.18],
  rotationY = 0,
}: {
  position?: [number, number, number];
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox args={[0.58, 0.055, 0.42]} radius={0.018} smoothness={3} position={[0, 0.025, 0]} rotation={[0.03, 0.1, -0.04]} castShadow>
        <meshStandardMaterial color="#745f4b" roughness={0.78} />
      </RoundedBox>
      <RoundedBox args={[0.52, 0.018, 0.36]} radius={0.009} smoothness={3} position={[0.02, 0.065, -0.02]} rotation={[0.03, 0.1, -0.04]}>
        <meshStandardMaterial color="#e8dcc7" roughness={0.92} />
      </RoundedBox>
      <mesh position={[0.28, 0.08, 0.04]} rotation={[0, 0, -0.32]}>
        <cylinderGeometry args={[0.012, 0.012, 0.48, 10]} />
        <meshStandardMaterial color="#b79868" metalness={0.45} roughness={0.3} />
      </mesh>
    </group>
  );
}
