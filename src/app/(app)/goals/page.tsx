import { PageHeader } from "@/components/ui/page";
import { copy } from "@/lib/copy";
import { requireCouple } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { GoalsBoard } from "./goals-board";

export const metadata = { title: copy.goals.title };

export default async function GoalsPage() {
  const { couple, profile, partner } = await requireCouple();
  const supabase = await createSupabaseServerClient();

  const [{ data: goals }, { data: updates }, { data: cheers }] = await Promise.all([
    supabase
      .from("goals")
      .select("*")
      .eq("couple_id", couple.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("goal_updates")
      .select("*")
      .eq("couple_id", couple.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("goal_cheers")
      .select("*")
      .eq("couple_id", couple.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader title={copy.goals.title} description={copy.goals.subtitle} />
      <GoalsBoard
        me={profile}
        partner={partner}
        goals={goals ?? []}
        updates={updates ?? []}
        cheers={cheers ?? []}
      />
    </div>
  );
}
