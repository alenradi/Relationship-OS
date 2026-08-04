-- =============================================================================
-- Us — 0005_goals
-- Three lanes: mine, yours, ours. Personal goals have an owner; relationship
-- goals belong to nobody in particular, which is the point.
-- =============================================================================

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.current_couple_id() references public.couples (id) on delete cascade,
  goal_type text not null default 'personal' check (goal_type in ('personal', 'relationship')),
  owner_id uuid references public.profiles (id) on delete cascade,
  title text not null,
  why_it_matters text not null default '',
  -- [{ "id": "...", "title": "...", "done": false, "due": "2026-08-01" }, ...]
  milestones jsonb not null default '[]'::jsonb,
  target_date date,
  status text not null default 'active' check (status in ('active', 'achieved', 'paused', 'archived')),
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goals_title_not_blank check (length(trim(title)) > 0),
  constraint goals_milestones_is_array check (jsonb_typeof(milestones) = 'array'),
  constraint goals_owner_matches_type check (
    (goal_type = 'relationship' and owner_id is null)
    or (goal_type = 'personal' and owner_id is not null)
  )
);

create index if not exists goals_couple_idx on public.goals (couple_id, status, goal_type);

-- Progress log.
create table if not exists public.goal_updates (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals (id) on delete cascade,
  couple_id uuid not null default public.current_couple_id() references public.couples (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null default '',
  progress_percent int check (progress_percent between 0 and 100),
  created_at timestamptz not null default now()
);

create index if not exists goal_updates_goal_idx on public.goal_updates (goal_id, created_at desc);

-- Encouragement + comment thread. Positive by construction: there is no
-- downvote, no comparison, no score.
create table if not exists public.goal_cheers (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals (id) on delete cascade,
  couple_id uuid not null default public.current_couple_id() references public.couples (id) on delete cascade,
  from_user uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  message text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists goal_cheers_goal_idx on public.goal_cheers (goal_id, created_at desc);
create index if not exists goal_cheers_couple_created_idx on public.goal_cheers (couple_id, created_at desc);

drop trigger if exists goals_touch_updated_at on public.goals;
create trigger goals_touch_updated_at
  before update on public.goals
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Events
-- -----------------------------------------------------------------------------
create or replace function public.goals_announce()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_couple_event(
      new.couple_id, coalesce(auth.uid(), new.created_by), 'goal_created',
      jsonb_build_object('goal_id', new.id, 'title', new.title, 'goal_type', new.goal_type)
    );
  elsif new.status = 'achieved' and old.status <> 'achieved' then
    perform public.log_couple_event(
      new.couple_id, coalesce(auth.uid(), new.owner_id), 'goal_achieved',
      jsonb_build_object('goal_id', new.id, 'title', new.title)
    );
  end if;

  return null;
end;
$$;

drop trigger if exists goals_announce on public.goals;
create trigger goals_announce
  after insert or update on public.goals
  for each row execute function public.goals_announce();

create or replace function public.goal_cheers_announce()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.log_couple_event(
    new.couple_id, new.from_user, 'goal_cheered',
    jsonb_build_object('goal_id', new.goal_id, 'cheer_id', new.id)
  );
  return null;
end;
$$;

drop trigger if exists goal_cheers_announce on public.goal_cheers;
create trigger goal_cheers_announce
  after insert on public.goal_cheers
  for each row execute function public.goal_cheers_announce();

-- -----------------------------------------------------------------------------
-- RLS
-- Both partners see everything. You edit your own goals and your shared ones;
-- you cheer and comment on theirs but you do not rewrite them.
-- -----------------------------------------------------------------------------
alter table public.goals enable row level security;
alter table public.goal_updates enable row level security;
alter table public.goal_cheers enable row level security;

drop policy if exists goals_select_own_couple on public.goals;
create policy goals_select_own_couple on public.goals
  for select to authenticated
  using (couple_id = public.current_couple_id());

drop policy if exists goals_insert_own_couple on public.goals;
create policy goals_insert_own_couple on public.goals
  for insert to authenticated
  with check (
    couple_id = public.current_couple_id()
    and (owner_id is null or owner_id = auth.uid())
  );

drop policy if exists goals_update_own_or_shared on public.goals;
create policy goals_update_own_or_shared on public.goals
  for update to authenticated
  using (
    couple_id = public.current_couple_id()
    and (owner_id is null or owner_id = auth.uid())
  )
  with check (
    couple_id = public.current_couple_id()
    and (owner_id is null or owner_id = auth.uid())
  );

drop policy if exists goals_delete_own_or_shared on public.goals;
create policy goals_delete_own_or_shared on public.goals
  for delete to authenticated
  using (
    couple_id = public.current_couple_id()
    and (owner_id is null or owner_id = auth.uid())
  );

drop policy if exists goal_updates_select_own_couple on public.goal_updates;
create policy goal_updates_select_own_couple on public.goal_updates
  for select to authenticated
  using (couple_id = public.current_couple_id());

drop policy if exists goal_updates_insert_self on public.goal_updates;
create policy goal_updates_insert_self on public.goal_updates
  for insert to authenticated
  with check (couple_id = public.current_couple_id() and author_id = auth.uid());

drop policy if exists goal_updates_delete_self on public.goal_updates;
create policy goal_updates_delete_self on public.goal_updates
  for delete to authenticated
  using (couple_id = public.current_couple_id() and author_id = auth.uid());

drop policy if exists goal_cheers_select_own_couple on public.goal_cheers;
create policy goal_cheers_select_own_couple on public.goal_cheers
  for select to authenticated
  using (couple_id = public.current_couple_id());

drop policy if exists goal_cheers_insert_self on public.goal_cheers;
create policy goal_cheers_insert_self on public.goal_cheers
  for insert to authenticated
  with check (couple_id = public.current_couple_id() and from_user = auth.uid());

drop policy if exists goal_cheers_delete_self on public.goal_cheers;
create policy goal_cheers_delete_self on public.goal_cheers
  for delete to authenticated
  using (couple_id = public.current_couple_id() and from_user = auth.uid());
