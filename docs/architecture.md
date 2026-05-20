# Architecture

How the pieces fit together at runtime.

## Render tree

The Next.js root layout ([src/app/layout.tsx](../src/app/layout.tsx)) sets `<html className="glass-light h-full antialiased ...">` and loads Inter + JetBrains Mono via `next/font/google` (CSS variables `--font-sans` and `--font-mono`). Body is `h-full`. There is no React provider at this level.

The page ([src/app/page.tsx](../src/app/page.tsx)) is a server component that renders nothing but `<Desktop />`. All interactivity lives below the `Desktop` boundary.

[src/components/desktop/Desktop.tsx](../src/components/desktop/Desktop.tsx) is a client component (`"use client"`). It mounts the desktop shell in this order, all inside `<WindowsProvider>`:

```
<WindowsProvider>
  <div class="relative h-full w-full overflow-hidden">
    <Wallpaper />              z=-10  fixed bg
    <MenuBar />                z=50   fixed top
    <DesktopContextMenu />     covers desktop area, right-click trigger
    <WindowManager />          renders open <Window>s, dynamic z (≥10)
    <Dock />                   z=40   fixed bottom-center
    <Spotlight />              z=60   modal (HeroUI Pro Command)
  </div>
</WindowsProvider>
```

`Desktop` owns one piece of local state: `spotlightOpen` (boolean), passed to both `<MenuBar>` (so the search icon can open the palette) and `<Spotlight>` (controlled via `open` / `onOpenChange`).

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

There is no global event bus for windows — everything goes through the reducer. The one cross-cutting browser event is `portfolio:wallpaper-change`, dispatched from [SettingsApp](../src/components/apps/SettingsApp.tsx) and listened to by [Wallpaper](../src/components/desktop/Wallpaper.tsx). See [desktop-shell.md](desktop-shell.md#wallpaper) for details.

## Persistence

Two values are persisted to `localStorage`:

| Key                    | Read by                                               | Written by                                              |
| ---------------------- | ----------------------------------------------------- | ------------------------------------------------------- |
| `portfolio:theme`      | [src/lib/theme.ts](../src/lib/theme.ts) (`useTheme`)  | [src/lib/theme.ts](../src/lib/theme.ts)                 |
| `portfolio:wallpaper`  | [Wallpaper.tsx](../src/components/desktop/Wallpaper.tsx) | [SettingsApp.tsx](../src/components/apps/SettingsApp.tsx) |

Window positions, sizes, and open/closed state are **not** persisted — every page load starts with an empty desktop.

## Z-index layering

Set in CSS classes; do not improvise. Source: [STYLEGUIDE.md §5.1](../STYLEGUIDE.md).

| Layer              | z-index | Owner                                                       |
| ------------------ | ------- | ----------------------------------------------------------- |
| Wallpaper          | `-z-10` | [Wallpaper.tsx](../src/components/desktop/Wallpaper.tsx)    |
| Desktop body       | (auto)  | `<DesktopContextMenu.Trigger>` covering the desktop         |
| Window (base)      | `≥ 10`  | Reducer's `topZ`, increments on `OPEN` / `FOCUS`            |
| Dock               | `z-40`  | [Dock.tsx](../src/components/desktop/Dock.tsx)              |
| Menu bar           | `z-50`  | [MenuBar.tsx](../src/components/desktop/MenuBar.tsx)        |
| Spotlight          | `z-60`  | [Spotlight.tsx](../src/components/desktop/Spotlight.tsx)    |

`BASE_Z = 10` and `topZ` start at 10 in [windows-store.ts](../src/lib/windows-store.ts); each `OPEN` / `FOCUS` / `UNMINIMIZE` / `MAXIMIZE`-restore action increments `topZ` and assigns it to the affected window.

## Lifecycle (first paint → interaction)

1. **Server render** — Next emits HTML for the static layout + `Desktop` shell. Wallpaper renders with the fallback gradient (no `localStorage` available on server).
2. **Hydration** — `WindowsProvider` initializes with `{ windows: [], topZ: 10, openCount: 0 }`. `useTheme` reads `portfolio:theme` and re-applies the class. `Wallpaper` reads `portfolio:wallpaper` and swaps the background. `useClock` sets initial time and schedules the next-minute tick.
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
| Theme tokens         | Imported via `@heroui-pro/react/themes/glass` in [globals.css](../src/app/globals.css) |
| Theme switching      | [src/lib/theme.ts](../src/lib/theme.ts)                     |
| Clock                | [src/lib/clock.ts](../src/lib/clock.ts)                     |
| Static portfolio data | [src/lib/portfolio-data.ts](../src/lib/portfolio-data.ts) |
| Brand-icon SVG       | [src/components/BrandIcon.tsx](../src/components/BrandIcon.tsx) |

## Stack notes

- Next.js 16 App Router with Turbopack. Read the matching guide under [node_modules/next/dist/docs/01-app/](../node_modules/next/dist/docs/01-app/) before touching Next-API surfaces — see [AGENTS.md](../AGENTS.md).
- HeroUI v3 has **no `<HeroUIProvider>`**. Components are used directly. Use `onPress` (not `onClick`) on HeroUI interactive elements; native `<button>` elements still use `onClick`.
- Tailwind CSS v4 is wired through `@tailwindcss/postcss`. There is no `tailwind.config.js` — design tokens live in `@heroui-pro/react/themes/glass` (imported in [globals.css](../src/app/globals.css)).
- Biome 2.2 handles both lint (`npm run lint`) and format (`npm run format`).
