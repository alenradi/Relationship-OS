-- =============================================================================
-- Us — 0001_foundation
-- Couple spaces, profiles, pairing RPCs, and the shared security helpers that
-- every later migration builds on.
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- couples
-- -----------------------------------------------------------------------------
create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- set once the two of you finish the first-run wizard
  onboarding_completed_at timestamptz,
  -- drives the "time to review your constitution" banner
  constitution_reviewed_at timestamptz
);

-- -----------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  couple_id uuid references public.couples (id) on delete set null,
  display_name text not null default '',
  -- drives natural-language summaries ("She's an 8/10 today")
  pronoun text not null default 'they' check (pronoun in ('she', 'he', 'they')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_couple_id_idx on public.profiles (couple_id);

-- -----------------------------------------------------------------------------
-- Helpers
--
-- current_couple_id() is SECURITY DEFINER on purpose: it lets RLS policies on
-- profiles (and every other table) ask "which couple does the caller belong
-- to?" without re-entering the policy that is currently being evaluated, which
-- would otherwise recurse infinitely.
-- -----------------------------------------------------------------------------
create or replace function public.current_couple_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select couple_id from public.profiles where id = auth.uid();
$$;

create or replace function public.partner_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.id
  from public.profiles p
  where p.couple_id = public.current_couple_id()
    and p.id <> auth.uid()
  limit 1;
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Unambiguous alphabet: no I/L/O/0/1 so codes are easy to read out loud.
create or replace function public.generate_invite_code()
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text;
  i int;
begin
  loop
    code := '';
    for i in 1..8 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.couples where invite_code = code);
  end loop;
  return code;
end;
$$;

-- -----------------------------------------------------------------------------
-- Hard cap: a couple space holds exactly two people.
-- The advisory lock closes the race where both partners redeem the same invite
-- code at the same instant and each sees a count of 1.
-- -----------------------------------------------------------------------------
create or replace function public.enforce_couple_capacity()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  member_count int;
begin
  if new.couple_id is null then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.couple_id is not distinct from new.couple_id then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext(new.couple_id::text));

  select count(*) into member_count
  from public.profiles
  where couple_id = new.couple_id
    and id <> new.id;

  if member_count >= 2 then
    raise exception 'This couple space already has two members.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_enforce_capacity on public.profiles;
create trigger profiles_enforce_capacity
  before insert or update on public.profiles
  for each row execute function public.enforce_couple_capacity();

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists couples_touch_updated_at on public.couples;
create trigger couples_touch_updated_at
  before update on public.couples
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Every new auth user gets a profile immediately, so the app never has to cope
-- with a signed-in user that has no profile row.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  meta_pronoun text := new.raw_user_meta_data ->> 'pronoun';
begin
  insert into public.profiles (id, display_name, pronoun)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      initcap(split_part(new.email, '@', 1))
    ),
    case when meta_pronoun in ('she', 'he', 'they') then meta_pronoun else 'they' end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Pairing RPCs.
-- These are SECURITY DEFINER because joining requires looking up a couple by
-- invite code — a row the caller is not yet allowed to read.
-- -----------------------------------------------------------------------------
create or replace function public.create_couple_space()
returns public.couples
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  existing_couple uuid;
  new_couple public.couples;
begin
  if uid is null then
    raise exception 'You must be signed in.' using errcode = '28000';
  end if;

  select couple_id into existing_couple from public.profiles where id = uid;

  if existing_couple is not null then
    raise exception 'You are already part of a couple space.' using errcode = 'check_violation';
  end if;

  insert into public.couples (invite_code)
  values (public.generate_invite_code())
  returning * into new_couple;

  update public.profiles
     set couple_id = new_couple.id
   where id = uid;

  return new_couple;
end;
$$;

create or replace function public.join_couple_with_code(p_code text)
returns public.couples
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  existing_couple uuid;
  target public.couples;
  member_count int;
  normalized text;
