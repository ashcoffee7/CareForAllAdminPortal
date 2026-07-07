import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser } from '../_lib/auth';
import { methodNotAllowed, sendError, sendJson } from '../_lib/http';
import { firstQueryValue, parsePageParams } from '../_lib/pagination';

const PROFILE_COLUMNS = 'id, first_name, last_name, role, gender, education_level, date_of_birth, chapter_id, created_at, chapters:chapter_id ( name )';

// GET /api/profiles?role=a,b,c&q=search&page=1&limit=25
// - `role` filters to a comma-separated list of profiles.role values.
// - `q` does an ilike search across first_name/last_name.
// - `page`/`limit`: when present, applies .range() + an exact count
//   (used by the paginated Member Directory table). When absent, returns
//   every matching row unpaginated (used by the demographics aggregates,
//   which need the full matching set to compute percentages).
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { supabase } = await requireUser(req);

    if (req.method !== 'GET') {
      methodNotAllowed(res, ['GET']);
      return;
    }

    let query = supabase.from('profiles').select(PROFILE_COLUMNS, { count: 'exact' });

    const role = firstQueryValue(req, 'role');
    if (role) {
      query = query.in('role', role.split(',').map((r) => r.trim()).filter(Boolean));
    }

    const q = firstQueryValue(req, 'q')?.trim();
    if (q) {
      query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`);
    }

    const createdAfter = firstQueryValue(req, 'createdAfter');
    if (createdAfter) {
      query = query.gte('created_at', createdAfter);
    }

    const hasPaging = firstQueryValue(req, 'page') !== undefined;
    if (hasPaging) {
      const { from, to, page, limit } = parsePageParams(req);
      const { data, error, count } = await query.order('first_name').range(from, to);
      if (error) { throw error; }
      sendJson(res, 200, { data, page, limit, total: count ?? 0 });
      return;
    }

    const { data, error, count } = await query.order('first_name');
    if (error) { throw error; }
    sendJson(res, 200, { data, total: count ?? 0 });
  } catch (err) {
    sendError(res, err);
  }
}
