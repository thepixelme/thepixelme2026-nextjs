# Styling & Icons

CSS architecture, the glass theme, common Tailwind utility patterns, and the two icon libraries used.

## CSS pipeline

[src/app/globals.css](../src/app/globals.css) is the single CSS entry point. It is fully local — no third-party imports beyond Tailwind:

```css
@import "tailwindcss";
/* :root, html.glass-light, html.glass-dark, @theme inline, base behaviour */
```

Source order inside the file:

1. `:root` — cross-theme primitives (`--white`, `--snow`, `--eclipse`, `--radius`, `--spacing`, etc.) **plus** the light theme defaults (`--background`, `--surface`, `--accent`, all soft/hover variants).
2. `html.glass-dark, html[data-theme="glass-dark"]` — dark theme overrides for the variables that differ from light defaults.
3. `html.glass-light, html[data-theme="glass-light"]` — Pro "glass" overrides for light (translucent surfaces, `--glass-blur: 20px`, gradient backdrop).
4. `html.glass-dark, html[data-theme="glass-dark"]` — Pro "glass" overrides for dark (`--glass-blur: 36px`, inverted translucency).
5. `@theme inline { … }` — Tailwind v4 utility mappings (`--color-surface → var(--surface)`, `--shadow-overlay → var(--overlay-shadow)`, easing curves, `@keyframes`).
6. Base behaviour: global border-colour inheritance, `body` font/background/overflow, `::selection` highlight.

There is **no** `tailwind.config.js`; the `@theme inline` block at the bottom of `globals.css` is the only configuration. Tailwind v4 picks it up via the `@tailwindcss/postcss` plugin.

These tokens and the surrounding glass values were originally extracted from HeroUI Pro's glass theme (`@heroui-pro/react/themes/glass`). The dependency has been removed; the file is now the single source of truth. If you need to compare against the original, see `git log -- src/app/globals.css`.

## Theme application

The theme class lives on `<html>`. SSR markup ([src/app/layout.tsx](../src/app/layout.tsx)) ships `glass-light` by default. After hydration, [useTheme](../src/lib/theme.ts) may swap to `glass-dark` based on `localStorage["portfolio:theme"]`. Both classes are managed exclusively through `applyTheme(mode)` which removes both before adding the new one.

The `html.glass-light` and `html.glass-dark` blocks in [globals.css](../src/app/globals.css) supply separate variable values, so swapping the class re-themes everything that consumes the tokens. CSS specificity (`html.glass-*` beats `:root`) ensures the active theme wins.

## Glass theme tokens

These are CSS custom properties defined in [globals.css](../src/app/globals.css). Use them via Tailwind utility classes (e.g. `bg-surface`, `border-separator`) or arbitrary-value syntax (`backdrop-blur-(--glass-blur)`).

| Token                     | Used for                                                              |
| ------------------------- | --------------------------------------------------------------------- |
| `--surface`               | Window body, menu bar (`bg-surface`), dock tooltip (`bg-overlay`).    |
| `--surface-secondary`     | Dock pill, Finder sidebar, Settings sidebar (`bg-surface-secondary`). |
| `--surface-tertiary`      | Reserved for hover/pressed deep surfaces.                             |
| `--overlay`               | Spotlight, popovers, tooltips (`bg-overlay`).                         |
| `--field-background`      | Form inputs.                                                          |
| `--field-border`          | Subtle borders on cards/windows (`border-field-border`).              |
| `--separator`             | Hairlines (`border-separator`, `divide-separator`).                   |
| `--background`            | Body background fallback when no wallpaper is set.                    |
| `--background-gradient`   | Wallpaper fallback gradient (defined but Wallpaper.tsx uses its own hardcoded gradient string). |
| `--accent`                | Active borders, links (`border-accent`, `text-accent`).               |
| `--accent-foreground`     | Foreground color used on top of `--accent` surfaces.                  |
| `--default`               | Neutral interactive bg (`bg-default`, `hover:bg-default`).            |
| `--glass-blur`            | The `backdrop-filter` blur radius (20px in light, 36px in dark).      |
| `--glass-pinned-surface`  | Fully opaque surface. Used by `Window` when `win.maximized` is true. Has both light/dark variants. |
| `--surface-shadow`        | `shadow-surface` (transparent in glass — kept as a token so other themes can populate it). |
| `--overlay-shadow`        | `shadow-overlay` — the layered drop shadow used by windows, modals, tooltips. |
| `--field-shadow`          | Optional shadow on form fields.                                       |

