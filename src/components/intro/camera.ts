// The laptop plane rests at START_SCALE (screen size as a fraction of the
// viewport), offset START_OFFSET_VH from centre, and zooms until the screen
// fills the viewport. Layers further away (depth < 1) magnify less, which
// gives the room its parallax.
export const START_SCALE = 0.25;
export const START_OFFSET_VH = -4;
// Where the laptop screen's bottom edge rests, which the backdrop is drawn
// around.
export const REST_SCREEN_BOTTOM_VH = 50 + 50 * START_SCALE + START_OFFSET_VH;

export const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;

// Magnification relative to rest. Log-space interpolation keeps the
// perceived zoom speed even.
export function layerScale(p: number, depth: number) {
  return (1 / START_SCALE) ** (depth * easeInOut(p));
}

// Vertical offset (vh) that keeps a layer zooming about the laptop screen's
// centre, which itself drifts from START_OFFSET_VH to 0.
export function layerY(p: number, depth: number) {
  return (
    START_OFFSET_VH * (1 - easeInOut(p)) -
    layerScale(p, depth) * START_OFFSET_VH
  );
}

export function stageScale(p: number) {
  return START_SCALE * layerScale(p, 1);
}

export function stageY(p: number) {
  return START_OFFSET_VH * (1 - easeInOut(p));
}
