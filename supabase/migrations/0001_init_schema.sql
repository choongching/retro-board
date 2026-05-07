-- 0001_init_schema.sql
-- Initial schema: profiles, boards, cards. Auto-create profile on first sign-in.
-- Apply via Supabase Dashboard → SQL Editor → paste this entire file → Run.

-- ── profiles ──────────────────────────────────────────────────
-- Mirrors auth.users with display fields. One row per signed-in user.
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  name        text,
  created_at  timestamptz not null default now()
);

-- Auto-populate when a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ── boards ────────────────────────────────────────────────────
-- Persistent retros. owner_id is the signed-in creator.
create table if not exists public.boards (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  title           text not null,
  format          text not null check (format in ('classic', 'ssc', 'sailboat')),
  owner_id        uuid not null references public.profiles(id) on delete cascade,
  created_at      timestamptz not null default now(),
  last_active_at  timestamptz not null default now()
);

create index if not exists boards_owner_idx on public.boards (owner_id, last_active_at desc);
create index if not exists boards_code_idx  on public.boards (code);

-- ── cards ─────────────────────────────────────────────────────
-- author_id is text (not uuid) so it can hold either:
--   - a profiles.id (UUID string) for signed-in authors
--   - an anonymous client ID (from localStorage) for unauthenticated participants
-- author_name is a snapshot — anonymous users have no profile row to join against.
create table if not exists public.cards (
  id          uuid primary key default gen_random_uuid(),
  board_id    uuid not null references public.boards(id) on delete cascade,
  col         text not null,
  text        text not null,
  author_id   text,
  author_name text,
  votes       text[] not null default '{}',
  created_at  timestamptz not null default now()
);

create index if not exists cards_board_idx on public.cards (board_id, created_at);
