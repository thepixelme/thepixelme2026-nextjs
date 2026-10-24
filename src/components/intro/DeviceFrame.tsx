import { type MotionValue, motion } from "motion/react";

// Phone and tablet hardware for the desk intro on portrait screens, drawn
// around a screen box that is exactly the viewport, in cqw of it like
// LaptopFrame, so the proportions hold at any size. Only the device the
// media query picks is shown. `part="body"` goes behind the screen (bezel,
// buttons, and the ledge of the stand DeskScene draws); `part="front"` goes
// over it (the phone's Dynamic Island, which fades as the screen corners
// flatten at the end of the zoom).
export default function DeviceFrame({
  part,
  corners,
}: {
  part: "body" | "front";
  corners?: MotionValue<number>;
}) {
  if (part === "front") {
    return (
      <motion.div
        aria-hidden="true"
        style={{ opacity: corners }}
        className="pointer-events-none absolute top-[2.6cqw] left-1/2 hidden h-[8.4cqw] w-[28cqw] -translate-x-1/2 rounded-full bg-(--laptop-bezel) intro-phone:block"
      />
    );
  }

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="hidden intro-phone:block">
        {["top-[17%] h-[5%]", "top-[25%] h-[9%]", "top-[36%] h-[9%]"].map(
          (place) => (
            <div
              key={place}
              className={`absolute -left-[5.9cqw] w-[1.2cqw] rounded-l-[0.6cqw] bg-(--laptop-rim) ${place}`}
            />
          ),
        )}
        <div className="absolute top-[28%] -right-[5.9cqw] h-[13%] w-[1.2cqw] rounded-r-[0.6cqw] bg-(--laptop-rim)" />
        <div className="absolute -inset-[4.5cqw] rounded-[16.5cqw] bg-(--laptop-bezel) shadow-[0_0_0_0.7cqw_var(--laptop-rim)]" />
        <div className="absolute top-[calc(100%+5.2cqw)] left-1/2 h-[6cqw] w-[74cqw] -translate-x-1/2 rounded-[1.5cqw] bg-linear-to-b from-(--laptop-deck-top) to-(--laptop-deck-bottom)" />
      </div>
      <div className="hidden intro-tablet:block">
        <div className="absolute -top-[5.8cqw] right-[8cqw] h-[0.6cqw] w-[7cqw] rounded-t-[0.3cqw] bg-(--laptop-rim)" />
        <div className="absolute -inset-[5cqw] rounded-[7.6cqw] bg-(--laptop-bezel) shadow-[0_0_0_0.4cqw_var(--laptop-rim)]">
          <div className="absolute top-[2.1cqw] left-1/2 size-[0.9cqw] -translate-x-1/2 rounded-full bg-(--laptop-camera)" />
        </div>
        <div className="absolute top-[calc(100%+5.4cqw)] left-1/2 h-[2.8cqw] w-[75cqw] -translate-x-1/2 rounded-[0.8cqw] bg-linear-to-b from-(--laptop-deck-top) to-(--laptop-deck-bottom)" />
      </div>
    </div>
  );
}
