"use client";

import { motion, useReducedMotion } from "motion/react";
import type { AppDef } from "@/types/window";

interface Props {
  app: AppDef;
  onLaunch: () => void;
}

export default function HomeIcon({ app, onLaunch }: Props) {
  const reduceMotion = useReducedMotion();
  const Icon = app.icon;
  return (
    <motion.button
      type="button"
      aria-label={app.title}
      whileTap={reduceMotion ? undefined : { scale: 0.92 }}
      onClick={onLaunch}
      className="flex min-h-22 flex-col items-center gap-1.5"
    >
      <span
        className="grid aspect-square w-16 place-items-center rounded-[18px]
                   border border-field-border bg-surface shadow-surface
                   backdrop-blur-(--glass-blur)"
      >
        <Icon size={28} className="text-foreground/85" />
      </span>
      <span className="text-[11px] font-medium text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
        {app.title}
      </span>
    </motion.button>
  );
}
