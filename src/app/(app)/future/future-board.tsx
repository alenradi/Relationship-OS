"use client";

import { useMemo, useState, useTransition } from "react";

import { PlusIcon } from "@/components/icons";
import { PhotoAlbum } from "@/components/photo-album";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Notice } from "@/components/ui/notice";
import { EmptyState, SectionHeading } from "@/components/ui/page";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import type {
  CoupleRow,
  DateIdeaCategory,
  DateIdeaRow,
  MilestoneKind,
  MilestoneRow,
  ProfileRow,
  TripActivityRow,
  TripRow,
  TripStatus,
  TripTaskRow,
} from "@/lib/database.types";
import {
  daysBetween,
  formatMediumDate,
  nextAnnualOccurrence,
  todayInAppTz,
  yearsBetween,
} from "@/lib/dates";
import { displayName } from "@/lib/people";
import type { PhotoWithUrl } from "@/lib/photos";

import {
  pickDateIdeaAction,
  saveDateIdeaAction,
  saveMilestoneAction,
  saveTripAction,
  saveTripActivityAction,
  saveTripTaskAction,
  setDateIdeaStatusAction,
  toggleTripActivityAction,
  toggleTripTaskAction,
} from "./actions";

const DATE_CATEGORIES: DateIdeaCategory[] = [
  "at_home",
  "out",
  "active",
  "culture",
  "food",
  "travel",
  "other",
];

const TRIP_STATUSES: TripStatus[] = ["idea", "planning", "booked", "done"];

const MILESTONE_KINDS: MilestoneKind[] = [
  "anniversary",
  "first",
  "event",
  "other",
];

export function FutureBoard({
  couple,
  me,
  partner,
  ideas,
  trips,
  tasks,
  activities,
  milestones,
  photos,
}: {
  couple: CoupleRow;
  me: ProfileRow;
  partner: ProfileRow | null;
  ideas: DateIdeaRow[];
  trips: TripRow[];
  tasks: TripTaskRow[];
  activities: TripActivityRow[];
  milestones: MilestoneRow[];
  photos: PhotoWithUrl[];
}) {
  const members = partner ? [me, partner] : [me];

  return (
    <div className="space-y-12">
      <DateJarSection ideas={ideas} members={members} photos={photos} />
      <TripsSection
        trips={trips}
        tasks={tasks}
        activities={activities}
        members={members}
        partner={partner}
        photos={photos}
      />
      <MilestonesSection
        coupleCreatedAt={couple.created_at}
        milestones={milestones}
        photos={photos}
      />
    </div>
  );
}

// -----------------------------------------------------------------------------
// Date jar
// -----------------------------------------------------------------------------

