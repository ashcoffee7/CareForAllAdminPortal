-- Previously the admin portal set reviewed_by/reviewed_at/
-- verification_completed_at itself from the browser (see the old
-- useSubmissions.ts / useVerifications.ts), which means any authenticated
-- client could submit an update() with arbitrary values for who "reviewed"
-- a submission and when. This trigger makes those fields
-- server-authoritative: they're always derived from auth.uid()/now() on
-- the row that's actually being written, regardless of what the client
-- payload contains.
create or replace function public.set_service_log_review_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
  end if;

  if new.verification_completed is distinct from old.verification_completed then
    new.verification_completed_at := case when new.verification_completed then now() else null end;
  end if;

  return new;
end;
$$;

drop trigger if exists service_logs_review_audit on public.service_logs;

create trigger service_logs_review_audit
  before update on public.service_logs
  for each row
  execute function public.set_service_log_review_audit();
