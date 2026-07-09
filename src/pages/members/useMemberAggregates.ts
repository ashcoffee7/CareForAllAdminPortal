import { useEffect, useState } from 'react';
import { api, apiOrToast } from '../../lib/apiClient';
import { MEMBER_ROLES } from '../../roles';

// Only the columns the demographics charts need -- deliberately not the
// same shape as the paginated directory list, since this fetch always
// pulls every matching member (percentages need the full population, not
// just the current page).
export interface MemberAggregateRow {
  id: string;
  gender: string | null;
  education_level: string | null;
  date_of_birth: string | null;
  location: string | null;
}

interface AggregateState {
  members: MemberAggregateRow[];
  chapterCount: number | null;
  loading: boolean;
}

export function useMemberAggregates() {
  const [state, setState] = useState<AggregateState>({ members: [], chapterCount: null, loading: true });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [profilesResult, chaptersResult] = await Promise.all([
        apiOrToast(
          api.get<{ data: MemberAggregateRow[]; total: number }>(`/profiles?role=${MEMBER_ROLES.join(',')}`),
          'Loading member demographics',
          { data: [], total: 0 }
        ),
        apiOrToast(api.get<{ data: { id: string }[] }>('/chapters'), 'Loading chapters', { data: [] }),
      ]);

      if (!cancelled) {
        setState({ members: profilesResult.data, chapterCount: chaptersResult.data.length, loading: false });
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return state;
}
