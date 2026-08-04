-- =============================================================================
-- Us — 0009_trip_activities
-- Things you want to do on a trip (separate from who-does-what tasks).
-- =============================================================================

create table if not exists public.trip_activities (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  couple_id uuid not null default public.current_couple_id() references public.couples (id) on delete cascade,
  title text not null,
  notes text not null default '',
  done boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trip_activities_title_not_blank check (length(trim(title)) > 0)
);

create index if not exists trip_activities_trip_idx
  on public.trip_activities (trip_id, sort_order, created_at);

drop trigger if exists trip_activities_touch_updated_at on public.trip_activities;
create trigger trip_activities_touch_updated_at
  before update on public.trip_activities
  for each row execute function public.touch_updated_at();

alter table public.trip_activities enable row level security;

drop policy if exists trip_activities_select_own_couple on public.trip_activities;
create policy trip_activities_select_own_couple on public.trip_activities
  for select to authenticated
  using (couple_id = public.current_couple_id());

drop policy if exists trip_activities_insert_own_couple on public.trip_activities;
create policy trip_activities_insert_own_couple on public.trip_activities
  for insert to authenticated
  with check (couple_id = public.current_couple_id());

drop policy if exists trip_activities_update_own_couple on public.trip_activities;
create policy trip_activities_update_own_couple on public.trip_activities
  for update to authenticated
  using (couple_id = public.current_couple_id())
  with check (couple_id = public.current_couple_id());

drop policy if exists trip_activities_delete_own_couple on public.trip_activities;
create policy trip_activities_delete_own_couple on public.trip_activities
  for delete to authenticated
  using (couple_id = public.current_couple_id());
