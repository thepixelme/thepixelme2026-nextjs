"use client";

import { ChevronDown } from "lucide-react";
import {
  animate,
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { type ReactNode, useCallback, useEffect, useRef } from "react";
import { finishIntro, useIntroPending } from "@/lib/intro";
import { ABOUT } from "@/lib/portfolio-data";
import { stageScale, stageY } from "./camera";
import DeskScene from "./DeskScene";
import IntroWalkthrough from "./IntroWalkthrough";
import LaptopFrame from "./LaptopFrame";
import SceneBackdrop from "./SceneBackdrop";

const SCREEN_RADIUS_VW = 0.7;

export default function LaptopIntro({ children }: { children: ReactNode }) {
  const active = useIntroPending();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: scrollerRef });
  const progress = useSpring(scrollYProgress, {
    stiffness: 260,
    damping: 40,
    restDelta: 0.0005,
  });

  const scale = useTransform(progress, stageScale);
  const y = useTransform(progress, (p) => `${stageY(p)}vh`);
  const screenRadius = useTransform(
    progress,
    [0.8, 1],
    [`${SCREEN_RADIUS_VW}vw`, "0vw"],
  );
  const headlineOpacity = useTransform(progress, [0, 0.2], [1, 0]);
  const headlineY = useTransform(progress, [0, 0.2], [0, -32]);
  const hintOpacity = useTransform(progress, [0, 0.08], [1, 0]);

  useMotionValueEvent(progress, "change", (p) => {
    if (active && p > 0.995) finishIntro();
  });

  const zoomIn = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    animate(el.scrollTop, el.scrollHeight - el.clientHeight, {
      duration: 1.2,
      ease: [0.65, 0, 0.35, 1],
      onUpdate: (v) => {
        el.scrollTop = v;
      },
    });
  }, []);

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+K skips straight in so Spotlight opens on a live desktop.
      if (
        e.key === "Escape" ||
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")
      ) {
        finishIntro();
        return;
      }
      if (e.target !== document.body) return;
      if (["ArrowDown", "PageDown", "End", " ", "Enter"].includes(e.key)) {
        e.preventDefault();
        zoomIn();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, zoomIn]);

  // Once finished, every wrapper collapses to `display: contents` so the
  // desktop keeps its tree position (no remount) and lays out exactly as it
  // would without the intro.
  return (
    <div
      ref={scrollerRef}
      className={
        active
          ? "relative h-full overflow-y-auto overscroll-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : "contents"
      }
    >
      <div className={active ? "h-[280vh]" : "contents"}>
        <div
          className={active ? "sticky top-0 h-dvh overflow-hidden" : "contents"}
        >
          {active && <SceneBackdrop progress={progress} />}
          {active && (
            <motion.header
              style={{ opacity: headlineOpacity, y: headlineY }}
              className="pointer-events-none absolute inset-x-0 top-[8vh] flex flex-col items-center gap-3 px-8 text-center"
            >
              <p className="text-sm font-medium text-(--scene-ink-muted)">
                {ABOUT.name}
              </p>
              <h1 className="max-w-4xl text-balance text-4xl font-semibold tracking-tight text-(--scene-ink) xl:text-5xl">
                {ABOUT.title}
              </h1>
            </motion.header>
          )}
          <motion.div
            style={{ scale, y }}
            className={active ? "absolute inset-0" : "contents"}
          >
            {active && <DeskScene />}
            {active && <LaptopFrame />}
            <motion.div
              inert={active}
              style={{
                borderTopLeftRadius: screenRadius,
                borderTopRightRadius: screenRadius,
              }}
              className={
                active
                  ? "absolute inset-0 overflow-hidden [contain:paint]"
                  : "contents"
              }
            >
              {children}
              {active && <IntroWalkthrough />}
            </motion.div>
            {active && (
              <button
                type="button"
                aria-label="Enter desktop"
                onClick={zoomIn}
                className="absolute inset-0 cursor-zoom-in rounded-t-[0.7vw] outline-offset-[0.6vw] focus-visible:outline-[0.3vw] focus-visible:outline-focus"
              />
            )}
          </motion.div>
          {active && (
            <motion.p
              style={{ opacity: hintOpacity }}
              className="pointer-events-none absolute bottom-[4vh] left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-separator bg-surface py-1.5 pr-2.5 pl-3.5 text-xs font-medium shadow-overlay backdrop-blur-(--glass-blur)"
            >
              <span className="pointer-coarse:hidden">Scroll to enter</span>
              <span className="hidden pointer-coarse:inline">
                Swipe up to enter
              </span>
              <motion.span
                animate={{ y: [0, 3, 0] }}
                transition={{
                  duration: 1.6,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              >
                <ChevronDown size={16} />
              </motion.span>
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
}
