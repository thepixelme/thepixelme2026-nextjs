# Architecture

How the pieces fit together at runtime.

## Render tree

The Next.js root layout ([src/app/layout.tsx](../src/app/layout.tsx)) sets `<html className="glass-light h-full antialiased ...">` and loads Inter + JetBrains Mono via `next/font/google` (CSS variables `--font-sans` and `--font-mono`). Body is `h-full` and is wrapped in a single client provider — [`<NotificationCenterProvider>`](../src/lib/notification-center.ts) — which exposes `{ open, toggle, setOpen, persistent, setPersistent }` so both the menu-bar clock and the desktop NC panel can share open state, and so the analytics consent flow can mark the panel persistent (non-blocking but undismissable) while the visitor is undecided. The provider is mounted unconditionally (the NC system is desktop-only at render time, but the provider is cheap and the always-mounted shape keeps `useNotificationCenter()` from throwing if called outside the desktop tree). `<AnalyticsConsent />` is rendered as a sibling of `{children}` inside the provider so it can read `setOpen` for auto-open.

The page ([src/app/page.tsx](../src/app/page.tsx)) is a server component that renders nothing but `<Desktop />`. All interactivity lives below the `Desktop` boundary.

[src/components/desktop/Desktop.tsx](../src/components/desktop/Desktop.tsx) is a client component (`"use client"`). It mounts `<WindowsProvider>` and then a viewport switch (`useIsMobile()`) that picks between the desktop tree and the mobile tree:

```
<WindowsProvider>
  ShellSwitch (useIsMobile)
    isMobile === null  →  pre-hydration first frame, picked by CSS (avoids mismatch):
                            <MobileShell />                        where the `mobile:` variant matches
                            <LaptopIntro><Wallpaper /></LaptopIntro>  where the `intro:` variant matches
                            <Wallpaper />                          everywhere else (desktop without the intro)
    isMobile === false →  <LaptopIntro>                (scroll-zoom intro; see desktop-shell.md)
                            <DesktopBody />:
                              <Wallpaper />              z=-10
                              <MenuBar />                z=50
                              <WindowManager />          dynamic z (≥10)
                              <Dock />                   z=40
                              <Spotlight />              z=60
    isMobile === true  →  <MobileShell />              (see desktop-shell.md)
</WindowsProvider>
```

While the intro plays, `<DesktopBody />` renders inside the laptop's screen box, which is scaled and has `contain: paint`, so the desktop's `fixed` chrome is positioned and clipped relative to the laptop screen rather than the viewport. When the intro finishes, every `LaptopIntro` wrapper switches to `display: contents`: `DesktopBody` keeps its tree position (no remount) and lays out exactly as it would without the intro.

`<WindowsProvider>` lives above the switch so window state survives a viewport resize across the breakpoint. `spotlightOpen` is local state in each branch (`DesktopBody` owns its own; `MobileShell` owns its own).

The switch is `MOBILE_MEDIA_QUERY`, `(max-width: 1023.98px), (orientation: portrait)`: viewports narrower than 1024 px, and portrait viewports of any width (an iPad Pro held upright, a rotated monitor), get the mobile shell; landscape viewports 1024 px and wider get the desktop. See [src/lib/useIsMobile.ts](../src/lib/useIsMobile.ts). The same query is the `mobile:` Tailwind variant in [globals.css](../src/app/globals.css).

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

| Store         | Key               | Read by                                                                                                                          | Written by                                                  |
| ------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| localStorage  | `portfolio:theme` | [src/lib/theme.ts](../src/lib/theme.ts) (`useTheme`)                                                                             | [src/lib/theme.ts](../src/lib/theme.ts)                     |
| Cookie        | `ga-consent`      | client: [src/lib/analytics.ts](../src/lib/analytics.ts) (`readConsent`); server: [src/lib/analytics-server.ts](../src/lib/analytics-server.ts) (`readConsentServer`) | [src/lib/analytics.ts](../src/lib/analytics.ts) (`writeConsent`) |

`ga-consent` holds the Google Analytics consent choice (`"granted"` \| `"denied"`); absent means undecided and the consent banner is shown. The cookie (rather than localStorage) is what lets the mobile consent banner ship in the initial server HTML — `readConsentServer()` reads it via `next/headers cookies()` at request time. See [docs/analytics.md](analytics.md).

