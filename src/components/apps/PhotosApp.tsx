"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { PHOTOS } from "@/lib/portfolio-data";

export default function PhotosApp() {
  const [active, setActive] = useState<number | null>(null);
  const photo = active !== null ? PHOTOS[active] : null;

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  return (
    <>
      <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3">
        {PHOTOS.map((p, i) => (
          <button
            key={p.src}
            type="button"
            onClick={() => setActive(i)}
            className="group relative aspect-4/3 overflow-hidden rounded-md border border-field-border"
            aria-label={`Open ${p.alt}`}
          >
            <img
              src={p.src}
              alt={p.alt}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            {p.caption && (
              <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent p-2 text-left text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                {p.caption}
              </span>
            )}
          </button>
        ))}
      </div>

      {photo && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: Esc-to-close handled in useEffect above
        <div
          role="dialog"
          aria-modal="true"
          aria-label={photo.alt}
          className="fixed inset-0 z-60 grid place-items-center bg-black/70 backdrop-blur-sm"
          onClick={() => setActive(null)}
        >
          {/** biome-ignore lint/a11y/noStaticElementInteractions: stopPropagation only; not a focus target */}
          {/** biome-ignore lint/a11y/useKeyWithClickEvents: stopPropagation only */}
          <div
            className="relative max-h-[85vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close photo"
              onClick={() => setActive(null)}
              className="absolute right-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-full bg-black/40 text-white hover:bg-black/60"
            >
              <X size={14} />
            </button>
            <img
              src={photo.src}
              alt={photo.alt}
              className="max-h-[85vh] max-w-[90vw] rounded-md object-contain shadow-2xl"
            />
            {photo.caption && (
              <p className="mt-2 text-center text-sm text-white/90">
                {photo.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
