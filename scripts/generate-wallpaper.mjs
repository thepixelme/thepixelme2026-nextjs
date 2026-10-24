// Generates the "flow" desktop wallpaper (public/wallpapers/flow-*.jpg):
// layered gradient waves drawn as SVG, rasterised to JPEG with sharp.
// Run with `npm run wallpaper` after changing the waves or palette below.
import { writeFileSync } from "node:fs";
import sharp from "sharp";

const OUT_DIR = new URL("../public/wallpapers/", import.meta.url);
const W = 2560;
const H = 1600;

const WAVES = [
  {
    base: 560,
    amp: 110,
    f1: 0.8,
    p1: 0.4,
    f2: 1.9,
    p2: 1.2,
    tilt: -300,
    stops: ["#7d8bff", "#a57bff", "#e27cf2"],
  },
  {
    base: 820,
    amp: 135,
    f1: 0.7,
    p1: 2.1,
    f2: 1.6,
    p2: 0.3,
    tilt: -240,
    stops: ["#8c63ff", "#c95fe0", "#ff6fae"],
  },
  {
    base: 1060,
    amp: 120,
    f1: 0.9,
    p1: 4.0,
    f2: 2.1,
    p2: 2.6,
    tilt: -190,
    stops: ["#ff6c9a", "#ff7f86", "#ffa06a"],
  },
  {
    base: 1270,
    amp: 100,
    f1: 0.6,
    p1: 1.3,
    f2: 1.7,
    p2: 4.1,
    tilt: -140,
    stops: ["#ff8a58", "#ffab5c", "#ffcd70"],
  },
  {
    base: 1460,
    amp: 70,
    f1: 0.75,
    p1: 3.2,
    f2: 2.3,
    p2: 0.9,
    tilt: -90,
    stops: ["#3f2aa6", "#5a36c9", "#7c48e3"],
  },
];

const OUTPUTS = [
  { file: "flow-2560x1600.jpg", viewBox: `0 0 ${W} ${H}`, w: 2560, h: 1600 },
  // Centre crop for portrait screens (mobile shell).
  { file: "flow-768x1280.jpg", viewBox: "820 0 960 1600", w: 768, h: 1280 },
];

function waveCrest({ base, amp, f1, p1, f2, p2, tilt }) {
  const points = [];
  for (let x = -40; x <= W + 40; x += 16) {
    const t = x / W;
    const y =
      base +
      amp * Math.sin(2 * Math.PI * f1 * t + p1) +
      0.45 * amp * Math.sin(2 * Math.PI * f2 * t + p2) +
      tilt * (t - 0.5);
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `M${points.join(" L")}`;
}

function svg({ viewBox, w, h }) {
  const gradients = [];
  const layers = [];
  WAVES.forEach((wave, i) => {
    const crest = waveCrest(wave);
    const fill = `${crest} L${W + 40},${H + 40} L-40,${H + 40} Z`;
    const [from, via, to] = wave.stops;
    gradients.push(
      `<linearGradient id="w${i}" x1="0" y1="0" x2="1" y2="0.35"><stop offset="0" stop-color="${from}"/><stop offset="0.55" stop-color="${via}"/><stop offset="1" stop-color="${to}"/></linearGradient>`,
    );
    layers.push(
      `<path d="${fill}" fill="#1a0b4a" opacity="0.32" filter="url(#shadow)" transform="translate(0,-22)"/>`,
      `<path d="${fill}" fill="url(#w${i})"/>`,
      `<path d="${crest}" fill="none" stroke="#ffffff" stroke-opacity="0.35" stroke-width="2.5"/>`,
    );
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${viewBox}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#a8c5ff"/><stop offset="0.5" stop-color="#b9a7ff"/><stop offset="1" stop-color="#ffb2cf"/>
  </linearGradient>
  <radialGradient id="glow" cx="0.72" cy="0.18" r="0.5">
    <stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
  </radialGradient>
  <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%"><feGaussianBlur stdDeviation="26"/></filter>
  <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7"/><feColorMatrix type="saturate" values="0"/></filter>
  ${gradients.join("\n  ")}
</defs>
<rect x="-40" y="-40" width="${W + 80}" height="${H + 80}" fill="url(#bg)"/>
<rect x="-40" y="-40" width="${W + 80}" height="${H + 80}" fill="url(#glow)"/>
${layers.join("\n")}
<rect x="0" y="0" width="${W}" height="${H}" filter="url(#grain)" opacity="0.06"/>
</svg>`;
}

for (const output of OUTPUTS) {
  const jpeg = await sharp(Buffer.from(svg(output)))
    .jpeg({ quality: 84, mozjpeg: true, progressive: true })
    .toBuffer();
  writeFileSync(new URL(output.file, OUT_DIR), jpeg);
  console.log(`${output.file} ${Math.round(jpeg.length / 1024)}KB`);
}
