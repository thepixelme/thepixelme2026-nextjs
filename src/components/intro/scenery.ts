// Generated geometry for the intro scene. It is rendered on the server (V8)
// and hydrated in every browser engine, so it must come out bit-identical
// everywhere: use only + - * / % and Math.round/min/max/floor/imul, which
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

const round2 = (v: number) => Math.round(v * 100) / 100;

// Midpoint-displacement ridge across x 0..1000; y 0 is the highest peak.
export function ridgePoints(seed: number, height: number): [number, number][] {
  const rand = mulberry32(seed);
  const n = 128;
  const ys = new Array<number>(n + 1).fill(0);
  ys[0] = rand();
  ys[n] = rand();
  let spread = 1;
  for (let step = n; step > 1; step /= 2) {
    const half = step / 2;
    for (let i = half; i < n; i += step) {
      ys[i] = (ys[i - half] + ys[i + half]) / 2 + (rand() - 0.5) * spread;
    }
    spread *= 0.55;
  }
  const min = Math.min(...ys);
  const range = Math.max(...ys) - min;
  return ys.map((v, i) => [(i / n) * 1000, height * (1 - (v - min) / range)]);
}

export function ridgePath(points: [number, number][]) {
  return `M0,1000 L${points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L")} L1000,1000 Z`;
}

export function forestPath(points: [number, number][], seed: number) {
  const rand = mulberry32(seed);
  let d = "";
  for (let i = 0; i < points.length; i += 1) {
    if (rand() < 0.35) continue;
    const [x, y] = points[i];
    const h = 14 + rand() * 18;
    const w = 4 + rand() * 3;
    d += `M${(x - w).toFixed(1)},${(y + 4).toFixed(1)} L${x.toFixed(1)},${(y - h).toFixed(1)} L${(x + w).toFixed(1)},${(y + 4).toFixed(1)} Z `;
  }
  return d;
}

// Meadow crests for DeskScene, in vw below the laptop screen's bottom edge.
export const meadowY = (x: number) =>
  16 + 0.0006 * (x - 50) * (x - 50) + 1.2 * sine(x / 23);
export const foregroundY = (x: number) =>
  80 + 9 * sine(x / 55 + 1) + 0.00025 * (x - 50) * (x - 50);

export function hillPath(crest: (x: number) => number) {
  let d = "M-450,400";
  for (let x = -450; x <= 550; x += 10) d += ` L${x},${crest(x).toFixed(2)}`;
  return `${d} L550,400 Z`;
}

// Grass tufts and wildflowers, growing with distance below the crest so the
// meadow reads as receding.
export function meadowDetail() {
  const rand = mulberry32(5);
  let tufts = "";
  const flowers: { x: number; y: number; r: number; tone: number }[] = [];
  for (let i = 0; i < 90; i += 1) {
    const x = -180 + rand() * 420;
    const depth = 2 + rand() * 60;
    const y = meadowY(x) + depth;
    const s = 0.6 + depth * 0.03;
    tufts += `M${x.toFixed(1)},${y.toFixed(1)} l${(-0.7 * s).toFixed(2)},${(-2 * s).toFixed(2)} M${x.toFixed(1)},${y.toFixed(1)} l0,${(-2.5 * s).toFixed(2)} M${x.toFixed(1)},${y.toFixed(1)} l${(0.7 * s).toFixed(2)},${(-2 * s).toFixed(2)} `;
    if (i % 3 === 0) {
      flowers.push({
        x: round2(x + 2),
        y: round2(y - 0.5),
        r: round2(0.35 * s),
        tone: Math.floor(rand() * 3),
      });
    }
  }
  return { tufts, flowers };
}

// Laptop base for LaptopFrame, seen from slightly above. Points on the deck
// are given in plan coordinates — u across 0..1, v from the hinge (0) to the
// front edge (1) — and projected in perspective onto a trapezoid that widens
// towards the viewer, in the same vw units as DeskScene.
// The camera looks squarely at the screen, so with the lid tilted back ~25°
// the 22 cm deck foreshortens to sin 25° ≈ 0.42 of its plan depth (73vw).
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

// Desk for DeskScene at real scale (~110 cm wide), running from behind the
// laptop to in front of it. Its sides follow the deck's vanishing lines.
const DESK_BACK_Y = -18;
const DESK_FRONT_Y = 44;
const DESK_FRONT_HALF = 165;
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
