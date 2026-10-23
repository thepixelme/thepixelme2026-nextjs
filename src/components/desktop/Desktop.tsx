"use client";

import { useState } from "react";
import LaptopIntro from "@/components/intro/LaptopIntro";
import MobileShell from "@/components/mobile/MobileShell";
import { DockIconPositionsProvider } from "@/components/window/dock-positions";
import WindowManager from "@/components/window/WindowManager";
import { useIsMobile } from "@/lib/useIsMobile";
import { WindowsProvider } from "@/lib/windows-store";
import Dock from "./Dock";
import MenuBar from "./MenuBar";
import Spotlight from "./Spotlight";
import Wallpaper from "./Wallpaper";

function DesktopBody() {
  const [spotlightOpen, setSpotlightOpen] = useState(false);

  return (
    <DockIconPositionsProvider>
      <div className="relative h-full w-full overflow-hidden">
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
