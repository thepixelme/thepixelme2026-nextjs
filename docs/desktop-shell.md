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
[User · Nhat Nguyen]   Portfolio   Contact                          Search  Mon 3:42 PM
```

Left side (`<nav>`, `gap-4`):

- About button — single `<button aria-label="About menu">` containing `<User size={14}>` plus a semibold `<span>` with the site owner's name ("Nhat Nguyen"). On click, dispatches `OPEN { appId: "about" }`. There is no actual dropdown menu. (Replaces the canonical macOS Apple logo + active-app name — this portfolio is about Nhat, not Apple, and there is no concept of an "active app" in the macOS sense.)
- Nav buttons — two `<button>`s for top-level portfolio navigation, each dispatching `OPEN` against the [APPS](../src/components/apps/registry.ts) registry: `Portfolio` → `finder`, `Contact` → `contact`. They replace the canonical "File / Edit / View / Window / Help" menus, which would otherwise be inert decoration in a single-purpose portfolio site.

Right side:

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

Hand-rolled command palette. Props: `{ open: boolean; onOpenChange: (open: boolean) => void }`.

Internal state: `query: string` (the input value), `activeIndex: number` (the highlighted result). Refs: `inputRef` (focus target), `previouslyFocusedRef` (focus return target).

Window keyboard listener (added on mount, removed on unmount):

- `Cmd+K` or `Ctrl+K` → `e.preventDefault()` and `onOpenChange(true)`.
- `Escape` → `onOpenChange(false)`.

Open/close effect:

- On open → captures `document.activeElement` and focuses the input on the next animation frame.
- On close → resets `query` and `activeIndex`, then returns focus to the previously focused element.

Filtering and navigation:

- `filtered = APPS.filter(a => a.title.toLowerCase().includes(query.trim().toLowerCase()))` (no query → all apps).
- Input `onKeyDown`: `ArrowDown` / `ArrowUp` cycle `activeIndex`; `Enter` calls `launch(filtered[activeIndex].id)`.
- List item `onMouseMove` sets `activeIndex` to its position; `onClick` launches.

Structure (when `open` is true):

```
<div role="dialog" aria-modal className="fixed inset-0 z-50 ... bg-backdrop pt-[15vh]"> {/* backdrop, click-outside closes */}
  <div className="w-[min(640px,...)] rounded-2xl border border-separator bg-overlay shadow-overlay backdrop-blur-(--glass-blur)">
    <div className="... border-b border-separator">
      <Search size={16} />
      <input ref={inputRef} ... aria-controls="spotlight-list" aria-activedescendant=... />
    </div>
    <ul id="spotlight-list" role="listbox">
      {filtered.map((app, i) => (
        <li role="option" aria-selected={i === activeIndex} className={i === activeIndex ? "bg-default" : ""}>
          <Icon size={16} /> <span>{app.title}</span>
        </li>
      ))}
    </ul>
  </div>
