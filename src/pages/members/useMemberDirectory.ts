import { useEffect, useState } from 'react';
import { api, apiOrToast } from '../../lib/apiClient';
import { MEMBER_ROLES } from '../../roles';

export interface MemberDirectoryRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  chapters: { name: string } | null;
}

export const MEMBER_PAGE_SIZE = 25;

// Server-side paginated + searched "All Members" table. Separate from
// useMemberAggregates, which needs every matching member for the
// demographics percentages -- this hook only ever holds one page in
// memory, with the search term applied as a `q` ilike filter on the API
// side rather than a client-side .filter() over an already-fetched array.
export function useMemberDirectory(search: string, page: number) {
  const [members, setMembers] = useState<MemberDirectoryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      const params = new URLSearchParams({
        role: MEMBER_ROLES.join(','),
        page: String(page),
        limit: String(MEMBER_PAGE_SIZE),
      });
      const trimmed = search.trim();
      if (trimmed) { params.set('q', trimmed); }

      const result = await apiOrToast(
        api.get<{ data: MemberDirectoryRow[]; total: number }>(`/profiles?${params.toString()}`),
        'Loading members',
        { data: [], total: 0 }
      );

      if (!cancelled) {
        setMembers(result.data);
        setTotal(result.total);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [search, page]);

  return { members, total, loading };
}
