-- Goal rewards: what you promised yourselves when this lands.
alter table public.goals
  add column if not exists reward_description text not null default '';
