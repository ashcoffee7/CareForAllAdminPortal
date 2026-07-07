-- "Projects (2+/yr)" on the Chapter Annual Activity Compliance dashboard
-- is normally derived from approved service_logs whose activity_type
-- looks like a project (see api/_handlers/chapters.ts's enriched()).
-- Admins need to correct this manually sometimes -- a project logged
-- under a different activity_type, one tracked outside the system
-- entirely, etc. -- so this column, when set, takes precedence over the
-- derived count instead of trying to make the derivation itself account
-- for every edge case.
alter table public.chapters
  add column if not exists project_count_override integer;
