-- Adds the two columns from the import spreadsheet that don't already
-- have a home on service_logs. Everything else in that spreadsheet
-- (Timestamp, Name, Activity Type, Hours, Description, Primary Impact,
-- Impact Magnitude, Status, Org Name) already maps to an existing column.
--
-- Both nullable: not every historical row will have a rejection reason
-- (only ones that were actually rejected), and email is best-effort
-- provenance for rows that don't resolve to a real user_id -- same
-- pattern as the existing free-text `name`/`org_name` fallback columns.
alter table public.service_logs
  add column if not exists email text,
  add column if not exists rejection_reason text;
