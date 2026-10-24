// Generates the "snowfall" desktop wallpaper (public/wallpapers/snowfall-*.jpg):
// the view from the intro room's window — moonlit snowy hills, pines and a
// lit cabin — drawn as SVG and rasterised to JPEG with sharp.
// Run with `npm run wallpaper` after changing the scene or palette below.
// Randomness is seeded, so the output is deterministic.
import { writeFileSync } from "node:fs";
import sharp from "sharp";

const OUT_DIR = new URL("../public/wallpapers/", import.meta.url);
const W = 2560;
const H = 1600;

const MOON = [1990, 330];
const CABIN_X = 1830;

// Far mountain range: gaussian peaks as [centre (0–1 across), height, width].
const RANGE_PEAKS = [
  [0.08, 250, 0.07],
  [0.22, 330, 0.09],
  [0.4, 210, 0.08],
  [0.58, 150, 0.1],
  [0.79, 270, 0.08],
  [0.97, 190, 0.07],
];

// Snowy hills, back to front. `pines` is [count, min height, max height].
const HILLS = [
  {
    crest: {
      base: 1010,
      amp: 50,
      f1: 0.9,
      p1: 1.1,
      f2: 2.2,
      p2: 0.4,
      tilt: 40,
    },
    top: "#a6b6dd",
    bottom: "#8193c4",
    pine: "#2f4275",
    pines: [16, 30, 38],
  },
  {
    crest: {
      base: 1150,
      amp: 65,
      f1: 0.7,
      p1: 3.3,
      f2: 1.8,
      p2: 2.2,
      tilt: -60,
    },
    top: "#c6d1ee",
    bottom: "#9cabd5",
    pine: "#22325d",
    pines: [13, 48, 66],
  },
  {
    crest: {
      base: 1290,
      amp: 70,
      f1: 0.55,
      p1: 0.2,
      f2: 1.5,
      p2: 1.6,
      tilt: -120,
    },
    top: "#e2e8f7",
    bottom: "#b8c5e6",
    pine: "#172241",
    pines: [9, 80, 110],
    cabin: true,
  },
  {
    crest: {
      base: 1470,
      amp: 45,
      f1: 0.8,
      p1: 2.4,
      f2: 2.0,
      p2: 3.1,
      tilt: 30,
    },
    top: "#f5f8fe",
    bottom: "#d3dcf1",
    pine: "#121b35",
    pines: [5, 140, 190],
  },
];

const OUTPUTS = [
  {
    file: "snowfall-2560x1600.jpg",
    viewBox: `0 0 ${W} ${H}`,
    w: 2560,
    h: 1600,
  },
  // Crop for portrait screens (mobile shell), keeping the moon and the cabin.
  {
    file: "snowfall-768x1280.jpg",
    viewBox: "1520 0 960 1600",
    w: 768,
    h: 1280,
  },
];

function mulberry32(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n) => n.toFixed(1);
const linePath = (points) =>
  `M${points.map(([x, y]) => `${f(x)},${f(y)}`).join(" L")}`;
const fillBelow = (points) =>
  `${linePath(points)} L${W + 40},${H + 40} L-40,${H + 40} Z`;

function yAt(points, x) {
  const i = points.findIndex(([px]) => px >= x);
  if (i <= 0) return points[Math.max(i, 0)][1];
  const [x0, y0] = points[i - 1];
  const [x1, y1] = points[i];
  return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
}

// Smooth crest: two sines plus a tilt, for rolling hills.
function sineCrest({ base, amp, f1, p1, f2, p2, tilt }) {
  const points = [];
  for (let x = -40; x <= W + 40; x += 16) {
    const t = x / W;
    points.push([
      x,
      base +
        amp * Math.sin(2 * Math.PI * f1 * t + p1) +
        0.45 * amp * Math.sin(2 * Math.PI * f2 * t + p2) +
        tilt * (t - 0.5),
    ]);
  }
  return points;
}

// Jagged crest by midpoint displacement along `base`, with gaussian peaks on top.
function mountainCrest(rand, { base, height, roughness, peaks }) {
  const n = 256;
  const ys = new Array(n + 1).fill(0);
  ys[0] = (rand() - 0.5) * height;
  ys[n] = (rand() - 0.5) * height;
  let scale = height;
  for (let step = n; step > 1; step /= 2) {
    for (let i = step / 2; i < n; i += step) {
      ys[i] =
        (ys[i - step / 2] + ys[i + step / 2]) / 2 + (rand() - 0.5) * scale;
    }
    scale *= roughness;
  }
  return ys.map((y, i) => {
    const t = i / n;
    const lift = peaks.reduce(
      (sum, [c, h, w]) => sum + h * Math.exp(-(((t - c) / w) ** 2)),
      0,
    );
    return [-40 + (W + 80) * t, base + y - lift];
  });
}

