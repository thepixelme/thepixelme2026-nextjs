# Window Manager

The system that opens, positions, focuses, drags, resizes, minimizes, maximizes, and closes app windows. State lives in a `useReducer`; all components read and write through two contexts.

## State shape

Defined in [src/types/window.ts](../src/types/window.ts) and consumed throughout.

### `AppId`

String literal union of the seven registered apps:

```
"finder" | "about" | "resume" | "contact" | "terminal" | "photos" | "settings"
```

### `WindowBounds`

`{ x: number; y: number; w: number; h: number }` — pixels, top-left origin in viewport coordinates.

### `WindowState extends WindowBounds`

| Field            | Type                | Notes                                                            |
| ---------------- | ------------------- | ---------------------------------------------------------------- |
| `id`             | `string`            | `crypto.randomUUID()` per opened window instance.                |
| `appId`          | `AppId`             | Looks up the matching `AppDef` in `APPS`.                        |
| `title`          | `string`            | Copied from the `AppDef.title` at OPEN time.                     |
| `z`              | `number`            | Stacking order. The reducer maintains `topZ` and assigns on OPEN/FOCUS. |
| `minimized`      | `boolean`           | Hidden by `WindowManager` when true.                             |
| `maximized`      | `boolean`           | Suppresses drag/resize handles when true.                        |
| `prevBounds`     | `WindowBounds?`     | Captured on MAXIMIZE so RESTORE can return to the prior bounds.  |
| `initialPayload` | `unknown?`          | Optional opaque payload from the OPEN action; unused by Window itself, available to apps. |

### `AppDef`

| Field         | Type                                          | Notes                                                                             |
| ------------- | --------------------------------------------- | --------------------------------------------------------------------------------- |
| `id`          | `AppId`                                       |                                                                                   |
| `title`       | `string`                                      | Shown in the dock tooltip, window titlebar, and Spotlight item.                   |
| `icon`        | `LucideIcon`                                  | Rendered in the dock and Spotlight.                                               |
| `defaultSize` | `{ w: number; h: number }`                    | The reducer clamps to viewport (`vw - 80`, `vh - 160`) on OPEN.                   |
| `minSize?`    | `{ w: number; h: number }`                    | Defined on the type but currently unread; resize uses global `MIN_W` / `MIN_H`.   |
| `Component`   | `ComponentType<{ windowId: string }>`         | The body component; receives the live window id.                                  |

## Store: [src/lib/windows-store.ts](../src/lib/windows-store.ts)

A `useReducer` + two `Context`s (state + dispatch). No third-party state library.

### Internal state

```
{
  windows: WindowState[],
  topZ: number,         // initially BASE_Z = 10
  openCount: number,    // monotonically increases as windows are opened, used for cascade offset
}
```

Constants: `BASE_Z = 10`, `CASCADE = 24` (the per-window cascade offset, in px).

### Actions

