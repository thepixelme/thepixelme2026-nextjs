import type { Project } from "./types";

export const claudeswitcher: Project = {
  id: "claudeswitcher",
  title: "ClaudeSwitcher",
  tags: ["macOS", "Swift", "SwiftUI", "Menu-bar app"],
  link: "https://github.com/thepixelme/claudeswitcher#install",
  linkLabel: "Install",
  source: "https://github.com/thepixelme/claudeswitcher",
  logo: {
    src: "/claudeswitcher/logo.png",
    alt: "ClaudeSwitcher app icon: a rounded square split diagonally between a warm terracotta half and a charcoal half, with a white typographic mark joining the two — a visual metaphor for switching between Personal and Work accounts",
  },
  screenshots: [
    {
      src: "/claudeswitcher/screenshot-0.png",
      alt: "ClaudeSwitcher menu-bar popover with the Personal account active — `person.circle` icon in the menu bar, and a checkmark next to 'Open VS Code — Personal'",
    },
    {
      src: "/claudeswitcher/screenshot-1.png",
      alt: "ClaudeSwitcher menu-bar popover with the Work account active — `building.2.crop.circle` icon in the menu bar, and a checkmark next to 'Open VS Code — Work'",
    },
  ],
  summary:
    "A native macOS menu-bar app for switching between Claude Code accounts without touching the terminal.",
  description:
    "I built ClaudeSwitcher so I could move between personal and work Claude Code sessions from the menu bar, without remembering shell commands or wondering which account VS Code had actually inherited.",
  role: "Sole engineer and designer",
  stack: [
    "Swift",
    "SwiftUI",
    "AppKit",
    "Hardened Runtime",
    "Developer ID signing",
    "Apple notarization",
    "Homebrew cask",
    "create-dmg",
  ],
  status:
    "v1 — Developer ID signed, Apple notarized, distributed via Homebrew cask and signed DMG",
  problem:
    "Claude Code can use a different config directory through `CLAUDE_CONFIG_DIR`, which sounds simple until VS Code is already running. A second `code` launch hands off to the existing app process, and that process keeps its old environment.\n\nClaudeSwitcher makes the account switch explicit. It launches VS Code with the right config directory, brings forward the instance it started when it is safe to do so, and asks before quitting/reopening VS Code when the current process cannot be trusted.",
  highlights: [
    {
      title: "Only trusting the VS Code process it launched",
      body: "If the selected account is already running, ClaudeSwitcher can simply bring VS Code to the front. The catch is knowing that the running app is still the one it launched. If the user quit VS Code and reopened it from the Dock, that new process may not have `CLAUDE_CONFIG_DIR` at all.\n\nThe app tracks the account and the exact PID it started, after filtering running apps by VS Code's bundle ID. That keeps the shortcut fast without guessing.",
      code: "if appState.currentlyRunningAccount == account,\n   let launchedPID = appState.launchedProcessIdentifier,\n   let ours = running.first(where: { $0.processIdentifier == launchedPID }) {\n    ours.activate()\n    return\n}",
    },
    {
      title: "Rebuilding the user's real PATH",
      body: "Menu-bar apps launched from Login Items inherit a stripped-down `PATH`, which means VS Code may miss Homebrew, nvm, asdf, or other tools a normal terminal session can see. ClaudeSwitcher asks the user's login shell for its PATH and injects that value before launching VS Code.\n\nThe capture is guarded with sentinel markers, null stdin, and a short timeout so noisy shell startup files cannot pollute or hang the app.",
      code: 'process.arguments = ["-ilc", "printf \'\\(marker)%s\\(marker)\' \\"$PATH\\""]\nprocess.standardInput  = FileHandle.nullDevice\nprocess.standardError  = FileHandle.nullDevice\n// ...\nif group.wait(timeout: .now() + .seconds(3)) == .timedOut {\n    process.terminate()\n    return [:]\n}',
    },
    {
      title: "Keeping persistent state small",
      body: "The app only persists `lastLaunched` and `hasCompletedSetup`. Process IDs, launch state, and the currently running account live in memory because they are only true for the current session.\n\nThat keeps the menu-bar icon useful as a hint without turning it into authority. On restart, ClaudeSwitcher starts fresh instead of trying to reconcile stale process state.",
      code: "// Persistent — survives app relaunch.\n@Published var lastLaunched: ClaudeAccount { didSet { ... } }\n@Published var hasCompletedSetup: Bool      { didSet { ... } }\n\n// Session-only — deliberately NOT persisted.\n@Published var currentlyRunningAccount: ClaudeAccount? = nil\n@Published var launchedProcessIdentifier: pid_t? = nil",
    },
  ],
  designNotes:
    "ClaudeSwitcher is intentionally small: six Swift files, around 800 lines, and no third-party dependencies. The release build uses Hardened Runtime, minimal Apple Events entitlement, Developer ID signing, Apple notarization, a Homebrew cask, and a signed DMG generated with `create-dmg`.",
  learnings: [
    {
      lead: "Small utilities still need precise state.",
      body: "A menu-bar app can feel simple while still coordinating with messy process behavior. Tracking the exact VS Code process made the main action predictable.",
    },
    {
      lead: "macOS launch context matters.",
      body: "The same app behaves differently from Terminal, Finder, Login Items, and the Dock. Handling PATH and relaunch behavior directly made the utility feel reliable.",
    },
    {
      lead: "Less persistence meant fewer recovery paths.",
      body: "By storing only the settings that remain true across launches, the app avoided a lot of cleanup and reconciliation code.",
    },
  ],
};
