"use client";

import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  label: string;
  open: boolean;
  onClick: () => void;
}

export default function DockIcon({ icon: Icon, label, open, onClick }: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="group relative flex flex-col items-center justify-end"
    >
      <span className="absolute -top-9 hidden whitespace-nowrap rounded-md border border-separator bg-overlay px-2 py-1 text-xs font-medium shadow-overlay backdrop-blur-(--glass-blur) group-hover:block">
        {label}
      </span>
      <span className="grid h-14 w-14 place-items-center rounded-2xl border border-field-border bg-linear-to-b from-white/40 to-white/10 shadow-surface transition-transform duration-150 ease-out group-hover:-translate-y-2 group-hover:scale-110">
        <Icon size={32} strokeWidth={1.5} className="text-foreground" />
      </span>
      <span
        className={`mt-1 h-1 w-1 rounded-full bg-foreground/70 ${open ? "opacity-100" : "opacity-0"}`}
      />
    </button>
  );
}
