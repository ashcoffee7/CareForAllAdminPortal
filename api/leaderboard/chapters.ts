import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser } from '../_lib/auth';
import { methodNotAllowed, sendError, sendJson } from '../_lib/http';

interface LeaderboardRow {
  name: string;
  type: string;
  hours: number;
}

// Partners aren't in the schema yet (no `partners` table) -- kept as a
// static stand-in for the "Chapters & Partners" leaderboard until that
// table exists, same as the old useChapterLeaderboard.ts client hook.
const STATIC_PARTNERS: LeaderboardRow[] = [{ name: 'Healara Inc.', type: 'Partner', hours: 210 }];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { supabase } = await requireUser(req);

    if (req.method !== 'GET') {
      methodNotAllowed(res, ['GET']);
      return;
    }

    const { data: logs, error } = await supabase
      .from('service_logs')
      .select('hours, user_id, profiles:user_id ( chapters:chapter_id ( name ) )')
      .eq('status', 'approved');
    if (error) { throw error; }

    const totals: Record<string, number> = {};
    (logs ?? []).forEach((row) => {
      const name = row.profiles?.chapters?.name;
      if (!name) { return; }
      totals[name] = (totals[name] || 0) + (Number(row.hours) || 0);
    });

    const chapterRows: LeaderboardRow[] = Object.keys(totals).map((name) => ({ name, type: 'Chapter', hours: totals[name] }));
    const ranked = chapterRows.concat(STATIC_PARTNERS).sort((a, b) => b.hours - a.hours);

    sendJson(res, 200, { data: ranked });
  } catch (err) {
    sendError(res, err);
  }
}
