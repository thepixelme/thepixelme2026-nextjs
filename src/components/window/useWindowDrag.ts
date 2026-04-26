"use client";

import { useCallback, useRef } from "react";
import { useWindowsDispatch } from "@/lib/windows-store";
import type { WindowState } from "@/types/window";

export function useWindowDrag(win: WindowState) {
  const dispatch = useWindowsDispatch();
  const offset = useRef<{ dx: number; dy: number } | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (win.maximized) return;
      if (e.button !== 0) return;
      const target = e.currentTarget;
      target.setPointerCapture(e.pointerId);
      offset.current = { dx: e.clientX - win.x, dy: e.clientY - win.y };
      dispatch({ type: "FOCUS", id: win.id });
    },
    [dispatch, win.id, win.x, win.y, win.maximized],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!offset.current) return;
      const x = Math.max(
        -win.w + 80,
        Math.min(window.innerWidth - 80, e.clientX - offset.current.dx),
      );
      const y = Math.max(
        28,
        Math.min(window.innerHeight - 40, e.clientY - offset.current.dy),
      );
      dispatch({ type: "MOVE", id: win.id, x, y });
    },
    [dispatch, win.id, win.w],
  );

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    offset.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp };
}
