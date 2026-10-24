import { DESK_UNIT } from "./camera";

// Generated geometry for the intro scene. It is rendered on the server (V8)
// and hydrated in every browser engine, so it must come out bit-identical
// everywhere: use only + - * / % and Math.round/min/max/floor/ceil/imul, which
// IEEE 754 and the JS spec pin down exactly. Never Math.sin, Math.pow / **,
// or other library maths — their last bits differ between engines (e.g.
// JavaScriptCore in Safari) and break hydration.

export function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Bhaskara I's approximation (within ~0.2%), arithmetic only.
export function sine(x: number) {
  const tau = 2 * Math.PI;
  let t = x % tau;
  if (t < 0) t += tau;
  const sign = t > Math.PI ? -1 : 1;
  if (t > Math.PI) t -= Math.PI;
  const p = t * (Math.PI - t);
  return (sign * 16 * p) / (5 * Math.PI * Math.PI - 4 * p);
}

export const round2 = (v: number) => Math.round(v * 100) / 100;

// Circles of { x, y, r } as one path, for star fields and snow.
export function dotsPath(dots: { x: number; y: number; r: number }[]) {
  return dots
    .map(
      ({ x, y, r }) =>
        `M${round2(x - r)},${round2(y)} a${r},${r} 0 1,0 ${round2(2 * r)},0 a${r},${r} 0 1,0 ${round2(-2 * r)},0`,
    )
    .join(" ");
}

// Teardrop flame of width w and height h standing on (x, y); `lean` shifts
// the tip sideways.
export function flamePath(
  x: number,
  y: number,
  w: number,
  h: number,
  lean = 0,
) {
  const r = w / 2;
  const n = (v: number) => round2(v);
  return `M${n(x - r)},${n(y)} C${n(x - r * 1.15)},${n(y - h * 0.3)} ${n(x - r * 0.35 + lean * 0.5)},${n(y - h * 0.55)} ${n(x + lean)},${n(y - h)} C${n(x + r * 0.55 + lean * 0.5)},${n(y - h * 0.5)} ${n(x + r * 1.15)},${n(y - h * 0.3)} ${n(x + r)},${n(y)} Q${n(x)},${n(y + r * 0.7)} ${n(x - r)},${n(y)} Z`;
}

// Laptop base for LaptopFrame, seen from slightly above. Points on the deck
// are given in plan coordinates — u across 0..1, v from the hinge (0) to the
// front edge (1) — and projected in perspective onto a trapezoid that widens
// towards the viewer, in the same units as DeskScene (1% of the screen width).
// The camera looks squarely at the screen, so with the lid tilted back ~25°
// the 22 cm deck foreshortens to sin 25° ≈ 0.42 of its plan depth (73 units).
const DECK_BACK_Y = 2.6;
const DECK_DEPTH = 31;
const DECK_BACK_WIDTH = 102.8;
const DECK_SPREAD = 1.07; // front edge width ÷ back edge width
const DECK_FACE = 1.1;

const WELL = { u0: 0.085, v0: 0.045, u1: 0.915, v1: 0.54 };
const TRACKPAD = { u0: 0.29, v0: 0.585, u1: 0.71, v1: 0.95 };
const GRILLE_US = [0.035, 0.05, 0.065, 0.935, 0.95, 0.965];

// Widths in key units; every row spans 14.5. The ↑/↓ pair shares one slot.
const KEY_ROWS = [
  [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5],
  [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.75],
  [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25],
  [1, 1, 1, 1.25, 5, 1.25, 1, 1, 1, 1],
];
const ARROW_STACK = { row: 5, key: 8 };
const KEY_GAP = 0.16;
const KEY_PAD = 0.25;

// Scale grows as 1 / (1 - c·v): 1 at the hinge, DECK_SPREAD at the front.
const DECK_C = 1 - 1 / DECK_SPREAD;
const HORIZON_Y = DECK_BACK_Y - DECK_DEPTH / (DECK_SPREAD - 1);

