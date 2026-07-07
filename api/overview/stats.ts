import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser } from '../_lib/auth';
import { methodNotAllowed, sendError, sendJson } from '../_lib/http';
import { MEMBER_ROLES } from '../../src/roles';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { supabase } = await requireUser(req);

    if (req.method !== 'GET') {
      methodNotAllowed(res, ['GET']);
      return;
    }

    const { count: chapterCount, error: chapterErr } = await supabase
      .from('chapters')
      .select('*', { count: 'exact', head: true });
    if (chapterErr) { throw chapterErr; }

    const { count: memberCount, error: memberErr } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .in('role', MEMBER_ROLES);
    if (memberErr) { throw memberErr; }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: newMemberCount, error: newMemberErr } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .in('role', MEMBER_ROLES)
      .gte('created_at', thirtyDaysAgo);
    if (newMemberErr) { throw newMemberErr; }

    sendJson(res, 200, {
      chapterCount: chapterCount ?? 0,
      memberCount: memberCount ?? 0,
      newMemberCount: newMemberCount ?? 0,
    });
  } catch (err) {
    sendError(res, err);
  }
}
