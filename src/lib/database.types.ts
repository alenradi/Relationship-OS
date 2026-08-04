/**
 * Hand-maintained mirror of supabase/migrations. Kept by hand rather than
 * generated so the repo type-checks before a Supabase project even exists.
 *
 * If you change a migration, change the matching row type here.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Pronoun = "she" | "he" | "they";

export type RuleCategory =
  | "communication"
  | "alone_time"
  | "boundaries"
  | "fighting_fair"
  | "other";
export type RuleStatus = "active" | "renegotiated" | "retired";

export type GoalType = "personal" | "relationship";
export type GoalStatus = "active" | "achieved" | "paused" | "archived";

export type FollowUpStatus = "pending" | "worked" | "partly" | "didnt_work";

export type DateIdeaCategory =
  | "at_home"
  | "out"
  | "active"
  | "culture"
  | "food"
  | "travel"
  | "other";
export type DateIdeaStatus = "open" | "picked" | "done" | "archived";

export type TripStatus = "idea" | "planning" | "booked" | "done";
export type MilestoneKind = "anniversary" | "first" | "event" | "other";

export type CoupleEventKind =
  | "rule_created"
  | "rule_updated"
  | "daily_status_logged"
  | "reflection_submitted"
  | "reflection_revealed"
  | "goal_created"
  | "goal_achieved"
  | "goal_cheered"
  | "conflict_logged"
  | "conflict_followed_up"
  | "date_idea_added"
  | "date_picked"
  | "date_done"
  | "milestone_added";

/** One entry in daily_status.busy_blocks — free-text label like "work 8-16". */
export type BusyBlock = {
  label: string;
  /** Optional structured times; usually derived from the label when present. */
  start?: string;
  end?: string;
};

/** One entry in goals.milestones. */
export type GoalMilestone = {
  id: string;
  title: string;
  done: boolean;
  due?: string | null;
};

/** weekly_reflections.answers — keyed by prompt id from copy.ts. */
export type ReflectionAnswers = Record<string, string | number | null>;

type Timestamps = {
  created_at: string;
  updated_at: string;
};

export type CoupleRow = {
  id: string;
  invite_code: string;
  onboarding_completed_at: string | null;
  constitution_reviewed_at: string | null;
} & Timestamps;

export type ProfileRow = {
  id: string;
  couple_id: string | null;
  display_name: string;
  pronoun: Pronoun;
} & Timestamps;

export type CoupleEventRow = {
  id: string;
  couple_id: string;
  actor_id: string | null;
  kind: CoupleEventKind;
  payload: Json;
  created_at: string;
};

export type RuleRow = {
  id: string;
  couple_id: string;
  title: string;
  description: string;
  why_agreed: string;
  category: RuleCategory;
  status: RuleStatus;
  version: number;
  change_note: string;
  sort_order: number;
  created_by: string | null;
} & Timestamps;

export type RuleVersionRow = {
  id: string;
  rule_id: string;
  couple_id: string;
  version: number;
  title: string;
  description: string;
  why_agreed: string;
  category: RuleCategory;
  status: RuleStatus;
  change_note: string;
  changed_by: string | null;
  created_at: string;
};

export type DailyStatusRow = {
  id: string;
  couple_id: string;
  user_id: string;
  status_date: string;
  busy_blocks: BusyBlock[];
  busy_score: number;
  note: string;
} & Timestamps;

export type WeeklyReflectionRow = {
  id: string;
  couple_id: string;
  user_id: string;
  week_start: string;
  answers: ReflectionAnswers;
  journal: string;
  submitted_at: string | null;
} & Timestamps;

export type GoalRow = {
  id: string;
  couple_id: string;
  goal_type: GoalType;
  owner_id: string | null;
  title: string;
  why_it_matters: string;
  milestones: GoalMilestone[];
  target_date: string | null;
  status: GoalStatus;
  created_by: string | null;
} & Timestamps;

export type GoalUpdateRow = {
  id: string;
  goal_id: string;
  couple_id: string;
  author_id: string;
  body: string;
  progress_percent: number | null;
  created_at: string;
};

export type GoalCheerRow = {
  id: string;
  goal_id: string;
  couple_id: string;
  from_user: string;
  message: string;
  created_at: string;
};

export type ConflictRow = {
  id: string;
  couple_id: string;
  title: string;
  happened_on: string | null;
  what_it_was_about: string;
  perspective_a_user: string | null;
  perspective_a: string;
  perspective_b_user: string | null;
  perspective_b: string;
  trigger_note: string;
  resolution: string;
  agreed_action: string;
  follow_up_date: string | null;
  follow_up_status: FollowUpStatus;
  follow_up_note: string;
  created_by: string | null;
} & Timestamps;

