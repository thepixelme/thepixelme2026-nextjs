# Desktop Shell

Everything that's always on screen: wallpaper, menu bar, dock, and Spotlight palette. Plus the two helper modules they depend on (`useClock`, `useTheme`).

The shell components are children of `<WindowsProvider>` (mounted by [Desktop.tsx](../src/components/desktop/Desktop.tsx)) and freely call `useWindows()` / `useWindowsDispatch()` to read state and emit actions.

## Desktop ([Desktop.tsx](../src/components/desktop/Desktop.tsx))

Top-level client component mounted by [page.tsx](../src/app/page.tsx). It is also the **viewport router**: based on [`useIsMobile()`](../src/lib/useIsMobile.ts), it picks between the desktop tree (≥ 1024 px) and the mobile tree (< 1024 px).

Structure:

```
<WindowsProvider>
  <ShellSwitch>
    isMobile === null  → only <Wallpaper /> (pre-hydration, no mismatch)
    isMobile === false → <DesktopBody />
    isMobile === true  → <MobileShell />
```

`<WindowsProvider>` lives outside the switch so window state persists across a viewport resize.

`<DesktopBody />` (a local component inside the same file) renders the classic desktop tree:

1. `<Wallpaper />`
2. `<MenuBar onOpenSpotlight={() => setSpotlightOpen(true)} />`
3. `<WindowManager />`
4. `<Dock />`
5. `<Spotlight open={spotlightOpen} onOpenChange={setSpotlightOpen} />`

`DesktopBody` owns its own `spotlightOpen: boolean`.

## Mobile shell ([src/components/mobile/](../src/components/mobile/))

Below 1024 px, `<MobileShell />` replaces the entire desktop chrome with a bottom-dock home state + sheet stack. See dedicated sections below.

## Wallpaper ([Wallpaper.tsx](../src/components/desktop/Wallpaper.tsx))

Sits behind everything as a fixed, full-viewport background. Stateless — renders the bundled Oleg Laptev wallpaper via a responsive `<picture>`:

- `<source media="(orientation: portrait)" srcSet="/wallpapers/oleg-laptev-7jQh3EiS8Bs-unsplash-768x1280.jpg" />` (768×1280 portrait crop, ~46KB)
- `<img src="/wallpapers/oleg-laptev-7jQh3EiS8Bs-unsplash-1980x1320.jpg" />` (1980×1320 landscape crop, ~187KB) as the default
- The `<img>` carries `alt=""` + `aria-hidden="true"` (decorative) and `fixed inset-0 -z-10 h-full w-full object-cover` for the full-bleed backdrop.

## MenuBar ([MenuBar.tsx](../src/components/desktop/MenuBar.tsx))

Fixed `inset-x-0 top-0 z-50` header at `h-7` (28px). Glass surface: `border-b border-separator bg-surface backdrop-blur-(--glass-blur)`. Text is `text-xs font-medium`.

Props: `{ onOpenSpotlight: () => void }`.

Layout:

```
[User · Nhat Nguyen]   Portfolio   Contact          Battery  Wifi  Search  Mon 3:42 PM
```

Left side (`<nav>`, `gap-4`):

- About button — single `<button aria-label="About menu">` containing `<User size={14}>` plus a semibold `<span>` with the site owner's name ("Nhat Nguyen"). On click, dispatches `OPEN { appId: "about" }`. There is no actual dropdown menu. (Replaces the canonical macOS Apple logo + active-app name — this portfolio is about Nhat, not Apple, and there is no concept of an "active app" in the macOS sense.)
- Nav buttons — two `<button>`s for top-level portfolio navigation, each dispatching `OPEN` against the [APPS](../src/components/apps/registry.ts) registry: `Portfolio` → `finder`, `Contact` → `contact`. They replace the canonical "File / Edit / View / Window / Help" menus, which would otherwise be inert decoration in a single-purpose portfolio site.

Right side:

- `<Battery size={16}>` — visual only.
- `<Wifi size={14}>` — visual only.
- Search button — `<button aria-label="Open Spotlight">` calling `onOpenSpotlight`. Renders `<Search size={14}>`.
- Clock — `<span className="tabular-nums">{time}</span>` where `time` comes from `useClock()`.

## Dock ([Dock.tsx](../src/components/desktop/Dock.tsx))

Fixed `inset-x-0 bottom-3 z-40` flex justify-center wrapper, with `pointer-events-none` so clicks pass through to the desktop except on the pill itself.

Inner pill: `pointer-events-auto flex items-end gap-3 rounded-2xl border border-separator bg-surface-secondary px-3 pb-2 pt-3 shadow-overlay backdrop-blur-(--glass-blur)`.

Iterates [APPS](../src/components/apps/registry.ts) in registry order, skipping any entry where `hideFromDock` is true. For each remaining app:

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

A single dock entry, shared by the desktop `<Dock>` and the mobile `<MobileDock>`. Props:

