"use client";

import { useLayoutEffect, useState } from "react";

// Narrow or portrait viewports get the touch shell. Keep in sync with the
// `mobile` custom variant in globals.css.
export const MOBILE_MEDIA_QUERY =
  "(max-width: 1023.98px), (orientation: portrait)";

export function useIsMobile(): boolean | null {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useLayoutEffect(() => {
    const mq = window.matchMedia(MOBILE_MEDIA_QUERY);
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isMobile;
}
