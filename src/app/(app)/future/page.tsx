import { PageHeader } from "@/components/ui/page";
import { copy } from "@/lib/copy";
import { loadCouplePhotos } from "@/lib/photos";
import { requireCouple } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { FutureBoard } from "./future-board";

export const metadata = { title: copy.future.title };

export default async function FuturePage() {
  const { couple, profile, partner } = await requireCouple();
  const supabase = await createSupabaseServerClient();

  const [
    { data: ideas },
    { data: trips },
    { data: tasks },
    { data: activities },
    { data: milestones },
    photos,
  ] = await Promise.all([
    supabase
      .from("date_ideas")
      .select("*")
      .eq("couple_id", couple.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("trips")
      .select("*")
      .eq("couple_id", couple.id)
      .order("start_date", { ascending: true }),
    supabase.from("trip_tasks").select("*").eq("couple_id", couple.id),
    supabase.from("trip_activities").select("*").eq("couple_id", couple.id),
    supabase
      .from("milestones")
      .select("*")
      .eq("couple_id", couple.id)
      .order("milestone_date", { ascending: true }),
    loadCouplePhotos(couple.id),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader title={copy.future.title} description={copy.future.subtitle} />
      <FutureBoard
        couple={couple}
        me={profile}
        partner={partner}
        ideas={ideas ?? []}
        trips={trips ?? []}
        tasks={tasks ?? []}
        activities={activities ?? []}
        milestones={milestones ?? []}
        photos={photos}
      />
    </div>
  );
}
