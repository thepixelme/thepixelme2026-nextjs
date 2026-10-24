import type { Project } from "@/lib/projects";

interface Props {
  project: Project;
  className?: string;
}

export default function ProjectThumbnail({
  project: p,
  className = "",
}: Props) {
  return (
    <div
      className={`grid aspect-video w-full place-items-center overflow-hidden bg-surface-secondary ${className}`}
    >
      {p.logo ? (
        <img
          src={p.logo.src}
          alt={p.logo.alt}
          loading="lazy"
          className="h-3/4 w-3/4 object-contain"
        />
      ) : p.screenshots?.[0] ? (
        <img
          src={p.screenshots[0].src}
          alt={p.screenshots[0].alt}
          loading="lazy"
          className={
            p.orientation === "portrait"
              ? "h-full w-auto object-contain"
              : "h-full w-full object-cover"
          }
        />
      ) : (
        <span className="text-2xl font-semibold text-foreground/70">
          {p.title.slice(0, 1)}
        </span>
      )}
    </div>
  );
}
