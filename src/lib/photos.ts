import type { PhotoRow, PhotoSubjectType } from "@/lib/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const PHOTO_BUCKET = "couple-photos";
export const PHOTO_SIGNED_TTL_SECONDS = 60 * 60 * 6;

export type PhotoWithUrl = PhotoRow & { url: string };

const SUBJECT_TABLE = {
  date_idea: "date_ideas",
  trip: "trips",
  milestone: "milestones",
  goal: "goals",
} as const;

export function photosFor(
  photos: PhotoWithUrl[],
  subjectType: PhotoSubjectType,
  subjectId: string,
  kind?: PhotoRow["kind"],
): PhotoWithUrl[] {
  return photos.filter(
    (photo) =>
      photo.subject_type === subjectType &&
      photo.subject_id === subjectId &&
      (kind ? photo.kind === kind : true),
  );
}

export async function loadCouplePhotos(
  coupleId: string,
): Promise<PhotoWithUrl[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false });

  if (error || !data?.length) return [];

  const paths = data.map((row) => row.storage_path);
  const { data: signed } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(paths, PHOTO_SIGNED_TTL_SECONDS);

  const urlByPath = new Map(
    (signed ?? [])
      .filter((item) => item.path && item.signedUrl)
      .map((item) => [item.path as string, item.signedUrl as string]),
  );

  return data.map((row) => ({
    ...row,
    url: urlByPath.get(row.storage_path) ?? "",
  }));
}

export function subjectTable(type: PhotoSubjectType) {
  return SUBJECT_TABLE[type];
}
