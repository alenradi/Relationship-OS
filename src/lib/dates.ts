import { copy } from "@/lib/copy";

/**
 * Everything in Us is anchored to one civil timezone and ISO weeks (Monday to
 * Sunday). "Today" must mean the same day to both of you, and a week must not
 * shift under your feet when the clocks change.
 *
 * The approach: convert an instant to a civil date string (YYYY-MM-DD) in the
 * app timezone once, then do all arithmetic on that string using UTC noon as a
 * DST-proof anchor. No date maths ever happens in the browser's local zone.
 */
export const APP_TIMEZONE = "Europe/Ljubljana";

export type CivilDate = string; // YYYY-MM-DD

/** The civil date in the app's timezone for a given instant. */
export function todayInAppTz(now: Date = new Date()): CivilDate {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** The hour (0-23) in the app's timezone — used only to pick a greeting. */
export function hourInAppTz(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    hour12: false,
  }).formatToParts(now);
  return Number(parts.find((p) => p.type === "hour")?.value ?? "0");
}

/** Anchor at UTC noon so ±1h DST shifts can never roll the date over. */
function parseCivil(date: CivilDate): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12));
}

function toCivil(value: Date): CivilDate {
  return value.toISOString().slice(0, 10);
}

export function addDays(date: CivilDate, days: number): CivilDate {
  const d = parseCivil(date);
  d.setUTCDate(d.getUTCDate() + days);
  return toCivil(d);
}

export function addMonths(date: CivilDate, months: number): CivilDate {
  const d = parseCivil(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return toCivil(d);
}

/** ISO weekday: Monday = 1 … Sunday = 7. */
export function isoDayOfWeek(date: CivilDate): number {
  const day = parseCivil(date).getUTCDay();
  return day === 0 ? 7 : day;
}

/** The Monday of the ISO week containing `date`. */
export function weekStartOf(date: CivilDate): CivilDate {
  return addDays(date, -(isoDayOfWeek(date) - 1));
}

export function currentWeekStart(now: Date = new Date()): CivilDate {
  return weekStartOf(todayInAppTz(now));
}

export function weekEndOf(weekStart: CivilDate): CivilDate {
  return addDays(weekStart, 6);
}

/** Whole days from `from` to `to`; negative when `to` is in the past. */
export function daysBetween(from: CivilDate, to: CivilDate): number {
  const ms = parseCivil(to).getTime() - parseCivil(from).getTime();
  return Math.round(ms / 86_400_000);
}

export function isBefore(a: CivilDate, b: CivilDate): boolean {
  return a < b;
}

/** All seven civil dates of an ISO week, Monday first. */
export function weekDays(weekStart: CivilDate): CivilDate[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

// -----------------------------------------------------------------------------
// Formatting
// -----------------------------------------------------------------------------

function formatCivil(
  date: CivilDate,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...options }).format(
    parseCivil(date),
  );
}

export function formatLongDate(date: CivilDate): string {
  return formatCivil(date, { day: "numeric", month: "long", year: "numeric" });
}

export function formatMediumDate(date: CivilDate): string {
  return formatCivil(date, { day: "numeric", month: "short", year: "numeric" });
}

export function formatDayAndMonth(date: CivilDate): string {
  return formatCivil(date, { day: "numeric", month: "short" });
}

export function formatWeekdayShort(date: CivilDate): string {
  return formatCivil(date, { weekday: "short" });
}

export function formatWeekdayLong(date: CivilDate): string {
  return formatCivil(date, { weekday: "long" });
}

/** "Mon 27 Jul" — the header for a day column. */
export function formatDayHeading(date: CivilDate): string {
  return formatCivil(date, { weekday: "short", day: "numeric", month: "short" });
}