See the `html.glass-light` / `html.glass-dark` blocks in [globals.css](../src/app/globals.css) for the exact values.

### Liquid glass tokens (overlay surfaces — NC only)

A separate, heavier set of tokens for macOS Tahoe / iOS-26-style "liquid glass" floating overlays. Used today by the [NotificationCenter](desktop-shell.md#notification-center-srccomponentsnotificationsnotificationcentertsx) panel and its consent card. **Do not apply to other surfaces** (MenuBar, Dock, Spotlight, Windows) without an explicit scope discussion — the look is intentionally distinct from base glass.

| Token | `@theme inline` mapping → Tailwind utility | Purpose |
| --- | --- | --- |
| `--liquid-glass-blur` | — (use directly: `backdrop-blur-(--liquid-glass-blur)`) | Heavier blur radius: 40px light, 50px dark |
| `--liquid-glass-saturate` | — (use directly: `backdrop-saturate-(--liquid-glass-saturate)`) | Saturation boost (180%) — the canonical macOS Vibrancy lever |
| `--liquid-glass-surface` | `--color-liquid-glass-surface` → `bg-liquid-glass-surface` | Translucent panel background (0.4 alpha light, 0.08 dark) |
| `--liquid-glass-card-surface` | `--color-liquid-glass-card` → `bg-liquid-glass-card` | Translucent notification-card background (0.35 alpha light, 0.06 dark) |
| `--liquid-glass-shadow` | `--shadow-liquid-glass` → `shadow-liquid-glass` | Outer drop shadow + inset top specular highlight (panels) |
| `--liquid-glass-card-shadow` | `--shadow-liquid-glass-card` → `shadow-liquid-glass-card` | Inset top specular highlight only (cards) |
| `--liquid-glass-highlight` | (raw; referenced by the two shadow recipes) | Highlight color (white, 0.4 alpha light / 0.15 dark) |

Definitions live in the **Pro glass theme override blocks** (`html.glass-light`, `html.glass-dark`) so they pick up theme switches automatically. `@theme inline` mappings expose the color and shadow tokens to Tailwind's utility scanner.

Full recipes are in [STYLEGUIDE.md §2.4](../STYLEGUIDE.md). To keep the recipe consistent, prefer the named tokens over inline arbitrary `shadow-[...]` or `bg-[...]` values.

### Laptop intro tokens

Hardware colours for [LaptopFrame](desktop-shell.md#laptopframe-srccomponentsintrolaptopframetsx), and reused for the phone and tablet in [DeviceFrame](desktop-shell.md#deviceframe-srccomponentsintrodeviceframetsx) (bezel, rim, camera) and their stands in DeskScene (the `--laptop-deck-*` aluminium tones and `--laptop-shadow`), defined in their own "Laptop intro hardware" section of [globals.css](../src/app/globals.css): `:root` holds the silver (light) values and `html.glass-dark` overrides them for space black. Consumed with the `(--var)` syntax (`bg-(--laptop-bezel)`, `shadow-[0_0_0_0.16cqw_var(--laptop-rim)]`) on the lid, and as `fill-(--laptop-…)` / `stroke-(--laptop-…)` / `[stop-color:var(--laptop-…)]` on the base SVG. Not for use outside the intro.

| Token | Purpose |
| --- | --- |
| `--laptop-bezel` | Black screen bezel (same in both themes). |
| `--laptop-camera` | Camera dot in the top bezel. |
| `--laptop-rim` | Thin aluminium edge around the lid. |
| `--laptop-hinge` | Hinge bar between the lid and the deck. |
| `--laptop-deck-top` | Main colour of the deck's top surface. |
| `--laptop-deck-mid` | Shading on the deck under the lid, top of the front lip, and the thumb scoop. |
| `--laptop-deck-bottom` | Bottom of the front lip's gradient, and the trackpad outline. |
| `--laptop-keyboard` | Keyboard well around the keys. |
| `--laptop-key` | Keycaps. |
| `--laptop-trackpad` | Trackpad surface. |
| `--laptop-grille` | Speaker-grille dots either side of the keyboard. |
| `--laptop-shadow` | Blurred contact shadow under the base. |

The room, desk and props around the laptop use a second set, `--scene-*`, defined only in `:root` in the same section: the scene is an illustration, so it stays the same in both themes, like the wallpaper image. SVG fills use `fill-(--scene-…)` / `stroke-(--scene-…)`, gradient stops use `[stop-color:var(--scene-…)]`, and HTML layers use `from-(--scene-…)` / `text-(--scene-…)` etc. Not for use outside [src/components/intro/](../src/components/intro/).

| Tokens | Used for |
| --- | --- |
| `--scene-ink` / `-muted` | The intro headline and the name above it, dark enough to read on the wall |
| `--scene-wall` / `-shade` | Back wall; `-shade` darkens its top and edges (vignette) |
| `--scene-trim` / `-shade` | Baseboard, window frame and sill, painted mantelpiece and its panel lines, clock face |
| `--scene-floor` / `-seam` | Floorboards and the seams between them |
| `--scene-rug` / `-dark` / `-light` | Rug field; stripes and edge shading; border and fringe |
| `--scene-brick` / `-dark`, `--scene-mortar` | Fireplace brick panel in two tones, soldier course and firebox back wall; mortar |
| `--scene-stone` / `-face` | Hearth slab top and front edge |
| `--scene-soot` | Firebox, grate, andirons, clock hands and ticks, fairy-light wire, black fountain pen, notebook strap and side shading |
| `--scene-log` / `-end` | Logs and their cut ends |
| `--scene-ember` | Pulsing embers under the logs |
| `--scene-flame-outer` / `-mid` / `-core` | Fire tongues, outside in; `-core` also lights the fairy-light bulbs |
| `--scene-firelight` | Glows: firelight on the wall, firebox and hearth, fairy-light bulbs |
| `--scene-brass` / `-shade` | Curtain rod and tie-backs, clock bezel and centre cap, fountain-pen nib, clip and bands |
| `--scene-curtain` / `-shade` | Curtains and their folds |
| `--scene-night-top` / `-horizon`, `--scene-moon` | Night sky through the window, moon and stars |
| `--scene-snow` / `-shade`, `--scene-pine` | Near and far snowy hills, falling snow, pines |
| `--scene-wood-top` / `-face`, `--scene-desk-leg` | Desk top, front edge (and the leather journal), walnut legs (and the clock case) |
| `--scene-ceramic` / `-shade`, `--scene-coffee` | Mug and the coffee in it; notebook pages and pen highlights |
| `--scene-book-red` / `-navy` / `-mustard` | Red pen, mug band and clock second hand; navy notebook; ribbon bookmark |
| `--scene-steam` | Mug steam |
| `--scene-shadow` | Contact shadows under props, the desk, the mantel shelf and the window sill |

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

### Desk intro custom variants

[globals.css](../src/app/globals.css) registers four variants for the [desk intro](desktop-shell.md#desk-intro-srccomponentsintrodeskintrotsx), each wrapped in `@supports (scale: pow(2, 1))` because the intro's camera needs CSS `pow()`:

| Variant | Media query | Matches |
| --- | --- | --- |
| `intro:` | `(min-width: 1024px) and (prefers-reduced-motion: no-preference) and (min-aspect-ratio: 5/4)` | The intro plays with the laptop. |
| `intro-device:` | `(orientation: portrait) and (prefers-reduced-motion: no-preference)` | It plays with a phone or tablet. |
| `intro-phone:` | `intro-device:` and `(max-width: 699.98px)` | With a phone. |
| `intro-tablet:` | `intro-device:` and `(min-width: 700px)` | With a tablet. |

They must stay in sync with `LAPTOP_INTRO_QUERY` / `DEVICE_INTRO_QUERY` in [src/lib/intro.ts](../src/lib/intro.ts). Uses: the pre-hydration branch of [Desktop.tsx](../src/components/desktop/Desktop.tsx) (which wrapper shows), the device-specific pieces of the intro (LaptopFrame `intro-device:hidden`, DeviceFrame, DeskScene's stands and phone prop layout, IntroWalkthrough's pointer, the two "enter" buttons, the phone headline size), the per-device camera variables (`@variant intro-phone { … }` inside `:root`), and the mobile consent banner, which is `intro-device:hidden` while the intro is pending. The intro variants are registered after `mobile:` so `intro-device:hidden` overrides `mobile:block`.

### Desk intro camera

The intro's zoom is plain CSS in the "Desk intro camera" section of [globals.css](../src/app/globals.css), so its first frame is server-rendered correctly for every device. Two registered properties carry the per-frame values (`@property --intro-e` and `--intro-r`, `<number>`, `inherits: false`, so the live shell inside the screen isn't restyled each frame); per-device rest-pose variables live on `:root`; and five `@utility` rules do the maths with `pow()` and `calc()`: `intro-stage`, `intro-layer`, `intro-anchor`, `intro-screen-clip`, `intro-screen-corners`. Where the maths needs a ratio of two lengths as a number (the laptop's rest scale depends on the viewport's aspect), it uses `tan(atan2(a, b))`. Full tables in [desktop-shell.md](desktop-shell.md#desk-intro-srccomponentsintrodeskintrotsx). Inside the scene, Tailwind's `scale-(--intro-room-scale)`, `translate-x-(--intro-room-pan)`, `scale-(--intro-desk-scale)` and `translate-y-(--intro-desk-lift)` apply the rest of the pose.

Scene sizes are container query units, not `vw`: the device's screen box and SceneBackdrop's room frame are `@container`s, so the hardware and desk are drawn in `cqw` of the screen and the room in `cqw` of the room frame (one room unit each). That is what keeps every prop's proportions, and the laptop scene's 16:10 framing, at any viewport aspect.

### Mobile shell custom variants

Three more custom variants in [globals.css](../src/app/globals.css) cover the touch shell:

| Variant   | Media query | Use |
| --------- | ----------- | --- |
| `mobile:` | `(max-width: 1023.98px), (orientation: portrait)` | Matches exactly where the mobile shell is used. Must stay in sync with `MOBILE_MEDIA_QUERY` in [src/lib/useIsMobile.ts](../src/lib/useIsMobile.ts). Used for server-rendered markup that has to pick a shell before hydration: the pre-hydration branch of [Desktop.tsx](../src/components/desktop/Desktop.tsx) and the mobile consent banner in [AnalyticsConsent.tsx](../src/components/analytics/AnalyticsConsent.tsx) (`hidden mobile:block`). |
| `tablet:` | `(min-width: 700px) and (min-height: 700px)` | A tablet-sized shell in either orientation (iPad mini portrait is 744 px wide), not a phone on its side. AppSheet becomes a floating card; HomeScreen gets larger padding and type. |
| `short:`  | `(max-height: 480px)` | A phone on its side. MobileDock moves to the right edge; HomeScreen pads past it. |

`tablet:` and `short:` also match some desktop viewports, so use them only inside [src/components/mobile/](../src/components/mobile/). Inside the shell, Tailwind's built-in `landscape:` means a phone or small tablet held sideways (wider landscape viewports get the desktop), and HomeScreen uses it to put its widgets side by side.

The desk intro's scroll hint swaps "Scroll to enter" for "Swipe up to enter" with Tailwind's built-in `pointer-coarse:` variant.

### Safe-area insets (mobile shell)

The mobile shell respects iOS notch / home-indicator areas via `env(safe-area-inset-*)`. The viewport meta in [layout.tsx](../src/app/layout.tsx) sets `viewportFit: "cover"` to enable this.

Static safe-area formulas are written as Tailwind arbitrary utilities (not inline `style`):

```
h-[calc(2.75rem+env(safe-area-inset-top))]
pt-[env(safe-area-inset-top)]
pt-[calc(2.75rem+env(safe-area-inset-top)+1.5rem)]
pb-[max(env(safe-area-inset-bottom),12px)]
bottom-[max(env(safe-area-inset-bottom),8px)]
```

Used by [MobileStatusBar](../src/components/mobile/MobileStatusBar.tsx), [MobileDock](../src/components/mobile/MobileDock.tsx), [AppSheet](../src/components/mobile/AppSheet.tsx), [HomeIndicator](../src/components/mobile/HomeIndicator.tsx), [HomeScreen](../src/components/mobile/HomeScreen.tsx).

### Mobile z-index band

The mobile shell adds layers on top of the desktop hierarchy in [STYLEGUIDE.md §5.1](../STYLEGUIDE.md):

| Layer              | z-index | Notes |
| ------------------ | --- | --- |
| `HomeScreen`       | `z-0` | Home widgets over the wallpaper; fades out and goes `inert` when any sheet is visible. |
| `AppSheet`         | `30 + stackIndex` (dynamic inline, range 30–34 for current 5-app registry) | Sorted ascending by `z`. |
| `MobileDock`       | `z-40` | Bottom pill launcher; goes `inert` and slides off-screen when any sheet is visible. |
| `HomeIndicator`    | `z-40` | Interactive button above sheets; pointer-events suppressed when `disabled`. |
| `MobileStatusBar`  | `z-50` | Persistent iOS-style status chrome above sheets. |
| `Spotlight`        | `z-60` | Same modal as desktop. |

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
