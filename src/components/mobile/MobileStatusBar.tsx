"use client";

import { Battery, Search, Wifi } from "lucide-react";
import { useMemo } from "react";
import { useNow } from "@/lib/clock";

const SHORT_FORMAT = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

interface Props {
  onOpenSpotlight: () => void;
}

export default function MobileStatusBar({ onOpenSpotlight }: Props) {
  const now = useNow();
  const shortTime = useMemo(() => (now ? SHORT_FORMAT.format(now) : ""), [now]);

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-between
                 bg-surface backdrop-blur-(--glass-blur) border-b border-separator px-5
                 h-[calc(2.75rem+env(safe-area-inset-top))]
                 pt-[env(safe-area-inset-top)]"
    >
      <span className="text-xs font-medium tabular-nums">{shortTime}</span>
      <div className="-mr-2 flex items-center gap-3">
        <Wifi size={14} />
        <Battery size={16} />
        <button
          type="button"
          aria-label="Open Spotlight"
          onClick={onOpenSpotlight}
          className="grid h-11 w-11 place-items-center rounded-md hover:bg-surface-tertiary"
        >
          <Search size={14} />
        </button>
      </div>
    </header>
  );
}
