import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser } from '../_lib/auth';
import { methodNotAllowed, sendError, sendJson } from '../_lib/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { supabase } = await requireUser(req);

    if (req.method !== 'GET') {
      methodNotAllowed(res, ['GET']);
      return;
    }

    const [approvedRes, pendingRes, verifTotalRes, verifIncompleteRes] = await Promise.all([
      supabase.from('service_logs').select('hours').eq('status', 'approved'),
      supabase.from('service_logs').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('service_logs').select('*', { count: 'exact', head: true }).not('verify_method', 'is', null),
      supabase.from('service_logs').select('*', { count: 'exact', head: true }).not('verify_method', 'is', null).eq('verification_completed', false),
    ]);

    if (approvedRes.error) { throw approvedRes.error; }
    if (pendingRes.error) { throw pendingRes.error; }
    if (verifTotalRes.error) { throw verifTotalRes.error; }
    if (verifIncompleteRes.error) { throw verifIncompleteRes.error; }

    const totalHours = (approvedRes.data ?? []).reduce((sum, r) => sum + (Number(r.hours) || 0), 0);

    sendJson(res, 200, {
      totalHours,
      pendingCount: pendingRes.count ?? 0,
      verifTotal: verifTotalRes.count ?? 0,
      verifIncomplete: verifIncompleteRes.count ?? 0,
    });
  } catch (err) {
    sendError(res, err);
  }
}