| Prop      | Type         | Notes                                                      |
| --------- | ------------ | ---------------------------------------------------------- |
| `appId`   | `AppId`      | Registers the rendered element via `useRegisterDockIcon` for window-open/minimize animations. No-ops when no `DockIconPositionsProvider` is mounted (e.g. inside `MobileDock`). |
| `icon`    | `LucideIcon` | The lucide component (not an instance).                    |
| `label`   | `string`     | Used for both the hover tooltip and `aria-label`.          |
| `open`    | `boolean`    | Controls the visibility of the indicator dot below.        |
| `onClick` | `() => void` |                                                            |
| `compact` | `boolean?`   | Default `false`. When `true`: hides the hover tooltip and removes the hover lift/scale transform. Passed by `MobileDock` to avoid sticky `:hover` artifacts on touch devices and remove the desktop-only tooltip convention. |

Structure (single `<button>`, three `<span>`s):

1. **Tooltip** (above the icon) — `absolute -top-9 hidden ... group-hover:block`, glass-styled chip showing `label`. Only rendered when `compact` is `false`.
2. **Icon tile** — `h-14 w-14 rounded-2xl border border-field-border bg-linear-to-b from-white/40 to-white/10 shadow-surface`. When `compact` is `false`, also `transition-transform duration-150 ease-out group-hover:-translate-y-2 group-hover:scale-110`. Renders `<Icon size={32} strokeWidth={1.5}>`.
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

## useClock and useNow ([src/lib/clock.ts](../src/lib/clock.ts))

Two hooks live in this module:

- **`useNow(): Date | null`** — the source-of-truth ticker. Returns `null` on first render (SSR-safe) and a `Date` after mount. Schedules a `setTimeout` aligned to the next minute boundary, then a 60-second `setInterval`. Both timer ids are tracked in closure-scoped variables and cleared in the effect's cleanup return.
- **`useClock(): string`** — consumes `useNow()` and formats with `Intl.DateTimeFormat(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })` (e.g. `"Sat 3:42 PM"`). Used by [MenuBar.tsx](../src/components/desktop/MenuBar.tsx).

[MobileStatusBar.tsx](../src/components/mobile/MobileStatusBar.tsx) consumes `useNow()` directly and formats a shorter `h:mm a` locally — no second timer.

## useTheme ([src/lib/theme.ts](../src/lib/theme.ts))

`useTheme(): [ThemeMode, (m: ThemeMode) => void]`.

`ThemeMode = "glass-light" | "glass-dark"`.

State: `mode`, default `"glass-light"`.

Effect (mount):

- Reads `localStorage["portfolio:theme"]`. If it's `"glass-light"` or `"glass-dark"`, sets `mode` and applies the class.

Updater (`update(m)`):

- Sets state, writes `localStorage["portfolio:theme"] = m`, calls `applyTheme(m)`.

`applyTheme(mode)` removes both classes from `document.documentElement` and adds the chosen one. The HTML element starts at `glass-light` from the SSR markup in [layout.tsx](../src/app/layout.tsx); the effect upgrades to whatever's stored.

## useIsMobile ([src/lib/useIsMobile.ts](../src/lib/useIsMobile.ts))

`useIsMobile(): boolean | null`. Single source of truth for the viewport switch in `Desktop.tsx`.

- Initial state `null` — both SSR and the first client render get the same value, so there's no hydration mismatch.
- `useLayoutEffect` reads `window.matchMedia("(max-width: 1023.98px)").matches` and subscribes to its `change` event. Cleanup removes the listener.
- Breakpoint `1023.98px` matches Tailwind's `lg` boundary: 1024 px and up = desktop, 1023.98 px and below = mobile.

Consumers should treat `null` as "render minimal fallback content" (Desktop.tsx renders only the wallpaper).

## MobileShell ([src/components/mobile/MobileShell.tsx](../src/components/mobile/MobileShell.tsx))

The mobile counterpart of `<DesktopBody>`. Mounted when `useIsMobile()` returns `true`. Owns `spotlightOpen: boolean` and a `goHome` callback.

Renders, in this order:

1. `<Wallpaper />` (reused as-is).
2. `<MobileStatusBar onOpenSpotlight={...} />` — top, z-50.
3. `<MobileDock hidden={hasVisible} />` — the launcher, z-40, visible on the home state, slides off-screen when any sheet is visible.
4. `<AnimatePresence>` wrapping a `.map` over every window record (regardless of `minimized`), each rendered as an `<AppSheet>` with `isActive` and `stackIndex` props.
5. `<HomeIndicator onGoHome={goHome} disabled={!hasVisible} />` — z-40 above sheets.
6. `<Spotlight open={spotlightOpen} onOpenChange={setSpotlightOpen} />` — reused.

Sheet stack is sorted **ascending by `z`** so the highest-z sheet renders last (and visually stacks on top). `key={win.id}` preserves component identity across reorders (state survives raising/lowering).

`goHome` loops through non-minimized windows and dispatches `MINIMIZE` for each. Sheets slide off-screen via their `animate` prop; their app state stays mounted.

## MobileStatusBar ([src/components/mobile/MobileStatusBar.tsx](../src/components/mobile/MobileStatusBar.tsx))

Fixed top, `z-50`. Height `calc(2.75rem + env(safe-area-inset-top))` with `pt-[env(safe-area-inset-top)]` so the 44 pt content sits below the notch.

