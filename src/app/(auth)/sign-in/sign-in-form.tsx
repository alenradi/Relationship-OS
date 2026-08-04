"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { copy } from "@/lib/copy";

import { signInAction, type AuthFormState } from "../actions";

const initialState: AuthFormState = {};

export function SignInForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <Card className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-xl">{copy.auth.signInTitle}</h1>
        <p className="text-sm leading-relaxed text-ink-soft">
          {copy.auth.signInSubtitle}
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />

        <Field label={copy.auth.email} htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            autoFocus
            placeholder="you@example.com"
          />
        </Field>

        <Field label={copy.auth.password} htmlFor="password">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </Field>

        {state.error ? (
          <Notice tone="accent" role="alert">
            {state.error}
          </Notice>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? copy.auth.signingIn : copy.auth.signIn}
        </Button>
      </form>
    </Card>
  );
}
