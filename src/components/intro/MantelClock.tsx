"use client";

import { motion } from "motion/react";
import { useNow } from "@/lib/clock";

// Walnut tambour clock standing on the mantel shelf, in Fireplace's room
// units, showing the visitor's local time. The hands appear after mount:
// the server can't know the visitor's time, and useNow() is null until then,
// so the server HTML and the first client render match.

const CX = 15;
const CY = -27.2;
const FACE = 2.3;
const TICKS = Array.from({ length: 12 }, (_, i) => i);

function Hand({
  angle,
  length,
  width,
}: {
  angle: number;
  length: number;
  width: number;
}) {
  return (
    <path
      d={`M${CX},${CY + 0.3} V${CY - length}`}
      transform={`rotate(${angle} ${CX} ${CY})`}
      strokeWidth={width}
      strokeLinecap="round"
      className="stroke-(--scene-soot)"
    />
  );
}

export default function MantelClock() {
  const now = useNow();
  const minutes = now ? now.getMinutes() + now.getSeconds() / 60 : 0;
  const hours = now ? (now.getHours() % 12) + minutes / 60 : 0;
  const second = now
    ? (now.getSeconds() + now.getMilliseconds() / 1000) * 6
    : 0;

  return (
    <g>
      <ellipse
        cx={CX}
        cy="-22.75"
        rx="5.6"
        ry="0.3"
        className="fill-(--scene-shadow)"
      />
      <rect
        x="9.6"
        y="-23.5"
        width="10.8"
        height="0.8"
        rx="0.15"
        className="fill-(--scene-log)"
      />
      <path
        d="M10,-23.5 H20 V-24.4 Q20,-25.5 18.8,-25.7 Q18.6,-30.6 15,-30.8 Q11.4,-30.6 11.2,-25.7 Q10,-25.5 10,-24.4 Z"
        className="fill-(--scene-desk-leg)"
      />
      <path
        d="M11.6,-25.9 Q11.9,-30.1 15,-30.3"
        fill="none"
        strokeWidth="0.18"
        strokeLinecap="round"
        className="stroke-(--scene-wood-face)/60"
      />
      <circle
        cx={CX}
        cy={CY}
        r={FACE + 0.45}
        className="fill-(--scene-brass)"
      />
      <circle
        cx={CX}
        cy={CY}
        r={FACE + 0.15}
        className="fill-(--scene-brass-shade)"
      />
      <circle cx={CX} cy={CY} r={FACE} className="fill-(--scene-trim)" />
      {TICKS.map((i) => (
        <rect
          key={i}
          x={CX - 0.06}
          y={CY - FACE + 0.2}
          width="0.12"
          height={i % 3 === 0 ? 0.45 : 0.25}
          transform={`rotate(${i * 30} ${CX} ${CY})`}
          className="fill-(--scene-soot)"
        />
      ))}
      {now && (
        <>
          <Hand angle={hours * 30} length={1.2} width={0.22} />
          <Hand angle={minutes * 6} length={1.8} width={0.14} />
          {/* Sweeps once a minute. The transparent disc centres the group's
              box on the pivot, which is where motion rotates it about. */}
          <motion.g
            animate={{ rotate: [second, second + 360] }}
            transition={{
              duration: 60,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          >
            <circle cx={CX} cy={CY} r={FACE} fill="transparent" />
            <path
              d={`M${CX},${CY + 0.45} V${CY - 1.95}`}
              strokeWidth="0.06"
              strokeLinecap="round"
              className="stroke-(--scene-book-red)"
            />
          </motion.g>
          <circle cx={CX} cy={CY} r="0.16" className="fill-(--scene-brass)" />
        </>
      )}
    </g>
  );
}
