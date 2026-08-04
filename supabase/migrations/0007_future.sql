-- =============================================================================
-- Us — 0007_future
-- Date idea jar, trips, and the milestone timeline.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Date idea jar
-- -----------------------------------------------------------------------------
create table if not exists public.date_ideas (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.current_couple_id() references public.couples (id) on delete cascade,
  title text not null,
  description text not null default '',
  category text not null default 'other'
    check (category in ('at_home', 'out', 'active', 'culture', 'food', 'travel', 'other')),
  -- 1 = free-ish, 2 = a normal night out, 3 = a splurge
  cost_level int not null default 2 check (cost_level between 1 and 3),
  status text not null default 'open' check (status in ('open', 'picked', 'done', 'archived')),
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  last_picked_at timestamptz,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint date_ideas_title_not_blank check (length(trim(title)) > 0)
);

create index if not exists date_ideas_couple_idx on public.date_ideas (couple_id, status, created_at desc);

-- -----------------------------------------------------------------------------
-- Trips
-- -----------------------------------------------------------------------------
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.current_couple_id() references public.couples (id) on delete cascade,
  destination text not null,
  notes text not null default '',
  budget_amount numeric(12, 2),
  currency text not null default 'EUR',
  start_date date,
  end_date date,
  status text not null default 'idea' check (status in ('idea', 'planning', 'booked', 'done')),
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trips_destination_not_blank check (length(trim(destination)) > 0),
  constraint trips_dates_ordered check (
    start_date is null or end_date is null or end_date >= start_date
  )
);

create index if not exists trips_couple_idx on public.trips (couple_id, start_date);

-- Tasks split by person. A null assignee means "whoever gets to it first".
create table if not exists public.trip_tasks (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  couple_id uuid not null default public.current_couple_id() references public.couples (id) on delete cascade,
  title text not null,
  assignee_id uuid references public.profiles (id) on delete set null,
  done boolean not null default false,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trip_tasks_title_not_blank check (length(trim(title)) > 0)
);

create index if not exists trip_tasks_trip_idx on public.trip_tasks (trip_id, done);

-- -----------------------------------------------------------------------------
-- Milestones timeline
-- -----------------------------------------------------------------------------
create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.current_couple_id() references public.couples (id) on delete cascade,
  title text not null,
  description text not null default '',
  milestone_date date not null,
  kind text not null default 'event' check (kind in ('anniversary', 'first', 'event', 'other')),
  -- Anniversaries repeat; a first date in the past does not.
  recurs_annually boolean not null default false,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint milestones_title_not_blank check (length(trim(title)) > 0)
);

create index if not exists milestones_couple_date_idx on public.milestones (couple_id, milestone_date);

-- -----------------------------------------------------------------------------
-- "Pick for us": chooses a random open idea and marks it picked, server side so
-- both of you see the same result.
-- -----------------------------------------------------------------------------
create or replace function public.pick_date_idea()
returns public.date_ideas
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  couple uuid := public.current_couple_id();
  chosen public.date_ideas;
begin
  if couple is null then
    raise exception 'You are not part of a couple space yet.' using errcode = '28000';
  end if;

  -- Prefer ideas that have never been picked, so the jar cycles through itself.
  select * into chosen
  from public.date_ideas
  where couple_id = couple
    and status = 'open'
  order by (last_picked_at is not null), random()
  limit 1;

  if chosen.id is null then
    raise exception 'The jar is empty — add an idea first.' using errcode = 'no_data_found';
  end if;

  update public.date_ideas
     set status = 'picked',
         last_picked_at = now(),
         updated_at = now()
   where id = chosen.id
  returning * into chosen;

  perform public.log_couple_event(
    couple, auth.uid(), 'date_picked',
    jsonb_build_object('date_idea_id', chosen.id, 'title', chosen.title)
  );

  return chosen;
end;
$$;

-- -----------------------------------------------------------------------------
-- Timestamps + events
-- -----------------------------------------------------------------------------
drop trigger if exists date_ideas_touch_updated_at on public.date_ideas;
create trigger date_ideas_touch_updated_at
  before update on public.date_ideas
  for each row execute function public.touch_updated_at();

drop trigger if exists trips_touch_updated_at on public.trips;
create trigger trips_touch_updated_at
  before update on public.trips
  for each row execute function public.touch_updated_at();

drop trigger if exists trip_tasks_touch_updated_at on public.trip_tasks;
create trigger trip_tasks_touch_updated_at
  before update on public.trip_tasks
  for each row execute function public.touch_updated_at();

drop trigger if exists milestones_touch_updated_at on public.milestones;
create trigger milestones_touch_updated_at
  before update on public.milestones
  for each row execute function public.touch_updated_at();

create or replace function public.date_ideas_announce()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_couple_event(
      new.couple_id, coalesce(auth.uid(), new.created_by), 'date_idea_added',
      jsonb_build_object('date_idea_id', new.id, 'title', new.title)
    );
  elsif new.status = 'done' and old.status <> 'done' then
    perform public.log_couple_event(
      new.couple_id, auth.uid(), 'date_done',
      jsonb_build_object('date_idea_id', new.id, 'title', new.title)
    );
  end if;

  return null;
end;
$$;

drop trigger if exists date_ideas_announce on public.date_ideas;
create trigger date_ideas_announce
  after insert or update on public.date_ideas
  for each row execute function public.date_ideas_announce();

create or replace function public.milestones_announce()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.log_couple_event(
    new.couple_id, coalesce(auth.uid(), new.created_by), 'milestone_added',
    jsonb_build_object('milestone_id', new.id, 'title', new.title, 'milestone_date', new.milestone_date)
  );
  return null;
end;
$$;

drop trigger if exists milestones_announce on public.milestones;
create trigger milestones_announce
  after insert on public.milestones
  for each row execute function public.milestones_announce();

-- -----------------------------------------------------------------------------
-- RLS: shared plans, so both partners have full access inside their own couple.
-- -----------------------------------------------------------------------------
alter table public.date_ideas enable row level security;
alter table public.trips enable row level security;
alter table public.trip_tasks enable row level security;
alter table public.milestones enable row level security;

do $$
declare
  t text;
begin
  for t in
    select unnest(array['date_ideas', 'trips', 'trip_tasks', 'milestones']::text[])
  loop
    execute format('drop policy if exists %I_select_own_couple on public.%I', t, t);
    execute format(
      'create policy %I_select_own_couple on public.%I for select to authenticated
         using (couple_id = public.current_couple_id())', t, t);

    execute format('drop policy if exists %I_insert_own_couple on public.%I', t, t);
    execute format(
      'create policy %I_insert_own_couple on public.%I for insert to authenticated
         with check (couple_id = public.current_couple_id())', t, t);

    execute format('drop policy if exists %I_update_own_couple on public.%I', t, t);
    execute format(
      'create policy %I_update_own_couple on public.%I for update to authenticated
         using (couple_id = public.current_couple_id())
         with check (couple_id = public.current_couple_id())', t, t);

    execute format('drop policy if exists %I_delete_own_couple on public.%I', t, t);
    execute format(
      'create policy %I_delete_own_couple on public.%I for delete to authenticated
         using (couple_id = public.current_couple_id())', t, t);
  end loop;
end;
$$;

grant execute on function public.pick_date_idea() to authenticated;
revoke all on function public.pick_date_idea() from anon;
