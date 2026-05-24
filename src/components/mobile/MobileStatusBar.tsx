"use client";

import { Battery, Search, Wifi } from "lucide-react";
import { useMemo } from "react";
import { useNow } from "@/lib/clock";
import { useNotificationCenter } from "@/lib/notification-center";

const SHORT_FORMAT = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

// Inlined at build time (NEXT_PUBLIC_*). When unset, the clock stays plain
// text — mobile has no NC panel to open empty, so making it a button would
// be an invisible no-op.
const ANALYTICS_ENABLED = Boolean(process.env.NEXT_PUBLIC_GA_ID);

interface Props {
  onOpenSpotlight: () => void;
}

export default function MobileStatusBar({ onOpenSpotlight }: Props) {
  const now = useNow();
  const shortTime = useMemo(() => (now ? SHORT_FORMAT.format(now) : ""), [now]);
  const { toggle: toggleNotificationCenter } = useNotificationCenter();

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-between
                 bg-surface backdrop-blur-(--glass-blur) border-b border-separator px-5
                 h-[calc(2.75rem+env(safe-area-inset-top))]
                 pt-[env(safe-area-inset-top)]"
    >
      {ANALYTICS_ENABLED ? (
        <button
          type="button"
          aria-label="Toggle Analytics preference"
          onClick={toggleNotificationCenter}
          className="-ml-1.5 rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums hover:bg-surface-tertiary"
        >
          {shortTime}
        </button>
      ) : (
        <span className="text-xs font-medium tabular-nums">{shortTime}</span>
      )}
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
