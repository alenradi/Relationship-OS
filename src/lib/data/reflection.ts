import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, WeeklyReflectionRow } from "@/lib/database.types";
import { computeStreak, revealStateFor, type RevealState, type StreakSummary, type WeekOverview } from "@/lib/reflection";
import type { CivilDate } from "@/lib/dates";

type Client = SupabaseClient<Database>;

export type ReflectionWeek = {
  weekStart: CivilDate;
  mine: WeeklyReflectionRow | null;
  /** Only ever populated once the week has opened for both of you. */
  theirs: WeeklyReflectionRow | null;
  partnerSubmittedAt: string | null;
  partnerHasDraft: boolean;
  state: RevealState;
  revealedAt: string | null;
};

/**
 * Loads one week for the signed-in user.
 *
 * Two queries on purpose: the table itself (RLS hides the partner's row until
 * the reveal) plus a narrow RPC that returns submission timestamps only. That
 * split is what lets the UI say "she submitted 2 hours ago" without being able
 * to read a single word of what she wrote.
 */
export async function loadReflectionWeek(
  supabase: Client,
  params: {
    coupleId: string;
    userId: string;
    partnerId: string | null;
    weekStart: CivilDate;
  },
): Promise<ReflectionWeek> {
  const { coupleId, userId, partnerId, weekStart } = params;

  const [{ data: rows }, { data: statuses }] = await Promise.all([
    supabase
      .from("weekly_reflections")
      .select("*")
      .eq("couple_id", coupleId)
      .eq("week_start", weekStart),
    supabase.rpc("reflection_submission_status", { p_week: weekStart }),
  ]);

  const mine = (rows ?? []).find((row) => row.user_id === userId) ?? null;
  const theirs =
    partnerId
      ? ((rows ?? []).find((row) => row.user_id === partnerId) ?? null)
      : null;

  const partnerStatus = (statuses ?? []).find(
    (status) => status.user_id !== userId,
  );

  const partnerSubmittedAt = partnerStatus?.submitted_at ?? null;
  const state = revealStateFor(mine, partnerSubmittedAt);

  const revealedAt =
    state === "revealed" && mine?.submitted_at && partnerSubmittedAt
      ? [mine.submitted_at, partnerSubmittedAt].sort().at(-1)!
      : null;

  return {
    weekStart,
    mine,
    theirs: state === "revealed" ? theirs : null,
    partnerSubmittedAt,
    partnerHasDraft: Boolean(partnerStatus?.has_draft),
    state,
    revealedAt,
  };
}

export async function loadWeeksOverview(
  supabase: Client,
): Promise<WeekOverview[]> {
  const { data } = await supabase.rpc("reflection_weeks_overview");
  return data ?? [];
}

export async function loadStreak(
  supabase: Client,
  thisWeekStart: CivilDate,
): Promise<{ streak: StreakSummary; weeks: WeekOverview[] }> {
  const weeks = await loadWeeksOverview(supabase);
  return { streak: computeStreak(weeks, thisWeekStart), weeks };
}
