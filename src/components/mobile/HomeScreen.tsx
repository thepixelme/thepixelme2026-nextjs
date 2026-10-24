"use client";

import { ChevronRight, FolderOpen, Mail, MapPin, User } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";
import ProjectThumbnail from "@/components/ProjectThumbnail";
import { ABOUT } from "@/lib/portfolio-data";
import { PROJECTS } from "@/lib/projects";
import { useWindowsDispatch } from "@/lib/windows-store";
import type { AppId } from "@/types/window";

const WIDGET =
  "rounded-3xl border border-field-border bg-surface shadow-overlay backdrop-blur-(--glass-blur)";

const INITIALS = ABOUT.name
  .split(" ")
  .map((word) => word[0])
  .join("");

interface Props {
  hidden: boolean;
}

export default function HomeScreen({ hidden }: Props) {
  const dispatch = useWindowsDispatch();
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const projectsId = useId();
  const open = (appId: AppId, payload?: unknown) =>
    dispatch({ type: "OPEN", appId, payload });

  return (
    <motion.main
      aria-hidden={hidden}
      inert={hidden}
      className="fixed inset-x-0 top-0 z-0 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
                 bottom-[calc(env(safe-area-inset-bottom)+7rem)] short:bottom-0"
      initial={false}
      animate={hidden ? { opacity: 0, scale: 0.94 } : { opacity: 1, scale: 1 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.25 }}
    >
      <div
        className="mx-auto flex min-h-full max-w-xl flex-col justify-center gap-3 px-4
                   pt-[calc(env(safe-area-inset-top)+3.75rem)] pb-4
                   landscape:grid landscape:max-w-4xl landscape:grid-cols-2 landscape:items-center
                   short:pt-[calc(env(safe-area-inset-top)+3.5rem)] short:pr-28
                   short:pb-[calc(env(safe-area-inset-bottom)+1.75rem)]
                   tablet:max-w-2xl tablet:gap-6 tablet:px-8 tablet:landscape:max-w-5xl"
      >
        <section
          aria-labelledby={titleId}
          className={`${WIDGET} p-4 tablet:p-8`}
        >
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-foreground tablet:size-11"
            >
              {INITIALS}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{ABOUT.name}</p>
              <p className="flex items-center gap-1 text-xs text-foreground/60">
                <MapPin size={12} /> {ABOUT.location}
              </p>
            </div>
          </div>
          <h1
            id={titleId}
            className="mt-3 text-balance text-2xl font-semibold tracking-tight tablet:mt-6 tablet:text-4xl"
          >
            {ABOUT.title}
          </h1>
          <div className="mt-4 grid grid-cols-2 gap-2 tablet:mt-8 tablet:max-w-sm">
            <button
              type="button"
              onClick={() => open("about")}
              className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-accent text-sm font-medium text-accent-foreground"
            >
              <User size={16} /> About me
            </button>
            <button
              type="button"
              onClick={() => open("contact")}
              className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-default text-sm font-medium"
            >
              <Mail size={16} /> Contact
            </button>
          </div>
        </section>

        <section
          aria-labelledby={projectsId}
          className={`${WIDGET} min-w-0 pt-1 pb-4 tablet:pt-4 tablet:pb-8`}
        >
          <div className="flex items-center justify-between pr-2 pl-4 tablet:pr-6 tablet:pl-8">
            <h2
              id={projectsId}
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground/60"
            >
              <FolderOpen size={14} /> Projects
            </h2>
            <button
              type="button"
              onClick={() => open("finder")}
              className="flex h-11 items-center gap-0.5 px-2 text-sm font-medium text-foreground/70"
            >
              See all <ChevronRight size={16} />
            </button>
          </div>
          <ul className="flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 [scrollbar-width:none] tablet:scroll-px-8 tablet:gap-4 tablet:px-8 [&::-webkit-scrollbar]:hidden">
            {PROJECTS.map((p) => (
              <li
                key={p.id}
                className="w-[62%] shrink-0 snap-start sm:w-56 short:w-48 tablet:w-64"
              >
                <button
                  type="button"
                  onClick={() => open("preview", { projectId: p.id })}
                  className="flex w-full flex-col gap-2 text-left"
                >
                  <ProjectThumbnail
                    project={p}
                    className="rounded-xl border border-separator"
                  />
                  <span className="line-clamp-2 text-sm font-medium leading-snug">
                    {p.title}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </motion.main>
  );
}