/** "27 Jul – 2 Aug 2026", collapsing a shared month or year. */
export function formatWeekRange(weekStart: CivilDate): string {
  const end = weekEndOf(weekStart);
  const sameMonth = weekStart.slice(0, 7) === end.slice(0, 7);
  const sameYear = weekStart.slice(0, 4) === end.slice(0, 4);

  if (sameMonth) {
    return `${formatCivil(weekStart, { day: "numeric" })}–${formatCivil(end, {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}`;
  }

  if (sameYear) {
    return `${formatCivil(weekStart, {
      day: "numeric",
      month: "short",
    })} – ${formatCivil(end, { day: "numeric", month: "short", year: "numeric" })}`;
  }

  return `${formatMediumDate(weekStart)} – ${formatMediumDate(end)}`;
}

/** Today / yesterday / tomorrow where it reads better than a date. */
export function formatRelativeDay(
  date: CivilDate,
  today: CivilDate = todayInAppTz(),
): string {
  const diff = daysBetween(today, date);
  if (diff === 0) return copy.app.today;
  if (diff === -1) return copy.app.yesterday;
  if (diff === 1) return copy.app.tomorrow;
  return formatDayHeading(date);
}

/** Coarse "how long ago" for timestamps, using the copy file's wording. */
export function formatTimeAgo(
  timestamp: string,
  now: Date = new Date(),
): string {
  const then = new Date(timestamp).getTime();
  const seconds = Math.max(0, Math.floor((now.getTime() - then) / 1000));

  if (seconds < 60) return copy.time.justNow;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return copy.time.minutesAgo(minutes);

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return copy.time.hoursAgo(hours);

  const days = Math.floor(hours / 24);
  if (days < 7) return copy.time.daysAgo(days);

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return copy.time.weeksAgo(weeks);

  return copy.time.monthsAgo(Math.max(1, Math.round(days / 30)));
}

/** Clock time of an instant, in the app timezone. */
export function formatClockTime(timestamp: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(timestamp));
}

/** Whole months elapsed (approx), kept for legacy callers. Prefer daysBetween. */
export function monthsSince(
  timestamp: string,
  now: Date = new Date(),
): number {
  const then = new Date(timestamp);
  const days = (now.getTime() - then.getTime()) / 86_400_000;
  return Math.floor(days / 30.44);
}

/**
 * Monday of the previous ISO week — used so reflections can still be finished
 * Mon/Tue after the week ends.
 */
export function previousWeekStart(now: Date = new Date()): CivilDate {
  return addDays(currentWeekStart(now), -7);
}

/**
 * A reflection week is writable when it is the current week, or the previous
 * week and today is Monday or Tuesday in Europe/Ljubljana (1–2 days late).
 */
export function isReflectionWeekWritable(
  weekStart: CivilDate,
  today: CivilDate = todayInAppTz(),
): boolean {
  const current = weekStartOf(today);
  if (weekStart === current) return true;

  const previous = addDays(current, -7);
  if (weekStart !== previous) return false;

  const dow = isoDayOfWeek(today);
  return dow === 1 || dow === 2;
}

/** Sunday of the ISO week — when the weekly reflection is primarily prompted. */
export function isReflectionPromptDay(today: CivilDate = todayInAppTz()): boolean {
  return isoDayOfWeek(today) === 7;
}

/**
 * The next occurrence of an annually recurring date, so a 12 May anniversary
 * counts down to this year's 12 May rather than the original one.
 */
export function nextAnnualOccurrence(
  date: CivilDate,
  today: CivilDate = todayInAppTz(),
): CivilDate {
  const [, month, day] = date.split("-");
  const year = Number(today.slice(0, 4));
  const thisYear = `${year}-${month}-${day}`;
  return thisYear >= today ? thisYear : `${year + 1}-${month}-${day}`;
}

export function yearsBetween(from: CivilDate, to: CivilDate): number {
  return Math.floor(daysBetween(from, to) / 365.25);
}

// -----------------------------------------------------------------------------
// Time-of-day strings inside busy blocks ("08:00")
// -----------------------------------------------------------------------------

export function minutesFromTime(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function timeFromMinutes(minutes: number): string {
  const clamped = Math.max(0, Math.min(24 * 60, Math.round(minutes)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function isValidTime(time: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(time)) return false;
  const [h, m] = time.split(":").map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}
