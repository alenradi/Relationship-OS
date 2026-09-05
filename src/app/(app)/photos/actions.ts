"use server";

import { revalidatePath } from "next/cache";

import { copy } from "@/lib/copy";
import type { PhotoKind, PhotoSubjectType } from "@/lib/database.types";
import { PHOTO_BUCKET, subjectTable } from "@/lib/photos";
import { requireCouple } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PhotoResult = { error?: string | null };

const SUBJECTS: PhotoSubjectType[] = [
  "date_idea",
  "trip",
  "milestone",
  "goal",
];

const KINDS: PhotoKind[] = ["memory", "reward"];

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

const MAX_BYTES = 8 * 1024 * 1024;

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
};

function refresh() {
  revalidatePath("/future");
  revalidatePath("/goals");
  revalidatePath("/");
}

function guessMime(file: File): string {
  if (ALLOWED_TYPES.has(file.type)) return file.type;
  const name = file.name.toLowerCase();
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".gif")) return "image/gif";
  if (name.endsWith(".heic")) return "image/heic";
  if (name.endsWith(".heif")) return "image/heif";
  return file.type;
}

function parseSubject(value: FormDataEntryValue | null): PhotoSubjectType | null {
  return typeof value === "string" && SUBJECTS.includes(value as PhotoSubjectType)
    ? (value as PhotoSubjectType)
    : null;
}

export async function uploadPhotoAction(formData: FormData): Promise<PhotoResult> {
  const { couple, user } = await requireCouple();
  const supabase = await createSupabaseServerClient();

  const file = formData.get("file");
  const subjectType = parseSubject(formData.get("subjectType"));
  const subjectId =
    typeof formData.get("subjectId") === "string"
      ? (formData.get("subjectId") as string)
      : "";
  const kindRaw = formData.get("kind");
  const kind: PhotoKind =
    typeof kindRaw === "string" && KINDS.includes(kindRaw as PhotoKind)
      ? (kindRaw as PhotoKind)
      : "memory";
  const caption =
    typeof formData.get("caption") === "string"
      ? (formData.get("caption") as string).trim()
      : "";

  if (!(file instanceof File) || file.size === 0) {
    return { error: copy.photos.needFile };
  }
  if (!subjectType || !subjectId) {
    return { error: copy.errors.generic };
  }
  if (file.size > MAX_BYTES) {
    return { error: copy.photos.tooLarge };
  }

  const mime = guessMime(file);
  if (!ALLOWED_TYPES.has(mime)) {
    return { error: copy.photos.badType };
  }

  const { data: subject, error: subjectError } = await supabase
    .from(subjectTable(subjectType))
    .select("id")
    .eq("id", subjectId)
    .eq("couple_id", couple.id)
    .maybeSingle();

  if (subjectError || !subject) {
    return { error: copy.errors.notFound };
  }

  if (kind === "reward" && subjectType === "goal") {
    const { data: existing } = await supabase
      .from("photos")
      .select("id, storage_path")
      .eq("subject_type", "goal")
      .eq("subject_id", subjectId)
      .eq("kind", "reward");

    for (const row of existing ?? []) {
      await supabase.storage.from(PHOTO_BUCKET).remove([row.storage_path]);
      await supabase.from("photos").delete().eq("id", row.id);
    }
  }

  const ext = EXT[mime] ?? "jpg";
  const storagePath = `${couple.id}/${subjectType}/${subjectId}/${crypto.randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(storagePath, bytes, {
      contentType: mime,
      upsert: false,
    });

  if (uploadError) return { error: uploadError.message };

  const { error: insertError } = await supabase.from("photos").insert({
    couple_id: couple.id,
    subject_type: subjectType,
    subject_id: subjectId,
    storage_path: storagePath,
    caption,
    kind,
    created_by: user.id,
  });

  if (insertError) {
    await supabase.storage.from(PHOTO_BUCKET).remove([storagePath]);
    return { error: insertError.message };
  }

  refresh();
  return {};
}

export async function deletePhotoAction(photoId: string): Promise<PhotoResult> {
  await requireCouple();
  const supabase = await createSupabaseServerClient();

  const { data: photo, error: fetchError } = await supabase
    .from("photos")
    .select("id, storage_path")
    .eq("id", photoId)
    .maybeSingle();

  if (fetchError || !photo) return { error: copy.errors.notFound };

  const { error: storageError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .remove([photo.storage_path]);
  if (storageError) return { error: storageError.message };

  const { error } = await supabase.from("photos").delete().eq("id", photo.id);
  if (error) return { error: error.message };

  refresh();
  return {};
}
