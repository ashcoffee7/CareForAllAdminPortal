-- Real backend for the Resources Manager admin page -- previously 100%
-- static mock data in src/pages/resources/ResourcesPage.tsx. Columns
-- mirror exactly what that page already renders per item: a fixed
-- category bucket, a source-type badge, an optional video duration, an
-- audience tag, and a server-authoritative updated_at. category/status/
-- source_type/audience are plain text, not DB enums, matching this
-- repo's existing convention (service_logs.status, chapter_checkins.quarter
-- have no backing check constraint either) -- validity enforced at the
-- API/frontend layer via fixed dropdowns.
create table public.resources (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  description text,
  link text,
  source_type text,
  duration text,
  audience text,
  status text not null default 'published',
  updated_at timestamptz not null default now()
);

create index resources_category_idx on public.resources (category);

alter table public.resources enable row level security;

-- Matches chapters' real "Anyone can view chapters" policy exactly
-- (confirmed via pg_policies: to {public}, using true) -- resources are
-- meant to be visible to members in their portal, not just this admin app.
create policy "Anyone can view resources"
  on public.resources for select
  to public
  using (true);

create policy "Admins can insert resources"
  on public.resources for insert
  to authenticated
  with check (auth.jwt() ->> 'user_role' = 'admin');

create policy "Admins can update resources"
  on public.resources for update
  to authenticated
  using (auth.jwt() ->> 'user_role' = 'admin')
  with check (auth.jwt() ->> 'user_role' = 'admin');

-- No delete policy: the API never exposes DELETE for this table (Hide
-- already covers "remove without destroying").

create or replace function public.set_resources_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger resources_set_updated_at
  before update on public.resources
  for each row
  execute function public.set_resources_updated_at();
