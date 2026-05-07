-- 0003_security_revoke_handle_new_user_rpc.sql
-- handle_new_user is a SECURITY DEFINER trigger function. It runs from inside
-- the on_auth_user_created trigger, where Postgres uses the function owner's
-- privileges regardless of EXECUTE grants. Revoking EXECUTE only blocks
-- direct callers via PostgREST (/rest/v1/rpc/handle_new_user) — which should
-- never be a public surface.
--
-- Triggered by Supabase advisor warnings:
--   anon_security_definer_function_executable
--   authenticated_security_definer_function_executable

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
