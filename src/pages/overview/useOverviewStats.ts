import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { MEMBER_ROLES } from '../../roles';

interface OverviewStats {
  chapterCount: number | null;
  memberCount: number | null;
  newMemberCount: number | null;
}

export function useOverviewStats() {
  const [stats, setStats] = useState<OverviewStats>({ chapterCount: null, memberCount: null, newMemberCount: null });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { count: chapterCount, error: chapterErr } = await supabase
        .from('chapters')
        .select('*', { count: 'exact', head: true });

      const { count: memberCount, error: memberErr } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('role', MEMBER_ROLES);

      if (chapterErr) { console.error('chapters count failed:', chapterErr.message, chapterErr.details, chapterErr.hint); }
      if (memberErr) { console.error('profiles count failed:', memberErr.message, memberErr.details, memberErr.hint); }

      // New members in the last 30 days, for the stat-sub line
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { count: newMemberCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('role', MEMBER_ROLES)
        .gte('created_at', thirtyDaysAgo);

      if (!cancelled) {
        setStats({ chapterCount: chapterCount ?? null, memberCount: memberCount ?? null, newMemberCount: newMemberCount ?? null });
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return stats;
}
