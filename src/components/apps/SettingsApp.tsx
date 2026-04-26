"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme";

const WALLPAPER_KEY = "portfolio:wallpaper";

const WALLPAPERS = [
  { id: "gradient", label: "Gradient (default)", src: null },
  {
    id: "bigsur",
    label: "Big Sur",
    src: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=2400",
  },
  {
    id: "monterey",
    label: "Monterey",
    src: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=2400",
  },
  {
    id: "sequoia",
    label: "Sequoia",
    src: "https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?w=2400",
  },
];

export default function SettingsApp() {
  const [theme, setTheme] = useTheme();
  const [wallpaper, setWallpaper] = useState<string | null>(null);

  useEffect(() => {
    setWallpaper(localStorage.getItem(WALLPAPER_KEY));
  }, []);

  const updateWallpaper = (src: string | null) => {
    if (src) localStorage.setItem(WALLPAPER_KEY, src);
    else localStorage.removeItem(WALLPAPER_KEY);
    setWallpaper(src);
    window.dispatchEvent(new Event("portfolio:wallpaper-change"));
  };

  return (
    <div className="grid h-full grid-cols-[180px_1fr] divide-x divide-separator">
      <aside className="bg-surface-secondary px-3 py-4">
        <p className="px-2 text-xs font-semibold uppercase tracking-wide text-foreground/60">
          System
        </p>
        <div className="mt-2 rounded-md bg-default px-2 py-1.5 text-sm font-medium">
          Appearance
        </div>
      </aside>
      <div className="overflow-auto p-6">
        <h1 className="text-lg font-semibold">Appearance</h1>

        <section className="mt-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground/60">
            Theme
          </h2>
          <div className="flex gap-3">
            <ThemeCard
              active={theme === "glass-light"}
              onClick={() => setTheme("glass-light")}
              label="Light"
              Icon={Sun}
              swatch="bg-linear-to-br from-white to-zinc-200"
            />
            <ThemeCard
              active={theme === "glass-dark"}
              onClick={() => setTheme("glass-dark")}
              label="Dark"
              Icon={Moon}
              swatch="bg-linear-to-br from-zinc-800 to-zinc-950"
            />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground/60">
            Wallpaper
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {WALLPAPERS.map((w) => {
              const isActive = (w.src ?? null) === wallpaper;
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => updateWallpaper(w.src)}
                  className={`overflow-hidden rounded-md border-2 transition-all ${
                    isActive
                      ? "border-accent shadow-overlay"
                      : "border-field-border hover:border-foreground/30"
                  }`}
                  aria-label={`Use ${w.label} wallpaper`}
                  aria-pressed={isActive}
                >
                  <div className="aspect-video bg-linear-to-br from-[oklch(0.78_0.13_240)] to-[oklch(0.65_0.18_310)]">
                    {w.src && (
                      <img
                        src={w.src}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <p className="px-2 py-1.5 text-left text-xs font-medium">
                    {w.label}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function ThemeCard({
  active,
  onClick,
  label,
  Icon,
  swatch,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  Icon: React.ComponentType<{ size?: number }>;
  swatch: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex w-32 flex-col items-stretch overflow-hidden rounded-md border-2 ${
        active
          ? "border-accent"
          : "border-field-border hover:border-foreground/30"
      }`}
    >
      <div className={`grid h-16 place-items-center ${swatch}`}>
        <Icon size={20} />
      </div>
      <p className="px-2 py-1.5 text-left text-xs font-medium">{label}</p>
    </button>
  );
}
