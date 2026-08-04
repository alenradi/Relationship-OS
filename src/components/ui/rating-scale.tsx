"use client";

import { cn } from "@/lib/cn";

/**
 * A 1–10 scale as discrete buttons rather than a range input: tapping a number
 * is easier than dragging on a phone, and the chosen value is unambiguous.
 *
 * Colour is intentionally uniform — a low rating is information, not a failure,
 * so nothing here turns red.
 */
export function RatingScale({
  name,
  value,
  onChange,
  lowLabel,
  highLabel,
  disabled,
  tone = "accent",
}: {
  name: string;
  value: number | null;
  onChange: (value: number) => void;
  lowLabel?: string;
  highLabel?: string;
  disabled?: boolean;
  tone?: "accent" | "lilac";
}) {
  const selectedClasses =
    tone === "lilac"
      ? "border-lilac bg-lilac text-ink-inverse"
      : "border-accent bg-accent text-ink-inverse";

  return (
    <div className="space-y-2">
      <div
        role="radiogroup"
        aria-label={name}
        className="grid grid-cols-10 gap-1 sm:gap-1.5"
      >
        {Array.from({ length: 10 }, (_, i) => i + 1).map((option) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(option)}
              className={cn(
                "tabular flex h-10 items-center justify-center rounded-xl border text-sm font-medium transition",
                "disabled:cursor-not-allowed disabled:opacity-60",
                selected
                  ? selectedClasses
                  : "border-line bg-surface text-ink-soft hover:border-line-strong hover:bg-surface-muted",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>

      {lowLabel || highLabel ? (
        <div className="flex justify-between text-xs text-ink-faint">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      ) : null}
    </div>
  );
}

/** Read-only display of a rating, used after a reveal. */
export function RatingValue({
  value,
  tone = "accent",
  className,
}: {
  value: number | null;
  tone?: "accent" | "lilac" | "neutral";
  className?: string;
}) {
  const tones = {
    accent: "bg-accent-soft text-accent-ink border-accent-line",
    lilac: "bg-lilac-soft text-lilac-ink border-lilac-line",
    neutral: "bg-surface-sunken text-ink-soft border-line",
  } as const;

  return (
    <span
      className={cn(
        "tabular inline-flex h-8 min-w-12 items-center justify-center rounded-full border px-2 text-sm font-semibold",
        tones[tone],
        className,
      )}
    >
      {value === null ? "—" : `${value}/10`}
    </span>
  );
}
