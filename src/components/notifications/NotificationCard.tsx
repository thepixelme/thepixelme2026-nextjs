"use client";

import type { ReactNode } from "react";

export interface NotificationCardAction {
  label: string;
  onClick: () => void;
  /** Used by parents that want to focus a specific action on mount (e.g. NotificationCenter). */
  ref?: React.Ref<HTMLButtonElement>;
}

export interface NotificationCardProps {
  icon: ReactNode;
  iconTileClassName?: string;
  appLabel: string;
  timestamp?: string;
  title: string;
  body: string;
  actions?: NotificationCardAction[];
}

const actionBase =
  "h-11 text-xs font-medium select-none hover:bg-default-hover transition-colors duration-100 motion-reduce:transition-none lg:h-9";

export default function NotificationCard({
  icon,
  iconTileClassName = "bg-default text-foreground/70",
  appLabel,
  timestamp,
  title,
  body,
  actions,
}: NotificationCardProps) {
  return (
    <article className="rounded-xl bg-default/80 px-3 py-2.5 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <div
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${iconTileClassName}`}
        >
          {icon}
        </div>
        <span className="text-xs font-semibold">{appLabel}</span>
        <span className="flex-1" />
        {timestamp && (
          <span className="text-xs text-foreground/50">{timestamp}</span>
        )}
      </div>
      <h3 className="mt-1 text-sm font-semibold leading-tight">{title}</h3>
      <p className="mt-0.5 text-xs leading-relaxed text-foreground/70">
        {body}
      </p>
      {actions && actions.length > 0 && (
        <div
          className="-mx-3 mt-2.5 grid divide-x divide-separator border-t border-separator"
          style={{ gridTemplateColumns: `repeat(${actions.length}, 1fr)` }}
        >
          {actions.map((action) => (
            <button
              key={action.label}
              ref={action.ref}
              type="button"
              onClick={action.onClick}
              className={actionBase}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}
