import { useId } from "react";
import { LAPTOP_BASE as BASE } from "./scenery";

// Drawn around a screen box that is exactly the viewport, in vw units so the
// proportions hold at any size; the parent scales the whole thing. The base
// SVG's origin is the screen's bottom-left corner (one unit = 1vw).
export default function LaptopFrame() {
  const id = useId();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 intro-device:hidden"
    >
      <div className="absolute -inset-x-[1.4vw] -top-[1.4vw] -bottom-[2.1vw] rounded-t-[1.9vw] rounded-b-[0.4vw] bg-(--laptop-bezel) shadow-[0_0_0_0.16vw_var(--laptop-rim)]">
        <div className="absolute top-[0.5vw] left-1/2 size-[0.38vw] -translate-x-1/2 rounded-full bg-(--laptop-camera)" />
      </div>
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        className="absolute top-full left-0 h-[100vw] w-full overflow-visible"
      >
        <defs>
          <linearGradient
            id={`${id}-deck`}
            x1="0"
            y1={BASE.backY}
            x2="0"
            y2={BASE.frontY}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" className="[stop-color:var(--laptop-deck-mid)]" />
            <stop
              offset="0.12"
              className="[stop-color:var(--laptop-deck-top)]"
            />
          </linearGradient>
          <linearGradient
            id={`${id}-face`}
            x1="0"
            y1={BASE.frontY}
            x2="0"
            y2={BASE.frontY + 1.6}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" className="[stop-color:var(--laptop-deck-mid)]" />
            <stop
              offset="1"
              className="[stop-color:var(--laptop-deck-bottom)]"
            />
          </linearGradient>
          <filter id={`${id}-blur`} x="-0.2" y="-0.5" width="1.4" height="2">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
        </defs>

        <path
          d={BASE.shadow}
          filter={`url(#${id}-blur)`}
          className="fill-(--laptop-shadow)"
        />
        <rect
          x="6"
          y="1.9"
          width="88"
          height="1.2"
          rx="0.5"
          className="fill-(--laptop-hinge)"
        />
        <path d={BASE.face} fill={`url(#${id}-face)`} />
        <path d={BASE.deck} fill={`url(#${id}-deck)`} />
        <path d={BASE.notch} className="fill-(--laptop-deck-mid)" />
        <path
          d={BASE.grille}
          fill="none"
          strokeWidth="0.22"
          strokeLinecap="round"
          strokeDasharray="0 0.42"
          className="stroke-(--laptop-grille)"
        />
        <path d={BASE.well} className="fill-(--laptop-keyboard)" />
        <path d={BASE.keys} className="fill-(--laptop-key)" />
        <path
          d={BASE.trackpad}
          strokeWidth="0.12"
          className="fill-(--laptop-trackpad) stroke-(--laptop-deck-bottom)"
        />
      </svg>
    </div>
  );
}
