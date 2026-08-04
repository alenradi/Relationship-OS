"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, Textarea } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { RatingScale } from "@/components/ui/rating-scale";
import { copy } from "@/lib/copy";
import type { ReflectionAnswers, WeeklyReflectionRow } from "@/lib/database.types";
import {
  isComplete,
  ratingQuestions,
  readRating,
  readText,
  textPrompts,
} from "@/lib/reflection";

import { saveReflectionDraftAction, submitReflectionAction } from "./actions";

export function ReflectionForm({
  weekStart,
  existing,
  submitted,
}: {
  weekStart: string;
  existing: WeeklyReflectionRow | null;
  /** True once you have submitted but the week has not opened yet. */
  submitted: boolean;
}) {
  const [answers, setAnswers] = useState<ReflectionAnswers>(
    existing?.answers ?? {},
  );
  const [journal, setJournal] = useState(existing?.journal ?? "");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(!submitted);

  const complete = isComplete(answers);

  function set(id: string, value: string | number) {
    setAnswers((current) => ({ ...current, [id]: value }));
    setNotice(null);
  }

  function run(submit: boolean) {
    setError(null);
    setNotice(null);

    startTransition(async () => {
      const action = submit ? submitReflectionAction : saveReflectionDraftAction;
      const result = await action({ week_start: weekStart, answers, journal });

      if (result.error) {
        setError(result.error);
        return;
      }

      if (submit) {
        setEditing(false);
      } else {
        setNotice(copy.reflection.draftSaved);
      }
    });
  }

  if (!editing) {
    return (
      <Card className="space-y-4">
        <div className="space-y-1.5">
          <CardTitle>{copy.reflection.yourAnswers}</CardTitle>
          <CardDescription>{copy.reflection.editableNote}</CardDescription>
        </div>

        <AnswersSummary answers={answers} journal={journal} />

        <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
          {copy.reflection.editMine}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="space-y-7">
      <div className="space-y-1.5">
        <CardTitle>{copy.reflection.ratingsHeading}</CardTitle>
        <CardDescription>{copy.reflection.subtitle}</CardDescription>
      </div>

      <div className="space-y-6">
        {ratingQuestions.map((question) => (
          <Field key={question.id} label={question.question}>
            <RatingScale
              name={question.label}
              value={readRating(answers, question.id)}
              onChange={(value) => set(question.id, value)}
              lowLabel={question.low}
              highLabel={question.high}
              disabled={pending}
            />
          </Field>
        ))}
      </div>

      <div className="space-y-1.5 border-t border-line pt-6">
        <CardTitle as="h3" className="text-base">
          {copy.reflection.promptsHeading}
        </CardTitle>
      </div>

      <div className="space-y-5">
        {textPrompts.map((prompt) => (
          <Field key={prompt.id} label={prompt.label} htmlFor={prompt.id}>
            <Textarea
              id={prompt.id}
              value={readText(answers, prompt.id)}
              onChange={(event) => set(prompt.id, event.target.value)}
              placeholder={prompt.placeholder}
              disabled={pending}
            />
          </Field>
        ))}

        <Field
          label={copy.reflection.journalLabel}
          htmlFor="journal"
          hint={copy.reflection.journalHelp}
          optional
        >
          <Textarea
            id="journal"
            rows={5}
            value={journal}
            onChange={(event) => setJournal(event.target.value)}
            placeholder={copy.reflection.journalPlaceholder}
            disabled={pending}
          />
        </Field>
      </div>

      {error ? (
        <Notice tone="accent" role="alert">
          {error}
        </Notice>
      ) : null}

      {notice ? (
        <Notice tone="sage" role="status">
          {notice}
        </Notice>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-5">
        <Button onClick={() => run(true)} disabled={pending || !complete}>
          {pending ? copy.reflection.submitting : copy.reflection.submit}
        </Button>
        <Button variant="ghost" onClick={() => run(false)} disabled={pending}>
          {copy.reflection.saveDraft}
        </Button>
        {!complete ? (
          <p className="text-xs text-ink-faint">{copy.errors.required}</p>
        ) : null}
      </div>
    </Card>
  );
}

function AnswersSummary({
  answers,
  journal,
}: {
  answers: ReflectionAnswers;
  journal: string;
}) {
  return (
    <div className="space-y-4">
      <dl className="grid gap-2 sm:grid-cols-2">
        {ratingQuestions.map((question) => (
          <div
            key={question.id}
            className="flex items-center justify-between gap-3 rounded-xl bg-surface-muted px-3.5 py-2.5"
          >
            <dt className="text-sm text-ink-soft">{question.label}</dt>
            <dd className="tabular text-sm font-semibold text-ink">
              {readRating(answers, question.id) ?? "—"}/10
            </dd>
          </div>
        ))}
      </dl>

      <div className="space-y-3">
        {textPrompts.map((prompt) => {
          const value = readText(answers, prompt.id);
          if (!value) return null;
          return (
            <div key={prompt.id} className="space-y-1">
              <p className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
                {prompt.label}
              </p>
              <p className="text-sm leading-relaxed text-ink-soft text-pretty whitespace-pre-line">
                {value}
              </p>
            </div>
          );
        })}

        {journal ? (
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
              {copy.reflection.journalLabel}
            </p>
            <p className="text-sm leading-relaxed text-ink-soft text-pretty whitespace-pre-line">
              {journal}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
