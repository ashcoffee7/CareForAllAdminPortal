# Backend Integration Guide — Supabase + Vercel

Audience: the engineer wiring this prototype to a real backend.

The prototype (`src/app.js`) is a pure front-end app driven by **in-memory mock
arrays** and a single **action dispatcher** (`act()`), plus `decide()` and the
`save*()` modal handlers. "Making the buttons real" = replacing those in-memory
reads/writes with Supabase queries, adding auth/roles, and deploying on Vercel.

This guide gives you: architecture, the DB schema, the exact button→table→operation
map, copy-paste wiring patterns, file uploads, role security, the **separate
Google Form mentorship flow**, email, and a QA checklist.

---

## 0. Two integration paths — pick one

**Path A — Standalone static app + Supabase-js (fastest to make this prototype live).**
Keep the single-file/`src/` app, add the Supabase JS client via CDN/npm, call
Supabase directly from the browser using the **anon key** with **Row Level
Security (RLS)** enforcing access. Host the static files on Vercel; add a couple of
serverless functions in `/api` for things that need a secret (email, Google-Form
webhook). Best if you want the prototype itself to become the product quickly.

**Path B — Fold into the existing Next.js app (recommended for production).**
The member portal repo (`PortalCareForAll-main`) is already Next.js 16 + Supabase +
NextAuth + Resend on Vercel. Port these pages into it as `/admin/*` routes, reuse
`lib/supabase.ts`, `lib/auth.ts`, `lib/email.ts`, and do writes via Server Actions
(service-role key stays server-side). More work, but one codebase, one auth, one
deploy. The schema and button-map below apply unchanged.

The rest of this doc is written for **Path A** (most direct mapping to the current
code) and notes Path B differences where relevant.

---

## 1. Environment variables

| Var | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_URL` | client + server | Project URL |
| `SUPABASE_ANON_KEY` | client | Safe to ship; RLS protects data |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Bypasses RLS — never expose to browser. Used by the Google-Form webhook and email function. |
| `RESEND_API_KEY` | **server only** | For the "Send Email" actions |
| `GOOGLE_FORM_WEBHOOK_SECRET` | server only | Shared secret to authenticate the Apps Script webhook |

On Vercel: Project → Settings → Environment Variables. Mark the non-`PUBLIC` ones
as not exposed to the browser.

---

## 2. Database schema (Supabase / Postgres)

Run in the Supabase SQL editor. Table/column names mirror the prototype's data
objects so the mapping is 1:1. Statuses use enums matching the prototype's badges.

```sql
-- ---------- enums ----------
create type sh_status as enum ('Pending Review','Approved','Needs Changes','Rejected');
create type cert_status as enum ('Requested','In Progress','Completed','Sent');
create type chapter_status as enum ('Active','Pending','At Risk','Inactive','Needs Review','Archived');
create type project_status as enum ('Draft','Submitted','Approved','Active','Needs Changes','Completed','Archived');
create type visibility as enum ('Published','Hidden','Coming Soon');
create type admin_role as enum
  ('super','national','program','shreviewer','chapter','mapping','mentorship','readonly');

-- ---------- who can log in to the admin ----------
-- one row per admin; ties Supabase Auth user -> role (matches ROLE_PERMS keys)
create table admins (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text unique,
  role admin_role not null default 'readonly',
  created_at timestamptz default now()
);

-- ---------- members & chapters ----------
create table chapters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text, type text, lead_name text, lead_email text,
  founded text, visibility text default 'Public',
  status chapter_status default 'Active',
  last_check_in date,
  created_at timestamptz default now()
);

create table members (
  id uuid primary key default gen_random_uuid(),
  name text, email text, role text, member_type text,          -- Independent | Chapter Member | Chapter Lead
  chapter_id uuid references chapters(id),
  location text, grade text, school text,
  osm_username text, status text default 'Active',
  created_at timestamptz default now()
);

-- ---------- service hours (the core review workflow) ----------
create table service_hours (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id),
  title text, activity_type text, date_completed date,
  hours numeric, description text,
  verification_method text,
  school_name text, submission_deadline date,
  submission_portal text, submission_instructions text,
  evidence_path text,                 -- Supabase Storage object path
  supervisor_email text,
  linked_project_id uuid, linked_task_id uuid, linked_event_id uuid,
  status sh_status default 'Pending Review',
  assigned_admin uuid references admins(id),
  flags text[] default '{}',
  reviewed_by uuid references admins(id),
  reviewed_at timestamptz,
  submitted_at timestamptz default now()
);

