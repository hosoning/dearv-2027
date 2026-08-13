'use client';

import type { ThreeEvent } from '@react-three/fiber';

function clickThrough(handler?: () => void) {
  return (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    handler?.();
  };
}

function TieSet() {
  return <group position={[-0.55,1.08,0.23]} scale={0.92}><mesh castShadow><boxGeometry args={[0.78,0.08,0.42]} /><meshStandardMaterial color="#ede3d4" roughness={0.72} /></mesh><mesh position={[0,0.08,-0.2]} rotation={[-0.5,0,0]} castShadow><boxGeometry args={[0.78,0.07,0.42]} /><meshStandardMaterial color="#c9b89f" roughness={0.68} /></mesh><mesh position={[-0.18,0.085,0.03]} rotation={[0,0,-0.22]} castShadow><boxGeometry args={[0.11,0.035,0.27]} /><meshStandardMaterial color="#352f31" roughness={0.38} /></mesh><mesh position={[0.18,0.09,0.02]} rotation={[0,0,0.14]} castShadow><boxGeometry args={[0.13,0.04,0.19]} /><meshStandardMaterial color="#5a4b45" roughness={0.45} /></mesh><mesh position={[0.31,0.1,-0.02]} castShadow><torusGeometry args={[0.07,0.022,10,20]} /><meshStandardMaterial color="#b79a65" metalness={0.82} roughness={0.22} /></mesh><mesh position={[0.42,0.1,0.08]} castShadow><boxGeometry args={[0.12,0.025,0.035]} /><meshStandardMaterial color="#c7aa73" metalness={0.9} roughness={0.18} /></mesh></group>;
}

function GoldCoin() {
  return <group position={[0.47,1.08,0.25]}><mesh castShadow rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[0.19,0.19,0.045,48]} /><meshStandardMaterial color="#caa24d" metalness={0.88} roughness={0.18} /></mesh><mesh position={[0,0,0.026]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[0.145,0.012,8,40]} /><meshStandardMaterial color="#f1d38b" metalness={0.9} roughness={0.15} /></mesh><mesh position={[0,-0.035,-0.055]}><boxGeometry args={[0.48,0.07,0.32]} /><meshStandardMaterial color="#1f1b19" roughness={0.48} /></mesh></group>;
}

function StarCertificate() {
  return <group position={[-0.46,1.72,0.18]} rotation={[0,0.08,0]}><mesh castShadow><boxGeometry args={[0.68,0.48,0.035]} /><meshStandardMaterial color="#6e553b" roughness={0.48} /></mesh><mesh position={[0,0,0.021]}><planeGeometry args={[0.59,0.39]} /><meshStandardMaterial color="#f0e7d6" roughness={0.88} /></mesh><mesh position={[0.18,0.09,0.03]}><circleGeometry args={[0.055,24]} /><meshStandardMaterial color="#c9a65a" metalness={0.4} roughness={0.3} /></mesh>{[-0.18,-0.08,0.02].map((y,i)=><mesh key={y} position={[-0.04,y,0.032]}><boxGeometry args={[0.36-i*0.04,0.012,0.005]} /><meshStandardMaterial color="#7a7063" roughness={1} /></mesh>)}</group>;
}

function MusicHouse() {
  return <group position={[0.48,1.73,0.2]} scale={0.92}><mesh position={[0,0.06,0]} castShadow><boxGeometry args={[0.48,0.35,0.38]} /><meshStandardMaterial color="#ead8bd" roughness={0.78} /></mesh><mesh position={[0,0.32,0]} rotation={[0,0,Math.PI/4]} castShadow><boxGeometry args={[0.35,0.35,0.4]} /><meshStandardMaterial color="#6e4334" roughness={0.62} /></mesh><mesh position={[-0.11,0.05,0.2]}><boxGeometry args={[0.11,0.18,0.025]} /><meshStandardMaterial color="#6e4d3b" roughness={0.65} /></mesh><mesh position={[0.11,0.1,0.2]}><boxGeometry args={[0.1,0.1,0.025]} /><meshStandardMaterial color="#f0c978" emissive="#e3a84f" emissiveIntensity={0.35} /></mesh><mesh position={[0,-0.15,0]}><cylinderGeometry args={[0.31,0.34,0.08,40]} /><meshStandardMaterial color="#30302e" roughness={0.48} metalness={0.18} /></mesh></group>;
}

