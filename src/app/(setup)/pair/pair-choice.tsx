"use client";

import { useActionState, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { copy } from "@/lib/copy";

import {
  createSpaceAction,
  joinSpaceAction,
  type PairFormState,
} from "./actions";

const initialState: PairFormState = {};

export function PairChoice() {
  const [joinState, joinFormAction, joining] = useActionState(
    joinSpaceAction,
    initialState,
  );
  const [creating, startCreating] = useTransition();
  const [createError, setCreateError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl sm:text-3xl">{copy.pairing.title}</h1>
        <p className="mx-auto max-w-lg text-sm leading-relaxed text-ink-soft text-pretty">
          {copy.pairing.subtitle}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <CardTitle as="h2">{copy.pairing.createTitle}</CardTitle>
            <CardDescription>{copy.pairing.createBody}</CardDescription>
          </div>

          {createError ? (
            <Notice tone="accent" role="alert">
              {createError}
            </Notice>
          ) : null}

          <Button
            className="mt-auto w-full"
            disabled={creating || joining}
            onClick={() =>
              startCreating(async () => {
                setCreateError(null);
                const result = await createSpaceAction();
                if (result?.error) setCreateError(result.error);
              })
            }
          >
            {creating ? copy.app.saving : copy.pairing.createCta}
          </Button>
        </Card>

        <Card tone="muted" className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <CardTitle as="h2">{copy.pairing.joinTitle}</CardTitle>
            <CardDescription>{copy.pairing.joinBody}</CardDescription>
          </div>

          <form action={joinFormAction} className="mt-auto space-y-3">
            <Field label={copy.pairing.codeLabel} htmlFor="invite_code">
              <Input
                id="invite_code"
                name="invite_code"
                required
                maxLength={12}
                autoCapitalize="characters"
                spellCheck={false}
                placeholder={copy.pairing.codePlaceholder}
                className="text-center font-mono text-base tracking-[0.3em] uppercase"
              />
            </Field>

            {joinState.error ? (
              <Notice tone="accent" role="alert">
                {joinState.error}
              </Notice>
            ) : null}

            <Button
              type="submit"
              variant="secondary"
              className="w-full"
              disabled={joining || creating}
            >
              {joining ? copy.app.saving : copy.pairing.joinCta}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
