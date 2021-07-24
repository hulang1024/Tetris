const FRAME_MS = 1000 / 60;

export function framesToMS(frames: number) {
  return Math.floor(frames * FRAME_MS);
}
