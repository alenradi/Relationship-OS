-- =============================================================================
-- Us — 0004_weekly_reflection
--
-- The privacy rule here is enforced by Postgres, not by the UI: your partner's
-- answers are physically unreadable until you have submitted your own. What you
-- *can* always see is whether they submitted and when, which is exposed through
-- a narrow function that returns timestamps and nothing else.
-- =============================================================================

create table if not exists public.weekly_reflections (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.current_couple_id() references public.couples (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  -- Always an ISO Monday. Weeks run Monday to Sunday.
  week_start date not null,
  -- Keyed by prompt id from src/lib/reflection-prompts.ts, so new prompts do
  -- not need a migration.
  answers jsonb not null default '{}'::jsonb,
  journal text not null default '',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start),
  constraint weekly_reflections_answers_is_object check (jsonb_typeof(answers) = 'object'),
  constraint weekly_reflections_week_starts_monday check (extract(isodow from week_start) = 1)
);

create index if not exists weekly_reflections_couple_week_idx
  on public.weekly_reflections (couple_id, week_start desc);

drop trigger if exists weekly_reflections_touch_updated_at on public.weekly_reflections;
create trigger weekly_reflections_touch_updated_at
  before update on public.weekly_reflections
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Reveal predicates.
--
-- SECURITY DEFINER for two reasons: these must see both partners' rows to
-- answer at all, and a policy on weekly_reflections that queried
-- weekly_reflections directly would recurse.
-- -----------------------------------------------------------------------------
create or replace function public.reflection_submitted_count(p_couple uuid, p_week date)
returns int
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select count(*)::int
  from public.weekly_reflections r
  where r.couple_id = p_couple
    and r.week_start = p_week
    and r.submitted_at is not null;
$$;

create or replace function public.has_submitted_reflection(p_week date, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.weekly_reflections r
    where r.week_start = p_week
      and r.user_id = p_user
      and r.submitted_at is not null
  );
$$;

create or replace function public.reflection_is_revealed(p_week date)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.reflection_submitted_count(public.current_couple_id(), p_week) >= 2;
$$;

-- Timestamps only — never answers. This is what powers "Ilaria submitted hers
-- 2 hours ago" while her content stays sealed.
create or replace function public.reflection_submission_status(p_week date)
returns table (user_id uuid, submitted_at timestamptz, has_draft boolean)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select r.user_id, r.submitted_at, (r.submitted_at is null) as has_draft
  from public.weekly_reflections r
  where r.couple_id = public.current_couple_id()
    and r.week_start = p_week;
$$;

-- Drives the shared streak and the history list.
create or replace function public.reflection_weeks_overview()
returns table (week_start date, submitted_count int, both_submitted boolean, revealed_at timestamptz)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    r.week_start,
    count(*) filter (where r.submitted_at is not null)::int as submitted_count,
    count(*) filter (where r.submitted_at is not null) >= 2 as both_submitted,
    case
      when count(*) filter (where r.submitted_at is not null) >= 2
      then max(r.submitted_at)
    end as revealed_at
  from public.weekly_reflections r
  where r.couple_id = public.current_couple_id()
  group by r.week_start
  order by r.week_start desc;
$$;

-- -----------------------------------------------------------------------------
-- Announce submissions and reveals (content-free) so the other side can refresh.
-- -----------------------------------------------------------------------------
create or replace function public.weekly_reflections_announce()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  submitted int;
begin
  if new.submitted_at is null then
    return null;
  end if;

  if tg_op = 'UPDATE' and old.submitted_at is not null then
    return null;
  end if;

  perform public.log_couple_event(
    new.couple_id, new.user_id, 'reflection_submitted',
    jsonb_build_object('week_start', new.week_start)
  );

  submitted := public.reflection_submitted_count(new.couple_id, new.week_start);

  if submitted >= 2 then
    perform public.log_couple_event(
      new.couple_id, new.user_id, 'reflection_revealed',
      jsonb_build_object('week_start', new.week_start)
    );
  end if;

  return null;
end;
$$;

drop trigger if exists weekly_reflections_announce on public.weekly_reflections;
create trigger weekly_reflections_announce
  after insert or update of submitted_at on public.weekly_reflections
  for each row execute function public.weekly_reflections_announce();

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.weekly_reflections enable row level security;

-- Your own row always; your partner's row only once you have submitted too.
drop policy if exists weekly_reflections_select_gated on public.weekly_reflections;
create policy weekly_reflections_select_gated on public.weekly_reflections
  for select to authenticated
  using (
    couple_id = public.current_couple_id()
    and (
      user_id = auth.uid()
      or (
        submitted_at is not null
        and public.has_submitted_reflection(week_start, auth.uid())
      )
    )
  );

drop policy if exists weekly_reflections_insert_self on public.weekly_reflections;
create policy weekly_reflections_insert_self on public.weekly_reflections
  for insert to authenticated
  with check (couple_id = public.current_couple_id() and user_id = auth.uid());

-- Editable until the reveal, then permanently read-only.
-- The revealed check lives only in USING: when you are the second to submit,
-- your own update is what flips the week to revealed, and WITH CHECK runs after.
drop policy if exists weekly_reflections_update_until_reveal on public.weekly_reflections;
create policy weekly_reflections_update_until_reveal on public.weekly_reflections
  for update to authenticated
  using (
    couple_id = public.current_couple_id()
    and user_id = auth.uid()
    and not public.reflection_is_revealed(week_start)
  )
  with check (couple_id = public.current_couple_id() and user_id = auth.uid());

-- Only an unsubmitted draft can be thrown away.
drop policy if exists weekly_reflections_delete_draft on public.weekly_reflections;
create policy weekly_reflections_delete_draft on public.weekly_reflections
  for delete to authenticated
  using (
    couple_id = public.current_couple_id()
    and user_id = auth.uid()
    and submitted_at is null
  );

revoke all on function public.reflection_submitted_count(uuid, date) from anon, authenticated;
grant execute on function public.has_submitted_reflection(date, uuid) to authenticated;
grant execute on function public.reflection_is_revealed(date) to authenticated;
grant execute on function public.reflection_submission_status(date) to authenticated;
grant execute on function public.reflection_weeks_overview() to authenticated;