create table certificates (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id),
  approved_hours numeric, cert_type text, organization text,
  requested_date date, status cert_status default 'Requested',
  admin_notes text
);

-- ---------- mapping / projects ----------
create table mapping_tasks (
  id uuid primary key default gen_random_uuid(),
  title text, region text, location text, task_type text,
  description text, task_link text,
  status text default 'Active', difficulty text default 'Beginner',
  featured boolean default false,
  contributors int default 0, items_mapped int default 0, hours numeric default 0
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text, category text, lead_member_id uuid references members(id),
  chapter_id uuid references chapters(id), project_type text,
  description text, community text, health_issue text,
  start_date text, completion_goal text, progress int default 0,
  status project_status default 'Submitted',
  hours numeric default 0, impact text
);

-- ---------- mentorship (see §6 for the Google Form) ----------
create table mentors (
  id uuid primary key default gen_random_uuid(),
  name text, title text, organization text, industry text,
  tags text[], bio text, calendly text, email text,
  availability text, sessions_completed int default 0,
  status text default 'Pending'           -- Active | Pending | Hidden | Archived
);

create table mentor_sessions (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid references mentors(id),
  member_id uuid references members(id),
  mentor_name text, member_name text,     -- denormalized from the form
  session_date date, topic text, duration text,
  reported_by text,                       -- 'Mentor' | 'Member'
  status text default 'Completed',
  service_hours_status text default 'Pending',
  notes text,
  source text default 'google_form',
  created_at timestamptz default now()
);

create table mentorship_requests (
  id uuid primary key default gen_random_uuid(),
  name text, email text, role text, chapter text,
  interest text, requested_mentor text,
  status text default 'New', submitted_at timestamptz default now()
);

-- ---------- forms, events, attendance, resources, check-ins ----------
create table form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_name text, submitted_by text, email text, chapter text,
  program text, status text default 'New', linked_record text,
  submitted_at timestamptz default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  name text, event_type text, date_time text, duration text,
  host text, registration_link text, attendance_count int default 0,
  hours_eligible text, status text default 'Upcoming'
);

create table event_attendance (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id),
  member_id uuid references members(id),
  attendance_status text, hours text,
  linked_service_hour_id uuid references service_hours(id)
);

create table resources (
  id uuid primary key default gen_random_uuid(),
  category text, name text, description text, resource_type text,
  link text, audience text, visibility visibility default 'Published',
  updated_at timestamptz default now()
);

create table checkins (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid references chapters(id),
  submitted_by text, quarter text, submitted_on date,
  projects_completed int, barriers text, feedback text,
  needs_support boolean, followup_status text default 'Pending'
);

create table audit_log (
  id bigint generated always as identity primary key,
  admin_id uuid references admins(id), action text, target text,
  details text, created_at timestamptz default now()
);
```

> Follow the same pattern for anything not listed (mapathons, chapter active-status
> checklist, etc.). The prototype arrays in `src/app.js` are the source of truth for
> field names.

---

## 3. Auth + roles (maps directly to `ROLE_PERMS`)

The prototype already defines roles in `ROLE_PERMS` (`super`, `national`,
`program`, `shreviewer`, `chapter`, `mapping`, `mentorship`, `readonly`) and gates
every write with `canWrite()`. Mirror that on the server:

1. **Login:** use Supabase Auth (email magic-link or Google). On sign-in, look up
   the user in `admins`. If absent → not an admin, block.
2. **Replace the "View as" switcher** (`switchRole`) — in production a user's role
   comes from `admins.role`, not a dropdown. Keep the dropdown only for `super`
   admins as an impersonation/preview tool if you want.
3. **Enforce with RLS**, don't trust the client. Helper + policies:

```sql
alter table service_hours enable row level security;

create or replace function current_admin_role() returns admin_role
language sql stable as $$
  select role from admins where id = auth.uid()
$$;

