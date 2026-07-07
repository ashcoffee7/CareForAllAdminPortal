import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser } from '../_lib/auth';
import { badRequest, methodNotAllowed, sendError, sendJson } from '../_lib/http';

const MENTOR_COLUMNS = 'id, name, calendly_link, available';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { supabase } = await requireUser(req);

    if (req.method === 'GET') {
      const { data, error } = await supabase.from('mentors').select(MENTOR_COLUMNS).order('name');
      if (error) { throw error; }
      sendJson(res, 200, { data });
      return;
    }

    if (req.method === 'POST') {
      const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
      if (!name) { badRequest(res, 'name is required'); return; }

      const { data, error } = await supabase
        .from('mentors')
        .insert({ name, calendly_link: req.body.calendly_link ?? null, available: req.body.available ?? false })
        .select(MENTOR_COLUMNS)
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
