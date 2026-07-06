// Hand-written from the exact columns observed in every .select()/.update()/
// .upsert() call across the old vanilla-JS modules (no Supabase CLI is
// linked in this environment, so `supabase gen types typescript` isn't
// available). Keep in sync with actual usage, not with a live schema pull.

export interface Chapter {
  id: string;
  name: string;
  created_at: string;
}

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  gender: string | null;
  education_level: string | null;
  date_of_birth: string | null;
  chapter_id: string | null;
  created_at: string;
}

// The `chapters:chapter_id ( name )` embedded-select shape, used only where
// profiles/service_logs queries actually go through a real foreign key.
export type ProfileWithChapter = Profile & { chapters: { name: string } | null };

export interface ChapterCheckin {
  id: string;
  chapter_name: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  activities: string;
  member_count: number | null;
  challenges: string | null;
  submitted_at: string;
}

export interface CheckinDeadline {
  year: number;
  q1: string | null;
  q2: string | null;
  q3: string | null;
  q4: string | null;
  updated_at: string;
}

// service_logs.user_id has NO foreign key to profiles in the database.
// Every join is done client-side: collect user_ids from a service_logs
// query, then run a separate `profiles` fetch keyed by `id in (...)`.
// Do NOT model a nested `profile` relation here -- that would imply a
// PostgREST embedded select that will fail at runtime.
export interface ServiceLog {
  id: string;
  user_id: string | null;
  name: string | null;
  org_name: string | null;
  activity_type: string;
  hours: number;
  status: 'pending' | 'approved' | 'rejected';
  description: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  verify_method: string | null;
  verification_completed: boolean;
  verification_completed_at: string | null;
  primary_impact: string | null;
  impact_magnitude: number | null;
  secondary_impact: string | null;
  secondary_impact_magnitude: number | null;
}

export interface Mentor {
  id: string;
  name: string;
  calendly_link: string | null;
  available: boolean;
}

// Only ever selected via `{ count: 'exact', head: true }` today -- extend
// with real columns if a future call site selects them.
export interface MentorshipSession {
  id: string;
}
