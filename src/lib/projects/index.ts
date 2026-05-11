import { apipeek } from "./apipeek";
import { bonnevilleMobile } from "./bonneville-mobile";
import type { Project } from "./types";

export type { Highlight, Learning, Project, Screenshot } from "./types";

export const PROJECTS: Project[] = [bonnevilleMobile, apipeek];
