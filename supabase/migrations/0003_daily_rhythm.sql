-- =============================================================================
-- Us — 0003_daily_rhythm
-- One row per person per day: how full the day is, and what's in it.
-- =============================================================================

create table if not exists public.daily_status (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.current_couple_id() references public.couples (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  status_date date not null,
  -- [{ "label": "work", "start": "08:00", "end": "16:00" }, ...]
  busy_blocks jsonb not null default '[]'::jsonb,
  busy_score int not null default 5 check (busy_score between 1 and 10),
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, status_date),
  constraint daily_status_blocks_is_array check (jsonb_typeof(busy_blocks) = 'array')
);

create index if not exists daily_status_couple_date_idx
  on public.daily_status (couple_id, status_date desc);

drop trigger if exists daily_status_touch_updated_at on public.daily_status;
create trigger daily_status_touch_updated_at
  before update on public.daily_status
  for each row execute function public.touch_updated_at();

-- Announce the log so the partner's view can refresh live.
create or replace function public.daily_status_announce()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.log_couple_event(
    new.couple_id,
    new.user_id,
    'daily_status_logged',
    jsonb_build_object('status_date', new.status_date, 'busy_score', new.busy_score)
  );
  return null;
end;
$$;

-- Fires on updates too, so editing your day still nudges their screen. Counts
-- for celebrations are taken from daily_status itself, not from these events, so
-- repeated edits cannot inflate anything.
drop trigger if exists daily_status_announce on public.daily_status;
create trigger daily_status_announce
  after insert or update on public.daily_status
  for each row execute function public.daily_status_announce();

-- -----------------------------------------------------------------------------
-- RLS: both partners read the whole couple's rhythm, each writes only their own.
-- -----------------------------------------------------------------------------
alter table public.daily_status enable row level security;

drop policy if exists daily_status_select_own_couple on public.daily_status;
create policy daily_status_select_own_couple on public.daily_status
  for select to authenticated
  using (couple_id = public.current_couple_id());

drop policy if exists daily_status_insert_self on public.daily_status;
create policy daily_status_insert_self on public.daily_status
  for insert to authenticated
  with check (couple_id = public.current_couple_id() and user_id = auth.uid());

drop policy if exists daily_status_update_self on public.daily_status;
create policy daily_status_update_self on public.daily_status
  for update to authenticated
  using (couple_id = public.current_couple_id() and user_id = auth.uid())
  with check (couple_id = public.current_couple_id() and user_id = auth.uid());

drop policy if exists daily_status_delete_self on public.daily_status;
create policy daily_status_delete_self on public.daily_status
  for delete to authenticated
  using (couple_id = public.current_couple_id() and user_id = auth.uid());
