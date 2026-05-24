"use client";

import {
  createContext,
  createElement,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

interface NotificationCenterValue {
  open: boolean;
  toggle: () => void;
  setOpen: (open: boolean) => void;
}

const NotificationCenterContext = createContext<NotificationCenterValue | null>(
  null,
);

export function NotificationCenterProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  const value = useMemo<NotificationCenterValue>(
    () => ({ open, toggle, setOpen }),
    [open, toggle],
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
