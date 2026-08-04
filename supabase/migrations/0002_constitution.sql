-- =============================================================================
-- Us — 0002_constitution
-- The rules you agree on, plus an append-only history of how each one evolved.
-- =============================================================================

create table if not exists public.rules (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null default public.current_couple_id() references public.couples (id) on delete cascade,
  title text not null,
  description text not null default '',
  why_agreed text not null default '',
  category text not null default 'other'
    check (category in ('communication', 'alone_time', 'boundaries', 'fighting_fair', 'other')),
  status text not null default 'active'
    check (status in ('active', 'renegotiated', 'retired')),
  version int not null default 1,
  -- The note attached to the most recent change; snapshotted into rule_versions.
  change_note text not null default '',
  sort_order int not null default 0,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rules_title_not_blank check (length(trim(title)) > 0)
);

create index if not exists rules_couple_idx on public.rules (couple_id, status, sort_order);

-- Append-only snapshot of every version of every rule.
create table if not exists public.rule_versions (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references public.rules (id) on delete cascade,
  couple_id uuid not null references public.couples (id) on delete cascade,
  version int not null,
  title text not null,
  description text not null default '',
  why_agreed text not null default '',
  category text not null,
  status text not null,
  change_note text not null default '',
  changed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (rule_id, version)
);

create index if not exists rule_versions_rule_idx on public.rule_versions (rule_id, version desc);
create index if not exists rule_versions_couple_idx on public.rule_versions (couple_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Versioning: bump on any meaningful content change, then snapshot.
-- -----------------------------------------------------------------------------
create or replace function public.rules_bump_version()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if (new.title, new.description, new.why_agreed, new.status, new.category)
     is distinct from
     (old.title, old.description, old.why_agreed, old.status, old.category)
  then
    new.version := old.version + 1;
    new.updated_at := now();
  else
    -- Cosmetic-only change (e.g. reordering): keep the version and the note.
    new.version := old.version;
    new.change_note := old.change_note;
  end if;

  return new;
end;
$$;

create or replace function public.rules_snapshot_version()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'UPDATE' and new.version = old.version then
    return null;
  end if;

  insert into public.rule_versions (
    rule_id, couple_id, version, title, description, why_agreed,
    category, status, change_note, changed_by
  )
  values (
    new.id, new.couple_id, new.version, new.title, new.description, new.why_agreed,
    new.category, new.status, new.change_note, coalesce(auth.uid(), new.created_by)
  )
  on conflict (rule_id, version) do nothing;

  perform public.log_couple_event(
    new.couple_id,
    coalesce(auth.uid(), new.created_by),
    case when tg_op = 'INSERT' then 'rule_created' else 'rule_updated' end,
    jsonb_build_object('rule_id', new.id, 'title', new.title, 'version', new.version, 'status', new.status)
  );

  return null;
end;
$$;

drop trigger if exists rules_bump_version on public.rules;
create trigger rules_bump_version
  before update on public.rules
  for each row execute function public.rules_bump_version();

drop trigger if exists rules_snapshot_version on public.rules;
create trigger rules_snapshot_version
  after insert or update on public.rules
  for each row execute function public.rules_snapshot_version();

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.rules enable row level security;
alter table public.rule_versions enable row level security;

drop policy if exists rules_select_own_couple on public.rules;
create policy rules_select_own_couple on public.rules
  for select to authenticated
  using (couple_id = public.current_couple_id());

-- Either partner may write rules: the constitution belongs to both of you.
drop policy if exists rules_insert_own_couple on public.rules;
create policy rules_insert_own_couple on public.rules
  for insert to authenticated
  with check (couple_id = public.current_couple_id());

drop policy if exists rules_update_own_couple on public.rules;
create policy rules_update_own_couple on public.rules
  for update to authenticated
  using (couple_id = public.current_couple_id())
  with check (couple_id = public.current_couple_id());

drop policy if exists rules_delete_own_couple on public.rules;
create policy rules_delete_own_couple on public.rules
  for delete to authenticated
  using (couple_id = public.current_couple_id());

-- History is readable but never editable: that is the point of history.
drop policy if exists rule_versions_select_own_couple on public.rule_versions;
create policy rule_versions_select_own_couple on public.rule_versions
  for select to authenticated
  using (couple_id = public.current_couple_id());

revoke insert, update, delete on public.rule_versions from authenticated;
revoke update (version, couple_id) on public.rules from authenticated;
