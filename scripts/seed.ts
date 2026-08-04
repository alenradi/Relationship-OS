/**
 * Seed script — creates two demo accounts (Ilaria + Alen) and realistic sample
 * data so you can click through the whole app immediately.
 *
 * Requires .env.local with a NEW Supabase project's URL + service role key,
 * and all migrations applied (0001 → 0009).
 *
 * Usage: npm run seed
 */

import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import {
  addDays,
  currentWeekStart,
  todayInAppTz,
} from "../src/lib/dates";

const DEMO = {
  ilaria: {
    email: "ilaria@demo.us",
    password: "demo-demo-12",
    display_name: "Ilaria",
  },
  alen: {
    email: "alen@demo.us",
    password: "demo-demo-12",
    display_name: "Alen",
  },
} as const;

async function upsertUser(email: string, password: string, display_name: string) {
  const admin = createSupabaseAdminClient();

  const listed = await admin.auth.admin.listUsers({ perPage: 200 });
  const existing = listed.data.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );

  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { display_name },
    });
    await admin
      .from("profiles")
      .update({ display_name })
      .eq("id", existing.id);
    return existing.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name },
  });
  if (error || !data.user) {
    throw new Error(`Failed to create ${email}: ${error?.message}`);
  }

  await admin.from("profiles").update({ display_name }).eq("id", data.user.id);
  return data.user.id;
}

