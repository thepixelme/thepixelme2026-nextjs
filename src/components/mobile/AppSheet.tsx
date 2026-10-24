"use client";

import { ChevronLeft } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { APPS } from "@/components/apps/registry";
import { useWindowsDispatch } from "@/lib/windows-store";
import type { WindowState } from "@/types/window";

// Past 100% so the tablet card, which floats above the bottom edge, clears
// the screen too.
const OFFSCREEN_Y = "110%";

interface Props {
  win: WindowState;
  isActive: boolean;
  stackIndex: number;
}

export default function AppSheet({ win, isActive, stackIndex }: Props) {
  const dispatch = useWindowsDispatch();
  const reduceMotion = useReducedMotion();
  const doneRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isActive) doneRef.current?.focus({ preventScroll: true });
  }, [isActive]);

  const app = APPS.find((candidate) => candidate.id === win.appId);
  if (!app) return null;
  const AppComponent = app.Component;

  return (
    <motion.section
      aria-label={win.title}
      aria-hidden={!isActive}
      inert={!isActive}
      style={{ zIndex: 30 + stackIndex }}
      className="fixed inset-0 flex flex-col bg-surface backdrop-blur-(--glass-blur)
                 pt-[calc(2.75rem+env(safe-area-inset-top))]
                 pb-[max(env(safe-area-inset-bottom),12px)]
                 tablet:inset-x-6 tablet:top-[calc(env(safe-area-inset-top)+3.5rem)]
                 tablet:bottom-[calc(env(safe-area-inset-bottom)+2.75rem)]
                 tablet:overflow-hidden tablet:rounded-2xl tablet:border tablet:border-field-border
                 tablet:py-0 tablet:shadow-overlay"
      initial={{ y: OFFSCREEN_Y, opacity: 0.6 }}
      animate={
        win.minimized ? { y: OFFSCREEN_Y, opacity: 0.6 } : { y: 0, opacity: 1 }
      }
      exit={{ y: OFFSCREEN_Y, opacity: 0.6 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 320, damping: 32 }
      }
    >
      <header className="relative flex h-11 shrink-0 items-center border-b border-separator">
        <button
          ref={doneRef}
          type="button"
          onClick={() => dispatch({ type: "CLOSE", id: win.id })}
          className="flex h-11 items-center gap-1 px-3 text-sm font-medium text-foreground/85"
        >
          <ChevronLeft size={16} /> Done
        </button>
        <span className="pointer-events-none absolute inset-x-0 text-center text-sm font-semibold text-foreground/85">
          {win.title}
        </span>
      </header>
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="h-full">
          <AppComponent windowId={win.id} />
        </div>
      </div>
    </motion.section>
  );
}
