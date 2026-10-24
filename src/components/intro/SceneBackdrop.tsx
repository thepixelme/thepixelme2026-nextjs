"use client";

import { type MotionStyle, type MotionValue, motion } from "motion/react";
import { type ReactNode, useId } from "react";
import Fireplace from "./Fireplace";
import {
  crestPath,
  dotsPath,
  ROOM_FLOOR_Y as FLOOR,
  floorSeams,
  nightHillY,
  nightNearY,
  pinesPath,
  snowTile,
  starDots,
} from "./scenery";

// Both layers are drawn in room units (see scenery.ts) from an anchor on the
// device screen's bottom edge at rest, so the room lines up with the desk at
// any aspect ratio. A room unit is 1cqw of a room frame 100 --intro-units
// wide, centred on the device. The wall and floor run far past that
// frame, so a wide viewport shows more of them rather than stretching
// anything. On phones and tablets the room is magnified about the anchor and
// panned so the fireplace stands behind the device; the floor and the
// vignette stay centred on the view, so the floorboards still converge on
// the device.
const NIGHT_DEPTH = 0.1;
const ROOM_DEPTH = 0.35;

const SEAMS = floorSeams();
const STARS = dotsPath(starDots(3, 46, { x0: 60, y0: -58, x1: 140, y1: -19 }));
const FAR_HILL = crestPath(nightHillY, 60, 140, 0);
const NEAR_HILL = crestPath(nightNearY, 60, 140, 0);
const PINES = pinesPath(8, 60, 140);
const SNOW = snowTile(21, 70, 45, 42);

// Window glass in the wall, which the night layer shows through.
const GLASS = { x: 84.2, y: -45, width: 13, height: 33.8 };
const WALL = `M-90,-120 H190 V${FLOOR} H-90 Z M${GLASS.x},${GLASS.y} V${GLASS.y + GLASS.height} H${GLASS.x + GLASS.width} V${GLASS.y} Z`;
const CURTAIN =
  "M80.2,-47 L85.8,-47 C85.4,-36 83.6,-26 82.8,-21 C83.3,-16 84.1,-12 84.3,-9.2 L79.8,-9.2 C80,-14 80.2,-18 80.2,-21 Z";
const CURTAIN_FOLDS =
  "M81.6,-47 C81.6,-37 81.4,-28 81.2,-21.6 M83.6,-47 C83.4,-38 82.7,-30 82.2,-21.6 M81.4,-20.4 C81.4,-16 81.1,-12.5 81,-9.4 M82.6,-20.4 C82.9,-16 83.2,-12.5 83.4,-9.4";

