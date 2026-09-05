import { cn } from "@/lib/cn";
import type { ProfileRow } from "@/lib/database.types";
import { initials } from "@/lib/people";

/**
 * Initials-only avatar. Profile photos stay out of it — memories live on
 * dates, trips, milestones, and goal rewards instead.
 *
 * `variant` distinguishes the two of you consistently across every screen —
 * clay for you, lilac for them.
 */
export function Avatar({
  profile,
  variant = "accent",
  size = "md",
  className,
}: {
  profile: Pick<ProfileRow, "display_name"> | null | undefined;
  variant?: "accent" | "lilac" | "muted";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "size-7 text-[0.65rem]",
    md: "size-9 text-xs",
    lg: "size-12 text-sm",
  } as const;

  const variants = {
    accent: "bg-accent-soft text-accent-ink border-accent-line",
    lilac: "bg-lilac-soft text-lilac-ink border-lilac-line",
    muted: "bg-surface-sunken text-ink-soft border-line",
  } as const;

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border font-semibold uppercase tracking-wide",
        sizes[size],
        variants[variant],
        className,
      )}
    >
      {initials(profile)}
    </span>
  );
}