// Width multiplier (1 at the hinge line) for anything lying flat at projected
// depth y, so the desk shares the deck's vanishing lines.
export const flatSpread = (y: number) =>
  (y - HORIZON_Y) / (DECK_BACK_Y - HORIZON_Y);

function deckPoint(u: number, v: number, dy = 0) {
  const s = 1 / (1 - DECK_C * v);
  const x = 50 + (u - 0.5) * DECK_BACK_WIDTH * s;
  const y = DECK_BACK_Y + (DECK_DEPTH * (s - 1)) / (DECK_SPREAD - 1) + dy;
  return `${round2(x)},${round2(y)}`;
}

function deckQuad(u0: number, v0: number, u1: number, v1: number) {
  return `M${deckPoint(u0, v0)} L${deckPoint(u1, v0)} L${deckPoint(u1, v1)} L${deckPoint(u0, v1)} Z`;
}

function deckRoundRect(
  { u0, v0, u1, v1 }: { u0: number; v0: number; u1: number; v1: number },
  ru: number,
  rv: number,
) {
  const p = deckPoint;
  return `M${p(u0 + ru, v0)} L${p(u1 - ru, v0)} Q${p(u1, v0)} ${p(u1, v0 + rv)} L${p(u1, v1 - rv)} Q${p(u1, v1)} ${p(u1 - ru, v1)} L${p(u0 + ru, v1)} Q${p(u0, v1)} ${p(u0, v1 - rv)} L${p(u0, v0 + rv)} Q${p(u0, v0)} ${p(u0 + ru, v0)} Z`;
}

function keyboardPath() {
  const cols = KEY_ROWS[0].reduce((sum, w) => sum + w, 0);
  const pu = (WELL.u1 - WELL.u0) / (cols + 2 * KEY_PAD);
  const pv = (WELL.v1 - WELL.v0) / (KEY_ROWS.length + 2 * KEY_PAD);
  const key = (x: number, y: number, w: number, h: number) =>
    deckQuad(
      WELL.u0 + (x + KEY_GAP / 2) * pu,
      WELL.v0 + (y + KEY_GAP / 2) * pv,
      WELL.u0 + (x + w - KEY_GAP / 2) * pu,
      WELL.v0 + (y + h - KEY_GAP / 2) * pv,
    );
  let d = "";
  KEY_ROWS.forEach((row, r) => {
    let x = KEY_PAD;
    const y = KEY_PAD + r;
    row.forEach((w, i) => {
      if (r === ARROW_STACK.row && i === ARROW_STACK.key) {
        d += `${key(x, y, w, 0.5)} ${key(x, y + 0.5, w, 0.5)} `;
      } else {
        d += `${key(x, y, w, 1)} `;
      }
      x += w;
    });
  });
  return d;
}

function laptopBase() {
  const p = deckPoint;
  const ru = 0.035;
  const rv = 0.05;
  const t = DECK_FACE;
  return {
    backY: DECK_BACK_Y,
    frontY: DECK_BACK_Y + DECK_DEPTH,
    deck: deckRoundRect({ u0: 0, v0: 0, u1: 1, v1: 1 }, ru, rv),
    face: `M${p(0, 1 - rv)} Q${p(0, 1)} ${p(ru, 1)} L${p(1 - ru, 1)} Q${p(1, 1)} ${p(1, 1 - rv)} L${p(1, 1 - rv, t)} Q${p(1, 1, t)} ${p(1 - ru, 1, t)} L${p(ru, 1, t)} Q${p(0, 1, t)} ${p(0, 1 - rv, t)} Z`,
    notch: `M${p(0.435, 1)} Q${p(0.5, 0.93)} ${p(0.565, 1)} Z`,
    shadow: `M${p(0.03, 0.25)} L${p(0.97, 0.25)} L${p(1.03, 1, 1.6)} L${p(-0.03, 1, 1.6)} Z`,
    grille: GRILLE_US.map((u) => `M${p(u, 0.07)} L${p(u, 0.52)}`).join(" "),
    well: deckRoundRect(WELL, 0.008, 0.012),
    keys: keyboardPath(),
    trackpad: deckRoundRect(TRACKPAD, 0.012, 0.03),
  };
}

