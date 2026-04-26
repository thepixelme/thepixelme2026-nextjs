# thepixelme 2026 — Portfolio

A personal portfolio for [thepixelme.com](https://thepixelme.com), built as an interactive macOS-style desktop. Visitors land on a glass-themed desktop, click around the dock, drag windows, hit ⌘K for Spotlight, right-click the desktop — the portfolio content lives inside the "apps" they open.

## Highlights

- **Seven apps** in the dock — Finder (project browser), About Me, Resume, Contact, Terminal, Photos, System Settings.
- **Real window manager** — drag by titlebar, resize from any edge or corner, traffic-light close/minimize/maximize, click-to-focus stacking.
- **Spotlight (⌘K)** — fuzzy-find any app and open it with ↵.
- **Right-click desktop menu** — change wallpaper, open About, jump to GitHub.
- **Glass theme, light + dark** — toggleable in System Settings, remembered across visits.
- **Wallpaper picker** — gradient default plus three Big Sur / Monterey / Sequoia presets.
- **Live menu bar** — Apple logo, app menus, battery/wifi placeholders, ticking clock.
- **Fake terminal** — try `whoami`, `ls projects`, `cat about.md`, `help`, `clear`.

## Tech stack

| Layer            | Choice                                                 |
| ---------------- | ------------------------------------------------------ |
| Framework        | Next.js 16.2.4 (App Router, Turbopack)                 |
| Runtime          | React 19.2                                             |
| Styling          | Tailwind CSS v4 via `@tailwindcss/postcss`             |
| Component library | HeroUI v3 — `@heroui/react` (OSS) + `@heroui-pro/react` (Pro), glass theme |
| Animation peer   | `motion` (Framer Motion under new name)                |
| Icons            | `lucide-react` for UI icons, `simple-icons` for brand logos via a small `<BrandIcon>` wrapper |
| Tooling          | Biome 2.2 for lint + format                            |

There is no backend. Contact form opens the user's mail client; everything else is static.

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

Production build:

```bash
npm run build
npm run start
```

Lint and format:

```bash
npm run lint
npm run format
```

HeroUI Pro requires a license — `npx heroui-pro@latest status` to check, `npx heroui-pro login` to authenticate. The first `npm install` after cloning expects either an interactive session or a `HEROUI_AUTH_TOKEN` env var.

## Project layout

```
src/
  app/         # Next.js App Router (layout, page, globals.css)
  components/
    desktop/   # Wallpaper, MenuBar, Dock, Spotlight, DesktopContextMenu
    window/    # Window, WindowManager, TrafficLights, drag/resize hooks
    apps/      # The seven app components + registry.ts
    BrandIcon.tsx
  lib/         # windows-store (reducer), theme, clock, portfolio-data
  types/       # AppId, AppDef, WindowState, WindowBounds
public/        # static assets (wallpapers/ is empty; Settings uses Unsplash URLs)
```

Editorial content lives in [src/lib/portfolio-data.ts](../src/lib/portfolio-data.ts) — bio, projects, resume entries, photos, social links.

## Reference docs

The rest of this folder describes the codebase in detail:

- [architecture.md](architecture.md) — render tree, data flow, z-index layering, lifecycle.
- [window-manager.md](window-manager.md) — window state machine, `<Window>`, drag/resize hooks.
- [desktop-shell.md](desktop-shell.md) — wallpaper, menu bar, dock, Spotlight, context menu, plus `useClock` and `useTheme`.
- [apps.md](apps.md) — the `AppDef` contract and a section per app.
- [styling-and-icons.md](styling-and-icons.md) — glass theme tokens, Tailwind v4 patterns, lucide and simple-icons usage.
- [data.md](data.md) — `portfolio-data.ts` types and current values.

Project-wide design conventions and macOS UI patterns are in [STYLEGUIDE.md](../STYLEGUIDE.md) at the repo root.
