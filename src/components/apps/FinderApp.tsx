"use client";

import { Star, Tag } from "lucide-react";
import { useMemo, useState } from "react";
import { PROJECT_TAGS, PROJECTS, type ProjectTag } from "@/lib/projects";
import { useWindowsDispatch } from "@/lib/windows-store";

type Filter = { kind: "all" } | { kind: "tag"; tag: ProjectTag };

export default function FinderApp() {
  const [filter, setFilter] = useState<Filter>({ kind: "all" });
  const dispatch = useWindowsDispatch();

  const visible = useMemo(() => {
    if (filter.kind === "all") return PROJECTS;
    return PROJECTS.filter((p) => p.tags.includes(filter.tag));
  }, [filter]);

  return (
    <div className="grid h-full grid-cols-1 grid-rows-[auto_1fr] divide-y divide-separator lg:grid-cols-[200px_1fr] lg:grid-rows-1 lg:divide-x lg:divide-y-0">
      <aside className="flex shrink-0 gap-2 overflow-x-auto bg-surface-secondary px-3 py-2 text-sm lg:block lg:overflow-auto lg:px-2 lg:py-3">
        <SidebarSection label="Favorites">
          <SidebarItem
            icon={<Star size={14} />}
            label="All Projects"
            active={filter.kind === "all"}
            onClick={() => setFilter({ kind: "all" })}
          />
        </SidebarSection>
        <SidebarSection label="Tags">
          {PROJECT_TAGS.map((t) => (
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {visible.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() =>
                dispatch({
                  type: "OPEN",
                  appId: "preview",
                  payload: { projectId: p.id },
                })
              }
              className="flex flex-col items-stretch rounded-lg border border-field-border bg-surface p-4 text-left transition-colors hover:bg-default"
            >
              <div className="mb-3 grid aspect-video w-full place-items-center overflow-hidden rounded-md bg-surface-secondary">
                {p.logo ? (
                  <img
                    src={p.logo.src}
                    alt={p.logo.alt}
                    loading="lazy"
                    className="h-3/4 w-3/4 object-contain"
                  />
                ) : p.screenshots?.[0] ? (
                  <img
                    src={p.screenshots[0].src}
                    alt={p.screenshots[0].alt}
                    loading="lazy"
                    className={
                      p.orientation === "portrait"
                        ? "h-full w-auto object-contain"
                        : "h-full w-full object-cover"
                    }
                  />
                ) : (
                  <span className="text-2xl font-semibold text-foreground/70">
                    {p.title.slice(0, 1)}
                  </span>
                )}
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
    <div className="contents lg:mb-4 lg:block">
      <p className="hidden lg:mb-1 lg:block lg:px-2 lg:text-[10px] lg:font-semibold lg:uppercase lg:tracking-wide lg:text-foreground/50">
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
      className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-2 py-1.5 text-sm lg:w-full ${
        active ? "bg-default font-medium" : "hover:bg-default/60"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
