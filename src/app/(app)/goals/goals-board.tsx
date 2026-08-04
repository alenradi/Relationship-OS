"use client";

import { useMemo, useState, useTransition } from "react";

import { PlusIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Notice } from "@/components/ui/notice";
import { EmptyState, SectionHeading } from "@/components/ui/page";
import { copy } from "@/lib/copy";
import type {
  GoalCheerRow,
  GoalMilestone,
  GoalRow,
  GoalUpdateRow,
  ProfileRow,
} from "@/lib/database.types";
import { formatMediumDate, formatTimeAgo, todayInAppTz } from "@/lib/dates";
import { displayName } from "@/lib/people";

import {
  addProgressUpdateAction,
  deleteGoalAction,
  markAchievedAction,
  saveGoalAction,
  sendCheerAction,
  toggleMilestoneAction,
} from "./actions";

export function GoalsBoard({
  me,
  partner,
  goals,
  updates,
  cheers,
}: {
  me: ProfileRow;
  partner: ProfileRow | null;
  goals: GoalRow[];
  updates: GoalUpdateRow[];
  cheers: GoalCheerRow[];
}) {
  const [creating, setCreating] = useState<"personal" | "relationship" | null>(
    null,
  );
  const [editing, setEditing] = useState<GoalRow | null>(null);

  const members = useMemo(() => {
    const list = [me];
    if (partner) list.push(partner);
    return list;
  }, [me, partner]);

  const mine = goals.filter(
    (g) => g.goal_type === "personal" && g.owner_id === me.id,
  );
  const theirs = goals.filter(
    (g) => g.goal_type === "personal" && g.owner_id === partner?.id,
  );
  const ours = goals.filter((g) => g.goal_type === "relationship");

  return (
    <div className="space-y-10">
      <SectionHeading
        title={copy.goals.title}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setCreating("personal")}
            >
              <PlusIcon className="size-4" />
              {copy.goals.newPersonal}
            </Button>
            <Button size="sm" onClick={() => setCreating("relationship")}>
              <PlusIcon className="size-4" />
              {copy.goals.newShared}
            </Button>
          </div>
        }
      />

      <Lane
        title={copy.goals.laneMine}
        empty={copy.goals.laneMineEmpty}
        goals={mine}
        updates={updates}
        cheers={cheers}
        members={members}
        userId={me.id}
        partner={partner}
        canEdit
        onEdit={setEditing}
      />

      <Lane
        title={copy.goals.laneTheirs(displayName(partner, "Partner"))}
        empty={copy.goals.laneTheirsEmpty(displayName(partner))}
        goals={theirs}
        updates={updates}
        cheers={cheers}
        members={members}
        userId={me.id}
        partner={partner}
        canEdit={false}
        canCheer
        onEdit={setEditing}
      />

      <Lane
        title={copy.goals.laneOurs}
        empty={copy.goals.laneOursEmpty}
        goals={ours}
        updates={updates}
        cheers={cheers}
        members={members}
        userId={me.id}
        partner={partner}
        canEdit
        onEdit={setEditing}
      />

      {creating ? (
        <GoalEditor
          open
          goal={null}
          defaultType={creating}
          onClose={() => setCreating(null)}
        />
      ) : null}
      {editing ? (
        <GoalEditor
          open
          key={editing.id}
          goal={editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}

function Lane({
  title,
  empty,
  goals,
  updates,
  cheers,
  members,
  userId,
  partner,
  canEdit,
  canCheer,
  onEdit,
}: {
  title: string;
  empty: string;
  goals: GoalRow[];
  updates: GoalUpdateRow[];
  cheers: GoalCheerRow[];
  members: ProfileRow[];
  userId: string;
  partner: ProfileRow | null;
  canEdit: boolean;
  canCheer?: boolean;
  onEdit: (goal: GoalRow) => void;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold tracking-[0.12em] text-ink-faint uppercase">
        {title}
      </h2>
      {goals.length === 0 ? <EmptyState title={empty} /> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            updates={updates.filter((u) => u.goal_id === goal.id)}
            cheers={cheers.filter((c) => c.goal_id === goal.id)}
            members={members}
            userId={userId}
            partner={partner}
            canEdit={canEdit}
            canCheer={Boolean(canCheer)}
            onEdit={canEdit ? () => onEdit(goal) : undefined}
          />
        ))}
      </div>
    </section>
  );
}

