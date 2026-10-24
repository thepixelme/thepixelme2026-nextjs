"use client";

import { useEffect, useState } from "react";
import LaptopIntro from "@/components/intro/LaptopIntro";
import MobileShell from "@/components/mobile/MobileShell";
import { DockIconPositionsProvider } from "@/components/window/dock-positions";
import WindowManager from "@/components/window/WindowManager";
import { useIntroPending } from "@/lib/intro";
import { useIsMobile } from "@/lib/useIsMobile";
import { useWindowsDispatch, WindowsProvider } from "@/lib/windows-store";
import Dock from "./Dock";
import MenuBar from "./MenuBar";
import Spotlight from "./Spotlight";
import Wallpaper from "./Wallpaper";

// Delay so visitors watch About open on the laptop screen.
const INTRO_ABOUT_DELAY_MS = 700;

function DesktopBody() {
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const introPending = useIntroPending();
  const dispatch = useWindowsDispatch();

  useEffect(() => {
    if (!introPending) return;
    const timer = setTimeout(
      () => dispatch({ type: "OPEN", appId: "about", silent: true }),
      INTRO_ABOUT_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [introPending, dispatch]);

  return (
    <DockIconPositionsProvider>
      <div data-desktop-root className="relative h-full w-full overflow-hidden">
        <Wallpaper />
        <MenuBar onOpenSpotlight={() => setSpotlightOpen(true)} />
        <WindowManager />
        <Dock />
        <Spotlight open={spotlightOpen} onOpenChange={setSpotlightOpen} />
      </div>
    </DockIconPositionsProvider>
  );
}

function ShellSwitch() {
  const isMobile = useIsMobile();

  if (isMobile === null) {
    // CSS picks the server-rendered first frame so it matches what hydrates:
    // the laptop intro where it will play, the bare wallpaper everywhere else.
    return (
      <div className="relative h-full w-full overflow-hidden">
        <div className="intro:hidden">
          <Wallpaper />
        </div>
        <div className="hidden h-full intro:block">
          <LaptopIntro>
            <Wallpaper />
          </LaptopIntro>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="relative h-full w-full overflow-hidden">
        <MobileShell />
      </div>
    );
  }

  return (
    <LaptopIntro>
      <DesktopBody />
    </LaptopIntro>
  );
}

export default function Desktop() {
  return (
    <WindowsProvider>
      <ShellSwitch />
    </WindowsProvider>
  );
}
