-- The admin portal now subscribes to service_logs changes over Supabase
-- Realtime (see src/lib/useServiceLogsRealtime.ts) so the approvals queue
-- and leaderboards update live during an event instead of requiring a
-- manual refresh. Realtime only broadcasts changes for tables added to
-- the supabase_realtime publication, so add it here (guarded so this is
-- safe to re-run if the table's already a member, e.g. added via the
-- dashboard's Realtime toggle).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'service_logs'
  ) then
    alter publication supabase_realtime add table public.service_logs;
  end if;
end $$;
