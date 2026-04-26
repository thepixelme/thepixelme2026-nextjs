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

  const getRect = useCallback((appId: AppId) => {
    const el = refs.current.get(appId);
    return el ? el.getBoundingClientRect() : null;
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
