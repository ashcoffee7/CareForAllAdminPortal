import { useCallback, useEffect, useState } from 'react';
import { api, apiOrToast } from '../../lib/apiClient';
import type { ChapterCheckin, CheckinDeadline } from '../../types/database';

export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';
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

interface EnrichedChaptersResponse {
  enriched: EnrichedChapter[];
  deadlines: Partial<CheckinDeadline>;
  currentYear: number;
}

// The compliance derivation itself now lives server-side in
// api/chapters/enriched.ts -- this hook just fetches the computed view for
// the requested year.
export function useChapterData() {
  const currentYear = new Date().getFullYear();
  const [enriched, setEnriched] = useState<EnrichedChapter[]>([]);
  const [deadlines, setDeadlines] = useState<Partial<CheckinDeadline>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const result = await apiOrToast(
      api.get<EnrichedChaptersResponse>(`/chapters/enriched?year=${currentYear}`),
      'Loading chapters',
      { enriched: [], deadlines: {}, currentYear }
    );

    setEnriched(result.enriched);
    setDeadlines(result.deadlines);
    setLoading(false);
  }, [currentYear]);

  useEffect(() => {
    load();
  }, [load]);

  return { enriched, deadlines, currentYear, loading, reload: load };
}
