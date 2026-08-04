import { ConstitutionReviewBanner } from "@/components/constitution/review-banner";
import { ChevronRightIcon, SparkIcon } from "@/components/icons";
import { ReflectionNudge } from "@/components/reflection/reflection-nudge";
import { DayCard } from "@/components/rhythm/day-card";
import { DayEditorButton } from "@/components/rhythm/day-editor";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { SectionHeading } from "@/components/ui/page";
import {
  isConstitutionReviewDue,
  reviewMonthsDue,
} from "@/lib/constitution";
import { copy } from "@/lib/copy";
import { loadReflectionWeek, loadStreak } from "@/lib/data/reflection";
import {
  currentWeekStart,
  formatLongDate,
  formatMediumDate,
  hourInAppTz,
  isReflectionPromptDay,
  isReflectionWeekWritable,
  previousWeekStart,
  todayInAppTz,
} from "@/lib/dates";
import { pickCelebration } from "@/lib/celebrations";
import { primaryNav } from "@/lib/nav";
import { displayName } from "@/lib/people";
import { summarizeTogether } from "@/lib/rhythm";
import { requireCouple } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { nextUpcoming } from "@/lib/upcoming";

export default async function DashboardPage() {
  const { couple, user, profile, partner } = await requireCouple();
  const supabase = await createSupabaseServerClient();

  const today = todayInAppTz();
  const weekStart = currentWeekStart();
  const monthStart = `${today.slice(0, 7)}-01`;

  const [
    { data: todayStatuses },
    week,
    { streak, weeks },
    { data: milestones },
    { data: trips },
    { count: cheersThisMonth },
    { count: goalsAchievedThisMonth },
    { count: datesDone },
    { count: followUpsWorked },
    { count: activeRules },
    { data: monthStatuses },
  ] = await Promise.all([
    supabase
      .from("daily_status")
      .select("*")
      .eq("couple_id", couple.id)
      .eq("status_date", today),
    loadReflectionWeek(supabase, {
      coupleId: couple.id,
      userId: user.id,
      partnerId: partner?.id ?? null,
      weekStart,
    }),
    loadStreak(supabase, weekStart),
    supabase.from("milestones").select("*").eq("couple_id", couple.id),
    supabase.from("trips").select("*").eq("couple_id", couple.id),
    supabase
      .from("goal_cheers")
      .select("id", { count: "exact", head: true })
      .eq("couple_id", couple.id)
      .gte("created_at", monthStart),
    supabase
      .from("couple_events")
      .select("id", { count: "exact", head: true })
      .eq("couple_id", couple.id)
      .eq("kind", "goal_achieved")
      .gte("created_at", monthStart),
    supabase
      .from("date_ideas")
      .select("id", { count: "exact", head: true })
      .eq("couple_id", couple.id)
      .eq("status", "done"),
    supabase
      .from("conflicts")
      .select("id", { count: "exact", head: true })
      .eq("couple_id", couple.id)
      .eq("follow_up_status", "worked"),
    supabase
      .from("rules")
      .select("id", { count: "exact", head: true })
      .eq("couple_id", couple.id)
      .eq("status", "active"),
    supabase
      .from("daily_status")
      .select("status_date,user_id")
      .eq("couple_id", couple.id)
      .gte("status_date", monthStart),
  ]);

  const mine = (todayStatuses ?? []).find((row) => row.user_id === user.id) ?? null;
  const theirs = partner
    ? ((todayStatuses ?? []).find((row) => row.user_id === partner.id) ?? null)
    : null;

  const together = summarizeTogether(mine, partner, theirs);

  // Days this month where both of you logged something.
  const perDay = new Map<string, Set<string>>();
  for (const row of monthStatuses ?? []) {
    const set = perDay.get(row.status_date) ?? new Set<string>();
    set.add(row.user_id);
    perDay.set(row.status_date, set);
  }
  const rhythmDaysBothLogged = [...perDay.values()].filter(
    (set) => set.size >= 2,
  ).length;

  const celebration = pickCelebration({
    reflectionStreak: streak.current,
    reflectionsRevealed: weeks.filter((w) => w.both_submitted).length,
    cheersThisMonth: cheersThisMonth ?? 0,
    goalsAchievedThisMonth: goalsAchievedThisMonth ?? 0,
    datesDone: datesDone ?? 0,
    followUpsWorked: followUpsWorked ?? 0,
    activeRules: activeRules ?? 0,
    rhythmDaysBothLogged,
  });

  const upcoming = nextUpcoming(milestones ?? [], trips ?? [], today);

  const hour = hourInAppTz();
  const greeting =
    hour < 12
      ? copy.dashboard.greetingMorning(displayName(profile, ""))
      : hour < 18
        ? copy.dashboard.greetingAfternoon(displayName(profile, ""))
        : copy.dashboard.greetingEvening(displayName(profile, ""));

  const monthsSinceReview = reviewMonthsDue(couple);
  const showReviewBanner = isConstitutionReviewDue(couple);
  const sundayPrompt = isReflectionPromptDay(today) && week.state !== "revealed";

  // On Mon/Tue, prefer last week's reflection if you still haven't finished it.
  let nudgeWeek = week;
  let nudgeWeekStart = weekStart;
  const lateWeekStart = previousWeekStart();
  if (
    (week.state === "empty" || week.state === "revealed") &&
    lateWeekStart !== weekStart
  ) {
    const lateWeek = await loadReflectionWeek(supabase, {
      coupleId: couple.id,
      userId: user.id,
      partnerId: partner?.id ?? null,
      weekStart: lateWeekStart,
    });
    if (
      lateWeek.state === "draft" ||
      lateWeek.state === "waiting_for_you" ||
      lateWeek.state === "waiting_for_partner" ||
      lateWeek.state === "empty"
    ) {
      if (isReflectionWeekWritable(lateWeekStart, today)) {
        nudgeWeek = lateWeek;
        nudgeWeekStart = lateWeekStart;
      }
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl">{greeting}</h1>
        <p className="text-sm text-ink-soft">
          {copy.dashboard.subtitle} · {formatLongDate(today)}
        </p>
      </header>

      {!partner ? (
        <Notice tone="honey">
          <p className="font-medium text-ink">
            {copy.pairing.waitingBannerTitle}
          </p>
          <p className="mt-1 text-sm">
            {copy.pairing.waitingBannerBody(couple.invite_code)}
          </p>
        </Notice>
      ) : null}

      {showReviewBanner ? (
        <ConstitutionReviewBanner
          months={
            Number.isFinite(monthsSinceReview)
              ? Math.max(1, monthsSinceReview)
              : 1
          }
        />
      ) : null}

      {sundayPrompt ? (
        <Notice tone="lilac">
          <p className="font-medium text-ink">{copy.reflection.sundayTitle}</p>
          <p className="mt-1 text-sm">{copy.reflection.sundayBody}</p>
        </Notice>
      ) : null}

      <section className="space-y-4">
        <SectionHeading
          title={copy.dashboard.todaysRhythm}
          actions={
            <>
              <DayEditorButton date={today} status={mine} size="sm" />
              <ButtonLink href="/rhythm" variant="secondary" size="sm">
                {copy.dashboard.viewFullRhythm}
              </ButtonLink>
            </>
          }
        />

        {together ? <Notice tone="lilac">{together}</Notice> : null}

        <div className="grid gap-4 md:grid-cols-2">
          <DayCard profile={profile} status={mine} isSelf />
          <DayCard profile={partner} status={theirs} />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReflectionNudge
          weekStart={nudgeWeekStart}
          state={nudgeWeek.state}
          partner={partner}
          revealedAt={nudgeWeek.revealedAt}
        />

        <div className="grid gap-4">
          <Card className="space-y-2">
            <CardTitle as="h2" className="text-base">
              {copy.dashboard.upcomingTitle}
            </CardTitle>

            {upcoming ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-ink text-pretty">
                  {upcoming.title}
                </p>
                <p className="text-xs text-ink-soft">
                  {copy.future.inDays(upcoming.daysAway)} ·{" "}
                  {formatMediumDate(upcoming.date)}
                  {upcoming.detail ? ` · ${upcoming.detail}` : ""}
                </p>
              </div>
            ) : (
              <CardDescription>{copy.dashboard.upcomingEmpty}</CardDescription>
            )}

            <ButtonLink
              href="/future"
              variant="quiet"
              className="self-start text-xs"
            >
              {copy.nav.future}
            </ButtonLink>
          </Card>

          <Card tone={celebration ? "sage" : "muted"} className="space-y-2">
            <div className="flex items-center gap-2">
              <SparkIcon
                className={`size-5 ${celebration ? "text-sage" : "text-ink-faint"}`}
              />
              <CardTitle as="h2" className="text-base">
                {copy.dashboard.celebrationTitle}
              </CardTitle>
            </div>

            <p className="text-sm leading-relaxed text-ink text-pretty">
              {celebration
                ? celebration.message
                : copy.dashboard.celebrationEmpty}
            </p>
          </Card>
        </div>
      </div>

      <section className="space-y-3">
        <SectionHeading title={copy.dashboard.quickLinks} />
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {primaryNav
            .filter((item) => item.href !== "/")
            .map((item) => {
              const Icon = item.icon;
              return (
                <ButtonLink
                  key={item.href}
                  href={item.href}
                  variant="secondary"
                  className="h-auto w-full justify-start gap-3 rounded-2xl px-4 py-3.5"
                >
                  <Icon className="size-5 shrink-0 text-accent" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronRightIcon className="size-4 shrink-0 text-ink-faint" />
                </ButtonLink>
              );
            })}
        </div>
      </section>
    </div>
  );
}
