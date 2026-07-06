import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Chapter, ChapterCheckin, CheckinDeadline } from '../../types/database';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;
export type Quarter = (typeof QUARTERS)[number];
export type QuarterStatus = 'done' | 'overdue' | 'pending';

export interface EnrichedChapter {
  id: string;
  name: string;
  createdAt: string;
  lead: string;
  memberCount: number;
  projectCount: number;
  quarterStatuses: QuarterStatus[];
  checkins: ChapterCheckin[];
  compliant: boolean;
}

interface MinimalProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  chapter_id: string | null;
  role: string;
}

async function fetchAllChapters(): Promise<Chapter[]> {
  const { data, error } = await supabase.from('chapters').select('id, name, created_at').order('name');
  if (error) { console.error('chapters fetch failed:', error.message, error.details, error.hint); return []; }
  return data;
}

async function fetchAllProfiles(): Promise<MinimalProfile[]> {
  const { data, error } = await supabase.from('profiles').select('id, first_name, last_name, chapter_id, role');
  if (error) { console.error('profiles fetch failed:', error.message, error.details, error.hint); return []; }
  return data;
}

async function fetchAllCheckins(): Promise<ChapterCheckin[]> {
  const { data, error } = await supabase
    .from('chapter_checkins')
    .select('id, chapter_name, quarter, activities, member_count, challenges, submitted_at')
    .order('submitted_at', { ascending: false });
  if (error) { console.error('chapter_checkins fetch failed:', error.message, error.details, error.hint); return []; }
  return data;
}

async function fetchDeadlines(year: number): Promise<Partial<CheckinDeadline>> {
  const { data, error } = await supabase
    .from('checkin_deadlines')
    .select('year, q1, q2, q3, q4')
    .eq('year', year)
    .maybeSingle();
  if (error) { console.error('checkin_deadlines fetch failed:', error.message, error.details, error.hint); return {}; }
  return data || {};
}

// "Projects (2+/yr)" has no dedicated table. This derives a per-chapter
// project count from approved service_logs whose activity_type looks like
// a project, joined through profiles.chapter_id (service_logs has no
// direct link to chapters or profiles).
async function fetchProjectLogs(): Promise<{ user_id: string | null; activity_type: string }[]> {
  const { data, error } = await supabase
    .from('service_logs')
    .select('user_id, activity_type')
    .eq('status', 'approved')
    .ilike('activity_type', '%project%');
  if (error) { console.error('service_logs (projects) fetch failed:', error.message, error.details, error.hint); return []; }
  return data;
}

function buildEnrichedChapters(
  chapters: Chapter[],
  profiles: MinimalProfile[],
  checkins: ChapterCheckin[],
  projectLogs: { user_id: string | null; activity_type: string }[],
  deadlines: Partial<CheckinDeadline>,
  currentYear: number
): EnrichedChapter[] {
  const memberCountByChapterId: Record<string, number> = {};
  const leadByChapterId: Record<string, string> = {};
  profiles.forEach((p) => {
    if (!p.chapter_id) { return; }
    memberCountByChapterId[p.chapter_id] = (memberCountByChapterId[p.chapter_id] || 0) + 1;
    if (p.role === 'chapter_lead' && !leadByChapterId[p.chapter_id]) {
      leadByChapterId[p.chapter_id] = ((p.first_name || '') + ' ' + (p.last_name || '')).trim() || '-';
    }
  });

  const profileById: Record<string, MinimalProfile> = {};
  profiles.forEach((p) => { profileById[p.id] = p; });

  const projectCountByChapterId: Record<string, number> = {};
  projectLogs.forEach((log) => {
    const p = log.user_id ? profileById[log.user_id] : null;
    if (p && p.chapter_id) {
      projectCountByChapterId[p.chapter_id] = (projectCountByChapterId[p.chapter_id] || 0) + 1;
    }
  });

  const dueDateByQuarter: Record<Quarter, string | null | undefined> = {
    Q1: deadlines.q1, Q2: deadlines.q2, Q3: deadlines.q3, Q4: deadlines.q4,
  };

  // chapter_checkins.chapter_name is free text, not a foreign key to
  // chapters.id -- matched here by exact name. chapter_checkins also has
  // no year column, so the year a check-in "counts for" is derived from
  // submitted_at -- a reasonable proxy, but not exact.
  const checkinsByChapterName: Record<string, ChapterCheckin[]> = {};
  checkins.forEach((c) => {
    const key = (c.chapter_name || '').trim();
    if (!checkinsByChapterName[key]) { checkinsByChapterName[key] = []; }
    checkinsByChapterName[key].push(c);
  });

  const today = new Date();

  return chapters.map((ch) => {
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
}

export function useChapterData() {
  const currentYear = new Date().getFullYear();
  const [enriched, setEnriched] = useState<EnrichedChapter[]>([]);
  const [deadlines, setDeadlines] = useState<Partial<CheckinDeadline>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [chapters, profiles, checkins, projectLogs, deadlinesRow] = await Promise.all([
      fetchAllChapters(),
      fetchAllProfiles(),
      fetchAllCheckins(),
      fetchProjectLogs(),
      fetchDeadlines(currentYear),
    ]);

    setDeadlines(deadlinesRow);
    setEnriched(buildEnrichedChapters(chapters, profiles, checkins, projectLogs, deadlinesRow, currentYear));
    setLoading(false);
  }, [currentYear]);

  useEffect(() => {
    load();
  }, [load]);

  return { enriched, deadlines, currentYear, loading, reload: load };
}
