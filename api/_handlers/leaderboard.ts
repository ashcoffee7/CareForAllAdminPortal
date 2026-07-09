import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { RequestContext } from '../_lib/auth.js';
import { methodNotAllowed, sendJson } from '../_lib/http.js';
import { collectUserIds, fetchProfilesByUserId } from '../_lib/joinProfiles.js';

interface IndividualRow {
  name: string;
  chapter: string;
  hours: number;
  // null for name-only fallback entries with no linked profile (e.g.
  // mentor office-hours logged without one) -- nothing to open a member
  // profile for in that case.
  userId: string | null;
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
// service_logs.user_id has no direct FK to profiles (see
// api/_lib/joinProfiles.ts), so the profile lookup is a second query
// rather than a PostgREST embed.
async function individuals(res: VercelResponse, ctx: RequestContext) {
  const { supabase } = ctx;

  const { data: logs, error } = await supabase
    .from('service_logs')
    .select('hours, user_id, name')
    .eq('status', 'approved');
  if (error) { throw error; }

  const rows = logs ?? [];
  const profileById = await fetchProfilesByUserId(supabase, collectUserIds(rows));

  const totals: Record<string, IndividualRow> = {};
  rows.forEach((row) => {
    let key: string;
    let displayName: string;
    let chapter: string;
    let userId: string | null;

    const profile = row.user_id ? profileById[row.user_id] : undefined;
    if (row.user_id && profile) {
      key = row.user_id;
      displayName = ((profile.first_name || '') + ' ' + (profile.last_name || '')).trim();
      chapter = profile.chapters?.name || (profile.role === 'mentor' ? 'Mentor' : '-');
      userId = row.user_id;
    } else if (row.name) {
      key = 'name:' + row.name.toLowerCase();
      displayName = row.name;
      chapter = '-';
      userId = null;
    } else {
      return;
    }

    if (!totals[key]) { totals[key] = { name: displayName, chapter, hours: 0, userId }; }
    totals[key].hours += Number(row.hours) || 0;
  });

  sendJson(res, 200, { data: Object.values(totals).sort((a, b) => b.hours - a.hours) });
}

async function chapters(res: VercelResponse, ctx: RequestContext) {
  const { supabase } = ctx;

  const { data: logs, error } = await supabase
    .from('service_logs')
    .select('hours, user_id')
    .eq('status', 'approved');
  if (error) { throw error; }

  const rows = logs ?? [];
  const profileById = await fetchProfilesByUserId(supabase, collectUserIds(rows));

  const totals: Record<string, number> = {};
  rows.forEach((row) => {
    const name = row.user_id ? profileById[row.user_id]?.chapters?.name : undefined;
    if (!name) { return; }
    totals[name] = (totals[name] || 0) + (Number(row.hours) || 0);
  });

  const chapterRows: ChapterRow[] = Object.keys(totals).map((name) => ({ name, type: 'Chapter', hours: totals[name] }));
  sendJson(res, 200, { data: chapterRows.concat(STATIC_PARTNERS).sort((a, b) => b.hours - a.hours) });
}
