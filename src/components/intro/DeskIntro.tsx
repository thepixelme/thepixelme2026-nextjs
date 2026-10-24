"use client";

import { ChevronDown } from "lucide-react";
import {
  animate,
  type MotionStyle,
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { type ReactNode, useCallback, useEffect, useRef } from "react";
import { finishIntro, useIntroPending } from "@/lib/intro";
import { ABOUT } from "@/lib/portfolio-data";
import { easeInOut } from "./camera";
import DeskScene from "./DeskScene";
import DeviceFrame from "./DeviceFrame";
import IntroWalkthrough from "./IntroWalkthrough";
import LaptopFrame from "./LaptopFrame";
import SceneBackdrop from "./SceneBackdrop";

// The device on the desk is a laptop on desktop screens and a phone or
// tablet on portrait ones. Which one, and where it rests, comes from the
// intro-* media variants and the camera variables in globals.css, so the
// server-rendered first frame matches whatever device hydrates.
export default function DeskIntro({ children }: { children: ReactNode }) {
  const active = useIntroPending();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: scrollerRef });
  const progress = useSpring(scrollYProgress, {
    stiffness: 260,
    damping: 40,
    restDelta: 0.0005,
  });

  const eased = useTransform(progress, easeInOut);
  const corners = useTransform(progress, [0.8, 1], [1, 0]);
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

  const enterClass =
    "intro-screen-corners absolute inset-0 cursor-zoom-in outline-offset-[0.6vw] focus-visible:outline-[0.3vw] focus-visible:outline-focus";

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
          {active && <SceneBackdrop eased={eased} />}
          {active && (
            <motion.header
              style={{ opacity: headlineOpacity, y: headlineY }}
              className="pointer-events-none absolute inset-x-0 top-[8%] flex flex-col items-center gap-3 px-8 text-center intro-phone:top-[4.5%] intro-phone:gap-2 intro-phone:px-6"
            >
              <p className="text-sm font-medium text-(--scene-ink-muted)">
                {ABOUT.name}
              </p>
              <h1 className="max-w-4xl text-balance text-4xl font-semibold tracking-tight text-(--scene-ink) xl:text-5xl intro-phone:text-[1.75rem] intro-phone:leading-tight">
                {ABOUT.title}
              </h1>
            </motion.header>
          )}
          <motion.div
            style={{ "--intro-e": eased } as MotionStyle}
            className={active ? "intro-stage absolute inset-0" : "contents"}
          >
            {active && <DeskScene />}
            {active && <LaptopFrame />}
            {active && <DeviceFrame part="body" />}
            <motion.div
              inert={active}
              style={{ "--intro-r": corners } as MotionStyle}
              className={
                active
                  ? "intro-screen-corners absolute inset-0 overflow-hidden [contain:paint]"
                  : "contents"
              }
            >
              {children}
              {active && <IntroWalkthrough />}
            </motion.div>
            {active && <DeviceFrame part="front" corners={corners} />}
            {active && (
              <>
                <button
                  type="button"
                  aria-label="Enter desktop"
                  onClick={zoomIn}
                  className={`${enterClass} intro-device:hidden`}
                />
                <button
                  type="button"
                  aria-label="Open the home screen"
                  onClick={zoomIn}
                  className={`${enterClass} hidden intro-device:block`}
                />
              </>
            )}
          </motion.div>
          {active && (
            <motion.p
              style={{ opacity: hintOpacity }}
              className="pointer-events-none absolute bottom-[4%] left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-separator bg-surface py-1.5 pr-2.5 pl-3.5 text-xs font-medium shadow-overlay backdrop-blur-(--glass-blur)"
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
