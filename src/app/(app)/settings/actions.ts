"use server";

import { revalidatePath } from "next/cache";

import { copy } from "@/lib/copy";
import { requireCouple } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ProfileResult = { error?: string | null; ok?: boolean };

export async function updateProfileAction(input: {
  displayName: string;
}): Promise<ProfileResult> {
  const { user } = await requireCouple();
  const supabase = await createSupabaseServerClient();

  const displayName = input.displayName.trim();
  if (!displayName) return { error: copy.errors.required };

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}
