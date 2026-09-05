"use client";

import { useRef, useState, useTransition } from "react";

import { deletePhotoAction, uploadPhotoAction } from "@/app/(app)/photos/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Notice } from "@/components/ui/notice";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy";
import type { PhotoKind, PhotoSubjectType } from "@/lib/database.types";
import type { PhotoWithUrl } from "@/lib/photos";

export function PhotoAlbum({
  subjectType,
  subjectId,
  photos,
  kind = "memory",
  max,
  heading,
  emptyHint,
  compact = false,
  allowUpload = true,
}: {
  subjectType: PhotoSubjectType;
  subjectId: string;
  photos: PhotoWithUrl[];
  kind?: PhotoKind;
  max?: number;
  heading?: string;
  emptyHint?: string;
  compact?: boolean;
  allowUpload?: boolean;
}) {
  const items = photos.filter(
    (photo) =>
      photo.subject_type === subjectType &&
      photo.subject_id === subjectId &&
      photo.kind === kind,
  );
  const atLimit = typeof max === "number" && items.length >= max;
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [viewer, setViewer] = useState<PhotoWithUrl | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    const data = new FormData();
    data.set("file", file);
    data.set("subjectType", subjectType);
    data.set("subjectId", subjectId);
    data.set("kind", kind);
    data.set("caption", caption);
    start(async () => {
      const result = await uploadPhotoAction(data);
      if (result.error) setError(result.error);
      else {
        setCaption("");
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  const label = heading === "" ? "" : (heading ?? copy.future.albumTitle);

  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      {label ? (
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
            {label}
            {items.length > 0 ? ` · ${copy.photos.count(items.length)}` : ""}
          </p>
        </div>
      ) : null}

      {items.length === 0 ? (
        emptyHint === "" ? null : (
          <p className="text-xs text-ink-faint text-pretty">
            {emptyHint ?? copy.future.albumEmpty}
          </p>
        )
      ) : (
        <ul
          className={cn(
            "grid gap-2",
            max === 1 ? "grid-cols-1" : "grid-cols-3 sm:grid-cols-4",
          )}
        >
          {items.map((photo) => (
            <li key={photo.id} className="group relative">
              <button
                type="button"
                onClick={() => setViewer(photo)}
                className="block w-full overflow-hidden rounded-xl border border-line bg-surface-sunken"
                aria-label={photo.caption || copy.photos.view}
              >
                {photo.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo.url}
                    alt={photo.caption || ""}
                    className={cn(
                      "h-full w-full object-cover",
                      max === 1 ? "aspect-[4/3]" : "aspect-square",
                    )}
                  />
                ) : (
                  <div className="aspect-square bg-surface-muted" />
                )}
              </button>
              <button
                type="button"
                onClick={() =>
                  start(async () => {
                    const result = await deletePhotoAction(photo.id);
                    if (result.error) setError(result.error);
                  })
                }
                disabled={pending}
                className="absolute top-1.5 right-1.5 rounded-full bg-canvas/90 px-2 py-0.5 text-[0.65rem] text-ink-soft opacity-0 shadow-soft transition group-hover:opacity-100 focus:opacity-100"
              >
                {copy.app.remove}
              </button>
            </li>
          ))}
        </ul>
      )}

      {allowUpload && (!atLimit || kind === "reward") ? (
        <div className="space-y-2">
          {kind === "memory" ? (
            <Field htmlFor={`${subjectId}-caption`} className="hidden sm:block">
              <Input
                id={`${subjectId}-caption`}
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                placeholder={copy.photos.captionPlaceholder}
              />
            </Field>
          ) : null}
          <label className="inline-flex">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
              className="sr-only"
              disabled={pending}
              onChange={(event) => onFile(event.target.files?.[0])}
            />
            <span
              className={cn(
                "inline-flex h-8 cursor-pointer items-center rounded-full border border-line-strong bg-surface px-3 text-sm font-medium text-ink shadow-soft transition hover:bg-surface-muted",
                pending && "pointer-events-none opacity-55",
              )}
            >
              {pending
                ? copy.photos.adding
                : kind === "reward"
                  ? items.length
                    ? copy.goals.rewardReplace
                    : copy.goals.rewardAdd
                  : copy.photos.add}
            </span>
          </label>
        </div>
      ) : null}

      {error ? (
        <Notice tone="accent" role="alert">
          {error}
        </Notice>
      ) : null}

      <Modal
        open={Boolean(viewer)}
        onClose={() => setViewer(null)}
        title={viewer?.caption || copy.photos.view}
        size="lg"
        footer={
          viewer ? (
            <Button
              variant="ghost"
              onClick={() =>
                start(async () => {
                  const result = await deletePhotoAction(viewer.id);
                  if (result.error) setError(result.error);
                  else setViewer(null);
                })
              }
            >
              {copy.photos.remove}
            </Button>
          ) : null
        }
      >
        {viewer?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={viewer.url}
            alt={viewer.caption || ""}
            className="max-h-[70vh] w-full rounded-xl object-contain"
          />
        ) : null}
      </Modal>
    </div>
  );
}
