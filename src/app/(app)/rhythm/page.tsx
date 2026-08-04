import { DayCard } from "@/components/rhythm/day-card";
import { DayEditorButton } from "@/components/rhythm/day-editor";
import { WeekGrid } from "@/components/rhythm/week-grid";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { PageHeader, SectionHeading } from "@/components/ui/page";
import { copy } from "@/lib/copy";
import {
  currentWeekStart,
  todayInAppTz,
  weekEndOf,
  weekStartOf,
} from "@/lib/dates";
import { requireCouple } from "@/lib/session";
import { summarizeTogether } from "@/lib/rhythm";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: copy.rhythm.title };

export default async function RhythmPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { couple, user, profile, partner } = await requireCouple();
  const { week } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const today = todayInAppTz();
  const weekStart = /^\d{4}-\d{2}-\d{2}$/.test(week ?? "")
    ? weekStartOf(week!)
    : currentWeekStart();

  const { data: statuses } = await supabase
    .from("daily_status")
    .select("*")
    .eq("couple_id", couple.id)
    .gte("status_date", weekStart)
    .lte("status_date", weekEndOf(weekStart))
    .order("status_date", { ascending: true });

  const rows = statuses ?? [];

  // Today's rows may sit outside the week being browsed, so fetch separately
  // when the user has navigated away from the current week.
  const todayInWeek = today >= weekStart && today <= weekEndOf(weekStart);
  const todayRows = todayInWeek
    ? rows.filter((row) => row.status_date === today)
    : ((
        await supabase
          .from("daily_status")
          .select("*")
          .eq("couple_id", couple.id)
          .eq("status_date", today)
      ).data ?? []);

  const mine = todayRows.find((row) => row.user_id === user.id) ?? null;
  const theirs = partner
    ? (todayRows.find((row) => row.user_id === partner.id) ?? null)
    : null;

  const together = summarizeTogether(mine, partner, theirs);

  return (
    <div className="space-y-10">
      <PageHeader
        title={copy.rhythm.title}
        description={copy.rhythm.subtitle}
        actions={<DayEditorButton date={today} status={mine} />}
      />

      <section className="space-y-4">
        <SectionHeading title={copy.dashboard.todaysRhythm} />

        {together ? <Notice tone="lilac">{together}</Notice> : null}

        <div className="grid gap-4 md:grid-cols-2">
          <DayCard
            profile={profile}
            status={mine}
            isSelf
            action={
              <DayEditorButton
                date={today}
                status={mine}
                variant="secondary"
                size="sm"
              />
            }
          />
          <DayCard profile={partner} status={theirs} />
        </div>

        {!theirs && partner ? (
          <Card tone="muted" className="text-sm text-ink-soft">
            {copy.rhythm.notLoggedYet(partner.display_name)}
          </Card>
        ) : null}
      </section>

      <WeekGrid
        weekStart={weekStart}
        today={today}
        statuses={rows}
        me={profile}
        partner={partner}
      />
    </div>
  );
}
