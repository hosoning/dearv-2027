'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { controlsState } from '@/lib/controlsState';
import { ROOM_WIDTH, ROOM_DEPTH } from './Room';

const EYE_HEIGHT = 1.62;
const MOVE_SPEED = 3.8;
const LOOK_SPEED = 2.05;
const MARGIN = 0.48;
const BOUND_X = ROOM_WIDTH / 2 - MARGIN;
const BOUND_Z = ROOM_DEPTH / 2 - MARGIN;
const PLAYER_RADIUS = 0.18;

const SOURCE_BLOCKERS = [
  // Private-wing boundary with separate master and living-to-ensuite doors.
  { minX: -5.32, maxX: -5.02, minZ: -11.8, maxZ: -9.9 },
  { minX: -5.32, maxX: -5.02, minZ: -8.5, maxZ: -5.25 },
  { minX: -5.32, maxX: -5.02, minZ: -3.8, maxZ: 11.8 },
  // Ensuite top wall, split around the closet-side private door.
  { minX: -14.85, maxX: -13.78, minZ: -6.14, maxZ: -5.86 },
  { minX: -12.32, maxX: -5.18, minZ: -6.14, maxZ: -5.86 },
  // Solid study walls and wide timber doorway.
  { minX: 8.98, maxX: 9.24, minZ: -11.8, maxZ: 1.65 },
  { minX: 8.98, maxX: 9.24, minZ: 3.15, maxZ: 3.65 },
  { minX: 9.0, maxX: 14.8, minZ: 3.46, maxZ: 3.74 },
  // Kitchen and island.
  { minX: -5.25, maxX: 5.25, minZ: 10.3, maxZ: 11.75 },
  { minX: -5.3, maxX: -3.85, minZ: 6.0, maxZ: 11.65 },
  { minX: -2.95, maxX: 2.95, minZ: 6.3, maxZ: 8.2 },
  // Open master-suite furniture.
  { minX: -13.45, maxX: -10.45, minZ: 6.6, maxZ: 11.75 },
  { minX: -14.82, maxX: -13.75, minZ: -5.55, maxZ: 3.25 },
  { minX: -14.25, maxX: -5.35, minZ: -6.02, maxZ: -5.2 },
  { minX: -11.7, maxX: -10.1, minZ: -4.5, maxZ: -0.8 },
  // Bathroom fixtures.
  { minX: -14.15, maxX: -12.0, minZ: -10.65, maxZ: -7.05 },
  { minX: -11.9, maxX: -8.25, minZ: -11.8, maxZ: -10.75 },
  { minX: -8.15, maxX: -6.95, minZ: -11.75, maxZ: -10.25 },
  { minX: -7.2, maxX: -5.3, minZ: -11.45, maxZ: -9.25 },
  // Continuous L-shaped living sofa and coffee table; the glass-side promenade stays open.
  { minX: -2.72, maxX: 3.45, minZ: -3.12, maxZ: -1.6 },
  { minX: 1.55, maxX: 3.45, minZ: -5.08, maxZ: -2.3 },
  { minX: 0.35, maxX: 2.0, minZ: -5.55, maxZ: -4.0 },
  // Study desk, lounge chair and wall library.
  { minX: 10.7, maxX: 12.9, minZ: -6.85, maxZ: -1.85 },
  { minX: 11.75, maxX: 13.75, minZ: -0.75, maxZ: 1.25 },
  { minX: 12.75, maxX: 13.9, minZ: -5.05, maxZ: -3.55 },
  { minX: 14.0, maxX: 14.8, minZ: -11.1, maxZ: 2.8 },
];

// Source coordinates follow the authored floor plan. The whole apartment is mirrored
// for the occupant's view: facing the windows, the master wing is on the right.
const BLOCKERS = SOURCE_BLOCKERS.map((box) => ({
  ...box,
  minX: -box.maxX,
  maxX: -box.minX,
}));

function blocked(x: number, z: number) {
  return BLOCKERS.some(
    (box) =>
      x > box.minX - PLAYER_RADIUS &&
      x < box.maxX + PLAYER_RADIUS &&
      z > box.minZ - PLAYER_RADIUS &&
      z < box.maxZ + PLAYER_RADIUS
  );
}

