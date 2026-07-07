import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { collectUserIds, fetchProfilesByIds } from '../../lib/joinServiceLogsToProfiles';
import { useServiceLogsRealtime } from '../../lib/useServiceLogsRealtime';

export interface ChapterLeaderboardRow {
  name: string;
  type: string;
  hours: number;
}

interface ProfileChapterOnly {
  id: string;
  chapters: { name: string } | null;
}

// Partners aren't in the schema yet (no `partners` table) -- kept as a
// static stand-in for the "Chapters & Partners" leaderboard until that
// table exists.
const STATIC_PARTNERS: ChapterLeaderboardRow[] = [{ name: 'Healara Inc.', type: 'Partner', hours: 210 }];

export function useChapterLeaderboard() {
  const [ranked, setRanked] = useState<ChapterLeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: logs, error: logsErr } = await supabase
      .from('service_logs')
      .select('hours, user_id')
      .eq('status', 'approved');

    if (logsErr) {
      console.error('service_logs fetch failed:', logsErr.message, logsErr.details, logsErr.hint);
      setRanked([]);
      setLoading(false);
      return;
    }

    const userIds = collectUserIds(logs);
    if (userIds.length === 0) {
      setRanked([]);
      setLoading(false);
      return;
    }

    const profileById = await fetchProfilesByIds<ProfileChapterOnly>(userIds, 'id, chapters:chapter_id ( name )');

    const totals: Record<string, number> = {};
    logs.forEach((row) => {
      const name = row.user_id ? profileById[row.user_id]?.chapters?.name : undefined;
      if (!name) { return; }
      totals[name] = (totals[name] || 0) + (Number(row.hours) || 0);
    });

    const chapterRows: ChapterLeaderboardRow[] = Object.keys(totals).map((name) => ({
      name, type: 'Chapter', hours: totals[name],
    }));

    setRanked(chapterRows.concat(STATIC_PARTNERS).sort((a, b) => b.hours - a.hours));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useServiceLogsRealtime(load);

  return { ranked, loading };
}
