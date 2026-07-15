-- Consolidates every admin-gated RLS policy this session added onto the
-- established public.is_admin() function (queries profiles.role live via
-- auth.uid(), used by chapter_checkins' own pre-existing admin policy)
-- instead of the auth.jwt() ->> 'user_role' = 'admin' claim check used so
-- far. The JWT claim is baked in at sign-in time by the custom access
-- token hook -- if an admin's role changes after that, their existing
-- token keeps the stale claim until it refreshes. is_admin() has no such
-- staleness window, and matches what's already established on
-- chapter_checkins. Same policies, same tables, same access rules --
-- only the underlying check changes.

drop policy if exists "Admins can insert chapters" on public.chapters;
create policy "Admins can insert chapters"
  on public.chapters for insert
  to authenticated
  with check (is_admin());

drop policy if exists "Admins can update chapters" on public.chapters;
create policy "Admins can update chapters"
  on public.chapters for update
  to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "Admins can delete chapters" on public.chapters;
create policy "Admins can delete chapters"
  on public.chapters for delete
  to authenticated
  using (is_admin());

drop policy if exists "Admins can insert resources" on public.resources;
create policy "Admins can insert resources"
  on public.resources for insert
  to authenticated
  with check (is_admin());

drop policy if exists "Admins can update resources" on public.resources;
create policy "Admins can update resources"
  on public.resources for update
  to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "Admins can read service_log_contributions" on public.service_log_contributions;
create policy "Admins can read service_log_contributions"
  on public.service_log_contributions for select
  to authenticated
  using (is_admin());

drop policy if exists "Admins can insert service_log_contributions" on public.service_log_contributions;
create policy "Admins can insert service_log_contributions"
  on public.service_log_contributions for insert
  to authenticated
  with check (is_admin());

drop policy if exists "Admins can update service_log_contributions" on public.service_log_contributions;
create policy "Admins can update service_log_contributions"
  on public.service_log_contributions for update
  to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "Admins can delete service_log_contributions" on public.service_log_contributions;
create policy "Admins can delete service_log_contributions"
  on public.service_log_contributions for delete
  to authenticated
  using (is_admin());