begin
  if uid is null then
    raise exception 'You must be signed in.' using errcode = '28000';
  end if;

  select couple_id into existing_couple from public.profiles where id = uid;

  if existing_couple is not null then
    raise exception 'You are already part of a couple space.' using errcode = 'check_violation';
  end if;

  normalized := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));

  select * into target from public.couples where invite_code = normalized;

  if target.id is null then
    raise exception 'That invite code does not match any couple space.' using errcode = 'no_data_found';
  end if;

  perform pg_advisory_xact_lock(hashtext(target.id::text));

  select count(*) into member_count from public.profiles where couple_id = target.id;

  if member_count >= 2 then
    raise exception 'That couple space is already full.' using errcode = 'check_violation';
  end if;

  update public.profiles
     set couple_id = target.id
   where id = uid;

  return target;
end;
$$;

-- -----------------------------------------------------------------------------
-- couple_events
--
-- A content-free activity pulse. It exists for two reasons:
--   1. Realtime. A partner cannot read an unrevealed reflection row, so a
--      postgres_changes subscription on that table would never fire for them.
--      Both partners can always read couple_events, so it is the signal that
--      says "something happened, refetch".
--   2. Celebrations. Positive-only counts on the dashboard are derived from it.
-- Payloads must never carry reflection or journal content.
-- -----------------------------------------------------------------------------
create table if not exists public.couple_events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.current_couple_id() references public.couples (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists couple_events_couple_created_idx
  on public.couple_events (couple_id, created_at desc);
create index if not exists couple_events_kind_idx
  on public.couple_events (couple_id, kind, created_at desc);

create or replace function public.log_couple_event(
  p_couple_id uuid,
  p_actor_id uuid,
  p_kind text,
  p_payload jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_couple_id is null then
    return;
  end if;

  insert into public.couple_events (couple_id, actor_id, kind, payload)
  values (p_couple_id, p_actor_id, p_kind, coalesce(p_payload, '{}'::jsonb));
end;
$$;

-- -----------------------------------------------------------------------------
-- Row level security
-- -----------------------------------------------------------------------------
alter table public.couples enable row level security;
alter table public.profiles enable row level security;
alter table public.couple_events enable row level security;

drop policy if exists couples_select_own on public.couples;
create policy couples_select_own on public.couples
  for select to authenticated
  using (id = public.current_couple_id());

-- Needed for onboarding_completed_at and constitution_reviewed_at.
drop policy if exists couples_update_own on public.couples;
create policy couples_update_own on public.couples
  for update to authenticated
  using (id = public.current_couple_id())
  with check (id = public.current_couple_id());

drop policy if exists profiles_select_self_or_partner on public.profiles;
create policy profiles_select_self_or_partner on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or (couple_id is not null and couple_id = public.current_couple_id())
  );

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists couple_events_select_own on public.couple_events;
create policy couple_events_select_own on public.couple_events
  for select to authenticated
  using (couple_id = public.current_couple_id());

-- -----------------------------------------------------------------------------
-- Column-level privileges
--
-- Belt and braces on top of RLS: even with an UPDATE policy on their own row, a
-- user cannot rewrite couple_id and walk into another couple's space. Changing
-- couple_id is only possible through the two pairing RPCs above.
-- -----------------------------------------------------------------------------
revoke update on public.profiles from authenticated;
grant update (display_name, pronoun) on public.profiles to authenticated;

revoke update on public.couples from authenticated;
grant update (onboarding_completed_at, constitution_reviewed_at) on public.couples to authenticated;

-- Events are written by triggers and RPCs only.
revoke insert, update, delete on public.couple_events from authenticated;

revoke all on function public.create_couple_space() from anon;
revoke all on function public.join_couple_with_code(text) from anon;
revoke all on function public.log_couple_event(uuid, uuid, text, jsonb) from anon, authenticated;

grant execute on function public.create_couple_space() to authenticated;
grant execute on function public.join_couple_with_code(text) to authenticated;
grant execute on function public.current_couple_id() to authenticated;
grant execute on function public.partner_id() to authenticated;
