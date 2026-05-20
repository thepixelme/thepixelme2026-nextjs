"use client";

import { Send } from "lucide-react";
import { type ReactNode, useState } from "react";
import { ABOUT } from "@/lib/portfolio-data";

const fieldInputClass =
  "min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:font-light placeholder:text-foreground/30";

export default function ContactApp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const canSend =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    message.trim().length > 0;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    const sub = encodeURIComponent(
      subject.trim() || `Hello from ${name.trim()}`,
    );
    const body = encodeURIComponent(
      `${message}\n\n— ${name.trim()} (${email.trim()})`,
    );
    window.location.href = `mailto:${ABOUT.email}?subject=${sub}&body=${body}`;
  };

  const initials = ABOUT.name
    .split(" ")
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("");

  return (
    <form
      onSubmit={onSubmit}
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
          e.preventDefault();
          if (canSend) e.currentTarget.requestSubmit();
        }
      }}
      className="flex h-full flex-col"
    >
      <FieldRow label="To">
        <span className="inline-flex items-center gap-2.5 rounded-full bg-surface-secondary py-1 pl-1 pr-3.5">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-linear-to-br from-accent to-accent/70 text-[11px] font-semibold tracking-wide text-white shadow-sm">
            {initials}
          </span>
          <span className="text-[15px]">{ABOUT.name}</span>
          <span className="text-[13px] text-foreground/40">{ABOUT.email}</span>
        </span>
      </FieldRow>

      <FieldRow label="From">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
          autoComplete="name"
          className={fieldInputClass}
          aria-label="Your name"
        />
        <span className="text-foreground/20" aria-hidden="true">
          /
        </span>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="you@email.com"
          required
          autoComplete="email"
          className={`${fieldInputClass} w-60 flex-none`}
          aria-label="Your email"
        />
      </FieldRow>

      <div className="border-b border-separator px-7 pb-5 pt-4">
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          className="w-full bg-transparent text-[18px] font-medium tracking-tight outline-none placeholder:font-light placeholder:text-foreground/25"
          aria-label="Subject"
        />
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Write your message…"
        required
        aria-label="Message body"
        className="min-h-0 flex-1 resize-none bg-transparent px-7 py-5 text-[15px] leading-[1.7] outline-none placeholder:font-light placeholder:text-foreground/30"
      />

      <div className="flex shrink-0 items-center justify-end gap-3 border-t border-separator px-5 py-3">
        <kbd className="hidden items-center gap-1 rounded-md border border-separator px-1.5 py-0.5 font-mono text-[11px] text-foreground/50 sm:inline-flex">
          <span>⌘</span>
          <span>↵</span>
        </kbd>
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Send message"
          className="inline-flex h-9 items-center gap-2 rounded-full bg-accent px-5 text-[13px] font-medium text-white shadow-sm transition-all duration-150 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
        >
          <Send size={14} strokeWidth={2.25} />
          Send
        </button>
      </div>
    </form>
  );
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-5 border-b border-separator px-7 py-3.5">
      <span className="w-10 shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/40">
        {label}
      </span>
      <div className="flex flex-1 items-center gap-3">{children}</div>
    </div>
  );
}
