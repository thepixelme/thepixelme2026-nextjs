"use client";

import { Maximize2, Minus, Plus } from "lucide-react";
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

const ZOOM_MIN = 0.05;
const ZOOM_MAX = 40;
const ZOOM_STEP = 1.2;

export function ImageView({
  screenshot,
  index,
  total,
}: {
  screenshot: Screenshot;
  index?: number;
  total?: number;
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState<Mode>("fit");
  const [naturalSize, setNaturalSize] = useState<{
    w: number;
    h: number;
  } | null>(null);
  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    panX: number;
    panY: number;
    startX: number;
    startY: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      )
        return;

      if (e.key === "0" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setMode("fit");
        setZoom(1);
        setPan({ x: 0, y: 0 });
        return;
      }
      if (e.key === "1" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (fitScale > 0) {
          setMode("actual");
          setZoom(1 / fitScale);
          setPan({ x: 0, y: 0 });
        }
        return;
      }
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        setMode("custom");
        setZoom((z) => Math.min(ZOOM_MAX, z * ZOOM_STEP));
        return;
      }
      if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        setMode("custom");
        setZoom((z) => Math.max(ZOOM_MIN, z / ZOOM_STEP));
        return;
      }
      if (e.key === "Escape") {
        setMode("fit");
        setZoom(1);
        setPan({ x: 0, y: 0 });
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fitScale]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - rect.width / 2;
      const mouseY = e.clientY - rect.top - rect.height / 2;
      const factor = Math.exp(-e.deltaY / 200);

      setZoom((prevZoom) => {
        const nextZoom = Math.max(
          ZOOM_MIN,
          Math.min(ZOOM_MAX, prevZoom * factor),
        );
        const ratio = nextZoom / prevZoom;
        setPan((prevPan) => ({
          x: mouseX - (mouseX - prevPan.x) * ratio,
          y: mouseY - (mouseY - prevPan.y) * ratio,
        }));
        return nextZoom;
      });
      setMode("custom");
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if (zoom <= 1) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      panX: pan.x,
      panY: pan.y,
      startX: e.clientX,
      startY: e.clientY,
    };
    setIsDragging(true);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    setPan({
      x: d.panX + (e.clientX - d.startX),
      y: d.panY + (e.clientY - d.startY),
    });
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    dragRef.current = null;
    setIsDragging(false);
  };

  const onDoubleClick = () => {
    if (mode === "actual") {
      setMode("fit");
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } else if (fitScale > 0) {
      setMode("actual");
      setZoom(1 / fitScale);
      setPan({ x: 0, y: 0 });
    }
  };

  const zoomIn = () => {
    setMode("custom");
    setZoom((z) => Math.min(ZOOM_MAX, z * ZOOM_STEP));
  };
  const zoomOut = () => {
    setMode("custom");
    setZoom((z) => Math.max(ZOOM_MIN, z / ZOOM_STEP));
  };
  const fit = () => {
    setMode("fit");
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  const actual = () => {
    if (fitScale <= 0) return;
    setMode("actual");
    setZoom(1 / fitScale);
    setPan({ x: 0, y: 0 });
  };

  const zoomPercent = Math.round(displayScale * 100);
  const canPan = zoom > 1;
  const showCounter = typeof index === "number" && typeof total === "number";

  return (
    <div className="flex h-full flex-col">
      {/** biome-ignore lint/a11y/noStaticElementInteractions: canvas surface; keyboard handled at window level */}
      <div
        ref={canvasRef}
        className={`relative min-h-0 flex-1 overflow-hidden bg-surface-tertiary ${
          canPan ? (isDragging ? "cursor-grabbing" : "cursor-grab") : ""
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
        style={{
          backgroundImage:
            "linear-gradient(45deg, rgba(0,0,0,0.04) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.04) 75%), linear-gradient(45deg, rgba(0,0,0,0.04) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.04) 75%)",
          backgroundSize: "16px 16px",
          backgroundPosition: "0 0, 8px 8px",
        }}
      >
        <img
          src={screenshot.src}
          alt={screenshot.alt}
          draggable={false}
          onLoad={(e) => {
            const img = e.currentTarget;
            setNaturalSize({
              w: img.naturalWidth,
              h: img.naturalHeight,
            });
          }}
          className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
          style={{
            width: naturalSize?.w,
            height: naturalSize?.h,
            transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${displayScale})`,
            transformOrigin: "center",
            willChange: isDragging ? "transform" : undefined,
            visibility: naturalSize ? "visible" : "hidden",
          }}
        />

        <div className="absolute right-3 bottom-3 flex items-center gap-0.5 rounded-full border border-field-border bg-surface px-1 py-1 shadow-overlay backdrop-blur-(--glass-blur)">
          <ZoomBtn label="Zoom out" onClick={zoomOut}>
            <Minus size={14} />
          </ZoomBtn>
          <ZoomBtn label="Zoom in" onClick={zoomIn}>
            <Plus size={14} />
          </ZoomBtn>
          <span className="mx-1 h-4 w-px bg-separator" aria-hidden="true" />
          <ZoomBtn label="Fit to window" onClick={fit} active={mode === "fit"}>
            <Maximize2 size={13} />
          </ZoomBtn>
          <ZoomBtn
            label="Actual size"
            onClick={actual}
            active={mode === "actual"}
          >
            <span className="px-1 font-mono text-[11px] font-semibold tabular-nums">
              1:1
            </span>
          </ZoomBtn>
        </div>
      </div>

      <div className="flex h-7 items-center gap-3 border-t border-separator bg-surface-secondary px-3 text-[11px] text-foreground/65">
        {showCounter && (
          <>
            <span className="tabular-nums">
              {(index as number) + 1} of {total}
            </span>
            <span className="text-foreground/30">·</span>
          </>
        )}
        {naturalSize && (
          <>
            <span className="tabular-nums">
              {naturalSize.w}×{naturalSize.h}
            </span>
            <span className="text-foreground/30">·</span>
          </>
        )}
        <span className="tabular-nums">{zoomPercent}%</span>
        {screenshot.alt && (
          <span className="ml-auto truncate text-foreground/55">
            {screenshot.alt}
          </span>
        )}
      </div>
    </div>
  );
}

function ZoomBtn({
  label,
  onClick,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`grid h-7 min-w-7 place-items-center rounded-full px-1.5 transition-colors ${
        active
          ? "bg-default text-foreground"
          : "text-foreground/80 hover:bg-default/60"
      }`}
    >
      {children}
    </button>
  );
}
