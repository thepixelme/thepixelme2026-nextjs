"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { mulberry32 } from "./random";

// Units are vw with the origin at the laptop screen's bottom-left corner, so
// the desk lines up with LaptopFrame (base bottom at y = 3.25) at any aspect.

const meadowY = (x: number) =>
  16 + 0.0006 * (x - 50) ** 2 + 1.2 * Math.sin(x / 23);
const foregroundY = (x: number) =>
  50 + 9 * Math.sin(x / 55 + 1) + 0.00025 * (x - 50) ** 2;

function hillPath(crest: (x: number) => number) {
  let d = "M-450,400";
  for (let x = -450; x <= 550; x += 10) d += ` L${x},${crest(x).toFixed(2)}`;
  return `${d} L550,400 Z`;
}

const MEADOW = hillPath(meadowY);
const FOREGROUND = hillPath(foregroundY);

// Grass tufts and wildflowers, growing with distance below the crest so the
// meadow reads as receding.
function meadowDetail() {
  const rand = mulberry32(5);
  let tufts = "";
  const flowers: { x: number; y: number; r: number; tone: number }[] = [];
  for (let i = 0; i < 90; i += 1) {
    const x = -180 + rand() * 420;
    const y = meadowY(x) + 2 + rand() * 60;
    const s = 0.6 + (y - meadowY(x)) * 0.03;
    tufts += `M${x.toFixed(1)},${y.toFixed(1)} l${(-0.7 * s).toFixed(2)},${(-2 * s).toFixed(2)} M${x.toFixed(1)},${y.toFixed(1)} l0,${(-2.5 * s).toFixed(2)} M${x.toFixed(1)},${y.toFixed(1)} l${(0.7 * s).toFixed(2)},${(-2 * s).toFixed(2)} `;
    if (i % 3 === 0) {
      flowers.push({
        x: x + 2,
        y: y - 0.5,
        r: 0.35 * s,
        tone: Math.floor(rand() * 3),
      });
    }
  }
  return { tufts, flowers };
}

const DETAIL = meadowDetail();
const FLOWER_TONES = [
  "fill-(--scene-ceramic)",
  "fill-(--scene-book-mustard)",
  "fill-(--scene-book-red)",
];

const LEAVES = [
  { base: -44, width: 2.2, tipX: -53, tipY: -50, dark: true },
  { base: -43, width: 2, tipX: -59, tipY: -36, dark: false },
  { base: -41.5, width: 2.6, tipX: -46, tipY: -62, dark: false },
  { base: -39.5, width: 2.8, tipX: -39, tipY: -68, dark: true },
  { base: -38, width: 2.2, tipX: -35, tipY: -48, dark: false },
  { base: -37, width: 2.4, tipX: -30, tipY: -57, dark: false },
  { base: -35.5, width: 2, tipX: -24, tipY: -42, dark: true },
];

function leafPath({ base, width, tipX, tipY }: (typeof LEAVES)[number]) {
  const midX = (base + tipX) / 2;
  const midY = (tipY - 14) / 2;
  return `M${base - width},-14 Q${midX - width},${midY} ${tipX},${tipY} Q${midX + width},${midY} ${base + width},-14 Z`;
}

const BOOKS = [
  { x: 116, y: -2.5, w: 38, h: 6.5, color: "fill-(--scene-book-navy)" },
  { x: 118.5, y: -7.5, w: 34, h: 5, color: "fill-(--scene-book-mustard)" },
  { x: 115.5, y: -13, w: 36, h: 5.5, color: "fill-(--scene-book-red)" },
];

