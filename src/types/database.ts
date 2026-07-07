// Derived from the generated `Database` type (see database.generated.ts)
// instead of hand-duplicating columns. Regenerate that file with
// `npm run gen:types` against the live schema; these aliases then pick up
// the change automatically.
import type { Database } from './database.generated';

export type Chapter = Database['public']['Tables']['chapters']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];

// The `chapters:chapter_id ( name )` embedded-select shape, used wherever
// profiles/service_logs queries join through the chapter_id foreign key.
export type ProfileWithChapter = Profile & { chapters: { name: string } | null };

export type ChapterCheckin = Database['public']['Tables']['chapter_checkins']['Row'];
export type CheckinDeadline = Database['public']['Tables']['checkin_deadlines']['Row'];

// service_logs.user_id now has a real foreign key to profiles.id (see
// 20260706000002_service_logs_profiles_fk.sql), so callers can use a
// PostgREST embedded select (`profiles:user_id ( ... )`) instead of the
// old two-step client-side join.
export type ServiceLog = Database['public']['Tables']['service_logs']['Row'];
export type ServiceLogWithProfile = ServiceLog & { profiles: ProfileWithChapter | null };

export type Mentor = Database['public']['Tables']['mentors']['Row'];

// Only ever selected via `{ count: 'exact', head: true }` today -- extend
// with real columns if a future call site selects them.
export type MentorshipSession = Database['public']['Tables']['mentorship_sessions']['Row'];
