"use client";

import { APPS } from "@/components/apps/registry";
import { useWindows } from "@/lib/windows-store";
import Window from "./Window";

export default function WindowManager() {
  const { windows } = useWindows();

  return (
    <>
      {windows
        .filter((w) => !w.minimized)
        .map((w) => {
          const def = APPS.find((a) => a.id === w.appId);
          if (!def) return null;
          const App = def.Component;
          return (
            <Window key={w.id} win={w}>
              <App windowId={w.id} />
            </Window>
          );
        })}
    </>
  );
}
