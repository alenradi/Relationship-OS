"use server";

import { revalidatePath } from "next/cache";

import { copy } from "@/lib/copy";
import type { GoalMilestone, GoalStatus, GoalType } from "@/lib/database.types";
import { displayName } from "@/lib/people";
import { notifyPartner } from "@/lib/push";
import { requireCouple } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type GoalResult = { error?: string | null; id?: string };

export type GoalInput = {
  id?: string;
  goal_type: GoalType;
  title: string;
  why_it_matters: string;
  reward_description?: string;
  target_date?: string | null;
  status: GoalStatus;
  milestones: GoalMilestone[];
};

const STATUSES: GoalStatus[] = ["active", "achieved", "paused", "archived"];

function refresh() {
  revalidatePath("/goals");
  revalidatePath("/");
}

function normalizeMilestones(raw: GoalMilestone[]): GoalMilestone[] {
  return raw
    .map((m) => ({
      id: m.id || crypto.randomUUID(),
      title: m.title.trim(),
      done: Boolean(m.done),
      due: m.due?.trim() || null,
    }))
    .filter((m) => m.title.length > 0);
}

export async function saveGoalAction(input: GoalInput): Promise<GoalResult> {
  const { couple, user } = await requireCouple();
  const supabase = await createSupabaseServerClient();

  const title = input.title.trim();
  if (!title) return { error: copy.errors.required };

  const goal_type: GoalType =
    input.goal_type === "relationship" ? "relationship" : "personal";
  const owner_id = goal_type === "relationship" ? null : user.id;
  const status = STATUSES.includes(input.status) ? input.status : "active";

  const values = {
    title,
    why_it_matters: input.why_it_matters.trim(),
    reward_description: (input.reward_description ?? "").trim(),
    goal_type,
    owner_id,
    target_date: input.target_date?.trim() || null,
    status,
    milestones: normalizeMilestones(input.milestones),
  };

  if (input.id) {
    const { error } = await supabase
      .from("goals")
      .update(values)
      .eq("id", input.id);
    if (error) return { error: error.message };
    refresh();
    return { id: input.id };
  }

  const { data, error } = await supabase
    .from("goals")
    .insert({
      ...values,
      couple_id: couple.id,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? copy.errors.generic };
  refresh();
  return { id: data.id };
}

export async function deleteGoalAction(id: string): Promise<GoalResult> {
  await requireCouple();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) return { error: error.message };
  refresh();
  return {};
}

export async function toggleMilestoneAction(
  goalId: string,
  milestoneId: string,
): Promise<GoalResult> {
  await requireCouple();
  const supabase = await createSupabaseServerClient();

  const { data: goal, error: fetchError } = await supabase
    .from("goals")
    .select("milestones")
    .eq("id", goalId)
    .maybeSingle();

  if (fetchError || !goal) return { error: copy.errors.notFound };

  const milestones = (goal.milestones as GoalMilestone[]).map((m) =>
    m.id === milestoneId ? { ...m, done: !m.done } : m,
  );

  const { error } = await supabase
    .from("goals")
    .update({ milestones })
    .eq("id", goalId);

  if (error) return { error: error.message };
  refresh();
  return {};
}

export async function addProgressUpdateAction(
  goalId: string,
  body: string,
  progressPercent: number | null,
): Promise<GoalResult> {
  const { couple, user } = await requireCouple();
  const supabase = await createSupabaseServerClient();

  const trimmed = body.trim();
  if (!trimmed) return { error: copy.errors.required };

  let percent: number | null = null;
  if (progressPercent !== null && progressPercent !== undefined) {
    const rounded = Math.round(progressPercent);
    if (Number.isFinite(rounded) && rounded >= 0 && rounded <= 100) {
      percent = rounded;
    }
  }

  const { error } = await supabase.from("goal_updates").insert({
    goal_id: goalId,
    couple_id: couple.id,
    author_id: user.id,
    body: trimmed,
    progress_percent: percent,
  });

  if (error) return { error: error.message };
  refresh();
  return {};
}

export async function sendCheerAction(
  goalId: string,
  message: string,
): Promise<GoalResult> {
  const { couple, user, partner } = await requireCouple();
  const supabase = await createSupabaseServerClient();

  if (!partner) return { error: copy.errors.generic };

  const { data: goal, error: fetchError } = await supabase
    .from("goals")
    .select("owner_id")
    .eq("id", goalId)
    .maybeSingle();

  if (fetchError || !goal) return { error: copy.errors.notFound };
  if (goal.owner_id !== partner.id) {
    return { error: copy.goals.cheerOwnGoalNote };
  }

  const { error } = await supabase.from("goal_cheers").insert({
    goal_id: goalId,
    couple_id: couple.id,
    from_user: user.id,
    message: message.trim(),
  });

  if (error) return { error: error.message };
  refresh();
  return {};
}

export async function markAchievedAction(goalId: string): Promise<GoalResult> {
  const { partner, profile } = await requireCouple();
  const supabase = await createSupabaseServerClient();

  const { data: goal, error } = await supabase
    .from("goals")
    .update({ status: "achieved" })
    .eq("id", goalId)
    .select("title")
    .maybeSingle();

  if (error) return { error: error.message };
  if (goal?.title) {
    await notifyPartner(partner?.id, {
      title: copy.push.goalAchievedTitle,
      body: copy.push.goalAchievedBody(displayName(profile), goal.title),
      url: "/goals",
    });
  }
  refresh();
  return {};
}
