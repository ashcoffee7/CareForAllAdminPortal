import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { collectUserIds, fetchProfilesByIds } from '../../lib/joinServiceLogsToProfiles';

export interface IndividualLeaderboardRow {
  name: string;
  chapter: string;
  hours: number;
}

interface ProfileForLeaderboard {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  chapters: { name: string } | null;
}

export function useIndividualLeaderboard() {
  const [ranked, setRanked] = useState<IndividualLeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: logs, error: logsErr } = await supabase
        .from('service_logs')
        .select('hours, user_id, name')
        .eq('status', 'approved');

      if (logsErr) {
        console.error('service_logs fetch failed:', logsErr.message, logsErr.details, logsErr.hint);
        if (!cancelled) { setRanked([]); setLoading(false); }
        return;
      }

      const userIds = collectUserIds(logs);
      const profileById = await fetchProfilesByIds<ProfileForLeaderboard>(
        userIds,
        'id, first_name, last_name, role, chapters:chapter_id ( name )'
      );

      const totals: Record<string, IndividualLeaderboardRow> = {};
      logs.forEach((row) => {
        let key: string;
        let displayName: string;
        let chapter: string;

        if (row.user_id && profileById[row.user_id]) {
          // Attributed to a real member profile.
          const p = profileById[row.user_id];
          key = row.user_id;
          displayName = (p.first_name || '') + ' ' + (p.last_name || '');
          chapter = p.chapters?.name || (p.role === 'mentor' ? 'Mentor' : '-');
        } else if (row.name) {
          // No user_id -- e.g. mentor office-hours entries logged by plain
          // name/email instead of a linked profile. Still counts toward
          // the leaderboard, just with no chapter to show.
          key = 'name:' + row.name.toLowerCase();
          displayName = row.name;
          chapter = '-';
        } else {
          return; // no name and no resolvable profile
        }

        if (!totals[key]) {
          totals[key] = { name: displayName, chapter, hours: 0 };
        }
        totals[key].hours += Number(row.hours) || 0;
      });

      if (!cancelled) {
        setRanked(Object.values(totals).sort((a, b) => b.hours - a.hours));
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return { ranked, loading };
}
