import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface ApprovalStats {
  totalHours: number;
  pendingCount: number | null;
  verifTotal: number | null;
  verifIncomplete: number | null;
}

export function useApprovalStats(refreshKey: number) {
  const [stats, setStats] = useState<ApprovalStats>({ totalHours: 0, pendingCount: null, verifTotal: null, verifIncomplete: null });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: approvedRows, error: approvedErr } = await supabase
        .from('service_logs')
        .select('hours')
        .eq('status', 'approved');

      let totalHours = 0;
      if (approvedErr) {
        console.error('approved hours fetch failed:', approvedErr.message, approvedErr.details, approvedErr.hint);
      } else {
        totalHours = approvedRows.reduce((sum, r) => sum + (Number(r.hours) || 0), 0);
      }

      const { count: pendingCount, error: pendingErr } = await supabase
        .from('service_logs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (pendingErr) { console.error('pending count failed:', pendingErr.message, pendingErr.details, pendingErr.hint); }

      const { count: verifTotal, error: verifTotalErr } = await supabase
        .from('service_logs')
        .select('*', { count: 'exact', head: true })
        .not('verify_method', 'is', null);
      if (verifTotalErr) { console.error('verification total count failed:', verifTotalErr.message, verifTotalErr.details, verifTotalErr.hint); }

      const { count: verifIncomplete, error: verifIncompleteErr } = await supabase
        .from('service_logs')
        .select('*', { count: 'exact', head: true })
        .not('verify_method', 'is', null)
        .eq('verification_completed', false);
      if (verifIncompleteErr) { console.error('verification incomplete count failed:', verifIncompleteErr.message, verifIncompleteErr.details, verifIncompleteErr.hint); }

      if (!cancelled) {
        setStats({
          totalHours,
          pendingCount: pendingCount ?? null,
          verifTotal: verifTotal ?? null,
          verifIncomplete: verifIncomplete ?? null,
        });
      }
    })();

    return () => { cancelled = true; };
    // refreshKey intentionally re-triggers this fetch after a mutation
    // elsewhere on the page (approve/reject/verify), mirroring the old
    // vanilla app calling loadApprovalStats() again after each mutation.
  }, [refreshKey]);

  return stats;
}
