import { BusyTimeline } from "@/components/rhythm/busy-timeline";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import type { DailyStatusRow, ProfileRow } from "@/lib/database.types";
import { displayName } from "@/lib/people";
import { busyScoreLabel, busyTone, summarizeDay } from "@/lib/rhythm";

const toneBadge = {
  open: "sage",
  steady: "neutral",
  full: "honey",
} as const;

/**
 * One person's day. Used on the dashboard and on the rhythm page, for both of
 * you — `isSelf` only changes the wording of the summary and the accent colour.
 */
export function DayCard({
  profile,
  status,
  isSelf = false,
  action,
  className,
}: {
  profile: ProfileRow | null;
  status: DailyStatusRow | null;
  isSelf?: boolean;
  action?: React.ReactNode;
  className?: string;
}) {
  const variant = isSelf ? "accent" : "lilac";
  const name = isSelf ? copy.app.you : displayName(profile);

  return (
    <Card className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar profile={profile} variant={variant} />
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-ink">{name}</p>
            {status ? (
              <p className="text-xs text-ink-faint">
                {busyScoreLabel(status.busy_score)}
              </p>
            ) : null}
          </div>
        </div>

        {status ? (
          <Badge tone={toneBadge[busyTone(status.busy_score)]}>
            <span className="tabular">
              {copy.rhythm.scoreOutOf(status.busy_score)}
            </span>
          </Badge>
        ) : null}
      </div>

      {profile ? (
        <p className="text-sm leading-relaxed text-ink text-pretty">
          {summarizeDay(profile, status, { isSelf })}
        </p>
      ) : null}

      {status ? (
        <BusyTimeline
          blocks={status.busy_blocks}
          tone={variant}
          showTicks={false}
        />
      ) : null}

      {status?.note ? (
        <p className="rounded-xl bg-surface-muted px-3.5 py-3 text-sm leading-relaxed text-ink-soft text-pretty">
          {status.note}
        </p>
      ) : null}

      {action ? <div className="mt-auto pt-1">{action}</div> : null}
    </Card>
  );
}
