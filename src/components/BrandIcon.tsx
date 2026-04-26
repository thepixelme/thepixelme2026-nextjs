import type { SimpleIcon } from "simple-icons";

interface Props {
  icon: SimpleIcon;
  size?: number;
  className?: string;
  title?: string;
}

export default function BrandIcon({
  icon,
  size = 16,
  className,
  title,
}: Props) {
  return (
    <svg
      role={title ? "img" : "presentation"}
      aria-label={title ?? icon.title}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
    >
      <path d={icon.path} />
    </svg>
  );
}
