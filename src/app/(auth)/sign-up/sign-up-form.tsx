"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { copy } from "@/lib/copy";

import { signUpAction, type AuthFormState } from "../actions";

const initialState: AuthFormState = {};

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);

  return (
    <Card className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-xl">{copy.auth.signUpTitle}</h1>
        <p className="text-sm leading-relaxed text-ink-soft text-pretty">
          {copy.auth.signUpSubtitle}
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <Field label={copy.auth.displayName} htmlFor="display_name">
          <Input
            id="display_name"
            name="display_name"
            required
            autoFocus
            autoComplete="given-name"
            placeholder={copy.auth.displayNamePlaceholder}
          />
        </Field>

        <Field label={copy.auth.email} htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </Field>

        <Field
          label={copy.auth.password}
          htmlFor="password"
          hint={copy.auth.passwordHint}
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </Field>

        {state.error ? (
          <Notice tone="accent" role="alert">
            {state.error}
          </Notice>
        ) : null}

        {state.notice ? (
          <Notice tone="sage" role="status">
            {state.notice}
          </Notice>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? copy.auth.signingUp : copy.auth.signUp}
        </Button>
      </form>
    </Card>
  );
}
