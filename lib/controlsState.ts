// Shared mutable input state, written to by keyboard/mouse listeners and the
// on-screen joysticks, and read every frame inside the R3F render loop.
// Kept outside React state deliberately — this updates at input frequency
// (or 60fps from useFrame) and funnelling it through React would just cause
// needless re-renders for values nothing ever displays.
export const controlsState = {
  keys: { w: false, a: false, s: false, d: false },
  joystickMove: { x: 0, y: 0 }, // -1..1, left stick
  joystickLook: { x: 0, y: 0 }, // -1..1, right stick
  walkTarget: null as { x: number; z: number } | null,
  cameraTarget: null as {
    position: [number, number, number];
    lookAt: [number, number, number];
  } | null,
};

export function walkTo(x: number, z: number) {
  controlsState.cameraTarget = null;
  controlsState.walkTarget = { x, z };
}

export function moveCameraTo(position: [number, number, number], lookAt: [number, number, number]) {
  controlsState.walkTarget = null;
  controlsState.cameraTarget = { position, lookAt };
}