// Three-tier pine silhouette standing on (x, y).
function pine(x, y, h) {
  const w = h * 0.46;
  const tiers = [
    [0.34, -0.64],
    [0.2, -0.64],
    [0.44, -0.32],
    [0.26, -0.32],
    [0.5, 0.02],
  ];
  const right = [
    [x, y - h],
    ...tiers.map(([dx, dy]) => [x + dx * w * 2, y + dy * h]),
  ];
  const left = [...right].reverse().map(([px, py]) => [2 * x - px, py]);
  return `${linePath([...right, ...left.slice(0, -1)])} Z`;
}

function cabin(cx, cy) {
  return [
    `<ellipse cx="${cx}" cy="${cy + 10}" rx="210" ry="60" fill="url(#lamp)" opacity="0.6"/>`,
    `<path d="M${cx + 38},${cy - 150} c-20,-50 30,-70 6,-120 c-18,-40 26,-60 10,-110" fill="none" stroke="#e6ecfb" stroke-opacity="0.35" stroke-width="14" stroke-linecap="round" filter="url(#smoke)"/>`,
    `<rect x="${cx + 26}" y="${cy - 150}" width="22" height="50" fill="#2b1d1f"/>`,
    `<rect x="${cx + 22}" y="${cy - 158}" width="30" height="10" rx="3" fill="#f5f8fe"/>`,
    `<rect x="${cx - 74}" y="${cy - 82}" width="148" height="82" fill="#3a2627"/>`,
    `<path d="M${cx - 92},${cy - 76} L${cx},${cy - 150} L${cx + 92},${cy - 76} Z" fill="#2a1c1e"/>`,
    `<path d="M${cx - 96},${cy - 78} L${cx},${cy - 156} L${cx + 96},${cy - 78} q-6,8 -14,3 q-8,6 -16,0 L${cx},${cy - 136} L${cx - 80},${cy - 75} q-8,7 -16,-3 Z" fill="#f5f8fe"/>`,
    `<circle cx="${cx - 34}" cy="${cy - 44}" r="70" fill="url(#lamp)"/>`,
    `<circle cx="${cx + 34}" cy="${cy - 44}" r="70" fill="url(#lamp)"/>`,
    `<rect x="${cx - 48}" y="${cy - 58}" width="28" height="28" rx="2" fill="#ffc96f"/>`,
    `<rect x="${cx + 20}" y="${cy - 58}" width="28" height="28" rx="2" fill="#ffc96f"/>`,
    `<path d="M${cx - 34},${cy - 58} v28 M${cx - 48},${cy - 44} h28 M${cx + 34},${cy - 58} v28 M${cx + 20},${cy - 44} h28" stroke="#3a2627" stroke-width="3"/>`,
  ];
}

