import { copy } from "@/lib/copy";

/**
 * Positive-only gamification.
 *
 * Every value below is a *shared* count for the couple. There is deliberately
 * no per-person figure anywhere in this module, so the UI is structurally
 * incapable of showing "who did more".
 */
export type CelebrationInput = {
  reflectionStreak: number;
  reflectionsRevealed: number;
  cheersThisMonth: number;
  goalsAchievedThisMonth: number;
  datesDone: number;
  followUpsWorked: number;
  activeRules: number;
  rhythmDaysBothLogged: number;
};

export type Celebration = {
  id: string;
  message: string;
  /** Higher wins when several are true at once. */
  weight: number;
};

function candidates(input: CelebrationInput): Celebration[] {
  const list: Celebration[] = [];

  if (input.reflectionStreak >= 2) {
    list.push({
      id: "streak",
      message: copy.celebrations.reflectionStreak(input.reflectionStreak),
      weight: 90 + Math.min(input.reflectionStreak, 20),
    });
  } else if (input.reflectionsRevealed === 1) {
    list.push({
      id: "first-reflection",
      message: copy.celebrations.firstReflection,
      weight: 85,
    });
  }

  if (input.goalsAchievedThisMonth > 0) {
    list.push({
      id: "goals",
      message: copy.celebrations.goalsAchieved(input.goalsAchievedThisMonth),
      weight: 80,
    });
  }

  if (input.followUpsWorked > 0) {
    list.push({
      id: "follow-ups",
      message: copy.celebrations.followUpsWorked(input.followUpsWorked),
      weight: 70,
    });
  }

  if (input.cheersThisMonth >= 3) {
    list.push({
      id: "cheers",
      message: copy.celebrations.cheersThisMonth(input.cheersThisMonth),
      weight: 60,
    });
  }

  if (input.datesDone > 0) {
    list.push({
      id: "dates",
      message: copy.celebrations.datesDone(input.datesDone),
      weight: 50,
    });
  }

  if (input.rhythmDaysBothLogged >= 5) {
    list.push({
      id: "rhythm",
      message: copy.celebrations.rhythmLogged(input.rhythmDaysBothLogged),
      weight: 40,
    });
  }

  if (input.activeRules >= 3) {
    list.push({
      id: "constitution",
      message: copy.celebrations.constitutionGrown(input.activeRules),
      weight: 20,
    });
  }

  return list;
}

/** The single celebration the dashboard shows. */
export function pickCelebration(input: CelebrationInput): Celebration | null {
  const list = candidates(input);
  if (list.length === 0) return null;
  return list.reduce((best, item) => (item.weight > best.weight ? item : best));
}
