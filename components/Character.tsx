'use client';

import * as THREE from 'three';

// Character placeholder intentionally disabled.
// Do not use primitive geometry as a fake human.
// This slot remains reserved for a proper rigged/skinned character asset.

export default function Character({
  position = [0, 0, 0] as [number, number, number],
  onClick,
}: {
  position?: [number, number, number];
  onClick?: () => void;
}) {
  void THREE;
  void position;
  void onClick;
  return null;
}
