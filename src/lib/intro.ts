"use client";

import { useSyncExternalStore } from "react";

// Keep in sync with the `intro` custom variant in globals.css.
export const INTRO_MEDIA_QUERY =
  "(min-width: 1024px) and (prefers-reduced-motion: no-preference) and (min-aspect-ratio: 5/4)";

let finished = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  const mq = window.matchMedia(INTRO_MEDIA_QUERY);
  listeners.add(listener);
  mq.addEventListener("change", listener);
  return () => {
    listeners.delete(listener);
    mq.removeEventListener("change", listener);
  };
}

function getSnapshot() {
  return !finished && window.matchMedia(INTRO_MEDIA_QUERY).matches;
}

// Pending until the client can check the media query, so nothing (e.g. the
// consent auto-open) races ahead of the intro during hydration.
function getServerSnapshot() {
  return true;
}

export function useIntroPending(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function finishIntro() {
  if (finished) return;
  finished = true;
  for (const listener of listeners) listener();
}
