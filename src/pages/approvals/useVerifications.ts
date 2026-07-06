import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { collectUserIds, fetchProfilesByIds } from '../../lib/joinServiceLogsToProfiles';
import { resolveDisplay, type ProfileForDisplay } from './shared';

export interface VerificationRow {
  id: string;
  hours: number;
  verify_method: string | null;
  verification_completed: boolean;
  verification_completed_at: string | null;
  displayName: string;
  displayChapter: string;
  state: 'complete' | 'incomplete';
}

export function useVerifications(onMutated: () => void) {
  const [verifications, setVerifications] = useState<VerificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: logs, error } = await supabase
      .from('service_logs')
      .select('id, user_id, name, org_name, hours, verify_method, verification_completed, verification_completed_at')
      .not('verify_method', 'is', null)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('verification fetch failed:', error.message, error.details, error.hint);
      setVerifications([]);
      setLoading(false);
      return;
    }

    const userIds = collectUserIds(logs);
    const profileById = await fetchProfilesByIds<ProfileForDisplay>(userIds, 'id, first_name, last_name, chapters:chapter_id ( name )');

    setVerifications(logs.map((row) => {
      const display = resolveDisplay(row, profileById);
      return {
        ...row,
        displayName: display.name,
        displayChapter: display.chapter,
        state: row.verification_completed ? 'complete' : 'incomplete',
      };
    }));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleVerification(logId: string, currentlyComplete: boolean) {
    const newValue = !currentlyComplete;

    const { error } = await supabase
      .from('service_logs')
      .update({ verification_completed: newValue, verification_completed_at: newValue ? new Date().toISOString() : null })
      .eq('id', logId);

    if (error) {
      console.error('verification toggle failed:', error.message, error.details, error.hint);
      alert('Could not update verification status:\n' + error.message);
      return;
    }

    await load();
    onMutated();
  }

  return { verifications, loading, toggleVerification };
}
