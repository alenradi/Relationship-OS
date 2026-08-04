"use server";

import { revalidatePath } from "next/cache";

import { copy } from "@/lib/copy";
import type {
  DateIdeaCategory,
  MilestoneKind,
  TripStatus,
} from "@/lib/database.types";
import { requireCouple } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type FutureResult = { error?: string | null; title?: string };

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

function refresh() {
  revalidatePath("/future");
  revalidatePath("/");
}

export type DateIdeaInput = {
  id?: string;
  title: string;
  description: string;
  category: DateIdeaCategory;
  cost_level: number;
};

export async function saveDateIdeaAction(
  input: DateIdeaInput,
): Promise<FutureResult> {
  const { couple, user } = await requireCouple();
  const supabase = await createSupabaseServerClient();

  const title = input.title.trim();
  if (!title) return { error: copy.errors.required };

  const cost = Math.round(input.cost_level);
  const values = {
    title,
    description: input.description.trim(),
    category: DATE_CATEGORIES.includes(input.category) ? input.category : "other",
    cost_level: cost >= 1 && cost <= 3 ? cost : 2,
  };

  if (input.id) {
    const { error } = await supabase
      .from("date_ideas")
      .update(values)
      .eq("id", input.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("date_ideas").insert({
      ...values,
      couple_id: couple.id,
      created_by: user.id,
      status: "open",
    });
    if (error) return { error: error.message };
  }

  refresh();
  return {};
}

export async function pickDateIdeaAction(): Promise<FutureResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("pick_date_idea");
  if (error) return { error: error.message };
  refresh();
  return { title: data?.title };
}

export async function setDateIdeaStatusAction(
  id: string,
  status: "open" | "done",
): Promise<FutureResult> {
  const supabase = await createSupabaseServerClient();

  if (status === "open") {
    const { error } = await supabase
      .from("date_ideas")
      .update({ status: "open", last_picked_at: null })
      .eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("date_ideas")
      .update({ status: "done", done_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { error: error.message };
  }

  refresh();
  return {};
}

export type TripInput = {
  id?: string;
  destination: string;
  notes: string;
  budget_amount: number | null;
  currency: string;
  start_date: string | null;
  end_date: string | null;
  status: TripStatus;
};

export async function saveTripAction(input: TripInput): Promise<FutureResult> {
  const { couple, user } = await requireCouple();
  const supabase = await createSupabaseServerClient();

  const destination = input.destination.trim();
  if (!destination) return { error: copy.errors.required };

  const values = {
    destination,
    notes: input.notes.trim(),
    budget_amount: input.budget_amount,
    currency: input.currency.trim() || "EUR",
    start_date: input.start_date?.trim() || null,
    end_date: input.end_date?.trim() || null,
    status: TRIP_STATUSES.includes(input.status) ? input.status : "idea",
  };

  if (input.id) {
    const { error } = await supabase.from("trips").update(values).eq("id", input.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("trips").insert({
      ...values,
      couple_id: couple.id,
      created_by: user.id,
    });
    if (error) return { error: error.message };
  }

  refresh();
  return {};
}

export async function saveTripTaskAction(input: {
  tripId: string;
  title: string;
  assignee_id: string | null;
}): Promise<FutureResult> {
  const { couple } = await requireCouple();
  const supabase = await createSupabaseServerClient();

  const trimmed = input.title.trim();
  if (!trimmed) return { error: copy.errors.required };

  const { error } = await supabase.from("trip_tasks").insert({
    trip_id: input.tripId,
    couple_id: couple.id,
    title: trimmed,
    assignee_id: input.assignee_id || null,
  });

  if (error) return { error: error.message };
  refresh();
  return {};
}

export async function toggleTripTaskAction(
  taskId: string,
  done: boolean,
): Promise<FutureResult> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("trip_tasks")
    .update({ done })
    .eq("id", taskId);

  if (error) return { error: error.message };
  refresh();
  return {};
}

export async function saveTripActivityAction(input: {
  tripId: string;
  title: string;
}): Promise<FutureResult> {
  const { couple } = await requireCouple();
  const supabase = await createSupabaseServerClient();

  const trimmed = input.title.trim();
  if (!trimmed) return { error: copy.errors.required };

  const { count } = await supabase
    .from("trip_activities")
    .select("id", { count: "exact", head: true })
    .eq("trip_id", input.tripId);

  const { error } = await supabase.from("trip_activities").insert({
    trip_id: input.tripId,
    couple_id: couple.id,
    title: trimmed,
    sort_order: count ?? 0,
  });

  if (error) return { error: error.message };
  refresh();
  return {};
}

export async function toggleTripActivityAction(
  activityId: string,
  done: boolean,
): Promise<FutureResult> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("trip_activities")
    .update({ done })
    .eq("id", activityId);

  if (error) return { error: error.message };
  refresh();
  return {};
}

export type MilestoneInput = {
  id?: string;
  title: string;
  description: string;
  milestone_date: string;
  kind: MilestoneKind;
  recurs_annually: boolean;
};

export async function saveMilestoneAction(
  input: MilestoneInput,
): Promise<FutureResult> {
  const { couple, user } = await requireCouple();
  const supabase = await createSupabaseServerClient();

  const title = input.title.trim();
  if (!title) return { error: copy.errors.required };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.milestone_date)) {
    return { error: copy.errors.generic };
  }

  const values = {
    title,
    description: input.description.trim(),
    milestone_date: input.milestone_date,
    kind: MILESTONE_KINDS.includes(input.kind) ? input.kind : "event",
    recurs_annually: input.recurs_annually,
  };

  if (input.id) {
    const { error } = await supabase
      .from("milestones")
      .update(values)
      .eq("id", input.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("milestones").insert({
      ...values,
      couple_id: couple.id,
      created_by: user.id,
    });
    if (error) return { error: error.message };
  }

  refresh();
  return {};
}
