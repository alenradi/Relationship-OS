"use client";

import { useState, useTransition } from "react";

import {
  saveConflictAction,
  saveFollowUpAction,
} from "@/app/(app)/conflicts/actions";
import { PlusIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Notice } from "@/components/ui/notice";
import { EmptyState, SectionHeading } from "@/components/ui/page";
import { copy } from "@/lib/copy";
import type { ConflictRow, FollowUpStatus, ProfileRow } from "@/lib/database.types";
import { formatMediumDate, todayInAppTz } from "@/lib/dates";
import { displayName } from "@/lib/people";

export function ConflictsBoard({
  me,
  partner,
  conflicts,
}: {
  me: ProfileRow;
  partner: ProfileRow | null;
  conflicts: ConflictRow[];
}) {
  const [creating, setCreating] = useState(false);
  const today = todayInAppTz();

  const pendingFollowUps = conflicts.filter(
    (c) =>
      c.follow_up_status === "pending" &&
      c.follow_up_date &&
      c.follow_up_date <= today,
  );

  return (
    <div className="space-y-8">
      <Notice tone="honey">{copy.conflicts.afterTheFactNotice}</Notice>

      {pendingFollowUps.length > 0 ? (
        <section className="space-y-3">
          <SectionHeading title={copy.conflicts.pendingFollowUpsTitle} />
          {pendingFollowUps.map((c) => (
            <FollowUpCard key={c.id} conflict={c} />
          ))}
        </section>
      ) : null}

      <SectionHeading
        title={copy.conflicts.title}
        actions={
          <Button size="sm" onClick={() => setCreating(true)}>
            <PlusIcon className="size-4" />
            {copy.conflicts.addConflict}
          </Button>
        }
      />

      {conflicts.length === 0 ? (
        <EmptyState
          title={copy.conflicts.empty}
          action={
            <Button onClick={() => setCreating(true)}>
              {copy.conflicts.emptyCta}
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {conflicts.map((c) => (
            <ConflictCard key={c.id} conflict={c} me={me} partner={partner} />
          ))}
        </div>
      )}

      {creating ? (
        <ConflictEditor
          open
          me={me}
          partner={partner}
          onClose={() => setCreating(false)}
        />
      ) : null}
    </div>
  );
}

function ConflictCard({
  conflict,
  me,
  partner,
}: {
  conflict: ConflictRow;
  me: ProfileRow;
  partner: ProfileRow | null;
}) {
  const nameA =
    conflict.perspective_a_user === me.id
      ? displayName(me)
      : displayName(partner);
  const nameB =
    conflict.perspective_b_user === me.id
      ? displayName(me)
      : displayName(partner);

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle as="h3" className="text-base">
            {conflict.title}
          </CardTitle>
          {conflict.happened_on ? (
            <CardDescription>
              {formatMediumDate(conflict.happened_on)}
            </CardDescription>
          ) : null}
        </div>
        <Badge
          tone={
            conflict.follow_up_status === "worked"
              ? "sage"
              : conflict.follow_up_status === "pending"
                ? "honey"
                : "neutral"
          }
        >
          {copy.conflicts.followUpStatuses[conflict.follow_up_status]}
        </Badge>
      </div>

      {conflict.what_it_was_about ? (
        <p className="text-sm text-ink-soft text-pretty">
          {conflict.what_it_was_about}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-surface-muted px-3.5 py-3 space-y-1">
          <p className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
            {nameA}
          </p>
          <p className="text-sm text-ink-soft text-pretty">
            {conflict.perspective_a || copy.conflicts.notWrittenYet}
          </p>
        </div>
        <div className="rounded-xl bg-surface-muted px-3.5 py-3 space-y-1">
          <p className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
            {nameB || displayName(partner)}
          </p>
          <p className="text-sm text-ink-soft text-pretty">
            {conflict.perspective_b || copy.conflicts.notWrittenYet}
          </p>
        </div>
      </div>

      {conflict.trigger_note ? (
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
            {copy.conflicts.fieldTrigger}
          </p>
          <p className="text-sm text-ink-soft">{conflict.trigger_note}</p>
        </div>
      ) : null}

      {conflict.resolution ? (
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
            {copy.conflicts.fieldResolution}
          </p>
          <p className="text-sm text-ink-soft">{conflict.resolution}</p>
        </div>
      ) : null}

      {conflict.agreed_action ? (
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
            {copy.conflicts.fieldAgreedAction}
          </p>
          <p className="text-sm text-ink">{conflict.agreed_action}</p>
        </div>
      ) : null}

      {conflict.follow_up_date ? (
        <p className="text-xs text-ink-faint">
          {copy.conflicts.followUpDueOn(formatMediumDate(conflict.follow_up_date))}
        </p>
      ) : null}
    </Card>
  );
}

function FollowUpCard({ conflict }: { conflict: ConflictRow }) {
  const [status, setStatus] = useState<FollowUpStatus>("worked");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const today = todayInAppTz();
  const overdue =
    conflict.follow_up_date && conflict.follow_up_date < today;

  return (
    <Card tone="honey" className="space-y-4">
      <div className="space-y-1">
        <CardTitle as="h3" className="text-base">
          {copy.conflicts.followUpTitle}
        </CardTitle>
        <CardDescription>
          {copy.conflicts.followUpPrompt(conflict.title)}
        </CardDescription>
        {conflict.follow_up_date ? (
          <p className="text-xs text-honey-ink">
            {overdue
              ? copy.conflicts.followUpOverdue(
                  formatMediumDate(conflict.follow_up_date),
                )
              : copy.conflicts.followUpDueOn(
                  formatMediumDate(conflict.follow_up_date),
                )}
          </p>
        ) : null}
      </div>

      <Field label={copy.conflicts.followUpTitle} htmlFor={`fu-${conflict.id}`}>
        <Select
          id={`fu-${conflict.id}`}
          value={status}
          onChange={(e) => setStatus(e.target.value as FollowUpStatus)}
        >
          <option value="worked">{copy.conflicts.followUpStatuses.worked}</option>
          <option value="partly">{copy.conflicts.followUpStatuses.partly}</option>
          <option value="didnt_work">
            {copy.conflicts.followUpStatuses.didnt_work}
          </option>
        </Select>
      </Field>

      <Field label={copy.conflicts.followUpNote} htmlFor={`fu-note-${conflict.id}`} optional>
        <Textarea
          id={`fu-note-${conflict.id}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Field>

      {status === "didnt_work" ? (
        <p className="text-xs text-ink-soft">{copy.conflicts.reopenSuggestion}</p>
      ) : null}

      {error ? (
        <Notice tone="accent" role="alert">
          {error}
        </Notice>
      ) : null}

      <Button
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await saveFollowUpAction({
              id: conflict.id,
              follow_up_status: status,
              follow_up_note: note,
            });
            if (result.error) setError(result.error);
          })
        }
      >
        {copy.conflicts.followUpSave}
      </Button>
    </Card>
  );
}

function ConflictEditor({
  open,
  partner,
  onClose,
}: {
  open: boolean;
  me: ProfileRow;
  partner: ProfileRow | null;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [happenedOn, setHappenedOn] = useState("");
  const [about, setAbout] = useState("");
  const [perspectiveA, setPerspectiveA] = useState("");
  const [perspectiveB, setPerspectiveB] = useState("");
  const [trigger, setTrigger] = useState("");
  const [resolution, setResolution] = useState("");
  const [agreed, setAgreed] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={copy.conflicts.addConflict}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            {copy.app.cancel}
          </Button>
          <Button
            disabled={pending}
            onClick={() =>
              start(async () => {
                const result = await saveConflictAction({
                  title,
                  happened_on: happenedOn || null,
                  what_it_was_about: about,
                  perspective_a: perspectiveA,
                  perspective_b: perspectiveB,
                  trigger_note: trigger,
                  resolution,
                  agreed_action: agreed,
                  follow_up_date: followUp || null,
                });
                if (result.error) setError(result.error);
                else onClose();
              })
            }
          >
            {pending ? copy.app.saving : copy.app.save}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Notice tone="honey">{copy.conflicts.afterTheFactNotice}</Notice>

        <Field label={copy.conflicts.fieldTitle} htmlFor="c-title">
          <Input
            id="c-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={copy.conflicts.fieldTitlePlaceholder}
          />
        </Field>

        <Field label={copy.conflicts.fieldHappenedOn} htmlFor="c-when" optional>
          <Input
            id="c-when"
            type="date"
            value={happenedOn}
            onChange={(e) => setHappenedOn(e.target.value)}
          />
        </Field>

        <Field label={copy.conflicts.fieldAbout} htmlFor="c-about" optional>
          <Textarea
            id="c-about"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder={copy.conflicts.fieldAboutPlaceholder}
          />
        </Field>

        <Field
          label={copy.conflicts.fieldPerspectiveA}
          htmlFor="c-pa"
          hint={copy.conflicts.perspectiveHelp}
        >
          <Textarea
            id="c-pa"
            value={perspectiveA}
            onChange={(e) => setPerspectiveA(e.target.value)}
            placeholder={copy.conflicts.perspectivePlaceholder}
          />
        </Field>

        <Field
          label={copy.conflicts.fieldPerspectiveB(displayName(partner))}
          htmlFor="c-pb"
          hint={copy.conflicts.partnerWritesTheirs(displayName(partner))}
          optional
        >
          <Textarea
            id="c-pb"
            value={perspectiveB}
            onChange={(e) => setPerspectiveB(e.target.value)}
            placeholder={copy.conflicts.perspectivePlaceholder}
          />
        </Field>

        <Field label={copy.conflicts.fieldTrigger} htmlFor="c-trigger" optional>
          <Textarea
            id="c-trigger"
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            placeholder={copy.conflicts.fieldTriggerPlaceholder}
          />
        </Field>

        <Field label={copy.conflicts.fieldResolution} htmlFor="c-res" optional>
          <Textarea
            id="c-res"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder={copy.conflicts.fieldResolutionPlaceholder}
          />
        </Field>

        <Field label={copy.conflicts.fieldAgreedAction} htmlFor="c-act" optional>
          <Textarea
            id="c-act"
            value={agreed}
            onChange={(e) => setAgreed(e.target.value)}
            placeholder={copy.conflicts.fieldAgreedActionPlaceholder}
          />
        </Field>

        <Field
          label={copy.conflicts.fieldFollowUpDate}
          htmlFor="c-fu"
          hint={copy.conflicts.followUpHelp}
          optional
        >
          <Input
            id="c-fu"
            type="date"
            value={followUp}
            onChange={(e) => setFollowUp(e.target.value)}
          />
        </Field>

        {error ? (
          <Notice tone="accent" role="alert">
            {error}
          </Notice>
        ) : null}
      </div>
    </Modal>
  );
}
