-- Re-adds the admin-settable project count override on chapters. This
-- column previously existed and was dropped (20260707000014); it's back
-- because admins need a way to correct a chapter's project count when the
-- derived count (from approved "project" service_logs linked to a chapter
-- via member profiles) doesn't reflect reality -- e.g. projects logged
-- before the person had a linked profile. Null means "use the derived
-- count", set means "use this value instead".
alter table public.chapters
  add column if not exists project_count_override integer;
