"use client";

import { useEffect, useRef } from "react";
import { APPS } from "@/components/apps/registry";
import { useWindowsDispatch } from "@/lib/windows-store";
import HomeIcon from "./HomeIcon";

interface Props {
  inert: boolean;
}

export default function HomeScreen({ inert }: Props) {
  const dispatch = useWindowsDispatch();
  const gridRef = useRef<HTMLDivElement>(null);
  const prevInert = useRef(inert);

  useEffect(() => {
    if (prevInert.current && !inert) {
      gridRef.current
        ?.querySelector<HTMLButtonElement>("button")
        ?.focus({ preventScroll: true });
    }
    prevInert.current = inert;
  }, [inert]);

  return (
    <section
      ref={gridRef}
      inert={inert}
      aria-hidden={inert}
      aria-label="Home screen"
      data-mobile-home
      className="grid grid-cols-4 gap-x-5 gap-y-7 px-6
                 pt-[calc(2.75rem+env(safe-area-inset-top)+1.5rem)]"
    >
      {APPS.filter((a) => !a.hideFromDock).map((app) => (
        <HomeIcon
          key={app.id}
          app={app}
          onLaunch={() => dispatch({ type: "OPEN", appId: app.id })}
        />
      ))}
    </section>
  );
}
