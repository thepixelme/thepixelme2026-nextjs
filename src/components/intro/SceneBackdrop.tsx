"use client";

import { type MotionValue, motion, useTransform } from "motion/react";
import { type ReactNode, useId } from "react";
import { layerScale, layerY } from "./camera";
import { mulberry32 } from "./random";

// Midpoint-displacement ridge across x 0..1000; y 0 is the highest peak.
function ridgePoints(seed: number, height: number): [number, number][] {
  const rand = mulberry32(seed);
  const n = 128;
  const ys = new Array<number>(n + 1).fill(0);
  ys[0] = rand();
  ys[n] = rand();
  let spread = 1;
  for (let step = n; step > 1; step /= 2) {
    const half = step / 2;
    for (let i = half; i < n; i += step) {
      ys[i] = (ys[i - half] + ys[i + half]) / 2 + (rand() - 0.5) * spread;
    }
    spread *= 0.55;
  }
  const min = Math.min(...ys);
  const range = Math.max(...ys) - min;
  return ys.map((v, i) => [(i / n) * 1000, height * (1 - (v - min) / range)]);
}

function ridgePath(points: [number, number][]) {
  return `M0,1000 L${points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L")} L1000,1000 Z`;
}

function forestPath(points: [number, number][], seed: number) {
  const rand = mulberry32(seed);
  let d = "";
  for (let i = 0; i < points.length; i += 1) {
    if (rand() < 0.35) continue;
    const [x, y] = points[i];
    const h = 14 + rand() * 18;
    const w = 4 + rand() * 3;
    d += `M${(x - w).toFixed(1)},${(y + 4).toFixed(1)} L${x.toFixed(1)},${(y - h).toFixed(1)} L${(x + w).toFixed(1)},${(y + 4).toFixed(1)} Z `;
  }
  return d;
}

const RIDGES = [
  {
    depth: 0.25,
    top: "top-[34%]",
    points: ridgePoints(3, 150),
    color: "[stop-color:var(--scene-ridge-far)]",
  },
  {
    depth: 0.45,
    top: "top-[45%]",
    points: ridgePoints(11, 120),
    color: "[stop-color:var(--scene-ridge-mid)]",
  },
  {
    depth: 0.65,
    top: "top-[54%]",
    points: ridgePoints(27, 100),
    color: "[stop-color:var(--scene-ridge-near)]",
    forest: true,
  },
];

const CLOUDS = [
  { className: "left-[6%] top-[14%] w-[22vw]", drift: "5vw", duration: 50 },
  { className: "left-[62%] top-[8%] w-[16vw]", drift: "-4vw", duration: 44 },
  { className: "left-[38%] top-[27%] w-[12vw]", drift: "3vw", duration: 38 },
];

function DepthLayer({
  progress,
  depth,
  children,
}: {
  progress: MotionValue<number>;
  depth: number;
  children: ReactNode;
}) {
  const scale = useTransform(progress, (p) => layerScale(p, depth));
  const y = useTransform(progress, (p) => `${layerY(p, depth)}vh`);
  return (
    <motion.div style={{ scale, y }} className="absolute inset-0">
      {children}
    </motion.div>
  );
}

function Cloud() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 80"
      className="w-full fill-(--scene-cloud)"
    >
      <g opacity="0.85">
        <ellipse cx="62" cy="50" rx="40" ry="22" />
        <ellipse cx="102" cy="38" rx="44" ry="30" />
        <ellipse cx="142" cy="52" rx="38" ry="20" />
        <ellipse cx="100" cy="60" rx="76" ry="16" />
      </g>
    </svg>
  );
}

export default function SceneBackdrop({
  progress,
}: {
  progress: MotionValue<number>;
}) {
  const id = useId();

  return (
    <div aria-hidden="true" className="absolute inset-0">
      <DepthLayer progress={progress} depth={0.08}>
        <div className="absolute -inset-[10%] bg-linear-to-b from-(--scene-sky-top) via-(--scene-sky-mid) via-45% to-(--scene-sky-horizon) to-70%" />
        <div className="absolute top-[42%] left-[74%] size-[38vw] -translate-1/2 rounded-full bg-radial from-(--scene-sun) to-transparent to-65%" />
        {CLOUDS.map((cloud) => (
          <motion.div
            key={cloud.className}
            className={`absolute ${cloud.className}`}
            animate={{ x: [0, cloud.drift] }}
            transition={{
              duration: cloud.duration,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "mirror",
              ease: "easeInOut",
            }}
          >
            <Cloud />
          </motion.div>
        ))}
      </DepthLayer>
      {RIDGES.map((ridge, i) => (
        <DepthLayer key={ridge.top} progress={progress} depth={ridge.depth}>
          <div className={`absolute -inset-x-[20%] -bottom-[60%] ${ridge.top}`}>
            <svg
              aria-hidden="true"
              viewBox="0 0 1000 1000"
              preserveAspectRatio="none"
              className="size-full"
            >
              <defs>
                <linearGradient
                  id={`${id}-ridge-${i}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="320"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0" className={ridge.color} />
                  <stop offset="1" className="[stop-color:var(--scene-haze)]" />
                </linearGradient>
              </defs>
              <path
                d={ridgePath(ridge.points)}
                fill={`url(#${id}-ridge-${i})`}
              />
              {ridge.forest && (
                <path
                  d={forestPath(ridge.points, 41)}
                  className="fill-(--scene-forest)"
                />
              )}
            </svg>
            <div className="absolute inset-x-0 top-[13%] h-[9%] bg-linear-to-b from-transparent via-(--scene-haze)/60 to-transparent" />
          </div>
        </DepthLayer>
      ))}
    </div>
  );
}
