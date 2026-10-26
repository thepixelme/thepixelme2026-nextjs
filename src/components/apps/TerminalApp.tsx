"use client";

import { useEffect, useRef, useState } from "react";
import { type TerminalCommand, trackEvent } from "@/lib/analytics";
import { ABOUT } from "@/lib/portfolio-data";
import { PROJECTS } from "@/lib/projects";

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

// The fake home directory `ls` prints.
const HOME_LISTING = "about.md  projects/";

// Pad project ids to the longest one so `ls projects` lines up in columns.
const ID_WIDTH = Math.max(...PROJECTS.map((p) => p.id.length)) + 2;

const KNOWN_COMMANDS: readonly TerminalCommand[] = [
  "help",
  "whoami",
  "ls",
  "cat",
  "clear",
];

// Sends only the recognised command and path, never the raw input — a
// visitor can type anything into a shell.
function trackCommand(name: string, target: string | undefined) {
  const command = KNOWN_COMMANDS.find((c) => c === name) ?? "unknown";
  const takesPath = command === "ls" || command === "cat";
  trackEvent({
    name: "terminal_command",
    command,
    command_target:
      takesPath && target
        ? target === "projects" || target === "about.md"
          ? target
          : "other"
        : undefined,
  });
}

export default function TerminalApp() {
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef("");

  useEffect(() => {
    let i = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const tick = () => {
      if (i < GREETING.length) {
        setLines((l) => [...l, { kind: "out", text: GREETING[i] }]);
        i += 1;
        timeoutId = setTimeout(tick, 220);
      }
    };
    tick();
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `lines` is the change trigger; effect body only reads a ref.
  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [lines]);

  const run = (raw: string) => {
    const cmd = raw.trim();
    setLines((l) => [...l, { kind: "in", text: cmd }]);
    if (!cmd) return;
    setHistory((h) => [...h, cmd]);
    setHistoryIndex(-1);
    draftRef.current = "";
    const [name, ...args] = cmd.split(/\s+/);
    // `projects/` and `projects` name the same directory.
    const target = args[0]?.replace(/\/$/, "");
    trackCommand(name, target);
    const next: string[] = [];
    if (name === "help") next.push(...HELP);
    else if (name === "whoami") next.push(`${ABOUT.handle} — ${ABOUT.title}`);
    else if (name === "ls") {
      if (!target) next.push(HOME_LISTING);
      else if (target === "projects") {
        for (const p of PROJECTS)
          next.push(`${p.id.padEnd(ID_WIDTH)}${p.title}`);
      } else if (target === "about.md") next.push("about.md");
      else next.push(`ls: ${args[0]}: No such file or directory`);
    } else if (name === "cat") {
      if (target === "about.md") next.push(ABOUT.bio);
      else if (!target) next.push("usage: cat <file>");
      else if (target === "projects")
        next.push("cat: projects: Is a directory");
      else next.push(`cat: ${args[0]}: No such file or directory`);
    } else if (name === "clear") {
      setLines([]);
      return;
    } else {
      next.push(`zsh: command not found: ${name}`);
      next.push("Type `help` to see available commands.");
    }
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
            // biome-ignore lint/suspicious/noArrayIndexKey: append-only log; repeated commands produce identical text, so the index is the only stable identity
            key={`${i}-${l.text}`}
            className={`whitespace-pre-wrap break-words ${
              l.kind === "in" ? "text-white" : "text-emerald-200/90"
            }`}
          >
            {l.kind === "in" ? (
              <>
                <span className="text-emerald-300">➜ ~</span> {l.text}
              </>
            ) : (
              l.text
            )}
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
            onKeyDown={(e) => {
              if (e.key === "ArrowUp") {
                if (history.length === 0) return;
                e.preventDefault();
                if (historyIndex === -1) draftRef.current = input;
                const nextIdx = Math.min(historyIndex + 1, history.length - 1);
                setHistoryIndex(nextIdx);
                setInput(history[history.length - 1 - nextIdx]);
              } else if (e.key === "ArrowDown") {
                if (historyIndex === -1) return;
                e.preventDefault();
                const nextIdx = historyIndex - 1;
                if (nextIdx < 0) {
                  setHistoryIndex(-1);
                  setInput(draftRef.current);
                } else {
                  setHistoryIndex(nextIdx);
                  setInput(history[history.length - 1 - nextIdx]);
                }
              }
            }}
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
