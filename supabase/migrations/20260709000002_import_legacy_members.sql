-- One-time backfill of profiles from a CSV of people never captured
-- through the normal signup flow (columns: timestamp, email, full_name,
-- gender, date_of_birth, location, education_level), loaded into a
-- staging table (public.staging_member_import) via the Supabase
-- dashboard's CSV import before this migration runs.
--
-- These people are directory/demographic-only entries -- no auth.users
-- row, so they can't log in (confirmed public.users.id has no FK back to
-- auth.users.id, so a fresh UUID here is safe). Matching is by trimmed,
-- lowercased email against public.users.email:
--   - No match: creates a new users + profiles row (role
--     'independent_member', same safe default the real signup trigger
--     uses).
--   - Match: fills in only currently-null fields on the existing
--     profiles row via coalesce -- never overwrites anything already set.
--
-- gender values in the CSV already match the gender_type enum spelling
-- exactly, so unrecognized values (typos, blanks) just fall through to
-- null rather than guessed. education_level is freeform and mapped
-- explicitly below, based on the actual distinct values seen in this
-- dataset; anything not in the mapping (e.g. "Parent", "unrwa") is left
-- null. date_of_birth is MM/DD/YYYY text, guarded by a regex so one
-- malformed date doesn't abort the whole migration. full_name is split
-- on the first space; single-word names get a null last_name rather than
-- a guess. Rows with a blank email are skipped entirely -- there's no
-- reliable way to dedupe or match them.
-- If a CSV had two rows for the same email, only one is kept (arbitrary
-- but stable pick via distinct on) rather than creating a duplicate
-- person.

with source as (
  select distinct on (lower(trim(email)))
    trim(email) as email,
    trim(full_name) as full_name,
    nullif(trim(gender), '') as gender_raw,
    nullif(trim(date_of_birth), '') as dob_raw,
    nullif(trim(location), '') as location,
    nullif(trim(education_level), '') as education_raw
  from public.staging_member_import
  where email is not null and trim(email) <> ''
  order by lower(trim(email))
),
mapped as (
  select
    email,
    full_name,
    split_part(full_name, ' ', 1) as first_name,
    case when position(' ' in full_name) > 0
      then nullif(trim(substring(full_name from position(' ' in full_name) + 1)), '')
      else null
    end as last_name,
    case
      when gender_raw in ('Male', 'Female', 'Nonbinary', 'Prefer Not to Say', 'Other') then gender_raw::gender_type
      else null
    end as gender,
    case
      when dob_raw ~ '^\d{1,2}/\d{1,2}/\d{4}$' then to_date(dob_raw, 'MM/DD/YYYY')
      else null
    end as date_of_birth,
    location,
    (case education_raw
      when 'Undergraduate Student' then 'Undergraduate'
      when 'Post graduate Student' then 'Graduate'
      when 'High School / Secondary School Student' then 'High School'
      when 'Middle School Student' then 'Middle School'
      when 'Bachelors degree' then 'Undergraduate'
      when 'Non-traditional Student, officially graduated 12/2025, applying to dental school for 2027' then 'Other'
      when 'College Graduate' then 'Undergraduate'
      when 'Bachelor of science' then 'Undergraduate'
      when 'Graduate' then 'Graduate'
      when 'Parent' then 'Other'
      when 'unrwa' then 'Other'
      when 'High school student - Dual enrolled in city college' then 'High School'
      when 'High School Graduate' then 'High School'
      when 'Gap Year / Non-student' then 'Gap Year'
      else null
    end)::education_type as education_level
  from source
),
new_people as (
  select m.*
  from mapped m
  left join public.users u on lower(trim(u.email)) = lower(m.email)
  where u.id is null
),
inserted_users as (
  insert into public.users (id, name, email)
  select gen_random_uuid(), np.full_name, np.email
  from new_people np
  returning id, email
)
insert into public.profiles (id, first_name, last_name, role, gender, education_level, date_of_birth, location)
select iu.id, np.first_name, np.last_name, 'independent_member', np.gender, np.education_level, np.date_of_birth, np.location
from inserted_users iu
join new_people np on lower(trim(iu.email)) = lower(np.email);

-- Existing matches: fill in only currently-null fields, never overwrite.
with source as (
  select distinct on (lower(trim(email)))
    trim(email) as email,
    nullif(trim(gender), '') as gender_raw,
    nullif(trim(date_of_birth), '') as dob_raw,
    nullif(trim(location), '') as location,
    nullif(trim(education_level), '') as education_raw
  from public.staging_member_import
  where email is not null and trim(email) <> ''
  order by lower(trim(email))
),
mapped as (
  select
    email,
    case
      when gender_raw in ('Male', 'Female', 'Nonbinary', 'Prefer Not to Say', 'Other') then gender_raw::gender_type
      else null
    end as gender,
    case
      when dob_raw ~ '^\d{1,2}/\d{1,2}/\d{4}$' then to_date(dob_raw, 'MM/DD/YYYY')
      else null
    end as date_of_birth,
    location,
    (case education_raw
      when 'Undergraduate Student' then 'Undergraduate'
      when 'Post graduate Student' then 'Graduate'
      when 'High School / Secondary School Student' then 'High School'
      when 'Middle School Student' then 'Middle School'
      when 'Bachelors degree' then 'Undergraduate'
      when 'Non-traditional Student, officially graduated 12/2025, applying to dental school for 2027' then 'Other'
      when 'College Graduate' then 'Undergraduate'
      when 'Bachelor of science' then 'Undergraduate'
      when 'Graduate' then 'Graduate'
      when 'Parent' then 'Other'
      when 'unrwa' then 'Other'
      when 'High school student - Dual enrolled in city college' then 'High School'
      when 'High School Graduate' then 'High School'
      when 'Gap Year / Non-student' then 'Gap Year'
      else null
    end)::education_type as education_level
  from source
)
update public.profiles p
set
  gender = coalesce(p.gender, m.gender),
  date_of_birth = coalesce(p.date_of_birth, m.date_of_birth),
  location = coalesce(p.location, m.location),
  education_level = coalesce(p.education_level, m.education_level)
from public.users u
join mapped m on lower(trim(u.email)) = lower(m.email)
where p.id = u.id;
