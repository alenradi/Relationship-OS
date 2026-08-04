import { NotebookIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { copy } from "@/lib/copy";
import type { ProfileRow } from "@/lib/database.types";
import { formatTimeAgo, formatWeekRange } from "@/lib/dates";
import { displayName } from "@/lib/people";
import type { RevealState } from "@/lib/reflection";

/** The dashboard's one-line status on this week's reflection. */
export function ReflectionNudge({
  weekStart,
  state,
  partner,
  revealedAt,
}: {
  weekStart: string;
  state: RevealState;
  partner: ProfileRow | null;
  revealedAt: string | null;
}) {
  const name = displayName(partner);

  const body = (() => {
    switch (state) {
      case "revealed":
        return revealedAt
          ? copy.reflection.revealedBody(formatTimeAgo(revealedAt))
          : copy.reflection.revealedTitle;
      case "waiting_for_partner":
        return copy.reflection.waitingBody(name);
      case "waiting_for_you":
        return copy.reflection.sealedBody(name);
      case "draft":
        return copy.reflection.editableNote;
      default:
        return copy.reflection.subtitle;
    }
  })();

  const tone =
    state === "revealed" ? "sage" : state === "waiting_for_partner" ? "lilac" : "honey";

  return (
    <Card tone={tone} className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-full text-ink-inverse ${
            tone === "sage" ? "bg-sage" : tone === "lilac" ? "bg-lilac" : "bg-honey"
          }`}
        >
          <NotebookIcon className="size-5" />
        </span>

        <div className="min-w-0 space-y-1">
          <CardTitle as="h2" className="text-base">
            {copy.dashboard.reflectionNudgeTitle}
          </CardTitle>
          <p className="text-xs text-ink-faint">
            {copy.reflection.weekOf(formatWeekRange(weekStart))}
          </p>
          <CardDescription>{body}</CardDescription>
        </div>
      </div>

      <ButtonLink
        href="/reflection"
        size="sm"
        variant={state === "revealed" ? "secondary" : "primary"}
        className="self-start"
      >
        {copy.dashboard.reflectionOpen}
      </ButtonLink>
    </Card>
  );
}
