# Apps

Each window's body content. The seven apps live in [src/components/apps/](../src/components/apps/) and are wired into the window manager through [registry.ts](../src/components/apps/registry.ts).

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
| 2 | `about`    | About Me           | `User`                 | 520 × 600             |
| 3 | `resume`   | Resume             | `FileText`             | 720 × 800             |
| 4 | `contact`  | Contact            | `Mail`                 | 520 × 520             |
| 5 | `terminal` | Terminal           | `Terminal`             | 640 × 420             |
| 6 | `photos`   | Photos             | `Image`                | 880 × 600             |
| 7 | `settings` | System Settings    | `Settings`             | 720 × 560             |

Sizes are clamped at OPEN time to `vw - 80` and `vh - 160` (see [window-manager.md](window-manager.md#initial-position-math-open)).

The registry is consumed by:

- [WindowManager.tsx](../src/components/window/WindowManager.tsx) — to find a window's Component.
- [Dock.tsx](../src/components/desktop/Dock.tsx) — to render dock icons in order.
- [Spotlight.tsx](../src/components/desktop/Spotlight.tsx) — to populate the Apps group.
- [windows-store.ts](../src/lib/windows-store.ts) — to look up `defaultSize` on `OPEN`.

---

## FinderApp ([FinderApp.tsx](../src/components/apps/FinderApp.tsx))

Two-pane layout: a sidebar of saved filters on the left, a project grid on the right. Clicking a project replaces the whole pane with a detail view.

### State

- `filter: { kind: "all" } | { kind: "tag"; tag: string }` — initial `{ kind: "all" }`.
- `selected: Project | null` — initial `null`. When non-null, the component returns `<ProjectDetail>` and skips the grid layout entirely.

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

- A square gradient placeholder (`aspect-video`, `bg-linear-to-br from-[oklch(0.78_0.13_240)] to-[oklch(0.65_0.18_310)]`) with the project's first letter centered in white.
- `<h3>` title (`text-sm font-semibold`).
- `<p>` summary (`text-xs text-foreground/70`, line-clamp-2).
- Up to 3 tag chips (`rounded-full bg-default px-2 py-0.5 text-[10px]`).

Click → `setSelected(project)`.

### Project detail

`<ProjectDetail>` lives in its own file ([ProjectDetail.tsx](../src/components/apps/ProjectDetail.tsx)) so the case-study layout doesn't bloat FinderApp. It renders a long-form scroll inside `mx-auto max-w-2xl px-8 pt-6 pb-12`:

1. **Toolbar** — back button (`<ArrowLeft size={14}>`, `aria-label="Back to projects"`) + project title.
2. **Hero** — `aspect-video` gradient placeholder with the project's first letter (`text-5xl`, white).
3. **Title block** — `<h1 className="text-2xl font-semibold tracking-tight">`, then `summary` as a `text-base text-foreground/75` tagline, then tag chips.
4. **Meta strip** (`<MetaStrip>`, only when at least one of `role`/`stack`/`period`/`status` is set) — a `grid grid-cols-[72px_1fr]` definition list inside `rounded-xl border border-field-border bg-surface-secondary/40 p-5`. Stack entries render as mono-font pills.
5. **Description** — `description` as a body paragraph (with inline-formatting support; see below).
6. **The problem** (only when `problem` is set) — section heading + `<Prose>`.
7. **Engineering highlights** (only when `highlights` is non-empty) — section heading + a vertical stack of `<HighlightCard>`s. Each card has a numbered circle, a title, prose body, and an optional `code` snippet rendered in a `<pre>` on `bg-surface-tertiary/60`.
8. **Design** (only when `designNotes` is set) — section heading + `<Prose>`.
9. **What I learned** (only when `learnings` is non-empty) — section heading + `<ul>` where each item is a bolded `lead` followed by inline-formatted `body`.
10. **Visit project** link (when `project.link` is set) — same external-link button as before.

Section headings are uniformly `text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/50` (a Resume-style secondary header).

Inline formatting: a small `renderInline()` helper splits prose strings on three patterns and renders them with the matching primitives:

| Marker          | Rendered as                                                                  |
| --------------- | ---------------------------------------------------------------------------- |
| `` `code` ``    | `<code className="rounded bg-surface-tertiary/60 px-1 font-mono text-[12px]">` |
| `**bold**`      | `<strong className="font-semibold text-foreground">`                          |
| `*em*`          | `<em className="italic">`                                                     |

Multi-paragraph prose uses `\n\n` between paragraphs; the `<Prose>` helper splits on that and emits one `<p>` per chunk inside a `flex flex-col gap-3`.

The component renders gracefully for projects without any optional fields — only the toolbar, hero, title block, and (if present) `description` + `link` show.

There is no Finder toolbar (no back/forward arrows for the project history; the only "back" is the one inside ProjectDetail).

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
