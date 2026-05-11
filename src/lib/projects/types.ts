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
  tags: string[];
  summary: string;
  description: string;
  link?: string;
  linkLabel?: string;
  source?: string;
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
