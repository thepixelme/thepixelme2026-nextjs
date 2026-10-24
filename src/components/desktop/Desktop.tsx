"use client";

import { useEffect, useState } from "react";
import DeskIntro from "@/components/intro/DeskIntro";
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

// Module state so About opens by itself once per page load, not again when
// the desktop remounts after a resize across the breakpoint.
let aboutAutoOpened = false;

function DesktopBody() {
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const introPending = useIntroPending();
  const dispatch = useWindowsDispatch();

  useEffect(() => {
    if (aboutAutoOpened) return;
    const timer = setTimeout(
      () => {
        aboutAutoOpened = true;
        dispatch({ type: "OPEN", appId: "about", silent: true });
      },
      introPending ? INTRO_ABOUT_DELAY_MS : 0,
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
    // the bare wallpaper for a desktop without the intro, the mobile shell
    // without it, or the desk intro (one copy, whose laptop, phone or tablet
    // is also picked by CSS) around the wallpaper or the mobile shell.
    return (
      <div className="relative h-full w-full overflow-hidden">
        <div className="mobile:hidden intro:hidden">
          <Wallpaper />
        </div>
        <div className="hidden mobile:block intro-device:hidden">
          <MobileShell />
        </div>
        <div className="hidden h-full intro:block intro-device:block">
          <DeskIntro>
            <div className="contents intro-device:hidden">
              <Wallpaper />
            </div>
            <div className="hidden intro-device:contents">
              <MobileShell />
            </div>
          </DeskIntro>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="relative h-full w-full overflow-hidden">
        <DeskIntro>
          <MobileShell />
        </DeskIntro>
      </div>
    );
  }

  return (
    <DeskIntro>
      <DesktopBody />
    </DeskIntro>
  );
}

export default function Desktop() {
  return (
    <WindowsProvider>
      <ShellSwitch />
    </WindowsProvider>
  );
}