function DepthLayer({
  eased,
  depth,
  children,
}: {
  eased: MotionValue<number>;
  depth: number;
  children: ReactNode;
}) {
  return (
    <motion.div
      style={{ "--intro-e": eased, "--intro-depth": depth } as MotionStyle}
      className="intro-layer absolute inset-0"
    >
      <div className="intro-anchor absolute inset-x-0">
        <div className="@container absolute top-0 left-1/2 w-[calc(100*var(--intro-unit))] -translate-x-1/2 origin-top scale-(--intro-room-scale)">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

function Pan({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-x-0 top-0 translate-x-(--intro-room-pan)">
      {children}
    </div>
  );
}

function NightView() {
  const id = useId();

  return (
    <Pan>
      <svg
        aria-hidden="true"
        viewBox="60 -60 80 60"
        className="absolute -top-[60cqw] left-[60cqw] h-[60cqw] w-[80cqw]"
      >
        <defs>
          <linearGradient
            id={`${id}-sky`}
            x1="0"
            y1="-60"
            x2="0"
            y2="-14"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" className="[stop-color:var(--scene-night-top)]" />
            <stop
              offset="1"
              className="[stop-color:var(--scene-night-horizon)]"
            />
          </linearGradient>
          <radialGradient id={`${id}-moon`}>
            <stop
              offset="0"
              stopOpacity="0.45"
              className="[stop-color:var(--scene-moon)]"
            />
            <stop
              offset="1"
              stopOpacity="0"
              className="[stop-color:var(--scene-moon)]"
            />
          </radialGradient>
        </defs>
        <rect x="60" y="-60" width="80" height="60" fill={`url(#${id}-sky)`} />
        <path d={STARS} className="fill-(--scene-moon)/80" />
        <circle cx="93.5" cy="-31" r="5" fill={`url(#${id}-moon)`} />
        <circle cx="93.5" cy="-31" r="1.4" className="fill-(--scene-moon)" />
        <path d={FAR_HILL} className="fill-(--scene-snow-shade)" />
        <path d={PINES} className="fill-(--scene-pine)" />
        <path d={NEAR_HILL} className="fill-(--scene-snow)" />
      </svg>
      <div className="absolute -top-[50cqw] left-[70cqw] h-[42cqw] w-[45cqw] overflow-hidden">
        <motion.svg
          aria-hidden="true"
          viewBox="0 0 45 84"
          className="h-[84cqw] w-[45cqw]"
          animate={{ y: ["-50%", "0%"] }}
          transition={{
            duration: 18,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        >
          <path d={SNOW} className="fill-(--scene-snow)/90" />
        </motion.svg>
      </div>
    </Pan>
  );
}

function Window() {
  const id = useId();

  return (
    <g>
      <defs>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1">
          <stop
            offset="0"
            stopOpacity="0.16"
            className="[stop-color:var(--white)]"
          />
          <stop
            offset="0.5"
            stopOpacity="0"
            className="[stop-color:var(--white)]"
          />
        </linearGradient>
      </defs>
      <rect {...GLASS} fill={`url(#${id}-glass)`} />
      <path
        fillRule="evenodd"
        d={`M83.2,-46 H98.2 V-10.4 H83.2 Z M${GLASS.x},${GLASS.y} V${GLASS.y + GLASS.height} H${GLASS.x + GLASS.width} V${GLASS.y} Z`}
        className="fill-(--scene-trim)"
      />
      <rect
        x="90.45"
        y={GLASS.y}
        width="0.5"
        height={GLASS.height}
        className="fill-(--scene-trim)"
      />
      {[-33.8, -22.6].map((y) => (
        <rect
          key={y}
          x={GLASS.x}
          y={y}
          width={GLASS.width}
          height="0.5"
          className="fill-(--scene-trim)"
        />
      ))}
      <rect
        x="82.6"
        y="-10.8"
        width="16.2"
        height="0.8"
        rx="0.15"
        className="fill-(--scene-trim)"
      />
      <rect
        x="82.8"
        y="-10"
        width="15.8"
        height="0.3"
        className="fill-(--scene-shadow)"
      />

      {/* Curtains, tied back; the right one mirrors the left */}
      <rect
        x="79.6"
        y="-47.5"
        width="23"
        height="0.45"
        rx="0.2"
        className="fill-(--scene-brass)"
      />
      {["", "translate(181.4 0) scale(-1 1)"].map((transform) => (
        <g key={transform} transform={transform || undefined}>
          <path d={CURTAIN} className="fill-(--scene-curtain)" />
          <path
            d={CURTAIN_FOLDS}
            fill="none"
            strokeWidth="0.35"
            strokeLinecap="round"
            className="stroke-(--scene-curtain-shade)"
          />
          <ellipse
            cx="81.6"
            cy="-21"
            rx="1.6"
            ry="0.45"
            className="fill-(--scene-brass)"
          />
        </g>
      ))}
    </g>
  );
}

function Room() {
  const id = useId();

  return (
    <>
      {/* Wall down to the floor line (y −9), then floor and skirting from
          y −10.2, in svgs sized to match their viewBoxes. Both run from
          x −90 to 190, well past the 16:10 frame, for wide viewports. */}
      <Pan>
        <svg
          aria-hidden="true"
          viewBox="-90 -120 280 111"
          className="absolute -top-[120cqw] -left-[90cqw] h-[111cqw] w-[280cqw]"
        >
          <defs>
            <linearGradient
              id={`${id}-wall`}
              x1="0"
              y1="-75"
              x2="0"
              y2="-28"
              gradientUnits="userSpaceOnUse"
            >
              <stop
                offset="0"
                className="[stop-color:var(--scene-wall-shade)]"
              />
              <stop offset="1" className="[stop-color:var(--scene-wall)]" />
            </linearGradient>
          </defs>
          <path fillRule="evenodd" d={WALL} fill={`url(#${id}-wall)`} />
        </svg>
      </Pan>
      <svg
        aria-hidden="true"
        viewBox="-90 -10.2 280 50.2"
        className="absolute -top-[10.2cqw] -left-[90cqw] h-[50.2cqw] w-[280cqw]"
      >
        <defs>
          <linearGradient
            id={`${id}-floor`}
            x1="0"
            y1={FLOOR}
            x2="0"
            y2="6"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" className="[stop-color:var(--scene-floor-seam)]" />
            <stop offset="1" className="[stop-color:var(--scene-floor)]" />
          </linearGradient>
        </defs>
        <rect
          x="-90"
          y={FLOOR}
          width="280"
          height={40 - FLOOR}
          fill={`url(#${id}-floor)`}
        />
        <path
          d={SEAMS}
          fill="none"
          strokeWidth="0.12"
          className="stroke-(--scene-floor-seam)"
        />
        <rect
          x="-90"
          y={FLOOR - 1.2}
          width="280"
          height="1.2"
          className="fill-(--scene-trim)"
        />
      </svg>
      <Pan>
        <svg
          aria-hidden="true"
          viewBox="-10 -60 120 100"
          className="absolute -top-[60cqw] -left-[10cqw] h-[100cqw] w-[120cqw]"
        >
          <Window />
          <Fireplace />
        </svg>
      </Pan>
      {/* Vignette: an ellipse about the fireplace and desk, solid shade
          beyond it, so the far wall and floor on a wide viewport stay dim. */}
      <div className="absolute top-[-20cqw] left-1/2 h-[300cqw] w-[500cqw] -translate-1/2 bg-[radial-gradient(106cqw_59.4cqw_in_oklab,transparent_30%,color-mix(in_oklab,var(--scene-wall-shade)_85%,transparent)_72%)]" />
      <Pan>
        <motion.div
          className="absolute top-[-12cqw] left-[15cqw] h-[56cqw] w-[80cqw] -translate-1/2 rounded-full bg-radial from-(--scene-firelight)/55 to-transparent to-70%"
          animate={{ opacity: [0.75, 1] }}
          transition={{
            duration: 2.2,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
        />
      </Pan>
    </>
  );
}

export default function SceneBackdrop({
  eased,
}: {
  eased: MotionValue<number>;
}) {
  return (
    <div aria-hidden="true" className="absolute inset-0">
      <DepthLayer eased={eased} depth={NIGHT_DEPTH}>
        <NightView />
      </DepthLayer>
      <DepthLayer eased={eased} depth={ROOM_DEPTH}>
        <Room />
      </DepthLayer>
    </div>
  );
}
