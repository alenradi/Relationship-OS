"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { copy } from "@/lib/copy";
import type { RuleCategory } from "@/lib/database.types";
import { requireCouple } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type OnboardingRuleInput = {
  category: RuleCategory;
  title: string;
  description: string;
  why_agreed: string;
};

export type OnboardingPayload = {
  displayName: string;
  rules: OnboardingRuleInput[];
};

export type OnboardingResult = { error?: string | null };

const CATEGORIES: RuleCategory[] = [
  "communication",
  "alone_time",
  "boundaries",
  "fighting_fair",
  "other",
];

export async function completeOnboardingAction(
  payload: OnboardingPayload,
): Promise<OnboardingResult> {
  const { couple, user } = await requireCouple({ allowUnonboarded: true });
  const supabase = await createSupabaseServerClient();

  const displayName = payload.displayName.trim();
  if (!displayName) return { error: copy.errors.required };

  const rules = payload.rules
    .map((rule) => ({
      couple_id: couple.id,
      created_by: user.id,
      category: CATEGORIES.includes(rule.category) ? rule.category : "other",
      title: rule.title.trim(),
      description: rule.description.trim(),
      why_agreed: rule.why_agreed.trim(),
    }))
    .filter((rule) => rule.title.length > 0)
    .map((rule, index) => ({ ...rule, sort_order: index }));

  if (rules.length === 0) return { error: copy.onboarding.needAtLeastOne };

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id);

  if (profileError) return { error: profileError.message };

  // Re-running setup (e.g. after a demo reset) should replace, not stack.
  const { error: clearError } = await supabase
    .from("rules")
    .delete()
    .eq("couple_id", couple.id);
  if (clearError) return { error: clearError.message };

  const { error: rulesError } = await supabase.from("rules").insert(rules);
  if (rulesError) return { error: rulesError.message };

  const now = new Date().toISOString();
  const { error: coupleError } = await supabase
    .from("couples")
    .update({ onboarding_completed_at: now, constitution_reviewed_at: now })
    .eq("id", couple.id);

  if (coupleError) return { error: coupleError.message };

  revalidatePath("/", "layout");
  redirect("/");
}