-- everyone who is an admin can read
create policy "admins read" on service_hours for select
  using (current_admin_role() is not null);

-- only roles that approve hours can update
create policy "reviewers write" on service_hours for update
  using (current_admin_role() in ('super','national','program','shreviewer','chapter'));
```

Repeat per table, choosing the allowed roles to match `ROLE_PERMS` (e.g. `chapters`
writable by `super/national/chapter`, `mentors`/`mentor_sessions` by
`super/national/mentorship`, `resources` by `super/national/program`). `readonly`
gets SELECT only everywhere.

---

## 4. Wiring the front-end

### 4a. Add the client
```html
<!-- in index.html, before app.js -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```
```js
// top of app.js
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### 4b. Replace mock reads with a load step
Right now each `PAGES.*` reads global arrays synchronously. Make `go()` fetch first,
then render. Minimal change: load everything once into the existing array names on
startup, keep the renderers as-is.

```js
async function loadData(){
  const [m,c,sh,cert,mt,proj,mn,ses,forms,ev,att,res,ci] = await Promise.all([
    sb.from('members').select('*'),
    sb.from('chapters').select('*'),
    sb.from('service_hours').select('*'),
    sb.from('certificates').select('*'),
    sb.from('mapping_tasks').select('*'),
    sb.from('projects').select('*'),
    sb.from('mentors').select('*'),
    sb.from('mentor_sessions').select('*'),
    sb.from('form_submissions').select('*'),
    sb.from('events').select('*'),
    sb.from('event_attendance').select('*'),
    sb.from('resources').select('*'),
    sb.from('checkins').select('*'),
  ]);
  // assign into the existing globals (mutate, don't reassign const — switch them to let)
  MEMBERS.splice(0, MEMBERS.length, ...m.data);   // etc. for each
}
// call once, then render:
await loadData(); renderTopbar(); renderNav(); go('dashboard');
```
> Tip: change the data declarations from `const` to `let` (or wrap in a `DB` object)
> so you can replace contents. Field names in the renderers (`m.approved`,
> `s.status`, …) should match your column aliases — either alias in the `select`
> (`select('*, approved:approved_hours')`) or rename in the renderers.

### 4c. Replace writes — the button → table → operation map

Every "real" button already routes through one of: `act(a,d,el)`, `decide()`, or a
`save*()` handler. Make these `async` and do a Supabase write, then re-render.

| Prototype handler / `data-act` | User action | Supabase write |
|---|---|---|
| `decide(id,'Approved'\|'Rejected'\|'Needs Changes')` | Approve/reject service hour | `update service_hours set status, reviewed_by, reviewed_at where id` |
| `data-edit-hours` → `decide` | Approve with edited hours | `update service_hours set hours, status='Approved'` |
| `data-cert` | Certificate status | `update certificates set status` |
| `act 'projact'` | Project approve/changes/complete | `update projects set status (, progress=100)` |
| `act 'approvehr'` | Approve a mentor session's hour | `update mentor_sessions set service_hours_status='Approved'` |
| `act 'appapprove'` | Approve chapter application | `insert into chapters …; delete the application row` |
| `act 'formreview'` | Mark form submission reviewed | `update form_submissions set status='Approved'` |
| `act 'matchhours'` | Match attendance → hours | `update event_attendance set linked_service_hour_id` |
| `act 'followup'` | Check-in followed up | `update checkins set followup_status='Followed Up'` |
| `act 'archivechap'`, `data-togglechap(d)` | Activate/deactivate/archive chapter | `update chapters set status` |
| `saveResource()` / `data-res` | Resource add/edit/publish/hide | `insert/update/delete resources` |
| `saveTask()` / `data-taskfeature` | Mapping task add/edit/feature | `insert/update mapping_tasks` |
| `saveMentor()` / `data-mentorhide` | Mentor add/edit/hide | `insert/update mentors` |
| `act 'email'` (Send Email / Message Lead) | Send email | POST to `/api/send-email` (see §7) |
| `act 'csvtable'` | Export CSV | already client-side — **no change** |

