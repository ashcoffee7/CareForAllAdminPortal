import { useCallback, useEffect, useState } from 'react';
import { api, apiOrToast } from '../../lib/apiClient';
import { useServiceLogsRealtime } from '../../lib/useServiceLogsRealtime';

interface ApprovalStats {
  totalHours: number;
  pendingCount: number | null;
  verifTotal: number | null;
  verifIncomplete: number | null;
}

export function useApprovalStats(refreshKey: number) {
  const [stats, setStats] = useState<ApprovalStats>({ totalHours: 0, pendingCount: null, verifTotal: null, verifIncomplete: null });

  const load = useCallback(async () => {
    const result = await apiOrToast(
      api.get<ApprovalStats>('/approvals/stats'),
      'Loading approval stats',
      { totalHours: 0, pendingCount: null, verifTotal: null, verifIncomplete: null }
    );
    setStats(result);
  }, []);

  useEffect(() => {
    load();
    // refreshKey intentionally re-triggers this fetch after a mutation
    // elsewhere on the page (approve/reject/verify), mirroring the old
    // vanilla app calling loadApprovalStats() again after each mutation.
  }, [load, refreshKey]);

  // New submissions, approvals, and verification updates can also come in
  // live during an event, not just through this page's own mutations.
  useServiceLogsRealtime(load);

  return stats;
}
