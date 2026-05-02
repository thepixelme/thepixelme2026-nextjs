import {
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Mail,
  Settings,
  Terminal as TerminalIcon,
  User,
} from "lucide-react";
import type { AppDef } from "@/types/window";
import AboutApp from "./AboutApp";
import ContactApp from "./ContactApp";
import FinderApp from "./FinderApp";
import PhotosApp from "./PhotosApp";
import ResumeApp from "./ResumeApp";
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
    id: "about",
    title: "About Me",
    icon: User,
    defaultSize: { w: 640, h: 720 },
    Component: AboutApp,
  },
  {
    id: "resume",
    title: "Resume",
    icon: FileText,
    defaultSize: { w: 720, h: 800 },
    Component: ResumeApp,
  },
  {
    id: "contact",
    title: "Contact",
    icon: Mail,
    defaultSize: { w: 520, h: 520 },
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
    id: "photos",
    title: "Photos",
    icon: ImageIcon,
    defaultSize: { w: 880, h: 600 },
    Component: PhotosApp,
  },
  {
    id: "settings",
    title: "System Settings",
    icon: Settings,
    defaultSize: { w: 720, h: 560 },
    Component: SettingsApp,
  },
];
