-- resources previously had no DELETE policy at all (Hide was meant to
-- cover "remove without destroying"), but a real hard-delete action was
-- requested. Adds admin-only DELETE, matching the INSERT/UPDATE policies
-- already on this table.
create policy "Admins can delete resources"
  on public.resources for delete
  to authenticated
  using (is_admin());
