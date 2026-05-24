# Architecture

How the pieces fit together at runtime.

## Render tree

The Next.js root layout ([src/app/layout.tsx](../src/app/layout.tsx)) sets `<html className="glass-light h-full antialiased ...">` and loads Inter + JetBrains Mono via `next/font/google` (CSS variables `--font-sans` and `--font-mono`). Body is `h-full` and is wrapped in a single client provider — [`<NotificationCenterProvider>`](../src/lib/notification-center.ts) — which exposes `{ open, toggle, setOpen }` so both the menu-bar clock and the desktop NC panel can share open state. The provider is mounted unconditionally (the NC system is desktop-only at render time, but the provider is cheap and the always-mounted shape keeps `useNotificationCenter()` from throwing if called outside the desktop tree). `<AnalyticsConsent />` is rendered as a sibling of `{children}` inside the provider so it can read `setOpen` for auto-open.

The page ([src/app/page.tsx](../src/app/page.tsx)) is a server component that renders nothing but `<Desktop />`. All interactivity lives below the `Desktop` boundary.

[src/components/desktop/Desktop.tsx](../src/components/desktop/Desktop.tsx) is a client component (`"use client"`). It mounts `<WindowsProvider>` and then a viewport switch (`useIsMobile()`) that picks between the desktop tree and the mobile tree:

```
<WindowsProvider>
  ShellSwitch (useIsMobile)
    isMobile === null  →  <Wallpaper /> only (pre-hydration; avoids mismatch)
    isMobile === false →  <DesktopBody />:
                            <Wallpaper />              z=-10
                            <MenuBar />                z=50
                            <WindowManager />          dynamic z (≥10)
                            <Dock />                   z=40
                            <Spotlight />              z=60
    isMobile === true  →  <MobileShell />              (see desktop-shell.md)
</WindowsProvider>
```

`<WindowsProvider>` lives above the switch so window state survives a viewport resize across the breakpoint. `spotlightOpen` is local state in each branch (`DesktopBody` owns its own; `MobileShell` owns its own).

The breakpoint is `1024px` (Tailwind `lg`): ≥ 1024 → desktop, < 1024 → mobile. See [src/lib/useIsMobile.ts](../src/lib/useIsMobile.ts).

## Data flow

There is exactly one source of window state: the reducer in [src/lib/windows-store.ts](../src/lib/windows-store.ts), exposed as two contexts (state + dispatch) by `<WindowsProvider>`. Components read state via `useWindows()` and emit actions via `useWindowsDispatch()`.

The flow for any window interaction is:

```
user input
  → component handler
    → dispatch({ type, ... })
      → reducer in windows-store.ts
        → new State
          → consumer re-renders (WindowManager, Dock, MenuBar, etc.)
```

There is no global event bus for windows — everything goes through the reducer.

## Persistence

Two values are persisted to `localStorage`:

| Key                    | Read by                                               | Written by                                              |
| ---------------------- | ----------------------------------------------------- | ------------------------------------------------------- |
| `portfolio:theme`      | [src/lib/theme.ts](../src/lib/theme.ts) (`useTheme`)  | [src/lib/theme.ts](../src/lib/theme.ts)                 |
| `ga-consent`           | [src/lib/analytics.ts](../src/lib/analytics.ts) (`readConsent`) | [src/lib/analytics.ts](../src/lib/analytics.ts) (`writeConsent`) |

`ga-consent` holds the Google Analytics consent choice (`"granted"` \| `"denied"`); absent means undecided and the consent banner is shown. See [docs/analytics.md](analytics.md).

Window positions, sizes, and open/closed state are **not** persisted — every page load starts with an empty desktop.

## Z-index layering

Set in CSS classes; do not improvise. Source: [STYLEGUIDE.md §5.1](../STYLEGUIDE.md).

| Layer              | z-index | Owner                                                       |
| ------------------ | ------- | ----------------------------------------------------------- |
| Wallpaper          | `-z-10` | [Wallpaper.tsx](../src/components/desktop/Wallpaper.tsx)    |
| Window (base)      | `≥ 10`  | Reducer's `topZ`, increments on `OPEN` / `FOCUS`            |
| Dock               | `z-40`  | [Dock.tsx](../src/components/desktop/Dock.tsx)              |
| Menu bar           | `z-50`  | [MenuBar.tsx](../src/components/desktop/MenuBar.tsx)        |
| Spotlight          | `z-60`  | [Spotlight.tsx](../src/components/desktop/Spotlight.tsx)    |

