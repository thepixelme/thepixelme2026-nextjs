"use client";

import { useEffect, useRef, useState } from "react";
import { ABOUT, PROJECTS } from "@/lib/portfolio-data";

interface Line {
  kind: "out" | "in";
  text: string;
}

const HELP = [
  "Available commands:",
  "  whoami        — print the operator",
  "  ls projects   — list portfolio projects",
  "  cat about.md  — print bio",
  "  clear         — clear the screen",
  "  help          — show this message",
];

const GREETING = [
  `Last login: ${new Date().toDateString()} on ttys001`,
  "Welcome. Type `help` to begin.",
];

export default function TerminalApp() {
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const printedGreeting = useRef(false);

  useEffect(() => {
    if (printedGreeting.current) return;
    printedGreeting.current = true;
    let i = 0;
    const tick = () => {
      if (i < GREETING.length) {
        setLines((l) => [...l, { kind: "out", text: GREETING[i] }]);
        i += 1;
        setTimeout(tick, 220);
      }
    };
    tick();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, []);

  const run = (raw: string) => {
    const cmd = raw.trim();
    setLines((l) => [...l, { kind: "in", text: cmd }]);
    if (!cmd) return;
    const next: string[] = [];
    if (cmd === "help") next.push(...HELP);
    else if (cmd === "whoami") next.push(`${ABOUT.handle} — ${ABOUT.title}`);
    else if (cmd === "ls projects") {
      for (const p of PROJECTS)
        next.push(`${p.year}  ${p.id.padEnd(10)} ${p.title}`);
    } else if (cmd === "cat about.md") next.push(ABOUT.bio);
    else if (cmd === "clear") {
      setLines([]);
      return;
    } else next.push(`zsh: command not found: ${cmd.split(" ")[0]}`);
    setLines((l) => [
      ...l,
      ...next.map((text) => ({ kind: "out" as const, text })),
    ]);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    run(input);
    setInput("");
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: terminal surface focuses the real <input> on click; that input is fully keyboard-accessible
    // biome-ignore lint/a11y/useKeyWithClickEvents: focus delegation; the <input> handles all keyboard
    <div
      className="block h-full w-full cursor-text bg-[oklch(0.18_0.012_260)]/95 p-3 text-left font-mono text-[13px] text-emerald-200"
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={scrollRef} className="h-full overflow-auto pr-1">
        {lines.map((l, i) => (
          <div
            key={`${i}-${l.text}`}
            className={l.kind === "in" ? "text-white" : "text-emerald-200/90"}
          >
            {l.kind === "in" ? `➜  ~ ${l.text}` : l.text}
          </div>
        ))}
        <form
          onSubmit={onSubmit}
          className="flex items-center gap-2 text-white"
        >
          <span className="text-emerald-300">➜ ~</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            className="flex-1 bg-transparent caret-emerald-300 outline-none"
            aria-label="Terminal input"
          />
        </form>
      </div>
    </div>
  );
}
