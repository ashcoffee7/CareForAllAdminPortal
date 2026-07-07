-- service_logs.user_id was assumed to have no foreign key to profiles
-- (see the old src/lib/joinServiceLogsToProfiles.ts, which did the join
-- as two client-side round trips instead). Turns out the constraint
-- already exists on the live database -- added outside any tracked
-- migration, likely via the Supabase Dashboard -- so this only needs to
-- add it if it's actually missing. Guarded the same way the realtime
-- migration guards `alter publication`, so this is safe to re-run.
--
-- If the constraint is missing and this fails to add it, it means some
-- service_logs.user_id values don't match any profiles.id -- run this
-- first to find them:
--
--   select id, user_id from public.service_logs
--   where user_id is not null
--     and user_id not in (select id from public.profiles);
--
-- and either null out or fix those rows before re-running this migration.
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
