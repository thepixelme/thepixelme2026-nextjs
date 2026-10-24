"use client";

import { motion } from "motion/react";
import { useId } from "react";
import Flame from "./Flame";
import { brickCourses, ROOM_FLOOR_Y as FLOOR, round2 } from "./scenery";

// Mantelpiece, fire and mantel ornaments for SceneBackdrop's room, drawn in
// its rest-vw units (see scenery.ts). The firebox is centred on x = 15, so at
// rest it shows to the left of the laptop, above the desk's back edge.

const BRICKS = brickCourses(
  { x0: 5.8, y0: -19, x1: 24.2, y1: FLOOR },
  1.5,
  0.5,
  0.12,
  9,
);
const BACK_BRICKS = brickCourses(
  { x0: 10.6, y0: -16.8, x1: 19.4, y1: -10 },
  1.1,
  0.4,
  0.1,
  13,
);

const OPENING = `M8.6,${FLOOR} L8.6,-15.4 Q15,-18.6 21.4,-15.4 L21.4,${FLOOR} Z`;
const SOLDIERS = `M8.6,${FLOOR} V-15.4 Q15,-18.6 21.4,-15.4 V${FLOOR}`;
const BACK_WALL = "M10.6,-10 L10.6,-14.6 Q15,-16.6 19.4,-14.6 L19.4,-10 Z";

const TONGUES = [
  { x: 12, height: 3.6, lean: -0.9, duration: 1.3, delay: 0 },
  { x: 13.6, height: 5.4, lean: -0.5, duration: 1.7, delay: 0.3 },
  { x: 15.2, height: 6.6, lean: 0.3, duration: 1.5, delay: 0.1 },
  { x: 16.8, height: 4.9, lean: 0.8, duration: 1.9, delay: 0.5 },
  { x: 18.1, height: 3.3, lean: 1, duration: 1.4, delay: 0.2 },
];

const EMBERS = [
  { x: 10.6, y: -9.7, r: 0.22, delay: 0 },
  { x: 12.3, y: -9.5, r: 0.3, delay: 0.8 },
  { x: 14.6, y: -9.6, r: 0.26, delay: 0.4 },
  { x: 16.9, y: -9.45, r: 0.32, delay: 1.2 },
  { x: 18.9, y: -9.65, r: 0.24, delay: 0.6 },
];

// Fairy lights draped under the mantel shelf in four swags, with three bulbs
// on each; alternate bulbs twinkle out of step.
const SWAG = 6.4;
const LIGHTS_WIRE = `M2.2,-21.5 ${[0, 1, 2, 3]
  .map(
    (i) =>
      `Q${round2(2.2 + SWAG * (i + 0.5))},-19.9 ${round2(2.2 + SWAG * (i + 1))},-21.5`,
  )
  .join(" ")}`;
const BULBS = [0, 1, 2, 3].flatMap((i) =>
  [0.2, 0.5, 0.8].map((t) => ({
    x: round2(2.2 + SWAG * (i + t)),
    y: round2(-21.5 + 3.2 * t * (1 - t) + 0.25),
  })),
);

const flicker = (duration: number, delay = 0) => ({
  duration,
  delay,
  repeat: Number.POSITIVE_INFINITY,
  repeatType: "mirror" as const,
  ease: "easeInOut" as const,
});

function Candlestick({ x, taper }: { x: number; taper: number }) {
  const top = -24.6 - taper;
  return (
    <g>
      <ellipse
        cx={x}
        cy="-22.8"
        rx="0.75"
        ry="0.2"
        className="fill-(--scene-brass-shade)"
      />
      <rect
        x={x - 0.15}
        y="-24.4"
        width="0.3"
        height="1.6"
        className="fill-(--scene-brass)"
      />
      <rect
        x={x - 0.5}
        y="-24.75"
        width="1"
        height="0.35"
        rx="0.1"
        className="fill-(--scene-brass)"
      />
      <rect
        x={x - 0.22}
        y={top}
        width="0.44"
        height={taper}
        className="fill-(--scene-wax)"
      />
      <Flame x={x} y={top - 0.1} height={1.3} candle duration={1.4} />
    </g>
  );
}

