"use client";

import { APPS } from "@/components/apps/registry";
import { useWindows, useWindowsDispatch } from "@/lib/windows-store";
import DockIcon from "./DockIcon";

export default function Dock() {
  const { windows } = useWindows();
  const dispatch = useWindowsDispatch();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center">
      <div className="pointer-events-auto flex items-end gap-3 rounded-2xl border border-separator bg-surface-secondary px-3 pb-2 pt-3 shadow-overlay backdrop-blur-(--glass-blur)">
        {APPS.filter((app) => !app.hideFromDock).map((app) => {
          const isOpen = windows.some((w) => w.appId === app.id);
          return (
            <DockIcon
              key={app.id}
              appId={app.id}
              icon={app.icon}
              label={app.title}
              open={isOpen}
              onClick={() => dispatch({ type: "OPEN", appId: app.id })}
            />
          );
        })}
      </div>
    </div>
  );
}
