import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";

/**
 * Two overlapping circles: two people, one shared middle. The overlap is the
 * app.
 */
export function Mark({
  className,
  title,
}: {
  className?: string;
  /** Accessible name when the mark stands alone (decorative by default). */
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 40 28"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      aria-label={title}
      className={cn("size-7", className)}
      fill="none"
    >
      {title ? <title>{title}</title> : null}
      <circle
        cx="15"
        cy="14"
        r="10.5"
        stroke="var(--color-accent)"
        strokeWidth="2.25"
        strokeLinecap="round"
      />
      <circle
        cx="25"
        cy="14"
        r="10.5"
        stroke="var(--color-lilac)"
        strokeWidth="2.25"
        strokeLinecap="round"
      />
      <path
        d="M20 4.6a10.5 10.5 0 0 0 0 18.8 10.5 10.5 0 0 0 0-18.8Z"
        fill="var(--color-accent)"
        fillOpacity="0.2"
      />
    </svg>
  );
}

/**
 * Square app-logo lockup — same mark, padded for avatars / splash moments.
 */
export function AppLogo({
  className,
  title = copy.app.name,
}: {
  className?: string;
  title?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex size-12 items-center justify-center rounded-2xl border border-line bg-surface shadow-soft",
        "bg-gradient-to-br from-surface via-canvas to-canvas-deep",
        className,
      )}
      role="img"
      aria-label={title}
    >
      <Mark className="size-[58%]" />
    </span>
  );
}

export function Wordmark({
  className,
  showTagline = false,
  compact = false,
}: {
  className?: string;
  showTagline?: boolean;
  /** Mark + short name — better for tight mobile headers. */
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Mark />
      <span className="flex min-w-0 flex-col leading-none">
        <span
          className={cn(
            "truncate font-serif tracking-tight text-ink",
            compact ? "text-lg" : "text-xl",
          )}
        >
          {compact ? copy.app.shortName : copy.app.name}
        </span>
        {showTagline && !compact ? (
          <span className="mt-1 text-[0.7rem] text-ink-faint">
            {copy.app.tagline}
          </span>
        ) : null}
      </span>
    </span>
  );
}
