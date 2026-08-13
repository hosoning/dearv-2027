'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { controlsState } from '@/lib/controlsState';
import { ROOM_WIDTH, ROOM_DEPTH } from './Room';

const EYE_HEIGHT = 1.6;
const MOVE_SPEED = 3.8;
const LOOK_SPEED = 2.05;
const MARGIN = 0.48;
const BOUND_X = ROOM_WIDTH / 2 - MARGIN;
const BOUND_Z = ROOM_DEPTH / 2 - MARGIN;
const PLAYER_RADIUS = 0.18;

const BLOCKERS = [
  // Master-suite wall, split around its two doors.
  { minX: -5.32, maxX: -5.02, minZ: -11.7, maxZ: -6.42 },
  { minX: -5.32, maxX: -5.02, minZ: -5.16, maxZ: 1.0 },
  { minX: -5.32, maxX: -5.02, minZ: 2.4, maxZ: 5.05 },
  // Bathroom-to-bedroom wall, split around the internal door.
  { minX: -14.85, maxX: -11.35, minZ: -4.4, maxZ: -4.1 },
  { minX: -10.04, maxX: -5.28, minZ: -4.4, maxZ: -4.1 },
  // Study glass partition with a wide entrance.
  { minX: 4.15, maxX: 5.18, minZ: 3.76, maxZ: 4.05 },
  { minX: 7.05, maxX: 14.72, minZ: 3.76, maxZ: 4.05 },
  // Large fixed furniture.
  { minX: -14.45, maxX: -4.95, minZ: 10.4, maxZ: 11.75 },
  { minX: -10.8, maxX: -5.2, minZ: 6.45, maxZ: 8.2 },
  { minX: 4.1, maxX: 14.75, minZ: 10.9, maxZ: 11.75 },
  { minX: 7.55, maxX: 12.4, minZ: 6.4, maxZ: 8.25 },
  { minX: -10.3, maxX: -6.55, minZ: -1.55, maxZ: 2.65 },
  { minX: -14.7, maxX: -13.2, minZ: -3.75, maxZ: 3.35 },
  { minX: -14.2, maxX: -10.25, minZ: -9.65, maxZ: -7.65 },
  { minX: 0.05, maxX: 4.8, minZ: -3.75, maxZ: -1.55 },
  { minX: 0.4, maxX: 4.35, minZ: -6.2, maxZ: -4.0 },
  { minX: 12.95, maxX: 14.6, minZ: -3.8, maxZ: -0.45 },
];

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

  useEffect(() => {
    camera.position.set(8.55, EYE_HEIGHT, ROOM_DEPTH / 2 - 1.45);
    camera.rotation.order = 'YXZ';
    yaw.current = 0;
    pitch.current = 0;
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
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging.current) return;
      const dx = event.clientX - lastPointer.current.x;
      const dy = event.clientY - lastPointer.current.y;
      lastPointer.current = { x: event.clientX, y: event.clientY };
      yaw.current -= dx * 0.0032;
      pitch.current = THREE.MathUtils.clamp(pitch.current - dy * 0.0032, -1.08, 1.08);
    };
    const onPointerUp = () => {
      dragging.current = false;
    };
    element.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      element.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [gl]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const { x: lookX, y: lookY } = controlsState.joystickLook;
    if (lookX !== 0 || lookY !== 0) {
      yaw.current -= lookX * LOOK_SPEED * dt;
      pitch.current = THREE.MathUtils.clamp(pitch.current - lookY * LOOK_SPEED * dt, -1.08, 1.08);
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

  return null;
}
