import type { ProfileRow } from "@/lib/database.types";

export function displayName(
  profile: Pick<ProfileRow, "display_name"> | null | undefined,
  fallback = "Your partner",
): string {
  const name = profile?.display_name?.trim();
  return name && name.length > 0 ? name : fallback;
}

/** First name only, for tight spaces like tab labels. */
export function firstName(
  profile: Pick<ProfileRow, "display_name"> | null | undefined,
  fallback = "Partner",
): string {
  return displayName(profile, fallback).split(/\s+/)[0] ?? fallback;
}

export function initials(
  profile: Pick<ProfileRow, "display_name"> | null | undefined,
): string {
  const name = displayName(profile, "?");
  const parts = name.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

/** "an 8/10" but "a 5/10". */
export function articleForNumber(value: number): string {
  return value === 8 || value === 11 || value === 18 ? "an" : "a";
}

/** Possessive form of a display name: "Alen's", "Ilaria's". */
export function possessiveName(
  profile: Pick<ProfileRow, "display_name"> | null | undefined,
  fallback = "Your partner's",
): string {
  const name = displayName(profile, fallback.replace(/'s$/, ""));
  if (fallback.endsWith("'s") && (!profile?.display_name?.trim())) return fallback;
  return name.endsWith("s") ? `${name}'` : `${name}'s`;
}
