import { copy } from "@/lib/copy";
import type { ReflectionAnswers, WeeklyReflectionRow } from "@/lib/database.types";
import { addDays, type CivilDate } from "@/lib/dates";

export const ratingQuestions = copy.reflectionRatings;
export const textPrompts = copy.reflectionPrompts;

export type RatingQuestion = (typeof ratingQuestions)[number];
export type TextPrompt = (typeof textPrompts)[number];

export const RATING_MIN = 1;
export const RATING_MAX = 10;

export function readRating(
  answers: ReflectionAnswers | null | undefined,
  id: string,
): number | null {
  const raw = answers?.[id];
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim() !== "") {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function readText(
  answers: ReflectionAnswers | null | undefined,
  id: string,
): string {
  const raw = answers?.[id];
  return typeof raw === "string" ? raw : "";
}

/** A reflection counts as complete when every rating has a value. */
export function isComplete(answers: ReflectionAnswers | null | undefined): boolean {
  return ratingQuestions.every((q) => {
    const value = readRating(answers, q.id);
    return value !== null && value >= RATING_MIN && value <= RATING_MAX;
  });
}

// -----------------------------------------------------------------------------
// Discussion agenda
// -----------------------------------------------------------------------------

export type AgendaItem = {
  id: string;
  label: string;
  kind: "gap" | "both_low" | "both_high";
  emphasis: "high" | "low";
  headline: string;
  detail: string | null;
  mine: number | null;
  theirs: number | null;
};

/**
 * Turns two sets of answers into a short talking list, ordered so the widest
 * disagreement is first.
 *
 * This is descriptive, not judgemental: it says "you two saw this differently",
 * never "one of you is wrong" and never a combined score.
 */
export function buildAgenda(
  mineAnswers: ReflectionAnswers,
  theirsAnswers: ReflectionAnswers,
  partnerName = "your partner",
): AgendaItem[] {
  const items: AgendaItem[] = [];

  for (const question of ratingQuestions) {
    const mine = readRating(mineAnswers, question.id);
    const theirs = readRating(theirsAnswers, question.id);

    if (mine === null || theirs === null) continue;

    const gap = Math.abs(mine - theirs);

    if (gap >= 2) {
      items.push({
        id: question.id,
        label: question.label,
        kind: "gap",
        emphasis: gap >= 3 ? "high" : "low",
        headline: copy.reflection.agendaRatingGap(
          question.label,
          String(mine),
          partnerName,
          String(theirs),
        ),
        detail: copy.reflection.agendaTalkAbout,
        mine,
        theirs,
      });
      continue;
    }

    // Aligned — but agreeing that something was bad is still worth a talk.
    if (mine <= 4 && theirs <= 4) {
      items.push({
        id: question.id,
        label: question.label,
        kind: "both_low",
        emphasis: "high",
        headline: copy.reflection.agendaBothLow(question.label),
        detail: copy.reflection.agendaTalkAbout,
        mine,
        theirs,
      });
      continue;
    }

    if (mine >= 8 && theirs >= 8) {
      items.push({
        id: question.id,
        label: question.label,
        kind: "both_high",
        emphasis: "low",
        headline: copy.reflection.agendaBothHigh(question.label),
        detail: null,
        mine,
        theirs,
      });
    }
  }

  const rank = (item: AgendaItem) => {
    if (item.kind === "gap" && item.emphasis === "high") return 0;
    if (item.kind === "both_low") return 1;
    if (item.kind === "gap") return 2;
    return 3;
  };

  return items.sort((a, b) => {
    const byRank = rank(a) - rank(b);
    if (byRank !== 0) return byRank;
    const gapA = Math.abs((a.mine ?? 0) - (a.theirs ?? 0));
    const gapB = Math.abs((b.mine ?? 0) - (b.theirs ?? 0));
    return gapB - gapA;
  });
}

/** Only the items that actually need discussing. */
export function agendaNeedsAttention(items: AgendaItem[]): AgendaItem[] {
  return items.filter((item) => item.kind !== "both_high");
}

// -----------------------------------------------------------------------------
// Shared streak
// -----------------------------------------------------------------------------

export type WeekOverview = {
  week_start: string;
  submitted_count: number;
  both_submitted: boolean;
  revealed_at: string | null;
};

export type StreakSummary = {
  current: number;
  best: number;
  includesCurrentWeek: boolean;
};

/**
 * Consecutive weeks where *both* of you completed the reflection.
 *
 * The current week not being finished yet does not break the streak — it is
 * still in progress — so the count is anchored at this week if it is done and
 * last week otherwise.
 */
export function computeStreak(
  weeks: WeekOverview[],
  thisWeekStart: CivilDate,
): StreakSummary {
  const completed = new Set(
    weeks.filter((w) => w.both_submitted).map((w) => w.week_start),
  );

  const includesCurrentWeek = completed.has(thisWeekStart);

  let current = 0;
  let cursor = includesCurrentWeek ? thisWeekStart : addDays(thisWeekStart, -7);
  while (completed.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -7);
  }

  // Longest run anywhere in the history.
  const ordered = [...completed].sort();
  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const week of ordered) {
    run = previous !== null && addDays(previous, 7) === week ? run + 1 : 1;
    best = Math.max(best, run);
    previous = week;
  }

  return { current, best: Math.max(best, current), includesCurrentWeek };
}

// -----------------------------------------------------------------------------
// Reveal state
// -----------------------------------------------------------------------------

export type RevealState =
  | "empty" // neither of you has started
  | "draft" // you have a draft, not submitted
  | "waiting_for_partner" // you submitted, they haven't
  | "waiting_for_you" // they submitted, you haven't
  | "revealed"; // both submitted

export function revealStateFor(
  mine: Pick<WeeklyReflectionRow, "submitted_at"> | null,
  partnerSubmittedAt: string | null,
): RevealState {
  const iSubmitted = Boolean(mine?.submitted_at);
  const theySubmitted = Boolean(partnerSubmittedAt);

  if (iSubmitted && theySubmitted) return "revealed";
  if (iSubmitted) return "waiting_for_partner";
  if (theySubmitted) return "waiting_for_you";
  if (mine) return "draft";
  return "empty";
}
