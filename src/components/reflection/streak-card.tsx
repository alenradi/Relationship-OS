import { SparkIcon } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { copy } from "@/lib/copy";
import type { StreakSummary } from "@/lib/reflection";

/**
 * The only streak in the app, and it belongs to both of you jointly — there is
 * deliberately no per-person count to compare.
 */
export function StreakCard({ streak }: { streak: StreakSummary }) {
  const has = streak.current > 0;

  return (
    <Card tone={has ? "sage" : "muted"} className="flex items-center gap-4">
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-full ${
          has ? "bg-sage text-ink-inverse" : "bg-surface-sunken text-ink-faint"
        }`}
      >
        <SparkIcon className="size-5" />
      </span>

      <div className="min-w-0 space-y-0.5">
        <p className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
          {copy.reflection.streakTitle}
        </p>
        <p className="text-sm font-medium text-ink">
          {has ? copy.reflection.streakWeeks(streak.current) : copy.reflection.streakNone}
        </p>
        <p className="text-xs text-ink-soft text-pretty">
          {has
            ? copy.reflection.streakEncouragement(streak.current)
            : copy.reflection.streakBest(streak.best)}
        </p>
      </div>

      {streak.best > streak.current ? (
        <span className="ml-auto shrink-0 text-xs text-ink-faint">
          {copy.reflection.streakBest(streak.best)}
        </span>
      ) : null}
    </Card>
  );
}
