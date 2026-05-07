"use client";

import { Eye, Info, PanelLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { PROJECTS } from "@/lib/projects";
import { useWindows } from "@/lib/windows-store";
import { CaseStudy } from "./preview/CaseStudy";
import { ImageView } from "./preview/ImageViewer";

type View = "info" | number;

export default function PreviewApp({ windowId }: { windowId: string }) {
  const { windows } = useWindows();
  const win = windows.find((w) => w.id === windowId);
  const payload = win?.initialPayload as { projectId?: string } | undefined;
  const project = payload?.projectId
    ? PROJECTS.find((p) => p.id === payload.projectId)
    : undefined;

  if (!project) {
    return (
      <div className="grid h-full place-items-center bg-surface-tertiary text-sm text-foreground/60">
        <div className="flex flex-col items-center gap-3">
          <Eye size={32} className="text-foreground/30" />
          <p>No project selected</p>
        </div>
      </div>
    );
  }

  return <PreviewContent key={project.id} project={project} />;
}

function PreviewContent({
  project,
}: {
  project: NonNullable<ReturnType<typeof PROJECTS.find>>;
}) {
  const screenshots = project.screenshots ?? [];
  const [view, setView] = useState<View>("info");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (screenshots.length === 0) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      )
        return;
      if (typeof view !== "number") return;
      if (e.key === "ArrowRight" && view < screenshots.length - 1) {
        e.preventDefault();
        setView(view + 1);
      } else if (e.key === "ArrowLeft" && view > 0) {
        e.preventDefault();
        setView(view - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, screenshots.length]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center border-b border-separator bg-surface px-2">
        <button
          type="button"
          onClick={() => setSidebarOpen((s) => !s)}
          aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          aria-pressed={sidebarOpen}
          className="grid h-7 w-7 place-items-center rounded-md text-foreground/75 hover:bg-default"
        >
          <PanelLeft size={14} />
        </button>
      </div>

      <div
        className={`grid min-h-0 flex-1 ${
          sidebarOpen
            ? "grid-cols-[176px_1fr] divide-x divide-separator"
            : "grid-cols-[1fr]"
        }`}
      >
        {sidebarOpen && (
          <aside className="flex flex-col gap-2 overflow-y-auto bg-surface-secondary p-2">
            <button
              type="button"
              onClick={() => setView("info")}
              aria-label="Show project info"
              aria-current={view === "info"}
              className={`flex aspect-video w-full flex-col items-center justify-center gap-1.5 overflow-hidden rounded-md border-2 bg-surface-tertiary text-foreground/75 transition-colors ${
                view === "info"
                  ? "border-accent"
                  : "border-transparent hover:border-field-border"
              }`}
            >
              <Info size={20} />
              <span className="text-[10px] font-medium tracking-wide">
                Project Info
              </span>
            </button>

            {screenshots.length > 0 && (
              <hr className="my-1 border-0 border-t border-separator" />
            )}

            {screenshots.map((s, i) => (
              <button
                key={s.src}
                type="button"
                onClick={() => setView(i)}
                aria-label={`Show ${s.alt}`}
                aria-current={view === i}
                className={`block aspect-video w-full overflow-hidden rounded-md border-2 transition-colors ${
                  view === i
                    ? "border-accent"
                    : "border-transparent hover:border-field-border"
                }`}
              >
                <img
                  src={s.src}
                  alt={s.alt}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </aside>
        )}

        {view === "info" ? (
          <div className="overflow-y-auto">
            <CaseStudy
              project={project}
              onScreenshotClick={(i) => setView(i)}
            />
          </div>
        ) : (
          <ImageView
            key={view}
            screenshot={screenshots[view]}
            index={view}
            total={screenshots.length}
          />
        )}
      </div>
    </div>
  );
}
