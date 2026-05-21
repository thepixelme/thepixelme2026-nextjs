# Apps

Each window's body content. The eight apps live in [src/components/apps/](../src/components/apps/) and are wired into the window manager through [registry.ts](../src/components/apps/registry.ts).

## App contract

An "app" is anything that satisfies the `AppDef` shape ([src/types/window.ts](../src/types/window.ts)):

```ts
{
  id: AppId;
  title: string;
  icon: LucideIcon;
  defaultSize: { w: number; h: number };
  minSize?: { w: number; h: number };  // typed but currently unused
  hideFromDock?: boolean;               // omit from Dock; still appears in Spotlight / launchable via dispatch
  Component: React.ComponentType<{ windowId: string }>;
}
```

The `Component` is rendered by [WindowManager](../src/components/window/WindowManager.tsx) inside a `<Window>` whose body is `flex-1 overflow-auto`. Apps therefore receive a fixed-height container and should size themselves with `h-full`, `flex flex-col`, or scrollable layouts — not assume infinite height.

`Component` receives a `windowId` prop so it can later participate in window-level features (e.g. dispatching `CLOSE` from inside the app). None of the current apps use this prop.

## Registry

[src/components/apps/registry.ts](../src/components/apps/registry.ts) exports a single `APPS: AppDef[]`. Order is significant — it determines dock left-to-right order (for apps with `hideFromDock !== true`) and Spotlight result order.

| # | `id`       | `title`            | `icon` (lucide)        | `defaultSize` (w × h) | in dock |
| - | ---------- | ------------------ | ---------------------- | --------------------- | ------- |
| 1 | `finder`   | Finder             | `FolderOpen`           | 880 × 560             | ✓       |
| 2 | `preview`  | Preview            | `Eye`                  | 1024 × 720            | —¹      |
| 3 | `about`    | About Me           | `User`                 | 520 × 600             | ✓       |
| 4 | `contact`  | Contact            | `Mail`                 | 720 × 620             | ✓       |
| 5 | `terminal` | Terminal           | `Terminal`             | 640 × 420             | ✓       |
| 6 | `settings` | System Settings    | `Settings`             | 720 × 560             | ✓       |

¹ `preview` has `hideFromDock: true` — it's launched by [FinderApp](#finderapp-finderapptsx) with a `projectId` payload, not from the dock.

