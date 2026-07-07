import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser } from '../_lib/auth';
import { methodNotAllowed, sendError, sendJson } from '../_lib/http';
import { firstQueryValue } from '../_lib/pagination';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;
type Quarter = (typeof QUARTERS)[number];
type QuarterStatus = 'done' | 'overdue' | 'pending';

// GET /api/chapters/enriched?year=2026
// Ported as-is from the old useChapterData.ts client hook: joins chapters,
// profiles, chapter_checkins, and approved "project" service_logs into a
// per-chapter compliance view. Runs server-side now, but the derivation
// rules (2+ projects/year, all 4 quarterly check-ins) are unchanged --
// still a computed view, not a real `chapters_enriched` table.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { supabase } = await requireUser(req);

    if (req.method !== 'GET') {
      methodNotAllowed(res, ['GET']);
      return;
    }

    const yearParam = firstQueryValue(req, 'year');
    const currentYear = yearParam ? Number(yearParam) : new Date().getFullYear();

    const [chaptersRes, profilesRes, checkinsRes, projectLogsRes, deadlinesRes] = await Promise.all([
      supabase.from('chapters').select('id, name, created_at').order('name'),
      supabase.from('profiles').select('id, first_name, last_name, chapter_id, role'),
      supabase.from('chapter_checkins').select('id, chapter_name, quarter, activities, member_count, challenges, submitted_at').order('submitted_at', { ascending: false }),
      supabase.from('service_logs').select('user_id, activity_type, profiles:user_id ( chapter_id )').eq('status', 'approved').ilike('activity_type', '%project%'),
      supabase.from('checkin_deadlines').select('year, q1, q2, q3, q4').eq('year', currentYear).maybeSingle(),
    ]);

    if (chaptersRes.error) { throw chaptersRes.error; }
    if (profilesRes.error) { throw profilesRes.error; }
    if (checkinsRes.error) { throw checkinsRes.error; }
    if (projectLogsRes.error) { throw projectLogsRes.error; }
    if (deadlinesRes.error) { throw deadlinesRes.error; }

    const chapters = chaptersRes.data ?? [];
    const profiles = profilesRes.data ?? [];
    const checkins = checkinsRes.data ?? [];
    const projectLogs = projectLogsRes.data ?? [];
    const deadlines: { q1?: string | null; q2?: string | null; q3?: string | null; q4?: string | null } = deadlinesRes.data ?? {};

    const memberCountByChapterId: Record<string, number> = {};
    const leadByChapterId: Record<string, string> = {};
    profiles.forEach((p) => {
      if (!p.chapter_id) { return; }
      memberCountByChapterId[p.chapter_id] = (memberCountByChapterId[p.chapter_id] || 0) + 1;
      if (p.role === 'chapter_lead' && !leadByChapterId[p.chapter_id]) {
        leadByChapterId[p.chapter_id] = ((p.first_name || '') + ' ' + (p.last_name || '')).trim() || '-';
      }
    });

    const projectCountByChapterId: Record<string, number> = {};
    projectLogs.forEach((log) => {
      const chapterId = log.profiles?.chapter_id;
      if (chapterId) { projectCountByChapterId[chapterId] = (projectCountByChapterId[chapterId] || 0) + 1; }
    });

    const dueDateByQuarter: Record<Quarter, string | null | undefined> = {
      Q1: deadlines.q1, Q2: deadlines.q2, Q3: deadlines.q3, Q4: deadlines.q4,
    };

    const checkinsByChapterName: Record<string, typeof checkins> = {};
    checkins.forEach((c) => {
      const key = (c.chapter_name || '').trim();
      if (!checkinsByChapterName[key]) { checkinsByChapterName[key] = []; }
      checkinsByChapterName[key].push(c);
    });

    const today = new Date();

    const enriched = chapters.map((ch) => {
      const chapterCheckins = checkinsByChapterName[ch.name] || [];

      const quarterStatuses: QuarterStatus[] = QUARTERS.map((q) => {
        const submitted = chapterCheckins.find(
          (c) => c.quarter === q && new Date(c.submitted_at).getFullYear() === currentYear
        );
        if (submitted) { return 'done'; }

        const dueDate = dueDateByQuarter[q];
        if (dueDate && new Date(dueDate) < today) { return 'overdue'; }
        return 'pending';
      });

      const allCheckinsIn = quarterStatuses.every((s) => s === 'done');
      const projectCount = projectCountByChapterId[ch.id] || 0;

      return {
        id: ch.id,
        name: ch.name,
        createdAt: ch.created_at,
        lead: leadByChapterId[ch.id] || '-',
        memberCount: memberCountByChapterId[ch.id] || 0,
        projectCount,
        quarterStatuses,
        checkins: chapterCheckins,
        compliant: projectCount >= 2 && allCheckinsIn,
      };
    });

    sendJson(res, 200, { enriched, deadlines, currentYear });
  } catch (err) {
    sendError(res, err);
  }
}