**Example — service-hour approval (`decide`):**
```js
async function decide(id, status){
  const { error } = await sb.from('service_hours')
    .update({ status, reviewed_by: currentUserId, reviewed_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return toast('Error: ' + error.message);
  await logAudit(status==='Approved'?'Approved service hours':'Updated service hours', id);
  closeDrawer(); await loadData(); PAGES.hours(); toast('Saved');
}
```

**Example — resource save (`saveResource`):**
```js
async function saveResource(){
  const row = { category:$('#rG').value, name:$('#rN').value, description:$('#rD').value,
                link:$('#rL').value, resource_type:$('#rT').value,
                visibility:$('#rV').value, audience:$('#rA').value };
  const { error } = _resTarget.id
    ? await sb.from('resources').update(row).eq('id', _resTarget.id)
    : await sb.from('resources').insert(row);
  if (error) return toast('Error: '+error.message);
  closeModal(); await loadData(); PAGES.dashboard(); toast('Resource saved');
}
```

**Example — chapter deactivate (`data-togglechap`):**
```js
const c = CHAPTERS.find(x=>x.id===id);
await sb.from('chapters').update({ status: c.status==='Inactive'?'Active':'Inactive' }).eq('id', c.id);
await loadData(); PAGES.chapters();
```

Apply the same shape to the rest of the map. Wrap each in try/catch → `toast`.

---

## 5. File uploads (evidence, log sheets, school forms)

Service-hour submissions reference uploaded docs (`evidence_path`). Use a Supabase
Storage bucket:

```sql
insert into storage.buckets (id, name, public) values ('evidence','evidence', false);
-- RLS: admins can read; members can write to their own folder
```
In the review drawer, turn the "Evidence" link into a signed URL:
```js
const { data } = await sb.storage.from('evidence').createSignedUrl(sh.evidence_path, 3600);
// data.signedUrl -> open in new tab
```
Member submissions (from the member portal) upload to `evidence/<member_id>/<file>`.

---

## 6. The separate **Mentorship Google Form** (important)

CareForAll mentors **do not** apply or log hours through a form built in this app.
They use an external **Google Form**:

**https://forms.gle/EoT4nX99iZhHSRy76**

In the prototype this is intentional: the **"Mentor Application Form"** button just
opens that Google Form (`openExt(MENTOR_FORM)`), and the Mentor Directory shows a
banner saying *"Mentors apply and log completed sessions through a Google Form;
responses feed straight into this dashboard."* Keep that — **don't rebuild it as a
native form.** Your job is to pipe the Form's responses into Supabase so the
dashboard reflects them.

Recommended: one Google Form with a first question **"Submission type"**
= *Mentor application* / *Completed session report*. Route each to the right table.

### 6a. Sync responses → Supabase (Google Apps Script webhook — real-time)
In the Form's linked Google Sheet: **Extensions → Apps Script**, add an
`onFormSubmit` trigger:

```javascript
function onFormSubmit(e) {
  const v = e.namedValues; // keys are your form question titles
  const type = (v['Submission type'] || [''])[0];
  const payload = type === 'Mentor application'
    ? { table: 'mentors', row: {
        name: v['Full name'][0], title: v['Title'][0], organization: v['Organization'][0],
        email: v['Email'][0], industry: v['Industry'][0], bio: v['Short bio'][0],
        calendly: (v['Calendly link']||[''])[0], status: 'Pending' } }
    : { table: 'mentor_sessions', row: {
        mentor_name: v['Your name'][0], member_name: v['Student name'][0],
        session_date: v['Session date'][0], topic: v['Topic'][0],
        duration: v['Duration'][0], reported_by: 'Mentor',
        status: 'Completed', service_hours_status: 'Pending', source: 'google_form' } };

  UrlFetchApp.fetch(SUPABASE_URL + '/rest/v1/' + payload.table, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      apikey: SERVICE_ROLE_KEY,                 // store via Script Properties, not inline
      Authorization: 'Bearer ' + SERVICE_ROLE_KEY,
      Prefer: 'return=minimal'
    },
    payload: JSON.stringify(payload.row)
  });
}
```
Store `SUPABASE_URL` and `SERVICE_ROLE_KEY` in **Project Settings → Script
Properties** (never hard-code). Set the trigger: Apps Script → Triggers → add
`onFormSubmit` "On form submit".

