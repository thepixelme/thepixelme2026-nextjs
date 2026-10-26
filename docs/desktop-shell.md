# Desktop Shell

Everything that's always on screen: wallpaper, menu bar, dock, and Spotlight palette. Plus the two helper modules they depend on (`useClock`, `useTheme`).

The shell components are children of `<WindowsProvider>` (mounted by [Desktop.tsx](../src/components/desktop/Desktop.tsx)) and freely call `useWindows()` / `useWindowsDispatch()` to read state and emit actions.

## Desktop ([Desktop.tsx](../src/components/desktop/Desktop.tsx))

Top-level client component mounted by [page.tsx](../src/app/page.tsx). It is also the **viewport router**: based on [`useIsMobile()`](../src/lib/useIsMobile.ts), it picks between the desktop tree (landscape, ≥ 1024 px) and the mobile tree (narrower than 1024 px, or portrait at any width).

Structure:

```
<WindowsProvider>
  <ShellSwitch>
    isMobile === null  → pre-hydration first frame (no mismatch), each wrapper shown by CSS:
                           <Wallpaper />    in `mobile:hidden intro:hidden`      (desktop without the intro)
                           <MobileShell />  in `hidden mobile:block intro-device:hidden`  (mobile without it)
                           <DeskIntro>      in `hidden h-full intro:block intro-device:block`, one copy,
                             <Wallpaper />    in `contents intro-device:hidden`  (laptop screen)
                             <MobileShell />  in `hidden intro-device:contents`  (phone/tablet screen)
    isMobile === false → <DeskIntro><DesktopBody /></DeskIntro>
    isMobile === true  → <DeskIntro><MobileShell /></DeskIntro>
```

`<WindowsProvider>` lives outside the switch so window state persists across a viewport resize.

`<DesktopBody />` (a local component inside the same file) renders the classic desktop tree inside a root `<div data-desktop-root className="relative h-full w-full overflow-hidden">`:

1. `<Wallpaper />`
2. `<MenuBar onOpenSpotlight={() => setSpotlightOpen(true)} />`
3. `<WindowManager />`
4. `<Dock />`
5. `<Spotlight open={spotlightOpen} onOpenChange={setSpotlightOpen} />`

`DesktopBody` owns its own `spotlightOpen: boolean`. It also opens the About window on its own, once per page load, with `OPEN { appId: "about", silent: true }` so it doesn't count as an `app_open`: `INTRO_ABOUT_DELAY_MS` (700 ms) after mount while the desk intro is pending, so visitors watch it open on the laptop screen, and immediately where the intro doesn't play (reduced motion, or a viewport squarer than 5:4). If the intro finishes before the delay, About opens at that point. The module-level `aboutAutoOpened` flag stops it reopening when the desktop remounts after a resize across the breakpoint. `data-desktop-root` is the reference element [`dock-positions`](window-manager.md) uses to report dock-icon rects in desktop coordinates.

## Desk intro ([src/components/intro/DeskIntro.tsx](../src/components/intro/DeskIntro.tsx))

Scroll-driven landing, modelled on mercury.com. The visitor first sees the headline over an illustrated, fire-lit room at night: a mantel fireplace with a crackling fire and a clock showing the visitor's own time, a snowy window, a wood floor and a rug, and an oak desk with a steaming mug of coffee, two notebooks and a pair of fountain pens. On the desk stands a device whose screen shows the **live** shell, and scrolling zooms into it until its screen exactly fills the viewport and the shell becomes interactive.

| Viewport | Device | Screen content |
| --- | --- | --- |
| Landscape, ≥ 1024 px, aspect ≥ 5:4 | MacBook, seen from slightly above so its keyboard deck shows | `<DesktopBody />` with the About window open and a fake cursor touring the dock |
| Portrait, < 700 px wide | iPhone on an aluminium stand, in front of the fireplace | `<MobileShell />` home screen, a fingertip touring the dock |
| Portrait, ≥ 700 px wide | iPad on an aluminium stand, fireplace to its left | `<MobileShell />` home screen, a fingertip touring the dock |

**Fixed proportions** — on the laptop, the room, desk and props are composed in a 16:10 frame (100 × 62.5 room units) that is fitted inside the viewport, like `object-fit: contain`. A wider viewport shows more wall, floor and rug to the sides; a squarer one shows more wall above and floor below. Nothing in the frame stretches, and the MacBook's screen is always 16:10. The live desktop is still laid out at the viewport's size, centred on that screen, so it never re-lays out when the intro finishes:

- Viewport wider than 16:10: the desktop is clipped to the screen at rest (its outer edges, such as the ends of the menu bar, are cropped), and over the last 20% of the zoom it spreads past the lid to the viewport's full width.
- Viewport squarer than 16:10: the desktop doesn't reach the screen's sides, so LaptopFrame continues its wallpaper and menu bar there. At the end of the zoom the screen's sides are beyond the viewport's.

On phones and tablets the screen is the viewport itself, so a portrait viewport gets a phone- or tablet-shaped screen.

Props: `{ children: ReactNode }` — the screen content (`<DesktopBody />` or `<MobileShell />`; in the pre-hydration frame both, each shown by CSS).

**When it plays** — `useIntroPending()` from [src/lib/intro.ts](../src/lib/intro.ts) returns `true` until `finishIntro()` is called, and only while `LAPTOP_INTRO_QUERY` (`(min-width: 1024px) and (prefers-reduced-motion: no-preference) and (min-aspect-ratio: 5/4)`) or `DEVICE_INTRO_QUERY` (`(orientation: portrait) and (prefers-reduced-motion: no-preference)`) matches and the browser supports CSS `pow()` (`CSS.supports("scale", "pow(2, 1)")`), which the camera needs. The same queries, wrapped in `@supports (scale: pow(2, 1))`, are the `intro:` (laptop), `intro-device:`, `intro-phone:` (< 700 px wide) and `intro-tablet:` (≥ 700 px) custom variants in [globals.css](../src/app/globals.css) — keep them in sync. Reduced-motion visitors, desktop viewports squarer than 5:4 and phones on their side never see the intro. The finished flag is module state, so the intro plays once per page load. The server snapshot is `true` so nothing (e.g. the consent auto-open) races ahead of it during hydration.

**One component, three devices** — nothing in DeskIntro branches on the device in JS. The device-specific pieces are all rendered and shown by the media variants (LaptopFrame is `intro-device:hidden`, DeviceFrame shows its phone or tablet part, DeskScene swaps prop layouts and stands, IntroWalkthrough swaps cursor for fingertip, and there are two "enter" buttons). The camera's rest pose is a set of CSS variables per device. So the single server-rendered copy is right for whichever device the visitor has.

