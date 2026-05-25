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

The `Component` is rendered in one of two places depending on viewport:

- **Desktop (≥ 1024 px):** inside a `<Window>` (rendered by [WindowManager](../src/components/window/WindowManager.tsx)) whose body is `flex-1 overflow-auto`.
- **Mobile (< 1024 px):** inside an `<AppSheet>` (rendered by [MobileShell](../src/components/mobile/MobileShell.tsx)) whose body is `min-h-0 flex-1 overflow-auto` with an inner `h-full` wrapper.

In both cases the app receives a fixed-height container and should size itself with `h-full`, `flex flex-col`, or scrollable layouts — not assume infinite height. The `windowId` prop is the same in both contexts.

**On mobile, every non-closed window stays mounted** (in a stacked `<AppSheet>` per window record) so local app state survives minimize/restore and sheet reordering. Only the topmost non-minimized sheet is interactive; others are `inert`. See [desktop-shell.md → AppSheet](desktop-shell.md#appsheet).

`Component` receives a `windowId` prop so it can later participate in window-level features (e.g. dispatching `CLOSE` from inside the app). None of the current apps use this prop.

## Registry

[src/components/apps/registry.ts](../src/components/apps/registry.ts) exports a single `APPS: AppDef[]`. Order is significant — it determines dock left-to-right order (for apps with `hideFromDock !== true`) and Spotlight result order.

| # | `id`       | `title`            | `icon` (lucide)        | `defaultSize` (w × h) | in dock |
| - | ---------- | ------------------ | ---------------------- | --------------------- | ------- |
| 1 | `about`    | About              | `User`                 | 560 × 680             | ✓       |
| 2 | `finder`   | Finder             | `FolderOpen`           | 880 × 560             | ✓       |
| 3 | `contact`  | Contact            | `Mail`                 | 720 × 620             | ✓       |
| 4 | `terminal` | Terminal           | `Terminal`             | 640 × 420             | ✓       |
| 5 | `preview`  | Preview            | `Eye`                  | 1024 × 720            | —¹      |

¹ `preview` has `hideFromDock: true` — it's launched by [FinderApp](#finderapp-finderapptsx) with a `projectId` payload, not from the dock.

Sizes are clamped at OPEN time to `vw - 80` and `vh - 160` (see [window-manager.md](window-manager.md#initial-position-math-open)).

The registry is consumed by:

- [WindowManager.tsx](../src/components/window/WindowManager.tsx) — to find a window's Component.
- [Dock.tsx](../src/components/desktop/Dock.tsx) — to render dock icons in order (desktop).
- [MobileDock.tsx](../src/components/mobile/MobileDock.tsx) — to render dock icons in order (mobile).
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

### Mobile (< 1024 px)

On mobile (driven by [`useIsMobile()`](../src/lib/useIsMobile.ts)), PreviewApp branches before rendering the desktop toolbar/sidebar:

- **Info view** — `<CaseStudy>` renders full-bleed inside `<div className="h-full overflow-y-auto">`. The PanelLeft toggle and sidebar are not rendered. The AppSheet header already provides "Done" + title.
- **Screenshot view** — `<MobileImageViewer>` ([preview/MobileImageViewer.tsx](../src/components/apps/preview/MobileImageViewer.tsx)) replaces `<ImageView>`. PreviewApp owns the `view` index and passes `onClose` (→ `setView("info")`) and `onIndexChange` (→ `setView(i)`).

`<MobileImageViewer>` is a touch-first canvas with always-visible top bar and filmstrip (no auto-hide; the chrome reserves space rather than overlaying the image). The component **stays mounted across index changes** (no `key` prop in PreviewApp) so filmstrip scroll position survives; the index-change effect does a full reset of `zoom`/`pan`/`mode`/`gesture`/`isDragging`/`naturalSize`/`gestureStart`/`pointers` so the next screenshot doesn't briefly render with the previous image's `fitScale`.

**Layout** — a `flex h-full flex-col` column with three in-flow children:
- **Top bar** (`relative flex h-11 shrink-0 bg-surface border-b border-separator`): `< Project Info` back button on the left, `N of M` counter centered via `absolute inset-x-0 text-center` (the `relative` parent anchors it). Always rendered.
- **Canvas** (`relative flex-1 min-h-0 touch-none select-none overflow-hidden`): the image as `motion.img` inside a statically-centered wrapper — the wrapper owns `-translate-x/y-1/2` for centering; the `motion.img` owns only numeric `x`/`y`/`scale`/`opacity` so Motion never fights the CSS centering on the same transform slot. `touch-none` is essential: without it the browser interprets pointer gestures as native scroll/pinch and emits `pointercancel` mid-gesture.
- **Bottom filmstrip** (`flex h-16 shrink-0 bg-surface border-t border-separator overflow-x-auto`): one thumb per screenshot, `aspect-9/19 h-12` portrait / `aspect-video h-12` landscape, current bordered `border-accent`. The active thumb auto-scrolls into view via `scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", inline: "center" })`. Filmstrip is hidden only when `screenshots.length === 1`.

Because top bar and filmstrip are in the flex flow (not absolutely positioned overlays), the canvas's `flex-1` height excludes them and the fit-scaled image never sits under chrome.

**Gestures** (all on the canvas; pointer events, no library):

| Gesture | Effect |
| --- | --- |
| Double-tap | Toggle fit ↔ actual size (mirrors desktop `<ImageView>` double-click). Detected via `lastTapAt` ref + `DOUBLE_TAP_MS` (300 ms) window. |
| Single tap | No-op. (Chrome is always visible, so tap-to-toggle is gone.) |
| Swipe down (when fit) | `dy > 80 && |dy| > |dx|` → `onClose()`. Rubber-band: live opacity = `clamp(0.4, 1 - max(0, dy)/300, 1)`. |
| Swipe ← / → (when fit) | `|dx| > 60 && |dx| > |dy|` → swipe-left = next, swipe-right = previous. Clamped to `[0, len-1]`. |
| Pinch (two fingers) | Zoom around the pinch midpoint (canvas-centered coords). All math reads from `gestureStart` snapshot (`start.zoom`, `start.panX/Y`, `start.pinchDist`) — never closure state — so rapid `pointermove` events stay anchored. Clamped `[0.05, 40]`. Sets `mode = "custom"`. |
| One-finger drag (when `start.zoom > 1`) | Pans. Branch gates on `start.zoom`, not closure `zoom`. |
| Tap filmstrip thumb | `onIndexChange(i)`. |
| Tap `< Project Info` | `onClose()`. |

**Pinch→drag handoff:** when one of two pointers lifts, `gestureStart` is repopulated with `kind: "drag"` using the remaining pointer's coords + the **committed** `pan`/`zoom`, so the next pointermove stays anchored.

**State model:**

```ts
type GestureStart =
  | { kind: "drag"; startX; startY; startTime; panX; panY; zoom }
  | { kind: "pinch"; pinchDist; panX; panY; zoom };
```

Discriminated union narrowing in each handler prevents a tap classifier from reading `pinchDist` or a pinch handler from reading `startX`.

**Out of scope:**

- The AppSheet header (`<header className="… h-11">` from [mobile/AppSheet.tsx](../src/components/mobile/AppSheet.tsx)) stays visible — that's the system-level chrome and is not affected by viewer state.
- PreviewApp's arrow-key listener (`window.addEventListener("keydown", …)`) is inert on touch devices but remains for the desktop case; no harm.
- Desktop `<ImageView>` is unchanged.

---

## AboutApp ([AboutApp.tsx](../src/components/apps/AboutApp.tsx))

Single scrollable column at `p-8`, gap-6.

Sections, top to bottom:

1. **Header row** — initials avatar (computed by splitting `ABOUT.name` on spaces and taking each first character) inside an 80×80 circle with a blue→purple gradient. Right of it: `<h1>` name, `<p>` title, location with `<MapPin size={12}>`.
2. **Bio** — `<p>` of `ABOUT.bio`.
3. **Skills** — heading + flex-wrap of pill-shaped `<span>` tags per `ABOUT.skills[i]` (`inline-flex shrink-0 items-center gap-0.5 rounded-2xl bg-default px-1 py-0 text-xs leading-5 font-medium`).
4. **Find me** — heading + flex-wrap of social links. Each link is an `<a>` with `target="_blank" rel="noopener noreferrer"`, rendering `<BrandIcon icon={BRANDS[s.brand]} size={14} />` and `s.label`.

`BRANDS` is a local mapping from the `brand` literal to a `simple-icons` constant: `github → siGithub`. The `Social.brand` union and the `BRANDS` map must be kept in sync.

Source content: `ABOUT` and `SOCIALS` from [portfolio-data.ts](../src/lib/portfolio-data.ts).

---

## ContactApp ([ContactApp.tsx](../src/components/apps/ContactApp.tsx))

A controlled form styled as a Superhuman-inspired compose pane — generous whitespace, hairline-only dividers, a display-weight subject, and a pill Send button anchored bottom-right with a `⌘↵` shortcut hint. Submission POSTs to a [Resend](https://resend.com/)-backed route handler at [`/api/contact`](../src/app/api/contact/route.ts).

State: `name`, `email`, `subject`, `message` — four independent `useState<string>` values, plus `status: "idle" | "sending" | "sent" | "error"` and `errorMsg: string | null`. Derived: `canSend = name && email && message && status !== "sending"` (all trimmed); subject is optional. A `sentTimerRef` (cleaned up on unmount) flips `status` from `"sent"` back to `"idle"` after 4 s.

`onSubmit` (called from `<form onSubmit>`, the footer Send button, and `⌘+Enter` / `Ctrl+Enter` from anywhere inside the form) sets `status = "sending"`, posts the four fields as JSON to `/api/contact`, then parses the response defensively. The expected shape is decoded through a local `ContactResponse` discriminated union + `isContactResponse` type guard; both `res.ok` and the body shape must agree before the success branch runs, so a network failure, non-JSON body, or unexpected shape all fall through to the generic error branch:

| Server outcome | Client behavior |
| --- | --- |
| `200 { ok: true }` | `status = "sent"`, clear `subject` + `message` (keep `name` + `email`), auto-revert to `idle` after 4 s |
| `429 { ok: false, error: "rate_limit" }` | `errorMsg = "Too many messages — try again in a few minutes."`, `status = "error"` |
| `400 { ok: false, error: "validation" }` | `errorMsg = "Please check the form fields."`, `status = "error"` |
| anything else (incl. network/parse failure, `500`) | `errorMsg = "Couldn't send. Please try again."`, `status = "error"` |

Early-returns when `!canSend`. The form's `onKeyDown` intercepts `⌘/Ctrl + Enter`, calls `preventDefault`, and dispatches `requestSubmit()` when sendable. While `status === "sending"`, every input/textarea gets `readOnly` so the form can't be edited mid-submit (kept as `readOnly` rather than `disabled` to preserve the visual treatment and the keyboard-shortcut path).

Layout: `<form className="flex h-full flex-col">` containing five stacked regions, each separated from the next by `border-b border-separator`:

1. **To row** — a non-editable recipient chip: `bg-surface-secondary` rounded-full pill with a 28px gradient avatar (`bg-linear-to-br from-accent to-accent/70`) showing initials of `ABOUT.name` (up to 2 chars), the name at `text-[15px]`, and the email at `text-[13px] text-foreground/40`.
2. **From row** — two adjacent borderless `<input>`s: name (flex-1) and email (`type="email"`, fixed `w-60`), separated by a thin `/` glyph in `text-foreground/20`. Both `required`.
3. **Subject** — a single full-width borderless `<input>` at `text-[20px] font-medium tracking-tight`, with light placeholder styling. No label — the size signals its role.
4. **Body** — a borderless `<textarea>` with `min-h-0 flex-1 resize-none bg-transparent px-7 py-5 text-[15px] leading-[1.7]`, absorbing remaining vertical space.
5. **Footer** — `flex items-center justify-end gap-3 px-5 py-3 border-t border-separator`. Contains, in order: an `<output aria-live="polite">` status line pushed to the left via `mr-auto` (shows "Message sent — thanks!" in `text-foreground/70` when `status === "sent"`, or `errorMsg` in `text-red-500` when `status === "error"`; collapses via `empty:hidden` otherwise — note that `text-red-500` is a one-off semantic status color, **not** a theme token, because no danger token is defined in [globals.css](../src/app/globals.css) or [STYLEGUIDE.md](../STYLEGUIDE.md)); a `<kbd>` shortcut hint (`⌘ ↵`, hidden below `sm`); and a primary pill button: `rounded-full bg-accent px-5 h-9`. The button's icon + label switch on status — `Loader2` with `animate-spin` + "Sending…" while `sending`, `Check` + "Sent" while `sent` (also `disabled` so it can't re-submit during the 4 s auto-revert), otherwise lucide `Send` + "Send". Disabled state uses `opacity-40`. Hover applies `brightness-110`.

A local `FieldRow` helper renders rows 1–2: `flex items-center gap-5 border-b border-separator px-7 py-3.5` with a `w-10` label cell (`text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/40`) followed by a `flex-1` content cell. The subject row is rendered inline (no label).

Inputs are native `<input>` / `<textarea>` so borders/backgrounds stay flush against the row hairlines, with the pill-shaped Send `<button>` keeping its shape, gradient, and disabled treatment fully token-driven. All fields carry `aria-label`s.

Source content: `ABOUT.name` from [portfolio-data.ts](../src/lib/portfolio-data.ts). The destination email is *not* shown in the UI — it lives in the server-only `CONTACT_EMAIL` env var.

### Route handler ([src/app/api/contact/route.ts](../src/app/api/contact/route.ts))

POST endpoint backing the form. Runs on the `nodejs` runtime (route handlers aren't cached by default for POST). Requires three env vars: `RESEND_API_KEY` (Resend credential), `CONTACT_EMAIL` (destination address), and `CONTACT_FROM_EMAIL` (sender address — must be on a domain verified in Resend). Set all three in `.env.local` for dev and in the production hosting env. Any missing returns `500 { ok: false, error: "server" }` with a server-side `console.error`.

Flow:

1. Parse `await request.json()` as `unknown` — malformed body → `400 { ok: false, error: "validation", fields: { message: "Invalid request" } }`.
2. Validate with `typeof === "string"` coercion (no field crashes the handler if a caller sends `{ "name": {} }`). Per-field rules: `name` 1–100, `email` 1–200 + matches `^[^\s@]+@[^\s@]+\.[^\s@]+$`, `subject` ≤ 200 (optional), `message` 1–5000. Any failure → `400 { ok: false, error: "validation", fields }`.
3. Rate-limit by IP (`x-forwarded-for[0]` → `x-real-ip` → `"unknown"`). Module-scoped `Map<string, number[]>` keeps timestamps within a 10 min window. Limit is 3 submits per IP per window; on each call, expired timestamps are pruned and the map is hard-capped at 5,000 entries (LRU-evict oldest only when inserting a *new* key, so existing IPs never displace strangers). Over the limit → `429 { ok: false, error: "rate_limit" }`. Caveat: per-process state — each serverless instance has its own counter and the limit resets on deploy/restart.
4. Send via `resend.emails.send(payload, { idempotencyKey: \`contact/${Date.now()}/${crypto.randomUUID()}\` })`. `from: process.env.CONTACT_FROM_EMAIL` (must resolve to a sender on a Resend-verified domain). `to: [process.env.CONTACT_EMAIL]`. `replyTo: <visitor email>` so Reply in the inbox addresses the visitor — no auto-reply is sent. Subject is `[Portfolio] ${subject || \`Hello from ${name}\`}`. Both `text` and `html` versions are built; the HTML version HTML-escapes every interpolated value via a local `escapeHtml`.
5. Resend's `{ data, error }` is the primary control flow per the SDK's design. The `send` call is wrapped in a single `try/catch` for unexpected runtime/network exceptions so the route always honors its JSON contract: any throw or non-null `error` → `500 { ok: false, error: "server" }` (the error is `console.error`'d but not returned to the client). Success → `200 { ok: true, id }`.

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

## Cross-references

- The window types and store these apps depend on — [window-manager.md](window-manager.md).
- All static content powering apps — [data.md](data.md).
- Brand-icon rendering used in About — [styling-and-icons.md](styling-and-icons.md#brandicon).