> Alternative (no Apps Script): publish the response Sheet as CSV and run a Vercel
> Cron + serverless function that fetches it and `upsert`s into Supabase every N
> minutes. Simpler to set up, not real-time.

### 6b. How the dashboard consumes it
- **Mentor applications** land in `mentors` with `status='Pending'` → appear in the
  Mentor Directory; an admin (`mentorship`/`super`) flips them to `Active` via the
  existing Hide/Publish + edit buttons (now Supabase updates).
- **Completed sessions** land in `mentor_sessions` with
  `service_hours_status='Pending'` → appear in "Mentor-Reported Sessions"; the
  **Approve Hr** button (`act 'approvehr'`) updates that row and, if you want
  mentorship hours to count, also `insert into service_hours` an approved row for
  that member.
- Calendly booking stays external (the mentor card's Calendly button opens the
  link) — no backend needed for booking itself.

---

## 7. Email ("Send Email", "Message Lead", confirmation emails)

The browser can't hold the Resend key, so route `act 'email'` (and approval
confirmation emails) through a serverless function.

`/api/send-email.js` (Vercel function):
```js
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);
export default async function handler(req, res){
  const { to, subject, html } = req.body;
  // TODO: verify the caller is an authenticated admin (check Supabase JWT)
  await resend.emails.send({ from: 'CareForAll <noreply@careforall.org>', to, subject, html });
  res.json({ ok: true });
}
```
Then in `composeEmail()`'s Send handler: `fetch('/api/send-email', {method:'POST', body: JSON.stringify({to,subject,html})})`.
(Path B: the member portal already has `lib/email.ts` with Resend — reuse it from a
Server Action.)

---

## 8. Deploy on Vercel

**Path A (static + functions):**
1. `vercel` (or connect the GitHub repo in the Vercel dashboard).
2. Framework preset: **Other**. Output dir: repo root (serves `index.html`).
3. Put serverless functions in `/api` (e.g. `api/send-email.js`).
4. Add the env vars from §1 (service-role + Resend keys NOT exposed to client).
5. Deploy → Vercel gives a `*.vercel.app` URL (and supports custom domains).

**Path B (Next.js):** deploy the `PortalCareForAll-main` app as-is; the admin lives
at `/admin`. Use Server Actions for writes so the service-role key never reaches the
browser; gate `/admin` via NextAuth + the `admins` table.

Supabase needs no separate deploy; add your Vercel domain to Supabase **Auth → URL
configuration** (redirect URLs).

---

## 9. QA checklist — "are the forms/buttons actually working?"

- [ ] Sign in as each role; confirm nav + write-button visibility matches `ROLE_PERMS` (and that RLS blocks writes the UI hides — test by calling the API directly).
- [ ] Approve / reject / request-changes a service hour → row updates, member's approved total recomputes, confirmation email sends.
- [ ] Approve-with-edited-hours persists the edited number.
- [ ] Certificate status transitions (Requested→In Progress→Completed→Sent) persist.
- [ ] Resource add/edit/publish/hide/delete persist and reflect on reload.
- [ ] Mapping task create/edit/feature persist.
- [ ] Chapter deactivate/reactivate/archive persist; KPIs recompute.
- [ ] Chapter application "Approve" inserts a chapter and removes the application.
- [ ] Project approve/complete persist; progress updates.
- [ ] **Submit the real Google Form** → a new `mentors` (Pending) AND a new
      `mentor_sessions` (Pending) row appear in the dashboard within the sync window.
- [ ] "Approve Hr" on a mentor session updates it (and optionally creates a
      service-hours row).
- [ ] Event attendance "Match to Hours" links the records.
- [ ] "Send Email" / "Message Lead" actually delivers via Resend.
- [ ] Evidence file opens via a signed URL; non-admins can't read the bucket.
- [ ] CSV exports download (already client-side).
- [ ] Audit log records each admin action.

---

### Quick reference: where things live in `src/app.js`
Mock data arrays (top) → helpers → `ROLE_PERMS`/`canWrite()`/`switchRole()` →
`PAGES.*` renderers → `reviewDrawer`/`chapterDetail`/`projDrawer` + `save*()` modals
→ the `act()` dispatcher + delegated click handler (bottom). Those are the only
places you touch to swap mock state for Supabase.
