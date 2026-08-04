-- =============================================================================
-- Us — 0008_realtime_and_lockdown
-- Turn on realtime where it matters, and make sure nothing is readable without
-- being signed in.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Realtime
--
-- couple_events is the workhorse: it is readable by both partners, so it can
-- signal "your partner just submitted" without exposing what they wrote.
-- daily_status and goal_cheers are safe to stream directly since both partners
-- can already read every row.
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  for t in
    select unnest(array['couple_events', 'daily_status', 'goal_cheers']::text[])
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;

-- Realtime needs the full old row to evaluate RLS on updates/deletes.
alter table public.couple_events replica identity full;
alter table public.daily_status replica identity full;
alter table public.goal_cheers replica identity full;

-- -----------------------------------------------------------------------------
-- Lockdown: this app has no public surface at all. Every table requires a
-- signed-in user, and no policy is written for the anon role.
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  for t in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('revoke all on public.%I from anon', t);
  end loop;
end;
$$;

-- Supabase grants privileges on future tables to anon by default; stop that so a
-- later migration cannot accidentally open a public hole.
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke all on functions from anon;
