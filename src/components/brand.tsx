import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";

/**
 * Two overlapping circles: two people, one shared middle. The overlap is the
 * app.
 */
export function Mark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 28"
      aria-hidden
      className={cn("size-7", className)}
      fill="none"
    >
      <circle
        cx="15"
        cy="14"
        r="10.5"
        stroke="var(--color-accent)"
        strokeWidth="2"
      />
      <circle
        cx="25"
        cy="14"
        r="10.5"
        stroke="var(--color-lilac)"
        strokeWidth="2"
      />
      <path
        d="M20 4.6a10.5 10.5 0 0 0 0 18.8 10.5 10.5 0 0 0 0-18.8Z"
        fill="var(--color-accent)"
        fillOpacity="0.18"
      />
    </svg>
  );
}

export function Wordmark({
  className,
  showTagline = false,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Mark />
      <span className="flex flex-col leading-none">
        <span className="font-serif text-xl tracking-tight text-ink">
          {copy.app.name}
        </span>
        {showTagline ? (
          <span className="mt-1 text-[0.7rem] text-ink-faint">
            {copy.app.tagline}
          </span>
        ) : null}
      </span>
    </span>
  );
}
