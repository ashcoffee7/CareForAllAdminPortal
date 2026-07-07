export interface EmbeddedProfile {
  first_name: string | null;
  last_name: string | null;
  chapters: { name: string } | null;
}

interface DisplayableRow {
  name: string | null;
  org_name: string | null;
  profiles: EmbeddedProfile | null;
}

// service_logs.user_id now has a real FK to profiles.id, so the API
// returns the linked profile embedded directly on each row (via
// `profiles:user_id ( ... )`) instead of the admin portal having to fetch
// profiles separately and join them here in JS.
export function resolveDisplay(row: DisplayableRow) {
  const p = row.profiles;
  if (p) {
    return {
      name: ((p.first_name || '') + ' ' + (p.last_name || '')).trim() || (row.name || 'Unknown'),
      chapter: p.chapters?.name || '-',
    };
  }
  return {
    name: row.name || 'Unknown',
    chapter: row.org_name || '-',
  };
}
