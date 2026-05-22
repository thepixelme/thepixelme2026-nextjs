"use client";

import { AnimatePresence } from "motion/react";
import { useState } from "react";
import Spotlight from "@/components/desktop/Spotlight";
import Wallpaper from "@/components/desktop/Wallpaper";
import { useWindows, useWindowsDispatch } from "@/lib/windows-store";
import AppSheet from "./AppSheet";
import HomeIndicator from "./HomeIndicator";
import MobileDock from "./MobileDock";
import MobileStatusBar from "./MobileStatusBar";

export default function MobileShell() {
  const { windows } = useWindows();
  const dispatch = useWindowsDispatch();
  const [spotlightOpen, setSpotlightOpen] = useState(false);

  // Sort ascending by z so the highest-z sheet renders last (and visually stacks on top).
  // DOM position reorders whenever z changes (e.g. raising an existing window via OPEN);
  // key={win.id} preserves each AppSheet's component identity and motion state through
  // those reorders, so app-local state is never reset by a stacking change.
  const stack = [...windows].sort((a, b) => a.z - b.z);
  const visible = stack.filter((w) => !w.minimized);
  const topId = visible.length ? visible[visible.length - 1].id : null;
  const hasVisible = topId !== null;

  const goHome = () => {
    for (const w of visible) dispatch({ type: "MINIMIZE", id: w.id });
  };

  return (
    <>
      <Wallpaper />
      <MobileStatusBar onOpenSpotlight={() => setSpotlightOpen(true)} />
      <MobileDock hidden={hasVisible} />
      <AnimatePresence>
        {stack.map((win, i) => (
          <AppSheet
            key={win.id}
            win={win}
            isActive={win.id === topId}
            stackIndex={i}
          />
        ))}
      </AnimatePresence>
      <HomeIndicator onGoHome={goHome} disabled={!hasVisible} />
      <Spotlight open={spotlightOpen} onOpenChange={setSpotlightOpen} />
    </>
  );
}
