import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import type { CoupleRow, ProfileRow } from "@/lib/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SessionContext = {
  user: User;
  profile: ProfileRow;
  couple: CoupleRow | null;
  partner: ProfileRow | null;
};

/** A session that is known to belong to a complete, onboarded couple space. */
export type CoupleContext = SessionContext & { couple: CoupleRow };

/**
 * Loads the signed-in user together with their profile, their couple, and their
 * partner. Every authenticated page starts here, so it is one round trip and
 * then everything downstream is synchronous.
 */
export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // The auth.users trigger creates this row, so a miss means the migrations
  // have not been applied yet.
  if (!profile) {
    return {
      user,
      profile: {
        id: user.id,
        couple_id: null,
        display_name:
          (user.user_metadata?.display_name as string | undefined) ?? "",
        pronoun: "they",
        created_at: user.created_at,
        updated_at: user.created_at,
      },
      couple: null,
      partner: null,
    };
  }

  if (!profile.couple_id) {
    return { user, profile, couple: null, partner: null };
  }

  const [{ data: couple }, { data: members }] = await Promise.all([
    supabase.from("couples").select("*").eq("id", profile.couple_id).maybeSingle(),
    supabase.from("profiles").select("*").eq("couple_id", profile.couple_id),
  ]);

  const partner = (members ?? []).find((m) => m.id !== user.id) ?? null;

  return { user, profile, couple: couple ?? null, partner };
}

export async function requireSession(): Promise<SessionContext> {
  const context = await getSessionContext();
  if (!context) redirect("/sign-in");
  return context;
}

/**
 * Gate for the main app: signed in, paired, and past the setup wizard.
 * `allowUnonboarded` lets the wizard itself use this without bouncing.
 */
export async function requireCouple(
  options: { allowUnonboarded?: boolean } = {},
): Promise<CoupleContext> {
  const context = await requireSession();

  if (!context.couple) redirect("/pair");

  if (!options.allowUnonboarded && !context.couple.onboarding_completed_at) {
    redirect("/onboarding");
  }

  return context as CoupleContext;
}
