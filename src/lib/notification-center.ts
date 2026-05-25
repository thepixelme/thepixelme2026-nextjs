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
  persistent: boolean;
  setPersistent: (persistent: boolean) => void;
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
  const [persistent, setPersistentState] = useState(false);
  const persistentRef = useRef(false);

  const setOpen = useCallback((next: boolean) => {
    setOpenState((prev) => {
      // Refuse close while persistent. Open is always allowed.
      if (persistentRef.current && prev && !next) return prev;
      return next;
    });
  }, []);

  const toggle = useCallback(() => {
    setOpenState((prev) => {
      // Refuse toggle-to-close while persistent. Toggle-to-open is allowed.
      if (persistentRef.current && prev) return prev;
      return !prev;
    });
  }, []);

  const setPersistent = useCallback((next: boolean) => {
    persistentRef.current = next;
    setPersistentState(next);
  }, []);

  const value = useMemo<NotificationCenterValue>(
    () => ({ open, toggle, setOpen, persistent, setPersistent }),
    [open, toggle, setOpen, persistent, setPersistent],
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
