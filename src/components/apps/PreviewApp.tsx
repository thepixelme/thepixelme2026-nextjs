"use client";

import { Eye, Info, PanelLeft } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { PROJECTS } from "@/lib/projects";
import { useIsMobile } from "@/lib/useIsMobile";
import { useWindows } from "@/lib/windows-store";
import { CaseStudy } from "./preview/CaseStudy";
import { ImageView } from "./preview/ImageViewer";
import { MobileImageViewer } from "./preview/MobileImageViewer";

type View = "info" | number;

// Where a screenshot was opened from: a case-study thumb, a sidebar thumb, or
// moving through the viewer (arrow keys, swipe, filmstrip).
type ScreenshotSource = "case_study" | "sidebar" | "viewer";

const SCROLL_MILESTONES = [25, 50, 75, 100] as const;

// Callback ref for the case study's scroll container. Sends case_study_scroll
// once per milestone for this project; milestones already reached stay
// reached when the visitor flips to a screenshot and back.
function useCaseStudyScrollDepth(projectId: string) {
  const reached = useRef(new Set<number>());
  return useCallback(
    (el: HTMLDivElement | null) => {
      if (!el) return;
      const onScroll = () => {
        const max = el.scrollHeight - el.clientHeight;
        if (max <= 0) return;
        const percent = (el.scrollTop / max) * 100;
        for (const milestone of SCROLL_MILESTONES) {
          // 1% slack so a sub-pixel scrollTop still counts as the bottom.
          if (percent < milestone - 1 || reached.current.has(milestone))
            continue;
          reached.current.add(milestone);
          trackEvent({
            name: "case_study_scroll",
            project_id: projectId,
            percent_scrolled: milestone,
          });
        }
      };
      el.addEventListener("scroll", onScroll, { passive: true });
      return () => el.removeEventListener("scroll", onScroll);
    },
    [projectId],
  );
}

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
  const isPortrait = project.orientation === "portrait";
  const [view, setView] = useState<View>("info");
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth >= 1024;
  });
  const caseStudyScrollRef = useCaseStudyScrollDepth(project.id);

  const showScreenshot = (index: number, source: ScreenshotSource) => {
    if (index === view) return;
    trackEvent({
      name: "screenshot_view",
      project_id: project.id,
      screenshot_index: index + 1,
      opened_from: source,
    });
    setView(index);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: showScreenshot only reads `view` and `project.id`, both covered (the project is fixed for this keyed component).
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
        showScreenshot(view + 1, "viewer");
      } else if (e.key === "ArrowLeft" && view > 0) {
        e.preventDefault();
        showScreenshot(view - 1, "viewer");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, screenshots.length]);

  if (isMobile === true) {
    if (view === "info") {
      return (
        <div ref={caseStudyScrollRef} className="h-full overflow-y-auto">
          <CaseStudy
            project={project}
            onScreenshotClick={(i) => showScreenshot(i, "case_study")}
          />
        </div>
      );
    }
    return (
      <MobileImageViewer
        screenshots={screenshots}
        index={view}
        isPortrait={isPortrait}
        onClose={() => setView("info")}
        onIndexChange={(i) => showScreenshot(i, "viewer")}
      />
    );
  }

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
              className={`flex aspect-square w-full shrink-0 flex-col items-center justify-center gap-2 overflow-hidden rounded-md border-2 bg-surface-tertiary text-foreground/75 transition-colors ${
                view === "info"
                  ? "border-accent text-foreground"
                  : "border-transparent hover:border-field-border"
              }`}
            >
              <Info size={28} />
              <span className="text-xs font-medium">Project Info</span>
            </button>

            {screenshots.length > 0 && (
              <hr className="my-1 border-0 border-t border-separator" />
            )}

            <div
              className={
                isPortrait
                  ? "flex shrink-0 flex-col items-center gap-2"
                  : "flex shrink-0 flex-col gap-2"
              }
            >
              {screenshots.map((s, i) => (
                <button
                  key={s.src}
                  type="button"
                  onClick={() => showScreenshot(i, "sidebar")}
                  aria-label={`Show ${s.alt}`}
                  aria-current={view === i}
                  className={`block ${isPortrait ? "aspect-9/19 w-24" : "aspect-video w-full"} overflow-hidden rounded-md border-2 transition-colors ${
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
            </div>
          </aside>
        )}

        {view === "info" ? (
          <div ref={caseStudyScrollRef} className="overflow-y-auto">
            <CaseStudy
              project={project}
              onScreenshotClick={(i) => showScreenshot(i, "case_study")}
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
