"use client";

import { useEffect, useState } from "react";

const FALLBACK_GRADIENT =
  "radial-gradient(ellipse at top, oklch(0.85 0.08 240) 0%, oklch(0.92 0.03 250) 45%, oklch(0.97 0.0029 264.54) 100%)";

const STORAGE_KEY = "portfolio:wallpaper";

export default function Wallpaper() {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const read = () => setSrc(localStorage.getItem(STORAGE_KEY));
    read();
    window.addEventListener("portfolio:wallpaper-change", read);
    return () => window.removeEventListener("portfolio:wallpaper-change", read);
  }, []);

  return (
    <div
      className="fixed inset-0 -z-10 bg-cover bg-center"
      style={{
        background: src ? undefined : FALLBACK_GRADIENT,
        backgroundImage: src ? `url(${src})` : undefined,
      }}
    />
  );
}
