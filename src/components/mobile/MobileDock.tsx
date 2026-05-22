"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { APPS } from "@/components/apps/registry";
import DockIcon from "@/components/desktop/DockIcon";
import { useWindows, useWindowsDispatch } from "@/lib/windows-store";

interface Props {
  hidden: boolean;
}

export default function MobileDock({ hidden }: Props) {
  const { windows } = useWindows();
  const dispatch = useWindowsDispatch();
  const reduceMotion = useReducedMotion();
  const pillRef = useRef<HTMLDivElement>(null);
  const prevHidden = useRef(hidden);

  useEffect(() => {
    if (prevHidden.current && !hidden) {
      pillRef.current
        ?.querySelector<HTMLButtonElement>("button")
        ?.focus({ preventScroll: true });
    }
    prevHidden.current = hidden;
  }, [hidden]);

  return (
    <motion.nav
      aria-label="Dock"
      aria-hidden={hidden}
      inert={hidden}
      className="pointer-events-none fixed inset-x-0 z-40 flex justify-center
                 bottom-[calc(env(safe-area-inset-bottom)+3.25rem)]"
      animate={{ y: hidden ? 120 : 0, opacity: hidden ? 0 : 1 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 320, damping: 32 }
      }
    >
      <div
        ref={pillRef}
        className="pointer-events-auto flex items-end gap-3 rounded-2xl border border-separator
                   bg-surface-secondary px-3 pb-2 pt-3 shadow-overlay
                   backdrop-blur-(--glass-blur)"
      >
        {APPS.filter((app) => !app.hideFromDock).map((app) => {
          const isOpen = windows.some((w) => w.appId === app.id);
          return (
            <DockIcon
              key={app.id}
              appId={app.id}
              icon={app.icon}
              label={app.title}
              open={isOpen}
              onClick={() => dispatch({ type: "OPEN", appId: app.id })}
              compact
            />
          );
        })}
      </div>
    </motion.nav>
  );
}