| Action                                                | Effect                                                                                                                                                                                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPEN { appId, payload? }`                            | If a window with that `appId` already exists, bumps it to `topZ + 1` and clears `minimized` (acts as focus/restore). Otherwise creates a new `WindowState` centered in the viewport with a `(openCount * CASCADE)` offset, capped to viewport. `topZ` and `openCount` increment. |
| `CLOSE { id }`                                        | Removes the window from the array.                                                                                                                                                                                              |
| `FOCUS { id }`                                        | If the window isn't already at `topZ`, bumps it to `topZ + 1` and clears `minimized`. No-op otherwise.                                                                                                                          |
| `MOVE { id, x, y }`                                   | Sets `x`, `y` on the matching window.                                                                                                                                                                                           |
| `RESIZE { id, bounds }`                               | Replaces `x`, `y`, `w`, `h` on the matching window from the supplied `WindowBounds`.                                                                                                                                            |
| `MINIMIZE { id }`                                     | Sets `minimized: true`. Does not touch z.                                                                                                                                                                                       |
| `UNMINIMIZE { id }`                                   | Sets `minimized: false`, bumps to `topZ + 1`.                                                                                                                                                                                   |
| `MAXIMIZE { id, viewport: { w, h } }`                 | Stores current `{x,y,w,h}` in `prevBounds`, sets `maximized: true`, repositions to `(0, 28)` with `w = viewport.w`, `h = viewport.h - 28 - 96` (clears menu bar + dock zone).                                                   |
| `RESTORE { id }`                                      | If maximized and `prevBounds` exists: sets `maximized: false`, restores `x/y/w/h` from `prevBounds`, clears `prevBounds`.                                                                                                       |

There is no separate "minimize-to-dock-with-animation" action and no `MINIMIZE_TO_DOCK`.

### Hooks exported

- `WindowsProvider({ children })` — wraps the subtree with both contexts. Built with `createElement` (not JSX) since the file is a non-`.tsx` `.ts` module.
- `useWindows()` → `State`. Throws if used outside the provider.
- `useWindowsDispatch()` → `Dispatch<Action>`. Throws if used outside the provider.

The state value is memoized with `useMemo(() => state, [state])`, which is effectively a pass-through but keeps a stable identity check pattern in place.

### Initial-position math (OPEN)

```
vw = window.innerWidth || 1440        // SSR fallback
vh = window.innerHeight || 900
w  = min(def.defaultSize.w, vw - 80)
h  = min(def.defaultSize.h, vh - 160)
offset = openCount * 24
x  = max(20, round((vw - w) / 2) + offset)
y  = max(40, round((vh - h) / 2) - 40 + offset)
```

Each subsequent window opens 24px further down-and-right than the previous.

## Components

### [Window.tsx](../src/components/window/Window.tsx)

Renders one window from a `WindowState`. Props: `{ win: WindowState; children: ReactNode }`.

Layout:

```
<div absolute, style={left, top, width, height, zIndex}, onPointerDown=FOCUS>
  <div role="toolbar" titlebar (h-9), onPointerDown/Move/Up=drag handlers, onDoubleClick=toggle maximize>
    <TrafficLights onClose onMinimize onMaximize />
    <span centered absolute>title</span>
  </div>
  <div flex-1 overflow-auto>{children}</div>
  {!maximized && <ResizeHandles win />}
</div>
```

Visual classes: `rounded-xl border border-field-border bg-surface shadow-overlay backdrop-blur-(--glass-blur) overflow-hidden`. The titlebar has `border-b border-separator` and uses `select-none`.

Behavior:

- Pointer-down anywhere on the window dispatches `FOCUS`. `useWindowDrag` and `useWindowResize` also dispatch `FOCUS` on their own pointer-down so a corner-drag also focuses.
- Double-click on the titlebar toggles maximize/restore.
- `handleMaximize` reads live `window.innerWidth/innerHeight` to construct the MAXIMIZE viewport payload.
- Resize handles are not rendered when `win.maximized` is true.

### [WindowManager.tsx](../src/components/window/WindowManager.tsx)

Reads `windows` from the store, filters out `minimized`, and for each one looks up its `AppDef` in [APPS](../src/components/apps/registry.ts) and renders `<Window key=id win={w}><App.Component windowId={w.id} /></Window>`. Apps with no matching registry entry are silently skipped.

It does not sort by `z` — DOM order is insertion order, and the `zIndex` style on each `<Window>` controls actual stacking.

### [TrafficLights.tsx](../src/components/window/TrafficLights.tsx)

Three 12×12 circular `<button>`s with hardcoded macOS colors:

| Light  | Hex       | Glyph (lucide)          | aria-label         |
| ------ | --------- | ----------------------- | ------------------ |
| Close  | `#ff5f57` | `<X size={8}>`          | `Close window`     |
| Min    | `#febc2e` | `<Minus size={8}>`      | `Minimize window`  |
| Max    | `#28c840` | `<Maximize2 size={7}>`  | `Maximize window`  |

Glyphs are `opacity-0 group-hover:opacity-100`, so they fade in on hover of the parent group. Props: `{ onClose, onMinimize, onMaximize }` — three callbacks. Spacing: `gap-2 pl-3`.

