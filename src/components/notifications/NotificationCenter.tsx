"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Children, type ReactNode, useEffect, useId, useRef } from "react";
import { useNotificationCenter } from "@/lib/notification-center";

interface Props {
  /** First-actionable element inside the panel — focused on open. If not provided, the close X is focused. Note: when `persistent`, the X is not rendered, so callers that rely on the fallback get a silent no-op. */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  children?: ReactNode;
}

export default function NotificationCenter({
  initialFocusRef,
  children,
}: Props) {
  const { open, setOpen, persistent } = useNotificationCenter();
  const reduceMotion = useReducedMotion();
  const headingId = useId();
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  // Esc to close (only while open)
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  // Focus capture / restore (mirrors Spotlight)
  useEffect(() => {
    if (open) {
      previouslyFocusedRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      requestAnimationFrame(() => {
        const target = initialFocusRef?.current ?? closeButtonRef.current;
        target?.focus();
      });
    } else {
      const prev = previouslyFocusedRef.current;
      previouslyFocusedRef.current = null;
      if (prev && document.contains(prev)) {
        // Don't steal focus from an underlying control the user moved to
        // while the panel was non-blocking (persistent mode allows
        // click-through). Only restore if focus is still captive — inside
        // the panel or on body.
        const active = document.activeElement;
        const focusStillCaptive =
          active === document.body ||
          active === null ||
          (active instanceof Node && panelRef.current?.contains(active));
        if (focusStillCaptive) prev.focus();
      }
    }
  }, [open, initialFocusRef]);

  const isEmpty = Children.count(children) === 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Transparent backdrop — closes on click, doesn't dim (matches macOS).
              Suppressed while persistent so the rest of the page stays interactive. */}
          {!persistent && (
            <button
              type="button"
              aria-label="Close Notification Center"
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 cursor-default bg-transparent"
            />
          )}
          <motion.aside
            ref={panelRef}
            aria-labelledby={headingId}
            className="fixed right-3 top-10 bottom-3 z-50 flex w-90 flex-col gap-3 overflow-y-auto p-3"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 320, damping: 32 }
            }
          >
            <header className="flex items-center justify-between">
              <h2 id={headingId} className="text-sm font-semibold">
                Notification Center
              </h2>
              {!persistent && (
                <button
                  ref={closeButtonRef}
                  type="button"
                  aria-label="Close Notification Center"
                  onClick={() => setOpen(false)}
                  className="grid h-7 w-7 place-items-center rounded-md text-foreground/60 hover:bg-surface-tertiary hover:text-foreground"
                >
                  <X size={14} />
                </button>
              )}
            </header>
            {isEmpty ? (
              <p className="px-1 text-xs text-foreground/50">
                No new notifications
              </p>
            ) : (
              children
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
