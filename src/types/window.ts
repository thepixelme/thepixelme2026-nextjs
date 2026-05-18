import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";

export type AppId =
  | "finder"
  | "preview"
  | "about"
  | "contact"
  | "terminal"
  | "photos"
  | "settings";

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
  Component: ComponentType<{ windowId: string }>;
}