Mobile shell adds its own layers (only present when `useIsMobile()` is true):

| Layer              | z-index | Owner                                                       |
| ------------------ | ------- | ----------------------------------------------------------- |
| AppSheet (per win) | `30 + stackIndex` (dynamic inline, range 30–34 for the current 5-app registry) | [AppSheet.tsx](../src/components/mobile/AppSheet.tsx) |
| MobileDock         | `z-40`  | [MobileDock.tsx](../src/components/mobile/MobileDock.tsx); slides off-screen and goes `inert` when any sheet is visible |
| HomeIndicator      | `z-40`  | [HomeIndicator.tsx](../src/components/mobile/HomeIndicator.tsx); `pointer-events-none` while disabled (home state) |
| MobileStatusBar    | `z-50`  | [MobileStatusBar.tsx](../src/components/mobile/MobileStatusBar.tsx) |
| Spotlight          | `z-60`  | (same component as desktop)                                 |

`BASE_Z = 10` and `topZ` start at 10 in [windows-store.ts](../src/lib/windows-store.ts); each `OPEN` / `FOCUS` / `UNMINIMIZE` / `MAXIMIZE`-restore action increments `topZ` and assigns it to the affected window.

## Lifecycle (first paint → interaction)

1. **Server render** — Next emits HTML for the static layout + `Desktop` shell. Wallpaper renders with the fallback gradient (no `localStorage` available on server).
2. **Hydration** — `WindowsProvider` initializes with `{ windows: [], topZ: 10, openCount: 0 }`. `useTheme` reads `portfolio:theme` and re-applies the class. `useClock` sets initial time and schedules the next-minute tick.
3. **First user click** — clicking a `<DockIcon>` dispatches `OPEN`. The reducer adds a `WindowState`, increments `topZ`, increments `openCount`. `WindowManager` renders the new `<Window>`.
4. **Drag / resize** — `<Window>`'s titlebar emits `FOCUS` on `pointerdown`, then `MOVE` on each `pointermove`. The 8 invisible handles in [ResizeHandles.tsx](../src/components/window/ResizeHandles.tsx) emit `RESIZE` (with full bounds, since corner drags can change x/y too).
5. **Spotlight** — `cmd/ctrl+k` flips `spotlightOpen` to true; `Esc` flips it back. Selecting an item dispatches `OPEN` and closes the palette.

## Where each concern lives

| Concern              | File                                                        |
| -------------------- | ----------------------------------------------------------- |
| Window state machine | [src/lib/windows-store.ts](../src/lib/windows-store.ts)     |
| Window types         | [src/types/window.ts](../src/types/window.ts)               |
| Window rendering     | [src/components/window/](../src/components/window/)         |
| Desktop chrome       | [src/components/desktop/](../src/components/desktop/)       |
| App content          | [src/components/apps/](../src/components/apps/)             |
| App registration     | [src/components/apps/registry.ts](../src/components/apps/registry.ts) |
| Theme tokens         | Defined locally in [globals.css](../src/app/globals.css) under `:root`, `html.glass-light`, `html.glass-dark` |
| Theme switching      | [src/lib/theme.ts](../src/lib/theme.ts)                     |
| Clock                | [src/lib/clock.ts](../src/lib/clock.ts)                     |
| Static portfolio data | [src/lib/portfolio-data.ts](../src/lib/portfolio-data.ts) |
| Brand-icon SVG       | [src/components/BrandIcon.tsx](../src/components/BrandIcon.tsx) |
| Mobile shell         | [src/components/mobile/](../src/components/mobile/)         |
| Viewport switch hook | [src/lib/useIsMobile.ts](../src/lib/useIsMobile.ts)         |
| Shared clock + raw-Date hook | [src/lib/clock.ts](../src/lib/clock.ts) (`useClock`, `useNow`) |

## Stack notes

- Next.js 16 App Router with Turbopack. Read the matching guide under [node_modules/next/dist/docs/01-app/](../node_modules/next/dist/docs/01-app/) before touching Next-API surfaces — see [AGENTS.md](../AGENTS.md).
- No React component library — UI is plain elements + Tailwind utilities. Use native `onClick` on `<button>` / `<a>`.
- Tailwind CSS v4 is wired through `@tailwindcss/postcss`. There is no `tailwind.config.js` — design tokens and the `@theme inline` mappings live entirely in [globals.css](../src/app/globals.css) (originally forked from HeroUI Pro's glass theme).
- Biome 2.2 handles both lint (`npm run lint`) and format (`npm run format`).
