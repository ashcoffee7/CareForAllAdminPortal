-- service_logs.user_id has always been a bare uuid column with no
-- foreign key to profiles, so every admin-portal query that needed a
-- member's name/chapter had to do it as two round trips (fetch logs,
-- collect user_ids, fetch profiles, join in JS -- see the old
-- src/lib/joinServiceLogsToProfiles.ts). Adding a real FK lets PostgREST
-- do the join in a single request via an embedded select
-- (`profiles:user_id ( ... )`).
--
-- If this fails to apply, it means some service_logs.user_id values
-- don't match any profiles.id -- run this first to find them:
--
--   select id, user_id from public.service_logs
--   where user_id is not null
--     and user_id not in (select id from public.profiles);
--
-- and either null out or fix those rows before re-running this migration.
alter table public.service_logs
  add constraint service_logs_user_id_fkey
  foreign key (user_id) references public.profiles(id)
  on delete set null;
