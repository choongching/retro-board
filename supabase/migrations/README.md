# Supabase migrations

Numbered SQL files applied in order. Apply manually via **Supabase Dashboard → SQL Editor → New query → paste → Run**.

## Apply order

1. `0001_init_schema.sql` — tables (profiles, boards, cards) + auto-profile trigger
2. `0002_rls_policies.sql` — Row-Level Security policies. Apply AFTER 0001.

## Verification after applying

In the SQL Editor, run:

```sql
-- Tables exist
select table_name from information_schema.tables
where table_schema = 'public' and table_name in ('profiles','boards','cards');

-- RLS is on
select tablename, rowsecurity from pg_tables
where schemaname = 'public' and tablename in ('profiles','boards','cards');

-- Policies exist
select schemaname, tablename, policyname from pg_policies
where schemaname = 'public';
```

Expected:
- 3 rows in the first query (profiles, boards, cards)
- All 3 should have `rowsecurity = true` in the second query
- ~10 rows in the third query (read/insert/update/delete policies across the three tables)

## Rolling back

If something goes wrong, you can drop everything with:

```sql
drop table if exists public.cards cascade;
drop table if exists public.boards cascade;
drop table if exists public.profiles cascade;
drop function if exists public.handle_new_user cascade;
```

Then re-apply 0001 and 0002.
