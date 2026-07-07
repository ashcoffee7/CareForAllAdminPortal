import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../src/types/database.generated.js';

export interface EmbeddedProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  chapter_id: string | null;
  chapters: { name: string } | null;
}

// service_logs.user_id has a real FK to `users`, not `profiles` --
// profiles.id happens to reference that same users.id, so a profile can
// still be looked up by user_id via a plain `.in()` filter, just not
// through a PostgREST embedded select (there's no FK constraint PostgREST
// can use to auto-join service_logs -> profiles directly). This runs
// that lookup as a second query inside the API handler -- the frontend
// still only ever makes one HTTP request and sees the same `row.profiles`
// shape a real embed would have produced.
export function collectUserIds(rows: { user_id: string | null }[]): string[] {
  return Array.from(new Set(rows.map((r) => r.user_id).filter((id): id is string => Boolean(id))));
}

export async function fetchProfilesByUserId(
  supabase: SupabaseClient<Database>,
  userIds: string[]
): Promise<Record<string, EmbeddedProfile>> {
  if (userIds.length === 0) { return {}; }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, role, chapter_id, chapters:chapter_id ( name )')
    .in('id', userIds);
  if (error) { throw error; }

  const map: Record<string, EmbeddedProfile> = {};
  (data ?? []).forEach((p) => { map[p.id] = p as unknown as EmbeddedProfile; });
  return map;
}

// Attaches a `.profiles` field to each row, matching the shape a real
// PostgREST embed (`profiles:user_id ( ... )`) would have produced --
// callers that were written against that shape don't need to change.
export async function attachProfiles<T extends { user_id: string | null }>(
  supabase: SupabaseClient<Database>,
  rows: T[]
): Promise<(T & { profiles: EmbeddedProfile | null })[]> {
  const userIds = collectUserIds(rows);
  const profileById = await fetchProfilesByUserId(supabase, userIds);
  return rows.map((row) => ({ ...row, profiles: row.user_id ? profileById[row.user_id] ?? null : null }));
}
