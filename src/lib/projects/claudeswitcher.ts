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
    "A native macOS menu-bar app for switching between Claude Code accounts without touching the terminal. One click, no terminal — and a defense against every subtle edge case the macOS process model could throw at it.",
  description:
    "Claude Code stores everything — credentials, config, session tokens — in one directory: `~/.claude`. The moment you try to use two accounts (a personal one and a paid work one) by pointing Claude at a different directory with `CLAUDE_CONFIG_DIR`, the wheels come off. ClaudeSwitcher exists to defeat that bug, correctly, every time, under every edge case I could think of.",
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
    "You can point Claude Code at a different directory with `CLAUDE_CONFIG_DIR`, but the moment you try to wire that into your editor, you hit a quiet, ugly failure mode.\n\nIf VS Code is already running, launching it again with a different environment **silently drops the new env vars**. The IPC handoff between the new `code` invocation and the existing VS Code process doesn't propagate environment changes. Your shell prints nothing. VS Code looks like it switched. It didn't. You're still on the old account, and you only find out when a session does something it shouldn't.\n\nThat's the bug ClaudeSwitcher exists to defeat. Six Swift files, ~800 lines, zero third-party dependencies — a SwiftUI + AppKit menu-bar app that clicks once, launches VS Code under the right `CLAUDE_CONFIG_DIR`, and if VS Code is already running, confirms the quit-and-relaunch.",
  highlights: [
    {
      title: "The same-account fast path is PID-gated, not account-gated",
      body: "\"User clicked Personal, VS Code is already on Personal — just bring it to the front\" sounds like a trivial optimization. It isn't. If the user has since Cmd-Q'd VS Code and reopened it from the Dock, *that* instance has no `CLAUDE_CONFIG_DIR` — attaching to it would be a silent regression of the very bug this app exists to prevent. So I match on **both** the account AND the exact PID I launched.\n\nThe list it searches is already filtered by bundle ID first — kernel PIDs get reused, and a recycled PID belonging to another process must not match. Defensive layering all the way down.",
      code: "if appState.currentlyRunningAccount == account,\n   let launchedPID = appState.launchedProcessIdentifier,\n   let ours = running.first(where: { $0.processIdentifier == launchedPID }) {\n    ours.activate()\n    return\n}",
    },
    {
      title: "The login-shell PATH dance",
      body: "Menu-bar apps launched from Login Items inherit launchd's stripped `PATH` — no Homebrew, no nvm, no asdf. VS Code launched from such a context can't find half the tooling its extensions expect. The fix is to spawn the user's login shell, ask it for `$PATH`, and inject the result.\n\nThe fix done *carefully*: sentinel markers around `$PATH` so oh-my-zsh banners and nvm progress chatter don't contaminate the capture. `/dev/null` on stdin so an interactive shell that calls `read` during rc-file init can't deadlock the wait. A 3-second hard timeout so a hostile rc file that hangs on a network probe doesn't freeze the menu bar. Pre-warmed in `App.init()` so the spawn is already in flight by the time the user clicks.",
      code: 'process.arguments = ["-ilc", "printf \'\\(marker)%s\\(marker)\' \\"$PATH\\""]\nprocess.standardInput  = FileHandle.nullDevice\nprocess.standardError  = FileHandle.nullDevice\n// ...\nif group.wait(timeout: .now() + .seconds(3)) == .timedOut {\n    process.terminate()\n    return [:]\n}',
    },
    {
      title: "State design that can't drift",
      body: "There is no global \"active account\" variable. The menu-bar icon reflects the *last-launched* account as a visual hint only; it never gates behavior. Persistent state is exactly two fields (`lastLaunched`, `hasCompletedSetup`); everything else — running PID, currently-running account, launch-in-progress flag — is session-only and lives in memory.\n\nStale state can't desync across app restarts because there's nothing to desync. Bugs you don't have because of state you didn't keep.",
      code: "// Persistent — survives app relaunch.\n@Published var lastLaunched: ClaudeAccount { didSet { ... } }\n@Published var hasCompletedSetup: Bool      { didSet { ... } }\n\n// Session-only — deliberately NOT persisted.\n@Published var currentlyRunningAccount: ClaudeAccount? = nil\n@Published var launchedProcessIdentifier: pid_t? = nil",
    },
  ],
  designNotes:
    "Six Swift files. ~800 lines. Zero third-party dependencies. Hardened Runtime enabled, minimal entitlements (only `com.apple.security.automation.apple-events`, required for `NSRunningApplication.terminate()` under TCC). Distributed two ways from the same signed, notarized build: a Homebrew cask in a personal tap, and a `create-dmg`-built DMG attached to GitHub Releases.",
  learnings: [
    {
      lead: "Defensive layering isn't paranoia — it's the only way to defeat the bug you exist for.",
      body: "The same-account fast path could have been one line. Making it PID-gated *and* bundle-ID-gated is two extra layers that turn an undetectable silent regression into an impossible one. The cost of the layers is small; the cost of the bug they prevent is the whole reason the app exists.",
    },
    {
      lead: "The macOS process model has more sharp edges than its docs admit.",
      body: "Login-Item PATH stripping, rc-file deadlocks via interactive shells, Apple Events under TCC, recycled kernel PIDs — every one of these is a footgun that doesn't show up until production. Treating the spec as a starting point and building from observed behavior is more honest than trusting it.",
    },
    {
      lead: "State you don't keep is state that can't desync.",
      body: "The temptation with multi-process coordination is to mirror everything into a persistent store and reconcile on launch. Keeping the *minimum* state — two persisted fields, everything else session-only — eliminated a whole class of edge cases without writing any reconciliation code.",
    },
  ],
};
