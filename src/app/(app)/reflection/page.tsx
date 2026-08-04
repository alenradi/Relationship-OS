import Link from "next/link";

import { PartnerStatusCard } from "@/components/reflection/partner-status";
import { StreakCard } from "@/components/reflection/streak-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { EmptyState, PageHeader, SectionHeading } from "@/components/ui/page";
import { copy } from "@/lib/copy";
import { loadReflectionWeek, loadStreak } from "@/lib/data/reflection";
import {
  currentWeekStart,
  formatTimeAgo,
  formatWeekRange,
  isReflectionWeekWritable,
  previousWeekStart,
  todayInAppTz,
} from "@/lib/dates";
import { requireCouple } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { ReflectionForm } from "./reflection-form";
import { RevealPanel } from "./reveal-panel";

export const metadata = { title: copy.reflection.title };

export default async function ReflectionPage() {
  const { couple, user, profile, partner } = await requireCouple();
  const supabase = await createSupabaseServerClient();

  const today = todayInAppTz();
  const weekStart = currentWeekStart();
  const lateWeekStart = previousWeekStart();

  const [currentWeek, lateWeek, { streak, weeks }] = await Promise.all([
    loadReflectionWeek(supabase, {
      coupleId: couple.id,
      userId: user.id,
      partnerId: partner?.id ?? null,
      weekStart,
    }),
    loadReflectionWeek(supabase, {
      coupleId: couple.id,
      userId: user.id,
      partnerId: partner?.id ?? null,
      weekStart: lateWeekStart,
    }),
    loadStreak(supabase, weekStart),
  ]);

  // Prefer finishing last week during the Mon/Tue grace window.
  const useLateWeek =
    isReflectionWeekWritable(lateWeekStart, today) &&
    lateWeek.state !== "revealed" &&
    (lateWeek.state === "draft" ||
      lateWeek.state === "empty" ||
      lateWeek.state === "waiting_for_you" ||
      lateWeek.state === "waiting_for_partner") &&
    currentWeek.state !== "waiting_for_partner";

  const activeWeekStart = useLateWeek ? lateWeekStart : weekStart;
  const week = useLateWeek ? lateWeek : currentWeek;
  const writable = isReflectionWeekWritable(activeWeekStart, today);

  const revealed = week.state === "revealed" && week.mine && week.theirs;
  const pastWeeks = weeks.filter((w) => w.week_start !== activeWeekStart);

  return (
    <div className="space-y-10">
      <PageHeader
        title={copy.reflection.title}
        description={copy.reflection.subtitle}
        actions={
          <Badge tone="lilac">
            {copy.reflection.weekOf(formatWeekRange(activeWeekStart))}
          </Badge>
        }
      />

      <StreakCard streak={streak} />

      {useLateWeek ? (
        <Notice tone="honey">{copy.reflection.lateWindowNotice}</Notice>
      ) : null}

      {revealed ? (
        <section className="space-y-4">
          <SectionHeading
            title={copy.reflection.revealedTitle}
            description={
              week.revealedAt
                ? copy.reflection.revealedBody(formatTimeAgo(week.revealedAt))
                : undefined
            }
          />
          <p className="text-xs text-ink-faint">{copy.reflection.lockedNote}</p>
          <RevealPanel
            mine={week.mine!}
            theirs={week.theirs!}
            me={profile}
            partner={partner}
          />
        </section>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
          {writable ? (
            <ReflectionForm
              weekStart={activeWeekStart}
              existing={week.mine}
              submitted={Boolean(week.mine?.submitted_at)}
            />
          ) : (
            <Card className="space-y-2 p-5">
              <p className="text-sm text-ink-soft">
                {copy.reflection.closedWeekNotice}
              </p>
            </Card>
          )}

          <div className="space-y-4 lg:sticky lg:top-6">
            <PartnerStatusCard
              state={week.state}
              partner={partner}
              partnerSubmittedAt={week.partnerSubmittedAt}
              partnerHasDraft={week.partnerHasDraft}
            />
          </div>
        </div>
      )}

      <section className="space-y-4">
        <SectionHeading title={copy.reflection.historyTitle} />
        {pastWeeks.length === 0 ? (
          <EmptyState title={copy.reflection.historyEmpty} />
        ) : (
          <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
            {pastWeeks.map((entry) => (
              <li key={entry.week_start}>
                <Link
                  href={`/reflection/${entry.week_start}`}
                  className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-surface-muted"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-ink">
                      {formatWeekRange(entry.week_start)}
                    </p>
                    <p className="text-xs text-ink-faint">
                      {entry.both_submitted
                        ? copy.reflection.streakBoth
                        : entry.submitted_count === 1
                          ? copy.reflection.historyIncomplete
                          : copy.reflection.historyWaiting}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-accent">
                    {copy.reflection.historyOpen}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