export default function PlayerControls() {
  const { camera, gl } = useThree();
  const yaw = useRef(0);
  const pitch = useRef(0);
  const dragging = useRef(false);
  const velocity = useRef(new THREE.Vector2());
  const lastPointer = useRef({ x: 0, y: 0 });
  const pointerStart = useRef({ x: 0, y: 0, time: 0 });
  const markerRef = useRef<THREE.Group>(null);
  const raycaster = useRef(new THREE.Raycaster());
  const floorPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const floorPoint = useRef(new THREE.Vector3());
  const cinematicTarget = useRef<{
    position: [number, number, number];
    lookAt: [number, number, number];
  } | null>(null);

  useEffect(() => {
    const onNavigate = (event: Event) => {
      const detail = (event as CustomEvent<{ position: [number, number, number]; lookAt: [number, number, number] }>).detail;
      if (!detail) return;
      cinematicTarget.current = detail;
      controlsState.walkTarget = null;
    };
    window.addEventListener('dearv:navigate', onNavigate);
    return () => window.removeEventListener('dearv:navigate', onNavigate);
  }, []);

  useEffect(() => {
    // Match Camera A in the approved plan: inside the foyer, looking diagonally
    // toward the open gallery instead of straight into the study's north wall.
    camera.position.set(-9.45, EYE_HEIGHT, ROOM_DEPTH / 2 - 2.2);
    camera.rotation.order = 'YXZ';
    yaw.current = -0.52;
    pitch.current = 0;
    camera.rotation.y = -0.52;
  }, [camera]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;
      switch (event.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          controlsState.keys.w = true;
          break;
        case 'a':
        case 'arrowleft':
          controlsState.keys.a = true;
          break;
        case 's':
        case 'arrowdown':
          controlsState.keys.s = true;
          break;
        case 'd':
        case 'arrowright':
          controlsState.keys.d = true;
          break;
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          controlsState.keys.w = false;
          break;
        case 'a':
        case 'arrowleft':
          controlsState.keys.a = false;
          break;
        case 's':
        case 'arrowdown':
          controlsState.keys.s = false;
          break;
        case 'd':
        case 'arrowright':
          controlsState.keys.d = false;
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    const element = gl.domElement;
    const onPointerDown = (event: PointerEvent) => {
      dragging.current = true;
      lastPointer.current = { x: event.clientX, y: event.clientY };
      pointerStart.current = { x: event.clientX, y: event.clientY, time: performance.now() };
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging.current) return;
      const dx = event.clientX - lastPointer.current.x;
      const dy = event.clientY - lastPointer.current.y;
      lastPointer.current = { x: event.clientX, y: event.clientY };
      const travelled = Math.hypot(event.clientX - pointerStart.current.x, event.clientY - pointerStart.current.y);
      if (travelled < 5) return;
      controlsState.walkTarget = null;
      controlsState.cameraTarget = null;
      yaw.current -= dx * 0.0032;
      pitch.current = THREE.MathUtils.clamp(pitch.current - dy * 0.0032, -0.88, 0.82);
    };
    const onPointerUp = (event: PointerEvent) => {
      const travelled = Math.hypot(event.clientX - pointerStart.current.x, event.clientY - pointerStart.current.y);
      const elapsed = performance.now() - pointerStart.current.time;
      dragging.current = false;
      if (travelled > 8 || elapsed > 520) return;

      const rect = element.getBoundingClientRect();
      const pointer = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.current.setFromCamera(pointer, camera);
      const hit = raycaster.current.ray.intersectPlane(floorPlane.current, floorPoint.current);
      if (!hit) return;
      const x = THREE.MathUtils.clamp(hit.x, -BOUND_X, BOUND_X);
      const z = THREE.MathUtils.clamp(hit.z, -BOUND_Z, BOUND_Z);
      if (!blocked(x, z)) {
        controlsState.cameraTarget = null;
        controlsState.walkTarget = { x, z };
      }
    };
    element.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      element.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [camera, gl]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const cameraTarget = cinematicTarget.current ?? controlsState.cameraTarget;
    if (cameraTarget) {
      const [x, y, z] = cameraTarget.position;
      camera.position.x = THREE.MathUtils.damp(camera.position.x, x, 5.8, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, y, 5.8, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, z, 5.8, dt);
      const dx = cameraTarget.lookAt[0] - camera.position.x;
      const dz = cameraTarget.lookAt[2] - camera.position.z;
      yaw.current = Math.atan2(-dx, -dz);
      pitch.current = THREE.MathUtils.clamp(
        Math.atan2(camera.position.y - cameraTarget.lookAt[1], Math.hypot(dx, dz)),
        -0.7,
        0.7
      );
      camera.rotation.y = THREE.MathUtils.damp(camera.rotation.y, yaw.current, 9, dt);
      camera.rotation.x = THREE.MathUtils.damp(camera.rotation.x, pitch.current, 9, dt);
      if (Math.hypot(camera.position.x - x, camera.position.y - y, camera.position.z - z) < 0.025) {
        controlsState.cameraTarget = null;
        cinematicTarget.current = null;
      }
      if (markerRef.current) markerRef.current.visible = false;
      return;
    }

    const { x: lookX, y: lookY } = controlsState.joystickLook;
    if (lookX !== 0 || lookY !== 0) {
      yaw.current -= lookX * LOOK_SPEED * dt;
      pitch.current = THREE.MathUtils.clamp(pitch.current - lookY * LOOK_SPEED * dt, -0.88, 0.82);
    }
    camera.rotation.y = THREE.MathUtils.damp(camera.rotation.y, yaw.current, 15, dt);
    camera.rotation.x = THREE.MathUtils.damp(camera.rotation.x, pitch.current, 15, dt);

    let moveX = controlsState.joystickMove.x;
    let moveZ = controlsState.joystickMove.y;
    if (moveX === 0 && moveZ === 0) {
      const { w, a, s, d } = controlsState.keys;
      if (w) moveZ -= 1;
      if (s) moveZ += 1;
      if (a) moveX -= 1;
      if (d) moveX += 1;
    }

    if (moveX !== 0 || moveZ !== 0) controlsState.walkTarget = null;

    const walkTarget = controlsState.walkTarget;
    if (walkTarget) {
      const dx = walkTarget.x - camera.position.x;
      const dz = walkTarget.z - camera.position.z;
      const distance = Math.hypot(dx, dz);
      if (markerRef.current) {
        markerRef.current.visible = true;
        markerRef.current.position.set(walkTarget.x, 0.035, walkTarget.z);
        const pulse = 1 + Math.sin(state.clock.elapsedTime * 5.5) * 0.08;
        markerRef.current.scale.setScalar(pulse);
      }
      if (distance < 0.2) {
        controlsState.walkTarget = null;
        velocity.current.set(0, 0);
        if (markerRef.current) markerRef.current.visible = false;
        return;
      }
      const step = Math.min(distance, MOVE_SPEED * 0.82 * dt);
      const stepX = (dx / distance) * step;
      const stepZ = (dz / distance) * step;
      const targetX = THREE.MathUtils.clamp(camera.position.x + stepX, -BOUND_X, BOUND_X);
      const targetZ = THREE.MathUtils.clamp(camera.position.z + stepZ, -BOUND_Z, BOUND_Z);
      const movedX = !blocked(targetX, camera.position.z);
      const movedZ = !blocked(camera.position.x, targetZ);
      if (movedX) camera.position.x = targetX;
      if (movedZ) camera.position.z = targetZ;
      if (!movedX && !movedZ) {
        controlsState.walkTarget = null;
        if (markerRef.current) markerRef.current.visible = false;
        return;
      }
      yaw.current = Math.atan2(-dx, -dz);
      camera.rotation.y = THREE.MathUtils.damp(camera.rotation.y, yaw.current, 7.5, dt);
      camera.position.y = EYE_HEIGHT + Math.sin(state.clock.elapsedTime * 6.4) * 0.004;
      return;
    }
    if (markerRef.current) markerRef.current.visible = false;

    const inputLength = Math.hypot(moveX, moveZ);
    if (inputLength > 1) {
      moveX /= inputLength;
      moveZ /= inputLength;
    }

    velocity.current.x = THREE.MathUtils.damp(velocity.current.x, moveX, inputLength ? 11 : 7.5, dt);
    velocity.current.y = THREE.MathUtils.damp(velocity.current.y, moveZ, inputLength ? 11 : 7.5, dt);

    if (Math.abs(velocity.current.x) < 0.002 && Math.abs(velocity.current.y) < 0.002) {
      velocity.current.set(0, 0);
      return;
    }

    const forward = new THREE.Vector3(-Math.sin(yaw.current), 0, -Math.cos(yaw.current));
    const right = new THREE.Vector3(Math.cos(yaw.current), 0, -Math.sin(yaw.current));
    const deltaVector = new THREE.Vector3()
      .addScaledVector(forward, -velocity.current.y * MOVE_SPEED * dt)
      .addScaledVector(right, velocity.current.x * MOVE_SPEED * dt);

    const currentX = camera.position.x;
    const currentZ = camera.position.z;
    const targetX = THREE.MathUtils.clamp(currentX + deltaVector.x, -BOUND_X, BOUND_X);
    const targetZ = THREE.MathUtils.clamp(currentZ + deltaVector.z, -BOUND_Z, BOUND_Z);

    if (!blocked(targetX, currentZ)) camera.position.x = targetX;
    else velocity.current.x *= 0.25;
    if (!blocked(camera.position.x, targetZ)) camera.position.z = targetZ;
    else velocity.current.y *= 0.25;

    const walking = Math.min(1, velocity.current.length());
    camera.position.y = EYE_HEIGHT + Math.sin(state.clock.elapsedTime * 7.2) * 0.006 * walking;
  });

  return (
    <group ref={markerRef} visible={false}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.16, 0.22, 40]} />
        <meshBasicMaterial color="#f4d6a5" transparent opacity={0.82} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.045, 28]} />
        <meshBasicMaterial color="#fff6e7" transparent opacity={0.9} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}
