-- `chapters` has row level security enabled (turned on directly in the
-- Supabase dashboard at some point -- no prior migration in this repo
-- created it) with only a "Anyone can view chapters" SELECT policy. With
-- RLS on and no matching policy for a command, Postgres denies it outright
-- (0 rows affected, not an explicit error), which is why PATCH
-- /api/chapters/:id was failing with "Cannot coerce the result to a
-- single JSON object" on .update(...).select().single() -- the update
-- itself silently touched nothing. The same gap blocks POST (create) and
-- DELETE too, so this adds all three, admin-only, matching the
-- auth.jwt() ->> 'user_role' = 'admin' pattern already used for
-- audit_log / service_log_contributions. The API layer's requireAdmin()
-- already gates every /api/chapters write, so this is RLS catching up to
-- match what the app already enforces, not a new restriction.
create policy "Admins can insert chapters"
  on public.chapters for insert
  to authenticated
  with check (auth.jwt() ->> 'user_role' = 'admin');

create policy "Admins can update chapters"
  on public.chapters for update
  to authenticated
  using (auth.jwt() ->> 'user_role' = 'admin')
  with check (auth.jwt() ->> 'user_role' = 'admin');

create policy "Admins can delete chapters"
  on public.chapters for delete
  to authenticated
  using (auth.jwt() ->> 'user_role' = 'admin');
