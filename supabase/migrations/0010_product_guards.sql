-- =============================================================================
-- Us — 0010_product_guards
-- Enforce product rules at the database layer:
-- 1) daily_status only writable for "today" in Europe/Ljubljana
-- 2) rules only writable during setup or when the 30-day review window is open
-- =============================================================================

-- Civil date in Europe/Ljubljana for the current instant.
create or replace function public.app_today()
returns date
language sql
stable
set search_path = public, pg_temp
as $$
  select (timezone('Europe/Ljubljana', now()))::date;
$$;

-- True when the caller's couple may edit constitution agreements.
create or replace function public.constitution_is_editable()
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  couple_id uuid := public.current_couple_id();
  onboarded_at timestamptz;
  reviewed_at timestamptz;
  anchor date;
begin
  if couple_id is null then
    return false;
  end if;

  select onboarding_completed_at, constitution_reviewed_at
    into onboarded_at, reviewed_at
  from public.couples
  where id = couple_id;

  -- During first-run setup the constitution is writable.
  if onboarded_at is null then
    return true;
  end if;

  anchor := coalesce(reviewed_at, onboarded_at)::date;
  return public.app_today() >= (anchor + 30);
end;
$$;

create or replace function public.enforce_daily_status_today()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.status_date <> public.app_today() then
    raise exception 'Daily rhythm can only be logged for today (%).', public.app_today()
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists daily_status_only_today on public.daily_status;
create trigger daily_status_only_today
  before insert or update on public.daily_status
  for each row execute function public.enforce_daily_status_today();

create or replace function public.enforce_constitution_edit_window()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if not public.constitution_is_editable() then
    raise exception 'Agreements can only be edited during setup or the monthly review window.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists rules_edit_window on public.rules;
create trigger rules_edit_window
  before insert or update or delete on public.rules
  for each row execute function public.enforce_constitution_edit_window();

-- Seed / admin paths that use the service role still bypass RLS, but triggers
-- still fire. For seed scripts we allow service_role to skip the day lock by
-- checking current_user — service_role connections use role `service_role`.
create or replace function public.enforce_daily_status_today()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if current_setting('role', true) = 'service_role' then
    return new;
  end if;
  if auth.role() = 'service_role' then
    return new;
  end if;
  if new.status_date <> public.app_today() then
    raise exception 'Daily rhythm can only be logged for today (%).', public.app_today()
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create or replace function public.enforce_constitution_edit_window()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if current_setting('role', true) = 'service_role' then
    return coalesce(new, old);
  end if;
  if auth.role() = 'service_role' then
    return coalesce(new, old);
  end if;
  if not public.constitution_is_editable() then
    raise exception 'Agreements can only be edited during setup or the monthly review window.'
      using errcode = 'check_violation';
  end if;
  return coalesce(new, old);
end;
$$;
