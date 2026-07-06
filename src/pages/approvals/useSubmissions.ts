import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { collectUserIds, fetchProfilesByIds } from '../../lib/joinServiceLogsToProfiles';
import { resolveDisplay, type ProfileForDisplay } from './shared';

export interface SubmissionRow {
  id: string;
  user_id: string | null;
  name: string | null;
  org_name: string | null;
  activity_type: string;
  hours: number;
  submitted_at: string;
  description: string | null;
  displayName: string;
  displayChapter: string;
}

export function useSubmissions(onMutated: () => void) {
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: logs, error } = await supabase
      .from('service_logs')
      .select('id, user_id, name, org_name, activity_type, hours, submitted_at, description')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('submissions fetch failed:', error.message, error.details, error.hint);
      setSubmissions([]);
      setLoading(false);
      return;
    }

    const userIds = collectUserIds(logs);
    const profileById = await fetchProfilesByIds<ProfileForDisplay>(userIds, 'id, first_name, last_name, chapters:chapter_id ( name )');

    setSubmissions(logs.map((row) => {
      const display = resolveDisplay(row, profileById);
      return { ...row, displayName: display.name, displayChapter: display.chapter };
    }));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function updateSubmissionStatus(logId: string, newStatus: 'approved' | 'rejected') {
    const { data: userData } = await supabase.auth.getUser();
    const reviewerId = userData?.user?.id ?? null;

    const { error } = await supabase
      .from('service_logs')
      .update({ status: newStatus, reviewed_at: new Date().toISOString(), reviewed_by: reviewerId })
      .eq('id', logId);

    if (error) {
      console.error('status update failed:', error.message, error.details, error.hint);
      alert('Could not update this submission:\n' + error.message);
      return;
    }

    await load();
    onMutated();
  }

  return { submissions, loading, updateSubmissionStatus };
}
