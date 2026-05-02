"use client";

import { Chip } from "@heroui/react";
import { Link2, MapPin, Wrench } from "lucide-react";
import { siDribbble, siGithub, siInstagram, siX } from "simple-icons";
import BrandIcon from "@/components/BrandIcon";
import { ABOUT, SOCIALS } from "@/lib/portfolio-data";

const BRANDS = {
  github: siGithub,
  x: siX,
  dribbble: siDribbble,
  instagram: siInstagram,
};

export default function AboutApp() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">{ABOUT.name}</h1>
        <p className="text-sm leading-relaxed text-foreground/70">
          {ABOUT.title}
        </p>
        <p className="mt-1 flex items-center gap-1 text-xs text-foreground/60">
          <MapPin size={12} /> {ABOUT.location}
        </p>
      </header>

      <p className="text-sm leading-relaxed text-foreground/80">{ABOUT.bio}</p>

      <section className="border-t border-separator pt-6">
        <h2 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground/60">
          <Wrench size={14} />
          Skills
        </h2>
        <div className="flex flex-col gap-3">
          {ABOUT.skills.map((group) => (
            <div key={group.category}>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground/50">
                {group.category}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.items.map((s) => (
                  <Chip key={s} size="sm" variant="secondary">
                    {s}
                  </Chip>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-separator pt-6">
        <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground/60">
          <Link2 size={14} />
          Find me
        </h2>
        <div className="flex flex-wrap gap-2">
          {SOCIALS.map((s) => (
            <a
              key={s.brand}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md border border-field-border bg-field-background px-3 py-1.5 text-xs hover:bg-default"
            >
              <BrandIcon icon={BRANDS[s.brand]} size={14} />
              {s.label}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
