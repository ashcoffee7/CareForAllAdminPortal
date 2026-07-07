import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { RequestContext } from '../_lib/auth';
import { methodNotAllowed, sendJson } from '../_lib/http';

// mentorship_sessions currently has no columns beyond `id` in any observed
// call site -- this only ever reports a count today. Extend the select
// list here if a future feature needs real session rows.
export async function mentorshipSessions(req: VercelRequest, res: VercelResponse, ctx: RequestContext) {
  const { supabase } = ctx;

  if (req.method !== 'GET') {
    methodNotAllowed(res, ['GET']);
    return;
  }

  const { count, error } = await supabase.from('mentorship_sessions').select('*', { count: 'exact', head: true });
  if (error) { throw error; }
  sendJson(res, 200, { total: count ?? 0 });
}
