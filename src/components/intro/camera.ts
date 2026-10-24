// The camera itself is CSS (the intro-* utilities in globals.css), driven by
// the eased scroll progress from here. Each device rests at its own scale and
// offset and zooms until its screen fills the viewport; layers further away
// (depth < 1) magnify less, which gives the room its parallax.

export const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;

// Room units per desk unit: the laptop rests at a quarter of the viewport, so
// one unit of DeskScene (1% of the laptop's screen width) is 0.25 room units.
export const DESK_UNIT = 0.25;
