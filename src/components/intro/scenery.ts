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
  50 + 9 * sine(x / 55 + 1) + 0.00025 * (x - 50) * (x - 50);

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
