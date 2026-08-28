'use client';

// Character slot intentionally empty.
// No primitive geometry placeholder.
// Future: load a proper rigged/skinned GLB or VRM character.

export default function Character({
  onClick,
}: {
  position?: [number, number, number];
  onClick?: () => void;
}) {
  void onClick;
  return null;
}
