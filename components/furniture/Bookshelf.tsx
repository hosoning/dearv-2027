'use client';

const BOOK_COLORS = ['#a33d3d', '#3d6ea3', '#4f8f56', '#c19a3f', '#6a4f9e', '#3f7f8f'];

export default function Bookshelf({ position = [0, 0, 0], rotationY = 0 }: { position?: [number, number, number]; rotationY?: number }) {
  const shelfYs = [0.25, 0.75, 1.25, 1.75, 2.25];
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* frame sides */}
      {[-0.6, 0.6].map((x) => (
        <mesh key={x} position={[x, 1.15, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.05, 2.3, 0.35]} />
          <meshStandardMaterial color="#4a382b" roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, 2.3, 0]} castShadow>
        <boxGeometry args={[1.25, 0.05, 0.35]} />
        <meshStandardMaterial color="#4a382b" roughness={0.7} />
      </mesh>
      {shelfYs.map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow>
          <boxGeometry args={[1.2, 0.04, 0.34]} />
          <meshStandardMaterial color="#4a382b" roughness={0.7} />
        </mesh>
      ))}
      {shelfYs.slice(0, -1).map((y, shelfIdx) => (
        <group key={y} position={[0, y + 0.02, 0]}>
          {Array.from({ length: 10 }).map((_, i) => {
            const width = 0.06 + ((i * 7 + shelfIdx) % 3) * 0.015;
            const height = 0.32 + ((i * 3 + shelfIdx) % 4) * 0.04;
            const x = -0.55 + i * (1.1 / 10) + width / 2;
            return (
              <mesh key={i} position={[x, height / 2, 0]} castShadow>
                <boxGeometry args={[width, height, 0.24]} />
                <meshStandardMaterial color={BOOK_COLORS[(i + shelfIdx) % BOOK_COLORS.length]} roughness={0.9} />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}
