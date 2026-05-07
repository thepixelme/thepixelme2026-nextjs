"use client";

import { buttonVariants } from "@heroui/styles";
import { ArrowLeft, ExternalLink, X } from "lucide-react";
import { Fragment, type ReactNode, useEffect, useState } from "react";
import { siGithub } from "simple-icons";
import BrandIcon from "@/components/BrandIcon";
import type { Highlight, Project, Screenshot } from "@/lib/projects";

export function ProjectDetail({
  project,
  onBack,
}: {
  project: Project;
  onBack: () => void;
}) {
  const hasMeta = !!project.role || !!project.stack?.length || !!project.status;
  const linkLabel = project.linkLabel ?? "Visit project";
  const screenshots = project.screenshots ?? [];
  const heroScreenshot = screenshots[0];
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const activeScreenshot =
    lightboxIndex !== null ? screenshots[lightboxIndex] : null;

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-separator px-4 py-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to projects"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md hover:bg-default"
        >
          <ArrowLeft size={14} />
        </button>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
          {project.title}
        </span>
        {project.link && (
          <a
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`${buttonVariants({ variant: "secondary", size: "sm" })} ml-auto shrink-0 no-underline`}
          >
            {linkLabel}
            <ExternalLink size={11} className="ml-1.5" />
          </a>
        )}
      </div>
      <div className="overflow-auto">
        <div className="mx-auto max-w-2xl px-8 pt-6 pb-12">
          {heroScreenshot ? (
            <button
              type="button"
              onClick={() => setLightboxIndex(0)}
              aria-label={`Open ${heroScreenshot.alt}`}
              className="block w-full overflow-hidden rounded-xl border border-field-border bg-surface-secondary/40"
            >
              <img
                src={heroScreenshot.src}
                alt={heroScreenshot.alt}
                className="aspect-video w-full object-cover"
              />
            </button>
          ) : (
            <div className="grid aspect-video place-items-center rounded-xl bg-linear-to-br from-[oklch(0.78_0.13_240)] to-[oklch(0.65_0.18_310)] text-5xl font-semibold text-white">
              {project.title.slice(0, 1)}
            </div>
          )}

          <h1 className="mt-6 text-2xl font-semibold leading-tight tracking-tight">
            {project.title}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-foreground/75">
            {project.summary}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {project.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-default px-2.5 py-1 text-[11px] font-medium text-foreground/75"
              >
                {t}
              </span>
            ))}
          </div>

          {(project.link || project.source) && (
            <div className="mt-6 flex flex-wrap gap-2">
              {project.link && (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${buttonVariants({ variant: "secondary" })} no-underline`}
                >
                  {linkLabel}
                  <ExternalLink size={14} className="ml-1.5" />
                </a>
              )}
              {project.source && (
                <a
                  href={project.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${buttonVariants({ variant: "tertiary" })} no-underline`}
                >
                  <BrandIcon icon={siGithub} size={14} className="mr-1.5" />
                  View source
                </a>
              )}
            </div>
          )}

          {hasMeta && <MetaStrip project={project} />}

          {project.description && (
            <div className="mt-8 text-sm leading-relaxed text-foreground/85">
              {renderInline(project.description)}
            </div>
          )}

          {project.problem && (
            <Section title="The problem">
              <Prose text={project.problem} />
            </Section>
          )}

          {screenshots.length > 0 && (
            <Section title="Screenshots">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {screenshots.map((s, i) => (
                  <button
                    key={s.src}
                    type="button"
                    onClick={() => setLightboxIndex(i)}
                    aria-label={`Open ${s.alt}`}
                    className="group relative aspect-video overflow-hidden rounded-md border border-field-border bg-surface-secondary/40"
                  >
                    <img
                      src={s.src}
                      alt={s.alt}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </button>
                ))}
              </div>
            </Section>
          )}

          {project.highlights && project.highlights.length > 0 && (
            <Section title="Engineering highlights">
              <div className="flex flex-col gap-4">
                {project.highlights.map((h, i) => (
                  <HighlightCard key={h.title} index={i + 1} highlight={h} />
                ))}
              </div>
            </Section>
          )}

          {project.designNotes && (
            <Section title="Design">
              <Prose text={project.designNotes} />
            </Section>
          )}

          {project.learnings && project.learnings.length > 0 && (
            <Section title="What I learned">
              <ul className="flex flex-col gap-3">
                {project.learnings.map((l) => (
                  <li
                    key={l.lead}
                    className="text-sm leading-relaxed text-foreground/80"
                  >
                    <span className="font-semibold text-foreground">
                      {l.lead}
                    </span>{" "}
                    {renderInline(l.body)}
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      </div>
      {activeScreenshot && (
        <Lightbox
          screenshot={activeScreenshot}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}

function Lightbox({
  screenshot,
  onClose,
}: {
  screenshot: Screenshot;
  onClose: () => void;
}) {
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Esc-to-close handled by parent useEffect
    <div
      role="dialog"
      aria-modal="true"
      aria-label={screenshot.alt}
      className="fixed inset-0 z-60 grid place-items-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      {/** biome-ignore lint/a11y/noStaticElementInteractions: stopPropagation only; not a focus target */}
      {/** biome-ignore lint/a11y/useKeyWithClickEvents: stopPropagation only */}
      <div
        className="relative max-h-[85vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close screenshot"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-full bg-black/40 text-white hover:bg-black/60"
        >
          <X size={14} />
        </button>
        <img
          src={screenshot.src}
          alt={screenshot.alt}
          className="max-h-[85vh] max-w-[90vw] rounded-md object-contain shadow-2xl"
        />
      </div>
    </div>
  );
}

function MetaStrip({ project }: { project: Project }) {
  const rows: { label: string; value: ReactNode }[] = [];
  if (project.role) rows.push({ label: "Role", value: project.role });
  if (project.stack?.length) {
    rows.push({
      label: "Stack",
      value: (
        <div className="flex flex-wrap gap-1.5">
          {project.stack.map((s) => (
            <span
              key={s}
              className="rounded-md border border-field-border bg-surface/60 px-2 py-0.5 font-mono text-[11px] text-foreground/85"
            >
              {s}
            </span>
          ))}
        </div>
      ),
    });
  }
  if (project.status) rows.push({ label: "Status", value: project.status });

  return (
    <div className="mt-6 grid grid-cols-[72px_1fr] gap-x-4 gap-y-3 rounded-xl border border-field-border bg-surface-secondary/40 p-5">
      {rows.map((r) => (
        <Fragment key={r.label}>
          <div className="pt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/50">
            {r.label}
          </div>
          <div className="min-w-0 text-sm text-foreground/85">{r.value}</div>
        </Fragment>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/50">
        {title}
      </h2>
      {children}
    </section>
  );
}

function HighlightCard({
  index,
  highlight,
}: {
  index: number;
  highlight: Highlight;
}) {
  return (
    <div className="rounded-xl border border-field-border bg-surface-secondary/40 p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-field-border bg-surface text-[11px] font-semibold tabular-nums text-foreground/75">
          {index}
        </span>
        <h3 className="pt-0.5 text-sm font-semibold leading-snug">
          {highlight.title}
        </h3>
      </div>
      <div className="mt-3 sm:pl-9">
        <Prose text={highlight.body} />
        {highlight.code && (
          <pre className="mt-4 overflow-x-auto rounded-md border border-field-border bg-surface-tertiary/60 p-3 font-mono text-[11px] leading-relaxed text-foreground/90">
            <code>{highlight.code}</code>
          </pre>
        )}
      </div>
    </div>
  );
}

function Prose({ text }: { text: string }) {
  const paragraphs = text.split("\n\n");
  return (
    <div className="flex flex-col gap-3 text-sm leading-relaxed text-foreground/80">
      {paragraphs.map((p, i) => (
        <p key={`${i}-${p.slice(0, 16)}`}>{renderInline(p)}</p>
      ))}
    </div>
  );
}

function renderInline(text: string): ReactNode {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g);
  return parts.map((part, i) => {
    if (!part) return null;
    const key = `${i}-${part.slice(0, 8)}`;
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={key}
          className="rounded bg-surface-tertiary/60 px-1 py-px font-mono text-[12px] text-foreground/95"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={key} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <em key={key} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}