export default function DeskScene() {
  const id = useId();

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      className="pointer-events-none absolute top-full left-0 h-[100vw] w-full overflow-visible"
    >
      <defs>
        <linearGradient
          id={`${id}-meadow`}
          x1="0"
          y1="12"
          x2="0"
          y2="110"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" className="[stop-color:var(--scene-meadow-far)]" />
          <stop offset="1" className="[stop-color:var(--scene-meadow-near)]" />
        </linearGradient>
      </defs>

      <path d={MEADOW} fill={`url(#${id}-meadow)`} />
      <path
        d={DETAIL.tufts}
        fill="none"
        strokeWidth="0.25"
        strokeLinecap="round"
        className="stroke-(--scene-meadow-near)"
      />
      {DETAIL.flowers.map((flower) => (
        <circle
          key={`${flower.x}-${flower.y}`}
          cx={flower.x}
          cy={flower.y}
          r={flower.r}
          className={FLOWER_TONES[flower.tone]}
        />
      ))}

      {/* Desk: back legs, top surface, front face, front legs */}
      <rect
        x="-58"
        y="3"
        width="2.6"
        height="140"
        className="fill-(--scene-desk-leg)"
      />
      <rect
        x="155.4"
        y="3"
        width="2.6"
        height="140"
        className="fill-(--scene-desk-leg)"
      />
      <path
        d="M-60,1.5 L160,1.5 L166,5 L-66,5 Z"
        className="fill-(--scene-wood-top)"
      />
      <rect
        x="-66"
        y="5"
        width="232"
        height="2.6"
        rx="0.4"
        className="fill-(--scene-wood-face)"
      />
      <rect
        x="-64"
        y="7.6"
        width="228"
        height="0.9"
        className="fill-(--scene-shadow)"
      />
      <rect
        x="-64"
        y="7.6"
        width="3"
        height="150"
        className="fill-(--scene-desk-leg)"
      />
      <rect
        x="161"
        y="7.6"
        width="3"
        height="150"
        className="fill-(--scene-desk-leg)"
      />

      <path d={FOREGROUND} className="fill-(--scene-meadow-near)" />

      {/* Snake plant */}
      <ellipse
        cx="-43"
        cy="4.3"
        rx="11"
        ry="1.1"
        className="fill-(--scene-shadow)"
      />
      {LEAVES.map((leaf) => (
        <path
          key={`${leaf.base}-${leaf.tipX}`}
          d={leafPath(leaf)}
          strokeWidth="0.35"
          className={`stroke-(--scene-leaf-edge) ${leaf.dark ? "fill-(--scene-leaf-dark)" : "fill-(--scene-leaf)"}`}
        />
      ))}
      <path
        d="M-49,-13.5 L-31,-13.5 L-33.5,3 Q-33.8,4.2 -35,4.2 L-45,4.2 Q-46.2,4.2 -46.5,3 Z"
        className="fill-(--scene-ceramic)"
      />
      <rect
        x="-50"
        y="-16"
        width="20"
        height="2.8"
        rx="0.6"
        className="fill-(--scene-ceramic)"
      />
      <rect
        x="-49"
        y="-13.2"
        width="18"
        height="0.6"
        className="fill-(--scene-ceramic-shade)"
      />

      {/* Books with a mug on top */}
      <ellipse
        cx="133"
        cy="4.2"
        rx="22"
        ry="1.2"
        className="fill-(--scene-shadow)"
      />
      {BOOKS.map((book) => (
        <g key={book.y}>
          <rect
            x={book.x}
            y={book.y}
            width={book.w}
            height={book.h}
            rx="0.5"
            className={book.color}
          />
          <rect
            x={book.x + 3}
            y={book.y}
            width="0.6"
            height={book.h}
            className="fill-(--scene-ceramic)/50"
          />
          <rect
            x={book.x + book.w - 3.6}
            y={book.y}
            width="0.6"
            height={book.h}
            className="fill-(--scene-ceramic)/50"
          />
          <rect
            x={book.x + book.w / 2 - 6}
            y={book.y + book.h / 2 - 0.5}
            width="12"
            height="1"
            rx="0.3"
            className="fill-(--scene-ceramic)/70"
          />
        </g>
      ))}
      <ellipse
        cx="131"
        cy="-13"
        rx="8"
        ry="0.6"
        className="fill-(--scene-shadow)"
      />
      <path
        d="M138,-25 a4.2,4.2 0 1 1 0,8.4"
        fill="none"
        strokeWidth="2.2"
        className="stroke-(--scene-ceramic-shade)"
      />
      <rect
        x="124"
        y="-28"
        width="14"
        height="15"
        rx="1.8"
        className="fill-(--scene-ceramic)"
      />
      <rect
        x="124"
        y="-22"
        width="14"
        height="2.4"
        className="fill-(--scene-book-red)"
      />
      <ellipse
        cx="131"
        cy="-28"
        rx="6.6"
        ry="0.9"
        className="fill-(--scene-wood-face)"
      />
      {[127.5, 132.5].map((x, i) => (
        <motion.path
          key={x}
          d={`M${x},-31 c-2,-3 2,-5 0,-8 c-2,-3 2,-5 0,-8`}
          fill="none"
          strokeWidth="0.8"
          strokeLinecap="round"
          className="stroke-(--scene-steam)"
          animate={{ opacity: [0, 1, 0], y: [1, -3] }}
          transition={{
            duration: 3.2,
            delay: i * 1.4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      ))}
    </svg>
  );
}
