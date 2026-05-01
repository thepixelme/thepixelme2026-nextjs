"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "portfolio:wallpaper";
const DEFAULT_LANDSCAPE =
  "/wallpapers/oleg-laptev-7jQh3EiS8Bs-unsplash-1980x1320.jpg";
const DEFAULT_PORTRAIT =
  "/wallpapers/oleg-laptev-7jQh3EiS8Bs-unsplash-768x1280.jpg";

export default function Wallpaper() {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const read = () => setSrc(localStorage.getItem(STORAGE_KEY));
    read();
    window.addEventListener("portfolio:wallpaper-change", read);
    return () => window.removeEventListener("portfolio:wallpaper-change", read);
  }, []);

  if (src) {
    return (
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url(${src})` }}
      />
    );
  }

  return (
    <picture>
      <source media="(orientation: portrait)" srcSet={DEFAULT_PORTRAIT} />
      <img
        src={DEFAULT_LANDSCAPE}
        alt=""
        aria-hidden="true"
        className="fixed inset-0 -z-10 h-full w-full object-cover"
      />
    </picture>
  );
}