function scene() {
  const rand = mulberry32(11);
  const defs = [
    `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1330"/><stop offset="0.4" stop-color="#1a2858"/><stop offset="0.62" stop-color="#34497f"/><stop offset="0.75" stop-color="#5b6ea3"/></linearGradient>`,
    `<radialGradient id="moonGlow"><stop offset="0" stop-color="#d6e2ff" stop-opacity="0.5"/><stop offset="0.25" stop-color="#b9cbff" stop-opacity="0.18"/><stop offset="1" stop-color="#b9cbff" stop-opacity="0"/></radialGradient>`,
    `<radialGradient id="lamp"><stop offset="0" stop-color="#ffc56e" stop-opacity="0.75"/><stop offset="1" stop-color="#ffb056" stop-opacity="0"/></radialGradient>`,
    `<linearGradient id="range" gradientUnits="userSpaceOnUse" x1="0" y1="600" x2="0" y2="1000"><stop offset="0" stop-color="#c3d0ef"/><stop offset="0.4" stop-color="#7d90c4"/><stop offset="1" stop-color="#3f5289"/></linearGradient>`,
    `<linearGradient id="mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9bbe6" stop-opacity="0"/><stop offset="0.5" stop-color="#a9bbe6" stop-opacity="0.4"/><stop offset="1" stop-color="#a9bbe6" stop-opacity="0"/></linearGradient>`,
    `<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2"/></filter>`,
    `<filter id="smoke" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>`,
    `<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7"/><feColorMatrix type="saturate" values="0"/></filter>`,
  ];
  const body = [
    `<rect x="-40" y="-40" width="${W + 80}" height="${H + 80}" fill="url(#sky)"/>`,
  ];

  const stars = [];
  for (let i = 0; i < 240; i++) {
    const r = 0.7 + rand() ** 3 * 2.2;
    stars.push(
      `<circle cx="${f(rand() * W)}" cy="${f(rand() * rand() * 1000)}" r="${f(r)}" opacity="${(0.25 + rand() * 0.7).toFixed(2)}"/>`,
    );
  }
  body.push(
    `<g fill="#ffffff">${stars.join("")}</g>`,
    `<circle cx="${MOON[0]}" cy="${MOON[1]}" r="560" fill="url(#moonGlow)"/>`,
    `<circle cx="${MOON[0]}" cy="${MOON[1]}" r="64" fill="#fbf5df"/>`,
    `<circle cx="${MOON[0] - 18}" cy="${MOON[1] - 14}" r="13" fill="#ece3c4" opacity="0.7"/>`,
    `<circle cx="${MOON[0] + 22}" cy="${MOON[1] + 16}" r="9" fill="#ece3c4" opacity="0.6"/>`,
  );

  const range = mountainCrest(rand, {
    base: 950,
    height: 110,
    roughness: 0.58,
    peaks: RANGE_PEAKS,
  });
  body.push(
    `<path d="${fillBelow(range)}" fill="url(#range)"/>`,
    `<rect x="-40" y="860" width="${W + 80}" height="220" fill="url(#mist)"/>`,
  );

  HILLS.forEach((hill, i) => {
    const crest = sineCrest(hill.crest);
    const { base, amp } = hill.crest;
    defs.push(
      `<linearGradient id="hill${i}" gradientUnits="userSpaceOnUse" x1="0" y1="${base - amp * 1.5}" x2="0" y2="${base + 260}"><stop offset="0" stop-color="${hill.top}"/><stop offset="1" stop-color="${hill.bottom}"/></linearGradient>`,
    );
    body.push(
      `<path d="${fillBelow(crest)}" fill="url(#hill${i})"/>`,
      `<path d="${linePath(crest)}" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="2"/>`,
    );
    if (hill.cabin) body.push(...cabin(CABIN_X, yAt(crest, CABIN_X) + 14));

    const [count, minH, maxH] = hill.pines;
    const trees = [];
    for (let n = 0; n < count; n++) {
      // Keep the cabin and the slope in front of it clear.
      let x = rand() * W;
      if (i >= 2 && Math.abs(x - CABIN_X) < 200) x += 400;
      const h = minH + rand() * (maxH - minH);
      trees.push({ x, y: yAt(crest, x) + 6 + rand() * 30, h });
    }
    trees.sort((a, b) => a.y - b.y);
    body.push(
      `<g fill="${hill.pine}">${trees.map((t) => `<path d="${pine(t.x, t.y, t.h)}"/>`).join("")}</g>`,
    );
  });

  const flakes = [];
  const bigFlakes = [];
  for (let i = 0; i < 320; i++) {
    flakes.push(
      `<circle cx="${f(rand() * W)}" cy="${f(rand() * H)}" r="${f(1 + rand() * 1.8)}" opacity="${(0.45 + rand() * 0.45).toFixed(2)}"/>`,
    );
  }
  for (let i = 0; i < 70; i++) {
    bigFlakes.push(
      `<circle cx="${f(rand() * W)}" cy="${f(rand() * H)}" r="${f(3 + rand() * 3.5)}" opacity="${(0.5 + rand() * 0.4).toFixed(2)}"/>`,
    );
  }
  body.push(
    `<g fill="#ffffff">${flakes.join("")}</g>`,
    `<g fill="#ffffff" filter="url(#soft)">${bigFlakes.join("")}</g>`,
    `<rect x="0" y="0" width="${W}" height="${H}" filter="url(#grain)" opacity="0.06"/>`,
  );
  return { defs, body };
}

const { defs, body } = scene();
for (const output of OUTPUTS) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${output.w}" height="${output.h}" viewBox="${output.viewBox}">
<defs>
  ${defs.join("\n  ")}
</defs>
${body.join("\n")}
</svg>`;
  const jpeg = await sharp(Buffer.from(svg))
    .jpeg({ quality: 84, mozjpeg: true, progressive: true })
    .toBuffer();
  writeFileSync(new URL(output.file, OUT_DIR), jpeg);
  console.log(`${output.file} ${Math.round(jpeg.length / 1024)}KB`);
}
