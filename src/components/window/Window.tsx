"use client";

import { motion, useReducedMotion } from "motion/react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useWindowsDispatch } from "@/lib/windows-store";
import type { WindowState } from "@/types/window";
import { useDockIconRect } from "./dock-positions";
import ResizeHandles from "./ResizeHandles";
import TrafficLights from "./TrafficLights";
import { useWindowDrag } from "./useWindowDrag";

interface Props {
  win: WindowState;
  children: ReactNode;
}

const BOUNDS_TRANSITION_MS = 220;

export default function Window({ win, children }: Props) {
  const dispatch = useWindowsDispatch();
  const drag = useWindowDrag(win);
  const reduceMotion = useReducedMotion();
  const getDockRect = useDockIconRect();

  const handleClose = () => dispatch({ type: "CLOSE", id: win.id });
  const handleMinimize = () => dispatch({ type: "MINIMIZE", id: win.id });
  const handleMaximize = () => {
    if (win.maximized) {
      dispatch({ type: "RESTORE", id: win.id });
    } else {
      dispatch({
        type: "MAXIMIZE",
        id: win.id,
        viewport: { w: window.innerWidth, h: window.innerHeight },
      });
    }
  };

  const dockOffset = (() => {
    const r = getDockRect(win.appId);
    if (!r) return { tx: 0, ty: 0 };
    const cx = win.x + win.w / 2;
    const cy = win.y + win.h / 2;
    return { tx: r.left + r.width / 2 - cx, ty: r.top + r.height / 2 - cy };
  })();

  const initialOffset = useRef<{ tx: number; ty: number } | null>(null);
  if (initialOffset.current === null) initialOffset.current = dockOffset;

  const prevMinimized = useRef(win.minimized);
  const hasMounted = useRef(false);
  useEffect(() => {
    hasMounted.current = true;
    prevMinimized.current = win.minimized;
  }, [win.minimized]);

  const transition = useMemo(() => {
    if (reduceMotion) return { duration: 0 };
    if (!hasMounted.current)
      return { duration: 0.25, ease: "easeOut" as const };
    if (prevMinimized.current !== win.minimized) {
      return win.minimized
        ? { duration: 0.3, ease: "easeInOut" as const }
        : { duration: 0.3, ease: "easeOut" as const };
    }
    return { duration: 0.25, ease: "easeOut" as const };
  }, [reduceMotion, win.minimized]);

  const prevMaximized = useRef(win.maximized);
  const [boundsTransitioning, setBoundsTransitioning] = useState(false);
  useEffect(() => {
    if (prevMaximized.current === win.maximized) return;
    prevMaximized.current = win.maximized;
    if (reduceMotion) return;
    setBoundsTransitioning(true);
    const t = setTimeout(
      () => setBoundsTransitioning(false),
      BOUNDS_TRANSITION_MS,
    );
    return () => clearTimeout(t);
  }, [win.maximized, reduceMotion]);

  const boundsClass = boundsTransitioning
    ? "transition-[left,top,width,height] duration-[220ms] ease-out"
    : "";

  return (
    <motion.div
      className={`absolute flex flex-col rounded-xl border border-field-border bg-surface shadow-overlay backdrop-blur-(--glass-blur) overflow-hidden ${boundsClass}`}
      style={{
        left: win.x,
        top: win.y,
        width: win.w,
        height: win.h,
        zIndex: win.z,
        pointerEvents: win.minimized ? "none" : "auto",
      }}
      initial={{
        opacity: 0,
        scale: 0.6,
        x: initialOffset.current.tx,
        y: initialOffset.current.ty,
      }}
      animate={
        win.minimized
          ? {
              opacity: 0,
              scale: 0.1,
              x: dockOffset.tx,
              y: dockOffset.ty,
            }
          : { opacity: 1, scale: 1, x: 0, y: 0 }
      }
      exit={{
        opacity: 0,
        scale: 0.6,
        x: dockOffset.tx,
        y: dockOffset.ty,
        transition: reduceMotion
          ? { duration: 0 }
          : { duration: 0.18, ease: "easeIn" },
      }}
      transition={transition}
      onPointerDown={() => dispatch({ type: "FOCUS", id: win.id })}
    >
      <div
        data-window-titlebar
        role="toolbar"
        aria-label={`${win.title} window controls`}
        className="relative flex h-9 shrink-0 select-none items-center border-b border-separator"
        onPointerDown={drag.onPointerDown}
        onPointerMove={drag.onPointerMove}
        onPointerUp={drag.onPointerUp}
        onDoubleClick={handleMaximize}
      >
        <TrafficLights
          onClose={handleClose}
          onMinimize={handleMinimize}
          onMaximize={handleMaximize}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-semibold text-foreground/80">
          {win.title}
        </div>
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
      {!win.maximized && <ResizeHandles win={win} />}
    </motion.div>
  );
}
