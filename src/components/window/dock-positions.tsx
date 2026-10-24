"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from "react";
import type { AppId } from "@/types/window";

interface DockIconPositions {
  register: (appId: AppId, el: HTMLElement | null) => void;
  getRect: (appId: AppId) => DOMRect | null;
}

const DockIconPositionsContext = createContext<DockIconPositions | null>(null);

export function DockIconPositionsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const refs = useRef(new Map<AppId, HTMLElement>());

  const register = useCallback((appId: AppId, el: HTMLElement | null) => {
    if (el) refs.current.set(appId, el);
    else refs.current.delete(appId);
  }, []);

  // Relative to the desktop root, in its unscaled pixels, so window
  // animations still line up while the laptop intro scales the desktop.
  const getRect = useCallback((appId: AppId) => {
    const el = refs.current.get(appId);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const root = el.closest<HTMLElement>("[data-desktop-root]");
    if (!root) return rect;
    const rootRect = root.getBoundingClientRect();
    const k = rootRect.width / root.offsetWidth || 1;
    return new DOMRect(
      (rect.left - rootRect.left) / k,
      (rect.top - rootRect.top) / k,
      rect.width / k,
      rect.height / k,
    );
  }, []);

  const value = useMemo(() => ({ register, getRect }), [register, getRect]);

  return (
    <DockIconPositionsContext.Provider value={value}>
      {children}
    </DockIconPositionsContext.Provider>
  );
}

export function useRegisterDockIcon(appId: AppId) {
  const ctx = useContext(DockIconPositionsContext);
  return useCallback(
    (el: HTMLElement | null) => {
      ctx?.register(appId, el);
    },
    [ctx, appId],
  );
}

export function useDockIconRect() {
  const ctx = useContext(DockIconPositionsContext);
  return useCallback(
    (appId: AppId) => (ctx ? ctx.getRect(appId) : null),
    [ctx],
  );
}
