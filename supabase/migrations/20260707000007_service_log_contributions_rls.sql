-- service_log_contributions holds the same kind of PII (name, email) as
-- service_logs itself, and -- like everything else in this project -- is
-- only ever meant to be touched through the admin-gated API, not by
-- regular members directly. Admin-only for all four operations, checked
-- via the `user_role` JWT claim (the same claim requireAdmin() decodes
-- in api/_lib/auth.ts) rather than a subquery against profiles, since
-- that's the mechanism this project already built specifically for this.
alter table public.service_log_contributions enable row level security;

drop policy if exists "Admins can read service_log_contributions" on public.service_log_contributions;
create policy "Admins can read service_log_contributions"
  on public.service_log_contributions
  as permissive
  for select
  to authenticated
  using (auth.jwt() ->> 'user_role' = 'admin');

drop policy if exists "Admins can insert service_log_contributions" on public.service_log_contributions;
create policy "Admins can insert service_log_contributions"
  on public.service_log_contributions
  as permissive
  for insert
  to authenticated
  with check (auth.jwt() ->> 'user_role' = 'admin');

drop policy if exists "Admins can update service_log_contributions" on public.service_log_contributions;
create policy "Admins can update service_log_contributions"
  on public.service_log_contributions
  as permissive
  for update
  to authenticated
  using (auth.jwt() ->> 'user_role' = 'admin')
  with check (auth.jwt() ->> 'user_role' = 'admin');

drop policy if exists "Admins can delete service_log_contributions" on public.service_log_contributions;
create policy "Admins can delete service_log_contributions"
  on public.service_log_contributions
  as permissive
  for delete
  to authenticated
  using (auth.jwt() ->> 'user_role' = 'admin');
