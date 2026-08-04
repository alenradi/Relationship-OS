"use server";

import { revalidatePath } from "next/cache";

import { copy } from "@/lib/copy";
import type { BusyBlock } from "@/lib/database.types";
import { todayInAppTz } from "@/lib/dates";
import { requireCouple } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DailyStatusResult = { error?: string | null };

export type DailyStatusInput = {
  status_date: string;
  busy_score: number;
  note: string;
  busy_blocks: BusyBlock[];
};

export async function saveDailyStatusAction(
  input: DailyStatusInput,
): Promise<DailyStatusResult> {
  const { couple, user } = await requireCouple();
  const supabase = await createSupabaseServerClient();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.status_date)) {
    return { error: copy.errors.generic };
  }

  // Past (and future) days are read-only — only today's civil date is writable.
  if (input.status_date !== todayInAppTz()) {
    return { error: copy.rhythm.onlyToday };
  }

  const score = Math.round(input.busy_score);
  if (!Number.isFinite(score) || score < 1 || score > 10) {
    return { error: copy.errors.generic };
  }

  const blocks: BusyBlock[] = [];
  for (const block of input.busy_blocks) {
    const label = block.label.trim();
    if (!label) continue;
    blocks.push({ label: label.slice(0, 200) });
  }

  const { error } = await supabase.from("daily_status").upsert(
    {
      couple_id: couple.id,
      user_id: user.id,
      status_date: input.status_date,
      busy_score: score,
      note: input.note.trim(),
      busy_blocks: blocks,
    },
    { onConflict: "user_id,status_date" },
  );

  if (error) return { error: error.message };

  revalidatePath("/rhythm");
  revalidatePath("/");
  return {};
}
