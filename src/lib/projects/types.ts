export const PROJECT_TAGS = [
  "App",
  "Web",
  "TypeScript",
  "Swift",
  "React",
  "React Native",
  "WordPress",
  "Shopify",
] as const;

export type ProjectTag = (typeof PROJECT_TAGS)[number];

export interface Highlight {
  title: string;
  body: string;
  code?: string;
}

export interface Learning {
  lead: string;
  body: string;
}

export interface Screenshot {
  src: string;
  alt: string;
}

export interface Project {
  id: string;
  title: string;
  tags: ProjectTag[];
  summary: string;
  description: string;
  link?: string;
  linkLabel?: string;
  source?: string;
  logo?: Screenshot;
  screenshots?: Screenshot[];
  role?: string;
  stack?: string[];
  status?: string;
  orientation?: "landscape" | "portrait";
  problem?: string;
  highlights?: Highlight[];
  designNotes?: string;
  learnings?: Learning[];
}