function SilkPajamas() {
  const stripeXs=[-0.21,-0.1,0,0.1,0.21];
  return <group position={[0,1.34,0.03]}><mesh position={[0,0.35,0]} castShadow><boxGeometry args={[0.62,0.78,0.07]} /><meshStandardMaterial color="#27313b" roughness={0.28} metalness={0.04} /></mesh><mesh position={[-0.42,0.34,0]} rotation={[0,0,-0.18]} castShadow><boxGeometry args={[0.22,0.82,0.065]} /><meshStandardMaterial color="#27313b" roughness={0.28} /></mesh><mesh position={[0.42,0.34,0]} rotation={[0,0,0.18]} castShadow><boxGeometry args={[0.22,0.82,0.065]} /><meshStandardMaterial color="#27313b" roughness={0.28} /></mesh>{stripeXs.map((x)=><mesh key={x} position={[x,0.35,0.04]}><boxGeometry args={[0.012,0.75,0.008]} /><meshStandardMaterial color="#9ea5a8" roughness={0.35} /></mesh>)}<mesh position={[-0.19,-0.43,0]} castShadow><boxGeometry args={[0.25,0.88,0.07]} /><meshStandardMaterial color="#27313b" roughness={0.3} /></mesh><mesh position={[0.19,-0.43,0]} castShadow><boxGeometry args={[0.25,0.88,0.07]} /><meshStandardMaterial color="#27313b" roughness={0.3} /></mesh><mesh position={[-0.51,-0.02,0.045]}><boxGeometry args={[0.1,0.03,0.01]} /><meshStandardMaterial color="#c6a770" metalness={0.25} roughness={0.35} /></mesh><mesh position={[0,0.88,-0.04]}><torusGeometry args={[0.23,0.025,10,24,Math.PI]} /><meshStandardMaterial color="#aa8c65" metalness={0.38} roughness={0.3} /></mesh></group>;
}

export function KeepsakeCabinet({ onClick }: { onClick?: () => void }) {
  return <group position={[3.55,0,-4.28]} onClick={clickThrough(onClick)}><mesh position={[0,1.34,0]} castShadow receiveShadow><boxGeometry args={[2.55,2.68,0.58]} /><meshStandardMaterial color="#4d3528" roughness={0.48} /></mesh><mesh position={[0,1.34,0.31]}><boxGeometry args={[2.25,2.38,0.035]} /><meshPhysicalMaterial color="#e9f0ed" transmission={0.88} transparent opacity={0.22} roughness={0.08} metalness={0.02} thickness={0.08} /></mesh>{[-1.13,1.13].map((x)=><mesh key={x} position={[x,1.34,0.33]}><boxGeometry args={[0.055,2.45,0.055]} /><meshStandardMaterial color="#b99b6a" metalness={0.62} roughness={0.24} /></mesh>)}{[0.64,1.34,2.03].map((y)=><mesh key={y} position={[0,y,0.18]}><boxGeometry args={[2.18,0.045,0.42]} /><meshStandardMaterial color="#7e6246" roughness={0.5} /></mesh>)}<pointLight position={[0,2.34,0.28]} intensity={0.62} distance={2.6} color="#ffd9a1" /><pointLight position={[0,1.64,0.28]} intensity={0.42} distance={2.2} color="#ffd9a1" /><TieSet /><GoldCoin /><StarCertificate /><MusicHouse /></group>;
}

export function PajamaWardrobe({ onClick }: { onClick?: () => void }) {
  return <group position={[-3.38,0,4.38]} rotation={[0,Math.PI,0]} onClick={clickThrough(onClick)}><mesh position={[0,1.45,0]} castShadow receiveShadow><boxGeometry args={[2.35,2.9,0.68]} /><meshStandardMaterial color="#4a3429" roughness={0.5} /></mesh><mesh position={[0,1.48,0.37]}><boxGeometry args={[2.05,2.58,0.04]} /><meshStandardMaterial color="#b99c76" roughness={0.78} /></mesh><mesh position={[0,2.49,0.44]}><cylinderGeometry args={[0.025,0.025,1.55,14]} /><meshStandardMaterial color="#c7aa76" metalness={0.72} roughness={0.2} /></mesh><SilkPajamas /><pointLight position={[0,2.5,0.48]} intensity={0.48} distance={2.5} color="#ffdbac" /></group>;
}

export function DeskKeepsakes() {
  return <group position={[3.42,0.78,2.78]} rotation={[0,-Math.PI/2,0]}><mesh position={[0,0.025,0]} rotation={[0.03,0.1,-0.04]} castShadow><boxGeometry args={[0.58,0.055,0.42]} /><meshStandardMaterial color="#745f4b" roughness={0.78} /></mesh><mesh position={[0.02,0.065,-0.02]} rotation={[0.03,0.1,-0.04]}><boxGeometry args={[0.52,0.018,0.36]} /><meshStandardMaterial color="#e8dcc7" roughness={0.92} /></mesh><mesh position={[0.28,0.08,0.04]} rotation={[0,0,-0.32]}><cylinderGeometry args={[0.012,0.012,0.48,10]} /><meshStandardMaterial color="#b79868" metalness={0.45} roughness={0.3} /></mesh></group>;
}
