import { useEffect, useState } from 'react';
import { api, apiOrToast } from '../../lib/apiClient';
import type { ImpactEvents } from './metrics';

export function useImpactEvents() {
  const [events, setEvents] = useState<ImpactEvents | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const result = await apiOrToast(
        api.get<ImpactEvents>('/impact/events'),
        'Loading impact measurables',
        { totalmembers: [], totalchapters: [], categories: {} }
      );
      if (!cancelled) { setEvents(result); }
    })();

    return () => { cancelled = true; };
  }, []);

  return events;
}
