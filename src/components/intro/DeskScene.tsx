"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { DESK, deskBox, RUG } from "./scenery";

// Desk units are vw with the origin at the laptop screen's bottom-left
// corner, so the desk lines up with LaptopFrame at any aspect. 1 cm ≈ 3.3
// units (the laptop's screen is ~30 cm wide), and the props are drawn at that
// scale. A phone or tablet screen is narrower, so DeskIntro magnifies this
// svg by --intro-desk-scale about the screen's bottom centre (keeping the
// desk the same size in the room) and lowers it by --intro-desk-lift, the
// height of the device's stand.

const DESK_FACE = 6;

// Coffee mug, ~6.5 cm across and 7 cm tall, handle on its left: radius,
// height, and the half-height of its rim ellipse seen from above. It sits at
// the back left of the laptop, and closer in beside a phone.
const MUG = { y: 2, r: 10.5, h: 21, ry: 3.4 };
const MUG_TOP = MUG.y - MUG.h;
const MUG_X = { laptop: -34, phone: 22 };

// Notebooks stacked on the right: a navy notebook (~16 × 12 cm) under a
// tan leather pocket journal (~13 × 9 cm), with a soft shadow beneath both.
// Beside a phone the stack moves `dx` units closer in.
function notebookStack(dx: number) {
  const notebook = deskBox({
    x0: 114 + dx,
    x1: 168 + dx,
    back: -6,
    front: 11,
    height: 3.8,
  });
  return {
    dx,
    notebook,
    journal: deskBox({
      x0: 120 + dx,
      x1: 162 + dx,
      back: -4,
      front: 9,
      base: 3.8,
      height: 3,
    }),
    shadow: deskBox({
      x0: 111 + dx,
      x1: 172 + dx,
      back: -4,
      front: 14,
      height: 0,
    }),
    ribbonX: notebook.at(136 + dx, 11),
  };
}
const STACKS = { laptop: notebookStack(0), phone: notebookStack(-46) };
// The pens are ~11.5 cm long.
const PEN_SCALE = 0.8;

// Stands for the phone (~9 × 6.5 cm base) and tablet (~14 × 8 cm): an
// aluminium base plate on the desk, centred under the screen, and a neck
// that rises behind the device; DeviceFrame draws the ledge the device rests
// on, so the neck's top is always hidden whatever the lift.
const STANDS = {
  phone: {
    base: deskBox({ x0: 35, x1: 65, back: -2, front: 7, height: 1.6 }),
    shadow: deskBox({ x0: 33, x1: 67, back: -1, front: 9, height: 0 }),
    neck: { x: 47.5, w: 5 },
  },
  tablet: {
    base: deskBox({ x0: 27, x1: 73, back: -3, front: 8, height: 2 }),
    shadow: deskBox({ x0: 25, x1: 75, back: -2, front: 10, height: 0 }),
    neck: { x: 45.5, w: 9 },
  },
};

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