export const LAPTOP_BASE = laptopBase();

// Desk for DeskScene at real scale (~85 cm wide), running from behind the
// laptop to in front of it. Its sides follow the deck's vanishing lines.
const DESK_BACK_Y = -18;
const DESK_FRONT_Y = 44;
const DESK_FRONT_HALF = 140;
// Grain strokes as [y, from, to], from/to as fractions of the half width.
const DESK_GRAIN = [
  [-12, -0.92, -0.6],
  [-12, 0.55, 0.9],
  [-3, -0.95, -0.7],
  [4, 0.62, 0.96],
  [12, -0.97, -0.66],
  [18, 0.58, 0.94],
  [26, -0.9, -0.4],
  [30, 0.45, 0.97],
  [38, -0.98, -0.55],
  [40, 0.2, 0.75],
];

function deskGeometry() {
  const half = (y: number) =>
    (DESK_FRONT_HALF * flatSpread(y)) / flatSpread(DESK_FRONT_Y);
  const x = (y: number, f: number) => round2(50 + f * half(y));
  const top = `M${x(DESK_BACK_Y, -1)},${DESK_BACK_Y} L${x(DESK_BACK_Y, 1)},${DESK_BACK_Y} L${x(DESK_FRONT_Y, 1)},${DESK_FRONT_Y} L${x(DESK_FRONT_Y, -1)},${DESK_FRONT_Y} Z`;
  const grain = DESK_GRAIN.map(
    ([y, from, to]) => `M${x(y, from)},${y} L${x(y, to)},${y}`,
  ).join(" ");
  return {
    top,
    grain,
    backY: DESK_BACK_Y,
    frontY: DESK_FRONT_Y,
    left: x(DESK_FRONT_Y, -1),
    right: x(DESK_FRONT_Y, 1),
    width: round2(x(DESK_FRONT_Y, 1) - x(DESK_FRONT_Y, -1)),
    frontLegs: [
      round2(x(DESK_FRONT_Y, -1) + 3),
      round2(x(DESK_FRONT_Y, 1) - 8),
    ],
    backLegs: [round2(x(DESK_BACK_Y, -1) + 3), round2(x(DESK_BACK_Y, 1) - 7)],
  };
}

export const DESK = deskGeometry();

// Rug under the desk (~3 m wide), in stage units like DESK. Its sides follow
// the same vanishing lines; only its back half is ever in view, and its sides
// only on very wide viewports.
const RUG_BACK_Y = 24;
const RUG_FRONT_Y = 320;
const RUG_BACK_HALF = 500;
// Bands across the rug as [top, bottom].
const RUG_BORDER = [24, 36];
const RUG_LINES = [
  [36, 38.5],
  [80, 82.5],
  [85, 87.5],
  [128, 130.5],
];

function rugGeometry() {
  const spread = (y: number) => flatSpread(y) / flatSpread(RUG_BACK_Y);
  const at = (x0: number, y: number) => round2(50 + (x0 - 50) * spread(y));
  const left = 50 - RUG_BACK_HALF;
  const right = 50 + RUG_BACK_HALF;
  const band = ([top, bottom]: number[]) =>
    `M${at(left, top)},${top} L${at(right, top)},${top} L${at(right, bottom)},${bottom} L${at(left, bottom)},${bottom} Z`;
  let fringe = "";
  for (let i = 0; i * 4 <= right - left; i += 1) {
    fringe += `M${left + i * 4},${RUG_BACK_Y} l0,-3.5 `;
  }
  return {
    field: band([RUG_BACK_Y, RUG_FRONT_Y]),
    border: band(RUG_BORDER),
    lines: RUG_LINES.map(band).join(" "),
    fringe,
  };
}

