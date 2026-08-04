"use server";

import { revalidatePath } from "next/cache";

import { isConstitutionEditable } from "@/lib/constitution";
import { copy } from "@/lib/copy";
import type { RuleCategory, RuleStatus } from "@/lib/database.types";
import { requireCouple } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type RuleResult = { error?: string | null };

export type RuleInput = {
  id?: string;
  title: string;
  description: string;
  why_agreed: string;
  category: RuleCategory;
  status: RuleStatus;
  change_note?: string;
};

const CATEGORIES: RuleCategory[] = [
  "communication",
  "alone_time",
  "boundaries",
  "fighting_fair",
  "other",
];
const STATUSES: RuleStatus[] = ["active", "renegotiated", "retired"];

function normalize(input: RuleInput) {
  return {
    title: input.title.trim(),
    description: input.description.trim(),
    why_agreed: input.why_agreed.trim(),
    category: CATEGORIES.includes(input.category) ? input.category : "other",
    status: STATUSES.includes(input.status) ? input.status : "active",
    change_note: (input.change_note ?? "").trim(),
  };
}

function refresh() {
  revalidatePath("/constitution");
  revalidatePath("/constitution/history");
  revalidatePath("/");
}

export async function saveRuleAction(input: RuleInput): Promise<RuleResult> {
  const { couple, user } = await requireCouple();

  if (!isConstitutionEditable(couple)) {
    return { error: copy.constitution.lockedNotice };
  }

  const supabase = await createSupabaseServerClient();

  const values = normalize(input);
  if (!values.title) return { error: copy.errors.required };

  if (input.id) {
    const { error } = await supabase
      .from("rules")
      .update(values)
      .eq("id", input.id);

    if (error) return { error: error.message };
  } else {
    const { count } = await supabase
      .from("rules")
      .select("id", { count: "exact", head: true })
      .eq("couple_id", couple.id);

    const { error } = await supabase.from("rules").insert({
      ...values,
      couple_id: couple.id,
      created_by: user.id,
      sort_order: count ?? 0,
    });

    if (error) return { error: error.message };
  }

  refresh();
  return {};
}

export async function deleteRuleAction(id: string): Promise<RuleResult> {
  const { couple } = await requireCouple();

  if (!isConstitutionEditable(couple)) {
    return { error: copy.constitution.lockedNotice };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("rules").delete().eq("id", id);
  if (error) return { error: error.message };

  refresh();
  return {};
}

/** Closes the monthly review window and resets the 30-day timer. */
export async function markConstitutionReviewedAction(): Promise<RuleResult> {
  const { couple } = await requireCouple();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("couples")
    .update({ constitution_reviewed_at: new Date().toISOString() })
    .eq("id", couple.id);

  if (error) return { error: error.message };

  refresh();
  return {};
}
