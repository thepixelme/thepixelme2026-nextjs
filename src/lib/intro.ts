"use client";

import { useSyncExternalStore } from "react";

// Keep in sync with the `intro`, `intro-device`, `intro-phone` and
// `intro-tablet` custom variants in globals.css.
export const LAPTOP_INTRO_QUERY =
  "(min-width: 1024px) and (prefers-reduced-motion: no-preference) and (min-aspect-ratio: 5/4)";
export const DEVICE_INTRO_QUERY =
  "(orientation: portrait) and (prefers-reduced-motion: no-preference)";

let finished = false;
const listeners = new Set<() => void>();

// The camera is computed with CSS pow(); without it the intro is skipped.
const supported = () => CSS.supports("scale", "pow(2, 1)");

function subscribe(listener: () => void) {
  const queries = [LAPTOP_INTRO_QUERY, DEVICE_INTRO_QUERY].map((q) =>
    window.matchMedia(q),
  );
  listeners.add(listener);
  for (const mq of queries) mq.addEventListener("change", listener);
  return () => {
    listeners.delete(listener);
    for (const mq of queries) mq.removeEventListener("change", listener);
  };
}

function getSnapshot() {
  return (
    !finished &&
    supported() &&
    (window.matchMedia(LAPTOP_INTRO_QUERY).matches ||
      window.matchMedia(DEVICE_INTRO_QUERY).matches)
  );
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
