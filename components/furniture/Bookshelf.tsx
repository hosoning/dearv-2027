'use client';

const BOOK_COLORS = ['#6f5948','#86705d','#a88a67','#4f6258','#7a5c55','#b4a086'];

export default function Bookshelf({ position = [0, 0, 0], rotationY = 0 }: { position?: [number, number, number]; rotationY?: number }) {
  const shelfYs = [0.48,0.96,1.44,1.92,2.4];
  return (
    <group position={position} rotation={[0,rotationY,0]}>
      <mesh position={[0,1.35,-0.12]} castShadow receiveShadow><boxGeometry args={[1.5,2.7,0.42]} /><meshStandardMaterial color="#493429" roughness={0.52} /></mesh>
      <mesh position={[0,1.42,0.12]}><boxGeometry args={[1.26,2.28,0.035]} /><meshStandardMaterial color="#7a5d45" roughness={0.64} /></mesh>
      {[-0.63,0.63].map((x)=><mesh key={x} position={[x,1.42,0.16]} castShadow><boxGeometry args={[0.055,2.35,0.08]} /><meshStandardMaterial color="#b39465" metalness={0.28} roughness={0.36} /></mesh>)}
      {shelfYs.map((y)=><group key={y}><mesh position={[0,y,0.13]} castShadow><boxGeometry args={[1.23,0.045,0.35]} /><meshStandardMaterial color="#8a694e" roughness={0.55} /></mesh><pointLight position={[0,y+0.18,0.24]} intensity={0.12} distance={1.25} color="#ffd6a0" /></group>)}
      {shelfYs.slice(0,-1).map((y,shelfIdx)=><group key={`books-${y}`} position={[0,y+0.025,0.17]}>{Array.from({length:8}).map((_,i)=>{const width=0.07+((i*5+shelfIdx)%3)*0.014;const height=0.27+((i*3+shelfIdx)%4)*0.035;const x=-0.54+i*0.14;return <mesh key={i} position={[x,height/2,0]} rotation={[0,0,(i%5===0?0.05:0)]} castShadow><boxGeometry args={[width,height,0.23]} /><meshStandardMaterial color={BOOK_COLORS[(i+shelfIdx)%BOOK_COLORS.length]} roughness={0.9} /></mesh>;})}</group>)}
      <mesh position={[-0.31,0.23,0.17]} castShadow><boxGeometry args={[0.55,0.32,0.31]} /><meshStandardMaterial color="#73543e" roughness={0.58} /></mesh>
      <mesh position={[0.31,0.23,0.17]} castShadow><boxGeometry args={[0.55,0.32,0.31]} /><meshStandardMaterial color="#73543e" roughness={0.58} /></mesh>
      {[-0.31,0.31].map((x)=><mesh key={x} position={[x,0.25,0.34]}><boxGeometry args={[0.13,0.02,0.025]} /><meshStandardMaterial color="#c3a46f" metalness={0.72} roughness={0.22} /></mesh>)}
    </group>
  );
}
