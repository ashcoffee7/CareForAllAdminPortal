-- Follow-up to 20260707000000: that migration already ran, so editing its
-- file afterward wouldn't get re-applied by `db push` (migrations are
-- tracked as applied/not-applied by version, not by content). This adds
-- the grants/policy that migration was missing, which is why sign-in
-- started failing with a 500 on POST /auth/v1/token -- the hook function
-- errored trying to read public.profiles as supabase_auth_admin, which
-- has neither a table grant nor an RLS policy allowing it by default.
grant usage on schema public to supabase_auth_admin;

grant select on public.profiles to supabase_auth_admin;

drop policy if exists "Allow auth admin to read profiles for custom claims" on public.profiles;

create policy "Allow auth admin to read profiles for custom claims"
  on public.profiles
  as permissive
  for select
  to supabase_auth_admin
  using (true);
