# Styling & Icons

CSS architecture, the glass theme, common Tailwind utility patterns, and the two icon libraries used.

## CSS pipeline

[src/app/globals.css](../src/app/globals.css) is the single CSS entry point. Import order matters:

```css
@import "tailwindcss";
@import "@heroui/styles";
@import "@heroui-pro/react/css";
@import "@heroui-pro/react/themes/glass";
```

1. `tailwindcss` — Tailwind v4 base + utilities.
2. `@heroui/styles` — HeroUI OSS base CSS variables and component styles.
3. `@heroui-pro/react/css` — HeroUI Pro component CSS (BEM-style).
4. `@heroui-pro/react/themes/glass` — overrides the variables and adds `backdrop-blur` to surface-using components, scoped under `html.glass-light` and `html.glass-dark`.

There is **no** `tailwind.config.js`; configuration lives in `@theme` blocks shipped by HeroUI. Tailwind v4 picks them up via the `@tailwindcss/postcss` plugin.

The CSS file also defines:

- `html, body { height: 100% }`
- `body` font (`var(--font-sans)`), background (`var(--background)`), color (`var(--foreground)`), and `overflow: hidden` so the desktop is the only scroll container.
- `::selection { background: color-mix(in oklab, var(--accent) 30%, transparent) }`.

## Theme application

The theme class lives on `<html>`. SSR markup ([src/app/layout.tsx](../src/app/layout.tsx)) ships `glass-light` by default. After hydration, [useTheme](../src/lib/theme.ts) may swap to `glass-dark` based on `localStorage["portfolio:theme"]`. Both classes are managed exclusively through `applyTheme(mode)` which removes both before adding the new one.

The CSS shipped by `@heroui-pro/react/themes/glass` provides separate variable blocks for `html.glass-light` and `html.glass-dark`, so swapping the class re-themes everything that consumes the tokens.

## Glass theme tokens

These are CSS custom properties defined by the glass theme. Use them via Tailwind's color tokens (e.g. `bg-surface`, `border-separator`) or arbitrary-value syntax (`backdrop-blur-(--glass-blur)`).

| Token                     | Used for                                                              |
| ------------------------- | --------------------------------------------------------------------- |
| `--surface`               | Window body, menu bar (`bg-surface`), dock tooltip (`bg-overlay`).    |
| `--surface-secondary`     | Dock pill, Finder sidebar, Settings sidebar (`bg-surface-secondary`). |
| `--surface-tertiary`      | Reserved for hover/pressed deep surfaces.                             |
| `--overlay`               | Spotlight, popovers, tooltips (`bg-overlay`).                         |
| `--field-background`      | Form inputs (HeroUI sets this internally).                            |
| `--field-border`          | Subtle borders on cards/windows (`border-field-border`).              |
| `--separator`             | Hairlines (`border-separator`, `divide-separator`).                   |
| `--background`            | Body background fallback when no wallpaper is set.                    |
| `--background-gradient`   | Wallpaper fallback gradient (defined but Wallpaper.tsx uses its own hardcoded gradient string). |
| `--accent`                | Active borders, links (`border-accent`, `text-accent`).               |
| `--accent-foreground`     | Foreground color used on top of `--accent` surfaces.                  |
| `--default`               | Neutral interactive bg (`bg-default`, `hover:bg-default`).            |
| `--glass-blur`            | The `backdrop-filter` blur radius (20px in light, 36px in dark).      |
| `--glass-pinned-surface`  | Fully opaque surface. Used by `Window` when `win.maximized` is true (and originally by HeroUI Pro for pinned data-grid cells). Has both light/dark variants. |
| `--surface-shadow`        | `shadow-surface` (transparent in glass — kept as a token so other themes can populate it). |
| `--overlay-shadow`        | `shadow-overlay` — the layered drop shadow used by windows, modals, tooltips. |
| `--field-shadow`          | Optional shadow on form fields.                                       |

Run `mcp__heroui-pro__get_css({ theme: "glass" })` to see the full source if you need exact values.

### Hardcoded colors (allowed)

