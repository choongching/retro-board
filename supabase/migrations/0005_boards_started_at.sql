-- 0005_boards_started_at.sql
-- Adds the lobby state to boards. Null = lobby (pre-start), set = live.
-- Existing rows backfill to created_at so live sessions are unaffected.
-- Apply via Supabase Dashboard → SQL Editor → paste this entire file → Run.

alter table public.boards
  add column if not exists started_at timestamptz;

update public.boards
  set started_at = created_at
  where started_at is null;

-- No NOT NULL constraint: null is the lobby state for newly created boards.
-- No RLS change needed: existing boards_update policy covers the new column.