async function main() {
  console.log("Seeding Us demo data…");

  const admin = createSupabaseAdminClient();
  const today = todayInAppTz();
  const weekStart = currentWeekStart();
  const prevWeek = addDays(weekStart, -7);

  const ilariaId = await upsertUser(
    DEMO.ilaria.email,
    DEMO.ilaria.password,
    DEMO.ilaria.display_name,
  );
  const alenId = await upsertUser(
    DEMO.alen.email,
    DEMO.alen.password,
    DEMO.alen.display_name,
  );

  // Clear any existing couple links for a clean demo.
  await admin.from("profiles").update({ couple_id: null }).in("id", [
    ilariaId,
    alenId,
  ]);

  const inviteCode = "ILARALEN";
  const { data: existingCouple } = await admin
    .from("couples")
    .select("*")
    .eq("invite_code", inviteCode)
    .maybeSingle();

  let coupleId = existingCouple?.id;

  if (!coupleId) {
    const { data: couple, error } = await admin
      .from("couples")
      .insert({
        invite_code: inviteCode,
        onboarding_completed_at: new Date().toISOString(),
        constitution_reviewed_at: addDays(today, -35) + "T12:00:00.000Z",
      })
      .select("*")
      .single();
    if (error || !couple) throw new Error(error?.message ?? "couple insert failed");
    coupleId = couple.id;
  } else {
    await admin
      .from("couples")
      .update({
        onboarding_completed_at: new Date().toISOString(),
        constitution_reviewed_at: addDays(today, -35) + "T12:00:00.000Z",
      })
      .eq("id", coupleId);
  }

  await admin
    .from("profiles")
    .update({ couple_id: coupleId, display_name: DEMO.ilaria.display_name })
    .eq("id", ilariaId);
  await admin
    .from("profiles")
    .update({ couple_id: coupleId, display_name: DEMO.alen.display_name })
    .eq("id", alenId);

  // Wipe couple-scoped demo rows so re-seeding is idempotent.
  for (const table of [
    "goal_cheers",
    "goal_updates",
    "goals",
    "conflicts",
    "date_ideas",
    "trip_activities",
    "trip_tasks",
    "trips",
    "milestones",
    "weekly_reflections",
    "daily_status",
    "rule_versions",
    "rules",
  ] as const) {
    await admin.from(table).delete().eq("couple_id", coupleId);
  }

  const rules = [
    {
      title: "We say the thing while it's still small",
      description:
        "If something stings, we mention it within a day or two instead of filing it away.",
      why_agreed:
        "Because saved-up resentment always comes out sideways, and about something unrelated.",
      category: "communication" as const,
    },
    {
      title: "Alone time isn't a rejection",
      description:
        "We each get evenings to ourselves without needing a reason or an apology.",
      why_agreed:
        "Because we both come back nicer, and needing space isn't needing less of each other.",
      category: "alone_time" as const,
    },
    {
      title: "No “always” and no “never”",
      description:
        "We talk about the specific thing that happened, not a pattern we're accusing the other of.",
      why_agreed:
        "Because absolutes turn a fixable moment into a character verdict.",
      category: "fighting_fair" as const,
    },
    {
      title: "Busy days get announced, not discovered",
      description:
        "If a day is going to be brutal, we say so in the morning rather than going quiet.",
      why_agreed:
        "Because silence gets read as distance when it's really just a full calendar.",
      category: "alone_time" as const,
    },
  ];

  for (const [index, rule] of rules.entries()) {
    await admin.from("rules").insert({
      couple_id: coupleId,
      created_by: index % 2 === 0 ? ilariaId : alenId,
      sort_order: index,
      ...rule,
    });
  }

  // Daily rhythm — today + a few past days (past days exist for history).
  const dayEntries = [
    {
      user_id: ilariaId,
      status_date: today,
      busy_score: 8,
      busy_blocks: [{ label: "work 8-16" }, { label: "gym 17-18" }],
      note: "Heavy delivery day — slow on replies until evening.",
    },
    {
      user_id: alenId,
      status_date: today,
      busy_score: 4,
      busy_blocks: [{ label: "deep work 9-12" }, { label: "free after 14" }],
      note: "Light afternoon — good for a walk.",
    },
    {
      user_id: ilariaId,
      status_date: addDays(today, -1),
      busy_score: 6,
      busy_blocks: [{ label: "work 9-17" }],
      note: "",
    },
    {
      user_id: alenId,
      status_date: addDays(today, -1),
      busy_score: 7,
      busy_blocks: [{ label: "meetings 10-15" }],
      note: "Back-to-back calls.",
    },
  ];

  for (const entry of dayEntries) {
    await admin.from("daily_status").insert({
      couple_id: coupleId,
      ...entry,
    });
  }

  // Previous week — both submitted (revealed), current week — Alen draft only.
  await admin.from("weekly_reflections").insert([
    {
      couple_id: coupleId,
      user_id: ilariaId,
      week_start: prevWeek,
      answers: {
        week_rating: 8,
        communication_rating: 7,
        quality_time_rating: 6,
        support_rating: 9,
        best_moment: "Cooking risotto together on Thursday with no phones.",
        bothered_me: "Feeling a bit rushed when planning the weekend.",
        appreciated: "You made coffee before I was even awake.",
        need_more_less: "More unhurried evenings. Less last-minute logistics.",
        support_next_week: "A mid-week check-in text would help.",
      },
      journal: "Felt close overall. Small friction around weekends.",
      submitted_at: addDays(prevWeek, 6) + "T18:30:00.000Z",
    },
    {
      couple_id: coupleId,
      user_id: alenId,
      week_start: prevWeek,
      answers: {
        week_rating: 7,
        communication_rating: 8,
        quality_time_rating: 5,
        support_rating: 7,
        best_moment: "The long walk after dinner on Saturday.",
        bothered_me: "I went quiet when work piled up and didn't say why.",
        appreciated: "You gave me space without making it weird.",
        need_more_less: "More shared planning earlier in the week.",
        support_next_week: "Remind me to log my day in the morning.",
      },
      journal: "",
      submitted_at: addDays(prevWeek, 6) + "T20:10:00.000Z",
    },
    {
      couple_id: coupleId,
      user_id: alenId,
      week_start: weekStart,
      answers: {
        week_rating: 7,
        communication_rating: 7,
        quality_time_rating: 6,
        support_rating: 8,
        best_moment: "",
        bothered_me: "",
        appreciated: "",
        need_more_less: "",
      },
      journal: "Draft — still finishing.",
      submitted_at: null,
    },
  ]);

  // Goals
  const { data: sharedGoal } = await admin
    .from("goals")
    .insert({
      couple_id: coupleId,
      goal_type: "relationship",
      owner_id: null,
      title: "One proper date night every week",
      why_it_matters: "Because we drift into logistics if we don't protect it.",
      milestones: [
        { id: "m1", title: "Pick a recurring night", done: true },
        { id: "m2", title: "Build a jar of 12 ideas", done: false },
        { id: "m3", title: "Do four in a row", done: false },
      ],
      target_date: addDays(today, 60),
      status: "active",
      created_by: ilariaId,
    })
    .select("*")
    .single();

  const { data: ilariaGoal } = await admin
    .from("goals")
    .insert({
      couple_id: coupleId,
      goal_type: "personal",
      owner_id: ilariaId,
      title: "Finish the ceramics course",
      why_it_matters: "Something that's just mine, that I finish.",
      milestones: [
        { id: "m1", title: "Throw 10 bowls", done: true },
        { id: "m2", title: "Glaze the set", done: false },
      ],
      target_date: addDays(today, 90),
      status: "active",
      created_by: ilariaId,
    })
    .select("*")
    .single();

  await admin.from("goals").insert({
    couple_id: coupleId,
    goal_type: "personal",
    owner_id: alenId,
    title: "Run a half marathon",
    why_it_matters: "Prove I can stick with something slow.",
    milestones: [
      { id: "m1", title: "Consistent 3 runs/week for a month", done: true },
      { id: "m2", title: "Long run 18k", done: false },
    ],
    target_date: addDays(today, 120),
    status: "active",
    created_by: alenId,
  });

  if (ilariaGoal) {
    await admin.from("goal_cheers").insert({
      couple_id: coupleId,
      goal_id: ilariaGoal.id,
      from_user: alenId,
      message: "Proud of you for showing up to class even on tired weeks.",
    });
    await admin.from("goal_updates").insert({
      couple_id: coupleId,
      goal_id: ilariaGoal.id,
      author_id: ilariaId,
      body: "Threw five decent bowls this week. Two cracked. Still counting it.",
      progress_percent: 40,
    });
  }

  if (sharedGoal) {
    await admin.from("goal_updates").insert({
      couple_id: coupleId,
      goal_id: sharedGoal.id,
      author_id: alenId,
      body: "Thursday is locked as date night. Phone basket by the door.",
      progress_percent: 25,
    });
  }

  // Conflict archive
  await admin.from("conflicts").insert({
    couple_id: coupleId,
    title: "Planning the weekend at the last minute",
    happened_on: addDays(today, -21),
    what_it_was_about:
      "One of us wanted a quiet Saturday; the other had already said yes to friends.",
    perspective_a_user: ilariaId,
    perspective_a:
      "I felt ambushed — I needed rest and found out about plans too late to push back kindly.",
    perspective_b_user: alenId,
    perspective_b:
      "I felt like I was being difficult for wanting to see people after a social week for Ilaria.",
    trigger_note: "A Friday-night text that assumed Saturday was free.",
    resolution:
      "We paused, named what each of us needed, and cancelled without drama.",
    agreed_action: "Sunday evening, 10 minutes, rough plan for the next week.",
    follow_up_date: addDays(today, -2),
    follow_up_status: "pending",
    created_by: ilariaId,
  });

  // Future
  await admin.from("date_ideas").insert([
    {
      couple_id: coupleId,
      title: "Cook something neither of us has made",
      description: "Pick a recipe blind, no takeaway backup.",
      category: "food",
      cost_level: 2,
      status: "open",
      created_by: ilariaId,
    },
    {
      couple_id: coupleId,
      title: "Sunset walk + cheap wine on a hill",
      description: "Phones off. Just the view.",
      category: "out",
      cost_level: 1,
      status: "open",
      created_by: alenId,
    },
    {
      couple_id: coupleId,
      title: "Board game night at home",
      description: "Loser makes dessert.",
      category: "at_home",
      cost_level: 1,
      status: "done",
      created_by: alenId,
      done_at: addDays(today, -10) + "T20:00:00.000Z",
    },
  ]);

  const { data: trip } = await admin
    .from("trips")
    .insert({
      couple_id: coupleId,
      destination: "Lisbon",
      notes: "Late September, before it gets cold. Lots of walking.",
      budget_amount: 1800,
      currency: "EUR",
      start_date: addDays(today, 55),
      end_date: addDays(today, 60),
      status: "planning",
      created_by: alenId,
    })
    .select("*")
    .single();

  if (trip) {
    await admin.from("trip_tasks").insert([
      {
        couple_id: coupleId,
        trip_id: trip.id,
        title: "Book flights",
        assignee_id: alenId,
        done: true,
      },
      {
        couple_id: coupleId,
        trip_id: trip.id,
        title: "Find a flat in Alfama",
        assignee_id: ilariaId,
        done: false,
      },
      {
        couple_id: coupleId,
        trip_id: trip.id,
        title: "List 5 food spots",
        assignee_id: null,
        done: false,
      },
    ]);

    await admin.from("trip_activities").insert([
      {
        couple_id: coupleId,
        trip_id: trip.id,
        title: "Pastéis de Belém, early, before the queue",
        notes: "",
        done: false,
        sort_order: 0,
      },
      {
        couple_id: coupleId,
        trip_id: trip.id,
        title: "Tram 28 without a plan",
        notes: "Get off wherever looks nice.",
        done: false,
        sort_order: 1,
      },
    ]);
  }

  await admin.from("milestones").insert([
    {
      couple_id: coupleId,
      title: "The day we met",
      description: "A mutual friend's dinner that ran too long.",
      milestone_date: "2023-05-12",
      kind: "first",
      recurs_annually: true,
      created_by: ilariaId,
    },
    {
      couple_id: coupleId,
      title: "First trip together",
      description: "Trains, rain, and a terrible hostel.",
      milestone_date: "2023-09-02",
      kind: "first",
      recurs_annually: false,
      created_by: alenId,
    },
    {
      couple_id: coupleId,
      title: "Anniversary dinner",
      description: "Book somewhere neither of us has tried.",
      milestone_date: addDays(today, 18),
      kind: "anniversary",
      recurs_annually: true,
      created_by: ilariaId,
    },
  ]);

  console.log("\nDone. Demo accounts:\n");
  console.log(`  Ilaria  ${DEMO.ilaria.email} / ${DEMO.ilaria.password}`);
  console.log(`  Alen    ${DEMO.alen.email} / ${DEMO.alen.password}`);
  console.log(`\nCouple invite code (already paired): ${inviteCode}`);
  console.log("Constitution review banner should show (last review ~35 days ago).");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
