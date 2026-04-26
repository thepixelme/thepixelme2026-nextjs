"use client";

import { useState } from "react";
import WindowManager from "@/components/window/WindowManager";
import { WindowsProvider } from "@/lib/windows-store";
import DesktopContextMenu from "./DesktopContextMenu";
import Dock from "./Dock";
import MenuBar from "./MenuBar";
import Spotlight from "./Spotlight";
import Wallpaper from "./Wallpaper";

export default function Desktop() {
  const [spotlightOpen, setSpotlightOpen] = useState(false);

  return (
    <WindowsProvider>
      <div className="relative h-full w-full overflow-hidden">
        <Wallpaper />
        <MenuBar onOpenSpotlight={() => setSpotlightOpen(true)} />
        <DesktopContextMenu>
          <span className="sr-only">Desktop</span>
        </DesktopContextMenu>
        <WindowManager />
        <Dock />
        <Spotlight open={spotlightOpen} onOpenChange={setSpotlightOpen} />
      </div>
    </WindowsProvider>
  );
}
