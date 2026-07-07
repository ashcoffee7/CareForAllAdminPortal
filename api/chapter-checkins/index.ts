import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser } from '../_lib/auth';
import { badRequest, methodNotAllowed, sendError, sendJson } from '../_lib/http';

const CHECKIN_COLUMNS = 'id, chapter_name, quarter, activities, member_count, challenges, submitted_at';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { supabase } = await requireUser(req);

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
  } catch (err) {
    sendError(res, err);
  }
}
