"use client";

import { Maximize2, Minus, X } from "lucide-react";

interface Props {
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
}

export default function TrafficLights({
  onClose,
  onMinimize,
  onMaximize,
}: Props) {
  return (
    <div className="group flex items-center gap-2 pl-3">
      <button
        type="button"
        aria-label="Close window"
        onClick={onClose}
        className="grid h-3 w-3 place-items-center rounded-full bg-[#ff5f57] hover:brightness-95 active:brightness-90"
      >
        <X
          size={8}
          strokeWidth={2.5}
          className="text-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </button>
      <button
        type="button"
        aria-label="Minimize window"
        onClick={onMinimize}
        className="grid h-3 w-3 place-items-center rounded-full bg-[#febc2e] hover:brightness-95 active:brightness-90"
      >
        <Minus
          size={8}
          strokeWidth={2.5}
          className="text-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </button>
      <button
        type="button"
        aria-label="Maximize window"
        onClick={onMaximize}
        className="grid h-3 w-3 place-items-center rounded-full bg-[#28c840] hover:brightness-95 active:brightness-90"
      >
        <Maximize2
          size={7}
          strokeWidth={2.5}
          className="text-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </button>
    </div>
  );
}
