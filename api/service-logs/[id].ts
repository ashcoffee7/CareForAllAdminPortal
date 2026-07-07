import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser } from '../_lib/auth';
import { badRequest, methodNotAllowed, sendError, sendJson } from '../_lib/http';

const LOG_COLUMNS = `
  id, user_id, name, org_name, activity_type, hours, status, description,
  submitted_at, reviewed_at, reviewed_by, verify_method, verification_completed,
  verification_completed_at, primary_impact, impact_magnitude, secondary_impact,
  secondary_impact_magnitude,
  profiles:user_id ( id, first_name, last_name, role, chapters:chapter_id ( name ) )
`;

// Only `status` and `verification_completed` are ever accepted here.
// reviewed_by/reviewed_at/verification_completed_at are set server-side by
// the service_logs_review_audit trigger (see
// supabase/migrations/20260706000003_service_log_review_audit_trigger.sql)
// from auth.uid()/now() -- a client can't spoof who reviewed a submission
// or when, because those fields are never read from the request body.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { supabase } = await requireUser(req);
    const id = String(req.query.id);

    if (req.method === 'GET') {
      const { data, error } = await supabase.from('service_logs').select(LOG_COLUMNS).eq('id', id).single();
      if (error) { throw error; }
      sendJson(res, 200, { data });
      return;
    }

    if (req.method === 'PATCH') {
      const updates: { status?: 'pending' | 'approved' | 'rejected'; verification_completed?: boolean } = {};

      if (req.body && 'status' in req.body) {
        if (!['pending', 'approved', 'rejected'].includes(req.body.status)) {
          badRequest(res, 'status must be pending, approved, or rejected');
          return;
        }
        updates.status = req.body.status;
      }

      if (req.body && 'verification_completed' in req.body) {
        if (typeof req.body.verification_completed !== 'boolean') {
          badRequest(res, 'verification_completed must be a boolean');
          return;
        }
        updates.verification_completed = req.body.verification_completed;
      }

      if (Object.keys(updates).length === 0) {
        badRequest(res, 'Provide status and/or verification_completed to update');
        return;
      }

      const { data, error } = await supabase.from('service_logs').update(updates).eq('id', id).select(LOG_COLUMNS).single();
      if (error) { throw error; }
      sendJson(res, 200, { data });
      return;
    }

    if (req.method === 'DELETE') {
      const { error } = await supabase.from('service_logs').delete().eq('id', id);
      if (error) { throw error; }
      sendJson(res, 204, null);
      return;
    }

    methodNotAllowed(res, ['GET', 'PATCH', 'DELETE']);
  } catch (err) {
    sendError(res, err);
  }
}
