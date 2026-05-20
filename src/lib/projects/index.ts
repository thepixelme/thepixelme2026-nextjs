import { apipeek } from "./apipeek";
import { bonnevilleMobile } from "./bonneville-mobile";
import { claudeswitcher } from "./claudeswitcher";
import { heygrillhey } from "./heygrillhey";
import type { Project } from "./types";

export type { Highlight, Learning, Project, Screenshot } from "./types";

export const PROJECTS: Project[] = [
  claudeswitcher,
  bonnevilleMobile,
  heygrillhey,
  apipeek,
];
