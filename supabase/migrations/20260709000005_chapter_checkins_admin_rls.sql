-- chapter_checkins has RLS enabled (set up directly in the Supabase
-- dashboard, not through a migration in this repo) with a
-- chapter_leads_insert_checkins policy requiring auth.uid() = user_id --
-- meant for chapter leads submitting their own quarterly check-in
-- directly. The admin portal's "Mark Complete" action
-- (POST /api/chapter-checkins, api/_handlers/chapterCheckins.ts) never
-- sets user_id at all, so that check always fails for an admin-initiated
-- insert with "new row violates row-level security policy" -- the same
-- class of bug as the chapters INSERT/UPDATE gap fixed earlier
-- (20260709000001_chapters_admin_write_rls.sql), just a different table.
--
-- There's also no DELETE policy on this table at all, which would hit
-- the same "no matching policy = denied" wall the next time an admin
-- uses "Unmark" (DELETE /api/chapter-checkins/:id) -- fixed here too,
-- before it's separately reported as a bug.
--
-- Reuses the existing public.is_admin() function (already used by this
-- table's "Admins can view all chapter checkins" policy) rather than the
-- auth.jwt() ->> 'user_role' = 'admin' pattern used elsewhere in this
-- session, for consistency with what's already established on this
-- specific table.
create policy "Admins can insert chapter checkins"
  on public.chapter_checkins for insert
  to authenticated
  with check (is_admin());

create policy "Admins can delete chapter checkins"
  on public.chapter_checkins for delete
  to authenticated
  using (is_admin());