</div>
```

`launch(appId)` dispatches `OPEN { appId }` and calls `onOpenChange(false)` (the close effect resets `query` and `activeIndex`).

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

- Left: About `<button aria-label="About menu">` containing `<User size={14}>` plus a semibold `<span>` with "Nhat" (first name only — full "Nhat Nguyen" would crowd the narrower mobile bar alongside the 44 pt tap target). On click, dispatches `OPEN { appId: "about" }`. Mirrors the desktop MenuBar's identity affordance.
- Right: `<Search size={14}/>` button (`h-11 w-11` hit area) that calls `onOpenSpotlight()`, then the clock — `useNow()` formatted as `h:mm a`. **When `NEXT_PUBLIC_GA_ID` is set (R8)**, the clock renders as a `<button>` calling `toggle()` from `useNotificationCenter()` — the mobile re-decide path for analytics consent (opens the standalone consent card). When env is unset, stays plain `<span>` (no NC panel on mobile, so a toggle would have no visible effect).

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

## Notification Center ([src/components/notifications/NotificationCenter.tsx](../src/components/notifications/NotificationCenter.tsx))

A macOS-style notification panel that slides in from the right edge when the menu-bar clock is clicked. Generic surface — it knows about open/closed state and the panel chrome (header + close X + animation) but **not** about analytics or any specific notification. Notifications are passed in as `children`.

- **Provider:** [`NotificationCenterProvider`](../src/lib/notification-center.ts) wraps the tree in `layout.tsx` and exposes `{ open, toggle, setOpen, locked, setLocked }` via `useNotificationCenter()`. Always mounted — the panel and clock work even when no notifications exist.
- **Placement (R7 liquid glass):** `fixed right-3 top-10 bottom-3 z-50 w-90` (360px wide, detached from viewport edges with ~12px margins). Rounded on all corners. Starts at `top-10` so the menu bar (`top-0 h-7`) — including the clock — stays clickable while the panel is open.
- **Surface (R7 liquid glass):** `bg-liquid-glass-surface shadow-liquid-glass backdrop-blur-(--liquid-glass-blur) backdrop-saturate-(--liquid-glass-saturate)` — translucent panel with macOS-Vibrancy-style saturation boost, deeper outer shadow, and a 1px inset specular top highlight. See [STYLEGUIDE.md §2.4](../STYLEGUIDE.md) for the recipe.
- **Animation:** spring slide-in from the right using `motion/react` (`stiffness: 320, damping: 32`, matching `AppSheet`). Respects `useReducedMotion`.
- **Close:** Esc / click backdrop / click X / call `setOpen(false)`. Backdrop is transparent (no dim) — matches real macOS.
- **Modal lock (R8):** when a consumer (currently `<AnalyticsConsent>`) calls `setLocked(true)`, all close-attempts (`setOpen(false)`, `toggle()` while open) become no-ops at the context level. Open-attempts still work. The close X button is **hidden** (not rendered) while locked — keeps macOS-style "no broken affordance." Used to force a forced explicit Allow/Decline before the NC can be dismissed.
- **Focus:** captures `document.activeElement` on open and restores it on close. Initial focus moves to the `initialFocusRef` consumer-provided element (e.g. the Decline button on the consent card) or the close X if not provided (and not hidden by the lock). Non-modal — Tab can leave the panel naturally.
- **Empty state:** when `Children.count(children) === 0`, renders a muted "No new notifications" line.

## NotificationCard ([src/components/notifications/NotificationCard.tsx](../src/components/notifications/NotificationCard.tsx))

Generic visual primitive for a single macOS notification. Props: `icon`, `iconTileClassName`, `appLabel`, `timestamp`, `title`, `body`, optional `actions`, optional `variant`. Renders a `rounded-xl` card with a header row (icon tile + app label + timestamp), title, body, and optional split-actions footer (`grid divide-x divide-separator border-t`). Mobile action height is `h-11` (≥44px touch target); desktop shrinks to `h-9`.

**Variant prop (R7):**

- `variant="default"` (the unsupplied default) — dense `bg-default/80 backdrop-blur-sm` surface. Used by `MobileConsentNotification` so the mobile card reads on the bare wallpaper without a frosted panel beneath it.
- `variant="liquid-glass"` — translucent `bg-liquid-glass-card` with a `shadow-liquid-glass-card` inset top highlight, no extra `backdrop-blur` (the parent panel already blurs). Used by the desktop consent card inside `NotificationCenter`. The variant is passed in `AnalyticsConsent.tsx`, **not** in `NotificationCenter` (which stays generic and only knows about `children`).

## AnalyticsConsent ([src/components/analytics/AnalyticsConsent.tsx](../src/components/analytics/AnalyticsConsent.tsx))

The single owner of consent state. Calls [`useAnalyticsConsent()`](../src/lib/useAnalyticsConsent.ts) once and owns the modal lock, the editing flag, and the card-content matrix.

- **Persistent card (R8):** the desktop card stays in the NC permanently when env var is set. Three content modes based on `(consent, editing)`:
  - `consent === null` OR `editing`: title "Allow Analytics?" + body + `[Decline, Allow]` buttons.
  - `consent === "granted"` + `!editing`: title "Analytics enabled" + body + `[Change preference]` action that flips `editing` to `true`.
  - `consent === "denied"` + `!editing`: title "Analytics disabled" + body + `[Change preference]` action.
- **Modal lock (R8):** a `useEffect` calls `setLocked(consent.enabled && consent.consent === null)`. While undecided the NC cannot be dismissed; user must Decline or Allow. Decline is equally available — this is a forced explicit choice, not a forced consent.
- **Deferred close (R8):** action handlers don't call `setOpen(false)` directly. They set `closeAfterChoiceRef.current = (isMobile || consent === null)` and let a third `useEffect` (declared after the lock effect) issue the close once `consent` flips to non-null. Effect declaration order matters: the lock effect runs first and releases the lock synchronously via `lockedRef.current = false`, so the deferred close is honored. Desktop closes only on first-time decision; change-preference picks keep NC open showing the new status. Mobile closes on every pick.
- **Auto-open (desktop only):** a `useEffect` calls `setOpen(true)` only when `!isMobile && enabled && consent === null`.
- **Mobile branch:** `<MobileConsentNotification>` renders when `enabled && (consent === null || open)`. The `consent === null` clause keeps the card visible the entire undecided period — including after a failed Accept where `promptVisible` flips false but `consent` stays null. `open` covers the post-decision clock-toggle re-decide path.
- **Storage key:** `ga-consent` (`"granted"` \| `"denied"`; absent → undecided). Read/written through `readConsent` / `writeConsent` in [src/lib/analytics.ts](../src/lib/analytics.ts), which wrap `localStorage` in try/catch.
- **`ga-disable` flag (R8):** [`useAnalyticsConsent`](../src/lib/useAnalyticsConsent.ts) writes `window['ga-disable-' + gaId]` from inside `accept()` / `decline()` synchronously (before consent state updates) and from a `useEffect` backstop. Without this, already-loaded gtag.js keeps sending after Decline; with it, the flag is correctly `false` by the time GA re-mounts on Denied → Allow so the first page_view isn't dropped.
- **Env-var gate:** if `NEXT_PUBLIC_GA_ID` is unset, no `<GoogleAnalytics>` mounts and no consent card renders. The desktop NC shell still mounts (clock opens an empty panel). On mobile the clock stays plain text — no NC, no toggle target.
- **Hydration:** renders `null` on first render. Reads consent from `localStorage` inside `useEffect`.

The single-owner rule is strict: `useAnalyticsConsent()` must appear **only** in `AnalyticsConsent`. `setLocked` from the NC context must only be called from `AnalyticsConsent`. NotificationCenter and MobileConsentNotification consume `accept`/`decline` as props.

The single-owner rule is strict: `useAnalyticsConsent()` must appear **only** in `AnalyticsConsent`. Calling it independently from `NotificationCenter` or `MobileConsentNotification` would create separate state instances and the GA mount would never see the click.

For the event catalog and `trackEvent` contract, see [analytics.md](analytics.md).

## Cross-references

- Theme tokens (`--surface`, `--separator`, `--glass-blur`, etc.) are defined locally in [globals.css](../src/app/globals.css) — see [styling-and-icons.md](styling-and-icons.md#glass-theme).
- Brand-icon rendering — [styling-and-icons.md](styling-and-icons.md#brandicon).
- Window state machine that all dispatches feed into — [window-manager.md](window-manager.md#actions).
- How apps are rendered inside either `<Window>` or `<AppSheet>` — [apps.md](apps.md).
- Analytics events fired from the shell — [analytics.md](analytics.md).
