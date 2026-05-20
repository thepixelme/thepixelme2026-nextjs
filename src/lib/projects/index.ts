import { apipeek } from "./apipeek";
import { bonnevilleMobile } from "./bonneville-mobile";
import { claudeswitcher } from "./claudeswitcher";
import { heygrillhey } from "./heygrillhey";
import type { Project } from "./types";

export type {
  Highlight,
  Learning,
  Project,
  ProjectTag,
  Screenshot,
} from "./types";
export { PROJECT_TAGS } from "./types";

export const PROJECTS: Project[] = [
  claudeswitcher,
  bonnevilleMobile,
  heygrillhey,
  apipeek,
];
