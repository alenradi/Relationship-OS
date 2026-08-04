"use client";

import { useState, useTransition } from "react";

import { markConstitutionReviewedAction } from "@/app/(app)/constitution/actions";
import { ScrollIcon } from "@/components/icons";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { copy } from "@/lib/copy";

/**
 * The monthly nudge to revisit your agreements. Dismissing it *is* marking it
 * reviewed — there is no "remind me later", because the whole point is that the
 * conversation happens.
 */
export function ConstitutionReviewBanner({ months }: { months: number }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <Card tone="sage" className="text-sm text-sage-ink">
        {copy.dashboard.constitutionReviewDismissed}
      </Card>
    );
  }

  return (
    <Card tone="honey" className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-honey text-ink-inverse">
        <ScrollIcon className="size-5" />
      </span>

      <div className="min-w-0 flex-1 space-y-1">
        <CardTitle as="h2" className="text-base">
          {copy.dashboard.constitutionReviewTitle}
        </CardTitle>
        <CardDescription className="text-honey-ink/80">
          {copy.dashboard.constitutionReviewBody(months)}
        </CardDescription>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <ButtonLink href="/constitution" size="sm">
          {copy.dashboard.constitutionReviewCta}
        </ButtonLink>
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await markConstitutionReviewedAction();
              setDone(true);
            })
          }
        >
          {copy.dashboard.constitutionReviewDone}
        </Button>
      </div>
    </Card>
  );
}
