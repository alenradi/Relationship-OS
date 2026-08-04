import type { CoupleRow } from "@/lib/database.types";
import { daysBetween, todayInAppTz } from "@/lib/dates";

/** Days after a review before the constitution unlocks again. */
export const REVIEW_INTERVAL_DAYS = 30;

/**
 * Civil date of the last review (or onboarding completion), or null if never.
 */
function lastReviewCivilDate(couple: CoupleRow): string | null {
  const stamp =
    couple.constitution_reviewed_at ?? couple.onboarding_completed_at;
  if (!stamp) return null;
  return stamp.slice(0, 10);
}

/** Whole days since the last review, or Infinity if never reviewed. */
export function daysSinceConstitutionReview(
  couple: CoupleRow,
  today: string = todayInAppTz(),
): number {
  const last = lastReviewCivilDate(couple);
  if (!last) return Number.POSITIVE_INFINITY;
  return daysBetween(last, today);
}

/**
 * True when either of you may edit agreements:
 * - during first-run setup (onboarding not finished), or
 * - once 30 days have passed since the last review (until you mark reviewed).
 */
export function isConstitutionEditable(
  couple: CoupleRow,
  today: string = todayInAppTz(),
): boolean {
  if (!couple.onboarding_completed_at) return true;
  return daysSinceConstitutionReview(couple, today) >= REVIEW_INTERVAL_DAYS;
}

/** Dashboard / constitution banner: due for a 30-day revisit. */
export function isConstitutionReviewDue(
  couple: CoupleRow,
  today: string = todayInAppTz(),
): boolean {
  if (!couple.onboarding_completed_at) return false;
  return daysSinceConstitutionReview(couple, today) >= REVIEW_INTERVAL_DAYS;
}

/** Rough month count for banner copy (30-day blocks). */
export function reviewMonthsDue(
  couple: CoupleRow,
  today: string = todayInAppTz(),
): number {
  const days = daysSinceConstitutionReview(couple, today);
  if (!Number.isFinite(days)) return 1;
  return Math.max(1, Math.floor(days / REVIEW_INTERVAL_DAYS));
}
