"use client";

import { motion } from "motion/react";
import { flamePath } from "./scenery";

// A flickering flame standing on (x, y), in the parent SVG's units. Fire
// tongues have an orange outer layer; candle flames are amber and yellow only.
export default function Flame({
  x,
  y,
  height,
  lean = 0,
  duration = 1.6,
  delay = 0,
  candle = false,
}: {
  x: number;
  y: number;
  height: number;
  lean?: number;
  duration?: number;
  delay?: number;
  candle?: boolean;
}) {
  const w = height * (candle ? 0.36 : 0.62);
  return (
    <motion.g
      style={{ originY: 1 }}
      animate={{
        scaleY: [1, 1.14, 0.9, 1.08, 1],
        scaleX: [1, 0.93, 1.05, 0.96, 1],
        rotate: [0, -2, 1.5, -1, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      }}
    >
      {!candle && (
        <path
          d={flamePath(x, y, w, height, lean)}
          className="fill-(--scene-flame-outer)"
        />
      )}
      <path
        d={flamePath(x, y, w * 0.7, height * (candle ? 1 : 0.7), lean * 0.7)}
        className="fill-(--scene-flame-mid)"
      />
      <path
        d={flamePath(x, y, w * 0.4, height * (candle ? 0.55 : 0.4), lean * 0.4)}
        className="fill-(--scene-flame-core)"
      />
    </motion.g>
  );
}
