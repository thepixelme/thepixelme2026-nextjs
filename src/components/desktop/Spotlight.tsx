"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { APPS } from "@/components/apps/registry";
import { trackEvent } from "@/lib/analytics";
import { useWindowsDispatch } from "@/lib/windows-store";
import type { AppId } from "@/types/window";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function Spotlight({ open, onOpenChange }: Props) {
  const dispatch = useWindowsDispatch();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onOpenChange]);

  useEffect(() => {
    if (open) {
      previouslyFocusedRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setQuery("");
      setActiveIndex(0);
      previouslyFocusedRef.current?.focus();
      previouslyFocusedRef.current = null;
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return APPS;
    return APPS.filter((a) => a.title.toLowerCase().includes(q));
  }, [query]);

  const onQueryChange = (value: string) => {
    setQuery(value);
    setActiveIndex(0);
  };

  const launch = (id: AppId) => {
    trackEvent({
      name: "spotlight_select",
      app_id: id,
      query_length: query.trim().length,
    });
    dispatch({ type: "OPEN", appId: id });
    onOpenChange(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const app = filtered[activeIndex];
      if (app) launch(app.id);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-start justify-center pt-[15vh]">
      <button
        type="button"
        aria-label="Close spotlight"
        onClick={() => onOpenChange(false)}
        className="absolute inset-0 cursor-default bg-backdrop"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Spotlight search"
        className="relative w-[min(640px,calc(100%-32px))] overflow-hidden rounded-2xl border border-separator bg-overlay shadow-overlay backdrop-blur-(--glass-blur)"
      >
        <div className="flex items-center gap-3 border-b border-separator px-4 py-3">
          <Search size={16} className="text-foreground/50" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Spotlight Search"
            aria-label="Spotlight search"
            aria-controls="spotlight-list"
            aria-activedescendant={
              filtered[activeIndex]
                ? `spotlight-item-${filtered[activeIndex].id}`
                : undefined
            }
            className="flex-1 bg-transparent text-base outline-none placeholder:text-foreground/40"
          />
        </div>
        <div
          id="spotlight-list"
          role="listbox"
          aria-label="Apps"
          className="max-h-[50vh] overflow-y-auto p-1"
        >
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-foreground/50">
              No results
            </div>
          )}
          {filtered.map((app, i) => {
            const Icon = app.icon;
            const isActive = i === activeIndex;
            return (
              <button
                key={app.id}
                id={`spotlight-item-${app.id}`}
                type="button"
                role="option"
                aria-selected={isActive}
                tabIndex={-1}
                onMouseMove={() => setActiveIndex(i)}
                onClick={() => launch(app.id)}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${
                  isActive ? "bg-default" : ""
                }`}
              >
                <Icon size={16} />
                <span>{app.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