### [ResizeHandles.tsx](../src/components/window/ResizeHandles.tsx)

Renders 8 absolutely-positioned `<div>`s on the window edges/corners. Each handle uses a `<Handle>` sub-component that calls `useWindowResize(win, handle)`.

| Handle | Class                              | Cursor        |
| ------ | ---------------------------------- | ------------- |
| `n`    | `top-0 left-2 right-2 h-1.5`       | `ns-resize`   |
| `s`    | `bottom-0 left-2 right-2 h-1.5`    | `ns-resize`   |
| `w`    | `top-2 bottom-2 left-0 w-1.5`      | `ew-resize`   |
| `e`    | `top-2 bottom-2 right-0 w-1.5`     | `ew-resize`   |
| `nw`   | `top-0 left-0 h-3 w-3`             | `nwse-resize` |
| `ne`   | `top-0 right-0 h-3 w-3`            | `nesw-resize` |
| `sw`   | `bottom-0 left-0 h-3 w-3`          | `nesw-resize` |
| `se`   | `bottom-0 right-0 h-3 w-3`         | `nwse-resize` |

Handles have `z-10` relative to the window so they sit above body content. They are visually transparent (no fill).

## Hooks

### [useWindowDrag.ts](../src/components/window/useWindowDrag.ts)

`useWindowDrag(win)` returns `{ onPointerDown, onPointerMove, onPointerUp }` for the titlebar.

- `onPointerDown` — early-returns if `win.maximized`, `e.button !== 0`, or the event originated on a `<button>` (so traffic-light clicks aren't swallowed by pointer capture). Otherwise calls `setPointerCapture(e.pointerId)` and stashes `{ dx: e.clientX - win.x, dy: e.clientY - win.y }` in a ref. Also dispatches `FOCUS`.
- `onPointerMove` — if a drag is in progress, computes `x = clamp(-w + 80, vw - 80, e.clientX - dx)` and `y = clamp(28, vh - 40, e.clientY - dy)`, dispatches `MOVE`. Clamping rules: a window may go far left/right (titlebar minimum 80px stays on screen), but the titlebar can never go above the menu bar (`y ≥ 28`) or below `vh - 40`.
- `onPointerUp` — clears the ref, releases pointer capture.

### [useWindowResize.ts](../src/components/window/useWindowResize.ts)

`useWindowResize(win, handle)` returns the same shape, parameterized by the handle direction.

- `MIN_W = 320`, `MIN_H = 240`. There is no per-app override (despite `AppDef.minSize` being typed).
- `onPointerDown` — early-returns if `win.maximized` or `e.button !== 0`. Calls `e.stopPropagation()` so the drag-on-titlebar handler doesn't also fire. Captures starting `{px, py, x, y, w, h}` and dispatches `FOCUS`.
- `onPointerMove` — computes `dx`, `dy` from the pointer-down origin. Then per-direction:
  - `e` → `w = max(MIN_W, startW + dx)`
  - `s` → `h = max(MIN_H, startH + dy)`
  - `w` → `newW = max(MIN_W, startW - dx); x = startX + (startW - newW); w = newW`
  - `n` → `newH = max(MIN_H, startH - dy); y = max(28, startY + (startH - newH)); h = newH`
  
  Combinations (`nw`, `ne`, `sw`, `se`) apply both axes. Dispatches `RESIZE` with the full bounds (so `w`/`n` handles can update `x`/`y` together with `w`/`h`).
- `onPointerUp` — clears the start ref, releases pointer capture.

Both hooks use `setPointerCapture` so dragging continues smoothly when the cursor leaves the handle/titlebar element.

## Cross-references

- Visual conventions (titlebar height, traffic-light colors, glass surface recipe) — [STYLEGUIDE.md §5.2, §2.3, §2.4](../STYLEGUIDE.md).
- Z-index hierarchy — [architecture.md](architecture.md#z-index-layering).
- App registry that backs `WindowManager`'s lookup — [apps.md](apps.md#registry).
