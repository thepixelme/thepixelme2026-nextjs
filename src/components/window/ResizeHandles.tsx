"use client";

import type { WindowState } from "@/types/window";
import { type ResizeHandle, useWindowResize } from "./useWindowResize";

const HANDLES: { handle: ResizeHandle; className: string; cursor: string }[] = [
  { handle: "n", className: "top-0 left-2 right-2 h-1.5", cursor: "ns-resize" },
  {
    handle: "s",
    className: "bottom-0 left-2 right-2 h-1.5",
    cursor: "ns-resize",
  },
  {
    handle: "w",
    className: "top-2 bottom-2 left-0 w-1.5",
    cursor: "ew-resize",
  },
  {
    handle: "e",
    className: "top-2 bottom-2 right-0 w-1.5",
    cursor: "ew-resize",
  },
  { handle: "nw", className: "top-0 left-0 h-3 w-3", cursor: "nwse-resize" },
  { handle: "ne", className: "top-0 right-0 h-3 w-3", cursor: "nesw-resize" },
  { handle: "sw", className: "bottom-0 left-0 h-3 w-3", cursor: "nesw-resize" },
  {
    handle: "se",
    className: "bottom-0 right-0 h-3 w-3",
    cursor: "nwse-resize",
  },
];

export default function ResizeHandles({ win }: { win: WindowState }) {
  return (
    <>
      {HANDLES.map((h) => (
        <Handle key={h.handle} win={win} {...h} />
      ))}
    </>
  );
}

function Handle({
  win,
  handle,
  className,
  cursor,
}: {
  win: WindowState;
  handle: ResizeHandle;
  className: string;
  cursor: string;
}) {
  const handlers = useWindowResize(win, handle);
  return (
    <div
      className={`absolute z-10 ${className}`}
      style={{ cursor }}
      {...handlers}
    />
  );
}
