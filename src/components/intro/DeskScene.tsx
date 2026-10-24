"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { DESK, deskBox, RUG } from "./scenery";

// Units are vw with the origin at the laptop screen's bottom-left corner, so
// the desk lines up with LaptopFrame at any aspect. 1 cm ≈ 3.3 units (the
// laptop's screen is ~30 cm wide), and the props are drawn at that scale.

const DESK_FACE = 6;

// Coffee mug at the back left, ~7 cm across and 7.5 cm tall: base centre,
// radius, height, and the half-height of its rim ellipse seen from above.
const MUG = { x: -38, y: 2, r: 11.5, h: 23, ry: 3.7 };
const MUG_TOP = MUG.y - MUG.h;

// Notebooks stacked on the right: a navy A5 notebook under a tan leather
// pocket journal, with a soft shadow beneath both.
const NOTEBOOK = deskBox({
  x0: 116,
  x1: 184,
  back: -8,
  front: 13,
  height: 4.5,
});
const JOURNAL = deskBox({
  x0: 124,
  x1: 178,
  back: -5,
  front: 11,
  base: 4.5,
  height: 3.4,
});
const STACK_SHADOW = deskBox({
  x0: 113,
  x1: 189,
  back: -6,
  front: 16,
  height: 0,
});
const RIBBON_X = NOTEBOOK.at(146, 13);

// Fountain pens, drawn lying along −x from their end cap and placed by a
// transform: an uncapped black pen showing its gold nib, and a capped red one.
// They lie as a right-handed writer sets a pen down, nib pointing away and to
// the left.
const PEN_BARREL =
  "M-2.2,-2.1 H-33 L-35,-1.7 V1.7 L-33,2.1 H-2.2 Q0,2.1 0,0 Q0,-2.1 -2.2,-2.1 Z";
const PEN_OUTLINE = `${PEN_BARREL} M-35,-1.7 L-48,0 L-35,1.7 Z`;
const CAPPED_BODY =
  "M-2.2,-2.2 H-41.8 Q-44,-2.2 -44,0 Q-44,2.2 -41.8,2.2 H-2.2 Q0,2.2 0,0 Q0,-2.2 -2.2,-2.2 Z";

function FountainPen({ transform }: { transform: string }) {
  return (
    <g transform={transform}>
      <path
        d={PEN_OUTLINE}
        transform="translate(0.8 1.8)"
        className="fill-(--scene-shadow)"
      />
      <path d={PEN_BARREL} className="fill-(--scene-soot)" />
      <rect
        x="-32.6"
        y="-1.5"
        width="30"
        height="0.5"
        rx="0.25"
        className="fill-(--scene-ceramic)/35"
      />
      <rect
        x="-34.6"
        y="-1.9"
        width="1.6"
        height="3.8"
        className="fill-(--scene-brass)"
      />
      <path
        d="M-35,-1.7 L-40.5,-1.35 V1.35 L-35,1.7 Z"
        className="fill-(--scene-soot)"
      />
      <path
        d="M-40.3,-1.55 L-48,0 L-40.3,1.55 Z"
        className="fill-(--scene-brass)"
      />
      <path
        d="M-43.6,0 L-47.4,0"
        strokeWidth="0.22"
        className="stroke-(--scene-soot)"
      />
      <circle cx="-43.2" cy="0" r="0.32" className="fill-(--scene-soot)" />
    </g>
  );
}

function CappedPen({ transform }: { transform: string }) {
  return (
    <g transform={transform}>
      <path
        d={CAPPED_BODY}
        transform="translate(0.8 1.8)"
        className="fill-(--scene-shadow)"
      />
      <path d={CAPPED_BODY} className="fill-(--scene-book-red)" />
      <rect
        x="-41.6"
        y="-1.6"
        width="39"
        height="0.5"
        rx="0.25"
        className="fill-(--scene-ceramic)/35"
      />
      <rect
        x="-26.6"
        y="-2.2"
        width="1.6"
        height="4.4"
        className="fill-(--scene-brass)"
      />
      <rect
        x="-41.5"
        y="-3"
        width="12.5"
        height="1.1"
        rx="0.55"
        className="fill-(--scene-brass)"
      />
      <circle cx="-29.4" cy="-2.45" r="0.75" className="fill-(--scene-brass)" />
    </g>
  );
}

