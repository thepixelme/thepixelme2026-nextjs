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
