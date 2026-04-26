"use client";

import { useEffect, useState } from "react";

const FORMATTER = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  hour: "numeric",
  minute: "2-digit",
});

export function useClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const tick = () => setNow(new Date());
    const ms = 60_000 - (Date.now() % 60_000);
    const t = setTimeout(() => {
      tick();
      const id = setInterval(tick, 60_000);
      return () => clearInterval(id);
    }, ms);
    return () => clearTimeout(t);
  }, []);

  return now ? FORMATTER.format(now) : "";
}