Three colors are intentionally hardcoded because they're macOS-canonical, not theme-driven:

- Traffic-light red: `#ff5f57`
- Traffic-light yellow: `#febc2e`
- Traffic-light green: `#28c840`

Used inline as `bg-[#ff5f57]` etc. in [TrafficLights.tsx](../src/components/window/TrafficLights.tsx).

## Tailwind v4 patterns

### Glass surface recipe

```
bg-surface backdrop-blur-(--glass-blur) border border-field-border shadow-overlay rounded-xl
```

Used by [Window.tsx](../src/components/window/Window.tsx). When `win.maximized` is true, Window swaps `bg-surface` for `bg-(--glass-pinned-surface)` (opaque) and drops `backdrop-blur-(--glass-blur)` so the maximized content reads clearly. Variants:

- Menu bar (top): `bg-surface ... border-b border-separator backdrop-blur-(--glass-blur)`.
- Dock pill: `bg-surface-secondary ... border border-separator shadow-overlay`.
- Spotlight tooltip / popover: `bg-overlay shadow-overlay`.

### Arbitrary-value CSS variable references

Tailwind v4 introduces a `(--var)` syntax for arbitrary CSS-variable references inside utilities. The codebase uses:

- `backdrop-blur-(--glass-blur)` — reads `--glass-blur` for the blur radius.

Equivalent older syntax (`backdrop-blur-[var(--glass-blur)]`) works but Biome's Tailwind plugin reports it as non-canonical. Prefer the `()` form.

### Canonical shadow / gradient tokens

Always prefer the named utility over the arbitrary form:

| Prefer                  | Avoid                                  |
| ----------------------- | -------------------------------------- |
| `shadow-surface`        | `shadow-[var(--surface-shadow)]`       |
| `shadow-overlay`        | `shadow-[var(--overlay-shadow)]`       |
| `bg-linear-to-b`        | `bg-gradient-to-b`                     |
| `bg-linear-to-br`       | `bg-gradient-to-br`                    |
| `aspect-4/3`            | `aspect-[4/3]`                         |
| `z-60`                  | `z-[60]`                               |

Biome will flag these.

### Safe-area insets (mobile shell)

Below the `lg` breakpoint, the mobile shell respects iOS notch / home-indicator areas via `env(safe-area-inset-*)`. The viewport meta in [layout.tsx](../src/app/layout.tsx) sets `viewportFit: "cover"` to enable this.

Static safe-area formulas are written as Tailwind arbitrary utilities (not inline `style`):

```
h-[calc(2.75rem+env(safe-area-inset-top))]
pt-[env(safe-area-inset-top)]
pt-[calc(2.75rem+env(safe-area-inset-top)+1.5rem)]
pb-[max(env(safe-area-inset-bottom),12px)]
bottom-[max(env(safe-area-inset-bottom),8px)]
```

Used by [MobileStatusBar](../src/components/mobile/MobileStatusBar.tsx), [HomeScreen](../src/components/mobile/HomeScreen.tsx), [AppSheet](../src/components/mobile/AppSheet.tsx), [HomeIndicator](../src/components/mobile/HomeIndicator.tsx).

### Mobile z-index band

The mobile shell adds layers on top of the desktop hierarchy in [STYLEGUIDE.md §5.1](../STYLEGUIDE.md):

| Layer              | z-index | Notes |
| ------------------ | --- | --- |
| `AppSheet`         | `30 + stackIndex` (dynamic inline, range 30–34 for current 5-app registry) | Sorted ascending by `z`. |
| `HomeIndicator`    | `z-40` | Interactive button above sheets; pointer-events suppressed when `disabled`. |
| `MobileStatusBar`  | `z-50` | Persistent iOS-style status chrome above sheets. |
| `Spotlight`        | `z-60` | Same modal as desktop. |

### Mobile home-icon tile

iOS-style square tile + label:

```tsx
<span className="grid aspect-square w-16 place-items-center rounded-[18px]
                 border border-field-border bg-surface shadow-surface
                 backdrop-blur-(--glass-blur)">
  <Icon size={28} className="text-foreground/85" />
</span>
<span className="text-[11px] font-medium text-white
                 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
  {label}
</span>
```

