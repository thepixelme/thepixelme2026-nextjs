"use client";

import type { ReactNode } from "react";
import { useWindowsDispatch } from "@/lib/windows-store";
import type { WindowState } from "@/types/window";
import ResizeHandles from "./ResizeHandles";
import TrafficLights from "./TrafficLights";
import { useWindowDrag } from "./useWindowDrag";

interface Props {
  win: WindowState;
  children: ReactNode;
}

export default function Window({ win, children }: Props) {
  const dispatch = useWindowsDispatch();
  const drag = useWindowDrag(win);

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

  return (
    <div
      className="absolute flex flex-col rounded-xl border border-field-border bg-surface shadow-overlay backdrop-blur-(--glass-blur) overflow-hidden"
      style={{
        left: win.x,
        top: win.y,
        width: win.w,
        height: win.h,
        zIndex: win.z,
      }}
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
    </div>
  );
}
