import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";

export type AppId = "finder" | "preview" | "about" | "contact" | "terminal";

/** The surface a visitor opened an app from; sent as `opened_from` with `app_open` and `project_view`. */
export type AppOpenSource =
  | "dock"
  | "menu_bar"
  | "spotlight"
  | "finder"
  | "home_screen"
  | "mobile_dock"
  | "status_bar";

export interface WindowBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WindowState extends WindowBounds {
  id: string;
  appId: AppId;
  title: string;
  z: number;
  minimized: boolean;
  maximized: boolean;
  prevBounds?: WindowBounds;
  initialPayload?: unknown;
}

export interface AppDef {
  id: AppId;
  title: string;
  icon: LucideIcon;
  defaultSize: { w: number; h: number };
  minSize?: { w: number; h: number };
  hideFromDock?: boolean;
  desktopOnly?: boolean;
  Component: ComponentType<{ windowId: string }>;
}
