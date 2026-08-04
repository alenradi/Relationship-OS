import { PageHeader } from "@/components/ui/page";
import { copy } from "@/lib/copy";
import { requireCouple } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { ConflictsBoard } from "./conflicts-board";

export const metadata = { title: copy.conflicts.title };

export default async function ConflictsPage() {
  const { couple, profile, partner } = await requireCouple();
  const supabase = await createSupabaseServerClient();

  const { data: conflicts } = await supabase
    .from("conflicts")
    .select("*")
    .eq("couple_id", couple.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <PageHeader
        title={copy.conflicts.title}
        description={copy.conflicts.subtitle}
      />

      <ConflictsBoard
        me={profile}
        partner={partner}
        conflicts={conflicts ?? []}
      />
    </div>
  );
}
