# Desktop Shell

Everything that's always on screen: wallpaper, menu bar, dock, Spotlight palette, and the right-click context menu. Plus the two helper modules they depend on (`useClock`, `useTheme`).

The shell components are children of `<WindowsProvider>` (mounted by [Desktop.tsx](../src/components/desktop/Desktop.tsx)) and freely call `useWindows()` / `useWindowsDispatch()` to read state and emit actions.

## Desktop ([Desktop.tsx](../src/components/desktop/Desktop.tsx))

Top-level client component mounted by [page.tsx](../src/app/page.tsx).

Renders, inside `<WindowsProvider>`, a `relative h-full w-full overflow-hidden` div containing:

1. `<Wallpaper />`
2. `<MenuBar onOpenSpotlight={() => setSpotlightOpen(true)} />`
3. `<DesktopContextMenu>` wrapping a screen-reader-only "Desktop" label
4. `<WindowManager />`
5. `<Dock />`
6. `<Spotlight open={spotlightOpen} onOpenChange={setSpotlightOpen} />`

The only state Desktop owns is `spotlightOpen: boolean`.

## Wallpaper ([Wallpaper.tsx](../src/components/desktop/Wallpaper.tsx))

A fixed `inset-0 -z-10 bg-cover bg-center` div sitting behind everything.

State: a single `src: string | null`, initialized to `null` (so the SSR pass uses the gradient fallback).

Effects:

- On mount, reads `localStorage["portfolio:wallpaper"]` into `src`.
- Adds a `window` listener for the custom `portfolio:wallpaper-change` event and re-reads `localStorage` whenever it fires. The listener is removed on unmount.

Background:

- When `src` is `null` → inline `background: <FALLBACK_GRADIENT>`. The gradient is `radial-gradient(ellipse at top, oklch(0.85 0.08 240) 0%, oklch(0.92 0.03 250) 45%, oklch(0.97 0.0029 264.54) 100%)`.
- When `src` is a string → inline `backgroundImage: url(<src>)`.

The writer is [SettingsApp](../src/components/apps/SettingsApp.tsx), which sets the localStorage key and dispatches the custom event.

## MenuBar ([MenuBar.tsx](../src/components/desktop/MenuBar.tsx))

Fixed `inset-x-0 top-0 z-50` header at `h-7` (28px). Glass surface: `border-b border-separator bg-surface backdrop-blur-(--glass-blur)`. Text is `text-xs font-medium`.

Props: `{ onOpenSpotlight: () => void }`.

Layout:

```
[Apple ⌘button]  Portfolio   File  Edit  View  Window  Help          Battery  Wifi  Search  Mon 3:42 PM
```

Left side (`<nav>`):

- Apple button — `<button aria-label="Apple menu">` rendering `<Apple size={14} fill-current>`. On click, dispatches `OPEN { appId: "about" }`. There is no actual dropdown menu.
- "Portfolio" — static `<span>`, semibold.
- "File" / "Edit" / "View" / "Window" / "Help" — static `<span>`s with `cursor-default`. Visual decoration only; not interactive.

Right side:

- `<Battery size={16}>` — visual only.
- `<Wifi size={14}>` — visual only.
- Search button — `<button aria-label="Open Spotlight">` calling `onOpenSpotlight`. Renders `<Search size={14}>`.
- Clock — `<span className="tabular-nums">{time}</span>` where `time` comes from `useClock()`.

## Dock ([Dock.tsx](../src/components/desktop/Dock.tsx))

Fixed `inset-x-0 bottom-3 z-40` flex justify-center wrapper, with `pointer-events-none` so clicks pass through to the desktop except on the pill itself.

Inner pill: `pointer-events-auto flex items-end gap-3 rounded-2xl border border-separator bg-surface-secondary px-3 pb-2 pt-3 shadow-overlay backdrop-blur-(--glass-blur)`.

Iterates [APPS](../src/components/apps/registry.ts) in registry order. For each app:

```ts
const isOpen = windows.some(w => w.appId === app.id);
<DockIcon
  icon={app.icon}
  label={app.title}
  open={isOpen}
  onClick={() => dispatch({ type: "OPEN", appId: app.id })}
/>
```

Note: `OPEN` on an already-open app focuses (and unminimizes) it, per the reducer in [windows-store.ts](../src/lib/windows-store.ts).

## DockIcon ([DockIcon.tsx](../src/components/desktop/DockIcon.tsx))

A single dock entry. Props:

| Prop      | Type         | Notes                                                      |
| --------- | ------------ | ---------------------------------------------------------- |
| `icon`    | `LucideIcon` | The lucide component (not an instance).                    |
| `label`   | `string`     | Used for both the hover tooltip and `aria-label`.          |
| `open`    | `boolean`    | Controls the visibility of the indicator dot below.        |
| `onClick` | `() => void` |                                                            |

Structure (single `<button>`, three `<span>`s):

