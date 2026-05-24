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
| Component library | Plain React + Tailwind. Theme tokens (surfaces, separators, shadows, easing) are defined locally in [src/app/globals.css](src/app/globals.css) — originally forked from HeroUI Pro's glass theme. |
| Animation peer   | `motion` (Framer Motion under new name)                |
| Icons            | `lucide-react` for UI icons, `simple-icons` for brand logos via a small `<BrandIcon>` wrapper |
| Tooling          | Biome 2.2 for lint + format                            |

The only server code is a `/api/contact` route that forwards form submissions via Resend; everything else is static.

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

Copy `.env.example` to `.env.local` and fill in:

- `RESEND_API_KEY` — get one at https://resend.com/api-keys
- `CONTACT_EMAIL` — where contact form submissions are delivered
- `CONTACT_FROM_EMAIL` — the `From:` address; must be on a domain you've [verified in Resend](https://resend.com/docs/dashboard/domains/introduction)
- `NEXT_PUBLIC_GA_ID` — optional. Google Analytics 4 Measurement ID (`G-XXXXXXXXXX`). When unset, no analytics script loads and the consent banner is suppressed. Inlined into the client bundle at `next build` time, so changing it requires a rebuild — see [docs/analytics.md](docs/analytics.md).

Without `RESEND_API_KEY` / `CONTACT_EMAIL` / `CONTACT_FROM_EMAIL`, `npm run dev` works but the contact form returns 500.

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

Editorial content lives in [src/lib/portfolio-data.ts](src/lib/portfolio-data.ts) — bio, projects, resume entries, photos, social links.

## Reference docs

The [docs/](docs/) folder describes the codebase in detail:

- [docs/architecture.md](docs/architecture.md) — render tree, data flow, z-index layering, lifecycle.
- [docs/window-manager.md](docs/window-manager.md) — window state machine, `<Window>`, drag/resize hooks.
- [docs/desktop-shell.md](docs/desktop-shell.md) — wallpaper, menu bar, dock, Spotlight, context menu, plus `useClock` and `useTheme`.
- [docs/apps.md](docs/apps.md) — the `AppDef` contract and a section per app.
- [docs/styling-and-icons.md](docs/styling-and-icons.md) — glass theme tokens, Tailwind v4 patterns, lucide and simple-icons usage.
- [docs/data.md](docs/data.md) — `portfolio-data.ts` types and current values.
- [docs/analytics.md](docs/analytics.md) — `NEXT_PUBLIC_GA_ID`, consent banner, event catalog.

Project-wide design conventions and macOS UI patterns are in [STYLEGUIDE.md](STYLEGUIDE.md) at the repo root.