function Mug({ x, ceramic }: { x: number; ceramic: string }) {
  return (
    <>
      <ellipse
        cx={x + 2}
        cy={MUG.y + 1}
        rx={MUG.r + 5}
        ry={MUG.ry + 1.4}
        className="fill-(--scene-shadow)"
      />
      <path
        d={`M${x - MUG.r + 1.5},${MUG_TOP + 4.5} C${x - MUG.r - 8.2},${MUG_TOP + 3.2} ${x - MUG.r - 8.6},${MUG_TOP + 15.5} ${x - MUG.r + 1.5},${MUG_TOP + 14.5}`}
        fill="none"
        strokeWidth="3.2"
        strokeLinecap="round"
        className="stroke-(--scene-ceramic-shade)"
      />
      <path
        d={`M${x - MUG.r},${MUG_TOP} V${MUG.y} A${MUG.r},${MUG.ry} 0 0 0 ${x + MUG.r},${MUG.y} V${MUG_TOP} Z`}
        fill={ceramic}
      />
      <path
        d={`M${x - MUG.r},${MUG_TOP + 7.3} A${MUG.r},${MUG.ry} 0 0 0 ${x + MUG.r},${MUG_TOP + 7.3} V${MUG_TOP + 10.5} A${MUG.r},${MUG.ry} 0 0 1 ${x - MUG.r},${MUG_TOP + 10.5} Z`}
        className="fill-(--scene-book-red)"
      />
      <ellipse
        cx={x}
        cy={MUG_TOP}
        rx={MUG.r}
        ry={MUG.ry}
        className="fill-(--scene-ceramic)"
      />
      <ellipse
        cx={x}
        cy={MUG_TOP + 0.2}
        rx={MUG.r - 1}
        ry={MUG.ry - 0.5}
        className="fill-(--scene-ceramic-shade)"
      />
      <ellipse
        cx={x}
        cy={MUG_TOP + 0.9}
        rx={MUG.r - 1.8}
        ry={MUG.ry - 1.1}
        className="fill-(--scene-coffee)"
      />
      {[x - 3.5, x + 3].map((sx, i) => (
        <motion.path
          key={sx}
          d={`M${sx},${MUG_TOP - 4} c-3.2,-4.8 3.2,-8 0,-12.8 c-3.2,-4.8 3.2,-8 0,-12.8`}
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
    </>
  );
}

function NotebookStack({
  stack: { dx, notebook, journal, shadow, ribbonX },
}: {
  stack: ReturnType<typeof notebookStack>;
}) {
  return (
    <>
      <path d={shadow.top} className="fill-(--scene-shadow)" />
      <path d={notebook.side} className="fill-(--scene-book-navy)" />
      <path d={notebook.side} className="fill-(--scene-soot)/35" />
      <path d={notebook.top} className="fill-(--scene-book-navy)" />
      <path d={notebook.face} className="fill-(--scene-book-navy)" />
      <path d={notebook.pages(0.8)} className="fill-(--scene-ceramic)" />
      <path
        d={`M${ribbonX},${notebook.frontTop + 1} h1.4 V15.5 l-0.7,-0.8 l-0.7,0.8 Z`}
        className="fill-(--scene-book-mustard)"
      />
      <path d={journal.side} className="fill-(--scene-wood-face)" />
      <path d={journal.side} className="fill-(--scene-soot)/30" />
      <path d={journal.top} className="fill-(--scene-wood-face)" />
      <path d={journal.face} className="fill-(--scene-wood-face)" />
      <path d={journal.pages(0.6)} className="fill-(--scene-ceramic)" />
      <path d={journal.strap(154 + dx, 1.2)} className="fill-(--scene-soot)" />
      <FountainPen
        transform={`translate(${160 + dx} 0) rotate(10) scale(${PEN_SCALE})`}
      />
      <CappedPen
        transform={`translate(${150 + dx} 23) rotate(8) scale(${PEN_SCALE})`}
      />
    </>
  );
}

function Stand({ stand }: { stand: (typeof STANDS)["phone"] }) {
  const { base, shadow, neck } = stand;
  return (
    <>
      <path d={shadow.top} className="fill-(--laptop-shadow)" />
      <rect
        x={neck.x}
        y="-30"
        width={neck.w}
        height={30 + base.frontTop - 2}
        className="fill-(--laptop-deck-mid)"
      />
      <rect
        x={neck.x + neck.w * 0.62}
        y="-30"
        width={neck.w * 0.38}
        height={30 + base.frontTop - 2}
        className="fill-(--laptop-deck-bottom)/60"
      />
      <path d={base.side} className="fill-(--laptop-deck-bottom)" />
      <path d={base.top} className="fill-(--laptop-deck-mid)" />
      <path d={base.face} className="fill-(--laptop-deck-bottom)" />
    </>
  );
}

export default function DeskScene() {
  const id = useId();

  return (
    <div className="pointer-events-none absolute inset-x-0 top-full origin-top scale-(--intro-desk-scale)">
      <div className="absolute inset-x-0 top-0 translate-y-(--intro-desk-lift)">
        <svg
          aria-hidden="true"
          viewBox="0 0 100 100"
          className="absolute top-0 left-0 h-[100vw] w-full overflow-visible"
        >
          <defs>
            <linearGradient id={`${id}-ceramic`} x1="0" y1="0" x2="1" y2="0">
              <stop
                offset="0"
                className="[stop-color:var(--scene-ceramic-shade)]"
              />
              <stop
                offset="0.4"
                className="[stop-color:var(--scene-ceramic)]"
              />
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

          {/* Stand (phone and tablet only), coffee mug, notebooks and pens */}
          <g className="hidden intro-phone:block">
            <Stand stand={STANDS.phone} />
          </g>
          <g className="hidden intro-tablet:block">
            <Stand stand={STANDS.tablet} />
          </g>
          <g className="intro-phone:hidden">
            <Mug x={MUG_X.laptop} ceramic={`url(#${id}-ceramic)`} />
            <NotebookStack stack={STACKS.laptop} />
          </g>
          <g className="hidden intro-phone:block">
            <Mug x={MUG_X.phone} ceramic={`url(#${id}-ceramic)`} />
            <NotebookStack stack={STACKS.phone} />
          </g>
        </svg>
      </div>
    </div>
  );
}
