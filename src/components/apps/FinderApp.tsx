"use client";

import { ArrowLeft, ExternalLink, FolderOpen, Star, Tag } from "lucide-react";
import { useMemo, useState } from "react";
import { PROJECTS, type Project } from "@/lib/portfolio-data";

type Filter =
  | { kind: "all" }
  | { kind: "year"; year: number }
  | { kind: "tag"; tag: string };

export default function FinderApp() {
  const [filter, setFilter] = useState<Filter>({ kind: "all" });
  const [selected, setSelected] = useState<Project | null>(null);

  const years = useMemo(
    () =>
      Array.from(new Set(PROJECTS.map((p) => p.year))).sort((a, b) => b - a),
    [],
  );
  const tags = useMemo(
    () => Array.from(new Set(PROJECTS.flatMap((p) => p.tags))).sort(),
    [],
  );

  const visible = useMemo(() => {
    if (filter.kind === "all") return PROJECTS;
    if (filter.kind === "year")
      return PROJECTS.filter((p) => p.year === filter.year);
    return PROJECTS.filter((p) => p.tags.includes(filter.tag));
  }, [filter]);

  if (selected) {
    return (
      <ProjectDetail project={selected} onBack={() => setSelected(null)} />
    );
  }

  return (
    <div className="grid h-full grid-cols-[200px_1fr] divide-x divide-separator">
      <aside className="overflow-auto bg-surface-secondary px-2 py-3 text-sm">
        <SidebarSection label="Favorites">
          <SidebarItem
            icon={<Star size={14} />}
            label="All Projects"
            active={filter.kind === "all"}
            onClick={() => setFilter({ kind: "all" })}
          />
        </SidebarSection>
        <SidebarSection label="Year">
          {years.map((y) => (
            <SidebarItem
              key={y}
              icon={<FolderOpen size={14} />}
              label={String(y)}
              active={filter.kind === "year" && filter.year === y}
              onClick={() => setFilter({ kind: "year", year: y })}
            />
          ))}
        </SidebarSection>
        <SidebarSection label="Tags">
          {tags.map((t) => (
            <SidebarItem
              key={t}
              icon={<Tag size={14} />}
              label={t}
              active={filter.kind === "tag" && filter.tag === t}
              onClick={() => setFilter({ kind: "tag", tag: t })}
            />
          ))}
        </SidebarSection>
      </aside>

      <div className="overflow-auto p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {visible.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p)}
              className="flex flex-col items-stretch rounded-lg border border-field-border bg-surface p-4 text-left transition-colors hover:bg-default"
            >
              <div className="mb-3 grid aspect-video place-items-center rounded-md bg-linear-to-br from-[oklch(0.78_0.13_240)] to-[oklch(0.65_0.18_310)] text-2xl font-semibold text-white">
                {p.title.slice(0, 1)}
              </div>
              <h3 className="text-sm font-semibold">{p.title}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-foreground/70">
                {p.summary}
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {p.tags.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-default px-2 py-0.5 text-[10px] font-medium text-foreground/70"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SidebarSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wide text-foreground/50">
        {label}
      </p>
      {children}
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
        active ? "bg-default font-medium" : "hover:bg-default/60"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ProjectDetail({
  project,
  onBack,
}: {
  project: Project;
  onBack: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-separator px-4 py-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to projects"
          className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-default"
        >
          <ArrowLeft size={14} />
        </button>
        <span className="text-sm font-semibold">{project.title}</span>
      </div>
      <div className="overflow-auto p-6">
        <div className="grid aspect-video place-items-center rounded-md bg-linear-to-br from-[oklch(0.78_0.13_240)] to-[oklch(0.65_0.18_310)] text-4xl font-semibold text-white">
          {project.title.slice(0, 1)}
        </div>
        <p className="mt-2 text-xs uppercase tracking-wide text-foreground/60">
          {project.year} · {project.tags.join(" · ")}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-foreground/80">
          {project.description}
        </p>
        {project.link && (
          <a
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-md border border-field-border bg-field-background px-3 py-1.5 text-xs font-medium hover:bg-default"
          >
            Visit project <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
}
