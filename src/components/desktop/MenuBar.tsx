"use client";

import { Battery, Search, User, Wifi } from "lucide-react";
import { useClock } from "@/lib/clock";
import { useNotificationCenter } from "@/lib/notification-center";
import { useWindowsDispatch } from "@/lib/windows-store";

interface Props {
  onOpenSpotlight: () => void;
}

export default function MenuBar({ onOpenSpotlight }: Props) {
  const time = useClock();
  const dispatch = useWindowsDispatch();
  const { toggle: toggleNotificationCenter } = useNotificationCenter();

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-7 items-center justify-between border-b border-separator bg-surface px-3 text-xs font-medium backdrop-blur-(--glass-blur)">
      <nav className="flex items-center gap-4">
        <button
          type="button"
          aria-label="About menu"
          className="flex h-5 items-center gap-1.5 rounded-md px-2 transition-colors duration-150 ease-out hover:bg-surface-tertiary"
          onClick={() => dispatch({ type: "OPEN", appId: "about" })}
        >
          <User size={14} />
          <span className="font-semibold">Nhat Nguyen</span>
        </button>
        <button
          type="button"
          className="flex h-5 items-center rounded-md px-2 text-foreground/70 transition-colors duration-150 ease-out hover:bg-surface-tertiary hover:text-foreground"
          onClick={() => dispatch({ type: "OPEN", appId: "finder" })}
        >
          Projects
        </button>
        <button
          type="button"
          className="flex h-5 items-center rounded-md px-2 text-foreground/70 transition-colors duration-150 ease-out hover:bg-surface-tertiary hover:text-foreground"
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
          className="flex h-5 items-center rounded-md px-1.5 transition-colors duration-150 ease-out hover:bg-surface-tertiary hover:text-foreground"
        >
          <Search size={14} />
        </button>
        <button
          type="button"
          aria-label="Toggle Notification Center"
          onClick={toggleNotificationCenter}
          className="flex h-5 items-center rounded-md px-1.5 tabular-nums transition-colors duration-150 ease-out hover:bg-surface-tertiary"
        >
          {time}
        </button>
      </div>
    </header>
  );
}
