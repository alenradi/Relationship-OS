import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page";
import { copy } from "@/lib/copy";
import { loadReflectionWeek } from "@/lib/data/reflection";
import { formatTimeAgo, formatWeekRange, isoDayOfWeek } from "@/lib/dates";
import { requireCouple } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { RevealPanel } from "../reveal-panel";

export default async function PastReflectionPage({
  params,
}: {
  params: Promise<{ week: string }>;
}) {
  const { week: weekParam } = await params;

  // Weeks are addressed by their ISO Monday.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekParam) || isoDayOfWeek(weekParam) !== 1) {
    notFound();
  }

  const { couple, user, profile, partner } = await requireCouple();
  const supabase = await createSupabaseServerClient();

  const week = await loadReflectionWeek(supabase, {
    coupleId: couple.id,
    userId: user.id,
    partnerId: partner?.id ?? null,
    weekStart: weekParam,
  });

  if (!week.mine && !week.partnerSubmittedAt) notFound();

  const revealed = week.state === "revealed" && week.mine && week.theirs;

  return (
    <div className="space-y-8">
      <PageHeader
        title={copy.reflection.weekOf(formatWeekRange(weekParam))}
        description={
          revealed && week.revealedAt
            ? copy.reflection.revealedBody(formatTimeAgo(week.revealedAt))
            : copy.reflection.closedWeekNotice
        }
        actions={
          <>
            {revealed ? (
              <Badge tone="sage">{copy.reflection.revealedTitle}</Badge>
            ) : (
              <Badge tone="honey">{copy.reflection.historyIncomplete}</Badge>
            )}
            <ButtonLink href="/reflection" variant="secondary" size="sm">
              {copy.app.back}
            </ButtonLink>
          </>
        }
      />

      {revealed ? (
        <RevealPanel
          mine={week.mine!}
          theirs={week.theirs!}
          me={profile}
          partner={partner}
        />
      ) : (
        <Notice tone="honey">{copy.reflection.onlyOneSubmitted}</Notice>
      )}
    </div>
  );
}
