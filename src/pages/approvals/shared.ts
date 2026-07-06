interface DisplayableRow {
  user_id: string | null;
  name: string | null;
  org_name: string | null;
}

export interface ProfileForDisplay {
  id: string;
  first_name: string | null;
  last_name: string | null;
  chapters: { name: string } | null;
}

export function resolveDisplay(row: DisplayableRow, profileById: Record<string, ProfileForDisplay>) {
  const p = row.user_id ? profileById[row.user_id] : null;
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