- Left: `useNow()` formatted as `h:mm a`.
- Right: `<Wifi size={14}/>`, `<Battery size={16}/>`, and a `<Search size={14}/>` button (`h-11 w-11` hit area) that calls `onOpenSpotlight()`.

## MobileDock ([src/components/mobile/MobileDock.tsx](../src/components/mobile/MobileDock.tsx))

The mobile counterpart of the desktop `<Dock>`. Single bottom pill that mirrors the desktop's glass styling and reuses [`DockIcon`](../src/components/desktop/DockIcon.tsx) with `compact` enabled (no hover tooltip, no hover lift/scale).

Props: `{ hidden: boolean }` — driven by whether any non-minimized sheet is visible.

Structure:

- Outer `<motion.nav aria-label="Dock">` — `pointer-events-none fixed inset-x-0 z-40 flex justify-center bottom-[calc(env(safe-area-inset-bottom)+3.25rem)]`. The bottom offset clears the full 44 pt `HomeIndicator` hit area on devices both with and without a bottom safe area (`env(safe-area-inset-bottom)` falls back to `0` per CSS spec).
- Inner pill — same classes as the desktop dock (`pointer-events-auto flex items-end gap-3 rounded-2xl border border-separator bg-surface-secondary px-3 pb-2 pt-3 shadow-overlay backdrop-blur-(--glass-blur)`).
- Iterates `APPS.filter(app => !app.hideFromDock)` in registry order; each item is `<DockIcon ... compact />`. Indicator dots light up for any window record (including minimized).

Animation:

- `animate={{ y: hidden ? 120 : 0, opacity: hidden ? 0 : 1 }}` with a `spring (stiffness 320, damping 32)`. Reduced motion (`useReducedMotion()`) collapses the transition to `{ duration: 0 }`.
- `inert={hidden}` + `aria-hidden={hidden}` suppress pointer/keyboard/AT on the offscreen pill.

Focus restoration: when `hidden` flips `true → false` (last sheet closed, or all minimized via the home indicator), focuses the first dock button via `pillRef.current?.querySelector("button")?.focus({ preventScroll: true })` — required by [STYLEGUIDE.md §5.1.1](../STYLEGUIDE.md) so keyboard users land on a real focusable target with the native focus ring visible.

## AppSheet ([src/components/mobile/AppSheet.tsx](../src/components/mobile/AppSheet.tsx))

Full-screen `motion.section` with dynamic `style={{ zIndex: 30 + stackIndex }}`. Mounted for the entire life of the window record (unmounts only on `CLOSE`), so app-local state survives minimize/restore and sheet reordering.

Animation:
- `initial={{ y: "100%", opacity: 0.6 }}`
- `animate={ win.minimized ? { y: "100%", opacity: 0.6 } : { y: 0, opacity: 1 } }` — slides off-screen on minimize, back on restore.
- `exit={{ y: "100%", opacity: 0.6 }}` — slides down before unmount on CLOSE (inside `MobileShell`'s `<AnimatePresence>`).
- `transition: spring { stiffness: 320, damping: 32 }`; reduced motion → `{ duration: 0 }`.

Accessibility:
- `inert={!isActive}` + `aria-hidden={!isActive}` on inactive sheets. Native `inert` suppresses pointer events, tab order, and AT.
- On `isActive` becoming true, focuses the Done button via a `useEffect`.

Layout: `pt-[calc(2.75rem+env(safe-area-inset-top))]` reserves the status bar; `pb-[max(env(safe-area-inset-bottom),12px)]` reserves the home indicator. Body is `min-h-0 flex-1 overflow-auto` with an inner `h-full` wrapper so app components that rely on `h-full` (Terminal especially) keep working.

Header has a left `<button>` ("Done" + `ChevronLeft size={16}`) dispatching `{ type: "CLOSE", id: win.id }`. The window title is centered and `pointer-events-none`.

Defensive guard: if no matching app exists in `APPS`, returns `null` (mirrors `WindowManager.tsx`).

## HomeIndicator ([src/components/mobile/HomeIndicator.tsx](../src/components/mobile/HomeIndicator.tsx))

A `<button>` at z-40, fixed bottom, `h-11 w-32` (44 pt hit area). Visible portion is just the inner `h-1.5 w-32 rounded-full bg-white/80` pill at the bottom. Tapping calls `onGoHome` (which minimizes every visible sheet). `disabled={!hasVisible}` greys out the pill when no apps are open.

The hit area overlaps the bottom ~44 pt of the active sheet — acceptable per iOS convention (apps avoid critical UI in the bottom strip).

## Cross-references

- Theme tokens (`--surface`, `--separator`, `--glass-blur`, etc.) are defined by `@heroui-pro/react/themes/glass` — see [styling-and-icons.md](styling-and-icons.md#glass-theme).
- Brand-icon rendering — [styling-and-icons.md](styling-and-icons.md#brandicon).
- Window state machine that all dispatches feed into — [window-manager.md](window-manager.md#actions).
- How apps are rendered inside either `<Window>` or `<AppSheet>` — [apps.md](apps.md).
