'use client';

import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const MODEL_URL = 'models/GlamVelvetSofa.glb';

export default function RealSofa({
  position = [0, 0, 0],
  rotationY = 0,
  scale = 1,
}: {
  position?: [number, number, number];
  rotationY?: number;
  scale?: number;
}) {
  const { scene } = useGLTF(MODEL_URL);
  const clone = useMemo(() => {
    const next = scene.clone(true);
    next.traverse((child) => {
      if (child instanceof THREE.Light) child.visible = false;
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        child.material = materials.map((source) => {
          const material = source.clone();
          if (child.name.toLowerCase().includes('fabric') || material.name.toLowerCase().includes('fabric') || Boolean((material as THREE.MeshStandardMaterial).normalMap)) {
            const physical = material as THREE.MeshPhysicalMaterial;
            physical.color.set('#c4bab0');
            physical.roughness = 0.88;
            physical.metalness = 0;
            physical.sheen = 0.34;
            physical.sheenColor?.set('#d8cec4');
            physical.sheenRoughness = 0.78;
            physical.specularColor?.set('#6f645b');
            physical.needsUpdate = true;
          }
          return material;
        });
        if (materials.length === 1) child.material = child.material[0];
      }
    });
    return next;
  }, [scene]);

  return <primitive object={clone} position={position} rotation={[0, rotationY, 0]} scale={scale} />;
}

useGLTF.preload(MODEL_URL);