**Structure while active** (all inside the component's root):

```
<div scroller: h-full overflow-y-auto, scrollbar hidden>     ← useScroll({ container })
  <div h-[280vh]>                                            ← 180vh of scroll distance
    <div sticky top-0 h-dvh overflow-hidden>
      <SceneBackdrop eased />   night view, then the room's wall, fireplace and floor (parallax layers)
      <header>      ABOUT.name + <h1>{ABOUT.title}</h1> in --scene-ink colours; fades out over the first 20%
                    (on the laptop, placed and capped in room units so it keeps its place over the
                    16:10 frame; smaller and higher on phones)
      <motion.div intro-stage absolute inset-0 style={{ --intro-e }}>
        <div @container h-full w-(--intro-glass-w), centred>   the device's screen: 16:10 on the laptop,
                                                               the viewport on a phone or tablet
          <DeskScene />                         rug, desk, props and stand, below the screen's bottom edge
          <LaptopFrame />                       lid, screen behind the desktop, keyboard deck (laptop only)
          <DeviceFrame part="body" />           phone/tablet body, buttons, stand ledge (devices only)
          <motion.div intro-screen-clip h-full w-screen, centred, overflow-hidden [contain:paint] inert
                      style={{ --intro-r }}>   the live shell's box: always the viewport's size
            {children}
            <IntroWalkthrough />                cursor/fingertip + app labels touring the dock
          </motion.div>
          <DeviceFrame part="front" corners />  the phone's Dynamic Island, over the screen
          <button aria-label="Enter desktop">          laptop; transparent, over the screen → animated zoom
          <button aria-label="Open the home screen">   phone/tablet; same
        </div>
      </motion.div>
      <p>Scroll to enter <ChevronDown /></p>   glass pill; fades out over the first 8%; reads
                                               "Swipe up to enter" on touch (`pointer-coarse:`)
```

At scale 1 the screen is the viewport's height (and, on a phone or tablet, its width), so the shell's box is exactly the viewport and the frame, desk and rug sit off-screen. The screen box is a size container: LaptopFrame, DeviceFrame and DeskScene are drawn in `cqw` of it (1cqw = 1% of the screen's width), never `vw`. `contain: paint` makes the shell's box the containing block for its `fixed` chrome (wallpaper, menu bar, dock, status bar, home screen), and `intro-screen-clip` clips it to the screen's rounded corners.

**Camera** — CSS, in the "Desk intro camera" section of [globals.css](../src/app/globals.css), driven from [camera.ts](../src/components/intro/camera.ts). `scrollYProgress` is smoothed with `useSpring` (`stiffness 260, damping 40`) and eased (`easeInOut`) into `--intro-e`, which DeskIntro sets on the stage and SceneBackdrop on each depth layer. `--intro-e` and the screen-corner factor `--intro-r` are registered with `@property` as non-inherited numbers, so the live shell inside the screen isn't restyled every frame. The utilities:

| Utility | Rule |
| --- | --- |
| `intro-stage` | `scale: pow(START, 1 − e)` — log-space zoom from the rest scale to 1, so the perceived zoom speed is even; `translate: 0 offset·(1 − e)`. |
| `intro-layer` | For a layer at `--intro-depth` (< 1): `scale: (1/START)^(depth·e)`, shifted so it zooms about the screen's centre. Farther layers grow less, which produces the parallax. |
| `intro-anchor` | `top` = where the screen's bottom edge rests: 50% + 50%·START + offset. |
| `intro-screen-clip` | `clip-path: inset()` on the shell's box: in from each side by half of how much wider than the screen it is, × `--intro-r` (which runs 1 → 0 over the last 20%), with the screen's corner radii × `--intro-r`. So it shows only the screen at rest, then spreads to the full viewport. |
| `intro-screen-corners` | The screen's corner radii × `--intro-r`; on the enter buttons. |

Percentages are of the `h-dvh` sticky box, so the room stays aligned on phones whose browser toolbars make `vh` taller than the visible area. When progress passes 0.995 DeskIntro calls `finishIntro()`.

**Rest poses** (`:root` variables, overridden under `@variant intro-device`, then `intro-phone` / `intro-tablet`). Room units are 1% of the width of the laptop pose's 16:10 frame, where the laptop's screen is 25 units (~30 cm) wide. `--intro-desk-scale` = 25 ÷ device width is derived.

| Variable | Laptop | Phone | Tablet | Meaning |
| --- | --- | --- | --- | --- |
| `--intro-unit` | `min(1vw, 1.6dvh)` | 1vw | 1vw | One room unit at rest, before `--intro-room-scale`. On the laptop, the 16:10 frame fitted inside the viewport. |
| `--intro-glass-w` | 160dvh | 100vw | 100vw | The screen's width at scale 1; its height is the viewport's. |
| `--intro-start` | 0.25 × min(1, aspect ÷ 1.6) | device width × room scale ÷ 100 | same | The stage's scale at rest, so the screen is `--intro-device-width` units wide. aspect ÷ 1.6 is `tan(atan2(100vw, 160dvh))`, the ratio of two lengths as a plain number that `pow()` can take. |
| `--intro-device-width` | 25 | 5.4 (~6.5 cm) | 13.3 (~16 cm) | Screen width in room units, so every device is real size next to the mug. |
| `--intro-room-scale` | 1 | 3.2 (2.7 squat, 3.6 tall) | 1.9 | How far the room is magnified at rest: the camera is closer to a small device. |
| `--intro-room-pan` | 0 | 35cqw | 22cqw | Room shift in room units: the fireplace behind the phone, or to the tablet's left. |
| `--intro-offset` | −2.5 units | 27% (30.5% squat, 23.8% tall) | −0.6% | Screen centre's offset from the viewport centre at rest. |
| `--intro-desk-lift` | 0 | 10cqw (~3 cm) | 13cqw (~4 cm) | How far the stand raises the device above the desk, in desk units. |
| `--intro-radius-top` / `-bottom` | 0.7cqw / 0 | 12cqw / 12cqw | 2.6cqw / 2.6cqw | Screen corner radii at rest. |

Phones come in three shapes so the clock and fireplace fit between the headline and the desk: squat (`min-aspect-ratio: 3/5`, e.g. an iPhone SE in Safari), regular, and tall (`max-aspect-ratio: 9/17`, a phone with its toolbars hidden).

**Finishing** — once `useIntroPending()` is `false`, every wrapper above `{children}` switches to `display: contents` and the scene elements unmount. The shell keeps its tree position (no remount, no transform, no extra stacking context), so it behaves exactly as it would without the intro.

**Input**

| Input | Effect |
| --- | --- |
| Wheel / trackpad scroll, touch swipe | Drives the zoom (scrolling back up zooms out until finished). |
| Click or tap the screen / Enter on the focused screen button | Animates the scroller to the end (1.2 s). |
| ↓, PageDown, End, Space, Enter (focus on `<body>`) | Same animated zoom. |
| Esc | Finishes immediately. |
| ⌘K / Ctrl+K | Finishes immediately; Spotlight's own listener opens it on the now-live shell. |

How the visitor got in is sent as the `method` of the `intro_complete` analytics event: `scroll` (a scroll or swipe reached the end), `click` or `keyboard` (the animated zoom was started that way), or `skip` (Esc / ⌘K). `finishIntro()` returns `true` only for the call that actually finished the intro, so the event fires once even though the progress callback keeps firing past 0.995. See [analytics-events.md](analytics-events.md#intro_complete).

## LaptopFrame ([src/components/intro/LaptopFrame.tsx](../src/components/intro/LaptopFrame.tsx))

Stateless, `aria-hidden` MacBook hardware drawn around the 16:10 screen box; `intro-device:hidden`, so it shows only on the laptop. All dimensions are in `cqw` of the screen box, so proportions hold at any viewport size; the parent's `scale` sizes it. Colours come from the `--laptop-*` tokens in [globals.css](../src/app/globals.css) (silver in `glass-light`, space black in `glass-dark`) — see [styling-and-icons.md](styling-and-icons.md#laptop-intro-tokens).

- **Lid** — a `div` around the screen box: black bezel (1.4cqw at the sides and top, 2.1cqw chin), aluminium rim, camera dot.
- **Screen** — behind the live desktop, filling the screen box with rounded top corners: the desktop's landscape wallpaper (`DEFAULT_LANDSCAPE` from [Wallpaper.tsx](../src/components/desktop/Wallpaper.tsx), 16:10 like the screen, so it lines up with the desktop's own wallpaper) and a strip styled like the menu bar. It shows only where a viewport squarer than 16:10 leaves the desktop short of the screen's sides. Where the desktop ends, a faint sub-pixel seam can show in the menu bar: the desktop's wallpaper and its translucent menu bar share that antialiased edge.
- **Base** — an SVG at the screen's bottom edge (`top-full`, `viewBox 0 0 100 100` over `100cqw`, so one unit is `1cqw`, like DeskScene). The laptop is seen from slightly above, so the deck is drawn as a trapezoid that widens towards the viewer. Back to front: blurred contact shadow, hinge bar, front lip, deck surface (shaded under the lid), thumb scoop, speaker-grille dots, keyboard well, keys, trackpad. All paths come precomputed from `LAPTOP_BASE` in [scenery.ts](../src/components/intro/scenery.ts).

The keyboard is a 14-inch MacBook Pro layout: a full-height function row, five letter rows, and the inverted-T arrows with half-height ↑/↓ (77 keys in one `<path>`). Speaker grilles flank it, and the trackpad sits centred below.

## DeviceFrame ([src/components/intro/DeviceFrame.tsx](../src/components/intro/DeviceFrame.tsx))

Stateless, `aria-hidden` phone and tablet hardware for portrait screens, drawn around the viewport-sized screen box in `cqw` of it like LaptopFrame and coloured with the same `--laptop-*` tokens. Props: `{ part: "body" | "front"; corners?: MotionValue<number> }`.

- `part="body"` (behind the screen): on `intro-phone:`, an iPhone body (4.5cqw black bezel, 0.7cqw metal rim, 16.5cqw corners around the screen's 12cqw), action and volume buttons on the left and a side button on the right; on `intro-tablet:`, an iPad body (5cqw bezel, 0.4cqw rim, 7.6cqw corners around 2.6cqw), a camera dot in the top bezel and a top button. Under either, the stand's ledge: a brushed-aluminium bar the device rests on (~75% of the screen width).
- `part="front"` (over the screen): the phone's Dynamic Island (28cqw × 8.4cqw pill, 2.6cqw from the top). Its opacity is `corners`, so it fades out as the screen corners flatten at the end of the zoom.

DeskScene draws the rest of the stand (neck and base) on the desk; the neck rises behind the device, so the ledge always hides its top whatever the lift.

## SceneBackdrop ([src/components/intro/SceneBackdrop.tsx](../src/components/intro/SceneBackdrop.tsx))

`aria-hidden` room behind the device, outside the stage. Props: `{ eased: MotionValue<number> }`. Each layer is a `DepthLayer` (local helper): an `intro-layer` element with `--intro-depth` and the per-frame `--intro-e`, holding an `intro-anchor` div at the screen's resting bottom edge, which holds the **room frame**: a size container 100 `--intro-unit`s wide, centred on the device and scaled by `--intro-room-scale` about the anchor:

| Layer | Depth | Content |
| --- | --- | --- |
| Night view | 0.1 (`NIGHT_DEPTH`) | Seen only through the window: `--scene-night-*` sky, stars, moon with a glow, snowy hills with a band of pines, and falling snow. |
| Room | 0.35 (`ROOM_DEPTH`) | Back wall with the window cut out, wood floor, baseboard, the window (frame, mullions, sill, tied-back curtains on a brass rod), `<Fireplace />`, a warm vignette, and a flickering firelight glow. |

Both layers are drawn in **room units**, 1cqw of the room frame, with x = 50 on the device's centre, y = 0 on the device screen's bottom edge and up negative, in SVGs whose user units are cqw. Because the stage is drawn from the same edge in the same proportions, the room lines up with the desk at every aspect ratio: one desk unit is `DESK_UNIT` (0.25) room units, so the desk's back edge (desk y −18) sits at y −4.5, just in front of the floor line at `ROOM_FLOOR_Y` (−9). The wall is a single `evenodd` path with the window glass cut out, so the night layer shows through it and shifts behind the frame as the camera moves in.

On phones and tablets the room is magnified about the anchor and **panned** by `--intro-room-pan` (a `Pan` wrapper, `translate-x-(--intro-room-pan)`) so the fireplace stands behind or beside the device. Only the parts with a horizontal position are panned: the wall (its own SVG, `viewBox="-90 -120 280 111"`, reaching high enough to fill a tall portrait screen), the window and fireplace (`viewBox="-10 -60 120 100"`), the night view and the firelight glow. The floor, its seams and the baseboard (`viewBox="-90 -10.2 280 50.2"`) and the vignette stay centred on the view, so the floorboards always converge on the device, whose desk isn't panned.

The wall, floor and baseboard run from x −90 to 190, far past the 16:10 frame, so a wide viewport (up to about 4:1) shows more of them. The vignette is a radial gradient with a fixed ellipse (106 × 59.4 units about the fireplace and desk) in a much larger box, so everything beyond the ellipse, including the extra wall and floor, is evenly dimmed.

The falling snow is a `motion.svg` holding the same 45 × 42 tile of flakes twice, stacked; it slides down one tile height (`y` from −50% to 0%) every 18 s on a linear loop, so the repeat is seamless. The firelight is an HTML `div` with a radial gradient whose opacity flickers (2.2 s, mirrored), so the compositor animates it without repainting the wall.

## Fireplace ([src/components/intro/Fireplace.tsx](../src/components/intro/Fireplace.tsx))

`<g>` drawn inside SceneBackdrop's room SVG, in the same room units, with the firebox centred on x = 15 so it shows left of the laptop and above the desk's back edge (behind the phone, or left of the tablet, once the room is panned). Back to front: stone hearth slab with a glow on it, a running-bond brick panel (`brickCourses`) with a soldier course around the arched opening, the sooty firebox with darker bricks on its back wall, a flickering inner glow, the grate, a back log, the fire, the front log, pulsing embers and andirons. Then the painted mantelpiece (plinths, panelled pilasters, frieze, shelf), fairy lights draped under the shelf in four swags (alternate bulbs twinkle out of step), and `<MantelClock />` standing in the middle of the shelf.

The fire is a broad base flame that swells slowly, plus five `<Flame>` tongues of different heights, leans, durations and delays.

## MantelClock ([src/components/intro/MantelClock.tsx](../src/components/intro/MantelClock.tsx))

A walnut tambour clock with a brass bezel and a cream face, in Fireplace's room units, showing the visitor's **local time**. It reads `useNow()` from [clock.ts](../src/lib/clock.ts): the hour and minute hands are `rotate()` transforms on the SVG (hour = (h mod 12 + m / 60) × 30°, minute = (m + s / 60) × 6°) and move each time `useNow()` ticks on the minute. A thin red second hand sweeps once a minute on a linear `motion` loop that starts from the current second. It sits in a group with a transparent disc the size of the face, so the group's `fill-box` centre, which motion rotates about, is the pivot.

The hands render only once `useNow()` returns a `Date`. It is `null` on the server and on the first client render, so the server HTML (the face without hands) matches what hydrates.

## Flame ([src/components/intro/Flame.tsx](../src/components/intro/Flame.tsx))

A flickering teardrop fire tongue standing on `(x, y)` in the parent SVG's units. Props: `{ x, y, height, lean?, duration?, delay? }`. It has three layers (`--scene-flame-outer` / `-mid` / `-core`). A `motion.g` loops `scaleY`, `scaleX` and `rotate` keyframes about the flame's base (`originY: 1`; motion sets `transform-box: fill-box` on SVG). Paths come from `flamePath` in [scenery.ts](../src/components/intro/scenery.ts). Used by Fireplace for the fire's tongues.

## Scenery geometry ([src/components/intro/scenery.ts](../src/components/intro/scenery.ts))

All generated scene geometry lives here: `mulberry32` (seeded PRNG), `sine` (arithmetic-only approximation of `Math.sin`), `round2`, `dotsPath` (circles as one path) and `flamePath`; `LAPTOP_BASE` for LaptopFrame; `DESK`, `RUG` and `deskBox` for DeskScene; and, in room units for SceneBackdrop and Fireplace, `ROOM_FLOOR_Y`, `floorSeams`, `brickCourses`, `nightHillY` / `nightNearY` / `crestPath`, `pinesPath`, `starDots` and `snowTile`.

The scene is drawn to the scale of a 14-inch MacBook Pro, whose screen is about 30 cm wide, so 1 cm ≈ 3.3 desk units (1% of the screen's width).

`LAPTOP_BASE` lays out the deck in plan coordinates: `u` runs across 0–1, and `v` runs from the hinge (0) to the front edge (1). The camera looks squarely at the screen, and the lid is tilted back about 25°. So the 22 cm deck (73 units in plan) foreshortens to sin 25° ≈ 0.42 of its depth: the front edge sits 31 units below the back edge. The back edge is 102.8 units wide (the lid's width) at y = 2.6. Plan points are projected in perspective with a scale of `1 / (1 − c·v)`, which is 1 at the hinge and `DECK_SPREAD` (1.07) at the front edge. The result holds the path strings for every part of the base, plus `backY` / `frontY` for the gradients.

`flatSpread(y)` extends the deck's vanishing lines: it returns the width multiplier (1 at the hinge line) for anything lying flat at projected depth `y`. `DESK` uses it to build a writing desk about 85 cm wide. Its top runs from y = −18 (behind the laptop) to y = 44 and is 280 units wide at the front edge. `DESK` holds the top and grain paths and the leg positions. `RUG` uses the same vanishing lines for a rug about 300 cm wide whose back edge (y = 24) is hidden behind the desk except at the sides, and whose own sides show only on very wide viewports; it holds the field, back border, fringe and thin cross stripes. `deskBox` builds a box lying square on the desk (its top, front face, the inner side that shows right of centre, a strap across it and the page block on its front face) along the same vanishing lines; DeskScene stacks two of them as notebooks. `floorSeams` runs the room's floorboards towards the same vanishing point, scaled into room units by `DESK_UNIT` from [camera.ts](../src/components/intro/camera.ts): 53 planks across the 16:10 frame, then more out to x −90 and 190 from a second seed, so the frame's joints don't move.

The geometry is server-rendered by Node (V8) and hydrated in every browser engine, so its output must be **bit-identical across JS engines**. If it isn't, React reports a hydration mismatch. The module therefore uses only `+ − × ÷ %` and `Math.round` / `min` / `max` / `floor` / `ceil` / `imul`, whose results IEEE 754 and the JS spec fix exactly. `Math.sin`, `Math.pow` / `**` and other library maths can differ in the last bit between engines; JavaScriptCore in Safari, for example, gave a different wildflower `cy` than V8. Values written to SVG attributes are also rounded (`toFixed`, or `round2` for numeric props).

## DeskScene ([src/components/intro/DeskScene.tsx](../src/components/intro/DeskScene.tsx))

`aria-hidden` SVG inside the screen box, positioned at its bottom edge (`top-full`, `viewBox 0 0 100 100` over `100cqw` → one unit is `1cqw`, 1% of the screen's width, `overflow-visible`). The units match LaptopFrame's, so the desk lines up under the laptop base at any aspect ratio. A phone or tablet screen is narrower than the laptop's, so the SVG sits in a wrapper scaled by `--intro-desk-scale` (25 ÷ device width) about the screen's bottom centre, which keeps the desk the same size in the room, and an inner wrapper lowers it by `--intro-desk-lift`, the height of the device's stand. Back to front:

1. Rug (`RUG` from [scenery.ts](../src/components/intro/scenery.ts)): plain rust field, cream back border with fringe and thin dark stripes, darkened towards its edges by a radial gradient. A soft shadow band falls across it below the desk's front edge.
2. Desk (`DESK`): back legs, then the oak top surface (`--scene-wood-top`) with faint grain lines. The top shares the laptop base's vanishing lines, so the two read as one view from above. Then the 6-unit front edge (`--scene-wood-face`) and walnut front legs (`--scene-desk-leg`).
3. On phones and tablets, the rest of the stand (`STANDS.phone` / `STANDS.tablet`, shown by `intro-phone:` / `intro-tablet:`): a soft shadow, an aluminium neck rising from y −30 (hidden behind the device and DeviceFrame's ledge) and a `deskBox` base plate, ~9 × 6.5 cm for the phone and ~14 × 8 cm for the tablet.
4. Props on the desk, drawn at real size in desk units. The `Mug` and `NotebookStack` components are rendered twice: the laptop/tablet layout, and a phone layout (`hidden intro-phone:block`) with the mug at x 22 instead of −34 and the stack 46 units closer in (`notebookStack(-46)`), so both sit beside the small phone. Back left: a coffee mug ~6.5 cm across and 7 cm tall (`MUG`), with a shaded body, a red band, its handle on the left, a rim with coffee inside and two steam wisps that fade and rise on a loop (3.2 s, staggered). Right: two notebooks from `deskBox`, a navy notebook (~16 × 12 cm) with a mustard ribbon bookmark under a tan leather pocket journal (~13 × 9 cm) with a black elastic strap, both showing their page edges. An uncapped black fountain pen with a gold nib lies on the journal, and a capped red one on the desk in front. Both lie as a right-handed writer sets a pen down: nib (or cap) pointing away and to the left, end cap towards the viewer on the right. The pens are drawn lying along −x from their end cap and placed by a `translate(…) rotate(…) scale(PEN_SCALE)` transform (0.8, so they are ~11.5 cm long), each with an offset shadow.

## IntroWalkthrough ([src/components/intro/IntroWalkthrough.tsx](../src/components/intro/IntroWalkthrough.tsx))

Rendered inside the screen box after `{children}`, so it is drawn in the screen's own unscaled coordinates. It is `aria-hidden`, `pointer-events-none`, and at `z-60` so it sits above the dock and windows.

- On mount (and on resize) it measures every `[data-dock-icon]` button in the screen, converting `getBoundingClientRect()` back to unscaled pixels with the screen's current scale.
- Its stops are a rest point (64% / 40%: over the About window, or the home screen's identity card), then each dock icon. Every 1.6 s it advances to the next stop.
- A macOS-style arrow cursor (`--black` fill, `--white` outline) glides to each stop (0.8 s); on a phone or tablet (`intro-device:`) a translucent white fingertip dot does instead, centred on each stop. At a dock icon, a dock-tooltip-style label fades in above it. The labels are "About me", "Projects", "Contact" and "Terminal" (the last only on the laptop, since the phone and tablet docks have no Terminal), falling back to the icon's `aria-label`.
- It renders nothing when no dock icons are present (the pre-hydration frame), and unmounts with the rest of the scene when the intro finishes.

## Mobile shell ([src/components/mobile/](../src/components/mobile/))

Below 1024 px, and on portrait viewports of any width, `<MobileShell />` replaces the entire desktop chrome with an iOS-style home screen (widgets + dock) and a sheet stack. Phones get full-screen sheets; tablets (the `tablet:` variant, ≥ 700 × 700 px) get floating card sheets; a phone on its side (the `short:` variant, ≤ 480 px tall) gets the dock on the right edge. See dedicated sections below.

## Wallpaper ([Wallpaper.tsx](../src/components/desktop/Wallpaper.tsx))

Sits behind everything as a fixed, full-viewport background. Stateless — renders the bundled "snowfall" wallpaper via a responsive `<picture>`. The wallpaper is the view from the intro room's window on a winter night: a starry sky with a full moon, snow-capped mountains, rolling snowy hills with pines, a cabin with lit windows and a smoking chimney, and falling snow. Its cool blues set the device's screen apart from the warm, fire-lit room around it. It is drawn as SVG and rasterised to JPEG with `sharp` by [scripts/generate-wallpaper.mjs](../scripts/generate-wallpaper.mjs) (`npm run wallpaper`; the hills, mountain peaks, moon and cabin positions and the palette are constants at the top of that script, and its randomness is seeded, so the output is deterministic).

- `<source media="(orientation: portrait)" srcSet="/wallpapers/snowfall-768x1280.jpg" />` (768×1280 crop of the right-hand side, keeping the moon and the cabin, ~34KB)
- `<img src="/wallpapers/snowfall-2560x1600.jpg" />` (2560×1600 landscape, ~108KB) as the default. The moon and cabin sit right of centre, clear of the About window and the dock.
- The `<img>` carries `alt=""` + `aria-hidden="true"` (decorative) and `fixed inset-0 -z-10 h-full w-full object-cover` for the full-bleed backdrop.

## MenuBar ([MenuBar.tsx](../src/components/desktop/MenuBar.tsx))

Fixed `inset-x-0 top-0 z-50` header at `h-7` (28px). Glass surface: `border-b border-separator bg-surface backdrop-blur-(--glass-blur)`. Text is `text-xs font-medium`.

Props: `{ onOpenSpotlight: () => void }`.

Layout:

```
[User · Nhat Nguyen]   Portfolio   Contact                          Search  Mon 3:42 PM
```

Left side (`<nav>`, `gap-4`):

- About button — single `<button aria-label="About menu">` containing `<User size={14}>` plus a semibold `<span>` with the site owner's name ("Nhat Nguyen"). On click, dispatches `OPEN { appId: "about", source: "menu_bar" }`. There is no actual dropdown menu. (Replaces the canonical macOS Apple logo + active-app name — this portfolio is about Nhat, not Apple, and there is no concept of an "active app" in the macOS sense.)
- Nav buttons — two `<button>`s for top-level portfolio navigation, each dispatching `OPEN` (with `source: "menu_bar"`) against the [APPS](../src/components/apps/registry.ts) registry: `Projects` → `finder`, `Contact` → `contact`. They replace the canonical "File / Edit / View / Window / Help" menus, which would otherwise be inert decoration in a single-purpose portfolio site.

Right side:

- Search button — `<button aria-label="Open Spotlight">` that sends the `spotlight_open` analytics event (`method: "click"`) and calls `onOpenSpotlight`. Renders `<Search size={14}>`.
- Clock — `<span className="tabular-nums">{time}</span>` where `time` comes from `useClock()`.

## Dock ([Dock.tsx](../src/components/desktop/Dock.tsx))

Fixed `inset-x-0 bottom-3 z-40` flex justify-center wrapper, with `pointer-events-none` so clicks pass through to the desktop except on the pill itself.

Inner pill: `pointer-events-auto relative flex items-end gap-3 rounded-2xl border border-separator bg-surface-secondary px-3 pb-2 pt-3 shadow-overlay backdrop-blur-(--glass-blur)`.

Iterates [APPS](../src/components/apps/registry.ts) in registry order, skipping any entry where `hideFromDock` is true. For each remaining app:

```ts
const isOpen = windows.some(w => w.appId === app.id);
<DockIcon
  icon={app.icon}
  label={app.title}
  open={isOpen}
  bounceDelay={hint ? i * BOUNCE_STAGGER_S : undefined}
  onClick={() => { setHint(false); dispatch({ type: "OPEN", appId: app.id, source: "dock" }); }}
/>
```

Note: `OPEN` on an already-open app focuses (and unminimizes) it, per the reducer in [windows-store.ts](../src/lib/windows-store.ts).

**Explore hint** — once the desktop is live (`useIntroPending()` is `false`, either because the desk intro just finished or because it never played), the dock sets `hint` after `HINT_DELAY_MS` (500 ms) and clears it `HINT_DURATION_MS` (8 s) later. While `hint` is true, a glass chip ("Click an app to explore", `MousePointerClick` icon) floats above the pill (`AnimatePresence`, fade + 6px rise), and each icon bounces once, staggered by `BOUNCE_STAGGER_S` (0.12 s). Hovering the pill or clicking any icon dismisses it.

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
| `bounceDelay` | `number?` | Seconds. When defined, the tile bounces once (`y: [0, -14, 0, -5, 0]`, 0.9 s) after this delay — the dock's explore hint. Skipped under reduced motion. |

The `<button>` carries `data-dock-icon={appId}`, which [IntroWalkthrough](#introwalkthrough-srccomponentsintrointrowalkthroughtsx) uses to find the icons.

Structure (single `<button>`, three `<span>`s):

1. **Tooltip** (above the icon) — `absolute -top-9 hidden ... group-hover:block`, glass-styled chip showing `label`. Only rendered when `compact` is `false`.
2. **Icon tile** — `h-14 w-14 rounded-2xl border border-field-border bg-linear-to-b from-white/40 to-white/10 shadow-surface`. When `compact` is `false`, also `transition-transform duration-150 ease-out group-hover:-translate-y-2 group-hover:scale-110`. Renders `<Icon size={32} strokeWidth={1.5}>`. Wrapped in a `motion.span` with `rest` / `bounce` variants for `bounceDelay` (a wrapper, so the bounce's inline transform doesn't fight the hover transform classes).
3. **Indicator dot** — `mt-1 h-1 w-1 rounded-full bg-foreground/70`, `opacity-100` when `open`, else `opacity-0`.

There is no right-click handling on dock icons.

## Spotlight ([Spotlight.tsx](../src/components/desktop/Spotlight.tsx))

Hand-rolled command palette. Props: `{ open: boolean; onOpenChange: (open: boolean) => void; mobile?: boolean }`. [MobileShell](#mobileshell-srccomponentsmobilemobileshelltsx) passes `mobile`, which leaves out apps with `desktopOnly: true` (Terminal), since phones and tablets have no Terminal.

Internal state: `query: string` (the input value), `activeIndex: number` (the highlighted result). Refs: `inputRef` (focus target), `previouslyFocusedRef` (focus return target).

Window keyboard listener (added on mount, removed on unmount):

- `Cmd+K` or `Ctrl+K` → `e.preventDefault()` and `onOpenChange(true)`; when Spotlight wasn't already open, also sends `spotlight_open` (`method: "shortcut"`).
- `Escape` → `onOpenChange(false)`.

Open/close effect:

- On open → captures `document.activeElement` and focuses the input on the next animation frame.
- On close → resets `query` and `activeIndex`, then returns focus to the previously focused element.

Filtering and navigation:

- `filtered = apps.filter(a => a.title.toLowerCase().includes(query.trim().toLowerCase()))` (no query → all of `apps`), where `apps` is `APPS`, minus `desktopOnly` apps when `mobile` is set.
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

`launch(appId)` sends `spotlight_select` (the app and the query's length, never its text), dispatches `OPEN { appId, source: "spotlight" }` and calls `onOpenChange(false)` (the close effect resets `query` and `activeIndex`).

The list contains only apps. There are no project entries, recent searches, or other groups.

## useClock and useNow ([src/lib/clock.ts](../src/lib/clock.ts))

Two hooks live in this module:

- **`useNow(): Date | null`** — the source-of-truth ticker. Returns `null` on first render (SSR-safe) and a `Date` after mount. Schedules a `setTimeout` aligned to the next minute boundary, then a 60-second `setInterval`. Both timer ids are tracked in closure-scoped variables and cleared in the effect's cleanup return.
- **`useClock(): string`** — consumes `useNow()` and formats with `Intl.DateTimeFormat(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })` (e.g. `"Sat 3:42 PM"`). Used by [MenuBar.tsx](../src/components/desktop/MenuBar.tsx).

[MobileStatusBar.tsx](../src/components/mobile/MobileStatusBar.tsx) consumes `useNow()` directly and formats a shorter `h:mm a` locally — no second timer. The desk intro's [MantelClock](#mantelclock-srccomponentsintromantelclocktsx) also reads `useNow()` to set its hands.

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
- `useLayoutEffect` reads `window.matchMedia(MOBILE_MEDIA_QUERY).matches` and subscribes to its `change` event. Cleanup removes the listener.
- `MOBILE_MEDIA_QUERY` (exported) is `(max-width: 1023.98px), (orientation: portrait)`: under 1024 px wide, or portrait at any width, = mobile; landscape and 1024 px or wider = desktop. `1023.98px` matches Tailwind's `lg` boundary. The same query is registered as the `mobile:` custom variant in [globals.css](../src/app/globals.css) — keep the two in sync.

Consumers should treat `null` as "render the CSS-picked fallback" (Desktop.tsx server-renders the mobile shell, the intro's first frame and the bare wallpaper, and lets the `mobile:` / `intro:` variants show one).

## MobileShell ([src/components/mobile/MobileShell.tsx](../src/components/mobile/MobileShell.tsx))

The mobile counterpart of `<DesktopBody>`. Mounted when `useIsMobile()` returns `true`. Owns `spotlightOpen: boolean` and a `goHome` callback.

Renders, in this order:

1. `<Wallpaper />` (reused as-is).
2. `<HomeScreen hidden={hasVisible} />` — identity card + project carousel, z-0, fades out when any sheet is visible.
3. `<MobileStatusBar onOpenSpotlight={...} />` — top, z-50.
4. `<MobileDock hidden={hasVisible} />` — the launcher, z-40, visible on the home state, slides off-screen when any sheet is visible.
5. `<AnimatePresence>` wrapping a `.map` over every window record (regardless of `minimized`), each rendered as an `<AppSheet>` with `isActive` and `stackIndex` props.
6. `<HomeIndicator onGoHome={goHome} disabled={!hasVisible} />` — z-40 above sheets.
7. `<Spotlight open={spotlightOpen} onOpenChange={setSpotlightOpen} mobile />` — reused, without desktop-only apps.

Sheet stack is sorted **ascending by `z`** so the highest-z sheet renders last (and visually stacks on top). `key={win.id}` preserves component identity across reorders (state survives raising/lowering).

`goHome` loops through non-minimized windows and dispatches `MINIMIZE` for each. Sheets slide off-screen via their `animate` prop; their app state stays mounted.

`MobileShell` is always wrapped in [`<DeskIntro>`](#desk-intro-srccomponentsintrodeskintrotsx): on a portrait screen with motion allowed it first appears on the screen of a phone or tablet standing on the desk, and becomes the live home screen when the zoom finishes; elsewhere (reduced motion, a phone on its side) DeskIntro collapses to `display: contents` and the shell shows straight away. It is also server-rendered in [Desktop.tsx](../src/components/desktop/Desktop.tsx)'s pre-hydration frame (once on its own, in `hidden mobile:block intro-device:hidden`, and once on the intro's screen), so phones and tablets get the scene or the home screen in the initial HTML instead of a bare wallpaper. Once `useIsMobile()` resolves it remounts in the `isMobile === true` branch, before the browser paints.

## HomeScreen ([src/components/mobile/HomeScreen.tsx](../src/components/mobile/HomeScreen.tsx))

The mobile shell's home state: two iOS-style glass widgets over the wallpaper, so a visitor sees who this is and what they've built before opening anything. Props: `{ hidden: boolean }` — `true` while any sheet is visible.

- **Identity widget** (`<section>`): an initials avatar (`bg-accent`), `ABOUT.name` and `ABOUT.location`, then `ABOUT.title` as the page's `<h1>` (mirroring the desk intro's headline), then two `h-11` pill buttons: "About me" (`OPEN about`) and "Contact" (`OPEN contact`).
- **Projects widget** (`<section>`): a "Projects" heading with a "See all" button (`OPEN finder`), then a horizontal, scroll-snapping carousel of every entry in `PROJECTS`. Each card is a `<button>` with a [`ProjectThumbnail`](#projectthumbnail-srccomponentsprojectthumbnailtsx) and the title (two lines max) that opens `preview` with `{ projectId }`. Every open from the home screen carries `source: "home_screen"`. Cards are 62% of the widget on phones (so the next one peeks in), `w-56` from `sm`, `w-48` on `short:` and `w-64` on `tablet:`.

Widget surface: `rounded-3xl border border-field-border bg-surface shadow-overlay backdrop-blur-(--glass-blur)` (the standard glass recipe with iOS widget corners).

Layout: the root `<motion.main>` is `fixed`, scrolls vertically, and ends 7 rem (plus the bottom safe area) above the bottom edge, at the top of the dock, so content is never drawn under the dock. Its inner column (`max-w-xl`, `tablet:max-w-2xl`) is vertically centred with `justify-center` and pads its top past the status bar. On `landscape:` the widgets sit side by side; on `short:` (dock on the right) the scroller runs to the bottom edge and pads its right side past the dock. The `tablet:` variant enlarges the padding and the headline (`text-4xl`).

When `hidden`, it is `inert` + `aria-hidden` and animates to `opacity 0, scale 0.94` over 0.25 s (instant with reduced motion), like iOS zooming the home screen away behind an app. `initial={false}` keeps the server-rendered frame at full opacity.

## ProjectThumbnail ([src/components/ProjectThumbnail.tsx](../src/components/ProjectThumbnail.tsx))

Shared `aspect-video` project preview used by Finder's grid and the home screen carousel. Props: `{ project: Project; className?: string }` (`className` adds rounding/borders/margins). Shows the project's `logo` (contained at 75%), else its first screenshot (`object-contain` for `orientation: "portrait"` projects, `object-cover` otherwise), else the title's first letter. Images are `loading="lazy"`.

## MobileStatusBar ([src/components/mobile/MobileStatusBar.tsx](../src/components/mobile/MobileStatusBar.tsx))

Fixed top, `z-50`. Height `calc(2.75rem + env(safe-area-inset-top))` with `pt-[env(safe-area-inset-top)]` so the 44 pt content sits below the notch.

- Left: About `<button aria-label="About menu">` containing `<User size={14}>` plus a semibold `<span>` with "Nhat" (first name only — full "Nhat Nguyen" would crowd the narrower mobile bar alongside the 44 pt tap target). On click, dispatches `OPEN { appId: "about", source: "status_bar" }`. Mirrors the desktop MenuBar's identity affordance.
- Right: `<Search size={14}/>` button (`h-11 w-11` hit area) that sends `spotlight_open` (`method: "click"`) and calls `onOpenSpotlight()`, then the clock — `useNow()` formatted as `h:mm a`. **When `NEXT_PUBLIC_GA_ID` is set (R8)**, the clock renders as a `<button>` calling `toggle()` from `useNotificationCenter()` — the mobile re-decide path for analytics consent (opens the standalone consent card). When env is unset, stays plain `<span>` (no NC panel on mobile, so a toggle would have no visible effect).

## MobileDock ([src/components/mobile/MobileDock.tsx](../src/components/mobile/MobileDock.tsx))

The mobile counterpart of the desktop `<Dock>`. Single bottom pill that mirrors the desktop's glass styling and reuses [`DockIcon`](../src/components/desktop/DockIcon.tsx) with `compact` enabled (no hover tooltip, no hover lift/scale). Tapping an icon dispatches `OPEN { appId, source: "mobile_dock" }`.

Props: `{ hidden: boolean }` — driven by whether any non-minimized sheet is visible.

Structure:

- Outer `<motion.nav aria-label="Dock">` — `pointer-events-none fixed inset-x-0 z-40 flex justify-center bottom-[calc(env(safe-area-inset-bottom)+1.25rem)]` (`env(safe-area-inset-bottom)` falls back to `0` per CSS spec). The dock doesn't need to clear the `HomeIndicator` hit area: the dock is only visible when no sheet is, and the indicator is disabled (`pointer-events-none`) then.
- On `short:` viewports (≤ 480 px tall — a phone on its side), the nav instead spans from below the status bar to the bottom edge, pinned to the right (`right-[max(env(safe-area-inset-right),0.75rem)]`), and centres the pill vertically; the pill switches to `flex-col` and is scaled to 85% (`origin-right`) so the icons fit the height. The hide animation is unchanged (the pill drops 120 px while fading out).
- Inner pill — same classes as the desktop dock (`pointer-events-auto flex items-end gap-3 rounded-2xl border border-separator bg-surface-secondary px-3 pb-2 pt-3 shadow-overlay backdrop-blur-(--glass-blur)`).
- Iterates the module-level `DOCK_APPS = APPS.filter(app => !app.hideFromDock && !app.desktopOnly)` in registry order — About, Finder and Contact; phones and tablets have no Terminal. Each item is `<DockIcon ... compact />`. Indicator dots light up for any window record (including minimized).

Animation:

- `animate={{ y: hidden ? 120 : 0, opacity: hidden ? 0 : 1 }}` with a `spring (stiffness 320, damping 32)`. Reduced motion (`useReducedMotion()`) collapses the transition to `{ duration: 0 }`.
- `inert={hidden}` + `aria-hidden={hidden}` suppress pointer/keyboard/AT on the offscreen pill.

Focus restoration: when `hidden` flips `true → false` (last sheet closed, or all minimized via the home indicator), focuses the first dock button via `pillRef.current?.querySelector("button")?.focus({ preventScroll: true })` — required by [STYLEGUIDE.md §5.1.1](../STYLEGUIDE.md) so keyboard users land on a real focusable target with the native focus ring visible.

## AppSheet ([src/components/mobile/AppSheet.tsx](../src/components/mobile/AppSheet.tsx))

Full-screen `motion.section` with dynamic `style={{ zIndex: 30 + stackIndex }}`. Mounted for the entire life of the window record (unmounts only on `CLOSE`), so app-local state survives minimize/restore and sheet reordering.

Animation (`OFFSCREEN_Y` = `"110%"`, past 100% so the tablet card, which floats above the bottom edge, also clears the screen):
- `initial={{ y: OFFSCREEN_Y, opacity: 0.6 }}`
- `animate={ win.minimized ? { y: OFFSCREEN_Y, opacity: 0.6 } : { y: 0, opacity: 1 } }` — slides off-screen on minimize, back on restore.
- `exit={{ y: OFFSCREEN_Y, opacity: 0.6 }}` — slides down before unmount on CLOSE (inside `MobileShell`'s `<AnimatePresence>`).
- `transition: spring { stiffness: 320, damping: 32 }`; reduced motion → `{ duration: 0 }`.

Accessibility:
- `inert={!isActive}` + `aria-hidden={!isActive}` on inactive sheets. Native `inert` suppresses pointer events, tab order, and AT.
- On `isActive` becoming true, focuses the Done button via a `useEffect`.

Layout (phones): full screen, `pt-[calc(2.75rem+env(safe-area-inset-top))]` reserves the status bar; `pb-[max(env(safe-area-inset-bottom),12px)]` reserves the home indicator.

Layout (`tablet:`, ≥ 700 × 700 px): a floating card like an iPadOS window — inset `1.5rem` from the sides, starting `0.75rem` below the status bar and ending `2.75rem` above the bottom edge (plus safe areas) so the home indicator sits below it, with `rounded-2xl`, a `border-field-border` border, `shadow-overlay`, `overflow-hidden` and no vertical padding. The wallpaper shows around it. Body is `min-h-0 flex-1 overflow-auto` with an inner `h-full` wrapper so app components that rely on `h-full` (Terminal especially) keep working.

Header has a left `<button>` ("Done" + `ChevronLeft size={16}`) that sends `window_action` (`action: "close"`) and dispatches `{ type: "CLOSE", id: win.id }`. The window title is centered and `pointer-events-none`.

Defensive guard: if no matching app exists in `APPS`, returns `null` (mirrors `WindowManager.tsx`).

## HomeIndicator ([src/components/mobile/HomeIndicator.tsx](../src/components/mobile/HomeIndicator.tsx))

A `<button>` at z-40, fixed bottom, `h-11 w-32` (44 pt hit area). Visible portion is just the inner `h-1.5 w-32 rounded-full bg-white/80` pill at the bottom. Tapping calls `onGoHome` (which minimizes every visible sheet). `disabled={!hasVisible}` greys out the pill when no apps are open.

The hit area overlaps the bottom ~44 pt of the active sheet — acceptable per iOS convention (apps avoid critical UI in the bottom strip).

## Notification Center ([src/components/notifications/NotificationCenter.tsx](../src/components/notifications/NotificationCenter.tsx))

A macOS-style notification panel that slides in from the right edge when the menu-bar clock is clicked. Generic surface — it knows about open/closed state and the panel chrome (header + close X + animation) but **not** about analytics or any specific notification. Notifications are passed in as `children`.

- **Provider:** [`NotificationCenterProvider`](../src/lib/notification-center.ts) wraps the tree in `layout.tsx` and exposes `{ open, toggle, setOpen, persistent, setPersistent }` via `useNotificationCenter()`. Always mounted — the panel and clock work even when no notifications exist.
- **Placement (R7 liquid glass):** `fixed right-3 top-10 bottom-3 z-50 w-90` (360px wide, detached from viewport edges with ~12px margins). Rounded on all corners. Starts at `top-10` so the menu bar (`top-0 h-7`) — including the clock — stays clickable while the panel is open.
- **Surface (R7 liquid glass):** `bg-liquid-glass-surface shadow-liquid-glass backdrop-blur-(--liquid-glass-blur) backdrop-saturate-(--liquid-glass-saturate)` — translucent panel with macOS-Vibrancy-style saturation boost, deeper outer shadow, and a 1px inset specular top highlight. See [STYLEGUIDE.md §2.4](../STYLEGUIDE.md) for the recipe.
- **Animation:** spring slide-in from the right using `motion/react` (`stiffness: 320, damping: 32`, matching `AppSheet`). Respects `useReducedMotion`.
- **Close:** Esc / click backdrop / click X / call `setOpen(false)`. Backdrop is transparent (no dim) — matches real macOS. Backdrop and X are both **suppressed while persistent**; in that mode only `setOpen(false)` from inside the provider can dismiss the panel, and outside clicks fall through to the underlying page.
- **Persistent (R8):** when a consumer (currently `<AnalyticsConsent>`) calls `setPersistent(true)`, all close-attempts (`setOpen(false)`, `toggle()` while open) become no-ops at the context level. Open-attempts still work. The close X button is **hidden** (not rendered) and **the click-blocking backdrop is not rendered** while persistent — the rest of the page stays interactive while the consent card remains visible. Used to require an explicit Allow/Decline before the NC can be dismissed, without trapping the user.
- **Focus:** captures `document.activeElement` on open and restores it on close — but only when focus is still inside the panel or on `document.body`. If the user moved focus to an underlying control during persistent mode (click-through is allowed), focus stays there. Initial focus moves to the `initialFocusRef` consumer-provided element (e.g. the Decline button on the consent card) or the close X if not provided (and not hidden because of `persistent`). Non-modal — Tab can leave the panel naturally.
- **Empty state:** when `Children.count(children) === 0`, renders a muted "No new notifications" line.

## NotificationCard ([src/components/notifications/NotificationCard.tsx](../src/components/notifications/NotificationCard.tsx))

Generic visual primitive for a single macOS notification. Props: `icon`, `iconTileClassName`, `appLabel`, `timestamp`, `title`, `body`, optional `actions`, optional `variant`. Renders a `rounded-xl` card with a header row (icon tile + app label + timestamp), title, body, and optional split-actions footer (`grid divide-x divide-separator border-t`). Mobile action height is `h-11` (≥44px touch target); desktop shrinks to `h-9`.

**Variant prop (R7):**

- `variant="default"` (the unsupplied default) — dense `bg-default/80 backdrop-blur-sm` surface. Used by `MobileConsentNotification` so the mobile card reads on the bare wallpaper without a frosted panel beneath it.
- `variant="liquid-glass"` — translucent `bg-liquid-glass-card` with a `shadow-liquid-glass-card` inset top highlight, no extra `backdrop-blur` (the parent panel already blurs). Used by the desktop consent card inside `NotificationCenter`. The variant is passed in `AnalyticsConsent.tsx`, **not** in `NotificationCenter` (which stays generic and only knows about `children`).

## AnalyticsConsent ([src/components/analytics/AnalyticsConsent.tsx](../src/components/analytics/AnalyticsConsent.tsx))

The single owner of consent state. Calls [`useAnalyticsConsent()`](../src/lib/useAnalyticsConsent.ts) once and owns the persistent flag, the editing flag, and the card-content matrix.

- **Persistent card (R8):** the desktop card stays in the NC permanently when env var is set. Three content modes based on `(consent, editing)`:
  - `consent === null` OR `editing`: title "Allow Analytics?" + body + `[Decline, Allow]` buttons.
  - `consent === "granted"` + `!editing`: title "Analytics enabled" + body + `[Change preference]` action that flips `editing` to `true`.
  - `consent === "denied"` + `!editing`: title "Analytics disabled" + body + `[Change preference]` action.
- **Persistent (R8):** a `useEffect` calls `setPersistent(consent.enabled && consent.consent === null)`. While undecided the NC cannot be dismissed — but the rest of the page remains interactive (the backdrop is suppressed). User must Decline or Allow to dismiss the card. Decline is equally available — this is a forced explicit choice, not a forced consent.
- **Deferred close (R8):** action handlers don't call `setOpen(false)` directly. They set `closeAfterChoiceRef.current = (isMobile || consent === null)` and let a third `useEffect` (declared after the persistent effect) issue the close once `consent` flips to non-null. Effect declaration order matters: the persistent effect runs first and releases the flag synchronously via `persistentRef.current = false`, so the deferred close is honored. Desktop closes only on first-time decision; change-preference picks keep NC open showing the new status. Mobile closes on every pick.
- **Auto-open (desktop only):** a `useEffect` calls `setOpen(true)` only when `!isMobile && !introPending && enabled && consent === null`. `introPending` comes from `useIntroPending()` ([src/lib/intro.ts](../src/lib/intro.ts)), so the panel slides in once the [desk intro](#desk-intro-srccomponentsintrodeskintrotsx) has handed over to the live desktop.
- **Mobile branch:** `<MobileConsentNotification>` renders when `enabled && (consent === null || open)`. The `consent === null` clause keeps the card visible the entire undecided period — including after a failed Accept where `promptVisible` flips false but `consent` stays null. `open` covers the post-decision clock-toggle re-decide path.
- **Storage key:** `ga-consent` cookie (`"granted"` \| `"denied"`; absent → undecided). Read/written client-side through `readConsent` / `writeConsent` in [src/lib/analytics.ts](../src/lib/analytics.ts); read server-side via `readConsentServer()` in [src/lib/analytics-server.ts](../src/lib/analytics-server.ts) using `next/headers cookies()`. `writeConsent()` verifies persistence with a read-back since `document.cookie = ...` doesn't throw on rejection — fail-closed on Accept-with-storage-failure is preserved. The constant, `ConsentValue` type, and `parseConsent()` parser live in [src/lib/analytics-consent.ts](../src/lib/analytics-consent.ts) so neither side imports the other's runtime (`analytics.ts` pulls `@next/third-parties/google` which is `'use client'`; keeping it out of the server graph is intentional).
- **`ga-disable` flag (R8):** [`useAnalyticsConsent`](../src/lib/useAnalyticsConsent.ts) writes `window['ga-disable-' + gaId]` from inside `accept()` / `decline()` synchronously (before consent state updates) and from a `useEffect` backstop. Without this, already-loaded gtag.js keeps sending after Decline; with it, the flag is correctly `false` by the time GA re-mounts on Denied → Allow so the first page_view isn't dropped.
- **Env-var gate:** if `NEXT_PUBLIC_GA_ID` is unset, no `<GoogleAnalytics>` mounts and no consent card renders. The desktop NC shell still mounts (clock opens an empty panel). On mobile the clock stays plain text — no NC, no toggle target.
- **SSR:** the mobile banner ships in the initial server HTML so it's a valid LCP candidate. [`AnalyticsConsentServer`](../src/components/analytics/AnalyticsConsentServer.tsx) reads the cookie via `next/headers` and passes the value into the client `AnalyticsConsent` via `initialConsent`; the hook seeds its `useState` from the prop instead of reading storage in a `useEffect`. The mobile branch is wrapped in `hidden mobile:block` (the `mobile:` variant is `useIsMobile`'s media query), plus `intro-device:hidden` while `introPending` (also `true` on the server) so it stays hidden while the phone/tablet desk intro plays and appears on the home screen; where that intro doesn't play (reduced motion, a phone on its side) the banner still ships visible in the initial HTML. The desktop card stays client-gated since desktop already meets LCP targets. `AnimatePresence initial={false}` skips the slide-in enter animation on first paint so the banner first-paints at `opacity: 1; transform: none` instead of `opacity: 0` (which the browser would not count as an LCP candidate).

The single-owner rule is strict: `useAnalyticsConsent()` must appear **only** in `AnalyticsConsent`. `setPersistent` from the NC context must only be called from `AnalyticsConsent`. NotificationCenter and MobileConsentNotification consume `accept`/`decline` as props.

The single-owner rule is strict: `useAnalyticsConsent()` must appear **only** in `AnalyticsConsent`. Calling it independently from `NotificationCenter` or `MobileConsentNotification` would create separate state instances and the GA mount would never see the click.

For the event catalog and `trackEvent` contract, see [analytics.md](analytics.md).

## Cross-references

- Theme tokens (`--surface`, `--separator`, `--glass-blur`, etc.) are defined locally in [globals.css](../src/app/globals.css) — see [styling-and-icons.md](styling-and-icons.md#glass-theme).
- Brand-icon rendering — [styling-and-icons.md](styling-and-icons.md#brandicon).
- Window state machine that all dispatches feed into — [window-manager.md](window-manager.md#actions).
- How apps are rendered inside either `<Window>` or `<AppSheet>` — [apps.md](apps.md).
- Analytics events fired from the shell — [analytics.md](analytics.md).
