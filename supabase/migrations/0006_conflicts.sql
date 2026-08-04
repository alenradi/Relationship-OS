-- =============================================================================
-- Us — 0006_conflicts
-- A record of things you already worked through. Entries are written after the
-- repair, never during the fight — the UI copy says so explicitly.
-- =============================================================================

create table if not exists public.conflicts (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.current_couple_id() references public.couples (id) on delete cascade,
  title text not null,
  happened_on date,
  what_it_was_about text not null default '',
  -- Each perspective is written separately and attributed, so neither of you is
  -- summarising the other.
  perspective_a_user uuid references public.profiles (id) on delete set null,
  perspective_a text not null default '',
  perspective_b_user uuid references public.profiles (id) on delete set null,
  perspective_b text not null default '',
  trigger_note text not null default '',
  resolution text not null default '',
  agreed_action text not null default '',
  follow_up_date date,
  follow_up_status text not null default 'pending'
    check (follow_up_status in ('pending', 'worked', 'partly', 'didnt_work')),
  follow_up_note text not null default '',
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conflicts_title_not_blank check (length(trim(title)) > 0)
);

create index if not exists conflicts_couple_idx on public.conflicts (couple_id, created_at desc);
create index if not exists conflicts_follow_up_idx
  on public.conflicts (couple_id, follow_up_status, follow_up_date);

drop trigger if exists conflicts_touch_updated_at on public.conflicts;
create trigger conflicts_touch_updated_at
  before update on public.conflicts
  for each row execute function public.touch_updated_at();

create or replace function public.conflicts_announce()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_couple_event(
      new.couple_id, coalesce(auth.uid(), new.created_by), 'conflict_logged',
      jsonb_build_object('conflict_id', new.id, 'title', new.title)
    );
  elsif new.follow_up_status <> 'pending' and old.follow_up_status = 'pending' then
    perform public.log_couple_event(
      new.couple_id, auth.uid(), 'conflict_followed_up',
      jsonb_build_object('conflict_id', new.id, 'title', new.title, 'outcome', new.follow_up_status)
    );
  end if;

  return null;
end;
$$;

drop trigger if exists conflicts_announce on public.conflicts;
create trigger conflicts_announce
  after insert or update on public.conflicts
  for each row execute function public.conflicts_announce();

-- -----------------------------------------------------------------------------
-- RLS: written together, so either partner may create and edit.
-- -----------------------------------------------------------------------------
alter table public.conflicts enable row level security;

drop policy if exists conflicts_select_own_couple on public.conflicts;
create policy conflicts_select_own_couple on public.conflicts
  for select to authenticated
  using (couple_id = public.current_couple_id());

drop policy if exists conflicts_insert_own_couple on public.conflicts;
create policy conflicts_insert_own_couple on public.conflicts
  for insert to authenticated
  with check (couple_id = public.current_couple_id());

drop policy if exists conflicts_update_own_couple on public.conflicts;
create policy conflicts_update_own_couple on public.conflicts
  for update to authenticated
  using (couple_id = public.current_couple_id())
  with check (couple_id = public.current_couple_id());

drop policy if exists conflicts_delete_own_couple on public.conflicts;
create policy conflicts_delete_own_couple on public.conflicts
  for delete to authenticated
  using (couple_id = public.current_couple_id());
