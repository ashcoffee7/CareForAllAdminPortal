-- Only id, user_id, chapter_name, and quarter are required on a chapter
-- check-in -- everything else (activities, member_count, challenges,
-- submitted_at) should be settable to null. member_count was still
-- not-null, which is what broke the admin dashboard's "Mark Complete"
-- action next (after the RLS and user_id fixes): the API already sends
-- member_count/challenges as null when the admin doesn't supply them,
-- but the column rejected it.
alter table public.chapter_checkins alter column activities drop not null;
alter table public.chapter_checkins alter column member_count drop not null;
alter table public.chapter_checkins alter column challenges drop not null;
alter table public.chapter_checkins alter column submitted_at drop not null;
