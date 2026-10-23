// Drawn around a screen box that is exactly the viewport, in vw units so the
// proportions hold at any size; the parent scales the whole thing.
export default function LaptopFrame() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute -inset-x-[5vw] top-[calc(100%+2.6vw)] h-[2.2vw] rounded-[50%] bg-(--laptop-shadow) blur-[1.6vw]" />
      <div className="absolute -inset-x-[1.4vw] -top-[1.4vw] -bottom-[2.1vw] rounded-t-[1.9vw] rounded-b-[0.4vw] bg-(--laptop-bezel) shadow-[0_0_0_0.16vw_var(--laptop-rim)]">
        <div className="absolute top-[0.5vw] left-1/2 size-[0.38vw] -translate-x-1/2 rounded-full bg-(--laptop-camera)" />
      </div>
      <div className="absolute -inset-x-[7vw] top-[calc(100%+2.1vw)] h-[1.15vw] rounded-t-[0.25vw] rounded-b-[4vw_1.15vw] bg-linear-to-b from-(--laptop-deck-top) via-(--laptop-deck-mid) to-(--laptop-deck-bottom)">
        <div className="absolute top-0 left-1/2 h-[0.4vw] w-[11vw] -translate-x-1/2 rounded-b-[0.6vw] bg-linear-to-b from-(--laptop-deck-bottom) to-(--laptop-deck-mid)" />
      </div>
    </div>
  );
}
