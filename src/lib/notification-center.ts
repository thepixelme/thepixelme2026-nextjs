"use client";

import {
  createContext,
  createElement,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

interface NotificationCenterValue {
  open: boolean;
  toggle: () => void;
  setOpen: (open: boolean) => void;
  locked: boolean;
  setLocked: (locked: boolean) => void;
}

const NotificationCenterContext = createContext<NotificationCenterValue | null>(
  null,
);

export function NotificationCenterProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [open, setOpenState] = useState(false);
  const [locked, setLockedState] = useState(false);
  const lockedRef = useRef(false);

  const setOpen = useCallback((next: boolean) => {
    setOpenState((prev) => {
      // Refuse close while locked. Open is always allowed.
      if (lockedRef.current && prev && !next) return prev;
      return next;
    });
  }, []);

  const toggle = useCallback(() => {
    setOpenState((prev) => {
      // Refuse toggle-to-close while locked. Toggle-to-open is allowed.
      if (lockedRef.current && prev) return prev;
      return !prev;
    });
  }, []);

  const setLocked = useCallback((next: boolean) => {
    lockedRef.current = next;
    setLockedState(next);
  }, []);

  const value = useMemo<NotificationCenterValue>(
    () => ({ open, toggle, setOpen, locked, setLocked }),
    [open, toggle, setOpen, locked, setLocked],
  );
  return createElement(NotificationCenterContext.Provider, { value }, children);
}

export function useNotificationCenter() {
  const ctx = useContext(NotificationCenterContext);
  if (!ctx)
    throw new Error(
      "useNotificationCenter must be used inside NotificationCenterProvider",
    );
  return ctx;
}