export default function DeskScene() {
  const id = useId();

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      className="pointer-events-none absolute top-full left-0 h-[100vw] w-full overflow-visible"
    >
      <defs>
        <linearGradient id={`${id}-ceramic`} x1="0" y1="0" x2="1" y2="0">
          <stop
            offset="0"
            className="[stop-color:var(--scene-ceramic-shade)]"
          />
          <stop offset="0.4" className="[stop-color:var(--scene-ceramic)]" />
          <stop
            offset="1"
            className="[stop-color:var(--scene-ceramic-shade)]"
          />
        </linearGradient>
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
      <rect
        x="-300"
        y="20"
        width="700"
        height="200"
        fill={`url(#${id}-rug-shade)`}
      />
      <rect
        x="-400"
        y={DESK.frontY + DESK_FACE}
        width="900"
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

      {/* Coffee mug */}
      <ellipse
        cx={MUG.x + 2}
        cy={MUG.y + 1}
        rx={MUG.r + 5}
        ry={MUG.ry + 1.4}
        className="fill-(--scene-shadow)"
      />
      <path
        d={`M${MUG.x + MUG.r - 1.5},${MUG_TOP + 5} C${MUG.x + MUG.r + 9},${MUG_TOP + 3.5} ${MUG.x + MUG.r + 9.5},${MUG_TOP + 17} ${MUG.x + MUG.r - 1.5},${MUG_TOP + 16}`}
        fill="none"
        strokeWidth="3.2"
        strokeLinecap="round"
        className="stroke-(--scene-ceramic-shade)"
      />
      <path
        d={`M${MUG.x - MUG.r},${MUG_TOP} V${MUG.y} A${MUG.r},${MUG.ry} 0 0 0 ${MUG.x + MUG.r},${MUG.y} V${MUG_TOP} Z`}
        fill={`url(#${id}-ceramic)`}
      />
      <path
        d={`M${MUG.x - MUG.r},${MUG_TOP + 8} A${MUG.r},${MUG.ry} 0 0 0 ${MUG.x + MUG.r},${MUG_TOP + 8} V${MUG_TOP + 11.5} A${MUG.r},${MUG.ry} 0 0 1 ${MUG.x - MUG.r},${MUG_TOP + 11.5} Z`}
        className="fill-(--scene-book-red)"
      />
      <ellipse
        cx={MUG.x}
        cy={MUG_TOP}
        rx={MUG.r}
        ry={MUG.ry}
        className="fill-(--scene-ceramic)"
      />
      <ellipse
        cx={MUG.x}
        cy={MUG_TOP + 0.2}
        rx={MUG.r - 1}
        ry={MUG.ry - 0.5}
        className="fill-(--scene-ceramic-shade)"
      />
      <ellipse
        cx={MUG.x}
        cy={MUG_TOP + 0.9}
        rx={MUG.r - 1.8}
        ry={MUG.ry - 1.1}
        className="fill-(--scene-coffee)"
      />
      {[MUG.x - 3.5, MUG.x + 3].map((x, i) => (
        <motion.path
          key={x}
          d={`M${x},${MUG_TOP - 4} c-3.2,-4.8 3.2,-8 0,-12.8 c-3.2,-4.8 3.2,-8 0,-12.8`}
          fill="none"
          strokeWidth="1.3"
          strokeLinecap="round"
          className="stroke-(--scene-steam)"
          animate={{ opacity: [0, 1, 0], y: [1.6, -4.8] }}
          transition={{
            duration: 3.2,
            delay: i * 1.4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Notebooks and fountain pens */}
      <path d={STACK_SHADOW.top} className="fill-(--scene-shadow)" />
      <path d={NOTEBOOK.side} className="fill-(--scene-book-navy)" />
      <path d={NOTEBOOK.side} className="fill-(--scene-soot)/35" />
      <path d={NOTEBOOK.top} className="fill-(--scene-book-navy)" />
      <path d={NOTEBOOK.face} className="fill-(--scene-book-navy)" />
      <path d={NOTEBOOK.pages(0.8)} className="fill-(--scene-ceramic)" />
      <path
        d={`M${RIBBON_X},${NOTEBOOK.frontTop + 1} h1.6 V17.5 l-0.8,-0.9 l-0.8,0.9 Z`}
        className="fill-(--scene-book-mustard)"
      />
      <path d={JOURNAL.side} className="fill-(--scene-wood-face)" />
      <path d={JOURNAL.side} className="fill-(--scene-soot)/30" />
      <path d={JOURNAL.top} className="fill-(--scene-wood-face)" />
      <path d={JOURNAL.face} className="fill-(--scene-wood-face)" />
      <path d={JOURNAL.pages(0.6)} className="fill-(--scene-ceramic)" />
      <path d={JOURNAL.strap(168, 1.4)} className="fill-(--scene-soot)" />
      <FountainPen transform="translate(174 0) rotate(10)" />
      <CappedPen transform="translate(154 27) rotate(8)" />
    </svg>
  );
}
