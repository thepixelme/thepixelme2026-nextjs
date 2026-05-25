# Style Guide — thepixelme2026 Portfolio

This portfolio is a **macOS desktop simulation**. The goal is faithfulness to the macOS look-and-feel (Big Sur / Sonoma glassmorphism), not invention. When in doubt, match how Apple does it.

This file is the canonical style reference. Read it before writing any component or CSS. If you change a convention, update this file in the same PR.

---

## 1. Stack & versions

- **Next.js 16.2.4** — App Router only. APIs differ from training data; consult [node_modules/next/dist/docs/01-app/](node_modules/next/dist/docs/01-app/) before writing Next-API-touching code.
- **React 19** — `"use client"` directive on every interactive component. Default to server components for static content (apps that don't use state/events).
- **Tailwind CSS v4** — configured via `@tailwindcss/postcss`. Use `@theme` block in CSS, not `tailwind.config.js`. Arbitrary values via `[var(--token)]` are fine and encouraged for glass tokens.
- **No component library** — UI is built from plain React elements + Tailwind utilities. The design tokens (surfaces, separators, shadows, easing curves) and Tailwind `@theme inline` mappings live in [src/app/globals.css](src/app/globals.css). They were originally forked from HeroUI Pro's glass theme; the dependency is gone but the token names (`bg-surface`, `text-foreground`, `border-separator`, etc.) are preserved.
  - Keep theme values centralised in `globals.css` — do not redefine them per-component.
  - Use native `onClick` on `<button>` / `<a>` elements (the previous `onPress` convention was a HeroUI-ism and no longer applies).
- **lucide-react ^1.11.0** — the only icon library. Do not introduce another.
- **Biome 2.2** — both linter and formatter. `npm run lint` (check) and `npm run format` (write).

---

## 2. Theme — glassmorphism

Default theme is `glass-light` (Big Sur). The theme is applied via `<html className>` (`"glass-light"` or `"glass-dark"`) and persisted by the `useTheme` hook in [src/lib/theme.ts](src/lib/theme.ts). Theme variables live in [src/app/globals.css](src/app/globals.css) under the `html.glass-light` and `html.glass-dark` selectors — **never hardcode colors**, always reference tokens.

### 2.1 Setting the theme

```html
<html class="glass-light"> <!-- or "glass-dark" -->
```

Persisted in `localStorage` under `portfolio:theme`. Read on mount via [src/lib/theme.ts](src/lib/theme.ts).

### 2.2 Core tokens (do not hardcode equivalents)

| Token                    | Use for                                                               |
| ------------------------ | --------------------------------------------------------------------- |
| `--surface`              | Window body, menu bar, dock pill (semi-transparent)                   |
| `--surface-secondary`    | Sidebar, dock background, recessed panels                             |
| `--surface-tertiary`     | Hover/pressed states, terminal body                                   |
| `--overlay`              | Spotlight, popovers, dropdowns                                        |
| `--field-background`     | Inputs, searchfield                                                   |
| `--field-border`         | Subtle borders on fields                                              |
| `--separator`            | 1px hairlines between menu items, sidebar rows, etc.                  |
| `--background`           | Wallpaper fallback color (when no image)                              |
| `--background-gradient`  | Wallpaper fallback gradient                                           |
| `--accent`               | Primary text, focus ring, selection                                   |
| `--default`              | Neutral interactive bg (button hover, etc.)                           |
| `--glass-blur`           | Backdrop blur radius (20px light / 36px dark)                         |
| `--surface-shadow`       | Card / dock / menubar shadow (transparent in glass)                   |
| `--overlay-shadow`       | Window, modal, popover shadow                                         |

### 2.3 Glass surface recipe

Any surface that should look like macOS frosted glass:

```tsx
className="bg-surface backdrop-blur-(--glass-blur) border border-field-border shadow-overlay rounded-xl"
```

For deeper / darker surfaces (e.g. dock), swap `bg-surface` → `bg-surface-secondary`. For the most translucent (e.g. menu bar), keep `bg-surface` but use a thinner border (`border-b border-separator`).

### 2.4 Liquid glass (overlay surfaces — NC only for now)

A separate, heavier glass recipe for floating overlay panels modeled on macOS Tahoe / iOS 26. Used today by the [Notification Center](docs/desktop-shell.md#notification-center-srccomponentsnotificationsnotificationcentertsx) panel and the consent card inside it. Do not apply to MenuBar, Dock, Spotlight, or Windows without an explicit design discussion — the look is intentionally distinct.

Tokens (defined per theme in [src/app/globals.css](src/app/globals.css), mapped via `@theme inline`):

| Token | Tailwind utility | Purpose |
|---|---|---|
| `--liquid-glass-blur` | `backdrop-blur-(--liquid-glass-blur)` | Heavier blur (40px light, 50px dark) |
| `--liquid-glass-saturate` | `backdrop-saturate-(--liquid-glass-saturate)` | macOS Vibrancy saturation boost (180%) |
| `--liquid-glass-surface` | `bg-liquid-glass-surface` | Translucent panel background |
| `--liquid-glass-card-surface` | `bg-liquid-glass-card` | Translucent notification-card background |
| `--liquid-glass-shadow` | `shadow-liquid-glass` | Outer drop shadow + inset top specular highlight (panels) |
| `--liquid-glass-card-shadow` | `shadow-liquid-glass-card` | Inset top specular highlight (cards) |
| `--liquid-glass-highlight` | (raw token, referenced by the two shadow tokens) | Highlight color used in both shadow recipes |

Panel recipe:
```tsx
className="rounded-2xl bg-liquid-glass-surface shadow-liquid-glass backdrop-blur-(--liquid-glass-blur) backdrop-saturate-(--liquid-glass-saturate)"
```

Card recipe (when sitting on a liquid-glass panel — no extra `backdrop-blur` needed):
```tsx
className="rounded-xl bg-liquid-glass-card shadow-liquid-glass-card"
```

Detached floating positioning is part of the look: panel should leave a small margin from the viewport edges (e.g. `right-3 top-10 bottom-3`) so the wallpaper shows around it. Touching a viewport edge defeats the specular highlight.

### 2.5 Traffic-light colors

These are macOS-canonical, hardcode them:

```css
--tl-red:    #ff5f57;
--tl-yellow: #febc2e;
--tl-green:  #28c840;
```

---

## 3. Typography

- **Sans / UI**: Inter (loaded via `next/font/google` in [src/app/layout.tsx](src/app/layout.tsx) → `--font-sans`). Inter is the closest free analog to SF Pro.
- **Mono**: JetBrains Mono via `next/font/google` → `--font-mono`. Used in TerminalApp and any code blocks.
- Apply `font-sans` on `<body>`. Headings inherit; size with Tailwind utilities, not custom CSS.

### 3.1 macOS sizes (use these for chrome)

| Element             | Size       | Weight       |
| ------------------- | ---------- | ------------ |
| Menu bar text       | `text-xs` (12px) | `font-medium` (500) |
| Window title        | `text-xs` (12px) | `font-semibold` (600) |
| Dock label tooltip  | `text-xs` (12px) | `font-medium`        |
| Body / app content  | `text-sm` (14px) | `font-normal`        |
| App headings        | `text-lg`–`text-2xl` | `font-semibold` |

Antialiasing: `antialiased` is set on `<html>` in layout. Don't override.

---

## 4. Iconography

- **All UI icons come from `lucide-react`.** Brand/logo icons (GitHub, X, LinkedIn, etc.) come from `simple-icons` rendered via [src/components/BrandIcon.tsx](src/components/BrandIcon.tsx) — `<BrandIcon icon={siGithub} size={16} />`. lucide v1.11 dropped brand icons; do not try to import them from lucide.
- Default size: `size={16}` for chrome (menu bar, dock dot, traffic-light glyphs), `size={20}` for in-app actions, `size={28}–size={36}` for dock app icons.
- Stroke: lucide default (2). Don't customize unless matching a specific Apple SF Symbol.

### 4.1 Canonical icon mapping

| App / Element       | Lucide icon     |
| ------------------- | --------------- |
| About menu (menu bar) | `User`        |
| Finder              | `FolderOpen`    |
| Preview             | `Eye`           |
| About Me            | `User`          |
| About Me — Location | `MapPin`        |
| About Me — Skills section | `Wrench`  |
| About Me — Find me / socials section | `Link2` |
| Contact             | `Mail`          |
| Terminal            | `Terminal`      |
| Spotlight (menu bar)| `Search`        |
| Traffic light close | `X`             |
| Traffic light min   | `Minus`         |
| Traffic light max   | `Maximize2`     |
| Analytics consent prompt | `BarChart3` |

If you need an icon not listed, add it here in the same PR.

---

## 5. Layout & spacing

### 5.1 Z-index hierarchy

Use these named layers. Do not improvise z values.

| Layer            | z-index range | Purpose                                |
| ---------------- | ------------- | -------------------------------------- |
| Wallpaper        | `-z-10`       | Background image                       |
| Desktop body     | `z-0`         | Desktop icons (if any)                 |
| Window (base)    | `z-10`+       | Stacked dynamically by store; lowest active window starts at 10, increments by 1 on focus |
| Dock | `z-40` | Dock always above windows. The NC's transparent close-on-click backdrop also renders at this z when present (see note below). |
| Menu bar / Notification Center panel | `z-50` | Menu bar at `top-0 h-7`; NC panel at `right-3 top-10 bottom-3 w-90`. Same z is safe because they don't overlap geometrically |
| Spotlight / modals | `z-60`      | Above everything (still wins over NC when both are visible) |

> When the NC is open and **not** persistent, a transparent `z-40` `<button>` backdrop is rendered to catch outside clicks (closes the panel without dimming, matching macOS). In **persistent** mode — currently the analytics-consent undecided state — the backdrop is omitted so the rest of the page stays interactive while the consent card remains visible.

**Mobile shell (< 1024 px)** adds its own band — these layers only exist when `useIsMobile()` returns true:

| Layer              | z-index | Purpose |
| ------------------ | --- | --- |
| AppSheet (per win) | `30 + stackIndex` (dynamic inline, current range 30–34) | One sheet per non-closed window record; sorted ascending by `z`. |
| MobileDock         | `z-40` | Bottom pill launcher; goes `inert` and slides off-screen when any sheet is visible. |
| HomeIndicator      | `z-40` | iOS-style pill, tappable to minimize all visible sheets. |
| MobileStatusBar    | `z-50` | Persistent system chrome above sheets. |
| Spotlight          | `z-60` | Same modal as desktop. |

### 5.1.1 Mobile chrome conventions

- **Breakpoint:** 1024 px (Tailwind `lg`). ≥ 1024 → desktop, < 1024 → mobile. Driven by [`useIsMobile()`](src/lib/useIsMobile.ts) using `matchMedia("(max-width: 1023.98px)")`.
- **Touch targets:** minimum 44 × 44 pt for any interactive element. Use `h-11` (44 px) on buttons; for icon-only buttons, wrap a smaller visual element in a sized `<button>` (see HomeIndicator's `h-11 w-32` hit area around a `h-1.5 w-32` visible pill).
- **Safe-area insets:** all top/bottom mobile chrome uses `env(safe-area-inset-*)`. Static formulas live in Tailwind arbitrary utilities, not inline `style` — see [docs/styling-and-icons.md](docs/styling-and-icons.md#safe-area-insets-mobile-shell).
- **Focus rings:** never suppress (§10). Programmatic focus on mobile lands on a real focusable element (e.g. the first MobileDock button) so the native focus ring is visible.

### 5.2 Chrome dimensions (macOS-canonical)

| Element     | Size                                         |
| ----------- | -------------------------------------------- |
| Menu bar    | h-7 (28px) full width                        |
| Window titlebar | h-9 (36px)                                |
| Traffic light dot | 12px diameter, 8px gap between           |
| Dock pill height | 64px content + 8px padding (`p-2`)       |
| Dock icon | 56px square. Desktop dock scales to 1.25 on hover; mobile dock (`<MobileDock>`) passes `compact` to suppress hover lift/scale and tooltip. |
| Desktop body padding | `pt-7 pb-24` (clears menu bar + dock) |

### 5.3 Window stacking

- Default position: centered, offset by `(N * 24, N * 24)` for the Nth open window so they cascade.
- Min size: 320×240 (`AppDef.minSize` may override per app).
- Max size: viewport minus menu bar (28px) and dock zone (96px).

---

## 6. Animation

- **Library**: `motion/react` (Framer Motion under the new name). Do not pull in another animation lib.
- **Window open**: scale `0.6 → 1`, opacity `0 → 1`, origin = position of the dock icon that opened it. ~250ms, `ease-out`.
- **Window close**: opacity `1 → 0`, ~180ms, `ease-in`. No scale or translate.
- **Window minimize**: animate to dock icon position, scale `1 → 0.1`, opacity `1 → 0`. ~300ms `ease-in-out`. Unminimize is the reverse, ~300ms `ease-out`.
- **Window maximize / restore**: bounds (`left/top/width/height`) interpolated via a transient CSS transition. ~220ms `ease-out`. The transition is only applied while toggling so drag/resize stay instant.
- **Dock magnify** (desktop only): pure CSS `transition-transform duration-150 ease-out`. No JS — keep it cheap. The mobile dock (`<MobileDock>`) opts out via the `compact` prop on `<DockIcon>`.
- **Mobile dock show/hide**: `motion/react` spring (`stiffness 320, damping 32`) on `{ y, opacity }`. Reduced motion collapses to `duration: 0`.
- **Spotlight**: backdrop fade 100ms, dialog scale `0.97 → 1` 150ms.
- **Traffic light hover**: glyphs `opacity-0 → opacity-100` on `.group:hover`, 80ms.

Never animate `width`/`height`/`left`/`top` directly during drag/resize — those use raw style mutations because the rate is 60fps. Only motion-library animations on enter/exit transitions.

---

## 7. State management

- **Window state**: `useReducer` + Context only. No Zustand, Redux, Jotai. The reducer is in [src/lib/windows-store.ts](src/lib/windows-store.ts); see plan for action shapes.
- **Theme + wallpaper**: `localStorage` direct read/write via [src/lib/theme.ts](src/lib/theme.ts). No global store.
- **Forms** (Contact): plain `useState`. No form lib.
- **Per-app internal state** (Finder selection, Terminal history): local `useState` inside the app component.

---

## 8. File & code conventions

### 8.1 Naming

- Components: `PascalCase.tsx`, one component per file. Default-export the component.
- Hooks: `useThing.ts`, named export.
- Plain modules: `kebab-case.ts` (e.g. `windows-store.ts`, `portfolio-data.ts`).
- Types: live in [src/types/](src/types/). One file per logical group.

### 8.2 Imports

Order (Biome enforces, but write them this way to begin with):
1. React / Next
2. Third-party (`lucide-react`, `motion/react`, etc.)
3. Internal absolute (`@/lib/...`, `@/components/...`)
4. Relative (`./...`)
5. Type-only imports last, with `import type`.

### 8.3 Client vs server

Default to server. Add `"use client"` only when the file uses:
- `useState`, `useEffect`, `useReducer`, `useContext`
- Event handlers (`onClick`, `onPress`, etc.)
- Browser APIs (`window`, `localStorage`, `document`)

App content components (FinderApp, AboutApp, etc.) will mostly be client components because they live inside windows that are part of the client-rendered desktop tree.

### 8.4 Styling

- Tailwind utility classes inline. No CSS modules, no styled-components.
- Component-specific overrides via `globals.css` only when Tailwind cannot express the rule (rare).
- Never write inline `style={{}}` for static values — use Tailwind. Inline style is reserved for **dynamic** values (window position, size, z-index).

### 8.5 Comments

Default to none. The plan in [STYLEGUIDE.md](STYLEGUIDE.md) and [CLAUDE.md](CLAUDE.md) is the documentation. Add a one-line comment only for:
- Non-obvious workarounds (e.g. why we use `pointerdown` not `mousedown`).
- Magic numbers that aren't tokens (e.g. dock cascade offset).

Never write multi-paragraph docstrings.

---

## 9. macOS-canonical patterns

### 9.1 Window structure

```
+-------------------------------------------+
| ●●●  [Window Title]                       | ← titlebar (h-9, drag handle)
+-------------------------------------------+
|                                           |
|              app content                  |
|                                           |
+-------------------------------------------+
```

- Traffic lights left-aligned, 12px from left edge, vertically centered.
- Title centered (or hidden if app provides its own toolbar).
- No external borders; rounded corners (`rounded-xl`).
- Active window has the `--overlay-shadow`. Inactive: faint shadow only (drop the spread to ~half).

### 9.2 Menu bar

- About button (left-most) — combined User icon + bold owner-name span inside a single `<button>`. Clicking dispatches `OPEN { appId: "about" }`. No dropdown. The portfolio is about Nhat, not Apple, so the canonical Apple-logo + active-app-name pair is intentionally replaced with a single identity affordance.
- Following items are top-level portfolio navigation: `Portfolio` (opens `finder`), `Contact`. Each is a real `<button>` that dispatches `OPEN` against the [APPS](src/components/apps/registry.ts) registry. The canonical macOS pattern of per-app menus for the focused window is intentionally not used — this is a single-purpose portfolio, not a multi-app desktop, so inert "File / Edit / View" menus would be decoration without function.
- Right side, in order, with `gap-3`: `Search` (opens Spotlight on click), clock.
- Clock format: `EEE h:mm a` (e.g. "Sat 3:42 PM"). Updates every minute (don't poll faster).

### 9.3 Dock

Two variants share [`DockIcon`](src/components/desktop/DockIcon.tsx):

- **Desktop `<Dock>`**: bottom-center at `bottom-3`. Icons render with the default `DockIcon` behavior — hover tooltip and `scale-110 -translate-y-2` magnify.
- **Mobile `<MobileDock>`**: bottom-center at `bottom-[calc(env(safe-area-inset-bottom)+3.25rem)]` (clears the full home-indicator hit area; `env(...)` falls back to `0` when no safe area is defined). Icons render with `compact` — no tooltip, no hover lift/scale, since hover is unreliable on touch. The dock slides off-screen and goes `inert` while any sheet is visible.

Shared rules:

- Icons left-to-right in registry order.
- Tiny dot (3px) below an icon if its app has any window record (including minimized).
- Right-clicking an open app's icon should show a mini context menu with at least "Quit" (closes all windows of that app). MVP can defer this. Desktop only — mobile has no right-click.

### 9.4 Spotlight

- Triggered by `cmd+k` (macOS uses `cmd+space`, but `cmd+space` collides with browser features — use `cmd+k`).
- Dialog: 600px wide, top-of-viewport (≈25% down), `--overlay` background.
- Search results grouped: "Apps", "Projects".
- Enter activates first / focused result.
- Esc closes.

### 9.5 Right-click context menu

- The desktop does not intercept `contextmenu`. The browser's default right-click menu applies everywhere.

---

## 10. Accessibility minimums

- All interactive elements reachable by keyboard. Add `tabIndex`, `aria-*`, and focus styles to plain elements explicitly.
- `aria-label` on icon-only buttons (traffic lights, dock icons, menu-bar icons).
- Focus rings: don't suppress. Use `--accent` for the ring color (already the default in glass theme).
- `prefers-reduced-motion`: respect via `motion/react`'s `useReducedMotion()`. Window transitions become instant; desktop dock magnify becomes static (it's a pure CSS transition with no `motion/react` involvement, so it's effectively unchanged); mobile dock show/hide collapses to a duration of 0.

---

## 11. Out of scope (don't gold-plate)

These are explicitly **not** on the roadmap. Don't add unless asked:

- Multi-desktop / Mission Control.
- Stage Manager.
- Drag-and-drop between windows.
- Real file system / persistence beyond theme + wallpaper.
- Auth / accounts.
- Backend (forms use `mailto:`).
- i18n.

---

## 12. Verifying any change

Before claiming a feature done:

1. `npm run lint` — zero errors.
2. `npm run dev` — open localhost, exercise the feature including its keyboard path.
3. For chrome (menu bar / dock / window manager): test in both `glass-light` and `glass-dark`.
4. Resize browser across the 1024 px boundary — confirm the desktop tree mounts at ≥ 1024 and the iOS-style mobile shell mounts at < 1024. App state should survive the switch (window records persist via the shared `<WindowsProvider>`).
5. `npm run build` — clean build before merging anything significant.
