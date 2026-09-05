-- =============================================================================
-- Us — 0011_photos
-- Private albums for dates, trips, milestones, and a reward photo on goals.
-- Files live in a couple-scoped Storage bucket; metadata lives in public.photos.
-- =============================================================================

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.current_couple_id()
    references public.couples (id) on delete cascade,
  subject_type text not null
    check (subject_type in ('date_idea', 'trip', 'milestone', 'goal')),
  subject_id uuid not null,
  storage_path text not null unique,
  caption text not null default '',
  kind text not null default 'memory'
    check (kind in ('memory', 'reward')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists photos_subject_idx
  on public.photos (couple_id, subject_type, subject_id, created_at desc);

create index if not exists photos_kind_idx
  on public.photos (couple_id, kind);

alter table public.photos enable row level security;

drop policy if exists photos_select_own_couple on public.photos;
create policy photos_select_own_couple on public.photos
  for select to authenticated
  using (couple_id = public.current_couple_id());

drop policy if exists photos_insert_own_couple on public.photos;
create policy photos_insert_own_couple on public.photos
  for insert to authenticated
  with check (couple_id = public.current_couple_id());

drop policy if exists photos_update_own_couple on public.photos;
create policy photos_update_own_couple on public.photos
  for update to authenticated
  using (couple_id = public.current_couple_id())
  with check (couple_id = public.current_couple_id());

drop policy if exists photos_delete_own_couple on public.photos;
create policy photos_delete_own_couple on public.photos
  for delete to authenticated
  using (couple_id = public.current_couple_id());

revoke all on public.photos from anon;
grant select, insert, update, delete on public.photos to authenticated;

-- One reward photo per goal (replace, don't stack).
create unique index if not exists photos_one_reward_per_goal
  on public.photos (couple_id, subject_id)
  where kind = 'reward' and subject_type = 'goal';

-- -----------------------------------------------------------------------------
-- Storage bucket
-- Path convention: {couple_id}/{subject_type}/{subject_id}/{uuid}.ext
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'couple-photos',
  'couple-photos',
  false,
  8388608,
  array[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/heif'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists couple_photos_select on storage.objects;
create policy couple_photos_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'couple-photos'
    and split_part(name, '/', 1) = public.current_couple_id()::text
  );

drop policy if exists couple_photos_insert on storage.objects;
create policy couple_photos_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'couple-photos'
    and split_part(name, '/', 1) = public.current_couple_id()::text
  );

drop policy if exists couple_photos_update on storage.objects;
create policy couple_photos_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'couple-photos'
    and split_part(name, '/', 1) = public.current_couple_id()::text
  )
  with check (
    bucket_id = 'couple-photos'
    and split_part(name, '/', 1) = public.current_couple_id()::text
  );

drop policy if exists couple_photos_delete on storage.objects;
create policy couple_photos_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'couple-photos'
    and split_part(name, '/', 1) = public.current_couple_id()::text
  );

-- Keep the home screen in step when either of you adds a memory.
create or replace function public.on_photo_changed()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.log_couple_event(
    coalesce(new.couple_id, old.couple_id),
    coalesce(new.created_by, old.created_by, auth.uid()),
    'photo_added',
    jsonb_build_object(
      'subject_type', coalesce(new.subject_type, old.subject_type),
      'subject_id', coalesce(new.subject_id, old.subject_id),
      'kind', coalesce(new.kind, old.kind)
    )
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists photos_log_event on public.photos;
create trigger photos_log_event
  after insert or delete on public.photos
  for each row
  execute function public.on_photo_changed();
