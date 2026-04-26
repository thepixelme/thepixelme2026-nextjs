"use client";

import { useEffect, useState } from "react";

export type ThemeMode = "glass-light" | "glass-dark";
const STORAGE_KEY = "portfolio:theme";

function applyTheme(mode: ThemeMode) {
  const html = document.documentElement;
  html.classList.remove("glass-light", "glass-dark");
  html.classList.add(mode);
}

export function useTheme(): [ThemeMode, (m: ThemeMode) => void] {
  const [mode, setMode] = useState<ThemeMode>("glass-light");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored === "glass-light" || stored === "glass-dark") {
      setMode(stored);
      applyTheme(stored);
    }
  }, []);

  const update = (m: ThemeMode) => {
    setMode(m);
    localStorage.setItem(STORAGE_KEY, m);
    applyTheme(m);
  };

  return [mode, update];
}