export default function Fireplace() {
  const id = useId();

  return (
    <g>
      <defs>
        <radialGradient id={`${id}-glow`}>
          <stop
            offset="0"
            stopOpacity="0.85"
            className="[stop-color:var(--scene-firelight)]"
          />
          <stop
            offset="1"
            stopOpacity="0"
            className="[stop-color:var(--scene-firelight)]"
          />
        </radialGradient>
        <clipPath id={`${id}-back`}>
          <path d={BACK_WALL} />
        </clipPath>
      </defs>

      {/* Hearth slab on the floor */}
      <path
        d={`M1.6,${FLOOR} L28.4,${FLOOR} L29,-7 L1,-7 Z`}
        className="fill-(--scene-stone)"
      />
      <rect
        x="1"
        y="-7"
        width="28"
        height="0.5"
        className="fill-(--scene-stone-face)"
      />
      <motion.ellipse
        cx="15"
        cy="-8.2"
        rx="10"
        ry="1.8"
        fill={`url(#${id}-glow)`}
        animate={{ opacity: [0.55, 0.8] }}
        transition={flicker(1.8)}
      />

      {/* Brick panel and the soldier course around the opening */}
      <rect
        x="5.8"
        y="-19"
        width="18.4"
        height={FLOOR + 19}
        className="fill-(--scene-mortar)"
      />
      <path d={BRICKS[0]} className="fill-(--scene-brick)" />
      <path d={BRICKS[1]} className="fill-(--scene-brick-dark)" />
      <path
        d={SOLDIERS}
        fill="none"
        strokeWidth="1.6"
        strokeDasharray="0.45 0.1"
        className="stroke-(--scene-brick-dark)"
      />

      {/* Firebox */}
      <path d={OPENING} className="fill-(--scene-soot)" />
      <path d={BACK_WALL} className="fill-(--scene-brick-dark)/25" />
      <g clipPath={`url(#${id}-back)`}>
        <path d={BACK_BRICKS[0]} className="fill-(--scene-brick-dark)/40" />
        <path d={BACK_BRICKS[1]} className="fill-(--scene-brick-dark)/30" />
      </g>
      <motion.ellipse
        cx="15"
        cy="-10.6"
        rx="7.5"
        ry="5.5"
        fill={`url(#${id}-glow)`}
        animate={{ opacity: [0.7, 1] }}
        transition={flicker(1.2)}
      />

      {/* Grate and logs, with the fire between them */}
      <rect
        x="10.2"
        y="-10.4"
        width="9.6"
        height="0.35"
        className="fill-(--scene-soot)"
      />
      <g transform="rotate(-7 15 -11.8)">
        <rect
          x="11"
          y="-12.4"
          width="8"
          height="1.1"
          rx="0.55"
          className="fill-(--scene-log)"
        />
        <circle
          cx="11.1"
          cy="-11.85"
          r="0.55"
          className="fill-(--scene-log-end)"
        />
      </g>
      <motion.path
        d="M10.6,-10.6 Q11,-13.4 15,-13.6 Q19,-13.4 19.4,-10.6 Z"
        style={{ originY: 1 }}
        animate={{ scaleY: [1, 1.1, 0.95, 1] }}
        transition={{
          duration: 2.1,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        className="fill-(--scene-flame-outer)"
      />
      {TONGUES.map((tongue) => (
        <Flame key={tongue.x} y={-10.8} {...tongue} />
      ))}
      <rect
        x="10.4"
        y="-11.2"
        width="9.2"
        height="1.2"
        rx="0.6"
        className="fill-(--scene-log)"
      />
      <circle cx="19.5" cy="-10.6" r="0.6" className="fill-(--scene-log-end)" />
      <circle
        cx="19.5"
        cy="-10.6"
        r="0.3"
        fill="none"
        strokeWidth="0.1"
        className="stroke-(--scene-log)"
      />
      {EMBERS.map((ember) => (
        <motion.circle
          key={ember.x}
          cx={ember.x}
          cy={ember.y}
          r={ember.r}
          className="fill-(--scene-ember)"
          animate={{ opacity: [0.4, 1] }}
          transition={flicker(0.9, ember.delay)}
        />
      ))}
      <rect
        x="10.6"
        y="-10.8"
        width="0.5"
        height="1.6"
        rx="0.15"
        className="fill-(--scene-soot)"
      />
      <rect
        x="18.9"
        y="-10.8"
        width="0.5"
        height="1.6"
        rx="0.15"
        className="fill-(--scene-soot)"
      />

      {/* Painted wood mantelpiece: plinths, pilasters, frieze, shelf */}
      {[3, 24.2].map((x) => (
        <g key={x}>
          <rect
            x={x}
            y="-19"
            width="2.8"
            height="8.4"
            className="fill-(--scene-trim)"
          />
          <rect
            x={x + 0.6}
            y="-18.2"
            width="1.6"
            height="6.8"
            rx="0.2"
            fill="none"
            strokeWidth="0.14"
            className="stroke-(--scene-trim-shade)"
          />
          <rect
            x={x - 0.3}
            y="-10.6"
            width="3.4"
            height="1.6"
            className="fill-(--scene-trim-shade)"
          />
        </g>
      ))}
      <rect
        x="3"
        y="-21.6"
        width="24"
        height="2.6"
        className="fill-(--scene-trim)"
      />
      <rect
        x="3"
        y="-19.3"
        width="24"
        height="0.3"
        className="fill-(--scene-trim-shade)"
      />
      <rect
        x="8"
        y="-21"
        width="14"
        height="1.3"
        rx="0.2"
        fill="none"
        strokeWidth="0.14"
        className="stroke-(--scene-trim-shade)"
      />
      <rect
        x="1.8"
        y="-22.7"
        width="26.4"
        height="1.1"
        rx="0.15"
        className="fill-(--scene-trim)"
      />
      <rect
        x="2.2"
        y="-21.6"
        width="25.6"
        height="0.3"
        className="fill-(--scene-shadow)"
      />

      <path
        d={LIGHTS_WIRE}
        fill="none"
        strokeWidth="0.08"
        className="stroke-(--scene-soot)/60"
      />
      {[0, 1].map((group) => (
        <motion.g
          key={group}
          animate={{ opacity: [0.55, 1] }}
          transition={flicker(group ? 2.3 : 1.6)}
        >
          {BULBS.filter((_, i) => i % 2 === group).map((bulb) => (
            <g key={bulb.x}>
              <circle
                cx={bulb.x}
                cy={bulb.y}
                r="0.8"
                fill={`url(#${id}-glow)`}
              />
              <circle
                cx={bulb.x}
                cy={bulb.y}
                r="0.2"
                className="fill-(--scene-flame-core)"
              />
            </g>
          ))}
        </motion.g>
      ))}

      {/* On the mantel: candlesticks, a leaning painting, books and a clock */}
      <Candlestick x={3.8} taper={3.2} />
      <Candlestick x={5.6} taper={2.3} />

      <rect
        x="9.9"
        y="-30.6"
        width="10.8"
        height="7.9"
        className="fill-(--scene-shadow)"
      />
      <rect
        x="9.6"
        y="-30.8"
        width="10.8"
        height="8.1"
        className="fill-(--scene-wood-face)"
      />
      <rect
        x="10.2"
        y="-30.2"
        width="9.6"
        height="6.9"
        className="fill-(--scene-trim)"
      />
      <rect
        x="10.8"
        y="-29.6"
        width="8.4"
        height="5.7"
        className="fill-(--scene-rug-light)"
      />
      <circle
        cx="16.9"
        cy="-27.7"
        r="0.9"
        className="fill-(--scene-book-mustard)"
      />
      <path
        d="M10.8,-23.9 L12.6,-26.4 L13.8,-25.3 L15.5,-27.8 L17.7,-24.9 L19.2,-25.9 L19.2,-23.9 Z"
        className="fill-(--scene-book-navy)"
      />
      <path
        d="M10.8,-23.9 Q13.6,-25.4 16.2,-24.8 Q18,-24.4 19.2,-24.9 L19.2,-23.9 Z"
        className="fill-(--scene-curtain)"
      />

      <rect
        x="21.8"
        y="-23.45"
        width="4.6"
        height="0.75"
        rx="0.1"
        className="fill-(--scene-book-navy)"
      />
      <rect
        x="22.2"
        y="-24.05"
        width="3.8"
        height="0.6"
        rx="0.1"
        className="fill-(--scene-book-red)"
      />
      <circle cx="24.1" cy="-25.1" r="1.1" className="fill-(--scene-brass)" />
      <circle cx="24.1" cy="-25.1" r="0.82" className="fill-(--scene-trim)" />
      <path
        d="M24.1,-25.1 L24.1,-25.7 M24.1,-25.1 L24.5,-24.95"
        strokeWidth="0.12"
        strokeLinecap="round"
        className="stroke-(--scene-soot)"
      />
    </g>
  );
}
