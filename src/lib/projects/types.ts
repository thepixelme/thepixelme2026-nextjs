export interface Highlight {
  title: string;
  body: string;
  code?: string;
}

export interface Learning {
  lead: string;
  body: string;
}

export interface Project {
  id: string;
  title: string;
  tags: string[];
  summary: string;
  description: string;
  link?: string;
  linkLabel?: string;
  source?: string;
  image?: string;
  role?: string;
  stack?: string[];
  status?: string;
  problem?: string;
  highlights?: Highlight[];
  designNotes?: string;
  learnings?: Learning[];
}
