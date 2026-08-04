import { PageHeader } from "@/components/ui/page";
import {
  isConstitutionEditable,
  isConstitutionReviewDue,
} from "@/lib/constitution";
import { copy } from "@/lib/copy";
import { formatMediumDate } from "@/lib/dates";
import { requireCouple } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { ConstitutionBoard } from "./constitution-board";

export const metadata = { title: copy.constitution.title };

export default async function ConstitutionPage() {
  const { couple } = await requireCouple();
  const supabase = await createSupabaseServerClient();

  const [{ data: rules }, { data: versions }, { data: members }] =
    await Promise.all([
      supabase
        .from("rules")
        .select("*")
        .eq("couple_id", couple.id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("rule_versions")
        .select("*")
        .eq("couple_id", couple.id)
        .order("version", { ascending: false }),
      supabase.from("profiles").select("*").eq("couple_id", couple.id),
    ]);

  const reviewed = couple.constitution_reviewed_at;
  const editable = isConstitutionEditable(couple);
  const reviewDue = isConstitutionReviewDue(couple);

  return (
    <div className="space-y-8">
      <PageHeader
        title={copy.constitution.title}
        description={
          editable
            ? copy.constitution.subtitle
            : copy.constitution.lockedSubtitle
        }
      />

      <p className="text-xs text-ink-faint">
        {reviewed
          ? copy.constitution.lastReviewed(formatMediumDate(reviewed.slice(0, 10)))
          : copy.constitution.neverReviewed}
        {reviewDue ? " · review due" : ""}
      </p>

      <ConstitutionBoard
        rules={rules ?? []}
        versions={versions ?? []}
        members={members ?? []}
        editable={editable}
      />
    </div>
  );
}
