export interface Project {
  id: string;
  title: string;
  year: number;
  tags: string[];
  summary: string;
  description: string;
  link?: string;
  image?: string;
}

export interface ResumeEntry {
  kind: "job" | "education";
  org: string;
  role: string;
  start: string;
  end: string;
  bullets: string[];
}

export interface Photo {
  src: string;
  alt: string;
  caption?: string;
}

export interface Social {
  label: string;
  href: string;
  brand: "github" | "x" | "dribbble" | "instagram";
}

export const ABOUT = {
  name: "Nhat Nguyen",
  handle: "thepixelme",
  title: "Bridging the Gap Between Business Vision and Technical Reality",
  location: "USA, Earth",
  email: "nhat@thepixelme.com",
  bio: "I am a Full-Stack Engineer and Product Strategist who builds with a commercial mindset. I specialize in architecting systems where technical decisions drive business growth, transforming abstract requirements into robust, high-performance digital ecosystems.",
  skills: [
    {
      category: "Core Tech",
      items: ["JavaScript", "TypeScript", "React", "React Native", "Node.js", "PostgreSQL"],
    },
    {
      category: "Cloud & Scaling",
      items: ["AWS/DevOps", "CI/CD Pipeline", "System Architecture"],
    },
    {
      category: "Business & Product",
      items: [
        "Product Strategy",
        "Technical ROI Analysis",
        "Agile Leadership",
        "User-Centric Design",
      ],
    },
  ],
};

export const SOCIALS: Social[] = [
  { label: "GitHub", href: "https://github.com/thepixelme", brand: "github" },
  { label: "X", href: "https://x.com/thepixelme", brand: "x" },
  {
    label: "Dribbble",
    href: "https://dribbble.com/thepixelme",
    brand: "dribbble",
  },
  {
    label: "Instagram",
    href: "https://instagram.com/thepixelme",
    brand: "instagram",
  },
];

export const PROJECTS: Project[] = [
  {
    id: "atlas",
    title: "Atlas — design system",
    year: 2025,
    tags: ["Design system", "React", "TypeScript"],
    summary: "120-component design system shipped across 4 product surfaces.",
    description:
      "Atlas is a design system used by four product teams. It shipped 120 React components, a token pipeline, and a Figma library. Reduced PR review time by 38%.",
    link: "https://example.com/atlas",
  },
  {
    id: "harbor",
    title: "Harbor — finance dashboard",
    year: 2025,
    tags: ["Product design", "Data viz"],
    summary: "Real-time analytics for a fintech with 200k MAU.",
    description:
      "Designed and built the dashboard surface, including 14 chart types, real-time websocket updates, and an opinionated empty-state system.",
  },
  {
    id: "fern",
    title: "Fern — note taking",
    year: 2024,
    tags: ["Product design", "Native"],
    summary: "Calm, plaintext-first note-taking app for macOS.",
    description:
      "A side project. Markdown-first, fully keyboard-driven, with a custom outline view. Shipped to 8k users.",
  },
  {
    id: "ortus",
    title: "Ortus — booking flow",
    year: 2024,
    tags: ["Conversion", "Front-end"],
    summary: "Rebuilt a hotel chain's booking flow; +18% conversion.",
    description:
      "End-to-end redesign of a 7-step booking flow into 3 steps. Built with Next.js + Tailwind. Conversion lifted 18%, abandon rate dropped 22%.",
  },
  {
    id: "voya",
    title: "Voya — travel guide",
    year: 2023,
    tags: ["Editorial", "CMS"],
    summary: "Editorial travel site with a custom CMS.",
    description:
      "Mobile-first long-form articles with custom map embeds. Sanity-powered CMS for the editorial team.",
  },
  {
    id: "circuit",
    title: "Circuit — runner watch face",
    year: 2023,
    tags: ["Wearable", "Motion"],
    summary: "Watch face for Wear OS runners. 200k installs.",
    description:
      "A minimal, glanceable watch face designed for running outdoors. Optimized for daylight legibility.",
  },
];

export const RESUME: ResumeEntry[] = [
  {
    kind: "job",
    org: "ThePixelMe Studio",
    role: "Founder, Design & Engineering",
    start: "2022",
    end: "Present",
    bullets: [
      "Lead design and front-end engineering for 8+ shipped products.",
      "Built a reusable design-system pipeline used across all client work.",
      "Speaker at three regional design conferences on motion in product UI.",
    ],
  },
  {
    kind: "job",
    org: "Acme Co.",
    role: "Senior Product Designer",
    start: "2019",
    end: "2022",
    bullets: [
      "Owned the design language for the flagship B2B product (1.2M MAU).",
      "Partnered with engineering on a tokens-first rebuild that cut UI bugs ~40%.",
    ],
  },
  {
    kind: "education",
    org: "Queensland University of Technology",
    role: "BFA, Interactive & Visual Design",
    start: "2014",
    end: "2017",
    bullets: [
      "First-class honours. Capstone in motion design for accessibility.",
    ],
  },
];

export const PHOTOS: Photo[] = [
  {
    src: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=1200",
    alt: "Soft gradient sky",
    caption: "Atlas brand visual",
  },
  {
    src: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1200",
    alt: "Geometric abstract",
    caption: "Harbor pitch deck",
  },
  {
    src: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1200",
    alt: "Coastline aerial",
    caption: "Voya editorial",
  },
  {
    src: "https://images.unsplash.com/photo-1494172961521-33799ddd43a5?w=1200",
    alt: "Desk overhead",
    caption: "Studio life",
  },
  {
    src: "https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?w=1200",
    alt: "Neon lights",
    caption: "Circuit launch",
  },
  {
    src: "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=1200",
    alt: "Pastel geometry",
    caption: "Fern marketing site",
  },
];
