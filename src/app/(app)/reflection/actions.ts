"use server";

import { revalidatePath } from "next/cache";

import { copy } from "@/lib/copy";
import type { ReflectionAnswers } from "@/lib/database.types";
import { isReflectionWeekWritable } from "@/lib/dates";
import {
  RATING_MAX,
  RATING_MIN,
  isComplete,
  ratingQuestions,
  textPrompts,
} from "@/lib/reflection";
import { requireCouple } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ReflectionResult = { error?: string | null; ok?: boolean };

export type ReflectionInput = {
  week_start: string;
  answers: ReflectionAnswers;
  journal: string;
};

/**
 * Only keys the questionnaire actually defines are stored, so a tampered
 * payload cannot stuff arbitrary data into the jsonb column.
 */
function sanitizeAnswers(answers: ReflectionAnswers): ReflectionAnswers {
  const clean: ReflectionAnswers = {};

  for (const question of ratingQuestions) {
    const raw = answers[question.id];
    if (raw === null || raw === undefined || raw === "") continue;
    const value = Math.round(Number(raw));
    if (!Number.isFinite(value)) continue;
    clean[question.id] = Math.min(RATING_MAX, Math.max(RATING_MIN, value));
  }

  for (const prompt of textPrompts) {
    const raw = answers[prompt.id];
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim();
    if (trimmed) clean[prompt.id] = trimmed.slice(0, 4000);
  }

  return clean;
}

async function persist(input: ReflectionInput, submit: boolean) {
  const { couple, user } = await requireCouple();
  const supabase = await createSupabaseServerClient();

  // Current week always; previous week only Mon/Tue (1–2 days late).
  if (!isReflectionWeekWritable(input.week_start)) {
    return { error: copy.reflection.closedWeekNotice };
  }

  const answers = sanitizeAnswers(input.answers);

  if (submit && !isComplete(answers)) {
    return { error: copy.errors.required };
  }

  const { error } = await supabase.from("weekly_reflections").upsert(
    {
      couple_id: couple.id,
      user_id: user.id,
      week_start: input.week_start,
      answers,
      journal: input.journal.trim().slice(0, 20000),
      ...(submit ? { submitted_at: new Date().toISOString() } : {}),
    },
    { onConflict: "user_id,week_start" },
  );

  if (error) {
    // The update policy refuses writes once a week has opened.
    if (error.code === "42501") {
      return { error: copy.reflection.lockedNote };
    }
    return { error: error.message };
  }

  revalidatePath("/reflection");
  revalidatePath("/");
  return { ok: true };
}

export async function saveReflectionDraftAction(
  input: ReflectionInput,
): Promise<ReflectionResult> {
  return persist(input, false);
}

export async function submitReflectionAction(
  input: ReflectionInput,
): Promise<ReflectionResult> {
  return persist(input, true);
}
