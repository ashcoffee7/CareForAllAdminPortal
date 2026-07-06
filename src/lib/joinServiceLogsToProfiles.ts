import { supabase } from './supabase';

// service_logs.user_id has no direct foreign key to profiles (only to
// auth users, per the NextAuth-style schema), so profiles have to be
// fetched separately and joined here in JS rather than via PostgREST
// embedding. This is the one join pattern repeated (with slightly
// different `select` column lists) across overview.js, approvals.js, and
// chapters.js in the old vanilla app -- consolidated here so each caller
// only supplies the ids it collected and the columns it needs.

export function collectUserIds(rows: { user_id: string | null }[]): string[] {
  return Array.from(new Set(rows.map((r) => r.user_id).filter((id): id is string => Boolean(id))));
}

export async function fetchProfilesByIds<T extends { id: string }>(
  userIds: string[],
  select: string
): Promise<Record<string, T>> {
  if (userIds.length === 0) { return {}; }

  const { data, error } = await supabase
    .from('profiles')
    .select(select)
    .in('id', userIds);

  if (error) {
    console.error('profiles fetch failed:', error.message, error.details, error.hint);
    return {};
  }

  const map: Record<string, T> = {};
  (data as unknown as T[]).forEach((p) => { map[p.id] = p; });
  return map;
}
