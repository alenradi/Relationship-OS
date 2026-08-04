import { cn } from "@/lib/cn";

type Tone = "accent" | "sage" | "honey" | "lilac" | "neutral";

const tones: Record<Tone, string> = {
  accent: "bg-accent-soft text-accent-ink border-accent-line",
  sage: "bg-sage-soft text-sage-ink border-sage-line",
  honey: "bg-honey-soft text-honey-ink border-honey-line",
  lilac: "bg-lilac-soft text-lilac-ink border-lilac-line",
  neutral: "bg-surface-muted text-ink-soft border-line",
};

/**
 * Inline message block. Even failures use the warm clay accent rather than red —
 * nothing in this app should feel like an alarm.
 */
export function Notice({
  tone = "neutral",
  title,
  children,
  className,
  role,
}: {
  tone?: Tone;
  title?: string;
  children?: React.ReactNode;
  className?: string;
  role?: "alert" | "status";
}) {
  return (
    <div
      role={role}
      className={cn(
        "rounded-xl border px-4 py-3 text-sm leading-relaxed text-pretty",
        tones[tone],
        className,
      )}
    >
      {title ? <p className="font-medium">{title}</p> : null}
      {children ? <div className={cn(title && "mt-1")}>{children}</div> : null}
    </div>
  );
}
