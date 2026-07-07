import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser } from '../_lib/auth';
import { methodNotAllowed, sendError, sendJson } from '../_lib/http';

interface LeaderboardRow {
  name: string;
  chapter: string;
  hours: number;
}

// Ranks members (and unattributed name-only entries, e.g. mentor
// office-hours logged without a linked profile) by total approved hours.
// Ported as-is from the old useIndividualLeaderboard.ts client hook, now
// running server-side against a single embedded-select query instead of
// a logs fetch + a separate profiles-by-id fetch.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { supabase } = await requireUser(req);

    if (req.method !== 'GET') {
      methodNotAllowed(res, ['GET']);
      return;
    }

    const { data: logs, error } = await supabase
      .from('service_logs')
      .select('hours, user_id, name, profiles:user_id ( first_name, last_name, role, chapters:chapter_id ( name ) )')
      .eq('status', 'approved');
    if (error) { throw error; }

    const totals: Record<string, LeaderboardRow> = {};
    (logs ?? []).forEach((row) => {
      let key: string;
      let displayName: string;
      let chapter: string;

      const profile = row.profiles;
      if (row.user_id && profile) {
        key = row.user_id;
        displayName = ((profile.first_name || '') + ' ' + (profile.last_name || '')).trim();
        chapter = profile.chapters?.name || (profile.role === 'mentor' ? 'Mentor' : '-');
      } else if (row.name) {
        key = 'name:' + row.name.toLowerCase();
        displayName = row.name;
        chapter = '-';
      } else {
        return;
      }

      if (!totals[key]) { totals[key] = { name: displayName, chapter, hours: 0 }; }
      totals[key].hours += Number(row.hours) || 0;
    });

    const ranked = Object.values(totals).sort((a, b) => b.hours - a.hours);
    sendJson(res, 200, { data: ranked });
  } catch (err) {
    sendError(res, err);
  }
}
