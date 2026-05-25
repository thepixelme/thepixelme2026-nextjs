"use client";

import { Search, User } from "lucide-react";
import { useMemo } from "react";
import { useNow } from "@/lib/clock";
import { useNotificationCenter } from "@/lib/notification-center";
import { useWindowsDispatch } from "@/lib/windows-store";

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
  const dispatch = useWindowsDispatch();

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-between
                 bg-surface backdrop-blur-(--glass-blur) border-b border-separator px-5
                 h-[calc(2.75rem+env(safe-area-inset-top))]
                 pt-[env(safe-area-inset-top)]"
    >
      <button
        type="button"
        aria-label="Nhat, open About"
        onClick={() => dispatch({ type: "OPEN", appId: "about" })}
        className="-ml-1.5 flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-medium hover:bg-surface-tertiary"
      >
        <User size={14} />
        <span className="font-semibold">Nhat</span>
      </button>
      <div className="-mr-2 flex items-center gap-3">
        <button
          type="button"
          aria-label="Open Spotlight"
          onClick={onOpenSpotlight}
          className="grid h-11 w-11 place-items-center rounded-md hover:bg-surface-tertiary"
        >
          <Search size={14} />
        </button>
        {ANALYTICS_ENABLED ? (
          <button
            type="button"
            aria-label={
              shortTime
                ? `${shortTime}, toggle analytics preference`
                : "Toggle analytics preference"
            }
            onClick={toggleNotificationCenter}
            className="rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums hover:bg-surface-tertiary"
          >
            {shortTime}
          </button>
        ) : (
          <span className="text-xs font-medium tabular-nums">{shortTime}</span>
        )}
      </div>
    </header>
  );
}
