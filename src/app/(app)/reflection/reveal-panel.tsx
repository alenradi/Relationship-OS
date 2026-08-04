import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { RatingValue } from "@/components/ui/rating-scale";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import type { ProfileRow, WeeklyReflectionRow } from "@/lib/database.types";
import { displayName } from "@/lib/people";
import {
  agendaNeedsAttention,
  buildAgenda,
  ratingQuestions,
  readRating,
  readText,
  textPrompts,
} from "@/lib/reflection";

/**
 * Everything both of you wrote, side by side, plus the generated agenda.
 *
 * The agenda comes first on purpose: the point of the reveal is the
 * conversation, not the reading.
 */
export function RevealPanel({
  mine,
  theirs,
  me,
  partner,
}: {
  mine: WeeklyReflectionRow;
  theirs: WeeklyReflectionRow;
  me: ProfileRow;
  partner: ProfileRow | null;
}) {
  const agenda = buildAgenda(
    mine.answers,
    theirs.answers,
    displayName(partner),
  );
  const attention = agendaNeedsAttention(agenda);
  const partnerName = displayName(partner);

  return (
    <div className="space-y-6">
      <Card tone="lilac" className="space-y-4">
        <div className="space-y-1.5">
          <CardTitle>{copy.reflection.agendaTitle}</CardTitle>
          <CardDescription className="text-lilac-ink/80">
            {copy.reflection.agendaSubtitle}
          </CardDescription>
        </div>

        {attention.length === 0 ? (
          <p className="text-sm leading-relaxed text-lilac-ink text-pretty">
            {copy.reflection.agendaEmpty}
          </p>
        ) : (
          <ol className="space-y-3">
            {attention.map((item, index) => (
              <li
                key={item.id}
                className="flex gap-3 rounded-xl border border-lilac-line bg-surface/70 p-3.5"
              >
                <span className="tabular flex size-6 shrink-0 items-center justify-center rounded-full bg-lilac text-xs font-semibold text-ink-inverse">
                  {index + 1}
                </span>
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={item.emphasis === "high" ? "accent" : "neutral"}>
                      {item.emphasis === "high"
                        ? copy.reflection.agendaGapBig
                        : copy.reflection.agendaGapSmall}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-ink text-pretty">
                    {item.headline}
                  </p>
                  {item.detail ? (
                    <p className="text-xs text-ink-soft text-pretty">
                      {item.detail}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card className="space-y-5">
        <CardTitle>{copy.reflection.ratingsHeading}</CardTitle>

        <div className="space-y-2">
          <div className="flex items-center justify-end gap-3 pr-1 text-xs text-ink-faint">
            <span className="flex items-center gap-1.5">
              <Avatar profile={me} variant="accent" size="sm" />
              {copy.app.you}
            </span>
            <span className="flex items-center gap-1.5">
              <Avatar profile={partner} variant="lilac" size="sm" />
              {partnerName}
            </span>
          </div>

          {ratingQuestions.map((question) => {
            const a = readRating(mine.answers, question.id);
            const b = readRating(theirs.answers, question.id);
            const gap = a !== null && b !== null ? Math.abs(a - b) : 0;

            return (
              <div
                key={question.id}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5",
                  gap >= 3 ? "bg-accent-soft" : "bg-surface-muted",
                )}
              >
                <p className="min-w-0 text-sm text-ink text-pretty">
                  {question.label}
                </p>
                <div className="flex shrink-0 items-center gap-2">
                  <RatingValue value={a} tone="accent" />
                  <RatingValue value={b} tone="lilac" />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="space-y-5">
        {textPrompts.map((prompt) => {
          const a = readText(mine.answers, prompt.id);
          const b = readText(theirs.answers, prompt.id);
          if (!a && !b) return null;

          return (
            <Card key={prompt.id} className="space-y-4">
              <CardTitle as="h3" className="text-base">
                {prompt.label}
              </CardTitle>

              <div className="grid gap-3 md:grid-cols-2">
                <AnswerBlock
                  profile={me}
                  label={copy.reflection.yourAnswers}
                  value={a}
                  tone="accent"
                />
                <AnswerBlock
                  profile={partner}
                  label={copy.reflection.partnerAnswers(partnerName)}
                  value={b}
                  tone="lilac"
                />
              </div>
            </Card>
          );
        })}
      </div>

      {mine.journal || theirs.journal ? (
        <Card className="space-y-4">
          <CardTitle as="h3" className="text-base">
            {copy.reflection.journalLabel}
          </CardTitle>
          <div className="grid gap-3 md:grid-cols-2">
            <AnswerBlock
              profile={me}
              label={copy.reflection.yourAnswers}
              value={mine.journal}
              tone="accent"
            />
            <AnswerBlock
              profile={partner}
              label={copy.reflection.partnerAnswers(partnerName)}
              value={theirs.journal}
              tone="lilac"
            />
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function AnswerBlock({
  profile,
  label,
  value,
  tone,
}: {
  profile: ProfileRow | null;
  label: string;
  value: string;
  tone: "accent" | "lilac";
}) {
  return (
    <div
      className={cn(
        "space-y-2 rounded-xl border p-3.5",
        tone === "accent"
          ? "border-accent-line bg-accent-soft/50"
          : "border-lilac-line bg-lilac-soft/50",
      )}
    >
      <div className="flex items-center gap-2">
        <Avatar profile={profile} variant={tone} size="sm" />
        <p className="text-xs font-medium text-ink-soft">{label}</p>
      </div>
      <p className="text-sm leading-relaxed text-ink text-pretty whitespace-pre-line">
        {value || (
          <span className="text-ink-faint italic">{copy.reflection.noAnswer}</span>
        )}
      </p>
    </div>
  );
}
