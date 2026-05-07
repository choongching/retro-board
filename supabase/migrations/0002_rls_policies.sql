-- 0002_rls_policies.sql
-- Row-level security policies. Apply AFTER 0001_init_schema.sql.
-- Apply via Supabase Dashboard → SQL Editor → paste this entire file → Run.

-- Enable RLS on all tables. Without policies below, every query returns 0 rows.
alter table public.profiles enable row level security;
alter table public.boards   enable row level security;
alter table public.cards    enable row level security;

-- ── profiles ──────────────────────────────────────────────────
-- Anyone can read display info (we expose the owner's name on board metadata).
-- Only the user themselves can update their row.
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
  for select
  using (true);

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update
  using (auth.uid() = id);

-- ── boards ────────────────────────────────────────────────────
-- Anyone with the link can read (it's a share-link app).
-- Only authenticated users can insert, with their own UUID as owner.
-- Only the owner can update/delete.
drop policy if exists boards_read on public.boards;
create policy boards_read on public.boards
  for select
  using (true);

drop policy if exists boards_insert on public.boards;
create policy boards_insert on public.boards
  for insert
  with check (auth.uid() = owner_id);

drop policy if exists boards_update on public.boards;
create policy boards_update on public.boards
  for update
  using (auth.uid() = owner_id);

drop policy if exists boards_delete on public.boards;
create policy boards_delete on public.boards
  for delete
  using (auth.uid() = owner_id);

-- ── cards ─────────────────────────────────────────────────────
-- Anyone can read cards (public boards by code).
-- Anyone (including anonymous) can insert and update — the room is the access boundary.
-- Cards can only be deleted by the board's owner (RLS on cards joins boards).
drop policy if exists cards_read on public.cards;
create policy cards_read on public.cards
  for select
  using (true);

drop policy if exists cards_insert on public.cards;
create policy cards_insert on public.cards
  for insert
  with check (true);

drop policy if exists cards_update on public.cards;
create policy cards_update on public.cards
  for update
  using (true);

drop policy if exists cards_delete on public.cards;
create policy cards_delete on public.cards
  for delete
  using (
    auth.uid() in (
      select owner_id from public.boards where boards.id = cards.board_id
    )
  );
