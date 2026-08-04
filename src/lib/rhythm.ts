import { copy } from "@/lib/copy";
import type { BusyBlock, DailyStatusRow, ProfileRow } from "@/lib/database.types";
import { isValidTime, minutesFromTime, timeFromMinutes } from "@/lib/dates";
import { articleForNumber, displayName } from "@/lib/people";

/** The waking window the summary reasons about. */
const DAY_START = minutesFromTime("07:00");
const DAY_END = minutesFromTime("23:00");
/** Shorter gaps than this aren't worth calling "free". */
const MEANINGFUL_GAP = 60;

type Interval = { start: number; end: number };

/**
 * Busy blocks are free-text labels (e.g. "work 8-16"). When a label includes
 * a time range we can still reason about free windows for the summary.
 */
const RANGE_IN_LABEL =
  /(\d{1,2})(?::(\d{2}))?\s*[-–—to]+\s*(\d{1,2})(?::(\d{2}))?/i;

function padTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** Prefer explicit start/end; otherwise parse "work 8-16" style labels. */
export function resolveBlockTimes(
  block: BusyBlock,
): { start: string; end: string } | null {
  if (
    block.start &&
    block.end &&
    isValidTime(block.start) &&
    isValidTime(block.end) &&
    minutesFromTime(block.end) > minutesFromTime(block.start)
  ) {
    return { start: block.start, end: block.end };
  }

  const match = block.label.match(RANGE_IN_LABEL);
  if (!match) return null;

  const startH = Number(match[1]);
  const startM = Number(match[2] ?? "0");
  const endH = Number(match[3]);
  const endM = Number(match[4] ?? "0");

  if (
    startH > 23 ||
    endH > 23 ||
    startM > 59 ||
    endM > 59 ||
    endH * 60 + endM <= startH * 60 + startM
  ) {
    return null;
  }

  return { start: padTime(startH, startM), end: padTime(endH, endM) };
}

export function isValidBlock(block: BusyBlock): boolean {
  return block.label.trim().length > 0;
}

/** Sorted, overlap-free intervals from blocks that have parseable times. */
export function mergeBlocks(blocks: BusyBlock[]): Interval[] {
  const intervals = blocks
    .map(resolveBlockTimes)
    .filter((t): t is { start: string; end: string } => t !== null)
    .map((b) => ({ start: minutesFromTime(b.start), end: minutesFromTime(b.end) }))
    .sort((a, b) => a.start - b.start);

  const merged: Interval[] = [];
  for (const interval of intervals) {
    const last = merged[merged.length - 1];
    if (last && interval.start <= last.end) {
      last.end = Math.max(last.end, interval.end);
    } else {
      merged.push({ ...interval });
    }
  }
  return merged;
}

/** Free stretches inside the waking window. */
function freeIntervals(busy: Interval[]): Interval[] {
  const free: Interval[] = [];
  let cursor = DAY_START;

  for (const block of busy) {
    if (block.start > cursor) {
      free.push({ start: cursor, end: Math.min(block.start, DAY_END) });
    }
    cursor = Math.max(cursor, block.end);
    if (cursor >= DAY_END) break;
  }

  if (cursor < DAY_END) free.push({ start: cursor, end: DAY_END });

  return free.filter((f) => f.end - f.start >= MEANINGFUL_GAP);
}

function qualifierFor(score: number): string | null {
  if (score >= 9) return copy.rhythmSummary.qualifierUnderwater;
  if (score >= 7) return copy.rhythmSummary.qualifierBusy;
  if (score <= 3) return copy.rhythmSummary.qualifierOpen;
  return copy.rhythmSummary.qualifierSteady;
}

function subjectFor(
  profile: Pick<ProfileRow, "display_name">,
  isSelf: boolean,
): { name: string; is: string } {
  if (isSelf) return { name: "You", is: "are" };
  const name = displayName(profile);
  return { name, is: "is" };
}

/**
 * Plain-language line for one person's day, using display names:
 * "Alen is an 8/10 today — expect slow replies. Alen is free after 19:00."
 */
export function summarizeDay(
  profile: Pick<ProfileRow, "display_name">,
  status: Pick<DailyStatusRow, "busy_score" | "busy_blocks"> | null,
  options: { isSelf?: boolean } = {},
): string {
  const { name, is } = subjectFor(profile, options.isSelf ?? false);

  if (!status) {
    return `${copy.rhythmSummary.notLogged(name)}.`;
  }

  const sentences: string[] = [];

  const lead = copy.rhythmSummary.score(
    name,
    is,
    articleForNumber(status.busy_score),
    status.busy_score,
  );
  const qualifier = qualifierFor(status.busy_score);
  sentences.push(qualifier ? `${lead} — ${qualifier}.` : `${lead}.`);

  const labels = (status.busy_blocks ?? [])
    .map((b) => b.label.trim())
    .filter(Boolean);
  const busy = mergeBlocks(status.busy_blocks ?? []);

  if (labels.length === 0) {
    sentences.push(`${copy.rhythmSummary.freeAllDay(name, is)}.`);
    return sentences.join(" ");
  }

  if (busy.length === 0) {
    sentences.push(`${copy.rhythmSummary.busyWith(name, is, labels.join(", "))}.`);
    return sentences.join(" ");
  }

  const free = freeIntervals(busy);

  if (free.length === 0) {
    sentences.push(`${copy.rhythmSummary.bookedSolid(name, is)}.`);
    return sentences.join(" ");
  }

  const best = free.reduce((a, b) => (b.end - b.start > a.end - a.start ? b : a));

  if (best.end >= DAY_END) {
    sentences.push(
      `${copy.rhythmSummary.freeAfter(name, is, timeFromMinutes(best.start))}.`,
    );
  } else if (best.start <= DAY_START) {
    sentences.push(
      `${copy.rhythmSummary.freeUntil(name, is, timeFromMinutes(best.end))}.`,
    );
  } else {
    sentences.push(
      `${copy.rhythmSummary.freeBetween(
        name,
        is,
        timeFromMinutes(best.start),
        timeFromMinutes(best.end),
      )}.`,
    );
  }

  return sentences.join(" ");
}

/**
 * Extra line about the two of you together — never a comparison of effort,
 * only a heads-up about mismatched load.
 */
export function summarizeTogether(
  mine: Pick<DailyStatusRow, "busy_score"> | null,
  partnerProfile: Pick<ProfileRow, "display_name"> | null,
  theirs: Pick<DailyStatusRow, "busy_score"> | null,
): string | null {
  if (!mine || !theirs) return null;

  if (mine.busy_score <= 3 && theirs.busy_score <= 3) {
    return copy.rhythmSummary.bothFree;
  }

  if (mine.busy_score >= 8 && theirs.busy_score >= 8) {
    return copy.rhythmSummary.bothSlammed;
  }

  if (theirs.busy_score - mine.busy_score >= 4 && partnerProfile) {
    return copy.rhythmSummary.oneHeavy(displayName(partnerProfile));
  }

  return null;
}

export function busyScoreLabel(score: number): string {
  const labels = copy.rhythm.busyScoreLabels as Record<number, string>;
  return labels[score] ?? "";
}

/** Total logged hours from parseable ranges, for the compact day chip. */
export function busyHours(blocks: BusyBlock[]): number {
  const minutes = mergeBlocks(blocks).reduce((sum, b) => sum + (b.end - b.start), 0);
  return Math.round((minutes / 60) * 10) / 10;
}

/** Tone bucket used to pick a colour. Never a value judgement. */
export function busyTone(score: number): "open" | "steady" | "full" {
  if (score <= 3) return "open";
  if (score <= 6) return "steady";
  return "full";
}
