import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { MEMBER_ROLES } from '../../roles';
import type { ImpactEvents } from './metrics';

export function useImpactEvents() {
  const [events, setEvents] = useState<ImpactEvents | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: memberRows, error: memberErr } = await supabase
        .from('profiles')
        .select('created_at')
        .in('role', MEMBER_ROLES);
      if (memberErr) { console.error('members fetch failed:', memberErr.message, memberErr.details, memberErr.hint); }

      const { data: chapterRows, error: chapterErr } = await supabase
        .from('chapters')
        .select('created_at');
      if (chapterErr) { console.error('chapters fetch failed:', chapterErr.message, chapterErr.details, chapterErr.hint); }

      const { data: logs, error: logsErr } = await supabase
        .from('service_logs')
        .select('primary_impact, impact_magnitude, secondary_impact, secondary_impact_magnitude, submitted_at')
        .eq('status', 'approved');
      if (logsErr) { console.error('service_logs (impact) fetch failed:', logsErr.message, logsErr.details, logsErr.hint); }

      const categories: Record<string, { date: string; magnitude: number }[]> = {};
      function addEvent(category: string | null, magnitude: number | null, date: string | null) {
        if (!category || !date) { return; }
        if (!categories[category]) { categories[category] = []; }
        categories[category].push({ date, magnitude: Number(magnitude) || 0 });
      }
      (logs || []).forEach((row) => {
        if (row.primary_impact) { addEvent(row.primary_impact, row.impact_magnitude, row.submitted_at); }
        if (row.secondary_impact) { addEvent(row.secondary_impact, row.secondary_impact_magnitude, row.submitted_at); }
      });

      if (!cancelled) {
        setEvents({
          totalmembers: (memberRows || []).map((r) => ({ date: r.created_at, magnitude: 1 })),
          totalchapters: (chapterRows || []).map((r) => ({ date: r.created_at, magnitude: 1 })),
          categories,
        });
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return events;
}
