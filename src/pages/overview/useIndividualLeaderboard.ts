import { useCallback, useEffect, useState } from 'react';
import { api, apiOrToast } from '../../lib/apiClient';
import { useServiceLogsRealtime } from '../../lib/useServiceLogsRealtime';

export interface IndividualLeaderboardRow {
  name: string;
  chapter: string;
  hours: number;
  userId: string | null;
}

export function useIndividualLeaderboard() {
  const [ranked, setRanked] = useState<IndividualLeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const result = await apiOrToast(
      api.get<{ data: IndividualLeaderboardRow[] }>('/leaderboard/individuals'),
      'Loading leaderboard',
      { data: [] }
    );
    setRanked(result.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Approvals/rejections land from the approvals tab, and new submissions
  // land from the member-facing app -- both change which rows count
  // toward "approved" totals, so refetch live instead of waiting for a
  // manual page refresh during an event.
  useServiceLogsRealtime(load);

  return { ranked, loading };
}