Sizes are clamped at OPEN time to `vw - 80` and `vh - 160` (see [window-manager.md](window-manager.md#initial-position-math-open)).

The registry is consumed by:

- [WindowManager.tsx](../src/components/window/WindowManager.tsx) — to find a window's Component.
- [Dock.tsx](../src/components/desktop/Dock.tsx) — to render dock icons in order.
- [Spotlight.tsx](../src/components/desktop/Spotlight.tsx) — to populate the Apps group.
- [windows-store.ts](../src/lib/windows-store.ts) — to look up `defaultSize` on `OPEN`.

---

## FinderApp ([FinderApp.tsx](../src/components/apps/FinderApp.tsx))

Two-pane layout: a sidebar of saved filters on the left, a project grid on the right. Finder is a pure list — it does not host any project detail view. Clicking a project dispatches `OPEN { appId: "preview", payload: { projectId } }`, which opens (or refreshes) the [PreviewApp](#previewapp-previewapptsx) window.

### State

- `filter: { kind: "all" } | { kind: "tag"; tag: ProjectTag }` — initial `{ kind: "all" }`. `ProjectTag` is the canonical union from [src/lib/projects/types.ts](../src/lib/projects/types.ts).

### Derived data (memoized)

- `visible` — `PROJECTS` filtered by the current `filter`.

### Sidebar

Two sections via the local `<SidebarSection>` helper:

| Section     | Items                                                  |
| ----------- | ------------------------------------------------------ |
| Favorites   | `All Projects` (Star icon, sets `filter.kind = "all"`) |
| Tags        | One row per tag from `PROJECT_TAGS` (Tag icon)         |

The Tags list is **not** derived from `PROJECTS`. It iterates the canonical `PROJECT_TAGS` constant (see [data.md](data.md#canonical-tags)) so the order is deliberate (form factor → language → framework → platform) and the sidebar is stable regardless of project content. Each row is a `<SidebarItem>` `<button>` with active state `bg-default font-medium` when its kind+key matches the current `filter`.

Sidebar background: `bg-surface-secondary px-2 py-3 text-sm`. Outer grid: `grid-cols-[200px_1fr] divide-x divide-separator`.

### Grid (right pane)

`grid grid-cols-1 gap-3 md:grid-cols-2`. Each card is a `<button>` containing:

- A fixed `aspect-video w-full` image slot with `bg-surface-secondary` backdrop and `overflow-hidden rounded-md` — same wrapper for every project so titles in adjacent cards line up. Inside the slot: `project.logo` (rendered at `h-3/4 w-3/4 object-contain`) if present, otherwise the first screenshot (`h-full w-full object-cover` for landscape, `h-full w-auto object-contain` when `project.orientation === "portrait"` so a phone screenshot pillar-boxes on the gray backdrop), otherwise the project's first letter as a fallback glyph.
- `<h3>` title (`text-sm font-semibold`).
- `<p>` summary (`text-xs text-foreground/70`, line-clamp-2).
- Up to 3 tag chips (`rounded-full bg-default px-2 py-0.5 text-[10px]`).

Click → `dispatch({ type: "OPEN", appId: "preview", payload: { projectId: p.id } })` via `useWindowsDispatch()`.

---

## PreviewApp ([PreviewApp.tsx](../src/components/apps/PreviewApp.tsx))

A macOS Preview-style project viewer. Opens via `OPEN` from FinderApp with payload `{ projectId: string }`. The reducer's existing-window OPEN branch refreshes `initialPayload`, so clicking a different project in Finder while Preview is already open swaps the content in place (single-window-per-app, content driven by payload).

### Payload contract

```ts
{ projectId: string }   // must match an entry in PROJECTS
```

Read in `PreviewApp` via `useWindows()`:

```ts
const { windows } = useWindows();
const win = windows.find((w) => w.id === windowId);
const payload = win?.initialPayload as { projectId?: string } | undefined;
const project = payload?.projectId
  ? PROJECTS.find((p) => p.id === payload.projectId)
  : undefined;
```

If `project` is undefined (missing/unknown id), the app renders an `Eye`-icon empty state.

### Layout

A vertical flex with a thin top toolbar above a 2-column body. The right pane fills the body height:

```
flex h-full flex-col
┌────────────────────────────────────────────┐
│ [☰]  toolbar (h-9, sidebar toggle)         │
├──────────┬─────────────────────────────────┤
│ sidebar  │ right pane                      │
│          │                                 │
│ ⓘ Info   │   ImageView OR CaseStudy        │
│ ──────   │   (depending on selection)      │
│ ▢ thumb1 │                                 │
│ ▢ thumb2 │                                 │
└──────────┴─────────────────────────────────┘
```

`PreviewApp` owns two pieces of state:

- `view: "info" | number` — which content the right pane shows. Default: **`"info"`** (the case-study). `key={project.id}` on the inner content forces a fresh mount when switching projects so `view` resets cleanly.
- `sidebarOpen: boolean` — whether the sidebar column is rendered. Default: `true`. Toggled via the toolbar button. When `false`, the body grid switches from `grid-cols-[176px_1fr]` to `grid-cols-[1fr]` and the right pane gets full width — useful on tablet / narrow windows.

Right-pane render:
- `view === "info"` → `<div className="overflow-y-auto"><CaseStudy project={project} onScreenshotClick={(i) => setView(i)} /></div>`
- `typeof view === "number"` → `<ImageView key={view} screenshot={screenshots[view]} index={view} total={screenshots.length} />`. The `key` forces remount on switch, which resets `zoom`/`pan`/`mode`/`naturalSize`.

### Toolbar (top)

`flex h-9 shrink-0 items-center border-b border-separator bg-surface px-2`. Single button on the left:

- `<button>` with `PanelLeft` icon (size 14) — toggles `sidebarOpen`. `aria-pressed` reflects open state; `aria-label` flips between `"Hide sidebar"` and `"Show sidebar"`. Style: `grid h-7 w-7 place-items-center rounded-md text-foreground/75 hover:bg-default`.

### Sidebar (lives in PreviewApp, rendered only when `sidebarOpen`)

`<aside className="flex flex-col gap-2 overflow-y-auto bg-surface-secondary p-2">` containing:

1. **Info tile** — `aspect-square w-full` `<button>` with `bg-surface-tertiary` background, centered `<Info size={28}>` icon stacked above a `Project Info` label (`text-xs font-medium`). Active state (`view === "info"`) gets `border-accent` + `text-foreground`; inactive: `border-transparent hover:border-field-border`. The square geometry distinguishes it from the rectangular screenshot thumbs (`aspect-video` for landscape, `aspect-9/19` for portrait), so the nav role is unmistakable.
2. A separator (`<hr className="my-1 border-0 border-t border-separator" />`) — only when there are screenshots.
3. Screenshot thumbs — single column always. Each is a `<button>` containing `<img object-cover>`, `border-2` swapping to `border-accent` when selected. For landscape projects, each thumb is `aspect-video w-full` (~160 × 90px). For `orientation: "portrait"` projects, the wrapping container adds `items-center` and each thumb becomes `aspect-9/19 w-24` (~96 × 203px) — a centered, narrower mini-phone shape so portrait shots stay legible without packing two side-by-side.

All buttons get `aria-current` reflecting selection.

When the sidebar is collapsed, screenshot navigation still works via `←` / `→` keys (handled by PreviewApp). Re-opening the sidebar to switch back to Info is one click on the toolbar toggle.

### CaseStudy ([preview/CaseStudy.tsx](../src/components/apps/preview/CaseStudy.tsx))

Long-form scroll inside `mx-auto max-w-2xl px-8 pt-6 pb-12`. Props: `{ project: Project; onScreenshotClick?: (index: number) => void }`. Rendered top to bottom:

1. **Title block** — `<h1>` title, `summary` tagline, tag chips.
2. **Screenshots** (only when `screenshots` is non-empty AND `onScreenshotClick` is provided) — `Section` titled "Screenshots" with a 2-column grid (`sm:grid-cols-2`) of `aspect-video` thumbnail `<button>`s. Each thumb has a hover-zoom (`group-hover:scale-105`) and dispatches `onScreenshotClick(i)` on click — PreviewApp wires this to `setView(i)` so clicking jumps to the image viewer for that screenshot. For `orientation: "portrait"` projects, the grid switches to `grid-cols-2 sm:grid-cols-3` and each item uses `aspect-9/19` so phone screenshots stay readable inside the `max-w-2xl` case-study column.
3. **CTA row** (only when `project.link` or `project.source`) — `flex flex-wrap gap-2` of glass anchor buttons: primary "Visit project" (label can be customized via `linkLabel`, e.g. "Install on Chrome Web Store") and secondary "View source" with the GitHub `BrandIcon`.
4. **Meta strip** (only when `role`/`stack`/`status` is set) — `grid grid-cols-[72px_1fr]` definition list inside `rounded-xl border border-field-border bg-surface-secondary/40 p-5`. Stack entries render as mono pills.
5. **Description** — body paragraph.
6. **The problem** (only when `problem` is set) — `Section` + `<Prose>`.
7. **Engineering highlights** (only when `highlights` is non-empty) — `Section` + numbered `<HighlightCard>`s.
8. **Design** (only when `designNotes`) — `Section` + `<Prose>`.
9. **What I learned** (only when `learnings` is non-empty) — `Section` + `<ul>` of `lead` (bold) + inline-formatted `body`.

Inline formatting (`renderInline`) supports `` `code` ``, `**bold**`, and `*em*` markers. Multi-paragraph prose splits on `\n\n` via the `<Prose>` helper.

### ImageView ([preview/ImageViewer.tsx](../src/components/apps/preview/ImageViewer.tsx))

A self-contained single-screenshot canvas. Selection and arrow-key nav live in PreviewApp; this component is purely the canvas + zoom controls + status bar.

**Props**: `{ screenshot: Screenshot; index?: number; total?: number }`. `index`/`total` only feed the status bar's "N of M" segment; if omitted, that segment is hidden.

**Layout** (`flex h-full flex-col`):

| Region | Class | Contents |
| --- | --- | --- |
| Canvas | `min-h-0 flex-1 relative overflow-hidden bg-surface-tertiary` | the image (transformed) + floating zoom controls |
| Status bar | `h-7 border-t border-separator bg-surface-secondary px-3 text-[11px]` | `[N of M · ]WxH · ZZZ%` |

**Canvas**: subtle 16px diagonal-gradient checkerboard background (inline `style.backgroundImage`) to communicate "image canvas" the way Preview does. The image is positioned absolute at the canvas center and transformed with `translate(panX, panY) scale(displayScale)` where `displayScale = fitScale * zoom`.

`fitScale = min(canvasW / naturalW, canvasH / naturalH, 1)` — recomputed via `ResizeObserver` on the canvas and an `<img onLoad>` populating `naturalSize`. Fit never upscales beyond 1:1.

**Floating zoom controls**: glass pill in the canvas's bottom-right (`rounded-full border bg-surface backdrop-blur-(--glass-blur) shadow-overlay`). Five buttons via the local `<ZoomBtn>`: `Minus` (zoom out), `Plus` (zoom in), separator, `Maximize2` (fit, active when `mode==="fit"`), `1:1` text (actual size, active when `mode==="actual"`).

**Keyboard ownership** — split between PreviewApp and ImageView:

| Key | Where handled | Effect |
| --- | --- | --- |
| `→` / `←` | **PreviewApp** | Next / previous screenshot (clamped, no wrap). Only when `typeof view === "number"`. |
| `+` / `=` / `-` / `_` | ImageView | Multiplicative zoom by 1.2×. Sets `mode = "custom"`. |
| `Cmd+0` / `Ctrl+0` | ImageView | Fit. `zoom = 1`, `pan = (0,0)`, `mode = "fit"`. |
| `Cmd+1` / `Ctrl+1` | ImageView | Actual size. `zoom = 1 / fitScale`, `pan = (0,0)`, `mode = "actual"`. |
| `Escape` | ImageView | Reset to fit (does NOT close the window). |

Both listeners gate on the event target (skip when in `<input>`/`<textarea>`/`contentEditable`). ImageView is unmounted when `view === "info"`, so its zoom shortcuts can't fire from the case-study reading view.

**Pointer interactions**:

| Action | Effect |
| --- | --- |
| Wheel on canvas | Cursor-anchored zoom. Native `addEventListener("wheel", …, { passive: false })` so we can `preventDefault`. New zoom = `clamp(prev * exp(-deltaY / 200), 0.05, 40)`. Pan adjusted so the point under the cursor stays fixed. Sets `mode = "custom"`. |
| Click-drag on canvas (when `zoom > 1`) | Pans. Uses `setPointerCapture` on `pointerdown`. Cursor swaps to `cursor-grabbing`. |
| Double-click on canvas | Toggles between `fit` and `actual`. |

Section headings throughout CaseStudy are uniformly `text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/50`.

CaseStudy renders gracefully for projects without optional fields — only the title block (and, if present, `description`) are unconditional. There is no internal toolbar or back button — the window's traffic-light close handles closing.

---

## AboutApp ([AboutApp.tsx](../src/components/apps/AboutApp.tsx))

Single scrollable column at `p-8`, gap-6.

Sections, top to bottom:

1. **Header row** — initials avatar (computed by splitting `ABOUT.name` on spaces and taking each first character) inside an 80×80 circle with a blue→purple gradient. Right of it: `<h1>` name, `<p>` title, location with `<MapPin size={12}>`.
2. **Bio** — `<p>` of `ABOUT.bio`.
3. **Skills** — heading + flex-wrap of `<Chip size="sm" variant="secondary">` per `ABOUT.skills[i]`. `Chip` is from `@heroui/react`.
4. **Find me** — heading + flex-wrap of social links. Each link is an `<a>` with `target="_blank" rel="noopener noreferrer"`, rendering `<BrandIcon icon={BRANDS[s.brand]} size={14} />` and `s.label`.

`BRANDS` is a local mapping from the `brand` literal to a `simple-icons` constant: `github → siGithub`. The `Social.brand` union and the `BRANDS` map must be kept in sync.

Source content: `ABOUT` and `SOCIALS` from [portfolio-data.ts](../src/lib/portfolio-data.ts).

---

## ContactApp ([ContactApp.tsx](../src/components/apps/ContactApp.tsx))

A controlled form styled as a Superhuman-inspired compose pane — generous whitespace, hairline-only dividers, a display-weight subject, and a pill Send button anchored bottom-right with a `⌘↵` shortcut hint. No backend — submission opens the user's mail client via `mailto:`.

State: `name`, `email`, `subject`, `message` — four independent `useState<string>` values. Derived: `canSend = name && email && message` (all trimmed); subject is optional.

`onSubmit` (called from `<form onSubmit>`, the footer Send button, and `⌘+Enter` / `Ctrl+Enter` from anywhere inside the form):

```
sub  = encodeURIComponent(subject.trim() || `Hello from ${name.trim()}`)
body = encodeURIComponent(`${message}\n\n— ${name.trim()} (${email.trim()})`)
window.location.href = `mailto:${ABOUT.email}?subject=${sub}&body=${body}`
```

Early-returns when `!canSend`. The form's `onKeyDown` intercepts `⌘/Ctrl + Enter`, calls `preventDefault`, and dispatches `requestSubmit()` when sendable.

Layout: `<form className="flex h-full flex-col">` containing five stacked regions, each separated from the next by `border-b border-separator`:

1. **To row** — a non-editable recipient chip: `bg-surface-secondary` rounded-full pill with a 28px gradient avatar (`bg-linear-to-br from-accent to-accent/70`) showing initials of `ABOUT.name` (up to 2 chars), the name at `text-[15px]`, and the email at `text-[13px] text-foreground/40`.
2. **From row** — two adjacent borderless `<input>`s: name (flex-1) and email (`type="email"`, fixed `w-60`), separated by a thin `/` glyph in `text-foreground/20`. Both `required`.
3. **Subject** — a single full-width borderless `<input>` at `text-[20px] font-medium tracking-tight`, with light placeholder styling. No label — the size signals its role.
4. **Body** — a borderless `<textarea>` with `min-h-0 flex-1 resize-none bg-transparent px-7 py-5 text-[15px] leading-[1.7]`, absorbing remaining vertical space.
5. **Footer** — `flex items-center justify-end gap-3 px-5 py-3 border-t border-separator`. Contains a `<kbd>` shortcut hint (`⌘ ↵`, hidden below `sm`) and a primary pill button: `rounded-full bg-accent px-5 h-9` with the lucide `Send` icon + "Send" label. Disabled state uses `opacity-40`. Hover applies `brightness-110`.

A local `FieldRow` helper renders rows 1–2: `flex items-center gap-5 border-b border-separator px-7 py-3.5` with a `w-10` label cell (`text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/40`) followed by a `flex-1` content cell. The subject row is rendered inline (no label).

Inputs are native `<input>` / `<textarea>` rather than HeroUI controls so borders/backgrounds stay flush against the row hairlines. The Send button is a native `<button>` (not HeroUI `Button`) — keeps the pill shape, gradient, and disabled treatment fully token-driven. All fields carry `aria-label`s.

Source content: `ABOUT.name`, `ABOUT.email` from [portfolio-data.ts](../src/lib/portfolio-data.ts).

---

## TerminalApp ([TerminalApp.tsx](../src/components/apps/TerminalApp.tsx))

Fake shell. The only window with a non-glass body — full bleed `bg-[oklch(0.18_0.012_260)]/95`, mono font.

### State

- `lines: { kind: "out" | "in"; text: string }[]` — the scrollback. `"in"` lines render in white prefixed with `➜  ~`; `"out"` lines render in `text-emerald-200/90`.
- `input: string` — the current input value.
- `history: string[]` — submitted commands, oldest-first. Populated by `run` after the empty-input guard, so empty submissions are not recorded.
- `historyIndex: number` — browse cursor, offset from the end of `history` (`0` = most recent, `-1` = not browsing).
- `inputRef`, `scrollRef` — DOM refs for focus delegation and scroll-to-bottom. The scroll effect depends on `lines`, so the viewport sticks to the latest output on every append/clear.
- `draftRef: useRef<string>` — preserves the in-progress input when the user starts browsing history with ↑, so ↓ past the most recent entry restores it.

### Greeting

On mount, lines are appended one-by-one with a 220ms delay between them, drawn from `GREETING`:

```
Last login: <new Date().toDateString()> on ttys001
Welcome. Type `help` to begin.
```

The effect tracks the in-flight `setTimeout` id and clears it on cleanup, so it survives React strict-mode's double-invoke of mount effects. Every fresh mount (open, or close + reopen) re-plays the greeting.

### History

The `<input>` handles `ArrowUp` / `ArrowDown` to walk through `history` (most-recent-first on ↑). The first ↑ press snapshots the current `input` into `draftRef`; pressing ↓ past the most recent entry restores that draft. Holding ↑ at the oldest entry stays there; ↓ when `historyIndex === -1` is a no-op. Both keys call `preventDefault()` so the caret lands at the end of the replaced text. History is per-instance and resets on remount.

### Commands

`run(cmd)` recognizes:

| Command         | Output                                                                            |
| --------------- | --------------------------------------------------------------------------------- |
| `whoami`        | `${ABOUT.handle} — ${ABOUT.title}`                                                |
| `ls projects`   | One line per `PROJECTS` entry: `${id padded to 10}  ${title}`                     |
| `cat about.md`  | `ABOUT.bio` as a single line                                                      |
| `clear`         | Clears `lines`. No echo.                                                          |
| `help`          | The static `HELP` array (6 lines).                                                |
| anything else   | Two lines: `zsh: command not found: ${first word}` then `Type \`help\` to see available commands.` |
| empty input     | Echoes the empty `"in"` line and produces no output.                              |

### Surface behavior

The outer `<div>` is the fake terminal body. `onClick` focuses `inputRef`. Two biome a11y rules are intentionally suppressed (`noStaticElementInteractions`, `useKeyWithClickEvents`) because all keyboard input is delegated to the real `<input>` element — see the inline ignore comments.

The form sits at the bottom of the scroll area. Submitting calls `run(input)` and clears the field.

Source content: `ABOUT`, `PROJECTS` from [portfolio-data.ts](../src/lib/portfolio-data.ts).

---

## SettingsApp ([SettingsApp.tsx](../src/components/apps/SettingsApp.tsx))

Two-pane settings layout, but with a single panel ("Appearance"). Only the right pane has actual content.

Outer grid: `grid h-full grid-cols-[180px_1fr] divide-x divide-separator`.

### Sidebar (left, decorative)

`<aside className="bg-surface-secondary px-3 py-4">` showing a `System` heading and a single highlighted "Appearance" row. There is no navigation logic — the sidebar reflects the only available panel.

### Right pane

Two sections inside an `overflow-auto p-6` container:

#### Theme

A flex row of two `<ThemeCard>`s (local helper):

| Card  | Active when                | Click effect             | Icon (lucide) | Swatch                                                  |
| ----- | -------------------------- | ------------------------ | ------------- | -------------------------------------------------------- |
| Light | `theme === "glass-light"`  | `setTheme("glass-light")` | `Sun`         | `bg-linear-to-br from-white to-zinc-200`                |
| Dark  | `theme === "glass-dark"`   | `setTheme("glass-dark")`  | `Moon`        | `bg-linear-to-br from-zinc-800 to-zinc-950`             |

`theme` and `setTheme` come from `useTheme()` (see [desktop-shell.md](desktop-shell.md#usetheme)). Active card has `border-accent`.

#### Wallpaper

`<section>` containing a `grid grid-cols-2 gap-3 sm:grid-cols-4` of `<button>` tiles. The tile list is a local constant `WALLPAPERS`:

| `id`        | `label`              | `src`                                                                            |
| ----------- | -------------------- | -------------------------------------------------------------------------------- |
| `gradient`  | `Gradient (default)` | `null`                                                                           |
| `bigsur`    | `Big Sur`            | `https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=2400`               |
| `monterey`  | `Monterey`           | `https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=2400`               |
| `sequoia`   | `Sequoia`            | `https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?w=2400`            |

Click on a tile calls `updateWallpaper(src)`, which:

1. Sets `localStorage["portfolio:wallpaper"]` to `src` (or removes the key when `src === null`).
2. Updates local `wallpaper` state.
3. Dispatches a `new Event("portfolio:wallpaper-change")` on `window` so [Wallpaper](../src/components/desktop/Wallpaper.tsx) re-reads.

Active tile has `border-accent shadow-overlay`. Tiles with no `src` show only the gradient background; tiles with a `src` overlay an `<img>`.

This is the only app that mutates anything outside its own state.

---

## Cross-references

- The window types and store these apps depend on — [window-manager.md](window-manager.md).
- The `Wallpaper`/`SettingsApp` event contract — [desktop-shell.md](desktop-shell.md#wallpaper).
- All static content powering apps — [data.md](data.md).
- Brand-icon rendering used in About and the desktop context menu — [styling-and-icons.md](styling-and-icons.md#brandicon).
