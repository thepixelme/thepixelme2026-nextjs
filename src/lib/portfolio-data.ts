export interface Photo {
  src: string;
  alt: string;
  caption?: string;
}

export interface Social {
  label: string;
  href: string;
  brand: "github";
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
      items: [
        "JavaScript",
        "TypeScript",
        "React",
        "React Native",
        "Node.js",
        "PostgreSQL",
      ],
    },
    {
      category: "Cloud & Scaling",
      items: ["AWS/DevOps", "CI/CD Pipeline", "System Architecture"],
    },
    {
      category: "Business & Product",
      items: [
        "Product Strategy & Roadmapping",
        "Agile Leadership",
        "User-Centric Design",
      ],
    },
  ],
};

export const SOCIALS: Social[] = [
  { label: "GitHub", href: "https://github.com/thepixelme", brand: "github" },
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
