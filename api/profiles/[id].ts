import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser } from '../_lib/auth';
import { methodNotAllowed, sendError, sendJson } from '../_lib/http';
import type { Database } from '../../src/types/database.generated';

const PROFILE_COLUMNS = 'id, first_name, last_name, role, gender, education_level, date_of_birth, chapter_id, created_at, chapters:chapter_id ( name )';

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

const PATCHABLE_FIELDS = ['first_name', 'last_name', 'role', 'gender', 'education_level', 'date_of_birth', 'chapter_id'] as const satisfies readonly (keyof ProfileUpdate)[];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { supabase } = await requireUser(req);
    const id = String(req.query.id);

    if (req.method === 'GET') {
      const { data, error } = await supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', id).single();
      if (error) { throw error; }
      sendJson(res, 200, { data });
      return;
    }

    if (req.method === 'PATCH') {
      const updates: ProfileUpdate = {};
      for (const field of PATCHABLE_FIELDS) {
        if (req.body && Object.prototype.hasOwnProperty.call(req.body, field)) {
          updates[field] = req.body[field];
        }
      }

      const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select(PROFILE_COLUMNS).single();
      if (error) { throw error; }
      sendJson(res, 200, { data });
      return;
    }

    methodNotAllowed(res, ['GET', 'PATCH']);
  } catch (err) {
    sendError(res, err);
  }
}
