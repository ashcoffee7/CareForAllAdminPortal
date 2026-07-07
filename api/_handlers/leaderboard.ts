import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { RequestContext } from '../_lib/auth.js';
import { methodNotAllowed, sendJson } from '../_lib/http.js';

interface IndividualRow {
  name: string;
  chapter: string;
  hours: number;
}

interface ChapterRow {
  name: string;
  type: string;
  hours: number;
}

// Partners aren't in the schema yet (no `partners` table) -- kept as a
// static stand-in for the "Chapters & Partners" leaderboard until that
// table exists.
const STATIC_PARTNERS: ChapterRow[] = [{ name: 'Healara Inc.', type: 'Partner', hours: 210 }];

export async function leaderboard(req: VercelRequest, res: VercelResponse, ctx: RequestContext, sub?: string) {
  if (req.method !== 'GET') {
    methodNotAllowed(res, ['GET']);
    return;
  }

  if (sub === 'individuals') { return individuals(res, ctx); }
  if (sub === 'chapters') { return chapters(res, ctx); }

  sendJson(res, 404, { error: 'Not found' });
}

// Ranks members (and unattributed name-only entries, e.g. mentor
// office-hours logged without a linked profile) by total approved hours.
async function individuals(res: VercelResponse, ctx: RequestContext) {
  const { supabase } = ctx;

  const { data: logs, error } = await supabase
    .from('service_logs')
    .select('hours, user_id, name, profiles:user_id ( first_name, last_name, role, chapters:chapter_id ( name ) )')
    .eq('status', 'approved');
  if (error) { throw error; }

  const totals: Record<string, IndividualRow> = {};
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

  sendJson(res, 200, { data: Object.values(totals).sort((a, b) => b.hours - a.hours) });
}

async function chapters(res: VercelResponse, ctx: RequestContext) {
  const { supabase } = ctx;

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

  const chapterRows: ChapterRow[] = Object.keys(totals).map((name) => ({ name, type: 'Chapter', hours: totals[name] }));
  sendJson(res, 200, { data: chapterRows.concat(STATIC_PARTNERS).sort((a, b) => b.hours - a.hours) });
}
