"use client";

import { MousePointerClick } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { APPS } from "@/components/apps/registry";
import { useIntroPending } from "@/lib/intro";
import { useWindows, useWindowsDispatch } from "@/lib/windows-store";
import DockIcon from "./DockIcon";

const HINT_DELAY_MS = 500;
const HINT_DURATION_MS = 8000;
const BOUNCE_STAGGER_S = 0.12;

export default function Dock() {
  const { windows } = useWindows();
  const dispatch = useWindowsDispatch();
  const introPending = useIntroPending();
  const [hint, setHint] = useState(false);

  // Once the desktop is live (intro finished, or no intro), nudge visitors
  // toward the dock: icons bounce once and a hint floats above it.
  useEffect(() => {
    if (introPending) return;
    const show = setTimeout(() => setHint(true), HINT_DELAY_MS);
    const hide = setTimeout(
      () => setHint(false),
      HINT_DELAY_MS + HINT_DURATION_MS,
    );
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [introPending]);

  const apps = APPS.filter((app) => !app.hideFromDock);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center">
      <div
        className="pointer-events-auto relative flex items-end gap-3 rounded-2xl border border-separator bg-surface-secondary px-3 pb-2 pt-3 shadow-overlay backdrop-blur-(--glass-blur)"
        onPointerEnter={() => setHint(false)}
      >
        <AnimatePresence>
          {hint && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="pointer-events-none absolute bottom-full left-1/2 mb-3 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-separator bg-overlay px-3 py-1.5 text-xs font-medium shadow-overlay backdrop-blur-(--glass-blur)"
            >
              <MousePointerClick size={14} />
              Click an app to explore
            </motion.p>
          )}
        </AnimatePresence>
        {apps.map((app, i) => {
          const isOpen = windows.some((w) => w.appId === app.id);
          return (
            <DockIcon
              key={app.id}
              appId={app.id}
              icon={app.icon}
              label={app.title}
              open={isOpen}
              bounceDelay={hint ? i * BOUNCE_STAGGER_S : undefined}
              onClick={() => {
                setHint(false);
                dispatch({ type: "OPEN", appId: app.id });
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
