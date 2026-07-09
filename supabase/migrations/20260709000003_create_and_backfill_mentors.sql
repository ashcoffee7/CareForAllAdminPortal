-- The Mentorship dashboard (api/_handlers/mentors.ts, added earlier this
-- session) has been silently empty since it was built -- public.mentors
-- never actually existed, so every GET /api/mentors returned an empty
-- fallback with no error. A mentor is a profile with role = 'mentor';
-- mentors.id is the same id as profiles.id (like profiles.id = users.id
-- elsewhere in this schema), so each mentor row is intrinsically tied to
-- one profile and can't be duplicated per person.
--
-- This only backfills the CURRENT set of role='mentor' profiles -- it
-- does not keep mentors in sync going forward if someone's role changes
-- to or from 'mentor' later. That would need a trigger on profiles,
-- deliberately not added here since it wasn't asked for.
create table public.mentors (
  id uuid primary key references public.profiles(id) on delete cascade,
  name text not null,
  calendly_link text,
  available boolean not null default false
);

alter table public.mentors enable row level security;

create policy "Admins can view mentors"
  on public.mentors for select
  to authenticated
  using (auth.jwt() ->> 'user_role' = 'admin');

create policy "Admins can insert mentors"
  on public.mentors for insert
  to authenticated
  with check (auth.jwt() ->> 'user_role' = 'admin');

create policy "Admins can update mentors"
  on public.mentors for update
  to authenticated
  using (auth.jwt() ->> 'user_role' = 'admin')
  with check (auth.jwt() ->> 'user_role' = 'admin');

create policy "Admins can delete mentors"
  on public.mentors for delete
  to authenticated
  using (auth.jwt() ->> 'user_role' = 'admin');

insert into public.mentors (id, name, calendly_link, available)
select
  p.id,
  coalesce(nullif(trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), ''), 'Unknown'),
  p.calendly_url,
  false
from public.profiles p
where p.role = 'mentor';