function GoalCard({
  goal,
  updates,
  cheers,
  members,
  userId,
  partner,
  canEdit,
  canCheer,
  onEdit,
}: {
  goal: GoalRow;
  updates: GoalUpdateRow[];
  cheers: GoalCheerRow[];
  members: ProfileRow[];
  userId: string;
  partner: ProfileRow | null;
  canEdit: boolean;
  canCheer: boolean;
  onEdit?: () => void;
}) {
  const [pending, start] = useTransition();
  const [cheerMsg, setCheerMsg] = useState("");
  const [updateBody, setUpdateBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const today = todayInAppTz();
  const doneCount = goal.milestones.filter((m) => m.done).length;

  const nameFor = (id: string) => {
    const profile = members.find((m) => m.id === id);
    return displayName(profile);
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle as="h3" className="text-base">
            {goal.title}
          </CardTitle>
          {goal.why_it_matters ? (
            <CardDescription>{goal.why_it_matters}</CardDescription>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge tone={goal.status === "achieved" ? "sage" : "neutral"}>
            {copy.goals.statuses[goal.status]}
          </Badge>
          {canEdit && onEdit ? (
            <Button variant="ghost" size="sm" onClick={onEdit}>
              {copy.app.edit}
            </Button>
          ) : null}
        </div>
      </div>

      {goal.status === "achieved" ? (
        <Notice tone="sage">{copy.goals.achievedBanner}</Notice>
      ) : null}

      {goal.target_date ? (
        <p className="text-xs text-ink-faint">
          {goal.target_date < today
            ? copy.goals.overdueLabel(formatMediumDate(goal.target_date))
            : copy.goals.targetLabel(formatMediumDate(goal.target_date))}
        </p>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
          {copy.goals.milestonesTitle}
          {goal.milestones.length > 0
            ? ` · ${copy.goals.milestoneProgress(doneCount, goal.milestones.length)}`
            : ""}
        </p>
        {goal.milestones.length === 0 ? (
          <p className="text-xs text-ink-faint">{copy.goals.noMilestones}</p>
        ) : (
          <ul className="space-y-1.5">
            {goal.milestones.map((m) => (
              <li key={m.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={m.done}
                  disabled={!canEdit || pending}
                  onChange={() =>
                    start(async () => {
                      await toggleMilestoneAction(goal.id, m.id);
                    })
                  }
                  className="size-4 rounded border-line accent-[var(--color-accent)]"
                />
                <span className={m.done ? "text-ink-faint line-through" : "text-ink"}>
                  {m.title}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2 border-t border-line pt-3">
        <p className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
          {copy.goals.progressTitle}
        </p>
        {updates.length === 0 ? (
          <p className="text-xs text-ink-faint">{copy.goals.progressEmpty}</p>
        ) : (
          <ul className="space-y-2">
            {updates.slice(0, 4).map((u) => (
              <li key={u.id} className="text-sm text-ink-soft text-pretty">
                <span className="text-xs text-ink-faint">
                  {copy.goals.progressBy(nameFor(u.author_id), formatTimeAgo(u.created_at))}
                </span>
                <p>{u.body}</p>
              </li>
            ))}
          </ul>
        )}
        {canEdit ? (
          <div className="flex gap-2">
            <Input
              value={updateBody}
              onChange={(e) => setUpdateBody(e.target.value)}
              placeholder={copy.goals.progressPlaceholder}
            />
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const result = await addProgressUpdateAction(
                    goal.id,
                    updateBody,
                    null,
                  );
                  if (result.error) setError(result.error);
                  else setUpdateBody("");
                })
              }
            >
              {copy.goals.addProgress}
            </Button>
          </div>
        ) : null}
      </div>

      <div className="space-y-2 border-t border-line pt-3">
        <p className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
          {copy.goals.cheersTitle}
          {cheers.length > 0 ? ` · ${copy.goals.cheerCount(cheers.length)}` : ""}
        </p>
        {cheers.length === 0 ? (
          <p className="text-xs text-ink-faint">{copy.goals.cheersEmpty}</p>
        ) : (
          <ul className="space-y-2">
            {cheers.map((c) => (
              <li key={c.id} className="rounded-xl bg-sage-soft/50 px-3 py-2 text-sm">
                <p className="text-xs text-sage-ink">
                  {copy.goals.cheeredBy(nameFor(c.from_user))}
                </p>
                {c.message ? <p className="text-ink-soft">{c.message}</p> : null}
              </li>
            ))}
          </ul>
        )}
        {canCheer ? (
          <div className="flex gap-2">
            <Input
              value={cheerMsg}
              onChange={(e) => setCheerMsg(e.target.value)}
              placeholder={copy.goals.cheerPlaceholder}
            />
            <Button
              size="sm"
              variant="soft"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const result = await sendCheerAction(goal.id, cheerMsg);
                  if (result.error) setError(result.error);
                  else setCheerMsg("");
                })
              }
            >
              {copy.goals.cheerSend}
            </Button>
          </div>
        ) : canEdit && goal.goal_type === "personal" && goal.owner_id === userId ? (
          <p className="text-xs text-ink-faint">{copy.goals.cheerOwnGoalNote}</p>
        ) : null}
      </div>

      {canEdit && goal.status === "active" ? (
        <Button
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await markAchievedAction(goal.id);
            })
          }
        >
          {copy.goals.markAchieved}
        </Button>
      ) : null}

      {error ? (
        <Notice tone="accent" role="alert">
          {error}
        </Notice>
      ) : null}
    </Card>
  );
}

function GoalEditor({
  open,
  goal,
  defaultType = "personal",
  onClose,
}: {
  open: boolean;
  goal: GoalRow | null;
  defaultType?: "personal" | "relationship";
  onClose: () => void;
}) {
  const [title, setTitle] = useState(goal?.title ?? "");
  const [why, setWhy] = useState(goal?.why_it_matters ?? "");
  const [type, setType] = useState<"personal" | "relationship">(
    goal?.goal_type === "relationship" ? "relationship" : defaultType,
  );
  const [target, setTarget] = useState(goal?.target_date ?? "");
  const [status, setStatus] = useState(goal?.status ?? "active");
  const [milestones, setMilestones] = useState<GoalMilestone[]>(
    goal?.milestones ?? [],
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save() {
    setError(null);
    start(async () => {
      const result = await saveGoalAction({
        id: goal?.id,
        title,
        why_it_matters: why,
        goal_type: type,
        target_date: target || null,
        status,
        milestones,
      });
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  function remove() {
    if (!goal || !window.confirm(copy.app.confirmDelete)) return;
    setError(null);
    start(async () => {
      const result = await deleteGoalAction(goal.id);
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={goal ? copy.goals.editGoal : copy.goals.addGoal}
      footer={
        <>
          {goal ? (
            <Button variant="ghost" onClick={remove} disabled={pending}>
              {copy.app.delete}
            </Button>
          ) : null}
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            {copy.app.cancel}
          </Button>
          <Button onClick={save} disabled={pending}>
            {pending ? copy.app.saving : copy.app.save}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {!goal ? (
          <Field label={copy.goals.fieldType} htmlFor="goal-type">
            <Select
              id="goal-type"
              value={type}
              onChange={(e) =>
                setType(e.target.value as "personal" | "relationship")
              }
            >
              <option value="personal">{copy.goals.typePersonal}</option>
              <option value="relationship">{copy.goals.typeShared}</option>
            </Select>
          </Field>
        ) : null}

        <Field label={copy.goals.fieldTitle} htmlFor="goal-title">
          <Input
            id="goal-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={copy.goals.fieldTitlePlaceholder}
          />
        </Field>

        <Field label={copy.goals.fieldWhy} htmlFor="goal-why" optional>
          <Textarea
            id="goal-why"
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            placeholder={copy.goals.fieldWhyPlaceholder}
          />
        </Field>

        <Field label={copy.goals.fieldTargetDate} htmlFor="goal-target" optional>
          <Input
            id="goal-target"
            type="date"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </Field>

        <Field label={copy.goals.fieldStatus} htmlFor="goal-status">
          <Select
            id="goal-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
          >
            {(Object.keys(copy.goals.statuses) as Array<keyof typeof copy.goals.statuses>).map(
              (key) => (
                <option key={key} value={key}>
                  {copy.goals.statuses[key]}
                </option>
              ),
            )}
          </Select>
        </Field>

        <div className="space-y-2">
          <p className="text-sm font-medium text-ink">{copy.goals.milestonesTitle}</p>
          <p className="text-xs text-ink-faint">{copy.goals.milestonesHelp}</p>
          {milestones.map((m, index) => (
            <div key={m.id} className="flex gap-2">
              <Input
                value={m.title}
                onChange={(e) =>
                  setMilestones((list) =>
                    list.map((item, i) =>
                      i === index ? { ...item, title: e.target.value } : item,
                    ),
                  )
                }
                placeholder={copy.goals.milestonePlaceholder}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setMilestones((list) => list.filter((_, i) => i !== index))
                }
              >
                {copy.app.remove}
              </Button>
            </div>
          ))}
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              setMilestones((list) => [
                ...list,
                { id: crypto.randomUUID(), title: "", done: false },
              ])
            }
          >
            <PlusIcon className="size-4" />
            {copy.goals.addMilestone}
          </Button>
        </div>

        {error ? (
          <Notice tone="accent" role="alert">
            {error}
          </Notice>
        ) : null}
      </div>
    </Modal>
  );
}
