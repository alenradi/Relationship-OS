import { copy } from "@/lib/copy";
import type { MilestoneRow, TripRow } from "@/lib/database.types";
import {
  daysBetween,
  formatMediumDate,
  nextAnnualOccurrence,
  type CivilDate,
  yearsBetween,
} from "@/lib/dates";

export type UpcomingItem = {
  kind: "milestone" | "trip";
  id: string;
  title: string;
  date: CivilDate;
  daysAway: number;
  detail: string | null;
  href: string;
};

/**
 * Merges milestones and trips into one forward-looking list.
 *
 * Annually recurring milestones resolve to their next occurrence, so a 12 May
 * anniversary counts down to this year's rather than sitting in the past
 * forever.
 */
export function collectUpcoming(
  milestones: MilestoneRow[],
  trips: TripRow[],
  today: CivilDate,
): UpcomingItem[] {
  const items: UpcomingItem[] = [];

  for (const milestone of milestones) {
    const date = milestone.recurs_annually
      ? nextAnnualOccurrence(milestone.milestone_date, today)
      : milestone.milestone_date;

    const daysAway = daysBetween(today, date);
    if (daysAway < 0) continue;

    const years = milestone.recurs_annually
      ? yearsBetween(milestone.milestone_date, date)
      : 0;

    items.push({
      kind: "milestone",
      id: milestone.id,
      title: milestone.title,
      date,
      daysAway,
      detail:
        years > 0
          ? copy.future.anniversaryYears(years)
          : copy.future.milestoneKinds[milestone.kind],
      href: "/future",
    });
  }

  for (const trip of trips) {
    if (!trip.start_date) continue;
    const daysAway = daysBetween(today, trip.start_date);
    if (daysAway < 0) continue;

    items.push({
      kind: "trip",
      id: trip.id,
      title: trip.destination,
      date: trip.start_date,
      daysAway,
      detail: trip.end_date
        ? `${formatMediumDate(trip.start_date)} – ${formatMediumDate(trip.end_date)}`
        : copy.future.tripStatuses[trip.status],
      href: "/future",
    });
  }

  return items.sort((a, b) => a.daysAway - b.daysAway);
}

export function nextUpcoming(
  milestones: MilestoneRow[],
  trips: TripRow[],
  today: CivilDate,
): UpcomingItem | null {
  return collectUpcoming(milestones, trips, today)[0] ?? null;
}
