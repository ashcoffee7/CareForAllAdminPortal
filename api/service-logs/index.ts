import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser } from '../_lib/auth';
import { badRequest, methodNotAllowed, sendError, sendJson } from '../_lib/http';
import { firstQueryValue, parsePageParams } from '../_lib/pagination';

const LOG_COLUMNS = `
  id, user_id, name, org_name, activity_type, hours, status, description,
  submitted_at, reviewed_at, reviewed_by, verify_method, verification_completed,
  verification_completed_at, primary_impact, impact_magnitude, secondary_impact,
  secondary_impact_magnitude,
  profiles:user_id ( id, first_name, last_name, role, chapters:chapter_id ( name ) )
`;

// GET /api/service-logs supports the filter shapes every admin-portal
// list/aggregate view needs, so each caller (submissions queue,
// verification queue, leaderboards, hours chart, chapter project counts)
// can ask for exactly its slice server-side instead of pulling the whole
// table and filtering/joining in the browser.
//
//   status=pending|approved|rejected
//   hasVerifyMethod=true            -- verify_method is not null
//   verificationCompleted=true|false
//   activityTypeContains=project    -- ilike '%project%'
//   submittedAfter / submittedBefore (ISO date, half-open range)
//   page/limit                       -- when present, paginates + counts
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { supabase } = await requireUser(req);

    if (req.method === 'GET') {
      let query = supabase.from('service_logs').select(LOG_COLUMNS, { count: 'exact' });

      const status = firstQueryValue(req, 'status');
      if (status) { query = query.eq('status', status as 'pending' | 'approved' | 'rejected'); }

      if (firstQueryValue(req, 'hasVerifyMethod') === 'true') {
        query = query.not('verify_method', 'is', null);
      }

      const verificationCompleted = firstQueryValue(req, 'verificationCompleted');
      if (verificationCompleted === 'true' || verificationCompleted === 'false') {
        query = query.eq('verification_completed', verificationCompleted === 'true');
      }

      const activityTypeContains = firstQueryValue(req, 'activityTypeContains');
      if (activityTypeContains) { query = query.ilike('activity_type', `%${activityTypeContains}%`); }

      const submittedAfter = firstQueryValue(req, 'submittedAfter');
      if (submittedAfter) { query = query.gte('submitted_at', submittedAfter); }

      const submittedBefore = firstQueryValue(req, 'submittedBefore');
      if (submittedBefore) { query = query.lt('submitted_at', submittedBefore); }

      query = query.order('submitted_at', { ascending: false });

      const hasPaging = firstQueryValue(req, 'page') !== undefined;
      if (hasPaging) {
        const { from, to, page, limit } = parsePageParams(req);
        const { data, error, count } = await query.range(from, to);
        if (error) { throw error; }
        sendJson(res, 200, { data, page, limit, total: count ?? 0 });
        return;
      }

      const { data, error, count } = await query;
      if (error) { throw error; }
      sendJson(res, 200, { data, total: count ?? 0 });
      return;
    }

    if (req.method === 'POST') {
      const body = req.body ?? {};
      if (!body.activity_type || typeof body.hours !== 'number') {
        badRequest(res, 'activity_type and hours are required');
        return;
      }

      const { data, error } = await supabase
        .from('service_logs')
        .insert({
          user_id: body.user_id ?? null,
          name: body.name ?? null,
          org_name: body.org_name ?? null,
          activity_type: body.activity_type,
          hours: body.hours,
          description: body.description ?? null,
          verify_method: body.verify_method ?? null,
          primary_impact: body.primary_impact ?? null,
          impact_magnitude: body.impact_magnitude ?? null,
          secondary_impact: body.secondary_impact ?? null,
          secondary_impact_magnitude: body.secondary_impact_magnitude ?? null,
        })
        .select(LOG_COLUMNS)
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
