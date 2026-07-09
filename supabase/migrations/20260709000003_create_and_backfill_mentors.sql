-- This migration originally created + backfilled public.mentors, based
-- on a false premise: an earlier information_schema check appeared to
-- show the table didn't exist, but that turned out to be a transient
-- issue on that check, not reality. public.mentors already existed with
-- the exact columns this migration would have created (id, name,
-- calendly_link, available) and 27 real rows -- confirmed directly
-- before this fix went out, and before the original version of this
-- migration was ever run against the database. Left as a no-op rather
-- than deleting the file, so the migration history stays consistent.
select 1;
