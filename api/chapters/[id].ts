import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser } from '../_lib/auth';
import { badRequest, methodNotAllowed, sendError, sendJson } from '../_lib/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { supabase } = await requireUser(req);
    const id = String(req.query.id);

    if (req.method === 'GET') {
      const { data, error } = await supabase.from('chapters').select('id, name, created_at').eq('id', id).single();
      if (error) { throw error; }
      sendJson(res, 200, { data });
      return;
    }

    if (req.method === 'PATCH') {
      const name = typeof req.body?.name === 'string' ? req.body.name.trim() : undefined;
      if (name === undefined) { badRequest(res, 'name is required'); return; }

      const { data, error } = await supabase.from('chapters').update({ name }).eq('id', id).select().single();
      if (error) { throw error; }
      sendJson(res, 200, { data });
      return;
    }

    if (req.method === 'DELETE') {
      const { error } = await supabase.from('chapters').delete().eq('id', id);
      if (error) { throw error; }
      sendJson(res, 204, null);
      return;
    }

    methodNotAllowed(res, ['GET', 'PATCH', 'DELETE']);
  } catch (err) {
    sendError(res, err);
  }
}