White label + drop shadow keeps the title readable on light wallpapers.

### Fonts

Two fonts are loaded via `next/font/google` in [layout.tsx](../src/app/layout.tsx) and exposed as CSS variables on `<html>`:

| Variable         | Font            | Default use                                |
| ---------------- | --------------- | ------------------------------------------ |
| `--font-sans`    | Inter           | Body, all chrome, app text.                |
| `--font-mono`    | JetBrains Mono  | Reserved for code/terminal contexts. Currently the only monospace consumer is `TerminalApp` via the `font-mono` Tailwind utility. |

The body font is set in `globals.css` (`font-family: var(--font-sans), ui-sans-serif, system-ui, sans-serif`).

## Icons

Two libraries; one wrapper for brand icons.

### lucide-react

Version `^1.11.0`. Default icon library for **all UI iconography** — chrome, app actions, indicators. Imported by name (e.g. `import { FolderOpen, X, Search } from "lucide-react"`).

This major version **does not include brand icons**. There is no `Github`, `Twitter`, `Linkedin`, etc. Attempting to import one fails at build time.

Used sizes in the codebase:

- `size={8}` — traffic-light glyphs.
- `size={12}` — small inline glyphs (`<MapPin>`, `<ExternalLink>`, `<Download>`).
- `size={14}` — context-menu items, sidebar icons, menu bar status.
- `size={16}` — Spotlight prefix, dock-tooltip glyphs, battery.
- `size={20}` — Settings ThemeCard icon.
- `size={32}` — dock app icons, with `strokeWidth={1.5}` to match macOS feel.

Canonical app → lucide mapping is documented in [STYLEGUIDE.md §4.1](../STYLEGUIDE.md). Live mapping in [src/components/apps/registry.ts](../src/components/apps/registry.ts).

### simple-icons

Version `^16.18.0`. Source for brand/logo icons. Imported by `si<Brand>` constant — e.g. `import { siGithub } from "simple-icons"`.

Each export is a `SimpleIcon` object with `{ title, slug, hex, source, svg, path, ... }`. We render it through `BrandIcon`.

**Caveat:** at this version, `LinkedIn` is not available. The `Social["brand"]` literal union therefore omits `linkedin`. If a future version restores it, both the union in [portfolio-data.ts](../src/lib/portfolio-data.ts) and the `BRANDS` map in [AboutApp.tsx](../src/components/apps/AboutApp.tsx) need a matching entry.

Brand icons used today: `siGithub`.

### BrandIcon

[src/components/BrandIcon.tsx](../src/components/BrandIcon.tsx) — a thin wrapper that turns a `SimpleIcon` into a 24×24 viewBox SVG with `fill="currentColor"`.

Props:

| Prop        | Type          | Default         | Notes                                                          |
| ----------- | ------------- | --------------- | -------------------------------------------------------------- |
| `icon`      | `SimpleIcon`  | required        | The simple-icons constant.                                     |
| `size`      | `number`      | `16`            | Sets both `width` and `height`.                                |
| `className` | `string`      | —               | Forwarded to the `<svg>`.                                      |
| `title`     | `string`      | —               | When provided, sets `role="img"` and overrides `aria-label`. Otherwise the SVG is `role="presentation"` and labelled with `icon.title`. |

Renders:

```tsx
<svg role={...} aria-label={title ?? icon.title}
     viewBox="0 0 24 24" width={size} height={size}
     className={className} fill="currentColor">
  <path d={icon.path} />
</svg>
```

Color comes from `currentColor`, so styling is done via Tailwind text color utilities on the parent or `className`.

## Cross-references

- macOS canonical patterns and dimensions (menu bar h-7, traffic-light positioning, dock pill, etc.) — [STYLEGUIDE.md §5, §9](../STYLEGUIDE.md).
- Theme switching mechanics — [desktop-shell.md](desktop-shell.md#usetheme).
- Where each token is consumed — [desktop-shell.md](desktop-shell.md), [window-manager.md](window-manager.md).
