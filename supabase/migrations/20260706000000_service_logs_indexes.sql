-- service_logs is filtered by status and user_id, and ordered by
-- submitted_at, on nearly every admin-portal page load (approvals queue,
-- verification tab, leaderboards, overview stats). Without indexes these
-- all fall back to sequential scans, which gets worse as submission
-- volume grows during a live event.
create index if not exists service_logs_status_idx on public.service_logs (status);
create index if not exists service_logs_submitted_at_idx on public.service_logs (submitted_at);
create index if not exists service_logs_user_id_idx on public.service_logs (user_id);
