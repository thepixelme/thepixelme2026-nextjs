"use client";

import { useCallback, useRef } from "react";
import { useWindowsDispatch } from "@/lib/windows-store";
import type { WindowState } from "@/types/window";

export type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const MIN_W = 320;
const MIN_H = 240;

export function useWindowResize(win: WindowState, handle: ResizeHandle) {
  const dispatch = useWindowsDispatch();
  const start = useRef<{
    px: number;
    py: number;
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (win.maximized) return;
      if (e.button !== 0) return;
      e.stopPropagation();
      const target = e.currentTarget;
      target.setPointerCapture(e.pointerId);
      start.current = {
        px: e.clientX,
        py: e.clientY,
        x: win.x,
        y: win.y,
        w: win.w,
        h: win.h,
      };
      dispatch({ type: "FOCUS", id: win.id });
    },
    [dispatch, win.id, win.x, win.y, win.w, win.h, win.maximized],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!start.current) return;
      e.stopPropagation();
      const dx = e.clientX - start.current.px;
      const dy = e.clientY - start.current.py;

      let { x, y, w, h } = start.current;

      if (handle.includes("e")) w = Math.max(MIN_W, start.current.w + dx);
      if (handle.includes("s")) h = Math.max(MIN_H, start.current.h + dy);
      if (handle.includes("w")) {
        const newW = Math.max(MIN_W, start.current.w - dx);
        x = start.current.x + (start.current.w - newW);
        w = newW;
      }
      if (handle.includes("n")) {
        const newH = Math.max(MIN_H, start.current.h - dy);
        y = Math.max(28, start.current.y + (start.current.h - newH));
        h = newH;
      }

      dispatch({ type: "RESIZE", id: win.id, bounds: { x, y, w, h } });
    },
    [dispatch, handle, win.id],
  );

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!start.current) return;
    e.stopPropagation();
    start.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp };
}
