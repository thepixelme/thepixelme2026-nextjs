"use client";

import { Battery, Search, User, Wifi } from "lucide-react";
import { useClock } from "@/lib/clock";
import { useWindowsDispatch } from "@/lib/windows-store";

interface Props {
  onOpenSpotlight: () => void;
}

export default function MenuBar({ onOpenSpotlight }: Props) {
  const time = useClock();
  const dispatch = useWindowsDispatch();

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-7 items-center justify-between border-b border-separator bg-surface px-3 text-xs font-medium backdrop-blur-(--glass-blur)">
      <nav className="flex items-center gap-4">
        <button
          type="button"
          aria-label="About menu"
          className="flex h-5 items-center gap-1.5 rounded px-1 hover:bg-default"
          onClick={() => dispatch({ type: "OPEN", appId: "about" })}
        >
          <User size={14} />
          <span className="font-semibold">Nhat Nguyen</span>
        </button>
        <button
          type="button"
          className="text-foreground/70 hover:text-foreground rounded px-1 hover:bg-default"
          onClick={() => dispatch({ type: "OPEN", appId: "finder" })}
        >
          Portfolio
        </button>
        <button
          type="button"
          className="text-foreground/70 hover:text-foreground rounded px-1 hover:bg-default"
          onClick={() => dispatch({ type: "OPEN", appId: "resume" })}
        >
          Resume
        </button>
        <button
          type="button"
          className="text-foreground/70 hover:text-foreground rounded px-1 hover:bg-default"
          onClick={() => dispatch({ type: "OPEN", appId: "contact" })}
        >
          Contact
        </button>
      </nav>
      <div className="flex items-center gap-3">
        <Battery size={16} />
        <Wifi size={14} />
        <button
          type="button"
          aria-label="Open Spotlight"
          onClick={onOpenSpotlight}
          className="flex items-center hover:text-foreground"
        >
          <Search size={14} />
        </button>
        <span className="tabular-nums">{time}</span>
      </div>
    </header>
  );
}