export const RUG = rugGeometry();

// A box lying square on the desk, for DeskScene's notebooks: x0..x1 across
// its back edge, from depth `back` to `front`, standing `base` above the desk
// (when stacked) and `height` tall. Its sides follow the deck's vanishing
// lines, so right of centre its inner (left) side shows as a sliver.
export function deskBox({
  x0,
  x1,
  back,
  front,
  base = 0,
  height,
}: {
  x0: number;
  x1: number;
  back: number;
  front: number;
  base?: number;
  height: number;
}) {
  const at = (x: number, y: number) =>
    round2(50 + ((x - 50) * flatSpread(y)) / flatSpread(back));
  const up = (y: number, lift: number) => round2(y - lift);
  const lift = base + height;
  const quad = (points: [number, number][]) =>
    `M${points.map(([x, y]) => `${x},${y}`).join(" L")} Z`;
  return {
    top: quad([
      [at(x0, back), up(back, lift)],
      [at(x1, back), up(back, lift)],
      [at(x1, front), up(front, lift)],
      [at(x0, front), up(front, lift)],
    ]),
    face: quad([
      [at(x0, front), up(front, lift)],
      [at(x1, front), up(front, lift)],
      [at(x1, front), up(front, base)],
      [at(x0, front), up(front, base)],
    ]),
    side: quad([
      [at(x0, back), up(back, lift)],
      [at(x0, front), up(front, lift)],
      [at(x0, front), up(front, base)],
      [at(x0, back), up(back, base)],
    ]),
    // A strip across the top and down the front face, `w` wide from x
    // (measured at the back edge), for an elastic band.
    strap: (x: number, w: number) =>
      quad([
        [at(x, back), up(back, lift)],
        [at(x + w, back), up(back, lift)],
        [at(x + w, front), up(front, lift)],
        [at(x + w, front), up(front, base)],
        [at(x, front), up(front, base)],
        [at(x, front), up(front, lift)],
      ]),
    // The page block on the front face, inset from the covers.
    pages: (inset: number) =>
      quad([
        [round2(at(x0, front) + inset), up(front, lift - inset)],
        [round2(at(x1, front) - inset * 2), up(front, lift - inset)],
        [round2(at(x1, front) - inset * 2), up(front, base + inset)],
        [round2(at(x0, front) + inset), up(front, base + inset)],
      ]),
    at,
    frontTop: up(front, lift),
    frontBottom: up(front, base),
  };
}

// The room behind the desk, for SceneBackdrop and Fireplace, in room units:
// 1% of the width of the laptop pose's 16:10 frame, with y = 0 on the device
// screen's bottom edge and up negative. A desk unit is DESK_UNIT room units, so the desk's back
// edge (desk y −18) sits at y −4.5. Phones and tablets magnify the room at
// rest (see the intro camera in globals.css), so these units hold on every
// device.
export const ROOM_FLOOR_Y = -9;
// Front-to-back lines on the floor meet where the deck's do.
const ROOM_VANISH_Y = HORIZON_Y * DESK_UNIT;
const PLANK_WIDTH = 2.6;

export function floorSeams() {
  const rand = mulberry32(17);
  const spread = (y: number) =>
    (y - ROOM_VANISH_Y) / (ROOM_FLOOR_Y - ROOM_VANISH_Y);
  const at = (x0: number, y: number) => round2(50 + (x0 - 50) * spread(y));
  const bottom = 40;
  let d = "";
  const plank = (i: number, r: () => number) => {
    const x0 = -15 + i * PLANK_WIDTH;
    d += `M${round2(x0)},${ROOM_FLOOR_Y} L${at(x0, bottom)},${bottom} `;
    // One butt joint per plank row.
    const y = round2(ROOM_FLOOR_Y + 1.5 + r() * 28);
    d += `M${at(x0, y)},${y} L${at(x0 + PLANK_WIDTH, y)},${y} `;
  };
  for (let i = 0; i <= 52; i += 1) plank(i, rand);
  // Planks past the 16:10 frame, out to x −90 and 190, for wide viewports.
  const outer = mulberry32(23);
  for (let i = 1; i <= 29; i += 1) {
    plank(-i, outer);
    plank(52 + i, outer);
  }
  return d;
}

