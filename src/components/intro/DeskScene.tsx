"use client";

import { motion } from "motion/react";
import { useId } from "react";
import Flame from "./Flame";
import { DESK, RUG } from "./scenery";

// Units are vw with the origin at the laptop screen's bottom-left corner, so
// the desk lines up with LaptopFrame at any aspect. 1 cm ≈ 3.3 units (the
// laptop's screen is ~30 cm wide); the books and mug are drawn small and
// scaled up to real size by their group transform.

const DESK_FACE = 6;

// Pillar candles on a brass tray, about the tray's centre, back to front:
// ~4–5 cm across and 15, 10 and 6 cm tall.
const CANDLES = [
  { x: -8, y: -1.5, w: 14, h: 44, delay: 0 },
  { x: 9, y: -0.5, w: 15, h: 30, delay: 0.5 },
  { x: 0.5, y: 3, w: 13, h: 17, delay: 0.9 },
];

function Candle({
  x,
  y,
  w,
  h,
  delay,
  wax,
  halo,
}: (typeof CANDLES)[number] & { wax: string; halo: string }) {
  const r = w / 2;
  const ry = Math.round(r * 30) / 100;
  const top = y - h;
  return (
    <g>
      <path
        d={`M${x - r},${top} V${y} A${r},${ry} 0 0 0 ${x + r},${y} V${top} Z`}
        fill={wax}
      />
      <ellipse
        cx={x}
        cy={top}
        rx={r}
        ry={ry}
        className="fill-(--scene-wax-shade)"
      />
      <ellipse
        cx={x}
        cy={top + 0.3}
        rx={r * 0.75}
        ry={ry * 0.65}
        className="fill-(--scene-wax)"
      />
      <path
        d={`M${x},${top} l0.3,-2.6`}
        strokeWidth="0.7"
        strokeLinecap="round"
        className="stroke-(--scene-soot)"
      />
      <motion.circle
        cx={x + 0.3}
        cy={top - 6.5}
        r="14"
        fill={halo}
        animate={{ opacity: [0.6, 1] }}
        transition={{
          duration: 1.3,
          delay,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
      />
      <Flame x={x + 0.3} y={top - 2.2} height={9} candle delay={delay} />
    </g>
  );
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
        <linearGradient id={`${id}-wax`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" className="[stop-color:var(--scene-wax-shade)]" />
          <stop offset="0.4" className="[stop-color:var(--scene-wax)]" />
          <stop offset="1" className="[stop-color:var(--scene-wax-shade)]" />
        </linearGradient>
        <radialGradient id={`${id}-halo`}>
          <stop
            offset="0"
            stopOpacity="0.5"
            className="[stop-color:var(--scene-firelight)]"
          />
          <stop
            offset="1"
            stopOpacity="0"
            className="[stop-color:var(--scene-firelight)]"
          />
        </radialGradient>
        <radialGradient
          id={`${id}-rug-shade`}
          cx="50"
          cy="40"
          r="280"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0.3"
            stopOpacity="0"
            className="[stop-color:var(--scene-rug-dark)]"
          />
          <stop
            offset="1"
            stopOpacity="0.75"
            className="[stop-color:var(--scene-rug-dark)]"
          />
        </radialGradient>
        <linearGradient
          id={`${id}-under`}
          x1="0"
          y1={DESK.frontY + DESK_FACE}
          x2="0"
          y2={DESK.frontY + DESK_FACE + 50}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" className="[stop-color:var(--scene-shadow)]" />
          <stop
            offset="1"
            stopOpacity="0"
            className="[stop-color:var(--scene-shadow)]"
          />
        </linearGradient>
      </defs>

      {/* Rug */}
      <path
        d={RUG.fringe}
        fill="none"
        strokeWidth="0.8"
        strokeLinecap="round"
        className="stroke-(--scene-rug-light)"
      />
      <path d={RUG.field} className="fill-(--scene-rug)" />
      <path d={RUG.border} className="fill-(--scene-rug-light)" />
      <path d={RUG.lines} className="fill-(--scene-rug-dark)" />
      <path d={RUG.diamonds} className="fill-(--scene-rug-dark)/70" />
      <path d={RUG.cores} className="fill-(--scene-rug-light)/80" />
      <rect
        x="-300"
        y="20"
        width="700"
        height="200"
        fill={`url(#${id}-rug-shade)`}
      />
      <rect
        x={DESK.left - 10}
        y={DESK.frontY + DESK_FACE}
        width={DESK.width + 20}
        height="50"
        fill={`url(#${id}-under)`}
      />

      {/* Desk: back legs, top surface, front face, front legs */}
      {DESK.backLegs.map((x) => (
        <rect
          key={x}
          x={x}
          y={DESK.backY + 2}
          width="4"
          height="200"
          className="fill-(--scene-desk-leg)"
        />
      ))}
      <path d={DESK.top} className="fill-(--scene-wood-top)" />
      <path
        d={DESK.grain}
        fill="none"
        strokeWidth="0.25"
        strokeLinecap="round"
        className="stroke-(--scene-wood-face)/25"
      />
      <rect
        x={DESK.left}
        y={DESK.frontY}
        width={DESK.width}
        height={DESK_FACE}
        rx="0.6"
        className="fill-(--scene-wood-face)"
      />
      <rect
        x={DESK.left + 3}
        y={DESK.frontY + DESK_FACE}
        width={DESK.width - 6}
        height="1.5"
        className="fill-(--scene-shadow)"
      />
      {DESK.frontLegs.map((x) => (
        <rect
          key={x}
          x={x}
          y={DESK.frontY + DESK_FACE}
          width="5"
          height="150"
          className="fill-(--scene-desk-leg)"
        />
      ))}

      {/* Candles on a brass tray */}
      <g transform="translate(-34 -2)">
        <ellipse
          cx="0"
          cy="4.6"
          rx="28"
          ry="6.4"
          className="fill-(--scene-shadow)"
        />
        <ellipse
          cx="0"
          cy="3.4"
          rx="26"
          ry="6"
          className="fill-(--scene-brass-shade)"
        />
        <ellipse
          cx="0"
          cy="2.2"
          rx="26"
          ry="6"
          className="fill-(--scene-brass)"
        />
        <ellipse
          cx="0"
          cy="2.4"
          rx="23"
          ry="4.8"
          className="fill-(--scene-brass-shade)/60"
        />
        {CANDLES.map((candle) => (
          <Candle
            key={candle.x}
            {...candle}
            wax={`url(#${id}-wax)`}
            halo={`url(#${id}-halo)`}
          />
        ))}
      </g>

      {/* Books with a mug on top */}
      <g transform="translate(150 16) scale(1.6) translate(-135 -4.1)">
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
      </g>
    </svg>
  );
}
