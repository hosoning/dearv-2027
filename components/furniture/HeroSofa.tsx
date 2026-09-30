'use client';

import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const MODEL_URL = 'models/GlamVelvetSofa.glb';

export default function HeroSofa({
  position = [0, 0, 0],
  rotationY = 0,
  targetWidth = 6.4,
}: {
  position?: [number, number, number];
  rotationY?: number;
  targetWidth?: number;
}) {
  const gltf = useGLTF(MODEL_URL);
  const prepared = useMemo(() => {
    const object = gltf.scene.clone(true);
    object.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.castShadow = true;
      child.receiveShadow = true;
      child.frustumCulled = true;
      const source = child.material;
      const materials = Array.isArray(source) ? source : [source];
      materials.forEach((material) => {
        if (material instanceof THREE.MeshStandardMaterial) {
          material.envMapIntensity = 0.55;
          material.roughness = Math.max(material.roughness, 0.48);
        }
      });
    });

    const bounds = new THREE.Box3().setFromObject(object);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const uniformScale = targetWidth / Math.max(size.x, 0.001);

    // Put the imported model on the floor and centre it around the authored room anchor.
    object.position.set(-center.x, -bounds.min.y, -center.z);
    return { object, uniformScale };
  }, [gltf.scene, targetWidth]);

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={prepared.uniformScale}>
      <primitive object={prepared.object} />
    </group>
  );
}

useGLTF.preload(MODEL_URL);