function DateIdeaEditor({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<DateIdeaCategory>("other");
  const [costLevel, setCostLevel] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveDateIdeaAction({
        title,
        description,
        category,
        cost_level: costLevel,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={copy.future.addDateIdea}
      footer={
        <>
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
        <Field label={copy.future.dateIdeaTitle} htmlFor="date-title">
          <Input
            id="date-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={copy.future.dateIdeaTitlePlaceholder}
          />
        </Field>
        <Field label={copy.future.dateIdeaDescription} htmlFor="date-desc" optional>
          <Textarea
            id="date-desc"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={copy.future.dateIdeaDescriptionPlaceholder}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={copy.future.dateIdeaCategory} htmlFor="date-category">
            <Select
              id="date-category"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as DateIdeaCategory)
              }
            >
              {DATE_CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {copy.future.dateCategories[option]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={copy.future.dateIdeaCost} htmlFor="date-cost">
            <Select
              id="date-cost"
              value={costLevel}
              onChange={(event) => setCostLevel(Number(event.target.value))}
            >
              {[1, 2, 3].map((level) => (
                <option key={level} value={level}>
                  {copy.future.costLevels[level as 1 | 2 | 3]}
                </option>
              ))}
            </Select>
          </Field>
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

function DateJarSection({
  ideas,
  members,
  photos,
}: {
  ideas: DateIdeaRow[];
  members: ProfileRow[];
  photos: PhotoWithUrl[];
}) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const openIdeas = ideas.filter((i) => i.status === "open");
  const picked = ideas.find((i) => i.status === "picked") ?? null;
  const done = ideas.filter((i) => i.status === "done");

  const nameFor = (id: string | null) => {
    if (!id) return "";
    return displayName(members.find((m) => m.id === id));
  };

  function pick() {
    setError(null);
    startTransition(async () => {
      const result = await pickDateIdeaAction();
      if (result.error) setError(result.error);
    });
  }

  return (
    <section className="space-y-4">
      <SectionHeading
        title={copy.future.dateJarTitle}
        description={copy.future.dateJarSubtitle}
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={pick}
              disabled={pending || openIdeas.length === 0}
            >
              {pending ? copy.future.picking : copy.future.pickForUs}
            </Button>
            <Button size="sm" onClick={() => setCreating(true)}>
              <PlusIcon className="size-4" />
              {copy.future.addDateIdea}
            </Button>
          </>
        }
      />

      {error ? (
        <Notice tone="accent" role="alert">
          {error}
        </Notice>
      ) : null}

      {picked ? (
        <Card tone="accent" className="space-y-3">
          <p className="text-xs font-semibold tracking-wide text-accent-ink uppercase">
            {copy.future.pickedTitle}
          </p>
          <h3 className="text-lg text-pretty">{picked.title}</h3>
          {picked.description ? (
            <p className="text-sm text-ink-soft text-pretty">{picked.description}</p>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await setDateIdeaStatusAction(picked.id, "done");
                })
              }
            >
              {copy.future.markDateDone}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await setDateIdeaStatusAction(picked.id, "open");
                })
              }
            >
              {copy.future.putBack}
            </Button>
          </div>
          <PhotoAlbum
            subjectType="date_idea"
            subjectId={picked.id}
            photos={photos}
            compact
          />
        </Card>
      ) : null}

      <p className="text-xs text-ink-faint">{copy.future.openIdeas(openIdeas.length)}</p>

      {openIdeas.length === 0 && !picked ? (
        <EmptyState
          title={copy.future.dateJarEmpty}
          action={
            <Button onClick={() => setCreating(true)}>
              {copy.future.addDateIdea}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {openIdeas.map((idea) => (
            <Card key={idea.id} className="flex flex-col gap-2">
              <h4 className="text-sm font-medium text-pretty">{idea.title}</h4>
              {idea.description ? (
                <p className="text-xs leading-relaxed text-ink-soft text-pretty">
                  {idea.description}
                </p>
              ) : null}
              <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                <Badge tone="outline">
                  {copy.future.dateCategories[idea.category]}
                </Badge>
                {idea.created_by ? (
                  <span className="text-xs text-ink-faint">
                    {copy.future.addedBy(nameFor(idea.created_by))}
                  </span>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}

      {done.length > 0 ? (
        <div className="space-y-3 pt-4">
          <h3 className="text-sm font-medium text-ink-soft">{copy.future.doneIdeas}</h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {done.map((idea) => (
              <li
                key={idea.id}
                className="space-y-2 rounded-xl border border-line bg-surface px-4 py-3"
              >
                <p className="text-sm font-medium text-ink text-pretty">{idea.title}</p>
                <PhotoAlbum
                  subjectType="date_idea"
                  subjectId={idea.id}
                  photos={photos}
                  compact
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {creating ? (
        <DateIdeaEditor open onClose={() => setCreating(false)} />
      ) : null}
    </section>
  );
}

// -----------------------------------------------------------------------------
// Trips
// -----------------------------------------------------------------------------

function TripEditor({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [destination, setDestination] = useState("");
  const [notes, setNotes] = useState("");
  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<TripStatus>("idea");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const budgetAmount = budget.trim() ? Number(budget) : null;
      const result = await saveTripAction({
        destination,
        notes,
        budget_amount:
          budgetAmount !== null && Number.isFinite(budgetAmount) ? budgetAmount : null,
        currency,
        start_date: startDate || null,
        end_date: endDate || null,
        status,
      });
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={copy.future.addTrip}
      footer={
        <>
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
        <Field label={copy.future.tripDestination} htmlFor="trip-destination">
          <Input
            id="trip-destination"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            placeholder={copy.future.tripDestinationPlaceholder}
          />
        </Field>
        <Field label={copy.future.tripNotes} htmlFor="trip-notes" optional>
          <Textarea
            id="trip-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={copy.future.tripNotesPlaceholder}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={copy.future.tripBudget} htmlFor="trip-budget" optional>
            <Input
              id="trip-budget"
              type="number"
              min={0}
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
            />
          </Field>
          <Field label={copy.future.tripCurrency} htmlFor="trip-currency">
            <Input
              id="trip-currency"
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={copy.future.tripStart} htmlFor="trip-start" optional>
            <Input
              id="trip-start"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </Field>
          <Field label={copy.future.tripEnd} htmlFor="trip-end" optional>
            <Input
              id="trip-end"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </Field>
        </div>
        <Field label={copy.future.tripStatus} htmlFor="trip-status">
          <Select
            id="trip-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as TripStatus)}
          >
            {TRIP_STATUSES.map((option) => (
              <option key={option} value={option}>
                {copy.future.tripStatuses[option]}
              </option>
            ))}
          </Select>
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

function TripCard({
  trip,
  tasks,
  activities,
  members,
  partner,
  photos,
}: {
  trip: TripRow;
  tasks: TripTaskRow[];
  activities: TripActivityRow[];
  members: ProfileRow[];
  partner: ProfileRow | null;
  photos: PhotoWithUrl[];
}) {
  const today = todayInAppTz();
  const [taskTitle, setTaskTitle] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [activityTitle, setActivityTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const doneTasks = tasks.filter((t) => t.done).length;

  const dateLabel =
    trip.start_date && trip.end_date
      ? copy.future.tripDates(
          `${formatMediumDate(trip.start_date)} – ${formatMediumDate(trip.end_date)}`,
        )
      : trip.start_date
        ? formatMediumDate(trip.start_date)
        : copy.future.tripNoDates;

  const countdown = trip.start_date
    ? copy.future.tripCountdown(daysBetween(today, trip.start_date))
    : null;

  const nameFor = (id: string | null) => {
    if (!id) return copy.future.tripTaskUnassigned;
    return displayName(members.find((m) => m.id === id) ?? partner);
  };

  return (
    <Card className="flex flex-col gap-4">
      <div className="space-y-1">
        <h3 className="text-lg text-pretty">{trip.destination}</h3>
        <p className="text-xs text-ink-faint">{dateLabel}</p>
        {countdown ? (
          <p className="text-xs font-medium text-accent-ink">{countdown}</p>
        ) : null}
      </div>

      {trip.notes ? (
        <p className="text-sm leading-relaxed text-ink-soft text-pretty">{trip.notes}</p>
      ) : null}

      <PhotoAlbum subjectType="trip" subjectId={trip.id} photos={photos} />

      <div className="flex flex-wrap gap-2">
        <Badge tone="accent">{copy.future.tripStatuses[trip.status]}</Badge>
        {trip.budget_amount !== null ? (
          <Badge tone="outline">
            {trip.budget_amount} {trip.currency}
          </Badge>
        ) : null}
      </div>

      <div className="space-y-3 border-t border-line pt-4">
        <div>
          <p className="text-sm font-medium">{copy.future.tripTasksTitle}</p>
          <p className="text-xs text-ink-faint">{copy.future.tripTasksHelp}</p>
          {tasks.length > 0 ? (
            <p className="mt-1 text-xs text-ink-faint">
              {copy.future.tripTasksProgress(doneTasks, tasks.length)}
            </p>
          ) : null}
        </div>

        {tasks.length === 0 ? (
          <p className="text-sm text-ink-faint">{copy.future.tripTasksEmpty}</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={task.done}
                  disabled={pending}
                  onChange={(event) =>
                    startTransition(async () => {
                      await toggleTripTaskAction(task.id, event.target.checked);
                    })
                  }
                  className="mt-1 size-4 rounded accent-accent"
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm",
                      task.done ? "text-ink-faint line-through" : "text-ink-soft",
                    )}
                  >
                    {task.title}
                  </p>
                  <p className="text-xs text-ink-faint">
                    {copy.future.tripTaskAssignee}: {nameFor(task.assignee_id)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={taskTitle}
            onChange={(event) => setTaskTitle(event.target.value)}
            placeholder={copy.future.tripTaskPlaceholder}
          />
          <Select
            value={taskAssignee}
            onChange={(event) => setTaskAssignee(event.target.value)}
            className="sm:max-w-[10rem]"
          >
            <option value="">{copy.future.tripTaskUnassigned}</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {displayName(member)}
              </option>
            ))}
          </Select>
          <Button
            size="sm"
            onClick={() =>
              startTransition(async () => {
                const result = await saveTripTaskAction({
                  tripId: trip.id,
                  title: taskTitle,
                  assignee_id: taskAssignee || null,
                });
                if (result.error) setError(result.error);
                else setTaskTitle("");
              })
            }
            disabled={pending}
          >
            {copy.future.addTripTask}
          </Button>
        </div>
      </div>

      <div className="space-y-3 border-t border-line pt-4">
        <div>
          <p className="text-sm font-medium">{copy.future.tripActivitiesTitle}</p>
          <p className="text-xs text-ink-faint">{copy.future.tripActivitiesHelp}</p>
        </div>

        {activities.length === 0 ? (
          <p className="text-sm text-ink-faint">{copy.future.tripActivitiesEmpty}</p>
        ) : (
          <ul className="space-y-2">
            {activities.map((activity) => (
              <li key={activity.id} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={activity.done}
                  disabled={pending}
                  onChange={(event) =>
                    startTransition(async () => {
                      await toggleTripActivityAction(
                        activity.id,
                        event.target.checked,
                      );
                    })
                  }
                  className="mt-1 size-4 rounded accent-accent"
                />
                <span
                  className={cn(
                    "flex-1 text-sm",
                    activity.done
                      ? "text-ink-faint line-through"
                      : "text-ink-soft",
                  )}
                >
                  {activity.title}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2">
          <Input
            value={activityTitle}
            onChange={(event) => setActivityTitle(event.target.value)}
            placeholder={copy.future.tripActivityPlaceholder}
          />
          <Button
            size="sm"
            onClick={() =>
              startTransition(async () => {
                const result = await saveTripActivityAction({
                  tripId: trip.id,
                  title: activityTitle,
                });
                if (result.error) setError(result.error);
                else setActivityTitle("");
              })
            }
            disabled={pending}
          >
            {copy.future.addTripActivity}
          </Button>
        </div>
      </div>

      {error ? (
        <Notice tone="accent" role="alert">
          {error}
        </Notice>
      ) : null}
    </Card>
  );
}

function TripsSection({
  trips,
  tasks,
  activities,
  members,
  partner,
  photos,
}: {
  trips: TripRow[];
  tasks: TripTaskRow[];
  activities: TripActivityRow[];
  members: ProfileRow[];
  partner: ProfileRow | null;
  photos: PhotoWithUrl[];
}) {
  const [creating, setCreating] = useState(false);

  const sortedTrips = useMemo(
    () =>
      [...trips].sort((a, b) => {
        if (a.start_date && b.start_date) {
          return a.start_date.localeCompare(b.start_date);
        }
        return a.created_at.localeCompare(b.created_at);
      }),
    [trips],
  );

  return (
    <section className="space-y-4">
      <SectionHeading
        title={copy.future.tripsTitle}
        description={copy.future.tripsSubtitle}
        actions={
          <Button size="sm" onClick={() => setCreating(true)}>
            <PlusIcon className="size-4" />
            {copy.future.addTrip}
          </Button>
        }
      />

      {sortedTrips.length === 0 ? (
        <EmptyState
          title={copy.future.tripsEmpty}
          action={
            <Button onClick={() => setCreating(true)}>{copy.future.addTrip}</Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {sortedTrips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              tasks={tasks.filter((t) => t.trip_id === trip.id)}
              activities={activities.filter((a) => a.trip_id === trip.id)}
              members={members}
              photos={photos}
              partner={partner}
            />
          ))}
        </div>
      )}

      {creating ? <TripEditor open onClose={() => setCreating(false)} /> : null}
    </section>
  );
}

// -----------------------------------------------------------------------------
// Milestones
// -----------------------------------------------------------------------------

function MilestoneEditor({
  open,
  initial,
  onClose,
}: {
  open: boolean;
  initial?: {
    title: string;
    description: string;
    milestone_date: string;
    kind: MilestoneKind;
    recurs_annually: boolean;
  };
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [milestoneDate, setMilestoneDate] = useState(initial?.milestone_date ?? "");
  const [kind, setKind] = useState<MilestoneKind>(initial?.kind ?? "event");
  const [recursAnnually, setRecursAnnually] = useState(
    initial?.recurs_annually ?? false,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveMilestoneAction({
        title,
        description,
        milestone_date: milestoneDate,
        kind,
        recurs_annually: recursAnnually,
      });
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={copy.future.addMilestone}
      footer={
        <>
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
        <Field label={copy.future.milestoneTitle} htmlFor="ms-title">
          <Input
            id="ms-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={copy.future.milestoneTitlePlaceholder}
          />
        </Field>
        <Field label={copy.future.milestoneDescription} htmlFor="ms-desc" optional>
          <Textarea
            id="ms-desc"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
        <Field label={copy.future.milestoneDate} htmlFor="ms-date">
          <Input
            id="ms-date"
            type="date"
            value={milestoneDate}
            onChange={(event) => setMilestoneDate(event.target.value)}
          />
        </Field>
        <Field label={copy.future.milestoneKind} htmlFor="ms-kind">
          <Select
            id="ms-kind"
            value={kind}
            onChange={(event) => setKind(event.target.value as MilestoneKind)}
          >
            {MILESTONE_KINDS.map((option) => (
              <option key={option} value={option}>
                {copy.future.milestoneKinds[option]}
              </option>
            ))}
          </Select>
        </Field>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={recursAnnually}
            onChange={(event) => setRecursAnnually(event.target.checked)}
            className="size-4 rounded accent-accent"
          />
          {copy.future.milestoneRecurs}
        </label>
        {error ? (
          <Notice tone="accent" role="alert">
            {error}
          </Notice>
        ) : null}
      </div>
    </Modal>
  );
}

function MilestoneItem({
  milestone,
  today,
  photos,
}: {
  milestone: MilestoneRow;
  today: string;
  photos: PhotoWithUrl[];
}) {
  const displayDate = milestone.recurs_annually
    ? nextAnnualOccurrence(milestone.milestone_date, today)
    : milestone.milestone_date;

  const daysAway = daysBetween(today, displayDate);
  const isUpcoming = daysAway >= 0;

  const years = milestone.recurs_annually
    ? yearsBetween(milestone.milestone_date, displayDate)
    : 0;

  const timingLabel = isUpcoming
    ? copy.future.inDays(daysAway)
    : copy.future.yearsAgo(
        Math.max(
          1,
          yearsBetween(
            milestone.milestone_date,
            milestone.recurs_annually ? displayDate : today,
          ),
        ),
      );

  return (
    <li className="flex flex-col gap-1 rounded-xl border border-line bg-surface px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-pretty">{milestone.title}</h4>
        <Badge tone={isUpcoming ? "accent" : "outline"}>{timingLabel}</Badge>
      </div>
      <p className="text-xs text-ink-faint">{formatMediumDate(displayDate)}</p>
      {milestone.description ? (
        <p className="text-sm text-ink-soft text-pretty">{milestone.description}</p>
      ) : null}
      <div className="flex flex-wrap gap-2 pt-1">
        <Badge tone="outline">{copy.future.milestoneKinds[milestone.kind]}</Badge>
        {years > 0 ? (
          <Badge tone="sage">{copy.future.anniversaryYears(years)}</Badge>
        ) : null}
      </div>
      <PhotoAlbum
        subjectType="milestone"
        subjectId={milestone.id}
        photos={photos}
        compact
      />
    </li>
  );
}

function MilestonesSection({
  coupleCreatedAt,
  milestones,
  photos,
}: {
  coupleCreatedAt: string;
  milestones: MilestoneRow[];
  photos: PhotoWithUrl[];
}) {
  const today = todayInAppTz();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const startedUsDate = coupleCreatedAt.slice(0, 10);
  const hasStartedUs = milestones.some(
    (m) =>
      m.milestone_date === startedUsDate &&
      m.title === copy.future.suggestStartedUs,
  );

  // Suggest an anniversary on the same civil date next year if none exists yet.
  const anniversaryDate = startedUsDate;
  const hasAnniversary = milestones.some(
    (m) =>
      m.kind === "anniversary" ||
      m.title === copy.future.suggestAnniversary,
  );

  const { upcoming, past } = useMemo(() => {
    const up: MilestoneRow[] = [];
    const back: MilestoneRow[] = [];

    for (const milestone of milestones) {
      const date = milestone.recurs_annually
        ? nextAnnualOccurrence(milestone.milestone_date, today)
        : milestone.milestone_date;
      if (daysBetween(today, date) >= 0) up.push(milestone);
      else back.push(milestone);
    }

    up.sort((a, b) => {
      const da = a.recurs_annually
        ? nextAnnualOccurrence(a.milestone_date, today)
        : a.milestone_date;
      const db = b.recurs_annually
        ? nextAnnualOccurrence(b.milestone_date, today)
        : b.milestone_date;
      return da.localeCompare(db);
    });

    back.sort((a, b) => b.milestone_date.localeCompare(a.milestone_date));

    return { upcoming: up, past: back };
  }, [milestones, today]);

  function addStartedUs() {
    setError(null);
    startTransition(async () => {
      const result = await saveMilestoneAction({
        title: copy.future.suggestStartedUs,
        description: copy.future.suggestStartedUsBody,
        milestone_date: startedUsDate,
        kind: "first",
        recurs_annually: true,
      });
      if (result.error) setError(result.error);
    });
  }

  function addAnniversary() {
    setError(null);
    startTransition(async () => {
      const result = await saveMilestoneAction({
        title: copy.future.suggestAnniversary,
        description: copy.future.suggestStartedUsBody,
        milestone_date: anniversaryDate,
        kind: "anniversary",
        recurs_annually: true,
      });
      if (result.error) setError(result.error);
    });
  }

  const showSuggestions = !hasStartedUs || !hasAnniversary;

  return (
    <section className="space-y-4">
      <SectionHeading
        title={copy.future.milestonesTitle}
        description={copy.future.milestonesSubtitle}
        actions={
          <Button size="sm" onClick={() => setCreating(true)}>
            <PlusIcon className="size-4" />
            {copy.future.addMilestone}
          </Button>
        }
      />

      {error ? (
        <Notice tone="accent" role="alert">
          {error}
        </Notice>
      ) : null}

      {showSuggestions ? (
        <div className="space-y-2 rounded-2xl border border-line bg-surface-muted p-4">
          <p className="text-sm font-medium">{copy.future.suggestHeading}</p>
          <p className="text-xs text-ink-faint">{copy.future.suggestHelp}</p>
          {!hasStartedUs ? (
            <Card className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">{copy.future.suggestStartedUs}</p>
                <p className="text-xs text-ink-faint">
                  {copy.future.suggestStartedUsBody}
                </p>
                <p className="mt-1 text-xs text-ink-faint">
                  {formatMediumDate(startedUsDate)}
                </p>
              </div>
              <Button size="sm" disabled={pending} onClick={addStartedUs}>
                {copy.future.suggestAdd}
              </Button>
            </Card>
          ) : null}
          {!hasAnniversary ? (
            <Card className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">
                  {copy.future.suggestAnniversary}
                </p>
                <p className="text-xs text-ink-faint">
                  Recurring each year from when this space began.
                </p>
                <p className="mt-1 text-xs text-ink-faint">
                  {formatMediumDate(anniversaryDate)}
                </p>
              </div>
              <Button size="sm" disabled={pending} onClick={addAnniversary}>
                {copy.future.suggestAdd}
              </Button>
            </Card>
          ) : null}
        </div>
      ) : null}

      {milestones.length === 0 ? (
        <EmptyState
          title={copy.future.milestonesEmpty}
          action={
            <Button onClick={() => setCreating(true)}>
              {copy.future.addMilestone}
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-ink-soft">
                {copy.future.upcomingHeading}
              </h3>
              <ul className="space-y-2">
                {upcoming.map((milestone) => (
                  <MilestoneItem
                    key={milestone.id}
                    milestone={milestone}
                    today={today}
                    photos={photos}
                  />
                ))}
              </ul>
            </div>
          ) : null}

          {past.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-ink-soft">
                {copy.future.pastHeading}
              </h3>
              <ul className="space-y-2">
                {past.map((milestone) => (
                  <MilestoneItem
                    key={milestone.id}
                    milestone={milestone}
                    today={today}
                    photos={photos}
                  />
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      {creating ? (
        <MilestoneEditor open onClose={() => setCreating(false)} />
      ) : null}
    </section>
  );
}
