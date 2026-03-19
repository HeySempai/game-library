-- Tables for Board Game app
-- Run this in Supabase SQL Editor (project-level) before importing CSVs

-- game_config: per-game settings
create table if not exists public.game_config (
  game_id text primary key,
  victory_type text not null,
  team_mode text null,
  created_at timestamptz not null default now()
);

-- game_sessions: played sessions
create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  game_id text not null,
  date date not null,
  duration_minutes integer null,
  victory_type text not null,
  cooperative_win boolean null,
  notes text null,
  created_at timestamptz not null default now()
);

-- session_participants: players per session
create table if not exists public.session_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  player_name text not null,
  score integer null,
  is_winner boolean not null default false,
  team text null
);

-- victories: quick wins log
create table if not exists public.victories (
  id uuid primary key default gen_random_uuid(),
  game_id text not null,
  winner text not null,
  date date not null,
  created_at timestamptz not null default now()
);

-- RLS: enable and allow anon select/insert as needed by the app
alter table public.game_config enable row level security;
alter table public.game_sessions enable row level security;
alter table public.session_participants enable row level security;
alter table public.victories enable row level security;

-- Read access for all (anon)
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='game_config' and policyname='game_config_select_all'
  ) then
    create policy game_config_select_all on public.game_config for select using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='game_sessions' and policyname='game_sessions_select_all'
  ) then
    create policy game_sessions_select_all on public.game_sessions for select using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='session_participants' and policyname='session_participants_select_all'
  ) then
    create policy session_participants_select_all on public.session_participants for select using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='victories' and policyname='victories_select_all'
  ) then
    create policy victories_select_all on public.victories for select using (true);
  end if;
end $$;

-- Writes from the client app
do $$ begin
  -- game_config is updated from the UI (upsert)
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='game_config' and policyname='game_config_write_all'
  ) then
    create policy game_config_write_all on public.game_config for insert with check (true);
    create policy game_config_update_all on public.game_config for update using (true) with check (true);
  end if;

  -- app creates/deletes sessions and adds participants
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='game_sessions' and policyname='game_sessions_write_all'
  ) then
    create policy game_sessions_write_all on public.game_sessions for insert with check (true);
    create policy game_sessions_delete_all on public.game_sessions for delete using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='session_participants' and policyname='session_participants_write_all'
  ) then
    create policy session_participants_write_all on public.session_participants for insert with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='victories' and policyname='victories_write_all'
  ) then
    create policy victories_write_all on public.victories for insert with check (true);
  end if;
end $$;

-- Optional: simple indexes for common filters
create index if not exists idx_game_sessions_game_id on public.game_sessions(game_id);
create index if not exists idx_game_sessions_date on public.game_sessions(date);
create index if not exists idx_participants_session_id on public.session_participants(session_id);

