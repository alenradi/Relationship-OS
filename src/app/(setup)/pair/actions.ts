"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { copy } from "@/lib/copy";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PairFormState = { error?: string | null };

/** Maps the RPC's raised exceptions onto copy the two of you can read. */
function translate(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("already full")) return copy.pairing.full;
  if (text.includes("does not match")) return copy.pairing.notFound;
  if (text.includes("already part of")) return copy.pairing.alreadyPaired;
  if (text.includes("two members")) return copy.pairing.full;
  return copy.app.somethingWentWrong;
}

export async function createSpaceAction(): Promise<PairFormState> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("create_couple_space");

  if (error) return { error: translate(error.message) };

  revalidatePath("/pair", "layout");
  redirect("/pair");
}

export async function joinSpaceAction(
  _prev: PairFormState,
  formData: FormData,
): Promise<PairFormState> {
  const raw = String(formData.get("invite_code") ?? "");
  const code = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

  if (code.length !== 8) return { error: copy.errors.invalidCode };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("join_couple_with_code", { p_code: code });

  if (error) return { error: translate(error.message) };

  revalidatePath("/", "layout");
  redirect("/onboarding");
}
