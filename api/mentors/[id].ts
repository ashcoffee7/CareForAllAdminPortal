import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser } from '../_lib/auth';
import { badRequest, methodNotAllowed, sendError, sendJson } from '../_lib/http';
import type { Database } from '../../src/types/database.generated';

const MENTOR_COLUMNS = 'id, name, calendly_link, available';

type MentorUpdate = Database['public']['Tables']['mentors']['Update'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { supabase } = await requireUser(req);
    const id = String(req.query.id);

    if (req.method === 'PATCH') {
      const updates: MentorUpdate = {};
      if (req.body && 'available' in req.body) {
        if (typeof req.body.available !== 'boolean') { badRequest(res, 'available must be a boolean'); return; }
        updates.available = req.body.available;
      }
      if (req.body && 'calendly_link' in req.body) { updates.calendly_link = req.body.calendly_link; }
      if (req.body && 'name' in req.body) { updates.name = req.body.name; }

      if (Object.keys(updates).length === 0) { badRequest(res, 'No updatable fields provided'); return; }

      const { data, error } = await supabase.from('mentors').update(updates).eq('id', id).select(MENTOR_COLUMNS).single();
      if (error) { throw error; }
      sendJson(res, 200, { data });
      return;
    }

    if (req.method === 'DELETE') {
      const { error } = await supabase.from('mentors').delete().eq('id', id);
      if (error) { throw error; }
      sendJson(res, 204, null);
      return;
    }

    methodNotAllowed(res, ['PATCH', 'DELETE']);
  } catch (err) {
    sendError(res, err);
  }
}