export type DateIdeaRow = {
  id: string;
  couple_id: string;
  title: string;
  description: string;
  category: DateIdeaCategory;
  cost_level: number;
  status: DateIdeaStatus;
  created_by: string | null;
  last_picked_at: string | null;
  done_at: string | null;
} & Timestamps;

export type TripRow = {
  id: string;
  couple_id: string;
  destination: string;
  notes: string;
  budget_amount: number | null;
  currency: string;
  start_date: string | null;
  end_date: string | null;
  status: TripStatus;
  created_by: string | null;
} & Timestamps;

export type TripTaskRow = {
  id: string;
  trip_id: string;
  couple_id: string;
  title: string;
  assignee_id: string | null;
  done: boolean;
  due_date: string | null;
} & Timestamps;

export type TripActivityRow = {
  id: string;
  trip_id: string;
  couple_id: string;
  title: string;
  notes: string;
  done: boolean;
  sort_order: number;
} & Timestamps;

export type MilestoneRow = {
  id: string;
  couple_id: string;
  title: string;
  description: string;
  milestone_date: string;
  kind: MilestoneKind;
  recurs_annually: boolean;
  created_by: string | null;
} & Timestamps;

/** Column defaults mean almost everything is optional on insert. */
type Insertable<T, Required extends keyof T = never> = Partial<
  Omit<T, "id" | "created_at" | "updated_at">
> &
  Pick<T, Required>;

type TableDef<Row, Ins, Upd> = {
  Row: Row;
  Insert: Ins;
  Update: Upd;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      couples: TableDef<
        CoupleRow,
        Insertable<CoupleRow, "invite_code">,
        Partial<CoupleRow>
      >;
      profiles: TableDef<
        ProfileRow,
        Insertable<ProfileRow, "id">,
        Partial<ProfileRow>
      >;
      couple_events: TableDef<
        CoupleEventRow,
        Insertable<CoupleEventRow, "kind">,
        Partial<CoupleEventRow>
      >;
      rules: TableDef<RuleRow, Insertable<RuleRow, "title">, Partial<RuleRow>>;
      rule_versions: TableDef<
        RuleVersionRow,
        Insertable<RuleVersionRow, "rule_id" | "version" | "title">,
        Partial<RuleVersionRow>
      >;
      daily_status: TableDef<
        DailyStatusRow,
        Insertable<DailyStatusRow, "status_date">,
        Partial<DailyStatusRow>
      >;
      weekly_reflections: TableDef<
        WeeklyReflectionRow,
        Insertable<WeeklyReflectionRow, "week_start">,
        Partial<WeeklyReflectionRow>
      >;
      goals: TableDef<GoalRow, Insertable<GoalRow, "title">, Partial<GoalRow>>;
      goal_updates: TableDef<
        GoalUpdateRow,
        Insertable<GoalUpdateRow, "goal_id">,
        Partial<GoalUpdateRow>
      >;
      goal_cheers: TableDef<
        GoalCheerRow,
        Insertable<GoalCheerRow, "goal_id">,
        Partial<GoalCheerRow>
      >;
      conflicts: TableDef<
        ConflictRow,
        Insertable<ConflictRow, "title">,
        Partial<ConflictRow>
      >;
      date_ideas: TableDef<
        DateIdeaRow,
        Insertable<DateIdeaRow, "title">,
        Partial<DateIdeaRow>
      >;
      trips: TableDef<
        TripRow,
        Insertable<TripRow, "destination">,
        Partial<TripRow>
      >;
      trip_tasks: TableDef<
        TripTaskRow,
        Insertable<TripTaskRow, "trip_id" | "title">,
        Partial<TripTaskRow>
      >;
      trip_activities: TableDef<
        TripActivityRow,
        Insertable<TripActivityRow, "trip_id" | "title">,
        Partial<TripActivityRow>
      >;
      milestones: TableDef<
        MilestoneRow,
        Insertable<MilestoneRow, "title" | "milestone_date">,
        Partial<MilestoneRow>
      >;
    };
    Views: Record<never, never>;
    Functions: {
      create_couple_space: {
        Args: Record<string, never>;
        Returns: CoupleRow;
      };
      join_couple_with_code: {
        Args: { p_code: string };
        Returns: CoupleRow;
      };
      current_couple_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      partner_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      has_submitted_reflection: {
        Args: { p_week: string; p_user: string };
        Returns: boolean;
      };
      reflection_is_revealed: {
        Args: { p_week: string };
        Returns: boolean;
      };
      reflection_submission_status: {
        Args: { p_week: string };
        Returns: {
          user_id: string;
          submitted_at: string | null;
          has_draft: boolean;
        }[];
      };
      reflection_weeks_overview: {
        Args: Record<string, never>;
        Returns: {
          week_start: string;
          submitted_count: number;
          both_submitted: boolean;
          revealed_at: string | null;
        }[];
      };
      pick_date_idea: {
        Args: Record<string, never>;
        Returns: DateIdeaRow;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