Window positions, sizes, and open/closed state are **not** persisted — every page load starts with no windows (the desktop then opens About by itself; see [desktop-shell.md](desktop-shell.md#desktop-desktoptsx)).

## Z-index layering

Set in CSS classes; do not improvise. Source: [STYLEGUIDE.md §5.1](../STYLEGUIDE.md).

| Layer              | z-index | Owner                                                       |
| ------------------ | ------- | ----------------------------------------------------------- |
| Wallpaper          | `-z-10` | [Wallpaper.tsx](../src/components/desktop/Wallpaper.tsx)    |
| Window (base)      | `≥ 10`  | Reducer's `topZ`, increments on `OPEN` / `FOCUS`            |
| Dock               | `z-40`  | [Dock.tsx](../src/components/desktop/Dock.tsx)              |
| Menu bar           | `z-50`  | [MenuBar.tsx](../src/components/desktop/MenuBar.tsx)        |
| Spotlight          | `z-60`  | [Spotlight.tsx](../src/components/desktop/Spotlight.tsx)    |
| Intro walkthrough cursor | `z-60` | [IntroWalkthrough.tsx](../src/components/intro/IntroWalkthrough.tsx); only while the laptop intro plays, inside the screen box's own stacking context |

Mobile shell adds its own layers (only present when `useIsMobile()` is true):

| Layer              | z-index | Owner                                                       |
| ------------------ | ------- | ----------------------------------------------------------- |
| HomeScreen         | `z-0`   | [HomeScreen.tsx](../src/components/mobile/HomeScreen.tsx); fades out and goes `inert` when any sheet is visible |
| AppSheet (per win) | `30 + stackIndex` (dynamic inline, range 30–34 for the current 5-app registry) | [AppSheet.tsx](../src/components/mobile/AppSheet.tsx) |
| MobileDock         | `z-40`  | [MobileDock.tsx](../src/components/mobile/MobileDock.tsx); slides off-screen and goes `inert` when any sheet is visible |
| HomeIndicator      | `z-40`  | [HomeIndicator.tsx](../src/components/mobile/HomeIndicator.tsx); `pointer-events-none` while disabled (home state) |
| MobileStatusBar    | `z-50`  | [MobileStatusBar.tsx](../src/components/mobile/MobileStatusBar.tsx) |
| Spotlight          | `z-60`  | (same component as desktop)                                 |

`BASE_Z = 10` and `topZ` start at 10 in [windows-store.ts](../src/lib/windows-store.ts); each `OPEN` / `FOCUS` / `UNMINIMIZE` / `MAXIMIZE`-restore action increments `topZ` and assigns it to the affected window.

## Lifecycle (first paint → interaction)

1. **Server render** — Next emits HTML for the layout + `Desktop` shell. The pre-hydration branch ships the mobile shell (status bar, home screen widgets, dock), the laptop intro's first frame (headline `<h1>` + laptop at rest) and the bare wallpaper; the `mobile:` and `intro:` CSS variants show exactly one of them, so the first paint matches what hydrates. [`AnalyticsConsentServer`](../src/components/analytics/AnalyticsConsentServer.tsx) (wrapped in `<Suspense>`) reads the `ga-consent` cookie via `next/headers` and seeds `<AnalyticsConsent initialConsent={...}>` — so the mobile consent banner ships in the initial HTML when undecided.
2. **Hydration** — `WindowsProvider` initializes with `{ windows: [], topZ: 10, openCount: 0 }`. `useTheme` reads `portfolio:theme` and re-applies the class. `useClock` sets initial time and schedules the next-minute tick. `useAnalyticsConsent` already has state seeded from the server cookie value, so no client-side re-read is needed.
3. **Laptop intro (desktop, motion allowed, landscape-ish viewport)** — the desktop is shown inside a laptop on a desk in an illustrated, fire-lit room, and is `inert`. `DesktopBody` opens the About window after 700 ms (a `silent` OPEN, not tracked), and a fake cursor tours the dock with app labels. Scrolling (or clicking the screen, or ↓ / Space / Enter / PageDown) zooms in, with the room and the night view through its window zooming less for parallax, until the screen fills the viewport. `finishIntro()` then hands over to the live desktop. Esc and ⌘K/Ctrl+K skip straight in. Once the desktop is live, the dock icons bounce once and an "explore" hint floats above the dock for 8 s. The desktop consent Notification Center auto-opens only after this point. A desktop viewport where the intro doesn't play opens About straight away instead. The mobile shell shows its home screen (identity card and project carousel) and opens nothing by itself.
4. **First user click** — clicking a `<DockIcon>` dispatches `OPEN`. The reducer adds a `WindowState`, increments `topZ`, increments `openCount`. `WindowManager` renders the new `<Window>`.
5. **Drag / resize** — `<Window>`'s titlebar emits `FOCUS` on `pointerdown`, then `MOVE` on each `pointermove`. The 8 invisible handles in [ResizeHandles.tsx](../src/components/window/ResizeHandles.tsx) emit `RESIZE` (with full bounds, since corner drags can change x/y too).
6. **Spotlight** — `cmd/ctrl+k` flips `spotlightOpen` to true; `Esc` flips it back. Selecting an item dispatches `OPEN` and closes the palette.

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
| Laptop scroll-zoom intro | [src/components/intro/](../src/components/intro/), state in [src/lib/intro.ts](../src/lib/intro.ts) |
| Wallpaper generator  | [scripts/generate-wallpaper.mjs](../scripts/generate-wallpaper.mjs) (`npm run wallpaper`) |
| Viewport switch hook | [src/lib/useIsMobile.ts](../src/lib/useIsMobile.ts)         |
| Shared clock + raw-Date hook | [src/lib/clock.ts](../src/lib/clock.ts) (`useClock`, `useNow`) |

## Stack notes

- Next.js 16 App Router with Turbopack. Read the matching guide under [node_modules/next/dist/docs/01-app/](../node_modules/next/dist/docs/01-app/) before touching Next-API surfaces — see [AGENTS.md](../AGENTS.md).
- No React component library — UI is plain elements + Tailwind utilities. Use native `onClick` on `<button>` / `<a>`.
- Tailwind CSS v4 is wired through `@tailwindcss/postcss`. There is no `tailwind.config.js` — design tokens and the `@theme inline` mappings live entirely in [globals.css](../src/app/globals.css) (originally forked from HeroUI Pro's glass theme).
- Biome 2.6 handles both lint (`npm run lint`) and format (`npm run format`).
