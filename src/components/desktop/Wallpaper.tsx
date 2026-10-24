const DEFAULT_LANDSCAPE = "/wallpapers/snowfall-2560x1600.jpg";
const DEFAULT_PORTRAIT = "/wallpapers/snowfall-768x1280.jpg";

export default function Wallpaper() {
  return (
    <picture>
      <source media="(orientation: portrait)" srcSet={DEFAULT_PORTRAIT} />
      <img
        src={DEFAULT_LANDSCAPE}
        alt=""
        aria-hidden="true"
        className="fixed inset-0 -z-10 h-full w-full object-cover"
      />
    </picture>
  );
}
