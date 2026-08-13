'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { controlsState } from '@/lib/controlsState';
import { ROOM_WIDTH, ROOM_DEPTH } from './Room';

const EYE_HEIGHT = 1.6;
const MOVE_SPEED = 3.15;
const LOOK_SPEED = 2.2;
const MARGIN = 0.48;
const BOUND_X = ROOM_WIDTH / 2 - MARGIN;
const BOUND_Z = ROOM_DEPTH / 2 - MARGIN;
const PLAYER_RADIUS = 0.18;

const BLOCKERS = [
  { minX: -6.35, maxX: -2.95, minZ: -5.45, maxZ: -3.55 },
  { minX: 2.35, maxX: 5.05, minZ: -4.9, maxZ: -2.55 },
  { minX: 5.85, maxX: 7.35, minZ: -0.9, maxZ: 2.0 },
  { minX: -7.45, maxX: -6.45, minZ: -2.4, maxZ: 1.25 },
  { minX: -5.55, maxX: -2.15, minZ: 3.15, maxZ: 6.05 },
  { minX: 5.2, maxX: 7.4, minZ: 3.75, maxZ: 5.75 },
  { minX: 4.25, maxX: 7.5, minZ: -6.55, maxZ: -5.15 },
  { minX: -6.7, maxX: -3.4, minZ: 5.7, maxZ: 6.6 },
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
  const lastPointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    camera.position.set(0, EYE_HEIGHT, ROOM_DEPTH / 2 - 1.55);
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
      yaw.current -= dx * 0.0035;
      pitch.current = THREE.MathUtils.clamp(pitch.current - dy * 0.0035, -1.15, 1.15);
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

  useFrame((_, delta) => {
    const { x: lookX, y: lookY } = controlsState.joystickLook;
    if (lookX !== 0 || lookY !== 0) {
      yaw.current -= lookX * LOOK_SPEED * delta;
      pitch.current = THREE.MathUtils.clamp(pitch.current - lookY * LOOK_SPEED * delta, -1.15, 1.15);
    }
    camera.rotation.y = THREE.MathUtils.damp(camera.rotation.y, yaw.current, 18, delta);
    camera.rotation.x = THREE.MathUtils.damp(camera.rotation.x, pitch.current, 18, delta);

    let moveX = controlsState.joystickMove.x;
    let moveZ = controlsState.joystickMove.y;
    if (moveX === 0 && moveZ === 0) {
      const { w, a, s, d } = controlsState.keys;
      if (w) moveZ -= 1;
      if (s) moveZ += 1;
      if (a) moveX -= 1;
      if (d) moveX += 1;
    }

    if (moveX === 0 && moveZ === 0) return;
    const length = Math.hypot(moveX, moveZ) || 1;
    moveX /= length;
    moveZ /= length;

    const forward = new THREE.Vector3(-Math.sin(yaw.current), 0, -Math.cos(yaw.current));
    const right = new THREE.Vector3(Math.cos(yaw.current), 0, -Math.sin(yaw.current));
    const step = MOVE_SPEED * Math.min(delta, 0.05);
    const deltaVector = new THREE.Vector3().addScaledVector(forward, -moveZ * step).addScaledVector(right, moveX * step);

    const currentX = camera.position.x;
    const currentZ = camera.position.z;
    const targetX = THREE.MathUtils.clamp(currentX + deltaVector.x, -BOUND_X, BOUND_X);
    const targetZ = THREE.MathUtils.clamp(currentZ + deltaVector.z, -BOUND_Z, BOUND_Z);

    if (!blocked(targetX, currentZ)) camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, 22, delta);
    if (!blocked(camera.position.x, targetZ)) camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 22, delta);
  });

  return null;
}
