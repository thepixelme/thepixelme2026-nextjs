const DEFAULT_LANDSCAPE =
  "/wallpapers/oleg-laptev-7jQh3EiS8Bs-unsplash-1980x1320.jpg";
const DEFAULT_PORTRAIT =
  "/wallpapers/oleg-laptev-7jQh3EiS8Bs-unsplash-768x1280.jpg";

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