// Running-bond courses of w × h bricks filling a box from the bottom up,
// clipped to it. Returns two paths so the bricks can take two tones.
export function brickCourses(
  box: { x0: number; y0: number; x1: number; y1: number },
  w: number,
  h: number,
  gap: number,
  seed: number,
) {
  const rand = mulberry32(seed);
  const tones = ["", ""];
  const rows = Math.ceil((box.y1 - box.y0) / (h + gap));
  for (let r = 0; r < rows; r += 1) {
    const bottom = box.y1 - r * (h + gap);
    const top = Math.max(box.y0, bottom - h);
    if (bottom - top < 0.1) continue;
    const offset = r % 2 === 0 ? 0 : -(w + gap) / 2;
    for (let k = 0; box.x0 + offset + k * (w + gap) < box.x1; k += 1) {
      const xa = box.x0 + offset + k * (w + gap);
      const left = Math.max(box.x0, xa);
      const right = Math.min(box.x1, xa + w);
      if (right - left < 0.15) continue;
      tones[rand() < 0.35 ? 1 : 0] +=
        `M${round2(left)},${round2(top)} h${round2(right - left)} v${round2(bottom - top)} h${round2(left - right)} Z `;
    }
  }
  return tones;
}

// Snowy night outside the window: hill crests, pines, stars and a tile of
// snowflakes stacked twice so it can scroll in a seamless loop.
export const nightHillY = (x: number) =>
  -16.8 + 1.2 * sine(x / 6.5) + 0.5 * sine(x / 2.2 + 1);
export const nightNearY = (x: number) => -13.4 + 0.8 * sine(x / 5 + 2);

export function crestPath(
  crest: (x: number) => number,
  x0: number,
  x1: number,
  bottom: number,
) {
  let d = `M${x0},${bottom}`;
  for (let x = x0; x <= x1; x += 1) d += ` L${x},${round2(crest(x))}`;
  return `${d} L${x1},${bottom} Z`;
}

export function pinesPath(seed: number, x0: number, x1: number) {
  const rand = mulberry32(seed);
  let d = "";
  for (let x = x0; x < x1; x += 0.9 + rand() * 2.2) {
    const h = 2.2 + rand() * 4;
    const base = nightHillY(x) + 0.8;
    for (let k = 0; k < 3; k += 1) {
      const bottom = base - k * h * 0.27;
      const half = (h * 0.5 * (1 - k * 0.22)) / 2;
      d += `M${round2(x - half)},${round2(bottom)} L${round2(x)},${round2(bottom - h * 0.48)} L${round2(x + half)},${round2(bottom)} Z `;
    }
  }
  return d;
}

export function starDots(
  seed: number,
  count: number,
  box: { x0: number; y0: number; x1: number; y1: number },
) {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, () => ({
    x: round2(box.x0 + rand() * (box.x1 - box.x0)),
    y: round2(box.y0 + rand() * (box.y1 - box.y0)),
    r: round2(0.06 + rand() * 0.12),
  }));
}

export function snowTile(seed: number, count: number, w: number, h: number) {
  const rand = mulberry32(seed);
  const flakes: { x: number; y: number; r: number }[] = [];
  for (let i = 0; i < count; i += 1) {
    const x = round2(rand() * w);
    const y = round2(rand() * h);
    const r = round2(0.1 + rand() * 0.18);
    flakes.push({ x, y, r }, { x, y: round2(y + h), r });
  }
  return dotsPath(flakes);
}
