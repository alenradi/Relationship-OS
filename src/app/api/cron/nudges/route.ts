import { NextResponse } from "next/server";

import { copy } from "@/lib/copy";
import {
  addDays,
  isReflectionPromptDay,
  nextAnnualOccurrence,
  todayInAppTz,
} from "@/lib/dates";
import { sendPushToUser } from "@/lib/push";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Daily morning nudges in Europe/Ljubljana:
 * - Sunday reflection prompt
 * - Milestones happening today or tomorrow (birthdays, anniversaries)
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";

  if (secret && auth !== `Bearer ${secret}` && !isVercelCron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const today = todayInAppTz();
  const tomorrow = addDays(today, 1);

  const { data: members } = await admin
    .from("profiles")
    .select("id, couple_id, display_name")
    .not("couple_id", "is", null);

  if (isReflectionPromptDay(today)) {
    for (const member of members ?? []) {
      await sendPushToUser(member.id, {
        title: copy.push.reflectionSundayTitle,
        body: copy.push.reflectionSundayBody,
        url: "/reflection",
      });
    }
  }

  const { data: milestones } = await admin
    .from("milestones")
    .select("id, couple_id, title, milestone_date, recurs_annually");

  for (const milestone of milestones ?? []) {
    const occurs = milestone.recurs_annually
      ? nextAnnualOccurrence(milestone.milestone_date, today)
      : milestone.milestone_date;

    const when =
      occurs === today ? "today" : occurs === tomorrow ? "tomorrow" : null;
    if (!when) continue;

    const coupleMembers = (members ?? []).filter(
      (m) => m.couple_id === milestone.couple_id,
    );
    for (const member of coupleMembers) {
      await sendPushToUser(member.id, {
        title: copy.push.milestoneTitle,
        body:
          when === "today"
            ? copy.push.milestoneToday(milestone.title)
            : copy.push.milestoneTomorrow(milestone.title),
        url: "/future",
      });
    }
  }

  return NextResponse.json({ ok: true, date: today });
}
