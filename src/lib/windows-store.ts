"use client";

import {
  createContext,
  createElement,
  type Dispatch,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from "react";
import { APPS } from "@/components/apps/registry";
import { trackEvent } from "@/lib/analytics";
import type { AppId, WindowBounds, WindowState } from "@/types/window";

interface State {
  windows: WindowState[];
  topZ: number;
  openCount: number;
}

type Action =
  | { type: "OPEN"; appId: AppId; payload?: unknown }
  | { type: "CLOSE"; id: string }
  | { type: "FOCUS"; id: string }
  | { type: "MOVE"; id: string; x: number; y: number }
  | { type: "RESIZE"; id: string; bounds: WindowBounds }
  | { type: "MINIMIZE"; id: string }
  | { type: "UNMINIMIZE"; id: string }
  | { type: "MAXIMIZE"; id: string; viewport: { w: number; h: number } }
  | { type: "RESTORE"; id: string };

const BASE_Z = 10;
const CASCADE = 24;

const initialState: State = {
  windows: [],
  topZ: BASE_Z,
  openCount: 0,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "OPEN": {
      const existing = state.windows.find((w) => w.appId === action.appId);
      if (existing) {
        const newZ = state.topZ + 1;
        return {
          ...state,
          topZ: newZ,
          windows: state.windows.map((w) =>
            w.id === existing.id
              ? {
                  ...w,
                  z: newZ,
                  minimized: false,
                  ...(action.payload !== undefined && {
                    initialPayload: action.payload,
                  }),
                }
              : w,
          ),
        };
      }
      const def = APPS.find((a) => a.id === action.appId);
      if (!def) return state;

      const vw = typeof window !== "undefined" ? window.innerWidth : 1440;
      const vh = typeof window !== "undefined" ? window.innerHeight : 900;
      const w = Math.min(def.defaultSize.w, vw - 80);
      const h = Math.min(def.defaultSize.h, vh - 160);
      const offset = state.openCount * CASCADE;
      const x = Math.max(20, Math.round((vw - w) / 2) + offset);
      const y = Math.max(40, Math.round((vh - h) / 2) - 40 + offset);

      const newZ = state.topZ + 1;
      const next: WindowState = {
        id: crypto.randomUUID(),
        appId: def.id,
        title: def.title,
        x,
        y,
        w,
        h,
        z: newZ,
        minimized: false,
        maximized: false,
        initialPayload: action.payload,
      };
      return {
        ...state,
        topZ: newZ,
        openCount: state.openCount + 1,
        windows: [...state.windows, next],
      };
    }

    case "CLOSE":
      return {
        ...state,
        windows: state.windows.filter((w) => w.id !== action.id),
      };

    case "FOCUS": {
      const target = state.windows.find((w) => w.id === action.id);
      if (!target || target.z === state.topZ) return state;
      const newZ = state.topZ + 1;
      return {
        ...state,
        topZ: newZ,
        windows: state.windows.map((w) =>
          w.id === action.id ? { ...w, z: newZ, minimized: false } : w,
        ),
      };
    }

    case "MOVE":
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === action.id ? { ...w, x: action.x, y: action.y } : w,
        ),
      };

    case "RESIZE":
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === action.id ? { ...w, ...action.bounds } : w,
        ),
      };

    case "MINIMIZE":
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === action.id ? { ...w, minimized: true } : w,
        ),
      };

    case "UNMINIMIZE": {
      const newZ = state.topZ + 1;
      return {
        ...state,
        topZ: newZ,
        windows: state.windows.map((w) =>
          w.id === action.id ? { ...w, minimized: false, z: newZ } : w,
        ),
      };
    }

    case "MAXIMIZE": {
      const target = state.windows.find((w) => w.id === action.id);
      if (!target || target.maximized) return state;
      const prev: WindowBounds = {
        x: target.x,
        y: target.y,
        w: target.w,
        h: target.h,
      };
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === action.id
            ? {
                ...w,
                prevBounds: prev,
                maximized: true,
                x: 0,
                y: 28,
                w: action.viewport.w,
                h: action.viewport.h - 28 - 96,
              }
            : w,
        ),
      };
    }

    case "RESTORE": {
      const target = state.windows.find((w) => w.id === action.id);
      if (!target || !target.maximized || !target.prevBounds) return state;
      const prev = target.prevBounds;
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === action.id
            ? {
                ...w,
                maximized: false,
                x: prev.x,
                y: prev.y,
                w: prev.w,
                h: prev.h,
                prevBounds: undefined,
              }
            : w,
        ),
      };
    }
  }
}

const StateContext = createContext<State | null>(null);
const DispatchContext = createContext<Dispatch<Action> | null>(null);

export function WindowsProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(reducer, initialState);
  const memoState = useMemo(() => state, [state]);

  const dispatch = useCallback<Dispatch<Action>>((action) => {
    if (action.type === "OPEN") {
      trackEvent({ name: "app_open", app_id: action.appId });
    }
    rawDispatch(action);
  }, []);

  return createElement(
    StateContext.Provider,
    { value: memoState },
    createElement(DispatchContext.Provider, { value: dispatch }, children),
  );
}

export function useWindows() {
  const ctx = useContext(StateContext);
  if (!ctx) throw new Error("useWindows must be used inside WindowsProvider");
  return ctx;
}

export function useWindowsDispatch() {
  const ctx = useContext(DispatchContext);
  if (!ctx)
    throw new Error("useWindowsDispatch must be used inside WindowsProvider");
  return ctx;
}
