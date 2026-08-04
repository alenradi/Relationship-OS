"use server";

import { revalidatePath } from "next/cache";

import { copy } from "@/lib/copy";
import type { ConflictRow, FollowUpStatus } from "@/lib/database.types";
import { requireCouple } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ConflictResult = { error?: string | null };

export type ConflictInput = {
  id?: string;
  title: string;
  happened_on?: string | null;
  what_it_was_about: string;
  perspective_a: string;
  perspective_b: string;
  trigger_note: string;
  resolution: string;
  agreed_action: string;
  follow_up_date?: string | null;
};

const FOLLOW_UP_STATUSES: FollowUpStatus[] = [
  "pending",
  "worked",
  "partly",
  "didnt_work",
];

function refresh() {
  revalidatePath("/conflicts");
  revalidatePath("/");
}

export async function saveConflictAction(
  input: ConflictInput,
): Promise<ConflictResult> {
  const { couple, user, partner } = await requireCouple();
  const supabase = await createSupabaseServerClient();

  const title = input.title.trim();
  if (!title) return { error: copy.errors.required };

  const base = {
    title,
    happened_on: input.happened_on?.trim() || null,
    what_it_was_about: input.what_it_was_about.trim(),
    trigger_note: input.trigger_note.trim(),
    resolution: input.resolution.trim(),
    agreed_action: input.agreed_action.trim(),
    follow_up_date: input.follow_up_date?.trim() || null,
  };

  if (input.id) {
    const { data: existing, error: fetchError } = await supabase
      .from("conflicts")
      .select("perspective_a_user, perspective_b_user")
      .eq("id", input.id)
      .maybeSingle();

    if (fetchError || !existing) return { error: copy.errors.notFound };

    const patch: Partial<ConflictRow> = { ...base };

    if (existing.perspective_a_user === user.id) {
      patch.perspective_a = input.perspective_a.trim();
    } else if (existing.perspective_b_user === user.id) {
      patch.perspective_b = input.perspective_b.trim();
    }

    const { error } = await supabase
      .from("conflicts")
      .update(patch)
      .eq("id", input.id);

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("conflicts").insert({
      ...base,
      couple_id: couple.id,
      created_by: user.id,
      perspective_a_user: user.id,
      perspective_a: input.perspective_a.trim(),
      perspective_b_user: partner?.id ?? null,
      perspective_b: input.perspective_b.trim(),
      follow_up_status: "pending",
      follow_up_note: "",
    });

    if (error) return { error: error.message };
  }

  refresh();
  return {};
}

export async function saveFollowUpAction(input: {
  id: string;
  follow_up_status: FollowUpStatus;
  follow_up_note: string;
}): Promise<ConflictResult> {
  const supabase = await createSupabaseServerClient();

  if (
    !FOLLOW_UP_STATUSES.includes(input.follow_up_status) ||
    input.follow_up_status === "pending"
  ) {
    return { error: copy.errors.generic };
  }

  const { error } = await supabase
    .from("conflicts")
    .update({
      follow_up_status: input.follow_up_status,
      follow_up_note: input.follow_up_note.trim(),
    })
    .eq("id", input.id);

  if (error) return { error: error.message };

  refresh();
  return {};
}
