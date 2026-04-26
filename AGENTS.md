<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project style guide

Read [STYLEGUIDE.md](STYLEGUIDE.md) before writing UI code. It defines the macOS-desktop conventions, glass theme tokens, icon mappings, z-index layers, animation rules, and file/code conventions. Update it in the same PR if you change a convention.

# Reference docs (/docs)

Before working on any feature, **read the relevant doc(s) in [docs/](docs/)** to understand existing components, contracts, and data shapes. Don't reimplement what already exists; don't break contracts the docs describe.

- [docs/architecture.md](docs/architecture.md) — render tree, data flow, z-index layering, lifecycle.
- [docs/window-manager.md](docs/window-manager.md) — window state machine, `<Window>`, drag/resize hooks.
- [docs/desktop-shell.md](docs/desktop-shell.md) — wallpaper, menu bar, dock, Spotlight, context menu, `useClock`, `useTheme`.
- [docs/apps.md](docs/apps.md) — `AppDef` contract, `APPS` registry, per-app sections.
- [docs/styling-and-icons.md](docs/styling-and-icons.md) — glass theme tokens, Tailwind v4 patterns, lucide + simple-icons.
- [docs/data.md](docs/data.md) — `portfolio-data.ts` types and current values.

**When you ship a feature, update the docs in the same change** so they keep matching reality. Specifically:

- Added/changed/removed a reducer action, prop, exported hook, or type → update [docs/window-manager.md](docs/window-manager.md) (or the matching doc).
- Added a new desktop chrome component, key binding, custom event, or `localStorage` key → update [docs/desktop-shell.md](docs/desktop-shell.md) and (if relevant) [docs/architecture.md](docs/architecture.md).
- Added/removed an app, changed `APPS` registry entries, or changed an app's structure → update [docs/apps.md](docs/apps.md).
- Added a new theme token, icon, or styling pattern → update [docs/styling-and-icons.md](docs/styling-and-icons.md) and [STYLEGUIDE.md](STYLEGUIDE.md).
- Changed `portfolio-data.ts` shapes or constants → update [docs/data.md](docs/data.md).

The docs are reference material — describe what exists, not what's planned. No TODO/roadmap language.
