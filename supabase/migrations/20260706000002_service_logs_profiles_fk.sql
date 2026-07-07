-- This migration is a deliberate no-op, kept for history rather than
-- deleted since it already ran successfully.
--
-- Original intent: add a service_logs.user_id -> profiles.id FK so
-- PostgREST could embed profiles directly from service_logs. Turned out a
-- constraint named `service_logs_user_id_fkey` already existed on the
-- live database -- but pointing at `users`, not `profiles`
-- (service_logs.user_id -> users.id; separately, profiles.id -> users.id
-- too). Since constraint names are unique per table, this migration's
-- `add constraint` was silently skipped by the guard below because a
-- constraint with that name already existed, just referencing a
-- different table than assumed.
--
-- There is no direct FK from service_logs to profiles, and none is
-- needed: profiles can still be looked up from a service_logs row via
-- `profiles.id = service_logs.user_id` (they share the same users.id
-- space), just as a plain second query instead of a PostgREST embed --
-- see api/_lib/joinProfiles.ts.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'service_logs_user_id_fkey'
      and conrelid = 'public.service_logs'::regclass
  ) then
    alter table public.service_logs
      add constraint service_logs_user_id_fkey
      foreign key (user_id) references public.profiles(id)
      on delete set null;
  end if;
end $$;
