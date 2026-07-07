import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { RequestContext } from '../_lib/auth.js';
import { badRequest, methodNotAllowed, sendJson } from '../_lib/http.js';

const CHECKIN_COLUMNS = 'id, chapter_name, quarter, activities, member_count, challenges, submitted_at';

export async function chapterCheckins(req: VercelRequest, res: VercelResponse, ctx: RequestContext, sub?: string) {
  if (sub) { return byId(req, res, ctx, sub); }
  return collection(req, res, ctx);
}

async function collection(req: VercelRequest, res: VercelResponse, ctx: RequestContext) {
  const { supabase } = ctx;

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('chapter_checkins')
      .select(CHECKIN_COLUMNS)
      .order('submitted_at', { ascending: false });
    if (error) { throw error; }
    sendJson(res, 200, { data });
    return;
  }

  if (req.method === 'POST') {
    const body = req.body ?? {};
    if (!body.chapter_name || !body.quarter || !body.activities) {
      badRequest(res, 'chapter_name, quarter, and activities are required');
      return;
    }

    const { data, error } = await supabase
      .from('chapter_checkins')
      .insert({
        chapter_name: body.chapter_name,
        quarter: body.quarter,
        activities: body.activities,
        member_count: body.member_count ?? null,
        challenges: body.challenges ?? null,
      })
      .select(CHECKIN_COLUMNS)
      .single();
    if (error) { throw error; }
    sendJson(res, 201, { data });
    return;
  }

  methodNotAllowed(res, ['GET', 'POST']);
}

// DELETE /api/chapter-checkins/:id -- lets an admin undo a "mark quarter
// complete" click (or remove a mistaken submission) from the Chapter
// Annual Activity Compliance dashboard.
async function byId(req: VercelRequest, res: VercelResponse, ctx: RequestContext, id: string) {
  const { supabase } = ctx;

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('chapter_checkins').delete().eq('id', id);
    if (error) { throw error; }
    sendJson(res, 204, null);
    return;
  }

  methodNotAllowed(res, ['DELETE']);
}
