import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser } from '../_lib/auth';
import { methodNotAllowed, sendError, sendJson } from '../_lib/http';

// The signed-in admin's own profile (name/role for the sidebar/topbar) --
// scoped to req's own user, so the frontend never has to know its own
// profile id up front.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { supabase, user } = await requireUser(req);

    if (req.method !== 'GET') {
      methodNotAllowed(res, ['GET']);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('first_name, last_name, role')
      .eq('id', user.id)
      .single();
    if (error) { throw error; }
    sendJson(res, 200, { data });
  } catch (err) {
    sendError(res, err);
  }
}
