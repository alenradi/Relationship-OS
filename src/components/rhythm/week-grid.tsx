import { BusyTimeline } from "@/components/rhythm/busy-timeline";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/page";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import type { DailyStatusRow, ProfileRow } from "@/lib/database.types";
import {
  addDays,
  formatDayHeading,
  formatWeekRange,
  weekDays,
} from "@/lib/dates";
import { busyTone } from "@/lib/rhythm";

const scoreTone = {
  open: "bg-sage-soft text-sage-ink border-sage-line",
  steady: "bg-surface-sunken text-ink-soft border-line",
  full: "bg-honey-soft text-honey-ink border-honey-line",
} as const;

/** Seven days, both of you, stacked so the overlap is obvious. */
export function WeekGrid({
  weekStart,
  today,
  statuses,
  me,
  partner,
}: {
  weekStart: string;
  today: string;
  statuses: DailyStatusRow[];
  me: ProfileRow;
  partner: ProfileRow | null;
}) {
  const days = weekDays(weekStart);

  const find = (date: string, userId: string) =>
    statuses.find((row) => row.status_date === date && row.user_id === userId) ??
    null;

  return (
    <section className="space-y-4">
      <SectionHeading
        title={copy.rhythm.weekTitle}
        description={copy.rhythm.weekSubtitle}
        actions={
          <>
            <ButtonLink
              href={`/rhythm?week=${addDays(weekStart, -7)}`}
              variant="secondary"
              size="sm"
            >
              ←
            </ButtonLink>
            <span className="px-1 text-sm text-ink-soft">
              {formatWeekRange(weekStart)}
            </span>
            <ButtonLink
              href={`/rhythm?week=${addDays(weekStart, 7)}`}
              variant="secondary"
              size="sm"
            >
              →
            </ButtonLink>
          </>
        }
      />

      <div className="space-y-3">
        {days.map((date) => {
          const mine = find(date, me.id);
          const theirs = partner ? find(date, partner.id) : null;
          const isToday = date === today;

          return (
            <Card
              key={date}
              tone={isToday ? "accent" : "default"}
              className={cn("space-y-3", isToday && "border-accent-line")}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-ink">
                  {formatDayHeading(date)}
                  {isToday ? (
                    <span className="ml-2 text-xs text-accent-ink">
                      {copy.app.today}
                    </span>
                  ) : null}
                </p>
              </div>

              <div className="space-y-2.5">
                <PersonRow
                  profile={me}
                  status={mine}
                  tone="accent"
                  isSelf
                />
                {partner ? (
                  <PersonRow profile={partner} status={theirs} tone="lilac" />
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function PersonRow({
  profile,
  status,
  tone,
  isSelf = false,
}: {
  profile: ProfileRow;
  status: DailyStatusRow | null;
  tone: "accent" | "lilac";
  isSelf?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <Avatar profile={profile} variant={tone} size="sm" />

      <div className="min-w-0 flex-1">
        {status ? (
          <BusyTimeline blocks={status.busy_blocks} tone={tone} showTicks={false} />
        ) : (
          <p className="text-xs text-ink-faint">{copy.rhythm.noDataForDay}</p>
        )}
      </div>

      <span
        className={cn(
          "tabular inline-flex h-7 w-12 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
          status ? scoreTone[busyTone(status.busy_score)] : "border-dashed border-line text-ink-faint",
        )}
        title={isSelf ? copy.app.you : profile.display_name}
      >
        {status ? `${status.busy_score}` : "—"}
      </span>
    </div>
  );
}
