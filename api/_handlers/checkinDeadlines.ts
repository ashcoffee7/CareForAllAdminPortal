import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { RequestContext } from '../_lib/auth';
import { badRequest, methodNotAllowed, sendJson } from '../_lib/http';
import { firstQueryValue } from '../_lib/pagination';

const QUARTERS = ['q1', 'q2', 'q3', 'q4'] as const;

interface CheckinDeadlineUpsert {
  year: number;
  q1: string | null;
  q2: string | null;
  q3: string | null;
  q4: string | null;
}

// GET /api/checkin-deadlines?year=2026
// PUT  /api/checkin-deadlines   { year, q1, q2, q3, q4 }  -- upserts on year
export async function checkinDeadlines(req: VercelRequest, res: VercelResponse, ctx: RequestContext) {
  const { supabase } = ctx;

  if (req.method === 'GET') {
    const yearParam = firstQueryValue(req, 'year');
    const year = yearParam ? Number(yearParam) : new Date().getFullYear();
    if (!Number.isFinite(year)) { badRequest(res, 'year must be a number'); return; }

    const { data, error } = await supabase
      .from('checkin_deadlines')
      .select('year, q1, q2, q3, q4, updated_at')
      .eq('year', year)
      .maybeSingle();
    if (error) { throw error; }
    sendJson(res, 200, { data });
    return;
  }

  if (req.method === 'PUT') {
    const body = req.body ?? {};
    const year = Number(body.year);
    if (!Number.isFinite(year)) { badRequest(res, 'year is required'); return; }

    const row: CheckinDeadlineUpsert = { year, q1: null, q2: null, q3: null, q4: null };
    for (const q of QUARTERS) { row[q] = body[q] ?? null; }

    const { data, error } = await supabase
      .from('checkin_deadlines')
      .upsert(row, { onConflict: 'year' })
      .select('year, q1, q2, q3, q4, updated_at')
      .single();
    if (error) { throw error; }
    sendJson(res, 200, { data });
    return;
  }

  methodNotAllowed(res, ['GET', 'PUT']);
}
