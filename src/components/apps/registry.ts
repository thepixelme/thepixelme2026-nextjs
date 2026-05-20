import {
  Eye,
  FolderOpen,
  Mail,
  Settings,
  Terminal as TerminalIcon,
  User,
} from "lucide-react";
import type { AppDef } from "@/types/window";
import AboutApp from "./AboutApp";
import ContactApp from "./ContactApp";
import FinderApp from "./FinderApp";
import PreviewApp from "./PreviewApp";
import SettingsApp from "./SettingsApp";
import TerminalApp from "./TerminalApp";

export const APPS: AppDef[] = [
  {
    id: "finder",
    title: "Finder",
    icon: FolderOpen,
    defaultSize: { w: 880, h: 560 },
    Component: FinderApp,
  },
  {
    id: "preview",
    title: "Preview",
    icon: Eye,
    defaultSize: { w: 1024, h: 720 },
    hideFromDock: true,
    Component: PreviewApp,
  },
  {
    id: "about",
    title: "About Me",
    icon: User,
    defaultSize: { w: 560, h: 680 },
    Component: AboutApp,
  },
  {
    id: "contact",
    title: "Contact",
    icon: Mail,
    defaultSize: { w: 720, h: 620 },
    Component: ContactApp,
  },
  {
    id: "terminal",
    title: "Terminal",
    icon: TerminalIcon,
    defaultSize: { w: 640, h: 420 },
    Component: TerminalApp,
  },
  {
    id: "settings",
    title: "System Settings",
    icon: Settings,
    defaultSize: { w: 720, h: 560 },
    Component: SettingsApp,
  },
];
