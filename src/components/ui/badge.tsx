import { cn } from "@/lib/cn";

type Tone = "neutral" | "accent" | "sage" | "honey" | "lilac" | "outline";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-sunken text-ink-soft border-transparent",
  accent: "bg-accent-soft text-accent-ink border-accent-line",
  sage: "bg-sage-soft text-sage-ink border-sage-line",
  honey: "bg-honey-soft text-honey-ink border-honey-line",
  lilac: "bg-lilac-soft text-lilac-ink border-lilac-line",
  outline: "bg-transparent text-ink-soft border-line-strong",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.ComponentPropsWithoutRef<"span"> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

/** A small coloured dot, for legends and inline status. */
export function Dot({
  tone = "neutral",
  className,
}: {
  tone?: "accent" | "sage" | "honey" | "lilac" | "neutral";
  className?: string;
}) {
  const fills: Record<string, string> = {
    accent: "bg-accent",
    sage: "bg-sage",
    honey: "bg-honey",
    lilac: "bg-lilac",
    neutral: "bg-line-strong",
  };
  return (
    <span
      aria-hidden
      className={cn("size-2 shrink-0 rounded-full", fills[tone], className)}
    />
  );
}
