"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { AppId } from "@/types/window";

const LABELS: Partial<Record<AppId, string>> = {
  about: "About me",
  finder: "Projects",
  contact: "Contact",
  terminal: "Terminal",
};

const STEP_MS = 1600;

interface Stop {
  x: number;
  y: number;
  label?: string;
  labelY?: number;
}

// A fake cursor that tours the dock on the laptop screen while the intro
// plays (a fingertip on a phone or tablet). Rendered inside the screen box,
// so it is measured and drawn in the screen's own (unscaled) coordinates.
export default function IntroWalkthrough() {
  const ref = useRef<HTMLDivElement>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [step, setStep] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const box = el.getBoundingClientRect();
      const k = box.width / el.offsetWidth || 1;
      const icons =
        el.parentElement?.querySelectorAll<HTMLElement>("[data-dock-icon]");
      if (!icons?.length) return setStops([]);
      const rest = { x: el.offsetWidth * 0.64, y: el.offsetHeight * 0.4 };
      setStops([
        rest,
        ...Array.from(icons).map((icon) => {
          const r = icon.getBoundingClientRect();
          const appId = icon.dataset.dockIcon as AppId;
          return {
            x: (r.left + r.width * 0.55 - box.left) / k,
            y: (r.top + r.height * 0.4 - box.top) / k,
            label: LABELS[appId] ?? icon.getAttribute("aria-label") ?? "",
            labelY: (r.top - box.top) / k - 14,
          };
        }),
      ]);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (stops.length < 2) return;
    const timer = setInterval(
      () => setStep((s) => (s + 1) % stops.length),
      STEP_MS,
    );
    return () => clearInterval(timer);
  }, [stops.length]);

  const stop = stops[step];

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-60"
    >
      <AnimatePresence>
        {stop?.label && (
          <motion.span
            key={stop.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ delay: 0.6, duration: 0.2 }}
            style={{ left: stop.x, top: stop.labelY }}
            className="absolute -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-separator bg-overlay px-2.5 py-1 text-sm font-medium shadow-overlay backdrop-blur-(--glass-blur)"
          >
            {stop.label}
          </motion.span>
        )}
      </AnimatePresence>
      {stop && (
        <motion.span
          initial={false}
          animate={{ x: stop.x, y: stop.y }}
          transition={{ duration: 0.8, ease: [0.45, 0, 0.2, 1] }}
          className="absolute top-0 left-0 hidden size-11 -translate-1/2 rounded-full border-2 border-(--white)/90 bg-(--white)/35 shadow-overlay intro-device:block"
        />
      )}
      {stop && (
        <motion.svg
          viewBox="0 0 17 25"
          initial={false}
          animate={{ x: stop.x, y: stop.y }}
          transition={{ duration: 0.8, ease: [0.45, 0, 0.2, 1] }}
          className="absolute top-0 left-0 h-9 w-auto drop-shadow-sm intro-device:hidden"
        >
          <path
            d="M1 1 L1 19.5 L5.6 15.2 L8.6 22.6 L11.6 21.4 L8.7 14.2 L14.8 14.2 Z"
            strokeWidth="1.4"
            strokeLinejoin="round"
            className="fill-(--black) stroke-(--white)"
          />
        </motion.svg>
      )}
    </div>
  );
}