1. **Tooltip** (above the icon) — `absolute -top-9 hidden ... group-hover:block`, glass-styled chip showing `label`.
2. **Icon tile** — `h-14 w-14 rounded-2xl border border-field-border bg-linear-to-b from-white/40 to-white/10 shadow-surface`. Hover transform: `transition-transform duration-150 ease-out group-hover:-translate-y-2 group-hover:scale-110`. Renders `<Icon size={32} strokeWidth={1.5}>`.
3. **Indicator dot** — `mt-1 h-1 w-1 rounded-full bg-foreground/70`, `opacity-100` when `open`, else `opacity-0`.

There is no right-click handling on dock icons.

## Spotlight ([Spotlight.tsx](../src/components/desktop/Spotlight.tsx))

Controlled command palette built on the HeroUI Pro `Command` compound component. Props: `{ open: boolean; onOpenChange: (open: boolean) => void }`.

Internal state: `query: string` (the input value).

Keyboard listener (added on mount, removed on unmount):

- `Cmd+K` or `Ctrl+K` → `e.preventDefault()` and `onOpenChange(true)`.
- `Escape` → `onOpenChange(false)`.

Composition:

```
<Command>
  <Command.Backdrop isOpen={open} onOpenChange={onOpenChange}>
    <Command.Container>
      <Command.Dialog>
        <Command.InputGroup value={query} onChange={setQuery} aria-label="Spotlight search">
          <Command.InputGroup.Prefix><Search size={16} /></Command.InputGroup.Prefix>
          <Command.InputGroup.Input placeholder="Spotlight Search" />
        </Command.InputGroup>
        <Command.List aria-label="Apps" onAction={(key) => launch(key as AppId)}>
          <Command.Group heading="Apps">
            {APPS.map(app => <Command.Item id={app.id} textValue={app.title}>...</Command.Item>)}
          </Command.Group>
        </Command.List>
      </Command.Dialog>
    </Command.Container>
  </Command.Backdrop>
</Command>
```

`launch(appId)` dispatches `OPEN { appId }`, calls `onOpenChange(false)`, and resets `query` to `""`. Items render `<app.icon size={16}>` followed by `<span className="ml-2">{app.title}</span>`.

The list contains only apps. There are no project entries, recent searches, or other groups.

## DesktopContextMenu ([DesktopContextMenu.tsx](../src/components/desktop/DesktopContextMenu.tsx))

Right-click trigger covering the desktop area, built on HeroUI Pro `ContextMenu`.

Props: `{ children: ReactNode }`. The trigger element is a `<ContextMenu.Trigger className="absolute inset-0 pt-7 pb-24">` so its hit area covers the desktop minus the menu bar (top 28px) and dock zone (bottom 96px).

Items, in order:

| `id`         | Glyph                              | Label                  | Action on select                                         |
| ------------ | ---------------------------------- | ---------------------- | -------------------------------------------------------- |
| `wallpaper`  | `<Image size={14}>` (lucide)        | `Change Wallpaper…`    | Dispatches `OPEN { appId: "settings" }`.                 |
| `about`      | `<Info size={14}>` (lucide)         | `About This Mac`       | Dispatches `OPEN { appId: "about" }`.                    |
| —            | `<ContextMenu.Separator />`         | —                      | —                                                        |
| `github`     | `<BrandIcon icon={siGithub} size={14} />` | `View on GitHub` | `window.open("https://github.com/", "_blank")`.          |

Actions are dispatched from a single `onAction={(key) => { ... }}` handler on `<ContextMenu.Menu>`.

## useClock ([src/lib/clock.ts](../src/lib/clock.ts))

`useClock(): string`. Returns a localized formatted time string using `Intl.DateTimeFormat(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })` (e.g. `"Sat 3:42 PM"`).

State: `now: Date | null`, initially `null` so SSR returns an empty string and avoids hydration mismatch.

Effect:

- On mount, sets `now = new Date()`.
- Schedules the first tick via `setTimeout` aligned to the next minute boundary: `60_000 - (Date.now() % 60_000)` ms.
- On the first tick, sets up a `setInterval(tick, 60_000)`.

Both timers are cleaned up via the effect's cleanup return.

## useTheme ([src/lib/theme.ts](../src/lib/theme.ts))

`useTheme(): [ThemeMode, (m: ThemeMode) => void]`.

`ThemeMode = "glass-light" | "glass-dark"`.

State: `mode`, default `"glass-light"`.

Effect (mount):

- Reads `localStorage["portfolio:theme"]`. If it's `"glass-light"` or `"glass-dark"`, sets `mode` and applies the class.

Updater (`update(m)`):

- Sets state, writes `localStorage["portfolio:theme"] = m`, calls `applyTheme(m)`.

`applyTheme(mode)` removes both classes from `document.documentElement` and adds the chosen one. The HTML element starts at `glass-light` from the SSR markup in [layout.tsx](../src/app/layout.tsx); the effect upgrades to whatever's stored.

## Cross-references

- Theme tokens (`--surface`, `--separator`, `--glass-blur`, etc.) are defined by `@heroui-pro/react/themes/glass` — see [styling-and-icons.md](styling-and-icons.md#glass-theme).
- Brand-icon rendering — [styling-and-icons.md](styling-and-icons.md#brandicon).
- Window state machine that all dispatches feed into — [window-manager.md](window-manager.md#actions).
