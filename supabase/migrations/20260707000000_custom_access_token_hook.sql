-- Custom Access Token Auth Hook: injects the caller's profiles.role into
-- every JWT Supabase issues (sign-in, refresh), as a claim named
-- `user_role` -- NOT `role`, which is already reserved for the Postgres
-- role PostgREST uses for RLS (authenticated/anon/service_role);
-- overwriting that would break RLS entirely.
--
-- Once this function exists, it still has to be wired up manually in the
-- Supabase Dashboard: Authentication -> Hooks -> "Customize Access Token
-- (JWT) Claims hook" -> select public.custom_access_token_hook. Supabase
-- doesn't let this be enabled via a plain SQL migration.
--
-- After enabling it, existing sessions still hold OLD tokens without the
-- claim -- sign out and back in (or wait for a natural token refresh)
-- before relying on it, or every request will look like a non-admin.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  caller_role text;
begin
  select role into caller_role from public.profiles where id = (event->>'user_id')::uuid;

  claims := event->'claims';

  if caller_role is not null then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(caller_role));
  else
    claims := jsonb_set(claims, '{user_role}', 'null');
  end if;

  event := jsonb_set(event, '{claims}', claims);

  return event;
end;
$$;

-- The Auth service calls this as `supabase_auth_admin`, not as a regular
-- user -- grant/revoke exactly as Supabase's own docs specify, so no
-- authenticated/anon session can call this directly themselves.
grant usage on schema public to supabase_auth_admin;

grant execute on function public.custom_access_token_hook to supabase_auth_admin;

revoke execute on function public.custom_access_token_hook from authenticated, anon, public;

-- Table-level grants alone don't bypass RLS. supabase_auth_admin has no
-- special RLS-bypass privilege, so without both the grant below AND an
-- explicit policy, the `select ... from public.profiles` above fails
-- with a permission/RLS error inside the hook -- which surfaces to the
-- client as a 500 on POST /auth/v1/token, since GoTrue can't finish
-- issuing a token if the hook errors.
grant select on public.profiles to supabase_auth_admin;

drop policy if exists "Allow auth admin to read profiles for custom claims" on public.profiles;

create policy "Allow auth admin to read profiles for custom claims"
  on public.profiles
  as permissive
  for select
  to supabase_auth_admin
  using (true);
