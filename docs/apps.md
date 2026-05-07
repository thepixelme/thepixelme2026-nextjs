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
  Component: React.ComponentType<{ windowId: string }>;
}
```

The `Component` is rendered by [WindowManager](../src/components/window/WindowManager.tsx) inside a `<Window>` whose body is `flex-1 overflow-auto`. Apps therefore receive a fixed-height container and should size themselves with `h-full`, `flex flex-col`, or scrollable layouts — not assume infinite height.

`Component` receives a `windowId` prop so it can later participate in window-level features (e.g. dispatching `CLOSE` from inside the app). None of the current apps use this prop.

## Registry

[src/components/apps/registry.ts](../src/components/apps/registry.ts) exports a single `APPS: AppDef[]`. Order is significant — it determines dock left-to-right order and Spotlight result order.

| # | `id`       | `title`            | `icon` (lucide)        | `defaultSize` (w × h) |
| - | ---------- | ------------------ | ---------------------- | --------------------- |
| 1 | `finder`   | Finder             | `FolderOpen`           | 880 × 560             |
| 2 | `preview`  | Preview            | `Eye`                  | 1024 × 720            |
| 3 | `about`    | About Me           | `User`                 | 520 × 600             |
| 4 | `resume`   | Resume             | `FileText`             | 720 × 800             |
| 5 | `contact`  | Contact            | `Mail`                 | 520 × 520             |
| 6 | `terminal` | Terminal           | `Terminal`             | 640 × 420             |
| 7 | `photos`   | Photos             | `Image`                | 880 × 600             |
| 8 | `settings` | System Settings    | `Settings`             | 720 × 560             |

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

- `filter: { kind: "all" } | { kind: "tag"; tag: string }` — initial `{ kind: "all" }`.

### Derived data (memoized)

- `tags` — alphabetical unique list of all tags across projects.
- `visible` — `PROJECTS` filtered by the current `filter`.

### Sidebar

Two sections via the local `<SidebarSection>` helper:

| Section     | Items                                                |
| ----------- | ---------------------------------------------------- |
| Favorites   | `All Projects` (Star icon, sets `filter.kind = "all"`) |
| Tags        | One row per `tags[i]` (Tag icon)                     |

Each row is a `<SidebarItem>` `<button>` with active state `bg-default font-medium` when its kind+key matches the current `filter`.

Sidebar background: `bg-surface-secondary px-2 py-3 text-sm`. Outer grid: `grid-cols-[200px_1fr] divide-x divide-separator`.

### Grid (right pane)

`grid grid-cols-1 gap-3 md:grid-cols-2`. Each card is a `<button>` containing:

- The project's first screenshot (`aspect-video object-cover rounded-md`), or a gradient placeholder with the project's first letter when no screenshots exist.
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

A single 2-column grid that fills the window body — no vertical split, the right pane gets the full window height:

```
grid h-full grid-cols-[176px_1fr]
┌──────────┬──────────────────────────────────┐
│ sidebar  │ right pane (full height)         │
│          │                                  │
│ ⓘ Info   │   ImageView OR CaseStudy         │
│ ──────   │   (depending on selection)       │
│ ▢ thumb1 │                                  │
│ ▢ thumb2 │                                  │
└──────────┴──────────────────────────────────┘
```

`PreviewApp` owns a `view: "info" | number` state. Default: `0` (first screenshot) when there are screenshots; `"info"` otherwise. `key={project.id}` on the inner content forces a fresh mount when switching projects so `view` resets cleanly.

Right-pane render:
- `view === "info"` → `<div className="overflow-y-auto"><CaseStudy /></div>`
- `typeof view === "number"` → `<ImageView key={view} screenshot={screenshots[view]} index={view} total={screenshots.length} />`. The `key` forces remount on switch, which resets `zoom`/`pan`/`mode`/`naturalSize`.

### Sidebar (lives in PreviewApp)

`<aside className="flex flex-col gap-2 overflow-y-auto bg-surface-secondary p-2">` containing:

1. **Info thumb** — `aspect-video` `<button>` with `bg-surface-tertiary` background, centered `Info` icon (lucide, size 20) + small "Project Info" label below. Active when `view === "info"`: `border-accent`. Inactive: `border-transparent hover:border-field-border`.
2. A separator (`<hr className="my-1 border-0 border-t border-separator" />`) — only when there are screenshots.
3. Screenshot thumbs — `aspect-video` `<button>` containing `<img object-cover>`. Same border-2 styling as the Info thumb. Click sets `view = i`.

All buttons get `aria-current` reflecting selection.

### ImageView ([preview/ImageViewer.tsx](../src/components/apps/preview/ImageViewer.tsx))

A self-contained single-screenshot canvas. Selection and arrow-key nav live in PreviewApp; this component is purely the canvas + zoom controls + status bar.

**Props**: `{ screenshot: Screenshot; index?: number; total?: number }`. `index`/`total` only feed the status bar's "N of M" segment; if omitted, that segment is hidden.

**Layout** (`flex h-full flex-col`):

| Region | Class | Contents |
| --- | --- | --- |
| Canvas | `min-h-0 flex-1 relative overflow-hidden bg-surface-tertiary` | the image (transformed) + floating zoom controls |
| Status bar | `h-7 border-t border-separator bg-surface-secondary px-3 text-[11px]` | `[N of M · ]WxH · ZZZ%` (+ alt text right-aligned) |

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

### CaseStudy ([preview/CaseStudy.tsx](../src/components/apps/preview/CaseStudy.tsx))

A long-form scroll inside `mx-auto max-w-2xl px-8 pt-6 pb-12`, rendering project metadata top to bottom:

1. **Title block** — `<h1 className="text-2xl font-semibold tracking-tight">` title, `summary` tagline, tag chips.
2. **CTA row** (only when `project.link` or `project.source` is set) — `flex flex-wrap gap-2` of glass anchor buttons:
   - **Primary**: `buttonVariants({ variant: "secondary" })`, label = `linkLabel ?? "Visit project"`, trailing `<ExternalLink size={14}>`.
   - **Source**: `buttonVariants({ variant: "tertiary" })`, leading `<BrandIcon icon={siGithub} size={14}>`, label "View source".
   Both use HeroUI Pro's glass theme (`button--secondary` / `button--tertiary` get `backdrop-filter: blur(var(--glass-blur))` automatically). Anchors carry `target="_blank" rel="noopener noreferrer"`.
3. **Meta strip** (`<MetaStrip>`, only when at least one of `role`/`stack`/`status` is set) — `grid grid-cols-[72px_1fr]` definition list inside `rounded-xl border border-field-border bg-surface-secondary/40 p-5`. Stack entries render as mono pills.
4. **Description** — body paragraph (with inline-formatting support; see below).
5. **The problem** (only when `problem` is set) — section heading + `<Prose>`.
6. **Engineering highlights** (only when `highlights` is non-empty) — section heading + a vertical stack of `<HighlightCard>`s. Each card has a numbered circle, a title, prose body, and an optional `code` snippet in a `<pre>`.
7. **Design** (only when `designNotes` is set) — section heading + `<Prose>`.
8. **What I learned** (only when `learnings` is non-empty) — section heading + `<ul>` of `lead` (bold) + inline-formatted `body`.

There is no screenshot section — that's the ImageViewer's job. There is no internal toolbar or back button — the window's traffic-light close handles closing.

Section headings are uniformly `text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/50`.

Inline formatting (`renderInline`) splits prose strings and renders the markers:

| Marker          | Rendered as                                                                  |
| --------------- | ---------------------------------------------------------------------------- |
| `` `code` ``    | `<code className="rounded bg-surface-tertiary/60 px-1 font-mono text-[12px]">` |
| `**bold**`      | `<strong className="font-semibold text-foreground">`                          |
| `*em*`          | `<em className="italic">`                                                     |

Multi-paragraph prose uses `\n\n`; `<Prose>` splits and emits one `<p>` per chunk inside `flex flex-col gap-3`.

CaseStudy renders gracefully for projects without optional fields — only the title block (and, if present, `description`) are unconditional.

---

## AboutApp ([AboutApp.tsx](../src/components/apps/AboutApp.tsx))

Single scrollable column at `p-8`, gap-6.

Sections, top to bottom:

1. **Header row** — initials avatar (computed by splitting `ABOUT.name` on spaces and taking each first character) inside an 80×80 circle with a blue→purple gradient. Right of it: `<h1>` name, `<p>` title, location with `<MapPin size={12}>`.
2. **Bio** — `<p>` of `ABOUT.bio`.
3. **Skills** — heading + flex-wrap of `<Chip size="sm" variant="secondary">` per `ABOUT.skills[i]`. `Chip` is from `@heroui/react`.
4. **Find me** — heading + flex-wrap of social links. Each link is an `<a>` with `target="_blank" rel="noopener noreferrer"`, rendering `<BrandIcon icon={BRANDS[s.brand]} size={14} />` and `s.label`.

`BRANDS` is a local mapping from the `brand` literal to a `simple-icons` constant: `github → siGithub`, `x → siX`, `dribbble → siDribbble`, `instagram → siInstagram`. The `Social.brand` union and the `BRANDS` map must be kept in sync.

Source content: `ABOUT` and `SOCIALS` from [portfolio-data.ts](../src/lib/portfolio-data.ts).

---

## ResumeApp ([ResumeApp.tsx](../src/components/apps/ResumeApp.tsx))

A document-style layout: `mx-auto max-w-2xl px-12 py-10`.

Sections:

1. **Header** — `<h1>` name, role, location · email, and a `Download PDF` link (`href="/resume.pdf"`, `download`). The PDF file is not currently present in `public/`; clicking yields a 404.
2. **Experience** — every `RESUME` entry with `kind === "job"`, rendered via the local `<Section>` and `<Entry>` helpers.
3. **Education** — every `RESUME` entry with `kind === "education"`, same renderer.

`<Section>` renders an uppercase tracking-widest heading (`text-xs font-semibold text-foreground/60`) and a `flex flex-col gap-6` of children.

`<Entry>` renders, in a `flex items-baseline justify-between` row:

- Left: `<h3>` role + org.
- Right: `start — end` in `tabular-nums`.

Then a `<ul list-disc>` of bullets.

Source content: `ABOUT`, `RESUME` from [portfolio-data.ts](../src/lib/portfolio-data.ts).

---

## ContactApp ([ContactApp.tsx](../src/components/apps/ContactApp.tsx))

A controlled form with three fields and a submit button. No backend — submission opens the user's mail client.

State: `name`, `email`, `message` — three independent `useState<string>` values.

`onSubmit` (called from the `<form onSubmit>`):

```
subject = encodeURIComponent(`Hello from ${name || "your portfolio"}`)
body    = encodeURIComponent(`${message}\n\n— ${name}${email ? ` (${email})` : ""}`)
window.location.href = `mailto:${ABOUT.email}?subject=${subject}&body=${body}`
```

Layout: `<form className="flex h-full flex-col gap-4 p-8">` containing an intro `<h1> + <p>`, three `<Field>` rows, and a footer `<div className="mt-auto flex justify-end">` with a `<Button type="submit">`.

`<Field>` is a local helper: `<div>` + `<label htmlFor={id}>` + `{children}`. Each field uses `id="contact-name" / "contact-email" / "contact-message"`. Inputs come from `@heroui/react` (`Input`, `TextArea`, `Button`). `TextArea` is `rows={6}`. All three fields are `required`.

There is no client-side validation feedback beyond the browser's native `:invalid` styling, and no success state.

Source content: `ABOUT.email` from [portfolio-data.ts](../src/lib/portfolio-data.ts).

---

## TerminalApp ([TerminalApp.tsx](../src/components/apps/TerminalApp.tsx))

Fake shell. The only window with a non-glass body — full bleed `bg-[oklch(0.18_0.012_260)]/95`, mono font.

### State

- `lines: { kind: "out" | "in"; text: string }[]` — the scrollback. `"in"` lines render in white prefixed with `➜  ~`; `"out"` lines render in `text-emerald-200/90`.
- `input: string` — the current input value.
- `inputRef`, `scrollRef` — DOM refs for focus delegation and scroll-to-bottom.
- `printedGreeting: useRef<boolean>` — guards a one-time greeting.

### Greeting

On mount, lines are appended one-by-one with a 220ms delay between them, drawn from `GREETING`:

```
Last login: <new Date().toDateString()> on ttys001
Welcome. Type `help` to begin.
```

Re-mounts (e.g. closing and reopening the window) reset state and re-print the greeting because `printedGreeting` is per-instance.

### Commands

`run(cmd)` recognizes:

| Command         | Output                                                                            |
| --------------- | --------------------------------------------------------------------------------- |
| `whoami`        | `${ABOUT.handle} — ${ABOUT.title}`                                                |
| `ls projects`   | One line per `PROJECTS` entry: `${id padded to 10}  ${title}`                     |
| `cat about.md`  | `ABOUT.bio` as a single line                                                      |
| `clear`         | Clears `lines`. No echo.                                                          |
| `help`          | The static `HELP` array (6 lines).                                                |
| anything else   | `zsh: command not found: ${first word}`                                           |
| empty input     | Echoes the empty `"in"` line and produces no output.                              |

### Surface behavior

The outer `<div>` is the fake terminal body. `onClick` focuses `inputRef`. Two biome a11y rules are intentionally suppressed (`noStaticElementInteractions`, `useKeyWithClickEvents`) because all keyboard input is delegated to the real `<input>` element — see the inline ignore comments.

The form sits at the bottom of the scroll area. Submitting calls `run(input)` and clears the field.

Source content: `ABOUT`, `PROJECTS` from [portfolio-data.ts](../src/lib/portfolio-data.ts).

---

## PhotosApp ([PhotosApp.tsx](../src/components/apps/PhotosApp.tsx))

A masonry-ish grid plus a custom lightbox. No HeroUI Modal is used.

### Grid

`grid grid-cols-2 gap-2 p-4 sm:grid-cols-3`. Each cell is a `<button>`:

- Class: `group relative aspect-4/3 overflow-hidden rounded-md border border-field-border`.
- Inside: an `<img src={p.src} alt={p.alt} loading="lazy" className="object-cover transition-transform group-hover:scale-105">`.
- If `p.caption` is defined: a bottom gradient overlay (`bg-linear-to-t from-black/60 to-transparent`) that fades in on hover (`opacity-0 transition-opacity group-hover:opacity-100`).
- `aria-label` is `Open ${p.alt}`.
- Click → `setActive(i)`.

### Lightbox

When `active !== null`, an additional fixed overlay renders:

```
<div role="dialog" aria-modal aria-label={photo.alt}
     className="fixed inset-0 z-60 grid place-items-center bg-black/70 backdrop-blur-sm"
     onClick={() => setActive(null)}>
  <div onClick={stopPropagation} className="relative max-h-[85vh] max-w-[90vw]">
    <button aria-label="Close photo" .../>
    <img .../>
    {caption && <p className="mt-2 text-center text-sm text-white/90">{caption}</p>}
  </div>
</div>
```

Behavior:

- Backdrop click closes (`setActive(null)`).
- Inner click `stopPropagation`s so clicks on the image don't close.
- An `Escape` key listener (registered when `active !== null`, removed when it goes back to `null`) closes the lightbox.

Source content: `PHOTOS` from [portfolio-data.ts](../src/lib/portfolio-data.ts).

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
