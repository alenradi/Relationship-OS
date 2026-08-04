import { LockIcon } from "@/components/icons";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { copy } from "@/lib/copy";
import type { ProfileRow } from "@/lib/database.types";
import { formatTimeAgo } from "@/lib/dates";
import { displayName } from "@/lib/people";
import type { RevealState } from "@/lib/reflection";

/**
 * What you're allowed to know before the reveal: whether they've submitted, and
 * when. The blurred placeholder is decoration — the content genuinely is not in
 * the page, because row level security never sent it.
 */
export function PartnerStatusCard({
  partner,
  state,
  partnerSubmittedAt,
  partnerHasDraft,
}: {
  partner: ProfileRow | null;
  state: RevealState;
  partnerSubmittedAt: string | null;
  partnerHasDraft: boolean;
}) {
  const name = displayName(partner);

  const statusLine = partnerSubmittedAt
    ? copy.reflection.partnerSubmitted(name, formatTimeAgo(partnerSubmittedAt))
    : partnerHasDraft
      ? copy.reflection.partnerDraft(name)
      : copy.reflection.partnerNotSubmitted(name);

  const heading =
    state === "waiting_for_partner"
      ? copy.reflection.waitingTitle
      : copy.reflection.sealedTitle;

  const body =
    state === "waiting_for_partner"
      ? partnerHasDraft
        ? copy.reflection.waitingBody(name)
        : copy.reflection.waitingBodyNudge(name)
      : copy.reflection.sealedBody(name);

  return (
    <Card tone="lilac" className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-lilac text-ink-inverse">
          <LockIcon className="size-5" />
        </span>
        <div className="space-y-1.5">
          <CardTitle as="h2" className="text-base">
            {heading}
          </CardTitle>
          <CardDescription className="text-lilac-ink/80">{body}</CardDescription>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-lilac-line bg-surface/70 px-3.5 py-2.5">
        <Avatar profile={partner} variant="lilac" size="sm" />
        <p className="text-sm text-ink-soft">{statusLine}</p>
      </div>

      <div aria-hidden className="space-y-2">
        <div className="sealed space-y-2">
          <div className="h-3 w-4/5 rounded-full bg-lilac-line" />
          <div className="h-3 w-full rounded-full bg-lilac-line" />
          <div className="h-3 w-2/3 rounded-full bg-lilac-line" />
        </div>
      </div>
    </Card>
  );
}
