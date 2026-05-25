"use client";

import { ChevronLeft } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Screenshot } from "@/lib/projects";

type Mode = "fit" | "actual" | "custom";

type GestureStart =
  | {
      kind: "drag";
      startX: number;
      startY: number;
      startTime: number;
      panX: number;
      panY: number;
      zoom: number;
    }
  | {
      kind: "pinch";
      pinchDist: number;
      panX: number;
      panY: number;
      zoom: number;
    };

const DISMISS_Y_THRESHOLD = 80;
const NAV_X_THRESHOLD = 60;
const TAP_MOVE_THRESHOLD = 5;
const TAP_DURATION_MS = 250;
const DOUBLE_TAP_MS = 300;
const ZOOM_MIN = 0.05;
const ZOOM_MAX = 40;

export function MobileImageViewer({
  screenshots,
  index,
  isPortrait,
  onClose,
  onIndexChange,
}: {
  screenshots: Screenshot[];
  index: number;
  isPortrait: boolean;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  const reduceMotion = useReducedMotion();
  const screenshot = screenshots[index];

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState<Mode>("fit");
  const [gesture, setGesture] = useState({ x: 0, y: 0, dismissOpacity: 1 });
  const [isDragging, setIsDragging] = useState(false);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gestureStart = useRef<GestureStart | null>(null);
  const lastTapAt = useRef(0);

  const [naturalSize, setNaturalSize] = useState<{
    w: number;
    h: number;
  } | null>(null);
  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const fitScale = useMemo(() => {
    if (!naturalSize || canvasSize.w === 0 || canvasSize.h === 0) return 1;
    return Math.min(
      canvasSize.w / naturalSize.w,
      canvasSize.h / naturalSize.h,
      1,
    );
  }, [naturalSize, canvasSize]);

  const displayScale = fitScale * zoom;

  useLayoutEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setCanvasSize({ w: r.width, h: r.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Full reset on index change — component stays mounted across screenshots
  // so filmstrip scroll position survives, but image-local state must not
  // bleed (otherwise the next image briefly renders with the previous fitScale).
  // biome-ignore lint/correctness/useExhaustiveDependencies: index is the trigger; body uses setters and refs
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setMode("fit");
    setGesture({ x: 0, y: 0, dismissOpacity: 1 });
    setIsDragging(false);
    setNaturalSize(null);
    gestureStart.current = null;
    pointers.current.clear();
  }, [index]);

  const activeThumbRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    activeThumbRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [reduceMotion]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 1) {
      gestureStart.current = {
        kind: "drag",
        startX: e.clientX,
        startY: e.clientY,
        startTime: performance.now(),
        panX: pan.x,
        panY: pan.y,
        zoom,
      };
      setIsDragging(true);
    } else if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      gestureStart.current = {
        kind: "pinch",
        pinchDist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        panX: pan.x,
        panY: pan.y,
        zoom,
      };
    }
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const start = gestureStart.current;
    if (!start) return;

    // Pinch — anchor all math to gestureStart snapshot, not closure state.
    if (start.kind === "pinch" && pointers.current.size === 2) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const [a, b] = Array.from(pointers.current.values());
      const midClientX = (a.x + b.x) / 2;
      const midClientY = (a.y + b.y) / 2;
      const currDist = Math.hypot(a.x - b.x, a.y - b.y) || 1;

      const nextZoom = Math.max(
        ZOOM_MIN,
        Math.min(ZOOM_MAX, start.zoom * (currDist / start.pinchDist)),
      );

      // Anchor the pinch midpoint (relative to canvas center) on the image.
      const midX = midClientX - rect.left - rect.width / 2;
      const midY = midClientY - rect.top - rect.height / 2;
      const scaleRatio = nextZoom / start.zoom;
      setPan({
        x: midX - (midX - start.panX) * scaleRatio,
        y: midY - (midY - start.panY) * scaleRatio,
      });
      setZoom(nextZoom);
      setMode("custom");
      return;
    }

    if (start.kind !== "drag") return;
    if (pointers.current.size !== 1) return;

    const dx = e.clientX - start.startX;
    const dy = e.clientY - start.startY;

    if (start.zoom > 1) {
      // Pan when zoomed in — read from snapshot, not closure pan.
      setPan({ x: start.panX + dx, y: start.panY + dy });
    } else {
      // Drag-to-dismiss / drag-to-navigate. Bounded opacity: upward drags
      // do not fade (downward only), and Math.min keeps it <= 1.
      const downward = Math.max(0, dy);
      const dismissOpacity = Math.max(0.4, Math.min(1, 1 - downward / 300));
      setGesture({ x: dx, y: dy, dismissOpacity });
    }
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    pointers.current.delete(e.pointerId);

    const start = gestureStart.current;
    if (!start) return;

    // Pinch ending. If one finger remains, hand off to a fresh drag snapshot
    // built from the committed pan/zoom and the surviving pointer position.
    if (start.kind === "pinch") {
      if (pointers.current.size === 1) {
        const [remaining] = Array.from(pointers.current.values());
        gestureStart.current = {
          kind: "drag",
          startX: remaining.x,
          startY: remaining.y,
          startTime: performance.now(),
          panX: pan.x,
          panY: pan.y,
          zoom,
        };
      } else if (pointers.current.size === 0) {
        gestureStart.current = null;
        setIsDragging(false);
      }
      return;
    }

    if (start.kind !== "drag") return;
    if (pointers.current.size > 0) return; // still gesturing with another finger

    setIsDragging(false);

    const dx = e.clientX - start.startX;
    const dy = e.clientY - start.startY;
    const dist = Math.hypot(dx, dy);
    const duration = performance.now() - start.startTime;

    // Swipe classification — only when not zoomed (panning has its own UX).
    if (start.zoom <= 1 && dist >= TAP_MOVE_THRESHOLD) {
      if (dy > DISMISS_Y_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
        onClose();
        // Don't reset gesture — viewer unmounts.
        return;
      }
      if (Math.abs(dx) > NAV_X_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
        // swipe-left → next, swipe-right → previous; clamped.
        const next =
          dx < 0
            ? Math.min(screenshots.length - 1, index + 1)
            : Math.max(0, index - 1);
        if (next !== index) onIndexChange(next);
        setGesture({ x: 0, y: 0, dismissOpacity: 1 });
        gestureStart.current = null;
        return;
      }
      // Sub-threshold movement — spring back.
      setGesture({ x: 0, y: 0, dismissOpacity: 1 });
      gestureStart.current = null;
      return;
    }

    const isTap = dist < TAP_MOVE_THRESHOLD && duration < TAP_DURATION_MS;
    if (!isTap) {
      gestureStart.current = null;
      return;
    }

    // Double-tap: toggle between fit and actual size.
    const now = performance.now();
    if (now - lastTapAt.current < DOUBLE_TAP_MS) {
      lastTapAt.current = 0;
      gestureStart.current = null;
      if (start.zoom > 1 || mode === "actual") {
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setMode("fit");
      } else if (fitScale > 0) {
        setZoom(1 / fitScale);
        setPan({ x: 0, y: 0 });
        setMode("actual");
      }
      return;
    }
    lastTapAt.current = now;
    gestureStart.current = null;
  };

  return (
    <div className="flex h-full flex-col bg-surface-tertiary">
      {/* Top bar — always visible. In-flow so it reserves space above the canvas. */}
      <div className="relative flex h-11 shrink-0 items-center border-b border-separator bg-surface">
        <button
          type="button"
          onClick={onClose}
          aria-label="Back to Project Info"
          className="flex h-11 items-center gap-1 px-3 text-sm font-medium text-foreground/85"
        >
          <ChevronLeft size={18} />
          Project Info
        </button>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 text-center text-sm tabular-nums text-foreground/75"
        >
          {index + 1} of {screenshots.length}
        </span>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative min-h-0 flex-1 touch-none select-none overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <motion.img
            src={screenshot.src}
            alt={screenshot.alt}
            draggable={false}
            className="max-w-none select-none"
            style={{
              width: naturalSize?.w,
              height: naturalSize?.h,
              transformOrigin: "center",
              visibility: naturalSize ? "visible" : "hidden",
            }}
            animate={{
              x: pan.x + gesture.x,
              y: pan.y + gesture.y,
              scale: displayScale,
              opacity: gesture.dismissOpacity,
            }}
            transition={
              isDragging
                ? { duration: 0 }
                : reduceMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 320, damping: 32 }
            }
            onLoad={(e) => {
              const img = e.currentTarget;
              setNaturalSize({
                w: img.naturalWidth,
                h: img.naturalHeight,
              });
            }}
          />
        </div>
      </div>

      {/* Filmstrip — always visible; hidden only when single screenshot. */}
      {screenshots.length > 1 && (
        <div className="flex h-16 shrink-0 gap-2 overflow-x-auto border-t border-separator bg-surface px-2 py-2">
          {screenshots.map((s, i) => (
            <button
              key={s.src}
              ref={i === index ? activeThumbRef : undefined}
              type="button"
              onClick={() => onIndexChange(i)}
              aria-label={`Show ${s.alt}`}
              aria-current={i === index}
              className={`block h-full shrink-0 overflow-hidden rounded-md border-2 ${
                isPortrait ? "aspect-9/19" : "aspect-video"
              } ${i === index ? "border-accent" : "border-transparent"}`}
            >
              <img
                src={s.src}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
